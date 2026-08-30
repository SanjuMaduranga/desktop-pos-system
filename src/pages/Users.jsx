import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'
import { 
  Users as UserIcon, Plus, Search, Edit, Trash2, 
  User, Shield, Calendar, X, Loader,
  ChevronLeft, ChevronRight, CheckCircle,
  XCircle, Mail, UserCog
} from 'lucide-react'

function Users() {
  const [users, setUsers] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(5)
  const [isLoading, setIsLoading] = useState(true)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [userToDelete, setUserToDelete] = useState(null)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [userToUpdate, setUserToUpdate] = useState(null)

  useEffect(() => {
    loadUsers()
  }, [])

  async function loadUsers() {
    try {
      setIsLoading(true)
      const data = await window.electronAPI.getUsers()
      setUsers(data || [])
    } catch (error) {
      console.error('Error loading users:', error)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleDelete(id) {
    try {
      await window.electronAPI.deleteUser(Number(id))
      setShowDeleteModal(false)
      setUserToDelete(null)
      await loadUsers()
    } catch (error) {
      console.error('Error deleting user:', error)
      alert('Failed to delete user. Please try again.')
    }
  }

  async function handleStatusUpdate(id, active) {
    try {
      await window.electronAPI.updateUserStatus({
        id: Number(id),
        active: active
      })
      setShowStatusModal(false)
      setUserToUpdate(null)
      await loadUsers()
    } catch (error) {
      console.error('Error updating user status:', error)
      alert('Failed to update user status. Please try again.')
    }
  }

  function getRoleBadge(role) {
    const roleMap = {
      'ADMIN': { color: 'bg-purple-100 text-purple-700', icon: Shield },
      'MANAGER': { color: 'bg-blue-100 text-blue-700', icon: UserCog },
      'CASHIER': { color: 'bg-green-100 text-green-700', icon: User }
    }
    
    const roleInfo = roleMap[role] || roleMap['CASHIER']
    const Icon = roleInfo.icon
    
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${roleInfo.color}`}>
        <Icon size={12} />
        {role}
      </span>
    )
  }

  // Filter users based on search
  const filteredUsers = users.filter(user =>
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = filteredUsers.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage)

  const paginate = (pageNumber) => setCurrentPage(pageNumber)

  // Calculate summary stats
  const totalUsers = filteredUsers.length
  const adminCount = filteredUsers.filter(u => u.role === 'ADMIN').length
  const activeUsers = filteredUsers.filter(u => u.active !== false).length
  const inactiveUsers = filteredUsers.filter(u => u.active === false).length

  return (
    <MainLayout>
      <div className="space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <UserIcon className="w-7 h-7 text-indigo-600" />
              Users
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Manage system users and their roles
            </p>
          </div>

          <Link
            to="/users/add"
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md font-medium text-sm shrink-0"
          >
            <Plus size={18} />
            Add User
          </Link>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="bg-blue-50 p-3 rounded-xl">
                <UserIcon className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">Total Users</p>
                <p className="text-xl font-bold text-slate-800">{totalUsers}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="bg-purple-50 p-3 rounded-xl">
                <Shield className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">Administrators</p>
                <p className="text-xl font-bold text-slate-800">{adminCount}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="bg-green-50 p-3 rounded-xl">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">Active Users</p>
                <p className="text-xl font-bold text-green-600">{activeUsers}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="bg-red-50 p-3 rounded-xl">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">Inactive Users</p>
                <p className="text-xl font-bold text-red-600">{inactiveUsers}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Stats */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search users by name, username, email or role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition text-sm"
            />
          </div>
          <div className="text-sm text-slate-500 bg-white px-4 py-2 rounded-xl border border-slate-200 whitespace-nowrap">
            Found: <span className="font-semibold text-slate-700">{filteredUsers.length}</span> users
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <User size={14} />
                      User
                    </div>
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider hidden sm:table-cell">
                    <div className="flex items-center gap-2">
                      <Mail size={14} />
                      Email
                    </div>
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <Shield size={14} />
                      Role
                    </div>
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider hidden md:table-cell">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} />
                      Joined
                    </div>
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider hidden md:table-cell">
                    <div className="flex items-center gap-2">
                      <CheckCircle size={14} />
                      Status
                    </div>
                  </th>
                  <th className="px-6 py-3.5 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <Loader size={32} className="text-indigo-600 animate-spin" />
                        <p className="text-slate-500 font-medium">Loading users...</p>
                      </div>
                    </td>
                  </tr>
                ) : currentItems.length > 0 ? (
                  currentItems.map((user) => (
                    <tr 
                      key={user.id}
                      className="hover:bg-slate-50 transition-colors duration-150"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                            <span className="text-indigo-600 font-semibold text-sm">
                              {user.name?.charAt(0)?.toUpperCase() || 'U'}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-slate-800 text-sm">
                              {user.name}
                            </p>
                            <p className="text-xs text-slate-400 sm:hidden">
                              {user.email || 'No email'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 hidden sm:table-cell">
                        <span className="text-sm text-slate-600">
                          {user.email || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {getRoleBadge(user.role)}
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell">
                        <span className="text-sm text-slate-500">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          user.active !== false
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {user.active !== false ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          <Link
                            to={`/users/edit/${user.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors duration-200 text-sm font-medium"
                            title="Edit user"
                          >
                            <Edit size={14} />
                            <span className="hidden xs:inline">Edit</span>
                          </Link>
                          <button
                            onClick={() => {
                              setUserToUpdate(user)
                              setShowStatusModal(true)
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-600 rounded-lg transition-colors duration-200 text-sm font-medium"
                            title="Toggle status"
                          >
                            <CheckCircle size={14} />
                            <span className="hidden xs:inline">Status</span>
                          </button>
                          <button
                            onClick={() => {
                              setUserToDelete(user)
                              setShowDeleteModal(true)
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors duration-200 text-sm font-medium"
                            title="Delete user"
                          >
                            <Trash2 size={14} />
                            <span className="hidden xs:inline">Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <UserIcon className="w-12 h-12 text-slate-300" />
                        <p className="text-slate-500 font-medium">No users found</p>
                        <p className="text-sm text-slate-400">
                          {searchTerm ? 'Try adjusting your search' : 'Add your first user to get started'}
                        </p>
                        {!searchTerm && (
                          <Link
                            to="/users/add"
                            className="mt-2 inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl transition-all duration-200 text-sm"
                          >
                            <Plus size={16} />
                            Add User
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!isLoading && filteredUsers.length > itemsPerPage && (
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-sm text-slate-600">
                Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min(indexOfLastItem, filteredUsers.length)}
                </span>{' '}
                of <span className="font-medium">{filteredUsers.length}</span> results
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm"
                >
                  <ChevronLeft size={16} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => paginate(page)}
                    className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition ${
                      currentPage === page
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white border border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Status Update Modal */}
      {showStatusModal && userToUpdate && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowStatusModal(false)} />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full">
              <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-800">Update User Status</h2>
                <button onClick={() => setShowStatusModal(false)} className="p-2 hover:bg-slate-100 rounded-lg transition">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                    <span className="text-indigo-600 font-bold text-lg">
                      {userToUpdate.name?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">{userToUpdate.name}</p>
                    <p className="text-sm text-slate-500">{userToUpdate.username}</p>
                  </div>
                </div>
                <p className="text-sm text-slate-600 mb-4">
                  Current Status: <span className={`font-medium ${userToUpdate.active !== false ? 'text-green-600' : 'text-red-600'}`}>
                    {userToUpdate.active !== false ? 'Active' : 'Inactive'}
                  </span>
                </p>
                <div className="space-y-2">
                  <button
                    onClick={() => handleStatusUpdate(userToUpdate.id, true)}
                    className="w-full text-left px-4 py-3 bg-green-50 hover:bg-green-100 rounded-xl transition text-sm font-medium text-green-700 flex items-center gap-2"
                  >
                    <CheckCircle size={16} />
                    Activate User
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(userToUpdate.id, false)}
                    className="w-full text-left px-4 py-3 bg-red-50 hover:bg-red-100 rounded-xl transition text-sm font-medium text-red-700 flex items-center gap-2"
                  >
                    <XCircle size={16} />
                    Deactivate User
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && userToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)} />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full">
              <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-800">Delete User</h2>
                <button onClick={() => setShowDeleteModal(false)} className="p-2 hover:bg-slate-100 rounded-lg transition">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                    <User className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">Delete this user?</p>
                    <p className="text-sm text-slate-500">
                      User: <span className="font-medium">{userToDelete.name}</span>
                    </p>
                    <p className="text-sm text-slate-500">
                      Username: <span className="font-medium">{userToDelete.username}</span>
                    </p>
                  </div>
                </div>
                <p className="text-sm text-red-600 mb-4">
                  ⚠️ This action cannot be undone. All user data will be permanently removed.
                </p>
                <div className="flex gap-3 pt-4 border-t border-slate-200">
                  <button
                    onClick={() => handleDelete(userToDelete.id)}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium text-sm"
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl font-medium text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  )
}

export default Users