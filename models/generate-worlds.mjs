import * as THREE from '../dist/vendor/three.module.js';
import { writeFile, mkdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// Original, procedurally authored environment geometry. Scene references inform
// palette, scale and set dressing; no still is used as a texture or backdrop.
const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../dist/assets');
const v3 = (x=0,y=0,z=0) => new THREE.Vector3(x,y,z);
const clamp = (x,a,b) => Math.min(b,Math.max(a,x));
const smooth = x => { x=clamp(x,0,1); return x*x*(3-2*x); };
function random(seed) { return () => {seed |= 0;seed = seed + 0x6D2B79F5 | 0;let t=Math.imul(seed ^ seed>>>15,1 | seed);t=t + Math.imul(t ^ t>>>7,61 | t)^t;return ((t ^ t>>>14)>>>0)/4294967296;}; }
const geometries = {
  block: new THREE.BoxGeometry(1,1,1),
  cylinder: new THREE.CylinderGeometry(1,1,1,16),
  cone: new THREE.ConeGeometry(1,1,12),
  sphere: new THREE.SphereGeometry(1,14,10),
  leaf: new THREE.IcosahedronGeometry(1,1),
  rubble: new THREE.DodecahedronGeometry(1,0),
  slab: new THREE.CylinderGeometry(1,1,1,6),
  torus: new THREE.TorusGeometry(1,.026,6,36),
};
const makeMaterial = (name,color,roughness=.82,metalness=0,extra={}) => { const m=new THREE.MeshStandardMaterial({color,roughness,metalness,...extra});m.name=name;return m; };

class World {
  constructor(name,seed) {
    this.root=new THREE.Group();this.root.name=name;
    this.rng=random(seed);this.batches=new Map();this.colliders=[];
    this.root.userData={formatVersion:1,unit:'metres',groundY:0,walkBounds:{min:[-15,0,-30],max:[15,0,10]},boxPosition:[0,0,5],colliders:this.colliders};
  }
  r(a=0,b=1) { return a+(b-a)*this.rng(); }
  group(name) {let g=new THREE.Group();g.name=name;this.root.add(g);return g;}
  instance(geometry,material,pos,scale=[1,1,1],rotation=[0,0,0],color=null,label='details') {
    const key=geometry.uuid+'|'+material.uuid+'|'+label;
    if(!this.batches.has(key)) this.batches.set(key,{geometry,material,label,entries:[]});
    this.batches.get(key).entries.push({pos,scale,rotation,color});
  }
  block(m,p,s,r=[0,0,0],c=null,label='masonry') {this.instance(geometries.block,m,p,s,r,c,label);}
  cyl(m,p,s,r=[0,0,0],c=null,label='columns') {this.instance(geometries.cylinder,m,p,s,r,c,label);}
  sphere(m,p,s,c=null,label='organic forms') {this.instance(geometries.sphere,m,p,s,[0,0,0],c,label);}
  beam(m,a,b,width=.2,label='structural beams') {
    let d=v3(...b).sub(v3(...a)),q=new THREE.Quaternion().setFromUnitVectors(v3(0,1,0),d.clone().normalize());
    let e=new THREE.Euler().setFromQuaternion(q); this.cyl(m,v3(...a).add(v3(...b)).multiplyScalar(.5).toArray(),[width,d.length(),width],e.toArray().slice(0,3),null,label);
  }
  mesh(geometry,material,name,position=[0,0,0],scale=[1,1,1],rotation=[0,0,0]) {
    const m=new THREE.Mesh(geometry,material);m.name=name;m.position.set(...position);m.scale.set(...scale);m.rotation.set(...rotation);m.castShadow=true;m.receiveShadow=true;this.root.add(m);return m;
  }
  collider(name,min,max) {this.colliders.push({name,min,max});}
  finish() {
    const transform=new THREE.Object3D(),color=new THREE.Color();
    for(const b of this.batches.values()) {
      const mesh=new THREE.InstancedMesh(b.geometry,b.material,b.entries.length);mesh.name=b.label;
      b.entries.forEach((e,i)=>{transform.position.set(...e.pos);transform.scale.set(...e.scale);transform.rotation.set(...e.rotation);transform.updateMatrix();mesh.setMatrixAt(i,transform.matrix);if(e.color)mesh.setColorAt(i,color.set(e.color));});
      mesh.castShadow=true;mesh.receiveShadow=true;mesh.computeBoundingBox();mesh.computeBoundingSphere();this.root.add(mesh);
    }
    this.root.updateMatrixWorld(true);
    this.root.userData.assetBounds=new THREE.Box3().setFromObject(this.root).min.toArray();
    const bounds=new THREE.Box3().setFromObject(this.root);this.root.userData.assetBounds={min:bounds.min.toArray(),max:bounds.max.toArray()};
    return this.root;
  }
}

function terrain(width,depth,nx,nz,height,colorAt) {
  const g=new THREE.BufferGeometry(),p=[],n=[],c=[],uv=[],ix=[];const col=new THREE.Color();
  for(let z=0;z<=nz;z++) for(let x=0;x<=nx;x++) {
    const px=(x/nx-.5)*width,pz=(z/nz-.5)*depth,py=height(px,pz);
    p.push(px,py,pz);uv.push(x/nx,z/nz);col.set(colorAt(px,pz,py));c.push(col.r,col.g,col.b);
  }
  for(let z=0;z<nz;z++)for(let x=0;x<nx;x++){let a=z*(nx+1)+x,b=a+1,d=a+nx+1,e=d+1;ix.push(a,d,b,b,d,e);}
  g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('color',new THREE.Float32BufferAttribute(c,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();return g;
}
function gable(width,depth,wallH,rise) {
  const s=new THREE.Shape();s.moveTo(-width/2,0);s.lineTo(width/2,0);s.lineTo(width/2,wallH);s.lineTo(0,wallH+rise);s.lineTo(-width/2,wallH);s.closePath();
  const g=new THREE.ExtrudeGeometry(s,{depth,bevelEnabled:false});g.translate(0,0,-depth/2);return g;
}
function jaggedWall(w,h,d,seed) {
  let r=random(seed),s=new THREE.Shape();s.moveTo(-w/2,0);s.lineTo(w/2,0);s.lineTo(w/2,h*.75);
  for(let i=10;i>=0;i--)s.lineTo(-w/2+w*i/10,h*(.68+r()*.32));s.closePath();
  let g=new THREE.ExtrudeGeometry(s,{depth:d,bevelEnabled:false});g.translate(0,0,-d/2);return g;
}
function driftGeometry() {
  const p=[],c=[],ix=[],rings=16,segments=52,col=new THREE.Color();
  for(let j=0;j<=rings;j++)for(let i=0;i<=segments;i++) {
    let t=i/segments*Math.PI*2,r=j/rings,x=Math.cos(t)*r,z=Math.sin(t)*r;
    const h=Math.pow(Math.max(0,1-r*r),1.6)*(1+.09*Math.sin(x*9+z*4))+.026*Math.sin(x*25+z*8)*Math.sin(Math.PI*r);
    p.push(x,Math.max(0,h),z);col.setRGB(.90+.04*h,.95+.025*h,.98);c.push(col.r,col.g,col.b);
  }
  for(let j=0;j<rings;j++)for(let i=0;i<segments;i++){let a=j*(segments+1)+i,b=a+1,d=a+segments+1,e=d+1;ix.push(a,b,d,b,e,d);}
  let g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('color',new THREE.Float32BufferAttribute(c,3));g.setIndex(ix);g.computeVertexNormals();return g;
}
function icebergGeometry(seed=1) {
  const r=random(seed),ring=[],p=[],ix=[],n=7;
  for(let i=0;i<n;i++){let a=i/n*Math.PI*2;ring.push([Math.cos(a)*( .7+r()*.3),-.03,Math.sin(a)*(.7+r()*.3)]);}
  const top=[-.15+r()*.3,1,.15-r()*.3];
  for(let i=0;i<n;i++){
    let a=ring[i],b=ring[(i+1)%n],ridge=[(a[0]+b[0])*.45,.45+r()*.3,(a[2]+b[2])*.45];
    p.push(...a,...b,...ridge,...a,...ridge,...top,...ridge,...b,...top);let j=p.length/3-9;ix.push(j,j+2,j+1,j+3,j+5,j+4,j+6,j+8,j+7);
  }
  let g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setIndex(ix);g.computeVertexNormals();return g;
}
function tube(points,radius=.2,segments=48) {return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(a=>v3(...a))),segments,radius,6,false);}
function ringTube(points,radius=.2) {return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(a=>v3(...a)),true),48,radius,6,true);}
function ribbon(points,width,thickness=.32) {
  const curve=new THREE.CatmullRomCurve3(points.map(a=>v3(...a))),p=[],ix=[],N=64;
  for(let i=0;i<=N;i++) {let t=i/N,a=curve.getPoint(t),tan=curve.getTangent(t),side=v3(-tan.z,0,tan.x).normalize().multiplyScalar(width/2);
    for(let j=0;j<4;j++){let q=a.clone().addScaledVector(side,j%2===0?-1:1);q.y+=(j<2?0:-thickness);p.push(...q.toArray());}}
  for(let i=0;i<N;i++){let a=i*4,b=a+4;ix.push(a,b,a+1,a+1,b,b+1,a+2,a+3,b+2,a+3,b+3,b+2,a,a+2,b,a+2,b+2,b,a+1,b+1,a+3,a+3,b+1,b+3);}
  for(let i=0;i<ix.length;i+=3)[ix[i+1],ix[i+2]]=[ix[i+2],ix[i+1]];
  let g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setIndex(ix);g.computeVertexNormals();return g;
}

