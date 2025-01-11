import { AtlasForm } from "./models/forms/atlasForm.js";
import { EncycloForm } from "./models/forms/encycloForm.js";
import { HistoryForm } from "./models/forms/historyForm.js";
import { LibraryForm } from "./models/forms/libraryForm.js";
import { PoliticsForm } from "./models/forms/politicsForm.js";
import { SettingsForm } from "./models/forms/settingsForm.js";
import { TimelineForm } from "./models/forms/timelineForm.js";
import MsgBox from "./models/msgBox.js";

import { LinkTooltip } from "./scripts/linkTooltip.js";
import { NavQueue } from "./scripts/navQueue.js";
import { registerHook, triggerHook } from "./scripts/hooks.js";

import DBManager from "./db/dbManager.js";
import DBDocuments from "./db/dbDocuments.js";

// Adiciona as propriedades restantes ao objeto uniforge.
uniforge.utils.mergeObjects(uniforge, {

    /**
     * Instância do gerenciador de banco de dados.
     * @type {DBManager}
     */
    db: new DBManager(),

    /**
     * Instância do mapa usando o Leaflet com configurações específicas.
     * 
     * @type {L.Map}
     */
    map: L.map('map', {
        crs: L.CRS.Simple, // Usando o sistema de coordenadas simples do Leaflet para imagens personalizadas
        center: [0.0, 0.0],
        maxZoom: 3,
        minZoom: -2,
        zoomSnap: 0.1,
        zoomControl: false, // Desativa o controle de zoom padrão para personalizá-lo
        maxBoundsViscosity: 1.0
    }),

    /**
     * Opções para editores Tiny MCE. 
     * Qualquer função customizada ou callbacks deve ser mesclado a essas opções.
     * 
     * @type {Object}
     * @property {Object|null} default  - Opção padrão.
     * @property {Object|null} simple   - Opção simplificada.
     */
    tinymceOptions: {
        default: {
            editable_class: 'editable',
            license_key: 'gpl',
            plugins: ['anchor', 'autolink', 'codesample', 'link', 'lists', 'searchreplace', 'table', 'visualblocks', 'image'],
            toolbar: 'undo redo | blocks | bold italic backcolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | entryLink blockquote sendImage',
            toolbar_mode: 'wrap',
            placeholder: 'Descrição do registro...',
            block_formats: 'Heading 1=h1; Heading 2=h2; Heading 3=h3; Paragraph=p;',
            images_file_types: 'jpg,jpeg,png,svg,webp',
            image_caption: true,
            block_unsupported_drop: false,
            height: '100%',
            browser_spellcheck: true,
            menubar: false,
            resize: false,
            statusbar: false,
            skin: 'oxide-dark',
            content_css: './css/styles.css'
        },
        simple: {
            license_key: 'gpl',
            plugins: 'quickbars',
            quickbars_selection_toolbar: 'undo redo | bold italic',
            quickbars_insert_toolbar: false,
            browser_spellcheck: true,
            menubar: false,
            inline: true,
            skin: 'oxide-dark',
            content_css: './css/styles.css'
        },
        lite: {
            license_key: 'gpl',
            browser_spellcheck: true,
            menubar: false,
            inline: true,
            skin: 'oxide-dark',
            content_css: './css/styles.css'
        }
    },

    /**
     * Grupo de elementos desenhados no mapa.
     * 
     * @type {L.FeatureGroup}
     */
    drawnItems: new L.FeatureGroup(),

    /**
     * Controles relacionados à interface do usuário.
     * 
     * @type {Object}
     * @property {Object|null} main - Controle principal.
     * @property {Object|null} draw - Controle de desenho no mapa.
     * @property {Object|null} grid - Controle de grid.
     * @property {MsgBox} msgBox - Instância do gerenciador de caixas de mensagem.
     * @property {LinkTooltip} tooltip - Instância do gerenciador de tooltips.
     */
    ctrls: {
        main: null,
        draw: null,
        grid: null,
        msgBox: new MsgBox(6),
        tooltip: new LinkTooltip()
    },

    /**
     * Instância do gerenciador de fila de navegação.
     * 
     * @type {NavQueue}
     */
    navQueue: new NavQueue(), // Fila de controle de navegação   

    /**
     * Função de criação de HTMLElement.1
     * 
     * @type {Function}
     */
    createElement: createElement
});

