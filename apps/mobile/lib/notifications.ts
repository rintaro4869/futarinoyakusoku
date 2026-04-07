import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'
import { Rule } from './api'
import { buildReminderDates } from './reminders'
import { t } from './i18n'

// 通知を受け取った時の表示方法を設定
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
})

// ─── 権限リクエスト ────────────────────────────────────────────

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('reminders', {
      name: t('notifications.channel_name'),
      importance: Notifications.AndroidImportance.DEFAULT,
    })
  }

  const { status: existing } = await Notifications.getPermissionsAsync()
  if (existing === 'granted') return true

  const { status } = await Notifications.requestPermissionsAsync()
  return status === 'granted'
}

// ─── スケジュール登録 ─────────────────────────────────────────

export async function scheduleRuleReminder(rule: Rule): Promise<void> {
  const reminderDates = buildReminderDates(rule)
  if (reminderDates.length === 0) return

  for (const triggerDate of reminderDates) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: t('notifications.reminder_title'),
        body: t('notifications.reminder_body', { title: rule.title }),
        data: { rule_id: rule.id, trigger_at: triggerDate.toISOString() },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
      },
    })
  }
}

// ─── キャンセル ───────────────────────────────────────────────

export async function cancelRuleReminder(ruleId: string): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync()
  const targets = scheduled.filter((item) => item.content.data?.rule_id === ruleId)
  await Promise.all(targets.map((item) => Notifications.cancelScheduledNotificationAsync(item.identifier)))
}

// ─── 全ルール一括再スケジュール ───────────────────────────────

// edit/create 後に呼ぶ。全通知をクリアしてから再登録する
export async function rescheduleAllReminders(rules: Rule[]): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync()
  for (const rule of rules) {
    if (rule.active && rule.reminder_enabled && rule.reminder_time) {
      await scheduleRuleReminder(rule)
    }
  }
}
