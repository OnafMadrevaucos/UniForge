/**
 * zoomEngine.mjs — ZoomEngine com support a bounds e onTileDone
 *
 * Exports ZoomEngine.processZoom(opts)
 *
 * opts:
 *  normalizedImageBuffer, normalizedWidth, normalizedHeight,
 *  effectiveZoom, tileSize,
 *  stripeHeight (optional),
 *  pool (WorkerPool),
 *  expand (bool),
 *  bounds ([[minY,minX],[maxY,maxX]] in normalized-image pixels),
 *  outputFolder (folder for this zoom; engine writes x/y.png inside),
 *  maxTasksInFlight (optional),
 *  onTileDone (optional callback receiving { z, tx, ty })
 *
 * Returns { minTileX, maxTileX, minTileY, maxTileY, scaledWidth, scaledHeight }
 */

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
      onTileDone
    } = opts;

    if (!normalizedImageBuffer) throw new Error("ZoomEngine: normalizedImageBuffer required");
    if (!pool) throw new Error("ZoomEngine: pool required");
    if (!bounds) throw new Error("ZoomEngine: bounds required");
    if (!outputFolder) throw new Error("ZoomEngine: outputFolder required");

    const scale = Math.pow(2, effectiveZoom);
    const scaledWidth = Math.round(normalizedWidth * scale);
    const scaledHeight = Math.round(normalizedHeight * scale);

    // bounds in normalized-image coords -> scale to output coords
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

    for (let si = 0; si < stripeCount; si++) {
      const stripeTop = si * stripeHeight;
      const stripeHeightActual = Math.min(stripeHeight, scaledHeight - stripeTop);
      const stripeBottom = stripeTop + stripeHeightActual;

      // skip stripes that don't intersect bounds
      if (stripeBottom <= scaledMinY || stripeTop >= scaledMaxY) continue;

      // source stripe in normalized-image coords
      const sourceTop = Math.floor(stripeTop / scale);
      const sourceHeight = Math.ceil(stripeHeightActual / scale);

      const srcTopClamped = Math.max(0, Math.min(normalizedHeight - 1, sourceTop));
      const srcHeightClamped = Math.max(1, Math.min(normalizedHeight - srcTopClamped, sourceHeight));

      const stripeBuffer = await sharp(normalizedImageBuffer, { unlimited: true })
        .extract({
          left: 0,
          top: srcTopClamped,
          width: normalizedWidth,
          height: srcHeightClamped
        })
        .resize({
          width: scaledWidth,
          height: stripeHeightActual,
          kernel: sharp.kernel.lanczos3
        })
        .png()
        .toBuffer();

      const tasks = [];
      let inFlight = 0;

      for (let tx = tileX0; tx <= tileX1; tx++) {
        for (let ty = tileY0; ty <= tileY1; ty++) {

          // tile global bounds
          const tileTopGlobal = ty * tileSize;
          const tileBottomGlobal = tileTopGlobal + tileSize;

          // check tile intersects current stripe AND intersects bounds area
          if (tileBottomGlobal <= stripeTop || tileTopGlobal >= stripeTop + stripeHeightActual) continue;
          const tileLeft = tx * tileSize;
          const tileRight = tileLeft + tileSize;

          // Also ensure tile intersects scaled bounds horizontally
          if (tileRight <= scaledMinX || tileLeft >= scaledMaxX) continue;

          const tileTopLocal = tileTopGlobal - stripeTop;

          const tileFolder = path.join(outputFolder, String(tx));
          await fs.mkdir(tileFolder, { recursive: true });
          const outPath = path.join(tileFolder, `${ty}.png`);

          const task = {
            zoomBuffer: stripeBuffer,
            tileSize,
            expand,
            scaledWidth,
            scaledHeight: stripeHeightActual,
            left: tileLeft,
            top: tileTopLocal,
            output: outPath
          };

          // schedule task -> when resolved call onTileDone
          const p = pool.run(task).then(() => {
            if (typeof onTileDone === "function") {
              try { onTileDone({ z: effectiveZoom - /* we'll pass z as separate in caller if needed*/ 0, tx, ty }); }
              catch (_) {}
            }
          });

          tasks.push(p);
          inFlight++;
          if (inFlight >= maxTasksInFlight) {
            // wait for the first wave to settle
            await Promise.race(tasks);
            inFlight = 0;
          }
        }
      }

      await Promise.all(tasks);
      // stripeBuffer goes out of scope and is GC-able
    }

    return { minTileX: tileX0, maxTileX: tileX1, minTileY: tileY0, maxTileY: tileY1, scaledWidth, scaledHeight };
  }
};
