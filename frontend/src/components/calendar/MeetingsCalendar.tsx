import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import type { Meeting } from '../../types';
import {
  CalendarDays, Plus, Video, Clock, MapPin, Users,
  Building2, Calendar, X, Trash2, Loader2
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogPopup,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/animate-ui/components/base/alert-dialog';
import { AnimatedSelect } from '../ui/AnimatedSelect';
import { DatePicker } from '@/components/ui/DatePicker';

export const MeetingsCalendar: React.FC = () => {
  const { currentUser, meetings, brands, allUsers, addMeeting, deleteMeeting, holidays } = useApp() as any;
  const role = currentUser.role;

  const today = new Date().toISOString().split('T')[0];

  const [showAddModal, setShowAddModal] = useState(false);
  const [meetingToDelete, setMeetingToDelete] = useState<Meeting | null>(null);
  const [isDeletingMeeting, setIsDeletingMeeting] = useState(false);

  const confirmDeleteMeeting = async () => {
    const m = meetingToDelete;
    if (!m) return;
    try {
      setIsDeletingMeeting(true);
      await deleteMeeting(m.id);
      setMeetingToDelete(null);
    } finally {
      setIsDeletingMeeting(false);
    }
  };
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

  const availableMembers = React.useMemo(() => {
    return ((allUsers as any[]) || []).filter(Boolean).filter((u: any) => u.role !== 'brand' && u?.status !== 'inactive');
  }, [allUsers]);

  const toggleAttendee = (userId: string) => {
    setMeetingForm(prev => {
      const current = prev.attendeeIds || [];
      const next = current.includes(userId)
        ? (current.length > 1 ? current.filter(id => id !== userId) : current)
        : [...current, userId];
      return { ...prev, attendeeIds: next };
    });
  };

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

  const MeetingCardInner = React.memo<{ m: Meeting; isPast?: boolean }>(({ m, isPast }) => {
    const brand = brands.find((b: any) => b.id === m.brandId);
    const attendees = (allUsers as any[]).filter(u => m.attendeeIds?.includes(u.id));
    const isJoinable = !!m.linkOrLocation?.startsWith('http');

    return (
      <div style={{
        background: isPast ? 'var(--bg-subtle)' : 'var(--bg-card)',
        border: '1px solid var(--border)',
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
              <span style={{ display: 'inline-block', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: 'var(--info-bg)', color: 'var(--accent-text)', marginBottom: 6, letterSpacing: '0.02em' }}>
                {brand.name}
              </span>
            )}
            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.3 }}>{m.title}</div>
            {m.notes && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{m.notes}</div>}
          </div>

          <div style={{ display: 'flex', gap: 8, flexShrink: 0, alignItems: 'center' }}>
            {isJoinable && !isPast && (
              <a href={m.linkOrLocation} target="_blank" rel="noreferrer" style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '7px 14px', background: 'var(--accent-text)', color: 'var(--solid-btn-text)',
                borderRadius: 8, fontSize: 12, fontWeight: 700, textDecoration: 'none',
              }}>
                <Video style={{ width: 13, height: 13 }} /> Join
              </a>
            )}
            {(role === 'admin' || role === 'hr') && (
              <button onClick={() => setMeetingToDelete(m)} style={{
                background: 'none', border: '1px solid var(--danger-border)', borderRadius: 8,
                padding: '7px 10px', cursor: 'pointer', color: 'var(--danger-text)', display: 'flex', alignItems: 'center',
              }}>
                <Trash2 style={{ width: 13, height: 13 }} />
              </button>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-primary)' }}>
            <Clock style={{ width: 13, height: 13, color: 'var(--text-muted)' }} />
            {m.date} · {m.time} · {m.durationMinutes} min
          </div>
          {m.linkOrLocation && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-primary)', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              <MapPin style={{ width: 13, height: 13, color: 'var(--text-muted)', flexShrink: 0 }} />
              {m.linkOrLocation}
            </div>
          )}
        </div>

        {attendees.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Attendees:</span>
            <div style={{ display: 'flex', gap: 4 }}>
              {attendees.map((att: any) => (
                <div key={att.id} title={att.name} style={{
                  width: 24, height: 24, borderRadius: '50%', background: 'var(--solid-btn-bg)',
                  color: 'var(--solid-btn-text)', fontSize: 10, fontWeight: 700, display: 'flex',
                  alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  {(att.name || '?').charAt(0).toUpperCase()}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  });
  const MeetingCard = MeetingCardInner;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

      {/* Header */}
      <div style={{ paddingBottom: 24, borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1.2, margin: 0 }}>
            Meetings & Calendar
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4, marginBottom: 0 }}>
            Client meetings, team syncs and holiday calendar
          </p>
        </div>
        {(role === 'admin' || role === 'hr' || role === 'team') && (
          <button onClick={() => setShowAddModal(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 18px', background: 'var(--solid-btn-bg)', color: 'var(--solid-btn-text)', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            <Plus style={{ width: 16, height: 16 }} /> Schedule Meeting
          </button>
        )}
      </div>

      {/* Monthly Client Check-In Reminder Banner */}
      <div style={{
        padding: '16px 20px', borderRadius: 12, background: 'var(--bg-card)',
        border: '1px solid var(--border)', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', flexWrap: 'wrap', gap: 14,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--info-bg)', color: 'var(--accent-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
            🎯
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>
              Monthly Client Check-Ins
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              Clients you meet with at least once a month stay happy and never leave. Schedule a friendly check-in!
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <a
            href="https://calendar.google.com"
            target="_blank"
            rel="noreferrer"
            style={{
              padding: '7px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
              background: 'var(--bg-subtle)', border: '1px solid var(--border)',
              color: 'var(--text-secondary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6,
            }}
          >
            Google Calendar
          </a>
          <a
            href="https://cal.com"
            target="_blank"
            rel="noreferrer"
            style={{
              padding: '7px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
              background: 'var(--bg-subtle)', border: '1px solid var(--border)',
              color: 'var(--text-secondary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6,
            }}
          >
            Cal.com Sync
          </a>
        </div>
      </div>

      {/* Two-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: 24 }}>

        {/* Left: Meetings */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Upcoming */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <h2 style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Upcoming</h2>
              <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: 'var(--info-bg)', color: 'var(--accent-text)' }}>{upcomingMeetings.length}</span>
            </div>
            {upcomingMeetings.length === 0 ? (
              <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, border: '1px dashed var(--border)', borderRadius: 14 }}>
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
                <h2 style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Past</h2>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: 'var(--bg-raised)', color: 'var(--text-muted)' }}>{pastMeetings.length}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {pastMeetings.map(m => <MeetingCard key={m.id} m={m} isPast />)}
              </div>
            </div>
          )}
        </div>

        {/* Right: Holidays */}
        <div>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border)' }}>
              <h2 style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Calendar style={{ width: 16, height: 16, color: 'var(--success-text)' }} />
                Holidays & Non-Working Days
              </h2>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 0' }}>Avoid sending payment reminders on these dates</p>
            </div>

            <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {holidays.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, padding: '24px 0' }}>No holidays configured. Add them in Settings.</div>
              ) : (
                holidays.map((h: any) => {
                  const badgeStyle =
                    h.type === 'National'     ? { bg: 'var(--warn-bg)', color: 'var(--warn-text)' } :
                    h.type === 'Regional'     ? { bg: 'var(--warn-bg)', color: 'var(--warn-text)' } :
                                                { bg: 'var(--info-bg)', color: 'var(--info-text)' };
                  return (
                    <div key={h.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg-subtle)', borderRadius: 10, border: '1px solid var(--border)' }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{h.title}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, fontFamily: 'monospace' }}>{h.date}</div>
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
            <div style={{ margin: '0 16px 16px', padding: '12px 14px', background: 'var(--info-bg)', border: '1px solid var(--accent-border)', borderRadius: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-text)', marginBottom: 4 }}>Weekend Auto-Protection</div>
              <p style={{ fontSize: 11, color: 'var(--text-primary)', margin: 0, lineHeight: 1.5 }}>
                Automated retention reminders &amp; invoice notices are paused on weekends to preserve high client satisfaction.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Schedule Meeting Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'var(--overlay)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowAddModal(false); }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 18, width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 60px rgba(0,0,0,0.18)' }}>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '22px 28px', borderBottom: '1px solid var(--border)' }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>Schedule Meeting</h2>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 0' }}>Add a client meeting or team catch-up</p>
              </div>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'var(--bg-raised)', border: 'none', borderRadius: 8, width: 34, height: 34, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X style={{ width: 16, height: 16 }} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: 6 }}>Meeting Title *</label>
                <input type="text" required placeholder="e.g. Monthly Strategy Review" value={meetingForm.title}
                  onChange={e => setMeetingForm({ ...meetingForm, title: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 10, fontSize: 14, color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' as const, background: 'var(--bg-subtle)' }} />
              </div>

              <AnimatedSelect
                label="Client (optional)"
                value={meetingForm.brandId}
                onChange={(val) => setMeetingForm({ ...meetingForm, brandId: val })}
                options={[
                  { value: '', label: '— No specific client —' },
                  ...brands.map((b: any) => ({ value: b.id, label: b.name })),
                ]}
              />

              <div className="rg-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <DatePicker
                    value={meetingForm.date}
                    onChange={(date) => setMeetingForm({ ...meetingForm, date })}
                    required
                    label="Meeting Date"
                    placeholder="Select date"
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: 6 }}>Time *</label>
                  <input type="time" required value={meetingForm.time} onChange={e => setMeetingForm({ ...meetingForm, time: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 10, fontSize: 14, color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' as const, background: 'var(--bg-subtle)' }} />
                </div>
              </div>

              <div className="rg-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: 6 }}>Duration (minutes)</label>
                  <input type="number" min={15} max={480} value={meetingForm.durationMinutes} onChange={e => setMeetingForm({ ...meetingForm, durationMinutes: Number(e.target.value) })}
                    style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 10, fontSize: 14, color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' as const, background: 'var(--bg-subtle)' }} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Meet Link / Location</label>
                    <button
                      type="button"
                      onClick={() => {
                        const randomCode = Math.random().toString(36).substring(2, 5) + '-' + Math.random().toString(36).substring(2, 6) + '-' + Math.random().toString(36).substring(2, 5);
                        setMeetingForm({ ...meetingForm, linkOrLocation: `https://meet.google.com/${randomCode}` });
                      }}
                      style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: 'var(--info-bg)', color: 'var(--accent-text)', border: '1px solid var(--accent-border)', cursor: 'pointer' }}
                    >
                      ⚡ Instant Google Meet
                    </button>
                  </div>
                  <input type="text" placeholder="https://meet.google.com/..." value={meetingForm.linkOrLocation} onChange={e => setMeetingForm({ ...meetingForm, linkOrLocation: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 10, fontSize: 14, color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' as const, background: 'var(--bg-subtle)' }} />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: 6 }}>
                  Invite Team Attendees ({(meetingForm.attendeeIds || []).length})
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, maxHeight: 110, overflowY: 'auto', padding: 8, background: 'var(--bg-subtle)', borderRadius: 10, border: '1px solid var(--border)' }}>
                  {availableMembers.map((u: any) => {
                    const isSelected = (meetingForm.attendeeIds || []).includes(u.id);
                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => toggleAttendee(u.id)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '5px 10px',
                          borderRadius: 20,
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: 'pointer',
                          background: isSelected ? 'var(--solid-btn-bg)' : 'var(--bg-card)',
                          color: isSelected ? 'var(--solid-btn-text)' : 'var(--text-secondary)',
                          border: isSelected ? '1px solid var(--border-focus)' : '1px solid var(--border)',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <span style={{ width: 16, height: 16, borderRadius: '50%', background: isSelected ? 'rgba(255,255,255,0.25)' : 'var(--bg-raised)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700 }}>
                          {(u.name || '?').charAt(0)}
                        </span>
                        <span>{u.name}</span>
                        {u.id === currentUser.id && <span style={{ opacity: 0.7, fontSize: 9 }}>(You)</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: 6 }}>Notes / Agenda</label>
                <textarea rows={2} value={meetingForm.notes} onChange={e => setMeetingForm({ ...meetingForm, notes: e.target.value })}
                  placeholder="What will be covered in this meeting?"
                  style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 10, fontSize: 14, color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' as const, background: 'var(--bg-subtle)', resize: 'vertical' }} />
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button type="button" onClick={() => setShowAddModal(false)} style={{ flex: 1, padding: '11px 0', background: 'var(--bg-raised)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit" style={{ flex: 2, padding: '11px 0', background: 'var(--solid-btn-bg)', color: 'var(--solid-btn-text)', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <Plus style={{ width: 15, height: 15 }} /> Schedule Meeting
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete meeting confirmation — animated alert dialog */}
      {meetingToDelete && (
        <AlertDialog open onOpenChange={(o) => { if (!o && !isDeletingMeeting) setMeetingToDelete(null); }}>
          <AlertDialogPopup from="bottom" className="sm:max-w-[440px]">
            <AlertDialogHeader>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--danger-bg)', color: 'var(--danger-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Trash2 style={{ width: 18, height: 18 }} />
                </div>
                <div style={{ textAlign: 'left' }}>
                  <AlertDialogTitle>Delete this meeting?</AlertDialogTitle>
                  <AlertDialogDescription>
                    “{meetingToDelete.title}” will be removed from the calendar for all attendees.
                  </AlertDialogDescription>
                </div>
              </div>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeletingMeeting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDeleteMeeting}
                disabled={isDeletingMeeting}
                style={{
                  background: 'var(--danger-text)',
                  color: 'var(--solid-btn-text)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  opacity: isDeletingMeeting ? 0.7 : 1,
                  cursor: isDeletingMeeting ? 'not-allowed' : 'pointer',
                }}
              >
                {isDeletingMeeting && <Loader2 className="animate-spin" style={{ width: 14, height: 14 }} />}
                Yes, Delete Meeting
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogPopup>
        </AlertDialog>
      )}
    </div>
  );
};

export default MeetingsCalendar;
