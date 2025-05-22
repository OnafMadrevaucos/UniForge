export default class Application {

    static Styles = { FORM: 'form', DIALOG: 'dialog' };

    constructor(title, options = {}) {
        /**
        * O identificador único (UUID) da aplicação.
        * @type {string}
        * 
        */
        this.uuid = uniforge.utils.randomID();

        /**
        * Opções adicionais fornecidas à aplicação.
        * @type {Object}
        */
        this.options = options;

        /**
         * O tipo de aplicação ('formulário' é o padrão).
         * @type {string}
         * 
        */
        this.style = this.options?.style ?? 'form';

        /**
        * O título da aplicação.
        * @type {string}
        * 
        */
        this.title = title;

        /** 
         * Estado interno para rastrear a posição e deslocamento do diálogo.
         * @type {Object}
         * @property {boolean} isDragging   - Indica se o diálogo está sendo arrastado.
         * @property {number} xDiff         - Diferença de posição horizontal do mouse.
         * @property {number} yDiff         - Diferença de posição vertical do mouse.
         * @property {number} x             - Posição horizontal do diálogo.
         * @property {number} y             - Posição vertical do diálogo. 
         * @property {boolean} rendered     - Indica o estado da renderização da aplicação.
         * @property {boolean} configured   - Indica o estado de configuração dos elementos da aplicação.
         * @property {boolean} maximized    - Indica se a aplicação está maximizada.
         */
        this.state = {
            isDragging: false,
            xDiff: 0,
            yDiff: 0,
            x: 0,
            y: 0,

            // Estado de renderização do diálogo.
            rendered: false,
            configured: false,
            maximized: true
        };

        /**
        * Objeto de controle global para mensagens ao usuário.
        * @type {object}
        */
        this.msgBox = uniforge.msgBox;
    }

    // Propriedade do template HTML da aplicação.
    #template;

    #html = {
        overlay: '',
        app: '',
        main: ''
    };

    /**
    * Obtém as configurações padrões da aplicação.
    */
    get defaultOptions() {
        return {
            classes: [this.style, 'container']
        };
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
            app: this._buildSelector('Container'),
            header: this._buildSelector('Header'),
            main: this._buildSelector('Main'),
            close_btn: this._buildSelector('Close')
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
            app: document.querySelector(this.query.app),
            header: document.querySelector(this.query.header),
            main: document.querySelector(this.query.main),
            close_btn: document.querySelector(this.query.close_btn),
        };
    }

    /**
    * Obtém o elemento pai que chamou a aplicação.
    * @async
    * @returns {HTMLElement}  - Elemento pai.
    */
    get parentElement() {
        return document.querySelector('body.uniforge');
    }

    /**
     * Obtém o template usado pela Aplicação.
     * 
     * @returns {String}  - O caminho do template da aplicação.
    */
    get template() {
        return this.#template;
    }

    /**
     * Informa se a aplicação possui um template válido.
     * 
     * @returns {Boolean}  - O caminho do template da aplicação.
    */
    get hasTemplate() {
        return this.template ? true : false;
    }

    get html() {
        return this.#html;
    }

    /** 
    * Estado de arraste do diálogo.
    * @type {Boolean}
    */
    get isDragging() {
        return this.state.isDragging;
    }

    /**
    * Indica se o formulário está renderizado corretamente.
    * @type {boolean}
    */
    get rendered() {
        return this.state.rendered;
    }

    /**
    * Indica se o formulário está configurado corretamente. Se 'sim', o formulário está pronto para ser exibido.
    * @type {boolean}
    */
    get configured() {
        return this.state.configured;
    }

    /**
     * Indica se o formulário está maximizado ou não.
     * @type {boolean}
     */
    get maximized() {
        return this.state.maximized;
    }

    /**
     * Determina o template usado pelo Formulário.
     * 
     * @param {String}  - O caminho do template do formulário.
     */
    set template(value) {
        const path = this.style === 'form' ? './templates/forms/' : './templates/dialogs/';
        this.#template = `${path}${value}.html`;
    }

    /**
     * Define se o formulário está em estado de arraste ou não.
     * @type {boolean}
     */
    set isDragging(value) {
        this.state.isDragging = value;
    }

    /**
     * Define o estado de renderização do formulário.
     * 
     * @param {boolean} value - Se verdadeiro, indica que o formulário foi renderizado corretamente.
     */
    set rendered(value) {
        this.state.rendered = value;
    }

    /**
     * Define se o formulário está configurado corretamente. Se 'sim', o formulário está pronto para ser exibido.
     * @type {boolean}
     */
    set configured(value) {
        this.state.configured = value;
    }

    /**
     * Define se o formulário está maximizado ou minimizado.
     * @type {boolean}
     */
    set maximized(value) {
        this.state.maximized = value;
    }

    prepareBaseData() {
        const data = {
            title: this.title,
            type: this.type,
            core: {
                template: this.template
            }
        };

        return data;
    }

    /**
     * Cria a estrutura do formulário, incluindo overlay, header, e body.
     * 
     * @async
     * @returns {Promise<void>}  - Uma promessa que resolve quando o formulário for renderizado.
     * @throws {Error}           - Se ocorrer um erro ao renderizar o formulário.
    */
    async prepareTemplate() {
        const classes = this.defaultOptions.classes;

        const overlay = document.createElement('div');
        overlay.id = `${this.style}Overlay-${this.uuid}`;
        overlay.classList.add('overlay', `${this.style}-overlay`, 'flexrow');

        const container = document.createElement('div');
        container.id = `${this.style}Container-${this.uuid}`;
        container.classList.add(...classes);

        if (this.options.height) container.style.height = this.options.height;
        if (this.options.width) container.style.width = this.options.width;

        const header = document.createElement('div');
        header.id = `${this.style}Header-${this.uuid}`;
        header.classList.add('header-bar', 'flexrow');

        const main = document.createElement('div');
        main.id = `${this.style}Main-${this.uuid}`;
        main.classList.add('main', 'flexcol');

        await this.prepareDerivedTemplate(container, header, main);

        this.html.overlay = overlay.outerHTML;
        this.html.app = container.outerHTML;
    }

    /**
    * Prepara o conteúdo do formulário substituindo seus placeholders e tags customizadas.
    */
    parseTemplate(html) {
        return uniforge.parser.parseHTML(html, this.data);
    }

    /**
    * Renderiza a aplicação.
    * 
    * @async
    * @returns {Boolean} - Uma flag indicando se o form foi renderizado (true) ou não (false).
    */
    async render() {
        try {  
            // Função para obter os dados comuns à toda aplicação.
            this.data = this.prepareBaseData();

            // Função para obter os dados específicos da aplicação.
            if (this.prepareData) this.prepareData();

            //if (!this.prepareTemplate) throw new Error('A função prepareTemplate precisa ser implementada.');
            await this.prepareTemplate();

            // Prepara o HTML da aplicação para renderização (Substitui pseudo-elements).
            this.html.app = this.parseTemplate(this.html.app);

            this.rendered = true;           

            return this.rendered;
        } catch (error) {
            this.msgBox.showError(error.message, error);
        }
    }

    /**
     * Renderiza o conteúdo da aplicação.
     * 
     * Esta função é responsável por renderizar apenas o conteúdo da aplicação, nada mais.
     * 
     * @async
     * @returns {Boolean} - Uma flag indicando se o conteúdo foi renderizado (true) ou não (false).
     */
    async renderContent() {
        // Função para obter os dados comuns à toda aplicação.
        this.data = this.prepareBaseData();

        // Função para obter os dados específicos da aplicação.
        if (this.prepareData) this.prepareData();

        // Obtem os elementos HTML para renderização.
        const main = this.ui.main;

        // Prepara o HTML específico da aplicação para renderização.
        this.html.main = await this.refreshDerivedTemplate(main);

        // Prepara o HTML da aplicação para renderização (Substitui pseudo-elements).
        this.html.main = this.parseTemplate(this.html.main); 
        
        main.innerHTML = this.html.main;

        // Configura os conteúdos específicos da aplicação.
        await this.initialize();

        this.rendered = true;

        return this.rendered;
    }

    async configure() {
        try {
        // Ativa os ouvintes de eventos básicos.
        this.activateBaseListeners();

        // Configura os conteúdos específicos da aplicação.
        if(await this.initialize()) this.configured = true;

        } catch (error) {
            this.msgBox.showError(error.message, error);
            this.configured = false;
        }
    }

    /**
    * Limpa o formulário e re-exibe o conteúdo com os dados atuais.
    * 
    * @async
    * @returns {Promise<void>} - Uma promessa que resolve quando o formulário for re-exibido.
    */
    async refresh() {
        try {
            // Limpa o formulário.
            this.clear();

            // Renderiza o formulário com os dados atuais.
            await this.renderContent();

        } catch (error) {
            this.msgBox.showError(error.message, error);
        }
    }

    async show(forceLoad = false) {
        if (forceLoad && !this.rendered) await this.render();
        else throw new Error('Não foi possível exibir o formulário. O formulário não foi renderizado.');

        try {
            // Envia o HTML para o DOM.
            this.#hookToDOM();

            // Configura as funcionalidades de interação da aplicação.
            this.configure();

            // Aplicação configurado corretamente, exiba-a.
            if (this.configured) {
                this.ui.app.classList.remove('hidden');

                uniforge.form = this;
                uniforge.state.save();
            }
        } catch (error) {
            this.msgBox.showError(error.message, error);
        }
    }

    close() {
        this.ui.app.remove();
        this.ui.overlay.remove();

        // Limpa o conteúdo do formulário dos metadados da aplicação.
        uniforge.state.update(['currentForm', { name: null, state: null, activeTab: 0 }]);

        uniforge.form = null;
        uniforge.state.save();
    }

    /**
    * Limpa o HTML e atualiza o estado do Uniforge de acordo.
    */
    clear() {
        // Limpa o conjunto de dados do formulário.
        this.data = null;
        // Limpa o conteúdo do formulário.
        this.ui.main.innerHTML = '';
        // Marca o formulário como não renderizado.
        this.rendered = false;
    }

    #hookToDOM() {
        this.#hookOverlayToDOM();
        this.#hookContainerToDOM();
    }

    #hookOverlayToDOM() {
        const parser = new DOMParser();
        let doc = null;

        // Verifica se o overlay da aplicação foi renderizado corretamente.
        if(!this.html.overlay || this.html.overlay.isEmpty())
            throw new Error('O formulário precisa ter um overlay.');

         // Obtém o elemento HTML do overlay da aplicação.
         doc = parser.parseFromString(this.html.overlay, 'text/html');
         const overlay = doc.body.firstChild;

        // Adiciona o overlay ao DOM.
        document.body.appendChild(overlay);
    }

    #hookContainerToDOM() {
        const parser = new DOMParser();
        let doc = null;

        // Verifica se o container da aplicação foi renderizado corretamente.
        if(!this.html.app || this.html.app.isEmpty())
            throw new Error('O formulário precisa ter um container.');

         // Obtém o elemento HTML do container da aplicação.
         doc = parser.parseFromString(this.html.app, 'text/html');
         const container = doc.body.firstChild;

        // Adiciona o container ao DOM.
        document.body.appendChild(container);
    }

    #hookMainToContainer() {
        const parser = new DOMParser();
        let doc = null;

        // Verifica se o container da aplicação foi renderizado corretamente.
        if(!this.html.main || this.html.main.isEmpty())
            throw new Error('O formulário precisa ter um main.');

         // Obtém o elemento HTML do container da aplicação.
         doc = parser.parseFromString(this.html.main, 'text/html');
         const main = doc.body.firstChild;

        // Adiciona o container ao DOM.
        this.ui.app.appendChild(main);
    }
    /* ---------------------------------------------------------------------------------------------------------------- */
    // LISTENERS
    /**
     * Configura ouvintes de eventos básicos para o formulário.
     * @private
     */
    activateBaseListeners() {
        const header = this.ui.header;
        header.addEventListener('mousedown', (event) => { this._onMouseDown.bind(this)(event); });

        const main = this.ui.main;
        main.addEventListener('submit', (event) => { event.preventDefault(); });

        document.addEventListener('mousemove', (event) => { this._onMouseMove.bind(this)(event); });
        document.addEventListener('mouseup', (event) => { this._onMouseUp.bind(this)(event); });

        // Fecha aplicação ao clicar no botão de fechar.
        this.ui.close_btn.addEventListener('click', (event) => { this._onCloseClick.bind(this)(event); });
    }

    /**
    * Fecha a aplicação com clicar no botão de fechar no cabeçalho.
    * 
    * @param {MouseEvent} event - O evento de mouse.
    */
    _onCloseClick(event) {
        event.preventDefault();
        event.stopPropagation();

        //this.#handleNavQueueOnClose(event);

        this.close();
    }
    /**
    * Inicia o processo de arraste do aplicação.
    * 
    * @param {MouseEvent} event - O evento de mouse.
    */
    _onMouseDown(event) {
        event.stopPropagation();
        this.state.isDragging = true;

        // Obtém as coordenadas reais do diálogo
        const appRect = this.ui.app.getBoundingClientRect();

        // Calcula as diferenças entre o clique e a posição atual
        this.state.xDiff = event.pageX - appRect.left;
        this.state.yDiff = event.pageY - appRect.top;

        const header = this.querySelector('.header-bar');
        header.style.cursor = "grabbing";
        document.body.style.userSelect = "none";
    }

    /**
     * Manipula o movimento do arraste da aplicação.
     * 
     * @param {MouseEvent} event - O evento de movimento do mouse.
     */
    _onMouseMove(event) {
        event.stopPropagation();
        if (this.state.isDragging) {
            const parentRect = this.parentElement.getBoundingClientRect();
            const appRect = this.ui.app.getBoundingClientRect();
            const headerRect = this.ui.header.getBoundingClientRect();

            // Calcula as novas posições, respeitando os limites do parentElement.
            const newX = event.pageX - this.state.xDiff;
            const newY = event.pageY - this.state.yDiff;

            this.state.x = Math.max(parentRect.left, Math.min(newX, parentRect.right - appRect.width));
            this.state.y = Math.max((parentRect.top + headerRect.height), Math.min(newY, parentRect.bottom - appRect.height));

            // Aplica as novas posições
            this._refreshWindow();
        }
    }

    /**
     * Finaliza o arraste da aplicação.
     */
    _onMouseUp() {
        if (!this.ui.app) return;

        this.state.isDragging = false;

        const header = this.ui.app.querySelector('.header-bar');
        header.style.cursor = "grab";
        document.body.style.userSelect = "";
    }

    /* ---------------------------------------------------------------------------------------------------------------- */
    // UTILITÁRIOS  
    /**
     * Consulta um seletor CSS dentro da aplicação.
     * @param {string} selector - O seletor CSS a ser buscado.
     * @returns {HTMLElement} O primeiro elemento correspondente.
     */
    querySelector(selector) {
        return this.ui.app.querySelector(selector);
    }

    /**
     * Consulta todos os elementos correspondentes a um seletor CSS dentro da aplicação.
     * @param {string} selector - O seletor CSS a ser buscado.
     * @returns {NodeList} Uma NodeList com os elementos correspondentes.
     */
    querySelectorAll(selector) {
        return this.ui.app.querySelectorAll(selector);
    }

    /**
    * Obtém o código HTML da Aplicação.
    * 
    * @returns {String}  - O código HTML do Formulário.
    */
    toHTML() {
        return this.form.outerHTML;
    }

    _buildSelector(source) {
        return `#${this.style}${source}-${this.uuid}`;
    }

    /**
     * Atualiza a posição da aplicação na tela com base no estado atual.
     * @private
    */
    _refreshWindow() {
        if (!this.ui.app) return;

        this.ui.app.style.left = `${this.state.x}px`;
        this.ui.app.style.top = `${this.state.y}px`;
    }

    /**
    * Centraliza a aplicação ao elemento pai.     
    */
    _centerDialog() {
        if (this.parentElement && this.ui.app) {
            const parentRect = this.parentElement.getBoundingClientRect();
            const appRect = this.ui.app.getBoundingClientRect();

            let centerX = parentRect.left + (parentRect.width - appRect.width) / 2;
            let centerY = parentRect.top + (parentRect.height - appRect.height) / 2;

            /*
            if (parentRect.x != 0 && parentRect.y != 0) {
                // Calcula as coordenadas para centralizar o diálogo
                centerX = parentRect.left + (parentRect.width - appRect.width) / 2;
                centerY = parentRect.top + (parentRect.height - appRect.height) / 2;
            } else {
                // Calcula as coordenadas para centralizar o diálogo
                centerX = (appRect.width) / 2;
                centerY = (appRect.height) / 2;
            }
            */

            // Define a posição do diálogo
            this.ui.app.style.position = "absolute";
            this.ui.app.style.left = `${centerX}px`;
            this.ui.app.style.top = `${centerY}px`;
        }
    }

    /**
   * Lida com a fila de navegação ao fechar o formulário.
   * @param {MouseEvent} event - O evento de clique para fechar.
   * @private
   */
    #handleNavQueueOnClose(event) {

        const overlay = this.ui.overlay;
        if (overlay) {
            uniforge.navQueue.clearQueue();
        } else if (overlay.id === 'entryFormOverlay') {
            if (uniforge.navQueue.isFromLibrary()) {
                const first = uniforge.navQueue.shift();
                uniforge.navQueue.clearQueue();
                uniforge.navQueue.push(first);
            }
        }
    }
}