import EntryForm from "./entryForm.js";
import { Database } from "../../scripts/tempDB.js";
import Dialog from "../dialogs/dialog.js";

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
   * Obtém os assuntos (e suas categorias) disponíveis do banco de dados.
   * @returns {Object} - Assuntos e suas categorias.
   * @async
   */
    async getSubjects() {
        const data = await this.db.getSubjects();

        for (let entry of Object.values(data)) {
            entry.entries = Object.values(await this.db.getCategoriesFromSubject(entry.sid));
        }
        return data;
    }

    /**
     * Configura o conteúdo do formulário.
     * Inclui configurações específicas, como a seleção do tipo de entrada e o editor TinyMCE.
     * 
     * @param {HTMLElement} form - Elemento HTML do formulário a ser configurado.
     */
    async configureContent(form) {
        await super.configureContent(form);

        // Configurações do formulário.
        super._configureTinyMCE();

        const cancelButton = this.form.querySelector('#cancelButton');
        cancelButton.addEventListener('click', (event) => { this.onCancelClick(event); });

        // Configura o evento de criação de novas entradas
        const newEntryButton = document.getElementById('newEntryButton');
        newEntryButton.addEventListener('click', (event) => { this.onNewClick(event); });

        const saveButton = this.form.querySelector('#saveButton');
        saveButton.addEventListener('click', (event) => { this.onSaveCategoryClick(event); });
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
    * Registra uma nova entrada no banco de dados.
    * @param {Event} event - Evento de clique no botão de Salvar do Dialog.
    */
    async onSaveCategory(event) {
        event.stopPropagation();
        const folder = this.form.querySelector('.folder.selected');
        if (!folder) {
            this.msgBox.showWarning('Nenhum assunto foi selecionado.');
            return;
        }

        const imgInput = this.form.querySelector('#hiddenFileInput');
        const titleInput = this.form.querySelector('#titleInput');
        const draftSwitch = this.form.querySelector('#checkbox');

        const data = {
            sid: folder.dataset.sid,
            title: titleInput.value,
            img: imgInput.value,
            htmlString: tinymce.activeEditor?.getContent() ?? '',
            isDraft: draftSwitch.checked
        }

        const validate = CONFIG.db.validateCategory(data);
        if (validate !== '') {
            this.msgBox.showWarning(validate);
            return;
        }

        await CONFIG.db.addCategory(data);
        this.msgBox.showInfo('Categoria criada com sucesso.');
        this.closeDialog();
        this.clearContent(this.form);

        const cancelButton = this.form.querySelector('#cancelButton');
        cancelButton.click();

        await this.updateContent();
    }

    /**
    * Trata o evento de registro de uma nova categoria.
    * @param {Event} event - Evento de clique no botão de Salvar.
    */
    async onSaveCategoryClick(event) {
        event.stopPropagation();

        if (!super.onSaveClick(event)) return;

        const body = 'Deseja salvar a categoria?';
        // Configuração de botões
        const buttons = [
            {
                label: "Não",
                icon: "fas fa-xmark",
                onClick: () => { this.closeDialog(); },
            },
            {
                label: "Sim",
                icon: "fas fa-check",
                onClick: (event) => { this.onSaveCategory(event); },
            }
        ];

        this.dialog = new Dialog('Salvar', body, buttons);
        this.dialog.createDialog();
    }

    /**
    * Trata o evento de criação de uma nova entrada.
    * @param {Event} event - Evento de clique no botão de Nova Categoria.
    */
    async onNewCategoryClick(event) {
        if (super.onNewClick(event)) {
            this.clearContent(this.form, false);
        }
    }

    /**
   * Remove uma entrada de uma categoria da lista.
   * @param {Event} event - Evento de clique no botão para excluir a entrada.
   */
    async onDeleteEntryAction(event) {
        super.onDeleteEntryAction(event);

        const cancelButton = this.form.querySelector('#cancelButton');
        cancelButton.click();

        this.msgBox.showInfo('Categoria removida com sucesso.');
    }

    /**
    * Trata o evento de cancelamento de uma nova categoria.
    * @param {Event} event - Evento de clique no botão de Cancelar.
    */
    async onCancelClick(event) {
        event.stopPropagation();

        super.onCancelClick(event);
        this.clearContent(this.form);
    }

    /**
   * Gerencia cliques duplos em itens de entrada.
   * @param {MouseEvent} event - O evento de clique duplo.
   * @private
   */
    async onEntryItemDoubleClick(event) {
        super.onEntryItemDoubleClick(event);
        const item = event.target.closest('.entry-item');
        const itemId = Number(item.dataset.id);
        let category = Object.values(await CONFIG.db.getCategory(itemId));

        if (category.length != 1) {
            this.msgBox.showError('Categoria está duplicada.');
            return;
        }

        category = category[0];

        const imgInput = this.form.querySelector('#hiddenFileInput');
        const titleInput = this.form.querySelector('#titleInput');
        const draftSwitch = this.form.querySelector('#checkbox');

        titleInput.value = category.title;
        tinymce.activeEditor.setContent(category.htmlString);
        draftSwitch.checked = category.isDraft;

        if (category.img) imgInput.src = category.img;

        const cancelButton = this.form.querySelector('#cancelButton');
        cancelButton.classList.remove('hidden');

        const saveButton = this.form.querySelector('#saveButton');
        saveButton.classList.remove('disabled');
    }
}
