import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowUpRight } from 'lucide-react'
import { scrollToTarget } from '../../lib/scroll'
import './LoopCaseStudyPage.css'

function goBack() {
  const saved = sessionStorage.getItem('loop-case-study-return')
  let destination = { hash: '#home', scrollY: 0 }
  if (saved) {
    try { destination = JSON.parse(saved) as typeof destination } catch { /* Use the home fallback. */ }
  }
  sessionStorage.removeItem('loop-case-study-return')
  sessionStorage.setItem('loop-case-study-scroll-return', JSON.stringify(destination))
  window.location.hash = destination.hash.replace(/^#/, '') || 'home'
}

const imgIPhone16Pro = "/assets/figma/loop-case-study/iphone16-pro.png";
const imgLogoAnimationComponents1 = "/assets/figma/loop-case-study/logo-animation-components1.png";
const imgImage93 = "/assets/figma/loop-case-study/image93.png";

const loopChapters = [
  { label: 'Overview', target: 'loop-overview' },
  { label: 'Research', target: 'loop-research' },
  { label: 'Identity', target: 'loop-identity' },
  { label: 'User Flow', target: 'loop-user-flow' },
  { label: 'App Screens', target: 'loop-app-screens' },
] as const;

function LoopChapterNav() {
  const [activeChapter, setActiveChapter] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [pillPosition, setPillPosition] = useState({ left: 0, width: 0 });
  const navRef = useRef<HTMLElement>(null);
  const tabRefs = useRef<HTMLButtonElement[]>([]);
  const navigationTargetRef = useRef<number | null>(null);
  const activeChapterRef = useRef(0);
  const scrollSpyLockUntil = useRef(0);
  const scrollSpyLockTimer = useRef<number | undefined>(undefined);

  const selectChapter = (index: number) => {
    activeChapterRef.current = index;
    setActiveChapter(index);
  };

  const movePillToTab = (index: number, clickedTab?: HTMLButtonElement) => {
    const tab = clickedTab ?? tabRefs.current[index];
    if (!tab || !navRef.current) return;
    setPillPosition({ left: tab.offsetLeft, width: tab.offsetWidth });
  };

  useLayoutEffect(() => {
    movePillToTab(activeChapter);
  }, [activeChapter]);

  useEffect(() => {
    const sections: Array<HTMLElement | null> = loopChapters.map((chapter) => document.getElementById(chapter.target));
    const intersecting = new Map<number, Element>();
    const updateFromPosition = () => {
      const pageScrollY = Math.max(window.scrollY, document.documentElement.scrollTop, document.body.scrollTop);
      const hero = sections[0];
      const heroHasPassed = Boolean(hero && hero.getBoundingClientRect().bottom <= 0);
      setIsVisible(pageScrollY > 120 || heroHasPassed);
      if (pageScrollY <= 120 && !heroHasPassed) {
        navigationTargetRef.current = null;
        selectChapter(0);
        return;
      }
      if (window.innerHeight + pageScrollY >= document.documentElement.scrollHeight - 2) {
        navigationTargetRef.current = null;
        selectChapter(loopChapters.length - 1);
        return;
      }
      if (performance.now() < scrollSpyLockUntil.current || !intersecting.size) return;
      navigationTargetRef.current = null;
      const referenceY = window.innerHeight * 0.425;
      const closest = [...intersecting.entries()].sort(([, a], [, b]) => {
        const aRect = a.getBoundingClientRect();
        const bRect = b.getBoundingClientRect();
        return Math.abs((aRect.top + aRect.bottom) / 2 - referenceY)
          - Math.abs((bRect.top + bRect.bottom) / 2 - referenceY);
      })[0];
      if (closest) selectChapter(closest[0]);
    };
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const index = sections.indexOf(entry.target as HTMLElement);
        if (index < 0) return;
        if (entry.isIntersecting) intersecting.set(index, entry.target);
        else intersecting.delete(index);
      });
      updateFromPosition();
    }, { rootMargin: '-40% 0px -55% 0px', threshold: 0 });
    sections.forEach((section) => {
      if (!section) return;
      (section as HTMLElement).style.scrollMarginTop = '96px';
      observer.observe(section);
    });
    const onScroll = () => updateFromPosition();
    const onResize = () => {
      movePillToTab(activeChapterRef.current);
      updateFromPosition();
    };
    const onScrollEnd = () => {
      window.clearTimeout(scrollSpyLockTimer.current);
      scrollSpyLockUntil.current = 0;
      updateFromPosition();
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    window.addEventListener('scrollend', onScrollEnd);
    updateFromPosition();
    return () => {
      observer.disconnect();
      window.clearTimeout(scrollSpyLockTimer.current);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scrollend', onScrollEnd);
    };
  }, []);

  const navigateToChapter = (index: number, clickedTab: HTMLButtonElement) => {
    const target = document.getElementById(loopChapters[index].target);
    selectChapter(index);
    movePillToTab(index, clickedTab);
    if (!target) return;
    navigationTargetRef.current = index;
    scrollSpyLockUntil.current = performance.now() + 800;
    window.clearTimeout(scrollSpyLockTimer.current);
    scrollSpyLockTimer.current = window.setTimeout(() => {
      scrollSpyLockUntil.current = 0;
      navigationTargetRef.current = null;
      window.dispatchEvent(new Event('scroll'));
    }, 800);
    const top = Math.max(0, target.getBoundingClientRect().top + window.scrollY - 96);
    scrollToTarget(top, { behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  };

  return createPortal(
    <nav ref={navRef} aria-label="Loop case study sections" className={`fixed left-1/2 top-3 z-[70] w-[min(680px,calc(100vw-24px))] -translate-x-1/2 rounded-full border border-black/10 bg-white/85 p-1 shadow-[0_8px_24px_rgba(0,0,0,0.14),inset_0_1px_0_rgba(255,255,255,0.95)] backdrop-blur-xl transition-[opacity,transform] duration-200 ${isVisible ? 'translate-y-0 opacity-100' : 'pointer-events-none -translate-y-2 opacity-0'}`}>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute bottom-1 top-1 z-0 rounded-full border border-[#3f1d56] bg-gradient-to-b from-[#8a3fbc] to-[#3f1d56] shadow-[inset_0_1px_0_rgba(255,255,255,0.24),0_2px_6px_rgba(63,29,86,0.28)] transition-[transform,width] duration-300 ease-out"
        style={{ width: pillPosition.width, transform: `translateX(${pillPosition.left}px)` }}
      />
      <div role="tablist" aria-label="Case study chapters" className="relative z-10 flex items-center gap-1">
          {loopChapters.map((chapter, index) => {
            const selected = activeChapter === index;
            return (
              <button
                key={chapter.label}
                type="button"
                role="tab"
                data-target={chapter.target}
                aria-selected={selected}
                ref={(element) => { if (element) tabRefs.current[index] = element; }}
                className={`relative z-10 min-w-0 flex-1 rounded-full border border-transparent px-1 py-2 text-[clamp(10px,2.7vw,15px)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-600 ${selected ? 'text-[#00e676]' : 'text-neutral-600 hover:text-neutral-900'}`}
                onClick={(event) => navigateToChapter(index, event.currentTarget)}
              >
                <span className="pointer-events-none">{chapter.label}</span>
              </button>
            );
          })}
      </div>
    </nav>,
    document.body,
  );
}
const imgEllipse785 = "/assets/figma/loop-case-study/ellipse785.png";
const imgHandAndIPhone16Pro = "/assets/figma/loop-case-study/hand-and-iphone16-pro.png";
const imgFrame4273220871 = "/assets/figma/loop-case-study/frame4273220871.png";
const imgImage91 = "/assets/figma/loop-case-study/image91.png";
const imgRectangle49 = "/assets/figma/loop-case-study/rectangle49.png";
const imgRectangle47 = "/assets/figma/loop-case-study/rectangle47.png";
const imgImage90 = "/assets/figma/loop-case-study/image90.png";
const imgIPhone13Pro = "/assets/figma/loop-case-study/iphone13-pro.png";
const imgImage99 = "/assets/figma/loop-case-study/image99-candid-riders-full.jpg";
const imgImage113 = "/assets/figma/loop-case-study/image113.png";
const imgImage101 = "/assets/figma/loop-case-study/image101.png";
const imgImage100 = "/assets/figma/loop-case-study/image100.png";
const imgImage111 = "/assets/figma/loop-case-study/image111.png";
const imgImage106 = "/assets/figma/loop-case-study/image106.png";
const imgImage54 = "/assets/figma/loop-case-study/image54.png";
const imgImage53 = "/assets/figma/loop-case-study/image53.png";
const imgImage3 = "/assets/figma/loop-case-study/image3.png";
const imgImage109 = "/assets/figma/loop-case-study/image109.png";
const imgImage55 = "/assets/figma/loop-case-study/image55.png";
const imgImage105 = "/assets/figma/loop-case-study/image105.png";
const imgImage102 = "/assets/figma/loop-case-study/image102.png";
const imgImage103 = "/assets/figma/loop-case-study/image103.png";
const imgImage107 = "/assets/figma/loop-case-study/image107.png";
const imgImage104 = "/assets/figma/loop-case-study/image104.png";
const imgImage108 = "/assets/figma/loop-case-study/image108.png";
const imgImage110 = "/assets/figma/loop-case-study/image110.png";
const imgImage112 = "/assets/figma/loop-case-study/image112.png";
const imgImage114 = "/assets/figma/loop-case-study/image114.png";
const imgIPhone12ProWoodenHands = "/assets/figma/loop-case-study/loop-phone-wooden-hands.png";
const imgPersonaMaria = "/assets/figma/loop-case-study/persona-maria.png";
const imgPersonaAlex = "/assets/figma/loop-case-study/persona-alex.png";
const imgPersonaCarlo = "/assets/figma/loop-case-study/persona-carlo.png";
const imgIphone26 = "/assets/figma/loop-case-study/iphone26.png";
const imgIphone28 = "/assets/figma/loop-case-study/iphone28.png";
const imgIphone27 = "/assets/figma/loop-case-study/iphone27.png";
const imgIphone14 = "/assets/figma/loop-case-study/iphone14.png";
const imgIphone15 = "/assets/figma/loop-case-study/iphone15.png";
const imgIphone21 = "/assets/figma/loop-case-study/iphone21.png";
const imgIphone25 = "/assets/figma/loop-case-study/iphone25.png";
const imgIphone17 = "/assets/figma/loop-case-study/iphone17.png";
const imgIphone22 = "/assets/figma/loop-case-study/iphone22.png";
const imgIphone23 = "/assets/figma/loop-case-study/iphone23.png";
const imgIphone241 = "/assets/figma/loop-case-study/iphone241.png";
const imgIphoneTripBegun = "/assets/figma/loop-case-study/iphone-trip-begun.png";
const imgImage121 = "/assets/figma/loop-case-study/image121.png";
const imgIPhone16 = "/assets/figma/loop-case-study/iphone16.png";
const imgBxRightArrow = "/assets/figma/loop-case-study/bx-right-arrow.svg";
const imgEllipse786 = "/assets/figma/loop-case-study/ellipse786.svg";
const imgEllipse790 = "/assets/figma/loop-case-study/ellipse790.svg";
const imgGroup = "/assets/figma/loop-case-study/group.svg";
const imgGroup1 = "/assets/figma/loop-case-study/group1.svg";
const imgLine63 = "/assets/figma/loop-case-study/line63.svg";
const imgLine1 = "/assets/figma/loop-case-study/line1.svg";
const imgArrow16 = "/assets/figma/loop-case-study/arrow16.svg";
const imgArrow1 = "/assets/figma/loop-case-study/arrow1.svg";
const imgArrow8 = "/assets/figma/loop-case-study/arrow8.svg";
const imgArrow30 = "/assets/figma/loop-case-study/arrow30.svg";
const imgArrow32 = "/assets/figma/loop-case-study/arrow32.svg";
const imgArrow34 = "/assets/figma/loop-case-study/arrow34.svg";
const imgLine2 = "/assets/figma/loop-case-study/line2.svg";
const imgLine23 = "/assets/figma/loop-case-study/line23.svg";

type SitemapTone = 'green' | 'orange' | 'purple';

function DriverSitemapNode({ left, top, label, tone }: { left: number; top: number; label: string; tone: SitemapTone }) {
  const toneColor = {
    green: '#16a34a',
    orange: '#ffae33',
    purple: '#711982',
  }[tone];
  return (
    <div
      className="absolute bg-white border border-solid content-stretch flex items-center overflow-clip px-[24px] py-[12px] whitespace-nowrap"
      data-name="Node / Default"
      style={{ left, top, borderColor: toneColor, color: toneColor }}
    >
      <p className="[word-break:break-word] font-['Roboto:Medium'] font-medium leading-[normal] relative shrink-0 text-[12px] text-center whitespace-nowrap" style={{ fontVariationSettings: '"wdth" 100' }}>
        {label}
      </p>
    </div>
  );
}

function DriverSitemap() {
  const nodes: Array<{ left: number; top: number; label: string; tone: SitemapTone }> = [
    { left: 900, top: 155, label: 'Home', tone: 'green' },
    { left: 878, top: 254, label: 'Splash Screen', tone: 'green' },
    { left: 136, top: 406, label: 'Ride Management', tone: 'orange' },
    { left: 520, top: 406, label: 'Earnings & Wallet', tone: 'orange' },
    { left: 900, top: 402, label: 'Safety', tone: 'orange' },
    { left: 1124, top: 406, label: 'Communication', tone: 'orange' },
    { left: 1345, top: 406, label: 'Ratings & Feedback', tone: 'orange' },
    { left: 1520, top: 418, label: 'Account', tone: 'orange' },
    { left: 66, top: 506, label: 'Bookings', tone: 'green' },
    { left: 42, top: 574, label: 'Available Booking', tone: 'green' },
    { left: 48, top: 642, label: 'Booking Details', tone: 'green' },
    { left: 60, top: 710, label: 'Active Ride', tone: 'green' },
    { left: 58, top: 778, label: 'Ride History', tone: 'green' },
    { left: 250, top: 506, label: 'Navigation', tone: 'green' },
    { left: 226, top: 574, label: 'Pickup Location', tone: 'green' },
    { left: 250, top: 642, label: 'Destination', tone: 'green' },
    { left: 268, top: 710, label: 'Route', tone: 'green' },
    { left: 236, top: 778, label: 'Live Navigation', tone: 'green' },
    { left: 446, top: 506, label: 'Earnings', tone: 'green' },
    { left: 430, top: 574, label: 'Daily Earnings', tone: 'green' },
    { left: 422, top: 642, label: 'Weekly Earnings', tone: 'green' },
    { left: 436, top: 710, label: 'Transactions', tone: 'green' },
    { left: 644, top: 506, label: 'Wallet', tone: 'green' },
    { left: 630, top: 574, label: 'Promotions', tone: 'green' },
    { left: 630, top: 642, label: 'Subscription', tone: 'green' },
    { left: 908, top: 478, label: 'SOS', tone: 'green' },
    { left: 864, top: 546, label: 'Emergency Contacts', tone: 'green' },
    { left: 870, top: 614, label: 'Safety Information', tone: 'green' },
    { left: 870, top: 682, label: 'Report Incident', tone: 'green' },
    { left: 1136, top: 478, label: 'Notification', tone: 'green' },
    { left: 1156, top: 551, label: 'Chat', tone: 'green' },
    { left: 1160, top: 624, label: 'Call', tone: 'green' },
    { left: 1350, top: 478, label: 'Passenger Ratings', tone: 'green' },
    { left: 1380, top: 551, label: 'Feedback', tone: 'green' },
    { left: 1523, top: 484, label: 'Login', tone: 'purple' },
    { left: 1520, top: 551, label: 'Register', tone: 'purple' },
    { left: 1495, top: 618, label: 'Forgot Password', tone: 'purple' },
    { left: 1485, top: 685, label: 'Account Verification', tone: 'purple' },
    { left: 1525, top: 752, label: 'Profile', tone: 'purple' },
    { left: 1521, top: 819, label: 'Settings', tone: 'purple' },
    { left: 1480, top: 886, label: 'Personal Information', tone: 'purple' },
  ];
  return (
    <div className="loop-study-driver-sitemap absolute left-1/2 top-[12620px] h-[1024px] w-[1738px] -translate-x-1/2">
      <p className="absolute left-[26px] top-[62px] font-['Roboto:Medium'] text-[40px] font-medium leading-[normal] text-black">LOOP — DRIVER Site Map</p>
      <div className="absolute left-[26px] top-[132px] flex flex-col gap-[15px]">
        {([
          ['#16a34a', 'Details Page'],
          ['#ffae33', 'Category / List Page'],
          ['#711982', 'Authenticated Page'],
        ] as const).map(([color, label]) => (
          <div key={label} className="flex items-center gap-[6px]">
            <div className="size-[35px] border bg-white" style={{ borderColor: color }} />
            <span className="w-[150px] font-['Roboto:Medium'] text-[12px] text-black">{label}</span>
          </div>
        ))}
      </div>
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1738 1024" aria-hidden="true">
        <g fill="none" stroke="#777" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
          <path d="M941 201V254 M941 300V347H209 M941 347H1567 M209 347V406 M592 347V406 M941 347V402 M1192 347V406 M1423 347V406 M1567 347V418" />
          <path d="M209 452V478H116 M209 478H690 M116 478V506 M304 478V506 M502 478V506 M690 478V506 M116 552V778 M304 552V778 M502 552V710 M690 552V642" />
          <path d="M941 448V478 M941 524V682 M1192 452V478 M1192 524V624 M1423 452V478 M1423 524V551 M1567 464V484 M1567 530V886" />
        </g>
      </svg>
      {nodes.map((node) => <DriverSitemapNode key={`${node.label}-${node.left}`} {...node} />)}
    </div>
  );
}

function FigmaLoopCaseStudy() {
  const loopScreenMarqueeItems = [
    { src: '/assets/figma/loop-case-study/loop-screen-driver-arrived.png', alt: 'Loop driver arrival screen' },
    { src: '/assets/figma/loop-case-study/loop-screen-share-ride.png', alt: 'Loop share ride screen' },
    { src: '/assets/figma/loop-case-study/loop-screen-home.png', alt: 'Loop home screen' },
    { src: '/assets/figma/loop-case-study/loop-screen-choose-ride.png', alt: 'Loop choose ride screen' },
    { src: '/assets/figma/loop-case-study/loop-screen-fare-details.png', alt: 'Loop fare details screen' },
  ];
  return (
    <div className="bg-[#eee] relative size-full" data-node-id="299:183" data-name="Loop Case Study">
      <div id="loop-overview" className="absolute bg-gradient-to-b from-[#3f1d56] h-[735px] left-0 overflow-clip to-[#8a3fbc] to-[87.5%] top-[179px] w-[1920px]" data-node-id="299:184">
        <p className="[word-break:break-word] absolute font-['HelveticaNeue:Light'] leading-[normal] left-[calc(50%-205.5px)] not-italic text-[#00e676] text-[50px] top-[36px] whitespace-nowrap" data-node-id="299:185">
          Lamina Studios LLC
        </p>
        <p className="[word-break:break-word] absolute font-['Poppins:Bold'] h-[612px] leading-[normal] left-[242px] not-italic text-[#00e676] text-[550px] top-[-35px] w-[1472px]" data-node-id="299:186">
          LOOP
        </p>
        <div className="absolute contents left-[589px] top-[224px]" data-node-id="299:187">
          <div className="absolute h-[804.354px] left-[948.79px] top-[225px] w-[357.297px]" data-node-id="299:188" data-name="iPhone 16 Pro">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <img loading="eager" alt="" className="absolute h-[139.89%] left-[-216.18%] max-w-none top-[-32.48%] w-[420.11%]" src={imgIPhone16Pro} />
            </div>
          </div>
          <div className="absolute h-[814.812px] left-[590px] top-[337.19px] w-[372.983px]" data-node-id="299:189" data-name="iPhone 16 Pro">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <img loading="eager" alt="" className="absolute h-[138.09%] left-[-98.91%] max-w-none top-[-7.25%] w-[402.44%]" src={imgIPhone16Pro} />
            </div>
          </div>
        </div>
      </div>
      <button type="button" aria-label="Back to projects" onClick={goBack} className="absolute bg-[rgba(219,219,219,0.5)] border border-[#b5b5b5] border-solid h-[122px] left-[119px] rounded-[30px] top-[204px] w-[123px]" data-node-id="299:190">
        <div className="absolute flex items-center justify-center left-[27px] size-[67px] top-[26px]" data-node-id="299:191">
          <div className="-scale-y-100 flex-none rotate-180">
            <div className="relative size-[67px]" data-name="bx:right-arrow">
              <img loading="lazy" alt="" className="absolute block inset-0 max-w-none size-full" src={imgBxRightArrow} />
            </div>
          </div>
        </div>
      </button>
      <div id="loop-research" className="-translate-x-1/2 [word-break:break-word] absolute content-stretch flex flex-col gap-[9px] items-center leading-[normal] left-[calc(50%+3px)] not-italic text-[30px] text-black top-[2568px] w-[718px]" data-node-id="299:200">
        <p className="font-['Helvetica_Neue:Bold'] relative shrink-0 text-center w-full" data-node-id="299:201">{`Research & Discovery`}</p>
        <p className="font-['Helvetica_Light:Regular'] relative shrink-0 w-full" data-node-id="299:202">
          Turning user needs into meaningful design decisions.
        </p>
      </div>
      <div className="-translate-x-1/2 [word-break:break-word] absolute content-stretch flex flex-col gap-[9px] items-center leading-[normal] left-[calc(37.5%-10.25px)] not-italic text-[30px] text-black top-[3662px]" data-node-id="299:203">
        <p className="font-['Helvetica_Neue:Bold'] min-w-full relative shrink-0 w-[min-content]" data-node-id="299:204">
          Pain Points to Better Rides
        </p>
        <p className="font-['Helvetica_Light:Regular'] relative shrink-0 w-[1176px]" data-node-id="299:205">
          Understanding commuters’ challenges and turning them into design solutions that make every ride simpler, safer, and more convenient for both passengers and drivers.
        </p>
      </div>
      <div className="[word-break:break-word] absolute content-stretch flex flex-col gap-[15px] items-center leading-[normal] left-[calc(33.33%+180px)] not-italic text-black top-[1018px] w-[321px]" data-node-id="299:206">
        <p className="font-['Helvetica_Neue:Bold'] relative shrink-0 text-[35px] text-center w-full" data-node-id="299:207">
          Duration
        </p>
        <p className="font-['Helvetica_Light:Regular'] relative shrink-0 text-[30px] w-full" data-node-id="299:208">
          August 3 - September 7
        </p>
      </div>
      <div className="[word-break:break-word] absolute content-stretch flex flex-col gap-[15px] items-center leading-[normal] left-[calc(75%+9.5px)] not-italic text-black top-[1018px] w-[278px]" data-node-id="299:209">
        <p className="font-['Helvetica_Neue:Bold'] min-w-full relative shrink-0 text-[35px] text-center w-[min-content]" data-node-id="299:210">
          Project Type
        </p>
        <p className="font-['Helvetica_Light:Regular'] relative shrink-0 text-[30px] whitespace-nowrap" data-node-id="299:211">
          Internship
        </p>
      </div>
      <div className="absolute left-0 top-[914px] h-[253px] w-[1920px]" data-node-id="loop-project-details-row" aria-hidden="true">
        <div className="absolute left-[685px] top-0 h-full w-px bg-[#999]" />
        <div className="absolute left-[1287px] top-0 h-full w-px bg-[#999]" />
        <div className="absolute left-0 top-[252px] h-px w-full bg-[#999]" />
      </div>
      <div className="[word-break:break-word] absolute flex flex-col items-center gap-[15px] left-[162px] top-[1018px] w-[360px] text-center text-black" data-node-id="loop-main-role">
        <p className="font-['Helvetica_Neue:Bold'] text-[35px]">Main Role</p>
        <p className="font-['Helvetica_Light:Regular'] text-[30px]">UI/UX Designer</p>
      </div>
      <div className="absolute h-[48px] left-[calc(41.67%+40.83px)] top-[1158px] w-[278px]" data-node-id="299:212" />
      <div className="absolute bg-white border border-[#888] border-solid h-[374px] left-[98px] rounded-[50px] top-[1228px] w-[1680px]" data-node-id="299:213">
        <div className="absolute content-stretch flex items-center justify-between left-[69px] top-[78px] w-[1539px]" data-node-id="299:214">
          <div className="[word-break:break-word] content-stretch flex flex-col items-start leading-[normal] not-italic relative shrink-0 text-black w-[1020px]" data-node-id="299:215">
            <p className="font-['Helvetica_Neue:Bold'] relative shrink-0 text-[50px] w-full" data-node-id="299:216">
              About
            </p>
            <p className="font-['Helvetica_Light:Regular'] relative shrink-0 text-[30px] w-full" data-node-id="299:217">
              Loop is a motorcycle ride-hailing app concept focused on making everyday commutes easier. The project explores how passengers can book rides, check fares, track their drivers, and access safety features through a simple and easy-to-use interface.
            </p>
          </div>
          <div className="h-[150px] relative shrink-0 w-[453px]" data-node-id="299:218" data-name="Logo Animation Components 1">
            <img loading="lazy" alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgLogoAnimationComponents1} />
          </div>
        </div>
      </div>
      <div className="absolute h-[771px] left-0 top-[1695px] w-[1920px]" data-node-id="299:219" data-name="image 93">
        <div aria-hidden className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 overflow-hidden">
            <img loading="lazy" alt="" className="absolute h-[163.86%] left-0 max-w-none top-[-45.68%] w-full" src={imgImage93} />
          </div>
          <div className="absolute bg-[rgba(0,0,0,0.5)] inset-0" />
        </div>
      </div>
      <div className="-translate-x-1/2 [word-break:break-word] absolute content-stretch flex flex-col gap-[10px] items-start leading-[normal] left-1/2 not-italic text-[#e8e8e8] text-[30px] text-center top-[1985px] w-[1020px]" data-node-id="299:220">
        <p className="font-['Helvetica_Neue:Bold'] relative shrink-0 w-full" data-node-id="299:221">
          Problem Statement
        </p>
        <p className="font-['HelveticaNeue:Light'] relative shrink-0 w-full" data-node-id="299:222">
          Passengers need a more convenient way to book motorcycle rides, understand fares before confirming, track their drivers, and access safety features. Loop aims to address these needs through a simple interface that makes the ride-booking process easier to navigate.
        </p>
      </div>
      <div className="loop-study-research-ring absolute left-0 top-[2700px] h-[800px] w-[1920px]">
        <p className="-translate-x-1/2 [word-break:break-word] absolute font-['Helvetica_Neue:Bold'] leading-[normal] left-[calc(50%+3px)] not-italic text-[25px] text-black text-center top-[384px] whitespace-nowrap" data-node-id="299:223">
          Research Flow
        </p>
        <p className="-translate-x-1/2 [word-break:break-word] absolute font-['HelveticaNeue:Light'] leading-[normal] left-[calc(50%+2.5px)] not-italic text-[25px] text-black text-center top-[-10px] whitespace-nowrap" data-node-id="299:224">
          01. User Research
        </p>
        <p className="-translate-x-1/2 [word-break:break-word] absolute font-['HelveticaNeue:Light'] leading-[normal] left-[calc(66.67%+184.33px)] not-italic text-[25px] text-black text-center top-[384px] whitespace-nowrap" data-node-id="299:225">
          02. User Pain Points
        </p>
        <p className="-translate-x-1/2 [word-break:break-word] absolute font-['HelveticaNeue:Light'] leading-[normal] left-[calc(50%+3.5px)] not-italic text-[25px] text-black text-center top-[775px] whitespace-nowrap" data-node-id="299:226">
          03. Competitor Analysis
        </p>
        <p className="-translate-x-1/2 [word-break:break-word] absolute font-['HelveticaNeue:Light'] leading-[normal] left-[calc(16.67%+153.33px)] not-italic text-[25px] text-black text-center top-[386px] whitespace-nowrap" data-node-id="299:227">
          04. Key Insights
        </p>
        <div className="-translate-x-1/2 absolute left-[calc(50%+3px)] size-[650px] top-[76px]" data-node-id="299:228">
          <img loading="lazy" alt="" className="absolute block inset-0 max-w-none size-full" height="650" src={imgEllipse785} width="650" />
        </div>
        <div className="-translate-x-1/2 absolute left-[calc(50%+3px)] size-[40px] top-[56px]" data-node-id="299:229">
          <img loading="lazy" alt="" className="absolute block inset-0 max-w-none size-full" src={imgEllipse786} />
        </div>
        <div className="-translate-x-1/2 absolute left-[calc(66.67%+8px)] size-[40px] top-[381px]" data-node-id="299:230">
          <img loading="lazy" alt="" className="absolute block inset-0 max-w-none size-full" src={imgEllipse786} />
        </div>
        <div className="-translate-x-1/2 absolute left-[calc(50%+3px)] size-[40px] top-[706px]" data-node-id="299:231">
          <img loading="lazy" alt="" className="absolute block inset-0 max-w-none size-full" src={imgEllipse786} />
        </div>
        <div className="-translate-x-1/2 absolute left-[calc(29.17%+78px)] size-[40px] top-[381px]" data-node-id="299:232">
          <img loading="lazy" alt="" className="absolute block inset-0 max-w-none size-full" src={imgEllipse786} />
        </div>
      </div>
      <div className="absolute h-[915px] left-[calc(50%+24px)] rounded-[10px] shadow-[0px_8px_4px_0px_rgba(0,0,0,0.25)] top-[3825px] w-[814px]" data-node-id="299:233" data-name="Hand and iPhone 16 Pro">
        <div aria-hidden className="absolute inset-0 pointer-events-none rounded-[10px]">
          <img loading="lazy" alt="" className="absolute max-w-none object-cover rounded-[10px] size-full" src={imgHandAndIPhone16Pro} />
          <div className="absolute bg-[rgba(0,0,0,0.45)] inset-0 rounded-[10px]" />
        </div>
      </div>
      <div className="absolute border border-[#c6c3c3] border-solid h-[915px] left-[103px] rounded-[10px] shadow-[0px_8px_4px_0px_rgba(0,0,0,0.25)] top-[3825px] w-[830px]" data-node-id="299:234" data-name="Frame 427322087 1">
        <img loading="lazy" alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none rounded-[10px] size-full" src={imgFrame4273220871} />
      </div>
      <div className="absolute left-[calc(41.67%+118.83px)] size-[100px] top-[4233px]" data-node-id="299:235">
        <img loading="lazy" alt="" className="absolute block inset-0 max-w-none size-full" src={imgEllipse790} />
      </div>
      <div className="absolute left-[calc(41.67%+137.83px)] size-[61px] top-[4252px]" data-node-id="299:236" data-name="akar-icons:arrow-forward-thick">
        <svg aria-hidden="true" className="loop-study-arrow-icon" viewBox="0 0 24 24" fill="none">
          <path d="M5 12h13m-6-6 6 6-6 6" />
        </svg>
      </div>
      <div className="-translate-x-1/2 absolute content-stretch flex gap-[63px] items-center left-[calc(54.17%-54.42px)] top-[5835px] w-[1627px]" data-node-id="299:238">
        <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid leading-[0] place-items-start relative shrink-0" data-node-id="299:239">
          <div className="col-1 h-[214.776px] ml-0 mt-[75.22px] relative rounded-[10px] row-1 w-[175px]" data-node-id="299:240" data-name="image 91">
            <div aria-hidden className="absolute inset-0 pointer-events-none rounded-[10px]">
              <img loading="lazy" alt="" className="absolute max-w-none object-cover rounded-[10px] size-full" src={imgImage91} />
              <div className="absolute bg-[rgba(0,0,0,0.5)] inset-0 rounded-[10px]" />
            </div>
          </div>
          <div className="col-1 h-[258.96px] ml-[216.51px] mt-[229.64px] relative rounded-[10px] row-1 shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] w-[200.486px]" data-node-id="299:241">
            <div aria-hidden className="absolute inset-0 pointer-events-none rounded-[10px]">
              <div className="absolute bg-[#f5f5f5] inset-0 rounded-[10px]" />
              <img loading="lazy" alt="" className="absolute max-w-none object-cover rounded-[10px] size-full" src={imgRectangle49} />
              <div className="absolute inset-0 overflow-hidden rounded-[10px]">
                <img loading="lazy" alt="" className="absolute h-[167.5%] left-0 max-w-none top-[-33.69%] w-full" src={imgRectangle49} />
              </div>
              <div className="absolute bg-[rgba(0,0,0,0.2)] inset-0 rounded-[10px]" />
            </div>
          </div>
          <div className="col-1 h-[205.438px] ml-[220px] mt-0 relative rounded-[10px] row-1 w-[115px]" data-node-id="299:242">
            <div aria-hidden className="absolute inset-0 pointer-events-none rounded-[10px]">
              <img loading="lazy" alt="" className="absolute max-w-none object-cover rounded-[10px] size-full" src={imgRectangle47} />
              <div className="absolute bg-[rgba(0,0,0,0.5)] inset-0 rounded-[10px]" />
            </div>
          </div>
          <div className="col-1 h-[248.414px] ml-[23.6px] mt-[331.59px] relative rounded-[10px] row-1 w-[152.87px]" data-node-id="299:243" data-name="image 90">
            <div aria-hidden className="absolute inset-0 pointer-events-none rounded-[10px]">
              <div className="absolute inset-0 overflow-hidden rounded-[10px]">
                <img loading="lazy" alt="" className="absolute h-full left-[-46.07%] max-w-none top-[0.15%] w-[162.5%]" src={imgImage90} />
              </div>
              <div className="absolute bg-[rgba(0,0,0,0.5)] inset-0 rounded-[10px]" />
            </div>
          </div>
        </div>
        <div className="[word-break:break-word] content-stretch flex flex-col gap-[10px] h-[162px] items-start leading-[normal] not-italic relative shrink-0 text-[30px] text-black text-center w-[1101px]" data-node-id="299:244">
          <p className="font-['Helvetica_Neue:Bold'] relative shrink-0 w-full" data-node-id="299:245">
            Solution Opportunity
          </p>
          <p className="font-['HelveticaNeue:Light'] relative shrink-0 w-full" data-node-id="299:246">{`Loop brings the essential parts of a motorcycle ride into one simple interface. Passengers can check fares before booking, follow their driver's location, and access safety features when needed, making each step of the ride easier to manage.`}</p>
        </div>
      </div>
      <div className="loop-study-introducing-content">
      <div className="-translate-x-1/2 absolute contents left-1/2 top-[6545px]" data-node-id="299:247">
        <div id="loop-identity" className="absolute bg-white border border-[#3f1d56] border-solid h-[450px] left-[121px] rounded-[50px] top-[6570px] w-[1678px]" data-node-id="299:248" />
        <div className="-translate-x-1/2 [word-break:break-word] absolute content-stretch flex flex-col gap-[10px] items-start leading-[normal] left-[calc(37.5%-21.5px)] not-italic text-black top-[6625px] w-[1053px]" data-node-id="299:249">
          <p className="font-['Helvetica_Neue:Bold'] relative shrink-0 text-[30px] w-full" data-node-id="299:250">
            Introducing Loop
          </p>
          <p className="font-['HelveticaNeue:Light'] relative shrink-0 text-[50px] w-full" data-node-id="299:251">
            A motorcycle ride-hailing app that simplifies everyday commuting by making ride booking, fare checking, driver tracking, and safety features easier to access for both passengers and drivers.
          </p>
        </div>
      </div>
      <div className="absolute bg-[#3f1d56] h-[494px] left-[94px] rounded-[50px] top-[7126px] w-[830px]" data-node-id="299:252" />
      <div className="absolute bg-white h-[190px] left-[calc(16.67%+72.33px)] rounded-[50px] top-[7278px] w-[200px]" data-node-id="299:253" />
      <div className="absolute h-[55px] left-[calc(16.67%+93.33px)] top-[7345px] w-[165px]" data-node-id="299:254" data-name="Logo Animation Components 2">
        <img loading="lazy" alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgLogoAnimationComponents1} />
      </div>
      <div className="absolute bg-[#00e676] h-[495px] left-[calc(50%+9px)] overflow-clip rounded-[50px] top-[7125px] w-[828px]" data-node-id="299:255">
        <div className="absolute h-[988px] left-[158px] top-[128px] w-[511px]" data-node-id="299:256" data-name="iPhone 13 Pro">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <img loading="lazy" alt="" className="absolute h-[128.43%] left-[-63.51%] max-w-none top-[-13.75%] w-[331.39%]" src={imgIPhone13Pro} />
          </div>
        </div>
      </div>
      </div>
      <div className="absolute h-[770px] left-[-8px] top-[4972px] w-[1934px]" data-node-id="299:257" data-name="image 99">
        <div aria-hidden className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 overflow-hidden">
            <img loading="lazy" alt="" className="absolute inset-0 h-full w-full max-w-none object-cover" style={{ objectPosition: "50% 30%" }} src={imgImage99} />
          </div>
          <div className="absolute bg-[rgba(0,0,0,0.5)] inset-0" />
        </div>
      </div>
      <div className="absolute content-stretch flex flex-col gap-[31px] items-center left-[164px] top-[5149px] w-[583px]" data-node-id="299:258">
        <div className="overflow-clip relative shrink-0 size-[300px]" data-node-id="299:259" data-name="andrsrxn:users">
          <div className="absolute inset-[7.57%_7.21%_7.58%_7.96%]" data-node-id="299:260" data-name="Group">
            <div className="absolute inset-[-1.23%]">
              <img loading="lazy" alt="" className="block max-w-none size-full" src={imgGroup} />
            </div>
          </div>
        </div>
        <div className="[word-break:break-word] content-stretch flex flex-col gap-[12px] items-center leading-[normal] not-italic relative shrink-0 text-[30px] text-center text-white w-full" data-node-id="299:266">
          <p className="font-['Helvetica_Neue:Bold'] relative shrink-0 w-full" data-node-id="299:267">
            Target Users
          </p>
          <p className="font-['HelveticaNeue:Light'] relative shrink-0 w-full" data-node-id="299:268">
            Everyday commuters and motorcycle drivers.
          </p>
        </div>
      </div>
      <div className="absolute content-stretch flex flex-col gap-[31px] items-center left-[calc(58.33%+74.17px)] top-[5148px] w-[583px]" data-node-id="299:269">
        <div className="overflow-clip relative shrink-0 size-[300px]" data-node-id="299:270" data-name="bi:phone">
          <div className="absolute inset-[0_18.75%]" data-node-id="299:271" data-name="Group">
            <img loading="lazy" alt="" className="absolute block inset-0 max-w-none size-full" src={imgGroup1} />
          </div>
        </div>
        <div className="[word-break:break-word] content-stretch flex flex-col gap-[12px] items-center leading-[normal] not-italic relative shrink-0 text-[30px] text-center text-white w-full" data-node-id="299:274">
          <p className="font-['Helvetica_Neue:Bold'] relative shrink-0 w-full" data-node-id="299:275">
            Approach
          </p>
          <p className="font-['HelveticaNeue:Light'] relative shrink-0 w-full" data-node-id="299:276">
            Simpler booking, clear fares, ride tracking, and accessible safety features.
          </p>
        </div>
      </div>
      <div className="loop-study-later-content">
      <p className="[word-break:break-word] absolute font-['Helvetica:Regular'] leading-[normal] left-[calc(45.83%-71.08px)] not-italic text-[50px] text-black top-[7747px] whitespace-nowrap" data-node-id="299:277">
        Moodboard
      </p>
      <div className="absolute contents left-[85px] top-[7839px]" data-node-id="299:278">
        <div className="absolute h-[440.52px] left-[110px] rounded-[50px] top-[7897.74px] w-[352.416px]" data-node-id="299:279" data-name="image 113">
          <img loading="lazy" alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none rounded-[50px] size-full" src={imgImage113} />
        </div>
        <div className="absolute h-[500.479px] left-[110px] rounded-[50px] top-[8400.39px] w-[667.306px]" data-node-id="299:280" data-name="image 101">
          <img loading="lazy" alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none rounded-[50px] size-full" src={imgImage101} />
        </div>
        <div className="absolute h-[219.189px] left-[calc(16.67%+159.76px)] rounded-[10px] top-[8121.36px] w-[286.947px]" data-node-id="299:281" data-name="image 99">
          <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[10px]">
            <img loading="lazy" alt="" className="absolute h-[163.9%] left-[-0.01%] max-w-none top-[-29.05%] w-[100.03%]" src={imgImage100} />
          </div>
        </div>
        <div className="absolute border border-[#ccc] border-solid h-[196.589px] left-[calc(33.33%+146.08px)] rounded-[10px] top-[8418.12px] w-[228.297px]" data-node-id="299:282" data-name="image 111">
          <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[10px]">
            <img loading="lazy" alt="" className="absolute h-[101.87%] left-[-9.06%] max-w-none top-0 w-[116.96%]" src={imgImage111} />
          </div>
        </div>
        <div className="absolute h-[255.501px] left-[calc(33.33%+144.64px)] rounded-[10px] top-[8647.75px] w-[365.142px]" data-node-id="299:283" data-name="image 106">
          <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[10px]">
            <img loading="lazy" alt="" className="absolute h-full left-[-0.01%] max-w-none top-0 w-[109.64%]" src={imgImage106} />
          </div>
        </div>
        <div className="absolute h-[641.201px] left-[calc(58.33%+47.36px)] rounded-[10px] top-[8264.8px] w-[620.643px]" data-node-id="299:284" data-name="image 54">
          <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[10px]">
            <img loading="lazy" alt="" className="absolute h-[103.92%] left-[-21.98%] max-w-none top-0 w-[143.07%]" src={imgImage54} />
          </div>
        </div>
        <div className="absolute h-[293.514px] left-[calc(50%+50.22px)] top-[8320.16px] w-[146.923px]" data-node-id="299:285" data-name="image 53">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <img loading="lazy" alt="" className="absolute h-full left-[-0.04%] max-w-none top-0 w-[106.64%]" src={imgImage53} />
          </div>
        </div>
        <div className="absolute h-[348.7px] left-[calc(66.67%+43.27px)] rounded-[10px] top-[7867.75px] w-[464.727px]" data-node-id="299:286" data-name="image 3">
          <img loading="lazy" alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none rounded-[10px] size-full" src={imgImage3} />
        </div>
        <div className="absolute h-[367.1px] left-[calc(50%+24.2px)] top-[7864px] w-[342.627px]" data-node-id="299:287" data-name="image 109">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <img loading="lazy" alt="" className="absolute h-[123.2%] left-[-16.29%] max-w-none top-[-13.6%] w-[132%]" src={imgImage109} />
          </div>
        </div>
        <div className="absolute h-[191.055px] left-[calc(16.67%+159.76px)] rounded-[10px] top-[7915.06px] w-[286.583px]" data-node-id="299:288" data-name="image 55">
          <img loading="lazy" alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none rounded-[10px] size-full" src={imgImage55} />
        </div>
        <div className="absolute border border-[#d7d7d7] border-solid h-[421.39px] left-[calc(33.33%+141.64px)] rounded-[10px] top-[7917.53px] w-[194.6px]" data-node-id="299:289" data-name="image 105">
          <img loading="lazy" alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none rounded-[10px] size-full" src={imgImage105} />
        </div>
      </div>
      <img className="loop-study-moodboard-composition" src="/assets/figma/loop-case-study/moodboard-composition.png" alt="Loop moodboard collage" />
      <div className="absolute drop-shadow-[0px_4px_2px_rgba(0,0,0,0.25)] h-[1030px] left-[calc(33.33%+69.67px)] rounded-[50px] top-[8918px] w-[1127px]" data-node-id="299:290" />
      <div className="loop-study-logo-exploration -translate-x-1/2 absolute h-[987px] left-[calc(50%+17.5px)] top-[9825px] w-[1677px]" data-node-id="299:294">
        <div className="[word-break:break-word] absolute content-stretch flex flex-col gap-[19px] items-start leading-[normal] left-0 not-italic right-0 text-black top-0" data-node-id="299:295">
          <p className="font-['Helvetica:Regular'] relative shrink-0 text-[50px] w-full" data-node-id="299:296">
            / Logo Exploration
          </p>
          <p className="font-['HelveticaNeue:Light'] relative shrink-0 text-[30px] w-full" data-node-id="299:297">{`Exploring different visual directions and refining the concepts into a final identity that reflects Loop’s purpose and personality. `}</p>
        </div>
        <div className="absolute h-[821px] left-0 overflow-clip right-0 rounded-[5px] top-[166px]" data-node-id="299:298">
          <div className="absolute h-[486px] left-[-222px] rounded-[50px] top-[465px] w-[537px]" data-node-id="299:299" data-name="image 99">
            <div className="absolute inset-0 opacity-45 overflow-hidden pointer-events-none rounded-[50px]">
              <img loading="lazy" alt="" className="absolute h-[233.22%] left-[-28.72%] max-w-none top-[-61.5%] w-[158.56%]" src={imgImage102} />
            </div>
          </div>
          <div className="absolute h-[370px] left-[-204px] rounded-[50px] top-[-49px] w-[407px]" data-node-id="299:300" data-name="image 102">
            <img loading="lazy" alt="" className="absolute inset-0 max-w-none object-cover opacity-45 pointer-events-none rounded-[50px] size-full" src={imgImage103} />
          </div>
          <div className="absolute h-[481px] left-[261px] rounded-[50px] top-[-70px] w-[431px]" data-node-id="299:301" data-name="image 105">
            <img loading="lazy" alt="" className="absolute inset-0 max-w-none object-cover opacity-45 pointer-events-none rounded-[50px] size-full" src={imgImage107} />
          </div>
          <div className="absolute h-[467px] left-[415px] rounded-[50px] top-[524px] w-[554px]" data-node-id="299:302" data-name="image 104">
            <div className="absolute inset-0 opacity-45 overflow-hidden pointer-events-none rounded-[50px]">
              <img loading="lazy" alt="" className="absolute h-[100.05%] left-0 max-w-none top-[-0.02%] w-[108.85%]" src={imgImage104} />
            </div>
          </div>
          <div className="absolute flex h-[776px] items-center justify-center left-[1508px] top-[241px] w-[403px]" data-node-id="299:303">
            <div className="-rotate-90 flex-none">
              <div className="h-[403px] relative rounded-[50px] w-[776px]" data-name="image 100">
                <img loading="lazy" alt="" className="absolute inset-0 max-w-none object-cover opacity-30 pointer-events-none rounded-[50px] size-full" src={imgImage108} />
              </div>
            </div>
          </div>
          <div className="absolute h-[521px] left-[1062px] rounded-[50px] top-[411px] w-[365px]" data-node-id="299:304" data-name="image 107">
            <img loading="lazy" alt="" className="absolute inset-0 max-w-none object-cover opacity-45 pointer-events-none rounded-[50px] size-full" src={imgImage110} />
          </div>
          <div className="absolute h-[494px] left-[726px] rounded-[50px] top-[-213px] w-[486px]" data-node-id="299:305" data-name="image 106">
            <div className="absolute inset-0 opacity-45 overflow-hidden pointer-events-none rounded-[50px]">
              <img loading="lazy" alt="" className="absolute h-full left-[-16.47%] max-w-none top-0 w-[116.47%]" src={imgImage112} />
            </div>
          </div>
          <div className="absolute h-[322px] left-[1245px] rounded-[50px] top-[-127px] w-[333px]" data-node-id="299:306" data-name="image 103">
            <img loading="lazy" alt="" className="absolute inset-0 max-w-none object-cover opacity-45 pointer-events-none rounded-[50px] size-full" src={imgImage114} />
          </div>
          <div className="absolute h-[268px] left-[502px] top-[281px] w-[807px]" data-node-id="299:307" data-name="Logo Animation Components 3">
            <img loading="lazy" alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgLogoAnimationComponents1} />
          </div>
        </div>
      </div>
      <div id="loop-user-flow" className="-translate-x-1/2 [word-break:break-word] absolute content-stretch flex flex-col gap-[2px] items-center leading-[normal] left-[calc(54.17%-62.92px)] not-italic text-black text-center top-[11316px] w-[1142px]" data-node-id="299:308">
        <p className="font-['Helvetica_Neue:Bold'] relative shrink-0 text-[50px] w-full" data-node-id="299:309">
          User Flow
        </p>
        <p className="font-['HelveticaNeue:Light'] relative shrink-0 text-[30px] w-full" data-node-id="299:310">
          Mapping the steps passengers take to book a ride, from opening the app to completing their journey, to create a smooth and straightforward experience.
        </p>
      </div>
      <div id="loop-app-screens" className="-translate-x-1/2 [word-break:break-word] absolute content-stretch flex flex-col gap-[2px] items-center leading-[normal] left-1/2 not-italic text-black text-center top-[15400px] w-[1142px]" data-node-id="299:311">
        <p className="font-['Helvetica_Neue:Bold'] relative shrink-0 text-[50px] w-full" data-node-id="299:312">
          LOOP SCREENS
        </p>
        <p className="font-['HelveticaNeue:Light'] relative shrink-0 text-[30px] w-full" data-node-id="299:313">
          A look at Loop’s final screens, showing how the app makes booking rides, tracking drivers, and managing trips easier for everyday commuters.
        </p>
      </div>
      <div className="loop-study-ia">
        <img loading="lazy" alt="Loop driver app information architecture" className="absolute left-[97px] top-0 h-[1897px] w-[830px]" src="/assets/figma/loop-case-study/driver-ia.png" />
        <img loading="lazy" alt="Loop passenger app information architecture" className="absolute left-[calc(50%+12px)] top-0 h-[1897px] w-[830px]" src="/assets/figma/loop-case-study/passenger-ia.png" />
      </div>
      <div className="loop-study-screen-marquee" data-node-id="299:419" aria-label="Loop app screens moving behind a centered wooden-hand phone">
        <div className="loop-study-backdrop-track" aria-hidden="true">
          {[0, 1].map((setIndex) => (
            <div className="loop-study-backdrop-set" key={`screens-set-${setIndex}`}>
              {loopScreenMarqueeItems.map((item) => (
                <img key={`${setIndex}-${item.src}`} loading={setIndex === 0 ? 'eager' : 'lazy'} alt="" className="loop-study-backdrop-screen" src={item.src} />
              ))}
            </div>
          ))}
        </div>
        <div className="loop-study-phone-showcase">
          <img loading="eager" alt="A wooden hand holding the Loop app phone" className="loop-study-screen-handheld" src={imgIPhone12ProWoodenHands} />
        </div>
        <div className="loop-study-screen-bottom-rule" aria-hidden="true" />
      </div>
      <div className="loop-study-visual-style">
      <div className="absolute contents left-[calc(75%-12.5px)] top-[9070px]" data-node-id="299:426">
        <div className="absolute bg-black border border-[#b3b3b3] border-solid h-[606px] left-[calc(75%-25px)] overflow-hidden shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] top-[9095px] w-[410px]" data-node-id="299:427">
          <p className="absolute left-[22px] top-[12px] text-[50px] text-white" data-node-id="299:428">
            Pure Black
          </p>
        </div>
        <p className="[word-break:break-word] absolute font-['HelveticaNeue:Light'] leading-[normal] left-[calc(75%-8px)] not-italic text-[50px] text-white top-[9626px] whitespace-nowrap" data-node-id="299:429">
          #000000
        </p>
      </div>
      <div className="absolute contents left-[calc(50%+84px)] top-[9070px]" data-node-id="299:430">
        <div className="[word-break:break-word] absolute bg-white border border-[#b3b3b3] border-solid font-['HelveticaNeue:Light'] h-[606px] leading-[normal] left-[calc(50%+84px)] not-italic overflow-clip shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] text-[50px] text-black top-[9095px] w-[371px] whitespace-nowrap" data-node-id="299:431">
          <p className="absolute left-[19px] top-[532px]" data-node-id="299:432">
            #FFFFFF
          </p>
          <p className="absolute left-[22px] top-[12px]" data-node-id="299:433">
            Pure White
          </p>
        </div>
      </div>
      <div className="[word-break:break-word] absolute content-stretch flex flex-col gap-[23px] h-[606px] items-start leading-[normal] left-[82px] not-italic text-black top-[9070px] w-[691px]" data-node-id="299:434">
        <div className="content-stretch flex flex-col font-['Helvetica:Regular'] gap-px items-start relative shrink-0 w-full" data-node-id="299:435">
          <p className="relative shrink-0 text-[50px] w-full" data-node-id="299:436">
            / Visual Style
          </p>
          <p className="relative shrink-0 text-[25px] w-full" data-node-id="299:437">
            Poppins gives Loop a clean, modern look with rounded letterforms that make the interface feel approachable and easy to use.
          </p>
        </div>
        <div className="content-stretch flex font-['Poppins:Regular'] items-center relative shrink-0 text-[350px] whitespace-nowrap" data-node-id="299:438">
          <p className="relative shrink-0" data-node-id="299:439">
            A
          </p>
          <p className="relative shrink-0" data-node-id="299:440">
            a
          </p>
        </div>
      </div>
      <div className="[word-break:break-word] absolute bg-[#3f1d56] font-['HelveticaNeue:Light'] h-[253px] leading-[normal] left-[82px] not-italic overflow-clip text-[50px] text-white top-[9701px] w-[962px] whitespace-nowrap" data-node-id="299:441">
        <p className="absolute left-[16px] top-[178px]" data-node-id="299:442">
          #3F1D56
        </p>
        <p className="absolute left-[16px] top-[11px]" data-node-id="299:443">
          Deep Plum Purple
        </p>
      </div>
      <div className="[word-break:break-word] absolute bg-[#00e676] font-['HelveticaNeue:Light'] h-[253px] leading-[normal] left-[calc(50%+84px)] not-italic overflow-clip text-[50px] text-white top-[9701px] w-[781px] whitespace-nowrap" data-node-id="299:291">
        <p className="absolute left-[31px] top-[181px]" data-node-id="299:292">
          #00E676
        </p>
        <p className="absolute left-[31px] top-[14px]" data-node-id="299:293">
          Bright Emerald Green
        </p>
      </div>
      <div className="[word-break:break-word] absolute content-stretch flex flex-col font-['Poppins:Regular'] items-start leading-[normal] left-[calc(25%+82.5px)] not-italic text-black top-[9420px] w-[337px]" data-node-id="299:444">
        <p className="relative shrink-0 text-[85px] w-full" data-node-id="299:445">
          Poppins
        </p>
        <p className="relative shrink-0 text-[50px] w-full" data-node-id="299:446">
          Regular
        </p>
      </div>
      </div>
      <div className="absolute h-[35px] left-[167px] top-[11532px] w-[373.239px]" data-node-id="299:447" />
      <div className="loop-study-user-persona absolute content-stretch flex flex-col gap-[55px] items-start left-[102px] top-[10665px] w-[1711px]" data-node-id="299:448">
        <p className="[word-break:break-word] font-['Helvetica:Regular'] leading-[normal] not-italic relative shrink-0 text-[50px] text-black w-full" data-node-id="299:449">
          / User Persona
        </p>
        <div className="content-stretch flex gap-[50px] items-center leading-[0] relative shrink-0 w-full" data-node-id="299:450">
          <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid place-items-start relative shrink-0" data-node-id="299:451">
            <div className="border border-black border-solid col-1 h-[400px] ml-0 mt-[4px] relative rounded-[50px] row-1 w-[547px]" data-node-id="299:452" />
            <div className="bg-[#3f1d56] col-1 h-[120px] ml-0 mt-0 relative rounded-[50px] row-1 w-[547px]" data-node-id="299:453" />
            <div className="col-1 content-stretch flex gap-[12px] items-center ml-[16px] mt-[25px] relative row-1 w-full" data-node-id="299:454">
              <img loading="lazy" alt="Maria Santos" className="h-[68px] w-[68px] shrink-0 rounded-full object-cover" src={imgPersonaMaria} />
              <div className="[word-break:break-word] content-stretch flex flex-col font-['HelveticaNeue:Light'] gap-[7px] items-start leading-[normal] not-italic relative shrink-0 text-white w-[221px]" data-node-id="299:458">
                <p className="relative shrink-0 text-[30px] w-full" data-node-id="299:459">
                  Maria Santos, 22
                </p>
                <p className="relative shrink-0 text-[20px] w-full" data-node-id="299:460">
                  Office Employee
                </p>
              </div>
            </div>
            <div className="col-1 content-stretch flex flex-col items-start ml-[16px] mt-[146px] relative row-1" data-node-id="299:461">
              <div className="[word-break:break-word] font-['HelveticaNeue:Light'] leading-[0] not-italic relative shrink-0 text-[20px] text-black w-[513px] whitespace-pre-wrap" data-node-id="299:462">
                <p className="mb-0">
                  <span className="[word-break:break-word] font-['Helvetica_Neue:Bold'] leading-[normal] not-italic">Motivation:</span>
                  <span className="leading-[normal]">
                    <br aria-hidden />
                    Find the fastest and most convenient way to commute from Quezon City to Makati, especially during heavy traffic.
                  </span>
                </p>
                <p className="leading-[normal] mb-0">​</p>
                <p>
                  <span className="[word-break:break-word] font-['Helvetica_Neue:Bold'] leading-[normal] not-italic">Expectations</span>
                  <span className="leading-[normal]">
                    :<br aria-hidden />
                    Clear fare estimates and travel times, quick ride booking, reliable driver tracking, and convenient e-wallet payment options.
                  </span>
                </p>
              </div>
            </div>
          </div>
          <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid place-items-start relative shrink-0" data-node-id="299:463">
            <div className="border border-black border-solid col-1 h-[400px] ml-0 mt-[4px] relative rounded-[50px] row-1 w-[547px]" data-node-id="299:464" />
            <div className="bg-[#3f1d56] col-1 h-[120px] ml-0 mt-0 relative rounded-[50px] row-1 w-[547px]" data-node-id="299:465" />
            <div className="col-1 content-stretch flex gap-[12px] items-center ml-[16px] mt-[25px] relative row-1 w-full" data-node-id="299:466">
              <img loading="lazy" alt="Alex Reyes" className="h-[68px] w-[68px] shrink-0 rounded-full object-cover" src={imgPersonaAlex} />
              <div className="[word-break:break-word] content-stretch flex flex-col font-['HelveticaNeue:Light'] gap-[7px] items-start leading-[normal] not-italic relative shrink-0 text-white w-[221px]" data-node-id="299:470">
                <p className="relative shrink-0 text-[30px] w-full" data-node-id="299:471">
                  Alex Reyes, 21
                </p>
                <p className="relative shrink-0 text-[20px] w-full" data-node-id="299:472">
                  College Student
                </p>
              </div>
            </div>
            <div className="col-1 content-stretch flex flex-col items-start ml-[17px] mt-[146px] relative row-1" data-node-id="299:473">
              <div className="[word-break:break-word] font-['Helvetica_Neue:Bold'] leading-[0] not-italic relative shrink-0 text-[20px] text-black w-[513px] whitespace-pre-wrap" data-node-id="299:474">
                <p className="mb-0">
                  <span className="leading-[normal]">
                    Motivation
                    <br aria-hidden />
                  </span>
                  <span className="[word-break:break-word] font-['HelveticaNeue:Light'] leading-[normal] not-italic">Find affordable and reliable rides to get to school on time while avoiding crowded public transportation.</span>
                </p>
                <p className="leading-[normal] mb-0">​</p>
                <p>
                  <span className="leading-[normal]">
                    Expectations:
                    <br aria-hidden />
                  </span>
                  <span className="[word-break:break-word] font-['HelveticaNeue:Light'] leading-[normal] not-italic">Affordable fares, clear price estimates, quick booking, easy-to-find pickup locations, safe rides, and convenient payment options.</span>
                </p>
              </div>
            </div>
          </div>
          <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid place-items-start relative shrink-0" data-node-id="299:475">
            <div className="border border-black border-solid col-1 h-[400px] ml-0 mt-[4px] relative rounded-[50px] row-1 w-[547px]" data-node-id="299:476" />
            <div className="bg-[#3f1d56] col-1 h-[120px] ml-0 mt-0 relative rounded-[50px] row-1 w-[547px]" data-node-id="299:477" />
            <div className="col-1 content-stretch flex gap-[12px] items-center ml-[16px] mt-[25px] relative row-1 w-full" data-node-id="299:478">
              <img loading="lazy" alt="Carlo Mendoza" className="h-[68px] w-[68px] shrink-0 rounded-full object-cover" src={imgPersonaCarlo} />
              <div className="[word-break:break-word] content-stretch flex flex-col font-['HelveticaNeue:Light'] gap-[7px] items-start leading-[normal] not-italic relative shrink-0 text-white whitespace-nowrap" data-node-id="299:483">
                <p className="relative shrink-0 text-[30px]" data-node-id="299:484">
                  Carlo Mendoza, 32
                </p>
                <p className="relative shrink-0 text-[20px]" data-node-id="299:485">
                  Motorcycle Ride-Hailing Driver
                </p>
              </div>
            </div>
            <div className="col-1 content-stretch flex flex-col items-start ml-[18px] mt-[146px] relative row-1" data-node-id="299:486">
              <div className="[word-break:break-word] font-['HelveticaNeue:Light'] leading-[0] not-italic relative shrink-0 text-[20px] text-black w-[513px] whitespace-pre-wrap" data-node-id="299:487">
                <p className="mb-0">
                  <span className="[word-break:break-word] font-['Helvetica_Neue:Bold'] leading-[normal] not-italic">Motivation:</span>
                  <span className="leading-[normal]">
                    <br aria-hidden />
                    Complete more rides efficiently, maintain a steady income, and spend less time dealing with booking and navigation issues.
                  </span>
                </p>
                <p className="leading-[normal] mb-0">​</p>
                <p>
                  <span className="[word-break:break-word] font-['Helvetica_Neue:Bold'] leading-[normal] not-italic">Expectations</span>
                  <span className="leading-[normal]">
                    :<br aria-hidden />
                    Consistent booking requests, clear passenger and pickup details, reliable GPS navigation, easy earnings tracking, and a simple interface for managing trips.
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="absolute bg-[#00e676] h-[680px] left-[calc(50%-724px)] rounded-[44px] top-[16665px] w-[700px]" data-node-id="299:488" />
      <div className="absolute bg-[#3f1d56] h-[680px] left-[calc(50%+24px)] rounded-[44px] top-[16665px] w-[700px]" data-node-id="299:489" />
      <div className="absolute h-[512px] left-[calc(50%+259.5px)] top-[16749px] w-[247px]" data-node-id="299:490" data-name="Redmi Note 11 Pro">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <video aria-label="Loop app video" autoPlay muted loop playsInline preload="metadata" className="absolute inset-0 h-full w-full object-contain" src="/assets/figma/Loop_Video_transparent.webm" />
        </div>
      </div>
      <div className="loop-study-benefit-words" data-node-id="299:491" aria-label="Loop is convenient, reliable, safe, accessible, and efficient">
        {['Convenient', 'Reliable', 'Safe', 'Accessible', 'Efficient'].map((word, index) => (
          <span key={word} aria-hidden="true" style={{ animationDelay: `${index * -2.4}s` }}>{word}</span>
        ))}
      </div>
      <div className="loop-study-booking-screens absolute content-stretch flex gap-[28px] items-center left-[calc(16.67%+282px)] top-[17395px]" data-node-id="299:492">
        <div className="h-[808px] relative shrink-0 w-[400px]" data-node-id="299:493" data-name="Iphone 26">
          <img loading="lazy" alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgIphone26} />
        </div>
        <div className="content-stretch flex flex-col gap-[52px] items-start relative shrink-0 w-[400px]" data-node-id="299:494">
          <div className="aspect-[421/850] relative shrink-0 w-full" data-node-id="299:495" data-name="Iphone 28">
            <img loading="lazy" alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgIphone28} />
          </div>
          <div className="aspect-[421/850] relative shrink-0 w-full" data-node-id="299:496" data-name="Iphone 27">
            <img loading="lazy" alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgIphone27} />
          </div>
        </div>
        <div className="content-stretch flex flex-col gap-[88px] items-center relative top-[43px] shrink-0 w-[400px]" data-node-id="299:497">
          <div className="aspect-[421/850] relative shrink-0 w-full" data-node-id="299:498" data-name="Iphone 14">
            <img loading="lazy" alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgIphone14} />
          </div>
          <div className="h-[808px] relative shrink-0 w-[400px]" data-node-id="299:499" data-name="Iphone 15">
            <img loading="lazy" alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgIphone15} />
          </div>
          <div className="h-[808px] relative shrink-0 w-[400px]" data-node-id="299:500" data-name="Iphone 21">
            <img loading="lazy" alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgIphone21} />
          </div>
        </div>
      </div>
      <div className="loop-study-booking-flow-screens absolute content-stretch flex gap-[54px] items-center left-[41px] top-[18499px]" data-node-id="299:501">
        <div className="content-stretch flex flex-col gap-[64px] items-start relative shrink-0 w-[400px]" data-node-id="299:502">
          <div className="aspect-[421/850] relative shrink-0 w-full" data-node-id="299:503" data-name="Iphone 25">
            <img loading="lazy" alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgIphone25} />
          </div>
          <div className="aspect-[421/850] relative shrink-0 w-full" data-node-id="299:504" data-name="Iphone 17">
            <img loading="lazy" alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgIphone17} />
          </div>
          <div className="aspect-[421/850] relative shrink-0 w-full" data-node-id="299:506" data-name="Iphone 16">
            <img loading="lazy" alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgIphoneTripBegun} />
          </div>
        </div>
        <div className="content-stretch flex flex-col gap-[52px] items-start relative shrink-0 w-[400px]" data-node-id="299:507">
          <div className="aspect-[421/850] relative shrink-0 w-full" data-node-id="299:508" data-name="Iphone 22">
            <img loading="lazy" alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgIphone22} />
          </div>
          <div className="content-stretch flex items-center relative shrink-0 w-full" data-node-id="299:509">
            <div className="h-[808px] relative shrink-0 w-[400px]" data-node-id="299:510" data-name="Iphone 23">
              <img loading="lazy" alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgIphone23} />
            </div>
          </div>
        </div>
        <div className="h-[808px] relative shrink-0 w-[400px]" data-node-id="299:511" data-name="Iphone 24 1">
          <img loading="lazy" alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgIphone241} />
        </div>
      </div>
      <div className="absolute content-stretch flex gap-[18px] items-end left-[calc(8.33%+135.17px)] top-[17480px] w-[563px]" data-node-id="299:512">
        <div className="flex h-[167px] items-center justify-center relative shrink-0 w-0" data-node-id="299:513">
          <div className="flex-none rotate-90">
            <div className="h-0 relative w-[167px]">
              <div className="absolute inset-[-10px_0_0_0]">
                <img loading="lazy" alt="" className="block max-w-none size-full" src={imgLine63} />
              </div>
            </div>
          </div>
        </div>
        <div className="[word-break:break-word] content-stretch flex flex-col gap-[15px] items-start leading-[normal] not-italic relative shrink-0 text-black w-[608px]" data-node-id="299:514">
          <p className="font-['Helvetica:Bold'] relative shrink-0 text-[50px] w-full" data-node-id="299:515">
            Booking Page
          </p>
          <p className="font-['HelveticaNeue:Light'] relative shrink-0 text-[30px] w-full" data-node-id="299:516">
            Find your next ride with ease.
            <br aria-hidden />
            Set your pickup and destination, compare fares, and book a ride that fits your needs.
          </p>
        </div>
      </div>
      <p className="-translate-x-1/2 [word-break:break-word] absolute font-['HelveticaNeue:Light'] leading-[normal] left-[957.5px] not-italic text-[50px] text-black text-center top-[20500px] w-[1643px]" data-node-id="299:517">
        “Ride booking, driver tracking, and trip details come together in one experience. A simple, consistent interface keeps every step of your commute easy to follow.”
      </p>
      <div className="absolute h-[777px] left-[-15px] top-[20850px] w-[1945px]" data-node-id="299:518" data-name="image 121">
        <div aria-hidden className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 overflow-hidden">
            <img loading="lazy" alt="" className="absolute h-[166.95%] left-0 max-w-none top-[-42.27%] w-full" src={imgImage121} />
          </div>
          <div className="absolute bg-[rgba(0,0,0,0.5)] inset-0" />
        </div>
      </div>
      <div className="absolute h-[1004px] left-[107px] top-[21095px] w-[776px]" data-node-id="299:519" data-name="iPhone 16">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <img loading="lazy" alt="" className="absolute h-[123.57%] left-[-51.83%] max-w-none top-[-13.51%] w-[213.11%]" src={imgIPhone16} />
        </div>
      </div>
      <div className="[word-break:break-word] absolute font-['HelveticaNeue:Light'] leading-[0] left-[calc(41.67%+3.83px)] not-italic text-[0px] text-white top-[21099px] w-[894px] whitespace-pre-wrap" data-node-id="299:520">
        <p className="font-['HelveticaNeue:Light'] leading-[normal] mb-0 text-[50px]">THANKS FOR TAKING THE RIDE!</p>
        <p className="leading-[normal] mb-0 text-[50px]">​</p>
        <p className="font-['HelveticaNeue:Light'] leading-[normal] mb-0 text-[30px]">
          Thanks for taking the time to explore LOOP.
          <br aria-hidden />
          Hope you enjoyed seeing how the experience came together!
        </p>
        <p className="leading-[normal] mb-0 text-[30px]">​</p>
        <p className="font-['HelveticaNeue:Light'] leading-[normal] mb-0 text-[30px]">UI/UX DESIGN · USER RESEARCH · COMPETITIVE ANALYSIS · USER FLOWS · BRANDING</p>
        <p className="font-['HelveticaNeue:Light'] leading-[normal] text-[30px]">Developed during my UI/UX Design Internship at Lamina Studios.</p>
      </div>
      <div className="absolute left-[calc(41.67%+3.83px)] top-[21460px] z-10">
        <button type="button" onClick={goBack} className="loop-study-footer-return">Back to portfolio <ArrowUpRight aria-hidden="true" size={18} /></button>
      </div>
      <div className="loop-study-sitemap -translate-x-1/2 absolute h-[1145px] left-1/2 overflow-clip top-[11585px] w-[1738px]" data-node-id="299:521" data-name="Loop Passenger Site Map">
        <div className="absolute h-0 left-[calc(16.67%-90.67px)] top-[347px] w-[1408px]" data-node-id="299:522">
          <div className="absolute inset-[-1px_0_0_0]">
            <img loading="lazy" alt="" className="block max-w-none size-full" src={imgLine1} />
          </div>
        </div>
        <div className="-translate-x-1/2 absolute bg-white border border-[#16a34a] border-solid content-stretch flex items-center left-[calc(50%+40px)] overflow-clip px-[24px] py-[12px] top-[155px]" data-node-id="299:523" data-name="Node / Default">
          <p className="[word-break:break-word] font-['Roboto:Medium'] font-medium leading-[normal] relative shrink-0 text-[#16a34a] text-[12px] text-center whitespace-nowrap" data-node-id="I299:523;259:3051" style={{ fontVariationSettings: '"wdth" 100' }}>
            Home
          </p>
        </div>
        <div className="-translate-x-1/2 absolute bg-white border border-[#16a34a] border-solid content-stretch flex items-center left-[calc(50%+40.5px)] overflow-clip px-[24px] py-[12px] top-[254px]" data-node-id="299:524" data-name="Node / Default">
          <p className="[word-break:break-word] font-['Roboto:Medium'] font-medium leading-[normal] relative shrink-0 text-[#16a34a] text-[12px] text-center whitespace-nowrap" data-node-id="I299:524;259:3051" style={{ fontVariationSettings: '"wdth" 100' }}>
            Splash Screen
          </p>
        </div>
        <div className="-translate-x-1/2 absolute bg-white border border-[#ffae33] border-solid content-stretch flex items-center left-[calc(16.67%-90.67px)] overflow-clip px-[24px] py-[12px] top-[406px]" data-node-id="299:525" data-name="Node / Default">
          <p className="[word-break:break-word] font-['Roboto:Medium'] font-medium leading-[normal] relative shrink-0 text-[#ffae33] text-[12px] text-center whitespace-nowrap" data-node-id="I299:525;259:3051" style={{ fontVariationSettings: '"wdth" 100' }}>
            Ride Management
          </p>
        </div>
        <div className="absolute bg-white border border-[#16a34a] border-solid content-stretch flex items-center left-[calc(33.33%+38.17px)] overflow-clip px-[24px] py-[12px] top-[512px]" data-node-id="299:526" data-name="Node / Default">
          <p className="[word-break:break-word] font-['Roboto:Medium'] font-medium leading-[normal] relative shrink-0 text-[#16a34a] text-[12px] text-center whitespace-nowrap" data-node-id="I299:526;259:3051" style={{ fontVariationSettings: '"wdth" 100' }}>
            Rewards
          </p>
        </div>
        <div className="absolute bg-white border border-[#16a34a] border-solid content-stretch flex items-center left-[calc(33.33%+27.67px)] overflow-clip px-[24px] py-[12px] top-[579px] w-[116px]" data-node-id="299:527" data-name="Node / Default">
          <p className="[word-break:break-word] font-['Roboto:Medium'] font-medium leading-[normal] relative shrink-0 text-[#16a34a] text-[12px] text-center whitespace-nowrap" data-node-id="I299:527;259:3051" style={{ fontVariationSettings: '"wdth" 100' }}>
            Promotions
          </p>
        </div>
        <div className="absolute bg-white border border-[#16a34a] border-solid content-stretch flex items-center left-[calc(33.33%+27.67px)] overflow-clip px-[24px] py-[12px] top-[646px] w-[116px]" data-node-id="299:528" data-name="Node / Default">
          <p className="[word-break:break-word] font-['Roboto:Medium'] font-medium leading-[normal] relative shrink-0 text-[#16a34a] text-[12px] text-center whitespace-nowrap" data-node-id="I299:528;259:3051" style={{ fontVariationSettings: '"wdth" 100' }}>
            Subscription
          </p>
        </div>
        <div className="absolute bg-white border border-[#16a34a] border-solid content-stretch flex items-center left-[calc(22.22%+53.78px)] overflow-clip px-[24px] py-[12px] top-[509px]" data-node-id="299:529" data-name="Node / Default">
          <p className="[word-break:break-word] font-['Roboto:Medium'] font-medium leading-[normal] relative shrink-0 text-[#16a34a] text-[12px] text-center whitespace-nowrap" data-node-id="I299:529;259:3051" style={{ fontVariationSettings: '"wdth" 100' }}>
            Wallet
          </p>
        </div>
        <div className="absolute bg-white border border-[#16a34a] border-solid content-stretch flex items-center left-[calc(22.22%+49.28px)] overflow-clip px-[24px] py-[12px] top-[575px]" data-node-id="299:530" data-name="Node / Default">
          <p className="[word-break:break-word] font-['Roboto:Medium'] font-medium leading-[normal] relative shrink-0 text-[#16a34a] text-[12px] text-center whitespace-nowrap" data-node-id="I299:530;259:3051" style={{ fontVariationSettings: '"wdth" 100' }}>
            Balance
          </p>
        </div>
        <div className="absolute bg-white border border-[#16a34a] border-solid content-stretch flex items-center left-[calc(22.22%+21.78px)] overflow-clip px-[24px] py-[12px] top-[641px] w-[146px]" data-node-id="299:531" data-name="Node / Default">
          <p className="[word-break:break-word] font-['Roboto:Medium'] font-medium leading-[normal] relative shrink-0 text-[#16a34a] text-[12px] text-center whitespace-nowrap" data-node-id="I299:531;259:3051" style={{ fontVariationSettings: '"wdth" 100' }}>
            Payment Methods
          </p>
        </div>
        <div className="absolute bg-white border border-[#16a34a] border-solid content-stretch flex items-center left-[calc(22.22%+35.78px)] overflow-clip px-[24px] py-[12px] top-[707px]" data-node-id="299:532" data-name="Node / Default">
          <p className="[word-break:break-word] font-['Roboto:Medium'] font-medium leading-[normal] relative shrink-0 text-[#16a34a] text-[12px] text-center whitespace-nowrap" data-node-id="I299:532;259:3051" style={{ fontVariationSettings: '"wdth" 100' }}>
            Transactions
          </p>
        </div>
        <div className="absolute bg-white border border-[#16a34a] border-solid content-stretch flex items-center left-[calc(11.11%+56.89px)] overflow-clip px-[24px] py-[12px] top-[521px]" data-node-id="299:533" data-name="Node / Default">
          <p className="[word-break:break-word] font-['Roboto:Medium'] font-medium leading-[normal] relative shrink-0 text-[#16a34a] text-[12px] text-center whitespace-nowrap" data-node-id="I299:533;259:3051" style={{ fontVariationSettings: '"wdth" 100' }}>
            Ride History
          </p>
        </div>
        <div className="absolute bg-white border border-[#16a34a] border-solid content-stretch flex items-center left-[calc(11.11%+49.89px)] overflow-clip px-[24px] py-[12px] top-[588px] w-[128px]" data-node-id="299:534" data-name="Node / Default">
          <p className="[word-break:break-word] font-['Roboto:Medium'] font-medium leading-[normal] relative shrink-0 text-[#16a34a] text-[12px] text-center whitespace-nowrap" data-node-id="I299:534;259:3051" style={{ fontVariationSettings: '"wdth" 100' }}>
            Previous Rides
          </p>
        </div>
        <div className="absolute bg-white border border-[#16a34a] border-solid content-stretch flex items-center left-[calc(11.11%+57.89px)] overflow-clip px-[24px] py-[12px] top-[655px]" data-node-id="299:535" data-name="Node / Default">
          <p className="[word-break:break-word] font-['Roboto:Medium'] font-medium leading-[normal] relative shrink-0 text-[#16a34a] text-[12px] text-center whitespace-nowrap" data-node-id="I299:535;259:3051" style={{ fontVariationSettings: '"wdth" 100' }}>
            Ride Details
          </p>
        </div>
        <div className="absolute bg-white border border-[#16a34a] border-solid content-stretch flex items-center left-[calc(11.11%+69.39px)] overflow-clip px-[24px] py-[12px] top-[722px]" data-node-id="299:536" data-name="Node / Default">
          <p className="[word-break:break-word] font-['Roboto:Medium'] font-medium leading-[normal] relative shrink-0 text-[#16a34a] text-[12px] text-center whitespace-nowrap" data-node-id="I299:536;259:3051" style={{ fontVariationSettings: '"wdth" 100' }}>
            Receipt
          </p>
        </div>
        <div className="absolute bg-white border border-[#16a34a] border-solid content-stretch flex items-center left-[71px] overflow-clip px-[24px] py-[12px] top-[520px]" data-node-id="299:537" data-name="Node / Default">
          <p className="[word-break:break-word] font-['Roboto:Medium'] font-medium leading-[normal] relative shrink-0 text-[#16a34a] text-[12px] text-center whitespace-nowrap" data-node-id="I299:537;259:3051" style={{ fontVariationSettings: '"wdth" 100' }}>
            Book Ride
          </p>
        </div>
        <div className="absolute bg-white border border-[#16a34a] border-solid content-stretch flex items-center left-[67.5px] overflow-clip px-[24px] py-[12px] top-[588px]" data-node-id="299:538" data-name="Node / Default">
          <p className="[word-break:break-word] font-['Roboto:Medium'] font-medium leading-[normal] relative shrink-0 text-[#16a34a] text-[12px] text-center whitespace-nowrap" data-node-id="I299:538;259:3051" style={{ fontVariationSettings: '"wdth" 100' }}>
            Destination
          </p>
        </div>
        <div className="absolute bg-white border border-[#16a34a] border-solid content-stretch flex items-center left-[56.5px] overflow-clip px-[24px] py-[12px] top-[656px]" data-node-id="299:539" data-name="Node / Default">
          <p className="[word-break:break-word] font-['Roboto:Medium'] font-medium leading-[normal] relative shrink-0 text-[#16a34a] text-[12px] text-center whitespace-nowrap" data-node-id="I299:539;259:3051" style={{ fontVariationSettings: '"wdth" 100' }}>
            Fare Estimation
          </p>
        </div>
        <div className="absolute bg-white border border-[#16a34a] border-solid content-stretch flex items-center left-[50px] overflow-clip px-[24px] py-[12px] top-[724px] w-[145px]" data-node-id="299:540" data-name="Node / Default">
          <p className="[word-break:break-word] font-['Roboto:Medium'] font-medium leading-[normal] relative shrink-0 text-[#16a34a] text-[12px] text-center whitespace-nowrap" data-node-id="I299:540;259:3051" style={{ fontVariationSettings: '"wdth" 100' }}>
            Ride Confirmation
          </p>
        </div>
        <div className="absolute bg-white border border-[#16a34a] border-solid content-stretch flex items-center left-[55.5px] overflow-clip px-[24px] py-[12px] top-[792px]" data-node-id="299:541" data-name="Node / Default">
          <p className="[word-break:break-word] font-['Roboto:Medium'] font-medium leading-[normal] relative shrink-0 text-[#16a34a] text-[12px] text-center whitespace-nowrap" data-node-id="I299:541;259:3051" style={{ fontVariationSettings: '"wdth" 100' }}>
            Driver Matching
          </p>
        </div>
        <div className="absolute bg-white border border-[#16a34a] border-solid content-stretch flex items-center left-[62.5px] overflow-clip px-[24px] py-[12px] top-[860px]" data-node-id="299:542" data-name="Node / Default">
          <p className="[word-break:break-word] font-['Roboto:Medium'] font-medium leading-[normal] relative shrink-0 text-[#16a34a] text-[12px] text-center whitespace-nowrap" data-node-id="I299:542;259:3051" style={{ fontVariationSettings: '"wdth" 100' }}>
            Driver Details
          </p>
        </div>
        <div className="absolute bg-white border border-[#16a34a] border-solid content-stretch flex items-center left-[62.5px] overflow-clip px-[24px] py-[12px] top-[928px]" data-node-id="299:543" data-name="Node / Default">
          <p className="[word-break:break-word] font-['Roboto:Medium'] font-medium leading-[normal] relative shrink-0 text-[#16a34a] text-[12px] text-center whitespace-nowrap" data-node-id="I299:543;259:3051" style={{ fontVariationSettings: '"wdth" 100' }}>
            Live Tracking
          </p>
        </div>
        <div className="absolute bg-white border border-[#16a34a] border-solid content-stretch flex items-center left-[68px] overflow-clip px-[24px] py-[12px] top-[996px]" data-node-id="299:544" data-name="Node / Default">
          <p className="[word-break:break-word] font-['Roboto:Medium'] font-medium leading-[normal] relative shrink-0 text-[#16a34a] text-[12px] text-center whitespace-nowrap" data-node-id="I299:544;259:3051" style={{ fontVariationSettings: '"wdth" 100' }}>
            Active Ride
          </p>
        </div>
        <div className="absolute bg-white border border-[#16a34a] border-solid content-stretch flex items-center left-[50px] overflow-clip px-[24px] py-[12px] top-[1064px] w-[145px]" data-node-id="299:545" data-name="Node / Default">
          <p className="[word-break:break-word] font-['Roboto:Medium'] font-medium leading-[normal] relative shrink-0 text-[#16a34a] text-[12px] text-center whitespace-nowrap" data-node-id="I299:545;259:3051" style={{ fontVariationSettings: '"wdth" 100' }}>
            Ride Completion
          </p>
        </div>
        <div className="-translate-x-1/2 absolute bg-white border border-[#ffae33] border-solid content-stretch flex items-center left-[calc(33.33%-8.83px)] overflow-clip px-[24px] py-[12px] top-[406px]" data-node-id="299:546" data-name="Node / Default">
          <p className="[word-break:break-word] font-['Roboto:Medium'] font-medium leading-[normal] relative shrink-0 text-[#ffae33] text-[12px] text-center whitespace-nowrap" data-node-id="I299:546;259:3051" style={{ fontVariationSettings: '"wdth" 100' }}>
            Payments / Rewards
          </p>
        </div>
        <div className="-translate-x-1/2 absolute bg-white border border-[#ffae33] border-solid content-stretch flex items-center left-[calc(72.22%-5.22px)] overflow-clip px-[24px] py-[12px] top-[406px]" data-node-id="299:547" data-name="Node / Default">
          <p className="[word-break:break-word] font-['Roboto:Medium'] font-medium leading-[normal] relative shrink-0 text-[#ffae33] text-[12px] text-center whitespace-nowrap" data-node-id="I299:547;259:3051" style={{ fontVariationSettings: '"wdth" 100' }}>
            Communication
          </p>
        </div>
        <div className="-translate-x-1/2 absolute bg-white border border-[#ffae33] border-solid content-stretch flex items-center left-[calc(94.44%-33.94px)] overflow-clip px-[24px] py-[12px] top-[406px]" data-node-id="299:548" data-name="Node / Default">
          <p className="[word-break:break-word] font-['Roboto:Medium'] font-medium leading-[normal] relative shrink-0 text-[#ffae33] text-[12px] text-center whitespace-nowrap" data-node-id="I299:548;259:3051" style={{ fontVariationSettings: '"wdth" 100' }}>
            Account
          </p>
        </div>
        <div className="absolute bg-white border border-[#16a34a] border-solid content-stretch flex h-[38px] items-center left-[calc(66.67%+41.33px)] overflow-clip px-[24px] py-[12px] right-[calc(22.22%+51.78px)] top-[478px]" data-node-id="299:549" data-name="Node / Default">
          <p className="[word-break:break-word] font-['Roboto:Medium'] font-medium leading-[normal] relative shrink-0 text-[#16a34a] text-[12px] text-center whitespace-nowrap" data-node-id="I299:549;259:3051" style={{ fontVariationSettings: '"wdth" 100' }}>
            Notification
          </p>
        </div>
        <div className="absolute bg-white border border-[#16a34a] border-solid content-stretch flex items-center left-[calc(66.67%+60.33px)] overflow-clip px-[24px] py-[12px] top-[551px]" data-node-id="299:550" data-name="Node / Default">
          <p className="[word-break:break-word] font-['Roboto:Medium'] font-medium leading-[normal] relative shrink-0 text-[#16a34a] text-[12px] text-center whitespace-nowrap" data-node-id="I299:550;259:3051" style={{ fontVariationSettings: '"wdth" 100' }}>
            Chat
          </p>
        </div>
        <div className="absolute bg-white border border-[#16a34a] border-solid content-stretch flex items-center left-[calc(66.67%+62.33px)] overflow-clip px-[24px] py-[12px] top-[624px]" data-node-id="299:551" data-name="Node / Default">
          <p className="[word-break:break-word] font-['Roboto:Medium'] font-medium leading-[normal] relative shrink-0 text-[#16a34a] text-[12px] text-center whitespace-nowrap" data-node-id="I299:551;259:3051" style={{ fontVariationSettings: '"wdth" 100' }}>
            Call
          </p>
        </div>
        <div className="absolute flex h-[29px] items-center justify-center left-[calc(66.67%+97.33px)] top-[519px] w-0" data-node-id="299:552">
          <div className="flex-none rotate-90">
            <div className="h-0 relative w-[29px]">
              <div className="absolute inset-[-7.36px_-3.45%_-7.36px_0]">
                <img loading="lazy" alt="" className="block max-w-none size-full" src={imgArrow16} />
              </div>
            </div>
          </div>
        </div>
        <div className="absolute flex h-[29px] items-center justify-center left-[calc(66.67%+97.33px)] top-[592px] w-0" data-node-id="299:553">
          <div className="flex-none rotate-90">
            <div className="h-0 relative w-[29px]">
              <div className="absolute inset-[-7.36px_-3.45%_-7.36px_0]">
                <img loading="lazy" alt="" className="block max-w-none size-full" src={imgArrow16} />
              </div>
            </div>
          </div>
        </div>
        <div className="absolute bg-white border border-[#711982] border-solid content-stretch flex items-center left-[calc(88.89%+30.11px)] overflow-clip px-[24px] py-[12px] top-[484px]" data-node-id="299:554" data-name="Node / Default">
          <p className="[word-break:break-word] font-['Roboto:Medium'] font-medium leading-[normal] relative shrink-0 text-[#711982] text-[12px] text-center whitespace-nowrap" data-node-id="I299:554;259:3051" style={{ fontVariationSettings: '"wdth" 100' }}>
            Login
          </p>
        </div>
        <div className="absolute bg-white border border-[#711982] border-solid content-stretch flex items-center left-[calc(88.89%+22.61px)] overflow-clip px-[24px] py-[12px] top-[551px]" data-node-id="299:555" data-name="Node / Default">
          <p className="[word-break:break-word] font-['Roboto:Medium'] font-medium leading-[normal] relative shrink-0 text-[#711982] text-[12px] text-center whitespace-nowrap" data-node-id="I299:555;259:3051" style={{ fontVariationSettings: '"wdth" 100' }}>
            Register
          </p>
        </div>
        <div className="absolute bg-white border border-[#711982] border-solid content-stretch flex items-center left-[calc(88.89%-0.89px)] overflow-clip px-[24px] py-[12px] top-[618px]" data-node-id="299:556" data-name="Node / Default">
          <p className="[word-break:break-word] font-['Roboto:Medium'] font-medium leading-[normal] relative shrink-0 text-[#711982] text-[12px] text-center whitespace-nowrap" data-node-id="I299:556;259:3051" style={{ fontVariationSettings: '"wdth" 100' }}>
            Forgot Password
          </p>
        </div>
        <div className="absolute bg-white border border-[#711982] border-solid content-stretch flex h-[38px] items-center left-[calc(88.89%+0.11px)] overflow-clip px-[24px] py-[12px] right-[54px] top-[685px]" data-node-id="299:557" data-name="Node / Default">
          <p className="[word-break:break-word] font-['Roboto:Medium'] font-medium leading-[normal] relative shrink-0 text-[#711982] text-[12px] text-center whitespace-nowrap" data-node-id="I299:557;259:3051" style={{ fontVariationSettings: '"wdth" 100' }}>
            Account Verification
          </p>
        </div>
        <div className="absolute bg-white border border-[#711982] border-solid content-stretch flex items-center left-[calc(88.89%+27.11px)] overflow-clip px-[24px] py-[12px] top-[752px]" data-node-id="299:558" data-name="Node / Default">
          <p className="[word-break:break-word] font-['Roboto:Medium'] font-medium leading-[normal] relative shrink-0 text-[#711982] text-[12px] text-center whitespace-nowrap" data-node-id="I299:558;259:3051" style={{ fontVariationSettings: '"wdth" 100' }}>
            Profile
          </p>
        </div>
        <div className="absolute bg-white border border-[#711982] border-solid content-stretch flex items-center left-[calc(88.89%+22.61px)] overflow-clip px-[24px] py-[12px] top-[819px]" data-node-id="299:559" data-name="Node / Default">
          <p className="[word-break:break-word] font-['Roboto:Medium'] font-medium leading-[normal] relative shrink-0 text-[#711982] text-[12px] text-center whitespace-nowrap" data-node-id="I299:559;259:3051" style={{ fontVariationSettings: '"wdth" 100' }}>
            Settings
          </p>
        </div>
        <div className="-translate-x-1/2 absolute bg-white border border-[#711982] border-solid content-stretch flex h-[38px] items-center left-[calc(94.44%-17.94px)] overflow-clip px-[24px] py-[12px] top-[886px]" data-node-id="299:560" data-name="Node / Default">
          <p className="[word-break:break-word] font-['Roboto:Medium'] font-medium leading-[normal] relative shrink-0 text-[#711982] text-[12px] text-center whitespace-nowrap" data-node-id="I299:560;259:3051" style={{ fontVariationSettings: '"wdth" 100' }}>
            Personal Information
          </p>
        </div>
        <div className="-translate-x-1/2 absolute bg-white border border-[#ffae33] border-solid content-stretch flex items-center left-[calc(50%+41.5px)] overflow-clip px-[24px] py-[12px] top-[402px]" data-node-id="299:561" data-name="Node / Default">
          <p className="[word-break:break-word] font-['Roboto:Medium'] font-medium leading-[normal] relative shrink-0 text-[#ffae33] text-[12px] text-center whitespace-nowrap" data-node-id="I299:561;259:3051" style={{ fontVariationSettings: '"wdth" 100' }}>
            Safety
          </p>
        </div>
        <div className="absolute bg-white border border-[#16a34a] border-solid content-stretch flex items-center left-[calc(44.44%+108.56px)] overflow-clip px-[24px] py-[12px] top-[477px]" data-node-id="299:562" data-name="Node / Default">
          <p className="[word-break:break-word] font-['Roboto:Medium'] font-medium leading-[normal] relative shrink-0 text-[#16a34a] text-[12px] text-center whitespace-nowrap" data-node-id="I299:562;259:3051" style={{ fontVariationSettings: '"wdth" 100' }}>
            SOS
          </p>
        </div>
        <div className="absolute bg-white border border-[#16a34a] border-solid content-stretch flex h-[38px] items-center left-[calc(44.44%+63.56px)] overflow-clip px-[24px] py-[12px] top-[545px] w-[160px]" data-node-id="299:563" data-name="Node / Default">
          <p className="[word-break:break-word] font-['Roboto:Medium'] font-medium leading-[normal] relative shrink-0 text-[#16a34a] text-[12px] text-center whitespace-nowrap" data-node-id="I299:563;259:3051" style={{ fontVariationSettings: '"wdth" 100' }}>
            Emergency Contacts
          </p>
        </div>
        <div className="absolute bg-white border border-[#16a34a] border-solid content-stretch flex items-center left-[calc(44.44%+69.56px)] overflow-clip px-[24px] py-[12px] top-[613px]" data-node-id="299:564" data-name="Node / Default">
          <p className="[word-break:break-word] font-['Roboto:Medium'] font-medium leading-[normal] relative shrink-0 text-[#16a34a] text-[12px] text-center whitespace-nowrap" data-node-id="I299:564;259:3051" style={{ fontVariationSettings: '"wdth" 100' }}>
            Safety Information
          </p>
        </div>
        <div className="absolute bg-white border border-[#16a34a] border-solid content-stretch flex items-center left-[calc(44.44%+80.56px)] overflow-clip px-[24px] py-[12px] top-[681px]" data-node-id="299:565" data-name="Node / Default">
          <p className="[word-break:break-word] font-['Roboto:Medium'] font-medium leading-[normal] relative shrink-0 text-[#16a34a] text-[12px] text-center whitespace-nowrap" data-node-id="I299:565;259:3051" style={{ fontVariationSettings: '"wdth" 100' }}>
            Share My Ride
          </p>
        </div>
        <div className="absolute bg-white border border-[#16a34a] border-solid content-stretch flex items-center left-[calc(44.44%+73.56px)] overflow-clip px-[24px] py-[12px] top-[749px]" data-node-id="299:566" data-name="Node / Default">
          <p className="[word-break:break-word] font-['Roboto:Medium'] font-medium leading-[normal] relative shrink-0 text-[#16a34a] text-[12px] text-center whitespace-nowrap" data-node-id="I299:566;259:3051" style={{ fontVariationSettings: '"wdth" 100' }}>
            Trusted Contacts
          </p>
        </div>
        <div className="absolute flex h-[61px] items-center justify-center left-[calc(50%+40.5px)] top-[193px] w-0" data-node-id="299:567">
          <div className="flex-none rotate-90">
            <div className="h-0 relative w-[55px]">
              <div className="absolute inset-[-7.36px_-1.82%_-7.36px_0]">
                <img loading="lazy" alt="" className="block max-w-none size-full" src={imgArrow1} />
              </div>
            </div>
          </div>
        </div>
        <div className="absolute flex h-[55px] items-center justify-center left-[calc(50%+40.5px)] top-[292px] w-0" data-node-id="299:568">
          <div className="flex-none rotate-90">
            <div className="h-0 relative w-[55px]">
              <div className="absolute inset-[-7.36px_-1.82%_-7.36px_0]">
                <img loading="lazy" alt="" className="block max-w-none size-full" src={imgArrow1} />
              </div>
            </div>
          </div>
        </div>
        <div className="absolute flex h-[59px] items-center justify-center left-[calc(94.44%-33.94px)] top-[347px] w-0" data-node-id="299:569">
          <div className="flex-none rotate-90">
            <div className="h-0 relative w-[55px]">
              <div className="absolute inset-[-7.36px_-1.82%_-7.36px_0]">
                <img loading="lazy" alt="" className="block max-w-none size-full" src={imgArrow1} />
              </div>
            </div>
          </div>
        </div>
        <div className="absolute flex h-[40px] items-center justify-center left-[calc(88.89%+69.11px)] top-[444px] w-0" data-node-id="299:570">
          <div className="flex-none rotate-90">
            <div className="h-0 relative w-[29px]">
              <div className="absolute inset-[-7.36px_-3.45%_-7.36px_0]">
                <img loading="lazy" alt="" className="block max-w-none size-full" src={imgArrow8} />
              </div>
            </div>
          </div>
        </div>
        <div className="absolute flex h-[29px] items-center justify-center left-[calc(88.89%+69.11px)] top-[522px] w-0" data-node-id="299:571">
          <div className="flex-none rotate-90">
            <div className="h-0 relative w-[29px]">
              <div className="absolute inset-[-7.36px_-3.45%_-7.36px_0]">
                <img loading="lazy" alt="" className="block max-w-none size-full" src={imgArrow8} />
              </div>
            </div>
          </div>
        </div>
        <div className="absolute flex h-[29px] items-center justify-center left-[calc(88.89%+69.11px)] top-[589px] w-0" data-node-id="299:572">
          <div className="flex-none rotate-90">
            <div className="h-0 relative w-[29px]">
              <div className="absolute inset-[-7.36px_-3.45%_-7.36px_0]">
                <img loading="lazy" alt="" className="block max-w-none size-full" src={imgArrow8} />
              </div>
            </div>
          </div>
        </div>
        <div className="absolute flex h-[29px] items-center justify-center left-[calc(88.89%+69.11px)] top-[656px] w-0" data-node-id="299:573">
          <div className="flex-none rotate-90">
            <div className="h-0 relative w-[29px]">
              <div className="absolute inset-[-7.36px_-3.45%_-7.36px_0]">
                <img loading="lazy" alt="" className="block max-w-none size-full" src={imgArrow8} />
              </div>
            </div>
          </div>
        </div>
        <div className="absolute flex h-[29px] items-center justify-center left-[calc(88.89%+69.11px)] top-[723px] w-0" data-node-id="299:574">
          <div className="flex-none rotate-90">
            <div className="h-0 relative w-[29px]">
              <div className="absolute inset-[-7.36px_-3.45%_-7.36px_0]">
                <img loading="lazy" alt="" className="block max-w-none size-full" src={imgArrow8} />
              </div>
            </div>
          </div>
        </div>
        <div className="absolute flex h-[29px] items-center justify-center left-[calc(88.89%+69.11px)] top-[790px] w-0" data-node-id="299:575">
          <div className="flex-none rotate-90">
            <div className="h-0 relative w-[29px]">
              <div className="absolute inset-[-7.36px_-3.45%_-7.36px_0]">
                <img loading="lazy" alt="" className="block max-w-none size-full" src={imgArrow8} />
              </div>
            </div>
          </div>
        </div>
        <div className="absolute flex h-[29px] items-center justify-center left-[calc(88.89%+69.11px)] top-[857px] w-0" data-node-id="299:576">
          <div className="flex-none rotate-90">
            <div className="h-0 relative w-[29px]">
              <div className="absolute inset-[-7.36px_-3.45%_-7.36px_0]">
                <img loading="lazy" alt="" className="block max-w-none size-full" src={imgArrow8} />
              </div>
            </div>
          </div>
        </div>
        <div className="absolute flex h-[33px] items-center justify-center left-[calc(66.67%+97.33px)] top-[444px] w-0" data-node-id="299:577">
          <div className="flex-none rotate-90">
            <div className="h-0 relative w-[29px]">
              <div className="absolute inset-[-7.36px_-3.45%_-7.36px_0]">
                <img loading="lazy" alt="" className="block max-w-none size-full" src={imgArrow8} />
              </div>
            </div>
          </div>
        </div>
        <div className="absolute flex h-[33px] items-center justify-center left-[calc(33.33%-8.33px)] top-[444px] w-0" data-node-id="299:578">
          <div className="flex-none rotate-90">
            <div className="h-0 relative w-[29px]">
              <div className="absolute inset-[-7.36px_-3.45%_-7.36px_0]">
                <img loading="lazy" alt="" className="block max-w-none size-full" src={imgArrow8} />
              </div>
            </div>
          </div>
        </div>
        <div className="absolute flex h-[34px] items-center justify-center left-[calc(11.11%+11.89px)] top-[444px] w-0" data-node-id="299:579">
          <div className="flex-none rotate-90">
            <div className="h-0 relative w-[29px]">
              <div className="absolute inset-[-7.36px_-3.45%_-7.36px_0]">
                <img loading="lazy" alt="" className="block max-w-none size-full" src={imgArrow8} />
              </div>
            </div>
          </div>
        </div>
        <div className="absolute flex h-[37px] items-center justify-center left-[calc(44.44%+143.56px)] top-[440px] w-0" data-node-id="299:580">
          <div className="flex-none rotate-90">
            <div className="h-0 relative w-[29px]">
              <div className="absolute inset-[-7.36px_-3.45%_-7.36px_0]">
                <img loading="lazy" alt="" className="block max-w-none size-full" src={imgArrow8} />
              </div>
            </div>
          </div>
        </div>
        <div className="absolute flex h-[29px] items-center justify-center left-[calc(11.11%+113.89px)] top-[626px] w-0" data-node-id="299:581">
          <div className="flex-none rotate-90">
            <div className="h-0 relative w-[29px]">
              <div className="absolute inset-[-7.36px_-3.45%_-7.36px_0]">
                <img loading="lazy" alt="" className="block max-w-none size-full" src={imgArrow16} />
              </div>
            </div>
          </div>
        </div>
        <div className="absolute flex h-[29px] items-center justify-center left-[calc(11.11%+113.89px)] top-[693px] w-0" data-name="Receipt connector">
          <div className="flex-none rotate-90">
            <div className="h-0 relative w-[29px]">
              <div className="absolute inset-[-7.36px_-3.45%_-7.36px_0]">
                <img loading="lazy" alt="" className="block max-w-none size-full" src={imgArrow16} />
              </div>
            </div>
          </div>
        </div>
        <div className="absolute flex h-[42px] items-center justify-center left-[123px] top-[478px] w-0" data-node-id="299:582">
          <div className="flex-none rotate-90">
            <div className="h-0 relative w-[42px]">
              <div className="absolute inset-[-7.36px_-2.38%_-7.36px_0]">
                <img loading="lazy" alt="" className="block max-w-none size-full" src={imgArrow30} />
              </div>
            </div>
          </div>
        </div>
        <div className="absolute flex h-[35px] items-center justify-center left-[123px] top-[555px] w-0" data-node-id="299:583">
          <div className="flex-none rotate-90">
            <div className="h-0 relative w-[35px]">
              <div className="absolute inset-[-7.36px_-2.86%_-7.36px_0]">
                <img loading="lazy" alt="" className="block max-w-none size-full" src={imgArrow32} />
              </div>
            </div>
          </div>
        </div>
        <div className="absolute flex h-[29px] items-center justify-center left-[123px] top-[626px] w-0" data-node-id="299:584">
          <div className="flex-none rotate-90">
            <div className="h-0 relative w-[29px]">
              <div className="absolute inset-[-7.36px_-3.45%_-7.36px_0]">
                <img loading="lazy" alt="" className="block max-w-none size-full" src={imgArrow16} />
              </div>
            </div>
          </div>
        </div>
        <div className="absolute flex h-[29px] items-center justify-center left-[calc(11.11%+113.89px)] top-[559px] w-0" data-node-id="299:585">
          <div className="flex-none rotate-90">
            <div className="h-0 relative w-[29px]">
              <div className="absolute inset-[-7.36px_-3.45%_-7.36px_0]">
                <img loading="lazy" alt="" className="block max-w-none size-full" src={imgArrow16} />
              </div>
            </div>
          </div>
        </div>
        <div className="absolute flex h-[29px] items-center justify-center left-[calc(22.22%+98.78px)] top-[478px] w-0" data-node-id="299:586">
          <div className="flex-none rotate-90">
            <div className="h-0 relative w-[29px]">
              <div className="absolute inset-[-7.36px_-3.45%_-7.36px_0]">
                <img loading="lazy" alt="" className="block max-w-none size-full" src={imgArrow16} />
              </div>
            </div>
          </div>
        </div>
        <div className="absolute flex h-[33px] items-center justify-center left-[123px] top-[691px] w-0" data-node-id="299:587">
          <div className="flex-none rotate-90">
            <div className="h-0 relative w-[33px]">
              <div className="absolute inset-[-7.36px_-3.03%_-7.36px_0]">
                <img loading="lazy" alt="" className="block max-w-none size-full" src={imgArrow34} />
              </div>
            </div>
          </div>
        </div>
        <div className="absolute flex h-[33px] items-center justify-center left-[123px] top-[760px] w-0" data-node-id="299:588">
          <div className="flex-none rotate-90">
            <div className="h-0 relative w-[33px]">
              <div className="absolute inset-[-7.36px_-3.03%_-7.36px_0]">
                <img loading="lazy" alt="" className="block max-w-none size-full" src={imgArrow34} />
              </div>
            </div>
          </div>
        </div>
        <div className="absolute flex h-[33px] items-center justify-center left-[123px] top-[829px] w-0" data-node-id="299:589">
          <div className="flex-none rotate-90">
            <div className="h-0 relative w-[33px]">
              <div className="absolute inset-[-7.36px_-3.03%_-7.36px_0]">
                <img loading="lazy" alt="" className="block max-w-none size-full" src={imgArrow34} />
              </div>
            </div>
          </div>
        </div>
        <div className="absolute flex h-[33px] items-center justify-center left-[123px] top-[898px] w-0" data-node-id="299:590">
          <div className="flex-none rotate-90">
            <div className="h-0 relative w-[33px]">
              <div className="absolute inset-[-7.36px_-3.03%_-7.36px_0]">
                <img loading="lazy" alt="" className="block max-w-none size-full" src={imgArrow34} />
              </div>
            </div>
          </div>
        </div>
        <div className="absolute flex h-[33px] items-center justify-center left-[123px] top-[964px] w-0" data-node-id="299:591">
          <div className="flex-none rotate-90">
            <div className="h-0 relative w-[33px]">
              <div className="absolute inset-[-7.36px_-3.03%_-7.36px_0]">
                <img loading="lazy" alt="" className="block max-w-none size-full" src={imgArrow34} />
              </div>
            </div>
          </div>
        </div>
        <div className="absolute flex h-[33px] items-center justify-center left-[123px] top-[1032px] w-0" data-node-id="299:592">
          <div className="flex-none rotate-90">
            <div className="h-0 relative w-[33px]">
              <div className="absolute inset-[-7.36px_-3.03%_-7.36px_0]">
                <img loading="lazy" alt="" className="block max-w-none size-full" src={imgArrow34} />
              </div>
            </div>
          </div>
        </div>
        <div className="absolute flex h-[42px] items-center justify-center left-[calc(11.11%+113.89px)] top-[478px] w-0" data-node-id="299:593">
          <div className="flex-none rotate-90">
            <div className="h-0 relative w-[42px]">
              <div className="absolute inset-[-7.36px_-2.38%_-7.36px_0]">
                <img loading="lazy" alt="" className="block max-w-none size-full" src={imgArrow30} />
              </div>
            </div>
          </div>
        </div>
        <div className="absolute flex h-[29px] items-center justify-center left-[calc(33.33%+85.67px)] top-[477px] w-0" data-node-id="299:594">
          <div className="flex-none rotate-90">
            <div className="h-0 relative w-[29px]">
              <div className="absolute inset-[-7.36px_-3.45%_-7.36px_0]">
                <img loading="lazy" alt="" className="block max-w-none size-full" src={imgArrow16} />
              </div>
            </div>
          </div>
        </div>
        <div className="absolute flex h-[29px] items-center justify-center left-[calc(33.33%+85.67px)] top-[551px] w-0" data-node-id="299:595">
          <div className="flex-none rotate-90">
            <div className="h-0 relative w-[29px]">
              <div className="absolute inset-[-7.36px_-3.45%_-7.36px_0]">
                <img loading="lazy" alt="" className="block max-w-none size-full" src={imgArrow16} />
              </div>
            </div>
          </div>
        </div>
        <div className="absolute flex h-[29px] items-center justify-center left-[calc(33.33%+85.67px)] top-[617px] w-0" data-node-id="299:596">
          <div className="flex-none rotate-90">
            <div className="h-0 relative w-[29px]">
              <div className="absolute inset-[-7.36px_-3.45%_-7.36px_0]">
                <img loading="lazy" alt="" className="block max-w-none size-full" src={imgArrow16} />
              </div>
            </div>
          </div>
        </div>
        <div className="absolute flex h-[29px] items-center justify-center left-[calc(22.22%+94.78px)] top-[547px] w-0" data-node-id="299:597">
          <div className="flex-none rotate-90">
            <div className="h-0 relative w-[29px]">
              <div className="absolute inset-[-7.36px_-3.45%_-7.36px_0]">
                <img loading="lazy" alt="" className="block max-w-none size-full" src={imgArrow16} />
              </div>
            </div>
          </div>
        </div>
        <div className="absolute flex h-[29px] items-center justify-center left-[calc(22.22%+94.78px)] top-[612px] w-0" data-node-id="299:598">
          <div className="flex-none rotate-90">
            <div className="h-0 relative w-[29px]">
              <div className="absolute inset-[-7.36px_-3.45%_-7.36px_0]">
                <img loading="lazy" alt="" className="block max-w-none size-full" src={imgArrow16} />
              </div>
            </div>
          </div>
        </div>
        <div className="absolute flex h-[29px] items-center justify-center left-[calc(22.22%+94.78px)] top-[677px] w-0" data-node-id="299:599">
          <div className="flex-none rotate-90">
            <div className="h-0 relative w-[29px]">
              <div className="absolute inset-[-7.36px_-3.45%_-7.36px_0]">
                <img loading="lazy" alt="" className="block max-w-none size-full" src={imgArrow16} />
              </div>
            </div>
          </div>
        </div>
        <div className="absolute flex h-[29px] items-center justify-center left-[calc(44.44%+143.56px)] top-[516px] w-0" data-node-id="299:600">
          <div className="flex-none rotate-90">
            <div className="h-0 relative w-[29px]">
              <div className="absolute inset-[-7.36px_-3.45%_-7.36px_0]">
                <img loading="lazy" alt="" className="block max-w-none size-full" src={imgArrow8} />
              </div>
            </div>
          </div>
        </div>
        <div className="absolute flex h-[29px] items-center justify-center left-[calc(44.44%+143.56px)] top-[583px] w-0" data-node-id="299:601">
          <div className="flex-none rotate-90">
            <div className="h-0 relative w-[29px]">
              <div className="absolute inset-[-7.36px_-3.45%_-7.36px_0]">
                <img loading="lazy" alt="" className="block max-w-none size-full" src={imgArrow8} />
              </div>
            </div>
          </div>
        </div>
        <div className="absolute flex h-[29px] items-center justify-center left-[calc(44.44%+143.56px)] top-[650px] w-0" data-node-id="299:602">
          <div className="flex-none rotate-90">
            <div className="h-0 relative w-[29px]">
              <div className="absolute inset-[-7.36px_-3.45%_-7.36px_0]">
                <img loading="lazy" alt="" className="block max-w-none size-full" src={imgArrow8} />
              </div>
            </div>
          </div>
        </div>
        <div className="absolute flex h-[29px] items-center justify-center left-[calc(44.44%+143.56px)] top-[720px] w-0" data-node-id="299:603">
          <div className="flex-none rotate-90">
            <div className="h-0 relative w-[29px]">
              <div className="absolute inset-[-7.36px_-3.45%_-7.36px_0]">
                <img loading="lazy" alt="" className="block max-w-none size-full" src={imgArrow8} />
              </div>
            </div>
          </div>
        </div>
        <div className="absolute flex h-[55px] items-center justify-center left-[calc(50%+40.5px)] top-[347px] w-0" data-node-id="299:604">
          <div className="flex-none rotate-90">
            <div className="h-0 relative w-[55px]">
              <div className="absolute inset-[-7.36px_-1.82%_-7.36px_0]">
                <img loading="lazy" alt="" className="block max-w-none size-full" src={imgArrow1} />
              </div>
            </div>
          </div>
        </div>
        <div className="absolute flex h-[59px] items-center justify-center left-[calc(72.22%-5.22px)] top-[347px] w-0" data-node-id="299:605">
          <div className="flex-none rotate-90">
            <div className="h-0 relative w-[55px]">
              <div className="absolute inset-[-7.36px_-1.82%_-7.36px_0]">
                <img loading="lazy" alt="" className="block max-w-none size-full" src={imgArrow1} />
              </div>
            </div>
          </div>
        </div>
        <div className="absolute flex h-[59px] items-center justify-center left-[calc(33.33%-8.83px)] top-[347px] w-0" data-node-id="299:606">
          <div className="flex-none rotate-90">
            <div className="h-0 relative w-[55px]">
              <div className="absolute inset-[-7.36px_-1.82%_-7.36px_0]">
                <img loading="lazy" alt="" className="block max-w-none size-full" src={imgArrow1} />
              </div>
            </div>
          </div>
        </div>
        <div className="absolute flex h-[59px] items-center justify-center left-[calc(16.67%-90.67px)] top-[347px] w-0" data-node-id="299:607">
          <div className="flex-none rotate-90">
            <div className="h-0 relative w-[55px]">
              <div className="absolute inset-[-7.36px_-1.82%_-7.36px_0]">
                <img loading="lazy" alt="" className="block max-w-none size-full" src={imgArrow1} />
              </div>
            </div>
          </div>
        </div>
        <div className="absolute h-0 left-[calc(22.22%+94.78px)] top-[477px] w-[184px]" data-node-id="299:608">
          <div className="absolute inset-[-1px_0_0_0]">
            <img loading="lazy" alt="" className="block max-w-none size-full" src={imgLine2} />
          </div>
        </div>
        <div className="absolute h-0 left-[123px] top-[478px] w-[184px]" data-node-id="299:609">
          <div className="absolute inset-[-1px_0_0_0]">
            <img loading="lazy" alt="" className="block max-w-none size-full" src={imgLine2} />
          </div>
        </div>
        <div className="absolute content-stretch flex flex-col gap-[22px] items-start left-[26px] top-[62px] w-[534px]" data-node-id="299:610">
          <p className="[word-break:break-word] font-['Roboto:Medium'] font-medium leading-[normal] relative shrink-0 text-[40px] text-black text-center whitespace-nowrap" data-node-id="299:611" style={{ fontVariationSettings: '"wdth" 100' }}>
            LOOP — PASSENGER Site Map
          </p>
          <div className="content-stretch flex flex-col gap-[15px] items-start relative shrink-0 w-[151px]" data-node-id="299:612">
            <div className="content-stretch flex gap-[6px] items-center relative shrink-0 w-full" data-node-id="299:613">
              <div className="bg-white border border-[#16a34a] border-solid relative shrink-0 size-[35px]" data-node-id="299:614" />
              <p className="[word-break:break-word] font-['Roboto:Medium'] font-medium leading-[normal] relative shrink-0 text-[12px] text-black w-[110px]" data-node-id="299:615" style={{ fontVariationSettings: '"wdth" 100' }}>
                Details Page
              </p>
            </div>
            <div className="content-stretch flex gap-[6px] items-center relative shrink-0 w-full" data-node-id="299:616">
              <div className="bg-white border border-[#ffae33] border-solid relative shrink-0 size-[35px]" data-node-id="299:617" />
              <p className="[word-break:break-word] font-['Roboto:Medium'] font-medium leading-[normal] relative shrink-0 text-[12px] text-black text-center w-[110px]" data-node-id="299:618" style={{ fontVariationSettings: '"wdth" 100' }}>
                Category / List Page
              </p>
            </div>
            <div className="content-stretch flex gap-[6px] items-center relative shrink-0 w-full" data-node-id="299:619">
              <div className="bg-white border border-[#711982] border-solid relative shrink-0 size-[35px]" data-node-id="299:620" />
              <p className="[word-break:break-word] font-['Roboto:Medium'] font-medium leading-[normal] relative shrink-0 text-[12px] text-black text-center w-[110px]" data-node-id="299:621" style={{ fontVariationSettings: '"wdth" 100' }}>
                Authenticated Page
              </p>
            </div>
          </div>
        </div>
      </div>
      <DriverSitemap />
      </div>
      <div className="absolute flex h-[268px] items-center justify-center left-[calc(66.67%+7.33px)] top-[910px] w-0" data-node-id="299:822">
        <div className="flex-none rotate-90">
          <div className="h-0 relative w-[268px]">
            <div className="absolute inset-[-1px_0_0_0]">
              <img loading="lazy" alt="" className="block max-w-none size-full" src={imgLine23} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
