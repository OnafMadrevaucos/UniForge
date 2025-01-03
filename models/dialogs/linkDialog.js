import Dialog from "./dialog.js";

export default class LinkDialog extends Dialog {
    constructor(dialogData = {}, options = {}) {
        super(dialogData, uniforge.utils.mergeObjects(options, {
            height: '500px', 
            width: '600px'
        }));

        this.sourceId = options?.id ?? null;

        this.sourceType = options?.type ?? null;
    }

    async getBody() {
        /**
         * Cria o elemento raiz div principal que conterá toda a estrutura.
         */
        const body = document.createElement("div");
        body.className = "link-dialog entries flexrow"; // Define as classes CSS para o elemento raiz

        /**
         * Criação da sidebar (barra lateral esquerda).
         */
        const sidebar = document.createElement("div");
        sidebar.className = "sidebar"; // Define a classe CSS para a sidebar

        /**
         * Cria a lista de pastas dentro da sidebar.
         */
        const folderList = document.createElement("ul");
        folderList.id = "folderList"; // Define o ID para referência futura
        folderList.className = "folder-list"; // Define a classe CSS para estilização
        sidebar.appendChild(folderList); // Adiciona a lista de pastas à sidebar        

        const entryFolder = this.createFolderItem('entry', 'Entrada');
        const timelineFolder = this.createFolderItem('timeline', 'Linhas do Tempo');

        folderList.appendChild(entryFolder);
        folderList.appendChild(timelineFolder);

        /**
         * Cria o footer dentro da sidebar.
         */
        const footer = document.createElement("div");
        footer.className = "footer"; // Define a classe CSS para o footer

        /**
         * Cria o container para a barra de pesquisa.
         */
        const searchEntry = document.createElement("div");
        searchEntry.id = "searchEntry"; // Define o ID para referência futura
        searchEntry.className = "input-container search-bar flexrow"; // Define classes CSS

        /**
         * Cria o campo de entrada de texto para pesquisa.
         */
        const searchInput = document.createElement("input");
        searchInput.type = "text"; // Define o tipo de entrada
        searchInput.id = "searchInput"; // Define o ID para referência futura
        searchInput.className = "search-data"; // Define a classe CSS para estilização
        searchInput.placeholder = "Pesquisar entrada..."; // Define o texto do placeholder

        /**
         * Cria o botão de pesquisa.
         */
        const searchBtn = document.createElement("button");
        searchBtn.id = "searchBtn"; // Define o ID do botão
        searchBtn.className = "search-button"; // Define a classe CSS

        /**
         * Adiciona o ícone dentro do botão de pesquisa.
         */
        const searchIcon = document.createElement("i");
        searchIcon.className = "fas fa-magnifying-glass"; // Define a classe CSS do ícone
        searchBtn.appendChild(searchIcon); // Adiciona o ícone ao botão

        /**
         * Monta a barra de pesquisa e adiciona ao footer.
         */
        searchEntry.appendChild(searchInput);
        searchEntry.appendChild(searchBtn);
        footer.appendChild(searchEntry);

        /**
         * Adiciona o footer à sidebar e a sidebar ao elemento raiz.
         */
        sidebar.appendChild(footer);
        body.appendChild(sidebar);

        /**
         * Cria o content-summary (área de conteúdo principal).
         */
        const contentSummary = document.createElement("div");
        contentSummary.className = "summary"; // Define as classes CSS

        /**
         * Cria o header dentro do content-summary.
         */
        const header = document.createElement("div");
        header.className = "content flexcol"; // Define as classes CSS para o layout

        /**
         * Cria o container de imagem dentro do header.
         */
        const imageContainer = document.createElement("div");
        imageContainer.id = "imageContainer"; // Define o ID para referência futura
        imageContainer.className = "img-container disabled"; // Define classes CSS

        /**
         * Cria o elemento de imagem exibida.
         */
        const displayedImage = document.createElement("img");
        displayedImage.id = "displayedImage"; // Define o ID da imagem
        displayedImage.className = "img-displayed empty"; // Define classes CSS
        displayedImage.src = "../images/blank-image.svg"; // Define a fonte da imagem
        displayedImage.alt = "Imagem Padrão"; // Define o texto alternativo

        /**
         * Cria o campo de entrada de arquivo oculto.
         */
        const hiddenFileInput = document.createElement("input");
        hiddenFileInput.id = "hiddenFileInput"; // Define o ID do campo de arquivo
        hiddenFileInput.type = "file"; // Define o tipo de entrada
        hiddenFileInput.className = "hidden"; // Define a classe CSS
        hiddenFileInput.accept = "image/*"; // Define o tipo de arquivo aceito

        /**
         * Monta o container de imagem.
         */
        imageContainer.appendChild(displayedImage);
        imageContainer.appendChild(hiddenFileInput);

        /**
         * Cria o container de informações do header.
         */
        const headerInfo = document.createElement("div");
        headerInfo.className = "header-info flexrow"; // Define as classes CSS

        /**
         * Cria o campo de entrada para o título.
         */
        const titleInput = document.createElement("input");
        titleInput.id = "titleInput"; // Define o ID do campo de título
        titleInput.type = "text"; // Define o tipo de entrada
        titleInput.className = "title"; // Define a classe CSS
        titleInput.name = "title"; // Define o nome do campo
        titleInput.setAttribute('value', 'Título da Entrada'); // Define o texto do placeholder
        titleInput.disabled = true; // Define o campo como desabilitado

        /**
         * Cria a área de texto para o flavor text.
         */
        const flavorText = document.createElement("div");
        flavorText.id = "flavorText"; // Define o ID da área de texto        

        /**
         * Monta o container de informações do header.
         */
        headerInfo.appendChild(imageContainer);
        headerInfo.appendChild(titleInput);

        /**
         * Monta o header com o container de imagem e as informações.
         */
        header.appendChild(headerInfo);
        header.appendChild(flavorText);

        /**
         * Adiciona o header ao content-summary e o content-summary ao elemento raiz.
         */
        contentSummary.appendChild(header);
        body.appendChild(contentSummary);

        return body;
    }

