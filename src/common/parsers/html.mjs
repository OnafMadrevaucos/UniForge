import * as utils from '../utils/module.mjs';
/**
     * Processa um código HTML substituindo as tags <switch>, <combo> e <calendar>, bem como todos os placeholders informados.
     * @param {string} html - A string HTML contendo as tags e placeholders.
     * @param {Object} data - O objeto contendo as chaves e valores para substituição.
     * @returns {string} - A string HTML modificada com as tags e placeholders substituídas.
     */
export function parseHTML(html, data) {
    console.log(`UniForge | Tratando o corpo HTML...`);

    // Substitui as tags <combo>
    html = _parseComboTags(html, data);

    // Substitui as tags <calendar>
    html = _parseCalendarTags(html);

    // Substitui as tags <list>
    html = _replaceListTags(html, data);

    // Substitui as tags <foldertree>
    html = _parseFoldertreeTags(html, data);

    // Substitui as tags <sidetabs>
    html = _parseSidetabsTags(html);

    // Substitui as tags <switch>
    html = _parseSwitchTags(html);

    // Substitui as tags <slider>
    html = _parseSliderTags(html);

    // Substitui as tags <color>
    html = _parseColorTags(html);

    // Substitui os placeholders
    html = _parsePlaceholders(html, data);

    return html;
}

/**
* Substitui os valores entre '{{' e '}}' no código HTML pelo valor correspondente de um objeto 'data'.
* @param {string} html - A string HTML contendo os placeholders.
* @param {Object} data - O objeto contendo as chaves e valores para substituição.
* @returns {string} - A string HTML modificada com os valores substituídos.
*/
function _parsePlaceholders(html, data) {
    console.log('UniForge | Substituindo valores de Placeholders...');
    const regex = /{{(.*?)}}/g;

    html = html.replace(regex, (match, key) => {
        // Remova os espaços em branco do inicio e fim da possível chave.
        key = key.trim();

        // Caso o placeholder possua um '.' ele pode ser um objeto aninhado.
        if (key.includes('.')) {
            // Obtenha todas as possíveis chaves do objeto.
            const keys = key.split('.');
            // Inicie o resultado com o objeto principal.
            let result = data;

            // Percorra as chaves e obtenha o valor correspondente.
            for (const k of keys) {
                // Verifique se a chave existe no objeto atual.
                if (result && Object.prototype.hasOwnProperty.call(result, k)) {
                    // Se existir, obtenha o valor correspondente.
                    result = result[k];
                }
            }
            return result;
        } else {
            return key in data ? data[key] : (key in data.labels ? data.labels[key] : '');
        }
    })

    return html;
}

/**
* Substitui todas as tags <switch> no HTML pelo código de um switch estilizado.
* @param {string} html - A string HTML contendo as tags <switch>.
* @returns {string} - A string HTML modificada com as tags <switch> substituídas.
*/
function _parseSwitchTags(html) {
    console.log('UniForge | Substituindo tags de Switch...');

    const regex = /<switch\s*(?:id="([^"]+)")?\s*(?:class="([^"]+)")?\s*\/?>/g;
    html = html.replace(regex, (match, id, classes) => {
        console.log(`Correspondência encontrada: ${match}`);
        console.log(`ID: ${id ?? 'none'}, Classes: ${classes ?? 'none'}`);
        return `
        <label ${id ? `id="${id}"` : ''} ${classes ? `class="switch ${classes}"` : 'class="switch"'}>
            <input type="checkbox" id="checkbox">
            <div class="slider"></div>
        </label>`;
    });
    return html;
}

