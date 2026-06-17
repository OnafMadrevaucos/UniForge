import MsgBox from "./models/msgBox.js";

import { LinkTooltip } from "./scripts/linkTooltip.js";
import { registerHook, triggerHook } from "./scripts/hooks.js";

import DBManager from "./db/dbManager.js";
import DBDocuments from "./db/dbDocuments.js";

import * as esm from "./common/uniforge-esm.mjs";
import lControl from "./common/leaflet/core.mjs";
import PDFManager from "./scripts/managers/pdfManager.js";
import { set } from "./common/primitives/set.mjs";
import Slider from "./models/slider.js";
import ColorPicker from "./models/colorPicker.js";

// Configura o tema salvo no localStorage antes de inicializar o app para evitar flash de estilo
document.documentElement.setAttribute('data-theme', localStorage.getItem('uniforge_theme') || 'theme-medieval');

// Realiza as configurações iniciais da aplicação ao carregar o conteúdo do DOM.
document.addEventListener('DOMContentLoaded', async () => {
    const cssname = await uniforge.path.join('css/styles.css');

    // Adiciona as propriedades restantes ao objeto uniforge.
    uniforge.utils.mergeObjects(uniforge, {
        /**
         * Constantes usadas pela aplicação.
         * @type {Object}
         * @property {string} APP_NAME - O nome da aplicação.
         * @property {string} APP_VERSION - A versão atual da aplicação.
         * @property {string} CSS_NAME - O nome do arquivo CSS usado pela aplicação.
         * @property {Object} leaflet - Constantes relacionadas ao controle de mapas Leaflet.     
        */
        constants: Object.freeze({
            APP_NAME: 'UniForge',
            APP_VERSION: '0.8.9',
            CSS_NAME: cssname,
            leaflet: lControl.constants,
        }),

        /**
         * Strings usadas pela aplicação.
         * @type {Object}
         * @property {string} emptyString - String vazia padrão, usada para evitar várias definições de string vazias.
        */
        defaults: Object.freeze({
            emptyString: '',
        }),

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
         * @property {Object|null} readonly - Opção de somente leitura.
         * @property {Object|null} simple   - Opção simplificada.
         * @property {Object|null} lite     - Opção sem botões do TinyMCE.
         */
        tinymceOptions: Object.freeze({
            default: {
                editable_class: 'editable',
                body_class: 'main-editor',
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
                content_css: cssname,
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
                content_css: cssname,
                readonly: true,
                disable_focus: true
            },
            simple: {
                body_class: 'simple-editor',
                license_key: 'gpl',
                plugins: 'quickbars',
                quickbars_selection_toolbar: 'undo redo | bold italic',
                quickbars_insert_toolbar: false,
                browser_spellcheck: true,
                menubar: false,
                inline: true,
                skin: 'oxide-dark',
                content_css: cssname,
            },
            lite: {
                body_class: 'lite-editor',
                license_key: 'gpl',
                browser_spellcheck: true,
                menubar: false,
                inline: true,
                skin: 'oxide-dark',
                content_css: cssname,
            }
        }),

        /**
         * Instância do gerenciador de PDFs.
         * 
         * @type {PDFManager}
        */
        pdf: new PDFManager(),

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
            leaflet: null,
            msgBox: new MsgBox(6),
            tooltip: new LinkTooltip(),
            progressDialog: null,
            marker: null,
            sliders: {
                shapeSizeSlider: null
            },
            colorPickers: {
                fillColorPicker: null,
                borderColorPicker: null
            }
        },

        lineageEditor: Object.freeze({
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
        }),
        markerToolBar: Object.freeze({
            constants: {
                colors: {
                    red: {
                        label: 'Vermelho',
                        value: [255, 0, 0]
                    },
                    blue: {
                        label: 'Azul',
                        value: [0, 0, 255]
                    },
                    green: {
                        label: 'Verde',
                        value: [0, 255, 0]
                    },
                    yellow: {
                        label: 'Amarelo',
                        value: [255, 255, 0]
                    },
                    purple: {
                        label: 'Roxo',
                        value: [128, 0, 128]
                    },
                    orange: {
                        label: 'Laranja',
                        value: [255, 165, 0]
                    },
                    black: {
                        label: 'Preto',
                        value: [0, 0, 0]
                    },
                    white: {
                        label: 'Branco',
                        value: [255, 255, 255]
                    }
                }
            }
        }),
        shapesToolBar: Object.freeze({
            constants: {
                lineTypes: {
                    solid: {
                        _id: 'solid',
                        _label: 'Sólida',
                        style: {
                            line: 'solid',
                            dashArray: '0, 0'
                        }
                    },
                    short_dashed: {
                        _id: 'short_dashed',
                        _label: 'Traçado Curto',
                        style: {
                            line: 'dashed',
                            dashArray: '5, 5'
                        }
                    },
                    dashed: {
                        _id: 'dashed',
                        _label: 'Traçado',
                        style: {
                            line: 'dashed',
                            dashArray: '5, 10'
                        }
                    },
                    long_dashed: {
                        _id: 'long_dashed',
                        _label: 'Traçado Longo',
                        style: {
                            line: 'dashed',
                            dashArray: '15, 20'
                        }
                    },
                }
            }
        })
    });

    // Configura o estado inicial da aplicação, se ele ainda não foi criado.
    uniforge.state.init();

    // Inicia o gerenciador de banco de dados.
    uniforge.db.init();    

    // Atalho para o Controle de Mensagens para o Usuário
    uniforge.msgBox = uniforge.ctrls.msgBox;
    // Atalho para o Controle de Tooltips de Entradas
    uniforge.tooltip = uniforge.ctrls.tooltip;

    uniforge.html.classList.add('uniforge');

    await refreshDocuments();

    // Atalho para o gerenciador de configurações do sistema.
    uniforge.settings = uniforge.doc.settings;

    await configureURLs();

    parseBody();

    await configureToolsBars();

    configureForms();

    configureHooks();

    checkState();    

    await configureLeaflet();

    configureMapTiler();
});

