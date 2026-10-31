import { useEffect, useState } from 'react'
import { AlertCircle, Loader2, X } from 'lucide-react'
import { getCustomers } from '../../services/customers'
import { getPlans } from '../../services/plans'
import { createSubscription } from '../../services/subscriptions'

const STATUSES = ['trial', 'active', 'paused', 'canceled', 'expired']
const FIELD_CLASS =
  'w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition'

const getErrorMessage = (error, fallback) =>
  error?.message || error?.response?.data?.message || error?.data?.message ||
  (typeof error === 'string' ? error : fallback)

const normalizeDateValue = (value) => {
  if (!value || typeof value !== 'string') return ''

  const isoMatch = /^\d{4}-\d{2}-\d{2}$/.exec(value)
  if (isoMatch) return value

  const localMatch = /^\d{2}-\d{2}-\d{4}$/.exec(value)
  if (!localMatch) return ''

  const [day, month, year] = value.split('-').map(Number)
  if (!day || !month || !year) return ''

  const normalized = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  const date = new Date(`${normalized}T00:00:00`)
  if (Number.isNaN(date.getTime())) return ''
  return normalized
}

const isValidDate = (value) => {
  const normalized = normalizeDateValue(value)
  if (!normalized) return false

  const date = new Date(`${normalized}T00:00:00`)
  return !Number.isNaN(date.getTime())
}

