import { useState, useEffect, useCallback } from 'react'
import { Plus } from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import DataTable from '../../components/DataTable'
import LoadingSpinner from '../../components/LoadingSpinner'
import ErrorMessage from '../../components/ErrorMessage'
import EmptyState from '../../components/EmptyState'
import SubscriptionModal from './SubscriptionModal'
import { getSubscriptions } from '../../services/subscriptions'

const statusColors = {
  active: 'bg-green-100 text-green-700',
  trial: 'bg-yellow-100 text-yellow-700',
  paused: 'bg-amber-100 text-amber-700',
  canceled: 'bg-red-100 text-red-600',
  expired: 'bg-slate-100 text-slate-600',
}

const getStatusColor = (status) => {
  return statusColors[(status || '').toLowerCase()] || 'bg-slate-100 text-slate-600'
}

const formatStatus = (status) => {
  if (!status) return 'Unknown'
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
}

const getErrorMessage = (error) =>
  error?.message || error?.response?.data?.message || error?.data?.message ||
  (typeof error === 'string' ? error : 'Failed to load subscriptions.')

const formatDate = (value) => {
  if (!value) return '—'
  const date = new Date(`${value.slice(0, 10)}T00:00:00`)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString()
}

export default function Subscriptions() {
  const [subscriptions, setSubscriptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [feedback, setFeedback] = useState('')

  const refreshSubscriptions = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await getSubscriptions()
      if (!response?.success || !Array.isArray(response.data)) {
        throw new Error('The Subscriptions API returned an invalid response.')
      }
      setSubscriptions(response.data)
    } catch (requestError) {
      setError(getErrorMessage(requestError))
      throw requestError
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshSubscriptions().catch(() => {})
  }, [refreshSubscriptions])

  const handleSubscriptionCreated = async (subscription) => {
    setIsModalOpen(false)
    setFeedback(`Subscription for ${subscription.customer_name} on ${subscription.plan_name} was created.`)

    try {
      await refreshSubscriptions()
    } catch {
      setSubscriptions((current) => [
        subscription,
        ...current.filter((item) => item.id !== subscription.id),
      ])
      setError(null)
      setFeedback('Subscription was created, but the list could not be refreshed. The saved subscription is shown below.')
    }
  }

  const openCreateModal = () => {
    setFeedback('')
    setIsModalOpen(true)
  }

  return (
    <div>
      <PageHeader
        title="Subscriptions"
        description="Track and manage all customer subscriptions."
        action={
          <button
            type="button"
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition"
          >
            <Plus className="w-4 h-4" /> New Subscription
          </button>
        }
      />

      {feedback && (
        <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm" role="status">
          {feedback}
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 p-5">
        {loading ? (
          <LoadingSpinner text="Loading subscriptions..." />
        ) : error ? (
          <ErrorMessage message={error} />
        ) : subscriptions.length === 0 ? (
          <EmptyState
            title="No subscriptions yet"
            description="Create a subscription to link an existing customer with an existing plan."
          />
        ) : (
          <DataTable
            columns={['Subscription', 'Customer', 'Plan', 'Billing Cycle', 'Price', 'Start Date', 'Expiry Date', 'Next Billing', 'Status']}
            rows={subscriptions.map((s) => [
              <span key={`id-${s.id}`} className="font-mono text-xs text-slate-500">
                SUB-{String(s.id).padStart(3, '0')}
              </span>,
              <span key={`customer-${s.id}`} className="flex flex-col">
                <strong className="font-semibold">{s.customer_name || '—'}</strong>
                <span className="text-xs text-slate-400">{s.customer_email || ''}</span>
              </span>,
              s.plan_name || '—',
              s.plan_billing_cycle || '—',
              s.plan_price == null ? '—' : `${s.plan_currency || 'USD'} ${Number(s.plan_price).toFixed(2)}`,
              formatDate(s.start_date),
              formatDate(s.end_date),
              formatDate(s.next_billing_date),
              <span
                key={`status-${s.id}`}
                className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(s.status)}`}
              >
                {formatStatus(s.status)}
              </span>,
            ])}
          />
        )}
      </div>

      <SubscriptionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleSubscriptionCreated}
      />
    </div>
  )
}
