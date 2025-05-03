import Application from "../application.js";

export default class BaseDialog extends Application {
    /**
     * Cria uma instância do diálogo.
     * 
     * @constructor
     * @param {DialogData} data                   - Dados do diálogo.
     * @param {DialogOptions} options             - Opções adicionais do diálogo.
     * @param {Object} dialogObject               - Configurações iniciais do diálogo.
     * @param {string} dialogObject.title         - Título do diálogo (padrão: "Dialog").
     * @param {Object} dialogObject.buttons       - Conjunto de botões a serem exibidos no diálogo.
     * @param {Function} dialogObject.abort       - Função a ser executada se o dialog fechar inesperadamente.   
     * @param {Object} options                    - Opções adicionais, como o conteúdo do corpo do diálogo.
     * @param {Function} options.hasTemplate      - Flag que indica se o diálogo deve possuir um template.
     */
    //constructor({ title = "Dialog", buttons = {}, abort = null}, options = { hasTemplate = false }) {
    constructor(data, options = {}) {
        const title = data.title || "Caixa de Diálogo";

        super(title, { style: Application.Styles.DIALOG, ...options }); // Chama o construtor da classe pai (Application) para gerar um UUID único.

        // Atribui os dados do diálogo.
        this.data = data;

        /** 
         * Conjunto de botões do diálogo.
         * @type {Object<string, {label: string, icon: string, callback: Function}>}
         */
        this.buttons = data.buttons;

        /**
         * Corpo do diálogo (HTML ou string).
         * @type {HTMLElement|string}
         */
        this.bodyHTML = '';

        this.alwaysOnTop = options?.alwaysOnTop ?? false;

        this.alwaysClose = options?.alwaysClose ?? false;      
    }

    /* ---------------------------------------------------------------------------------------------------------------- */
    // GETTERS E SETTERS
    /**
     * @overload
     * @inheritdoc
    */
    get defaultOptions() {   
        const config = super.defaultOptions;   
            return uniforge.utils.mergeObjects(config,{
              style: Application.Styles.DIALOG,
              classes: [...config.classes,'flexcol']
        });
    }
    /**
    * Obtém o container principal do diálogo.
    * 
    * @returns {HTMLElement}  - O container principal do diálogo.
    */
    get dialog() {
        return this.ui.app;
    }        

    /**
     * Renderiza o corpo do diálogo.
     * 
     * @async
     * @returns {HTMLElement} - O conteiner com os botões.
     */
    async _prepareBody() {
        try {
            const rawHtml = await uniforge.utils.loadTemplate(this.template);

            const html = uniforge.parser.parseHTML(rawHtml.outerHTML, this.data);
            return html;
        } catch (error) {
            this.msgBox.showError(error.message, error);
        }
    }

    /**
     * Renderiza o conteiner com os botões enviados nas opções iniciais do diálogo.
     * 
     * @returns {HTMLElement} - O conteiner com os botões.
     */
    _prepareButtons() {
        // Container dos botões
        const buttons = document.createElement("div");
        buttons.id = 'dialogButtons-' + this.uuid;
        buttons.className = 'buttons';

        // Criar os botões
        Object.entries(this.buttons).forEach(([id, b]) => {
            const button = document.createElement("button");
            button.id = id;
            button.innerHTML = `<i class='${b.icon}'></i> ${b.label}`;
            button.className = `dialog-button${b.className ? ` ${b.className}` : ''}`;

            buttons.appendChild(button);
        });

        return buttons;
    }    

    /**
     * Cria a estrutura específica do diálogo, incluindo os seus botões.
     * @interface
     */
    async prepareDerivedTemplate(dialog, header, main) {
        dialog.method = 'dialog';

        header.innerHTML = `
            <h2>${this.title}</h2>
            <a id="${this.style}Close-${this.uuid}" class="close-button"><i class="fas fa-circle-xmark"></i></a>
        `;

        const html = await this._prepareBody();
        main.innerHTML = html;

        const buttons = this._prepareButtons();

        dialog.appendChild(header);
        dialog.appendChild(main);
        dialog.appendChild(buttons);
    }

    /**
    * Exibe o diálogo na página.
    * @inheritdoc
    */
    async render() {
        await super.render();
        return true;
    }
    
    /**
    * Inicia a construção do diálogo.
    * @inheritdoc
    */
    async initialize() {
        // Se o diálogo implementa 'configureElements', chama o método.
        if (this.configureElements) await this.configureElements();
        
        // Centralizar o diálogo no parentElement
        this._centerDialog();        

        this.activateListeners();
    } 

    submit(button, event) {
        const target = this.dialog;
        try {
            if (button?.callback) {
                const closing = button.callback.call(this, target, event);
                if (closing || this.alwaysClose) this.close();
            } else {
                this.msgBox.showWarning('Botão não possui callback definido.');
                this.close();
            }
        } catch (error) {
            this.msgBox.showError(error.message, error);
        }
    } 

    /**
    * Configura ouvintes de eventos básicos para o dialog.
    * @protected
    */
    activateListeners() {  
        const main = this.ui.main;
        main.addEventListener('submit', (event) => { event.preventDefault(); });

        // Permite fechar o diálogo clicando no overlay
        this.ui.overlay.addEventListener("click", (event) => { this._onOverlayClick.bind(this)(event); });

        const buttons = this.querySelectorAll('.dialog-button');
        Object.values(buttons).forEach(button => {
            button.addEventListener("click", (event) => { this._onClickButton.bind(this)(event); });
        });
    }

    _onOverlayClick(event) {
        if (!event.target.classList.contains('overlay')) return;            
        this.close();
    }

    _onClickButton(event) {
        const id = event.target.id;
        const button = this.buttons[id];
        this.submit(button, event);
    }

    /**
     * Limita a posição X do diálogo dentro dos limites do contêiner pai.
     * 
     * @param {number} n - Valor da posição X.
     * @returns {number} A posição X limitada.
     * @private
     */
    _clampX(n) {
        const parentRect = this.parentElement.getBoundingClientRect();
        const dialogRect = this.dialog.getBoundingClientRect();

        return Math.min(Math.max(n, -parentRect.width / 2), (parentRect.width / 2 - dialogRect.width));
    }

    /**
     * Limita a posição Y do diálogo dentro dos limites do contêiner pai.
     * 
     * @param {number} n - Valor da posição Y.
     * @returns {number} A posição Y limitada.
     * @private
     */
    _clampY(n) {
        const parentRect = this.parentElement.getBoundingClientRect();
        const dialogRect = this.dialog.getBoundingClientRect();

        return Math.min(Math.max(n, -parentRect.height / 2), (parentRect.height / 2 - dialogRect.height));
    }
}