function chicagoSkyline(w,style,offset=-160) {
  const colors=style==='ash'?[0x585b59,0x777a75,0x666966]:style==='snow'?[0x889fa6,0x9bacad,0x738e97]:[0x789da2,0x85a9ad,0xb5bcb1];
  const wall=makeMaterial(style+' distant skyline',0xffffff,.86,.08),glass=makeMaterial(style+' distant windows',style==='utopia'?0xa3c4c7:style==='snow'?0x69828c:0x333b3b,.5,.2),edge=makeMaterial(style+' silhouette trims',style==='utopia'?0xe0dfcc:style==='snow'?0xb7c6cc:0x8e918a,.8);
  for(let row=0;row<3;row++)for(let i=0;i<23;i++) {
    const x=-190+i*18+w.r(-4,4),z=offset-row*76+w.r(-15,15),bh=w.r(19,70)*(1+row*.23),bw=w.r(9,17),bd=w.r(12,22);
    if(style==='ash' && i%4===0) {
      w.mesh(jaggedWall(bw,bh,bd,i+row*33),wall,'collapsed skyline shell',[x,0,z]);
      for(let j=0;j<4;j++)w.beam(edge,[x-bw/2+j*bw/3,bh*.6,z-bd/2],[x-bw/2+j*bw/3,bh*w.r(.86,1.12),z-bd/2],.17,'exposed skyline skeleton');
    } else w.block(wall,[x,bh/2,z],[bw,bh,bd],[0,0,0],colors[(i+row)%3],'layered skyline buildings');
    if(i%5===0)w.block(edge,[x,bh+.6,z],[bw*.9,1.2,bd*.9],[0,0,0],null,'skyline cornices');
    if(style==='snow')w.block(edge,[x,bh+.35,z],[bw+1,.7,bd+1],[0,0,0],null,'skyline snow caps');
    for(let floor=3;floor<bh-1;floor+=4.3)for(let k=0;k<Math.floor(bw/2.8);k++) {
      if(style==='ash'&&w.r()<.23)continue;
      w.block(glass,[x-bw/2+1.5+k*2.8,floor,z+bd/2+.02],[1.15,1.8,.08],[0,0,0],null,'distant recessed windows');
    }
  }
  // Chicago's stepped and twin-antenna profiles remain recognisable in depth.
  const sx=style==='utopia'?-113:-94,sz=offset-32;
  for(let k=0;k<5;k++){let ww=15-k*1.6,h=125-k*12;w.block(wall,[sx+(k%2)*8,h/2,sz-Math.floor(k/2)*8],[ww,h,18],[0,0,0],colors[0],'stepped Chicago tower');}
  for(let dx of [-4.5,4.5])w.cyl(edge,[sx+dx,143,sz],[.27,42,.27],[0,0,0],null,'twin skyline antennas');
  const hx=95,hz=offset-58;w.mesh(new THREE.CylinderGeometry(8,13,112,4,1,false,Math.PI/4),wall,'tapered lakefront tower',[hx,56,hz]);
  for(let dx of [-3.8,3.8])w.cyl(edge,[hx+dx,126,hz],[.23,32,.23],[0,0,0],null,'lakefront tower antennas');
  for(let y=3;y<105;y+=18){w.beam(edge,[hx-9,y,hz+9],[hx+8,y+18,hz+9],.2,'lakefront diagonal braces');w.beam(edge,[hx+8,y,hz+9],[hx-8,y+18,hz+9],.2,'lakefront diagonal braces');}
}