document.addEventListener('DOMContentLoaded', async () => {
    // Atalho para o Controle de Mensagens para o Usuário
    uniforge.msgBox = uniforge.ctrls.msgBox;
    // Atalho para o Controle de Tooltips de Entradas
    uniforge.tooltip = uniforge.ctrls.tooltip;

    uniforge.html.classList.add('uniforge');

    await configureData();

    configureLeaflet();

    configureTopBar();

    configureForms();

    configureHooks();
});

/** 
 * ------------------------------------------------------------------
 * FUNÇÕES DE CONFIGURAÇÕES 
 * ------------------------------------------------------------------
 * */
// Configura a ferramenta de mapas Leaflet 
async function configureData() {
    // Exemplo de uso com dados simulados
    const data = {};

    data.subjects = await uniforge.db.getAllSubjectType();
    data.categories = await uniforge.db.getAllCategory();
    data.entries = await uniforge.db.getAllEntry();
    data.events = await uniforge.db.getAllEvent();
    data.timelines = await uniforge.db.getAllTimeline();
    data.calendars = await uniforge.db.getAllCalendars();
    data.calendarsMonths = await uniforge.db.getAllCalendarsMonths();
    data.calendarsDays = await uniforge.db.getAllCalendarsDays();
    data.calendarsDaysInMonths = await uniforge.db.getAllCalendarsDaysInMonths();
    data.roots = await uniforge.db.getAllRoots();
    data._textImages = await uniforge.db.getAllTextImages();
    data.settings = await uniforge.db.getAllSettings();
    data.importances = await uniforge.db.getAllImportance();
    data.entryTypes = await uniforge.db.getAllEntryTypes();

    uniforge.doc = new DBDocuments(data);
    return uniforge.doc;
}

// Configura a ferramenta de mapas Leaflet 
function configureLeaflet() {

    // Inicializa o Mapa, ajustando a visualização com base nas coordenadas de imagem
    const map = uniforge.map;

    // Cria a camada de armazenagem das Layers do Mapa
    const drawnItems = uniforge.drawnItems;

    // Calcula os limites de imagem com base na largura/altura
    const bounds = [[0, 0], [uniforge.contants.VIEW_HEIGHT, uniforge.contants.VIEW_WIDTH]];

    map.setMaxBounds(uniforge.contants.IMG_HEIGHT, uniforge.contants.IMG_WIDTH);
    // Ajusta a visualização inicial para se ajustar aos limites da imagem
    map.fitBounds(bounds);

    // Adiciona a imagem personalizada como uma camada de tile
    uniforge.mapOverlay = L.imageOverlay('./images/map.jpg', bounds, { zIndex: 1 /* Garantir que fique atrás do Layer do Grid */ });
    uniforge.mapOverlay.addTo(map);

    // Adicionar evento de mousedown ou mousemove para capturar o clique e mover o mapa
    map.on('mousedown', function (e) {
        uniforge.clickLatLang = e.latlng;  // Ponto de clique do usuário
    });

    const scale = L.control.scale({
        imperial: false
    });
    scale.addTo(map);

    // Adicione um evento para atualizar os limites ao redimensionar ou fazer zoom no mapa
    map.on('moveend', _checkMapVisibility);
    // Grupo para armazenar as camadas desenhadas  
    map.addLayer(drawnItems);

    // Cria os Menus de Controle do Mapa.
    _createControls();

    // Evento para capturar o desenho de polígonos
    map.on('draw:created', function (e) {
        const layer = e.layer;
        const type = e.layerType;

        layer.bindPopup(type);

        drawnItems.addLayer(layer);
    });
}
// Configura os elementos da Topbar de Ferramentas
function configureTopBar() {
    const currentYearInput = document.getElementById('currentYear');
    const timeEraSpan = document.getElementById('timeEra');
    currentYearInput.value = uniforge.time.y.label;
    timeEraSpan.textContent = uniforge.time.era;
}

