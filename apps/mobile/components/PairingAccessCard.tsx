import { ReactNode } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../constants/colors'

type PairingAccessCardProps = {
  title: string
  description: string
  primaryLabel: string
  onPrimaryPress: () => void
  secondaryLabel?: string
  onSecondaryPress?: () => void
  icon?: ReactNode
}

export function PairingAccessCard({
  title,
  description,
  primaryLabel,
  onPrimaryPress,
  secondaryLabel,
  onSecondaryPress,
  icon,
}: PairingAccessCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.iconWrap}>
        {icon ?? <Ionicons name="link-outline" size={20} color={Colors.brandDark} />}
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>

      <TouchableOpacity style={styles.primaryButton} onPress={onPrimaryPress} activeOpacity={0.85}>
        <Text style={styles.primaryButtonText}>{primaryLabel}</Text>
      </TouchableOpacity>

      {secondaryLabel && onSecondaryPress ? (
        <TouchableOpacity style={styles.secondaryButton} onPress={onSecondaryPress} activeOpacity={0.8}>
          <Text style={styles.secondaryButtonText}>{secondaryLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 2,
    alignItems: 'flex-start',
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.brandLighter,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 21,
    lineHeight: 29,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    lineHeight: 21,
    color: Colors.textSecondary,
    marginBottom: 18,
  },
  primaryButton: {
    width: '100%',
    backgroundColor: Colors.brand,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: Colors.textWhite,
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryButton: {
    width: '100%',
    marginTop: 10,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
})
