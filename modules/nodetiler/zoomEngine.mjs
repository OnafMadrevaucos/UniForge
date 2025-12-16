// zoomEngine.mjs — ZoomEngine COM CANCELAMENTO SEGURO
// Garante que TODAS as Promises sejam resolvidas ou rejeitadas
// mesmo em cancelamento do usuário ou erro inesperado.

import sharp from "sharp";
import fs from "fs/promises";
import path from "path";

export const ZoomEngine = {
  async processZoom(opts) {
    const {
      normalizedImageBuffer,
      normalizedWidth,
      normalizedHeight,
      effectiveZoom,
      tileSize,
      stripeHeight = tileSize * 8,
      pool,
      expand = true,
      bounds,
      outputFolder,
      maxTasksInFlight = 32,
      onTileDone,
      isCancelled
    } = opts;

    if (!normalizedImageBuffer) throw new Error("ZoomEngine: normalizedImageBuffer required");
    if (!pool) throw new Error("ZoomEngine: pool required");
    if (!bounds) throw new Error("ZoomEngine: bounds required");
    if (!outputFolder) throw new Error("ZoomEngine: outputFolder required");

    const scale = Math.pow(2, effectiveZoom);
    const scaledWidth = Math.round(normalizedWidth * scale);
    const scaledHeight = Math.round(normalizedHeight * scale);

    const [[minY, minX], [maxY, maxX]] = bounds;
    const scaledMinX = minX * scale;
    const scaledMaxX = maxX * scale;
    const scaledMinY = minY * scale;
    const scaledMaxY = maxY * scale;

    const minTileX = Math.floor(scaledMinX / tileSize);
    const maxTileX = Math.floor((scaledMaxX - 1) / tileSize);
    const minTileY = Math.floor(scaledMinY / tileSize);
    const maxTileY = Math.floor((scaledMaxY - 1) / tileSize);

    const maxCols = Math.ceil(scaledWidth / tileSize);
    const maxRows = Math.ceil(scaledHeight / tileSize);

    const tileX0 = Math.max(0, minTileX);
    const tileX1 = Math.min(maxCols - 1, maxTileX);
    const tileY0 = Math.max(0, minTileY);
    const tileY1 = Math.min(maxRows - 1, maxTileY);

    const stripeCount = Math.ceil(scaledHeight / stripeHeight);

    try {
      for (let si = 0; si < stripeCount; si++) {
        if (isCancelled?.()) throw new Error("cancelled");

        const stripeTop = si * stripeHeight;
        const stripeHeightActual = Math.min(stripeHeight, scaledHeight - stripeTop);
        const stripeBottom = stripeTop + stripeHeightActual;

        if (stripeBottom <= scaledMinY || stripeTop >= scaledMaxY) continue;

        const sourceTop = Math.floor(stripeTop / scale);
        const sourceHeight = Math.ceil(stripeHeightActual / scale);

        const srcTopClamped = Math.max(0, Math.min(normalizedHeight - 1, sourceTop));
        const srcHeightClamped = Math.max(1, Math.min(normalizedHeight - srcTopClamped, sourceHeight));

        const stripeBuffer = await sharp(normalizedImageBuffer, { unlimited: true })
          .extract({ left: 0, top: srcTopClamped, width: normalizedWidth, height: srcHeightClamped })
          .resize({ width: scaledWidth, height: stripeHeightActual, kernel: sharp.kernel.lanczos3 })
          .png()
          .toBuffer();

        const inFlight = new Set();

        const enqueue = async (promise) => {
          inFlight.add(promise);
          try {
            await promise;
          } finally {
            inFlight.delete(promise);
          }
        };

        for (let tx = tileX0; tx <= tileX1; tx++) {
          for (let ty = tileY0; ty <= tileY1; ty++) {

            if (isCancelled?.()) throw new Error("cancelled");

            const tileTopGlobal = ty * tileSize;
            const tileBottomGlobal = tileTopGlobal + tileSize;
            if (tileBottomGlobal <= stripeTop || tileTopGlobal >= stripeTop + stripeHeightActual) continue;

            const tileLeft = tx * tileSize;
            const tileRight = tileLeft + tileSize;
            if (tileRight <= scaledMinX || tileLeft >= scaledMaxX) continue;

            const tileTopLocal = tileTopGlobal - stripeTop;

            const tileFolder = path.join(outputFolder, String(tx));
            await fs.mkdir(tileFolder, { recursive: true });
            const outPath = path.join(tileFolder, `${ty}.png`);

            const task = pool.run({
              zoomBuffer: stripeBuffer,
              tileSize,
              expand,
              scaledWidth,
              scaledHeight: stripeHeightActual,
              left: tileLeft,
              top: tileTopLocal,
              output: outPath
            }).then(() => {
              onTileDone?.({ z: effectiveZoom, tx, ty });
            });

            await enqueue(task);

            if (inFlight.size >= maxTasksInFlight) {
              await Promise.race(inFlight);
            }
          }
        }

        await Promise.allSettled(inFlight);
      }

      return { minTileX: tileX0, maxTileX: tileX1, minTileY: tileY0, maxTileY: tileY1, scaledWidth, scaledHeight };

    } catch (err) {
      if (err.message === "cancelled") {
        await pool.cancelAll?.();
        return { cancelled: true };
      }
      await pool.cancelAll?.();
      throw err;
    }
  }
};
