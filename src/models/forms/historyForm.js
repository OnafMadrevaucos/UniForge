import DatePicker from "../datePicker.js";
import EntryForm from "./entryForm.js";
import Dialogs from "../dialogs/dialog.js"
import EntrySearchDialog from "../dialogs/entrySearchDialog.js";
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
      */
    constructor() {
        // Chama o construtor da classe pai com o parâmetro overlay.
        super('História');

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

        this.selection.event = null; // ID do Evento selecionado na EventTab.
    }

    /** 
    * @property {Object} events - Objeto que armazena os eventos vinculados à entrada.    
    * @private
    * @default {}
    */
    #events = {};

    /**
    * O Evento possui eventos vinculados à Entrada? (false por padrão)
    * @type {boolean}
    */
    get hasEvents() {
        return Object.keys(this.#events).length > 0;
    };

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
        super.controlStates(state, { ignoreEditor: true });
        const flavorEditor = tinymce.get('flavorEditor');

        switch (state) {
            // ESTADO DE HABILITAÇÃO DE NOVA ENTRADA.
            case this.states.newEntry: {
                flavorEditor.mode.set('readonly');
                this._toggleSectionButtons(true);
            } break;
            // ESTADO DE EDIÇÃO DE ENTRADA.
            case this.states.adding: {
                flavorEditor.mode.set('design');
                this._toggleSectionButtons(false, false);
            } break;
            // ESTADO DE DELEÇÃO DE DADOS.
            case this.states.editing: {
                flavorEditor.mode.set('design');
                this._toggleSectionButtons(false, false);
            } break;
            // ESTADO PADRÃO.
            default: {
                const relevanceSelect = this.querySelector('#relevance');
                relevanceSelect.selectedIndex = 0;

                flavorEditor.mode.set('readonly');
                this._toggleSectionButtons(true);
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

        // Configura o editor TinyMCE de floreio dos eventos associados à entrada do formulário.
        await this.configureEventFlavorTinyMCE();
    }

    /**
    * Limpa o conteúdo do formulário
    * 
    * @param {Boolean} clearSidebar - Flag para habilitar/desabilitar a limpeza da seleção da sidebar.
    */
    clearContent(clearSidebar = true) {
        super.clearContent(clearSidebar);

        this.eid = null;
        this.#events = [];

        const entryTypeSelect = this.querySelector('#entryType');
        entryTypeSelect.value = 1;

        const entryEvents = this.querySelector('#entryEvents');
        entryEvents.innerHTML = '';

        this.clearEventTab();
    }

    /**
     * Limpa a aba de eventos do formulário.
     * 
     * Remove todos os eventos listados na aba, limpa o título e o tipo do evento,
     * reconfigura os seletores de data e limpa o editor de floreio do evento.
     */
    clearEventTab() {
        const eventTitle = this.querySelector('#eventTitle');
        eventTitle.value = '';
        eventTitle.focus();

        const eventEntryTypeSelect = this.querySelector('#eventEntryType');
        eventEntryTypeSelect.value = 1;

        const relevanceSelect = this.querySelector('#relevance');
        relevanceSelect.value = 1;

        const calendarTypeSelect = this.querySelector('#calendarType');
        calendarTypeSelect.value = 1;

        const eventFlavorEditor = tinymce.get('eventFlavorEditor');
        eventFlavorEditor.setContent('');

        this.reconfigureDatePickers();

        const addEventButton = this.querySelector('#addEventButton');
        addEventButton.innerHTML = '<i class="fas fa-square-plus"></i> Adicionar Evento';
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
    * Configura o editor TinyMCE para o texto de floreio dos eventos da Entrada.
    */
    async configureEventFlavorTinyMCE() {
        if (tinymce.get('eventFlavorEditor')) {
            tinymce.remove('#eventFlavorEditor');
        }

        const options = uniforge.utils.mergeObjects(uniforge.tinymceOptions.simple, {
            selector: 'div#eventFlavorEditor',
            placeholder: "Descrição do evento...",
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
        const calendars = this.data.calendars;

        const calendarType = this.querySelector('#calendarType');
        calendarType.value = event?.clid ?? 1;
        calendarType.dispatchEvent(new Event('change'));

        // Se houver um evento, carregue o DatePicker com a data do evento.
        if (event) {
            this.datePickers.start.selectFullDate(event.s_day, event.s_month, event.s_year);
            // Se houver uma data de fim, carregue o DatePicker com a data do evento.
            if (event.e_day)
                this.datePickers.end.selectFullDate(event.e_day, event.e_month, event.e_year);
        } else { // Senão, limpe os DatePickers.

            // Itera sobre todos os valores do objeto `datePickers`.
            Object.values(this.datePickers).forEach(pickers => {
                /**
                 * Carrega o DatePicker com o primeiro calendário disponível.
                 * @method _loadDatePicker
                 * @param {Object} calendar - O primeiro calendário no objeto `calendars`.
                 */
                pickers._reloadDatePicker(Object.values(calendars)[0]);
            });
        }
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

        const sectionButtons = this.querySelectorAll('#sections .tabs-options button');
        sectionButtons.forEach(button => {
            button.addEventListener('click', (event) => { this.onSectionButtonClick(event); });
        });

        const newEventButton = this.querySelector('#addEventButton');
        newEventButton.addEventListener('click', (event) => { this.onAddEventClick(event); });
    }

    /**@inheritdoc */
    onDeleteSwitchChange(event) {
        super.onDeleteSwitchChange(event);
    }

    /**
     * Manipulador de evento para clique em uma pasta.
     * Faz tratamento para mostrar apenas os tipos de entrada
     * que são compatíveis com o tipo de pasta clicada.
     * @param {MouseEvent} event - Evento de clique na pasta.
     * @protected
     */
    onFolderClick(event) {
        super.onFolderClick(event);

        const clickedFolder = event.target.closest('.folder');
        const sectionId = clickedFolder.dataset.id;
        const section = uniforge.doc.sections.get(sectionId);
        const type = section.chapterType;

        const entryTypeSelect = this.querySelector('#entryType');
        const entryTypeOptions = entryTypeSelect.options;

        if (type == 1) {
            for (let i = 0; i < entryTypeOptions.length; i++) {
                const etid = Number(entryTypeOptions[i].value);
                if (etid !== 1) {
                    const entryType = uniforge.doc.entryTypes.get(etid);
                    if (entryType.isMaterial == 0) {
                        entryTypeOptions[i].hidden = true;
                        continue;
                    }
                }

                entryTypeOptions[i].hidden = false;
            }
        } else if (type == 2) {
            for (let i = 0; i < entryTypeOptions.length; i++) {
                const etid = Number(entryTypeOptions[i].value);
                if (etid !== 1) {
                    const entryType = uniforge.doc.entryTypes.get(etid);
                    if (entryType.isMaterial == 1) {
                        entryTypeOptions[i].hidden = true;
                        continue;
                    }
                }

                entryTypeOptions[i].hidden = false;
            }
        } else {
            for (let i = 0; i < entryTypeOptions.length; i++) {
                const etid = Number(entryTypeOptions[i].value);
                if (etid !== 1) {
                    entryTypeOptions[i].hidden = true;
                    continue;
                }

                entryTypeOptions[i].hidden = false;
            }
        }
    }

    /**
     * Trata o evento de clique em uma se o de uma aba do formul rio.
     * @param {Event} event - O evento de clique no bot o de se o.
     */
    onSectionButtonClick(event) {
        event.stopPropagation();
        this._toggleSectionButtons(false, true);

        const button = event.target.closest('button');
        button.classList.add('selected');

        this._activateTab(button.dataset.tab);
    }

    onEventItemClick(clkEvent) {
        clkEvent.stopPropagation();
        const clickedEvent = clkEvent.target.closest('.item');
        const evid = clickedEvent.dataset.value;
        const event = this.#events[evid];

        const eventTitle = this.querySelector('#eventTitle');
        const eventEntryType = this.querySelector('#eventEntryType');
        const relevance = this.querySelector('#relevance');
        const calendarType = this.querySelector('#calendarType');

        eventTitle.value = event.title;
        eventTitle.focus();

        eventEntryType.value = event.etid;
        relevance.value = event.relevance;
        calendarType.value = event.clid;

        this.reconfigureDatePickers(event);

        tinymce.get('eventFlavorEditor').setContent(event.flavor);

        const addEventButton = this.querySelector('#addEventButton');
        addEventButton.innerHTML = '<i class="fas fa-pen-to-square"></i> Editar Evento';

        this.selection.event = clickedEvent;
    }

    /**
     * Trata o evento de clique no botão de adicionar um novo Evento.
     * @param {Event} event - O evento de clique no botão de adicionar um novo Evento.
     */
    onAddEventClick(event) {
        event.stopPropagation();

        const eventTitle = this.querySelector('#eventTitle');
        const eventEntryType = this.querySelector('#eventEntryType');
        const relevance = this.querySelector('#relevance');
        const calendarType = this.querySelector('#calendarType');

        const newEvid = this.selection.event ? this.selection.event.dataset.value : uniforge.db.generateID();

        const newEvent = {
            _value: newEvid,
            _label: eventTitle.value,
            _icon: '<i class="fa-solid fa-calendar-days"></i>',
            evid: newEvid,
            title: eventTitle.value,
            etid: eventEntryType.value,
            relevance: relevance.value,
            clid: calendarType.value,
            flavor: tinymce.get('eventFlavorEditor').getContent() ?? '',
            s_day: this.datePickers.start.selectedDate.day,
            s_month: this.datePickers.start.selectedDate.month,
            s_year: this.datePickers.start.selectedDate.year,
            e_day: this.datePickers.end.selectedDate.day,
            e_month: this.datePickers.end.selectedDate.month,
            e_year: this.datePickers.end.selectedDate.year,
            dbAction: uniforge.doc.events.get(newEvid) ? 'u' : 'a'
        };

        const result = uniforge.db.validateEvent(newEvent);
        if (result !== '') {
            this.msgBox.showWarning(result);
            return;
        }

        this.#events[newEvid] = newEvent;
        this._generateEventListItems();
    }

    /**
     * Trata o evento de clique no botão de apagar um evento.
     * @param {Event} event - Evento de clique no botão de apagar.
     */
    async onDeleteEventClick(event) {
        event.stopPropagation();
        if (await Dialogs.confirm('Apagar entrada', 'Deseja realmente apagar essa entrada?')) {
            const deletedItem = event.target.closest('.item');
            const itemId = deletedItem.dataset.value;

            this.#events[itemId].dbAction = 'd';
            this._generateEventListItems();
        }
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
        const isUpdate = options.isUpdate ?? false;

        const headerInfo = this.querySelector('.header-info');
        const entryType = this.querySelector('#entryType');

        uniforge.utils.mergeObjects(data, {
            etid: entryType.value,
            sid: headerInfo.dataset.sid,
            flavor: tinymce.get('flavorEditor').getContent() ?? '',
            htmlString: tinymce.get('mainEditor').getContent() ?? ''
        });

        let result = uniforge.db.validateEntry(data);
        if (result !== '') {
            this.msgBox.showWarning(validate);
            return false;
        }

        if (isUpdate) {
            data.eid = options.id;

            await uniforge.db.updateEntry(data);

            const events = Object.values(this.#events);
            if (events.length > 0) {
                for (const event of events) {
                    event.sid = data.sid;
                    event.source = data.eid;

                    switch (event.dbAction) {
                        case 'd': {
                            await uniforge.db.deleteEvent(event.evid);
                        } break;
                        case 'a': {
                            result = uniforge.db.validateEvent(event);
                            if (result !== '') {
                                this.msgBox.showWarning(result);
                                return false;
                            }
                            await uniforge.db.addEvent(event);
                        } break;
                        case 'u': {
                            result = uniforge.db.validateEvent(event);
                            if (result !== '') {
                                this.msgBox.showWarning(result);
                                return false;
                            }
                            await uniforge.db.updateEvent(event);
                        } break;
                        default: break;
                    }
                }
            }
            this.msgBox.showInfo('Entrada atualizada com sucesso.');
        }
        else {
            let result = await uniforge.db.addEntry(data);
            data.eid = result.addedId;

            const events = Object.values(this.#events);
            if (events.length > 0) {
                for (const event of events) {
                    event.sid = data.sid;
                    event.source = data.eid;

                    switch (event.dbAction) {
                        case 'd': {
                            await uniforge.db.deleteEvent(event.evid);
                        } break;
                        case 'a': {
                            result = uniforge.db.validateEvent(event);
                            if (result !== '') {
                                this.msgBox.showWarning(result);
                                return false;
                            }
                            await uniforge.db.addEvent(event);
                        } break;
                        case 'u': {
                            result = uniforge.db.validateEvent(event);
                            if (result !== '') {
                                this.msgBox.showWarning(result);
                                return false;
                            }
                            await uniforge.db.updateEvent(event);
                        } break;
                        default: break;
                    }
                }
            }
            this.msgBox.showInfo('Entrada criada com sucesso.');
        }

        return true;
    }
    /**
    * Trata o evento de criação de uma nova entrada.
    * @interface
    * @param {Event} event - Evento de clique no botão de Nova Entrada.
    */
    async onNewClick(event) {
        this.clearContent(false);
        this.eid = uniforge.db.generateID();
    }
    /**
    * Gerencia cliques duplos em itens de evento.
    * @inheritdoc
    * @param {MouseEvent} event - O evento de clique duplo.
    */
    async onEntryItemDoubleClick(mouseEvent) {
        await super.onEntryItemDoubleClick(mouseEvent);
        const entry = this.data.entry;

        if (entry) {
            this.reconfigureDatePickers(entry);
            const headerInfo = this.querySelector('.header-info');
            headerInfo.dataset.eid = entry.eid;

            const entryType = this.querySelector('#entryType');
            const entryEvents = this.querySelector('#entryEvents');

            entryType.value = Number(entry.etid);

            tinymce.get('flavorEditor').setContent(entry.flavor);
            tinymce.get('mainEditor').setContent(entry.htmlString);

            this.#events = {};
            const events = uniforge.doc.events.filter(e => {
                return e.source === entry.eid;
            });

            events.forEach(event => {
                event._value = event.evid;
                event._icon = '<i class="fa-solid fa-calendar-days"></i>';
                event.dbAction = '-';

                this.#events[event.evid] = event;
            });
            this._generateEventListItems();
        } else {
            this.msgBox.showWarning('Erro ao carregar o evento.');
        }
    }

    /**
     * Habilita/desabilita e limpa a seleção dos botões de seção do formulário.
     * @protected
     * 
     * @param {boolean} [disabled=false] - Se true, desabilita todos os botões de seção.
     * @param {boolean} [clearSelection=true] - Se true, limpa a seleção dos botões de seção.
     */
    _toggleSectionButtons(disabled = false, clearSelection = true) {
        const sectionButtons = this.querySelectorAll('#sections .tabs-options button');
        sectionButtons.forEach(button => {
            button.classList.remove('selected');
            button.disabled = disabled;
        });

        const defaultButton = sectionButtons[0];
        if (defaultButton) {
            this._activateTab(defaultButton.dataset.tab);
            if (!clearSelection) {
                defaultButton.classList.add('selected');
            }
        }
    }

    /**
     * Ativa a aba especificada pelo ID do tab.
     * 
     * Remove a classe 'active' de todas as abas e adiciona a classe 'active' à aba correspondente ao tabId fornecido.
     * 
     * @param {string} tabId - O ID da aba a ser ativada.
     */
    _activateTab(tabId) {
        const tabs = this.querySelectorAll('#sections .tab-content');
        tabs.forEach(tab => {
            tab.classList.remove('active');
        });

        const tab = this.querySelector(`#${tabId}`);
        if(tab) tab.classList.add('active');
    }

    /**
     * Gera os itens da lista de eventos associados a uma Entrada.
     * @protected
     */
    _generateEventListItems() {
        const entryEvents = this.querySelector('#entryEvents');
        // Limpa a lista de Eventos.
        entryEvents.innerHTML = '';

        // Obtem os dados dos Eventos.
        const eventsData = Object.values(this.#events).filter(e => e.dbAction !== 'd');

        // Gera os itens da lista de Eventos.
        eventsData.forEach(event => {
            // Gera o item de Evento.
            const item = uniforge.parser.generateItemList(event, { withDelete: true });

            // Adiciona o evento de clique no item de Evento.
            item.addEventListener('click', (event) => { this.onEventItemClick(event); });

            // Adiciona o evento de clique no botão de exclusão.
            const deleteButton = item.querySelector('.delete-button');
            deleteButton.addEventListener('click', (event) => { this.onDeleteEventClick(event); });

            // Adiciona o item na lista de Eventos.
            entryEvents.appendChild(item);
        });

        // Limpa a aba de Eventos, após qualquer alteração da Lista de Eventos.
        this.clearEventTab();
    }
}