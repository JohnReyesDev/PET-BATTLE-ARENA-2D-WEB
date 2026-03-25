---
name: tiktok-live-game-creator
description: >
  Design and engineer interactive real-time games for TikTok Live streams. Use this skill whenever the user wants to create, design, prototype, or conceptualize a live-stream interactive game, minigame, or viewer engagement experience — especially for TikTok Live, Twitch, YouTube Live, or any platform with comments, gifts/donations, and likes as interaction primitives. Trigger this skill when the user mentions TikTok Live games, interactive overlays, viewer participation mechanics, stream games, live engagement tools, comment-activated events, gift-triggered effects, or any request to make a live stream more interactive or viral. Also trigger for requests about game design for live audiences, real-time crowd mechanics, or stream entertainment systems. This skill is ESSENTIAL — always use it rather than attempting to generate live stream game concepts from general knowledge.
compatibility:
  recommended_renderers: [PixiJS, Three.js, Babylon.js, Unity WebGL, Canvas 2D]
  realtime_layer: [WebSockets, Socket.io, Node.js]
  physics: [Matter.js, Cannon.js]
  animation: [GSAP, Anime.js]
  platforms: [TikTok Live, Twitch, YouTube Live, Instagram Live]
---

# TikTok Live Interactive Game Creator

A specialized skill for designing, specifying, and prototyping interactive games that run as overlays or standalone experiences during live streams, with deep integration into platform interaction primitives (comments, gifts, likes).

---

## Skill Activation Contexts

Activate this skill for ANY of the following:
- "Design a game for my TikTok Live"
- "I want viewers to interact with a game during my stream"
- "Create a minigame where comments trigger effects"
- "How do I make my live stream more engaging?"
- "Build a viewer participation mechanic"
- "I want gifts to do something visual on my stream"
- "Design a battle royale / trivia / survival game for live"
- Requests for stream overlay games, viewer-driven games, gift-powered experiences

---

## Phase 1: Game Concept Architecture

### Step 1.1 — Classify the Request

Determine which design mode is needed:

| Mode | When to Use |
|---|---|
| **CONCEPT** | User wants a creative brief, no code |
| **SPEC** | User wants technical specifications for a developer |
| **PROTOTYPE** | User wants working code (Canvas/Pixi/Three.js) |
| **HYBRID** | Concept + code skeleton |

Ask the user to clarify if ambiguous. Default to **HYBRID** if unspecified.

### Step 1.2 — Extract Context Parameters

Before generating, gather or infer:

```
stream_audience_size: [small <100 | medium 100–1K | large 1K+]
stream_niche: [gaming | entertainment | education | lifestyle | music | etc.]
interaction_intensity: [chill | active | chaotic]
visual_style: [2D | 3D | mixed]
session_duration: [15min | 30min | 1hr | ongoing]
game_archetype: [competitive | survival | luck | trivia | creative | battle_royale | custom]
monetization_focus: [gifts | likes | comments | balanced]
streamer_experience: [beginner | intermediate | expert]
```

If the user provides a game idea, extract these implicitly from their description.

---

## Phase 2: Interaction Primitive Mapping

This is the **most critical design layer**. Every game mechanic MUST map to one or more TikTok Live interaction primitives.

### Comment System Design

```
COMMENT PROCESSING PIPELINE:
  Input → Normalize text (lowercase, trim) → Match against trigger table
       → Validate cooldown (per-user: 3sec minimum, per-event: configurable)
       → Execute visual event → Display viewer name on screen

TRIGGER TABLE STRUCTURE:
  {
    trigger: "string | regex | emoji",
    eventType: "spawn | transform | destroy | score | environment",
    effect: "description of visual outcome",
    cooldown_ms: 3000,
    priority: 1–10,
    teamRestriction: "red | blue | none"
  }
```

**Design rules:**
- Maximum 8–12 comment triggers per game (cognitive overload prevention)
- At least 2 triggers must be emoji-based (universal, no language barrier)
- One trigger must produce a FUNNY or unexpected effect (meme moment generator)
- Always display the triggering viewer's username on screen within 500ms

### Gift Tier System Design

```
GIFT VALUE TIERS (TikTok coin reference):
  Tier 1 — Micro    (1–99 coins):    cosmetic burst, name popup (1–2 sec)
  Tier 2 — Minor    (100–499 coins): minor game event (5–10 sec)
  Tier 3 — Major    (500–2,999):     significant game shift (15–30 sec)
  Tier 4 — Legendary (3,000+ coins): LEYENDA MODE full takeover (45 sec)

VARIABLE REWARD MULTIPLIER:
  Standard outcome:  85% probability
  Surprise outcome:  15% probability (triggers mystery event)
  — This variance prevents habituation and creates compulsive gifting loops
```

