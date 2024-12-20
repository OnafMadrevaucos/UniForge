import { Database } from "../../scripts/tempDB.js";

/**
 * Classe BaseForm
 * Gerencia a exibição, ocultação, e interações de um formulário sobre um overlay.
 */
export default class BaseForm {
  /**
   * Construtor da classe BaseForm.
   * @param {HTMLElement} overlay - O elemento de overlay que contém o formulário.
   */
  constructor(overlay) {
    /**
     * Gerenciador de conexão de Banco de Dados.
     * @type {DBManager}
     */
    this.db = CONFIG.db;

    /**
     * URL da imagem de fundo para o overlay.
     * @type {string}
     */
    this.imageUrl = '../images/lib-background.png';

    /**
     * O caminho para quando a entrada não possui imagem.
     * @type {string}
     */
    this.blankImgUrl = '../images/blank-image.svg';

    /**
        * O ícone Font Awesome para quando uma entrada é selecionada.
        * @type {string}
        * 
        */
    this.selectedIcon = 'fas fa-eye';

    /**
     * Elementos da interface do usuário (UI) associados ao formulário.
     * @type {{ overlay: HTMLElement, form: HTMLElement, close_btn: HTMLElement, content: HTMLElement, sidebar: HTMLElement }}
     */
    this.ui = {
      overlay: overlay,
      form: overlay.querySelector('.form-container'),
      close_btn: overlay.querySelector('.close-button'),
      content: overlay.querySelector('.form-content'),
      sidebar: overlay.querySelector('.sidebar'),
    };

    /**
     * Indica se o formulário está oculto inicialmente.
     * @type {boolean}
     */
    this.isHidden = this.ui.form.classList.contains('hidden');

    if (!this.isHidden) this.ui.form.classList.add('hidden');

    /**
     * Referência ao container do formulário.
     * @type {HTMLElement}
     */
    this.form = this.ui.form;

    /**
     * O identificador da raíz desse formulário.
     * @type {string}
     */
    this.root = this.querySelector('.entries')?.id ?? 'article';

    /**
     * Objeto de controle global para mensagens ao usuário.
     * @type {object}
     */
    this.msgBox = CONFIG.msgBox;

    /**
     * Objeto para exibir tooltips.
     * @type {object}
     */
    this.tooltip = CONFIG.tooltip;

    /**
     * Representa as seleções atuais no formulário.
     * @type {{ folder: HTMLElement | null, entry: HTMLElement | null }}
     */
    this.selection = {
      folder: null,
      entry: null,
    };

    // Configura os conteúdos básicos do formulário.
    this.configureBaseContent(this.form);
  }

  /* ---------------------------------------------------------------------------------------------------------------- */
  // GETTERS E SETTERS
  /**
   * Obtém os assuntos de uma dada origem disponíveis no banco de dados.
   * @async
   * @returns {Object} - Assuntos e suas categorias.
   */
  async getSubjects() {
    const data = await this.db.getAllSubjects(this.root);

    for (let category of Object.values(data)) {
      category.entries = Object.values(await this.db.getEntriesFromCategory(category.cid));
    }
    return data;
  }

  /**
   * Obtém as entradas disponíveis em uma categoria no banco de dados.
   * @returns {Object} - Categorias.
   */
  getEntry(data) {
    const id = data.entryId;
    const item = Database.entries[id];
    return (item.deleted ? null : item);
  }

  /**
   * Obtém os dados unificados necessários para o funcionamento do formulário.
   * @implements Implemente um método filho para as especificidades de cada formulário.
   * @async
   * @returns {object}  - Objeto de dados unificado.
   */
  async getData() {
    const data = {};

    data.subjects = await this.getSubjects();

    return data;
  }

  /* ---------------------------------------------------------------------------------------------------------------- */
  // INTERFACE DE USUÁRIO
  /**
   * Exibe o formulário e o overlay associados.
   */
  showForm() {
    // Constrói formulário antes de exibi-lo.
    this._configure();

    this.ui.overlay.classList.remove('hidden');
    this.ui.form.classList.remove('hidden');
  }

  /**
   * Oculta o formulário e o overlay, limpando seu conteúdo.
   */
  hideForm() {
    this.clear();
    this.ui.form.classList.add('hidden');
    this.ui.overlay.classList.add('hidden');
  }

  /**
   * Inicia a construção do formulário.
   */
  _configure() {
    if (this.configureContent) this.configureContent(this.form);
    else throw new Error('Não é possível iniciar a construção do formulário. Método \'configureContent\' não foi implementado.');
  }

  /**
   * Remove todos os elementos filhos de um elemento especificado ou do formulário principal.
   * @param {HTMLElement} [element={}] - O elemento cujos filhos devem ser removidos. Por padrão, é o formulário principal.
   */
  clear(element = {}) {
    if (!element) {
      while (this.form.firstChild) {
        this.form.removeChild(this.form.firstChild);
      }
    } else {
      while (element.firstChild) {
        element.removeChild(element.firstChild);
      }
    }
  }

  /* ---------------------------------------------------------------------------------------------------------------- */
  // CONFIGURAÇÃO
  /**
   * Configura o conteúdo do formulário
   * @param {HTMLElement} form - O elemento que representa o formulário.
   * @async
   */
  async configureBaseContent(form) {
    // Ativa os ouvintes de eventos básicos.
    this.activateBaseListeners(form);
  }

