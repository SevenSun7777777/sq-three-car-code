function useFleeting(fleeting, config={}, guiFolder) {
    if (!fleeting.material.map) {
        // 创建一个简单的渐变纹理用于流光效果
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const context = canvas.getContext('2d');

        const gradient = context.createLinearGradient(0, 0, 256, 0);
        gradient.addColorStop(0, '#000000');
        gradient.addColorStop(0.3, '#ffffff');
        gradient.addColorStop(0.7, '#ffffff');
        gradient.addColorStop(1, '#000000');

        context.fillStyle = gradient;
        context.fillRect(0, 0, 256, 256);

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;

        fleeting.material.map = texture;
        fleeting.material.needsUpdate = true;
    }
    // 设置材质属性以增强流光效果
    fleeting.material.transparent = true;
    fleeting.material.opacity = 0.8;

    // 流光效果参数
    const flowEffect = {
        speed: 0.005,
        direction: 'vertical', // 'horizontal' 或 'vertical'
        enabled: true,
        ...config
    };
    guiFolder.add(flowEffect, 'speed', 0.01, 0.1).name('流速');
    guiFolder.add(flowEffect, 'direction', ['horizontal', 'vertical']).name('方向');
    return function (enabled = true) {
        flowEffect.enabled = enabled;
        // 应用流光效果
        if (fleeting && fleeting.isMesh && flowEffect.enabled) {
            const material = fleeting.material;
            if (material.map) {
                // 如果有贴图，位移贴图
                if (flowEffect.direction === 'horizontal') {
                    material.map.offset.x += flowEffect.speed;
                    // 循环偏移
                    if (material.map.offset.x > 1) material.map.offset.x = 0;
                } else {
                    material.map.offset.y += flowEffect.speed;
                    if (material.map.offset.y > 1) material.map.offset.y = 0;
                }
                material.map.needsUpdate = true;
            }

            // 如果材质有 emissiveMap，也可以位移它来增强效果
            if (material.emissiveMap) {
                if (flowEffect.direction === 'horizontal') {
                    material.emissiveMap.offset.x += flowEffect.speed;
                    if (material.emissiveMap.offset.x > 1) material.emissiveMap.offset.x = 0;
                } else {
                    material.emissiveMap.offset.y += flowEffect.speed;
                    if (material.emissiveMap.offset.y > 1) material.emissiveMap.offset.y = 0;
                }
                material.emissiveMap.needsUpdate = true;
            }
        }
    }
}

export default useFleeting;