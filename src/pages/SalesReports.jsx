import { useEffect, useState, useMemo } from 'react'
import MainLayout from '../layouts/MainLayout'
import { 
  TrendingUp, TrendingDown, DollarSign, Calendar, 
  Download, Printer, ShoppingBag, Users, 
  BarChart3, PieChart as PieChartIcon, Filter, X, Loader,
  ChevronLeft, ChevronRight, FileText, Package
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  Legend, ResponsiveContainer, PieChart, Pie, Cell,
  LineChart, Line, Area, AreaChart
} from 'recharts'

function SalesReports() {
  const [salesData, setSalesData] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [dateRange, setDateRange] = useState('month') // week, month, year, custom
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [selectedMetric, setSelectedMetric] = useState('revenue') // revenue, orders, items

  useEffect(() => {
    loadSalesData()
  }, [dateRange, startDate, endDate])

  async function loadSalesData() {
    try {
      setIsLoading(true)
      
      // Build query parameters
      let params = {}
      if (dateRange === 'week') {
        const today = new Date()
        const weekAgo = new Date(today)
        weekAgo.setDate(today.getDate() - 7)
        params.startDate = weekAgo.toISOString()
        params.endDate = today.toISOString()
      } else if (dateRange === 'month') {
        const today = new Date()
        const monthAgo = new Date(today)
        monthAgo.setMonth(today.getMonth() - 1)
        params.startDate = monthAgo.toISOString()
        params.endDate = today.toISOString()
      } else if (dateRange === 'year') {
        const today = new Date()
        const yearAgo = new Date(today)
        yearAgo.setFullYear(today.getFullYear() - 1)
        params.startDate = yearAgo.toISOString()
        params.endDate = today.toISOString()
      } else if (dateRange === 'custom' && startDate && endDate) {
        params.startDate = new Date(startDate).toISOString()
        params.endDate = new Date(endDate).toISOString()
      }

      const data = await window.electronAPI.getSalesReport(params)
      setSalesData(data || [])
    } catch (error) {
      console.error('Error loading sales data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Calculate statistics
  const stats = useMemo(() => {
    if (!salesData.length) return {
      totalRevenue: 0,
      totalOrders: 0,
      totalItems: 0,
      averageOrderValue: 0,
      revenueChange: 0,
      ordersChange: 0
    }

    const totalRevenue = salesData.reduce((sum, sale) => sum + sale.total, 0)
    const totalOrders = salesData.length
    const totalItems = salesData.reduce((sum, sale) => {
      return sum + (sale.items?.reduce((s, item) => s + item.quantity, 0) || 0)
    }, 0)
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

    // Calculate daily revenue for change
    const today = new Date()
    const todayStr = today.toDateString()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toDateString()

    const todayRevenue = salesData
      .filter(s => new Date(s.createdAt).toDateString() === todayStr)
      .reduce((sum, s) => sum + s.total, 0)
    
    const yesterdayRevenue = salesData
      .filter(s => new Date(s.createdAt).toDateString() === yesterdayStr)
      .reduce((sum, s) => sum + s.total, 0)

    const revenueChange = yesterdayRevenue > 0 
      ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100 
      : 0

    return {
      totalRevenue,
      totalOrders,
      totalItems,
      averageOrderValue,
      revenueChange,
      ordersChange: 0
    }
  }, [salesData])

  // Prepare chart data
  const chartData = useMemo(() => {
    const dailyData = {}
    
    salesData.forEach(sale => {
      const date = new Date(sale.createdAt).toLocaleDateString()
      if (!dailyData[date]) {
        dailyData[date] = {
          date,
          revenue: 0,
          orders: 0,
          items: 0
        }
      }
      dailyData[date].revenue += sale.total
      dailyData[date].orders += 1
      dailyData[date].items += sale.items?.reduce((s, i) => s + i.quantity, 0) || 0
    })

    return Object.values(dailyData).sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    )
  }, [salesData])

  // Payment method distribution
  const paymentData = useMemo(() => {
    const paymentMap = {}
    salesData.forEach(sale => {
      const method = sale.paymentMethod || 'Unknown'
      if (!paymentMap[method]) {
        paymentMap[method] = { name: method, value: 0, count: 0 }
      }
      paymentMap[method].value += sale.total
      paymentMap[method].count += 1
    })
    return Object.values(paymentMap)
  }, [salesData])

  const COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#818cf8']

  const handleExport = () => {
    // Export functionality
    const csvContent = [
      ['Date', 'Invoice', 'Total', 'Payment Method', 'Items'],
      ...salesData.map(sale => [
        new Date(sale.createdAt).toLocaleDateString(),
        sale.invoiceNo,
        sale.total,
        sale.paymentMethod,
        sale.items?.reduce((s, i) => s + i.quantity, 0) || 0
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sales_report_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <div className="flex flex-col items-center gap-4">
            <Loader size={40} className="text-indigo-600 animate-spin" />
            <p className="text-slate-500 font-medium">Loading sales data...</p>
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
              <BarChart3 className="w-7 h-7 text-indigo-600" />
              Sales Reports
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Analyze your sales performance
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

        {/* Date Range Filter */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-slate-400" />
              <span className="text-sm font-medium text-slate-700">Date Range:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {['week', 'month', 'year'].map((range) => (
                <button
                  key={range}
                  onClick={() => {
                    setDateRange(range)
                    setShowDatePicker(false)
                  }}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
                    dateRange === range
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {range.charAt(0).toUpperCase() + range.slice(1)}
                </button>
              ))}
              <button
                onClick={() => {
                  setDateRange('custom')
                  setShowDatePicker(!showDatePicker)
                }}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
                  dateRange === 'custom'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Custom
              </button>
            </div>
            {dateRange === 'custom' && showDatePicker && (
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <span className="text-slate-400">to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  onClick={loadSalesData}
                  className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
                >
                  Apply
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">Total Revenue</p>
                <p className="text-2xl font-bold text-slate-800 mt-1">
                  Rs. {stats.totalRevenue.toFixed(2)}
                </p>
              </div>
              <div className="bg-green-50 p-3 rounded-xl">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${stats.revenueChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {stats.revenueChange >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {Math.abs(stats.revenueChange).toFixed(1)}% from yesterday
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">Total Orders</p>
                <p className="text-2xl font-bold text-slate-800 mt-1">{stats.totalOrders}</p>
              </div>
              <div className="bg-blue-50 p-3 rounded-xl">
                <ShoppingBag className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">Total Items Sold</p>
                <p className="text-2xl font-bold text-slate-800 mt-1">{stats.totalItems}</p>
              </div>
              <div className="bg-purple-50 p-3 rounded-xl">
                <Package className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">Average Order Value</p>
                <p className="text-2xl font-bold text-slate-800 mt-1">
                  Rs. {stats.averageOrderValue.toFixed(2)}
                </p>
              </div>
              <div className="bg-orange-50 p-3 rounded-xl">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Revenue/Orders Chart */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <BarChart3 size={18} className="text-indigo-600" />
                Sales Overview
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedMetric('revenue')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                    selectedMetric === 'revenue'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Revenue
                </button>
                <button
                  onClick={() => setSelectedMetric('orders')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                    selectedMetric === 'orders'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Orders
                </button>
              </div>
            </div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} />
                  <YAxis 
                    tick={{ fontSize: 11 }} 
                    tickLine={false}
                    tickFormatter={(value) => selectedMetric === 'revenue' ? `Rs.${value}` : value}
                  />
                  <Tooltip 
                    formatter={(value) => selectedMetric === 'revenue' ? [`Rs. ${value}`, 'Revenue'] : [value, 'Orders']}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      padding: '8px 12px'
                    }}
                  />
                  <Bar 
                    dataKey={selectedMetric === 'revenue' ? 'revenue' : 'orders'} 
                    fill="#6366f1" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Payment Methods Pie Chart */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2 mb-4">
              <PieChartIcon size={18} className="text-indigo-600" />
              Payment Methods
            </h2>
            <div className="h-[300px]">
              {paymentData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={paymentData}
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
                      {paymentData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => [`Rs. ${value.toFixed(2)}`, 'Amount']}
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
                  <p className="text-slate-400">No payment data available</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sales Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <FileText size={18} className="text-indigo-600" />
              Recent Transactions
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Invoice</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Payment</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {salesData.slice(0, 10).map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-3 font-mono text-sm text-indigo-600">
                      {sale.invoiceNo}
                    </td>
                    <td className="px-6 py-3 text-sm text-slate-600">
                      {new Date(sale.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                        sale.paymentMethod === 'CASH' 
                          ? 'bg-green-100 text-green-700'
                          : sale.paymentMethod === 'CARD'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-purple-100 text-purple-700'
                      }`}>
                        {sale.paymentMethod || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right font-bold text-slate-800">
                      Rs. {sale.total.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {salesData.length > 10 && (
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 text-center text-sm text-slate-500">
              Showing 10 of {salesData.length} transactions
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  )
}

export default SalesReports