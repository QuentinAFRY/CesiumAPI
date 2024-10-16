import * as React from "react";
import * as Cesium from 'cesium';
import "cesium/Build/Cesium/Widgets/widgets.css"


// Setting the access token for Cesium Ion 
Cesium.Ion.defaultAccessToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI4NzlkNTk4OS0xZGYwLTQ3ZDAtYmQ2Zi03NTVjNGE0MmNjMDEiLCJpZCI6MjQ4NTQ5LCJpYXQiOjE3MjkwNzc2ODV9.I0DL7X6f6miBDC6nVh_mBY5ts2mh6Ceanv7e-erzFBU";


// Main App component
const App: React.FC = () => {

  // Reference to the div element that will contain the Cesium viewer
  const cesiumContainer = React.useRef<HTMLDivElement>(null);

  // useEffect hook to run code on component mount.
  React.useEffect(() => {

    // Check if the ref is not null before creating the Cesium viewer
    if (cesiumContainer.current !== null) {

      // Create the Cesium viewer
      const viewer = new Cesium.Viewer(cesiumContainer.current, {

        // Creates a Terrain instance for Cesium World Terrain.
        terrain: Cesium.Terrain.fromWorldTerrain(),
      })

      // Get the Camera. Flies the camera from its current position to a new position. (e.g., San Francisco)
      const cesiumCamera = viewer.camera
      cesiumCamera.flyTo({

        // The final position of the camera in world. Check for Ellipsoid !!!
        destination: Cesium.Cartesian3.fromDegrees(-122.4175, 37.655, 400),

        /**
         * An object that contains either direction and up properties or heading, pitch and roll properties.
         * Here we are setting the heading and pitch properties and convert them to radians.
         */
        orientation: {
          heading: Cesium.Math.toRadians(0.0),
          pitch: Cesium.Math.toRadians(-15.0),
        }
      });
      
      // Get the Cesium Scene
      const CesiumScene = viewer.scene;

      // Loading the 3D Buildings chained with ".then" to ensure we add the buildings to the scene after they are loaded.
      Cesium.createOsmBuildingsAsync().then((buildingTileset) => {
        CesiumScene.primitives.add(buildingTileset)
      })
    }
  })
  
  return (
    <div ref={cesiumContainer}></div>
  )
}

export default App