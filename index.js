

import * as THREE from './three/three.module.js';
import Stats from './three/stats.module.js';
import { GLTFLoader } from './three/GLTFLoader.js';
import {getBoardState, drawBoard, loadBoardState, parseBoard} from './2dindex.js'

let container, stats;
let camera, controls, scene, renderer;

const shakeValue = 0.02
let currentShake = 0

let movement = { forward: false, backward: false, left: false, right: false };
let yaw = 0, pitch = 0;
const moveSpeed = .5;

let dome 
let light
const pointer = new THREE.Vector2();
const boardSize = 8 * 10;
const tileSize = boardSize/8;
const pieceSize = boardSize * .025

const renderFar = 999999

const skyboxSize = 2000

const progressSpeed = .003

let _skyboxTexture = []
const modelsToFetch = ['rook.glb', 'queen.glb', 'knight.glb', 'pawn.glb', 'bishop.glb', 'king.glb']
const models = {}

const cameraStartingPos = new THREE.Vector3(-10, 1, 0)
let pieces = []

const domeRotateSpeedY = .0009
const domeRotateSpeedX = .000

const pieceMap = {
    "r": 0x000000, "n": 0x000000, "b": 0x000000, "q": 0x000000, "k": 0x000000, "p": 0x000000,
    "R": 0xffffff, "N": 0xffffff, "B": 0xffffff, "Q": 0xffffff, "K": 0xffffff, "P": 0xffffff
};

let isPointerLocked = false

const loader = new GLTFLoader();

init();

export function movePiece(from, to)
{
    let fromPiece = pieces.find(piece=>piece.boardPosition.col == from.col && piece.boardPosition.row == from.row)
    let capturedPieceIndex = pieces.findIndex(piece=>piece.boardPosition.col == to.col && piece.boardPosition.row == to.row)

    //fromPiece.object.position.set(to.col - boardSize / 2, 0, to.row - boardSize / 2)
    
    console.log(fromPiece.boardPosition, from)
    if(fromPiece) {
        //move down the lifecycle of position
        //position is updated immediately, but visually will lag
        fromPiece.lastPosition = fromPiece.boardPosition
        fromPiece.boardPosition = to
        fromPiece.journeyProgress = 0
    }

    if(capturedPieceIndex!=-1)
    {
        console.log(capturedPieceIndex)
        scene.remove(pieces[capturedPieceIndex].object)
        pieces.splice(capturedPieceIndex,1)
    }
}

function makeScene(renderer)
{
    let scene = new THREE.Scene();
    scene.background = new THREE.Color( 0x444444 );

    // scene.add( new THREE.AmbientLight( 0xcccccc ) );

    light = new THREE.DirectionalLight( 0xffffff, 3 );
    light.position.set( 0, 10, 300 );
    scene.add( light );


    camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.001, renderFar );
    camera.position.copy(cameraStartingPos)

    yaw = -Math.PI / 2

    console.log('making scene')
    // const materiasl = new THREE.MeshBasicMaterial( { color: 0xffffff, map: _skyboxTexture, side: THREE.BackSide} )
    // const geometry = new THREE.BoxGeometry( skyboxSize, skyboxSize, skyboxSize );
    
    // const newMap = [
    //     _skyboxTexture['ft'],
    //     _skyboxTexture['bk'],
    //     _skyboxTexture['up'],
    //     _skyboxTexture['dn'],
    //     _skyboxTexture['rt'],
    //     _skyboxTexture['lf'],
    // ]
    // console.log(newMap)

    // const cube = new THREE.Mesh( geometry, newMap );
    // cube.position.y = 2
    // scene.add( cube );
    
    const sgeometry = new THREE.SphereGeometry(skyboxSize);
    const sph = new THREE.Mesh( sgeometry, _skyboxTexture['best.png'] );
    scene.add( sph );
    dome = sph

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    document.addEventListener('mousemove', onMouseMove);
    renderer.domElement.addEventListener('click', ()=>document.body.requestPointerLock())
    document.addEventListener("pointerlockchange", (event) => {
        isPointerLocked = !!document.pointerLockElement
        console.log(event)
    });

    return scene
}

