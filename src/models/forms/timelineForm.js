import CustomDate from "../../common/primitives/date.mjs";
import { TimelineManager } from "../../scripts/managers/timelineManager.js";
import SidebarForm from "./sidebarForm.js";

export default class TimelineForm extends SidebarForm {
    constructor() {
        super('Linha do Tempo');

        /**
        * @type {string} - Define o tipo do formulário.
        */
        this.type = 'timeline';

        /**
        * @type {string} - O modelo HTML utilizado pelo formulário.
        */
        this.template = 'timelineForm'; // Define o template do formulário. 

        /**
        * @type {TimelineManager} - O gerenciador de exibição da Timeline.
        */
        this.manager = new TimelineManager(this);

        this.currentState = this.#states.default; // Estado atual do formulário.
    }

    #states = {
        default: -1,
        newTimeline: 0,
        editTimeline: 1
    }

    /**
     * @overload
     * @inheritdoc
    */
    get defaultOptions() {
        const config = super.defaultOptions;
        return uniforge.utils.mergeObjects(config, {
            classes: [...config.classes, 'fullscreen']
        });
    }

    get states() {
        return this.#states;
    }

    /**
    * Obtém as categorias disponíveis para o formulário no banco de dados.
    * @returns {Object} - Categorias.
    */
    async prepareData() {
        super.prepareData();

        // Obtém todos os Eventos registrados.
        this.data.events = uniforge.doc.events.toObject();

        return this.data;
    }

    /**@inheritdoc */
    prepareFolders(data) {
        const folders = uniforge.doc.timelines.toObject();
        data.folders = folders.sort();
    }

    clearContent(clearSidebar = true) {
        if (clearSidebar) super.clearContent();

        const manageTimelineButton = this.querySelector('#manageTimelineButton');
        manageTimelineButton.classList.add('disabled');

        this.manager.clear();
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

    controlStates(state) {
        const newButton = this.querySelector('#newTimelineButton');
        const manageButton = this.querySelector('#manageTimelineButton');

        const forge = this.querySelector('#timelineForge');

        switch (state) {
            // ESTADO DE HABILITAÇÃO DE NOVA ENTRADA.
            case this.states.newTimeline: {
                forge.classList.add('active');

                manageButton.innerHTML = '<i class="fa-solid fa-check"></i>';
                manageButton.classList.add('active');
                manageButton.classList.remove('disabled');
                manageButton.setAttribute('data-tooltip', 'Salvar');

                newButton.innerHTML = '<i class="fa-solid fa-xmark"></i>';
                newButton.setAttribute('data-tooltip', 'Cancelar');
                newButton.classList.add('cancel');

            } break;
            // ESTADO DE EDIÇÃO DE ENTRADA.
            case this.states.editTimeline: {
                forge.classList.add('active');

                manageButton.innerHTML = '<i class="fa-solid fa-check"></i>';
                manageButton.setAttribute('data-tooltip', 'Salvar');
                manageButton.classList.remove('disabled');
                manageButton.classList.add('active');

                newButton.innerHTML = '<i class="fa-solid fa-xmark"></i>';
                newButton.setAttribute('data-tooltip', 'Cancelar');
                newButton.classList.add('cancel');

            } break;
            // ESTADO PADRÃO.
            default: {
                forge.classList.remove('active');
                const titleInput = forge.querySelector('#titleInput');
                titleInput.value = '';

                manageButton.innerHTML = '<i class="fas fa-pen-to-square"></i>';
                manageButton.setAttribute('data-tooltip', 'Gerenciar Linha do Tempo');
                manageButton.classList.remove('active');

                // Se não houver eventos na linha do tempo, o botão de gerenciar deve ser desativado.
                if (this.manager.timeline.events.length === 0)
                    manageButton.classList.add('disabled');

                newButton.innerHTML = '<i class="fa-solid fa-calendar-plus"></i>';
                newButton.setAttribute('data-tooltip', 'Nova Linha do Tempo');
                newButton.classList.remove('cancel');

                this.clearContent();
            } break;
        }

        // Atualiza o estado atual do formulário.
        this.currentState = state;
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
        await super.configureContent();

        // Configura o editor TinyMCE de floreio da entrada do formulário.
        await this.configureFlavorTinyMCE();

        // Configura o editor TinyMCE de floreio dos eventos associados à entrada do formulário.
        await this.configureEventFlavorTinyMCE();
    }

    /**
    * Configura o editor TinyMCE para o texto de floreio da Linha do Tempo.
    */
    async configureFlavorTinyMCE() {
        if (tinymce.get('flavorEditor')) {
            tinymce.remove('#flavorEditor');
        }

        const options = uniforge.utils.mergeObjects(uniforge.tinymceOptions.simple, {
            selector: 'div#flavorEditor',
            placeholder: "Descrição da linha do tempo...",
            init_instance_callback: (editor) => {
                editor.setContent(""); // Garante que o editor seja iniciado vazio.
            },
            setup: (editor) => { this._setupInlineTinyMCE(editor); }
        });

        await tinymce.init(options);
    }

    /**
    * Configura o editor TinyMCE para o texto de floreio dos Eventos da Linha do Tempo.
    */
    async configureEventFlavorTinyMCE() {
        if (tinymce.get('eventFlavorEditor')) {
            tinymce.remove('#eventFlavorEditor');
        }

        const options = uniforge.utils.mergeObjects(uniforge.tinymceOptions.readonly, {
            selector: 'div#eventFlavorEditor',
            placeholder: "Descrição do evento...",
            init_instance_callback: (editor) => {
                editor.setContent(""); // Garante que o editor seja iniciado vazio.
            }
        });

        await tinymce.init(options);
    }
    /* ---------------------------------------------------------------------------------------------------------------- */
    // LISTENERS
    /**
     * Configura ouvintes de eventos básicos para o formulário.
     * @inheritdoc
     */
    activateListeners() {
        super.activateListeners();

        const newTimelineButton = this.querySelector('#newTimelineButton');
        newTimelineButton.addEventListener('click', (event) => { this.onNewTimelineForgeClick(event); });

        const manageTimelineButton = this.querySelector('#manageTimelineButton');
        manageTimelineButton.addEventListener('click', (event) => { this.onManageTimelineClick(event); });

        const eventList = this.querySelector('#eventList');
        const eventItens = eventList.querySelectorAll('.item');

        eventItens.forEach(item => {
            item.addEventListener('click', (event) => { this.onEventClick(event); });
            item.addEventListener('dblclick', (event) => { this.onEventDoubleClick(event); });
        });
    }

    /**
     * Gerencia o clique no botão de criar nova linha do tempo.
     * Alterna entre o estado de criação e o estado de edição da linha do tempo.
     * @param {MouseEvent} event - O evento de clique.
     */
    onNewTimelineForgeClick(event) {
        event.stopPropagation();

        if (this.currentState === this.states.default) {
            this.controlStates(this.states.newTimeline);
        } else {
            this.manager.clear();
            this.controlStates(this.states.default);
        }
    }

    /**
     * Gerencia o clique no botão de gerenciar linha do tempo.
     * Alterna entre o estado de edição e o estado de criação da linha do tempo.
     * @param {MouseEvent} event - O evento de clique.
     */
    onManageTimelineClick(event) {
        event.stopPropagation();

        if (this.currentState === this.states.default) {
            const folder = this.selection.folder;
            const titleSpan = folder.querySelector('span');
            const title = titleSpan.innerText;

            const forge = this.querySelector('#timelineForge');
            const titleInput = forge.querySelector('#titleInput');
            titleInput.value = title;

            this.controlStates(this.states.editTimeline);
        } else {
            this.manager.timeline.title = titleInput.value;

            if(this.manager.isNewTimeline)
                this.manager.save();
            else 
                this.manager.update();

            this.controlStates(this.states.default);
        }
    }

    onEventClick(event) {
        event.stopPropagation();
        const item = event.target.closest('.item');
        const eventId = item.dataset.value;
        const eventData = uniforge.doc.events.get(eventId);

        const eventTitle = this.querySelector('#eventTitle');
        const eventEntryType = this.querySelector('#eventEntryType');
        const eventRelevance = this.querySelector('#relevance');
        const eventCalendarType = this.querySelector('#calendarType');
        const eventStartDate = this.querySelector('#startDate');
        const eventEndDate = this.querySelector('#endDate');

        eventTitle.value = eventData.title;

        const entryType = uniforge.doc.entryTypes.get(eventData.etid);
        eventEntryType.value = entryType.title;

        const relevance = uniforge.doc.relevances.get(eventData.relevance);
        eventRelevance.value = relevance.title;

        const calendar = uniforge.doc.calendars.get(eventData.clid);
        eventCalendarType.value = calendar.label;

        const startDate = new CustomDate(calendar, { day: eventData.s_day, month: eventData.s_month, year: eventData.s_year });
        const endDate = eventData.e_day ? new CustomDate(calendar, { day: eventData.e_day, month: eventData.e_month, year: eventData.e_year }) : null;

        eventStartDate.value = startDate.toString('MMn DD, YYYYs');
        eventEndDate.value = endDate ? endDate.toString('MMn DD, YYYYs') : '\u2014';

        tinymce.get('eventFlavorEditor').setContent(eventData.flavor);
    }

    onEventDoubleClick(event) {
        event.stopPropagation();
        const item = event.target.closest('.item');
        const content = item.querySelector('.item-content');
        item.classList.toggle('checked');

        if (item.classList.contains('checked')) {
            //'<i class="fa-solid fa-calendar-check"></i>'
            const checkedIcon = document.createElement('i');
            checkedIcon.classList.add('fa-solid', 'fa-calendar-check', 'icon');

            const eventData = uniforge.doc.events.get(item.dataset.value);
            this.manager.addEvent(eventData);

            content.appendChild(checkedIcon);
        } else {
            const checkedIcon = content.querySelector('.icon');
            checkedIcon.remove();

            const event = uniforge.doc.events.get(item.dataset.value);
            this.manager.removeEvent(event);
        }
    }

    /**@inheritdoc */
    onFolderClick(event) {
        super.onFolderClick(event);
        this.controlStates(this.states.default);
    }

    /**@inheritdoc */
    onFolderDoubleClick(event) {
        super.onFolderDoubleClick(event);
        const folder = event.target.closest('.folder');
        const timelineId = folder.dataset.id;
        const timeline = uniforge.doc.timelines.get(timelineId);

        if (this.selection.folder) {
            const manageTimelineButton = this.querySelector('#manageTimelineButton');
            manageTimelineButton.classList.remove('disabled');
        }

        this.manager.loadTimeline(timeline);
    }

    /**
     * Gerencia cliques duplos em itens de entrada.
     * @param {MouseEvent} event - O evento de clique duplo.
     * @protected
    
    async onEntryItemDoubleClick(event) {
        super.onEntryItemDoubleClick(event);
        // Obter a entrada clicada.
        const entry = event.target.closest('.entry-item');
        const entryId = entry.dataset.id;
        const data = await uniforge.db.getEntryWithIcon(entryId);

        this.manager.getEntry(data).addTo('entryContainer', false);
    }
    */

    onSearchButtonClick(event) {
        // Impedir que o clique no item desencadeie o clique fora do sidebar
        event.stopPropagation();

        console.log('*CLICK*')
    }

    /*
    onEntryItemClick(event){
        // Impedir que o clique no item desencadeie o clique fora do sidebar
        event.stopPropagation();

        const folderList = this.form.querySelectorAll('#folderList .list-item');
        const item = event.target;
      
        // Remover a classe 'selected' de todos os itens
        folderList.forEach(i => {
          i.classList.remove('selected')
          const folderIcon = i.querySelector('.fas');
          folderIcon.classList.remove(...folderIcon.classList);
          folderIcon.classList.add('fas', 'fa-folder');
        });
            
        // Adicionar a classe 'selected' ao item clicado
        item.classList.add('selected');
        const folderIcon = item.querySelector('.fas');
        folderIcon.classList.remove(...folderIcon.classList);
        folderIcon.classList.add('fas', 'fa-folder-open');
    }
    onSearchButtonClick(event) { 
        // Impedir que o clique no item desencadeie o clique fora do sidebar
        event.stopPropagation();
        
        console.log('*CLICK*')
    }*/
    /* ---------------------------------------------------------------------------------------------------------------- */
    // UTILITÁRIOS
    /** */
    _timeForgeControl(state, buttonA, buttonB) {
        const forge = this.querySelector('#timelineForge');

        switch (state) {
            case 'start': {
                forge.classList.add('active');

                buttonA.innerHTML = '<i class="fa-solid fa-check"></i>';
                buttonB.innerHTML = '<i class="fa-solid fa-xmark"></i>';

                buttonB.classList.remove('active');
                buttonB.classList.add('cancel');
            } break;
            case 'cancel': {
                forge.classList.remove('active');

                buttonA.classList.remove('active');
                buttonA.classList.remove('cancel');

                buttonB.classList.remove('active');
            } break;
            case 'end': {
                forge.classList.remove('active');

                buttonA.classList.remove('active');
                buttonB.classList.remove('cancel');
            } break;
            default: {
                forge.classList.remove('active');

                buttonB.classList.remove('cancel');
            } break;
        }
    }
    /**
   * Configura o editor TinyMCE com funcionalidades inline.
   * @protected
   * @param {Object} editor - Instância do editor TinyMCE.
   */
    _setupInlineTinyMCE(editor) {
        // Número máximo de caractéres do editor Tiny MCE de floreio.
        const maxCharacters = 1024;

        // Sobrescreve o método setContent para limitar o conteúdo
        const originalSetContent = editor.setContent;

        editor.setContent = function (content, ...args) {
            if (editor.selection) {
                // Salva a posição atual do cursor
                const bookmark = editor.selection.getBookmark(2);

                const plainTextContent = editor.dom.create('div', null, content).innerText; // Remove tags HTML
                if (plainTextContent.length > maxCharacters) {
                    const truncatedText = plainTextContent.substring(0, maxCharacters);
                    const truncatedHtml = editor.dom.create('div', null, truncatedText).innerHTML;
                    originalSetContent.call(editor, truncatedHtml, ...args);
                } else {
                    originalSetContent.call(editor, content, ...args);
                }

                // Restaura o cursor para a posição salva
                if (bookmark) {
                    editor.selection.moveToBookmark(bookmark);
                }
            }
        };

        // Evento para interceptar colagem
        editor.on('PastePreProcess', (e) => {
            const plainTextContent = editor.dom.create('div', null, e.content).innerText; // Remove HTML
            if (plainTextContent.length > maxCharacters) {
                const truncatedText = plainTextContent.substring(0, maxCharacters);
                const truncatedHtml = editor.dom.create('div', null, truncatedText).innerHTML;
                e.content = truncatedHtml; // Atualiza o conteúdo colado
            }
        });

        // Evento para evitar exceder o limite durante a digitação
        editor.on('input', () => {
            const plainTextContent = editor.getContent({ format: 'text' });
            if (plainTextContent.length > maxCharacters) {
                const truncatedText = plainTextContent.substring(0, maxCharacters);
                editor.setContent(truncatedText); // Trunca o conteúdo
            }
        });
    }
}