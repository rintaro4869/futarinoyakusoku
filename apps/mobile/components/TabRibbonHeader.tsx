import { ReactNode } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Colors } from '../constants/colors'

type TabRibbonHeaderProps = {
  eyebrow?: string
  title: string
  subtitle?: string
  rightSlot?: ReactNode
}

export function TabRibbonHeader({ eyebrow, title, subtitle, rightSlot }: TabRibbonHeaderProps) {
  const insets = useSafeAreaInsets()
  const paddingTop = Math.max(insets.top + 6, 34)

  return (
    <LinearGradient
      colors={['#fff9f5', '#fff6f7', '#fef7f4']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.header, { paddingTop }]}
    >
      <View style={styles.row}>
        <View style={[styles.copy, rightSlot ? styles.copyWithAction : null]}>
          <View style={styles.eyebrowSlot}>
            {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
          </View>
          <Text style={styles.title}>{title}</Text>
          <View style={styles.subtitleSlot}>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </View>
        </View>
        {rightSlot ? <View style={styles.action}>{rightSlot}</View> : null}
      </View>
      <LinearGradient
        colors={['rgba(236,72,153,0)', 'rgba(236,72,153,0.16)', 'rgba(249,115,22,0.12)', 'rgba(249,115,22,0)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.divider}
      />
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  header: {
    position: 'relative',
    overflow: 'hidden',
    paddingHorizontal: 18,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(220, 207, 197, 0.32)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  copy: {
    flex: 1,
    flexShrink: 1,
    minHeight: 72,
    justifyContent: 'space-between',
  },
  copyWithAction: {
    paddingRight: 12,
  },
  eyebrowSlot: {
    minHeight: 16,
    justifyContent: 'flex-end',
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    color: '#c56b87',
    letterSpacing: 0.45,
  },
  title: {
    fontSize: 27,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
    lineHeight: 33,
  },
  subtitleSlot: {
    minHeight: 18,
    justifyContent: 'flex-start',
  },
  subtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
    opacity: 0.94,
    lineHeight: 16,
  },
  action: {
    alignSelf: 'center',
    zIndex: 1,
  },
  divider: {
    position: 'absolute',
    left: 18,
    right: 18,
    bottom: 0,
    height: 2,
  },
})
