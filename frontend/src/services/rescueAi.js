// Subscription Rescue AI - Churn Probability & Risk Scoring Engine

/**
 * Calculates churn risk probability based on 5 key signals:
 * 1. Inactivity / Usage drop (days since last active)
 * 2. Payment failures (recent failed invoice attempts)
 * 3. Plan downgrades (downgrade history)
 * 4. Support friction (support tickets / complaints count)
 * 5. Approaching renewal proximity (days until renewal)
 */
export function calculateChurnScore(customer) {
  let score = 0;
  const factors = [];

  // 1. Inactivity (0-30 points)
  if (customer.daysSinceLastActive >= 45) {
    score += 30;
    factors.push({ name: 'Prolonged Inactivity', weight: 30, desc: `${customer.daysSinceLastActive} days without login` });
  } else if (customer.daysSinceLastActive >= 20) {
    score += 18;
    factors.push({ name: 'Reduced Usage', weight: 18, desc: `${customer.daysSinceLastActive} days since last activity` });
  } else if (customer.daysSinceLastActive <= 5) {
    score -= 10; // active user bonus
  }

  // 2. Failed Payments (0-35 points)
  if (customer.failedPayments >= 2) {
    score += 35;
    factors.push({ name: 'Repeated Payment Failures', weight: 35, desc: `${customer.failedPayments} failed transaction attempts` });
  } else if (customer.failedPayments === 1) {
    score += 15;
    factors.push({ name: 'Recent Payment Issue', weight: 15, desc: '1 failed payment alert' });
  }

  // 3. Plan Downgrades (0-20 points)
  if (customer.hasDowngraded) {
    score += 20;
    factors.push({ name: 'Recent Plan Downgrade', weight: 20, desc: 'Downgraded from higher tier within last 60 days' });
  }

  // 4. Support Tickets / Dissatisfaction (0-25 points)
  if (customer.supportTickets >= 4) {
    score += 25;
    factors.push({ name: 'High Support Friction', weight: 25, desc: `${customer.supportTickets} tickets logged this month` });
  } else if (customer.supportTickets >= 2) {
    score += 12;
    factors.push({ name: 'Moderate Support Issues', weight: 12, desc: `${customer.supportTickets} support inquiries` });
  }

  // 5. Approaching Renewal with risk signals (0-15 points)
  if (customer.daysUntilRenewal <= 7 && customer.daysUntilRenewal >= 0) {
    score += 15;
    factors.push({ name: 'Imminent Renewal Window', weight: 15, desc: `Renewal due in ${customer.daysUntilRenewal} days` });
  } else if (customer.daysUntilRenewal <= 14 && customer.daysUntilRenewal >= 0) {
    score += 8;
    factors.push({ name: 'Upcoming Renewal', weight: 8, desc: `Renewal due in ${customer.daysUntilRenewal} days` });
  }

  // Clamp probability between 5% and 98%
  const probability = Math.min(Math.max(score, 5), 98);

  let riskLevel = 'Low';
  let badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  let primaryReason = 'Regular payments & steady product usage';

  if (probability >= 70) {
    riskLevel = 'High';
    badgeColor = 'bg-rose-50 text-rose-700 border-rose-200';
    primaryReason = factors[0]?.name || 'Repeated payment failures';
  } else if (probability >= 40) {
    riskLevel = 'Medium';
    badgeColor = 'bg-amber-50 text-amber-700 border-amber-200';
    primaryReason = factors[0]?.name || 'Reduced usage & engagement';
  }

  // Generate dynamic, context-aware Rescue Recommendations
  const recommendedActions = generateRescueActions({ ...customer, riskLevel, probability, factors });

  return {
    probability,
    riskLevel,
    badgeColor,
    primaryReason,
    factors,
    recommendedActions
  };
}

