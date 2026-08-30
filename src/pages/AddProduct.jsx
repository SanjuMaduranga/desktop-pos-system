import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'
import { 
  ArrowLeft, Save, Package, Barcode, DollarSign, 
  ShoppingBag, Layers, X, CheckCircle, Loader
} from 'lucide-react'

function AddProduct() {
  const navigate = useNavigate()

  const [categories, setCategories] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    barcode: '',
    price: '',
    stock: '',
    categoryId: '',
  })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    loadCategories()
  }, [])

  async function loadCategories() {
    try {
      setIsLoading(true)
      const data = await window.electronAPI.getCategories()
      setCategories(data || [])
      
      if (data && data.length > 0) {
        setFormData((prev) => ({
          ...prev,
          categoryId: data[0].id,
        }))
      }
    } catch (error) {
      console.error('Error loading categories:', error)
    } finally {
      setIsLoading(false)
    }
  }

  function handleChange(e) {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
    // Clear error for this field when user types
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  function validateForm() {
    const newErrors = {}
    
    if (!formData.name?.trim()) {
      newErrors.name = 'Product name is required'
    }
    
    if (!formData.barcode?.trim()) {
      newErrors.barcode = 'Barcode is required'
    }
    
    if (!formData.price || Number(formData.price) <= 0) {
      newErrors.price = 'Price must be greater than 0'
    }
    
    if (!formData.stock || Number(formData.stock) < 0) {
      newErrors.stock = 'Stock must be 0 or greater'
    }
    
    if (!formData.categoryId) {
      newErrors.categoryId = 'Category is required'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    
    if (!validateForm()) {
      // Scroll to first error
      const firstError = document.querySelector('.border-red-500')
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
      return
    }

    setIsSubmitting(true)
    try {
      await window.electronAPI.createProduct({
        ...formData,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        categoryId: parseInt(formData.categoryId),
      })
      
      setShowSuccess(true)
      
      // Reset form after success
      setFormData({
        name: '',
        barcode: '',
        price: '',
        stock: '',
        categoryId: categories[0]?.id || '',
      })
      
      // Hide success message after 2 seconds and navigate
      setTimeout(() => {
        setShowSuccess(false)
        navigate('/products')
      }, 2000)
      
    } catch (error) {
      console.error('Error creating product:', error)
      alert('Failed to create product. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        
        {/* Header with Back Button */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/products')}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-all duration-200 text-slate-600 hover:text-slate-900 text-sm font-medium"
            >
              <ArrowLeft size={18} />
              Back
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <Package className="w-7 h-7 text-indigo-600" />
                Add Product
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Create a new product for your inventory
              </p>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {showSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            <div>
              <p className="font-medium text-green-800">Product created successfully!</p>
              <p className="text-sm text-green-600">Redirecting to products list...</p>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Product Name */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <ShoppingBag size={16} className="text-indigo-500" />
                  Product Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter product name"
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

              {/* Barcode */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <Barcode size={16} className="text-indigo-500" />
                  Barcode <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="barcode"
                  value={formData.barcode}
                  onChange={handleChange}
                  placeholder="Enter barcode"
                  className={`w-full px-4 py-2.5 bg-slate-50 border ${errors.barcode ? 'border-red-500' : 'border-slate-200'} rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition text-sm`}
                />
                {errors.barcode && (
                  <p className="text-red-500 text-xs flex items-center gap-1 mt-1">
                    <X size={12} />
                    {errors.barcode}
                  </p>
                )}
              </div>

              {/* Price */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <DollarSign size={16} className="text-indigo-500" />
                  Price (Rs.) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className={`w-full px-4 py-2.5 bg-slate-50 border ${errors.price ? 'border-red-500' : 'border-slate-200'} rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition text-sm`}
                />
                {errors.price && (
                  <p className="text-red-500 text-xs flex items-center gap-1 mt-1">
                    <X size={12} />
                    {errors.price}
                  </p>
                )}
              </div>

              {/* Stock */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <Package size={16} className="text-indigo-500" />
                  Stock Quantity <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="stock"
                  value={formData.stock}
                  onChange={handleChange}
                  placeholder="0"
                  min="0"
                  className={`w-full px-4 py-2.5 bg-slate-50 border ${errors.stock ? 'border-red-500' : 'border-slate-200'} rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition text-sm`}
                />
                {errors.stock && (
                  <p className="text-red-500 text-xs flex items-center gap-1 mt-1">
                    <X size={12} />
                    {errors.stock}
                  </p>
                )}
              </div>

              {/* Category */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <Layers size={16} className="text-indigo-500" />
                  Category <span className="text-red-500">*</span>
                </label>
                {isLoading ? (
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                    <Loader size={16} className="text-indigo-600 animate-spin" />
                    <span className="text-sm text-slate-500">Loading categories...</span>
                  </div>
                ) : categories.length > 0 ? (
                  <select
                    name="categoryId"
                    value={formData.categoryId}
                    onChange={handleChange}
                    className={`w-full px-4 py-2.5 bg-slate-50 border ${errors.categoryId ? 'border-red-500' : 'border-slate-200'} rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition text-sm`}
                  >
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="px-4 py-2.5 bg-yellow-50 border border-yellow-200 rounded-xl text-sm text-yellow-700 flex items-center gap-2">
                    <AlertCircle size={16} />
                    No categories available. Please create a category first.
                  </div>
                )}
                {errors.categoryId && (
                  <p className="text-red-500 text-xs flex items-center gap-1 mt-1">
                    <X size={12} />
                    {errors.categoryId}
                  </p>
                )}
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
                {isSubmitting ? 'Saving...' : 'Save Product'}
              </button>
              
              <button
                type="button"
                onClick={() => navigate('/products')}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition-all duration-200 font-medium text-sm flex-1 sm:flex-none"
              >
                Cancel
              </button>
            </div>

          </div>
        </form>
      </div>
    </MainLayout>
  )
}

export default AddProduct