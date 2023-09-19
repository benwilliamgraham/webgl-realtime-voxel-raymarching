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

  // Render
  function render() {
    gl.clearColor(0.0, 0.0, 0.0, 1.0); // black
    gl.clear(gl.COLOR_BUFFER_BIT);
  }
  requestAnimationFrame(render);
}

main();
