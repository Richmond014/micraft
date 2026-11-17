import { useEffect, useState, type CSSProperties, type MouseEvent } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useSlidingPill } from '../../hooks/useSlidingPill';
import { scrollToSection } from '../../lib/scroll';
import './SpotifyContributionsPage.css';

const assetRoot = '/assets/figma/SPOTIFY/';

const chapters = [
  { id: 'spot-overview', label: 'Overview' },
  { id: 'spot-interface', label: 'Interface' },
  { id: 'spot-development', label: 'Design development' },
] as const;

type Marker = { x: number; y: number };
type Screen = { file: string; label: string; alt: string; marker?: Marker };

const entryScreen: Screen = {
  file: 'Group 57.png',
  label: 'Music home',
  alt: 'Redesigned Spotify Music home with category tabs, Quick Picks, recent listening, and recommendations',
};

const entryBranches = [
  {
    title: 'Search and browse',
    detail: 'Search tab',
    screen: { file: 'Group 45.png', label: 'Search categories', alt: 'Search page with genre, release, podcast, and chart categories' },
  },
  {
    title: 'Open a playlist',
    detail: 'Quick Picks',
    screen: { file: 'Group 51.png', label: 'Playlist details', alt: 'Playlist details screen with album artwork, tracks, and playback controls' },
  },
  {
    title: 'Your Library',
    detail: 'Library tab',
    screen: { file: 'Group 63.png', label: 'Library overview', alt: 'Your Library with saved playlists, artists, and podcasts' },
  },
];

const flows: { trigger: Screen; caption: string; results: Screen[]; dashed?: boolean }[] = [
  {
    trigger: {
      file: 'Group 57.png',
      label: 'Music home',
      alt: 'Redesigned Music home with a Charts tab in the category navigation',
      marker: { x: 62, y: 7.5 },
    },
    caption: 'Selecting Charts opens featured, weekly, and daily chart collections.',
    results: [{ file: 'Group 44.png', label: 'Charts', alt: 'Charts page with featured, weekly, and daily music rankings' }],
  },
  {
    trigger: {
      file: 'Group 45.png',
      label: 'Search categories',
      alt: 'Search page with a New Releases category tile among music and podcast categories',
      marker: { x: 25, y: 53 },
    },
    caption: 'Choosing New Releases opens a page of new music grouped by genre.',
    results: [{ file: 'Group 46.png', label: 'New releases', alt: 'New Releases page grouped into pop, Japanese pop, J-rock, and other genres' }],
  },
  {
    trigger: {
      file: 'Group 51.png',
      label: 'Playlist details',
      alt: 'Playlist details screen with a green play control and a track list',
      marker: { x: 86, y: 31 },
    },
    caption: 'Starting the playlist opens the player, where listeners can view lyrics and change playback modes.',
    results: [
      { file: 'Group 52.png', label: 'Now playing', alt: 'Now Playing screen with transport and playback controls' },
      { file: 'Group 53.png', label: 'Lyrics', alt: 'Now Playing screen with song lyrics displayed' },
      { file: 'Group 54.png', label: 'Shuffle on', alt: 'Now Playing screen with Shuffle selected' },
      { file: 'Group 55.png', label: 'Repeat on', alt: 'Now Playing screen with Repeat selected' },
    ],
  },
  {
    trigger: {
      file: 'Group 63.png',
      label: 'Your Library',
      alt: 'Your Library grid with playlist, artist, and podcast collections',
      marker: { x: 51, y: 15 },
    },
    caption: 'Library tabs switch between saved playlists, artists, and podcasts.',
    results: [
      { file: 'Group 62.png', label: 'Playlists', alt: 'Your Library with the Playlists tab selected' },
      { file: 'Group 61.png', label: 'Artists', alt: 'Your Library with followed artists grouped by genre' },
      { file: 'Group 60.png', label: 'Podcasts', alt: 'Your Library with podcast collections grouped by genre' },
    ],
  },
  {
    trigger: {
      file: 'Group 41.png',
      label: 'Navigation drawer',
      alt: 'Account drawer with a Settings and privacy option',
      marker: { x: 48, y: 42 },
    },
    caption: 'The drawer links to Settings, where account controls and personal information are shown.',
    results: [
      { file: 'Group 58.png', label: 'Settings', alt: 'Settings page with account, playback, privacy, and display options' },
      { file: 'Group 59.png', label: 'Edit personal info', alt: 'Edit personal information form with email, password, and profile fields' },
    ],
    dashed: true,
  },
];

