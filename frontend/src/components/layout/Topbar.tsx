import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Bell,
  Search,
  ChevronDown,
  CheckCircle,
  AlertTriangle,
  Building2,
  Receipt,
  CheckSquare,
  FolderKanban,
  UserCheck,
  X,
  ArrowRight,
  LogOut
} from 'lucide-react';

export const Topbar: React.FC = () => {
  const {
    currentUser,
    logout,
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    setActiveTab,
    retentionAlerts,
    brands,
    invoices,
    tasks,
    projects,
    leads,
    setSelectedBrandId,
    setSelectedInvoiceId,
  } = useApp();

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [search, setSearch] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (notifRef.current && !notifRef.current.contains(target)) setShowNotifMenu(false);
      if (userRef.current && !userRef.current.contains(target)) setShowUserMenu(false);
      if (searchRef.current && !searchRef.current.contains(target)) setIsSearchFocused(false);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsSearchFocused(false);
        setShowUserMenu(false);
        setShowNotifMenu(false);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        const input = searchRef.current?.querySelector('input');
        input?.focus();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const unread = notifications.filter(n => !n.isRead);

  const roleLabel: Record<string, string> = {
    admin: 'Admin',
    hr: 'Manager',
    team: 'Team',
    brand: 'Client',
  };

  // Search query calculations
  const query = search.trim().toLowerCase();
  const showResults = isSearchFocused && query.length > 0;

  const matchedBrands = query
    ? brands.filter(
        b =>
          b.name.toLowerCase().includes(query) ||
          b.ownerName.toLowerCase().includes(query) ||
          (b.gstNumber && b.gstNumber.toLowerCase().includes(query))
      ).slice(0, 3)
    : [];

  const matchedInvoices = query
    ? invoices.filter(
        inv =>
          inv.invoiceNumber.toLowerCase().includes(query) ||
          inv.brandName.toLowerCase().includes(query) ||
          inv.totalAmount.toString().includes(query)
      ).slice(0, 3)
    : [];

  const matchedTasks = query
    ? tasks.filter(
        t =>
          t.title.toLowerCase().includes(query) ||
          (t.description && t.description.toLowerCase().includes(query))
      ).slice(0, 3)
    : [];

  const matchedProjects = query
    ? projects.filter(
        p =>
          p.name.toLowerCase().includes(query) ||
          (p.scope && p.scope.toLowerCase().includes(query))
      ).slice(0, 3)
    : [];

  const matchedLeads = query
    ? leads.filter(
        l =>
          (l.name && l.name.toLowerCase().includes(query)) ||
          (l.company && l.company.toLowerCase().includes(query)) ||
          (l.contact && l.contact.toLowerCase().includes(query))
      ).slice(0, 3)
    : [];

  const totalResults =
    matchedBrands.length +
    matchedInvoices.length +
    matchedTasks.length +
    matchedProjects.length +
    matchedLeads.length;

  return (
    <header
      style={{
        height: 56,
        background: '#ffffff',
        borderBottom: '1px solid #D0E0EF',
        display: 'grid',
        gridTemplateColumns: '1fr auto 1fr',
        alignItems: 'center',
        gap: 16,
        padding: '0 24px',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        flexShrink: 0,
      }}
    >
      {/* ── Left spacer ── */}
      <div />

      {/* ── Centre: Search Bar with Active Results Popover ── */}
      <div ref={searchRef} style={{ position: 'relative', width: 420 }}>
        <Search
          style={{
            position: 'absolute',
            left: 12,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 14,
            height: 14,
            color: isSearchFocused ? '#0a0a0a' : '#888888',
            pointerEvents: 'none',
            transition: 'color 0.15s ease',
          }}
        />
        <input
          type="text"
          placeholder="Search clients, invoices, tasks, leads… (Ctrl+K)"
          value={search}
          onChange={e => setSearch(e.target.value)}
          onFocus={() => setIsSearchFocused(true)}
          style={{
            width: '100%',
            height: 36,
            paddingLeft: 34,
            paddingRight: search ? 32 : 14,
            fontSize: 13,
            fontFamily: 'var(--font-sans)',
            background: isSearchFocused ? '#ffffff' : '#f8fafc',
            border: isSearchFocused ? '1.5px solid #00C058' : '1px solid #D0E0EF',
            borderRadius: 8,
            color: '#0A2540',
            outline: 'none',
            boxShadow: isSearchFocused ? '0 0 0 3px rgba(0, 192, 88, 0.15)' : 'none',
            transition: 'all 0.15s ease',
          }}
        />

        {search && (
          <button
            onClick={() => {
              setSearch('');
              setIsSearchFocused(false);
            }}
            style={{
              position: 'absolute',
              right: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              padding: 2,
              cursor: 'pointer',
              color: '#888888',
              display: 'flex',
              alignItems: 'center',
            }}
            title="Clear search"
          >
            <X style={{ width: 14, height: 14 }} />
          </button>
        )}

        {/* Search Results Dropdown */}
        {showResults && (
          <div
            className="animate-fade-in"
            style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              left: 0,
              right: 0,
              background: '#ffffff',
              border: '1px solid #e2e2e2',
              borderRadius: 10,
              boxShadow: '0 12px 32px rgba(0,0,0,0.12)',
              zIndex: 100,
              maxHeight: 420,
              overflowY: 'auto',
              padding: '6px 0',
            }}
          >
            {totalResults === 0 ? (
              <div style={{ padding: '24px 16px', textAlign: 'center' }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#0a0a0a' }}>
                  No results found
                </p>
                <p style={{ fontSize: 11, color: '#777777', marginTop: 4 }}>
                  No clients, invoices, or tasks matching "{search}"
                </p>
              </div>
            ) : (
              <div>
                {/* Clients */}
                {matchedBrands.length > 0 && (
                  <div>
                    <div
                      style={{
                        padding: '6px 14px',
                        fontSize: 10,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        color: '#888888',
                        background: '#fafafa',
                        borderBottom: '1px solid #f0f0f0',
                      }}
                    >
                      Clients ({matchedBrands.length})
                    </div>
                    {matchedBrands.map(b => (
                      <div
                        key={b.id}
                        onClick={() => {
                          setSelectedBrandId(b.id);
                          setActiveTab('clients');
                          setIsSearchFocused(false);
                          setSearch('');
                        }}
                        style={{
                          padding: '8px 14px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer',
                          borderBottom: '1px solid #f5f5f5',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#f5f5f5')}
                        onMouseLeave={e => (e.currentTarget.style.background = '#ffffff')}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <Building2 style={{ width: 14, height: 14, color: '#555555' }} />
                          <div>
                            <span style={{ fontSize: 12, fontWeight: 700, color: '#0a0a0a' }}>
                              {b.name}
                            </span>
                            <span style={{ fontSize: 11, color: '#777777', marginLeft: 8 }}>
                              {b.ownerName}
                            </span>
                          </div>
                        </div>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 600,
                            padding: '2px 6px',
                            borderRadius: 4,
                            background: '#f0f0f0',
                            color: '#333333',
                          }}
                        >
                          {b.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Invoices */}
                {matchedInvoices.length > 0 && (
                  <div>
                    <div
                      style={{
                        padding: '6px 14px',
                        fontSize: 10,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        color: '#888888',
                        background: '#fafafa',
                        borderBottom: '1px solid #f0f0f0',
                      }}
                    >
                      Invoices ({matchedInvoices.length})
                    </div>
                    {matchedInvoices.map(inv => (
                      <div
                        key={inv.id}
                        onClick={() => {
                          setSelectedInvoiceId(inv.id);
                          setActiveTab('invoices');
                          setIsSearchFocused(false);
                          setSearch('');
                        }}
                        style={{
                          padding: '8px 14px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer',
                          borderBottom: '1px solid #f5f5f5',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#f5f5f5')}
                        onMouseLeave={e => (e.currentTarget.style.background = '#ffffff')}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <Receipt style={{ width: 14, height: 14, color: '#555555' }} />
                          <div>
                            <span
                              style={{
                                fontSize: 12,
                                fontWeight: 700,
                                color: '#0a0a0a',
                                fontFamily: 'var(--font-mono)',
                              }}
                            >
                              {inv.invoiceNumber}
                            </span>
                            <span style={{ fontSize: 11, color: '#777777', marginLeft: 8 }}>
                              {inv.brandName}
                            </span>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div
                            className="font-amount"
                            style={{
                              fontSize: 12,
                              fontWeight: 800,
                              color: '#0a0a0a',
                            }}
                          >
                            ₹{inv.totalAmount.toLocaleString('en-IN')}
                          </div>
                          <div style={{ fontSize: 10, color: '#777777' }}>{inv.status}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Tasks & Deliverables */}
                {matchedTasks.length > 0 && (
                  <div>
                    <div
                      style={{
                        padding: '6px 14px',
                        fontSize: 10,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        color: '#888888',
                        background: '#fafafa',
                        borderBottom: '1px solid #f0f0f0',
                      }}
                    >
                      Tasks & Deliverables ({matchedTasks.length})
                    </div>
                    {matchedTasks.map(t => (
                      <div
                        key={t.id}
                        onClick={() => {
                          setActiveTab('tasks');
                          setIsSearchFocused(false);
                          setSearch('');
                        }}
                        style={{
                          padding: '8px 14px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer',
                          borderBottom: '1px solid #f5f5f5',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#f5f5f5')}
                        onMouseLeave={e => (e.currentTarget.style.background = '#ffffff')}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <CheckSquare style={{ width: 14, height: 14, color: '#555555' }} />
                          <span style={{ fontSize: 12, fontWeight: 600, color: '#0a0a0a' }}>
                            {t.title}
                          </span>
                        </div>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 600,
                            padding: '2px 6px',
                            borderRadius: 4,
                            background: '#f0f0f0',
                            color: '#333333',
                          }}
                        >
                          {t.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Projects */}
                {matchedProjects.length > 0 && (
                  <div>
                    <div
                      style={{
                        padding: '6px 14px',
                        fontSize: 10,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        color: '#888888',
                        background: '#fafafa',
                        borderBottom: '1px solid #f0f0f0',
                      }}
                    >
                      Projects ({matchedProjects.length})
                    </div>
                    {matchedProjects.map(p => (
                      <div
                        key={p.id}
                        onClick={() => {
                          setActiveTab('projects');
                          setIsSearchFocused(false);
                          setSearch('');
                        }}
                        style={{
                          padding: '8px 14px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer',
                          borderBottom: '1px solid #f5f5f5',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#f5f5f5')}
                        onMouseLeave={e => (e.currentTarget.style.background = '#ffffff')}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <FolderKanban style={{ width: 14, height: 14, color: '#555555' }} />
                          <span style={{ fontSize: 12, fontWeight: 600, color: '#0a0a0a' }}>
                            {p.name}
                          </span>
                        </div>
                        <ArrowRight style={{ width: 12, height: 12, color: '#888888' }} />
                      </div>
                    ))}
                  </div>
                )}

                {/* Leads */}
                {matchedLeads.length > 0 && (
                  <div>
                    <div
                      style={{
                        padding: '6px 14px',
                        fontSize: 10,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        color: '#888888',
                        background: '#fafafa',
                        borderBottom: '1px solid #f0f0f0',
                      }}
                    >
                      Leads Pipeline ({matchedLeads.length})
                    </div>
                    {matchedLeads.map(l => (
                      <div
                        key={l.id}
                        onClick={() => {
                          setActiveTab('leads');
                          setIsSearchFocused(false);
                          setSearch('');
                        }}
                        style={{
                          padding: '8px 14px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer',
                          borderBottom: '1px solid #f5f5f5',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#f5f5f5')}
                        onMouseLeave={e => (e.currentTarget.style.background = '#ffffff')}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <UserCheck style={{ width: 14, height: 14, color: '#555555' }} />
                          <div>
                            <span style={{ fontSize: 12, fontWeight: 600, color: '#0a0a0a' }}>
                              {l.company || l.name}
                            </span>
                            <span style={{ fontSize: 11, color: '#777777', marginLeft: 8 }}>
                              {l.name}
                            </span>
                          </div>
                        </div>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 600,
                            padding: '2px 6px',
                            borderRadius: 4,
                            background: '#f0f0f0',
                            color: '#333333',
                          }}
                        >
                          {l.stage}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Right: Actions ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}>
        {/* Churn pill */}
        {retentionAlerts.length > 0 && currentUser.role !== 'brand' && (
          <button
            onClick={() => setActiveTab('retention')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              height: 32,
              padding: '0 12px',
              fontSize: 12,
              fontWeight: 600,
              fontFamily: 'var(--font-sans)',
              color: '#333333',
              background: '#f7f7f7',
              border: '1px solid #d4d4d4',
              borderRadius: 8,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            <AlertTriangle style={{ width: 13, height: 13 }} />
            {retentionAlerts.length} Churn Risk
          </button>
        )}

        {/* Bell */}
        <div style={{ position: 'relative' }} ref={notifRef}>
          <button
            onClick={() => {
              setShowNotifMenu(!showNotifMenu);
              setShowUserMenu(false);
            }}
            style={{
              position: 'relative',
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#f7f7f7',
              border: '1px solid #e2e2e2',
              borderRadius: 8,
              cursor: 'pointer',
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = '#c8c8c8')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = '#e2e2e2')}
          >
            <Bell style={{ width: 14, height: 14, color: '#555' }} />
            {unread.length > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: -3,
                  right: -3,
                  width: 15,
                  height: 15,
                  borderRadius: 9999,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 9,
                  fontWeight: 900,
                  background: '#0A2540',
                  color: '#fff',
                  boxShadow: '0 0 0 2px #fff',
                }}
              >
                {unread.length}
              </span>
            )}
          </button>

          {showNotifMenu && (
            <div
              className="animate-fade-in"
              style={{
                position: 'absolute',
                right: 0,
                top: 'calc(100% + 8px)',
                width: 300,
                borderRadius: 12,
                overflow: 'hidden',
                background: '#fff',
                border: '1px solid #e2e2e2',
                boxShadow: '0 12px 32px rgba(0,0,0,.10)',
                zIndex: 100,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 16px',
                  borderBottom: '1px solid #e2e2e2',
                }}
              >
                <span style={{ fontSize: 12, fontWeight: 700, color: '#0a0a0a' }}>
                  Notifications
                </span>
                {unread.length > 0 && (
                  <button
                    onClick={markAllNotificationsAsRead}
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: '#888888',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div style={{ maxHeight: 260, overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: 20, textAlign: 'center', fontSize: 12, color: '#888888' }}>
                    No notifications
                  </div>
                ) : (
                  notifications.map(n => (
                    <div
                      key={n.id}
                      onClick={() => {
                        markNotificationAsRead(n.id);
                        if (n.linkModule) setActiveTab(n.linkModule);
                        setShowNotifMenu(false);
                      }}
                      style={{
                        padding: '12px 16px',
                        cursor: 'pointer',
                        borderBottom: '1px solid #f0f0f0',
                        background: !n.isRead ? '#f9f9f9' : '#fff',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#f5f5f5')}
                      onMouseLeave={e =>
                        (e.currentTarget.style.background = !n.isRead ? '#f9f9f9' : '#fff')
                      }
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          marginBottom: 3,
                          gap: 8,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: '#0a0a0a',
                            lineHeight: 1.4,
                          }}
                        >
                          {n.title}
                        </span>
                        <span
                          style={{
                            fontSize: 10,
                            color: '#888888',
                            whiteSpace: 'nowrap',
                            flexShrink: 0,
                          }}
                        >
                          {n.timestamp}
                        </span>
                      </div>
                      <p style={{ fontSize: 11, color: '#666666', lineHeight: 1.5 }}>
                        {n.message}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Menu */}
        <div style={{ position: 'relative' }} ref={userRef}>
          <button
            onClick={() => {
              setShowUserMenu(!showUserMenu);
              setShowNotifMenu(false);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              height: 32,
              paddingLeft: 6,
              paddingRight: 10,
              background: '#f7f7f7',
              border: '1px solid #e2e2e2',
              borderRadius: 8,
              cursor: 'pointer',
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = '#c8c8c8')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = '#e2e2e2')}
          >
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              style={{
                width: 22,
                height: 22,
                borderRadius: 5,
                objectFit: 'cover',
                border: '1px solid #d4d4d4',
              }}
            />
            <div style={{ textAlign: 'left', lineHeight: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#0a0a0a' }}>
                {currentUser.name.split(' ')[0]}
              </div>
              <div style={{ fontSize: 10, color: '#888888', marginTop: 2 }}>
                {roleLabel[currentUser.role]}
              </div>
            </div>
            <ChevronDown style={{ width: 12, height: 12, color: '#888888' }} />
          </button>

          {showUserMenu && (
            <div
              className="animate-fade-in"
              style={{
                position: 'absolute',
                right: 0,
                top: 'calc(100% + 8px)',
                width: 252,
                borderRadius: 12,
                overflow: 'hidden',
                background: '#fff',
                border: '1px solid #e2e2e2',
                boxShadow: '0 12px 32px rgba(0,0,0,.10)',
                zIndex: 100,
              }}
            >
              {/* User info banner */}
              <div style={{ padding: '14px 14px 12px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: 10 }}>
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 9,
                    objectFit: 'cover',
                    border: '1px solid #e2e2e2',
                  }}
                />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div className="truncate" style={{ fontSize: 13, fontWeight: 750, color: '#0a0a0a' }}>
                    {currentUser.name}
                  </div>
                  <div style={{ fontSize: 11, color: '#888888', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {currentUser.email}
                  </div>
                  <div style={{ marginTop: 4 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', background: '#f0f0f0', padding: '2px 7px', borderRadius: 4, color: '#525252' }}>
                      {roleLabel[currentUser.role] || currentUser.role}
                    </span>
                  </div>
                </div>
              </div>

              {/* Navigation links */}
              <div style={{ padding: 6, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <button
                  onClick={() => {
                    setActiveTab('settings');
                    setShowUserMenu(false);
                  }}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 8,
                    textAlign: 'left',
                    fontSize: 12,
                    fontWeight: 500,
                    color: '#525252',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#f7f7f7')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                >
                  Settings & Account
                </button>
              </div>

              {/* Logout button */}
              <div style={{ padding: 6, borderTop: '1px solid #f0f0f0' }}>
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    logout();
                  }}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 8,
                    textAlign: 'left',
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#dc2626',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontFamily: 'inherit',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#fef2f2')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                >
                  <LogOut style={{ width: 14, height: 14 }} />
                  Log Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
