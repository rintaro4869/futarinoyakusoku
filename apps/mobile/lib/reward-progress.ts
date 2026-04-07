import { HomeSummary } from './api'
import { StoredReward } from './storage'

export type RewardAssignee = 'self' | 'partner' | 'both'

export type RewardPointBucket = {
  promise: number
  thankyou: number
  total: number
}

export type RewardTotals = Record<RewardAssignee, RewardPointBucket>

export type RewardProgress = StoredReward & {
  assignee: RewardAssignee
  current: number
  remaining: number
  unlockable: boolean
}

function safeNum(v: unknown, fallback = 0): number {
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

export function getRewardTotals(summary: HomeSummary | null): RewardTotals {
  const selfPromise = safeNum(summary?.my_nobishiro)
  const selfThankyou = safeNum(summary?.my_thank_you)
  const partnerPromise = safeNum(summary?.partner_nobishiro)
  const partnerThankyou = safeNum(summary?.partner_thank_you)

  const bothPromise = selfPromise + partnerPromise
  const bothThankyou = selfThankyou + partnerThankyou

  return {
    self: {
      promise: selfPromise,
      thankyou: selfThankyou,
      total: selfPromise + selfThankyou,
    },
    partner: {
      promise: partnerPromise,
      thankyou: partnerThankyou,
      total: partnerPromise + partnerThankyou,
    },
    both: {
      promise: bothPromise,
      thankyou: bothThankyou,
      total: bothPromise + bothThankyou,
    },
  }
}

export function normalizeRewardAssignee(
  reward: StoredReward,
  isConnected: boolean
): RewardAssignee {
  if (reward.assignee === 'self' || reward.assignee === 'partner' || reward.assignee === 'both') {
    return reward.assignee
  }
  return isConnected ? 'both' : 'self'
}

export function getRewardCurrentPoints(
  pointType: StoredReward['pointType'],
  assignee: RewardAssignee,
  totals: RewardTotals,
  baselinePoints?: StoredReward['baselinePoints']
): number {
  const totalPoints =
    pointType === 'promise'
      ? totals[assignee].promise
      : pointType === 'thankyou'
        ? totals[assignee].thankyou
        : totals[assignee].total

  const baseline =
    pointType === 'promise'
      ? safeNum(baselinePoints?.promise)
      : pointType === 'thankyou'
        ? safeNum(baselinePoints?.thankyou)
        : safeNum(baselinePoints?.total)

  return Math.max(totalPoints - baseline, 0)
}

export function buildRewardProgress(
  rewards: StoredReward[],
  totals: RewardTotals,
  isConnected: boolean
): RewardProgress[] {
  return rewards
    .filter((reward) => reward.status !== 'used')
    .map((reward) => {
      const assignee = normalizeRewardAssignee(reward, isConnected)
      const current = getRewardCurrentPoints(
        reward.pointType,
        assignee,
        totals,
        reward.baselinePoints
      )
      return {
        ...reward,
        assignee,
        current,
        remaining: Math.max(reward.pointsRequired - current, 0),
        unlockable: current >= reward.pointsRequired,
      }
    })
}
