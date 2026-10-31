import { Inbox } from 'lucide-react'

export default function EmptyState({ title = 'No data yet', description = 'Get started by creating your first record.', action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 bg-white rounded-xl border border-dashed border-slate-300">
      <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mb-4">
        <Inbox className="w-7 h-7 text-slate-400" />
      </div>
      <h3 className="text-base font-semibold text-slate-700 mb-1">{title}</h3>
      <p className="text-sm text-slate-400 text-center max-w-xs mb-5">{description}</p>
      {action}
    </div>
  )
}
