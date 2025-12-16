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
import { zoom } from "d3";

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
    constructor(imagePath, leafletOptions = {}, options = {}) {
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

        const opt = { ...defaults, ...leafletOptions, ...options };
        this._validateOptions(opt);

        // --- Leaflet-like config ---
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

        // --- Options ---
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

        // --- Internals ---
        this.pool = null;
        this.cancelRequested = false;

        this.totalTiles = 0;
        this.processedTiles = 0;

        // Progress hook (renderer / main injeta)
        this._emitProgress = null;
    }

    cancelRequested = false;

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

    _ensurePool() {
        if (!this.canUseThreads()) return;
        if (this.pool) return;

        const workerPath = path.resolve(__dirname, "nodeTileWorker.mjs");

        this.pool = new WorkerPool(workerPath, this.threadCount);
        console.log(`NodeTiler | 🧵 WorkerPool criado com ${this.threadCount} workers`);
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

    /**
 * Garante que o diretório esteja limpo antes de receber os tiles.
 */
    async _prepareOutputDirectory(dir) {
        try {
            const stat = await fs.stat(dir);

            if (!stat.isDirectory()) {
                // existe mas não é diretório: erro
                throw new Error(`O caminho '${dir}' existe, mas não é um diretório.`);
            }

            console.log(`NodeTiler | 📁 Diretório '${dir}' já existe — limpando...`);

            // remove todo o conteúdo
            const entries = await fs.readdir(dir);

            if (entries.length > 0) {
                console.log(`NodeTiler | 📁 Diretório '${dir}' não está vazio — limpando conteúdo...`);

                await Promise.all(
                    entries.map(async (entry) => {
                        const fullPath = path.join(dir, entry);
                        await fs.rm(fullPath, { recursive: true, force: true });
                    })
                );
            }

        } catch (err) {
            // Se o diretório não existir, criamos
            if (err.code === "ENOENT") {
                await fs.mkdir(dir, { recursive: true });
                return;
            }
            throw err; // erro real, repassa
        }
    }

    _computeTileCount(effectiveZoom, normalizedWidth, normalizedHeight) {
        this.totalTiles = 0;
        const scale = Math.pow(2, effectiveZoom);

        const [[minY, minX], [maxY, maxX]] = this._clampBoundsToImage(this.bounds, normalizedWidth, normalizedHeight);
        const scaledMinX = minX * scale; const scaledMaxX = maxX * scale;
        const scaledMinY = minY * scale; const scaledMaxY = maxY * scale;

        const minTileX = Math.max(0, Math.floor(scaledMinX / this.tileSize));
        const maxTileX = Math.max(0, Math.floor((scaledMaxX - 1) / this.tileSize));
        const minTileY = Math.max(0, Math.floor(scaledMinY / this.tileSize));
        const maxTileY = Math.max(0, Math.floor((scaledMaxY - 1) / this.tileSize));

        this.totalTiles = (maxTileX - minTileX + 1) * (maxTileY - minTileY + 1);
    }

    _onTileDone(z) {
        if(this.cancelRequested) return; 
        this.processedTiles++;

        const percent = this.totalTiles > 0
            ? Math.round((this.processedTiles / this.totalTiles) * 100)
            : 0;

        if (this._emitProgress) {
            this._emitProgress({
                type: "tile-progress",
                zoom: z,
                processed: this.processedTiles,
                total: this.totalTiles,
                value: percent
            });
        }

        renderProgressBar(this.processedTiles, this.totalTiles, `Zoom ${z}: `);
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
        console.log(`NodeTiler | Normalizando imagem: ${meta.width}×${meta.height} → ${newWidth}×${newHeight}`);
        try {
            this.normalizedImage = await img.resize({ width: newWidth, height: newHeight, kernel: sharp.kernel.lanczos3 }).toBuffer();
        } catch (err) {
            console.log("NodeTiler | ⚠ Lanczos3 falhou. Usando Bicubic...");
            this.normalizedImage = await img.resize({ width: newWidth, height: newHeight, kernel: sharp.kernel.cubic }).toBuffer();
        }

        if (this.bounds === null) {
            this.bounds = [[0, 0], [newHeight - 1, newWidth - 1]];
            console.log("NodeTiler | Bounds não fornecido — usando bounds completo:", this.bounds);
        }
    }

    async generateZoom(z, outputFolder) {
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

        // Precompute tile count for progress display.
        this._computeTileCount(effectiveZoom, normalizedWidth, normalizedHeight);

        // Call ZoomEngine and pass onTileDone.
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
            onTileDone: () => this._onTileDone(z),
            isCancelled: () => this.cancelRequested
        });

        // If cancelled, return null.
        if(this.cancelRequested) return null;

        if (this._emitProgress) {
            this._emitProgress({ type: "zoom-done", zoom: z, result });
        }

        console.log(`Z=${z} pronto.`);
        return result;
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
        this.cancelRequested = false;
        this.totalTiles = 0;
        this.processedTiles = 0;

        // Prepara diretório limpo.
        await this._prepareOutputDirectory(outputFolder);

        if (this._emitProgress) this._emitProgress({ type: "start" });

        this._ensurePool();

        console.log("NodeTiler | Normalizando imagem base...");
        await this.normalizeImage();

        for (let z = this.minNativeZoom; z <= this.maxNativeZoom; z++) {
            if (this.cancelRequested) return null;
            await this.generateZoom(z, outputFolder);
        }

        if (this.pool) {
            console.log("NodeTiler | Encerrando WorkerPool...");
            await this.pool.close();
            this.pool = null;
        }

        if (!this.cancelRequested) {
            if (this.generateMetadata) {
                console.log("UniForge | Gerando metadata.json...");
                await this.writeMetadata(outputFolder);
            }
        }

        console.log("NodeTiler | ✔ Todos os tiles gerados.");

        if (this._emitProgress && !this.cancelRequested) this._emitProgress({ type: "complete" });
    }

    cancel() {
        console.info("\nNodeTiler | Processo de geração de tiles cancelado pelo usuário.");
        this.cancelRequested = true;

        if (this.pool) {
            this.pool.cancelAll(); // encerra workers imediatamente
        }        
    }
}
