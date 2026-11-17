import { useState } from 'react'
import { ScreenshotGallery } from './ScreenshotGallery'
import { RoleCards, type ExperienceId } from './RoleCards'
import { assets } from '../../lib/assets'
import { journey } from '../../lib/data'

export function ExperienceSection() {
  const [activeRole, setActiveRole] = useState<ExperienceId>('aws')
  const screenshots = activeRole === 'aws' ? assets.experience.screenshots : assets.experience.laminaScreenshots
  const descriptions = activeRole === 'aws' ? [journey.description] : journey.laminaDescription

  return (
    <section id="experience" className="mx-auto w-full max-w-[1280px] overflow-x-clip px-6 pt-12 pb-20 sm:px-10 lg:px-[6%]">
      <header className="text-center">
        <h2 className="text-[clamp(1.5rem,2.6vw,2.25rem)] leading-tight font-bold">{journey.title}</h2>
        <p className="mt-1 text-[clamp(0.8rem,1vw,1rem)]">{journey.subtitle}</p>
      </header>

      <div className="mx-auto mt-12 grid w-full max-w-[53rem] gap-10 min-[900px]:grid-cols-[minmax(0,26rem)_minmax(0,24rem)] min-[900px]:items-start min-[900px]:gap-12">
        <RoleCards activeId={activeRole} onActiveChange={setActiveRole} />
        <div className="flex flex-col gap-3">
          {descriptions.map((description) => (
            <p key={description} className="max-w-md text-sm leading-snug font-light text-neutral-500 sm:text-base">{description}</p>
          ))}
          <ScreenshotGallery screenshots={screenshots} />
        </div>
      </div>
    </section>
  )
}