**LEYENDA MODE requirements (mandatory for Legendary tier):**
1. Screen-wide visual transition (fade to black + dramatic reveal)
2. Donor's name displayed at maximum readable scale for the environment
3. Unique character transformation or environment state (not seen at lower tiers)
4. Epic music track switch (minimum 45-second duration)
5. Particle/effect density: 3–5x normal maximum
6. On-screen countdown timer so audience knows how long it lasts

### Likes Energy System Design

```
LIKES-PER-MINUTE (LPM) THRESHOLDS:
  IDLE      0–10 LPM:    Slow, beautiful, attracts attention
  ACTIVE   11–50 LPM:    Normal gameplay speed
  HEATED   51–200 LPM:   Accelerated — enemies faster, rewards larger
  FRENZY  201+ LPM:      CHAOS MODE — max intensity, special boss, screen effects

VISUAL ENERGY BAR:
  - Always visible on screen (suggest: top or bottom edge, full width)
  - Animates fill in real-time with like velocity
  - Color shifts from blue → green → yellow → red as thresholds climb
  - Pulses with a heartbeat animation near threshold boundaries
```

---

## Phase 3: Visual Design Execution

### 2D Visual System

**Color Palette Selection:**
```
PALETTE_A (High Energy): Neon cyan #00FFFF, Neon magenta #FF00FF, 
  Electric yellow #FFFF00 on Black #000000
  
PALETTE_B (Warm Energy): Coral #FF6B6B, Teal #4ECDC4, 
  Cream #FFE66D on Deep Navy #1A1A2E
  
PALETTE_C (Fantasy): Purple #9B59B6, Gold #F1C40F, 
  Ice Blue #85C1E9 on Black #0D0D0D

RULE: Minimum 7:1 contrast ratio for all game-critical UI elements
RULE: Background must have minimum 3 independent animation layers (parallax)
```

**Typography System:**
```
EVENT TEXT:    Display font, min 72px, always animated (bounce, scale, flash)
SCORE TEXT:    Monospace or display, 48–64px, real-time update with tween
PLAYER NAME:   Bold, high contrast outline, 32–48px, appears for 2–4 seconds
TIMER TEXT:    Display font, 56px, color-shifts as time runs low
```

**Particle System Requirements:**
- Minimum 3 particle emitters: idle ambient, action burst, event explosion
- Idle: subtle floating particles at 20% opacity (depth without noise)
- Action: directional burst toward event location (200–500 particles, 0.5s)
- Event: full-screen explosion (1,000+ particles, 1.5–3s, chromatic spread)

### 3D Visual System

**Lighting Rig (Event-Reactive):**
```javascript
// Three.js lighting template
const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
const dramaticSpot = new THREE.SpotLight(0xffffff, 1.5);
const eventFill = new THREE.PointLight(eventColor, 0, 100); // intensity=0 by default
// On event trigger: GSAP.to(eventFill, { intensity: 3, duration: 0.1, yoyo: true })
```

**Camera Movement Protocol:**
- Idle: slow orbital rotation at 0.001 rad/frame
- Minor event: push-in zoom (FOV -10°) over 0.3s, hold 0.5s, pull back 0.5s
- Major event: dramatic zoom + rotation (FOV -20°, 45° Y-rotation) over 0.8s
- LEYENDA: full cinematic sequence — zoom out to world scale, then dramatic push in on hero

---

## Phase 4: Game Loop Engineering

### Core Loop Design Checklist

Every game loop must satisfy ALL of these:

- [ ] **Zero-instruction comprehension:** A new viewer understands in 3 seconds
- [ ] **Idle attractiveness:** Beautiful and in motion with zero interactions
- [ ] **Explosion on interaction:** Visually dramatic response to any input
- [ ] **Collective agency:** Individual actions contribute to shared outcome
- [ ] **Progress visibility:** Some form of score, bar, or state always visible
- [ ] **Infinite scalability:** Works with 5 viewers or 50,000 viewers
- [ ] **Graceful failure:** If input floods, queue and process — never crash

### Escalation Curve Design

```
INTENSITY TIMELINE (for 60-minute session):

  Min 00–03: LEVEL 1 — Clean, inviting, minimal effects
             Speed: 1.0x | Particles: 30% | Colors: Saturated
  
  Min 03–06: LEVEL 2 — Warming up, first special event at min 5
             Speed: 1.2x | Particles: 50% | Colors: +10% saturation
  
  Min 06–10: LEVEL 3 — Momentum building
             Speed: 1.4x | Particles: 70% | Colors: Shifted warmer
  
  Min 10–15: LEVEL 4 — High energy, second major event
             Speed: 1.7x | Particles: 85% | Background: Active animations
  
  Min 15–20: LEVEL 5 — Peak standard intensity
             Speed: 2.0x | Particles: 100% | New enemy types unlocked
  
  Min 20+:   SUSTAINED PEAK — Special events every 90 seconds
             Escalation maintained; viewer fatigue prevention via event variety

IMPLEMENTATION: Use a setInterval timer that adjusts game state multipliers.
Expose an escalationLevel variable (1–5) that all subsystems read.
```

