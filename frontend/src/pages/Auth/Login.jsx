import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Zap, Lock, Mail, ArrowRight, AlertCircle, ShieldCheck, UserCheck, Briefcase } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export default function Login() {
  const navigate = useNavigate()
  const { login, switchUser, users } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleLogin = (e) => {
    e.preventDefault()
    setError('')
    try {
      const user = login(email, password)
      if (user.role === 'customer') {
        navigate('/portal')
      } else {
        navigate('/dashboard')
      }
    } catch (err) {
      setError(err.message || 'Invalid email or password.')
    }
  }

  const handleQuickLogin = (role) => {
    switchUser(role)
    if (role === 'customer') {
      navigate('/portal')
    } else {
      navigate('/dashboard')
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600 text-white mb-4 shadow-lg shadow-blue-500/30">
          <Zap className="w-7 h-7" />
        </div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">Welcome back</h2>
        <p className="mt-2 text-sm text-slate-400">
          Sign in to your Brightloop workspace or customer portal
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

          <form className="space-y-4" onSubmit={handleLogin}>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Email Address
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

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Password
                </label>
                <Link to="/forgot-password" className="text-xs text-blue-400 hover:text-blue-300">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-900/80 border border-slate-700 rounded-lg pl-10 pr-3.5 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-2 py-3 px-4 rounded-xl font-medium text-sm bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center gap-2 transition shadow-lg shadow-blue-500/25"
            >
              <span>Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Role Selector */}
          <div className="mt-6 pt-5 border-t border-slate-700/60">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider text-center mb-3">
              ⚡ Demo 1-Click Role Switcher
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin')}
                className="p-2.5 bg-slate-700/50 hover:bg-slate-700 border border-slate-600/60 rounded-xl flex flex-col items-center gap-1 transition text-slate-200"
              >
                <ShieldCheck className="w-4 h-4 text-purple-400" />
                <span className="text-[11px] font-semibold">Admin</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('staff')}
                className="p-2.5 bg-slate-700/50 hover:bg-slate-700 border border-slate-600/60 rounded-xl flex flex-col items-center gap-1 transition text-slate-200"
              >
                <Briefcase className="w-4 h-4 text-amber-400" />
                <span className="text-[11px] font-semibold">Staff</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('customer')}
                className="p-2.5 bg-slate-700/50 hover:bg-slate-700 border border-slate-600/60 rounded-xl flex flex-col items-center gap-1 transition text-slate-200"
              >
                <UserCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-[11px] font-semibold">Customer</span>
              </button>
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-slate-700/60 text-center">
            <p className="text-sm text-slate-400">
              Don't have an account yet?{' '}
              <Link to="/signup" className="text-blue-400 hover:text-blue-300 font-medium">
                Create one now
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
