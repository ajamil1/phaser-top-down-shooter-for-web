#ifdef GL_ES
precision mediump float;
#endif

uniform sampler2D uMainSampler;
uniform vec2 uTextureSize;
uniform vec4 uOutlineColor;
uniform float uThickness;

varying vec2 outTexCoord;

void main() {
    vec4 texColor = texture2D(uMainSampler, outTexCoord);

    if (texColor.a > 0.0) {
        // Main sprite pixel
        gl_FragColor = texColor;
        return;
    }

    float outline = 0.0;
    for (float x = -uThickness; x <= uThickness; x++) {
        for (float y = -uThickness; y <= uThickness; y++) {
            vec2 offset = vec2(x, y) / uTextureSize;
            vec4 sample = texture2D(uMainSampler, outTexCoord + offset);
            outline += step(0.01, sample.a);
        }
    }

    if (outline > 0.0) {
        gl_FragColor = uOutlineColor;
    } else {
        discard;
    }
}
