import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { FlyControls } from 'three/addons/controls/FlyControls.js';
import { FirstPersonControls } from 'three/addons/controls/FirstPersonControls.js';
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
let dynamicBodies: [THREE.Object3D, RAPIER.RigidBody][] = []


//SCENE
const scene = new THREE.Scene()
scene.add(new THREE.AxesHelper(5))
let environmentTexture = new THREE.CubeTextureLoader().setPath('./').load(['space.hdr'])
scene.background = environmentTexture
scene.environment = environmentTexture
scene.backgroundBlurriness = 0

const rapierDebugRenderer = new RapierDebugRenderer(scene, world)


//#region LOAD MODELS
let bola = new THREE.Group<THREE.Object3DEventMap>()
let cacharro = new THREE.Group<THREE.Object3DEventMap>()
let mango = new THREE.Group<THREE.Object3DEventMap>()
let escenario = new THREE.Group<THREE.Object3DEventMap>()
let plataformas: THREE.Object3D<THREE.Object3DEventMap>[]  = []
let barril = new THREE.Group<THREE.Object3DEventMap>()
// maybe worth it to finetune MeshPhysicalMaterial to look like glass, but for that to work, scene needs ENVIRONMENT lighting setup correctly
bola = await Loader.loadModel(scene,'bola2', true)
cacharro = await Loader.loadModel(scene,'cacharro2', true)
mango  = await Loader.loadModel(scene,'mango')
mango.position.y += 1.22293
mango.rotation.z -= Math.PI/2

escenario  = await Loader.loadModel(scene,'escenario001', false)
plataformas = escenario.children.filter(c=>c.name.includes('Cube') /*||c.name =='fondo'*/)

barril  = await Loader.loadModel(scene,'barril', false)

// const imagen = await Loader.loadImage(scene, 'f3.jpg',true)
let balon  = await Loader.loadModel(scene,'nilobasketball', false)

let canasta  = await Loader.loadModel(scene,'CANASTA', true)
const bbox = new THREE.Box3();
bbox.setFromObject(canasta.children[0]); // This will include all children

const totalHeight = bbox.max.y - bbox.min.y;
canasta.children[0].children.forEach(children=>{
  children.updateMatrixWorld(true)
  const canastaMesh = children as THREE.Mesh
  canastaMesh.position.y = canastaMesh.position.y+totalHeight*0.3
  const canastapoints = new Float32Array(canastaMesh.geometry.attributes.position.array)
  const canastaindices = new Uint32Array((canastaMesh.geometry.index as THREE.BufferAttribute).array)
  const canastaShape = (RAPIER.ColliderDesc.trimesh(new Float32Array(canastapoints),new Uint32Array(canastaindices))as RAPIER.ColliderDesc).setMass(120)
  const canastaQuaternion = new THREE.Quaternion().setFromEuler(canastaMesh.rotation);
  const canastaBody = world.createRigidBody(RAPIER.RigidBodyDesc.fixed()
    .setTranslation(canastaMesh.position.x, canastaMesh.position.y, canastaMesh.position.z)
    .setRotation({
      x: canastaQuaternion.x,
      y: canastaQuaternion.y,
      z: canastaQuaternion.z,
      w: canastaQuaternion.w
    })
  )
  world.createCollider(canastaShape,canastaBody)
})

const pista = await Loader.loadModel(scene, 'pistabasket',true)
console.log(pista)
pista.children.forEach(async (children:any)=>{
console.log(children)
  children.receiveShadow = true
  let pistaBody = await Ballz.createBody(world, children.geometry, children.position,500, true) as RAPIER.RigidBody
})
//#endregion LOAD MODELS



// #region CAMERA & RENDERER
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000)

camera.position.x = 0.5
camera.position.y = 1.86
camera.position.z = 3




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
// const listener = new THREE.AudioListener();
// camera.add( listener );

// const sound = new THREE.Audio( listener );

// const audioLoader = new THREE.AudioLoader();
// audioLoader.load( 'temito.mp3', function( buffer ) {
// 	// sound.setBuffer( buffer );
// 	// sound.setLoop( true );
// 	// sound.setVolume( 0.5 );
//   // sound.autoplay = true
//   // sound.hasPlaybackControl = true
// 	// sound.play();
// });
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


