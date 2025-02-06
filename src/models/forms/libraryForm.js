import { LibraryManager } from "../../scripts/managers/libraryManager.js";
import SidebarForm from "./sidebarForm.js";

export default class LibraryForm extends SidebarForm {
    constructor(title) {
        const form = super(title);
        this.form = form;

        this.template = 'libraryForm'; // Define o template do formulário. 

        this.manager = new LibraryManager(form);
    }

    /**
    * Obtém os assuntos de uma dada origem disponíveis no banco de dados.
    * @async
    * @returns {Object} - Assuntos e suas categorias.
    */
    async getCategories() {
        const data = await this.db.getAllCategory();

        if (data) {
            for (let category of Object.values(data)) {
                category.entries = Object.values(await this.db.getEntriesFromCategory(category.cid));
            }
        }
        return data;
    }

    /**
   * Obtém as categorias disponíveis para o formulário no banco de dados.
   * @returns {Object} - Categorias.
   */
    async getData() {
        const data = await super.getData();

        data.categories = await this.getCategories();

        return data;
    }

    async configureContent(form) {
        this.data = await this.getData();

        this.loadSidebarData(form);

        this.activateListeners(form);
    }

    /**
    * Carrega a lista de entradas da barra lateral.
    * @param {HTMLElement} form - O formulário principal.
    */
    loadSidebarData(form) {
        const data = this.data.categories;
        if(data) this.createFolderList(data);
    }

    /* ---------------------------------------------------------------------------------------------------------------- */
    // LISTENERS
    /**
     * Configura ouvintes de eventos básicos para o formulário.
     * @param {HTMLElement} form - O formulário principal.
     * @private
     */
    activateListeners(form) {
        super.activateListeners(form);
    }
    /**
   * Gerencia cliques duplos em itens de entrada.
   * @param {MouseEvent} event - O evento de clique duplo.
   * @private
   */
    async onEntryItemDoubleClick(event) {
        super.onEntryItemDoubleClick(event);
        // Obter a entrada clicada.
        const entry = event.target.closest('.entry-item');
        const entryId = entry.dataset.id;
        const data = await uniforge.db.getEntryWithIcon(entryId);

        this.manager.getEntry(data).addTo('entryContainer', false);
    }

    onSearchButtonClick(event) {
        // Impedir que o clique no item desencadeie o clique fora do sidebar
        event.stopPropagation();

        console.log('*CLICK*')
    }
}