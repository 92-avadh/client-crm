import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Bell,
  Search,
  ChevronDown,
  AlertTriangle,
  Building2,
  Receipt,
  CheckSquare,
  FolderKanban,
  UserCheck,
  X,
  ArrowRight,
  LogOut,
  Menu,
  Moon,
  Sun
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/animate-ui/components/radix/dropdown-menu';
import { useConfirm } from '../../hooks/useConfirm';

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
    sidebarCollapsed,
    toggleSidebar,
    theme,
    toggleTheme,
    toggleMobileSidebar,
  } = useApp();

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [search, setSearch] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const { confirm, element: confirmDialog } = useConfirm();

  const handleLogout = async () => {
    const ok = await confirm({
      title: 'Log out of Retentio?',
      description: 'You will need to sign in again to access your clients and invoices.',
      confirmText: 'Log Out',
      icon: 'logout',
    });
    if (ok) logout();
  };

  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Radix DropdownMenu handles outside-click and Escape for the bell and
    // user menus; only the search popover needs manual handling.
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (searchRef.current && !searchRef.current.contains(target)) setIsSearchFocused(false);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsSearchFocused(false);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        const input = searchRef.current?.querySelector('input');
        input?.focus();
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleSidebar();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const unread = useMemo(() => notifications.filter(n => !n.isRead), [notifications]);

  const roleLabel: Record<string, string> = useMemo(() => ({
    admin: 'Admin',
    hr: 'Manager',
    team: 'Team',
    brand: 'Client',
  }), []);

  // Search query calculations
  const query = search.trim().toLowerCase();
  const showResults = isSearchFocused && query.length > 0;

  const matchedBrands = useMemo(() => {
    if (!query) return [];
    return brands.filter(
      b =>
        b.name.toLowerCase().includes(query) ||
        b.ownerName.toLowerCase().includes(query) ||
        (b.gstNumber && b.gstNumber.toLowerCase().includes(query))
    ).slice(0, 3);
  }, [query, brands]);

  const matchedInvoices = useMemo(() => {
    if (!query) return [];
    return invoices.filter(
      inv =>
        inv.invoiceNumber.toLowerCase().includes(query) ||
        inv.brandName.toLowerCase().includes(query) ||
        inv.totalAmount.toString().includes(query)
    ).slice(0, 3);
  }, [query, invoices]);

  const matchedTasks = useMemo(() => {
    if (!query) return [];
    return tasks.filter(
      t =>
        t.title.toLowerCase().includes(query) ||
        (t.description && t.description.toLowerCase().includes(query))
    ).slice(0, 3);
  }, [query, tasks]);

  const matchedProjects = useMemo(() => {
    if (!query) return [];
    return projects.filter(
      p =>
        p.name.toLowerCase().includes(query) ||
        (p.scope && p.scope.toLowerCase().includes(query))
    ).slice(0, 3);
  }, [query, projects]);

  const matchedLeads = useMemo(() => {
    if (!query) return [];
    return leads.filter(
      l =>
        (l.name && l.name.toLowerCase().includes(query)) ||
        (l.company && l.company.toLowerCase().includes(query)) ||
        (l.contact && l.contact.toLowerCase().includes(query))
    ).slice(0, 3);
  }, [query, leads]);

  const totalResults = useMemo(() =>
    matchedBrands.length +
    matchedInvoices.length +
    matchedTasks.length +
    matchedProjects.length +
    matchedLeads.length,
    [matchedBrands, matchedInvoices, matchedTasks, matchedProjects, matchedLeads]
  );

  // Memoized search result items to prevent unnecessary re-renders
  const SearchResultItem = React.memo(({ item, icon, title, subtitle, meta, onClick, amount, status }: {
    item: any;
    icon: React.ReactNode;
    title: string;
    subtitle?: string;
    meta?: string;
    onClick: () => void;
    amount?: string;
    status?: string;
  }) => (
    <div
      onClick={onClick}
      style={{
        padding: '8px 14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        cursor: 'pointer',
        borderBottom: '1px solid var(--border)',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-raised)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'var(--bg-card)')}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {icon}
        <div>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{title}</span>
          {subtitle && <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 8 }}>{subtitle}</span>}
        </div>
      </div>
      {amount ? (
        <div style={{ textAlign: 'right' }}>
          <div className="font-amount" style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-primary)' }}>{amount}</div>
          {status && <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{status}</div>}
        </div>
      ) : meta ? (
        <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 4, background: 'var(--bg-raised)', color: 'var(--text-primary)' }}>{meta}</span>
      ) : null}
    </div>
  ));

  return (
    <header
      style={{
        height: 62,
        background: 'var(--bg, #ffffff)',
        borderBottom: '1px solid var(--border, #D0E0EF)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 14,
        position: 'sticky',
        top: 0,
        zIndex: 30,
        flexShrink: 0,
      }}
      className="px-5 lg:px-6"
    >
      {/* ── Left: Mobile Menu Toggle (Desktop expand button removed) ── */}
      <div className="flex items-center gap-2">
        <button
          onClick={toggleMobileSidebar}
          title="Open navigation menu"
          className="flex md:hidden"
          style={{
            background: 'var(--bg-raised, #f7f7f7)',
            border: '1px solid var(--border, #D0E0EF)',
            borderRadius: 8,
            cursor: 'pointer',
            padding: '8px 10px',
            color: 'var(--text-primary, #0A2540)',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s ease',
          }}
        >
          <Menu size={20} />
        </button>
      </div>

      {/* ── Centre: Search Bar with Active Results Popover ── */}
      <div ref={searchRef} className="hidden sm:block flex-1 max-w-[460px]" style={{ position: 'relative' }}>
        <Search
          style={{
            position: 'absolute',
            left: 14,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 16,
            height: 16,
            color: isSearchFocused ? 'var(--text-primary, #0a0a0a)' : 'var(--text-muted, #888888)',
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
            height: 42,
            paddingLeft: 40,
            paddingRight: search ? 36 : 14,
            fontSize: 14,
            fontFamily: 'var(--font-sans)',
            background: isSearchFocused ? 'var(--bg, #ffffff)' : 'var(--bg-subtle, #f8fafc)',
            border: isSearchFocused ? '1.5px solid var(--brand-green, #00C058)' : '1px solid var(--border, #D0E0EF)',
            borderRadius: 8,
            color: 'var(--text-primary, #0A2540)',
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
              right: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              padding: 4,
              cursor: 'pointer',
              color: 'var(--text-muted, #888888)',
              display: 'flex',
              alignItems: 'center',
            }}
            title="Clear search"
          >
            <X style={{ width: 16, height: 16 }} />
          </button>
        )}

        {/* Search Results Dropdown */}
        <AnimatePresence>
        {showResults && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -8 }}
            animate={{
              opacity: 1, scale: 1, y: 0,
              transition: { type: 'spring', duration: 0.25, bounce: 0.12 },
            }}
            exit={{
              opacity: 0, scale: 0.95, y: -8,
              transition: { duration: 0.12, ease: 'easeOut' },
            }}
            style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              left: 0,
              right: 0,
              transformOrigin: 'top left',
              background: 'var(--bg-card, #ffffff)',
              border: '1px solid var(--border, #e2e2e2)',
              borderRadius: 12,
              boxShadow: 'var(--shadow-lg, 0 12px 32px rgba(0,0,0,0.12))',
              zIndex: 100,
              maxHeight: 420,
              overflowY: 'auto',
              padding: '6px 0',
            }}
          >
            {totalResults === 0 ? (
              <div style={{ padding: '24px 16px', textAlign: 'center' }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                  No results found
                </p>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
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
                        color: 'var(--text-muted)',
                        background: 'var(--bg-subtle)',
                        borderBottom: '1px solid var(--border)',
                      }}
                    >
                      Clients ({matchedBrands.length})
                    </div>
                    {matchedBrands.map(b => (
                      <SearchResultItem
                        key={b.id}
                        item={b}
                        icon={<Building2 style={{ width: 14, height: 14, color: 'var(--text-primary)' }} />}
                        title={b.name}
                        subtitle={b.ownerName}
                        meta={b.status}
                        onClick={() => {
                          setSelectedBrandId(b.id);
                          setActiveTab('clients');
                          setIsSearchFocused(false);
                          setSearch('');
                        }}
                      />
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
                        color: 'var(--text-muted)',
                        background: 'var(--bg-subtle)',
                        borderBottom: '1px solid var(--border)',
                      }}
                    >
                      Invoices ({matchedInvoices.length})
                    </div>
                    {matchedInvoices.map(inv => (
                      <SearchResultItem
                        key={inv.id}
                        item={inv}
                        icon={<Receipt style={{ width: 14, height: 14, color: 'var(--text-primary)' }} />}
                        title={inv.invoiceNumber}
                        subtitle={inv.brandName}
                        onClick={() => {
                          setSelectedInvoiceId(inv.id);
                          setActiveTab('invoices');
                          setIsSearchFocused(false);
                          setSearch('');
                        }}
                        amount={`₹${inv.totalAmount.toLocaleString('en-IN')}`}
                        status={inv.status}
                      />
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
                        color: 'var(--text-muted)',
                        background: 'var(--bg-subtle)',
                        borderBottom: '1px solid var(--border)',
                      }}
                    >
                      Tasks & Deliverables ({matchedTasks.length})
                    </div>
                    {matchedTasks.map(t => (
                      <SearchResultItem
                        key={t.id}
                        item={t}
                        icon={<CheckSquare style={{ width: 14, height: 14, color: 'var(--text-primary)' }} />}
                        title={t.title}
                        meta={t.status}
                        onClick={() => {
                          setActiveTab('tasks');
                          setIsSearchFocused(false);
                          setSearch('');
                        }}
                      />
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
                        color: 'var(--text-muted)',
                        background: 'var(--bg-subtle)',
                        borderBottom: '1px solid var(--border)',
                      }}
                    >
                      Projects ({matchedProjects.length})
                    </div>
                    {matchedProjects.map(p => (
                      <SearchResultItem
                        key={p.id}
                        item={p}
                        icon={<FolderKanban style={{ width: 14, height: 14, color: 'var(--text-primary)' }} />}
                        title={p.name}
                        onClick={() => {
                          setActiveTab('projects');
                          setIsSearchFocused(false);
                          setSearch('');
                        }}
                      />
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
                        color: 'var(--text-muted)',
                        background: 'var(--bg-subtle)',
                        borderBottom: '1px solid var(--border)',
                      }}
                    >
                      Leads Pipeline ({matchedLeads.length})
                    </div>
                    {matchedLeads.map(l => (
                      <SearchResultItem
                        key={l.id}
                        item={l}
                        icon={<UserCheck style={{ width: 14, height: 14, color: 'var(--text-primary)' }} />}
                        title={l.company || l.name}
                        subtitle={l.name}
                        meta={l.stage}
                        onClick={() => {
                          setActiveTab('leads');
                          setIsSearchFocused(false);
                          setSearch('');
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
        </AnimatePresence>
      </div>

      {/* ── Right: Actions ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'flex-end' }}>
        {/* Churn pill */}
        {retentionAlerts.length > 0 && currentUser.role !== 'brand' && (
          <button
            onClick={() => setActiveTab('retention')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              height: 38,
              padding: '0 14px',
              fontSize: 13,
              fontWeight: 650,
              fontFamily: 'var(--font-sans)',
              color: 'var(--text-primary, #333333)',
              background: 'var(--bg-raised, #f7f7f7)',
              border: '1px solid var(--border-strong, #d4d4d4)',
              borderRadius: 8,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            <AlertTriangle style={{ width: 15, height: 15 }} />
            {retentionAlerts.length} Churn Risk
          </button>
        )}

        {/* Theme Toggle (Dark / Light with Circular Reveal & Icon Animation) */}
        <button
          id="theme-toggle-btn"
          data-theme-toggle="true"
          role="switch"
          aria-checked={theme === 'dark'}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          onClick={(e) => toggleTheme(e)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              toggleTheme(e.currentTarget);
            }
          }}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          style={{
            position: 'relative',
            width: 38,
            height: 38,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg-raised, #f7f7f7)',
            border: '1px solid var(--border, #e2e2e2)',
            borderRadius: 8,
            cursor: 'pointer',
            overflow: 'hidden',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border-strong, #c8c8c8)')}
          onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border, #e2e2e2)')}
        >
          <span
            style={{
              position: 'absolute',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transform: theme === 'dark' ? 'rotate(0deg) scale(1)' : 'rotate(90deg) scale(0)',
              opacity: theme === 'dark' ? 1 : 0,
              transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease',
              pointerEvents: 'none',
            }}
          >
            <Sun size={18} style={{ color: 'var(--warn-text)' }} />
          </span>
          <span
            style={{
              position: 'absolute',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transform: theme === 'dark' ? 'rotate(-90deg) scale(0)' : 'rotate(0deg) scale(1)',
              opacity: theme === 'dark' ? 0 : 1,
              transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease',
              pointerEvents: 'none',
            }}
          >
            <Moon size={18} style={{ color: 'var(--text-secondary)' }} />
          </span>
        </button>

        {/* Bell */}
        <DropdownMenu open={showNotifMenu} onOpenChange={setShowNotifMenu}>
          <DropdownMenuTrigger asChild>
            <button
              style={{
                position: 'relative',
                width: 38,
                height: 38,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--bg-raised, #f7f7f7)',
                border: '1px solid var(--border, #e2e2e2)',
                borderRadius: 8,
                cursor: 'pointer',
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border-strong, #c8c8c8)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border, #e2e2e2)')}
            >
              <Bell style={{ width: 17, height: 17, color: 'var(--text-secondary, #555)' }} />
              {unread.length > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: -3,
                    right: -3,
                    width: 17,
                    height: 17,
                    borderRadius: 9999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 10,
                    fontWeight: 900,
                    background: 'var(--solid-btn-bg)',
                    color: 'var(--solid-btn-text)',
                    boxShadow: '0 0 0 2px var(--bg, #fff)',
                  }}
                >
                  {unread.length}
                </span>
              )}
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            sideOffset={8}
            className="w-[min(330px,calc(100vw-32px))] p-0"
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 18px',
                borderBottom: '1px solid var(--border, #e2e2e2)',
              }}
            >
              <span style={{ fontSize: 13.5, fontWeight: 750, color: 'var(--text-primary, #0a0a0a)' }}>
                Notifications
              </span>
              {unread.length > 0 && (
                <button
                  onClick={markAllNotificationsAsRead}
                  style={{
                    fontSize: 12,
                    fontWeight: 650,
                    color: 'var(--text-muted, #888888)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  Mark all read
                </button>
              )}
            </div>
            <div style={{ maxHeight: 290, overflowY: 'auto' }}>
              {notifications.length === 0 ? (
                <div style={{ padding: 24, textAlign: 'center', fontSize: 13, color: 'var(--text-muted, #888888)' }}>
                  No notifications
                </div>
              ) : (
                notifications.map(n => (
                  <DropdownMenuItem
                    key={n.id}
                    onSelect={() => {
                      markNotificationAsRead(n.id);
                      if (n.linkModule) setActiveTab(n.linkModule);
                    }}
                    style={{
                      padding: '13px 18px',
                      borderRadius: 0,
                      display: 'block',
                      borderBottom: '1px solid var(--border, #f0f0f0)',
                      background: !n.isRead ? 'var(--bg-subtle, #f9f9f9)' : 'transparent',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: 4,
                        gap: 8,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 12.5,
                          fontWeight: 700,
                          color: 'var(--text-primary, #0a0a0a)',
                          lineHeight: 1.4,
                        }}
                      >
                        {n.title}
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          color: 'var(--text-muted, #888888)',
                          whiteSpace: 'nowrap',
                          flexShrink: 0,
                        }}
                      >
                        {n.timestamp}
                      </span>
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary, #666666)', lineHeight: 1.5, margin: 0 }}>
                      {n.message}
                    </p>
                  </DropdownMenuItem>
                ))
              )}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Menu */}
        <DropdownMenu open={showUserMenu} onOpenChange={setShowUserMenu}>
          <DropdownMenuTrigger asChild>
            <button
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 9,
                height: 38,
                paddingLeft: 8,
                paddingRight: 12,
                background: 'var(--bg-raised, #f7f7f7)',
                border: '1px solid var(--border, #e2e2e2)',
                borderRadius: 8,
                cursor: 'pointer',
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border-strong, #c8c8c8)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border, #e2e2e2)')}
            >
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 6,
                  objectFit: 'cover',
                  border: '1px solid var(--border-strong, #d4d4d4)',
                }}
              />
              <div style={{ textAlign: 'left', lineHeight: 1.15 }}>
                <div style={{ fontSize: 13, fontWeight: 750, color: 'var(--text-primary, #0a0a0a)' }}>
                  {currentUser.name.split(' ')[0]}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted, #888888)', marginTop: 2 }}>
                  {roleLabel[currentUser.role]}
                </div>
              </div>
              <ChevronDown style={{ width: 14, height: 14, color: 'var(--text-muted, #888888)' }} />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" sideOffset={8} className="w-[min(268px,calc(100vw-32px))] p-0">
            {/* User info banner */}
            <div style={{ padding: '16px 16px 14px', borderBottom: '1px solid var(--border, #f0f0f0)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 10,
                  objectFit: 'cover',
                  border: '1px solid var(--border, #e2e2e2)',
                }}
              />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div className="truncate" style={{ fontSize: 14, fontWeight: 750, color: 'var(--text-primary, #0a0a0a)' }}>
                  {currentUser.name}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted, #888888)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {currentUser.email}
                </div>
                <div style={{ marginTop: 5 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', background: 'var(--bg-raised, #f0f0f0)', padding: '2px 8px', borderRadius: 4, color: 'var(--text-secondary, #525252)' }}>
                    {roleLabel[currentUser.role] || currentUser.role}
                  </span>
                </div>
              </div>
            </div>

            <DropdownMenuGroup style={{ padding: 6 }}>
              <DropdownMenuItem
                onSelect={() => setActiveTab('settings')}
                style={{ fontSize: 13.5, padding: '10px 12px' }}
              >
                Settings &amp; Account
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator style={{ margin: 0 }} />

            <DropdownMenuGroup style={{ padding: 6 }}>
              <DropdownMenuItem
                variant="destructive"
                onSelect={() => handleLogout()}
                style={{ fontSize: 13.5, fontWeight: 650, padding: '10px 12px' }}
              >
                <LogOut style={{ width: 16, height: 16 }} />
                Log Out
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {confirmDialog}
    </header>
  );
};
