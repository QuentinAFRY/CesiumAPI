import * as React from "react"
import mapboxgl from "mapbox-gl"

import "mapbox-gl/dist/mapbox-gl.css"
import "./App.css"

const initCenter: mapboxgl.LngLatLike = [
  12.3932,
  51.3341
]

const initZoom = 17

interface MapConfig {
  lightPreset: string,
  theme: string,
  show3dObjects: boolean
}

function App() {

  const [center, setCenter] = React.useState<mapboxgl.LngLatLike | undefined>(initCenter)
  const [zoom, setZoom] = React.useState<number | undefined>(initZoom)
  const [config, setConfig] = React.useState<MapConfig | undefined>(undefined)

  const mapRef = React.useRef<mapboxgl.Map | null>(null)
  const mapContainerRef = React.useRef<HTMLDivElement | null>(null)

  React.useEffect(() => {
    mapboxgl.accessToken = "pk.eyJ1IjoicS10aHJ3IiwiYSI6ImNtMWh2eXd1OTBtZGIycXMyd2NrdzhsM3UifQ.gcWzl8NZ4Pk_LgkVqRIsLg"
    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current!,
      center: center,
      zoom: zoom,      
    })

    mapRef.current.on("load", () => {
      const loadConfig = mapRef.current?.getConfig("basemap") as mapboxgl.ConfigSpecification
      const myConfig: MapConfig = {
        lightPreset: loadConfig.lightPreset as string,
        theme: loadConfig.theme as string,
        show3dObjects: loadConfig.show3dObjects as boolean
      }
      setConfig(myConfig)
    })
    
    mapRef.current.on("move", () => {
      if (!mapRef.current) {return}
      const mapCenter = mapRef.current.getCenter()
      const mapZoom = mapRef.current.getZoom()

      setCenter([mapCenter.lng, mapCenter.lat])
      setZoom(mapZoom)
    })

    return () => {
      mapRef.current? mapRef.current.remove() : console.warn("There is no MapReference to be flushed: ", mapRef.current)
    }
  },[])

  const myCenter = center as number[]
  const lat = myCenter[1].toFixed(4)
  const lon = myCenter[0].toFixed(4)
  const myZoom = (zoom as number).toFixed(2)

  const handleMapReset = () => {
    mapRef.current?.flyTo({
      center: initCenter,
      zoom: initZoom,
      speed: 0.8,
      curve: 1,
    })
  }

  const handleStyleChange = () => {
    switch (config?.lightPreset) {
      case "day":
        mapRef.current?.setConfigProperty("basemap", "lightPreset", "night");
        setConfig({...config!, lightPreset: "night"})
        break;
      case "night":
        mapRef.current?.setConfigProperty("basemap", "lightPreset", "day");
        setConfig({...config!, lightPreset: "day"})
        break;
      default:
        console.warn("Unknown lightPreset value:", config?.lightPreset);
    }
  }

  return (
    <>
    <div className="sidebar">
      Longitude: {lon} | Latitude: {lat} | Zoom: {myZoom}
    </div>
    <button className="reset-button" onClick={handleMapReset}> Go to AFRY Leipzig</button>
    <button className="light-button" onClick={handleStyleChange}> Lighting </button>
      <div id="map-container" ref={mapContainerRef}/>
    </>
  )
}

export default App

/*
used Links:
- https://docs.mapbox.com/help/tutorials/use-mapbox-gl-js-with-react/

*/