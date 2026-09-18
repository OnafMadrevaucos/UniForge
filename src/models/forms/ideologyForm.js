import EntryForm from "./entryForm.js";

/**
  * Formulário para lidar com entradas sobre ideologias.
  * @class
  * @extends EntryForm
  * 
  */
export default class IdeologyForm extends EntryForm {
/**
      * Constrói uma instância da classe derivada, inicializando as propriedades e configurando o conteúdo.
      * @class
      * @extends EntryForm
      */
    constructor() {
        // Chama o construtor da classe pai com o parâmetro overlay.
        super('Ideologias', 'ideologies');
    }
}