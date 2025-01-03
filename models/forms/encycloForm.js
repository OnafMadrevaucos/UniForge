import EntryForm from "./entryForm.js";
import { Database } from "../../scripts/tempDB.js";
import Dialog from "../dialogs/dialog.js";
import SubjectDialog from "../dialogs/subjectDialog.js";

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
     * @param {HTMLElement} title   - O título do formulário.
     */
    constructor(overlay, title) {
        super(overlay, title);

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
   * Habilita/desabilita os controles do formulário.
   * @param {Number} state - O novo estado do formulário.
   * @protected
   */
    controlStates(state) {
        super.controlStates(state);

        switch (state) {
            // ESTADO DE HABILITAÇÃO DE NOVA ENTRADA.
            case this.states.newEntry: break;
            // ESTADO DE EDIÇÃO DE ENTRADA.
            case this.states.editing: break;
            // ESTADO DE DELEÇÃO DE DADOS.
            case this.states.delete: break;
            // ESTADO PADRÃO.
            default: {
                this._clearRootIcon();
            } break;
        }
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

        // Atribui o estado padrão aos controles do formulário.
        this.controlStates(this.states.default);
    }

    /**
   * Configura ouvintes de eventos básicos para o formulário.
   * @param {HTMLElement} form - O formulário principal.
   * @protected
   */
    activateListeners(form) {
        super.activateListeners(form);

        const newSubjectButton = this.querySelector('#newSubjectButton');
        newSubjectButton.addEventListener('click', (event) => { this.onNewSubjectClick(event) });
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

            const headerInfo = this.querySelector('.header-info');

            const imgInput = this.querySelector('#hiddenFileInput');
            const titleInput = this.querySelector('#titleInput');
            const draftSwitch = this.querySelector('#checkbox');

            // Obtém o objeto do arquivo da imagem.
            const file = imgInput.files[0] ?? null;

            const data = {
                sid: headerInfo.dataset.sid,
                title: titleInput.value,
                htmlString: tinymce.activeEditor?.getContent() ?? '',
                isDraft: draftSwitch.checked
            }

            // Se uma imagem foi informada, prepare-a para o banco de dados.
            uniforge.utils.mergeObjects(data, await uniforge.utils.imageToBlob(file));

            const validate = uniforge.db.validateCategory(data);
            if (validate !== '') {
                this.msgBox.showWarning(validate);
                return;
            }

            if (isEntryUpdate) {
                data.cid = options.id;
                await uniforge.db.updateCategory(data);
                this.msgBox.showInfo('Categoria atualizada com sucesso.');
            }
            else {
                await uniforge.db.addCategory(data);
                this.msgBox.showInfo('Categoria criada com sucesso.');
            }
        }
        this.clearContent(this.form);

        const cancelButton = this.querySelector('#cancelButton');
        cancelButton.dispatchEvent(new Event('click'));

        await this.updateContent();
        this.controlStates(this.states.default);
    }

    /**
    * Trata o evento de criação de uma nova entrada.
    * @param {Event} event - Evento de clique no botão de Nova Categoria.
    */
    async onNewClick(event) {
        this.clearContent(this.form, false);
        this.controlStates(this.states.editing);
    }

    /**
   * Remove uma entrada de uma categoria da lista.
   * @param {Event} event - Evento de clique no botão para excluir a entrada.
   */
    async onDeleteEntryAction(event) {
        super.onDeleteEntryAction(event);

        const cancelButton = this.querySelector('#cancelButton');
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
        const category = this.data.entry;

        if (category) {            
            tinymce.get('mainEditor').setContent(category.htmlString);            
        }
    }

    /**
    * Gera um novo assunto.
    * @param {Event} event - Evento de clique no botão.
    */
    async onNewSubjectClick(event) {
        event.stopPropagation();

        const subject = await SubjectDialog.configDialog();
        if (subject) {
            await uniforge.db.addSubject(subject);
            this.updateContent();
        }
    }
}
