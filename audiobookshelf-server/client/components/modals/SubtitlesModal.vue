<template>
  <modals-modal
    v-model="show"
    name="subtitles-modal"
    :width="modalWidth"
    :height="modalHeight"
    :processing="processing"
    :content-margin-top="32"
  >
    <template #outer>
      <div class="absolute top-0 left-0 p-5 w-2/3 overflow-hidden">
        <p class="text-3xl text-white truncate">{{ title }}</p>
      </div>
    </template>
  <div class="p-4 w-full text-sm py-6 rounded-lg bg-bg shadow-lg border border-black-300 relative overflow-hidden" style="min-height: 84px; max-height: 80vh">
      <!-- Header -->
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold">Gestión de Subtítulos</h3>
        <div class="flex space-x-2">
          <ui-btn color="primary" :disabled="!canGenerate || processing" @click="toggleGenerationOptions">
            <svg v-if="processing" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 0 1 4 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ processing ? 'Generando...' : (showGenerationOptions ? 'Ocultar Opciones' : 'Generar Subtítulos') }}
          </ui-btn>
          <ui-file-input ref="fileInput" accept=".srt,.vtt" @change="uploadSubtitles">
            <ui-btn color="bg">Subir Subtítulos</ui-btn>
          </ui-file-input>
        </div>
      </div>

      <!-- Status de transcripción -->
      <div v-if="transcriptionStatus && transcriptionStatus.status !== 'not_started'" class="mb-4 p-3 rounded-lg" :class="statusColorClass">
        <div class="flex items-center justify-between">
          <div>
            <p class="font-semibold">{{ statusText }}</p>
            <p v-if="transcriptionStatus.progress !== undefined" class="text-sm">Progreso: {{ transcriptionStatus.progress }}%</p>
            <p v-if="transcriptionStatus.error" class="text-sm text-red-300">Error: {{ transcriptionStatus.error }}</p>
          </div>
          <div v-if="transcriptionStatus.status === 'processing'" class="text-right">
            <div class="w-16 h-2 bg-gray-600 rounded-full">
              <div class="h-2 bg-blue-500 rounded-full transition-all duration-300" :style="{ width: transcriptionStatus.progress + '%' }"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Lista de subtítulos existentes -->
      <div v-if="subtitles && subtitles.length > 0" class="space-y-3">
        <h4 class="text-md font-medium">Subtítulos Disponibles</h4>
        <div v-for="subtitle in subtitles" :key="subtitle.language" class="flex items-center justify-between p-3 bg-primary bg-opacity-20 rounded-lg">
          <div class="flex items-center space-x-3">
            <div class="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <span class="text-xs font-bold text-white">{{ subtitle.language.toUpperCase().substring(0, 2) }}</span>
            </div>
            <div>
              <p class="font-medium">{{ getLanguageName(subtitle.language) }}</p>
              <p class="text-xs text-gray-400">
                Formatos: 
                <span v-if="subtitle.formats.srt" class="text-green-400">SRT</span>
                <span v-if="subtitle.formats.srt && subtitle.formats.vtt" class="text-gray-400"> • </span>
                <span v-if="subtitle.formats.vtt" class="text-green-400">VTT</span>
              </p>
            </div>
          </div>
          <div class="flex space-x-2">
            <ui-btn v-if="subtitle.formats.srt" size="sm" color="bg" @click="downloadSubtitle(subtitle.language, 'srt')">
              Descargar SRT
            </ui-btn>
            <ui-btn v-if="subtitle.formats.vtt" size="sm" color="bg" @click="downloadSubtitle(subtitle.language, 'vtt')">
              Descargar VTT
            </ui-btn>
            <ui-btn size="sm" color="error" @click="deleteSubtitle(subtitle.language)">
              Eliminar
            </ui-btn>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div v-else class="text-center py-8">
        <div class="text-6xl mb-4">🎧</div>
        <p class="text-lg text-gray-400 mb-2">No hay subtítulos disponibles</p>
        <p v-if="whisperEnabled" class="text-sm text-gray-500">Genera subtítulos automáticamente con IA o sube tus propios archivos</p>
        <p v-else class="text-sm text-yellow-500">
          ⚠️ Whisper no está disponible. Solo puedes subir archivos de subtítulos manualmente.
        </p>
      </div>

      <!-- Configuración de generación -->
      <div v-if="showGenerationOptions" class="mt-6 p-4 bg-gray-800 rounded-lg">
        <h4 class="text-md font-medium mb-3">Opciones de Generación</h4>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium mb-1">Idioma</label>
            <ui-dropdown v-model="generationLanguage" :items="languageOptions" small />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Modelo</label>
            <ui-dropdown v-model="generationQuality" :items="qualityOptions" small />
          </div>
        </div>
        <div class="mt-3">
          <ui-checkbox v-model="forceRegenerate">Regenerar si ya existe</ui-checkbox>
        </div>
        <div class="mt-4 flex justify-end space-x-2">
          <ui-btn color="bg" @click="showGenerationOptions = false">Cancelar</ui-btn>
          <ui-btn color="success" :disabled="processing" @click="generateSubtitles">
            Iniciar Generación
          </ui-btn>
        </div>
      </div>
    </div>
  </modals-modal>
