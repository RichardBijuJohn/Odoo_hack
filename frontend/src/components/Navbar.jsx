import { Bell, Search, ChevronDown, LogOut, ShieldCheck, Briefcase, Moon, Sun, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useTheme } from '../context/ThemeContext'

export default function Navbar() {
  const { currentUser, logout, switchUser } = useAuth()
  const navigate = useNavigate()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [notifications, setNotifications] = useState([
    { id: 1, type: 'warning', title: 'Payment attention needed', message: '3 customers have outstanding invoices.', time: '12 min ago', unread: true },
    { id: 2, type: 'success', title: 'Monthly revenue is up', message: 'Revenue increased 5.1% compared with last month.', time: '1 hour ago', unread: true },
    { id: 3, type: 'info', title: 'New trial subscription', message: 'Carol Williams started an Enterprise trial.', time: '3 hours ago', unread: true },
  ])
  const { isDark, toggleTheme } = useTheme()
  const unreadCount = notifications.filter((notification) => notification.unread).length

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleSwitch = (role) => {
    switchUser(role)
    setDropdownOpen(false)
    if (role === 'customer') {
      navigate('/portal')
    } else {
      navigate('/dashboard')
    }
  }

  const markAllRead = () => setNotifications((current) => current.map((notification) => ({ ...notification, unread: false })))
  const markRead = (id) => setNotifications((current) => current.map((notification) => notification.id === id ? { ...notification, unread: false } : notification))
  const notificationIcon = (type) => type === 'warning'
    ? <AlertTriangle className="h-4 w-4 text-amber-500" />
    : type === 'success'
      ? <CheckCircle2 className="h-4 w-4 text-emerald-500" />
      : <Info className="h-4 w-4 text-blue-500" />

  return (
    <header className="fixed top-0 left-64 right-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6 dark:border-slate-700 dark:bg-slate-900">
      {/* Search Input */}
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search subscriptions, customers, plans..."
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-sm text-slate-700 transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          />
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3 relative">
        {/* Role Pill Badge */}
        <div className="hidden items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 md:flex">
          {currentUser?.role === 'admin' ? (
            <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
          ) : (
            <Briefcase className="w-3.5 h-3.5 text-blue-600" />
          )}
          <span className="capitalize">{currentUser?.role || 'User'}</span>
        </div>

        <button type="button" onClick={toggleTheme} title={isDark ? 'Switch to light theme' : 'Switch to dark theme'} className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">
          {isDark ? <Sun className="h-5 w-5 text-amber-400" /> : <Moon className="h-5 w-5" />}
        </button>
        <button type="button" onClick={() => { setNotificationsOpen((current) => !current); setDropdownOpen(false) }} aria-label="Notifications" className="relative rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">{unreadCount}</span>}
        </button>

        {notificationsOpen && (
          <div className="absolute right-16 top-12 z-50 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-700">
              <div><h3 className="text-sm font-bold text-slate-800 dark:text-white">Notifications</h3><p className="text-[11px] text-slate-400">{unreadCount ? `${unreadCount} unread alert${unreadCount === 1 ? '' : 's'}` : 'All caught up'}</p></div>
              <div className="flex items-center gap-1">{unreadCount > 0 && <button type="button" onClick={markAllRead} className="px-2 py-1 text-[11px] font-semibold text-blue-600 hover:underline">Mark all read</button>}<button type="button" onClick={() => setNotificationsOpen(false)} aria-label="Close notifications" className="rounded p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"><X className="h-4 w-4" /></button></div>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? <div className="px-4 py-8 text-center text-xs text-slate-400">No notifications to display.</div> : notifications.map((notification) => (
                <button type="button" key={notification.id} onClick={() => markRead(notification.id)} className={`flex w-full gap-3 border-b border-slate-100 px-4 py-3 text-left transition hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-700/60 ${notification.unread ? 'bg-blue-50/50 dark:bg-blue-950/30' : ''}`}>
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700">{notificationIcon(notification.type)}</span>
                  <span className="min-w-0 flex-1"><span className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-100">{notification.title}{notification.unread && <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />}</span><span className="mt-1 block text-[11px] leading-relaxed text-slate-500 dark:text-slate-300">{notification.message}</span><span className="mt-1 block text-[10px] text-slate-400">{notification.time}</span></span>
                </button>
              ))}
            </div>
            {notifications.length > 0 && <button type="button" onClick={() => setNotifications([])} className="w-full px-4 py-2.5 text-xs font-semibold text-slate-500 hover:bg-slate-50 hover:text-red-600 dark:text-slate-300 dark:hover:bg-slate-700">Clear notifications</button>}
          </div>
        )}

        {/* Profile Avatar */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 rounded-lg border-l border-slate-200 px-2 py-1.5 pl-3 text-left transition hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-xs">
              {currentUser?.name?.charAt(0) || 'U'}
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium leading-tight text-slate-700 dark:text-slate-200">
                {currentUser?.name || 'User'}
              </p>
              <p className="text-xs text-slate-400 leading-tight">{currentUser?.email}</p>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 z-50 mt-2 w-56 rounded-xl border border-slate-200 bg-white py-2 shadow-xl animate-in fade-in duration-100 dark:border-slate-700 dark:bg-slate-800">
              <div className="border-b border-slate-100 px-4 py-2 dark:border-slate-700">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Quick Switch Role</p>
                <div className="mt-2 flex flex-col gap-1">
                  <button
                    onClick={() => handleSwitch('admin')}
                    className={`text-left text-xs px-2.5 py-1.5 rounded-lg flex items-center justify-between ${
                      currentUser?.role === 'admin' ? 'bg-purple-50 text-purple-700 font-semibold' : 'hover:bg-slate-50'
                    }`}
                  >
                    <span>Admin</span>
                    {currentUser?.role === 'admin' && <span className="text-[10px]">Active</span>}
                  </button>
                  <button
                    onClick={() => handleSwitch('staff')}
                    className={`text-left text-xs px-2.5 py-1.5 rounded-lg flex items-center justify-between ${
                      currentUser?.role === 'staff' ? 'bg-blue-50 text-blue-700 font-semibold' : 'hover:bg-slate-50'
                    }`}
                  >
                    <span>Staff</span>
                    {currentUser?.role === 'staff' && <span className="text-[10px]">Active</span>}
                  </button>
                  <button
                    onClick={() => handleSwitch('customer')}
                    className={`text-left text-xs px-2.5 py-1.5 rounded-lg flex items-center justify-between ${
                      currentUser?.role === 'customer' ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'hover:bg-slate-50'
                    }`}
                  >
                    <span>Customer Portal</span>
                    {currentUser?.role === 'customer' && <span className="text-[10px]">Active</span>}
                  </button>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-xs font-medium text-red-600 hover:bg-red-50 flex items-center gap-2 mt-1"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