function ashWorld() {
  const w=new World('Ash World — abandoned lakeside Chicago',4893);
  w.root.userData.sourceLinks=['https://www.icg600.com/news-articles/news/divergent','https://www.mpcvfx.com/en/filmography/dark-matter/'];
  const ash=makeMaterial('powdered gray ash',0xffffff,.99,0,{vertexColors:true}),stone=makeMaterial('battered pale limestone',0xffffff,.98),dark=makeMaterial('empty black windows',0x252d2d,.91),edge=makeMaterial('weathered cornice edges',0x969b91,.99),metal=makeMaterial('corroded structural steel',0x4d5450,.94,.32),brick=makeMaterial('soot covered brick',0x646962,.98),rubble=makeMaterial('ash coated masonry rubble',0xffffff,.99),asphalt=makeMaterial('ash covered roadway',0x737972,1);
  w.mesh(terrain(450,520,80,96,(x,z)=>{let clear=1-smooth((Math.abs(x)-15)/6);return (Math.sin(x*.21+z*.08)*.04+Math.sin(z*.5)*.022)*(1-clear*.9);},(x,z)=>new THREE.Color().setRGB(.48+.018*Math.sin(x*.11),.50+.014*Math.sin(z*.13),.475)),ash,'continuous ash plain',[0,-.055,-180]);
  w.block(asphalt,[0,-.018,-43],[32,.04,132],[0,0,0],null,'buried street');
  for(let side of [-1,1])for(let z=10;z>-96;z-=3.2)w.block(edge,[side*16.35,.10,z],[.35,.27,2.9],[0,0,side*w.r(-.015,.015)],null,'broken street curb stones');
  for(let z=0;z>-75;z-=12)w.block(edge,[0,.012,z],[.12,.014,4.0],[0,0,0],null,'faint road paint beneath ash');
  // The ruined bank sits beside the route; open roof and exposed floor beams
  // provide parallax and an actual interior silhouette rather than a facade card.
  const bx=-29,bz=-14,bw=23,bd=28,bh=13;
  w.mesh(jaggedWall(bw,bh,1.2,992),stone,'broken west bank wall',[bx,0,bz-bd/2]);
  w.mesh(jaggedWall(bd,bh,1.1,551),stone,'broken bank side wall',[bx-bw/2,0,bz],[1,1,1],[0,Math.PI/2,0]);
  w.block(stone,[bx,6.0,bz+bd/2],[bw,12,1.0],[0,0,0],0x90968d,'bank entrance frontage');
  for(let z=bz-bd/2+2;z<bz+bd/2;z+=4.1){
    w.block(stone,[bx+bw/2-1.1,6.0,z],[1.2,12,1.1],[0,0,0],0x91988e,'bank pilasters');
    w.block(dark,[bx+bw/2-.47,7.1,z+1.45],[.09,4.6,1.5],[0,0,0],null,'bank empty window bays');
    w.block(edge,[bx+bw/2-.35,4.8,z+1.45],[.29,.3,1.85],[0,0,0],null,'bank window sills');
    w.block(edge,[bx+bw/2-.35,9.4,z+1.45],[.30,.38,1.9],[0,0,0],null,'bank window lintels');
  }
  for(let y of [1.4,4.0,10.7,12.0])w.block(edge,[bx, y,bz+bd/2+.65],[bw+1,.42,.42],[0,0,0],null,'bank horizontal stone courses');
  for(let x=bx-bw/2+2;x<bx+bw/2;x+=4.2) {
    w.block(dark,[x,7.8,bz+bd/2+.52],[2.4,3.6,.09],[0,0,0],null,'bank dark front windows');
    for(let dy of [-1.85,1.85])w.block(edge,[x,7.8+dy,bz+bd/2+.64],[2.75,.25,.4],[0,0,0],null,'bank ornamental window frame');
    for(let dx of [-1.28,1.28])w.block(edge,[x+dx,7.8,bz+bd/2+.64],[.25,3.8,.4],[0,0,0],null,'bank ornamental window frame');
  }
  // A classical portico with two damaged columns and a broken pediment.
  for(let z of [-21,-16,-11,-6]){
    w.cyl(stone,[-16.55,3.5,z],[.54,6.8,.54],[0,0,0],0x959c92,'bank portico columns');
    for(let y of [.4,6.85])w.block(edge,[-16.55,y,z],[1.45,.5,1.45],[0,0,0],null,'bank column capitals and bases');
  }
  w.block(edge,[-16.8,7.3,-13.5],[2.3,.9,18.8],[0,0,0],null,'bank portico entablature');
  w.block(dark,[-16.68,2.4,-13.5],[.25,4.8,4.0],[0,0,0],null,'revolving doorway shadow');
  w.cyl(metal,[-16.37,2.4,-13.5],[.08,4.8,.08],[0,0,0],null,'revolving door spindle');
  w.block(metal,[-16.37,2.4,-13.5],[1.7,4.7,.10],[0,.42,0],null,'damaged revolving door');
  w.block(metal,[-16.37,2.4,-13.5],[1.7,4.7,.10],[0,Math.PI/2+.42,0],null,'damaged revolving door');
  for(let i=0;i<7;i++)w.block(metal,[bx-8+i*2.65,9.8,bz],[.23,.28,bd-2],[w.r(-.12,.18),0,w.r(-.13,.13)],null,'exposed broken bank roof joists');
  for(let i=0;i<4;i++)w.block(stone,[bx-6+i*4.2,11.7,bz-w.r(0,7)],[3.5,.55,w.r(7,14)],[w.r(-.2,.2),0,w.r(-.08,.08)],0x8b9187,'surviving bank roof fragments');
  for(let i=0;i<9;i++)w.block(metal,[bx+w.r(-8,8),w.r(1.5,6),bz+w.r(-10,10)],[.18,.25,w.r(3,9)],[w.r(-1,1),w.r(-1,1),w.r(-1,1)],null,'fallen roof steel');
  w.collider('abandoned bank',[-41,0,-28],[-15.7,13.5,.7]);
  // Nearby retail shells and a staggered line of blocks establish a real street.
  for(let side of [-1,1])for(let i=0;i<5;i++){
    if(side===-1&&i===0)continue;
    const x=side*w.r(27,34),z=-38-i*23,bh=w.r(13,28),bw=w.r(17,23),bd=w.r(17,23);
    w.mesh(jaggedWall(bw,bh,bd,100+i+side),brick,'ruined street block',[x,0,z]);
    for(let y=3.2;y<bh-2;y+=3.7)for(let j=-2;j<=2;j++){
      w.block(dark,[x+j*3.1,y,z+bd/2+.04],[1.75,2.3,.09],[0,0,0],null,'near shattered windows');
      w.block(edge,[x+j*3.1,y-1.3,z+bd/2+.1],[2.1,.21,.32],[0,0,0],null,'near window sills');
    }
    for(let y=1;y<bh-1;y+=1.1)w.block(edge,[x,y,z+bd/2+.08],[bw,.05,.12],[0,0,0],null,'worn masonry courses');
    for(let k=0;k<3;k++)w.beam(metal,[x-bw/2+k*bw/2,bh*.7,z],[x-bw/2+k*bw/2+w.r(-1,1),bh+w.r(1,6),z],.12,'projecting ruin rebar');
    if(i<2)w.collider('street ruin '+side+' '+i,[x-bw/2,0,z-bd/2],[x+bw/2,bh,z+bd/2]);
  }
  // Ground debris uses one small irregular geometry with individual colors.
  for(let i=0;i<620;i++){
    let side=w.r()<.5?-1:1,x=side*w.r(16.8,45),z=w.r(-120,16),s=w.r(.10,1.0),h=w.r(.12,.65);
    w.instance(geometries.rubble,rubble,[x,h*.4,z],[s,h,s*w.r(.5,1.7)],[w.r(0,3),w.r(0,6),w.r(0,3)],new THREE.Color().setRGB(w.r(.41,.65),w.r(.43,.64),w.r(.41,.61)),'scattered ash rubble');
  }
  for(let i=0;i<45;i++){let x=w.r(-43,-17),z=w.r(-32,7);w.block(stone,[x,w.r(.15,.6),z],[w.r(.4,2.2),w.r(.2,.8),w.r(.6,2.8)],[w.r(-.3,.3),w.r(0,6),w.r(-.3,.3)],0x939b90,'fallen cut stone');}
  // Abandoned ash-coated automobiles beside the route.
  for(const [x,z,a] of [[20,-18,.05],[19,-47,-.08],[-20,-57,.3],[24,-72,-.3]]){
    w.block(stone,[x,.65,z],[1.95,1.1,4.5],[0,a,0],0x747b72,'abandoned car bodies');
    w.block(dark,[x,1.35,z-.15],[1.75,.72,2.05],[0,a,0],null,'abandoned car windows');
    w.block(stone,[x,1.74,z-.15],[1.8,.15,2.08],[0,a,0],0x8a9287,'car roof ash crust');
    for(const dx of [-.97,.97])for(const dz of [-1.4,1.4])w.cyl(dark,[x+dx,.35,z+dz],[.34,.2,.34],[0,0,Math.PI/2],null,'buried car wheels');
    w.collider('abandoned car '+z,[x-1.3,0,z-2.7],[x+1.3,1.9,z+2.7]);
  }
  for(let z=-24;z>-108;z-=24){w.cyl(metal,[17.5,4.0,z],[.06,8,.06],[0,0,0],null,'failed streetlamps');w.beam(metal,[17.5,7.95,z],[14.9,8.2,z],.055,'failed streetlamp arms');w.block(metal,[14.8,8.1,z],[.75,.17,.33],[0,0,0],null,'dark streetlamp heads');}
  chicagoSkyline(w,'ash',-165);
  const lake=makeMaterial('thick ash on Lake Michigan',0x80887f,.97);
  w.mesh(terrain(280,440,65,88,(x,z)=>-.17+Math.sin(x*.065+z*.11)*.12+Math.sin(z*.28)*.04,()=>0x80877f),lake,'ash saturated lake',[191,-.05,-180]);
  return w.finish();
}

