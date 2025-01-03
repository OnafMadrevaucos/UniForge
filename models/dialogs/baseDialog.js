export default class BaseDialog {
    constructor(options) {
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
        this.dialog = null;

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

        /**
         * Elemento pai onde o diálogo será posicionado.
         * @type {HTMLElement}
         */
        this.parentElement = document.querySelector('.entries');
    }

    // Propriedade do template Handlebars do dialog1.
    #template;

    /**
   * Obtém o template Handlebars usado pelo Formulário.
   * @async
   * @returns {Object}  - O template Handlebars do formulário.
   */
    get template() {
        return this.#template;
    }

    /**
    * Exibe o diálogo na página.
    */
    render() {
        document.body.appendChild(this.overlay);
        this._renderWindow();
    }

    async renderTemplate(fileName, data) {
        const template = await uniforge.templates.get(fileName);
        return template(data || {}, {
            allowProtoMethodsByDefault: true,
            allowProtoPropertiesByDefault: true
        });
    }

    /**
    * Fecha o diálogo e remove o overlay da página.
    */
    close() {
        if (this.dialog) {
            this.dialog.remove();
            this.dialog = null;
        }

        const overlay = document.querySelector(".dialog-overlay");
        if (overlay) overlay.remove();
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