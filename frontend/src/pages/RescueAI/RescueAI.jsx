import { useState } from 'react'
import {
  Sparkles,
  AlertTriangle,
  ShieldCheck,
  TrendingDown,
  ArrowRight,
  CheckCircle2,
  DollarSign,
  Clock,
  Send,
  Zap,
  Filter,
  Users,
  Search,
  ExternalLink,
  Percent,
  LifeBuoy
} from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import { useRescue } from '../../context/RescueContext'

export default function RescueAI() {
  const { customers, executedActions, executeRescueAction, stats, totalSubscribersAnalyzed } = useRescue()
  const [selectedCustomer, setSelectedCustomer] = useState(customers[0] || null)
  const [filterRisk, setFilterRisk] = useState('ALL') // ALL, High, Medium, Low
  const [searchQuery, setSearchQuery] = useState('')
  const [toastMessage, setToastMessage] = useState('')

  const filteredCustomers = customers.filter(c => {
    const matchesRisk = filterRisk === 'ALL' || c.riskLevel.toUpperCase() === filterRisk.toUpperCase()
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.primaryReason.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesRisk && matchesSearch
  })

  const handleTakeAction = (customerId, action) => {
    const result = executeRescueAction(customerId, action)
    setToastMessage(`Action Triggered: "${action.actionLabel}" for ${result.customerName}!`)
    setTimeout(() => setToastMessage(''), 4000)
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Subscription Rescue AI ⭐"
        description="Predictive Machine Learning model analyzing 1,000 subscribers to detect cancellation signals before churn happens, with auto-generated intervention playbooks."
        action={
          <div className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold shadow-md shadow-blue-500/20">
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>AI Predictive Engine Active</span>
          </div>
        }
      />

      {/* Floating Success Toast */}
      {toastMessage && (
        <div className="p-4 bg-emerald-600 text-white rounded-xl shadow-xl flex items-center justify-between text-sm animate-in slide-in-from-top duration-200">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-200" />
            <span className="font-medium">{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage('')} className="text-emerald-200 hover:text-white text-xs underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Analytics KPI Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Subscribers Analyzed</span>
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-800">{totalSubscribersAnalyzed.toLocaleString()}</div>
          <p className="text-[11px] text-slate-400 mt-1">Live telemetry & billing patterns</p>
        </div>

        <div className="bg-white rounded-2xl border border-rose-200/80 p-5 shadow-sm bg-gradient-to-br from-white to-rose-50/40">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">High Risk Churners</span>
            <AlertTriangle className="w-5 h-5 text-rose-500" />
          </div>
          <div className="text-2xl font-extrabold text-rose-700">{stats.highRiskCount} Accounts</div>
          <p className="text-[11px] text-rose-500/80 mt-1">Requires immediate intervention</p>
        </div>

        <div className="bg-white rounded-2xl border border-amber-200/80 p-5 shadow-sm bg-gradient-to-br from-white to-amber-50/40">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">Medium Risk Churners</span>
            <Clock className="w-5 h-5 text-amber-500" />
          </div>
          <div className="text-2xl font-extrabold text-amber-700">{stats.mediumRiskCount} Accounts</div>
          <p className="text-[11px] text-amber-600/80 mt-1">Declining usage or support friction</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">At-Risk MRR Protected</span>
            <DollarSign className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-800">${stats.totalAtRiskMRR.toFixed(2)}</div>
          <p className="text-[11px] text-emerald-600 mt-1 font-medium">Targeted for immediate rescue</p>
        </div>
      </div>

      {/* Main Grid: Churn Risk Table + Live Action Recommender Sidepane */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Customer Risk Analysis Table */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between">
          <div>
            {/* Table Filters & Search */}
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter customer or reason..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-1.5 self-end sm:self-auto">
                {['ALL', 'HIGH', 'MEDIUM', 'LOW'].map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setFilterRisk(lvl)}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                      filterRisk === lvl
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Risk Level</th>
                    <th className="px-4 py-3">Primary Reason</th>
                    <th className="px-4 py-3 text-right">Probability</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCustomers.map((cust) => {
                    const isSelected = selectedCustomer?.id === cust.id
                    return (
                      <tr
                        key={cust.id}
                        onClick={() => setSelectedCustomer(cust)}
                        className={`cursor-pointer transition ${
                          isSelected ? 'bg-blue-50/70' : 'hover:bg-slate-50/80'
                        }`}
                      >
                        <td className="px-4 py-3.5">
                          <div className="font-bold text-slate-800">{cust.name}</div>
                          <div className="text-[11px] text-slate-400">{cust.currentPlan}</div>
                        </td>

                        <td className="px-4 py-3.5">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${cust.badgeColor}`}
                          >
                            {cust.riskLevel}
                          </span>
                        </td>

                        <td className="px-4 py-3.5">
                          <span className="font-medium text-slate-700">{cust.primaryReason}</span>
                          <div className="text-[10px] text-slate-400">
                            Renewal in {cust.daysUntilRenewal}d • {cust.failedPayments} failed pay • {cust.daysSinceLastActive}d inactive
                          </div>
                        </td>

                        <td className="px-4 py-3.5 text-right font-mono font-bold text-sm">
                          <span
                            className={
                              cust.probability >= 70
                                ? 'text-rose-600'
                                : cust.probability >= 40
                                ? 'text-amber-600'
                                : 'text-emerald-600'
                            }
                          >
                            {cust.probability}%
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="p-3 bg-slate-50 border-t border-slate-100 text-xs text-slate-400 flex items-center justify-between">
            <span>Showing {filteredCustomers.length} accounts analyzed</span>
            <span className="text-[11px] text-slate-500">Select any row to view AI Action Recommendations ➔</span>
          </div>
        </div>

        {/* Right Column: AI Action Recommendations & Diagnostics */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
          {selectedCustomer ? (
            <div className="space-y-5">
              {/* Profile Card */}
              <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">{selectedCustomer.name}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${selectedCustomer.badgeColor}`}>
                      {selectedCustomer.riskLevel} Risk
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{selectedCustomer.contact} • MRR: ${selectedCustomer.mrr.toFixed(2)}</p>
                </div>

                <div className="text-right">
                  <div className="text-xl font-extrabold text-rose-600 font-mono">
                    {selectedCustomer.probability}%
                  </div>
                  <div className="text-[10px] uppercase font-semibold text-slate-400">Churn Likelihood</div>
                </div>
              </div>

              {/* Contributing ML Factors */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
                  <TrendingDown className="w-4 h-4 text-rose-500" />
                  <span>Detected Risk Signals</span>
                </h4>
                <div className="space-y-1.5">
                  {selectedCustomer.factors?.length > 0 ? (
                    selectedCustomer.factors.map((f, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl text-xs border border-slate-100"
                      >
                        <span className="font-medium text-slate-700">{f.name}</span>
                        <span className="text-[11px] text-slate-500 font-mono">{f.desc}</span>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 bg-emerald-50 rounded-xl text-xs text-emerald-800 border border-emerald-100">
                      Healthy customer engagement with no warning signals detected.
                    </div>
                  )}
                </div>
              </div>

              {/* Recommended Actions (The core differentiator!) */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-blue-700 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    <span>AI Recommended Rescue Actions</span>
                  </h4>
                  <span className="text-[11px] text-slate-400">Contextual Playbook</span>
                </div>

                <div className="space-y-3">
                  {selectedCustomer.recommendedActions?.map((action) => (
                    <div
                      key={action.id}
                      className="p-3.5 bg-gradient-to-r from-blue-50/50 to-slate-50 border border-blue-200/60 rounded-xl hover:border-blue-300 transition"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs text-slate-900">{action.title}</span>
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-semibold text-[10px]">
                          {action.impact}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 mb-3">{action.description}</p>

                      <button
                        onClick={() => handleTakeAction(selectedCustomer.id, action)}
                        className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition shadow-sm"
                      >
                        <Zap className="w-3.5 h-3.5 text-amber-300" />
                        <span>{action.actionLabel}</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-10 text-center text-slate-400">
              <Sparkles className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p>Select a customer from the left to view rescue interventions</p>
            </div>
          )}

          {/* Recent Executed Intervention Log */}
          <div className="mt-6 pt-4 border-t border-slate-100">
            <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
              Recent Rescue Activity ({executedActions.length})
            </h5>
            <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1">
              {executedActions.length === 0 ? (
                <p className="text-[11px] text-slate-400 italic">No rescue actions executed yet this session.</p>
              ) : (
                executedActions.slice(0, 3).map((act) => (
                  <div key={act.id} className="text-[11px] flex items-center justify-between text-slate-600 bg-slate-50 p-1.5 rounded">
                    <span>
                      Triggered <strong>{act.actionLabel}</strong> for {act.customerName}
                    </span>
                    <span className="text-slate-400 font-mono text-[10px]">{act.executedAt}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
