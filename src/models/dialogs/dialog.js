import BaseDialog from "./baseDialog.js";

/**
 * Classe responsável por criar e manipular um diálogo interativo na página.
 * O diálogo pode ser configurado com título, botões e conteúdo.
 * Suporta funcionalidades de arraste e interação com botões de confirmação.
 * 
 * @class Dialogs
 */
export default class Dialogs extends BaseDialog {
  static Type = {
    CONFIRM: 0,
    SECURE: 1,
    IMAGE: 2
  };

  /**
   * Cria uma instância do diálogo.
   * 
   * @constructor
   * @param {DialogData} data                   - Dados do diálogo.
   * @param {DialogOptions} options             - Opções adicionais do diálogo.
   * @param {Object} dialogObject               - Configurações iniciais do diálogo.
   * @param {string} dialogObject.title         - Título do diálogo (padrão: "Dialogs").
   * @param {Object} dialogObject.buttons       - Conjunto de botões a serem exibidos no diálogo.
   * @param {Function} dialogObject.abort       - Função a ser executada se o dialog fechar inesperadamente.   
   * @param {Object} options                    - Opções adicionais, como o conteúdo do corpo do diálogo.
   * @param {Function} options.hasTemplate      - Flag que indica se o diálogo deve possuir um template.
   */
  //constructor({ title = "Dialog", buttons = {}, abort = null}, options = { hasTemplate = false }) {
  constructor(data, options = {alwaysOnTop: true}) {
    super(data, options);

    this.type = options?.type ?? Dialogs.Type.CONFIRM;
  }

  get ConfirmBody() {
    return this.options?.prompt ?? '';
  }

  get ImageBody() {
    // Cria o body
    const body = document.createElement('div');
    body.className = 'image-dialog flexcol';

    const img = document.createElement('img');
    img.src = this.options.imageUrl;

    img.addEventListener('load', () => {
      this._centerDialog();
    });

    body.appendChild(img);

    return body.outerHTML;
  }

  get SecureConfirmBody() {
    // Cria o body
    const body = document.createElement('div');
    body.className = 'secure-dialog flexcol';

    const randomString = uniforge.utils.randomString(5, true);
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

    return body.outerHTML;
  }

  /**
  * Renderiza o corpo do diálogo.
  * 
  * @async
  * @returns {HTMLElement} - O conteiner com os botões.
  */
  async _prepareBody() {
    try {
      switch (this.type) {
        case Dialogs.Type.SECURE:
          return this.SecureConfirmBody;
        case Dialogs.Type.IMAGE:
          return this.ImageBody;
        default:
          return this.ConfirmBody;
      }
    } catch (error) {
      this.msgBox.showError(error.message, error);
    }
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
      const dialog = new this({
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
        abort: () => reject(false)
      }, { prompt: message, alwaysClose: true});      
      dialog.show(true);
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
    return new Promise((resolve, reject) => {
      const dialog = new this({
        title: title,
        buttons: {
          cancel: {
            label: "Cancelar",
            icon: "fas fa-xmark",
            callback: () => {
              resolve(false);
              return true;
            }
          },
          confirm: {
            label: "Confirmar",
            icon: "fas fa-check",
            callback: () => {
              const input = document.querySelector('#secureInput');
              const secureText = input.dataset.text;
              if(input.value === secureText) {
                resolve(true);
                return true;
              } else {
                uniforge.msgBox.showWarning('O texto informado não corresponde ao texto de segurança.');
                return false;
              }
            }
          }
        },
        abort: () => resolve(null)
      }, { hasTemplate: false, type: Dialogs.Type.SECURE });
      dialog.show(true);
    });
  }

  /**
   * Exibe uma caixa de diálogo de exibição de informação com um botão (Ok).
   * 
   * @static
   * @param {string} title - Título do diálogo de confirmação.
   * @param {string} message - Mensagem a ser exibida no corpo do diálogo.
   * @returns {Promise} Retorna uma promessa que é resolvida se o usuário clicar em "Sim" ou rejeitada se clicar em "Não".
   */
  static async inform(title, message) {
    return new Promise((resolve, reject) => {      
      const dialog = new this({
        title: title,
        buttons: {
          ok: {
            label: "OK",
            icon: "fas fa-check",
            callback: () => resolve(true)
          }
        },
        abort: () => reject(true)
      }, { prompt: message, alwaysClose: true, width: '300px'});      
      dialog.show(true);
    });
  }

  /**
   * Exibe uma caixa de diálogo de confirmação com dois botões (Sim e Não).
   * 
   * @static
   * @param {string} title - Título do arquivo de imagem exibido.
   * @param {URL} imageUrl - Url do arquivo de imagem a ser exibido.
   * @returns {Promise}    - Retorna uma promessa que é resolvida se o usuário clicar em "Fechar".
   */
  static async showImagem(title, imageUrl) {
    return new Promise((resolve, reject) => {
      const dialogData = {
        title: title,
        abort: () => resolve()
      };
      const dialog = new this(dialogData, { 
        hasTemplate: false,
        imageUrl, 
        width: '75%',
        type: Dialogs.Type.IMAGE,
        alwaysClose: true 
      });
      dialog.show(true);
    });
  }
}