  /**
   * Carrega todo conteúdo que seja dependente de dados.
   * @param {HTMLElement} form - O formulário HTML principal.
  */
  async configureDataContent(form) {
    // Se o formulário possui um sidebar, configure suas entradas.
    if (this.ui.sidebar) this.loadSidebarData(form);
  }

  /**
   * Atualiza o conteúdo do formulário
   * @async
   */
  async updateContent() {
    // Se o formulário ainda possui um sidebar, reconfigure suas entradas.
    if (this.ui.sidebar) {
      this.loadSidebarData(this.form);
    }
  }

  /**
   * Limpa o conteúdo do formulário
   * @param {HTMLElement} form - O elemento que representa o formulário.
   */
  clearContent(form) {
    const folders = form.querySelectorAll('#folderList .folder');

    folders.forEach(item => {
      item.classList.remove('selected');
      const icon = item.querySelector('.fas');
      icon.classList.remove(...icon.classList);
      icon.classList.add('fas', 'fa-folder');
    });

    this.clearImage();
  }

  /**
  * Limpa a imagem exibida definindo sua fonte para uma URL de imagem em branco.
  * Se a imagem ainda não tiver a classe 'empty', ela adiciona a classe 'empty'.
  */
  clearImage() {
    const displayedImage = this.querySelector('#displayedImage');    
    if(!displayedImage.classList.contains('empty'))
      displayedImage.classList.add('empty');

    displayedImage.src = this.blankImgUrl;
  }

  /**
   * Carrega a lista de entradas da barra lateral.
   * @param {HTMLElement} form - O formulário principal.
   */
  loadSidebarData(form) {
    const data = this.data.subjects;
    this.createFolderList(data);
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

  /* ---------------------------------------------------------------------------------------------------------------- */
  // LISTENERS
  /**
   * Configura ouvintes de eventos básicos para o formulário.
   * @param {HTMLElement} form - O formulário principal.
   * @private
   */
  activateBaseListeners(form) {
    this.ui.overlay.addEventListener('click', (event) => {
      event.stopPropagation();
      if (!event.target.closest('.form-container') && !event.target.closest('.content')) {
        this.#handleNavQueueOnClose(event);
        this.hideForm();
      }
    }, { once: true });

    this.ui.close_btn.addEventListener('click', (event) => {
      event.stopPropagation();
      this.#handleNavQueueOnClose(event);
      this.hideForm();
    }, { once: true });
  }
  /**
   * Configura ouvintes de eventos para o formulário.
   * @param {HTMLElement} form - O formulário principal.
   * @private
   */
  activateListeners(form) {
    const sidebar = this.ui.sidebar;
    if (sidebar) {
      sidebar.addEventListener('click', (event) => {
        if (event.target.classList.contains('entry-item')) return;
        this.clearContent(form);

        if (this.controlStates) this.controlStates(this.states.default);
      });

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

  /* ---------------------------------------------------------------------------------------------------------------- */
  // UTILITÁRIOS
  /**
   * Consulta um seletor CSS dentro do overlay principal.
   * @param {string} selector - O seletor CSS a ser buscado.
   * @returns {HTMLElement} O primeiro elemento correspondente.
   */
  querySelector(selector) {
    return this.ui.overlay.querySelector(selector);
  }

  /**
   * Consulta todos os elementos correspondentes a um seletor CSS dentro do overlay principal.
   * @param {string} selector - O seletor CSS a ser buscado.
   * @returns {NodeList} Uma NodeList com os elementos correspondentes.
   */
  querySelectorAll(selector) {
    return this.ui.overlay.querySelectorAll(selector);
  }

  /**
   * Carrega um arquivo HTML usando fetch.
   * @param {string} filePath - O caminho do arquivo HTML.
   * @returns {Promise<string>|null} Uma Promise que resolve para o conteúdo HTML carregado como string.
   */
  async _loadHTML(filePath) {
    try {
      let response = await fetch(filePath);
      let htmlString = await response.text();
      return htmlString;
    } catch (err) {
      this.msgBox.showError(err);
      return null;
    }
  }

  /**
   * Lida com a fila de navegação ao fechar o formulário.
   * @param {MouseEvent} event - O evento de clique para fechar.
   * @private
   */
  #handleNavQueueOnClose(event) {
    const overlay = event.target.closest('.overlay');
    if (overlay.id === 'formOverlay' || CONFIG.navQueue.isFromTimeline()) {
      CONFIG.navQueue.clearQueue();
    } else if (overlay.id === 'entryFormOverlay') {
      if (CONFIG.navQueue.isFromLibrary()) {
        const first = CONFIG.navQueue.shift();
        CONFIG.navQueue.clearQueue();
        CONFIG.navQueue.push(first);
      }
    }
  }

  /**
   * Remove a seleção de todas as pastas.
   * @private
   */
  #clearFolderList() {
    const folderList = this.form.querySelectorAll('.folder');
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
    const itemsList = this.form.querySelectorAll('.entry-item');
    itemsList.forEach(item => {
      item.classList.remove('selected');
      const folderIcon = item.querySelector('i');
      folderIcon.classList.remove(...folderIcon.classList);
      folderIcon.classList.add('fas', 'fa-file');
    });
    this.selection.entry = null;
  }
}
