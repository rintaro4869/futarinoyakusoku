import { getAnalytics, logEvent, logScreenView } from '@react-native-firebase/analytics'
import { getCrashlytics, log as logCrashBreadcrumb } from '@react-native-firebase/crashlytics'

// Only fixed route names and coarse action labels leave the device. Never send
// names, notes, invite codes, email addresses, user IDs, or full URLs here.
const screens: Record<string, string> = {
  '/': 'entry',
  '/onboarding': 'onboarding',
  '/register': 'register',
  '/login': 'login',
  '/forgot-password': 'password_reset',
  '/pair': 'pairing',
  '/tutorial': 'tutorial',
  '/create-rule': 'create_rule',
  '/edit-rule': 'edit_rule',
  '/promises': 'promises',
  '/settings': 'settings',
  '/rewards': 'rewards',
  '/events': 'events',
  '/calendar': 'calendar',
  '/diary': 'diary',
  '/repair': 'repair',
  '/summary': 'summary',
}

export function trackScreen(pathname: string) {
  const screen = screens[pathname] ?? 'other'
  try {
    logScreenView(getAnalytics(), {
      screen_name: screen,
      screen_class: 'Pairlog',
    })
  } catch (error) {
    console.warn('Analytics screen view failed', error)
  }
}

export function trackAction(name: string, params?: Record<string, string>) {
  try {
    logEvent(getAnalytics(), name, params)
    // The breadcrumb carries only a fixed event name, never the event parameters.
    logCrashBreadcrumb(getCrashlytics(), name)
  } catch (error) {
    console.warn('Telemetry event failed', name, error)
  }
}
