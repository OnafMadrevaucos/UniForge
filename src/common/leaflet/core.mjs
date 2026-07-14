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

        UNIT_TO_KM_RATIO: 1.5, // 1 Map Unit = 1.5 km        
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

        _loadElementsStyles();

        // Configura o controle de camadas sobrepostas (caminhos, cidades e nomes).
        _configureOverlayControl();

        // Configura o controle principal.
        _configureMainControl();

        // Configura o controle de desenho customizado.
        _configureCustomDrawControl(mapElements);        

        // Configura o controle de escala.
        const scaleControl = _configureScaleControl();
        
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

            // Configura a localização dos tooltips do Leaflet.pm para PT-BR.
            map.pm.setLang('pt_br', {
                tooltips: {
                    firstVertex: 'Clique para começar a desenhar uma forma.',
                    continueLine: 'Clique para continuar desenhando.',
                    startCircle: 'Clique para determinar o centro do círculo',

                    finishPoly: 'Clique no ponto inicial para fechar esta forma.',
                    finishRect: 'Clique para finalizar o retângulo',
                    finishCircle: 'Clique para finalizar o círculo',

                    placeMarker: "Escolha uma posição para o marcador.",
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
            utils.setupCustomButtons(map);
        }        

        function _loadElementsStyles() {
            const style = JSON.parse(uniforge.settings.get('leafletStyle.pathOptions'));
            utils.drawStyle.update(map, style);
        }

        function _configureOverlayControl() {

            /**
            * Instância da camada de armazenagem a imagem que representa os caminhos do Mapa.
            * @type {L.ImageOverlay}        
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

            // Pega o container do controle.
            const container = overlayLayerControl.getContainer();

            // Pega o botão de toggle (ícone do controle).
            const toggleButton = container.querySelector('.leaflet-control-layers-toggle');

            // Pega a lista de layers.
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

            map.on('pm:create', (event) => _onDrawCreated(event, true));

            map.on('zoomend', _onZoomEnd);

            // Adicione um listener para o evento 'pm:drawstart' para desabilitar o arrastre do mapa quando estiver desenhando um polígono.
            map.on('pm:drawstart', function (e) {
                map.dragging.disable();

                if (e.shape !== 'Marker') {
                    utils.drawStyle.updateTemplineStyle(map, utils.drawStyle.style);
                }

                const workingLayer = e.workingLayer;
                const shape = e.shape;

                map.on('mousemove', (e) => {
                    const shape = map.pm.Draw.getActiveShape();
                    if (!shape) {
                        utils.measurements.removeTooltip();
                        return;
                    }

                    // CÍRCULO
                    if (shape === 'Circle') {
                        const workingLayer = map.pm.Draw.Circle._layer;

                        // Pega os vértices já desenhados
                        let latlng = e.latlng;

                        const radius = workingLayer.getRadius() * lControl.constants.UNIT_TO_KM_RATIO;
                        const area = Math.PI * radius * radius;

                        utils.measurements.updateTooltip(
                            map,
                            latlng,
                            `<strong>Raio:</strong> ${radius.toFixed(2)} km<br>
                                <strong>Área:</strong> ${area.toFixed(2)} km²
                                `
                        );
                    }
                    // POLÍGONOS
                    else if (shape === 'Polygon') {
                        const workingLayer = map.pm.Draw.Polygon._layer;

                        // Pega os vértices já desenhados
                        let latlngs = workingLayer.getLatLngs();
                        if (Array.isArray(latlngs[0])) latlngs = latlngs[0];

                        const area = utils.measurements.calculatePolygonArea(
                            [...latlngs, e.latlng],
                            lControl.constants.UNIT_TO_KM_RATIO
                        );
                        const perimeter = utils.measurements.calculatePolygonPerimeter(
                            [...latlngs, e.latlng],
                            lControl.constants.UNIT_TO_KM_RATIO
                        );

                        utils.measurements.updateTooltip(
                            map,
                            e.latlng,
                            `<strong>Perímetro:</strong> ${perimeter.toFixed(2)} km
                             <strong>Área:</strong> ${area.toFixed(2)} km²<br>
                            `
                        );
                    }
                    // RETÂNGULO
                    else if (shape === 'Rectangle') {
                        const workingLayer = map.pm.Draw.Rectangle._layer;

                        // Pega os vértices já desenhados
                        let latlngs = workingLayer.getLatLngs();
                        if (Array.isArray(latlngs[0])) latlngs = latlngs[0];

                        const area = utils.measurements.calculatePolygonArea(
                            latlngs,
                            lControl.constants.UNIT_TO_KM_RATIO
                        );
                        const perimeter = utils.measurements.calculatePolygonPerimeter(
                            latlngs,
                            lControl.constants.UNIT_TO_KM_RATIO
                        );

                        utils.measurements.updateTooltip(
                            map,
                            e.latlng,
                            `<strong>Perímetro:</strong> ${perimeter.toFixed(2)} km
                             <strong>Área:</strong> ${area.toFixed(2)} km²<br>
                            `
                        );
                    }
                });

                workingLayer.on('pm:vertexadded', (event) => {

                    const latlngs = workingLayer.getLatLngs();
                    if (!latlngs || !latlngs[0]) return;

                    const points = latlngs[0];
                    if (points.length < 2) return;

                    const mouseLatLng = points.length ? points[points.length - 1] : points;

                    // POLÍGONO
                    if (shape === 'Polygon') {

                        const area = utils.measurements.calculatePolygonArea(
                            latlngs,
                            lControl.constants.UNIT_TO_KM_RATIO
                        );
                        const perimeter = utils.measurements.calculatePolygonPerimeter(
                            latlngs,
                            lControl.constants.UNIT_TO_KM_RATIO
                        );

                        utils.measurements.updateTooltip(
                            map,
                            mouseLatLng,
                            `<strong>Perímetro:</strong> ${perimeter.toFixed(2)} km
                             <strong>Área:</strong> ${area.toFixed(2)} km²<br>
                            `
                        );
                    }
                });

                // CÍRCULO
                workingLayer.on('pm:centerplaced', () => {

                    workingLayer.on('pm:change', () => {
                        const radius = workingLayer.getRadius() * lControl.constants.UNIT_TO_KM_RATIO;
                        const area = Math.PI * radius * radius;

                        utils.measurements.updateTooltip(
                            map,
                            workingLayer.getLatLng(),
                            `<strong>Raio:</strong> ${radius.toFixed(2)} km<br>
                             <strong>Área:</strong> ${area.toFixed(2)} km²
                            `
                        );
                    });
                });
            });

            // Adicione um listener para o evento 'pm:drawend' para habilitar o arrastre do mapa.
            map.on('pm:drawend', e => _onDrawEnd());

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

        function _onUserMapClick(e) {
            lControl.clickLatLang = e.latlng;  // Ponto de clique do usuário.
        }

        async function _onDrawCreated(e, isPM) {
            let layer = e.layer;

            // Atualiza o estilo da camada desenhada.
            layer.setStyle(utils.drawStyle.style);

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
                            style: JSON.stringify(utils.drawStyle.style)
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
                if (utils.state.drawInstance) utils.state.drawInstance.disable();
                utils.measurements.removeTooltip(map);
            }
        }

        function _onDrawEnd() {
            map.dragging.enable();

            const buttons = document.querySelectorAll('a.leaflet-buttons-control-button');
            buttons.forEach(button => button.classList.remove('active'));

            const containers = document.querySelectorAll('div.map-objects-container');
            containers.forEach(container => container.classList.remove('active'));

            utils.measurements.removeTooltip(map);
        }

        function _onZoomEnd() {
            scaleControl.update();
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

                    const elementStyle = JSON.parse(elementData.style) ?? utils.options.regularShape(false, false);

                    element = L.circle(points, elementStyle);
                    element.setStyle(elementStyle);
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

                    const elementStyle = JSON.parse(elementData.style) ?? utils.options.polygon(false, false);

                    element = L.polygon(points, elementStyle);
                    element.setStyle(elementStyle);
                } break;
                case 'rectangle': {
                    const points = elementData.points.split(';').map(point => {
                        const coords = point.split(',').map(Number);
                        return L.latLng(coords[0], coords[1]);
                    });

                    const elementStyle = JSON.parse(elementData.style) ?? utils.options.regularShape(false, false);

                    element = L.rectangle(points, elementStyle);
                    element.setStyle(elementStyle);
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

    const noObjectsFoundMessage = document.getElementById('noObjectsFoundMessage');

    // Se não houver elementos, exibe a mensagem de "Nenhum objeto encontrado".
    if (lControl.mapElements.getLayers().length === 0) {        
        noObjectsFoundMessage.classList.remove('hidden');
    }
    // Caso haja elementos, gera os itens da lista de elementos do mapa.
    else {
        // Garante que a mensagem de "Nenhum objeto encontrado" esteja oculta.
        noObjectsFoundMessage.classList.add('hidden');
        
        // Percorre os elementos do mapa e os adiciona à lista de controle de camadas.
        lControl.mapElements.eachLayer(async function (layer) {
            const li = document.createElement('li');
            li.id = layer._id;
            li.dataset.leafletId = layer._leaflet_id;
            li.classList.add('layer-item', 'flexrow');

            const content = document.createElement('div');
            content.classList.add('layer-item-content', 'flexrow');

            const img = document.createElement('img');
            if (!layer.source.img) {
                img.src = uniforge.urls.blankImg;
            }
            else {
                img.src = await uniforge.utils.blobToImage(layer.source.img);
            }

            const contentBody = document.createElement('div');
            contentBody.classList.add('layer-item-content-body', 'flexcol');

            const h3 = document.createElement('h3');
            h3.innerText = layer.source.title;

            const span = document.createElement('span');
            span.innerHTML = `<i class="${layer.source.entryType.icon}"></i> ${layer.source.entryType.title}`;

            contentBody.appendChild(h3);
            contentBody.appendChild(span);

            content.appendChild(img);
            content.appendChild(contentBody);

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
    }

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