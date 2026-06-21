/**
 * Classe que gerencia um componente de seleção de cores (Color Picker).
 * Suporta manipulação nos espaços de cores HSV, HSL, RGB e HEXA, além de resolver variáveis CSS.
 */
export default class ColorPicker {

    /**
     * Instancia um novo ColorPicker.
     * @param {string} id - O ID único do elemento DOM do color picker.
     * @param {HTMLElement} [parent=null] - O elemento pai onde o color picker está contido.
     * @param {Object} [options={}] - Configurações opcionais de inicialização.
     * @param {string} [options.value] - Valor inicial da cor em formato HEX/HEXA ou Variável CSS.
     * @param {number} [options.hue=0] - Matiz inicial (0-360).
     * @param {number} [options.saturation=100] - Saturação inicial (0-100).
     * @param {number} [options.lightness=50] - Luminosidade inicial (0-100).
     * @param {number} [options.alpha=1] - Opacidade inicial (0-1).
     * @param {string} [options.tooltip] - Texto de dica (tooltip) para o preview de cor.
     * @param {boolean} [options.fixedAlpha=false] - Indica se a opacidade deve ser fixa.
     * @throws {Error} Se o elemento pai não for fornecido.
     */
    constructor(id, parent = null, options = {}) {

        this.parent = parent;

        // Validação obrigatória do elemento pai
        if (!this.parent)
            throw new Error('O ColorPicker precisa de um elemento pai.');

        this.id = id;

        // Permite inicialização direta por uma string de cor (Ex: HEXA).
        if (options.value) {
            this.setValue(options.value, false); // Não propaga o evento na construção.
        } else {
            // Inicialização das propriedades internas de estado da cor (Padrão HSVA),
            // usa os canais individuais fornecidos ou os valores padrão.
            this.hue = options.hue ?? 0;
            this.saturation = options.saturation ?? 100;
            this.level = options.level ?? 50; // Guardado para compatibilidade com HSL se necessário.   
            this.alpha = options.alpha ?? 1;
        }



        // Configuração de tooltip opcional.
        if (options.tooltip) {
            this.tooltip = options.tooltip;
        }

        // Configuração de opacidade fixa opcional.
        if (options.fixedAlpha) {
            this.fixedAlpha = options.fixedAlpha;

            // Inicializa o canal alpha, respeitando a configuração de opacidade fixa se definida.
            this.alpha = options.alpha ?? 1;
        }
    }

