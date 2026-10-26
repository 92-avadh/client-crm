import React, { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { ROUTES } from '../../routes';
import type { TaskPriority, TaskStatus } from '../../types';
import {
  CheckSquare,
  Plus,
  Clock,
  X,
  Loader2,
} from 'lucide-react';
import { AnimatedSelect } from '../ui/AnimatedSelect';
import Pagination from '../ui/Pagination';
import DatePicker from '@/components/ui/DatePicker';

const getDefaultDueDate = () => new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
const getTodayDate = () => new Date().toISOString().split('T')[0];

const inputFieldStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', border: '1px solid var(--border)',
  borderRadius: 10, fontSize: 14, color: 'var(--text-primary)', background: 'var(--bg-subtle)',
  outline: 'none', boxSizing: 'border-box',
};
const btnPrimary: React.CSSProperties = {
  padding: '9px 16px', background: 'var(--solid-btn-bg)', color: 'var(--solid-btn-text)', border: 'none',
  borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer',
  display: 'inline-flex', alignItems: 'center', gap: 6,
};
const btnSecondary: React.CSSProperties = {
  padding: '9px 16px', background: 'var(--bg-raised)', color: 'var(--text-primary)',
  border: '1px solid var(--border)', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer',
  display: 'inline-flex', alignItems: 'center', gap: 6,
};
const modalOverlay: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'var(--overlay)', zIndex: 1000,
  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
};

