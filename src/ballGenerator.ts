import * as THREE from 'three'
import RAPIER from '@dimforge/rapier3d-compat'


async function createBallMesh(ballRadius:number, material: THREE.MeshPhysicalMaterial){
    const ballMaterial = material || new THREE.MeshPhongMaterial({
        color: new THREE.Color(Math.random()*255,Math.random()*255,Math.random()*255),
        side: THREE.DoubleSide
      })
      material.color = new THREE.Color(Math.random(),0,Math.random())
      ballRadius = ballRadius || 0.09
      const ballGeometry = new THREE.SphereGeometry(ballRadius, 20, 20); 
      const ball = new THREE.Mesh(ballGeometry, ballMaterial)
      ball.castShadow = true
      return ball
}

async function createBallBody(world: RAPIER.World, ballRadius: number,position: THREE.Vector3, mass:number){     
      const ballBody = world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(position.x, position.y, position.z).setCanSleep(true))
      const ballShape = RAPIER.ColliderDesc.ball(ballRadius).setMass(mass).setRestitution(0.65).setFriction(1)
      world.createCollider(ballShape, ballBody)
      ballBody.sleep()
      return ballBody
}

async function addNewBall( scene: THREE.Scene,world: RAPIER.World,ballRadius: number, position: THREE.Vector3,mass:number = 2, material:  THREE.MeshPhysicalMaterial ){
    let ball = await createBallMesh(ballRadius, material) as THREE.Object3D
    scene.add( ball );

    let ballBody = await createBallBody(world, ballRadius, position,mass) as RAPIER.RigidBody
    let bodies = [ball, ballBody]
    return bodies as [THREE.Object3D<THREE.Object3DEventMap>, RAPIER.RigidBody]
}

async function addNewObject( scene: THREE.Scene,world: RAPIER.World,geometry:any, position: THREE.Vector3,mass:number = 2, material:  THREE.MeshPhysicalMaterial ){
    let mesh = await createMesh(geometry,material) as THREE.Object3D
    scene.add( mesh );

    let body = await createBody(world,geometry,  position,mass) as RAPIER.RigidBody
    let bodies = [mesh, body]
    return bodies as [THREE.Object3D<THREE.Object3DEventMap>, RAPIER.RigidBody]
}


async function createMesh(geometry:any, material: THREE.MeshPhysicalMaterial){
      const mesh = new THREE.Mesh(geometry, material)
      mesh.castShadow = true
      return mesh
}

async function createBody(world: RAPIER.World,geometry:any,position: THREE.Vector3, mass:number){     
    const body = world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(position.x, position.y, position.z).setCanSleep(true))
    const points = new Float32Array(geometry.attributes.position.array)
    const indices = new Uint32Array((geometry.index as THREE.BufferAttribute).array)
    const shape = (RAPIER.ColliderDesc.trimesh(new Float32Array(points),new Uint32Array(indices))as RAPIER.ColliderDesc).setMass(mass)
    world.createCollider(shape,body)
    body.sleep()
    return body
}


export {
    createBallMesh,
    createBallBody,
    addNewBall,
    addNewObject
}

