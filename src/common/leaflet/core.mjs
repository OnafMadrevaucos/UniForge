/**
* Constantes configuráveis, como dimensões de imagem e tamanho do tile.
* 
* @type {Object}
* @property {Number} MIN_POINTS             - Número mínimo de pontos para alguma operação.
* @property {Number} IMG_WIDTH              - Largura da imagem.
* @property {Number} IMG_HEIGHT             - Altura da imagem.
* @property {Number} VIEW_WIDTH             - Largura da área de visualização.
* @property {Number} VIEW_HEIGHT            - Altura da área de visualização.
* @property {Number} TILE_SIZE              - Tamanho de cada tile do mapa.
*/
export const constants = {
    MIN_POINTS: 2000,
    IMG_WIDTH: 5850,
    IMG_HEIGHT: 4550,
    VIEW_WIDTH: 3840,
    VIEW_HEIGHT: 2160,
    TILE_SIZE: 240,
};

/**
* Instância do mapa da biblioteca Leaflet.
* 
* @type {L.Map}
*/
export const map = L.map('map', {
    crs: L.CRS.Simple, // Usando o sistema de coordenadas simples do Leaflet para imagens personalizadas
    center: [0.0, 0.0],
    maxZoom: 3,
    minZoom: -2,
    zoomSnap: 0.1,
    zoomControl: false, // Desativa o controle de zoom padrão para personalizá-lo
    maxBoundsViscosity: 1.0
});

/**
 * Instância da camada de armazenagem a imagem do Mapa.
 * @type {L.ImageOverlay}
 */
export const overlay = null;

/**
 * Controle principal do Mapa.
 * 
 * @extends {L.Control}
*/
export const MainControlConfig = {
    options: {
        position: 'topright' // Posição no canto superior esquerdo
    },

    onAdd: function (map) {
        const container = L.DomUtil.create('div', 'leaflet-bar flexcol');

        const zoomInButton = L.DomUtil.create('button', 'leaflet-control-zoomIn');
        zoomInButton.innerHTML = '<i class="fa-solid fa-plus"></i>';
        L.DomEvent.on(zoomInButton, 'click', function () {
            map.zoomIn();
        });

        const zoomOutButton = L.DomUtil.create('button', 'leaflet-control-zoomOut');
        zoomOutButton.innerHTML = '<i class="fa-solid fa-minus"></i>';
        L.DomEvent.on(zoomOutButton, 'click', function () {
            map.zoomOut();
        });

        // Cria o botão para o controle
        const layerOptionsButton = L.DomUtil.create('button', 'leaflet-control-color');
        layerOptionsButton.innerHTML = '<i class="fa-solid fa-palette"></i>';
        // Adiciona o evento de clique para alterar a cor do mapa
        L.DomEvent.on(layerOptionsButton, 'click', function () {
            //renderForm('layerOptions');
        });

        container.appendChild(zoomInButton);
        container.appendChild(zoomOutButton);
        container.appendChild(layerOptionsButton);

        return container;
    }
};