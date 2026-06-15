'use client'

import { useEffect, useState } from 'react'
import { useLocale } from 'next-intl'

const STORAGE_KEY = 'makeskins_cookie_consent'

const TEXT: Record<string, { msg: string; accept: string; decline: string; more: string }> = {
  es: {
    msg: 'Usamos cookies de Google AdSense para mostrarte publicidad relevante. ¿Aceptas?',
    accept: 'Aceptar',
    decline: 'Rechazar',
    more: 'Más info',
  },
  en: {
    msg: 'We use Google AdSense cookies to show you relevant ads. Do you accept?',
    accept: 'Accept',
    decline: 'Decline',
    more: 'More info',
  },
  fr: {
    msg: 'Nous utilisons les cookies Google AdSense pour afficher des publicités pertinentes. Acceptes-tu ?',
    accept: 'Accepter',
    decline: 'Refuser',
    more: 'En savoir plus',
  },
  pt: {
    msg: 'Usamos cookies do Google AdSense para exibir publicidade relevante. Aceitas?',
    accept: 'Aceitar',
    decline: 'Recusar',
    more: 'Mais info',
  },
}

export default function CookieBanner() {
  const locale = useLocale()
  const [visible, setVisible] = useState(false)
  const t = TEXT[locale] ?? TEXT.en

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) setVisible(true)
  }, [])

  function accept() {
    localStorage.setItem(STORAGE_KEY, 'accepted')
    setVisible(false)
  }

  function decline() {
    localStorage.setItem(STORAGE_KEY, 'declined')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        background: 'var(--color-earth)',
        borderTop: '3px solid var(--color-green-mine)',
        padding: '16px 20px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: '12px',
        justifyContent: 'space-between',
      }}
    >
      <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.875rem', margin: 0, flex: '1 1 260px' }}>
        {t.msg}{' '}
        <a href={`/${locale}/privacy`} style={{ color: 'var(--color-green-mine)', textDecoration: 'underline' }}>
          {t.more}
        </a>
      </p>
      <div style={{ display: 'flex', gap: '10px', flexShrink: 0 }}>
        <button
          onClick={decline}
          style={{
            padding: '8px 18px',
            borderRadius: '10px',
            border: '2px solid rgba(255,255,255,0.3)',
            background: 'transparent',
            color: 'rgba(255,255,255,0.8)',
            fontSize: '0.875rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {t.decline}
        </button>
        <button
          onClick={accept}
          style={{
            padding: '8px 18px',
            borderRadius: '10px',
            border: 'none',
            background: 'var(--color-green-mine)',
            color: 'white',
            fontSize: '0.875rem',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          {t.accept}
        </button>
      </div>
    </div>
  )
}
