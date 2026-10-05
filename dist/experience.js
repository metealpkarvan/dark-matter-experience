import * as THREE from './vendor/three.module.js';

// Physical, walkable sets reconstructed from official Apple stills and crew interviews.
export const REALITIES = [
 {name:'Kül dünyası',episode:'S1 · E4',description:'Külün kapladığı sokaklar. Çöken binalar ve tanıdık bir şehrin harabeleri.',image:'world-ash.jpg',color:0x9e9a82},
 {name:'Donmuş dünya',episode:'S1 · E4',description:'Karın altında bir Chicago. Fırtınanın içinde Kutu, geri dönüş noktan.',image:'world-snow.jpg',color:0xb9cfda},
 {name:'Ütopik Chicago',episode:'S1 · E7',description:'Jason ve Amanda’nın karşılaştığı, mimarisi ve gökyüzü farklı bir Chicago.',image:'world-utopia.jpg',color:0xaed8d5},
 {name:'Su dünyası',episode:'S1 · E5',description:'Kapının hemen ardında su. Kutuya bağlı eşikte kalıp dalgaları izleyebilirsin.',image:'world-water.jpg',color:0x709fa8},
 {name:'Jason’ın Chicago’su',episode:'JASON DESSEN · EV',description:'Tanıdık bir sokak. Dessen ailesinin evi. Jason’ın dönmek istediği hayat.',image:'home-reference.jpg',color:0xc4b9a2}
];
const V=THREE.Vector3;
export class DarkMatterExperience {
 constructor({mount,onState=()=>{},onDoor=()=>{}}){
  this.onState=onState;this.onDoor=onDoor;this.mode='landing';this.active=true;this.paused=matchMedia('(prefers-reduced-motion:reduce)').matches;this.keys=new Set();this.position=new V(-4,2,8);this.yaw=0;this.pitch=0;this.selected=0;this.doors=[];this.blockers=[];this.worldScenes=new Map();this.worldGroups=new Map();this.distance=0;this.transitioning=false;this.last=0;this.moveTouch={x:0,y:0};this.flashlightOn=true;this.pointerDown=false;this.isLocked=false;this.lastDoor=-1;this.progress=0;
  try{
   this.renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));this.renderer.setSize(innerWidth,innerHeight);this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.3;this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;mount.append(this.renderer.domElement);this.canvas=this.renderer.domElement;
   this.camera=new THREE.PerspectiveCamera(60,innerWidth/innerHeight,.05,700);this.camera.rotation.order='YXZ';this.textureLoader=new THREE.TextureLoader();this.portalTextures=REALITIES.map((r,i)=>{const t=this.textureLoader.load("assets/"+r.image,loaded=>{const aspect=loaded.image.width/loaded.image.height;loaded.repeat.set(.523/aspect,1);loaded.offset.x=(1-loaded.repeat.x)*(i===0?.66:.5);});t.colorSpace=THREE.SRGBColorSpace;return t;});this.materials=this.makeMaterials();this.lab=this.makeLab();this.scene=this.lab;this.corridor=this.makeCorridor();this.addFlashlight();this.scene.add(this.camera);this.camera.position.copy(this.position);this.camera.lookAt(2,1.8,0);
   this.labOpen=false;this.makeCorridorPreview();this.makeEnvironment();this.bindControls();this.tick=this.tick.bind(this);requestAnimationFrame(this.tick);this.render();
  }catch(error){this.failed=true;console.error(error);this.onState({mode:'fallback',message:'Tarayıcı bu üç boyutlu deneyimi desteklemiyor.'});}
 }
 makeMaterials(){
  const n=256,data=new Uint8Array(n*n*4);for(let y=0;y<n;y++)for(let x=0;x<n;x++){const i=(y*n+x)*4;const cloud=Math.sin(x*.065)*Math.sin(y*.053)*24+Math.sin(x*.031+y*.019)*25+Math.random()*22;data[i]=data[i+1]=data[i+2]=Math.max(0,Math.min(255,116+cloud));data[i+3]=255;}const tex=new THREE.DataTexture(data,n,n);tex.wrapS=tex.wrapT=THREE.RepeatWrapping;tex.magFilter=THREE.LinearFilter;tex.minFilter=THREE.LinearMipmapLinearFilter;tex.generateMipmaps=true;tex.needsUpdate=true;
  const rough=tex.clone();rough.needsUpdate=true;rough.repeat.set(7,7);
  return {black:new THREE.MeshStandardMaterial({color:0x586768,map:tex,metalness:.75,roughness:.48,roughnessMap:tex,bumpMap:tex,bumpScale:.005}),rib:new THREE.MeshStandardMaterial({color:0x080d0e,metalness:.72,roughness:.35,bumpMap:tex,bumpScale:.014}),floor:new THREE.MeshStandardMaterial({color:0x455050,metalness:.24,roughness:.6,bumpMap:rough,bumpScale:.024}),concrete:new THREE.MeshStandardMaterial({color:0x343e3f,roughness:.95,bumpMap:rough,bumpScale:.12}),silver:new THREE.MeshStandardMaterial({color:0x99a6a6,metalness:.86,roughness:.32}),yellow:new THREE.MeshStandardMaterial({color:0x8f6624,metalness:.45,roughness:.48}),rubber:new THREE.MeshStandardMaterial({color:0x070c0c,roughness:.85}),white:new THREE.MeshBasicMaterial({color:0xc8e8e8}),green:new THREE.MeshBasicMaterial({color:0x647e78})};
 }
 box(parent,w,h,d,x,y,z,mat,shadow=true){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);m.castShadow=shadow;m.receiveShadow=true;parent.add(m);return m;}
 cylinder(parent,r,h,x,y,z,mat){const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,16),mat);m.position.set(x,y,z);m.castShadow=true;parent.add(m);return m;}
 makeEnvironment(){const env=new THREE.Scene();env.background=new THREE.Color(0x162426);for(const [x,y,z,w,h] of [[-5,3,4,2,4],[6,4,-2,3,3],[0,7,0,9,2]]){const p=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({color:0xa6d1cb,side:THREE.DoubleSide}));p.position.set(x,y,z);p.lookAt(0,1,0);env.add(p);}const gen=new THREE.PMREMGenerator(this.renderer);this.envMap=gen.fromScene(env,.015).texture;this.lab.environment=this.envMap;this.lab.environmentIntensity=.8;this.corridor.environment=this.envMap;this.corridor.environmentIntensity=.24;gen.dispose();}
 makeBox(parent,x=0,z=0,{open=false}={}){
  const group=new THREE.Group();group.position.set(x,0,z);parent.add(group);const {black,rib}=this.materials;
  this.box(group,4.05,.20,4.05,0,.1,0,rib);this.box(group,3.78,3.58,.18,0,1.99,-1.8,black);this.box(group,.18,3.58,3.6,-1.8,1.99,0,black);this.box(group,.18,3.58,3.6,1.8,1.99,0,black);this.box(group,3.80,.20,3.80,0,3.85,0,rib);this.box(group,3.28,.14,3.28,0,4.01,0,black);
  const crown=new THREE.Mesh(new THREE.CylinderGeometry(1.64*Math.SQRT2,1.9*Math.SQRT2,.19,4,1),black);crown.rotation.y=Math.PI/4;crown.position.y=3.97;crown.castShadow=true;group.add(crown);
  for(const side of [-1,1]){for(const depth of [-1,1])this.box(group,.55,3.82,.38,side*1.78,2.01,depth*1.85,rib);this.box(group,1.15,3.58,.17,side*1.25,1.99,1.80,black);}
  this.box(group,1.4,.15,.33,0,2.64,1.90,rib);this.box(group,1.8,1.05,.17,0,3.32,1.8,black);this.box(group,.17,2.39,.3,-.65,1.39,1.9,rib);this.box(group,.17,2.39,.3,.65,1.39,1.9,rib);
  const hinge=new THREE.Group();hinge.position.set(-.57,.22,1.99);group.add(hinge);const slab=this.box(hinge,1.14,2.20,.16,.57,1.1,0,black);this.box(hinge,.045,.23,.08,.94,1.1,.13,this.materials.silver);hinge.rotation.y=open?-1.35:0;
  const interior=new THREE.MeshStandardMaterial({color:0x223332,roughness:.62,metalness:.25});this.box(group,3.45,.09,3.45,0,.23,0,interior);
  for(const side of [-1,1])this.box(group,.02,3.0,3.0,side*1.52,1.72,0,interior);
  group.userData={hinge,slab};return group;
 }
 makeLab(){
  const s=new THREE.Scene();s.background=new THREE.Color(0x061012);s.fog=new THREE.FogExp2(0x071316,.023);const m=this.materials;
  s.add(new THREE.HemisphereLight(0x89bab8,0x0c1518,1.25));const fill=new THREE.DirectionalLight(0xa7ced1,2);fill.position.set(-8,9,5);s.add(fill);
  this.box(s,40,.15,36,0,-.08,0,m.floor);this.box(s,40,10,.4,0,5,-13,m.concrete);this.box(s,.4,10,30,-9,5,0,m.concrete);this.box(s,.4,10,30,9,5,0,m.concrete);this.box(s,40,.3,36,0,8.7,0,m.rib);
  for(const x of [-8.7,8.7]){this.box(s,.5,9,.5,x,4.5,-7,m.rib);this.box(s,.5,9,.5,x,4.5,8,m.rib);this.box(s,.28,.45,25,x,8.2,0,m.rib)}
  for(let z=-9;z<13;z+=7)this.box(s,18,.28,.34,0,8.15,z,m.rib);
  this.labBox=this.makeBox(s,2,0);this.labDoor=this.labBox.userData;
  // Reflective working lights and movable set equipment visible in Apple's laboratory still.
  const lights=[[-2.4,2.1,1.5],[6.5,1.65,1.2],[3.5,2.5,-5.4]];
  for(const [x,y,z] of lights){this.cylinder(s,.035,y,x,y/2,z,m.silver);for(let i=0;i<3;i++){const leg=this.box(s,.035,.035,.85,x,.10,z,m.silver);leg.rotation.y=i*Math.PI*2/3;leg.position.x+=Math.sin(leg.rotation.y)*.28;leg.position.z+=Math.cos(leg.rotation.y)*.28;}const panel=this.box(s,.85,.34,.12,x,y,z,m.rib);this.box(s,.77,.26,.035,x,y,z+.08,m.white,false);const light=new THREE.PointLight(0xa3e1e9,33,12,2);light.position.set(x,y,z+.25);s.add(light);}
  const main=new THREE.SpotLight(0xb5d9d7,145,22,.7,.8,1.3);main.position.set(-4,5,4);main.target.position.set(2,1.5,0);main.castShadow=true;main.shadow.mapSize.set(1024,1024);s.add(main,main.target);
  const rim=new THREE.PointLight(0x89b5bb,40,15,1.7);rim.position.set(6,4,-3);s.add(rim);
  // Silver wheeled cylinder at left, amber trolley at right.
  this.cylinder(s,.32,1.20,-1.4,.80,2,m.silver);this.cylinder(s,.11,.16,-1.4,1.48,2,m.silver);this.box(s,.75,.13,.75,-1.4,.15,2,m.rib);this.box(s,.33,.10,.20,-1.4,1.61,2,m.yellow);
  this.box(s,1.0,1.5,.9,5.2,.88,.8,m.silver);this.box(s,.08,1.5,.94,5.72,.88,.8,m.yellow);this.box(s,.83,1.25,.055,5.2,.91,1.28,new THREE.MeshStandardMaterial({color:0x324850,metalness:.4,roughness:.25}));
  for(const x of [-1.65,-1.15,4.83,5.57])for(const z of [1.72,2.28]){const wheel=new THREE.Mesh(new THREE.TorusGeometry(.085,.03,6,12),m.rubber);wheel.position.set(x,.075,z);s.add(wheel);}
  // Control desks at the edge of the laboratory; their illuminated screens stay secondary.
  for(let x=-7;x<=-4;x+=3){this.box(s,2.0,.15,.95,x,.94,-4,m.silver);this.box(s,.08,.9,.08,x-.8,.45,-4,m.rib);this.box(s,.08,.9,.08,x+.8,.45,-4,m.rib);this.box(s,.9,.65,.08,x,1.48,-4.25,m.rib);this.box(s,.81,.56,.014,x,1.48,-4.19,new THREE.MeshBasicMaterial({color:0x426a6d}));}
  const control=new THREE.Group();s.add(control);this.box(control,13,3.4,2.8,0,1.7,-10.8,m.concrete);this.box(control,2.3,2.8,.035,0,1.4,-9.38,m.rubber);this.box(control,1.0,2.4,.035,-4.8,1.2,-9.38,new THREE.MeshStandardMaterial({color:0x314d5d,roughness:.7}));for(let y=.8;y<3.4;y+=.8)this.box(control,13,.025,.02,0,y,-9.36,m.rib,false);
  this.box(control,13,.28,3,0,3.4,-10.6,m.rib);this.box(control,13,.5,3,0,6.0,-10.6,m.silver);this.box(control,13,.46,.15,0,3.8,-9.1,m.silver);this.box(control,13,.085,.17,0,3.49,-9.0,m.yellow);
  const glass=new THREE.MeshPhysicalMaterial({color:0x698380,transparent:true,opacity:.35,roughness:.18,metalness:.08,side:THREE.DoubleSide,depthWrite:false});
  for(let x=-5.7;x<=5.8;x+=1.6){const pane=this.box(control,1.47,1.72,.05,x,4.85,-9.25,glass,false);pane.rotation.x=-.13;this.box(control,.065,2.03,.11,x-.78,4.8,-9.2,m.rib);this.box(control,1.3,.12,.7,x,4.24,-10.25,m.silver);this.box(control,.66,.43,.06,x,4.60,-10.46,m.rib);this.box(control,.59,.36,.01,x,4.60,-10.42,new THREE.MeshBasicMaterial({color:0x507977}));}
  for(let k=0;k<12;k++){this.box(control,.24,.025,13,0,3.61+k*.033,-9.08,m.silver,false).rotation.y=Math.PI/2;}
  for(let i=0;i<14;i++){this.box(s,1.45,.12,.36,7.5,.24+i*.24,-6.2-i*.35,m.silver);this.box(s,.045,1.2,.045,6.82,.85+i*.24,-6.2-i*.35,m.silver);}
  const rails=this.box(s,.06,.06,5.2,6.82,2.6,-8.3,m.silver);rails.rotation.x=-.6;
  for(let x=-5.5;x<6;x+=1.6){this.box(control,.48,.09,.5,x,3.92,-11.05,m.rubber);this.box(control,.48,.48,.08,x,4.2,-11.25,m.rubber);this.cylinder(control,.055,.35,x,3.68,-11.05,m.silver);}
  for(let y=1.5;y<8.7;y+=1.5)for(const side of [-1,1])this.box(s,.02,.022,26,side*8.78,y,0,m.rib,false);
  for(const x of [-7.9,7.9])this.cylinder(s,.15,27,x,7.8,0,m.silver).rotation.x=Math.PI/2;
  const cableMaterial=new THREE.LineBasicMaterial({color:0x071011});for(let k=0;k<5;k++){const pts=[];for(let j=0;j<40;j++)pts.push(new THREE.Vector3(-2.5+j*.2,.035,3.0+Math.sin(j*.22+k)*.25+k*.13));const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),cableMaterial);s.add(line);}
  const controlLight=new THREE.PointLight(0x8ab5ad,24,15,1.7);controlLight.position.set(0,5.2,-10);s.add(controlLight);
  return s;
 }
 makeCorridor(){
  const s=new THREE.Scene();s.background=new THREE.Color(0x060c0b);s.fog=new THREE.FogExp2(0x07110f,.048);const m=this.materials;
  s.add(new THREE.HemisphereLight(0x7faba0,0x030504,.60));const top=new THREE.DirectionalLight(0x8aa899,1.0);top.position.set(0,9,4);s.add(top);
  this.box(s,3.5,.13,165,0,-.065,-76,m.floor);this.box(s,3.5,.18,165,0,3.28,-76,m.rib);
  for(let i=0;i<43;i++){const z=-1.6-i*3.65;
   for(const side of [-1,1]){
    this.box(s,.25,3.25,.22,side*1.61,1.64,z+1.74,m.rib);this.box(s,.18,2.98,1.13,side*1.72,1.58,z-1.19,m.black);this.box(s,.18,2.98,1.13,side*1.72,1.58,z+1.19,m.black);this.box(s,.18,.87,1.27,side*1.72,2.82,z,m.black);this.box(s,.18,.14,1.27,side*1.72,.08,z,m.rib);
    const door={side,z,index:i*2+(side===1?1:0),world:[0,1,3,2,4][(i*2+(side===1?1:0))%5],open:false,fraction:0};
    const hinge=new THREE.Group();hinge.position.set(side*1.61,.14,z-.57);s.add(hinge);door.hinge=hinge;door.mesh=this.box(hinge,.13,2.18,1.14,0,1.09,.57,m.black);this.box(hinge,.06,.22,.045,-side*.11,1.1,.92,m.silver);
    this.box(s,.27,2.39,.075,side*1.6,1.29,z-.65,m.rib);this.box(s,.27,2.39,.075,side*1.6,1.29,z+.65,m.rib);this.box(s,.27,.15,1.38,side*1.6,2.44,z,m.rib);
    if(i<43){const plane=new THREE.Mesh(new THREE.PlaneGeometry(1.14,2.18),new THREE.MeshBasicMaterial({map:this.portalTextures[door.world],side:THREE.DoubleSide}));plane.position.set(side*1.89,1.23,z);plane.rotation.y=side===-1?Math.PI/2:-Math.PI/2;plane.visible=false;s.add(plane);door.preview=plane;this.doors.push(door);}
   }
   this.box(s,3.2,.22,.28,0,3.08,z+1.75,m.rib);this.box(s,2.7,.065,2.95,0,3.12,z,m.black);for(const side of [-1,1]){const soffit=this.box(s,.29,.12,3.24,side*1.45,3.01,z,m.rib);soffit.rotation.z=side*.28;}this.box(s,3.1,.02,.025,0,.01,z+1.75,m.rib,false);
  }
  this.batchCorridor(s);return s;
 }
 batchCorridor(scene){
  const hinges=new Set(this.doors.map(d=>d.hinge)),batches=new Map(),meshes=[];
  scene.updateMatrixWorld(true);scene.traverse(m=>{if(!m.isMesh||m.geometry.type!=='BoxGeometry')return;let p=m.parent;while(p&&p!==scene){if(hinges.has(p))return;p=p.parent;}const mat=m.material;if(!batches.has(mat))batches.set(mat,[]);batches.get(mat).push(m);meshes.push(m);});
  const geometry=new THREE.BoxGeometry(1,1,1);for(const [mat,list] of batches){const batch=new THREE.InstancedMesh(geometry,mat,list.length);list.forEach((m,i)=>{const p=m.geometry.parameters;const matrix=m.matrixWorld.clone().multiply(new THREE.Matrix4().makeScale(p.width,p.height,p.depth));batch.setMatrixAt(i,matrix);});batch.receiveShadow=true;batch.computeBoundingSphere();scene.add(batch);}for(const m of meshes){m.parent.remove(m);m.geometry.dispose();}
 }
 detailWorldMaterials(group){
  if(!this.surfaceTextures){const canvas=document.createElement('canvas');canvas.width=canvas.height=512;const ctx=canvas.getContext('2d');ctx.fillStyle='#b5b5b5';ctx.fillRect(0,0,512,512);for(let j=0;j<21000;j++){const shade=90+Math.random()*120;ctx.fillStyle=`rgba(${shade},${shade},${shade},${Math.random()*.32})`;ctx.fillRect(Math.random()*512,Math.random()*512,1+Math.random()*5,1+Math.random()*5);}for(let j=0;j<50;j++){ctx.fillStyle='rgba(35,35,35,.055)';ctx.beginPath();ctx.ellipse(Math.random()*512,Math.random()*512,Math.random()*60,Math.random()*25,0,0,Math.PI*2);ctx.fill();}const stone=new THREE.CanvasTexture(canvas);stone.wrapS=stone.wrapT=THREE.RepeatWrapping;stone.repeat.set(3,3);const b=document.createElement('canvas');b.width=b.height=512;const bc=b.getContext('2d');bc.drawImage(canvas,0,0);bc.fillStyle='#666';for(let y=0;y<512;y+=32){bc.fillRect(0,y,512,2);for(let x=(y/32%2)*32;x<512;x+=64)bc.fillRect(x,y,2,32);}const brick=new THREE.CanvasTexture(b);brick.wrapS=brick.wrapT=THREE.RepeatWrapping;brick.repeat.set(4,4);this.surfaceTextures={stone,brick};}
  const seen=new Set();group.traverse(o=>{if(!o.isMesh)return;const m=o.material;if(seen.has(m))return;seen.add(m);if(/stone|masonry|roadway|steel|brick|concrete/i.test(m.name)){m.map=/brick/i.test(m.name)?this.surfaceTextures.brick:this.surfaceTextures.stone;m.bumpMap=m.map;m.bumpScale=.022;m.needsUpdate=true;}});
 }
 makeSky(scene,i){const c=document.createElement('canvas');c.width=2048;c.height=1024;const ctx=c.getContext('2d');const gradient=ctx.createLinearGradient(0,0,0,1024);const skies=[['#536369','#bec2c1','#747b7d'],['#668da4','#d6e3e9','#a5bfcb'],['#307dba','#c9ebed','#91b8be'],['#4b636e','#c5d2d5','#7d949e'],['#5b8faa','#d4dcd3','#9baba9']][i];gradient.addColorStop(0,skies[0]);gradient.addColorStop(.54,skies[1]);gradient.addColorStop(1,skies[2]);ctx.fillStyle=gradient;ctx.fillRect(0,0,2048,1024);ctx.filter='blur(22px)';for(let j=0;j<90;j++){ctx.fillStyle=i===2?'rgba(255,255,255,.15)':'rgba(225,229,229,.11)';ctx.beginPath();ctx.ellipse(Math.random()*2048,100+Math.random()*400,80+Math.random()*210,6+Math.random()*30,0,0,Math.PI*2);ctx.fill();}const t=new THREE.CanvasTexture(c);t.mapping=THREE.EquirectangularReflectionMapping;t.colorSpace=THREE.SRGBColorSpace;scene.background=t;scene.environment=t;scene.environmentIntensity=i===4?.3:.6;}
 makeCorridorPreview(){this.corridorTarget=new THREE.WebGLRenderTarget(576,1024);this.portalCamera=new THREE.PerspectiveCamera(60,1.10/2.18,.05,200);this.portalCamera.position.set(0,1.67,2.6);this.portalCamera.rotation.order='YXZ';this.labPortal=new THREE.Mesh(new THREE.PlaneGeometry(1.10,2.18),new THREE.MeshBasicMaterial({map:this.corridorTarget.texture,toneMapped:false}));this.labPortal.position.set(2,1.32,1.50);this.labPortal.visible=false;this.lab.add(this.labPortal);}
 renderCorridorPreview(){if(!this.labPortal)return;this.labPortal.visible=this.labOpen;if(this.mode==='lab'&&this.labOpen){this.renderer.setRenderTarget(this.corridorTarget);this.renderer.render(this.corridor,this.portalCamera);this.renderer.setRenderTarget(null);}}
 addFlashlight(){this.flashlight=new THREE.SpotLight(0xd0ded3,26,26,.49,.62,1.35);this.flashlight.position.set(.24,-.23,-.1);this.flashlightTarget=new THREE.Object3D();this.flashlightTarget.position.set(0,0,-7);this.camera.add(this.flashlight,this.flashlightTarget);this.flashlight.target=this.flashlightTarget;}
 activateScene(scene){this.scene=scene;scene.add(this.camera);}
 async makeWorld(i){
  if(this.worldScenes.has(i))return this.worldScenes.get(i);const s=new THREE.Scene();const colors=[0x92999b,0xb5c8d4,0xa9d8e4,0x8b9fa8,0xaec5cd];s.background=new THREE.Color(colors[i]);s.fog=new THREE.FogExp2(colors[i],[.006,.006,.0028,.008,.002][i]);s.add(new THREE.HemisphereLight([0xc6c9cf,0xe3edf4,0xe1f7e9,0xc3d7db,0xe4dcc5][i],0x455453,[1.2,2.0,1.8,1.4,.85][i]));const sun=new THREE.DirectionalLight([0xc7c6c2,0xd1e4e7,0xfff3d8,0xbbced3,0xffe5bb][i],i===2?3:1.6);sun.position.set(-20,40,20);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-25;sun.shadow.camera.right=25;sun.shadow.camera.top=25;sun.shadow.camera.bottom=-25;s.add(sun);
  const ground=new THREE.MeshStandardMaterial({color:[0x79796b,0xcadbe0,0x849993,0x496b75,0x737877][i],roughness:i===3?.28:.9,metalness:i===3?.25:.03});this.box(s,300,.16,300,0,-.12,-30,ground);
  s.environment=this.envMap;s.environmentIntensity=.55;this.worldBox=this.makeBox(s,0,5,{open:true});this.worldBox.rotation.y=Math.PI;s.userData.box=this.worldBox;this.box(s,1.7,.10,3.5,0,.04,1.55,this.materials.rib); // Walkable threshold connects the return door and the outside.
  if(i<3){try{const response=await fetch(['assets/ash-city.json','assets/frozen-city.json','assets/utopia-city.json'][i]);if(response.ok){const group=new THREE.ObjectLoader().parse(await response.json());this.detailWorldMaterials(group);s.add(group);this.worldGroups.set(i,group);s.userData.colliders=group.userData.colliders||[];}}catch{}}
  else if(i===4){const response=await fetch('assets/home-world.json');if(!response.ok)throw new Error('Home world asset unavailable');const group=new THREE.ObjectLoader().parse(await response.json());this.detailWorldMaterials(group);s.add(group);this.worldGroups.set(i,group);s.userData.colliders=group.userData.colliders||[];s.userData.destinations=group.userData.destinations||[];for(const [x,y,z] of [[-4,2.3,-22],[3.5,2.6,-31],[-2,2.4,-17]]){const lamp=new THREE.PointLight(0xffd38d,5,11,1.7);lamp.position.set(x,y,z);s.add(lamp);}for(const [x,z] of [[-3,-20],[2,-31]]){const key=new THREE.SpotLight(0xffd69c,35,15,.92,.82,1.65);key.position.set(x,3.3,z);key.target.position.set(x,.1,z-1);key.castShadow=true;key.shadow.mapSize.set(1024,1024);key.shadow.bias=-.0004;key.shadow.normalBias=.03;s.add(key,key.target);}}
  else await this.makeWater(s);
  this.makeSky(s,i);this.addWeather(s,i);this.worldScenes.set(i,s);return s;
 }
 async makeWater(s){
  const geometry=new THREE.PlaneGeometry(270,270,150,150);geometry.rotateX(-Math.PI/2);const ocean=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({color:0x344f5b,metalness:.3,roughness:.3,transparent:true,opacity:.96}));ocean.position.set(0,-.08,-40);s.add(ocean);s.userData.ocean=ocean;
  ocean.material.onBeforeCompile=shader=>{shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vWaterPoint;').replace('#include <begin_vertex>','#include <begin_vertex>\nvWaterPoint = position;');shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vWaterPoint;').replace('#include <color_fragment>','#include <color_fragment>\nfloat crest = smoothstep(0.47,0.64,vWaterPoint.y); float streak = 0.5 + 0.5*sin(vWaterPoint.x*2.4 + vWaterPoint.z*1.8); diffuseColor.rgb = mix(diffuseColor.rgb,vec3(0.66,0.77,0.78),crest*streak*0.7);');};

  const skyline=new THREE.Group();skyline.position.set(0,-12,12);skyline.scale.set(.72,.72,.72);s.add(skyline);
  let city=this.worldGroups.get(0);if(!city){const response=await fetch('assets/ash-city.json');if(response.ok)city=new THREE.ObjectLoader().parse(await response.json());}
  if(city)city.traverse(o=>{if(o.isMesh&&/skyline|distant|stepped Chicago|lakefront|twin skyline/.test(o.name)){const mesh=o.clone();mesh.castShadow=false;skyline.add(mesh);}});
  this.box(s,3.8,.19,3.8,0,-.04,5,this.materials.rib);
 }
 addWeather(s,i){
  const count=i===4?80:i===2?180:850;const data=new Float32Array(count*3);for(let k=0;k<count;k++){data[k*3]=(Math.random()-.5)*65;data[k*3+1]=Math.random()*18;data[k*3+2]=10-Math.random()*75;}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(data,3));const points=new THREE.Points(g,new THREE.PointsMaterial({color:[0xc7c9b7,0xe5f5fa,0xf9dca1,0x9baab0,0xf5daaa][i],size:i===1?.09:.034,transparent:true,opacity:i===2?.25:.65,depthWrite:false}));s.add(points);s.userData.weather=points;s.userData.world=i;
 }
 nearDoor(){
  if(this.mode==='lab'){const d=Math.hypot(this.position.x-2,this.position.z-2);return d<2.45?{lab:true,distance:d}:null;}
  if(this.mode==='world'){const d=Math.hypot(this.position.x,this.position.z-3);return d<3.4?{return:true,distance:d}:null;}
  if(this.mode!=='corridor')return null;let nearest=null,min=2.1;for(const d of this.doors){const dist=Math.hypot(this.position.x-d.side*1.62,this.position.z-d.z);if(dist<min){nearest=d;min=dist;}}return nearest?{...nearest,distance:min,ref:nearest}:null;
 }
 interact(){if(this.transitioning)return;const near=this.nearDoor();if(!near)return;if(near.lab){if(!this.labOpen){this.labOpen=true;this.notify();}else this.enterCorridor();return;}if(near.return){this.returnToCorridor();return;}const door=near.ref;this.selected=door.world;if(!door.open){door.open=true;this.currentDoor=door;this.notify({door:door.index+1,action:'Kapıdan geç',doorOpen:true});}else return this.crossDoor(door);}
 enterCorridor(){this.mode='corridor';this.activateScene(this.corridor);this.position.set(0,1.67,2.6);this.yaw=0;this.pitch=0;this.notify();}
 goLab(){this.mode='lab';this.activateScene(this.lab);this.position.set(2,1.67,2.55);this.yaw=Math.PI;this.pitch=0;this.notify();}
 visit(i){if(!Number.isInteger(i)||i<0||i>=REALITIES.length)return;if(this.mode!=='corridor')this.enterCorridor();const door=this.doors.find(d=>d.world===i);this.selected=i;this.position.set(door.side*.18,1.67,door.z);this.yaw=-door.side*Math.PI/2;this.pitch=0;this.currentDoor=door;this.notify({door:door.index+1});}
 async crossDoor(door){if(this.transitioning)return;this.transitioning=true;document.querySelector('#transition').style.opacity='1';this.unlock();const world=await this.makeWorld(door.world);await new Promise(resolve=>setTimeout(resolve,240));this.mode='world';this.selected=door.world;this.currentDoor=door;this.activateScene(world);this.position.set(0,1.67,2.25);this.yaw=0;this.pitch=0;this.transitioning=false;this.notify({door:door.index+1});document.querySelector('#transition').style.opacity='0';}
 returnToCorridor(){if(this.mode!=='world')return;this.mode='corridor';this.activateScene(this.corridor);const door=this.currentDoor||this.doors[0];this.position.set(door.side*.30,1.67,door.z);this.yaw=door.side*Math.PI/2;this.pitch=0;this.notify();}
 reference(){return this.mode==='world'?REALITIES[this.selected]:null;}
 toggleFlashlight(){this.flashlightOn=!this.flashlightOn;this.flashlight.visible=this.flashlightOn;this.notify();}
 step(forward=0,sideways=0){if(this.mode==='landing'||!this.active||this.transitioning)return;const old=this.moveTouch;this.moveTouch={x:sideways,y:forward};for(let i=0;i<8;i++)this.updateMovement(.024);this.moveTouch=old;this.render();}
 bindControls(){
  addEventListener('resize',()=>{this.camera.aspect=innerWidth/innerHeight;this.camera.updateProjectionMatrix();this.renderer.setSize(innerWidth,innerHeight);this.render()});
  addEventListener('blur',()=>this.unlock());document.addEventListener('visibilitychange',()=>{if(document.hidden)this.unlock()});
  const area=document.querySelector('#experience');
  area.addEventListener('pointerdown',e=>{if(!this.active||e.target.closest('button,a,input,label,.world-picker,.touch-controls'))return;if(this.mode==='landing')this.tour?.start();this.pointerDown=true;document.body.classList.add('dragging');this.pointerStart={x:e.clientX,y:e.clientY};this.pointerOrigin={...this.pointerStart};this.pointerGesture=null;area.setPointerCapture(e.pointerId);});
  area.addEventListener('pointermove',e=>{if(this.mode==='landing'){this.hover={x:(e.clientX/innerWidth-.5),y:(e.clientY/innerHeight-.5)};return;}if(!this.active)return;if(this.isLocked){this.yaw-=e.movementX*.0022;this.pitch-=e.movementY*.0022;}else if(this.pointerDown){const dx=e.clientX-this.pointerStart.x,dy=e.clientY-this.pointerStart.y;if(this.tour?.active){if(!this.pointerGesture){const gx=e.clientX-this.pointerOrigin.x,gy=e.clientY-this.pointerOrigin.y;if(Math.hypot(gx,gy)<5)return;this.pointerGesture=Math.abs(gy)>Math.abs(gx)*1.2?'route':'look';}if(this.pointerGesture==='route')this.tour.scroll(-dy*3.2);else this.tour.look(dx,dy);}else{this.yaw-=dx*.005;this.pitch-=dy*.005;}this.pointerStart={x:e.clientX,y:e.clientY};}this.pitch=THREE.MathUtils.clamp(this.pitch,-1.25,1.25);});
  const release=()=>{this.pointerDown=false;document.body.classList.remove('dragging')};area.addEventListener('pointerup',release);area.addEventListener('pointercancel',release);
  document.addEventListener('pointerlockchange',()=>{this.isLocked=document.pointerLockElement===area;this.notify();});

 }
 unlock(){document.exitPointerLock?.();this.keys.clear();this.moveTouch={x:0,y:0};}
 notify(extra={}){this.lastDoor=-2;this.onState({mode:this.mode,world:this.selected,flashlight:this.flashlightOn,locked:this.isLocked,...extra});this.onDoor(this.nearDoor());}
 start(){this.mode='lab';this.activateScene(this.lab);this.position.set(2,1.67,7);this.yaw=0;this.pitch=0;this.notify();}
 home(){this.mode='landing';this.activateScene(this.lab);this.position.set(-4,2,8);this.unlock();this.notify();}
 setActive(v){this.active=v;if(!v)this.unlock();}
 setPaused(v){this.paused=v;this.render();}
 render(){if(this.renderer)this.renderer.render(this.scene,this.camera);}
 tick(t){requestAnimationFrame(this.tick);if(!this.active||document.hidden){this.last=t;return;}const dt=Math.min((t-this.last)/1000,.045);this.last=t;
  if(this.mode==='landing'){const hover=this.hover||{x:0,y:0};this.camera.position.set(-4+(!this.paused?hover.x*.18:0),2.4+(!this.paused?hover.y*.1:0),8.6);this.camera.lookAt(2,1.7,0);}else{if(this.tour?.active)this.tour.tick(dt,t);else this.updateMovement(dt);this.camera.position.copy(this.position);this.camera.rotation.set(this.pitch,this.yaw,0,'YXZ');if(!this.paused){const walking=Math.hypot(this.moveTouch.x,this.moveTouch.y)>0||['w','a','s','d','arrowup','arrowdown'].some(k=>this.keys.has(k));if(walking)this.camera.position.y+=Math.sin(t*.009)*.025;}}
  if(this.labDoor?.hinge)this.labDoor.hinge.rotation.y=THREE.MathUtils.lerp(this.labDoor.hinge.rotation.y,this.labOpen?-1.4:0,.08);for(const d of this.doors){d.fraction=THREE.MathUtils.lerp(d.fraction,d.open?1:0,.085);d.hinge.rotation.y=d.side*d.fraction*1.42;if(d.preview)d.preview.visible=d.fraction>.025;}const near=this.nearDoor();const key=near?.lab?'lab':near?.return?'return':near?.index??-1;if(key!==this.lastDoor){this.lastDoor=key;this.onDoor(near);}if(this.scene.userData.weather&&!this.paused){const points=this.scene.userData.weather;const a=points.geometry.attributes.position.array;for(let k=0;k<a.length;k+=3){a[k+1]-=dt*(this.selected===1?1.2:.3);a[k]+=(this.selected===1?dt*.7:dt*.02);if(a[k+1]<0)a[k+1]=18;}points.geometry.attributes.position.needsUpdate=true;}if(this.scene.userData.ocean&&!this.paused){const a=this.scene.userData.ocean.geometry.attributes.position.array;for(let k=0;k<a.length;k+=3)a[k+1]=Math.sin(a[k]*.21+t*.0011)*.42+Math.cos(a[k+2]*.28+t*.0014)*.28;this.scene.userData.ocean.geometry.attributes.position.needsUpdate=true;if(Math.floor(t/90)!==this.waterNormalFrame){this.waterNormalFrame=Math.floor(t/90);this.scene.userData.ocean.geometry.computeVertexNormals();}}this.renderCorridorPreview();this.renderer.render(this.scene,this.camera);
 }
 updateMovement(dt){
  if(this.transitioning)return;let forward=(this.keys.has('w')||this.keys.has('arrowup')?1:0)-(this.keys.has('s')||this.keys.has('arrowdown')?1:0)+this.moveTouch.y;let sideways=(this.keys.has('d')?1:0)-(this.keys.has('a')?1:0)+this.moveTouch.x;if(this.keys.has('arrowleft'))this.yaw+=dt*1.4;if(this.keys.has('arrowright'))this.yaw-=dt*1.4;const norm=Math.max(1,Math.hypot(forward,sideways)),speed=(this.keys.has('shift')?3.8:2.15)*dt;const next=this.position.clone();next.x+=(-Math.sin(this.yaw)*forward+Math.cos(this.yaw)*sideways)/norm*speed;next.z+=(-Math.cos(this.yaw)*forward-Math.sin(this.yaw)*sideways)/norm*speed;
  if(this.mode==='lab'){next.x=THREE.MathUtils.clamp(next.x,-12,12);next.z=THREE.MathUtils.clamp(next.z,-10,12);const nearBox=Math.abs(next.x-2)<2.15&&Math.abs(next.z)<2.25;if(nearBox){if(this.labOpen&&Math.abs(next.x-2)<.51&&next.z>1.55){if(next.z<1.8){this.enterCorridor();return;}}else return;}}
  if(this.mode==='corridor'){
   if(next.z>3.8){this.goLab();return;}if(next.z < -148){this.position.z=-2;next.z=-2;}
   if(Math.abs(next.x)>1.29){const door=this.doors.find(d=>d.open&&d.side===Math.sign(next.x)&&Math.abs(next.z-d.z)<.43);if(!door){next.x=THREE.MathUtils.clamp(next.x,-1.29,1.29);}else if(Math.abs(next.x)>1.83){this.crossDoor(door);return;}}
  }
  if(this.mode==='world'){
   next.x=THREE.MathUtils.clamp(next.x,this.selected===3?-.66:-15,this.selected===3?.66:15);next.z=THREE.MathUtils.clamp(next.z,this.selected===3?-.3:-30,2.7);
   if(Math.abs(next.x)<.6&&next.z>2.62&&forward!==0){this.returnToCorridor();return;}
   const colliders=this.scene.userData.colliders||[];if(colliders.some(c=>next.x>c.min[0]-.25&&next.x<c.max[0]+.25&&next.z>c.min[2]-.25&&next.z<c.max[2]+.25&&c.max[1]>.3))return;
  }
  this.distance+=next.distanceTo(this.position);this.position.copy(next);
  const meter=document.querySelector('#walk-distance');if(meter&&Math.floor(this.distance)!==this.progress){this.progress=Math.floor(this.distance);meter.textContent=this.progress+' m';meter.dataset.x=this.position.x.toFixed(2);meter.dataset.z=this.position.z.toFixed(2);}
 }
}
