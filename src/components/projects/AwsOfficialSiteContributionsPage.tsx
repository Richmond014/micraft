import { useEffect, useState, type CSSProperties, type MouseEvent } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useSlidingPill } from '../../hooks/useSlidingPill';
import { scrollToSection } from '../../lib/scroll';
import './AwsOfficialSiteContributionsPage.css';

type ScreenSpec = {
  file: string;
  label: string;
  alt: string;
  number: number;
  note: string;
  final?: boolean;
  marker?: { x: number; y: number };
};

type BuyingFlow = {
  trigger: ScreenSpec;
  caption: string;
  result: ScreenSpec;
};

const chapters = [
  { id: 'awsoff-overview', label: 'Overview' },
  { id: 'awsoff-interface', label: 'Interface' },
  { id: 'awsoff-development', label: 'Design development' },
] as const;

const progression: ScreenSpec[] = [
  {
    file: '1st Design.png',
    label: 'First design',
    alt: 'First AWS Cloud Club PUP merchandise page design with a centered heading and four-column product grid.',
    number: 1,
    note: 'A centered merchandise title leads into a left-aligned collection heading and product grid.',
  },
  {
    file: '2nd.png',
    label: 'Second design',
    alt: 'Second merchandise page design with an illustrated mascot, category filters, and product cards.',
    number: 2,
    note: 'The hero shifts to a left-aligned title beside the mascot, with category filters above the products.',
  },
  {
    file: 'Finall.png',
    label: 'Final design',
    alt: 'Final merchandise page design with a gradient Awstronaut headline, centered collections, product filters, and a promotional banner.',
    number: 3,
    note: 'A colorful Awstronaut headline and centered collection introduce the final product layout and banner.',
    final: true,
  },
];

const buyingFlow: BuyingFlow = {
  trigger: {
    ...progression[2],
    label: 'Final merchandise page',
    marker: { x: 13, y: 43 },
  },
  caption: 'The product detail view shows the selected item, its options, quantity controls, and a Start Order button.',
  result: {
    file: 'Buying.png',
    label: 'Product detail',
    alt: 'AWS Cloud Club PUP product detail screen showing sticker thumbnails, product information, quantity controls, and a Start Order button.',
    number: 1,
    note: '',
  },
};

function assetPath(file: string) {
  return `/assets/figma/AWS%20OFFICIAL/${encodeURIComponent(file)}`;
}

function SiteImage({ screen, eager = false }: { screen: ScreenSpec; eager?: boolean }) {
  return <img src={assetPath(screen.file)} alt={screen.alt} loading={eager ? 'eager' : 'lazy'} fetchPriority={eager ? 'high' : 'auto'} decoding="async" />;
}

function ProgressionScreen({ screen }: { screen: ScreenSpec }) {
  const markerStyle = screen.marker
    ? ({ '--awsoff-marker-x': `${screen.marker.x}%`, '--awsoff-marker-y': `${screen.marker.y}%` } as CSSProperties)
    : undefined;

  return (
    <figure className={`awsoff-progression-figure ${screen.final ? 'is-final' : ''}`} style={markerStyle}>
      <div className="awsoff-progression-image">
        <SiteImage screen={screen} />
        {screen.marker && <span className="awsoff-tap-marker" aria-hidden="true" />}
      </div>
      <figcaption className="awsoff-progression-caption">
        <span className="awsoff-number" aria-hidden="true">{screen.number}</span>
        <span className="awsoff-caption-copy">
          <span className="awsoff-caption-title">{screen.label}</span>
          {screen.final && <span className="awsoff-final-tag">Final</span>}
          {screen.note && <span className="awsoff-caption-note">{screen.note}</span>}
        </span>
      </figcaption>
    </figure>
  );
}

