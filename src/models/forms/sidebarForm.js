import BaseForm from "./baseForm.js";

export default class SidebarForm extends BaseForm {
    constructor(title, options = {}) {
        super(title, options);

        /**
         * Representa as seleções atuais no formulário.
         * @type {{ folder: HTMLElement | null, entry: HTMLElement | null }}
         */
        this.selection = {
            folder: null,
            entry: null,
        };

        /**
        * O ícone Font Awesome para quando uma entrada é selecionada.
        * @type {string}
        * 
        */
        this.selectedIcon = 'fas fa-eye';
    }

    /**
     * @overload
     * @inheritdoc
    */
    get defaultOptions() {
        const config = super.defaultOptions;
        return uniforge.utils.mergeObjects(config, {
            classes: [...config.classes, 'flexrow']
        });
    }

    get isSimpleSidebar() {
        const folderList = this.querySelector('.folder-list');
        return folderList.type === 'simple';
    }

    /**
     * @overload
     * Retorna um objeto com as seguintes propriedades:
     *  - sidebar: O elemento HTML que representa a barra lateral do formulário.
     *  - dialog: O elemento HTML que representa o diálogo de confirmação.
     * 
     * @returns {Object}  - Um objeto com as propriedades mencionadas acima.
     */
    get ui() {
        const ui = {
            sidebar: document.querySelector(`#formMain-${this.uuid} .sidebar`),
            dialog: document.querySelector(`#formMain-${this.uuid} .sidebar #confirmDialog`)
        };
        return uniforge.utils.mergeObjects(super.ui, ui);
    }

    /**
     * Obtém os dados unificados necessários para o funcionamento do formulário.
     * @implements Implemente um método filho para as especificidades de cada formulário.
     * @async
     * @returns {object}  - Objeto de dados unificado.
     */
    prepareData() {
        this.prepareFolders(this.data);
        return this.data;
    }

    /**
     * Prepara a lista de pastas para o formulário com base no tipo do formulário.
     * @implements Implemente um método filho para as especificidades de cada formulário.
     * @param {object} data - O objeto de dados do formulário.
     */
    prepareFolders(data) {
        const folders = uniforge.doc.sections;
        data.folders = folders.sort();
    }

    /**
     * Carrega todo conteúdo que seja dependente de dados.
    */
    async configureContent() { }

    /**
     * Limpa o conteúdo do formulário
     */
    clearContent() {
        const folders = this.querySelectorAll('.folder-list .folder');

        if (folders.length == 0) return;

        folders.forEach(item => {
            item.classList.remove('selected');
            const icon = item.querySelector('.fas');
            icon.classList.remove(...icon.classList);

            if (this.isSimpleSidebar)
                icon.classList.add('fas', 'fa-file');
            else
                icon.classList.add('fas', 'fa-folder');
        });
    }

    /**
     * Limpa a imagem exibida definindo sua fonte para uma URL de imagem em branco.
     * Se a imagem ainda não tiver a classe 'empty', ela adiciona a classe 'empty'.
     */
    clearImage() {
        const displayedImage = this.querySelector('#displayedImage');
        if (displayedImage) {
            if (!displayedImage.classList.contains('empty'))
                displayedImage.classList.add('empty');

            displayedImage.src = this.blankImgUrl;
        }
    }

    /**
     * Carrega a lista de entradas da barra lateral.
     */
    loadSidebarData() {
        const folders = this.data.folders;
        if (folders) this.createFolderList(folders);
    }

    /**
     * Cria a lista de pastas da barra lateral.
     * @param {Object} data - Dados da pasta. Deve ter o formato:
     */
    createFolderList(data) {
        const folderList = this.querySelector('#folderList');
        folderList.innerHTML = '';

        for (const value of Object.values(data)) {
            const folder = (this.isSimpleSidebar) ? this.createSimpleFolderItem(value) : this.createFolderItem(value);
            folderList.appendChild(folder);
        }
    }

