/**
 * NodeTiler.mjs
 *
 * Gera tiles compatíveis com Leaflet a partir de uma imagem base, usando Sharp
 * com kernel Lanczos3 para garantir alta nitidez. Se Lanczos3 falhar, o módulo
 * faz fallback para bicubic e informa via console.log.
 *
 * Estrutura de saída (padrão):
 *  outputFolder/
 *    └─ {z}/
 *       └─ {x}/
 *          └─ {y}.png
 *
 * Observações:
 * - Este arquivo é ESM. Coloque "type": "module" no package.json ou use .mjs.
 * - Requer: npm i sharp
 *
 * Exemplo de uso:
 * import NodeTiler from './nodeTiler.mjs';
 * const tiler = new NodeTiler('map.png', { tileSize: 256, minSide: 4096, maxZoom: 5 });
 * await tiler.generateTiles('./tiles');
 */

import sharp from "sharp";
import fs from "fs/promises";
import path from "path";
import os from "os";
import { Worker } from "worker_threads";

/** Renderiza barra de progresso no console */
function renderProgressBar(current, total, prefix = "") {
    const width = 30;
    const ratio = current / total;
    const bars = Math.round(ratio * width);
    const bar = "█".repeat(bars) + "░".repeat(width - bars);
    const pct = Math.round(ratio * 100);
    process.stdout.write(`\r${prefix} [${bar}] ${pct}% (${current}/${total})`);
}

export default class NodeTiler {

    /**
     * @param {string} imagePath                    - Caminho da imagem base.
     * @param {object} options                      - Opções de configuração.
     * @param {number} [options.tileSize=256]       - Tamanho dos tiles.
     * @param {number} [options.minSide=4096]       - Tamanho mínimo do mapa.
     * @param {number} [options.maxZoom=5]          - Nível máximo de zoom.
     * @param {boolean} [options.expand=true]       - Ativa expansão de tiles para o tamanho máximo.
     * @param {boolean} [options.metadata=false]    - Ativa geração de metadados.
     * @param {boolean} [options.multithread=false] - Ativa multithreading se hardware permitir.
     */
    constructor(imagePath, {
        tileSize = 256,
        minSide = 4096,
        maxZoom = 5,
        expand = true,
        metadata = false,
        multithread = false
    } = {}) {

        this.imagePath = imagePath;
        this.tileSize = tileSize;
        this.minSide = minSide;
        this.maxZoom = maxZoom;
        this.expand = expand;
        this.generateMetadata = metadata;

        // Multi-threading
        this.useMultithreading = multithread;
        this.cpuCount = os.cpus().length;

        this.normalizedImage = null;
    }

    /** Verifica se é possível usar multithreading */
    canUseThreads() {
        if (!this.useMultithreading) return false;
        if (this.cpuCount <= 1) {
            console.log("⚠ Multithreading desativado: apenas 1 CPU disponível.");
            return false;
        }
        return true;
    }

    /** Normaliza imagem com Lanczos3 */
    async normalizeImage() {
        const img = sharp(this.imagePath);
        const meta = await img.metadata();

        const longest = Math.max(meta.width, meta.height);
        const scale = longest < this.minSide ? (this.minSide / longest) : 1;

        const newWidth = Math.round(meta.width * scale);
        const newHeight = Math.round(meta.height * scale);

        console.log(`Normalizando imagem: ${meta.width}×${meta.height} → ${newWidth}×${newHeight}`);

        try {
            this.normalizedImage = await img
                .resize({ width: newWidth, height: newHeight, kernel: sharp.kernel.lanczos3 })
                .toBuffer();
        } catch (err) {
            console.log("⚠ Lanczos3 falhou. Usando Bicubic:", err.message);
            this.normalizedImage = await img
                .resize({ width: newWidth, height: newHeight, kernel: sharp.kernel.cubic })
                .toBuffer();
        }
    }

