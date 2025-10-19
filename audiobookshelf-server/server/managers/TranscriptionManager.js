const Logger = require('../Logger')
const path = require('path')
const fs = require('fs').promises
const fsSync = require('fs')
const ffmpeg = require('fluent-ffmpeg')
const { exec } = require('child_process')
const { promisify } = require('util')

const execAsync = promisify(exec)
const DEFAULT_FFMPEG_FILENAMES = process.platform === 'win32' ? ['ffmpeg.exe', 'ffmpeg'] : ['ffmpeg']

class TranscriptionManager {
  
  detectInstalledModelsPath() {
    try {
      // Detectar si estamos ejecutándose desde una instalación empaquetada
      const possiblePaths = [
        path.join(process.cwd(), 'whisper', 'models'), // Ruta del installer
        path.join(path.dirname(process.execPath), 'whisper', 'models'), // Ruta relativa al ejecutable
        path.join(__dirname, '..', '..', '..', 'whisper', 'models') // Ruta relativa al servidor
      ]
      
      for (const modelsPath of possiblePaths) {
        if (fsSync.existsSync(modelsPath)) {
          // Verificar que al menos un modelo esté presente
          const files = fsSync.readdirSync(modelsPath)
          const modelFiles = files.filter(file => file.endsWith('.pt'))
          if (modelFiles.length > 0) {
            Logger.info(`[TranscriptionManager] Modelos de Whisper encontrados en instalación: ${modelsPath}`)
            Logger.info(`[TranscriptionManager] Modelos disponibles: ${modelFiles.join(', ')}`)
            return modelsPath
          }
        }
      }
    } catch (error) {
      Logger.debug(`[TranscriptionManager] Error detectando modelos instalados: ${error.message}`)
    }
    return null
  }

  constructor() {
    this.whisperCommand = null
    this.isInitialized = false
    this.processingQueue = new Map()
    this.gpuAvailable = false
    
    // Configuración
    this.config = {
      model: 'large-v3',
      language: 'auto', // Auto-detectar idioma por defecto para transcribir correctamente
      tempDir: path.join(process.cwd(), 'temp', 'transcription'),
      subtitlesDir: path.join(global.MetadataPath, 'subtitles'),
      modelsDir: this.detectInstalledModelsPath() || path.join(global.MetadataPath, 'whisper-models')
    }
    
    // Estado de descarga de modelos
    this.modelDownloadStatus = new Map()
    this.availableModels = ['tiny', 'base', 'small', 'medium', 'large-v1', 'large-v2', 'large-v3']
    
    // Idiomas soportados
    this.supportedLanguages = {
      'auto': 'Auto-detectar idioma',
      'spanish': 'Español',
      'english': 'Inglés',
      'french': 'Francés',
      'german': 'Alemán',
      'italian': 'Italiano',
      'portuguese': 'Portugués',
      'chinese': 'Chino',
      'japanese': 'Japonés',
      'korean': 'Coreano',
      'russian': 'Ruso',
      'arabic': 'Árabe'
    }
    
    this.init()
  }
  
  // Métodos para configurar transcripción
  setTranscriptionLanguage(language) {
    if (language in this.supportedLanguages || language === 'auto') {
      this.config.language = language
      Logger.info(`[TranscriptionManager] Idioma de transcripción establecido: ${this.supportedLanguages[language] || language}`)
    } else {
      Logger.warn(`[TranscriptionManager] Idioma no soportado: ${language}`)
    }
  }
  
  getTranscriptionLanguage() {
    return this.config.language
  }
  
  getSupportedLanguages() {
    return this.supportedLanguages
  }

  async init() {
    try {
      Logger.info('[TranscriptionManager] Inicializando TranscriptionManager...')
      
      // Crear directorios necesarios
      await this.ensureDirectories()
      
      // Verificar si Whisper está instalado y determinar el comando
      this.whisperCommand = await this.checkWhisperInstallation()
      
      // Detectar GPU disponible
      this.gpuAvailable = await this.detectGPU()
      
      this.isInitialized = true
      Logger.info('[TranscriptionManager] TranscriptionManager inicializado correctamente')
      
    } catch (error) {
      Logger.error('[TranscriptionManager] Error inicializando TranscriptionManager:', error)
      Logger.error('[TranscriptionManager] Para usar transcripciones, instale OpenAI Whisper: pip install openai-whisper')
      this.isInitialized = false
    }
  }

