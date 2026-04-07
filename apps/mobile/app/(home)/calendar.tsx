import { useCallback, useMemo, useRef, useState } from 'react'
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
import { getRules, getEvents, createEvent, Rule, Event } from '../../lib/api'
import { useAuthStore } from '../../lib/store'
import { getLocalRules, getLocalEvents, createLocalEvent } from '../../lib/local-mode'
import { getRuleModeLabel, getRuleScheduleSummary, isRuleActiveOnDate } from '../../lib/rules'
import { t, getLocaleTag } from '../../lib/i18n'
import { formatCalendarDateLabel } from '../../lib/date-labels'

const DEBOUNCE_MS = 3000

const DAYS = ['days.mon', 'days.tue', 'days.wed', 'days.thu', 'days.fri', 'days.sat', 'days.sun'].map(k => t(k))

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number): number {
  const jsDay = new Date(year, month, 1).getDay()
  return jsDay === 0 ? 6 : jsDay - 1
}

function formatDayLabel(date: Date): string {
  const d = new Date()
  const isToday = d.toDateString() === date.toDateString()
  const dateStr = formatCalendarDateLabel(date)
  return isToday
    ? t('calendar.today_label', { date: dateStr })
    : dateStr
}

function pad2(value: number): string {
  return String(value).padStart(2, '0')
}