function calculateZoomForTileScaleSimple(desiredTileScale) {
    const tileSize = 165; // Tile size in pixels

    // Calculate the zoom level
    const zoomLevel = Math.log2(desiredTileScale / tileSize);
    return Math.round(zoomLevel); // Return the nearest zoom level
}

// Função que configura os diversos forms da aplicação
function configureForms() {
    activateMainListeners();
}

function configureHooks() {
    registerHook('beforeRenderForm', async () => { await configureData(); });
}
// Configura o listeners que tratam os eventos dos tabs do Menu Lateral e as rotinas de fechamento do Form
function activateMainListeners() {
    // Lógica de UI para o Menu Lateral
    const tabs = document.querySelectorAll('.tab');

    // Lógica de UI para o Menu de Ferramentas Superior.
    const topBar = document.getElementById('topBarContainer');
    const toggleTab = document.getElementById('toggleTab');
    // Lógica de UI para os botões do Menu de Ferramentas Superior.
    const libraryBtn = document.getElementById('libraryBtn');
    const timelineBtn = document.getElementById('timelineBtn');
    const tenYrsBack = document.getElementById('tenYearsBack');
    const oneYearBack = document.getElementById('yearBack');
    const oneYearFwr = document.getElementById('yearForward');
    const tenYrsFwr = document.getElementById('tenYearForward');

    const currentYearInput = document.getElementById('currentYear');

    toggleTab.addEventListener('click', () => {
        topBar.classList.toggle('visible');
        toggleTab.classList.toggle('visible');
    });

    libraryBtn.addEventListener('click', (event) => { onTopbarButtonClick(event); });
    timelineBtn.addEventListener('click', (event) => { onTopbarButtonClick(event); });

    tenYrsBack.addEventListener('click', (event) => { onChangeTime(event, -10); });
    oneYearBack.addEventListener('click', (event) => { onChangeTime(event, -1); });
    oneYearFwr.addEventListener('click', (event) => { onChangeTime(event, 1); });
    tenYrsFwr.addEventListener('click', (event) => { onChangeTime(event, 10); });

    currentYearInput.addEventListener('change', function (event) { onChangeTimeInput(event); });

    // Adiciona o Listener para chamar o Form correto ao clicar nos itens do menu.
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            renderForm(tab.getAttribute('data-target'));
        });
    });
}
/** 
 * ------------------------------------------------------------------
 * FUNÇÕES DE LISTENERS DOS FORMS
 * ------------------------------------------------------------------
 * */
function onTopbarButtonClick(event) {
    // Impedir que o clique no item desencadeie o clique fora do sidebar
    event.stopPropagation();
    const formContainer = document.getElementById('formContainer');
    formContainer.classList.add('fullscreen');
    const button = event.target.closest('.topbarBtn');

    renderForm(button.getAttribute('data-target'));
}

function onChangeTime(event, amount) {
    // Impedir que o clique no item desencadeie o clique fora do sidebar
    event.stopPropagation();

    _setTime(uniforge.time.y.value + amount);
}
function onChangeTimeInput(event) {
    var value = event.target.value;

    // Remove qualquer caractere que não tenha valor numérico
    value = value.replace(/(?!^-)[^0-9]/g, '').replace(/(?!^)-/g, '');

    // Se for um número atualize o Timer
    if (value) {
        _setTime(value);
    } else {
        event.target.value = uniforge.time.y.label;
    }
}

/** 
 * ------------------------------------------------------------------
 * FUNÇÕES DE CONTROLE INTERNO DA PÁGINA 
 * ------------------------------------------------------------------
 * */
