const iconMap = {
    polygon: 'fas fa-border-top-left',
    rectangle: 'fas fa-square',
    circle: 'fas fa-circle',
    marker: 'fas fa-location-pin'
}

const defaultHintlineStyle = {
    color: 'var(--light-text-color)',
    dashArray: '5, 10',
    weight: 3
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
        if (isDrawer) {
            return {
                snappable: true,
                snapDistance: 20,
                allowSelfIntersection: withIntersection,
                removeLastVertex: true,
                finishOn: 'dblclick',
                hintlineStyle: defaultHintlineStyle,
                templineStyle: { ...style },
                pathOptions: { ...style }
            }
        }
        else {
            return { ...style };
        }
    },
    regularShape: function (isDrawer = true) {
        if (isDrawer) {
            return {
                hintlineStyle: defaultHintlineStyle,
                pathOptions: { ...style }
            }
        }
        else {
            return { ...style };
        }
    }
}

const drawer = {
    marker: function (map, markerURL) {
        if (state.drawInstance && state.drawInstance.enabled()) state.drawInstance.disable();

        map.pm.enableDraw('Marker', options.marker(markerURL)); // Permite interseção de polígonos.
        state.drawInstance = map.pm.Draw.Marker;

        return state.drawInstance;
    },
    polygon: function (map) {
        if (state.drawInstance && state.drawInstance.enabled()) state.drawInstance.disable();

        map.pm.enableDraw('Polygon', options.polygon()); // Permite interseção de polígonos.
        state.drawInstance = map.pm.Draw.Polygon;

        return state.drawInstance;
    },
    circle: function (map) {
        if (state.drawInstance && state.drawInstance.enabled()) state.drawInstance.disable();

        map.pm.enableDraw('Circle', options.regularShape()); // Permite interseção de círculos.
        state.drawInstance = map.pm.Draw.Circle;

        return state.drawInstance;
    },
    rectangle: function (map) {
        if (state.drawInstance && state.drawInstance.enabled()) state.drawInstance.disable();

        map.pm.enableDraw('Rectangle', options.regularShape()); // Permite interseção de retângulos.
        state.drawInstance = map.pm.Draw.Rectangle;

        return state.drawInstance;
    }
}

const style = {
    fillColor: 'var(--red)',
    fillOpacity: 0.5,
    color: 'var(--red)', // Cor do polígono.
    opacity: 1,
    weight: 5,
    dashArray: '0, 0',
};

const state = {
    drawInstance: null,
    blockEvents: false
};

function _updateStyle(map, newStyle) {
    // Gera o objeto de opções com os estilos do desenho.    
    var drawOptions = {
        templineStyle: {
            ...style,
            ...(newStyle ?? {})
        },
        pathOptions: {
            ...style,
            ...(newStyle ?? {})
        },
        hintlineStyle: { ...defaultHintlineStyle }
    };

    // Verifica se a instância do mapa do Leaflet foi enviada corretamente.
    if (!map) return;    

    // Caso não exista desenho ativo, apenas atualiza as opções globais.
    if (!state.drawInstance || !state.drawInstance?.enabled()) {
        map.pm.setPathOptions(drawOptions.pathOptions);
        return;
    }

    const activeShape = map.pm.Draw.getActiveShape();

    // ------------------------------------------------------
    // SALVA OS VÉRTICES ATUAIS
    // ------------------------------------------------------

    // Obtém a camada de desenho ativa.
    const workingLayer = state.drawInstance._workingLayer ?? state.drawInstance._layer;

    // Verifica se a camada de desenho ativa possui latlngs.
    if (workingLayer) {
        workingLayer.setStyle(drawOptions.templineStyle);
    }
}

function _zoomIn(map) {
    map.zoomIn();
    console.log('Zoom In');
}

function _zoomOut(map) {
    map.zoomOut();
    console.log('Zoom Out');
}

