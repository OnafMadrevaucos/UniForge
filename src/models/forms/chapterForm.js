import EntryForm from "./entryForm.js";

/**
* Constrói uma instância da classe derivada, inicializando as propriedades e configurando o conteúdo.
* @class
* @extends EntryForm
*/
export default class ChapterForm extends EntryForm {

    /**
    * Construtor da classe ChapterForm.
    * 
    * @param {HTMLElement} sourceBtn   - O botão que originou a chamada do formulário.
    * @param {Entry} entry             - Os dados da Entrada manipulada pelo formulário.
    */
    constructor(sourceBtn) {
        if (!sourceBtn) throw new Error('O botão de origem não pode ser nulo ou indefinido.');

        // Chama o construtor da classe pai com o parâmetro overlay.
        super('Capítulo', 'chapter', { closeCallback: this.onClose.bind(this) });
    }

    onClose(event) {

    }
}