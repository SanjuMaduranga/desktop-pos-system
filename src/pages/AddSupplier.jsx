import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'
import { 
  ArrowLeft, Save, Building, User, Phone, Mail, MapPin, FileText, X, CheckCircle,
  Package, Plus, Trash2, Search 
} from 'lucide-react'

function AddSupplier() {
  const navigate = useNavigate()

  const [form, setForm] = useState({
    name: '',
    companyName: '',
    phone: '',
    email: '',
    address: '',
    notes: '',
  })

  const [selectedProducts, setSelectedProducts] = useState([])
  const [allProducts, setAllProducts] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [showAddProduct, setShowAddProduct] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Load all products on component mount
  useEffect(() => {
    loadProducts()
  }, [])

  async function loadProducts() {
    try {
      const products = await window.electronAPI.getAllProducts()
      setAllProducts(products || [])
    } catch (error) {
      console.error('Error loading products:', error)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    
    // Validate form
    const newErrors = {}
    if (!form.name.trim()) newErrors.name = 'Name is required'
    if (!form.phone.trim()) newErrors.phone = 'Phone is required'
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Invalid email format'
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      // Scroll to first error
      const firstError = document.querySelector('.border-red-500')
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
      return
    }

    setIsSubmitting(true)
    try {
      // First create the supplier
      const newSupplier = await window.electronAPI.createSupplier(form)
      
      // Then assign selected products to the supplier
      if (selectedProducts.length > 0) {
        for (const product of selectedProducts) {
          await window.electronAPI.addProductToSupplier(newSupplier.id, product.id)
        }
      }
      
      setShowSuccess(true)
      
      // Reset form after success
      setForm({
        name: '',
        companyName: '',
        phone: '',
        email: '',
        address: '',
        notes: '',
      })
      setSelectedProducts([])
      
      // Hide success message after 2 seconds and navigate
      setTimeout(() => {
        setShowSuccess(false)
        navigate('/suppliers')
      }, 2000)
      
    } catch (error) {
      console.error('Error creating supplier:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleChange(e) {
    const { name, value } = e.target
    setForm(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error for this field when user types
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  function handleAddProduct(product) {
    if (!selectedProducts.some(p => p.id === product.id)) {
      setSelectedProducts([...selectedProducts, product])
    }
    setShowAddProduct(false)
    setSearchTerm('')
  }

  function handleRemoveProduct(productId) {
    setSelectedProducts(selectedProducts.filter(p => p.id !== productId))
  }

  // Filter available products (not already selected)
  const availableProducts = allProducts.filter(
    product => !selectedProducts.some(p => p.id === product.id)
  )

  const filteredAvailableProducts = availableProducts.filter(product => {
    const searchLower = searchTerm.toLowerCase()
    const productName = product.name?.toLowerCase() || ''
    const categoryName = product.category?.name?.toLowerCase() || ''
    return productName.includes(searchLower) || categoryName.includes(searchLower)
  })

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
                Add Supplier
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Create a new supplier record and assign products
              </p>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {showSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            <div>
              <p className="font-medium text-green-800">Supplier created successfully!</p>
              <p className="text-sm text-green-600">Redirecting to suppliers list...</p>
            </div>
          </div>
        )}

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
                      value={form.name}
                      onChange={handleChange}
                      placeholder="Enter supplier name"
                      className={`w-full px-4 py-2.5 bg-slate-50 border ${errors.name ? 'border-red-500' : 'border-slate-200'} rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition text-sm`}
                      autoFocus
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
                      value={form.companyName}
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
                      value={form.phone}
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
                      value={form.email}
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
                      value={form.address}
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
                      value={form.notes}
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
                    {isSubmitting ? 'Saving...' : 'Save Supplier'}
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
                    {selectedProducts.length}
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
                    {isLoading ? (
                      <p className="text-sm text-slate-500 text-center py-2">Loading products...</p>
                    ) : filteredAvailableProducts.length > 0 ? (
                      filteredAvailableProducts.slice(0, 5).map(product => (
                        <button
                          key={product.id}
                          onClick={() => handleAddProduct(product)}
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

              {/* Selected Products List */}
              {selectedProducts.length > 0 ? (
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {selectedProducts.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between p-3 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition group"
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
                  <p className="text-slate-500 text-sm">No products selected</p>
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

export default AddSupplier