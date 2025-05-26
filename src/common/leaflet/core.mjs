import utils from "./utils.mjs";
import LinkDialog from "../../models/dialogs/linkDialog.js";

const lControl = {
    /**
    * Constantes configuráveis, como dimensões de imagem e tamanho do tile.
    * 
    * @type {Object}
    * @property {String} DEFAULT_OVERLAY        - ID do Mapa utilizado como mapa padrão.
    * 
    * @property {Number} MIN_POINTS             - Número mínimo de pontos para alguma operação.
    * @property {Number} IMG_WIDTH              - Largura da imagem.
    * @property {Number} IMG_HEIGHT             - Altura da imagem.
    * @property {Number} VIEW_WIDTH             - Largura da área de visualização.
    * @property {Number} VIEW_HEIGHT            - Altura da área de visualização.
    * @property {Number} TILE_SIZE              - Tamanho de cada tile do mapa.
    */
    constants: {
        DEFAULT_OVERLAY: 'De#m@Pgl0ba1Unfg',

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
            position: 'topright' // Posição no canto superior esquerdo.            
        },
        onAdd: utils.onAddMain
    }),

    /**
    * Controle de camada no mapa.
    * 
    * @extends {L.Control}
    */
    LayerControl: L.Control.extend({
        options: {
            position: 'bottomright' // Posição no canto superior esquerdo.            
        },
        onAdd: utils.onAddLayer
    }),

    /**
    * Controle de desenho no mapa.
    * 
    * @extends {L.Control.Draw}
    */
    CustomDrawControl: L.Control.Draw.extend({
        options: {
            position: 'topright' // Posição no canto superior esquerdo.            
        },
        onAdd: utils.onAddDraw
    }),

    TransparentGridLayer: L.GridLayer.extend({
        createTile: utils.onCreateTile
    }),

    init: function (mapPath) {
        const map = lControl.map = L.map('map', {
            crs: L.CRS.Simple, // Usando o sistema de coordenadas simples do Leaflet para imagens personalizadas.
            center: [0.0, 0.0],
            maxZoom: 3,
            minZoom: -2,
            zoomSnap: 0.1,
            zoomControl: false, // Desativa o controle de zoom padrão para personalizá-lo.
            maxBoundsViscosity: 1.0
        });

        map.mid = lControl.constants.DEFAULT_OVERLAY; // Define o ID do mapa como o mapa padrão.

        const mapElements = lControl.mapElements = new L.FeatureGroup();

        // Calcula os limites de imagem com base na largura/altura.
        const bounds = [[0, 0], [lControl.constants.VIEW_HEIGHT, lControl.constants.VIEW_WIDTH]];

        map.setMaxBounds(lControl.constants.IMG_HEIGHT, lControl.constants.IMG_WIDTH);

        // Ajusta a visualização inicial para se ajustar aos limites da imagem.
        map.fitBounds(bounds);

        /**
        * Instância da camada de armazenagem a imagem do Mapa.
        * @type {L.ImageOverlay}
        */
        const overlay = lControl.overlay = L.imageOverlay(mapPath, bounds, {
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
        };

        const layerControl = new lControl.LayerControl();

        uniforge.utils.mergeObjects(L.drawLocal.draw.handlers, {
            circle: {
                tooltip: {
                    start: 'Clique e arraste para desenhar um círculo.'
                },
                radius: 'Raio'
            },
            marker: {
                tooltip: {
                    start: 'Clique no mapa para adicionar um marcador.'
                }
            },
            polygon: {
                tooltip: {
                    start: 'Clique para comecar a desenhar uma forma.',
                    cont: 'Clique para continuar desenhando.',
                    end: 'Clique no primeiro ponto para fechar esta forma.'
                }
            },
            rectangle: {
                tooltip: {
                    start: 'Clique e arraste para desenhar um retângulo.'
                }
            },
        });

        const draw = new lControl.CustomDrawControl();

        const grid = new lControl.TransparentGridLayer({
            tileSize: lControl.constants.TILE_SIZE,
            opacity: 0.8, // Adjust transparency.
            zIndex: 1000, // Ensure the grid is above other layers.
        });

        grid.addTo(map);
        grid.bringToFront();

        map.addControl(main);
        map.addControl(layerControl);
        map.addControl(draw);

        _loadMapElements(); // Carrega os elementos do mapa do banco de dados.

        map.on('moveend', _checkMapVisibility);
        map.on('mousedown', _onUserMapClick);
        map.on('draw:created', _onDrawCreated);

        function _loadMapElements() {
            const elements = uniforge.doc.maps.get(map.mid).elements || [];
            elements.forEach((elementData) => {
                let element;
                switch (elementData.type) {
                    case 'circle': {
                        element = L.circle(
                            L.latLng(elementData.points.split(',').map(Number)),
                            {}
                        );
                    } break;
                    case 'marker': {
                        element = L.marker(
                            L.latLng(elementData.points.split(',').map(Number)),
                            {}
                        );
                    } break;
                    case 'polygon': {
                        element = L.polygon(
                            elementData.points.split(';').map(point => {
                                const coords = point.split(',').map(Number);
                                return L.latLng(coords[0], coords[1]);
                            }),
                            {}
                        );
                    } break;
                    case 'rectangle': {
                        element = L.rectangle(
                            L.latLng(elementData.points.split(',').map(Number)),
                            {}
                        );
                    } break;
                    default: {
                        console.warn(`Tipo de elemento desconhecido: ${elementData.type}`);
                        return; // Ignora elementos com tipo desconhecido.
                    }
                }
                element = _createMapElement(element); // Cria o elemento com o popup configurado.
                lControl.mapElements.addLayer(element);
            });
        }

        // Função para calcular os pontos ao redor da uniforge.mapOverlay com um padding (0.0 a 1.0).
        function _checkMapVisibility() {

            // Função para calcular a quantidade de pontos com base na precisão e no tamanho da uniforge.mapOverlay.
            var _calculatePrecision = function (bounds) {
                const southWest = bounds.getSouthWest();
                const northEast = bounds.getNorthEast();

                // Calculando a diferença de latitude e longitude.
                const latDiff = northEast.lat - southWest.lat;
                const lngDiff = northEast.lng - southWest.lng;

                // Calculando a quantidade mínima de pontos para cobrir a uniforge.mapOverlay.
                const totalArea = latDiff * lngDiff;  // Área da uniforge.mapOverlay.
                const desiredPoints = Math.max(lControl.constants.MIN_POINTS, Math.sqrt(totalArea) * 100); // Ajuste para gerar pelo menos 1000 pontos.

                // Determinando o número de pontos para latitude e longitude.
                const latPoints = Math.ceil(Math.sqrt(desiredPoints * (latDiff / totalArea)));
                const lngPoints = Math.ceil(Math.sqrt(desiredPoints * (lngDiff / totalArea)));

                return { latPoints, lngPoints };
            }

            var _getWatcherPoints = function (bounds, paddingRatio) {
                const southWest = bounds.getSouthWest();
                const northEast = bounds.getNorthEast();

                // Calculando o número de pontos baseado na precisão.
                const { latPoints, lngPoints } = _calculatePrecision(bounds);

                // Calculando a diferença de latitude e longitude.
                const latDiff = northEast.lat - southWest.lat;
                const lngDiff = northEast.lng - southWest.lng;

                // Calculando os limites com o padding de 25%.
                const paddingLat = latDiff * paddingRatio;
                const paddingLng = lngDiff * paddingRatio;

                const points = [];

                // Gerando os pontos ao longo das bordas, considerando o padding e a precisão.
                for (let i = 0; i < latPoints; i++) {
                    for (let j = 0; j < lngPoints; j++) {
                        const lat = southWest.lat + paddingLat + (i * latDiff / (latPoints - 1)) - paddingLat;
                        const lng = southWest.lng + paddingLng + (j * lngDiff / (lngPoints - 1)) - paddingLng;
                        points.push(L.latLng(lat, lng));
                    }
                }

                return points;
            }

            var mapBounds = map.getBounds(); // Obtém os limites da área visível do mapa.
            var imageBounds = overlay.getBounds(); // Obtém os limites da uniforge.mapOverlay.

            // Calculando os 8 pontos ao redor da uniforge.mapOverlay.
            var points = _getWatcherPoints(imageBounds, 0.85); // 25% de padding  .
            var isVisible = mapBounds.intersects(points);

            // Se nenhum ponto da uniforge.mapOverlay estiver visível, ajustar a posição do mapa.
            if (!isVisible) {
                // Encontrar o ponto mais próximo do centro da tela.
                var closestPoint = points[0];
                var closestDistance = map.distance(lControl.clickLatLang, points[0]);

                points.forEach(function (point) {
                    var distance = map.distance(lControl.clickLatLang, point);
                    if (distance < closestDistance) {
                        closestPoint = point;
                        closestDistance = distance;
                    }
                });

                // Ajusta o mapa para garantir que pelo menos um ponto da uniforge.mapOverlay esteja visível.
                map.setView(closestPoint, map.getZoom(), {
                    animate: true
                });
            }
        }

        function _onUserMapClick(e) {
            lControl.clickLatLang = e.latlng;  // Ponto de clique do usuário.
        }

        async function _onDrawCreated(e) {
            const link = await LinkDialog.configDialog(null);
            // Se o link foi criado, obtenha-o.
            if (link) {
                const item = uniforge.doc[link.type].get(link.id);
                // Verifica se o item obtido é válido.
                if (item) {
                    try {
                        let layer = e.layer;
                        const latlngs = layer._latlngs || layer._latlng;
                        layer.source = item; // Atribui o item como fonte da camada desenhada.
                        layer.type = e.layerType; // Tipo de camada desenhada (círculo, retângulo, polígono, etc.).

                        layer = _createMapElement(layer); // Cria o elemento para a camada desenhada.

                        // Abre uma transação no banco de dados para adicionar o elemento.
                        await uniforge.db.beginTransaction();

                        let points = '';
                        if (Array.isArray(latlngs)) {
                            points = latlngs.first().map(point => `${point.lat},${point.lng}`).join(';');
                        } else points = `${latlngs.lat},${latlngs.lng}`;

                        // Cria o objeto de dados a ser adicionado ao banco de dados.
                        const data = {
                            mid: lControl.constants.DEFAULT_OVERLAY,
                            epoch: uniforge.time.y.value,
                            type: layer.type,
                            icon: utils.iconMap[layer.type],
                            source: `${layer.source.type}{${layer.source._id}}`,
                            points: points,
                        }

                        // Adiciona o elemento ao banco de dados.
                        await uniforge.db.addMapElement(data);

                        lControl.mapElements.addLayer(layer);
                        // Adiciona a camada desenhada ao grupo de elementos do mapa.
                        _updateLayerControl();

                        // Comita a transação.
                        await uniforge.db.commitTransaction();
                    } catch (error) {
                        // Se ocorrer um erro ao adicionar a camada desenhada, faça o rollback da transação.
                        await uniforge.db.rollbackTransaction();
                        console.error('Erro ao adicionar a camada desenhada:', error);
                    }
                }
            }
        }

        function _createMapElement(layer) {
            const popupContent = document.createElement('div');

            const title = document.createElement('strong');
            title.innerText = item.title || 'Camada Desenhada';
            title.classList.add('layer-popup-title');

            const popupBody = document.createElement('div');
            popupBody.classList.add('layer-popup-body');

            popupBody.innerHTML = layer.source.flavor || 'Nenhuma descrição disponível.';

            const footer = document.createElement('div');
            footer.classList.add('layer-popup-footer', 'flexrow');

            const typeIcon = document.createElement('a');
            typeIcon.innerHTML = `<i class="${utils.iconMap[layer.type]}"></i>`;

            footer.appendChild(typeIcon);

            if (layer.type === 'marker') {
                const coordsSpan = document.createElement('span');
                coordsSpan.classList.add('layer-popup-coords');
                coordsSpan.innerText = `Y: ${layer._latlng.lat.toFixed(2)}, X: ${layer._latlng.lng.toFixed(2)}`;

                footer.appendChild(coordsSpan);
            }

            popupContent.appendChild(title);
            popupContent.appendChild(popupBody);
            popupContent.appendChild(footer);

            layer.bindPopup(popupContent.innerHTML);

            return layer; // Retorna a camada desenhada com o popup configurado.
        }

        function _updateLayerControl() {
            const iconMap = utils.iconMap;
            const mapElementsList = document.querySelector('#mapElementsList');
            mapElementsList.innerHTML = ''; // Limpa a lista atual.

            var idx = 0;
            lControl.mapElements.eachLayer(function (layer) {
                const li = document.createElement('li');
                li.classList.add('layer-item', 'flexrow');

                const content = document.createElement('div');
                content.classList.add('layer-item-content', 'flexrow');

                const icon = document.createElement('a');
                icon.innerHTML = `<i class="${iconMap[layer.type]}"></i>`;

                const span = document.createElement('span');
                span.innerText = layer.source.title;

                content.appendChild(icon);
                content.appendChild(span);

                const deleteButton = document.createElement('a');
                deleteButton.classList.add('layer-item-delete');
                deleteButton.innerHTML = '<i class="fa-solid fa-trash"></i>';

                li.appendChild(content);
                li.appendChild(deleteButton);

                mapElementsList.appendChild(li);
            })
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