import { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'
import { 
  FileText, Plus, Search, Package, Truck, 
  Calendar, DollarSign, Eye, Edit, Trash2,
  CheckCircle, XCircle, Clock, Loader,
  ChevronLeft, ChevronRight, AlertCircle,
  X, Printer
} from 'lucide-react'
import { useReactToPrint } from 'react-to-print'

function PurchaseOrders() {
  const [purchaseOrders, setPurchaseOrders] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(5)
  const [isLoading, setIsLoading] = useState(true)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [orderToDelete, setOrderToDelete] = useState(null)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [orderToUpdate, setOrderToUpdate] = useState(null)
  const [newStatus, setNewStatus] = useState('')
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const printRef = useRef()

  useEffect(() => {
    loadPurchaseOrders()
  }, [])

  async function loadPurchaseOrders() {
    try {
      setIsLoading(true)
      const data = await window.electronAPI.getPurchaseOrders()
      setPurchaseOrders(data || [])
    } catch (error) {
      console.error('Error loading purchase orders:', error)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleDelete(id) {
    try {
      await window.electronAPI.deletePurchaseOrder(Number(id))
      setShowDeleteModal(false)
      setOrderToDelete(null)
      await loadPurchaseOrders()
    } catch (error) {
      console.error('Error deleting purchase order:', error)
      alert('Failed to delete purchase order. Please try again.')
    }
  }

  async function handleStatusUpdate(id, status) {
    try {
      await window.electronAPI.updatePurchaseOrderStatus({
        id: Number(id),
        status: status
      })
      setShowStatusModal(false)
      setOrderToUpdate(null)
      setNewStatus('')
      await loadPurchaseOrders()
      // Refresh the modal view if it's open
      if (selectedOrder && selectedOrder.id === id) {
        const updatedOrder = await window.electronAPI.getPurchaseOrderById(Number(id))
        setSelectedOrder(updatedOrder)
      }
    } catch (error) {
      console.error('Error updating purchase order status:', error)
      alert('Failed to update status. Please try again.')
    }
  }

  async function viewOrder(order) {
    try {
      // Fetch full order details with items
      const fullOrder = await window.electronAPI.getPurchaseOrderById(order.id)
      setSelectedOrder(fullOrder)
      setShowViewModal(true)
    } catch (error) {
      console.error('Error loading order details:', error)
      alert('Failed to load order details')
    }
  }

  function getStatusBadge(status) {
    const statusMap = {
      'DRAFT': { color: 'bg-gray-100 text-gray-700', icon: FileText },
      'ORDERED': { color: 'bg-blue-100 text-blue-700', icon: Clock },
      'RECEIVED': { color: 'bg-green-100 text-green-700', icon: CheckCircle },
      'CANCELLED': { color: 'bg-red-100 text-red-700', icon: XCircle }
    }
    
    const statusInfo = statusMap[status] || statusMap['DRAFT']
    const Icon = statusInfo.icon
    
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
        <Icon size={12} />
        {status}
      </span>
    )
  }

  function getStatusActions(status) {
    const actions = []
    if (status === 'DRAFT') {
      actions.push('ORDERED', 'CANCELLED')
    } else if (status === 'ORDERED') {
      actions.push('RECEIVED', 'CANCELLED')
    }
    return actions
  }

  const handlePrint = useReactToPrint({
    contentRef: printRef,
  })

  // Filter purchase orders based on search
  const filteredOrders = purchaseOrders.filter(order =>
    order.poNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.supplier?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.status?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = filteredOrders.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage)

  const paginate = (pageNumber) => setCurrentPage(pageNumber)

  // Calculate summary stats
  const totalOrders = filteredOrders.length
  const totalValue = filteredOrders.reduce((sum, order) => sum + order.total, 0)
  const draftCount = filteredOrders.filter(o => o.status === 'DRAFT').length
  const receivedCount = filteredOrders.filter(o => o.status === 'RECEIVED').length

  return (
    <MainLayout>
      <div className="space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <FileText className="w-7 h-7 text-indigo-600" />
              Purchase Orders
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Manage supplier purchase orders
            </p>
          </div>

          <Link
            to="/purchase-orders/add"
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md font-medium text-sm flex-shrink-0"
          >
            <Plus size={18} />
            New Purchase Order
          </Link>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="bg-blue-50 p-3 rounded-xl">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">Total Orders</p>
                <p className="text-xl font-bold text-slate-800">{totalOrders}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="bg-green-50 p-3 rounded-xl">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">Total Value</p>
                <p className="text-xl font-bold text-slate-800">Rs. {totalValue.toFixed(2)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="bg-yellow-50 p-3 rounded-xl">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">Draft Orders</p>
                <p className="text-xl font-bold text-slate-800">{draftCount}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="bg-purple-50 p-3 rounded-xl">
                <CheckCircle className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">Received</p>
                <p className="text-xl font-bold text-slate-800">{receivedCount}</p>
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
              placeholder="Search by PO number, supplier or status..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition text-sm"
            />
          </div>
          <div className="text-sm text-slate-500 bg-white px-4 py-2 rounded-xl border border-slate-200 whitespace-nowrap">
            Found: <span className="font-semibold text-slate-700">{filteredOrders.length}</span> orders
          </div>
        </div>

        {/* Purchase Orders Table */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <FileText size={14} />
                      PO Number
                    </div>
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <Truck size={14} />
                      Supplier
                    </div>
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <DollarSign size={14} />
                      Total
                    </div>
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <Package size={14} />
                      Status
                    </div>
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider hidden md:table-cell">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} />
                      Date
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
                    <td colSpan="6" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <Loader size={32} className="text-indigo-600 animate-spin" />
                        <p className="text-slate-500 font-medium">Loading purchase orders...</p>
                      </div>
                    </td>
                  </tr>
                ) : currentItems.length > 0 ? (
                  currentItems.map((order) => (
                    <tr 
                      key={order.id}
                      className="hover:bg-slate-50 transition-colors duration-150"
                    >
                      <td className="px-6 py-4">
                        <span className="font-mono text-sm font-medium text-indigo-600">
                          {order.poNumber}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-slate-800 text-sm">
                          {order.supplier?.name || 'Unknown Supplier'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-slate-800">
                          Rs. {order.total.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(order.status)}
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell">
                        <span className="text-sm text-slate-500">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          <button
                            onClick={() => viewOrder(order)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg transition-colors duration-200 text-sm font-medium"
                            title="View details"
                          >
                            <Eye size={14} />
                            <span className="hidden xs:inline">View</span>
                          </button>
                          {order.status === 'DRAFT' && (
                            <Link
                              to={`/purchase-orders/edit/${order.id}`}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors duration-200 text-sm font-medium"
                              title="Edit order"
                            >
                              <Edit size={14} />
                              <span className="hidden xs:inline">Edit</span>
                            </Link>
                          )}
                          {getStatusActions(order.status).length > 0 && (
                            <button
                              onClick={() => {
                                setOrderToUpdate(order)
                                setNewStatus(order.status)
                                setShowStatusModal(true)
                              }}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-600 rounded-lg transition-colors duration-200 text-sm font-medium"
                              title="Update status"
                            >
                              <CheckCircle size={14} />
                              <span className="hidden xs:inline">Status</span>
                            </button>
                          )}
                          {order.status === 'DRAFT' && (
                            <button
                              onClick={() => {
                                setOrderToDelete(order)
                                setShowDeleteModal(true)
                              }}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors duration-200 text-sm font-medium"
                              title="Delete order"
                            >
                              <Trash2 size={14} />
                              <span className="hidden xs:inline">Delete</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <FileText className="w-12 h-12 text-slate-300" />
                        <p className="text-slate-500 font-medium">No purchase orders found</p>
                        <p className="text-sm text-slate-400">
                          {searchTerm ? 'Try adjusting your search' : 'Create your first purchase order'}
                        </p>
                        {!searchTerm && (
                          <Link
                            to="/purchase-orders/add"
                            className="mt-2 inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl transition-all duration-200 text-sm"
                          >
                            <Plus size={16} />
                            New Purchase Order
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!isLoading && filteredOrders.length > itemsPerPage && (
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-sm text-slate-600">
                Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min(indexOfLastItem, filteredOrders.length)}
                </span>{' '}
                of <span className="font-medium">{filteredOrders.length}</span> results
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

      {/* View Order Modal */}
      {showViewModal && selectedOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowViewModal(false)} />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
              
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-indigo-100 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">
                      Purchase Order
                    </h2>
                    <p className="text-sm text-slate-500 font-mono">
                      {selectedOrder.poNumber}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrint}
                    className="p-2 hover:bg-slate-100 rounded-lg transition text-slate-400 hover:text-slate-600"
                    title="Print"
                  >
                    <Printer size={20} />
                  </button>
                  <button
                    onClick={() => setShowViewModal(false)}
                    className="p-2 hover:bg-slate-100 rounded-lg transition text-slate-400 hover:text-slate-600"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="overflow-y-auto p-6 max-h-[calc(90vh-80px)]">
                
                {/* Order Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-xs text-slate-500">Supplier</p>
                    <p className="font-medium text-slate-800">{selectedOrder.supplier?.name}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-xs text-slate-500">Status</p>
                    <div className="mt-1">{getStatusBadge(selectedOrder.status)}</div>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-xs text-slate-500">Total Amount</p>
                    <p className="font-bold text-indigo-600">Rs. {selectedOrder.total.toFixed(2)}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-xs text-slate-500">Created</p>
                    <p className="font-medium text-slate-800 text-sm">
                      {new Date(selectedOrder.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Order Items */}
                <div className="border-t border-slate-200 pt-4">
                  <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                    <Package size={18} className="text-indigo-600" />
                    Order Items
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                      {selectedOrder.items?.length || 0} items
                    </span>
                  </h3>
                  
                  {selectedOrder.items && selectedOrder.items.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Product</th>
                            <th className="px-4 py-2.5 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">Qty</th>
                            <th className="px-4 py-2.5 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Cost Price</th>
                            <th className="px-4 py-2.5 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {selectedOrder.items.map((item) => (
                            <tr key={item.id} className="hover:bg-slate-50 transition">
                              <td className="px-4 py-3 text-sm font-medium text-slate-800">
                                {item.product?.name || 'Unknown Product'}
                              </td>
                              <td className="px-4 py-3 text-sm text-slate-600 text-center">
                                {item.quantity}
                              </td>
                              <td className="px-4 py-3 text-sm text-slate-600 text-right">
                                Rs. {item.costPrice.toFixed(2)}
                              </td>
                              <td className="px-4 py-3 text-sm font-medium text-slate-800 text-right">
                                Rs. {item.subtotal.toFixed(2)}
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
                              Rs. {selectedOrder.total.toFixed(2)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-slate-50 rounded-xl">
                      <Package className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                      <p className="text-slate-500">No items in this order</p>
                    </div>
                  )}
                </div>

                {/* Notes */}
                {selectedOrder.notes && (
                  <div className="border-t border-slate-200 pt-4 mt-4">
                    <h3 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
                      <AlertCircle size={16} className="text-slate-400" />
                      Notes
                    </h3>
                    <p className="text-sm text-slate-600 bg-slate-50 rounded-xl p-3">
                      {selectedOrder.notes}
                    </p>
                  </div>
                )}

                {/* Modal Footer Actions */}
                <div className="border-t border-slate-200 mt-6 pt-4 flex flex-col sm:flex-row gap-3">
                  {selectedOrder.status === 'DRAFT' && (
                    <>
                      <Link
                        to={`/purchase-orders/edit/${selectedOrder.id}`}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all duration-200 font-medium text-sm"
                        onClick={() => setShowViewModal(false)}
                      >
                        <Edit size={16} />
                        Edit Order
                      </Link>
                      <button
                        onClick={() => {
                          setOrderToDelete(selectedOrder)
                          setShowDeleteModal(true)
                          setShowViewModal(false)
                        }}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-all duration-200 font-medium text-sm"
                      >
                        <Trash2 size={16} />
                        Delete Order
                      </button>
                    </>
                  )}
                  {getStatusActions(selectedOrder.status).length > 0 && (
                    <button
                      onClick={() => {
                        setOrderToUpdate(selectedOrder)
                        setNewStatus(selectedOrder.status)
                        setShowStatusModal(true)
                        setShowViewModal(false)
                      }}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-green-50 hover:bg-green-100 text-green-600 rounded-xl transition-all duration-200 font-medium text-sm"
                    >
                      <CheckCircle size={16} />
                      Update Status
                    </button>
                  )}
                  <button
                    onClick={() => setShowViewModal(false)}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition-all duration-200 font-medium text-sm"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Update Modal */}
      {showStatusModal && orderToUpdate && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowStatusModal(false)} />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full">
              <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-800">Update Status</h2>
                <button onClick={() => setShowStatusModal(false)} className="p-2 hover:bg-slate-100 rounded-lg transition">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6">
                <div className="mb-4">
                  <p className="text-sm text-slate-600">
                    Purchase Order: <span className="font-medium text-slate-800">{orderToUpdate.poNumber}</span>
                  </p>
                  <p className="text-sm text-slate-600">
                    Current Status: {getStatusBadge(orderToUpdate.status)}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-700">Select new status:</p>
                  {getStatusActions(orderToUpdate.status).map((status) => (
                    <button
                      key={status}
                      onClick={() => handleStatusUpdate(orderToUpdate.id, status)}
                      className="w-full text-left px-4 py-3 bg-slate-50 hover:bg-slate-100 rounded-xl transition text-sm font-medium text-slate-700"
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && orderToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)} />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full">
              <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-800">Delete Purchase Order</h2>
                <button onClick={() => setShowDeleteModal(false)} className="p-2 hover:bg-slate-100 rounded-lg transition">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">Delete this purchase order?</p>
                    <p className="text-sm text-slate-500">
                      PO: <span className="font-medium">{orderToDelete.poNumber}</span>
                    </p>
                    <p className="text-sm text-slate-500">
                      Supplier: <span className="font-medium">{orderToDelete.supplier?.name}</span>
                    </p>
                  </div>
                </div>
                <p className="text-sm text-red-600 mb-4">
                  ⚠️ This action cannot be undone.
                </p>
                <div className="flex gap-3 pt-4 border-t border-slate-200">
                  <button
                    onClick={() => handleDelete(orderToDelete.id)}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium text-sm"
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl font-medium text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hidden Print View */}
      {selectedOrder && (
        <div className="hidden">
          <div ref={printRef} className="p-8 bg-white">
            <div className="max-w-2xl mx-auto">
              <h1 className="text-2xl font-bold text-center mb-2">PURCHASE ORDER</h1>
              <p className="text-center text-slate-500 mb-6">{selectedOrder.poNumber}</p>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm text-slate-500">Supplier</p>
                  <p className="font-medium">{selectedOrder.supplier?.name}</p>
                  {selectedOrder.supplier?.phone && <p className="text-sm">{selectedOrder.supplier.phone}</p>}
                </div>
                <div>
                  <p className="text-sm text-slate-500">Date</p>
                  <p className="font-medium">{new Date(selectedOrder.createdAt).toLocaleString()}</p>
                  <p className="text-sm text-slate-500">Status: {selectedOrder.status}</p>
                </div>
              </div>
              
              <table className="w-full border-collapse mb-4">
                <thead>
                  <tr className="border-b-2 border-slate-300">
                    <th className="py-2 text-left">Product</th>
                    <th className="py-2 text-center">Qty</th>
                    <th className="py-2 text-right">Cost Price</th>
                    <th className="py-2 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrder.items?.map((item) => (
                    <tr key={item.id} className="border-b border-slate-200">
                      <td className="py-2">{item.product?.name}</td>
                      <td className="py-2 text-center">{item.quantity}</td>
                      <td className="py-2 text-right">Rs. {item.costPrice.toFixed(2)}</td>
                      <td className="py-2 text-right">Rs. {item.subtotal.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-300">
                    <td colSpan="3" className="py-2 text-right font-bold">Total:</td>
                    <td className="py-2 text-right font-bold">Rs. {selectedOrder.total.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
              
              {selectedOrder.notes && (
                <div className="mt-4">
                  <p className="text-sm text-slate-500">Notes</p>
                  <p>{selectedOrder.notes}</p>
                </div>
              )}
              
              <p className="text-center text-sm text-slate-500 mt-8">Generated by POS System</p>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  )
}

export default PurchaseOrders