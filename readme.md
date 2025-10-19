# Audiobookshelf Windows - Complete Distribution with Whisper Integration  [![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/kroryan/audiobookshelf)

**Custom Enhanced Audiobookshelf Distribution for Windows with Full Whisper Integration**

This project is a custom and enhanced distribution of Audiobookshelf that includes:
- ✅ **Native Windows application** with system tray
- ✅ **Complete server** with all dependencies
- ✅ **Full Whisper integration** with GPU detection and pre-installed models
- ✅ **Android mobile app** with complete subtitle functionality
- ✅ **Single Windows installer** with no external dependencies
- ✅ **Portable Node.js** included
- ✅ **Auto-updates disabled** by default

---

## 📜 Credits and Licenses

This project is built upon and integrates multiple open-source projects:

### **Core Projects**
- **[Audiobookshelf Server](https://github.com/advplyr/audiobookshelf)** by [@advplyr](https://github.com/advplyr)
  - License: **GPL v3.0**
  - Main audiobook and podcast server functionality

- **[Audiobookshelf Mobile App](https://github.com/advplyr/audiobookshelf-app)** by [@advplyr](https://github.com/advplyr)
  - License: **GPL v3.0**
  - Cross-platform mobile application (iOS/Android)

- **[Audiobookshelf Windows](https://github.com/mikiher/audiobookshelf-windows)** by [@mikiher](https://github.com/mikiher)
  - License: **GPL v3.0**
  - Windows native tray application and installer

### **Technology Stack**
- **[Node.js](https://nodejs.org/)** - Runtime environment
  - License: **MIT License**

- **[Whisper](https://github.com/openai/whisper)** by OpenAI
  - License: **MIT License**
  - AI-powered speech recognition and transcription

- **[Nuxt.js 2](https://nuxtjs.org/)** - Vue.js framework
  - License: **MIT License**

- **[Capacitor](https://capacitorjs.com/)** by Ionic
  - License: **MIT License**
  - Native mobile app development

- **[Inno Setup](https://jrsoftware.org/isinfo.php)** - Windows installer
  - License: **Custom License (Free for non-commercial use)**

### **Special Thanks**
- **[@advplyr](https://github.com/advplyr)** for creating the amazing Audiobookshelf ecosystem
- **[@mikiher](https://github.com/mikiher)** for the Windows native application foundation
- **OpenAI** for the Whisper speech recognition technology
- **All contributors** to the upstream projects

---

# Audiobookshelf Windows - Distribución Completa con Whisper

**Distribución Personalizada y Mejorada de Audiobookshelf para Windows con Integración Completa de Whisper**

Este proyecto es una distribución personalizada y mejorada de Audiobookshelf que incluye:
- ✅ **Aplicación Windows nativa** con sistema tray
- ✅ **Servidor completo** con todas las dependencias
- ✅ **Integración completa de Whisper** con detección GPU y modelos preinstalados
- ✅ **Aplicación móvil Android** con funcionalidad de subtítulos completa
- ✅ **Instalador único** de Windows sin dependencias externas
- ✅ **Node.js portable** incluido
- ✅ **Auto-actualizaciones deshabilitadas** por defecto

## 🚀 Key Features

### 🔊 **Whisper Transcription**
- **Automatic GPU detection** (CUDA/CPU fallback)
- **4 models included**: tiny, small, medium (pre-installed) + large-v3 (on-demand download)
- **Local transcription** with no external dependencies
- **Automatic optimization** based on available hardware

### 📱 **Enhanced Android App**
- **Fully functional subtitle system** with nativeHttp protocol
- **Improved interface** for subtitle selection
- **Complete compatibility** with all server features

### 🖥️ **Windows Application**
- **Native system tray** for server management
- **Auto-updates disabled** by default
- **Automatic Node.js server management**
- **Persistent configuration** in Windows registry

### 📦 **All-in-One Installer**
- **Single-click installation** with no external dependencies
- **Portable Node.js included** (v18.20.4)
- **Complete server** with all node_modules
- **Pre-installed Whisper models** (869MB of models)
- **Total size**: ~87MB (compressed)

---

## 🚀 Características Principales

### 🔊 **Transcripción con Whisper**
- **Detección automática de GPU** (CUDA/CPU fallback)
- **4 modelos incluidos**: tiny, small, medium (preinstalados) + large-v3 (descarga bajo demanda)
- **Transcripción local** sin dependencias externas
- **Optimización automática** según hardware disponible

### 📱 **Aplicación Android Mejorada**
- **Sistema de subtítulos completamente funcional** con protocolo nativeHttp
- **Interfaz mejorada** para selección de subtítulos
- **Compatibilidad completa** con todas las funciones del servidor

### 🖥️ **Aplicación Windows**
- **Sistema tray nativo** para gestión del servidor
- **Auto-actualizaciones deshabilitadas** por defecto
- **Gestión automática** del servidor Node.js
- **Configuración persistente** en registro de Windows

### 📦 **Instalador Todo-en-Uno**
- **Instalación de un solo clic** sin dependencias externas
- **Node.js portable incluido** (v18.20.4)
- **Servidor completo** con todos los node_modules
- **Modelos Whisper preinstalados** (869MB de modelos)
- **Tamaño total**: ~87MB (comprimido)

## 🏗️ Project Structure

This project is composed of **3 main repositories**:

### 1. **`audiobookshelf-app/`** - Mobile Application (Nuxt 2 + Capacitor)
```
audiobookshelf-app/
├── components/
│   └── app/
│       └── AudioPlayer.vue          # ✅ Subtitle system with nativeHttp
├── android/                         # ✅ Configured Android build
├── ios/                            # iOS support
└── ...
```

**Implemented improvements:**
- **Complete subtitle system** using Capacitor nativeHttp
- **Enhanced interface** for subtitle selection
- **Robust error handling** for network connections

### 2. **`audiobookshelf-server/`** - Main Server (Node.js)
```
audiobookshelf-server/
├── server/
│   └── managers/
│       └── TranscriptionManager.js  # ✅ Enhanced Whisper integration
├── client/
│   ├── components/
│   │   ├── modals/
│   │   │   └── SubtitlesModal.vue   # ✅ Improved response parsing
│   │   └── player/
│   │       └── PlayerUi.vue         # ✅ Fixed CC positioning
│   └── dist/                        # ✅ Regenerated client
└── ...
```

**Implemented improvements:**
- **Automatic detection of installed Whisper models**
- **Automatic GPU/CPU optimization**
- **Installer integration** for local models
- **Regenerated web client** with subtitle fixes

### 3. **Native Windows Application (C# .NET)**
```
├── AppTray.cs                       # ✅ Main tray logic
├── AudiobookshelfTray.csproj       # C# .NET Framework 4.6.1 project
├── SettingsDialog.cs               # Server configuration
├── ServerLogs.cs                   # Log visualization
└── Setup/
    └── Installer.iss               # ✅ Complete Inno Setup script
```

**Implemented improvements:**
- **Auto-updates disabled** by default
- **Portable Node.js integration**
- **Enhanced server management**
- **Complete installer** with all dependencies

---

## 🏗️ Estructura del Proyecto

Este proyecto está compuesto por **3 repositorios principales**:

### 1. **`audiobookshelf-app/`** - Aplicación Móvil (Nuxt 2 + Capacitor)
```
audiobookshelf-app/
├── components/
│   └── app/
│       └── AudioPlayer.vue          # ✅ Sistema de subtítulos con nativeHttp
├── android/                         # ✅ Build Android configurado
├── ios/                            # iOS support
└── ...
```

**Mejoras implementadas:**
- **Sistema de subtítulos completo** usando Capacitor nativeHttp
- **Interfaz mejorada** para selección de subtítulos
- **Manejo de errores robusto** para conexiones de red

### 2. **`audiobookshelf-server/`** - Servidor Principal (Node.js)
```
audiobookshelf-server/
├── server/
│   └── managers/
│       └── TranscriptionManager.js  # ✅ Integración Whisper mejorada
├── client/
│   ├── components/
│   │   ├── modals/
│   │   │   └── SubtitlesModal.vue   # ✅ Parseo de respuestas mejorado
│   │   └── player/
│   │       └── PlayerUi.vue         # ✅ Posicionamiento CC corregido
│   └── dist/                        # ✅ Cliente regenerado
└── ...
```

**Mejoras implementadas:**
- **Detección automática de modelos Whisper** instalados
- **Optimización GPU/CPU** automática
- **Integración con instalador** para modelos locales
- **Cliente web regenerado** con correcciones de subtítulos

### 3. **Aplicación Windows Nativa (C# .NET)**
```
├── AppTray.cs                       # ✅ Lógica principal del tray
├── AudiobookshelfTray.csproj       # Proyecto C# .NET Framework 4.6.1
├── SettingsDialog.cs               # Configuración del servidor
├── ServerLogs.cs                   # Visualización de logs
└── Setup/
    └── Installer.iss               # ✅ Script Inno Setup completo
```

**Mejoras implementadas:**
- **Auto-actualizaciones deshabilitadas** por defecto
- **Integración con Node.js portable**
- **Gestión mejorada del servidor**
- **Instalador completo** con todas las dependencias

## 🔧 Technical Changes Made

### 📱 **Android - Functional Subtitles**
**Modified files:**
- `audiobookshelf-app/components/app/AudioPlayer.vue`

**Changes:**
```javascript
// Before: Failed with "Network Error"
this.$axios.get(url)

// After: Works with nativeHttp
import { CapacitorHttp } from '@capacitor/core'
const response = await CapacitorHttp.get({
  url: fullUrl,
  headers: { 'Authorization': `Bearer ${this.$store.state.user.token}` }
})
```

### 🌐 **Web - Interface Fixes**
**Modified files:**
- `audiobookshelf-server/client/components/modals/SubtitlesModal.vue`
- `audiobookshelf-server/client/components/player/PlayerUi.vue`

**Changes:**
- **Correct parsing** of subtitle responses
- **Fixed positioning** of CC menu
- **Improved visibility** of controls

### 🎙️ **Server - Enhanced Whisper**
**Modified files:**
- `audiobookshelf-server/server/managers/TranscriptionManager.js`

**Changes:**
```javascript
// New: Installer model detection
detectInstalledModelsPath() {
  const installerModelsPath = path.join(__dirname, '..', '..', '..', 'whisper', 'models')
  if (fs.existsSync(installerModelsPath)) {
    return installerModelsPath
  }
  return this.ModelPath
}

// New: Local model preference
async getModel(modelKey) {
  const installerPath = this.detectInstalledModelsPath()
  const modelFileName = `${modelKey}.pt`
  const installerModelPath = path.join(installerPath, modelFileName)
  
  if (fs.existsSync(installerModelPath)) {
    return installerModelPath // Use pre-installed model
  }
  
  return this.downloadModel(modelKey) // Download if doesn't exist
}
```

### 🖥️ **Windows - Complete Installer**
**Modified files:**
- `AppTray.cs`
- `Setup/Installer.iss`

**Changes:**
```csharp
// Before: Depended on system Node.js
ProcessStartInfo psi = new ProcessStartInfo("node", serverPath);

// After: Uses included portable Node.js
string serverBinPath = Path.Combine(appPath, "nodejs", "node.exe");
ProcessStartInfo psi = new ProcessStartInfo(serverBinPath, serverPath);
```

---

## 🔧 Cambios Técnicos Realizados

### 📱 **Android - Subtítulos Funcionales**
**Archivos modificados:**
- `audiobookshelf-app/components/app/AudioPlayer.vue`

**Cambios:**
```javascript
// Antes: Fallaba con "Network Error"
this.$axios.get(url)

// Después: Funciona con nativeHttp
import { CapacitorHttp } from '@capacitor/core'
const response = await CapacitorHttp.get({
  url: fullUrl,
  headers: { 'Authorization': `Bearer ${this.$store.state.user.token}` }
})
```

### 🌐 **Web - Correcciones de Interfaz**
**Archivos modificados:**
- `audiobookshelf-server/client/components/modals/SubtitlesModal.vue`
- `audiobookshelf-server/client/components/player/PlayerUi.vue`

**Cambios:**
- **Parseo correcto** de respuestas de subtítulos
- **Posicionamiento fijo** del menú CC
- **Visibilidad mejorada** de controles

### 🎙️ **Servidor - Whisper Mejorado**
**Archivos modificados:**
- `audiobookshelf-server/server/managers/TranscriptionManager.js`

**Cambios:**
```javascript
// Nuevo: Detección de modelos del instalador
detectInstalledModelsPath() {
  const installerModelsPath = path.join(__dirname, '..', '..', '..', 'whisper', 'models')
  if (fs.existsSync(installerModelsPath)) {
    return installerModelsPath
  }
  return this.ModelPath
}

// Nuevo: Preferencia por modelos locales
async getModel(modelKey) {
  const installerPath = this.detectInstalledModelsPath()
  const modelFileName = `${modelKey}.pt`
  const installerModelPath = path.join(installerPath, modelFileName)
  
  if (fs.existsSync(installerModelPath)) {
    return installerModelPath // Usar modelo preinstalado
  }
  
  return this.downloadModel(modelKey) // Descargar si no existe
}
```

### 🖥️ **Windows - Instalador Completo**
**Archivos modificados:**
- `AppTray.cs`
- `Setup/Installer.iss`

**Cambios:**
```csharp
// Antes: Dependía de Node.js del sistema
ProcessStartInfo psi = new ProcessStartInfo("node", serverPath);

// Después: Usa Node.js portable incluido
string serverBinPath = Path.Combine(appPath, "nodejs", "node.exe");
ProcessStartInfo psi = new ProcessStartInfo(serverBinPath, serverPath);
```

## 🛠️ Build Instructions

### 📱 **Android App**
```bash
cd audiobookshelf-app
npm install
npm run generate
npx cap sync android
npx cap open android
# Build from Android Studio
```

### 🌐 **Web Server**
```bash
cd audiobookshelf-server
npm ci
cd client
npm ci
npm run generate
cd ..
```

### 🖥️ **Windows Application**
```bash
# Build C# application
dotnet build -c Release

# Build installer (requires Inno Setup)
cd Setup
"C:\Program Files (x86)\Inno Setup 6\ISCC.exe" Installer.iss
```

---

## 🛠️ Instrucciones de Compilación

### 📱 **Android App**
```bash
cd audiobookshelf-app
npm install
npm run generate
npx cap sync android
npx cap open android
# Compilar desde Android Studio
```

### 🌐 **Servidor Web**
```bash
cd audiobookshelf-server
npm ci
cd client
npm ci
npm run generate
cd ..
```

### 🖥️ **Aplicación Windows**
```bash
# Compilar aplicación C#
dotnet build -c Release

# Compilar instalador (requiere Inno Setup)
cd Setup
"C:\Program Files (x86)\Inno Setup 6\ISCC.exe" Installer.iss
```

## 📦 Final Installer Structure

The `AudiobookshelfInstaller-WithWhisper.exe` installer includes:

```
Final Installation/
├── AudiobookshelfTray.exe          # Windows application
├── nodejs/                         # Portable Node.js v18.20.4
│   ├── node.exe
│   └── ... (complete runtime)
├── server/                         # Complete audiobookshelf server
│   ├── index.js
│   ├── node_modules/              # All dependencies
│   ├── client/dist/               # Compiled web client  
│   └── ... (complete code)
└── whisper/
    └── models/                    # Pre-installed models
        ├── tiny.pt               # 37MB - Fastest
        ├── small.pt              # 240MB - Balanced
        └── medium.pt             # 754MB - Better quality
        # large-v3.pt downloads on-demand (~1.5GB)
```

**Total size**: ~87MB compressed, ~1.2GB installed

---

## 📦 Estructura del Instalador Final

El instalador `AudiobookshelfInstaller-WithWhisper.exe` incluye:

```
Instalación Final/
├── AudiobookshelfTray.exe          # Aplicación Windows
├── nodejs/                         # Node.js portable v18.20.4
│   ├── node.exe
│   └── ... (runtime completo)
├── server/                         # Audiobookshelf server completo
│   ├── index.js
│   ├── node_modules/              # Todas las dependencias
│   ├── client/dist/               # Cliente web compilado  
│   └── ... (código completo)
└── whisper/
    └── models/                    # Modelos preinstalados
        ├── tiny.pt               # 37MB - Más rápido
        ├── small.pt              # 240MB - Balanceado
        └── medium.pt             # 754MB - Mejor calidad
        # large-v3.pt se descarga bajo demanda (~1.5GB)
```

**Tamaño total**: ~87MB comprimido, ~1.2GB instalado

## 🚫 Excluded Files (.gitignore)

The following files/folders are **NOT uploaded** to the repository:

### Builds and Compilations
- `audiobookshelf-app/android/app/build/`
- `audiobookshelf-app/dist/`
- `audiobookshelf-server/client/dist/`
- `bin/`, `obj/`
- `Setup/Output/`

### Dependencies
- `node_modules/`
- `nodejs-portable/`
- Node.js `.zip` files

### Models and Data
- `WhisperDist/Models/`
- `audiobookshelf-server/temp/`
- `*.pt` files (Whisper models)

### Temporary Files
- `*.tmp`, `*.temp`
- `*.log`
- `.DS_Store`

---

## 🚫 Archivos Excluidos (.gitignore)

Los siguientes archivos/carpetas **NO se suben** al repositorio:

### Compilaciones y Builds
- `audiobookshelf-app/android/app/build/`
- `audiobookshelf-app/dist/`
- `audiobookshelf-server/client/dist/`
- `bin/`, `obj/`
- `Setup/Output/`

### Dependencias
- `node_modules/`
- `nodejs-portable/`
- Archivos `.zip` de Node.js

### Modelos y Datos
- `WhisperDist/Models/`
- `audiobookshelf-server/temp/`
- Archivos `*.pt` (modelos Whisper)

### Archivos Temporales
- `*.tmp`, `*.temp`
- `*.log`
- `.DS_Store`

## 🎯 Implemented Features

### ✅ **Fully Functional**
- [x] **Whisper transcription** with automatic GPU/CPU
- [x] **Android subtitles** with nativeHttp
- [x] **Web subtitles** with improved interface
- [x] **Windows installer** all-in-one
- [x] **Auto-updates** disabled
- [x] **Portable Node.js** integrated
- [x] **Pre-installed models** (3 of 4)

### 🔄 **Advanced Features**
- [x] **Automatic hardware detection** GPU
- [x] **CPU fallback** when GPU unavailable
- [x] **Optimized memory management**
- [x] **On-demand download** for large-v3 model
- [x] **Installation with no external dependencies**

---

## 🎯 Funcionalidades Implementadas

### ✅ **Completamente Funcional**
- [x] **Transcripción Whisper** con GPU/CPU automático
- [x] **Subtítulos Android** con nativeHttp
- [x] **Subtítulos Web** con interfaz mejorada
- [x] **Instalador Windows** todo-en-uno
- [x] **Auto-actualizaciones** deshabilitadas
- [x] **Node.js portable** integrado
- [x] **Modelos preinstalados** (3 de 4)

### 🔄 **Características Avanzadas**
- [x] **Detección automática** de hardware GPU
- [x] **Fallback CPU** cuando GPU no disponible
- [x] **Gestión de memoria** optimizada
- [x] **Descarga bajo demanda** para modelo large-v3
- [x] **Instalación sin dependencias** externas

## 📋 System Requirements

### Windows
- **Windows 10 64-bit** or later
- **4GB RAM** minimum (8GB recommended for Whisper)
- **2GB free space** for complete installation
- **NVIDIA GPU** (optional, for CUDA acceleration)

### Android
- **Android 7.0** (API level 24) or later
- **2GB RAM** minimum
- **Internet connection** for streaming

---

## 📋 Requisitos del Sistema

### Windows
- **Windows 10 64-bit** o superior
- **4GB RAM** mínimo (8GB recomendado para Whisper)
- **2GB espacio libre** para instalación completa
- **GPU NVIDIA** (opcional, para aceleración CUDA)

### Android
- **Android 7.0** (API level 24) o superior
- **2GB RAM** mínimo
- **Conexión a internet** para streaming

## 🤝 Contributing

This project combines multiple upstream repositories:
- [audiobookshelf](https://github.com/advplyr/audiobookshelf) - Main server
- [audiobookshelf-app](https://github.com/advplyr/audiobookshelf-app) - Mobile app
- [audiobookshelf-windows](https://github.com/mikiher/audiobookshelf-windows) - Windows app

**Custom improvements implemented for complete subtitle and Whisper functionality.**

---

## 🤝 Contribución

Este proyecto combina múltiples repositorios upstream:
- [audiobookshelf](https://github.com/advplyr/audiobookshelf) - Servidor principal
- [audiobookshelf-app](https://github.com/advplyr/audiobookshelf-app) - App móvil
- [audiobookshelf-windows](https://github.com/mikiher/audiobookshelf-windows) - App Windows

**Mejoras personalizadas implementadas para funcionalidad completa de subtítulos y Whisper.**

## 📄 Licenses

### **Main Components**
- **Audiobookshelf Server & App**: GPL v3.0
- **Audiobookshelf Windows**: GPL v3.0
- **Whisper**: MIT License
- **Node.js**: MIT License
- **Nuxt.js**: MIT License
- **Capacitor**: MIT License

### **Development Tools**
- **Inno Setup**: Custom License (Free for non-commercial use)

All modifications and enhancements in this distribution maintain compatibility with the original licenses.

---

## 📄 Licencias

- **Audiobookshelf**: GPL v3.0
- **Whisper**: MIT License
- **Node.js**: MIT License
- **Aplicación Windows**: Basada en audiobookshelf-windows

---

## 🚀 Quick Installation

1. **Download** `AudiobookshelfInstaller-WithWhisper.exe`
2. **Run** the installer as administrator
3. **Start** Audiobookshelf from Windows menu or desktop icon
4. **Access** from browser at `http://localhost:13378`
5. **Enjoy** automatic transcription and functional subtitles!

**Everything included. Zero configuration. Works immediately.**

---

## 🚀 Instalación Rápida

1. **Descarga** `AudiobookshelfInstaller-WithWhisper.exe`
2. **Ejecuta** el instalador como administrador
3. **Inicia** Audiobookshelf desde el menú de Windows o icono del escritorio
4. **Accede** desde el navegador en `http://localhost:13378`
5. **¡Disfruta** de transcripción automática y subtítulos funcionales!

**Todo incluido. Cero configuración. Funciona inmediatamente.**
