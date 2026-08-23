import ColorPicker from "../controls/colorPicker.js";
import BaseDialog from "./baseDialog.js";

export default class ThemeDialog extends BaseDialog {
    constructor(dialogData = {}, options = {}) {
        super(dialogData, uniforge.utils.mergeObjects(options, {
            height: '550px',
            width: '350px'
        }));

        // Define o template do diálogo.
        this.template = 'themeDialog';

        this.css = this.data.css;

        // Verifica se se trata de uma edição de um Tema.
        this.isEdit = options.isEdit ?? false;

        // Verifica se se trata de um clone de um Tema já existente.
        this.isClone = options.isClone ?? false;

        // Propriedade que armazena todos os controles dos Color Pickers do Dialog.
        this.pickers = {
            darkAColorPicker: null,
            mainAColorPicker: null,
            lightAColorPicker: null,

            darkBColorPicker: null,
            mainBColorPicker: null,
            lightBColorPicker: null,

            darkCColorPicker: null,
            mainCColorPicker: null,
            lightCColorPicker: null,

            darkDColorPicker: null,
            mainDColorPicker: null,
            lightDColorPicker: null,

            specialColorPicker: null,

            darkHighlightColorPicker: null,
            highlightColorPicker: null,

            darkBackgroundColorPicker: null,
            mainBackgroundColorPicker: null,
            lightBackgroundColorPicker: null,

            quoteBackgroundColorPicker: null,
        }
        // Tema padrão.
        this.theme = {
            '--name': this.isEdit ? this.css['--name'] : '',

            '--default-font': this.isEdit ? this.css['--default-font'] : '',

            '--dark-color-a': this.isEdit ? this.css['--dark-color-a'] : '#000000',
            '--color-a': this.isEdit ? this.css['--color-a'] : '#000000',
            '--light-color-a': this.isEdit ? this.css['--light-color-a'] : '#000000',
            '--dark-color-a-T85': '',
            '--dark-color-a-T50': '',

            '--dark-color-b': this.isEdit ? this.css['--dark-color-b'] : '#000000',
            '--dark-color-b-T50': '',
            '--dark-color-b-T85': '',
            '--color-b': this.isEdit ? this.css['--color-b'] : '#000000',
            '--color-b-T50': '',
            '--color-b-T85': '',
            '--light-color-b': this.isEdit ? this.css['--light-color-b'] : '#000000',

            '--dark-color-c': this.isEdit ? this.css['--dark-color-c'] : '#000000',
            '--color-c': this.isEdit ? this.css['--color-c'] : '#000000',
            '--color-c-T85': '0',
            '--light-color-c': this.isEdit ? this.css['--light-color-c'] : '#000000',

            '--dark-color-d': this.isEdit ? this.css['--dark-color-d'] : '#000000',
            '--color-d': this.isEdit ? this.css['--color-d'] : '#000000',
            '--light-color-d': this.isEdit ? this.css['--light-color-d'] : '#000000',

            '--special-color': this.isEdit ? this.css['--special-color'] : '#000000',

            '--dark-highlight-color': this.isEdit ? this.css['--dark-highlight-color'] : '#000000',
            '--highlight-color': this.isEdit ? this.css['--highlight-color'] : '#000000',

            '--dark-background-color': this.isEdit ? this.css['--dark-background-color'] : '#000000',
            '--background-color': this.isEdit ? this.css['--background-color'] : '#000000',
            '--light-background-color': this.isEdit ? this.css['--light-background-color'] : '#000000',
            '--blockquote-background': this.isEdit ? this.css['--blockquote-background'] : '#000000',

            '--text-color': this.isEdit ? this.css['--text-color'] : '#000000',
            '--light-text-color': this.isEdit ? this.css['--light-text-color'] : '#000000',
            '--dark-text-color': this.isEdit ? this.css['--dark-text-color'] : '#000000',
            '--disabled-text-color': this.isEdit ? this.css['--disabled-text-color'] : '#000000',

            '--shadow-color': this.isEdit ? this.css['--shadow-color'] : '#000000',

            /* Borders Radius */
            '--tiny-border-radius': '',
            '--small-border-radius': '',
            '--default-border-radius': '',
            '--strong-border-radius': '',
            '--circular-border-radius': '',
            '--scrollbar-border-radius': '',
            '--slider-border-radius': '',
            '--track-border-radius': '',
            '--small-title-header-radius': '',
            '--title-header-radius': '',
            '--topbar-border-radius': '',
            '--toggle-tab-border-radius': '',

            /* Tooltip */
            '--tooltip-background': '',
            '--tooltip-text': '',
            '--tooltip-muted': '',
            '--tooltip-border': '',
            '--tooltip-divider': '',
            '--tooltip-title': ''
        }
    }

