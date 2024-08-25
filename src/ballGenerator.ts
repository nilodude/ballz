import * as THREE from 'three'
import RAPIER from '@dimforge/rapier3d-compat'


async function createBallMesh(ballRadius:number, material: THREE.Material){
    const ballMaterial = material || new THREE.MeshPhongMaterial({
        color: new THREE.Color(0xffffff),
        side: THREE.DoubleSide
      })
        ballRadius = ballRadius || 0.09
      const ballGeometry = new THREE.SphereGeometry(ballRadius, 10, 10); 
      const ball = new THREE.Mesh(ballGeometry, ballMaterial)
      ball.castShadow = true
    //   ball.position.x = 1
    //   ball.position.y = 1
    //   ball.position.z = 1
      return ball
}

async function createBallBody(world: RAPIER.World, ballRadius: number,position: THREE.Vector3){     
      const ballBody = world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(position.x, position.y, position.z).setCanSleep(true))
      const ballShape = RAPIER.ColliderDesc.ball(ballRadius).setMass(10).setRestitution(0.75)
      world.createCollider(ballShape, ballBody)
      return ballBody
}

async function addNewBall( scene: THREE.Scene,world: RAPIER.World,ballRadius: number, position: THREE.Vector3, material:  THREE.Material ){
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

