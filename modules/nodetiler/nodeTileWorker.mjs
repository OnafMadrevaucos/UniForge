/**
 * nodeTileWorker.mjs — tile worker otimizado (ESM)
 *
 * Recebe via postMessage um objeto:
 * {
 *  zoomBuffer: Buffer (stripe),
 *  tileSize,
 *  expand,
 *  scaledWidth,            // full scaled width of zoom (pixels)
 *  scaledHeight: stripeH,  // stripe height in pixels (output space)
 *  left,                   // left in pixels (global, relative to zoom)
 *  top,                    // top relative to stripeBuffer (local)
 *  output
 * }
 *
 * Responde "done" ou { error: msg }
 */

import sharp from "sharp";
import { parentPort } from "worker_threads";

parentPort.on("message", async (task) => {
  try {
    const {
      zoomBuffer,
      tileSize,
      expand,
      scaledWidth,
      scaledHeight,
      left,
      top,
      output
    } = task;

    // compute extraction sizes (top/local within stripeBuffer)
    const extractWidth = Math.min(tileSize, Math.max(0, scaledWidth - left));
    const extractHeight = Math.min(tileSize, Math.max(0, scaledHeight - top));

    if (extractWidth <= 0 || extractHeight <= 0) {
      // Entirely outside -> write transparent tile
      await sharp({
        create: {
          width: tileSize,
          height: tileSize,
          channels: 4,
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        }
      }).png().toFile(output);
      parentPort.postMessage("done");
      return;
    }

    const base = sharp(zoomBuffer, { unlimited: true }).ensureAlpha();

    // extract the portion corresponding to this tile
    const extracted = base.clone().extract({
      left: left,
      top: top,
      width: extractWidth,
      height: extractHeight
    });

    if (!expand) {
      await extracted.png().toFile(output);
      parentPort.postMessage("done");
      return;
    }

    // extend to full tile size with transparent background
    await extracted
      .extend({
        top: 0,
        left: 0,
        bottom: tileSize - extractHeight,
        right: tileSize - extractWidth,
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toFile(output);

    parentPort.postMessage("done");
  } catch (err) {
    parentPort.postMessage({ error: err.message || String(err) });
  }
});