// Inicia o gerenciador de tooltips.
uniforge.tooltip.init();

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
function parseBody() {
    uniforge.html.innerHTML = uniforge.parser.parseHTML(uniforge.html.innerHTML, { lineTypes: uniforge.shapesToolBar.constants.lineTypes });
}


// Recarrega os documentos do banco de dados.
async function refreshDocuments() {
    const data = await DBDocuments.UniForgeData();
    uniforge.doc = new DBDocuments(data);
    return uniforge.doc;
}

async function configureURLs() {
    const worldMap = uniforge.doc.settings.get('leaflet.mainMap');

    /**
    * @description Urls padrões usadas pelo sistema.
    * 
    * @type {Object}
    * @property {string} background - Imagem utilizada como fundo das entradas da Biblioteca e das Timelines.
    * @property {string} blankImg   - Imagem padrão usada para campos de imagem vazios.
    * 
    * @property {string} models - Diretório dos Forms e Dialogs usados pelo sistema.
    * @property {string} templates - Diretório dos modelos HTML usados pelo sistema.
    * @property {string} scripts - Diretório de scripts usados pelo sistema.
    * @property {string} ui - Diretório de Imagens utilizadas pelo ui do sistema.
    * @property {string} icons - Diretório de Ícones utilizadas pelo ui do sistema.
    */
    uniforge.urls = {
        relativePath: {
            background: '/ui/lib-background.png',
            blankImg: '/ui/blank-image.svg',
            worldMap: worldMap ? `/${worldMap}/tiles` : null,
            mapOverlays: worldMap ? `/${worldMap}/overlays` : null,
            common: '/common/',
            models: '/models/',
            templates: '/templates/',
            scripts: '/scripts/',
            data: '/data/',
            ui: '/ui/',
            icons: '/ui/icons/',
            signs: '/ui/icons/markers/signs/',
            markers: '/ui/icons/markers/',
        },
    };

    uniforge.urls = uniforge.utils.mergeObjects(uniforge.urls, {

        // Urls de Imagens padrão usadas pelo sistema.
        background: await uniforge.path.join(uniforge.urls.relativePath.background),
        blankImg: await uniforge.path.join(uniforge.urls.relativePath.blankImg),

        worldMap: await uniforge.path.join(uniforge.urls.relativePath.worldMap),
        mapOverlays: await uniforge.path.join(uniforge.urls.relativePath.mapOverlays),

        // Urls de Diretórios usados pelo sistema.
        common: await uniforge.path.join(uniforge.urls.relativePath.common),
        models: await uniforge.path.join(uniforge.urls.relativePath.models),
        templates: await uniforge.path.join(uniforge.urls.relativePath.templates),
        scripts: await uniforge.path.join(uniforge.urls.relativePath.scripts),
        data: await uniforge.path.join(uniforge.urls.relativePath.data),
        ui: await uniforge.path.join(uniforge.urls.relativePath.ui),
        icons: await uniforge.path.join(uniforge.urls.relativePath.icons),
        signs: await uniforge.path.join(uniforge.urls.relativePath.signs),
        markers: await uniforge.path.join(uniforge.urls.relativePath.markers),
    });

    Object.freeze(uniforge.urls);
}

