import { Linking } from 'react-native'

export const PRIVACY_POLICY_URL = 'https://pairlog.pages.dev/privacy'

export async function openPrivacyPolicy() {
  return Linking.openURL(PRIVACY_POLICY_URL)
}
