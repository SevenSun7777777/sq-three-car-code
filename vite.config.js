import { defineConfig } from 'vite';
import glsl from 'vite-plugin-glsl';

export default defineConfig({
    plugins: [glsl()],
    server: {
        open: true
    },
    build: {
        rollupOptions: {
            output: {
                manualChunks(id) {
                    // 简单的按 node_modules 分包，Rollup 会自动优化大小
                    if (id.includes('gsap')) {
                        return 'gsap';
                    } else if (id.includes('three')) {
                        return 'three';
                    } else {
                        return 'vendor';
                    }
                },
                // 让 Rollup 自动处理 chunk 分割
                experimentalMinChunkSize: 200000 // 200KB
            }
        }
    }
})