// Configura a ferramenta de mapas Leaflet.
async function configureLeaflet() {
    /* 
        TODO: Verificar se o usuário informou um mapa padrão alternativo no painel de configuração.
    */

    // Inicializa o controle de mapas Leaflet.
    uniforge.ctrls.leaflet = lControl.init(uniforge.urls.worldMap);

    const style = JSON.parse(uniforge.doc.settings.get('leafletStyle.pathOptions'));
    style.line = uniforge.shapesToolBar.constants.lineTypes[style.line].style.line;
    style.dashArray = uniforge.shapesToolBar.constants.lineTypes[style.line].style.dashArray;

    const hasBorder = style.opacity === 1;

    const hasBorderCheck = document.querySelector('#hasBorderSwitch #checkbox'); 
    hasBorderCheck.checked = hasBorder;    

    const shapeSizeSlider = uniforge.ctrls.sliders.shapeSizeSlider;    
    shapeSizeSlider.setValue(style.weight, true);

    const shapeBorderCombo = document.getElementById('shapeBorderCombo');
    shapeBorderCombo.value = style.line;

    shapeBorderCombo.dispatchEvent(new Event('change'));

    const fillColorPicker = uniforge.ctrls.colorPickers.fillColorPicker;
    fillColorPicker.setColor(style.fillColor, true);

    const borderColorPicker = uniforge.ctrls.colorPickers.borderColorPicker;    
    borderColorPicker.setColor(style.color, true);    

    uniforge.leaflet.drawStyle.update(uniforge.leaflet.core.default.map, style);

    await refreshPreviewStyle();
}
// Configura a ferramenta de geração de map tiles.
function configureMapTiler() {
    uniforge.tiler.emitProgress(async (data) => await updateProgressDialog(data));
}
// Atualiza o dialog conforme eventos.
async function updateProgressDialog(data) {
    const progressDialog = uniforge.ctrls.progressDialog;

    if (!progressDialog) return;

    if (data.type === "start") {
        progressDialog.updateMessage("Iniciando...");
        return;
    }

    if (data.type === "tile-progress") {
        progressDialog.indeterminate = false;
        progressDialog.updateProgress(data, `Gerando tiles do zoom ${data.zoom}... (${data.processed}/${data.total})`);
        return;
    }

    if (data.type === "zoom-done") {
        progressDialog.updateMessage(`Nível de zoom ${data.zoom} concluído.`);
        return;
    }

    if (data.type === "complete") {
        progressDialog.close();
        uniforge.msgBox.showInfo("Map tiles gerados com sucesso.");
        return;
    }
}
// Configura os elementos da Topbar de Ferramentas
async function configureToolsBars() {
    const currentYearInput = document.getElementById('currentYear');
    const timeEraSpan = document.getElementById('timeEra');
    currentYearInput.value = uniforge.time.y.label;
    timeEraSpan.textContent = uniforge.time.era;

    const signsPath = uniforge.urls.relativePath.signs;
    const signs = await uniforge.fs.listFiles(signsPath);

    uniforge.ctrls.currentMarkerIcon = 'blue_battle.svg';

    const hasBorderSwitch = document.querySelector("#hasBorderSwitch");
    hasBorderSwitch.dataset.tooltip = "Ativar contorno.";

    const mapMarkersContainer = document.querySelector('.map-objects-container.marker div');

    const markersOptions = mapMarkersContainer.querySelector('.options.marker');
    signs.forEach(s => {
        const name = s.name.split('.')[0];
        const img = document.createElement('img');
        img.src = '.' + s.path;

        const option = createElement('a', { 'data-marker': name, 'class': 'marker-option' }, [img]);
        markersOptions.appendChild(option);
    });

    const colorOptions = mapMarkersContainer.querySelector('.options.color');
    const colors = uniforge.markerToolBar.constants.colors;
    Object.entries(colors).forEach(([key, color]) => {
        const option = createElement('a', { 'data-color': key, 'class': 'color-option' });
        option.style.backgroundColor = `rgb(${color.value.join(',')})`;

        colorOptions.appendChild(option);
    });
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
    registerHook('beforeRender', async () => { await refreshDocuments(); });
    registerHook('simpleEntryFormClosed', async () => {
        await refreshDocuments();
        console.log('simpleEntryFormClosed');
    });
}
// Configura o listeners que tratam os eventos dos tabs do Menu Lateral e as rotinas de fechamento do Form
function activateMainListeners() {
    // Lógica para seleção de temas
    const themeSelector = document.getElementById('themeSelector');
    if (themeSelector) {
        const savedTheme = localStorage.getItem('uniforge_theme') || 'theme-medieval';
        themeSelector.value = savedTheme;
        themeSelector.addEventListener('change', (event) => {
            const selectedTheme = event.target.value;
            document.documentElement.setAttribute('data-theme', selectedTheme);
            localStorage.setItem('uniforge_theme', selectedTheme);
        });
    }

    // Lógica de UI para o Menu Lateral
    const tabs = document.querySelectorAll('.tab');

    // Lógica de UI para o Menu de Ferramentas Superior.
    const topBar = document.getElementById('topBarContainer');
    const toggleTab = document.getElementById('toggleTab');
    // Lógica de UI para os botões do Menu de Ferramentas Superior.
    const codexBtn = document.getElementById('codexBtn');
    const timelineBtn = document.getElementById('timelineBtn');
    const tenYrsBack = document.getElementById('tenYearsBack');
    const oneYearBack = document.getElementById('yearBack');
    const oneYearFwr = document.getElementById('yearForward');
    const tenYrsFwr = document.getElementById('tenYearForward');

    const currentYearInput = document.getElementById('currentYear');

    toggleTab.addEventListener('click', (event) => { onToggleTopBarClick(event); });

    codexBtn.addEventListener('click', (event) => { onTopbarButtonClick(event); });
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

    const searchLayerObjectsInput = document.querySelector("#searchLayerObjectsInput");
    searchLayerObjectsInput.addEventListener('input', (event) => { onObjectsSearchChange(event); });

    const clearLayerObjectsSearchButton = document.querySelector("#clearLayerObjectsSearchButton");
    clearLayerObjectsSearchButton.addEventListener('click', (event) => { onClearObjectsSearchClick(event); });

    const searchMarkerInput = document.querySelector("#searchMarkerInput");
    searchMarkerInput.addEventListener('input', (event) => { onMarkerSearchChange(event); });

    const clearMarkerSearchButton = document.querySelector("#clearMarkerSearchButton");
    clearMarkerSearchButton.addEventListener('click', (event) => { onClearMarkerSearchClick(event); });

    const baseOptions = document.querySelectorAll('.map-objects-panel .config-group .options a');
    baseOptions.forEach(option => {
        option.addEventListener('click', (event) => { onMarkerIconClick(event); });
    });

    const toggleShapesPanel = document.getElementById('toggleShapesPanel');
    toggleShapesPanel.addEventListener('click', (event) => { onToggleShapesPanelClick(event); });

    const hasBorderSwitch = document.querySelector('#hasBorderSwitch');
    const hasBorderCheckbox = hasBorderSwitch.querySelector('#checkbox');

    hasBorderCheckbox.addEventListener('change', (event) => { onHasBorderSwitchChange(event); });

    const shapeSizeSliderContainer = document.querySelector('.options.size');
    const shapeSizeSlider = uniforge.ctrls.sliders.shapeSizeSlider = new Slider('shapeSizeSlider', shapeSizeSliderContainer, { min: 1, max: 10, value: 5, linkedLabel: 'shapeSizeSpan', labelMask: '{value}px' });
    shapeSizeSlider.config();
    shapeSizeSlider.addEventListener('change', (event) => { onShapeSizeSliderChange(event); });

    const shapeBorderCombo = document.getElementById('shapeBorderCombo');
    shapeBorderCombo.addEventListener('change', (event) => { onShapeBorderComboChange(event); });

    const fillColorPicker = uniforge.ctrls.colorPickers.fillColorPicker = new ColorPicker('fillColorPicker', document, { value: 'var(--red)', alpha: 0.5, tooltip: 'Cor do Preenchimento', fixedAlpha: true });
    fillColorPicker.config();
    fillColorPicker.addEventListener('change', (event) => { onFillColorPickerChange(fillColorPicker); });

    const borderColorPicker = uniforge.ctrls.colorPickers.borderColorPicker = new ColorPicker('borderColorPicker', document, { value: 'var(--dark-red)', tooltip: 'Cor da Borda' });
    borderColorPicker.config();

    borderColorPicker.addEventListener('change', (event) => { onBorderColorPickerChange(borderColorPicker); });
}
/** 
 * ------------------------------------------------------------------
 * FUNÇÕES DE LISTENERS DOS FORMS
 * ------------------------------------------------------------------
 * */
