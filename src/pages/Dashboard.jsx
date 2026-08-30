import { useEffect, useState, useCallback, useMemo } from 'react'
import { 
  XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, 
  CartesianGrid, AreaChart, Area
} from 'recharts'
import { 
  TrendingUp, Package, AlertCircle, 
  DollarSign, ShoppingBag, Calendar, 
  ArrowUp, ArrowDown, Loader, RefreshCw,
  CheckCircle
} from 'lucide-react'
import MainLayout from '../layouts/MainLayout'

// Custom tooltip component - moved outside render
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3 min-w-37.5">
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <p className="text-sm font-bold text-indigo-600">
          Rs. {payload[0].value?.toFixed(2) || 0}
        </p>
        {data.orders !== undefined && (
          <p className="text-xs text-slate-400 mt-1">
            {data.orders} {data.orders === 1 ? 'order' : 'orders'}
          </p>
        )}
      </div>
    )
  }
  return null
}

function Dashboard() {
  const [stats, setStats] = useState(null)
  const [lowStock, setLowStock] = useState([])
  const [chartData, setChartData] = useState([])
  const [categoryData, setCategoryData] = useState([])
  const [recentSales, setRecentSales] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentDate] = useState(new Date())

  // Define loadDashboardData with useCallback before useEffect
  const loadDashboardData = useCallback(async () => {
    try {
      setIsLoading(true)
      
      const [statsData, lowStockData, salesChart, categoryStats, recentSalesData] = await Promise.all([
        window.electronAPI.getDashboardStats(),
        window.electronAPI.getLowStockProducts(),
        window.electronAPI.getSalesChart(),
        window.electronAPI.getCategoryStats(),
        window.electronAPI.getRecentSales(5)
      ])

      setStats(statsData)
      setLowStock(lowStockData || [])
      setChartData(salesChart || [])
      setCategoryData(categoryStats || [])
      setRecentSales(recentSalesData || [])
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadDashboardData()
  }, [loadDashboardData])

  // Refresh data
  const refreshData = () => {
    loadDashboardData()
  }

  // Calculate percentage changes using useMemo for purity
  const comparison = useMemo(() => {
    const calculateChange = (current, previous) => {
      if (!previous || previous === 0) return 0
      return ((current - previous) / previous) * 100
    }

    // Get today's and yesterday's dates from the currentDate state
    const today = new Date(currentDate)
    today.setHours(0, 0, 0, 0)
    const todayStr = today.toDateString()

    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toDateString()
    
    const todaySales = recentSales.filter(s => {
      const saleDate = new Date(s.createdAt)
      saleDate.setHours(0, 0, 0, 0)
      return saleDate.toDateString() === todayStr
    })
    
    const yesterdaySales = recentSales.filter(s => {
      const saleDate = new Date(s.createdAt)
      saleDate.setHours(0, 0, 0, 0)
      return saleDate.toDateString() === yesterdayStr
    })
    
    const todayRevenue = todaySales.reduce((sum, s) => sum + s.total, 0)
    const yesterdayRevenue = yesterdaySales.reduce((sum, s) => sum + s.total, 0)
    
    return {
      salesChange: calculateChange(todaySales.length, yesterdaySales.length),
      revenueChange: calculateChange(todayRevenue, yesterdayRevenue)
    }
  }, [recentSales, currentDate])

  // Memoize cards data to prevent unnecessary recalculations
  const cards = useMemo(() => [
    {
      title: "Today's Sales",
      value: stats?.todaySalesCount || 0,
      icon: ShoppingBag,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      change: comparison.salesChange,
      suffix: 'orders'
    },
    {
      title: "Today's Revenue",
      value: `Rs. ${(stats?.todayRevenue || 0).toFixed(2)}`,
      icon: DollarSign,
      color: 'text-green-600',
      bg: 'bg-green-50',
      change: comparison.revenueChange,
      suffix: ''
    },
    {
      title: 'Total Products',
      value: stats?.totalProducts || 0,
      icon: Package,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      suffix: 'items'
    },
    {
      title: 'Low Stock Items',
      value: stats?.lowStockProducts || 0,
      icon: AlertCircle,
      color: 'text-red-600',
      bg: 'bg-red-50',
      warning: (stats?.lowStockProducts || 0) > 0,
      suffix: 'items'
    },
  ], [stats, comparison])

  if (isLoading || !stats) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <div className="flex flex-col items-center gap-4">
            <Loader size={40} className="text-indigo-600 animate-spin" />
            <p className="text-slate-500 font-medium">Loading dashboard...</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  // Colors for pie chart
  const COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#818cf8', '#4f46e5']

  return (
    <MainLayout>
      <div className="space-y-6">
        
        {/* Header with Refresh Button */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <TrendingUp className="w-7 h-7 text-indigo-600" />
              Dashboard
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Overview of your business performance
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={refreshData}
              className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition text-sm font-medium text-slate-600"
            >
              <RefreshCw size={16} className="text-slate-400" />
              Refresh
            </button>
            <div className="flex items-center gap-2 text-sm text-slate-500 bg-white px-4 py-2 rounded-xl border border-slate-200">
              <Calendar size={14} />
              {currentDate.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((card, index) => {
            const Icon = card.icon
            const change = card.change !== undefined ? card.change : 0
            const showChange = card.change !== undefined && card.title !== 'Total Products' && card.title !== 'Low Stock Items'
            
            return (
              <div
                key={index}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all duration-200 group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                      {card.title}
                    </p>
                    <p className="text-2xl font-bold text-slate-800 mt-1 truncate">
                      {card.value}
                    </p>
                    {card.suffix && (
                      <p className="text-xs text-slate-400 mt-0.5">{card.suffix}</p>
                    )}
                    {showChange && (
                      <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${
                        change >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {change >= 0 ? (
                          <ArrowUp size={12} />
                        ) : (
                          <ArrowDown size={12} />
                        )}
                        {Math.abs(change).toFixed(1)}% from yesterday
                      </div>
                    )}
                    {card.warning && (
                      <div className="mt-1 text-xs text-red-500 font-medium flex items-center gap-1">
                        <AlertCircle size={12} />
                        Needs attention
                      </div>
                    )}
                  </div>
                  <div className={`${card.bg} p-3 rounded-xl shrink-0 ml-3 group-hover:scale-110 transition-transform duration-200`}>
                    <Icon className={`w-5 h-5 ${card.color}`} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Sales Chart - Takes 2/3 of the space */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  <TrendingUp size={18} className="text-indigo-600" />
                  Sales Overview
                </h2>
                <span className="text-xs text-slate-400">Last 30 days</span>
              </div>
              <div className="h-80">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 11, fill: '#94a3b8' }}
                        tickLine={false}
                        axisLine={{ stroke: '#e2e8f0' }}
                      />
                      <YAxis 
                        tick={{ fontSize: 11, fill: '#94a3b8' }}
                        tickLine={false}
                        axisLine={{ stroke: '#e2e8f0' }}
                        tickFormatter={(value) => `Rs.${value}`}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="total"
                        stroke="#6366f1"
                        strokeWidth={2}
                        fill="url(#colorRevenue)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-slate-400">No sales data available</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Category Distribution - Takes 1/3 of the space */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 h-full">
              <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2 mb-4">
                <Package size={18} className="text-indigo-600" />
                Category Distribution
              </h2>
              <div className="h-80">
                {categoryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="45%"
                        labelLine={false}
                        outerRadius={90}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ percent }) => 
                          `${(percent * 100).toFixed(0)}%`
                        }
                      >
                        {categoryData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={COLORS[index % COLORS.length]} 
                          />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value, name) => [`${value} products`, `${name}`]}
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          padding: '8px 12px'
                        }}
                      />
                      <Legend 
                        verticalAlign="bottom" 
                        align="center"
                        wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-slate-400">No category data</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Low Stock Alerts */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <AlertCircle size={18} className="text-red-500" />
                Low Stock Alerts
              </h2>
              {lowStock.length > 0 && (
                <span className="text-xs bg-red-50 text-red-600 px-2.5 py-1 rounded-full font-medium">
                  {lowStock.length} items
                </span>
              )}
            </div>
            {lowStock.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10">
                <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mb-3">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
                <p className="text-slate-500 font-medium">All products are well stocked</p>
                <p className="text-sm text-slate-400">No low stock alerts</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {lowStock.slice(0, 5).map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-3 bg-red-50 rounded-xl hover:bg-red-100 transition group"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-800 text-sm truncate">
                        {product.name}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {product.category?.name || 'Uncategorized'}
                      </p>
                    </div>
                    <div className="text-right ml-3 shrink-0">
                      <span className="text-red-600 font-bold text-sm">
                        {product.stock} left
                      </span>
                      <p className="text-xs text-slate-400">
                        Min: {product.minStock || 5}
                      </p>
                    </div>
                  </div>
                ))}
                {lowStock.length > 5 && (
                  <p className="text-center text-sm text-slate-500 pt-2">
                    +{lowStock.length - 5} more items
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Recent Sales */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <ShoppingBag size={18} className="text-indigo-600" />
                Recent Sales
              </h2>
              <span className="text-xs text-slate-400">Latest transactions</span>
            </div>
            {recentSales.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10">
                <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-3">
                  <ShoppingBag className="w-8 h-8 text-slate-300" />
                </div>
                <p className="text-slate-500 font-medium">No recent sales</p>
                <p className="text-sm text-slate-400">Sales will appear here</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {recentSales.map((sale) => (
                  <div
                    key={sale.id}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition group"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-800 text-sm truncate">
                        {sale.invoiceNo}
                      </p>
                      <p className="text-xs text-slate-500">
                        {new Date(sale.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right ml-3 shrink-0">
                      <span className="font-bold text-indigo-600 text-sm">
                        Rs. {sale.total.toFixed(2)}
                      </span>
                      <p className="text-xs text-slate-400">
                        {sale.items?.length || 0} items
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  )
}

export default Dashboard