function snowWorld() {
  const w=new World('Snow World — wind sculpted frozen Chicago',8247);
  w.root.userData.sourceLinks=['https://folksvfx.com/vfx-voice-opening-doors-to-alternate-chicagos-and-vivid-new-worlds-in-dark-matter/','https://folksvfx.com/wp-content/uploads/2024/09/DARK-MATTER-STILLS13.jpg','https://folksvfx.com/wp-content/uploads/2024/09/DARK-MATTER-STILLS11.jpg'];
  const snow=makeMaterial('layered powder snow',0xffffff,.94,0,{vertexColors:true}),plainSnow=makeMaterial('fresh roof powder',0xddebf0,.95),brick=makeMaterial('blue gray frozen masonry',0x778b8f,.99),glass=makeMaterial('opaque cold window glass',0x324e5b,.38,.14),trim=makeMaterial('snow buried timber frames',0xa7b4b3,.94),ice=makeMaterial('blue fractured lake ice',0xa9d4df,.34,.05),whiteIce=makeMaterial('opaque snowy ice ridges',0xd9e8ec,.7),twig=makeMaterial('frosted bare wood',0x8c9d9f,.98);
  const drift=driftGeometry();
  w.mesh(terrain(450,530,92,108,(x,z)=>{
    const clear=smooth((Math.abs(x)-16)/10)*smooth((z+40)/14)+smooth((-z-35)/20);
    return clear*(.16+1.1*Math.pow(Math.sin(x*.029+z*.012),2)+.11*Math.sin(x*.32+z*.12))-.03;
  },(x,z,h)=>new THREE.Color().setRGB(.77+.025*Math.sin(x*.12+z*.2),.86+.013*Math.sin(z*.3),.9)),snow,'snowfield with wind ripples',[0,0,-175]);
  // A flat central snow surface is kept at y=0 for the owner's walking model.
  w.block(plainSnow,[0,-.035,-10],[30,.065,42],[0,0,0],null,'level snow route');
  for(const [x,z,sx,sz,h,a] of [[-36,-11,18,28,4.9,0],[36,-27,18,36,5.4,0],[-48,-46,28,19,6.5,.05],[44,5,24,35,4.8,0],[-35,16,17,18,3.3,0],[31,-63,27,21,5.1,.5],[-77,-96,45,38,9,.7]])w.instance(drift,snow,[x,-.01,z],[sx,h,sz],[0,a,0],null,'massive wind sculpted drifts');
  function house(x,z,width,depth,color,rotation=0) {
    // The physical ground floor exists, but its lower walls are hidden by drift.
    let body=gable(width,depth,7.2,3.2);w.mesh(body,brick,'buried brick house',[x,0,z],[1,1,1],[0,rotation,0]);
    const east=Math.cos(rotation),south=Math.sin(rotation),frontZ=z+depth/2+.05;
    w.block(trim,[x,6.5,frontZ],[width+.3,.34,.32],[0,rotation,0],null,'house snow covered eaves');
    for(let xx of [-width*.3,0,width*.3]){
      w.block(glass,[x+xx,5.7,frontZ+.06],[1.9,1.8,.12],[0,rotation,0],null,'upper story house windows');
      for(let dx of [-1.08,0,1.08])w.block(trim,[x+xx+dx,5.7,frontZ+.15],[.12,2.04,.21],[0,rotation,0],null,'frozen house window jambs');
      for(let dy of [-1.0,0,1.0])w.block(trim,[x+xx,5.7+dy,frontZ+.15],[2.25,.11,.21],[0,rotation,0],null,'frozen house window lintels');
    }
    for(let y=3.1;y<8;y+=.31)for(let j=0;j<Math.floor(width/.68);j++) {
      let xx=x-width/2+.34+j*.68+(Math.round(y/.31)%2? .33:0);if(xx>x+width/2-.1)continue;
      w.block(brick,[xx,y,frontZ+.01],[.61,.23,.12],[0,rotation,0],new THREE.Color().setRGB(.70+w.r(0,.16),.77+w.r(0,.14),.78+w.r(0,.14)),'individual frozen brick courses');
    }
    // Soft roof pillows and overhanging wind cornices contrast with lake ice.
    for(let side of [-1,1]){
      const slope=Math.atan2(3.2,width/2);w.block(plainSnow,[x+side*width*.25,9.0,z],[width*.63,.64,depth+1.1],[0,0,-side*slope],null,'deep snow on gable roof');
      w.instance(drift,snow,[x+side*width*.22,9.1,z],[width*.43,.8,depth*.65],[0,side*.15,0],null,'wind blown roof snow');
    }
    w.block(brick,[x-width*.27,10.1,z-2],[1.15,3.1,1.05],[0,0,0],color,'frozen chimney');
    w.block(plainSnow,[x-width*.27,11.7,z-2],[1.55,.42,1.40],[0,0,0],null,'chimney snow cap');
    for(let i=0;i<29;i++)w.instance(geometries.cone,ice,[x-width/2+i*width/28,6.7-w.r(.2,.65),frontZ+.3],[w.r(.045,.10),w.r(.3,1.3),w.r(.045,.10)],[0,0,Math.PI],null,'hanging roof icicles');
    w.collider('snow buried house '+x,[x-width/2-.5,0,z-depth/2-.5],[x+width/2+.5,11.95,z+depth/2+.7]);
  }
  house(-30,-16,19,17,0x6a797c);house(32,-41,17,19,0x7a888a);house(-57,-51,14,17,0x65767b);
  // Fine wind striations and a few footprints give the ground a human scale.
  for(let i=0;i<200;i++){
    let side=w.r()<.5?-1:1,x=side*w.r(29,100),z=w.r(-122,45);
    w.instance(drift,snow,[x,w.r(.05,.5),z],[w.r(3,14),w.r(.08,.35),w.r(.35,2.4)],[0,.16+w.r(-.1,.1),0],null,'powder sastrugi ridges');
  }
  for(let z=2;z>-29;z-=1.3)for(let side of [-1,1])w.sphere(trim,[side*.22,.005,z+(side>0?.5:0)],[.12,.008,.23],0xc2d2d7,'faint snow footprints');
  // Snow-encrusted bare trees remain sparse: this is a city buried in snow.
  for(const [x,z] of [[-20,-3],[22,-12],[-49,8],[52,-62],[-83,-38]]) {
    w.beam(twig,[x,0,z],[x+.4,7.8,z-.5],.13,'buried tree trunks');
    for(let i=0;i<7;i++){let a=i/7*Math.PI*2;let end=[x+Math.cos(a)*w.r(1.7,3.0),w.r(5.6,9),z+Math.sin(a)*w.r(1.5,2.9)];w.beam(twig,[x,3+i*.45,z],end,.055,'frosted tree branches');w.sphere(plainSnow,[end[0],end[1]+.08,end[2]],[.34,.13,.27],null,'powder on branches');}
  }
  const lake=makeMaterial('frozen Lake Michigan surface',0xb5d1d8,.54,.03);
  w.mesh(terrain(455,345,90,64,(x,z)=>.08+Math.sin(x*.037+z*.06)*.08,(x,z)=>new THREE.Color().setRGB(.64+.035*Math.sin(x*.14),.78+.02*Math.sin(z*.07),.83)),makeMaterial('fractured frozen lake',0xffffff,.57,.02,{vertexColors:true}),'broad frozen Lake Michigan',[15,.015,-250]);
  for(let i=0;i<380;i++){
    let x=w.r(-180,210),z=w.r(-405,-83),s=w.r(1.8,7.5);
    w.instance(geometries.slab,ice,[x,w.r(.15,.42),z],[s,w.r(.2,.9),s*w.r(.6,1.4)],[w.r(-.07,.07),w.r(0,6),w.r(-.08,.08)],new THREE.Color().setRGB(w.r(.60,.8),w.r(.77,.91),w.r(.82,.95)),'broken floating ice plates');
  }
  const bergs=[icebergGeometry(23),icebergGeometry(76),icebergGeometry(86)];
  for(let i=0;i<55;i++) {
    let x=w.r(-185,200),z=w.r(-375,-111),sx=w.r(5,15),sy=w.r(4,17);
    w.instance(bergs[i%3],whiteIce,[x,.1,z],[sx,sy,sx*w.r(.8,1.7)],[0,w.r(0,6),0],null,'distant giant icebergs');
  }
  for(let i=0;i<140;i++){
    let x=-190+i*2.8,z=-82+w.r(-5,5),sx=w.r(.8,3.5),h=w.r(1.1,4.2);
    w.instance(bergs[i%3],ice,[x,0,z],[sx,h,w.r(1.3,4.0)],[0,w.r(0,6),0],null,'jagged piled shoreline ice wall');
  }
  chicagoSkyline(w,'snow',-200);
  return w.finish();
}

