import { Plus } from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import DataTable from '../../components/DataTable'

const SAMPLE_ROWS = [
  ['PRD-001', 'Basic SaaS License',    'Software', '$29.00',  'Active'],
  ['PRD-002', 'Pro SaaS License',      'Software', '$99.00',  'Active'],
  ['PRD-003', 'Enterprise License',    'Software', '$299.00', 'Active'],
  ['PRD-004', 'Add-on: Analytics',     'Add-on',   '$19.00',  'Active'],
  ['PRD-005', 'Add-on: Storage 100GB', 'Add-on',   '$9.00',   'Inactive'],
]

export default function Products() {
  return (
    <div>
      <PageHeader
        title="Products"
        description="Manage your product catalog and pricing."
        action={
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition">
            <Plus className="w-4 h-4" /> Add Product
          </button>
        }
      />
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <DataTable
          columns={['Product ID', 'Name', 'Category', 'Price', 'Status']}
          rows={SAMPLE_ROWS.map(([id, name, cat, price, status]) => [
            <span key={id} className="font-mono text-xs text-slate-500">{id}</span>,
            <span key={name} className="font-medium">{name}</span>,
            cat,
            <span key={price} className="font-semibold">{price}</span>,
            <span key={status} className={`px-2 py-0.5 rounded-full text-xs font-semibold ${status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>{status}</span>,
          ])}
        />
      </div>
    </div>
  )
}
