'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { messages } from '@/lib/i18n'
import { BottomNav } from '@/components/BottomNav'
import {
  getRepairs,
  getRepairTemplates,
  createRepair,
  completeRepair,
  getCoupleId,
  getUserId,
  getEvents,
  RepairAction,
  RepairTemplate,
} from '@/lib/api'

type TemplateKind = 'thank_you' | 'nobishiro'

export default function UnlockPage() {
  const router = useRouter()
  const [repairs, setRepairs] = useState<RepairAction[]>([])
  const [templates, setTemplates] = useState<RepairTemplate[]>([])
  const [latestApprovedEventId, setLatestApprovedEventId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [showSelect, setShowSelect] = useState<TemplateKind | null>(null)
  const [error, setError] = useState<string | null>(null)

  const coupleId = getCoupleId()
  const userId = getUserId()

  useEffect(() => {
    if (!coupleId) {
      router.push('/')
      return
    }

    Promise.all([
      getRepairs(coupleId, 'open').then((d) => setRepairs(d.items)),
      getRepairTemplates().then((d) => setTemplates(d.items)),
      getEvents(coupleId, 'approved').then((d) => setLatestApprovedEventId(d.items[0]?.id ?? null)),
    ])
      .catch(() => setError(messages.errors.network))
      .finally(() => setLoading(false))
  }, [])

  async function handleSelect(templateId: string) {
    if (!coupleId || !userId || !latestApprovedEventId) {
      setError(messages.unlock.missing_trigger)
      return
    }
    setError(null)
    try {
      const newRepair = await createRepair(coupleId, {
        trigger_event_id: latestApprovedEventId,
        template_id: templateId,
        assignee_user_id: userId,
      })
      setRepairs((prev) => [newRepair, ...prev])
      setShowSelect(null)
    } catch {
      setError(messages.errors.network)
    }
  }

  async function handleComplete(repairId: string) {
    setError(null)
    try {
      const updated = await completeRepair(repairId)
      setRepairs((prev) => prev.map((r) => (r.id === repairId ? updated : r)))
    } catch {
      setError(messages.errors.network)
    }
  }

  if (loading) return <div className="p-6 text-center text-gray-400">{messages.common.loading}</div>

  const openRepairs = repairs.filter((r) => r.status === 'open')
  const thankYouTemplates = templates.filter((t) => t.category === 'thank_you')
  const nobishiroTemplates = templates.filter((t) => t.category === 'nobishiro')

  return (
    <main className="p-6">
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-2xl font-bold">{messages.unlock.page_title}</h1>
        <button onClick={() => router.push('/home')} className="text-gray-500 text-sm">{messages.common.back}</button>
      </div>

      <p className="text-sm text-gray-600 mb-5">{messages.unlock.description}</p>
      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      {/* 実行中の解放 */}
      {openRepairs.length > 0 && (
        <div className="space-y-3 mb-6">
          {openRepairs.map((repair) => {
            const template = templates.find((t) => t.id === repair.template_id)
            const isThankYou = template?.category === 'thank_you'
            return (
              <div key={repair.id} className={`border rounded-2xl p-4 ${isThankYou ? 'border-emerald-200 bg-emerald-50' : 'border-sky-200 bg-sky-50'}`}>
                <span className={`text-[11px] rounded-full px-2 py-0.5 mb-2 inline-block ${isThankYou ? 'bg-emerald-100 text-emerald-700' : 'bg-sky-100 text-sky-700'}`}>
                  {isThankYou ? messages.unlock.thank_you_section : messages.unlock.nobishiro_section}
                </span>
                <h3 className="font-medium text-gray-900">{template?.label ?? repair.template_id}</h3>
                {template?.description && <p className="text-sm text-gray-500 mt-1">{template.description}</p>}
                <button
                  onClick={() => handleComplete(repair.id)}
                  className="mt-3 w-full py-2 rounded-xl bg-emerald-500 text-white text-sm font-semibold"
                >
                  {messages.unlock.complete}
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* サンキュー解放追加 */}
      <UnlockSection
        kind="thank_you"
        label={messages.unlock.add_thank_you}
        emptyMsg={messages.unlock.empty_thank_you}
        showSelect={showSelect === 'thank_you'}
        templateList={thankYouTemplates}
        sectionLabel={messages.unlock.thank_you_section}
        onOpen={() => setShowSelect('thank_you')}
        onClose={() => setShowSelect(null)}
        onSelect={handleSelect}
      />

      <div className="mb-4" />

      {/* のびしろ解放追加 */}
      <UnlockSection
        kind="nobishiro"
        label={messages.unlock.add_nobishiro}
        emptyMsg={messages.unlock.empty_nobishiro}
        showSelect={showSelect === 'nobishiro'}
        templateList={nobishiroTemplates}
        sectionLabel={messages.unlock.nobishiro_section}
        onOpen={() => setShowSelect('nobishiro')}
        onClose={() => setShowSelect(null)}
        onSelect={handleSelect}
      />

      <BottomNav active="repair" />
    </main>
  )
}

function UnlockSection({
  kind, label, emptyMsg, showSelect, templateList, sectionLabel, onOpen, onClose, onSelect,
}: {
  kind: TemplateKind
  label: string
  emptyMsg: string
  showSelect: boolean
  templateList: RepairTemplate[]
  sectionLabel: string
  onOpen: () => void
  onClose: () => void
  onSelect: (id: string) => void
}) {
  const isThankYou = kind === 'thank_you'
  const accentBorder = isThankYou ? 'border-emerald-300' : 'border-sky-300'
  const accentText = isThankYou ? 'text-emerald-600' : 'text-sky-600'
  const accentHover = isThankYou ? 'hover:border-emerald-300 hover:bg-emerald-50' : 'hover:border-sky-300 hover:bg-sky-50'

  return !showSelect ? (
    <button
      onClick={onOpen}
      className={`w-full rounded-2xl border-2 border-dashed py-3 text-sm font-semibold ${accentBorder} ${accentText}`}
    >
      {label}
    </button>
  ) : (
    <div>
      <p className="font-semibold mb-2 text-sm text-gray-700">{sectionLabel}</p>
      {templateList.length === 0 ? (
        <p className="text-sm text-gray-500 mb-3">{emptyMsg}</p>
      ) : (
        <div className="space-y-2 mb-3">
          {templateList.map((t) => (
            <button
              key={t.id}
              onClick={() => onSelect(t.id)}
              className={`w-full text-left rounded-xl border p-4 ${accentHover}`}
            >
              <div className="font-medium text-sm text-gray-900">{t.label}</div>
              <div className="text-xs text-gray-500 mt-1">{t.description}</div>
            </button>
          ))}
        </div>
      )}
      <button onClick={onClose} className="w-full py-2 text-sm text-gray-500">
        {messages.common.cancel}
      </button>
    </div>
  )
}