  async checkWhisperInstallation() {
    try {
      // Verificar si whisper está disponible en el sistema (Windows)
      // Solo verificamos que el comando existe sin pasar argumentos inválidos
      const { stderr } = await execAsync('whisper', { timeout: 5000 })
      // Si llega aquí sin error fatal, whisper está disponible
      if (stderr && stderr.includes('arguments are required')) {
        Logger.info('[TranscriptionManager] Whisper encontrado en el sistema')
        return 'whisper'
      }
      throw new Error('Whisper no detectado correctamente')
    } catch (error) {
      // Si el error indica que faltan argumentos, significa que whisper está instalado
      if (error.message && error.message.includes('arguments are required')) {
        Logger.info('[TranscriptionManager] Whisper encontrado en el sistema')
        return 'whisper'
      }
      
      Logger.warn('[TranscriptionManager] Whisper no encontrado en PATH, intentando con Python...')
      try {
        await execAsync('python -m whisper --help', { timeout: 5000 })
        Logger.info('[TranscriptionManager] Whisper encontrado vía Python')
        return 'python -m whisper'
      } catch (pythonError) {
        Logger.warn('[TranscriptionManager] Python whisper no encontrado, intentando con python3...')
        try {
          await execAsync('python3 -m whisper --help', { timeout: 5000 })
          Logger.info('[TranscriptionManager] Whisper encontrado vía Python3')
          return 'python3 -m whisper'
        } catch (python3Error) {
          throw new Error('Whisper no está instalado. Instale con: pip install openai-whisper')
        }
      }
    }
  }

  async detectGPU() {
    try {
      Logger.info('[TranscriptionManager] Detectando GPU disponible...')
      
      // Método 1: Verificar nvidia-smi
      try {
        const { stdout } = await execAsync('nvidia-smi --query-gpu=name,memory.total --format=csv,noheader', { timeout: 5000 })
        if (stdout && stdout.trim()) {
          const gpuInfo = stdout.trim().split(',')
          Logger.info(`[TranscriptionManager] GPU NVIDIA detectada: ${gpuInfo[0]}`)
          Logger.info(`[TranscriptionManager] VRAM total: ${gpuInfo[1]}`)
          
          // Verificar PyTorch CUDA
          try {
            const pythonExe = this.whisperCommand.includes('python') ? this.whisperCommand.split(' ')[0] : 'python'
            const { stdout: cudaCheck } = await execAsync(`${pythonExe} -c "import torch; print(torch.cuda.is_available())"`, { timeout: 5000 })
            
            if (cudaCheck && cudaCheck.trim() === 'True') {
              Logger.info('[TranscriptionManager] ✅ GPU habilitada para transcripción (CUDA disponible)')
              return true
            } else {
              Logger.warn('[TranscriptionManager] ⚠️ GPU detectada pero PyTorch no tiene CUDA. Instalando: pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118')
              return false
            }
          } catch (torchError) {
            Logger.warn('[TranscriptionManager] ⚠️ No se pudo verificar PyTorch CUDA:', torchError.message)
            return false
          }
        }
      } catch (nvidiaError) {
        Logger.debug('[TranscriptionManager] nvidia-smi no disponible o sin GPU NVIDIA')
      }
      
      // Método 2: Verificar PyTorch CUDA directamente
      try {
        const pythonExe = this.whisperCommand.includes('python') ? this.whisperCommand.split(' ')[0] : 'python'
        const { stdout } = await execAsync(`${pythonExe} -c "import torch; print(torch.cuda.is_available()); print(torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'No GPU')"`, { timeout: 5000 })
        
        const lines = stdout.trim().split('\n')
        if (lines[0] === 'True') {
          Logger.info(`[TranscriptionManager] ✅ GPU habilitada para transcripción: ${lines[1]}`)
          return true
        }
      } catch (torchError) {
        Logger.debug('[TranscriptionManager] PyTorch CUDA no disponible:', torchError.message)
      }
      
      Logger.info('[TranscriptionManager] ℹ️ GPU no detectada, usando CPU para transcripción')
      return false
      
    } catch (error) {
      Logger.warn('[TranscriptionManager] Error detectando GPU:', error.message)
      return false
    }
  }

