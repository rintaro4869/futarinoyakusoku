import { useState } from 'react'
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
import { registerUser } from '../lib/api'
import { useAuthStore } from '../lib/store'
import { t } from '../lib/i18n'

export default function RegisterScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  const passwordValid = password.length >= 8
  const confirmValid = password === confirmPassword && confirmPassword.length > 0
  const canSubmit = emailValid && passwordValid && confirmValid && !loading

  async function handleRegister() {
    if (!canSubmit) return
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    setLoading(true)
    try {
      const data = await registerUser(email.trim(), password)
      await setAuth(data.device_token, data.user_id)
      router.replace('/pair')
    } catch (e: any) {
      Alert.alert(t('common.error'), e.message ?? t('auth.register_failed'))
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
        <Text style={styles.headerTitle}>{t('auth.register_title')}</Text>
        <Text style={styles.headerSub}>
          {t('auth.register_subtitle')}
        </Text>
      </LinearGradient>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.label}>{t('auth.email_label')}</Text>
        <TextInput
          style={[styles.input, email.length > 0 && !emailValid && styles.inputError]}
          placeholder="example@email.com"
          placeholderTextColor={Colors.textTertiary}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="none"
        />
        {email.length > 0 && !emailValid && (
          <Text style={styles.errorText}>{t('auth.email_invalid')}</Text>
        )}

        <Text style={styles.label}>{t('auth.password_label')}</Text>
        <View style={styles.passwordRow}>
          <TextInput
            style={[styles.input, styles.passwordInput, password.length > 0 && !passwordValid && styles.inputError]}
            placeholder={t('auth.password_min_hint')}
            placeholderTextColor={Colors.textTertiary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            textContentType="oneTimeCode"
            autoComplete="off"
          />
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Text style={styles.eyeText}>{showPassword ? t('auth.password_hide') : t('auth.password_show')}</Text>
          </TouchableOpacity>
        </View>
        {password.length > 0 && !passwordValid && (
          <Text style={styles.errorText}>{t('auth.password_min_error')}</Text>
        )}

        <Text style={styles.label}>{t('auth.password_confirm_label')}</Text>
        <TextInput
          style={[styles.input, confirmPassword.length > 0 && !confirmValid && styles.inputError]}
          placeholder={t('auth.password_confirm_placeholder')}
          placeholderTextColor={Colors.textTertiary}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry={!showPassword}
          textContentType="oneTimeCode"
          autoComplete="off"
        />
        {confirmPassword.length > 0 && !confirmValid && (
          <Text style={styles.errorText}>{t('auth.password_mismatch')}</Text>
        )}

        <TouchableOpacity
          style={[styles.ctaButton, !canSubmit && styles.ctaDisabled]}
          onPress={handleRegister}
          disabled={!canSubmit}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color={Colors.textWhite} />
          ) : (
            <Text style={styles.ctaText}>{t('auth.register_button')}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => router.replace('/login')}
        >
          <Text style={styles.linkText}>
            {t('auth.has_account')}{' '}
            <Text style={styles.linkTextBold}>{t('auth.login_link')}</Text>
          </Text>
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
  inputError: {
    borderColor: Colors.error,
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
  errorText: {
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
  linkButton: {
    marginTop: 20,
    alignItems: 'center',
    paddingVertical: 8,
  },
  linkText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  linkTextBold: {
    color: Colors.brand,
    fontWeight: '600',
  },
})
