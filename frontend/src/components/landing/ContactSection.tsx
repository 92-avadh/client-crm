import React, { useState } from 'react';

export const ContactSection: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) {
      setStatus('Please add your name, a valid email, and a short message.');
      return;
    }
    setStatus('Thanks — a senior agency retention strategist will write back within two hours.');
    setName('');
    setEmail('');
    setMessage('');
  };

  return (
    <section className="contact" id="contact" data-8b-section="contact" aria-labelledby="contact-title">
      <div className="contact__sheet m-band-2" aria-hidden="true" data-8b-motion="bandRise"></div>
      <div className="contact__inner l-wrap">
        <div className="contact__info">
          <h2 className="m-text-3" id="contact-title" data-8b-motion="captionIn">
            Talk to an agency strategist, anytime.
          </h2>
          <p className="m-text-4">
            Our solution architects answer by Slack Connect, direct email, or a 1-on-1 retention audit call — Monday to Friday, 8 am to 8 pm Eastern.
          </p>

          <ul className="contact__ways">
            <li>
              <p className="m-text-6">Direct Line</p>
              <a className="m-link m-text-5" href="tel:+18004927383">
                (800) 492-7383
              </a>
            </li>
            <li>
              <p className="m-text-6">Email</p>
              <a className="m-link m-text-5" href="mailto:hello@retentio.io">
                hello@retentio.io
              </a>
            </li>
            <li>
              <p className="m-text-6">Live Strategy Call</p>
              <a className="m-link m-text-5" href="#contact-form">
                Book a 15-min audit
              </a>
            </li>
          </ul>
        </div>

        <form className="contact__form" id="contact-form" onSubmit={handleSubmit} noValidate>
          <h3 className="m-text-5">Send us a note</h3>
          <div className="m-field">
            <label className="m-field__label" htmlFor="contact-name">
              Your name
            </label>
            <input
              className="m-field__input"
              id="contact-name"
              name="name"
              type="text"
              autoComplete="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="m-field">
            <label className="m-field__label" htmlFor="contact-email">
              Work email
            </label>
            <input
              className="m-field__input"
              id="contact-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="m-field">
            <label className="m-field__label" htmlFor="contact-message">
              How can we help your agency?
            </label>
            <textarea
              className="m-field__input"
              id="contact-message"
              name="message"
              rows={4}
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            ></textarea>
          </div>
          <button className="m-btn-2" type="submit">
            <span className="m-btn__label">Send message</span>
            <span className="m-btn__wave" aria-hidden="true">
              <i></i>
              <i></i>
              <i></i>
            </span>
          </button>
          {status && (
            <p className="contact__status m-text-8" role="status" aria-live="polite">
              {status}
            </p>
          )}
        </form>
      </div>
    </section>
  );
};
