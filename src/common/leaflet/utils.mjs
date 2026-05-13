const iconMap = {
    polygon: 'fas fa-border-top-left',
    rectangle: 'fas fa-square',
    circle: 'fas fa-circle',
    marker: 'fas fa-location-pin'
}

/**
 * Opções de configuração para os desenhos de polígonos, marcadores e formas regulares (círculos e retângulos).
 * Cada função retorna um objeto de opções específico para o tipo de desenho, permitindo personalização como ícones, cores e restrições de interseção.
 * 
 * @property {Function} marker - Retorna opções para o desenho de marcadores, incluindo o ícone personalizado.
 * @property {Function} polygon - Retorna opções para o desenho de polígonos, com a possibilidade de permitir ou restringir interseção e personalizar o ícone.
 * @property {Function} regularShape - Retorna opções para o desenho de formas regulares (círculos e retângulos), permitindo personalização de cor e estilo.
 */
const options = {
    marker: function (markerURL) {
        return {
            continueDrawing: false,
            snappable: false,
            markerStyle: {
                icon: L.icon({
                    iconUrl: markerURL, // URL do ícone do marcador.
                    iconSize: [32, 32],
                    iconAnchor: [16, 32],
                    popupAnchor: [0, -32]
                })
            },
        };
    },
    polygon: function (withIntersection = false, isDrawer = true) {
        const iconUrl = uniforge.urls.icons.join('polygon.png'); // URL do ícone do marcador.

        if (isDrawer) {
            return {
                snappable: true,
                snapDistance: 20,
                allowSelfIntersection: withIntersection,
                removeLastVertex: true,
                finishOn: 'dblclick',
                templineStyle: {
                    color: 'var(--red)', // Cor da linha temporária.
                    weight: 5,
                },
                hintlineStyle: {
                    color: 'var(--red)', // Cor do polígono.           
                    weight: 5,
                    dashArray: '5, 10',
                },
                pathOptions: {
                    color: 'var(--red)', // Cor do polígono.           
                    weight: 5,
                    dashArray: '5, 10',
                }
            }
        } else {
            return {
                color: 'var(--red)', // Cor do polígono.           
                weight: 5,
                dashArray: '5, 10',
            }
        }
    },
    regularShape: function (isDrawer = true) {
        if (isDrawer) {
            return {
                templineStyle: {
                    color: 'var(--red)', // Cor da linha temporária.
                    weight: 5,
                },
                hintlineStyle: {
                    color: 'var(--red)', // Cor do polígono.           
                    weight: 5,
                    dashArray: '5, 10',
                },
                pathOptions: {
                    color: 'var(--red)', // Cor do polígono.           
                    weight: 5,
                    dashArray: '5, 10',
                }
            }
        } else {
            return {
                color: 'var(--red)', // Cor do polígono.           
                weight: 5,
                dashArray: '5, 10',
            }
        }
    }
}

const drawer = {
    marker: function (map, markerURL) {
        map.pm.enableDraw('Marker', options.marker(markerURL)); // Permite interseção de polígonos.
    },
    polygon: function (map) {
        map.pm.enableDraw('Polygon', options.polygon(false)); // Permite interseção de polígonos.
    },
    circle: function (map) {
        map.pm.enableDraw('Circle', options.regularShape(false)); // Permite interseção de polígonos.
    },
    rectangle: function (map) {
        map.pm.enableDraw('Rectangle', options.regularShape(false)); // Permite interseção de polígonos.
    },

    markerObj: null
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

    // Evento para desativar após o clique inicial (impedindo início imediato).
    map.on('click', function startDrawing() {
        drawer.polygon(map, options);
        map.off('click', startDrawing); // Remover o evento para evitar múltiplos cliques.
    });
}

function _onRetangleDraw(map) {
    // Evento para desativar após o clique inicial (impedindo início imediato).
    map.on('click', function startDrawing() {
        drawer.rectangle(map, options);
        map.off('click', startDrawing); // Remover o evento para evitar múltiplos cliques.
    });
}

