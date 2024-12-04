import { Database } from "../tempDB.js";
import { BaseForm } from "./baseForm.js";
import { LibraryManager } from "../managers/libraryManager.js";

export class LibraryForm extends BaseForm {
    constructor(overlay) {
        const form = super(overlay);
        this.form = form;

        this.manager = new LibraryManager(form);

        this.configureContent(form);
    }

    /**
   * Obtém as categorias disponíveis para o formulário no banco de dados.
   * @returns {Object} - Categorias.
   */
    getCategory() {
        const categoriesObj = Object.entries(Database.categories);
        return Object.fromEntries(categoriesObj.filter(([key, value]) => !value.deleted));
    }

    configureContent(form) {
        super.configureContent(form);

        this.manager.getEntry('PL003').addTo('entryContainer', false);
    }

    onSearchButtonClick(event) {
        // Impedir que o clique no item desencadeie o clique fora do sidebar
        event.stopPropagation();

        console.log('*CLICK*')
    }
}