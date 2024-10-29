import * as React from "react";
import * as Cesium from 'cesium';
import * as THREE from 'three';
import CesiumCamera from "./utils/workers/cesiumCamera";
import * as OBC from "@thatopen/components";
import * as OBF from "@thatopen/components-front"
import "./App.css";
import "cesium/Build/Cesium/Widgets/widgets.css"
import _3DObject from "./utils/types/_3DObject";



// Setting the access token for Cesium Ion 
Cesium.Ion.defaultAccessToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI4NzlkNTk4OS0xZGYwLTQ3ZDAtYmQ2Zi03NTVjNGE0MmNjMDEiLCJpZCI6MjQ4NTQ5LCJpYXQiOjE3MjkwNzc2ODV9.I0DL7X6f6miBDC6nVh_mBY5ts2mh6Ceanv7e-erzFBU";

// boundaries in WGS84 to help with syncing the renderers
let minWGS84 = [12.393579, 51.334806];
let maxWGS84 = [12.394868, 51.335099];

const offset = 0.002
const center = Cesium.Cartesian3.fromDegrees(
    (minWGS84[0] + maxWGS84[0]) / 2, 
    ((minWGS84[1] + maxWGS84[1]) / 2) - offset,
    500
);

function createViewer (containerElement: HTMLElement) {

    const rectangle = Cesium.Rectangle.fromDegrees(minWGS84[0]-0.01, minWGS84[1]-0.01, maxWGS84[0]+0.01, maxWGS84[1]+0.01)
    Cesium.Camera.DEFAULT_VIEW_RECTANGLE = rectangle
    Cesium.Camera.DEFAULT_VIEW_FACTOR = 0

    const viewer = new Cesium.Viewer(containerElement, {
        navigationHelpButton: false,
        sceneModePicker: false,
        timeline: false,
        fullscreenButton: false,
        terrain: Cesium.Terrain.fromWorldTerrain(),
        useDefaultRenderLoop: true,
    })

    return viewer
}

async function buildTileset (viewer: Cesium.Viewer) {
    const tileset = await Cesium.createOsmBuildingsAsync()
    viewer.scene.primitives.add(tileset)
}

function setupOBCCamera (camera: OBC.OrthoPerspectiveCamera) {
    camera.threePersp.fov = 45
    camera.updateAspect()
    camera.threePersp.near = 1
    camera.threePersp.far = 10 * 1000 * 1000
}

function createCesiumPolygon (viewerRef: React.MutableRefObject<Cesium.Viewer | undefined>) {
    if (!viewerRef.current) {console.error("Viewer not initialized"); return}
    const viewer = viewerRef.current

    const entity = {
        name: "Polygon",
        polygon: {
            hierarchy: Cesium.Cartesian3.fromDegreesArray([
                minWGS84[0], minWGS84[1],
                maxWGS84[0], minWGS84[1],
                maxWGS84[0], maxWGS84[1],
                minWGS84[0], maxWGS84[1]
            ]),
            material: Cesium.Color.RED.withAlpha(0.3)
        }
    }

    return viewer.entities.add(entity)
}

async function loadFileFromAssets (path: string) {
    const file = await fetch(path)
    const data = await file.arrayBuffer()
    const buffer = new Uint8Array(data)
    return buffer
}

async function loadModelFromAssets (loader: OBC.IfcLoader, scene: THREE.Scene) {
    const buffer = await loadFileFromAssets("./assets/sample.ifc")
    const model = await loader.load(buffer)
    for (const child of model.children) {
        child.rotation.x = Math.PI / 2
        child.position.z += 65
    }

    scene.add(model)
    return model
}

function cartToVec (cart:Cesium.Cartesian3) {
    return new THREE.Vector3(cart.x, cart.y, cart.z)
}




