# Lesson transform and initialization regression report

## Root cause
The viewport defaulted unconstrained movement/duplication to world X and rotation to world Z. Only introductory lessons opted into free XY movement or view-aligned rotation. This made the same Blender command behave differently according to lesson metadata. Axis expectations were not directly applied early: the fallback defaults made R appear Z-constrained before Z was entered.

Selection starts had a separate prerequisite problem: lesson resets select the cube, and mesh selection mode persists when returning to Object Mode. The A exercise therefore started completed visually, while the final face-selection exercise could inherit face mode.

## Changes
- Default G and Shift+D use the camera-aligned plane at the source object's depth. Pointer displacement is absolute from the anchored start, so repeated samples do not accumulate movement. Explicit X/Y/Z constraints still apply only after the axis token.
- Default R uses the captured viewing direction; Z switches to a world-Z quaternion composed from the original transform snapshot.
- Explicit exercise prerequisites ensure face-selection missions begin in edge mode and the A mission begins deselected. Apply before saving next-step snapshots, on reload/replay/restart, and during legacy prerequisite reconstruction.
- Cancellation continues to restore the complete modal snapshot without adding history; confirmation is still required for both duplicates. Existing trainer-specific duplicate cancellation semantics are unchanged.
- UI, Tavi assets, lesson order, storage key, static hosting and relative asset paths are preserved. Introductory G wording now describes the view plane.

## Actual validation
- Original suite: 63/63 passed before edits.
- New regression tests against original production sources: 4 failed, 1 passed (the existing cancellation guard).
- Final suite: 68/68 passed on Node 24.19.0.
- Includes full course flow, selection starts/reload/replay/restart, camera-plane projection at multiple angles, R then Z composition, both Shift+D lesson event flows, single-copy selection/history, modal cancellation, undo/redo, numeric axes, rendering geometry and repository-subpath asset resolution.
- git diff --check passed.
- Added GitHub Actions regression workflow. Remote workflow result must be checked separately.
- Application tests use event/Canvas doubles; no interactive browser or real Blender validation was performed. GitHub Pages was not deployed by this change.
