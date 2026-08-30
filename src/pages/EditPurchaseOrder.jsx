import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'
import { 
  ArrowLeft, Save, Package, Truck, Plus, Minus, 
  X, CheckCircle, Loader, Trash2, FileText,
  DollarSign, AlertCircle
} from 'lucide-react'

function EditPurchaseOrder() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [suppliers, setSuppliers] = useState([])
  const [products, setProducts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    supplierId: '',
    notes: '',
    items: []
  })
  const [errors, setErrors] = useState({})
  const [selectedProduct, setSelectedProduct] = useState('')
  const [itemQuantity, setItemQuantity] = useState(1)
  const [itemCostPrice, setItemCostPrice] = useState('')

  useEffect(() => {
    loadData()
  }, [id])

  async function loadData() {
    try {
      setIsLoading(true)
      const [orderData, suppliersData, productsData] = await Promise.all([
        window.electronAPI.getPurchaseOrderById(Number(id)),
        window.electronAPI.getSuppliers(),
        window.electronAPI.getProducts()
      ])

      setSuppliers(suppliersData || [])
      setProducts(productsData || [])

      if (orderData) {
        setFormData({
          supplierId: orderData.supplierId?.toString() || '',
          notes: orderData.notes || '',
          items: orderData.items?.map(item => ({
            productId: item.productId,
            productName: item.product?.name || 'Unknown Product',
            quantity: item.quantity,
            costPrice: item.costPrice,
            subtotal: item.subtotal
          })) || []
        })
      }
    } catch (error) {
      console.error('Error loading data:', error)
      alert('Failed to load purchase order data')
    } finally {
      setIsLoading(false)
    }
  }

  function addItemToOrder() {
    if (!selectedProduct) {
      alert('Please select a product')
      return
    }

    if (!itemQuantity || itemQuantity <= 0) {
      alert('Please enter a valid quantity')
      return
    }

    if (!itemCostPrice || itemCostPrice <= 0) {
      alert('Please enter a valid cost price')
      return
    }

    const product = products.find(p => p.id === Number(selectedProduct))
    if (!product) return

    // Check if product already in order
    const existingItem = formData.items.find(item => item.productId === Number(selectedProduct))
    if (existingItem) {
      alert('Product already added to order. Please update quantity in the list.')
      return
    }

    const newItem = {
      productId: product.id,
      productName: product.name,
      quantity: Number(itemQuantity),
      costPrice: Number(itemCostPrice),
      subtotal: Number(itemQuantity) * Number(itemCostPrice)
    }

    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }))

    // Reset fields
    setSelectedProduct('')
    setItemQuantity(1)
    setItemCostPrice('')
  }

  function removeItem(index) {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }))
  }

  function updateItemQuantity(index, newQuantity) {
    if (newQuantity <= 0) return
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => {
        if (i === index) {
          return {
            ...item,
            quantity: Number(newQuantity),
            subtotal: Number(newQuantity) * item.costPrice
          }
        }
        return item
      })
    }))
  }

  function updateItemCostPrice(index, newCostPrice) {
    if (newCostPrice <= 0) return
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => {
        if (i === index) {
          return {
            ...item,
            costPrice: Number(newCostPrice),
            subtotal: item.quantity * Number(newCostPrice)
          }
        }
        return item
      })
    }))
  }

  function calculateTotal() {
    return formData.items.reduce((sum, item) => sum + item.subtotal, 0)
  }

  function validateForm() {
    const newErrors = {}
    
    if (!formData.supplierId) {
      newErrors.supplierId = 'Please select a supplier'
    }
    
    if (formData.items.length === 0) {
      newErrors.items = 'Please add at least one product'
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
      const orderData = {
        id: Number(id),
        supplierId: Number(formData.supplierId),
        items: formData.items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          costPrice: item.costPrice
        })),
        notes: formData.notes
      }

      await window.electronAPI.updatePurchaseOrder(orderData)
      navigate('/purchase-orders')
      
    } catch (error) {
      console.error('Error updating purchase order:', error)
      alert('Failed to update purchase order. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const total = calculateTotal()

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <div className="flex flex-col items-center gap-4">
            <Loader size={40} className="text-indigo-600 animate-spin" />
            <p className="text-slate-500 font-medium">Loading purchase order...</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        
        {/* Header with Back Button */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/purchase-orders')}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-all duration-200 text-slate-600 hover:text-slate-900 text-sm font-medium"
          >
            <ArrowLeft size={18} />
            Back
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <FileText className="w-7 h-7 text-indigo-600" />
              Edit Purchase Order
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Update purchase order details
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Supplier Selection */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <Truck size={16} className="text-indigo-500" />
                  Supplier <span className="text-red-500">*</span>
                </label>
                <select
                  name="supplierId"
                  value={formData.supplierId}
                  onChange={(e) => setFormData(prev => ({ ...prev, supplierId: e.target.value }))}
                  className={`w-full px-4 py-2.5 bg-slate-50 border ${errors.supplierId ? 'border-red-500' : 'border-slate-200'} rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition text-sm`}
                >
                  <option value="">Select a supplier...</option>
                  {suppliers.map(supplier => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name} {supplier.companyName ? `(${supplier.companyName})` : ''}
                    </option>
                  ))}
                </select>
                {errors.supplierId && (
                  <p className="text-red-500 text-xs flex items-center gap-1 mt-1">
                    <X size={12} />
                    {errors.supplierId}
                  </p>
                )}
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <FileText size={16} className="text-indigo-500" />
                  Notes
                </label>
                <input
                  type="text"
                  name="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional notes for this order"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition text-sm"
                />
              </div>
            </div>

            {/* Items Section */}
            <div className="mt-6 pt-6 border-t border-slate-200">
              <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2 mb-4">
                <Package size={18} className="text-indigo-600" />
                Order Items
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                  {formData.items.length}
                </span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
                <div className="md:col-span-1">
                  <label className="block text-xs font-medium text-slate-700 mb-1">Product</label>
                  <select
                    value={selectedProduct}
                    onChange={(e) => setSelectedProduct(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  >
                    <option value="">Select...</option>
                    {products.map(product => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Quantity</label>
                  <input
                    type="number"
                    value={itemQuantity}
                    onChange={(e) => setItemQuantity(Number(e.target.value))}
                    min="1"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Cost Price (Rs.)</label>
                  <input
                    type="number"
                    value={itemCostPrice}
                    onChange={(e) => setItemCostPrice(e.target.value)}
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={addItemToOrder}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition text-sm font-medium"
                  >
                    <Plus size={16} />
                    Add Item
                  </button>
                </div>
              </div>

              {errors.items && (
                <p className="text-red-500 text-xs flex items-center gap-1 mt-1 mb-3">
                  <X size={12} />
                  {errors.items}
                </p>
              )}

              {/* Items List */}
              {formData.items.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Product</th>
                        <th className="px-4 py-2.5 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">Quantity</th>
                        <th className="px-4 py-2.5 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Cost Price</th>
                        <th className="px-4 py-2.5 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Subtotal</th>
                        <th className="px-4 py-2.5 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {formData.items.map((item, index) => (
                        <tr key={index} className="hover:bg-slate-50 transition">
                          <td className="px-4 py-2.5 text-sm font-medium text-slate-800">
                            {item.productName}
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateItemQuantity(index, Number(e.target.value))}
                              min="1"
                              className="w-16 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-center"
                            />
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            <input
                              type="number"
                              value={item.costPrice}
                              onChange={(e) => updateItemCostPrice(index, Number(e.target.value))}
                              min="0"
                              step="0.01"
                              className="w-24 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-right"
                            />
                          </td>
                          <td className="px-4 py-2.5 text-right font-medium text-slate-800">
                            Rs. {item.subtotal.toFixed(2)}
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            <button
                              type="button"
                              onClick={() => removeItem(index)}
                              className="p-1 text-red-500 hover:text-red-700 transition"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-50 border-t border-slate-200">
                        <td colSpan="3" className="px-4 py-3 text-right font-bold text-slate-800">
                          Total:
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-indigo-600">
                          Rs. {total.toFixed(2)}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 bg-slate-50 rounded-xl border border-slate-200">
                  <Package className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-500 font-medium">No items added yet</p>
                  <p className="text-sm text-slate-400">Select a product and add it to the order</p>
                </div>
              )}
            </div>

            {/* Form Actions */}
            <div className="flex flex-col sm:flex-row gap-3 mt-8 pt-6 border-t border-slate-200">
              <button
                type="submit"
                disabled={isSubmitting || formData.items.length === 0}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl transition-all duration-200 font-medium text-sm shadow-sm hover:shadow-md flex-1 sm:flex-none"
              >
                <Save size={18} />
                {isSubmitting ? 'Updating...' : 'Update Purchase Order'}
              </button>
              
              <button
                type="button"
                onClick={() => navigate('/purchase-orders')}
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

export default EditPurchaseOrder