import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import Stats from 'three/addons/libs/stats.module.js'
import { GUI } from 'dat.gui'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const objLoader = new OBJLoader();
const textureLoader = new THREE.TextureLoader()
const loader = new GLTFLoader();

let cacharro = new THREE.Group<THREE.Object3DEventMap>()
let isLoaded = false

loader.load('./models/cacharro.glb', function (gltf) {
  console.log(gltf)
  cacharro = gltf.scene
  scene.add(cacharro);
  isLoaded = true
}, undefined, function (error) {
  console.error(error);
});

//SCENE
const scene = new THREE.Scene()
scene.add(new THREE.AxesHelper(5))

//CAMERA
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
camera.position.x = 0.75
camera.position.y = 2.1
camera.position.z = 2.3

if(isLoaded){
  camera.lookAt(cacharro.position)
}
//RENDERER
const renderer = new THREE.WebGLRenderer()
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)

new OrbitControls(camera, renderer.domElement)

//STATS (FPS)
const stats = new Stats()
document.body.appendChild(stats.dom)

//RESIZE EVENT LISTENER
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})


//WORLD OBJECTS
scene.background = new THREE.CubeTextureLoader().setPath('https://sbcode.net/img/').load(['px.png', 'nx.png', 'py.png', 'ny.png', 'pz.png', 'nz.png'])
scene.backgroundBlurriness = 0

//LIGHTS
const directionalLight = new THREE.DirectionalLight( 0xffffff, 3 );
directionalLight.position.z += 1000;
directionalLight.position.y += 100;
scene.add( directionalLight );


const gui = new GUI()

const cameraFolder = gui.addFolder('Camera')
cameraFolder.add(camera.position, 'x', 0, 20)
cameraFolder.add(camera.position, 'y', 0, 20)
cameraFolder.add(camera.position, 'z', 0, 20)
cameraFolder.open()


//ANIMATION LOOP
const clock = new THREE.Clock()
let delta



function animate() {
  requestAnimationFrame(animate)

  delta = clock.getDelta()
  if(isLoaded){
    let pos = new THREE.Vector3(cacharro.position.x, cacharro.position.y +1, cacharro.position.z)
    camera.lookAt(pos)
  }
  renderer.render(scene, camera)
  stats.update()
}

animate()