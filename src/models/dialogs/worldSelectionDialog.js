import { options } from "../../common/utils/tinymce.mjs";
import BaseDialog from "./baseDialog.js";
import Dialogs from "./dialog.js";

export default class WorldSelecionDialog extends BaseDialog {
    constructor(dialogData = {}, options = {}) {
        super(dialogData, uniforge.utils.mergeObjects(options, {
            height: '500px',
            width: '800px'
        }));

        this.sourceId = options?.id ?? null;

        this.sourceType = options?.type ?? null;

        this.template = 'worldSelectionDialog'; // Define o template do diálog.
    }

    /**
     * @inheritdoc
     * @async
     */
    async close() {
        const canClose = await Dialogs.confirm('Sem Mundo Selecionado',
            'O UniForge será encerrado caso não haja nenhum Mundo selecionado. Deseja continuar?',
            { abortValue: true }
        );

        if (canClose) {
            // Execute a rotina de fechamento padrão.
            super.close();
            // A aplicação precisa ser encerrada por completo.
            uniforge.app.quit();
        }
    }

    /**
     * Prepara os dados do diálogo e configura o diálogo com os dados preparados.
     * @inheritdoc
    */
    prepareData() { 
        this.data.worlds = uniforge.doc.worlds.toArray();
    }

    /**
    * Configura ouvintes de eventos básicos para o dialog.
    * @protected
    */
    activateListeners() {
        const newWorldButton = this.querySelector('#newWorldButton');
        newWorldButton.addEventListener('click', (event) => { this.onNewWorldClick(event); });
    }

    onNewWorldClick(event) {
        event.stopPropagation();
    }

    static async configDialog(options = {}) {
        return new Promise((resolve, reject) => {
            options = uniforge.utils.mergeObjects(options, { draggable: false, lockScreen: true });
            const dialogData = {
                title: 'Bem Vindo!',
                buttons: {
                    select: {
                        label: "Selecionar",
                        icon: "fas fa-check",
                        callback: (event) => {
                            resolve('Mundo');
                            return true;
                        }
                    }
                },
                abort: () => resolve(null)
            };

            const dialog = new this(dialogData, options);
            dialog.show(true);
        });
    }
}