import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type MouseEvent } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useSlidingPill } from '../../hooks/useSlidingPill';
import { scrollToSection } from '../../lib/scroll';
import './EaseServiceContributionsPage.css';

type AssetSet = 'HIGH' | 'LOW';

const chapters = [
  { id: 'ease-overview', label: 'Overview' },
  { id: 'ease-interface', label: 'Interface' },
  { id: 'ease-development', label: 'Design development' },
] as const;

type FlowScreenSpec = Omit<FlowScreenProps, 'set' | 'compact'>;
type FlowConfig = {
  entry: FlowScreenSpec;
  branches: { title: string; detail: string; screens: FlowScreenSpec[] }[];
  onboarding: { trigger: FlowScreenSpec; caption: string; results: FlowScreenSpec[] };
  password: { trigger: FlowScreenSpec; caption: string; result: FlowScreenSpec; repeat: string };
  profile: { trigger: FlowScreenSpec; caption: string; results: FlowScreenSpec[] };
  help?: { trigger: FlowScreenSpec; caption: string; results: FlowScreenSpec[] };
};

const fidelityFlows: Record<AssetSet, FlowConfig> = {
  LOW: {
    entry: { file: 'Group 245.png', label: 'Sign in', alt: 'Low-fidelity sign-in screen with Sign up and Forgot password links' },
    branches: [
      { title: 'Create an account', detail: 'Sign-up link', screens: [{ file: 'Group 246.png', label: 'Create account', alt: 'Low-fidelity account form with ID verification upload' }] },
      { title: 'Recover a password', detail: 'Forgot password link', screens: [{ file: 'Group 249.png', label: 'Verification code', alt: 'Low-fidelity password-recovery verification-code screen' }] },
    ],
    onboarding: {
      trigger: { file: 'Group 243.png', label: 'Welcome screen', alt: 'Low-fidelity EaseService welcome screen with Get started button', marker: { x: 50, y: 78 } },
      caption: 'Get started leads to the Client or Worker account-type choice.',
      results: [{ file: 'Group 244.png', label: 'Choose account type', alt: 'Low-fidelity account-type screen with Client and Worker options' }],
    },
    password: {
      trigger: { file: 'Group 250.png', label: 'Set new password', alt: 'Low-fidelity new-password form after verification', marker: { x: 50, y: 80 } },
      caption: 'After verification, the user sets and confirms a new password.',
      result: { file: 'Group 251.png', label: 'Password updated', alt: 'Low-fidelity password-updated confirmation screen' },
      repeat: 'The recovery branch begins at the sign-in screen above.',
    },
    profile: {
      trigger: { file: 'Group 252.png', label: 'Profile: About', alt: 'Low-fidelity profile About tab with account details and credentials', marker: { x: 52, y: 49 } },
      caption: 'The profile tabs switch between account information, bookings, and reviews; the notification control opens updates.',
      results: [
        { file: 'Group 253.png', label: 'Past bookings', alt: 'Low-fidelity profile Bookings tab showing booking cards' },
        { file: 'Group 254.png', label: 'Reviews', alt: 'Low-fidelity profile Reviews tab showing ratings and review cards' },
        { file: 'Group 255.png', label: 'Notifications', alt: 'Low-fidelity notifications screen with booking and account updates' },
      ],
    },
    help: {
      trigger: { file: 'Group 258.png', label: 'Settings', alt: 'Low-fidelity settings screen with an FAQs option', marker: { x: 35, y: 82 } },
      caption: 'The FAQs item opens a question list where an answer can be expanded.',
      results: [
        { file: 'Group 256.png', label: 'FAQ list', alt: 'Low-fidelity FAQ list grouped by topic' },
        { file: 'Group 257.png', label: 'Expanded answer', alt: 'Low-fidelity FAQ screen with an answer expanded' },
      ],
    },
  },
  HIGH: {
    entry: { file: 'Group 218.png', label: 'Sign in', alt: 'High-fidelity EaseService sign-in screen with Sign up and Forgot password links' },
    branches: [
      { title: 'Create an account', detail: 'Sign-up link', screens: [{ file: 'Group 219.png', label: 'Create account', alt: 'High-fidelity account form with contact details and ID verification' }] },
      { title: 'Recover a password', detail: 'Forgot password link', screens: [{ file: 'Group 224.png', label: 'Verification code', alt: 'High-fidelity email verification-code screen' }] },
    ],
    onboarding: {
      trigger: { file: 'Group 213.png', label: 'Welcome screen', alt: 'EaseService welcome screen with Get started button', marker: { x: 50, y: 81 } },
      caption: 'The onboarding cards introduce job discovery, applying, and staying updated.',
      results: [
        { file: 'Group 214.png', label: 'Discover job opportunities', alt: 'Onboarding screen introducing job discovery' },
        { file: 'Group 215.png', label: 'Apply in a few taps', alt: 'Onboarding screen describing the application process' },
        { file: 'Group 216.png', label: 'Stay updated', alt: 'Onboarding screen about staying updated' },
        { file: 'Group 217.png', label: 'Choose account type', alt: 'EaseService account-type screen with Client and Worker options' },
      ],
    },
    password: {
      trigger: { file: 'Group 229.png', label: 'Set new password', alt: 'High-fidelity new-password form after verification', marker: { x: 50, y: 78 } },
      caption: 'After verification, the user sets and confirms a new password.',
      result: { file: 'Group 230.png', label: 'Password updated', alt: 'High-fidelity password-updated confirmation screen' },
      repeat: 'The recovery branch begins at the sign-in screen above.',
    },
    profile: {
      trigger: { file: 'Group 238.png', label: 'Profile: About', alt: 'High-fidelity profile About screen with account details and credentials', marker: { x: 91, y: 10 } },
      caption: 'Profile tabs open account information, bookings, and reviews; the notification control opens updates.',
      results: [
        { file: 'Group 239.png', label: 'Past bookings', alt: 'High-fidelity profile Bookings tab showing booking cards' },
        { file: 'Group 240.png', label: 'Reviews', alt: 'High-fidelity profile Reviews tab showing ratings and review cards' },
        { file: 'Group 241.png', label: 'Notifications', alt: 'High-fidelity notifications screen with booking and account updates' },
      ],
    },
  },
};

