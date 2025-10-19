<template>
  <div v-if="enabled && currentSubtitle" class="subtitles-container">
    <div class="subtitle-text" :style="subtitleStyle" :class="isDarkTheme ? 'dark-theme' : 'light-theme'">
      {{ currentSubtitle.text }}
    </div>
  </div>
</template>

<script>
export default {
  props: {
    enabled: {
      type: Boolean,
      default: false
    },
    currentTime: {
      type: Number,
      default: 0
    },
    subtitles: {
      type: Array,
      default: () => []
    },
    fontSize: {
      type: Number,
      default: 20
    },
    backgroundColor: {
      type: String,
      default: null
    }
  },
  data() {
    return {
      currentSubtitle: null
    }
  },
  computed: {
    isDarkTheme() {
      return this.$store.state.theme === 'dark' || !this.$store.state.theme
    },
    subtitleStyle() {
      const baseStyle = {
        fontSize: `${this.fontSize}px`
      }
      
      // Si se proporciona un color de fondo personalizado, usarlo
      if (this.backgroundColor) {
        baseStyle.backgroundColor = this.backgroundColor
      }
      
      return baseStyle
    }
  },
  watch: {
    currentTime: {
      immediate: true,
      handler(newTime) {
        if (!this.enabled || !this.subtitles.length) {
          this.currentSubtitle = null
          return
        }
        
        // Buscar el subtítulo correspondiente al tiempo actual
        const subtitle = this.subtitles.find(sub => 
          newTime >= sub.startTime && newTime < sub.endTime
        )
        
        this.currentSubtitle = subtitle || null
      }
    },
    subtitles() {
      // Reiniciar subtítulo actual cuando cambian los subtítulos
      if (this.currentTime !== undefined) {
        this.updateCurrentSubtitle(this.currentTime)
      }
    }
  },
  methods: {
    updateCurrentSubtitle(time) {
      if (!this.enabled || !this.subtitles.length) {
        this.currentSubtitle = null
        return
      }
      
      const subtitle = this.subtitles.find(sub => 
        time >= sub.startTime && time < sub.endTime
      )
      
      this.currentSubtitle = subtitle || null
    }
  }
}
</script>

<style scoped>
.subtitles-container {
  position: absolute;
  bottom: 80px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0 20px;
  pointer-events: none;
  z-index: 100;
}

.subtitle-text {
  padding: 10px 20px;
  border-radius: 6px;
  text-align: center;
  max-width: 90%;
  line-height: 1.5;
  word-wrap: break-word;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.6);
  font-weight: 600;
  letter-spacing: 0.3px;
  transition: all 0.2s ease-in-out;
}

/* Tema oscuro */
.subtitle-text.dark-theme {
  background-color: rgba(0, 0, 0, 0.85);
  color: #ffffff;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.9),
               -1px -1px 2px rgba(0, 0, 0, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

/* Tema claro */
.subtitle-text.light-theme {
  background-color: rgba(255, 255, 255, 0.95);
  color: #000000;
  text-shadow: 1px 1px 2px rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(0, 0, 0, 0.15);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

@media (min-width: 640px) {
  .subtitles-container {
    bottom: 90px;
    padding: 0 30px;
  }
  
  .subtitle-text {
    max-width: 85%;
    padding: 12px 24px;
  }
}

@media (min-width: 768px) {
  .subtitles-container {
    bottom: 100px;
  }
  
  .subtitle-text {
    max-width: 75%;
  }
}

@media (min-width: 1024px) {
  .subtitles-container {
    bottom: 110px;
  }
  
  .subtitle-text {
    max-width: 65%;
    padding: 14px 28px;
  }
}
</style>
