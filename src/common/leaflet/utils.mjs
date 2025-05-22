const iconMap =  {
    polygon: 'fas fa-border-top-left',
    rectangle: 'fas fa-square',
    circle: 'fas fa-circle',
    marker: 'fas fa-location-pin'
}

function _zoomIn(map) {
    map.zoomIn();
    console.log('Zoom In');
}

function _zoomOut(map) {
    map.zoomOut();
    console.log('Zoom Out');
}

function onAddMain(map) {
    const container = L.DomUtil.create('div', 'leaflet-bar flexcol');

    const zoomInButton = L.DomUtil.create('button', 'leaflet-control-zoomIn');
    zoomInButton.innerHTML = '<i class="fa-solid fa-plus"></i>';
    L.DomEvent.on(zoomInButton, 'click', _zoomIn.bind(this, map));

    const zoomOutButton = L.DomUtil.create('button', 'leaflet-control-zoomOut');
    zoomOutButton.innerHTML = '<i class="fa-solid fa-minus"></i>';
    L.DomEvent.on(zoomOutButton, 'click', _zoomOut.bind(this, map));

    container.appendChild(zoomInButton);
    container.appendChild(zoomOutButton);

    return container;
}

function _onPolygonDraw(map) {
    const iconUrl = uniforge.urls.icons.join('polygon.png'); // URL do ícone do marcador.

    // Ativar o desenho de polígono.
    const polygonDrawer = new L.Draw.Polygon(map, {
        allowIntersection: false, // Restringe a interseção de polígonos.
        icon: L.icon({
            iconUrl: iconUrl, // URL do ícone do marcador.
            iconSize: [16, 16],
            iconAnchor: [8, 8],
            popupAnchor: [0, -32]
        }),
        shapeOptions: { 
            color: 'var(--red)', // Cor do polígono.           
            weight: 5,
            dashArray: '5, 10',
        }
    });
    // Evento para desativar após o clique inicial (impedindo início imediato).
    map.on('click', function startDrawing() {
        polygonDrawer.enable();
        map.off('click', startDrawing); // Remover o evento para evitar múltiplos cliques.
    });
}

function _onRetangleDraw(map) {
    // Ativar o desenho de retângulo.
    const retangleDrawer = new L.Draw.Rectangle(map, {
        shapeOptions: { 
            color: 'var(--red)', // Cor do polígono.           
            weight: 5,
            dashArray: '5, 10',
        }
    });

    // Evento para desativar após o clique inicial (impedindo início imediato).
    map.on('click', function startDrawing() {
        retangleDrawer.enable();
        map.off('click', startDrawing); // Remover o evento para evitar múltiplos cliques.
    });
}

function _onCircleDraw(map) {
    // Ativar o desenho de círculo.
    const circleDrawer = new L.Draw.Circle(map, {
        shapeOptions: { 
            color: 'var(--red)', // Cor do polígono.           
            weight: 5,
            dashArray: '5, 10',
        }
    });
    // Evento para desativar após o clique inicial (impedindo início imediato).
    map.on('click', function startDrawing() {
        circleDrawer.enable();
        map.off('click', startDrawing); // Remover o evento para evitar múltiplos cliques.
    });
}

async function _onMarkerDraw(map) {
    const iconUrl = uniforge.urls.icons.join('marker.png'); // URL do ícone do marcador.
    // Ativar o desenho de marcador.
    const markerDrawer = new L.Draw.Marker(map, {
        icon: L.icon({
            iconUrl: iconUrl, // URL do ícone do marcador.
            iconSize: [32, 32],
            iconAnchor: [2, 32],
            popupAnchor: [0, -32]
        })
    });
    // Evento para desativar após o clique inicial (impedindo início imediato).
    map.on('click', function startDrawing() {
        markerDrawer.enable();
        map.off('click', startDrawing); // Remover o evento para evitar múltiplos cliques.
    });
}

function onAddDraw(map) {
    const container = L.DomUtil.create('div', 'leaflet-bar flexcol');

    // Cria um botão de Polígono.
    const polygonButton = L.DomUtil.create('button', 'leaflet-draw-button', container);
    polygonButton.innerHTML = `<i class="${iconMap.polygon}"></i>`; // Emoji de atualização ou seu ícone customizado.
    // Adiciona um evento de clique ao botão.
    L.DomEvent.on(polygonButton, 'click', _onPolygonDraw.bind(this, map));

    // Cria um botão de Retângulo.
    const retangleButton = L.DomUtil.create('button', 'leaflet-draw-button', container);
    retangleButton.innerHTML = `<i class="${iconMap.rectangle}"></i>`; // Emoji de atualização ou seu ícone customizado.
    // Adiciona um evento de clique ao botão.
    L.DomEvent.on(retangleButton, 'click', _onRetangleDraw.bind(this, map));

    // Cria um botão de Círculo.
    const circleButton = L.DomUtil.create('button', 'leaflet-draw-button', container);
    circleButton.innerHTML = `<i class="${iconMap.circle}"></i>`; // Emoji de atualização ou seu ícone customizado.
    // Adiciona um evento de clique ao botão.
    L.DomEvent.on(circleButton, 'click', _onCircleDraw.bind(this, map));

    // Cria um botão de Marcador.
    const markerButton = L.DomUtil.create('button', 'leaflet-draw-button', container);
    markerButton.innerHTML = `<i class="${iconMap.marker}"></i>`; // Emoji de atualização ou seu ícone customizado.
    // Adiciona um evento de clique ao botão
    L.DomEvent.on(markerButton, 'click', _onMarkerDraw.bind(this, map));
    return container;
}

function _onExpandLayer(map) {
    const layerControl = document.querySelector('#layerControl');
    layerControl.classList.toggle('active');  
}

function onAddLayer(map) {
    const container = L.DomUtil.create('div', 'leaflet-bar flexcol');

    const expandButton = L.DomUtil.create('button', 'leaflet-control-expand', container);
    expandButton.innerHTML = '<i class="fas fa-expand"></i>';
    L.DomEvent.on(expandButton, 'click', _onExpandLayer.bind(this, map));

    return container;
}

function onCreateTile(coords) {
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

const utils = {
    onAddMain: onAddMain,
    onAddDraw: onAddDraw,
    onAddLayer: onAddLayer,
    onCreateTile: onCreateTile,
    iconMap: iconMap,
}
export default utils;