    /**
   * Prepara os dados do diálogo e configura o diálogo com os dados preparados.
   * @inheritdoc
   * @async
   */
    async prepareData() {
        const fonts = uniforge.constants.fonts.families;
        this.data.fonts = fonts.entries().map(([key, value]) => ({ _id: key.replaceAll("\"", ""), _label: key.replaceAll("\"", "") })).toArray();

        this.data.colorList = {
            "Cor A": [
                { _id: "color-a", _label: "Padrão" },
                { _id: "dark-color-a", _label: "Escura" },
                { _id: "dark-color-a-T85", _label: "Escura (85%)" },
                { _id: "dark-color-a-T50", _label: "Escura (50%)" },
                { _id: "light-color-a", _label: "Clara" }
            ],

            "Cor B": [
                { _id: "color-b", _label: "Padrão" },
                { _id: "color-b-T85", _label: "Padrão (85%)" },
                { _id: "color-b-T50", _label: "Padrão (50%)" },
                { _id: "dark-color-b", _label: "Escura" },
                { _id: "dark-color-b-T85", _label: "Escura (85%)" },
                { _id: "dark-color-b-T50", _label: "Escura (50%)" },
                { _id: "light-color-b", _label: "Clara" }
            ],

            "Cor C": [
                { _id: "color-c", _label: "Padrão" },
                { _id: "color-c-T85", _label: "Padrão (85%)" },
                { _id: "dark-color-c", _label: "Escura" },
                { _id: "light-color-c", _label: "Clara" }
            ],

            "Cor D": [
                { _id: "color-d", _label: "Padrão" },
                { _id: "dark-color-d", _label: "Escura" },
                { _id: "light-color-d", _label: "Clara" }
            ],

            "Especiais": [
                { _id: "special-color", _label: "Padrão" },
                { _id: "highlight-color", _label: "Destaque" },
                { _id: "dark-highlight-color", _label: "Escura" }
            ]
        };
    }

    configureContent() {
        const fontSelectOptions = this.querySelectorAll("#fontSelect option");
        fontSelectOptions.forEach(option => {
            option.style.fontFamily = `"${option.value}"`;
        });

        if (!this.isClone) {
            const themeNameInput = this.querySelector("#themeNameInput");
            themeNameInput.value = this.theme['--name'];

            themeNameInput.disabled = true;
        }

        this.configureColorPickers();

        this.configureCombos();

        const generateButton = this.querySelector("#generate.dialog-button");
        generateButton.setAttribute('data-json', JSON.stringify(this.theme));
    }

