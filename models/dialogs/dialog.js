import BaseDialog from "./baseDialog.js";

/**
 * Classe responsável por criar e manipular um diálogo interativo na página.
 * O diálogo pode ser configurado com título, botões e conteúdo.
 * Suporta funcionalidades de arraste e interação com botões de confirmação.
 * 
 * @class Dialog
 */
export default class Dialog extends BaseDialog {
  /**
   * Cria uma instância do diálogo.
   * 
   * @constructor
   * @param {Object} dialogObject - Configurações iniciais do diálogo.
   * @param {string} dialogObject.title - Título do diálogo (padrão: "Dialog").
   * @param {Object} dialogObject.buttons - Conjunto de botões a serem exibidos no diálogo.
   * @param {Function} dialogObject.abort - Função a ser executada se o dialog fechar inesperadamente.
   * @param {Object} options - Opções adicionais, como o conteúdo do corpo do diálogo.
   */
  constructor({ title = "Dialog", buttons = {}, abort = null }, options = {}) {
    super();
    /** 
     * Título do diálogo.
     * @type {string}
     */
    this.title = title;

    /** 
     * Conjunto de botões do diálogo.
     * @type {Object<string, {label: string, icon: string, callback: Function}>}
     */
    this.buttons = buttons;

    /**
     * Corpo do diálogo (HTML ou string).
     * @type {HTMLElement|string}
     */
    this.bodyHTML = '';

    /**
     * Gerenciador de conexão de Banco de Dados.
     * @type {DBManager}
     */
    this.db = CONFIG.db;

    /** 
     * Função executada se o dialog fechar inesperadamente.
     * @type {Function}
     */
    this.abort = abort;

    /**
     * Se o dialog deve assumir as configurações seguras.
     * @type {Object}
     */
    this.secure = options?.secure ?? false;

    /**
     * Opções adicionais fornecidas ao diálogo.
     * @type {Object}
     */
    this.options = options;       
  }

  async getBody() {
    if(this.secure) return this.getSecureConfirmBody();
    else return this.getConfirmBody();
  }

  getConfirmBody() {
    return this.options?.prompt ?? '';
  }

  getSecureConfirmBody() {
    // Cria o body
    const body = document.createElement('div');
    body.className = 'secure-dialog flexcol';

    const randomString = CONFIG.utils.generateRandomString(5, true);
    const hintMessage = `<p>Se é isso que deseja, por favor, copie o seguinte trecho no campo abaixo: <span class='secure-text'>'${randomString}'</span></p>`;

    const textGroup = document.createElement('div');
    textGroup.className = 'data-group text hinted';

    const promptMessage = document.createElement('span');
    promptMessage.textContent = 'Resetar o banco de dados irá apagar permanentmente todos os dados registrados até o momento.';

    const inputHint = document.createElement('label');
    inputHint.id = 'inputHint';
    inputHint.className = 'input-hint';
    inputHint.htmlFor = 'secureInput';
    inputHint.innerHTML = hintMessage;

    const secureInput = document.createElement('input');
    secureInput.id = 'secureInput';
    secureInput.type = 'text';
    secureInput.className = 'dialog-input';
    secureInput.placeholder = 'Digite o trecho...';
    secureInput.dataset.text = randomString; 

    textGroup.appendChild(promptMessage);
    textGroup.appendChild(inputHint);
    textGroup.appendChild(secureInput);

    body.appendChild(textGroup);

    return body;
  }

  /**
   * Cria a estrutura do diálogo, incluindo overlay, cabeçalho, corpo e botões.
   * @private
   */
  async _prepare() {
    const options = this.options ?? {};
    const overlay = document.createElement("div");
    overlay.className = "overlay dialog-overlay";
    document.body.appendChild(overlay);    

    this.overlay = overlay; // Armazena o overlay para exibição posterior. 

    // Obtem o corpo do dialog.
    this.bodyHTML = await this.getBody(); // Conteúdo do corpo do diálogo.      

    // Container do diálogo
    this.dialog = document.createElement("div");
    this.dialog.id = 'dialog';
    this.dialog.className = 'dialog flexcol';

    this.dialog.style = `height: ${this.options.height ?? 'auto'}; width: ${this.options.width ?? 'auto'}`;

    // Cabeçalho
    const titleHeader = document.createElement('div');
    titleHeader.className = 'header flexrow';

    // Título do diálogo
    const title = document.createElement("h2");
    title.textContent = this.title;

    const closeButton = document.createElement("a");
    closeButton.className = 'close-button';
    closeButton.innerHTML = '<i class="fas fa-xmark"></i>';

    titleHeader.appendChild(title);
    titleHeader.appendChild(closeButton);

    // Corpo do diálogo
    const dialogBody = document.createElement("div");
    dialogBody.className = 'body flexcol';
    dialogBody.innerHTML = this.bodyHTML.outerHTML ?? this.bodyHTML;
    
    // Container dos botões
    const buttons = document.createElement("div");
    buttons.className = 'buttons';

    // Criar os botões
    Object.entries(this.buttons).forEach(([id, button]) => {
      const newButton = document.createElement("button");
      newButton.id = id;
      newButton.innerHTML = `<i class='${button.icon}'></i> ${button.label}`;
      newButton.className = button.className || "dialog-button";     

      newButton.dataset.canClose = button.canClose ?? 'true';

      buttons.appendChild(newButton);
    });

    this.dialog.appendChild(titleHeader);
    this.dialog.appendChild(dialogBody);
    this.dialog.appendChild(buttons);

    this.overlay.appendChild(this.dialog);
  }

