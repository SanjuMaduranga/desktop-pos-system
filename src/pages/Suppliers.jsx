import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'
import { 
  Plus, Search, Edit, Trash2, Phone, Mail, Building, User, ChevronLeft, ChevronRight,
  Package, Eye, X, MapPin, FileText, ShoppingBag, Calendar, Loader
} from 'lucide-react'

function Suppliers() {
  const [suppliers, setSuppliers] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(5)
  const [isLoading, setIsLoading] = useState(true)
  const [productCounts, setProductCounts] = useState({})
  const [selectedSupplier, setSelectedSupplier] = useState(null)
  const [supplierProducts, setSupplierProducts] = useState([])
  const [isDetailsLoading, setIsDetailsLoading] = useState(false)
  const [showDetails, setShowDetails] = useState(false)

  async function loadSuppliers() {
    try {
      setIsLoading(true)
      const data = await window.electronAPI.getSuppliers()
      setSuppliers(data)
      
      // Load product counts for each supplier
      const counts = {}
      for (const supplier of data) {
        try {
          const products = await window.electronAPI.getProductsBySupplier(supplier.id)
          counts[supplier.id] = products.length
        } catch (error) {
          counts[supplier.id] = 0
        }
      }
      setProductCounts(counts)
    } catch (error) {
      console.error('Error loading suppliers:', error)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleDelete(id) {
    const confirmDelete = confirm('Are you sure you want to delete this supplier? This will not delete their products.')

    if (!confirmDelete) return

    try {
      await window.electronAPI.deleteSupplier(id)
      await loadSuppliers()
    } catch (error) {
      console.error('Error deleting supplier:', error)
      alert('Failed to delete supplier. Please try again.')
    }
  }

  async function handleRowClick(supplier) {
    setSelectedSupplier(supplier)
    setShowDetails(true)
    setIsDetailsLoading(true)
    
    try {
      const products = await window.electronAPI.getProductsBySupplier(supplier.id)
      setSupplierProducts(products || [])
    } catch (error) {
      console.error('Error loading supplier products:', error)
      setSupplierProducts([])
    } finally {
      setIsDetailsLoading(false)
    }
  }

  function closeDetails() {
    setShowDetails(false)
    setSelectedSupplier(null)
    setSupplierProducts([])
  }

  useEffect(() => { 
    loadSuppliers() 
  }, [])

  // Filter suppliers based on search
  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.phone?.includes(searchTerm) ||
    supplier.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = filteredSuppliers.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(filteredSuppliers.length / itemsPerPage)

  const paginate = (pageNumber) => setCurrentPage(pageNumber)

  return (
    <MainLayout>
      <div className="space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <Building className="w-7 h-7 text-indigo-600" />
              Suppliers
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Manage your supplier relationships
            </p>
          </div>

          <Link
            to="/suppliers/add"
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md font-medium text-sm flex-shrink-0"
          >
            <Plus size={18} />
            Add Supplier
          </Link>
        </div>

        {/* Search and Stats */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search suppliers by name, company, phone or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition text-sm"
            />
          </div>
          <div className="text-sm text-slate-500 bg-white px-4 py-2 rounded-xl border border-slate-200 whitespace-nowrap">
            Total: <span className="font-semibold text-slate-700">{filteredSuppliers.length}</span> suppliers
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <User size={14} />
                      Name
                    </div>
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider hidden sm:table-cell">
                    <div className="flex items-center gap-2">
                      <Building size={14} />
                      Company
                    </div>
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <Phone size={14} />
                      Phone
                    </div>
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider hidden md:table-cell">
                    <div className="flex items-center gap-2">
                      <Package size={14} />
                      Products
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
                    <td colSpan="5" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                        <p className="text-slate-500 font-medium">Loading suppliers...</p>
                      </div>
                    </td>
                  </tr>
                ) : currentItems.length > 0 ? (
                  currentItems.map((supplier) => (
                    <tr 
                      key={supplier.id}
                      onClick={() => handleRowClick(supplier)}
                      className="hover:bg-slate-50 transition-colors duration-150 group cursor-pointer"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-indigo-600 font-semibold text-sm">
                              {supplier.name?.charAt(0)?.toUpperCase() || 'S'}
                            </span>
                          </div>
                          <div>
                            <span className="font-medium text-slate-800 text-sm block">
                              {supplier.name}
                            </span>
                            <span className="text-xs text-slate-400 sm:hidden">
                              {supplier.companyName || 'No company'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 hidden sm:table-cell">
                        {supplier.companyName || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        <div className="flex items-center gap-2">
                          <Phone size={14} className="text-slate-400 flex-shrink-0" />
                          {supplier.phone}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 hidden md:table-cell">
                        <div className="flex items-center gap-2">
                          <Package size={14} className="text-slate-400" />
                          <span className="font-medium">
                            {productCounts[supplier.id] !== undefined ? productCounts[supplier.id] : '...'}
                          </span>
                          <span className="text-slate-400 text-xs">
                            {productCounts[supplier.id] === 1 ? 'product' : 'products'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            to={`/suppliers/edit/${supplier.id}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors duration-200 text-sm font-medium"
                            title="Edit supplier"
                          >
                            <Edit size={14} />
                            <span className="hidden xs:inline">Edit</span>
                          </Link>
                          <button
                            onClick={() => handleDelete(supplier.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors duration-200 text-sm font-medium"
                            title="Delete supplier"
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
                    <td colSpan="5" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Building className="w-12 h-12 text-slate-300" />
                        <p className="text-slate-500 font-medium">No suppliers found</p>
                        <p className="text-sm text-slate-400">
                          {searchTerm ? 'Try adjusting your search' : 'Add your first supplier to get started'}
                        </p>
                        {!searchTerm && (
                          <Link
                            to="/suppliers/add"
                            className="mt-2 inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl transition-all duration-200 text-sm"
                          >
                            <Plus size={16} />
                            Add Supplier
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
          {!isLoading && filteredSuppliers.length > itemsPerPage && (
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-sm text-slate-600">
                Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min(indexOfLastItem, filteredSuppliers.length)}
                </span>{' '}
                of <span className="font-medium">{filteredSuppliers.length}</span> results
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

      {/* Supplier Details Modal */}
      {showDetails && selectedSupplier && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={closeDetails}
          />
          
          {/* Modal */}
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
              
              {/* Header */}
              <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-indigo-100 flex items-center justify-center">
                    <span className="text-indigo-600 font-bold text-lg">
                      {selectedSupplier.name?.charAt(0)?.toUpperCase() || 'S'}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">
                      {selectedSupplier.name}
                    </h2>
                    {selectedSupplier.companyName && (
                      <p className="text-sm text-slate-500">
                        {selectedSupplier.companyName}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={closeDetails}
                  className="p-2 hover:bg-slate-100 rounded-lg transition text-slate-400 hover:text-slate-600"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Content */}
              <div className="overflow-y-auto p-6 max-h-[calc(90vh-80px)]">
                
                {/* Supplier Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Phone size={16} className="text-slate-400" />
                      <span className="text-slate-600">{selectedSupplier.phone || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Mail size={16} className="text-slate-400" />
                      <span className="text-slate-600">{selectedSupplier.email || 'N/A'}</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin size={16} className="text-slate-400" />
                      <span className="text-slate-600">{selectedSupplier.address || 'No address provided'}</span>
                    </div>
                    {selectedSupplier.notes && (
                      <div className="flex items-start gap-2 text-sm">
                        <FileText size={16} className="text-slate-400 mt-0.5" />
                        <span className="text-slate-600">{selectedSupplier.notes}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Products Section */}
                <div className="border-t border-slate-200 pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                      <Package size={18} className="text-indigo-600" />
                      Products ({supplierProducts.length})
                    </h3>
                    <Link
                      to={`/suppliers/edit/${selectedSupplier.id}`}
                      className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                      Manage Products →
                    </Link>
                  </div>

                  {isDetailsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader size={24} className="text-indigo-600 animate-spin" />
                      <span className="ml-2 text-slate-500">Loading products...</span>
                    </div>
                  ) : supplierProducts.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {supplierProducts.map((product) => (
                        <div
                          key={product.id}
                          className="flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-slate-800 text-sm truncate">
                              {product.name}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                              <span>Stock: {product.stock || 0}</span>
                              {product.category && (
                                <>
                                  <span>•</span>
                                  <span>{product.category.name}</span>
                                </>
                              )}
                              {product.price && (
                                <>
                                  <span>•</span>
                                  <span>Rs. {product.price.toFixed(2)}</span>
                                </>
                              )}
                            </div>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            (product.stock || 0) <= 5 
                              ? 'bg-red-100 text-red-700' 
                              : 'bg-green-100 text-green-700'
                          }`}>
                            {(product.stock || 0) <= 5 ? 'Low Stock' : 'In Stock'}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Package className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                      <p className="text-slate-500 text-sm">No products assigned to this supplier</p>
                      <Link
                        to={`/suppliers/edit/${selectedSupplier.id}`}
                        className="mt-2 inline-block text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                      >
                        Add Products →
                      </Link>
                    </div>
                  )}
                </div>

                {/* Footer Actions */}
                <div className="border-t border-slate-200 mt-6 pt-4 flex flex-col sm:flex-row gap-3">
                  <Link
                    to={`/suppliers/edit/${selectedSupplier.id}`}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all duration-200 font-medium text-sm"
                  >
                    <Edit size={16} />
                    Edit Supplier
                  </Link>
                  <button
                    onClick={() => {
                      closeDetails()
                      handleDelete(selectedSupplier.id)
                    }}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-all duration-200 font-medium text-sm"
                  >
                    <Trash2 size={16} />
                    Delete Supplier
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

export default Suppliers