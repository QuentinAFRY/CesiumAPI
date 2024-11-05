import { AppManager } from './../bim-components/AppManager/index';
import * as THREE from "three"
import * as OBC from "@thatopen/components"
import * as OBF from "@thatopen/components-front"
import * as BUI from "@thatopen/ui"
import * as CUI from "@thatopen/ui-obc"
import { ImprovedNoise } from "three/examples/jsm/Addons.js"
import { AppManager } from "../bim-components"
import projectInformation from "../components/Panels/ProjectInformation"
import elementData from "../components/Panels/Selection"
import settings from "../components/Panels/Settings"
import load from "../components/Toolbars/Sections/Import"
import help from "../components/Panels/Help"
import camera from "../components/Toolbars/Sections/Camera"
import selection from "../components/Toolbars/Sections/Selection"
import getMousePositionForRaycast from "../utils/workers/getMousePositionForRaycast"

BUI.Manager.init()

const viewport = document.getElementById("viewport")! as BUI.Viewport

viewport.addEventListener("click", () => {
  // Create a click event and dispatch it on div1
  const clickEvent = new MouseEvent("click", { bubbles: true, cancelable: true });
  app.dispatchEvent(clickEvent);
});

const components = new OBC.Components()
const worlds = components.get(OBC.Worlds)

const world = worlds.create<
  OBC.SimpleScene,
  OBC.OrthoPerspectiveCamera,
  OBF.PostproductionRenderer
>()
world.name = "BIMWorld"

world.scene = new OBC.SimpleScene(components)
world.scene.setup()
const scene = world.scene.three
scene.background = null

world.renderer = new OBF.PostproductionRenderer(components, viewport)
const { postproduction } = world.renderer

world.camera = new OBC.OrthoPerspectiveCamera(components)

const worldGrid = components.get(OBC.Grids).create(world)
worldGrid.material.uniforms.uColor.value = new THREE.Color(0x424242)
worldGrid.material.uniforms.uSize1.value = 2
worldGrid.material.uniforms.uSize2.value = 8

const resizeWorld = () => {
  world.renderer?.resize()
  world.camera.updateAspect()
}

viewport.addEventListener("resize", resizeWorld)

components.init()

postproduction.enabled = true
postproduction.customEffects.excludedMeshes.push(worldGrid.three)
postproduction.setPasses({ custom: true, ao: true, gamma: true })
postproduction.customEffects.lineColor = 0x17191c

const ifcLoader = components.get(OBC.IfcLoader)
await ifcLoader.setup()

// const highlighter = components.get(OBF.Highlighter)
// highlighter.setup({ world })
// highlighter.zoomToSelection = true
const casters = components.get(OBC.Raycasters);
const caster = casters.get(world);
let previousSelection: THREE.Mesh | null = null;

const app = document.getElementById("app")! as BUI.Grid

let previousPlanes: THREE.Group | null = null

const addPlanes = () => {
  const lftBtNear = new THREE.Vector3(-1, -1 , 0).unproject(world.camera.three)
  const lftTpNear = new THREE.Vector3(-1, 1 , 0).unproject(world.camera.three)
  const rgtTpNear = new THREE.Vector3(1, 1 , 0).unproject(world.camera.three)
  const rgtBtNear = new THREE.Vector3(1, -1 , 0).unproject(world.camera.three)

  const geometryNear  = new THREE.BufferGeometry()

  const verticesNear = new Float32Array([
    lftBtNear.x, lftBtNear.y, lftBtNear.z,
    lftTpNear.x, lftTpNear.y, lftTpNear.z,
    rgtTpNear.x, rgtTpNear.y, rgtTpNear.z,
    rgtBtNear.x, rgtBtNear.y, rgtBtNear.z,
  ])

  const indicesNear = [
    0, 1, 2,
    2, 3, 0
  ]

  geometryNear.setIndex(indicesNear)
  geometryNear.setAttribute('position', new THREE.BufferAttribute(verticesNear, 3))

  const materialNear = new THREE.MeshBasicMaterial({color: 0x00ff00, side: THREE.DoubleSide})
  const meshNear = new THREE.Mesh(geometryNear, materialNear)

  const lftBtFar = new THREE.Vector3(-1, -1 , 0.98).unproject(world.camera.three)
  const lftTpFar = new THREE.Vector3(-1, 1 , 0.98).unproject(world.camera.three)
  const rgtTpFar = new THREE.Vector3(1, 1 , 0.98).unproject(world.camera.three)
  const rgtBtFar = new THREE.Vector3(1, -1 , 0.98).unproject(world.camera.three)

  const geometryFar  = new THREE.BufferGeometry()

  const verticesFar = new Float32Array([
    lftBtFar.x, lftBtFar.y, lftBtFar.z,
    lftTpFar.x, lftTpFar.y, lftTpFar.z,
    rgtTpFar.x, rgtTpFar.y, rgtTpFar.z,
    rgtBtFar.x, rgtBtFar.y, rgtBtFar.z,
  ])

  const indicesFar = [
    0, 1, 2,
    2, 3, 0
  ]

  geometryFar.setIndex(indicesFar)
  geometryFar.setAttribute('position', new THREE.BufferAttribute(verticesFar, 3))

  const materialFar = new THREE.MeshBasicMaterial({color: 0xff0000 , side: THREE.DoubleSide})
  const meshFar = new THREE.Mesh(geometryFar, materialFar)
  
  if (previousPlanes) {
    world.scene.three.remove(previousPlanes)
  }
  previousPlanes = new THREE.Group()
  previousPlanes.add(meshFar, meshNear)
  world.scene.three.add(previousPlanes)
}