    createSimpleFolderItem(data) {
        const folderList = this.querySelector('#folderList');

        const folder = document.createElement('li');
        folder.classList.add('folder', 'created');
        folder.dataset.cid = data.cid ?? null;
        folder.dataset.sid = data.sid ?? null;
        folder.dataset.tid = data.tid ?? null;

        const folderContent = document.createElement('div');
        folderContent.className = 'folder-header flexrow';

        const span = document.createElement('span');
        span.textContent = data.title;
        folderContent.innerHTML = `<i class="fas fa-file"></i> ${span.outerHTML}`;

        folder.appendChild(folderContent);
        folderList.appendChild(folder);

        return folder;
    }

    /**
     * Cria uma nova pasta (categoria).
     * @param {Object} data - Dados da categoria a ser criada.
     * @returns {HTMLElement} - Elemento de um folder da lista de pastas.
     */
    createFolderItem(data) {
        const folderList = this.querySelector('#folderList');

        const folder = document.createElement('li');
        folder.classList.add('folder', 'created');
        folder.dataset.cid = data.cid ?? null;
        folder.dataset.sid = data.sid ?? null;
        folder.dataset.tid = data.tid ?? null;

        const folderHeader = document.createElement('div');
        folderHeader.className = 'folder-header flexrow';

        const span = document.createElement('span');
        span.textContent = data.title;
        folderHeader.innerHTML = `<i class="fas fa-folder"></i> ${span.outerHTML}`;

        const folderContent = document.createElement('div');
        folderContent.className = 'folder-content';
        const entryList = document.createElement('ul');
        entryList.className = 'entry-list';

        data.entries.forEach(entry => {
            const entryItem = this.createEntryItem(entry);
            entryList.appendChild(entryItem);
        });

        folderContent.appendChild(entryList);
        folder.appendChild(folderHeader);
        folder.appendChild(folderContent);
        folderList.appendChild(folder);

        return folder;
    }

    /**
     * Cria uma nova entrada para uma pasta (categoria) da lista.
     * @param {Object} data - Dados da entrada a ser criada.
     * @returns {HTMLElement} - Elemento de uma entrada da lista de pastas.
     */
    createEntryItem(data) {
        const entryItem = document.createElement('li');
        entryItem.className = 'entry-item flexrow';
        entryItem.dataset.id = data.eid ?? (data.cid ?? '-1');

        const entryRow = document.createElement('div');
        entryRow.className = 'entry-row flexrow';

        const icon = document.createElement('i');
        icon.className = 'fas fa-file';

        const span = document.createElement('span');
        span.textContent = data.title;

        entryRow.appendChild(icon);
        entryRow.appendChild(span);

        if (this.canDelete) {
            const deleteIcon = document.createElement('i');
            deleteIcon.className = 'fas fa-trash-can';
            entryRow.appendChild(deleteIcon);
        }

        entryItem.appendChild(entryRow);
        return entryItem;
    }

    /**
     * Configura ouvintes de eventos para o formulário.
     * @param {HTMLElement} form - O formulário principal.
     * @private
     */
    activateListeners() {
        const sidebar = this.ui.sidebar;
        if (sidebar) {
            sidebar.addEventListener('click', (event) => { this.onSidebarClick(event); });

            const minimizeButton = this.querySelector('#minimizeButton');
            if (minimizeButton) minimizeButton.addEventListener('click', (event) => { this.onMinimizeClick(event); });

            const folderList = this.querySelector('.folder-list');
            if (folderList) {

                const folders = this.querySelectorAll('.folder');

                const isSimpleSidebar = folderList.type === 'simple';

                folders.forEach(item => {
                    const folderHeader = item.querySelector('.folder-header');

                    item.addEventListener('click', (event) => {
                        this.onFolderClick(event);
                    });

                    if (isSimpleSidebar) item.addEventListener('dblclick', (event) => { this.onFolderDoubleClick(event); });
                });

                // Se o tipo de lista não for 'simple', adiciona ouvintes de eventos para os itens de Entrada.
                if (!isSimpleSidebar) {
                    const items = this.querySelectorAll('.entry-item');

                    items.forEach(item => {
                        item.addEventListener('click', (event) => {
                            this.onEntryItemClick(event);
                        });
                        item.addEventListener('dblclick', (event) => {
                            this.onEntryItemDoubleClick(event);
                        });
                    });
                }
            }

            const searchInput = this.querySelector('#searchInput');
            if (searchInput) {
                searchInput.addEventListener('input', (event) => { this.onSearchInput(event); });

                const clearSearch = this.querySelector('#clearSearch');
                clearSearch.addEventListener('click', (event) => { this.onClearSearch(event); });
            }
        }
    }

