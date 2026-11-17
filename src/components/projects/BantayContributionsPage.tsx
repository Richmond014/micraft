import { useEffect, useState, type MouseEvent } from 'react';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import { useSlidingPill } from '../../hooks/useSlidingPill';
import { getResponsiveImageSrcSet } from '../../lib/assets';
import { scrollToSection } from '../../lib/scroll';
import { DeferredImage } from '../ui/DeferredImage';
import './BantayContributionsPage.css';

const assetRoot = '/assets/figma/BANTAY%20ASSETS/';
const liveSiteUrl = 'https://bantay-pmt.org/';
const heroImageSizes = '(min-width: 1200px) 705px, (min-width: 768px) 60vw, calc(100vw - 32px)';

const chapters = [
  { id: 'bantay-overview', label: 'Overview' },
  { id: 'bantay-interface', label: 'Interface' },
  { id: 'bantay-development', label: 'Design development' },
] as const;

/**
 * ASSUMPTION: the flow follows the filename order. Verify against the actual
 * images and reorder / rename the labels here if the real progression differs.
 */
const designFlow = [
  { src: 'First Design.png', label: 'Wireframe', alt: 'Bantay low-fidelity wireframe' },
  { src: '2nd Design.png', label: 'Layout exploration', alt: 'Bantay early layout exploration' },
  { src: '3rd Design.png', label: 'Layout iteration', alt: 'Bantay layout iteration' },
  { src: '4th Design.png', label: 'Refinement 1', alt: 'Bantay refined design, first version' },
  { src: '5th Design.png', label: 'Refinement 2', alt: 'Bantay refined design, second version' },
  { src: '6th Design.png', label: 'Refinement 3', alt: 'Bantay refined design, third version' },
  { src: 'FInal Design.png', label: 'Final design', alt: 'Bantay final interface design' },
] as const;

