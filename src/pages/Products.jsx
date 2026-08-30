import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'
import { useAuth } from '../context/AuthContext'
import { 
  Plus, Search, Edit, Trash2, Package, X, Check, Save, 
  ChevronLeft, ChevronRight, DollarSign, Barcode, 
  ShoppingBag, AlertCircle, Loader
} from 'lucide-react'

function Products() {
  const [products, setProducts] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(5)
  const [isLoading, setIsLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [editingField, setEditingField] = useState(null) // 'stock' or 'price'
  const [editValue, setEditValue] = useState('')
  const { user } = useAuth()

  async function loadProducts() {
    try {
      setIsLoading(true)
      const data = await window.electronAPI.getProducts()
      setProducts(data || [])
    } catch (error) {
      console.error('Error loading products:', error)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleDelete(id) {
    const confirmDelete = confirm('Are you sure you want to delete this product?')
    if (!confirmDelete) return

    try {
      await window.electronAPI.deleteProduct({ id: Number(id) })
      await loadProducts()
    } catch (error) {
      console.error('Error deleting product:', error)
      alert('Failed to delete product. Please try again.')
    }
  }

  function startEditing(productId, field, currentValue) {
    setEditingId(productId)
    setEditingField(field)
    setEditValue(String(currentValue))
  }

  function cancelEditing() {
    setEditingId(null)
    setEditingField(null)
    setEditValue('')
  }

  async function saveEdit(productId) {
    try {
      if (editingField === 'stock') {
        await window.electronAPI.updateProductStock({
          id: productId,
          stock: Number(editValue),
        })
      } else if (editingField === 'price') {
        await window.electronAPI.updateProductPrice({
          id: productId,
          price: Number(editValue),
        })
      }
      cancelEditing()
      await loadProducts()
    } catch (error) {
      console.error('Error updating product:', error)
      alert('Failed to update product. Please try again.')
    }
  }

  function handleKeyDown(e, productId) {
    if (e.key === 'Enter') {
      saveEdit(productId)
    } else if (e.key === 'Escape') {
      cancelEditing()
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
              <Package className="w-7 h-7 text-indigo-600" />
              Products
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Manage your product inventory
            </p>
          </div>

          <Link
            to="/products/add"
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md font-medium text-sm flex-shrink-0"
          >
            <Plus size={18} />
            Add Product
          </Link>
        </div>

        {/* Search and Stats */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search products by name, barcode or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition text-sm"
            />
          </div>
          <div className="text-sm text-slate-500 bg-white px-4 py-2 rounded-xl border border-slate-200 whitespace-nowrap">
            Total: <span className="font-semibold text-slate-700">{filteredProducts.length}</span> products
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
                      <Barcode size={14} />
                      Barcode
                    </div>
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <ShoppingBag size={14} />
                      Product
                    </div>
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <DollarSign size={14} />
                      Price
                    </div>
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <Package size={14} />
                      Stock
                    </div>
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <AlertCircle size={14} />
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
                        <Loader size={24} className="text-indigo-600 animate-spin" />
                        <p className="text-slate-500 font-medium">Loading products...</p>
                      </div>
                    </td>
                  </tr>
                ) : currentItems.length > 0 ? (
                  currentItems.map((product) => (
                    <tr 
                      key={product.id}
                      className="hover:bg-slate-50 transition-colors duration-150"
                    >
                      <td className="px-6 py-4">
                        <span className="font-mono text-sm text-slate-600">
                          {product.barcode || '-'}
                        </span>
                      </td>
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
                        {editingId === product.id && editingField === 'price' ? (
                          <div className="flex items-center gap-2">
                            <span className="text-slate-500">Rs.</span>
                            <input
                              type="number"
                              value={editValue}
                              autoFocus
                              className="w-24 px-2 py-1 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                              onChange={(e) => setEditValue(e.target.value)}
                              onKeyDown={(e) => handleKeyDown(e, product.id)}
                            />
                            <button
                              onClick={() => saveEdit(product.id)}
                              className="p-1 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg transition"
                              title="Save"
                            >
                              <Check size={16} />
                            </button>
                            <button
                              onClick={cancelEditing}
                              className="p-1 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition"
                              title="Cancel"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ) : (
                          <span className="font-medium text-slate-800">
                            Rs. {product.price?.toFixed(2) || '0.00'}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {editingId === product.id && editingField === 'stock' ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={editValue}
                              autoFocus
                              className="w-20 px-2 py-1 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                              onChange={(e) => setEditValue(e.target.value)}
                              onKeyDown={(e) => handleKeyDown(e, product.id)}
                            />
                            <button
                              onClick={() => saveEdit(product.id)}
                              className="p-1 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg transition"
                              title="Save"
                            >
                              <Check size={16} />
                            </button>
                            <button
                              onClick={cancelEditing}
                              className="p-1 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition"
                              title="Cancel"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ) : (
                          <span className={`font-medium ${
                            product.stock <= 5 
                              ? 'text-red-600' 
                              : product.stock <= 10 
                              ? 'text-orange-500' 
                              : 'text-slate-800'
                          }`}>
                            {product.stock || 0}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          product.stock <= 0 
                            ? 'bg-red-100 text-red-800'
                            : product.stock <= 5 
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {product.stock <= 0 
                            ? 'Out of Stock' 
                            : product.stock <= 5 
                            ? 'Low Stock' 
                            : 'In Stock'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          <button
                            onClick={() => startEditing(product.id, 'price', product.price)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-600 rounded-lg transition-colors duration-200 text-sm font-medium"
                            title="Edit Price"
                          >
                            <DollarSign size={14} />
                            <span className="hidden xs:inline">Price</span>
                          </button>
                          <button
                            onClick={() => startEditing(product.id, 'stock', product.stock)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors duration-200 text-sm font-medium"
                            title="Edit Stock"
                          >
                            <Package size={14} />
                            <span className="hidden xs:inline">Stock</span>
                          </button>
                          {user?.role === 'ADMIN' && (
                            <button
                              onClick={() => handleDelete(product.id)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors duration-200 text-sm font-medium"
                              title="Delete"
                            >
                              <Trash2 size={14} />
                              <span className="hidden xs:inline">Delete</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Package className="w-12 h-12 text-slate-300" />
                        <p className="text-slate-500 font-medium">No products found</p>
                        <p className="text-sm text-slate-400">
                          {searchTerm ? 'Try adjusting your search' : 'Add your first product to get started'}
                        </p>
                        {!searchTerm && (
                          <Link
                            to="/products/add"
                            className="mt-2 inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl transition-all duration-200 text-sm"
                          >
                            <Plus size={16} />
                            Add Product
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
          {!isLoading && filteredProducts.length > itemsPerPage && (
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
      </div>
    </MainLayout>
  )
}

export default Products