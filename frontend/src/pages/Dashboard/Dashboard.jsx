import { Users, RefreshCw, DollarSign, FileText, Sparkles, AlertTriangle, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import StatCard from '../../components/StatCard'
import PageHeader from '../../components/PageHeader'
import DataTable from '../../components/DataTable'
import { useRescue } from '../../context/RescueContext'

const stats = [
  {
    title: 'Total Customers',
    value: '1,000',
    subtitle: 'Analyzed by Rescue AI',
    change: 12.5,
    icon: Users,
    iconColor: 'bg-blue-100',
    iconFg: 'text-blue-600',
  },
  {
    title: 'Active Subscriptions',
    value: '947',
    subtitle: 'Currently active',
    change: 8.2,
    icon: RefreshCw,
    iconColor: 'bg-green-100',
    iconFg: 'text-green-600',
  },
  {
    title: 'Monthly Recurring Revenue',
    value: '$38,420',
    subtitle: 'MRR this month',
    change: 5.1,
    icon: DollarSign,
    iconColor: 'bg-purple-100',
    iconFg: 'text-purple-600',
  },
  {
    title: 'Outstanding Invoices',
    value: '23',
    subtitle: 'Pending payment',
    change: -3.4,
    icon: FileText,
    iconColor: 'bg-orange-100',
    iconFg: 'text-orange-600',
  },
]

const recentSubscriptions = [
  ['#SUB-001', 'Alice Johnson',   'Pro Plan',     '$99/mo',  'Active',   '2024-01-15'],
  ['#SUB-002', 'Bob Smith',       'Starter Plan', '$29/mo',  'Active',   '2024-01-14'],
  ['#SUB-003', 'Carol Williams',  'Enterprise',   '$299/mo', 'Trial',    '2024-01-13'],
  ['#SUB-004', 'David Lee',       'Pro Plan',     '$99/mo',  'Inactive', '2024-01-12'],
  ['#SUB-005', 'Eva Martinez',    'Starter Plan', '$29/mo',  'Active',   '2024-01-11'],
]

const statusColors = {
  Active:   'bg-green-100 text-green-700',
  Inactive: 'bg-red-100 text-red-600',
  Trial:    'bg-yellow-100 text-yellow-700',
}

const revenueData = [
  { month: 'Aug', value: 28000 },
  { month: 'Sep', value: 32000 },
  { month: 'Oct', value: 29000 },
  { month: 'Nov', value: 35000 },
  { month: 'Dec', value: 38420 },
]
const maxRevenue = Math.max(...revenueData.map(d => d.value))

export default function Dashboard() {
  const { stats: rescueStats, customers: rescueCustomers } = useRescue()

  const tableRows = recentSubscriptions.map(([id, customer, plan, amount, status, date]) => [
    <span key={id} className="font-mono text-xs text-slate-500">{id}</span>,
    <span key={customer} className="font-medium">{customer}</span>,
    plan,
    <span key={amount} className="font-semibold text-slate-700">{amount}</span>,
    <span key={status} className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${statusColors[status]}`}>{status}</span>,
    date,
  ])

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Welcome back! Here is what is happening with your subscription business today."
      />

      {/* Subscription Rescue AI Top Recommendation Banner */}
      <div className="mb-6 p-5 bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-900 rounded-2xl text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-blue-500/20">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-amber-400 text-slate-900 font-extrabold rounded-full text-xs uppercase tracking-wide flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 fill-current" /> Top Recommendation ⭐
            </span>
            <span className="text-xs font-mono text-blue-300">Predictive ML Churn Prevention</span>
          </div>
          <h2 className="text-xl font-bold mt-2">Subscription Rescue AI</h2>
          <p className="text-xs text-slate-300 max-w-2xl mt-1">
            Analyzing 1,000 subscribers for early churn signals (usage drops, failed payments, downgrades, support friction, upcoming renewals) and delivering actionable intervention playbooks before cancellation occurs.
          </p>
        </div>

        <div className="flex items-center gap-4 self-end md:self-center">
          <div className="text-right hidden sm:block">
            <div className="text-sm font-bold text-rose-400">{rescueStats.highRiskCount} High Risk Accounts</div>
            <div className="text-[11px] text-slate-400">${rescueStats.totalAtRiskMRR.toFixed(0)} MRR at risk</div>
          </div>
          <Link
            to="/rescue-ai"
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-blue-500/30 flex items-center gap-1.5 whitespace-nowrap"
          >
            <span>Launch Rescue AI</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {stats.map((s) => (
          <StatCard key={s.title} {...s} />
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-6">
        <div className="xl:col-span-2 bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="text-base font-semibold text-slate-700 mb-4">Revenue Overview</h2>
          <div className="flex items-end gap-4 h-36">
            {revenueData.map(({ month, value }) => (
              <div key={month} className="flex flex-col items-center flex-1 gap-1">
                <span className="text-xs text-slate-500 font-medium">
                  ${(value / 1000).toFixed(0)}k
                </span>
                <div
                  className="w-full bg-blue-600 rounded-t-lg hover:bg-blue-700 transition-colors cursor-pointer"
                  style={{ height: `${(value / maxRevenue) * 100}%` }}
                />
                <span className="text-xs text-slate-400">{month}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="text-base font-semibold text-slate-700 mb-4">Quick Stats</h2>
          <div className="space-y-3">
            {[
              { label: 'Plan Conversion Rate', value: '73.8%' },
              { label: 'Avg. Revenue per User', value: '$40.59' },
              { label: 'Churn Rate (MTD)',       value: '2.1%' },
              { label: 'Trial to Paid',          value: '61.2%' },
              { label: 'Support Tickets Open',   value: '7' },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
                <span className="text-sm text-slate-500">{label}</span>
                <span className="text-sm font-semibold text-slate-700">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-base font-semibold text-slate-700">Recent Subscriptions</h2>
          <button className="text-sm text-blue-600 font-medium hover:underline">View all</button>
        </div>
        <DataTable
          columns={['ID', 'Customer', 'Plan', 'Amount', 'Status', 'Date']}
          rows={tableRows}
          emptyMsg="No subscriptions found."
        />
      </div>
    </div>
  )
}
