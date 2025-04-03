/**
 * Instância do grupo de elementos desenhados no mapa.
 * 
 * @type {L.FeatureGroup}
 */
export const mapElements = new L.FeatureGroup();

/**
 * Controle de desenho no mapa.
 * 
 * @extends {L.Control.Draw}
 */
export const CustomDrawControlConfig = {
    options: {
        position: 'topright'
    },
    edit: {
        mapElements: mapElements
    },

    onAdd: function (map) {
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
    }
};