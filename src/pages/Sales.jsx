import { useEffect, useState, useRef } from 'react'
import { useReactToPrint } from 'react-to-print'
import { 
  Receipt as ReceiptIcon, X, Printer, Eye, Search, 
  Calendar, DollarSign, ShoppingBag, User, CreditCard,
  ChevronLeft, ChevronRight, FileText, Loader
} from 'lucide-react'
import MainLayout from '../layouts/MainLayout'
import Receipt from '../components/Receipt'

function Sales() {
  const [sales, setSales] = useState([])
  const [selectedSale, setSelectedSale] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(5)
  const [isLoading, setIsLoading] = useState(true)
  const printRef = useRef()

  useEffect(() => {
    loadSales()
  }, [])

  async function loadSales() {
    try {
      setIsLoading(true)
      const data = await window.electronAPI.getSales()
      setSales(data || [])
    } catch (error) {
      console.error('Error loading sales:', error)
    } finally {
      setIsLoading(false)
    }
  }

  async function viewSale(id) {
    try {
      const data = await window.electronAPI.getSaleById(id)
      setSelectedSale(data)
    } catch (error) {
      console.error('Error loading sale details:', error)
    }
  }

  const handlePrint = useReactToPrint({
    contentRef: printRef,
  })

  // Filter sales based on search
  const filteredSales = sales.filter(sale =>
    sale.invoiceNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sale.paymentMethod?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = filteredSales.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(filteredSales.length / itemsPerPage)

  const paginate = (pageNumber) => setCurrentPage(pageNumber)

  // Calculate summary stats
  const totalSales = filteredSales.length
  const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.total, 0)
  const averageSale = totalSales > 0 ? totalRevenue / totalSales : 0

  return (
    <MainLayout>
      <div className="space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <ReceiptIcon className="w-7 h-7 text-indigo-600" />
              Sales History
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              View and manage your sales transactions
            </p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="bg-blue-50 p-3 rounded-xl">
                <ReceiptIcon className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">Total Sales</p>
                <p className="text-xl font-bold text-slate-800">{totalSales}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="bg-green-50 p-3 rounded-xl">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">Total Revenue</p>
                <p className="text-xl font-bold text-slate-800">Rs. {totalRevenue.toFixed(2)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="bg-purple-50 p-3 rounded-xl">
                <ShoppingBag className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">Average Sale</p>
                <p className="text-xl font-bold text-slate-800">Rs. {averageSale.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Stats */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by invoice or payment method..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition text-sm"
            />
          </div>
          <div className="text-sm text-slate-500 bg-white px-4 py-2 rounded-xl border border-slate-200 whitespace-nowrap">
            Found: <span className="font-semibold text-slate-700">{filteredSales.length}</span> transactions
          </div>
        </div>

        {/* Sales Table */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <FileText size={14} />
                      Invoice
                    </div>
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} />
                      Date
                    </div>
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <CreditCard size={14} />
                      Payment
                    </div>
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <DollarSign size={14} />
                      Total
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
                    <td colSpan="5" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <Loader size={24} className="text-indigo-600 animate-spin" />
                        <p className="text-slate-500 font-medium">Loading sales...</p>
                      </div>
                    </td>
                  </tr>
                ) : currentItems.length > 0 ? (
                  currentItems.map((sale) => (
                    <tr 
                      key={sale.id}
                      className="hover:bg-slate-50 transition-colors duration-150"
                    >
                      <td className="px-6 py-4">
                        <span className="font-mono text-sm font-medium text-indigo-600">
                          {sale.invoiceNo}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm text-slate-700">
                            {new Date(sale.createdAt).toLocaleDateString()}
                          </span>
                          <span className="text-xs text-slate-400">
                            {new Date(sale.createdAt).toLocaleTimeString()}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
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
                      <td className="px-6 py-4">
                        <span className="font-bold text-slate-800">
                          Rs. {sale.total.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => viewSale(sale.id)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg transition-colors duration-200 text-sm font-medium"
                        >
                          <Eye size={16} />
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <ReceiptIcon className="w-12 h-12 text-slate-300" />
                        <p className="text-slate-500 font-medium">No sales found</p>
                        <p className="text-sm text-slate-400">
                          {searchTerm ? 'Try adjusting your search' : 'Start making sales to see them here'}
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!isLoading && filteredSales.length > itemsPerPage && (
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-sm text-slate-600">
                Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min(indexOfLastItem, filteredSales.length)}
                </span>{' '}
                of <span className="font-medium">{filteredSales.length}</span> results
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

      {/* Invoice Modal */}
      {selectedSale && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setSelectedSale(null)}
          />
          
          {/* Modal */}
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
              
              {/* Header */}
              <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-indigo-100 flex items-center justify-center">
                    <ReceiptIcon className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">
                      Invoice Details
                    </h2>
                    <p className="text-sm text-slate-500">
                      {selectedSale.invoiceNo}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedSale(null)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition text-slate-400 hover:text-slate-600"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Content */}
              <div className="overflow-y-auto p-6 max-h-[calc(90vh-80px)]">
                
                {/* Sale Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 p-4 bg-slate-50 rounded-xl">
                  <div>
                    <p className="text-xs text-slate-500">Invoice Number</p>
                    <p className="font-mono font-medium text-slate-800">{selectedSale.invoiceNo}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Date & Time</p>
                    <p className="font-medium text-slate-800">
                      {new Date(selectedSale.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Payment Method</p>
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                      selectedSale.paymentMethod === 'CASH' 
                        ? 'bg-green-100 text-green-700'
                        : selectedSale.paymentMethod === 'CARD'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-purple-100 text-purple-700'
                    }`}>
                      {selectedSale.paymentMethod || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Items</p>
                    <p className="font-medium text-slate-800">{selectedSale.items?.length || 0} products</p>
                  </div>
                </div>

                {/* Products Table */}
                <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                  <ShoppingBag size={18} className="text-indigo-600" />
                  Products
                </h3>
                <div className="border border-slate-200 rounded-xl overflow-hidden mb-6">
                  <table className="w-full">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                          Product
                        </th>
                        <th className="px-4 py-2.5 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                          Qty
                        </th>
                        <th className="px-4 py-2.5 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                          Price
                        </th>
                        <th className="px-4 py-2.5 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedSale.items?.map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-2.5 text-sm text-slate-800">
                            {item.product?.name || 'Unknown Product'}
                          </td>
                          <td className="px-4 py-2.5 text-sm text-slate-600 text-center">
                            {item.quantity}
                          </td>
                          <td className="px-4 py-2.5 text-sm text-slate-600 text-right">
                            Rs. {item.price?.toFixed(2) || '0.00'}
                          </td>
                          <td className="px-4 py-2.5 text-sm font-medium text-slate-800 text-right">
                            Rs. {item.subtotal?.toFixed(2) || '0.00'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totals */}
                <div className="bg-slate-50 rounded-xl p-4 mb-6">
                  <div className="flex justify-between py-1">
                    <span className="text-sm text-slate-600">Subtotal</span>
                    <span className="text-sm text-slate-800">
                      Rs. {(selectedSale.total - selectedSale.tax).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-sm text-slate-600">Tax</span>
                    <span className="text-sm text-slate-800">Rs. {selectedSale.tax?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-t border-slate-200 mt-1 pt-2">
                    <span className="text-base font-bold text-slate-800">Total</span>
                    <span className="text-base font-bold text-indigo-600">
                      Rs. {selectedSale.total?.toFixed(2) || '0.00'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-sm text-slate-600">Paid Amount</span>
                    <span className="text-sm text-slate-800">Rs. {selectedSale.paidAmount?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-sm text-slate-600">Change</span>
                    <span className="text-sm text-slate-800">Rs. {selectedSale.changeAmount?.toFixed(2) || '0.00'}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handlePrint}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all duration-200 font-medium text-sm shadow-sm hover:shadow-md"
                  >
                    <Printer size={18} />
                    Print Receipt
                  </button>
                  <button
                    onClick={() => setSelectedSale(null)}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition-all duration-200 font-medium text-sm"
                  >
                    <X size={18} />
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hidden Receipt for Printing */}
      <div className="hidden">
        <div ref={printRef}>
          <Receipt sale={selectedSale} />
        </div>
      </div>
    </MainLayout>
  )
}

export default Sales