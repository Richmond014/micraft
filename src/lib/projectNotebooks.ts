import type { ProjectId } from './assets'

export type ProjectNotebook = {
  theme: 'loop' | 'aws-skill-builder' | 'aws-club' | 'aws-official' | 'bantay' | 'ease-service' | 'spotify' | 'hanapbuhay'
  title: string
  detailDate: string
  description: string
  role: string
  artwork: string
  spread: string
  logo: string
  destination: {
    hash: string
    returnKey: string
    actionLabel: string
    liveUrl?: string
  }
}

export const awsSkillBuilderNotebook: ProjectNotebook = {
  theme: 'aws-skill-builder',
  title: 'AWS Skill Builder',
  detailDate: 'Feb 2026',
  description: 'AWS Skill Builder is an online learning platform offering courses, hands-on activities, and interactive resources across various technology topics. It helps users build new skills, gain practical knowledge, and track their learning progress.',
  role: 'UI/UX Designer',
  artwork: 'figma-artwork-02.png',
  spread: 'figma-book-02.png',
  logo: 'figma-logo-02.png',
  destination: {
    hash: '#aws-skill-builder-case-study',
    returnKey: 'aws-skill-builder-return',
    actionLabel: 'View Contribution',
    liveUrl: 'https://sbd.awsccpup.cloud/',
  },
}

export const awsCloudClubWebsiteNotebook: ProjectNotebook = {
  theme: 'aws-club',
  title: 'AWS Cloud Club PUP Website',
  detailDate: 'September 2025',
  description: "The AWS Cloud Club PUP website serves as a central platform for students to explore the organization, discover upcoming events, learn about membership opportunities, and stay connected with the club's activities.",
  role: 'UI/UX Designer',
  artwork: 'figma-artwork-04.png',
  spread: 'figma-book-04.png',
  logo: 'figma-logo-04.png',
  destination: {
    hash: '#awscc-contributions',
    returnKey: 'awscc-contributions-return',
    actionLabel: 'View Contribution',
  },
}

export const featuredProjectNotebooks: Record<ProjectId, ProjectNotebook> = {
  loop: {
    theme: 'loop',
    title: 'LOOP',
    detailDate: 'August 2026',
    description: 'LOOP focuses on making everyday motorcycle commuting simpler, safer, and more reliable through user-centered design. My role involves designing intuitive booking flows and refining key interface elements to help passengers navigate the ride-hailing experience with greater ease and confidence.',
    role: 'UI/UX Designer',
    artwork: 'figma-artwork-01.png',
    spread: 'figma-book-01.png',
    logo: 'figma-logo-01.png',
    destination: {
      hash: '#loop-case-study',
      returnKey: 'loop-case-study-return',
      actionLabel: 'View Case Study',
    },
  },
  'aws-skill-builder': awsSkillBuilderNotebook,
  bantay: {
    theme: 'bantay',
    title: 'Bantay',
    detailDate: 'December 2025',
    description: 'BANTAY is a flood preparedness and evacuation platform designed to help communities navigate flood-related risks. It provides access to flood information, evacuation routes, and safety resources to support informed decisions during emergencies.',
    role: 'UI/UX Designer',
    artwork: 'figma-artwork-03.png',
    spread: 'figma-book-03.png',
    logo: 'figma-logo-03.png',
    destination: {
      hash: '#bantay-contributions',
      returnKey: 'bantay-contributions-return',
      actionLabel: 'View Contribution',
      liveUrl: 'https://bantay-pmt.org/',
    },
  },
}