function organicTowerGeometry(height,radius,phase=0) {
  const p=[],ix=[],rings=35,segs=40;
  for(let j=0;j<=rings;j++)for(let i=0;i<=segs;i++){
    let t=j/rings,a=i/segs*Math.PI*2+t*.75,rr=radius*(.72+.20*Math.sin(t*Math.PI)-.29*t+.055*Math.sin(t*14+phase));
    p.push(Math.cos(a)*rr+Math.sin(t*3+phase)*radius*.2,t*height,Math.sin(a)*rr*.73+Math.cos(t*3+phase)*radius*.18);
  }
  for(let j=0;j<rings;j++)for(let i=0;i<segs;i++){let a=j*(segs+1)+i,b=a+1,d=a+segs+1,e=d+1;ix.push(a,d,b,b,d,e);}
  let g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setIndex(ix);g.computeVertexNormals();return g;
}

function utopiaWorld() {
  const w=new World('World 26 — planted ideal Chicago',2607);
  w.root.userData.sourceLinks=['https://www.mpcvfx.com/en/filmography/dark-matter/','https://folksvfx.com/wp-content/uploads/2024/09/DARK-MATTER-STILLS20.jpg'];
  const ground=makeMaterial('warm plaza limestone',0xc7ccc0,.84),paver=makeMaterial('subtle plaza paver lines',0x9cae9e,.94),white=makeMaterial('pearl white futuristic architecture',0xe4e5d8,.52,.10),glass=makeMaterial('blue green organic tower glazing',0x72a3ab,.28,.43),gold=makeMaterial('soft gold architectural ribs',0xb4aa78,.39,.42),dark=makeMaterial('heritage window glazing',0x3f676a,.4,.18),stone=makeMaterial('historic Chicago cream masonry',0xffffff,.87),brick=makeMaterial('preserved warm brick',0xad8770,.96),soil=makeMaterial('planter soil',0x465546,1),leaf=makeMaterial('park leaves',0xffffff,.87),trunk=makeMaterial('tree bark',0x6f7962,.98),water=makeMaterial('calm blue green lake',0x6aa4ae,.22,.23),grass=makeMaterial('park lawn',0x91ad82,.95),bench=makeMaterial('pale timber park seating',0xaa9c79,.81);
  w.block(ground,[0,-.045,-33],[145,.09,165],[0,0,0],null,'level continuous plaza');
  for(let x=-70;x<=70;x+=3.5)w.block(paver,[x,.007,-32],[.029,.014,160],[0,0,0],null,'plaza paving joints');
  for(let z=45;z>-114;z-=3.5)w.block(paver,[0,.009,z],[143,.014,.026],[0,0,0],null,'plaza paving joints');
  // Thin organic surfaces and branching ribs give towers depth from every angle.
  function tower(x,z,h,r,phase,color) {
    w.mesh(organicTowerGeometry(h,r,phase),glass,'curved living tower glass',[x,0,z]);
    for(let i=0;i<10;i++) {
      const pts=[];for(let j=0;j<=15;j++){let t=j/15,a=i/10*Math.PI*2+t*.75,rr=r*(.72+.20*Math.sin(t*Math.PI)-.29*t+.055*Math.sin(t*14+phase));pts.push([x+Math.cos(a)*rr+Math.sin(t*3+phase)*r*.2,t*h,z+Math.sin(a)*rr*.73+Math.cos(t*3+phase)*r*.18]);}
      w.mesh(tube(pts,.16,54),white,'tower continuous white structural fin');
    }
    for(let y=3.5;y<h-1;y+=3.5){let t=y/h,rr=r*(.72+.20*Math.sin(t*Math.PI)-.29*t+.055*Math.sin(t*14+phase));
      w.instance(geometries.torus,white,[x+Math.sin(t*3+phase)*r*.2,y,z+Math.cos(t*3+phase)*r*.18],[rr,rr*.73,rr],[Math.PI/2,0,t*.75],null,'tower floor edge rings');
      if(Math.round(y/3.5)%3===0)for(let i=0;i<5;i++){let a=i/5*Math.PI*2+t*.75;w.sphere(leaf,[x+Math.cos(a)*rr,y+.32,z+Math.sin(a)*rr*.74],[1.0,.58,.75],new THREE.Color().setRGB(.32+w.r(0,.12),.48+w.r(0,.12),.27),'tower planted terraces');}
    }
    w.collider('living tower '+x,[x-r-1,0,z-r],[x+r+1,h,z+r]);
  }
  tower(-38,-57,87,13,.15,0x729da5);tower(39,-62,102,14,1.5,0x638d98);tower(-63,-104,121,12,.6,0x6c96a0);
  // A planted terraces tower on the right adds a distinctly layered silhouette.
  for(let i=0;i<21;i++){
    let x=65+Math.sin(i*.65)*1.2,z=-100+Math.cos(i*.45)*1.6,y=2.2+i*3.35;
    w.block(glass,[x,y,z],[15,2.9,14],[0,i*.014,0],null,'terrace tower glass levels');
    w.block(white,[x,y+1.6,z],[19,.48,18],[0,i*.014,0],null,'overhanging planted terrace slabs');
    for(let k=0;k<10;k++){let a=k/10*Math.PI*2;w.sphere(leaf,[x+Math.cos(a)*8.8,y+2.1,z+Math.sin(a)*8.0],[1.25,.65,1.1],new THREE.Color().setRGB(w.r(.29,.47),w.r(.44,.61),w.r(.20,.34)),'lush vertical terrace shrubs');}
  }
  for(const [x,z,h,r] of [[-81,-145,157,4.1],[88,-164,181,4.5],[12,-171,143,3.0]]){
    w.mesh(new THREE.CylinderGeometry(.5,r,h,16),gold,'slender World 26 gold spire',[x,h/2,z]);
    for(let i=0;i<4;i++){let a=i/4*Math.PI*2;w.mesh(tube([[x+Math.cos(a)*r,0,z+Math.sin(a)*r],[x+Math.cos(a)*(r+2),h*.55,z+Math.sin(a)*(r+2)],[x+Math.cos(a)*.7,h,z+Math.sin(a)*.7]],.29,64),white,'spire sweeping pearl ribs');}
  }
  // Airy elevated pedestrian bridge connects the organic towers overhead.
  const bridge=[[-39,20,-52],[-23,21,-50],[0,22,-49],[24,23,-53],[39,24,-59]];
  w.mesh(ribbon(bridge,4.4,.42),white,'curving elevated skybridge deck');
  for(let side of [-1,1]){
    let pts=bridge.map(a=>[a[0],a[1]+1.15,a[2]+side*2.05]);w.mesh(tube(pts,.075,64),gold,'skybridge slender handrail');
    for(let i=0;i<32;i++){let a=new THREE.CatmullRomCurve3(bridge.map(a=>v3(...a))).getPoint(i/31);w.cyl(white,[a.x,a.y+.6,a.z+side*2.05],[.055,1.2,.055],[0,0,0],null,'skybridge open railing posts');}
  }
  // Historic low-rise blocks anchor the ultramodern city in recognisable Chicago.
  function historic(x,z,bw,bd,bh) {
    w.block(brick,[x,bh/2,z],[bw,bh,bd],[0,0,0],null,'preserved Chicago brick buildings');
    for(let y of [1.1,4.2,bh-.7,bh+.1])w.block(stone,[x,y,z+bd/2+.13],[bw+1,.4,.5],[0,0,0],0xd5cfbc,'heritage stone cornice courses');
    for(let y=2.7;y<bh-1;y+=3.0)for(let xx=-bw/2+1.6;xx<bw/2;xx+=3.0){
      w.block(dark,[x+xx,y,z+bd/2+.04],[1.4,1.8,.12],[0,0,0],null,'historic front windows');
      for(let dx of [-.83,.83])w.block(stone,[x+xx+dx,y,z+bd/2+.12],[.19,2.0,.22],[0,0,0],0xc1bca8,'historic inset window frames');
      w.block(stone,[x+xx,y-1,z+bd/2+.14],[1.85,.15,.33],[0,0,0],0xc1bca8,'historic stone window sill');
    }
    for(let z1=-bd/2+1.5;z1<bd/2;z1+=3.2)for(let y=2.7;y<bh-1;y+=3)w.block(dark,[x+bw/2+.05,y,z+z1],[.12,1.8,1.45],[0,0,0],null,'historic side windows');
    for(let xx=-bw/2;xx<=bw/2;xx+=bw/5)w.block(stone,[x+xx,bh/2,z+bd/2+.2],[.35,bh,.44],[0,0,0],0xc3bfae,'heritage facade pilasters');
    w.block(white,[x,bh+.5,z],[bw+1,.45,bd+1],[0,0,0],null,'historic roof cap');
    w.collider('heritage block '+x,[x-bw/2,0,z-bd/2],[x+bw/2,bh+1,z+bd/2+.5]);
  }
  historic(-36,-18,21,19,14);historic(35,-24,20,19,17);historic(-93,-48,24,25,23);
  function tree(x,z,h=7,c=.0) {
    w.cyl(trunk,[x,h*.32,z],[.19,h*.65,.19],[0,0,0],null,'park tree trunks');
    for(let i=0;i<7;i++){let a=i/7*Math.PI*2;let ex=x+Math.cos(a)*h*.25,ez=z+Math.sin(a)*h*.25;w.beam(trunk,[x,h*.40,z],[ex,h*.76,ez],.055,'park branching tree limbs');
      w.instance(geometries.leaf,leaf,[ex,h*.8+w.r(-.35,.45),ez],[h*.22,h*.21,h*.22],[0,w.r(0,6),0],new THREE.Color().setRGB(.29+w.r(0,.15)+c,.47+w.r(0,.14)+c,.23+w.r(0,.11)),'lush rounded park canopies');}
    w.sphere(leaf,[x,h*.99,z],[h*.27,h*.22,h*.27],0x678950,'park treetop crowns');
  }
  for(const [x,z] of [[-21,-5],[21,-8],[-21,-26],[21,-29],[-20,17],[22,16]]){
    w.cyl(white,[x,.45,z],[3.0,.9,3.0],[0,0,0],null,'round planted plaza seating beds');
    w.cyl(soil,[x,.93,z],[2.7,.08,2.7],[0,0,0],null,'recessed planter soil');
    tree(x,z,7.4);
    for(let i=0;i<17;i++){let a=w.r(0,6.28),r=w.r(1.3,2.45);w.sphere(leaf,[x+Math.cos(a)*r,1.13,z+Math.sin(a)*r],[.48,.4,.50],new THREE.Color().setRGB(w.r(.3,.55),w.r(.47,.66),w.r(.25,.43)),'low plaza planting');}
    w.collider('plaza planter '+x+' '+z,[x-3.0,0,z-3.0],[x+3.0,1.3,z+3.0]);
  }
  // Low seating and slender functional street furniture live outside the route.
  for(let side of [-1,1])for(let z of [3,-17,-38]){
    const x=side*17.3;w.block(bench,[x,.6,z],[1.05,.18,3.5],[0,0,0],null,'park bench timber seats');
    for(let dz of [-1.1,1.1])w.block(white,[x,.3,z+dz],[.7,.6,.19],[0,0,0],null,'park bench supports');
    w.collider('plaza bench '+x+' '+z,[x-.6,0,z-1.8],[x+.6,.75,z+1.8]);
  }
  for(let side of [-1,1])for(let z=15;z>-105;z-=20){w.cyl(white,[side*25,3.4,z],[.065,6.8,.065],[0,0,0],null,'slender plaza lamp columns');w.sphere(white,[side*25,6.82,z],[.25,.10,.25],null,'plaza lamp discs');}
  // Sculpture and shallow fountain form a destination beyond the walk bounds.
  w.cyl(white,[0,.18,-48],[8,.36,8],[0,0,0],null,'circular fountain limestone basin');
  w.cyl(water,[0,.38,-48],[7.6,.08,7.6],[0,0,0],null,'shallow fountain water');
  for(let k=0;k<3;k++){let pts=[];for(let i=0;i<40;i++){let a=i/40*Math.PI*2;pts.push([Math.cos(a)*2.5,3+Math.sin(a)*2.5,-48+Math.sin(a+k*.8)*.8]);}w.mesh(ringTube(pts,.18),gold,'open sculptural fountain rings');}
  w.collider('fountain basin',[-8,0,-56],[8,.5,-40]);
  w.block(grass,[0,-.025,-107],[165,.08,60],[0,0,0],null,'lakefront park lawns');
  w.block(ground,[0,.019,-108],[9,.06,70],[0,0,0],null,'park central promenade');
  for(let i=0;i<56;i++) {let side=i%2===0?-1:1,x=side*w.r(11,80),z=w.r(-133,-81);tree(x,z,w.r(5.2,9.6),.02);}
  for(let side of [-1,1])for(let z=-82;z>-138;z-=13)w.block(ground,[side*38,.03,z],[70,.06,2.0],[0,0,0],null,'park cross paths');
  // The lake sits well beyond the traversable foreground and catches sky light.
  w.mesh(terrain(480,300,90,58,(x,z)=>-.25+Math.sin(x*.045+z*.12)*.045,(x,z)=>new THREE.Color().setRGB(.37+.018*Math.sin(z*.15),.62+.02*Math.sin(x*.07),.67)),makeMaterial('Lake Michigan water',0xffffff,.26,.17,{vertexColors:true}),'calm Lake Michigan',[0,0,-290]);
  w.block(white,[0,.3,-137],[171,.8,1.1],[0,0,0],null,'lakefront limestone promenade edge');
  for(let x=-82;x<=82;x+=2.1)w.cyl(gold,[x,1.03,-136.6],[.035,1.2,.035],[0,0,0],null,'lakefront promenade rail posts');
  w.block(gold,[0,1.68,-136.6],[167,.07,.07],[0,0,0],null,'lakefront promenade slender handrail');
  chicagoSkyline(w,'utopia',-300);
  return w.finish();
}

