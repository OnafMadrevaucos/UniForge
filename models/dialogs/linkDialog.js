import Dialog from "./dialog.js";

export class LinkDialog extends Dialog {
    constructor(dialogData = {}, options = {}) {
        super(dialogData, options);
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

        const entryFolder = this.createFolderItem('entry', 'Entrada', folderList);
        const timelineFolder = this.createFolderItem('timeline', 'Linhas do Tempo', folderList);

        const items = await CONFIG.db.getAllEntriesAndTimelines();
        items.forEach(item => {
            if(item.type == 'entry') {
                const entryItem = this.createItem(item);
                entryFolder.appendChild(entryItem);
            } else if(item.type == 'timeline') {
                const timelineItem = this.createItem(item);
                timelineFolder.appendChild(timelineItem);
            }
        });

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
        const flavorText = document.createElement("textarea");
        flavorText.id = "flavorText"; // Define o ID da área de texto
        flavorText.disabled = true; // Define a área de texto como desabilitada

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
   * Cria uma nova pasta.
   * @param {Object} data - Dados da pasta a ser criada.
   * @returns {HTMLElement} - Elemento de um folder da lista de pastas.
   */
    createFolderItem(type, title, folderList) {
        const folder = document.createElement('li');
        folder.id = type;
        folder.classList.add('folder');
        folder.dataset.type = type;

        const folderHeader = document.createElement('div');
        folderHeader.className = 'folder-header flexrow';

        const span = document.createElement('span');
        span.textContent = title;
        folderHeader.innerHTML = `<i class="fas fa-folder"></i> ${span.outerHTML}`;

        //folderHeader.appendChild(this.createDeleteIcon());

        const folderContent = document.createElement('div');
        folderContent.className = 'folder-content';
        const entryList = document.createElement('ul');
        entryList.className = 'entry-list';       

        folderContent.appendChild(entryList);
        folder.appendChild(folderHeader);
        folder.appendChild(folderContent);
        folderList.appendChild(folder);

        folderList.forEach(item => {
            const folderHeader = item.querySelector('.folder-header');
            folderHeader.addEventListener('click', (event) => {
              this._onFolderClick(event);
            });
        });

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

        const icon = document.createElement('i');
        icon.className = 'fas fa-file';

        const span = document.createElement('span');
        span.textContent = data.title;

        entryItem.appendChild(icon);
        entryItem.appendChild(span);

        return entryItem;
    }

    static async configDialog(editor) {
        function createNewLink(event, editor) {
            const selectedHtml = editor.selection.getContent();
            const spanRegex = /<span[^>]*>(.*?)<\/span>/gi;

            if (spanRegex.test(selectedHtml)) {
                const unwrappedText = selectedHtml.replace(spanRegex, '$1').trim();
                editor.selection.setContent(unwrappedText);
            } else {
                const selectedText = editor.selection.getContent({ format: 'text' });
                if (selectedText) {
                    const leadingSpaces = selectedText.match(/^\s+/);
                    const trailingSpaces = selectedText.match(/\s+$/);

                    const trimmedText = selectedText.trim();
                    const wrappedContent = `${leadingSpaces ? leadingSpaces[0] : ''}${tooltip.forgeLink('FN002', trimmedText, () => { console.log("*CLICK*"); })}${trailingSpaces ? trailingSpaces[0] : ''}`;
                    editor.selection.setContent(wrappedContent);
                } else {
                    editor.notificationManager.open({
                        text: 'Favor selecionar um texto antes de criar um link.',
                        type: 'warning'
                    });
                }
            }
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
                        callback: (event) => { resolve(createNewLink(event, editor)); }
                    }
                },
                abort: () => resolve(null)
            };

            const dialog = new this(dialogData);
            dialog.render();
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
}