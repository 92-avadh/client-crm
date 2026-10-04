import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  TrendingUp,
  Building2,
  CheckSquare,
  Clock,
  Calendar,
  Plus,
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const {
    currentUser,
    brands,
    invoices,
    payments,
    expenses,
    tasks,
    meetings,
    setActiveTab,
  } = useApp();

  const role = currentUser.role;

  const totalReceived = payments.reduce((a, p) => a + p.amount, 0);
  const totalExpenses = expenses.reduce((a, e) => a + e.amount, 0);
  const netProfit     = totalReceived - totalExpenses;
  const netMargin     = totalReceived > 0 ? Math.round((netProfit / totalReceived) * 100) : 0;
  const totalPending  = invoices
    .filter(i => i.status === 'Sent' || i.status === 'Overdue')
    .reduce((a, i) => a + (i.totalAmount - i.paidAmount), 0);

  const activeBrands  = brands.filter(b => b.status === 'Active');
  const relevantTasks = role === 'team' ? tasks.filter(t => t.assigneeId === currentUser.id) : tasks;
  const pendingTasks  = relevantTasks.filter(t => t.status !== 'Completed');
  const myMeetings    = meetings.filter(m => role === 'team' ? m.attendeeIds.includes(currentUser.id) : true);

  const months = [
    { label: 'Jul 26', income: 380000, exp: 210000 },
    { label: 'Aug 26', income: 450000, exp: 245000 },
    { label: 'Sep 26', income: 540000, exp: 268500 },
    { label: 'Oct 26', income: 472000, exp: 268500, current: true },
  ];
  const maxRevenue = 600000;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

      {/* ── Page Header ────────────────────────────────────── */}
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        style={{ paddingBottom: 24, borderBottom: '1px solid #e2e2e2' }}
      >
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: '#0a0a0a', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            Good morning, {currentUser.name.split(' ')[0]}
          </h1>
          <p style={{ fontSize: 13, color: '#909090', marginTop: 4 }}>
            {new Date().toLocaleDateString('en-IN', {
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
            })}
          </p>
        </div>

        {(role === 'admin' || role === 'hr') && (
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button onClick={() => setActiveTab('clients')} className="btn-primary">
              <Plus className="w-3.5 h-3.5" /> Onboard Client
            </button>
            <button onClick={() => setActiveTab('invoices')} className="btn-secondary">
              <Plus className="w-3.5 h-3.5" /> Create Invoice
            </button>
          </div>
        )}
      </div>

      {/* ── Financial KPIs ──────────────────────────────────── */}
      {role === 'admin' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {[
            { label: 'Total Collections', value: `₹${totalReceived.toLocaleString('en-IN')}`, sub: 'All payments received' },
            { label: 'Pending / Overdue',  value: `₹${totalPending.toLocaleString('en-IN')}`,  sub: 'Awaiting clearance' },
            { label: 'Total Expenses',     value: `₹${totalExpenses.toLocaleString('en-IN')}`,  sub: 'Salaries & tools' },
            { label: 'Net Agency Profit',  value: `₹${netProfit.toLocaleString('en-IN')}`,      sub: `${netMargin}% net margin`, strong: true },
          ].map((c, i) => (
            <div
              key={i}
              className="stat-card"
              style={c.strong ? { border: '1.5px solid #0a0a0a' } : {}}
            >
              <div className="metric-label" style={{ marginBottom: 12 }}>{c.label}</div>
              <div className="metric-value">{c.value}</div>
              <div style={{ fontSize: 11, color: '#909090', marginTop: 6 }}>{c.sub}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Operational KPIs ────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {[
          { label: 'Active Clients',     value: activeBrands.length,  icon: <Building2 className="w-4 h-4" /> },
          { label: 'Total Tasks',        value: tasks.length,          icon: <CheckSquare className="w-4 h-4" /> },
          { label: 'Pending Tasks',      value: pendingTasks.length,   icon: <Clock className="w-4 h-4" /> },
          { label: 'Meetings Scheduled', value: myMeetings.length,     icon: <Calendar className="w-4 h-4" /> },
        ].map((k, i) => (
          <div key={i} className="stat-card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div
              style={{
                width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: '#f0f0f0', border: '1px solid #e2e2e2', color: '#525252',
              }}
            >
              {k.icon}
            </div>
            <div>
              <div className="metric-value" style={{ fontSize: '1.5rem' }}>{k.value}</div>
              <div className="metric-label">{k.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Revenue Chart + Brand Share ─────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>

        {/* Revenue bars */}
        <div className="glass-panel" style={{ padding: '24px 28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0a0a0a' }}>Monthly Revenue (FY 26–27)</h3>
              <p style={{ fontSize: 12, color: '#909090', marginTop: 3 }}>Retainer billing vs agency costs</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 11, color: '#909090' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 10, height: 10, borderRadius: 3, background: '#0a0a0a', display: 'block' }} />
                Collections
              </span>
              {role === 'admin' && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 3, background: '#d4d4d4', display: 'block' }} />
                  Expenses
                </span>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {months.map((m, i) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: m.current ? 700 : 500, color: m.current ? '#0a0a0a' : '#909090' }}>
                    {m.label}{m.current ? ' · current' : ''}
                  </span>
                  <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#0a0a0a' }}>
                    ₹{m.income.toLocaleString('en-IN')}
                    {role === 'admin' && (
                      <span style={{ color: '#909090', fontWeight: 400, fontSize: 11, marginLeft: 8 }}>
                        — ₹{m.exp.toLocaleString('en-IN')}
                      </span>
                    )}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <div className="progress-track" style={{ height: 6, position: 'relative' }}>
                    <div
                      className="progress-fill"
                      style={{ width: `${Math.round((m.income / maxRevenue) * 100)}%`, background: '#0a0a0a' }}
                    />
                  </div>
                  {role === 'admin' && (
                    <div className="progress-track" style={{ height: 4, position: 'relative' }}>
                      <div
                        className="progress-fill"
                        style={{ width: `${Math.round((m.exp / maxRevenue) * 100)}%`, background: '#d4d4d4' }}
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 24, paddingTop: 18, borderTop: '1px solid #e2e2e2', display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#909090' }}>
            <span>Avg retainer / client: ₹1,23,000/mo</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontWeight: 700, color: '#0a0a0a' }}>
              <TrendingUp className="w-3.5 h-3.5" /> +24% YoY
            </span>
          </div>
        </div>

        {/* Brand Revenue Share */}
        <div className="glass-panel" style={{ padding: '24px 24px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0a0a0a' }}>Revenue Share</h3>
            <button
              onClick={() => setActiveTab('clients')}
              style={{ fontSize: 12, fontWeight: 600, color: '#909090', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              View all
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>
            {brands.map(b => {
              const total = brands.reduce((a, x) => a + x.monthlyFee, 0);
              const pct   = Math.round((b.monthlyFee / total) * 100);
              return (
                <div key={b.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7, fontSize: 12 }}>
                    <span style={{ fontWeight: 500, color: '#0a0a0a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 150 }}>{b.name}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', color: '#909090' }}>{pct}%</span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid #e2e2e2', display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
            <span style={{ color: '#909090' }}>Retention health</span>
            <span style={{ fontWeight: 700, color: '#0a0a0a' }}>84% Strong</span>
          </div>
        </div>
      </div>

      {/* ── Pending Tasks + Meetings ────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, paddingBottom: 24 }}>

        {/* Pending Tasks */}
        <div className="glass-panel" style={{ padding: '24px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0a0a0a' }}>Pending Tasks</h3>
            <button
              onClick={() => setActiveTab('tasks')}
              style={{ fontSize: 12, fontWeight: 600, color: '#909090', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Full Board →
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {pendingTasks.slice(0, 5).map(t => (
              <div
                key={t.id}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '11px 14px', borderRadius: 8,
                  background: '#f7f7f7', border: '1px solid #e2e2e2', gap: 12,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, minWidth: 0 }}>
                  <div
                    style={{
                      width: 6, height: 6, borderRadius: 9999, marginTop: 4, flexShrink: 0,
                      background: t.priority === 'Urgent' ? '#ef4444' : t.priority === 'High' ? '#f59e0b' : '#d4d4d4',
                    }}
                  />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#0a0a0a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {t.title}
                    </div>
                    <div style={{ fontSize: 11, color: '#909090', marginTop: 2 }}>Due {t.dueDate} · {t.priority}</div>
                  </div>
                </div>
                <span className="badge badge-neutral" style={{ flexShrink: 0 }}>{t.status}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Meetings */}
        <div className="glass-panel" style={{ padding: '24px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0a0a0a' }}>Upcoming Meetings</h3>
            <button
              onClick={() => setActiveTab('meetings')}
              style={{ fontSize: 12, fontWeight: 600, color: '#909090', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Full Calendar →
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {myMeetings.slice(0, 4).map(m => (
              <div
                key={m.id}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '11px 14px', borderRadius: 8,
                  background: '#f7f7f7', border: '1px solid #e2e2e2', gap: 12,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                  <div
                    style={{
                      width: 34, height: 34, borderRadius: 8, flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: '#ebebeb', border: '1px solid #e2e2e2',
                    }}
                  >
                    <Calendar className="w-4 h-4" style={{ color: '#525252' }} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#0a0a0a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {m.title}
                    </div>
                    <div style={{ fontSize: 11, color: '#909090', marginTop: 2 }}>{m.date} · {m.time}</div>
                  </div>
                </div>
                <a
                  href={m.linkOrLocation}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 700,
                    color: '#0a0a0a', textDecoration: 'none', flexShrink: 0,
                    background: '#ebebeb', border: '1px solid #d4d4d4',
                  }}
                >
                  Join
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
