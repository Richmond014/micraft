export type ProjectId = 'loop' | 'aws-skill-builder' | 'bantay'
export type HeroIconId = 'procreate' | 'after-effects' | 'palette' | 'figma'
export type SoftwareId = 'figma' | 'after-effects' | 'procreate' | 'affinity'

const figma = '/assets/figma/'

export const assets = {
  nav: { monogram: `${figma}img4848151511.png` },
  loader: { logoBlack: `${figma}logo-black.png` },
  hero: {
    penPath: `${figma}imgGroup20.svg`,
    penCursor: `${figma}imgGroup.svg`,
    icons: {
      procreate: `${figma}imgImage15.png`,
      'after-effects': `${figma}imgImage14.png`,
      palette: `${figma}imgGroup9.svg`,
      figma: `${figma}imgImage13.png`,
    } satisfies Partial<Record<HeroIconId, string>>,
  },
  projects: {
    loop: {
      previews: [
        `${figma}imgIPhone16Plus4311.png`,
        `${figma}imgIPhone16Plus4191.png`,
        `${figma}imgIPhone16Plus4491.png`,
        `${figma}imgIPhone1415ProMax421.png`,
      ],
    },
    'aws-skill-builder': {
      previews: [
        `${figma}archive/aws-skill-builder.png`,
        `${figma}imgRankS1.png`,
        `${figma}imgRectangle29.png`,
        `${figma}SBD%20NEW.png`,
      ],
    },
    bantay: {
      previews: [
        `${figma}imgImage22.png`,
        `${figma}imgImage20.png`,
        `${figma}imgImage21.png`,
      ],
    },
  } satisfies Partial<Record<ProjectId, { previews: string[] }>>,
  experience: {
    screenshots: [
      `${figma}imgRectangle24.png`,
      `${figma}imgRectangle25.png`,
      `${figma}imgRectangle29.png`,
    ],
    laminaScreenshots: [
      `${figma}iPhone%2014%20Plus%20-%2021.png`,
      `${figma}iPhone%2014%20Plus%20-%2019.png`,
      `${figma}iPhone%2014%20Plus%20-%2020.png`,
      `${figma}Group%2046882.png`,
    ],
    badge: `${figma}img111.png`,
    logo: `${figma}img101.png`,
  },
  about: {
    photo: `${figma}imgImage16.png`,
    software: {
      figma: `${figma}imgImage13.png`,
      'after-effects': `${figma}imgImage87.png`,
      procreate: `${figma}imgImage88.png`,
      affinity: `${figma}affinity-app.png`,
    } satisfies Partial<Record<SoftwareId, string>>,
  },
  contact: {
    gmail: `${figma}imgThesvgGmail.svg`,
    email: `${figma}imgClarityEmailLine.svg`,
    linkedin: `${figma}imgAntDesignLinkedinOutlined.svg`,
    github: `${figma}imgGroup4.svg`,
    cursor: `${figma}imgGroup5.svg`,
  },
  // Only preload the hero toolbar icons; below-the-fold media loads near the viewport.
  preload: [
    `${figma}imgImage13.png`,
    `${figma}imgImage14.png`,
    `${figma}imgImage15.png`,
  ],
}
