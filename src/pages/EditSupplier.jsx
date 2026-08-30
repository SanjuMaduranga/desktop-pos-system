import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'
import { 
  ArrowLeft, Save, Building, User, Phone, Mail, MapPin, FileText, X, Loader,
  Package, Plus, Trash2, Search 
} from 'lucide-react'

function EditSupplier() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    name: '',
    companyName: '',
    phone: '',
    email: '',
    address: '',
    notes: '',
  })

  const [products, setProducts] = useState([])
  const [allProducts, setAllProducts] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [showAddProduct, setShowAddProduct] = useState(false)

  async function loadSupplier() {
    try {
      const supplier = await window.electronAPI.getSupplierById(Number(id))
      setFormData(supplier || {
        name: '',
        companyName: '',
        phone: '',
        email: '',
        address: '',
        notes: '',
      })
      
      // Load products for this supplier
      const supplierProducts = await window.electronAPI.getProductsBySupplier(Number(id))
      setProducts(supplierProducts || [])
      
      // Load all products for adding new ones
      const allProductsData = await window.electronAPI.getAllProducts()
      setAllProducts(allProductsData || [])
      
    } catch (error) {
      console.error('Error loading supplier:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadSupplier()
  }, [id])

  function handleChange(e) {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    
    const newErrors = {}
    if (!formData.name?.trim()) newErrors.name = 'Name is required'
    if (!formData.phone?.trim()) newErrors.phone = 'Phone is required'
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format'
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setIsSubmitting(true)
    try {
      await window.electronAPI.updateSupplier({
        id: Number(id),
        ...formData,
      })
      navigate('/suppliers')
    } catch (error) {
      console.error('Error updating supplier:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleRemoveProduct(productId) {
    const confirmRemove = confirm('Are you sure you want to remove this product from the supplier?')
    if (!confirmRemove) return

    try {
      await window.electronAPI.removeProductFromSupplier(Number(id), productId)
      // Reload products
      const updatedProducts = await window.electronAPI.getProductsBySupplier(Number(id))
      setProducts(updatedProducts)
      // Refresh available products
      const allProductsData = await window.electronAPI.getAllProducts()
      setAllProducts(allProductsData || [])
    } catch (error) {
      console.error('Error removing product:', error)
    }
  }

  async function handleAddProduct(productId) {
    try {
      await window.electronAPI.addProductToSupplier(Number(id), productId)
      // Reload products
      const updatedProducts = await window.electronAPI.getProductsBySupplier(Number(id))
      setProducts(updatedProducts)
      // Refresh available products
      const allProductsData = await window.electronAPI.getAllProducts()
      setAllProducts(allProductsData || [])
      setShowAddProduct(false)
      setSearchTerm('')
    } catch (error) {
      console.error('Error adding product:', error)
    }
  }

  // Filter available products (not already assigned to supplier)
  const availableProducts = allProducts.filter(
    product => !products.some(p => p.id === product.id)
  )

  const filteredAvailableProducts = availableProducts.filter(product => {
    const searchLower = searchTerm.toLowerCase()
    const productName = product.name?.toLowerCase() || ''
    const categoryName = product.category?.name?.toLowerCase() || ''
    return productName.includes(searchLower) || categoryName.includes(searchLower)
  })

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <div className="flex flex-col items-center gap-4">
            <Loader size={40} className="text-indigo-600 animate-spin" />
            <p className="text-slate-500 font-medium">Loading supplier...</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        
        {/* Header with Back Button */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/suppliers')}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-all duration-200 text-slate-600 hover:text-slate-900 text-sm font-medium"
            >
              <ArrowLeft size={18} />
              Back
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <Building className="w-7 h-7 text-indigo-600" />
                Edit Supplier
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Update supplier information and manage products
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-slate-500 bg-white px-4 py-2 rounded-xl border border-slate-200">
            <span className="font-medium text-slate-700">ID:</span>
            #{id}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Supplier Form - Takes 2/3 of the space */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Supplier Name */}
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                      <User size={16} className="text-indigo-500" />
                      Supplier Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name || ''}
                      onChange={handleChange}
                      placeholder="Enter supplier name"
                      className={`w-full px-4 py-2.5 bg-slate-50 border ${errors.name ? 'border-red-500' : 'border-slate-200'} rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition text-sm`}
                    />
                    {errors.name && (
                      <p className="text-red-500 text-xs flex items-center gap-1 mt-1">
                        <X size={12} />
                        {errors.name}
                      </p>
                    )}
                  </div>

                  {/* Company Name */}
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                      <Building size={16} className="text-indigo-500" />
                      Company Name
                    </label>
                    <input
                      type="text"
                      name="companyName"
                      value={formData.companyName || ''}
                      onChange={handleChange}
                      placeholder="Enter company name"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition text-sm"
                    />
                  </div>

                  {/* Phone */}
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                      <Phone size={16} className="text-indigo-500" />
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone || ''}
                      onChange={handleChange}
                      placeholder="Enter phone number"
                      className={`w-full px-4 py-2.5 bg-slate-50 border ${errors.phone ? 'border-red-500' : 'border-slate-200'} rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition text-sm`}
                    />
                    {errors.phone && (
                      <p className="text-red-500 text-xs flex items-center gap-1 mt-1">
                        <X size={12} />
                        {errors.phone}
                      </p>
                    )}
                  </div>

                  {/* Email */}
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                      <Mail size={16} className="text-indigo-500" />
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email || ''}
                      onChange={handleChange}
                      placeholder="Enter email address"
                      className={`w-full px-4 py-2.5 bg-slate-50 border ${errors.email ? 'border-red-500' : 'border-slate-200'} rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition text-sm`}
                    />
                    {errors.email && (
                      <p className="text-red-500 text-xs flex items-center gap-1 mt-1">
                        <X size={12} />
                        {errors.email}
                      </p>
                    )}
                  </div>

                  {/* Address */}
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                      <MapPin size={16} className="text-indigo-500" />
                      Address
                    </label>
                    <textarea
                      name="address"
                      value={formData.address || ''}
                      onChange={handleChange}
                      placeholder="Enter full address"
                      rows="2"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition text-sm resize-none"
                    />
                  </div>

                  {/* Notes */}
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                      <FileText size={16} className="text-indigo-500" />
                      Additional Notes
                    </label>
                    <textarea
                      name="notes"
                      value={formData.notes || ''}
                      onChange={handleChange}
                      placeholder="Any additional information about the supplier"
                      rows="3"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition text-sm resize-none"
                    />
                  </div>

                </div>

                {/* Form Actions */}
                <div className="flex flex-col sm:flex-row gap-3 mt-8 pt-6 border-t border-slate-200">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl transition-all duration-200 font-medium text-sm shadow-sm hover:shadow-md flex-1 sm:flex-none"
                  >
                    <Save size={18} />
                    {isSubmitting ? 'Updating...' : 'Update Supplier'}
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => navigate('/suppliers')}
                    className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition-all duration-200 font-medium text-sm flex-1 sm:flex-none"
                  >
                    Cancel
                  </button>
                </div>

              </div>
            </form>
          </div>

          {/* Products Section - Takes 1/3 of the space */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 h-full">
              
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Package size={20} className="text-indigo-600" />
                  <h2 className="text-lg font-semibold text-slate-800">Products</h2>
                  <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                    {products.length}
                  </span>
                </div>
                {availableProducts.length > 0 && (
                  <button
                    onClick={() => setShowAddProduct(!showAddProduct)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg transition text-sm font-medium"
                  >
                    <Plus size={14} />
                    Add
                  </button>
                )}
              </div>

              {/* Add Product Section */}
              {showAddProduct && (
                <div className="mb-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search products..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    />
                  </div>
                  <div className="mt-2 max-h-40 overflow-y-auto space-y-1">
                    {filteredAvailableProducts.length > 0 ? (
                      filteredAvailableProducts.slice(0, 5).map(product => (
                        <button
                          key={product.id}
                          onClick={() => handleAddProduct(product.id)}
                          className="w-full text-left px-3 py-2 hover:bg-white rounded-lg transition text-sm flex items-center justify-between"
                        >
                          <span className="text-slate-700">{product.name}</span>
                          <span className="text-xs text-slate-400">
                            {product.category?.name || 'Uncategorized'}
                          </span>
                        </button>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500 text-center py-2">
                        {searchTerm ? 'No products found' : 'All products are assigned'}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setShowAddProduct(false)
                      setSearchTerm('')
                    }}
                    className="mt-2 text-xs text-slate-500 hover:text-slate-700"
                  >
                    Cancel
                  </button>
                </div>
              )}

              {/* Products List */}
              {products.length > 0 ? (
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {products.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition group"
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
                      <button
                        onClick={() => handleRemoveProduct(product.id)}
                        className="text-slate-400 hover:text-red-600 transition p-1"
                        title="Remove from supplier"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-500 text-sm">No products assigned</p>
                  <p className="text-slate-400 text-xs mt-1">Add products to this supplier</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </MainLayout>
  )
}

export default EditSupplier