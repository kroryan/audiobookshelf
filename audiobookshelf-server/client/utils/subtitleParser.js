/**
 * Parser para archivos de subtítulos SRT y VTT
 */

/**
 * Convierte tiempo SRT/VTT a segundos
 * Formatos soportados:
 * - SRT: 00:00:12,500
 * - VTT: 00:00:12.500
 */
function parseTimeToSeconds(timeString) {
  // Reemplazar coma por punto para normalizar
  const normalized = timeString.replace(',', '.')
  
  // Formato: HH:MM:SS.mmm
  const parts = normalized.split(':')
  
  if (parts.length !== 3) {
    console.warn('Formato de tiempo inválido:', timeString)
    return 0
  }
  
  const hours = parseInt(parts[0], 10)
  const minutes = parseInt(parts[1], 10)
  const secondsAndMs = parts[2].split('.')
  const seconds = parseInt(secondsAndMs[0], 10)
  const milliseconds = secondsAndMs[1] ? parseInt(secondsAndMs[1], 10) : 0
  
  return hours * 3600 + minutes * 60 + seconds + milliseconds / 1000
}

/**
 * Parsea archivo SRT
 * Formato:
 * 1
 * 00:00:12,500 --> 00:00:15,000
 * Texto del subtítulo
 */
export function parseSRT(content) {
  const subtitles = []
  
  // Dividir por bloques vacíos
  const blocks = content.trim().split(/\n\s*\n/)
  
  blocks.forEach(block => {
    const lines = block.trim().split('\n')
    
    if (lines.length < 3) return
    
    // Línea 1: índice
    const index = parseInt(lines[0], 10)
    
    // Línea 2: tiempos
    const timeLine = lines[1]
    const timeMatch = timeLine.match(/(\d{2}:\d{2}:\d{2}[,.]\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}[,.]\d{3})/)
    
    if (!timeMatch) return
    
    const startTime = parseTimeToSeconds(timeMatch[1])
    const endTime = parseTimeToSeconds(timeMatch[2])
    
    // Líneas 3+: texto
    const text = lines.slice(2).join('\n')
    
    subtitles.push({
      index,
      startTime,
      endTime,
      text: text.trim()
    })
  })
  
  return subtitles
}

/**
 * Parsea archivo VTT (WebVTT)
 * Formato:
 * WEBVTT
 * 
 * 00:00:12.500 --> 00:00:15.000
 * Texto del subtítulo
 */
export function parseVTT(content) {
  const subtitles = []
  
  // Eliminar header WEBVTT
  const withoutHeader = content.replace(/^WEBVTT.*?\n\n/s, '')
  
  // Dividir por bloques vacíos
  const blocks = withoutHeader.trim().split(/\n\s*\n/)
  
  let index = 1
  blocks.forEach(block => {
    const lines = block.trim().split('\n')
    
    if (lines.length < 2) return
    
    // Primera línea puede ser ID o tiempo
    let timeLineIndex = 0
    let timeLine = lines[0]
    
    // Si la primera línea no tiene '-->', es un ID
    if (!timeLine.includes('-->')) {
      timeLineIndex = 1
      if (lines.length < 3) return
      timeLine = lines[1]
    }
    
    const timeMatch = timeLine.match(/(\d{2}:\d{2}:\d{2}[,.]\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}[,.]\d{3})/)
    
    if (!timeMatch) return
    
    const startTime = parseTimeToSeconds(timeMatch[1])
    const endTime = parseTimeToSeconds(timeMatch[2])
    
    // Texto después de la línea de tiempo
    const text = lines.slice(timeLineIndex + 1).join('\n')
    
    subtitles.push({
      index: index++,
      startTime,
      endTime,
      text: text.trim()
    })
  })
  
  return subtitles
}

/**
 * Detecta formato y parsea automáticamente
 */
export function parseSubtitles(content, format = 'auto') {
  if (!content || typeof content !== 'string') {
    console.warn('Contenido de subtítulos inválido')
    return []
  }
  
  // Autodetección de formato
  if (format === 'auto') {
    if (content.trim().startsWith('WEBVTT')) {
      format = 'vtt'
    } else if (/^\d+\s*\n\d{2}:\d{2}:\d{2},/.test(content.trim())) {
      format = 'srt'
    } else {
      console.warn('No se pudo detectar el formato de subtítulos')
      return []
    }
  }
  
  try {
    if (format === 'vtt') {
      return parseVTT(content)
    } else if (format === 'srt') {
      return parseSRT(content)
    }
  } catch (error) {
    console.error('Error parseando subtítulos:', error)
    return []
  }
  
  return []
}
