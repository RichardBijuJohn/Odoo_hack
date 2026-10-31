import { Bell, Search, ChevronDown, User, LogOut, ShieldCheck, Briefcase } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'

export default function Navbar() {
  const { currentUser, logout, switchUser } = useAuth()
  const navigate = useNavigate()
  const [dropdownOpen, setDropdownOpen] = useState(false)

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

  return (
    <header className="fixed top-0 left-64 right-0 z-20 h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6">
      {/* Search Input */}
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search subscriptions, customers, plans..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3 relative">
        {/* Role Pill Badge */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
          {currentUser?.role === 'admin' ? (
            <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
          ) : (
            <Briefcase className="w-3.5 h-3.5 text-blue-600" />
          )}
          <span className="capitalize">{currentUser?.role || 'User'}</span>
        </div>

        <button className="relative p-2 rounded-lg hover:bg-slate-100 transition text-slate-500">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* Profile Avatar */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 pl-3 border-l border-slate-200 hover:bg-slate-50 rounded-lg px-2 py-1.5 transition text-left"
          >
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-xs">
              {currentUser?.name?.charAt(0) || 'U'}
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-slate-700 leading-tight">
                {currentUser?.name || 'User'}
              </p>
              <p className="text-xs text-slate-400 leading-tight">{currentUser?.email}</p>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in duration-100">
              <div className="px-4 py-2 border-b border-slate-100">
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