const App: React.FC = () => {
    const cesiumContainerRef = React.useRef<HTMLDivElement>(null);
    const threeContainerRef = React.useRef<HTMLDivElement>(null);
    const viewerRef = React.useRef<Cesium.Viewer>();
    const bimViewerRef = React.useRef<OBC.SimpleWorld<OBC.SimpleScene, OBC.OrthoPerspectiveCamera, OBF.PostproductionRenderer>>();
    const _3Dobjects: _3DObject[] = []

    function initCesium() {
        const viewer = createViewer(cesiumContainerRef.current as HTMLElement)
        buildTileset(viewer)
        viewer.camera.flyTo({
            destination: center,
            orientation: {
                heading: Cesium.Math.toRadians(0),
                pitch: Cesium.Math.toRadians(-60.0),
                roll: Cesium.Math.toRadians(.0)
            }
        })
        viewerRef.current = viewer
    }

    async function initOpenBIM() {
        const components = new OBC.Components
        const worlds = components.get(OBC.Worlds)
        const world = worlds.create<
        OBC.SimpleScene,
        OBC.OrthoPerspectiveCamera,
        OBF.PostproductionRenderer
        >()
        world.name = "BIMWorld"

        world.scene = new OBC.SimpleScene(components)
        world.scene.three.background = null
        world.renderer = new OBF.PostproductionRenderer(components, threeContainerRef.current as HTMLElement, {alpha: true})
        world.camera =  new OBC.OrthoPerspectiveCamera(components)

        components.init()

        bimViewerRef.current = world

        const sceneComponent = world.scene
        sceneComponent.setup()
        
        const scene = sceneComponent.three
        scene.background = null

        const renderer = world.renderer

        const camera = world.camera
        setupOBCCamera(world.camera)  

        const polygon = createCesiumPolygon(viewerRef)

        const ifcLoader = components.get(OBC.IfcLoader)
        const setupLoader = async () => {
            await ifcLoader.setup()
        }
        setupLoader()

        const ifcModel = await loadModelFromAssets(ifcLoader, scene) as THREE.Object3D

        const ifcObject: _3DObject = {
            threeMesh: ifcModel,
            minWGS84: minWGS84,
            maxWGS84: maxWGS84
        }
        _3Dobjects.push(ifcObject)

        renderer.onBeforeUpdate.add(() => {
            if(!viewerRef.current) {console.error("Viewer not initialized"); return}
            viewerRef.current?.render()

            camera.updateAspect()

            // Set Three.js camera FOV to match Cesium
            const perspectiveFrustum = viewerRef.current.camera.frustum as Cesium.PerspectiveFrustum
            if (perspectiveFrustum.fovy === undefined) {console.error("Perspective frustum not defined"); return}
            camera.threePersp.fov = Cesium.Math.toDegrees(perspectiveFrustum.fovy)
        

            for(const id in _3Dobjects){
                minWGS84 = _3Dobjects[id].minWGS84;
                maxWGS84 = _3Dobjects[id].maxWGS84;


                // convert lat/long center position to Cartesian3
                const center = cartToVec(Cesium.Cartesian3.fromDegrees((minWGS84[0] + maxWGS84[0]) / 2, (minWGS84[1] + maxWGS84[1]) / 2, 104));
            
                // get forward direction for orienting model
                const centerHigh = cartToVec(Cesium.Cartesian3.fromDegrees((minWGS84[0] + maxWGS84[0]) / 2, (minWGS84[1] + maxWGS84[1]) / 2,113));
            
                // use direction from bottom left to top left as up-vector
                const bottomLeft  = cartToVec(Cesium.Cartesian3.fromDegrees(minWGS84[0], minWGS84[1]));
                const topLeft = cartToVec(Cesium.Cartesian3.fromDegrees(minWGS84[0], maxWGS84[1]));
                const latDir  = new THREE.Vector3().subVectors(bottomLeft,topLeft ).normalize();
            
                // configure entity position and orientation
                _3Dobjects[id].threeMesh.position.copy(center);
                _3Dobjects[id].threeMesh.lookAt(centerHigh);
                _3Dobjects[id].threeMesh.up.copy(latDir);
              }
            
              // Clone Cesium Camera projection position so the
              // Update Three.js camera matrices to match Cesium
              // Three.js Object will appear to be at the same place as above the Cesium Globe
              camera.three.matrixAutoUpdate = false;
              const cvm = viewerRef.current.camera.viewMatrix;
              const civm = viewerRef.current.camera.inverseViewMatrix;
              camera.three.matrixWorld.set(
                  civm[0], civm[4], civm[8 ], civm[12],
                  civm[1], civm[5], civm[9 ], civm[13],
                  civm[2], civm[6], civm[10], civm[14],
                  civm[3], civm[7], civm[11], civm[15]
              );
              camera.three.matrixWorldInverse.set(
                  cvm[0], cvm[4], cvm[8 ], cvm[12],
                  cvm[1], cvm[5], cvm[9 ], cvm[13],
                  cvm[2], cvm[6], cvm[10], cvm[14],
                  cvm[3], cvm[7], cvm[11], cvm[15]
              );

              camera.three.updateProjectionMatrix()
        })

        // Höhe anpassen

        camera.controls.addEventListener("controlend", () => {
            if(!viewerRef.current) {console.error("Viewer not initialized"); return}
            viewerRef.current?.render()
        })
    }


    function initCesiumMouseEvents() {
        const bimWorld = bimViewerRef.current
        const cesiumViewer = viewerRef.current
        if (!cesiumViewer || !bimWorld) {console.error("Viewer not initialized"); return}

        const components = bimWorld.components
        const highlighter = components.get(OBF.Highlighter)
        highlighter.setup({ world: bimWorld })

        const eventHandler = cesiumViewer.screenSpaceEventHandler
        eventHandler.setInputAction(function(click: Cesium.ScreenSpaceEventHandler.PositionedEvent) {
            const positionPicked = cesiumViewer.scene.pickPosition(click.position)
            if (!positionPicked) {console.error("Position not picked"); return}
            const geodeticSurfaceNormal = Cesium.Ellipsoid.WGS84.geodeticSurfaceNormal(positionPicked)
            const globeCurvature = Cesium.Ellipsoid.WGS84.getLocalCurvature(positionPicked)
            console.log("Position:"+ positionPicked)
            console.log("Geodetic Surface Normal:" + geodeticSurfaceNormal)
            console.log("Globe Curvature:" + globeCurvature)

            const objectPicked = cesiumViewer.scene.pick(click.position)
            if (!objectPicked) {console.log("No Object found"); return}
            console.log("Object Picked:" + objectPicked)
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK)
    }

    React.useEffect(() => {
        initCesium()
        initOpenBIM()
        // initCesiumMouseEvents()
    }, [])
  
    return (
    <>
      <div className="viewer" id="cesiumViewer" ref={cesiumContainerRef}></div>
      <div className="viewer untouchable" id="threeViewer" ref={threeContainerRef}></div>
    </>
  )
}

export default App