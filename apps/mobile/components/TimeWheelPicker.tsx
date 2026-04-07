import { useEffect, useMemo, useRef } from 'react'
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native'
import { Colors } from '../constants/colors'
import { t } from '../lib/i18n'

const ITEM_HEIGHT = 44

type WheelColumnProps = {
  values: number[]
  selected: number
  onChange: (value: number) => void
  formatter?: (value: number) => string
}

function WheelColumn({ values, selected, onChange, formatter }: WheelColumnProps) {
  const ref = useRef<FlatList<number>>(null)
  const selectedIndex = Math.max(values.indexOf(selected), 0)

  useEffect(() => {
    ref.current?.scrollToOffset({ offset: selectedIndex * ITEM_HEIGHT, animated: false })
  }, [selectedIndex])

  function handleMomentumEnd(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const nextIndex = Math.round(event.nativeEvent.contentOffset.y / ITEM_HEIGHT)
    const safeIndex = Math.max(0, Math.min(values.length - 1, nextIndex))
    onChange(values[safeIndex])
  }

  return (
    <View style={styles.columnWrap}>
      <FlatList
        ref={ref}
        data={values}
        keyExtractor={(item) => String(item)}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        bounces={false}
        contentContainerStyle={styles.columnContent}
        getItemLayout={(_, index) => ({
          length: ITEM_HEIGHT,
          offset: ITEM_HEIGHT * index,
          index,
        })}
        onMomentumScrollEnd={handleMomentumEnd}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text style={[styles.itemText, item === selected && styles.itemTextSelected]}>
              {formatter ? formatter(item) : String(item).padStart(2, '0')}
            </Text>
          </View>
        )}
      />
      <View pointerEvents="none" style={styles.selectionOverlay} />
    </View>
  )
}

type TimeWheelPickerProps = {
  visible: boolean
  hour: number
  minute: number
  minuteStep?: number
  title?: string
  onChangeHour: (value: number) => void
  onChangeMinute: (value: number) => void
  onClose: () => void
  onConfirm: () => void
}

export function TimeWheelPicker({
  visible,
  hour,
  minute,
  minuteStep = 5,
  title,
  onChangeHour,
  onChangeMinute,
  onClose,
  onConfirm,
}: TimeWheelPickerProps) {
  const hours = useMemo(() => Array.from({ length: 24 }, (_, index) => index), [])
  const minutes = useMemo(
    () => Array.from({ length: Math.floor(60 / minuteStep) }, (_, index) => index * minuteStep),
    [minuteStep]
  )

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <TouchableOpacity onPress={onClose} activeOpacity={0.75}>
              <Text style={styles.cancelText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
            <Text style={styles.sheetTitle}>{title ?? t('rule.reminder_time_label')}</Text>
            <TouchableOpacity onPress={onConfirm} activeOpacity={0.75}>
              <Text style={styles.confirmText}>{t('common.done')}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.previewRow}>
            <Text style={styles.previewValue}>
              {String(hour).padStart(2, '0')}:{String(minute).padStart(2, '0')}
            </Text>
          </View>

          <View style={styles.wheelsRow}>
            <WheelColumn values={hours} selected={hour} onChange={onChangeHour} />
            <Text style={styles.colon}>:</Text>
            <WheelColumn values={minutes} selected={minute} onChange={onChangeMinute} />
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(31, 26, 23, 0.24)',
    justifyContent: 'flex-end',
    padding: 16,
  },
  sheet: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 24,
    paddingTop: 18,
    paddingBottom: 24,
    paddingHorizontal: 18,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  sheetTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  confirmText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.brand,
  },
  previewRow: {
    alignItems: 'center',
    marginBottom: 14,
  },
  previewValue: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.8,
  },
  wheelsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  columnWrap: {
    width: 110,
    height: ITEM_HEIGHT * 5,
    position: 'relative',
  },
  columnContent: {
    paddingVertical: ITEM_HEIGHT * 2,
  },
  item: {
    height: ITEM_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemText: {
    fontSize: 24,
    fontWeight: '500',
    color: Colors.textTertiary,
  },
  itemTextSelected: {
    color: Colors.textPrimary,
    fontWeight: '800',
  },
  selectionOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: ITEM_HEIGHT * 2,
    height: ITEM_HEIGHT,
    borderRadius: 14,
    backgroundColor: 'rgba(236,72,153,0.07)',
    borderWidth: 1.5,
    borderColor: 'rgba(236,72,153,0.25)',
  },
  colon: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.textSecondary,
  },
})
