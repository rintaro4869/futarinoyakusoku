import { useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native'
import { useRouter } from 'expo-router'
import * as Haptics from 'expo-haptics'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Colors } from '../constants/colors'
import { setTutorialSeen } from '../lib/storage'
import { t } from '../lib/i18n'

// ─── ミニUIモック ────────────────────────────────────────────

function MockHome() {
  return (
    <View style={mock.card}>
      <View style={mock.meter}>
        <View style={mock.meterLabelRow}>
          <Text style={mock.meterLabel}>{t('tutorial.mock_thankyou_points')}</Text>
          <Text style={[mock.meterVal, { color: Colors.brand }]}>30pt</Text>
        </View>
        <View style={mock.track}>
          <View style={[mock.fill, { width: '60%', backgroundColor: Colors.brand }]} />
        </View>
      </View>
      <View style={mock.meter}>
        <View style={mock.meterLabelRow}>
          <Text style={mock.meterLabel}>{t('tutorial.mock_promise_points')}</Text>
          <Text style={[mock.meterVal, { color: Colors.orange }]}>10pt</Text>
        </View>
        <View style={mock.track}>
          <View style={[mock.fill, { width: '20%', backgroundColor: Colors.orange }]} />
        </View>
      </View>
      <View style={mock.fabRow}>
        <View style={mock.fab}>
          <Text style={mock.fabText}>{t('tutorial.mock_record_cta')}</Text>
        </View>
        <View style={mock.arrow}>
          <Text style={mock.arrowText}>{t('tutorial.mock_point_here')}</Text>
        </View>
      </View>
    </View>
  )
}

function MockRecord() {
  return (
    <View style={mock.card}>
      <View style={mock.ruleChip}>
        <Text style={mock.ruleChipText}>{t('tutorial.mock_example_rule')}</Text>
      </View>
      <View style={mock.singleBtnWrap}>
        <Text style={mock.singleBtnLabel}>{t('tutorial.mock_routine_label')}</Text>
        <View style={mock.btnGood}>
          <Text style={mock.btnGoodText}>{t('tutorial.mock_routine_cta')}</Text>
          <Text style={mock.btnSub}>{t('tutorial.mock_routine_sub')}</Text>
        </View>
      </View>
      <View style={mock.singleBtnWrap}>
        <Text style={mock.singleBtnLabel}>{t('tutorial.mock_adhoc_label')}</Text>
        <View style={[mock.btnGood, { backgroundColor: Colors.orange }]}>
          <Text style={mock.btnGoodText}>{t('tutorial.mock_adhoc_cta')}</Text>
          <Text style={mock.btnSub}>{t('tutorial.mock_adhoc_sub')}</Text>
        </View>
      </View>
    </View>
  )
}

function MockRelease() {
  return (
    <View style={mock.card}>
      <View style={mock.meterFull}>
        <View style={mock.meterLabelRow}>
          <Text style={mock.meterLabel}>{t('tutorial.mock_thankyou_points')}</Text>
          <Text style={[mock.meterVal, { color: Colors.brand }]}>50pt</Text>
        </View>
        <View style={mock.track}>
          <View style={[mock.fill, { width: '100%', backgroundColor: Colors.brand }]} />
        </View>
        <View style={mock.releaseTag}>
          <Text style={mock.releaseTagText}>{t('tutorial.mock_reward_tag')}</Text>
        </View>
      </View>
      <Text style={mock.releaseDesc}>
        {t('tutorial.mock_reward_desc')}
      </Text>
    </View>
  )
}

function MockSummary() {
  const bars = [
    { label: t('tutorial.mock_summary_bar_1'), pct: '80%', color: Colors.brand },
    { label: t('tutorial.mock_summary_bar_2'), pct: '50%', color: Colors.orange },
    { label: t('tutorial.mock_summary_bar_3'), pct: '100%', color: '#8b5cf6' },
  ]
  return (
    <View style={mock.card}>
      <Text style={mock.summaryTitle}>{t('tutorial.mock_summary_title')}</Text>
      {bars.map((b) => (
        <View key={b.label} style={mock.summaryRow}>
          <Text style={mock.summaryLabel}>{b.label}</Text>
          <View style={[mock.track, { flex: 1, marginLeft: 8 }]}>
            <View style={[mock.fill, { width: b.pct as any, backgroundColor: b.color }]} />
          </View>
        </View>
      ))}
    </View>
  )
}

// ─── ステップ定義 ─────────────────────────────────────────────

const STEP_MOCKS = [MockHome, MockRecord, MockRelease, MockSummary] as const

// ─── メイン ──────────────────────────────────────────────────

