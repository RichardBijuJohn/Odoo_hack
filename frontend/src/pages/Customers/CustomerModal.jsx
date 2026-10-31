import { useState } from 'react'
import { X, Loader2, AlertCircle } from 'lucide-react'
import { createCustomer } from '../../services/customers'

const INITIAL_FORM = {
  name: '',
  email: '',
  phone: '',
  company_name: '',
  address: '',
  status: 'active',
}

export default function CustomerModal({ isOpen, onClose, onSuccess }) {
  const [form, setForm] = useState(INITIAL_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  if (!isOpen) return null

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (error) setError(null)
  }

  const handleClose = () => {
    if (submitting) return
    setForm(INITIAL_FORM)
    setError(null)
    onClose()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    // Client-side validations matching backend rules
    const trimmedName = form.name.trim()
    if (!trimmedName) {
      setError('Customer name is required.')
      return
    }

    const trimmedEmail = form.email.trim()
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
      setError('A valid email address is required.')
      return
    }

    const trimmedPhone = form.phone.trim()
    if (trimmedPhone) {
      const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]{6,16}$/
      if (!phoneRegex.test(trimmedPhone)) {
        setError('Invalid phone number format (must be 7-20 characters with optional country code).')
        return
      }
    }

    const payload = {
      name: trimmedName,
      email: trimmedEmail,
      phone: trimmedPhone || null,
      company_name: form.company_name.trim() || null,
      address: form.address.trim() || null,
      status: form.status || 'active',
    }

    try {
      setSubmitting(true)
      const res = await createCustomer(payload)
      setForm(INITIAL_FORM)
      if (onSuccess) {
        onSuccess(res?.data || res)
      }
      onClose()
    } catch (err) {
      const message =
        err?.message ||
        (typeof err === 'string' ? err : 'Failed to create customer. Please check your input and try again.')
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden transition-all my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-semibold text-slate-800">Add New Customer</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter customer profile details to register them in the system.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={submitting}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition disabled:opacity-50"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
            {error && (
              <div className="flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            <div>
              <label htmlFor="customer-name" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                id="customer-name"
                name="name"
                type="text"
                required
                value={form.name}
                onChange={handleChange}
                placeholder="e.g. Alice Johnson"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="customer-email" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  id="customer-email"
                  name="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={handleChange}
                  placeholder="e.g. alice@example.com"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>

              <div>
                <label htmlFor="customer-phone" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                  Phone
                </label>
                <input
                  id="customer-phone"
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="e.g. +1-555-0101"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="customer-company" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                  Company Name
                </label>
                <input
                  id="customer-company"
                  name="company_name"
                  type="text"
                  value={form.company_name}
                  onChange={handleChange}
                  placeholder="e.g. Acme Corp"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>

              <div>
                <label htmlFor="customer-status" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                  Status
                </label>
                <select
                  id="customer-status"
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                >
                  <option value="active">Active</option>
                  <option value="lead">Lead</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="customer-address" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                Address
              </label>
              <textarea
                id="customer-address"
                name="address"
                rows="2"
                value={form.address}
                onChange={handleChange}
                placeholder="e.g. 123 Innovation Way, Suite 400"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
              />
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50 border-t border-slate-100">
            <button
              type="button"
              onClick={handleClose}
              disabled={submitting}
              className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-lg transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition disabled:opacity-60 shadow-sm"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Customer</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

