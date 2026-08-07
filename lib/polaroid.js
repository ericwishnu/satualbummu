// Membungkus foto dengan bingkai polaroid (browser, pakai canvas).
// caption = { title, subtitle } (opsional). Kembalikan Blob JPEG.
// Judul: Dancing Script (tulisan tangan). Subjudul: Share Tech Mono (monospace).

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

// Pastikan font Google sudah termuat sebelum digambar ke canvas,
// kalau tidak canvas akan diam-diam memakai font cadangan.
async function ensureFonts(specs) {
  try {
    if (typeof document === 'undefined' || !document.fonts || !document.fonts.load) return
    await Promise.all(specs.map((s) => document.fonts.load(s)))
    await document.fonts.ready
  } catch (e) {}
}

export async function toPolaroidBlob(src, caption = {}) {
  const title = (caption.title || '').toString().trim()
  const subtitle = (caption.subtitle || '').toString().trim()

  const img = await loadImage(src)
  const iw = img.naturalWidth || img.width
  const ih = img.naturalHeight || img.height

  const border = Math.round(iw * 0.06)   // pinggir kiri/kanan/atas
  const bottom = Math.round(iw * 0.26)   // area bawah untuk caption
  const W = iw + border * 2
  const H = ih + border + bottom

  // Ukuran & definisi font
  const titleSize = Math.round(iw * 0.085)
  const subSize = Math.round(iw * 0.036)
  const titleFont = `700 ${titleSize}px "Dancing Script", "Segoe Script", "Bradley Hand", cursive`
  const subFont = `${subSize}px "Share Tech Mono", ui-monospace, "SFMono-Regular", Menlo, monospace`

  // Muat font sesuai keperluan sebelum menggambar.
  const need = []
  if (title) need.push(`700 ${titleSize}px "Dancing Script"`)
  if (subtitle) need.push(`${subSize}px "Share Tech Mono"`)
  if (need.length) await ensureFonts(need)

  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')

  ctx.fillStyle = '#fbfbf6'
  ctx.fillRect(0, 0, W, H)

  ctx.drawImage(img, border, border, iw, ih)
  ctx.strokeStyle = 'rgba(0,0,0,0.08)'
  ctx.lineWidth = Math.max(1, Math.round(iw * 0.003))
  ctx.strokeRect(border, border, iw, ih)

  const cx = W / 2
  const capTop = border + ih
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  if (title && subtitle) {
    ctx.fillStyle = '#2c2822'
    ctx.font = titleFont
    ctx.fillText(title, cx, capTop + bottom * 0.4, iw)

    ctx.fillStyle = '#7a7268'
    ctx.font = subFont
    try { ctx.letterSpacing = '1px' } catch (e) {}
    ctx.fillText(subtitle, cx, capTop + bottom * 0.74, iw)
    try { ctx.letterSpacing = '0px' } catch (e) {}
  } else if (title) {
    ctx.fillStyle = '#2c2822'
    ctx.font = titleFont
    ctx.fillText(title, cx, capTop + bottom * 0.5, iw)
  } else if (subtitle) {
    ctx.fillStyle = '#2c2822'
    ctx.font = subFont
    try { ctx.letterSpacing = '1px' } catch (e) {}
    ctx.fillText(subtitle, cx, capTop + bottom * 0.5, iw)
    try { ctx.letterSpacing = '0px' } catch (e) {}
  }

  return await new Promise((r) => canvas.toBlob(r, 'image/jpeg', 0.92))
}
