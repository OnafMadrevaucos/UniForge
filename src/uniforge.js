import MsgBox from "./models/msgBox.js";

import { LinkTooltip } from "./scripts/linkTooltip.js";
import { registerHook, triggerHook } from "./scripts/hooks.js";

import DBManager from "./db/dbManager.js";
import DBDocuments from "./db/dbDocuments.js";

import * as esm from "./common/uniforge-esm.mjs";
import lControl from "./common/leaflet/core.mjs";
import PDFManager from "./scripts/managers/pdfManager.js";

// Realiza as configurações iniciais da aplicação ao carregar o conteúdo do DOM.
document.addEventListener('DOMContentLoaded', async () => {
    const cssname = await uniforge.path.join('css/styles.css');

    const urls = {
        // Urls de Imagens padrão usadas pelo sistema.
        background: await uniforge.path.join('/ui/lib-background.png'),
        blankImg: await uniforge.path.join('/ui/blank-image.svg'),

        worldMap: await uniforge.path.join('/data/maps/world'),

        mapOverlays: await uniforge.path.join('/data/maps/world/overlays'),

        // Urls de Diretórios usados pelo sistema.
        common: await uniforge.path.join('/common/'),
        models: await uniforge.path.join('/models/'),
        templates: await uniforge.path.join('/templates/'),
        scripts: await uniforge.path.join('/scripts/'),
        data: await uniforge.path.join('/data/'),
        ui: await uniforge.path.join('/ui/'),
        icons: await uniforge.path.join('/ui/icons/'),
    }

    // Adiciona as propriedades restantes ao objeto uniforge.
    uniforge.utils.mergeObjects(uniforge, {
        /**
         * Constantes usadas pela aplicação.
        */
        constants: {
            APP_NAME: 'UniForge',
            APP_VERSION: '0.7.9',
            CSS_NAME: cssname,
            leaflet: lControl.constants
        },

        /**
         * Instância do gerenciador de banco de dados.
         * @type {DBManager}
         */
        db: new DBManager(),

        /**
        * Urls de Imagens padrões usadas pelo sistema.
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
        urls: urls,

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
        },

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
            tooltip: new LinkTooltip()
        },

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

    configureTopBar();

    configureForms();

    configureHooks();

    checkState();

    await configureLeaflet();
});

// Limpa o armazenamento local ao fechar a janela.
window.addEventListener("beforeunload", () => {
    const json = localStorage.getItem('uniforge');
    const state = JSON.parse(json);
    if (!state.keep) uniforge.state.clear();
});

/*
async function testPDF() {
    uniforge.pdf.init();

    const html = document.createElement('div');
    html.innerHTML = '<h1>Teste de PDF</h1>Este é um Teste de PDF';
    uniforge.pdf.fromHTML(html);
}   
*/

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
// Recarrega os documentos do banco de dados.
async function refreshDocuments() {
    const data = await DBDocuments.UniForgeData();
    uniforge.doc = new DBDocuments(data);
    return uniforge.doc;
}

// Configura a ferramenta de mapas Leaflet.
async function configureLeaflet() {
    /* 
        TODO: Verificar se o usuário informou um mapa padrão alternativo no painel de configuração.
    */   

    // Inicializa o controle de mapas Leaflet.
    uniforge.ctrls.leaflet = lControl.init(uniforge.urls.worldMap);
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
    registerHook('beforeRender', async () => { await refreshDocuments(); });
    registerHook('simpleEntryFormClosed', async () => { 
        await refreshDocuments(); 
        console.log('simpleEntryFormClosed');
    });
}
// Configura o listeners que tratam os eventos dos tabs do Menu Lateral e as rotinas de fechamento do Form
function activateMainListeners() {
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

    toggleTab.addEventListener('click', () => {
        topBar.classList.toggle('visible');
        toggleTab.classList.toggle('visible');
    });

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

function onNewMapElement() {

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

    const mid = uniforge.constants.leaflet.DEFAULT_OVERLAY; // Define o ID do mapa como o mapa padrão.

    uniforge.ctrls.leaflet.loadElements(mid, uniforge.time.y.value);
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