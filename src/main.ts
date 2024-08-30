import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { FlyControls } from 'three/addons/controls/FlyControls.js';
import { DragControls } from 'three/addons/controls/DragControls.js';
import Stats from 'three/addons/libs/stats.module.js'
import { GUI } from 'dat.gui'
import * as Loader from '../src/loader'
import * as Ballz from '../src/ballGenerator'
import RAPIER from '@dimforge/rapier3d-compat'
import { RapierDebugRenderer } from '../src/debugRenderer'

await RAPIER.init() // This line is only needed if using the compat version

const gravity = new RAPIER.Vector3(0.0, -9.81, 0.0)
const world = new RAPIER.World(gravity)
const dynamicBodies: [THREE.Object3D, RAPIER.RigidBody][] = []


//SCENE
const scene = new THREE.Scene()
scene.add(new THREE.AxesHelper(5))
let environmentTexture = new THREE.CubeTextureLoader().setPath('https://sbcode.net/img/').load(['px.png', 'nx.png', 'py.png', 'ny.png', 'pz.png', 'nz.png'])
scene.background = environmentTexture
scene.environment = environmentTexture
scene.backgroundBlurriness = 0

const rapierDebugRenderer = new RapierDebugRenderer(scene, world)


//#region LOAD MODELS
let bola = new THREE.Group<THREE.Object3DEventMap>()
let cacharro = new THREE.Group<THREE.Object3DEventMap>()
let mango = new THREE.Group<THREE.Object3DEventMap>()

// maybe worth it to finetune MeshPhysicalMaterial to look like glass, but for that to work, scene needs ENVIRONMENT lighting setup correctly
bola = await Loader.loadModel(scene,'bola2')
cacharro = await Loader.loadModel(scene,'cacharro2')
mango  = await Loader.loadModel(scene,'mango')

mango.position.y += 1.22293
mango.rotation.z -= Math.PI/2
//#endregion LOAD MODELS




// #region CAMERA & RENDERER
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
// camera.position.x = 0.75
// camera.position.y = 1.3
// camera.position.z = 2.3

//looking how balls fall inside cacharro
// camera.position.x = 1.63
// camera.position.y = 2.3
// camera.position.z = 2.97

//almost floor height
camera.position.x = 0.5
camera.position.y = 0.5
camera.position.z = 8




//RENDERER
const renderer = new THREE.WebGLRenderer()
renderer.shadowMap.enabled = true;
renderer.setSize(window.innerWidth, window.innerHeight)

document.body.appendChild(renderer.domElement)

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})
// #endregion CAMERA & RENDERER




// #region AUDIO
const listener = new THREE.AudioListener();
camera.add( listener );

const sound = new THREE.Audio( listener );

const audioLoader = new THREE.AudioLoader();
audioLoader.load( 'temito.mp3', function( buffer ) {
	sound.setBuffer( buffer );
	sound.setLoop( true );
	sound.setVolume( 0.5 );
  sound.autoplay = true
  sound.hasPlaybackControl = true
	sound.play();
});
//#endregion 



// #region LIGHTS
const light1 = new THREE.DirectionalLight( 0xfff9d8, 1 );
light1.position.z += 1000;
light1.position.y += 300;
light1.castShadow = true;
light1.shadow.mapSize.width = 2048;
light1.shadow.mapSize.height = 2048;
light1.shadow.camera.near = 0.1; // default
light1.shadow.camera.far = 10000; 
scene.add(light1);

const light2 = new THREE.DirectionalLight( 0xfff9d8, 1 );
light2.position.z -= 3000;
light2.position.y += 220;
light2.position.x += 2000;
light2.castShadow = true;
light2.shadow.mapSize.width = 2048;
light2.shadow.mapSize.height = 2048;
light2.shadow.camera.near = 0.1; // default
light2.shadow.camera.far = 10000; 
// scene.add(light2);
// #endregion LIGHTS




// #region GUI & STATS
const stats = new Stats()
document.body.appendChild(stats.dom)

const gui = new GUI()
const cameraFolder = gui.addFolder('Camera')
cameraFolder.add(camera.position, 'x', 0, 20)
cameraFolder.add(camera.position, 'y', 0, 20)
cameraFolder.add(camera.position, 'z', 0, 20)

const lightFolder = gui.addFolder('lights')
const light1Folder = lightFolder.addFolder('1')
light1Folder.add(light1.position, 'x', -10000,10000)
light1Folder.add(light1.position, 'y', -10000,10000)
light1Folder.add(light1.position, 'z', -10000,10000)
const light2Folder = lightFolder.addFolder('2')
light2Folder.add(light2.position, 'x', -10000,10000)
light2Folder.add(light2.position, 'y', -10000,10000)
light2Folder.add(light2.position, 'z', -10000,10000)
// #endregion GUI & STATS


