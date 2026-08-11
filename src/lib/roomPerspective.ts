type Point = { x: number; y: number };
type Triangle = [Point, Point, Point];

let projectionCanvas: HTMLCanvasElement | null = null;
let projectionRenderer: WebGLRenderer | null = null;

type WebGLRenderer = {
  gl: WebGLRenderingContext;
  program: WebGLProgram;
  position: number;
  source: WebGLUniformLocation;
  inverseHomography: WebGLUniformLocation;
  resolution: WebGLUniformLocation;
  texture: WebGLTexture;
};

const VERTEX_SHADER = `
  attribute vec2 a_position;
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

const FRAGMENT_SHADER = `
  precision highp float;
  uniform sampler2D u_source;
  uniform mat3 u_inverseHomography;
  uniform vec2 u_resolution;

  void main() {
    vec3 destination = vec3(gl_FragCoord.x, u_resolution.y - gl_FragCoord.y, 1.0);
    vec3 projected = u_inverseHomography * destination;
    vec2 uv = projected.xy / projected.z;
    if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) discard;
    gl_FragColor = texture2D(u_source, uv);
  }
`;

function compileShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("The perspective shader could not be created.");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const details = gl.getShaderInfoLog(shader) ?? "Unknown shader error";
    gl.deleteShader(shader);
    throw new Error(`The perspective shader could not start: ${details}`);
  }
  return shader;
}

function createRenderer(canvas: HTMLCanvasElement): WebGLRenderer | null {
  const gl = canvas.getContext("webgl", {
    alpha: true,
    antialias: false,
    depth: false,
    premultipliedAlpha: true,
    preserveDrawingBuffer: true,
    stencil: false,
  });
  if (!gl) return null;
  const vertex = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
  const fragment = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
  const program = gl.createProgram();
  if (!program) throw new Error("The perspective renderer could not be created.");
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(
      `The perspective renderer could not start: ${gl.getProgramInfoLog(program) ?? "Unknown link error"}`,
    );
  }
  const position = gl.getAttribLocation(program, "a_position");
  const source = gl.getUniformLocation(program, "u_source");
  const inverseHomography = gl.getUniformLocation(program, "u_inverseHomography");
  const resolution = gl.getUniformLocation(program, "u_resolution");
  const buffer = gl.createBuffer();
  const texture = gl.createTexture();
  if (position < 0 || !source || !inverseHomography || !resolution || !buffer || !texture) {
    throw new Error("The perspective renderer is missing a required GPU resource.");
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
    gl.STATIC_DRAW,
  );
  gl.useProgram(program);
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.uniform1i(source, 0);
  return { gl, program, position, source, inverseHomography, resolution, texture };
}

function rendererFor(
  width: number,
  height: number,
): { canvas: HTMLCanvasElement; renderer: WebGLRenderer } | null {
  if (!projectionCanvas) projectionCanvas = document.createElement("canvas");
  if (projectionCanvas.width !== width || projectionCanvas.height !== height) {
    projectionCanvas.width = width;
    projectionCanvas.height = height;
    projectionRenderer = null;
  }
  if (!projectionRenderer) projectionRenderer = createRenderer(projectionCanvas);
  return projectionRenderer ? { canvas: projectionCanvas, renderer: projectionRenderer } : null;
}

/** Returns the row-major homography that maps a unit square onto a destination quad. */
export function homographyForQuad(quad: Point[]): number[] | null {
  const [topLeft, topRight, bottomRight, bottomLeft] = quad;
  if (!topLeft || !topRight || !bottomRight || !bottomLeft) return null;
  const dx1 = topRight.x - bottomRight.x;
  const dx2 = bottomLeft.x - bottomRight.x;
  const dx3 = topLeft.x - topRight.x + bottomRight.x - bottomLeft.x;
  const dy1 = topRight.y - bottomRight.y;
  const dy2 = bottomLeft.y - bottomRight.y;
  const dy3 = topLeft.y - topRight.y + bottomRight.y - bottomLeft.y;
  let g = 0;
  let h = 0;
  if (Math.abs(dx3) > 0.000001 || Math.abs(dy3) > 0.000001) {
    const determinant = dx1 * dy2 - dx2 * dy1;
    if (Math.abs(determinant) < 0.000001) return null;
    g = (dx3 * dy2 - dx2 * dy3) / determinant;
    h = (dx1 * dy3 - dx3 * dy1) / determinant;
  }
  const matrix = [
    topRight.x - topLeft.x + g * topRight.x,
    bottomLeft.x - topLeft.x + h * bottomLeft.x,
    topLeft.x,
    topRight.y - topLeft.y + g * topRight.y,
    bottomLeft.y - topLeft.y + h * bottomLeft.y,
    topLeft.y,
    g,
    h,
    1,
  ];
  return invertMatrix3(matrix) ? matrix : null;
}

export function invertMatrix3(matrix: number[]): number[] | null {
  if (matrix.length !== 9) return null;
  const [a, b, c, d, e, f, g, h, i] = matrix as [
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
  ];
  const determinant = a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g);
  if (Math.abs(determinant) < 0.000001) return null;
  return [
    (e * i - f * h) / determinant,
    (c * h - b * i) / determinant,
    (b * f - c * e) / determinant,
    (f * g - d * i) / determinant,
    (a * i - c * g) / determinant,
    (c * d - a * f) / determinant,
    (d * h - e * g) / determinant,
    (b * g - a * h) / determinant,
    (a * e - b * d) / determinant,
  ];
}

function asColumnMajor(matrix: number[]): Float32Array {
  return new Float32Array([
    matrix[0]!,
    matrix[3]!,
    matrix[6]!,
    matrix[1]!,
    matrix[4]!,
    matrix[7]!,
    matrix[2]!,
    matrix[5]!,
    matrix[8]!,
  ]);
}

function expandTriangle(triangle: Triangle, pixels: number): Triangle {
  const center = {
    x: (triangle[0].x + triangle[1].x + triangle[2].x) / 3,
    y: (triangle[0].y + triangle[1].y + triangle[2].y) / 3,
  };
  return triangle.map((point) => {
    const distance = Math.hypot(point.x - center.x, point.y - center.y) || 1;
    return {
      x: point.x + ((point.x - center.x) / distance) * pixels,
      y: point.y + ((point.y - center.y) / distance) * pixels,
    };
  }) as Triangle;
}

function drawFallbackTriangle(
  context: CanvasRenderingContext2D,
  image: CanvasImageSource,
  source: Triangle,
  destination: Triangle,
) {
  const [s0, s1, s2] = source;
  const [d0, d1, d2] = expandTriangle(destination, 0.85);
  const determinant = s0.x * (s1.y - s2.y) + s1.x * (s2.y - s0.y) + s2.x * (s0.y - s1.y);
  if (Math.abs(determinant) < 0.0001) return;
  const a = (d0.x * (s1.y - s2.y) + d1.x * (s2.y - s0.y) + d2.x * (s0.y - s1.y)) / determinant;
  const b = (d0.y * (s1.y - s2.y) + d1.y * (s2.y - s0.y) + d2.y * (s0.y - s1.y)) / determinant;
  const c = (d0.x * (s2.x - s1.x) + d1.x * (s0.x - s2.x) + d2.x * (s1.x - s0.x)) / determinant;
  const d = (d0.y * (s2.x - s1.x) + d1.y * (s0.x - s2.x) + d2.y * (s1.x - s0.x)) / determinant;
  const e =
    (d0.x * (s1.x * s2.y - s2.x * s1.y) +
      d1.x * (s2.x * s0.y - s0.x * s2.y) +
      d2.x * (s0.x * s1.y - s1.x * s0.y)) /
    determinant;
  const f =
    (d0.y * (s1.x * s2.y - s2.x * s1.y) +
      d1.y * (s2.x * s0.y - s0.x * s2.y) +
      d2.y * (s0.x * s1.y - s1.x * s0.y)) /
    determinant;
  context.save();
  context.beginPath();
  context.moveTo(d0.x, d0.y);
  context.lineTo(d1.x, d1.y);
  context.lineTo(d2.x, d2.y);
  context.closePath();
  context.clip();
  context.transform(a, b, c, d, e, f);
  context.drawImage(image, 0, 0);
  context.restore();
}

function drawSeamlessFallback(
  context: CanvasRenderingContext2D,
  layer: HTMLCanvasElement,
  quad: Point[],
) {
  const [topLeft, topRight, bottomRight, bottomLeft] = quad;
  if (!topLeft || !topRight || !bottomRight || !bottomLeft) return;
  drawFallbackTriangle(
    context,
    layer,
    [
      { x: 0, y: 0 },
      { x: layer.width, y: 0 },
      { x: layer.width, y: layer.height },
    ],
    [topLeft, topRight, bottomRight],
  );
  drawFallbackTriangle(
    context,
    layer,
    [
      { x: 0, y: 0 },
      { x: layer.width, y: layer.height },
      { x: 0, y: layer.height },
    ],
    [topLeft, bottomRight, bottomLeft],
  );
}

/** Projects a complete transparent layer with one homography, avoiding mesh seams. */
export function projectCanvasLayer(
  context: CanvasRenderingContext2D,
  layer: HTMLCanvasElement,
  quad: Point[],
): "webgl" | "fallback" {
  const homography = homographyForQuad(quad);
  const inverse = homography ? invertMatrix3(homography) : null;
  const target = rendererFor(context.canvas.width, context.canvas.height);
  if (!inverse || !target) {
    drawSeamlessFallback(context, layer, quad);
    return "fallback";
  }
  const { canvas, renderer } = target;
  const { gl, program, texture, inverseHomography, resolution } = renderer;
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.useProgram(program);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, 1);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, layer);
  gl.uniformMatrix3fv(inverseHomography, false, asColumnMajor(inverse));
  gl.uniform2f(resolution, canvas.width, canvas.height);
  gl.drawArrays(gl.TRIANGLES, 0, 6);
  gl.finish();
  context.drawImage(canvas, 0, 0);
  return "webgl";
}