export const ProjectsAndTasks: React.FC = () => {
  const {
    currentUser,
    projects,
    tasks,
    brands,
    allUsers,
    addTask,
    updateTaskStatus,
    addProject,
    setActiveTab: setNavTab
  } = useApp();

  const role = currentUser.role;

  // Derive the pane from the URL so /tasks and /projects are real, linkable,
  // refresh-safe routes instead of both defaulting to the Tasks pane.
  const { pathname } = useLocation();
  const activeTab: 'tasks' | 'projects' = pathname === ROUTES.projects ? 'projects' : 'tasks';
  const setActiveTab = (tab: 'tasks' | 'projects') => setNavTab(tab);
  const [taskView, setTaskView] = useState<'kanban' | 'list'>('kanban');
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [showAddProjectModal, setShowAddProjectModal] = useState(false);

  const [taskForm, setTaskForm] = useState({
    brandId: brands[0]?.id || '',
    title: '',
    description: '',
    assigneeId: allUsers.find((u) => u.role === 'team')?.id || currentUser.id,
    dueDate: getDefaultDueDate(),
    priority: 'High' as TaskPriority,
    status: 'To Do' as TaskStatus
  });

  const [projectForm, setProjectForm] = useState({
    brandId: brands[0]?.id || '',
    name: '',
    scope: '',
    startDate: getTodayDate(),
    endDate: '',
    status: 'In progress' as any,
    assignedMemberIds: [] as string[],
    billingAmount: 0
  });

  const [isSubmittingTask, setIsSubmittingTask] = useState(false);
  const [isSubmittingProject, setIsSubmittingProject] = useState(false);

  const handleAddTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskForm.title) return;
    try {
      setIsSubmittingTask(true);
      await addTask(taskForm);
      setTaskPage(0);
      setShowAddTaskModal(false);
      setTaskForm({
        brandId: brands[0]?.id || '',
        title: '',
        description: '',
        assigneeId: allUsers.find((u) => u.role === 'team')?.id || currentUser.id,
        dueDate: getDefaultDueDate(),
        priority: 'High' as TaskPriority,
        status: 'To Do' as TaskStatus
      });
    } finally {
      setIsSubmittingTask(false);
    }
  };

  const handleAddProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectForm.name) return;
    try {
      setIsSubmittingProject(true);
      await addProject({ ...projectForm, billingAmount: Number(projectForm.billingAmount) || 0 });
      setProjectPage(0);
      setShowAddProjectModal(false);
      setProjectForm({
        brandId: brands[0]?.id || '',
        name: '',
        scope: '',
        startDate: getTodayDate(),
        endDate: '',
        status: 'In progress' as any,
        assignedMemberIds: [] as string[],
        billingAmount: 0
      });
    } finally {
      setIsSubmittingProject(false);
    }
  };

  const safeTasks = (tasks || []).filter(Boolean);
  const relevantTasks =
    role === 'team'
      ? safeTasks.filter((t) => t && currentUser && t.assigneeId === currentUser.id)
      : safeTasks;

  /* ── Pagination for the list view (kanban shows every card) ── */
  const [taskPage, setTaskPage] = useState(0);
  const [taskPageSize, setTaskPageSize] = useState(20);
  const taskPageCount = Math.max(1, Math.ceil(relevantTasks.length / taskPageSize));
  useEffect(() => {
    if (taskPage > taskPageCount - 1) setTaskPage(taskPageCount - 1);
  }, [taskPage, taskPageCount]);
  const pagedTasks = useMemo(
    () => relevantTasks.slice(taskPage * taskPageSize, (taskPage + 1) * taskPageSize),
    [relevantTasks, taskPage, taskPageSize]
  );

  /* ── Pagination for the projects grid ── */
  const [projectPage, setProjectPage] = useState(0);
  const [projectPageSize, setProjectPageSize] = useState(12);
  const safeProjects = (projects || []).filter(Boolean);
  const projectPageCount = Math.max(1, Math.ceil(safeProjects.length / projectPageSize));
  useEffect(() => {
    if (projectPage > projectPageCount - 1) setProjectPage(projectPageCount - 1);
  }, [projectPage, projectPageCount]);
  const pagedProjects = useMemo(
    () => safeProjects.slice(projectPage * projectPageSize, (projectPage + 1) * projectPageSize),
    [safeProjects, projectPage, projectPageSize]
  );

  const kanbanColumns: TaskStatus[] = ['To Do', 'In Progress', 'In Review', 'Completed'];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* ── Page Header */}
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        style={{ paddingBottom: 24, borderBottom: '1px solid var(--border)' }}
      >
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            Projects &amp; Task Deliverables
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
            Track client milestones, statutory deadlines, CA audits, and retention activities.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap w-fit self-start sm:self-auto">
          {(role === 'admin' || role === 'hr') && (
            <button onClick={() => setShowAddProjectModal(true)} style={btnSecondary}>
              <Plus style={{ width: 14, height: 14 }} />
              <span>New Project</span>
            </button>
          )}
          <button onClick={() => setShowAddTaskModal(true)} style={btnPrimary}>
            <Plus style={{ width: 14, height: 14 }} />
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10,
          background: 'var(--bg-card)', borderRadius: 12, padding: '6px 10px', border: '1px solid var(--border)',
        }}
      >
        <div className="no-scrollbar" style={{ display: 'flex', gap: 6, overflowX: 'auto', WebkitOverflowScrolling: 'touch', maxWidth: '100%' }}>
          <button
            onClick={() => setActiveTab('tasks')}
            style={{ flexShrink: 0, whiteSpace: 'nowrap', padding: '8px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer', borderRadius: 8, border: 'none', background: activeTab === 'tasks' ? 'var(--solid-btn-bg)' : 'transparent', color: activeTab === 'tasks' ? 'var(--solid-btn-text)' : 'var(--text-secondary)' }}
          >
            Tasks &amp; Deliverables ({relevantTasks.length})
          </button>
          <button
            onClick={() => setActiveTab('projects')}
            style={{ flexShrink: 0, whiteSpace: 'nowrap', padding: '8px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer', borderRadius: 8, border: 'none', background: activeTab === 'projects' ? 'var(--solid-btn-bg)' : 'transparent', color: activeTab === 'projects' ? 'var(--solid-btn-text)' : 'var(--text-secondary)' }}
          >
            Active Projects ({projects.length})
          </button>
        </div>

        {activeTab === 'tasks' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button
              onClick={() => setTaskView('kanban')}
              style={{ padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none', background: taskView === 'kanban' ? 'var(--bg-raised)' : 'transparent', color: taskView === 'kanban' ? 'var(--text-primary)' : 'var(--text-muted)' }}
            >
              Kanban Board
            </button>
            <button
              onClick={() => setTaskView('list')}
              style={{ padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none', background: taskView === 'list' ? 'var(--bg-raised)' : 'transparent', color: taskView === 'list' ? 'var(--text-primary)' : 'var(--text-muted)' }}
            >
              List View
            </button>
          </div>
        )}
      </div>

      {/* Kanban Board View */}
      {activeTab === 'tasks' && taskView === 'kanban' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
          {kanbanColumns.map((column) => {
            const colTasks = relevantTasks.filter((t) => t && t.status === column);

            return (
              <div
                key={column}
                style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', minHeight: 560 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 12, borderBottom: '1px solid var(--border)', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)' }}>{column}</span>
                    <span style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--bg-raised)', color: 'var(--text-primary)', fontWeight: 700, fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {colTasks.length}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1, overflowY: 'auto' }}>
                  {colTasks.map((task) => {
                    const brand = (brands || []).find((b) => b && b.id === task?.brandId);
                    const assignee = (allUsers || []).find((u) => u && u.id === task?.assigneeId);

                    return (
                      <div
                        key={task.id}
                        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: 14, display: 'flex', flexDirection: 'column', gap: 10, transition: 'border-color 0.15s, box-shadow 0.15s' }}
                        onMouseEnter={e => {
                          e.currentTarget.style.borderColor = 'var(--text-primary)';
                          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.borderColor = 'var(--border)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: task.priority === 'Urgent' ? 'var(--solid-btn-bg)' : 'var(--bg-raised)', color: task.priority === 'Urgent' ? 'var(--solid-btn-text)' : 'var(--text-primary)' }}>
                            {task.priority}
                          </span>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 120 }}>
                            {brand?.name}
                          </span>
                        </div>

                        <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.4, margin: 0 }}>
                          {task.title}
                        </h4>

                        {task.description && (
                          <p style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', margin: 0 }}>
                            {task.description}
                          </p>
                        )}

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px solid var(--border)', fontSize: 11, color: 'var(--text-muted)' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Clock style={{ width: 12, height: 12, color: 'var(--text-muted)' }} />
                            {task.dueDate}
                          </span>

                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            {assignee && (
                              <img
                                src={assignee.avatar}
                                alt={assignee.name}
                                title={assignee.name}
                                style={{ width: 20, height: 20, borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border)' }}
                              />
                            )}

                            <select
                              value={task?.status || 'To Do'}
                              onChange={(e) => updateTaskStatus(task.id, e.target.value as TaskStatus)}
                              style={{ fontSize: 10, background: 'var(--bg-subtle)', color: 'var(--text-primary)', borderRadius: 4, border: '1px solid var(--border)', padding: '2px 4px', outline: 'none', cursor: 'pointer' }}
                            >
                              {kanbanColumns.map((st) => (
                                <option key={st} value={st}>{st}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* List View */}
      {activeTab === 'tasks' && taskView === 'list' && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Task Title</th>
                <th>Client</th>
                <th>Priority</th>
                <th>Due Date</th>
                <th>Assignee</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {pagedTasks.map((t) => {
                const brand = brands.find((b) => b.id === t.brandId);
                const assignee = allUsers.find((u) => u.id === t.assigneeId);
                return (
                  <tr key={t.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 13 }}>{t.title}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{t.description}</div>
                    </td>
                    <td style={{ color: 'var(--text-primary)', fontSize: 12, fontWeight: 500 }}>{brand?.name}</td>
                    <td>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: t.priority === 'Urgent' ? 'var(--solid-btn-bg)' : 'var(--bg-raised)', color: t.priority === 'Urgent' ? 'var(--solid-btn-text)' : 'var(--text-primary)' }}>
                        {t.priority}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: 12, fontFamily: 'var(--font-mono)' }}>{t.dueDate}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {assignee && (
                          <img
                            src={assignee.avatar}
                            alt={assignee.name}
                            style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'cover' }}
                          />
                        )}
                        <span style={{ fontSize: 12, color: 'var(--text-primary)' }}>{assignee?.name}</span>
                      </div>
                    </td>
                    <td>
                      <select
                        value={t?.status || 'To Do'}
                        onChange={(e) => updateTaskStatus(t.id, e.target.value as TaskStatus)}
                        style={{ fontSize: 11, padding: '4px 8px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-subtle)', color: 'var(--text-primary)', outline: 'none', cursor: 'pointer' }}
                      >
                        {kanbanColumns.map((st) => (
                          <option key={st} value={st}>{st}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <Pagination
            page={taskPage}
            pageSize={taskPageSize}
            total={relevantTasks.length}
            onPageChange={setTaskPage}
            onPageSizeChange={(n) => {
              setTaskPageSize(n);
              setTaskPage(0);
            }}
          />
        </div>
      )}

      {/* Projects Tab */}
      {activeTab === 'projects' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))', gap: 16 }}>
          {(pagedProjects || []).map((proj) => {
            const brand = (brands || []).find((b) => b && b.id === proj?.brandId);
            return (
              <div
                key={proj.id}
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', gap: 16, transition: 'border-color 0.15s, box-shadow 0.15s' }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'var(--text-primary)';
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.06)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>
                      {brand?.name}
                    </span>
                    <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', marginTop: 2, marginBottom: 0 }}>{proj.name}</h3>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: 'var(--bg-raised)', color: 'var(--text-primary)' }}>
                    {proj?.status || 'In progress'}
                  </span>
                </div>

                <p style={{ fontSize: 12, color: 'var(--text-secondary)', background: 'var(--bg-subtle)', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', lineHeight: 1.5, margin: 0 }}>
                  {proj.scope}
                </p>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>
                    <span>Deliverable Progress</span>
                    <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{proj.progress}%</span>
                  </div>
                  <div style={{ width: '100%', height: 6, background: 'var(--bg-raised)', borderRadius: 9999, overflow: 'hidden' }}>
                    <div style={{ width: `${proj.progress}%`, height: '100%', background: 'var(--solid-btn-bg)', borderRadius: 9999, transition: 'width 0.4s ease' }} />
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)', paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                  <span>Timeline: {proj.startDate} → {proj.endDate}</span>
                  {role !== 'team' && proj.billingAmount && (
                    <span className="font-amount" style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: 13 }}>
                      ₹{proj.billingAmount.toLocaleString('en-IN')}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'projects' && safeProjects.length > 0 && (
        <Pagination
          page={projectPage}
          pageSize={projectPageSize}
          total={safeProjects.length}
          onPageChange={setProjectPage}
          onPageSizeChange={(n) => {
            setProjectPageSize(n);
            setProjectPage(0);
          }}
        />
      )}

      {/* Add Task Modal */}
      {showAddTaskModal && (
        <div style={modalOverlay} onClick={() => setShowAddTaskModal(false)}>
          <div
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 18, width: '100%', maxWidth: 480, boxShadow: '0 24px 60px rgba(0,0,0,0.18)', overflow: 'hidden' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Add New Client Task</h3>
                <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2, marginBottom: 0 }}>Activity will be logged to client timeline</p>
              </div>
              <button
                onClick={() => setShowAddTaskModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}
              >
                <X style={{ width: 16, height: 16 }} />
              </button>
            </div>

            <form onSubmit={handleAddTaskSubmit} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14, fontSize: 12 }}>
              <AnimatedSelect
                label="Client"
                required
                value={taskForm.brandId}
                onChange={(val) => setTaskForm({ ...taskForm, brandId: val })}
                options={brands.map((b) => ({ value: b.id, label: b.name }))}
              />

              <div>
                <label style={{ display: 'block', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>Task Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Verify GSTR-3B monthly return"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  style={inputFieldStyle}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>Details / Scope</label>
                <textarea
                  rows={2}
                  placeholder="Specific requirements..."
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  style={inputFieldStyle}
                ></textarea>
              </div>

              <div className="rg-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                <AnimatedSelect
                  label="Priority"
                  value={taskForm.priority}
                  onChange={(val) => setTaskForm({ ...taskForm, priority: val as TaskPriority })}
                  options={[
                    { value: 'Urgent', label: 'Urgent' },
                    { value: 'High', label: 'High' },
                    { value: 'Medium', label: 'Medium' },
                    { value: 'Low', label: 'Low' },
                  ]}
                />

                <div>
                  <DatePicker
                    label="Due Date"
                    required
                    value={taskForm.dueDate}
                    onChange={(date) => setTaskForm({ ...taskForm, dueDate: date })}
                    placeholder="Select due date"
                  />
                </div>
              </div>

              <AnimatedSelect
                label="Assignee"
                value={taskForm.assigneeId}
                onChange={(val) => setTaskForm({ ...taskForm, assigneeId: val })}
                options={allUsers
                  .filter((u) => u.role !== 'brand' && u.isActive !== false && u.status !== 'inactive')
                  .map((u) => ({
                    value: u.id,
                    label: `${u.name} (${u.role})`,
                  }))}
              />

              <div style={{ paddingTop: 14, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setShowAddTaskModal(false)}
                  style={{ ...btnSecondary, height: 32, fontSize: 12 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingTask}
                  style={{ ...btnPrimary, height: 32, fontSize: 12, opacity: isSubmittingTask ? 0.7 : 1, cursor: isSubmittingTask ? 'not-allowed' : 'pointer' }}
                >
                  {isSubmittingTask && <Loader2 className="animate-spin" style={{ width: 13, height: 13 }} />}
                  {isSubmittingTask ? 'Creating...' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Project Modal */}
      {showAddProjectModal && (
        <div style={modalOverlay} onClick={() => setShowAddProjectModal(false)}>
          <div
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 18, width: '100%', maxWidth: 480, boxShadow: '0 24px 60px rgba(0,0,0,0.18)', overflow: 'hidden' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Add New Project</h3>
                <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2, marginBottom: 0 }}>Group client deliverables under a project</p>
              </div>
              <button
                onClick={() => setShowAddProjectModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}
              >
                <X style={{ width: 16, height: 16 }} />
              </button>
            </div>

            <form onSubmit={handleAddProjectSubmit} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14, fontSize: 12 }}>
              <AnimatedSelect
                label="Client"
                required
                value={projectForm.brandId}
                onChange={(val) => setProjectForm({ ...projectForm, brandId: val })}
                options={brands.map((b) => ({ value: b.id, label: b.name }))}
              />

              <div>
                <label style={{ display: 'block', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>Project Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Q4 Statutory Audit & Compliance"
                  value={projectForm.name}
                  onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
                  style={inputFieldStyle}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>Scope &amp; Objectives</label>
                <textarea
                  rows={2}
                  value={projectForm.scope}
                  onChange={(e) => setProjectForm({ ...projectForm, scope: e.target.value })}
                  style={inputFieldStyle}
                ></textarea>
              </div>

              <div className="rg-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                <div>
                  <DatePicker
                    label="Start Date"
                    value={projectForm.startDate}
                    onChange={(date) => setProjectForm({ ...projectForm, startDate: date })}
                    placeholder="Select start date"
                  />
                </div>
                <div>
                  <DatePicker
                    label="Target End Date"
                    value={projectForm.endDate}
                    onChange={(date) => setProjectForm({ ...projectForm, endDate: date })}
                    placeholder="Select end date"
                  />
                </div>
              </div>

              <div style={{ paddingTop: 14, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setShowAddProjectModal(false)}
                  style={{ ...btnSecondary, height: 32, fontSize: 12 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingProject}
                  style={{ ...btnPrimary, height: 32, fontSize: 12, opacity: isSubmittingProject ? 0.7 : 1, cursor: isSubmittingProject ? 'not-allowed' : 'pointer' }}
                >
                  {isSubmittingProject && <Loader2 className="animate-spin" style={{ width: 13, height: 13 }} />}
                  {isSubmittingProject ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
