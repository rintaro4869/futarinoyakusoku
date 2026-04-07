import { useCallback, useRef, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Animated,
  RefreshControl,
} from 'react-native'
import { useRouter, useFocusEffect } from 'expo-router'
import * as Haptics from 'expo-haptics'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../constants/colors'
import { TabRibbonHeader } from '../../components/TabRibbonHeader'
import { ConnectionNoticeBar } from '../../components/ConnectionNoticeBar'
import { getRules, createEvent, archiveRule, Rule } from '../../lib/api'
import { useAuthStore } from '../../lib/store'
import { getLocalRules, createLocalEvent, archiveLocalRule } from '../../lib/local-mode'
import { getRuleModeLabel, getRuleScheduleSummary, CATEGORY_I18N_KEY, RuleCategory } from '../../lib/rules'
import { t } from '../../lib/i18n'

const DEBOUNCE_MS = 3000

const TEMPLATE_DATA: Array<{ id: string; titleKey: string; mode: 'routine'; descKey: string; category: RuleCategory }> = [
  { id: 't3', titleKey: 'promises.tpl_t3_title', mode: 'routine', descKey: 'promises.tpl_t3_desc', category: '連絡・共有' },
  { id: 't5', titleKey: 'promises.tpl_t5_title', mode: 'routine', descKey: 'promises.tpl_t5_desc', category: '子育て' },
  { id: 't7', titleKey: 'promises.tpl_t7_title', mode: 'routine', descKey: 'promises.tpl_t7_desc', category: 'ふりかえり' },
]

