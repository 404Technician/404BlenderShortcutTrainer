# Camera-aligned rotation and Previous Step

The introductory R exercise now captures the camera's viewing direction when the operation starts. A normalized quaternion rotates the object around a parallel axis through its origin. Pointer angles around the projected pivot control clockwise/counterclockwise rotation; angle differences unwrap across ±180°. The first sample, resizing, near-pivot samples and keyboard/pointer handovers re-anchor without a jump. Each preview composes the angle with the immutable starting orientation rather than repeatedly rotating the previous preview.

Legacy Euler orientations convert to quaternions when needed. Explicit R → X/Y/Z composes around the selected world axis, including after a view-aligned rotation. Quaternion state travels with duplicates, undo/redo, progress saves and exercise snapshots. Geometry coordinates and dimensions are unchanged. Blender distinguishes ordinary rotation from R R trackball rotation in its [Rotate documentation](https://docs.blender.org/manual/en/latest/scene_layout/object/editing/transform/rotate.html); its [rotation gizmo documentation](https://docs.blender.org/manual/en/4.5/editors/3dview/display/gizmo.html) describes rotation around the viewing direction.

Previous Step uses persisted exercise-start snapshots containing the scene, component selection, camera and undo/redo stacks. Moving backward cancels active previews, releases captured pointers, clears scheduled feedback/demonstrations and temporary panels, resets hints and keyboard input, restores the previous starting snapshot, and focuses the trainer. Lesson boundaries return to the previous lesson's final exercise. The first course exercise disables the native button; the completed course can reopen its last exercise. Existing button styles provide wrapping layouts, visible focus and disabled feedback without a global shortcut.

Earned per-lesson completion counts are kept separate from the current replay position. Going backward neither revokes lesson unlocks nor awards duplicate credit. Newly entered exercises update their starting snapshots to reflect the user's latest confirmed work. Scene, stacks, starts and earned counts retain the existing `tavi-academy-v1` storage key. Invalid snapshots are discarded individually. Old saves with missing snapshots initialize the previous exercise by replaying its prerequisites through the existing viewport operations.

## Verification

`npm test`: **63 passed, zero failed**, with normal isolated Node test processes. Syntax checks also passed for the changed JavaScript modules.

- Rotation math: oblique, front, top and orbited camera orientations; axis capture before R and a fixed axis during R; clockwise/counterclockwise pointer motion across three viewport sizes and three zoom levels; angle wrapping, repeated samples, event density, pivot/resize re-anchoring and normalized quaternion state.
- Transform behavior: unchanged mesh dimensions and translated pivot, explicit world X/Y/Z rotation after free rotation, cancellation, confirmation, undo/redo and quaternion-preserving duplication.
- App events: R confirmed with Enter and left-click, cancelled with Esc and right-click, then completed normally.
- Previous Step: every exercise replayed from its exact start across the entire course, including Move, Rotate, Scale, Edit Mode, Extrude, Inset, Duplicate, Delete, Undo, Redo, Search and final challenge steps. Tests verify lesson boundaries, progress credit, unlocks, active/incomplete transform cleanup, overlay cleanup, pointer release, keyboard responsiveness, backward-navigation reload and legacy-save initialization.
- Existing full-course, free G, axis/numeric movement, Shift+D sensitivity, four-direction MMB orbit, pan/zoom, search, persistence, geometry and static accessibility regressions all pass.

## Limits

No browser surface was available, so live browser layout, physical keyboard/mouse behavior and assistive-technology checks remain manual. Front/top camera rotation mathematics was tested directly; the existing orbit pitch limits still prevent reaching those exact views through MMB alone. Old saves cannot recover previously unrecorded mouse choices: their compatibility initialization provides a valid representative starting state. This is ordinary view-aligned rotation, not Blender's R R trackball mode or a complete transform editor.

## Files

Changed: `index.html`, `js/app.js`, `js/viewport.js`, `js/geometry.js`, `js/lessons.js`, `js/progress.js`, `README.md`, `tests/app-flow.test.js`, `tests/static-audit.test.js`.

Added: `js/exercise-state.js`, `tests/app-fixture.js`, `tests/rotation.test.js`, `tests/previous-step.test.js`, this report.

The project ZIP was refreshed. Styling, Tavi artwork, the instruction panel structure, renderer, shortcut parser, community links and hosting configuration are preserved.