function FlowArrow() {
  return (
    <svg className="bantay-flow-arrow" viewBox="0 0 64 56" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <path d="M3 48 C 30 48, 28 10, 56 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 4" strokeLinecap="round" />
      <path d="M50 5 L58 10 L50 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ProjectImage({ src, alt, eager = false }: { src: string; alt: string; eager?: boolean }) {
  const imageSrc = `${assetRoot}${encodeURIComponent(src)}`;
  const srcSet = getResponsiveImageSrcSet(imageSrc, [400, 800, 1200], src === 'image 46.png' ? 1765 : undefined);
  return (
    <DeferredImage
      src={imageSrc}
      srcSet={srcSet}
      sizes={srcSet ? heroImageSizes : undefined}
      alt={alt}
      priority={eager}
    />
  );
}

export function BantayContributionsPage() {
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
    // The active chapter is the last section whose top has passed the 35% line of the viewport.
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
      setActiveChapter((previous) => (previous === current ? previous : current));
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    update();
    // Capture phase so scrolling inside any wrapper element is caught too, not just window scroll.
    document.addEventListener('scroll', onScroll, { capture: true, passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      document.removeEventListener('scroll', onScroll, { capture: true });
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  const goToChapter = (event: MouseEvent<HTMLAnchorElement>, id: string) => {
    // Scroll in place: a plain #hash link would change the app's hash route.
    event.preventDefault();
    const target = document.getElementById(id);
    if (!target) return;
    scrollToSection(target);
  };

  const goBack = () => {
    const returnTo = sessionStorage.getItem('bantay-contributions-return');
    if (returnTo) {
      sessionStorage.removeItem('bantay-contributions-return');
      try {
        const destination = JSON.parse(returnTo) as { hash?: string; scrollY?: number };
        const hash = destination.hash || '#works';
        sessionStorage.setItem('bantay-contributions-scroll-return', JSON.stringify({
          hash,
          scrollY: destination.scrollY ?? 0,
        }));
        window.location.hash = hash.replace(/^#/, '');
      } catch {
        window.location.hash = 'works';
      }
    } else {
      window.location.href = '/';
    }
  };

  return (
    <main className="bantay-page">
      <header className="bantay-topbar">
        <button className={`bantay-back ${backButtonAtTop ? 'is-at-top' : ''} ${showBackButton ? 'is-visible' : ''}`} onClick={goBack} type="button" aria-label="Back to portfolio" tabIndex={showBackButton ? 0 : -1}>
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round">
            <path d="M18 5.5v13a1 1 0 0 1-1.5.86l-11.2-6.5a1 1 0 0 1 0-1.72l11.2-6.5A1 1 0 0 1 18 5.5Z" />
          </svg>
        </button>
        <nav ref={navRef} className="bantay-chapter-nav" aria-label="Page sections">
          <span aria-hidden="true" className="chapter-nav-indicator" style={pillStyle} />
          {chapters.map(({ id, label }) => (
            <a key={id} ref={setTabRef(id)} className={activeChapter === id ? 'is-active' : ''} aria-current={activeChapter === id ? 'true' : undefined} href={`#${id}`} onClick={(event) => goToChapter(event, id)}>
              {label}
            </a>
          ))}
        </nav>
      </header>

      <section className="bantay-hero bantay-section" id="bantay-overview" aria-labelledby="bantay-title">
        <div className="bantay-hero-copy">
          <h1 id="bantay-title">Bantay</h1>
          <p className="bantay-hero-lede">
            A flood preparedness and evacuation platform bringing local conditions, route information,
            and essential resources into one place.
          </p>
          <dl className="bantay-project-meta">
            <div><dt>Project</dt><dd>Flood preparedness platform</dd></div>
            <div><dt>Role</dt><dd>UI/UX Designer</dd></div>
            <div><dt>Timeline</dt><dd>December 2025</dd></div>
          </dl>
        </div>
        <figure className="bantay-hero-visual">
          <ProjectImage src="image 46.png" alt="Bantay flood preparedness landing page concept" eager />
        </figure>
      </section>

      <section className="bantay-interface bantay-section" id="bantay-interface" aria-labelledby="bantay-interface-title">
        <div className="bantay-interface-copy">
          <h2 id="bantay-interface-title" className="bantay-h2">Local conditions, made easier to read.</h2>
          <p>The dashboard places area status beside a live map, making local conditions and nearby support easier to scan.</p>
          <a className="bantay-live-link" href={liveSiteUrl} target="_blank" rel="noopener noreferrer">
            View Live Site <ArrowUpRight size={17} strokeWidth={1.75} aria-hidden="true" />
          </a>
        </div>
        <figure className="bantay-interface-main">
          <ProjectImage src="Group 33 2.png" alt="Bantay dashboard showing area status, nearby support facilities, and a flood map" />
        </figure>
      </section>

      <section className="bantay-development bantay-section" id="bantay-development" aria-labelledby="bantay-dev-title">
        <div className="bantay-dev-head">
          <h2 id="bantay-dev-title" className="bantay-h2">From wireframes to the final interface.</h2>
          <p>Bantay's design progressed from low-fidelity layouts through several refinements to the final design.</p>
        </div>
        <ol className="bantay-flow">
          {designFlow.map(({ src, label, alt }, index) => (
            <li className="bantay-flow-item" key={src}>
              <figure>
                <div className="bantay-flow-shot"><ProjectImage src={src} alt={alt} /></div>
                <figcaption><span>{index + 1}</span>{label}</figcaption>
              </figure>
              {index % 4 !== 3 && index < designFlow.length - 1 && <FlowArrow />}
            </li>
          ))}
        </ol>
      </section>

      <footer className="bantay-footer">
        <h2>Preparedness starts with clear information.</h2>
        <p className="bantay-footer-note">Worked alongside Florence Lee Cansino on the Bantay project, sharing ideas and contributing to the overall experience.</p>
        <button className="bantay-back bantay-footer-back" onClick={goBack} type="button">
          <ArrowLeft size={17} strokeWidth={1.75} aria-hidden="true" /> Back to portfolio
        </button>
      </footer>
    </main>
  );
}
