// Preset "look" film. Diterapkan ke setiap foto di sisi browser sebelum diunggah,
// jadi semua foto dalam satu album terlihat seragam — seperti satu roll film.

export const FILM_PRESETS = {
  none: {
    label: 'Tanpa filter',
    filter: 'none',
  },
  klasik: {
    label: 'Klasik (hangat)',
    filter: 'contrast(1.08) saturate(1.15) sepia(0.12) brightness(1.02)',
  },
  portra: {
    label: 'Portra 400 (lembut)',
    filter: 'contrast(1.05) saturate(1.10) sepia(0.18) brightness(1.05)',
  },
  cinestill: {
    label: 'CineStill 800T (dingin)',
    filter: 'contrast(1.12) saturate(1.20) brightness(0.98) hue-rotate(8deg)',
  },
  bw: {
    label: 'Ilford HP5 (hitam putih)',
    filter: 'grayscale(1) contrast(1.15) brightness(1.03)',
  },
}

export const DEFAULT_PRESET = 'klasik'

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

function readAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// Terapkan preset + kecilkan ukuran, hasilkan Blob JPEG siap unggah.
export async function processImage(file, presetKey, maxDim = 1600) {
  try {
    const preset = FILM_PRESETS[presetKey] || FILM_PRESETS.none
    const dataUrl = await readAsDataURL(file)
    const img = await loadImage(dataUrl)

    let width = img.naturalWidth || img.width
    let height = img.naturalHeight || img.height
    const longest = Math.max(width, height)
    if (longest > maxDim) {
      const scale = maxDim / longest
      width = Math.round(width * scale)
      height = Math.round(height * scale)
    }

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')

    if (preset.filter && preset.filter !== 'none' && 'filter' in ctx) {
      ctx.filter = preset.filter
    }
    ctx.drawImage(img, 0, 0, width, height)

    const blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', 0.9)
    )
    return blob || file
  } catch (e) {
    // Kalau pemrosesan gagal (browser lama, dll), unggah foto asli saja.
    return file
  }
}
