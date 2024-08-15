import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const loader = new GLTFLoader()


async function loadModel(scene: THREE.Scene,path: string){
    let model = new THREE.Group<THREE.Object3DEventMap>()
    const gltf = await loader.loadAsync('./'+path+'.glb')
    console.log(gltf)
    model =  gltf.scene
    model.traverse((node:any)=>{
        if(node.isMesh){
            node.castShadow = true
            model.receiveShadow = true
        }
    })
   
    scene.add(model)
    return model
}


export {
    loadModel
}
