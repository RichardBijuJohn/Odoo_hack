import React, { createContext, useContext, useState, useEffect } from 'react';

const INITIAL_PRODUCTS = [
  {
    id: 1,
    code: 'PRD-001',
    name: 'Brightloop Core License',
    type: 'Software',
    salesPrice: 499.00,
    costPrice: 120.00,
    notes: 'Primary SaaS billing and invoicing engine for small to mid businesses.',
    status: 'Active',
    variants: [
      { id: 'v1', attribute: 'Brand', value: 'Brightloop Standard', priceDelta: 0 },
      { id: 'v2', attribute: 'Brand', value: 'Odoo Powered', priceDelta: 560 }
    ]
  },
  {
    id: 2,
    code: 'PRD-002',
    name: 'POS Terminal Connector',
    type: 'Hardware',
    salesPrice: 199.00,
    costPrice: 90.00,
    notes: 'Syncs point-of-sale subscriptions with recurring monthly charges.',
    status: 'Active',
    variants: [
      { id: 'v3', attribute: 'Brand', value: 'Generic', priceDelta: 0 },
      { id: 'v4', attribute: 'Brand', value: 'Odoo Certified', priceDelta: 560 }
    ]
  }
];

const INITIAL_PLANS = [
  {
    id: 1,
    code: 'PLN-001',
    productId: 1,
    productName: 'Brightloop Core License',
    name: 'Monthly Growth Tier',
    billingCycle: 'monthly', // daily, weekly, monthly, yearly
    price: 99.00,
    minQuantity: 1,
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    autoCloseOnEnd: true,
    canCloseEarly: true,
    canPause: true,
    canRenew: true,
    status: 'Active'
  },
  {
    id: 2,
    code: 'PLN-002',
    productId: 1,
    productName: 'Brightloop Core License',
    name: 'Annual Enterprise Plan',
    billingCycle: 'yearly',
    price: 999.00,
    minQuantity: 5,
    startDate: '2026-01-01',
    endDate: '2027-12-31',
    autoCloseOnEnd: false,
    canCloseEarly: false,
    canPause: true,
    canRenew: true,
    status: 'Active'
  },
  {
    id: 3,
    code: 'PLN-003',
    productId: 2,
    productName: 'POS Terminal Connector',
    name: 'Weekly Flexible Pilot',
    billingCycle: 'weekly',
    price: 35.00,
    minQuantity: 1,
    startDate: '2026-03-01',
    endDate: '2026-06-30',
    autoCloseOnEnd: true,
    canCloseEarly: true,
    canPause: false,
    canRenew: true,
    status: 'Active'
  }
];

const INITIAL_SUBSCRIPTIONS = [
  {
    id: 101,
    customerEmail: 'client@acme.com',
    customerName: 'Acme Studio Inc.',
    planName: 'Monthly Growth Tier',
    productName: 'Brightloop Core License (Odoo Powered)',
    billingCycle: 'monthly',
    price: 659.00, // base 99 + 560
    quantity: 1,
    startDate: '2026-02-01',
    endDate: '2026-12-31',
    status: 'active', // active, paused, closed
    autoCloseOnEnd: true,
    canCloseEarly: true,
    canPause: true,
    canRenew: true
  },
  {
    id: 102,
    customerEmail: 'client@acme.com',
    customerName: 'Acme Studio Inc.',
    planName: 'Weekly Flexible Pilot',
    productName: 'POS Terminal Connector',
    billingCycle: 'weekly',
    price: 35.00,
    quantity: 2,
    startDate: '2026-03-10',
    endDate: '2026-06-30',
    status: 'active',
    autoCloseOnEnd: true,
    canCloseEarly: true,
    canPause: false,
    canRenew: true
  }
];

