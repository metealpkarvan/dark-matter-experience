import * as THREE from '../dist/vendor/three.module.js';
import { writeFile, mkdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const OUT=path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../dist/assets');
const vec=(...a)=>new THREE.Vector3(...a);
let seed=189344;function rand(a=0,b=1){seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return a+(b-a)*(((t^t>>>14)>>>0)/4294967296);}
function roundedCube(){let g=new THREE.BoxGeometry(1,1,1,10,10,10),p=g.attributes.position,n=g.attributes.normal;for(let i=0;i<p.count;i++){let v=vec(p.getX(i),p.getY(i),p.getZ(i)),inside=v.clone().clampScalar(-.4,.4),d=v.clone().sub(inside).normalize();v.copy(inside).addScaledVector(d,.1);p.setXYZ(i,v.x,v.y,v.z);n.setXYZ(i,d.x,d.y,d.z);}return g;}
const geo={box:new THREE.BoxGeometry(1,1,1),soft:roundedCube(),cyl:new THREE.CylinderGeometry(1,1,1,16),cone:new THREE.ConeGeometry(1,1,24),sphere:new THREE.SphereGeometry(1,12,8),leaf:new THREE.IcosahedronGeometry(1,1),torus:new THREE.TorusGeometry(1,.12,7,24),disc:new THREE.CylinderGeometry(1,1,1,28)};
function mat(name,color,r=.8,m=0,extra={}){let material=new THREE.MeshStandardMaterial({color,roughness:r,metalness:m,...extra});material.name=name;return material;}
const material={brick:mat('Chicago warm weathered brick',0xffffff,.96),mortar:mat('pale lime mortar',0x7b7567,.98),sandstone:mat('sandstone sills and facade trim',0xa89e88,.89),wall:mat('warm ivory interior plaster',0xc9c2a6,.92),ceiling:mat('warm pale ceiling',0xd9d3bb,.95),wood:mat('honey oak timber',0xffffff,.8),walnut:mat('dark walnut joinery',0x66533a,.74),oak:mat('oak cabinet fronts',0xb29a68,.72),fabric:mat('warm domestic upholstery',0xffffff,.97),metal:mat('blackened steel details',0x343d37,.68,.38),brass:mat('muted old brass',0x9f884d,.46,.52),glass:mat('clear teal daylight glass',0xa9c3b6,.19,.03,{transparent:true,opacity:.28}),ceramic:mat('warm white ceramics',0xe6ddc6,.33),soil:mat('plant pot soil',0x383e2d,.98),leaf:mat('living green leaves',0xffffff,.87),rug:mat('rust woven wool rug',0x9f7050,.99),art:mat('original framed paintings',0xffffff,.95),slate:mat('charcoal worktop stone',0x444c44,.43),steel:mat('brushed kitchen steel',0xb1b6aa,.4,.52),lamp:mat('warm frosted lamp globe',0xffdaa1,.57,0,{emissive:0xe6aa5f,emissiveIntensity:.55}),shade:mat('warm lampshade linen',0xe8d5a8,.95),ground:mat('Chicago sidewalk concrete',0x919b8b,.99),street:mat('quiet ordinary asphalt',0x49544c,.97),grass:mat('domestic garden grass',0x788f59,.97),roof:mat('weathered dark roof',0x4a5146,.96),paper:mat('warm paper book pages',0xd7d3b7,.98),darkglass:mat('dark appliance glass',0x263831,.27,.23)};
const root=new THREE.Group();root.name='Jason\'s original Chicago — Dessen home interpretation';const batches=new Map(),colliders=[];
material.navy=mat('World 1 navy Shaker kitchen cabinetry',0x293d54,.75);
material.navyInset=mat('navy cabinet inset panels',0x344a62,.75);
material.counter=mat('light cream kitchen counter stone',0xe2dec8,.55);
material.yellow=mat('mustard yellow pendant enamel',0xd3af3e,.49,.06,{side:THREE.DoubleSide});
material.curtain=mat('orange red domestic curtains',0xad6341,.99);
root.userData={formatVersion:1,unit:'metres',groundY:0,boxPosition:[0,0,5],interpretation:'Original explorable domestic layout informed by visible production references; unseen room connections are not presented as a canonical floor plan.',walkBounds:{min:[-24,0,-38],max:[24,0,15]},interiorBounds:{min:[-5.7,0,-35.6],max:[5.7,3.45,-13.3]},entryPosition:[0,0,-13],entryWidth:2.2,colliders,sourceLinks:['https://digital.copcomm.com/i/1529668/69','https://www.icg600.com/news-articles/news/divergent','https://www.apple.com/tv-pr/originals/dark-matter/episodes-images/'],destinations:[{name:'Chicago sokağı',position:[0,1.67,2.25],lookAt:[-21,3,-15]},{name:'Dessen ailesinin evi',position:[0,1.67,-8.6],lookAt:[0,1.5,-18]},{name:'Ahşap antre',position:[0,1.67,-15.3],lookAt:[4.2,1.8,-18]},{name:'Salon',position:[-.25,1.67,-19.7],lookAt:[-3.5,1.15,-18.6]},{name:'Sanat köşesi',position:[.15,1.67,-23.1],lookAt:[-4.7,1.6,-23.4]},{name:'Yemek alanı',position:[-.25,1.67,-27],lookAt:[-3.6,.95,-29]},{name:'Mutfak',position:[.3,1.67,-32.2],lookAt:[4.3,1.45,-32.4]}],suggestedLights:[{position:[-2.8,2.95,-29],color:0xffd7a1,intensity:3,distance:10},{position:[4.35,2.9,-31],color:0xffd9a8,intensity:3,distance:10},{position:[-4.9,1.9,-20],color:0xffd59a,intensity:2,distance:8},{position:[0,2.65,-15.1],color:0xffdca9,intensity:2.5,distance:11}]};
function inst(g,m,p,s=[1,1,1],r=[0,0,0],c=null,name='house details'){const region=Math.abs(p[0])>10?'street':'home',key=g.uuid+m.uuid+region;if(!batches.has(key))batches.set(key,{g,m,name:region+' — '+m.name,items:[],features:new Set()});batches.get(key).features.add(name);batches.get(key).items.push({p,s,r,c});}
function box(m,p,s,r=[0,0,0],c=null,name='joinery'){inst(geo.box,m,p,s,r,c,name);}
function soft(m,p,s,r=[0,0,0],c=null,name='soft furnishings'){inst(geo.soft,m,p,s,r,c,name);}
function cyl(m,p,s,r=[0,0,0],c=null,name='round household objects'){inst(geo.cyl,m,p,s,r,c,name);}
function ball(m,p,s,c=null,name='household organic details'){inst(geo.sphere,m,p,s,[0,0,0],c,name);}
function beam(m,a,b,width=.03,name='slender frame rods'){let d=vec(...b).sub(vec(...a)),q=new THREE.Quaternion().setFromUnitVectors(vec(0,1,0),d.clone().normalize()),e=new THREE.Euler().setFromQuaternion(q);cyl(m,vec(...a).add(vec(...b)).multiplyScalar(.5).toArray(),[width,d.length(),width],e.toArray().slice(0,3),null,name);}
function mesh(g,m,name,p=[0,0,0],r=[0,0,0]){let o=new THREE.Mesh(g,m);o.name=name;o.position.set(...p);o.rotation.set(...r);o.castShadow=true;o.receiveShadow=true;root.add(o);return o;}
function collide(name,p,s){colliders.push({name,min:p.map((v,i)=>v-s[i]/2),max:p.map((v,i)=>v+s[i]/2)});}
function wall(p,s,name='structural wall'){box(material.wall,p,s,[0,0,0],null,name);collide(name,p,s);}
function vase(x,y,z,scale=.15,color=0xb7b087){cyl(material.ceramic,[x,y+scale*.55,z],[scale*.64,scale*1.1,scale*.64],[0,0,0],color,'vases and pitchers');cyl(material.ceramic,[x,y+scale*1.35,z],[scale*.40,scale*.65,scale*.40],[0,0,0],color,'vase narrow necks');}
function plant(x,y,z,s=.75){cyl(material.ceramic,[x,y+s*.21,z],[s*.29,s*.42,s*.29],[0,0,0],0xac9574,'domestic plant pots');cyl(material.soil,[x,y+s*.43,z],[s*.26,.03,s*.26],[0,0,0],null,'visible planter soil');for(let i=0;i<9;i++){let a=i/9*Math.PI*2,h=s*rand(.48,.95),ex=x+Math.cos(a)*s*.30,ez=z+Math.sin(a)*s*.30;beam(material.leaf,[x,y+s*.4,z],[ex,y+h,ez],.012,'houseplant stems');inst(geo.leaf,material.leaf,[ex,y+h,ez],[s*.15,s*.28,s*.06],[rand(-.7,.7),a,rand(-.6,.6)],new THREE.Color().setRGB(rand(.23,.38),rand(.4,.59),rand(.16,.3)),'individual houseplant leaves');}}
function book(x,y,z,w=.15,h=.36,depth=.23,color=0x8d7554,rotation=0){box(material.paper,[x,y,z],[w*.88,h*.92,depth],[0,rotation,0],null,'visible book page blocks');for(let dx of [-w/2,w/2])box(material.fabric,[x+dx,y,z],[.015,h,depth+.015],[0,rotation,0],color,'colored book covers');box(material.fabric,[x,y,z+depth/2],[w,h,.025],[0,rotation,0],color,'bookshelf colored spines');}
function table(x,z,w,d,height=.77,m=material.walnut,name='domestic table'){soft(m,[x,height-.06,z],[w,.12,d],[0,0,0],null,name+' tops');for(let dx of [-w*.4,w*.4])for(let dz of [-d*.37,d*.37])box(m,[x+dx,(height-.12)/2,z+dz],[.10,height-.12,.10],[0,0,0],null,name+' legs');collide(name,[x,height/2,z],[w,height,d]);}
function chair(x,z,rotation=0){let group=new THREE.Group(); // all geometry remains instanced; rotate offsets explicitly.
  function local(p){let c=Math.cos(rotation),s=Math.sin(rotation);return [x+p[0]*c+p[2]*s,p[1],z-p[0]*s+p[2]*c];}
  soft(material.walnut,local([0,.48,0]),[.56,.1,.56],[0,rotation,0],null,'dining chair seats');soft(material.walnut,local([0,.85,.24]),[.53,.74,.10],[0,rotation,0],null,'dining chair backs');for(let dx of [-.22,.22])for(let dz of [-.21,.21])box(material.walnut,local([dx,.23,dz]),[.055,.47,.055],[0,rotation,0],null,'chair tapered legs');collide('dining chair',[x,.55,z],[.65,1.1,.65]);}
function picture(x,y,z,w,h,orientation=0,color=0x777f5c,name='original wall artwork'){
  let c=Math.cos(orientation),s=Math.sin(orientation),pos=(a,b,d)=>[x+a*c+d*s,y+b,z-a*s+d*c];
  box(material.art,pos(0,0,0),[w,h,.025],[0,orientation,0],color,name+' painted canvas');
  for(let dx of [-w/2,w/2])box(material.walnut,pos(dx,0,.035),[.055,h+.10,.06],[0,orientation,0],null,name+' timber frame');for(let dy of [-h/2,h/2])box(material.walnut,pos(0,dy,.035),[w+.10,.055,.06],[0,orientation,0],null,name+' timber frame');
  for(let i=0;i<11;i++){let xx=rand(-w*.4,w*.4),yy=rand(-h*.4,h*.4);box(material.art,pos(xx,yy,.019),[rand(.03,w*.27),rand(.03,h*.18),.014],[0,orientation,0],new THREE.Color().setRGB(rand(.35,.8),rand(.33,.69),rand(.23,.53)),name+' original abstract brush fields');}
}
function fretwork(x,z,width){
  for(let y of [2.73,3.32])box(material.walnut,[x,y,z],[width,.11,.14],[0,0,0],null,'ornate dark timber transom rails');
  for(let side of [-1,1]){let xx=x+side*width/2;cyl(material.walnut,[xx,1.36,z],[.065,2.72,.065],[0,0,0],null,'carved living room timber columns');for(let y of [.14,.38,2.40,2.60])box(material.walnut,[xx,y,z],[.25,.12,.25],[0,0,0],null,'ornate column bases and capitals');}
  const sections=Math.max(1,Math.round(width/1.45));
  for(let j=0;j<sections;j++){
    let xx=x-width/2+(j+.5)*width/sections;
    if(j%2===0){let points=[];for(let i=0;i<49;i++){let a=i/48*Math.PI*2,r=.25+.085*Math.cos(4*a);points.push(vec(Math.cos(a)*r,Math.sin(a)*r*.64,0));}
      let g=new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points,true),64,.018,5,true);mesh(g,material.walnut,'four leaf carved transom medallion',[xx,3.025,z]);
      for(let sign of [-1,1])beam(material.walnut,[xx+sign*.46,2.76,z],[xx+sign*.26,3.27,z],.017,'transom slanted scroll supports');
    }else for(let i=-2;i<=2;i++){let px=xx+i*.18;cyl(material.walnut,[px,3.025,z],[.018,.47,.018],[0,0,0],null,'fine transom spindle fretwork');for(let yy of [2.91,3.10])ball(material.walnut,[px,yy,z],[.034,.044,.034],null,'turned fretwork spindle beads');}
  }
}

