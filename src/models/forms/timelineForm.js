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

    get query() {
        const query = {
            flavor_editor: `FlavorEditor-${this.uuid}`,
            event_editor: `EventEditor-${this.uuid}`,
        }
        return uniforge.utils.mergeObjects(super.query, query);
    }

    get states() {
        return this.#states;
    }

    /**
     * @overload
     * Retorna um objeto com as seguintes propriedades:
     *  - sidebar: O elemento HTML que representa a barra lateral do formulário.
     *  - dialog: O elemento HTML que representa o diálogo de confirmação.
     * 
     * @returns {Object}  - Um objeto com as propriedades mencionadas acima.
     */
    get ui() {
        const ui = {
            forge: document.querySelector(`#formMain-${this.uuid} #timelineForge`)
        };
        return uniforge.utils.mergeObjects(super.ui, ui);
    }

    get flavorEditor() {
        const editor = tinymce.get(this.query.flavor_editor);
        return editor ? editor : null;
    }

    get eventEditor() {
        const editor = tinymce.get(this.query.event_editor);
        return editor ? editor : null;
    }

    /**
   * Define o conteúdo do editor de floreio.
   * @param {string} content - O conteúdo a ser definido.
   */
    set flavorEditor(content) {
        if (this.flavorEditor && content !== undefined) {
            if (!content.isEmpty() && !(typeof content === 'string')) throw new TypeError('O conteúdo deve ser uma string.');

            content = content ?? ''; // Se o conteúdo for nulo, faça o conteúdo vazio.
            this.flavorEditor.setContent(content);
        }
    }

    /**
     * Define o conteúdo do editor de eventos.
     * @param {string} content - O conteúdo a ser definido.
     */
    set eventEditor(content) {
        if (this.eventEditor && content !== undefined) {
            if (!content.isEmpty() && !(typeof content === 'string')) throw new TypeError('O conteúdo deve ser uma string.');

            content = content ?? ''; // Se o conteúdo for nulo, faça o conteúdo vazio.
            this.eventEditor.setContent(content);
        }
    }

    /**
    * Obtém as categorias disponíveis para o formulário no banco de dados.
    * @returns {Object} - Categorias.
    */
    async prepareData() {
        super.prepareData();

        // Obtém todos os Eventos registrados.
        this.data.events = uniforge.doc.events.toArray();

        return this.data;
    }

    /**@inheritdoc */
    prepareFolders(data) {
        const folders = uniforge.doc.timelines.toArray();
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

        const titleInput = this.ui.forge.querySelector('#titleInput');
        titleInput.value = '';

        // Limpa todos os editores Tiny MCE inicializados.
        this.flavorEditor = uniforge.defaults.emptyString;
        this.eventEditor = uniforge.defaults.emptyString;
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

    controlStates(state, clearData = true) {
        const newButton = this.querySelector('#newTimelineButton');
        const manageButton = this.querySelector('#manageTimelineButton');

        const forge = this.ui.forge;

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

                if (clearData) this.clearContent();
            } break;
        }

        // Atualiza o estado atual do formulário.
        this.currentState = state;
    }

    /** @inheritdoc */
    close() {
        // Limpa o conteúdo do editor de floreio, se houver.
        if (this.flavorEditor) {
            this.flavorEditor.remove();
        }

        // Limpa o conteúdo do editor de eventos, se houver.
        if (this.eventEditor) {
            this.eventEditor.remove();
        }

        super.close();
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
        if (this.flavorEditor) {
            tinymce.remove(this.query.flavor_editor);
        } else {
            // Trata o id do container do editor, inserindo o uuid do formulário.
            const div = this.querySelector('#timelineFlavorEditor');
            div.id = this.query.flavor_editor;
        }

        const options = uniforge.utils.mergeObjects(uniforge.tinymceOptions.simple, {
            selector: `div#${this.query.flavor_editor}`,
            placeholder: "Texto de floreio...",
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
        if (this.eventEditor) {
            tinymce.remove(this.query.event_editor);
        } else {
            // Trata o id do container do editor, inserindo o uuid do formulário.
            const div = this.querySelector('#eventFlavorEditor');
            div.id = this.query.event_editor;
        }

        const options = uniforge.utils.mergeObjects(uniforge.tinymceOptions.simple, {
            selector: `div#${this.query.event_editor}`,
            placeholder: "Descrição do evento...",
            init_instance_callback: (editor) => {
                editor.setContent(""); // Garante que o editor seja iniciado vazio.
            },
            setup: (editor) => { this._setupInlineTinyMCE(editor); }
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

        // Nova linha do tempo.
        if (this.currentState === this.states.default) {
            // Verifica se já existe uma linha do tempo aberta.
            if (this.selection.folder) {
                // Se já existe uma linha do tempo aberta, pergunta se deseja fechá-la.
                if (await Dialogs.confirm('Linha do Tempo Aberta', 'Uma linha do tempo já está aberta. Será necessário fechá-la para criar uma nova linha do tempo. Deseja continuar?')) {
                    this.clearContent();
                } else return; // Se o usuário não confirmar, aborte.
            }
            this.controlStates(this.states.newTimeline);
        }
        // Cancelar criação/edição de linha do tempo.
        else {
            this.controlStates(this.states.default, false);
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
            this.manager.timeline.flavor = this.flavorEditor.getContent();
            const committed = await this.manager.commit(false);

            // Se a linha do tempo foi salva com sucesso, atualiza o título da pasta.
            if (committed) {
                this.manager.rebuildTimeline();
                this.controlStates(this.states.default, false);
            } else if (committed === null) {
                // Se o usuário não confirmou a exclusão, retorna ao estado padrão.
                this.controlStates(this.states.default);
            }
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
        const eventStartDate = this.querySelector('#startDateViewer');
        const eventEndDate = this.querySelector('#endDateViewer');

        eventTitle.value = eventData.title;

        const entryType = eventData.entryType;
        eventEntryType.value = entryType.title;

        const calendar = eventData.calendar;
        eventCalendarType.value = calendar.label;

        const relevance = eventData.relevance;
        eventRelevance.value = relevance.title;

        eventStartDate.value = eventData.date.start.toString('MMn DD, YYYYs');
        eventEndDate.value = eventData.date.end ? eventData.date.end.toString('MMn DD, YYYYs') : '\u2014';

        this.eventEditor = eventData.flavor;
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
            if (!this.manager.selectEvent(eventData)) {
                item.classList.toggle('checked');
                return;
            }

            content.appendChild(checkedIcon);
        } else {
            const checkedIcon = content.querySelector('.icon');
            if (checkedIcon) checkedIcon.remove();

            const evid = item.dataset.value;
            this.manager.removeEvent(evid);
        }
    }    

    /**
     * Gerencia o clique no botão de excluir linha do tempo.
     * Verifica se o usuário deseja excluir a linha do tempo e, se sim, a exclui.
     * @param {MouseEvent} event - O evento de clique.
     */
    async onDeleteTimeline(event) {
        event.stopPropagation();

        if (await Dialogs.confirm('Excluir Linha do Tempo', 'Você tem certeza que deseja excluir esta Linha do Tempo?')) {
            await this.manager.deleteTimeline();
            const committed = await this.manager.commit();

            // Se a linha do tempo foi salva com sucesso, atualiza o título da pasta.
            if (committed) {
                this.refresh();
            } else if (committed === null) {
                // Se o usuário não confirmou a exclusão, retorna ao estado padrão.
                this.controlStates(this.states.default);
            }
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
        const timelineId = folder.dataset.id;
        const timeline = uniforge.doc.timelines.get(timelineId);

        const title = timeline.title;
        const flavor = timeline.flavor;

        const forge = this.querySelector('#timelineForge');
        const titleInput = forge.querySelector('#titleInput');
        titleInput.value = title;

        this.flavorEditor = flavor;

        const eventList = this.querySelector('#eventList');
        const eventItens = eventList.querySelectorAll('.item');

        eventItens.forEach(item => {
            const evid = item.dataset.value;
            if (this.manager.hasEvent(evid)) {
                item.classList.add('checked');
                const content = item.querySelector('.item-content');

                // Verifica se o ícone de evento selecionado já existe para evitar duplicatas.
                if (!content.querySelector('i.icon')) {
                    // Adiciona o ícone de evento selecionado.
                    const checkedIcon = document.createElement('i');
                    checkedIcon.classList.add('fas', this.eventCheckedIcon, 'icon');
                    content.appendChild(checkedIcon);
                }
            }
        });
    }
}