  /**
    * Exibe o diálogo na página.
    */
  render() { 
    // Prepara o dialog para em seguida renderizá-lo.
    this._prepare().then(result =>{
      super.render();
      // Centralizar o diálogo no parentElement
      this._centerDialog();

      this._activateListeners();
    }); 
  }

  /**
    * Fecha o diálogo e remove o overlay da página.
  */
  close(){
    if(this.abort) this.abort();    
    super.close();
  }

  /**
   * Seleciona o primeiro elemento correspondente ao seletor dentro do diálogo.
   * 
   * @param {string} selector - Seletor CSS.
   * @returns {HTMLElement|null} O primeiro elemento encontrado ou null.
   */
  querySelector(selector) {
    return this.dialog.querySelector(selector);
  }

  /**
   * Seleciona todos os elementos correspondentes ao seletor dentro do diálogo.
   * 
   * @param {string} selector - Seletor CSS.
   * @returns {NodeListOf<HTMLElement>} Lista de elementos encontrados.
   */
  querySelectorAll(selector) {
    return this.dialog.querySelectorAll(selector);
  }

  /**
   * Centraliza o diálogo ao element pai.
   * 
   * */
  _centerDialog() {
    if (this.parentElement && this.dialog) {
      const parentRect = this.parentElement.getBoundingClientRect();
      const dialogRect = this.dialog.getBoundingClientRect();

      let centerX = 0;
      let centerY = 0;

      if(parentRect.x != 0 && parentRect.y != 0) {
        // Calcula as coordenadas para centralizar o diálogo
        centerX = parentRect.left + (parentRect.width - dialogRect.width) / 2;
        centerY = parentRect.top + (parentRect.height - dialogRect.height) / 2;
      } else {
        // Calcula as coordenadas para centralizar o diálogo
        centerX = (dialogRect.width) / 2;
        centerY = (dialogRect.height) / 2;
      }

      // Define a posição do diálogo
      this.dialog.style.position = "absolute";
      this.dialog.style.left = `${centerX}px`;
      this.dialog.style.top = `${centerY}px`;
    }
  }

  /**
    * Configura ouvintes de eventos básicos para o dialog.
    * @protected
    */
  _activateListeners(){
    super._activateListeners();
    // Permite fechar o diálogo clicando no overlay
    this.overlay.addEventListener("click", (event) => {
      if (!event.target.classList.contains('overlay')) return;      
      this.abort();
      this.close();
    });
    const buttons = this.querySelectorAll('.dialog-button');
    Object.values(buttons).forEach(button => {
      button.addEventListener("click", (event, params = {}) => {        
        this.buttons[button.id].callback(event, ...Object.values(params));
        if(this.querySelector(`#${button.id}`).dataset?.canClose === 'true')
          this.close();
      });
    });
    
    const closeButton = this.querySelector('.close-button');
    closeButton.addEventListener('click', (event) => {
      event.stopPropagation();
      this.close();
    });
    
  }

  /**
   * Configura ouvintes de eventos para elementos no diálogo.
   * 
   * @param {Array<{element: HTMLElement, event: string, callback: Function}>} listeners - Lista de objetos contendo o elemento, evento e callback.
   */
  configureListeners(listeners = []) {
    listeners.forEach(item => {
      item.element.addEventListener(item.event, item.callback);
    });
  }

  /**
   * Exibe uma caixa de diálogo de confirmação com dois botões (Sim e Não).
   * 
   * @static
   * @param {string} title - Título do diálogo de confirmação.
   * @param {string} message - Mensagem a ser exibida no corpo do diálogo.
   * @returns {Promise} Retorna uma promessa que é resolvida se o usuário clicar em "Sim" ou rejeitada se clicar em "Não".
   */
  static async confirm(title, message) {
    return new Promise((resolve, reject) => {
      const dialogData = {
        title: title,
        buttons: {
          no: {
            label: "Não",
            icon: "fas fa-xmark",
            callback: () => resolve(false)
          },
          yes: {
            label: "Sim",
            icon: "fas fa-check",
            callback: () => resolve(true)
          }
        },
        abort: () => resolve(false)
      };
      const dialog = new this(dialogData, { prompt: message });
      dialog.render();
    });
  }

  /**
   * Exibe uma caixa de diálogo de confirmação com dois botões (Sim e Não).
   * 
   * @static
   * @param {string} title - Título do diálogo de confirmação.
   * @param {string} message - Mensagem a ser exibida no corpo do diálogo.
   * @returns {Promise} Retorna uma promessa que é resolvida se o usuário clicar em "Sim" ou rejeitada se clicar em "Não".
   */
  static async secureConfirm(title) {
    function onSecureConfirm(event, resolve) {
      const confirmButton = event.target.closest('button');
      const input = document.querySelector('#secureInput');
      const secureText = input.dataset.text;

      if(input.value === secureText) {
        resolve(true);
        confirmButton.dataset.canClose = 'true';
      } else CONFIG.msgBox.showWarning('O texto informado não corresponde ao texto de segurança.');
      
    }
    return new Promise((resolve, reject) => {
      const dialogData = {
        title: title,
        buttons: {
          cancel: {
            label: "Cancelar",
            icon: "fas fa-xmark",
            callback: () => resolve(false)
          },
          confirm: {
            label: "Confirmar",
            icon: "fas fa-check",            
            callback: (event) => onSecureConfirm(event, resolve),
            canClose: 'false'
          }
        },
        abort: () => resolve(false)
      };
      const dialog = new this(dialogData, { secure: true });
      dialog.render();
    });
  }
}
