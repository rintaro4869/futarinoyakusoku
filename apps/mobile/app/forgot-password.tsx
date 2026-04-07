import { useEffect, useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native'
import { useRouter } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import * as Haptics from 'expo-haptics'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Colors } from '../constants/colors'
import { requestPasswordReset, resetPassword } from '../lib/api'
import { useAuthStore } from '../lib/store'
import { getTutorialSeen } from '../lib/storage'
import { t } from '../lib/i18n'

type Step = 'email' | 'code'

export default function ForgotPasswordScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const setAuth = useAuthStore((s) => s.setAuth)
  const setCoupleId = useAuthStore((s) => s.setCoupleId)

  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)

  const canSendCode = email.length > 0 && !loading
  const canReset =
    code.length === 6 &&
    newPassword.length >= 8 &&
    newPassword === confirmPassword &&
    !loading

  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setInterval(() => {
      setResendCooldown((value) => Math.max(0, value - 1))
    }, 1000)
    return () => clearInterval(timer)
  }, [resendCooldown])

  async function handleSendCode() {
    if (!email.trim() || loading || resendCooldown > 0) return
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    setLoading(true)
    try {
      await requestPasswordReset(email.trim())
      setStep('code')
      setResendCooldown(30)
      Alert.alert('', t('auth.reset_code_sent'))
    } catch (e: any) {
      Alert.alert(t('common.error'), e.message ?? t('common.error_network'))
    } finally {
      setLoading(false)
    }
  }

  async function handleReset() {
    if (!canReset) return
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    setLoading(true)
    try {
      const data = await resetPassword(email.trim(), code, newPassword)
      await setAuth(data.device_token, data.user_id)
      await setCoupleId(data.couple_id ?? null)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      Alert.alert('', t('auth.reset_success'), [
        {
          text: 'OK',
          onPress: async () => {
            if (data.couple_id) {
              const seen = await getTutorialSeen()
              router.replace(seen ? '/(home)' : '/tutorial')
            } else {
              router.replace('/pair')
            }
          },
        },
      ])
    } catch (e: any) {
      Alert.alert(t('common.error'), e.message ?? t('auth.reset_failed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <LinearGradient
        colors={['#fdf2f8', '#fce7f3', '#fbcfe8']}
        style={[styles.header, { paddingTop: insets.top + 24 }]}
      >
        <Text style={styles.headerTitle}>{t('auth.reset_title')}</Text>
        <Text style={styles.headerSub}>
          {step === 'email'
            ? t('auth.reset_email_subtitle')
            : t('auth.reset_code_sent')}
        </Text>
      </LinearGradient>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Step 1: Email */}
        <Text style={styles.label}>{t('auth.email_label')}</Text>
        <TextInput
          style={[styles.input, step === 'code' && styles.inputDisabled]}
          placeholder="example@email.com"
          placeholderTextColor={Colors.textTertiary}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          editable={step === 'email'}
        />

        {step === 'email' && (
          <>
            <TouchableOpacity
              style={[styles.ctaButton, !canSendCode && styles.ctaDisabled]}
              onPress={handleSendCode}
              disabled={!canSendCode}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color={Colors.textWhite} />
              ) : (
                <Text style={styles.ctaText}>{t('auth.reset_send_code')}</Text>
              )}
            </TouchableOpacity>
          </>
        )}

        {/* Step 2: Code + New Password */}
        {step === 'code' && (
          <>
            <Text style={styles.label}>{t('auth.reset_code_label')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('auth.reset_code_placeholder')}
              placeholderTextColor={Colors.textTertiary}
              value={code}
              onChangeText={(v) => setCode(v.replace(/\D/g, '').slice(0, 6))}
              keyboardType="number-pad"
              maxLength={6}
            />

            <Text style={styles.label}>{t('auth.reset_new_password_label')}</Text>
            <View style={styles.passwordRow}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder={t('auth.reset_new_password_placeholder')}
                placeholderTextColor={Colors.textTertiary}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showPassword}
                textContentType="none"
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Text style={styles.eyeText}>
                  {showPassword ? t('auth.password_hide') : t('auth.password_show')}
                </Text>
              </TouchableOpacity>
            </View>
            {newPassword.length > 0 && newPassword.length < 8 && (
              <Text style={styles.errorHint}>{t('auth.password_min_error')}</Text>
            )}

            <Text style={styles.label}>{t('auth.reset_confirm_label')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('auth.reset_confirm_placeholder')}
              placeholderTextColor={Colors.textTertiary}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showPassword}
              textContentType="none"
            />
            {confirmPassword.length > 0 && confirmPassword !== newPassword && (
              <Text style={styles.errorHint}>{t('auth.password_mismatch')}</Text>
            )}

            <TouchableOpacity
              style={[styles.ctaButton, !canReset && styles.ctaDisabled]}
              onPress={handleReset}
              disabled={!canReset}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color={Colors.textWhite} />
              ) : (
                <Text style={styles.ctaText}>{t('auth.reset_submit')}</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.resendButton}
              onPress={handleSendCode}
              disabled={loading || resendCooldown > 0}
            >
              <Text
                style={[
                  styles.resendText,
                  resendCooldown > 0 && styles.resendTextDisabled,
                ]}
              >
                {resendCooldown > 0
                  ? t('auth.reset_resend_wait', { seconds: resendCooldown })
                  : t('auth.reset_send_code')}
              </Text>
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => router.replace('/login')}
        >
          <Text style={styles.linkText}>{t('auth.reset_back_to_login')}</Text>
        </TouchableOpacity>
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
    fontSize: 28,
    fontWeight: '800',
    color: Colors.brandDark,
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
    paddingTop: 28,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 6,
    marginTop: 16,
  },
  input: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: Colors.textPrimary,
    backgroundColor: Colors.backgroundSecondary,
  },
  inputDisabled: {
    backgroundColor: Colors.disabled,
    color: Colors.textSecondary,
  },
  passwordRow: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 60,
  },
  eyeButton: {
    position: 'absolute',
    right: 14,
    top: 14,
  },
  eyeText: {
    fontSize: 14,
    color: Colors.brand,
    fontWeight: '600',
  },
  errorHint: {
    fontSize: 12,
    color: Colors.error,
    marginTop: 4,
  },
  ctaButton: {
    backgroundColor: Colors.brand,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 32,
    shadowColor: Colors.brand,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  ctaDisabled: {
    backgroundColor: Colors.disabled,
    shadowOpacity: 0,
    elevation: 0,
  },
  ctaText: {
    color: Colors.textWhite,
    fontSize: 18,
    fontWeight: '700',
  },
  resendButton: {
    marginTop: 16,
    alignItems: 'center',
    paddingVertical: 8,
  },
  resendText: {
    fontSize: 14,
    color: Colors.brand,
    fontWeight: '600',
  },
  resendTextDisabled: {
    color: Colors.textSecondary,
  },
  linkButton: {
    marginTop: 20,
    alignItems: 'center',
    paddingVertical: 8,
  },
  linkText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
})