function assetPath(set: AssetSet, file: string) {
  return `/assets/figma/EASESERVICE%20${set}/${encodeURIComponent(file)}`;
}

function EaseImage({ set, file, alt, eager = false }: { set: AssetSet; file: string; alt: string; eager?: boolean }) {
  return <img src={assetPath(set, file)} alt={alt} loading={eager ? 'eager' : 'lazy'} fetchPriority={eager ? 'high' : 'auto'} decoding="async" />;
}

type FlowScreenProps = {
  set: AssetSet;
  file: string;
  label: string;
  alt: string;
  marker?: { x: number; y: number };
  compact?: boolean;
};

function FlowScreen({ set, file, label, alt, marker, compact = false }: FlowScreenProps) {
  const style = marker ? ({ '--ease-marker-x': `${marker.x}%`, '--ease-marker-y': `${marker.y}%` } as CSSProperties) : undefined;
  return (
    <figure className={`ease-flow-screen ${compact ? 'is-compact' : ''} ${marker ? 'has-marker' : ''}`} style={style}>
      <div className="ease-flow-image"><EaseImage set={set} file={file} alt={alt} /></div>
      {marker && <span className="ease-flow-marker" aria-hidden="true" />}
      <figcaption>{label}</figcaption>
    </figure>
  );
}

