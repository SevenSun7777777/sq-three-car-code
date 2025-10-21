import gsap from 'gsap';
import { Vector3, Scene, PerspectiveCamera, WebGLRenderer, ACESFilmicToneMapping, PCFSoftShadowMap, EquirectangularReflectionMapping } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import useLoader from './hooks/useLoader.js';
import useTextures from './hooks/useTextures.js';
import carTexture from './config/car_Texture.js';

import useReflector from './hooks/webgl/useReflect.js';
import useState from './hooks/useState.js';
import useIsPhone from './hooks/useIsphone.js';
import usePointMesh from './hooks/webgl/usePointMesh.js';

const params = {
    light: false,
    enabled: false,
    showWind: false,
    showPipeline: false,
    showPipelAnimation: false,
    showWindAnimation: false,
    showWheelAnimation: false,
    materialName: '',
    setShowCircle: null,
    pointProgress: 0,
}

const state = useState();
const animateMesh = {}

const BASE_PATH = import.meta.env.VITE_BASE_PATH || '';

const isPhone = useIsPhone();

const cameraPosition = isPhone ? {
    default: new Vector3(-0.40260258305088586, 11.916490873110934, 12.199786652758286),
    light: new Vector3(4.689427338942161, 2.2032020928522513, 6.851240494307419),
    wind: new Vector3(5.168953009568095, 11.2376608919281, 11.986397449851518),
    pienline: new Vector3(1.3381118637886629, 7.570019126808835, 9.100413441202615),
} : {
    default: new Vector3(0.28629695024605345, 3.074524053509988, 8.685276746777035),
    light: new Vector3(6.287556619249137, 3.158405601191166, 7.493212729352776),
    wind: new Vector3(5.341677664495492, 2.3705014061279197, 8.456023293395148),
    pienline: new Vector3(-4.136656098043262, 2.9521076703508573, 9.088742892340287),
};

const scene = new Scene();
const camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
function updateCameraPosition(position) {
    gsap.to(camera.position, {
        duration: 1,
        x: position.x,
        y: position.y,
        z: position.z,
    })
}
updateCameraPosition(cameraPosition.default);


