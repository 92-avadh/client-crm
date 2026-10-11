import React, { useState, useEffect, useRef } from 'react';
import {
  Mail, Lock, Eye, EyeOff, LogIn,
  Loader2, AlertCircle, Building2, User, ArrowLeft,
  CheckCircle2, RefreshCw, ShieldCheck, ChevronRight,
  Zap, TrendingUp, Users as UsersIcon, Bell
} from 'lucide-react';
import { api, setToken } from '../../services/api';
import { getNaturalErrorMessage } from '../../services/errors';

interface LoginScreenProps {
  onLogin: (email: string, password: string) => void;
  loginError?: string;
  loginLoading?: boolean;
}

const features = [
  { icon: <TrendingUp size={14} />, text: 'Real-time client retention alerts' },
  { icon: <UsersIcon size={14} />,  text: 'Team & brand assignment management' },
  { icon: <Zap size={14} />,        text: 'Invoicing & payment collection' },
  { icon: <Bell size={14} />,       text: 'Automated churn prevention' },
];

type RegStep = 'details' | 'otp' | 'success';

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLogin, loginError = '', loginLoading = false,
}) => {
  const [mode, setMode]       = useState<'signin' | 'register'>('signin');
  const [showPwd, setShowPwd] = useState(false);
  const [regStep, setRegStep] = useState<RegStep>('details');

  const [siEmail, setSiEmail]       = useState('');
  const [siPassword, setSiPassword] = useState('');

  const [regName, setRegName]         = useState('');
  const [regEmail, setRegEmail]       = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm, setRegConfirm]   = useState('');
  const [regCompany, setRegCompany]   = useState('');

  const [otp, setOtp]               = useState(['','','','','','']);
  const otpRefs                     = useRef<(HTMLInputElement|null)[]>([]);
  const [otpTimer, setOtpTimer]     = useState(300);
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend]   = useState(false);

  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string,boolean>>({});

  const errMsg = loginError || error;
  const otpValue = otp.join('');

  useEffect(() => {
    if (regStep !== 'otp') return;
    const t = setInterval(() => {
      setOtpTimer(p => { if (p <= 1) { clearInterval(t); return 0; } return p - 1; });
      setResendTimer(p => { if (p <= 1) { setCanResend(true); return 0; } return p - 1; });
    }, 1000);
    return () => clearInterval(t);
  }, [regStep]);

  const fmtTime = (s: number) =>
    `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;

  const handleOtpChange = (idx: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp]; next[idx] = val.slice(-1); setOtp(next);
    if (val && idx < 5) otpRefs.current[idx+1]?.focus();
  };
  const handleOtpKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) otpRefs.current[idx-1]?.focus();
  };
  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const p = e.clipboardData.getData('text').replace(/\D/g,'').slice(0,6);
    if (p.length === 6) { setOtp(p.split('')); otpRefs.current[5]?.focus(); }
    e.preventDefault();
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setFieldErrors({});
    const errs: Record<string,boolean> = {};
    if (!regName) errs.name = true;
    if (!regCompany) errs.company = true;
    if (!regEmail) errs.email = true;
    if (!regPassword) errs.password = true;
    if (!regConfirm) errs.confirm = true;
    if (Object.keys(errs).length) { setFieldErrors(errs); setError('Please fill in all fields.'); return; }
    if (regPassword.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (regPassword !== regConfirm) { setFieldErrors({ confirm: true }); setError('Passwords do not match.'); return; }
    try {
      setLoading(true);
      await api.auth.sendOtp({ name: regName, email: regEmail, password: regPassword, company: regCompany });
      setOtp(['','','','','','']); setOtpTimer(300); setResendTimer(60); setCanResend(false);
      setRegStep('otp');
      setTimeout(() => otpRefs.current[0]?.focus(), 120);
    } catch (err: any) {
      setError(getNaturalErrorMessage(err));
    }
    finally { setLoading(false); }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    if (otpValue.length < 6) { setError('Enter the complete 6-digit code.'); return; }
    if (otpTimer === 0) { setError('Code has expired. Request a new one.'); return; }
    try {
      setLoading(true);
      const res = await api.auth.verifyOtp({ name: regName, email: regEmail, password: regPassword, company: regCompany, otp: otpValue });
      setToken(res.token);
      if (res.user) {
        localStorage.setItem('retentio_user', JSON.stringify(res.user));
      }
      setRegStep('success');
    } catch (err: any) {
      setError(getNaturalErrorMessage(err));
    }
    finally { setLoading(false); }
  };

  const handleResend = async () => {
    if (!canResend) return; setError('');
    try {
      setLoading(true);
      await api.auth.resendOtp(regEmail, regCompany);
      setOtp(['','','','','','']); setOtpTimer(300); setResendTimer(60); setCanResend(false);
      setTimeout(() => otpRefs.current[0]?.focus(), 120);
    } catch (err: any) { setError(getNaturalErrorMessage(err)); }
    finally { setLoading(false); }
  };

  const goToSignIn = () => {
    setMode('signin'); setRegStep('details');
    setSiEmail(regEmail); setError('');
  };

  // ── shared input style (matches app's .input-field) ──────────
  const inp = (hasError?: boolean): React.CSSProperties => ({
    width: '100%',
    padding: '9px 12px 9px 38px',
    background: 'var(--bg-card)',
    border: `1px solid ${hasError ? 'var(--danger-border)' : 'var(--border-strong)'}`,
    borderRadius: 10,
    fontSize: 14,
    color: 'var(--text-primary)',
    fontFamily: 'inherit',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.15s, box-shadow 0.15s',
  });
  const lbl: React.CSSProperties = {
    display: 'block', fontSize: 12, fontWeight: 700,
    color: 'var(--text-secondary)', marginBottom: 6, letterSpacing: '0.01em',
  };
  const iconWrap: React.CSSProperties = { position: 'relative' };
  const iconPos: React.CSSProperties = {
    position: 'absolute', left: 11, top: '50%',
    transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none',
    display: 'flex', alignItems: 'center',
  };

  const stepNum = regStep === 'details' ? 1 : regStep === 'otp' ? 2 : 3;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-subtle)',
      display: 'flex',
      fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
    }}>

      {/* ══ LEFT PANEL — brand/feature strip ══ */}
      <div style={{
        display: 'none',
        width: '42%',
        flexShrink: 0,
        background: 'var(--bg-card)',
        borderRight: '1px solid var(--border)',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '48px 44px',
        position: 'sticky',
        top: 0,
        height: '100vh',
      }} className="auth-left">

        {/* Logo */}
        <div>
          <div style={{ marginBottom: 48 }}>
            <img
              src="/retentio-logo-horizontal.png"
              alt="Retentio Logo"
              style={{ height: 38, width: 'auto', objectFit: 'contain' }}
            />
          </div>

          <h1 style={{ fontSize: 30, fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1.25, letterSpacing: '-0.022em', margin: '0 0 14px' }}>
            Keep every client.<br />
            <span style={{ color: 'var(--text-secondary)' }}>Grow every month.</span>
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6, letterSpacing: '-0.006em', margin: '0 0 36px' }}>
            The all-in-one platform for agencies to manage clients, invoices, and teams.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {features.map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--bg-raised)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', flexShrink: 0 }}>
                  {f.icon}
                </div>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer social proof */}
        <div>
          <div style={{ display: 'flex' }}>
            {['AK','SM','RV','JP'].map((init, i) => (
              <div key={i} style={{ width: 28, height: 28, borderRadius: '50%', background: `hsl(${200 + i*40},55%,50%)`, border: '2px solid var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: 'var(--solid-btn-text)', marginLeft: i === 0 ? 0 : -8 }}>
                {init}
              </div>
            ))}
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 10 }}>
            Trusted by <strong style={{ color: 'var(--text-primary)' }}>500+ agencies</strong> across India
          </p>
        </div>
      </div>

      {/* ══ RIGHT PANEL — auth form ══ */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 24px',
        overflowY: 'auto',
      }}>
        <div style={{ width: '100%', maxWidth: 400 }}>

          {/* Mobile logo */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 28, justifyContent: 'center' }} className="auth-mobile-logo">
            <img
              src="/retentio-logo-horizontal.png"
              alt="Retentio Logo"
              style={{ height: 32, width: 'auto', objectFit: 'contain' }}
            />
          </div>

          {/* Form card — matches app's .glass-panel */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 16,
            padding: '32px 28px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
          }}>

            {/* Error banner */}
            {errMsg && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9, background: errMsg.includes('server') || errMsg.includes('connect') ? 'var(--warn-bg)' : 'var(--danger-bg)', border: `1px solid ${errMsg.includes('server') || errMsg.includes('connect') ? 'var(--warn-border)' : 'var(--danger-border)'}`, borderRadius: 8, padding: '10px 13px', marginBottom: 18, fontSize: 13, color: errMsg.includes('server') || errMsg.includes('connect') ? 'var(--warn-text)' : 'var(--danger-text)' }}>
                <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>{errMsg}</span>
              </div>
            )}

            {/* ══ SIGN IN ══ */}
            {mode === 'signin' && (
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 3px', letterSpacing: '-0.02em' }}>Welcome back</h2>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 24px' }}>Sign in to your workspace</p>

                {/* Email */}
                <div style={{ marginBottom: 14 }}>
                  <label style={lbl}>Email address</label>
                  <div style={iconWrap}>
                    <span style={iconPos}><Mail size={14} /></span>
                    <input
                      style={inp()}
                      type="email"
                      placeholder="you@agency.com"
                      value={siEmail}
                      onChange={e => setSiEmail(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && onLogin(siEmail, siPassword)}
                      onFocus={e => { e.target.style.borderColor = 'var(--text-primary)'; e.target.style.boxShadow = '0 0 0 3px rgba(0,0,0,0.06)'; }}
                      onBlur={e => { e.target.style.borderColor = 'var(--text-muted)'; e.target.style.boxShadow = 'none'; }}
                    />
                  </div>
                </div>

                {/* Password */}
                <div style={{ marginBottom: 22 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <label style={{ ...lbl, marginBottom: 0 }}>Password</label>
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', padding: 0, fontFamily: 'inherit' }}>
                      Forgot password?
                    </button>
                  </div>
                  <div style={{ ...iconWrap, position: 'relative' }}>
                    <span style={iconPos}><Lock size={14} /></span>
                    <input
                      style={{ ...inp(), paddingRight: 40 }}
                      type={showPwd ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={siPassword}
                      onChange={e => setSiPassword(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && onLogin(siEmail, siPassword)}
                      onFocus={e => { e.target.style.borderColor = 'var(--text-primary)'; e.target.style.boxShadow = '0 0 0 3px rgba(0,0,0,0.06)'; }}
                      onBlur={e => { e.target.style.borderColor = 'var(--text-muted)'; e.target.style.boxShadow = 'none'; }}
                    />
                    <button type="button" onClick={() => setShowPwd(!showPwd)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0, display: 'flex' }}>
                      {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                {/* Sign In button — matches .btn-primary */}
                <button
                  onClick={() => onLogin(siEmail, siPassword)}
                  disabled={loginLoading}
                  style={{ width: '100%', padding: '10px', background: 'var(--solid-btn-bg)', color: 'var(--solid-btn-text)', border: '1px solid var(--border-focus)', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: loginLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: loginLoading ? 0.7 : 1, marginBottom: 18, fontFamily: 'inherit', transition: 'background 0.15s' }}
                  onMouseEnter={e => { if (!loginLoading) (e.currentTarget as HTMLButtonElement).style.background = 'var(--solid-btn-bg)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--solid-btn-bg)'; }}
                >
                  {loginLoading ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <LogIn size={14} />}
                  {loginLoading ? 'Signing in…' : 'Sign In'}
                </button>

                <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)', margin: '0 0 8px' }}>
                  New agency?{' '}
                  <button onClick={() => { setMode('register'); setError(''); setRegStep('details'); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', textDecoration: 'underline', padding: 0, fontFamily: 'inherit' }}>
                    Create your account
                  </button>
                </p>
              </div>
            )}

            {/* ══ REGISTER — Step 1: Details ══ */}
            {mode === 'register' && regStep === 'details' && (
              <div>
                {/* Step dots */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20 }}>
                  {[1,2,3].map(s => (
                    <div key={s} style={{ height: 4, borderRadius: 9999, transition: 'all 0.2s', background: s <= stepNum ? 'var(--solid-btn-bg)' : 'var(--border)', width: s === stepNum ? 20 : 8 }} />
                  ))}
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 4 }}>Step 1 of 3</span>
                </div>

                <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 3px', letterSpacing: '-0.02em' }}>Create your agency</h2>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 22px' }}>Admin account for your workspace</p>

                {/* Info banner */}
                <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: 8, padding: '9px 12px', marginBottom: 18, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  After setup, add HR managers and team members from inside the app.
                </div>

                <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[
                    { label: 'Full name',             name: 'name',     type: 'text',  placeholder: 'Jane Smith',     icon: <User size={14} />,     val: regName,    set: setRegName },
                    { label: 'Agency / company name', name: 'company',  type: 'text',  placeholder: 'Acme Agency LLP', icon: <Building2 size={14} />, val: regCompany, set: setRegCompany },
                    { label: 'Work email',            name: 'email',    type: 'email', placeholder: 'you@agency.com',  icon: <Mail size={14} />,     val: regEmail,   set: setRegEmail },
                  ].map(f => (
                    <div key={f.name}>
                      <label style={lbl}>{f.label}</label>
                      <div style={{ position: 'relative' }}>
                        <span style={iconPos}>{f.icon}</span>
                        <input
                          type={f.type}
                          placeholder={f.placeholder}
                          value={f.val}
                          onChange={e => f.set(e.target.value)}
                          style={inp(fieldErrors[f.name])}
                          onFocus={e => { e.target.style.borderColor = 'var(--text-primary)'; e.target.style.boxShadow = '0 0 0 3px rgba(0,0,0,0.06)'; }}
                          onBlur={e => { e.target.style.borderColor = fieldErrors[f.name] ? 'var(--danger-border)' : 'var(--text-muted)'; e.target.style.boxShadow = 'none'; }}
                        />
                      </div>
                    </div>
                  ))}

                  <div>
                    <label style={lbl}>Password <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(min 8 chars)</span></label>
                    <div style={{ position: 'relative' }}>
                      <span style={iconPos}><Lock size={14} /></span>
                      <input
                        type={showPwd ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={regPassword}
                        onChange={e => setRegPassword(e.target.value)}
                        style={{ ...inp(fieldErrors.password), paddingRight: 40 }}
                        onFocus={e => { e.target.style.borderColor = 'var(--text-primary)'; e.target.style.boxShadow = '0 0 0 3px rgba(0,0,0,0.06)'; }}
                        onBlur={e => { e.target.style.borderColor = fieldErrors.password ? 'var(--danger-border)' : 'var(--text-muted)'; e.target.style.boxShadow = 'none'; }}
                      />
                      <button type="button" onClick={() => setShowPwd(!showPwd)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0, display: 'flex' }}>
                        {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>

                  <div style={{ marginBottom: 6 }}>
                    <label style={lbl}>Confirm password</label>
                    <div style={{ position: 'relative' }}>
                      <span style={iconPos}><Lock size={14} /></span>
                      <input
                        type={showPwd ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={regConfirm}
                        onChange={e => setRegConfirm(e.target.value)}
                        style={inp(fieldErrors.confirm)}
                        onFocus={e => { e.target.style.borderColor = 'var(--text-primary)'; e.target.style.boxShadow = '0 0 0 3px rgba(0,0,0,0.06)'; }}
                        onBlur={e => { e.target.style.borderColor = fieldErrors.confirm ? 'var(--danger-border)' : 'var(--text-muted)'; e.target.style.boxShadow = 'none'; }}
                      />
                    </div>
                  </div>

                  <button type="submit" disabled={loading} style={{ width: '100%', padding: '10px', background: 'var(--solid-btn-bg)', color: 'var(--solid-btn-text)', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: loading ? 0.7 : 1, fontFamily: 'inherit' }}>
                    {loading ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Mail size={14} />}
                    {loading ? 'Sending code…' : 'Send Verification Code'}
                  </button>
                </form>

                <button onClick={() => { setMode('signin'); setError(''); }} style={{ width: '100%', marginTop: 10, padding: '9px', background: 'var(--bg-subtle)', color: 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: 'inherit' }}>
                  <ArrowLeft size={13} /> Back to Sign In
                </button>
              </div>
            )}

            {/* ══ REGISTER — Step 2: OTP ══ */}
            {mode === 'register' && regStep === 'otp' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20 }}>
                  {[1,2,3].map(s => (
                    <div key={s} style={{ height: 4, borderRadius: 9999, transition: 'all 0.2s', background: s <= stepNum ? 'var(--solid-btn-bg)' : 'var(--border)', width: s === stepNum ? 20 : 8 }} />
                  ))}
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 4 }}>Step 2 of 3</span>
                </div>

                {/* Sent banner */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: 10, padding: '11px 14px', marginBottom: 20 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--bg-raised)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Mail size={14} style={{ color: 'var(--text-secondary)' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Code sent to your email</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>{regEmail}</div>
                  </div>
                </div>

                <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 3px', letterSpacing: '-0.02em' }}>Enter verification code</h2>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 20px' }}>We sent a 6-digit code — check your inbox</p>

                <form onSubmit={handleVerifyOtp}>
                  {/* OTP boxes */}
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 16 }} onPaste={handleOtpPaste}>
                    {otp.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={el => { otpRefs.current[idx] = el; }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={e => handleOtpChange(idx, e.target.value)}
                        onKeyDown={e => handleOtpKeyDown(idx, e)}
                        style={{
                          width: 48, height: 54,
                          textAlign: 'center',
                          fontSize: 22, fontWeight: 800,
                          fontFamily: "'JetBrains Mono', monospace",
                          background: digit ? 'var(--bg-raised)' : 'var(--bg-card)',
                          border: `2px solid ${digit ? 'var(--border-focus)' : 'var(--border)'}`,
                          borderRadius: 10,
                          color: 'var(--text-primary)',
                          outline: 'none',
                          cursor: 'text',
                          transition: 'border-color 0.15s, background 0.15s',
                        }}
                        onFocus={e => { e.target.style.borderColor = 'var(--text-primary)'; e.target.style.boxShadow = '0 0 0 3px rgba(0,0,0,0.06)'; }}
                        onBlur={e => { e.target.style.borderColor = digit ? 'var(--text-primary)' : 'var(--border)'; e.target.style.boxShadow = 'none'; }}
                      />
                    ))}
                  </div>

                  {/* Timer */}
                  <div style={{ textAlign: 'center', marginBottom: 20, fontSize: 13, color: 'var(--text-muted)' }}>
                    {otpTimer > 0 ? (
                      <>Code expires in <span style={{ fontFamily: 'monospace', fontWeight: 700, color: otpTimer < 60 ? 'var(--danger-text)' : 'var(--text-primary)' }}>{fmtTime(otpTimer)}</span></>
                    ) : (
                      <span style={{ color: 'var(--danger-text)', fontWeight: 600 }}>Code expired — request a new one below</span>
                    )}
                  </div>

                  <button type="submit" disabled={loading || otpValue.length < 6 || otpTimer === 0} style={{ width: '100%', padding: '10px', background: 'var(--solid-btn-bg)', color: 'var(--solid-btn-text)', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: (loading || otpValue.length < 6 || otpTimer === 0) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: (loading || otpValue.length < 6) ? 0.55 : 1, marginBottom: 12, fontFamily: 'inherit' }}>
                    {loading ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <ShieldCheck size={14} />}
                    {loading ? 'Verifying…' : 'Verify & Create Account'}
                  </button>
                </form>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => { setRegStep('details'); setError(''); }} style={{ flex: 1, padding: '9px', background: 'var(--bg-subtle)', color: 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: 'inherit' }}>
                    <ArrowLeft size={13} /> Change email
                  </button>
                  <button onClick={handleResend} disabled={!canResend || loading} style={{ flex: 1, padding: '9px', background: 'var(--bg-subtle)', color: canResend ? 'var(--text-primary)' : 'var(--text-muted)', border: `1px solid ${canResend ? 'var(--border-strong)' : 'var(--border)'}`, borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: canResend ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: 'inherit' }}>
                    <RefreshCw size={13} />
                    {canResend ? 'Resend code' : `Resend in ${resendTimer}s`}
                  </button>
                </div>
              </div>
            )}

            {/* ══ REGISTER — Step 3: Success ══ */}
            {mode === 'register' && regStep === 'success' && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 24, justifyContent: 'center' }}>
                  {[1,2,3].map(s => (
                    <div key={s} style={{ height: 4, width: s === 3 ? 20 : 8, borderRadius: 9999, background: 'var(--solid-btn-bg)' }} />
                  ))}
                </div>

                <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--success-bg)', border: '1px solid var(--success-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
                  <CheckCircle2 size={32} style={{ color: 'var(--success-text)' }} />
                </div>

                <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 8px', letterSpacing: '-0.02em' }}>Account created! 🎉</h2>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 22px' }}>
                  Welcome, <strong>{regName}</strong>.<br />
                  <strong>{regCompany}</strong> is ready to use.
                </p>

                {/* Credentials summary */}
                <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px', marginBottom: 20, textAlign: 'left' }}>
                  <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 10 }}>Your login details</div>
                  {[
                    { label: 'Email', value: regEmail },
                    { label: 'Role',  value: 'Admin — full access' },
                  ].map(row => (
                    <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{row.label}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', fontFamily: row.label === 'Email' ? 'monospace' : 'inherit' }}>{row.value}</span>
                    </div>
                  ))}
                </div>

                <button onClick={goToSignIn} style={{ width: '100%', padding: '10px', background: 'var(--solid-btn-bg)', color: 'var(--solid-btn-text)', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'inherit' }}>
                  <LogIn size={14} /> Sign In to Your Account
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Responsive + animation styles */}
      <style>{`
        @media (min-width: 860px) {
          .auth-left { display: flex !important; }
          .auth-mobile-logo { display: none !important; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default LoginScreen;
