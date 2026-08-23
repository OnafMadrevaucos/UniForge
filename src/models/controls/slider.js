/**
 * Classe que gerencia um componente de controle deslizante (Slider).
 * Suporta orientações horizontal e vertical, valores customizados de intervalo (min/max),
 * passos (steps), rótulos vinculados com máscaras de formatação e controle de estado.
 */
export default class Slider {
    
    /**
     * Direções permitidas para o funcionamento do Slider.
     * @enum {string}
     */
    static Directions = {
        horizontal: 'horizontal',
        vertical: 'vertical'
    }

    /**
     * Instancia um novo Slider.
     * @param {string} id - O ID único do elemento DOM do slider.
     * @param {HTMLElement} [parent=null] - O elemento pai onde o slider está contido.
     * @param {Object} [options={}] - Configurações opcionais de inicialização.
     * @param {string} [options.width='300px'] - Largura inicial do componente.
     * @param {number} [options.min=0] - Valor mínimo permitido.
     * @param {number} [options.max=100] - Valor máximo permitido.
     * @param {number} [options.step=1] - Intervalo de incremento/decremento (passo).
     * @param {number} [options.value] - Valor inicial do slider (padrão é o mínimo).
     * @param {string} [options.direction='horizontal'] - Direção do slider ('horizontal' ou 'vertical').
     * @param {string} [options.linkedLabel=null] - ID de um elemento de texto para exibir o valor.
     * @param {string} [options.labelMask='{value}'] - Máscara para formatação do texto do rótulo.
     * @param {string} [options.tooltip] - Texto descritivo (tooltip) para o marcador.
     * @throws {Error} Se o elemento pai não for fornecido.
     */
    constructor(id, parent = null, options = {}) {
        this.parent = parent;

        // Garante que o slider possua obrigatoriamente um container pai.
        if (!this.parent)
            throw new Error('O Slider precisa de um elemento pai.');

        /**
         * Identificador do Slider.
         * @type {string}
         */
        this.id = id;

        // Configurações dimensionais e de limites matemáticos.
        this.width = options.width ?? '300px';
        this.min = options.min ?? 0;
        this.max = options.max ?? 100;
        this.step = options.step ?? 1;
        this.value = options.value ?? this.min;
        this.direction = options.direction ?? Slider.Directions.horizontal;
        this.linkedLabel = options.linkedLabel ?? null;
        this.labelMask = options.labelMask ?? '{value}';

        // Atribui o tooltip apenas se ele tiver sido passado nas opções.
        if (options.tooltip)
            this.tooltip = options.tooltip;
    }

