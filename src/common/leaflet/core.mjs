import listeners from "./listeners.mjs";

const lControl = {
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
    constants: {
        MIN_POINTS: 2000,
        IMG_WIDTH: 5850,
        IMG_HEIGHT: 4550,
        VIEW_WIDTH: 3840,
        VIEW_HEIGHT: 2160,
        TILE_SIZE: 200
    },

    /**
    * LatLng onde o último clique no mapa ocorreu.
    * 
    * @type {L.LatLng|null}
    */
    clickLatLang: null,

    /**
    * Instância do mapa da biblioteca Leaflet.
    * 
    * @type {L.Map}
    */
    map: null,

    /**
    * Instância do grupo de elementos desenhados no mapa.
    * 
    * @type {L.FeatureGroup}
    */
    mapElements: null,

    /**
    * Controle principal do Mapa.
    * 
    * @extends {L.Control}
    */
    MainControl: L.Control.extend({
        options: {
            position: 'topright' // Posição no canto superior esquerdo
        },
        onAdd: listeners.onAdd
    }),

    /**
    * Controle de desenho no mapa.
    * 
    * @extends {L.Control.Draw}
    */
    CustomDrawControl: L.Control.Draw.extend({
        options: {
            position: 'topright'
        },
        onAdd: listeners.onAddDraw
    }),

    TransparentGridLayer: L.GridLayer.extend({
        createTile: listeners.onCreateTile
    }),

    init: function () {
        const map = lControl.map = L.map('map', {
            crs: L.CRS.Simple, // Usando o sistema de coordenadas simples do Leaflet para imagens personalizadas
            center: [0.0, 0.0],
            maxZoom: 3,
            minZoom: -2,
            zoomSnap: 0.1,
            zoomControl: false, // Desativa o controle de zoom padrão para personalizá-lo
            maxBoundsViscosity: 1.0
        });

        const mapElements = lControl.mapElements = new L.FeatureGroup();

        // Calcula os limites de imagem com base na largura/altura
        const bounds = [[0, 0], [lControl.constants.VIEW_HEIGHT, lControl.constants.VIEW_WIDTH]];

        map.setMaxBounds(lControl.constants.IMG_HEIGHT, lControl.constants.IMG_WIDTH);

        // Ajusta a visualização inicial para se ajustar aos limites da imagem.
        map.fitBounds(bounds);

        /**
        * Instância da camada de armazenagem a imagem do Mapa.
        * @type {L.ImageOverlay}
        */
        const overlay = lControl.overlay = L.imageOverlay('./ui/map.jpg', bounds, {
            zIndex: 1 /* Garantir que fique atrás do Layer do Grid */
        });
        overlay.addTo(map);

        const scale = L.control.scale({
            imperial: false
        });
        scale.addTo(map);

        // Grupo para armazenar as camadas desenhadas.
        map.addLayer(mapElements);

        const main = new lControl.MainControl();

        lControl.CustomDrawControl.edit = {
            featureGroup: mapElements
        }

        const draw = new lControl.CustomDrawControl();

        const grid = new lControl.TransparentGridLayer({
            tileSize: lControl.constants.TILE_SIZE,
            opacity: 0.8, // Adjust transparency.
            zIndex: 1000, // Ensure the grid is above other layers.
        });

        grid.addTo(map);
        grid.bringToFront();

        map.addControl(main);
        map.addControl(draw);

        map.on('moveend', _checkMapVisibility);
        map.on('mousedown', _onUserMapClick);
        map.on('draw:created', _onDrawCreated);

        // Função para calcular os pontos ao redor da uniforge.mapOverlay com um padding (0.0 a 1.0).
        function _checkMapVisibility() {

            // Função para calcular a quantidade de pontos com base na precisão e no tamanho da uniforge.mapOverlay.
            var _calculatePrecision = function (bounds) {
                const southWest = bounds.getSouthWest();
                const northEast = bounds.getNorthEast();

                // Calculando a diferença de latitude e longitude
                const latDiff = northEast.lat - southWest.lat;
                const lngDiff = northEast.lng - southWest.lng;

                // Calculando a quantidade mínima de pontos para cobrir a uniforge.mapOverlay
                const totalArea = latDiff * lngDiff;  // Área da uniforge.mapOverlay
                const desiredPoints = Math.max(lControl.constants.MIN_POINTS, Math.sqrt(totalArea) * 100); // Ajuste para gerar pelo menos 1000 pontos

                // Determinando o número de pontos para latitude e longitude
                const latPoints = Math.ceil(Math.sqrt(desiredPoints * (latDiff / totalArea)));
                const lngPoints = Math.ceil(Math.sqrt(desiredPoints * (lngDiff / totalArea)));

                return { latPoints, lngPoints };
            }

            var _getWatcherPoints = function (bounds, paddingRatio) {
                const southWest = bounds.getSouthWest();
                const northEast = bounds.getNorthEast();

                // Calculando o número de pontos baseado na precisão
                const { latPoints, lngPoints } = _calculatePrecision(bounds);

                // Calculando a diferença de latitude e longitude
                const latDiff = northEast.lat - southWest.lat;
                const lngDiff = northEast.lng - southWest.lng;

                // Calculando os limites com o padding de 25%
                const paddingLat = latDiff * paddingRatio;
                const paddingLng = lngDiff * paddingRatio;

                const points = [];

                // Gerando os pontos ao longo das bordas, considerando o padding e a precisão
                for (let i = 0; i < latPoints; i++) {
                    for (let j = 0; j < lngPoints; j++) {
                        const lat = southWest.lat + paddingLat + (i * latDiff / (latPoints - 1)) - paddingLat;
                        const lng = southWest.lng + paddingLng + (j * lngDiff / (lngPoints - 1)) - paddingLng;
                        points.push(L.latLng(lat, lng));
                    }
                }

                return points;
            }

            var mapBounds = map.getBounds(); // Obtém os limites da área visível do mapa
            var imageBounds = overlay.getBounds(); // Obtém os limites da uniforge.mapOverlay

            // Calculando os 8 pontos ao redor da uniforge.mapOverlay
            var points = _getWatcherPoints(imageBounds, 0.85); // 25% de padding  
            var isVisible = mapBounds.intersects(points);

            // Se nenhum ponto da uniforge.mapOverlay estiver visível, ajustar a posição do mapa
            if (!isVisible) {
                // Encontrar o ponto mais próximo do centro da tela
                var closestPoint = points[0];
                var closestDistance = map.distance(lControl.clickLatLang, points[0]);

                points.forEach(function (point) {
                    var distance = map.distance(lControl.clickLatLang, point);
                    if (distance < closestDistance) {
                        closestPoint = point;
                        closestDistance = distance;
                    }
                });

                // Ajusta o mapa para garantir que pelo menos um ponto da uniforge.mapOverlay esteja visível
                map.setView(closestPoint, map.getZoom(), {
                    animate: true
                });
            }
        }

        function _onUserMapClick(e) {
            lControl.clickLatLang = e.latlng;  // Ponto de clique do usuário.
        }

        function _onDrawCreated(e) {
            const layer = e.layer;
            const type = e.layerType;

            layer.bindPopup(type);

            lControl.mapElements.addLayer(layer);
        }

        return {
            map: map,
            draw: draw,
            overlay: lControl.overlay,
            grid: grid
        }
    },
}

export default lControl;