export function AwsOfficialSiteContributionsPage() {
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
    if (target) scrollToSection(target);
  };

  const goBack = () => {
    const saved = sessionStorage.getItem('awsoff-contributions-return');
    let destination = { hash: '#works', scrollY: 0 };
    if (saved) {
      try { destination = JSON.parse(saved) as typeof destination; } catch { /* Keep the archive fallback. */ }
    }
    sessionStorage.removeItem('awsoff-contributions-return');
    sessionStorage.setItem('awsoff-contributions-scroll-return', JSON.stringify(destination));
    window.location.hash = (destination.hash || '#works').replace(/^#/, '');
  };

  return (
    <main className="awsoff-page">
      <header className="awsoff-topbar">
        <button className={`awsoff-back ${backButtonAtTop ? 'is-at-top' : ''} ${showBackButton ? 'is-visible' : ''}`} onClick={goBack} type="button" aria-label="Back to portfolio" tabIndex={showBackButton ? 0 : -1}>
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round">
            <path d="M18 5.5v13a1 1 0 0 1-1.5.86l-11.2-6.5a1 1 0 0 1 0-1.72l11.2-6.5A1 1 0 0 1 18 5.5Z" />
          </svg>
        </button>
        <nav ref={navRef} className="awsoff-chapter-nav" aria-label="AWS Cloud Club PUP Official Site sections">
          <span aria-hidden="true" className="chapter-nav-indicator" style={pillStyle} />
          {chapters.map(({ id, label }) => (
            <a key={id} ref={setTabRef(id)} className={activeChapter === id ? 'is-active' : ''} aria-current={activeChapter === id ? 'location' : undefined} href={`#${id}`} onClick={(event) => goToChapter(event, id)}>
              {label}
            </a>
          ))}
        </nav>
      </header>

      <section className="awsoff-hero awsoff-section" id="awsoff-overview" aria-labelledby="awsoff-title">
        <div className="awsoff-hero-copy">
          <h1 id="awsoff-title">AWS Cloud Club PUP</h1>
          <p className="awsoff-hero-lede">A merchandise page showcasing club apparel and accessories, with product cards and a dedicated product detail view.</p>
          <dl className="awsoff-project-meta">
            <div><dt>Project</dt><dd>Merchandise page</dd></div>
            <div><dt>Role</dt><dd>UI/UX Designer</dd></div>
            <div><dt>Timeline</dt><dd>February 2026</dd></div>
          </dl>
        </div>
        <figure className="awsoff-hero-visual">
          <SiteImage screen={{
            file: 'Landing page.png',
            label: 'AWS Cloud Club PUP merchandise landing page',
            alt: 'AWS Cloud Club PUP merchandise landing page with a purple navigation bar, AWCCPUP Merchandise heading, and mascot illustration.',
            number: 0,
            note: '',
          }} eager />
        </figure>
      </section>

      <section className="awsoff-interface awsoff-section" id="awsoff-interface" aria-labelledby="awsoff-interface-title">
        <div className="awsoff-interface-copy">
          <h2 id="awsoff-interface-title" className="awsoff-h2">A closer look at the merchandise page.</h2>
          <p>The final screen presents club apparel and accessories in a product grid, alongside category filters and a promotional banner.</p>
        </div>
        <figure className="awsoff-interface-visual is-mockup">
          <SiteImage screen={{ ...progression[2], file: 'AWS INTERFACE.png', label: 'AWS Cloud Club PUP merchandise interface mockup', alt: 'Laptop mockup showing the AWS Cloud Club PUP merchandise page, with the club navigation, Awstronaut headline, and mascot artwork.' }} />
        </figure>
      </section>

      <section className="awsoff-development awsoff-section" id="awsoff-development" aria-labelledby="awsoff-development-title">
        <header className="awsoff-dev-head">
          <h2 id="awsoff-development-title" className="awsoff-h2">From first draft to the final merchandise page.</h2>
          <p>Three versions show how the merchandise landing page developed, followed by the product detail screen.</p>
        </header>

        <div className="awsoff-progression-wrap">
          <svg className="awsoff-progression-connectors" viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden="true" focusable="false">
            <defs><marker id="awsoff-arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M1 1 L6 4 L1 7" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></marker></defs>
            <path d="M321 470 C333 470 338 470 347 470" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="5 6" strokeLinecap="round" markerEnd="url(#awsoff-arrow)" />
            <path d="M654 470 C666 470 671 470 680 470" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="5 6" strokeLinecap="round" markerEnd="url(#awsoff-arrow)" />
          </svg>
          <ol className="awsoff-progression" aria-label="Merchandise page design progression">
            {progression.map((screen) => (
              <li key={screen.file} className="awsoff-progression-item">
                <ProgressionScreen screen={screen} />
              </li>
            ))}
          </ol>
        </div>

        <section className="awsoff-buying" aria-labelledby="awsoff-buying-title">
          <div className="awsoff-buying-head">
            <h3 id="awsoff-buying-title">Selecting a product.</h3>
            <p>The final merchandise page connects to a product detail view.</p>
          </div>
          <svg className="awsoff-buying-connector" viewBox="0 0 120 84" aria-hidden="true" focusable="false">
            <path d="M60 4 V66 Q60 76 70 76 H92" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M86 70 L94 76 L86 82" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div className="awsoff-buying-flow">
            <ProgressionScreen screen={buyingFlow.trigger} />
            <svg className="awsoff-buying-arrow" viewBox="0 0 100 48" aria-hidden="true" focusable="false">
              <path d="M3 24 H91 M84 18 L92 24 L84 30" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p className="awsoff-buying-caption">{buyingFlow.caption}</p>
            <figure className="awsoff-buying-result">
              <SiteImage screen={buyingFlow.result} />
              <figcaption>{buyingFlow.result.label}</figcaption>
            </figure>
          </div>
        </section>
      </section>

      <footer className="awsoff-footer">
        <h2>Club merchandise, designed to wear your community with pride.</h2>
        <button className="awsoff-footer-back" onClick={goBack} type="button">
          <ArrowLeft size={17} strokeWidth={1.75} aria-hidden="true" /> Back to portfolio
        </button>
      </footer>
    </main>
  );
}