// Ordinary Chicago street with a flush path to the open house entrance.
box(material.ground,[0,-.065,-12],[110,.12,108],[0,0,0],null,'continuous ordinary Chicago ground');
box(material.street,[0,-.008,3],[110,.08,10],[0,0,0],null,'quiet residential roadway');
for(let x=-52;x<=52;x+=2.8)for(let z=-10;z<=14;z+=2.8){box(material.mortar,[x,.005,z],[.025,.01,2.76],[0,0,0],0x747f70,'sidewalk expansion joints');box(material.mortar,[x,.005,z],[2.76,.01,.025],[0,0,0],0x747f70,'sidewalk expansion joints');}
box(material.grass,[0,-.005,-8.8],[13,.03,5.2],[0,0,0],null,'front garden lawn');box(material.ground,[0,.014,-9.1],[2.6,.025,7.8],[0,0,0],0xa8ad99,'flush front door approach');
for(let side of [-1,1]){
  for(let z=-7;z>-12.6;z-=.5)box(material.metal,[side*6.4,.55,z],[.04,1.10,.04],[0,0,0],null,'front garden iron pickets');for(let y of [.27,.90])box(material.metal,[side*6.4,y,-9.7],[.04,.05,5.8],[0,0,0],null,'front garden iron rails');
  for(let x=1.7;x<6.5;x+=.5)box(material.metal,[side*x,.55,-6.9],[.04,1.1,.04],[0,0,0],null,'front boundary iron pickets');for(let y of [.27,.90])box(material.metal,[side*4.0,y,-6.9],[4.6,.05,.04],[0,0,0],null,'front boundary iron rails');
  for(let i=0;i<5;i++)plant(side*(2.0+i*.75),0,-11.6,.65);
}