export default function TutorialScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [step, setStep] = useState(0)

  const steps = [
    { title: t('tutorial.s1_title'), desc: t('tutorial.s1_desc'), Mock: STEP_MOCKS[0] },
    { title: t('tutorial.s2_title'), desc: t('tutorial.s2_desc'), Mock: STEP_MOCKS[1] },
    { title: t('tutorial.s3_title'), desc: t('tutorial.s3_desc'), Mock: STEP_MOCKS[2] },
    { title: t('tutorial.s4_title'), desc: t('tutorial.s4_desc'), Mock: STEP_MOCKS[3] },
  ]

  function goNext() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setStep((s) => s + 1)
  }

  function goPrev() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setStep((s) => s - 1)
  }

  async function handleFinish() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    await setTutorialSeen()
    router.replace('/(home)')
  }

  const current = steps[step]
  const isLast = step === steps.length - 1

  return (
    <View style={styles.container}>
      {/* ヘッダー */}
      <View style={styles.header}>
        <View style={{ paddingTop: insets.top + 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={styles.headerTitle}>{t('tutorial.title')}</Text>
        <Text style={styles.progress}>{t('tutorial.progress', { current: step + 1, total: steps.length })}</Text>
        </View>
      </View>

      {/* ドット */}
      <View style={styles.dotsRow}>
        {steps.map((_, i) => (
          <View key={i} style={[styles.dot, i === step && styles.dotActive]} />
        ))}
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        {/* ステップ見出しバッジ */}
        <View style={styles.stepBadge}>
          <Text style={styles.stepBadgeText}>{current.title}</Text>
        </View>

        {/* UIモック */}
        <current.Mock />

        {/* 説明テキスト */}
        <View style={styles.textBlock}>
          <Text style={styles.stepDesc}>{current.desc}</Text>
        </View>
      </ScrollView>

      {/* フッター */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) + 12 }]}>
        {step > 0 ? (
          <TouchableOpacity style={styles.prevBtn} onPress={goPrev} activeOpacity={0.7}>
            <Text style={styles.prevBtnText}>{t('common.prev')}</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.prevBtn} />
        )}

        {isLast ? (
          <TouchableOpacity style={styles.finishBtn} onPress={handleFinish} activeOpacity={0.85}>
            <Text style={styles.finishBtnText}>{t('common.start')}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.nextBtn} onPress={goNext} activeOpacity={0.85}>
            <Text style={styles.nextBtnText}>{t('common.next')}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

// ─── スタイル ─────────────────────────────────────────────────

const mock = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
  },
  meter: {
    marginBottom: 16,
  },
  meterFull: {
    marginBottom: 12,
  },
  meterLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  meterLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  meterVal: {
    fontSize: 13,
    fontWeight: '700',
  },
  track: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#f3f4f6',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
  },
  fabRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 16,
    gap: 10,
  },
  fab: {
    backgroundColor: Colors.brand,
    borderRadius: 22,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  fabText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  arrow: {
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  arrowText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400e',
  },
  ruleChip: {
    backgroundColor: Colors.brandLighter,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  ruleChipText: {
    fontSize: 13,
    color: Colors.brandDark,
    fontWeight: '600',
  },
  singleBtnWrap: {
    marginBottom: 10,
  },
  singleBtnLabel: {
    fontSize: 11,
    color: '#374151',
    fontWeight: '700',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  btnGood: {
    flex: 1,
    backgroundColor: Colors.brand,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnGoodText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  btnNobi: {
    flex: 1,
    backgroundColor: Colors.orangeLighter,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.orangeLight,
  },
  btnNobiText: {
    color: Colors.orangeDark,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  btnSub: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '700',
  },
  releaseTag: {
    backgroundColor: Colors.brandLighter,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignSelf: 'flex-start',
    marginTop: 10,
  },
  releaseTagText: {
    fontSize: 13,
    color: Colors.brandDark,
    fontWeight: '700',
  },
  releaseDesc: {
    fontSize: 13,
    color: '#374151',
    marginTop: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#4b5563',
    width: 110,
  },
})

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  progress: {
    fontSize: 14,
    color: '#4b5563',
    fontWeight: '600',
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 20,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#e5e7eb',
  },
  dotActive: {
    width: 20,
    backgroundColor: Colors.brand,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 20,
  },
  stepBadge: {
    backgroundColor: Colors.brandLighter,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  stepBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.brandDark,
  },
  textBlock: {
    paddingHorizontal: 4,
  },
  stepDesc: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 24,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    backgroundColor: '#fff',
  },
  prevBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  prevBtnText: {
    color: '#59606c',
    fontSize: 15,
    fontWeight: '600',
  },
  nextBtn: {
    flex: 2,
    borderWidth: 1.5,
    borderColor: Colors.brand,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  nextBtnText: {
    color: Colors.brand,
    fontSize: 16,
    fontWeight: '700',
  },
  finishBtn: {
    flex: 2,
    backgroundColor: Colors.brand,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: Colors.brand,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  finishBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
})