function _setupCustomButtons(map) {
    // Inicializa o Geoman sem os controles padrão (vamos criar os nossos)
    map.pm.addControls({
        position: 'topright',
        cutPolygon: false,
        drawMarker: false,
        drawCircleMarker: false,
        drawPolyline: false,
        drawRectangle: false,
        drawPolygon: false,
        drawCircle: false,
        drawText: false,
        editMode: false,
        dragMode: false,
        removalMode: false,
        rotateMode: false,
    });

    map.pm.Toolbar.createCustomControl({
        name: 'drawPolygonCustom',
        block: 'draw',
        title: 'Desenhar Região',
        className: iconMap.polygon, // Sua classe de ícone
        onClick: (event) => {
            if (event) _onPolygonDraw(map, event);
        },
        toggle: true // Comportamento de liga/desliga
    });

    map.pm.Toolbar.createCustomControl({
        name: 'drawRectangleCustom',
        block: 'draw',
        title: 'Desenhar Retângulo',
        className: iconMap.rectangle, // Sua classe de ícone
        onClick: (event) => {
            if (event) _onRectangleDraw(map, event);
        },
        toggle: true // Comportamento de liga/desliga
    });

    map.pm.Toolbar.createCustomControl({
        name: 'drawCircleCustom',
        block: 'draw',
        title: 'Desenhar Círculo',
        className: iconMap.circle, // Sua classe de ícone
        onClick: (event) => {
            if (event) _onCircleDraw(map, event);
        },
        toggle: true // Comportamento de liga/desliga
    });

    map.pm.Toolbar.createCustomControl({
        name: 'drawMarkerCustom',
        block: 'draw',
        title: 'Posicionar Marcador',
        className: iconMap.marker, // Sua classe de ícone
        onClick: (event) => {
            if (event) _onMarkerDraw(map, event);
        },
        toggle: true // Comportamento de liga/desliga
    });
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

function _onPolygonDraw(map, event) {
    const target = event.target;
    const button = target.closest('.leaflet-buttons-control-button');
    const mapShapesContainer = document.querySelector('.map-objects-container.regular-shapes');

    if (button.classList.contains('active')) {
        button.classList.remove('active');
        mapShapesContainer.classList.remove('active');
    }
    else {
        button.classList.add('active');
        mapShapesContainer.classList.add('active');
    }

    drawer.polygon(map, options);
}


function _onRectangleDraw(map, event) {
    const target = event.target;
    const button = target.closest('.leaflet-buttons-control-button');
    const mapShapesContainer = document.querySelector('.map-objects-container.regular-shapes');

    if (button.classList.contains('active')) {
        button.classList.remove('active');
        mapShapesContainer.classList.remove('active');
    }
    else {
        button.classList.add('active');
        mapShapesContainer.classList.add('active');
    }

    drawer.rectangle(map, options);
}

function _onCircleDraw(map, event) {
    const target = event.target;
    const button = target.closest('.leaflet-buttons-control-button');
    const mapShapesContainer = document.querySelector('.map-objects-container.regular-shapes');

    if (button.classList.contains('active')) {
        button.classList.remove('active');
        mapShapesContainer.classList.remove('active');
    }
    else {
        button.classList.add('active');
        mapShapesContainer.classList.add('active');
    }

    drawer.circle(map, options);
}

async function _onMarkerDraw(map, event) {
    const target = event.target;
    const button = target.closest('.leaflet-buttons-control-button');
    const mapMarkersContainer = document.querySelector('.map-objects-container.marker');

    // Desativa todas as opções de desenho.
    mapMarkersContainer.querySelectorAll('.marker-options').forEach(option => option.classList.remove('active'));

    button.classList.toggle('active');

    if (!button.classList.contains('active')) {
        if (state.drawInstance) state.drawInstance.disable();
        mapMarkersContainer.classList.remove('active');

        // Desativa todas as opções de desenho do ícone do Marcador.
        mapMarkersContainer.querySelectorAll('.tools-container .tools-content .config-group .marker a').forEach(option => option.classList.remove('active'));
        // Desativa todas as opções de desenho da cor do Marcador.
        mapMarkersContainer.querySelectorAll('.tools-container .tools-content .config-group .color a').forEach(option => option.classList.remove('active'));
    }
    else {
        mapMarkersContainer.classList.add('active');
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
    L.DomEvent.on(retangleButton, 'click', _onRectangleDraw.bind(this, map));

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
    setupCustomButtons: _setupCustomButtons,

    onAddMain: onAddMain,
    onAddDrawControl: onAddDrawControl,
    onAddLayer: onAddLayer,
    onCreateTile: onCreateTile,

    iconMap: iconMap,
    options: options,
    drawer: drawer,
    state: state,
    drawStyle: {
        style,
        update: _updateStyle
    }
}

export default utils;