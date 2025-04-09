import { triggerHook } from "../scripts/hooks.js";

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
            xDiff: 5,
            yDiff: 5,
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

    get query() {
        return {
            overlay: this._buildSelector('Overlay'),
            application: this._buildSelector('Container'),
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
            application: document.querySelector(this.query.application),
            header: document.querySelector(this.query.header),
            main: document.querySelector(this.query.main),
            close_btn: document.querySelector(this.query.close_btn),
        };
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
        const overlay = document.createElement('div');
        overlay.id = `${this.style}Overlay-${this.uuid}`;
        overlay.classList.add('overlay', 'flexrow');

        const container = document.createElement('div');
        container.id = `${this.style}Container-${this.uuid}`;
        container.classList.add(this.style, 'container', 'flexrow');

        const header = document.createElement('div');
        header.id = `${this.style}Header-${this.uuid}`;
        header.classList.add('header-bar', 'flexrow');

        const main = document.createElement('div');
        main.id = `${this.style}Main-${this.uuid}`;
        main.classList.add('main', 'flexcol');

        await this.prepareDerivedTemplate(container, header, main);        
        overlay.appendChild(container);

        // Adiciona o overlay ao DOM.
        document.body.appendChild(overlay);
    }

    /**
    * Renderiza a aplicação.
    * 
    * @async
    * @returns {Boolean} - Uma flag indicando se o form foi renderizado (true) ou não (false).
    */
    async render() {
        try {
            await triggerHook('beforeRender');

            // Função para obter os dados comuns à toda aplicação.
            this.data = this.prepareBaseData();

            // Função para obter os dados específicos da aplicação.
            if (this.prepareData) this.prepareData();

            //if (!this.prepareTemplate) throw new Error('A função prepareTemplate precisa ser implementada.');
            await this.prepareTemplate();

            // Prepara o HTML da aplicação para renderização (Substitui pseudo-elements).
            this.prepareContent();

            // Ativa os ouvintes de eventos básicos.
            this.activateBaseListeners();

            // Configura os conteúdos específicos da aplicação.
            await this.initialize();

            this.rendered = true;
            await triggerHook('afterRender');

            return this.rendered;
        } catch (error) {
            console.error(error);
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
            this.clear();
            this.rendered = false;
            await this.render();

        } catch (error) {
            console.error(error);
        }
    }

    async show(forceLoad = false) {
        if (forceLoad && !this.rendered) await this.render();
        else throw new Error('Não foi possível exibir o formulário. O formulário não foi renderizado.');

        try {
            if (this.configured) {
                this.ui.overlay.classList.remove('hidden');

                uniforge.form = this;
                uniforge.state.save();
            }
        } catch (error) {
            this.msgBox.showError(error.message);
        }
    }

    close() {
        this.clear();
        this.ui.overlay.classList.add('hidden');

        // Limpa o conteúdo do formulário dos metadados da aplicação.
        uniforge.state.update(['currentForm', { name: null, state: null, activeTab: 0 }]);

        uniforge.form = null;
        uniforge.state.save();
    }

    /**
    * Limpa o HTML e atualiza o estado do Uniforge de acordo.
    */
    clear() {
        // Limpa o conteúdo do formulário.
        this.ui.main.innerHTML = '';
    }

    /**
    * Prepara o conteúdo do formulário substituindo seus placeholders e tags customizadas.
    */
    prepareContent() {
        const preparedContent = uniforge.parser.parseHTML(this.ui.application.innerHTML, this.data);
        this.ui.application.innerHTML = preparedContent;
    }

    /* ---------------------------------------------------------------------------------------------------------------- */
    // LISTENERS
    /**
     * Configura ouvintes de eventos básicos para o formulário.
     * @private
     */
    activateBaseListeners() {
        // Fecha aplicação ao clicar no botão de fechar.
        this.ui.close_btn.addEventListener('click', this.onCloseClick.bind(this), { once: true });
    }

    onCloseClick(event) {
        event.stopPropagation();
        this.#handleNavQueueOnClose(event);

        this.close();
    }

    /* ---------------------------------------------------------------------------------------------------------------- */
    // UTILITÁRIOS  
    /**
     * Consulta um seletor CSS dentro do overlay principal.
     * @param {string} selector - O seletor CSS a ser buscado.
     * @returns {HTMLElement} O primeiro elemento correspondente.
     */
    querySelector(selector) {
        return this.ui.overlay.querySelector(selector);
    }

    /**
     * Consulta todos os elementos correspondentes a um seletor CSS dentro do overlay principal.
     * @param {string} selector - O seletor CSS a ser buscado.
     * @returns {NodeList} Uma NodeList com os elementos correspondentes.
     */
    querySelectorAll(selector) {
        return this.ui.overlay.querySelectorAll(selector);
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
   * Lida com a fila de navegação ao fechar o formulário.
   * @param {MouseEvent} event - O evento de clique para fechar.
   * @private
   */
    #handleNavQueueOnClose(event) {
        const overlay = event.target.closest('.overlay');
        if (overlay.id === 'formOverlay' || uniforge.navQueue.isFromTimeline()) {
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