// Structural shell: two actual window voids and a clear 2.2 m doorway.
const facadeZ=-13,front=material.brick;
box(material.mortar,[0,5.15,facadeZ],[12.35,3.25,.42],[0,0,0],null,'upper Chicago masonry facade');
for(let side of [-1,1]){
  box(material.mortar,[side*3.55,.45,facadeZ],[4.9,.90,.42],[0,0,0],null,'front window masonry base');
  box(material.mortar,[side*3.55,3.18,facadeZ],[4.9,.64,.42],[0,0,0],null,'front window masonry head');
  for(let x of [side*1.45,side*5.65])box(material.mortar,[x,1.85,facadeZ],[.7,1.9,.42],[0,0,0],null,'front window masonry jambs');
  collide('facade side '+side,[side*3.57,1.8,facadeZ],[4.94,3.6,.45]);
}
// Remove collision from the opening in each window; these facade collision blocks
// do not affect the centre doorway, which remains x=-1.1..1.1.
box(material.sandstone,[0,3.08,facadeZ+.05],[2.3,.74,.52],[0,0,0],null,'stone front door lintel');
for(let x of [-1.14,1.14])box(material.walnut,[x,1.39,facadeZ+.25],[.13,2.78,.14],[0,0,0],null,'open entrance door jambs');box(material.walnut,[0,2.80,facadeZ+.25],[2.38,.13,.14],[0,0,0],null,'front door header');
// Door is swung fully inward beside the left jamb, with panelled timber depth.
box(material.walnut,[-1.07,1.34,-14.04],[.08,2.65,2.05],[0,0,0],0x506252,'fully open paneled front door');
for(let y of [.72,1.79])for(let zz of [-13.6,-14.48])box(material.oak,[-1.015,y,zz],[.04,.82,.72],[0,0,0],0x66715a,'front door inset timber panels');ball(material.brass,[-.98,1.08,-14.76],[.055,.055,.055],null,'front door brass knob');
box(material.fabric,[0,.033,-14.15],[1.45,.032,.65],[0,0,0],0x776d51,'woven entrance mat');
// Handmade brick courses use reused geometry with mild natural variation.
for(let y=.16;y<7.1;y+=.22)for(let i=0;i<34;i++){
  const x=-5.95+i*.36+(Math.round(y/.22)%2?.18:0);if(x>6.10)continue;
  if(y<2.80&&Math.abs(x)<1.14)continue;
  if(y>.91&&y<2.84&&Math.abs(x)>1.87&&Math.abs(x)<5.25)continue;
  if(y>4.13&&y<6.29&&[-3.85,0,3.85].some(xx=>Math.abs(xx-x)<.92))continue;
  box(front,[x,y,facadeZ+.235],[.33,.185,.095],[0,0,0],new THREE.Color().setRGB(rand(.56,.68),rand(.50,.61),rand(.39,.49)),'individual tan gray Greystone masonry facade courses');
}
// Historic facade rhythm with sandstone window sills and transoms.
for(let side of [-1,1]){
  let x=side*3.55;box(material.glass,[x,1.89,facadeZ-.02],[3.2,1.9,.035],[0,0,0],null,'large living room front window glass');
  for(let xx of [-1.65,0,1.65])box(material.walnut,[x+xx,1.9,facadeZ+.1],[.085,2.02,.16],[0,0,0],null,'front window painted timber mullions');for(let yy of [.9,1.9,2.9])box(material.walnut,[x,yy,facadeZ+.1],[3.4,.085,.16],[0,0,0],null,'front window horizontal transoms');
  box(material.sandstone,[x,.83,facadeZ+.25],[3.8,.18,.62],[0,0,0],null,'deep sandstone front window sills');
}
for(let x of [-3.85,0,3.85]){
  box(material.darkglass,[x,5.21,facadeZ+.24],[1.80,2.14,.055],[0,0,0],null,'upper story recessed sash windows');
  for(let dx of [-.97,0,.97])box(material.walnut,[x+dx,5.21,facadeZ+.30],[.08,2.22,.18],[0,0,0],null,'upper sash window jambs');for(let y of [4.10,5.15,6.32])box(material.walnut,[x,y,facadeZ+.30],[2.05,.085,.18],[0,0,0],null,'upper sash window crossbars');
  for(let y of [4.00,6.44])box(material.sandstone,[x,y,facadeZ+.30],[2.30,.20,.65],[0,0,0],null,'upper sandstone lintels and sills');
}
for(let y of [3.55,6.92,7.25])box(material.sandstone,[0,y,facadeZ+.12],[12.7,.22,.78],[0,0,0],null,'Chicago facade cornice courses');
for(let x=-5.7;x<=5.7;x+=.47)box(material.sandstone,[x,7.07,facadeZ+.30],[.21,.28,.42],[0,0,0],null,'dentil cornice blocks');
// Original two-storey polygonal bay, guided by the Apple-credited exterior frame.
// Only the projecting outer facets are built; the rear remains open to the room.
// This adds genuine parallax without inserting a solid volume into the interior.
const bay=[[-5.55,-13.0],[-5.55,-11.60],[-4.35,-10.80],[-2.75,-10.80],[-1.55,-11.60],[-1.55,-13.0]];
for(let i=0;i<bay.length-1;i++){
  let a=bay[i],b=bay[i+1],dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz),yaw=-Math.atan2(dz,dx),x=(a[0]+b[0])/2,z=(a[1]+b[1])/2;
  const rotation=[0,yaw,0];
  box(material.sandstone,[x,.43,z],[length+.05,.86,.17],rotation,0xaea68f,'projecting bay pale stone plinth');
  for(let y of [3.32,3.70,6.74,7.09])box(material.sandstone,[x,y,z],[length+.16,y===3.32?.47:.22,.23],rotation,0xa69c83,'bay polygonal masonry belt courses');
  for(let level of [0,1]){
    let y=level===0?1.99:5.19,height=level===0?2.16:2.29;
    box(level===0?material.glass:material.darkglass,[x,y,z],[length-.15,height,.033],rotation,null,'two storey polygon bay window panes');
    for(let yy of [-height/2,0,height/2])box(material.walnut,[x,y+yy,z+.026],[length-.09,.082,.12],rotation,null,'bay window horizontal sash rails');
    if(length>1.52)box(material.walnut,[x,y,z+.030],[.063,height,.13],rotation,null,'bay centre sash mullions');
  }
  colliders.push({name:'projecting window bay facet '+i,min:[Math.min(a[0],b[0])-.09,0,Math.min(a[1],b[1])-.09],max:[Math.max(a[0],b[0])+.09,3.45,Math.max(a[1],b[1])+.09]});
}
for(let [x,z] of bay){box(material.sandstone,[x,3.51,z],[.16,7.02,.16],[0,0,0],0xb3a78e,'bay corner masonry pilasters');for(let y of [1.99,5.19])box(material.walnut,[x,y,z+.025],[.081,2.27,.095],[0,0,0],null,'bay dark timber corner window jambs');}
mesh(new THREE.ConeGeometry(2.62,1.92,8),material.roof,'recognisable dark octagonal conical bay roof',[-3.55,8.01,-12.05],[0,Math.PI/8,0]);
inst(new THREE.CylinderGeometry(2.64,2.64,.13,8),material.roof,[-3.55,7.12,-12.05],[1,1,1],[0,Math.PI/8,0],null,'dark polygonal bay roof eaves');
cyl(material.metal,[-3.55,9.05,-12.05],[.03,.23,.03],[0,0,0],null,'small bay roof finial');
root.userData.exteriorInterpretation='The original polygonal projecting bay and dark conical roof are informed by a secondary Apple-credited show frame. Dimensions and room connections remain reconstruction choices.';
wall([-6.01,1.8,-24.5],[.32,3.6,23.4],'left interior perimeter wall');wall([6.01,1.8,-24.5],[.32,3.6,23.4],'right interior perimeter wall');
wall([0,.52,-36.15],[12.35,1.04,.32],'rear wall below kitchen window');wall([0,3.33,-36.15],[12.35,.54,.32],'rear wall over kitchen window');for(let x of [-3.9,3.9])wall([x,2.02,-36.15],[4.55,1.98,.32],'rear kitchen window side wall');
box(front,[-6.22,5.2,-24.5],[.17,3.5,23.4],[0,0,0],0x805339,'left upper exterior brick');box(front,[6.22,5.2,-24.5],[.17,3.5,23.4],[0,0,0],0x805339,'right upper exterior brick');
box(material.ceiling,[-1.28,3.62,-24.5],[9.54,.22,23.2],[0,0,0],null,'main ground floor ceiling beside stairwell');box(material.ceiling,[4.83,3.62,-14.27],[2.43,.22,2.74],[0,0,0],null,'front ceiling before stair opening');box(material.ceiling,[4.83,3.62,-29.19],[2.43,.22,13.81],[0,0,0],null,'rear ceiling beyond stair opening');box(material.walnut,[4.73,3.54,-22.02],[2.53,.13,.86],[0,0,0],null,'stair upper landing in ceiling opening');box(material.roof,[0,7.05,-24.5],[12.7,.3,23.7],[0,0,0],null,'flat townhouse roof');box(front,[-4.0,7.86,-32],[.86,1.6,.9],[0,0,0],0x826047,'brick rooftop chimney');
// Continuous oak floor is flush with the outside path and has individual planks.
box(material.walnut,[0,-.055,-24.5],[11.75,.1,22.8],[0,0,0],null,'solid oak interior floor');
for(let x=-5.74;x<5.8;x+=.24)for(let j=0;j<6;j++){
  let z=-15.0-j*3.5+(Math.round(x/.24)%2?.6:0);box(material.wood,[x,.005,z],[.23,.014,3.47],[0,0,0],new THREE.Color().setRGB(rand(.44,.62),rand(.32,.46),rand(.18,.30)),'individual honey oak floorboards');
  for(let k=0;k<2;k++)box(material.wood,[x+rand(-.07,.07),.014,z],[.006,.002,rand(1.5,3.0)],[0,0,0],0x806845,'subtle timber grain streaks');
}
for(let x of [-5.78,5.78])for(let y of [.13,3.39])box(material.ceiling,[x,y,-24.5],[.11,.18,22.8],[0,0,0],null,'interior perimeter skirting and crown molding');
for(let z of [-13.32,-35.94])for(let y of [.13,3.39])box(material.ceiling,[0,y,z],[11.5,.18,.11],[0,0,0],null,'end wall skirting and crown molding');
// Open broad cased transition: living space to dining/kitchen, no floor barrier.
for(let x of [-5.6,5.6])wall([x,1.8,-24],[.40,3.6,.30],'wide room transition side pier');box(material.ceiling,[0,3.25,-24],[11.5,.50,.36],[0,0,0],null,'open dining room cased lintel');
for(let x of [-5.38,5.38])box(material.walnut,[x,1.51,-24],[.13,3.02,.43],[0,0,0],null,'dining transition timber casing');
fretwork(0,-24.0,10.7);fretwork(-3.37,-16.2,4.30);
box(material.rug,[0,.028,-16.35],[1.72,.032,4.25],[0,0,0],0x9b543d,'red patterned foyer runner');
for(let x of [-.73,.73])box(material.fabric,[x,.049,-16.35],[.063,.009,4.1],[0,0,0],0xc5ae82,'foyer runner woven border');for(let z=-18.22;z<-14.3;z+=.32)for(let x of [-.4,0,.4])box(material.fabric,[x,.05,z],[.14,.009,.16],[0,0,0],0xbca173,'foyer rug small traditional motifs');
// Rust curtains and pleats repeat the verified World 1 domestic palette.
for(let side of [-1,1])for(let edge of [-1,1]){let x=side*3.55+edge*1.30;box(material.curtain,[x,1.74,-13.29],[.61,2.74,.048],[0,0,0],null,'orange red full height curtains');for(let i=0;i<7;i++)cyl(material.curtain,[x-.27+i*.09,1.74,-13.26],[.042,2.74,.042],[0,0,0],i%2?0x8e5037:0xbd7450,'individual curtain pleats');}
for(let side of [-1,1])box(material.walnut,[side*3.55,3.18,-13.23],[3.8,.064,.064],[0,0,0],null,'dark timber curtain rods');
ball(material.lamp,[0,2.74,-15.1],[.22,.22,.22],null,'foyer warm white globe pendant');beam(material.brass,[0,2.98,-15.1],[0,3.52,-15.1],.016,'foyer brass globe suspension');
ball(material.lamp,[-3.22,2.71,-20.3],[.21,.21,.21],null,'living room warm globe pendant');beam(material.brass,[-3.22,2.94,-20.3],[-3.22,3.52,-20.3],.016,'living room globe suspension');

