import BaseForm from "./baseForm.js";
import Dialogs from "../dialogs/dialog.js";
import Slider from "../controls/slider.js";

import Calendar from "../../common/documents/calendar.mjs";
import CalendarDays from "../../common/documents/calendarDays.mjs";
import CalendarMonths from "../../common/documents/calendarMonths.mjs";

/**
* Constrói uma instância da classe derivada, inicializando as propriedades e configurando o conteúdo.
* @class
* @extends BaseForm
*/
export default class CalendarForm extends BaseForm {

    /**
    * Construtor da classe CalendarForm.
    * 
    * @param {HTMLElement} sourceBtn   - O botão que originou a chamada do formulário.
    * @param {Object} options          - Opções adicionais para configuração do formulário.
    * @param {Function} options.callback - Função de callback a ser chamada quando o formulário for fechado.
    * 
    * @throws {Error} Se o botão de origem for nulo ou indefinido.
    */
    constructor(sourceBtn, options = { callback: null }) {
        if (!sourceBtn) throw new Error('O botão de origem não pode ser nulo ou indefinido.');

        // Chama o construtor da classe pai com o parâmetro overlay.
        super('Gerenciador de Calendários', uniforge.utils.mergeObjects(options, {
            closeCallback: options.callback,
            height: '860px',
            width: '1300px'
        }));

        /**
        * @type {string} - O modelo HTML utilizado pelo formulário.
        */
        this.template = 'calendarForm';

        /**
         * Estados válidos para os elements do formulário.
         * @type {Object<number, number>}
         */
        this.states = this._states;

        /**@override*/
        this.docTag = 'chapters';

        /**@override*/
        this.dataSource = 'sections';

        /**
         * O objeto para armazenar os dados de seleção do formulário.
         */
        this.selection = {
            calendar: null,
            month: null
        };

        /**
         * O objeto para armazenar os sliders do formulário.
         */
        this.sliders = {
            monthSize: null
        };

        // Verifica se o formulário possui um callback de fechamento e configura-o.
        if (this.options.closeCallback) this.onCloseCallback = this.options.closeCallback;
    }

    /* ---------------------------------------------------------------------------------------------------------------- */
    // GETTERS E SETTERS 

