import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { FlyControls } from 'three/addons/controls/FlyControls.js';
import { DragControls } from 'three/addons/controls/DragControls.js';
import Stats from 'three/addons/libs/stats.module.js'
import { GUI } from 'dat.gui'
import * as Loader from '../src/loader'

//SCENE
const scene = new THREE.Scene()
scene.add(new THREE.AxesHelper(5))
scene.background = new THREE.CubeTextureLoader().setPath('https://sbcode.net/img/').load(['px.png', 'nx.png', 'py.png', 'ny.png', 'pz.png', 'nz.png'])
scene.backgroundBlurriness = 0


//LOAD MODELS
let bola = new THREE.Group<THREE.Object3DEventMap>()
let cacharro = new THREE.Group<THREE.Object3DEventMap>()
let mango = new THREE.Group<THREE.Object3DEventMap>()

bola = await Loader.loadModel(scene,'bola')
cacharro = await Loader.loadModel(scene,'cacharro')
mango  = await Loader.loadModel(scene,'mango')

mango.position.y += 1.22293


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
light1.shadow.camera.near = 0.5; // default
light1.shadow.camera.far = 5000; 
scene.add(light1);

const light2 = new THREE.DirectionalLight( 0xfff9d8, 1 );
light2.position.z -= 3000;
light2.position.y += 220;
light2.position.x += 2000;
light2.castShadow = true;
light2.shadow.mapSize.width = 2048;
light2.shadow.mapSize.height = 2048;
light2.shadow.camera.near = 0.5; // default
light2.shadow.camera.far = 5000; 
scene.add(light2);

//GUI & STATS (FPS)
const stats = new Stats()
document.body.appendChild(stats.dom)

const gui = new GUI()
const cameraFolder = gui.addFolder('Camera')
cameraFolder.add(camera.position, 'x', 0, 20)
cameraFolder.add(camera.position, 'y', 0, 20)
cameraFolder.add(camera.position, 'z', 0, 20)


//CONTROLS
let orbitControls = new OrbitControls(camera, renderer.domElement)
orbitControls.enableRotate = false

let flyControls = new FlyControls( camera, renderer.domElement );
flyControls.movementSpeed = 1.7;
flyControls.domElement = renderer.domElement;
flyControls.rollSpeed = Math.PI / 24;
flyControls.autoForward = false;
flyControls.dragToLook = true;

let mouseMovement = {x: 0, y:0}

document.addEventListener('mousemove',(event)=>{
  mouseMovement = {x:event.movementX, y:event.movementY}
})

const dragControls = new DragControls( [mango], camera, renderer.domElement );
dragControls.mode = 'rotate'
dragControls.rotateSpeed = 0.5

dragControls.addEventListener( 'drag', function ( event ) {
	// console.log(event)
  event.object.rotation.x = 0
  event.object.rotation.y= 0
  event.object.rotation.z -= (Math.abs(mouseMovement.x^2) + Math.abs(mouseMovement.y^2))/200
  //need to detect if mouse is left or right to the rotation Z axis, and change the sign of each X, Y contribution
});

//CREATE WORLD OBJECTS
const floorMaterial = new THREE.MeshPhongMaterial({
  color: new THREE.Color(0xbabaca),
  shadowSide: THREE.FrontSide,
  side: THREE.FrontSide
})
const floor = new THREE.Mesh(new THREE.PlaneGeometry(20,20), floorMaterial)
floor.rotateX(-Math.PI/2)
floor.receiveShadow = true
scene.add(floor)


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
  
  flyControls.update( delta );
  renderer.render(scene, camera)
  stats.update()
}

animate()