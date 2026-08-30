const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')

const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const Store = require('electron-store').default

const prisma = new PrismaClient()
const store = new Store()

let mainWindow

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,

    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  mainWindow.loadURL('http://localhost:5174')
}

app.disableHardwareAcceleration()

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// ============ PRODUCT HANDLERS ============
ipcMain.handle('get-products', async () => {
  return await prisma.product.findMany({
    where: {
      active: true,
    },
    include: {
      category: true,
    },
  })
})

ipcMain.handle('create-product', async (_, data) => {
  return await prisma.product.create({
    data,
  })
})

ipcMain.handle('delete-product', async (_, payload) => {
  try {
    const session = store.get('session')
    if (!session || session.role !== 'ADMIN') {
      throw new Error('Unauthorized')
    }

    const id = Number(payload.id)
    if (!id) {
      throw new Error('Invalid product id')
    }

    await prisma.product.update({
      where: { id },
      data: {
        active: false,
      },
    })

    return { success: true }
  } catch (error) {
    console.error(error)
    throw error
  }
})

ipcMain.handle('update-product-stock', async (_, data) => {
  try {
    const session = store.get('session')
    if (!session || session.role !== 'ADMIN') {
      throw new Error('Unauthorized')
    }

    const { id, stock } = data
    
    if (stock === undefined || stock === null) {
      throw new Error('Stock value is required')
    }

    return await prisma.product.update({
      where: {
        id: Number(id),
      },
      data: {
        stock: Number(stock),
      },
      include: {
        category: true,
      },
    })
  } catch (error) {
    console.error('Error updating product stock:', error)
    throw error
  }
})

ipcMain.handle('update-product-price', async (_, data) => {
  try {
    const session = store.get('session')
    if (!session || session.role !== 'ADMIN') {
      throw new Error('Unauthorized')
    }

    const { id, price } = data
    
    if (price === undefined || price === null) {
      throw new Error('Price value is required')
    }

    return await prisma.product.update({
      where: {
        id: Number(id),
      },
      data: {
        price: Number(price),
      },
      include: {
        category: true,
      },
    })
  } catch (error) {
    console.error('Error updating product price:', error)
    throw error
  }
})


ipcMain.handle('get-category-stats', async () => {
  try {
    const categories = await prisma.category.findMany({
      include: {
        products: {
          where: { active: true }
        }
      }
    })
    
    return categories.map(cat => ({
      name: cat.name,
      value: cat.products.length
    })).filter(item => item.value > 0)
  } catch (error) {
    console.error('Error getting category stats:', error)
    return []
  }
})

ipcMain.handle('get-recent-sales', async (_, limit = 5) => {
  try {
    return await prisma.sale.findMany({
      take: Number(limit),
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        items: true
      }
    })
  } catch (error) {
    console.error('Error getting recent sales:', error)
    return []
  }
})

ipcMain.handle('get-deleted-products', async () => {
  return await prisma.product.findMany({
    where: {
      active: false,
    },
  })
})

ipcMain.handle('restore-product', async (_, id) => {
  const session = store.get('session')
  if (!session || session.role !== 'ADMIN') {
    throw new Error('Unauthorized')
  }

  return await prisma.product.update({
    where: {
      id: Number(id),
    },
    data: {
      active: true,
    },
  })
})


// ============ SUPPLIER HANDLERS ============
ipcMain.handle('get-suppliers', async () => {
  return await prisma.supplier.findMany({
    where: {
      active: true,
    },
    orderBy: {
      name: 'asc',
    },
  })
})

ipcMain.handle('create-supplier', async (_, data) => {
  return await prisma.supplier.create({
    data,
  })
})

ipcMain.handle('get-supplier-by-id', async (_, id) => {
  return await prisma.supplier.findUnique({
    where: {
      id: Number(id),
    },
  })
})

ipcMain.handle('update-supplier', async (_, data) => {
  const { id, ...supplierData } = data
  return await prisma.supplier.update({
    where: {
      id: Number(id),
    },
    data: supplierData,
  })
})

ipcMain.handle('delete-supplier', async (_, id) => {
  return await prisma.supplier.update({
    where: {
      id: Number(id),
    },
    data: {
      active: false,
    },
  })
})

