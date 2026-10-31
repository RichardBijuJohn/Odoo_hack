import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Package, CreditCard, Users, RefreshCw,
  FileText, Wallet, Tag, BarChart2, UserCog, Zap, ExternalLink, Sparkles, ShieldAlert
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Sidebar() {
  const { currentUser, isAdmin } = useAuth()

  const navItems = [
    { to: '/dashboard',     label: 'Dashboard',          icon: LayoutDashboard },
    { to: '/rescue-ai',     label: 'Rescue AI ⭐',       icon: Sparkles, highlight: true },
    { to: '/financial-stress', label: 'Payment Alerts', icon: ShieldAlert, highlight: true },
    { to: '/products',      label: 'Products',           icon: Package },
    { to: '/plans',         label: 'Subscription Plans', icon: CreditCard },
    { to: '/customers',     label: 'Customers',          icon: Users },
    { to: '/subscriptions', label: 'Subscriptions',      icon: RefreshCw },
    { to: '/invoices',      label: 'Invoices',           icon: FileText },
    { to: '/payments',      label: 'Payments',           icon: Wallet },
    { to: '/discounts',     label: 'Discounts',          icon: Tag },
    { to: '/reports',       label: 'Reports',            icon: BarChart2 },
    { to: '/staff',         label: 'Staff Management',   icon: UserCog },
  ]

  return (
    <aside className="w-64 min-h-screen bg-slate-900 flex flex-col fixed left-0 top-0 z-30">
      {/* Brand Header */}
      <div className="flex items-center gap-2.5 px-6 py-5 border-b border-white/10">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <div>
          <span className="text-white font-bold text-lg tracking-tight block leading-none">Brightloop</span>
          <span className="text-[10px] text-slate-400 font-mono tracking-wider">
            {currentUser?.role === 'admin' ? 'ADMIN CONSOLE' : 'STAFF WORKSPACE'}
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 mb-3">Main Menu</p>
        {navItems.filter(({ to }) => to !== '/discounts' || isAdmin).map(({ to, label, icon: Icon, highlight }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'active' : ''} ${
                highlight ? 'text-amber-400 font-medium' : ''
              }`
            }
          >
            <Icon className={`w-4 h-4 flex-shrink-0 ${highlight ? 'text-amber-400' : ''}`} />
            <span>{label}</span>
          </NavLink>
        ))}

        <div className="pt-4 mt-4 border-t border-white/10">
          <NavLink
            to="/portal"
            className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 transition"
          >
            <span>Customer Portal</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </NavLink>
        </div>
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-white/10">
        <p className="text-xs text-slate-500 text-center">Brightloop SaaS v1.0</p>
      </div>
    </aside>
  )
}