    configureColorPickers() {
        var container = this.querySelector('.theme-dialog .data-complex.color-a');

        this.pickers.darkAColorPicker = new ColorPicker('darkAColorPicker', container, {
            value: this.theme['--dark-color-a'],
            tooltip: 'Cor A Escura'
        });
        this.pickers.darkAColorPicker.config({ dataset: { name: '--dark-color-a' } });

        this.pickers.mainAColorPicker = new ColorPicker('mainAColorPicker', container, {
            value: this.theme['--color-a'],
            tooltip: 'Cor A Padrão'
        });
        this.pickers.mainAColorPicker.config({ dataset: { name: '--color-a' } });

        this.pickers.lightAColorPicker = new ColorPicker('lightAColorPicker', container, {
            value: this.theme['--light-color-a'],
            tooltip: 'Cor A Clara'
        });
        this.pickers.lightAColorPicker.config({ dataset: { name: '--light-color-a' } });

        container = this.querySelector('.theme-dialog .data-complex.color-b');

        this.pickers.darkBColorPicker = new ColorPicker('darkBColorPicker', container, {
            value: this.theme['--dark-color-b'],
            tooltip: 'Cor B Escura'
        });
        this.pickers.darkBColorPicker.config({ dataset: { name: '--dark-color-b' } });

        this.pickers.mainBColorPicker = new ColorPicker('mainBColorPicker', container, {
            value: this.theme['--color-b'],
            tooltip: 'Cor B Padrão'
        });
        this.pickers.mainBColorPicker.config({ dataset: { name: '--color-b' } });

        this.pickers.lightBColorPicker = new ColorPicker('lightBColorPicker', container, {
            value: this.theme['--light-color-b'],
            tooltip: 'Cor B Clara'
        });
        this.pickers.lightBColorPicker.config({ dataset: { name: '--light-color-b' } });

        container = this.querySelector('.theme-dialog .data-complex.color-c');

        this.pickers.darkCColorPicker = new ColorPicker('darkCColorPicker', container, {
            value: this.theme['--dark-color-c'],
            tooltip: 'Cor C Escura'
        });
        this.pickers.darkCColorPicker.config({ dataset: { name: '--dark-color-c' } });

        this.pickers.mainCColorPicker = new ColorPicker('mainCColorPicker', container, {
            value: this.theme['--color-c'],
            tooltip: 'Cor C Padrão'
        });
        this.pickers.mainCColorPicker.config({ dataset: { name: '--color-c' } });

        this.pickers.lightCColorPicker = new ColorPicker('lightCColorPicker', container, {
            value: this.theme['--light-color-c'],
            tooltip: 'Cor C Clara'
        });
        this.pickers.lightCColorPicker.config({ dataset: { name: '--light-color-c' } });

        container = this.querySelector('.theme-dialog .data-complex.color-d');

        this.pickers.darkDColorPicker = new ColorPicker('darkDColorPicker', container, {
            value: this.theme['--dark-color-d'],
            tooltip: 'Cor D Escura'
        });
        this.pickers.darkDColorPicker.config({ dataset: { name: '--dark-color-d' } });

        this.pickers.mainDColorPicker = new ColorPicker('mainDColorPicker', container, {
            value: this.theme['--color-d'],
            tooltip: 'Cor D Padrão'
        });
        this.pickers.mainDColorPicker.config({ dataset: { name: '--color-d' } });

        this.pickers.lightDColorPicker = new ColorPicker('lightDColorPicker', container, {
            value: this.theme['--light-color-d'],
            tooltip: 'Cor D Clara'
        });
        this.pickers.lightDColorPicker.config({ dataset: { name: '--light-color-d' } });

        container = this.querySelector('.theme-dialog .data-complex.color-special');

        this.pickers.specialColorPicker = new ColorPicker('specialColorPicker', container, {
            value: this.theme['--special-color'],
            tooltip: 'Cor Especial'
        });
        this.pickers.specialColorPicker.config({ dataset: { name: '--special-color' } });

        container = this.querySelector('.theme-dialog .data-complex.color-highlight');

        this.pickers.darkHighlightColorPicker = new ColorPicker('darkHighlightColorPicker', container, {
            value: this.theme['--dark-highlight-color'],
            tooltip: 'Cor de Destaque Escura'
        });
        this.pickers.darkHighlightColorPicker.config({ dataset: { name: '--dark-highlight-color' } });
        this.pickers.highlightColorPicker = new ColorPicker('highlightColorPicker', container, {
            value: this.theme['--highlight-color'],
            tooltip: 'Cor de Destaque'
        });
        this.pickers.highlightColorPicker.config({ dataset: { name: '--highlight-color' } });

        container = this.querySelector('.theme-dialog .data-complex.color-background');

        this.pickers.darkBackgroundColorPicker = new ColorPicker('darkBackgroundColorPicker', container, {
            value: this.theme['--dark-background-color'],
            tooltip: 'Cor de Fundo Escura'
        });
        this.pickers.darkBackgroundColorPicker.config({ dataset: { name: '--dark-background-color' } });
        this.pickers.mainBackgroundColorPicker = new ColorPicker('mainBackgroundColorPicker', container, {
            value: this.theme['--background-color'],
            tooltip: 'Cor de Fundo Padrão'
        });
        this.pickers.mainBackgroundColorPicker.config({ dataset: { name: '--background-color' } });
        this.pickers.lightBackgroundColorPicker = new ColorPicker('lightBackgroundColorPicker', container, {
            value: this.theme['--light-background-color'],
            tooltip: 'Cor de Fundo Clara'
        });
        this.pickers.lightBackgroundColorPicker.config({ dataset: { name: '--light-background-color' } });

        container = this.querySelector('.theme-dialog .data-complex.color-quote');

        this.pickers.quoteBackgroundColorPicker = new ColorPicker('quoteBackgroundColorPicker', container, {
            value: this.theme['--blockquote-background'],
            tooltip: 'Cor Citações'
        });
        this.pickers.quoteBackgroundColorPicker.config({ dataset: { name: '--blockquote-background' } });
    }

