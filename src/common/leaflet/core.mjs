import utils from "./utils.mjs";
import LinkDialog from "../../models/dialogs/linkDialog.js";
import Dialogs from "../../models/dialogs/dialog.js";
import SimpleEntryForm from "../../models/forms/simpleEntryForm.js";
import ArticleForm from "../../models/forms/articleForm.js";

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

        EXTENT: [0.00000000, -4054.00000000, 6000.00000000, 0.00000000],

        TILE_EXTENT: [0.00000000, -4054.00000000, 6000.00000000, 0.00000000],
        TILE_SIZE: 256,

        MIN_ZOOM: 3,
        MAX_ZOOM: 5,

        MAX_RESOLUTION: 1.00000000,

        MIN_POINTS: 2000,
        IMG_WIDTH: 6000,
        IMG_HEIGHT: 4054,
        VIEW_WIDTH: 3840,
        VIEW_HEIGHT: 2160,

        UNIT_TO_KM_RATIO: 1.5 // 1 Map Unit = 1.5 km
    },

    /**
    * Calcula a resolução (Map Units por Pixel) e a escala (Km por Pixel) para um ZoomLevel.
    * @param {number} zoomLevel - O nível de zoom para o qual calcular a escala.
    * @returns {{zoomLevel: number, resolution: number, mpp: number, scaleDisplay: string}} Objeto com a resolução e a escala.
    */
    getScaleForZoom(zoomLevel) {
        // Puxa as constantes globais.
        const { MAX_ZOOM, UNIT_TO_KM_RATIO } = this.constants;

        // 1. Resolução em Map Units por Pixel (Map Units / Pixel)
        // Fórmula Rz = 1 * 2 ^ (Zmax - Z)
        const resolution = 1 * Math.pow(2, MAX_ZOOM - zoomLevel);

        // 2. Metros por Pixel (MPP)
        const mpp = resolution * UNIT_TO_KM_RATIO;

        // 3. Cálculo para exibição (distância no mapa que 100px na tela representa)
        const distanceInMeters = mpp * 100;

        let displayValue;
        let displayUnit;

        if (distanceInMeters >= 1) {
            displayValue = distanceInMeters;
            displayUnit = 'km';
        } else {
            displayValue = distanceInMeters * 1000;
            displayUnit = 'm';
        }

        const scaleDisplay = `${displayValue} ${displayUnit}`; // \u2248 é o símbolo de "aproximadamente"

        return {
            zoomLevel,
            resolution, // Map Units/Pixel
            mpp, // Meters/Pixel
            scaleDisplay: scaleDisplay // String formatada
        };
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
    * Objeto L.CRS customizado com a função de distância em metros.
    * @type {L.CRS.Simple|null}
    */
    CustomCRS: null, // Nova propriedade para armazenar o CRS customizado

    /**
    * Controle de desenho no mapa.
    * 
    * @extends {L.Control.Draw}
    */
    CustomDrawControl: L.Control.Draw.extend({
        options: {
            position: 'topright' // Posição no canto superior esquerdo.            
        },
        onAdd: utils.onAddDrawControl
    }),

    TransparentGridLayer: L.GridLayer.extend({
        createTile: utils.onCreateTile
    }),

    /**
    * Inicializa o controle do Mapa com a imagem fornecida.
    * 
    * @param {String} worldMapURL - URL da imagem do Mapa Mundi.
    */
    init: function (worldMapURL) {
        if (!worldMapURL) {
            uniforge.ctrls.msgBox.showWarning('Nenhuma imagem de mapa foi informada. Informe um mapa padrão no painel de Configuração.');
            return null;
        }

        let mapExtent = lControl.constants.EXTENT;
        var mapMinZoom = lControl.constants.MIN_ZOOM;
        var mapMaxZoom = lControl.constants.MAX_ZOOM;
        var mapMaxResolution = lControl.constants.MAX_RESOLUTION;
        var unitRatio = lControl.constants.UNIT_TO_METER_RATIO;
        var mapMinResolution = Math.pow(2, mapMaxZoom) * mapMaxResolution;

        var tileExtent = lControl.constants.TILE_EXTENT;
        var tileSize = lControl.constants.TILE_SIZE;

        var crs = L.CRS.Simple;
        crs.transformation = new L.Transformation(1, -tileExtent[0], -1, tileExtent[3]);
        crs.scale = function (zoom) {
            return Math.pow(2, zoom) / mapMinResolution;
        };
        crs.zoom = function (scale) {
            return Math.log(scale * mapMinResolution) / Math.LN2;
        };

        crs.distance = function (latlng1, latlng2) {
            // Calcula a distância euclidiana em Map Units (X, Y)
            const dx = latlng2.lng - latlng1.lng;
            const dy = latlng2.lat - latlng1.lat;

            const distanceInMapUnits = Math.sqrt(dx * dx + dy * dy);

            // Converte para metros usando a razão: 1 Map Unit = 1500 metros
            //return distanceInMapUnits * unitRatio;
            return distanceInMapUnits;
        };

        let worldMap;
        const map = lControl.map = L.map('map', {
            crs: crs, // Usando o sistema de coordenadas simples do Leaflet para imagens personalizadas.            
            maxZoom: mapMaxZoom,
            minZoom: mapMinZoom,
            //zoomSnap: 0.1,
            zoomControl: false, // Desativa o controle de zoom padrão para personalizá-lo.
            //maxBoundsViscosity: 1.0
        });

        // Calcula os limites de imagem com base na largura/altura.
        const bounds = [[
            crs.unproject(L.point(mapExtent[2], mapExtent[3])),
            crs.unproject(L.point(mapExtent[0], mapExtent[1]))
        ]];

        map.setView(L.latLng(4054, 6000), mapMinZoom);

        worldMap = L.tileLayer(`file://${worldMapURL}/{z}/{x}/{y}.png`, {
            crs: L.CRS.Simple,
            minZoom: mapMinZoom, maxZoom: mapMaxZoom,
            tileSize: L.point(tileSize, tileSize),
            noWrap: true,
            maxZoom: mapMaxZoom,
            attribution: '&copy; <a href="https://www.maptiler.com/engine/">Rendered with MapTiler Engine</a>',
            tms: false
        });

        // Adiciona a camada do mapa mundi ao mapa.
        map.addLayer(worldMap);

        // Ajusta a visualização inicial para se ajustar aos limites da imagem.
        map.fitBounds(bounds);

        // Define o ID do mapa como o mapa padrão.
        map.mid = lControl.constants.DEFAULT_OVERLAY; // Define o ID do mapa como o mapa padrão.

        // Configura os elementos do mapa.
        const mapElements = lControl.mapElements = _configureMapElements();

        // Configura o controle de camadas sobrepostas (caminhos, cidades e nomes).
        _configureOverlayControl();

        // Configura o controle principal.
        _configureMainControl();

        // Configura o controle de desenho customizado.
        _configureCustomDrawControl(mapElements);

        // Configura o controle de camadas.
        _configureLayerControl();

        // Configura o controle de escala.
        const scaleControl = _configureScaleControl();

        const grid = new lControl.TransparentGridLayer({
            tileSize: lControl.constants.TILE_SIZE,
            opacity: 0.8, // Adjust transparency.
            zIndex: 1000, // Ensure the grid is above other layers.
        });

        grid.addTo(map);
        grid.bringToFront();

        L.GeometryUtil.geodesicArea = function (latLngs) {
            let area = 0;

            const points = latLngs;

            for (let i = 0, len = points.length; i < len; i++) {

                const p1 = points[i];
                const p2 = points[(i + 1) % len];

                area += (p1.lng * p2.lat);
                area -= (p2.lng * p1.lat);
            }

            return Math.abs(area / 2);
        };

        L.GeometryUtil.readableDistance = function (distance, isMetric, useFeet, isNautical) {
            const distanceKm = (distance * lControl.constants.UNIT_TO_KM_RATIO);
            return `${distanceKm.toFixed(2)} km`;
        };

        L.GeometryUtil.readableArea = function (area) {
            // converte unidades do mapa para km²
            const kmsPerUnit = lControl.constants.UNIT_TO_KM_RATIO;
            const areaInSquareKms = area * Math.pow(kmsPerUnit, 2);
            return `${areaInSquareKms.toFixed(2)} km²`;
        };

        lControl.loadElements(map.mid, uniforge.time.y.value); // Carrega os elementos do mapa do banco de dados.

        // Atualiza a escala inicialmente.
        scaleControl.update();

        // Ativa os ouvintes de eventos do mapa do Leaflet.
        _activateEventsListener();

        // -------------------------------------------------------------------------------------------------------------------------
        // Funções auxiliares.
        // -------------------------------------------------------------------------------------------------------------------------

        function _configureMapElements() {
            const mapElements = new L.FeatureGroup();

            // Grupo para armazenar as camadas desenhadas.
            map.addLayer(mapElements);

            // Configura o grupo de camadas para as ferramentas de desenho do Leaflet.pm.
            map.pm.setGlobalOptions({
                layerGroup: mapElements,
                exitModeOnEscape: true
            });

            map.pm.setLang('pt_br', {
                tooltips: {
                    firstVertex: 'Clique para começar a desenhar uma forma.',
                    continueLine: 'Clique para continuar desenhando.',
                    finishPoly: 'Clique no primeiro ponto para fechar esta forma.'
                }
            });

            return mapElements;
        }

        function _configureMainControl() {
            const mainControl = new lControl.MainControl();
            map.addControl(mainControl);

            return mainControl;
        }

        function _configureCustomDrawControl(mapElements) {
            lControl.CustomDrawControl.edit = {
                featureGroup: mapElements
            };

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
                rectangle: {
                    tooltip: {
                        start: 'Clique e arraste para desenhar um retângulo.'
                    }
                },
            });

            const drawControl = new lControl.CustomDrawControl();
            map.addControl(drawControl);

            return drawControl;
        }

        function _configureLayerControl() {
            const layerControl = new lControl.LayerControl();
            map.addControl(layerControl);

            return layerControl;
        }

        function _configureOverlayControl() {

            /**
            * Instância da camada de armazenagem a imagem que representa os caminhos do Mapa.
            * @type {L.ImageOverlay}
            *        
            */
            const paths = lControl.overlay = L.imageOverlay(`${uniforge.urls.mapOverlays}/paths.png`, bounds, {
                zIndex: 1,
                interactive: false
            });
            paths.addTo(map);
            paths.bringToFront();

            /**
            * Instância da camada de armazenagem a imagem que representa as cidades do Mapa.
            * @type {L.ImageOverlay}
            *        
            */
            const cities = lControl.overlay = L.imageOverlay(`${uniforge.urls.mapOverlays}/cities.png`, bounds, {
                zIndex: 2,
                interactive: false
            });
            cities.addTo(map);
            cities.bringToFront();

            /**
            * Instância da camada de armazenagem a imagem que representa os nomes do Mapa.
            * @type {L.ImageOverlay}
            *        
            */
            const labels = lControl.overlay = L.imageOverlay(`${uniforge.urls.mapOverlays}/labels.png`, bounds, {
                zIndex: 3,
                interactive: false
            });
            labels.addTo(map);
            labels.bringToFront();
            const overlayLayerControl = L.control.layers(null, {
                "Caminhos": paths,
                "Cidades": cities,
                "Nomes": labels
            }).addTo(map);

            // Pega o container do controle
            const container = overlayLayerControl.getContainer();

            // Pega o botão de toggle (ícone do controle)
            const toggleButton = container.querySelector('.leaflet-control-layers-toggle');

            // Pega a lista de layers
            const list = container.querySelector('.leaflet-control-layers-list');

            // Esconde inicialmente
            list.classList.add('hidden');

            // Alterna ao clicar no botão
            toggleButton.addEventListener('click', (e) => {
                e.stopPropagation();
                const visible = !list.classList.contains('hidden');

                if (visible)
                    list.classList.add('hidden');
                else
                    list.classList.remove('hidden');
            });

            // Fecha se clicar fora do controle
            document.addEventListener('click', (e) => {
                if (!container.contains(e.target)) {
                    list.classList.add('hidden');
                }
            });

            return overlayLayerControl;
        }

        function _configureScaleControl() {
            const scaleControl = L.control({
                position: 'bottomleft'
            });

            scaleControl.onAdd = function () {

                this._div = L.DomUtil.create(
                    'div',
                    'leaflet-control-scale-line',
                );

                this.update();

                return this._div;
            };

            scaleControl.update = function () {

                const zoom = map.getZoom();

                const scale =
                    lControl.getScaleForZoom(zoom);

                this._div.innerHTML = scale.scaleDisplay;
            };

            scaleControl.addTo(map);

            return scaleControl;
        }

        function _activateEventsListener() {
            //map.on('moveend', _checkMapVisibility);
            map.on('mousedown', _onUserMapClick);
            map.on('draw:created', (event) => _onDrawCreated(event, false));
            map.on('pm:create', (event) => _onDrawCreated(event, true));

            map.on('zoomend', _onZoomEnd);

            // Adicione um listener para o evento 'draw:drawstart' para desabilitar o arrastre do mapa quando estiver desenhando um polígono.
            map.on('draw:drawstart', function (e) {
                if (e.layerType === 'polygon') {
                    map.dragging.disable();
                }
            });
            // Adicione um listener para o evento 'pm:drawstart' para desabilitar o arrastre do mapa quando estiver desenhando um polígono.
            map.on('pm:drawstart', function (e) {
                if (e.shape === 'Polygon') {
                    map.dragging.disable();
                }
            });

            // Adicione um listener para o evento 'draw:drawstop' para habilitar o arrastre do mapa.
            map.on('draw:drawstop', function (e) {
                map.dragging.enable();
            });
            // Adicione um listener para o evento 'pm:drawend' para habilitar o arrastre do mapa.
            map.on('pm:drawend', function (e) {
                map.dragging.enable();
            });

            // Adicione um listener para o evento de quando o Popup do elemento for aberto.
            map.on('popupopen', function (event) {
                const popup = event.popup._container;

                if (!popup) return;

                popup.addEventListener('click', (e) => {
                    const showBtn = e.target.closest('.layer-popup-show');
                    const deleteBtn = e.target.closest('.layer-popup-delete');

                    if (showBtn) {
                        showBtn.classList.add('disabled');
                        lControl.showEntry(e);
                    }

                    if (deleteBtn) {
                        deleteBtn.classList.add('disabled');
                        lControl.deleteElement(e);
                    }
                });
            });

            // Adicione um listener para o evento de clique do botão direito para remover o ultimo vertice de um polígono.
            map.getContainer().addEventListener('contextmenu', (event) => {               
                const drawInstance = map.pm.Draw.Polygon;
                if (drawInstance && drawInstance.enabled()) {
                    event.preventDefault();                    
                    drawInstance._removeLastVertex();
                }
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

        async function _onDrawCreated(e, isPM) {
            let layer = e.layer;

            const removeLayer = () => {
                if (layer && lControl.map.hasLayer(layer)) {
                    lControl.map.removeLayer(layer);
                }
            };

            const link = await LinkDialog.configDialog(null, { hasSidePanel: true });
            try {
                // Se o link foi criado, obtenha-o.
                if (link) {
                    const item = uniforge.doc[link.type].get(link.id);
                    // Verifica se o item obtido é válido.
                    if (item) {
                        let layer = e.layer;
                        const latlngs = layer._latlngs || layer._latlng;
                        layer.source = item; // Atribui o item como fonte da camada desenhada.
                        layer.type = isPM ? e.shape.toLowerCase() : e.layerType; // Tipo de camada desenhada (círculo, retângulo, polígono, etc.).                        

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
                            icon: (layer.type === 'marker') ? layer.options.icon.options.iconUrl : layer.type,
                            source: `${layer.source.type}{${layer.source._id}}`,
                            points: points,
                        }

                        // Adiciona o elemento ao banco de dados.
                        const result = await uniforge.db.addMapElement(data);
                        layer._id = result.addedId;
                        layer._leaflet_id = lControl.mapElements.getLayerId(layer); // Armazena o ID do elemento para referência futura.

                        layer = lControl.createPopup(layer); // Cria o elemento para a camada desenhada.

                        lControl.mapElements.addLayer(layer);
                        // Adiciona a camada desenhada ao grupo de elementos do mapa.
                        _updateLayerControl();

                        // Comita a transação.
                        await uniforge.db.commitTransaction();
                    }
                }
                // Se o link foi cancelado, remove a camada desenhada.
                else {
                    removeLayer();
                }
            } catch (error) {
                // Se ocorrer um erro ao adicionar a camada desenhada, faça o rollback da transação.
                await uniforge.db.rollbackTransaction();
                console.error('Erro ao adicionar a camada desenhada:', error);
            }
            finally {
                const markerButton = document.querySelector('.leaflet-draw-button.marker');
                markerButton.classList.remove('active');

                const mapObjectsPanel = document.querySelector('#mapObjectsPanel');
                mapObjectsPanel.classList.remove('active');

                // Desativa todas as opções de desenho do ícone do Marcador.
                mapObjectsPanel.querySelectorAll('.tools-container .tools-content .config-group .marker a').forEach(option => option.classList.remove('active'));
                // Desativa todas as opções de desenho da cor do Marcador.
                mapObjectsPanel.querySelectorAll('.tools-container .tools-content .config-group .color a').forEach(option => option.classList.remove('active'));

                if (utils.drawer.markerObj) utils.drawer.markerObj.disable();
            }
        }

        function _onZoomEnd() {
            scaleControl.update();
        }

        return lControl;
    },

    createPopup: function (layer) {
        const source = layer.source;
        const popupContent = document.createElement('div');

        const title = document.createElement('strong');
        title.innerText = source.title || 'Camada Desenhada';
        title.classList.add('layer-popup-title');

        const popupBody = document.createElement('div');
        popupBody.classList.add('layer-popup-body');

        popupBody.innerHTML = source.flavor || 'Nenhuma descrição disponível.';

        const footer = document.createElement('div');
        footer.classList.add('layer-popup-footer', 'flexrow');

        const showButton = document.createElement('a');
        showButton.dataset.id = layer.source._id;
        showButton.dataset.type = layer.source.type;
        showButton.classList.add('layer-popup-show');
        showButton.innerHTML = `<i class="fas fa-eye"></i>`;

        const deleteButton = document.createElement('a');
        deleteButton.dataset.meid = layer._id;
        deleteButton.dataset.leafletId = layer._leaflet_id;
        deleteButton.classList.add('layer-popup-delete');
        deleteButton.innerHTML = `<i class="fas fa-trash"></i>`;

        footer.appendChild(showButton);
        footer.appendChild(deleteButton);

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
    },


    loadElements: function (mid, epoch = 1) {
        lControl.mapElements.clearLayers();
        const elements = uniforge.doc.maps.get(mid).elements || [];
        const elementsOfEpoch = elements.filter(element => element.epoch === epoch);
        elementsOfEpoch.forEach((elementData) => {
            let element;
            switch (elementData.mType) {
                case 'circle': {
                    const points = elementData.points.split(';').map(point => {
                        const coords = point.split(',').map(Number);
                        return L.latLng(coords[0], coords[1]);
                    });

                    element = L.circle(points, utils.options.regularShape(false));
                } break;
                case 'marker': {
                    const markerUrl = elementData.icon; // URL do ícone do marcador.
                    const point = L.latLng(elementData.points.split(',').map(Number));

                    element = L.marker(point);
                    element.setIcon(L.icon({
                        iconUrl: markerUrl,
                        iconSize: [32, 32], // Tamanho do ícone (ajuste conforme necessário).
                        iconAnchor: [16, 32], // Ponto de ancoragem do ícone (ajuste conforme necessário).
                        popupAnchor: [0, -32] // Ponto de ancoragem do popup (ajuste conforme necessário).
                    }));
                } break;
                case 'polygon': {
                    const points = elementData.points.split(';').map(point => {
                        const coords = point.split(',').map(Number);
                        return L.latLng(coords[0], coords[1]);
                    });

                    element = L.polygon(points, utils.options.polygon(false, false));
                } break;
                case 'rectangle': {
                    const points = elementData.points.split(';').map(point => {
                        const coords = point.split(',').map(Number);
                        return L.latLng(coords[0], coords[1]);
                    });

                    element = L.rectangle(points, utils.options.regularShape(false));
                } break;
                default: {
                    console.warn(`Tipo de elemento desconhecido: ${elementData.type}`);
                    return; // Ignora elementos com tipo desconhecido.
                }
            }

            element.type = elementData.mType; // Armazena o tipo do elemento.
            element.source = _getSource(elementData.source); // Obtém a fonte do elemento. 

            element._id = elementData._id;
            element._leaflet_id = lControl.mapElements.getLayerId(element); // Armazena o ID do elemento.

            element = lControl.createPopup(element); // Cria o elemento com o popup configurado.
            lControl.mapElements.addLayer(element);

            _updateLayerControl();
        });

        function _getSource(source) {
            const pattern = /^(entry|event|entity|lineage|timeline)\{([a-zA-Z0-9]{16})\}$/;
            const match = source.match(pattern);
            if (match) {
                const type = match[1];
                const id = match[2];

                return uniforge.doc[type].get(id);
            } else {
                return null;
            }
        }
    },

    deleteElement: async function (event) {
        event.stopPropagation();
        const deleteBtn = event.target.closest('.layer-popup-delete');

        if (await Dialogs.confirm('Apagar Elemento', 'Deseja remover o elemento?')) {
            let meid = null;
            let layerId = null;

            const layerItem = event.target.closest('.layer-item');
            if (layerItem) {
                meid = layerItem.id;
                layerId = Number(layerItem.dataset.leafletId);
            }
            else {
                const deleteButton = event.target.closest('a.layer-popup-delete');
                meid = deleteButton.dataset.meid;
                layerId = Number(deleteButton.dataset.leafletId);
            }

            if (!meid) return;

            uniforge.db.deleteMapElement(meid);
            lControl.mapElements.removeLayer(layerId);

            await uniforge.db.rebuildDocs();
            _updateLayerControl();
        }

        deleteBtn.classList.remove('disabled');
    },
    showEntry: async function (event) {
        event.stopPropagation();
        const showBtn = event.target.closest('.layer-popup-show');

        let id = null;
        let type = null;

        const button = event.target.closest('.layer-popup-show');
        if (button) {
            id = button.dataset.id;
            type = button.dataset.type;

            const data = uniforge.doc[type].get(id);
            if (data) {
                const form = new ArticleForm(data, type === 'timeline', button);
                form.show(true);
            }
        }
    }
}

