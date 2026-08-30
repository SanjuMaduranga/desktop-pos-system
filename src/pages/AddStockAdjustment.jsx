import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'
import { 
  ArrowLeft, Save, Package, TrendingUp, TrendingDown, 
  FileText, X, CheckCircle, Loader, AlertCircle,
  RefreshCw
} from 'lucide-react'

function AddStockAdjustment() {
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [formData, setFormData] = useState({
    productId: '',
    type: 'INCREASE',
    quantity: '',
    reason: ''
  })
  const [errors, setErrors] = useState({})
  const [selectedProduct, setSelectedProduct] = useState(null)

  useEffect(() => {
    loadProducts()
  }, [])

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
    
    if (name === 'productId') {
      const product = products.find(p => p.id === Number(value))
      setSelectedProduct(product)
    }
  }

  function validateForm() {
    const newErrors = {}
    
    if (!formData.productId) {
      newErrors.productId = 'Please select a product'
    }
    
    if (!formData.quantity || Number(formData.quantity) <= 0) {
      newErrors.quantity = 'Quantity must be greater than 0'
    }
    
    if (formData.type === 'DECREASE' && selectedProduct) {
      if (Number(formData.quantity) > selectedProduct.stock) {
        newErrors.quantity = `Cannot decrease more than current stock (${selectedProduct.stock})`
      }
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    
    if (!validateForm()) {
      const firstError = document.querySelector('.border-red-500')
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
      return
    }

    setIsSubmitting(true)
    try {
      await window.electronAPI.createStockAdjustment({
        productId: Number(formData.productId),
        type: formData.type,
        quantity: Number(formData.quantity),
        reason: formData.reason
      })
      
      setShowSuccess(true)
      
      setFormData({
        productId: '',
        type: 'INCREASE',
        quantity: '',
        reason: ''
      })
      setSelectedProduct(null)
      
      setTimeout(() => {
        setShowSuccess(false)
        navigate('/stock-adjustments')
      }, 2000)
      
    } catch (error) {
      console.error('Error creating adjustment:', error)
      alert('Failed to create adjustment. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        
        {/* Header with Back Button */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/stock-adjustments')}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-all duration-200 text-slate-600 hover:text-slate-900 text-sm font-medium"
          >
            <ArrowLeft size={18} />
            Back
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <RefreshCw className="w-7 h-7 text-indigo-600" />
              New Stock Adjustment
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Adjust product inventory levels
            </p>
          </div>
        </div>

        {/* Success Message */}
        {showSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            <div>
              <p className="font-medium text-green-800">Stock adjustment created successfully!</p>
              <p className="text-sm text-green-600">Redirecting to adjustments list...</p>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Product Selection */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <Package size={16} className="text-indigo-500" />
                  Product <span className="text-red-500">*</span>
                </label>
                {isLoading ? (
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                    <Loader size={16} className="text-indigo-600 animate-spin" />
                    <span className="text-sm text-slate-500">Loading products...</span>
                  </div>
                ) : (
                  <select
                    name="productId"
                    value={formData.productId}
                    onChange={handleChange}
                    className={`w-full px-4 py-2.5 bg-slate-50 border ${errors.productId ? 'border-red-500' : 'border-slate-200'} rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition text-sm`}
                  >
                    <option value="">Select a product...</option>
                    {products.map(product => (
                      <option key={product.id} value={product.id}>
                        {product.name} (Stock: {product.stock})
                      </option>
                    ))}
                  </select>
                )}
                {errors.productId && (
                  <p className="text-red-500 text-xs flex items-center gap-1 mt-1">
                    <X size={12} />
                    {errors.productId}
                  </p>
                )}
                {selectedProduct && (
                  <p className="text-xs text-slate-400 mt-1">
                    Current stock: <span className="font-medium text-slate-600">{selectedProduct.stock}</span>
                    {selectedProduct.price && ` • Price: Rs. ${selectedProduct.price.toFixed(2)}`}
                  </p>
                )}
              </div>

              {/* Adjustment Type */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <RefreshCw size={16} className="text-indigo-500" />
                  Adjustment Type <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, type: 'INCREASE' }))}
                    className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 transition-all duration-200 text-sm font-medium ${
                      formData.type === 'INCREASE'
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <TrendingUp size={16} />
                    Increase
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, type: 'DECREASE' }))}
                    className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 transition-all duration-200 text-sm font-medium ${
                      formData.type === 'DECREASE'
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <TrendingDown size={16} />
                    Decrease
                  </button>
                </div>
              </div>

              {/* Quantity */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <Package size={16} className="text-indigo-500" />
                  Quantity <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleChange}
                  placeholder="Enter quantity"
                  min="1"
                  className={`w-full px-4 py-2.5 bg-slate-50 border ${errors.quantity ? 'border-red-500' : 'border-slate-200'} rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition text-sm`}
                />
                {errors.quantity && (
                  <p className="text-red-500 text-xs flex items-center gap-1 mt-1">
                    <X size={12} />
                    {errors.quantity}
                  </p>
                )}
                {formData.type === 'DECREASE' && selectedProduct && (
                  <p className="text-xs text-amber-600 flex items-center gap-1 mt-1">
                    <AlertCircle size={12} />
                    Current stock: {selectedProduct.stock}
                  </p>
                )}
              </div>

              {/* Reason */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <FileText size={16} className="text-indigo-500" />
                  Reason
                </label>
                <input
                  type="text"
                  name="reason"
                  value={formData.reason}
                  onChange={handleChange}
                  placeholder="Enter reason for adjustment (e.g., Damaged, Returned, Stock Count)"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition text-sm"
                />
                <p className="text-xs text-slate-400 mt-1">
                  Optional: Provide a reason for this stock adjustment
                </p>
              </div>

            </div>

            {/* Summary */}
            {selectedProduct && formData.quantity && (
              <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-sm font-medium text-slate-700 mb-2">Summary</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-slate-500">Product:</span>
                  <span className="font-medium text-slate-800">{selectedProduct.name}</span>
                  <span className="text-slate-500">Type:</span>
                  <span className={`font-medium ${formData.type === 'INCREASE' ? 'text-green-600' : 'text-red-600'}`}>
                    {formData.type}
                  </span>
                  <span className="text-slate-500">Quantity:</span>
                  <span className={`font-bold ${formData.type === 'INCREASE' ? 'text-green-600' : 'text-red-600'}`}>
                    {formData.type === 'INCREASE' ? '+' : '-'}{formData.quantity}
                  </span>
                  <span className="text-slate-500">New Stock:</span>
                  <span className="font-bold text-slate-800">
                    {formData.type === 'INCREASE' 
                      ? selectedProduct.stock + Number(formData.quantity)
                      : selectedProduct.stock - Number(formData.quantity)
                    }
                  </span>
                </div>
              </div>
            )}

            {/* Form Actions */}
            <div className="flex flex-col sm:flex-row gap-3 mt-8 pt-6 border-t border-slate-200">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl transition-all duration-200 font-medium text-sm shadow-sm hover:shadow-md flex-1 sm:flex-none"
              >
                <Save size={18} />
                {isSubmitting ? 'Creating...' : 'Create Adjustment'}
              </button>
              
              <button
                type="button"
                onClick={() => navigate('/stock-adjustments')}
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

export default AddStockAdjustment