export default function PromisesTab() {
  const router = useRouter()
  const coupleId = useAuthStore((s) => s.coupleId)
  const userId = useAuthStore((s) => s.userId)
  const hydrated = useAuthStore((s) => s.hydrated)
  const [rules, setRules] = useState<Rule[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [recording, setRecording] = useState<Record<string, boolean>>({})
  const [success, setSuccess] = useState<Record<string, string>>({})
  const lastTap = useRef<Record<string, number>>({})
  const fadeAnims = useRef<Record<string, Animated.Value>>({})
  const hasLoadedOnce = useRef(false)
  const scrollRef = useRef<ScrollView>(null)

  const load = useCallback(async (mode: 'initial' | 'refresh' | 'silent' = 'initial') => {
    if (!hydrated) return
    if (mode === 'refresh') setRefreshing(true)
    else if (mode === 'initial') setLoading(true)
    setError(null)
    try {
      const items = coupleId
        ? (await getRules(coupleId)).items
        : await getLocalRules(userId)
      setRules(items.filter((r) => r.active))
    } catch (e: any) {
      setError(e.message ?? t('common.error_network'))
    } finally {
      if (mode === 'initial') setLoading(false)
      setRefreshing(false)
    }
  }, [coupleId, userId, hydrated])

  useFocusEffect(
    useCallback(() => {
      if (!hydrated) return
      if (!hasLoadedOnce.current) {
        hasLoadedOnce.current = true
        load('initial')
      } else {
        scrollRef.current?.scrollTo({ y: 0, animated: false })
        load('silent')
      }
    }, [load, hydrated])
  )

  function getFadeAnim(key: string) {
    if (!fadeAnims.current[key]) {
      fadeAnims.current[key] = new Animated.Value(0)
    }
    return fadeAnims.current[key]
  }

  function showSuccess(key: string, msg: string) {
    setSuccess((prev) => ({ ...prev, [key]: msg }))
    const anim = getFadeAnim(key)
    anim.setValue(1)
    setTimeout(() => {
      Animated.timing(anim, { toValue: 0, duration: 500, useNativeDriver: true }).start(() => {
        setSuccess((prev) => { const next = { ...prev }; delete next[key]; return next })
      })
    }, 2000)
  }

  async function handleRecord(rule: Rule) {
    if (!userId) return
    const key = rule.id
    const now = Date.now()
    if (lastTap.current[key] && now - lastTap.current[key] < DEBOUNCE_MS) return
    lastTap.current[key] = now
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    setRecording((prev) => ({ ...prev, [key]: true }))
    try {
      if (coupleId) {
        await createEvent(rule.id, {})
      } else {
        await createLocalEvent(userId, rule.id)
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      showSuccess(key, rule.mode === 'adhoc' ? t('promises.record_success_adhoc') : t('promises.record_success_routine'))
    } catch (e: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      Alert.alert(t('common.error'), e.message ?? t('common.error_network'))
    } finally {
      setRecording((prev) => ({ ...prev, [key]: false }))
    }
  }

  function handleEdit(rule: Rule) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    router.push(
      `/edit-rule?id=${rule.id}&title=${encodeURIComponent(rule.title)}&mode=${rule.mode}&objective=${encodeURIComponent(rule.objective ?? '')}&category=${encodeURIComponent(rule.category ?? '')}&point_value=${rule.point_value}&start_date=${encodeURIComponent(rule.start_date ?? '')}&recurrence_type=${encodeURIComponent(rule.recurrence_type ?? '')}&recurrence_interval=${rule.recurrence_interval ?? 1}&days_of_week=${encodeURIComponent((rule.days_of_week ?? []).join(','))}&day_of_month=${rule.day_of_month ?? ''}&time_of_day=${encodeURIComponent(rule.time_of_day ?? '')}&reminder_enabled=${rule.reminder_enabled}&reminder_time=${encodeURIComponent(rule.reminder_time ?? '')}&assignee=${rule.assignee ?? 'both'}&recorder=${rule.recorder ?? 'self'}`
    )
  }

  function handleDeleteConfirm(rule: Rule) {
    Alert.alert(
      t('rule.delete_title'),
      t('rule.delete_message', { title: rule.title }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('rule.delete_confirm'),
          style: 'destructive',
          onPress: async () => {
            try {
              if (coupleId) {
                await archiveRule(rule.id)
              } else {
                await archiveLocalRule(userId, rule.id)
              }
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
              setRules((prev) => prev.filter((r) => r.id !== rule.id))
            } catch (e: any) {
              Alert.alert(t('common.error'), e.message ?? t('common.error_network'))
            }
          },
        },
      ],
    )
  }

  const filteredRules = rules.filter((r) => r.mode === 'routine')

  // 記録ボタンを表示すべきか：recorder設定と現在ユーザーの担当者ロールで判断
  function canRecord(rule: Rule): boolean {
    const isCreator = rule.creator_user_id === userId
    // assignee = 'self' → creator が担当者
    // assignee = 'partner' → creator でない方が担当者
    // assignee = 'both' → 両方
    const isAssignee =
      rule.assignee === 'both'
        ? true
        : rule.assignee === 'self'
        ? isCreator
        : !isCreator
    // recorder = 'self' → 担当者本人が記録
    // recorder = 'partner' → 担当者でない方が記録
    return rule.recorder === 'self' ? isAssignee : !isAssignee
  }

  // 担当者ラベル（カード表示用）
  function assigneeLabel(rule: Rule): string {
    if (rule.assignee === 'both') return t('rule.assignee_both')
    const isCreator = rule.creator_user_id === userId
    if (rule.assignee === 'self') return isCreator ? t('rule.assignee_self') : t('rule.assignee_partner')
    return isCreator ? t('rule.assignee_partner') : t('rule.assignee_self')
  }

  // セクション分け
  function getOwner(rule: Rule): 'mine' | 'partner' | 'shared' {
    if (rule.assignee === 'both') return 'shared'
    const isCreator = rule.creator_user_id === userId
    const myRule = (rule.assignee === 'self' && isCreator) || (rule.assignee === 'partner' && !isCreator)
    return myRule ? 'mine' : 'partner'
  }

  const myRules = filteredRules.filter((r) => getOwner(r) === 'mine')
  const partnerRules = filteredRules.filter((r) => getOwner(r) === 'partner')
  const sharedRules = filteredRules.filter((r) => getOwner(r) === 'shared')
  const sections = [
    { label: t('rule.assignee_self'), items: myRules },
    { label: t('rule.assignee_partner'), items: partnerRules },
    { label: t('rule.assignee_both'), items: sharedRules },
  ].filter((section) => section.items.length > 0)

  if (!hydrated || loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.brand} />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <TabRibbonHeader
        title={t('promises.title')}
        rightSlot={
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/create-rule') }}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={16} color={Colors.brandDark} />
            <Text style={styles.addBtnText}>{t('common.add')}</Text>
          </TouchableOpacity>
        }
      />

      {hydrated && !coupleId ? (
        <ConnectionNoticeBar onPress={() => router.push('/pair')} />
      ) : null}


      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load('refresh')} tintColor={Colors.brand} />}
      >
        {error && (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={() => load()} style={{ marginTop: 8 }}>
              <Text style={styles.retryText}>{t('common.retry')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Empty state with templates */}
        {!error && rules.length === 0 && (
          <EmptyState
            onCreateCustom={() => router.push('/create-rule')}
            onSelectTemplate={(tpl) => {
              router.push(`/create-rule?title=${encodeURIComponent(tpl.title)}&mode=${tpl.mode}`)
            }}
          />
        )}

        {/* Filter no-match */}
        {rules.length > 0 && filteredRules.length === 0 && (
          <View style={styles.emptyFilter}>
            <Text style={styles.emptyFilterText}>
              {t('promises.empty_routine')}
            </Text>
            <TouchableOpacity
              style={styles.emptyFilterBtn}
              onPress={() => router.push('/create-rule')}
              activeOpacity={0.85}
            >
              <Text style={styles.emptyFilterBtnText}>{t('promises.create')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Rules: セクション別表示 */}
        {sections.map(({ label, items }, index) => (
            <View key={label}>
              {sections.length > 1 && (
                <Text style={[styles.sectionHeader, index === 0 && styles.sectionHeaderFirst]}>{label}</Text>
              )}
              {items.map((rule) => (
                <PromiseCard
                  key={rule.id}
                  rule={rule}
                  isRecording={recording[rule.id] ?? false}
                  successMsg={success[rule.id]}
                  fadeAnim={getFadeAnim(rule.id)}
                  canRecord={canRecord(rule)}
                  recorderLabel={assigneeLabel(rule)}
                  onRecord={() => handleRecord(rule)}
                  onEdit={() => handleEdit(rule)}
                  onDelete={() => handleDeleteConfirm(rule)}
                />
              ))}
            </View>
          ))}

      </ScrollView>
    </View>
  )
}

// ─── プロミスカード ────────────────────────────────────────────

function PromiseCard({
  rule, isRecording, successMsg, fadeAnim, canRecord, recorderLabel, onRecord, onEdit, onDelete,
}: {
  rule: Rule
  isRecording: boolean
  successMsg: string | undefined
  fadeAnim: Animated.Value
  canRecord: boolean
  recorderLabel: string
  onRecord: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const isRoutine = rule.mode === 'routine'
  const accentColor = isRoutine ? Colors.orange : Colors.brand
  const accentLight = isRoutine ? Colors.orangeLighter : Colors.brandLighter
  const accentDark = isRoutine ? Colors.orangeDark : Colors.brandDark
  const pts = Math.max(rule.point_value ?? 10, 10)
  const ctaLabel = isRoutine
    ? t('promises.record_routine', { n: pts })
    : t('promises.record_adhoc', { n: pts })

  return (
    <View style={styles.promiseCard}>
      <View style={[styles.accentBar, { backgroundColor: accentColor }]} />
      <View style={styles.cardBody}>
        {/* Title row */}
        <View style={styles.titleRow}>
          <Text style={styles.promiseTitle} numberOfLines={2}>{rule.title}</Text>
          <View style={styles.cardActions}>
            <TouchableOpacity
              onPress={onEdit}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.editBtn}
            >
              <Ionicons name="create-outline" size={18} color={Colors.textTertiary} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onDelete}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.editBtn}
            >
              <Ionicons name="trash-outline" size={18} color={Colors.error} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Meta row */}
        <View style={styles.metaRow}>
          <View style={[styles.modeChip, { backgroundColor: accentLight }]}>
            <Text style={[styles.modeChipText, { color: accentDark }]}>
              {getRuleModeLabel(rule.mode, t)}
            </Text>
          </View>
          {rule.category ? (
            <View style={styles.categoryChip}>
              <Text style={styles.categoryChipText}>{rule.category}</Text>
            </View>
          ) : null}
          {rule.reminder_enabled && rule.reminder_time ? (
            <View style={styles.reminderChip}>
              <Ionicons name="notifications-outline" size={12} color={Colors.brandDark} />
              <Text style={styles.reminderChipText}>{rule.reminder_time}</Text>
            </View>
          ) : null}
          <View style={[styles.pointPill, { backgroundColor: accentColor + '15' }]}>
            <Text style={[styles.pointPillText, { color: accentDark }]}>+{pts}pt</Text>
          </View>
        </View>

        {/* Record CTA */}
        {canRecord ? (
          <TouchableOpacity
            style={[
              styles.recordBtn,
              { backgroundColor: accentColor },
              isRecording && styles.recordBtnLoading,
            ]}
            onPress={onRecord}
            disabled={isRecording}
            activeOpacity={0.85}
          >
            {isRecording ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.recordBtnText}>{ctaLabel}</Text>
            )}
          </TouchableOpacity>
        ) : (
          <View style={styles.waitingBanner}>
            <Text style={styles.waitingText}>{t('promises.waiting_for_partner')}</Text>
          </View>
        )}

        {/* Success banner */}
        {successMsg ? (
          <Animated.View style={[styles.successBanner, { opacity: fadeAnim }]}>
            <Text style={styles.successText}>{"✓"} {successMsg}</Text>
          </Animated.View>
        ) : null}
      </View>
    </View>
  )
}

