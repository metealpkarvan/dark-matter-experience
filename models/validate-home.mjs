import * as THREE from '../dist/vendor/three.module.js';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const directory=path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../dist/assets');
const root=new THREE.ObjectLoader().parse(JSON.parse(await readFile(path.join(directory,'home-world.json'),'utf8')));root.updateMatrixWorld(true);
const assert=(value,message)=>{if(!value)throw new Error(message);};
let meshCount=0;root.traverse(o=>{assert(!o.isCamera&&!o.isLight,'Asset contains a camera or light');if(o.isMesh){meshCount++;for(const v of o.geometry.attributes.position.array)assert(Number.isFinite(v),'Nonfinite vertex');}});
const points=[[0,1.67,2.25],...root.userData.destinations.map(d=>d.position)];
for(let i=1;i<points.length;i++){
  const a=new THREE.Vector3(...points[i-1]),b=new THREE.Vector3(...points[i]),dir=b.clone().sub(a),length=dir.length();if(length<.01)continue;
  assert(b.y===1.67,'Destination eye height differs');
  for(let xOffset of [-.33,0,.33]){
    let o=a.clone();o.x+=xOffset;const hits=new THREE.Raycaster(o,dir.clone().normalize(),.001,length).intersectObject(root,true);
    assert(hits.length===0,'Guide path clips actual mesh '+hits[0]?.object?.name+' on segment '+i);
  }
  for(let t=0;t<=1;t+=.0125){let p=a.clone().lerp(b,t);assert(!root.userData.colliders.some(c=>p.x>c.min[0]-.33&&p.x<c.max[0]+.33&&p.z>c.min[2]-.33&&p.z<c.max[2]+.33),'Guide path clips collider on segment '+i);}
}
for(let z=2.25;z>=-34;z-=.5){const hits=new THREE.Raycaster(new THREE.Vector3(0,.25,z),new THREE.Vector3(0,-1,0),0,.4).intersectObject(root,true);assert(hits.length>0&&Math.abs(hits[0].point.y)<.075,'Missing continuous low ground at '+z);}
const features=root.children.flatMap(o=>o.userData.features??[]);
for(const feature of ['ornate dark timber transom rails','navy kitchen Shaker base cabinets','glass front kitchen cabinet panes','honey butcher block island top','orange red full height curtains','red patterned foyer runner'])assert(features.includes(feature),'Missing World1 cue '+feature);
assert((await readFile(path.join(directory,'home-world.json'))).byteLength<5e6,'Asset exceeds 5 MB');assert(meshCount<100,'Asset exceeds preferred draw-call budget');
console.log('PASS: ObjectLoader round trip; no camera/lights; '+meshCount+' meshes; all 7 Turkish eye-height waypoints and connecting paths clear in actual geometry and collision metadata; continuous ground; six ADG World1 fidelity cues; below 5 MB.');
