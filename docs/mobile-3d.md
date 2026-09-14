# MarkOS: mobile 3D update

Based on Ola commit `3f9bf72201b43e26101c9fb062e8d7a760d87d05`.

The scene opens with the cars in view. The camera follows their group during
playback, and **See whole scene** switches to the environment overview. On a
phone, **Touch to rotate** enables orbiting; **Done rotating · scroll page**
returns dragging to normal page scrolling. Playback always starts with a button.

## What changed

| Asset | File size, decimal MB | Triangles | Mesh primitives across scene nodes |
| --- | ---: | ---: | ---: |
| Existing `race.glb` | 76.44 | 1,962,917 | 1,196 |
| Desktop `race-web.glb` | 25.45 | 1,962,917 | 201 |
| Mobile `race-mobile.glb` | 16.88 | 1,514,657 | 201 |

Primitive count is a structural count, not a measured GPU draw-call count.
Materials and rendering passes can add work. These are file/geometry reductions,
not measured improvements in phone frame rate or load time.

The original export is retained. Both generated variants preserve the animation,
light, and materials. The desktop version keeps the original triangle count and
texture resolution. Geometry quantization reduces numerical precision slightly.
The mobile version also simplifies geometry conservatively and limits textures to
512 pixels. It trades fine detail for a lighter scene.

The viewer chooses the mobile file for a primary coarse pointer (normally a touch
screen), caps its pixel ratio at 1, and disables multisample antialiasing on that
profile. Other devices use the desktop file and a pixel-ratio cap of 1.5.

There is one selector for the rendered film, Blender viewport, and interactive
scene. Three.js and the GLB load only after selecting **Explore in 3D**. The
loading view shows a poster, real download progress, and a way back to the film.
Leaving 3D cancels the download and disposes its GPU resources. Scrolling the scene
out of view pauses playback. Resizing the mobile browser no longer resets the
camera.

The project list now includes **Time Tableau** with your screenshot and beta
link. SenseAid and NFC Bridge descriptions follow the history you gave, removing
unconfirmed production, ML, and latency claims. Your other project entries stay
in place.

## Run and check

Use a supported Node version for this project's existing Vite setup. The extra
Node tests require Node 22.6+ with type stripping; Node 24 works here.

```sh
npm ci
npm run build
npm run lint
npm run test:race
npm run dev
```

The generated assets are already included. To regenerate them after exporting a
new `public/media/race/race.glb`:

```sh
npm run prepare:race
npm run test:race
```

The preparation script is separate from the normal build. It takes time and
needs the source GLB. If you rename the cars in Blender, update `focusNodeNames`
in `src/data/raceScene.ts`. An unrecognized set of names falls back to the whole
scene view. This optimization script is for this rigid car scene, not a skinned
character.

## How the code fits together

| File | What to learn from it |
| --- | --- |
| `src/components/RaceShowcase.tsx` | React state chooses which media component exists. Unmounting 3D triggers cleanup. |
| `src/components/RaceSceneView.tsx` | The UI reflects loading, preparing, ready, and error states. A ref holds the viewer controller without causing renders every frame. |
| `src/lib/downloadGlb.ts` | Streamed fetch reports bytes, rejects HTML at a model URL, and honors cancellation. When total size is unknown, the UI shows bytes instead of inventing a percentage. |
| `src/lib/createRaceViewer.ts` | Three.js owns the render loop. Moving the camera and its target by the same offset follows the cars while preserving the visitor's orbit. |
| `src/lib/raceSceneTools.ts` | Cached mesh bounds avoid scanning every vertex repeatedly. Centered animation samples capture how far the cars spread apart. |
| `scripts/prepare-race.mjs` | Static parts are grouped under their animated parent, compatible opaque parts are joined, and Meshopt compresses geometry. The matching decoder is bundled in the viewer. |

Download size and rendering cost are different. Compressing bytes helps the
network. Joining parts reduces rendering overhead. Reducing triangles, texture
resolution, and pixel ratio lowers additional GPU work. This update addresses
all of those separately.

A GLB transports scene data rather than a finished Blender render. The interactive
viewer supplies a reflection environment. The rendered film remains the version
with your finished Blender lighting, background, and effects.

## Verification and remaining device check

Build and ESLint pass. Vite reports a size warning for the Three.js chunk; that
chunk is already loaded on demand. The focused tests cover bad model responses,
streaming/cancellation, playback restart, and camera fitting. Both derived models
were compared with the original at 25 animation times for all three car targets;
every embedded texture was decoded successfully.

These checks do not render a browser frame or measure a physical phone. Browser
preview access was unavailable in this session, so touch gestures, visual quality,
and performance still need a real-device check after applying the patch.

On your phone, open the scene, play the race, try both camera views, rotate and
zoom, then use **Done rotating** and scroll away. Check that playback pauses and
that switching back to the film works. Also try your existing **Enable tilt**
interaction on the hero cards; this update does not alter that motion code.
