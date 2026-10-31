import React, { createContext, useContext, useState, useEffect } from 'react';
import { calculateChurnScore } from '../services/rescueAi';

const MOCK_RESCUE_CUSTOMERS = [
  {
    id: 'CUST-001',
    name: 'Customer A (Apex Corp)',
    contact: 'billing@apexcorp.io',
    currentPlan: 'Monthly Growth Tier',
    mrr: 659.00,
    daysSinceLastActive: 12,
    failedPayments: 3,
    hasDowngraded: false,
    supportTickets: 1,
    daysUntilRenewal: 4,
    status: 'at_risk'
  },
  {
    id: 'CUST-002',
    name: 'Customer B (Nexus Logistics)',
    contact: 'ops@nexuslogistics.com',
    currentPlan: 'Annual Enterprise Plan',
    mrr: 999.00,
    daysSinceLastActive: 38,
    failedPayments: 0,
    hasDowngraded: true,
    supportTickets: 3,
    daysUntilRenewal: 18,
    status: 'at_risk'
  },
  {
    id: 'CUST-003',
    name: 'Customer C (Bright Horizon)',
    contact: 'accounts@brighthorizon.co',
    currentPlan: 'Brightloop Standard License',
    mrr: 299.00,
    daysSinceLastActive: 2,
    failedPayments: 0,
    hasDowngraded: false,
    supportTickets: 0,
    daysUntilRenewal: 45,
    status: 'healthy'
  },
  {
    id: 'CUST-004',
    name: 'Customer D (Vortex Media)',
    contact: 'finance@vortexmedia.io',
    currentPlan: 'Weekly Flexible Pilot',
    mrr: 140.00,
    daysSinceLastActive: 28,
    failedPayments: 2,
    hasDowngraded: true,
    supportTickets: 5,
    daysUntilRenewal: 3,
    status: 'critical'
  },
  {
    id: 'CUST-005',
    name: 'Customer E (Zenith FinTech)',
    contact: 'growth@zenithtech.org',
    currentPlan: 'Monthly Growth Tier',
    mrr: 659.00,
    daysSinceLastActive: 1,
    failedPayments: 0,
    hasDowngraded: false,
    supportTickets: 1,
    daysUntilRenewal: 22,
    status: 'healthy'
  },
  {
    id: 'CUST-006',
    name: 'Customer F (CloudForge Systems)',
    contact: 'it@cloudforge.net',
    currentPlan: 'Annual Enterprise Plan',
    mrr: 999.00,
    daysSinceLastActive: 21,
    failedPayments: 1,
    hasDowngraded: false,
    supportTickets: 2,
    daysUntilRenewal: 6,
    status: 'at_risk'
  }
];

const RescueContext = createContext(null);

export const RescueProvider = ({ children }) => {
  const [customers, setCustomers] = useState(() => {
    const saved = localStorage.getItem('bl_rescue_customers');
    return saved ? JSON.parse(saved) : MOCK_RESCUE_CUSTOMERS;
  });

  const [executedActions, setExecutedActions] = useState(() => {
    const saved = localStorage.getItem('bl_rescue_actions');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('bl_rescue_customers', JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem('bl_rescue_actions', JSON.stringify(executedActions));
  }, [executedActions]);

  // Enrich customer records with real-time ML risk scoring
  const enrichedCustomers = customers.map(cust => {
    const analysis = calculateChurnScore(cust);
    return {
      ...cust,
      ...analysis
    };
  });

  // Execute a rescue recommendation action
  const executeRescueAction = (customerId, action) => {
    const customer = customers.find(c => c.id === customerId);
    const newLog = {
      id: 'ACT-' + Date.now(),
      customerId,
      customerName: customer ? customer.name : 'Unknown',
      actionTitle: action.title,
      actionLabel: action.actionLabel,
      type: action.type,
      impact: action.impact,
      executedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setExecutedActions(prev => [newLog, ...prev]);

    // Simulate risk improvement after taking action
    setCustomers(prev => prev.map(c => {
      if (c.id === customerId) {
        return {
          ...c,
          failedPayments: Math.max(0, c.failedPayments - 1),
          daysSinceLastActive: Math.max(1, c.daysSinceLastActive - 10),
          supportTickets: Math.max(0, c.supportTickets - 1)
        };
      }
      return c;
    }));

    return newLog;
  };

  // Simulate cohort ingestion (e.g., analyzing 1,000 subscribers)
  const totalSubscribersAnalyzed = 1000;
  const highRiskCount = enrichedCustomers.filter(c => c.riskLevel === 'High').length;
  const mediumRiskCount = enrichedCustomers.filter(c => c.riskLevel === 'Medium').length;
  const lowRiskCount = enrichedCustomers.filter(c => c.riskLevel === 'Low').length;

  const totalAtRiskMRR = enrichedCustomers
    .filter(c => c.riskLevel !== 'Low')
    .reduce((acc, curr) => acc + curr.mrr, 0);

  return (
    <RescueContext.Provider
      value={{
        customers: enrichedCustomers,
        executedActions,
        executeRescueAction,
        totalSubscribersAnalyzed,
        stats: {
          highRiskCount,
          mediumRiskCount,
          lowRiskCount,
          totalAtRiskMRR
        }
      }}
    >
      {children}
    </RescueContext.Provider>
  );
};

export const useRescue = () => {
  const context = useContext(RescueContext);
  if (!context) {
    throw new Error('useRescue must be used within a RescueProvider');
  }
  return context;
};