// ─── 空状態 ────────────────────────────────────────────────────

function EmptyState({
  onCreateCustom,
  onSelectTemplate,
}: {
  onCreateCustom: () => void
  onSelectTemplate: (tpl: { title: string; mode: 'routine' | 'adhoc' }) => void
}) {
  return (
    <View>
      <View style={styles.emptyHero}>
        <Text style={styles.emptyHeroIcon}>📋</Text>
        <Text style={styles.emptyHeroTitle}>{t('promises.empty_title')}</Text>
        <Text style={styles.emptyHeroDesc}>{t('promises.empty_desc')}</Text>
        <TouchableOpacity style={styles.emptyHeroBtn} onPress={onCreateCustom} activeOpacity={0.85}>
          <Text style={styles.emptyHeroBtnText}>{t('promises.empty_cta')}</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.templateHeading}>{t('promises.template_heading')}</Text>

      {TEMPLATE_DATA.map((tpl) => {
        const title = t(tpl.titleKey)
        return (
          <TouchableOpacity
            key={tpl.id}
            style={[
              styles.templateCard,
              tpl.mode === 'routine' ? styles.templateCardRoutine : styles.templateCardAdhoc,
            ]}
            onPress={() => onSelectTemplate({ title, mode: tpl.mode })}
            activeOpacity={0.75}
          >
            <View style={styles.templateCardRow}>
              <View style={styles.templateCardLeft}>
                <Text style={styles.templateCategory}>{t(CATEGORY_I18N_KEY[tpl.category])}</Text>
                <Text style={styles.templateTitle}>{title}</Text>
                <Text style={styles.templateDesc}>{t(tpl.descKey)}</Text>
              </View>
              <View style={[
                styles.templateModeChip,
                { backgroundColor: tpl.mode === 'routine' ? Colors.orangeLighter : Colors.brandLighter },
              ]}>
                <Text style={[
                  styles.templateModeText,
                  { color: tpl.mode === 'routine' ? Colors.orangeDark : Colors.brandDark },
                ]}>
                  {getRuleModeLabel(tpl.mode, t)}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        )
      })}
    </View>
  )
}