//#region BOLA COLLIDER
const bolaBody = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(0,bola.children[0].position.y,0))
bola.updateMatrixWorld(true) // ensure world matrix is up to date
const bolaMesh = bola.children[0] as THREE.Mesh
const bolapoints = new Float32Array(bolaMesh.geometry.attributes.position.array)
const bolaindices = new Uint32Array((bolaMesh.geometry.index as THREE.BufferAttribute).array)
const bolaShape = (RAPIER.ColliderDesc.trimesh(new Float32Array(bolapoints),new Uint32Array(bolaindices))as RAPIER.ColliderDesc).setMass(12).setFriction(0)
world.createCollider(bolaShape,bolaBody)
//#endregion






// #region CACHARRO COLLIDER
const cacharroBody = world.createRigidBody(RAPIER.RigidBodyDesc.fixed())
cacharro.updateMatrixWorld(true) // ensure world matrix is up to date

//metal
const cacharroMesh = cacharro.children[0].children[0] as THREE.Mesh
const points = new Float32Array(cacharroMesh.geometry.attributes.position.array)
const indices = new Uint32Array((cacharroMesh.geometry.index as THREE.BufferAttribute).array)
const cacharroShape = (RAPIER.ColliderDesc.trimesh(new Float32Array(points),new Uint32Array(indices))as RAPIER.ColliderDesc).setMass(12)
world.createCollider(cacharroShape,cacharroBody)

//non metal
const cacharroMesh1 = cacharro.children[0].children[1] as THREE.Mesh
const points1 = new Float32Array(cacharroMesh1.geometry.attributes.position.array)
const indices1 = new Uint32Array((cacharroMesh1.geometry.index as THREE.BufferAttribute).array)
const cacharroShape1 = (RAPIER.ColliderDesc.trimesh(new Float32Array(points1),new Uint32Array(indices1))as RAPIER.ColliderDesc).setMass(12).setFriction(0)
world.createCollider(cacharroShape1,cacharroBody)

// #endregion





// #region MANGO COLLIDER
//MUST ADD A JOINT BETWEEN cacharroMesh and cacharroSHape1(metal) SO GRAVITY WONT PULL DOWN WHEN TOUCHED
const mangoBody = world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(0, 1.22, mango.children[0].position.z ).setCanSleep(true))
mango.updateMatrixWorld(true)
const mangoMesh = mango.children[0] as THREE.Mesh
mangoMesh.position.z = 0
mangoMesh.rotation.z-= Math.PI/2
const mangoPoints = new Float32Array(mangoMesh.geometry.attributes.position.array)
const mangoindices = new Uint32Array((mangoMesh.geometry.index as THREE.BufferAttribute).array)
const mangoShape = (RAPIER.ColliderDesc.trimesh(new Float32Array(mangoPoints),new Uint32Array(mangoindices))as RAPIER.ColliderDesc).setMass(0)
world.createCollider(mangoShape,mangoBody)
dynamicBodies.push([mango, mangoBody])
// #endregion



// #region FLOOR
const floorSize = {x:10, z:10}
const floorMaterial = new THREE.MeshPhysicalMaterial({
  color: new THREE.Color(0xbabaca),
  side: THREE.DoubleSide
})
const floor = new THREE.Mesh(new THREE.PlaneGeometry(floorSize.x,floorSize.z), floorMaterial)
floor.rotateX(-Math.PI/2)
floor.receiveShadow = true
scene.add(floor)
//FLOOR COLLIDER
const floorBody = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(0, -0.0999, 0))
const floorShape = RAPIER.ColliderDesc.cuboid(floorSize.x/2, 0.1, floorSize.z/2)
world.createCollider(floorShape, floorBody)
// #endregion FLOOR





// #region COIN 
const coinMaterial = new THREE.MeshPhongMaterial({
  color: new THREE.Color(0xffffff),
  side: THREE.DoubleSide
})
const coinGeometry = new THREE.CylinderGeometry( 0.02, 0.02, 0.005, 16 ); 
const coin = new THREE.Mesh(coinGeometry, coinMaterial)
coin.name = 'coin'
coin.castShadow = true
coin.position.x = 0.5
coin.position.y = 1
coin.position.z = 0.5
coin.rotateX(Math.PI/2)
scene.add( coin );
//COLLIDER
const coinBody = world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(0.5, 1, 0.5).setCanSleep(true))
const coinShape = RAPIER.ColliderDesc.cylinder(0.0025, 0.02).setMass(5).setRestitution(0.85)
world.createCollider(coinShape, coinBody)
dynamicBodies.push([coin, coinBody])
// #endregion COIN


//BALLZ
// #region BALLZ
const ballRadius = 0.09
const scale = 3*ballRadius
const angleStep = Math.PI/3

for(let theta=Math.PI/3; theta<2*Math.PI; theta= theta+angleStep){
  for(let phi=0; phi<2*Math.PI; phi= phi+angleStep){
    const position = new THREE.Vector3(
      scale* Math.cos(theta)*Math.sin(phi),
      2+scale*Math.sin(theta)*Math.sin(phi),
      scale* Math.cos(theta),
    )
    const bolaMaterial  = (bola.children[0] as THREE.Mesh).material as THREE.MeshPhysicalMaterial
    let material = bolaMaterial.clone()
    material.roughness = Math.random()*0.6+0.1
    let ball = await Ballz.addNewBall(scene,world,ballRadius,position, material)
    dynamicBodies.push(ball)
  }
}
// #endregion BALLZ




