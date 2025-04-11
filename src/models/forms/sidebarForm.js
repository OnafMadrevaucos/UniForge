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
    }

    /**
     * @overload
     * @inheritdoc
    */
    get defaultOptions() { 
        const config = super.defaultOptions;   
        return uniforge.utils.mergeObjects(config,{
            classes: [...config.classes,'flexrow']
        }); 
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
            sidebar: document.querySelector('.entries .sidebar'),
            dialog: document.querySelector('.entries .sidebar #confirmDialog')
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
        const folders = this.querySelectorAll('#folderList .folder');

        if (folders.length == 0) return;

        folders.forEach(item => {
            item.classList.remove('selected');
            const icon = item.querySelector('.fas');
            icon.classList.remove(...icon.classList);
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

    createFolderList(data) {
        const folderList = this.querySelector('#folderList');
        folderList.innerHTML = '';

        for (const value of Object.values(data)) {
            const folder = this.createFolderItem(value);
            folderList.appendChild(folder);
        }
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

        //folderHeader.appendChild(this.createDeleteIcon());

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

        const icon = document.createElement('i');
        icon.className = 'fas fa-file';

        const span = document.createElement('span');
        span.textContent = data.title;

        entryItem.appendChild(icon);
        entryItem.appendChild(span);

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

            const folders = this.querySelectorAll('.folder');
            const items = this.querySelectorAll('.entry-item');

            folders.forEach(item => {
                const folderHeader = item.querySelector('.folder-header');
                folderHeader.addEventListener('click', (event) => {
                    this.onFolderClick(event);
                });
            });

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

    /**
   * Reconfigura ouvintes de eventos para o formulário.
   * @param {HTMLElement} form - O formulário principal.
   * @private
   */
    reactivateListeners(form) {
        const sidebar = this.ui.sidebar;
        if (sidebar) {
            const folders = this.querySelectorAll('.folder');
            const items = this.querySelectorAll('.entry-item');

            folders.forEach(item => {
                const folderHeader = item.querySelector('.folder-header');
                folderHeader.addEventListener('click', (event) => {
                    this.onFolderClick(event);
                });
            });

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
    /**
    * Gerencia cliques no sidebar.
    * @param {MouseEvent} event - O evento de clique.
    */
    onSidebarClick(event) {
        event.stopPropagation();
        if (event.target.classList.contains('entry-item')) return;

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

        if (!isSelected) {
            clickedFolder.classList.add('selected');
            const folderIcon = clickedFolder.querySelector('.fas');
            folderIcon.classList.remove(...folderIcon.classList);
            folderIcon.classList.add('fas', 'fa-folder-open');
        }

        this.selection.folder = clickedFolder;
    }

    /**
     * Gerencia cliques simples em itens de entrada.
     * @param {MouseEvent} event - O evento de clique.
     * @private
     */
    onEntryItemClick(event) {
        event.stopPropagation();
        const clickedItem = event.target.closest('.entry-item');

        if (clickedItem !== this.selection.entry) {
            this.#clearEntryList();
        }
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