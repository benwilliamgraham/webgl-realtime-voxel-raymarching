#version 300 es

precision mediump float;
precision mediump sampler3D;

uniform sampler3D uVolume;

in vec3 vVolumeSize;   // The volume's size
in vec3 vIntersection; // The ray's starting position in volume space
in vec3 vCameraPosition;    // The camera's position in volume space

out vec4 fragColor;

struct Intersection {
  vec4 color;
  float distSq;
};

float distSq(vec3 a, vec3 b) {
  vec3 d = a - b;
  return dot(d, d);
}

vec4 sampleVolume(vec3 position) {
  return texture(uVolume, position / vVolumeSize);
}

Intersection rayMarch(vec3 rayStart,    // entry point in volume space
                      vec3 rayDirection // ray direction in volume space
) {
  Intersection intersection;
  intersection.color = vec4(0.0);
  intersection.distSq = 1e10;

  // march over x planes
  if (rayDirection.x > 0.0) {
    vec3 p = rayStart;

    // find the first x plane intersection
    float x = ceil(p.x);
    float dist_to_plane = x - p.x;
    p += rayDirection * (dist_to_plane / rayDirection.x);
    p.x = x;

    // march over x planes
    vec3 step = rayDirection / rayDirection.x;
    while (p.x <= vVolumeSize.x && p.y >= 0.0 && p.y < vVolumeSize.y &&
           p.z >= 0.0 && p.z < vVolumeSize.z) {
      vec4 color = sampleVolume(p + vec3(0.5, 0.0, 0.0));
      if (color.a != 0.0) {
        intersection.distSq = distSq(p, rayStart);
        intersection.color = color;
        break;
      }
      p += step;
    }
  }

  return intersection;
}

void main() {
  vec3 rayDirection = normalize(vIntersection - vCameraPosition);

  Intersection intersection = rayMarch(vIntersection, rayDirection);

  if (intersection.color.a == 0.0) {
    discard;
  } else {
    fragColor = intersection.color;
  }
}