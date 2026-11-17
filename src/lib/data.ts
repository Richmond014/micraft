import type { HeroIconId, ProjectId, SoftwareId } from './assets'

/* ---------- Navigation ---------- */
export type NavItem = { label: string; href?: string }

/** `href` is undefined where no destination has been decided (Resume). */
export const nav: Record<'left' | 'right', NavItem[]> = {
  left: [
    { label: 'Projects', href: '#projects' },
    { label: 'Experience', href: '#experience' },
  ],
  right: [{ label: 'Resume' }, { label: 'Contact', href: '#contact' }],
}

/* ---------- Hero ---------- */
export type ToolId = 'cursor' | 'move' | 'frame' | 'pen' | 'pencil' | 'comment' | 'text'

export const tools: { id: ToolId; label: string; message: string }[] = [
  { id: 'cursor', label: 'Cursor', message: 'Just moving things around.' },
  { id: 'move', label: 'Move', message: 'Nudged it 1px. Looks perfect now.' },
  { id: 'frame', label: 'Frame', message: "Everything fits. Until it doesn't." },
  { id: 'pen', label: 'Pen', message: 'Trying to make sense of my ideas.' },
  { id: 'pencil', label: 'Pencil', message: 'Sketching before the pixels.' },
  { id: 'comment', label: 'Comment', message: 'Feedback appreciated. Sometimes.' },
  { id: 'text', label: 'Text', message: 'last final final' },
]

export type HeroIcon = {
  id: HeroIconId
  /** Accessible name only; the image itself comes from assets.hero.icons. */
  label: string
  /** Position as a percentage of the headline + toolbar block. */
  left: string
  top: string
  size: string
  rotate: number
  /** Click message. Left unset until copy is approved. */
  message?: string
}

export const heroIcons: HeroIcon[] = [
  { id: 'procreate', label: 'Procreate', left: '-15%', top: '-32%', size: 'clamp(3.25rem, 6vw, 3.875rem)', rotate: -6 },
  { id: 'after-effects', label: 'After Effects', left: '-22%', top: '-14%', size: 'clamp(3.25rem, 6vw, 3.875rem)', rotate: -12 },
  { id: 'palette', label: 'Color palette', left: '108%', top: '-22%', size: 'clamp(7.5rem, 11vw, 9rem)', rotate: 0 },
  { id: 'figma', label: 'Figma', left: '110%', top: '43%', size: 'clamp(3.25rem, 6vw, 3.875rem)', rotate: 12 },
]

/* ---------- Projects ---------- */
export type Project = {
  id: ProjectId
  title: string
  description: string
  role: string
  date: string
  /** Case-study destination. Unset until decided. */
  href?: string
}

export const projects: Project[] = [
  {
    id: 'loop',
    title: 'LOOP',
    description:
      'A commuter-focused platform simplifying motorcycle bookings through intuitive design, clear fares, and reliable trip experiences.',
    role: 'UI/UX Designer',
    date: 'Aug 2026',
  },
  {
    id: 'aws-skill-builder',
    title: 'AWS Skill Builder',
    description:
      'An online learning platform where members can explore courses, complete hands-on activities, and track their learning progress.',
    role: 'UI/UX Designer',
    date: 'Feb 2026',
  },
  {
    id: 'bantay',
    title: 'BANTAY',
    description:
      'Understanding where water goes to help communities anticipate flood risks, plan ahead, and make informed decisions when flooding occurs.',
    role: 'UI/UX Designer',
    date: 'Dec 2025',
  },
]

/* ---------- Experience ---------- */
export const journey = {
  title: 'The journey so far.',
  subtitle: 'Experiences that shaped my growth',
  description:
    'Designed interfaces for AWS Cloud Club PUP’s digital platforms, including its website and AWS Skill Builder experience. Improved navigation, developed event and membership sections, and created engagement features such as badges and leaderboards to enhance usability and user engagement.',
  laminaDescription: [
    'Conducted user research and competitor analysis to identify commuter needs and design opportunities.',
    'Developed user flows and designed LOOP’s interface, focusing on seamless ride booking, transparent fares, driver tracking, and passenger safety.',
  ],
  roles: {
    current: { title: 'UI/UX Designer', company: '@AWS Cloud Club PUP', date: 'October 2025' },
    previous: {
      title: 'UI/UX Designer',
      company: '@Lamina Studios LLC',
      date: 'August 2026',
    },
  },
}

/* ---------- About ---------- */
export const about = {
  statement:
    'I am Michael, a Computer Science student at PUP specializing in UI/UX Design and Frontend Development.',
  softwareLabel: 'Software:',
  card: { name: '@Michael Richmond Racelis', network: 'Linkedin' },
  buttons: { connect: 'Connect', resume: 'View Resume' },
}

export const software: { id: SoftwareId; label: string }[] = [
  { id: 'figma', label: 'Figma' },
  { id: 'after-effects', label: 'After Effects' },
  { id: 'procreate', label: 'Procreate' },
  { id: 'affinity', label: 'Affinity' },
]

/* ---------- Making Process ---------- */
export const makingProcess = {
  title: '(the)Making process',
  steps: [
    'Understand the problem',
    'Look for better solutions',
    'Sketch out the ideas',
    'Design the interface',
    'Build a prototype',
    'Test it with users',
    'Refine what needs work',
    'Turn ideas into products',
  ],
}

/* ---------- Contact ---------- */
const emailDraft = `?subject=${encodeURIComponent('Portfolio inquiry')}&body=${encodeURIComponent('Hi Michael,\n\nI came across your portfolio and would like to discuss a potential opportunity.\n\nBest,\n[Your name]')}`

export const contactChannels: { id: 'gmail' | 'email' | 'linkedin' | 'github'; label: string; href: string }[] = [
  { id: 'gmail', label: 'Gmail', href: `mailto:michracelis@gmail.com${emailDraft}` },
  { id: 'email', label: 'Email', href: `mailto:michaelracelis@outlook.com${emailDraft}` },
  { id: 'linkedin', label: 'LinkedIn', href: 'https://www.linkedin.com/in/michael-richmond-racelis-3a325232a/' },
  { id: 'github', label: 'GitHub', href: 'https://github.com/Richmond014' },
]

export const linkedinUrl = contactChannels.find((channel) => channel.id === 'linkedin')?.href ?? 'https://www.linkedin.com/'
