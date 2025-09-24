# Ferret Racing Game - Modular Refactor Guide

## Goal & Architectural Vision

### Current Issues
1. **Script Loading Chaos**: 40+ script tags in index.html creates dependency hell and makes it difficult to understand load order
2. **Racer Monolith**: Racer.js is a 300+ line class handling stats, calculations, betting, history, and more
3. **Tight Coupling**: Many systems directly reference gameState and each other without clear interfaces
4. **File Organization**: Related functionality is scattered across multiple files without clear groupings

### Target Architecture
We want to move toward a **modular, component-based system** with:
- **ES6 Modules**: Replace script tags with proper import/export
- **Component Composition**: Break Racer into focused, composable components
- **Clear Separation of Concerns**: Each module has a single responsibility
- **Dependency Injection**: Reduce tight coupling through interfaces
- **Organized File Structure**: Group related functionality into logical directories

## Implementation Roadmap

### Phase 1: Module System Foundation
**Goal**: Replace script tag loading with ES6 modules

#### Step 1.1: Create Module Entry Point
- Create `src/main.js` as the primary entry point
- Create `src/utils/moduleLoader.js` for dynamic imports
- Add module system detection and fallback for older browsers

#### Step 1.2: Convert Core Systems
- Convert `gameState.js` → `src/core/GameState.js` (ES6 module)
- Convert helper functions → `src/utils/` directory with focused modules
- Create `src/core/EventBus.js` for decoupled communication

#### Step 1.3: Update index.html
- Replace all script tags with single `<script type="module" src="src/main.js"></script>`
- Add fallback `<script nomodule>` for legacy browsers
- Keep only critical CSS and remove JS-dependent styling

### Phase 2: Racer System Decomposition
**Goal**: Break Racer.js into focused, composable components

#### Step 2.1: Extract Racer Properties
Create specialized property managers:
- `src/entities/racer/RacerStats.js` - Base stats generation and compensation
- `src/entities/racer/RacerPerformance.js` - Speed calculation, endurance, boost logic
- `src/entities/racer/RacerHistory.js` - Race history tracking and analysis
- `src/entities/racer/RacerBetting.js` - Odds calculation and payout logic

#### Step 2.2: Create Racer Component System
- `src/entities/racer/RacerComponents.js` - Component registration system
- `src/entities/racer/Racer.js` - Lightweight entity that composes components
- Each component implements standard interface (`update()`, `reset()`, `serialize()`)

#### Step 2.3: Add New Racer Features
With modular system in place, easily add:
- `RacerPersonality.js` - Behavioral traits affecting race strategy
- `RacerInjuries.js` - Temporary stat modifications from race incidents
- `RacerTraining.js` - Long-term stat improvements between races
- `RacerRelationships.js` - Rivalries and friendships affecting performance

### Phase 3: Render System Organization
**Goal**: Organize rendering code into coherent module structure

#### Step 3.1: Consolidate Render Architecture
- `src/render/RenderManager.js` - Central rendering coordinator
- `src/render/renderers/` - Move all renderer classes here
- `src/render/systems/` - Animation, particle, and camera systems
- `src/render/core/` - Base classes and utilities

#### Step 3.2: Create Render Pipeline
- Implement standardized render pipeline with phases
- Add render state management for pausing/resuming
- Create render debugging tools

### Phase 4: UI and Game Logic Separation
**Goal**: Clean separation between game logic and presentation

#### Step 4.1: Create UI Module System ✅ COMPLETED
- `src/ui/UIManager.js` - Central UI coordinator
- `src/ui/components/` - Reusable UI components
- `src/ui/screens/` - Full screen UI states
- `src/ui/events/` - UI event handling

#### Step 4.2: Game Logic Modules ✅ COMPLETED
- `src/game/RaceManager.js` - Core race management logic
- `src/game/betting/BettingManager.js` - Betting system logic
- `src/game/progression/ProgressionManager.js` - Week/season progression
- Clear separation between game logic and UI presentation

### Phase 5: Data and Configuration
**Goal**: Externalize configuration and improve data management

#### Phase 5.1: Configuration System
- `src/config/` - All game configuration files
- `src/config/gameSettings.js` - Default settings with validation
- `src/config/racerProperties.js` - Racer generation parameters
- Support for user settings overrides

#### Phase 5.2: Data Management
- `src/data/` - Game data persistence and loading
- `src/data/SaveGame.js` - Save/load functionality
- `src/data/WordListManager.js` - Handle name generation data

## Refactor Progress
- **Phases 1-3**: ✅ COMPLETED - Module system, Racer components, Render architecture
- **Phase 4**: ✅ COMPLETED - UI module system and Game logic modules
- **Phase 5**: 🔄 IN PROGRESS - Configuration and data management

## Mid-Refactor Maintenance – ✅ COMPLETED

### ✅ Completed
1. **Split render/RenderManager.js into modules**: Completed successfully
   - `RenderPipeline` - Manages render pipeline phases
   - `SceneRenderer` - Handles main scene rendering
   - `OverlayRenderer` - Manages UI overlays and lane banners
   - `InteractionController` - Handles mouse interactions and hover effects
   - `CanvasAdapter` - Manages canvas operations and device pixel ratio

### ✅ Completed
2. **Remove redundant files**: Completed successfully
   - `Racer.js` (legacy monolith) - Deleted
   - `ParticleSystem.js` duplicates - Removed, keeping `render/systems/ParticleSystem.js`
   - `Camera.js` and `WorldTransform.js` duplicates - Removed, keeping `render/core/` versions
   - `HitTestIndex.js` duplicate - Removed, keeping `render/core/HitTestIndex.js`

### ✅ Completed
3. **Fix UI initialization**: Completed successfully
   - Updated `src/main.js` to properly initialize UI components
   - Fixed DOM initialization to show game interface after module loading
   - Ensured SettingsPanel, Tabs, and EventHandlers are properly initialized

### 🔧 Implementation Guidelines

#### Module Standards
- **Single Responsibility**: Each module has one clear purpose
- **Explicit Dependencies**: Use imports/exports, avoid global references
- **Interface Contracts**: Define clear APIs between modules
- **Error Handling**: Each module handles its own errors gracefully

#### Component Pattern for Racers
```javascript
// Example component interface
class RacerComponent {
  constructor(racer, config) { /* ... */ }
  update(deltaTime, context) { /* ... */ }
  reset() { /* ... */ }
  serialize() { /* ... */ }
  static getRequiredComponents() { return []; }
}
```