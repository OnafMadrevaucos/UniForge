import { triggerHook } from "../../scripts/hooks.js";
import Application from "../application.js";
/**
 * Classe BaseForm
 * Gerencia a exibição, ocultação, e interações de um formulário sobre um overlay.
 */
export default class BaseForm extends Application {
  /**
   * Construtor da classe BaseForm.
   * @param {HTMLElement} title   - O título do formulário.
   */
  constructor(title, options = {}) {
    super(title, { style: Application.Styles.FORM, ...options });

    /**
     * Gerenciador de conexão de Banco de Dados.
     * @type {DBManager}
     */
    this.db = uniforge.db;

    /**
     * URL da imagem de fundo para o overlay.
     * @type {string}
     */
    this.imageUrl = uniforge.urls.background;

    /**
     * O caminho para quando a entrada não possui imagem.
     * @type {string}
     */
    this.blankImgUrl = uniforge.urls.blankImg;

    /**
        * O ícone Font Awesome para quando uma entrada é selecionada.
        * @type {string}
        * 
        */
    this.selectedIcon = 'fas fa-eye';

    /**
     * Indica se o formulário está oculto inicialmente.
     * @type {boolean}
     */
    this.canDelete = false;

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
   * Obtém o container principal do formulário.
   * 
   * @returns {HTMLElement}  - O container principal do formulário.
   */
  get form() {
    return this.ui.application;
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

  /**
    * O formulário é o de Enciclopédia
    * 
    * @type {boolean}
  */
  get isSettings() {
    return this.type === 'settings';
  };

  prepareBaseData() {
    const data = super.prepareBaseData();

    data.core.imageUrl = this.imageUrl;
    data.core.blankImgUrl = this.blankImgUrl;

    return data;
  }

  async prepareTemplate() {
    const overlay = document.createElement('div');
    overlay.id = `${this.style}Overlay-${this.uuid}`;
    overlay.classList.add('overlay', 'flexrow', 'hidden');

    const container = document.createElement('div');
    container.id = `${this.style}Container-${this.uuid}`;
    container.classList.add(this.style, 'container', 'flexrow');

    const header = document.createElement('div');
    header.id = `${this.style}Header-${this.uuid}`;
    header.classList.add('header-bar', 'flexrow');

    header.innerHTML = `
        <span class="${this.style} title">{{title}}</span>
        <switch id="deleteSwitch" class="hidden"></switch>
        <a id="${this.style}Close-${this.uuid}" class="close-button flexcol"><i class="fas fa-xmark"></i></a>
    `;

    const body = document.createElement('div');
    body.id = `${this.style}Body-${this.uuid}`;
    body.classList.add('body', 'flexcol');

    const html = await uniforge.utils.loadTemplate(this.template);
    body.innerHTML = html;

    container.appendChild(header);
    container.appendChild(body);
    overlay.appendChild(container);

    // Adiciona o overlay ao DOM.
    document.body.appendChild(overlay);
  }

  /* ---------------------------------------------------------------------------------------------------------------- */
  // INTERFACE DE USUÁRIO
  /**
   * Renderiza o formulário.
   * 
   * @async
   * @returns {Boolean} - Uma flag indicando se o form foi renderizado (true) ou não (false).
   */
  async render() {
    try {
      await triggerHook('beforeRenderForm');

      await super.render();

      // Configura os conteúdos específicos do formulário.
      await this.initialize();

      this.rendered = true;
      return this.rendered;
    } catch (error) {
      console.error(error);
    }
  }

  /**
   * Remove todos os elementos filhos de um elemento especificado ou do formulário principal.
   * @param {HTMLElement} [element={}] - O elemento cujos filhos devem ser removidos. Por padrão, é o formulário principal.
   */
  clear() {
    super.clear();

    // Limpa todos os editores Tiny MCE inicializados no formulário.
    tinymce.remove();
  }
  /**
   * Exibe o formulário e o overlay associados.
   */
  async showForm(forceLoad = false) {
    this.show(forceLoad);
  }

  /**
   * Oculta o formulário e o overlay, limpando seu conteúdo.
   */
  hideForm() {
    this.close();
  }
  /* ---------------------------------------------------------------------------------------------------------------- */
  // CONFIGURAÇÃO
  /**
   * Inicia a construção do formulário.
   */
  async initialize() {
    try {
      // Configura os conteúdos específicos do formulário.
      if (this.configureContent) {

        await this.configureContent();

        if (this.activateListeners) {

          // Ativa os demais ouvintes.
          this.activateListeners();

          this.configured = true;
          return this.configured;
        } else {
          this.msgBox.showError('Não é possível iniciar a construção do formulário. Método \'activateListeners\' não foi implementado.');
          return false;
        }
      }
      else {
        this.msgBox.showError('Não é possível iniciar a construção do formulário. Método \'configureContent\' não foi implementado.');
        return false;
      }
    } catch (error) {
      this.msgBox.showError(error.message);
      return false;
    }
  }

  /* ---------------------------------------------------------------------------------------------------------------- */
  // LISTENERS



  onSearchInputList(event) {
    event.stopPropagation();
    const input = event.target;
    // Verifica se o valor do input corresponde a uma opção da datalist
    const options = document.querySelectorAll(`datalist#${input.name} option`);
    let isValid = false;
    options.forEach(option => {
      if (option.value === input.value) {
        isValid = true;
      }
    });

    // Aplica a cor de fundo personalizada se o valor for válido
    if (isValid) {
      input.style.backgroundColor = '#e0f7fa'; // Cor personalizada
    } else {
      input.style.backgroundColor = ''; // Volta ao padrão
    }
  }

  /* ---------------------------------------------------------------------------------------------------------------- */
  // UTILITÁRIOS  

}
