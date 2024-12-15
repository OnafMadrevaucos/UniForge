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
        const data = await this.db.getAllSubjects();

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
        // Obtém objeto com todos os dados unificados necessários para o funcionamento do formulário.         
        this.data = await this.getData();

        await super.configureContent(form);

        // Configura o recipiente de imagem usando o método da classe pai.
        super.configureImageContainer(form);

        // Atribui o estado padrão aos controles do formulário.
        this._controlFormStates(this.states.default);
    }

    /**
   * Configura o combo de Tipos de Entrada.
   * @param {HTMLElement} form - O formulário HTML principal.
   */
    configureSubjectTypeSelect(form) {
        const data = this.data.entryTypes;
        // Carrega as opções de Tipos de Entradas registrados
        const subjectType = form.querySelector('#subjectType');
        for (const id of Object.keys(data)) {
            subjectType.appendChild(this._newSubjectTypeOption(id));
        }
    }

    /**
    * Trata o evento de registro de uma nova categoria.
    * @param {Event} event      - Evento de clique no botão de Salvar.
    * @param {Object} options   - Opções de salvamento.
    */
    async onSaveClick(event, options = {}) {
        event.stopPropagation();
        const isEntryUpdate = options.isEntryUpdate ?? false;

        const title = (isEntryUpdate ? 'Atualizar' : 'Registrar');
        const message = (isEntryUpdate ? 'Deseja atualizar a categoria?' : 'Deseja salvar a vategoria?');

        if (await Dialog.confirm(title, message)) {

            const headerInfo = this.form.querySelector('.header-info');

            const imgInput = this.form.querySelector('#hiddenFileInput');
            const titleInput = this.form.querySelector('#titleInput');
            const draftSwitch = this.form.querySelector('#checkbox');

            // Obtém o objeto do arquivo da imagem.
            const file = imgInput.files[0] ?? null;

            const data = {
                sid: headerInfo.dataset.sid,
                title: titleInput.value,
                htmlString: tinymce.activeEditor?.getContent() ?? '',
                isDraft: draftSwitch.checked
            }

            // Se uma imagem foi informada, prepare-a para o banco de dados.
            if (file) {
                // Obtém a extensão do arquivo de imagem.
                const fileExt = file?.name.split('.').pop().toLowerCase();
                // Converte o arquivo para um ArrayBuffer (Blob)
                const arrayBuffer = await file?.arrayBuffer();

                data.img = new Uint8Array(arrayBuffer);
                data.ext = fileExt;
            }

            const validate = CONFIG.db.validateCategory(data);
            if (validate !== '') {
                this.msgBox.showWarning(validate);
                return;
            }

            if (isEntryUpdate) {
                data.cid = options.id;
                await CONFIG.db.updateCategory(data);
                this.msgBox.showInfo('Categoria atualizada com sucesso.');
            }
            else {
                await CONFIG.db.addCategory(data);
                this.msgBox.showInfo('Categoria criada com sucesso.');
            }
        }
        this.clearContent(this.form);

        const cancelButton = this.form.querySelector('#cancelButton');
        cancelButton.dispatchEvent(new Event('click'));

        await this.updateContent();
        this._controlFormStates(this.states.default);
    }

    /**
    * Trata o evento de criação de uma nova entrada.
    * @param {Event} event - Evento de clique no botão de Nova Categoria.
    */
    async onNewClick(event) {
        this.clearContent(this.form, false);
        this._controlFormStates(this.states.editEntry);
    }

    /**
   * Remove uma entrada de uma categoria da lista.
   * @param {Event} event - Evento de clique no botão para excluir a entrada.
   */
    async onDeleteEntryAction(event) {
        super.onDeleteEntryAction(event);

        const cancelButton = this.form.querySelector('#cancelButton');
        cancelButton.dispatchEvent(new Event('click'));

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
   * @protected
   * @param {MouseEvent} event - O evento de clique duplo.
   */
    async onEntryItemDoubleClick(event) {
        super.onEntryItemDoubleClick(event);
        const item = event.target.closest('.entry-item');
        const itemId = Number(item.dataset.id);
        let category = Object.values(await CONFIG.db.getCategory(itemId));

        if (category.length != 1) {
            this.msgBox.showWarning('Categoria está duplicada.');
        }

        category = category[0];

        const headerInfo = this.form.querySelector('.header-info');
        headerInfo.dataset.sid = category.sid;

        const displayedImage = this.form.querySelector('#displayedImage');
        const titleInput = this.form.querySelector('#titleInput');
        const draftSwitch = this.form.querySelector('#checkbox');

        titleInput.value = category.title;
        tinymce.activeEditor.setContent(category.htmlString);
        draftSwitch.checked = category.isDraft;

        if (category.img) {
            const imageType = `image/${category.ext}`;
            const imageBlob = new Blob([category.img], { type: imageType }); // Ajuste o tipo de imagem conforme necessário
            const imageURL = URL.createObjectURL(imageBlob);
            displayedImage.src = imageURL;
            displayedImage.classList.remove('empty');
        }

        const cancelButton = this.form.querySelector('#cancelButton');
        cancelButton.classList.remove('hidden');

        const saveButton = this.form.querySelector('#saveButton');
        saveButton.classList.remove('disabled');
    }
}
