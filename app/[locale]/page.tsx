import { useTranslations } from 'next-intl'
import SkinConverter from '@/components/SkinConverter'

function HowItWorks() {
  const t = useTranslations('HowItWorks')
  const steps = [
    { num: '1', icon: '📷', title: t('step1Title'), desc: t('step1Desc') },
    { num: '2', icon: '✨', title: t('step2Title'), desc: t('step2Desc') },
    { num: '3', icon: '🎮', title: t('step3Title'), desc: t('step3Desc') },
  ]

  return (
    <section className="py-20 px-4 bg-cream-dark" id="how-it-works">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-center text-2xl font-extrabold text-earth mb-12" style={{ fontFamily: 'var(--font-pixel)', fontSize: '1.1rem', lineHeight: 2 }}>
          {t('title')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step) => (
            <div key={step.num} className="flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-md"
                style={{ background: 'var(--color-cream)', border: '3px solid var(--color-green-grass)' }}>
                {step.icon}
              </div>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                style={{ background: 'var(--color-green-mine)' }}>
                {step.num}
              </div>
              <h3 className="font-extrabold text-lg text-earth">{step.title}</h3>
              <p className="text-earth-soft leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Hero() {
  const t = useTranslations('Hero')
  return (
    <section className="py-16 px-4 text-center relative overflow-hidden"
      style={{ background: 'linear-gradient(160deg, var(--color-green-dark) 0%, var(--color-green-mine) 60%, var(--color-green-grass) 100%)' }}>
      {/* Decorative pixel grid overlay */}
      <div className="absolute inset-0 opacity-10"
        style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 31px, rgba(255,255,255,.3) 31px, rgba(255,255,255,.3) 32px), repeating-linear-gradient(90deg, transparent, transparent 31px, rgba(255,255,255,.3) 31px, rgba(255,255,255,.3) 32px)' }} />
      <div className="relative z-10 max-w-2xl mx-auto">
        <span className="inline-block px-4 py-2 rounded-full text-sm font-bold mb-6"
          style={{ background: 'rgba(255,255,255,0.2)', color: 'white', backdropFilter: 'blur(4px)' }}>
          {t('badge')}
        </span>
        <h1 className="text-white font-extrabold mb-6 leading-tight"
          style={{ fontFamily: 'var(--font-pixel)', fontSize: 'clamp(1.2rem, 5vw, 2rem)', lineHeight: 1.6 }}>
          {t('title').split('\n').map((line, i) => (
            <span key={i}>{line}{i === 0 && <br />}</span>
          ))}
        </h1>
        <p className="text-green-100 text-lg mb-8 leading-relaxed max-w-lg mx-auto">
          {t('subtitle')}
        </p>
        <a href="#converter"
          className="inline-block px-8 py-4 rounded-2xl text-lg font-bold transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-1 active:translate-y-0"
          style={{ background: 'var(--color-cream)', color: 'var(--color-green-mine)' }}>
          {t('cta')} →
        </a>
        <p className="mt-6 text-green-200 text-sm">
          ↓ {t('scrollHint')}
        </p>
      </div>
    </section>
  )
}

export default function HomePage() {
  return (
    <>
      <Hero />
      <HowItWorks />
      <section id="converter" className="py-16 px-4">
        <div className="max-w-2xl mx-auto">
          <SkinConverter />
        </div>
      </section>
    </>
  )
}
