import { useState, useEffect } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Share,
  Linking,
} from 'react-native'
import { useRouter } from 'expo-router'
import * as Haptics from 'expo-haptics'
import { Colors } from '../../constants/colors'
import { TabRibbonHeader } from '../../components/TabRibbonHeader'
import { ConnectionNoticeBar } from '../../components/ConnectionNoticeBar'
import * as Clipboard from 'expo-clipboard'
import { pauseCouple, unpauseCouple, leaveCouple, deleteUserData, getCoupleStatus } from '../../lib/api'
import { openPrivacyPolicy } from '../../lib/legal'
import { useAuthStore } from '../../lib/store'
import { clearInviteInfo, setPairingDeferred } from '../../lib/storage'
import { t } from '../../lib/i18n'
const APP_VERSION = '1.0.0'

export default function SettingsScreen() {
  const router = useRouter()
  const coupleId = useAuthStore((s) => s.coupleId)
  const userId = useAuthStore((s) => s.userId)
  const hydrated = useAuthStore((s) => s.hydrated)
  const clearAuth = useAuthStore((s) => s.clearAuth)
  const setCoupleId = useAuthStore((s) => s.setCoupleId)
  const [pausing, setPausing] = useState(false)
  const [unpausing, setUnpausing] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [paused, setPaused] = useState(false)
  const [statusLoading, setStatusLoading] = useState(true)
  const [inviteCode, setInviteCode] = useState<string | null>(null)
  const [inviteUrl, setInviteUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // 画面表示時に停止状態と招待コードを取得
  useEffect(() => {
    if (!coupleId) return
    getCoupleStatus(coupleId)
      .then((data) => {
        setPaused(data.status === 'paused')
        if (data.invite_code) setInviteCode(data.invite_code)
        if (data.invite_url) setInviteUrl(data.invite_url)
      })
      .catch(() => {})
      .finally(() => setStatusLoading(false))
  }, [coupleId])

  async function handleShareInvite() {
    if (!inviteUrl) return
    try {
      await Share.share({
        message: t('settings.invite_share_message') + '\n' + inviteUrl,
        url: inviteUrl,
      })
    } catch {}
  }

  async function handleCopyInvite() {
    if (!inviteUrl) return
    await Clipboard.setStringAsync(inviteUrl)
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleOpenNotificationSettings() {
    try {
      await Linking.openSettings()
    } catch {
      Alert.alert(t('common.error'), t('common.error_network'))
    }
  }

  async function handleOpenPrivacyPolicy() {
    try {
      await openPrivacyPolicy()
    } catch {
      Alert.alert(t('common.error'), t('common.error_network'))
    }
  }

  async function handlePause() {
    if (!coupleId || pausing) return
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    setPausing(true)
    try {
      await pauseCouple(coupleId)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      setPaused(true)
      Alert.alert(t('settings.pause_success_title'), t('settings.pause_success_message'))
    } catch (e: any) {
      Alert.alert(t('common.error'), e.message ?? t('common.error_network'))
    } finally {
      setPausing(false)
    }
  }

  async function handleUnpause() {
    if (!coupleId || unpausing) return
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    setUnpausing(true)
    try {
      await unpauseCouple(coupleId)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      setPaused(false)
      Alert.alert(t('settings.unpause_success_title'), t('settings.unpause_success_message'))
    } catch (e: any) {
      Alert.alert(t('common.error'), e.message ?? t('common.error_network'))
    } finally {
      setUnpausing(false)
    }
  }

  function handleLeave() {
    Alert.alert(
      t('settings.leave_title'),
      t('settings.leave_message'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('settings.leave_confirm'),
          style: 'destructive',
          onPress: async () => {
            if (!coupleId || leaving) return
            setLeaving(true)
            try {
              await leaveCouple(coupleId)
              await setCoupleId(null)
              await clearInviteInfo()
              await setPairingDeferred(false)
              setPaused(false)
              setInviteCode(null)
              setInviteUrl(null)
              router.replace('/pair')
            } catch (e: any) {
              Alert.alert(t('common.error'), e.message ?? t('common.error_network'))
              setLeaving(false)
            }
          },
        },
      ]
    )
  }

  function handleDeleteData() {
    Alert.alert(
      t('settings.delete_title'),
      t('settings.delete_message'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('settings.delete_confirm'),
          style: 'destructive',
          onPress: async () => {
            if (!userId || deleting) return
            setDeleting(true)
            try {
              await deleteUserData(userId)
              await clearAuth()
              router.replace('/onboarding')
            } catch (e: any) {
              Alert.alert(t('common.error'), e.message ?? t('common.error_network'))
              setDeleting(false)
            }
          },
        },
      ]
    )
  }

  if (!hydrated) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.brand} />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <TabRibbonHeader title={t('settings.title')} />

      {hydrated && !coupleId ? (
        <ConnectionNoticeBar onPress={() => router.push('/pair')} />
      ) : null}

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>

        {/* Invite section */}
        <Text style={styles.sectionTitle}>{t('settings.invite_section')}</Text>
        {coupleId && inviteCode ? (
          <>
            <View style={styles.inviteCard}>
              <Text style={styles.inviteLabel}>{t('settings.invite_code')}</Text>
              <Text style={styles.inviteCodeText}>{inviteCode}</Text>
              {inviteUrl && (
                <Text style={styles.inviteUrlText} numberOfLines={2}>{inviteUrl}</Text>
              )}
              <View style={styles.inviteBtnRow}>
                <TouchableOpacity
                  style={styles.inviteShareBtn}
                  onPress={handleShareInvite}
                  activeOpacity={0.85}
                >
                  <Text style={styles.inviteShareBtnText}>{t('settings.invite_share')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.inviteCopyBtn}
                  onPress={handleCopyInvite}
                  activeOpacity={0.85}
                >
                  <Text style={styles.inviteCopyBtnText}>
                    {copied ? t('settings.invite_copied') : t('settings.invite_copy')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        ) : (
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push('/pair')}
            activeOpacity={0.85}
          >
            <View style={styles.dangerRow}>
              <Text style={styles.logoutText}>{t('common.partner_invite')}</Text>
              <Text style={styles.infoChevron}>›</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Safety section */}
        {coupleId && (
          <>
            <Text style={styles.sectionTitle}>{t('settings.safety_section')}</Text>

            {!statusLoading && paused && (
              <View style={styles.pausedBanner}>
                <Text style={styles.pausedBannerTitle}>{t('settings.paused_title')}</Text>
                <Text style={styles.pausedBannerDesc}>{t('settings.paused_desc')}</Text>
                <TouchableOpacity
                  style={styles.unpauseBtn}
                  onPress={handleUnpause}
                  disabled={unpausing}
                  activeOpacity={0.85}
                >
                  {unpausing ? (
                    <ActivityIndicator color={Colors.brand} size="small" />
                  ) : (
                    <Text style={styles.unpauseBtnText}>{t('settings.unpause')}</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.card}>
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle}>{t('settings.pause_title')}</Text>
                <Text style={styles.cardDesc}>{t('settings.pause_desc')}</Text>
              </View>
              <TouchableOpacity
                style={[styles.actionBtn, paused && styles.actionBtnDisabled]}
                onPress={handlePause}
                disabled={pausing || paused}
                activeOpacity={0.85}
              >
                {pausing ? (
                  <ActivityIndicator color={Colors.textWhite} size="small" />
                ) : (
                  <Text style={styles.actionBtnText}>
                    {paused ? t('settings.pause_active') : t('settings.pause_cta')}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* Danger section */}
        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>{t('settings.account_section')}</Text>

        <TouchableOpacity
          style={styles.card}
          onPress={() => {
            Alert.alert(t('settings.logout'), t('settings.logout_confirm'), [
              { text: t('common.cancel'), style: 'cancel' },
              {
                text: t('settings.logout'),
                onPress: async () => {
                  await clearAuth()
                  router.replace('/onboarding')
                },
              },
            ])
          }}
          activeOpacity={0.85}
        >
          <View style={styles.dangerRow}>
            <Text style={styles.logoutText}>{t('settings.logout')}</Text>
            <Text style={styles.dangerChevron}>{'›'}</Text>
          </View>
        </TouchableOpacity>

        {coupleId && (
          <TouchableOpacity
            style={[styles.card, styles.dangerCard]}
            onPress={handleLeave}
            disabled={leaving}
            activeOpacity={0.85}
          >
            <View style={styles.dangerRow}>
              {leaving ? (
                <ActivityIndicator color={Colors.error} size="small" />
              ) : (
                <View>
                  <Text style={styles.dangerText}>{t('settings.leave_title')}</Text>
                  <Text style={styles.dangerSubText}>{t('settings.leave_subtitle')}</Text>
                </View>
              )}
              <Text style={styles.dangerChevron}>{"›"}</Text>
            </View>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.card, styles.dangerCard]}
          onPress={handleDeleteData}
          disabled={deleting}
          activeOpacity={0.85}
        >
          <View style={styles.dangerRow}>
            {deleting ? (
              <ActivityIndicator color={Colors.error} size="small" />
            ) : (
              <View>
                <Text style={styles.dangerText}>{t('settings.delete_title')}</Text>
                <Text style={styles.dangerSubText}>{t('settings.delete_subtitle')}</Text>
              </View>
            )}
            <Text style={styles.dangerChevron}>{"›"}</Text>
          </View>
        </TouchableOpacity>

        {/* Info section */}
        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>{t('settings.info_section')}</Text>

        <View style={styles.infoCard}>
          <TouchableOpacity
            style={styles.infoRowPressable}
            onPress={handleOpenNotificationSettings}
            activeOpacity={0.7}
          >
            <View>
              <Text style={styles.infoLabel}>{t('settings.notifications')}</Text>
              <Text style={styles.guideDesc}>{t('settings.notifications_desc')}</Text>
            </View>
            <Text style={styles.infoChevron}>›</Text>
          </TouchableOpacity>
          <View style={styles.infoDivider} />
          <TouchableOpacity
            style={styles.guideRow}
            onPress={() => router.push('/tutorial')}
            activeOpacity={0.7}
          >
            <View style={styles.guideIcon}>
              <Text style={styles.guideIconText}>?</Text>
            </View>
            <View style={styles.guideText}>
              <Text style={styles.infoLabel}>{t('settings.guide')}</Text>
              <Text style={styles.guideDesc}>{t('settings.guide_desc')}</Text>
            </View>
            <Text style={styles.infoChevron}>›</Text>
          </TouchableOpacity>
          <View style={styles.infoDivider} />
          <TouchableOpacity
            style={styles.infoRowPressable}
            onPress={handleOpenPrivacyPolicy}
            activeOpacity={0.7}
          >
            <View>
              <Text style={styles.infoLabel}>{t('settings.privacy_policy')}</Text>
              <Text style={styles.guideDesc}>{t('settings.privacy_policy_desc')}</Text>
            </View>
            <Text style={styles.infoChevron}>›</Text>
          </TouchableOpacity>
          <View style={styles.infoDivider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t('settings.version')}</Text>
            <Text style={styles.infoValue}>{APP_VERSION}</Text>
          </View>
        </View>

        <View style={styles.noticeCard}>
          <Text style={styles.noticeTitle}>{t('settings.notice_title')}</Text>
          <Text style={styles.noticeText}>{t('settings.notice_text')}</Text>
        </View>

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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  card: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  cardInfo: {
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  actionBtn: {
    backgroundColor: Colors.brand,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  actionBtnDisabled: {
    backgroundColor: Colors.disabled,
  },
  actionBtnSecondary: {
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionBtnText: {
    color: Colors.textWhite,
    fontSize: 14,
    fontWeight: '700',
  },
  actionBtnSecondaryText: {
    color: Colors.textPrimary,
  },
  dangerCard: {
    borderWidth: 1,
    borderColor: Colors.errorLight,
  },
  dangerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoutText: {
    fontSize: 15,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  dangerText: {
    fontSize: 15,
    color: Colors.error,
    fontWeight: '600',
  },
  dangerSubText: {
    fontSize: 12,
    color: Colors.error,
    marginTop: 2,
    opacity: 0.7,
  },
  dangerChevron: {
    fontSize: 20,
    color: Colors.error,
  },
  infoCard: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    marginBottom: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  infoRowPressable: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    padding: 16,
  },
  infoLabel: {
    fontSize: 15,
    color: Colors.textPrimary,
  },
  infoValue: {
    fontSize: 15,
    color: Colors.textSecondary,
  },
  infoChevron: {
    fontSize: 20,
    color: Colors.textTertiary,
  },
  infoDivider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginHorizontal: 16,
  },
  guideRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  guideIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.brand,
    justifyContent: 'center',
    alignItems: 'center',
  },
  guideIconText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  guideText: {
    flex: 1,
  },
  guideDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  pausedBanner: {
    backgroundColor: Colors.warningLight,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: Colors.warning,
  },
  pausedBannerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#92400e',
    marginBottom: 4,
  },
  pausedBannerDesc: {
    fontSize: 13,
    color: '#78350f',
    lineHeight: 18,
    marginBottom: 12,
  },
  unpauseBtn: {
    borderWidth: 1.5,
    borderColor: Colors.brand,
    borderRadius: 10,
    paddingVertical: 9,
    alignItems: 'center',
  },
  unpauseBtnText: {
    color: Colors.brand,
    fontSize: 14,
    fontWeight: '700',
  },
  noticeCard: {
    backgroundColor: Colors.warningLight,
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
    borderLeftWidth: 4,
    borderLeftColor: Colors.warning,
  },
  noticeTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400e',
    marginBottom: 6,
  },
  noticeText: {
    fontSize: 13,
    color: '#78350f',
    lineHeight: 19,
  },
  // Invite
  inviteCard: {
    backgroundColor: Colors.backgroundPink,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.brandLighter,
    alignItems: 'center',
  },
  inviteLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  inviteCodeText: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.brandDark,
    letterSpacing: 4,
    marginBottom: 8,
  },
  inviteUrlText: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  inviteBtnRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  inviteShareBtn: {
    flex: 1,
    backgroundColor: Colors.brand,
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
  },
  inviteShareBtnText: {
    color: Colors.textWhite,
    fontSize: 14,
    fontWeight: '700',
  },
  inviteCopyBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: Colors.brand,
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
  },
  inviteCopyBtnText: {
    color: Colors.brand,
    fontSize: 14,
    fontWeight: '600',
  },

  bottomPad: {
    height: 20,
  },
  unpairedIcon: {
    fontSize: 20,
  },
})
