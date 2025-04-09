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
    * Obtém o container principal do diálogo.
    * 
    * @returns {HTMLElement}  - O container principal do diálogo.
    */
    get dialog() {
        return this.ui.application;
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
     * Renderiza o diálogo com o template Handlebars.
     * Se o diálogo possuir um template, ele é carregado e renderizado
     * no corpo do diálogo.
     * @async
     * @throws {Error} - Se ocorrer um erro ao carregar o template.
     */
    async _prepareBody() {
        try {
            const rawHtml = await uniforge.utils.loadTemplate(this.template);

            const html = uniforge.parser.parseHTML(rawHtml, this.data);
            return html;
        } catch (error) {
            this.msgBox.showError(error);
        }
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

    /**
     * Cria a estrutura do diálogo, incluindo overlay, cabeçalho, corpo e botões.
     * @implements
     */
    async prepareDerivedTemplate(dialog, header, main) {
        dialog.method = 'dialog';

        header.innerHTML = `
            <h2>${this.title}</h2>
            <a id="${this.style}Close-${this.uuid}" class="close-button"><i class="fas fa-xmark"></i></a>
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
    */
    async render(force = false) {
        super.render();

        if (force) this.show();

        return true;
    }
    
    async initialize() {
        // Se o diálogo implementa 'configureElements', chama o método.
        if (this.configureElements) await this.configureElements();
        
        // Centralizar o diálogo no parentElement
        this._centerDialog();        

        this.activateListeners();
    }

    async refresh() {
        this.clear();
        // Se o diálogo implementa 'prepareData', chama o método.
        if (this.prepareData) this.prepareData();

        const content = this._prepareContent();
        this.dialog.appendChild(content);        

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
            if (button?.callback) {
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
        if (this.dialog) {
            super.close();
        }   

        if (!this.ui.overlay) return;
        this.ui.overlay.remove();
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
    activateListeners() {
        //const topBar = this.ui.topbar;
        //topBar.addEventListener('mousedown', (event) => { this._onMouseDown.bind(this)(event); });

        const main = this.ui.main;
        main.addEventListener('submit', (event) => { event.preventDefault(); });

        document.addEventListener('mousemove', (event) => { this._onMouseMove(event); });
        document.addEventListener('mouseup', () => { this._onMouseUp(); });

        // Permite fechar o diálogo clicando no overlay
        this.ui.overlay.addEventListener("click", (event) => {
            if (!event.target.classList.contains('overlay')) return;            
            this.close();
        });

        const buttons = this.querySelectorAll('.dialog-button');
        Object.values(buttons).forEach(button => {
            button.addEventListener("click", (event) => { this._onClickButton(event); });
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