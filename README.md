# Tavi's Blender Shortcut Trainer

A standalone, browser-only course for the LiandiDesign 3D Print Design Lab community. Five guided lessons and a final model challenge teach shortcuts with a physical keyboard and mouse. No framework, CDN, account, API, backend, or tracking is used. **Nothing has been published.**

## Run locally in Visual Studio Code

Open this folder in VS Code, then open Terminal → New Terminal:

```powershell
python -m http.server 8000
```

Visit http://localhost:8000. Alternatively, use the VS Code Live Server extension. Serve through HTTP rather than opening index.html directly: JavaScript modules need a web server. Python 3 is needed only for this local server, not for hosting. Stop it with Ctrl+C.

## Use the course

Look directly beneath Tavi for the lavender **YOUR NEXT STEP** panel. The large action line tells you what to do; keycaps distinguish combinations such as Shift + D from sequences such as G → Z. The first exercise explains that Tavi provides the instructions. A single 400 ms background highlight marks each new exercise, with no animation when reduced motion is enabled. Final-challenge keys remain hidden until you request the clearer hint.

The first Rotate exercise captures the current camera viewing direction when R starts, then rotates around that axis through the object origin. Move your pointer around the projected pivot to rotate clockwise or counterclockwise; the first sample anchors the interaction without a jump. The axis stays fixed during the operation. Normalized quaternion previews preserve the original mesh and avoid accumulated Euler rotations. Explicit R → X/Y/Z uses the corresponding world axis.

**Previous Step** beside the hint controls restores the preceding exercise's starting scene, object/component selection and undo/redo history. It also cancels active transforms and drags, closes temporary panels, resets the keyboard sequence and hints, and focuses the viewport. From a lesson's first exercise it returns to the preceding lesson's final exercise; it is disabled at the beginning of the course. At course completion it reopens the final exercise. Completed lessons remain unlocked and earned progress does not decrease or count twice during replay. Starting snapshots are persisted under the existing storage key. Older saves without snapshots use deterministic prerequisite replay; those initial conditions are valid examples rather than an exact reconstruction of unknown earlier mouse movements.

Choose Start practice to focus the viewport. Shortcut interception occurs only in that region; typing in search fields and navigating the rest of the page retains normal browser behavior. G/R/S, E/I and Shift+D start a modal operation. Move the pointer inside the viewport, then confirm with Enter or left-click; cancel with Esc or right-click. Space provides a trainer-only alternative for selecting the cube or top face. Arrow keys provide a clearly labeled **trainer-only** adjustment alternative; these are not taught as Blender transform shortcuts. Axis commands use successive key presses, not simultaneous chords. The precise example is G → Z → 2 → Enter. Uppercase/lowercase letters work; Ctrl shortcuts also accept Command on macOS where the browser permits it.

Tab toggles Edit Mode only during its mode exercise; otherwise it performs ordinary focus navigation. **Escape while no operation is active moves focus to Exit training. Shift+Tab also leaves the viewport.** Exit training pauses shortcut interception. When focus leaves during a transform, its preview resets safely.

The first lesson detects real middle mouse drags, Shift+middle mouse drags and wheel zoom. Orbit direction follows Blender's upright turntable interaction: the visible near side follows horizontal and vertical dragging. In this viewport's camera basis, rightward dragging decreases yaw; downward dragging increases pitch. The direction check used Blender's [interactive orbit implementation](https://github.com/blender/blender/blob/main/source/blender/editors/space_view3d/view3d_navigate_view_rotate.cc) and [navigation preferences](https://docs.blender.org/manual/en/latest/editors/preferences/navigation.html). Existing sensitivity, origin target, pitch limits, pan and wheel zoom are retained. A labeled demonstration-and-continue alternative is available without MMB. Mobile users can read all instructions and use the deck demonstrations; touch gestures are not taught as Blender controls. The deck is available from the beginning.

Progress, per-exercise starting snapshots, earned completion counts, committed viewport state and undo/redo history are stored under `tavi-academy-v1` in localStorage. Completed exercises are saved immediately, before the success-message delay; reload during an unfinished operation returns to its last committed state. Valid existing progress keeps the original storage key. Invalid scenes, unreachable lessons, and malformed histories are safely recovered; undo history is capped at 100 snapshots. Restart lesson resets that lesson's scene; Restart course clears course progress. Completed lessons can be replayed. If storage is blocked, the page continues in memory and reports the limitation. There is no network synchronization.

## Architecture and files