export function LoopCaseStudyPage() {
  const [showBackButton, setShowBackButton] = useState(() => typeof window === 'undefined' || window.scrollY <= 120);
  const [backButtonAtTop, setBackButtonAtTop] = useState(() => typeof window === 'undefined' || window.scrollY <= 120);
  const [viewport, setViewport] = useState(() => ({
    width: typeof window === 'undefined' ? 1920 : Math.min(window.innerWidth, window.visualViewport?.width ?? window.innerWidth),
  }));
  useEffect(() => {
    const onResize = () => setViewport({
      width: Math.min(window.innerWidth, window.visualViewport?.width ?? window.innerWidth),
    });
    window.addEventListener('resize', onResize, { passive: true });
    window.visualViewport?.addEventListener('resize', onResize, { passive: true });
    return () => {
      window.removeEventListener('resize', onResize);
      window.visualViewport?.removeEventListener('resize', onResize);
    };
  }, []);
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
        if (!atTop) {
          hideTimer = window.setTimeout(() => setShowBackButton(false), 1800);
        }
        previousScrollY = currentScrollY;
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.clearTimeout(hideTimer);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);
  const scale = Math.min(1, viewport.width / 1920);
  const offset = Math.max(0, (viewport.width - 1920 * scale) / 2);
  return (
    <main className="loop-study-exact-page" style={{ height: 20978 * scale }}>
      <LoopChapterNav />
      <div className="loop-study-exact-frame" style={{ marginLeft: offset, marginTop: -179 * scale, transform: `scale(${scale})` }}>
        <FigmaLoopCaseStudy />
      </div>
      {typeof document !== 'undefined' && createPortal(
        <div
          className={`fixed ${backButtonAtTop ? 'left-[clamp(64px,6.4vw,120px)]' : 'left-6'} top-4 z-[60] transition-[left,opacity,transform] duration-200 ease-out ${
            showBackButton
              ? 'translate-y-0 opacity-100'
              : 'pointer-events-none -translate-y-2 opacity-0'
          }`}
        >
          <button
            type="button"
            onClick={goBack}
            tabIndex={showBackButton ? 0 : -1}
            aria-label="Back to projects"
            className="inline-flex size-12 items-center justify-center rounded-[10px] border border-[#d2d2d7] bg-gradient-to-b from-white via-[#f7f7f8] to-[#ececef] text-[#1d1d1f] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_2px_rgba(0,0,0,0.09)] transition-[background,border-color,box-shadow,transform] duration-150 hover:border-[#b8b8bd] hover:from-white hover:via-[#f4f4f5] hover:to-[#e5e5e8] hover:shadow-[inset_0_1px_0_#fff,0_3px_8px_rgba(0,0,0,0.12)] active:scale-[0.97] active:shadow-[inset_0_1px_3px_rgba(0,0,0,0.14)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#666]"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round">
              <path d="M18 5.5v13a1 1 0 0 1-1.5.86l-11.2-6.5a1 1 0 0 1 0-1.72l11.2-6.5a1 1 0 0 1 1.5.86Z" />
            </svg>
          </button>
        </div>,
        document.body,
      )}
    </main>
  );
}
