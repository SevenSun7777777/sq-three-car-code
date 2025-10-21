import * as THREE from 'three/webgpu';
import { pass, mrt, output, emissive } from 'three/tsl';
import { bloom } from 'three/addons/tsl/display/BloomNode.js';

function useBloomEmissive(scene, camera, renderer, processFolder) {
    const scenePass = pass(scene, camera);
    scenePass.setMRT(mrt({
        output,
        emissive
    }));

    // 移除 toInspector() 调用
    const outputPass = scenePass.getTextureNode(); // 直接获取纹理节点
    const emissivePass = scenePass.getTextureNode('emissive');

    const bloomPass = bloom(emissivePass, 10, 1);
    const postProcessing = new THREE.PostProcessing(renderer);
    postProcessing.outputNode = outputPass.add(bloomPass);

    if (processFolder) {
        processFolder.add(bloomPass.strength, 'value', 0.1, 10.0).name('strength');
        processFolder.add(bloomPass.radius, 'value', 0.1, 1).name('radius');
    }

    return postProcessing;
}

export default useBloomEmissive;