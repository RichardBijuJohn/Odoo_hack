import { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import DataTable from '../../components/DataTable'
import LoadingSpinner from '../../components/LoadingSpinner'
import ErrorMessage from '../../components/ErrorMessage'
import EmptyState from '../../components/EmptyState'
import { getSubscriptions } from '../../services/subscriptions'

const statusColors = {
  active:   'bg-green-100 text-green-700',
  trial:    'bg-yellow-100 text-yellow-700',
  paused:   'bg-amber-100 text-amber-700',
  canceled: 'bg-red-100 text-red-600',
  expired:  'bg-slate-100 text-slate-600',
  inactive: 'bg-red-100 text-red-600',
}

const getStatusColor = (status) => {
  const key = (status || '').toLowerCase()
  return statusColors[key] || 'bg-slate-100 text-slate-600'
}

const formatStatus = (status) => {
  if (!status) return 'Unknown'
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
}

export default function Subscriptions() {
  const [subscriptions, setSubscriptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let isMounted = true

    const fetchSubscriptions = async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await getSubscriptions()
        if (isMounted) {
          const list = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : [])
          setSubscriptions(list)
        }
      } catch (err) {
        if (isMounted) {
          setError(err?.message || (typeof err === 'string' ? err : 'Failed to load subscriptions.'))
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchSubscriptions()

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <div>
      <PageHeader
        title="Subscriptions"
        description="Track and manage all customer subscriptions."
        action={
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition">
            <Plus className="w-4 h-4" /> New Subscription
          </button>
        }
      />
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        {loading ? (
          <LoadingSpinner text="Loading subscriptions..." />
        ) : error ? (
          <ErrorMessage message={error} />
        ) : subscriptions.length === 0 ? (
          <EmptyState
            title="No subscriptions yet"
            description="There are currently no active or pending subscriptions in the system."
          />
        ) : (
          <DataTable
            columns={['Sub ID', 'Customer', 'Plan', 'Start Date', 'End Date', 'Status']}
            rows={subscriptions.map((s) => [
              <span key={`id-${s.id}`} className="font-mono text-xs text-slate-500">
                {typeof s.id === 'number' ? `SUB-${String(s.id).padStart(3, '0')}` : s.id}
              </span>,
              <span key={`customer-${s.id}`} className="font-semibold">
                {s.customer_name || s.customer || '—'}
              </span>,
              s.plan_name || s.plan || '—',
              s.start_date || '—',
              s.end_date || s.next_billing_date || '—',
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
    </div>
  )
}
