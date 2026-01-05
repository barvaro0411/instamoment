// fimoCanvas.ts / fimoEngine.ts
export type FilterId = "ek80" | "aesthetic400";

export type LUTSource =
    | { type: "image"; src: string } // 512x512 PNG
    | { type: "none" };

export interface CanvasVintagePreset {
    id: FilterId;
    name: string;
    lut: LUTSource;

    exposure: number;
    contrast: number;
    saturation: number;
    warmth: number;
    tint: number;
    fade: number;

    halation: number;
    grain: number;
    dust: number;
    vignette: number;
    lightLeak: number;

    frameType: "none" | "polaroid";
    dateStamp: {
        enabled: boolean;
        position: "bottom-left" | "top-center";
        color: string;
        font: string;
        letterSpacingPx: number;
    };
    polaroid?: {
        paddingTop: number;
        paddingSides: number;
        paddingBottom: number;
        paper: { top: string; bottom: string };
        captionFont: string;
        captionColor: string;
    };
}

export const PRESETS: Record<FilterId, CanvasVintagePreset> = {
    ek80: {
        id: "ek80",
        name: "EK 80",
        lut: { type: "image", src: "/luts/fimo-ek80.png" },
        exposure: 0.06,
        contrast: 1.12,
        saturation: 1.1,
        warmth: 0.12,
        tint: -0.04,
        fade: 0.1,
        halation: 0.22,
        grain: 0.35,
        dust: 0.2,
        vignette: 0.55,
        lightLeak: 0,
        frameType: "none",
        dateStamp: {
            enabled: true,
            position: "bottom-left",
            color: "#FF9B1A",
            font: `700 12px "Courier New", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`,
            letterSpacingPx: 1.2,
        },
    },
    aesthetic400: {
        id: "aesthetic400",
        name: "Aesthetic 400",
        lut: { type: "image", src: "/luts/fimo-a400.png" },
        exposure: 0.1,
        contrast: 0.92,
        saturation: 0.78,
        warmth: 0.08,
        tint: 0.02,
        fade: 0.22,
        halation: 0.12,
        grain: 0.26,
        dust: 0.28,
        vignette: 0.3,
        lightLeak: 0.35,
        frameType: "polaroid",
        dateStamp: {
            enabled: true,
            position: "top-center",
            color: "#1B1B1B",
            font: `600 14px "Courier New", ui-monospace, monospace`,
            letterSpacingPx: 6,
        },
        polaroid: {
            paddingTop: 34,
            paddingSides: 26,
            paddingBottom: 72,
            paper: { top: "#fbfbfb", bottom: "#f1f1f1" },
            captionFont: `400 26px "Caveat", "Patrick Hand", "Comic Sans MS", cursive`,
            captionColor: "#2a2a2a",
        },
    },
};

// ---------- helpers ----------
type LUTImage = { width: number; height: number; data: Uint8ClampedArray };

