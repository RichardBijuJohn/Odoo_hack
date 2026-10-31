import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Zap, Lock, Mail, Building, User, CheckCircle2, XCircle, ArrowRight, AlertCircle } from 'lucide-react'
import { useAuth, validatePassword } from '../../context/AuthContext'

export default function SignUp() {
  const navigate = useNavigate()
  const { register } = useAuth()

  const [formData, setFormData] = useState({
    name: '',
    companyName: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Real-time password criteria
  const passwordCriteria = [
    { label: 'More than 8 characters', valid: formData.password.length > 8 },
    { label: 'One uppercase letter (A-Z)', valid: /[A-Z]/.test(formData.password) },
    { label: 'One lowercase letter (a-z)', valid: /[a-z]/.test(formData.password) },
    { label: 'One special character (!@#$%...)', valid: /[!@#$%^&*(),.?":{}|<>_\-+=~`]/.test(formData.password) }
  ]

  const isPasswordValid = passwordCriteria.every(c => c.valid)

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')

    if (!isPasswordValid) {
      setError('Please satisfy all password complexity requirements.')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    try {
      register({
        name: formData.name,
        companyName: formData.companyName,
        email: formData.email,
        password: formData.password,
        role: 'customer' // small business signing up starts with customer portal
      })
      setSuccess(true)
      setTimeout(() => {
        navigate('/portal')
      }, 1200)
    } catch (err) {
      setError(err.message || 'Failed to create account')
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative gradient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600 text-white mb-4 shadow-lg shadow-blue-500/30">
          <Zap className="w-7 h-7" />
        </div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">Create your business account</h2>
        <p className="mt-2 text-sm text-slate-400">
          Join Brightloop to automate your billing, plans, and subscriptions.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
        <div className="bg-slate-800/90 backdrop-blur-xl border border-slate-700/80 py-8 px-6 shadow-2xl rounded-2xl sm:px-10">
          
          {error && (
            <div className="mb-5 p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3 text-red-400 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-5 p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-3 text-emerald-400 text-sm">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              <span>Account created successfully! Redirecting to your portal...</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Business / Company Name
              </label>
              <div className="relative">
                <Building className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="Acme Studio, LLC"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  className="w-full bg-slate-900/80 border border-slate-700 rounded-lg pl-10 pr-3.5 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="Jane Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-900/80 border border-slate-700 rounded-lg pl-10 pr-3.5 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Work Email (One account per email)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="jane@company.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-slate-900/80 border border-slate-700 rounded-lg pl-10 pr-3.5 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full bg-slate-900/80 border border-slate-700 rounded-lg pl-10 pr-3.5 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Password Requirements Checklist */}
              <div className="mt-2 p-2.5 bg-slate-900/60 rounded-lg border border-slate-700/60 space-y-1.5">
                <p className="text-[11px] font-medium text-slate-400 mb-1">Password Requirements:</p>
                {passwordCriteria.map((crit, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs">
                    {crit.valid ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-slate-500" />
                    )}
                    <span className={crit.valid ? 'text-emerald-300' : 'text-slate-400'}>
                      {crit.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full bg-slate-900/80 border border-slate-700 rounded-lg pl-10 pr-3.5 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={!isPasswordValid}
              className={`w-full mt-2 py-3 px-4 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition shadow-lg ${
                isPasswordValid
                  ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/25 cursor-pointer'
                  : 'bg-slate-700 text-slate-400 cursor-not-allowed opacity-75'
              }`}
            >
              <span>Create Account</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-700/60 text-center">
            <p className="text-sm text-slate-400">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-400 hover:text-blue-300 font-medium">
                Log in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
