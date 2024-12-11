import EntryForm from "./entryForm.js";

export class AtlasForm extends EntryForm {
    constructor(overlay) {
        super(overlay);

        this.configureContent(this.form);
    }

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

        // Configura o recipiente de imagem usando o método da classe pai.
        super.configureImageContainer(form);

        this.configureCaptionTinyMCE();
    }

    /**
    * Configura o editor TinyMCE para o texto de legenda da Entrada.
    */
    configureCaptionTinyMCE() {
        if (tinymce.get('captionEditor')) {
            tinymce.remove('#captionEditor');
        }

        const options = CONFIG.utils.mergeObjects(CONFIG.tinymceOptions.simple,{
            selector: 'div#captionEditor',
            placeholder: "Descrição da imagem...",
            init_instance_callback: (editor) => {
              editor.setContent(""); // Garante que o editor seja iniciado vazio.
            },
            setup: (editor) => { this._setupTinyMCE(editor); }
          });

        tinymce.init(options);
    }
}