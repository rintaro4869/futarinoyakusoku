import { useState, useCallback, useRef, useEffect } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Animated,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { useRouter, useFocusEffect } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import * as Haptics from 'expo-haptics'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../constants/colors'
import { getHomeSummary, getRules, createRule, createEvent, HomeSummary, Rule, Event } from '../../lib/api'
import { useAuthStore } from '../../lib/store'
import { isRuleActiveToday, getRuleModeLabel } from '../../lib/rules'
import { buildRewardProgress, getRewardTotals, RewardProgress } from '../../lib/reward-progress'
import { HomeHeroArtwork } from '../../components/PairlogArtwork'
import { RewardCelebrationModal } from '../../components/RewardCelebrationModal'
import { TabRibbonHeader } from '../../components/TabRibbonHeader'
import { ConnectionNoticeBar } from '../../components/ConnectionNoticeBar'
import { getRewards, StoredReward, getSeenRewardUnlocks, markRewardUnlockSeen } from '../../lib/storage'
import { createLocalEvent, createLocalRule, getLocalEvents, getLocalRules } from '../../lib/local-mode'
import { t } from '../../lib/i18n'
import { formatHomeDateLabel, formatWeekRangeLabel } from '../../lib/date-labels'
import {
  decrementPointValue,
  incrementPointValue,
  MIN_POINT_VALUE,
  parsePointDraft,
  sanitizePointDraft,
} from '../../lib/points'

const DEBOUNCE_MS = 3000
type Perspective = 'pair' | 'me' | 'partner'

function getTodayLabel(): string {
  return formatHomeDateLabel(new Date())
}

function getWeekLabel(): string {
  const now = new Date()
  const day = now.getDay()
  const diffToMon = day === 0 ? -6 : 1 - day
  const mon = new Date(now)
  mon.setDate(now.getDate() + diffToMon)
  const sun = new Date(mon)
  sun.setDate(mon.getDate() + 6)
  return formatWeekRangeLabel(mon, sun)
}