function toLocalDateKey(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`
}

function getEventDateKey(event: Event): string {
  if (event.occurred_on) return event.occurred_on
  return toLocalDateKey(new Date(event.created_at))
}

function getEventDateParts(event: Event) {
  if (event.occurred_on) {
    const [year, month, day] = event.occurred_on.split('-').map((value) => Number(value))
    return { year, month: month - 1, day }
  }
  const date = new Date(event.created_at)
  return { year: date.getFullYear(), month: date.getMonth(), day: date.getDate() }
}

function isFutureDate(date: Date): boolean {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(date)
  target.setHours(0, 0, 0, 0)
  return target.getTime() > today.getTime()
}

export default function CalendarTab() {
  const router = useRouter()
  const coupleId = useAuthStore((s) => s.coupleId)
  const userId = useAuthStore((s) => s.userId)
  const hydrated = useAuthStore((s) => s.hydrated)
  const [rules, setRules] = useState<Rule[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [recording, setRecording] = useState<Record<string, boolean>>({})
  const [success, setSuccess] = useState<Record<string, string>>({})
  const lastTap = useRef<Record<string, number>>({})
  const fadeAnims = useRef<Record<string, Animated.Value>>({})
  const hasLoadedOnce = useRef(false)
  const scrollRef = useRef<ScrollView>(null)
  const detailOffsetY = useRef(0)

  const now = new Date()
  const [calYear, setCalYear] = useState(now.getFullYear())
  const [calMonth, setCalMonth] = useState(now.getMonth())
  const [selectedDay, setSelectedDay] = useState<number | null>(now.getDate())

  const load = useCallback(async (isRefresh = false) => {
    if (!hydrated) return
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    setError(null)
    try {
      if (coupleId) {
        const [data, eventsData] = await Promise.all([
          getRules(coupleId),
          getEvents(coupleId),
        ])
        setRules(data.items.filter((r) => r.active))
        setEvents(eventsData.items)
      } else {
        const [localRules, localEvents] = await Promise.all([
          getLocalRules(userId),
          getLocalEvents(userId),
        ])
        setRules(localRules.filter((r) => r.active))
        setEvents(localEvents)
      }
    } catch (e: any) {
      setError(e.message ?? t('common.error_network'))
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

  async function handleRecord(rule: Rule, targetDateKey: string) {
    if (!userId) return
    const key = rule.id
    const tapTime = Date.now()
    if (lastTap.current[key] && tapTime - lastTap.current[key] < DEBOUNCE_MS) return
    lastTap.current[key] = tapTime
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    setRecording((prev) => ({ ...prev, [key]: true }))
    try {
      const event = coupleId
        ? await createEvent(rule.id, { occurred_on: targetDateKey })
        : await createLocalEvent(userId, rule.id, null, targetDateKey)
      setEvents((prev) => [event, ...prev])
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      showSuccess(key, rule.mode === 'adhoc' ? t('calendar.record_success_adhoc') : t('calendar.record_success_routine'))
    } catch (e: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      Alert.alert(t('common.error'), e.message ?? t('common.error_network'))
    } finally {
      setRecording((prev) => ({ ...prev, [key]: false }))
    }
  }

  const daysInMonth = getDaysInMonth(calYear, calMonth)
  const firstDayIndex = getFirstDayOfMonth(calYear, calMonth)
  const isCurrentMonth = now.getFullYear() === calYear && now.getMonth() === calMonth

  // ドット表示用：実際の記録（イベント）に基づく
  const recordedDates = useMemo(() => {
    const result: Record<number, { routine: boolean; adhoc: boolean }> = {}
    const ruleModeMap = new Map(rules.map((rule) => [rule.id, rule.mode]))
    for (const event of events) {
      const eventDate = getEventDateParts(event)
      if (eventDate.year === calYear && eventDate.month === calMonth) {
        const day = eventDate.day
        if (!result[day]) result[day] = { routine: false, adhoc: false }
        const mode = ruleModeMap.get(event.rule_id)
        if (mode === 'routine') result[day].routine = true
        else result[day].adhoc = true
      }
    }
    return result
  }, [events, rules, calYear, calMonth])

  // 日付選択時に表示するルール：スケジュールに基づく
  const markedDates = useMemo(() => {
    const result: Record<number, Rule[]> = {}
    for (let d = 1; d <= daysInMonth; d++) {
      const targetDate = new Date(calYear, calMonth, d)
      result[d] = rules.filter((r) => isRuleActiveOnDate(r.objective, r.mode, targetDate, r.start_date, {
        recurrenceType: r.recurrence_type,
        recurrenceInterval: r.recurrence_interval,
        daysOfWeek: r.days_of_week,
        dayOfMonth: r.day_of_month,
      }))
    }
    return result
  }, [rules, calYear, calMonth, daysInMonth])

  // 表示中の月の実際の記録数を集計
  const thisMonthStats = useMemo(() => {
    const ruleModeMap = new Map(rules.map((r) => [r.id, r.mode]))
    let routineCount = 0
    let adhocCount = 0
    for (const event of events) {
      const eventDate = getEventDateParts(event)
      if (eventDate.year === calYear && eventDate.month === calMonth) {
        const mode = ruleModeMap.get(event.rule_id)
        if (mode === 'routine') routineCount++
        else adhocCount++
      }
    }
    return { routineCount, adhocCount, total: routineCount + adhocCount }
  }, [events, rules, calYear, calMonth])

  const selectedDayRules = useMemo(() => {
    if (!selectedDay) return []
    return (markedDates[selectedDay] ?? []).filter((r) => r.mode === 'routine')
  }, [markedDates, selectedDay])

  const selectedDayEvents = useMemo(() => {
    if (!selectedDay) return []
    const selectedDateKey = toLocalDateKey(new Date(calYear, calMonth, selectedDay))
    return events.filter((event) => {
      return getEventDateKey(event) === selectedDateKey
    })
  }, [events, calYear, calMonth, selectedDay])

  const selectedDayRoutineEventMap = useMemo(() => {
    const ruleModeMap = new Map(rules.map((rule) => [rule.id, rule.mode]))
    const map = new Map<string, Event>()
    for (const event of selectedDayEvents) {
      if (ruleModeMap.get(event.rule_id) === 'routine' && !map.has(event.rule_id)) {
        map.set(event.rule_id, event)
      }
    }
    return map
  }, [selectedDayEvents, rules])

  const selectedDayDisplayedEvents = useMemo(() => {
    if (selectedDayRules.length === 0) return selectedDayEvents
    const ruleModeMap = new Map(rules.map((rule) => [rule.id, rule.mode]))
    return selectedDayEvents.filter((event) => ruleModeMap.get(event.rule_id) === 'adhoc')
  }, [selectedDayEvents, selectedDayRules.length, rules])

  function renderRecordedEventCard(event: Event) {
    const rule = rules.find((item) => item.id === event.rule_id)
    const isRoutine = rule?.mode === 'routine'
    const accentColor = isRoutine ? Colors.orange : Colors.brand
    const accentLight = isRoutine ? Colors.orangeLighter : Colors.brandLighter
    const accentDark = isRoutine ? Colors.orangeDark : Colors.brandDark
    const title = event.note?.trim() || rule?.title || t('calendar.recorded_item')

    return (
      <View key={event.id} style={[styles.dayRuleCard, { borderLeftColor: accentColor }]}>
        <View style={styles.dayRuleTitleRow}>
          <Text style={styles.dayRuleTitle} numberOfLines={2}>
            {title}
          </Text>
          <View style={[styles.modeChip, { backgroundColor: accentLight }]}>
            <Text style={[styles.modeChipText, { color: accentDark }]}>
              {rule ? getRuleModeLabel(rule.mode, t) : t('calendar.recorded_label')}
            </Text>
          </View>
        </View>
        <Text style={styles.dayRuleMeta}>
          {t('calendar.recorded_at', {
            time: new Date(event.created_at).toLocaleTimeString(getLocaleTag(), {
              hour: '2-digit',
              minute: '2-digit',
            }),
          })}
        </Text>
      </View>
    )
  }

  function prevMonth() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    if (calMonth === 0) { setCalYear((y) => y - 1); setCalMonth(11) }
    else setCalMonth((m) => m - 1)
    setSelectedDay(null)
  }

  function nextMonth() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    if (calMonth === 11) { setCalYear((y) => y + 1); setCalMonth(0) }
    else setCalMonth((m) => m + 1)
    setSelectedDay(null)
  }

  function goToday() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    const now = new Date()
    setCalYear(now.getFullYear())
    setCalMonth(now.getMonth())
    setSelectedDay(now.getDate())
  }

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
        title={t('calendar.title')}
        rightSlot={
          <TouchableOpacity style={styles.todayBtn} onPress={goToday} activeOpacity={0.7}>
            <Text style={styles.todayBtnText}>{t('calendar.today')}</Text>
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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={Colors.brand} />}
      >
        {error && (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Calendar */}
        <View style={styles.calendarCard}>
          {/* Month nav */}
          <View style={styles.calNav}>
            <TouchableOpacity onPress={prevMonth} activeOpacity={0.7} style={styles.calNavBtn}>
              <Text style={styles.calNavArrow}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.calNavTitle}>{t('calendar.year_month', { year: calYear, month: calMonth + 1 })}</Text>
            <TouchableOpacity onPress={nextMonth} activeOpacity={0.7} style={styles.calNavBtn}>
              <Text style={styles.calNavArrow}>›</Text>
            </TouchableOpacity>
          </View>

          {/* Weekday headers */}
          <View style={styles.weekRow}>
            {DAYS.map((d, i) => (
              <Text key={d} style={[styles.weekLabel, i >= 5 && styles.weekLabelWeekend]}>{d}</Text>
            ))}
          </View>

          {/* Day grid */}
          <View style={styles.calGrid}>
            {Array.from({ length: firstDayIndex }).map((_, i) => (
              <View key={`empty-${i}`} style={styles.calCell} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const dayRecord = recordedDates[day]
              const isToday = isCurrentMonth && now.getDate() === day
              const isSelected = selectedDay === day
              const hasRoutine = dayRecord?.routine ?? false
              const hasAdhoc = dayRecord?.adhoc ?? false

              return (
                <TouchableOpacity
                  key={day}
                  style={[
                    styles.calCell,
                    isToday && styles.calCellToday,
                    isSelected && !isToday && styles.calCellSelected,
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                    const nextDay = day === selectedDay ? null : day
                    setSelectedDay(nextDay)
                    if (nextDay !== null) {
                      setTimeout(() => {
                        scrollRef.current?.scrollTo({
                          y: Math.max(detailOffsetY.current - 16, 0),
                          animated: true,
                        })
                      }, 120)
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.calDayText,
                    isToday && styles.calDayTextToday,
                    isSelected && !isToday && styles.calDayTextSelected,
                  ]}>
                    {day}
                  </Text>
                  <View style={styles.calDots}>
                    {hasRoutine && (
                      <View style={styles.dotRoutine} />
                    )}
                    {hasAdhoc && (
                      <View style={styles.dotAdhoc} />
                    )}
                  </View>
                </TouchableOpacity>
              )
            })}
          </View>

          {/* Legend */}
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={styles.dotRoutine} />
              <Text style={styles.legendText}>{t('calendar.legend_routine')}</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={styles.dotAdhoc} />
              <Text style={styles.legendText}>{t('calendar.legend_adhoc')}</Text>
            </View>
          </View>
        </View>

        {/* Month summary */}
        {thisMonthStats.total > 0 && (
          <View style={styles.weekSummary}>
            <Text style={styles.weekSummaryTitle}>{t('calendar.week_summary_title')}</Text>
            <View style={styles.weekSummaryRow}>
              <View style={[styles.weekSummaryStat, styles.weekSummaryRoutine]}>
                <View style={[styles.weekSummaryDot, { backgroundColor: Colors.orangeDark }]} />
                <View style={styles.weekSummaryText}>
                  <Text style={styles.weekSummaryLabel}>{t('calendar.legend_routine')}</Text>
                  <Text style={styles.weekSummaryNum}>{t('calendar.week_count', { n: thisMonthStats.routineCount })}</Text>
                </View>
              </View>
              <View style={[styles.weekSummaryStat, styles.weekSummaryAdhoc]}>
                <View style={[styles.weekSummaryDot, { backgroundColor: Colors.brandDark }]} />
                <View style={styles.weekSummaryText}>
                  <Text style={styles.weekSummaryLabel}>{t('calendar.legend_adhoc')}</Text>
                  <Text style={styles.weekSummaryNum}>{t('calendar.week_count', { n: thisMonthStats.adhocCount })}</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Empty state for no rules / no records */}
        {rules.length === 0 && events.length === 0 && (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>📅</Text>
            <Text style={styles.emptyTitle}>{t('calendar.empty_title')}</Text>
            <Text style={styles.emptyDesc}>{t('calendar.empty_desc')}</Text>
            <TouchableOpacity
              style={styles.emptyBtn}
              onPress={() => router.push('/create-rule')}
              activeOpacity={0.85}
            >
              <Text style={styles.emptyBtnText}>{t('calendar.empty_cta')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Selected day detail */}
        {selectedDay !== null && (
          <View
            style={styles.dayDetail}
            onLayout={(event) => {
              detailOffsetY.current = event.nativeEvent.layout.y
            }}
          >
            <View style={styles.dayDetailHeader}>
              <Text style={styles.dayDetailTitle}>
                {formatDayLabel(new Date(calYear, calMonth, selectedDay))}
              </Text>
              <Text style={styles.dayDetailCount}>
                {selectedDayRules.length > 0 && selectedDayDisplayedEvents.length > 0
                  ? `${t('calendar.promise_count', { n: selectedDayRules.length })} / ${t('calendar.record_count', { n: selectedDayDisplayedEvents.length })}`
                  : selectedDayRules.length > 0
                    ? t('calendar.promise_count', { n: selectedDayRules.length })
                    : selectedDayDisplayedEvents.length > 0
                      ? t('calendar.record_count', { n: selectedDayDisplayedEvents.length })
                      : t('calendar.no_schedule')}
              </Text>
            </View>

            {selectedDayRules.length === 0 && selectedDayDisplayedEvents.length === 0 ? (
              <View style={styles.noDayRules}>
                <Text style={styles.noDayRulesText}>{t('calendar.no_promise_today')}</Text>
                <Text style={styles.noDayRulesSub}>
                  {t('calendar.adhoc_anytime')}
                </Text>
              </View>
            ) : (
              <>
                {selectedDayRules.map((rule) => {
                  const isRoutine = rule.mode === 'routine'
                  const accentColor = isRoutine ? Colors.orange : Colors.brand
                  const accentLight = isRoutine ? Colors.orangeLighter : Colors.brandLighter
                  const accentDark = isRoutine ? Colors.orangeDark : Colors.brandDark
                  const key = rule.id
                  const isRecording = recording[key] ?? false
                  const successMsg = success[key]
                  const pts = Math.max(rule.point_value ?? 10, 10)
                  const ctaLabel = isRoutine
                    ? t('calendar.record_routine', { n: pts })
                    : t('calendar.record_adhoc', { n: pts })

                  return (
                    <View key={rule.id} style={[styles.dayRuleCard, { borderLeftColor: accentColor }]}>
                      <View style={styles.dayRuleTitleRow}>
                        <Text style={styles.dayRuleTitle} numberOfLines={2}>{rule.title}</Text>
                        <View style={[styles.modeChip, { backgroundColor: accentLight }]}>
                          <Text style={[styles.modeChipText, { color: accentDark }]}>
                            {getRuleModeLabel(rule.mode, t)}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.dayRuleMeta}>
                        {getRuleScheduleSummary(rule.mode, rule.objective, {
                          startDate: rule.start_date,
                          recurrenceType: rule.recurrence_type,
                          recurrenceInterval: rule.recurrence_interval,
                          daysOfWeek: rule.days_of_week,
                          dayOfMonth: rule.day_of_month,
                          timeOfDay: rule.time_of_day,
                          reminderEnabled: rule.reminder_enabled,
                          reminderTime: rule.reminder_time,
                        })}
                      </Text>
                      {rule.reminder_enabled && rule.reminder_time ? (
                        <View style={styles.reminderPill}>
                          <Ionicons name="notifications-outline" size={12} color={Colors.brandDark} />
                          <Text style={styles.reminderText}>{t('calendar.remind_at', { time: rule.reminder_time })}</Text>
                        </View>
                      ) : null}
                      {selectedDayRoutineEventMap.get(rule.id) ? (
                        <View style={styles.recordedBanner}>
                          <Text style={styles.recordedBannerText}>{t('calendar.recorded_done_short')}</Text>
                        </View>
                      ) : isFutureDate(new Date(calYear, calMonth, selectedDay)) ? (
                        <View style={styles.recordLockedBanner}>
                          <Text style={styles.recordLockedText}>{t('calendar.future_locked')}</Text>
                        </View>
                      ) : (
                        <TouchableOpacity
                          style={[
                            styles.recordBtn,
                            { backgroundColor: accentColor },
                            isRecording && styles.recordBtnLoading,
                          ]}
                          onPress={() => handleRecord(rule, toLocalDateKey(new Date(calYear, calMonth, selectedDay)))}
                          disabled={isRecording}
                          activeOpacity={0.85}
                        >
                          {isRecording ? (
                            <ActivityIndicator color="#fff" size="small" />
                          ) : (
                            <Text style={styles.recordBtnText}>{ctaLabel}</Text>
                          )}
                        </TouchableOpacity>
                      )}
                      {successMsg ? (
                        <Animated.View style={[styles.successBanner, { opacity: getFadeAnim(key) }]}>
                          <Text style={styles.successText}>{"✓"} {successMsg}</Text>
                        </Animated.View>
                      ) : null}
                    </View>
                  )
                })}

                {selectedDayDisplayedEvents.length > 0 && (
                  <View style={styles.recordsSection}>
                    <Text style={styles.recordsSectionTitle}>
                      {t('calendar.record_count', { n: selectedDayDisplayedEvents.length })}
                    </Text>
                    {selectedDayDisplayedEvents.map((event) => renderRecordedEventCard(event))}
                  </View>
                )}
              </>
            )}
          </View>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
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
  todayBtn: {
    backgroundColor: Colors.surfaceBrand,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.brandLight + '35',
  },
  todayBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.brandDark,
  },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  errorCard: {
    backgroundColor: Colors.errorLight,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  errorText: { fontSize: 14, color: Colors.error },

  // Calendar card
  calendarCard: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 24,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 3,
  },
  calNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  calNavBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: Colors.surfaceMuted,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  calNavArrow: {
    fontSize: 22,
    color: Colors.brand,
    fontWeight: '500',
    lineHeight: 26,
  },
  calNavTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  weekLabel: {
    width: `${100 / 7}%` as any,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textTertiary,
    paddingVertical: 4,
  },
  weekLabelWeekend: {
    color: Colors.orange,
  },
  calGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calCell: {
    width: `${100 / 7}%` as any,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 8,
    borderRadius: 12,
  },
  calCellToday: {
    backgroundColor: '#4A90E2',
  },
  calCellSelected: {
    backgroundColor: '#93C5FD',
  },
  calDayText: {
    fontSize: 14,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  calDayTextToday: {
    fontWeight: '800',
    color: '#fff',
  },
  calDayTextSelected: {
    fontWeight: '700',
    color: '#1E40AF',
  },
  calDots: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 3,
    height: 7,
    alignItems: 'center',
  },
  dotRoutine: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.orange,
  },
  dotAdhoc: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.brand,
  },
  legend: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },

  // Week summary
  weekSummary: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  weekSummaryTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  weekSummaryRow: {
    flexDirection: 'row',
    gap: 10,
  },
  weekSummaryStat: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
  },
  weekSummaryRoutine: {
    backgroundColor: Colors.surfaceOrange,
    borderColor: Colors.orangeLight + '55',
  },
  weekSummaryAdhoc: {
    backgroundColor: Colors.surfaceBrand,
    borderColor: Colors.brandLight + '35',
  },
  weekSummaryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  weekSummaryText: {
    flex: 1,
  },
  weekSummaryLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  weekSummaryNum: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
  },

  // Empty
  emptyCard: {
    backgroundColor: Colors.background,
    borderRadius: 18,
    padding: 28,
    alignItems: 'center',
  },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 6,
    textAlign: 'center',
  },
  emptyDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  emptyBtn: {
    backgroundColor: Colors.brand,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 11,
  },
  emptyBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },

  // Day detail
  dayDetail: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.borderLight,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 3,
  },
  dayDetailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  dayDetailTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  dayDetailCount: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  noDayRules: {
    padding: 20,
    alignItems: 'center',
  },
  noDayRulesText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 4,
  },
  noDayRulesSub: {
    fontSize: 12,
    color: Colors.textTertiary,
    textAlign: 'center',
  },
  recordsSection: {
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    backgroundColor: Colors.background,
  },
  recordsSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 2,
  },
  recordedBanner: {
    marginTop: 10,
    alignSelf: 'flex-start',
    borderRadius: 999,
    backgroundColor: Colors.successLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  recordedBannerText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.success,
  },
  recordLockedBanner: {
    marginTop: 10,
    alignSelf: 'flex-start',
    borderRadius: 999,
    backgroundColor: Colors.surfaceMuted,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  recordLockedText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  dayRuleCard: {
    padding: 16,
    borderLeftWidth: 4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  dayRuleTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 8,
  },
  dayRuleTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    lineHeight: 21,
  },
  dayRuleMeta: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: 8,
  },
  modeChip: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    flexShrink: 0,
  },
  modeChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  reminderPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    backgroundColor: Colors.surfaceBrand,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 10,
  },
  reminderText: {
    fontSize: 12,
    color: Colors.brandDark,
    fontWeight: '700',
  },
  recordBtn: {
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  recordBtnLoading: {
    opacity: 0.7,
  },
  recordBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  successBanner: {
    backgroundColor: Colors.successLight,
    borderRadius: 8,
    padding: 8,
    marginTop: 8,
    alignItems: 'center',
  },
  successText: {
    color: Colors.success,
    fontSize: 13,
    fontWeight: '600',
  },
})
