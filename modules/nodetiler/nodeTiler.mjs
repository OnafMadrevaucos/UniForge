/**
 * nodeTiler.mjs — NodeTiler FINAL integrado com ZoomEngine + WorkerPool
 *
 * Emits progress via this._emitProgress({ type: 'tile-progress', z, processed, total })
 * The main process can wire this to webContents.send(...) to forward to renderer.
 */

import sharp from "sharp";
import fs from "fs/promises";
import path from "path";
import os from "os";
import { fileURLToPath } from "url";

import { WorkerPool } from "./nodeTileWorkerPool.mjs";
import { ZoomEngine } from "./zoomEngine.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function renderProgressBar(current, total, prefix = "") {
    const width = 30;
    const ratio = Math.max(0, Math.min(1, current / Math.max(1, total)));
    const filled = Math.round(ratio * width);
    const bar = "█".repeat(filled) + "░".repeat(width - filled);
    const pct = Math.round(ratio * 100);
    process.stdout.write(`\r${prefix} [${bar}] ${pct}% (${current}/${total})`);
}

export default class NodeTiler {
    constructor(imagePath, leafletOptions = {}) {
        const defaults = {
            tileSize: 256,
            minZoom: 0,
            maxZoom: 5,
            minNativeZoom: 0,
            maxNativeZoom: 5,
            zoomOffset: 0,
            detectRetina: false,
            bounds: null,
            noWrap: true,
            subdomains: ["a", "b", "c"],
            minSide: 4096,
            expand: true,
            metadata: false,
            multithread: true,
            threadCount: Math.max(1, Math.min(os.cpus().length - 1, 8)),
            stripeHeightMultiplier: 8,
            maxTasksPerStripeFactor: 4
        };

        const opt = { ...defaults, ...leafletOptions };
        this._validateOptions(opt);

        this.tileSize = opt.tileSize;
        this.minZoom = opt.minZoom;
        this.maxZoom = opt.maxZoom;
        this.minNativeZoom = opt.minNativeZoom;
        this.maxNativeZoom = opt.maxNativeZoom;
        this.zoomOffset = opt.zoomOffset;
        this.detectRetina = opt.detectRetina;
        this.bounds = opt.bounds;
        this.noWrap = opt.noWrap;
        this.subdomains = opt.subdomains;

        this.imagePath = imagePath;
        this.minSide = opt.minSide;
        this.expand = opt.expand;
        this.generateMetadata = opt.metadata;
        this.useMultithreading = opt.multithread;
        this.threadCount = opt.threadCount;
        this.stripeHeightMultiplier = opt.stripeHeightMultiplier;
        this.maxTasksPerStripeFactor = opt.maxTasksPerStripeFactor;

        this.cpuCount = os.cpus().length;
        this.normalizedImage = null;
        this.pool = null;
        this._emitProgress = null;
    }

    _validateOptions(opt) {
        const assert = (c, m) => { if (!c) throw new Error("Config error: " + m); };
        assert(Number.isInteger(opt.tileSize) && opt.tileSize > 0, "tileSize must be positive int");
        assert(Number.isInteger(opt.minZoom) && opt.minZoom >= 0, "minZoom must be >=0");
        assert(Number.isInteger(opt.maxZoom) && opt.maxZoom >= opt.minZoom, "maxZoom must be >= minZoom");
        assert(Number.isInteger(opt.minNativeZoom) && opt.minNativeZoom >= 0, "minNativeZoom must be >=0");
        assert(Number.isInteger(opt.maxNativeZoom) && opt.maxNativeZoom >= opt.minNativeZoom, "maxNativeZoom must be >= minNativeZoom");
        assert(Number.isInteger(opt.zoomOffset), "zoomOffset must be integer");
        assert(typeof opt.detectRetina === "boolean", "detectRetina must be boolean");
        assert(typeof opt.noWrap === "boolean", "noWrap must be boolean");
        if (opt.bounds !== null) {
            assert(Array.isArray(opt.bounds) && opt.bounds.length === 2, "bounds must be [[minY,minX],[maxY,maxX]] or null");
        }
        assert(Number.isInteger(opt.minSide) && opt.minSide > 0, "minSide must be positive int");
        assert(typeof opt.expand === "boolean", "expand must be boolean");
        assert(typeof opt.metadata === "boolean", "metadata must be boolean");
        assert(typeof opt.multithread === "boolean", "multithread must be boolean");
        assert(Number.isInteger(opt.threadCount) && opt.threadCount >= 1, "threadCount must be >=1");
    }

    canUseThreads() {
        return this.useMultithreading && this.threadCount > 1;
    }

    async normalizeImage() {
        const img = sharp(this.imagePath);
        const meta = await img.metadata();
        if (!meta.width || !meta.height) throw new Error("Unable to read image dimensions");
        const longest = Math.max(meta.width, meta.height);
        const scale = longest < this.minSide ? (this.minSide / longest) : 1;
        const newWidth = Math.round(meta.width * scale);
        const newHeight = Math.round(meta.height * scale);
        console.log(`Normalizando imagem: ${meta.width}×${meta.height} → ${newWidth}×${newHeight}`);
        try {
            this.normalizedImage = await img.resize({ width: newWidth, height: newHeight, kernel: sharp.kernel.lanczos3 }).toBuffer();
        } catch (err) {
            console.log("⚠ Lanczos3 falhou. Usando Bicubic...");
            this.normalizedImage = await img.resize({ width: newWidth, height: newHeight, kernel: sharp.kernel.cubic }).toBuffer();
        }

        if (this.bounds === null) {
            this.bounds = [[0, 0], [newHeight - 1, newWidth - 1]];
            console.log("Bounds não fornecido — usando bounds completo:", this.bounds);
        }
    }

