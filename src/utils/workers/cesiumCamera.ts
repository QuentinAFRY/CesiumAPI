import * as THREE from "three"
import { OrthoPerspectiveCamera } from "@thatopen/components"

class CesiumCamera extends OrthoPerspectiveCamera {

    private _camera: THREE.Camera = new THREE.PerspectiveCamera();

    get() {
        return this._camera;
    }
}

export default CesiumCamera;