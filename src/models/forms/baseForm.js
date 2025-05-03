
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
  constructor(title, options = {extraClasses: []}) {    
    super(title, options);    

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
  * @overload
  * @inheritdoc
  */
  get defaultOptions() {
    const config = super.defaultOptions;   
    return uniforge.utils.mergeObjects(config,{
      style: Application.Styles.FORM,
      classes: [...config.classes, 'maximized']
    });
  }

  /**
   * Obtém o container principal do formulário.
   * 
   * @returns {HTMLElement}  - O container principal do formulário.
   */
  get form() {
    return this.ui.app;
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

  /**
  * Cria a estrutura específica do formulário.
  * @interface
  */
  async prepareDerivedTemplate(form, header, main) {
    header.innerHTML = `
            <span class="${this.style} title">{{title}}</span>
            <switch id="deleteSwitch" class="hidden"></switch>
            <a id="${this.style}Close-${this.uuid}" class="close-button flexcol"><i class="fas fa-circle-xmark"></i></a>
        `;
        
    const mainContent = await uniforge.utils.loadTemplate(this.template);
    main.appendChild(mainContent);

    form.appendChild(header);
    form.appendChild(main);
  }

  /* ---------------------------------------------------------------------------------------------------------------- */
  // INTERFACE DE USUÁRIO  
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
  async show(forceLoad = false) {        
    await super.show(forceLoad);

    this._activateForm();
  }

  /**
   * @inheritdoc
   */
  close() {  
    const tabs = document.querySelectorAll('.tab');
    let sourceFinded = false;
    
    tabs.forEach((tab) => {
      if(tab.getAttribute('data-target') === this.type) {
        tab.classList.remove('disabled');
        sourceFinded = true;
      }
    });

    if(!sourceFinded) {    
      const buttonsTool = document.querySelector('.buttons-tool');
      const buttons = buttonsTool.querySelectorAll('button');
      buttons.forEach((button) => {
        if(button.getAttribute('data-target') === this.type) button.classList.remove('disabled');
      });
    }

    super.close();
  }

  /**
   * Oculta o formulário e o overlay, limpando seu conteúdo.
   */
  hideForm() {
    this.close();
  }
  /* ---------------------------------------------------------------------------------------------------------------- */
  // LISTENERS
  /**
   * Configura ouvintes de eventos básicos para o formulário.
   * @private
   */
  activateBaseListeners() {
    super.activateBaseListeners();

    const app = this.ui.app;
    app.addEventListener('mousedown', (event) =>{ this._onAppActive.bind(this)(event); });

    const header = this.ui.header;
    header.addEventListener('dblclick', (event) => { this._onHeaderDblClick.bind(this)(event); });
  }

  _onMouseDown(event) {
    super._onMouseDown(event);

    this._activateForm();
  }

  _onAppActive(event) {
    const clickedApp = event.target.closest('.container');
    const clickedAppUuid = clickedApp.id?.split('-')[1];
    if(clickedAppUuid === uniforge.form?.uuid) return;

    this._activateForm();
  }

  _onHeaderDblClick(event) {
    event.stopPropagation();
    this.ui.app.classList.toggle('maximized');
    this.ui.overlay.classList.toggle('hidden');

    if(this.ui.app.classList.contains('maximized')) this._activateForm();
  }

  _onSearchInputList(event) {
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

          return true;
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
      this.msgBox.showError(error.message, error);
      return false;
    }
  }
  
  /**
   * Adiciona um listener de eventos ao aplicativo de interface do usuário.
   * @param {string} event - O nome do evento a ser adicionado.
   * @param {Function} callback - A função a ser executada quando o evento for disparado.
   */
  addEventListener(event, callback) {
    if(!this.rendered) throw new Error('O formulário ainda não foi renderizado e não pode receber ouvintes.');
    this.ui.app.addEventListener(event, callback);
  }

  /* ---------------------------------------------------------------------------------------------------------------- */
  // UTILITÁRIOS
  _activateForm() {
    const activeApps = document.querySelectorAll('.container.active');
    activeApps.forEach((app) => app.classList.remove('active'));

    this.ui.app.classList.add('active');
    uniforge.form = this;
  }
  
}
