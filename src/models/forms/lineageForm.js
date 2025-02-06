import EntryForm from "./entryForm.js";

export default class LineageForm extends EntryForm {
    /**
      * Constrói uma instância da classe derivada, inicializando as propriedades e configurando o conteúdo.
      * @class
      * @extends EntryForm
      * 
      * @param {HTMLElement} title   - O título do formulário.
      */
    constructor(title) {
        // Chama o construtor da classe pai com o parâmetro overlay.
        super(title);

        this.template = 'lineageForm'; // Define o template do formulário. 

        this.type = 'lineage'; // Define o tipo do formulário. 
    }
}