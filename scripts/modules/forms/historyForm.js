import { DatePickerManager } from "../managers/datePickerManager.js";
import { EntryForm } from "./entryForm.js";

/**
  * Formulário para lidar com entradas do tipo histórico.
  * @class
  * @extends EntryForm
  * 
  */
export class HistoryForm extends EntryForm {
    /**
      * Constrói uma instância da classe derivada, inicializando as propriedades e configurando o conteúdo.
      * @class
      * @extends EntryForm
      * 
      * @param {Object} overlay - O objeto overlay passado para a classe pai e utilizado para configurar esta instância.
      */
    constructor(overlay) {
        // Chama o construtor da classe pai com o parâmetro overlay.
        super(overlay);

        /**
         * @property {Array} entryTypes - Os tipos de entradas disponíveis para esta instância.
         * Esta propriedade é inicializada usando o método `getEntryTypes()` da classe pai.
         */
        this.entryTypes = super.getEntryTypes();

        /**
         * @property {Object} datePickers - Um objeto que gerencia os seletores de data para registro de entradas.
         * Contém duas instâncias de `DatePickerManager` para 'startDate' (data de início) e 'endDate' (data de término).
         */
        this.datePickers = {
            start: new DatePickerManager('startDate'),
            end: new DatePickerManager('endDate')
        }

        /**
         * Configura o conteúdo do formulário associado a esta instância.
         * @method configureContent
         * @param {HTMLElement} this.form - O elemento de formulário a ser configurado.
         */
        this.configureContent(this.form);
    }


    /**
    * Configura o conteúdo do formulário associado à instância.
    * Este método sobrescreve a implementação da classe pai e adiciona configurações específicas.
    * 
    * @override
    * @param {HTMLElement} form - O elemento que representa o formulário a ser configurado.
    */
    configureContent(form) {
        // Chama o método de configuração da classe pai para configurar o formulário base.
        super.configureContent(form);

        // Configura o seletor de tipos de entrada usando o método da classe pai.
        super.configureEntryTypeSelect(form);

        // Configura o seletor de calendários usando o método da classe pai.
        super.configureCalendarSelect(form);

        // Configura o editor TinyMCE associado ao formulário.
        super._configureTinyMCE();

        // Carrega os DatePickers associados ao formulário.
        this.loadDatePickers();
    }


    /**
    * Carrega os DatePickers associados à instância.
    * Para cada DatePicker, chama o método `_loadDatePicker`, passando o primeiro calendário disponível.
    */
    loadDatePickers() {
        // Itera sobre todos os valores do objeto `datePickers`.
        Object.values(this.datePickers).forEach(pickers => {
            /**
             * Carrega o DatePicker com o primeiro calendário disponível.
             * @method _loadDatePicker
             * @param {Object} calendar - O primeiro calendário no objeto `calendars`.
             */
            pickers._loadDatePicker(Object.values(this.calendars)[0]);
        });
    }
}