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
  Linking,
} from 'react-native'
import { useRouter } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import * as Haptics from 'expo-haptics'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Colors } from '../constants/colors'
import { loginUser } from '../lib/api'
import { useAuthStore } from '../lib/store'
import { getTutorialSeen } from '../lib/storage'
import { t } from '../lib/i18n'

const SUPPORT_EMAIL = 'yamadaxr.app@gmail.com'

export default function LoginScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const setAuth = useAuthStore((s) => s.setAuth)
  const setCoupleId = useAuthStore((s) => s.setCoupleId)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const canSubmit = email.length > 0 && password.length > 0 && !loading

  async function handleLogin() {
    if (!canSubmit) return
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    setLoading(true)
    try {
      const data = await loginUser(email.trim(), password)
      await setAuth(data.device_token, data.user_id)
      await setCoupleId(data.couple_id ?? null)
      if (data.couple_id) {
        const seen = await getTutorialSeen()
        router.replace(seen ? '/(home)' : '/tutorial')
      } else {
        router.replace('/pair')
      }
    } catch (e: any) {
      Alert.alert(t('common.error'), e.message ?? t('auth.login_failed'))
    } finally {
      setLoading(false)
    }
  }

  async function handleSupportEmail() {
    Alert.alert(
      t('auth.password_help_choose_title'),
      t('auth.password_help_choose_desc'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('auth.password_help_mail_app'),
          onPress: async () => {
            const mailto = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('Pairlog password reset support')}`
            const canOpen = await Linking.canOpenURL(mailto)
            if (canOpen) {
              await Linking.openURL(mailto)
              return
            }
            Alert.alert(t('common.error'), t('auth.password_help_unavailable'))
          },
        },
        {
          text: t('auth.password_help_gmail'),
          onPress: async () => {
            const gmailComposeUrl =
              `https://mail.google.com/mail/?view=cm&fs=1&tf=1&to=${encodeURIComponent(SUPPORT_EMAIL)}` +
              `&su=${encodeURIComponent('Pairlog password reset support')}`
            await Linking.openURL(gmailComposeUrl)
          },
        },
      ],
    )
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
        <Text style={styles.headerTitle}>{t('auth.login_title')}</Text>
        <Text style={styles.headerSub}>
          {t('auth.login_subtitle')}
        </Text>
      </LinearGradient>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.label}>{t('auth.email_label')}</Text>
        <TextInput
          style={styles.input}
          placeholder="example@email.com"
          placeholderTextColor={Colors.textTertiary}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
        />

        <Text style={styles.label}>{t('auth.password_label')}</Text>
        <View style={styles.passwordRow}>
          <TextInput
            style={[styles.input, styles.passwordInput]}
            placeholder={t('auth.password_placeholder')}
            placeholderTextColor={Colors.textTertiary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            textContentType="none"
          />
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Text style={styles.eyeText}>{showPassword ? t('auth.password_hide') : t('auth.password_show')}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.ctaButton, !canSubmit && styles.ctaDisabled]}
          onPress={handleLogin}
          disabled={!canSubmit}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color={Colors.textWhite} />
          ) : (
            <Text style={styles.ctaText}>{t('auth.login_button')}</Text>
          )}
        </TouchableOpacity>

        <View style={styles.supportCard}>
          <Text style={styles.supportTitle}>{t('auth.password_help_title')}</Text>
          <Text style={styles.supportDesc}>{t('auth.password_help_desc')}</Text>
          <TouchableOpacity style={styles.supportButton} onPress={handleSupportEmail} activeOpacity={0.8}>
            <Text style={styles.supportButtonText}>{t('auth.password_help_cta')}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => router.replace('/register')}
        >
          <Text style={styles.linkText}>
            {t('auth.no_account')}{' '}
            <Text style={styles.linkTextBold}>{t('auth.register_link')}</Text>
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
  supportCard: {
    marginTop: 18,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
  },
  supportTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  supportDesc: {
    fontSize: 13,
    lineHeight: 19,
    color: Colors.textSecondary,
  },
  supportButton: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
  },
  supportButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.brand,
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
