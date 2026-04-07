import { useEffect, useState, useRef, useCallback } from 'react'
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
import { useRouter } from 'expo-router'
import * as Haptics from 'expo-haptics'
import { Colors } from '../../constants/colors'
import { getRules, createEvent, archiveRule, Rule } from '../../lib/api'
import { useAuthStore } from '../../lib/store'
import { getRuleModeLabel } from '../../lib/rules'
import { t } from '../../lib/i18n'

const DEBOUNCE_MS = 3000

function getRuleCta(rule: Rule) {
  const pts = Math.max(rule.point_value ?? 10, 10)
  if (rule.mode === 'adhoc') {
    return {
      label: t('calendar.record_adhoc', { n: pts }),
      sub: t('promises.record_adhoc_sub'),
      successMsg: t('promises.record_success_adhoc'),
    }
  }
  return {
    label: t('calendar.record_routine', { n: pts }),
    sub: t('promises.record_routine_sub'),
    successMsg: t('promises.record_success_routine'),
  }
}

export default function EventsScreen() {
  const router = useRouter()
  const coupleId = useAuthStore((s) => s.coupleId)
  const userId = useAuthStore((s) => s.userId)
  const [rules, setRules] = useState<Rule[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [recording, setRecording] = useState<Record<string, boolean>>({})
  const [success, setSuccess] = useState<Record<string, string>>({})
  const lastTap = useRef<Record<string, number>>({})
  const fadeAnims = useRef<Record<string, Animated.Value>>({})

  const load = useCallback(async (isRefresh = false) => {
    if (!coupleId) return
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    setError(null)
    try {
      const data = await getRules(coupleId)
      setRules(data.items.filter((r) => r.active))
    } catch (e: any) {
      setError(e.message ?? t('common.error_network'))
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [coupleId])

  useEffect(() => {
    load()
  }, [load])

  function getFadeAnim(key: string) {
    if (!fadeAnims.current[key]) {
      fadeAnims.current[key] = new Animated.Value(0)
    }
    return fadeAnims.current[key]
  }

  function showSuccess(key: string, label: string) {
    setSuccess((prev) => ({ ...prev, [key]: label }))
    const anim = getFadeAnim(key)
    anim.setValue(1)
    setTimeout(() => {
      Animated.timing(anim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        setSuccess((prev) => {
          const next = { ...prev }
          delete next[key]
          return next
        })
      })
    }, 2000)
  }

  function handleRuleMenu(rule: Rule) {
    Alert.alert(
      rule.title,
      '',
      [
        {
          text: t('common.edit'),
          onPress: () =>
            router.push(
              `/edit-rule?id=${rule.id}&title=${encodeURIComponent(rule.title)}&mode=${rule.mode}&objective=${encodeURIComponent(rule.objective ?? '')}&category=${encodeURIComponent(rule.category ?? '')}&start_date=${encodeURIComponent(rule.start_date ?? '')}&recurrence_type=${encodeURIComponent(rule.recurrence_type ?? '')}&recurrence_interval=${rule.recurrence_interval ?? 1}&days_of_week=${encodeURIComponent((rule.days_of_week ?? []).join(','))}&day_of_month=${rule.day_of_month ?? ''}&time_of_day=${encodeURIComponent(rule.time_of_day ?? '')}&point_value=${rule.point_value}&reminder_enabled=${rule.reminder_enabled}&reminder_time=${encodeURIComponent(rule.reminder_time ?? '')}&assignee=${rule.assignee ?? 'both'}&recorder=${rule.recorder ?? 'self'}`
            ),
        },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => confirmDelete(rule),
        },
        { text: t('common.cancel'), style: 'cancel' },
      ]
    )
  }

  function confirmDelete(rule: Rule) {
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
              await archiveRule(rule.id)
              load()
            } catch (e: any) {
              Alert.alert(t('common.error'), e.message ?? t('common.error_network'))
            }
          },
        },
      ]
    )
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
      await createEvent(rule.id, {})
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      const cta = getRuleCta(rule)
      showSuccess(key, cta.successMsg)
    } catch (e: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      Alert.alert(t('common.error'), e.message ?? t('common.error_network'))
    } finally {
      setRecording((prev) => ({ ...prev, [key]: false }))
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.brand} />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>{t('events.title')}</Text>
          <Text style={styles.headerSub}>{t('events.subtitle')}</Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push('/create-rule')}
          activeOpacity={0.7}
        >
          <Text style={styles.addBtnText}>{t('events.add_rule')}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => load(true)}
            tintColor={Colors.brand}
          />
        }
      >
        {error && (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {!error && rules.length === 0 && (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>{"📦"}</Text>
            <Text style={styles.emptyTitle}>{t('events.empty_title')}</Text>
            <Text style={styles.emptyDesc}>{t('events.empty_desc')}</Text>
            <TouchableOpacity
              style={styles.emptyBtn}
              onPress={() => router.push('/create-rule')}
              activeOpacity={0.85}
            >
              <Text style={styles.emptyBtnText}>{t('events.empty_cta')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {rules.map((rule) => {
          const key = rule.id
          const cta = getRuleCta(rule)
          const isRecording = recording[key]
          const successMsg = success[key]

          return (
            <View key={rule.id} style={styles.ruleCard}>
              <View style={styles.ruleHeader}>
                <Text style={styles.ruleTitle} numberOfLines={2}>
                  {rule.title}
                </Text>
                <View style={styles.ruleHeaderRight}>
                  <View style={styles.modeTag}>
                    <Text style={styles.modeTagText}>
                      {getRuleModeLabel(rule.mode, t)}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleRuleMenu(rule)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={styles.menuDots}>•••</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {rule.objective && (
                <Text style={styles.ruleObjective}>{rule.objective}</Text>
              )}

              <Text style={styles.rulePoints}>{t('events.per_record', { n: Math.max(rule.point_value ?? 10, 10) })}</Text>

              <TouchableOpacity
                style={[styles.recordBtn, rule.mode === 'routine' ? styles.routineBtn : styles.thankBtn, isRecording && styles.recordBtnLoading]}
                onPress={() => handleRecord(rule)}
                disabled={isRecording}
                activeOpacity={0.85}
              >
                {isRecording ? (
                  <ActivityIndicator color={Colors.textWhite} size="small" />
                ) : (
                  <View style={styles.recordBtnInner}>
                    <Text style={styles.recordBtnText}>{cta.label}</Text>
                    <Text style={styles.recordBtnSub}>{cta.sub}</Text>
                  </View>
                )}
              </TouchableOpacity>

              {successMsg && (
                <Animated.View
                  style={[styles.successBanner, { opacity: getFadeAnim(key) }]}
                >
                  <Text style={styles.successText}>{"✓"} {successMsg}</Text>
                </Animated.View>
              )}
            </View>
          )
        })}

        <View style={styles.bottomPad} />
      </ScrollView>
    </View>
  )
}

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
  header: {
    backgroundColor: Colors.background,
    paddingTop: 64,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  headerSub: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  addBtn: {
    backgroundColor: Colors.brandLighter,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  addBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.brand,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  errorCard: {
    backgroundColor: Colors.errorLight,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
    color: Colors.error,
  },
  emptyCard: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    marginTop: 20,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  emptyBtn: {
    backgroundColor: Colors.brand,
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 24,
  },
  emptyBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  ruleCard: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  ruleHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 6,
  },
  ruleHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  menuDots: {
    fontSize: 14,
    color: Colors.textTertiary,
    letterSpacing: 1,
    lineHeight: 20,
  },
  ruleTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    flex: 1,
    lineHeight: 22,
  },
  modeTag: {
    backgroundColor: Colors.brandLighter,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    flexShrink: 0,
  },
  modeTagText: {
    fontSize: 11,
    color: Colors.brandDark,
    fontWeight: '600',
  },
  ruleObjective: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 8,
    lineHeight: 18,
  },
  rulePoints: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.orangeDark,
    marginBottom: 10,
  },
  recordBtn: {
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  thankBtn: {
    backgroundColor: Colors.brand,
    shadowColor: Colors.brand,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  routineBtn: {
    backgroundColor: Colors.orange,
    shadowColor: Colors.orange,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  recordBtnLoading: {
    opacity: 0.7,
  },
  recordBtnInner: {
    alignItems: 'center',
    gap: 3,
  },
  recordBtnText: {
    color: Colors.textWhite,
    fontSize: 15,
    fontWeight: '700',
  },
  recordBtnSub: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 11,
    fontWeight: '500',
  },
  successBanner: {
    backgroundColor: Colors.successLight,
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
    alignItems: 'center',
  },
  successText: {
    color: Colors.success,
    fontSize: 14,
    fontWeight: '600',
  },
  bottomPad: {
    height: 20,
  },
})