    /**
    * Gerencia cliques no sidebar.
    * @param {MouseEvent} event - O evento de clique.
    */
    onSidebarClick(event) {
        event.stopPropagation();
        if (!this.isSimpleSidebar && event.target.classList.contains('entry-item')) return;
        if (this.isSimpleSidebar && event.target.classList.contains('folder')) return;
        
        // Se o clique foi feito na barra de pesquisa, ignora.
        if(event.target.closest('.search-bar')) return;

        this.clearContent();
        if (this.controlStates) this.controlStates(this.states.default);
    }

    onMinimizeClick(event) {
        event.stopPropagation();
        const sidebar = this.ui.sidebar;
        sidebar.classList.toggle('minimized');
    }

    /**
    * Gerencia cliques em pastas.
    * @param {MouseEvent} event - O evento de clique.
    */
    onFolderClick(event) {
        event.stopPropagation();  

        const clickedFolder = event.target.closest('.folder');
        const isSelected = clickedFolder.classList.contains('selected');

        this.#clearFolderList();

        // Se a pasta já estiver selecionada, não faz nada.
        if (!isSelected) {
            // Se não for um sidebar simples, seleciona a nova Pasta.
            if (!this.isSimpleSidebar) {
                clickedFolder.classList.add('selected');
                const folderIcon = clickedFolder.querySelector('.fas');
                folderIcon.classList.remove(...folderIcon.classList);
                folderIcon.classList.add('fas', 'fa-folder-open');

                this.selection.folder = clickedFolder;
            } else {
                this.selection.folder = null;
            }
        }
    }

    /**
     * Gerencia cliques duplos em pastas.
     * @param {MouseEvent} event - O evento de clique duplo.
     * @private
     */
    onFolderDoubleClick(event) {
        event.stopPropagation();
        const clickedFolder = event.target.closest('.folder');
        this.#clearFolderList();
        clickedFolder.classList.add('selected');
        const folderIcon = clickedFolder.querySelector('i');
        folderIcon.classList.remove(...folderIcon.classList);
        folderIcon.className = this.selectedIcon;

        this.selection.folder = clickedFolder;
    }

    /**
     * Gerencia cliques simples em itens de entrada.
     * @param {MouseEvent} event - O evento de clique.
     * @private
     */
    onEntryItemClick(event) {
        event.stopPropagation();
    }

    /**
     * Gerencia cliques duplos em itens de entrada.
     * @param {MouseEvent} event - O evento de clique duplo.
     * @private
     */
    onEntryItemDoubleClick(event) {
        event.stopPropagation();
        const clickedItem = event.target.closest('.entry-item');

        this.#clearEntryList();
        clickedItem.classList.add('selected');
        const itemIcon = clickedItem.querySelector('i');
        itemIcon.classList.remove(...itemIcon.classList);
        itemIcon.className = this.selectedIcon;

        this.selection.entry = clickedItem;
    }

