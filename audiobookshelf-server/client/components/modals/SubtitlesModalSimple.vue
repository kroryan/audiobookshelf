<template>
  <Modal v-model="show" name="subtitles-modal" :width="600" :height="400">
    <template #outer>
      <div class="absolute top-0 left-0 p-5 w-2/3 overflow-hidden">
        <p class="text-3xl text-white truncate">{{ title }}</p>
      </div>
    </template>
    <div class="p-6 w-full">
      <h2 class="text-2xl font-bold mb-4">Gestión de Subtítulos</h2>
      
      <div v-if="!libraryItem" class="text-center py-8">
        <p class="text-gray-400">No hay item seleccionado</p>
      </div>
      
      <div v-else>
        <p class="mb-4">Item: {{ libraryItem.media.metadata.title }}</p>
        
        <div class="mb-6">
          <ui-btn color="success" @click="testGenerate">
            🎯 Generar Subtítulos (TEST)
          </ui-btn>
        </div>
        
        <div class="bg-gray-800 p-4 rounded">
          <h3 class="font-semibold mb-2">Estado:</h3>
          <p>{{ statusMessage }}</p>
        </div>
      </div>
    </div>
  </Modal>
</template>

<script>
export default {
  data() {
    return {
      statusMessage: 'Listo para generar subtítulos'
    }
  },
  computed: {
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
      return this.libraryItem?.media?.metadata?.title || 'Subtítulos'
    }
  },
  methods: {
    async testGenerate() {
      if (!this.libraryItem) {
        this.statusMessage = 'Error: No hay item seleccionado'
        return
      }
      
      try {
        this.statusMessage = 'Iniciando transcripción...'
        
        const response = await this.$axios.$post(`/api/items/${this.libraryItem.id}/transcribe`, {
          language: 'spanish',
          model: 'large-v3',
          force: false
        })
        
        this.statusMessage = `✅ ${response.message || 'Transcripción iniciada correctamente'}`
        this.$toast.success('Transcripción iniciada! Esto puede tomar varios minutos.')
        
      } catch (error) {
        console.error('Error:', error)
        this.statusMessage = `❌ Error: ${error.response?.data?.error || error.message}`
        this.$toast.error('Error al iniciar transcripción')
      }
    }
  }
}
</script>
