/**
 * Parser de subtítulos VTT y SRT
 */

/**
 * Convierte tiempo en formato "HH:MM:SS,mmm" o "HH:MM:SS.mmm" a segundos
 * @param {string} timeString 
 * @returns {number}
 */
function parseTimeToSeconds(timeString) {
  // Formato: "00:00:10,500" (SRT) o "00:00:10.500" (VTT)
  const parts = timeString.replace(',', '.').split(':')
  
  if (parts.length === 3) {
    const hours = parseFloat(parts[0])
    const minutes = parseFloat(parts[1])
    const seconds = parseFloat(parts[2])
    
    return hours * 3600 + minutes * 60 + seconds
  }
  
  return 0
}

/**
 * Parser para archivos SRT
 * @param {string} srtContent 
 * @returns {Array}
 */
export function parseSRT(srtContent) {
  const subtitles = []
  const blocks = srtContent.trim().split(/\n\s*\n/)
  
  for (const block of blocks) {
    const lines = block.trim().split('\n')
    
    if (lines.length >= 3) {
      // Línea 1: número de subtítulo
      // Línea 2: timestamps
      // Línea 3+: texto
      
      const timestampLine = lines[1]
      const timestampMatch = timestampLine.match(/(\d{2}:\d{2}:\d{2},\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2},\d{3})/)
      
      if (timestampMatch) {
        const startTime = parseTimeToSeconds(timestampMatch[1])
        const endTime = parseTimeToSeconds(timestampMatch[2])
        const text = lines.slice(2).join(' ').trim()
        
        subtitles.push({
          startTime,
          endTime,
          text
        })
      }
    }
  }
  
  return subtitles
}

/**
 * Parser para archivos VTT (WebVTT)
 * @param {string} vttContent 
 * @returns {Array}
 */
export function parseVTT(vttContent) {
  const subtitles = []
  
  // Remover header "WEBVTT"
  const content = vttContent.replace(/^WEBVTT\s*\n/, '').trim()
  const blocks = content.split(/\n\s*\n/)
  
  for (const block of blocks) {
    const lines = block.trim().split('\n')
    
    if (lines.length >= 2) {
      // Puede tener identificador opcional en la primera línea
      let timestampLine = lines[0]
      let textStartIndex = 1
      
      // Si la primera línea no tiene "-->", entonces es un identificador
      if (!timestampLine.includes('-->')) {
        timestampLine = lines[1]
        textStartIndex = 2
      }
      
      const timestampMatch = timestampLine.match(/(\d{2}:\d{2}:\d{2}\.\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}\.\d{3})/)
      
      if (timestampMatch) {
        const startTime = parseTimeToSeconds(timestampMatch[1])
        const endTime = parseTimeToSeconds(timestampMatch[2])
        const text = lines.slice(textStartIndex).join(' ').trim()
        
        subtitles.push({
          startTime,
          endTime,
          text
        })
      }
    }
  }
  
  return subtitles
}

/**
 * Parser automático que detecta el formato
 * @param {string} content 
 * @returns {Array}
 */
export function parseSubtitles(content) {
  if (!content || typeof content !== 'string') {
    return []
  }
  
  // Detectar formato por la presencia de "WEBVTT"
  if (content.trim().startsWith('WEBVTT')) {
    return parseVTT(content)
  } else {
    return parseSRT(content)
  }
}

export default {
  parseSRT,
  parseVTT,
  parseSubtitles
}
