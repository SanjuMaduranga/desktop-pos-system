import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'
import { 
  RefreshCw, Plus, Search, Package, TrendingUp, 
  TrendingDown, Calendar, User, FileText, X, 
  Loader, ChevronLeft, ChevronRight, AlertCircle,
  CheckCircle
} from 'lucide-react'

function StockAdjustments() {
  const [adjustments, setAdjustments] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(5)
  const [isLoading, setIsLoading] = useState(true)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [adjustmentToDelete, setAdjustmentToDelete] = useState(null)
  
  // Summary stats
  const [stats, setStats] = useState({
    totalAdjustments: 0,
    totalIncreased: 0,
    totalDecreased: 0,
    netChange: 0
  })

  useEffect(() => {
    loadAdjustments()
  }, [])

  async function loadAdjustments() {
    try {
      setIsLoading(true)
      const data = await window.electronAPI.getStockAdjustments()
      setAdjustments(data || [])
      
      // Calculate stats
      const total = data || []
      const increased = total.filter(a => a.type === 'INCREASE')
      const decreased = total.filter(a => a.type === 'DECREASE')
      
      const totalIncreased = increased.reduce((sum, a) => sum + a.quantity, 0)
      const totalDecreased = decreased.reduce((sum, a) => sum + a.quantity, 0)
      
      setStats({
        totalAdjustments: total.length,
        totalIncreased: totalIncreased,
        totalDecreased: totalDecreased,
        netChange: totalIncreased - totalDecreased
      })
    } catch (error) {
      console.error('Error loading adjustments:', error)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleDelete(id) {
    try {
      await window.electronAPI.deleteStockAdjustment(Number(id))
      setShowDeleteModal(false)
      setAdjustmentToDelete(null)
      await loadAdjustments()
    } catch (error) {
      console.error('Error deleting adjustment:', error)
      alert('Failed to delete adjustment. Please try again.')
    }
  }

  // Filter adjustments based on search
  const filteredAdjustments = adjustments.filter(adjustment =>
    adjustment.product?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    adjustment.reason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    adjustment.type?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = filteredAdjustments.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(filteredAdjustments.length / itemsPerPage)

  const paginate = (pageNumber) => setCurrentPage(pageNumber)

  return (
    <MainLayout>
      <div className="space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <RefreshCw className="w-7 h-7 text-indigo-600" />
              Stock Adjustments
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Track and manage inventory adjustments
            </p>
          </div>

          <Link
            to="/stock-adjustments/add"
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md font-medium text-sm flex-shrink-0"
          >
            <Plus size={18} />
            New Adjustment
          </Link>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="bg-blue-50 p-3 rounded-xl">
                <RefreshCw className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">Total Adjustments</p>
                <p className="text-xl font-bold text-slate-800">{stats.totalAdjustments}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="bg-green-50 p-3 rounded-xl">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">Total Increased</p>
                <p className="text-xl font-bold text-green-600">+{stats.totalIncreased}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="bg-red-50 p-3 rounded-xl">
                <TrendingDown className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">Total Decreased</p>
                <p className="text-xl font-bold text-red-600">-{stats.totalDecreased}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl ${stats.netChange >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                <Package className={`w-5 h-5 ${stats.netChange >= 0 ? 'text-green-600' : 'text-red-600'}`} />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">Net Stock Change</p>
                <p className={`text-xl font-bold ${stats.netChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {stats.netChange >= 0 ? '+' : ''}{stats.netChange}
                </p>
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
              placeholder="Search by product, reason or type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition text-sm"
            />
          </div>
          <div className="text-sm text-slate-500 bg-white px-4 py-2 rounded-xl border border-slate-200 whitespace-nowrap">
            Found: <span className="font-semibold text-slate-700">{filteredAdjustments.length}</span> adjustments
          </div>
        </div>

        {/* Adjustments Table */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <Package size={14} />
                      Product
                    </div>
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <RefreshCw size={14} />
                      Type
                    </div>
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <Package size={14} />
                      Quantity
                    </div>
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider hidden md:table-cell">
                    <div className="flex items-center gap-2">
                      <FileText size={14} />
                      Reason
                    </div>
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider hidden sm:table-cell">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} />
                      Date
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
                        <p className="text-slate-500 font-medium">Loading adjustments...</p>
                      </div>
                    </td>
                  </tr>
                ) : currentItems.length > 0 ? (
                  currentItems.map((adjustment) => (
                    <tr 
                      key={adjustment.id}
                      className="hover:bg-slate-50 transition-colors duration-150"
                    >
                      <td className="px-6 py-4">
                        <span className="font-medium text-slate-800 text-sm">
                          {adjustment.product?.name || 'Deleted Product'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          adjustment.type === 'INCREASE'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {adjustment.type === 'INCREASE' ? (
                            <TrendingUp size={12} className="mr-1" />
                          ) : (
                            <TrendingDown size={12} className="mr-1" />
                          )}
                          {adjustment.type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`font-bold text-sm ${
                          adjustment.type === 'INCREASE' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {adjustment.type === 'INCREASE' ? '+' : '-'}{adjustment.quantity}
                        </span>
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell">
                        <span className="text-sm text-slate-600">
                          {adjustment.reason || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 hidden sm:table-cell">
                        <span className="text-sm text-slate-500">
                          {new Date(adjustment.createdAt).toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => {
                            setAdjustmentToDelete(adjustment)
                            setShowDeleteModal(true)
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors duration-200 text-sm font-medium"
                          title="Delete adjustment"
                        >
                          <X size={14} />
                          <span className="hidden xs:inline">Delete</span>
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <RefreshCw className="w-12 h-12 text-slate-300" />
                        <p className="text-slate-500 font-medium">No adjustments found</p>
                        <p className="text-sm text-slate-400">
                          {searchTerm ? 'Try adjusting your search' : 'Create your first stock adjustment'}
                        </p>
                        {!searchTerm && (
                          <Link
                            to="/stock-adjustments/add"
                            className="mt-2 inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl transition-all duration-200 text-sm"
                          >
                            <Plus size={16} />
                            New Adjustment
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
          {!isLoading && filteredAdjustments.length > itemsPerPage && (
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-sm text-slate-600">
                Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min(indexOfLastItem, filteredAdjustments.length)}
                </span>{' '}
                of <span className="font-medium">{filteredAdjustments.length}</span> results
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && adjustmentToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)} />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full">
              <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-800">Delete Adjustment</h2>
                <button onClick={() => setShowDeleteModal(false)} className="p-2 hover:bg-slate-100 rounded-lg transition">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                    <RefreshCw className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">Delete this adjustment?</p>
                    <p className="text-sm text-slate-500">
                      Product: <span className="font-medium">{adjustmentToDelete.product?.name}</span>
                    </p>
                    <p className="text-sm text-slate-500">
                      Quantity: <span className={`font-medium ${adjustmentToDelete.type === 'INCREASE' ? 'text-green-600' : 'text-red-600'}`}>
                        {adjustmentToDelete.type === 'INCREASE' ? '+' : '-'}{adjustmentToDelete.quantity}
                      </span>
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 pt-4 border-t border-slate-200">
                  <button
                    onClick={() => handleDelete(adjustmentToDelete.id)}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium text-sm"
                  >
                    <X size={16} />
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

export default StockAdjustments