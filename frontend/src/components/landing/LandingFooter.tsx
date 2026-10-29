import React from 'react';

export const LandingFooter: React.FC = () => {
  return (
    <footer className="footer on-dark" id="footer" data-8b-section="footer" aria-labelledby="footer-title">
      <div className="footer__sheet m-band-4" aria-hidden="true"></div>
      <div className="footer__inner l-wrap">
        <div className="footer__top">
          <div className="footer__pitch">
            <h2 className="m-text-5" id="footer-title">
              Live client operations & CRM for high-performance agencies.
            </h2>
            <p className="m-text-4">
              Built by agency operators, for teams who believe recurring revenue should compound quietly without constant fires.
            </p>
            <a className="m-link m-text-6" href="#hero">
              Back to the top ↑
            </a>
          </div>

          <div className="footer__cols m-text-6">
            <div className="footer__col">
              <h2 className="m-text-6">Platform</h2>
              <ul>
                <li><a className="m-link-2" href="#listen">How it works</a></li>
                <li><a className="m-link-2" href="#calls">Live Feed</a></li>
                <li><a className="m-link-2" href="#rooms">In Practice</a></li>
                <li><a className="m-link-2" href="#tune">Calibration</a></li>
              </ul>
            </div>

            <div className="footer__col">
              <h2 className="m-text-6">Solutions</h2>
              <ul>
                <li><a className="m-link-2" href="mailto:hello@retentio.io">hello@retentio.io</a></li>
                <li><a className="m-link-2" href="tel:+18004927383">Call (800) 492-7383</a></li>
                <li><a className="m-link-2" href="#contact">Contact sales</a></li>
                <li><a className="m-link-2" href="#faq">Questions</a></li>
              </ul>
            </div>

            <div className="footer__col">
              <h2 className="m-text-6">Company</h2>
              <ul>
                <li><a className="m-link-2" href="#voices">Stories</a></li>
                <li><a className="m-link-2" href="#setup">Getting started</a></li>
                <li><a className="m-link-2" href="#start">Free trial</a></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="footer__brand" aria-hidden="true">
          <img
            src="/retentio-icon.png"
            alt="Retentio"
            className="footer__logo-img"
          />
          <p className="footer__word m-text-2">
            Retentio
          </p>
        </div>

        <div className="footer__legal m-text-7">
          <p>© 2026 Retentio Inc. All rights reserved. · Client CRM & Operating System</p>
          <ul>
            <li><a className="m-link" href="#hero">Privacy Policy</a></li>
            <li><a className="m-link" href="#hero">Terms of Service</a></li>
            <li><a className="m-link" href="#hero">Security Architecture</a></li>
          </ul>
        </div>

        <p className="footer__note m-text-7">
          Retentio is an enterprise-grade agency operations and CRM platform. All client communications, contract addendums, and billing streams are encrypted using AES-256 and never utilized to train external public machine learning models.
        </p>
      </div>
    </footer>
  );
};