function safeNum(v: unknown, fallback = 0): number {
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

function buildLocalSummary(rules: Rule[], events: Event[]): HomeSummary {
  const counts = new Map<string, number>()
  let myThankYou = 0
  let myPromise = 0

  for (const event of events) {
    const rule = rules.find((item) => item.id === event.rule_id)
    if (!rule) continue
    counts.set(rule.id, (counts.get(rule.id) ?? 0) + 1)
    if (rule.mode === 'routine') myPromise += safeNum(rule.point_value, 10)
    else myThankYou += safeNum(rule.point_value, 10)
  }

  return {
    week_key: getWeekLabel(),
    my_name: t('points.me'),
    partner_name: t('points.partner'),
    my_thank_you: myThankYou,
    my_nobishiro: myPromise,
    partner_thank_you: 0,
    partner_nobishiro: 0,
    pending_events: 0,
    open_repairs: 0,
    rules: rules.map((rule) => ({
      rule_id: rule.id,
      title: rule.title,
      mode: rule.mode,
      category: rule.category,
      start_date: rule.start_date,
      recurrence_type: rule.recurrence_type,
      recurrence_interval: rule.recurrence_interval,
      days_of_week: rule.days_of_week,
      day_of_month: rule.day_of_month,
      time_of_day: rule.time_of_day,
      count: counts.get(rule.id) ?? 0,
      point_value: rule.point_value,
      thank_you_threshold: rule.thank_you_threshold,
      nobishiro_threshold: rule.nobishiro_threshold,
    })),
  }
}

// ─── メーターバー ──────────────────────────────────────────────

function MeterBar({
  label,
  subLabel,
  value,
  threshold,
  color,
  bgColor,
}: {
  label: string
  subLabel: string
  value: number
  threshold: number
  color: string
  bgColor: string
}) {
  const pct = threshold > 0 ? Math.min((value / threshold) * 100, 100) : 0
  const remaining = Math.max(threshold - value, 0)
  const isFull = remaining === 0

  return (
    <View style={meterStyles.container}>
      <View style={meterStyles.labelRow}>
        <View>
          <Text style={meterStyles.label}>{label}</Text>
          <Text style={meterStyles.subLabel}>{subLabel}</Text>
        </View>
        <Text style={[meterStyles.value, { color }]}>{value}pt</Text>
      </View>
      <View style={[meterStyles.track, { backgroundColor: bgColor }]}>
        <View style={[meterStyles.fill, { width: `${pct}%` as any, backgroundColor: color }]} />
      </View>
      {isFull ? (
        <Text style={[meterStyles.remaining, { color }]}>
          {t('points.threshold_reached')}
        </Text>
      ) : (
        <Text style={meterStyles.remaining}>{t('points.remaining', { n: remaining })}</Text>
      )}
    </View>
  )
}

const meterStyles = StyleSheet.create({
  container: { marginBottom: 16 },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  label: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  subLabel: { fontSize: 11, color: Colors.textSecondary, marginTop: 1 },
  value: { fontSize: 14, fontWeight: '800' },
  track: { height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: 4 },
  fill: { height: '100%', borderRadius: 4 },
  remaining: { fontSize: 12, color: Colors.textSecondary },
})

// ─── ホーム画面 ────────────────────────────────────────────────

export default function HomeScreen() {
  const router = useRouter()
  const coupleId = useAuthStore((s) => s.coupleId)
  const userId = useAuthStore((s) => s.userId)
  const hydrated = useAuthStore((s) => s.hydrated)
  const [summary, setSummary] = useState<HomeSummary | null>(null)
  const [rules, setRules] = useState<Rule[]>([])
  const [rewards, setRewards] = useState<StoredReward[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rulesLoaded, setRulesLoaded] = useState(true)
  const [summaryLoaded, setSummaryLoaded] = useState(true)
  const [rewardsLoaded, setRewardsLoaded] = useState(true)
  const [recording, setRecording] = useState<Record<string, boolean>>({})
  const [success, setSuccess] = useState<Record<string, string>>({})
  const [perspective, setPerspective] = useState<Perspective>('pair')
  const [seenUnlocks, setSeenUnlocks] = useState<string[]>([])
  const [celebrationReward, setCelebrationReward] = useState<RewardProgress | null>(null)
  const lastTap = useRef<Record<string, number>>({})
  const fadeAnims = useRef<Record<string, Animated.Value>>({})
  const hasLoadedOnce = useRef(false)
  const [showThankYouModal, setShowThankYouModal] = useState(false)
  const [thankYouTitle, setThankYouTitle] = useState('')
  const [thankYouPtDraft, setThankYouPtDraft] = useState(String(MIN_POINT_VALUE))
  const [sendingThankYou, setSendingThankYou] = useState(false)
  const thankYouPt = parsePointDraft(thankYouPtDraft)

  const load = useCallback(async (isRefresh = false) => {
    if (!hydrated) return
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    setError(null)
    try {
      const summarySource = coupleId
        ? getHomeSummary(coupleId)
        : Promise.all([getLocalRules(userId), getLocalEvents(userId)]).then(([localRules, localEvents]) =>
            buildLocalSummary(localRules.filter((rule) => rule.active), localEvents)
          )
      const rulesSource = coupleId ? getRules(coupleId).then((data) => data.items) : getLocalRules(userId)
      const [summaryResult, rulesResult, rewardsResult, seenUnlocksResult] = await Promise.allSettled([
        summarySource,
        rulesSource,
        getRewards(),
        getSeenRewardUnlocks(),
      ])

      const issues: string[] = []
      let hasServerIssue = false

      if (summaryResult.status === 'fulfilled') {
        setSummary(summaryResult.value)
        setSummaryLoaded(true)
      } else {
        setSummaryLoaded(false)
        issues.push(t('home.partial_issue_summary'))
        hasServerIssue ||= summaryResult.reason?.code === 'INTERNAL_ERROR'
      }

      if (rulesResult.status === 'fulfilled') {
        setRules(rulesResult.value.filter((r) => r.active))
        setRulesLoaded(true)
      } else {
        setRulesLoaded(false)
        issues.push(t('home.partial_issue_rules'))
        hasServerIssue ||= Boolean(coupleId && rulesResult.reason?.code === 'INTERNAL_ERROR')
      }

      if (rewardsResult.status === 'fulfilled') {
        setRewards(rewardsResult.value)
        setRewardsLoaded(true)
      } else {
        setRewardsLoaded(false)
        issues.push(t('home.partial_issue_rewards'))
      }

      if (seenUnlocksResult.status === 'fulfilled') {
        setSeenUnlocks(seenUnlocksResult.value)
      }

      if (issues.length > 0) {
        const message = hasServerIssue
          ? t('home.partial_issue_server', { items: issues.join('・') })
          : t('home.partial_issue_message', { items: issues.join('・') })
        setError(message)
      }
      if (issues.length === 0) {
        setError(null)
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [coupleId, userId, hydrated])

  useFocusEffect(
    useCallback(() => {
      if (!hydrated) return
      if (!hasLoadedOnce.current) {
        load()
        hasLoadedOnce.current = true
      } else {
        load(true)
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
      setSummary((prev) =>
        prev
          ? {
              ...prev,
              my_thank_you:
                rule.mode === 'adhoc' ? prev.my_thank_you + Math.max(safeNum(rule.point_value, 10), 10) : prev.my_thank_you,
              my_nobishiro:
                rule.mode === 'routine' ? prev.my_nobishiro + Math.max(safeNum(rule.point_value, 10), 10) : prev.my_nobishiro,
              rules: prev.rules.map((item) =>
                item.rule_id === rule.id ? { ...item, count: item.count + 1 } : item
              ),
            }
          : prev
      )
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      showSuccess(key, rule.mode === 'adhoc' ? t('home.record_success_adhoc') : t('home.record_success_routine'))
    } catch (e: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      Alert.alert(t('common.error'), e.message ?? t('common.error_network'))
    } finally {
      setRecording((prev) => ({ ...prev, [key]: false }))
    }
  }

  async function handleSendThankYou() {
    if (!thankYouTitle.trim() || !userId) return
    setSendingThankYou(true)
    try {
      // 既存のadhocルールがあればそれを再利用し、新規ルール作成によるルール上限エラーを避ける
      const existingAdhoc = adhocRules[0]
      let targetRuleId: string
      let actualPt: number
      if (existingAdhoc) {
        targetRuleId = existingAdhoc.id
        actualPt = Math.max(safeNum(existingAdhoc.point_value, 10), 10)
        coupleId
          ? await createEvent(targetRuleId, { note: thankYouTitle.trim() })
          : await createLocalEvent(userId, targetRuleId, thankYouTitle.trim())
      } else {
        const payload = {
          title: thankYouTitle.trim(),
          mode: 'adhoc' as const,
          objective: 'adhoc',
          point_value: thankYouPt,
          threshold: 5,
          thank_you_threshold: 5,
          nobishiro_threshold: 3,
          assignee: coupleId ? ('partner' as const) : ('self' as const),
          recorder: 'self' as const,
          reminder_enabled: false,
        }
        const newRule = coupleId
          ? await createRule(coupleId, payload)
          : await createLocalRule(payload, userId)
        targetRuleId = newRule.id
        actualPt = thankYouPt
        coupleId
          ? await createEvent(targetRuleId, { note: thankYouTitle.trim() })
          : await createLocalEvent(userId, targetRuleId, thankYouTitle.trim())
      }
      setSummary((prev) =>
        prev ? { ...prev, my_thank_you: prev.my_thank_you + actualPt } : prev
      )
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      setShowThankYouModal(false)
      setThankYouTitle('')
      setThankYouPtDraft(String(MIN_POINT_VALUE))
    } catch (e: any) {
      Alert.alert(t('common.error'), e.message ?? t('common.error_network'))
    } finally {
      setSendingThankYou(false)
    }
  }

  const pairTotals = getRewardTotals(summary)
  const rewardProgress = buildRewardProgress(rewards, pairTotals, Boolean(coupleId))

  useEffect(() => {
    if (celebrationReward) return
    const nextUnlocked = rewardProgress.find(
      (reward) => reward.unlockable && reward.status === 'locked' && !seenUnlocks.includes(reward.id)
    )
    if (nextUnlocked) {
      setCelebrationReward(nextUnlocked)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    }
  }, [celebrationReward, rewardProgress, seenUnlocks])

  if (!hydrated || loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.brand} />
      </View>
    )
  }

  // Thresholds
  const thankThreshold = summary?.rules.reduce((a, r) => a + safeNum(r.thank_you_threshold, 5), 0) ?? 0
  const nobiThreshold = summary?.rules.reduce((a, r) => a + safeNum(r.nobishiro_threshold, 3), 0) ?? 0

  // Today's rules
  const todayRules = rules.filter((r) => r.mode === 'routine' && isRuleActiveToday(r.objective, r.mode, r.start_date, {
    recurrenceType: r.recurrence_type,
    recurrenceInterval: r.recurrence_interval,
    daysOfWeek: r.days_of_week,
    dayOfMonth: r.day_of_month,
  }))
  const todayRuleIds = new Set(todayRules.map((r) => r.id))
  const otherRoutineRules = rules.filter((r) => r.mode === 'routine' && !todayRuleIds.has(r.id))
  const adhocRules = rules.filter((r) => r.mode === 'adhoc')

  const hasRules = rules.length > 0
  const hasTodayRules = todayRules.length > 0
  const promisePoints =
    perspective === 'pair'
      ? safeNum(summary?.my_nobishiro) + safeNum(summary?.partner_nobishiro)
      : perspective === 'me'
        ? safeNum(summary?.my_nobishiro)
        : safeNum(summary?.partner_nobishiro)
  const thankYouPoints =
    perspective === 'pair'
      ? safeNum(summary?.my_thank_you) + safeNum(summary?.partner_thank_you)
      : perspective === 'me'
        ? safeNum(summary?.my_thank_you)
        : safeNum(summary?.partner_thank_you)

  const readyRewards = rewardProgress.filter((reward) => reward.unlockable)
  const nextReward = rewardProgress
    .filter((reward) => !reward.unlockable)
    .sort((a, b) => a.remaining - b.remaining)[0]
  const heroRewardCopy = readyRewards.length > 0
    ? t('home.hero_reward_ready', { n: readyRewards.length })
    : nextReward
      ? t('home.hero_reward_next', { n: nextReward.remaining, name: nextReward.name })
      : t('home.hero_reward_empty')

  async function closeCelebration() {
    if (!celebrationReward) return
    await markRewardUnlockSeen(celebrationReward.id)
    setSeenUnlocks((prev) => (prev.includes(celebrationReward.id) ? prev : [...prev, celebrationReward.id]))
    setCelebrationReward(null)
  }

  async function openRewardsFromCelebration() {
    await closeCelebration()
    router.push('/(home)/rewards')
  }

  return (
    <View style={styles.container}>
      <TabRibbonHeader
        title={t('home.title')}
        subtitle={getTodayLabel()}
      />

      {hydrated && !coupleId ? (
        <ConnectionNoticeBar onPress={() => router.push('/pair')} />
      ) : null}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={Colors.brand} />
        }
      >
        {/* ─── Error ──────────────────────────────────── */}
        {error && (
          <View style={styles.warningCard}>
            <View style={styles.warningHeader}>
              <Ionicons name="cloud-offline-outline" size={18} color={Colors.warning} />
              <Text style={styles.warningTitle}>{t('home.partial_issue_title')}</Text>
            </View>
            <Text style={styles.warningText}>{error}</Text>
            <TouchableOpacity onPress={() => load()} style={styles.warningRetry} activeOpacity={0.75}>
              <Text style={styles.warningRetryText}>{t('home.partial_issue_retry')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ─── No rules empty state ───────────────────── */}
        {rulesLoaded && !hasRules && (
          <View style={styles.onboardCard}>
            <Text style={styles.onboardIcon}>👋</Text>
            <Text style={styles.onboardTitle}>{t('home.empty_title')}</Text>
            <Text style={styles.onboardDesc}>{t('home.empty_desc')}</Text>
            <TouchableOpacity
              style={styles.onboardBtn}
              onPress={() => router.push('/create-rule')}
              activeOpacity={0.85}
            >
              <Text style={styles.onboardBtnText}>{t('home.empty_cta')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {!rulesLoaded && !hasRules && (
          <View style={styles.placeholderCard}>
            <Text style={styles.placeholderTitle}>{t('home.rules_unavailable_title')}</Text>
            <Text style={styles.placeholderDesc}>{t('home.rules_unavailable_desc')}</Text>
            <TouchableOpacity style={styles.placeholderBtn} onPress={() => load()} activeOpacity={0.85}>
              <Text style={styles.placeholderBtnText}>{t('common.retry')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ─── Pending reviews card ────────────────────── */}
        {(summary?.pending_events ?? 0) > 0 && (
          <TouchableOpacity
            style={styles.pendingCard}
            onPress={() => router.push('/(home)/events')}
            activeOpacity={0.85}
          >
            <View style={styles.pendingCardLeft}>
              <Text style={styles.pendingCardIcon}>📩</Text>
              <View>
                <Text style={styles.pendingCardTitle}>{t('home.pending_count', { n: summary!.pending_events })}</Text>
                <Text style={styles.pendingCardSub}>{t('home.pending_sub')}</Text>
              </View>
            </View>
            <Text style={styles.pendingCardArrow}>›</Text>
          </TouchableOpacity>
        )}

        {/* ─── Hero widget ────────────────────────────── */}
        {hasRules && (
          <LinearGradient
            colors={['#fffaf6', '#fff7fb']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            <View style={styles.heroTopRow}>
              <View style={styles.heroTextWrap}>
                <Text style={styles.heroBadge}>{t('home.hero_badge')} {getWeekLabel()}</Text>
                <Text style={styles.heroTitle}>
                  {hasTodayRules
                    ? t('home.hero_title_with_promises', { n: todayRules.length })
                    : t('home.hero_title_without_promises')}
                </Text>
                <Text style={styles.heroDesc}>
                  {hasTodayRules ? t('home.hero_desc_with_promises') : t('home.hero_desc_without_promises')}
                </Text>
              </View>
              <HomeHeroArtwork />
            </View>

            <View style={styles.heroStatsRow}>
              <View style={[styles.heroStatCard, styles.heroPromiseStat]}>
                <View style={[styles.heroStatIcon, { backgroundColor: Colors.orangeLight }]}>
                  <Ionicons name="checkmark-circle" size={16} color={Colors.orangeDark} />
                </View>
                <Text style={styles.heroStatLabel}>{t('home.points_total_promise')}</Text>
                <Text style={styles.heroStatValue}>{pairTotals.both.promise}pt</Text>
              </View>
              <View style={[styles.heroStatCard, styles.heroThankYouStat]}>
                <View style={[styles.heroStatIcon, { backgroundColor: Colors.brandLight }]}>
                  <Ionicons name="heart" size={15} color={Colors.brandDark} />
                </View>
                <Text style={styles.heroStatLabel}>{t('home.points_total_thankyou')}</Text>
                <Text style={styles.heroStatValue}>{pairTotals.both.thankyou}pt</Text>
              </View>
            </View>

            <View style={styles.heroRewardWidget}>
              <View style={styles.heroRewardCopy}>
                <Text style={styles.heroRewardLabel}>{t('tabs.rewards')}</Text>
                <Text style={styles.heroRewardText}>{heroRewardCopy}</Text>
              </View>
              <TouchableOpacity
                style={styles.heroRewardButton}
                onPress={() => router.push('/(home)/rewards')}
                activeOpacity={0.85}
              >
                <Ionicons name="gift-outline" size={15} color={Colors.brandDark} />
                <Text style={styles.heroRewardButtonText}>{t('home.hero_rewards_action')}</Text>
              </TouchableOpacity>
            </View>

          </LinearGradient>
        )}

        {/* ─── ありがとうを送る ─────────────────────────── */}
        <TouchableOpacity
          style={styles.thankYouBtn}
          onPress={() => setShowThankYouModal(true)}
          activeOpacity={0.85}
        >
          <Ionicons name="heart" size={18} color={Colors.brandDark} />
          <Text style={styles.thankYouBtnText}>{t('home.adhoc_send_btn')}</Text>
          <Ionicons name="chevron-forward" size={16} color={Colors.brand} />
        </TouchableOpacity>

        {/* ─── Today's promises (PRIMARY) ─────────────── */}
        {hasRules && (
          <View style={styles.todaySection}>
            <View style={styles.todaySectionHeader}>
              <Text style={styles.todaySectionTitle}>{t('home.today_promises')}</Text>
              {hasTodayRules && (
                <Text style={styles.todaySectionCount}>{todayRules.length}</Text>
              )}
            </View>

            {[...todayRules, ...otherRoutineRules].map((rule) => {
                const isToday = todayRuleIds.has(rule.id)
                const accentColor = Colors.orange
                const accentLight = Colors.orangeLighter
                const accentDark = Colors.orangeDark
                const key = rule.id
                const isRec = recording[key] ?? false
                const msg = success[key]
                const pv = Math.max(safeNum(rule.point_value, 10), 10)

                return (
                  <View key={rule.id} style={[styles.todayRuleCard, { borderLeftColor: isToday ? accentColor : Colors.border }]}>
                    <View style={styles.todayRuleTop}>
                      <View style={[styles.modeChip, { backgroundColor: isToday ? accentLight : Colors.surfaceMuted }]}>
                        <Text style={[styles.modeChipText, { color: isToday ? accentDark : Colors.textSecondary }]}>
                          {isToday ? t('home.today_badge') : t('home.other_day_badge')}
                        </Text>
                      </View>
                      {rule.reminder_enabled && rule.reminder_time && (
                        <View style={styles.reminderPill}>
                          <Ionicons name="notifications-outline" size={12} color={Colors.brandDark} />
                          <Text style={styles.reminderText}>{rule.reminder_time}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.todayRuleTitle} numberOfLines={2}>{rule.title}</Text>
                    <TouchableOpacity
                      style={[
                        styles.recordBtn,
                        { backgroundColor: isToday ? accentColor : Colors.textSecondary },
                        isRec && styles.recordBtnLoading,
                      ]}
                      onPress={() => handleRecord(rule)}
                      disabled={isRec}
                      activeOpacity={0.85}
                    >
                      {isRec ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <Text style={styles.recordBtnText}>{t('home.record_routine', { n: pv })}</Text>
                      )}
                    </TouchableOpacity>
                    {msg && (
                      <Animated.View style={[styles.successBanner, { opacity: getFadeAnim(key) }]}>
                        <Text style={styles.successText}>{"✓"} {msg}</Text>
                      </Animated.View>
                    )}
                  </View>
                )
              })}
          </View>
        )}

        {/* ─── Points (SECONDARY) ─────────────────────── */}
        {hasRules && summaryLoaded && (
          <View style={styles.pointsSection}>
            <Text style={styles.pointsSectionTitle}>{t('points.weekly_accumulation')}</Text>
            <View style={styles.pointsCard}>
              {/* Segment control */}
              <View style={styles.segmentControl} accessibilityRole="tablist">
                {([
                  { key: 'pair' as const, label: t('points.segment_pair') },
                  { key: 'me' as const, label: summary?.my_name ?? '' },
                  { key: 'partner' as const, label: summary?.partner_name ?? '' },
                ]).map((item) => (
                  <TouchableOpacity
                    key={item.key}
                    style={[styles.segmentItem, perspective === item.key && styles.segmentItemActive]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                      setPerspective(item.key)
                    }}
                    activeOpacity={0.85}
                  >
                    <Text style={[styles.segmentText, perspective === item.key && styles.segmentTextActive]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Meters */}
              <MeterBar
                label={t('points.promise_points')}
                subLabel={t('points.promise_points_sub')}
                value={promisePoints}
                threshold={nobiThreshold > 0 ? nobiThreshold : 100}
                color={Colors.orange}
                bgColor={Colors.orangeLighter}
              />
              <MeterBar
                label={t('points.thank_you_points')}
                subLabel={t('points.thank_you_points_sub')}
                value={thankYouPoints}
                threshold={thankThreshold > 0 ? thankThreshold : 100}
                color={Colors.brand}
                bgColor={Colors.brandLighter}
              />

              {/* Reward hint */}
              <TouchableOpacity
                style={styles.rewardHintRow}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                  router.push('/(home)/rewards')
                }}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={readyRewards.length > 0 ? 'sparkles' : 'gift-outline'}
                  size={15}
                  color={readyRewards.length > 0 ? Colors.orangeDark : Colors.brand}
                />
                <Text style={styles.rewardHintText}>
                  {readyRewards.length > 0
                    ? t('home.reward_ready_title', { n: readyRewards.length })
                    : nextReward
                      ? t('home.reward_next_title', { n: nextReward.remaining })
                      : t('home.reward_empty_title')}
                </Text>
                <Ionicons name="chevron-forward" size={14} color={Colors.textTertiary} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ─── Summary link (TERTIARY) ───────────────── */}
        {hasRules && coupleId && (
          <TouchableOpacity
            style={styles.summaryLink}
            onPress={() => router.push('/(home)/summary')}
            activeOpacity={0.7}
          >
            <Text style={styles.summaryLinkText}>{t('home.summary_link')}</Text>
          </TouchableOpacity>
        )}

        <View style={styles.bottomPad} />
      </ScrollView>

      <RewardCelebrationModal
        visible={!!celebrationReward}
        rewardName={celebrationReward?.name ?? ''}
        remaining={celebrationReward?.remaining ?? 0}
        onClose={closeCelebration}
        onPrimary={openRewardsFromCelebration}
      />

      {/* ─── ありがとうモーダル ────────────────────────── */}
      <Modal visible={showThankYouModal} animationType="slide" transparent>
        <KeyboardAvoidingView
          style={styles.tyModalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.tyModalContent}>
            <View style={styles.tyModalHeader}>
              <TouchableOpacity onPress={() => { setShowThankYouModal(false); setThankYouTitle(''); setThankYouPtDraft(String(MIN_POINT_VALUE)) }} activeOpacity={0.7}>
                <Text style={styles.tyModalCancel}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <Text style={styles.tyModalTitle}>{t('home.adhoc_modal_title')}</Text>
              <TouchableOpacity onPress={handleSendThankYou} disabled={!thankYouTitle.trim() || sendingThankYou} activeOpacity={0.7}>
                {sendingThankYou
                  ? <ActivityIndicator size="small" color={Colors.brand} />
                  : <Text style={[styles.tyModalSave, !thankYouTitle.trim() && styles.tyModalSaveDisabled]}>{t('home.adhoc_modal_send')}</Text>
                }
              </TouchableOpacity>
            </View>

            <View style={styles.tyModalBody}>
              <Text style={styles.tyModalLabel}>{t('home.adhoc_modal_question')}</Text>
              <TextInput
                style={styles.tyModalInput}
                placeholder={t('home.adhoc_modal_placeholder')}
                placeholderTextColor={Colors.textTertiary}
                value={thankYouTitle}
                onChangeText={setThankYouTitle}
                maxLength={50}
                autoFocus
              />

              <Text style={[styles.tyModalLabel, { marginTop: 20 }]}>{t('home.adhoc_modal_points')}</Text>
              <View style={styles.tyStepper}>
                <TouchableOpacity
                  style={[styles.tyStepperBtn, thankYouPt <= MIN_POINT_VALUE && styles.tyStepperBtnDisabled]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                    setThankYouPtDraft(String(decrementPointValue(thankYouPt)))
                  }}
                  disabled={thankYouPt <= MIN_POINT_VALUE}
                  activeOpacity={0.7}
                >
                  <Text style={styles.tyStepperBtnText}>−</Text>
                </TouchableOpacity>
                <View style={styles.tyStepperValue}>
                  <TextInput
                    style={styles.tyStepperValueInput}
                    value={thankYouPtDraft}
                    onChangeText={(text) => setThankYouPtDraft(sanitizePointDraft(text))}
                    onBlur={() => setThankYouPtDraft(String(parsePointDraft(thankYouPtDraft)))}
                    keyboardType="number-pad"
                    selectTextOnFocus
                  />
                  <Text style={styles.tyStepperValueUnit}>pt</Text>
                </View>
                <TouchableOpacity
                  style={styles.tyStepperBtn}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                    setThankYouPtDraft(String(incrementPointValue(thankYouPt)))
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.tyStepperBtnText}>＋</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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

  thankYouBtn: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: Colors.brandLighter,
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.brandLight + '60',
  },
  thankYouBtnText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.brandDark,
  },

  tyModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-end',
  },
  tyModalContent: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  tyModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tyModalTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  tyModalCancel: { fontSize: 16, color: Colors.textSecondary },
  tyModalSave: { fontSize: 16, fontWeight: '700', color: Colors.brand },
  tyModalSaveDisabled: { color: Colors.disabled },
  tyModalBody: { padding: 20, paddingBottom: 40 },
  tyModalLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  tyModalInput: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  tyStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  tyStepperBtn: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tyStepperBtnDisabled: { opacity: 0.3 },
  tyStepperBtnText: { fontSize: 22, fontWeight: '300', color: Colors.textPrimary },
  tyStepperValue: {
    paddingHorizontal: 16,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: Colors.border,
    minWidth: 120,
  },
  tyStepperValueInput: {
    minWidth: 56,
    fontSize: 18,
    fontWeight: '800',
    color: Colors.brand,
    textAlign: 'center',
  },
  tyStepperValueUnit: { fontSize: 16, fontWeight: '700', color: Colors.brand },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 40 },

  heroCard: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 18,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.07,
    shadowRadius: 22,
    elevation: 4,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 14,
  },
  heroTextWrap: {
    flex: 1,
    paddingTop: 6,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 10,
  },
  heroTitle: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  heroDesc: {
    fontSize: 14,
    lineHeight: 22,
    color: Colors.textSecondary,
  },
  heroStatsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  heroStatCard: {
    flex: 1,
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
  },
  heroPromiseStat: {
    backgroundColor: Colors.orangeLighter,
    borderColor: Colors.orangeLight,
  },
  heroThankYouStat: {
    backgroundColor: Colors.brandLighter,
    borderColor: Colors.brandLight,
  },
  heroStatIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  heroStatLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '700',
    marginBottom: 4,
  },
  heroStatValue: {
    fontSize: 25,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  heroRewardWidget: {
    marginTop: 14,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.78)',
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  heroRewardCopy: {
    flex: 1,
  },
  heroRewardLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.brandDark,
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  heroRewardText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  heroRewardButton: {
    borderRadius: 14,
    backgroundColor: Colors.surfaceBrand,
    borderWidth: 1,
    borderColor: Colors.brandLight + '45',
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroRewardButtonText: {
    color: Colors.brandDark,
    fontSize: 13,
    fontWeight: '800',
  },
  heroActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  heroActionCard: {
    flex: 1,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.76)',
    borderWidth: 1,
    borderColor: Colors.borderLight,
    paddingVertical: 14,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  heroActionText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },

  // Pending
  pendingCard: {
    backgroundColor: Colors.brandLighter,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.brand + '30',
  },
  pendingCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  pendingCardIcon: { fontSize: 22 },
  pendingCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.brandDark,
    marginBottom: 2,
  },
  pendingCardSub: {
    fontSize: 12,
    color: Colors.brand,
  },
  pendingCardArrow: {
    fontSize: 20,
    color: Colors.brandDark,
  },

  // Warning / partial load
  warningCard: {
    backgroundColor: Colors.warningLight,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.warning + '28',
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  warningText: {
    fontSize: 13,
    lineHeight: 20,
    color: Colors.textSecondary,
  },
  warningRetry: {
    alignSelf: 'flex-start',
    marginTop: 10,
    backgroundColor: Colors.background,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  warningRetryText: {
    fontSize: 13,
    color: Colors.textPrimary,
    fontWeight: '700',
  },

  placeholderCard: {
    backgroundColor: Colors.background,
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  placeholderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  placeholderDesc: {
    fontSize: 14,
    lineHeight: 22,
    color: Colors.textSecondary,
  },
  placeholderBtn: {
    marginTop: 14,
    alignSelf: 'flex-start',
    borderRadius: 999,
    backgroundColor: Colors.surfaceMuted,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  placeholderBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },

  // Onboard (empty state)
  onboardCard: {
    backgroundColor: Colors.background,
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  onboardIcon: { fontSize: 44, marginBottom: 14 },
  onboardTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 10,
    textAlign: 'center',
  },
  onboardDesc: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 20,
  },
  onboardBtn: {
    backgroundColor: Colors.brand,
    borderRadius: 14,
    paddingHorizontal: 28,
    paddingVertical: 13,
    shadowColor: Colors.brand,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  onboardBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },

  // ─── Today section (PRIMARY) ─────────────────────
  todaySection: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  todaySectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  todaySectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  todaySectionCount: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.brand,
    backgroundColor: Colors.brandLighter,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
    overflow: 'hidden',
  },
  todayRuleCard: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 18,
    padding: 16,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  todayRuleTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  modeChip: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  modeChipText: { fontSize: 11, fontWeight: '700' },
  reminderPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surfaceMuted,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  reminderText: { fontSize: 11, color: Colors.brandDark, fontWeight: '700' },
  todayRuleTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    lineHeight: 22,
    marginBottom: 10,
  },
  recordBtn: {
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  recordBtnLoading: { opacity: 0.7 },
  recordBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  successBanner: {
    backgroundColor: Colors.successLight,
    borderRadius: 8,
    padding: 9,
    marginTop: 8,
    alignItems: 'center',
  },
  successText: { color: Colors.success, fontSize: 13, fontWeight: '600' },

  // No today
  noTodayCard: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 18,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  noTodayText: {
    fontSize: 15,
    color: Colors.textPrimary,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  noTodaySub: {
    fontSize: 13,
    lineHeight: 19,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 14,
  },
  adhocBtn: {
    backgroundColor: Colors.brand,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 11,
    alignItems: 'center',
    width: '100%',
  },
  adhocBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textWhite,
  },

  // ─── Points section (SECONDARY) ──────────────────
  pointsSection: {
    marginHorizontal: 16,
    marginTop: 20,
  },
  pointsSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 10,
  },
  pointsCard: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  segmentControl: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceMuted,
    borderRadius: 14,
    padding: 3,
    marginBottom: 16,
  },
  segmentItem: {
    flex: 1,
    borderRadius: 11,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentItemActive: {
    backgroundColor: Colors.surfaceElevated,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  segmentText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  segmentTextActive: {
    color: Colors.textPrimary,
  },
  rewardHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  rewardHintText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },

  // Summary link
  summaryLink: {
    marginHorizontal: 20,
    marginTop: 18,
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLinkText: {
    fontSize: 13,
    color: Colors.brand,
    fontWeight: '600',
  },

  bottomPad: { height: 20 },
})