    /**
     * Estado privado de controle interno da interação do componente.
     * @type {{configured: boolean, dragging: boolean, disabled: boolean}}
     */
    #state = {
        configured: false,
        dragging: false,
        disabled: false
    }

    // --- GETTERS DO DOM ---
    // Resgatam de forma dinâmica as referências dos nós internos do componente.

    /** @returns {HTMLElement|null} O elemento container principal do slider. */
    get element() {
        return this.parent.querySelector(`#${this.id}`);
    }

    /** @returns {HTMLElement|null} A trilha total de fundo do slider. */
    get track() {
        return this.element?.querySelector('.slider-track') ?? null;
    }

    /** @returns {HTMLElement|null} A barra interna indicativa que preenche o progresso. */
    get fill() {
        return this.element?.querySelector('.slider-fill') ?? null;
    }

    /** @returns {HTMLElement|null} O botão/marcador deslizante que o usuário arrasta. */
    get thumb() {
        return this.element?.querySelector('.slider-thumb') ?? null;
    }

    // --- GETTERS E SETTERS DE ESTADO ---

    /** @returns {boolean} Se a rotina de configuração inicial já foi executada. */
    get configured() {
        return this.#state.configured;
    }

    /** @returns {boolean} Se o usuário está atualmente arrastando o marcador. */
    get dragging() {
        return this.#state.dragging;
    }

    /** * Verifica se o componente está visível na tela analisando classes de ocultação.
     * @returns {boolean} 
     */
    get visible() {
        if(!this.parent) return !this.element.classList.contains('hidden');
        else return !this.parent.classList.contains('hidden') && !this.element.classList.contains('hidden');
    }

    /** @returns {boolean} Se o componente está com as interações bloqueadas. */
    get disabled() {
        return this.#state.disabled;
    }

    /** * Retorna a porcentagem equivalente do valor atual em relação ao intervalo mínimo e máximo.
     * @returns {number} Valor percentual de 0 a 100.
     */
    get percent() {
        return ((this.value - this.min) / (this.max - this.min)) * 100;
    }

    /** @param {boolean} value */
    set configured(value) {
        this.#state.configured = value;
    }

    /** @param {boolean} value */
    set dragging(value) {
        this.#state.dragging = value;
    }

    /** * Altera o estado de bloqueio do slider, adicionando ou removendo a classe CSS reflexiva.
     * @param {boolean} value 
     */
    set disabled(value) {
        this.#state.disabled = value;

        if (value)
            this.element.classList.add('disabled');
        else
            this.element.classList.remove('disabled');
    }

    /**
     * Configura o Slider aplicando estilos iniciais e ativando os escutadores de eventos.
     */
    config() {
        // Define o tamanho do Slider baseado na propriedade inline especificada.
        this.element.style.width = this.width;

        // Ativa os listeners base do ciclo de vida e desenha a interface.
        this.activateBaseListeners();
        this.update();

        // Sinaliza que a inicialização foi finalizada com sucesso.
        this.configured = true;
    }

    /**
     * Atualiza a interface gráfica sincronizando os elementos visuais com a porcentagem atual.
     */
    update() {
        const percent = this.percent;

        // Atualiza a trilha e o thumb de acordo com a direção fornecida.
        if (this.direction === Slider.Directions.horizontal) {
            this.fill.style.width = `${percent}%`;
            this.thumb.style.left = `${percent}%`;
        } else {
            this.fill.style.height = `${percent}%`;
            this.thumb.style.bottom = `${percent}%`;
        }

        // Atualiza o tooltip do Slider, se houver.
        if (this.tooltip)
            this.thumb.dataset.tooltip = this.tooltip;

        // Atualiza o dataset do Slider para espelhar o estado no HTML bruto.
        this.element.dataset.value = this.value;
    }

    /**
     * Define dinamicamente se o Slider estará visível ou ocultado na tela.
     * @param {boolean} value - Se true, remove a ocultação; se false, adiciona.
     * @param {boolean} [affectParent=false] - Se true, aplica a regra de visibilidade no container pai.
     */
    setVisible(value, affectParent = false) {
        if (affectParent && this.parent) {
            if (value)
                this.parent.classList.remove('hidden');
            else
                this.parent.classList.add('hidden');
        } else {
            if (value)
                this.element.classList.remove('hidden');
            else
                this.element.classList.add('hidden');
        }
    }

    /**
     * Aplica um novo valor numérico ao slider, atualizando os elementos visuais e rótulos vinculados.
     * @param {number} value - Novo valor pretendido.
     * @param {boolean} [propagate=true] - Define se o evento customizado 'change' deve ser disparado.
     */
    setValue(value, propagate = true) {
        // Normaliza o valor restringindo-o aos limites permitidos.
        value = this.#normalizeValue(value);

        // Atualiza o valor do Slider internamente.
        this.value = value;

        // Atualiza o label atribuído ao Slider se houver vinculação.
        if (this.linkedLabel) {
            // Obtém o elemento do label dentro do escopo do elemento pai.
            const labelElement = this.parent.querySelector(`#${this.linkedLabel}`);

            // Caso o elemento do label exista, atualiza-o.
            if (labelElement) {
                // Caso haja uma mascara, utiliza ela para formatar o label.
                if (this.labelMask)
                    labelElement.textContent = this.labelMask.replace('{value}', this.value);
                else
                    labelElement.textContent = this.value;
            }
        }

        // Atualiza a interface do Slider de forma visual.
        this.update();

        // Dispara o evento de alteração do Slider para o escopo externo.
        if (propagate)
            this.dispatchChangeEvent();
    }

    /**
     * Retorna o valor do slider formatado como string, opcionalmente utilizando a máscara definida.
     * @param {boolean} [withMask=false] - Se true, aplica a máscara de formatação do rótulo.
     * @returns {string|number} O valor formatado ou bruto.
     */
    getValue(withMask = false) {
        if (withMask)
            return this.labelMask.replace('{value}', this.value);
        else
            return this.value;
    }

    /**
     * Retorna o valor atual do Slider explicitamente convertido para o tipo Number.
     * @returns {number}
     */
    getValueNumber() {
        return Number(this.value);
    }

    /**
     * Adiciona um escutador de eventos nativos ou customizados no container do slider.
     * @param {string} event - Nome do evento (ex: 'change', 'click').
     * @param {Function} callback - Função de callback a ser executada.
     */
    addEventListener(event, callback) {
        this.element.addEventListener(event, callback);
    }

    /**
     * Dispara um CustomEvent nativo do tipo 'change' propagando o valor atualizado no detalhe.
     */
    dispatchChangeEvent() {
        this.element.dispatchEvent(new CustomEvent('change', {
            detail: {
                value: this.value
            }
        }));
    }

    /**
     * Inicializa os escutadores de eventos padrão de ponteiro (clique, arrasto e soltura).
     */
    activateBaseListeners() {
        // Inicia o monitoramento do arrasto se o componente não estiver bloqueado.
        this.thumb.addEventListener('mousedown', () => {
            if (this.disabled) return;

            this.dragging = true;
        });

        // Interrompe o estado de arrasto globalmente ao soltar o clique.
        document.addEventListener('mouseup', () => {
            this.dragging = false;
        });

        // Atualiza a posição continuamente caso o ponteiro se mova durante o arrasto.
        document.addEventListener('mousemove', (event) => {
            if (!this.dragging) return;

            this.onMouseMove(event);
        });

        // Permite saltar diretamente para uma posição ao clicar em um ponto da trilha.
        this.track.addEventListener('click', (event) => {
            if (this.disabled) return;

            this.onTrackClick(event);
        });
    }

    /**
     * Encaminha o evento de movimento do ponteiro para a rotina de atualização de valor.
     * @param {MouseEvent} event
     */
    onMouseMove(event) {
        this.updateFromPointer(event);
    }

    /**
     * Encaminha o clique efetuado na trilha diretamente para a rotina de posicionamento.
     * @param {MouseEvent} event
     */
    onTrackClick(event) {
        this.updateFromPointer(event);
    }

    /**
     * Calcula as proporções métricas espaciais do ponteiro para definir o novo valor baseado no passo (step).
     * @param {MouseEvent} event - Instância contendo as coordenadas da tela do mouse.
     */
    updateFromPointer(event) {
        // Obtém o retângulo dimensional e de posicionamento da trilha na viewport.
        const rect = this.track.getBoundingClientRect();

        let percent = 0;

        // Calcula o percentual do clique dependendo se a orientação é horizontal ou vertical.
        if (this.direction === Slider.Directions.horizontal) {
            percent = (event.clientX - rect.left) / rect.width;
        } else {
            percent = (rect.bottom - event.clientY) / rect.height;
        }

        // Limita o valor percentual calculado para mantê-lo rigorosamente entre 0 e 1.
        percent = Math.max(0, Math.min(1, percent));

        // Transforma a proporção percentual no valor numérico correspondente dentro do intervalo.
        const rawValue =
            this.min + percent * (this.max - this.min);

        // Arredonda o valor para o múltiplo mais próximo definido pela propriedade step.
        const steppedValue =
            Math.round(rawValue / this.step) * this.step;

        // Atualiza o estado completo e renderiza as alterações na tela.
        this.setValue(steppedValue);
    }

    /**
     * Garante e força que o valor numérico informado respeite os limites mínimos e máximos da instância.
     * @param {number} value - Valor candidato.
     * @returns {number} O valor limpo e normalizado.
     * @private
     */
    #normalizeValue(value) {
        value = Math.max(this.min, value);
        value = Math.min(this.max, value);

        return value;
    }
}