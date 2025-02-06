import EntryForm from "./entryForm.js";

export default class AtlasForm extends EntryForm {
    constructor(title) {
        super(title);

        this.template = 'atlasForm'; // Define o template do formulário.

        this.type = 'atlas'; // Define o tipo do formulário.
    }

    /* ---------------------------------------------------------------------------------------------------------------- */
    // CONFIGURAÇÕES
    /**
    * Configura o conteúdo do formulário associado à instância.
    * Este método sobrescreve a implementação da classe pai e adiciona configurações específicas.
    * 
    * @override
    * @param {HTMLElement} form - O elemento que representa o formulário a ser configurado.
    */
    async configureContent(form) {
        // Chama o método de configuração da classe pai para configurar o formulário base.
        await super.configureContent(form);

        this.configureCaptionTinyMCE();

        // Atribui o estado padrão aos controles do formulário.
        this.controlStates(this.states.default);
    }

    /**
    * Configura o editor TinyMCE para o texto de legenda da Entrada.
    */
    configureCaptionTinyMCE() {
        if (tinymce.get('captionEditor')) {
            tinymce.remove('#captionEditor');
        }

        const options = uniforge.utils.mergeObjects(uniforge.tinymceOptions.simple, {
            selector: 'div#captionEditor',
            placeholder: "Descrição da imagem...",
            init_instance_callback: (editor) => {
                editor.setContent(""); // Garante que o editor seja iniciado vazio.
            },
            setup: (editor) => { this._setupInlineTinyMCE(editor); }
        });

        tinymce.init(options);
    }

    /* ---------------------------------------------------------------------------------------------------------------- */
    // LISTENERS
    /**
    * Trata o evento de registro de uma nova entrada.
    * @interface
    * @param {Event} event      - Evento de clique no botão de Salvar.
    * @param {Object} data      - Dados padrão de qualquer entrada.
    * @param {Object} options   - Opções de salvamento da entrada.
    */
    async onSaveClick(event, data, options = {}) {
        event.stopPropagation();
        const isEntryUpdate = options.isEntryUpdate ?? false;

        const headerInfo = this.querySelector('.header-info');
        
        uniforge.utils.mergeObjects(data, {
            cid: headerInfo.dataset.cid,
            etid: 0,
            flavor: tinymce.get('captionEditor').getContent() ?? '',
            htmlString: ''
        });

        // Validar os dados de entrada de Atlas.
        const validate = uniforge.db.validateAtlasEntry(data);
        if (validate !== '') {
            this.msgBox.showWarning(validate);
            return;
        }

        if (isEntryUpdate) {
            data.eid = options.id;
            await uniforge.db.updateEntry(data);
            this.msgBox.showInfo('Entrada atualizada com sucesso.');
        }
        else {
            await uniforge.db.addEntry(data);
            this.msgBox.showInfo('Entrada criada com sucesso.');
        }

    }
    /**
    * Trata o evento de criação de uma nova entrada.
    * @interface
    * @param {Event} event - Evento de clique no botão de Nova Entrada.
    */
    async onNewClick(event) {
        this.clearContent(this.form, false);
    }
    /**
    * Trata o evento de cancelamento de uma nova entrada.
    * @interface
    * @param {Event} event - Evento de clique no botão de Cancelar.
    */
    async onCancelClick(event) {
        event.stopPropagation();

        super.onCancelClick(event);
        this.clearContent(this.form);
    }
    /**
   * Gerencia cliques duplos em itens de entrada.
   * @interface
   * @param {MouseEvent} event  - O evento de clique duplo. 
   */
    async onEntryItemDoubleClick(event) {
        super.onEntryItemDoubleClick(event);
        const entry = this.data.entry;

        if (entry) {
            tinymce.get('captionEditor').setContent(entry.flavor);
        }
    }
}