    /**
   * Inicializa e configura o editor TinyMCE.
   * Remove qualquer instância existente antes de reconfigurar.
   * @private
   */
    async getTinyMCE() {
        if (tinymce.get('flavorText')) {
            tinymce.remove('#flavorText');
        }

        const options = uniforge.utils.mergeObjects(uniforge.tinymceOptions.lite, {
            selector: 'div#flavorText',
            readonly: true,
            init_instance_callback: (editor) => {
                editor.setContent(""); // Garante que o editor seja iniciado vazio.
            },
            setup: (editor) => { this._setupInlineTinyMCE(editor); },
            content_style: "body { text-align: justify; }"
        });

        await tinymce.init(options);
    }

    async _prepare() {
        await super._prepare(); // Gera a estrutura base do diálogo   

        const entryFolder = this.querySelector('#entry');
        const timelineFolder = this.querySelector('#timeline');

        const entryList = entryFolder.querySelector('.entry-list');
        const timelineList = timelineFolder.querySelector('.entry-list');

        const items = await this.db.getAllEntriesAndTimelinesExcept(this.sourceId, this.sourceType);
        items.forEach(item => {
            if (item.type == 'entry') {
                const entryItem = this.createItem(item);
                entryList.appendChild(entryItem);
            } else if (item.type == 'timeline') {
                const timelineItem = this.createItem(item);
                timelineList.appendChild(timelineItem);
            }
        });

        await this.getTinyMCE();
    }

    /**
    * Configura ouvintes de eventos básicos para o dialog.
    * @protected
    */
    _activateListeners() {
        super._activateListeners();
        const folders = this.querySelectorAll('.folder');
        const itemsList = this.querySelectorAll('.entry-item');

        folders.forEach(item => {
            const folderHeader = item.querySelector('.folder-header');
            folderHeader.addEventListener('click', (event) => {
                this._onFolderClick(event);
            });
        });

        itemsList.forEach(item => {
            item.addEventListener('dblclick', (event) => { this._onEntryItemDoubleClick(event); });
        });
    }

    /**
   * Cria uma nova pasta.
   * @param {Object} data - Dados da pasta a ser criada.
   * @returns {HTMLElement} - Elemento de um folder da lista de pastas.
   */
    createFolderItem(type, title) {
        const folder = document.createElement('li');
        folder.id = type;
        folder.className = 'folder flexcol';
        folder.dataset.type = type;

        const folderHeader = document.createElement('div');
        folderHeader.className = 'folder-header flexrow';

        const span = document.createElement('span');
        span.textContent = title;
        folderHeader.innerHTML = `<i class="fas fa-folder"></i> ${span.outerHTML}`;

        const folderContent = document.createElement('div');
        folderContent.className = 'folder-content';
        const entryList = document.createElement('ul');
        entryList.className = 'entry-list';

        folderContent.appendChild(entryList);
        folder.appendChild(folderHeader);
        folder.appendChild(folderContent);

        return folder;
    }

    /**
     * Cria um novo item para uma pasta da lista.
     * @param {Object} data - Dados do item a ser criado.
     * @returns {HTMLElement} - Elemento de um item da lista de pastas.
     */
    createItem(data) {
        const entryItem = document.createElement('li');
        entryItem.className = 'entry-item flexrow';
        entryItem.dataset.id = data.id;
        entryItem.dataset.type = data.type;

        const icon = document.createElement('i');
        icon.className = data.icon;

        const span = document.createElement('span');
        span.textContent = data.title;

        entryItem.appendChild(icon);
        entryItem.appendChild(span);

        return entryItem;
    }

