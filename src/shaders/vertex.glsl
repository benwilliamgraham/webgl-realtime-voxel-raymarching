#version 300 es

uniform mat4 uMVPMatrix;
uniform vec3 uVolumeSize;

in vec4 aPosition;

out vec3 vVolumeSize; // The volume's size
out vec3 vIntersection; // The ray's starting position in volume space

void main() {
    vVolumeSize = uVolumeSize;
    vIntersection = aPosition.xyz * uVolumeSize;
    vec3 pos = vIntersection - uVolumeSize / 2.0;
    gl_Position = uMVPMatrix * vec4(pos, 1.0);
}