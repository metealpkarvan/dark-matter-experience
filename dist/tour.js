// Scroll owns the camera path. Drag changes the bearing, held until the next scroll.
export const TOUR_ORDER=[0,1,3,2,4];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const mix=(a,b,t)=>a+(b-a)*t;
const ease=t=>t*t*(3-2*t);
export class MouseTour {
 constructor(journey,onProgress=()=>{}){
  this.journey=journey;journey.tour=this;this.onProgress=onProgress;this.active=false;this.current=0;this.target=0;this.lookYaw=0;this.lookPitch=0;this.returnLook=false;this.loaded=new Map();this.loading=new Map();this.lastLocation='';this.lastChapter=-1;this.jumpRequest=0;
  let cursor=1;this.chapters=TOUR_ORDER.map(world=>{const chapter={world,start:cursor,span:world===4?4.2:2.5};cursor+=chapter.span;return chapter;});this.total=cursor;
  const area=document.querySelector('#experience');
  area.addEventListener('wheel',e=>{if(!journey.active||e.ctrlKey||document.querySelector('dialog[open]'))return;e.preventDefault();this.scroll(e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?innerHeight:1));},{passive:false});
 }
 start(){this.active=true;this.journey.start();this.preload(0);this.onProgress(this.state());}
 home(){this.jumpRequest++;this.journey.renderer.toneMappingExposure=1.3;this.active=false;this.current=this.target=0;this.lookYaw=this.lookPitch=0;this.journey.home();}
 scroll(pixels){this.jumpRequest++;document.querySelector("#world-picker").hidden=true;document.querySelector("#door-menu").setAttribute("aria-expanded","false");if(!this.active)this.start();if(this.flight)this.target=this.current;this.flight=null;this.returnLook=true;document.querySelector("#transition").style.opacity="0";this.target=clamp(this.target+pixels*.0025,0,this.total-.02);this.onProgress(this.state());}
 look(dx,dy){this.returnLook=false;this.lookYaw=clamp(this.lookYaw-dx*.0042,-1.5,1.5);this.lookPitch=clamp(this.lookPitch-dy*.0027,-.6,.6);}
 chapterAt(progress=this.current){return this.chapters.findIndex(c=>progress>=c.start&&progress<c.start+c.span);}
 state(){return {progress:this.current/this.total,target:this.target/this.total,chapter:this.chapterAt(),world:this.journey.selected,location:this.journey.mode,stop:this.currentStop};}
 async preload(world){if(this.loaded.has(world))return this.loaded.get(world);if(this.loading.has(world))return this.loading.get(world);const promise=this.journey.makeWorld(world).then(scene=>{this.loaded.set(world,scene);return scene;}).catch(error=>{console.error(error);document.querySelector('#announcement').textContent='Bu dünya yüklenemedi. Yeniden deneyebilirsin.';this.loading.delete(world);return null;});this.loading.set(world,promise);return promise;}
 async jump(world){const token=++this.jumpRequest;if(!this.active)this.start();const chapter=this.chapters.find(c=>c.world===world);if(!chapter)return;await this.preload(world);if(token!==this.jumpRequest)return this.state();const to=chapter.start+.72;this.target=to;this.returnLook=true;this.flight={from:this.current,to,at:performance.now(),duration:850};await new Promise(resolve=>setTimeout(resolve,920));return this.state();}
 jumpLab(){this.jumpRequest++;if(!this.active)this.start();this.target=this.current=0;this.flight=null;this.lookYaw=this.lookPitch=0;this.tick(0,performance.now());}
 advance(){this.jumpRequest++;if(!this.active){this.start();this.target=1.15;return;}const i=this.chapterAt();if(i<0)this.target=1.72;else{const chapter=this.chapters[i];const local=this.current-chapter.start;if(local<.62)this.target=chapter.start+.75;else if(chapter.world===4&&local<3.65)this.target=chapter.start+(local<1.7?2.2:4.08);else if(i<this.chapters.length-1)this.target=this.chapters[i+1].start+.75;else this.target=0;}this.returnLook=true;this.flight={from:this.current,to:this.target,at:performance.now(),duration:850};}
 location(mode,world,scene){const j=this.journey;if(j.scene!==scene)j.activateScene(scene);j.mode=mode;j.selected=world;j.renderer.toneMappingExposure=mode==='world'&&world===4?1.1:1.3;const key=mode+':'+world;if(key!==this.lastLocation){this.lastLocation=key;j.notify();}}
 camera(position,yaw=0,pitch=0){const j=this.journey;j.position.set(...position);j.yaw=yaw+this.lookYaw;j.pitch=pitch+this.lookPitch;}
 path(points,t){const n=points.length-1,scaled=clamp(t,0,1)*n,index=Math.min(n-1,Math.floor(scaled)),u=ease(scaled-index),a=points[index],b=points[index+1];this.currentStop=(u>.5?b:a).label||null;const pos=a.p.map((v,k)=>mix(v,b.p[k],u));const target=a.t.map((v,k)=>mix(v,b.t[k],u));this.camera(pos,Math.atan2(pos[0]-target[0],pos[2]-target[2]),Math.atan2(target[1]-pos[1],Math.hypot(pos[0]-target[0],pos[2]-target[2])));}
 worldPath(world,scene){
  if(world===4){const destinations=scene.userData.destinations||[];if(destinations.length)return [{p:[0,1.67,2.25],t:[0,1.6,-14],label:'Dessen ailesinin evi'},...destinations.map(d=>({p:d.position,t:d.lookAt,label:d.name}))];return [{p:[0,1.67,2.25],t:[0,1.6,-13]},{p:[0,1.67,-12],t:[0,1.5,-20]},{p:[0,1.67,-23],t:[4,1.1,-24]},{p:[0,1.67,-32],t:[4,1.1,-33]}];}
  if(world===3)return [{p:[0,1.67,2.25],t:[0,4,-90]},{p:[0,1.67,.5],t:[-28,8,-85]},{p:[0,1.67,.1],t:[28,12,-95]}];
  const points=[{p:[0,1.67,2.25],t:[0,2,-25]},{p:[0,1.67,-7],t:[world===1?-25:12,4,-22]},{p:[0,1.67,-17],t:[world===2?-18:18,world===2?9:4,-40]},{p:[0,1.67,-27],t:[0,world===2?15:5,-95]}];return points;
 }
 tick(dt,time){
  if(!this.active)return;const j=this.journey;
  if(this.flight){const t=clamp((time-this.flight.at)/this.flight.duration,0,1);this.current=mix(this.flight.from,this.flight.to,t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2);document.querySelector("#transition").style.opacity=String(Math.sin(t*Math.PI)*.88);if(t===1){this.flight=null;document.querySelector("#transition").style.opacity="0";}}else this.current=mix(this.current,this.target,1-Math.exp(-dt/0.085));
  if(this.returnLook){this.lookYaw=mix(this.lookYaw,0,1-Math.exp(-dt*3.2));this.lookPitch=mix(this.lookPitch,0,1-Math.exp(-dt*3.2));}
  if(this.current<1){this.location('lab',0,j.lab);const t=clamp(this.current,0,1);j.labOpen=t>.4;this.camera([2,1.67,mix(7,1.85,ease(t))]);}
  else{
   const index=this.chapterAt();const c=this.chapters[index<0?this.chapters.length-1:index];const phase=this.current-c.start;const door=j.doors.find(d=>d.world===c.world);j.currentDoor=door;
   if(phase<.6||!this.loaded.has(c.world)){
    this.location('corridor',c.world,j.corridor);const start=index>0?j.doors.find(d=>d.world===this.chapters[index-1].world).z:2.6;const t=clamp(phase/.6,0,1);door.open=t>.46;const turn=ease(clamp((t-.35)/.65,0,1));this.camera([mix(0,door.side*.8,turn),1.67,mix(start,door.z,ease(t))],-door.side*Math.PI/2*turn);this.preload(c.world);
    if(phase>=.6&&!this.loaded.has(c.world)){this.current=c.start+.595;this.onProgress({...this.state(),loading:true});return;}
   }else{door.open=true;const scene=this.loaded.get(c.world);this.location('world',c.world,scene);this.path(this.worldPath(c.world,scene),clamp((phase-.6)/(c.span-.68),0,1));this.preload(this.chapters[index+1]?.world??4);}
  }
  this.onProgress(this.state());
 }
}
