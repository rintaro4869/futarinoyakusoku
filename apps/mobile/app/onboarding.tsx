import { useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { useRouter } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import * as Haptics from 'expo-haptics'
import { Colors } from '../constants/colors'
import { createAnonymousUser } from '../lib/api'
import { openPrivacyPolicy } from '../lib/legal'
import { setPairingDeferred } from '../lib/storage'
import { useAuthStore } from '../lib/store'
import { t } from '../lib/i18n'

export default function OnboardingScreen() {
  const router = useRouter()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [checked, setChecked] = useState([false, false, false])
  const [loading, setLoading] = useState(false)

  const agreements = [t('onboarding.agree_1'), t('onboarding.agree_2'), t('onboarding.agree_3')]

  const allChecked = checked.every(Boolean)

  function toggleCheck(index: number) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setChecked((prev) => {
      const next = [...prev]
      next[index] = !next[index]
      return next
    })
  }

  async function handleStart() {
    if (!allChecked || loading) return
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    setLoading(true)
    try {
      const data = await createAnonymousUser()
      await setAuth(data.device_token, data.user_id)
      await setPairingDeferred(true)
      router.replace('/tutorial')
    } catch (e: any) {
      Alert.alert(t('common.error'), e.message ?? t('onboarding.start_error'))
    } finally {
      setLoading(false)
    }
  }

  async function handleOpenPrivacyPolicy() {
    try {
      await openPrivacyPolicy()
    } catch {
      Alert.alert(t('common.error'), t('common.error_network'))
    }
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#fdf2f8', '#fce7f3', '#fbcfe8']}
        style={styles.header}
      >
        <View style={styles.logoContainer}>
          <Text style={styles.logoEmoji}>{"💌"}</Text>
          <Text style={styles.logoTitle}>Pairlog</Text>
          <Text style={styles.logoSubtitle}>{t('onboarding.title')}</Text>
          <Text style={styles.logoDesc}>
            {t('onboarding.description')}
          </Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        <Text style={styles.sectionTitle}>{t('onboarding.confirm_heading')}</Text>

        {agreements.map((text, i) => (
          <TouchableOpacity
            key={i}
            style={styles.checkRow}
            onPress={() => toggleCheck(i)}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, checked[i] && styles.checkboxChecked]}>
              {checked[i] && <Text style={styles.checkmark}>{"✓"}</Text>}
            </View>
            <Text style={styles.checkText}>{text}</Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={[styles.ctaButton, !allChecked && styles.ctaDisabled]}
          onPress={handleStart}
          disabled={!allChecked || loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color={Colors.textWhite} />
          ) : (
            <Text style={styles.ctaText}>{t('onboarding.cta')}</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.helperText}>{t('onboarding.helper')}</Text>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => router.replace('/register')}
        >
          <Text style={styles.secondaryText}>{t('onboarding.register_cta')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => router.replace('/login')}
        >
          <Text style={styles.linkText}>{t('onboarding.login_cta')}</Text>
        </TouchableOpacity>

        <Text style={styles.safetyNote}>
          {t('onboarding.safety_note')}
        </Text>
        <TouchableOpacity
          style={styles.privacyLinkButton}
          onPress={handleOpenPrivacyPolicy}
          activeOpacity={0.7}
        >
          <Text style={styles.privacyLinkText}>{t('onboarding.privacy_link')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingTop: 80,
    paddingBottom: 40,
    paddingHorizontal: 24,
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  logoTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: Colors.brandDark,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  logoSubtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  logoDesc: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: 24,
    paddingTop: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 20,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 1,
    flexShrink: 0,
  },
  checkboxChecked: {
    backgroundColor: Colors.brand,
    borderColor: Colors.brand,
  },
  checkmark: {
    color: Colors.textWhite,
    fontSize: 14,
    fontWeight: '700',
  },
  checkText: {
    flex: 1,
    fontSize: 16,
    color: Colors.textPrimary,
    lineHeight: 24,
  },
  ctaButton: {
    backgroundColor: Colors.brand,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 16,
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
  helperText: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 14,
  },
  secondaryButton: {
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.backgroundSecondary,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  secondaryText: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  linkButton: {
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 16,
  },
  linkText: {
    fontSize: 14,
    color: Colors.brand,
    fontWeight: '600',
  },
  safetyNote: {
    fontSize: 13,
    color: Colors.textTertiary,
    textAlign: 'center',
    lineHeight: 18,
  },
  privacyLinkButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  privacyLinkText: {
    fontSize: 13,
    color: Colors.brand,
    fontWeight: '600',
  },
})
