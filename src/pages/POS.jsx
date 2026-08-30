import { useEffect, useMemo, useState, useRef } from 'react'
import { useReactToPrint } from 'react-to-print'
import MainLayout from '../layouts/MainLayout'
import Receipt from '../components/Receipt'
import { 
  Search, ShoppingCart, Plus, Minus, Trash2, 
  Package, X, CheckCircle, Loader
} from 'lucide-react'

function POS() {
  const [products, setProducts] = useState([])
  const [cart, setCart] = useState([])
  const [search, setSearch] = useState('')
  const [cash, setCash] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('Cash')
  const [isLoading, setIsLoading] = useState(true)
  const [showSuccess, setShowSuccess] = useState(false)
  const [lastSale, setLastSale] = useState(null)
  const [isPrinting, setIsPrinting] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [settings, setSettings] = useState({
    taxRate: 5,
    taxName: 'VAT',
    currencySymbol: 'Rs.',
    currencyPosition: 'before',
    defaultPaymentMethod: 'Cash'
  })
  const printRef = useRef()
  const searchInputRef = useRef()

  useEffect(() => {
    loadProducts()
    loadSettings()
    // Focus search input on load
    setTimeout(() => {
      searchInputRef.current?.focus()
    }, 100)
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

  async function loadSettings() {
    try {
      const data = await window.electronAPI.getSettings()
      if (data) {
        setSettings({
          taxRate: data.taxRate ? Number(data.taxRate) : 5,
          taxName: data.taxName || 'VAT',
          currencySymbol: data.currencySymbol || 'Rs.',
          currencyPosition: data.currencyPosition || 'before',
          defaultPaymentMethod: data.defaultPaymentMethod || 'Cash'
        })
        // Set default payment method from settings
        if (data.defaultPaymentMethod) {
          setPaymentMethod(data.defaultPaymentMethod)
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    }
  }

  function addToCart(product) {
    setCart((prevCart) => {
      const existingItem = prevCart.find(
        (item) => item.id === product.id
      )
      const currentQty = existingItem ? existingItem.quantity : 0
      const availableStock = product.stock

      if (availableStock <= 0) {
        alert('Out of stock')
        return prevCart
      }

      if (currentQty + 1 > availableStock) {
        alert('Not enough stock available')
        return prevCart
      }

      if (existingItem) {
        return prevCart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }

      return [
        ...prevCart,
        { ...product, quantity: 1 },
      ]
    })
  }

  function increaseQty(id) {
    const product = products.find(p => p.id === id)
    const cartItem = cart.find(item => item.id === id)
    
    if (cartItem && product && cartItem.quantity + 1 > product.stock) {
      alert('Not enough stock available')
      return
    }

    setCart(cart.map((item) =>
      item.id === id
        ? { ...item, quantity: item.quantity + 1 }
        : item
    ))
  }

  function decreaseQty(id) {
    const updatedCart = cart
      .map((item) =>
        item.id === id
          ? { ...item, quantity: item.quantity - 1 }
          : item
      )
      .filter((item) => item.quantity > 0)
    setCart(updatedCart)
  }

  function removeItem(id) {
    const updatedCart = cart.filter((item) => item.id !== id)
    setCart(updatedCart)
  }

  function clearCart() {
    if (cart.length === 0) return
    if (confirm('Are you sure you want to clear the cart?')) {
      setCart([])
      setCash('')
    }
  }

  // Helper function to format currency
  function formatCurrency(amount) {
    const formatted = amount.toFixed(2)
    if (settings.currencyPosition === 'after') {
      return `${formatted} ${settings.currencySymbol}`
    }
    return `${settings.currencySymbol} ${formatted}`
  }

  const subtotal = useMemo(() => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0)
  }, [cart])

  const tax = useMemo(() => {
    return subtotal * (settings.taxRate / 100)
  }, [subtotal, settings.taxRate])

  const grandTotal = useMemo(() => {
    return subtotal + tax
  }, [subtotal, tax])

  const change = useMemo(() => {
    const paid = parseFloat(cash || 0)
    return paid - grandTotal
  }, [cash, grandTotal])

  // Setup react-to-print with proper callbacks
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    onBeforePrint: () => {
      setIsPrinting(true)
    },
    onAfterPrint: () => {
      // Reset printing state when print dialog is closed
      setIsPrinting(false)
      setIsProcessing(false)
      // Clear sale data after a short delay
      setTimeout(() => {
        setLastSale(null)
      }, 500)
    },
    onPrintError: (error) => {
      console.error('Print error:', error)
      setIsPrinting(false)
      setIsProcessing(false)
      setLastSale(null)
      alert('Failed to print receipt. Please try again.')
    }
  })

  async function handleCheckout() {
    if (cart.length === 0) {
      alert('Cart is empty')
      return
    }
    
    const paidAmount = parseFloat(cash)
    if (!paidAmount || paidAmount < grandTotal) {
      alert('Insufficient payment')
      return
    }
    
    // Prevent multiple submissions
    if (isProcessing || isPrinting) return
    
    setIsProcessing(true)
    
    try {
      const result = await window.electronAPI.checkout({
        cart,
        subtotal,
        tax,
        total: grandTotal,
        paymentMethod,
        paidAmount,
        change,
      })
      
      // Store the sale data for printing
      setLastSale(result)
      
      // Reset cart and payment
      setCart([])
      setCash('')
      setSearch('')
      
      // Reload products to update stock
      await loadProducts()
      
      // Show success notification
      setShowSuccess(true)
      
      // Print receipt after a short delay to ensure DOM is updated
      setTimeout(() => {
        handlePrint()
      }, 500)
      
      // Hide success notification after 5 seconds
      setTimeout(() => {
        setShowSuccess(false)
      }, 5000)
      
    } catch (error) {
      console.error(error)
      alert('Checkout failed: ' + (error.message || 'Unknown error'))
      setIsProcessing(false)
    }
  }

  function handleBarcode(e) {
    if (e.key === 'Enter') {
      const product = products.find((p) => p.barcode === search.trim())
      if (product) {
        addToCart(product)
        setSearch('')
        searchInputRef.current?.focus()
      } else {
        alert('Product not found')
      }
    }
  }

  const filteredProducts = products.filter((product) => {
    const value = search.toLowerCase()
    return (
      product.name.toLowerCase().includes(value) ||
      (product.barcode || '').toLowerCase().includes(value)
    )
  })

  return (
    <MainLayout>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
        
        {/* PRODUCTS SECTION - Takes 2/3 */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <Package className="w-7 h-7 text-indigo-600" />
              POS Billing
            </h1>
            <span className="text-xs text-slate-400 bg-slate-50 px-3 py-1 rounded-full">
              {products.length} products
            </span>
          </div>

          {/* Search Input */}
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search product or scan barcode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleBarcode}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition text-sm"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            )}
          </div>

          {/* Products Grid */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader size={32} className="text-indigo-600 animate-spin" />
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className={`border rounded-xl p-3 cursor-pointer transition-all duration-200 hover:shadow-md ${
                      product.stock <= 0 
                        ? 'bg-gray-50 border-gray-200 opacity-50 cursor-not-allowed' 
                        : 'hover:border-indigo-300 hover:bg-indigo-50'
                    }`}
                  >
                    <h3 className="font-semibold text-slate-800 text-sm truncate">
                      {product.name}
                    </h3>
                    <p className="text-indigo-600 font-bold text-base mt-1">
                      {formatCurrency(product.price)}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className={`text-xs ${product.stock <= 5 ? 'text-red-500' : 'text-slate-400'}`}>
                        Stock: {product.stock}
                      </span>
                      {product.stock <= 0 && (
                        <span className="text-xs text-red-500 font-medium">Out of Stock</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* CART SECTION - Takes 1/3 */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col h-[calc(100vh-12rem)] lg:h-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-indigo-600" />
              Cart
              <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full ml-1">
                {cart.length}
              </span>
            </h2>
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-xs text-red-500 hover:text-red-700 font-medium"
              >
                Clear All
              </button>
            )}
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto space-y-2">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-8">
                <ShoppingCart className="w-16 h-16 text-slate-200 mb-3" />
                <p className="text-slate-500 font-medium">Cart is empty</p>
                <p className="text-sm text-slate-400">Add products to start billing</p>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.id}
                  className="bg-slate-50 rounded-xl p-3 hover:bg-slate-100 transition"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-slate-800 text-sm truncate">
                        {item.name}
                      </h4>
                      <p className="text-indigo-600 font-semibold text-sm">
                        {formatCurrency(item.price)}
                      </p>
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-slate-400 hover:text-red-500 transition p-1"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => decreaseQty(item.id)}
                      className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-8 text-center font-medium text-slate-800">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => increaseQty(item.id)}
                      className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Totals */}
          <div className="border-t border-slate-200 pt-4 mt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Subtotal</span>
              <span className="text-slate-700 font-medium">
                {formatCurrency(subtotal)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">{settings.taxName} ({settings.taxRate}%)</span>
              <span className="text-slate-700 font-medium">
                {formatCurrency(tax)}
              </span>
            </div>
            <div className="flex justify-between text-lg font-bold pt-2 border-t border-slate-200">
              <span className="text-slate-800">Total</span>
              <span className="text-indigo-600">
                {formatCurrency(grandTotal)}
              </span>
            </div>

            {/* Payment Section */}
            <div className="space-y-3 mt-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                >
                  <option value="Cash">Cash</option>
                  <option value="Card">Card</option>
                  <option value="QR">QR Payment</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Cash Received
                </label>
                <input
                  type="number"
                  value={cash}
                  onChange={(e) => setCash(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  placeholder="Enter amount"
                  step="0.01"
                  min="0"
                />
              </div>

              <div className="flex justify-between text-sm font-medium">
                <span className="text-slate-500">Change</span>
                <span className={change >= 0 ? 'text-green-600' : 'text-red-500'}>
                  {change > 0 ? formatCurrency(change) : formatCurrency(0)}
                </span>
              </div>
            </div>

            {/* Checkout Button */}
            <button
              onClick={handleCheckout}
              disabled={cart.length === 0 || parseFloat(cash) < grandTotal || isProcessing || isPrinting}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white py-3 rounded-xl font-bold text-base transition-all duration-200 shadow-sm hover:shadow-md mt-4"
            >
              {isProcessing ? 'Processing...' : isPrinting ? 'Printing...' : 'Complete Sale'}
            </button>
          </div>
        </div>
      </div>

      {/* Success Notification */}
      {showSuccess && (
        <div className="fixed bottom-4 right-4 bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3 shadow-lg z-50 animate-in slide-in-from-right duration-300">
          <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
          <div>
            <p className="font-medium text-green-800">Sale completed!</p>
            <p className="text-sm text-green-600">
              {isPrinting ? 'Printing receipt...' : 'Receipt printed successfully'}
            </p>
          </div>
          <button onClick={() => {
            setShowSuccess(false)
            if (!isPrinting && !isProcessing) {
              setLastSale(null)
            }
          }} className="text-green-600 hover:text-green-800">
            <X size={18} />
          </button>
        </div>
      )}

      {/* Off-screen Receipt for Printing */}
      {lastSale && (
        <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
          <div ref={printRef}>
            <Receipt sale={lastSale} />
          </div>
        </div>
      )}
    </MainLayout>
  )
}

export default POS