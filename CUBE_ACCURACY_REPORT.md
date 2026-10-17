# Cube accuracy review

## Original inaccuracies

The previous Canvas viewport generated eight points spanning ±0.8 on X/Y and 0–1.6 on Z. It drew five faces, omitted the bottom, rotated around the lower face, approximated perspective with a linear depth multiplier, and painted the top last. Hidden edges and vertices could show through other surfaces. Inset painted an inner quadrilateral; extrusion stretched the box and painted a ring.

## Changes

The viewport retains Canvas and static, dependency-free hosting. It now renders actual indexed 3D mesh coordinates and outward-wound quad faces. The default cube spans −1 to +1 on every axis: 2 × 2 × 2, centered at the origin, eight vertices, twelve edges and six square faces with sharp corners. Object translation, XYZ rotation and scale are separate from mesh coordinates, so rotation and scaling use the object origin.

Extrude replaces the selected cap with four connected side faces and a new cap. Inset replaces it with four connected rim faces and a smaller cap. Repeated operations retain the new topology. Preview changes rebuild from the immutable source; cancellation, duplicate, undo/redo and persistence include the mesh. Legacy saved exercises without mesh data derive a closed mesh from their existing extrusion/inset values. Mesh validation rejects invalid indices, inconsistent winding, degenerate faces, nonplanar quads and edges without two incident faces.

A perspective camera now divides by camera-space depth. A software depth buffer resolves surfaces and object overlap, then tests selection overlays against those surfaces. Picking reads the same visible-face buffer. Neutral gray flat shading distinguishes faces; Object Mode uses an orange silhouette, while Edit Mode shows geometry-linked vertex/edge overlays and selected-face tint. The XYZ gizmo uses the actual camera basis, as does the grid. Render inspection caught and corrected coplanar grid lines scarring solid faces.

G and Shift+D retain their shared absolute pointer calculation and re-anchoring behavior. Extrude pointer displacement follows the transformed selected-face normal. No lesson-engine, keyboard-recognition or progression changes were needed. The application name, Tavi artwork, instruction panel, lessons, progress storage key, navigation and community links are preserved.

## Reference comparison

The specifications agree with Blender's [Mesh Primitives manual](https://docs.blender.org/manual/en/5.4/modeling/meshes/primitives.html). Lighting follows the neutral, flat studio approach described in [Viewport Shading](https://docs.blender.org/manual/en/4.4/editors/3dview/display/shading.html) and [Workbench Lighting](https://docs.blender.org/manual/en/latest/render/workbench/lighting.html). Official indexed documentation was used where direct manual retrieval failed.

The rendered samples were visually compared with the default-cube screenshot in Blender's [developer-forum cursor discussion](https://devtalk.blender.org/t/2-83-custom-cursor-help/12162). The screenshot was viewed locally as a visual reference; it is not included in the distribution. The comparison supports recognizable solid gray faces, sharp geometry and orange selection outline. Camera framing and studio lighting differ; pixel-perfect equivalence is not claimed.

## Verification

- `npm test`: **39 passed, zero failed**, using normal isolated Node test processes.
- Existing complete-course event test covers all six stages, including top-face selection, extrusion, inset, final challenge, cancellation, duplication, persistence, replay and restart.
- Geometry checks verify dimensions, square faces, outward normals, closed topology, repeated E/I, transform pivots and proportions, mesh-preserving duplication, undo and cancellation.
- Rendering checks verify reciprocal perspective, object occlusion independent of draw order, hidden selection markers, depth-aware picking and grid coverage at 320 × 300, 700 × 345 and 1280 × 500, including pixel ratios one and two.
- Existing movement regressions pass across three viewport sizes, three zoom levels, all constrained axes and different pointer-event densities. Repeated Shift+D samples do not accumulate displacement.
- The [render review](./review/cube-accuracy.png) was inspected for Object Mode, all three Edit Mode selections, connected extrusion/inset and a rotated small viewport. These are direct renderer outputs, not browser screenshots; the HTML overlays and Canvas HUD are outside this image.
- Two-object warmed Node rendering averaged approximately 1 ms at 320 × 300 / DPR 1, 11 ms at 700 × 345 / DPR 2 and 24 ms at 1280 × 500 / DPR 2. This is a local measurement, not a browser performance guarantee.

No browser surface was available for full-page screenshots, live console inspection or physical keyboard/mouse testing. Those checks remain manual.

## Intentional limits

This remains a focused shortcut trainer. Modeling missions select the designated top cap; extrusion is positive along its local normal, and inset is bounded and proportional. It does not provide arbitrary component editing, transform orientation/pivot menus, modifiers, snapping, export, Blender's startup camera/light objects or exact Workbench lighting. Free Move defaults to X, Rotate defaults to Z, zoom adjusts focal magnification, and orbit retains its prior pitch limits. Whole-preview cancellation for Duplicate/Extrude remains the documented trainer simplification. No new runtime dependencies were added.

## Files

Changed: `js/viewport.js`, `css/styles.css`, `tests/app-flow.test.js`, `README.md`.

Added: `js/geometry.js`, `js/renderer.js`, `tests/geometry.test.js`, `CUBE_ACCURACY_REPORT.md`, `review/cube-accuracy.png`.

The project ZIP was refreshed with these changes.