    static async configDialog(source) {        
        function getLinkData(event) {
            const button = event.target.closest('.dialog-button');
            const item = JSON.parse(button.dataset.item); 
            
            return item;            
        }

        return new Promise((resolve, reject) => {
            const dialogData = {
                title: 'Novo Vínculo',
                buttons: {
                    cancel: {
                        label: "Cancelar",
                        icon: "fas fa-xmark",
                        callback: () => resolve(null)
                    },
                    link: {
                        label: "Vincular",
                        icon: "fas fa-link",
                        callback: (event) => { resolve(getLinkData(event)); }
                    }
                },
                abort: () => resolve(null)
            };

            const dialog = new this(dialogData, source);
            dialog.render();
        });
    }

    /**
   * Gerencia cliques em pastas.
   * @param {MouseEvent} event - O evento de clique.
   */
    _onFolderClick(event) {
        event.stopPropagation();
        const clickedFolder = event.target.closest('.folder');
        const isSelected = clickedFolder.classList.contains('selected');

        this._clearFolderList();

        if (!isSelected) {
            clickedFolder.classList.add('selected');
            const folderIcon = clickedFolder.querySelector('.fas');
            folderIcon.classList.remove(...folderIcon.classList);
            folderIcon.classList.add('fas', 'fa-folder-open');
        }
    }
    /**
     * Remove a seleção de todas as pastas.
     * @private
     */
    _clearFolderList() {
        const folders = this.querySelectorAll('.folder');
        folders.forEach(item => {
            item.classList.remove('selected');
            const folderIcon = item.querySelector('.fas');
            folderIcon.classList.remove(...folderIcon.classList);
            folderIcon.classList.add('fas', 'fa-folder');
        });
        this._clearEntryList();
    }

    /**
     * Remove a seleção de todas as entradas.
     * @private
     */
    _clearEntryList() {
        const itemsList = this.querySelectorAll('.entry-item');
        itemsList.forEach(item => {
            item.classList.remove('selected');
        });
    }

    _onEntryItemClick(event) {
        // Impedir que o clique no item desencadeie o clique fora do sidebar
        event.stopPropagation();

        const dialog = event.target.closest('.dialog');
        const folderList = dialog.querySelectorAll('.folder');
        const item = event.target;

        // Remover a classe 'selected' de todos os itens
        folderList.forEach(i => {
            i.classList.remove('selected')
            const folderIcon = i.querySelector('.fas');
            folderIcon.classList.remove(...folderIcon.classList);
            folderIcon.classList.add('fas', 'fa-folder');
        });

        // Adicionar a classe 'selected' ao item clicado
        item.classList.add('selected');
        const folderIcon = item.querySelector('.fas');
        folderIcon.classList.remove(...folderIcon.classList);
        folderIcon.classList.add('fas', 'fa-folder-open');
    }

    /**
    * Gerencia cliques duplos em itens de entrada.
    * @inheritdoc
    * @param {MouseEvent} event - O evento de clique duplo.
    */
    async _onEntryItemDoubleClick(event) {
        const item = event.target.closest('.entry-item');
        const type = item.dataset.type;
        const itemId = item.dataset.id;

        let data = null;
        if (type == 'entry')
            data = await this.db.getEntry(itemId);
        else
            data = await this.db.getTimeline(itemId);        

        data.type = type;

        const displayedImage = this.querySelector('#displayedImage');
        const titleInput = this.querySelector('#titleInput');

        titleInput.value = data.title;
        tinymce.get('flavorText').setContent(data.flavor);

        if (data.img) {
            const imageUrl = await uniforge.utils.blobToImage(data.img, data.ext);

            displayedImage.src = imageUrl
            displayedImage.classList.remove('empty');
        } else {
            displayedImage.src = "../images/blank-image.svg";
            displayedImage.classList.add('empty');
        }

        // Foca no campo de Título.    
        titleInput.focus();

        const linkButton = this.querySelector('#link');
        linkButton.dataset.item = JSON.stringify({id: itemId, type: type});
    }

    /**
   * Configura o editor TinyMCE com funcionalidades inline.
   * @protected
   * @param {Object} editor - Instância do editor TinyMCE.
   */
    _setupInlineTinyMCE(editor) {
        // Número máximo de caractéres do editor Tiny MCE de floreio.
        const maxCharacters = 255;

        // Sobrescreve o método setContent para limitar o conteúdo
        const originalSetContent = editor.setContent;

        editor.setContent = function (content, ...args) {
            // Salva a posição atual do cursor
            const bookmark = editor.selection.getBookmark(2);

            const plainTextContent = editor.dom.create('div', null, content).innerText; // Remove tags HTML
            if (plainTextContent.length > maxCharacters) {
                const truncatedText = plainTextContent.substring(0, maxCharacters);
                const truncatedHtml = editor.dom.create('div', null, truncatedText).innerHTML;
                originalSetContent.call(editor, truncatedHtml, ...args);
            } else {
                originalSetContent.call(editor, content, ...args);
            }

            // Restaura o cursor para a posição salva
            if (bookmark) {
                editor.selection.moveToBookmark(bookmark);
            }
        };        
    }
}