export default function SubscriptionModal({ isOpen, onClose, onSuccess }) {
  const [customers, setCustomers] = useState([])
  const [plans, setPlans] = useState([])
  const [loadingCustomers, setLoadingCustomers] = useState(false)
  const [loadingPlans, setLoadingPlans] = useState(false)
  const [customerError, setCustomerError] = useState('')
  const [planError, setPlanError] = useState('')
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    customer_id: '',
    plan_id: '',
    start_date: '',
    end_date: '',
    next_billing_date: '',
    status: 'active',
  })

  useEffect(() => {
    if (!isOpen) return

    let active = true
    setCustomerError('')
    setPlanError('')
    setLoadingCustomers(true)
    setLoadingPlans(true)

    getCustomers()
      .then((response) => {
        if (!response?.success || !Array.isArray(response.data)) {
          throw new Error('The Customers API returned an invalid response.')
        }
        if (active) setCustomers(response.data)
      })
      .catch((error) => {
        if (active) setCustomerError(getErrorMessage(error, 'Could not load customers.'))
      })
      .finally(() => {
        if (active) setLoadingCustomers(false)
      })

    getPlans()
      .then((response) => {
        if (!response?.success || !Array.isArray(response.data)) {
          throw new Error('The Plans API returned an invalid response.')
        }
        const activePlans = response.data.filter(
          (plan) => String(plan.status || '').toLowerCase() === 'active'
        )
        if (active) setPlans(activePlans)
      })
      .catch((error) => {
        if (active) setPlanError(getErrorMessage(error, 'Could not load plans.'))
      })
      .finally(() => {
        if (active) setLoadingPlans(false)
      })

    return () => {
      active = false
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setFormError('')
  }

  const handleClose = () => {
    if (submitting) return
    setFormError('')
    onClose()
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setFormError('')

    const normalizedStartDate = normalizeDateValue(form.start_date)
    const normalizedEndDate = normalizeDateValue(form.end_date)
    const normalizedNextBillingDate = normalizeDateValue(form.next_billing_date)

    if (!form.customer_id || !customers.some((customer) => String(customer.id) === form.customer_id)) {
      setFormError('Select an existing customer.')
      return
    }
    if (!form.plan_id || !plans.some((plan) => String(plan.id) === form.plan_id)) {
      setFormError('Select an available plan.')
      return
    }
    if (!normalizedStartDate) {
      setFormError('Enter a valid subscription start date.')
      return
    }
    if (form.end_date && !normalizedEndDate) {
      setFormError('Enter a valid expiry date.')
      return
    }
    if (normalizedEndDate && normalizedEndDate < normalizedStartDate) {
      setFormError('Expiry date cannot be before the subscription start date.')
      return
    }
    if (form.next_billing_date && !normalizedNextBillingDate) {
      setFormError('Enter a valid next billing date.')
      return
    }
    if (!STATUSES.includes(form.status)) {
      setFormError('Select a valid subscription status.')
      return
    }

    setSubmitting(true)
    try {
      const response = await createSubscription({
        customer_id: Number(form.customer_id),
        plan_id: Number(form.plan_id),
        start_date: normalizedStartDate,
        end_date: normalizedEndDate || null,
        next_billing_date: normalizedNextBillingDate || null,
        status: form.status,
      })

      if (!response?.success || !response?.data) {
        throw new Error(response?.message || 'The subscription was not created.')
      }

      setForm({
        customer_id: '',
        plan_id: '',
        start_date: '',
        end_date: '',
        next_billing_date: '',
        status: 'active',
      })
      await onSuccess(response.data)
    } catch (error) {
      setFormError(getErrorMessage(error, 'Could not create subscription. Please try again.'))
    } finally {
      setSubmitting(false)
    }
  }

  const optionsLoading = loadingCustomers || loadingPlans

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-xl overflow-hidden my-8"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-semibold text-slate-800">Create Subscription</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Assign an existing plan to a customer and set the subscription dates.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={submitting}
            aria-label="Close modal"
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
            {formError && (
              <div className="flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            {optionsLoading && (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading customers and plans...
              </div>
            )}

            {customerError && (
              <p className="text-sm text-red-700" role="alert">Customers: {customerError}</p>
            )}
            {planError && (
              <p className="text-sm text-red-700" role="alert">Plans: {planError}</p>
            )}

            <div>
              <label htmlFor="subscription-customer" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                Customer <span className="text-red-500">*</span>
              </label>
              <select
                id="subscription-customer"
                name="customer_id"
                required
                value={form.customer_id}
                onChange={handleChange}
                disabled={loadingCustomers || Boolean(customerError)}
                className={FIELD_CLASS}
              >
                <option value="">Select a customer</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}{customer.email ? ` — ${customer.email}` : ''}
                  </option>
                ))}
              </select>
              {!loadingCustomers && !customerError && customers.length === 0 && (
                <p className="mt-1 text-xs text-amber-700">No customers are available. Create a customer first.</p>
              )}
            </div>

            <div>
              <label htmlFor="subscription-plan" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                Plan <span className="text-red-500">*</span>
              </label>
              <select
                id="subscription-plan"
                name="plan_id"
                required
                value={form.plan_id}
                onChange={handleChange}
                disabled={loadingPlans || Boolean(planError)}
                className={FIELD_CLASS}
              >
                <option value="">Select a plan</option>
                {plans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name} — {plan.billing_cycle} — {plan.currency || 'USD'} {Number(plan.price).toFixed(2)}
                  </option>
                ))}
              </select>
              {!loadingPlans && !planError && plans.length === 0 && (
                <p className="mt-1 text-xs text-amber-700">No active plans are available. Create or activate a plan first.</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="subscription-start" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  id="subscription-start"
                  name="start_date"
                  type="date"
                  required
                  value={form.start_date}
                  onChange={handleChange}
                  className={FIELD_CLASS}
                />
              </div>
              <div>
                <label htmlFor="subscription-end" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                  Expiry Date
                </label>
                <input
                  id="subscription-end"
                  name="end_date"
                  type="date"
                  min={form.start_date || undefined}
                  value={form.end_date}
                  onChange={handleChange}
                  className={FIELD_CLASS}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="subscription-next-billing" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                  Next Billing Date
                </label>
                <input
                  id="subscription-next-billing"
                  name="next_billing_date"
                  type="date"
                  value={form.next_billing_date}
                  onChange={handleChange}
                  className={FIELD_CLASS}
                />
              </div>
              <div>
                <label htmlFor="subscription-status" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                  Status <span className="text-red-500">*</span>
                </label>
                <select
                  id="subscription-status"
                  name="status"
                  required
                  value={form.status}
                  onChange={handleChange}
                  className={FIELD_CLASS}
                >
                  {STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100">
            <button
              type="button"
              onClick={handleClose}
              disabled={submitting}
              className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || optionsLoading || customers.length === 0 || plans.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {submitting ? 'Creating...' : 'Create Subscription'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}