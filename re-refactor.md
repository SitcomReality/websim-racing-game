# Refactoring and Modernization Guide

## 1. Project Goal

The primary goal of this refactor is to complete the transition from a legacy, globally-scoped codebase to a modern, modular, event-driven architecture. This will improve code organization, reduce dependencies on global state, and make the game easier to debug, maintain, and extend.

The core principle is to centralize logic within dedicated managers (`RaceManager`, `ProgressionManager`, `BettingManager`, `UIManager`) and components, communicating via an `EventBus`. All legacy global functions and state objects will be progressively migrated into this new structure and then removed.

---

## 2. Refactoring Steps

### Step 1: Centralize Game State

**Goal:** Establish the `GameState` class as the single source of truth, removing the legacy global `gameState` object and explicit `window.gameState` assignments.

*   **Modify `src/main.js`**:
    *   Remove the `window.gameState = this.gameState;` assignment.
    *   Explicitly pass the `gameStateManager` instance to managers and UI components that require state access.

*   **Modify `src/core/GameState.js`**:
    *   Integrate the structure from the legacy `gameState.js` to ensure it holds all necessary state properties, including `raceWeek`.
    *   Add methods like `getCurrentRace()` and `advanceToNextRaceIndex()` to manage race state transitions.

*   **Delete `gameState.js`**:
    *   Remove the legacy global state definition file.

*   **Update All Files Using `gameState`**:
    *   Search the entire project for `gameState` and `window.gameState`.
    *   Update each file to receive the `GameState` instance via its constructor or a method call, and access state via `this.gameState.state` or getter methods.
    *   Key files to update include: `init.js`, `setupTrack.js`, `createNewRaceWeek.js`, `arrangeRacersByPerformance.js`, `render/core/Camera.js`, and all legacy game loop files.

---

### Step 2: Integrate Race Logic into `RaceManager`

**Goal:** Move all race setup, execution, and conclusion logic from global scripts into the `RaceManager`.

*   **Modify `src/game/RaceManager.js`**:
    *   Implement a `setupRace(raceData)` method that incorporates the logic from `setupTrack.js`. This method should prepare the `currentRace` object in the game state.
    *   Implement a `startRace()` method that contains the game loop logic from `beginRace.js`.
    *   Implement an `endRace()` method that contains the logic from `processRaceFinish.js` and `advanceToNextRace.js`, including settling bets via the `EventBus` and updating the race index.

*   **Modify `ui/eventHandlers.js`**:
    *   Change the event handlers for "Setup Race", "Start Race", and "End Race" buttons to emit events on the `eventBus` (e.g., `race:setup`, `race:start`) instead of calling global functions.

*   **Delete Legacy Race Files**:
    *   `setupRace.js`
    *   `setupTrack.js`
    *   `beginRace.js`
    *   `processRacerFinish.js`
    *   `processRaceFinish.js`
    *   `advanceToNextRace.js`

---

### Step 3: Integrate Race Week Logic into `ProgressionManager`

**Goal:** Move all logic related to creating and managing a race week into the `ProgressionManager`.

*   **Modify `src/game/progression/ProgressionManager.js`**:
    *   Enhance the `startNewRaceWeek()` method to fully generate the `raceWeek` object, including selecting racers and tracks, and creating `Race` instances.
    *   Ensure it populates `gameState.raceWeek` with the complete data structure.

*   **Modify `ui/eventHandlers.js`**:
    *   Update the "Start Race Week" button handler to emit a `race:startWeek` event, which will be handled by the `Application` class to trigger `ProgressionManager`.

*   **Modify `ui/components/BettingComponent.js` (or a new RaceWeek component)**:
    *   Create a method to render the race week UI based on the data in `gameState.raceWeek`. This will replace the logic in `createNewRaceWeek.js`. This component will listen for a `progression:weekStarted` event to trigger its rendering.

*   **Delete `createNewRaceWeek.js`**:
    *   Remove the legacy UI generation script.

---

### Step 4: Refactor UI and DOM Manipulation

**Goal:** Modernize UI management by replacing legacy static handlers and DOM utilities with component-based, event-driven updates.

*   **Modify `index.html`**:
    *   Remove all UI elements related to the game screen (header, HUD, panels). Leave a single root container like `<div id="app"></div>`.
    *   The `Application` class will be responsible for mounting the `GameScreen`.

*   **Modify `ui/screens/GameScreen.js`**:
    *   Ensure this class contains all the necessary HTML for the main game interface.
    *   Instantiate and manage child components like `HUDComponent` and `BettingComponent` within its structure.

*   **Modify `ui/UIManager.js`**:
    *   Add logic to mount/unmount screens into the main app container.

*   **Refactor `domUtils.js`**:
    *   Migrate the `createRacerGuiElement` logic into a new, dedicated `RacerCardComponent`.
    *   The remaining utility functions should be moved into the components that use them.

*   **Delete `domUtils.js` and `ui/eventHandlers.js`**:
    *   With logic moved into components and the `UIManager`, these legacy files will become obsolete.

---

### Step 5: Consolidate Utility Functions and Data Models

**Goal:** Eliminate redundant helper functions and formalize data models using classes.

*   **Consolidate Helpers**:
    *   Compare `helper_functions.js` and `src/utils/helpers.js`.
    *   Merge any unique and necessary functions from the legacy file into the new module.
    *   Update all files to import helpers from `src/utils/helpers.js`.
    *   **Delete `helper_functions.js`**.

*   **Formalize Data Models**:
    *   Ensure `Race.js`, `RaceWeek.js`, and `Track.js` are classes with clear constructors and methods.
    *   Move these files into a `src/models/` directory.
    *   Update `ProgressionManager` and `RaceManager` to import and instantiate these models instead of creating plain objects.

---

### Step 6: Final Cleanup and Verification

**Goal:** Remove all remaining legacy files and global dependencies, ensuring the application runs entirely within the new modular structure.

*   **Review and Delete**:
    *   `scripts.js` (logic should be in managers/components).
    *   `loadXmlWordlists.js` (logic is now in `src/main.js` or `WordListManager`).
    *   Any other remaining root-level JS files containing game logic.

*   **Final Code Scan**:
    *   Perform a project-wide search for any remaining uses of `window.`, global functions, or legacy patterns.
    *   Refactor these last remnants to conform to the modular architecture.

*   **Smoke Test**:
    *   Thoroughly test the main game flow: New Game -> Start Race Week -> Setup Race -> Start Race -> Race Finish -> Advance to Next Race.
    *   Verify that all UI elements update correctly based on events and state changes.


