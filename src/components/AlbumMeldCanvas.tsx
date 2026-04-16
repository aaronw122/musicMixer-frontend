import { useEffect, useRef, useCallback, useState } from 'react';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface AlbumMeldProps {
  imageA: string;
  imageB: string;
  progress: number;
  size?: number;
  className?: string;
}

// ---------------------------------------------------------------------------
// WebGL helpers
// ---------------------------------------------------------------------------

const VERTEX_SRC = `
attribute vec2 aPosition;
varying vec2 vUv;
void main() {
  vUv = aPosition * 0.5 + 0.5;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

// ~70 lines — simplex-ish 2D noise + organic paint-meld blend
const FRAGMENT_SRC = `
precision mediump float;

uniform sampler2D uTextureA;
uniform sampler2D uTextureB;
uniform float uProgress;
uniform float uTime;

varying vec2 vUv;

/* ---- fast 2D noise (hash-based, no lookup table) ---- */
vec2 hash22(vec2 p) {
  p = vec2(dot(p, vec2(127.1, 311.7)),
           dot(p, vec2(269.5, 183.3)));
  return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
}

float noise2d(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);

  float a = dot(hash22(i + vec2(0.0, 0.0)), f - vec2(0.0, 0.0));
  float b = dot(hash22(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0));
  float c = dot(hash22(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0));
  float d = dot(hash22(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0));

  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

/* fractional Brownian motion — 3 octaves for organic shapes */
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  vec2 shift = vec2(100.0);
  for (int i = 0; i < 3; i++) {
    v += a * noise2d(p);
    p = p * 2.0 + shift;
    a *= 0.5;
  }
  return v;
}

