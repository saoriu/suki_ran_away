precision mediump float;

varying vec2 vUv;
uniform sampler2D uSampler;
uniform float uTime;

void main(void) {
    vec4 color = texture2D(uSampler, vUv);
    float distortion = sin(vUv.y * 3.14159 + uTime) * 0.1;
    color.rgb += distortion;
    gl_FragColor = color;
}