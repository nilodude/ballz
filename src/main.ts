import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { FlyControls } from 'three/addons/controls/FlyControls.js';
import { DragControls } from 'three/addons/controls/DragControls.js';
import Stats from 'three/addons/libs/stats.module.js'
import { GUI } from 'dat.gui'
import * as Loader from '../src/loader'
import RAPIER from '@dimforge/rapier3d-compat'
import { RapierDebugRenderer } from '../src/debugRenderer'

await RAPIER.init() // This line is only needed if using the compat version

const gravity = new RAPIER.Vector3(0.0, -9.81, 0.0)
const world = new RAPIER.World(gravity)
const dynamicBodies: [THREE.Object3D, RAPIER.RigidBody][] = []


//SCENE
const scene = new THREE.Scene()
scene.add(new THREE.AxesHelper(5))
scene.background = new THREE.CubeTextureLoader().setPath('https://sbcode.net/img/').load(['px.png', 'nx.png', 'py.png', 'ny.png', 'pz.png', 'nz.png'])
scene.backgroundBlurriness = 0

const rapierDebugRenderer = new RapierDebugRenderer(scene, world)

//LOAD MODELS
let bola = new THREE.Group<THREE.Object3DEventMap>()
let cacharro = new THREE.Group<THREE.Object3DEventMap>()
let mango = new THREE.Group<THREE.Object3DEventMap>()

bola = await Loader.loadModel(scene,'bola')
cacharro = await Loader.loadModel(scene,'cacharro')
mango  = await Loader.loadModel(scene,'mango')

mango.position.y += 1.22293
mango.rotation.z -= Math.PI/2



//CAMERA
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
camera.position.x = 0.75
camera.position.y = 1.3
camera.position.z = 2.3

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


//LIGHTS
const light1 = new THREE.DirectionalLight( 0xfff9d8, 3 );
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
scene.add(light2);


//GUI & STATS (FPS)
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



//CREATE WORLD OBJECTS
//MODEL COLLIDER
const cacharroBody = world.createRigidBody(RAPIER.RigidBodyDesc.fixed())
const cacharroMesh = cacharro.children[0].children[0] as THREE.Mesh
console.log(cacharroMesh)
// const cacharroMesh =  cacharro.getObjectByName('cacharro') as THREE.Group
const points = new Float32Array(cacharroMesh.geometry.attributes.position.array)
const indices = new Uint32Array((cacharroMesh.geometry.index as THREE.BufferAttribute).array)
const cacharroShape = (RAPIER.ColliderDesc.trimesh(points,indices)as RAPIER.ColliderDesc).setMass(12)
// const cacharroShape = RAPIER.ColliderDesc.cuboid(10, 0.5, 10)
world.createCollider(cacharroShape,cacharroBody)


//FLOOR 
const floorMaterial = new THREE.MeshPhongMaterial({
  color: new THREE.Color(0xbabaca),
  side: THREE.DoubleSide
})
const floor = new THREE.Mesh(new THREE.PlaneGeometry(20,20), floorMaterial)
floor.rotateX(-Math.PI/2)
floor.receiveShadow = true
scene.add(floor)
//FLOOR COLLIDER
const floorBody = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(0, -0.0999, 0))
const floorShape = RAPIER.ColliderDesc.cuboid(10, 0.1, 10)
world.createCollider(floorShape, floorBody)



//COIN
const coinMaterial = new THREE.MeshPhongMaterial({
  color: new THREE.Color(0xb38f00),
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
//COIN COLLIDER
const coinBody = world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(0.5, 1, 0.5).setCanSleep(true))
const coinShape = RAPIER.ColliderDesc.cylinder(0.0025, 0.01).setMass(1).setRestitution(1.1)
world.createCollider(coinShape, coinBody)
dynamicBodies.push([coin, coinBody])


//CONTROLS
// let orbitControls = new OrbitControls(camera, renderer.domElement)
// orbitControls.enableRotate = false

let flyControls = new FlyControls( camera, renderer.domElement );
flyControls.movementSpeed = 1.7;
flyControls.domElement = renderer.domElement;
flyControls.rollSpeed = Math.PI / 24;
flyControls.autoForward = false;
flyControls.dragToLook = true;


//HANDLE CONTROLS
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
	console.log(event.object.rotation.z)
  event.object.rotation.x = 0
  event.object.rotation.y= 0

  //UP LEFT
  // if(mousePosition.x < window.innerWidth/2 ){
  //   event.object.rotation.z -= (mouseMovement.x^2 - mouseMovement.y^2)/200
  // }
  event.object.rotation.z -= (Math.abs(mouseMovement.x^2) + Math.abs(mouseMovement.y^2))/200

    //need to detect if mouse is left or right to the rotation Z axis, and change the sign of each X, Y contribution
  
});

//COIN CONTROLS
const dragCoinControls = new DragControls( [coin], camera, renderer.domElement );
let isCoinDragged = false
dragCoinControls.addEventListener( 'dragstart', function () {
  isCoinDragged = true
  coin.rotateX(Math.PI/2)
})
dragCoinControls.addEventListener( 'drag', function () {
  
})
dragCoinControls.addEventListener( 'dragend', function ( event ) {
  isCoinDragged = false
  dynamicBodies[0][1].setTranslation(new RAPIER.Vector3(event.object.position.x,event.object.position.y,event.object.position.z),true) 
  dynamicBodies[0][1].setLinvel(new RAPIER.Vector3(mouseMovement.x/10, -mouseMovement.y/8, 0),true)
  dynamicBodies[0][1].setAngvel(new RAPIER.Vector3(30*Math.random()-15,30*Math.random()-15,30*Math.random()-15),true)
})

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
      dynamicBodies[i][1].sleep()
      
    }else{
      dynamicBodies[i][1].wakeUp()
      dynamicBodies[i][0].position.copy(dynamicBodies[i][1].translation())
      dynamicBodies[i][0].quaternion.copy(dynamicBodies[i][1].rotation())
    }
    
  }
  rapierDebugRenderer.update()
  flyControls.update( delta );
  renderer.render(scene, camera)
  stats.update()
}

animate()