// Warm living room: upholstery has rounded geometry, seams and loose cushions.
const sofaX=-3.42,sofaZ=-17.32;
soft(material.fabric,[sofaX,.32,sofaZ],[3.50,.40,1.16],[0,0,0],0x8f8b4e,'living room mustard olive sofa base');soft(material.fabric,[sofaX,.78,sofaZ+.42],[3.48,.81,.27],[0,0,0],0x94905a,'sofa tall upholstered back');
for(let x of [-5.11,-1.74])soft(material.fabric,[x,.63,sofaZ],[.27,.58,1.19],[0,0,0],0x888449,'sofa rounded arms');
for(let x of [-4.35,-3.42,-2.49]){soft(material.fabric,[x,.59,sofaZ-.09],[.88,.26,.88],[0,0,0],0xa59f61,'individual sofa seat cushions');soft(material.fabric,[x,.90,sofaZ+.22],[.87,.59,.19],[-.1,0,0],0xa39a5c,'sofa separate back cushions');box(material.walnut,[x,.12,sofaZ],[.10,.24,.83],[0,0,0],null,'sofa timber foot rails');}
for(const [x,c] of [[-4.65,0x738477],[-2.15,0xb68b52]])soft(material.fabric,[x,.86,sofaZ-.10],[.50,.49,.16],[.23,0,x> -3?.20:-.22],c,'lived in throw pillows');soft(material.fabric,[-4.73,.78,sofaZ-.12],[.38,.12,.89],[0,0,.16],0xb1ad8b,'folded throw on sofa arm');
collide('living room sofa',[sofaX,.6,sofaZ],[3.60,1.20,1.30]);
box(material.fabric,[-3.34,.026,-19.72],[4.17,.035,4.55],[0,0,0],0xc2bba0,'living room patterned cream rug');
for(let side of [-1,1])box(material.fabric,[-3.34+side*1.90,.049,-19.72],[.095,.008,4.35],[0,0,0],0xc2a478,'rug long woven borders');for(let z of [-21.79,-17.65])box(material.fabric,[-3.34,.049,z],[3.90,.008,.095],[0,0,0],0xc2a478,'rug end woven borders');
for(let i=0;i<21;i++)for(let j=0;j<7;j++)box(material.fabric,[-5.15+i*.18,.049,-21.45+j*.55],[.06,.009,.19],[0,0,0],(i+j)%2?0x95795b:0xb6986c,'subtle handwoven rug pattern');
table(-3.45,-19.75,2.12,1.12,.42,material.walnut,'low living room coffee table');
book(-3.96,.53,-19.60,.32,.055,.40,0x677d73);book(-3.75,.58,-19.58,.33,.045,.44,0xa58b64);vase(-2.86,.48,-19.90,.15,0xd5c1a2);cyl(material.ceramic,[-3.40,.5,-19.85],[.085,.09,.085],[0,0,0],null,'tea mug on coffee table');inst(geo.torus,material.ceramic,[-3.29,.52,-19.85],[.06,.06,.06],[0,Math.PI/2,0],null,'ceramic mug handle');
soft(material.fabric,[-1.9,.45,-21.85],[1.03,.43,1.05],[0,-.24,0],0x757d69,'reading chair seat');soft(material.fabric,[-1.80,.81,-22.23],[1.00,.74,.20],[.1,-.24,0],0x757d69,'reading chair back');for(let x of [-2.4,-1.45])soft(material.fabric,[x,.67,-21.83],[.18,.45,.99],[0,-.24,0],0x69735f,'reading chair arms');collide('reading armchair',[-1.9,.6,-21.85],[1.35,1.20,1.35]);
// Mantel, radiator, bookshelf and framed art give the room a lived-in perimeter.
box(material.sandstone,[-5.60,.74,-20.75],[.44,1.48,2.04],[0,0,0],0xb3ab90,'limestone fireplace surround');box(material.darkglass,[-5.35,.69,-20.75],[.08,1.06,1.29],[0,0,0],null,'dark fireplace opening');box(material.walnut,[-5.45,1.58,-20.75],[.87,.19,2.32],[0,0,0],null,'deep walnut fireplace mantel');
for(let i=0;i<4;i++)cyl(material.walnut,[-5.23,.35,-21.19+i*.28],[.11,.52,.11],[0,0,Math.PI/2],null,'stacked firewood ends');picture(-5.36,2.47,-20.76,1.35,1.03,Math.PI/2,0x878e70,'framed domestic landscape');collide('fireplace',[-5.47,.9,-20.75],[.85,1.8,2.36]);
table(-5.0,-18.65,.64,.63,.66,material.walnut,'sofa end table');cyl(material.brass,[-5.0,.79,-18.65],[.13,.28,.13],[0,0,0],null,'table lamp brass base');cyl(material.brass,[-5.0,1.12,-18.65],[.023,.5,.023],[0,0,0],null,'table lamp stem');mesh(new THREE.CylinderGeometry(.21,.29,.39,20,1,true),material.shade,'linen table lamp shade',[-5.0,1.49,-18.65]);ball(material.lamp,[-5.0,1.45,-18.65],[.12,.13,.12],null,'warm table lamp globe');
for(let z of [-15.2,-15.04,-14.88,-14.72,-14.56,-14.4,-14.24])box(material.ceiling,[-5.25,.44,z],[.25,.72,.10],[0,0,0],0xc5c0a7,'cast iron radiator ribs');beam(material.brass,[-5.4,.11,-15.42],[-5.4,.76,-15.42],.032,'radiator brass valve');
box(material.walnut,[-3.8,.87,-23.36],[2.8,1.74,.36],[0,0,0],null,'low living room bookcase');
for(let y of [.14,.63,1.16,1.72])box(material.oak,[-3.8,y,-23.12],[2.86,.06,.5],[0,0,0],null,'bookcase timber shelf edges');
for(let shelf=0;shelf<3;shelf++)for(let i=0;i<13;i++){let ww=rand(.08,.18),h=rand(.25,.40);book(-5.05+i*.19,.19+shelf*.52+h/2,-23.07,ww,h,.21,[0x68796a,0x9f7756,0x7b7d72,0xb2a171,0x696d60][i%5]);}
collide('low living bookcase',[-3.8,.90,-23.2],[2.9,1.8,.55]);
picture(-3.80,2.57,-23.46,1.65,.89,0,0x96a087,'original family landscape wall print');vase(-4.88,1.78,-23.20,.18,0xc0af89);plant(-2.72,1.75,-23.17,.52);
// Art corner: original painting, modest easel, stool and brushes, not a replica.
for(let z of [-22.5,-23.4])beam(material.walnut,[-5.25,0,z],[-4.86,2.43,-23.16],.045,'artist easel legs');beam(material.walnut,[-4.53,0,-23.16],[-4.86,2.43,-23.16],.04,'easel rear leg');box(material.oak,[-4.82,1.22,-22.92],[1.2,.08,.20],[0,0,0],null,'easel canvas support ledge');picture(-4.81,1.89,-23.0,1.02,1.15,0,0xb68e68,'Daniela inspired original abstract canvas');cyl(material.oak,[-5.3,.55,-22.57],[.24,.11,.24],[0,0,0],null,'artist stool timber seat');for(let i=0;i<3;i++){let a=i/3*Math.PI*2;beam(material.walnut,[-5.3+Math.cos(a)*.21,.06,-22.57+Math.sin(a)*.21],[-5.3+Math.cos(a)*.15,.5,-22.57+Math.sin(a)*.15],.035,'artist stool legs');}collide('artist easel',[-4.85,1.2,-23.1],[1.2,2.4,.65]);