</template>

<script>
export default {
  data() {
    return {
      processing: false,
      showGenerationOptions: false,
      generationLanguage: 'es',
      generationQuality: 'large-v3',
      forceRegenerate: false,
      subtitles: [],
      transcriptionStatus: null,
      statusCheckInterval: null,
      languageOptions: [],
      qualityOptions: [],
      availableLanguages: [],
      availableModels: [],
      whisperEnabled: false
    }
  },
  computed: {
    modalWidth() {
      return this.$mq?.tablet ? 720 : 800
    },
    modalHeight() {
      return this.$mq?.tablet ? 540 : 600
    },
    show: {
      get() {
        return this.$store.state.globals.showSubtitlesModal
      },
      set(val) {
        this.$store.commit('globals/setShowSubtitlesModal', val)
      }
    },
    libraryItem() {
      return this.$store.state.globals.selectedLibraryItem
    },
    title() {
      return this.libraryItem?.media?.metadata?.title || 'Audiolibro'
    },
    canGenerate() {
      if (!this.whisperEnabled || !this.libraryItem) return false
      if (this.libraryItem.mediaType !== 'book') return false
      const media = this.libraryItem.media || {}
      const audioTracks = media.tracks || media.audioFiles || []
      return Array.isArray(audioTracks) && audioTracks.length > 0
    },
    statusColorClass() {
      if (!this.transcriptionStatus) return ''
      
      switch (this.transcriptionStatus.status) {
        case 'processing':
          return 'bg-blue-600 bg-opacity-20 border-blue-500 border'
        case 'completed':
          return 'bg-green-600 bg-opacity-20 border-green-500 border'
        case 'error':
          return 'bg-red-600 bg-opacity-20 border-red-500 border'
        default:
          return 'bg-gray-600 bg-opacity-20 border-gray-500 border'
      }
    },
    statusText() {
      if (!this.transcriptionStatus) return ''
      
      switch (this.transcriptionStatus.status) {
        case 'processing':
          return 'Generando subtítulos...'
        case 'completed':
          return 'Transcripción completada'
        case 'error':
          return 'Error en transcripción'
        default:
          return 'Estado desconocido'
      }
    }
  },
  watch: {
    show: {
      handler(newVal) {
        if (newVal && this.libraryItem) {
          this.initializeModal()
        } else {
          this.clearStatusCheck()
          this.resetTransientState()
        }
      }
    },
    libraryItem(newVal) {
      if (this.show && newVal) {
        this.initializeModal()
      }
    }
  },
  beforeDestroy() {
    this.clearStatusCheck()
  },
  methods: {
    async initializeModal() {
      this.processing = false
      await Promise.all([this.loadAvailableOptions(), this.loadSubtitles(), this.checkTranscriptionStatus()])
    },
    resetTransientState() {
      this.processing = false
      this.showGenerationOptions = false
      this.forceRegenerate = false
      this.transcriptionStatus = null
      this.statusCheckInterval = null
    },
    async loadAvailableOptions() {
      try {
        // Cargar idiomas disponibles
        const languagesResponse = await this.$axios.$get('/api/transcription/languages')
        this.availableLanguages = languagesResponse.languages || []
        this.languageOptions = this.availableLanguages.map(lang => ({
          text: lang.name,
          value: lang.code
        }))
        
        // Cargar modelos disponibles
        const modelsResponse = await this.$axios.$get('/api/transcription/models')
        this.availableModels = modelsResponse.models || []
        this.qualityOptions = this.availableModels.map(model => ({
          text: `${model.displayName} ${model.recommended ? '(Recomendado)' : ''}`,
          value: model.name
        }))
        
        this.whisperEnabled = modelsResponse.whisperAvailable || false
        
        // Configurar valores por defecto
        if (this.availableLanguages.length > 0) {
          const defaultLang = this.availableLanguages.find((l) => l.recommended) || this.availableLanguages[0]
          this.generationLanguage = defaultLang.code
        } else {
          this.languageOptions = [
            { text: 'Español', value: 'es' },
            { text: 'English', value: 'en' }
          ]
          if (!this.languageOptions.some((opt) => opt.value === this.generationLanguage)) {
            this.generationLanguage = 'es'
          }
        }
        
        if (this.availableModels.length > 0) {
          const defaultModel = this.availableModels.find((m) => m.recommended) || this.availableModels[0]
          this.generationQuality = defaultModel.name
        } else {
          this.qualityOptions = [
            { text: 'Whisper large-v3', value: 'large-v3' }
          ]
          this.generationQuality = 'large-v3'
        }
        
      } catch (error) {
        console.error('Error cargando opciones disponibles:', error)
        this.whisperEnabled = false
        if (!this.languageOptions.length) {
          this.languageOptions = [
            { text: 'Español', value: 'es' },
            { text: 'English', value: 'en' }
          ]
        }
        if (!this.qualityOptions.length) {
          this.qualityOptions = [
            { text: 'Whisper large-v3', value: 'large-v3' }
          ]
        }
      }
    },
    async loadSubtitles() {
      if (!this.libraryItem) return
      
      try {
        const response = await this.$axios.$get(`/api/items/${this.libraryItem.id}/subtitles`)
        this.subtitles = response || []
        console.log('Loaded subtitles:', this.subtitles)
      } catch (error) {
        console.error('Error cargando subtítulos:', error)
        this.$toast.error('Error cargando subtítulos')
      }
    },
    async checkTranscriptionStatus() {
      if (!this.libraryItem) return
      
      try {
        const status = await this.$axios.$get(`/api/items/${this.libraryItem.id}/transcription/status`)
        this.transcriptionStatus = status
        
        // Si está procesando, continuar verificando
        if (status.status === 'processing') {
          this.startStatusCheck()
        } else {
          this.clearStatusCheck()
          if (status.status === 'completed') {
            this.loadSubtitles()
          }
        }
      } catch (error) {
        console.error('Error verificando estado de transcripción:', error)
      }
    },
    startStatusCheck() {
      this.clearStatusCheck()
      this.statusCheckInterval = setInterval(() => {
        this.checkTranscriptionStatus()
      }, 5000) // Verificar cada 5 segundos
    },
    clearStatusCheck() {
      if (this.statusCheckInterval) {
        clearInterval(this.statusCheckInterval)
        this.statusCheckInterval = null
      }
    },
    toggleGenerationOptions() {
      if (!this.canGenerate || this.processing) return
      this.showGenerationOptions = !this.showGenerationOptions
    },
    async generateSubtitles() {
      if (!this.canGenerate || this.processing) return
      
      this.processing = true
      
      try {
        await this.$axios.$post(`/api/items/${this.libraryItem.id}/transcribe`, {
          language: this.generationLanguage,
          model: this.generationQuality,
          force: this.forceRegenerate
        })
        
        this.$toast.success('Transcripción iniciada. Esto puede tomar varios minutos.')
        this.showGenerationOptions = false
        this.transcriptionStatus = {
          status: 'processing',
          progress: 0,
          language: this.generationLanguage,
          model: this.generationQuality
        }
        this.startStatusCheck()
        
      } catch (error) {
        console.error('Error iniciando transcripción:', error)
        const message = error.response?.data?.error || 'Error iniciando transcripción'
        this.$toast.error(message)
      } finally {
        this.processing = false
      }
    },
    async uploadSubtitles(file) {
      if (!file || !this.libraryItem) return
      
      // Mostrar diálogo para seleccionar idioma
      const language = await this.promptForLanguage()
      if (!language) return
      
      const formData = new FormData()
      formData.append('subtitle', file)
      formData.append('language', language)
      
      try {
        await this.$axios.$post(`/api/items/${this.libraryItem.id}/subtitles/upload`, formData)
        this.$toast.success('Subtítulos subidos correctamente')
        this.loadSubtitles()
      } catch (error) {
        console.error('Error subiendo subtítulos:', error)
        const message = error.response?.data?.error || 'Error subiendo subtítulos'
        this.$toast.error(message)
      }
    },
    async promptForLanguage() {
      // Simplificado - en una implementación real usarías un modal
      const language = prompt('Ingrese el código de idioma (ej: es, en, fr):')
      return language?.trim().toLowerCase()
    },
    async downloadSubtitle(language, format) {
      if (!this.libraryItem) return
      
      try {
        const response = await this.$axios({
          url: `/api/items/${this.libraryItem.id}/subtitles/${language}/${format}`,
          method: 'get',
          responseType: 'blob'
        })

        const url = window.URL.createObjectURL(new Blob([response.data]))
        const link = document.createElement('a')
        link.href = url
        link.download = `${this.title}_${language}.${format}`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
        
      } catch (error) {
        console.error('Error descargando subtítulos:', error)
        this.$toast.error('Error descargando subtítulos')
      }
    },
    async deleteSubtitle(language) {
      if (!confirm(`¿Estás seguro de que quieres eliminar los subtítulos en ${this.getLanguageName(language)}?`)) {
        return
      }
      
      try {
        await this.$axios.$delete(`/api/items/${this.libraryItem.id}/subtitles/${language}`)
        this.$toast.success('Subtítulos eliminados')
        this.loadSubtitles()
      } catch (error) {
        console.error('Error eliminando subtítulos:', error)
        this.$toast.error('Error eliminando subtítulos')
      }
    },
    getLanguageName(code) {
      const languages = {
        spanish: 'Español',
        english: 'English',
        french: 'Français',
        german: 'Deutsch',
        italian: 'Italiano',
        portuguese: 'Português',
        es: 'Español',
        en: 'English',
        fr: 'Français',
        de: 'Deutsch',
        it: 'Italiano',
        pt: 'Português',
        auto: 'Detección automática'
      }
      return languages[code] || code.toUpperCase()
    }
  }
}
</script>