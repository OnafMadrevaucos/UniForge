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

        /**
        * O Evento possui uma Entrada vinculada a ele? (false por padrão)
        * @type {boolean}
        */
        this.hasEntry = false;
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
        super.controlStates(state, {ignoreEditor: true});
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
                const relevanceSelect = this.querySelector('#relevance');
                relevanceSelect.selectedIndex = 0;

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
        entryTypeSelect.value = 1;

        const relevanceSelect = this.querySelector('#relevance');
        relevanceSelect.value = 1;

        const calendarTypeSelect = this.querySelector('#calendarType');
        calendarTypeSelect.value = 1;

        this.configureDatePickers();
        this._toggleEntryInfo();
        this._clearEntryData();
    }

    /**
     * Inicializa e configura o editor TinyMCE.
     * Remove qualquer instância existente antes de reconfigurar.
     * @private
     */
    async configureTinyMCE() {
        if (tinymce.get('mainEditor')) {
            tinymce.remove('#mainEditor');
        }

        const options = uniforge.utils.mergeObjects(uniforge.tinymceOptions.readonly, {
            selector: 'textarea#mainEditor',
            noneditable_class: 'non-editable',
            init_instance_callback: (editor) => {
                editor.setContent(""); // Garante que o editor seja iniciado vazio.
            }
        });

        await tinymce.init(options);
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

        this.datePickers.start.selectFullDate(event.s_day, event.s_month, event.s_year);
        if (event.e_day)
            this.datePickers.end.selectFullDate(event.e_day, event.e_month, event.e_year);
    }

    /* ---------------------------------------------------------------------------------------------------------------- */
    // LISTENERS
    /**
    * Configura ouvintes de eventos básicos para o formulário.
    * @inheritdoc
    */
    activateListeners() {
        super.activateListeners();

        const entryButton = this.querySelector('#entryButton');
        entryButton.addEventListener('click', (event) => { this.onEntryButtonClick(event); });

        const removeEntryButton = this.querySelector('#removeEntryButton');
        removeEntryButton.addEventListener('click', (event) => { this.onRemoveEntryClick(event); });

        const calendarType = this.querySelector('#calendarType');
        calendarType.addEventListener('change', (event) => { this.onDateTypeChange(event); });
    }

    /**@inheritdoc */
    onDeleteSwitchChange(event) {
        super.onDeleteSwitchChange(event);

        const removeEntryButton = this.querySelector('#removeEntryButton');
        removeEntryButton.hidden = !event.target.checked;
    }

    /**
       * Manipulador de evento para alternar a visibilidade do grupo de eventos e da informa o de data.
       * @param {Event} event - Evento de clique no bot o de Eventos.
       * @fires
       */
    async onEntryButtonClick(event) {
        // Impede que o clique no item desencadeie o clique fora do sidebar.
        event.stopPropagation();

        const eid = await EntrySearchDialog.configDialog();

        // Alterna a visibilidade do grupo de eventos.
        this._toggleEntryInfo(eid);
    }

    /**
     * Manipulador de evento para retirar um evento de uma entrada.
     * @param {Event} event - Evento de clique no bot o de Remover Evento.
     * @fires
     */
    async onRemoveEntryClick(event) {
        event.stopPropagation();

        // Confirma a desvinculação da Entrada ao Evento.
        if (await Dialogs.confirm('Desvincular Entrada', 'Deseja desvincular a entrada do evento?')) {

            // Alternar a visibilidade do grupo de eventos.
            this._toggleEntryInfo();

            // Limpar os dados da Entrada desvinculada.
            this._clearEntryData();

            // A Entrada será retirada.
            this.hasEntry = false;
        }
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
        const entryInfo = this.querySelector('#entryInfo');

        const entryType = this.querySelector('#entryType');
        const relevance = this.querySelector('#relevance');
        const calendarType = this.querySelector('#calendarType');

        uniforge.utils.mergeObjects(data, {
            etid: entryType.value,
            sid: headerInfo.dataset.sid,
            relevance: relevance.value,
            clid: calendarType.value,
            source: entryInfo.dataset.eid ?? null,
            flavor: tinymce.get('flavorEditor').getContent() ?? '',
            htmlString: tinymce.get('mainEditor').getContent() ?? '',
            date: {
                start: this.datePickers.start.selectedDate,
                end: this.datePickers.end.selectedDate
            },
            text: ''
        });

        const validate = uniforge.db.validateHistory(data);
        if (validate !== '') {
            this.msgBox.showWarning(validate);
            return false;
        }

        if (isUpdate) {
            data.evid = options.id;

            await uniforge.db.updateEvent(data);
            this.msgBox.showInfo('Evento atualizado com sucesso.');
        }
        else {
            const result = await uniforge.db.addEvent(data);
            this.msgBox.showInfo('Evento criado com sucesso.');
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
    }
    /**
    * Gerencia cliques duplos em itens de evento.
    * @inheritdoc
    * @param {MouseEvent} event - O evento de clique duplo.
    */
    async onEntryItemDoubleClick(mouseEvent) {
        await super.onEntryItemDoubleClick(mouseEvent, {
            type: 'events'
        });
        const event = this.data.entry;

        if (event) {
            this.reconfigureDatePickers(event);
            const headerInfo = this.querySelector('.header-info');
            headerInfo.dataset.evid = event.evid;

            const entryType = this.querySelector('#entryType');
            const calendarType = this.querySelector('#calendarType');
            const relevance = this.querySelector('#relevance');

            entryType.value = Number(event.etid);
            calendarType.value = Number(event.clid);
            relevance.value = Number(event.relevance);
            tinymce.get('flavorEditor').setContent(event.flavor);

            // Se o evento tem uma entrada vinculada, carregue os dados da Entrada.
            await this._toggleEntryInfo(event.source);

        } else {
            this.msgBox.showWarning('Erro ao carregar o evento.');
        }
    }

    /**
   * Alterna a visibilidade das informações da Entrada vinculada.
   * @protected
   */
    async _toggleEntryInfo(eid) {
        // Selecionar o grupo de Eventos.
        const entryInfo = this.querySelector('#entryInfo');
        // Selecionar o botão de Gerar Evento.
        const entryButton = this.querySelector('#entryButton');

        const entry = uniforge.doc.entries.get(eid);

        // Se a Entrada (Source) existe, carregue os dados da entrada.
        if (entry) {
            entryInfo.dataset.eid = entry.eid;

            await this._loadEntryData(entry);

            this.hasEntry = true;

            // Alterar a visibilidade do botão de Gerar Evento.
            entryButton.classList.add('hidden');

            // Alternar a visibilidade das informações do Evento.
            entryInfo.classList.remove('hidden');
        } else {
            this.hasEntry = false;

            // Alterar a visibilidade do botão de Gerar Evento.
            entryButton.classList.remove('hidden');

            // Alternar a visibilidade das informações do Evento.
            entryInfo.classList.add('hidden');
        }
    }

    async _loadEntryData(entry) {
        const imageDisplayer = this.querySelector('#imageDisplayer');
        imageDisplayer.classList.remove('hidden');

        const displayedImage = this.querySelector('#displayedImage');

        const imageUrl = await uniforge.utils.blobToImage(entry.img, entry.ext);

        displayedImage.dataset.ext = entry.ext;
        displayedImage.src = imageUrl;
        displayedImage.classList.remove('empty');        

        const mainEditor = tinymce.get('mainEditor');
        mainEditor.setContent(entry.htmlString);

        const entryTitle = this.querySelector('#entryTitle');
        entryTitle.textContent = entry.title;
    }

    async _clearEntryData() {
        // Selecionar o grupo de Eventos.
        const entryInfo = this.querySelector('#entryInfo');
        delete entryInfo.dataset.eid;

        const imageDisplayer = this.querySelector('#imageDisplayer');
        imageDisplayer.classList.add('hidden');

        this.clearImage();

        tinymce.get('mainEditor').setContent('');
    }
}