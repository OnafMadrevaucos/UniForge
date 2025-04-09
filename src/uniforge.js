import MsgBox from "./models/msgBox.js";

import { LinkTooltip } from "./scripts/linkTooltip.js";
import { NavQueue } from "./scripts/navQueue.js";
import { registerHook, triggerHook } from "./scripts/hooks.js";

import DBManager from "./db/dbManager.js";
import DBDocuments from "./db/dbDocuments.js";

import * as esm from "./common/uniforge-esm.mjs";

// Adiciona as propriedades restantes ao objeto uniforge.
uniforge.utils.mergeObjects(uniforge, {
    /**
     * Constantes usadas pela aplicação.
    */
    constants: {
        leaflet: uniforge.leaflet.core.constants
    },

    /**
     * Instância do gerenciador de banco de dados.
     * @type {DBManager}
     */
    db: new DBManager(),

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
            toolbar: 'undo redo | blocks | bold italic backcolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | entryLink blockquote sendImage | addLoremIpsum',
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
        readonly: {
            editable_class: 'editable',
            noneditable_class: 'non-editable',
            body_class: 'non-editable',
            license_key: 'gpl',
            plugins: ['anchor', 'autolink', 'codesample', 'link', 'lists', 'searchreplace', 'table', 'visualblocks', 'image'],
            toolbar: false,
            block_formats: 'Heading 1=h1; Heading 2=h2; Heading 3=h3; Paragraph=p;',
            images_file_types: 'jpg,jpeg,png,svg,webp',
            image_caption: true,
            block_unsupported_drop: false,
            height: '100%',
            menubar: false,
            resize: false,
            statusbar: false,
            skin: 'oxide-dark',
            content_css: './css/styles.css',
            readonly: true,
            disable_focus: true
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
    * Instância do mapa usando o Leaflet com configurações específicas.
    * 
    * @type {L.Map}
    */
    map: uniforge.leaflet.core.map,    

    /**
    * Grupo de elementos desenhados no mapa.
    * 
    * @type {L.FeatureGroup}
    * 
    */
    mapElements: uniforge.leaflet.draw.mapElements,

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
        leaflet: {
            main: null,
            draw: null,
            grid: null
        },
        msgBox: new MsgBox(6),
        tooltip: new LinkTooltip()
    },

    /**
     * Instância do gerenciador de fila de navegação.
     * 
     * @type {NavQueue}
     */
    navQueue: new NavQueue(), // Fila de controle de navegação   

    lineageEditor: {
        props: {
            nameProperty: 'name',
            genderProperty: 'gender',
            statusProperty: 'status',
            countProperty: 'count'
        },
        theme: {
            colors: {
                femaleBadgeBackground: '#FFCBEA',
                maleBadgeBackground: '#A2DAFF',
                femaleBadgeText: '#7A005E',
                maleBadgeText: '#001C76',
                kingQueenBorder: '#FEBA00',
                princePrincessBorder: '#679DDA',
                civilianBorder: '#58ADA7',
                personText: '#383838',
                personNodeBackground: '#FFFFFF',
                selectionStroke: '#485670',
                counterBackground: '#485670',
                counterBorder: '#FFFFFF',
                counterText: '#FFFFFF',
                link: '#686E76'
            },
            fonts: {
                badgeFont: 'bold 12px Poppins',
                birthDeathFont: '14px Poppins',
                nameFont: '500 18px Poppins',
                counterFont: '14px Poppins'
            }
        },
        constants: {
            STROKE_WIDTH: 3,
            CORNER_ROUNDNESS: 12,
            IMAGE_TOP_MARGIN: 20,
            IMAGE_DIAMETER: 40
        }
    }
});

// Realiza as configurações iniciais da aplicação ao carregar o conteúdo do DOM.
document.addEventListener('DOMContentLoaded', async () => {
    // Configura o estado inicial da aplicação, se ele ainda não foi criado.
    uniforge.state.init();

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

    checkState();
});

