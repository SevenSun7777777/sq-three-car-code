import * as THREE from 'three/webgpu'
export default function useModelToPoint(count = 1000) {
    const burrerGeometry = new THREE.BufferGeometry()
    const position = new Float32Array(count * 3)
    burrerGeometry.setAttribute(
        'position',
        new THREE.BufferAttribute(position, 3)
    )
    // 生成随机点
    for (let i = 0; i < count; i++) {
        const i3 = i * 3
        position[i3] = (0.5 - Math.random()) * 50
        position[i3 + 1] = (0.5 - Math.random()) * 50
        position[i3 + 2] = (0.5 - Math.random()) * 50
    }
    const particle = new THREE.Points(
        burrerGeometry,
        new THREE.PointsMaterial({ size: 0.5, color: 0xffffff })
    )
    burrerGeometry.attributes.position.needsUpdate = true
    return particle
}