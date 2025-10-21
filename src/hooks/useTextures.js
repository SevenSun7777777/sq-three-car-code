export default function useTextures(loader, data) {
    if (!loader) return new Error('Loader is required');
    if (!data) return new Error('Data is required');
    const BASE_PATH = import.meta.env.VITE_BASE_PATH || '';
    return new Promise((resolve, reject) => {
        try {
            const textures = {};
            data.forEach((item) => {
                const texture = loader.load(`${BASE_PATH}${item.path}`);
                texture.flipY = false;
                textures[item.name] = texture;
            })
            resolve(textures);
        } catch (error) {
            reject(error);
        }
    })
}