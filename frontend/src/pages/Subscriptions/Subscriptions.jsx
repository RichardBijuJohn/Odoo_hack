import { Plus } from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import DataTable from '../../components/DataTable'

const SAMPLE_ROWS = [
  ['SUB-001', 'Alice Johnson',  'Pro Plan',     '2024-01-15', '2025-01-15', 'Active'],
  ['SUB-002', 'Bob Smith',      'Starter',      '2024-01-14', '2025-01-14', 'Active'],
  ['SUB-003', 'Carol Williams', 'Enterprise',   '2024-01-13', '2024-04-13', 'Trial'],
  ['SUB-004', 'David Lee',      'Pro Plan',     '2023-06-01', '2024-06-01', 'Inactive'],
  ['SUB-005', 'Eva Martinez',   'Starter',      '2024-01-11', '2025-01-11', 'Active'],
]

const statusColors = {
  Active:   'bg-green-100 text-green-700',
  Inactive: 'bg-red-100 text-red-600',
  Trial:    'bg-yellow-100 text-yellow-700',
}

export default function Subscriptions() {
  return (
    <div>
      <PageHeader
        title="Subscriptions"
        description="Track and manage all customer subscriptions."
        action={
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition">
            <Plus className="w-4 h-4" /> New Subscription
          </button>
        }
      />
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <DataTable
          columns={['Sub ID', 'Customer', 'Plan', 'Start Date', 'End Date', 'Status']}
          rows={SAMPLE_ROWS.map(([id, customer, plan, start, end, status]) => [
            <span key={id} className="font-mono text-xs text-slate-500">{id}</span>,
            <span key={customer} className="font-semibold">{customer}</span>,
            plan,
            start,
            end,
            <span key={status} className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusColors[status]}`}>{status}</span>,
          ])}
        />
      </div>
    </div>
  )
}
