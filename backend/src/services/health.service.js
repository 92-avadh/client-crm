const pool = require('../db');

/**
 * Computes an algorithmic 0-100 Client Health Score for a given brand.
 * 
 * Multi-factor weighting:
 * - 25% Deliverable Velocity: Are tasks completed on time or delayed?
 * - 25% Payment Health: Are invoices cleared on time without overdue aging?
 * - 25% Strategic Cadence: Has a review or meeting taken place in the last 30 days?
 * - 25% Client Feedback: NPS Score (1 to 10 scale)
 */
async function calculateBrandHealth(brandId) {
  const brandRes = await pool.query('SELECT * FROM brands WHERE id = $1', [brandId]);
  if (!brandRes.rows.length) return null;
  const brand = brandRes.rows[0];

  // 1. Deliverable Velocity (25 points)
  const tasksRes = await pool.query(
    'SELECT status, due_date FROM tasks WHERE brand_id = $1',
    [brandId]
  );
  const tasks = tasksRes.rows;
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  let overdueTasks = 0;
  let completedTasks = 0;
  for (const t of tasks) {
    if (t.status === 'Completed') {
      completedTasks++;
    } else if (t.due_date && t.due_date < todayStr && t.status !== 'Completed') {
      overdueTasks++;
    }
  }

  let taskScore = 25;
  let taskDetails = 'All deliverables on track';
  if (tasks.length === 0) {
    taskScore = 20;
    taskDetails = 'No deliverables queued';
  } else if (overdueTasks > 3) {
    taskScore = 5;
    taskDetails = `${overdueTasks} deliverables severely delayed`;
  } else if (overdueTasks > 1) {
    taskScore = 12;
    taskDetails = `${overdueTasks} deliverables past due date`;
  } else if (overdueTasks === 1) {
    taskScore = 18;
    taskDetails = '1 deliverable slightly delayed';
  } else {
    taskScore = 25;
    taskDetails = `${completedTasks} deliverables delivered on time`;
  }

  // 2. Payment Health (25 points)
  const invoicesRes = await pool.query(
    'SELECT status, due_date, total_amount, paid_amount FROM invoices WHERE brand_id = $1',
    [brandId]
  );
  const invoices = invoicesRes.rows;
  let overdueInvoices = 0;
  let paidInvoices = 0;

  for (const inv of invoices) {
    if (inv.status === 'Paid') {
      paidInvoices++;
    } else if (inv.due_date && inv.due_date < todayStr && inv.status !== 'Paid') {
      overdueInvoices++;
    }
  }

  let paymentScore = 25;
  let paymentDetails = 'Invoices cleared promptly';
  if (invoices.length === 0) {
    paymentScore = 22;
    paymentDetails = 'Initial retainer active';
  } else if (overdueInvoices >= 2) {
    paymentScore = 4;
    paymentDetails = `${overdueInvoices} invoices overdue`;
  } else if (overdueInvoices === 1) {
    paymentScore = 12;
    paymentDetails = '1 unpaid invoice past due';
  } else if (brand.payment_status === 'Pending') {
    paymentScore = 15;
    paymentDetails = 'Recent retainer payment pending';
  } else {
    paymentScore = 25;
    paymentDetails = '100% payment punctuality';
  }

  // 3. Strategic Cadence (25 points)
  const meetingsRes = await pool.query(
    'SELECT date FROM meetings WHERE brand_id = $1 ORDER BY date DESC LIMIT 1',
    [brandId]
  );
  let daysSinceMeeting = 999;
  if (meetingsRes.rows.length && meetingsRes.rows[0].date) {
    const meetingDate = new Date(meetingsRes.rows[0].date);
    daysSinceMeeting = Math.max(0, Math.floor((now - meetingDate) / (1000 * 60 * 60 * 24)));
  }

  // Also check brand.last_activity_date
  let daysSinceActivity = 999;
  if (brand.last_activity_date) {
    const actDate = new Date(brand.last_activity_date);
    daysSinceActivity = Math.max(0, Math.floor((now - actDate) / (1000 * 60 * 60 * 24)));
  }
  const effectiveCadenceDays = Math.min(daysSinceMeeting, daysSinceActivity);

  let cadenceScore = 25;
  let cadenceDetails = 'Strategic sync held recently';
  if (effectiveCadenceDays <= 30) {
    cadenceScore = 25;
    cadenceDetails = `Sync held ${effectiveCadenceDays === 0 ? 'today' : `${effectiveCadenceDays}d ago`}`;
  } else if (effectiveCadenceDays <= 60) {
    cadenceScore = 15;
    cadenceDetails = `Last sync was ${effectiveCadenceDays}d ago`;
  } else {
    cadenceScore = 6;
    cadenceDetails = `No strategic review in ${effectiveCadenceDays > 300 ? '90+' : effectiveCadenceDays} days`;
  }

  // 4. Client Feedback / NPS (25 points)
  const nps = brand.nps_score != null ? parseInt(brand.nps_score, 10) : null;
  let feedbackScore = 18; // Default baseline when unrated
  let feedbackDetails = 'Awaiting quarterly NPS rating';

  if (nps != null) {
    if (nps >= 9) {
      feedbackScore = 25;
      feedbackDetails = `Promoter (NPS ${nps}/10)`;
    } else if (nps >= 7) {
      feedbackScore = 18;
      feedbackDetails = `Satisfied (NPS ${nps}/10)`;
    } else if (nps >= 5) {
      feedbackScore = 10;
      feedbackDetails = `Passive / Needs attention (NPS ${nps}/10)`;
    } else {
      feedbackScore = 2;
      feedbackDetails = `Detractor risk (NPS ${nps}/10)`;
    }
  }

  // Total Score (0 - 100)
  const totalScore = Math.min(100, Math.max(0, taskScore + paymentScore + cadenceScore + feedbackScore));

  // Determine Tier and Recommended Action
  let tier = 'Stable';
  let recommendation = {
    actionType: 'retainer_review',
    title: 'Maintain Active Cadence',
    description: 'Account is stable. Continue scheduled milestones and monthly retainer check-ins.',
    suggestedMessage: `Hi ${brand.owner_name}, checking in to confirm everything is progressing smoothly on ${brand.name}. Let us know if you need anything from the team!`,
  };

  if (totalScore < 60) {
    tier = totalScore < 40 ? 'Critical' : 'Warning';
    recommendation = {
      actionType: 'whatsapp_reconnect',
      title: '🚨 Churn Warning: Immediate Touchpoint Required',
      description: `Health score dropped to ${totalScore}/100 due to ${[overdueTasks ? `${overdueTasks} delayed deliverables` : '', overdueInvoices ? 'overdue payments' : '', effectiveCadenceDays > 30 ? 'cadence lapse' : ''].filter(Boolean).join(', ')}. Reach out before monthly churn occurs.`,
      suggestedMessage: `Hi ${brand.owner_name}, hope you're doing well! We noticed a couple of milestones on ${brand.name} need alignment and wanted to ensure you're fully satisfied with our deliverables. Could we jump on a brief 10-minute touchpoint this week?`,
    };
  } else if (totalScore >= 85) {
    tier = 'Expansion';
    recommendation = {
      actionType: 'upsell_expansion',
      title: '🌟 Retainer Expansion & Upsell Opportunity',
      description: `Client is at top-tier ${totalScore}/100 satisfaction with 0 blockers. Optimal time to pitch a retainer scope expansion, Q4 strategic plan, or add-on service.`,
      suggestedMessage: `Hi ${brand.owner_name}, our deliverable velocity and engagement on ${brand.name} have been exceptional this quarter! Given our progress, we've outlined a few high-impact growth initiatives for next month. Would love to present these during our next review.`,
    };
  }

  return {
    brandId: brand.id,
    brandName: brand.name,
    ownerName: brand.owner_name,
    mobile: brand.mobile,
    monthlyFee: parseFloat(brand.monthly_fee || 0),
    currency: brand.currency || 'INR',
    currencySymbol: brand.currency_symbol || '₹',
    totalScore,
    tier,
    breakdown: {
      taskVelocity: { score: taskScore, max: 25, details: taskDetails, overdueTasks, totalTasks: tasks.length },
      paymentHealth: { score: paymentScore, max: 25, details: paymentDetails, overdueInvoices, totalInvoices: invoices.length },
      strategicCadence: { score: cadenceScore, max: 25, details: cadenceDetails, daysSinceReview: effectiveCadenceDays },
      clientFeedback: { score: feedbackScore, max: 25, details: feedbackDetails, nps },
    },
    recommendation,
  };
}