const clamp255 = (v: number) => (v < 0 ? 0 : v > 255 ? 255 : v);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function rgbToLuma(r: number, g: number, b: number) {
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function mulberry32(seed: number) {
    return function () {
        let t = (seed += 0x6D2B79F5);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function vignetteFactor(x: number, y: number, w: number, h: number, strength: number) {
    if (strength <= 0) return 1;
    const nx = (x / w) * 2 - 1;
    const ny = (y / h) * 2 - 1;
    const d = Math.sqrt(nx * nx + ny * ny);
    const v = 1 - strength * Math.max(0, d - 0.2);
    return Math.max(0, Math.min(1, v));
}

function leakColor(x: number, y: number, w: number, h: number, amount: number) {
    if (amount <= 0) return [0, 0, 0] as const;
    const nx = x / w;
    const ny = y / h;
    const band = Math.max(0, nx * 0.85 + (1 - ny) * 0.55 - 0.75);
    const a = band * amount;
    return [255 * a, 120 * a, 40 * a] as const;
}

function applyBasicAdjustments(r: number, g: number, b: number, p: CanvasVintagePreset) {
    const exp = 1 + p.exposure;
    r *= exp; g *= exp; b *= exp;

    const c = p.contrast;
    r = (r - 128) * c + 128;
    g = (g - 128) * c + 128;
    b = (b - 128) * c + 128;

    if (p.fade > 0) {
        const f = p.fade;
        r = r * (1 - f) + 255 * (f * 0.08);
        g = g * (1 - f) + 255 * (f * 0.08);
        b = b * (1 - f) + 255 * (f * 0.09);
    }

    const lum = rgbToLuma(r, g, b);
    const s = p.saturation;
    r = lum + (r - lum) * s;
    g = lum + (g - lum) * s;
    b = lum + (b - lum) * s;

    const w = p.warmth * 18;
    const t = p.tint * 14;
    r += w;
    b -= w * 0.9;
    g += t;

    return [r, g, b] as const;
}

// ---------- LUT cache ----------
const lutCache = new Map<string, Promise<LUTImage>>();

export async function loadImage(src: string, crossOrigin: "anonymous" | null = "anonymous") {
    return new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        if (crossOrigin) img.crossOrigin = crossOrigin;
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
}

async function loadLUTImageCached(lutSrc: string): Promise<LUTImage> {
    if (!lutCache.has(lutSrc)) {
        lutCache.set(
            lutSrc,
            (async () => {
                try {
                    const lutImg = await loadImage(lutSrc, "anonymous");
                    const c = document.createElement("canvas");
                    c.width = lutImg.width;
                    c.height = lutImg.height;
                    const ctx = c.getContext("2d", { willReadFrequently: true });
                    if (!ctx) throw new Error("No canvas context for LUT");
                    ctx.drawImage(lutImg, 0, 0);
                    const data = ctx.getImageData(0, 0, c.width, c.height);
                    return { width: c.width, height: c.height, data: data.data };
                } catch (e) {
                    console.warn("LUT load failed", e);
                    // Return identity placeholder or throw
                    throw e;
                }
            })()
        );
    }
    return lutCache.get(lutSrc)!;
}

// LUT 16x16x16 desde PNG 512x512 (16 tiles, cada tile 32px, subgrid 16x16)
function sampleLUT(lut: LUTImage, r: number, g: number, b: number) {
    const size = 16;
    const maxIndex = size - 1;

    const R = r / 255, G = g / 255, B = b / 255;

    const rPos = R * maxIndex;
    const gPos = G * maxIndex;
    const bPos = B * maxIndex;

    const r0 = Math.floor(rPos), r1 = Math.min(maxIndex, r0 + 1);
    const g0 = Math.floor(gPos), g1 = Math.min(maxIndex, g0 + 1);
    const b0 = Math.floor(bPos), b1 = Math.min(maxIndex, b0 + 1);

    const fr = rPos - r0;
    const fg = gPos - g0;
    const fb = bPos - b0;

    const tile = lut.width / 16;      // 32
    const cell = tile / 16;           // 2 (cada “cuadrito”)
    const half = cell * 0.5;          // 1

    const get = (ri: number, gi: number, bi: number) => {
        const tileX = bi % 16;
        const tileY = Math.floor(bi / 16);

        const x = tileX * tile + ri * cell + half;
        const y = tileY * tile + gi * cell + half;

        const ix = Math.max(0, Math.min(lut.width - 1, Math.floor(x)));
        const iy = Math.max(0, Math.min(lut.height - 1, Math.floor(y)));
        const idx = (iy * lut.width + ix) * 4;

        return [lut.data[idx], lut.data[idx + 1], lut.data[idx + 2]] as const;
    };

    const c000 = get(r0, g0, b0);
    const c100 = get(r1, g0, b0);
    const c010 = get(r0, g1, b0);
    const c110 = get(r1, g1, b0);

    const c001 = get(r0, g0, b1);
    const c101 = get(r1, g0, b1);
    const c011 = get(r0, g1, b1);
    const c111 = get(r1, g1, b1);

    const mix = (a: readonly number[], c: readonly number[], t: number) => ([
        lerp(a[0], c[0], t),
        lerp(a[1], c[1], t),
        lerp(a[2], c[2], t),
    ] as const);

    const c00 = mix(c000, c100, fr);
    const c10 = mix(c010, c110, fr);
    const c01 = mix(c001, c101, fr);
    const c11 = mix(c011, c111, fr);

    const c0 = mix(c00, c10, fg);
    const c1 = mix(c01, c11, fg);

    return mix(c0, c1, fb);
}

// ---------- noise texture (mejor que rand por pixel) ----------
function makeNoise(w: number, h: number, seed: number) {
    const r = mulberry32(seed);
    const buf = new Uint8ClampedArray(w * h);
    for (let i = 0; i < buf.length; i++) buf[i] = Math.floor(r() * 256);
    return { w, h, buf };
}
function noiseAt(noise: { w: number; h: number; buf: Uint8ClampedArray }, x: number, y: number) {
    const ix = ((x % noise.w) + noise.w) % noise.w;
    const iy = ((y % noise.h) + noise.h) % noise.h;
    return noise.buf[iy * noise.w + ix] / 255; // 0..1
}

// ---------- main ----------
export interface RenderOptions {
    filterId: FilterId;
    timestamp?: string;
    caption?: string;
    seed?: number;
    outputScale?: number; // 1..2
    // si la imagen viene de otra URL, debes tener CORS habilitado en el server
    crossOrigin?: "anonymous" | null;
}

export async function renderFIMOToCanvas(inputSrc: string, canvas: HTMLCanvasElement, opts: RenderOptions) {
    const preset = PRESETS[opts.filterId];
    const seed = opts.seed ?? 1337;
    const crossOrigin = opts.crossOrigin ?? "anonymous";

    const img = await loadImage(inputSrc, crossOrigin);

    const scale = opts.outputScale ?? 1;
    const baseW = Math.round(img.naturalWidth * scale);
    const baseH = Math.round(img.naturalHeight * scale);

    const padTop = preset.frameType === "polaroid" ? (preset.polaroid?.paddingTop ?? 0) : 0;
    const padSides = preset.frameType === "polaroid" ? (preset.polaroid?.paddingSides ?? 0) : 0;
    const padBottom = preset.frameType === "polaroid" ? (preset.polaroid?.paddingBottom ?? 0) : 0;

    const outW = baseW + padSides * 2;
    const outH = baseH + padTop + padBottom;

    canvas.width = outW;
    canvas.height = outH;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) throw new Error("No 2D context");

    // background
    if (preset.frameType === "polaroid" && preset.polaroid) {
        const grad = ctx.createLinearGradient(0, 0, 0, outH);
        grad.addColorStop(0, preset.polaroid.paper.top);
        grad.addColorStop(1, preset.polaroid.paper.bottom);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, outW, outH);

        ctx.save();
        ctx.globalAlpha = 0.1;
        ctx.fillStyle = "#000";
        ctx.fillRect(padSides - 2, padTop - 2, baseW + 4, baseH + 4);
        ctx.restore();
    } else {
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, outW, outH);
    }

    const imgX = padSides;
    const imgY = padTop;

    // draw base
    ctx.drawImage(img, imgX, imgY, baseW, baseH);

    // get pixels
    const imgData = ctx.getImageData(imgX, imgY, baseW, baseH);
    const data = imgData.data;

    // LUT
    let lut: LUTImage | null = null;
    if (preset.lut.type === "image") {
        try {
            lut = await loadLUTImageCached(preset.lut.src);
        } catch (e) {
            // Fallback or ignore
        }
    }

    // noise
    const noise = makeNoise(256, 256, seed ^ 0xA5A5);

    // rand for dust decisions (solo pocas veces)
    const rand = mulberry32(seed);

    for (let y = 0; y < baseH; y++) {
        for (let x = 0; x < baseW; x++) {
            const i = (y * baseW + x) * 4;
            let r = data[i], g = data[i + 1], b = data[i + 2];

            const adj = applyBasicAdjustments(r, g, b, preset);
            r = adj[0]; g = adj[1]; b = adj[2];

            if (lut) {
                const out = sampleLUT(lut, clamp255(r), clamp255(g), clamp255(b));
                r = out[0]; g = out[1]; b = out[2];
            }

            const v = vignetteFactor(x, y, baseW, baseH, preset.vignette);
            r *= v; g *= v; b *= v;

            const leak = leakColor(x, y, baseW, baseH, preset.lightLeak);
            r += leak[0]; g += leak[1]; b += leak[2];

            // grain via noise texture
            if (preset.grain > 0) {
                const n = noiseAt(noise, x, y) * 2 - 1; // -1..1
                const amp = preset.grain * 18;
                const lum = rgbToLuma(r, g, b);
                const grain = (lum / 255) * n * amp;
                r += grain;
                g += grain * 0.95;
                b += grain * 1.05;
            }

            // dust specks (raros)
            if (preset.dust > 0) {
                const t = 0.9992 - preset.dust * 0.0009;
                if (rand() > t) {
                    const sign = rand() > 0.55 ? 1 : -1;
                    const strength = (0.25 + rand() * 0.75) * 90 * preset.dust;
                    r += sign * strength;
                    g += sign * strength;
                    b += sign * strength;
                }
            }

            data[i] = clamp255(r);
            data[i + 1] = clamp255(g);
            data[i + 2] = clamp255(b);
        }
    }

    ctx.putImageData(imgData, imgX, imgY);

    // halation/bloom
    if (preset.halation > 0) {
        ctx.save();
        ctx.globalAlpha = 0.18 * preset.halation;
        ctx.globalCompositeOperation = "screen";
        ctx.filter = `blur(${Math.max(0.8, 2.2 * preset.halation)}px)`;
        // copia SOLO el área de imagen (no todo el canvas)
        ctx.drawImage(canvas, imgX, imgY, baseW, baseH, imgX, imgY, baseW, baseH);
        ctx.restore();
        ctx.filter = "none";
    }

    // timestamp
    if (preset.dateStamp.enabled && opts.timestamp) {
        ctx.save();
        ctx.fillStyle = preset.dateStamp.color;
        ctx.font = preset.dateStamp.font;

        const text = opts.filterId === "ek80" ? `' ${opts.timestamp}` : opts.timestamp;
        const spacing = preset.dateStamp.letterSpacingPx;

        let tx = 0, ty = 0;

        if (preset.dateStamp.position === "bottom-left") {
            tx = imgX + 10;
            ty = imgY + baseH - 10;
            ctx.textBaseline = "alphabetic";
            ctx.shadowColor = "rgba(0,0,0,0.65)";
            ctx.shadowBlur = 6;
            ctx.shadowOffsetX = 1;
            ctx.shadowOffsetY = 1;

            let cx = tx;
            for (let k = 0; k < text.length; k++) {
                ctx.fillText(text[k], cx, ty);
                cx += ctx.measureText(text[k]).width + spacing;
            }
        } else {
            tx = outW / 2;
            ty = 18;
            ctx.textBaseline = "alphabetic";
            ctx.textAlign = "center";
            ctx.shadowColor = "transparent";

            const widths = [...text].map((ch) => ctx.measureText(ch).width);
            const total = widths.reduce((a, w) => a + w, 0) + spacing * (text.length - 1);
            let startX = tx - total / 2;

            for (let k = 0; k < text.length; k++) {
                ctx.fillText(text[k], startX, ty);
                startX += widths[k] + spacing;
            }
        }

        ctx.restore();
    }

    // caption polaroid
    if (preset.frameType === "polaroid" && opts.caption && preset.polaroid) {
        ctx.save();
        ctx.globalAlpha = 0.78;
        ctx.fillStyle = preset.polaroid.captionColor;
        ctx.font = preset.polaroid.captionFont;
        ctx.textAlign = "center";
        ctx.textBaseline = "alphabetic";
        ctx.fillText(opts.caption, outW / 2, outH - 18);
        ctx.restore();
    }

    return canvas;
}

export function canvasToBlob(
    canvas: HTMLCanvasElement,
    quality = 0.92,
    type: "image/jpeg" | "image/png" = "image/jpeg"
) {
    return new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), type, quality);
    });
}