function onTopbarButtonClick(event) {
    // Impedir que o clique no item desencadeie o clique fora do sidebar
    event.stopPropagation();
    const button = event.target.closest('.topbarBtn');
    button.classList.add('disabled');

    renderForm(button.getAttribute('data-target'));
}

function onToggleTopBarClick(event) {
    event.stopPropagation();

    const toggleTab = event.target.closest('.toggle-tab');
    const topBar = document.getElementById('topBarContainer');

    topBar.classList.toggle('visible');
    toggleTab.classList.toggle('visible');
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

function onObjectsSearchChange(event) {
    event.stopPropagation();
    const input = event.currentTarget;
    // Padroniza e remove espaços em branco do filtro para melhorar a busca.
    const filter = input.value.trim().toLowerCase();

    // Obtém todas os items de Objetos do Mapa.
    const objectsItems = document.querySelectorAll('#mapElementsList li');
    objectsItems.forEach(item => {
        const span = item.querySelector('.layer-item-content span');
        if (span) {
            const title = span.textContent.toLowerCase();
            // Se o filtro estiver vazio ou a opção contém o filtro, mostra a opção.
            if (filter.isEmpty() || title.includes(filter)) {
                item.classList.remove('hidden');
            }
            // Senão, esconde a opção. 
            else {
                item.classList.add('hidden');
            }
        }
    });
}

function onMarkerSearchChange(event) {
    event.stopPropagation();
    const input = event.currentTarget;
    // Padroniza e remove espaços em branco do filtro para melhorar a busca.
    const filter = input.value.trim().toLowerCase();

    // Obtém todas as opções de marcadores.
    const markersOptions = mapMarkersContainer.querySelectorAll('.options.marker a');
    markersOptions.forEach(option => {
        // Se o filtro estiver vazio ou a opção contém o filtro, mostra a opção.
        if (filter.isEmpty() || option.dataset.marker.includes(filter)) {
            option.classList.remove('hidden');
        }
        // Senão, esconde a opção. 
        else {
            option.classList.add('hidden');
        }
    });
}

function onClearObjectsSearchClick(event) {
    event.stopPropagation();
    const input = document.querySelector('#searchLayerObjectsInput');

    // Limpa o input de busca.
    input.value = uniforge.defaults.emptyString;

    // Obtém todas os items de Objetos do Mapa.
    const objectsItems = document.querySelectorAll('#mapElementsList li');
    // Mostra todas as opções de Objetos.
    objectsItems.forEach(item => {
        item.classList.remove('hidden');
    });
}
function onClearMarkerSearchClick(event) {
    event.stopPropagation();
    const input = toolsSearchBar.querySelector('#searchMarkerInput');

    // Limpa o input de busca.
    input.value = uniforge.defaults.emptyString;

    // Obtém todas as opções de marcadores.
    const markersOptions = mapMarkersContainer.querySelectorAll('.options.marker a');
    // Mostra todas as opções de marcadores.
    markersOptions.forEach(option => {
        option.classList.remove('hidden');
    });
}

async function onMarkerIconClick(event) {
    event.stopPropagation();
    const option = event.currentTarget;

    option.classList.toggle('active');

    const signMarker = document.querySelector('.map-objects-panel .config-group .options.marker .active');
    const colorMarker = document.querySelector('.map-objects-panel .config-group .options.color .active');

    const options = option.parentElement.querySelectorAll('a');
    options.forEach(opt => {
        if (opt !== option) {
            opt.classList.remove('active');
        }
    });

    if (signMarker && colorMarker) {
        const marker = `${colorMarker.getAttribute('data-color')}_${signMarker.getAttribute('data-marker')}`;
        await startMarkerDrawing(marker);
    }
    else if (uniforge.ctrls.marker) uniforge.ctrls.marker.disable();
}

function onToggleShapesPanelClick(event) {
    event.stopPropagation();
    const mapShapesContainer = document.querySelector('.map-objects-container.regular-shapes');

    mapShapesContainer.classList.toggle('active');
}

async function onHasBorderSwitchChange(event) {
    const hasBorder = event.target.checked;

    const hasBorderSwitch = document.querySelector('#hasBorderSwitch');
    const sliderSwitchContainer = uniforge.ctrls.sliders.shapeSizeSlider.element.closest('.options.size');

    if (hasBorder) {
        sliderSwitchContainer.classList.remove('hidden');
        hasBorderSwitch.dataset.tooltip = "Desativar contorno.";

        uniforge.leaflet.drawStyle.style.opacity = 1;
    }
    else {
        sliderSwitchContainer.classList.add('hidden');
        hasBorderSwitch.dataset.tooltip = "Ativar contorno.";

        uniforge.leaflet.drawStyle.style.opacity = 0;        
    }

    uniforge.leaflet.drawStyle.update(uniforge.leaflet.core.default.map, uniforge.leaflet.drawStyle.style);
    
    await refreshPreviewStyle();
}

async function onShapeSizeSliderChange(event) {
    const preview = uniforge.shapesToolBar.preview;

    const size = uniforge.ctrls.sliders.shapeSizeSlider.getValueNumber();
    uniforge.leaflet.drawStyle.style.weight = size;

    uniforge.leaflet.drawStyle.update(uniforge.leaflet.core.default.map, uniforge.leaflet.drawStyle.style);

    await refreshPreviewStyle();  
}

async function onShapeBorderComboChange(event) {
    const preview = uniforge.shapesToolBar.preview;

    const lineTypes = uniforge.shapesToolBar.constants.lineTypes;
    const style = lineTypes[event.target.value].style;

    uniforge.leaflet.drawStyle.style = {
        ...uniforge.leaflet.drawStyle.style,
        ...style,
    }

    uniforge.leaflet.drawStyle.update(uniforge.leaflet.core.default.map, uniforge.leaflet.drawStyle.style);

    await refreshPreviewStyle();
}

async function onFillColorPickerChange(picker) {
    uniforge.leaflet.drawStyle.style.fillColor = picker.value;
    uniforge.leaflet.drawStyle.style.fillOpacity = picker.alpha;

    uniforge.leaflet.drawStyle.update(uniforge.leaflet.core.default.map, uniforge.leaflet.drawStyle.style);  
    
    await refreshPreviewStyle();
}

async function onBorderColorPickerChange(picker) {
    const preview = uniforge.shapesToolBar.preview;

    uniforge.leaflet.drawStyle.style.color = picker.value;
    uniforge.leaflet.drawStyle.style.opacity = picker.alpha;

    uniforge.leaflet.drawStyle.update(uniforge.leaflet.core.default.map, uniforge.leaflet.drawStyle.style);

    await refreshPreviewStyle();
}

/** 
 * ------------------------------------------------------------------
 * FUNÇÕES DE CONTROLE INTERNO DA PÁGINA 
 * ------------------------------------------------------------------
 * */
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
        const form = new uniforge.forms[targetId]();
        if (!form)
            throw new Error(`O template para o formulário '${targetId}' não foi encontrado.`);

        if (showAfter) await form.show(true);
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
        if (!form) throw new Error(`O formulário '${form}' não foi encontrado.`);
        await form.show(true);
    } catch (error) {
        uniforge.msgBox.showError(error.message);
    }
}

