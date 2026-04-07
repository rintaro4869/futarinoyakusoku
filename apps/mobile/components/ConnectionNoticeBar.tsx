import { TouchableOpacity, View, Text, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../constants/colors'
import { t } from '../lib/i18n'

type ConnectionNoticeBarProps = {
  onPress: () => void
}

export function ConnectionNoticeBar({ onPress }: ConnectionNoticeBarProps) {
  return (
    <TouchableOpacity style={styles.wrap} onPress={onPress} activeOpacity={0.82}>
      <View style={styles.badge}>
        <Ionicons name="link-outline" size={13} color={Colors.brandDark} />
        <Text style={styles.badgeText}>{t('common.partner_pending')}</Text>
      </View>
      <View style={styles.actionRow}>
        <Text style={styles.buttonText}>{t('common.partner_invite_cta')}</Text>
        <Ionicons name="chevron-forward" size={15} color={Colors.brandDark} />
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 4,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 14,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
  },
  buttonText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.brandDark,
  },
})
