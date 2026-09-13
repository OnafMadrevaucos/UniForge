import EntryForm from "./entryForm.js";

export default class EconomyForm extends EntryForm  {
/**
      * Constrói uma instância da classe derivada, inicializando as propriedades e configurando o conteúdo.
      * @class
      * @extends EntryForm
      */
    constructor() {
        // Chama o construtor da classe pai com o parâmetro overlay.
        super('Economia', 'economy');
    }
}