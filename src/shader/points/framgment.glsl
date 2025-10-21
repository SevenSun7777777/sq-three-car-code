uniform float opacity;
varying vec3 vUv;
void main() {
    vec3 color = vec3(vUv);
    gl_FragColor = vec4(color, opacity);
}