function _updateLayerControl() {
    const iconMap = utils.iconMap;
    const mapElementsList = document.querySelector('#mapElementsList');
    mapElementsList.innerHTML = ''; // Limpa a lista atual.

    lControl.mapElements.eachLayer(function (layer) {
        const li = document.createElement('li');
        li.id = layer._id;
        li.dataset.leafletId = layer._leaflet_id;
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

        deleteButton.addEventListener('click', lControl.deleteElement);

        li.appendChild(content);
        li.appendChild(deleteButton);

        li.addEventListener('mouseover', _onLayerItemMouseOver);
        li.addEventListener('mouseleave', _onLayerItemMouseLeave)

        mapElementsList.appendChild(li);
    })

    function _onLayerItemMouseLeave(event) {
        event.stopPropagation();

        const layerItem = event.target.closest('.layer-item');
        const layerId = layerItem.dataset.leafletId;
        const layer = lControl.mapElements.getLayer(layerId);

        let element;
        switch (layer.type) {
            case 'marker': {
                element = layer._icon;
            } break;
            case 'circle': {
                element = layer._path;
            } break;
            case 'polygon': {
                element = layer._path;
            } break;
            case 'rectangle': {
                element = layer._path;
            } break;
            default: {
                console.warn(`Tipo de elemento desconhecido: ${layer.type}`);
                return; // Ignora elementos com tipo desconhecido.
            }
        }

        element.style.outline = '';
        element.style.outlineOffset = '';
    }

    function _onLayerItemMouseOver(event) {
        event.stopPropagation();
        const layerItem = event.target.closest('.layer-item');
        const layerId = layerItem.dataset.leafletId;
        const layer = lControl.mapElements.getLayer(layerId);

        let element;
        switch (layer.type) {
            case 'marker': {
                element = layer._icon;
            } break;
            case 'circle': {
                element = layer._path;
            } break;
            case 'polygon': {
                element = layer._path;
            } break;
            case 'rectangle': {
                element = layer._path;
            } break;
            default: {
                console.warn(`Tipo de elemento desconhecido: ${layer.type}`);
                return; // Ignora elementos com tipo desconhecido.
            }
        }

        element.style.outline = "5px ridge var(--light-text-color)";
        element.style.outlineOffset = "5px";
    }
}

export default lControl;