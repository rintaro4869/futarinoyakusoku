import { useState, useEffect } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Share,
  Linking,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import * as Haptics from 'expo-haptics'
import * as Clipboard from 'expo-clipboard'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Colors } from '../constants/colors'
import { createCouple, joinCouple } from '../lib/api'
import { useAuthStore } from '../lib/store'
import { isInviteCodeReady } from '../lib/invite'
import { getTutorialSeen, setInviteInfo, setPairingDeferred } from '../lib/storage'
import { t } from '../lib/i18n'

type Mode = 'choose' | 'create' | 'join'

export default function PairScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { code: deepLinkCode } = useLocalSearchParams<{ code?: string }>()
  const coupleId = useAuthStore((s) => s.coupleId)
  const token = useAuthStore((s) => s.token)
  const setCoupleId = useAuthStore((s) => s.setCoupleId)

  // トークンがなければ登録画面に戻す
  useEffect(() => {
    if (!token) {
      router.replace('/register')
    }
  }, [token])

  const [mode, setMode] = useState<Mode>(() => (deepLinkCode ? 'join' : 'choose'))
  const [name, setName] = useState('')
  const [inviteCode, setInviteCode] = useState(() =>
    deepLinkCode ? deepLinkCode.toUpperCase() : ''
  )

  // バックグラウンドから復帰して URL が変わった場合にも自動反映する
  useEffect(() => {
    if (deepLinkCode) {
      setMode('join')
      setInviteCode(deepLinkCode.toUpperCase())
    }
  }, [deepLinkCode])
  const [loading, setLoading] = useState(false)
  const [createdCouple, setCreatedCouple] = useState<{
    couple_id: string
    invite_code: string
    invite_url: string
  } | null>(null)
  const [copiedField, setCopiedField] = useState<'code' | 'link' | null>(null)

  // すでにペアが存在する場合はホームへ（招待リンク表示中は遷移しない）
  useEffect(() => {
    if (coupleId && !createdCouple) {
      router.replace('/(home)')
    }
  }, [coupleId, createdCouple, router])

  function goMode(m: Mode) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setMode(m)
    setCreatedCouple(null)
    setName('')
    setInviteCode(m === 'join' && deepLinkCode ? deepLinkCode.toUpperCase() : '')
  }

  function buildInviteShareText(code: string, url: string) {
    return [
      t('pairing.share_message_prefix').trim(),
      `${t('pairing.invite_code_label')}: ${code}`,
      `${t('pairing.invite_link_label')}: ${url}`,
    ].join('\n')
  }

  async function handleCreate() {
    if (!name.trim() || loading) return
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    setLoading(true)
    try {
      const data = await createCouple(name.trim())
      await setCoupleId(data.couple_id)
      await setPairingDeferred(false)
      await setInviteInfo(data.invite_code, data.invite_url)
      setCreatedCouple(data)
    } catch (e: any) {
      Alert.alert(t('common.error'), e.message ?? t('common.error_network'))
    } finally {
      setLoading(false)
    }
  }

  async function handleShare() {
    if (!createdCouple) return
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    try {
      const message = buildInviteShareText(createdCouple.invite_code, createdCouple.invite_url)
      await Share.share({
        message,
        url: createdCouple.invite_url,
      })
    } catch {}
  }

  async function handleShareLine() {
    if (!createdCouple) return
    const text = encodeURIComponent(
      buildInviteShareText(createdCouple.invite_code, createdCouple.invite_url)
    )
    const lineUrl = `https://line.me/R/msg/text/?${text}`
    const supported = await Linking.canOpenURL(lineUrl)
    if (supported) {
      await Linking.openURL(lineUrl)
    } else {
      Alert.alert(t('pairing.line_not_found_title'), t('pairing.line_not_found_message'))
    }
  }

  async function handleCopy(field: 'code' | 'link') {
    if (!createdCouple) return
    const value = field === 'code' ? createdCouple.invite_code : createdCouple.invite_url
    await Clipboard.setStringAsync(value)
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    setCopiedField(field)
    setTimeout(() => setCopiedField((current) => (current === field ? null : current)), 2000)
  }

  async function handleJoin() {
    if (!name.trim() || !isInviteCodeReady(inviteCode) || loading) return
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    setLoading(true)
    try {
      const data = await joinCouple(inviteCode.trim().toUpperCase(), name.trim())
      await setCoupleId(data.couple_id)
      await setPairingDeferred(false)
      router.replace('/tutorial')
    } catch (e: any) {
      Alert.alert(t('common.error'), e.message ?? t('common.error_network'))
    } finally {
      setLoading(false)
    }
  }

  async function handleGoHome() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    await setPairingDeferred(true)
    const seen = await getTutorialSeen()
    router.replace(seen ? '/(home)' : '/tutorial')
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <LinearGradient
        colors={['#fdf2f8', '#fce7f3']}
        style={[styles.header, { paddingTop: insets.top + 24 }]}
      >
        <Text style={styles.headerTitle}>{t('pairing.connect_title')}</Text>
        <Text style={styles.headerSub}>
          {t('pairing.description')}
        </Text>
      </LinearGradient>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} keyboardShouldPersistTaps="handled">

        {mode === 'choose' && (
          <View style={styles.chooseContainer}>
            <TouchableOpacity
              style={styles.choiceCard}
              onPress={() => goMode('create')}
              activeOpacity={0.85}
            >
              <Text style={styles.choiceEmoji}>{"📨"}</Text>
              <Text style={styles.choiceTitle}>{t('pairing.create_choice_title')}</Text>
              <Text style={styles.choiceDesc}>{t('pairing.create_choice_desc')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.choiceCard, styles.choiceCardSecondary]}
              onPress={() => goMode('join')}
              activeOpacity={0.85}
            >
              <Text style={styles.choiceEmoji}>{"🔗"}</Text>
              <Text style={styles.choiceTitle}>{t('pairing.join_choice_title')}</Text>
              <Text style={styles.choiceDesc}>{t('pairing.join_choice_desc')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.ghostButton}
              onPress={() => {
                void handleGoHome()
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.ghostButtonText}>{t('pairing.skip_button')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {mode === 'create' && !createdCouple && (
          <View>
            <TouchableOpacity onPress={() => goMode('choose')} style={styles.backBtn}>
              <Text style={styles.backText}>{t('common.back')}</Text>
            </TouchableOpacity>
            <Text style={styles.stepTitle}>{t('pairing.name_step_desc')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('pairing.name_placeholder')}
              placeholderTextColor={Colors.textTertiary}
              value={name}
              onChangeText={setName}
              maxLength={20}
            />
            <TouchableOpacity
              style={[styles.primaryButton, !name.trim() && styles.primaryButtonDisabled]}
              onPress={handleCreate}
              disabled={!name.trim() || loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color={Colors.textWhite} />
              ) : (
                <Text style={styles.primaryButtonText}>{t('pairing.create_link')}</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.ghostButton}
              onPress={() => {
                void handleGoHome()
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.ghostButtonText}>{t('pairing.skip_button')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {mode === 'create' && createdCouple && (
          <View>
            <Text style={styles.stepTitle}>{t('pairing.invite_created')}</Text>
            <Text style={styles.stepDesc}>
              {t('pairing.invite_created_desc')}
            </Text>

            <View style={styles.inviteSection}>
              <Text style={styles.inviteSectionTitle}>{t('pairing.invite_steps_title')}</Text>
              <View style={styles.inviteStepsCard}>
                {[
                  t('pairing.invite_step_1'),
                  t('pairing.invite_step_2'),
                  t('pairing.invite_step_3'),
                ].map((step, index) => (
                  <View key={step} style={styles.inviteStepRow}>
                    <View style={styles.inviteStepBadge}>
                      <Text style={styles.inviteStepBadgeText}>{index + 1}</Text>
                    </View>
                    <Text style={styles.inviteStepText}>{step}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.inviteSection}>
              <Text style={styles.inviteSectionTitle}>{t('pairing.invite_info_title')}</Text>
              <View style={styles.inviteInfoCard}>
                <View style={styles.inviteInfoRow}>
                  <Text style={styles.inviteInfoLabel}>{t('pairing.invite_code_label')}</Text>
                  <Text style={styles.inviteInfoCode}>{createdCouple.invite_code}</Text>
                </View>
                <View style={styles.inviteInfoDivider} />
                <View style={styles.inviteInfoRowStack}>
                  <Text style={styles.inviteInfoLabel}>{t('pairing.invite_link_label')}</Text>
                  <Text style={styles.inviteInfoLink}>{createdCouple.invite_url}</Text>
                </View>
              </View>
            </View>

            <View style={styles.inviteSection}>
              <Text style={styles.inviteSectionTitle}>{t('pairing.invite_actions_title')}</Text>
              <TouchableOpacity
                style={styles.invitePrimaryAction}
                onPress={handleShare}
                activeOpacity={0.85}
              >
                <Ionicons name="share-social-outline" size={18} color={Colors.textWhite} />
                <Text style={styles.invitePrimaryActionText}>{t('pairing.share_action')}</Text>
              </TouchableOpacity>

              <View style={styles.inviteSecondaryActionsRow}>
                <TouchableOpacity
                  style={[styles.inviteSecondaryAction, styles.inviteSecondaryActionLine]}
                  onPress={handleShareLine}
                  activeOpacity={0.85}
                >
                  <Text style={styles.inviteSecondaryActionLineText}>LINE</Text>
                  <Text style={styles.inviteSecondaryActionText}>{t('pairing.line_action')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.inviteSecondaryAction}
                  onPress={() => handleCopy('code')}
                  activeOpacity={0.85}
                >
                  <Ionicons
                    name={copiedField === 'code' ? 'checkmark-outline' : 'copy-outline'}
                    size={18}
                    color={copiedField === 'code' ? Colors.success : Colors.textPrimary}
                  />
                  <Text style={styles.inviteSecondaryActionText}>
                    {copiedField === 'code' ? t('pairing.copy_done') : t('pairing.copy_code')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.inviteSecondaryAction}
                  onPress={() => handleCopy('link')}
                  activeOpacity={0.85}
                >
                  <Ionicons
                    name={copiedField === 'link' ? 'checkmark-outline' : 'copy-outline'}
                    size={18}
                    color={copiedField === 'link' ? Colors.success : Colors.textPrimary}
                  />
                  <Text style={styles.inviteSecondaryActionText}>
                    {copiedField === 'link' ? t('pairing.copy_done') : t('pairing.copy_link')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => goMode('join')}
              activeOpacity={0.85}
            >
              <Text style={styles.secondaryButtonText}>{t('pairing.enter_code_button')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.ghostButton}
              onPress={() => {
                void handleGoHome()
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.ghostButtonText}>{t('pairing.tutorial_button')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {mode === 'join' && (
          <View>
            <TouchableOpacity onPress={() => goMode('choose')} style={styles.backBtn}>
              <Text style={styles.backText}>{t('common.back')}</Text>
            </TouchableOpacity>
            <Text style={styles.stepTitle}>
              {deepLinkCode
                ? t('pairing.code_auto_filled')
                : t('pairing.code_manual')}
            </Text>

            <TextInput
              style={styles.input}
              placeholder={t('pairing.name_placeholder')}
              placeholderTextColor={Colors.textTertiary}
              value={name}
              onChangeText={setName}
              maxLength={20}
            />

            <TextInput
              style={[styles.input, styles.codeInput]}
              placeholder={t('pairing.code_placeholder_8')}
              placeholderTextColor={Colors.textTertiary}
              value={inviteCode}
              onChangeText={(v) => setInviteCode(v.toUpperCase())}
              maxLength={8}
              autoCapitalize="characters"
              autoCorrect={false}
            />

            <Text style={styles.joinNote}>
              {t('pairing.same_device_warning')}
            </Text>

            <TouchableOpacity
              style={[
                styles.primaryButton,
                styles.primaryButtonOrange,
                (!name.trim() || !isInviteCodeReady(inviteCode)) && styles.primaryButtonDisabled,
              ]}
              onPress={handleJoin}
              disabled={!name.trim() || !isInviteCodeReady(inviteCode) || loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color={Colors.textWhite} />
              ) : (
                <Text style={styles.primaryButtonText}>{t('pairing.join_button')}</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.ghostButton}
              onPress={() => {
                void handleGoHome()
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.ghostButtonText}>{t('pairing.skip_button')}</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingBottom: 28,
    paddingHorizontal: 24,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  headerSub: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: 24,
  },
  chooseContainer: {
    gap: 16,
    marginTop: 8,
  },
  choiceCard: {
    backgroundColor: Colors.backgroundPink,
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.brandLighter,
  },
  choiceCardSecondary: {
    backgroundColor: Colors.backgroundSecondary,
    borderColor: Colors.border,
  },
  choiceEmoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  choiceTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  choiceDesc: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  backBtn: {
    marginBottom: 20,
  },
  backText: {
    fontSize: 15,
    color: Colors.brand,
    fontWeight: '500',
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 8,
    lineHeight: 26,
  },
  stepDesc: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 20,
    lineHeight: 20,
  },
  inviteSection: {
    marginBottom: 16,
  },
  inviteSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  inviteStepsCard: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  inviteStepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  inviteStepBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  inviteStepBadgeText: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textWhite,
  },
  inviteStepText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: Colors.textPrimary,
    backgroundColor: Colors.backgroundSecondary,
    marginBottom: 12,
  },
  codeInput: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 4,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  primaryButton: {
    backgroundColor: Colors.brand,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: Colors.brand,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonOrange: {
    backgroundColor: Colors.orange,
    shadowColor: Colors.orange,
  },
  primaryButtonDisabled: {
    backgroundColor: Colors.disabled,
    shadowOpacity: 0,
    elevation: 0,
  },
  primaryButtonText: {
    color: Colors.textWhite,
    fontSize: 17,
    fontWeight: '700',
  },
  inviteInfoCard: {
    backgroundColor: Colors.backgroundPink,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.brandLighter,
  },
  inviteInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  inviteInfoRowStack: {
    gap: 8,
  },
  inviteInfoLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inviteInfoCode: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.brandDark,
    letterSpacing: 3,
    fontVariant: ['tabular-nums'],
  },
  inviteInfoDivider: {
    height: 1,
    backgroundColor: Colors.brandLighter,
    marginVertical: 14,
  },
  inviteInfoLink: {
    fontSize: 13,
    lineHeight: 19,
    color: Colors.textPrimary,
  },
  invitePrimaryAction: {
    borderRadius: 16,
    backgroundColor: Colors.brand,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    shadowColor: Colors.brand,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 3,
  },
  invitePrimaryActionText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textWhite,
  },
  inviteSecondaryActionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 10,
  },
  inviteSecondaryAction: {
    minHeight: 52,
    flexBasis: '48%',
    flexGrow: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.backgroundSecondary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  inviteSecondaryActionLine: {
    borderColor: '#06C75533',
    backgroundColor: '#F4FFF7',
  },
  inviteSecondaryActionLineText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#06C755',
    letterSpacing: 0.2,
  },
  inviteSecondaryActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 20,
  },
  secondaryButton: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  secondaryButtonText: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  ghostButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  ghostButtonText: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  joinNote: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 16,
    lineHeight: 18,
  },
})
