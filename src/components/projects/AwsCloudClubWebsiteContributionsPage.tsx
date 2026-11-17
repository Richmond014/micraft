import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type MouseEvent } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useSlidingPill } from '../../hooks/useSlidingPill';
import { scrollToSection } from '../../lib/scroll';
import { getResponsiveImageSrcSet } from '../../lib/assets';
import './AwsCloudClubWebsiteContributionsPage.css';

type DesignSet = 'LOW' | 'HIGH' | 'MOBILE';
type Device = 'desktop' | 'phone';
type ScreenSpec = { file: string; label: string; alt: string };
type LandingAnnotation = { label: string; note: string; side: 'left' | 'right'; y: number };
type LandingConfig = {
  device: Device;
  screen: ScreenSpec;
  annotations: LandingAnnotation[];
};

const chapters = [
  { id: 'awscc-overview', label: 'Overview' },
  { id: 'awscc-interface', label: 'Interface' },
  { id: 'awscc-development', label: 'Design development' },
] as const;

const fileBySet: Record<DesignSet, string> = {
  LOW: 'Group 114.png',
  HIGH: 'Group 116.png',
  MOBILE: 'Group 117.png',
};

function fullPageScreen(set: DesignSet, label = 'Full website page'): ScreenSpec {
  const alt = set === 'LOW'
    ? 'Low-fidelity grayscale desktop wireframe of the AWS Cloud Club PUP website, from navigation through the footer'
    : set === 'HIGH'
      ? 'High-fidelity purple desktop design of the AWS Cloud Club PUP website, including its landing page, events, leaders, teams, and footer'
      : 'Mobile AWS Cloud Club PUP website design showing its menu, introduction, benefits, events, leaders, club teams, and footer';
  return { file: fileBySet[set], label, alt };
}

const commonAnnotations = (positions: number[], device: Device): LandingAnnotation[] => [
  { label: 'Navigation', note: device === 'phone' ? 'A menu icon sits above the introduction in the mobile layout.' : 'Home, About, Events, Resources, and Contacts appear in the top menu.', side: 'right', y: positions[0] },
  { label: 'Hero section', note: 'The headline and introduction present the student cloud community at PUP.', side: 'left', y: positions[1] },
  { label: 'Why join', note: 'Three cards describe community, learning materials, and cloud trends.', side: 'right', y: positions[2] },
  { label: 'Upcoming events', note: 'Event cards show dates, locations, titles, and short descriptions.', side: 'left', y: positions[3] },
  { label: 'Our leaders', note: 'Profile cards introduce the club leadership roles.', side: 'right', y: positions[4] },
  { label: 'Be Part of the Club', note: 'Team cards and Explore and Connect actions offer ways to take part.', side: 'left', y: positions[5] },
  { label: 'Footer', note: 'The bottom area includes club links, contact details, and policy links.', side: 'right', y: positions[6] },
];

const landingDesigns: Record<DesignSet, LandingConfig> = {
  LOW: {
    device: 'desktop',
    screen: fullPageScreen('LOW', 'Low-fidelity desktop landing page'),
    annotations: commonAnnotations([1, 6, 25, 42, 58, 82, 96], 'desktop'),
  },
  HIGH: {
    device: 'desktop',
    screen: fullPageScreen('HIGH', 'High-fidelity desktop landing page'),
    annotations: commonAnnotations([1, 6, 26, 42, 58, 82, 96], 'desktop'),
  },
  MOBILE: {
    device: 'phone',
    screen: fullPageScreen('MOBILE', 'Mobile landing page'),
    annotations: commonAnnotations([1, 3, 14, 35, 55, 77, 95], 'phone'),
  },
};

function imagePath(file: string) {
  return `/assets/figma/AWS%20TECHTEAM/${encodeURIComponent(file)}`;
}

const responsiveScreenSpecs: Record<string, {
  width: number;
  height: number;
  widths: readonly number[];
  sizes: string;
}> = {
  'HERO.png': {
    width: 3738,
    height: 2385,
    widths: [400, 800, 1200, 1600, 2400],
    sizes: '(min-width: 1024px) 50vw, 100vw',
  },
  'ZenBook Duo 14.png': {
    width: 4096,
    height: 3072,
    widths: [400, 800, 1200, 1600, 2400],
    sizes: '(min-width: 1024px) 50vw, 100vw',
  },
  'Group 114.png': {
    width: 3738,
    height: 14206,
    widths: [400, 800, 1200, 1600, 2400],
    sizes: '(min-width: 640px) 520px, 100vw',
  },
  'Group 116.png': {
    width: 3749,
    height: 14123,
    widths: [400, 800, 1200, 1600, 2400],
    sizes: '(min-width: 640px) 520px, 100vw',
  },
  'Group 117.png': {
    width: 430,
    height: 10767,
    widths: [200, 400],
    sizes: '(min-width: 640px) 430px, 100vw',
  },
};