async function startMarkerDrawing(marker) {
    const map = uniforge.leaflet.core.default.map;
    const markerURL = uniforge.urls.markers.join(`${marker}.png`);

    // O controlador de Marker já está ativo. 
    if (uniforge.ctrls.marker) uniforge.ctrls.marker.disable();

    // Ativa o controle de posicionamento de Markers.
    uniforge.ctrls.marker = uniforge.leaflet.drawer.marker(map, markerURL);
};

async function refreshPreviewStyle() {
    const preview = document.querySelector('.regular-shapes .config-group.preview .shape-canvas .shape-preview');
    if (!preview) return;

    const hasBorderCheck = document.querySelector('#hasBorderSwitch #checkbox'); 

    const style = uniforge.leaflet.drawStyle.style;
    const lineTypes = uniforge.shapesToolBar.constants.lineTypes;

    // Obtém o tipo de linha correto baseado no estado atual
    const lineStyle = style.line ? lineTypes[style.line].style.line : style.line;

    preview.style.backgroundColor = style.fillColor;

    const shapeBorderCombo = document.getElementById('shapeBorderCombo');
    
    if(hasBorderCheck.checked) 
        preview.style.border = `${style.weight}px ${lineStyle} ${style.color}`;        
     else 
        preview.style.border = 'none';    

    shapeBorderCombo.disabled = !hasBorderCheck.checked;
    uniforge.ctrls.colorPickers.borderColorPicker.disabled = !hasBorderCheck.checked;
    uniforge.ctrls.sliders.shapeSizeSlider.setVisible(hasBorderCheck.checked, true);

    await uniforge.settings.set('leafletStyle.pathOptions', JSON.stringify(uniforge.leaflet.drawStyle.style));
}

