import { useMemo, useState } from 'react'
import { Users, RefreshCw, DollarSign, FileText, Sparkles, ArrowRight, ArrowUpRight, CalendarDays, Download, TrendingUp } from 'lucide-react'
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
const revenuePeriods = {
  '1M': revenueData.slice(-2),
  '3M': revenueData.slice(-3),
  '6M': revenueData,
  '1Y': [
    { month: 'Jan', value: 24000 }, { month: 'Mar', value: 26500 }, { month: 'May', value: 27500 },
    { month: 'Jul', value: 30000 }, { month: 'Sep', value: 32000 }, { month: 'Nov', value: 36000 },
  ],
}

function RevenueOverview() {
  const [period, setPeriod] = useState('6M')
  const [hoveredPoint, setHoveredPoint] = useState(null)
  const activeData = revenuePeriods[period]
  const maxRevenue = Math.max(...activeData.map((item) => item.value))
  const chartWidth = 720
  const chartHeight = 220
  const chartPadding = { top: 24, right: 18, bottom: 30, left: 18 }
  const points = useMemo(() => activeData.map((item, index) => ({
    ...item,
    x: chartPadding.left + (index * (chartWidth - chartPadding.left - chartPadding.right)) / (revenueData.length - 1),
    y: chartPadding.top + (1 - item.value / maxRevenue) * (chartHeight - chartPadding.top - chartPadding.bottom),
  })), [activeData, maxRevenue])
  const line = points.map((point) => `${point.x},${point.y}`).join(' ')
  const area = `${points[0].x},${chartHeight - chartPadding.bottom} ${line} ${points.at(-1).x},${chartHeight - chartPadding.bottom}`
  const currentRevenue = activeData.at(-1).value
  const previousRevenue = activeData.at(-2).value
  const growth = ((currentRevenue - previousRevenue) / previousRevenue) * 100

  return (
    <div className="xl:col-span-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 bg-gradient-to-r from-white via-white to-blue-50/60 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                <TrendingUp className="h-4 w-4" />
              </span>
              <div>
                <h2 className="text-base font-bold text-slate-800">Revenue Overview</h2>
                <p className="text-xs text-slate-400">Recurring revenue performance</p>
              </div>
            </div>
            <div className="mt-4 flex items-end gap-3">
              <span className="text-3xl font-extrabold tracking-tight text-slate-900">${currentRevenue.toLocaleString()}</span>
              <span className="mb-1 inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700">
                <ArrowUpRight className="h-3.5 w-3.5" /> {growth.toFixed(1)}%
              </span>
              <span className="mb-1 text-xs text-slate-400">vs last month</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-slate-200 bg-white p-1">
              {['1M', '3M', '6M', '1Y'].map((option) => (
                <button
                  type="button"
                  key={option}
                  onClick={() => setPeriod(option)}
                  className={`rounded-md px-2.5 py-1.5 text-[11px] font-bold transition ${period === option ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100'}`}
                >
                  {option}
                </button>
              ))}
            </div>
            <button type="button" className="hidden rounded-lg border border-slate-200 p-2 text-slate-400 transition hover:bg-slate-50 hover:text-blue-600 sm:block" title="Export revenue report">
              <Download className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="p-5">
        <div className="relative">
          <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-between text-[10px] font-medium text-slate-400">
            <span>$40k</span><span>$30k</span><span>$20k</span><span>$10k</span>
          </div>
          <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="h-56 w-full overflow-visible pt-4" role="img" aria-label="Revenue trend chart">
            <defs>
              <linearGradient id="revenueFill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#2563eb" stopOpacity="0.22" />
                <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="revenueLine" x1="0" x2="1">
                <stop offset="0%" stopColor="#4f46e5" />
                <stop offset="100%" stopColor="#0ea5e9" />
              </linearGradient>
            </defs>
            {[0, 1, 2, 3].map((row) => {
              const y = chartPadding.top + (row * (chartHeight - chartPadding.top - chartPadding.bottom)) / 3
              return <line key={row} x1={chartPadding.left} x2={chartWidth - chartPadding.right} y1={y} y2={y} stroke="#e2e8f0" strokeDasharray="4 5" />
            })}
            <polygon points={area} fill="url(#revenueFill)" />
            <polyline points={line} fill="none" stroke="url(#revenueLine)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" />
            {points.map((point) => (
              <g key={point.month} onMouseEnter={() => setHoveredPoint(point)} onMouseLeave={() => setHoveredPoint(null)} className="cursor-pointer">
                <circle cx={point.x} cy={point.y} r="10" fill="transparent" />
                <circle cx={point.x} cy={point.y} r={hoveredPoint?.month === point.month ? 6 : 4} fill="white" stroke="#2563eb" strokeWidth="3" />
                <text x={point.x} y={chartHeight - 5} textAnchor="middle" className="fill-slate-400 text-[11px]">{point.month}</text>
              </g>
            ))}
          </svg>
          {hoveredPoint && (
            <div className="pointer-events-none absolute -top-1 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white shadow-lg" style={{ left: `${(hoveredPoint.x / chartWidth) * 100}%`, transform: 'translateX(-50%)' }}>
              {hoveredPoint.month}: ${hoveredPoint.value.toLocaleString()}
            </div>
          )}
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 sm:grid-cols-4">
          {[
            { label: 'New subscriptions', value: '+42', color: 'text-blue-600' },
            { label: 'Renewals', value: '186', color: 'text-indigo-600' },
            { label: 'Expansion revenue', value: '$4.8k', color: 'text-emerald-600' },
            { label: 'Net growth', value: '+8.4%', color: 'text-violet-600' },
          ].map((item) => (
            <div key={item.label}>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{item.label}</p>
              <p className={`mt-1 text-sm font-bold ${item.color}`}>{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

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

      <div className="grid grid-cols-1 gap-4 mb-6 xl:grid-cols-3">
        <RevenueOverview />

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
