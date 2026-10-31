import { Plus } from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import DataTable from '../../components/DataTable'

const SAMPLE_ROWS = [
  ['CUS-001', 'Alice Johnson',  'alice@example.com',  '+1-555-0101', 'Pro Plan',     'Active'],
  ['CUS-002', 'Bob Smith',      'bob@example.com',    '+1-555-0102', 'Starter',      'Active'],
  ['CUS-003', 'Carol Williams', 'carol@example.com',  '+1-555-0103', 'Enterprise',   'Trial'],
  ['CUS-004', 'David Lee',      'david@example.com',  '+1-555-0104', 'Pro Plan',     'Inactive'],
  ['CUS-005', 'Eva Martinez',   'eva@example.com',    '+1-555-0105', 'Starter',      'Active'],
]

const statusColors = {
  Active:   'bg-green-100 text-green-700',
  Inactive: 'bg-red-100 text-red-600',
  Trial:    'bg-yellow-100 text-yellow-700',
}

export default function Customers() {
  return (
    <div>
      <PageHeader
        title="Customers"
        description="Manage your customer accounts and their subscriptions."
        action={
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition">
            <Plus className="w-4 h-4" /> Add Customer
          </button>
        }
      />
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <DataTable
          columns={['Customer ID', 'Name', 'Email', 'Phone', 'Plan', 'Status']}
          rows={SAMPLE_ROWS.map(([id, name, email, phone, plan, status]) => [
            <span key={id} className="font-mono text-xs text-slate-500">{id}</span>,
            <span key={name} className="font-semibold">{name}</span>,
            email,
            phone,
            plan,
            <span key={status} className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusColors[status]}`}>{status}</span>,
          ])}
        />
      </div>
    </div>
  )
}
