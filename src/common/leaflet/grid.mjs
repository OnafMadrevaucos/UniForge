export const GridLayerConfig = {
    createTile: function (coords) {
        // Create a tile with transparency
        const tile = document.createElement('canvas');
        tile.width = uniforge.constants.TILE_SIZE; // Match your map's tile size
        tile.height = uniforge.constants.TILE_SIZE;
        const ctx = tile.getContext('2d');

        // Draw grid lines
        ctx.strokeStyle = 'rgba(212, 198, 148, 0.5)'; // Grid line color
        ctx.lineWidth = 1;

        // Draw horizontal and vertical grid lines
        for (let i = 0; i <= uniforge.constants.TILE_SIZE; i += 36) { // Adjust the grid cell size (36px here)
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, uniforge.constants.TILE_SIZE);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(0, i);
            ctx.lineTo(uniforge.constants.TILE_SIZE, i);
            ctx.stroke();
        }

        return tile;
    },
};