function onKeyDown(event) {
    switch (event.code) {
        case 'KeyW': movement.forward = true; break;
        case 'KeyS': movement.backward = true; break;
        case 'KeyA': movement.left = true; break;
        case 'KeyD': movement.right = true; break;
    }
}

function onKeyUp(event) {
    switch (event.code) {
        case 'KeyW': movement.forward = false; break;
        case 'KeyS': movement.backward = false; break;
        case 'KeyA': movement.left = false; break;
        case 'KeyD': movement.right = false; break;
    }
}

function onMouseMove(event) {
    if(!isPointerLocked) return
    yaw -= event.movementX * 0.002;
    pitch -= event.movementY * 0.002;
    pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, pitch));
}

function updateCameraPosition() {
    let direction = new THREE.Vector3();
    camera.getWorldDirection(direction);
    let right = new THREE.Vector3().crossVectors(direction, new THREE.Vector3(0, 1, 0)).normalize();
    
    direction.y = 0;
    right.y = 0;

    right = right.normalize()
    direction = direction.normalize()

    let prevCamp = new THREE.Vector3().copy(camera.position)
    let eventualCamp = new THREE.Vector3().copy(prevCamp)
    let camp = eventualCamp
    
    if (movement.left) eventualCamp.addScaledVector(right, -moveSpeed);
    if (movement.right) eventualCamp.addScaledVector(right, moveSpeed);
    if (movement.forward) eventualCamp.addScaledVector(direction, moveSpeed);
    if (movement.backward) eventualCamp.addScaledVector(direction, -moveSpeed);

    let movementDelta = new THREE.Vector3().copy(eventualCamp).sub(prevCamp)

    pieces.forEach(piece=>{
        let bb = piece.object.children[0].geometry.boundingBox
    
        let rotationFlip = 1 + (piece.object.rotation.y / -Math.PI * 2)

    
        let smallx = (bb.min.x * rotationFlip)  * piece.object.scale.x + piece.object.position.x
        let smallz = bb.min.z * rotationFlip * piece.object.scale.z + piece.object.position.z
        let bigx = bb.max.x * rotationFlip * piece.object.scale.x + piece.object.position.x
        let bigz = bb.max.z* rotationFlip * piece.object.scale.z + piece.object.position.z
    
    
        let walls = [
            {p1: {x: smallx, z: bigz}, p2: {x: bigx, z:bigz}, normal: {x: 0, z: -1 * rotationFlip}},//sideA
            {p1: {x: smallx, z: smallz}, p2: {x: bigx, z:smallz}, normal: {x: 0, z: 1 * rotationFlip}},//sideA
            {p1: {x: bigx, z: bigz}, p2: {x: bigx, z:smallz}, normal: {x: -1 * rotationFlip, z: 0}},//sideA
            {p1: {x: smallx, z: bigz}, p2: {x: smallx, z:smallz}, normal: {x: 1 * rotationFlip, z: 0}},//sideA
        ]

        let intersections = []
    
        walls.forEach(wall=>{
            if(intersects(
                prevCamp.x,
                prevCamp.z,
                camp.x,
                camp.z,
                wall.p1.x,
                wall.p1.z,
                wall.p2.x,
                wall.p2.z,
            ))
            {
                
                // compute the direction of the line segment
                let lineDir = new THREE.Vector2(camp.x - prevCamp.x, camp.z - prevCamp.z);
                let wallNormalVec = new THREE.Vector2(wall.normal.x, wall.normal.z); // ensure it's a 2D vector if you're working in 2D

                // check if intersection is in the direction of the wall's normal
                let dotProduct = lineDir.dot(wallNormalVec);
                if (dotProduct > 0)
                {

                    makeCube(new THREE.Vector3(wall.p1.x, 1, wall.p1.z ))
                    makeCube(new THREE.Vector3(wall.p2.x, 1, wall.p2.z ))
    
                    let abswallNormal = new THREE.Vector3(Math.abs(wall.normal.x), 1,Math.abs( wall.normal.z))
                    let InvwallNormal = new THREE.Vector3(1,1,1).sub(abswallNormal)
                    let modifiedDelta = movementDelta.multiply(InvwallNormal)
                    eventualCamp = (prevCamp).add(modifiedDelta)

                    console.log(dotProduct)
                }


            }
        })
    })

    camera.position.copy(eventualCamp)
    camera.rotation.reorder ( 'YXZ' );

    camera.rotation.set(pitch + (Math.random() * currentShake), yaw + (Math.random() * currentShake), 0 + (Math.random() * currentShake));
}

