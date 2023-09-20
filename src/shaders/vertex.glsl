attribute vec4 aPosition;

uniform mat4 uMVPMatrix;
uniform vec3 uVolumeSize;

void main() {
    vec3 pos = aPosition.xyz * uVolumeSize - uVolumeSize / 2.0;
    gl_Position = uMVPMatrix * vec4(pos, 1.0);
}