function _setTime(year) {
    const currentYearInput = document.getElementById('currentYear');
    const timeEraSpan = document.getElementById('timeEra');

    // Armazena o valor antigo do Ano.
    const oldValue = uniforge.time.y.value;

    uniforge.time.y.value = Number(year);
    // Não existe ano 0, salte ou para 1 ou para -1.
    if (uniforge.time.y.value == 0) {
        if (uniforge.time.y.value > oldValue) { // O ano está avançando.
            uniforge.time.y.value = 1;
        } else { // O ano está retroagindo.
            uniforge.time.y.value = -1;
        }
    }
    uniforge.time.y.label = (Math.abs(uniforge.time.y.value)).toString();

    // Altera a era para antes da Tríade dos Heróis (ano negativo) ou depois da Tríade (ano positivo).
    uniforge.time.era = (uniforge.time.y.value > 0 ? 'd.T.' : 'a.T.');

    currentYearInput.value = uniforge.time.y.label;
    timeEraSpan.textContent = uniforge.time.era;

    const mid = uniforge.constants.leaflet.DEFAULT_OVERLAY; // Define o ID do mapa como o mapa padrão.

    uniforge.ctrls.leaflet.loadElements(mid, uniforge.time.y.value);
}

// Função para criar um elemento com classes e atributos.
function createElement(tag, attributes = {}, children = []) {
    const element = document.createElement(tag);

    // Adiciona os atributos ao elemento.
    for (const [key, value] of Object.entries(attributes)) {
        if (key === 'class') {
            element.className = value;
        } else {
            element.setAttribute(key, value);
        }
    }

    // Adiciona os filhos ao elemento.
    children.forEach(child => {
        if (typeof child === 'string') {
            element.appendChild(document.createTextNode(child));
        } else {
            element.appendChild(child);
        }
    });

    return element;
}