/**
 * Returns health scores for all active brands in the agency.
 */
const { getAgencyId } = require('../utils/agency');

async function getAgencyHealthOverview(user) {
  const agencyId = getAgencyId(user);
  let query = "SELECT id FROM brands WHERE status != 'Churned'";
  const params = [];
  if (user && user.role === 'brand') {
    query += ' AND id = $1';
    params.push(user.brandId || '');
  } else if (user && (user.role === 'admin' || user.role === 'hr')) {
    query += ' AND (agency_id = $1 OR owner_id = $1)';
    params.push(agencyId);
  } else if (user) {
    query += ' AND (agency_id = $1 OR owner_id = $1) AND id IN (SELECT brand_id FROM brand_assignments WHERE member_id = $2)';
    params.push(agencyId, user.id);
  }
  query += ' ORDER BY name ASC';

  const { rows } = await pool.query(query, params);
  const healthList = [];
  for (const r of rows) {
    const health = await calculateBrandHealth(r.id);
    if (health) healthList.push(health);
  }

  const churnRisks = healthList.filter(h => h.totalScore < 60);
  const stable = healthList.filter(h => h.totalScore >= 60 && h.totalScore < 85);
  const expansion = healthList.filter(h => h.totalScore >= 85);
  const avgScore = healthList.length
    ? Math.round(healthList.reduce((acc, h) => acc + h.totalScore, 0) / healthList.length)
    : 100;

  return {
    overview: {
      totalClients: healthList.length,
      averageHealth: avgScore,
      churnRisksCount: churnRisks.length,
      stableCount: stable.length,
      expansionCount: expansion.length,
    },
    scores: healthList,
  };
}

module.exports = { calculateBrandHealth, getAgencyHealthOverview };