    /**
     * Estado privado de controle de interações do componente (Flags de arrasto e abertura).
     * @type {{configured: boolean, disabled: boolean, opened: boolean, draggingSpectrum: boolean, draggingHue: boolean, draggingAlpha: boolean}}
     */
    #state = {
        configured: false,
        disabled: false,
        opened: false,
        draggingSpectrum: false,
        draggingHue: false,
        draggingAlpha: false
    }

    // --- GETTERS DO DOM ---
    // Buscam dinamicamente os subelementos do Color Picker dentro do container pai.

    /** @returns {HTMLElement|null} O elemento container principal do color picker. */
    get colorPicker() {
        return this.parent.querySelector(`#${this.id}`);
    }
    /** @returns {HTMLElement|null} O quadrado/círculo que mostra a cor atualmente selecionada. */
    get preview() {
        return this.colorPicker?.querySelector('.color-picker-preview') ?? null;
    }
    /** @returns {HTMLElement|null} O painel flutuante (dropdown) que contém os seletores. */
    get popup() {
        return this.colorPicker?.querySelector('.color-picker-popup') ?? null;
    }
    /** @returns {HTMLElement|null} A área bidimensional de saturação e brilho (Value). */
    get spectrum() {
        return this.colorPicker?.querySelector('.color-picker-spectrum') ?? null;
    }
    /** @returns {HTMLElement|null} O marcador visual sobre a área de espectro. */
    get spectrumCursor() {
        return this.colorPicker?.querySelector('.color-picker-spectrum-cursor') ?? null;
    }
    /** @returns {HTMLElement|null} A barra de seleção do Matiz (Hue). */
    get hueSlider() {
        return this.colorPicker?.querySelector('.color-picker-hue') ?? null;
    }
    /** @returns {HTMLElement|null} O marcador da barra de matiz. */
    get hueThumb() {
        return this.colorPicker?.querySelector('.color-picker-hue-thumb') ?? null;
    }
    /** @returns {HTMLElement|null} A barra de seleção de opacidade (Alpha). */
    get alphaSlider() {
        return this.colorPicker?.querySelector('.color-picker-alpha') ?? null;
    }
    /** @returns {HTMLElement|null} O marcador da barra de opacidade. */
    get alphaThumb() {
        return this.colorPicker?.querySelector('.color-picker-alpha-thumb') ?? null;
    }
    /** @returns {HTMLInputElement|null} O campo de texto que exibe e recebe o código HEX. */
    get display() {
        return this.colorPicker?.querySelector('.color-picker-display input') ?? null;
    }
    /** @returns {HTMLElement|null} Botão para limpar/resetar a cor. */
    get clearBtn() {
        return this.colorPicker?.querySelector('#colorPickerClear') ?? null;
    }
    /** @returns {HTMLElement|null} Botão para confirmar a seleção. */
    get acceptBtn() {
        return this.colorPicker?.querySelector('#colorPickerAccept') ?? null;
    }

    // --- GETTERS E SETTERS DE ESTADO ---

    /** @returns {boolean} Se os ouvintes de eventos básicos já foram anexados. */
    get configured() {
        return this.#state.configured;
    }
    /** @returns {boolean} Se o popup está atualmente visível. */
    get opened() {
        return this.#state.opened;
    }
    /** @returns {boolean} Se o color picker está desativado. */
    get disabled() {
        return this.#state.disabled;
    }
    /** @returns {string} Retorna o valor atual da cor convertida em string HEXA (ex: #FFFFFFFF) */
    get value() {
        if (this.fixedAlpha) return this.#hsvaToHexa(this.alpha);
        else return this.#hsvaToHexa();
    }
    /** @returns {string} Retorna o valor atual da cor desconsiderando o valor de opacidade (ex: #FFFFFF) */
    get color() {
        return this.#hsvaToHexa(null, true); // Força o alpha para 1 (totalmente opaco) para obter apenas a parte RGB.
    }
    /** @returns {number} Retorna o valor atual da cor convertida em string HEXA (ex: #FFFFFF) */
    get opacity() {
        return this.alpha;
    }

    /** @param {boolean} value */
    set configured(value) {
        this.#state.configured = value;
    }
    /** @param {boolean} value */
    set disabled(value) {
        this.#state.disabled = value;

        this.preview.classList.toggle('disabled', value);
    }

    /**
     * Abre ou fecha o painel do color picker alternando classes CSS e recalculando a posição.
     * @param {boolean} value
     */
    set opened(value) {
        this.#state.opened = value;
        if (value && !this.disabled) {
            this.colorPicker.classList.add('open');
            // Utiliza requestAnimationFrame para garantir que o elemento esteja renderizado antes de calcular o posicionamento.
            requestAnimationFrame(() => {
                this.updatePopupPosition();
            });
        } else {
            this.colorPicker.classList.remove('open');
        }
    }

    /**
     * Inicializa o componente ativando os ouvintes de eventos e atualizando a interface visual.
     */
    config() {
        this.activateBaseListeners();
        this.update();

        if (this.fixedAlpha) {
            this.alphaSlider.style.display = 'none';
            this.alphaThumb.style.display = 'none';
        }

        this.configured = true;
    }

    /**
     * Atualiza todos os elementos visuais da interface com base nos valores internos de HSVA.
     * @param {boolean} [propagate=false] - Define se o evento customizado 'change' deve ser disparado.
     */
    update(propagate = false) {
        const color = this.value;

        // Atualiza a cor de fundo do preview e o texto do input de exibição.
        this.preview.style.background = color;
        this.display.value = this.fixedAlpha ? this.color : color;

        // Atualiza o atributo de tooltip se configurado.
        if (this.tooltip)
            this.preview.dataset.tooltip = this.tooltip;

        // Renderiza as posições dos cursores e fundos das barras.
        this.updateSpectrum();
        this.updateHue();
        this.updateAlpha();

        // Dispara o evento de mudança se solicitado.
        if (propagate)
            this.dispatchChangeEvent();
    }

    /**
     * Atualiza o gradiente de fundo da área de espectro e posiciona o cursor bidimensional (Saturação e Brilho).
     */
    updateSpectrum() {
        // Cor base puramente saturada baseada no Matiz (Hue) atual.
        const baseColor = `hsl(${this.hue}, 100%, 50%)`;

        // O fundo é uma composição de um gradiente preto (vertical), um branco-para-cor-base (horizontal).
        this.spectrum.style.background = `
        linear-gradient(to top, black, transparent),
        linear-gradient(to right, white, ${baseColor})
        `;

        // Mapeia Saturação no eixo X e Nível (Value/Brilho) invertido no eixo Y.
        const x = this.saturation;
        const y = 100 - this.level;

        this.spectrumCursor.style.left = `${x}%`;
        this.spectrumCursor.style.top = `${y}%`;
    }

    /**
     * Posiciona horizontalmente o marcador na barra de Matiz (0 a 360 graus).
     */
    updateHue() {
        this.hueThumb.style.left = `${(this.hue / 360) * 100}%`;
    }

    /**
     * Atualiza o fundo da barra de opacidade (do transparente à cor sólida atual) e posiciona seu marcador.
     */
    updateAlpha() {
        const solid = this.#hsvaToHexa(); // Cor sem transparência aparente (indireta, baseada no estado atual).

        this.alphaSlider.style.background = `linear-gradient(to right, transparent, ${solid})`;
        this.alphaThumb.style.left = `${this.alpha * 100}%`;
    }

    /**
     * Define uma nova cor para o componente a partir de uma string (HEX, HEXA ou Variável CSS).
     * @param {string} value - Código da cor ou variável.
     * @param {boolean} [propagate=true] - Define se vai disparar o evento de mudança.
     */
    setValue(value, propagate = true) {

        // Se for uma variável CSS (ex: var(--primary)), tenta obter o valor real dela.
        value = this.resolveCSSVariable(value);

        // Aborta se o formato não for um HEX válido (#FFF, #FFFF, #FFFFFF, #FFFFFFFF).
        if (!this.#isValidHexa(value))
            return;

        let hex = value.substring(1); // Remove o caractere '#'.

        // Expande formatos curtos: #FFF -> #FFFFFF | #F4DE -> #FF44Ddee.
        if (hex.length === 3 || hex.length === 4) {
            hex = hex.split('')
                .map(char => char + char)
                .join('');
        }

        // Se não possuir canal alpha, define como totalmente opaco (FF).
        if (hex.length === 6 && !this.fixedAlpha)
            hex += 'FF';

        // Converte os pares hexadecimais para inteiros decimais (0-255).
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        const alpha = parseInt(hex.substring(6, 8), 16) / 255; // Normaliza alpha para 0-1.

        // Converte RGB para o modelo HSV usado internamente pelo seletor.
        const hsv = this.#rgbToHsv(r, g, b);

        // Atualiza as propriedades internas.
        this.hue = hsv.h;
        this.saturation = hsv.s;
        this.level = hsv.v;
        this.alpha = this.fixedAlpha ? this.alpha : alpha;

        // Renderiza as mudanças na tela.
        this.update(propagate);
    }

    /**
     * Atalho semântico para o método setValue.
     * @param {string} value 
     * @param {boolean} [propagate=true] 
     */
    setColor(value, propagate = true) {
        this.setValue(value, propagate);
    }

    /**
     * Adiciona um escutador de eventos diretamente no elemento container do color picker.
     * @param {string} event - Nome do evento (ex: 'change').
     * @param {Function} callback - Função a ser executada.
     */
    addEventListener(event, callback) {
        this.colorPicker.addEventListener(event, callback);
    }

    /**
     * Dispara um CustomEvent do tipo 'change' contendo os detalhes detalhados da cor atual.
     */
    dispatchChangeEvent() {
        this.colorPicker.dispatchEvent(new CustomEvent('change', {
            detail: {
                value: this.value,
                hue: this.hue,
                saturation: this.saturation,
                level: this.level,
                alpha: this.alpha
            }
        }));
    }

    /**
     * Vincula todos os ouvintes de eventos estruturais do componente (cliques de abertura, fechamento externo, etc.).
     */
    activateBaseListeners() {
        // Alterna abertura ao clicar no botão/quadrado de preview.
        this.preview.addEventListener('click', () => {
            this.opened = !this.opened;
        });

        // Clique com botão direito no preview copia a cor para a área de transferência.
        this.preview.addEventListener('contextmenu', async (event) => {
            event.preventDefault(); // Evita o menu de contexto nativo do navegador.

            try {
                await navigator.clipboard.writeText(this.value);
                // Exibe uma mensagem na tela usando um framework/utilitário externo assumido ('uniforge').
                uniforge.ctrls.msgBox.showInfo(`Cor enviada para a área de transferência.`);
            } catch (error) {
                console.error('Não foi possível copiar a cor.', error);
            }
        });

        // Escuta modificações manuais digitadas diretamente no input de texto.
        this.display.addEventListener('change', (event) => { this.onDisplayChange(event); });

        // Fecha o seletor se houver um clique em qualquer lugar fora do componente.
        document.addEventListener('click', (event) => {
            this.onOutsideClick(event);
        });

        // Fecha o seletor se o usuário abrir o menu de contexto (botão direito) em qualquer parte do documento.
        document.addEventListener('contextmenu', () => {
            if (this.opened)
                this.opened = false;
        });

        // Ativa os listeners específicos de arrastar/interagir com os controles visuais.
        this.activateSpectrumListeners();
        this.activateHueListeners();
        this.activateAlphaListeners();
        this.activateButtonsListeners();
    }

    /**
     * Configura o comportamento de arrastar (Drag & Drop) na área bidimensional do espectro de cor.
     */
    activateSpectrumListeners() {
        this.spectrum.addEventListener('mousedown', (event) => {
            this.#state.draggingSpectrum = true;
            this.updateSpectrumFromEvent(event);
        });

        document.addEventListener('mousemove', (event) => {
            if (!this.#state.draggingSpectrum) return;
            this.updateSpectrumFromEvent(event);
        });

        document.addEventListener('mouseup', () => {
            if (this.#state.draggingSpectrum) {
                this.#state.draggingSpectrum = false;
            }
        });
    }

    /**
     * Configura o comportamento de arrastar na barra deslizante de Matiz (Hue).
     */
    activateHueListeners() {
        this.hueSlider.addEventListener('mousedown', (event) => {
            this.#state.draggingHue = true;
            this.updateHueFromEvent(event);
        });

        document.addEventListener('mousemove', (event) => {
            if (!this.#state.draggingHue) return;
            this.updateHueFromEvent(event);
        });

        document.addEventListener('mouseup', () => {
            this.#state.draggingHue = false;
        });
    }

    /**
     * Configura o comportamento de arrastar na barra deslizante de Transparência (Alpha).
     */
    activateAlphaListeners() {
        this.alphaSlider.addEventListener('mousedown', (event) => {
            this.#state.draggingAlpha = true;
            this.updateAlphaFromEvent(event);
        });

        document.addEventListener('mousemove', (event) => {
            if (!this.#state.draggingAlpha) return;
            this.updateAlphaFromEvent(event);
        });

        document.addEventListener('mouseup', () => {
            this.#state.draggingAlpha = false;
        });
    }

    /**
     * Vincula os eventos de cliques para os botões de ação (Limpar e Aceitar).
     */
    activateButtonsListeners() {
        this.clearBtn.addEventListener('click', (event) => { this.onClearButtonClick(event); });
        this.acceptBtn.addEventListener('click', (event) => { this.onAcceptButtonClick(event); });
    }

    /**
     * Ajusta dinamicamente as coordenadas X/Y do popup para evitar que ele fique cortado nas bordas da tela.
     */
    updatePopupPosition() {
        const previewRect = this.preview.getBoundingClientRect();
        const popup = this.popup;

        // Reset de posicionamento padrão css inicial relativo.
        popup.style.left = '5px';
        popup.style.top = '140px';

        const popupRect = popup.getBoundingClientRect();

        let left = previewRect.left;
        let top = previewRect.height + 10; // Posiciona logo abaixo do preview com 10px de margem.

        // Prevenção de estouro na borda direita da viewport.
        if (left + popupRect.width > window.innerWidth) {
            left = (popupRect.width) * -1;
        }        

        // Prevenção de estouro na borda inferior (joga o popup para cima do preview).
        if (top + popupRect.height > window.innerHeight) {
            top = (10 + popupRect.height) * -1;
        }       

        // Aplica o posicionamento absoluto calculado baseado na viewport.
        popup.style.left = `${left}px`;
        popup.style.top = `${top}px`;
    }

    /**
     * Calcula e atualiza a Saturação e o Brilho baseando-se nas coordenadas do clique/arrasto no Espectro.
     * @param {MouseEvent} event 
     */
    updateSpectrumFromEvent(event) {
        const rect = this.spectrum.getBoundingClientRect();

        // Obtém a porcentagem da posição do clique relativa à largura (x) e altura (y) do elemento.
        let x = (event.clientX - rect.left) / rect.width;
        let y = (event.clientY - rect.top) / rect.height;

        // Restringe os valores entre 0 e 1 (clamp).
        x = Math.max(0, Math.min(1, x));
        y = Math.max(0, Math.min(1, y));

        // Saturação cresce da esquerda para a direita (0 a 100).
        this.saturation = Math.round(x * 100);
        // O nível cresce de baixo para cima, por isso inverte-se o eixo Y (1 - y).
        this.level = Math.round((1 - y) * 100);

        this.update(true); // Atualiza os elementos visuais e propaga alteração.
    }

    /**
     * Calcula e atualiza o Matiz (Hue) com base no clique/arrasto na barra correspondente.
     * @param {MouseEvent} event 
     */
    updateHueFromEvent(event) {
        const rect = this.hueSlider.getBoundingClientRect();

        let percent = (event.clientX - rect.left) / rect.width;
        percent = Math.max(0, Math.min(1, percent));

        // Mapeia a porcentagem horizontal para a roda de cores de 0 a 360 graus.
        this.hue = Math.round(percent * 360);

        this.update(true);
    }

    /**
     * Calcula e atualiza a Opacidade (Alpha) com base no clique/arrasto na barra correspondente.
     * @param {MouseEvent} event 
     */
    updateAlphaFromEvent(event) {
        const rect = this.alphaSlider.getBoundingClientRect();

        let percent = (event.clientX - rect.left) / rect.width;
        percent = Math.max(0, Math.min(1, percent));

        // Atribui diretamente o valor percentual (0.0 a 1.0).
        this.alpha = percent;

        this.update(true);
    }

    /**
     * Tenta interceptar strings do tipo 'var(--nome-da-variavel)' e extrair seu valor hexadecimal computado real no CSS.
     * @param {string} value - String candidata a variável CSS.
     * @param {HTMLElement} [element=document.documentElement] - Elemento do DOM onde buscar o estilo computado (padrão é a raiz :root).
     * @returns {string} O valor hexadecimal resolvido, o fallback definido ou o próprio valor de entrada.
     */
    resolveCSSVariable(value, element = document.documentElement) {
        if (typeof value !== 'string') return value;

        value = value.trim();

        // Retorna o valor original caso não passe no teste de regex de variável CSS.
        if (!this.#isCSSVariable(value)) return value;

        // Extrai o nome exato da variável (Grupo 1) e o valor de fallback se houver (Grupo 2).
        const match = value.match(/^var\(\s*(--[\w-]+)(?:\s*,\s*(.+))?\s*\)$/);
        if (!match) return value;

        const variable = match[1];
        const fallback = match[2];

        // Consulta os estilos computados do navegador para ler o valor da propriedade CSS customizada.
        const resolved = getComputedStyle(element).getPropertyValue(variable).trim();

        // Retorna priorizando: Valor resolvido do CSS > Fallback declarado > Valor bruto original.
        return resolved || fallback || value;
    }

    /**
     * Fecha o popup se o clique do usuário ocorrer completamente fora da árvore de nós do Color Picker.
     * @param {MouseEvent} event 
     */
    onOutsideClick(event) {
        if (!this.colorPicker.contains(event.target))
            this.opened = false;
    }

    /**
     * Manipulador executado quando o valor do campo de texto (input) é alterado manualmente.
     * @param {Event} event 
     */
    onDisplayChange(event) {
        const input = event.target.closest('input');
        this.setValue(input.value);
    }

    /**
     * Manipulador do botão de limpar, redefine a cor por padrão para branco totalmente opaco.
     * @param {MouseEvent} event 
     */
    onClearButtonClick(event) {
        event.stopPropagation(); // Impede o fechamento ou ações indesejadas pelo borbulhamento do clique
        this.setValue('#FFFFFFFF');
    }

    /**
     * Manipulador do botão de aceitar, fecha a janela do popup mantendo a seleção.
     * @param {MouseEvent} event 
     */
    onAcceptButtonClick(event) {
        event.stopPropagation();
        this.opened = false;
    }

    /**
     * Converte os valores matemáticos internos de HSVA (Hue, Saturation, Value, Alpha) para uma string Hexadecimal de 8 caracteres (#RRGGBBAA).
     * @param {number|null} [forceAlpha=null] - Permite forçar uma opacidade diferente da armazenada no estado.
     * @returns {string} Código de cor formato HEXA em letras maiúsculas.
     * @private
     */
    #hsvaToHexa(forceAlpha = null, noAlpha = false) {
        const h = this.hue;
        const s = this.saturation / 100;
        const v = this.level / 100;

        const alpha = forceAlpha ?? this.alpha;

        // Algoritmo matemático tradicional de conversão HSV para RGB.
        const c = v * s; // Croma
        const x = c * (1 - Math.abs((h / 60) % 2 - 1));
        const m = v - c;

        let r = 0;
        let g = 0;
        let b = 0;

        // Determina os canais RGB intermediários com base no setor do Matiz (círculo trigonométrico de 360°).
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

        // Converte os valores para escala byte (0-255) aplicando a correspondência do ponto mínimo (m).
        r = Math.round((r + m) * 255);
        g = Math.round((g + m) * 255);
        b = Math.round((b + m) * 255);

        const a = Math.round(alpha * 255);

        // Retorna o código de cor RGB sem o alfa.
        if (noAlpha) {
            // Mapeia o array numérico para strings hexadecimais preenchendo com zero à esquerda se necessário.
            return `#${[r, g, b]
                .map(v => v.toString(16).padStart(2, '0'))
                .join('')
                .toUpperCase()}`;
        }
        else {
            // Mapeia o array numérico para strings hexadecimais preenchendo com zero à esquerda se necessário.
            return `#${[r, g, b, a]
                .map(v => v.toString(16).padStart(2, '0'))
                .join('')
                .toUpperCase()}`;
        }
    }

    /**
     * Converte coordenadas de cor RGB individuais (0-255) em valores do sistema HSV ({h, s, v}).
     * @param {number} r - Canal vermelho (0-255).
     * @param {number} g - Canal verde (0-255).
     * @param {number} b - Canal azul (0-255).
     * @returns {{h: number, s: number, v: number}} Objeto mapeando Matiz (0-360), Saturação (0-100) e Brilho (0-100).
     * @private
     */
    #rgbToHsv(r, g, b) {
        // Reduz para escala fracionada (0 a 1).
        r /= 255;
        g /= 255;
        b /= 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const delta = max - min;

        let h = 0;

        // Cálculo da Matiz (Hue) baseado em qual canal RGB é o maior (dominante).
        if (delta !== 0) {
            switch (max) {
                case r:
                    h = 60 * (((g - b) / delta) % 6);
                    break;
                case g:
                    h = 60 * (((b - r) / delta) + 2);
                    break;
                case b:
                    h = 60 * (((r - g) / delta) + 4);
                    break;
            }
        }

        // Garante que o ângulo do Matiz seja sempre positivo.
        if (h < 0)
            h += 360;

        // Cálculo da Saturação.
        const s = max === 0 ? 0 : delta / max;

        // O Brilho (Value) é equivalente ao maior canal normalizado.
        const v = max;

        return {
            h: Math.round(h),
            s: Math.round(s * 100),
            v: Math.round(v * 100)
        };
    }

    /**
     * Testa via Expressão Regular se a string corresponde à estrutura de chamada de variáveis CSS nativas.
     * @param {*} value - Valor a ser testado.
     * @returns {boolean} True se corresponder à máscara do padrão CSS.
     * @private
     */
    #isCSSVariable(value) {
        if (typeof value !== 'string')
            return false;

        value = value.trim();
        // Regex procura por estruturas do tipo: var(--qualquer-coisa) ou var(--nome, fallback).
        return /^var\(\s*(--[\w-]+)(?:\s*,\s*.+)?\s*\)$/.test(value);
    }

    /**
     * Valida se uma string é um código hexadecimal aceitável pelo interpretador.
     * @param {string} value - String da cor em formato hex.
     * @returns {boolean} True se a string possuir 3, 4, 6 ou 8 caracteres hexadecimais precedidos por '#'.
     * @private
     */
    #isValidHexa(value) {
        return /^#(?:[A-Fa-f0-9]{3}|[A-Fa-f0-9]{4}|[A-Fa-f0-9]{6}|[A-Fa-f0-9]{8})$/.test(value);
    }
}