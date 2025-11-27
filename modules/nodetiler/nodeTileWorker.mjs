/**
 * tileWorker.mjs
 *
 * Worker Thread responsável por gerar 1 tile por vez.
 * Recebe:
 *  - buffer da imagem de zoom
 *  - left/top
 *  - tileSize
 *  - expand: boolean
 */

import sharp from "sharp";
import { workerData, parentPort } from "worker_threads";

(async () => {
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
        } = workerData;

        const extractWidth = Math.min(tileSize, scaledWidth - left);
        const extractHeight = Math.min(tileSize, scaledHeight - top);

        // Tile totalmente fora → transparente
        if (extractWidth <= 0 || extractHeight <= 0) {
            const empty = await sharp({
                create: {
                    width: tileSize,
                    height: tileSize,
                    channels: 4,
                    background: { r: 0, g: 0, b: 0, alpha: 0 }
                }
            }).png().toBuffer();

            await sharp(empty).toFile(output);
            parentPort.postMessage("done");
            return;
        }

        // Extrai parte real
        let extracted = await sharp(zoomBuffer)
            .extract({ left, top, width: extractWidth, height: extractHeight })
            .png()
            .toBuffer();

        if (!expand) {
            await sharp(extracted).toFile(output);
            parentPort.postMessage("done");
            return;
        }

        // Expande tile
        const tile = await sharp(extracted)
            .extend({
                top: 0,
                left: 0,
                bottom: tileSize - extractHeight,
                right: tileSize - extractWidth,
                background: { r: 0, g: 0, b: 0, alpha: 0 }
            })
            .png()
            .toBuffer();

        await sharp(tile).toFile(output);

        parentPort.postMessage("done");

    } catch (err) {
        parentPort.postMessage({ error: err.message });
    }
})();