- `index.html`: semantic course shell, instructor, viewport, completion and deck.
- `css/styles.css`: responsive lavender/purple visual system, focus states and reduced-motion styling.
- `js/lessons.js`: structured lesson/exercise content and searchable context-aware deck.
- `js/input-engine.js`: case normalization, exact modifier combinations, ordered sequences and 15-second incomplete-sequence timeout.
- `js/app.js`: lesson progression, focus-scoped events, feedback, hints, navigation and demonstrations.
- `js/viewport.js`: Canvas presentation, camera-axis gizmo, transform previews, depth-aware picking and undo/redo snapshots.
- `js/geometry.js`: indexed quad mesh, normals, topology operations, object transforms and perspective camera math.
- `js/renderer.js`: dependency-free software depth buffer, gray studio shading, grid and occluded selection overlays.
- `js/progress.js`: guarded local persistence, snapshot validation, earned progress and restart.
- `js/exercise-state.js`: exercise-start capture/restore and deterministic compatibility initialization.
- `assets/tavi/`: nine optimized WebP crops from the supplied `TAVI_MASTER_REFERENCE.png`.
- `tests/`: Node test runner tests for input, persistence, lessons and full app event flow.
- `.nojekyll`: GitHub Pages static-file marker.

The master sheet was cropped by its 3×3 cells with a small inset to remove white gutters, then resized to at most 440×440 and encoded as WebP. Character proportions, clothing, logo and facial features are unchanged. The original lavender/pink backgrounds are intentionally retained, not represented as transparent cutouts. Welcome, teaching, thinking, sitting and celebrating poses react to learning state. Additional poses remain available for future dialogue.

## Shortcut accuracy and sources

Uses the **Blender Default keymap**, default left-click selection and a mesh in the 3D Viewport. Number-row 1/2/3 select vertices/edges/faces only in Mesh Edit Mode; numpad keys are not interchangeable. E teaches Extrude Region on a selected top face; I teaches Inset Faces in that context. Search results depend on the active editor in real Blender. Blender preferences and custom keymaps can change these behaviors.

Official manual pages consulted on October 10, 2026 (the latest manual is a moving target; indexed pages reported 5.2/5.3, so no specific installed-version claim is made):

