import "./styleArc.css"
import Map from "@arcgis/core/Map"
import SceneView from "@arcgis/core/views/SceneView"
import { Extent } from "@arcgis/core/geometry"
import Home from "@arcgis/core/widgets/Home"

export function setSceneView(containerId: string): void {
  const view = new SceneView({
    map: new Map({
      basemap: "hybrid",
      ground: "world-elevation",
    }),
    container: containerId,
    viewingMode: "global",
    clippingArea: mapExtent,
    extent: mapExtent,
    camera: {
      position: {
        x: -12977859.07,
        y: 4016696.94,
        z: 348.61,
        spatialReference: { wkid: 102100 },
      },
      heading: 316,
      tilt: 85,
    },
  })

  view
    .when(() => {
      view.goTo({
        center: [-112, 38],
        zoom: 13,
        heading: 30,
        tilt: 60,
      })
    })
    .catch((error: any) => {
      console.error("SceneView rejected:", error)
    })

  const homeBtn = new Home({
    view: view,
  })

  view.ui.add(homeBtn, "top-left")
}

//Clipping extent for the scene in "WGS84"
const mapExtent = new Extent({
  xmax: -130,
  xmin: -100,
  ymax: 40,
  ymin: 20,
  spatialReference: { wkid: 4326 },
})

//Extent = The minimum and maximum X and Y coordinates of a bounding box.
//Camera is used to define the visible part of the map within the view.
