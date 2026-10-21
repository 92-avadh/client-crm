import React, { useState, useEffect } from 'react';

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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && menuOpen) {
        setMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [menuOpen]);

  const toggleMenu = () => {
    setMenuOpen((prev) => !prev);
  };

  const closeMenu = () => {
    setMenuOpen(false);
  };

  const handleCtaClick = (e: React.MouseEvent) => {
    if (isLoggedIn && onNavigateWorkspace) {
      e.preventDefault();
      onNavigateWorkspace();
    } else if (onNavigateLogin) {
      // Allow navigation or jump to start
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
          <a
            className="m-link-2 nav__login-link"
            href={isLoggedIn ? '/dashboard' : '/login'}
            style={{ fontWeight: 600, fontSize: '0.875rem', textDecoration: 'none', marginRight: 14 }}
          >
            {isLoggedIn ? 'Dashboard' : 'Sign In'}
          </a>
          <a
            className="m-btn-3 nav__cta"
            href={isLoggedIn ? '/dashboard' : '#start'}
            onClick={handleCtaClick}
          >
            <span className="m-btn__label">
              {isLoggedIn ? 'Open Workspace' : 'Get Retentio Free'}
            </span>
            <span className="m-btn__wave" aria-hidden="true">
              <i></i>
              <i></i>
              <i></i>
            </span>
          </a>

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
        <a
          className="m-btn"
          href={isLoggedIn ? '#dashboard' : '#start'}
          onClick={(e) => {
            closeMenu();
            handleCtaClick(e);
          }}
        >
          <span className="m-btn__label">
            {isLoggedIn ? 'Open Workspace' : 'Get Retentio Free'}
          </span>
          <span className="m-btn__wave" aria-hidden="true">
            <i></i>
            <i></i>
            <i></i>
          </span>
        </a>
      </div>
    </header>
  );
};
