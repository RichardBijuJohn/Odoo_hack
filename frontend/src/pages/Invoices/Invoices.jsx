import { Plus } from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import DataTable from '../../components/DataTable'

const SAMPLE_ROWS = [
  ['INV-001', 'Alice Johnson',  '$99.00',  '2024-01-15', '2024-02-15', 'Paid'],
  ['INV-002', 'Bob Smith',      '$29.00',  '2024-01-14', '2024-02-14', 'Paid'],
  ['INV-003', 'Carol Williams', '$299.00', '2024-01-13', '2024-02-13', 'Pending'],
  ['INV-004', 'David Lee',      '$99.00',  '2024-01-12', '2024-02-12', 'Overdue'],
  ['INV-005', 'Eva Martinez',   '$29.00',  '2024-01-11', '2024-02-11', 'Paid'],
]

const statusColors = {
  Paid:    'bg-green-100 text-green-700',
  Pending: 'bg-yellow-100 text-yellow-700',
  Overdue: 'bg-red-100 text-red-600',
}

export default function Invoices() {
  return (
    <div>
      <PageHeader
        title="Invoices"
        description="View and manage all billing invoices."
        action={
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition">
            <Plus className="w-4 h-4" /> Create Invoice
          </button>
        }
      />
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <DataTable
          columns={['Invoice ID', 'Customer', 'Amount', 'Issue Date', 'Due Date', 'Status']}
          rows={SAMPLE_ROWS.map(([id, customer, amount, issued, due, status]) => [
            <span key={id} className="font-mono text-xs text-slate-500">{id}</span>,
            <span key={customer} className="font-semibold">{customer}</span>,
            <span key={amount} className="font-semibold text-slate-700">{amount}</span>,
            issued,
            due,
            <span key={status} className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusColors[status]}`}>{status}</span>,
          ])}
        />
      </div>
    </div>
  )
}
