export default class BaseDialog {
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
    constructor(data, options) {
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

        /**
         * Gerenciador de conexão de Banco de Dados.
         * @type {DBManager}
         */
        this.db = uniforge.db;

        /** 
         * Função executada se o dialog fechar inesperadamente.
         * @type {Function}
         */
        this.abort = data.abort;
        /**
        * Opções adicionais fornecidas ao diálogo.
        * @type {Object}
        */
        this.options = options;

        /** 
         * Estado interno para rastrear a posição e deslocamento do diálogo.
         * @type {Object}
         * @property {boolean} isDragging - Indica se o diálogo está sendo arrastado.
         * @property {number} xDiff - Diferença de posição horizontal do mouse.
         * @property {number} yDiff - Diferença de posição vertical do mouse.
         * @property {number} x - Posição horizontal do diálogo.
         * @property {number} y - Posição vertical do diálogo.
         */
        this.state = {
            isDragging: false,
            xDiff: 5,
            yDiff: 5,
            x: 0,
            y: 0
        };

        /** 
       * Elemento DOM do diálogo.
       * @type {HTMLElement|null}
       */
        this.dialog = this.ui.dialog;

        /**
        * Objeto de controle global para mensagens ao usuário.
        * @type {object}
        */
        this.msgBox = uniforge.msgBox;

        /** 
         * Estado de arraste do diálogo.
         * @type {boolean}
         */
        this.isDragging = false;        
    }

    // Propriedade do template Handlebars do dialog1.
    #template;

    /* ---------------------------------------------------------------------------------------------------------------- */
    // GETTERS E SETTERS
    get title() {
        return this.data.title || "Caixa de Diálogo";
    }
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
        this.#template = `./templates/dialogs/${value}.html`;
    }

    get hasTemplate() {
        return this.template ? true : false;
    }

    /**
   * Obtém o elemento pai onde o diálogo será posicionado.
   * @async
   * @returns {HTMLElement}  - Elemento pai onde o diálogo será posicionado.
   */
    get parentElement() {  
        return document.querySelector('#formContent'); 
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
            overlay: document.getElementById('dialogOverlay'),
            dialog: document.getElementById('dialog'),
            header: document.getElementById('dialogHeader'),
            body: document.getElementById('dialogBody'),
            buttons: document.getElementById('dialogButtons')
        };
    }

    /**
   * Cria a estrutura do diálogo, incluindo overlay, cabeçalho, corpo e botões.
   * @private
   */
    async _prepare() {
        const overlay = document.createElement("div");
        overlay.id = 'dialogOverlay';
        overlay.className = "overlay dialog-overlay";
        document.body.appendChild(overlay);

        this.overlay = overlay; // Armazena o overlay para exibição posterior.

        // Container do diálogo
        this.dialog = document.createElement("div");
        this.dialog.id = 'dialog';
        this.dialog.className = 'dialog flexcol';

        this.dialog.style = `height: ${this.options.height ?? 'auto'}; width: ${this.options.width ?? 'auto'}`;

        // Cabeçalho
        const titleHeader = document.createElement('div');
        titleHeader.id = 'dialogHeader';
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
        dialogBody.id = 'dialogBody';
        dialogBody.className = 'body flexcol';

        // Container dos botões
        const buttons = document.createElement("div");
        buttons.id = 'dialogButtons';
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
    async render(centralize = true) {
        // Prepara o dialog para em seguida renderizá-lo.
        const result = await this._prepare();

        // Renderiza o diálogo especializado. Diálogos simples não possuem templates HTML.
        if (this.hasTemplate && !this.template) {

            this.msgBox.showError('O diálogo não tem um template válido a ser carregado.');
            return false;
        }

        await this.renderDialog();
        document.body.appendChild(this.overlay);
        this._renderWindow();

        if (centralize) {
            // Centralizar o diálogo no parentElement
            this._centerDialog();
        }

        this._activateListeners();

        return true;
    }

    /**
     * Renderiza o diálogo com o template Handlebars.
     * Se o diálogo possuir um template, ele é carregado e renderizado
     * no corpo do diálogo.
     * @async
     * @throws {Error} - Se ocorrer um erro ao carregar o template.
     */
    async renderDialog() {
        try {
            const rawHtml = await uniforge.utils.loadTemplate(this.template);

            const html = uniforge.parser.parseHTML(rawHtml, this.data);
            this.ui.body.innerHTML = html;
        } catch (error) {
            this.msgBox.showError(error);
        }
    }

    /**
    * Fecha o diálogo e remove o overlay da página.
    */
    close() {
        if (this.abort) this.abort();

        if (this.dialog) {
            this.dialog.remove();
            this.dialog = null;
        }

        const overlay = document.querySelector(".dialog-overlay");
        if (overlay) overlay.remove();
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
    * Configura ouvintes de eventos básicos para o dialog.
    * @protected
    */
    _activateListeners() {
        const titleHeader = this.querySelector('.header');
        titleHeader.addEventListener('mousedown', (event) => { this.onMouseDown(event); });

        document.addEventListener('mousemove', (event) => { this.onMouseMove(event); });
        document.addEventListener('mouseup', () => { this.onMouseUp(); });

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
                if (this.querySelector(`#${button.id}`).dataset?.canClose === 'true')
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
    * Inicia o processo de arraste do diálogo.
    * 
    * @param {MouseEvent} event - O evento de mouse.
    */
    onMouseDown(event) {
        event.stopPropagation();
        this.state.isDragging = true;

        // Obtém as coordenadas reais do diálogo
        const dialogRect = this.dialog.getBoundingClientRect();

        // Calcula as diferenças entre o clique e a posição atual
        this.state.xDiff = event.pageX - dialogRect.left;
        this.state.yDiff = event.pageY - dialogRect.top;

        const header = this.dialog.querySelector('.header');
        header.style.cursor = "grabbing";
        document.body.style.userSelect = "none";
    }

    /**
     * Manipula o movimento do arraste do diálogo.
     * 
     * @param {MouseEvent} event - O evento de movimento do mouse.
     */
    onMouseMove(event) {
        event.stopPropagation();
        if (this.state.isDragging) {
            const parentRect = this.parentElement.getBoundingClientRect();
            const dialogRect = this.dialog.getBoundingClientRect();

            // Calcula as novas posições, respeitando os limites do parentElement
            const newX = event.pageX - this.state.xDiff;
            const newY = event.pageY - this.state.yDiff;

            this.state.x = Math.max(parentRect.left, Math.min(newX, parentRect.right - dialogRect.width));
            this.state.y = Math.max(parentRect.top, Math.min(newY, parentRect.bottom - dialogRect.height));

            // Aplica as novas posições
            this.dialog.style.left = `${this.state.x}px`;
            this.dialog.style.top = `${this.state.y}px`;
        }
    }

    /**
     * Finaliza o arraste do diálogo.
     */
    onMouseUp() {
        if (!this.dialog) return;

        this.state.isDragging = false;

        const header = this.dialog.querySelector('.header');
        header.style.cursor = "grab";
        document.body.style.userSelect = "";
    }

    /**
     * Atualiza a posição do diálogo na tela com base no estado atual.
     * @private
     */
    _renderWindow() {
        if (!this.dialog) return;
        this.dialog.style.transform = 'translate(' + this.state.x + 'px, ' + this.state.y + 'px)';
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

            if (parentRect.x != 0 && parentRect.y != 0) {
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