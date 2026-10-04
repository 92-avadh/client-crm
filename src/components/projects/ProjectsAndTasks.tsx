import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import type { TaskPriority, TaskStatus } from '../../types';
import {
  CheckSquare,
  Plus,
  Clock,
  X
} from 'lucide-react';

export const ProjectsAndTasks: React.FC = () => {
  const {
    currentUser,
    projects,
    tasks,
    brands,
    allUsers,
    addTask,
    updateTaskStatus,
    addProject
  } = useApp();

  const role = currentUser.role;

  const [activeTab, setActiveTab] = useState<'tasks' | 'projects'>('tasks');
  const [taskView, setTaskView] = useState<'kanban' | 'list'>('kanban');
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [showAddProjectModal, setShowAddProjectModal] = useState(false);

  // New Task Form State
  const [taskForm, setTaskForm] = useState({
    brandId: brands[0]?.id || '',
    title: '',
    description: '',
    assigneeId: allUsers.find((u) => u.role === 'team')?.id || currentUser.id,
    dueDate: '2026-10-10',
    priority: 'High' as TaskPriority,
    status: 'To Do' as TaskStatus
  });

  // New Project Form State
  const [projectForm, setProjectForm] = useState({
    brandId: brands[0]?.id || '',
    name: '',
    scope: '',
    startDate: '2026-10-04',
    endDate: '2026-11-30',
    status: 'In progress' as any,
    assignedMemberIds: [] as string[],
    billingAmount: 125000
  });

  const handleAddTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskForm.title) return;
    addTask(taskForm);
    setShowAddTaskModal(false);
    setTaskForm({ ...taskForm, title: '', description: '' });
  };

  const handleAddProjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectForm.name) return;
    addProject({
      ...projectForm,
      billingAmount: Number(projectForm.billingAmount)
    });
    setShowAddProjectModal(false);
  };

  // Team member view filter: can view all or own assigned tasks
  const relevantTasks =
    role === 'team'
      ? tasks.filter((t) => t.assigneeId === currentUser.id)
      : tasks;

  const kanbanColumns: TaskStatus[] = ['To Do', 'In Progress', 'In Review', 'Completed'];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* ── Page Header ────────────────────────────────────── */}
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        style={{ paddingBottom: 24, borderBottom: '1px solid #e2e2e2' }}
      >
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: '#0a0a0a', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            Projects & Task Deliverables
          </h1>
          <p style={{ fontSize: 13, color: '#909090', marginTop: 4 }}>
            Track client milestones, statutory deadlines, CA audits, and retention activities.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {(role === 'admin' || role === 'hr') && (
            <button
              onClick={() => setShowAddProjectModal(true)}
              className="btn-secondary"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Project</span>
            </button>
          )}
          <button
            onClick={() => setShowAddTaskModal(true)}
            className="btn-primary"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #e2e2e2',
          background: '#ffffff',
          borderRadius: 12,
          padding: '4px 12px',
          border: '1px solid #e2e2e2',
        }}
      >
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            onClick={() => setActiveTab('tasks')}
            style={{
              padding: '8px 16px',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              borderRadius: 8,
              border: 'none',
              background: activeTab === 'tasks' ? '#0a0a0a' : 'transparent',
              color: activeTab === 'tasks' ? '#ffffff' : '#666666',
              transition: 'all 0.15s ease',
            }}
          >
            Tasks & Deliverables ({relevantTasks.length})
          </button>
          <button
            onClick={() => setActiveTab('projects')}
            style={{
              padding: '8px 16px',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              borderRadius: 8,
              border: 'none',
              background: activeTab === 'projects' ? '#0a0a0a' : 'transparent',
              color: activeTab === 'projects' ? '#ffffff' : '#666666',
              transition: 'all 0.15s ease',
            }}
          >
            Active Projects ({projects.length})
          </button>
        </div>

        {activeTab === 'tasks' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button
              onClick={() => setTaskView('kanban')}
              style={{
                padding: '6px 12px',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                border: 'none',
                background: taskView === 'kanban' ? '#f0f0f0' : 'transparent',
                color: taskView === 'kanban' ? '#0a0a0a' : '#888888',
              }}
            >
              Kanban Board
            </button>
            <button
              onClick={() => setTaskView('list')}
              style={{
                padding: '6px 12px',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                border: 'none',
                background: taskView === 'list' ? '#f0f0f0' : 'transparent',
                color: taskView === 'list' ? '#0a0a0a' : '#888888',
              }}
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
            const colTasks = relevantTasks.filter((t) => t.status === column);

            return (
              <div
                key={column}
                style={{
                  background: '#fcfcfc',
                  border: '1px solid #e2e2e2',
                  borderRadius: 12,
                  padding: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  minHeight: 560,
                }}
              >
                {/* Column Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 12, borderBottom: '1px solid #e2e2e2', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: '#0a0a0a' }}>{column}</span>
                    <span
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        background: '#f0f0f0',
                        color: '#0a0a0a',
                        fontWeight: 700,
                        fontSize: 11,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {colTasks.length}
                    </span>
                  </div>
                </div>

                {/* Column Tasks */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1, overflowY: 'auto' }}>
                  {colTasks.map((task) => {
                    const brand = brands.find((b) => b.id === task.brandId);
                    const assignee = allUsers.find((u) => u.id === task.assigneeId);

                    return (
                      <div
                        key={task.id}
                        style={{
                          background: '#ffffff',
                          border: '1px solid #e2e2e2',
                          borderRadius: 10,
                          padding: 14,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 10,
                          transition: 'border-color 0.15s, box-shadow 0.15s',
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.borderColor = '#0a0a0a';
                          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.borderColor = '#e2e2e2';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              padding: '2px 6px',
                              borderRadius: 4,
                              background: task.priority === 'Urgent' ? '#0a0a0a' : '#f0f0f0',
                              color: task.priority === 'Urgent' ? '#ffffff' : '#333333',
                            }}
                          >
                            {task.priority}
                          </span>
                          <span style={{ fontSize: 11, color: '#777777', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 120 }}>
                            {brand?.name}
                          </span>
                        </div>

                        <h4 style={{ fontSize: 13, fontWeight: 700, color: '#0a0a0a', lineHeight: 1.4 }}>
                          {task.title}
                        </h4>

                        {task.description && (
                          <p style={{ fontSize: 11, color: '#666666', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {task.description}
                          </p>
                        )}

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px solid #f0f0f0', fontSize: 11, color: '#777777' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Clock style={{ width: 12, height: 12, color: '#888888' }} />
                            {task.dueDate}
                          </span>

                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            {assignee && (
                              <img
                                src={assignee.avatar}
                                alt={assignee.name}
                                title={assignee.name}
                                style={{ width: 20, height: 20, borderRadius: '50%', objectFit: 'cover', border: '1px solid #e2e2e2' }}
                              />
                            )}

                            {/* Status changer dropdown for quick updating */}
                            <select
                              value={task.status}
                              onChange={(e) => updateTaskStatus(task.id, e.target.value as TaskStatus)}
                              style={{
                                fontSize: 10,
                                background: '#f7f7f7',
                                color: '#0a0a0a',
                                borderRadius: 4,
                                border: '1px solid #e2e2e2',
                                padding: '2px 4px',
                                outline: 'none',
                                cursor: 'pointer',
                              }}
                            >
                              {kanbanColumns.map((st) => (
                                <option key={st} value={st}>
                                  {st}
                                </option>
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
        <div style={{ background: '#ffffff', border: '1px solid #e2e2e2', borderRadius: 12, overflow: 'hidden' }}>
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
              {relevantTasks.map((t) => {
                const brand = brands.find((b) => b.id === t.brandId);
                const assignee = allUsers.find((u) => u.id === t.assigneeId);
                return (
                  <tr key={t.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: '#0a0a0a', fontSize: 13 }}>{t.title}</div>
                      <div style={{ fontSize: 11, color: '#777777', marginTop: 2 }}>{t.description}</div>
                    </td>
                    <td style={{ color: '#0a0a0a', fontSize: 12, fontWeight: 500 }}>{brand?.name}</td>
                    <td>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: 4,
                          background: t.priority === 'Urgent' ? '#0a0a0a' : '#f0f0f0',
                          color: t.priority === 'Urgent' ? '#ffffff' : '#333333',
                        }}
                      >
                        {t.priority}
                      </span>
                    </td>
                    <td style={{ color: '#666666', fontSize: 12, fontFamily: 'var(--font-mono)' }}>{t.dueDate}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {assignee && (
                          <img
                            src={assignee.avatar}
                            alt={assignee.name}
                            style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'cover' }}
                          />
                        )}
                        <span style={{ fontSize: 12, color: '#0a0a0a' }}>{assignee?.name}</span>
                      </div>
                    </td>
                    <td>
                      <select
                        value={t.status}
                        onChange={(e) => updateTaskStatus(t.id, e.target.value as TaskStatus)}
                        style={{
                          fontSize: 11,
                          padding: '4px 8px',
                          borderRadius: 6,
                          border: '1px solid #e2e2e2',
                          background: '#f7f7f7',
                          color: '#0a0a0a',
                          outline: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        {kanbanColumns.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Projects Tab */}
      {activeTab === 'projects' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 16 }}>
          {projects.map((proj) => {
            const brand = brands.find((b) => b.id === proj.brandId);
            return (
              <div
                key={proj.id}
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e2e2',
                  borderRadius: 12,
                  padding: 20,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 16,
                  transition: 'border-color 0.15s, box-shadow 0.15s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = '#0a0a0a';
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.06)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = '#e2e2e2';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#888888', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      {brand?.name}
                    </span>
                    <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0a0a0a', marginTop: 2 }}>{proj.name}</h3>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: '#f0f0f0', color: '#0a0a0a' }}>
                    {proj.status}
                  </span>
                </div>

                <p style={{ fontSize: 12, color: '#525252', background: '#f7f7f7', padding: '10px 12px', borderRadius: 8, border: '1px solid #eeeeee', lineHeight: 1.5 }}>
                  {proj.scope}
                </p>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#777777', marginBottom: 6 }}>
                    <span>Deliverable Progress</span>
                    <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#0a0a0a' }}>{proj.progress}%</span>
                  </div>
                  <div style={{ width: '100%', height: 6, background: '#f0f0f0', borderRadius: 9999, overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${proj.progress}%`,
                        height: '100%',
                        background: '#0a0a0a',
                        borderRadius: 9999,
                        transition: 'width 0.4s ease',
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, color: '#777777', paddingTop: 12, borderTop: '1px solid #f0f0f0' }}>
                  <span>Timeline: {proj.startDate} → {proj.endDate}</span>
                  {role !== 'team' && proj.billingAmount && (
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#0a0a0a' }}>
                      ₹{proj.billingAmount.toLocaleString('en-IN')}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Task Modal */}
      {showAddTaskModal && (
        <div className="modal-overlay" onClick={() => setShowAddTaskModal(false)}>
          <div
            className="modal-content"
            style={{ maxWidth: 480, background: '#ffffff', border: '1px solid #e2e2e2' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e2e2', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0a0a0a' }}>Add New Client Task</h3>
                <p style={{ fontSize: 11, color: '#666666', marginTop: 2 }}>Activity will be logged to client timeline</p>
              </div>
              <button
                onClick={() => setShowAddTaskModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666666' }}
              >
                <X style={{ width: 16, height: 16 }} />
              </button>
            </div>

            <form onSubmit={handleAddTaskSubmit} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14, fontSize: 12 }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, color: '#0a0a0a', marginBottom: 6 }}>Client *</label>
                <select
                  value={taskForm.brandId}
                  onChange={(e) => setTaskForm({ ...taskForm, brandId: e.target.value })}
                  className="input-field"
                >
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, color: '#0a0a0a', marginBottom: 6 }}>Task Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Verify GSTR-3B monthly return"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, color: '#0a0a0a', marginBottom: 6 }}>Details / Scope</label>
                <textarea
                  rows={2}
                  placeholder="Specific requirements..."
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  className="input-field"
                ></textarea>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, color: '#0a0a0a', marginBottom: 6 }}>Priority</label>
                  <select
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value as TaskPriority })}
                    className="input-field"
                  >
                    <option value="Urgent">Urgent</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 600, color: '#0a0a0a', marginBottom: 6 }}>Due Date</label>
                  <input
                    type="date"
                    required
                    value={taskForm.dueDate}
                    onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, color: '#0a0a0a', marginBottom: 6 }}>Assignee</label>
                <select
                  value={taskForm.assigneeId}
                  onChange={(e) => setTaskForm({ ...taskForm, assigneeId: e.target.value })}
                  className="input-field"
                >
                  {allUsers
                    .filter((u) => u.role === 'team' || u.role === 'admin' || u.role === 'hr')
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.role.toUpperCase()})
                      </option>
                    ))}
                </select>
              </div>

              <div style={{ paddingTop: 14, borderTop: '1px solid #e2e2e2', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setShowAddTaskModal(false)}
                  className="btn-secondary"
                  style={{ height: 32, fontSize: 12 }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ height: 32, fontSize: 12 }}>
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Project Modal */}
      {showAddProjectModal && (
        <div className="modal-overlay" onClick={() => setShowAddProjectModal(false)}>
          <div
            className="modal-content"
            style={{ maxWidth: 480, background: '#ffffff', border: '1px solid #e2e2e2' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e2e2', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0a0a0a' }}>Add New Project</h3>
                <p style={{ fontSize: 11, color: '#666666', marginTop: 2 }}>Group client deliverables under a project</p>
              </div>
              <button
                onClick={() => setShowAddProjectModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666666' }}
              >
                <X style={{ width: 16, height: 16 }} />
              </button>
            </div>

            <form onSubmit={handleAddProjectSubmit} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14, fontSize: 12 }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, color: '#0a0a0a', marginBottom: 6 }}>Client *</label>
                <select
                  value={projectForm.brandId}
                  onChange={(e) => setProjectForm({ ...projectForm, brandId: e.target.value })}
                  className="input-field"
                >
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, color: '#0a0a0a', marginBottom: 6 }}>Project Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Q4 Statutory Audit & Compliance"
                  value={projectForm.name}
                  onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, color: '#0a0a0a', marginBottom: 6 }}>Scope & Objectives</label>
                <textarea
                  rows={2}
                  value={projectForm.scope}
                  onChange={(e) => setProjectForm({ ...projectForm, scope: e.target.value })}
                  className="input-field"
                ></textarea>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, color: '#0a0a0a', marginBottom: 6 }}>Start Date</label>
                  <input
                    type="date"
                    value={projectForm.startDate}
                    onChange={(e) => setProjectForm({ ...projectForm, startDate: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, color: '#0a0a0a', marginBottom: 6 }}>Target End Date</label>
                  <input
                    type="date"
                    value={projectForm.endDate}
                    onChange={(e) => setProjectForm({ ...projectForm, endDate: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>

              <div style={{ paddingTop: 14, borderTop: '1px solid #e2e2e2', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setShowAddProjectModal(false)}
                  className="btn-secondary"
                  style={{ height: 32, fontSize: 12 }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ height: 32, fontSize: 12 }}>
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
