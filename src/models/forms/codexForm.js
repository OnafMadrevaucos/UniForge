import { CodexManager } from "../../scripts/managers/codexManager.js";
import SidebarForm from "./sidebarForm.js";

export default class CodexForm extends SidebarForm {
    constructor() {
        super('Códex');

        /**
        * @type {string} - Define o tipo do formulário.
        */
        this.type = 'codex';

        /**
        * @type {string} - O modelo HTML utilizado pelo formulário.
        */
        this.template = 'codexForm'; // Define o template do formulário. 

        /**
         * @type {CodexManager} - O gerenciador de exibição do Codex.
         */
        this.manager = new CodexManager(this);
    }

    /**
     * @overload
     * @inheritdoc
    */
    get defaultOptions() {
        const config = super.defaultOptions;
        return uniforge.utils.mergeObjects(config, {
            classes: [...config.classes, 'fullscreen']
        });
    }

    /**@inheritdoc */
    prepareFolders(data) {
        const folders = uniforge.doc.sections.toObject();
        data.folders = folders.sort();
    }

    /* ---------------------------------------------------------------------------------------------------------------- */
    // LISTENERS
    /**
     * Gerencia cliques duplos em itens de entrada.
     * @protected
     * @param {MouseEvent} event - O evento de clique duplo.
    */
    async onEntryItemDoubleClick(event, options = {}) {
        await super.onEntryItemDoubleClick(event);

        const item = event.target.closest('.entry-item');
        const itemId = item.dataset.id;
        const entry = uniforge.doc.entries.get(itemId);

        if (entry) {
            this.manager.loadEntry(entry);
        } else {
            this.msgBox.showWarning('Erro ao carregar a entrada.');
        }
    }
}