### Special Event System

```
EVENT SCHEDULER:
  Base trigger: every 60–90 seconds (randomize within window)
  Override trigger: gift received above Tier 3
  Emergency trigger: LPM drops below threshold for 20+ seconds (re-engagement)

EVENT POOL (rotate, never repeat consecutively):
  1. BOSS_SPAWN    — Elite enemy appears with unique mechanics and health bar
  2. MAP_FLIP      — Environment rotates/mirrors, gameplay inverted for 20s
  3. COMMENT_RAIN  — Last 30 comments become physical projectiles in-world
  4. PALETTE_SHIFT — Full color scheme transforms over 2 seconds
  5. GRAVITY_FLIP  — Physics inverted, all objects affected
  6. GHOST_MODE    — Enemies become semi-transparent, new win condition
  7. SPEED_BURST   — 10-second hyperspeed with particle trail intensity x5
  8. MIRROR_WORLD  — Left/right controls inverted, comment triggers swapped
```

---

## Phase 5: Output Specification

### Full Game Design Document Format

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎮 [GAME NAME]
   [Subtitle — evocative, cinematic, maximum 8 words]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

LOGLINE
[1 sentence. Present tense. Active voice. Maximum 25 words.]

─── FIRST FRAME DESCRIPTION ───
[Cinematic description of the opening 5 seconds: colors, motion, sound, text, 
 what the viewer's eye is drawn to first. 50–100 words.]

─── CORE MECHANIC ───
[1 sentence. How the game works. Zero ambiguity.]

─── INTERACTION MAP ───
COMMENTS:
  "[trigger word]" → [Effect description + duration]
  "[trigger word]" → [Effect description + duration]
  [emoji]          → [Effect description + duration]

GIFTS:
  Tier 1 (1–99c)    → [Effect]
  Tier 2 (100–499c) → [Effect]
  Tier 3 (500–2,999c)→ [Effect]
  LEYENDA (3,000c+) → [Full LEYENDA MODE description]
  SURPRISE (15%)    → [Mystery effect that deviates from standard]

LIKES:
  IDLE   → [State description]
  ACTIVE → [State description]
  HEATED → [State description]
  FRENZY → [State description]

─── ESCALATION TIMELINE ───
00–03m: [State]
03–06m: [State + first event]
06–10m: [State]
10–15m: [State + second event]
15–20m: [Peak state]
20m+:   [Sustained state + event frequency]

─── VIRAL MOMENT DESIGN ───
[Description of the single most shareable moment. Trigger, visual sequence, 
 duration, viewer name integration, audio, emotional peak. 80–120 words.]

─── SPECIAL EVENTS (×3 minimum) ───
EVENT 1 — [Name]: [Description, trigger condition, duration, visual behavior]
EVENT 2 — [Name]: [Description, trigger condition, duration, visual behavior]
EVENT 3 — [Name]: [Description, trigger condition, duration, visual behavior]

─── TECHNOLOGY STACK ───
Renderer:      [Primary visual library]
Physics:       [If applicable]
Animation:     [Tweening library]
Real-time:     [WebSocket solution if needed]
Audio:         [Howler.js / Web Audio API]
Deployment:    [iframe overlay | OBS browser source | standalone URL]

─── RETENTION HOOK ───
[Why a viewer CANNOT close this stream. The psychological and narrative 
 reason they must stay. 2–3 sentences maximum.]

─── CODE SKELETON (if PROTOTYPE mode) ───
[Working HTML/JS scaffold with core loop, event listeners, and placeholder
 visuals. Minimum viable demo that runs in a browser.]
```

---

## Phase 6: Technical Implementation Guides

### Browser Source Setup (OBS/StreamLabs)

```
DEPLOYMENT PATTERN:
  1. Host game at HTTPS URL (GitHub Pages, Netlify, Vercel)
  2. Add as Browser Source in OBS: width=1920, height=1080, fps=60
  3. Enable "Shutdown source when not visible" = OFF
  4. Custom CSS: body { background: transparent !important; }
  5. TikTok Live integration: Use TikTok Live Connector API or 
     third-party bridge (TikTokLive Python library → WebSocket bridge)

COMMENT INGESTION PIPELINE:
  TikTok Live → API/Scraper → Node.js server → WebSocket → Browser game

LATENCY TARGET: <800ms from comment to visual event
```

### PixiJS Quick-Start Template

```javascript
// CORE SETUP — PixiJS 7.x
const app = new PIXI.Application({
  width: 1920, height: 1080,
  backgroundColor: 0x000000,
  resolution: window.devicePixelRatio || 1,
  autoDensity: true,
  antialias: true
});
document.body.appendChild(app.view);

// PARTICLE EMITTER — using @pixi/particle-emitter
const emitter = new Emitter(app.stage, {
  emit: false,
  autoUpdate: true,
  // ... config
});

// EVENT BUS — central event system
const events = new EventTarget();

// COMMENT HANDLER
function onComment(username, text) {
  const trigger = triggerTable.find(t => text.includes(t.keyword));
  if (trigger) {
    displayUsername(username);
    trigger.execute();
  }
}

// GAME LOOP
app.ticker.add((delta) => {
  emitter.update(delta * 0.01);
  updateGameState(delta);
  updateUI();
});
```

### Three.js Event-Reactive Template

```javascript
// SCENE SETUP
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, 16/9, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// REACTIVE LIGHTING
const eventLight = new THREE.PointLight(0xff0000, 0, 50);
scene.add(eventLight);

function triggerLightEvent(color, intensity, duration) {
  eventLight.color.setHex(color);
  gsap.to(eventLight, {
    intensity: intensity,
    duration: 0.15,
    yoyo: true,
    repeat: 1,
    onComplete: () => gsap.to(eventLight, { intensity: 0, duration: duration })
  });
}

// CINEMATIC CAMERA
function dramaticZoom(targetFOV, duration) {
  gsap.to(camera, {
    fov: targetFOV,
    duration: duration,
    ease: "power2.inOut",
    onUpdate: () => camera.updateProjectionMatrix()
  });
}
```

---

## Quality Assurance Checklist

Before presenting any game design, verify:

**Visual Standards:**
- [ ] Background has minimum 3 animation layers
- [ ] No static screen state lasts longer than 3 seconds
- [ ] Typography is large enough to read on mobile (minimum 32px equivalent)
- [ ] Color contrast ratio ≥ 7:1 for critical UI elements
- [ ] Particle system has idle, action, and event tiers

**Interaction Standards:**
- [ ] All 3 interaction primitives (comments, gifts, likes) have explicit mappings
- [ ] LEYENDA MODE fully specified for top-tier gifts
- [ ] Variable reward (15% surprise) events are defined
- [ ] Comment triggers include at least 2 emoji options
- [ ] Viewer name appears on screen for all interactions

**Loop Standards:**
- [ ] Core mechanic comprehensible in 3 seconds without instruction
- [ ] Game is visually attractive in idle mode (zero interactions)
- [ ] Escalation timeline covers minimum 20 minutes of play
- [ ] At least 3 special events are specified
- [ ] 1 viral moment is fully designed

**Technical Standards:**
- [ ] Technology stack is specified
- [ ] Deployment method (OBS browser source / standalone) is stated
- [ ] Real-time comment ingestion method is addressed
- [ ] Target frame rate (60fps) is architecturally achievable with chosen stack

---

## Anti-Patterns to Avoid

❌ **Static backgrounds** — Always wrong, always fixable  
❌ **Single interaction primitive** — Must use all three (comments + gifts + likes)  
❌ **Text-only events** — Every event needs a visual spectacle component  
❌ **No viewer name display** — Anonymity kills personal investment  
❌ **Predictable gift rewards** — 100% deterministic rewards create habituation  
❌ **Complex rules** — If you need to explain it, redesign it  
❌ **Generic game concepts** — "A platformer where you jump" is not acceptable  
❌ **Missing LEYENDA MODE** — The top tier must be earned and spectacular  
❌ **No escalation curve** — Flat intensity is invisible to the brain  
❌ **Silence** — Every action must have sound. Always.  

---

## Reference Archetypes

### COMPETITIVE Template
```
Setup:    Lobby splits into Team A vs Team B via comments
Mechanic: Gifts and likes from each team charge faction power bars
Trigger:  When bar fills, faction fires attack on rival base
Win:      Team that destroys rival base first
Loop:     Bases replenish to 50% HP every 3 minutes to prevent early end
```

### COLLECTIVE SURVIVAL Template
```
Setup:    One character (controlled by collective input) vs waves
Mechanic: Comments = move/attack commands, Likes = health regeneration
Trigger:  Wave spawns every 60 seconds + special events at wave 5, 10, 15
Win:      Survive 20 waves (session end celebration)
Fail:     Character dies → 30-second resurrection vote via comments
```

### BATTLE ROYALE LITE Template
```
Setup:    Each viewer appears as a small character on screen
Mechanic: Likes keep individual characters alive (stops = character dies)
Revival:  Dead viewers comment a keyword to respawn with 50% health
Win:      Last viewer standing after 10-minute countdown
Twist:    Every 2 minutes, random viewers get power-ups from gifts
```
