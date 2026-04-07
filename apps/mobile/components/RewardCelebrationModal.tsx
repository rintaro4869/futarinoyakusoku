import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../constants/colors'
import { t } from '../lib/i18n'

type Props = {
  visible: boolean
  rewardName: string
  remaining: number
  onPrimary: () => void
  onClose: () => void
  primaryLabel?: string
}

export function RewardCelebrationModal({
  visible,
  rewardName,
  remaining,
  onPrimary,
  onClose,
  primaryLabel,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <LinearGradient
            colors={['#fff7ed', '#fff1f2', '#fdf2f8']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.hero}
          >
            <View style={styles.sparkleOne} />
            <View style={styles.sparkleTwo} />
            <View style={styles.iconBubble}>
              <Ionicons name="gift" size={30} color={Colors.orangeDark} />
            </View>
            <View style={styles.iconBubbleSmall}>
              <Ionicons name="sparkles" size={16} color={Colors.brandDark} />
            </View>
            <Text style={styles.eyebrow}>{t('rewards.celebration_eyebrow')}</Text>
            <Text style={styles.title}>{remaining === 0 ? t('rewards.celebration_ready_title') : t('rewards.celebration_close_title')}</Text>
            <Text style={styles.rewardName}>{rewardName}</Text>
            <Text style={styles.description}>
              {remaining === 0
                ? t('rewards.celebration_ready_desc')
                : t('rewards.celebration_close_desc', { n: remaining })}
            </Text>
          </LinearGradient>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.secondaryBtn} onPress={onClose} activeOpacity={0.8}>
              <Text style={styles.secondaryBtnText}>{t('common.close')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.primaryBtn} onPress={onPrimary} activeOpacity={0.85}>
              <Text style={styles.primaryBtnText}>{primaryLabel ?? t('rewards.celebration_cta')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(26, 18, 14, 0.38)',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.16,
    shadowRadius: 28,
    elevation: 10,
  },
  hero: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 24,
    alignItems: 'center',
  },
  sparkleOne: {
    position: 'absolute',
    top: 22,
    right: 28,
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(236, 72, 153, 0.11)',
  },
  sparkleTwo: {
    position: 'absolute',
    top: 74,
    left: 24,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(249, 115, 22, 0.12)',
  },
  iconBubble: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  iconBubbleSmall: {
    position: 'absolute',
    top: 26,
    left: 54,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.brandDark,
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  title: {
    fontSize: 23,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 4,
    textAlign: 'center',
  },
  rewardName: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.orangeDark,
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    padding: 18,
    backgroundColor: Colors.background,
  },
  primaryBtn: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: Colors.brand,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: Colors.textWhite,
    fontWeight: '800',
    fontSize: 15,
  },
  secondaryBtn: {
    borderRadius: 16,
    backgroundColor: Colors.surfaceMuted,
    paddingHorizontal: 18,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    color: Colors.textSecondary,
    fontWeight: '700',
    fontSize: 14,
  },
})
