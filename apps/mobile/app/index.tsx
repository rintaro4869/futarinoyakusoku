import { useEffect, useState } from 'react'
import { View, ActivityIndicator, StyleSheet, Image, Text } from 'react-native'
import { useRouter } from 'expo-router'
import { useAuthStore } from '../lib/store'
import { getPairingDeferred, getTutorialSeen } from '../lib/storage'
import { Colors } from '../constants/colors'
import { t } from '../lib/i18n'

export default function IndexScreen() {
  const router = useRouter()
  const token = useAuthStore((s) => s.token)
  const coupleId = useAuthStore((s) => s.coupleId)
  const hydrated = useAuthStore((s) => s.hydrated)
  const [minimumSplashReached, setMinimumSplashReached] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setMinimumSplashReached(true), 550)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!hydrated || !minimumSplashReached) return

    async function redirect() {
      if (token && coupleId) {
        const seen = await getTutorialSeen()
        router.replace(seen ? '/(home)' : '/tutorial')
      } else if (token) {
        const [seen, pairingDeferred] = await Promise.all([
          getTutorialSeen(),
          getPairingDeferred(),
        ])
        router.replace(pairingDeferred ? (seen ? '/(home)' : '/tutorial') : '/pair')
      } else {
        router.replace('/onboarding')
      }
    }
    redirect()
    // router は useRouter() から返る安定した参照のため deps から除外
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, minimumSplashReached, token, coupleId])

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Image
          source={require('../assets/splash-icon.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>Pairlog</Text>
        <Text style={styles.subtitle}>{t('onboarding.description')}</Text>
        <ActivityIndicator size="small" color={Colors.brand} style={styles.loader} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.backgroundPink,
    paddingHorizontal: 24,
  },
  content: {
    alignItems: 'center',
    marginTop: -72,
  },
  logo: {
    width: 152,
    height: 152,
    marginBottom: 18,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.6,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '500',
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  loader: {
    marginTop: 18,
  },
})
