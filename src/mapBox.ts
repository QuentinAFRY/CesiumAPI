import mapboxgl from "mapbox-gl"

function setMap(containerID: string) {
  mapboxgl.accessToken =
    "pk.eyJ1IjoicS10aHJ3IiwiYSI6ImNtMWh2eXd1OTBtZGIycXMyd2NrdzhsM3UifQ.gcWzl8NZ4Pk_LgkVqRIsLg"

  const map = new mapboxgl.Map({
    container: containerID, // container ID
    projection: "globe",
    center: [-74.5, 40], // starting position [lng, lat]
    zoom: 9, // starting zoom
  })

  map.on("style.load", () => {
    map.setConfigProperty("basemap", "lightPreset", "dusk")
  })
}

export default setMap
