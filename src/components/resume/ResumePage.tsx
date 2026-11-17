import { ArrowDownToLine, ExternalLink, GraduationCap } from 'lucide-react'
import { ContactSection } from '../contact/ContactSection'
import { Footer } from '../contact/Footer'
import { assets } from '../../lib/assets'
import { linkedinUrl } from '../../lib/data'
import { rememberResumeViewPosition } from '../../lib/scroll'
import { GlassTileWaveGrid } from './GlassTileWaveGrid'
import './ResumePage.css'

const resumePdf = '/assets/Michael_Richmond_Racelis_Resume.pdf'
const resumePreview = '/assets/resume-pdf-preview.png'

const education = {
  school: 'Polytechnic University of the Philippines',
  degree: 'B.S. in Computer Science',
  focus: 'UI/UX Design & Frontend Development',
}

const experience = [
  {
    logo: assets.experience.logo,
    logoAlt: 'Lamina Studios',
    round: false,
    role: 'UI/UX Designer',
    company: 'Lamina Studios',
    duration: '2 mos',
  },
  {
    logo: assets.experience.badge,
    logoAlt: 'AWS Cloud Club PUP',
    round: true,
    role: 'UI/UX Designer',
    company: 'AWS Cloud Club PUP',
    duration: '2 years & 2 mos',
  },
]

function BackIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinejoin="round"
      strokeLinecap="round"
    >
      <path d="M18 5.5v13a1 1 0 0 1-1.5.86l-11.2-6.5a1 1 0 0 1 0-1.72l11.2-6.5A1 1 0 0 1 18 5.5Z" />
    </svg>
  )
}

export function ResumePage() {
  return (
    <div className="rp">
      <GlassTileWaveGrid />
      <main className="rp-main">
        <div className="rp-top">
          <button
            type="button"
            className="rp-back"
            aria-label="Back to portfolio"
            onClick={() => {
              window.location.hash = '#resume-return'
            }}
          >
            <BackIcon />
          </button>
          <a
            className="rp-pill rp-pill--fill rp-connect"
            href={linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink aria-hidden />
            Connect
          </a>
        </div>

        <header className="rp-head">
          <p className="rp-eyebrow">Resume</p>
          <h1 className="rp-title">/ Curriculum Vitae</h1>
        </header>

        <div className="rp-grid">
          <div className="rp-preview">
            <img
              src={resumePreview}
              alt="Preview of Michael Richmond Racelis’s résumé"
            />
          </div>

          <div>
            <p className="rp-text rp-intro">
              I’m a Computer Science student with an interest in UI/UX design and frontend development. I enjoy turning
              ideas into clean, functional interfaces and creating digital experiences that are simple and easy to use.
            </p>

            <div className="rp-actions">
              <a
                className="rp-pill rp-pill--fill rp-action"
                href={resumePdf}
                download="Michael_Richmond_Racelis_Resume.pdf"
              >
                <ArrowDownToLine aria-hidden />
                Download Resume
              </a>
              <a
                className="rp-pill rp-pill--line rp-action"
                href={resumePdf}
                onClick={rememberResumeViewPosition}
                aria-label="View résumé PDF"
              >
                <ExternalLink aria-hidden />
                View Resume
              </a>
            </div>

            <section className="rp-edu" aria-labelledby="resume-education-title">
              <h2 id="resume-education-title" className="rp-section-title">Education</h2>
              <div className="rp-profile-row">
                <span className="rp-education-mark" aria-hidden="true">
                  <GraduationCap />
                </span>
                <div className="rp-profile-copy">
                  <h3 className="rp-entry-title rp-edu-degree"><strong>{education.degree}</strong> | {education.focus}</h3>
                  <p className="rp-muted">{education.school}</p>
                </div>
              </div>
            </section>

            <section className="rp-exp" aria-labelledby="resume-experience-title">
              <h2 id="resume-experience-title" className="rp-section-title">Experience</h2>
              <ul className="rp-profile-list">
                {experience.map((item) => (
                  <li key={item.company} className="rp-profile-row">
                    <span className={`rp-logo-frame${item.round ? ' rp-logo-frame--round' : ''}`}>
                      <img
                        className={`rp-logo${item.round ? ' rp-logo--round' : ''}`}
                        src={item.logo}
                        alt={item.logoAlt}
                      />
                    </span>
                    <div className="rp-profile-copy">
                      <h3 className="rp-entry-title">{item.role} | <strong>{item.company}</strong></h3>
                      <p className="rp-muted">{item.duration}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      </main>

      <div className="rp-footer-space">
        <ContactSection />
        <Footer />
      </div>
    </div>
  )
}