function _onCircleDraw(map) {
    // Evento para desativar após o clique inicial (impedindo início imediato).
    map.on('click', function startDrawing() {
        drawer.circle(map, options);
        map.off('click', startDrawing); // Remover o evento para evitar múltiplos cliques.
    });
}

async function _onMarkerDraw(map, event) {
    const target = event.target;
    const button = target.closest('button');
    const mapObjectsPanel = document.querySelector('#mapObjectsPanel');

    // Desativa todas as opções de desenho.
    mapObjectsPanel.querySelectorAll('.marker-options').forEach(option => option.classList.remove('active'));

    button.classList.toggle('active');

    if (!button.classList.contains('active')) {
        if (drawer.markerObj) drawer.markerObj.disable();
        mapObjectsPanel.classList.remove('active');

        // Desativa todas as opções de desenho do ícone do Marcador.
        mapObjectsPanel.querySelectorAll('.tools-container .tools-content .config-group .marker a').forEach(option => option.classList.remove('active'));
        // Desativa todas as opções de desenho da cor do Marcador.
        mapObjectsPanel.querySelectorAll('.tools-container .tools-content .config-group .color a').forEach(option => option.classList.remove('active'));
    }
    else {
        mapObjectsPanel.classList.add('active');
    }
}

function onAddDrawControl(map) {
    const container = L.DomUtil.create('div', 'leaflet-bar flexcol');

    // Cria um botão de Polígono.
    const polygonButton = L.DomUtil.create('button', 'leaflet-draw-button polygon', container);
    polygonButton.innerHTML = `<i class="${iconMap.polygon}"></i>`; // Emoji de atualização ou seu ícone customizado.
    // Adiciona um evento de clique ao botão.
    L.DomEvent.on(polygonButton, 'click', _onPolygonDraw.bind(this, map));

    // Cria um botão de Retângulo.
    const retangleButton = L.DomUtil.create('button', 'leaflet-draw-button retangle', container);
    retangleButton.innerHTML = `<i class="${iconMap.rectangle}"></i>`; // Emoji de atualização ou seu ícone customizado.
    // Adiciona um evento de clique ao botão.
    L.DomEvent.on(retangleButton, 'click', _onRetangleDraw.bind(this, map));

    // Cria um botão de Círculo.
    const circleButton = L.DomUtil.create('button', 'leaflet-draw-button circle', container);
    circleButton.innerHTML = `<i class="${iconMap.circle}"></i>`; // Emoji de atualização ou seu ícone customizado.
    // Adiciona um evento de clique ao botão.
    L.DomEvent.on(circleButton, 'click', _onCircleDraw.bind(this, map));

    // Cria um botão de Marcador.
    const markerButton = L.DomUtil.create('button', 'leaflet-draw-button marker', container);
    markerButton.innerHTML = `<i class="${iconMap.marker}"></i>`; // Emoji de atualização ou seu ícone customizado.
    // Adiciona um evento de clique ao botão
    L.DomEvent.on(markerButton, 'click', _onMarkerDraw.bind(this, map));
    return container;
}

function _onExpandLayer() {
    const layerControl = document.querySelector('#layerControl');
    layerControl.classList.toggle('active');
}

function onAddLayer(map) {
    const container = L.DomUtil.create('div', 'leaflet-bar flexcol');

    const expandButton = L.DomUtil.create('button', 'leaflet-control-expand', container);
    expandButton.innerHTML = '<i class="fas fa-expand"></i>';
    L.DomEvent.on(expandButton, 'click', _onExpandLayer.bind(this));

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
    onAddDrawControl: onAddDrawControl,
    onAddLayer: onAddLayer,
    onCreateTile: onCreateTile,
    iconMap: iconMap,
    options: options,
    drawer: drawer,
}

export default utils;