import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Mail, Lock, Eye, EyeOff,
  Loader2, AlertCircle, Building2, User,
  CheckCircle2, RefreshCw, ShieldCheck,
  ArrowRight, ArrowLeft, Sparkles, Users, Receipt, BarChart3, LogIn,
  KeyRound
} from 'lucide-react';
import { api, setToken } from '../../services/api';
import { getNaturalErrorMessage } from '../../services/errors';

interface LoginScreenProps {
  onLogin: (email: string, password: string) => void;
  loginError?: string;
  loginLoading?: boolean;
  defaultMode?: 'signin' | 'register';
  onClearError?: () => void;
}

type RegStep = 'details' | 'otp' | 'success';
type ForgotStep = 'email' | 'code' | 'newpassword' | 'done';

const features = [
  { icon: <Sparkles size={16} />, title: 'Client Retention Intelligence', desc: 'Proactive at-risk alerts & relationship health' },
  { icon: <Users size={16} />, title: 'Team & Brand Management', desc: 'Assign roles, track performance' },
  { icon: <Receipt size={16} />, title: 'Invoicing & Payments', desc: 'Automated billing, UPI, net banking' },
  { icon: <BarChart3 size={16} />, title: 'Real-time Analytics', desc: 'Revenue, profit & growth insights' },
];