// Cria os controles customizados do Leaflet
function _createControls() {
    // Inicializa o Mapa, ajustando a visualização com base nas coordenadas de imagem
    const map = uniforge.map;

    // Cria a camada de armazenagem das Layers do Mapa
    const drawnItems = uniforge.drawnItems;

    // Cria o Menu de Controle para manipulação do mapa.
    const MainControl = L.Control.extend({
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
                renderForm('layerOptions')
            });

            container.appendChild(zoomInButton);
            container.appendChild(zoomOutButton);
            container.appendChild(layerOptionsButton);

            return container;
        }
    });

    uniforge.ctrls.main = new MainControl();

    // Cria o Menu de Desenho para manipulação dos Layers no mapa.
    const CustomDrawControl = L.Control.Draw.extend({
        options: {
            position: 'topright'
        },
        edit: {
            featureGroup: drawnItems
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
    });

    uniforge.ctrls.draw = new CustomDrawControl();

    const TransparentGridLayer = L.GridLayer.extend({
        createTile: function (coords) {
            // Create a tile with transparency
            const tile = document.createElement('canvas');
            tile.width = uniforge.contants.TILE_SIZE; // Match your map's tile size
            tile.height = uniforge.contants.TILE_SIZE;
            const ctx = tile.getContext('2d');

            // Draw grid lines
            ctx.strokeStyle = 'rgba(212, 198, 148, 0.5)'; // Grid line color
            ctx.lineWidth = 1;

            // Draw horizontal and vertical grid lines
            for (let i = 0; i <= uniforge.contants.TILE_SIZE; i += 36) { // Adjust the grid cell size (36px here)
                ctx.beginPath();
                ctx.moveTo(i, 0);
                ctx.lineTo(i, uniforge.contants.TILE_SIZE);
                ctx.stroke();

                ctx.beginPath();
                ctx.moveTo(0, i);
                ctx.lineTo(uniforge.contants.TILE_SIZE, i);
                ctx.stroke();
            }

            return tile;
        },
    });

    uniforge.ctrls.grid = new TransparentGridLayer({
        tileSize: uniforge.contants.TILE_SIZE,
        opacity: 0.8, // Adjust transparency
        zIndex: 1000, // Ensure the grid is above other layers
    });

    uniforge.ctrls.grid.addTo(map);
    uniforge.ctrls.grid.bringToFront();

    // Adiciona o Menu de Controle ao Mapa.
    map.addControl(uniforge.ctrls.main);
    map.addControl(uniforge.ctrls.draw);
}
/**
 * Renderiza um formulário baseado em um ID de template
 * e o exibe na tela.
 *
 * @param {string} targetId             - O ID do formulário a ser renderizado.
 * @param {boolean} [showAfter=true]    - Indica se o formulário deve ser exibido imediatamente.
 * @returns {Promise<void>}             - Uma promessa que resolve quando o formulário for renderizado e exibido.
 * @throws {Error}                      - Se ocorrer um erro ao renderizar o formulário.
 */

async function renderForm(targetId, showAfter = true) {
    const formOverlay = document.getElementById('formOverlay');
    if (!formOverlay) {
        console.error('O elemento de overlay não foi encontrado.');
        return;
    }

    formOverlay.classList.remove('hidden');

    try {
        triggerHook('beforeRender');

        const form = _loadTemplate(targetId);
        if (!form) {
            console.error('Falha ao carregar template.');
            return;
        }

        uniforge.form = form;
        if (showAfter) await uniforge.form.showForm(true);
    } catch (error) {
        console.error('Erro ao renderizar formulário:', error);
    }
}

// JavaScript to load partials
function _loadTemplate(id) {
    try {
        let form = null;

        switch (id) {
            case 'atlas': {
                form = new AtlasForm('Atlas');
            } break;
            case 'encyclo': {
                form = new EncycloForm('Enciclopédia');
            } break;
            case 'history': {
                form = new HistoryForm('História');
            } break;
            case 'politics': {
                form = new PoliticsForm('Política');
            } break;
            case 'library': {
                form = new LibraryForm('Biblioteca');
            } break;
            case 'timeline': {
                form = new TimelineForm('Linha do Tempo');
            } break;
            case 'settings': {
                form = new SettingsForm('Configurações');
            } break;
            default: break;
        }

        return form;
    } catch (error) {
        console.error('Ocorreu um erro:', error);
        return null;
    }
}

