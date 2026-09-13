import EntryForm from "./entryForm.js";

/**
  * Formulário para lidar com entradas do tipo político.
  * @class
  * @extends EntryForm
  * 
  */
export default class PoliticsForm extends EntryForm {
    /**
      * Constrói uma instância da classe derivada, inicializando as propriedades e configurando o conteúdo.
      * @class
      * @extends EntryForm
      */
    constructor() {
        // Chama o construtor da classe pai com o parâmetro overlay.
        super('Política', 'politics');
    }
}