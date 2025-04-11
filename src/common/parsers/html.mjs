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

    // Substitui as tags <foldertree>
    html = _parseSidetabsTags(html);

    // Substitui as tags <switch>
    html = _parseSwitchTags(html);

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
        key = key.trim();
        return key in data ? data[key] : (key in data.labels ? data.labels[key] : '');
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

    // Em seguida, remova as tags de fechamento </switch>
    html = html.replace(/<\/switch>/g, '');
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

    const regex = /<combo\s+id="([^"]+)"\s+value="([^"]+)"\s*(blank="([^"]+)")?\s*(search="([^"]+)")?\s*(disabled)?\s*\/?>/g;
    html = html.replace(regex, (match, id, valueKey, blankAttr, blankValue, searchAttr, searchValue, disabled) => {
        console.log(`Correspondência encontrada: ${match}`);
        console.log(`ID: ${id}, ValueKey: ${valueKey}${blankValue ? `, BlankValue: ${blankValue}` : ''}${searchAttr ? `, IsSearchable: ${searchValue}` : ''}${disabled ? ', Disabled' : ''}`);

        let result = `<select id="${id}" class="data" name="${id}"></select>`;
        if (!(valueKey in data)) {
            console.log(`O identificador '${valueKey}' não foi encontrado no objeto data. Retornando um <select> vazio.`);
            return result;
        }


        const isSearchable = searchValue === 'true';

        if (isSearchable) {
            const blankOption = blankAttr ? `<option value="&#8212" label="&#8212"/>` : '';
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
            const blankOption = blankAttr ? `<option value="${blankValue}" label="&#8212"/>` : '';
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

    // Em seguida, remova as tags de fechamento </combo>
    html = html.replace(/<\/combo>/g, '');
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

    // Em seguida, remova as tags de fechamento </calendar>
    html = html.replace(/<\/calendar>/g, '');
    return html;
}

function _parseFoldertreeTags(html, data) {
    console.log('UniForge | Substituindo tags de Foldertree...');
    const regex = /<foldertree id="([^"]+)" item="([^"]+)"(\s+data-([^>]+))?(\s+fixed)?><\/foldertree>/g;
    html = html.replace(regex, (match, id, itemKey, dataset) => {
        const isFixedRegex = /\s+fixed/;
        const isFixed = isFixedRegex.test(match);

        console.log(`Correspondência encontrada: ${match}`);
        console.log(`ID: ${id}, Item: ${itemKey}, ${dataset ? `Dados: ${dataset}` : ''}, isFixed: ${isFixed ? 'true' : 'false'}`);

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
            return `<ul id="folderList" class="folder-list"></ul>`;
        }

        // Variavel para armazenar o resultado do 'replace'.
        let result = '<ul id="folderList" class="folder-list">';
        const folders = data.folders;

        folders.forEach(folder => {
            if (!(itemKey in folder)) {
                console.log(`O identificador '${itemKey}' não foi encontrado no objeto data ou a lista de itens está vazia. Retornando um <li> vazio.`);
                return `<li class="folder created" data-id="${folder._id}"></li>`;
            }

            const itemList = folder[itemKey];
            const folderHTML =
                `<li class="folder created" data-id="${folder._id}">
                    <div class="folder-header flexrow">
                        <i class="fas fa-folder"></i>
                        <span>${folder._label}</span>
                    </div>
                    <div class="folder-content">
                        <ul class="entry-list">
                            ${(itemList.length > 0 ? _generateFolderItemHTML(itemKey, itemList, isFixed) : '')}
                        </ul>
                    </div>
                </li>`;

            result += folderHTML;

        });

        result += '</ul>';
        return result;
    });

    // Em seguida, remova as tags de fechamento </foldertree>
    html = html.replace(/<\/foldertree>/g, '');
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
                                <img src="images/icons/icone.svg" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;
        }

        let result = `<div id="${id}" class="${classAttr ? `${classAttr} ${classExtra}` : classExtra}">`;

        let body = '';
        data[source].forEach(tab => {
            body += `<div class="tab${tab.title === 'entity' ? ' disabled' : ''}" data-target="${tab.title}">
                        <span class="tab-text"><i class="${tab.icon}"></i> ${tab.label}</span>
                        <span class="tab-icon"><i class="${tab.icon}"></i></span>
                    </div>`
        });

        // É o Sidetab do menu principal? Adicione os campos extras.
        if (!isSimple) {
            result += `<div class="menu-title">
                        <span class="tab-title">UniForge</span>
                        <div class="tab-icon">
                            <div class="icon-border">
                                <div class="icon-background">
                                    <img src="images/icons/icone.svg" />
                                </div>
                            </div>
                        </div>
                    </div>`;
            result += body;
            result += `\n\n<div class="tab base-item settings-item" data-target="settings">
                            <span class="tab-text"><i class="fas fa-sliders"></i> Configurações</span>
                            <span class="tab-icon"><i class="fas fa-sliders"></i></span>
                        </div>
                        <div class="tab base-item logout-item" data-target="close-menu">
                            <span class="tab-text"><i class="fas fa-right-to-bracket"></i> Sair</span>
                            <span class="tab-icon"><i class="fas fa-right-to-bracket"></i></span>
                        </div>
            `;
        }
        else result += body;

        result += `</div>`;
        return result;
    });

    // Em seguida, remova as tags de fechamento </sidetabs>
    html = html.replace(/<\/sidetabs>/g, '');
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
            return `<ul id="${id}" class="${extraClasses ? `${extraClasses}` : 'list'}"></ul>`;
        }

        // Variavel para armazenar o resultado do 'replace'.
        let result = `<ul id="${id}" class="${extraClasses ? `${extraClasses}` : 'list'}">`;
        const listItems = data[valueKey];

        listItems.forEach(item => {
            const itemHTML = generateListItemHTML(item, {itemClass: itemClass});

            result += itemHTML.outerHTML;
        });

        result += '</ul>';
        return result;
    });

    // Em seguida, remova as tags de fechamento </list>
    html = html.replace(/<\/list>/g, '');
    return html;
}

export function generateListItemHTML(item, options={itemClass: null, withDelete: false}) {
    const { itemClass, withDelete } = options;

    const li = document.createElement('li');
    li.className = itemClass ?? 'item';
    li.setAttribute('data-value', item._value ?? '');

    const div = document.createElement('div');
    div.className = 'item-content flexrow';
    div.innerHTML = item._icon ?? '';

    const span = document.createElement('span');
    span.className = 'flex-1';
    span.textContent = item._label;

    div.appendChild(span);

    if (withDelete) {
        const deleteButton = document.createElement('a');
        deleteButton.className = 'delete-button';
        deleteButton.innerHTML = '<i class="fas fa-trash"></i>';  

        div.appendChild(deleteButton);      
    }

    li.appendChild(div);

    return li;
}

/**
* Uma função auxiliar para gerar o HTML dos itens de uma lista de pastas.
* @param {Array} itemList      - A lista de itens de uma pasta.
* @private
*/
function _generateFolderItemHTML(itemKey, itemList, isFixed) {
    let html = '';

    itemList.forEach(item => {
        const data = uniforge.doc[itemKey].get(item._id);
        html += `
                <li class="entry-item flexrow" data-id="${data._id}">
                    <i class="fas fa-file"></i>
                    <span>${data._label}</span>${isFixed ? '' : '\n<a class="remove-button"><i class="fas fa-trash"></i></a>'}                    
                </li>\n
            `;
    });

    return html;
}   
