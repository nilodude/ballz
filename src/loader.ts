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

interface RugShaderConfig {
    threadWidth: number;
    threadHeight: number;
    spacing: number;
}

async function loadElementsAsShader(data: any, scene: THREE.Scene, config: RugShaderConfig = {
    threadWidth: 0.015,
    threadHeight: 0.02,
    spacing: 0.001
    }) {
    const cylinderGeometry = new THREE.CylinderGeometry(
        config.threadWidth/2,
        config.threadWidth/2,
        config.threadHeight,
        6,
        1,
        false
    );
    const instancedGeometry = new THREE.InstancedBufferGeometry();
    instancedGeometry.copy(cylinderGeometry as any);
    const count = data.length;

    const positions = new Float32Array(count * 3); // X, Y, Z para cada instancia
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
        positions[i * 3 + 0] = data[i].x;
        positions[i * 3 + 1] = data[i].y;
        positions[i * 3 + 2] = data[i].z;

        const cylinder = data[i];
        // if (cylinder.material instanceof THREE.MeshPhysicalMaterial) {
        //     debugger
            colors[i * 3 + 0] = cylinder.material.color.r;
            colors[i * 3 + 1] = cylinder.material.color.g;
            colors[i * 3 + 2] = cylinder.material.color.b;
        // }
    }

    const instancePosition = new THREE.InstancedBufferAttribute(positions, 3);
    instancedGeometry.setAttribute('instancePosition', instancePosition);

    // Add the colors as an instance attribute
    const instanceColor = new THREE.InstancedBufferAttribute(colors, 3);
    instancedGeometry.setAttribute('instanceColor', instanceColor);
        
    // Shader personalizado para usar el atributo `instancePosition`
    const vertexShader = `
        attribute vec3 instancePosition;
        attribute vec3 instanceColor;  // Add this
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        varying vec3 vColor;          // Add this

        void main() {
            vec3 transformed = position + instancePosition;
            vUv = uv;
            vNormal = normalMatrix * normal;
            vColor = instanceColor;    // Pass color to fragment shader
            vec4 mvPosition = modelViewMatrix * vec4(transformed, 1.0);
            vViewPosition = -mvPosition.xyz;
            gl_Position = projectionMatrix * mvPosition;
        }
    `;  
    // Update the fragment shader to use the passed color:
    const fragmentShader = `
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        varying vec3 vColor;          // Add this

        void main() {
            vec3 normal = normalize(vNormal);
            vec3 viewDir = normalize(vViewPosition);
            vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0));

            float diff = max(dot(normal, lightDir), 0.0);
            vec3 ambient = vColor * 0.3;        // Use vColor instead of uniform
            vec3 diffuse = vColor * diff;       // Use vColor instead of uniform

            vec3 h = normalize(lightDir + viewDir);
            float specular = pow(max(dot(normal, h), 0.0), 32.0) * 0.2;

            vec3 finalColor = mix(ambient, diffuse, 0.7) + specular;
            gl_FragColor = vec4(finalColor, 1.0);
        }
    `;

      const texture = await loadTexture("moon", 'jpg');
  
      // Material con los shaders personalizados
      const material = new THREE.ShaderMaterial({
        // uniforms: {
        //     uTexture: { value: texture } // Pasa la textura como uniform al shader
        // },
        vertexShader,
        fragmentShader,
        side: THREE.DoubleSide
      });

      
           

    const mesh = new THREE.InstancedMesh(instancedGeometry, material, count);
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    scene.add(mesh);
    return {mesh: mesh, positions: positions, instancePosition: instancePosition, newPosition: JSON.parse(JSON.stringify(positions))};
}

async function loadRugWithShader(scene: THREE.Scene, imagePath: string,add:boolean = false, config: RugShaderConfig = {
    threadWidth: 0.015,
    threadHeight: 0.02,
    spacing: 0.001
}, downsample: number = 1): Promise<THREE.Object3D> {
    return new Promise((resolve) => {
        const imageLoader = new THREE.ImageLoader();
        imageLoader.load(imagePath, (image) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d')!;
            canvas.width = image.width;
            canvas.height = image.height;
            ctx.drawImage(image, 0, 0);
            const imageData = ctx.getImageData(0, 0, image.width, image.height);

            const threads = new THREE.Group();
            
            // Calculate total rug size
            const rugWidth = config.spacing * image.width;
            const rugHeight = config.spacing * image.height;
            
            // Center offset
            const offsetX = -rugWidth / 2;
            const offsetZ = -rugHeight / 2;

            // Create base cylinder geometry
            const cylinderGeometry = new THREE.CylinderGeometry(
                config.threadWidth/2,
                config.threadWidth/2,
                config.threadHeight,
                6,
                1,
                false
            );

            // Thread shader
            const threadMaterial = new THREE.ShaderMaterial({
                uniforms: {
                    color: { value: new THREE.Vector3() },
                    roughness: { value: 0.2 },
                    metalness: { value: 0.0 },
                    clearcoat: { value: 0.1 }
                },
                vertexShader: `
                    varying vec3 vNormal;
                    varying vec3 vViewPosition;
                    
                    void main() {
                        vNormal = normalMatrix * normal;
                        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                        vViewPosition = -mvPosition.xyz;
                        gl_Position = projectionMatrix * mvPosition;
                    }
                `,
                fragmentShader: `
                    uniform vec3 color;
                    uniform float roughness;
                    uniform float metalness;
                    uniform float clearcoat;
                    
                    varying vec3 vNormal;
                    varying vec3 vViewPosition;
                    
                    void main() {
                        vec3 normal = normalize(vNormal);
                        vec3 viewDir = normalize(vViewPosition);
                        vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0));
                        
                        float diff = max(dot(normal, lightDir), 0.0);
                        vec3 ambient = color * 0.3;
                        vec3 diffuse = color * diff;
                        
                        vec3 h = normalize(lightDir + viewDir);
                        float specular = pow(max(dot(normal, h), 0.0), 32.0) * (1.0 - roughness);
                        
                        vec3 finalColor = mix(ambient, diffuse, 0.7) + specular * clearcoat;
                        
                        gl_FragColor = vec4(finalColor, 1.0);
                    }
                `,
                side: THREE.DoubleSide
            });

            // Create individual cylinders
            for(let x = 0; x < image.width; x += downsample) {
                for(let z = 0; z < image.height; z += downsample) {
                    const i = (z * image.width + x) * 4;
                    const r = imageData.data[i];
                    const g = imageData.data[i + 1];
                    const b = imageData.data[i + 2];
                    const a = imageData.data[i + 3];

                    if(a > 0) {
                        // Create new material instance for this thread
                        const material = threadMaterial.clone();
                        material.uniforms.color.value.set(r/255, g/255, b/255);
                        
                        const thread = new THREE.Mesh(cylinderGeometry, material);
                        thread.castShadow = true;
                        thread.receiveShadow = true;
                        
                        // Position thread
                        thread.position.set(
                            offsetX + x * config.spacing,
                            config.threadHeight/2,
                            offsetZ + z * config.spacing
                        );

                        // Add slight random rotation
                        thread.rotation.set(
                            (Math.random() - 0.5) * 0.2,
                            0,
                            (Math.random() - 0.5) * 0.2
                        );

                        threads.add(thread);
                    }
                }
            }

            if(add) scene.add(threads);
            resolve(threads);
        });
    });
}


export {
    loadModel,
    loadImage,
    loadRugWithShader,
    loadElementsAsShader,
    type RugShaderConfig
}
