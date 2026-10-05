# Original Chicago / Dessen home environment

`home-world.json` is a self-contained Three.js Object3D asset containing an ordinary Chicago residential street and a warm, detailed explorable home interior. No camera, light, Box, external image, or remote texture is included.

This is an original spatial reconstruction informed by visible **Jason 1 / World 1** production references. Exact house dimensions and unseen room connections are not claimed as the canonical floor plan. The primary visual source is production designer Patricio Farrell's published World 1 set photos in [Art Directors Guild Perspective, page 68](https://digital.copcomm.com/i/1529668/69), supported by [Apple's episode stills](https://www.apple.com/tv-pr/originals/dark-matter/episodes-images/) and the [ICG cinematography interview](https://www.icg600.com/news-articles/news/divergent). It does not use the alternate Jason 2 loft or unrelated Apple apartment/foyer scenes as the original home.

The home includes a two-storey projecting polygonal window bay with dark octagonal conical roof, a 2.2-metre open paneled entrance, a foyer with red patterned runner, substantial dark timber stairs and turned balusters, carved four-leaf and spindle fretwork transoms, honey oak floorboards with subtle grain, plaster walls and molding, orange-red curtains with actual pleats, mustard/olive sofa, sage armchair, patterned cream rug, fireplace, bookcase with books, houseplants, original framed paintings, an art corner, family dining table/place settings, wire cube pendant, navy Shaker kitchen cabinets, glass upper fronts with plates and bowls, brass hardware, light cream counters, butcher-block/navy island with end bookshelf, black metal stools, white range, brushed steel hood, detailed faucet/sink, a photo/note-covered refrigerator, yellow dome pendants and numerous domestic props. Nearby original Chicago houses, parked cars, trees and a distant elevated rail give the street ordinary depth. The bay's exterior proportions are informed by a secondary Apple-credited show frame; its rear is open to the interior, and its measurements remain original reconstruction choices.

```js
const json = await fetch('/assets/home-world.json').then(r => r.json());
const home = new THREE.ObjectLoader().parse(json);
scene.add(home);
const colliders = home.userData.colliders;
const stops = home.userData.destinations;
```

Coordinates use metres and y is up. The main floor stays at y=0, with a flush front threshold for the host's existing walking camera. Start at `[0,1.67,2.25]`, facing -z. The front doorway is at z=-13. The central circulation path continues through the home to z=-34. Stairs are detailed structural scenery; the metadata does not promise a separate upstairs navigation system.

Each collider is `{name, min:[x,y,z], max:[x,y,z]}`. Colliders cover walls, stairs, furniture and neighboring houses. Decorative ceiling lintels and fretwork do not create false floor-level collision barriers. Root metadata includes `walkBounds`, `interiorBounds`, `entryPosition`, `entryWidth`, `assetBounds`, `sourceLinks`, `interpretation`, and `suggestedLights`.

`destinations` are seven ordered Turkish camera stops at 1.67-metre eye height, with `name`, `position`, and `lookAt`:

1. Chicago sokağı
2. Dessen ailesinin evi
3. Ahşap antre
4. Salon
5. Daniela’nın resim köşesi
6. Yemek alanı
7. Mutfak

The host should provide daylight, interior illumination, sky and fog. The emitting lamp globes are materials only; matching actual local lighting can be created from `suggestedLights` or adjusted for the host. Exterior lighting should be natural and warm. The dark wood and navy joinery require enough ambient indoor illumination to reveal their detail.

Statistics: 1,023,107 bytes, 73 draw calls, 190,532 triangles, 5,364 instances, 41 colliders. Bounds: `[-87.906,-0.125,-153.195]` to `[85.167,47.619,42]`.

Rebuild and validate from the existing vendored Three module:

```sh
node models/generate-home.mjs
node models/validate-home.mjs
```

Validation round-trips through ObjectLoader, checks finite vertices and absence of cameras/lights, raycasts every guided route segment in actual geometry at camera height with lateral clearance, checks those segments against structural collision boxes, verifies continuous low ground, verifies key ADG World 1 features, and enforces the preferred mesh and file-size budgets.
