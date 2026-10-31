import React, { useState } from 'react'
import {
  CreditCard,
  FileText,
  Calendar,
  DollarSign,
  Download,
  AlertCircle,
  Pause,
  Play,
  XCircle,
  RotateCcw,
  CheckCircle,
  Building,
  User,
  LogOut,
  ExternalLink
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useCatalog } from '../../context/CatalogContext'
import { useNavigate } from 'react-router-dom'

export default function CustomerPortal() {
  const { currentUser, logout } = useAuth()
  const {
    subscriptions,
    invoices,
    togglePauseSubscription,
    closeSubscriptionEarly,
    renewSubscription
  } = useCatalog()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState('subscriptions') // subscriptions, invoices
  const [feedbackMsg, setFeedbackMsg] = useState('')

  // Filter subscriptions and invoices strictly for this logged-in customer
  const mySubscriptions = subscriptions.filter(
    (s) =>
      s.customerEmail.toLowerCase() === currentUser?.email?.toLowerCase() ||
      s.customerName.toLowerCase() === currentUser?.name?.toLowerCase()
  )

  const myInvoices = invoices.filter(
    (inv) =>
      inv.customerEmail.toLowerCase() === currentUser?.email?.toLowerCase() ||
      inv.customerName.toLowerCase() === currentUser?.name?.toLowerCase()
  )

  const handleAction = (callback, successMessage) => {
    try {
      callback()
      setFeedbackMsg(successMessage)
      setTimeout(() => setFeedbackMsg(''), 4000)
    } catch (err) {
      alert(err.message)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Customer Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-blue-500/20">
              B
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800 leading-tight">
                {currentUser?.companyName || currentUser?.name || 'Customer'} Portal
              </h1>
              <p className="text-xs text-slate-500">
                Logged in as <span className="font-medium text-slate-700">{currentUser?.email}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-semibold">
              Customer Account
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Banner Alert if any feedback */}
        {feedbackMsg && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>{feedbackMsg}</span>
          </div>
        )}

        {/* Portal Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Active Subscriptions</span>
              <CreditCard className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-slate-800">
              {mySubscriptions.filter(s => s.status === 'active').length}
            </div>
            <p className="text-xs text-slate-400 mt-1">Managed automatically</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Invoices</span>
              <FileText className="w-5 h-5 text-indigo-600" />
            </div>
            <div className="text-2xl font-bold text-slate-800">{myInvoices.length}</div>
            <p className="text-xs text-slate-400 mt-1">Available for download</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Paid</span>
              <DollarSign className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold text-slate-800">
              ${myInvoices.filter(i => i.status === 'paid').reduce((acc, curr) => acc + curr.total, 0).toFixed(2)}
            </div>
            <p className="text-xs text-slate-400 mt-1">Billed accurately</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 mb-6 gap-6">
          <button
            onClick={() => setActiveTab('subscriptions')}
            className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition ${
              activeTab === 'subscriptions'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>My Subscriptions ({mySubscriptions.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('invoices')}
            className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition ${
              activeTab === 'invoices'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Invoices & Billing ({myInvoices.length})</span>
          </button>
        </div>

        {/* Subscriptions Tab */}
        {activeTab === 'subscriptions' && (
          <div className="space-y-4">
            {mySubscriptions.length === 0 ? (
              <div className="bg-white p-10 rounded-2xl border border-slate-200 text-center">
                <CreditCard className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-semibold text-slate-700">No active subscriptions found</h3>
                <p className="text-sm text-slate-400 mt-1">Contact your Brightloop account admin to assign plans.</p>
              </div>
            ) : (
              mySubscriptions.map((sub) => (
                <div
                  key={sub.id}
                  className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm hover:shadow-md transition"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                    <div>
                      <div className="flex items-center gap-2.5">
                        <h3 className="text-base font-bold text-slate-800">{sub.productName}</h3>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                            sub.status === 'active'
                              ? 'bg-emerald-100 text-emerald-800'
                              : sub.status === 'paused'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {sub.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Plan: <span className="font-medium text-slate-700">{sub.planName}</span> • Quantity: {sub.quantity}
                      </p>
                    </div>

                    <div className="text-right sm:text-right">
                      <div className="text-xl font-bold text-slate-900">
                        ${sub.price.toFixed(2)}{' '}
                        <span className="text-xs font-normal text-slate-500">/{sub.billingCycle}</span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Valid until: {sub.endDate || 'Unlimited'}
                      </p>
                    </div>
                  </div>

                  {/* Lifecycle Controls / Permissions set by Admin */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3.5">
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span>
                        Auto-close on end:{' '}
                        <strong className="text-slate-700">{sub.autoCloseOnEnd ? 'Yes' : 'No'}</strong>
                      </span>
                      <span>
                        Can early close:{' '}
                        <strong className="text-slate-700">{sub.canCloseEarly ? 'Yes' : 'No'}</strong>
                      </span>
                      <span>
                        Can pause:{' '}
                        <strong className="text-slate-700">{sub.canPause ? 'Yes' : 'No'}</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Pause / Resume action */}
                      {sub.canPause && sub.status !== 'closed' && (
                        <button
                          onClick={() =>
                            handleAction(
                              () => togglePauseSubscription(sub.id),
                              sub.status === 'paused' ? 'Subscription resumed.' : 'Subscription paused.'
                            )
                          }
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
                        >
                          {sub.status === 'paused' ? (
                            <>
                              <Play className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Resume</span>
                            </>
                          ) : (
                            <>
                              <Pause className="w-3.5 h-3.5 text-amber-600" />
                              <span>Pause</span>
                            </>
                          )}
                        </button>
                      )}

                      {/* Close Early action */}
                      {sub.canCloseEarly && sub.status !== 'closed' && (
                        <button
                          onClick={() => {
                            if (window.confirm('Are you sure you want to close this subscription early?')) {
                              handleAction(
                                () => closeSubscriptionEarly(sub.id),
                                'Subscription closed early.'
                              )
                            }
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 text-xs font-medium text-red-600 hover:bg-red-50 transition"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Close Early</span>
                        </button>
                      )}

                      {/* Renew action */}
                      {sub.canRenew && sub.status === 'closed' && (
                        <button
                          onClick={() =>
                            handleAction(
                              () => renewSubscription(sub.id),
                              'Subscription renewed successfully.'
                            )
                          }
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Renew</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Invoices Tab */}
        {activeTab === 'invoices' && (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3.5">Invoice #</th>
                    <th className="px-5 py-3.5">Description</th>
                    <th className="px-5 py-3.5">Date</th>
                    <th className="px-5 py-3.5">Due Date</th>
                    <th className="px-5 py-3.5">Amount</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {myInvoices.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-8 text-slate-400">
                        No billing history or invoices found.
                      </td>
                    </tr>
                  ) : (
                    myInvoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50/70 transition">
                        <td className="px-5 py-4 font-mono font-medium text-slate-900">{inv.id}</td>
                        <td className="px-5 py-4 font-medium text-slate-800">{inv.description}</td>
                        <td className="px-5 py-4 text-slate-500 text-xs">{inv.issueDate}</td>
                        <td className="px-5 py-4 text-slate-500 text-xs">{inv.dueDate}</td>
                        <td className="px-5 py-4 font-bold text-slate-900">${inv.total.toFixed(2)}</td>
                        <td className="px-5 py-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${
                              inv.status === 'paid'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {inv.status}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            onClick={() => alert(`Downloading Invoice ${inv.id} PDF...`)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>PDF</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
