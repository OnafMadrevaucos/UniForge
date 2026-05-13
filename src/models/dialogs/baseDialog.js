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
         * Função a ser executada se o diálogo for fechado inesperadamente.
         * @type {Function}
        */
        this.abort = data.abort;

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

        this._closed = false;
    }

    /* ---------------------------------------------------------------------------------------------------------------- */
    // GETTERS E SETTERS
    /**
     * @overload
     * @inheritdoc
    */
    get defaultOptions() {
        const config = super.defaultOptions;
        return uniforge.utils.mergeObjects(config, {
            style: Application.Styles.DIALOG,
            classes: [...config.classes, 'flexcol']
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
     * Retorna um objeto com seletores para elementos da aplicação.
     * 
     * @returns {Object} - Um objeto com as seguintes propriedades:
     *  - overlay: Seletor para o elemento overlay da aplicação.
     *  - app: Seletor para o elemento container da aplicação.
     *  - header: Seletor para o elemento header da aplicação.
     *  - main: Seletor para o elemento main da aplicação.
     *  - close_btn: Seletor para o elemento de fechar a aplicação.
     */
    get query() {
        return {
            overlay: this._buildSelector('Overlay'),
            ...super.query
        };
    }

    /**
    * Propriedade que retorna um objeto com referências para elementos do formulário.
    * 
    * @returns {Object}  - Um objeto com as seguintes propriedades:
    *  - overlay: O elemento HTML que contém o formulário.
    *  - form: O elemento HTML que representa o formulário.
    *  - header: O elemento HTML que contém o título do formulário.
    *  - close_btn: O elemento HTML que fecha o formulário.
    *  - content: O elemento HTML que contém o conteúdo do formulário.
   */
    get ui() {
        return {
            overlay: document.querySelector(this.query.overlay),
            ...super.ui
        };
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

    /**@inheritdoc */
    async prepareTemplate() {
        await super.prepareTemplate();

        const overlay = document.createElement('div');
        overlay.id = `${this.style}Overlay-${this.uuid}`;
        overlay.classList.add('overlay', `${this.style}-overlay`, 'flexrow');

        this.html.overlay = overlay.outerHTML;
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
     * Cria a estrutura específica do diálogo, incluindo os seus botões.
     * @interface
     */
    async refreshDerivedTemplate() {
        // Obtem os elementos HTML para renderização.
        const main = this.ui.main;

        const html = await this._prepareBody();
        main.innerHTML = html;

        return main;
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

        // Se o diálogo implementa 'activateListeners', chama o método.
        if (this.activateListeners) this.activateListeners();
    }

    async submit(button, event) {
        const target = this.dialog;
        try {
            if (button?.callback) {
                const closing = button.callback.call(this, target, event);
                if (closing || this.alwaysClose) {
                    this.state.secureClose = true;
                    this.close();
                };
            } else {
                this.msgBox.showWarning('Botão não possui callback definido.');
                this.close();
            }
        } catch (error) {
            this.msgBox.showError(error.message, error);
        }
    }

    close() {
        // Se o diálogo ja foi fechado, ignora.
        if (this._closed) return; 

        // Remove o diálogo do DOM, caso ele ainda exista.
        if (this.element) {
            this.element.remove();
            this.element = null;
        }

        // Remove o overlay do DOM, caso ele ainda exista.
        this.ui.overlay.remove();

        // Após executar o processo de fechamento, marca o diálogo como fechado para evitar múltiplas execuções.
        this._closed = true;

        // Chama o método de fechamento da classe pai para garantir que quaisquer processos adicionais sejam executados.
        super.close();
    }

    hookToDOM() {
        this.#hookOverlayToDOM();
        super.hookToDOM();
    }

    #hookOverlayToDOM() {
        const parser = new DOMParser();
        let doc = null;

        // Verifica se o overlay da aplicação foi renderizado corretamente.
        if (!this.html.overlay || this.html.overlay.isEmpty())
            throw new Error('O formulário precisa ter um overlay.');

        // Obtém o elemento HTML do overlay da aplicação.
        doc = parser.parseFromString(this.html.overlay, 'text/html');
        const overlay = doc.body.firstChild;

        // Adiciona o overlay ao DOM.
        document.body.appendChild(overlay);
    }

    /* ---------------------------------------------------------------------------------------------------------------- */
    // LISTENERS

    /**
    * Configura ouvintes de eventos básicos para o dialog.
    * @protected
    */
    activateBaseListeners() {
        super.activateBaseListeners();

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
        // Encontra o botão clicado.
        const buttonElement = event.target.closest('.dialog-button');

        // Verifica se o elemento encontrado é o botão.
        if (!buttonElement) return;

        const id = buttonElement.id; // Pega o ID do elemento <button>
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