let eventToggle = true
let arrowGroup : THREE.Group = new THREE.Group()

app.onmousedown = (event) => {
  if (!eventToggle) {return}

  const mousePosition = getMousePositionForRaycast(event, viewport)

  const mouseVector = new THREE.Vector2();
  mouseVector.x = ( event.clientX / window.innerWidth ) * 2 - 1;
  mouseVector.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

  // Vectors to be unprojected
  const vectorNearNdc = new THREE.Vector3(mousePosition.x, mousePosition.y, 0)
  const vectorFarNdc = new THREE.Vector3(mousePosition.x, mousePosition.y, 1)
  
  // Unprojected vectors that point to the near and far point on plane
  const worldSpaceVectorNear = vectorNearNdc.unproject(world.camera.three)
  const worldSpaceVectorFar = vectorFarNdc.unproject(world.camera.three)
  const dirVector = worldSpaceVectorFar.clone().sub(worldSpaceVectorNear).normalize()
  const vectorLenght = worldSpaceVectorNear.distanceTo(worldSpaceVectorFar)  

  // Separate arrow creation
  const caster = casters.get(world)
  
  const arrow = new THREE.ArrowHelper(dirVector, world.camera.three.position, vectorLenght, 0xff0000);
  arrowGroup.add(arrow)
  world.scene.three.remove(arrowGroup)
  world.scene.three.add(arrowGroup);

  const result = caster.castRayFromVector(world.camera.three.position, dirVector)
  if (!result || !(result.object instanceof THREE.Mesh)) {
    console.log("No object selected" + result)
    return
  }  

  const distance = result.distance
  previousSelection = result.object;
  console.log("Object:", result.object)
  console.log("Distance:" + distance)
};

document.addEventListener("keydown", (event) => {
  if (event.key === "p") {
    addPlanes()
  }
  if (event.key === "l") {
    arrowGroup.clear()
  }
  if (event.key === "o") {
    eventToggle = !eventToggle
  }
  if (event.key === "i") {
    previousPlanes?.children.forEach((plane) => {
      plane.visible = !plane.visible
    })
  }
})


const fragments = components.get(OBC.FragmentsManager)

const indexer = components.get(OBC.IfcRelationsIndexer)
const classifier = components.get(OBC.Classifier)
classifier.list.CustomSelections = {}

/* Streaming consists of converting the IFC file to "tiles", and then loading only the data that the user sees.
If you haven't heard of streaming before, check out the geometry tiles and property tiles tutorials first! */
const tilesLoader = components.get(OBF.IfcStreamer)
tilesLoader.url = "../resources/tiles/"
tilesLoader.world = world
tilesLoader.culler.threshold = 10
tilesLoader.culler.maxHiddenTime = 1000
tilesLoader.culler.maxLostTime = 40000

/* Culling is a process of hiding objects that are not visible, either because they are outside of the scope
of the camera, or because there are other objects in front of them, hiding them from the camera. */
const culler = components.get(OBC.Cullers).create(world)
culler.threshold = 5

world.camera.controls.restThreshold = 0.25
world.camera.controls.addEventListener("controlend", () => {
  culler.needsUpdate = true
  console.log("controlend")
  tilesLoader.culler.needsUpdate = true
})

fragments.onFragmentsLoaded.add(async (model) => {
  if (model.hasProperties) {
    await indexer.process(model)
    classifier.byEntity(model)
  }

  for (const fragment of model.items) {
    world.meshes.add(fragment.mesh)
    culler.add(fragment.mesh)
  }

  world.scene.three.add(model)
  setTimeout(async () => {
    world.camera.fit(world.meshes, 0.8)
  }, 50)
  console.log(model)
})

fragments.onFragmentsDisposed.add(({ fragmentIDs }) => {
  for (const fragmentID of fragmentIDs) {
    const mesh = [...world.meshes].find((mesh) => mesh.uuid === fragmentID)
    if (mesh) world.meshes.delete(mesh)
  }
})

// const projectInformationPanel = projectInformation(components)

const toolbar = BUI.Component.create(() => {
  return BUI.html`
    <bim-toolbar>
      ${load(components)}
    </bim-toolbar>
  `
})

// const leftPanel = BUI.Component.create(() => {
//   return BUI.html`
//     <bim-tabs switchers-full>
//       <bim-tab name="project" label="Project" icon="ph:building-fill">
//         ${projectInformationPanel}
//       </bim-tab>
//       <bim-tab name="settings" label="Settings" icon="solar:settings-bold">
//         ${settings(components)}
//       </bim-tab>
//       <bim-tab name="help" label="Help" icon="material-symbols:help">
//         ${help}
//       </bim-tab>
//     </bim-tabs>
//   `
// })

// const app = document.getElementById("app")! as BUI.Grid
app.layouts = {
  main: {
    template: `
      "leftPanel viewport" 1fr
      /26rem 1fr
    `,
    elements: {
      // leftPanel,
      viewport,
    },
  },
}
app.layout = "main"

const viewportGrid = BUI.Component.create<BUI.Grid>(() => {
  return BUI.html`
    <bim-grid floating>
    </bim-grid>
  `
})

viewport.appendChild(viewportGrid)
viewportGrid.layouts = {
  main: {
    template: `
      "empty" 1fr
      "toolbar" auto
      /1fr
    `,
    elements: { toolbar },
  },
  arcGis: {
    template: `
      "empty" 1fr
    `,
    elements: {},
  },
}
viewportGrid.layout = "main"
