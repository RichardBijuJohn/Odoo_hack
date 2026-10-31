import { Plus } from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import DataTable from '../../components/DataTable'

const SAMPLE_ROWS = [
  ['PAY-001', 'Alice Johnson',  '$99.00',  'Credit Card', '2024-01-15', 'Completed'],
  ['PAY-002', 'Bob Smith',      '$29.00',  'PayPal',      '2024-01-14', 'Completed'],
  ['PAY-003', 'Carol Williams', '$299.00', 'Bank Transfer','2024-01-13', 'Pending'],
  ['PAY-004', 'David Lee',      '$99.00',  'Credit Card', '2024-01-10', 'Failed'],
]

const statusColors = {
  Completed: 'bg-green-100 text-green-700',
  Pending:   'bg-yellow-100 text-yellow-700',
  Failed:    'bg-red-100 text-red-600',
}

export default function Payments() {
  return (
    <div>
      <PageHeader
        title="Payments"
        description="Track all payment transactions and their statuses."
        action={
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition">
            <Plus className="w-4 h-4" /> Record Payment
          </button>
        }
      />
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <DataTable
          columns={['Payment ID', 'Customer', 'Amount', 'Method', 'Date', 'Status']}
          rows={SAMPLE_ROWS.map(([id, customer, amount, method, date, status]) => [
            <span key={id} className="font-mono text-xs text-slate-500">{id}</span>,
            <span key={customer} className="font-semibold">{customer}</span>,
            <span key={amount} className="font-semibold text-slate-700">{amount}</span>,
            method,
            date,
            <span key={status} className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusColors[status]}`}>{status}</span>,
          ])}
        />
      </div>
    </div>
  )
}
