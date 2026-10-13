export const ONBOARDING_CSS = `
        /* Fullscreen dark glass overlay with backdrop blur */
        .onboarding-root-overlay {
          position: fixed;
          inset: 0;
          z-index: 3000;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(10, 25, 36, 0.42);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          padding: 24px 16px;
          overflow-y: auto;
          font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
          animation: overlayFadeIn 0.3s ease-out forwards;
        }

        /* ── AMBIENT LIQUID ORBS (Flowing behind frosted glass) ── */
        .ambient-mesh-container {
          position: fixed;
          inset: 0;
          pointer-events: none;
          overflow: hidden;
          z-index: 3001;
        }

        .liquid-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.65;
          animation: floatOrb 12s ease-in-out infinite alternate;
        }

        .orb-emerald {
          width: 480px;
          height: 480px;
          top: 10%;
          left: 20%;
          background: radial-gradient(circle, rgba(0, 208, 94, 0.42) 0%, rgba(5, 150, 57, 0.15) 70%, transparent 100%);
        }

        .orb-cyan {
          width: 420px;
          height: 420px;
          top: 15%;
          right: 20%;
          background: radial-gradient(circle, rgba(56, 189, 248, 0.38) 0%, rgba(14, 165, 233, 0.12) 70%, transparent 100%);
          animation-duration: 14s;
          animation-delay: -3s;
        }

        .orb-indigo {
          width: 520px;
          height: 520px;
          bottom: 10%;
          left: 30%;
          background: radial-gradient(circle, rgba(99, 102, 241, 0.35) 0%, rgba(79, 70, 229, 0.10) 70%, transparent 100%);
          animation-duration: 16s;
          animation-delay: -6s;
        }

        .orb-teal {
          width: 360px;
          height: 360px;
          bottom: 20%;
          right: 25%;
          background: radial-gradient(circle, rgba(16, 185, 129, 0.35) 0%, rgba(4, 120, 87, 0.12) 70%, transparent 100%);
          animation-duration: 10s;
          animation-delay: -2s;
        }

        @keyframes floatOrb {
          0% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(40px, -30px) scale(1.08); }
          100% { transform: translate(-30px, 40px) scale(0.95); }
        }

        /* ── APPLE LIQUID GLASS MODAL CONTAINER ── */
        .liquid-glass-modal {
          position: relative;
          z-index: 3002;
          width: 100%;
          max-width: 620px;
          max-height: 90vh;
          overflow-y: auto;
          border-radius: 26px;
          padding: 34px 34px 28px;
          box-sizing: border-box;
          background: rgba(255, 255, 255, 0.74);
          backdrop-filter: blur(48px) saturate(210%);
          -webkit-backdrop-filter: blur(48px) saturate(210%);
          border: 1px solid rgba(255, 255, 255, 0.75);
          box-shadow: 0 35px 90px -15px rgba(0, 0, 0, 0.32),
                      0 0 0 1px rgba(255, 255, 255, 0.45) inset,
                      0 2px 4px rgba(255, 255, 255, 0.85) inset;
          color: #0F172A;
          animation: modalPopUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        /* Dark mode glass adaptation */
        :root.dark .liquid-glass-modal {
          background: rgba(11, 23, 20, 0.78);
          border: 1px solid rgba(255, 255, 255, 0.12);
          box-shadow: 0 35px 90px -15px rgba(0, 0, 0, 0.65),
                      0 0 0 1px rgba(255, 255, 255, 0.08) inset,
                      0 1.5px 2px rgba(255, 255, 255, 0.15) inset;
          color: #F8FAFC;
        }

        /* Top specular glass reflection bar */
        .glass-specular-top {
          position: absolute;
          top: 0;
          left: 10%;
          right: 10%;
          height: 1.5px;
          background: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.95) 50%, transparent 100%);
          pointer-events: none;
        }

        /* Header meta */
        .modal-header-section {
          margin-bottom: 24px;
        }

        .header-meta-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .step-indicator-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.07em;
          color: #059639;
          background: rgba(0, 208, 94, 0.10);
          border: 1px solid rgba(0, 208, 94, 0.25);
          padding: 3px 10px;
          border-radius: 20px;
        }

        :root.dark .step-indicator-chip {
          color: #00D05E;
          background: rgba(0, 208, 94, 0.15);
          border-color: rgba(0, 208, 94, 0.35);
        }

        .step-glow-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #00D05E;
          box-shadow: 0 0 8px #00D05E;
        }

        .skip-btn-pill {
          background: rgba(255, 255, 255, 0.45);
          border: 1px solid rgba(0, 0, 0, 0.08);
          font-size: 12px;
          font-weight: 600;
          color: #64748B;
          padding: 5px 12px;
          border-radius: 20px;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.2s ease;
        }

        :root.dark .skip-btn-pill {
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(255, 255, 255, 0.1);
          color: #94A3B8;
        }

        .skip-btn-pill:hover {
          color: #0F172A;
          background: rgba(255, 255, 255, 0.8);
        }

        :root.dark .skip-btn-pill:hover {
          color: #FFFFFF;
          background: rgba(255, 255, 255, 0.15);
        }

        /* Segmented Progress Track */
        .progress-track-row {
          display: flex;
          gap: 6px;
        }

        .progress-segment-wrapper {
          flex: 1;
          height: 4.5px;
          border-radius: 9999px;
          background: rgba(0, 0, 0, 0.07);
          overflow: hidden;
        }

        :root.dark .progress-segment-wrapper {
          background: rgba(255, 255, 255, 0.10);
        }

        .progress-segment-bar {
          height: 100%;
          width: 0%;
          background: linear-gradient(90deg, #00D05E, #10B981);
          border-radius: 9999px;
          transition: width 0.4s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.4s ease;
        }

        .progress-segment-bar.active {
          width: 100%;
          box-shadow: 0 0 10px rgba(0, 208, 94, 0.6);
        }

        /* Step titles & badges */
        .step-badge-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: 20px;
          background: rgba(0, 208, 94, 0.12);
          border: 1px solid rgba(0, 208, 94, 0.24);
          font-size: 11.5px;
          font-weight: 750;
          color: #059639;
          margin-bottom: 10px;
        }

        :root.dark .step-badge-pill {
          color: #00D05E;
          background: rgba(0, 208, 94, 0.16);
          border-color: rgba(0, 208, 94, 0.35);
        }

        .badge-sparkle-icon {
          color: #00D05E;
        }

        .step-main-title {
          font-size: 25px;
          font-weight: 850;
          margin: 0 0 6px;
          letter-spacing: -0.025em;
          line-height: 1.25;
          color: #0F172A;
        }

        :root.dark .step-main-title {
          color: #FFFFFF;
        }

        .step-sub-caption {
          font-size: 13.5px;
          color: #64748B;
          margin: 0 0 22px;
          line-height: 1.5;
        }

        :root.dark .step-sub-caption {
          color: #94A3B8;
        }

        .step-sub-caption strong {
          color: #0F172A;
        }

        :root.dark .step-sub-caption strong {
          color: #F8FAFC;
        }

        /* ── SECTION BLOCKS ── */
        .section-block {
          margin-bottom: 20px;
        }

        .section-group-label {
          display: block;
          font-size: 12px;
          font-weight: 750;
          color: #475569;
          margin-bottom: 10px;
          letter-spacing: 0.01em;
        }

        :root.dark .section-group-label {
          color: #CBD5E1;
        }

        /* ── APPLE LIQUID GLASS CARDS & TILES ── */
        .roles-grid-layout,
        .goals-grid-layout {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        .team-size-grid,
        .themes-triplet-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
        }

        .themes-triplet-grid {
          grid-template-columns: repeat(3, 1fr);
        }

        .focus-options-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 8px;
        }

        .glass-card-option {
          position: relative;
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 14px 16px;
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.52);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          border: 1.5px solid rgba(255, 255, 255, 0.7);
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.03), inset 0 1px 1px rgba(255, 255, 255, 0.9);
          cursor: pointer;
          text-align: left;
          font-family: inherit;
          transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
        }

        :root.dark .glass-card-option {
          background: rgba(255, 255, 255, 0.04);
          border-color: rgba(255, 255, 255, 0.09);
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.25), inset 0 1px 1px rgba(255, 255, 255, 0.05);
        }

        .glass-card-option:hover {
          transform: translateY(-2px);
          border-color: rgba(0, 208, 94, 0.45);
          background: rgba(255, 255, 255, 0.72);
          box-shadow: 0 8px 24px rgba(0, 208, 94, 0.12), inset 0 1px 1px rgba(255, 255, 255, 0.95);
        }

        :root.dark .glass-card-option:hover {
          border-color: rgba(0, 208, 94, 0.45);
          background: rgba(255, 255, 255, 0.08);
          box-shadow: 0 8px 24px rgba(0, 208, 94, 0.16);
        }

        .glass-card-option.selected {
          border: 2px solid #00D05E;
          background: linear-gradient(135deg, rgba(0, 208, 94, 0.15) 0%, rgba(5, 150, 57, 0.07) 100%);
          box-shadow: 0 8px 28px rgba(0, 208, 94, 0.22), inset 0 1.5px 2px rgba(255, 255, 255, 0.95);
        }

        :root.dark .glass-card-option.selected {
          border-color: #00D05E;
          background: linear-gradient(135deg, rgba(0, 208, 94, 0.22) 0%, rgba(5, 150, 57, 0.10) 100%);
          box-shadow: 0 8px 28px rgba(0, 208, 94, 0.28);
        }

        .glass-card-option.centered {
          flex-direction: column;
          align-items: center;
          padding: 14px 10px;
        }

        .glass-card-option.compact {
          flex-direction: column;
          padding: 12px 14px;
          gap: 4px;
        }

        .card-icon-box {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          background: rgba(0, 0, 0, 0.04);
          border: 1px solid rgba(0, 0, 0, 0.06);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #059639;
          flex-shrink: 0;
          transition: all 0.2s;
        }

        :root.dark .card-icon-box {
          background: rgba(255, 255, 255, 0.07);
          border-color: rgba(255, 255, 255, 0.12);
          color: #00D05E;
        }

        .glass-card-option.selected .card-icon-box {
          background: #00D05E;
          color: #FFFFFF;
          border-color: #00D05E;
          box-shadow: 0 3px 10px rgba(0, 208, 94, 0.35);
        }

        .card-text-block {
          flex: 1;
        }

        .card-title-text {
          font-size: 13px;
          font-weight: 750;
          color: #0F172A;
          line-height: 1.3;
        }

        :root.dark .card-title-text {
          color: #FFFFFF;
        }

        .card-desc-text {
          font-size: 11px;
          color: #64748B;
          margin-top: 2px;
          line-height: 1.35;
        }

        :root.dark .card-desc-text {
          color: #94A3B8;
        }

        /* Team size tags */
        .team-header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
        }

        .team-badge-tag {
          font-size: 9.5px;
          font-weight: 750;
          color: #059639;
          background: rgba(0, 208, 94, 0.12);
          padding: 2px 7px;
          border-radius: 12px;
        }

        :root.dark .team-badge-tag {
          color: #00D05E;
          background: rgba(0, 208, 94, 0.18);
        }

        /* ── INDUSTRY PILLS ── */
        .industry-pills-wrap {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .glass-pill-option {
          padding: 8px 15px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 650;
          font-family: inherit;
          cursor: pointer;
          background: rgba(255, 255, 255, 0.55);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1.5px solid rgba(255, 255, 255, 0.75);
          color: #334155;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        :root.dark .glass-pill-option {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.10);
          color: #CBD5E1;
        }

        .glass-pill-option:hover {
          transform: translateY(-1px);
          border-color: rgba(0, 208, 94, 0.45);
          background: rgba(255, 255, 255, 0.85);
          color: #0F172A;
        }

        :root.dark .glass-pill-option:hover {
          background: rgba(255, 255, 255, 0.12);
          color: #FFFFFF;
        }

        .glass-pill-option.selected {
          background: linear-gradient(135deg, #059639 0%, #00D05E 100%);
          color: #FFFFFF;
          border-color: #00D05E;
          box-shadow: 0 4px 14px rgba(0, 208, 94, 0.35);
        }

        /* ── DYNAMIC "OTHER" EXPANDING TEXTBOX (Apple Glass Input) ── */
        .other-input-expand-container {
          margin-top: 14px;
          padding: 14px 16px;
          border-radius: 16px;
          background: rgba(0, 208, 94, 0.06);
          border: 1.5px solid rgba(0, 208, 94, 0.35);
          box-shadow: 0 8px 24px rgba(0, 208, 94, 0.08);
          animation: expandSlideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        :root.dark .other-input-expand-container {
          background: rgba(0, 208, 94, 0.10);
          border-color: rgba(0, 208, 94, 0.45);
        }

        .other-input-label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 750;
          color: #059639;
          margin-bottom: 8px;
        }

        :root.dark .other-input-label {
          color: #00D05E;
        }

        .glass-text-input {
          width: 100%;
          padding: 10px 14px;
          box-sizing: border-box;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(10px);
          border: 1.5px solid rgba(0, 208, 94, 0.35);
          font-size: 13px;
          font-weight: 600;
          color: #0F172A;
          outline: none;
          font-family: inherit;
          transition: all 0.2s;
        }

        :root.dark .glass-text-input {
          background: rgba(0, 0, 0, 0.35);
          color: #FFFFFF;
          border-color: rgba(0, 208, 94, 0.4);
        }

        .glass-text-input:focus {
          border-color: #00D05E;
          box-shadow: 0 0 0 3px rgba(0, 208, 94, 0.2);
        }

        /* ── THEME PREVIEW ORBS ── */
        .theme-preview-orb {
          width: 38px;
          height: 38px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 8px;
          transition: all 0.2s;
        }

        .theme-preview-orb.light {
          background: linear-gradient(135deg, #FFFFFF 0%, #F1F5F9 100%);
          border: 1.5px solid #CBD5E1;
          color: #D97706;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.06);
        }

        .theme-preview-orb.dark {
          background: linear-gradient(135deg, #0A2540 0%, #02140D 100%);
          border: 1.5px solid rgba(255, 255, 255, 0.2);
          color: #38BDF8;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
        }

        .theme-preview-orb.system {
          background: linear-gradient(135deg, #FFFFFF 50%, #0A2540 50%);
          border: 1.5px solid #94A3B8;
          color: #059639;
        }

        /* ── WIREFRAME LAYOUT PREVIEW ── */
        .layout-wireframe-box {
          width: 44px;
          height: 28px;
          border-radius: 6px;
          background: rgba(0, 0, 0, 0.05);
          border: 1px solid rgba(0, 0, 0, 0.08);
          padding: 3px;
          display: flex;
          flex-direction: column;
          gap: 2px;
          margin-bottom: 8px;
        }

        :root.dark .layout-wireframe-box {
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(255, 255, 255, 0.12);
        }

        .wireframe-header {
          height: 5px;
          border-radius: 2px;
          background: #00D05E;
          width: 100%;
        }

        .wireframe-body {
          flex: 1;
          display: flex;
          gap: 2px;
        }

        .wireframe-col {
          flex: 1;
          border-radius: 2px;
          background: rgba(0, 0, 0, 0.15);
        }

        :root.dark .wireframe-col {
          background: rgba(255, 255, 255, 0.2);
        }

        /* ── MODAL FOOTER NAV ── */
        .modal-footer-nav {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 28px;
          padding-top: 18px;
          border-top: 1px solid rgba(0, 0, 0, 0.07);
        }

        :root.dark .modal-footer-nav {
          border-top-color: rgba(255, 255, 255, 0.1);
        }

        .liquid-nav-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 10px 20px;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 750;
          font-family: inherit;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .liquid-nav-btn.secondary {
          background: rgba(255, 255, 255, 0.5);
          border: 1.5px solid rgba(0, 0, 0, 0.08);
          color: #475569;
        }

        :root.dark .liquid-nav-btn.secondary {
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(255, 255, 255, 0.12);
          color: #CBD5E1;
        }

        .liquid-nav-btn.secondary:hover:not(.disabled) {
          background: rgba(255, 255, 255, 0.8);
          color: #0F172A;
        }

        :root.dark .liquid-nav-btn.secondary:hover:not(.disabled) {
          background: rgba(255, 255, 255, 0.14);
          color: #FFFFFF;
        }

        .liquid-nav-btn.primary {
          background: linear-gradient(135deg, #051F15 0%, #03381E 40%, #00D05E 100%);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: #FFFFFF;
          box-shadow: 0 6px 18px rgba(0, 208, 94, 0.3), inset 0 1px 1px rgba(255, 255, 255, 0.4);
        }

        .liquid-nav-btn.primary:hover:not(.disabled) {
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(0, 208, 94, 0.42), inset 0 1px 1px rgba(255, 255, 255, 0.6);
        }

        .liquid-nav-btn.disabled {
          opacity: 0.45;
          cursor: not-allowed;
          box-shadow: none;
        }

        /* ── ANIMATIONS ── */
        @keyframes overlayFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes modalPopUp {
          from { opacity: 0; transform: scale(0.96) translateY(12px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }

        @keyframes expandSlideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .anim-slide-forward {
          animation: slideForward 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .anim-slide-backward {
          animation: slideBackward 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        @keyframes slideForward {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }

        @keyframes slideBackward {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }

        @media (max-width: 600px) {
          .roles-grid-layout,
          .goals-grid-layout,
          .team-size-grid,
          .themes-triplet-grid {
            grid-template-columns: 1fr;
          }
          .liquid-glass-modal {
            padding: 24px 20px;
            border-radius: 20px;
          }
        }
      `;