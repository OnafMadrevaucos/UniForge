
/**
 * Classe BaseForm
 * Gerencia a exibição, ocultação, e interações de um formulário sobre um overlay.
 */
export default class BaseForm {
  /**
   * Construtor da classe BaseForm.
   * @param {HTMLElement} title   - O título do formulário.
   */
  constructor(title) {
    /**
    * O elemento de overlay que contém o formulário.
    * @type {HTMLElement}
    * 
    */
    this.overlay = document.getElementById('formOverlay');

    /**
    * O título do formulário.
    * @type {string}
    * 
    */
    this.title = title;

    /**
     * Gerenciador de conexão de Banco de Dados.
     * @type {DBManager}
     */
    this.db = uniforge.db;

    /**
     * URL da imagem de fundo para o overlay.
     * @type {string}
     */
    this.imageUrl = './images/lib-background.png';

    /**
     * O caminho para quando a entrada não possui imagem.
     * @type {string}
     */
    this.blankImgUrl = './images/blank-image.svg';

    /**
        * O ícone Font Awesome para quando uma entrada é selecionada.
        * @type {string}
        * 
        */
    this.selectedIcon = 'fas fa-eye';

    /**
     * Elementos da interface do usuário (UI) associados ao formulário.
     * @type {{ overlay: HTMLElement, form: HTMLElement, header: HTMLElement, close_btn: HTMLElement, content: HTMLElement, sidebar: HTMLElement }}
     */
    this.ui = {
      overlay: this.overlay,
      form: this.overlay.querySelector('.form-container'),
      header: this.overlay.querySelector('.form-header'),
      close_btn: this.overlay.querySelector('.close-button'),
      content: this.overlay.querySelector('.form-content')
    };    

    /**
     * Indica se o formulário está oculto inicialmente.
     * @type {boolean}
     */
    this.isHidden = this.ui.form.classList.contains('hidden');

    /**
    * Indica se o formulário está renderizado corretamente.
    * @type {boolean}
    */
    this.rendered = false;

    /**
    * Indica se o formulário está configurado corretamente. Se 'sim', o formulário está pronto para ser exibido.
    * @type {boolean}
    */
    this.configured = false;

    /**
     * Indica se o formulário está oculto inicialmente.
     * @type {boolean}
     */
    this.canDelete = false;

    /**
     * Referência ao container do formulário.
     * @type {HTMLElement}
     */
    this.form = this.ui.form;

    /**
     * Objeto de controle global para mensagens ao usuário.
     * @type {object}
     */
    this.msgBox = uniforge.msgBox;

    /**
     * Objeto para exibir tooltips.
     * @type {object}
     */
    this.tooltip = uniforge.tooltip;
  }

  /**
  * Propriedade do template do formulário.
  * 
  * @type {string}
  */
  #template = './templates/forms/blank.html';

  /**
  * O identificador do tipo desse formulário.
  * 
  * @type {string}
  * @default 'article'
  */
  #type = 'article';

  /* ---------------------------------------------------------------------------------------------------------------- */
  // GETTERS E SETTERS
  /**
   * Obtém o template usado pelo Formulário.
   * 
   * @returns {String}  - O caminho do template do formulário.
   */
  get template() {
    return this.#template;
  }
  /**
   * Determina o template usado pelo Formulário.
   * 
   * @param {String}  - O caminho do template do formulário.
   */
  set template(value) {
    this.#template = `./templates/forms/${value}`;
  }  

  /**
   * Obtém o corpo HTML do Formulário.
   * 
   * @returns {String}  - O corpo HTML do Formulário.
   */
  get body() {
    return this.ui.content.innerHTML;
  }

  /**
   * Obtém o tipo do Formulário.
   * @async
   * @returns {String}  - O tipo do formulário.
   */
  get type() {
    return this.#type;
  }
  /**
   * Determina o tipo do Formulário.
   * @async
   * @param {String}  - O novo tipo do formulário.
   */
  set type(value) {
    this.#type = value;
  }

  async getData() {
    this.data = {
      core: {
        title: this.title,
        type: this.type,
        template: this.template,
        imageUrl: this.imageUrl,
        blankImgUrl: this.blankImgUrl
      }
    };

    return this.data;
  }

