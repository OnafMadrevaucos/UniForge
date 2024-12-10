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
            entry.entries = Object.values(await this.db.getSubjectsEntries(entry.sid));
        }
        return data;
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
        super._configureTinyMCE();

        const cancelButton = this.form.querySelector('#cancelButton');
        cancelButton.addEventListener('click', (event) => { this.onCancelClick(event); });

        const saveButton = this.form.querySelector('#saveButton');
        saveButton.addEventListener('click', (event) => { this.onSaveCategoryClick(event); });
    }

    /**
   * Limpa o conteúdo do formulário
   * @param {HTMLElement} form - O elemento que representa o formulário.
   * @param {Boolean} clearSidebar - Flag para habilitar/desabilitar a limpeza da seleção da sidebar.
   */
    clearContent(form, clearSidebar = true) {
        if (clearSidebar) super.clearContent(form);
        const titleInput = this.form.querySelector('#titleInput');
        titleInput.value = '';

        const isDraftCheck = this.form.querySelector('#checkbox');
        isDraftCheck.checked = false;

        if (tinymce.activeEditor) {
            tinymce.activeEditor.resetContent();
        } else {
            this.msgBox.showError('Editor TinyMCE não inicializado.');
        }
    }

    /**
   * Fecha dialog aberto, se houver um.
   */
    closeDialog() {
        if (this.dialog) {
            this.dialog.closeDialog();
        }
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
        this.dialog.closeDialog();
        this.clearContent(this.form);
    }

    /**
    * Trata o evento de registro de uma nova entrada.
    * @param {Event} event - Evento de clique no botão de Salvar.
    */
    async onSaveCategoryClick(event) {
        event.stopPropagation();

        // Ignora o clique se o botão estiver desativado.
        const button = event.target.closest('#saveButton');
        if (button.classList.contains('disabled')) return;

        const body = 'Deseja salvar a entrada?';
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
    * @param {Event} event - Evento de clique no botão de Nova Entrada.
    */
    async onNewEntryClick(event) {
        const isValid = super.onNewEntryClick(event);
        if (isValid) {
            this.clearContent(this.form, false);

            const cancelButton = this.form.querySelector('#cancelButton');
            cancelButton.classList.remove('hidden');

            const saveButton = this.form.querySelector('#saveButton');
            saveButton.classList.remove('disabled');

            const titleInput = this.form.querySelector('#titleInput');
            titleInput.focus();
        }
    }

    /**
    * Trata o evento de cancelamento de uma nova entrada.
    * @param {Event} event - Evento de clique no botão de Cancelar.
    */
    async onCancelClick(event) {
        event.stopPropagation();

        const cancelButton = this.form.querySelector('#cancelButton');
        cancelButton.classList.add('hidden');

        const saveButton = this.form.querySelector('#saveButton');
        saveButton.classList.add('disabled');

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

        if(category.length != 1) {
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

        if(category.img) imgInput.src = category.img;

        const cancelButton = this.form.querySelector('#cancelButton');
        cancelButton.classList.remove('hidden');

        const saveButton = this.form.querySelector('#saveButton');
        saveButton.classList.remove('disabled');
    }
}
