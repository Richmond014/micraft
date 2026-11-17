export type ProjectId = 'loop' | 'aws-skill-builder' | 'bantay'
export type HeroIconId = 'procreate' | 'after-effects' | 'palette' | 'figma'
export type SoftwareId = 'figma' | 'after-effects' | 'procreate' | 'affinity'

const figma = '/assets/figma/'

const pngResponsiveImageSources = new Set([
  `${figma}img4848151511.png`,
  `${figma}imgRankS1.png`,
  `${figma}imgRectangle24.png`,
  `${figma}imgRectangle25.png`,
  `${figma}imgRectangle29.png`,
  `${figma}imgReportManagement1.png`,
  `${figma}img111.png`,
  `${figma}img101.png`,
  `${figma}imgImage16.png`,
  `${figma}imgImage13.png`,
  `${figma}imgImage14.png`,
  `${figma}imgImage15.png`,
  `${figma}BANTAY%20ASSETS/image%2046.png`,
  `${figma}imgImage22.png`,
  `${figma}imgImage20.png`,
  `${figma}imgImage21.png`,
  `${figma}loop-case-study/iphone16-pro.png`,
  `${figma}e1751dca-f67f-40b6-9247-9e4b5cb4128f.png`,
  `${figma}c34653c4-c65b-4750-afa9-4f1abc415358.png`,
  `${figma}711fc84d-4c54-4117-ac54-edda6edc819a.png`,
  `${figma}54ce973a-9c94-4a27-ab4d-12fdaa9f7a51.png`,
  `${figma}dd3c9a7d-421e-4026-9821-af9cb0bc1beb.png`,
  `${figma}9d96c964-ddc3-49d8-a380-2bd3d2dd9299.png`,
  `${figma}35e3e97d-17f8-4397-b055-7fe4543eaf5d.png`,
  `${figma}9706bff9-e649-43f0-8467-0961c6410ac4.png`,
  `${figma}c8ff57a5-c775-4b41-a1e5-3d139adc33b8.png`,
  `${figma}report-details-cropped.png`,
  `${figma}197b6d7c-5e04-45e8-a3e8-da60bcdff892.png`,
  `${figma}35961125-0c95-4298-b007-ccb795b17567.png`,
  `${figma}86439af7-761e-4f3f-8393-bfbd713ed043.png`,
  `${figma}197f33ff-00aa-4a24-a899-3f8ebd74588c.png`,
  `${figma}97a3c191-5e85-4c69-9e4f-6592d42db45b.png`,
  `${figma}SBD%20NEW.png`,
  `${figma}loop-case-study/iphone13-pro.png`,
  `${figma}loop-case-study/iphone16.png`,
  `${figma}loop-case-study/rectangle47.png`,
  `${figma}loop-case-study/loop-phone-wooden-hands.png`,
  `${figma}loop-case-study/image102.png`,
  `${figma}loop-case-study/image93.png`,
  `${figma}loop-case-study/moodboard-composition.png`,
])

const responsiveImageSources = new Set([
  ...pngResponsiveImageSources,
  `${figma}AWS%20TECHTEAM/HERO.png`,
  `${figma}AWS%20TECHTEAM/ZenBook%20Duo%2014.png`,
  `${figma}AWS%20TECHTEAM/Group%20114.png`,
  `${figma}AWS%20TECHTEAM/Group%20116.png`,
  `${figma}AWS%20TECHTEAM/Group%20117.png`,
])

const supportsWebP = typeof document !== 'undefined'
  && document.createElement('canvas').toDataURL('image/webp').startsWith('data:image/webp')

export function getResponsiveImageSrcSet(
  src: string,
  widths: readonly number[] = [400, 800, 1200],
  originalWidth?: number,
) {
  if (!responsiveImageSources.has(src)) return undefined
  if (!supportsWebP && !pngResponsiveImageSources.has(src)) return undefined

  const base = src.replace(/\.png$/i, '')
  const extension = supportsWebP ? 'webp' : 'png'
  const candidates = widths.map((width) => `${base}-${width}w.${extension} ${width}w`)
  if (originalWidth) candidates.push(`${src} ${originalWidth}w`)
  return candidates.join(', ')
}

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
        `${figma}imgRectangle25.png`,
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
}
