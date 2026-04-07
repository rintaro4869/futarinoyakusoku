import { StyleSheet, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../constants/colors'

export function HomeHeroArtwork() {
  return (
    <View style={styles.homeWrap}>
      <LinearGradient colors={['#fff6f8', '#fff9f1']} style={styles.canvas}>
        <View style={[styles.blob, styles.blobPink]} />
        <View style={[styles.blob, styles.blobOrange]} />
        <View style={[styles.person, styles.personLeft]}>
          <View style={styles.head} />
          <View style={[styles.body, { backgroundColor: Colors.brandLight }]} />
        </View>
        <View style={[styles.person, styles.personRight]}>
          <View style={styles.head} />
          <View style={[styles.body, { backgroundColor: Colors.orangeLight }]} />
        </View>
        <View style={[styles.floatBubble, styles.calendarBubble]}>
          <Ionicons name="calendar-outline" size={16} color={Colors.orangeDark} />
        </View>
        <View style={[styles.floatBubble, styles.heartBubble]}>
          <Ionicons name="heart" size={14} color={Colors.brandDark} />
        </View>
        <View style={[styles.floatBubble, styles.sparkBubble]}>
          <Ionicons name="sparkles" size={14} color={Colors.brandDark} />
        </View>
      </LinearGradient>
    </View>
  )
}

export function RewardHeroArtwork() {
  return (
    <View style={styles.rewardWrap}>
      <LinearGradient colors={['#fff7ed', '#fdf2f8']} style={styles.rewardCanvas}>
        <View style={[styles.blob, styles.blobPinkLarge]} />
        <View style={[styles.blob, styles.blobOrangeSmall]} />
        <View style={styles.giftCard}>
          <Ionicons name="gift" size={28} color={Colors.orangeDark} />
        </View>
        <View style={[styles.floatBubble, styles.rewardSpark]}>
          <Ionicons name="sparkles" size={14} color={Colors.brandDark} />
        </View>
        <View style={[styles.floatBubble, styles.rewardHeart]}>
          <Ionicons name="heart" size={13} color={Colors.brandDark} />
        </View>
      </LinearGradient>
    </View>
  )
}

const styles = StyleSheet.create({
  homeWrap: {
    width: 124,
    alignItems: 'flex-end',
  },
  rewardWrap: {
    width: 144,
  },
  canvas: {
    width: 118,
    height: 112,
    borderRadius: 28,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  rewardCanvas: {
    width: 140,
    height: 120,
    borderRadius: 28,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  blob: {
    position: 'absolute',
    borderRadius: 999,
  },
  blobPink: {
    width: 84,
    height: 84,
    top: 8,
    right: 6,
    backgroundColor: 'rgba(236, 72, 153, 0.12)',
  },
  blobOrange: {
    width: 74,
    height: 74,
    left: 6,
    top: 28,
    backgroundColor: 'rgba(249, 115, 22, 0.12)',
  },
  blobPinkLarge: {
    width: 92,
    height: 92,
    top: 8,
    right: 10,
    backgroundColor: 'rgba(236, 72, 153, 0.12)',
  },
  blobOrangeSmall: {
    width: 62,
    height: 62,
    left: 10,
    bottom: 10,
    backgroundColor: 'rgba(249, 115, 22, 0.14)',
  },
  person: {
    position: 'absolute',
    bottom: 8,
    alignItems: 'center',
  },
  personLeft: {
    left: 20,
  },
  personRight: {
    right: 20,
  },
  head: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff8f1',
    borderWidth: 1.5,
    borderColor: '#d5c8bc',
    marginBottom: 4,
  },
  body: {
    width: 26,
    height: 44,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    borderWidth: 1.5,
    borderColor: '#d5c8bc',
  },
  floatBubble: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
  calendarBubble: {
    top: 14,
    left: 16,
  },
  heartBubble: {
    top: 18,
    right: 18,
  },
  sparkBubble: {
    left: 44,
    top: 42,
  },
  giftCard: {
    width: 76,
    height: 76,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 4,
  },
  rewardSpark: {
    top: 18,
    left: 20,
  },
  rewardHeart: {
    bottom: 18,
    right: 18,
  },
})
