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

        // Verifica se se trata de uma edição de Tema.
        this.isEdit = options.isEdit ?? false; 

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
            'name': 'Novo Tema',

            '--default-font': "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;",

            '--dark-color-a': '#1e140feb',
            '--color-a': '#231b14',
            '--light-color-a': '#36281e',
            '--dark-color-a-T85': '#1e140fd9',
            '--dark-color-a-T50': '#1e140f80',

            '--dark-color-b': '#7f1d1d',
            '--dark-color-b-T50': '#7f1d1d80',
            '--dark-color-b-T85': '#7f1d1dd9',
            '--color-b': '#b82525',
            '--color-b-T50': '#b8252580',
            '--color-b-T85': '#b82525d9',
            '--light-color-b': '#d17272',

            '--dark-color-c': '#975508',
            '--color-c': '#d97706',
            '--color-c-T85': '#d97706d9',
            '--light-color-c': '#fbbf24',

            '--dark-color-d': '#0a0a0f',
            '--color-d': '#a0aec0',
            '--light-color-d': '#f7fafc',

            '--special-color': '#ffffff1a',

            '--dark-highlight-color': '#14532d',
            '--highlight-color': '#16a34a',

            '--dark-background-color': '#18120d',
            '--background-color': '#140f0ae6',
            '--light-background-color': '#362c21e6',
            '--blockquote-background': '#3b3a30',

            '--text-color': 'var(--light-color-c)',
            '--light-text-color': 'var(--light-color-d)',
            '--dark-text-color': 'var(--dark-color-d)',
            '--disabled-text-color': 'var(--color-d)',

            '--shadow-color': '#00000080',

            /* Borders Radius */
            '--tiny-border-radius': '1px',
            '--small-border-radius': '5px',
            '--default-border-radius': '8px',
            '--strong-border-radius': '12px',
            '--circular-border-radius': '50%',
            '--scrollbar-border-radius': '4px',
            '--slider-border-radius': '50%',
            '--track-border-radius': '10px',
            '--small-title-header-radius': '0 4px 4px 0',
            '--title-header-radius': '0 8px 8px 0',
            '--topbar-border-radius': '0 0 8px 8px',
            '--toggle-tab-border-radius': '4px 0 0 4px',

            /* Tooltip */
            '--tooltip-background': '#231b14fa',
            '--tooltip-text': '#e2e8f0',
            '--tooltip-muted': '#9b8a78',
            '--tooltip-border': '#b87a2566',
            '--tooltip-divider': '#b87a2533',
            '--tooltip-title': '#e5a440'
        }
    }

    /**
   * Prepara os dados do diálogo e configura o diálogo com os dados preparados.
   * @inheritdoc
   * @async
   */
    async prepareData() {
        const fonts = uniforge.constants.fonts;
        this.data.fonts = Object.entries(fonts).map(([key, value]) => ({ _id: key.replaceAll("\"", ""), _label: key.replaceAll("\"", "") }));

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

        this.configureColorPickers();

        const generateButton = this.querySelector("#generate.dialog-button");
        generateButton.setAttribute('data-json', JSON.stringify(this.theme));
    }

    configureColorPickers() {
        var container = this.querySelector('.theme-dialog .data-complex.color-a');

        this.pickers.darkAColorPicker = new ColorPicker('darkAColorPicker', container, {
            value: 'var(--dark-color-a)',
            tooltip: 'Cor A Escura'
        });
        this.pickers.darkAColorPicker.config({ dataset: { name: '--dark-color-a' } });

        this.pickers.mainAColorPicker = new ColorPicker('mainAColorPicker', container, {
            value: 'var(--color-a)',
            tooltip: 'Cor A Padrão'
        });
        this.pickers.mainAColorPicker.config({ dataset: { name: '--color-a' } });

        this.pickers.lightAColorPicker = new ColorPicker('lightAColorPicker', container, {
            value: 'var(--light-color-a)',
            tooltip: 'Cor A Clara'
        });
        this.pickers.lightAColorPicker.config({ dataset: { name: '--light-color-a' } });

        container = this.querySelector('.theme-dialog .data-complex.color-b');

        this.pickers.darkBColorPicker = new ColorPicker('darkBColorPicker', container, {
            value: 'var(--dark-color-b)',
            tooltip: 'Cor B Escura'
        });
        this.pickers.darkBColorPicker.config({ dataset: { name: '--dark-color-b' } });

        this.pickers.mainBColorPicker = new ColorPicker('mainBColorPicker', container, {
            value: 'var(--color-b)',
            tooltip: 'Cor B Padrão'
        });
        this.pickers.mainBColorPicker.config({ dataset: { name: '--color-b' } });

        this.pickers.lightBColorPicker = new ColorPicker('lightBColorPicker', container, {
            value: 'var(--light-color-b)',
            tooltip: 'Cor B Clara'
        });
        this.pickers.lightBColorPicker.config({ dataset: { name: '--light-color-b' } });

        container = this.querySelector('.theme-dialog .data-complex.color-c');

        this.pickers.darkCColorPicker = new ColorPicker('darkCColorPicker', container, {
            value: 'var(--dark-color-c)',
            tooltip: 'Cor C Escura'
        });
        this.pickers.darkCColorPicker.config({ dataset: { name: '--dark-color-c' } });

        this.pickers.mainCColorPicker = new ColorPicker('mainCColorPicker', container, {
            value: 'var(--color-c)',
            tooltip: 'Cor C Padrão'
        });
        this.pickers.mainCColorPicker.config({ dataset: { name: '--color-c' } });

        this.pickers.lightCColorPicker = new ColorPicker('lightCColorPicker', container, {
            value: 'var(--light-color-c)',
            tooltip: 'Cor C Clara'
        });
        this.pickers.lightCColorPicker.config({ dataset: { name: '--light-color-c' } });

        container = this.querySelector('.theme-dialog .data-complex.color-d');

        this.pickers.darkDColorPicker = new ColorPicker('darkDColorPicker', container, {
            value: 'var(--dark-color-d)',
            tooltip: 'Cor D Escura'
        });
        this.pickers.darkDColorPicker.config({ dataset: { name: '--dark-color-d' } });

        this.pickers.mainDColorPicker = new ColorPicker('mainDColorPicker', container, {
            value: 'var(--color-d)',
            tooltip: 'Cor D Padrão'
        });
        this.pickers.mainDColorPicker.config({ dataset: { name: '--color-d' } });

        this.pickers.lightDColorPicker = new ColorPicker('lightDColorPicker', container, {
            value: 'var(--light-color-d)',
            tooltip: 'Cor D Clara'
        });
        this.pickers.lightDColorPicker.config({ dataset: { name: '--light-color-d' } });

        container = this.querySelector('.theme-dialog .data-complex.color-special');

        this.pickers.specialColorPicker = new ColorPicker('specialColorPicker', container, {
            value: 'var(--special-color)',
            tooltip: 'Cor Especial'
        });
        this.pickers.specialColorPicker.config({ dataset: { name: '--special-color' } });

        container = this.querySelector('.theme-dialog .data-complex.color-highlight');

        this.pickers.darkHighlightColorPicker = new ColorPicker('darkHighlightColorPicker', container, {
            value: 'var(--dark-highlight-color)',
            tooltip: 'Cor de Destaque Escura'
        });
        this.pickers.darkHighlightColorPicker.config({ dataset: { name: '--dark-highlight-color' } });
        this.pickers.highlightColorPicker = new ColorPicker('highlightColorPicker', container, {
            value: 'var(--highlight-color)',
            tooltip: 'Cor de Destaque'
        });
        this.pickers.highlightColorPicker.config({ dataset: { name: '--highlight-color' } });

        container = this.querySelector('.theme-dialog .data-complex.color-background');

        this.pickers.darkBackgroundColorPicker = new ColorPicker('darkBackgroundColorPicker', container, {
            value: 'var(--dark-background-color)',
            tooltip: 'Cor de Fundo Escura'
        });
        this.pickers.darkBackgroundColorPicker.config({ dataset: { name: '--dark-background-color' } });
        this.pickers.mainBackgroundColorPicker = new ColorPicker('mainBackgroundColorPicker', container, {
            value: 'var(--background-color)',
            tooltip: 'Cor de Fundo Padrão'
        });
        this.pickers.mainBackgroundColorPicker.config({ dataset: { name: '--background-color' } });
        this.pickers.lightBackgroundColorPicker = new ColorPicker('lightBackgroundColorPicker', container, {
            value: 'var(--light-background-color)',
            tooltip: 'Cor de Fundo Clara'
        });
        this.pickers.lightBackgroundColorPicker.config({ dataset: { name: '--light-background-color' } });

        container = this.querySelector('.theme-dialog .data-complex.color-quote');

        this.pickers.quoteBackgroundColorPicker = new ColorPicker('quoteBackgroundColorPicker', container, {
            value: 'var(--blockquote-background)',
            tooltip: 'Cor Cirações'
        });
        this.pickers.quoteBackgroundColorPicker.config({ dataset: { name: '--blockquote-background' } });
    }

    /* ---------------------------------------------------------------------------------------------------------------- */
    // LISTENERS

    /**
    * Configura ouvintes de eventos para o formulário.
    * @inheritdoc
    */
    activateListeners() {

        const themeNameInput = this.querySelector("#themeNameInput");
        themeNameInput.addEventListener('input', (event) => {
            const input = event.target;
            const button = this.querySelector("#generate.dialog-button");

            this.theme['name'] = input.value;
            button.setAttribute('data-json', JSON.stringify(this.theme));
        });

        // Ativa os Listeners dos Color Picker do formulário.
        this.activatePickerListeners();

        // Ativa os Listeners dos Combos do formulário.
        this.activateComboListeners();
    }

    activatePickerListeners() {
        Object.values(this.pickers).forEach(picker => {
            picker.addEventListener('change', (event) => {
                const name = event.target.dataset.name;
                const color = event.detail.value;

                const button = this.querySelector("#generate.dialog-button");

                this.theme[name] = color;
                button.setAttribute('data-json', JSON.stringify(this.theme));
            });
        });
    }

    activateComboListeners() {
        const button = this.querySelector("#generate.dialog-button");

        const mainTextColor = this.querySelector('#mainTextColor');
        mainTextColor.addEventListener('change', (event) => {
            const combo = event.target;
            const previewMainText = this.querySelector('#previewMainText');

            previewMainText.style.backgroundColor = `var(--${combo.value})`;
            this.theme['--text-color'] = `var(--${combo.value});`;
            button.setAttribute('data-json', JSON.stringify(this.theme));
        });

        const lightTextColor = this.querySelector('#lightTextColor');
        lightTextColor.addEventListener('change', (event) => {
            const combo = event.target;
            const previewLightText = this.querySelector('#previewLightText');

            previewLightText.style.backgroundColor = `var(--${combo.value})`;
            this.theme['--light-text-color'] = `var(--${combo.value});`;
            button.setAttribute('data-json', JSON.stringify(this.theme));
        });

        const darkTextColor = this.querySelector('#darkTextColor');
        darkTextColor.addEventListener('change', (event) => {
            const combo = event.target;
            const previewDarkText = this.querySelector('#previewDarkText');

            previewDarkText.style.backgroundColor = `var(--${combo.value})`;
            this.theme['--dark-text-color'] = `var(--${combo.value});`;
            button.setAttribute('data-json', JSON.stringify(this.theme));
        });

        const disabledTextColor = this.querySelector('#disabledTextColor');
        disabledTextColor.addEventListener('change', (event) => {
            const combo = event.target;
            const previewDisabledText = this.querySelector('#previewDisabledText');

            previewDisabledText.style.backgroundColor = `var(--${combo.value})`;
            this.theme['--disabled-text-color'] = `var(--${combo.value});`;
            button.setAttribute('data-json', JSON.stringify(this.theme));
        });
    }

    static async configDialog(css = null, options = {}) {
        function verifyTheme(theme) {

            if([' ', ':', '@', '$', '&'].includes(theme['name'])) return 'O nome do tema é inválido.';
            if(['theme', 'theme-'].includes(theme['name'])) return 'O nome do tema não pode conter o trecho\'theme\'.';


            return '';
        }
        options = uniforge.utils.mergeObjects(options, { alwaysClose: true });
        return new Promise((resolve, reject) => {
            const dialog = new this({
                title: 'Gerenciar Temas',
                css: css,
                buttons: {
                    cancel: {
                        label: "Cancelar",
                        icon: "fas fa-xmark",
                        callback: () => resolve(null)
                    },
                    generate: {
                        label: "Gerar",
                        icon: "fas fa-save",
                        callback: () => {
                            const button = event.target;
                            const theme = JSON.parse(button.dataset.json);

                            if (theme) {
                                const result = verifyTheme(theme);

                                if (result.isEmpty()) {
                                    resolve(theme);
                                    return true;
                                } else {
                                    uniforge.msgBox.showWarning(result);

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