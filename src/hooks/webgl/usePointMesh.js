import { BufferGeometry, BufferAttribute, ShaderMaterial, Points } from 'three'
import vertext from '../../shader/points/vertex.glsl'
import framgment from '../../shader/points/framgment.glsl'
export default function usePointMesh(count, name) {
    // 创建一个几何体
    const geometry = new BufferGeometry();
    // 创建一个顶点数组
    const vertices = new Float32Array(count * 3);
    const toVerices = new Float32Array(count * 3);
    // 将顶点数组添加到几何体中
    geometry.setAttribute('position', new BufferAttribute(vertices, 3));
    geometry.setAttribute('toPosition', new BufferAttribute(toVerices, 3));

    // 随机生成顶点坐标
    // 简单的噪声函数
    function noise(x, y, z) {
        return Math.sin(x * 12.9898 + y * 78.233 + z * 42.765) * 43758.5453 % 1;
    }

    for (let i = 0; i < count; i++) {
        const i3 = i * 3;

        const angle = Math.random() * Math.PI * 2;
        const radius = 20 + Math.random() * 30;

        const baseX = radius * Math.cos(angle);
        const baseY = radius * Math.sin(angle);
        const baseZ = (Math.random() - 0.5) * 40;

        // 添加噪声扰动
        const noiseScale = 15;
        toVerices[i3] = baseX + noise(baseX, baseY, baseZ) * noiseScale;
        toVerices[i3 + 1] = baseY + noise(baseY, baseZ, baseX) * noiseScale;
        toVerices[i3 + 2] = baseZ + noise(baseZ, baseX, baseY) * noiseScale;
    }
    geometry.attributes.toPosition.needsUpdate = true;
    // 创建一个材质
    const uniforms = {
        progress: {
            value: 0
        },
        opacity: { value: 1 }
    }
    const material = new ShaderMaterial({
        vertexShader: vertext,
        fragmentShader: framgment,
        uniforms
    })
    material.transparent = true;
    // 创建一个点云
    const pointMesh = new Points(geometry, material);
    pointMesh.name = name;
    function to(position) {
        for (let i = 0; i < count; i++) {
            const i3 = i * 3;
            vertices[i3] = toVerices[i3];
            vertices[i3 + 1] = toVerices[i3 + 1];
            vertices[i3 + 2] = toVerices[i3 + 2];

            toVerices[i3] = position[i3];
            toVerices[i3 + 1] = position[i3 + 1];
            toVerices[i3 + 2] = position[i3 + 2];
        }
        geometry.attributes.position.needsUpdate = true;
        geometry.attributes.toPosition.needsUpdate = true;
    }
    function changeUniforms(value) {
        material.uniforms.progress.value = value;
    }
    return {
        mesh: pointMesh,
        material,
        changeUniforms,
        to
    };
}