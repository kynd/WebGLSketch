varying vec2 vUv;
varying vec3 vNormal;
uniform vec2 res;
uniform vec3 cA;
uniform float t;
uniform sampler2D tex;

void main( void ) {
    vec2 scrCrd = gl_FragCoord.xy - res * 0.5;

    vec4 color = texture2D(tex, gl_FragCoord.xy / res);

    float lev = vUv.y <= t ? 1.0 : 0.0;

    //vec4 color = vec4(vUv, 1.0, 1.0);
    color = mix(color, vec4(cA ,1.0), lev);
    gl_FragColor = color;

}