// Timber staircase visibly rises along the right wall; walking route passes left.
for(let i=0;i<17;i++){let zz=-16.0-i*.34,h=(i+1)*.205;box(material.walnut,[4.62,h/2,zz],[1.70,h,.36],[0,0,0],null,'individual solid oak stair steps');box(material.oak,[4.62,h+.016,zz+.022],[1.80,.032,.38],[0,0,0],null,'oak stair tread nosings');cyl(material.walnut,[3.68,h+.48,zz],[.032,.95,.032],[0,0,0],null,'stair turned timber balusters');}
beam(material.walnut,[3.68,.96,-15.9],[3.68,4.35,-21.50],.065,'continuous stair handrail');for(let z of [-15.91,-21.5])box(material.walnut,[3.66,z===-15.91?.63:3.89,z],[.13,1.24,.13],[0,0,0],null,'stair substantial newel posts');collide('staircase footprint',[4.55,1.75,-18.75],[2.1,3.5,6.2]);
for(let z of [-15.91,-21.5]){let yy=z===-15.91?.63:3.89;box(material.walnut,[3.66,yy,z],[.24,1.24,.24],[0,0,0],null,'paneled substantial dark stair newels');for(let d of [-.135,.135])box(material.oak,[3.66+d,yy,z],[.022,.74,.13],[0,0,0],0x554d39,'newel inset carved panels');box(material.walnut,[3.66,yy+.70,z],[.31,.11,.31],[0,0,0],null,'newel molded timber capitals');ball(material.walnut,[3.66,yy+.82,z],[.09,.10,.09],null,'newel rounded crown');}
for(let i=0;i<17;i++){let z=-16-i*.34,h=(i+1)*.205;for(let y of [h+.31,h+.60])ball(material.walnut,[3.68,y,z],[.049,.066,.049],null,'dark turned stair spindle beads');}
for(let i=0;i<4;i++)picture(5.78,1.80+i*.35,-16.65-i*1.1,.60,.74,-Math.PI/2,[0x8f957c,0xb2987e,0x758a7a,0x9b876d][i],'small stairwell framed original print');
// Compact entry console, shoes and coat hooks sit on the stair-side wall.
table(3.46,-14.42,1.75,.44,.82,material.walnut,'entrance console');vase(3.83,.9,-14.41,.14,0xc3b590);box(material.ceramic,[3.24,.89,-14.4],[.29,.04,.2],[0,0,0],null,'entry key tray');for(let i=0;i<3;i++)ball(material.brass,[3.17+i*.045,.92,-14.40],[.018,.012,.025],null,'small brass keys');
for(let x of [3.0,3.4,3.8]){ball(material.brass,[x,2.1,-13.46],[.037,.037,.052],null,'entry coat hooks');soft(material.fabric,[x,1.68,-13.59],[.37,.70,.13],[0,0,0],x<3.5?0x637668:0x8b8066,'hanging coats');}
for(let x of [3.0,3.22,3.64,3.86])soft(material.fabric,[x,.10,-14.01],[.18,.17,.42],[0,.1,0],0x464f40,'entry shoes');

