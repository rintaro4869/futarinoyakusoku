'use client'

export function ProgressMeter({
  label,
  value,
  target,
  tone,
}: {
  label: string
  value: number
  target: number
  tone: 'good' | 'repair'
}) {
  const safeTarget = Math.max(1, target)
  const progress = Math.min(100, Math.round((value / safeTarget) * 100))
  const remain = Math.max(0, safeTarget - value)

  const palette = tone === 'good'
    ? {
        wrap: 'bg-emerald-50 border-emerald-100',
        bar: 'from-emerald-500 to-teal-500',
        text: 'text-emerald-700',
      }
    : {
        wrap: 'bg-orange-50 border-orange-100',
        bar: 'from-orange-500 to-amber-500',
        text: 'text-orange-700',
      }

  return (
    <div className={`rounded-2xl border p-4 ${palette.wrap}`}>
      <div className="flex items-end justify-between mb-2">
        <p className={`text-sm font-semibold ${palette.text}`}>{label}</p>
        <p className="text-xs text-gray-500">{value} / {safeTarget}</p>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-white">
        <div className={`h-full rounded-full bg-gradient-to-r ${palette.bar}`} style={{ width: `${progress}%` }} />
      </div>
      <p className="mt-2 text-xs text-gray-600">{remain === 0 ? '解放条件に到達しました' : `解放まであと ${remain}`}</p>
    </div>
  )
}