void main() {
  /* Animate noise position over time */
  float t = uTime * 0.15;
  vec2 noiseCoord = vUv * 3.5 + vec2(t, t * 0.7);

  float n = fbm(noiseCoord);            /* -0.5 … +0.5 range roughly */
  n = n * 0.5 + 0.5;                    /* remap to 0…1 */

  /* Organic boundary — spread narrows as progress approaches extremes */
  float spread = 0.12 + 0.08 * sin(uTime * 0.3);
  float blend = smoothstep(uProgress - spread, uProgress + spread, n);

  /* UV distortion near the boundary for a liquid-paint feel */
  float edgeDist = abs(n - uProgress);
  float distortStrength = smoothstep(spread * 1.5, 0.0, edgeDist) * 0.015;
  vec2 distort = vec2(
    noise2d(noiseCoord * 2.0 + 10.0),
    noise2d(noiseCoord * 2.0 + 20.0)
  ) * distortStrength;

  vec4 texA = texture2D(uTextureA, vUv + distort);
  vec4 texB = texture2D(uTextureB, vUv - distort);

  gl_FragColor = mix(texA, texB, blend);
}
`;

function compileShader(
  gl: WebGLRenderingContext,
  type: number,
  src: string,
): WebGLShader | null {
  const s = gl.createShader(type);
  if (!s) return null;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    console.error('Shader compile error:', gl.getShaderInfoLog(s));
    gl.deleteShader(s);
    return null;
  }
  return s;
}

function createProgram(
  gl: WebGLRenderingContext,
  vSrc: string,
  fSrc: string,
): WebGLProgram | null {
  const vs = compileShader(gl, gl.VERTEX_SHADER, vSrc);
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, fSrc);
  if (!vs || !fs) return null;
  const prog = gl.createProgram();
  if (!prog) return null;
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.error('Program link error:', gl.getProgramInfoLog(prog));
    gl.deleteProgram(prog);
    return null;
  }
  return prog;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

function createPlaceholder(color: string): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = 1;
  c.height = 1;
  const ctx = c.getContext('2d');
  if (ctx) {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 1, 1);
  }
  return c;
}

function uploadTexture(
  gl: WebGLRenderingContext,
  tex: WebGLTexture,
  source: TexImageSource,
): void {
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
}

// ---------------------------------------------------------------------------
// Detect WebGL support
// ---------------------------------------------------------------------------

function hasWebGL(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') ?? c.getContext('webgl'));
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Detect prefers-reduced-motion
// ---------------------------------------------------------------------------

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return reduced;
}

// ---------------------------------------------------------------------------
// WebGL canvas sub-component
// ---------------------------------------------------------------------------

interface WebGLCanvasProps {
  imageA: string;
  imageB: string;
  progress: number;
  size: number;
  reducedMotion: boolean;
}

function WebGLCanvas({
  imageA,
  imageB,
  progress,
  size,
  reducedMotion,
}: WebGLCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const texARef = useRef<WebGLTexture | null>(null);
  const texBRef = useRef<WebGLTexture | null>(null);
  const uniformsRef = useRef<{
    uProgress: WebGLUniformLocation | null;
    uTime: WebGLUniformLocation | null;
    uTextureA: WebGLUniformLocation | null;
    uTextureB: WebGLUniformLocation | null;
  }>({ uProgress: null, uTime: null, uTextureA: null, uTextureB: null });
  const startTimeRef = useRef<number>(0);
  const progressRef = useRef(progress);
  progressRef.current = progress;

  // ---- Initialize GL context, shaders, quad ----
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl =
      (canvas.getContext('webgl2') as WebGLRenderingContext | null) ??
      canvas.getContext('webgl');
    if (!gl) return;
    glRef.current = gl;

    const prog = createProgram(gl, VERTEX_SRC, FRAGMENT_SRC);
    if (!prog) return;
    programRef.current = prog;
    gl.useProgram(prog);

    // Fullscreen quad
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    // prettier-ignore
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1,  1, -1,  -1, 1,
      -1,  1,  1, -1,   1, 1,
    ]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog, 'aPosition');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    // Uniforms
    uniformsRef.current = {
      uProgress: gl.getUniformLocation(prog, 'uProgress'),
      uTime: gl.getUniformLocation(prog, 'uTime'),
      uTextureA: gl.getUniformLocation(prog, 'uTextureA'),
      uTextureB: gl.getUniformLocation(prog, 'uTextureB'),
    };

    // Create textures (start with placeholder)
    const texA = gl.createTexture();
    const texB = gl.createTexture();
    texARef.current = texA;
    texBRef.current = texB;

    const placeholderA = createPlaceholder('#555555');
    const placeholderB = createPlaceholder('#333333');
    if (texA) uploadTexture(gl, texA, placeholderA);
    if (texB) uploadTexture(gl, texB, placeholderB);

    // Bind texture units
    gl.uniform1i(uniformsRef.current.uTextureA, 0);
    gl.uniform1i(uniformsRef.current.uTextureB, 1);

    startTimeRef.current = performance.now();

    // Cleanup
    return () => {
      cancelAnimationFrame(rafRef.current);
      const ext = gl.getExtension('WEBGL_lose_context');
      if (ext) ext.loseContext();
      glRef.current = null;
    };
  }, []); // mount-only

  // ---- Animation loop ----
  const render = useCallback(() => {
    const gl = glRef.current;
    if (!gl || !programRef.current) return;

    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);

    const elapsed = reducedMotion
      ? 0
      : (performance.now() - startTimeRef.current) / 1000;

    gl.uniform1f(uniformsRef.current.uProgress, progressRef.current);
    gl.uniform1f(uniformsRef.current.uTime, elapsed);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texARef.current);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, texBRef.current);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
    rafRef.current = requestAnimationFrame(render);
  }, [reducedMotion]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafRef.current);
  }, [render]);

  // ---- Load / re-upload textures when URLs change ----
  useEffect(() => {
    const gl = glRef.current;
    if (!gl) return;
    let cancelled = false;

    loadImage(imageA)
      .then((img) => {
        if (cancelled || !texARef.current) return;
        uploadTexture(gl, texARef.current, img);
      })
      .catch(() => {
        if (cancelled || !texARef.current) return;
        uploadTexture(gl, texARef.current, createPlaceholder('#555555'));
      });

    return () => {
      cancelled = true;
    };
  }, [imageA]);

  useEffect(() => {
    const gl = glRef.current;
    if (!gl) return;
    let cancelled = false;

    loadImage(imageB)
      .then((img) => {
        if (cancelled || !texBRef.current) return;
        uploadTexture(gl, texBRef.current, img);
      })
      .catch(() => {
        if (cancelled || !texBRef.current) return;
        uploadTexture(gl, texBRef.current, createPlaceholder('#333333'));
      });

    return () => {
      cancelled = true;
    };
  }, [imageB]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      style={{ width: size, height: size, display: 'block' }}
    />
  );
}

// ---------------------------------------------------------------------------
// SVG fallback sub-component
// ---------------------------------------------------------------------------

interface SVGFallbackProps {
  imageA: string;
  imageB: string;
  progress: number;
  size: number;
}

function SVGFallback({ imageA, imageB, progress, size }: SVGFallbackProps) {
  const p = Math.max(0, Math.min(1, progress));

  // Drive the SVG filter displacement by progress — creates an organic blend
  const displacement = 20 + p * 30;
  const baseFreq = 0.03 + (1 - p) * 0.02;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-hidden="true"
    >
      <defs>
        <filter
          id="album-meld-fallback"
          x="-20%"
          y="-20%"
          width="140%"
          height="140%"
        >
          <feTurbulence
            type="fractalNoise"
            baseFrequency={baseFreq}
            numOctaves={3}
            seed={42}
            result="noise"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale={displacement}
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
        <clipPath id="album-meld-clip">
          <rect x="0" y="0" width={size} height={size} rx="4" />
        </clipPath>
      </defs>
      <g clipPath="url(#album-meld-clip)" filter="url(#album-meld-fallback)">
        <image
          href={imageA}
          x="0"
          y="0"
          width={size}
          height={size}
          preserveAspectRatio="xMidYMid slice"
          opacity={1 - p}
        />
        <image
          href={imageB}
          x="0"
          y="0"
          width={size}
          height={size}
          preserveAspectRatio="xMidYMid slice"
          opacity={p}
        />
      </g>
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function AlbumMeldCanvas({
  imageA,
  imageB,
  progress,
  size = 300,
  className,
}: AlbumMeldProps) {
  const [webglSupported] = useState(hasWebGL);
  const reducedMotion = usePrefersReducedMotion();
  const clampedProgress = Math.max(0, Math.min(1, progress));

  return (
    <div
      className={className}
      style={{ width: size, height: size, overflow: 'hidden' }}
    >
      {webglSupported ? (
        <WebGLCanvas
          imageA={imageA}
          imageB={imageB}
          progress={clampedProgress}
          size={size}
          reducedMotion={reducedMotion}
        />
      ) : (
        <SVGFallback
          imageA={imageA}
          imageB={imageB}
          progress={clampedProgress}
          size={size}
        />
      )}
    </div>
  );
}
