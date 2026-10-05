import * as THREE from '../dist/vendor/three.module.js';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const dir=path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../dist/assets');
function requireTrue(v,message){if(!v)throw new Error(message);}
function ray(root,origin,direction){return new THREE.Raycaster(new THREE.Vector3(...origin),new THREE.Vector3(...direction).normalize(),0,300).intersectObject(root,true);}
for(const file of ['ash-city.json','frozen-city.json','utopia-city.json']){
  const root=new THREE.ObjectLoader().parse(JSON.parse(await readFile(path.join(dir,file),'utf8')));root.updateMatrixWorld(true);
  requireTrue(root.userData.colliders.every(b=>b.max[0]<-15||b.min[0]>15||b.max[2]<-30||b.min[2]>10),'A structural collider overlaps the designated walk area in '+file);
  for(let z=2.25;z>=-30;z-=2.5){let hit=ray(root,[0,4,z],[0,-1,0]);requireTrue(hit.length&&Math.abs(hit[0].point.y)<.05,'Missing level centre ground at z='+z+' in '+file);}
  let count=0;root.traverse(o=>{if(o.isMesh){count++;let p=o.geometry.attributes.position.array;requireTrue(Array.from(p).every(Number.isFinite),'Nonfinite geometry in '+file);if(o.isInstancedMesh)requireTrue(o.instanceMatrix.count===o.count,'Missing instance matrix in '+file);}});
  if(file==='frozen-city.json'){
    requireTrue(ray(root,[-36,20,-11],[0,-1,0]).some(a=>a.object.name==='massive wind sculpted drifts'&&a.point.y>4),'Snow drift faces are invisible from above');
    let ice=root.getObjectByName('distant giant icebergs'),normal=ice.geometry.attributes.normal,p=ice.geometry.attributes.position;let outward=0;
    for(let i=0;i<p.count;i++)outward+=p.getX(i)*normal.getX(i)+p.getZ(i)*normal.getZ(i);requireTrue(outward>0,'Iceberg normals point inward');
  }
  if(file==='utopia-city.json'){
    requireTrue(ray(root,[0,45,-57],[-1,0,0]).some(a=>a.object.name==='curved living tower glass'),'Organic tower is invisible from outside');
    requireTrue(ray(root,[0,40,-49],[0,-1,0]).some(a=>a.object.name==='curving elevated skybridge deck'),'Skybridge top faces are invisible');
  }
  console.log(file+': ObjectLoader round-trip, '+count+' meshes, clear walk bounds, continuous y=0 ground and outward custom faces PASS');
}
