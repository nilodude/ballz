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
async function loadImage(scene: THREE.Scene,path: string, add:boolean = true, downsample: number = 1){
    return new Promise((resolve) => {
    imageloader.load(path,
        (imageBitmap ) =>{
            // console.log(imageBitmap)
            const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d')!;
                canvas.width = imageBitmap.width;
                canvas.height = imageBitmap.height;
                ctx.drawImage(imageBitmap, 0, 0);
                
                const pixelData = ctx.getImageData(0, 0, imageBitmap.width, imageBitmap.height);
                const threads = new THREE.Group();
                
                // Thread properties
                const threadWidth = 0.015;
                const threadHeight = 0.05;
                const spacing = 0.001;
                
                // Create thread geometry (reusable)
                const threadGeometry = new THREE.CylinderGeometry(
                    threadWidth/2,
                    threadWidth/2,
                    threadHeight,
                    6,
                    1,
                    false
                );
                
                // Calculate total rug size
                const rugWidth = spacing * imageBitmap.width;
                const rugHeight = spacing * imageBitmap.height;
                
                // Center offset
                const offsetX = -rugWidth / 2;
                const offsetZ = -rugHeight / 2;

                // Create threads
                for(let x = 0; x < imageBitmap.width; x += downsample) {
                    for(let z = 0; z < imageBitmap.height; z += downsample) {
                        const i = (z * imageBitmap.width + x) * 4;
                        const r = pixelData.data[i];
                        const g = pixelData.data[i + 1];
                        const b = pixelData.data[i + 2];
                        const a = pixelData.data[i + 3];

                        if(a > 0) {
                            const threadMaterial = new THREE.MeshPhysicalMaterial({
                                color: new THREE.Color(r/255, g/255, b/255),
                                roughness: 0.8,
                                metalness: 0,
                                clearcoat: 0.1,
                                clearcoatRoughness: 0.8
                            });

                            const thread = new THREE.Mesh(threadGeometry, threadMaterial);
                            thread.castShadow = true;
                            thread.receiveShadow = true;
                            
                            // Position thread
                            thread.position.set(
                                offsetX + x * spacing,
                                threadHeight/2,
                                offsetZ + z * spacing
                            );

                            // Add slight random rotation for more natural look
                            thread.rotation.set(
                                (Math.random() - 0.5) * 0.2,
                                0,
                                (Math.random() - 0.5) * 0.2
                            );

                            threads.add(thread);
                        }
                    }
                }
	        if(add){
                scene.add( threads );
            }
            resolve(threads);
        },
	    undefined,
	    ( err:any ) =>{
	    	console.log( 'An error happened',err ); 
            resolve(null);
	    }
    );
    })
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
