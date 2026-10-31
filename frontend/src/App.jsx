import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import DashboardLayout from './layouts/DashboardLayout'
import { AuthProvider, useAuth } from './context/AuthContext'
import { CatalogProvider } from './context/CatalogContext'

// Auth Pages
import SignUp from './pages/Auth/SignUp'
import Login from './pages/Auth/Login'
import ForgotPassword from './pages/Auth/ForgotPassword'
import ResetPassword from './pages/Auth/ResetPassword'

// Customer Portal
import CustomerPortal from './pages/Portal/CustomerPortal'

// Internal Admin/Staff Pages
import Dashboard from './pages/Dashboard/Dashboard'
import Products from './pages/Products/Products'
import Plans from './pages/Plans/Plans'
import Customers from './pages/Customers/Customers'
import Subscriptions from './pages/Subscriptions/Subscriptions'
import Invoices from './pages/Invoices/Invoices'
import Payments from './pages/Payments/Payments'
import Discounts from './pages/Discounts/Discounts'
import Reports from './pages/Reports/Reports'
import Staff from './pages/Staff/Staff'

// Role Guard for Internal Staff & Admin
function InternalRoute({ children }) {
  const { currentUser } = useAuth()
  if (!currentUser) {
    return <Navigate to="/login" replace />
  }
  if (currentUser.role === 'customer') {
    return <Navigate to="/portal" replace />
  }
  return children
}

// Role Guard for Customer Portal
function CustomerRoute({ children }) {
  const { currentUser } = useAuth()
  if (!currentUser) {
    return <Navigate to="/login" replace />
  }
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <CatalogProvider>
        <Router>
          <Routes>
            {/* Public Authentication Routes */}
            <Route path="/signup" element={<SignUp />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Customer Portal Route */}
            <Route
              path="/portal"
              element={
                <CustomerRoute>
                  <CustomerPortal />
                </CustomerRoute>
              }
            />

            {/* Internal Admin & Staff Dashboard Routes */}
            <Route
              path="/"
              element={
                <InternalRoute>
                  <DashboardLayout />
                </InternalRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="products" element={<Products />} />
              <Route path="plans" element={<Plans />} />
              <Route path="customers" element={<Customers />} />
              <Route path="subscriptions" element={<Subscriptions />} />
              <Route path="invoices" element={<Invoices />} />
              <Route path="payments" element={<Payments />} />
              <Route path="discounts" element={<Discounts />} />
              <Route path="reports" element={<Reports />} />
              <Route path="staff" element={<Staff />} />
            </Route>

            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Router>
      </CatalogProvider>
    </AuthProvider>
  )
}