// ============ PRODUCT-SUPPLIER RELATIONSHIP HANDLERS ============
ipcMain.handle('get-products-by-supplier', async (_, supplierId) => {
  try {
    console.log('Fetching products for supplier:', supplierId)
    const products = await prisma.product.findMany({
      where: {
        supplierId: Number(supplierId),
        active: true,
      },
      include: {
        category: true,
      },
      orderBy: {
        name: 'asc',
      },
    })
    console.log('Products found:', products.length)
    return products
  } catch (error) {
    console.error('Error getting products by supplier:', error)
    return []
  }
})

ipcMain.handle('add-product-to-supplier', async (_, supplierId, productId) => {
  try {
    console.log('Adding product', productId, 'to supplier', supplierId)
    
    const session = store.get('session')
    if (!session || session.role !== 'ADMIN') {
      throw new Error('Unauthorized - Admin access required')
    }

    const updatedProduct = await prisma.product.update({
      where: {
        id: Number(productId),
      },
      data: {
        supplierId: Number(supplierId),
      },
      include: {
        category: true,
      },
    })
    console.log('Product added successfully:', updatedProduct.id)
    return updatedProduct
  } catch (error) {
    console.error('Error adding product to supplier:', error)
    throw error
  }
})

ipcMain.handle('remove-product-from-supplier', async (_, supplierId, productId) => {
  try {
    console.log('Removing product', productId, 'from supplier', supplierId)
    
    const session = store.get('session')
    if (!session || session.role !== 'ADMIN') {
      throw new Error('Unauthorized - Admin access required')
    }

    const updatedProduct = await prisma.product.update({
      where: {
        id: Number(productId),
      },
      data: {
        supplierId: null,
      },
      include: {
        category: true,
      },
    })
    console.log('Product removed successfully:', updatedProduct.id)
    return updatedProduct
  } catch (error) {
    console.error('Error removing product from supplier:', error)
    throw error
  }
})

ipcMain.handle('get-all-products', async () => {
  try {
    console.log('Fetching all products')
    const products = await prisma.product.findMany({
      where: {
        active: true,
      },
      include: {
        category: true,
      },
      orderBy: {
        name: 'asc',
      },
    })
    console.log('Total products found:', products.length)
    return products
  } catch (error) {
    console.error('Error getting all products:', error)
    return []
  }
})

// ============ SALES HANDLERS ============
ipcMain.handle('checkout', async (_, data) => {
  const { cart, subtotal, tax, total, paymentMethod, paidAmount, change } = data

  const invoiceNo = `INV-${Date.now()}`

  const sale = await prisma.sale.create({
    data: {
      invoiceNo,
      total,
      discount: 0,
      tax,
      paymentMethod,
      paidAmount,
      changeAmount: change,
      items: {
        create: cart.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
          price: item.price,
          subtotal: item.price * item.quantity,
        })),
      },
    },
    include: {
      items: true,
    },
  })

  // UPDATE STOCK
  for (const item of cart) {
    await prisma.product.update({
      where: {
        id: item.id,
      },
      data: {
        stock: {
          decrement: item.quantity,
        },
      },
    })
  }

  return sale
})

ipcMain.handle('get-sales', async () => {
  return await prisma.sale.findMany({
    orderBy: {
      createdAt: 'desc',
    },
  })
})

ipcMain.handle('get-sale-by-id', async (_, id) => {
  return await prisma.sale.findUnique({
    where: {
      id: Number(id),
    },
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
  })
})

ipcMain.handle('get-sales-chart', async () => {
  try {
    const sales = await prisma.sale.findMany({
      orderBy: {
        createdAt: 'asc',
      },
    })

    const grouped = {}
    sales.forEach((sale) => {
      const date = new Date(sale.createdAt).toLocaleDateString()
      if (!grouped[date]) {
        grouped[date] = 0
      }
      grouped[date] += sale.total
    })
    return Object.entries(grouped).map(([date, total]) => ({
      date,
      total,
    }))
  } catch (error) {
    console.error(error)
    return []
  }
})

// ============ DASHBOARD HANDLERS ============
ipcMain.handle('get-dashboard-stats', async () => {
  try {
    const totalProducts = await prisma.product.count()
    const lowStockProducts = await prisma.product.count({
      where: {
        stock: {
          lte: 5,
        },
      },
    })

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    const todaySales = await prisma.sale.findMany({
      where: {
        createdAt: {
          gte: todayStart,
        },
      },
    })

    const todayRevenue = todaySales.reduce((sum, sale) => sum + sale.total, 0)
    
    return {
      totalProducts,
      lowStockProducts,
      todaySalesCount: todaySales.length,
      todayRevenue,
    }
  } catch (error) {
    console.error(error)
    return null
  }
})

