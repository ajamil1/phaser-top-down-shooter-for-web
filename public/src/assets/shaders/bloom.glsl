class MyBloomPipeline extends Phaser.Renderer.WebGL.Pipelines.TextureTintPipeline {
    constructor(game) {
        super({
            game: game,
            renderer: game.renderer,
            fragShader: `
                precision mediump float;
                
                uniform sampler2D uMainSampler;
                uniform vec2 resolution;
                uniform vec2 direction;
                
                varying vec2 outTexCoord;
                
                void main() {
                    vec4 color = vec4(0.0);
                    vec2 texOffset = 1.0 / resolution; // Getting pixel size based on resolution
                    float weight[5] = float[5](0.227027, 0.1945946, 0.1216216, 0.054054, 0.016216);
                    
                    // Apply Gaussian blur in the given direction
                    for (int i = -4; i <= 4; i++) {
                        color += texture2D(uMainSampler, outTexCoord + direction * texOffset * float(i)) * weight[abs(i)];
                    }
                    
                    gl_FragColor = color;
                }
            `
        });
    }
}

precision mediump float;

uniform sampler2D uMainSampler;
uniform vec2 resolution;
uniform vec2 direction;

varying vec2 outTexCoord;

void main()
{
    vec4 color = vec4(0.0);
    vec2 texOffset = 1.0 / resolution; // Getting pixel size based on resolution
    float weight[5] = float[5](0.227027, 0.1945946, 0.1216216, 0.054054, 0.016216);
    
    // Applying Gaussian blur in the direction (horizontal or vertical)
    for (int i = -4; i <= 4; i++)
    {
        color += texture2D(uMainSampler, outTexCoord + direction * texOffset * float(i)) * weight[abs(i)];
    }
    
    gl_FragColor = color;
}
