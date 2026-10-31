import { Plus } from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import DataTable from '../../components/DataTable'

const SAMPLE_ROWS = [
  ['PLN-001', 'Starter',    'Monthly', '$29/mo',  '5 users',   'Active'],
  ['PLN-002', 'Pro',        'Monthly', '$99/mo',  '25 users',  'Active'],
  ['PLN-003', 'Enterprise', 'Annual',  '$2,988/yr','Unlimited', 'Active'],
  ['PLN-004', 'Basic Trial','Monthly', 'Free',     '2 users',  'Active'],
]

export default function Plans() {
  return (
    <div>
      <PageHeader
        title="Subscription Plans"
        description="Configure pricing plans and billing cycles."
        action={
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition">
            <Plus className="w-4 h-4" /> Create Plan
          </button>
        }
      />
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <DataTable
          columns={['Plan ID', 'Name', 'Cycle', 'Price', 'User Limit', 'Status']}
          rows={SAMPLE_ROWS.map(([id, name, cycle, price, limit, status]) => [
            <span key={id} className="font-mono text-xs text-slate-500">{id}</span>,
            <span key={name} className="font-semibold">{name}</span>,
            cycle,
            <span key={price} className="font-semibold text-blue-600">{price}</span>,
            limit,
            <span key={status} className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">{status}</span>,
          ])}
        />
      </div>
    </div>
  )
}
