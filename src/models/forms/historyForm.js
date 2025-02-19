import DatePicker from "../datePicker.js";
import EntryForm from "./entryForm.js";
import TimelineDialog from "../dialogs/timelineDialog.js";

/**
  * Formulário para lidar com entradas do tipo histórico.
  * @class
  * @extends EntryForm
  * 
  */
export default class HistoryForm extends EntryForm {
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

        this.template = 'historyForm'; // Define o template do formulário. 

        this.type = 'history'; // Define o tipo do formulário.        

        /**
         * @property {Object} datePickers - Um objeto que gerencia os seletores de data para registro de entradas.
         * Contém duas instâncias de `DatePicker` para 'startDate' (data de início) e 'endDate' (data de término).
         */
        this.datePickers = {
            start: new DatePicker('startDate'),
            end: new DatePicker('endDate')
        }
    }

    /* ---------------------------------------------------------------------------------------------------------------- */
    // GETTERS E SETTERS
    /**
    * Obtém os dados unificados necessários para o funcionamento do formulário.
    * @implements Implemente um método filho para as especificidades de cada formulário.
    * @async
    * @returns {object}  - Objeto de dados unificado.
    */
    prepareData() {
        super.prepareData();

        this.data.entryTypes = uniforge.doc.entryTypes.toObject();
        this.data.relevances = uniforge.doc.relevances.toObject();
        this.data.calendars = uniforge.doc.calendars.toObject();

        return this.data;
    }

    /* ---------------------------------------------------------------------------------------------------------------- */
    // INTERFACE DE USUÁRIO
    /**
       * Habilita/desabilita os controles do formulário.
       * @param {Number} state - O novo estado do formulário.
       * @protected
       */
    controlStates(state) {
        super.controlStates(state);
        const flavorEditor = tinymce.get('flavorEditor');

        switch (state) {
            // ESTADO DE HABILITAÇÃO DE NOVA ENTRADA.
            case this.states.newEntry: {
                flavorEditor.mode.set('readonly');
            } break;
            // ESTADO DE EDIÇÃO DE ENTRADA.
            case this.states.adding: {
                flavorEditor.mode.set('design');
            } break;
            // ESTADO DE DELEÇÃO DE DADOS.
            case this.states.editing: {
                flavorEditor.mode.set('design');
            } break;
            // ESTADO PADRÃO.
            default: {
                flavorEditor.mode.set('readonly');
            } break;
        }
    }
    /* ---------------------------------------------------------------------------------------------------------------- */
    // CONFIGURAÇÕES
    /**
    * Configura o conteúdo do formulário associado à instância.
    * Este método sobrescreve a implementação da classe pai e adiciona configurações específicas.
    * 
    * @inheritdoc
    */
    async configureContent() {
        // Chama o método de configuração da classe pai para configurar o formulário base.
        await super.configureContent();

        // Configura o editor TinyMCE de floreio associado ao formulário.
        await this.configureFlavorTinyMCE();
    }

    /**
    * Limpa o conteúdo do formulário
    * 
    * @param {Boolean} clearSidebar - Flag para habilitar/desabilitar a limpeza da seleção da sidebar.
    */
    clearContent(clearSidebar = true) {
        super.clearContent(clearSidebar);

        const flavorEditor = tinymce.get('flavorEditor');
        flavorEditor.setContent('');

        const entryTypeSelect = this.querySelector('#entryType');
        entryTypeSelect.value = 0;

        const importanceSelect = this.querySelector('#relevance');
        importanceSelect.value = 0;

        const calendarTypeSelect = this.querySelector('#calendarType');
        calendarTypeSelect.value = 1;

        this.configureDatePickers();
    }

    /**
    * Configura o editor TinyMCE para o texto de floreio da Entrada.
    */
    async configureFlavorTinyMCE() {
        if (tinymce.get('flavorEditor')) {
            tinymce.remove('#flavorEditor');
        }

        const options = uniforge.utils.mergeObjects(uniforge.tinymceOptions.simple, {
            selector: 'div#flavorEditor',
            placeholder: "Texto de floreio...",
            init_instance_callback: (editor) => {
                editor.setContent(""); // Garante que o editor seja iniciado vazio.
            },
            setup: (editor) => { this._setupInlineTinyMCE(editor); }
        });

        await tinymce.init(options);
    }

    /**
    * Carrega os DatePickers associados à instância.
    * Para cada DatePicker, chama o método `_loadDatePicker`, passando o primeiro calendário disponível.
    */
    configureDatePickers() {
        const calendars = this.data.calendars;
        // Itera sobre todos os valores do objeto `datePickers`.
        Object.values(this.datePickers).forEach(pickers => {
            /**
             * Carrega o DatePicker com o primeiro calendário disponível.
             * @method _loadDatePicker
             * @param {Object} calendar - O primeiro calendário no objeto `calendars`.
             */
            pickers._loadDatePicker(Object.values(calendars)[0]);
        });
    }

    /**
    * Recarrega os DatePickers associados à instância.
    * Para cada DatePicker, chama o método `_loadDatePicker`, passando o calendário escolhido.
    */
    reconfigureDatePickers(event) {
        const calendarType = this.querySelector('#calendarType');
        calendarType.value = event.clid;
        calendarType.dispatchEvent(new Event('change'));

        this.datePickers.start.selectFullDate(event.start_day, event.start_month, event.start_year);
        if (event.end_day)
            this.datePickers.end.selectFullDate(event.end_day, event.end_month, event.end_year);
    }

    /* ---------------------------------------------------------------------------------------------------------------- */
    // LISTENERS
    /**
    * Configura ouvintes de eventos básicos para o formulário.
    * @inheritdoc
    */
    activateListeners() {
        super.activateListeners();

        const calendarType = this.querySelector('#calendarType');
        calendarType.addEventListener('change', (event) => { this.onDateTypeChange(event); });        
    }
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

        const entryType = this.querySelector('#entryType');
        const relevance = this.querySelector('#relevance');
        const calendarType = this.querySelector('#calendarType');

        uniforge.utils.mergeObjects(data, {
            etid: entryType.value,
            cid: headerInfo.dataset.cid,
            iid: relevance.value,
            clid: calendarType.value,
            flavor: tinymce.get('flavorEditor').getContent() ?? '',
            htmlString: tinymce.get('mainEditor').getContent() ?? '',
            date: {
                start: this.datePickers.start.selectedDate,
                end: this.datePickers.end.selectedDate
            },
            text: ''
        });

        const validate = uniforge.db.validateEventEntry(data);
        if (validate !== '') {
            this.msgBox.showWarning(validate);
            return;
        }

        if (isEntryUpdate) {
            data.eid = options.id;
            data.evid = headerInfo.dataset.evid;

            await uniforge.db.updateEntry(data);
            await uniforge.db.updateEvent(data);
            this.msgBox.showInfo('Entrada atualizada com sucesso.');
        }
        else {
            const result = await uniforge.db.addEntry(data);
            data.eid = result.addedId;
            await uniforge.db.addEvent(data);
            this.msgBox.showInfo('Entrada criada com sucesso.');
        }

    }
    /**
    * Trata o evento de criação de uma nova entrada.
    * @interface
    * @param {Event} event - Evento de clique no botão de Nova Entrada.
    */
    async onNewClick(event) {
        this.clearContent(false);
    }
    /**
    * Gerencia cliques duplos em itens de entrada.
    * @inheritdoc
    * @param {MouseEvent} event - O evento de clique duplo.
    */
    async onEntryItemDoubleClick(event) {
        await super.onEntryItemDoubleClick(event);
        const entry = this.data.entry;

        if (entry) {
            const entryEvent = uniforge.doc.events.get(entry.event);

            if (entryEvent) {
                this.reconfigureDatePickers(entryEvent);

                const headerInfo = this.querySelector('.header-info');
                headerInfo.dataset.evid = entryEvent.evid;

                const entryType = this.querySelector('#entryType');
                const relevance = this.querySelector('#relevance');

                entryType.value = entry.etid;
                relevance.value = entryEvent.iid;
                tinymce.get('mainEditor').setContent(entry.htmlString);
                tinymce.get('flavorEditor').setContent(entry.flavor);
            } else {
                this.msgBox.showWarning('Erro ao carregar eventos da entrada.');
            }
        } else {
            this.msgBox.showWarning('Erro ao carregar a entrada.');
        }
    }    
}