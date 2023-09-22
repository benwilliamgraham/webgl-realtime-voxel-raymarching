#version 300 es

precision mediump float;
precision mediump sampler3D;

uniform sampler3D uVolume;

in vec3 vVolumeSize; // The volume's size
in vec3 vIntersection; // The ray's starting position in volume space

out vec4 fragColor;

void main() {
    fragColor = texture(uVolume, vIntersection / vVolumeSize);
}