// #region CONTROLS
let orbitControls = new OrbitControls(camera, renderer.domElement)
orbitControls.enableRotate = false
// orbitControls.autoRotate = true
// orbitControls.autoRotateSpeed= 0.3
let flyControls = new FlyControls( camera, renderer.domElement );
flyControls.movementSpeed = 1.7;
flyControls.domElement = renderer.domElement;
flyControls.rollSpeed = Math.PI / 24;
flyControls.autoForward = false;
flyControls.dragToLook = true;


// #region MANGO CONTROLS
let mouseMovement = {x: 0, y:0}
let mousePosition = {x: 0, y:0}
document.addEventListener('mousemove',(event)=>{
  mouseMovement = {x:event.movementX, y:event.movementY}
  mousePosition = {x:event.clientX, y: event.clientY}
})

const dragHandleControls = new DragControls( [mango], camera, renderer.domElement );
dragHandleControls.mode = 'rotate'
dragHandleControls.rotateSpeed = 0.5

dragHandleControls.addEventListener( 'dragstart', function ( event ) {
  console.log(event)
})

dragHandleControls.addEventListener( 'drag', function ( event ) {
	console.log(event.object.rotation.z*2*Math.PI)
  event.object.rotation.x = 0
  event.object.rotation.y= 0
  event.object.rotation.z -= (Math.abs(mouseMovement.x^2) + Math.abs(mouseMovement.y^2))/200
  dynamicBodies[0][1].setRotation({x:0,y:0,z:mango.quaternion.z,w:mango.quaternion.w},true)

    //need to detect if mouse is left or right to the rotation Z axis, and change the sign of each X, Y contribution
  
});
dragHandleControls.addEventListener( 'dragend', function (  ) {
  dynamicBodies[0][1].setTranslation(new RAPIER.Vector3(0, 1.22, 0.2998),true) 
  dynamicBodies[0][1].setRotation({x:mango.quaternion.x,y:mango.quaternion.y,z:mango.quaternion.z,w:mango.quaternion.w},true)
})
// #endregion MANGO CONTROLS





// #region COIN CONTROLS
const dragCoinControls = new DragControls( [coin], camera, renderer.domElement );
let isCoinDragged = false
dragCoinControls.addEventListener( 'dragstart', function (event) {
  isCoinDragged = true
  event.object.position.z = 0.2999
  event.object.rotation.x = 0
  event.object.rotation.y= 0
  event.object.rotateX(Math.PI/2)
})
dragCoinControls.addEventListener( 'drag', function (event) {
  event.object.position.z = 0.2999
})
dragCoinControls.addEventListener( 'dragend', function ( event ) {
  event.object.position.z = 0.2999
  isCoinDragged = false
  dynamicBodies[1][1].setTranslation(new RAPIER.Vector3(event.object.position.x,event.object.position.y,event.object.position.z),true) 
  //MUST SET DIRECTION FROM WHEREVER CAMERA IS LOOKING 
  //resulting vector should substract "cacharro" pointing vector ( +Z or (0,0,1)) from camera pointing vector, so mouseMovementXY is applied NOT only on XY, which is current behavior
  // should try addScaledVector
  dynamicBodies[1][1].setLinvel(new RAPIER.Vector3(mouseMovement.x/10, -mouseMovement.y/8, 0),true)

  dynamicBodies[1][1].setRotation(event.object.quaternion,true)
  dynamicBodies[1][1].setAngvel(new RAPIER.Vector3(30*Math.random()-15,30*Math.random()-15,30*Math.random()-15),true)
  
})
// #endregion COIN CONTROLS
// #endregion CONTROLS







//ANIMATION LOOP
const clock = new THREE.Clock()
let delta = 0
function animate() {
  requestAnimationFrame(animate)

  delta = clock.getDelta()
  if(cacharro){
    let pos = new THREE.Vector3(cacharro.position.x, cacharro.position.y +1.3, cacharro.position.z)
    camera.lookAt(pos)
  }
  world.timestep = Math.min(delta, 0.1)
  world.step()
  for (let i = 0, n = dynamicBodies.length; i < n; i++) {
    
    if(isCoinDragged){
      dynamicBodies[1][1].sleep()
      if(i != 1){
        dynamicBodies[i][0].position.copy(dynamicBodies[i][1].translation())
        dynamicBodies[i][0].quaternion.copy(dynamicBodies[i][1].rotation())
      }
    }else{
      dynamicBodies[i][1].wakeUp()
      dynamicBodies[i][0].position.copy(dynamicBodies[i][1].translation())
      dynamicBodies[i][0].quaternion.copy(dynamicBodies[i][1].rotation())

    }
    // dynamicBodies[i][1].sleep()  //comment this line to make balls stop in the air
  }
  camera.position.lerp(new THREE.Vector3(0.5,0.5,3), delta/17)
  // rapierDebugRenderer.update()
  // orbitControls.update(delta)
  flyControls.update( delta );
  renderer.render(scene, camera)
  stats.update()
}

animate()