
const listeners = {
    onAdd: function (map) {
        const container = L.DomUtil.create('div', 'leaflet-bar flexcol');

        const zoomInButton = L.DomUtil.create('button', 'leaflet-control-zoomIn');
        zoomInButton.innerHTML = '<i class="fa-solid fa-plus"></i>';
        L.DomEvent.on(zoomInButton, 'click', function () {        
            map.zoomIn();
            console.log('Zoom In');
        });

        const zoomOutButton = L.DomUtil.create('button', 'leaflet-control-zoomOut');
        zoomOutButton.innerHTML = '<i class="fa-solid fa-minus"></i>';
        L.DomEvent.on(zoomOutButton, 'click', function () {
            map.zoomOut();
            console.log('Zoom Out');
        });

        // Cria o botão para o controle
        const layerOptionsButton = L.DomUtil.create('button', 'leaflet-control-color');
        layerOptionsButton.innerHTML = '<i class="fa-solid fa-palette"></i>';
        // Adiciona o evento de clique para alterar a cor do mapa
        L.DomEvent.on(layerOptionsButton, 'click', function () {
            console.log('*CLICK*');
        });

        container.appendChild(zoomInButton);
        container.appendChild(zoomOutButton);
        container.appendChild(layerOptionsButton);

        return container;
    },

    onAddDraw: function (map) {
        const container = L.DomUtil.create('div', 'leaflet-bar flexcol');

        // Cria um botão de Polígono
        const polygonButton = L.DomUtil.create('button', 'leaflet-draw-button', container);
        polygonButton.innerHTML = '<i class="fa-solid fa-border-top-left"></i>'; // Emoji de atualização ou seu ícone customizado

        // Adiciona um evento de clique ao botão
        L.DomEvent.on(polygonButton, 'click', function () {
            // Ativar o desenho de polígono
            const polygonDrawer = new L.Draw.Polygon(map);

            // Evento para desativar após o clique inicial (impedindo início imediato)
            map.on('click', function startDrawing() {
                polygonDrawer.enable();
                map.off('click', startDrawing); // Remover o evento para evitar múltiplos cliques
            });
        });

        // Cria um botão de Polígono
        const retangleButton = L.DomUtil.create('button', 'leaflet-draw-button', container);
        retangleButton.innerHTML = '<i class="fa-solid fa-square"></i>'; // Emoji de atualização ou seu ícone customizado

        // Adiciona um evento de clique ao botão
        L.DomEvent.on(retangleButton, 'click', function () {
            // Ativar o desenho de retângulo
            const retangleDrawer = new L.Draw.Rectangle(map);
            retangleDrawer.enable();

            // Evento para desativar após o clique inicial (impedindo início imediato)
            map.on('click', function startDrawing() {
                retangleDrawer.enable();
                map.off('click', startDrawing); // Remover o evento para evitar múltiplos cliques
            });
        });

        // Cria um botão de Polígono
        const circleButton = L.DomUtil.create('button', 'leaflet-draw-button', container);
        circleButton.innerHTML = '<i class="fa-solid fa-circle"></i>'; // Emoji de atualização ou seu ícone customizado

        // Adiciona um evento de clique ao botão
        L.DomEvent.on(circleButton, 'click', function () {
            // Ativar o desenho de círculo
            const circleDrawer = new L.Draw.Circle(map);
            // Evento para desativar após o clique inicial (impedindo início imediato)
            map.on('click', function startDrawing() {
                circleDrawer.enable();
                map.off('click', startDrawing); // Remover o evento para evitar múltiplos cliques
            });
        });

        // Cria um botão de Marcador
        const markerButton = L.DomUtil.create('button', 'leaflet-draw-button', container);
        markerButton.innerHTML = '<i class="fa-solid fa-location-pin"></i>'; // Emoji de atualização ou seu ícone customizado

        // Adiciona um evento de clique ao botão
        L.DomEvent.on(markerButton, 'click', function () {
            // Ativar o desenho de marcador
            const markerDrawer = new L.Draw.Marker(map);
            map.on('click', function startDrawing() {
                markerDrawer.enable();
                map.off('click', startDrawing); // Remover o evento para evitar múltiplos cliques
            });
        });

        return container;
    },

    onCreateTile: function (coords) {
        // Create a tile with transparency
        const tile = document.createElement('canvas');

        var tileSize = this.getTileSize();
        tile.setAttribute('width', tileSize.x);
        tile.setAttribute('height', tileSize.y);

        const ctx = tile.getContext('2d');

        // Draw grid lines
        ctx.strokeStyle = 'rgba(212, 198, 148, 0.5)'; // Grid line color
        ctx.lineWidth = 1;

        // Draw horizontal and vertical grid lines
        for (let i = 0; i <= tileSize; i += 36) { // Adjust the grid cell size (36px here)
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, tileSize);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(0, i);
            ctx.lineTo(tileSize, i);
            ctx.stroke();
        }

        return tile;
    }
}

export default listeners;