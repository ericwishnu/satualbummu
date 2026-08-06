'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Login() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || 'Gagal masuk.')
        setLoading(false)
        return
      }
      router.replace('/admin')
    } catch (e) {
      setError('Gagal terhubung ke server.')
      setLoading(false)
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-logo">📷</div>
        <h1 className="auth-title">SatuAlbumMu</h1>
        <p className="auth-tagline">Kamera sekali pakai digital untuk acaramu</p>

        <form onSubmit={submit} className="auth-form">
          <label>Password admin</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoFocus
          />
          {error ? <div className="error">{error}</div> : null}
          <button className="btn" type="submit" disabled={loading}>
            {loading ? 'Memeriksa…' : 'Masuk'}
          </button>
        </form>

        <p className="auth-foot">Masuk untuk membuat &amp; mengelola album</p>
      </div>
    </div>
  )
}