    /**
     * Conjunto de filtros de item que representam os estados aplicáveis na classe EntryForm.
     * Os estados estão mapeados para números inteiros que representam ações específicas.
     * 
     * @type {Object<number, number>}
     * @private
     * @property {number} default  - Representa o estado de cancelamento de uma entrada (valor 0).
     * @property {number} newEntry - Representa o estado de criação de uma nova entrada (valor 1).
     * @property {number} adding   - Representa o estado de salvamento de uma entrada nova (valor 2).
     * @property {number} editing  - Representa o estado de salvamento de uma entrada pré-existente (valor 3). 
     */
    #states = {
        default: 0,
        newEntry: 1,
        adding: 2,
        editing: 3
    }

    /** Identificador da Entrada atual.
     * @returns {Object} 
     */
    get id() { return this.document?._id; }

    /** O calendário atual.
     * @returns {Calendar}
     */
    get calendar() { return this.selection.calendar; }

    /** O mês atual.
     * @returns {CalendarMonths}
     */
    get month() { return this.selection.month; }

    /**
     * @overload
     * Retorna um objeto com referências para elementos do formulário.
     * 
     * @returns {Object}  - Um objeto com as seguintes propriedades:
     *  - form: O elemento HTML que representa o formulário.
     *  - header: O elemento HTML que contém o título do formulário.
     *  - close_btn: O elemento HTML que fecha o formulário.
     *  - content: O elemento HTML que contém o conteúdo do formulário.
     *  - tooltip: O objeto de gerenciamento de tooltips.
     */
    get ui() {
        const ui = {
            tooltip: uniforge.tooltip
        };
        return uniforge.utils.mergeObjects(super.ui, ui);
    }

    /**
     * Retorna o objeto que armazena os estados do formulário.
     *
     * @returns {Object<number, number>} - Um objeto que mapeia os nomes dos estados
     *                                     para números inteiros. Os estados são:
     *                                     default, newEntry, adding e editing.
     */
    get _states() {
        return this.#states;
    };

    /* ---------------------------------------------------------------------------------------------------------------- */
    // PREPARAÇÃO DOS DADOS   

    /**@inheritdoc */
    async prepareData() {
        this.prepareCalendars();
    }

    /**
     * Prepara os dados dos Calendários manipulados pelo formulário.
     */
    prepareCalendars() {
        const calendars = uniforge.doc.calendars.toArray();
        this.data.calendars = calendars;
    }

    /* ---------------------------------------------------------------------------------------------------------------- */
    // INTERFACE DE USUÁRIO

    /**
     * @inheritdoc
    * Inicia a construção do formulário.
    */
    async initialize() {
        await super.initialize();

        // Atribui o estado padrão aos controles do formulário.
        this.controlStates(this.states.default);
    }
    /**
     * Habilita/desabilita os controles do formulário.
     * @param {Number} state - O novo estado do formulário.
     * @protected
     */
    controlStates(state, options = {}) {
        const infoSet = this.querySelector('fieldset.info-set');
        const weekSet = this.querySelector('fieldset.week-set');
        const monthSet = this.querySelector('fieldset.month-set');

        infoSet.disabled = false;
        weekSet.disabled = false;
        monthSet.disabled = false;

        switch (state) {
            // ESTADO DE HABILITAÇÃO DE NOVA ENTRADA. 
            // Ex.: Após a seleção de uma pasta.
            case this.states.newEntry: {
                infoSet.disabled = true;
                weekSet.disabled = true;
                monthSet.disabled = true;

                // Configuração dos Estados dos Botões.
                const saveButton = this.querySelector('#saveButton');
                const newEntryButton = this.querySelector('#newEntryButton');
                const cancelButton = this.querySelector('#cancelButton');

                saveButton.innerHTML = '<i class="fa-regular fa-floppy-disk"></i> Salvar';
                saveButton.classList.add('disabled');

                newEntryButton.classList.remove('disabled');

                cancelButton.classList.add('hidden');
            } break;
            // ESTADO DE ADIÇÃO DE ENTRADA.
            // Ex.: O usuário clicou em "Nova Entrada".
            case this.states.adding: {
                // Limpe o conteúdo do formulário.
                this.clearContent(false);
                // Está adicionando uma Entrada nova.
                this.isUpdate = false;

                // Foca no campo do Nome do Calendário.
                const calendarName = this.querySelector('#calendarName');
                calendarName.focus();

                // Configuração dos Estados dos Botões.
                const saveButton = this.querySelector('#saveButton');
                const cancelButton = this.querySelector('#cancelButton');

                // Configuração do label no botão de Salvar.
                saveButton.innerHTML = '<i class="fa-regular fa-floppy-disk"></i> Salvar';
                saveButton.classList.remove('disabled');

                // Exibe o botão de Cancelar.
                cancelButton.classList.remove('hidden');
            } break;
            // ESTADO DE EDIÇÃO DE ENTRADA.
            // Ex.: O usuário está editando uma Entrada já existente.
            case this.states.editing: {
                // Está atualizando uma Entrada pré-existente.
                this.isUpdate = true;

                // Foca no campo do Nome do Calendário.
                const calendarName = this.querySelector('#calendarName');
                calendarName.focus();

                // Configuração dos Estados dos Botões.
                const saveButton = this.querySelector('#saveButton');
                const cancelButton = this.querySelector('#cancelButton');

                // Configuração do label no botão de Salvar.
                saveButton.innerHTML = '<i class="fa-regular fa-floppy-disk"></i> Atualizar';
                saveButton.classList.remove('disabled');

                // Exibe o botão de Cancelar.
                cancelButton.classList.remove('hidden');
            } break;
            // ESTADO PADRÃO.
            // Estado exibido quando a tela é aberta ou quando uma ação é cancelada.
            default: {
                // Limpe o conteúdo do formulário.
                this.clearContent();

                infoSet.disabled = true;
                weekSet.disabled = true;
                monthSet.disabled = true;

                // -----------------------------------------------------------------------
                //    Configuração dos Estados dos Botões.
                // -----------------------------------------------------------------------
                const saveButton = this.querySelector('#saveButton');
                const cancelButton = this.querySelector('#cancelButton');

                // Configuração do label no botão de Salvar.
                saveButton.innerHTML = '<i class="fa-regular fa-floppy-disk"></i> Salvar';

                // Nesse estado, todos os botões estão desativados.
                saveButton.classList.add('disabled');
                cancelButton.classList.add('hidden');
            } break;
        }

        // Atualiza o estado atual do formulário.
        this.currentState = state;
    }
    /**
     * Recarrega os controles do formulário.
     * @protected
     */
    refreshStates() {
        const state = this.currentState;
        this.controlStates(state);
    }

    /** @inheritdoc */
    close() {
        // Habilita o botão de origem, caso exista.
        this.sourceBtn?.classList.remove('disabled');

        super.close();

        if (this.closeCallback) this.closeCallback();
    }

    /**
     * Fecha dialog aberto, se houver um.
     */
    closeDialog() {
        if (this.dialog) {
            this.dialog.close();
        }
    }

    /**
     * Cancela a edição atual, retornando o formulário ao estado padrão.
     * Isso fecha qualquer diálogo aberto e desativa todos os controles.
     * @protected
     */
    cancel() {
        this.controlStates(this.states.default);
    }

    /* ---------------------------------------------------------------------------------------------------------------- */
    // CONFIGURAÇÃO

    /**
     * Configura o conteúdo do formulário.
     * Sobrescreve a configuração na classe pai.
     * 
     * @async
     */
    async configureContent() {
        this.sliders.monthSize = new Slider('monthSizeSlider', this.form, { min: 1, max: 50, step: 1, value: 30, linkedLabel: 'monthSizeSpan', tooltip: 'Dias do Mês', width: '100%' });
        this.sliders.monthSize.config();
    }

    /**
     * Limpa o conteúdo do formulário
     * 
     * @param {boolean=true} disableFields - Desabilita os campos do formulário.
     */
    clearContent(disableFields = true) {
        const calendarNameInput = this.querySelector('#calendarName');
        const calendarPrefixInput = this.querySelector('#calendarPrefix');
        const calendarSuffixPreInput = this.querySelector('#calendarSuffixPre');
        const calendarSuffixPosInput = this.querySelector('#calendarSuffixPos');

        calendarNameInput.value = '';
        calendarPrefixInput.value = '';
        calendarSuffixPreInput.value = '';
        calendarSuffixPosInput.value = '';

        const weekDaysItems = this.querySelectorAll('.calendar-week-days .week-day-item');

        weekDaysItems.forEach(item => {
            const idx = Number(item.dataset.idx);

            const dayNameInput = this.querySelector(`#day${idx + 1}Name`);
            dayNameInput.value = '';
            const dayShortNameInput = this.querySelector(`#day${idx + 1}ShortName`);
            dayShortNameInput.value = '';
        });

        const monthsList = this.querySelector('#monthsList');
        monthsList.innerHTML = '';

        this._clearMonthData(disableFields);

        const calendarItems = this.querySelectorAll('.calendar-item');
        calendarItems.forEach(item => {
            item.classList.remove('selected');
        });

        const fieldsets = this.querySelectorAll('.calendar-manager fieldset');
        fieldsets.forEach(fieldset => fieldset.disabled = disableFields);
    }

    /**
     * Recarrega o conteúdo do formulário
     * 
     * @param {Calendar} calendar - O calendário atual a ser preservado durante o carregamento.
     */
    reloadContent(calendar) {
        this.clearContent(false);
        this._loadCalendarData(calendar);
    }

    /* ---------------------------------------------------------------------------------------------------------------- */
    // LISTENERS

    /**
    * Configura ouvintes de eventos básicos para o formulário.
    * @inheritdoc
    */
    activateListeners() {
        const cancelButton = this.querySelector('#cancelButton');
        const newEntryButton = this.querySelector('#newEntryButton');
        const saveButton = this.querySelector('#saveButton');

        const calendarsList = this.querySelector('#calendarsList');
        calendarsList.addEventListener('click', (event) => { this.onCalendarsListClick(event); });

        const calendarItems = this.querySelectorAll('.calendar-item');
        calendarItems.forEach(item => {
            item.addEventListener('click', (event) => { this.onCalendarItemClick(event); });

            const itemDeleteButton = item.querySelector('a.delete-button');
            itemDeleteButton.addEventListener('click', (event) => { this.onDeleteClick(event); });
        });

        const calendarNameInput = this.querySelector('#calendarName');
        calendarNameInput.addEventListener('input', (event) => { this.onDocumentChange(event); });

        const calendarPrefixInput = this.querySelector('#calendarPrefix');
        calendarPrefixInput.addEventListener('input', (event) => { this.onDocumentChange(event); });

        const calendarSuffixPreInput = this.querySelector('#calendarSuffixPre');
        calendarSuffixPreInput.addEventListener('input', (event) => { this.onDocumentChange(event); });
        const calendarSuffixPosInput = this.querySelector('#calendarSuffixPos');
        calendarSuffixPosInput.addEventListener('input', (event) => { this.onDocumentChange(event); });

        const weekDaysItems = this.querySelectorAll('.calendar-week-days .week-day-item');
        weekDaysItems.forEach(item => {
            const idx = Number(item.dataset.idx);
            const dayNameInput = this.querySelector(`#day${idx + 1}Name`);
            dayNameInput.addEventListener('input', (event) => { this.onDocumentChange(event); });
            const dayShortNameInput = this.querySelector(`#day${idx + 1}ShortName`);
            dayShortNameInput.addEventListener('input', (event) => { this.onDocumentChange(event); });
        });

        const monthNameInput = this.querySelector('#monthName');
        monthNameInput.addEventListener('input', (event) => { this.onDocumentChange(event); });

        this.sliders.monthSize.addEventListener('change', (event) => { this.onDocumentChange(event); });

        const addMonthButton = this.querySelector('#addMonthButton');
        addMonthButton.addEventListener('click', (event) => { this.onAddMonthClick(event); });

        const saveMonthButton = this.querySelector('#saveMonthButton');
        //saveMonthButton.addEventListener('click', (event) => { this.onSaveMonthClick(event); });

        cancelButton.addEventListener('click', (event) => { this.onCancelClick(event); });
        newEntryButton.addEventListener('click', (event) => { this.onNewClick(event); });
        saveButton.addEventListener('click', (event) => { this.onSaveClick(event); });
    }

    onDocumentChange(event) {
        event.stopPropagation();

        const calendarNameInput = this.querySelector('#calendarName');
        this.calendar.label = calendarNameInput.value || calendarNameInput.placeholder;

        const calendarPrefixInput = this.querySelector('#calendarPrefix');
        this.calendar.prefix = calendarPrefixInput.value || calendarPrefixInput.placeholder;

        const calendarSuffixPreInput = this.querySelector('#calendarSuffixPre');
        const calendarSuffixPosInput = this.querySelector('#calendarSuffixPos');
        this.calendar.suffix = `${calendarSuffixPreInput.value || calendarSuffixPreInput.placeholder}|${calendarSuffixPosInput.value || calendarSuffixPosInput.placeholder}`;

        let idx = 0;
        const weekDaysItems = this.querySelectorAll('.calendar-week-days .week-day-item');
        weekDaysItems.forEach(item => {
            const cldid = Number(item.dataset.cldid ?? (idx + 1));
            const dayNameInput = this.querySelector(`#day${idx + 1}Name`);
            const dayShortNameInput = this.querySelector(`#day${idx + 1}ShortName`);

            const days = this.calendar.days.toArray();
            // O Dia da semana ainda não existe, então cria um novo objeto CalendarDays.
            if (!days[idx]) {
                const dayData = new CalendarDays({
                    cldid: cldid, // ID Provisório.
                    clid: this.calendar.clid,
                    label: dayShortNameInput.value || dayShortNameInput.placeholder,
                    name: dayNameInput.value || dayNameInput.placeholder
                });

                // Adiciona o novo dia da semana ao calendário.
                this.calendar.days.add(dayData);
            }
            else {
                // Atualiza o dia da semana existente.
                this.calendar.days.get(cldid).label = dayShortNameInput.value || dayShortNameInput.placeholder;
                this.calendar.days.get(cldid).name = dayNameInput.value || dayNameInput.placeholder;
            }

            idx++;
        });

        // Se há um mês selecionado, processe-o.
        if (this.month) {
            const monthNameInput = this.querySelector('#monthName');
            this.month.label = monthNameInput.value || monthNameInput.placeholder;

            this.month.size = this.sliders.monthSize.value;

            const monthSizeSpan = this.querySelector(`.month-item.selected[data-clmid="${this.month.clmid}"] .data-group span.size`);
            monthSizeSpan.textContent = this.month.size;

            // É um mês já existente, marque-o como modificado.
            if (this.month.clmid > 0 && !this.month.dbAction) this.month.data.dbAction = 'u';
        }
    }

    /**
     * Configura o evento de clique em uma lista de calendários.
     * @param {Event} event 
     */
    onCalendarsListClick(event) {
        event.stopPropagation();
        const target = event.target;

        if (!target.classList.contains('calendar-item')) {
            this.controlStates(this.states.default);
        }
    }

    /**
     * Configura o evento de seleção de um calendário.
     * @param {Event} event 
     */
    onCalendarItemClick(event) {
        event.stopPropagation();
        this.controlStates(this.states.editing);
        const item = event.target.closest('.calendar-item');
        const calendarId = Number(item.dataset.value);
        const calendar = uniforge.doc.calendars.get(calendarId);

        const selectedItem = this.querySelector('.calendar-item.selected');
        if (selectedItem) selectedItem.classList.remove('selected');

        item.classList.add('selected');

        this._loadCalendarData(calendar);
    }

    /**
     * Configura o evento de clique em um mês do calendário selecionado.
     * @param {Event} event 
     */
    onMonthItemClick(event) {
        event.stopPropagation();
        const item = event.target.closest('.month-item');
        const clmid = Number(item.dataset.clmid);
        const month = this.calendar.months.get(clmid);

        const isDeselect = item.classList.contains('selected');

        this._clearMonthData(!isDeselect);

        if (!isDeselect) {
            item.classList.toggle('selected');

            const deleteButton = item.querySelector('a.delete-button');
            deleteButton.classList.remove('hidden');

            this._loadMonthData(month);
        } else {
            this.selection.month = null;
            this.reloadContent(this.calendar);
        }
    }

    /**
     * Configura o evento de adicionar um novo mês ao calendário selecionado.
     * @param {Event} event 
     */
    onAddMonthClick(event) {
        event.stopPropagation();
        const monthName = this.querySelector('#monthName')?.value || '';

        if (!monthName || monthName.isEmpty()) {
            this.msgBox.showWarning('O nome do mês não pode ser vazio.');
            return;
        }

        const addMonthButton = this.querySelector('#addMonthButton');
        const clmid = Number(addMonthButton.dataset.clmid ?? 0);

        const calendar = this.calendar;
        const data = {
            clid: calendar.clid,
            clmid: clmid || (calendar.months.size + 1) * (-1), // Id Provisório.
            label: monthName,
            size: this.sliders.monthSize.value
        };

        if (this.currentState === this.states.editing) {
            data.dbAction = data.clmid > 0 ? 'u' : 'i';
        }

        calendar.months.add(new CalendarMonths(data));
        this.reloadContent(calendar);
    }

    /**
     * Configura o evento de salva alterações em um mês ao calendário selecionado.
     * @param {Event} event 
     */
    onSaveMonthClick(event) {
        event.stopPropagation();
        const addMonthButton = this.querySelector('#addMonthButton');
        const clmid = Number(addMonthButton.dataset.clmid);

        const monthName = this.querySelector('#monthName')?.value || '';

        this.calendar.months.get(clmid).label = monthName;
        this.calendar.months.get(clmid).size = this.sliders.monthSize.value;
        this.calendar.months.get(clmid).data.dbAction = 'u';

        this.reloadContent(calendar);
    }

    /**
     * Configura o evento de clique para remover um mês do calendário selecionado.
     * @param {Event} event 
     */
    onDeleteMonthClick(event) {
        event.stopPropagation();
        const item = event.target.closest('.month-item');
        const clmid = Number(item.dataset.clmid);

        if (this.isUpdate) {
            this.calendar.months.get(clmid).data.dbAction = 'd';
        } else {
            this.calendar.months.delete(clmid);
        }

        this.selection.month = null;

        this.reloadContent(this.calendar);
    }

    /**
    * Trata o evento de cancelamento de um novo item.
    * @param {Event} event - Evento de clique no botão de Cancelar.
    */
    onCancelClick(event) {
        event.stopPropagation();

        this.cancel();
    }

    /**
     * Trata o evento de criação de um novo item qualquer.
     * @param {Event} event - Evento de clique no botão de Nova Entrada.
     */
    async onNewClick(event) {
        event.stopPropagation();

        this.selection.calendar = new Calendar({
            months: new Set(),
            days: new Set(),
        });

        // Atualiza o estado do formulário.
        this.controlStates(this.states.adding);
    }

    /**
      * Trata o evento de registro de uma nova entrada.
      * @param {Event} event - Evento de clique no botão de Salvar.
      */
    async onSaveClick(event) {
        event.stopPropagation();

        const calendar = this.calendar;

        try {
            const title = (this.isUpdate ? 'Atualizar' : 'Registrar');
            let dialogMessage = `Deseja ${title.toLowerCase()} o calendário?`;

            let data = {
                clid: calendar.clid,
                label: calendar.label,
                prefix: calendar.prefix,
                suffix: calendar.suffix,
                days: [...calendar.days],
                months: [...calendar.months]
            };

            if (await Dialogs.confirm(title, dialogMessage)) {
                // Inicia a transação de salvamento.
                await uniforge.db.beginTransaction();

                // Verifica se o item já existe no banco de dados.
                if (this.isUpdate) {

                    await this.db.updateCalendar(data);

                    for (const day of data.days) {
                        await this.db.updateCalendarDays(day);
                    }

                    for (const month of data.months) {
                        if (month.data.dbAction == 'i') {
                            await this.db.addCalendarMonths(month);
                        } else if (month.data.dbAction == 'u') {
                            await this.db.updateCalendarMonths(month);
                        } else if (month.data.dbAction == 'd') {
                            await this.db.deleteCalendarMonth(month.clmid);
                        }
                    }

                    this.msgBox.showInfo('Calendário atualizado com sucesso.');
                }
                else {

                    await this.db.addCalendar(data);

                    for (const day of data.days) {
                        await this.db.addCalendarDays(day);
                    }

                    for (const month of data.months) {
                        await uniforge.db.addCalendarMonths(month);
                    }

                    this.msgBox.showInfo('Calendário criado com sucesso.');
                }

                // Finaliza a transação de salvamento.
                await uniforge.db.commitTransaction();
                await this.refresh();
            }
        } catch (error) {
            this.msgBox.showError(error.message, error);

            // Faz rollback em caso de erro no processo de salvamento.
            await uniforge.db.rollbackTransaction(error);
        }
    }

    /**
     * Remove uma entrada de uma categoria da lista.
     * @param {Event} event - Evento de clique no botão para excluir a entrada.
     */
    async onDeleteClick(event) {
        event.stopPropagation();
        const clid = event.target.closest('.calendar-item').dataset.value;

        if (await Dialogs.confirm("Remover", "Deseja remover o calendário?")) {
            await this.db.deleteCalendar(clid);

            this.msgBox.showInfo('Calendário removido com sucesso.');
            await this.refresh();
        }
    }

    /**
   * Rotina para tratamento do tooltip de confirmação de remoção.
   * @param {Event} event - Evento de clique no ícone de exclusão.
   * @param {HTMLElement} item - O item da pasta a ser excluído.
   */
    onOpenDialogClick(event, item) {
        event.stopPropagation();
    }

    /**
     * Rotina para tratamento do tooltip de confirmação de remoção.
     * @param {Event} event - Evento de clique no ícone de exclusão.
     */
    onCancelSidebarDialogClick(event) {
        event.stopPropagation();

        this._hideDialog();
        this.controlStates(this.states.default);
    }

    /* ---------------------------------------------------------------------------------------------------------------- */
    // FUNÇÕES INTERNAS   

    _loadCalendarData(calendar) {
        const calendarNameInput = this.querySelector('#calendarName');
        const calendarPrefixInput = this.querySelector('#calendarPrefix');
        const calendarSuffixPreInput = this.querySelector('#calendarSuffixPre');
        const calendarSuffixPosInput = this.querySelector('#calendarSuffixPos');

        calendarNameInput.value = calendar.label;
        calendarPrefixInput.value = calendar.prefix ?? '';

        if (calendar.suffix && !calendar.suffix.isEmpty()) {
            const suffix = calendar.suffix.split('|');
            if (suffix.length === 2) {
                calendarSuffixPreInput.value = suffix[0];
                calendarSuffixPosInput.value = suffix[1];
            } else throw new Error('O sufixo do calendário deve possuir apenas 2 elementos.');
        }

        const weekDays = calendar.days.toArray();
        const weekDaysItems = this.querySelectorAll('.calendar-week-days .week-day-item');

        for (let item of weekDaysItems) {
            const idx = Number(item.dataset.idx);
            if (!weekDays[idx]) continue;

            const dayNameInput = this.querySelector(`#day${idx + 1}Name`);
            dayNameInput.value = weekDays[idx].name;
            const dayShortNameInput = this.querySelector(`#day${idx + 1}ShortName`);
            dayShortNameInput.value = weekDays[idx].label;

            item.dataset.cldid = weekDays[idx].cldid;
        };

        const monthsList = this.querySelector('#monthsList');
        const months = calendar.months.toArray();
        months.forEach(month => {
            if (month.data.dbAction !== 'd') {
                const element = document.createElement('li');
                element.classList.add('item', 'month-item');
                element.dataset.clmid = month.clmid;

                const dataGroup = document.createElement('div');
                dataGroup.classList.add('data-complex', 'flexrow');

                const nameSpan = document.createElement('span');
                nameSpan.classList.add('data-label', 'flex-1');
                nameSpan.textContent = month.label;

                const deleteButton = document.createElement('a');
                deleteButton.classList.add('delete-button', 'flexrow', 'hidden');
                deleteButton.dataset.tooltip = "Excluir Mês";
                deleteButton.innerHTML = `<i class="fas fa-trash"></i>`;

                const sizeGroup = document.createElement('div');
                sizeGroup.classList.add('data-group', 'flexcol');

                const sizeSpan = document.createElement('span');
                sizeSpan.classList.add('data-value', 'size');
                sizeSpan.textContent = month.size;

                const daysLabel = document.createElement('span');
                daysLabel.classList.add('days-label');
                daysLabel.textContent = 'Dias';

                sizeGroup.appendChild(sizeSpan);
                sizeGroup.appendChild(daysLabel);

                dataGroup.appendChild(nameSpan);
                dataGroup.appendChild(deleteButton);
                dataGroup.appendChild(sizeGroup);

                element.appendChild(dataGroup);
                monthsList.appendChild(element);

                element.dataset.clmid = month.clmid;

                element.addEventListener('click', (event) => { this.onMonthItemClick(event); });
                deleteButton.addEventListener('click', (event) => { this.onDeleteMonthClick(event); });
            }
        });

        const addMonthButton = this.querySelector('#addMonthButton');
        addMonthButton.classList.remove('disabled');

        const saveButton = this.querySelector('#saveButton');
        saveButton.classList.remove('disabled');

        this.selection.calendar = calendar;

        const fieldsets = this.querySelectorAll('.calendar-manager fieldset');
        fieldsets.forEach(fieldset => fieldset.disabled = false);
    }

    _loadMonthData(month) {
        this.selection.month = month;

        const monthNameInput = this.querySelector('#monthName');
        monthNameInput.value = month.label;

        this.sliders.monthSize.setValue(month.size);

        const addMonthButton = this.querySelector('#addMonthButton');
        addMonthButton.dataset.clmid = month.clmid;
    }
    _clearMonthData(disableButton = true) {
        const monthItems = this.querySelectorAll('.month-item');
        monthItems.forEach(item => {
            item.classList.remove('selected')

            const deleteButton = item.querySelector('a.delete-button');
            deleteButton.classList.add('hidden');
        });

        const monthNameInput = this.querySelector('#monthName');
        monthNameInput.value = '';

        this.sliders.monthSize.setValue(30, false);

        const addMonthButton = this.querySelector('#addMonthButton');
        delete addMonthButton.dataset.clmid;

        if (disableButton) addMonthButton.classList.add('disabled');
        else addMonthButton.classList.remove('disabled');
    }

    /**
     * Exibe um diálogo de confirmação com uma mensagem.
     * @private
     * @param {string} message - Mensagem a ser exibida no diálogo.
     */
    _showDialog(message) {
        const text = this.ui.dialog.querySelector('#confirmation-message');
        text.innerHTML = message;
        this.ui.dialog.classList.remove('hidden');
    }

    /**
     * Oculta o diálogo de confirmação.
     * @private
     */
    _hideDialog() {
        this.ui.dialog.classList.add('hidden');
    }
}