/**
* Substitui todas as tags <slider> no HTML pelo código de um slider estilizado.
* @param {string} html - A string HTML contendo as tags <slider>.
* @returns {string} - A string HTML modificada com as tags <slider> substituídas.
*/
function _parseSliderTags(html) {
    console.log('UniForge | Substituindo tags de Slider...');

    const regex = /<slider\s*(?:id="([^"]+)")?\s*(?:class="([^"]+)")?\s*\/?>/g;
    html = html.replace(regex, (match, id, classes) => {
        console.log(`Correspondência encontrada: ${match}`);
        console.log(`ID: ${id ?? 'none'}, Classes: ${classes ?? 'none'}`);
        return `
        <div ${id ? `id="${id}"` : ''} ${classes ? `class="slider-container ${classes}"` : 'class="slider-container"'}>
            <div class="slider-track" id="slider">
                <div class="slider-fill"></div>
                <div class="slider-thumb"></div>
            </div>
        </div>`;
    });
    return html;
}

/**
* Substitui todas as tags <color> no HTML pelo código de um color picker estilizado.
* @param {string} html - A string HTML contendo as tags <color>.
* @returns {string} - A string HTML modificada com as tags <slider> substituídas.
*/
function _parseColorTags(html) {
    console.log('UniForge | Substituindo tags de Color Picker...');

    const regex = /<color\s*(?:id="([^"]+)")?\s*(?:class="([^"]+)")?\s*\/?>/g;
    html = html.replace(regex, (match, id, classes) => {
        console.log(`Correspondência encontrada: ${match}`);
        console.log(`ID: ${id ?? 'none'}, Classes: ${classes ?? 'none'}`);
        return `
        <div ${id ? `id="${id}"` : ''} ${classes ? `class="color-picker ${classes}"` : 'class="color-picker"'}>
            <div class="color-picker-preview"></div>
            <div class="color-picker-popup">
                <div class="color-picker-spectrum">
                    <div class="color-picker-spectrum-cursor"></div>
                </div>
                <div class="color-picker-hue">
                    <div class="color-picker-hue-thumb"></div>
                </div>
                <div class="color-picker-alpha">
                    <div class="color-picker-alpha-thumb"></div>
                </div>
                <div class="color-picker-display">
                    <input type="text"/>
                </div>
                <div class="color-picker-footer flexrow">
                    <button id="colorPickerClear" class="color-picker-button">Limpar</button>
                    <button id="colorPickerAccept" class="color-picker-button">Aceitar</button>    
                </div>
            </div>
        </div>`;
    });
    return html;
}

