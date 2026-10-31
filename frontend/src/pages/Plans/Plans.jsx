import { useState, useEffect, useCallback } from 'react'
import { Plus, CreditCard, Check, AlertCircle, X, Loader2 } from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import API from '../../services/api'
import { createPlan, getPlans } from '../../services/plans'
import { useAuth } from '../../context/AuthContext'

const INITIAL_FORM = {
  name: '',
  productId: '',
  billingCycle: 'monthly',
  price: '',
  currency: 'USD',
  trialDays: 0,
  userLimit: 1,
  status: 'active',
}

const errorMessage = (error, fallback) =>
  error?.message || error?.response?.data?.message || error?.data?.message ||
  (typeof error === 'string' ? error : fallback)

export default function Plans() {
  const { isAdmin } = useAuth()

  const [plans, setPlans] = useState([])
  const [products, setProducts] = useState([])
  const [loadingPlans, setLoadingPlans] = useState(true)
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [plansError, setPlansError] = useState('')
  const [productsError, setProductsError] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState(INITIAL_FORM)

  const refreshPlans = useCallback(async () => {
    setLoadingPlans(true)
    setPlansError('')
    try {
      const response = await getPlans()
      if (!response?.success || !Array.isArray(response.data)) {
        throw new Error('The Plans API returned an invalid response.')
      }
      setPlans(response.data)
      return response.data
    } catch (error) {
      setPlansError(errorMessage(error, 'Failed to load plans.'))
      throw error
    } finally {
      setLoadingPlans(false)
    }
  }, [])

  useEffect(() => {
    refreshPlans().catch(() => {})

    API.get('/products', { params: { limit: 100, status: 'active' } })
      .then((response) => {
        if (!Array.isArray(response?.data)) {
          throw new Error('The Products API returned an invalid response.')
        }
        setProducts(response.data)
      })
      .catch((error) => {
        setProductsError(errorMessage(error, 'Failed to load products.'))
      })
      .finally(() => setLoadingProducts(false))
  }, [refreshPlans])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')
    setFeedback('')

    const name = formData.name.trim()
    if (!name) {
      setFormError('Plan name is required.')
      return
    }
    if (formData.price === '' || !Number.isFinite(Number(formData.price))) {
      setFormError('Enter a valid plan price.')
      return
    }

    const payload = {
      product_id: formData.productId || null,
      name,
      billing_cycle: formData.billingCycle,
      price: Number(formData.price),
      currency: formData.currency.trim(),
      trial_days: Number(formData.trialDays),
      user_limit: Number(formData.userLimit),
      status: formData.status,
    }

    setSubmitting(true)
    try {
      const response = await createPlan(payload)
      const createdPlan = response?.data
      if (!response?.success || !createdPlan?.id) {
        throw new Error(response?.message || 'The Plans API did not return the saved plan.')
      }

      setIsModalOpen(false)
      setFormData(INITIAL_FORM)
      try {
        await refreshPlans()
        setFeedback(`Plan "${createdPlan.name}" was created successfully.`)
      } catch {
        setPlans((currentPlans) => [
          createdPlan,
          ...currentPlans.filter((plan) => plan.id !== createdPlan.id),
        ])
        setFeedback(`Plan "${createdPlan.name}" was saved, but the list could not be refreshed.`)
      }
    } catch (error) {
      setFormError(errorMessage(error, 'Failed to create plan. Please try again.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Subscription Plans & Policies"
        description="Configure subscription plan pricing, billing cycles, and limits."
        action={
          isAdmin && (
            <button
              onClick={() => {
                setFormError('')
                setFeedback('')
                setIsModalOpen(true)
              }}
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

      {plansError && (
        <div className="flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{plansError}</span>
          <button
            type="button"
            onClick={() => refreshPlans().catch(() => {})}
            className="ml-auto font-semibold underline"
          >
            Retry
          </button>
        </div>
      )}

      {loadingPlans ? (
        <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-500">
          <Loader2 className="w-5 h-5 animate-spin" /> Loading plans...
        </div>
      ) : plansError ? null : plans.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
          <CreditCard className="w-8 h-8 mx-auto text-slate-300 mb-3" />
          <h3 className="font-semibold text-slate-700">No plans yet</h3>
          <p className="text-sm text-slate-500 mt-1">Create a plan to make it available for subscriptions.</p>
        </div>
      ) : (
      /* Plans Grid */
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="font-mono text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded font-semibold">
                  PLN-{String(plan.id).padStart(3, '0')}
                </span>
                <span className="text-xs px-2.5 py-0.5 bg-purple-100 text-purple-800 font-semibold rounded-full capitalize">
                  {plan.billing_cycle}
                </span>
              </div>

              <h3 className="text-base font-bold text-slate-800 mb-0.5">{plan.name}</h3>
              <p className="text-xs text-slate-500 mb-3">{plan.product_name || 'No linked product'}</p>

              <div className="text-2xl font-bold text-slate-900 mb-3">
                {plan.currency || 'USD'} {Number(plan.price).toFixed(2)}{' '}
                <span className="text-xs font-normal text-slate-500">/{plan.billing_cycle}</span>
              </div>

              {/* Attributes persisted by the current plans schema */}
              <div className="bg-slate-50 rounded-xl p-3 space-y-1.5 text-xs text-slate-600 mb-4">
                <div className="flex justify-between">
                  <span>User limit:</span>
                  <strong className="text-slate-800">{plan.user_limit}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Trial days:</span>
                  <span className="text-slate-700">{plan.trial_days}</span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
              <span>Status: <strong className={plan.status === 'active' ? 'text-emerald-600' : 'text-slate-600'}>{plan.status}</strong></span>
              <span>Plan ID: {plan.id}</span>
            </div>
          </div>
        ))}
      </div>
      )}

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
                  <p className="text-xs text-slate-500">Set the plan details stored in the database.</p>
                </div>
              </div>
              <button
                type="button"
                disabled={submitting}
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
              {formError && (
                <div className="flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  Plan Name *
                </label>
                <input
                  type="text"
                  required
                  maxLength="100"
                  placeholder="e.g. Standard Monthly Growth"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    Base Product
                  </label>
                  <select
                    value={formData.productId}
                    onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                  >
                    <option value="">
                      {loadingProducts ? 'Loading products...' : 'No linked product'}
                    </option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>{product.name}</option>
                    ))}
                  </select>
                  {productsError && (
                    <p className="mt-1 text-xs text-amber-700">{productsError} Plans can still be created without a product.</p>
                  )}
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
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    Plan Price *
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="99999999.99"
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
                    Currency *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength="10"
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value.toUpperCase() })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    Trial Days
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="2147483647"
                    required
                    value={formData.trialDays}
                    onChange={(e) => setFormData({ ...formData, trialDays: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    User Limit
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="2147483647"
                    required
                    value={formData.userLimit}
                    onChange={(e) => setFormData({ ...formData, userLimit: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  Status *
                </label>
                <select
                  required
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                >
                  <option value="active">Active</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <p className="text-xs text-slate-500">
                Product association is optional. Only fields supported by the existing plans table are saved.
              </p>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => {
                    setFormError('')
                    setIsModalOpen(false)
                  }}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-500/20 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Saving...' : 'Save Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