  async ensureDirectories() {
    try {
      if (!fsSync.existsSync(this.config.tempDir)) {
        await fs.mkdir(this.config.tempDir, { recursive: true })
      }
      if (!fsSync.existsSync(this.config.subtitlesDir)) {
        await fs.mkdir(this.config.subtitlesDir, { recursive: true })
      }
      if (!fsSync.existsSync(this.config.modelsDir)) {
        await fs.mkdir(this.config.modelsDir, { recursive: true })
      }
    } catch (error) {
      Logger.error('[TranscriptionManager] Error creando directorios:', error)
      throw error
    }
  }

  async ensureModelDownloaded(modelName = null) {
    const model = modelName || this.config.model
    
    if (this.modelDownloadStatus.get(model) === 'downloading') {
      Logger.info(`[TranscriptionManager] Modelo ${model} ya se está descargando...`)
      return false
    }

    if (this.modelDownloadStatus.get(model) === 'ready') {
      return true
    }

    try {
      Logger.info(`[TranscriptionManager] Verificando disponibilidad del modelo ${model}...`)
      
      // Verificar si el modelo ya está instalado localmente
      const modelPath = path.join(this.config.modelsDir, `${model}.pt`)
      if (fsSync.existsSync(modelPath)) {
        Logger.info(`[TranscriptionManager] Modelo ${model} encontrado en instalación local: ${modelPath}`)
        this.modelDownloadStatus.set(model, 'ready')
        return true
      }
      
      this.modelDownloadStatus.set(model, 'downloading')
      
      // Intentar una transcripción de prueba muy corta para forzar la descarga del modelo
      const testCommand = `${this.whisperCommand} --model ${model} --output_format txt --output_dir "${this.config.tempDir}" "${path.join(__dirname, 'test-silence.wav')}" || echo "downloading"`
      
      // Crear un archivo de audio silencioso muy corto para testing
      await this.createTestAudioFile()
      
      const { stdout, stderr } = await execAsync(testCommand, {
        cwd: this.config.tempDir,
        maxBuffer: 1024 * 1024 * 50,
        timeout: 300000,
        env: this.getWhisperEnv()
      })

      Logger.info(`[TranscriptionManager] Modelo ${model} verificado/descargado correctamente`)
      this.modelDownloadStatus.set(model, 'ready')
      return true
      
    } catch (error) {
      Logger.error(`[TranscriptionManager] Error con modelo ${model}:`, error.message)
      this.modelDownloadStatus.set(model, 'error')
      throw new Error(`No se pudo descargar/verificar el modelo ${model}: ${error.message}`)
    }
  }

  async createTestAudioFile() {
    const testAudioPath = path.join(__dirname, 'test-silence.wav')
    
    if (fsSync.existsSync(testAudioPath)) {
      return testAudioPath
    }

    try {
      // Crear un archivo de audio silencioso de 1 segundo usando FFmpeg
  const ffmpegBinary = this.resolveFfmpegBinary() || 'ffmpeg'
  const command = `"${ffmpegBinary}" -f lavfi -i "anullsrc=channel_layout=mono:sample_rate=16000" -t 1 -acodec pcm_s16le "${testAudioPath}" -y`
      await execAsync(command, { timeout: 10000 })
      Logger.debug('[TranscriptionManager] Archivo de prueba creado')
      return testAudioPath
    } catch (error) {
      Logger.warn('[TranscriptionManager] No se pudo crear archivo de prueba, continuando sin él')
      return null
    }
  }

