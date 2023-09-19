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

  const vertexShaderSource = `
    attribute vec4 aPosition;

    void main() {
        gl_Position = aPosition;
    }
    `;
  const vertexShader = compileShader(gl.VERTEX_SHADER, vertexShaderSource);

  const fragmentShaderSource = `
    precision mediump float;

    void main() {
        gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
    }
    `;
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

  // Render
  function render() {
    // Clear screen
    gl.clearColor(0.0, 0.0, 0.0, 1.0); // black
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Use shader program
    gl.useProgram(program);

    // Bind vertex array object
    gl.bindVertexArray(vao);

    // Draw triangle
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  requestAnimationFrame(render);
}

main();
