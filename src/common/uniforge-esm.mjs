/**@module uniforge */
import * as primitives from './primitives/module.mjs';

import * as utilsEsm from './utils/module.mjs';
import * as parserEsm from './parsers/module.mjs';
import * as leafletEsm from './leaflet/module.mjs';

import ArticleForm from '../models/forms/articleForm.js';

import AtlasForm from "../models/forms/atlasForm.js";
import EntityForm from "../models/forms/entityForm.js";
import HistoryForm from '../models/forms/historyForm.js';
import PoliticsForm from "../models/forms/politicsForm.js";
import EconomyForm from '../models/forms/economyForm.js';
import MilitaryForm from '../models/forms/militaryForm.js';
import IdeologyForm from '../models/forms/ideologyForm.js';

import SettingsForm from "../models/forms/settingsForm.js";
import CodexForm from "../models/forms/codexForm.js";
import TimelineForm from "../models/forms/timelineForm.js";
import { APP_STATES } from './utils/state.mjs';
import { core } from './leaflet/module.mjs';
import { applyHighlight, generateFolderlistHTML } from './utils/html.mjs';
'use strict';

globalThis.store = new WeakMap(); // WeakMap para armazenar os dados de imagens associados aos elementos.

const utils = {
    associateData: utilsEsm.images.associateData,
    getAsociatedData: utilsEsm.images.getAsociatedData,
    blobToImage: utilsEsm.images.blobToImage,
    imageToBlob: utilsEsm.images.imageToBlob,
    bufferToBlob: utilsEsm.images.bufferToBlob,
    bufferToImage: utilsEsm.images.bufferToImage,
    deepClone: utilsEsm.collection.deepClone,
    duplicate: utilsEsm.collection.duplicate,
    diffObject: utilsEsm.collection.diffObject,
    objectsEqual: utilsEsm.collection.objectsEqual,
    mergeObjects: utilsEsm.collection.mergeObjects,
    setProperty: utilsEsm.collection.setProperty,
    getProperty: utilsEsm.collection.getProperty,
    hasProperty: utilsEsm.collection.hasProperty,
    getType: utilsEsm.collection.getType,
    randomID: utilsEsm.random.randomID,
    randomString: utilsEsm.random.generateRandomString,
    randomNumber: utilsEsm.random.generateRandomNumber,
    loremIpsum: utilsEsm.helpers.loremIpsum,
    loadTemplate: utilsEsm.html.loadTemplate,
    isEmpty: utilsEsm.helpers.isEmpty,
    timeSince: utilsEsm.helpers.timeSince,
    getFontAwesomeIcons: utilsEsm.helpers.getFontAwesomeIcons,
    formatFileSize: utilsEsm.helpers.formatFileSize,
    refreshMarker: leafletEsm.utils.default.refreshMarker
};

const parser = {
    parseHTML: parserEsm.html.parseHTML,
    parseCssToJson: parserEsm.css.parseCssToJson,

    generateList: utilsEsm.html.generateListHTML,
    generateFolderlist: utilsEsm.html.generateFolderlistHTML,
    generateItemList: utilsEsm.html.generateListItemHTML,
    generateFolderItem: utilsEsm.html.generateFolderItemHTML,
    generateEmptyItem: utilsEsm.html.generateEmptyListHTML,    

    applyHighlight: utilsEsm.html.applyHighlight,
    removeHighlight: utilsEsm.html.removeHighlight
}

const leaflet = {
    core: leafletEsm.core,
    drawer: leafletEsm.utils.default.drawer,   
    drawStyle: leafletEsm.utils.default.drawStyle 
}

const state = {
    APP_STATES: utilsEsm.state.APP_STATES,
    FORM_STATES: utilsEsm.state.FORM_STATES,

    init: utilsEsm.state.initState,
    save: utilsEsm.state.saveState,
    current: utilsEsm.state.currentState,
    update: utilsEsm.state.updateState,
    clear: utilsEsm.state.clearState
}