  async transcribeAudiobook(libraryItem, options = {}) {
    if (!this.isInitialized) {
      throw new Error('TranscriptionManager no está inicializado')
    }

  const itemId = libraryItem.id
  const language = options.language || this.config.language
  const model = options.model || this.config.model
  const displayTitle = this.getLibraryItemTitle(libraryItem)
  const existingStatus = this.processingQueue.get(itemId)
    
    // Verificar si ya está en proceso
    if (existingStatus?.status === 'processing') {
      throw new Error('Ya se está procesando la transcripción para este audiolibro')
    }

    // Asegurar que el modelo esté descargado
    try {
      Logger.info(`[TranscriptionManager] Verificando modelo ${model}...`)
      await this.ensureModelDownloaded(model)
    } catch (error) {
      throw new Error(`Error preparando modelo: ${error.message}`)
    }

    try {
      Logger.info(`Iniciando transcripción para: ${displayTitle}`)
      
      // Marcar como en proceso
      this.processingQueue.set(itemId, {
        status: 'processing',
        startTime: Date.now(),
        progress: 0,
        language,
        model
      })

      // Obtener archivos de audio
      const audioFiles = this.getAudioFiles(libraryItem)
      if (!audioFiles.length) {
        throw new Error('No se encontraron archivos de audio')
      }

      let allSubtitles = []
      let totalFiles = audioFiles.length
      let processedFiles = 0

      // Procesar cada archivo de audio
      for (const audioFile of audioFiles) {
        const { filename: displayName } = this.getAudioFileMetadata(audioFile)
        Logger.info(`Procesando archivo ${processedFiles + 1}/${totalFiles}: ${displayName}`)
        
        // Actualizar progreso
        this.processingQueue.set(itemId, {
          ...this.processingQueue.get(itemId),
          progress: Math.round((processedFiles / totalFiles) * 100)
        })

        const subtitles = await this.transcribeAudioFile(audioFile, language, model)
        allSubtitles = allSubtitles.concat(subtitles)
        processedFiles++

        this.processingQueue.set(itemId, {
          ...this.processingQueue.get(itemId),
          progress: Math.min(99, Math.round((processedFiles / totalFiles) * 100))
        })
      }

      // Generar archivos de subtítulos
      const outputPath = path.join(this.config.subtitlesDir, itemId)
      await fs.mkdir(outputPath, { recursive: true })
      
      const srtPath = path.join(outputPath, `${language}.srt`)
      const vttPath = path.join(outputPath, `${language}.vtt`)
      
      await this.generateSRTFile(allSubtitles, srtPath)
      await this.generateVTTFile(allSubtitles, vttPath)

      // Marcar como completado
      this.processingQueue.set(itemId, {
        status: 'completed',
        startTime: this.processingQueue.get(itemId).startTime,
        endTime: Date.now(),
        progress: 100,
        srtPath,
        vttPath
      })

  Logger.info(`Transcripción completada para: ${displayTitle}`)
      
      return {
        status: 'completed',
        language,
        srtPath,
        vttPath,
        subtitleCount: allSubtitles.length
      }

    } catch (error) {
      Logger.error(`Error en transcripción para ${itemId}:`, error)
      
      // Marcar como error
      this.processingQueue.set(itemId, {
        status: 'error',
        error: error.message,
        language,
        model,
        startTime: this.processingQueue.get(itemId)?.startTime || Date.now(),
        endTime: Date.now()
      })
      
      throw error
    }
  }

  async transcribeAudioFile(audioFile, language, model) {
    const tempAudioPath = path.join(this.config.tempDir, `temp_${Date.now()}.wav`)
    const { path: sourcePath, filename: displayName } = this.getAudioFileMetadata(audioFile)
    
    try {
      // Convertir audio a formato compatible con Whisper
      if (!sourcePath) {
        throw new Error('El archivo de audio no tiene una ruta válida')
      }

      await this.convertAudioForWhisper(sourcePath, tempAudioPath)
      
      // CONFIGURACIÓN DE IDIOMA MEJORADA:
      // - 'auto' o null: Whisper detecta automáticamente el idioma hablado
      // - 'es', 'en', etc.: Fuerza transcripción en idioma específico
      // - IMPORTANTE: task='transcribe' transcribe en idioma original
      //               task='translate' traduciría todo al inglés (NO queremos esto)
      const transcriptionLanguage = language === 'auto' ? null : this.getWhisperLanguageCode(language)
      
      // Ejecutar transcripción usando comando directo
      Logger.debug(`Ejecutando Whisper para: ${displayName}`)
      const result = await this.executeWhisperCommand(tempAudioPath, {
        model: model || this.config.model,
        language: transcriptionLanguage, // Usar variable corregida que maneja auto-detección
        outputFormat: 'json'
      })

      // Procesar resultados
      const subtitles = this.processWhisperResults(result)
      
      // Limpiar archivo temporal
      await fs.unlink(tempAudioPath)
      
      return subtitles

    } catch (error) {
      // Limpiar archivo temporal en caso de error
      if (fsSync.existsSync(tempAudioPath)) {
        await fs.unlink(tempAudioPath)
      }
      Logger.error(`Error transcribiendo ${displayName}:`, error)
      throw error
    }
  }

