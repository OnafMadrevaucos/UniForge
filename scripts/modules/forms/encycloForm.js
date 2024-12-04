import { EntryForm } from "./entryForm.js";
import { Dialog } from "../dialogs/dialog.js";
import { Database } from "../tempDB.js";

/**
 * Classe EncycloForm que estende a classe EntryForm.
 * Representa um formulário especializado para entradas enciclopédicas.
 * 
 * @extends EntryForm
 */
export class EncycloForm extends EntryForm {
    /**
     * Construtor da classe EncycloForm.
     * 
     * @param {Object} overlay - Objeto de sobreposição usado para interagir com o formulário.
     */
    constructor(overlay) {
        super(overlay);

        /**
        * O formulário é o de Enciclopédia
        * @type {boolean}
        */
        this.isEncyclopedia = true;

        /**
         * Configura o conteúdo do formulário.
         * @type {HTMLElement} form - Elemento HTML do formulário.
         */
        this.configureContent(this.form);
    }

    /**
   * Obtém as folders disponíveis para o formulário enciclopédico.
   * @returns {Object} - Assunto.
   */
    getFolders() {
        const subjectObj = Object.entries(Database.subjectTypes);
        return Object.fromEntries(subjectObj.filter(([key, value]) => !value.deleted).sort());
    }

    /**
     * Configura o conteúdo do formulário.
     * Inclui configurações específicas, como a seleção do tipo de entrada e o editor TinyMCE.
     * 
     * @param {HTMLElement} form - Elemento HTML do formulário a ser configurado.
     */
    configureContent(form) {
        super.configureContent(form);

        // Configurações do formulário.
        super.configureEntryTypeSelect(form);
        super._configureTinyMCE();
        
    }

    /**
   * Configura o combo de Tipos de Entrada.
   * @param {HTMLElement} form - O formulário HTML principal.
   */
    configureSubjectTypeSelect(form) {
        // Carrega as opções de Tipos de Entradas registrados
        const subjectType = form.querySelector('#subjectType');
        for (const id of Object.keys(this.data)) {
            subjectType.appendChild(this._newSubjectTypeOption(id));
        }
    }

    /**
   * Carrega a lista de entradas da barra lateral.
   * @param {HTMLElement} form - O formulário principal.
   */
    loadSidebarList(form) {
        const folderList = form.querySelector('#folderList');
        folderList.innerHTML = '';

        for (const [key, value] of Object.entries(this.data)) {
            const folder = this.createFolderItem(value);
            folderList.appendChild(folder);
        }

        const folders = folderList.querySelectorAll('.folder');
        const items = form.querySelectorAll('.entry-item');

        folders.forEach(item => {
            const folderHeader = item.querySelector('.folder-header');
            folderHeader.addEventListener('click', (event) => {
                this._onFolderClick(event);
            });
        });

        items.forEach(item => {
            item.addEventListener('click', (event) => {
                this.onEntryItemClick(event);
            });
            item.addEventListener('dblclick', (event) => {
                this.onEntryItemDoubleClick(event);
            });
        });
    }
}
