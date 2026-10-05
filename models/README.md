# Dark Matter environment assets

These are original procedural 3D interpretations of three alternate Chicago environments. Official stills inform the palette and spatial cues; images are not embedded as geometry, textures, or backgrounds.

Each JSON is a self-contained Three.js Object3D export, with reusable primitive geometry and instanced architectural details. There are no cameras, lights, Box, external textures or runtime dependencies inside the assets.

```js
const json = await fetch('/assets/ash-city.json').then(r => r.json());
const environment = new THREE.ObjectLoader().parse(json);
scene.add(environment);
const collisionBounds = environment.userData.colliders;
```

Coordinates are metres, y is up, and the central walking ground is at y=0. The Box is reserved at (0,0,5). The open walking rectangle is x=-15..15, z=-30..10. The root group stays at its original transform; collision boxes use these world coordinates. Each collider is `{ name, min: [x,y,z], max: [x,y,z] }`. It represents a solid structural footprint. Snow, small debris and tree branches are visual detail.

| Asset | Draw calls | Triangles | Collision boxes | Bounds min | Bounds max |
| --- | ---: | ---: | ---: | --- | --- |
| ash-city.json | 73 | 101,108 | 8 | [-225,-1.497,-440] | [331,164,80] |
| frozen-city.json | 38 | 483,291 | 3 | [-225,-1.037,-440] | [242.5,164,90] |
| utopia-city.json | 98 | 351,280 | 19 | [-240,-0.295,-477.346] | [240,181.018,49.5] |

Ash World has a battered bank with a revolving-door silhouette, open damaged roof, exposed joists, cornices and pilasters; masonry street ruins, abandoned cars, gray debris and curbs; and several actual layers of devastated Chicago skyline beside an ash-saturated Lake Michigan surface. It is grounded in the [ICG interview with the cinematographers and production crew](https://www.icg600.com/news-articles/news/divergent) and [MPC's environment breakdown](https://www.mpcvfx.com/en/filmography/dark-matter/).

Snow World has layered wind-sculpted powder drifts, three gabled brick houses buried to their upper floors, roof cornices and icicles, sparse bare trees, footprints, frozen Lake Michigan, broken hexagonal ice plates, a piled shoreline ridge and distant large icebergs. The skyline extends behind the lake. It uses the visual language seen in [FOLKS' official house still](https://folksvfx.com/wp-content/uploads/2024/09/DARK-MATTER-STILLS13.jpg) and [shoreline still](https://folksvfx.com/wp-content/uploads/2024/09/DARK-MATTER-STILLS11.jpg).

World 26 has curved glass towers with continuous pearl ribs, thin floor rings and planted terraces, slender white/gold spires, a curved elevated skybridge, preserved low-rise brick architecture, paving joints, trees and seating planters, a small sculptural fountain beyond the walking rectangle, a lakefront park and Chicago skyline beyond the water. It uses [MPC's World 26 breakdown](https://www.mpcvfx.com/en/filmography/dark-matter/) and [FOLKS' official park still](https://folksvfx.com/wp-content/uploads/2024/09/DARK-MATTER-STILLS20.jpg).

The host scene should provide lighting, sky, fog and weather. The distant skyline geometry extends to about 480 metres, so the camera far plane should exceed 600 metres. All materials are ordinary MeshStandardMaterial. Meshes have castShadow and receiveShadow enabled, which the host may adjust to suit its performance budget.

To regenerate from the existing vendored Three.js module:

```sh
node models/generate-worlds.mjs
node models/validate-worlds.mjs
```

Validation round-trips all three files through ObjectLoader, verifies finite geometry and complete instance transforms, checks all structural colliders are outside the walking rectangle, raycasts the centre route for level continuous ground, and checks that custom drift, iceberg, tower and skybridge surfaces face outward.
