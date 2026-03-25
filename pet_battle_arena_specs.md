# PET BATTLE ARENA (2D WEB) — SPECS.md

## 🧠 Objetivo
Desarrollar un juego 2D en tiempo real basado en interacción con TikTok Live, donde múltiples usuarios generan entidades (mascotas) mediante el chat, y estas combaten automáticamente contra oleadas de enemigos.

---

## 🧱 Stack Tecnológico (Solo Web 2D)

### 🎮 Renderizado y lógica gráfica
- **Phaser.js** → Framework principal para lógica del juego y manejo de escenas
- **PixiJS** → Motor de renderizado WebGL (Phaser lo usa internamente o puede usarse directo para optimización avanzada)

---

### ⚡ Tiempo real (comunicación)
- **Node.js** → Servidor backend
- **Socket.IO** → Comunicación bidireccional en tiempo real

---

### 📡 Integración con TikTok Live
- **tiktok-live-connector (Node.js)** → Captura eventos del live:
  - Comentarios
  - Likes
  - Regalos

---

### 🔊 Audio
- **Howler.js** → Manejo de sonidos reactivos y efectos dinámicos

---

### 🎨 Assets
- Pixel art optimizado (spritesheets)
- Tamaño recomendado: 8px–32px por entidad

---

## 🏗️ Arquitectura

TikTok Live
↓
tiktok-live-connector
↓
Node.js (event processor)
↓
Socket.IO Server
↓
Cliente Web (Phaser/Pixi)
↓
Render en OBS (Browser Source)

---

## 🎮 Mecánica del Juego

### Core Loop
- Generación automática de enemigos por oleadas
- Las mascotas atacan automáticamente
- El jugador (streamer) es visual, no interactivo directamente

---

### Input desde Chat

Cada comentario genera una entidad:

| Input | Resultado |
|------|--------|
| "gato" | Mascota rápida |
| "perro" | Balanceada |
| "dragon" | Ataque de fuego |
| "conejo" | Muy rápido, bajo daño |

---

## 🐾 Sistema de Entidades

Cada mascota tiene:
- id
- tipo
- hp
- daño
- velocidad
- owner (usuario del chat)

---

## ⚔️ Sistema de Combate

- Detección por proximidad
- Ataque automático
- Hitboxes simples (AABB o circular)

---

## 🌊 Sistema de Oleadas

- Spawns cada X segundos
- Incremento progresivo de dificultad
- Boss cada cierto tiempo

---

## 🔥 Evento Especial (Viral)

Trigger:
- Regalos específicos (ej: Lion, Universe)

Efecto:
- Todas las mascotas se fusionan en un Mega Pet 2D
- Duración: 30 segundos
- Ataques masivos en área

Visual:
- Efectos de partículas
- Nombre del usuario en pantalla

---

## 📈 Sistema de Progresión

- Likes → pequeñas mejoras
- Regalos → upgrades directos
- Niveles por mascota

---

## ⚙️ Optimización

- Object Pooling obligatorio
- Límite de entidades activas (ej: 100–200)
- Uso de spritesheets
- Batch rendering

---

## 🧪 Features Opcionales

- Nombres sobre mascotas
- Ranking en tiempo real
- Mascotas raras
- Efectos visuales exagerados

---

## 🧠 Resumen Técnico

Aplicación web 2D en tiempo real que procesa eventos externos (TikTok Live) para generar entidades dinámicas en un entorno de combate automatizado, optimizado para alto volumen de objetos y baja latencia.

