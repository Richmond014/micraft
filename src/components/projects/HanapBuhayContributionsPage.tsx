import { useEffect, useState, type CSSProperties, type MouseEvent } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useSlidingPill } from '../../hooks/useSlidingPill';
import { scrollToSection } from '../../lib/scroll';
import './HanapBuhayContributionsPage.css';

const assetRoot = '/assets/figma/HANAPBUHAY/';

const chapters = [
  { id: 'hanap-overview', label: 'Overview' },
  { id: 'hanap-interface', label: 'Interface' },
  { id: 'hanap-development', label: 'Design development' },
] as const;

const landingAnnotations: {
  label: string;
  note: string;
  side: 'left' | 'right';
  y: number;
}[] = [
  { label: 'Navigation', note: 'Links to About, Services, and Guide sit beside account actions.', side: 'left', y: 3 },
  { label: 'Landing hero', note: 'Introduces the platform with Client and Worker entry points.', side: 'right', y: 14 },
  { label: 'Features', note: 'Three cards describe the platform, services, and messaging.', side: 'left', y: 32 },
  { label: 'Worker categories', note: 'Shows examples including plumbers, carpenters, and tutors.', side: 'right', y: 54 },
  { label: 'Process', note: 'Outlines the steps: Start, Connect, Collaborate, and Grow.', side: 'left', y: 77 },
  { label: 'Footer', note: 'Includes project information, an About summary, and contact icons.', side: 'right', y: 96 },
];

type AccessScreen = {
  file: string;
  label: string;
  alt: string;
  marker?: { x: number; y: number };
};

type AccessFlowConfig = {
  source: AccessScreen;
  result: AccessScreen;
  caption: string;
};

const accountAccess: AccessFlowConfig = {
  source: {
    file: 'Group 46900.png',
    label: 'Login',
    alt: 'HanapBuhay login screen with username and password fields, Google sign-in, and a Register link',
    marker: { x: 77, y: 79 },
  },
  result: {
    file: 'Group 46901.png',
    label: 'Register',
    alt: 'HanapBuhay Create Account screen with name, email, password, terms, and Google sign-up fields',
  },
  caption: 'Selecting Register from the login screen opens the Create Account form.',
};

function imagePath(file: string) {
  return `${assetRoot}${encodeURIComponent(file)}`;
}

function HanapImage({ file, alt, eager = false }: { file: string; alt: string; eager?: boolean }) {
  return <img src={imagePath(file)} alt={alt} loading={eager ? 'eager' : 'lazy'} decoding="async" />;
}

function AccessScreenFigure({ screen }: { screen: AccessScreen }) {
  const style = screen.marker
    ? ({ '--hanap-marker-x': `${screen.marker.x}%`, '--hanap-marker-y': `${screen.marker.y}%` } as CSSProperties)
    : undefined;
  return (
    <figure className={`hanap-access-screen ${screen.marker ? 'has-marker' : ''}`} style={style}>
      <div className="hanap-access-image"><HanapImage file={screen.file} alt={screen.alt} /></div>
      {screen.marker && <span className="hanap-tap-marker" aria-hidden="true" />}
      <figcaption>{screen.label}</figcaption>
    </figure>
  );
}