function _setTime(year) {
    const currentYearInput = document.getElementById('currentYear');
    const timeEraSpan = document.getElementById('timeEra');

    // Armazena o valor antigo do Ano
    const oldValue = uniforge.time.y.value;

    uniforge.time.y.value = Number(year);
    // Não existe ano 0, salte ou para 1 ou para -1
    if (uniforge.time.y.value == 0) {
        if (uniforge.time.y.value > oldValue) { // O ano está avançando
            uniforge.time.y.value = 1;
        } else { // O ano está retroagindo
            uniforge.time.y.value = -1;
        }
    }
    uniforge.time.y.label = (Math.abs(uniforge.time.y.value)).toString();

    // Altera a era para antes da Tríade dos Heróis (ano negativo) ou depois da Tríade (ano positivo)
    uniforge.time.era = (uniforge.time.y.value > 0 ? 'd.T.' : 'a.T.');

    currentYearInput.value = uniforge.time.y.label;
    timeEraSpan.textContent = uniforge.time.era;
}

// Calcular os limites baseados na posição e zoom atual
function _checkMapVisibility() {
    // Inicializa o Mapa, ajustando a visualização com base nas coordenadas de imagem
    const map = uniforge.map;

    var mapBounds = map.getBounds(); // Obtém os limites da área visível do mapa
    var imageBounds = uniforge.mapOverlay.getBounds(); // Obtém os limites da uniforge.mapOverlay

    // Calculando os 8 pontos ao redor da uniforge.mapOverlay
    var points = _getWatcherPoints(imageBounds, 0.85); // 25% de padding  
    var isVisible = mapBounds.intersects(points);

    // Se nenhum ponto da uniforge.mapOverlay estiver visível, ajustar a posição do mapa
    if (!isVisible) {

        // Encontrar o ponto mais próximo do centro da tela
        var closestPoint = points[0];
        var closestDistance = map.distance(uniforge.clickLatLang, points[0]);

        points.forEach(function (point) {
            var distance = map.distance(uniforge.clickLatLang, point);
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

// Função para calcular os pontos ao redor da uniforge.mapOverlay com um padding (0.0 a 1.0)
function _getWatcherPoints(bounds, paddingRatio) {
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
// Função para calcular a quantidade de pontos com base na precisão e no tamanho da uniforge.mapOverlay
function _calculatePrecision(bounds) {
    const southWest = bounds.getSouthWest();
    const northEast = bounds.getNorthEast();

    // Calculando a diferença de latitude e longitude
    const latDiff = northEast.lat - southWest.lat;
    const lngDiff = northEast.lng - southWest.lng;

    // Calculando a quantidade mínima de pontos para cobrir a uniforge.mapOverlay
    const totalArea = latDiff * lngDiff;  // Área da uniforge.mapOverlay
    const desiredPoints = Math.max(uniforge.contants.MIN_POINTS, Math.sqrt(totalArea) * 100); // Ajuste para gerar pelo menos 1000 pontos

    // Determinando o número de pontos para latitude e longitude
    const latPoints = Math.ceil(Math.sqrt(desiredPoints * (latDiff / totalArea)));
    const lngPoints = Math.ceil(Math.sqrt(desiredPoints * (lngDiff / totalArea)));

    return { latPoints, lngPoints };
}

// Função para criar um elemento com classes e atributos
function createElement(tag, attributes = {}, children = []) {
    const element = document.createElement(tag);

    // Adiciona os atributos ao elemento
    for (const [key, value] of Object.entries(attributes)) {
        if (key === 'class') {
            element.className = value;
        } else {
            element.setAttribute(key, value);
        }
    }

    // Adiciona os filhos ao elemento
    children.forEach(child => {
        if (typeof child === 'string') {
            element.appendChild(document.createTextNode(child));
        } else {
            element.appendChild(child);
        }
    });

    return element;
}