    configureCombos() {
        const fontSelect = this.querySelector('#fontSelect');
        fontSelect.setAttribute('data-name', '--default-font');

        const mainTextColor = this.querySelector('#mainTextColor');
        mainTextColor.setAttribute('data-name', '--text-color');
        mainTextColor.setAttribute('data-preview', 'previewMainText');

        const lightTextColor = this.querySelector('#lightTextColor');
        lightTextColor.setAttribute('data-name', '--light-text-color');
        lightTextColor.setAttribute('data-preview', 'previewLightText');

        const darkTextColor = this.querySelector('#darkTextColor');
        darkTextColor.setAttribute('data-name', '--dark-text-color');
        darkTextColor.setAttribute('data-preview', 'previewDarkText');

        const disabledTextColor = this.querySelector('#disabledTextColor');
        disabledTextColor.setAttribute('data-name', '--disabled-text-color');
        disabledTextColor.setAttribute('data-preview', 'previewDisabledText');

        if (this.isEdit) {
            fontSelect.value = this.theme['--default-font'].split(',')[0].replaceAll('\"', '');
            mainTextColor.value = this.theme['--text-color'].replaceAll('var(--', '').replaceAll(')', '');
            lightTextColor.value = this.theme['--light-text-color'].replaceAll('var(--', '').replaceAll(')', '');
            darkTextColor.value = this.theme['--dark-text-color'].replaceAll('var(--', '').replaceAll(')', '');
            disabledTextColor.value = this.theme['--disabled-text-color'].replaceAll('var(--', '').replaceAll(')', '');
        }
    }

    /* ---------------------------------------------------------------------------------------------------------------- */
    // LISTENERS

    /**
    * Configura ouvintes de eventos para o formulário.
    * @inheritdoc
    */
    activateListeners() {
        // Ativa os Listeners dos Inputs do formulário.
        this.activateInputsListeners();

        // Ativa os Listeners dos Color Picker do formulário.
        this.activatePickerListeners();

        // Ativa os Listeners dos Combos do formulário.
        this.activateComboListeners();
    }

    activateInputsListeners() {
        const button = this.querySelector("#generate.dialog-button");

        const inputs = this.querySelectorAll('input[type="text"].data[data-name]');
        inputs.forEach(input => {
            input.addEventListener('input', (event) => {
                const input = event.target;

                this.theme[input.dataset.name] = input.value;
                button.setAttribute('data-json', JSON.stringify(this.theme));
            });
        });
    }

    activatePickerListeners() {
        const button = this.querySelector("#generate.dialog-button");

        Object.values(this.pickers).forEach(picker => {
            picker.addEventListener('change', (event) => {
                const name = event.target.dataset.name;
                const color = event.detail.value;

                this.theme[name] = color;
                button.setAttribute('data-json', JSON.stringify(this.theme));
            });
        });
    }

    activateComboListeners() {
        const button = this.querySelector("#generate.dialog-button");

        const fontSelect = this.querySelector('#fontSelect');
        fontSelect.addEventListener('change', (event) => {
            const combo = event.target;
            const cssRule = uniforge.constants.fonts.toCSS(combo.value === '§' ? '' : combo.value);
            this.theme['--default-font'] = cssRule;

            button.setAttribute('data-json', JSON.stringify(this.theme));
        });

        const combos = this.querySelectorAll('select.data[data-name]:not(#fontSelect)');
        combos.forEach(combo => {
            combo.addEventListener('change', (event) => {
                const combo = event.target;
                const preview = this.querySelector(`#${combo.dataset.preview}`);

                const rule = `var(--${combo.value})`;

                preview.style.backgroundColor = rule;
                this.theme[combo.dataset.name] = rule;

                button.setAttribute('data-json', JSON.stringify(this.theme));
            });

            combo.dispatchEvent(new Event('change'));
        });   
    }