function imagePath(file: string) {
  return `${assetRoot}${encodeURIComponent(file)}`;
}

function ProjectImage({ file, alt, eager = false }: { file: string; alt: string; eager?: boolean }) {
  return <img src={imagePath(file)} alt={alt} loading={eager ? 'eager' : 'lazy'} decoding="async" />;
}

function FlowScreen({ screen, compact = false }: { screen: Screen; compact?: boolean }) {
  const style = screen.marker
    ? ({ '--spot-marker-x': `${screen.marker.x}%`, '--spot-marker-y': `${screen.marker.y}%` } as CSSProperties)
    : undefined;
  return (
    <figure className={`spot-flow-screen ${compact ? 'is-compact' : ''} ${screen.marker ? 'has-marker' : ''}`} style={style}>
      <div className="spot-flow-image"><ProjectImage file={screen.file} alt={screen.alt} /></div>
      {screen.marker && <span className="spot-flow-marker" aria-hidden="true" />}
      <figcaption>{screen.label}</figcaption>
    </figure>
  );
}

function FlowConnector({ dashed = false }: { dashed?: boolean }) {
  return (
    <svg className={`spot-flow-connector ${dashed ? 'is-dashed' : ''}`} viewBox="0 0 100 48" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <path className="spot-route-elbow" d="M3 24 H35 Q41 24 41 18 V16 Q41 10 47 10 H91" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray={dashed ? '3 4' : undefined} strokeLinecap="round" strokeLinejoin="round" />
      <path className="spot-route-straight" d="M3 24 H91" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray={dashed ? '3 4' : undefined} strokeLinecap="round" />
      <path className="spot-head-elbow" d="M84 4 L92 10 L84 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path className="spot-head-straight" d="M84 18 L92 24 L84 30" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function SpotifyContributionsPage() {
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
    const returnTo = sessionStorage.getItem('spot-contributions-return');
    if (returnTo) {
      sessionStorage.removeItem('spot-contributions-return');
      try {
        const destination = JSON.parse(returnTo) as { hash?: string; scrollY?: number };
        const hash = destination.hash || '#works';
        sessionStorage.setItem('spot-contributions-scroll-return', JSON.stringify({
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
    <main className="spot-page">
      <header className="spot-topbar">
        <button className={`spot-back ${backButtonAtTop ? 'is-at-top' : ''} ${showBackButton ? 'is-visible' : ''}`} onClick={goBack} type="button" aria-label="Back to portfolio" tabIndex={showBackButton ? 0 : -1}>
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round">
            <path d="M18 5.5v13a1 1 0 0 1-1.5.86l-11.2-6.5a1 1 0 0 1 0-1.72l11.2-6.5A1 1 0 0 1 18 5.5Z" />
          </svg>
        </button>
        <nav ref={navRef} className="spot-chapter-nav" aria-label="Spotify Redesign page sections">
          <span aria-hidden="true" className="chapter-nav-indicator" style={pillStyle} />
          {chapters.map(({ id, label }) => (
            <a key={id} ref={setTabRef(id)} className={activeChapter === id ? 'is-active' : ''} aria-current={activeChapter === id ? 'location' : undefined} href={`#${id}`} onClick={(event) => goToChapter(event, id)}>
              {label}
            </a>
          ))}
        </nav>
      </header>

      <section className="spot-hero spot-section" id="spot-overview" aria-labelledby="spot-title">
        <div className="spot-hero-copy">
          <h1 id="spot-title">A fresh take on Spotify.</h1>
          <p className="spot-hero-lede">
            A mobile listening redesign that separates Music, Podcasts, and Charts, with a clearer home feed and more organized ways to browse.
          </p>
          <dl className="spot-project-meta">
            <div><dt>Project</dt><dd>Music streaming app redesign</dd></div>
            <div><dt>Role</dt><dd>UI/UX Designer</dd></div>
            <div><dt>Timeline</dt><dd>September 2026</dd></div>
          </dl>
        </div>
        <figure className="spot-hero-visual">
          <ProjectImage file="SPOTIFY INTERFACE.png" alt="Spotify redesign interface mockup with Music home and Charts screens" eager />
        </figure>
      </section>

      <section className="spot-interface spot-section" id="spot-interface" aria-labelledby="spot-interface-title">
        <div className="spot-interface-copy">
          <h2 id="spot-interface-title" className="spot-h2">A more organized way to discover music.</h2>
          <p>The redesigned home separates Music, Podcasts, and Charts. Your Library keeps playlists, artists, and podcasts in dedicated views.</p>
        </div>
        <figure className="spot-interface-visual">
          <div className="spot-interface-screens">
            <ProjectImage file="SPOTI ANOTHER.png" alt="Spotify redesign mockup showing the Music home and Podcasts screens on two phones" />
          </div>
        </figure>
      </section>

      <section className="spot-development spot-section" id="spot-development" aria-labelledby="spot-development-title">
        <div className="spot-dev-head">
          <p className="spot-eyebrow">/ DESIGN DEVELOPMENT</p>
          <h2 id="spot-development-title" className="spot-h2">How listeners explore Spotify.</h2>
          <p>The map follows the redesigned paths through charts, search, playlist playback, the library, and account settings.</p>
        </div>

        <div className="spot-flow-map" aria-label="Spotify Redesign user-flow map">
          <div className="spot-flow-entry">
            <FlowScreen screen={entryScreen} compact />
            <svg className="spot-entry-branch" viewBox="0 0 600 88" preserveAspectRatio="none" aria-hidden="true" focusable="false">
              <circle cx="300" cy="4" r="3.5" fill="currentColor" />
              <path d="M300 0 V32 C300 49 100 48 100 78 M300 32 V78 M300 49 C300 48 500 49 500 78" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M95 71 L100 80 L105 71 M295 71 L300 80 L305 71 M495 71 L500 80 L505 71" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div className="spot-entry-outcomes">
              {entryBranches.map((branch, index) => (
                <div className="spot-entry-outcome" key={branch.title}>
                  <span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
                  <strong>{branch.title}</strong>
                  <small>{branch.detail}</small>
                  <div className="spot-branch-screen"><FlowScreen screen={branch.screen} compact /></div>
                </div>
              ))}
            </div>
          </div>

          <ol className="spot-flow-list" aria-label="Spotify Redesign screen flows">
            {flows.map(({ trigger, caption, results, dashed }) => (
              <li className="spot-flow-row" key={trigger.label}>
                <FlowScreen screen={trigger} />
                <FlowConnector dashed={dashed} />
                <p className="spot-flow-caption">{caption}</p>
                <div className={`spot-flow-results ${results.length === 4 ? 'has-four' : ''}`}>
                  {results.map((screen) => <FlowScreen key={screen.file} screen={screen} />)}
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <footer className="spot-footer">
        <h2>Clearer paths from discovery to listening.</h2>
        <button className="spot-footer-back" onClick={goBack} type="button">
          <ArrowLeft size={17} strokeWidth={1.75} aria-hidden="true" /> Back to portfolio
        </button>
      </footer>
    </main>
  );
}
