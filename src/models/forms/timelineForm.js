import CustomDate from "../../common/primitives/date.mjs";
import { TimelineManager } from "../../scripts/managers/timelineManager.js";
import Dialogs from "../dialogs/dialog.js";
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

        this.eventCheckedIcon = 'fa-calendar-check'; // Ícone de Evento selecionado.
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

        const eventList = this.querySelector('#eventList');
        const eventItens = eventList.querySelectorAll('.item');
        eventItens.forEach(item => {
            item.classList.remove('checked');
            const content = item.querySelector('.item-content');
            const icon = content.querySelector('.icon');
            // Remove o ícone de evento selecionado, se houver.
            if (icon) icon.remove();
        });

        this.selection.folder = null; // Limpa a seleção de pasta.
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

                const deleteTimelineButton = this.querySelector('#deleteTimelineButton');
                deleteTimelineButton.classList.remove('disabled');

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

                const deleteTimelineButton = this.querySelector('#deleteTimelineButton');
                deleteTimelineButton.classList.add('disabled');

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

        const deleteTimelineButton = this.querySelector('#deleteTimelineButton');
        deleteTimelineButton.addEventListener('click', (event) => { this.onDeleteTimeline(event); });

        const eventList = this.querySelector('#eventList');
        const eventItens = eventList.querySelectorAll('.item');

        eventItens.forEach(item => {
            item.addEventListener('click', (event) => { this.onEventClick(event); });
            item.addEventListener('dblclick', (event) => { this.onEventDoubleClick(event); });
        });

        const searchEventInput = this.querySelector('#searchEvents input');
        searchEventInput.addEventListener('input', (event) => { this.onSearchInput(event); });
    }

    /**
     * Gerencia o clique no botão de criar nova linha do tempo.
     * Alterna entre o estado de criação e o estado de edição da linha do tempo.
     * @param {MouseEvent} event - O evento de clique.
     */
    async onNewTimelineForgeClick(event) {
        event.stopPropagation();

        if (this.currentState === this.states.default) {
            // Verifica se já existe uma linha do tempo aberta.
            if (this.selection.folder) {
                // Se já existe uma linha do tempo aberta, pergunta se deseja fechá-la.
                if (await Dialogs.confirm('Linha do Tempo Aberta', 'Uma linha do tempo já está aberta. Será necessário fechá-la para criar uma nova linha do tempo. Deseja continuar?')) {
                    this.clearContent();
                } else return; // Se o usuário não confirmar, aborte.
            }
            this.controlStates(this.states.newTimeline);
        } else {
            this.controlStates(this.states.default);
        }
    }

    /**
     * Gerencia o clique no botão de gerenciar linha do tempo.
     * Alterna entre o estado de edição e o estado de criação da linha do tempo.
     * @param {MouseEvent} event - O evento de clique.
     */
    async onManageTimelineClick(event) {
        event.stopPropagation();

        if (this.currentState === this.states.default) {
            this._showTimeForge();

            this.controlStates(this.states.editTimeline);
        } else {
            const forge = this.querySelector('#timelineForge');
            const titleInput = forge.querySelector('#titleInput');

            this.manager.timeline.title = titleInput.value;
            const committed = await this.manager.commit();

            if(committed || committed === null) this.controlStates(this.states.default);
        }
    }

    /**
     * Gerencia o clique em um item de Evento na lista de Eventos.
     * @param {MouseEvent} event - O evento de clique.
     */
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

    /**
     * Trata o evento de duplo clique em um item de evento na lista.
     * Alterna a classe "checked" do item e, se o item estiver "checked", adiciona o ícone
     * de evento selecionado e o evento à lista de eventos do gerenciador.
     * Se o item estiver desmarcado, remove o ícone de evento selecionado e o evento da lista
     * de eventos do gerenciador.
     * @param {MouseEvent} event - O evento de duplo clique no item de evento.
     */
    onEventDoubleClick(event) {
        event.stopPropagation();
        const item = event.target.closest('.item');
        const content = item.querySelector('.item-content');
        item.classList.toggle('checked');

        if (item.classList.contains('checked')) {
            //'<i class="fa-solid fa-calendar-check"></i>'
            const checkedIcon = document.createElement('i');
            checkedIcon.classList.add('fas', this.eventCheckedIcon, 'icon');

            const eventData = uniforge.doc.events.get(item.dataset.value);            
            this.manager.addEvent(eventData);

            content.appendChild(checkedIcon);
        } else {
            const checkedIcon = content.querySelector('.icon');
            if (checkedIcon) checkedIcon.remove();

            const evid = item.dataset.value;
            this.manager.removeEvent(evid);
        }
    }

    /**
     * Filtra os eventos da lista de acordo com a string de pesquisa digitada.
     * Oculta os itens que não contenham a string de pesquisa no título e
     * que não estejam marcados como "checked".
     * @param {InputEvent} event - O evento de input no campo de pesquisa.
     */
    onSearchInput(event) {
        const searchInput = event.target;
        const query = searchInput.value.toLowerCase().trim();

        const eventList = this.querySelector('#eventList');
        const eventItens = eventList.querySelectorAll('.item');

        eventItens.forEach(item => {
            const evid = item.dataset.value;
            const eventData = uniforge.doc.events.get(evid);

            // Verifica se o título do evento contém a string de pesquisa e se o item está marcado como "checked".
            if (eventData.title.toLowerCase().includes(query) || item.classList.contains('checked')) {
                item.classList.remove('hidden');
            }
            else { // Se não, oculta o item.
                item.classList.add('hidden');
            }
        });
    }

    /**
     * Gerencia o clique no botão de excluir linha do tempo.
     * Verifica se o usuário deseja excluir a linha do tempo e, se sim, a exclui.
     * @param {MouseEvent} event - O evento de clique.
     */
    async onDeleteTimeline(event) {
        event.stopPropagation();

        if(await Dialogs.confirm('Excluir Linha do Tempo', 'Você tem certeza que deseja excluir esta Linha do Tempo?')) {
            await this.manager.deleteTimeline();
            this.controlStates(this.states.default);
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

    onSearchButtonClick(event) {
        event.stopPropagation();

        console.log('*CLICK*');
    }
   
    /* ---------------------------------------------------------------------------------------------------------------- */
    // UTILITÁRIOS    
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

    /**
     * Mostra a janela de edição de linha do tempo (Time Forge) com os dados da pasta selecionada.
     * @private
     */
    _showTimeForge() {
        const folder = this.selection.folder;
        const titleSpan = folder.querySelector('span');
        const title = titleSpan.innerText;

        const forge = this.querySelector('#timelineForge');
        const titleInput = forge.querySelector('#titleInput');
        titleInput.value = title;

        const eventList = this.querySelector('#eventList');
        const eventItens = eventList.querySelectorAll('.item');

        eventItens.forEach(item => {
            const evid = item.dataset.value;
            if (this.manager.hasEvent(evid)) {
                item.classList.add('checked');
                const content = item.querySelector('.item-content');
                
                // Adiciona o ícone de evento selecionado.
                const checkedIcon = document.createElement('i');
                checkedIcon.classList.add('fas', this.eventCheckedIcon, 'icon');
                content.appendChild(checkedIcon);
            }
        });

    }
}