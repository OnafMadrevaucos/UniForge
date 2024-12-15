import BaseDialog from "./baseDialog.js";

/**
 * Classe responsável por criar e manipular um diálogo interativo na página.
 * O diálogo pode ser configurado com título, botões e conteúdo.
 * Suporta funcionalidades de arraste e interação com botões de confirmação.
 * 
 * @class Dialog
 */
export default class Dialog extends BaseDialog{
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
     * Função executada se o dialog fechar inesperadamente.
     * @type {Function}
     */
    this.abort = abort;    

    /**
     * Opções adicionais fornecidas ao diálogo.
     * @type {Object}
     */
    this.options = options;    

    this._prepareDialog();
  }

  /**
   * Cria a estrutura do diálogo, incluindo overlay, cabeçalho, corpo e botões.
   * @private
   */
  async _prepareDialog() {
    const overlay = document.createElement("div");
    overlay.className = "overlay dialog-overlay";
    document.body.appendChild(overlay);

    this.overlay = overlay; // Armazena o overlay para exibição posterior. 

    // Obtem o corpo do dialog.
    if (this.getBody) {
      this.bodyHTML = await this.getBody(); // Conteúdo do corpo do diálogo.
    } else if (options?.prompt) {
      this.bodyHTML = this.options.prompt; // Conteúdo do corpo do diálogo.
    } else {
      console.warn('Corpo HTML do dialog está vazio. Método \'getBody()\' não implementado.');
      this.bodyHTML = '';
    }

    // Permite fechar o diálogo clicando no overlay
    overlay.addEventListener("click", (event) => {
      if (!event.target.classList.contains('overlay')) return;
      this.close();
      this.abort();
    });

    // Container do diálogo
    this.dialog = document.createElement("div");
    this.dialog.id = 'dialog';
    this.dialog.className = "dialog";

    // Cabeçalho
    const titleHeader = document.createElement('div');
    titleHeader.className = 'header';

    titleHeader.addEventListener('mousedown', (event) => { this.onMouseDown(event); });
    document.addEventListener('mousemove', (event) => { this.onMouseMove(event); });
    document.addEventListener('mouseup', () => { this.onMouseUp(); });

    // Título do diálogo
    const title = document.createElement("h2");
    title.textContent = this.title;

    titleHeader.appendChild(title);

    // Corpo do diálogo
    const dialogBody = document.createElement("div");
    dialogBody.className = 'body';
    dialogBody.innerHTML = this.bodyHTML.outerHTML ?? this.bodyHTML;

    // Container dos botões
    const buttons = document.createElement("div");
    buttons.className = 'buttons';

    // Criar os botões
    Object.values(this.buttons).forEach((button) => {
      const newButton = document.createElement("button");
      newButton.innerHTML = `<i class='${button.icon}'></i> ${button.label}`;
      newButton.className = button.className || "dialog-button";

      newButton.addEventListener("click", (event, params={}) => { 
        this.close();
        button.callback(event, ...Object.values(params)); 
      });
      
      buttons.appendChild(newButton);
    });

    this.dialog.appendChild(titleHeader);
    this.dialog.appendChild(dialogBody);
    this.dialog.appendChild(buttons);

    this.overlay.appendChild(this.dialog);
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
}
