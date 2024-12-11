import { DatePickerManager } from "../datePickerManager.js";
import EntryForm from "./entryForm.js";
import Dialog from "../dialogs/dialog.js";

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
   * Obtém os assuntos de uma dada origem disponíveis no banco de dados.
   * @returns {Object} - Assuntos e suas categorias.
   * @async
   */
    async getSubjects() {
        const data = await this.db.getSubjects(this.root);

        for (let category of Object.values(data)) {
            category.entries = Object.values(await this.db.getEntriesFromCategory(category.cid));
        }
        return data;
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

        // Configura o seletor de importâncias de evento usando o método da classe pai.
        await super.configureImportanceSelect(form);

        // Configura o seletor de tipos de entrada usando o método da classe pai.
        await super.configureEntryTypeSelect(form);

        // Configura o seletor de calendários usando o método da classe pai.
        await super.configureCalendarSelect(form);

        // Configura o editor TinyMCE associado ao formulário.
        super._configureTinyMCE();

        // Carrega os DatePickers associados ao formulário.
        this.loadDatePickers();

        const cancelButton = this.form.querySelector('#cancelButton');
        cancelButton.addEventListener('click', (event) => { this.onCancelClick(event); });

        // Configura o evento de criação de novas entradas
        const newEntryButton = document.getElementById('newEntryButton');
        newEntryButton.addEventListener('click', (event) => { this.onNewEntryClick(event); });

        const saveButton = this.form.querySelector('#saveButton');
        saveButton.addEventListener('click', (event) => { this.onSaveEntryClick(event); });
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

    /**
    * Registra uma nova entrada no banco de dados.
    * @param {Event} event - Evento de clique no botão de Salvar do Dialog.
    */
    async onSaveEntry(event) {
        event.stopPropagation();
        const folder = this.form.querySelector('.folder.selected');
        if (!folder) {
            this.msgBox.showWarning('Nenhuma categoria foi selecionada.');
            this.closeDialog();
            return;
        }

        const imgInput = this.form.querySelector('#hiddenFileInput');
        const titleInput = this.form.querySelector('#titleInput');
        const entryType = this.form.querySelector('#entryType');
        const importance = this.form.querySelector('#importance');
        const draftSwitch = this.form.querySelector('#checkbox');

        const data = {
            etid: entryType.value,
            iid: importance.value,
            title: titleInput.value,
            date: {
                start: this.datePickers.start.selectedDate,
                end: this.datePickers.end.selectedDate
            },
            img: imgInput.value,
            htmlString: tinymce.activeEditor?.getContent() ?? '',
            isDraft: draftSwitch.checked,
            cid: folder.dataset.cid,
            text: ''
        }

        const validate = CONFIG.db.validateEventEntry(data);
        if (validate !== '') {
            this.msgBox.showWarning(validate);
            return;
        }

        await CONFIG.db.addEntry(data);
        await CONFIG.db.addEvent(data);

        this.msgBox.showInfo('Entrada criada com sucesso.');
        this.closeDialog();
        this.clearContent(this.form);

        const cancelButton = this.form.querySelector('#cancelButton');
        cancelButton.click();

        await this.updateContent();
    }

    /**
    * Trata o evento de registro de uma nova entrada.
    * @param {Event} event - Evento de clique no botão de Salvar.
    */
    async onSaveEntryClick(event) {
        event.stopPropagation();
        if (!super.onSaveClick(event)) return;

        const body = 'Deseja salvar a entrada?';
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
                onClick: (event) => { this.onSaveEntry(event); },
            }
        ];

        this.dialog = new Dialog('Salvar', body, buttons);
        this.dialog.createDialog();
    }

    /**
    * Trata o evento de criação de uma nova entrada.
    * @param {Event} event - Evento de clique no botão de Nova Entrada.
    */
    async onNewEntryClick(event) {
        if (super.onNewClick(event)) {
            this.clearContent(this.form, false);
        }
    }

    /**
    * Trata o evento de cancelamento de uma nova entrada.
    * @param {Event} event - Evento de clique no botão de Cancelar.
    */
    async onCancelClick(event) {
        event.stopPropagation();

        super.onCancelClick(event);
        this.clearContent(this.form);
    }
}