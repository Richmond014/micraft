import { FloatingIcons } from './FloatingIcons'
import { PenPath } from './PenPath'
import { Toolbar } from './Toolbar'

export function Hero() {
  return (
    <section id="top" className="relative flex min-h-svh items-center justify-center overflow-x-clip px-6 pt-28 pb-16">
      <div className="relative w-fit origin-center scale-[0.86]">
        <div className="relative">
          <span className="absolute -top-[60px] left-1/2 -translate-x-1/2 border border-dashed border-[#1d1d1f] bg-white/80 px-4 py-[9px] text-[21px] leading-[1.16] font-light tracking-[-0.02em] text-[#1d1d1f] shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
            UI/UX Portfolio
            <span aria-hidden className="absolute -top-1 -left-1 size-2 border border-[#1d1d1f] bg-white" />
            <span aria-hidden className="absolute -top-1 -right-1 size-2 border border-[#1d1d1f] bg-white" />
            <span aria-hidden className="absolute -bottom-1 -left-1 size-2 border border-[#1d1d1f] bg-white" />
            <span aria-hidden className="absolute -right-1 -bottom-1 size-2 border border-[#1d1d1f] bg-white" />
          </span>
          <h1 className="text-center text-[28px] leading-[1.2] font-normal tracking-normal sm:text-[40px] lg:text-[50px]">
            <span className="block">Rooted in curiosity,</span>
            <span className="block">driven by people, and</span>
            <span className="block">
              shaped by experience.
            </span>
          </h1>
          <span
            aria-hidden
            className="absolute top-1 -right-3 -bottom-4 w-[3px] bg-editor-blue before:absolute before:-top-[3.5px] before:-left-[2.5px] before:size-2 before:border before:border-editor-blue before:bg-white before:content-[''] after:absolute after:-bottom-[3.5px] after:-left-[2.5px] after:size-2 after:border after:border-editor-blue after:bg-white after:content-['']"
          />
          <span
            aria-hidden
            className="absolute -right-3 -bottom-4 left-0 h-[3px] bg-editor-blue before:absolute before:-top-[2.5px] before:-left-[3.5px] before:size-2 before:border before:border-editor-blue before:bg-white before:content-[''] after:absolute after:-top-[2.5px] after:-right-[3.5px] after:size-2 after:border after:border-editor-blue after:bg-white after:content-['']"
          />
        </div>

        <div className="relative z-10 mt-7 flex justify-center">
          <Toolbar />
        </div>

        <PenPath />
        <FloatingIcons />
      </div>
    </section>
  )
}
