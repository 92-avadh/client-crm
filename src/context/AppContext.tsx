import React, { createContext, useContext, useState, useEffect } from 'react';
import type {
  User,
  Brand,
  Project,
  Task,
  Invoice,
  Payment,
  Expense,
  Meeting,
  Lead,
  AppNotification,
  Conversation,
  ChatMessage,
  AppSettings,
  Holiday,
  AuditLogItem
} from '../types';
import {
  INITIAL_USERS,
  INITIAL_BRANDS,
  INITIAL_PROJECTS,
  INITIAL_TASKS,
  INITIAL_INVOICES,
  INITIAL_PAYMENTS,
  INITIAL_EXPENSES,
  INITIAL_MEETINGS,
  INITIAL_LEADS,
  INITIAL_NOTIFICATIONS,
  INITIAL_CONVERSATIONS,
  INITIAL_MESSAGES,
  INITIAL_SETTINGS,
  INITIAL_HOLIDAYS,
  INITIAL_AUDIT_LOGS
} from '../data/mockData';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface AppContextType {
  currentUser: User;
  switchUser: (userId: string) => void;
  allUsers: User[];
  
  // Navigation
  activeTab: string;
  setActiveTab: (tab: string) => void;
  
  // Brands
  brands: Brand[];
  selectedBrandId: string | null;
  setSelectedBrandId: (id: string | null) => void;
  addBrand: (brandData: Omit<Brand, 'id' | 'onboardingDate' | 'status' | 'assignedMemberIds' | 'lastActivityDate' | 'lastPaymentDate' | 'documents'>) => Brand;
  updateBrand: (id: string, updates: Partial<Brand>) => void;
  assignMembersToBrand: (brandId: string, memberIds: string[]) => void;
  
  // Projects & Tasks
  projects: Project[];
  tasks: Task[];
  addTask: (taskData: Omit<Task, 'id'>) => void;
  updateTaskStatus: (taskId: string, status: Task['status']) => void;
  addProject: (projData: Omit<Project, 'id' | 'progress'>) => void;
  
  // Invoices & Payments
  invoices: Invoice[];
  payments: Payment[];
  selectedInvoiceId: string | null;
  setSelectedInvoiceId: (id: string | null) => void;
  createInvoice: (invoiceData: Omit<Invoice, 'id' | 'invoiceNumber' | 'paidAmount' | 'status'>) => Invoice;
  updateInvoiceStatus: (id: string, status: Invoice['status']) => void;
  recordPayment: (paymentData: Omit<Payment, 'id' | 'status'>) => void;
  simulateRazorpayPayment: (invoiceId: string) => Promise<boolean>;
  
  // Expenses (Admin Only)
  expenses: Expense[];
  addExpense: (expenseData: Omit<Expense, 'id'>) => void;
  
  // Meetings
  meetings: Meeting[];
  addMeeting: (meetingData: Omit<Meeting, 'id'>) => void;
  
  // Leads (CRM)
  leads: Lead[];
  addLead: (leadData: Omit<Lead, 'id'>) => void;
  updateLeadStage: (id: string, stage: Lead['stage']) => void;
  convertLeadToBrand: (leadId: string) => void;
  
  // Notifications
  notifications: AppNotification[];
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  
  // Chat
  conversations: Conversation[];
  activeConversationId: string;
  setActiveConversationId: (id: string) => void;
  messages: Record<string, ChatMessage[]>;
  sendMessage: (conversationId: string, text: string, attachments?: any[]) => void;
  
  // Settings & System
  settings: AppSettings;
  updateSettings: (updates: Partial<AppSettings>) => void;
  holidays: Holiday[];
  auditLogs: AuditLogItem[];
  
  // Retention actions
  retentionAlerts: { brand: Brand; daysInactive: number; isUrgent: boolean }[];
  snoozeBrandRetention: (brandId: string) => void;
  markBrandChurned: (brandId: string) => void;
  logBrandActivity: (brandId: string, actionName: string) => void;
  
  // Toasts
  toasts: Toast[];
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Current user / role
  const [currentUser, setCurrentUser] = useState<User>(() => {
    const saved = localStorage.getItem('retentio_user');
    return saved ? JSON.parse(saved) : INITIAL_USERS[0];
  });
  
  const [allUsers] = useState<User[]>(INITIAL_USERS);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  
  // Entities
  const [brands, setBrands] = useState<Brand[]>(() => {
    const saved = localStorage.getItem('retentio_brands');
    return saved ? JSON.parse(saved) : INITIAL_BRANDS;
  });
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);

  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem('retentio_projects');
    return saved ? JSON.parse(saved) : INITIAL_PROJECTS;
  });

  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('retentio_tasks');
    return saved ? JSON.parse(saved) : INITIAL_TASKS;
  });

  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    const saved = localStorage.getItem('retentio_invoices');
    return saved ? JSON.parse(saved) : INITIAL_INVOICES;
  });
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);

  const [payments, setPayments] = useState<Payment[]>(() => {
    const saved = localStorage.getItem('retentio_payments');
    return saved ? JSON.parse(saved) : INITIAL_PAYMENTS;
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem('retentio_expenses');
    return saved ? JSON.parse(saved) : INITIAL_EXPENSES;
  });

  const [meetings, setMeetings] = useState<Meeting[]>(() => {
    const saved = localStorage.getItem('retentio_meetings');
    return saved ? JSON.parse(saved) : INITIAL_MEETINGS;
  });

  const [leads, setLeads] = useState<Lead[]>(() => {
    const saved = localStorage.getItem('retentio_leads');
    return saved ? JSON.parse(saved) : INITIAL_LEADS;
  });

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const saved = localStorage.getItem('retentio_notifs');
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
  });

  const [conversations, setConversations] = useState<Conversation[]>(INITIAL_CONVERSATIONS);
  const [activeConversationId, setActiveConversationId] = useState<string>('conv_apex');
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>(INITIAL_MESSAGES);

  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('retentio_settings');
    return saved ? JSON.parse(saved) : INITIAL_SETTINGS;
  });

  const [holidays, setHolidays] = useState<Holiday[]>(INITIAL_HOLIDAYS);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>(INITIAL_AUDIT_LOGS);

  const [toasts, setToasts] = useState<Toast[]>([]);

  // Sync to LocalStorage
  useEffect(() => {
    localStorage.setItem('retentio_brands', JSON.stringify(brands));
  }, [brands]);

  useEffect(() => {
    localStorage.setItem('retentio_invoices', JSON.stringify(invoices));
  }, [invoices]);

  useEffect(() => {
    localStorage.setItem('retentio_payments', JSON.stringify(payments));
  }, [payments]);

  useEffect(() => {
    localStorage.setItem('retentio_expenses', JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem('retentio_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('retentio_projects', JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem('retentio_leads', JSON.stringify(leads));
  }, [leads]);

  useEffect(() => {
    localStorage.setItem('retentio_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('retentio_user', JSON.stringify(currentUser));
  }, [currentUser]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const addAuditLog = (action: string, details: string) => {
    const newLog: AuditLogItem = {
      id: `aud_${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      actorName: currentUser.name,
      actorRole: currentUser.role.toUpperCase(),
      action,
      details,
      ipAddress: '103.21.124.50'
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  const switchUser = (userId: string) => {
    const user = allUsers.find(u => u.id === userId);
    if (user) {
      setCurrentUser(user);
      if (user.role === 'brand') {
        setActiveTab('clientPortal');
      } else if (activeTab === 'clientPortal') {
        setActiveTab('dashboard');
      }
      showToast(`Switched persona to ${user.name} (${user.role.toUpperCase()})`, 'info');
    }
  };

  // Retention calculation: compares today's date against lastActivityDate
  const retentionAlerts = brands
    .map(brand => {
      const last = new Date(brand.lastActivityDate);
      const now = new Date('2026-10-04');
      const diffTime = Math.abs(now.getTime() - last.getTime());
      const daysInactive = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      return {
        brand,
        daysInactive,
        isUrgent: daysInactive >= settings.retentionThresholdDays
      };
    })
    .filter(item => item.isUrgent && item.brand.status !== 'Churned');

  const logBrandActivity = (brandId: string, actionName: string) => {
    const today = '2026-10-04';
    setBrands(prev =>
      prev.map(b => (b.id === brandId ? { ...b, lastActivityDate: today, status: b.status === 'Inactive' ? 'Active' : b.status } : b))
    );
    addAuditLog('Client Activity Recorded', `Action "${actionName}" updated last activity for client ID ${brandId}`);
  };

  const snoozeBrandRetention = (brandId: string) => {
    const brand = brands.find(b => b.id === brandId);
    if (brand) {
      logBrandActivity(brandId, 'Retention Alert Snoozed (7 days added)');
      showToast(`Retention reminder for ${brand.name} snoozed by 7 days`, 'info');
    }
  };

  const markBrandChurned = (brandId: string) => {
    setBrands(prev =>
      prev.map(b => (b.id === brandId ? { ...b, status: 'Churned' } : b))
    );
    showToast(`Client marked as Churned`, 'info');
    addAuditLog('Client Churned', `Client ID ${brandId} marked as Churned by ${currentUser.name}`);
  };

  // Brand CRUD
  const addBrand = (brandData: Omit<Brand, 'id' | 'onboardingDate' | 'status' | 'assignedMemberIds' | 'lastActivityDate' | 'lastPaymentDate' | 'documents'>): Brand => {
    const newBrand: Brand = {
      ...brandData,
      id: `brand_${Date.now()}`,
      onboardingDate: '2026-10-04',
      status: 'Active',
      assignedMemberIds: [],
      lastActivityDate: '2026-10-04',
      lastPaymentDate: '2026-10-04',
      documents: []
    };
    setBrands(prev => [newBrand, ...prev]);
    showToast(`Client "${newBrand.name}" onboarded successfully!`, 'success');
    addAuditLog('Client Onboarded', `New client ${newBrand.name} onboarded.`);

    // Notification
    const newNotif: AppNotification = {
      id: `notif_${Date.now()}`,
      type: 'assignment',
      title: '✨ New Client Onboarded',
      message: `${newBrand.name} was successfully onboarded. Assign team members now.`,
      timestamp: 'Just now',
      isRead: false,
      linkModule: 'clients',
      brandId: newBrand.id,
      recipientRoles: ['admin', 'hr']
    };
    setNotifications(prev => [newNotif, ...prev]);

    return newBrand;
  };

  const updateBrand = (id: string, updates: Partial<Brand>) => {
    setBrands(prev =>
      prev.map(b => (b.id === id ? { ...b, ...updates } : b))
    );
    showToast('Client profile updated', 'success');
    addAuditLog('Client Updated', `Client ID ${id} profile modified.`);
  };

  const assignMembersToBrand = (brandId: string, memberIds: string[]) => {
    setBrands(prev =>
      prev.map(b => (b.id === brandId ? { ...b, assignedMemberIds: memberIds } : b))
    );
    const brand = brands.find(b => b.id === brandId);
    showToast(`Team assignments updated for ${brand?.name || 'client'}`, 'success');
    addAuditLog('Team Assigned', `Members assigned to ${brand?.name}: ${memberIds.join(', ')}`);

    // Trigger assignment notification
    const newNotif: AppNotification = {
      id: `notif_${Date.now()}`,
      type: 'assignment',
      title: '👤 Client Assignment Updated',
      message: `Team assignments updated for ${brand?.name || 'client'}.`,
      timestamp: 'Just now',
      isRead: false,
      linkModule: 'clients',
      brandId,
      recipientRoles: ['admin', 'team']
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  // Projects & Tasks
  const addProject = (projData: Omit<Project, 'id' | 'progress'>) => {
    const newProj: Project = {
      ...projData,
      id: `proj_${Date.now()}`,
      progress: 0
    };
    setProjects(prev => [newProj, ...prev]);
    logBrandActivity(newProj.brandId, `New Project: ${newProj.name}`);
    showToast(`Project "${newProj.name}" created`, 'success');
  };

  const addTask = (taskData: Omit<Task, 'id'>) => {
    const newTask: Task = {
      ...taskData,
      id: `task_${Date.now()}`
    };
    setTasks(prev => [newTask, ...prev]);
    logBrandActivity(newTask.brandId, `Task Created: ${newTask.title}`);
    showToast(`Task added`, 'success');
  };

  const updateTaskStatus = (taskId: string, status: Task['status']) => {
    setTasks(prev =>
      prev.map(t => (t.id === taskId ? { ...t, status } : t))
    );
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      logBrandActivity(task.brandId, `Task status changed to ${status}`);
    }
  };

  // Invoices & Payments
  const createInvoice = (invoiceData: Omit<Invoice, 'id' | 'invoiceNumber' | 'paidAmount' | 'status'>): Invoice => {
    const count = invoices.length + 42;
    const invNumber = `${settings.invoicePrefix}${String(count).padStart(4, '0')}`;
    const newInvoice: Invoice = {
      ...invoiceData,
      id: `inv_${Date.now()}`,
      invoiceNumber: invNumber,
      paidAmount: 0,
      status: 'Sent'
    };
    setInvoices(prev => [newInvoice, ...prev]);
    logBrandActivity(newInvoice.brandId, `Invoice ${invNumber} generated`);
    showToast(`Invoice ${invNumber} generated for ${newInvoice.brandName}`, 'success');
    addAuditLog('Invoice Generated', `Created ${invNumber} for ${newInvoice.brandName} totaling ₹${newInvoice.totalAmount.toLocaleString('en-IN')}`);

    // Notification
    const newNotif: AppNotification = {
      id: `notif_${Date.now()}`,
      type: 'invoice',
      title: `📄 New Invoice: ${invNumber}`,
      message: `Invoice for ₹${newInvoice.totalAmount.toLocaleString('en-IN')} sent to ${newInvoice.brandName}.`,
      timestamp: 'Just now',
      isRead: false,
      linkModule: 'invoices',
      recipientRoles: ['admin', 'hr', 'brand']
    };
    setNotifications(prev => [newNotif, ...prev]);

    return newInvoice;
  };

  const updateInvoiceStatus = (id: string, status: Invoice['status']) => {
    setInvoices(prev =>
      prev.map(inv => (inv.id === id ? { ...inv, status } : inv))
    );
  };

  const recordPayment = (paymentData: Omit<Payment, 'id' | 'status'>) => {
    const newPayment: Payment = {
      ...paymentData,
      id: `pay_${Date.now()}`,
      status: 'Success'
    };
    setPayments(prev => [newPayment, ...prev]);

    // Mark invoice as paid
    setInvoices(prev =>
      prev.map(inv => {
        if (inv.id === newPayment.invoiceId) {
          const newPaid = inv.paidAmount + newPayment.amount;
          return {
            ...inv,
            paidAmount: newPaid,
            status: newPaid >= inv.totalAmount ? 'Paid' : 'Partially Paid',
            paymentDate: newPayment.paymentDate,
            paymentMode: newPayment.mode,
            razorpayPaymentId: newPayment.referenceNo
          };
        }
        return inv;
      })
    );

    // Update brand payment date & activity
    setBrands(prev =>
      prev.map(b => (b.id === newPayment.brandId ? { ...b, lastPaymentDate: newPayment.paymentDate, lastActivityDate: '2026-10-04' } : b))
    );

    addAuditLog('Payment Recorded', `Payment of ₹${newPayment.amount.toLocaleString('en-IN')} recorded for ${newPayment.brandName} via ${newPayment.mode}`);
    showToast(`Payment of ₹${newPayment.amount.toLocaleString('en-IN')} successfully recorded!`, 'success');

    // Trigger payment notification
    const newNotif: AppNotification = {
      id: `notif_${Date.now()}`,
      type: 'payment',
      title: `💰 Payment Received: ₹${newPayment.amount.toLocaleString('en-IN')}`,
      message: `${newPayment.brandName} cleared payment via ${newPayment.mode}.`,
      timestamp: 'Just now',
      isRead: false,
      linkModule: 'invoices',
      recipientRoles: ['admin', 'hr']
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const simulateRazorpayPayment = async (invoiceId: string): Promise<boolean> => {
    const targetInvoice = invoices.find(inv => inv.id === invoiceId);
    if (!targetInvoice) return false;

    // Simulate 1.5s gateway processing
    await new Promise(res => setTimeout(res, 1200));

    const rzpId = `pay_rzp_${Math.random().toString(36).substring(2, 11).toUpperCase()}`;
    recordPayment({
      invoiceId: targetInvoice.id,
      brandId: targetInvoice.brandId,
      brandName: targetInvoice.brandName,
      amount: targetInvoice.totalAmount - targetInvoice.paidAmount,
      paymentDate: '2026-10-04',
      mode: 'Razorpay UPI',
      referenceNo: rzpId
    });

    return true;
  };

  // Expenses (Admin Only)
  const addExpense = (expenseData: Omit<Expense, 'id'>) => {
    if (currentUser.role !== 'admin') {
      showToast('Unauthorized: Only Admin can add expenses', 'error');
      return;
    }
    const newExpense: Expense = {
      ...expenseData,
      id: `exp_${Date.now()}`
    };
    setExpenses(prev => [newExpense, ...prev]);
    showToast(`Expense of ₹${newExpense.amount.toLocaleString('en-IN')} added`, 'success');
    addAuditLog('Expense Recorded', `Added expense under ${newExpense.category}: ₹${newExpense.amount.toLocaleString('en-IN')}`);
  };

  // Meetings
  const addMeeting = (meetingData: Omit<Meeting, 'id'>) => {
    const newMeeting: Meeting = {
      ...meetingData,
      id: `meet_${Date.now()}`
    };
    setMeetings(prev => [newMeeting, ...prev]);
    if (newMeeting.brandId) {
      logBrandActivity(newMeeting.brandId, `Scheduled Meeting: ${newMeeting.title}`);
    }
    showToast(`Meeting "${newMeeting.title}" scheduled`, 'success');
  };

  // Leads CRM
  const addLead = (leadData: Omit<Lead, 'id'>) => {
    const newLead: Lead = {
      ...leadData,
      id: `lead_${Date.now()}`
    };
    setLeads(prev => [newLead, ...prev]);
    showToast(`Lead "${newLead.company}" added to pipeline`, 'success');
  };

  const updateLeadStage = (id: string, stage: Lead['stage']) => {
    setLeads(prev =>
      prev.map(l => (l.id === id ? { ...l, stage } : l))
    );
    showToast(`Lead moved to ${stage}`, 'info');
  };

  const convertLeadToBrand = (leadId: string) => {
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return;

    const newBrand = addBrand({
      name: lead.company,
      ownerName: lead.name,
      mobile: lead.phone,
      email: lead.email,
      billingAddress: 'Address pending verification',
      state: 'Maharashtra',
      pincode: '400001',
      serviceDetails: `Retainer converted from Lead pipeline. Notes: ${lead.notes}`,
      monthlyFee: lead.value,
      billingCycleDay: 1
    });

    // Mark lead as won
    updateLeadStage(leadId, 'Won');
    setSelectedBrandId(newBrand.id);
    setActiveTab('clients');
    showToast(`🎉 Converted "${lead.company}" into an active Client profile!`, 'success');
  };

  // Notifications
  const markNotificationAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    showToast('All notifications marked as read', 'info');
  };

  // Chat
  const sendMessage = (conversationId: string, text: string, attachments: any[] = []) => {
    if (!text.trim() && (!attachments || attachments.length === 0)) return;

    const newMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      conversationId,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderRole: currentUser.role,
      text,
      timestamp: 'Just now',
      attachments,
      readBy: [currentUser.id]
    };

    setMessages(prev => ({
      ...prev,
      [conversationId]: [...(prev[conversationId] || []), newMsg]
    }));

    setConversations(prev =>
      prev.map(c => (c.id === conversationId ? { ...c, lastMessage: text, lastMessageTime: 'Just now' } : c))
    );

    // If linked to brand, log activity
    const conv = conversations.find(c => c.id === conversationId);
    if (conv?.brandId) {
      logBrandActivity(conv.brandId, `Chat message from ${currentUser.name}`);
    }
  };

  // Settings
  const updateSettings = (updates: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
    showToast('Settings saved successfully', 'success');
    addAuditLog('Settings Updated', 'Platform settings modified.');
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        switchUser,
        allUsers,
        activeTab,
        setActiveTab,
        brands,
        selectedBrandId,
        setSelectedBrandId,
        addBrand,
        updateBrand,
        assignMembersToBrand,
        projects,
        tasks,
        addTask,
        updateTaskStatus,
        addProject,
        invoices,
        payments,
        selectedInvoiceId,
        setSelectedInvoiceId,
        createInvoice,
        updateInvoiceStatus,
        recordPayment,
        simulateRazorpayPayment,
        expenses,
        addExpense,
        meetings,
        addMeeting,
        leads,
        addLead,
        updateLeadStage,
        convertLeadToBrand,
        notifications,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        conversations,
        activeConversationId,
        setActiveConversationId,
        messages,
        sendMessage,
        settings,
        updateSettings,
        holidays,
        auditLogs,
        retentionAlerts,
        snoozeBrandRetention,
        markBrandChurned,
        logBrandActivity,
        toasts,
        showToast
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