// Ballz.createCrosshair(scene)


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
// dynamicBodies.push([mango, mangoBody])
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
// scene.add(floor)
//FLOOR COLLIDER
const floorBody = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(0, -0.0999, 0))
const floorShape = RAPIER.ColliderDesc.cuboid(floorSize.x/2, 0.1, floorSize.z/2)
// world.createCollider(floorShape, floorBody)
// #endregion FLOOR




//#region PLATAFORMAS COLLIDER
plataformas.forEach(plataforma=>{
  
  const plataformaQuaternion = new THREE.Quaternion().setFromEuler(plataforma.rotation);
  const plataformaBody = world.createRigidBody(RAPIER.RigidBodyDesc.fixed()
    .setTranslation(plataforma.position.x, plataforma.position.y, plataforma.position.z)
    .setRotation({
      x: plataformaQuaternion.x,
      y: plataformaQuaternion.y,
      z: plataformaQuaternion.z,
      w: plataformaQuaternion.w
    })
  )
  
  plataforma.updateMatrixWorld(true)
  const plataformaMesh = plataforma as THREE.Mesh
  const points = new Float32Array(plataformaMesh.geometry.attributes.position.array)
  const indices = new Uint32Array((plataformaMesh.geometry.index as THREE.BufferAttribute).array)
  const plataformaShape = (RAPIER.ColliderDesc.trimesh(new Float32Array(points),new Uint32Array(indices))as RAPIER.ColliderDesc).setMass(120)
  // world.createCollider(plataformaShape,plataformaBody)
  
  // scene.add(plataforma)
})
//#endregion



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
    // TODO: probably collider sometimes fail because it should be slightly bigger than the mesh
    // let ball = await Ballz.addNewBall(scene,world,ballRadius,position,undefined, material)
    // dynamicBodies.push(ball)
  }
}
// #endregion BALLZ




// #region CONTROLS
const moveSpeed = 15  
const moveState = {
    forward: false,
    backward: false,
    left: false,
    right: false
}

const cameraRotation = {
  x: 0, // vertical rotation (pitch)
  y: 0  // horizontal rotation (yaw)
}
const mouseSensitivity = 0.0015 

let mouseMovement = {x: 0, y:0}
let mousePosition = {x: 0, y:0}

const jumpState = {
    velocity: 0,
    isGrounded: true,
    jumpCount: 0,
    maxJumps: Infinity, 
    initialJumpSpeed: 8,
    gravity: 10
}
document.addEventListener('mousemove',(event)=>{
  mouseMovement = {x:event.movementX, y:event.movementY}
  mousePosition = {x:event.clientX, y: event.clientY}

  cameraRotation.y -= mouseMovement.x * mouseSensitivity
  cameraRotation.x -= mouseMovement.y * mouseSensitivity
  
  // clamp vertical rotation to prevent camera flipping
  cameraRotation.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, cameraRotation.x))
  
  camera.rotation.order = 'YXZ' 
  camera.rotation.x = cameraRotation.x
  camera.rotation.y = cameraRotation.y
})
renderer.domElement.addEventListener('click', () => {
  renderer.domElement.requestPointerLock()
})
document.addEventListener('keydown', (event) => {
    switch(event.code) {
        case 'KeyW': moveState.forward = true; break
        case 'KeyS': moveState.backward = true; break
        case 'KeyA': moveState.left = true; break
        case 'KeyD': moveState.right = true; break
        case 'Space': 
          if (jumpState.jumpCount < jumpState.maxJumps) {
            const jumpPower = jumpState.jumpCount === 0 ? 
              jumpState.initialJumpSpeed : 
              jumpState.initialJumpSpeed * 0.8; 
            jumpState.velocity = jumpPower;
            jumpState.jumpCount++;
            jumpState.isGrounded = false;
          }
    }
})

document.addEventListener('keyup', (event) => {
    switch(event.code) {
        case 'KeyW': moveState.forward = false; break
        case 'KeyS': moveState.backward = false; break
        case 'KeyA': moveState.left = false; break
        case 'KeyD': moveState.right = false; break
    }
})


