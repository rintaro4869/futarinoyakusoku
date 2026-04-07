import { useCallback, useEffect, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
  TextInput,
  Modal,
} from 'react-native'
import { useFocusEffect } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import * as Haptics from 'expo-haptics'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../constants/colors'
import { TabRibbonHeader } from '../../components/TabRibbonHeader'
import { getHomeSummary, HomeSummary } from '../../lib/api'
import { RewardHeroArtwork } from '../../components/PairlogArtwork'
import { RewardCelebrationModal } from '../../components/RewardCelebrationModal'
import { RewardUseModal } from '../../components/RewardUseModal'
import { useAuthStore } from '../../lib/store'
import {
  buildRewardProgress,
  getRewardTotals,
  normalizeRewardAssignee,
  RewardAssignee,
  RewardProgress,
} from '../../lib/reward-progress'
import {
  clearRewardUnlockSeen,
  getRewards,
  getSeenRewardUnlocks,
  markRewardUnlockSeen,
  setRewards,
  StoredReward,
} from '../../lib/storage'
import { t, getLocaleTag } from '../../lib/i18n'
import {
  decrementPointValue,
  incrementPointValue,
  MIN_POINT_VALUE,
  parsePointDraft,
  sanitizePointDraft,
} from '../../lib/points'

const REWARD_EXAMPLE_DEFS = [
  { key: 'rewards.example_tea', points: 10, type: 'total' as const },
  { key: 'rewards.example_takeout', points: 20, type: 'total' as const },
  { key: 'rewards.example_alone_time', points: 10, type: 'promise' as const },
  { key: 'rewards.example_movie', points: 20, type: 'total' as const },
  { key: 'rewards.example_date_plan', points: 30, type: 'thankyou' as const },
  { key: 'rewards.example_snack', points: 10, type: 'total' as const },
  { key: 'rewards.example_early_sleep', points: 10, type: 'promise' as const },
  { key: 'rewards.example_thanks_time', points: 20, type: 'thankyou' as const },
]

function getRewardExamples() {
  return REWARD_EXAMPLE_DEFS.map((d) => ({ name: t(d.key), points: d.points, type: d.type }))
}

type RewardExample = ReturnType<typeof getRewardExamples>[number]

function getPointTypeLabel(type: string): string {
  if (type === 'promise') return t('rewards.create_point_type_promise')
  if (type === 'thankyou') return t('rewards.create_point_type_thankyou')
  return t('rewards.create_point_type_total')
}

function getPointTypeColor(type: string) {
  if (type === 'promise') return Colors.orange
  if (type === 'thankyou') return Colors.brand
  return Colors.brandDark
}

function getRewardAudienceLabel(assignee: RewardAssignee, summary: HomeSummary | null): string {
  if (assignee === 'both') return t('points.segment_pair')
  if (assignee === 'self') return summary?.my_name ?? ''
  return summary?.partner_name ?? ''
}

function formatRewardUsedDate(usedAt?: string): string | null {
  if (!usedAt) return null
  const date = new Date(usedAt)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleDateString(getLocaleTag(), { month: 'numeric', day: 'numeric' })
}

