import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import DashboardLayout from './layouts/DashboardLayout'

// Pages
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

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard"     element={<Dashboard />} />
          <Route path="products"      element={<Products />} />
          <Route path="plans"         element={<Plans />} />
          <Route path="customers"     element={<Customers />} />
          <Route path="subscriptions" element={<Subscriptions />} />
          <Route path="invoices"      element={<Invoices />} />
          <Route path="payments"      element={<Payments />} />
          <Route path="discounts"     element={<Discounts />} />
          <Route path="reports"       element={<Reports />} />
          <Route path="staff"         element={<Staff />} />
        </Route>
      </Routes>
    </Router>
  )
}