    /**
     * Gera tiles usando multi-thread ou single-thread
     * dependendo do hardware e opções do usuário.
     *
     * @private
     */
    async generateZoomLevel(z, outputFolder) {

        const base = sharp(this.normalizedImage);
        const meta = await base.metadata();

        const scale = Math.pow(2, z);
        const scaledWidth = Math.round(meta.width * scale);
        const scaledHeight = Math.round(meta.height * scale);

        console.log(`\nGerando Z=${z}`);
        console.log(`Expand: ${this.expand ? "ON" : "OFF"}`);
        console.log(`Multithread: ${this.canUseThreads() ? "ON" : "OFF"}`);

        let zoomBuffer;
        try {
            zoomBuffer = await base
                .resize({
                    width: scaledWidth,
                    height: scaledHeight,
                    kernel: sharp.kernel.lanczos3
                })
                .toBuffer();
        } catch (err) {
            zoomBuffer = await base
                .resize({
                    width: scaledWidth,
                    height: scaledHeight,
                    kernel: sharp.kernel.cubic
                })
                .toBuffer();
        }

        const cols = Math.ceil(scaledWidth / this.tileSize);
        const rows = Math.ceil(scaledHeight / this.tileSize);
        const totalTiles = cols * rows;

        let tileIndex = 0;

        // MULTITHREAD ------------------------------------------------------------
        if (this.canUseThreads()) {
            const workerPath = new URL("./tileWorker.mjs", import.meta.url).pathname;
            const promises = [];

            for (let x = 0; x < cols; x++) {
                for (let y = 0; y < rows; y++) {

                    tileIndex++;
                    renderProgressBar(tileIndex, totalTiles, `Z=${z}`);

                    const tileFolder = path.join(outputFolder, `${z}`, `${x}`);
                    await fs.mkdir(tileFolder, { recursive: true });

                    const worker = new Worker(workerPath, {
                        workerData: {
                            zoomBuffer,
                            tileSize: this.tileSize,
                            expand: this.expand,
                            scaledWidth,
                            scaledHeight,
                            left: x * this.tileSize,
                            top: y * this.tileSize,
                            output: path.join(tileFolder, `${y}.png`)
                        }
                    });

                    // Promise de finalização do worker
                    const p = new Promise((resolve, reject) => {
                        worker.on("message", resolve);
                        worker.on("error", reject);
                        worker.on("exit", code => {
                            if (code !== 0) reject(new Error(`Worker finalizado com código ${code}`));
                        });
                    });

                    promises.push(p);
                }
            }

            await Promise.all(promises);
            process.stdout.write("\n");
            return;
        }

        // SINGLE-THREAD ----------------------------------------------------------
        tileIndex = 0;
        for (let x = 0; x < cols; x++) {
            for (let y = 0; y < rows; y++) {

                tileIndex++;
                renderProgressBar(tileIndex, totalTiles, `Z=${z}`);

                const tileFolder = path.join(outputFolder, `${z}`, `${x}`);
                await fs.mkdir(tileFolder, { recursive: true });

                const left = x * this.tileSize;
                const top = y * this.tileSize;

                const extractWidth = Math.min(this.tileSize, scaledWidth - left);
                const extractHeight = Math.min(this.tileSize, scaledHeight - top);

                if (extractWidth <= 0 || extractHeight <= 0) {
                    const empty = await sharp({
                        create: {
                            width: this.tileSize,
                            height: this.tileSize,
                            channels: 4,
                            background: { r: 0, g: 0, b: 0, alpha: 0 }
                        }
                    }).png().toBuffer();

                    await fs.writeFile(path.join(tileFolder, `${y}.png`), empty);
                    continue;
                }

                let extracted = await sharp(zoomBuffer)
                    .extract({ left, top, width: extractWidth, height: extractHeight })
                    .png()
                    .toBuffer();

                if (!this.expand) {
                    await fs.writeFile(path.join(tileFolder, `${y}.png`), extracted);
                    continue;
                }

                const tile = await sharp(extracted)
                    .extend({
                        top: 0,
                        left: 0,
                        bottom: this.tileSize - extractHeight,
                        right: this.tileSize - extractWidth,
                        background: { r: 0, g: 0, b: 0, alpha: 0 }
                    })
                    .png()
                    .toBuffer();

                await fs.writeFile(path.join(tileFolder, `${y}.png`), tile);
            }
        }

        process.stdout.write("\n");
    }

    /** Metadata opcional */
    async writeMetadata(outputFolder) {
        const meta = await sharp(this.normalizedImage).metadata();

        const json = {
            tileSize: this.tileSize,
            minSide: this.minSide,
            maxZoom: this.maxZoom,
            expand: this.expand,
            multithread: this.useMultithreading,
            normalizedWidth: meta.width,
            normalizedHeight: meta.height,
            generatedAt: new Date().toISOString()
        };

        await fs.writeFile(
            path.join(outputFolder, "metadata.json"),
            JSON.stringify(json, null, 2)
        );
    }

    /** Função principal */
    async generateTiles(outputFolder = "./tiles") {
        await fs.mkdir(outputFolder, { recursive: true });

        console.log("\n== Normalizando imagem base ==");
        await this.normalizeImage();

        for (let z = 0; z <= this.maxZoom; z++) {
            await this.generateZoomLevel(z, outputFolder);
        }

        if (this.generateMetadata) {
            console.log("Gerando metadata.json...");
            await this.writeMetadata(outputFolder);
        }

        console.log("✔ Tiles gerados com sucesso.");
    }
}
