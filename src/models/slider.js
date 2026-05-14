export default class Slider {
    static Directions = {
        horizontal: 'horizontal',
        vertical: 'vertical'
    }

    constructor(id, parent = null, options = {}) {
        this.parent = parent;

        if (!this.parent)
            throw new Error('O Slider precisa de um elemento pai.');

        /**
         * Identificador do Slider.
         * @type {string}
         */
        this.id = id;

        this.width = options.width ?? '300px';

        this.min = options.min ?? 0;
        this.max = options.max ?? 100;
        this.step = options.step ?? 1;
        this.value = options.value ?? this.min;
        this.direction = options.direction ?? Slider.Directions.horizontal;
        this.linkedLabel = options.linkedLabel ?? null;
        this.labelMask = options.labelMask ?? '{value}';
    }

    #state = {
        configured: false,
        dragging: false,
        disabled: false
    }

    get slider() {
        return this.parent.querySelector(`#${this.id}`);
    }

    get track() {
        return this.slider?.querySelector('.slider-track') ?? null;
    }

    get fill() {
        return this.slider?.querySelector('.slider-fill') ?? null;
    }

    get thumb() {
        return this.slider?.querySelector('.slider-thumb') ?? null;
    }

    get configured() {
        return this.#state.configured;
    }

    get dragging() {
        return this.#state.dragging;
    }

    get disabled() {
        return this.#state.disabled;
    }

    get percent() {
        return ((this.value - this.min) / (this.max - this.min)) * 100;
    }

    set configured(value) {
        this.#state.configured = value;
    }

    set dragging(value) {
        this.#state.dragging = value;
    }

    set disabled(value) {
        this.#state.disabled = value;

        if (value)
            this.slider.classList.add('disabled');
        else
            this.slider.classList.remove('disabled');
    }

    /**
     * Configura o Slider.
     */
    config() {
        // Define o tamanho do Slider.
        this.slider.style.width = this.width;

        this.activateBaseListeners();
        this.update();

        this.configured = true;
    }

    /**
     * Atualiza a interface do Slider.
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

        // Atualiza o tooltip do Slider.
        this.thumb.dataset.tooltip = this.value;

        // Atualiza o dataset do Slider.
        this.slider.dataset.value = this.value;
    }

    /**
     * Define o valor do Slider.
     * @param {number} value
     */
    setValue(value, propagate = true) {
        // Normaliza o valor.
        value = this.#normalizeValue(value);

        // Atualiza o valor do Slider.
        this.value = value;

        // Atualiza o label atribuído ao Slider.
        if (this.linkedLabel) {
            // Obtém o elemento do label.
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

        // Atualiza a interface do Slider.
        this.update();

        // Dispara o evento de alteração do Slider.
        if (propagate)
            this.dispatchChangeEvent();
    }

    /**
     * Retorna o valor atual do Slider.
     * @returns {number}
     */
    getValue() {
        return this.value;
    }

    /**
     * Adiciona listener personalizado.
     * @param {string} event
     * @param {Function} callback
     */
    addEventListener(event, callback) {
        this.slider.addEventListener(event, callback);
    }

    /**
     * Dispara evento de alteração.
     */
    dispatchChangeEvent() {
        this.slider.dispatchEvent(new CustomEvent('change', {
            detail: {
                value: this.value
            }
        }));
    }

    /**
     * Configura os listeners base.
     */
    activateBaseListeners() {
        this.thumb.addEventListener('mousedown', () => {
            if (this.disabled) return;

            this.dragging = true;
        });

        document.addEventListener('mouseup', () => {
            this.dragging = false;
        });

        document.addEventListener('mousemove', (event) => {
            if (!this.dragging) return;

            this.onMouseMove(event);
        });

        this.track.addEventListener('click', (event) => {
            if (this.disabled) return;

            this.onTrackClick(event);
        });
    }

    /**
     * Evento de movimentação do mouse.
     * @param {MouseEvent} event
     */
    onMouseMove(event) {
        this.updateFromPointer(event);
    }

    /**
     * Evento de clique na trilha.
     * @param {MouseEvent} event
     */
    onTrackClick(event) {
        this.updateFromPointer(event);
    }

    /**
     * Atualiza valor com base na posição do ponteiro.
     * @param {MouseEvent} event
     */
    updateFromPointer(event) {
        const rect = this.track.getBoundingClientRect();

        let percent = 0;

        if (this.direction === Slider.Directions.horizontal) {
            percent = (event.clientX - rect.left) / rect.width;
        } else {
            percent = (rect.bottom - event.clientY) / rect.height;
        }

        percent = Math.max(0, Math.min(1, percent));

        const rawValue =
            this.min + percent * (this.max - this.min);

        const steppedValue =
            Math.round(rawValue / this.step) * this.step;

        this.setValue(steppedValue);
    }

    /**
     * Normaliza o valor.
     * @param {number} value
     * @returns {number}
     */
    #normalizeValue(value) {
        value = Math.max(this.min, value);
        value = Math.min(this.max, value);

        return value;
    }
}