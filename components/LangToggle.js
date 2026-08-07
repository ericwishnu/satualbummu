'use client'

import { LANGS, setStoredLang } from '@/lib/i18n'

// Tombol ganti bahasa EN/ID, muncul di pojok kanan atas halaman tamu.
export default function LangToggle({ lang, onChange }) {
  return (
    <div className="lang-toggle" role="group" aria-label="Language">
      {LANGS.map((l) => (
        <button
          key={l}
          type="button"
          className={l === lang ? 'active' : ''}
          aria-pressed={l === lang}
          onClick={() => { setStoredLang(l); onChange(l) }}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  )
}
