import * as THREE from 'three';
export const modelLibrary = new Map();

const assetMat=(color,metalness=.65,roughness=.3,opacity=1,emissive=0x000000)=>new THREE.MeshStandardMaterial({
  color,metalness,roughness,transparent:opacity<1,opacity,emissive,emissiveIntensity:emissive?1.35:0,side:opacity<1?THREE.DoubleSide:THREE.FrontSide
});
function assetMesh(geometry,material,name,position=[0,0,0],rotation=[0,0,0],parent){
  const m=new THREE.Mesh(geometry,material);m.name=name;m.position.set(...position);m.rotation.set(...rotation);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;
}
function loftGeometry(xs,widths,bottoms,tops,segments=40){
  const vertices=[],indices=[];
  for(let r=0;r<xs.length;r++)for(let i=0;i<segments;i++){
    const a=Math.PI*2*i/segments,c=Math.cos(a),ss=Math.sin(a);
    const z=widths[r]*Math.sign(c||1)*Math.pow(Math.abs(c),.72);
    const cy=(bottoms[r]+tops[r])/2,h=(tops[r]-bottoms[r])/2;
    const y=cy+h*Math.sign(ss||1)*Math.pow(Math.abs(ss),.86);vertices.push(xs[r],y,z);
  }
  for(let r=0;r<xs.length-1;r++)for(let i=0;i<segments;i++){
    const j=(i+1)%segments,a=r*segments+i,b=r*segments+j,c=(r+1)*segments+j,d=(r+1)*segments+i;indices.push(a,b,c,a,c,d);
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.setIndex(indices);g.computeVertexNormals();return g;
}
function makeCarAsset(){
  const g=new THREE.Group();g.name='Car_Asset';
  const paint=assetMat(0x176eaf,.78,.2),glass=assetMat(0x0b2433,.35,.08,.72),dark=assetMat(0x11161a,.1,.82),metal=assetMat(0xaab8bf,.92,.2),white=assetMat(0xd9f7ff,.2,.18,1,0xbfeeff),red=assetMat(0x65121c,.2,.25,1,0xff334e);
  assetMesh(loftGeometry([-2.35,-2.15,-1.65,-.8,.25,1.15,1.85,2.25],[.48,.76,.91,.96,.96,.91,.75,.42],[.38,.28,.25,.24,.24,.25,.3,.42],[.75,.92,1.02,1.08,1.06,1,.86,.68],48),paint,'Car_BodyShell',[],[],g);
  assetMesh(loftGeometry([-1.05,-.72,.1,.75,1.05],[.68,.77,.79,.72,.58],[.83,.9,.94,.9,.83],[1.08,1.48,1.62,1.5,1.08],40),glass,'Car_GlassCabin',[],[],g);
  assetMesh(new THREE.BoxGeometry(1.45,.09,1.46),paint,'Car_Roof',[-.02,1.56,0],[],g);
  [[-.83,-.72],[-.83,.72],[.84,-.72],[.84,.72]].forEach(([x,z],i)=>assetMesh(new THREE.BoxGeometry(.10,.78,.10),paint,`Car_Pillar_${i}`,[x,1.2,z],[0,0,x<0?-.14:.14],g));
  assetMesh(new THREE.BoxGeometry(.12,.28,1.25),dark,'Car_Grille',[2.25,.63,0],[],g);
  assetMesh(new THREE.BoxGeometry(.08,.16,1.3),dark,'Car_RearDiffuser',[-2.33,.5,0],[],g);
  [-.57,.57].forEach((z,i)=>{assetMesh(new THREE.BoxGeometry(.11,.19,.38),white,`Car_Headlamp_${i}`,[2.23,.83,z],[],g);assetMesh(new THREE.BoxGeometry(.1,.16,.34),red,`Car_Taillamp_${i}`,[-2.31,.76,z],[],g)});
  [[-1.38,-.92],[-1.38,.92],[1.38,-.92],[1.38,.92]].forEach(([x,z],i)=>{assetMesh(new THREE.CylinderGeometry(.39,.39,.30,40),dark,`Car_Wheel_${i}`,[x,.42,z],[Math.PI/2,0,0],g);assetMesh(new THREE.CylinderGeometry(.24,.24,.315,32),metal,`Car_Rim_${i}`,[x,.42,z],[Math.PI/2,0,0],g)});
  [-.98,.98].forEach((z,i)=>assetMesh(new THREE.SphereGeometry(.14,20,12),paint,`Car_Mirror_${i}`,[.62,1.16,z],[],g).scale.set(1.35,.65,.8));
  assetMesh(new THREE.BoxGeometry(3.7,.12,1.35),dark,'Car_Underbody',[0,.24,0],[],g);return g;
}
function makeRobotAsset(){
  const root=new THREE.Group();root.name='Robot_Root';const orange=assetMat(0xe26920,.55,.26),joint=assetMat(0x263841,.82,.3),steel=assetMat(0x84969f,.9,.2),cyan=assetMat(0x0b6a7f,.3,.2,1,0x20d9ff);
  assetMesh(new THREE.CylinderGeometry(.72,.72,.24,36),joint,'Robot_BasePlate',[0,.12,0],[],root);assetMesh(new THREE.CylinderGeometry(.55,.55,.85,32),orange,'Robot_Waist',[0,.62,0],[],root);
  const shoulder=new THREE.Group();shoulder.name='Robot_ShoulderPivot';shoulder.position.y=1.1;root.add(shoulder);assetMesh(new THREE.SphereGeometry(.48,24,16),joint,'Robot_ShoulderJoint',[],[],shoulder);assetMesh(new THREE.BoxGeometry(.66,2.1,.68),orange,'Robot_UpperArm',[0,1.12,0],[],shoulder);
  const elbow=new THREE.Group();elbow.name='Robot_ElbowPivot';elbow.position.y=2.2;shoulder.add(elbow);assetMesh(new THREE.SphereGeometry(.4,24,16),joint,'Robot_ElbowJoint',[],[],elbow);assetMesh(new THREE.BoxGeometry(.52,1.82,.54),orange,'Robot_Forearm',[0,.98,0],[],elbow);
  const wrist=new THREE.Group();wrist.name='Robot_WristPivot';wrist.position.y=1.92;elbow.add(wrist);assetMesh(new THREE.SphereGeometry(.29,20,14),joint,'Robot_WristJoint',[],[],wrist);assetMesh(new THREE.CylinderGeometry(.23,.23,.58,28),orange,'Robot_WristBody',[0,.32,0],[],wrist);
  const tool=new THREE.Group();tool.name='Robot_ToolPivot';tool.position.y=.62;wrist.add(tool);assetMesh(new THREE.CylinderGeometry(.16,.16,.42,24),steel,'Robot_ToolFlange',[0,.2,0],[],tool);assetMesh(new THREE.BoxGeometry(.55,.12,.12),cyan,'Robot_WeldingTool',[.25,.46,0],[],tool);assetMesh(new THREE.CylinderGeometry(.055,.055,.38,16),steel,'Robot_WeldingTip',[.67,.46,0],[0,0,Math.PI/2],tool);return root;
}
function makePressAsset(){
  const root=new THREE.Group();root.name='Press_Root';const blue=assetMat(0x196d98,.62,.25),steel=assetMat(0x687b84,.86,.28),dark=assetMat(0x263841,.82,.34),yellow=assetMat(0xe9b42e,.35,.38);
  assetMesh(new THREE.BoxGeometry(4.8,.45,4),dark,'Press_Base',[0,.22,0],[],root);[-1.85,1.85].forEach((x,ix)=>[-1.45,1.45].forEach((z,iz)=>assetMesh(new THREE.BoxGeometry(.48,4.9,.48),blue,`Press_Column_${ix}_${iz}`,[x,2.72,z],[],root)));
  assetMesh(new THREE.BoxGeometry(4.5,.68,3.7),blue,'Press_Crown',[0,5.3,0],[],root);assetMesh(new THREE.BoxGeometry(3.9,.28,3.2),steel,'Press_Bolster',[0,.76,0],[],root);assetMesh(new THREE.BoxGeometry(3.2,.34,2.55),dark,'Press_LowerDie',[0,1.02,0],[],root);
  const ram=new THREE.Group();ram.name='Press_Ram';ram.position.y=3.72;root.add(ram);assetMesh(new THREE.BoxGeometry(3.65,.74,3),blue,'Press_Slide',[],[],ram);assetMesh(new THREE.BoxGeometry(3.15,.26,2.5),steel,'Press_UpperDie',[0,-.5,0],[],ram);
  const fly=assetMesh(new THREE.TorusGeometry(.68,.15,16,48),yellow,'Press_Flywheel',[0,5.45,1.96],[Math.PI/2,0,0],root);assetMesh(new THREE.CylinderGeometry(.18,.18,.65,24),dark,'Press_FlywheelHub',[0,5.45,1.96],[Math.PI/2,0,0],root);return root;
}
function makeConveyorAsset(){
  const root=new THREE.Group();root.name='Conveyor_Root';const steel=assetMat(0x60737d,.86,.28),dark=assetMat(0x263841,.82,.34),blue=assetMat(0x196d98,.6,.28);
  assetMesh(new THREE.BoxGeometry(8.4,.18,.18),dark,'Conveyor_Rail_L',[0,.68,-1.05],[],root);assetMesh(new THREE.BoxGeometry(8.4,.18,.18),dark,'Conveyor_Rail_R',[0,.68,1.05],[],root);
  for(let i=0;i<21;i++){const x=-3.9+i*7.8/20;assetMesh(new THREE.CylinderGeometry(.105,.105,2,18),steel,`Conveyor_Roller_${String(i).padStart(2,'0')}`,[x,.7,0],[Math.PI/2,0,0],root)}
  [-3.6,-1.8,0,1.8,3.6].forEach((x,i)=>assetMesh(new THREE.BoxGeometry(.18,.7,1.85),dark,`Conveyor_Leg_${i}`,[x,.35,0],[],root));assetMesh(new THREE.BoxGeometry(1.1,.65,.35),blue,'Conveyor_Motor',[-3.25,.35,-1.28],[],root);return root;
}
function makeAgvAsset(){
  const root=new THREE.Group();root.name='AGV_Root';const red=assetMat(0xb72f3f,.65,.25),dark=assetMat(0x172229,.65,.38),steel=assetMat(0x9aabb3,.88,.22),cyan=assetMat(0x0b6a7f,.3,.2,1,0x20d9ff);
  assetMesh(new THREE.BoxGeometry(2.6,.45,1.45),red,'AGV_Chassis',[0,.42,0],[],root);assetMesh(new THREE.BoxGeometry(2.25,.12,1.16),dark,'AGV_LoadDeck',[0,.72,0],[],root);
  [[-.85,-.76],[-.85,.76],[.85,-.76],[.85,.76]].forEach(([x,z],i)=>{const p=new THREE.Group();p.name=`AGV_WheelPivot_${i}`;p.position.set(x,.3,z);root.add(p);assetMesh(new THREE.CylinderGeometry(.22,.22,.18,28),dark,`AGV_Wheel_${i}`,[],[Math.PI/2,0,0],p);assetMesh(new THREE.CylinderGeometry(.1,.1,.2,20),steel,`AGV_Hub_${i}`,[],[Math.PI/2,0,0],p)});
  assetMesh(new THREE.CylinderGeometry(.09,.09,.12,24),cyan,'AGV_Lidar',[.82,1.01,0],[],root);assetMesh(new THREE.BoxGeometry(.08,.25,.72),cyan,'AGV_FrontScanner',[1.33,.4,0],[],root);return root;
}
function makeBoothAsset(){
  const root=new THREE.Group();root.name='Booth_Root';const steel=assetMat(0x6b7b84,.85,.28),panel=assetMat(0x25435c,.2,.18,.28),violet=assetMat(0x6b4ac5,.55,.25),dark=assetMat(0x263841,.8,.34);
  for(let i=0;i<6;i++){const x=-7.5+i*3;assetMesh(new THREE.BoxGeometry(.18,5.4,.18),steel,`Booth_Column_L_${i}`,[x,2.7,-3.1],[],root);assetMesh(new THREE.BoxGeometry(.18,5.4,.18),steel,`Booth_Column_R_${i}`,[x,2.7,3.1],[],root);assetMesh(new THREE.BoxGeometry(.18,.18,6.4),steel,`Booth_RoofBeam_${i}`,[x,5.35,0],[],root)}
  assetMesh(new THREE.BoxGeometry(15.4,4.8,.06),panel,'Booth_Wall_L',[0,2.7,-3.05],[],root);assetMesh(new THREE.BoxGeometry(15.4,4.8,.06),panel,'Booth_Wall_R',[0,2.7,3.05],[],root);assetMesh(new THREE.BoxGeometry(15,.48,4.6),violet,'Booth_Plenum',[0,5.62,0],[],root);[-5.5,-1.8,1.8,5.5].forEach((x,i)=>assetMesh(new THREE.CylinderGeometry(.48,.48,1.6,28),dark,`Booth_Duct_${i}`,[x,6.6,0],[],root));return root;
}
function makeQualityAsset(){
  const root=new THREE.Group();root.name='Quality_Root';const yellow=assetMat(0xe9b42e,.35,.38),cyan=assetMat(0x0b6a7f,.3,.2,.25,0x20d9ff),dark=assetMat(0x172229,.65,.3),glass=assetMat(0x0b2433,.35,.08,.75);
  assetMesh(new THREE.BoxGeometry(.36,4.6,.36),yellow,'Quality_Column_L',[0,2.3,-2.5],[],root);assetMesh(new THREE.BoxGeometry(.36,4.6,.36),yellow,'Quality_Column_R',[0,2.3,2.5],[],root);assetMesh(new THREE.BoxGeometry(.36,.36,5.35),yellow,'Quality_Header',[0,4.45,0],[],root);
  const scan=new THREE.Group();scan.name='Quality_ScannerBeam';scan.position.y=2.35;root.add(scan);assetMesh(new THREE.BoxGeometry(.08,4,5),cyan,'Quality_LaserPlane',[],[],scan);[-2.5,2.5].forEach(z=>[1,2.3,3.6].forEach(y=>assetMesh(new THREE.SphereGeometry(.12,16,10),glass,`Quality_Camera_${z}_${y}`,[.28,y,z],[],root)));assetMesh(new THREE.BoxGeometry(.22,.55,.85),dark,'Quality_Controller',[.2,.55,-3],[],root);return root;
}
function makeLifterAsset(){
  const root=new THREE.Group();root.name='Lifter_Root';const green=assetMat(0x1c956c,.55,.28),dark=assetMat(0x263841,.8,.32),yellow=assetMat(0xe9b42e,.35,.38),steel=assetMat(0x92a3aa,.9,.2);
  [-3.5,3.5].forEach(x=>assetMesh(new THREE.BoxGeometry(.25,5.6,.25),green,`Lifter_Column_${x}`,[x,2.8,0],[],root));assetMesh(new THREE.BoxGeometry(7.3,.28,.35),green,'Lifter_Beam',[0,5.5,0],[],root);
  const c=new THREE.Group();c.name='Lifter_Carrier';c.position.y=4.9;root.add(c);assetMesh(new THREE.BoxGeometry(2.1,.45,1.4),dark,'Lifter_Hoist',[],[],c);[-.7,.7].forEach(x=>{assetMesh(new THREE.CylinderGeometry(.045,.045,3,12),steel,`Lifter_Cable_${x}`,[x,-1.5,0],[],c);assetMesh(new THREE.BoxGeometry(.9,.12,.15),yellow,`Lifter_Grip_${x}`,[x,-3,0],[],c)});return root;
}
export async function loadModelLibrary(){
  const makers={car:makeCarAsset,robot:makeRobotAsset,press:makePressAsset,conveyor:makeConveyorAsset,agv:makeAgvAsset,booth:makeBoothAsset,quality:makeQualityAsset,lifter:makeLifterAsset};
  const progressText=document.querySelector('#loading small');let i=0;
  for(const [key,maker] of Object.entries(makers)){modelLibrary.set(key,maker());i++;if(progressText)progressText.textContent=`构建真实设备网格 ${i} / 8…`;await new Promise(r=>setTimeout(r,25));}
}
