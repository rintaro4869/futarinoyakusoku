import { useCallback, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useFocusEffect } from 'expo-router'
import { TabRibbonHeader } from '../../components/TabRibbonHeader'
import { Colors } from '../../constants/colors'
import { createDiaryEntry, DiaryEntry, Event, getDiaryEntries, getEvents, updateDiaryEntry } from '../../lib/api'
import { getLocaleTag, t } from '../../lib/i18n'
import { createLocalDiaryEntry, getLocalDiaryEntries, getLocalEvents, updateLocalDiaryEntry } from '../../lib/local-mode'
import { useAuthStore } from '../../lib/store'

type TimelineItem =
  | { kind: 'diary'; data: DiaryEntry }
  | { kind: 'event'; data: Event }

type GroupedItem = {
  dateKey: string
  label: string
  items: TimelineItem[]
}

function toLocalDateKey(dateStr: string): string {
  const date = new Date(dateStr)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatDateHeader(dateStr: string): string {
  const date = new Date(dateStr)
  const localeTag = getLocaleTag()

  if (localeTag.startsWith('ja')) {
    const weekday = ['日', '月', '火', '水', '木', '金', '土'][date.getDay()]
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日（${weekday}）`
  }

  return new Intl.DateTimeFormat(localeTag, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  }).format(date)
}

function formatSectionEyebrow(dateStr?: string): string {
  const date = dateStr ? new Date(dateStr) : new Date()
  return new Intl.DateTimeFormat(getLocaleTag(), {
    year: 'numeric',
    month: 'long',
  }).format(date)
}

function formatTime(dateStr: string): string {
  return new Intl.DateTimeFormat(getLocaleTag(), {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateStr))
}

function getItemCreatedAt(item: TimelineItem): string {
  return item.data.created_at
}

function isDiaryOwnedByCurrentUser(entry: DiaryEntry, userId: string | null): boolean {
  return entry.author_user_id === (userId ?? 'guest')
}

function JournalEmptyState({ onWrite }: { onWrite: () => void }) {
  return (
    <LinearGradient
      colors={['#fffdf8', '#fff7ef']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.emptyCard}
    >
      <View style={styles.emptySpine} />
      <View style={styles.emptyBookmark} />
      <View style={styles.emptySeal}>
        <Ionicons name="book-outline" size={28} color={Colors.orangeDark} />
      </View>
      <Text style={styles.emptyTitle}>{t('diary.empty_title')}</Text>
      <Text style={styles.emptyDesc}>{t('diary.empty_desc')}</Text>
      <View style={styles.emptyLines}>
        <View style={styles.emptyLine} />
        <View style={styles.emptyLine} />
        <View style={styles.emptyLineShort} />
      </View>
      <TouchableOpacity
        style={styles.emptyHintChip}
        onPress={onWrite}
        activeOpacity={0.82}
      >
        <Ionicons name="create-outline" size={14} color={Colors.brandDark} />
        <Text style={styles.emptyHintText}>{t('diary.write_btn')}</Text>
      </TouchableOpacity>
    </LinearGradient>
  )
}

function TimelineCard({
  item,
  userId,
  onEdit,
}: {
  item: TimelineItem
  userId: string | null
  onEdit?: (entry: DiaryEntry) => void
}) {
  const isDiary = item.kind === 'diary'
  const createdAt = item.data.created_at
  const accent = isDiary ? Colors.orangeDark : Colors.brandDark
  const accentBg = isDiary ? 'rgba(249,115,22,0.10)' : 'rgba(236,72,153,0.10)'

  if (isDiary) {
    const diaryEntry = item.data
    const isMe = isDiaryOwnedByCurrentUser(diaryEntry, userId)
    const canEdit = Boolean(isMe && onEdit)
    const content = (
      <>
        <View style={[styles.entryBookmark, { backgroundColor: accent }]} />
        <View style={styles.entryHeader}>
          <View
            style={[
              styles.entryLabelChip,
              { backgroundColor: accentBg },
              canEdit ? styles.entryLabelChipEditable : null,
            ]}
          >
            <Ionicons name="create-outline" size={13} color={accent} />
            <Text style={[styles.entryLabelText, { color: accent }]}>{t('diary.entry_label')}</Text>
            {canEdit ? <Ionicons name="pencil" size={11} color={accent} /> : null}
          </View>
          <View style={styles.entryMetaChip}>
            <Ionicons name="time-outline" size={13} color={Colors.textTertiary} />
            <Text style={styles.entryMetaChipText}>{formatTime(createdAt)}</Text>
          </View>
        </View>

        <View style={styles.entryRule} />

        <Text style={styles.entryBody}>{diaryEntry.body}</Text>

        <View style={styles.entryFooter}>
          <View style={styles.entryAuthorRow}>
            <Ionicons name={isMe ? 'person' : 'people'} size={13} color={Colors.textSecondary} />
            <Text style={styles.entryAuthorText}>
              {isMe ? t('points.me') : t('points.partner')}
            </Text>
          </View>
          {canEdit ? <Text style={styles.entryEditHint}>{t('common.edit')}</Text> : null}
        </View>
      </>
    )

    if (canEdit && onEdit) {
      return (
        <TouchableOpacity
          style={[styles.entryCard, styles.entryCardEditable, styles.entryCardNote]}
          onPress={() => onEdit(diaryEntry)}
          activeOpacity={0.86}
        >
          {content}
        </TouchableOpacity>
      )
    }

    return (
      <View style={[styles.entryCard, styles.entryCardNote]}>
        {content}
      </View>
    )
  }

  const isMe = item.data.report_type === 'self'
  const content = (
    <>
      <View style={[styles.entryBookmark, { backgroundColor: accent }]} />
      <View style={styles.entryHeader}>
        <View style={[styles.entryLabelChip, { backgroundColor: accentBg }]}>
          <Ionicons name="heart" size={13} color={accent} />
          <Text style={[styles.entryLabelText, { color: accent }]}>{t('diary.thankyou_label')}</Text>
        </View>
        <View style={styles.entryMetaChip}>
          <Ionicons name="time-outline" size={13} color={Colors.textTertiary} />
          <Text style={styles.entryMetaChipText}>{formatTime(createdAt)}</Text>
        </View>
      </View>

      <View style={styles.entryRule} />

      <Text style={[styles.entryBody, styles.entryBodyThanks]}>{item.data.note ?? ''}</Text>

      {item.data.memo ? (
        <View style={styles.memoPanel}>
          <Text style={styles.memoText}>{item.data.memo}</Text>
        </View>
      ) : null}

      <View style={styles.entryFooter}>
        <View style={styles.entryAuthorRow}>
          <Ionicons name={isMe ? 'person' : 'people'} size={13} color={Colors.textSecondary} />
          <Text style={styles.entryAuthorText}>
            {isMe ? t('points.me') : t('points.partner')}
          </Text>
        </View>
      </View>
    </>
  )

  return (
    <View style={[styles.entryCard, styles.entryCardThanks]}>
      {content}
    </View>
  )
}

export default function DiaryScreen() {
  const coupleId = useAuthStore((state) => state.coupleId)
  const userId = useAuthStore((state) => state.userId)
  const [items, setItems] = useState<TimelineItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [draftBody, setDraftBody] = useState('')
  const [saving, setSaving] = useState(false)
  const [editingEntry, setEditingEntry] = useState<DiaryEntry | null>(null)

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)

    try {
      const merged: TimelineItem[] = coupleId
        ? await Promise.all([
            getDiaryEntries(coupleId),
            getEvents(coupleId, 'approved'),
          ]).then(([diaryRes, eventsRes]) => {
            const eventsWithNote = eventsRes.items.filter((event) => Boolean(event.note))
            return [
              ...diaryRes.items.map((entry) => ({ kind: 'diary' as const, data: entry })),
              ...eventsWithNote.map((event) => ({ kind: 'event' as const, data: event })),
            ]
          })
        : await Promise.all([
            getLocalDiaryEntries(userId),
            getLocalEvents(userId),
          ]).then(([diaryEntries, localEvents]) => {
            const eventsWithNote = localEvents.filter((event) => Boolean(event.note))
            return [
              ...diaryEntries.map((entry) => ({ kind: 'diary' as const, data: entry })),
              ...eventsWithNote.map((event) => ({ kind: 'event' as const, data: event })),
            ]
          })

      merged.sort((a, b) => (
        new Date(getItemCreatedAt(b)).getTime() - new Date(getItemCreatedAt(a)).getTime()
      ))
      setItems(merged)
    } catch (e: any) {
      Alert.alert(t('common.error'), e.message ?? t('common.error_network'))
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [coupleId, userId])

  useFocusEffect(useCallback(() => {
    void load()
  }, [load]))

  function openComposer() {
    setEditingEntry(null)
    setDraftBody('')
    setShowModal(true)
  }

  function openEditor(entry: DiaryEntry) {
    setEditingEntry(entry)
    setDraftBody(entry.body)
    setShowModal(true)
  }

  async function handleSave() {
    if (!draftBody.trim()) return

    setSaving(true)
    try {
      if (editingEntry) {
        if (coupleId) {
          await updateDiaryEntry(editingEntry.id, draftBody.trim())
        } else {
          await updateLocalDiaryEntry(userId, editingEntry.id, draftBody.trim())
        }
      } else {
        if (coupleId) {
          await createDiaryEntry(coupleId, draftBody.trim())
        } else {
          await createLocalDiaryEntry(userId, draftBody.trim())
        }
      }
      setShowModal(false)
      setDraftBody('')
      setEditingEntry(null)
      await load()
    } catch (e: any) {
      Alert.alert(t('common.error'), e.message ?? t('common.error_network'))
    } finally {
      setSaving(false)
    }
  }

  const grouped: GroupedItem[] = []
  for (const item of items) {
    const createdAt = getItemCreatedAt(item)
    const dateKey = toLocalDateKey(createdAt)
    const lastGroup = grouped[grouped.length - 1]

    if (lastGroup?.dateKey === dateKey) {
      lastGroup.items.push(item)
    } else {
      grouped.push({
        dateKey,
        label: formatDateHeader(createdAt),
        items: [item],
      })
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.brand} />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <TabRibbonHeader
        eyebrow={formatSectionEyebrow(items[0]?.data.created_at)}
        title={t('diary.title')}
        rightSlot={(
          <TouchableOpacity
            style={styles.writeBtn}
            onPress={openComposer}
            activeOpacity={0.82}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="create-outline" size={14} color={Colors.brandDark} />
            <Text style={styles.writeBtnText}>{t('diary.write_btn')}</Text>
          </TouchableOpacity>
        )}
      />

      <LinearGradient
        colors={['#f8f3ed', '#f6efe8', '#f4eee8']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.bodyGradient}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          refreshControl={(
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void load(true)}
              tintColor={Colors.brand}
            />
          )}
        >
          {items.length === 0 ? <JournalEmptyState onWrite={openComposer} /> : null}

          {grouped.map((group) => (
            <View key={group.dateKey} style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionLine} />
                <View style={styles.sectionBadge}>
                  <Text style={styles.sectionBadgeText}>{group.label}</Text>
                </View>
                <View style={styles.sectionLine} />
              </View>

              <View style={styles.sectionBody}>
                <View style={styles.sectionSpine} />
                {group.items.map((item) => (
                  <TimelineCard
                    key={item.data.id}
                    item={item}
                    userId={userId}
                    onEdit={openEditor}
                  />
                ))}
              </View>
            </View>
          ))}

          <View style={styles.bottomPad} />
        </ScrollView>
      </LinearGradient>

      <Modal
        visible={showModal}
        animationType="slide"
        transparent
        onRequestClose={() => {
          setShowModal(false)
          setDraftBody('')
          setEditingEntry(null)
        }}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={() => {
                  setShowModal(false)
                  setDraftBody('')
                  setEditingEntry(null)
                }}
                activeOpacity={0.72}
              >
                <Text style={styles.modalCancel}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>
                {editingEntry ? `${t('common.edit')} · ${t('diary.entry_label')}` : t('diary.modal_title')}
              </Text>
              <TouchableOpacity
                onPress={() => void handleSave()}
                disabled={!draftBody.trim() || saving}
                activeOpacity={0.72}
              >
                {saving ? (
                  <ActivityIndicator size="small" color={Colors.brand} />
                ) : (
                  <Text style={[styles.modalSave, !draftBody.trim() && styles.modalSaveDisabled]}>
                    {t('diary.modal_save')}
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.modalEditor}>
              <View style={styles.modalMargin} />
              <View style={styles.modalPaper}>
                <TextInput
                  style={styles.modalInput}
                  placeholder={t('diary.modal_placeholder')}
                  placeholderTextColor={Colors.textTertiary}
                  value={draftBody}
                  onChangeText={setDraftBody}
                  multiline
                  numberOfLines={8}
                  textAlignVertical="top"
                  autoFocus
                  maxLength={2000}
                />
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundSecondary,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
  },
  bodyGradient: {
    flex: 1,
  },
  writeBtn: {
    minHeight: 38,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 252, 248, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(236, 72, 153, 0.14)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  writeBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.brandDark,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 48,
  },
  emptyCard: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 30,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 28,
    borderWidth: 1,
    borderColor: 'rgba(220, 207, 197, 0.72)',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 3,
  },
  emptySpine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 22,
    width: 2,
    backgroundColor: 'rgba(198, 185, 172, 0.58)',
  },
  emptyBookmark: {
    position: 'absolute',
    top: 0,
    right: 26,
    width: 18,
    height: 72,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    backgroundColor: 'rgba(236, 72, 153, 0.18)',
  },
  emptySeal: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.82)',
    marginLeft: 18,
    marginBottom: 18,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 8,
    paddingLeft: 18,
  },
  emptyDesc: {
    fontSize: 15,
    lineHeight: 24,
    color: Colors.textSecondary,
    paddingLeft: 18,
  },
  emptyLines: {
    gap: 10,
    marginTop: 22,
    paddingLeft: 18,
  },
  emptyLine: {
    height: 1,
    backgroundColor: 'rgba(180, 168, 158, 0.28)',
  },
  emptyLineShort: {
    width: '72%',
    height: 1,
    backgroundColor: 'rgba(180, 168, 158, 0.28)',
  },
  emptyHintChip: {
    alignSelf: 'flex-start',
    marginTop: 20,
    marginLeft: 18,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 246, 249, 0.96)',
    borderWidth: 1,
    borderColor: 'rgba(236, 72, 153, 0.16)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  emptyHintText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.brandDark,
  },
  section: {
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(186, 173, 162, 0.36)',
  },
  sectionBadge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: 'rgba(255, 252, 247, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(220, 207, 197, 0.72)',
  },
  sectionBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
    letterSpacing: 0.2,
  },
  sectionBody: {
    position: 'relative',
    paddingLeft: 16,
    gap: 12,
  },
  sectionSpine: {
    position: 'absolute',
    left: 5,
    top: 8,
    bottom: 10,
    width: 2,
    borderRadius: 999,
    backgroundColor: 'rgba(203, 191, 181, 0.55)',
  },
  entryCard: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 26,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 16,
    borderWidth: 1,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 3,
  },
  entryCardEditable: {
    transform: [{ translateX: 0 }],
  },
  entryCardNote: {
    backgroundColor: '#fffaf2',
    borderColor: 'rgba(222, 205, 182, 0.86)',
  },
  entryCardThanks: {
    backgroundColor: '#fff5f7',
    borderColor: 'rgba(239, 205, 216, 0.86)',
  },
  entryBookmark: {
    position: 'absolute',
    top: 0,
    right: 18,
    width: 16,
    height: 54,
    borderBottomLeftRadius: 7,
    borderBottomRightRadius: 7,
    opacity: 0.18,
  },
  entryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  entryLabelChip: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  entryLabelChipEditable: {
    paddingRight: 12,
  },
  entryLabelText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.25,
  },
  entryMetaChip: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: 'rgba(255,255,255,0.7)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  entryMetaChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  entryRule: {
    height: 1,
    marginTop: 12,
    marginBottom: 14,
    backgroundColor: 'rgba(171, 156, 144, 0.18)',
  },
  entryBody: {
    fontSize: 17,
    lineHeight: 28,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  entryBodyThanks: {
    fontWeight: '700',
  },
  memoPanel: {
    marginTop: 12,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.58)',
    borderWidth: 1,
    borderColor: 'rgba(236, 72, 153, 0.08)',
  },
  memoText: {
    fontSize: 14,
    lineHeight: 22,
    color: Colors.textSecondary,
  },
  entryFooter: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(171, 156, 144, 0.18)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  entryAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  entryAuthorText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '700',
  },
  entryEditHint: {
    fontSize: 12,
    color: Colors.textTertiary,
    fontWeight: '700',
  },
  bottomPad: {
    height: 28,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(35, 24, 18, 0.24)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#fffdf8',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 10,
  },
  modalHandle: {
    alignSelf: 'center',
    width: 42,
    height: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(161, 149, 140, 0.45)',
    marginBottom: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(220, 207, 197, 0.72)',
  },
  modalCancel: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  modalSave: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.brand,
  },
  modalSaveDisabled: {
    color: Colors.disabledText,
  },
  modalEditor: {
    flexDirection: 'row',
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 42,
    gap: 12,
  },
  modalMargin: {
    width: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(236, 72, 153, 0.16)',
  },
  modalPaper: {
    flex: 1,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(220, 207, 197, 0.86)',
    backgroundColor: '#fffaf2',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  modalInput: {
    minHeight: 190,
    fontSize: 16,
    lineHeight: 28,
    color: Colors.textPrimary,
  },
})
