#version 300 es

uniform mat4 uMVPMatrix;
uniform vec3 uVolumeSize;
uniform vec3 uCameraPosition;

in vec4 aPosition;

out vec3 vVolumeSize;   // The volume's size
out vec3 vIntersection; // The ray's starting position in volume space
out vec3 vCameraPosition;    // The camera's position in volume space

void main() {
    vVolumeSize = uVolumeSize;
    vIntersection = aPosition.xyz * uVolumeSize;
    vCameraPosition = uCameraPosition;
    vec3 pos = vIntersection;
    gl_Position = uMVPMatrix * vec4(pos, 1.0);
}