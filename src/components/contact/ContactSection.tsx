import { motion } from 'motion/react'
import { DeferredImage } from '../ui/DeferredImage'
import { contactChannels } from '../../lib/data'
import { assets } from '../../lib/assets'
import { useReducedMotion } from '../../hooks/useMediaQuery'
import { useSound } from '../../hooks/useSound'
import { springs } from '../../lib/springs'

const keyClass = 'relative grid size-[113px] place-items-center rounded-[6px] border border-[#1528b5] bg-[#0010a9] shadow-[0_15px_4px_rgba(0,0,0,0.25)]'

export function ContactSection() {
  const reduced = useReducedMotion()
  const { play } = useSound()

  return (
    <motion.section
      id="contact"
      aria-labelledby="contact-title"
      initial={reduced ? false : { opacity: 0, y: 20 }}
      whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="mx-auto flex w-full max-w-[1280px] flex-col items-center px-6 py-20 text-center sm:px-10 lg:px-[6%]"
    >
      <h2 id="contact-title" className="max-w-[36rem] text-[clamp(1.65rem,2.6vw,2.5rem)] leading-tight font-light">
        Have a project in mind? Feel free to reach out!
      </h2>
      <motion.a
        href="#contact-options"
        onClick={() => play('press')}
        whileHover={reduced ? undefined : { y: -2 }}
        whileTap={reduced ? undefined : { scale: 0.98 }}
        transition={springs.tactile}
        className="mt-6 rounded-full border border-neutral-300 bg-neutral-100/70 px-6 py-3 text-sm transition-colors hover:bg-neutral-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black"
      >
        Send me a message
      </motion.a>

      <motion.ul id="contact-options" className="mt-10 grid grid-cols-2 gap-x-[35px] gap-y-8 sm:grid-cols-4">
        {contactChannels.map((channel, index) => (
          <motion.li
            key={channel.id}
            initial={reduced ? false : { opacity: 0, y: 14 }}
            whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
            whileHover={{ zIndex: 10 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ duration: 0.55, delay: reduced ? 0 : index * 0.08, ease: [0.22, 1, 0.36, 1] }}
            className="relative flex items-center justify-center hover:z-10 focus-within:z-10"
          >
            <motion.a
              href={channel.href}
              target={channel.href.startsWith('https://') ? '_blank' : undefined}
              rel={channel.href.startsWith('https://') ? 'noopener noreferrer' : undefined}
              aria-label={channel.label}
              onClick={() => play('press')}
              whileHover={reduced ? undefined : { y: -8, scale: 1.12 }}
              whileFocus={reduced ? undefined : { y: -8, scale: 1.12 }}
              whileTap={reduced ? undefined : { y: 1, scale: 0.96 }}
              transition={springs.soft}
              className={`group ${keyClass} cursor-pointer outline-offset-4 focus-visible:outline-2 focus-visible:outline-black`}
            >
              <span
                aria-hidden="true"
                className={`pointer-events-none absolute bottom-full left-1/2 mb-3 -translate-x-1/2 translate-y-1 scale-95 whitespace-nowrap rounded-md border border-white/10 bg-[#202124] px-3 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg group-hover:translate-y-0 group-hover:scale-100 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:scale-100 group-focus-visible:opacity-100 ${
                  reduced ? 'transition-none' : 'transition-[opacity,transform] duration-200 ease-out'
                }`}
              >
                {channel.label}
              </span>
              <span className="absolute top-[4.5%] left-[14.7%] grid h-[78%] w-[70.6%] place-items-center overflow-hidden rounded-[6px] border border-white/25 bg-[linear-gradient(145deg,#334cf2_0%,#1b33c7_55%,#10249b_100%)] shadow-[inset_0_2px_5px_rgba(255,255,255,0.28),inset_0_-4px_6px_rgba(0,0,0,0.32)]">
                <DeferredImage src={assets.contact[channel.id]} alt="" width={50} height={50} />
              </span>
            </motion.a>
          </motion.li>
        ))}
      </motion.ul>
    </motion.section>
  )
}