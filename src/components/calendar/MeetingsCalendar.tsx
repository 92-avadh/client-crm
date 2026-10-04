import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import type { Meeting } from '../../types';
import {
  CalendarDays,
  Plus,
  Video,
  Clock,
  MapPin,
  Users,
  Building2,
  Calendar,
  Sparkles,
  ExternalLink,
  X
} from 'lucide-react';

export const MeetingsCalendar: React.FC = () => {
  const {
    currentUser,
    meetings,
    brands,
    allUsers,
    addMeeting,
    holidays
  } = useApp();

  const role = currentUser.role;

  const [showAddModal, setShowAddModal] = useState(false);
  const [meetingForm, setMeetingForm] = useState({
    title: '',
    brandId: brands[0]?.id || '',
    date: '2026-10-08',
    time: '02:30 PM',
    durationMinutes: 45,
    linkOrLocation: 'https://meet.google.com/ret-sync-2026',
    attendeeIds: [currentUser.id],
    notes: ''
  });

  const handleAddMeetingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetingForm.title) return;
    addMeeting(meetingForm);
    setShowAddModal(false);
    setMeetingForm({
      title: '',
      brandId: brands[0]?.id || '',
      date: '2026-10-08',
      time: '02:30 PM',
      durationMinutes: 45,
      linkOrLocation: 'https://meet.google.com/ret-sync-2026',
      attendeeIds: [currentUser.id],
      notes: ''
    });
  };

  // Filter meetings for team role: only invited meetings per SRD Section 3.11
  const visibleMeetings = meetings.filter((m) => {
    if (role === 'team' || role === 'brand') {
      return m.attendeeIds.includes(currentUser.id) || m.brandId === currentUser.brandId;
    }
    return true;
  });

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* ── Page Header ────────────────────────────────────── */}
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        style={{ paddingBottom: 24, borderBottom: '1px solid #e2e2e2' }}
      >
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: '#0a0a0a', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            Meetings & Agency Calendar
          </h1>
          <p style={{ fontSize: 13, color: '#909090', marginTop: 4 }}>
            Client review touchpoints and statutory tax filing calendar with Indian national holidays.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Schedule Meeting</span>
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
        {/* Left Column: Scheduled Meetings */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="glass-panel" style={{ padding: '24px 28px' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white text-sm">Upcoming Client & Team Touchpoints</h3>
              <span className="badge badge-info text-xs">{visibleMeetings.length} Scheduled</span>
            </div>

            <div className="space-y-3">
              {visibleMeetings.map((m) => {
                const brand = brands.find((b) => b.id === m.brandId);
                const attendees = allUsers.filter((u) => m.attendeeIds.includes(u.id));

                return (
                  <div
                    key={m.id}
                    className="p-4 rounded-xl bg-[#131c2e] border border-[rgba(255,255,255,0.06)] hover:border-indigo-500/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        {brand && (
                          <span className="badge badge-neutral text-[10px]">
                            {brand.name}
                          </span>
                        )}
                        <span className="text-[11px] text-indigo-400 font-mono flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {m.date} at {m.time} ({m.durationMinutes} mins)
                        </span>
                      </div>

                      <h4 className="font-bold text-xs sm:text-sm text-slate-100">
                        {m.title}
                      </h4>

                      {m.notes && (
                        <p className="text-[11px] text-slate-400">{m.notes}</p>
                      )}

                      <div className="flex items-center gap-2 pt-1">
                        <span className="text-[10px] text-slate-500">Attendees:</span>
                        <div className="flex -space-x-1.5 overflow-hidden">
                          {attendees.map((att) => (
                            <img
                              key={att.id}
                              src={att.avatar}
                              alt={att.name}
                              title={att.name}
                              className="w-5 h-5 rounded-full object-cover ring-1 ring-[#0a0e17]"
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    <a
                      href={m.linkOrLocation}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-2 self-start sm:self-auto transition-colors"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>Join Call</span>
                    </a>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Company Holiday Calendar (SRD Section 3.12) */}
        <div className="space-y-4">
          <div className="glass-panel p-5 space-y-4">
            <div>
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-400" />
                <span>Holidays & Non-Working Days</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Avoid sending payment reminders on holidays
              </p>
            </div>

            <div className="space-y-2">
              {holidays.map((h) => (
                <div
                  key={h.id}
                  className="p-3 rounded-xl bg-[#131c2e] border border-[rgba(255,255,255,0.06)] flex items-center justify-between"
                >
                  <div>
                    <div className="text-xs font-semibold text-slate-200">{h.title}</div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">{h.date}</div>
                  </div>
                  <span
                    className={`badge text-[10px] ${
                      h.type === 'National'
                        ? 'badge-warning'
                        : h.type === 'Regional'
                        ? 'badge-info'
                        : 'badge-active'
                    }`}
                  >
                    {h.type}
                  </span>
                </div>
              ))}
            </div>

            <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-500/20 text-xs text-slate-300">
              <span className="font-bold text-indigo-300">Sunday Auto-Protection:</span>
              <p className="text-[11px] text-slate-400 mt-1">
                Automated retention reminders & invoice notices are paused on weekend days to preserve high client satisfaction.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Schedule Meeting Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div
            className="modal-content max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-[rgba(255,255,255,0.08)] bg-[#131c2e] flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-sm">Schedule Client Sync Meeting</h3>
                <p className="text-[11px] text-slate-400">Creates calendar event and Google Meet link</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddMeetingSubmit} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Meeting Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Monthly GST & Tax Audit Review"
                  value={meetingForm.title}
                  onChange={(e) => setMeetingForm({ ...meetingForm, title: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Client *</label>
                <select
                  value={meetingForm.brandId}
                  onChange={(e) => setMeetingForm({ ...meetingForm, brandId: e.target.value })}
                  className="input-field"
                >
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={meetingForm.date}
                    onChange={(e) => setMeetingForm({ ...meetingForm, date: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Time</label>
                  <input
                    type="text"
                    required
                    placeholder="11:00 AM"
                    value={meetingForm.time}
                    onChange={(e) => setMeetingForm({ ...meetingForm, time: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Meeting Link / Room</label>
                <input
                  type="text"
                  value={meetingForm.linkOrLocation}
                  onChange={(e) => setMeetingForm({ ...meetingForm, linkOrLocation: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Agenda & Prep Notes</label>
                <textarea
                  rows={2}
                  value={meetingForm.notes}
                  onChange={(e) => setMeetingForm({ ...meetingForm, notes: e.target.value })}
                  className="input-field"
                ></textarea>
              </div>

              <div className="pt-3 border-t border-[rgba(255,255,255,0.08)] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary text-xs">
                  Schedule Meeting
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