// Dining room with chairs, place settings, wine, greenery and geometric pendant.
box(material.fabric,[-3.22,.029,-29.11],[4.35,.038,5.04],[0,0,0],0x9b9d7f,'dining room woven neutral rug');table(-3.12,-29.10,2.30,3.0,.80,material.walnut,'family dining table');
for(let x of [-4.68,-1.56])for(let z of [-28.23,-29.89])chair(x,z,x< -3?Math.PI/2:-Math.PI/2);chair(-3.12,-27.12,Math.PI);chair(-3.12,-31.08,0);
for(let x of [-3.82,-2.42])for(let z of [-28.30,-29.92]){
  cyl(material.ceramic,[x,.825,z],[.24,.018,.24],[0,0,0],null,'dining place setting plates');cyl(material.ceramic,[x,.845,z],[.11,.032,.11],[0,0,0],0xcac4a6,'small dining bowls');box(material.brass,[x+.31,.831,z],[.024,.014,.35],[0,0,0],null,'dining cutlery');cyl(material.glass,[x-.19,.92,z-.28],[.055,.15,.055],[0,0,0],null,'dining drinking glasses');box(material.fabric,[x+.4,.833,z],[.15,.01,.28],[0,0,0],0xb7a98a,'folded linen napkins');
}
vase(-3.10,.83,-29.11,.21,0xb9a87a);for(let i=0;i<7;i++){let a=i/7*Math.PI*2;beam(material.leaf,[-3.10,1.1,-29.11],[-3.1+Math.cos(a)*.25,1.45+rand(0,.18),-29.11+Math.sin(a)*.2],.01,'dining flower stems');ball(material.fabric,[-3.1+Math.cos(a)*.25,1.50,-29.11+Math.sin(a)*.2],[.065,.045,.065],i%2?0xd6cba7:0xbd9f67,'small dried dining flowers');}
cyl(material.darkglass,[-2.56,.99,-29.14],[.07,.34,.07],[0,0,0],null,'table wine bottle body');cyl(material.darkglass,[-2.56,1.21,-29.14],[.027,.13,.027],[0,0,0],null,'wine bottle narrow neck');box(material.paper,[-2.56,1.01,-29.06],[.10,.12,.015],[0,0,0],0xd5c99e,'wine bottle paper label');
// Wireframe cube pendant gently echoes the show's visible original-universe motif.
for(const [x,z,size] of [[-3.38,-28.5,.68],[-2.83,-29.53,.55],[-3.4,-29.74,.44]]){
  beam(material.metal,[x,3.54,z],[x,2.84,z],.015,'pendant suspension cable');
  for(let a of [-1,1])for(let b of [-1,1]){beam(material.metal,[x+a*size/2,2.57-size/2,z+b*size/2],[x+a*size/2,2.57+size/2,z+b*size/2],.016,'nested cube pendant wire edges');beam(material.metal,[x-size/2,2.57+a*size/2,z+b*size/2],[x+size/2,2.57+a*size/2,z+b*size/2],.016,'nested cube pendant wire edges');beam(material.metal,[x+a*size/2,2.57+b*size/2,z-size/2],[x+a*size/2,2.57+b*size/2,z+size/2],.016,'nested cube pendant wire edges');}
  ball(material.lamp,[x,2.57,z],[.11,.13,.11],null,'warm exposed dining pendant bulbs');
}
box(material.oak,[-5.29,.57,-32.97],[1.02,1.14,3.40],[0,0,0],null,'dining sideboard');for(let z of [-34.10,-32.97,-31.84])box(material.walnut,[-4.72,.60,z],[.038,.90,.98],[0,0,0],null,'sideboard paneled cabinet doors');for(let z of [-34,-33,-32])ball(material.brass,[-4.68,.66,z],[.022,.022,.055],null,'sideboard brass pulls');collide('dining sideboard',[-5.25,.60,-32.97],[1.12,1.2,3.45]);plant(-5.22,1.18,-31.93,.8);vase(-5.22,1.18,-33.72,.24,0x8d9b7d);picture(-5.78,2.33,-32.95,2.08,1.10,Math.PI/2,0x7d9b88,'dining original park landscape');

