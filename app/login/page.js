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
    <div>
      <h1><span className="brand">SatuAlbumMu</span></h1>
      <p className="sub">Masuk sebagai admin untuk mengelola album.</p>
      <div className="card">
        <form onSubmit={submit}>
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
      </div>
    </div>
  )
}