const canvasDom = document.querySelector('#three-canvas')
const renderer = new WebGLRenderer({
    canvas: canvasDom,
    antialias: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.toneMapping = ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = PCFSoftShadowMap;

const composerObj = useReflector(renderer, scene, camera);


const controls = new OrbitControls(camera, canvasDom);
controls.enableDamping = true;

renderer.setAnimationLoop(animate);

const loader = useLoader(BASE_PATH);
let envMapTexture = null;
async function loadEnvMapTexture() {
    envMapTexture = await loader.hdrLoader.loadAsync(`${BASE_PATH}/hdr/royal_esplanade_1k.hdr`)
    envMapTexture.mapping = EquirectangularReflectionMapping;
    scene.environment = envMapTexture;
    loadModel();
}
loadEnvMapTexture();

const carObjects = {
    headlamp: null,
    taillight: null,
    wheel: [],
    body: null,
    pointCar: null,
    car: null
}
async function loadModel() {
    const textures = await useTextures(loader.textureLoader, carTexture);
    const textModel = await loader.gltfLoader.loadAsync(`${BASE_PATH}/model/text.glb`)
    animateMesh['text_model'] = textModel.scene;
    scene.add(textModel.scene);
    const windMesh = await loader.gltfLoader.loadAsync(`${BASE_PATH}/model/wind.glb`);
    scene.add(windMesh.scene);
    createWindMatterial(windMesh);
    const pipelineMesh = await loader.gltfLoader.loadAsync(`${BASE_PATH}/model/pipeline.glb`);
    scene.add(pipelineMesh.scene);
    createPielineMaterial(pipelineMesh);
    const carWheel = await loader.gltfLoader.loadAsync(`${BASE_PATH}/model/wheel.glb`)
    const carModel = await loader.gltfLoader.loadAsync(`${BASE_PATH}/model/car.glb`)
    carWheel.scene.all_count = 0;
    carWheel.scene.all_postion = [];
    carWheel.scene.traverse(function (child) {
        if (child.isMesh) {
            child.material.transparent = true;
            child.material.opacity = 0;
            const { array, count } = child.geometry.getAttribute('position');
            carWheel.scene.all_count += count;
            array.forEach((item, index) => {
                carWheel.scene.all_postion.push(item)
            })
            carObjects.wheel.push(child);
        }
    })
    carObjects.pointCarWheel = usePointMesh(carWheel.scene.all_count, 'pointWheel');
    carObjects.pointCarWheel.to(carWheel.scene.all_postion);
    carObjects.pointCarWheel.changeUniforms(1)
    carObjects.wheelMesh = carWheel.scene;
    scene.add(carWheel.scene);
    carObjects.car = carModel.scene;
    let all_count = 0;
    let all_postion = [];
    carModel.scene.traverse(function (child) {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            child.material.transparent = true;
            child.material.opacity = 0;
            const { array, count } = child.geometry.getAttribute('position');
            all_count += count;
            array.forEach((item, index) => {
                all_postion.push(item)
            })
        }
    })

    carObjects.pointCar = usePointMesh(all_count, 'pointCar');
    carObjects.pointCar.to(all_postion);
    scene.add(carObjects.pointCar.mesh);
    carObjects.headlamp = carModel.scene.getObjectByName('headlamp');
    carObjects.taillight = carModel.scene.getObjectByName('taillight');
    carObjects.body = carModel.scene.getObjectByName('car_color');
    carObjects.body.__textures__ = textures;
    // 修改汽车透明度
    scene.add(carModel.scene);
    changeCarLightIntensity(0, 0);

}
function changeCarLightIntensity(intensity, duration = 1) {
    materialInstance(carObjects.headlamp.material, intensity, duration);
    materialInstance(carObjects.taillight.material, intensity, duration);
}
function createWindMatterial(windMesh) {
    const wind_Object = windMesh.scene.getObjectByName('WIND');
    wind_Object.material.transparent = true;
    wind_Object.material.opacity = 0;
    wind_Object.material.needUpdate = true;
    animateMesh['car_Wind'] = {};
    animateMesh['car_Wind'].__mesh__ = wind_Object;
}
function createPielineMaterial(pipelineMesh) {
    const pipeline_Object = pipelineMesh.scene.getObjectByName('pipeline');
    pipeline_Object.material.transparent = true;
    pipeline_Object.material.opacity = 0;
    pipeline_Object.material.needUpdate = true;
    animateMesh['car_Pipeline'] = {};
    animateMesh['car_Pipeline'].__mesh__ = pipeline_Object;
}
function updateMaterial(material, value) {
    material.map.offset[value] += 0.01;
    if (material.map.offset[value] > 1) material.map.offset[value] = 0;
}
// 在动画循环中更新
function animate() {
    // console.log(camera.position);

    controls.update();
    state.update();
    if (composerObj.composer) {
        composerObj.composer.render();
    }
    if (animateMesh['car_Pipeline'] && params.showPipelAnimation) {
        const pipeline_Object = animateMesh['car_Pipeline'].__mesh__;
        updateMaterial(pipeline_Object.material, 'x');
    }
    if (animateMesh['car_Wind'] && params.showWindAnimation) {
        const wind_Object = animateMesh['car_Wind'].__mesh__;
        updateMaterial(wind_Object.material, 'y');
    }
    if (carObjects.pointCar) {
        if (!carObjects.pointCar.__animation__) {
            carObjects.pointCar.__animation__ = 'statr'
        }
        if (carObjects.pointCar.__animation__ === 'statr') {
            startPointCarAnimation();
        }
    }
}

function startPointCarAnimation() {
    carObjects.pointCar.__animation__ = 'end'
    gsap.to(carObjects.pointCar.material.uniforms.progress, {
        value: 1,
        duration: 1,
        onUpdate: () => {
            carObjects.pointCar.material.needUpdate = true;
        },
        onComplete: () => {
            scene.remove(carObjects.pointCar.mesh)
            carObjects.car.traverse((child) => {
                if (child.isMesh) {
                    gsap.to(child.material, {
                        opacity: 1,
                        duration: 0.5,
                        ease: 'pawer2.inOut',
                    })
                }
            })
            carObjects.wheelMesh.traverse(
                (child) => {
                    if (child.isMesh) {
                        gsap.to(child.material, {
                            opacity: 1,
                            duration: 0.5,
                            ease: 'pawer2.inOut',
                        })
                    }
                }
            )
        }
    })
}

function materialOpcacity(material, value, showName, duration = 1) {
    if (value) params[showName] = !params[showName]
    gsap.to(material, {
        opacity: value,
        duration,
        onComplete: () => {
            if (!value) {
                params[showName] = !params[showName];
            }
        }
    })
}
function materialInstance(material, value, duration) {
    gsap.to(material, {
        emissiveIntensity: value,
        duration,
        ease: 'power2.inOut',
    })
}
function updaateTextModelPosition(flag) {
    if (flag) {
        gsap.to(animateMesh['text_model'].position, {
            x: -100,
            duration: 1,
            ease: 'power2.inOut',
            onComplete: () => {
                animateMesh['text_model'].visible = false;
            }
        })
    } else {
        gsap.to(animateMesh['text_model'].position, {
            x: 0,
            duration: 1,
            ease: 'power2.inOut',
            onUpdate: () => {
                animateMesh['text_model'].visible = true;
            }
        })
    }
}
function wheelAnimation() {
    if (!carObjects.wheel.length) return;
    // 创建或更新GSAP动画
    carObjects.wheel.forEach((wheel) => {
        if (wheel.__animation) {
            wheel.__animation.kill();
        }
        wheel.__animation = gsap.to(wheel.rotation, {
            z: "-=6", // Math.PI * 2 的近似值
            duration: 1,
            ease: "linear",
            repeat: -1
        });
    });
}
// 停止车轮旋转的函数
function stopWheelAnimation() {
    if (!carObjects.wheel.length) return;
    carObjects.wheel.forEach((wheel) => {
        wheel.__animation.kill();
        gsap.to(wheel.rotation, {
            z: '-=4',
            duration: 1,
            ease: "pawer2.inOut",
        })
    });
}
function resetCameraPosition() {
    return new Promise((resolve) => {
        gsap.to(camera.position, {
            x: cameraPosition.default.x,
            y: cameraPosition.default.y,
            z: cameraPosition.default.z,
            duration: 1,
            ease: 'power2.inOut',
            onComplete: () => {
                resolve();
            }
        })
    })
}
function startWind() {
    materialOpcacity(animateMesh['car_Wind'].__mesh__.material, 1, 'showWindAnimation');
    updateCameraPosition(cameraPosition.wind);
    wheelAnimation();
}
function stopWind() {
    materialOpcacity(animateMesh['car_Wind'].__mesh__.material, 0, 'showWindAnimation');
    updateCameraPosition(cameraPosition.default);
    stopWheelAnimation();
}
function startPipeline() {
    materialOpcacity(animateMesh['car_Pipeline'].__mesh__.material, 1, 'showPipelAnimation');
    updateCameraPosition(cameraPosition.pienline);
    updaateTextModelPosition(true);
    wheelAnimation();
}
function stopPipeline() {
    materialOpcacity(animateMesh['car_Pipeline'].__mesh__.material, 0, 'showPipelAnimation');
    updateCameraPosition(cameraPosition.default);
    updaateTextModelPosition(false);
    stopWheelAnimation();
}
function reloadPoint() {
    const pointCar = scene.getObjectByName('pointCar');
    if (pointCar) {
        // 隐藏粒子
        carObjects.car.traverse((child) => {
            if (child.isMesh) {
                gsap.to(child.material, {
                    opacity: 1,
                    duration: 0.5,
                    onComplete: () => {
                        if (scene.getObjectByName('pointCar')) {
                            scene.remove(carObjects.pointCar.mesh);
                        }
                    }
                })
            }
        })
        carObjects.wheelMesh.traverse((child) => {
            if (child.isMesh) {
                gsap.to(child.material, {
                    opacity: 1,
                    duration: 0.5,
                })
            }
        })

    } else {
        // 显示粒子
        carObjects.car.traverse((child) => {
            if (child.isMesh) {
                gsap.to(child.material, {
                    opacity: 0,
                    duration: 0.5,
                    onComplete: () => {
                        if (!scene.getObjectByName('pointCar')) {
                            scene.add(carObjects.pointCar.mesh);
                        }
                    }
                })
            }
        })
        carObjects.wheelMesh.traverse((child) => {
            if (child.isMesh) {
                gsap.to(child.material, {
                    opacity: 0,
                    duration: 0.5,
                })
            }
        })
    }
}
function initHandler() {
    const rightBtnDom = document.querySelector('.right-btn');
    rightBtnDom.addEventListener('click', handleRightButton)
    async function handleRightButton(e) {
        await resetCameraPosition();
        const name = e.target.getAttribute('data-name');
        switch (name) {
            case 'enabled':
                if (carObjects.headlamp.material.emissiveIntensity === 1) {
                    changeCarLightIntensity(0);
                    updateCameraPosition(cameraPosition.default);
                } else {
                    changeCarLightIntensity(1);
                    updateCameraPosition(cameraPosition.light);
                }
                break;
            case 'showWind':
                params[name] = !params[name];
                if (params[name]) {
                    startWind()
                } else {
                    stopWind()
                }
                break;
            case 'showPipeline':
                params[name] = !params[name];
                if (params[name]) {
                    startPipeline()
                } else {
                    stopPipeline()
                }
                break;
            case 'reloadPoint':
                reloadPoint()
                break;
            default:
                break;
        }
    }

    const btnDom = document.querySelector('.car-body-list-color');
    btnDom.addEventListener('click', handleColorButton);
    function handleColorButton(e) {
        const colorName = e.target.classList[1];
        const textures = carObjects.body.__textures__;
        if (colorName && carObjects.body.material.map !== textures[colorName]) {
            carObjects.body.material.map = textures[colorName];
            carObjects.body.material.needsUpdate = true;

        }
    }
    function resizeHandler() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        composerObj.composer.setSize(window.innerWidth, window.innerHeight);
        composerObj.groundReflector.getRenderTarget().setSize(window.innerWidth, window.innerHeight);
        composerObj.groundReflector.resolution.set(window.innerWidth, window.innerHeight);
    }
    window.addEventListener('resize', resizeHandler);
}
initHandler();
