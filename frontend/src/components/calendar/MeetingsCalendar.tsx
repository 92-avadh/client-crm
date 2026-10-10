import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import type { Meeting } from '../../types';
import {
  CalendarDays, Plus, Video, Clock, MapPin, Users,
  Building2, Calendar, X, Trash2
} from 'lucide-react';

export const MeetingsCalendar: React.FC = () => {
  const { currentUser, meetings, brands, allUsers, addMeeting, deleteMeeting, holidays } = useApp() as any;
  const role = currentUser.role;

  const today = new Date().toISOString().split('T')[0];

  const [showAddModal, setShowAddModal] = useState(false);
  const [meetingForm, setMeetingForm] = useState({
    title: '',
    brandId: '',
    date: today,
    time: '10:00',
    durationMinutes: 45,
    linkOrLocation: '',
    attendeeIds: [currentUser.id],
    notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetingForm.title) return;
    await addMeeting(meetingForm);
    setShowAddModal(false);
    setMeetingForm({ title: '', brandId: '', date: today, time: '10:00', durationMinutes: 45, linkOrLocation: '', attendeeIds: [currentUser.id], notes: '' });
  };

  const visibleMeetings = (meetings as Meeting[]).filter((m) => {
    if (role === 'team' || role === 'brand') {
      return m.attendeeIds?.includes(currentUser.id) || m.brandId === currentUser.brandId;
    }
    return true;
  }).sort((a, b) => a.date.localeCompare(b.date));

  const upcomingMeetings = visibleMeetings.filter(m => m.date >= today);
  const pastMeetings     = visibleMeetings.filter(m => m.date < today);

  const getBrandName = (brandId?: string) => brands.find((b: any) => b.id === brandId)?.name || '';

  const MeetingCard: React.FC<{ m: Meeting; isPast?: boolean }> = ({ m, isPast }) => {
    const brand = brands.find((b: any) => b.id === m.brandId);
    const attendees = (allUsers as any[]).filter(u => m.attendeeIds?.includes(u.id));
    const isJoinable = !!m.linkOrLocation?.startsWith('http');

    return (
      <div style={{
        background: isPast ? '#fafafa' : '#fff',
        border: '1px solid #e2e2e2',
        borderRadius: 14,
        padding: '18px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        opacity: isPast ? 0.65 : 1,
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
          <div style={{ flex: 1 }}>
            {brand && (
              <span style={{ display: 'inline-block', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: '#f0f4ff', color: '#4f46e5', marginBottom: 6, letterSpacing: '0.02em' }}>
                {brand.name}
              </span>
            )}
            <div style={{ fontSize: 14, fontWeight: 800, color: '#0a0a0a', lineHeight: 1.3 }}>{m.title}</div>
            {m.notes && <div style={{ fontSize: 12, color: '#909090', marginTop: 4 }}>{m.notes}</div>}
          </div>

          <div style={{ display: 'flex', gap: 8, flexShrink: 0, alignItems: 'center' }}>
            {isJoinable && !isPast && (
              <a href={m.linkOrLocation} target="_blank" rel="noreferrer" style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '7px 14px', background: '#4f46e5', color: '#fff',
                borderRadius: 8, fontSize: 12, fontWeight: 700, textDecoration: 'none',
              }}>
                <Video style={{ width: 13, height: 13 }} /> Join
              </a>
            )}
            {(role === 'admin' || role === 'hr') && (
              <button onClick={() => deleteMeeting(m.id)} style={{
                background: 'none', border: '1px solid #fce8e6', borderRadius: 8,
                padding: '7px 10px', cursor: 'pointer', color: '#d93025', display: 'flex', alignItems: 'center',
              }}>
                <Trash2 style={{ width: 13, height: 13 }} />
              </button>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#555' }}>
            <Clock style={{ width: 13, height: 13, color: '#909090' }} />
            {m.date} · {m.time} · {m.durationMinutes} min
          </div>
          {m.linkOrLocation && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#555', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              <MapPin style={{ width: 13, height: 13, color: '#909090', flexShrink: 0 }} />
              {m.linkOrLocation}
            </div>
          )}
        </div>

        {attendees.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, color: '#aaa' }}>Attendees:</span>
            <div style={{ display: 'flex', gap: 4 }}>
              {attendees.map((att: any) => (
                <div key={att.id} title={att.name} style={{
                  width: 24, height: 24, borderRadius: '50%', background: '#0a0a0a',
                  color: '#fff', fontSize: 10, fontWeight: 700, display: 'flex',
                  alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  {att.name.charAt(0).toUpperCase()}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

      {/* Header */}
      <div style={{ paddingBottom: 24, borderBottom: '1px solid #e2e2e2', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: '#0a0a0a', letterSpacing: '-0.02em', lineHeight: 1.2, margin: 0 }}>
            Meetings & Calendar
          </h1>
          <p style={{ fontSize: 13, color: '#909090', marginTop: 4, marginBottom: 0 }}>
            Client touchpoints, team syncs and agency holiday calendar
          </p>
        </div>
        {(role === 'admin' || role === 'hr' || role === 'team') && (
          <button onClick={() => setShowAddModal(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 18px', background: '#0a0a0a', color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            <Plus style={{ width: 16, height: 16 }} /> Schedule Meeting
          </button>
        )}
      </div>

      {/* Two-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>

        {/* Left: Meetings */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Upcoming */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <h2 style={{ fontSize: 14, fontWeight: 800, color: '#0a0a0a', margin: 0 }}>Upcoming</h2>
              <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: '#f0f4ff', color: '#4f46e5' }}>{upcomingMeetings.length}</span>
            </div>
            {upcomingMeetings.length === 0 ? (
              <div style={{ padding: '32px 0', textAlign: 'center', color: '#b0b0b0', fontSize: 13, border: '1px dashed #e2e2e2', borderRadius: 14 }}>
                No upcoming meetings. Schedule one now.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {upcomingMeetings.map(m => <MeetingCard key={m.id} m={m} />)}
              </div>
            )}
          </div>

          {/* Past */}
          {pastMeetings.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <h2 style={{ fontSize: 14, fontWeight: 800, color: '#0a0a0a', margin: 0 }}>Past</h2>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: '#f5f5f5', color: '#909090' }}>{pastMeetings.length}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {pastMeetings.map(m => <MeetingCard key={m.id} m={m} isPast />)}
              </div>
            </div>
          )}
        </div>

        {/* Right: Holidays */}
        <div>
          <div style={{ background: '#fff', border: '1px solid #e2e2e2', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ padding: '18px 20px', borderBottom: '1px solid #f0f0f0' }}>
              <h2 style={{ fontSize: 14, fontWeight: 800, color: '#0a0a0a', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Calendar style={{ width: 16, height: 16, color: '#10b981' }} />
                Holidays & Non-Working Days
              </h2>
              <p style={{ fontSize: 12, color: '#909090', margin: '4px 0 0' }}>Avoid sending payment reminders on these dates</p>
            </div>

            <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {holidays.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#b0b0b0', fontSize: 13, padding: '24px 0' }}>No holidays configured. Add them in Settings.</div>
              ) : (
                holidays.map((h: any) => {
                  const badgeStyle =
                    h.type === 'National'     ? { bg: '#fef3c7', color: '#92400e' } :
                    h.type === 'Regional'     ? { bg: '#fff7ed', color: '#c2410c' } :
                                                { bg: '#eff6ff', color: '#1d4ed8' };
                  return (
                    <div key={h.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#fafafa', borderRadius: 10, border: '1px solid #f0f0f0' }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#0a0a0a' }}>{h.title}</div>
                        <div style={{ fontSize: 11, color: '#909090', marginTop: 2, fontFamily: 'monospace' }}>{h.date}</div>
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 10px', borderRadius: 20, background: badgeStyle.bg, color: badgeStyle.color, letterSpacing: '0.02em' }}>
                        {h.type}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            {/* Weekend notice */}
            <div style={{ margin: '0 16px 16px', padding: '12px 14px', background: '#f0f4ff', border: '1px solid #c7d7ff', borderRadius: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#4f46e5', marginBottom: 4 }}>Weekend Auto-Protection</div>
              <p style={{ fontSize: 11, color: '#555', margin: 0, lineHeight: 1.5 }}>
                Automated retention reminders &amp; invoice notices are paused on weekends to preserve high client satisfaction.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Schedule Meeting Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowAddModal(false); }}>
          <div style={{ background: '#fff', borderRadius: 18, width: '100%', maxWidth: 480, boxShadow: '0 24px 60px rgba(0,0,0,0.18)', overflow: 'hidden' }}>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '22px 28px', borderBottom: '1px solid #f0f0f0' }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 900, color: '#0a0a0a', margin: 0 }}>Schedule Meeting</h2>
                <p style={{ fontSize: 12, color: '#909090', margin: '4px 0 0' }}>Add a client sync or team touchpoint</p>
              </div>
              <button onClick={() => setShowAddModal(false)} style={{ background: '#f5f5f5', border: 'none', borderRadius: 8, width: 34, height: 34, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X style={{ width: 16, height: 16 }} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#0a0a0a', display: 'block', marginBottom: 6 }}>Meeting Title *</label>
                <input type="text" required placeholder="e.g. Monthly Strategy Review" value={meetingForm.title}
                  onChange={e => setMeetingForm({ ...meetingForm, title: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e2e2', borderRadius: 10, fontSize: 14, color: '#0a0a0a', outline: 'none', boxSizing: 'border-box' as const, background: '#fafafa' }} />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#0a0a0a', display: 'block', marginBottom: 6 }}>Client (optional)</label>
                <select value={meetingForm.brandId} onChange={e => setMeetingForm({ ...meetingForm, brandId: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e2e2', borderRadius: 10, fontSize: 14, color: '#0a0a0a', outline: 'none', boxSizing: 'border-box' as const, background: '#fafafa', cursor: 'pointer' }}>
                  <option value="">— No specific client —</option>
                  {brands.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#0a0a0a', display: 'block', marginBottom: 6 }}>Date *</label>
                  <input type="date" required value={meetingForm.date} onChange={e => setMeetingForm({ ...meetingForm, date: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e2e2', borderRadius: 10, fontSize: 14, color: '#0a0a0a', outline: 'none', boxSizing: 'border-box' as const, background: '#fafafa' }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#0a0a0a', display: 'block', marginBottom: 6 }}>Time *</label>
                  <input type="time" required value={meetingForm.time} onChange={e => setMeetingForm({ ...meetingForm, time: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e2e2', borderRadius: 10, fontSize: 14, color: '#0a0a0a', outline: 'none', boxSizing: 'border-box' as const, background: '#fafafa' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#0a0a0a', display: 'block', marginBottom: 6 }}>Duration (minutes)</label>
                  <input type="number" min={15} max={480} value={meetingForm.durationMinutes} onChange={e => setMeetingForm({ ...meetingForm, durationMinutes: Number(e.target.value) })}
                    style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e2e2', borderRadius: 10, fontSize: 14, color: '#0a0a0a', outline: 'none', boxSizing: 'border-box' as const, background: '#fafafa' }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#0a0a0a', display: 'block', marginBottom: 6 }}>Meet Link / Location</label>
                  <input type="text" placeholder="https://meet.google.com/..." value={meetingForm.linkOrLocation} onChange={e => setMeetingForm({ ...meetingForm, linkOrLocation: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e2e2', borderRadius: 10, fontSize: 14, color: '#0a0a0a', outline: 'none', boxSizing: 'border-box' as const, background: '#fafafa' }} />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#0a0a0a', display: 'block', marginBottom: 6 }}>Notes / Agenda</label>
                <textarea rows={2} value={meetingForm.notes} onChange={e => setMeetingForm({ ...meetingForm, notes: e.target.value })}
                  placeholder="What will be covered in this meeting?"
                  style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e2e2', borderRadius: 10, fontSize: 14, color: '#0a0a0a', outline: 'none', boxSizing: 'border-box' as const, background: '#fafafa', resize: 'vertical' }} />
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button type="button" onClick={() => setShowAddModal(false)} style={{ flex: 1, padding: '11px 0', background: '#f5f5f5', color: '#0a0a0a', border: '1px solid #e2e2e2', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit" style={{ flex: 2, padding: '11px 0', background: '#0a0a0a', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <Plus style={{ width: 15, height: 15 }} /> Schedule Meeting
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MeetingsCalendar;
