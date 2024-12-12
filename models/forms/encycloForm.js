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

        // Configurações do formulário.
        super._configureTinyMCE();        
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

        // Obtém o objeto do arquivo da imagem.
        const file = imgInput.files[0] ?? null;  
        // Obtém a extensão do arquivo de imagem.
        const fileExt = file?.name.split('.').pop().toLowerCase();
        // Converte o arquivo para um ArrayBuffer (Blob)
        const arrayBuffer = await file.arrayBuffer();       

        const data = {
            sid: folder.dataset.sid,
            title: titleInput.value,
            htmlString: tinymce.activeEditor?.getContent() ?? '',
            isDraft: draftSwitch.checked
        }

        if(file) { 
            data.img = new Uint8Array(arrayBuffer);
            data.ext = fileExt;
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
        cancelButton.dispatchEvent(new Event('click'));

        await this.updateContent();
    }

    /**
    * Trata o evento de registro de uma nova categoria.
    * @param {Event} event - Evento de clique no botão de Salvar.
    */
    async onSaveClick(event) {
        event.stopPropagation();

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
    async onNewClick(event) {
        this.clearContent(this.form, false);        
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
   * @param {MouseEvent} event - O evento de clique duplo.
   * @private
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