// Kitchen: warm natural cabinetry, stone tops, sink, faucet and practical clutter.
for(let z=-25.4;z>-35.2;z-=1.2)box(material.walnut,[0,3.44,z],[11.8,.15,.21],[0,0,0],null,'open timber kitchen ceiling beams');
box(material.art,[5.80,2.10,-23.8],[.028,2.60,1.35],[0,0,0],0xa95736,'red orange stair kitchen accent wall');
for(const [x,z] of [[2.58,-28.58],[2.58,-30.02],[4.5,-32.9]]){mesh(new THREE.SphereGeometry(.27,20,12,0,Math.PI*2,0,Math.PI/2),material.yellow,'World 1 yellow dome kitchen pendant',[x,2.75,z]);beam(material.metal,[x,3.01,z],[x,3.54,z],.012,'yellow dome pendant black suspension');ball(material.lamp,[x,2.77,z],[.085,.085,.085],null,'yellow dome warm pendant bulb');}
for(let z=-25.7;z>=-34.8;z-=.93){box(material.navy,[5.09,.43,z],[1.15,.86,.89],[0,0,0],null,'navy kitchen Shaker base cabinets');box(material.navyInset,[4.49,.42,z],[.035,.71,.79],[0,0,0],null,'recessed navy cabinet face panels');for(let yy of [.08,.77])box(material.navy,[4.46,yy,z],[.04,.10,.80],[0,0,0],null,'Shaker cabinet face rails');for(let zz of [-.35,.35])box(material.navy,[4.46,.42,z+zz],[.04,.71,.09],[0,0,0],null,'Shaker cabinet face stiles');box(material.brass,[4.42,.61,z],[.045,.025,.31],[0,0,0],null,'base cabinet horizontal brass pulls');}
box(material.counter,[5.02,.91,-30.31],[1.37,.13,10.1],[0,0,0],null,'continuous kitchen light cream worktop');collide('kitchen side cabinetry',[5.04,.50,-30.33],[1.45,1.00,10.2]);
for(let z of [-26,-27.3,-33.2,-34.5]){
  if(z>-30){box(material.navy,[5.72,2.27,z],[.06,1.14,1.22],[0,0,0],null,'glass cabinet navy backboards');for(let zz of [-.59,.59])box(material.navy,[5.43,2.27,z+zz],[.60,1.14,.055],[0,0,0],null,'glass cabinet sideboards');for(let yy of [1.72,2.22,2.80])box(material.navy,[5.43,yy,z],[.60,.055,1.22],[0,0,0],null,'glass cabinet interior shelves');box(material.glass,[5.105,2.27,z],[.023,1.05,1.10],[0,0,0],null,'glass front kitchen cabinet panes');for(let zz of [-.57,0,.57])box(material.navy,[5.07,2.27,z+zz],[.05,1.14,.075],[0,0,0],null,'glass cabinet navy frame stiles');for(let yy of [1.73,2.80])box(material.navy,[5.07,yy,z],[.05,.085,1.22],[0,0,0],null,'glass cabinet navy frame rails');for(let yy of [1.80,2.31])for(let i=0;i<5;i++)cyl(material.ceramic,[5.39,yy+i*.029,z-.30],[.19,.021,.19],[0,0,0],null,'stacked white plates behind glass');for(let yy of [1.83,2.36])cyl(material.ceramic,[5.39,yy,z+.29],[.20,.13,.20],[0,0,0],null,'white bowls behind glass');
  }else{box(material.navy,[5.43,2.27,z],[.61,1.14,1.22],[0,0,0],null,'navy kitchen upper cabinets');box(material.navyInset,[5.10,2.27,z],[.03,1.03,1.11],[0,0,0],null,'upper kitchen cabinet face');}
  ball(material.brass,[5.01,2.09,z+.18],[.034,.034,.048],null,'round brass upper cabinet knobs');
}
for(let z=-25.8;z>-35.5;z-=.22)for(let y=1.14;y<1.81;y+=.14)box(material.ceramic,[5.82,y,z],[.038,.122,.204],[0,0,0],(Math.round(z/.22)+Math.round(y/.14))%3?0xb8c2ab:0xa9b5a1,'individual kitchen backsplash tiles');
// Sink inset lies on the right counter; curved faucet uses a reusable tube.
box(material.steel,[5.02,.99,-29.36],[.74,.04,.91],[0,0,0],null,'kitchen sink stainless rim');box(material.darkglass,[5.02,1.014,-29.36],[.60,.028,.75],[0,0,0],null,'sink deep shaded bowl');mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([vec(5.40,1.00,-29.36),vec(5.40,1.40,-29.36),vec(5.10,1.46,-29.36),vec(5.06,1.26,-29.36)]),24,.024,7,false),material.steel,'curved brushed steel kitchen faucet');cyl(material.ceramic,[5.41,1.15,-28.71],[.055,.30,.055],[0,0,0],0xbba986,'dish soap dispenser');box(material.fabric,[4.40,1.00,-28.73],[.15,.03,.53],[0,0,0],0xa89d71,'linen dish towel over worktop edge');
box(material.ceramic,[5.02,.48,-31.65],[1.02,.90,1.12],[0,0,0],null,'white family kitchen range body');box(material.darkglass,[4.48,.48,-31.65],[.045,.54,.82],[0,0,0],null,'oven black glazed door');box(material.steel,[4.43,.83,-31.65],[.055,.035,.78],[0,0,0],null,'oven horizontal handle');for(let z of [-32.03,-31.78,-31.53,-31.28])cyl(material.metal,[4.43,.96,z],[.036,.04,.036],[0,0,Math.PI/2],null,'range control knobs');
for(let x of [4.69,5.24])for(let z of [-31.97,-31.35]){inst(geo.torus,material.metal,[x,.999,z],[.15,.15,.15],[Math.PI/2,0,0],null,'stove gas burner rings');for(let side of [-1,1])box(material.metal,[x,.994,z+side*.1],[.28,.023,.024],[0,0,0],null,'gas burner trivets');}
cyl(material.steel,[5.24,1.14,-31.35],[.16,.26,.16],[0,0,0],null,'cooking pot');cyl(material.steel,[5.24,1.29,-31.35],[.18,.03,.18],[0,0,0],null,'cooking pot lid');ball(material.metal,[5.24,1.32,-31.35],[.036,.032,.036],null,'pot lid knob');for(let x of [5.04,5.44])box(material.metal,[x,1.16,-31.35],[.11,.06,.04],[0,0,0],null,'pot side handles');
box(material.steel,[5.38,2.67,-31.65],[.78,.31,1.5],[0,0,0],null,'range hood brushed canopy');box(material.steel,[5.67,3.1,-31.65],[.30,.58,.78],[0,0,0],null,'range hood vertical duct');
soft(material.steel,[3.34,1.10,-35.15],[1.29,2.17,1.33],[0,0,0],null,'family refrigerator');box(material.darkglass,[3.34,1.77,-34.47],[1.06,.38,.024],[0,0,0],0x828e7b,'refrigerator subtle top panel');for(let x of [3.07,3.60])box(material.steel,[x,1.2,-34.43],[.033,.65,.038],[0,0,0],null,'fridge vertical handles');
for(let i=0;i<7;i++)box(material.paper,[3.34+rand(-.48,.48),rand(.6,1.8),-34.445],[rand(.1,.3),rand(.11,.25),.009],[0,0,rand(-.15,.15)],i%2?0xd4c29a:0xacb5a2,'fridge family notes');for(let i=0;i<9;i++)ball(material.fabric,[3.34+rand(-.49,.49),rand(.60,1.89),-34.426],[.025,.025,.010],[0x997452,0x697d74,0xab9360][i%3],'small refrigerator magnets');collide('refrigerator',[3.34,1.10,-35.15],[1.32,2.2,1.35]);
// Original narrow prep island remains to the right of the x=0 circulation route.
box(material.navy,[2.58,.45,-29.27],[1.26,.90,2.10],[0,0,0],null,'navy kitchen prep island base');box(material.oak,[2.58,.95,-29.27],[1.42,.14,2.28],[0,0,0],null,'honey butcher block island top');collide('kitchen island',[2.58,.50,-29.27],[1.46,1.00,2.32]);
box(material.navyInset,[2.59,.46,-28.19],[1.02,.71,.04],[0,0,0],null,'island bookshelf dark recessed back');for(let yy of [.15,.51,.86])box(material.navy,[2.59,yy,-28.05],[1.10,.055,.28],[0,0,0],null,'island end bookshelf rails');for(let shelf=0;shelf<2;shelf++)for(let i=0;i<6;i++)book(2.18+i*.15,.19+shelf*.35+.13,-27.99,.12,.27,.20,[0x977956,0x637665,0xab996a][i%3]);
for(let z of [-28.7,-29.8]){cyl(material.metal,[3.54,.64,z],[.23,.055,.23],[0,0,0],null,'black metal kitchen stool round seats');for(let i=0;i<4;i++){let a=i/4*Math.PI*2;beam(material.metal,[3.54+Math.cos(a)*.25,.04,z+Math.sin(a)*.25],[3.54+Math.cos(a)*.18,.61,z+Math.sin(a)*.18],.018,'kitchen stool black metal legs');}inst(geo.torus,material.metal,[3.54,.22,z],[.25,.25,.25],[Math.PI/2,0,0],null,'kitchen stool circular footrests');}
box(material.oak,[2.61,1.04,-29.70],[.69,.034,.41],[0,.2,0],null,'wood chopping board');for(let i=0;i<4;i++)ball(material.fabric,[2.31+i*.13,1.12,-29.69],[.07,.075,.07],[0x997038,0xaf6e3c,0xa9954c,0x817c37][i],'fruit on cutting board');cyl(material.ceramic,[2.78,1.12,-28.8],[.19,.16,.19],[0,0,0],0xc0bb98,'kitchen fruit bowl');for(let i=0;i<5;i++)ball(material.fabric,[2.78+rand(-.12,.12),1.23,-28.8+rand(-.12,.12)],[.065,.06,.065],i%2?0xc49d52:0xa67942,'small fruit in ceramic bowl');
// Everyday counter objects have actual depth and their own visible components.
for(const [z,c] of [[-26.1,0x849177],[-27,0xbbad8b],[-33.7,0xa7936e]]){cyl(material.ceramic,[5.17,1.15,z],[.10,.35,.10],[0,0,0],c,'kitchen storage jars');cyl(material.oak,[5.17,1.34,z],[.115,.044,.115],[0,0,0],null,'jar timber lids');}
soft(material.steel,[5.12,1.16,-34.45],[.36,.37,.49],[0,0,0],null,'kitchen toaster');for(let z of [-34.53,-34.37])box(material.darkglass,[5.12,1.35,z],[.25,.012,.045],[0,0,0],null,'toaster upper slots');box(material.paper,[5.05,1.51,-34.54],[.18,.30,.026],[0,0,-.12],0xd4b479,'toast slice');
plant(5.01,1.02,-25.6,.58);vase(5.2,1.0,-30.21,.20,0x839476);for(let i=0;i<8;i++)beam(material.walnut,[5.2,1.25,-30.21],[5.2+rand(-.1,.1),1.61,-30.21+rand(-.08,.08)],.012,'wooden cooking utensils');
// Window opening at the back above counter, translucent glazing for daylight.
box(material.glass,[0,2.10,-35.96],[2.66,1.55,.036],[0,0,0],null,'rear garden window glass');for(let x of [-1.41,0,1.41])box(material.walnut,[x,2.10,-35.82],[.09,1.73,.19],[0,0,0],null,'rear garden window mullions');for(let y of [1.22,2.14,2.98])box(material.walnut,[0,y,-35.82],[2.93,.08,.20],[0,0,0],null,'rear garden window transoms');box(material.oak,[0,1.18,-35.65],[3.11,.13,.43],[0,0,0],null,'rear garden window timber sill');plant(.81,1.25,-35.60,.49);plant(-.95,1.25,-35.60,.45);

