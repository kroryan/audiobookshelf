const Logger = require('../Logger')
const Database = require('../Database')

class TranscriptionController {
  constructor() {}

  /**
   * Middleware para verificar acceso al library item
   * @param {Request} req
   * @param {Response} res
   * @param {NextFunction} next
   */
  async middleware(req, res, next) {
    // Cargar el library item
    req.libraryItem = await Database.libraryItemModel.getExpandedById(req.params.id)
    if (!req.libraryItem?.media) {
      Logger.warn('[TranscriptionController] Library item not found:', req.params.id)
      return res.sendStatus(404)
    }

    // Verificar que el usuario pueda acceder a este item
    if (!req.user.checkCanAccessLibraryItem(req.libraryItem)) {
      Logger.warn(`[TranscriptionController] User "${req.user.username}" cannot access library item ${req.params.id}`)
      return res.sendStatus(403)
    }

    // Verificar permisos de actualización para POST/DELETE
    if ((req.method === 'POST' || req.method === 'DELETE') && !req.user.canUpdate) {
      Logger.warn(`[TranscriptionController] User "${req.user.username}" attempted to ${req.method} without permission`)
      return res.sendStatus(403)
    }

    next()
  }

  /**
   * POST: /api/items/:id/transcribe
   * Iniciar transcripción de un audiolibro
   * 
   * @this import('../routers/ApiRouter')
   */
  async startTranscription(req, res) {
    Logger.info('[TranscriptionController] startTranscription called for item:', req.libraryItem.id)
    
    try {
      const { language = 'spanish', model = 'large-v3', force = false } = req.body

      // Verificar que el TranscriptionManager esté inicializado
      if (!this.transcriptionManager || !this.transcriptionManager.isInitialized) {
        Logger.error('[TranscriptionController] TranscriptionManager not available')
        return res.status(503).json({ 
          error: 'El sistema de transcripción no está disponible. Verifique que Whisper esté instalado.' 
        })
      }

      // Verificar que el item sea un libro con archivos de audio
      if (req.libraryItem.mediaType !== 'book' || !req.libraryItem.media.audioFiles?.length) {
        return res.status(400).json({ 
          error: 'Solo se pueden transcribir audiolibros con archivos de audio' 
        })
      }

      // Iniciar transcripción asíncrona
      Logger.info('[TranscriptionController] Starting transcription with params:', { language, model, force })
      
      // Llamar al TranscriptionManager de forma asíncrona (no bloqueante)
      this.transcriptionManager.transcribeAudiobook(req.libraryItem, { language, model, force })
        .then(result => {
          Logger.info('[TranscriptionController] Transcription completed successfully:', result)
        })
        .catch(error => {
          Logger.error('[TranscriptionController] Transcription failed:', error)
        })

      // Responder inmediatamente que se inició el proceso
      res.json({ 
        message: 'Transcripción iniciada', 
        status: 'processing',
        language,
        model,
        libraryItemId: req.libraryItem.id
      })

    } catch (error) {
      Logger.error('[TranscriptionController] Error iniciando transcripción:', error)
      res.status(500).json({ error: 'Error interno del servidor' })
    }
  }

  /**
   * GET: /api/items/:id/transcription/status
   * Obtener estado de la transcripción
   * 
   * @this import('../routers/ApiRouter')
   */
  async getTranscriptionStatus(req, res) {
    try {
      const { id: libraryItemId } = req.params

      if (!this.transcriptionManager) {
        return res.json({ status: 'not_available' })
      }

      const status = this.transcriptionManager.getTranscriptionStatus(libraryItemId)
      res.json(status)

    } catch (error) {
      Logger.error('[TranscriptionController] Error obteniendo estado de transcripción:', error)
      res.status(500).json({ error: 'Error interno del servidor' })
    }
  }

  /**
   * GET: /api/items/:id/subtitles
   * Listar subtítulos disponibles
   * 
   * @this import('../routers/ApiRouter')
   */
  async getSubtitles(req, res) {
    try {
      const libraryItemId = req.libraryItem.id
      
      if (!this.transcriptionManager) {
        return res.json([])
      }

      // Buscar archivos de subtítulos disponibles
      const subtitlesDir = require('path').join(global.MetadataPath, 'subtitles', libraryItemId)
      const fs = require('fs')
      
      if (!fs.existsSync(subtitlesDir)) {
        return res.json([])
      }

      const files = fs.readdirSync(subtitlesDir)
      const subtitles = []
      
      // Agrupar por idioma
      const languageMap = new Map()
      
      for (const file of files) {
        const match = file.match(/^(.+)\.(srt|vtt)$/)
        if (match) {
          const language = match[1]
          const format = match[2]
          
          if (!languageMap.has(language)) {
            languageMap.set(language, { srt: false, vtt: false })
          }
          
          languageMap.get(language)[format] = true
        }
      }
      
      // Convertir a formato de respuesta
      for (const [language, formats] of languageMap.entries()) {
        subtitles.push({
          language,
          formats
        })
      }

      Logger.info(`[TranscriptionController] Found ${subtitles.length} subtitle(s) for item ${libraryItemId}`)
      res.json(subtitles)

    } catch (error) {
      Logger.error('[TranscriptionController] Error obteniendo lista de subtítulos:', error)
      res.status(500).json({ error: 'Error interno del servidor' })
    }
  }

