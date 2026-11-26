import BaseDialog from "./baseDialog.js";

export default class NewWorldDialog extends BaseDialog {
    constructor(dialogData = {}, options = {}) {
        super(dialogData, uniforge.utils.mergeObjects(options, {
            height: '650px',
            width: '400px'
        }));

        this.result = {
            title: 'Novo Mundo',
            description: '',
            hasMap: false,
            defaultWorld: false,
            theme: 'theme-neutral'
        };

        this.sourceId = options?.id ?? null;

        this.sourceType = options?.type ?? null;

        this.template = 'newWorldDialog'; // Define o template do diálog.
    }

    /* ---------------------------------------------------------------------------------------------------------------- */
    // PREPARAÇÃO DE DADOS

    /**
     * Prepara os dados do diálogo e configura o diálogo com os dados preparados.
     * 
     * @async
     * @inheritdoc
    */
    async prepareData() {   
        this.prepareThemes();
    }

    /**
     * Prepara uma lista com cada um dos Temas cadastrados no sistema, semparando-os entre Temas nativos e os customizados.
     * 
     * @async
     */
    async prepareThemes() {
        const extraThemesFiles = await uniforge.fs.readDir(uniforge.urls.relativePath.customCSS);

        const extraThemes = [];

        extraThemesFiles.files.forEach(theme => {
            const themeName = theme.name;
            extraThemes.push({
                _id: `custom/theme-${themeName}`,
                _label: themeName.capitalize().replaceAll('.css', '')
            });
        });

        this.data.themes = {
            nativos: [
                { _id: 'theme-medieval', _label: 'Medieval' },
                { _id: 'theme-scifi', _label: 'Sci-fi' },
                { _id: 'theme-neutral', _label: 'Neutro' },
            ],
            extras: extraThemes
        };
    }

    /* ---------------------------------------------------------------------------------------------------------------- */
    // CONFIGURAÇÃO DE CORPO DO DIALOG

    /**
     * Prepara o corpo do Dialog de acordo com os dados e estado atual do sistema.
     * @inheritdoc
     */
    configureContent() {
        const worldThemeSelect = this.querySelector('#worldTheme');  
        worldThemeSelect.value = 'theme-neutral';        
    }

    /* ---------------------------------------------------------------------------------------------------------------- */
    // CONTROLE DE EVENTOS

    /**
    * Configura ouvintes de eventos básicos para o dialog.
    * @protected
    */
    activateListeners() {
        const worldTitleInput = this.querySelector('#worldTitle');
        const worldDescriptionTextarea = this.querySelector('#worldDescription');
        const hasMapSwitch = this.querySelector('#hasMapSwitch');
        const defaultWorldSwitch = this.querySelector('#defaultWorldSwitch')
        const worldThemeSelect = this.querySelector('#worldTheme');        

        worldTitleInput.addEventListener('input', this.worldTitleChange.bind(this));
        worldDescriptionTextarea.addEventListener('input', this.worldDescriptionChange.bind(this));
        hasMapSwitch.addEventListener('change', this.onHasMapSwitchChange.bind(this));
        defaultWorldSwitch.addEventListener('change', this.onDefaultWorldChange.bind(this));
        worldThemeSelect.addEventListener('change', this.onWorldThemeChange.bind(this));

        // Garante que o tema exibido seja o que está selecionado pelo Combo.
        worldThemeSelect.dispatchEvent(new Event('change'));
    }

    worldTitleChange(event) {
        const input = event.target;

        this.result.title = input.value;
    }

    worldDescriptionChange(event) {
        const textarea = event.target;

        this.result.description = textarea.value;
    }

    onHasMapSwitchChange(event) {
        const checkbox = event.target;

        this.result.hasMap = checkbox.checked;
    }

    onDefaultWorldChange(event) {
        const checkbox = event.target;

        this.result.defaultWorld = checkbox.checked;
    }

    onWorldThemeChange(event) {
        const select = event.target;
        const theme = select.value;

        document.documentElement.setAttribute('data-theme', theme);
        this.result.theme = theme;
    }

    /* ---------------------------------------------------------------------------------------------------------------- */
    // CONFIGURAÇÃO EXTERNA DA CAIXA DE DIÁLOGO

    static async configDialog(options = { isEdit: false }) {
        options = uniforge.utils.mergeObjects(options, { alwaysClose: false });

        // Cria uma referência para a resolução da Promise.
        let resolveDialog;

        const resultPromise = new Promise((resolve) => {
            resolveDialog = resolve;
        });

        const dialogData = {
            title: options.isEdit ? 'Gerenciador de Mundo' : 'Novo Mundo',
            buttons: {
                cancel: {
                    label: "Cancelar",
                    icon: "fas fa-xmark",
                    callback: () => {
                        resolveDialog(null);
                    }
                },
                save: {
                    label: "Salvar",
                    icon: "fas fa-save",
                    callback: (event) => {
                        const world = dialog.result;

                        if (world.title?.isEmpty()) {
                            uniforge.msgBox.showWarning('É necessário informar um título para o Mundo.');
                            return;
                        }
                        if (world.description?.isEmpty()) {
                            uniforge.msgBox.showWarning('É necessário informar uma descrição sobre o Mundo.');
                            return;
                        }

                        resolveDialog(world);
                    }
                }
            },
            abort: () => resolveDialog(null)
        };

        const dialog = new this(dialogData, options);
        await dialog.show(true);

        // Aguarda a resolução após uma interação com o diálogo.
        return resultPromise;
    }
}