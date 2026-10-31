import { useState } from 'react'
import { Plus, ShieldCheck, UserCheck, Mail, Building, AlertCircle, CheckCircle, X } from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import DataTable from '../../components/DataTable'
import { useAuth } from '../../context/AuthContext'

export default function Staff() {
  const { users, currentUser, isAdmin, addStaffMember } = useAuth()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    department: 'Operations',
    role: 'staff'
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Filter staff members
  const staffMembers = users.filter(u => u.role === 'staff' || u.role === 'admin')

  const handleAddStaff = (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    try {
      addStaffMember({
        name: formData.name,
        email: formData.email,
        role: 'staff',
        department: formData.department
      })
      setSuccess(`Staff member ${formData.name} added successfully!`)
      setIsModalOpen(false)
      setFormData({ name: '', email: '', department: 'Operations', role: 'staff' })
      setTimeout(() => setSuccess(''), 4000)
    } catch (err) {
      setError(err.message || 'Failed to add staff member.')
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Staff & Internal Team"
        description="Internal staff handle day-to-day work with limited access. Only the administrator can add a new member of staff."
        action={
          isAdmin ? (
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition shadow-md shadow-blue-500/20"
            >
              <Plus className="w-4 h-4" /> Add Staff Member
            </button>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium rounded-lg">
              <ShieldCheck className="w-4 h-4 text-amber-600" />
              <span>Admin only: Staff creation locked</span>
            </div>
          )
        }
      />

      {success && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2 text-sm">
          <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Permission Summary Card */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase font-bold text-blue-400 tracking-wider">Access Control Matrix</span>
          <h3 className="text-base font-bold text-white mt-0.5">Role-Based System Permissions</h3>
          <p className="text-xs text-slate-400 mt-1">
            Current user role: <strong className="text-white capitalize">{currentUser?.role}</strong> (
            {currentUser?.email})
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 bg-purple-500/20 border border-purple-500/30 rounded-xl text-purple-300 text-xs font-semibold">
            Admin: Full System & Staff Control
          </div>
          <div className="px-3 py-1.5 bg-amber-500/20 border border-amber-500/30 rounded-xl text-amber-300 text-xs font-semibold">
            Staff: Day-to-Day Operations
          </div>
        </div>
      </div>

      {/* Staff Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">Member Name</th>
                <th className="px-5 py-3.5">Role</th>
                <th className="px-5 py-3.5">Email</th>
                <th className="px-5 py-3.5">Department</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Date Added</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {staffMembers.map((member) => (
                <tr key={member.id} className="hover:bg-slate-50/70 transition">
                  <td className="px-5 py-4">
                    <div className="font-semibold text-slate-900">{member.name}</div>
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                        member.role === 'admin'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {member.role}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-slate-600">{member.email}</td>
                  <td className="px-5 py-4 text-slate-500 text-xs">{member.department || 'Operations'}</td>
                  <td className="px-5 py-4">
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                      Active
                    </span>
                  </td>
                  <td className="px-5 py-4 text-slate-400 text-xs">{member.createdAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Staff Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">Add New Staff Member</h3>
                  <p className="text-xs text-slate-500">Only authorized Admins can assign staff access</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddStaff} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jordan Smith"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  Staff Email *
                </label>
                <input
                  type="email"
                  required
                  placeholder="jordan@brightloop.io"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  Department
                </label>
                <select
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                >
                  <option value="Operations">Operations</option>
                  <option value="Billing & Finance">Billing & Finance</option>
                  <option value="Support & Customer Success">Support & Customer Success</option>
                  <option value="Product Delivery">Product Delivery</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-500/20"
                >
                  Confirm & Add Staff
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