// ─── スタイル ─────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundSecondary,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
  },

  addBtn: {
    backgroundColor: Colors.surfaceBrand,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: Colors.brandLight + '35',
  },
  addBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.brandDark,
  },

  // Segment filter
  segmentWrap: {
    backgroundColor: Colors.background,
    paddingHorizontal: 16,
    paddingBottom: 12,
    paddingTop: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceMuted,
    borderRadius: 14,
    padding: 4,
  },
  segItem: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: 10,
  },
  segItemActive: {
    backgroundColor: Colors.surfaceElevated,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  segText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  segTextActive: {
    color: Colors.brand,
  },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  // Error
  errorCard: {
    backgroundColor: Colors.errorLight,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  errorText: { fontSize: 14, color: Colors.error },
  retryText: { fontSize: 13, color: Colors.brand, fontWeight: '600' },

  // Promise card
  promiseCard: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 18,
    marginBottom: 10,
    flexDirection: 'row',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.borderLight,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  accentBar: {
    width: 4,
  },
  cardBody: {
    flex: 1,
    padding: 14,
    paddingLeft: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  promiseTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    lineHeight: 21,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 6,
  },
  editBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
    alignItems: 'center',
  },
  modeChip: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  modeChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  categoryChip: {
    backgroundColor: Colors.surfaceMuted,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  categoryChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  reminderChip: {
    backgroundColor: Colors.surfaceBrand,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reminderChipText: {
    fontSize: 11,
    color: Colors.brandDark,
    fontWeight: '700',
  },
  pointPill: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  pointPillText: {
    fontSize: 11,
    fontWeight: '800',
  },

  // Record button
  recordBtn: {
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  recordBtnLoading: {
    opacity: 0.7,
  },
  recordBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },

  // Success
  successBanner: {
    backgroundColor: Colors.successLight,
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
    alignItems: 'center',
  },
  successText: {
    color: Colors.success,
    fontSize: 13,
    fontWeight: '600',
  },

  // Section header
  sectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 20,
    marginBottom: 8,
    paddingLeft: 2,
  },
  sectionHeaderFirst: {
    marginTop: 0,
  },
  waitingBanner: {
    marginTop: 10,
    backgroundColor: Colors.surfaceMuted,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  waitingText: {
    fontSize: 13,
    color: Colors.textTertiary,
  },

  // Empty filter
  emptyFilter: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginTop: 8,
  },
  emptyFilterText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 14,
    textAlign: 'center',
  },
  emptyFilterBtn: {
    backgroundColor: Colors.brand,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 11,
  },
  emptyFilterBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },

  // Empty hero
  emptyHero: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 3,
  },
  emptyHeroIcon: { fontSize: 44, marginBottom: 12 },
  emptyHeroTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  emptyHeroDesc: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  emptyHeroBtn: {
    backgroundColor: Colors.brand,
    borderRadius: 14,
    paddingHorizontal: 28,
    paddingVertical: 13,
    shadowColor: Colors.brand,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  emptyHeroBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },

  // Templates
  templateHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 10,
  },
  templateCard: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 18,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  templateCardRoutine: {
    borderColor: Colors.orangeLight,
  },
  templateCardAdhoc: {
    borderColor: Colors.brandLighter,
  },
  templateCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  templateCardLeft: {
    flex: 1,
  },
  templateCategory: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  templateTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 3,
    lineHeight: 20,
  },
  templateDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 17,
  },
  templateModeChip: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  templateModeText: {
    fontSize: 11,
    fontWeight: '700',
  },
})
