import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'

import Dashboard from '../pages/Dashboard'
import Products from '../pages/Products'
import AddProduct from '../pages/AddProduct'
import POS from '../pages/POS'
import Sales from '../pages/Sales'
import ProtectedRoute from '../components/ProtectedRoute'
import Login from '../pages/Login'
import RoleGuard from '../components/RoleGuard'
import Unauthorized from '../pages/Unauthorized'
import DeletedProducts from '../pages/DeletedProducts'
import Suppliers from '../pages/Suppliers'
import AddSupplier from '../pages/AddSupplier'
import EditSupplier from '../pages/EditSupplier'
import StockAdjustments from '../pages/StockAdjustments'
import AddStockAdjustment from '../pages/AddStockAdjustment'
import Categories from '../pages/Categories'
import AddCategory from '../pages/AddCategory'
import EditCategory from '../pages/EditCategory'
import PurchaseOrders from '../pages/PurchaseOrders'
import AddPurchaseOrder from '../pages/AddPurchaseOrder'
import EditPurchaseOrder from '../pages/EditPurchaseOrder'
import SalesReports from '../pages/SalesReports'
import InventoryReports from '../pages/InventoryReports'
import Users from '../pages/Users'
import AddUser from '../pages/AddUser'
import EditUser from '../pages/EditUser'
import Settings from '../pages/Settings'
import FirstSetup from '../pages/FirstSetup'
import SplashScreen from '../pages/SplashScreen'


function AppRoutes() {
  const [isLoading, setIsLoading] = useState(true)
  const [needsSetup, setNeedsSetup] = useState(false)

  async function checkSetup() {
    try {
      const hasAdmin = await window.electronAPI.hasAdminUser()
      setNeedsSetup(!hasAdmin)
    } catch (error) {
      console.error('Error checking setup:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    checkSetup()
  }, [])

  if (isLoading) {
    return <SplashScreen />
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/setup" element={<FirstSetup />} />
        <Route path="/login" element={<Login />} />
        <Route 
          path="/" 
          element={
            needsSetup ? (
              <Navigate to="/setup" replace />
            ) : (
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            )
          } 
        />

        <Route path="/unauthorized" element={<Unauthorized />} />

        <Route path="/pos" element={
          <ProtectedRoute>
            <POS />
          </ProtectedRoute>
        }/>
        <Route
          path="/products"
          element={
            <ProtectedRoute>
              <RoleGuard
                allowedRoles={[
                  'ADMIN',
                ]}
              >
                <Products />
              </RoleGuard>
            </ProtectedRoute>
          }
        />
        
        
        <Route
          path="/products/add"
          element={
            <ProtectedRoute>
              <RoleGuard
                allowedRoles={[
                  'ADMIN',
                ]}
              >
                <AddProduct />
              </RoleGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="/sales"
          element={
            <ProtectedRoute>
              <Sales />
            </ProtectedRoute>
          }
        />
        <Route
          path="/deleted-products"
          element={
            <ProtectedRoute>
              <RoleGuard
                allowedRoles={['ADMIN']}
              >
                <DeletedProducts />
              </RoleGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="/suppliers"
          element={
            <ProtectedRoute>
              <Suppliers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/suppliers/add"
          element={
            <ProtectedRoute>
              <AddSupplier />
            </ProtectedRoute>
          }
        />

        <Route
          path="/suppliers/edit/:id"
          element={
            <ProtectedRoute>
              <EditSupplier />
            </ProtectedRoute>
          }
        />

        <Route
          path="/stock-adjustments"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={['ADMIN']}>
                <StockAdjustments />
              </RoleGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="/stock-adjustments/add"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={['ADMIN']}>
                <AddStockAdjustment />
              </RoleGuard>
            </ProtectedRoute>
          }
        />

        <Route
          path="/categories"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={['ADMIN']}>
                <Categories />
              </RoleGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="/categories/add"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={['ADMIN']}>
                <AddCategory />
              </RoleGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="/categories/edit/:id"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={['ADMIN']}>
                <EditCategory />
              </RoleGuard>
            </ProtectedRoute>
          }
        />

        <Route
          path="/purchase-orders"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={['ADMIN']}>
                <PurchaseOrders />
              </RoleGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="/purchase-orders/add"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={['ADMIN']}>
                <AddPurchaseOrder />
              </RoleGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="/purchase-orders/edit/:id"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={['ADMIN']}>
                <EditPurchaseOrder />
              </RoleGuard>
            </ProtectedRoute>
          }
        />

        <Route
          path="/reports/sales"
          element={
            <ProtectedRoute>
              <SalesReports />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports/inventory"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={['ADMIN']}>
                <InventoryReports />
              </RoleGuard>
            </ProtectedRoute>
          }
        />

        <Route
          path="/users"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={['ADMIN']}>
                <Users />
              </RoleGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="/users/add"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={['ADMIN']}>
                <AddUser />
              </RoleGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="/users/edit/:id"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={['ADMIN']}>
                <EditUser />
              </RoleGuard>
            </ProtectedRoute>
          }
        />

        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={['ADMIN']}>
                <Settings />
              </RoleGuard>
            </ProtectedRoute>
          }
        />

        {/* Fallback Route */}
        <Route path="*" element={<Navigate to="/" replace />} />
        
      </Routes>
    </BrowserRouter>
  )
}

export default AppRoutes