/**
* Substitui todas as tags <combo> no HTML por um <select> com opções baseadas nos dados fornecidos.
* @param {string} html - A string HTML contendo as tags <combo>.
* @param {Object} data - O objeto contendo as chaves e valores para substituição.
* @returns {string} - A string HTML modificada com as tags <combo> substituídas.
*/
function _parseComboTags(html, data) {
    console.log('UniForge | Substituindo tags de Combo...');

    const regex = /<combo\s+id="([^"]+)"\s+value="([^"]+)"(?:\s+blank="([^"]+)")?(?:\s+search="([^"]+)")?(?:\s+(disabled)(?=\s|\/|>))?\s*\/?>/g;

    html = html.replace(regex, (match, id, valueKey, blankValue, searchValue, disabled) => {
        console.log(`Correspondência encontrada: ${match}`);
        console.log(`ID: ${id}, ValueKey: ${valueKey}${blankValue ? `, BlankValue: ${blankValue}` : ''}${searchValue ? `, IsSearchable: ${searchValue}` : ''}${disabled ? ', Disabled' : ''}`);

        let result = `<select id="${id}" class="data" name="${id}"></select>`;
        if (!(valueKey in data)) {
            console.log(`O identificador '${valueKey}' não foi encontrado no objeto data. Retornando um <select> vazio.`);
            return result;
        }

        const isSearchable = searchValue === 'true';

        if (isSearchable) {
            const blankOption = blankValue ? `<option value="&#8212" label="&#8212"/>` : '';
            const options = Array.isArray(data[valueKey])
                ? data[valueKey].map(val => `<option id="${val._id}" value="${val._label}" class="search-option"/>`).join('\n')
                : Object.keys(data[valueKey]).map(key => `<option id="${data[valueKey][key]._id}" value="${data[valueKey][key]._label}" class="search-option"/>`).join('\n');

            result = `
            <input type="text" id="${id}" class="data" name="${valueKey}" list="${id}-list"${disabled ? ' disabled' : ''}>
            <datalist id="${id}-list">
                ${blankOption}
                ${options}
            </datalist >`;
        } else {
            const blankOption = blankValue ? `<option value="${blankValue}" label="&#8212"/>` : '';
            const options = Array.isArray(data[valueKey])
                ? data[valueKey].map(val => `<option value="${val._id}" label="${val._label}"/>`).join('\n')
                : Object.keys(data[valueKey]).map(key => `<option value="${data[valueKey][key]._id}" label="${data[valueKey][key]._label}"/>`).join('\n');

            result = `
            <select id="${id}" class="data" name="${id}"${disabled ? ' disabled' : ''}>
                ${blankOption}
                ${options}
            </select>`;
        }

        return result;
    });
    return html;
}

/**
 * Substitui todas as tags <calendar> no HTML pelo código HTML de um calendário.
 * @param {string} html - A string HTML contendo as tags <calendar>.
 * @returns {string} - A string HTML modificada com as tags <calendar> substituídas.
*/
function _parseCalendarTags(html) {
    console.log('UniForge | Substituindo tags de Calendar...');

    const regex = /<calendar\s*(class="([^"]+)")?\s*\/?>/g;
    html = html.replace(regex, (match, classAttr, extraClasses) => {
        console.log(`Correspondência encontrada: ${match}`);
        console.log(`${extraClasses ? `Extra Classes: ${extraClasses}` : ''}`);
        return `
        <div class="date-input data ${extraClasses || ''}" id="dateInput" data-type="" data-date="">
            <div class="date-display" id="dateDisplay">Selecione uma data</div>
            <input id="dateHiddenInput" class="hidden" >            
            <div class="calendar" id="calendar">
                <div class="calendar-header">
                    <button id="prevGroup"><i class="fa-solid fa-caret-left"></i></button>
                    <span id="monthYearDisplay"></span>
                    <button id="nextGroup"><i class="fa-solid fa-caret-right"></i></button>
                </div>              
                <div class="calendar-view" id="calendarView">
                    <div class="calendar-content" id="calendarContent"></div>
                </div>              
            </div>
        </div>`;
    });
    return html;
}

