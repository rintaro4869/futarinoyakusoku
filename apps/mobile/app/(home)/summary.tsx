import { useEffect, useState, useCallback } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native'
import { Colors } from '../../constants/colors'
import { getWeeklySummary, WeeklySummary } from '../../lib/api'
import { useAuthStore } from '../../lib/store'
import { t } from '../../lib/i18n'
import { formatIsoWeekRangeLabel } from '../../lib/date-labels'

function parseWeekKey(weekKey: string): string {
  return formatIsoWeekRangeLabel(weekKey)
}

function StatCard({
  label,
  value,
  unit,
  color,
  bgColor,
}: {
  label: string
  value: number
  unit: string
  color: string
  bgColor: string
}) {
  return (
    <View style={[statStyles.card, { backgroundColor: bgColor }]}>
      <Text style={[statStyles.value, { color }]}>{value}</Text>
      <Text style={statStyles.unit}>{unit}</Text>
      <Text style={statStyles.label}>{label}</Text>
    </View>
  )
}

const statStyles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  value: {
    fontSize: 36,
    fontWeight: '800',
    marginBottom: 2,
  },
  unit: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  label: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '600',
    textAlign: 'center',
  },
})

function RuleBar({
  title,
  approved,
  rejected,
  expired,
}: {
  title: string
  approved: number
  rejected: number
  expired: number
}) {
  const total = approved + rejected + expired
  const maxVal = Math.max(total, 1)
  const approvedPct = (approved / maxVal) * 100
  const rejectedPct = (rejected / maxVal) * 100
  const expiredPct = (expired / maxVal) * 100

  return (
    <View style={ruleBarStyles.container}>
      <Text style={ruleBarStyles.title} numberOfLines={1}>{title}</Text>
      <View style={ruleBarStyles.barTrack}>
        {approved > 0 && (
          <View style={[ruleBarStyles.barSegment, { width: `${approvedPct}%` as any, backgroundColor: Colors.brand }]} />
        )}
        {rejected > 0 && (
          <View style={[ruleBarStyles.barSegment, { width: `${rejectedPct}%` as any, backgroundColor: Colors.orange }]} />
        )}
        {expired > 0 && (
          <View style={[ruleBarStyles.barSegment, { width: `${expiredPct}%` as any, backgroundColor: Colors.disabled }]} />
        )}
      </View>
      <View style={ruleBarStyles.legend}>
        <Text style={[ruleBarStyles.legendText, { color: Colors.brand }]}>{t('summary.bar_approved', { n: approved })}</Text>
        <Text style={[ruleBarStyles.legendText, { color: Colors.orange }]}>{t('summary.bar_rejected', { n: rejected })}</Text>
        <Text style={[ruleBarStyles.legendText, { color: Colors.textTertiary }]}>{t('summary.bar_expired', { n: expired })}</Text>
      </View>
    </View>
  )
}

const ruleBarStyles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  barTrack: {
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.borderLight,
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: 6,
  },
  barSegment: {
    height: '100%',
  },
  legend: {
    flexDirection: 'row',
    gap: 12,
  },
  legendText: {
    fontSize: 12,
    fontWeight: '500',
  },
})

export default function SummaryScreen() {
  const coupleId = useAuthStore((s) => s.coupleId)
  const [summary, setSummary] = useState<WeeklySummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (isRefresh = false) => {
    if (!coupleId) return
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    setError(null)
    try {
      const data = await getWeeklySummary(coupleId)
      setSummary(data)
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
        <Text style={styles.headerTitle}>{t('summary.title')}</Text>
        {summary && (
          <Text style={styles.headerDate}>{parseWeekKey(summary.week_key)}</Text>
        )}
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

        {summary?.bias_alert && (
          <View style={styles.biasAlert}>
            <Text style={styles.biasAlertText}>
              {t('summary.bias_alert')}
            </Text>
          </View>
        )}

        {summary && (
          <>
            {/* Stat cards */}
            <View style={styles.statsRow}>
              <StatCard
                label={t('summary.thank_you_points')}
                value={summary.thank_you_total}
                unit="pt"
                color={Colors.brand}
                bgColor={Colors.brandLighter}
              />
              <View style={styles.statGap} />
              <StatCard
                label={t('summary.promise_points')}
                value={summary.nobishiro_total}
                unit="pt"
                color={Colors.orange}
                bgColor={Colors.orangeLighter}
              />
            </View>

            {/* Rates */}
            <View style={styles.section}>
              <View style={styles.rateRow}>
                <Text style={styles.rateLabel}>{t('summary.approval_rate')}</Text>
                <Text style={styles.rateValue}>
                  {Math.round(summary.approval_rate * 100)}%
                </Text>
              </View>
              <View style={[styles.rateTrack]}>
                <View
                  style={[
                    styles.rateFill,
                    {
                      width: `${Math.round(summary.approval_rate * 100)}%` as any,
                      backgroundColor: Colors.brand,
                    },
                  ]}
                />
              </View>

              <View style={[styles.rateRow, { marginTop: 16 }]}>
                <Text style={styles.rateLabel}>{t('summary.repair_rate')}</Text>
                <Text style={[styles.rateValue, { color: Colors.orange }]}>
                  {Math.round(summary.repair_completion_rate * 100)}%
                </Text>
              </View>
              <View style={[styles.rateTrack]}>
                <View
                  style={[
                    styles.rateFill,
                    {
                      width: `${Math.round(summary.repair_completion_rate * 100)}%` as any,
                      backgroundColor: Colors.orange,
                    },
                  ]}
                />
              </View>
            </View>

            {/* By rule */}
            <Text style={styles.sectionTitle}>{t('summary.by_rule')}</Text>
            <View style={styles.section}>
              {summary.by_rule.length === 0 && (
                <Text style={styles.emptyText}>{t('summary.empty_week')}</Text>
              )}
              {summary.by_rule.map((rule) => (
                <RuleBar
                  key={rule.rule_id}
                  title={rule.title}
                  approved={rule.approved_count}
                  rejected={rule.rejected_count}
                  expired={rule.expired_count}
                />
              ))}
            </View>
          </>
        )}

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
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  headerDate: {
    fontSize: 13,
    color: Colors.textSecondary,
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
  biasAlert: {
    backgroundColor: Colors.warningLight,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: Colors.warning,
  },
  biasAlertText: {
    fontSize: 14,
    color: '#92400e',
    lineHeight: 20,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  statGap: {
    width: 12,
  },
  section: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  rateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  rateLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  rateValue: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.brand,
  },
  rateTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.borderLight,
    overflow: 'hidden',
  },
  rateFill: {
    height: '100%',
    borderRadius: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  bottomPad: {
    height: 20,
  },
})