function intersects(a,b,c,d,p,q,r,s) {
    var det, gamma, lambda;
    det = (c - a) * (s - q) - (r - p) * (d - b);
    if (det === 0) {
      return false;
    } else {
      lambda = ((s - q) * (r - a) + (p - r) * (s - b)) / det;
      gamma = ((b - d) * (r - a) + (c - a) * (s - b)) / det;

      let things = (0 <= lambda && lambda <= 1) && (0 <= gamma && gamma <= 1)

      return things;
    }
  }

function makeCube(pos, size)
{
    const geometry = new THREE.BoxGeometry(size,size,size );
    const material = new THREE.MeshStandardMaterial( { color: 0x00ff00 } );
    const cube = new THREE.Mesh( geometry, material );
    cube.position.copy(pos)
    scene.add( cube );

}

function makeControls(renderer)
{
    // controls = new TrackballControls( camera, renderer.domElement );
    // controls.rotateSpeed = 15.0;
    // controls.zoomSpeed = 5;
    // controls.panSpeed = 0.8;
    // controls.noZoom = false;
    // controls.noPan = false;
    // controls.staticMoving = true;
    // controls.dynamicDampingFactor = 0.3;
}

function createBoard() {
    for (let x = 0; x < boardSize / tileSize; x++) {
        for (let y = 0; y < boardSize / tileSize; y++) {
            const color = (x + y) % 2 === 0 ? 0xd2b48c : 0x8b4513;
            const geometry = new THREE.BoxGeometry(tileSize, 0.1, tileSize);
            const material = new THREE.MeshStandardMaterial({ color });
            const tile = new THREE.Mesh(geometry, material);
            tile.position.copy(boardPositionToPhysicalPosition(x,y))
            scene.add(tile);
        }
    }
}

function createPieces() {
    for (let row = 0; row < boardSize / tileSize; row++) {
        for (let col = 0; col < boardSize / tileSize; col++) {
            let whole = getBoardState()[row][col];
            // console.log(whole)
            let piece =  whole.piece;
            if (piece) {
                addPiece(col, row, pieceMap[piece],  piece, whole.uuid);
            }
        }
    }
}

function addPiece(x, y, color, piece, uuid) {
    const scale = pieceSize
    const material = new THREE.MeshStandardMaterial({ color })

    let newPiece 

    if(piece.toLowerCase() == 'r') newPiece = models['rook.glb'].clone()
    if(piece.toLowerCase() == 'q') newPiece = models['queen.glb'].clone()
    if(piece.toLowerCase() == 'n') newPiece = models['knight.glb'].clone()
    if(piece.toLowerCase() == 'b') newPiece = models['bishop.glb'].clone()
    if(piece.toLowerCase() == 'k') newPiece = models['king.glb'].clone()
    if(piece.toLowerCase() == 'p') newPiece = models['pawn.glb'].clone()

    if(piece != piece.toLowerCase()) newPiece.rotation.y = Math.PI

    newPiece.children[0].material = material

    newPiece.position.copy(boardPositionToPhysicalPosition(x,y))
    newPiece.scale.set(scale, scale, scale)
    scene.add(newPiece)
    const box = new THREE.BoxHelper( newPiece, 0xffff00 );
    scene.add( box );

    pieces.push({
        object: newPiece,
        boardPosition: {row: y, col: x},
        lastPosition: null,
        journeyProgress: 1,
        uuid: uuid
    })
}

