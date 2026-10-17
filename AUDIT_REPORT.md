# Blender Shortcut Trainer stabilization report

Reviewed October 10, 2026. This was an improvement of the existing static application, not a rebuild. The six-stage course, palette, Tavi artwork, community link, relative paths and GitHub Pages setup are retained. No backend, dependencies, publishing or external writes were added.

## Duplicate movement: reproduced and corrected

The pointer handler supplied **absolute displacement from the initial pointer position**. Normal Move rebuilt its preview from the starting scene. Duplicate instead copied the **current, already displaced duplicate**, rebuilt the rest of the scene, then added the absolute displacement again. Every pointer event therefore compounded the previous preview's movement. Event frequency affected the result even when the pointer ended in the same place. There was no delta-time calculation, animation loop or second pointer listener involved.

Before the fix, feeding preview displacements `0, 0.1, 0.2, 0.3, 0.3` produced:

| Operation | Expected X | Actual X before fix |
| --- | --- | --- |
| Move | 0.3 | 0.3 |
| Duplicate | 0.3 | 0.9 |

The regression test was executed against the original implementation and failed specifically on Duplicate. It now passes. Each duplicate preview starts from an immutable copy of the original source object. The copy remains selected and active; the source is deselected and does not move. Both Move and Duplicate share the same adjustment and screen-to-scene projection. No arbitrary duplication slowdown was introduced.

The projection uses viewport dimensions, rendered axis direction, object position and camera zoom. Its first pointer sample establishes an anchor without moving the object. Resize, axis changes and keyboard/pointer handovers re-anchor the interaction. Identical repeated samples and different event densities end at the same position. Camera orbit/zoom is paused during modal transforms so camera changes cannot conflict with the starting snapshot.

Enter and left-click confirm placement; Esc and right-click restore the complete original scene in this trainer. Cancellation creates no undo entry. A confirmed duplicate is one undoable operation; Redo restores it.

## Other changes

- Renamed the browser title, visible main heading, wordmark, welcome copy, metadata, accessibility labels, package display name and documentation to **Tavi's Blender Shortcut Trainer**. Folder/archive names and the localStorage key remain unchanged to preserve paths and saved progress.
- Saved completed actions before the 750 ms feedback delay. A reload during that delay now resumes at the next exercise with the committed scene. Pending transitions settle before deck demonstrations or lesson navigation.
- Validated saved lesson positions, contiguous completion records, scene objects, camera fields and history snapshots. Damaged JSON is distinguished from unavailable storage; valid completed lessons are retained when a damaged scene forces a lesson restart.
- Corrected final-challenge replay after completing the course and restored an appropriate celebration state on finished-session reload.
- Added explicit pointer-capture release on drag completion, focus loss, cancellation and restart. Lost capture clears the navigation state. Pointer events over viewport controls do not adjust transforms.
- Blocked navigation during a transform and wheel zoom during success/deck feedback. Right-click also cancels the Delete confirmation.
- Reset incomplete commands and dismiss stale Delete confirmation on timeout. Already matched modal commands no longer time out while the learner adjusts them. Wrong keys during an active sequence explain the next expected key rather than encouraging an impossible restart without cancellation.
- Improved transform/cancellation hints and varied confirmed-action feedback. Success still requires the meaningful exercise action and its confirmation.
- Kept ordinary Tab navigation outside mode exercises, Shift+Tab navigation everywhere, and Escape exit during feedback/completion. Practice descriptions include the current mission; simulated search/delete panels have named, nonmodal dialog semantics.
- Added minimum widths/overflow guards for narrow layouts, wrapped long deck keycaps and viewport text, constrained dialog height with scrolling, and enlarged compact control hit areas. These CSS safeguards were checked in source; their rendered appearance still needs browser verification.
- Bounded undo history to 100 snapshots to avoid unbounded memory and localStorage growth during repeated practice.

## Blender accuracy review

Checked official manual search-index content after direct latest-page retrieval failed in this environment. The indexed pages report different manual versions; no claim is made about the user's installed Blender version. Sources and version limitations remain documented in the README.

