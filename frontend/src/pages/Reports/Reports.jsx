import { Download, BarChart2 } from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import EmptyState from '../../components/EmptyState'

const reportCards = [
  { title: 'Revenue Report',       desc: 'Monthly and annual revenue breakdown.', color: 'bg-blue-50 border-blue-200 text-blue-700' },
  { title: 'Subscription Report',  desc: 'Active, trial, and churned subscriptions.', color: 'bg-green-50 border-green-200 text-green-700' },
  { title: 'Customer Growth',      desc: 'New vs returning customers over time.', color: 'bg-purple-50 border-purple-200 text-purple-700' },
  { title: 'Invoice & Payment',    desc: 'Outstanding invoices and payment trends.', color: 'bg-orange-50 border-orange-200 text-orange-700' },
]

export default function Reports() {
  return (
    <div>
      <PageHeader
        title="Reports"
        description="Generate and export business intelligence reports."
        action={
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition">
            <Download className="w-4 h-4" /> Export All
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {reportCards.map(({ title, desc, color }) => (
          <div key={title} className={`rounded-xl border p-5 ${color} cursor-pointer hover:shadow-md transition-shadow`}>
            <div className="flex items-start gap-3">
              <BarChart2 className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-sm">{title}</h3>
                <p className="text-xs opacity-80 mt-1">{desc}</p>
              </div>
            </div>
            <button className="mt-4 text-xs font-medium underline opacity-70 hover:opacity-100">
              Generate →
            </button>
          </div>
        ))}
      </div>

      <EmptyState
        title="No custom reports generated yet"
        description="Click a report card above to generate a report export."
      />
    </div>
  )
}