async function getAssets ()
{
    let promises = []

    modelsToFetch.forEach(item=>{
        let promise = new Promise((res)=>{
            loader.load(
                // resource URL
                './models/' + item,
                // called when the resource is loaded
                function ( gltf ) {
                    res(models[item] = gltf.scene)
                },
                ()=>{},
                // called when loading has errors
                (err)=>{
                    console.log( 'An error happened' , err);
                }
            );
        })
        promises.push(promise)
    })

    const textureLoader = new THREE.TextureLoader();
    // textureLoader.setPath( './' )

    // texturesToFetch.forEach(item=>{
    //     let p2 = new Promise((res)=>{
    //         textureLoader.load([
    //             `purplenebula_${item}.png`
    //         ], (texture) => {
    //             texture.wrapS = THREE.RepeatWrapping;
    //             texture.wrapT = THREE.RepeatWrapping;
    //             texture.repeat.x = - 1;
    //             // // texture.repeat.y = - 1;
    //             texture.repeat.z = - 1;

    //             texture.rotation =  2*Math.PI * (2/4)

    //             let mattt = new THREE.MeshBasicMaterial( { map: texture, side: THREE.BackSide} )
    //             _skyboxTexture[item] = (mattt)
    //             res()
    //         })
    //     })
    //     promises.push(p2)
    // })

    let p2 = new Promise((res)=>{
        textureLoader.load([
            `best.png`
        ], (texture) => {
            let mattt = new THREE.MeshBasicMaterial( { map: texture, side: THREE.BackSide} )
            _skyboxTexture['best.png'] = (mattt)
            res()
        })
    })
    
    promises.push(p2)

    promises.push(loadBoardState())

    return await Promise.all(promises)
}

async function init() {
    console.log('initing,..')

    await getAssets()
    console.log('loaded models: ', models)
    container = document.getElementById( 'container' );

    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.setAnimationLoop( animate );
    container.appendChild( renderer.domElement );
    renderer.domElement.addEventListener( 'pointermove', onPointerMove );

    window.addEventListener('message', (event) => {
        console.log('Message received in iframe:', event.data)
        // document.querySelector('div').textContent = JSON.stringify(event.data)
        console.log(parseBoard(event.data))
        drawBoard()
    }, false);

    stats = new Stats();
    container.appendChild( stats.dom );

    scene = makeScene(renderer)
    makeControls(renderer)
    createBoard(renderer);
    createPieces(renderer);
}

function boardPositionToPhysicalPosition(x,y)
{
    //Takes X and Y, converts to Vector3 coordinate
    return new THREE.Vector3(x * tileSize - boardSize / 2, 0, y* tileSize - boardSize / 2)
}

function onPointerMove( e ) {

    pointer.x = e.clientX;
    pointer.y = e.clientY;
}

function animate() {
    render()
    stats.update()
}

function animatePieces ()
{

    let anyPieceMoving = false

    pieces.forEach(piece=>{
        if(piece.journeyProgress < 1)
        {
            anyPieceMoving = true 

            let originalVector = boardPositionToPhysicalPosition(piece.lastPosition.col, piece.lastPosition.row)
            let destinationVector = boardPositionToPhysicalPosition(piece.boardPosition.col, piece.boardPosition.row)

            let weightedA = originalVector.multiplyScalar(1-piece.journeyProgress)
            let weightedB = destinationVector.multiplyScalar(piece.journeyProgress)
            let vecSum = weightedB.add(weightedA)
            let avgPos = vecSum//.divideScalar(2)
            piece.object.position.copy(avgPos)
            piece.journeyProgress += progressSpeed
        }
    })

    if(anyPieceMoving) currentShake = shakeValue
    else currentShake = 0
}

function rotateDome()
{
    dome.rotation.y += domeRotateSpeedY 
    dome.rotation.x += domeRotateSpeedX 

    let newLightPos = new THREE.Vector3(Math.sin(dome.rotation.y), light.position.y ,Math.cos(dome.rotation.y))
    light.position.copy(newLightPos)
}

function render() {

    // controls.update();
    updateCameraPosition();
    animatePieces()
    rotateDome()

    renderer.setRenderTarget( null );
    renderer.render( scene, camera );

}