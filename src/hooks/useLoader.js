import { TextureLoader, LoadingManager } from 'three';
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { HDRLoader } from "three/examples/jsm/loaders/HDRLoader.js";
function useLoader(path) {
    let total = 5;
    const loadingManager = new LoadingManager();
    const dracoLoader = new DRACOLoader(loadingManager);
    dracoLoader.setDecoderPath(`${path}/draco/`);
    dracoLoader.setDecoderConfig({ type: 'js' });

    const gltfLoader = new GLTFLoader(loadingManager);
    gltfLoader.setDRACOLoader(dracoLoader);


    const hdrLoader = new HDRLoader(loadingManager);

    const textureLoader = new TextureLoader(loadingManager);


    loadingManager.onLoad = () => {
        total -= 1;
        if (total === 0) {
            document.querySelector('.loading').style.display = 'none';
        }
    }

    return {
        gltfLoader,
        hdrLoader,
        textureLoader
    }
}
export default useLoader;