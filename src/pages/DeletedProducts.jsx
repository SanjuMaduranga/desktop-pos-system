import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'
import { 
  Trash2, Package, Search, RotateCcw, 
  Calendar, DollarSign, Barcode, X, Loader,
  ChevronLeft, ChevronRight
} from 'lucide-react'

function DeletedProducts() {
  const [products, setProducts] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(5)
  const [isLoading, setIsLoading] = useState(true)
  const [restoringId, setRestoringId] = useState(null)

  async function loadProducts() {
    try {
      setIsLoading(true)
      const data = await window.electronAPI.getDeletedProducts()
      setProducts(data || [])
    } catch (error) {
      console.error('Error loading deleted products:', error)
    } finally {
      setIsLoading(false)
    }
  }

  async function restoreProduct(id) {
    if (!confirm('Are you sure you want to restore this product?')) return

    try {
      setRestoringId(id)
      await window.electronAPI.restoreProduct(id)
      await loadProducts()
    } catch (error) {
      console.error('Error restoring product:', error)
      alert('Failed to restore product. Please try again.')
    } finally {
      setRestoringId(null)
    }
  }

  useEffect(() => {
    loadProducts()
  }, [])

  // Filter products based on search
  const filteredProducts = products.filter(product =>
    product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.barcode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = filteredProducts.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage)

  const paginate = (pageNumber) => setCurrentPage(pageNumber)

  return (
    <MainLayout>
      <div className="space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <Trash2 className="w-7 h-7 text-red-500" />
              Deleted Products
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              View and restore deleted products
            </p>
          </div>
        </div>

        {/* Search and Stats */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search deleted products by name, barcode or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition text-sm"
            />
          </div>
          <div className="text-sm text-slate-500 bg-white px-4 py-2 rounded-xl border border-slate-200 whitespace-nowrap">
            Total: <span className="font-semibold text-slate-700">{filteredProducts.length}</span> deleted items
          </div>
        </div>

        {/* Products Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12 bg-white rounded-2xl border border-slate-200">
            <div className="flex flex-col items-center gap-3">
              <Loader size={32} className="text-indigo-600 animate-spin" />
              <p className="text-slate-500 font-medium">Loading deleted products...</p>
            </div>
          </div>
        ) : currentItems.length > 0 ? (
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
                        <Barcode size={14} />
                        Barcode
                      </div>
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider hidden sm:table-cell">
                      <div className="flex items-center gap-2">
                        <DollarSign size={14} />
                        Price
                      </div>
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider hidden md:table-cell">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} />
                        Deleted At
                      </div>
                    </th>
                    <th className="px-6 py-3.5 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {currentItems.map((product) => (
                    <tr 
                      key={product.id}
                      className="hover:bg-slate-50 transition-colors duration-150"
                    >
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-slate-800 text-sm">
                            {product.name}
                          </p>
                          {product.category && (
                            <p className="text-xs text-slate-400">
                              {product.category.name}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-sm text-slate-600">
                          {product.barcode || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 hidden sm:table-cell">
                        <span className="text-sm text-slate-600">
                          Rs. {product.price?.toFixed(2) || '0.00'}
                        </span>
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell">
                        <span className="text-sm text-slate-600">
                          {product.deletedAt 
                            ? new Date(product.deletedAt).toLocaleString()
                            : new Date(product.updatedAt || product.createdAt).toLocaleString()
                          }
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => restoreProduct(product.id)}
                          disabled={restoringId === product.id}
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-50 hover:bg-green-100 text-green-600 rounded-lg transition-colors duration-200 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {restoringId === product.id ? (
                            <>
                              <Loader size={14} className="animate-spin" />
                              Restoring...
                            </>
                          ) : (
                            <>
                              <RotateCcw size={14} />
                              Restore
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {filteredProducts.length > itemsPerPage && (
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-sm text-slate-600">
                  Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(indexOfLastItem, filteredProducts.length)}
                  </span>{' '}
                  of <span className="font-medium">{filteredProducts.length}</span> results
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
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
            <div className="flex flex-col items-center gap-3">
              <Package className="w-16 h-16 text-slate-300" />
              <p className="text-slate-500 font-medium text-lg">No deleted products found</p>
              <p className="text-sm text-slate-400">
                {searchTerm ? 'Try adjusting your search' : 'Deleted products will appear here'}
              </p>
              {!searchTerm && (
                <Link
                  to="/products"
                  className="mt-2 inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl transition-all duration-200 text-sm"
                >
                  <Package size={16} />
                  View Products
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  )
}

export default DeletedProducts