// Limpa o armazenamento local ao fechar a janela.
window.addEventListener("beforeunload", () => {
    const json = localStorage.getItem('uniforge');
    const state = JSON.parse(json);
    if (!state.keep) uniforge.state.clear();
});


/** 
 * ------------------------------------------------------------------
 * FUNÇÕES DE CHECAGEM
 * ------------------------------------------------------------------
 * */
function checkState() {
    const currentState = uniforge.state.current();
}
/** 
 * ------------------------------------------------------------------
 * FUNÇÕES DE CONFIGURAÇÕES 
 * ------------------------------------------------------------------
 * */
// Configura a ferramenta de mapas Leaflet 
async function configureData() {
    const data = await DBDocuments.UniForgeData();
    uniforge.doc = new DBDocuments(data);
    return uniforge.doc;
}

// Configura a ferramenta de mapas Leaflet 
function configureLeaflet() {

    // Inicializa o Mapa, ajustando a visualização com base nas coordenadas de imagem
    const map = uniforge.map;

    // Cria a camada de armazenagem das Layers do Mapa
    const mapElements = uniforge.mapElements;

    // Calcula os limites de imagem com base na largura/altura
    const bounds = [[0, 0], [uniforge.constants.leaflet.VIEW_HEIGHT, uniforge.constants.leaflet.VIEW_WIDTH]];

    map.setMaxBounds(uniforge.constants.leaflet.IMG_HEIGHT, uniforge.constants.leaflet.IMG_WIDTH);
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
    map.addLayer(mapElements);

    // Cria os Menus de Controle do Mapa.
    _createControls();

    // Evento para capturar o desenho de polígonos
    map.on('draw:created', function (e) {
        const layer = e.layer;
        const type = e.layerType;

        layer.bindPopup(type);

        mapElements.addLayer(layer);
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

// Função que configura os diversos forms da aplicação.
function configureForms() {
    configureBody();

    activateMainListeners();    
}
function configureBody() {
    const body = uniforge.html;
    const preparedBody = uniforge.parser.parseHTML(body.innerHTML, {});
    body.innerHTML = preparedBody;
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
            tab.classList.add('disabled');
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
    const mapElements = uniforge.mapElements;

    // Cria o Menu de Controle para manipulação do mapa.
    const MainControl = L.Control.extend(uniforge.leaflet.core.MainControlConfig);

    uniforge.ctrls.main = new MainControl();

    // Cria o Menu de Desenho para manipulação dos Layers no mapa.
    const CustomDrawControl = L.Control.Draw.extend(uniforge.leaflet.draw.CustomDrawControlConfig);
    CustomDrawControl.edit = {
        featureGroup: uniforge.mapElements
    };

    uniforge.ctrls.draw = new CustomDrawControl();

    const TransparentGridLayer = L.GridLayer.extend(uniforge.leaflet.grid.GridLayerConfig);

    uniforge.ctrls.grid = new TransparentGridLayer({
        tileSize: uniforge.constants.leaflet.TILE_SIZE,
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
    try {
        await triggerHook('beforeRender');

        const form = _loadTemplate(targetId);
        if (!form)
            throw new Error(`O template para o formulário '${targetId}' não foi encontrado.`);

        if (showAfter) await form.showForm(true);
    } catch (error) {
        uniforge.msgBox.showError(error.message);
    }
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

async function recoverForm(form) {
    try {
        await triggerHook('beforeRender');
        if (!form) throw new Error(`O formulário '${form}' não foi encontrado.`);

        await form.showForm(true);
    } catch (error) {
        uniforge.msgBox.showError(error.message);
    }
}

// JavaScript to load partials
function _loadTemplate(id) {
    try {
        // Verifica o ID do template e carrega o formulário correspondente.
        const form = new uniforge.forms[id]();
        return form;
    } catch (error) {
        throw new Error(`O formulário do identificador '${id}' não foi carregado corretamente. Detalhes: ${error}`);
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
    const desiredPoints = Math.max(uniforge.constants.leaflet.MIN_POINTS, Math.sqrt(totalArea) * 100); // Ajuste para gerar pelo menos 1000 pontos

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