const PATH_RIGHT = 'M 0,0 L 0.92,0 C 0.98,0.18 1.0,0.34 0.94,0.50 C 0.88,0.66 0.96,0.84 0.92,1.0 L 0,1.0 Z';
const PATH_LEFT  = 'M 1,0 L 0.08,0 C 0.02,0.18 0.0,0.34 0.06,0.50 C 0.12,0.66 0.04,0.84 0.08,1.0 L 1,1.0 Z';

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLogin, loginError = '', loginLoading = false, defaultMode = 'signin', onClearError,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [mode, setMode] = useState<'signin' | 'register'>(() => {
    if (typeof window !== 'undefined') {
      if (window.location.pathname === '/signup') return 'register';
      if (window.location.pathname === '/login') return 'signin';
    }
    return defaultMode;
  });

  const clearAllErrors = () => {
    setError('');
    setFieldErrors({});
    if (onClearError) onClearError();
  };

  useEffect(() => {
    clearAllErrors();
    if (location.pathname === '/signup') {
      setMode('register');
      document.title = 'Create Your Agency — Retentio';
    } else if (location.pathname === '/login') {
      setMode('signin');
      document.title = 'Sign In — Retentio';
    } else if (defaultMode) {
      setMode(defaultMode);
    }
  }, [location.pathname, defaultMode]);
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [regStep, setRegStep] = useState<RegStep>('details');

  // Sign In inputs
  const [siEmail, setSiEmail] = useState('');
  const [siPassword, setSiPassword] = useState('');

  // Register inputs
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm, setRegConfirm] = useState('');
  const [regCompany, setRegCompany] = useState('');

  // OTP state
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [otpTimer, setOtpTimer] = useState(300);
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  // Forgot password state
  const [forgotStep, setForgotStep] = useState<ForgotStep | null>(null);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotCode, setForgotCode] = useState('');
  const [forgotNewPwd, setForgotNewPwd] = useState('');
  const [forgotConfirmPwd, setForgotConfirmPwd] = useState('');
  const [forgotTimer, setForgotTimer] = useState(300);
  const [forgotCanResend, setForgotCanResend] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({});
  const [hasUsers, setHasUsers] = useState<boolean | null>(null);

  useEffect(() => {
    api.auth.status().then((res) => {
      if (res && typeof res.hasUsers === 'boolean') {
        setHasUsers(res.hasUsers);
      }
    }).catch(() => {});
  }, []);

  const errMsg = loginError || error;
  const otpValue = otp.join('');

  // Countdown timer for OTP
  useEffect(() => {
    if (regStep !== 'otp' && forgotStep !== 'code') return;
    const t = setInterval(() => {
      if (regStep === 'otp') {
        setOtpTimer(p => { if (p <= 1) { clearInterval(t); return 0; } return p - 1; });
        setResendTimer(p => { if (p <= 1) { setCanResend(true); return 0; } return p - 1; });
      }
      if (forgotStep === 'code') {
        setForgotTimer(p => { if (p <= 1) { clearInterval(t); return 0; } return p - 1; });
        if (forgotTimer <= 60) setForgotCanResend(true);
      }
    }, 1000);
    return () => clearInterval(t);
  }, [regStep, forgotStep, forgotTimer]);

  const fmtTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const handleOtpChange = (idx: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp];
    next[idx] = val.slice(-1);
    setOtp(next);
    if (val && idx < 5) otpRefs.current[idx + 1]?.focus();
  };

  const handleOtpKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) otpRefs.current[idx - 1]?.focus();
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const p = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (p.length === 6) {
      setOtp(p.split(''));
      otpRefs.current[5]?.focus();
    }
    e.preventDefault();
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    const errs: Record<string, boolean> = {};
    if (!regName) errs.name = true;
    if (!regCompany) errs.company = true;
    if (!regEmail) errs.email = true;
    if (!regPassword) errs.password = true;
    if (!regConfirm) errs.confirm = true;
    if (Object.keys(errs).length) {
      setFieldErrors(errs);
      setError('Please fill in all fields.');
      return;
    }
    if (regPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (regPassword !== regConfirm) {
      setFieldErrors({ confirm: true });
      setError('Passwords do not match.');
      return;
    }
    try {
      setLoading(true);
      await api.auth.sendOtp({ name: regName, email: regEmail, password: regPassword, company: regCompany });
      setOtp(['', '', '', '', '', '']);
      setOtpTimer(300);
      setResendTimer(60);
      setCanResend(false);
      setRegStep('otp');
      setTimeout(() => otpRefs.current[0]?.focus(), 120);
    } catch (err: any) {
      setError(getNaturalErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (otpValue.length < 6) {
      setError('Enter the complete 6-digit code.');
      return;
    }
    try {
      setLoading(true);
      const res = await api.auth.verifyOtp({ name: regName, email: regEmail, password: regPassword, company: regCompany, otp: otpValue });
      if (res?.token) {
        setToken(res.token);
      }
      setRegStep('success');
    } catch (err: any) {
      setError(getNaturalErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    setError('');
    try {
      setLoading(true);
      await api.auth.resendOtp(regEmail, regCompany);
      setOtp(['', '', '', '', '', '']);
      setOtpTimer(300);
      setResendTimer(60);
      setCanResend(false);
      setTimeout(() => otpRefs.current[0]?.focus(), 120);
    } catch (err: any) {
      setError(getNaturalErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // ── Forgot password handlers ──
  const handleForgotSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    clearAllErrors();
    const cleanEmail = forgotEmail.trim().toLowerCase();
    if (!cleanEmail) {
      setError('Please enter your email address.');
      return;
    }
    try {
      setLoading(true);
      await api.auth.forgotPassword(cleanEmail).catch(() => {});
      setForgotStep('code');
      setForgotTimer(300);
      setForgotCanResend(false);
    } catch (_err: any) {
      setForgotStep('code');
      setForgotTimer(300);
      setForgotCanResend(false);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotResend = async () => {
    if (!forgotCanResend) return;
    clearAllErrors();
    const cleanEmail = forgotEmail.trim().toLowerCase();
    try {
      setLoading(true);
      await api.auth.forgotPassword(cleanEmail).catch(() => {});
      setForgotTimer(300);
      setForgotCanResend(false);
    } catch (_err: any) {
      setForgotTimer(300);
      setForgotCanResend(false);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!forgotCode || forgotCode.length < 6) {
      setError('Enter the complete 6-digit code.');
      return;
    }
    if (!forgotNewPwd || forgotNewPwd.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (forgotNewPwd !== forgotConfirmPwd) {
      setError('Passwords do not match.');
      return;
    }
    try {
      setLoading(true);
      await api.auth.resetPassword({ email: forgotEmail, code: forgotCode, newPassword: forgotNewPwd });
      setForgotStep('done');
    } catch (err: any) {
      setError(getNaturalErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // ── Mobile active input centering to keep in middle & avoid keyboard obstruction ──
  const centerTargetInput = (target: HTMLElement) => {
    if (!target) return;
    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 980;
    if (!isMobile) return;

    const performCenter = () => {
      const fieldBox = (target.closest('.field-input-box') || target.closest('.otp-inputs-row') || target) as HTMLElement;
      if (!fieldBox) return;

      if (window.visualViewport) {
        const vh = window.visualViewport.height;
        const rect = fieldBox.getBoundingClientRect();
        const currentCenter = rect.top + rect.height / 2;
        const targetCenter = vh / 2;
        const delta = currentCenter - targetCenter;
        
        if (Math.abs(delta) > 4) {
          window.scrollBy({
            top: delta,
            behavior: 'smooth'
          });
        }
      } else {
        fieldBox.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest'
        });
      }
    };

    performCenter();
    setTimeout(performCenter, 120);
    setTimeout(performCenter, 320);
  };

  const handleInputInteraction = (e: React.FocusEvent<HTMLElement> | React.MouseEvent<HTMLElement>) => {
    const el = e.target as HTMLElement;
    if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) {
      centerTargetInput(el);
    }
  };

  useEffect(() => {
    const handleViewportResize = () => {
      const active = document.activeElement as HTMLElement | null;
      if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) {
        centerTargetInput(active);
      }
    };

    const vv = window.visualViewport;
    if (vv) {
      vv.addEventListener('resize', handleViewportResize);
      return () => {
        vv.removeEventListener('resize', handleViewportResize);
      };
    }
  }, []);

  const switchToRegister = () => {
    clearAllErrors();
    setRegStep('details');
    setForgotStep(null);
    setMode('register');
    navigate('/signup');
    if (typeof window !== 'undefined' && window.innerWidth <= 980) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const switchToSignIn = () => {
    clearAllErrors();
    setRegStep('details');
    setForgotStep(null);
    if (regEmail) setSiEmail(regEmail);
    setMode('signin');
    navigate('/login');
    if (typeof window !== 'undefined' && window.innerWidth <= 980) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const switchToForgot = () => {
    clearAllErrors();
    setForgotStep('email');
    setForgotEmail(siEmail);
    if (typeof window !== 'undefined' && window.innerWidth <= 980) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const isSignIn = mode === 'signin';

  // ── Password strength calculator ──────────────────────────
  const getPasswordStrength = (pwd: string): { score: number; label: string; color: string } => {
    if (!pwd) return { score: 0, label: '', color: '' };
    let score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    if (score <= 1) return { score: 1, label: 'Weak', color: '#EF4444' };
    if (score <= 2) return { score: 2, label: 'Fair', color: '#F59E0B' };
    if (score <= 3) return { score: 3, label: 'Good', color: '#3B82F6' };
    if (score <= 4) return { score: 4, label: 'Strong', color: '#10B981' };
    return { score: 5, label: 'Excellent', color: '#059639' };
  };

  const pwdStrength = getPasswordStrength(regPassword);

  return (
    <div className="auth-root">
      <div className="auth-bg-ambient" />

      <svg style={{ position: 'absolute', width: 0, height: 0, pointerEvents: 'none' }} aria-hidden="true">
        <defs>
          <clipPath id="heroCurvedClipDynamic" clipPathUnits="objectBoundingBox">
            <motion.path
              initial={false}
              animate={{ d: isSignIn ? PATH_RIGHT : PATH_LEFT }}
              transition={{ duration: 0.72, ease: [0.22, 1, 0.36, 1] }}
            />
          </clipPath>
        </defs>
      </svg>

      <div
        className={`auth-slider-container ${isSignIn ? 'mode-signin' : 'mode-register'}`}
        onFocus={handleInputInteraction}
        onClick={handleInputInteraction}
      >

        {/* ── REGISTER FORM ── */}
        <div className={`auth-form-slot slot-left ${isSignIn ? 'slot-inactive-left' : 'slot-active'}`}>
          <div className="form-inner-wrapper">
            <div className="auth-slot-header-row">
              <Link to="/" title="Go to Retentio Homepage" className="brand-logo-link">
                <img src="/retentio-logo-horizontal.png" alt="Retentio" className="brand-logo-img" />
              </Link>
              <Link to="/" className="btn-return-home" title="Back to home">
                <ArrowLeft size={13} />
                <span>Back to Home</span>
              </Link>
            </div>

            {errMsg && !isSignIn && (
              <div className="auth-alert-banner">
                <AlertCircle size={15} className="shrink-0" />
                <span>{errMsg}</span>
              </div>
            )}

            {regStep === 'details' && (
              <div className="form-fade-in">
                <div className="form-header">
                  <div className="step-badge">
                    <span className="step-pill active" />
                    <span className="step-pill" />
                    <span className="step-pill" />
                    <span className="step-label">Step 1 of 3</span>
                  </div>
                  <h2 className="form-title">Create your agency</h2>
                  <p className="form-subtitle">Set up your workspace in less than 2 minutes</p>
                </div>

                <form onSubmit={handleSendOtp} className="form-fields">
                  <div>
                    <label className="field-label">Full name</label>
                    <div className="field-input-box">
                      <User size={15} className="field-icon" />
                      <input type="text" placeholder="Jane Smith" value={regName} onChange={e => { clearAllErrors(); setRegName(e.target.value); }} className={`text-input ${fieldErrors.name ? 'input-error' : ''}`} />
                    </div>
                  </div>
                  <div>
                    <label className="field-label">Agency / company name</label>
                    <div className="field-input-box">
                      <Building2 size={15} className="field-icon" />
                      <input type="text" placeholder="Acme Digital LLP" value={regCompany} onChange={e => { clearAllErrors(); setRegCompany(e.target.value); }} className={`text-input ${fieldErrors.company ? 'input-error' : ''}`} />
                    </div>
                  </div>
                  <div>
                    <label className="field-label">Work email</label>
                    <div className="field-input-box">
                      <Mail size={15} className="field-icon" />
                      <input type="email" placeholder="you@agency.com" value={regEmail} onChange={e => { clearAllErrors(); setRegEmail(e.target.value); }} className={`text-input ${fieldErrors.email ? 'input-error' : ''}`} />
                    </div>
                  </div>
                  <div className="grid-two-cols">
                    <div>
                      <label className="field-label">Password</label>
                      <div className="field-input-box">
                        <Lock size={15} className="field-icon" />
                        <input type={showPwd ? 'text' : 'password'} placeholder="Min 8 chars" value={regPassword} onChange={e => { clearAllErrors(); setRegPassword(e.target.value); }} className={`text-input ${fieldErrors.password ? 'input-error' : ''}`} />
                        <button type="button" onClick={() => setShowPwd(!showPwd)} className="toggle-pwd-btn">
                          {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="field-label">Confirm password</label>
                      <div className="field-input-box">
                        <Lock size={15} className="field-icon" />
                        <input type={showConfirmPwd ? 'text' : 'password'} placeholder="••••••••" value={regConfirm} onChange={e => { clearAllErrors(); setRegConfirm(e.target.value); }} className={`text-input ${fieldErrors.confirm ? 'input-error' : ''}`} />
                        <button type="button" onClick={() => setShowConfirmPwd(!showConfirmPwd)} className="toggle-pwd-btn">
                          {showConfirmPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </div>
                  </div>
                  <button type="submit" disabled={loading} className="btn-primary-action">
                    {loading ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
                    <span>{loading ? 'Sending code…' : 'Continue to Verification'}</span>
                  </button>
                </form>

                <p className="switch-prompt">
                  Already have an agency account?{' '}
                  <button type="button" onClick={switchToSignIn} className="switch-link-btn">Sign in here</button>
                </p>
              </div>
            )}

            {regStep === 'otp' && (
              <div className="form-fade-in">
                <div className="form-header">
                  <div className="step-badge">
                    <span className="step-pill filled" />
                    <span className="step-pill active" />
                    <span className="step-pill" />
                    <span className="step-label">Step 2 of 3</span>
                  </div>
                  <h2 className="form-title">Verify your email</h2>
                  <p className="form-subtitle">
                    Enter the 6-digit code sent to <strong className="text-highlight">{regEmail}</strong>
                  </p>
                </div>

                <form onSubmit={handleVerifyOtp} className="otp-form-content">
                  <div className="otp-inputs-row">
                    {otp.map((d, i) => (
                      <input
                        key={i}
                        ref={el => { otpRefs.current[i] = el; }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={d}
                        onChange={e => handleOtpChange(i, e.target.value)}
                        onKeyDown={e => handleOtpKeyDown(i, e)}
                        onPaste={handleOtpPaste}
                        className={`otp-digit-box ${d ? 'filled' : ''}`}
                      />
                    ))}
                  </div>
                  <div className="otp-meta-row">
                    <span className={`timer-tag ${otpTimer === 0 ? 'expired' : ''}`}>Expires in {fmtTime(otpTimer)}</span>
                    <button type="button" onClick={handleResend} disabled={!canResend || loading} className={`resend-btn ${canResend ? 'active' : ''}`}>
                      <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
                      {canResend ? 'Resend code' : `Resend in ${resendTimer}s`}
                    </button>
                  </div>
                  <button type="submit" disabled={loading || otpValue.length < 6} className="btn-primary-action">
                    {loading ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
                    <span>{loading ? 'Verifying…' : 'Verify & Launch Workspace'}</span>
                  </button>
                  <button type="button" onClick={() => setRegStep('details')} className="btn-ghost-back">← Back to edit details</button>
                </form>
              </div>
            )}

            {regStep === 'success' && (
              <div className="form-fade-in text-center">
                <div className="success-icon-badge"><CheckCircle2 size={36} /></div>
                <h2 className="form-title">Workspace Ready!</h2>
                <p className="form-subtitle">Your agency admin account has been provisioned.</p>
                <div className="success-summary-card">
                  <div className="summary-row"><span className="summary-lbl">Admin</span><span className="summary-val">{regName}</span></div>
                  <div className="summary-row"><span className="summary-lbl">Company</span><span className="summary-val">{regCompany}</span></div>
                  <div className="summary-row"><span className="summary-lbl">Email</span><span className="summary-val font-mono">{regEmail}</span></div>
                </div>
                <button type="button" onClick={() => onLogin(regEmail, regPassword)} className="btn-primary-action">
                  <LogIn size={16} />
                  <span>Sign In to Your Workspace</span>
                </button>
              </div>
            )}

            <div className="security-tagline">
              <ShieldCheck size={13} className="text-emerald-500" />
              <span>Secured with 256-bit AES encryption</span>
            </div>
          </div>
        </div>

        {/* ── SIGN IN FORM ── */}
        <div className={`auth-form-slot slot-right ${isSignIn ? 'slot-active' : 'slot-inactive-right'}`}>
          <div className="form-inner-wrapper">
            <div className="auth-slot-header-row">
              <Link to="/" title="Go to Retentio Homepage" className="brand-logo-link">
                <img src="/retentio-logo-horizontal.png" alt="Retentio" className="brand-logo-img" />
              </Link>
              <Link to="/" className="btn-return-home" title="Back to home">
                <ArrowLeft size={13} />
                <span>Back to Home</span>
              </Link>
            </div>

            {hasUsers === false && isSignIn && !errMsg && (
              <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-200">
                <div className="flex items-center gap-2 font-semibold">
                  <Sparkles size={14} className="text-amber-400" />
                  <span>Agency Setup Required</span>
                </div>
                <p className="mt-1 text-zinc-300">
                  No administrator account exists yet. Create your agency workspace to get started.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    if (siEmail) setRegEmail(siEmail);
                    if (siPassword) {
                      setRegPassword(siPassword);
                      setRegConfirm(siPassword);
                    }
                    navigate('/signup');
                  }}
                  className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-black hover:bg-amber-400 transition-colors"
                >
                  <span>Create Admin Account</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            )}

            {errMsg && isSignIn && !forgotStep && (
              <div className="auth-alert-banner flex flex-col gap-1.5 items-start">
                <div className="flex items-center gap-2">
                  <AlertCircle size={15} className="shrink-0" />
                  <span>{errMsg}</span>
                </div>
                {(errMsg.toLowerCase().includes('no administrator account') || errMsg.toLowerCase().includes('no account found')) && (
                  <button
                    type="button"
                    onClick={() => {
                      clearAllErrors();
                      setMode('register');
                      if (siEmail) setRegEmail(siEmail);
                      if (siPassword) {
                        setRegPassword(siPassword);
                        setRegConfirm(siPassword);
                      }
                      navigate('/signup');
                    }}
                    className="ml-6 inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300 underline"
                  >
                    <span>Click here to create your account now</span>
                    <ArrowRight size={12} />
                  </button>
                )}
              </div>
            )}

            {/* Forgot password flow */}
            {forgotStep === 'email' && (
              <div className="form-fade-in">
                <div className="form-header">
                  <h2 className="form-title">Reset your password</h2>
                  <p className="form-subtitle">Enter your email and we'll send you a reset code</p>
                </div>
                <form onSubmit={handleForgotSendCode} className="form-fields">
                  <div>
                    <label className="field-label">Email address</label>
                    <div className="field-input-box">
                      <Mail size={15} className="field-icon" />
                      <input
                        type="email"
                        placeholder="you@agency.com"
                        value={forgotEmail}
                        onChange={e => { clearAllErrors(); setForgotEmail(e.target.value); }}
                        className="text-input"
                      />
                    </div>
                  </div>
                  <button type="submit" disabled={loading} className="btn-primary-action">
                    {loading ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />}
                    <span>{loading ? 'Sending code…' : 'Send Reset Code'}</span>
                  </button>
                  <button type="button" onClick={() => { clearAllErrors(); setForgotStep(null); }} className="btn-ghost-back">← Back to Sign In</button>
                </form>
              </div>
            )}

            {forgotStep === 'code' && (
              <div className="form-fade-in">
                <div className="form-header">
                  <h2 className="form-title">Enter reset code</h2>
                  <p className="form-subtitle">If the email is registered, you will get a code in your mail. Enter the 6-digit code below to set a new password.</p>
                </div>
                <form onSubmit={handleForgotVerifyCode} className="form-fields">
                  <div>
                    <label className="field-label">Reset code</label>
                    <div className="field-input-box">
                      <ShieldCheck size={15} className="field-icon" />
                      <input type="text" placeholder="6-digit code" value={forgotCode} onChange={e => setForgotCode(e.target.value.replace(/\D/g, '').slice(0, 6))} className="text-input" />
                    </div>
                  </div>
                  <div>
                    <label className="field-label">New password</label>
                    <div className="field-input-box">
                      <Lock size={15} className="field-icon" />
                      <input type={showPwd ? 'text' : 'password'} placeholder="Min 8 chars" value={forgotNewPwd} onChange={e => setForgotNewPwd(e.target.value)} className="text-input" />
                      <button type="button" onClick={() => setShowPwd(!showPwd)} className="toggle-pwd-btn">
                        {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="field-label">Confirm new password</label>
                    <div className="field-input-box">
                      <Lock size={15} className="field-icon" />
                      <input type={showConfirmPwd ? 'text' : 'password'} placeholder="••••••••" value={forgotConfirmPwd} onChange={e => setForgotConfirmPwd(e.target.value)} className="text-input" />
                      <button type="button" onClick={() => setShowConfirmPwd(!showConfirmPwd)} className="toggle-pwd-btn">
                        {showConfirmPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>
                  <div className="otp-meta-row">
                    <span className={`timer-tag ${forgotTimer === 0 ? 'expired' : ''}`}>Expires in {fmtTime(forgotTimer)}</span>
                    <button type="button" onClick={handleForgotResend} disabled={!forgotCanResend || loading} className={`resend-btn ${forgotCanResend ? 'active' : ''}`}>
                      <RefreshCw size={12} />
                      {forgotCanResend ? 'Resend code' : 'Resend available soon'}
                    </button>
                  </div>
                  <button type="submit" disabled={loading} className="btn-primary-action">
                    {loading ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />}
                    <span>{loading ? 'Resetting…' : 'Reset Password'}</span>
                  </button>
                  <button type="button" onClick={() => { setForgotStep('email'); setError(''); }} className="btn-ghost-back">← Back</button>
                </form>
              </div>
            )}

            {forgotStep === 'done' && (
              <div className="form-fade-in text-center">
                <div className="success-icon-badge"><CheckCircle2 size={36} /></div>
                <h2 className="form-title">Password Reset!</h2>
                <p className="form-subtitle">Your password has been changed. Please sign in with your new password.</p>
                <button type="button" onClick={() => { setForgotStep(null); setForgotEmail(''); setForgotCode(''); setForgotNewPwd(''); setForgotConfirmPwd(''); setError(''); }} className="btn-primary-action">
                  <LogIn size={16} />
                  <span>Go to Sign In</span>
                </button>
              </div>
            )}

            {/* Normal sign-in form */}
            {!forgotStep && (
              <>
                <div className="form-header">
                  <h2 className="form-title">Welcome back</h2>
                  <p className="form-subtitle">Sign in to access your agency dashboard</p>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!siEmail.trim()) {
                      setError('Email address is required.');
                      return;
                    }
                    if (!siPassword) {
                      setError('Password is required.');
                      return;
                    }
                    setError('');
                    onLogin(siEmail.trim(), siPassword);
                  }}
                  className="form-fields"
                >
                  <div>
                    <label className="field-label">Email address</label>
                    <div className="field-input-box">
                      <Mail size={15} className="field-icon" />
                      <input
                        type="email"
                        placeholder="you@agency.com"
                        value={siEmail}
                        onChange={e => { clearAllErrors(); setSiEmail(e.target.value); }}
                        className="text-input"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="field-label-between">
                      <label className="field-label">Password</label>
                      <button type="button" onClick={switchToForgot} className="forgot-pwd-btn">
                        Forgot password?
                      </button>
                    </div>
                    <div className="field-input-box">
                      <Lock size={15} className="field-icon" />
                      <input
                        type={showPwd ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={siPassword}
                        onChange={e => { clearAllErrors(); setSiPassword(e.target.value); }}
                        className="text-input pr-10"
                      />
                      <button type="button" onClick={() => setShowPwd(!showPwd)} className="toggle-pwd-btn">
                        {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loginLoading}
                    className="btn-primary-action"
                  >
                    {loginLoading ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
                    <span>{loginLoading ? 'Signing in…' : 'Sign In'}</span>
                  </button>
                </form>

                <p className="switch-prompt">
                  New agency?{' '}
                  <button type="button" onClick={switchToRegister} className="switch-link-btn">Create your account</button>
                </p>
              </>
            )}

            <div className="security-tagline">
              <ShieldCheck size={13} className="text-emerald-500" />
              <span>Secured with end-to-end encryption</span>
            </div>
          </div>
        </div>

        {/* ── SLIDING HERO OVERLAY PANEL ── */}
        <div className={`auth-hero-wrapper ${isSignIn ? 'hero-at-left' : 'hero-at-right'}`}>
          <div className="auth-hero-overlay">
            <div className="hero-orb hero-orb-1" />
            <div className="hero-orb hero-orb-2" />
            <div className="hero-orb hero-orb-3" />
            <div className="hero-content-inner">
              <div className="hero-brand-header">
                <div className="hero-logo-link">
                  <img src="/retentio-logo-horizontal.png" alt="Retentio Logo" className="hero-logo-img" />
                </div>
              </div>
              <div className="hero-headline-stack">
                <div className={`hero-headline-layer ${isSignIn ? 'layer-active' : 'layer-inactive-exit'}`}>
                  <h1 className="hero-main-title">
                    Keep every client.<br />
                    <span className="hero-gradient-text">Grow every month.</span>
                  </h1>
                  <p className="hero-description">
                    The all-in-one platform for agencies to manage clients, invoices, teams, and retention — intelligently.
                  </p>
                </div>
                <div className={`hero-headline-layer ${!isSignIn ? 'layer-active' : 'layer-inactive-enter'}`}>
                  <h1 className="hero-main-title">
                    Scale your agency.<br />
                    <span className="hero-gradient-text">Retain with confidence.</span>
                  </h1>
                  <p className="hero-description">
                    Automate onboarding, protect client relationships, track performance, and deliver client excellence on auto-pilot.
                  </p>
                </div>
              </div>
              <div className="hero-features-list">
                {features.map((f, i) => (
                  <div key={i} className="feature-item-card">
                    <div className="feature-icon-wrapper">{f.icon}</div>
                    <div>
                      <div className="feature-item-title">{f.title}</div>
                      <div className="feature-item-desc">{f.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="hero-trust-footer">
                <div className="trust-stars-row">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className={`star-bar ${i < 4 ? 'active' : ''}`} />
                  ))}
                  <span className="rating-text">4.8/5</span>
                </div>
                <p className="trust-agencies-caption">
                  Trusted by <strong>500+ agencies</strong> across India
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .auth-root { min-height: 100vh; width: 100vw; position: relative; display: flex; align-items: center; justify-content: center; background: #f8fafc; font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif; overflow-x: hidden; }
        .auth-bg-ambient { position: absolute; inset: 0; background: radial-gradient(circle at 10% 20%, rgba(0, 208, 94, 0.04) 0%, transparent 40%), radial-gradient(circle at 90% 80%, rgba(10, 37, 64, 0.05) 0%, transparent 40%); pointer-events: none; }
        .auth-slider-container { position: relative; width: 100%; min-height: 100vh; display: flex; overflow: hidden; background: #ffffff; }
        .auth-form-slot { width: 50%; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 48px 32px; box-sizing: border-box; position: relative; z-index: 10; will-change: transform, opacity, filter; transition: transform 0.72s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.5s cubic-bezier(0.22, 1, 0.36, 1), filter 0.5s ease; }
        .slot-left { order: 1; }
        .slot-right { order: 2; }
        .slot-active { opacity: 1; transform: translate3d(0, 0, 0); filter: blur(0px); pointer-events: auto; transition-delay: 0.08s; }
        .slot-inactive-left { opacity: 0; transform: translate3d(-36px, -14px, 0); filter: blur(5px); pointer-events: none; transition-delay: 0s; }
        .slot-inactive-right { opacity: 0; transform: translate3d(36px, 14px, 0); filter: blur(5px); pointer-events: none; transition-delay: 0s; }
        .form-inner-wrapper { width: 100%; max-width: 420px; }
        .auth-slot-header-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; gap: 12px; }
        .brand-logo-link { display: inline-flex; align-items: center; text-decoration: none; transition: opacity 0.15s ease; }
        .brand-logo-link:hover { opacity: 0.85; }
        .brand-logo-img { height: 34px; width: auto; object-fit: contain; }
        .btn-return-home { display: inline-flex; align-items: center; gap: 6px; font-size: 12.5px; font-weight: 600; color: #475569; text-decoration: none; padding: 6px 14px; border-radius: 9999px; background: #f1f5f9; border: 1px solid #e2e8f0; transition: all 0.2s ease; }
        .btn-return-home:hover { color: #0a2540; background: #e2e8f0; border-color: #cbd5e1; transform: translateX(-2px); }
        .hero-brand-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 24px; }
        .hero-logo-link { display: inline-flex; align-items: center; text-decoration: none; transition: opacity 0.15s ease; }
        .hero-logo-link:hover { opacity: 0.88; }
        .hero-home-badge { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 600; color: rgba(255,255,255,0.85); text-decoration: none; padding: 5px 12px; border-radius: 9999px; background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.2); backdrop-filter: blur(8px); transition: all 0.2s ease; }
        .hero-home-badge:hover { color: #ffffff; background: rgba(255,255,255,0.22); transform: translateX(-2px); }
        .form-header { margin-bottom: 26px; }
        .form-title { font-size: 26px; font-weight: 800; color: #0a0a0a; margin: 0 0 6px; letter-spacing: -0.025em; }
        .form-subtitle { font-size: 13.5px; color: #64748b; margin: 0; line-height: 1.5; }
        .step-badge { display: flex; align-items: center; gap: 6px; margin-bottom: 14px; }
        .step-pill { height: 4px; width: 10px; border-radius: 9999px; background: #e2e8f0; transition: all 0.3s ease; }
        .step-pill.active { width: 24px; background: #059639; }
        .step-pill.filled { background: #059639; }
        .step-label { font-size: 11px; font-weight: 700; color: #64748b; margin-left: 4px; }
        .form-fields { display: flex; flex-direction: column; gap: 16px; }
        .grid-two-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .field-label { display: block; font-size: 12px; font-weight: 700; color: #334155; margin-bottom: 6px; letter-spacing: 0.01em; }
        .field-label-between { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
        .forgot-pwd-btn { background: none; border: none; padding: 0; font-size: 12px; font-weight: 600; color: #059639; cursor: pointer; font-family: inherit; }
        .field-input-box { position: relative; display: flex; align-items: center; }
        .field-icon { position: absolute; left: 14px; color: #94a3b8; pointer-events: none; }
        .text-input { width: 100%; padding: 12px 14px 12px 42px; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 12px; font-size: 15px; color: #0f172a; font-family: inherit; outline: none; transition: all 0.2s ease; box-sizing: border-box; touch-action: manipulation; -webkit-text-size-adjust: 100%; }
        .text-input:focus { border-color: #059639; box-shadow: 0 0 0 3px rgba(5, 150, 57, 0.12); }
        .text-input.input-error { border-color: #ef4444; background: #fef2f2; }
        .toggle-pwd-btn { position: absolute; right: 12px; background: none; border: none; padding: 4px; color: #94a3b8; cursor: pointer; display: flex; align-items: center; transition: color 0.15s; }
        .toggle-pwd-btn:hover { color: #334155; }
        .btn-primary-action { width: 100%; padding: 12px 18px; background: linear-gradient(135deg, #0A2540 0%, #034726 100%); color: #ffffff; border: none; border-radius: 12px; font-size: 14px; font-weight: 700; font-family: inherit; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 6px 20px rgba(10, 37, 64, 0.22); transition: transform 0.15s ease, box-shadow 0.15s ease; margin-top: 4px; }
        .btn-primary-action:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(10, 37, 64, 0.28); }
        .btn-primary-action:active:not(:disabled) { transform: translateY(0); }
        .btn-primary-action:disabled { opacity: 0.65; cursor: not-allowed; }
        .auth-divider { display: flex; align-items: center; gap: 12px; margin: 22px 0 16px; }
        .divider-line { flex: 1; height: 1px; background: #e2e8f0; }
        .divider-text { font-size: 11px; font-weight: 700; color: #94a3b8; letter-spacing: 0.05em; }
        .switch-prompt { text-align: center; font-size: 13px; color: #64748b; margin: 20px 0 0; }
        .switch-link-btn { background: none; border: none; padding: 0; font-size: 13px; font-weight: 700; color: #059639; cursor: pointer; font-family: inherit; }
        .switch-link-btn:hover { text-decoration: underline; }
        .security-tagline { display: flex; align-items: center; justify-content: center; gap: 6px; margin-top: 24px; font-size: 11px; color: #94a3b8; }
        .auth-alert-banner { display: flex; align-items: flex-start; gap: 10px; background: #fef2f2; border: 1px solid #fecaca; color: #b91c1c; border-radius: 10px; padding: 10px 14px; margin-bottom: 20px; font-size: 13px; font-weight: 500; animation: fadeSlideUp 0.25s ease; }
        .otp-inputs-row { display: flex; justify-content: space-between; gap: 8px; margin-bottom: 18px; }
        .otp-digit-box { width: 52px; height: 56px; border-radius: 12px; border: 1.5px solid #cbd5e1; background: #ffffff; font-size: 22px; font-weight: 800; text-align: center; color: #0f172a; outline: none; transition: all 0.2s; }
        .otp-digit-box:focus { border-color: #059639; box-shadow: 0 0 0 3px rgba(5, 150, 57, 0.12); }
        .otp-digit-box.filled { border-color: #059639; background: #f0fdf4; }
        .otp-meta-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
        .timer-tag { font-size: 12px; color: #64748b; font-weight: 600; }
        .timer-tag.expired { color: #ef4444; }
        .resend-btn { background: none; border: none; font-size: 12px; font-weight: 700; color: #94a3b8; cursor: not-allowed; display: flex; align-items: center; gap: 5px; font-family: inherit; }
        .resend-btn.active { color: #059639; cursor: pointer; }
        .btn-ghost-back { width: 100%; background: none; border: none; padding: 10px; font-size: 12.5px; font-weight: 600; color: #64748b; cursor: pointer; margin-top: 8px; font-family: inherit; }
        .btn-ghost-back:hover { color: #0f172a; }
        .success-icon-badge { width: 64px; height: 64px; border-radius: 20px; background: #dcfce7; color: #16a34a; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px; }
        .success-summary-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin: 20px 0 24px; text-align: left; }
        .summary-row { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px solid #f1f5f9; }
        .summary-row:last-child { border-bottom: none; }
        .summary-lbl { font-size: 12px; color: #64748b; }
        .summary-val { font-size: 12.5px; font-weight: 700; color: #0f172a; }
        .auth-hero-wrapper { position: absolute; top: 0; bottom: 0; width: 52%; height: 100vh; z-index: 30; transition: transform 0.72s cubic-bezier(0.22, 1, 0.36, 1), filter 0.72s cubic-bezier(0.22, 1, 0.36, 1); will-change: transform, filter; }
        .auth-hero-wrapper.hero-at-left { transform: translate3d(0%, 0, 0); filter: drop-shadow(14px 0 24px rgba(0, 0, 0, 0.12)); }
        .auth-hero-wrapper.hero-at-right { transform: translate3d(92.3%, 0, 0); filter: drop-shadow(-14px 0 24px rgba(0, 0, 0, 0.12)); }
        .auth-hero-overlay { width: 100%; height: 100%; background: linear-gradient(155deg, #051F15 0%, #03381E 35%, #0A2540 75%, #02140D 100%); display: flex; flex-direction: column; justify-content: space-between; padding: 56px 48px; box-sizing: border-box; overflow: hidden; clip-path: url(#heroCurvedClipDynamic); -webkit-clip-path: url(#heroCurvedClipDynamic); }
        .hero-orb { position: absolute; border-radius: 50%; filter: blur(55px); pointer-events: none; z-index: 1; }
        .hero-orb-1 { width: 320px; height: 320px; top: -60px; right: -40px; background: rgba(0, 208, 94, 0.28); animation: floatOrb 8s ease-in-out infinite alternate; }
        .hero-orb-2 { width: 260px; height: 260px; bottom: 12%; left: -40px; background: rgba(56, 189, 248, 0.22); animation: floatOrb 10s ease-in-out infinite alternate-reverse; }
        .hero-orb-3 { width: 180px; height: 180px; top: 45%; right: 20%; background: rgba(3, 71, 38, 0.35); }
        @keyframes floatOrb { 0% { transform: translateY(0px) scale(1); } 100% { transform: translateY(24px) scale(1.08); } }
        .auth-hero-wrapper.hero-at-left .hero-content-inner { padding-right: 56px; padding-left: 0; }
        .auth-hero-wrapper.hero-at-right .hero-content-inner { padding-left: 56px; padding-right: 0; }
        .hero-content-inner { position: relative; z-index: 10; height: 100%; display: flex; flex-direction: column; justify-content: space-between; }
        .hero-brand-header { margin-bottom: 24px; }
        .hero-logo-img { height: 38px; width: auto; object-fit: contain; filter: brightness(0) invert(1); }
        .hero-headline-stack { position: relative; margin-bottom: 28px; min-height: 140px; }
        .hero-headline-layer { position: absolute; top: 0; left: 0; width: 100%; will-change: transform, opacity; transition: transform 0.5s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.4s cubic-bezier(0.22, 1, 0.36, 1); }
        .hero-headline-layer.layer-active { opacity: 1; transform: translate3d(0, 0, 0); pointer-events: auto; transition-delay: 0.16s; }
        .hero-headline-layer.layer-inactive-exit { opacity: 0; transform: translate3d(0, -18px, 0); pointer-events: none; transition-delay: 0s; }
        .hero-headline-layer.layer-inactive-enter { opacity: 0; transform: translate3d(0, 18px, 0); pointer-events: none; transition-delay: 0s; }
        .hero-main-title { font-size: 34px; font-weight: 900; color: #ffffff; line-height: 1.22; letter-spacing: -0.025em; margin: 0 0 14px; }
        .hero-gradient-text { background: linear-gradient(90deg, #00D05E 0%, #34D399 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .hero-description { font-size: 14px; color: rgba(255, 255, 255, 0.72); line-height: 1.65; margin: 0; max-width: 360px; }
        .hero-features-list { display: flex; flex-direction: column; gap: 12px; margin-bottom: 28px; }
        .feature-item-card { display: flex; align-items: center; gap: 14px; padding: 12px 16px; background: rgba(255, 255, 255, 0.07); border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 14px; backdrop-filter: blur(10px); transition: transform 0.2s, background 0.2s; }
        .feature-item-card:hover { background: rgba(255, 255, 255, 0.1); transform: translateX(4px); }
        .feature-icon-wrapper { width: 36px; height: 36px; border-radius: 10px; background: rgba(0, 208, 94, 0.18); border: 1px solid rgba(0, 208, 94, 0.35); display: flex; align-items: center; justify-content: center; color: #00D05E; flex-shrink: 0; }
        .feature-item-title { font-size: 13px; font-weight: 700; color: #ffffff; }
        .feature-item-desc { font-size: 11.5px; color: rgba(255, 255, 255, 0.6); margin-top: 1px; }
        .hero-trust-footer { border-top: 1px solid rgba(255, 255, 255, 0.1); padding-top: 18px; }
        .trust-stars-row { display: flex; align-items: center; gap: 6px; margin-bottom: 8px; }
        .star-bar { width: 22px; height: 4px; border-radius: 2px; background: rgba(255, 255, 255, 0.15); }
        .star-bar.active { background: #00D05E; }
        .rating-text { font-size: 12px; font-weight: 700; color: rgba(255, 255, 255, 0.75); margin-left: 6px; }
        .trust-agencies-caption { font-size: 12px; color: rgba(255, 255, 255, 0.55); margin: 0; }
        .trust-agencies-caption strong { color: #ffffff; }
        @keyframes fadeSlideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .form-fade-in { animation: fadeSlideUp 0.35s ease forwards; }
        @media (max-width: 980px) {
          .auth-root {
            min-height: 100vh;
            min-height: 100dvh;
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #ffffff;
            overflow-y: auto;
            overflow-x: hidden;
            -webkit-overflow-scrolling: touch;
          }

          .auth-slider-container {
            flex-direction: column;
            min-height: 100vh;
            min-height: 100dvh;
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: visible;
            background: #ffffff;
          }

          /* Hide hero overlay completely on mobile so login/register form is instantly in screen without scrolling */
          .auth-hero-wrapper {
            display: none !important;
          }

          .auth-form-slot {
            width: 100%;
            max-width: 440px;
            min-height: 100vh;
            min-height: 100dvh;
            padding: 24px 20px 32px;
            padding-top: max(24px, env(safe-area-inset-top));
            padding-bottom: max(32px, env(safe-area-inset-bottom));
            transform: none !important;
            opacity: 1 !important;
            filter: none !important;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            box-sizing: border-box;
          }

          .slot-left {
            display: none;
            order: 1;
          }

          .slot-right {
            display: flex;
            order: 1;
          }

          .auth-slider-container.mode-register .slot-left {
            display: flex;
          }

          .auth-slider-container.mode-register .slot-right {
            display: none;
          }

          .form-inner-wrapper {
            width: 100%;
            max-width: 100%;
            margin: auto 0;
          }

          .auth-slot-header-row {
            margin-bottom: 20px;
          }

          .brand-logo-img {
            height: 32px;
          }

          .form-header {
            margin-bottom: 20px;
          }

          .form-title {
            font-size: 24px;
            margin-bottom: 4px;
          }

          .form-subtitle {
            font-size: 13px;
          }

          .form-fields {
            gap: 14px;
          }

          /* CRITICAL: 16px minimum font size prevents iOS Safari / Android mobile browsers from zooming in */
          .text-input,
          input[type="text"],
          input[type="email"],
          input[type="password"] {
            font-size: 16px !important;
            -webkit-text-size-adjust: 100%;
            touch-action: manipulation;
          }

          .btn-primary-action {
            padding: 13px 18px;
            font-size: 15px;
            touch-action: manipulation;
          }

          .switch-prompt {
            margin-top: 18px;
            font-size: 13px;
          }

          .security-tagline {
            margin-top: 18px;
          }
        }

        @media (max-width: 480px) {
          .auth-form-slot {
            padding: max(16px, env(safe-area-inset-top)) 16px max(24px, env(safe-area-inset-bottom));
          }

          .grid-two-cols {
            grid-template-columns: 1fr;
            gap: 12px;
          }

          .form-title {
            font-size: 22px;
          }

          .otp-digit-box {
            width: 44px;
            height: 52px;
            font-size: 20px;
          }
        }
      `}</style>
    </div>
  );
};

export default LoginScreen;