ipcMain.handle('get-low-stock-products', async () => {
  try {
    return await prisma.product.findMany({
      where: {
        stock: {
          lte: 5,
        },
      },
      orderBy: {
        stock: 'asc',
      },
    })
  } catch (error) {
    console.error(error)
    return []
  }
})

// ============ CATEGORY HANDLERS ============

// Get all categories with product count
ipcMain.handle('get-categories', async () => {
  try {
    return await prisma.category.findMany({
      include: {
        _count: {
          select: { products: true }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })
  } catch (error) {
    console.error('Error getting categories:', error)
    return []
  }
})

// Create a new category
ipcMain.handle('create-category', async (_, data) => {
  try {
    const session = store.get('session')
    if (!session || session.role !== 'ADMIN') {
      throw new Error('Unauthorized')
    }

    return await prisma.category.create({
      data: {
        name: data.name
      }
    })
  } catch (error) {
    console.error('Error creating category:', error)
    throw error
  }
})

// Get a single category by ID
ipcMain.handle('get-category-by-id', async (_, id) => {
  try {
    return await prisma.category.findUnique({
      where: {
        id: Number(id)
      },
      include: {
        _count: {
          select: { products: true }
        }
      }
    })
  } catch (error) {
    console.error('Error getting category:', error)
    throw error
  }
})

// Update a category
ipcMain.handle('update-category', async (_, data) => {
  try {
    const session = store.get('session')
    if (!session || session.role !== 'ADMIN') {
      throw new Error('Unauthorized')
    }

    const { id, name } = data
    return await prisma.category.update({
      where: {
        id: Number(id)
      },
      data: {
        name: name
      }
    })
  } catch (error) {
    console.error('Error updating category:', error)
    throw error
  }
})

// Delete a category (soft delete or check for products)
ipcMain.handle('delete-category', async (_, id) => {
  try {
    const session = store.get('session')
    if (!session || session.role !== 'ADMIN') {
      throw new Error('Unauthorized')
    }

    // Check if category has products
    const category = await prisma.category.findUnique({
      where: {
        id: Number(id)
      },
      include: {
        _count: {
          select: { products: true }
        }
      }
    })

    if (category._count.products > 0) {
      throw new Error('Cannot delete category with existing products')
    }

    return await prisma.category.delete({
      where: {
        id: Number(id)
      }
    })
  } catch (error) {
    console.error('Error deleting category:', error)
    throw error
  }
})

// ============ STOCK ADJUSTMENT HANDLERS ============

ipcMain.handle('get-stock-adjustments', async () => {
  try {
    return await prisma.stockAdjustment.findMany({
      include: {
        product: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
  } catch (error) {
    console.error('Error getting stock adjustments:', error)
    return []
  }
})

ipcMain.handle('create-stock-adjustment', async (_, data) => {
  try {
    const session = store.get('session')
    if (!session || session.role !== 'ADMIN') {
      throw new Error('Unauthorized')
    }

    const { productId, type, quantity, reason } = data

    const product = await prisma.product.findUnique({
      where: { id: Number(productId) }
    })

    if (!product) {
      throw new Error('Product not found')
    }

    let newStock = product.stock
    if (type === 'INCREASE') {
      newStock += Number(quantity)
    } else if (type === 'DECREASE') {
      if (Number(quantity) > product.stock) {
        throw new Error('Insufficient stock')
      }
      newStock -= Number(quantity)
    }

    const result = await prisma.$transaction(async (prisma) => {
      const adjustment = await prisma.stockAdjustment.create({
        data: {
          productId: Number(productId),
          quantity: Number(quantity),
          type: type,
          reason: reason || null,
        },
        include: {
          product: true
        }
      })

      await prisma.product.update({
        where: { id: Number(productId) },
        data: { stock: newStock }
      })

      return adjustment
    })

    return result
  } catch (error) {
    console.error('Error creating stock adjustment:', error)
    throw error
  }
})

ipcMain.handle('delete-stock-adjustment', async (_, id) => {
  try {
    const session = store.get('session')
    if (!session || session.role !== 'ADMIN') {
      throw new Error('Unauthorized')
    }

    const adjustment = await prisma.stockAdjustment.findUnique({
      where: { id: Number(id) },
      include: { product: true }
    })

    if (!adjustment) {
      throw new Error('Adjustment not found')
    }

    let newStock = adjustment.product.stock
    if (adjustment.type === 'INCREASE') {
      newStock -= adjustment.quantity
    } else if (adjustment.type === 'DECREASE') {
      newStock += adjustment.quantity
    }

    const result = await prisma.$transaction(async (prisma) => {
      const deleted = await prisma.stockAdjustment.delete({
        where: { id: Number(id) }
      })

      await prisma.product.update({
        where: { id: adjustment.productId },
        data: { stock: newStock }
      })

      return deleted
    })

    return result
  } catch (error) {
    console.error('Error deleting stock adjustment:', error)
    throw error
  }
})

// ============ PURCHASE ORDER HANDLERS ============

// Get all purchase orders
ipcMain.handle('get-purchase-orders', async () => {
  try {
    return await prisma.purchaseOrder.findMany({
      include: {
        supplier: true,
        items: {
          include: {
            product: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
  } catch (error) {
    console.error('Error getting purchase orders:', error)
    return []
  }
})

// Get a single purchase order by ID
ipcMain.handle('get-purchase-order-by-id', async (_, id) => {
  try {
    return await prisma.purchaseOrder.findUnique({
      where: {
        id: Number(id)
      },
      include: {
        supplier: true,
        items: {
          include: {
            product: true
          }
        }
      }
    })
  } catch (error) {
    console.error('Error getting purchase order:', error)
    throw error
  }
})

// Create a new purchase order
ipcMain.handle('create-purchase-order', async (_, data) => {
  try {
    const session = store.get('session')
    if (!session || session.role !== 'ADMIN') {
      throw new Error('Unauthorized')
    }

    const { supplierId, items, notes } = data

    // Generate PO number
    const poNumber = `PO-${Date.now()}`

    // Calculate total
    let total = 0
    const orderItems = items.map(item => {
      const subtotal = item.quantity * item.costPrice
      total += subtotal
      return {
        productId: Number(item.productId),
        quantity: Number(item.quantity),
        costPrice: Number(item.costPrice),
        subtotal: subtotal
      }
    })

    return await prisma.purchaseOrder.create({
      data: {
        poNumber: poNumber,
        supplierId: Number(supplierId),
        total: total,
        status: 'DRAFT',
        notes: notes || null,
        items: {
          create: orderItems
        }
      },
      include: {
        supplier: true,
        items: {
          include: {
            product: true
          }
        }
      }
    })
  } catch (error) {
    console.error('Error creating purchase order:', error)
    throw error
  }
})

// Update a purchase order
ipcMain.handle('update-purchase-order', async (_, data) => {
  try {
    const session = store.get('session')
    if (!session || session.role !== 'ADMIN') {
      throw new Error('Unauthorized')
    }

    const { id, supplierId, items, notes } = data

    // Get existing order
    const existingOrder = await prisma.purchaseOrder.findUnique({
      where: { id: Number(id) },
      include: { items: true }
    })

    if (!existingOrder) {
      throw new Error('Purchase order not found')
    }

    if (existingOrder.status !== 'DRAFT') {
      throw new Error('Only draft orders can be edited')
    }

    // Calculate new total
    let total = 0
    const orderItems = items.map(item => {
      const subtotal = item.quantity * item.costPrice
      total += subtotal
      return {
        productId: Number(item.productId),
        quantity: Number(item.quantity),
        costPrice: Number(item.costPrice),
        subtotal: subtotal
      }
    })

    // Delete existing items and create new ones
    return await prisma.$transaction(async (prisma) => {
      // Delete old items
      await prisma.purchaseItem.deleteMany({
        where: { purchaseId: Number(id) }
      })

      // Update order
      return await prisma.purchaseOrder.update({
        where: { id: Number(id) },
        data: {
          supplierId: Number(supplierId),
          total: total,
          notes: notes || null,
          items: {
            create: orderItems
          }
        },
        include: {
          supplier: true,
          items: {
            include: {
              product: true
            }
          }
        }
      })
    })
  } catch (error) {
    console.error('Error updating purchase order:', error)
    throw error
  }
})

// Update purchase order status
ipcMain.handle('update-purchase-order-status', async (_, data) => {
  try {
    const session = store.get('session')
    if (!session || session.role !== 'ADMIN') {
      throw new Error('Unauthorized')
    }

    const { id, status } = data

    // Get the order
    const order = await prisma.purchaseOrder.findUnique({
      where: { id: Number(id) },
      include: { items: true }
    })

    if (!order) {
      throw new Error('Purchase order not found')
    }

    // If status is RECEIVED, update product stock
    if (status === 'RECEIVED') {
      await prisma.$transaction(async (prisma) => {
        // Update order status
        await prisma.purchaseOrder.update({
          where: { id: Number(id) },
          data: { status: status }
        })

        // Update product stock for each item
        for (const item of order.items) {
          await prisma.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                increment: item.quantity
              }
            }
          })
        }
      })
    } else {
      // Just update status
      return await prisma.purchaseOrder.update({
        where: { id: Number(id) },
        data: { status: status }
      })
    }

    return await prisma.purchaseOrder.findUnique({
      where: { id: Number(id) },
      include: {
        supplier: true,
        items: {
          include: {
            product: true
          }
        }
      }
    })
  } catch (error) {
    console.error('Error updating purchase order status:', error)
    throw error
  }
})

ipcMain.handle('delete-purchase-order', async (_, id) => {
  try {
    const session = store.get('session')
    if (!session || session.role !== 'ADMIN') {
      throw new Error('Unauthorized')
    }

    // Get the order
    const order = await prisma.purchaseOrder.findUnique({
      where: { id: Number(id) }
    })

    if (!order) {
      throw new Error('Purchase order not found')
    }

    if (order.status !== 'DRAFT') {
      throw new Error('Only draft orders can be deleted')
    }

    // Delete order and its items
    return await prisma.$transaction(async (prisma) => {
      // Delete items first
      await prisma.purchaseItem.deleteMany({
        where: { purchaseId: Number(id) }
      })

      // Delete order
      return await prisma.purchaseOrder.delete({
        where: { id: Number(id) }
      })
    })
  } catch (error) {
    console.error('Error deleting purchase order:', error)
    throw error
  }
})

// ============ SALES REPORT HANDLER ============

ipcMain.handle('get-sales-report', async (_, params) => {
  try {
    const { startDate, endDate } = params || {}
    
    // Build where clause
    const where = {}
    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    }

    const sales = await prisma.sale.findMany({
      where,
      include: {
        items: {
          include: {
            product: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return sales
  } catch (error) {
    console.error('Error getting sales report:', error)
    return []
  }
})

// ============ USER MANAGEMENT HANDLERS ============

// Get all users
ipcMain.handle('get-users', async () => {
  try {
    const session = store.get('session')
    if (!session || session.role !== 'ADMIN') {
      throw new Error('Unauthorized')
    }

    return await prisma.user.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    })
  } catch (error) {
    console.error('Error getting users:', error)
    return []
  }
})

// Get a single user by ID
ipcMain.handle('get-user-by-id', async (_, id) => {
  try {
    const session = store.get('session')
    if (!session || session.role !== 'ADMIN') {
      throw new Error('Unauthorized')
    }

    return await prisma.user.findUnique({
      where: {
        id: Number(id)
      }
    })
  } catch (error) {
    console.error('Error getting user:', error)
    throw error
  }
})

// Create a new user
ipcMain.handle('create-user', async (_, data) => {
  try {
    const session = store.get('session')
    if (!session || session.role !== 'ADMIN') {
      throw new Error('Unauthorized')
    }

    const { name, username, email, password, role } = data

    // Check if username already exists
    const existingUser = await prisma.user.findUnique({
      where: { username }
    })

    if (existingUser) {
      throw new Error('Username already exists')
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    return await prisma.user.create({
      data: {
        name,
        username,
        email: email || null,
        password: hashedPassword,
        role
      }
    })
  } catch (error) {
    console.error('Error creating user:', error)
    throw error
  }
})

// Update a user
ipcMain.handle('update-user', async (_, data) => {
  try {
    const session = store.get('session')
    if (!session || session.role !== 'ADMIN') {
      throw new Error('Unauthorized')
    }

    const { id, name, username, email, role, password } = data

    const updateData = {
      name,
      username,
      email: email || null,
      role
    }

    // Only update password if provided
    if (password && password.length > 0) {
      updateData.password = await bcrypt.hash(password, 10)
    }

    return await prisma.user.update({
      where: {
        id: Number(id)
      },
      data: updateData
    })
  } catch (error) {
    console.error('Error updating user:', error)
    throw error
  }
})

// Update user status (activate/deactivate)
ipcMain.handle('update-user-status', async (_, data) => {
  try {
    const session = store.get('session')
    if (!session || session.role !== 'ADMIN') {
      throw new Error('Unauthorized')
    }

    const { id, active } = data

    return await prisma.user.update({
      where: {
        id: Number(id)
      },
      data: {
        active: active
      }
    })
  } catch (error) {
    console.error('Error updating user status:', error)
    throw error
  }
})

// Delete a user
ipcMain.handle('delete-user', async (_, id) => {
  try {
    const session = store.get('session')
    if (!session || session.role !== 'ADMIN') {
      throw new Error('Unauthorized')
    }

    // Don't allow deleting the current user
    if (Number(id) === session.id) {
      throw new Error('Cannot delete your own account')
    }

    return await prisma.user.delete({
      where: {
        id: Number(id)
      }
    })
  } catch (error) {
    console.error('Error deleting user:', error)
    throw error
  }
})

// ============ SETTINGS HANDLERS ============

// Get settings from electron-store
ipcMain.handle('get-settings', () => {
  try {
    const settings = store.get('settings') || {}
    return settings
  } catch (error) {
    console.error('Error getting settings:', error)
    return {}
  }
})

// Save settings to electron-store
ipcMain.handle('save-settings', async (_, data) => {
  try {
    const session = store.get('session')
    if (!session || session.role !== 'ADMIN') {
      throw new Error('Unauthorized')
    }

    store.set('settings', data)
    return { success: true }
  } catch (error) {
    console.error('Error saving settings:', error)
    throw error
  }
})

// Get system information
ipcMain.handle('get-system-info', async () => {
  try {
    const packageJson = require('../package.json')
    
    // Get database size
    const fs = require('fs')
    const path = require('path')
    const dbPath = path.join(__dirname, '../prisma/pos.db')
    let dbSize = '0 MB'
    
    if (fs.existsSync(dbPath)) {
      const stats = fs.statSync(dbPath)
      dbSize = (stats.size / (1024 * 1024)).toFixed(2) + ' MB'
    }

    // Get last backup info
    const lastBackup = store.get('lastBackup') || 'Never'

    // Get counts
    const totalProducts = await prisma.product.count({ where: { active: true } })
    const totalSales = await prisma.sale.count()
    const totalUsers = await prisma.user.count()

    return {
      version: packageJson.version || '1.0.0',
      databaseSize: dbSize,
      lastBackup: lastBackup,
      totalProducts,
      totalSales,
      totalUsers
    }
  } catch (error) {
    console.error('Error getting system info:', error)
    return {
      version: '1.0.0',
      databaseSize: '0 MB',
      lastBackup: 'Never',
      totalProducts: 0,
      totalSales: 0,
      totalUsers: 0
    }
  }
})

// Backup database
ipcMain.handle('backup-database', async () => {
  try {
    const session = store.get('session')
    if (!session || session.role !== 'ADMIN') {
      throw new Error('Unauthorized')
    }

    const fs = require('fs')
    const path = require('path')
    const os = require('os')
    
    const dbPath = path.join(__dirname, '../prisma/pos.db')
    if (!fs.existsSync(dbPath)) {
      throw new Error('Database file not found')
    }

    // Create backup in user's Documents folder instead of Downloads
    const backupDir = path.join(os.homedir(), 'Documents', 'POS_Backups')
    // Create directory if it doesn't exist
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true })
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupPath = path.join(backupDir, `pos_backup_${timestamp}.db`)

    // Copy database file
    fs.copyFileSync(dbPath, backupPath)
    
    // Save last backup time
    store.set('lastBackup', new Date().toLocaleString())

    return { 
      success: true, 
      message: `Backup saved to: ${backupPath}`,
      path: backupPath
    }
  } catch (error) {
    console.error('Error backing up database:', error)
    return { 
      success: false, 
      message: error.message || 'Backup failed'
    }
  }
})

// handler for file selection
ipcMain.handle('select-backup-file', async () => {
  try {
    const session = store.get('session')
    if (!session || session.role !== 'ADMIN') {
      throw new Error('Unauthorized')
    }

    const result = await dialog.showOpenDialog({
      title: 'Select Backup File',
      filters: [
        { name: 'Database Files', extensions: ['db', 'sqlite', 'sqlite3'] },
        { name: 'All Files', extensions: ['*'] }
      ],
      properties: ['openFile']
    })

    return result
  } catch (error) {
    console.error('Error selecting file:', error)
    return { canceled: true }
  }
})

// Restore database
ipcMain.handle('restore-database', async (_, filePath) => {
  try {
    const session = store.get('session')
    if (!session || session.role !== 'ADMIN') {
      throw new Error('Unauthorized')
    }

    console.log('Restoring from file:', filePath)

    const fs = require('fs')
    const path = require('path')
    
    // Check if backup file exists
    if (!fs.existsSync(filePath)) {
      throw new Error('Backup file not found at: ' + filePath)
    }

    // Get the current database path
    const dbPath = path.join(__dirname, '../prisma/pos.db')
    const dbDir = path.dirname(dbPath)
    
    // Create safety backup
    if (fs.existsSync(dbPath)) {
      const backupTimestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const safetyBackupPath = path.join(dbDir, `pos_backup_${backupTimestamp}.db`)
      fs.copyFileSync(dbPath, safetyBackupPath)
      console.log('Safety backup created:', safetyBackupPath)
    }

    // Close Prisma connection
    await prisma.$disconnect()
    
    // Copy the backup file
    fs.copyFileSync(filePath, dbPath)
    
    // Reconnect Prisma
    await prisma.$connect()

    // Update last backup time
    store.set('lastBackup', new Date().toLocaleString())

    return { 
      success: true, 
      message: 'Database restored successfully' 
    }
  } catch (error) {
    console.error('Error restoring database:', error)
    return { 
      success: false, 
      message: error.message || 'Restore failed'
    }
  }
})

// ============ AUTH HANDLERS ============
ipcMain.handle('login', async (_, credentials) => {
  try {
    const { username, password } = credentials

    // Check if this is first login attempt for admin
    // If admin doesn't exist, create it
    const adminExists = await prisma.user.findUnique({
      where: { username: 'admin' }
    })

    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('admin123', 10)
      await prisma.user.create({
        data: {
          name: 'Administrator',
          username: 'admin',
          password: hashedPassword,
          role: 'ADMIN',
          active: true
        }
      })
      console.log(' Default admin user created on first login attempt')
    }

    const user = await prisma.user.findUnique({
      where: {
        username,
      },
    })
    
    if (!user) {
      return {
        success: false,
        message: 'Invalid username',
      }
    }

    // Check if user is active
    if (user.active === false) {
      return {
        success: false,
        message: 'Account is deactivated. Please contact administrator.',
      }
    }

    const validPassword = await bcrypt.compare(password, user.password)

    if (!validPassword) {
      return {
        success: false,
        message: 'Invalid password',
      }
    }

    // SAVE SESSION
    const sessionData = {
      id: user.id,
      name: user.name,
      username: user.username,
      role: user.role,
    }

    store.set('session', sessionData)

    return {
      success: true,
      user: sessionData,
    }
  } catch (error) {
    console.error(error)
    return {
      success: false,
      message: 'Login failed',
    }
  }
})

ipcMain.handle('get-session', () => {
  const session = store.get('session')
  console.log('SESSION FROM STORE:', session)
  return session
})

ipcMain.handle('logout', () => {
  store.delete('session')
  return true
})

// Check if admin user exists
ipcMain.handle('has-admin-user', async () => {
  try {
    const admin = await prisma.user.findFirst({
      where: { 
        role: 'ADMIN',
        active: true
      }
    })
    return !!admin
  } catch (error) {
    console.error('Error checking admin:', error)
    return false
  }
})

// Create admin user (for setup)
ipcMain.handle('create-admin-user', async (_, data) => {
  try {
    const { name, username, email, password } = data

    // Check if admin already exists
    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    })

    if (existingAdmin) {
      throw new Error('Admin user already exists')
    }

    // Check if username is taken
    const existingUser = await prisma.user.findUnique({
      where: { username }
    })

    if (existingUser) {
      throw new Error('Username already taken')
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        name,
        username,
        email: email || null,
        password: hashedPassword,
        role: 'ADMIN',
        active: true
      }
    })

    return {
      success: true,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        role: user.role
      }
    }
  } catch (error) {
    console.error('Error creating admin:', error)
    throw error
  }
})