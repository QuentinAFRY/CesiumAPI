import * as THREE from 'three'

function getMousePositionForRaycast (event: MouseEvent, viewport: HTMLElement) {
    let mouseLocation = new THREE.Vector2()

        // Get the middle of the Viewport as the origin
        const vw = viewport.clientWidth
        const vh = viewport.clientHeight
        const originX = vw / 2
        const originY = vh / 2
        
        // Get the true mouse position of the Viewport Element
        const trueX = event.clientX
        const trueY = event.clientY
        console.log('trueX:', trueX, 'trueY:', trueY)

        // Get the mouse position relative to the origin of the Viewport (rightmost and topmost point are positive)
        mouseLocation.x = (trueX - originX) / originX
        mouseLocation.y = (originY - trueY) / originY
        // mouseLocation.x = ( event.clientX / window.innerWidth ) * 2 - 1
        // mouseLocation.y = - ( event.clientY / window.innerHeight ) * 2 + 1

        return mouseLocation
}

export default getMousePositionForRaycast