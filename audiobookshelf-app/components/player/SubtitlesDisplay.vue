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
      default: 22
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
    enabled: {
      immediate: true,
      handler(enabled) {
        console.log(`[SUBTITLE DISPLAY] Enabled changed:`, enabled)
      }
    },
    subtitles: {
      immediate: true,
      handler(subtitles) {
        console.log(`[SUBTITLE DISPLAY] Subtitles array changed:`, subtitles?.length || 0, 'entries')
        if (subtitles?.length > 0) {
          console.log(`[SUBTITLE DISPLAY] First subtitle:`, subtitles[0])
        }
      }
    },
    currentTime: {
      immediate: true,
      handler(newTime) {
        console.log(`[SUBTITLE DISPLAY] Current time:`, newTime, 'enabled:', this.enabled, 'subtitles:', this.subtitles?.length || 0)
        
        if (!this.enabled || !this.subtitles.length) {
          this.currentSubtitle = null
          return
        }
        
        // Buscar el subtítulo correspondiente al tiempo actual
        const subtitle = this.subtitles.find(sub => 
          newTime >= sub.startTime && newTime < sub.endTime
        )
        
        console.log(`[SUBTITLE DISPLAY] Found subtitle for time ${newTime}:`, subtitle)
        
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
  bottom: 120px;
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
  padding: 12px 24px;
  border-radius: 8px;
  text-align: center;
  max-width: 90%;
  line-height: 1.6;
  word-wrap: break-word;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.7);
  font-weight: 700;
  letter-spacing: 0.4px;
  transition: all 0.2s ease-in-out;
}

/* Tema oscuro */
.subtitle-text.dark-theme {
  background-color: rgba(0, 0, 0, 0.90);
  color: #ffffff;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.9),
               -1px -1px 2px rgba(0, 0, 0, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.15);
}

/* Tema claro */
.subtitle-text.light-theme {
  background-color: rgba(255, 255, 255, 0.95);
  color: #000000;
  text-shadow: 1px 1px 2px rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(0, 0, 0, 0.2);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
}

@media (min-width: 640px) {
  .subtitles-container {
    bottom: 140px;
    padding: 0 30px;
  }
  
  .subtitle-text {
    max-width: 85%;
    padding: 14px 28px;
  }
}

@media (min-width: 768px) {
  .subtitles-container {
    bottom: 160px;
  }
  
  .subtitle-text {
    max-width: 80%;
  }
}
</style>
