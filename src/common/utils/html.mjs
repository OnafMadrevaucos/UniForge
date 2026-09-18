/**
     * Carrega um template HTML de um arquivo externo.
     * 
     * @async
     * @function loadTemplate
     * @param {string} filePath - Caminho do arquivo do template.
     * @returns {Promise<string>} String HTML do conteúdo do arquivo.
     * @throws {Error} - Se o arquivo não for encontrado ou não for possível ler seu conteúdo.
     */
export async function loadTemplate(filePath) {
    const response = await fetch(filePath);
    if (!response.ok) throw new Error('Erro ao carregar o arquivo. Detalhes: ' + response.statusText);

    const htmlString = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');
    const content = doc.body.firstChild;

    return content;
}

export function generateListHTML(id, listItems, options = {}) {
    const extraClasses = options.extraClasses;
    const itemClass = options.itemClass;
    const withDelete = options.withDelete ?? false;

    // Variavel para armazenar o resultado do 'replace'.
    let html = `<ul id="${id}" class="list${extraClasses ? ` ${extraClasses}` : ''}">`;

    listItems.forEach(item => {
        const itemHTML = generateListItemHTML(item, { itemClass: itemClass, withDelete: withDelete });
        html += itemHTML.outerHTML;
    });

    html += '</ul>';
    return html;
}

export function generateFolderlistHTML(id, folders, itemKey, type = 'default', isFixed = false) {
    // Variavel para armazenar o resultado do 'replace'.
    let html = `<ul id="${id ?? 'folderList'}" type="${type}" class="folder-list">`;

    if (type === 'default') {
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
                        ${generateFolderItemHTML(itemKey, itemList, type, isFixed)}
                    </ul>
                </div>
            </li>`;

            html += folderHTML;

        });
    } else if (type === 'simple') {
        folders.forEach(folder => {
            const folderHTML =
                `<li class="folder created" data-id="${folder._id}">
                <div class="folder-header flexrow">
                    <i class="fas fa-file"></i>
                    <span>${folder._label}</span>${isFixed ? '' : '\n<a class="remove-button"><i class="fas fa-trash"></i></a>'}
                </div>                   
            </li>`;

            html += folderHTML;

        });
    }

    html += generateEmptyListHTML();

    html += '</ul>';
    return html;
}

/**
* Uma função auxiliar para gerar o HTML dos itens de uma lista de pastas.
* @param {Array} itemList      - A lista de itens de uma pasta.
* @private
*/
export function generateFolderItemHTML(itemKey, itemList, isFixed = false) {
    let html = '';

    if (itemList instanceof Array && itemList.length === 0) return html;
    if (itemList instanceof Set && itemList.size === 0) return html;

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

export function generateListItemHTML(item, options = { itemClass: null, withDelete: false }) {
    const { itemClass, withDelete } = options;

    const li = document.createElement('li');
    li.className = `item${itemClass ? ` ${itemClass}` : ''}`;
    li.setAttribute('data-value', item._value ?? (item._id ?? ''));

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

export function generateEmptyListHTML(visible=false) {
    return `<span id="emptyListSpan" class="empty-list${visible ? '' : ' hidden'}">Não há nenhuma entrada a ser exibida.</span>`;
}

export function applyHighlight(text, filter) {
    if (!filter) return text;
    const escaped = filter.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // escapa regex.
    const regex = new RegExp(escaped, 'gi');
    return text.replace(regex, match => `<mark>${match}</mark>`);
}

export function removeHighlight(element) {
    const span = element.querySelector('span');
    if (span && span.dataset.originalText) {
        span.innerHTML = span.dataset.originalText;
    }
}