const INITIAL_INVOICES = [
  {
    id: 'INV-2026-001',
    customerEmail: 'client@acme.com',
    customerName: 'Acme Studio Inc.',
    subscriptionId: 101,
    description: 'Brightloop Core License (Odoo Powered) - Monthly',
    amount: 659.00,
    tax: 0.00,
    total: 659.00,
    status: 'paid', // paid, pending, cancelled
    issueDate: '2026-02-01',
    dueDate: '2026-02-15'
  },
  {
    id: 'INV-2026-002',
    customerEmail: 'client@acme.com',
    customerName: 'Acme Studio Inc.',
    subscriptionId: 101,
    description: 'Brightloop Core License (Odoo Powered) - Monthly Renewal',
    amount: 659.00,
    tax: 0.00,
    total: 659.00,
    status: 'paid',
    issueDate: '2026-03-01',
    dueDate: '2026-03-15'
  },
  {
    id: 'INV-2026-003',
    customerEmail: 'client@acme.com',
    customerName: 'Acme Studio Inc.',
    subscriptionId: 102,
    description: 'Weekly Flexible Pilot (Qty: 2)',
    amount: 70.00,
    tax: 0.00,
    total: 70.00,
    status: 'pending',
    issueDate: '2026-03-10',
    dueDate: '2026-03-24'
  }
];

const CatalogContext = createContext(null);

export const CatalogProvider = ({ children }) => {
  const [products, setProducts] = useState(() => {
    const saved = localStorage.getItem('bl_products');
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });

  const [plans, setPlans] = useState(() => {
    const saved = localStorage.getItem('bl_plans');
    return saved ? JSON.parse(saved) : INITIAL_PLANS;
  });

  const [subscriptions, setSubscriptions] = useState(() => {
    const saved = localStorage.getItem('bl_subscriptions');
    return saved ? JSON.parse(saved) : INITIAL_SUBSCRIPTIONS;
  });

  const [invoices, setInvoices] = useState(() => {
    const saved = localStorage.getItem('bl_invoices');
    return saved ? JSON.parse(saved) : INITIAL_INVOICES;
  });

  useEffect(() => {
    localStorage.setItem('bl_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('bl_plans', JSON.stringify(plans));
  }, [plans]);

  useEffect(() => {
    localStorage.setItem('bl_subscriptions', JSON.stringify(subscriptions));
  }, [subscriptions]);

  useEffect(() => {
    localStorage.setItem('bl_invoices', JSON.stringify(invoices));
  }, [invoices]);

  // Product Actions
  const addProduct = (productData) => {
    const newProduct = {
      ...productData,
      id: Date.now(),
      code: `PRD-${String(products.length + 1).padStart(3, '0')}`,
      status: 'Active'
    };
    setProducts(prev => [newProduct, ...prev]);
    return newProduct;
  };

  // Plan Actions
  const addPlan = (planData) => {
    const newPlan = {
      ...planData,
      id: Date.now(),
      code: `PLN-${String(plans.length + 1).padStart(3, '0')}`,
      status: 'Active'
    };
    setPlans(prev => [newPlan, ...prev]);
    return newPlan;
  };

  // Subscription Lifecycle Controls
  const togglePauseSubscription = (subId) => {
    setSubscriptions(prev => prev.map(sub => {
      if (sub.id === subId) {
        if (!sub.canPause) {
          throw new Error('This plan does not permit pausing.');
        }
        return {
          ...sub,
          status: sub.status === 'paused' ? 'active' : 'paused'
        };
      }
      return sub;
    }));
  };

  const closeSubscriptionEarly = (subId) => {
    setSubscriptions(prev => prev.map(sub => {
      if (sub.id === subId) {
        if (!sub.canCloseEarly) {
          throw new Error('This plan does not permit early closure.');
        }
        return { ...sub, status: 'closed' };
      }
      return sub;
    }));
  };

  const renewSubscription = (subId) => {
    setSubscriptions(prev => prev.map(sub => {
      if (sub.id === subId) {
        if (!sub.canRenew) {
          throw new Error('This plan cannot be renewed.');
        }
        return { ...sub, status: 'active' };
      }
      return sub;
    }));
  };

  return (
    <CatalogContext.Provider
      value={{
        products,
        plans,
        subscriptions,
        invoices,
        addProduct,
        addPlan,
        togglePauseSubscription,
        closeSubscriptionEarly,
        renewSubscription
      }}
    >
      {children}
    </CatalogContext.Provider>
  );
};

export const useCatalog = () => {
  const context = useContext(CatalogContext);
  if (!context) {
    throw new Error('useCatalog must be used within a CatalogProvider');
  }
  return context;
};
