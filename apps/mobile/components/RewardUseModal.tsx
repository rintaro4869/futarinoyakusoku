import { useEffect, useRef } from 'react'
import {
  Animated,
  Easing,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../constants/colors'
import { t } from '../lib/i18n'

type Props = {
  visible: boolean
  rewardName: string
  onCancel: () => void
  onConfirm: () => void
}

export function RewardUseModal({ visible, rewardName, onCancel, onConfirm }: Props) {
  const cardScale = useRef(new Animated.Value(0.94)).current
  const iconScale = useRef(new Animated.Value(0.7)).current
  const ringScale = useRef(new Animated.Value(0.4)).current
  const ringOpacity = useRef(new Animated.Value(0)).current
  const sparkleOpacity = useRef(new Animated.Value(0)).current
  const sparkleLift = useRef(new Animated.Value(8)).current

  useEffect(() => {
    if (!visible) return

    cardScale.setValue(0.94)
    iconScale.setValue(0.7)
    ringScale.setValue(0.4)
    ringOpacity.setValue(0)
    sparkleOpacity.setValue(0)
    sparkleLift.setValue(8)

    Animated.parallel([
      Animated.spring(cardScale, {
        toValue: 1,
        friction: 7,
        tension: 80,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.spring(iconScale, {
          toValue: 1.08,
          friction: 5,
          tension: 110,
          useNativeDriver: true,
        }),
        Animated.spring(iconScale, {
          toValue: 1,
          friction: 6,
          tension: 90,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.delay(80),
        Animated.parallel([
          Animated.timing(ringOpacity, {
            toValue: 0.55,
            duration: 120,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(ringScale, {
            toValue: 1.2,
            duration: 540,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(sparkleOpacity, {
            toValue: 1,
            duration: 220,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(sparkleLift, {
            toValue: -10,
            duration: 520,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(ringOpacity, {
          toValue: 0,
          duration: 220,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    ]).start()
  }, [visible, cardScale, iconScale, ringOpacity, ringScale, sparkleLift, sparkleOpacity])

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <Animated.View style={[styles.card, { transform: [{ scale: cardScale }] }]}>
          <LinearGradient
            colors={['#fff8ef', '#fff4fb', '#fff9f3']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.hero}
          >
            <View style={styles.glowLeft} />
            <View style={styles.glowRight} />
            <Animated.View
              style={[
                styles.ring,
                {
                  opacity: ringOpacity,
                  transform: [{ scale: ringScale }],
                },
              ]}
            />
            <Animated.View style={[styles.iconBubble, { transform: [{ scale: iconScale }] }]}>
              <Ionicons name="gift" size={34} color={Colors.orangeDark} />
            </Animated.View>
            <Animated.View
              style={[
                styles.sparkleChip,
                styles.sparkleChipLeft,
                {
                  opacity: sparkleOpacity,
                  transform: [{ translateY: sparkleLift }, { rotate: '-8deg' }],
                },
              ]}
            >
              <Ionicons name="sparkles" size={16} color={Colors.brandDark} />
            </Animated.View>
            <Animated.View
              style={[
                styles.sparkleChip,
                styles.sparkleChipRight,
                {
                  opacity: sparkleOpacity,
                  transform: [{ translateY: sparkleLift }, { rotate: '10deg' }],
                },
              ]}
            >
              <Ionicons name="heart" size={14} color={Colors.brandDark} />
            </Animated.View>
            <Text style={styles.eyebrow}>{t('rewards.use_celebration_eyebrow')}</Text>
            <Text style={styles.title}>{t('rewards.use_celebration_title')}</Text>
            <Text style={styles.rewardName}>{rewardName}</Text>
            <Text style={styles.description}>
              {t('rewards.use_celebration_desc', { name: rewardName })}
            </Text>
          </LinearGradient>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.secondaryBtn} onPress={onCancel} activeOpacity={0.85}>
              <Text style={styles.secondaryBtnText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.primaryBtn} onPress={onConfirm} activeOpacity={0.85}>
              <Text style={styles.primaryBtnText}>{t('rewards.use')}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(28, 20, 17, 0.34)',
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
    paddingTop: 30,
    paddingBottom: 22,
    alignItems: 'center',
    overflow: 'hidden',
  },
  glowLeft: {
    position: 'absolute',
    top: 24,
    left: 18,
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: 'rgba(249, 115, 22, 0.11)',
  },
  glowRight: {
    position: 'absolute',
    top: 54,
    right: 20,
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(236, 72, 153, 0.11)',
  },
  ring: {
    position: 'absolute',
    top: 44,
    width: 116,
    height: 116,
    borderRadius: 58,
    borderWidth: 2,
    borderColor: 'rgba(236, 72, 153, 0.24)',
  },
  iconBubble: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: 'rgba(255,255,255,0.93)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 5,
  },
  sparkleChip: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.88)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sparkleChipLeft: {
    top: 62,
    left: 54,
  },
  sparkleChipRight: {
    top: 96,
    right: 54,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.brandDark,
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 4,
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
    paddingHorizontal: 8,
  },
  actions: {
    padding: 18,
    backgroundColor: Colors.background,
    flexDirection: 'row',
    gap: 10,
  },
  secondaryBtn: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: Colors.surfaceElevated,
  },
  secondaryBtnText: {
    color: Colors.textSecondary,
    fontWeight: '700',
    fontSize: 15,
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
})
