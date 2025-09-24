## Current Status
The refactor is progressing well. We've established a module-based architecture with an `Application` class at its core, managing a central `GameState`, `EventBus`, and various game logic managers. Legacy UI scripts are being phased out in favor of this new, more robust system.
# Post-Refactor Cleanup, Maintenance, and Debugging Guide
 
This guide outlines the fastest path to make the refactor stable, remove redundancy, and get “New Game → Race Week → Setup → Start Race” working with the module architecture.
@@ -118,3 +118,5 @@
 - Prefer moving files to match imports (keeps import statements stable) over peppering relative paths.
 - Keep temporary global bridges minimal and documented; schedule their removal once SaveGame and any legacy consumers are updated.
 - Make small commits per step; run the smoke test checklist after each milestone.
+
+## Critical Issue: Component System Initialization
+The component system initialization is failing because `RacerPerformance` is trying to call `getStat` on the stats component before it's properly initialized. This is a timing issue in the component creation process.


