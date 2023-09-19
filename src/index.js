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
  // 0----1
  // |  /
  // |/
  // 2
  const vertices = [
    // 0
    -0.5, 0.5, 0.0,
    // 1
    0.5, 0.5, 0.0,
    // 2
    -0.5, -0.5, 0.0,
  ];
  const vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

  // Create vertex array object
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);

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

    // Bind vertex array object
    gl.bindVertexArray(vao);

    // Draw triangle
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  requestAnimationFrame(render);
}

main();
