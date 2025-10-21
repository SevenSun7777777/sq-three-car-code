import * as THREE from 'three'
import { hashBlur } from 'three/addons/tsl/display/hashBlur.js';
import { Fn, vec4, fract, sample, abs, uniform, pow, color, max, length, rangeFogFactor, sub, reflector, normalWorld, hue, time, mix, positionWorld } from 'three/tsl';

function useReflection() {
    // 创建可动态更新的uniform
    const showCircleUniform = uniform(false);
    const circleIntensityUniform = uniform(1.0);

    // 光圈效果函数 - 始终定义但通过uniform控制显示
    const drawCircle = Fn(([pos, radius, width, power, color, timer = time.mul(.5)]) => {
        const dist1 = length(pos);
        dist1.assign(fract(dist1.mul(5.0).sub(fract(timer))));
        const dist2 = dist1.sub(radius);
        const intensity = pow(radius.div(abs(dist2)), width);
        const col = color.rgb.mul(intensity).mul(power).mul(max(sub(0.8, abs(dist2)), 0.0));
        return col;
    });

    // reflection
    const roughness = uniform(0.9);
    const radius = uniform(0.2);

    const reflection = reflector({ resolutionScale: .5, depth: true, bounces: false });
    const reflectionDepth = reflection.getDepthNode();
    reflection.target.rotateX(- Math.PI / 2);

    const floorMaterial = new THREE.MeshStandardNodeMaterial();
    floorMaterial.transparent = true;
    floorMaterial.colorNode = Fn(() => {

        // ranges adjustment
        const radiusRange = mix(0.01, 0.1, radius); // range [ 0.01, 0.1 ]
        const roughnessRange = mix(0.3, 0.03, roughness); // range [ 0.03, 0.3 ]

        // mask the sample
        const maskReflection = sample((uv) => {
            const sample = reflection.sample(uv);
            const mask = reflectionDepth.sample(uv);
            return vec4(sample.rgb, sample.a.mul(mask.r));
        }, reflection.uvNode);

        // blur the reflection
        const reflectionBlurred = hashBlur(maskReflection, radiusRange, {
            repeats: 40,
            premultipliedAlpha: true
        });

        // reflection composite
        const reflectionMask = reflectionBlurred.a.mul(reflectionDepth).remapClamp(0, roughnessRange);
        const reflectionIntensity = .1;
        const reflectionMixFactor = reflectionMask.mul(roughness.mul(2).min(1));
        const reflectionFinal = mix(reflection.rgb, reflectionBlurred.rgb, reflectionMixFactor).mul(reflectionIntensity);

        // 动态控制光圈显示 - 使用条件节点而不是if语句
        const circleFadeY = positionWorld.y.mul(.7).oneMinus().max(0);
        const animatedColor = mix(color(0x74ccf4), color(0x7f00c5), positionWorld.xz.distance(0).div(10).clamp());
        const animatedCircle = hue(drawCircle(positionWorld.xz.mul(.1), 0.5, 0.8, .01, animatedColor).mul(circleFadeY), time);

        // 使用mix根据showCircleUniform混合效果，性能更好
        const finalColor = mix(
            reflectionFinal,
            animatedCircle.add(reflectionFinal),
            showCircleUniform
        ).mul(mix(1.0, circleIntensityUniform, showCircleUniform));

        // falloff opacity by distance like an opacity-fog
        const opacity = rangeFogFactor(7, 25).oneMinus();

        // final output
        return vec4(finalColor, opacity);

    })();

    const floor = new THREE.Mesh(new THREE.BoxGeometry(50, .001, 50), floorMaterial);
    floor.position.set(0, 0, 0);

    const waterAmbientLight = new THREE.HemisphereLight(0xffffff, 0x0066ff, 10);

    // 背景节点也支持动态切换
    const backgroundNode = hue(normalWorld.y.mix(0, color(0xeeeeee)).mul(.1), time);
    
    // 返回控制方法
    return {
        floor,
        target: reflection.target,
        light: waterAmbientLight,
        background: backgroundNode,
        controls: {
            setShowCircle: () => {
                showCircleUniform.value = !showCircleUniform.value;
            },
            setCircleIntensity: (value) => {
                circleIntensityUniform.value = value;
            },
            setRoughness: (value) => {
                roughness.value = value;
            },
            setRadius: (value) => {
                radius.value = value;
            }
        }
    }
}

export default useReflection;