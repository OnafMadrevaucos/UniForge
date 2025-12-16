// ZoomEngine.mjs
// ZoomEngine CORRIGIDO para compatibilidade TOTAL com Leaflet
// - pixelSize cresce em 2^n (n = zoom)
// - zoom 0 gera exatamente 1 tile
// - bounds respeitados corretamente
// - cancelamento seguro (nenhuma Promise pendente)
// - suporte a single-thread e multi-thread

import fs from "fs/promises";
import path from "path";
import sharp from "sharp";

export default class ZoomEngine {

  static totalTiles = 0;

  /**
   * Processa um nível de zoom no padrão Leaflet.
   *
   * @param {Object} opts
   * @param {Buffer} opts.imageBuffer        Imagem base (resolução máxima)
   * @param {number} opts.imageWidth         Largura da imagem base
   * @param {number} opts.imageHeight        Altura da imagem base
   * @param {number} opts.zoom               Zoom atual
   * @param {number} opts.maxZoom            Zoom máximo (Leaflet)
   * @param {number} opts.tileSize           Tamanho do tile (ex: 256)
   * @param {Array}  opts.bounds             [[minY,minX],[maxY,maxX]] em pixels da imagem base
   * @param {string} opts.outputDir           Diretório de saída
   * @param {WorkerPool|null} opts.pool       WorkerPool (null = single-thread)
   * @param {Function} opts.isCancelled       Função de cancelamento
   * @param {Function} opts.onTileDone        Callback por tile
   *
   * @returns {Promise<{cancelled:boolean,totalTiles:number}>}
   */
  static async processZoom(opts) {
    const {
      imageBuffer,
      imageWidth,
      imageHeight,
      zoom,
      maxZoom,
      tileSize,
      bounds,
      outputDir,
      pool,
      expand,
      isCancelled,
      onTileDone
    } = opts;

    // --------------------------------------------------
    // Cancelamento antecipado
    if (isCancelled?.()) return { cancelled: true, totalTiles: 0 };

    // --------------------------------------------------
    // Cálculo CORRETO do pixelSize (Leaflet)
    // zoom 0 -> imagem mais reduzida
    const zoomFactor = Math.pow(2, maxZoom - zoom);

    const scaledWidth = Math.ceil(imageWidth / zoomFactor);
    const scaledHeight = Math.ceil(imageHeight / zoomFactor);

    const { totalTiles, minTileX, maxTileX, minTileY, maxTileY } = ZoomEngine.computeTileRange(zoomFactor, tileSize, bounds);
    ZoomEngine.totalTiles = totalTiles;
    // --------------------------------------------------
    // Pré-criação do diretório do zoom
    const zoomDir = path.join(outputDir, String(zoom));
    await fs.mkdir(zoomDir, { recursive: true });

    // --------------------------------------------------
    // Pipeline de render
    try {
      // Pré-resize da imagem inteira para este zoom (single-thread)
      const resizedBuffer = await sharp(imageBuffer)
        .resize({
          width: scaledWidth,
          height: scaledHeight,
          kernel: sharp.kernel.lanczos3
        })
        .png()
        .toBuffer();

      for (let tx = minTileX; tx <= maxTileX; tx++) {
        if (isCancelled?.()) throw new Error("CANCELLED");

        const xDir = path.join(zoomDir, String(tx));
        await fs.mkdir(xDir, { recursive: true });

        for (let ty = minTileY; ty <= maxTileY; ty++) {
          if (isCancelled?.()) throw new Error("CANCELLED");

          const left = tx * tileSize;
          const top = ty * tileSize;
          const outPath = path.join(xDir, `${ty}.png`);

          if (pool) {
            // ---------------- Multi-thread ----------------
            await pool.run({
              zoomBuffer: resizedBuffer,
              tileSize: tileSize,
              scaledWidth: scaledWidth,
              scaledHeight: scaledHeight,
              left: left,
              top: top,
              expand: expand,
              output: outPath
            });
          } else {
            // ---------------- Single-thread ----------------
            await ZoomEngine._renderSingleTile({
              resizedBuffer,
              left,
              top,
              tileSize,
              output: outPath
            });
          }

          onTileDone?.(zoom);
        }
      }

      return { cancelled: false, totalTiles };

    } catch (err) {
      if (err.message === "CANCELLED") {
        await pool?.cancelAll?.();
        return { cancelled: true, totalTiles };
      }
      await pool?.cancelAll?.();
      throw err;
    }
  }

  // --------------------------------------------------
  // SINGLE TILE RENDER (single-thread)

  static async _renderSingleTile({ resizedBuffer, left, top, tileSize, output }) {
    const tile = sharp(resizedBuffer).extract({
      left,
      top,
      width: tileSize,
      height: tileSize
    });

    try {
      await tile.png().toFile(output);
    } catch {
      // Tile parcial → preencher transparente
      const partial = await tile.png().toBuffer().catch(() => null);

      await sharp({
        create: {
          width: tileSize,
          height: tileSize,
          channels: 4,
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        }
      })
        .composite(partial ? [{ input: partial }] : [])
        .png()
        .toFile(output);
    }
  }

  // --------------------------------------------------
  // UTILS

  static computeTileRange(zoomFactor, tileSize, bounds) {
    // --------------------------------------------------
    // Bounds reescalados para este zoom
    const [[minY, minX], [maxY, maxX]] = bounds;

    const scaledMinX = Math.floor(minX / zoomFactor);
    const scaledMaxX = Math.ceil(maxX / zoomFactor);
    const scaledMinY = Math.floor(minY / zoomFactor);
    const scaledMaxY = Math.ceil(maxY / zoomFactor);

    // --------------------------------------------------
    // Cálculo de tiles
    const minTileX = Math.floor(scaledMinX / tileSize);
    const maxTileX = Math.floor((scaledMaxX - 1) / tileSize);
    const minTileY = Math.floor(scaledMinY / tileSize);
    const maxTileY = Math.floor((scaledMaxY - 1) / tileSize);

    const tilesX = maxTileX - minTileX + 1;
    const tilesY = maxTileY - minTileY + 1;

    const totalTiles = Math.max(0, tilesX * tilesY);
    return { totalTiles, minTileX, maxTileX, minTileY, maxTileY };
  }
}