function FlowConnector({ dashed = false }: { dashed?: boolean }) {
  return (
    <svg className={`ease-flow-connector ${dashed ? 'is-dashed' : ''}`} viewBox="0 0 100 48" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <path d="M3 24 H91" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray={dashed ? '3 4' : undefined} strokeLinecap="round" />
      <path d="M84 18 L92 24 L84 30" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function EaseServiceContributionsPage() {
  const [activeChapter, setActiveChapter] = useState<string>(chapters[0].id);
  const { navRef, setTabRef, pillStyle } = useSlidingPill(activeChapter);
  const [fidelity, setFidelity] = useState<AssetSet>('LOW');
  const [fidelityDocked, setFidelityDocked] = useState(false);
  const fidelityAnchorRef = useRef<HTMLDivElement>(null);
  const fidelityToggleRef = useRef<HTMLDivElement>(null);
  const fidelityTransitionOriginRef = useRef<DOMRect | null>(null);
  const fidelityDockedRef = useRef(false);
  const [showBackButton, setShowBackButton] = useState(() => typeof window === 'undefined' || window.scrollY <= 120);
  const [backButtonAtTop, setBackButtonAtTop] = useState(() => typeof window === 'undefined' || window.scrollY <= 120);

  useEffect(() => {
    let previousScrollY = window.scrollY;
    let hideTimer: number | undefined;
    const onScroll = () => {
      const currentScrollY = window.scrollY;
      const atTop = currentScrollY <= 120;
      const delta = currentScrollY - previousScrollY;
      setBackButtonAtTop((current) => current === atTop ? current : atTop);
      if (Math.abs(delta) > 3 || atTop) {
        setShowBackButton(true);
        window.clearTimeout(hideTimer);
        if (!atTop) hideTimer = window.setTimeout(() => setShowBackButton(false), 1800);
        previousScrollY = currentScrollY;
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.clearTimeout(hideTimer);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  useEffect(() => {
    let frame = 0;
    const updateDock = () => {
      frame = 0;
      const anchor = fidelityAnchorRef.current;
      if (!anchor) return;
      const anchorBounds = anchor.getBoundingClientRect();
      const mobile = window.innerWidth <= 640;
      const dockThreshold = mobile ? 120 : 84;
      const returnThreshold = mobile ? 112 : 80;

      if (!fidelityDockedRef.current && anchorBounds.bottom <= dockThreshold) {
        fidelityTransitionOriginRef.current = fidelityToggleRef.current?.getBoundingClientRect() ?? null;
        fidelityDockedRef.current = true;
        setFidelityDocked(true);
      } else if (fidelityDockedRef.current && anchorBounds.top >= returnThreshold) {
        fidelityTransitionOriginRef.current = fidelityToggleRef.current?.getBoundingClientRect() ?? null;
        fidelityDockedRef.current = false;
        setFidelityDocked(false);
      }
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(updateDock);
    };
    updateDock();
    document.addEventListener('scroll', onScroll, { capture: true, passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      document.removeEventListener('scroll', onScroll, { capture: true });
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  useLayoutEffect(() => {
    const element = fidelityToggleRef.current;
    const origin = fidelityTransitionOriginRef.current;
    fidelityTransitionOriginRef.current = null;
    if (!element || !origin || window.matchMedia('(prefers-reduced-motion: reduce)').matches || typeof element.animate !== 'function') return;

    const destination = element.getBoundingClientRect();
    const deltaX = origin.left - destination.left;
    const deltaY = origin.top - destination.top;
    if (Math.abs(deltaX) < 1 && Math.abs(deltaY) < 1) return;

    const animation = element.animate(
      [
        { transform: `translate(${deltaX}px, ${deltaY}px)` },
        { transform: 'translate(0, 0)' },
      ],
      { duration: 280, easing: 'cubic-bezier(.22,.68,0,1)' },
    );
    return () => animation.cancel();
  }, [fidelityDocked]);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const line = window.innerHeight * 0.35;
      let current: string = chapters[0].id;
      for (const { id } of chapters) {
        const section = document.getElementById(id);
        if (section && section.getBoundingClientRect().top <= line) current = id;
      }
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
        current = chapters[chapters.length - 1].id;
      }
      setActiveChapter((previous) => previous === current ? previous : current);
    };
    const onScroll = () => { if (!frame) frame = window.requestAnimationFrame(update); };
    update();
    document.addEventListener('scroll', onScroll, { capture: true, passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      document.removeEventListener('scroll', onScroll, { capture: true });
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  const goToChapter = (event: MouseEvent<HTMLAnchorElement>, id: string) => {
    event.preventDefault();
    const target = document.getElementById(id);
    if (!target) return;
    scrollToSection(target);
  };

  const goBack = () => {
    const saved = sessionStorage.getItem('ease-contributions-return');
    let destination = { hash: '#works', scrollY: 0 };
    if (saved) {
      try { destination = JSON.parse(saved) as typeof destination; } catch { /* Keep the archive fallback. */ }
    }
    sessionStorage.removeItem('ease-contributions-return');
    sessionStorage.setItem('ease-contributions-scroll-return', JSON.stringify(destination));
    window.location.hash = (destination.hash || '#works').replace(/^#/, '');
  };

  const flow = fidelityFlows[fidelity];

  return (
    <main className="ease-page">
      <header className="ease-topbar">
        <button className={`ease-back ${backButtonAtTop ? 'is-at-top' : ''} ${showBackButton ? 'is-visible' : ''}`} onClick={goBack} type="button" aria-label="Back to portfolio" tabIndex={showBackButton ? 0 : -1}>
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round">
            <path d="M18 5.5v13a1 1 0 0 1-1.5.86l-11.2-6.5a1 1 0 0 1 0-1.72l11.2-6.5A1 1 0 0 1 18 5.5Z" />
          </svg>
        </button>
        <nav ref={navRef} className="ease-chapter-nav" aria-label="EaseService page sections">
          <span aria-hidden="true" className="chapter-nav-indicator" style={pillStyle} />
          {chapters.map(({ id, label }) => (
            <a key={id} ref={setTabRef(id)} className={activeChapter === id ? 'is-active' : ''} aria-current={activeChapter === id ? 'location' : undefined} href={`#${id}`} onClick={(event) => goToChapter(event, id)}>
              {label}
            </a>
          ))}
        </nav>
      </header>

      <section className="ease-hero ease-section" id="ease-overview" aria-labelledby="ease-title">
        <div className="ease-hero-copy">
          <h1 id="ease-title">EaseService</h1>
          <p className="ease-hero-lede">
            EaseService connects people with nearby skilled professionals for everyday needs, making it simpler to discover local services and get started.
          </p>
          <dl className="ease-project-meta">
            <div><dt>Project</dt><dd>Service-finding app</dd></div>
            <div><dt>Role</dt><dd>UI/UX Designer</dd></div>
            <div><dt>Timeline</dt><dd>January 2026</dd></div>
          </dl>
        </div>
        <figure className="ease-hero-visual">
          <EaseImage set="HIGH" file="Group 213.png" alt="EaseService welcome screen with its service-finding message and Get started button" eager />
        </figure>
      </section>

      <section className="ease-interface ease-section" id="ease-interface" aria-labelledby="ease-interface-title">
        <div className="ease-interface-copy">
          <h2 id="ease-interface-title" className="ease-h2">Finding the right service, made simpler.</h2>
          <p>The client profile brings account details and verification credentials together, with dedicated tabs for bookings and reviews.</p>
        </div>
        <figure className="ease-interface-visual">
          <EaseImage set="HIGH" file="EASESERVICE INTERFACE.png" alt="EaseService interface showcase with the complete app interface design" />
        </figure>
      </section>

      <section className="ease-development ease-section" id="ease-development" aria-labelledby="ease-development-title">
        <div className="ease-dev-head">
          <div>
            <p className="ease-eyebrow">/ DESIGN DEVELOPMENT</p>
            <h2 id="ease-development-title" className="ease-h2">How users move through EaseService.</h2>
          </div>
          <p>The map traces onboarding, account access, profile tabs, notifications, and help using the supplied designs.</p>
        </div>

        <div className="ease-fidelity-anchor" ref={fidelityAnchorRef}>
          <div ref={fidelityToggleRef} className={`ease-fidelity-toggle ${fidelityDocked ? 'is-docked' : ''}`} role="group" aria-label="Choose design fidelity">
            {(['LOW', 'HIGH'] as const).map((option) => (
              <button key={option} type="button" className={fidelity === option ? 'is-active' : ''} aria-pressed={fidelity === option} onClick={() => setFidelity(option)}>
                {option === 'LOW' ? 'Low fidelity' : 'High fidelity'}
              </button>
            ))}
          </div>
        </div>

        <div className="ease-flow-map" aria-label="EaseService user-flow map">
          <div className="ease-flow-entry">
            <FlowScreen set={fidelity} {...flow.entry} compact />
            <svg className="ease-entry-branch" viewBox="0 0 480 88" preserveAspectRatio="none" aria-hidden="true" focusable="false">
              <path d="M240 0 V34 C240 51 150 48 150 78 M240 34 C240 51 330 48 330 78" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M145 71 L150 80 L155 71 M325 71 L330 80 L335 71" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div className="ease-entry-outcomes">
              {flow.branches.map((branch, index) => (
                <div key={branch.title}>
                  <span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span><strong>{branch.title}</strong><small>{branch.detail}</small>
                  <div className="ease-branch-screens">
                    {branch.screens.map((screen) => <FlowScreen key={screen.file} set={fidelity} {...screen} />)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <ol className="ease-flow-list" aria-label="Screen flows">
            <li className="ease-flow-row">
              <FlowScreen set={fidelity} {...flow.onboarding.trigger} />
              <FlowConnector />
              <p className="ease-flow-caption">{flow.onboarding.caption}</p>
              <div className="ease-flow-results">
                {flow.onboarding.results.map((screen) => <FlowScreen key={screen.file} set={fidelity} {...screen} />)}
              </div>
            </li>

            <li className="ease-flow-row">
              <FlowScreen set={fidelity} {...flow.password.trigger} />
              <FlowConnector dashed />
              <p className="ease-flow-caption">{flow.password.caption}</p>
              <div className="ease-flow-results">
                <FlowScreen set={fidelity} {...flow.password.result} />
              </div>
              <p className="ease-flow-repeat">{flow.password.repeat}</p>
            </li>

            <li className="ease-flow-row">
              <FlowScreen set={fidelity} {...flow.profile.trigger} />
              <FlowConnector />
              <p className="ease-flow-caption">{flow.profile.caption}</p>
              <div className="ease-flow-results">
                {flow.profile.results.map((screen) => <FlowScreen key={screen.file} set={fidelity} {...screen} />)}
              </div>
            </li>

            {flow.help && <li className="ease-flow-row">
              <FlowScreen set={fidelity} {...flow.help.trigger} />
              <FlowConnector />
              <p className="ease-flow-caption">{flow.help.caption}</p>
              <div className="ease-flow-results">
                {flow.help.results.map((screen) => <FlowScreen key={screen.file} set={fidelity} {...screen} />)}
              </div>
            </li>}
          </ol>
        </div>
      </section>

      <footer className="ease-footer">
        <h2>Everyday services, easier to find.</h2>
        <button className="ease-footer-back" onClick={goBack} type="button">
          <ArrowLeft size={17} strokeWidth={1.75} aria-hidden="true" /> Back to portfolio
        </button>
      </footer>
    </main>
  );
}
