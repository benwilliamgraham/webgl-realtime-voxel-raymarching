"use strict";

// Setup canvas
const canvas = document.createElement("canvas");
canvas.width = 1200;
canvas.height = 800;
document.body.appendChild(canvas);

// Main function
async function main() {
  // Setup WebGL
  const gl = canvas.getContext("webgl2");
  if (!gl) {
    throw new Error("WebGL2 not supported");
  }

  // Compile shaders
  function compileShader(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      throw new Error(`Error compiling shader: ` + gl.getShaderInfoLog(shader));
    }
    return shader;
  }

  const vertexShaderSource = await fetch("src/shaders/vertex.glsl").then(
    (res) => res.text()
  );
  const vertexShader = compileShader(gl.VERTEX_SHADER, vertexShaderSource);

  const fragmentShaderSource = await fetch("src/shaders/fragment.glsl").then(
    (res) => res.text()
  );
  const fragmentShader = compileShader(
    gl.FRAGMENT_SHADER,
    fragmentShaderSource
  );

  // Create shader program
  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error("Error linking program" + gl.getProgramInfoLog(program));
  }

  // Create vertex buffer
  //    3-----7
  //   /|    /|
  //  2-----6 |
  //  | 1---|-5  y z
  //  |/    |/   |/
  //  0-----4    *---> x
  const vertices = [
    // 0
    0.0, 0.0, 0.0,
    // 1
    0.0, 0.0, 1.0,
    // 2
    0.0, 1.0, 0.0,
    // 3
    0.0, 1.0, 1.0,
    // 4
    1.0, 0.0, 0.0,
    // 5
    1.0, 0.0, 1.0,
    // 6
    1.0, 1.0, 0.0,
    // 7
    1.0, 1.0, 1.0,
  ];
  const vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

  // Create index buffer
  const indices = [
    // x- face
    1, 3, 2, 1, 2, 0,
    // x+ face
    4, 6, 7, 4, 7, 5,
    // y- face
    1, 0, 4, 1, 4, 5,
    // y+ face
    2, 3, 7, 2, 7, 6,
    // z- face
    0, 2, 6, 0, 6, 4,
    // z+ face
    5, 7, 3, 5, 3, 1,
  ];
  const indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(
    gl.ELEMENT_ARRAY_BUFFER,
    new Uint16Array(indices),
    gl.STATIC_DRAW
  );

  // Create vertex array object
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);

  // Bind vertex buffer
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);

  // Bind index buffer
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

  // Setup vertex attributes
  const aPositionLocation = gl.getAttribLocation(program, "aPosition");
  gl.enableVertexAttribArray(aPositionLocation);

  const size = 3;
  const type = gl.FLOAT;
  const normalize = false;
  const stride = 0;
  const offset = 0;

  gl.vertexAttribPointer(
    aPositionLocation,
    size,
    type,
    normalize,
    stride,
    offset
  );

  // Create matrices
  const FOV = (45 * Math.PI) / 180;
  const aspect = canvas.width / canvas.height;
  const zNear = 0.1;
  const zFar = 100.0;
  const projectionMatrix = mat4.create();
  mat4.perspective(projectionMatrix, FOV, aspect, zNear, zFar);

  const viewMatrix = mat4.create();
  mat4.translate(viewMatrix, viewMatrix, [0.0, 0.0, -2.0]);

  const modelMatrix = mat4.create();
  mat4.translate(modelMatrix, modelMatrix, [0.0, 0.0, 0.0]);

  // Handle inputs
  let lastX = 0;
  let lastY = 0;
  let dragging = false;
  let pitch = 0;
  let yaw = 0;
  let distance = 2;

  function updateViewMatrix() {
    const rotation = mat4.create();
    mat4.rotateX(rotation, rotation, pitch);
    mat4.rotateY(rotation, rotation, yaw);

    const translation = mat4.create();
    mat4.translate(translation, translation, [0.0, 0.0, -distance]);

    mat4.multiply(viewMatrix, translation, rotation);
  }

  canvas.addEventListener("mousedown", (e) => {
    lastX = e.offsetX;
    lastY = e.offsetY;
    dragging = true;
  });

  canvas.addEventListener("mouseup", () => {
    dragging = false;
  });

  canvas.addEventListener("mousemove", (e) => {
    if (!dragging) {
      return;
    }

    const xDelta = e.offsetX - lastX;
    const yDelta = e.offsetY - lastY;

    pitch += yDelta * 0.01;
    yaw += xDelta * 0.01;

    lastX = e.offsetX;
    lastY = e.offsetY;

    updateViewMatrix();
    requestAnimationFrame(render);
  });

  // Handle scroll events
  canvas.addEventListener("wheel", (e) => {
    distance -= e.deltaY * 0.01;
    distance = Math.max(distance, 0.001);

    updateViewMatrix();
    requestAnimationFrame(render);
  });

  // Create volume
  let volumeSize = [4, 4, 4];
  let volume = new Uint8Array(
    volumeSize[0] * volumeSize[1] * volumeSize[2] * 4
  );
  for (let z = 0; z < volumeSize[2]; z++) {
    for (let y = 0; y < volumeSize[1]; y++) {
      for (let x = 0; x < volumeSize[0]; x++) {
        const index =
          (x + y * volumeSize[0] + z * volumeSize[0] * volumeSize[1]) * 4;
        volume[index + 0] = (x / volumeSize[0]) * 255;
        volume[index + 1] = (y / volumeSize[1]) * 255;
        volume[index + 2] = (z / volumeSize[2]) * 255;
        volume[index + 3] = 255;
      }
    }
  }

  const volumeTexture = gl.createTexture();

  function uploadVolume() {
    distance = 2 * Math.max(...volumeSize);

    gl.bindTexture(gl.TEXTURE_3D, volumeTexture);
    gl.texImage3D(
      gl.TEXTURE_3D,
      0,
      gl.RGBA,
      volumeSize[0],
      volumeSize[1],
      volumeSize[2],
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      volume
    );

    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    gl.generateMipmap(gl.TEXTURE_3D);

    updateViewMatrix();
    requestAnimationFrame(render);
  }

  // Render
  function render() {
    // Clear screen
    gl.clearColor(0.0, 0.0, 0.0, 1.0); // black
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Use shader program
    gl.useProgram(program);

    // Upload matrices
    const uMVPMatrix = mat4.create();
    mat4.multiply(uMVPMatrix, projectionMatrix, viewMatrix);
    mat4.multiply(uMVPMatrix, uMVPMatrix, modelMatrix);

    const uMVPMatrixLocation = gl.getUniformLocation(program, "uMVPMatrix");
    gl.uniformMatrix4fv(uMVPMatrixLocation, false, uMVPMatrix);

    // Upload volume size
    const uVolumeSizeLocation = gl.getUniformLocation(program, "uVolumeSize");
    gl.uniform3f(uVolumeSizeLocation, ...volumeSize);

    // Upload volume texture
    const uVolumeLocation = gl.getUniformLocation(program, "uVolume");
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_3D, volumeTexture);
    gl.uniform1i(uVolumeLocation, 0);

    // Bind vertex array object
    gl.bindVertexArray(vao);

    // Draw triangle
    gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
  }

  uploadVolume();
}

main();
