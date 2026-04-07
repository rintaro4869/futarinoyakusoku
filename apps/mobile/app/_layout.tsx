import { useEffect } from 'react'
import { Stack } from 'expo-router'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { useAuthStore } from '../lib/store'

export default function RootLayout() {
  const hydrate = useAuthStore((s) => s.hydrate)

  useEffect(() => {
    hydrate()
  }, [hydrate])

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="register" />
        <Stack.Screen name="login" />
        <Stack.Screen name="forgot-password" />
        <Stack.Screen name="pair" />
        <Stack.Screen name="tutorial" />
        <Stack.Screen name="create-rule" options={{ presentation: 'modal' }} />
        <Stack.Screen name="edit-rule" options={{ presentation: 'modal' }} />
        <Stack.Screen name="promises" />
        <Stack.Screen name="(home)" />
      </Stack>
    </SafeAreaProvider>
  )
}