console.log('UniForge | Gerando variável global \'uniforge\'...');
// Constante Global
/**
* Objeto global `uniforge` que armazena configurações e instâncias relacionadas à aplicação,
* incluindo configurações do mapa, controles, propriedades de navegação e utilitários.
* 
* @namespace uniforge
*/

globalThis.uniforge = { 
    /**
    * Referência ao corpo do documento HTML.
    * 
    * @type {HTMLElement}
    */
    html: document.body,

    /**
    * Ferramentas da Aplicação.
    * @type {Object}
    */
    app: window.app,

    /**
    * Ferramentas de controle universal de Diretórios.
    * @type {Object}
    */
    path: window.path,

    /**
    * Ferramentas de controle universal de PDF.
    * @type {Object}
    */
    pdfCtrl: window.pdfCtrl,

    /**
    * Ferramentas de manipulação de Arquivos.
    * @type {Object}
    */
    fs: window.fs,    

    /**
    * Instância de SQL usada pela aplicação.
    * @type {Object}
    */
    sql: window.sql,

    /**
    * Instância de Map Tiler usada pela aplicação.
    * @type {NodeTiler}
    */
    tiler: window.tiler,

    /**
     * Instância de Templates de Handlebars usada pela aplicação.
     * @type {Object}
     
    templates: window.templates,
    */

    /**
     * Instância de Crypto usada pela aplicação.
     * @type {Object}
     */
    crypto: window.crypto,

    /**
    * Cria uma WeakMap para armazenar arquivos maiores.
    * @type {WeakMap}
    * */
    store: store,

    /**
    * Instância do conversor de CSS usada pela aplicação.
    * @type {Object}
    */
    cssConverter: window.cssConverter,

    /**
    * Instância de funções auxiliares gerais.
    * 
    * @type {Utils}
    */
    utils: Object.freeze(utils),

    /**
    * Rotinas de gerenciamento do Estado da Aplicação.
    * @type {Utils.State}
    */
    state: state,

    /**
    * Instância de funções auxiliares de manipulação de código HTML e CSS.
    * 
    * @type {Parser}
    */
    parser: Object.freeze(parser),

    /**
    * Instância de funções auxiliares de manipulação de mapas da ferramenta Leaflet.
    * 
    * @type {Leaflet}
    */
    leaflet: Object.freeze(leaflet),

    /**
    * Instância de gerenciamento das tooltips usada pela aplicação.
    * 
    * @type {Utils.Tooltip}
    */
    tooltip: utilsEsm.tooltip,

    /**
    * Classes de Forms usadas pela aplicação discriminadas por identificador.
    * 
    * @type {Forms}
    */
    forms: Object.freeze({
        article: ArticleForm,
        atlas: AtlasForm,
        entity: EntityForm,
        history: HistoryForm,
        politics: PoliticsForm,
        economy: EconomyForm,
        military: MilitaryForm, 
        ideologies: IdeologyForm,
        settings: SettingsForm,
        codex: CodexForm,
        timeline: TimelineForm 
    }),

    /**
    * Referência ao formulário, utilizado em várias partes da aplicação.
    * 
    * @type {Object|null}
    */
    form: null,

    /**
    * LatLng onde o último clique no mapa ocorreu.
    * 
    * @type {L.LatLng|null}
    */
    clickLatLang: null,

    /**
     * Camada de sobreposição do mapa.
     * 
     * @type {Object|null}
     */
    mapOverlay: null,

    /**
    * Informações relacionadas ao tempo (como o valor do ano e a era).
    * 
    * @type {Object}
    * @property {Object} y - Objeto com valor e label do ano.
    * @property {string} era - A era representada (por exemplo, 'd.T.').
    */
    time: {
        y: {
            value: 1,
            label: '1'
        },
        era: 'd.T.'
    }
};