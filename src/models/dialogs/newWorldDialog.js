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
            defaultWorld: false
        };

        this.sourceId = options?.id ?? null;

        this.sourceType = options?.type ?? null;

        this.template = 'newWorldDialog'; // Define o template do diálog.
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

        worldTitleInput.addEventListener('input', this.worldTitleChange.bind(this));
        worldDescriptionTextarea.addEventListener('input', this.worldDescriptionChange.bind(this));
        hasMapSwitch.addEventListener('change', this.onHasMapSwitchChange.bind(this));
        defaultWorldSwitch.addEventListener('change', this.onDefaultWorldChange.bind(this));
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
                        return true;
                    }
                },
                save: {
                    label: "Salvar",
                    icon: "fas fa-save",
                    callback: (event) => {
                        const world = dialog.result;

                        if(world.title?.isEmpty()) {
                            uniforge.msgBox.showWarning('É necessário informar um título para o Mundo.');
                            resolveDialog(null);
                            return false;
                        }
                        if(world.description?.isEmpty()) {
                            uniforge.msgBox.showWarning('É necessário informar uma descrição sobre o Mundo.');
                            resolveDialog(null);
                            return false;
                        }

                        resolveDialog(world);
                        return true;
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