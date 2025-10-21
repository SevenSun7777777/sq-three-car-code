import Stats from 'three/examples/jsm/libs/stats.module.js';
export default function useState() {
    const stats = new Stats();
    stats.showPanel(0);
    document.body.appendChild(stats.dom);
    return stats;
}