  getWhisperLanguageCode(language) {
    const languageMap = {
      'spanish': 'es',
      'english': 'en',
      'french': 'fr',
      'german': 'de',
      'italian': 'it',
      'portuguese': 'pt',
      'chinese': 'zh',
      'japanese': 'ja',
      'korean': 'ko',
      'russian': 'ru',
      'arabic': 'ar'
    }
    return languageMap[language] || null // null = auto-detect
  }

  convertAudioForWhisper(inputPath, outputPath) {
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .audioChannels(1) // Mono
        .audioFrequency(16000) // 16kHz sample rate
        .audioCodec('pcm_s16le') // PCM 16-bit
        .format('wav')
        .output(outputPath)
        .on('end', () => resolve())
        .on('error', (error) => reject(error))
        .run()
    })
  }

  async executeWhisperCommand(audioPath, options = {}) {
    try {
      const {
        model = 'large-v3',
        language = 'es',
        outputFormat = 'json'
      } = options

      const outputDir = path.dirname(audioPath)
      const ffmpegPath = this.resolveFfmpegBinary()
      const whisperEnv = this.getWhisperEnv()

      Logger.info(`[TranscriptionManager] Iniciando transcripción con modelo ${model}`)
      Logger.info(`[TranscriptionManager] FFMPEG: ${ffmpegPath}`)
      Logger.info(`[TranscriptionManager] Modo GPU: ${this.gpuAvailable ? 'ACTIVADO ✅' : 'Desactivado (CPU)'}`)
      Logger.info(`[TranscriptionManager] Directorio de modelos: ${this.config.modelsDir}`)

      // Verificar si el modelo está disponible localmente
      const localModelPath = path.join(this.config.modelsDir, `${model}.pt`)
      const useLocalModel = fsSync.existsSync(localModelPath)
      
      if (useLocalModel) {
        Logger.info(`[TranscriptionManager] Usando modelo local: ${localModelPath}`)
      } else {
        Logger.info(`[TranscriptionManager] Modelo será descargado automáticamente: ${model}`)
      }

      // Crear script Python temporal para controlar FFmpeg explícitamente
      const pythonScript = path.join(this.config.tempDir, `whisper_wrapper_${Date.now()}.py`)
      const baseName = path.basename(audioPath, path.extname(audioPath))
      const jsonPath = path.join(outputDir, `${baseName}.json`)
      
      // Escapar rutas para Windows
      const escapePath = (p) => p.replace(/\\/g, '\\\\')
      
      // Generar código Python con soporte GPU
      const deviceConfig = this.gpuAvailable 
        ? `
# Configurar GPU
import torch
device = 'cuda' if torch.cuda.is_available() else 'cpu'
print(f"Usando dispositivo: {device}", file=sys.stderr)
if device == 'cuda':
    print(f"GPU: {torch.cuda.get_device_name(0)}", file=sys.stderr)
    print(f"VRAM disponible: {torch.cuda.get_device_properties(0).total_memory / 1024**3:.2f} GB", file=sys.stderr)
`
        : `
# Modo CPU
device = 'cpu'
print("Usando CPU (sin GPU detectada)", file=sys.stderr)
`

      const pythonCode = `
import os
import sys
import json
import time

# Configurar FFmpeg ANTES de importar cualquier cosa
ffmpeg_path = r'${ffmpegPath}'
ffmpeg_dir = r'${path.dirname(ffmpegPath)}'
os.environ['FFMPEG_BINARY'] = ffmpeg_path
os.environ['IMAGEIO_FFMPEG_EXE'] = ffmpeg_path
os.environ['PATH'] = ffmpeg_dir + os.pathsep + os.environ.get('PATH', '')

# Ahora importar whisper y ffmpeg-python
import whisper
${deviceConfig}

# Intentar configurar ffmpeg-python si está disponible
try:
    import ffmpeg
    ffmpeg._run.FFMPEG_PATH = ffmpeg_path
except Exception as e:
    print(f"Info: No se pudo configurar ffmpeg-python: {e}", file=sys.stderr)

print("Cargando modelo ${model}...", file=sys.stderr)
start_time = time.time()

# Verificar si existe modelo local
local_model_path = r'${escapePath(useLocalModel ? localModelPath : '')}'
if local_model_path and os.path.exists(local_model_path):
    print(f"Usando modelo local: {local_model_path}", file=sys.stderr)
    model = whisper.load_model(local_model_path, device=device)
else:
    print("Descargando/usando modelo desde cache global", file=sys.stderr)
    model = whisper.load_model("${model}", device=device)

load_time = time.time() - start_time
print(f"Modelo cargado en {load_time:.2f} segundos", file=sys.stderr)

print("Transcribiendo audio...", file=sys.stderr)
${language ? `print(f"Idioma forzado: ${language}", file=sys.stderr)` : `print("Idioma: Auto-detección", file=sys.stderr)`}
print("Tarea: TRANSCRIBIR (no traducir)", file=sys.stderr)
transcribe_start = time.time()
result = model.transcribe(
    r'${escapePath(audioPath)}',${language ? `\n    language='${language}',` : ''}
    task='transcribe',  # CRÍTICO: Transcribir en idioma original, NO traducir al inglés
    word_timestamps=True,
    verbose=False,
    ${this.gpuAvailable ? 'fp16=True  # Precision mixta para GPU' : 'fp16=False  # CPU no soporta fp16'}
)
transcribe_time = time.time() - transcribe_start
print(f"Transcripción completada en {transcribe_time:.2f} segundos", file=sys.stderr)

# Calcular velocidad de transcripción
audio_duration = result.get('duration', 0)
if audio_duration > 0:
    speed_ratio = audio_duration / transcribe_time
    print(f"Velocidad: {speed_ratio:.2f}x tiempo real", file=sys.stderr)

print("Guardando resultado...", file=sys.stderr)
with open(r'${escapePath(jsonPath)}', 'w', encoding='utf-8') as f:
    json.dump(result, f, ensure_ascii=False, indent=2)

print("Transcripción completada exitosamente", file=sys.stderr)
`

      await fs.writeFile(pythonScript, pythonCode, 'utf8')

      // Determinar comando Python
      let pythonCommand
      if (this.whisperCommand.includes('python')) {
        // Si whisperCommand es 'python -m whisper' o similar, usar ese python
        const pythonExe = this.whisperCommand.split(' ')[0]
        pythonCommand = `${pythonExe} "${pythonScript}"`
      } else {
        // Fallback a python genérico
        pythonCommand = `python "${pythonScript}"`
      }

      Logger.info(`[TranscriptionManager] Ejecutando: ${pythonCommand}`)

      const execOptions = {
        cwd: outputDir,
        maxBuffer: 1024 * 1024 * 50, // 50MB buffer para output largo
        env: whisperEnv,
        timeout: 1800000 // 30 minutos timeout
      }

      const { stdout, stderr } = await execAsync(pythonCommand, execOptions)

      if (stderr) {
        Logger.info(`[TranscriptionManager] Whisper output: ${stderr}`)
      }
      if (stdout) {
        Logger.debug(`[TranscriptionManager] Whisper stdout: ${stdout}`)
      }

      // Verificar que el archivo JSON existe
      if (!fsSync.existsSync(jsonPath)) {
        throw new Error(`Archivo JSON no encontrado: ${jsonPath}`)
      }

      // Leer y parsear el resultado JSON
      const jsonContent = await fs.readFile(jsonPath, 'utf8')
      const result = JSON.parse(jsonContent)

      // Limpiar archivos temporales
      try {
        await fs.unlink(jsonPath)
        await fs.unlink(pythonScript)
      } catch (cleanupError) {
        Logger.warn(`[TranscriptionManager] Error limpiando archivos temporales: ${cleanupError.message}`)
      }

      return result

    } catch (error) {
      Logger.error(`[TranscriptionManager] Error ejecutando Whisper: ${error.message}`)
      if (error.stderr) {
        Logger.error(`[TranscriptionManager] stderr completo: ${error.stderr}`)
      }
      if (error.stdout) {
        Logger.error(`[TranscriptionManager] stdout completo: ${error.stdout}`)
      }
      throw error
    }
  }

  resolveFfmpegBinary() {
    const envCandidates = [process.env.FFMPEG_PATH, process.env.FFMPEG_BINARY, process.env.WHISPER_FFMPEG_BINARY]
    const inferredCandidates = []

    const serverRoot = path.join(__dirname, '..', '..')
    const candidateDirs = [
      global.appRoot,
      serverRoot,
      process.cwd(),
      global.ConfigPath,
      path.join(process.cwd(), 'bin'),
      global.MetadataPath ? path.join(global.MetadataPath, 'binaries') : null
    ].filter(Boolean)

    for (const dir of candidateDirs) {
      for (const fileName of DEFAULT_FFMPEG_FILENAMES) {
        inferredCandidates.push(path.join(dir, fileName))
      }
    }

    const candidates = [...envCandidates, ...inferredCandidates]
    for (const candidate of candidates) {
      if (candidate && fsSync.existsSync(candidate)) {
        Logger.info(`[TranscriptionManager] Usando FFmpeg detectado en ${candidate}`)
        process.env.FFMPEG_PATH = candidate
        process.env.FFMPEG_BINARY = candidate
        process.env.WHISPER_FFMPEG_BINARY = candidate
        return candidate
      }
    }

    return envCandidates.find(Boolean) || null
  }

  processWhisperResults(result) {
    const subtitles = []
    
    try {
      // El comando whisper devuelve un JSON con segments
      if (result && result.segments) {
        result.segments.forEach((segment, index) => {
          subtitles.push({
            index: index + 1,
            startTime: segment.start,
            endTime: segment.end,
            text: segment.text.trim()
          })
        })
      } else if (Array.isArray(result)) {
        // Si el resultado es directamente un array de segmentos
        result.forEach((segment, index) => {
          subtitles.push({
            index: index + 1,
            startTime: segment.start || segment.startTime || 0,
            endTime: segment.end || segment.endTime || 0,
            text: (segment.text || segment.content || '').trim()
          })
        })
      }
    } catch (error) {
      Logger.error('Error procesando resultados de Whisper:', error)
      Logger.debug('Resultado recibido:', result)
    }
    
    return subtitles
  }

  async generateSRTFile(subtitles, outputPath) {
    let srtContent = ''
    
    subtitles.forEach((subtitle) => {
      const startTime = this.formatSRTTime(subtitle.startTime)
      const endTime = this.formatSRTTime(subtitle.endTime)
      
      srtContent += `${subtitle.index}\n`
      srtContent += `${startTime} --> ${endTime}\n`
      srtContent += `${subtitle.text}\n\n`
    })
    
    await fs.writeFile(outputPath, srtContent, 'utf8')
  }

  async generateVTTFile(subtitles, outputPath) {
    let vttContent = 'WEBVTT\n\n'
    
    subtitles.forEach((subtitle) => {
      const startTime = this.formatVTTTime(subtitle.startTime)
      const endTime = this.formatVTTTime(subtitle.endTime)
      
      vttContent += `${startTime} --> ${endTime}\n`
      vttContent += `${subtitle.text}\n\n`
    })
    
    await fs.writeFile(outputPath, vttContent, 'utf8')
  }

  formatSRTTime(seconds) {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    const milliseconds = Math.floor((seconds % 1) * 1000)
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${milliseconds.toString().padStart(3, '0')}`
  }

  formatVTTTime(seconds) {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    const milliseconds = Math.floor((seconds % 1) * 1000)
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`
  }

  getAudioFiles(libraryItem) {
    if (libraryItem.mediaType !== 'book') {
      throw new Error('Solo se admiten audiolibros')
    }
    
    if (!libraryItem?.media) {
      return []
    }

    if (Array.isArray(libraryItem.media.audioFiles) && libraryItem.media.audioFiles.length) {
      return libraryItem.media.audioFiles
    }

    if (Array.isArray(libraryItem.media.tracks)) {
      return libraryItem.media.tracks
        .map(track => track?.audioFile || track)
        .filter(Boolean)
    }

    return []
  }

  getLibraryItemTitle(libraryItem) {
    return (
      libraryItem?.media?.metadata?.title ||
      libraryItem?.media?.title ||
      libraryItem?.title ||
      libraryItem?.name ||
      'Audiolibro'
    )
  }

  getAudioFileMetadata(audioFile = {}) {
    const sourcePath = audioFile?.metadata?.path || audioFile?.path || audioFile?.streamPath
    const filename = (
      audioFile?.metadata?.filename ||
      audioFile?.metadata?.title ||
      audioFile?.filename ||
      (sourcePath ? path.basename(sourcePath) : 'archivo_desconocido')
    )

    return { path: sourcePath, filename }
  }

  getTranscriptionStatus(itemId) {
    return this.processingQueue.get(itemId) || { status: 'not_started' }
  }

  getWhisperEnv() {
    const env = { ...process.env }
    const ffmpegPath = this.resolveFfmpegBinary()

    if (ffmpegPath) {
      const ffmpegDir = path.dirname(ffmpegPath)
      const existingPath = env.PATH || env.Path || ''
      const pathSeparator = process.platform === 'win32' ? ';' : ':'
      
      // Prepend ffmpeg directory to PATH for maximum priority
      env.PATH = `${ffmpegDir}${pathSeparator}${existingPath}`

      // Preserve Windows-specific Path casing
      if (env.Path) {
        env.Path = env.PATH
      }

      // Set all possible FFmpeg environment variables
      env.FFMPEG_PATH = ffmpegPath
      env.FFMPEG_BINARY = ffmpegPath
      env.IMAGEIO_FFMPEG_EXE = ffmpegPath
      env.WHISPER_FFMPEG_BINARY = ffmpegPath
      env.FFMPEG = ffmpegPath
      
      // Also set ffprobe if it exists
      const ffprobePath = ffmpegPath.replace('ffmpeg', 'ffprobe')
      if (fsSync.existsSync(ffprobePath)) {
        env.FFPROBE_PATH = ffprobePath
        env.FFPROBE = ffprobePath
      }
    }

    return env
  }

  async getSubtitles(itemId, language) {
    const subtitlesPath = path.join(this.config.subtitlesDir, itemId)
    const srtPath = path.join(subtitlesPath, `${language}.srt`)
    const vttPath = path.join(subtitlesPath, `${language}.vtt`)
    
    const result = {}
    
    if (fsSync.existsSync(srtPath)) {
      result.srt = await fs.readFile(srtPath, 'utf8')
    }
    
    if (fsSync.existsSync(vttPath)) {
      result.vtt = await fs.readFile(vttPath, 'utf8')
    }
    
    return result
  }

  async deleteSubtitles(itemId, language) {
    const subtitlesPath = path.join(this.config.subtitlesDir, itemId)
    const srtPath = path.join(subtitlesPath, `${language}.srt`)
    const vttPath = path.join(subtitlesPath, `${language}.vtt`)
    
    try {
      if (fsSync.existsSync(srtPath)) {
        await fs.unlink(srtPath)
      }
      if (fsSync.existsSync(vttPath)) {
        await fs.unlink(vttPath)
      }
      return true
    } catch (error) {
      Logger.error('Error eliminando subtítulos:', error)
      return false
    }
  }

  async listSubtitles(itemId) {
    const subtitlesPath = path.join(this.config.subtitlesDir, itemId)
    
    if (!fsSync.existsSync(subtitlesPath)) {
      return []
    }
    
    try {
      const files = await fs.readdir(subtitlesPath)
      const subtitles = []
      
      const languages = new Set()
      files.forEach(file => {
        const ext = path.extname(file)
        const lang = path.basename(file, ext)
        if (ext === '.srt' || ext === '.vtt') {
          languages.add(lang)
        }
      })
      
      for (const language of languages) {
        const srtExists = fsSync.existsSync(path.join(subtitlesPath, `${language}.srt`))
        const vttExists = fsSync.existsSync(path.join(subtitlesPath, `${language}.vtt`))
        
        subtitles.push({
          language,
          formats: {
            srt: srtExists,
            vtt: vttExists
          }
        })
      }
      
      return subtitles
    } catch (error) {
      Logger.error('Error listando subtítulos:', error)
      return []
    }
  }
}

module.exports = TranscriptionManager
