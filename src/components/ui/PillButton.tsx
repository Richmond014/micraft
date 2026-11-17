import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import { useReducedMotion } from '../../hooks/useMediaQuery'
import { springs } from '../../lib/springs'

type Props = {
  variant: 'outline' | 'dark'
  icon?: ReactNode
  children: ReactNode
  onClick?: () => void
  href?: string
  target?: string
  rel?: string
}

const styles = {
  outline: 'border border-[#c7c7cc] bg-gradient-to-b from-white to-[#f0f0f3] text-[#1d1d1f] shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_1px_2px_rgba(0,0,0,0.08)] hover:border-[#aaaab0] hover:to-[#e8e8ed] hover:shadow-[inset_0_1px_0_#fff,0_4px_10px_rgba(0,0,0,0.12)]',
  dark: 'border border-[#5b5b60] bg-gradient-to-b from-[#77777d] via-[#5d5d63] to-[#45454a] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_2px_5px_rgba(0,0,0,0.2)] hover:border-[#4c4c51] hover:from-[#85858a] hover:via-[#68686e] hover:to-[#4d4d52] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.34),0_5px_12px_rgba(0,0,0,0.24)]',
}

export function PillButton({ variant, icon, children, onClick, href, target, rel }: Props) {
  const reduced = useReducedMotion()
  const motionProps = {
    whileHover: reduced ? undefined : { y: -1, scale: 1.025 },
    whileTap: reduced ? undefined : { y: 0, scale: 0.97 },
    transition: springs.tactile,
    className: `inline-flex h-10 items-center gap-2 rounded-full px-5 text-sm font-medium transition-[background,border-color,box-shadow] duration-200 ease-out outline-offset-3 focus-visible:outline-2 focus-visible:outline-[#007aff] ${styles[variant]}`,
  }
  const content = (
    <>
      {icon}
      {children}
    </>
  )

  if (href) {
    return (
      <motion.a href={href} target={target} rel={rel} {...motionProps}>
        {content}
      </motion.a>
    )
  }

  return (
    <motion.button type="button" onClick={onClick} {...motionProps}>
      {content}
    </motion.button>
  )
}