function AccessConnector() {
  return (
    <svg className="hanap-access-connector" viewBox="0 0 100 48" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <path d="M3 24 H91" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 4" strokeLinecap="round" />
      <path d="M84 18 L92 24 L84 30" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function HanapBuhayContributionsPage() {
  const [activeChapter, setActiveChapter] = useState<string>(chapters[0].id);
  const { navRef, setTabRef, pillStyle } = useSlidingPill(activeChapter);
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
    const saved = sessionStorage.getItem('hanap-contributions-return');
    let destination = { hash: '#works', scrollY: 0 };
    if (saved) {
      try { destination = JSON.parse(saved) as typeof destination; } catch { /* Keep the archive fallback. */ }
    }
    sessionStorage.removeItem('hanap-contributions-return');
    sessionStorage.setItem('hanap-contributions-scroll-return', JSON.stringify(destination));
    window.location.hash = (destination.hash || '#works').replace(/^#/, '');
  };

  return (
    <main className="hanap-page">
      <header className="hanap-topbar">
        <button className={`hanap-back ${backButtonAtTop ? 'is-at-top' : ''} ${showBackButton ? 'is-visible' : ''}`} onClick={goBack} type="button" aria-label="Back to portfolio" tabIndex={showBackButton ? 0 : -1}>
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round">
            <path d="M18 5.5v13a1 1 0 0 1-1.5.86l-11.2-6.5a1 1 0 0 1 0-1.72l11.2-6.5A1 1 0 0 1 18 5.5Z" />
          </svg>
        </button>
        <nav ref={navRef} className="hanap-chapter-nav" aria-label="HanapBuhay page sections">
          <span aria-hidden="true" className="chapter-nav-indicator" style={pillStyle} />
          {chapters.map(({ id, label }) => (
            <a key={id} ref={setTabRef(id)} className={activeChapter === id ? 'is-active' : ''} aria-current={activeChapter === id ? 'location' : undefined} href={`#${id}`} onClick={(event) => goToChapter(event, id)}>
              {label}
            </a>
          ))}
        </nav>
      </header>

      <section className="hanap-hero hanap-section" id="hanap-overview" aria-labelledby="hanap-title">
        <div className="hanap-hero-copy">
          <h1 id="hanap-title">HanapBuhay</h1>
          <p className="hanap-hero-lede">HanapBuhay presents a platform for connecting clients with skilled workers and showcasing services. Its landing page introduces worker categories and a four-step process.</p>
          <dl className="hanap-project-meta">
            <div><dt>Project</dt><dd>Employment platform</dd></div>
            <div><dt>Role</dt><dd>UI/UX Designer</dd></div>
            <div><dt>Timeline</dt><dd>2026</dd></div>
          </dl>
        </div>
        <figure className="hanap-hero-visual">
          <HanapImage file="Group 46903.png" alt="HanapBuhay brand collage showing the logo and people representing clients and workers" eager />
        </figure>
      </section>

      <section className="hanap-interface hanap-section" id="hanap-interface" aria-labelledby="hanap-interface-title">
        <div className="hanap-interface-copy">
          <h2 id="hanap-interface-title" className="hanap-h2">A clear path to account access.</h2>
          <p>The login and Create Account screens show the available sign-in fields, account actions, and Google sign-in option.</p>
        </div>
        <figure className="hanap-interface-visual">
          <HanapImage file="INTERFACE NEW.png" alt="HanapBuhay laptop mockup showing the landing page and login interface" />
        </figure>
      </section>

      <section className="hanap-development hanap-section" id="hanap-development" aria-labelledby="hanap-development-title">
        <div className="hanap-dev-head">
          <h2 id="hanap-development-title" className="hanap-h2">From landing page to account access.</h2>
          <p>The landing page introduces the service, worker categories, and process, followed by the login and registration screens.</p>
        </div>

        <div className="hanap-landing-layout">
          <figure className="hanap-landing-figure">
            <HanapImage file="Group 46899.png" alt="Full HanapBuhay landing page showing navigation, hero, features, worker categories, process, and footer" />
            {landingAnnotations.map((annotation, index) => (
              <span key={annotation.label} className={`hanap-image-marker is-${annotation.side}`} style={{ '--hanap-note-y': `${annotation.y}%` } as CSSProperties} aria-hidden="true">{index + 1}</span>
            ))}
            <figcaption>HanapBuhay landing page</figcaption>
          </figure>
          <ol className="hanap-annotation-list" aria-label="HanapBuhay landing page sections">
            {landingAnnotations.map((annotation, index) => (
              <li key={annotation.label} className={`hanap-annotation is-${annotation.side}`} style={{ '--hanap-note-y': `${annotation.y}%` } as CSSProperties}>
                <strong><span>{index + 1}</span>{annotation.label}</strong>
                <p>{annotation.note}</p>
              </li>
            ))}
          </ol>
        </div>

        <div className="hanap-access-section">
          <h3>Account access</h3>
          <p className="hanap-access-intro">The login screen includes a Register link that leads to the account creation form.</p>
          <div className="hanap-access-flow" aria-label="HanapBuhay account access flow">
            <p className="hanap-access-label">Sign in / Sign up</p>
            <div className="hanap-access-screens">
              <AccessScreenFigure screen={accountAccess.source} />
              <AccessConnector />
              <AccessScreenFigure screen={accountAccess.result} />
            </div>
            <p className="hanap-access-caption">{accountAccess.caption}</p>
          </div>
        </div>
      </section>

      <footer className="hanap-footer">
        <h2>Connecting skills with opportunity.</h2>
        <button className="hanap-footer-back" onClick={goBack} type="button">
          <ArrowLeft size={17} strokeWidth={1.75} aria-hidden="true" /> Back to portfolio
        </button>
      </footer>
    </main>
  );
}
