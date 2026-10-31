import { Plus } from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import DataTable from '../../components/DataTable'

const SAMPLE_ROWS = [
  ['STF-001', 'Sarah Jenkins', 'Administrator', 'sarah@brightloop.io', 'Active'],
  ['STF-002', 'Alex Rivera',   'Finance Manager', 'alex@brightloop.io', 'Active'],
  ['STF-003', 'Elena Rostova',  'Support Agent',   'elena@brightloop.io', 'Active'],
  ['STF-004', 'Marcus Chen',   'Billing Ops',     'marcus@brightloop.io', 'Suspended'],
]

export default function Staff() {
  return (
    <div>
      <PageHeader
        title="Staff Management"
        description="Manage internal teammates, roles, and administrative permissions."
        action={
          <button className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg transition">
            <Plus className="w-4 h-4" /> Invite Staff
          </button>
        }
      />
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <DataTable
          columns={['Staff ID', 'Name', 'Role', 'Email', 'Status']}
          rows={SAMPLE_ROWS.map(([id, name, role, email, status]) => [
            <span className="font-mono text-xs text-slate-500">{id}</span>,
            <span className="font-semibold">{name}</span>,
            <span className="text-slate-600">{role}</span>,
            email,
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>{status}</span>,
          ])}
        />
      </div>
    </div>
  )
}
