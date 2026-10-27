import React, { useState, useEffect, useRef } from 'react';
import { Building2, Users, Globe, ChevronDown, Sparkles } from 'lucide-react';

interface LandingNavProps {
  isLoggedIn?: boolean;
  onNavigateLogin?: () => void;
  onNavigateWorkspace?: () => void;
}

export const LandingNav: React.FC<LandingNavProps> = ({
  isLoggedIn = false,
  onNavigateLogin,
  onNavigateWorkspace,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [signinDropdownOpen, setSigninDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Guarantee responsive & accurate auth status across prop and persistent storage
  const isAuth = isLoggedIn || (typeof window !== 'undefined' && Boolean(
    localStorage.getItem('retentio_user') && localStorage.getItem('retentio_token')
  ));

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (menuOpen) setMenuOpen(false);
        if (signinDropdownOpen) setSigninDropdownOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [menuOpen, signinDropdownOpen]);

  // Click outside listener for signin dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setSigninDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleMenu = () => {
    setMenuOpen((prev) => !prev);
  };

  const closeMenu = () => {
    setMenuOpen(false);
  };

  const handleCtaClick = (e: React.MouseEvent) => {
    if (isAuth) {
      e.preventDefault();
      if (onNavigateWorkspace) {
        onNavigateWorkspace();
      } else {
        window.location.href = '/dashboard';
      }
    }
  };

  return (
    <header className="nav on-dark" id="nav" data-8b-section="navigation">
      <nav className="nav__bar" aria-label="Main">
        <div className="nav__start">
          <a className="nav__brand" href="#hero" aria-label="Retentio, back to top">
            <img
              src="/retentio-icon.png"
              alt=""
              className="nav__mark-img"
              style={{ width: 26, height: 26, objectFit: 'contain' }}
            />
            <span className="nav__word m-text-5">Retentio</span>
          </a>
        </div>

        <div className="nav__center">
          <ul className="nav__links m-text-6">
            <li>
              <a className="m-link-2" href="#listen">
                How it works
              </a>
            </li>
            <li>
              <a className="m-link-2" href="#calls">
                Live Feed
              </a>
            </li>
            <li>
              <a className="m-link-2" href="#rooms">
                In Practice
              </a>
            </li>
            <li>
              <a className="m-link-2" href="#voices">
                Stories
              </a>
            </li>
            <li>
              <a className="m-link-2" href="#setup">
                Setup
              </a>
            </li>
            <li>
              <a className="m-link-2" href="#faq">
                Questions
              </a>
            </li>
            <li>
              <a className="m-link-2" href="#contact">
                Contact
              </a>
            </li>
          </ul>
        </div>

        <div className="nav__end">
          {isAuth ? (
            <a
              className="m-btn-3 nav__cta"
              href="/dashboard"
              onClick={handleCtaClick}
            >
              <span className="m-btn__label">Go to Dashboard</span>
              <span className="m-btn__wave" aria-hidden="true">
                <i></i>
                <i></i>
                <i></i>
              </span>
            </a>
          ) : (
            <>
              {/* Sign In Dropdown (Company & Employee) */}
              <div className="nav__signin-wrapper" ref={dropdownRef}>
                <button
                  type="button"
                  className={`nav__signin-btn ${signinDropdownOpen ? 'open' : ''}`}
                  onClick={() => setSigninDropdownOpen(prev => !prev)}
                  aria-expanded={signinDropdownOpen}
                  aria-haspopup="true"
                >
                  <span>Sign In</span>
                  <ChevronDown size={14} className={`chevron-icon ${signinDropdownOpen ? 'rotate' : ''}`} />
                </button>

                {signinDropdownOpen && (
                  <div className="nav__signin-menu" role="menu">
                    <a
                      href="/login/company"
                      className="nav__signin-item"
                      role="menuitem"
                      onClick={() => setSigninDropdownOpen(false)}
                    >
                      <div className="item-icon-circle company">
                        <Building2 size={16} />
                      </div>
                      <div className="item-copy">
                        <div className="item-headline">Company Sign In</div>
                        <div className="item-sub">For founders & operations</div>
                      </div>
                    </a>

                    <a
                      href="/login/employee"
                      className="nav__signin-item"
                      role="menuitem"
                      onClick={() => setSigninDropdownOpen(false)}
                    >
                      <div className="item-icon-circle employee">
                        <Users size={16} />
                      </div>
                      <div className="item-copy">
                        <div className="item-headline">Employee Sign In</div>
                        <div className="item-sub">For team members & staff</div>
                      </div>
                    </a>

                    <div className="nav__signin-divider" />

                    <a
                      href="/portal/login"
                      className="nav__signin-item portal"
                      role="menuitem"
                      onClick={() => setSigninDropdownOpen(false)}
                    >
                      <div className="item-icon-circle portal">
                        <Globe size={16} />
                      </div>
                      <div className="item-copy">
                        <div className="item-headline">Client Portal</div>
                        <div className="item-sub">For client deliverables & invoices</div>
                      </div>
                    </a>
                  </div>
                )}
              </div>

              {/* Primary CTA: Create Agency */}
              <a
                className="m-btn-3 nav__cta"
                href="/signup"
              >
                <span className="m-btn__label">Create Agency</span>
                <span className="m-btn__wave" aria-hidden="true">
                  <i></i>
                  <i></i>
                  <i></i>
                </span>
              </a>
            </>
          )}

          <button
            className="m-icon-btn nav__toggle"
            type="button"
            aria-expanded={menuOpen}
            aria-controls="menu"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            onClick={toggleMenu}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              {menuOpen ? (
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              ) : (
                <path d="M4 8h16M4 16h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile Slide-Out Menu */}
      <div
        className="menu"
        id="menu"
        hidden={!menuOpen}
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
      >
        <button
          className="m-icon-btn menu__close"
          type="button"
          aria-label="Close menu"
          onClick={closeMenu}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>

        <ul className="menu__links m-text-5">
          <li>
            <a className="m-link-2" href="#listen" onClick={closeMenu}>
              How it works
            </a>
          </li>
          <li>
            <a className="m-link-2" href="#calls" onClick={closeMenu}>
              Live Feed
            </a>
          </li>
          <li>
            <a className="m-link-2" href="#rooms" onClick={closeMenu}>
              In Practice
            </a>
          </li>
          <li>
            <a className="m-link-2" href="#voices" onClick={closeMenu}>
              Stories
            </a>
          </li>
          <li>
            <a className="m-link-2" href="#setup" onClick={closeMenu}>
              Setup
            </a>
          </li>
          <li>
            <a className="m-link-2" href="#faq" onClick={closeMenu}>
              Questions
            </a>
          </li>
          <li>
            <a className="m-link-2" href="#contact" onClick={closeMenu}>
              Contact
            </a>
          </li>
        </ul>

        {isAuth ? (
          <a
            className="m-btn"
            href="/dashboard"
            onClick={(e) => {
              closeMenu();
              handleCtaClick(e);
            }}
          >
            <span className="m-btn__label">Dashboard</span>
            <span className="m-btn__wave" aria-hidden="true">
              <i></i>
              <i></i>
              <i></i>
            </span>
          </a>
        ) : (
          <div className="menu__auth-block">
            <div className="menu__portals-title">Sign In Options</div>
            <div className="menu__portals-grid">
              <a href="/login/company" className="menu__portal-card" onClick={closeMenu}>
                <Building2 size={18} className="text-emerald-400" />
                <div>
                  <div className="card-title">Company Login</div>
                  <div className="card-sub">Founders & managers</div>
                </div>
              </a>
              <a href="/login/employee" className="menu__portal-card" onClick={closeMenu}>
                <Users size={18} className="text-sky-400" />
                <div>
                  <div className="card-title">Employee Login</div>
                  <div className="card-sub">Team members</div>
                </div>
              </a>
              <a href="/portal/login" className="menu__portal-card" onClick={closeMenu}>
                <Globe size={18} className="text-amber-400" />
                <div>
                  <div className="card-title">Client Portal</div>
                  <div className="card-sub">Deliverables & invoices</div>
                </div>
              </a>
            </div>

            <a
              className="m-btn mt-4"
              href="/signup"
              onClick={closeMenu}
            >
              <span className="m-btn__label">Create Agency</span>
              <span className="m-btn__wave" aria-hidden="true">
                <i></i>
                <i></i>
                <i></i>
              </span>
            </a>
          </div>
        )}
      </div>

      <style>{`
        .nav__signin-wrapper {
          position: relative;
        }

        .nav__signin-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 14px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 9999px;
          color: rgba(255, 255, 255, 0.9);
          font-size: 13.5px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          backdrop-filter: blur(8px);
          font-family: inherit;
        }

        .nav__signin-btn:hover,
        .nav__signin-btn.open {
          background: rgba(255, 255, 255, 0.16);
          border-color: rgba(255, 255, 255, 0.3);
          color: #ffffff;
        }

        .chevron-icon {
          transition: transform 0.2s ease;
          color: rgba(255, 255, 255, 0.7);
        }

        .chevron-icon.rotate {
          transform: rotate(180deg);
        }

        .nav__signin-menu {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          width: 270px;
          background: rgba(15, 23, 42, 0.96);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.14);
          border-radius: 14px;
          padding: 6px;
          box-shadow: 0 16px 36px rgba(0, 0, 0, 0.45);
          z-index: 100;
          animation: fadeSlideDown 0.18s ease;
        }

        .nav__signin-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 9px 10px;
          border-radius: 10px;
          text-decoration: none;
          transition: background 0.15s ease;
        }

        .nav__signin-item:hover {
          background: rgba(255, 255, 255, 0.09);
        }

        .item-icon-circle {
          width: 32px;
          height: 32px;
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .item-icon-circle.company {
          background: rgba(16, 185, 129, 0.15);
          color: #34d399;
          border: 1px solid rgba(16, 185, 129, 0.25);
        }

        .item-icon-circle.employee {
          background: rgba(56, 189, 248, 0.15);
          color: #38bdf8;
          border: 1px solid rgba(56, 189, 248, 0.25);
        }

        .item-icon-circle.portal {
          background: rgba(245, 158, 11, 0.15);
          color: #fbbf24;
          border: 1px solid rgba(245, 158, 11, 0.25);
        }

        .item-copy {
          flex: 1;
          min-width: 0;
        }

        .item-headline {
          font-size: 13px;
          font-weight: 700;
          color: #f8fafc;
        }

        .item-sub {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.55);
          margin-top: 1px;
        }

        .nav__signin-divider {
          height: 1px;
          background: rgba(255, 255, 255, 0.08);
          margin: 4px 6px;
        }

        @keyframes fadeSlideDown {
          from {
            opacity: 0;
            transform: translateY(-6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Mobile auth block inside slideout menu */
        .menu__auth-block {
          margin-top: auto;
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding-top: 16px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .menu__portals-title {
          font-size: 11.5px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: rgba(255, 255, 255, 0.5);
        }

        .menu__portals-grid {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .menu__portal-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 14px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          text-decoration: none;
          color: #ffffff;
        }

        .menu__portal-card .card-title {
          font-size: 13px;
          font-weight: 700;
        }

        .menu__portal-card .card-sub {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.55);
        }
      `}</style>
    </header>
  );
};