    _ensurePool() {
        if (!this.canUseThreads()) return;
        if (this.pool) return;

        const workerPath = path.resolve(__dirname, "nodeTileWorker.mjs");

        this.pool = new WorkerPool(workerPath, this.threadCount);
        console.log(`🧵 WorkerPool criado com ${this.threadCount} workers`);
    }


    async generateZoomLevel(z, outputFolder) {
        const effectiveZoom = z + this.zoomOffset;
        console.log(`\nGerando Z=${z} (efetivo ${effectiveZoom})`);
        this._ensurePool();

        const normalizedMeta = await sharp(this.normalizedImage).metadata();
        const normalizedWidth = normalizedMeta.width;
        const normalizedHeight = normalizedMeta.height;

        const stripeHeight = Math.max(1, this.tileSize * this.stripeHeightMultiplier);
        const maxTasksInFlight = Math.max(1, this.threadCount * this.maxTasksPerStripeFactor);

        const zoomFolder = path.join(outputFolder, String(z));
        await fs.mkdir(zoomFolder, { recursive: true });

        // Precompute tile count for progress display
        const scale = Math.pow(2, effectiveZoom);
        const [[minY, minX], [maxY, maxX]] = this._clampBoundsToImage(this.bounds, normalizedWidth, normalizedHeight);
        const scaledMinX = minX * scale; const scaledMaxX = maxX * scale;
        const scaledMinY = minY * scale; const scaledMaxY = maxY * scale;

        const minTileX = Math.max(0, Math.floor(scaledMinX / this.tileSize));
        const maxTileX = Math.max(0, Math.floor((scaledMaxX - 1) / this.tileSize));
        const minTileY = Math.max(0, Math.floor(scaledMinY / this.tileSize));
        const maxTileY = Math.max(0, Math.floor((scaledMaxY - 1) / this.tileSize));

        const totalTiles = (maxTileX - minTileX + 1) * (maxTileY - minTileY + 1);
        let processedTiles = 0;

        const onTileDone = ({ tx, ty }) => {
            processedTiles++;
            renderProgressBar(processedTiles, totalTiles, `Z=${z}`);
            if (this._emitProgress) {
                this._emitProgress({
                    type: "tile-progress",
                    z,
                    processed: processedTiles,
                    total: totalTiles,
                    tile: { x: tx, y: ty }
                });
            }
        };

        // Call ZoomEngine and pass onTileDone
        const result = await ZoomEngine.processZoom({
            normalizedImageBuffer: this.normalizedImage,
            normalizedWidth,
            normalizedHeight,
            effectiveZoom,
            tileSize: this.tileSize,
            stripeHeight,
            pool: this.pool,
            expand: this.expand,
            bounds: this._clampBoundsToImage(this.bounds, normalizedWidth, normalizedHeight),
            outputFolder: zoomFolder,
            maxTasksInFlight,
            onTileDone: ({ z: ez, tx, ty }) => onTileDone({ tx, ty }) // map args
        });

        if (this._emitProgress) {
            this._emitProgress({ type: "zoom-done", z, result });
        }

        console.log(`Z=${z} pronto.`);
        return result;
    }

    _clampBoundsToImage(bounds, normalizedWidth, normalizedHeight) {
        let [[minY, minX], [maxY, maxX]] = bounds;
        minX = Math.max(0, Math.min(normalizedWidth - 1, Number(minX)));
        maxX = Math.max(0, Math.min(normalizedWidth - 1, Number(maxX)));
        minY = Math.max(0, Math.min(normalizedHeight - 1, Number(minY)));
        maxY = Math.max(0, Math.min(normalizedHeight - 1, Number(maxY)));
        const realMinX = Math.min(minX, maxX);
        const realMaxX = Math.max(minX, maxX);
        const realMinY = Math.min(minY, maxY);
        const realMaxY = Math.max(minY, maxY);
        return [[realMinY, realMinX], [realMaxY, realMaxX]];
    }

    async writeMetadata(outputFolder) {
        const meta = await sharp(this.normalizedImage).metadata();
        const json = {
            tileSize: this.tileSize,
            minSide: this.minSide,
            minZoom: this.minZoom,
            maxZoom: this.maxZoom,
            minNativeZoom: this.minNativeZoom,
            maxNativeZoom: this.maxNativeZoom,
            zoomOffset: this.zoomOffset,
            bounds: this.bounds,
            expand: this.expand,
            multithread: this.useMultithreading,
            threadCount: this.threadCount,
            normalizedWidth: meta.width,
            normalizedHeight: meta.height,
            generatedAt: new Date().toISOString()
        };
        await fs.writeFile(path.join(outputFolder, "metadata.json"), JSON.stringify(json, null, 2));
    }

    async generateTiles(outputFolder = "./tiles") {
        await fs.mkdir(outputFolder, { recursive: true });
        console.log("== Normalizando imagem base ==");
        await this.normalizeImage();

        for (let z = this.minNativeZoom; z <= this.maxNativeZoom; z++) {
            await this.generateZoomLevel(z, outputFolder);
        }

        if (this.pool) {
            console.log("Encerrando WorkerPool...");
            await this.pool.close();
            this.pool = null;
        }

        if (this.generateMetadata) {
            console.log("Gerando metadata.json...");
            await this.writeMetadata(outputFolder);
        }

        console.log("✔ Todos os tiles gerados.");
    }
}
