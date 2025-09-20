import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const gltfloader = new GLTFLoader()


async function loadModel(scene: THREE.Scene,path: string, add:boolean = true){
    let model = new THREE.Group<THREE.Object3DEventMap>()
    const gltf = await gltfloader.loadAsync('./'+path+'.glb')
    model =  gltf.scene
    // console.log(path,model)
    model.traverse((node:any)=>{
        if(node.isMesh){
            node.castShadow = true
            model.receiveShadow = true
        }
        // scene.add(node)
        if(add)console.log(path,node.name,node)
    })
    if(add){
        scene.add(model)
    }
    return model
}

const imageloader = new THREE.ImageBitmapLoader();
async function loadImage(scene: THREE.Scene,path: string, add:boolean = true){
    let image = new THREE.Mesh( );
    imageloader.load(path,
        (imageBitmap ) =>{
            console.log(imageBitmap)
            const texture = new THREE.CanvasTexture( imageBitmap );
	        const material = new THREE.MeshBasicMaterial( { map: texture } );
            const geometry = new THREE.BoxGeometry(imageBitmap.width/70, imageBitmap.height/70, 2);
            image = new THREE.Mesh( geometry, material );
	        image.position.set( Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1 );
	        image.rotation.set( Math.random() * 2 * Math.PI, Math.random() * 2 * Math.PI, Math.random() * 2 * Math.PI );
	        if(add){
                scene.add( image );
            }
        },
	    undefined,
	    ( err:any ) =>{
	    	console.log( 'An error happened',err ); 
	    }
    );
    return image
}

async function loadTexture(name:any, ext:any){
    const texture = new THREE.TextureLoader().load('./' + name + '.' + ext );
    if(name=='saturn_ring'){
        texture.rotation = Math.PI/2;
    }
    return texture;
}

export {
    loadModel,
    loadImage,
}