    onSearchInput(event) {
        const filter = event.target.value.trim().toLowerCase();
        const isSimple = this.isSimpleSidebar;

        const folders = this.querySelectorAll('.folder');
        const entries = this.querySelectorAll('.entry-item');

        // Se busca estiver vazia, mostrar tudo e restaurar textos.
        if (filter === '') {
            entries.forEach(e => {
                e.style.display = '';
                uniforge.parser.removeHighlight(e);
            });

            folders.forEach(f => {
                f.style.display = '';
                uniforge.parser.removeHighlight(f);
            });

            return;
        }

        // ------------------------------
        // SIDEBAR COMPLEXO (folders + entries)
        // ------------------------------
        if (!isSimple) {

            // 1) Filtra e realça entries.
            entries.forEach(entry => {
                const span = entry.querySelector('span');
                const label = entry.dataset.label ?? span.textContent;

                // Guarda texto original (uma vez só).
                if (!span.dataset.originalText) {
                    span.dataset.originalText = span.innerHTML;
                }

                const match = label.toLowerCase().includes(filter);
                entry.style.display = match ? '' : 'none';

                // Realce.
                if (match) {
                    span.innerHTML = uniforge.parser.applyHighlight(label, filter);
                } else {
                    uniforge.parser.removeHighlight(entry);
                }
            });

            // 2) Folders aparecem se:
            //    - elas mesmas combinam; ou
            //    - possuem ao menos um entry visível;
            folders.forEach(folder => {
                const span = folder.querySelector('.folder-header span');
                const folderLabel = folder.dataset.label ?? span.textContent;

                if (!span.dataset.originalText) {
                    span.dataset.originalText = span.innerHTML;
                }

                const folderMatches = folderLabel.toLowerCase().includes(filter);

                // Procura entries visíveis dentro desta pasta.
                const visibleEntries = folder.querySelectorAll('.entry-item:not([style*="display: none"])');
                const hasVisibleChild = visibleEntries.length > 0;

                // Exibição final.
                folder.style.display = (folderMatches || hasVisibleChild) ? '' : 'none';

                // Realce se combinar.
                if (folderMatches) {
                    span.innerHTML = uniforge.parser.applyHighlight(folderLabel, filter);
                } else {
                    uniforge.parser.removeHighlight(folder);
                }
            });
        }

        // ------------------------------
        // SIDEBAR SIMPLES (somente folders)
        // ------------------------------
        else {
            folders.forEach(folder => {
                const span = folder.querySelector('.folder-header span');
                const label = folder.dataset.label ?? span.textContent;

                if (!span.dataset.originalText) {
                    span.dataset.originalText = span.innerHTML;
                }

                const match = label.toLowerCase().includes(filter);
                folder.style.display = match ? '' : 'none';

                if (match) {
                    span.innerHTML = uniforge.parser.applyHighlight(label, filter);
                } else {
                    uniforge.parser.removeHighlight(folder);
                }
            });
        }

        const emptyListSpan = this.querySelector('#emptyListSpan');

        // Verifica se há algum item visível.
        const anyFolderVisible = Array.from(folders)
            .some(folder => folder.style.display !== 'none');

        // Se nenhum folder visível, mostrar mensagem de lista vazia.
        if (!anyFolderVisible) emptyListSpan.classList.remove('hidden');
        else emptyListSpan.classList.add('hidden');

    }

    onClearSearch(event) {
        const searchInput = this.querySelector('#searchInput');
        searchInput.value = '';

        this.onSearchInput({ target: searchInput });
    }

    /**
     * Remove a seleção de todas as pastas.
     * @private
     */
    #clearFolderList() {
        const folderList = this.querySelectorAll('.folder');
        folderList.forEach(item => {
            item.classList.remove('selected');
            const folderIcon = item.querySelector('.fas');
            folderIcon.classList.remove(...folderIcon.classList);

            if (this.isSimpleSidebar)
                folderIcon.classList.add('fas', 'fa-file');
            else
                folderIcon.classList.add('fas', 'fa-folder');
        });
        this.#clearEntryList();
        this.selection.folder = null;
    }

    /**
     * Remove a seleção de todas as entradas.
     * @private
     */
    #clearEntryList() {
        const itemsList = this.querySelectorAll('.entry-item');
        itemsList.forEach(item => {
            item.classList.remove('selected');
            const folderIcon = item.querySelector('i');
            folderIcon.classList.remove(...folderIcon.classList);
            folderIcon.classList.add('fas', 'fa-file');
        });
        this.selection.entry = null;
    }
}