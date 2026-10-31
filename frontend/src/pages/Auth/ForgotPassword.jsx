import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Zap, Mail, ArrowRight, ArrowLeft, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export default function ForgotPassword() {
  const { requestPasswordReset } = useAuth()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [resetData, setResetData] = useState(null)

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    try {
      const data = requestPasswordReset(email)
      setResetData(data)
    } catch (err) {
      setError(err.message || 'Error sending reset email.')
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600 text-white mb-4 shadow-lg shadow-blue-500/30">
          <Zap className="w-7 h-7" />
        </div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">Reset your password</h2>
        <p className="mt-2 text-sm text-slate-400">
          Enter your registered email and we'll send you an instant reset link
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

          {resetData ? (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-sm">
                <div className="flex items-center gap-2 font-semibold mb-1">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span>Reset link generated!</span>
                </div>
                <p className="text-slate-300 text-xs mt-1">
                  In production, this is emailed directly to <strong className="text-white">{email}</strong>. For quick testing right now:
                </p>
              </div>

              <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-700">
                <p className="text-xs text-slate-400 mb-1 font-mono">Reset Link Preview:</p>
                <Link
                  to={`/reset-password?token=${resetData.token}&email=${encodeURIComponent(email)}`}
                  className="text-xs text-blue-400 hover:underline break-all inline-flex items-center gap-1.5"
                >
                  <span>Click here to complete password reset</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>

              <Link
                to="/login"
                className="w-full mt-3 py-2.5 px-4 rounded-xl font-medium text-sm bg-slate-700 hover:bg-slate-600 text-white flex items-center justify-center gap-2 transition"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Login</span>
              </Link>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Your Registered Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-900/80 border border-slate-700 rounded-lg pl-10 pr-3.5 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full mt-2 py-3 px-4 rounded-xl font-medium text-sm bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center gap-2 transition shadow-lg shadow-blue-500/25"
              >
                <span>Send Reset Link</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-center pt-2">
                <Link to="/login" className="text-xs text-slate-400 hover:text-white flex items-center justify-center gap-1">
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
                </Link>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  )
}