export default function RewardsScreen() {
  const coupleId = useAuthStore((s) => s.coupleId)
  const isConnected = !!coupleId
  const [rewards, setLocalRewards] = useState<StoredReward[]>([])
  const [summary, setSummary] = useState<HomeSummary | null>(null)
  const [seenUnlocks, setSeenUnlocks] = useState<string[]>([])
  const [celebrationReward, setCelebrationReward] = useState<RewardProgress | null>(null)
  const [usedReward, setUsedReward] = useState<StoredReward | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newPointsDraft, setNewPointsDraft] = useState(String(MIN_POINT_VALUE))
  const [newType, setNewType] = useState<'promise' | 'thankyou' | 'total'>('total')
  const [newAssignee, setNewAssignee] = useState<RewardAssignee>(isConnected ? 'both' : 'self')
  const [activeAssignee, setActiveAssignee] = useState<RewardAssignee>(isConnected ? 'both' : 'self')
  const newPoints = parsePointDraft(newPointsDraft)

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)

    try {
      const [stored, seen] = await Promise.all([getRewards(), getSeenRewardUnlocks()])
      setLocalRewards(stored)
      setSeenUnlocks(seen)
      if (coupleId) {
        const s = await getHomeSummary(coupleId)
        setSummary(s)
      } else {
        setSummary(null)
      }
    } catch {
      // Keep the screen calm even if storage/API temporarily fails.
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [coupleId])

  useFocusEffect(
    useCallback(() => {
      load()
    }, [load])
  )

  useEffect(() => {
    if (!isConnected) {
      setNewAssignee('self')
      setActiveAssignee('self')
    }
  }, [isConnected])

  async function saveRewards(updated: StoredReward[]) {
    setLocalRewards(updated)
    await setRewards(updated)
  }

  function handleCreateReward() {
    if (!newName.trim()) return

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    const baseline = totals[newAssignee]
    const reward: StoredReward = {
      id: Date.now().toString(),
      name: newName.trim(),
      pointsRequired: newPoints,
      pointType: newType,
      assignee: newAssignee,
      baselinePoints: baseline,
      status: 'locked',
      createdAt: new Date().toISOString(),
    }

    void saveRewards([...rewards, reward])
    setShowCreate(false)
    setNewName('')
    setNewPointsDraft(String(MIN_POINT_VALUE))
    setNewType('total')
    setNewAssignee(isConnected ? activeAssignee : 'self')
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
  }

  function handleCreateFromExample(example: RewardExample) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setNewName(example.name)
    setNewPointsDraft(String(example.points))
    setNewType(example.type)
    setNewAssignee(isConnected ? activeAssignee : 'self')
    setShowCreate(true)
  }

  async function handleUnlock(reward: StoredReward) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    const updated = rewards.map((r) =>
      r.id === reward.id ? { ...r, status: 'unlocked' as const } : r
    )
    await saveRewards(updated)
    await markRewardUnlockSeen(reward.id)
    setSeenUnlocks((prev) => (prev.includes(reward.id) ? prev : [...prev, reward.id]))
    if (celebrationReward?.id === reward.id) setCelebrationReward(null)
  }

  function handleUse(reward: StoredReward) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    setUsedReward(reward)
  }

  function handleReset(reward: StoredReward) {
    Alert.alert(t('rewards.reset'), `「${reward.name}」`, [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('rewards.reset'),
        onPress: () => {
          void (async () => {
            const updated = rewards.map((r) =>
              r.id === reward.id ? { ...r, status: 'locked' as const } : r
            )
            await saveRewards(updated)
            await clearRewardUnlockSeen(reward.id)
            setSeenUnlocks((prev) => prev.filter((id) => id !== reward.id))
          })()
        },
      },
    ])
  }

  function handleDelete(reward: StoredReward) {
    Alert.alert(t('common.delete'), `「${reward.name}」`, [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => {
          void (async () => {
            const updated = rewards.filter((r) => r.id !== reward.id)
            await saveRewards(updated)
            await clearRewardUnlockSeen(reward.id)
            setSeenUnlocks((prev) => prev.filter((id) => id !== reward.id))
          })()
        },
      },
    ])
  }

  const activeRewards = rewards.filter((r) => r.status !== 'used')
  const usedRewards = rewards.filter((r) => r.status === 'used')
  const totals = getRewardTotals(summary)
  const activeTotals = totals[activeAssignee]
  const rewardProgress = buildRewardProgress(activeRewards, totals, isConnected)
  const visibleRewards = rewardProgress.filter((reward) => reward.assignee === activeAssignee)
  const visibleUsedRewards = usedRewards.filter(
    (reward) => normalizeRewardAssignee(reward, isConnected) === activeAssignee
  ).sort((a, b) => {
    const aTime = new Date(a.usedAt ?? a.createdAt).getTime()
    const bTime = new Date(b.usedAt ?? b.createdAt).getTime()
    return bTime - aTime
  })
  const readyRewards = visibleRewards.filter((reward) => reward.unlockable)
  const nextReward = visibleRewards
    .filter((reward) => !reward.unlockable)
    .sort((a, b) => a.remaining - b.remaining)[0]

  useEffect(() => {
    if (celebrationReward) return
    const nextUnlocked = visibleRewards.find(
      (reward) => reward.unlockable && reward.status === 'locked' && !seenUnlocks.includes(reward.id)
    )
    if (nextUnlocked) {
      setCelebrationReward(nextUnlocked)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    }
  }, [celebrationReward, seenUnlocks, visibleRewards])

  async function closeCelebration() {
    if (!celebrationReward) return
    await markRewardUnlockSeen(celebrationReward.id)
    setSeenUnlocks((prev) =>
      prev.includes(celebrationReward.id) ? prev : [...prev, celebrationReward.id]
    )
    setCelebrationReward(null)
  }

  async function unlockFromCelebration() {
    if (!celebrationReward) return
    await handleUnlock(celebrationReward)
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
      <TabRibbonHeader
        title={t('rewards.title')}
        rightSlot={
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => {
              setNewAssignee(isConnected ? activeAssignee : 'self')
              setShowCreate(true)
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={16} color={Colors.brandDark} />
            <Text style={styles.addBtnText}>{t('common.add')}</Text>
          </TouchableOpacity>
        }
      />

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
        {isConnected && (
          <View style={styles.segmentWrap}>
            <View style={styles.segmentRail}>
              {([
                { key: 'both' as const, label: getRewardAudienceLabel('both', summary) },
                { key: 'self' as const, label: getRewardAudienceLabel('self', summary) },
                { key: 'partner' as const, label: getRewardAudienceLabel('partner', summary) },
              ]).map((option) => {
                const isActive = activeAssignee === option.key
                return (
                  <TouchableOpacity
                    key={option.key}
                    style={[styles.segmentOption, isActive && styles.segmentOptionActive]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                      setActiveAssignee(option.key)
                    }}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[styles.segmentOptionText, isActive && styles.segmentOptionTextActive]}
                      numberOfLines={1}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                )
              })}
            </View>
          </View>
        )}

        <LinearGradient
          colors={['#fff8f1', '#fff6fb']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.heroTopRow}>
            <View style={styles.heroTextWrap}>
              <Text style={styles.heroEyebrow}>{t('rewards.subtitle')}</Text>
              <Text style={styles.heroTitle}>{t('rewards.hero_title')}</Text>
            </View>
            <RewardHeroArtwork />
          </View>

          <View style={styles.heroStatsRow}>
            <View style={styles.heroStatCard}>
              <Text
                style={styles.heroStatLabel}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.82}
              >
                {t('rewards.hero_stat_promise')}
              </Text>
              <Text style={styles.heroStatValue}>{activeTotals.promise}pt</Text>
            </View>
            <View style={styles.heroStatCard}>
              <Text
                style={styles.heroStatLabel}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.82}
              >
                {t('rewards.hero_stat_thankyou')}
              </Text>
              <Text style={styles.heroStatValue}>{activeTotals.thankyou}pt</Text>
            </View>
            <View style={styles.heroStatCard}>
              <Text
                style={styles.heroStatLabel}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.82}
              >
                {t('rewards.hero_stat_total')}
              </Text>
              <Text style={styles.heroStatValue}>{activeTotals.total}pt</Text>
            </View>
          </View>

          <View style={styles.heroHintCard}>
            <Ionicons
              name={readyRewards.length > 0 ? 'sparkles' : 'gift-outline'}
              size={18}
              color={readyRewards.length > 0 ? Colors.orangeDark : Colors.brandDark}
            />
            <Text style={styles.heroHintText}>
              {readyRewards.length > 0
                ? t('rewards.hint_ready', { n: readyRewards.length })
                : nextReward
                  ? t('rewards.hint_next', { n: nextReward.remaining })
                  : t('home.reward_empty_sub')}
            </Text>
          </View>
        </LinearGradient>

        {visibleRewards.length > 0 ? (
          <View>
            {visibleRewards.map((reward) => {
              const progress = Math.min(reward.current / reward.pointsRequired, 1)
              const remaining = reward.remaining
              const isUnlockable = reward.status === 'locked' && reward.current >= reward.pointsRequired
              const isUnlocked = reward.status === 'unlocked'
              const color = getPointTypeColor(reward.pointType)
              const gradientColors: [string, string] =
                reward.pointType === 'promise'
                  ? ['#fff6ec', '#ffffff']
                  : reward.pointType === 'thankyou'
                    ? ['#fff5fa', '#ffffff']
                    : ['#fff8f1', '#fff5fa']

              return (
                <View key={reward.id} style={styles.rewardCard}>
                  <LinearGradient
                    colors={gradientColors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.rewardHeroBand}
                  >
                    <View style={[styles.rewardBlob, styles.rewardBlobTop, { backgroundColor: color + '16' }]} />
                    <View style={[styles.rewardBlob, styles.rewardBlobBottom, { backgroundColor: color + '12' }]} />
                    <View style={styles.rewardHeroRow}>
                      <View style={styles.rewardHeroTextWrap}>
                        <Text style={styles.rewardHeroEyebrow}>{getPointTypeLabel(reward.pointType)}</Text>
                        <Text style={styles.rewardName} numberOfLines={2}>{reward.name}</Text>
                      </View>
                      <View style={[styles.rewardBadgeBubble, { borderColor: color + '30' }]}>
                        <Ionicons
                          name={isUnlockable || isUnlocked ? 'sparkles' : 'gift-outline'}
                          size={18}
                          color={color}
                        />
                      </View>
                    </View>
                  </LinearGradient>

                  <View style={styles.rewardHeader}>
                    <View style={styles.rewardHeaderText}>
                      <View
                        style={[
                          styles.rewardStatusPill,
                          isUnlocked ? styles.rewardStatusUnlocked : styles.rewardStatusLocked,
                        ]}
                      >
                        <Text
                          style={[
                            styles.rewardStatusText,
                            isUnlocked ? styles.rewardStatusUnlockedText : styles.rewardStatusLockedText,
                          ]}
                        >
                          {isUnlocked
                            ? t('rewards.status_unlocked')
                            : t('rewards.status_locked', { n: remaining })}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleDelete(reward)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      style={styles.rewardMenuBtn}
                    >
                      <Ionicons name="ellipsis-horizontal" size={16} color={Colors.textTertiary} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.progressMetricsRow}>
                    <View style={styles.progressMetricCard}>
                      <Text style={styles.progressMetricLabel}>{t('rewards.metric_owned')}</Text>
                      <Text style={[styles.progressMetricValue, { color }]}>{reward.current}pt</Text>
                    </View>
                    <View style={styles.progressMetricCard}>
                      <Text style={styles.progressMetricLabel}>{t('rewards.metric_required')}</Text>
                      <Text style={styles.progressMetricValue}>{reward.pointsRequired}pt</Text>
                    </View>
                    <View style={styles.progressMetricCard}>
                      <Text style={styles.progressMetricLabel}>{t('rewards.metric_remaining')}</Text>
                      <Text style={[styles.progressMetricValue, { color }]}>{remaining}pt</Text>
                    </View>
                  </View>

                  <View style={styles.progressTrack}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${progress * 100}%` as const, backgroundColor: color },
                      ]}
                    />
                  </View>

                  {isUnlockable && (
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: color }]}
                      onPress={() => void handleUnlock(reward)}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.actionBtnText}>{t('rewards.unlock')} 🎉</Text>
                    </TouchableOpacity>
                  )}

                  {isUnlocked && (
                    <View style={styles.unlockedRow}>
                      <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: color, flex: 1 }]}
                        onPress={() => void handleUse(reward)}
                        activeOpacity={0.85}
                      >
                        <Text style={styles.actionBtnText}>{t('rewards.use')}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.resetBtn}
                        onPress={() => handleReset(reward)}
                        activeOpacity={0.75}
                      >
                        <Text style={styles.resetBtnText}>{t('rewards.reset')}</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )
            })}
          </View>
        ) : rewardProgress.length > 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>🎁</Text>
            <Text style={styles.emptyTitle}>{t('rewards.filtered_empty_title')}</Text>
            <Text style={styles.emptyDesc}>{t('rewards.filtered_empty_desc')}</Text>
            <TouchableOpacity
              style={styles.emptyCta}
              onPress={() => {
                setNewAssignee(activeAssignee)
                setShowCreate(true)
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.emptyCtaText}>{t('rewards.empty_cta')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>🎁</Text>
            <Text style={styles.emptyTitle}>{t('rewards.empty_title')}</Text>
            <Text style={styles.emptyDesc}>{t('rewards.empty_desc')}</Text>
            <TouchableOpacity
              style={styles.emptyCta}
              onPress={() => setShowCreate(true)}
              activeOpacity={0.85}
            >
              <Text style={styles.emptyCtaText}>{t('rewards.empty_cta')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {visibleUsedRewards.length > 0 && (
          <View style={styles.usedSection}>
            <Text style={[styles.sectionTitle, { color: Colors.textTertiary }]}>{t('rewards.status_used')}</Text>
            {visibleUsedRewards.map((reward) => {
              const usedDate = formatRewardUsedDate(reward.usedAt)
              return (
                <View key={reward.id} style={[styles.rewardCard, styles.usedCard]}>
                  <View style={styles.usedHeaderRow}>
                    <Text style={styles.usedName}>{reward.name}</Text>
                    <Text style={styles.usedLabel}>{t('rewards.status_used')} ✓</Text>
                  </View>
                  <Text style={styles.usedMeta}>
                    {getRewardAudienceLabel(normalizeRewardAssignee(reward, isConnected), summary)}
                    {' ・ '}
                    {t('rewards.used_meta', {
                      type: getPointTypeLabel(reward.pointType),
                      points: reward.pointsRequired,
                    })}
                  </Text>
                  {usedDate ? (
                    <Text style={styles.usedDate}>
                      {t('rewards.used_on', { date: usedDate })}
                    </Text>
                  ) : null}
                </View>
              )
            })}
          </View>
        )}

        <View style={styles.examplesSection}>
          <Text style={styles.sectionTitle}>{t('rewards.examples_section')}</Text>
          <Text style={styles.sectionHint}>{t('rewards.examples_hint')}</Text>
          {getRewardExamples().map((example, index) => {
            const color = getPointTypeColor(example.type)
            return (
              <TouchableOpacity
                key={`${example.name}-${index}`}
                style={styles.exampleCard}
                onPress={() => handleCreateFromExample(example)}
                activeOpacity={0.8}
              >
                <View style={[styles.exampleAccent, { backgroundColor: color }]} />
                <View style={styles.exampleBody}>
                  <Text style={styles.exampleName}>{example.name}</Text>
                  <Text style={styles.exampleMeta}>
                    {getPointTypeLabel(example.type)} • {example.points}pt
                  </Text>
                </View>
                <Ionicons name="add-circle-outline" size={18} color={Colors.brandDark} style={styles.exampleArrow} />
              </TouchableOpacity>
            )
          })}
        </View>

        <View style={styles.bottomPad} />
      </ScrollView>

      <Modal visible={showCreate} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowCreate(false)} activeOpacity={0.7}>
                <Text style={styles.modalCancel}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>{t('rewards.create_title')}</Text>
              <TouchableOpacity
                onPress={handleCreateReward}
                disabled={!newName.trim()}
                activeOpacity={0.7}
              >
                <Text style={[styles.modalSave, !newName.trim() && styles.modalSaveDisabled]}>
                  {t('common.save')}
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.modalLabel}>{t('rewards.create_name_label')}</Text>
              <TextInput
                style={styles.modalInput}
                placeholder={t('rewards.create_name_placeholder')}
                placeholderTextColor={Colors.textTertiary}
                value={newName}
                onChangeText={setNewName}
                maxLength={30}
                autoFocus
              />

              <Text style={[styles.modalLabel, { marginTop: 24 }]}>{t('rewards.create_points_label')}</Text>
              <View style={styles.pointsRow}>
                {[10, 20, 30, 40, 50, 60].map((value) => (
                  <TouchableOpacity
                    key={value}
                    style={[styles.pointsPill, newPoints === value && styles.pointsPillActive]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                      setNewPointsDraft(String(value))
                    }}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.pointsPillText,
                        newPoints === value && styles.pointsPillTextActive,
                      ]}
                    >
                      {value}pt
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.pointStepper}>
                <TouchableOpacity
                  style={[styles.pointStepperBtn, newPoints <= MIN_POINT_VALUE && styles.pointStepperBtnDisabled]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                    setNewPointsDraft(String(decrementPointValue(newPoints)))
                  }}
                  disabled={newPoints <= MIN_POINT_VALUE}
                  activeOpacity={0.7}
                >
                  <Text style={styles.pointStepperBtnText}>−</Text>
                </TouchableOpacity>
                <View style={styles.pointStepperValue}>
                  <TextInput
                    style={styles.pointStepperValueInput}
                    value={newPointsDraft}
                    onChangeText={(text) => setNewPointsDraft(sanitizePointDraft(text))}
                    onBlur={() => setNewPointsDraft(String(parsePointDraft(newPointsDraft)))}
                    keyboardType="number-pad"
                    selectTextOnFocus
                  />
                  <Text style={styles.pointStepperValueUnit}>pt</Text>
                </View>
                <TouchableOpacity
                  style={styles.pointStepperBtn}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                    setNewPointsDraft(String(incrementPointValue(newPoints)))
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.pointStepperBtnText}>＋</Text>
                </TouchableOpacity>
              </View>

              {isConnected && (
                <>
                  <Text style={[styles.modalLabel, { marginTop: 24 }]}>
                    {t('rewards.create_assignee_label')}
                  </Text>
                  <View style={styles.typeRow}>
                    {([
                      {
                        key: 'self' as const,
                        label: t('rewards.create_assignee_self'),
                        color: Colors.brandDark,
                      },
                      {
                        key: 'partner' as const,
                        label: t('rewards.create_assignee_partner'),
                        color: Colors.brand,
                      },
                      {
                        key: 'both' as const,
                        label: t('rewards.create_assignee_both'),
                        color: Colors.orange,
                      },
                    ]).map((option) => (
                      <TouchableOpacity
                        key={option.key}
                        style={[
                          styles.typeBtn,
                          newAssignee === option.key && {
                            borderColor: option.color,
                            backgroundColor: option.color + '15',
                          },
                        ]}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                          setNewAssignee(option.key)
                        }}
                        activeOpacity={0.8}
                      >
                        <View style={[styles.typeDot, { backgroundColor: option.color }]} />
                        <Text
                          style={[
                            styles.typeBtnText,
                            newAssignee === option.key && { color: option.color, fontWeight: '700' },
                          ]}
                        >
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <Text style={styles.sectionHelper}>
                    {t(`rewards.create_assignee_${newAssignee}_desc`)}
                  </Text>
                </>
              )}

              <Text style={[styles.modalLabel, { marginTop: 24 }]}>{t('rewards.create_point_type_label')}</Text>
              <View style={styles.typeRow}>
                {([
                  { key: 'promise' as const, label: t('rewards.create_point_type_promise'), color: Colors.orange },
                  { key: 'thankyou' as const, label: t('rewards.create_point_type_thankyou'), color: Colors.brand },
                  { key: 'total' as const, label: t('rewards.create_point_type_total'), color: Colors.brandDark },
                ]).map((option) => (
                  <TouchableOpacity
                    key={option.key}
                    style={[
                      styles.typeBtn,
                      newType === option.key && {
                        borderColor: option.color,
                        backgroundColor: option.color + '15',
                      },
                    ]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                      setNewType(option.key)
                    }}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.typeDot, { backgroundColor: option.color }]} />
                    <Text
                      style={[
                        styles.typeBtnText,
                        newType === option.key && { color: option.color, fontWeight: '700' },
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.sectionHelper}>{t('rewards.create_count_from_now')}</Text>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <RewardCelebrationModal
        visible={!!celebrationReward}
        rewardName={celebrationReward?.name ?? ''}
        remaining={celebrationReward?.remaining ?? 0}
        onClose={() => void closeCelebration()}
        onPrimary={() => void unlockFromCelebration()}
        primaryLabel={t('rewards.unlock')}
      />
      <RewardUseModal
        visible={!!usedReward}
        rewardName={usedReward?.name ?? ''}
        onCancel={() => {
          setUsedReward(null)
        }}
        onConfirm={() => {
          if (usedReward) {
            const updated = rewards.map((r) =>
              r.id === usedReward.id
                ? { ...r, status: 'used' as const, usedAt: new Date().toISOString() }
                : r
            )
            void saveRewards(updated)
          }
          setUsedReward(null)
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
        }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.backgroundSecondary },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.backgroundSecondary },
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
  addBtnText: { fontSize: 13, fontWeight: '700', color: Colors.brandDark },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  segmentWrap: {
    marginBottom: 12,
  },
  segmentRail: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 22,
    backgroundColor: '#efe8e2',
  },
  segmentOption: {
    flex: 1,
    minHeight: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  segmentOptionActive: {
    backgroundColor: Colors.surfaceElevated,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
  segmentOptionText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  segmentOptionTextActive: {
    color: Colors.textPrimary,
  },
  heroCard: {
    borderRadius: 26,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.07,
    shadowRadius: 20,
    elevation: 4,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  heroTextWrap: {
    flex: 1,
    paddingTop: 4,
  },
  heroEyebrow: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.brandDark,
    marginBottom: 8,
  },
  heroTitle: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  heroStatsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  heroStatCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.76)',
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  heroStatLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '700',
    marginBottom: 6,
    minHeight: 14,
  },
  heroStatValue: {
    fontSize: 20,
    color: Colors.textPrimary,
    fontWeight: '800',
  },
  heroHintCard: {
    marginTop: 12,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.78)',
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  heroHintText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 10,
  },
  sectionHint: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: -6,
    marginBottom: 10,
  },
  sectionHelper: {
    fontSize: 13,
    lineHeight: 19,
    color: Colors.textSecondary,
    marginTop: 8,
  },
  rewardCard: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 22,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 3,
  },
  rewardHeroBand: {
    borderRadius: 18,
    padding: 16,
    overflow: 'hidden',
    marginBottom: 12,
  },
  rewardBlob: {
    position: 'absolute',
    borderRadius: 999,
  },
  rewardBlobTop: {
    width: 82,
    height: 82,
    top: -20,
    right: -8,
  },
  rewardBlobBottom: {
    width: 54,
    height: 54,
    bottom: -10,
    left: -8,
  },
  rewardHeroRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  rewardHeroTextWrap: {
    flex: 1,
  },
  rewardHeroEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  rewardBadgeBubble: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.88)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  rewardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10,
  },
  rewardHeaderText: { flex: 1 },
  rewardName: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
    lineHeight: 25,
  },
  rewardMenuBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rewardStatusPill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  rewardStatusLocked: {
    backgroundColor: Colors.surfaceMuted,
  },
  rewardStatusUnlocked: {
    backgroundColor: Colors.successLight,
  },
  rewardStatusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  rewardStatusLockedText: {
    color: Colors.textSecondary,
  },
  rewardStatusUnlockedText: {
    color: Colors.success,
  },
  progressMetricsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  progressMetricCard: {
    flex: 1,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  progressMetricLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '700',
    marginBottom: 4,
  },
  progressMetricValue: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  progressTrack: {
    height: 11,
    borderRadius: 999,
    backgroundColor: Colors.surfaceMuted,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: { height: '100%', borderRadius: 5 },
  actionBtn: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  actionBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  unlockedRow: { flexDirection: 'row', gap: 10 },
  resetBtn: {
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 18,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  resetBtnText: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  usedSection: {
    marginTop: 20,
  },
  usedCard: {
    backgroundColor: Colors.background,
    borderStyle: 'dashed',
  },
  usedHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  usedName: { fontSize: 15, fontWeight: '600', color: Colors.textSecondary },
  usedLabel: { fontSize: 12, color: Colors.textTertiary },
  usedMeta: {
    fontSize: 12,
    lineHeight: 18,
    color: Colors.textSecondary,
    marginTop: 8,
  },
  usedDate: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: 4,
  },
  emptyCard: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 3,
  },
  emptyIcon: { fontSize: 44, marginBottom: 14 },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  emptyCta: {
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
  emptyCtaText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  examplesSection: {
    marginTop: 24,
  },
  exampleCard: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 18,
    marginBottom: 8,
    flexDirection: 'row',
    overflow: 'hidden',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  exampleAccent: { width: 4, alignSelf: 'stretch' },
  exampleBody: { flex: 1, padding: 14, paddingLeft: 12 },
  exampleName: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary, marginBottom: 3 },
  exampleMeta: { fontSize: 12, color: Colors.textSecondary },
  exampleArrow: { marginRight: 14 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  modalTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  modalCancel: { fontSize: 16, color: Colors.textSecondary },
  modalSave: { fontSize: 16, fontWeight: '700', color: Colors.brand },
  modalSaveDisabled: { color: Colors.disabled },
  modalBody: { padding: 20 },
  modalLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modalInput: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.textPrimary,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  pointsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  pointsPill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: Colors.backgroundSecondary,
  },
  pointsPillActive: { borderColor: Colors.brand, backgroundColor: Colors.brandLighter },
  pointsPillText: { fontSize: 14, fontWeight: '700', color: Colors.textSecondary },
  pointsPillTextActive: { color: Colors.brandDark },
  pointStepper: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  pointStepperBtn: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  pointStepperBtnDisabled: { opacity: 0.3 },
  pointStepperBtnText: { fontSize: 22, fontWeight: '300', color: Colors.textPrimary },
  pointStepperValue: {
    paddingHorizontal: 16,
    height: 52,
    minWidth: 120,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: Colors.border,
  },
  pointStepperValueInput: {
    minWidth: 56,
    fontSize: 18,
    fontWeight: '800',
    color: Colors.brand,
    textAlign: 'center',
  },
  pointStepperValueUnit: { fontSize: 16, fontWeight: '700', color: Colors.brand },
  typeRow: { gap: 8 },
  typeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.backgroundSecondary,
  },
  typeDot: { width: 10, height: 10, borderRadius: 5 },
  typeBtnText: { fontSize: 14, color: Colors.textSecondary },
  bottomPad: { height: 24 },
})