// #region MANGO CONTROLS
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


let balls:any = []

//#region SHOOT CONTROLS
window.addEventListener('mousedown', async (event:any) => {
  if(event.button == 0){
    const bolaMaterial  = (bola.children[0] as THREE.Mesh).material as THREE.MeshPhysicalMaterial
    let material = bolaMaterial.clone()
    material.roughness = Math.random()*0.6+0.1
    
    const mouse = new THREE.Vector2(
      (event.clientX / window.innerWidth) * 2 - 1,
      -(event.clientY / window.innerHeight) * 2 + 1
    )
    
    const raycaster = new THREE.Raycaster()
    raycaster.setFromCamera(mouse, camera)
    
    const shootingDirection = raycaster.ray.direction
    
    const offsetDistance = 1 
    const infrontOfCamera = new THREE.Vector3().addVectors(
      camera.position,
      shootingDirection.clone().multiplyScalar(offsetDistance)
    )
    
    const force = 100
    const balonparts = balon.children[0]
    let newbalon = await Ballz.addNewBall(scene, world,0.75,infrontOfCamera,force/15,(balonparts as THREE.Mesh).material as THREE.MeshPhysicalMaterial )
    newbalon[1].applyImpulse(new RAPIER.Vector3(force*shootingDirection.x, force*shootingDirection.y, force*shootingDirection.z),true)
    const rightVector = new THREE.Vector3()
    rightVector.crossVectors(shootingDirection, new THREE.Vector3(0, 1, 0)).normalize()
    const spinSpeed = 15 
    const randomVariation = 0.2 // 20% variation in spin
    const randomSpin = spinSpeed * (1 + (Math.random() - 0.5) * randomVariation)
    newbalon[1].setAngvel(new RAPIER.Vector3(
        rightVector.x * randomSpin,
        rightVector.y * randomSpin,
        rightVector.z * randomSpin
    ), true)

    balls.forEach((ball:any)=>{
      scene.remove(ball[0])
      scene.remove(ball[1])
      world.removeCollider(ball[2], true)
    })
    dynamicBodies = []
    dynamicBodies.push([newbalon[0], newbalon[1]])
    balls.push(newbalon)
  }
})
// #endregion SHOOT CONTROLS

// #endregion CONTROLS


// TODO: probably need to implement some of https://github.com/simondevyoutube/ThreeJS_Tutorial_FirstPersonCamera/blob/main/main.js
// to make controls natural

//ANIMATION LOOP
const clock = new THREE.Clock()
let delta = 0
function animate() {
  requestAnimationFrame(animate)

  delta = clock.getDelta()

  // #region Handle WASD movement
  if (moveState.forward || moveState.backward || moveState.left || moveState.right) {
    // Calculate forward direction from camera's rotation
    const forward = new THREE.Vector3(0, 0, -1)
    forward.applyQuaternion(camera.quaternion)
    forward.y = 0 // Keep movement horizontal
    forward.normalize()
    // Calculate right direction from forward
    const right = new THREE.Vector3(forward.z, 0, -forward.x)
    const moveVector = new THREE.Vector3(0, 0, 0)
    if (moveState.forward) moveVector.add(forward)
    if (moveState.backward) moveVector.sub(forward)
    if (moveState.right) moveVector.sub(right)
    if (moveState.left) moveVector.add(right)
    moveVector.normalize()
    moveVector.multiplyScalar(moveSpeed * delta)
    camera.position.add(moveVector)
  }
  
  jumpState.velocity -= jumpState.gravity * delta
  camera.position.y += jumpState.velocity * delta
  if (camera.position.y <= 1.86) { 
      camera.position.y = 1.86
      if (!jumpState.isGrounded) {
          jumpState.isGrounded = true
          jumpState.jumpCount = 0 
      }
      jumpState.velocity = 0
  }  
  //#endregion

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
    // dynamicBodies[i][1].sleep()  //uncomment this line to make balls stop in the air
  }
  // camera.position.lerp(new THREE.Vector3(0.5,0.5,3), delta/17)
  // rapierDebugRenderer.update()
  // orbitControls.update(delta)
  // flyControls.update( delta );


  renderer.render(scene, camera)
  stats.update()
}

animate()