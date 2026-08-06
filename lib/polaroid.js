// Membungkus foto dengan bingkai polaroid (browser, pakai canvas).
// caption = { title, subtitle } (opsional). Kembalikan Blob JPEG.

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

export async function toPolaroidBlob(src, caption = {}) {
  const title = (caption.title || '').toString().trim()
  const subtitle = (caption.subtitle || '').toString().trim()

  const img = await loadImage(src)
  const iw = img.naturalWidth || img.width
  const ih = img.naturalHeight || img.height

  const border = Math.round(iw * 0.06)
  const bottom = Math.round(iw * 0.26)
  const W = iw + border * 2
  const H = ih + border + bottom

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
    ctx.font = `700 ${Math.round(iw * 0.055)}px "Segoe Script", "Bradley Hand", "Comic Sans MS", cursive, sans-serif`
    ctx.fillText(title, cx, capTop + bottom * 0.4, iw)
    ctx.fillStyle = '#7a7268'
    ctx.font = `${Math.round(iw * 0.038)}px -apple-system, "Segoe UI", sans-serif`
    ctx.fillText(subtitle, cx, capTop + bottom * 0.72, iw)
  } else if (title || subtitle) {
    ctx.fillStyle = '#2c2822'
    ctx.font = `700 ${Math.round(iw * 0.055)}px "Segoe Script", "Bradley Hand", "Comic Sans MS", cursive, sans-serif`
    ctx.fillText(title || subtitle, cx, capTop + bottom * 0.5, iw)
  }

  return await new Promise((r) => canvas.toBlob(r, 'image/jpeg', 0.92))
}
