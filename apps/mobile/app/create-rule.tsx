import { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import * as Haptics from 'expo-haptics'
import { Colors } from '../constants/colors'
import { TimeWheelPicker } from '../components/TimeWheelPicker'
import { createRule, getRules } from '../lib/api'
import { useAuthStore } from '../lib/store'
import { createLocalRule, getLocalRules } from '../lib/local-mode'
import {
  buildScheduleConfig,
  buildObjective,
  CATEGORY_I18N_KEY,
  DAY_I18N_KEYS,
  DAYS,
  FREQ_I18N_KEY,
  getRuleScheduleSummary,
  RuleCategory,
  RuleFrequency,
  toDateOnlyString,
  WEEKDAY_INDICES,
  WEEKEND_INDICES,
} from '../lib/rules'
import { requestNotificationPermission, rescheduleAllReminders } from '../lib/notifications'
import { t } from '../lib/i18n'
import {
  decrementPointValue,
  incrementPointValue,
  MIN_POINT_VALUE,
  parsePointDraft,
  sanitizePointDraft,
} from '../lib/points'

const SUGGESTION_CATEGORY_ORDER: RuleCategory[] = [
  '連絡・共有', '予定変更', '感謝', '子育て', '家事分担', 'ふりかえり', '生活リズム',
]

const FREQ_KEYS: RuleFrequency[] = ['毎日', '毎週', '平日のみ', '週末', '毎月']

// ─── メイン ──────────────────────────────────────────────────

export default function CreateRuleScreen() {
  const router = useRouter()
  const coupleId = useAuthStore((s) => s.coupleId)
  const userId = useAuthStore((s) => s.userId)
  const isConnected = Boolean(coupleId)
  const { title: paramTitle } = useLocalSearchParams<{ title?: string }>()

  const [title, setTitle] = useState(typeof paramTitle === 'string' ? paramTitle : '')
  const mode = 'routine' as const
  const [category, setCategory] = useState<string | null>(null)
  const [freq, setFreq] = useState<RuleFrequency>('毎日')
  const [selectedDays, setSelectedDays] = useState<number[]>([])
  const [startDate, setStartDate] = useState(() => toDateOnlyString(new Date()))
  const [pointDraft, setPointDraft] = useState(String(MIN_POINT_VALUE))
  const [reminderEnabled, setReminderEnabled] = useState(false)
  const [reminderHour, setReminderHour] = useState(8)
  const [reminderMinute, setReminderMinute] = useState(0)
  const [reminderPickerVisible, setReminderPickerVisible] = useState(false)
  const [monthDay, setMonthDay] = useState(1)
  const [assignee, setAssignee] = useState<'self' | 'partner' | 'both'>(isConnected ? 'both' : 'self')
  const [recorder, setRecorder] = useState<'self' | 'partner'>('self')
  const [loading, setLoading] = useState(false)

  const reminderTime = reminderEnabled
    ? `${String(reminderHour).padStart(2, '0')}:${String(reminderMinute).padStart(2, '0')}`
    : null
  const pointValue = parsePointDraft(pointDraft)
  const scheduleObjective = buildObjective(mode, freq, selectedDays, monthDay)
  const scheduleConfig = buildScheduleConfig(mode, freq, selectedDays, monthDay, null)
  const scheduleSummary = getRuleScheduleSummary(mode, scheduleObjective, {
    startDate: startDate,
    recurrenceType: scheduleConfig.recurrenceType,
    recurrenceInterval: scheduleConfig.recurrenceInterval,
    daysOfWeek: scheduleConfig.daysOfWeek,
    dayOfMonth: scheduleConfig.dayOfMonth,
    timeOfDay: scheduleConfig.timeOfDay,
    reminderEnabled,
    reminderTime,
  }, t)

  function handleFreqChange(key: RuleFrequency) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setFreq(key)
    if (key === '平日のみ') setSelectedDays(WEEKDAY_INDICES)
    else if (key === '週末') setSelectedDays(WEEKEND_INDICES)
    else if (key === '毎日') setSelectedDays([])
    else setSelectedDays([])  // 毎週はユーザーが選ぶ
  }

  function toggleDay(index: number) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setSelectedDays((prev) =>
      prev.includes(index) ? prev.filter((d) => d !== index) : [...prev, index]
    )
  }

  const canSave = title.trim().length > 0 && (freq !== '毎週' || selectedDays.length > 0)

  async function handleToggleReminder(value: boolean) {
    if (value) {
      const granted = await requestNotificationPermission()
      if (!granted) {
        Alert.alert(t('rule.reminder_permission_title'), t('rule.reminder_permission'))
        return
      }
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setReminderEnabled(value)
  }

  async function handleCreate() {
    if (!canSave) return
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    setLoading(true)
    try {
      const payload = {
        title: title.trim(),
        mode,
        category: category ?? undefined,
        objective: scheduleObjective,
        start_date: mode === 'routine' ? startDate : undefined,
        recurrence_type: scheduleConfig.recurrenceType,
        recurrence_interval: scheduleConfig.recurrenceInterval,
        days_of_week: scheduleConfig.daysOfWeek.length > 0 ? scheduleConfig.daysOfWeek : null,
        day_of_month: scheduleConfig.dayOfMonth,
        time_of_day: scheduleConfig.timeOfDay,
        point_value: pointValue,
        threshold: 5,
        thank_you_threshold: 5,
        nobishiro_threshold: 3,
        assignee: isConnected ? assignee : 'self',
        recorder: isConnected ? recorder : 'self',
        reminder_enabled: reminderEnabled,
        reminder_time: reminderTime ?? undefined,
      }
      const created = coupleId
        ? await createRule(coupleId, payload)
        : await createLocalRule(payload, userId)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)

      if (reminderEnabled) {
        const allRules = coupleId
          ? (await getRules(coupleId)).items.filter((r) => r.active)
          : (await getLocalRules(userId)).filter((r) => r.active)
        await rescheduleAllReminders(allRules)
      }
      router.replace(`/(home)/promises?created=${created.id}`)
    } catch (e: any) {
      Alert.alert(t('common.confirm'), e.message ?? t('common.error_network'))
    } finally {
      setLoading(false)
    }
  }

  // 毎週で曜日未選択のときの警告
  const showDayWarning = mode === 'routine' && freq === '毎週' && selectedDays.length === 0

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* ヘッダー */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
          <Text style={styles.cancelText}>{t('common.cancel')}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('rule.create_title')}</Text>
        <TouchableOpacity onPress={handleCreate} disabled={!canSave || loading} activeOpacity={0.7}>
          {loading
            ? <ActivityIndicator size="small" color={Colors.brand} />
            : <Text style={[styles.saveText, !canSave && styles.saveDisabled]}>{t('common.save')}</Text>
          }
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        <View style={styles.formSection}>
          <Text style={styles.label}>{t('rule.content_label')}</Text>
          <TextInput
            style={styles.input}
            placeholder={t('rule.content_placeholder')}
            placeholderTextColor={Colors.textTertiary}
            value={title}
            onChangeText={setTitle}
            maxLength={50}
            autoFocus
            returnKeyType="done"
          />
          <Text style={styles.inputHint}>{t('rule.char_count', { n: title.length })}</Text>

          <Text style={[styles.label, styles.formLabelSpacing]}>{t('rule.category_label')}</Text>
          <Text style={styles.sectionHelper}>{t('rule.category_helper')}</Text>
          <View style={styles.categoryRow}>
            {SUGGESTION_CATEGORY_ORDER.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.categoryPill, category === cat && styles.categoryPillActive]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                  setCategory(category === cat ? null : cat)
                }}
                activeOpacity={0.8}
              >
                <Text style={[styles.categoryPillText, category === cat && styles.categoryPillTextActive]}>
                  {t(CATEGORY_I18N_KEY[cat])}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.label, styles.formLabelSpacing]}>{t('rule.point_label')}</Text>
          <View style={styles.stepper}>
            <TouchableOpacity
              style={[styles.stepperBtn, pointValue <= MIN_POINT_VALUE && styles.stepperBtnDisabled]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                setPointDraft(String(decrementPointValue(pointValue)))
              }}
              disabled={pointValue <= MIN_POINT_VALUE}
              activeOpacity={0.7}
            >
              <Text style={styles.stepperBtnText}>−</Text>
            </TouchableOpacity>
            <View style={styles.stepperValue}>
              <TextInput
                style={styles.stepperValueInput}
                value={pointDraft}
                onChangeText={(text) => setPointDraft(sanitizePointDraft(text))}
                onBlur={() => setPointDraft(String(parsePointDraft(pointDraft)))}
                keyboardType="number-pad"
                selectTextOnFocus
              />
              <Text style={styles.stepperValueUnit}>pt</Text>
            </View>
            <TouchableOpacity
              style={styles.stepperBtn}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                setPointDraft(String(incrementPointValue(pointValue)))
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.stepperBtnText}>＋</Text>
            </TouchableOpacity>
          </View>

          {isConnected ? (
            <>
              <Text style={[styles.label, styles.formLabelSpacing]}>{t('rule.assignee_label')}</Text>
              <View style={styles.segmentRow}>
                {(['self', 'partner', 'both'] as const).map((v) => (
                  <TouchableOpacity
                    key={v}
                    style={[styles.segmentBtn, assignee === v && styles.segmentBtnActive]}
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setAssignee(v) }}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.segmentBtnText, assignee === v && styles.segmentBtnTextActive]}>
                      {t(`rule.assignee_${v}` as any)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.sectionHelper}>
                {t(`rule.assignee_${assignee}_desc` as any)}
              </Text>
            </>
          ) : null}
        </View>

        {/* スケジュール設定（ルーティンのみ） */}
        {mode === 'routine' && (
          <View style={styles.formSection}>
            <Text style={styles.label}>{t('rule.schedule_label')}</Text>
            <Text style={styles.sectionHelper}>{t('rule.schedule_helper')}</Text>

            {/* 頻度ピル */}
            <View style={styles.freqPills}>
              {FREQ_KEYS.map((fk) => (
                <TouchableOpacity
                  key={fk}
                  style={[styles.pill, freq === fk && styles.pillActive]}
                  onPress={() => handleFreqChange(fk)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.pillText, freq === fk && styles.pillTextActive]}>
                    {t(FREQ_I18N_KEY[fk])}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* 曜日セレクター（毎週・平日のみ・週末で表示） */}
            {(freq === '毎週' || freq === '平日のみ' || freq === '週末') && (
              <View style={styles.daysSection}>
                <View style={styles.daysRow}>
                  {DAYS.map((_day, i) => {
                    const isSelected = selectedDays.includes(i)
                    const isWeekend = i >= 5
                    return (
                      <TouchableOpacity
                        key={i}
                        style={[
                          styles.dayBtn,
                          isSelected && styles.dayBtnActive,
                          isSelected && isWeekend && styles.dayBtnWeekend,
                        ]}
                        onPress={() => {
                          if (freq !== '毎週') {
                            setFreq('毎週')
                          }
                          toggleDay(i)
                        }}
                        activeOpacity={0.75}
                      >
                        <Text style={[
                          styles.dayText,
                          isSelected && styles.dayTextActive,
                          !isSelected && isWeekend && styles.dayTextWeekend,
                        ]}>
                          {t(DAY_I18N_KEYS[i])}
                        </Text>
                      </TouchableOpacity>
                    )
                  })}
                </View>

                {showDayWarning && (
                  <Text style={styles.dayWarning}>{t('rule.day_warning')}</Text>
                )}

                {selectedDays.length > 0 && (
                  <Text style={styles.daySummary}>
                    {t('rule.day_summary', { days: selectedDays.sort().map((idx) => t(DAY_I18N_KEYS[idx])).join('・') })}
                  </Text>
                )}
              </View>
            )}

            {/* 日付セレクター（毎月で表示） */}
            {freq === '毎月' && (
              <View style={styles.daysSection}>
                <Text style={styles.monthDayLabel}>{t('rule.month_day_label')}</Text>
                <View style={styles.monthDayGrid}>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                    <TouchableOpacity
                      key={d}
                      style={[styles.monthDayBtn, monthDay === d && styles.monthDayBtnActive]}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                        setMonthDay(d)
                      }}
                      activeOpacity={0.75}
                    >
                      <Text style={[styles.monthDayText, monthDay === d && styles.monthDayTextActive]}>
                        {d}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={styles.daySummary}>
                  {t('rule.month_day_summary', { day: monthDay })}
                </Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.formSection}>
          <View style={styles.reminderSection}>
            <View style={styles.reminderRow}>
              <View>
                <Text style={styles.label}>{t('rule.reminder_label')}</Text>
                </View>
              <Switch
                value={reminderEnabled}
                onValueChange={handleToggleReminder}
                trackColor={{ false: Colors.border, true: Colors.brand }}
                thumbColor="#fff"
              />
            </View>
            {reminderEnabled && (
              <TouchableOpacity
                style={styles.timeField}
                onPress={() => setReminderPickerVisible(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.timeFieldLabel}>{t('rule.reminder_time_label')}</Text>
                <Text style={styles.timeFieldValue}>
                  {String(reminderHour).padStart(2, '0')}:{String(reminderMinute).padStart(2, '0')}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.schedulePreviewCard}>
            <Text style={styles.schedulePreviewTitle}>{t('rule.preview_title')}</Text>
            <Text style={styles.schedulePreviewValue}>{scheduleSummary}</Text>
            <Text style={styles.schedulePreviewHint}>{t('rule.preview_routine_hint')}</Text>
          </View>
        </View>

      </ScrollView>

      <TimeWheelPicker
        visible={reminderPickerVisible}
        title={t('rule.reminder_time_label')}
        hour={reminderHour}
        minute={reminderMinute}
        onChangeHour={setReminderHour}
        onChangeMinute={setReminderMinute}
        onClose={() => setReminderPickerVisible(false)}
        onConfirm={() => setReminderPickerVisible(false)}
      />
    </KeyboardAvoidingView>
  )
}

// ─── スタイル ─────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  cancelText: { fontSize: 16, color: Colors.textSecondary },
  saveText: { fontSize: 16, fontWeight: '700', color: Colors.brand },
  saveDisabled: { color: Colors.disabled },
  body: { flex: 1 },
  bodyContent: { padding: 20, paddingBottom: 60 },
  formSection: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: 24,
  },
  formLabelSpacing: {
    marginTop: 24,
  },
  formLabelSpacingSmall: {
    marginTop: 20,
  },
  suggestionsSection: {
    gap: 4,
  },
  categoryHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 14,
    marginBottom: 6,
    paddingLeft: 2,
  },
  suggestionCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  suggestionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  suggestionDesc: {
    fontSize: 12,
    lineHeight: 17,
    color: Colors.textSecondary,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.textPrimary,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  inputHint: { fontSize: 12, color: Colors.textTertiary, textAlign: 'right', marginTop: 6 },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  categoryPillActive: { backgroundColor: Colors.brandLighter, borderColor: Colors.brand },
  categoryPillText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  categoryPillTextActive: { color: Colors.brandDark },
  modeRow: { flexDirection: 'row', gap: 12 },
  modeBtn: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  modeBtnActive: { borderColor: Colors.brand, backgroundColor: Colors.brandLighter },
  modeBtnTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, marginBottom: 4 },
  modeBtnTitleActive: { color: Colors.brandDark },
  modeBtnDesc: { fontSize: 12, color: Colors.textTertiary, lineHeight: 16 },
  modeBtnDescActive: { color: Colors.brand },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 0,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  stepperBtn: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  stepperBtnDisabled: { opacity: 0.3 },
  stepperBtnText: { fontSize: 22, fontWeight: '300', color: Colors.textPrimary },
  stepperValue: {
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
  stepperValueInput: {
    minWidth: 56,
    fontSize: 18,
    fontWeight: '800',
    color: Colors.brand,
    textAlign: 'center',
  },
  stepperValueUnit: { fontSize: 16, fontWeight: '700', color: Colors.brand },
  segmentRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  segmentBtn: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  segmentBtnActive: { borderColor: Colors.brand, backgroundColor: Colors.brandLighter },
  segmentBtnText: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  segmentBtnTextActive: { color: Colors.brandDark },
  repeatSection: { marginTop: 0 },
  sectionHelper: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: -2,
    marginBottom: 12,
  },
  scheduleCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  scheduleCardLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 6,
    fontWeight: '600',
  },
  scheduleCardValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  startDateControls: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  startDateQuick: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: Colors.backgroundSecondary,
  },
  startDateQuickText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  startDateStepper: {
    flexDirection: 'row',
    gap: 10,
  },
  startDateStepBtn: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 10,
    alignItems: 'center',
  },
  startDateStepText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.brandDark,
  },

  freqPills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  pillActive: { backgroundColor: Colors.brand, borderColor: Colors.brand },
  pillText: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  pillTextActive: { color: '#fff' },

  daysSection: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  daysRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dayBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayBtnActive: { backgroundColor: Colors.brand },
  dayBtnWeekend: { backgroundColor: '#f97316' },
  dayText: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  dayTextActive: { color: '#fff' },
  dayTextWeekend: { color: '#f97316' },
  dayWarning: { fontSize: 12, color: Colors.error, marginTop: 10, textAlign: 'center' },
  daySummary: {
    fontSize: 13,
    color: Colors.brand,
    marginTop: 10,
    textAlign: 'center',
    fontWeight: '600',
  },
  monthDayLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  monthDayGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  monthDayBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthDayBtnActive: { backgroundColor: Colors.brand },
  monthDayText: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  monthDayTextActive: { color: '#fff' },

  hint: { backgroundColor: Colors.brandLighter, borderRadius: 12, padding: 16, marginTop: 14 },
  hintTitle: { fontSize: 13, fontWeight: '700', color: Colors.brandDark, marginBottom: 6 },
  hintText: { fontSize: 13, color: Colors.brand, lineHeight: 22 },

  reminderSection: {
    marginTop: 0,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  reminderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reminderDesc: { fontSize: 12, color: Colors.textTertiary, marginTop: 2 },
  timeField: {
    marginTop: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.backgroundSecondary,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeFieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  timeFieldValue: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.4,
  },
  schedulePreviewCard: {
    marginTop: 14,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  schedulePreviewTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  schedulePreviewValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.brandDark,
    marginBottom: 6,
  },
  schedulePreviewHint: {
    fontSize: 12,
    lineHeight: 18,
    color: Colors.textSecondary,
  },
})
