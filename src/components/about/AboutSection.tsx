import { Plus } from 'lucide-react'
import { IdCard } from './IdCard'
import { PillButton } from '../ui/PillButton'
import { assets } from '../../lib/assets'
import { about, linkedinUrl, software } from '../../lib/data'
import { rememberResumeReturnPosition } from '../../lib/scroll'
import { usePageNavigation } from '../../lib/PageNavigationContext'

export function AboutSection() {
  const navigateToHash = usePageNavigation()
  const icons = software.flatMap((s) => {
    const src = assets.about.software[s.id]
    return src ? [{ ...s, src }] : []
  })

  return (
    <section id="about" className="mx-auto w-full max-w-[1280px] px-6 py-20 sm:px-10 lg:px-[6%]">
      <div className="mx-auto grid w-full max-w-[53rem] items-center gap-10 md:grid-cols-[minmax(0,20rem)_minmax(0,29rem)] md:gap-16">
        <IdCard />
        <div>
          <p className="text-[clamp(1.4rem,2.6vw,2.2rem)] leading-snug font-light">{about.statement}</p>

          {/* Shown only once at least one software icon has been supplied. */}
          {icons.length > 0 && (
            <div className="mt-8">
              <p className="text-[clamp(1.15rem,1.8vw,1.7rem)] font-light">{about.softwareLabel}</p>
              <ul className="mt-3 flex gap-3">
                {icons.map(({ id, label, src }) => (
                  <li key={id}>
                    <img src={src} alt={label} className="size-10 rounded-xl object-contain sm:size-12" />
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* No destinations decided yet. */}
          <div className="mt-6 flex flex-wrap gap-3">
            <PillButton
              variant="outline"
              href={linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              icon={<Plus size={14} aria-hidden />}
            >
              {about.buttons.connect}
            </PillButton>
            <PillButton variant="dark" onClick={() => {
              rememberResumeReturnPosition()
              navigateToHash('#resume')
            }}>
              {about.buttons.resume}
            </PillButton>
          </div>
        </div>
      </div>
    </section>
  )
}