  /**
   * @this import('../routers/ApiRouter')
   */
  async downloadSubtitle(req, res) {
    try {
      const { language, format } = req.params
      const libraryItemId = req.libraryItem.id
      
      const subtitlesDir = require('path').join(global.MetadataPath, 'subtitles', libraryItemId)
      const filePath = require('path').join(subtitlesDir, `${language}.${format}`)
      
      const fs = require('fs')
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'Subtítulos no encontrados' })
      }

      // Enviar archivo para descarga
      const displayTitle = (
        req.libraryItem?.media?.metadata?.title ||
        req.libraryItem?.media?.title ||
        req.libraryItem?.title ||
        `item-${libraryItemId}`
      )
      res.download(filePath, `${displayTitle}_${language}.${format}`)
      
    } catch (error) {
      Logger.error('[TranscriptionController] Error descargando subtítulos:', error)
      res.status(500).json({ error: 'Error descargando subtítulos' })
    }
  }

  /**
   * @this import('../routers/ApiRouter')
   */
  async serveSubtitleVTT(req, res) {
    try {
      const { language } = req.params
      const libraryItemId = req.libraryItem.id
      
      const subtitlesDir = require('path').join(global.MetadataPath, 'subtitles', libraryItemId)
      const filePath = require('path').join(global.MetadataPath, 'subtitles', libraryItemId, `${language}.vtt`)
      
      const fs = require('fs')
      if (!fs.existsSync(filePath)) {
        return res.status(404).send('Subtítulos no encontrados')
      }

      // Leer y enviar contenido como texto plano
      const content = fs.readFileSync(filePath, 'utf-8')
      res.setHeader('Content-Type', 'text/plain; charset=utf-8')
      res.send(content)
      
    } catch (error) {
      Logger.error('[TranscriptionController] Error sirviendo VTT:', error)
      res.status(500).send('Error sirviendo subtítulos')
    }
  }

  /**
   * @this import('../routers/ApiRouter')
   */
  async serveSubtitleSRT(req, res) {
    try {
      const { language } = req.params
      const libraryItemId = req.libraryItem.id
      
      const filePath = require('path').join(global.MetadataPath, 'subtitles', libraryItemId, `${language}.srt`)
      
      const fs = require('fs')
      if (!fs.existsSync(filePath)) {
        return res.status(404).send('Subtítulos no encontrados')
      }

      // Leer y enviar contenido como texto plano
      const content = fs.readFileSync(filePath, 'utf-8')
      res.setHeader('Content-Type', 'text/plain; charset=utf-8')
      res.send(content)
      
    } catch (error) {
      Logger.error('[TranscriptionController] Error sirviendo SRT:', error)
      res.status(500).send('Error sirviendo subtítulos')
    }
  }

  /**
   * @this import('../routers/ApiRouter')
   */
  async deleteSubtitles(req, res) {
    try {
      const { language } = req.params
      const libraryItemId = req.libraryItem.id
      
      if (!this.transcriptionManager) {
        return res.status(503).json({ error: 'TranscriptionManager no disponible' })
      }

      await this.transcriptionManager.deleteSubtitles(libraryItemId, language)
      res.json({ message: 'Subtítulos eliminados correctamente' })
      
    } catch (error) {
      Logger.error('[TranscriptionController] Error eliminando subtítulos:', error)
      res.status(500).json({ error: 'Error eliminando subtítulos' })
    }
  }

  /**
   * @this import('../routers/ApiRouter')
   */
  async uploadSubtitles(req, res) {
    res.status(501).json({ error: 'Funcionalidad de subida no implementada aún' })
  }

  /**
   * @this import('../routers/ApiRouter')
   */
  async getAvailableModels(req, res) {
    try {
      if (!this.transcriptionManager) {
        return res.json({ 
          models: [],
          whisperAvailable: false
        })
      }

      const models = this.transcriptionManager.availableModels.map(model => ({
        name: model,
        displayName: model.charAt(0).toUpperCase() + model.slice(1),
        status: 'available',
        recommended: model === 'large-v3'
      }))

      res.json({ 
        models,
        currentModel: this.transcriptionManager.config.model,
        whisperAvailable: this.transcriptionManager.isInitialized
      })
    } catch (error) {
      Logger.error('[TranscriptionController] Error obteniendo modelos:', error)
      res.status(500).json({ error: 'Error obteniendo modelos disponibles' })
    }
  }

  /**
   * @this import('../routers/ApiRouter')
   */
  async getSupportedLanguages(req, res) {
    try {
      const languages = [
        { code: 'es', name: 'Español', recommended: true },
        { code: 'en', name: 'English' },
        { code: 'fr', name: 'Français' },
        { code: 'de', name: 'Deutsch' },
        { code: 'it', name: 'Italiano' },
        { code: 'pt', name: 'Português' },
        { code: 'auto', name: 'Detección automática' }
      ]

      res.json({ 
        languages,
        currentLanguage: this.transcriptionManager?.config?.language || 'es'
      })
    } catch (error) {
      Logger.error('[TranscriptionController] Error obteniendo idiomas:', error)
      res.status(500).json({ error: 'Error obteniendo idiomas soportados' })
    }
  }
}

module.exports = new TranscriptionController()
