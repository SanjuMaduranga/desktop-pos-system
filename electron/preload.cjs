const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {

  getProducts: () =>
    ipcRenderer.invoke('get-products'),

  createProduct: (data) =>
    ipcRenderer.invoke('create-product', data),

  deleteProduct: (payload) =>
    ipcRenderer.invoke('delete-product', payload),

  checkout: (data) =>
  ipcRenderer.invoke('checkout', data),

  getSales: () =>
  ipcRenderer.invoke('get-sales'),

  getSaleById: (id) =>
  ipcRenderer.invoke('get-sale-by-id', id),

  getDashboardStats: () =>
  ipcRenderer.invoke('get-dashboard-stats'),

  getLowStockProducts: () =>
  ipcRenderer.invoke('get-low-stock-products'),

  getSalesChart: () =>
  ipcRenderer.invoke('get-sales-chart'),
  
  login: (credentials) =>
  ipcRenderer.invoke('login', credentials),

  getSession: () =>
  ipcRenderer.invoke('get-session'),

  logout: () =>
  ipcRenderer.invoke('logout'),

  updateProductStock: (data) =>
  ipcRenderer.invoke('update-product-stock', data),

  updateProductPrice: (data) =>
  ipcRenderer.invoke('update-product-price', data),

  getDeletedProducts: () =>
  ipcRenderer.invoke('get-deleted-products'),

  restoreProduct: (id) =>
  ipcRenderer.invoke('restore-product',id),

  getCategoryStats: () =>
  ipcRenderer.invoke('get-category-stats'),

  getRecentSales: (limit) =>
  ipcRenderer.invoke('get-recent-sales', limit),

  getSuppliers: () =>
  ipcRenderer.invoke('get-suppliers'),

  createSupplier: (data) =>
  ipcRenderer.invoke('create-supplier', data),

  getSupplierById: (id) =>
  ipcRenderer.invoke('get-supplier-by-id', id),

  updateSupplier: (data) =>
  ipcRenderer.invoke('update-supplier', data),

  deleteSupplier: (id) =>
  ipcRenderer.invoke('delete-supplier', id),

  getProductsBySupplier: (supplierId) =>
  ipcRenderer.invoke('get-products-by-supplier', supplierId),

  addProductToSupplier: (supplierId, productId) =>
  ipcRenderer.invoke('add-product-to-supplier', supplierId, productId),

  removeProductFromSupplier: (supplierId, productId) =>
  ipcRenderer.invoke('remove-product-from-supplier', supplierId, productId),

  getAllProducts: () =>
  ipcRenderer.invoke('get-all-products'),

  getCategories: () =>
  ipcRenderer.invoke('get-categories'),

  createCategory: (data) =>
  ipcRenderer.invoke('create-category', data),

  getCategoryById: (id) =>
  ipcRenderer.invoke('get-category-by-id', id),

  updateCategory: (data) =>
  ipcRenderer.invoke('update-category', data),

  deleteCategory: (id) =>
  ipcRenderer.invoke('delete-category', id),

  getStockAdjustments: () =>
  ipcRenderer.invoke('get-stock-adjustments'),

  createStockAdjustment: (data) =>
  ipcRenderer.invoke('create-stock-adjustment', data),

  deleteStockAdjustment: (id) =>
  ipcRenderer.invoke('delete-stock-adjustment', id),

  getPurchaseOrders: () =>
  ipcRenderer.invoke('get-purchase-orders'),

  getPurchaseOrderById: (id) =>
  ipcRenderer.invoke('get-purchase-order-by-id', id),

  createPurchaseOrder: (data) =>
  ipcRenderer.invoke('create-purchase-order', data),

  updatePurchaseOrder: (data) =>
  ipcRenderer.invoke('update-purchase-order', data),

  updatePurchaseOrderStatus: (data) =>
  ipcRenderer.invoke('update-purchase-order-status', data),

  deletePurchaseOrder: (id) =>
  ipcRenderer.invoke('delete-purchase-order', id),

  getSalesReport: (params) =>
  ipcRenderer.invoke('get-sales-report', params),

  getInventoryReport: () =>
  ipcRenderer.invoke('get-inventory-report'),

  // User Management related
  getUsers: () =>
  ipcRenderer.invoke('get-users'),

  getUserById: (id) =>
  ipcRenderer.invoke('get-user-by-id', id),

  createUser: (data) =>
  ipcRenderer.invoke('create-user', data),

  updateUser: (data) =>
  ipcRenderer.invoke('update-user', data),

  updateUserStatus: (data) =>
  ipcRenderer.invoke('update-user-status', data),

  deleteUser: (id) =>
  ipcRenderer.invoke('delete-user', id),

  // Settings related
  getSettings: () =>
  ipcRenderer.invoke('get-settings'),

  saveSettings: (data) =>
  ipcRenderer.invoke('save-settings', data),

  getSystemInfo: () =>
  ipcRenderer.invoke('get-system-info'),

  backupDatabase: () =>
  ipcRenderer.invoke('backup-database'),

  restoreDatabase: (filePath) =>
  ipcRenderer.invoke('restore-database', filePath),

  selectBackupFile: () =>
  ipcRenderer.invoke('select-backup-file'),

  hasAdminUser: () =>
  ipcRenderer.invoke('has-admin-user'),

  createAdminUser: (data) =>
  ipcRenderer.invoke('create-admin-user', data),

})