function _parseFoldertreeTags(html, data) {
    console.log('UniForge | Substituindo tags de Foldertree...');
    const regex = /<foldertree id="([^"]+)"(\s+type="([^"]+)")?(\s+item="([^"]+)")(\s+data-([^>]+))?(\s+fixed="([^"]+)")?><\/foldertree>/g;
    html = html.replace(regex, (match, id, typeAttr, typeValue, itemAttr, itemKey, datasetAttr, dataset, fixedAttr, fixed) => {
        const isFixed = fixedAttr ? (fixed === 'true' ? true : false) : false;

        const type = typeAttr ? typeValue : 'default';

        console.log(`Correspondência encontrada: ${match}`);
        console.log(`ID: ${id}, Tipo: ${type}, Item: ${itemKey}, ${dataset ? `Dados: ${dataset}` : ''}, isFixed: ${isFixed}`);

        const datasetObj = {};
        if (dataset) {
            const datasetPairs = dataset.split(' ');
            for (const pair of datasetPairs) {
                const [key, value] = pair.split('=');
                datasetObj[key] = value.replace(/"/g, '');
            }
        }

        if (!('folders' in data)) {
            console.log(`O identificador 'folders' não foi encontrado no objeto data. Retornando um <ul> vazio.`);
            return `<ul id="folderList" type="${type}" class="folder-list" type="${type}">${utils.html.generateEmptyListHTML(true)}</ul>`;
        }

        if (data.folders.size === 0) {
            console.log(`A lista 'folders' está vazia. Retornando um <ul> vazio.`);
            return `<ul id="folderList" type="${type}" class="folder-list" type="${type}">${utils.html.generateEmptyListHTML(true)}</ul>`;
        }

        const result = utils.html.generateFolderlistHTML(id, data.folders, itemKey, type, isFixed);
        return result;
    });
    return html;
}

function _parseSidetabsTags(html) {
    console.log('UniForge | Substituindo tags de Sidetabs...');

    const data = uniforge.doc;
    const regex = /<sidetabs id="([^"]+)"\s+source="([^"]+)"(?:\s+class="([^"]+)")?(\s+simple)?><\/sidetabs>/g;
    html = html.replace(regex, (match, id, source, classAttr, classExtra) => {
        const isSimpleRegex = /\s+simple/;
        const isSimple = isSimpleRegex.test(match);

        console.log(`Correspondência encontrada: ${match}`);
        console.log(`ID: ${id}, Source: ${source}${classExtra ? `, Extra Classes: ${classExtra}` : ''}${isSimple ? `, Tipo: Simples` : ', Tipo: Completo'}`);

        // Verifica se o source é um dbDocument válido.
        if (!data[source]) {
            console.log(`O identificador '${source}' não é um dbDocument válido. Retornando um <div> vazio.`);
            return `<div id="${id}"${classAttr ? ` class="${classExtra ? ` ${classExtra}` : ''}` : ''}">
                <div class="menu-title">
                    <span class="tab-title">UniForge</span>
                    <div class="tab-icon">
                        <div class="icon-border">
                            <div class="icon-background">
                                <img src="ui/icons/icone.svg" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;
        }

        let result = `<div id="${id}" class="${classAttr ? `${classAttr} ${classExtra}` : classExtra}">`;

        let body = '';
        data[source].forEach(tab => {
            if (tab.enabled) {
                //body += `<div class="tab${tab.title === 'entity' ? ' disabled' : ''}" data-target="${tab.title}">
                body += `<div class="tab" data-target="${tab.title}">
                        <span class="tab-text"><i class="${tab.icon}"></i> ${tab.label}</span>
                        <span class="tab-icon"><i class="${tab.icon}"></i></span>
                    </div>`
            }
        });

        // É o Sidetab do menu principal? Adicione os campos extras.
        if (!isSimple) {
            result += `<div class="menu-title">
                        <span class="tab-title">UniForge</span>
                        <div class="tab-icon">
                            <div class="icon-border">
                                <div class="icon-background">
                                    <img src="ui/icons/icone.svg" />
                                </div>
                            </div>
                        </div>
                    </div>`;
            result += body;
            result += `\n\n<div class="tab base-item settings-item" data-target="settings">
                            <span class="tab-text"><i class="fas fa-sliders"></i> Configurações</span>
                            <span class="tab-icon"><i class="fas fa-sliders"></i></span>
                        </div>
                        <div class="tab base-item about-item" data-target="about">
                            <span class="tab-text"><i class="fas fa-circle-info"></i> Sobre</span>
                            <span class="tab-icon"><i class="fas fa-circle-info"></i></span>
                        </div>
            `;
        }
        else result += body;

        result += `</div>`;
        return result;
    });
    return html;
}

function _replaceListTags(html, data) {
    console.log('UniForge | Substituindo tags de List...');

    const regex = /<list id="([^"]+)" value="([^"]+)"( class="([^"]+)")?( item-class="([^"]+)")?><\/list>/g;
    html = html.replace(regex, (match, id, valueKey, classAttr, extraClasses, itemClassAttr, itemClass) => {
        console.log(`Correspondência encontrada: ${match}`);
        console.log(`ID: ${id}, Item: ${valueKey}${extraClasses ? `, Extra Classes: ${extraClasses}` : ''}${itemClass ? `, Classes dos Itens: ${itemClass}` : ''}`);

        if (!(valueKey in data)) {
            console.log(`O identificador da lista não foi encontrado no objeto data. Retornando um <ul> vazio.`);
            return `<ul id="${id}" class="list${extraClasses ? ` ${extraClasses}` : ''}"></ul>`;
        }

        // Variavel para armazenar o resultado do 'replace'.
        const result = utils.html.generateListHTML(id, data[valueKey], { extraClasses, itemClass: itemClass });
        return result;
    });
    return html;
}


