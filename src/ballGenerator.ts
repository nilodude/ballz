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

async function createBallBody(world: RAPIER.World, ballRadius: number,position: THREE.Vector3){     
      const ballBody = world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(position.x, position.y, position.z).setCanSleep(true))
      const ballShape = RAPIER.ColliderDesc.ball(ballRadius).setMass(2).setRestitution(0.65).setFriction(0)
      world.createCollider(ballShape, ballBody)
      ballBody.sleep()
      return ballBody
}

async function addNewBall( scene: THREE.Scene,world: RAPIER.World,ballRadius: number, position: THREE.Vector3, material:  THREE.MeshPhysicalMaterial ){
    let ball = await createBallMesh(ballRadius, material) as THREE.Object3D
    scene.add( ball );

    let ballBody = await createBallBody(world, ballRadius, position) as RAPIER.RigidBody
    let bodies = [ball, ballBody]
    return bodies as [THREE.Object3D<THREE.Object3DEventMap>, RAPIER.RigidBody]
}

export {
    createBallMesh,
    createBallBody,
    addNewBall
}