await mkdir(OUT,{recursive:true});
const summary=[];
for(const [slug,build] of [['ash-city',ashWorld],['frozen-city',snowWorld],['utopia-city',utopiaWorld]]) {
  const root=build();const json=root.toJSON();
  const output=path.join(OUT,slug+'.json');await writeFile(output,JSON.stringify(json));
  // Round-trip through the same ObjectLoader used by the website.
  const restored=new THREE.ObjectLoader().parse(JSON.parse(await readFile(output,'utf8')));
  let drawCalls=0,instances=0,triangles=0;
  restored.traverse(o=>{if(o.isMesh){drawCalls+=Array.isArray(o.material)?o.material.length:1;const n=o.isInstancedMesh?o.count:1;instances+=n;triangles+=(o.geometry.index?o.geometry.index.count:o.geometry.attributes.position.count)/3*n;}});
  if(drawCalls>=250)throw new Error(slug+' exceeds the draw call budget');
  const bounds=new THREE.Box3().setFromObject(restored);
  summary.push({file:slug+'.json',drawCalls,meshInstances:instances,triangles:Math.round(triangles),colliders:restored.userData.colliders.length,bounds:{min:bounds.min.toArray(),max:bounds.max.toArray()},bytes:(await readFile(output)).byteLength});
}
await writeFile(path.join(OUT,'asset-summary.json'),JSON.stringify(summary,null,2));
console.log(JSON.stringify(summary,null,2));
