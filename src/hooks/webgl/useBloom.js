import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

export default function useBloom(renderer, mainScene, bloomScene, camera, bloomLayer) {
    const params = {
        threshold: 0.1, // 提高阈值，只有较亮的区域才会产生辉光
        strength: 0.5,  // 调整强度
        radius: 0.2,    // 调整半径
        exposure: 1,  // 调整曝光
    };

    // 主场景渲染通道
    const renderScene = new RenderPass(mainScene, camera);
    
    // 辉光场景渲染通道
    const bloomRenderPass = new RenderPass(bloomScene, camera);
    bloomRenderPass.clear = false; // 重要：不清空，叠加在现有渲染上

    const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight), 
        params.strength, 
        params.radius, 
        params.threshold
    );

    const outputPass = new OutputPass();

    const composer = new EffectComposer(renderer);
    composer.addPass(renderScene);      // 首先渲染主场景（所有物体）
    composer.addPass(bloomRenderPass);  // 然后渲染辉光物体（车灯）
    composer.addPass(bloomPass);        // 只对辉光物体应用辉光效果
    composer.addPass(outputPass);       // 输出最终结果

    return composer;
}