function ProjectImage({ screen, eager = false }: { screen: ScreenSpec; eager?: boolean }) {
  const src = imagePath(screen.file);
  const spec = responsiveScreenSpecs[screen.file];
  const srcSet = spec
    ? getResponsiveImageSrcSet(src, spec.widths, spec.width)
    : undefined;

  return (
    <img
      src={src}
      srcSet={srcSet}
      sizes={srcSet ? spec?.sizes : undefined}
      width={spec?.width}
      height={spec?.height}
      alt={screen.alt}
      loading={eager ? 'eager' : 'lazy'}
      fetchPriority={eager ? 'high' : 'auto'}
      decoding="async"
    />
  );
}

export function AwsCloudClubWebsiteContributionsPage() {
  const [activeChapter, setActiveChapter] = useState<string>(chapters[0].id);
  const { navRef, setTabRef, pillStyle } = useSlidingPill(activeChapter);
  const [designSet, setDesignSet] = useState<DesignSet>('LOW');
  const [toggleDocked, setToggleDocked] = useState(false);
  const toggleAnchorRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLDivElement>(null);
  const transitionOriginRef = useRef<DOMRect | null>(null);
  const toggleDockedRef = useRef(false);
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
      const anchor = toggleAnchorRef.current;
      if (!anchor) return;
      const bounds = anchor.getBoundingClientRect();
      const dockThreshold = window.innerWidth <= 640 ? 120 : 84;
      const returnThreshold = window.innerWidth <= 640 ? 112 : 80;
      if (!toggleDockedRef.current && bounds.bottom <= dockThreshold) {
        transitionOriginRef.current = toggleRef.current?.getBoundingClientRect() ?? null;
        toggleDockedRef.current = true;
        setToggleDocked(true);
      } else if (toggleDockedRef.current && bounds.top >= returnThreshold) {
        transitionOriginRef.current = toggleRef.current?.getBoundingClientRect() ?? null;
        toggleDockedRef.current = false;
        setToggleDocked(false);
      }
    };
    const onScroll = () => { if (!frame) frame = window.requestAnimationFrame(updateDock); };
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
    const element = toggleRef.current;
    const origin = transitionOriginRef.current;
    transitionOriginRef.current = null;
    if (!element || !origin || window.matchMedia('(prefers-reduced-motion: reduce)').matches || typeof element.animate !== 'function') return;
    const destination = element.getBoundingClientRect();
    const deltaX = origin.left - destination.left;
    const deltaY = origin.top - destination.top;
    if (Math.abs(deltaX) < 1 && Math.abs(deltaY) < 1) return;
    const animation = element.animate(
      [{ transform: `translate(${deltaX}px, ${deltaY}px)` }, { transform: 'translate(0, 0)' }],
      { duration: 280, easing: 'cubic-bezier(.22,.68,0,1)' },
    );
    return () => animation.cancel();
  }, [toggleDocked]);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const line = window.innerHeight * .35;
      let current: string = chapters[0].id;
      for (const { id } of chapters) {
        const section = document.getElementById(id);
        if (section && section.getBoundingClientRect().top <= line) current = id;
      }
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) current = chapters[chapters.length - 1].id;
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
    const saved = sessionStorage.getItem('awscc-contributions-return');
    let destination = { hash: '#works', scrollY: 0 };
    if (saved) {
      try { destination = JSON.parse(saved) as typeof destination; } catch { /* Keep the archive fallback. */ }
    }
    sessionStorage.removeItem('awscc-contributions-return');
    sessionStorage.setItem('awscc-contributions-scroll-return', JSON.stringify(destination));
    window.location.hash = (destination.hash || '#works').replace(/^#/, '');
  };

  const landing = landingDesigns[designSet];

  return (
    <main className="awscc-page">
      <header className="awscc-topbar">
        <button className={`awscc-back ${backButtonAtTop ? 'is-at-top' : ''} ${showBackButton ? 'is-visible' : ''}`} onClick={goBack} type="button" aria-label="Back to portfolio" tabIndex={showBackButton ? 0 : -1}>
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round">
            <path d="M18 5.5v13a1 1 0 0 1-1.5.86l-11.2-6.5a1 1 0 0 1 0-1.72l11.2-6.5A1 1 0 0 1 18 5.5Z" />
          </svg>
        </button>
        <nav ref={navRef} className="awscc-chapter-nav" aria-label="AWS Cloud Club PUP website sections">
          <span aria-hidden="true" className="chapter-nav-indicator" style={pillStyle} />
          {chapters.map(({ id, label }) => (
            <a key={id} ref={setTabRef(id)} className={activeChapter === id ? 'is-active' : ''} aria-current={activeChapter === id ? 'location' : undefined} href={`#${id}`} onClick={(event) => goToChapter(event, id)}>{label}</a>
          ))}
        </nav>
      </header>

      <section className="awscc-hero awscc-section" id="awscc-overview" aria-labelledby="awscc-title">
        <div className="awscc-hero-copy">
          <h1 id="awscc-title">AWS Cloud Club PUP</h1>
          <p className="awscc-hero-lede">The AWS Cloud Club PUP website introduces the student community, its events, leaders, and ways to take part in club activities.</p>
          <dl className="awscc-project-meta">
            <div><dt>Project</dt><dd>Club website</dd></div>
            <div><dt>Role</dt><dd>UI/UX Designer</dd></div>
            <div><dt>Timeline</dt><dd>September 2025</dd></div>
          </dl>
        </div>
        <figure className="awscc-hero-visual">
          <ProjectImage
            screen={{
              file: 'HERO.png',
              label: 'AWS Cloud Club PUP hero artwork',
              alt: 'Purple space-themed artwork with the phrase “It’s Always Day One,” planets, clouds, and the club mascot.',
            }}
            eager
          />
        </figure>
      </section>

      <section className="awscc-interface awscc-section" id="awscc-interface" aria-labelledby="awscc-interface-title">
        <div className="awscc-interface-copy">
          <h2 id="awscc-interface-title" className="awscc-h2">A closer look at the club website.</h2>
          <p>The high-fidelity design brings the club introduction, events, leaders, and team pathways together in a purple space-inspired visual system.</p>
        </div>
        <figure className="awscc-interface-visual is-mockup">
          <ProjectImage
            screen={{
              file: 'ZenBook Duo 14.png',
              label: 'AWS Cloud Club PUP website mockup',
              alt: 'Transparent laptop mockup showing the AWS Cloud Club PUP website with a lavender navigation bar, club introduction, and space-themed hero artwork.',
            }}
          />
        </figure>
      </section>

      <section className="awscc-development awscc-section" id="awscc-development" aria-labelledby="awscc-development-title">
        <div className="awscc-dev-head">
          <h2 id="awscc-development-title" className="awscc-h2">A closer look at the landing page.</h2>
          <p>Section notes point out the navigation, club introduction, benefits, events, leaders, ways to take part, and footer in each supplied design.</p>
        </div>

        <div className="awscc-fidelity-anchor" ref={toggleAnchorRef}>
          <div ref={toggleRef} className={`awscc-fidelity-toggle ${toggleDocked ? 'is-docked' : ''}`} role="group" aria-label="Choose website design set">
            {(['LOW', 'HIGH', 'MOBILE'] as const).map((option) => (
              <button key={option} type="button" className={designSet === option ? 'is-active' : ''} aria-pressed={designSet === option} onClick={() => setDesignSet(option)}>
                {option === 'LOW' ? 'Low fidelity' : option === 'HIGH' ? 'High fidelity' : 'Mobile'}
              </button>
            ))}
          </div>
        </div>

        <div className={`awscc-landing-layout is-${landing.device}`}>
          <figure className="awscc-landing-figure">
            <ProjectImage screen={landing.screen} />
            {landing.annotations.map((annotation, index) => (
              <span key={annotation.label} className={`awscc-image-marker is-${annotation.side}`} style={{ '--awscc-note-y': `${annotation.y}%` } as CSSProperties} aria-hidden="true">{index + 1}</span>
            ))}
            <figcaption>{landing.screen.label}</figcaption>
          </figure>
          <ol className="awscc-annotation-list" aria-label={`${designSet.toLowerCase()} landing page annotations`}>
            {landing.annotations.map((annotation, index) => (
              <li key={annotation.label} className={`awscc-annotation is-${annotation.side}`} style={{ '--awscc-note-y': `${annotation.y}%` } as CSSProperties}>
                <strong><span>{index + 1}</span>{annotation.label}</strong>
                <p>{annotation.note}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <footer className="awscc-footer">
        <h2>A welcoming space to learn, connect, and grow.</h2>
        <button className="awscc-footer-back" onClick={goBack} type="button"><ArrowLeft size={17} strokeWidth={1.75} aria-hidden="true" /> Back to portfolio</button>
      </footer>
    </main>
  );
}
