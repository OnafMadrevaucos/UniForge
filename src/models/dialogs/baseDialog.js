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

        this.uuid = uniforge.utils.randomID();

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

    // Propriedade do template Handlebars do dialog.
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
        return document.querySelector('body.uniforge');
    }

    /**
   * Propriedade que retorna um objeto com referências para elementos do formulário.
   * 
   * @returns {Object}  - Um objeto com as seguintes propriedades:
   *  - overlay: O elemento HTML que contém o formulário.
   *  - form: O elemento HTML que representa o formulário.
   *  - topbar: O elemento HTML que contém o título do formulário.
   *  - close_btn: O elemento HTML que fecha o formulário.
   *  - content: O elemento HTML que contém o conteúdo do formulário.
   */
    get ui() {
        return {
            overlay: document.getElementById('dialogOverlay-' + this.uuid),
            dialog: document.getElementById('dialog-' + this.uuid),
            content: document.getElementById('dialogContent-' + this.uuid),
            topbar: document.getElementById('dialogHeader-' + this.uuid),
            body: document.getElementById('dialogBody-' + this.uuid),
            buttons: document.getElementById('dialogButtons-' + this.uuid)
        };
    }

    _prepareTopBar() {
        // Cabeçalho
        const topBar = document.createElement('div');
        topBar.id = 'dialogHeader-' + this.uuid;
        topBar.className = 'topbar flexrow';

        // Título do diálogo
        const title = document.createElement("h2");
        title.textContent = this.title;

        const closeButton = document.createElement("a");
        closeButton.className = 'close-button';
        closeButton.innerHTML = '<i class="fas fa-xmark"></i>';

        topBar.appendChild(title);
        topBar.appendChild(closeButton);

        return topBar
    }

    _prepareBody() {
        // Corpo do diálogo
        const dialogBody = document.createElement("div");
        dialogBody.id = 'dialogBody-' + this.uuid;
        dialogBody.className = 'body flexcol';        

        return dialogBody;
    }

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

    _prepareContent() {
        const content = document.createElement("form");
        content.id = 'dialogContent-' + this.uuid;
        content.className = 'content';
        content.method = 'dialog';       

        const topBar = this._prepareTopBar();
        const body = this._prepareBody();     
        const buttons = this._prepareButtons();   

        content.appendChild(topBar);
        content.appendChild(body);
        content.appendChild(buttons);

        return content;
    }

    /**
     * Cria a estrutura do diálogo, incluindo overlay, cabeçalho, corpo e botões.
     * @private
     */
    _prepareDialog() {
        if (!this.overlay) {
            const overlay = document.createElement("div");
            overlay.id = 'dialogOverlay-' + this.uuid;
            overlay.className = "overlay dialog-overlay";
            if(this.alwaysOnTop) overlay.style.zIndex = '1200';

            this.overlay = overlay; // Armazena o overlay para exibição posterior.
        }

        // Container do diálogo
        this.dialog = document.createElement("dialog");
        this.dialog.id = 'dialog-' + this.uuid;
        this.dialog.className = 'dialog';

        this.dialog.style = `height: ${this.options.height ?? 'auto'}; width: ${this.options.width ?? 'fit-content'}`;

        const content = this._prepareContent();

        this.dialog.appendChild(content);

        this._renderWindow();

        this.overlay.appendChild(this.dialog);

        // Se o overlay do Dialog ainda não foi atrelado ao document, atrele-o.
        if (!document.body.contains(this.overlay))
            document.body.appendChild(this.overlay);
    }

    /**
    * Exibe o diálogo na página.
    */
    async render(force = false, centralize = true) {
        // Se o diálogo implementa 'prepareData', chama o método.
        if (this.prepareData) this.prepareData();

        // Prepara o dialog para em seguida renderizá-lo já com os dados preparados.
        this._prepareDialog();

        // Renderiza o diálogo especializado. Diálogos simples não possuem templates HTML.
        if (this.hasTemplate && !this.template) {
            this.msgBox.showError('O diálogo não tem um template válido a ser carregado.');
            return false;
        }

        await this.renderDialog();

        // Se o diálogo implementa 'configureElements', chama o método.
        if (this.configureElements) await this.configureElements();

        if (centralize) {
            // Centralizar o diálogo no parentElement
            this._centerDialog();
        }

        this._activateListeners();

        if (force) this.show();

        return true;
    }

    async refresh() {
        this.clear();
        // Se o diálogo implementa 'prepareData', chama o método.
        if (this.prepareData) this.prepareData();

        const content = this._prepareContent();
        this.dialog.appendChild(content);

        await this.renderDialog();

        // Se o diálogo implementa 'configureElements', chama o método.
        if (this.configureElements) await this.configureElements();

        this._activateListeners();
    }

    show() {
        this.dialog.show();
    }

    submit(button, event) { 
        const target = this.dialog;
        try {
            if(button?.callback) {
                const closing = button.callback.call(this, target, event); 
                if (closing || this.alwaysClose) this.close();                
            } else {                
                this.msgBox.showWarning('Botão não possui callback definido.');
                this.close();            
            }
        } catch (error) {
            this.msgBox.showError(error);
        }      
    }

    /**
    * Limpa o conteúdo do diálogo.
    */
    clear() {
        const dialog = this.dialog;
        if (dialog) {
            while (dialog.firstChild) dialog.removeChild(dialog.firstChild);
        }
    }

    /**
    * Fecha o diálogo e remove o overlay da página.
    */
    close() {
        if (this.abort) this.abort();

        if (this.dialog) {
            this.dialog.close();
        }

        const overlay = document.querySelector("#dialogOverlay-" + this.uuid);
        if (!overlay) return;
        overlay.remove();
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
        const topBar = this.ui.topbar;
        topBar.addEventListener('mousedown', (event) => { this._onMouseDown.bind(this)(event); });

        const content = this.ui.content;
        content.addEventListener('submit', (event) => { event.preventDefault(); });

        document.addEventListener('mousemove', (event) => { this._onMouseMove(event); });
        document.addEventListener('mouseup', () => { this._onMouseUp(); });

        // Permite fechar o diálogo clicando no overlay
        this.overlay.addEventListener("click", (event) => {
            if (!event.target.classList.contains('overlay')) return;
            this.abort();
            this.close();
        });

        const buttons = this.querySelectorAll('.dialog-button');
        Object.values(buttons).forEach(button => { 
            button.addEventListener("click", (event) => { this._onClickButton(event); });
        });

        const closeButton = this.querySelector('.close-button');
        closeButton.addEventListener('click', (event) => {
            event.stopPropagation();
            this.close();
        });
    }   

    _onClickButton(event) {
        const id = event.target.id;
        const button = this.buttons[id];
        this.submit(button, event);
    }

    /**
    * Inicia o processo de arraste do diálogo.
    * 
    * @param {MouseEvent} event - O evento de mouse.
    */
    _onMouseDown(event) {
        event.stopPropagation();
        this.state.isDragging = true;

        // Obtém as coordenadas reais do diálogo
        const dialogRect = this.dialog.getBoundingClientRect();

        // Calcula as diferenças entre o clique e a posição atual
        this.state.xDiff = event.pageX - dialogRect.left;
        this.state.yDiff = event.pageY - dialogRect.top;

        const topbar = this.dialog.querySelector('.topbar');
        topbar.style.cursor = "grabbing";
        document.body.style.userSelect = "none";
    }

    /**
     * Manipula o movimento do arraste do diálogo.
     * 
     * @param {MouseEvent} event - O evento de movimento do mouse.
     */
    _onMouseMove(event) {
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
    _onMouseUp() {
        if (!this.dialog) return;

        this.state.isDragging = false;

        const topbar = this.dialog.querySelector('.topbar');
        topbar.style.cursor = "grab";
        document.body.style.userSelect = "";
    }

    /**
     * Atualiza a posição do diálogo na tela com base no estado atual.
     * @private
    */
    _renderWindow() {
        if (!this.dialog) return;
        this.dialog.style.position = "absolute";
        this.dialog.style.left = `${this.state.x}px`;
        this.dialog.style.top = `${this.state.y}px`;
    }


    /**
   * Centraliza o diálogo ao element pai.
   * 
   * */
    _centerDialog() {
        if (this.parentElement && this.dialog) {
            const parentRect = this.parentElement.getBoundingClientRect();
            const dialogRect = this.dialog.getBoundingClientRect();

            let centerX = parentRect.left + (parentRect.width - dialogRect.width) / 2;
            let centerY = parentRect.top + (parentRect.height - dialogRect.height) / 2;

            /*
            if (parentRect.x != 0 && parentRect.y != 0) {
                // Calcula as coordenadas para centralizar o diálogo
                centerX = parentRect.left + (parentRect.width - dialogRect.width) / 2;
                centerY = parentRect.top + (parentRect.height - dialogRect.height) / 2;
            } else {
                // Calcula as coordenadas para centralizar o diálogo
                centerX = (dialogRect.width) / 2;
                centerY = (dialogRect.height) / 2;
            }
            */

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