- [Default keymap](https://docs.blender.org/manual/en/latest/interface/keymap/blender_default.html) — direct retrieval failed; the official indexed [5.0 page](https://docs.blender.org/manual/en/5.0/interface/keymap/blender_default.html) and [5.1 page](https://docs.blender.org/manual/id/5.1/interface/keymap/blender_default.html) supported the keymap check.
- [Viewport navigation](https://docs.blender.org/manual/en/latest/editors/3dview/navigate/navigation.html)
- [Basic mesh transforms](https://docs.blender.org/manual/en/latest/modeling/meshes/editing/mesh/transform/basic.html)
- [Rotate](https://docs.blender.org/manual/en/latest/scene_layout/object/editing/transform/rotate.html)
- [Duplicate objects](https://docs.blender.org/manual/en/latest/scene_layout/object/editing/duplicate.html)
- [Duplicate mesh elements](https://docs.blender.org/manual/en/latest/modeling/meshes/editing/mesh/duplicate.html)
- [Extrude Region](https://docs.blender.org/manual/en/latest/modeling/meshes/tools/extrude_region.html)
- [Inset Faces](https://docs.blender.org/manual/en/latest/modeling/meshes/editing/face/inset_faces.html)

Required course: MMB drag, Shift+MMB drag, Wheel; G/R/S; Enter/LMB and Esc/RMB; G→X/Y/Z, S→X, R→Z, G→Z→2→Enter; Tab, 1/2/3, selected-face E and I; A, Alt+A, LMB, Shift+D, X→Enter, Ctrl+Z, Ctrl+Shift+Z, Ctrl+S, F3. Deck also includes Home, Numpad period, Ctrl+I, H/Alt+H and N/T.

## Deliberate simulation limits

- This is a purpose-built learning scene, not a geometry editor, Blender clone or source of printable/exportable files. Move and Duplicate use the same absolute displacement from an immutable starting snapshot. Pointer displacement is projected onto the rendered axis and normalized by camera zoom and viewport size. First samples, resizing, axis changes and switching from keyboard adjustment re-anchor the pointer to avoid jumps. Transform previews are independent of pointer-event density and use no animation loop; the first Move exercise uses camera-aware ray intersections with the world XY plane and keeps Z unchanged. This is an introductory simplification: real Blender uses the current view plane for unconstrained G. Other unconstrained trainer moves retain their prior X default, and unconstrained Rotate deck demonstrations retain their prior Z default. The introductory Rotate exercise uses the captured view axis. Axis-constrained moves change scene coordinates; numeric Z=2 adds exactly two simulated units.
- The default cube is a closed 2 × 2 × 2 indexed mesh centered at the origin, with eight vertices, twelve edges, six outward-facing square faces and no bevels. Extrude replaces the selected cap with a connected side loop and new cap; Inset creates a connected rim and smaller cap. Mesh edits persist and travel with duplicates. Existing saved scenes without mesh data are upgraded when displayed. Only the designated top cap is selectable for modeling missions; extrusion is positive along its local normal and inset uses a bounded proportional amount. Arbitrary mesh editing, alternative pivots/orientations, snapping, unit settings and export are outside the course.
- Surfaces, selection overlays and picking use reciprocal camera depth. The camera gizmo and grid follow the same camera basis. Neutral flat studio shading approximates Blender Solid mode; lighting, theme colors and camera framing are not pixel-exact. Zoom changes focal magnification, and orbit retains the existing bounded pitch. Rendering is event-driven, with a maximum pixel ratio of two and no continuous animation loop.
- Cancelling a simple transform restores its prior state. **Real Blender Duplicate and Extrude create geometry before the movement: cancelling the movement leaves the copy/coincident extrusion in place. This trainer resets that whole preview and explicitly explains the difference; use Undo in Blender to remove the created geometry.** The course cancellation drill uses ordinary Move to avoid teaching the special cases as generic behavior.
- X teaches Object Mode confirmation; Edit Mode deletion uses a context-specific menu in Blender. The course switches back to Object Mode first.
- Save records a visible practice marker only; it never triggers a download or saves a .blend file. F3 opens a simulated filtered command list, not executable Blender operators.
- Deck examples are temporary demonstrations and restore the learner's scene. Bonus panel toggles and hide/reveal are references with simplified visuals.
- Browser/OS reserved shortcuts (especially F3, Ctrl+S and some macOS combinations), Fn-key behavior, trackpad gestures and MMB autoscroll can vary. Interception is attempted only on the focused viewport. If a shortcut is reserved, use its deck demonstration and practice it directly in Blender. For MMB-free course progression use the explicit alternative.

## Test

With Node.js 20 or newer:

```powershell
npm test
```

No `npm install` is required. Also check syntax:

```powershell
node --check js/app.js
node --check js/viewport.js
```

If a sandbox blocks child-process spawning and Node.js 22 or newer is available, run `node --test --test-isolation=none tests/*.test.js`. This was the successful test command in the development environment: all 63 tests passed, including the complete six-stage event flow, real-shaped pointer/keyboard events in the test double, duplicate regression cases across three viewport sizes and three zoom levels, cancellation, confirmation, undo, numeric input, immediate-checkpoint reload and final-challenge replay. `npm test` also passed using normal isolated test processes. Rotation/navigation tests cover camera-relative quaternion rotation, angular interaction, explicit world axes, every previous exercise, active-operation cleanup, legacy initialization and backward-navigation reloads. Geometry tests cover exact dimensions, outward normals, connected closed extrusion/inset, origin pivots, reciprocal perspective, depth-aware picking, occluded overlays, legacy scene upgrades and malformed mesh rejection. See [ROTATION_NAVIGATION_REPORT.md](./ROTATION_NAVIGATION_REPORT.md), [CUBE_ACCURACY_REPORT.md](./CUBE_ACCURACY_REPORT.md) and the [render review](./review/cube-accuracy.png).

Manual browser checklist: complete the course with real MMB and keyboard; try wrong modifiers and early confirmation; cancel transforms; leave focus and verify Ctrl+S no longer intercepts; reload mid-lesson; replay/restart; filter the deck; inspect at 390px and 1280px widths; enable OS reduced motion; verify Tab exit, live feedback, Tavi cropping, and console/asset requests. Programmatic tests use a DOM/Canvas test double, not a browser rendering engine. This execution environment exposed no browser surface, so real-browser layout, console and OS-level shortcut behavior remain unverified.

## Commit and publish with GitHub Pages

Create an empty GitHub repository first. From this project folder, replace YOUR-USER and YOUR-REPOSITORY:

```powershell
git init
git add .
git commit -m "Build Tavi Blender Shortcut Trainer"
git branch -M main
git remote add origin https://github.com/YOUR-USER/YOUR-REPOSITORY.git
git push -u origin main
```

If the project is already inside a larger repository, use that repository instead of initializing another one. Put these project contents at that repository's root, or in `docs/` and select that folder when configuring Pages.

On GitHub open Settings → Pages → Build and deployment. Select **Deploy from a branch**, `main`, and `/ (root)` (or `/docs` if you used that folder), then Save. Wait for the Pages workflow to succeed. GitHub shows the public address, usually `https://YOUR-USER.github.io/YOUR-REPOSITORY/`. Visit it and complete the browser checklist before sharing that URL in Skool. All imports, stylesheet and mascot URLs are relative, so repository subpaths work. No environment variables or paid hosting are needed.

Publishing is a user-controlled follow-up; this project has not been pushed or deployed. The completion CTA uses the provided community URL and opens with `noopener noreferrer`.

## Useful next improvements

Run browser and assistive-technology QA on target devices; add freely selectable mesh faces and more general geometry operations; optionally expose clearly labeled fallback buttons for browser-reserved function keys. Keep these separate from the core beginner course. See [AUDIT_REPORT.md](./AUDIT_REPORT.md) for the stabilization findings, file changes and verification limits.
