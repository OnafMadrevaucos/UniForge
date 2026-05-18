export default class ColorPicker {

    constructor(id, parent = null, options = {}) {

        this.parent = parent;

        if (!this.parent)
            throw new Error('O ColorPicker precisa de um elemento pai.');

        this.id = id;

        this.hue = 0;
        this.saturation = 100;
        this.level = 100;
        //this.lightness = 50;
        this.alpha = 1;

        // Permite inicialização por HEXA.
        if (options.value) {
            this.setValue(options.value, false);
        } else {
            this.hue = options.hue ?? 0;
            this.saturation = options.saturation ?? 100;
            this.lightness = options.lightness ?? 50;
            this.alpha = options.alpha ?? 1;
        }
    }

    #state = {
        configured: false,
        opened: false,
        draggingSpectrum: false,
        draggingHue: false,
        draggingAlpha: false
    }

    get colorPicker() {
        return this.parent.querySelector(`#${this.id}`);
    }

    get preview() {
        return this.colorPicker?.querySelector('.color-picker-preview') ?? null;
    }

    get popup() {
        return this.colorPicker?.querySelector('.color-picker-popup') ?? null;
    }

    get spectrum() {
        return this.colorPicker?.querySelector('.color-picker-spectrum') ?? null;
    }

    get spectrumCursor() {
        return this.colorPicker?.querySelector('.color-picker-spectrum-cursor') ?? null;
    }

    get hueSlider() {
        return this.colorPicker?.querySelector('.color-picker-hue') ?? null;
    }

    get hueThumb() {
        return this.colorPicker?.querySelector('.color-picker-hue-thumb') ?? null;
    }

    get alphaSlider() {
        return this.colorPicker?.querySelector('.color-picker-alpha') ?? null;
    }

    get alphaThumb() {
        return this.colorPicker?.querySelector('.color-picker-alpha-thumb') ?? null;
    }

    get display() {
        return this.colorPicker?.querySelector('.color-picker-display') ?? null;
    }

    get configured() {
        return this.#state.configured;
    }

    get opened() {
        return this.#state.opened;
    }

    get value() {
        return this.#hsvaToHexa();
    }

    set configured(value) {
        this.#state.configured = value;
    }

    set opened(value) {
        this.#state.opened = value;
        if (value) {
            this.colorPicker.classList.add('open');
            requestAnimationFrame(() => {
                this.updatePopupPosition();
            });

        } else {
            this.colorPicker.classList.remove('open');
        }
    }

    config() {
        this.activateBaseListeners();
        this.update();

        this.configured = true;
    }

    update(propagate = false) {
        const color = this.value;

        this.preview.style.background = color;
        this.display.textContent = color;
        this.colorPicker.dataset.tooltip = color;

        this.updateSpectrum();
        this.updateHue();
        this.updateAlpha();

        if (propagate)
            this.dispatchChangeEvent();
    }

    updateSpectrum() {

        const baseColor = `hsl(${this.hue}, 100%, 50%)`;

        this.spectrum.style.background = `
        linear-gradient(to top, black, transparent),
        linear-gradient(to right, white, ${baseColor})
        `;

        const x = this.saturation;
        const y = 100 - this.level;

        this.spectrumCursor.style.left = `${x}%`;
        this.spectrumCursor.style.top = `${y}%`;
    }

    updateHue() {
        this.hueThumb.style.left = `${(this.hue / 360) * 100}%`;
    }

    updateAlpha() {
        const solid = this.#hsvaToHexa();

        this.alphaSlider.style.background = `linear-gradient(to right, transparent, ${solid})`;
        this.alphaThumb.style.left = `${this.alpha * 100}%`;
    }

    setValue(value, propagate = true) {
        // Verifica se o valor é uma variável CSS e resolve seu valor.
        value = this.resolveCSSVariable(value);

        // Verifica se o valor é um HEX váldido.
        if (!this.#isValidHexa(value)) return;

        const hex = value.substring(1, 7);
        const alphaHex = value.substring(7, 9);

        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);

        const alpha = alphaHex ? parseInt(alphaHex, 16) / 255 : 1;

        const hsl = this.#rgbToHsl(r, g, b);

        this.hue = hsl.h;
        this.saturation = hsl.s;
        this.lightness = hsl.l;
        this.alpha = alpha;

        this.update(propagate);
    }

    addEventListener(event, callback) {
        this.colorPicker.addEventListener(event, callback);
    }

    dispatchChangeEvent() {
        this.colorPicker.dispatchEvent(new CustomEvent('change', {
            detail: {
                value: this.value,
                hue: this.hue,
                saturation: this.saturation,
                lightness: this.lightness,
                alpha: this.alpha
            }
        }));
    }

    activateBaseListeners() {
        this.preview.addEventListener('click', () => {
            this.opened = !this.opened;
        });

        document.addEventListener('click', (event) => {
            this.onOutsideClick(event);
        });

        document.addEventListener('contextmenu', () => {
            if (this.opened)
                this.opened = false;
        });

        this.activateSpectrumListeners();
        this.activateHueListeners();
        this.activateAlphaListeners();
    }

    activateSpectrumListeners() {

        this.spectrum.addEventListener('mousedown', (event) => {

            this.#state.draggingSpectrum = true;

            this.updateSpectrumFromEvent(event);
        });

        document.addEventListener('mousemove', (event) => {

            if (!this.#state.draggingSpectrum)
                return;

            this.updateSpectrumFromEvent(event);
        });

        document.addEventListener('mouseup', () => {

            if (this.#state.draggingSpectrum) {

                this.#state.draggingSpectrum = false;

                // Fecha ao concluir seleção.
                this.opened = false;
            }
        });
    }

    activateHueListeners() {

        this.hueSlider.addEventListener('mousedown', (event) => {

            this.#state.draggingHue = true;

            this.updateHueFromEvent(event);
        });

        document.addEventListener('mousemove', (event) => {

            if (!this.#state.draggingHue)
                return;

            this.updateHueFromEvent(event);
        });

        document.addEventListener('mouseup', () => {

            this.#state.draggingHue = false;
        });
    }

    activateAlphaListeners() {

        this.alphaSlider.addEventListener('mousedown', (event) => {

            this.#state.draggingAlpha = true;

            this.updateAlphaFromEvent(event);
        });

        document.addEventListener('mousemove', (event) => {

            if (!this.#state.draggingAlpha)
                return;

            this.updateAlphaFromEvent(event);
        });

        document.addEventListener('mouseup', () => {

            this.#state.draggingAlpha = false;
        });
    }

    updatePopupPosition() {

        const previewRect =
            this.preview.getBoundingClientRect();

        const popup =
            this.popup;

        // Reset inicial
        popup.style.left = '0px';
        popup.style.top = '52px';

        const popupRect = popup.getBoundingClientRect();

        let left = previewRect.left;
        let top = previewRect.bottom + 10;

        // Overflow direita
        if (left + popupRect.width > window.innerWidth) {

            left = window.innerWidth - popupRect.width - 10;
        }

        // Overflow esquerda
        if (left < 10)
            left = 10;

        // Overflow inferior
        if (top + popupRect.height > window.innerHeight) {

            top = previewRect.top - popupRect.height - 10;
        }

        // Overflow superior
        if (top < 10)
            top = 10;

        popup.style.left = `${left}px`;
        popup.style.top = `${top}px`;
    }

    updateSpectrumFromEvent(event) {
        const rect = this.spectrum.getBoundingClientRect();

        let x = (event.clientX - rect.left) / rect.width;
        let y = (event.clientY - rect.top) / rect.height;

        x = Math.max(0, Math.min(1, x));
        y = Math.max(0, Math.min(1, y));

        this.saturation = Math.round(x * 100);
        this.level = Math.round((1 - y) * 100);

        this.update(true);
    }

    updateHueFromEvent(event) {
        const rect = this.hueSlider.getBoundingClientRect();

        let percent = (event.clientX - rect.left) / rect.width;
        percent = Math.max(0, Math.min(1, percent));
        this.hue = Math.round(percent * 360);

        this.update(true);
    }

    updateAlphaFromEvent(event) {
        const rect = this.alphaSlider.getBoundingClientRect();

        let percent = (event.clientX - rect.left) / rect.width;
        percent = Math.max(0, Math.min(1, percent));
        this.alpha = percent;

        this.update(true);
    }

    resolveCSSVariable(value, element = document.documentElement) {
        // Se não for uma string, retorne o valor bruto.
        if (typeof value !== 'string') return value;

        // Remove os espaços em branco.
        value = value.trim();

        // Verifica se é uma variárivel CSS.
        if (!this.#isCSSVariable(value)) return value;

        // Extrai o nome da variável e o fallback.
        const match = value.match(/^var\(\s*(--[\w-]+)(?:\s*,\s*(.+))?\s*\)$/);
        // Não encontrou os dados da variável, retorne o valor bruto.
        if (!match) return value;

        // Extrai o nome da variável e o fallback.
        const variable = match[1];
        const fallback = match[2];

        // Resolve a variável CSS.
        const resolved = getComputedStyle(element).getPropertyValue(variable).trim();

        // Retorna o valor resolvido ou o fallback.
        return resolved || fallback || value;
    }

    onOutsideClick(event) {
        if (!this.colorPicker.contains(event.target))
            this.opened = false;
    }

    #hsvaToHexa(forceAlpha = null) {

        const h = this.hue;
        const s = this.saturation / 100;
        const v = this.level / 100;

        const alpha = forceAlpha ?? this.alpha;

        const c = v * s;

        const x = c * (1 - Math.abs((h / 60) % 2 - 1));

        const m = v - c;

        let r = 0;
        let g = 0;
        let b = 0;

        if (h < 60) {
            r = c; g = x; b = 0;
        }
        else if (h < 120) {
            r = x; g = c; b = 0;
        }
        else if (h < 180) {
            r = 0; g = c; b = x;
        }
        else if (h < 240) {
            r = 0; g = x; b = c;
        }
        else if (h < 300) {
            r = x; g = 0; b = c;
        }
        else {
            r = c; g = 0; b = x;
        }

        r = Math.round((r + m) * 255);
        g = Math.round((g + m) * 255);
        b = Math.round((b + m) * 255);

        const a = Math.round(alpha * 255);

        return `#${[r, g, b, a]
            .map(v => v.toString(16).padStart(2, '0'))
            .join('')
            .toUpperCase()}`;
    }

    #hslaToHexa(forceAlpha = null) {

        const h = this.hue;
        const s = this.saturation / 100;
        const l = this.lightness / 100;

        const alpha = forceAlpha ?? this.alpha;

        const c = (1 - Math.abs(2 * l - 1)) * s;

        const x =
            c * (1 - Math.abs((h / 60) % 2 - 1));

        const m =
            l - c / 2;

        let r = 0;
        let g = 0;
        let b = 0;

        if (h < 60) {
            r = c; g = x; b = 0;
        }
        else if (h < 120) {
            r = x; g = c; b = 0;
        }
        else if (h < 180) {
            r = 0; g = c; b = x;
        }
        else if (h < 240) {
            r = 0; g = x; b = c;
        }
        else if (h < 300) {
            r = x; g = 0; b = c;
        }
        else {
            r = c; g = 0; b = x;
        }

        r =
            Math.round((r + m) * 255);

        g =
            Math.round((g + m) * 255);

        b =
            Math.round((b + m) * 255);

        const a =
            Math.round(alpha * 255);

        return `#${[r, g, b, a]
            .map(v => v.toString(16).padStart(2, '0'))
            .join('')
            .toUpperCase()}`;
    }

    #rgbToHsl(r, g, b) {

        r /= 255;
        g /= 255;
        b /= 255;

        const max =
            Math.max(r, g, b);

        const min =
            Math.min(r, g, b);

        let h;
        let s;
        let l =
            (max + min) / 2;

        if (max === min) {

            h = s = 0;

        } else {

            const d =
                max - min;

            s =
                l > 0.5
                    ? d / (2 - max - min)
                    : d / (max + min);

            switch (max) {

                case r:
                    h =
                        (g - b) / d +
                        (g < b ? 6 : 0);
                    break;

                case g:
                    h =
                        (b - r) / d + 2;
                    break;

                case b:
                    h =
                        (r - g) / d + 4;
                    break;
            }

            h /= 6;
        }

        return {
            h: Math.round(h * 360),
            s: Math.round(s * 100),
            l: Math.round(l * 100)
        };
    }

    #isCSSVariable(value) {
        if (typeof value !== 'string')
            return false;

        value = value.trim();
        return /^var\(\s*--[\w-]+(?:\s*,\s*.+)?\s*\)$/.test(value);
    }

    #isValidHexa(value) {
        return /^#(?:[A-Fa-f0-9]{3}|[A-Fa-f0-9]{4}|[A-Fa-f0-9]{6}|[A-Fa-f0-9]{8})$/.test(value);
    }
}