  /**
   * Obtém o código HTML do Formulário.
   * 
   * @returns {String}  - O código HTML do Formulário.
   */
  toHTML() {
    return this.form.outerHTML;
  }

  /* ---------------------------------------------------------------------------------------------------------------- */
  // INTERFACE DE USUÁRIO
  async renderForm() {
    try {
      const html = await uniforge.utils.loadTemplate(this.template);
      this.ui.content.innerHTML = html;

      // Obtém objeto com todos os dados unificados necessários para o funcionamento do formulário.
      this.data = await this.getData();

      // Configura os conteúdos específicos do formulário.
      await this._configure();

      this.rendered = true;
    } catch (error) {
      console.error(error);
    }
  }
  /**
   * Exibe o formulário e o overlay associados.
   */
  async showForm(forceLoad = false) {
    if (forceLoad && !this.rendered) await this.renderForm();
    else throw new Error('Não foi possível exibir o formulário. O formulário não foi renderizado.');

    try {
      if (this.configured) {
        this.ui.overlay.classList.remove('hidden');
        this.ui.form.classList.remove('hidden');
      }
    } catch (error) {
      this.msgBox.showError(error.message);
    }
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
  async _configure() {
    try {
      // Configura os conteúdos básicos do formulário.
      this.configureBaseContent(this.form);

      // Configura os conteúdos específicos do formulário.
      if (this.configureContent) {
        await this.configureContent(this.form);

        await this.configureDataContent();

        this.prepareContent();

        if (this.activateListeners) {
          this.activateListeners(this.form);  
          this.configured = true;
        } else {
          this.msgBox.showError('Não é possível iniciar a construção do formulário. Método \'activateListeners\' não foi implementado.');          
        }
      }
      else {
        this.msgBox.showError('Não é possível iniciar a construção do formulário. Método \'configureContent\' não foi implementado.');        
      }
    } catch (error) {
      this.msgBox.showError(error.message);      
    }
  }

  /**
   * Remove todos os elementos filhos de um elemento especificado ou do formulário principal.
   * @param {HTMLElement} [element={}] - O elemento cujos filhos devem ser removidos. Por padrão, é o formulário principal.
   */
  clear(element = {}) {
    // Limpa todos os editores Tiny MCE inicializados no formulário.
    tinymce.remove();
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
    // Configura o título do formulário.
    const formTitle = this.querySelector('.form-title');
    formTitle.textContent = this.title;

    // Ativa os ouvintes de eventos básicos.
    this.activateBaseListeners(form);
  }

  /**
  * Propaga as configurações necessárias para os dados do formulário.
  * 
  * @async
  */
  async configureDataContent() { }

  /**
   * Prepara o conteúdo do formulário substituindo seus placeholders e tags customizadas.
  */
  prepareContent() { 
    this.form.outerHTML = uniforge.parser.parseHTML(this.form.outerHTML, this.data);
  }

  /**
   * Limpa o conteúdo do formulário
   */
  clearContent() {
    this.clearImage();
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

  /* ---------------------------------------------------------------------------------------------------------------- */
  // UTILITÁRIOS  
  /**
   * Consulta um seletor CSS dentro do overlay principal.
   * @param {string} selector - O seletor CSS a ser buscado.
   * @returns {HTMLElement} O primeiro elemento correspondente.
   */
  querySelector(selector) {
    return this.overlay.querySelector(selector);
  }

  /**
   * Consulta todos os elementos correspondentes a um seletor CSS dentro do overlay principal.
   * @param {string} selector - O seletor CSS a ser buscado.
   * @returns {NodeList} Uma NodeList com os elementos correspondentes.
   */
  querySelectorAll(selector) {
    return this.overlay.querySelectorAll(selector);
  }

  /**
   * Lida com a fila de navegação ao fechar o formulário.
   * @param {MouseEvent} event - O evento de clique para fechar.
   * @private
   */
  #handleNavQueueOnClose(event) {
    const overlay = event.target.closest('.overlay');
    if (overlay.id === 'formOverlay' || uniforge.navQueue.isFromTimeline()) {
      uniforge.navQueue.clearQueue();
    } else if (overlay.id === 'entryFormOverlay') {
      if (uniforge.navQueue.isFromLibrary()) {
        const first = uniforge.navQueue.shift();
        uniforge.navQueue.clearQueue();
        uniforge.navQueue.push(first);
      }
    }
  }
}
