import { Renderer } from 'phaser';

class SkewPipeline extends Renderer.WebGL.Pipelines.TextureTintPipeline {
    constructor(game) {
        super({
            game: game,
            renderer: game.renderer,
            fragShader: `
                precision mediump float;
                uniform sampler2D uMainSampler;
                varying vec2 outTexCoord;
                void main(void) {
                    gl_FragColor = texture2D(uMainSampler, outTexCoord);
                }
            `,
            vertShader: `
                precision mediump float;
                attribute vec2 aVertexPosition;
                attribute vec2 aTextureCoord;
                uniform mat3 uProjectionMatrix;
                uniform float uSkew;
                varying vec2 outTexCoord;
                void main(void) {
                    vec2 position = aVertexPosition;
                    position.x += aTextureCoord.y * uSkew;
                    gl_Position = vec4((uProjectionMatrix * vec3(position, 1.0)).xy, 0.0, 1.0);
                    outTexCoord = aTextureCoord;
                }
            `,
            attributes: {
                aVertexPosition: { location: 0, size: 2 },
                aTextureCoord: { location: 1, size: 2 },
            },
            uniforms: [
                'uProjectionMatrix',
                'uMainSampler',
                'uSkew',
            ],
        });
    }
}

export default SkewPipeline;