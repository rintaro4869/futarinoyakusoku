import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // サンキュー解放: ありがとうがたまったときのごほうび
  const thankYouTemplates = [
    { id: 'ty_snack_01', category: 'thank_you', label: 'おやつを選ぶ権利', description: '今週のおやつを自分が選んでいい', active: true },
    { id: 'ty_date_01', category: 'thank_you', label: '次のデートを企画する', description: '行き先・内容を自分がプランニングする', active: true },
    { id: 'ty_movie_01', category: 'thank_you', label: '映画・動画を選ぶ権利', description: '次の週末に見る作品を自分が選ぶ', active: true },
    { id: 'ty_rest_01', category: 'thank_you', label: '自由時間を1時間もらう', description: '相手に気を使わず1時間好きに過ごす', active: true },
    { id: 'ty_meal_01', category: 'thank_you', label: '食事メニューをリクエスト', description: '食べたいものを1回リクエストする', active: true },
  ]

  // 約束ポイント解放: 約束のズレを整えるための行動
  const nobishiroTemplates = [
    { id: 'nb_talk_01', category: 'nobishiro', label: '15分の振り返りタイム', description: 'ふたりで今週どうだったか短く話す', active: true },
    { id: 'nb_house_01', category: 'nobishiro', label: '家事を1つ代わりに担当', description: '相手が通常担当する家事を1回代わる', active: true },
    { id: 'nb_plan_01', category: 'nobishiro', label: '来週の予定をふたりで調整', description: 'カレンダーを30分見ながらすれ違いを防ぐ', active: true },
    { id: 'nb_msg_01', category: 'nobishiro', label: '感謝メッセージを送る', description: '今週良かったことを具体的に1つ伝える', active: true },
    { id: 'nb_task_01', category: 'nobishiro', label: '担当タスクを再分配する', description: '1週間の家事・役割を再調整する', active: true },
  ]

  const all = [...thankYouTemplates, ...nobishiroTemplates]

  for (const template of all) {
    await prisma.repairTemplate.upsert({
      where: { id: template.id },
      update: template,
      create: template,
    })
  }

  // 旧テンプレートを非アクティブ化
  const oldIds = [
    'r_thanks_01', 'r_talk_30', 'r_house_01', 'r_plan_01', 'r_checkin_01',
    'r_support_01', 'r_apology_01', 'r_rest_01', 'r_task_01', 'r_date_01',
  ]
  await prisma.repairTemplate.updateMany({
    where: { id: { in: oldIds } },
    data: { active: false },
  })

  console.log(`Seeded ${all.length} unlock templates (${thankYouTemplates.length} thank_you + ${nobishiroTemplates.length} nobishiro)`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
