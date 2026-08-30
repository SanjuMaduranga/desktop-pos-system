import { useEffect, useState, useMemo } from 'react'
import MainLayout from '../layouts/MainLayout'
import { 
  Package, TrendingUp, TrendingDown, AlertCircle, 
  Download, Printer, Search, Filter, X, Loader,
  ChevronLeft, ChevronRight, FileText, DollarSign,
  BarChart3, PieChart as PieChartIcon, Layers, 
  Truck, ShoppingBag, Clock
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  Legend, ResponsiveContainer, PieChart, Pie, Cell,
  LineChart, Line
} from 'recharts'

function InventoryReports() {
  const [inventoryData, setInventoryData] = useState([])
  const [categories, setCategories] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sortBy, setSortBy] = useState('name') // name, stock, price, category
  const [sortOrder, setSortOrder] = useState('asc')

  useEffect(() => {
    loadInventoryData()
  }, [])

  async function loadInventoryData() {
    try {
      setIsLoading(true)
      const [productsData, categoriesData] = await Promise.all([
        window.electronAPI.getProducts(),
        window.electronAPI.getCategories()
      ])
      setInventoryData(productsData || [])
      setCategories(categoriesData || [])
    } catch (error) {
      console.error('Error loading inventory data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Calculate statistics
  const stats = useMemo(() => {
    if (!inventoryData.length) return {
      totalProducts: 0,
      totalStock: 0,
      totalValue: 0,
      lowStockItems: 0,
      outOfStockItems: 0,
      categoriesCount: 0,
      averagePrice: 0
    }

    const totalStock = inventoryData.reduce((sum, p) => sum + p.stock, 0)
    const totalValue = inventoryData.reduce((sum, p) => sum + (p.price * p.stock), 0)
    const lowStockItems = inventoryData.filter(p => p.stock > 0 && p.stock <= 5).length
    const outOfStockItems = inventoryData.filter(p => p.stock === 0).length
    const averagePrice = inventoryData.length > 0 
      ? inventoryData.reduce((sum, p) => sum + p.price, 0) / inventoryData.length 
      : 0

    return {
      totalProducts: inventoryData.length,
      totalStock,
      totalValue,
      lowStockItems,
      outOfStockItems,
      categoriesCount: categories.length,
      averagePrice
    }
  }, [inventoryData, categories])

  // Filter and sort data
  const filteredData = useMemo(() => {
    let data = [...inventoryData]

    // Filter by search
    if (searchTerm) {
      data = data.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.barcode?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      data = data.filter(p => p.categoryId === Number(selectedCategory))
    }

    // Sort
    data.sort((a, b) => {
      let aVal, bVal
      switch (sortBy) {
        case 'name':
          aVal = a.name
          bVal = b.name
          break
        case 'stock':
          aVal = a.stock
          bVal = b.stock
          break
        case 'price':
          aVal = a.price
          bVal = b.price
          break
        case 'category':
          aVal = a.category?.name || ''
          bVal = b.category?.name || ''
          break
        default:
          aVal = a.name
          bVal = b.name
      }

      if (typeof aVal === 'string') {
        return sortOrder === 'asc' 
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal)
      } else {
        return sortOrder === 'asc' ? aVal - bVal : bVal - aVal
      }
    })

    return data
  }, [inventoryData, searchTerm, selectedCategory, sortBy, sortOrder])

  // Category distribution for pie chart
  const categoryData = useMemo(() => {
    const categoryMap = {}
    inventoryData.forEach(product => {
      const catName = product.category?.name || 'Uncategorized'
      if (!categoryMap[catName]) {
        categoryMap[catName] = { name: catName, value: 0, count: 0 }
      }
      categoryMap[catName].value += product.stock
      categoryMap[catName].count += 1
    })
    return Object.values(categoryMap)
      .sort((a, b) => b.value - a.value)
      .slice(0, 10)
  }, [inventoryData])

  // Stock status distribution
  const stockStatusData = useMemo(() => {
    const outOfStock = inventoryData.filter(p => p.stock === 0).length
    const lowStock = inventoryData.filter(p => p.stock > 0 && p.stock <= 5).length
    const inStock = inventoryData.filter(p => p.stock > 5).length
    
    return [
      { name: 'Out of Stock', value: outOfStock, color: '#ef4444' },
      { name: 'Low Stock (≤5)', value: lowStock, color: '#f59e0b' },
      { name: 'In Stock', value: inStock, color: '#10b981' }
    ]
  }, [inventoryData])

  const COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#818cf8', '#6d28d9', '#7c3aed']

  const handleExport = () => {
    const csvContent = [
      ['Name', 'Barcode', 'Category', 'Price', 'Stock', 'Total Value'],
      ...filteredData.map(p => [
        p.name,
        p.barcode || '',
        p.category?.name || 'Uncategorized',
        p.price,
        p.stock,
        (p.price * p.stock).toFixed(2)
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `inventory_report_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
  }

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <div className="flex flex-col items-center gap-4">
            <Loader size={40} className="text-indigo-600 animate-spin" />
            <p className="text-slate-500 font-medium">Loading inventory data...</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <Package className="w-7 h-7 text-indigo-600" />
              Inventory Reports
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Analyze your inventory status and trends
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-all duration-200 text-sm font-medium"
            >
              <Download size={18} />
              Export CSV
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">Total Products</p>
                <p className="text-2xl font-bold text-slate-800 mt-1">{stats.totalProducts}</p>
              </div>
              <div className="bg-blue-50 p-3 rounded-xl">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">Total Stock Value</p>
                <p className="text-2xl font-bold text-slate-800 mt-1">
                  Rs. {stats.totalValue.toFixed(2)}
                </p>
              </div>
              <div className="bg-green-50 p-3 rounded-xl">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">Low Stock Items</p>
                <p className="text-2xl font-bold text-amber-600 mt-1">{stats.lowStockItems}</p>
              </div>
              <div className="bg-amber-50 p-3 rounded-xl">
                <AlertCircle className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">Out of Stock</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{stats.outOfStockItems}</p>
              </div>
              <div className="bg-red-50 p-3 rounded-xl">
                <ShoppingBag className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <Layers size={16} className="text-slate-400" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">Sort:</span>
              <button
                onClick={() => toggleSort('name')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  sortBy === 'name'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
              </button>
              <button
                onClick={() => toggleSort('stock')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  sortBy === 'stock'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Stock {sortBy === 'stock' && (sortOrder === 'asc' ? '↑' : '↓')}
              </button>
              <button
                onClick={() => toggleSort('price')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  sortBy === 'price'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Price {sortBy === 'price' && (sortOrder === 'asc' ? '↑' : '↓')}
              </button>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Category Distribution */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2 mb-4">
              <PieChartIcon size={18} className="text-indigo-600" />
              Category Distribution
            </h2>
            <div className="h-[300px]">
              {categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => 
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => [`${value} units`, 'Stock']}
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        padding: '8px 12px'
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-slate-400">No category data available</p>
                </div>
              )}
            </div>
          </div>

          {/* Stock Status */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2 mb-4">
              <AlertCircle size={18} className="text-indigo-600" />
              Stock Status
            </h2>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stockStatusData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    formatter={(value) => [`${value} products`, 'Count']}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      padding: '8px 12px'
                    }}
                  />
                  <Bar 
                    dataKey="value" 
                    radius={[4, 4, 0, 0]}
                  >
                    {stockStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Inventory Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <FileText size={18} className="text-indigo-600" />
              Product Inventory
              <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                {filteredData.length} products
              </span>
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider hidden md:table-cell">Barcode</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider hidden sm:table-cell">Category</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Stock</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Value</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredData.slice(0, 10).map((product) => {
                  const totalValue = product.price * product.stock
                  let statusText = 'In Stock'
                  let statusColor = 'bg-green-100 text-green-700'
                  
                  if (product.stock === 0) {
                    statusText = 'Out of Stock'
                    statusColor = 'bg-red-100 text-red-700'
                  } else if (product.stock <= 5) {
                    statusText = 'Low Stock'
                    statusColor = 'bg-amber-100 text-amber-700'
                  }

                  return (
                    <tr key={product.id} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-3">
                        <span className="font-medium text-slate-800 text-sm">{product.name}</span>
                      </td>
                      <td className="px-6 py-3 hidden md:table-cell">
                        <span className="font-mono text-sm text-slate-500">{product.barcode || '-'}</span>
                      </td>
                      <td className="px-6 py-3 hidden sm:table-cell">
                        <span className="text-sm text-slate-600">{product.category?.name || '-'}</span>
                      </td>
                      <td className="px-6 py-3 text-right text-sm text-slate-600">
                        Rs. {product.price.toFixed(2)}
                      </td>
                      <td className="px-6 py-3 text-right">
                        <span className={`font-bold text-sm ${
                          product.stock <= 5 ? 'text-red-600' : 'text-slate-800'
                        }`}>
                          {product.stock}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right font-medium text-slate-800">
                        Rs. {totalValue.toFixed(2)}
                      </td>
                      <td className="px-6 py-3 text-center">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusColor}`}>
                          {statusText}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {filteredData.length > 10 && (
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 text-center text-sm text-slate-500">
              Showing 10 of {filteredData.length} products
            </div>
          )}
          {filteredData.length === 0 && (
            <div className="px-6 py-12 text-center">
              <Package className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-500 font-medium">No products found</p>
              <p className="text-sm text-slate-400">
                {searchTerm || selectedCategory !== 'all' 
                  ? 'Try adjusting your filters' 
                  : 'Add products to start tracking inventory'}
              </p>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  )
}

export default InventoryReports