export function generateRescueActions(customer) {
  const actions = [];

  // High risk payment failures
  if (customer.failedPayments > 0) {
    actions.push({
      id: 'fix_payment',
      title: 'Payment Grace & Alternative Gateway',
      type: 'payment',
      impact: '+42% Recovery Rate',
      description: 'Dispatch 1-click update payment method email with a 7-day grace extension.',
      actionLabel: 'Send Payment Recovery Link'
    });
  }

  // Reduced usage / Inactivity
  if (customer.daysSinceLastActive >= 20) {
    actions.push({
      id: 'reengage_discount',
      title: 'Offer Retention Discount (25% off 3 mo)',
      type: 'discount',
      impact: '+35% Retention Lift',
      description: 'Offer an automated retention discount applied directly to next billing cycle.',
      actionLabel: 'Apply 25% Retention Coupon'
    });
    actions.push({
      id: 'executive_call',
      title: 'Schedule 1-on-1 Customer Success Check-in',
      type: 'cs_outreach',
      impact: 'High Touch Value',
      description: 'Prompt dedicated account manager to assist customer with onboarding roadblocks.',
      actionLabel: 'Assign CS Outreach'
    });
  }

  // Plan downgrade or cost sensitivity
  if (customer.hasDowngraded || customer.riskLevel === 'High') {
    actions.push({
      id: 'cheaper_tier',
      title: 'Recommend Optimized Budget Tier',
      type: 'plan_switch',
      impact: 'Prevents Complete Churn',
      description: 'Suggest tailored lower tier with essential features rather than losing subscriber.',
      actionLabel: 'Pitch Tailored Starter Plan'
    });
  }

  // Imminent renewal
  if (customer.daysUntilRenewal <= 14) {
    actions.push({
      id: 'renewal_reminder_perk',
      title: 'Send Early Renewal Perk & VIP Upgrade',
      type: 'perk',
      impact: '+28% Early Confirmation',
      description: 'Reward on-time renewal with 10GB extra cloud quota or premium plugin module.',
      actionLabel: 'Send VIP Renewal Offer'
    });
  }

  // Default fallback for medium/low
  if (actions.length === 0) {
    actions.push({
      id: 'nps_survey',
      title: 'Automated Satisfaction Pulse Check',
      type: 'survey',
      impact: 'Continuous Health',
      description: 'Send micro-survey asking what features they would love to see next.',
      actionLabel: 'Send 1-Click Pulse Check'
    });
  }

  return actions;
}

export function calculateFinancialStress(customer) {
  const delayedPayments = customer.delayedPayments || 0;
  const partialPayments = customer.partialPayments || 0;
  const outstandingInvoices = customer.outstandingInvoices || 0;
  const averageDaysLate = customer.averageDaysLate || 0;
  let score = 0;
  const signals = [];

  if (delayedPayments >= 3) {
    score += 35;
    signals.push({ label: 'Repeated delays', value: `${delayedPayments} delayed payments`, tone: 'rose' });
  } else if (delayedPayments > 0) {
    score += 18;
    signals.push({ label: 'Delayed payment', value: `${delayedPayments} delayed payment${delayedPayments === 1 ? '' : 's'}`, tone: 'amber' });
  }
  if (partialPayments > 0) {
    score += Math.min(partialPayments * 12, 24);
    signals.push({ label: 'Partial payments', value: `${partialPayments} recent partial payment${partialPayments === 1 ? '' : 's'}`, tone: 'amber' });
  }
  if (outstandingInvoices > 0) {
    score += Math.min(outstandingInvoices * 15, 30);
    signals.push({ label: 'Outstanding invoices', value: `${outstandingInvoices} invoice${outstandingInvoices === 1 ? '' : 's'} open`, tone: 'rose' });
  }
  if (averageDaysLate >= 14) {
    score += 15;
    signals.push({ label: 'Growing lateness', value: `Usually ${averageDaysLate} days late`, tone: 'rose' });
  } else if (averageDaysLate >= 7) {
    score += 8;
    signals.push({ label: 'Payment timing', value: `Usually ${averageDaysLate} days late`, tone: 'amber' });
  }

  const riskLevel = score >= 60 ? 'High' : score >= 30 ? 'Medium' : 'Low';
  const recommendation = riskLevel === 'High'
    ? 'Send a payment reminder and offer a flexible schedule'
    : riskLevel === 'Medium'
      ? 'Send a friendly reminder before the next due date'
      : 'Continue monitoring payment behaviour';

  return {
    financialStressScore: Math.min(score, 100),
    financialStressLevel: riskLevel,
    financialSignals: signals,
    financialRecommendation: recommendation,
  };
}