// Nearby street homes use modular three-dimensional masonry, not flat scenery.
function streetHome(x,z,w=11,d=21,h=8.6,color=0x8a5941){box(front,[x,h/2,z],[w,h,d],[0,0,0],color,'neighbor Chicago masonry volumes');box(material.sandstone,[x,h-.2,z+d/2+.2],[w+.5,.3,.6],[0,0,0],null,'neighbor historic cornices');box(material.roof,[x,h+.1,z],[w+.7,.3,d+.6],[0,0,0],null,'neighbor flat roofs');
  for(let y of [2.0,5.3])for(let dx of [-w*.28,w*.28]){box(material.darkglass,[x+dx,y,z+d/2+.07],[2.0,2.2,.10],[0,0,0],null,'neighbor recessed windows');for(let q of [-1.06,0,1.06])box(material.walnut,[x+dx+q,y,z+d/2+.14],[.09,2.3,.15],[0,0,0],null,'neighbor sash jambs');for(let yy of [-1.1,0,1.1])box(material.sandstone,[x+dx,y+yy,z+d/2+.15],[2.18,.1,.30],[0,0,0],null,'neighbor window sills and transoms');}
  box(material.walnut,[x,1.23,z+d/2+.09],[1.5,2.45,.15],[0,0,0],null,'neighbor paneled street doors');for(let y=0.22;y<h;y+=.32)box(material.mortar,[x,y,z+d/2+.13],[w,.028,.026],[0,0,0],null,'neighbor masonry courses');collide('neighbor townhouse '+x,[x,h/2,z],[w,h,d]);
}
for(const [x,z,w,d,h,c] of [[-17,-23.5,11,21,8.6,0x83563d],[17,-23.5,11,21,8.5,0x956846],[-30,-23.5,11,21,9.8,0x9d6a4b],[30,-23.5,11,21,8.8,0x8e674b],[-43,-23.5,11,21,8.1,0x826142],[43,-23.5,11,21,10.4,0x76543f]])streetHome(x,z,w,d,h,c);
// Ordinary trees, parked cars and an elevated rail hint place the original city.
for(let x of [-22,-35,22,35]){cyl(material.walnut,[x,2.9,-7.8],[.16,5.8,.16],[0,0,0],null,'residential street tree trunks');for(let i=0;i<8;i++){let a=i/8*Math.PI*2;let xx=x+Math.cos(a)*1.45,zz=-7.8+Math.sin(a)*1.45;beam(material.walnut,[x,3.3,-7.8],[xx,5.5,zz],.055,'street tree branching limbs');inst(geo.leaf,material.leaf,[xx,5.7,zz],[1.4,1.7,1.3],[0,rand(0,6),0],i%3?0x708656:0x9e965d,'warm Chicago street tree canopies');}}
for(const [x,z,c] of [[-18,1.5,0x7c8b7c],[21,1.5,0x7c7365],[-34,1.5,0x8b8b77],[37,1.5,0x59685d]]){soft(material.steel,[x,.66,z],[4.15,.99,1.78],[0,0,0],c,'quiet parked residential cars');soft(material.darkglass,[x,1.27,z],[2.15,.65,1.64],[0,0,0],null,'parked car window cabins');soft(material.steel,[x,1.65,z],[2.16,.10,1.65],[0,0,0],c,'parked car roofs');for(let dx of [-1.29,1.29])for(let dz of [-.85,.85])cyl(material.metal,[x+dx,.36,z+dz],[.34,.16,.34],[Math.PI/2,0,0],null,'parked car wheels');}
for(let z=-5;z>-58;z-=13){box(material.metal,[-47,3.6,z],[.29,7.2,.29],[0,0,0],null,'distant elevated rail steel columns');box(material.metal,[-47,7.25,z],[7.2,.36,.45],[0,0,0],null,'elevated rail transverse beams');}
for(let x of [-49.7,-44.3])box(material.metal,[x,7.55,-26],[.32,.4,61],[0,0,0],null,'distant elevated railway girders');for(let z=4;z>-56;z-=.6)box(material.walnut,[-47,7.82,z],[5.7,.13,.15],[0,0,0],null,'elevated rail timber sleepers');
for(let x of [-24,24]){cyl(material.metal,[x,3.45,-3.1],[.06,6.9,.06],[0,0,0],null,'ordinary residential streetlamp posts');box(material.metal,[x,6.93,-3.1],[.55,.18,.34],[0,0,0],null,'residential streetlamp heads');}
// Background buildings remain ordinary Chicago silhouettes, separate from the home.
for(let i=0;i<28;i++){let x=-85+i*6.2,z=-95-rand(0,55),h=rand(15,48),ww=rand(4.5,7.8);box(material.brick,[x,h/2,z],[ww,h,rand(7,12)],[0,0,0],new THREE.Color().setRGB(rand(.40,.52),rand(.46,.55),rand(.40,.5)),'original Chicago distant buildings');for(let y=3;y<h-1;y+=3.2)for(let dx of [-ww*.26,ww*.26])box(material.darkglass,[x+dx,y,z+6.1],[1.03,1.65,.04],[0,0,0],null,'ordinary distant Chicago windows');}

// Flush threshold and the centre route are deliberately free of furniture.
const transform=new THREE.Object3D(),color=new THREE.Color();for(const b of batches.values()){let o=new THREE.InstancedMesh(b.g,b.m,b.items.length);o.name=b.name;o.userData.features=[...b.features];b.items.forEach((a,i)=>{transform.position.set(...a.p);transform.scale.set(...a.s);transform.rotation.set(...a.r);transform.updateMatrix();o.setMatrixAt(i,transform.matrix);if(a.c)o.setColorAt(i,color.set(a.c));});o.castShadow=true;o.receiveShadow=true;o.computeBoundingBox();o.computeBoundingSphere();root.add(o);}
root.updateMatrixWorld(true);let bounds=new THREE.Box3().setFromObject(root);root.userData.assetBounds={min:bounds.min.toArray(),max:bounds.max.toArray()};
await mkdir(OUT,{recursive:true});await writeFile(path.join(OUT,'home-world.json'),JSON.stringify(root.toJSON()));
const restored=new THREE.ObjectLoader().parse(JSON.parse(await readFile(path.join(OUT,'home-world.json'),'utf8')));restored.updateMatrixWorld(true);let drawCalls=0,triangles=0,instances=0;restored.traverse(o=>{if(o.isMesh){drawCalls++;let n=o.isInstancedMesh?o.count:1;instances+=n;triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3*n;}});
for(let z=2.25;z>=-34;z-=.25)for(let x of [-.36,0,.36])if(colliders.some(b=>x>b.min[0]-.25&&x<b.max[0]+.25&&z>b.min[2]-.25&&z<b.max[2]+.25))throw new Error('Centre house route intersects collider at '+x+','+z);
let bytes=(await readFile(path.join(OUT,'home-world.json'))).byteLength;let summary={file:'home-world.json',drawCalls,triangles:Math.round(triangles),instances,bytes,colliders:colliders.length,bounds:root.userData.assetBounds,entryWidth:2.2,centreRoute:'x=0, z=2.25..-34, clear with 0.61 m margin',destinations:root.userData.destinations};await writeFile(path.join(OUT,'asset-summary.json'),JSON.stringify(summary,null,2));console.log(JSON.stringify(summary,null,2));
