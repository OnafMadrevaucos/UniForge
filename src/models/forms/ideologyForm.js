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
        super('Ideologias');

        this.type = 'ideologies'; // Define o tipo do formulário. 
    }

    /**
    * Obtém os dados unificados necessários para o funcionamento do formulário.
    * @implements Implemente um método filho para as especificidades de cada formulário.
    * @async
    * @returns {object}  - Objeto de dados unificado.
    */
    prepareData() {
        super.prepareData();
        return this.data;
    }   
}