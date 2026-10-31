import { useState } from 'react'
import { Plus, CreditCard, Calendar, Check, AlertCircle, Clock, ShieldCheck, X } from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import { useCatalog } from '../../context/CatalogContext'
import { useAuth } from '../../context/AuthContext'

export default function Plans() {
  const { plans, products, addPlan } = useCatalog()
  const { isAdmin } = useAuth()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [feedback, setFeedback] = useState('')

  const [formData, setFormData] = useState({
    name: '',
    productId: products[0]?.id || '',
    billingCycle: 'monthly', // daily, weekly, monthly, yearly
    price: '',
    minQuantity: 1,
    startDate: new Date().toISOString().split('T')[0],
    endDate: '2026-12-31',
    autoCloseOnEnd: true,
    canCloseEarly: true,
    canPause: true,
    canRenew: true
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.name || !formData.price) return

    const product = products.find(p => String(p.id) === String(formData.productId))

    addPlan({
      name: formData.name,
      productId: formData.productId,
      productName: product?.name || 'Brightloop Product',
      billingCycle: formData.billingCycle,
      price: parseFloat(formData.price),
      minQuantity: parseInt(formData.minQuantity) || 1,
      startDate: formData.startDate,
      endDate: formData.endDate,
      autoCloseOnEnd: Boolean(formData.autoCloseOnEnd),
      canCloseEarly: Boolean(formData.canCloseEarly),
      canPause: Boolean(formData.canPause),
      canRenew: Boolean(formData.canRenew)
    })

    setFeedback(`Plan "${formData.name}" created successfully!`)
    setTimeout(() => setFeedback(''), 3500)
    setIsModalOpen(false)
    setFormData({
      name: '',
      productId: products[0]?.id || '',
      billingCycle: 'monthly',
      price: '',
      minQuantity: 1,
      startDate: new Date().toISOString().split('T')[0],
      endDate: '2026-12-31',
      autoCloseOnEnd: true,
      canCloseEarly: true,
      canPause: true,
      canRenew: true
    })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Subscription Plans & Policies"
        description="Configure billing frequencies (Daily, Weekly, Monthly, Yearly), minimum orders, validity dates, and lifecycle closing/pausing rules."
        action={
          isAdmin && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition shadow-md shadow-blue-500/20"
            >
              <Plus className="w-4 h-4" /> Create Plan
            </button>
          )
        }
      />

      {feedback && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2.5 text-sm">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="font-mono text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded font-semibold">
                  {plan.code}
                </span>
                <span className="text-xs px-2.5 py-0.5 bg-purple-100 text-purple-800 font-semibold rounded-full capitalize">
                  {plan.billingCycle}
                </span>
              </div>

              <h3 className="text-base font-bold text-slate-800 mb-0.5">{plan.name}</h3>
              <p className="text-xs text-slate-500 mb-3">{plan.productName}</p>

              <div className="text-2xl font-bold text-slate-900 mb-3">
                ${plan.price.toFixed(2)}{' '}
                <span className="text-xs font-normal text-slate-500">/{plan.billingCycle}</span>
              </div>

              {/* Attributes list */}
              <div className="bg-slate-50 rounded-xl p-3 space-y-1.5 text-xs text-slate-600 mb-4">
                <div className="flex justify-between">
                  <span>Minimum Quantity:</span>
                  <strong className="text-slate-800">{plan.minQuantity} units</strong>
                </div>
                <div className="flex justify-between">
                  <span>Start Date:</span>
                  <span className="text-slate-700">{plan.startDate}</span>
                </div>
                <div className="flex justify-between">
                  <span>End Date:</span>
                  <span className="text-slate-700">{plan.endDate || 'Ongoing'}</span>
                </div>
              </div>

              {/* Lifecycle Rules Badge Checklist */}
              <div className="space-y-1 text-xs">
                <p className="font-semibold text-slate-700 uppercase tracking-wider text-[11px] mb-2">
                  Plan Lifecycle Rules:
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  <div
                    className={`flex items-center gap-1.5 px-2 py-1 rounded text-[11px] ${
                      plan.autoCloseOnEnd
                        ? 'bg-emerald-50 text-emerald-700 font-medium'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    <span>Auto-close at end</span>
                  </div>

                  <div
                    className={`flex items-center gap-1.5 px-2 py-1 rounded text-[11px] ${
                      plan.canCloseEarly
                        ? 'bg-emerald-50 text-emerald-700 font-medium'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    <span>Can close early</span>
                  </div>

                  <div
                    className={`flex items-center gap-1.5 px-2 py-1 rounded text-[11px] ${
                      plan.canPause
                        ? 'bg-emerald-50 text-emerald-700 font-medium'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    <span>Can pause</span>
                  </div>

                  <div
                    className={`flex items-center gap-1.5 px-2 py-1 rounded text-[11px] ${
                      plan.canRenew
                        ? 'bg-emerald-50 text-emerald-700 font-medium'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    <span>Can renew</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
              <span>Status: <strong className="text-emerald-600">{plan.status}</strong></span>
              <span>Controlled by Admin</span>
            </div>
          </div>
        ))}
      </div>

      {/* Create Plan Modal (Admin Exclusive) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">Create Subscription Plan</h3>
                  <p className="text-xs text-slate-500">Define price, billing cycle, and lifecycle management</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  Plan Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Standard Monthly Growth"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    Base Product *
                  </label>
                  <select
                    value={formData.productId}
                    onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                  >
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    Billing Cycle *
                  </label>
                  <select
                    value={formData.billingCycle}
                    onChange={(e) => setFormData({ ...formData, billingCycle: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-medium text-slate-800"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    Plan Price ($) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="99.00"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    Minimum Quantity *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.minQuantity}
                    onChange={(e) => setFormData({ ...formData, minQuantity: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    Start Availability Date
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    End Availability Date
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Admin Lifecycle Engine Controls */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/70">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Admin Lifecycle Rules & Automation
                </h4>
                <p className="text-[11px] text-slate-500 mb-3">
                  Specify whether subscriptions under this plan should auto-terminate or allow early closure, pause, and renewal.
                </p>

                <div className="space-y-2.5">
                  <label className="flex items-center gap-3 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.autoCloseOnEnd}
                      onChange={(e) => setFormData({ ...formData, autoCloseOnEnd: e.target.checked })}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span>
                      <strong>Auto-close on end date:</strong> Subscription closes on its own when the date ends.
                    </span>
                  </label>

                  <label className="flex items-center gap-3 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.canCloseEarly}
                      onChange={(e) => setFormData({ ...formData, canCloseEarly: e.target.checked })}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span>
                      <strong>Allow early closure:</strong> Customer/Staff can terminate prior to completion.
                    </span>
                  </label>

                  <label className="flex items-center gap-3 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.canPause}
                      onChange={(e) => setFormData({ ...formData, canPause: e.target.checked })}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span>
                      <strong>Allow pause:</strong> Users can temporarily halt recurring billing.
                    </span>
                  </label>

                  <label className="flex items-center gap-3 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.canRenew}
                      onChange={(e) => setFormData({ ...formData, canRenew: e.target.checked })}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span>
                      <strong>Allow renewal:</strong> Subscriptions can be reactivated / extended upon expiry.
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-500/20"
                >
                  Save Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
