import { PlaneGeometry } from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { SSRPass } from 'three/addons/postprocessing/SSRPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ReflectorForSSRPass } from 'three/addons/objects/ReflectorForSSRPass.js';

export default function useReflect(renderer, scene, camera) {
    const selects = [];
    const ids = new Set();
    const geometry = new PlaneGeometry(50, 20);
    const groundReflector = new ReflectorForSSRPass(geometry, {
        clipBias: 0.0003,
        textureWidth: window.innerWidth,
        textureHeight: window.innerHeight,
        color: 0x888888,
        useDepthTexture: true,
    });
    groundReflector.material.depthWrite = false;
    groundReflector.rotation.x = - Math.PI / 2;
    groundReflector.visible = false;
    scene.add(groundReflector);
    const composer = new EffectComposer(renderer);
    const ssrPass = new SSRPass({
        renderer,
        scene,
        camera,
        width: window.innerWidth,
        height: window.innerHeight,
        groundReflector: groundReflector,
        selects: selects
    });
    composer.addPass(ssrPass);
    composer.addPass(new OutputPass());

    ssrPass.thickness = 0.018;
    ssrPass.maxDistance = 50;
    groundReflector.maxDistance = ssrPass.maxDistance;
    ssrPass.opacity = 1;
    groundReflector.opacity = ssrPass.opacity;

    function addMesh({ id, mesh }) {
        if (!ids.has(id)) {
            selects.push(mesh);
        }
    }
    return {
        composer,
        groundReflector,
        addMesh
    }
}