- [Default keymap](https://docs.blender.org/manual/en/5.0/interface/keymap/blender_default.html): selection combinations, Tab, mesh number-row selection modes, Save, Undo/Redo and F3.
- [Object duplication](https://docs.blender.org/manual/en/latest/scene_layout/object/editing/duplicate.html): Shift+D creates a copy and starts movement.
- [Mesh duplication](https://docs.blender.org/manual/en/latest/modeling/meshes/editing/mesh/duplicate.html): Enter/LMB confirmation and the special cancellation behavior.
- [Basic mesh transforms](https://docs.blender.org/manual/en/latest/modeling/meshes/editing/mesh/transform/basic.html): G/R/S in Edit Mode.
- [Extrude Region](https://docs.blender.org/manual/en/5.3/modeling/meshes/tools/extrude_region.html): E and context-dependent connected geometry.
- [Inset Faces](https://docs.blender.org/manual/en/5.2/modeling/meshes/editing/face/inset_faces.html): selected-face I, adjustment, confirm/cancel.
- [Navigation](https://docs.blender.org/manual/en/3.2/editors/3dview/navigate/navigation.html) and the indexed official [5.1 keymap](https://docs.blender.org/manual/id/5.1/interface/keymap/blender_default.html): MMB orbit, Shift+MMB pan and wheel zoom.

The simulator intentionally removes the whole duplicate/extrusion preview on cancellation, as requested. **In Blender, cancelling the movement after Duplicate or Extrude can leave the newly created copy/geometry; Undo removes it.** The trainer's cancellation feedback and README explain this difference. The generic cancellation drill uses Move. Other retained simplifications include selected-top-face-only modeling, an unrestrained Move represented along X, default Rotate around Z, simplified inset/extrusion geometry and practice-only Save/Search. Arrow adjustment and Space selection remain explicitly labeled trainer alternatives, not Blender shortcuts.

## Tests executed

Final commands:

```powershell
npm test
node --test --test-isolation=none tests/*.test.js
node --check js/app.js
node --check js/input-engine.js
node --check js/lessons.js
node --check js/progress.js
node --check js/viewport.js
```

**28 tests passed.** The ordinary isolated Node test runner and the single-process sandbox alternative were both executed. Coverage includes:

- Full five-lesson course and final challenge using a DOM/Canvas event double: MMB and Shift+MMB drag, wheel, G/R/S, G→X/Y/Z, numeric Z, Tab, 1/2/3, top-face picking, E/I, selection, Shift+D, X confirmation, Undo/Redo, Save and Search.
- Wrong commands, incomplete-axis confirmation rejection, adjustment-before-confirmation, Enter/LMB confirmation, Esc/RMB duplicate cancellation, Delete cancellation, progressive final hints, keyboard exit and ordinary Tab navigation.
- Exact numeric scene coordinates, duplicate selection/active-object state, original-object preservation, scene restoration on cancel, Undo/Redo after a confirmed duplicate and bounded history.
- Identical Move/Duplicate pointer displacements at 320×300, 768×345 and 1280×500, camera zoom 0.4/1/2.1 and X/Y/Z constraints; 1/8/60 event samples; repeated stationary samples; first-sample/resize/axis/input-method re-anchoring; invalid samples.
- Immediate persistence before feedback timers, fresh application initialization from a saved checkpoint, safe malformed-data recovery, unavailable storage, lesson restart, course restart and completed-final replay.
- Relative asset/import paths, application-name consistency, primary text/button contrast of at least 4.5:1, and the presence of focus, mobile breakpoints and reduced-motion safeguards.

All nine WebP assets decoded successfully. A contact sheet was visually inspected: supplied pose framing, original backgrounds, clothing and logo were preserved. No mascot source or derived asset was changed during this audit.

## Verification limits and prioritized follow-up

1. **Highest priority: real browser release check.** The computer-use inventory exposed no browser or app surfaces. No real browser manual walkthrough, screenshot comparison, console inspection, assistive-technology session or OS-reserved-key test was possible. Test-double event dispatch is not a substitute for actual browser pointer/keyboard behavior. Check desktop, laptop, tablet and mobile layouts, actual MMB input, different keyboard layouts, F3/Ctrl+S and screen-reader navigation before broad community sharing.
2. **Browser-reserved-key recovery.** The deck provides demonstrations when a system reserves a shortcut; some environments may still prevent completing the corresponding physical-key exercise. A clearly labeled course fallback for those commands would improve compatibility.
3. **Optional simulation fidelity.** General mesh selection, fully free movement, general camera framing and full topology/export are outside this beginner trainer. Keep those improvements separate from the stabilized course.

## Files

Modified:

- `index.html`
- `css/styles.css`
- `js/app.js`
- `js/input-engine.js`
- `js/lessons.js`
- `js/progress.js`
- `js/viewport.js`
- `tests/app-flow.test.js`
- `tests/input-engine.test.js`
- `tests/viewport.test.js`
- `package.json`
- `README.md`

Created: `tests/static-audit.test.js` and this `AUDIT_REPORT.md`.

The existing `tavi-blender-academy.zip` delivery archive was refreshed with the updated project. No lessons, mascot assets, community integration, unrelated projects or hosting configuration were removed or published.
