// Membungkus foto dengan bingkai polaroid (browser, pakai canvas).
// caption = nama pengambil (opsional). Kembalikan Blob JPEG.

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

export async function toPolaroidBlob(src, caption) {
  const img = await loadImage(src)
  const iw = img.naturalWidth || img.width
  const ih = img.naturalHeight || img.height

  const border = Math.round(iw * 0.06)   // pinggir kiri/kanan/atas
  const bottom = Math.round(iw * 0.24)   // area bawah untuk caption
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

  if (caption) {
    ctx.fillStyle = '#3a352f'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = `${Math.round(iw * 0.06)}px "Segoe Script", "Bradley Hand", "Comic Sans MS", cursive, sans-serif`
    ctx.fillText(caption, W / 2, border + ih + bottom / 2, iw)
  }

  return await new Promise((r) => canvas.toBlob(r, 'image/jpeg', 0.92))
}
