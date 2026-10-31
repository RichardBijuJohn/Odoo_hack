import { Plus } from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import DataTable from '../../components/DataTable'

const SAMPLE_ROWS = [
  ['DISC-001', 'SUMMER20',   '20% OFF',    'Percentage', '2024-06-01', '2024-08-31', 'Active'],
  ['DISC-002', 'FLAT10',     '$10 OFF',    'Fixed',      '2024-01-01', '2024-12-31', 'Active'],
  ['DISC-003', 'NEWUSER50',  '50% OFF',    'Percentage', '2024-01-01', '2024-03-31', 'Expired'],
  ['DISC-004', 'ENTERPRISE', '15% OFF',    'Percentage', '2024-01-01', '2025-01-01', 'Active'],
]

const statusColors = {
  Active:  'bg-green-100 text-green-700',
  Expired: 'bg-red-100 text-red-600',
}

export default function Discounts() {
  return (
    <div>
      <PageHeader
        title="Discounts"
        description="Manage promotional codes and discount offers."
        action={
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition">
            <Plus className="w-4 h-4" /> Create Discount
          </button>
        }
      />
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <DataTable
          columns={['ID', 'Code', 'Value', 'Type', 'Start', 'End', 'Status']}
          rows={SAMPLE_ROWS.map(([id, code, value, type, start, end, status]) => [
            <span key={id} className="font-mono text-xs text-slate-500">{id}</span>,
            <span key={code} className="font-bold font-mono bg-slate-100 px-2 py-0.5 rounded text-sm">{code}</span>,
            value,
            type,
            start,
            end,
            <span key={status} className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusColors[status]}`}>{status}</span>,
          ])}
        />
      </div>
    </div>
  )
}
