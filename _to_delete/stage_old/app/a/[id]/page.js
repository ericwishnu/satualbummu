'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import { processImage, FILM_PRESETS, DEFAULT_PRESET } from '@/lib/filmPresets'

export default function Capture({ params }) {
  const albumId = params.id
  const [album, setAlbum] = useState(null)
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [sent, setSent] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  const fileRef = useRef(null)

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('albums').select('*').eq('id', albumId).single()
      setAlbum(data)
      setLoading(false)
    }
    load()
    try {
      const n = localStorage.getItem('uploaderName')
      if (n) setName(n)
    } catch (e) {}
  }, [albumId])

  async function handleFiles(e) {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    if (!name.trim()) {
      setErr('Isi namamu dulu ya, biar tahu siapa yang motret.')
      if (fileRef.current) fileRef.current.value = ''
      return
    }
    try { localStorage.setItem('uploaderName', name.trim()) } catch (e) {}
    setErr('')
    setMsg('')
    setUploading(true)

    const preset = (album && album.film_preset) || DEFAULT_PRESET
    let ok = 0
    for (const file of files) {
      const processed = await processImage(file, preset)
      const path = `${albumId}/${crypto.randomUUID()}.jpg`
      const { error: upErr } = await supabase.storage
        .from('photos')
        .upload(path, processed, { contentType: 'image/jpeg' })
      if (upErr) {
        setErr('Gagal upload: ' + upErr.message)
        continue
      }
      const { error: insErr } = await supabase
        .from('photos')
        .insert({ album_id: albumId, storage_path: path, uploader_name: name.trim() })
      if (!insErr) ok++
    }
    setUploading(false)
    setSent((c) => c + ok)
    if (ok > 0) setMsg(`${ok} foto terkirim! 📷`)
    if (fileRef.current) fileRef.current.value = ''
  }

  if (loading) return <p className="sub">Memuat…</p>
  if (!album) {
    return (
      <div>
        <h1>Album tidak ditemukan</h1>
        <p className="sub">Link mungkin salah, atau album sudah dihapus.</p>
      </div>
    )
  }

  const presetLabel = FILM_PRESETS[album.film_preset]?.label

  return (
    <div>
      <h1>{album.name}</h1>
      <p className="sub">Ambil foto untuk album ini. Fotonya akan tergabung dengan jepretan tamu lain.</p>

      <div className="card">
        <label>Namamu</label>
        <input
          type="text"
          placeholder="Nama kamu"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          ref={fileRef}
          id="cam"
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          onChange={handleFiles}
          style={{ display: 'none' }}
        />
        <label htmlFor="cam" className="btn" style={{ cursor: uploading ? 'not-allowed' : 'pointer' }}>
          {uploading ? 'Mengunggah…' : '📷 Ambil / pilih foto'}
        </label>

        {presetLabel ? (
          <p className="sub" style={{ marginTop: 12, fontSize: 13, textAlign: 'center' }}>
            Filter album: <strong>{presetLabel}</strong>
          </p>
        ) : null}

        {err ? <div className="error">{err}</div> : null}
        {msg ? <div className="ok">{msg}</div> : null}
        {sent > 0 ? (
          <p style={{ marginTop: 14 }}>
            <span className="count-pill">Kamu sudah kirim {sent} foto</span>
          </p>
        ) : null}
      </div>

      <p className="sub" style={{ textAlign: 'center' }}>
        <Link className="link" href={`/a/${albumId}/galeri`}>Lihat galeri →</Link>
      </p>
    </div>
  )
}