    static async configDialog(css = null, options = {}) {
        function verifyThemeData(theme) {
            const styles = getComputedStyle(document.documentElement);
            let message = '';

            if ([' ', ':', '@', '$', '&'].includes(theme['name'])) message = 'O nome do tema é inválido.';
            else if (['theme', 'theme-'].includes(theme['name'])) message = 'O nome do tema não pode conter o trecho\'theme\'.';
            else if (theme['--name'].isEmpty()) message = 'É necessário informar um nome para o tema.';

            else if (theme['--default-font'].isEmpty()) message = 'É necessário informar uma fonte padrão para o tema.';
            else if (theme['--text-color'].isEmpty()) message = 'É necessário informar uma cor para o texto do tema.';

            else if (theme['--light-text-color'].isEmpty()) message = 'É necessário informar uma cor clara para o texto do tema.';
            else if (theme['--dark-text-color'].isEmpty()) message = 'É necessário informar uma cor escura para o texto do tema.';
            else if (theme['--disabled-text-color'].isEmpty()) message = 'É necessário informar uma cor para o texto desabilitado do tema.';

            if (theme['--tiny-border-radius'].isEmpty()) theme['--tiny-border-radius'] = styles.getPropertyValue('--tiny-border-radius');
            if (theme['--small-border-radius'].isEmpty()) theme['--small-border-radius'] = styles.getPropertyValue('--small-border-radius');
            if (theme['--default-border-radius'].isEmpty()) theme['--default-border-radius'] = styles.getPropertyValue('--default-border-radius');
            if (theme['--strong-border-radius'].isEmpty()) theme['--strong-border-radius'] = styles.getPropertyValue('--strong-border-radius');
            if (theme['--circular-border-radius'].isEmpty()) theme['--circular-border-radius'] = styles.getPropertyValue('--circular-border-radius');
            if (theme['--scrollbar-border-radius'].isEmpty()) theme['--scrollbar-border-radius'] = styles.getPropertyValue('--scrollbar-border-radius');
            if (theme['--slider-border-radius'].isEmpty()) theme['--slider-border-radius'] = styles.getPropertyValue('--slider-border-radius');
            if (theme['--track-border-radius'].isEmpty()) theme['--track-border-radius'] = styles.getPropertyValue('--track-border-radius');
            if (theme['--small-title-header-radius'].isEmpty()) theme['--small-title-header-radius'] = styles.getPropertyValue('--small-title-header-radius');
            if (theme['--title-header-radius'].isEmpty()) theme['--title-header-radius'] = styles.getPropertyValue('--title-header-radius');
            if (theme['--topbar-border-radius'].isEmpty()) theme['--topbar-border-radius'] = styles.getPropertyValue('--topbar-border-radius');
            if (theme['--toggle-tab-border-radius'].isEmpty()) theme['--toggle-tab-border-radius'] = styles.getPropertyValue('--toggle-tab-border-radius');

            return { message, theme };
        }

        function calculateTransparency(theme) {
            theme['--dark-color-a-T50'] = `${theme['--dark-color-a'].slice(0, 7)}80`;
            theme['--dark-color-a-T85'] = `${theme['--dark-color-a'].slice(0, 7)}D9`;
            theme['--color-b-T50'] = `${theme['--color-b'].slice(0, 7)}80`;
            theme['--color-b-T85'] = `${theme['--color-b'].slice(0, 7)}D9`;
            theme['--dark-color-b-T50'] = `${theme['--dark-color-b'].slice(0, 7)}80`;
            theme['--dark-color-b-T85'] = `${theme['--dark-color-b'].slice(0, 7)}D9`;
            theme['--color-c-T85'] = `${theme['--color-c'].slice(0, 7)}D9;`;
        }

        options = uniforge.utils.mergeObjects(options, { alwaysClose: false });
        return new Promise((resolve, reject) => {
            const dialog = new this({
                title: 'Gerenciar Temas',
                css: css,
                buttons: {
                    cancel: {
                        label: "Cancelar",
                        icon: "fas fa-xmark",
                        callback: () => {
                            resolve(null);
                            return true;
                        }
                    },
                    generate: {
                        label: (options.isClone || !options.isEdit) ? "Gerar CSS" : "Editar CSS",
                        icon:  (options.isClone || !options.isEdit) ? "fas fa-pen-to-square" :"fas fa-file-half-dashed",
                        callback: () => {
                            const button = event.target;
                            let theme = JSON.parse(button.dataset.json);

                            if (theme) {
                                const result = verifyThemeData(theme);

                                if (result.message.isEmpty()) {
                                    theme = result.theme;

                                    calculateTransparency(theme);

                                    resolve(theme);
                                    return true;
                                } else {
                                    uniforge.msgBox.showWarning(result.message);

                                    resolve(null);
                                    return false;
                                }
                            }

                            resolve(null);
                            return false;
                        }
                    }
                },
                abort: () => resolve(null)
            }, options);
            dialog.show(true);
        });
    }
}