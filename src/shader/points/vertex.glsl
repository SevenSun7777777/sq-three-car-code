uniform float progress;
attribute vec3 toPosition;

varying vec3 vUv;  // 在这里声明 varying 变量

void main() {
    vec3 distance = toPosition - position;
    vec3 pos = position + distance * progress;
    
    vUv = pos;  // 赋值给 varying 变量
    
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = 1.0;
    gl_PointSize *= 1.0 / -(modelViewMatrix * vec4(pos, 1.0)).z;
}