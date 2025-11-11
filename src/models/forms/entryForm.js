/**
 * Importações de módulos necessários.
 */
import SidebarForm from "./sidebarForm.js";
import LinkDialog from "../dialogs/linkDialog.js";
import ImagePickerDialog from "../dialogs/imagePickerDialog.js";
import Dialogs from "../dialogs/dialog.js";
import DatePicker from "../datePicker.js";
import FilePickerDialog from "../dialogs/filePickerDialog.js";

/**
 * Classe EntryForm estende a funcionalidade da classe BaseForm para gerenciar formulários que manipulem Entradas.
 * @class
 * @extends SidebarForm
 */
export default class EntryForm extends SidebarForm {
  /**
   * Construtor da classe EntryForm.
   * 
   * @param {HTMLElement} title   - O título do formulário.
   */
  constructor(title, options = {}) {
    super(title, options);

    /**
     * @type {string} - O modelo HTML utilizado pelo formulário.
     */
    this.template = 'entryForm';

    /**
    * Estados válidos para os elements do formulário.
    * @type {Object<number, number>}
    */
    this.states = this._states;

    /**
     * Estado atual dos elements do formulário.
     * @type {number}
     */
    this.currentState = 0;

    /**
     * O ícone Font Awesome para quando uma entrada é selecionada.
     * @type {string}
     */
    this.selectedIcon = 'fas fa-feather';

    /**
     * Objeto com os dados da imagem da entrada.
     * @type {Object}
     */
    this.selectedImg = {
      rawData: null,
      ext: ''
    };

    /**
     * A edição atual é uma atualização de uma Entrada? (false por padrão)
     * @type {boolean}
     */
    this.isUpdate = false;

    /**
     * O formulário possui funcionalidade de vinculação de Eventos? (true por padrão)
     * @type {boolean}
     */
    this.isEventForm = true;

    /**
    * @property {Object} datePickers - Um objeto que gerencia os seletores de data para registro de entradas.
    * Contém duas instâncias de `DatePicker` para 'startDate' (data de início) e 'endDate' (data de término).
    */
    this.datePickers = {
      startDate: new DatePicker('startDate'),
      endDate: new DatePicker('endDate')
    }

    this.selection.event = null; // ID do Evento selecionado na EventTab.
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

  /** Eventos temporários, vinculados à Entrada até serem salvos (ou não).
    * @property {Object} events - Objeto que armazena os eventos vinculados à entrada.    
    * @private
    * @default {}
    */
  #events = {};

  /**
   * @overload
  * Retorna um objeto com seletores para elementos da aplicação.
  * 
  * @returns {Object} - Um objeto com as seguintes propriedades:
  *  - app: Seletor para o elemento container da aplicação.
  *  - header: Seletor para o elemento header da aplicação.
  *  - main: Seletor para o elemento main da aplicação.
  *  - close_btn: Seletor para o elemento de fechar a aplicação.
  *  - main_editor: Seletor para o principal editor Tiny MCE da aplicação.
  *  - flavor_editor: Seletor para o editor Tiny MCE de floreio da aplicação.
  *  - event_editor: Seletor para o editor Tiny MCE de eventos da aplicação.
  */
  get query() {
    const query = {
      main_editor: `MainEditor-${this.uuid}`,
      flavor_editor: `FlavorEditor-${this.uuid}`,
      event_editor: `EventEditor-${this.uuid}`,
    }
    return uniforge.utils.mergeObjects(super.query, query);
  }

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
   * Retorna o índice da aba ativa no formulário.
   * O índice é baseado na ordem em que as abas são exibidas no formulário.
   * 
   * @returns {number} - O índice da aba ativa.
  */
  get activeTabIdx() {
    const sectionTabs = this.querySelectorAll('#sections .tab-content');
    let idx = 0;
    // Verifica qual aba está ativa e retorna seu índice.
    sectionTabs.forEach((tab, index) => {
      if (tab.classList.contains('active')) idx = index;
    });
    return idx;
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

  /**
  * Retorna o objeto que armazena os eventos vinculados à entrada.
  * 
  * @returns {Object} - Um objeto contendo os eventos da entrada.
  */
  get events() {
    return this.#events;
  }

  /**
  * O Evento possui eventos vinculados à Entrada? (false por padrão)
  * @type {boolean}
  */
  get hasEvents() {
    return Object.keys(this.#events).length > 0;
  };

  get mainEditor() {
    const editor = tinymce.get(this.query.main_editor);
    return editor ? editor : null;
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
   * Define o conteúdo do editor principal.
   * @param {string} content - O conteúdo a ser definido.
   */
  set mainEditor(content) {
    if (this.mainEditor && content !== undefined) {
      if (content !== null && !(typeof content === 'string')) throw new TypeError('O conteúdo deve ser uma string.');

      content = content ?? ''; // Se o conteúdo for nulo, faça o conteúdo vazio.
      this.mainEditor.setContent(content);
    }
  }

  /**
   * Define o conteúdo do editor de floreio.
   * @param {string} content - O conteúdo a ser definido.
   */
  set flavorEditor(content) {
    if (this.flavorEditor && content !== undefined) {
      if (content !== null && !(typeof content === 'string')) throw new TypeError('O conteúdo deve ser uma string.');

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
      if (content !== null && !(typeof content === 'string')) throw new TypeError('O conteúdo deve ser uma string.');

      content = content ?? ''; // Se o conteúdo for nulo, faça o conteúdo vazio.
      this.eventEditor.setContent(content);
    }
  }

  /**
    * Obtém os dados unificados necessários para o funcionamento do formulário.
    * @implements Implemente um método filho para as especificidades de cada formulário.
    * @async
    * @returns {object}  - Objeto de dados unificado.
    */
  prepareData() {
    // Informa ao formulário atual o seu tipo.
    this.data.type = this.type;

    if (this.isEventForm) {
      this.data.entryTypes = uniforge.doc.entryTypes.toObject();
      this.data.relevances = uniforge.doc.relevances.toObject();
      this.data.calendars = uniforge.doc.calendars.toObject();
    }

    return super.prepareData();
  }

  /** @inheritdoc */
  prepareFolders(data) {
    const folders = uniforge.doc.sections.filter(s => {
      const c = uniforge.doc.chapters.get(s.cid);
      return c.tome === this.type;
    });
    data.folders = folders.sort();
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
    const titleInput = this.querySelector('#titleInput');
    const imageContainer = this.querySelector('#imageContainer');
    const infoSet = this.querySelector('.info-set:not(.not-disable)');
    const mainEditor = this.mainEditor;
    const deleteSwitch = this.querySelector('#deleteSwitch');
    const deleteCheckbox = deleteSwitch.querySelector('#checkbox');

    const flavorEditor = this.flavorEditor;

    const ignoreEditor = options.ignoreEditor ?? false;

    if (this.canDelete) deleteCheckbox.click();

    titleInput.disabled = false;
    infoSet.disabled = false;

    switch (state) {
      // ESTADO DE HABILITAÇÃO DE NOVA ENTRADA.
      case this.states.newEntry: {
        titleInput.disabled = true;
        infoSet.disabled = true;

        if (imageContainer)
          imageContainer.classList.remove('disabled');

        // Limpe qualquer conteúdo, caso uma entrada já estiver sendo manipulada.
        if (this.currentState > this.states.newEntry) this.clearContent(false);

        // Configuração dos Estados dos Botões.
        const saveButton = this.querySelector('#saveButton');
        const newEntryButton = this.querySelector('#newEntryButton');
        const cancelButton = this.querySelector('#cancelButton');

        saveButton.innerHTML = '<i class="fa-regular fa-floppy-disk"></i> Salvar';
        saveButton.classList.add('disabled');

        newEntryButton.classList.remove('disabled');

        cancelButton.classList.add('hidden');

        if (!this.isSettings)
          flavorEditor.mode.set('readonly');

        this._toggleSectionButtons(true);

        if (!ignoreEditor) mainEditor?.mode.set('readonly');
      } break;
      // ESTADO DE EDIÇÃO DE ENTRADA.
      case this.states.adding: {
        this.clearContent();
        // Está adicionando uma Entrada nova.
        this.isUpdate = false;

        // Foca no campo de Título.
        const titleInput = this.querySelector('#titleInput');
        titleInput.focus();

        if (imageContainer)
          imageContainer.classList.remove('disabled');

        deleteSwitch.classList.remove('hidden');

        // Configuração dos Estados dos Botões.
        const saveButton = this.querySelector('#saveButton');
        const cancelButton = this.querySelector('#cancelButton');

        // Configuração do label no botão de Salvar.
        saveButton.innerHTML = '<i class="fa-regular fa-floppy-disk"></i> Salvar';
        saveButton.classList.remove('disabled');

        cancelButton.classList.remove('hidden');

        if (!this.isSettings)
          flavorEditor.mode.set('design');

        this._toggleSectionButtons(false, false);

        if (!ignoreEditor) mainEditor?.mode.set('design');
      } break;
      // ESTADO DE EDIÇÃO DE ENTRADA.
      case this.states.editing: {
        // Está atualizando uma Entrada pré-existente.
        this.isUpdate = true;

        // Foca no campo de Título.
        const titleInput = this.querySelector('#titleInput');
        titleInput.focus();

        if (imageContainer)
          imageContainer.classList.remove('disabled');

        deleteSwitch.classList.remove('hidden');

        // Configuração dos Estados dos Botões.
        const saveButton = this.querySelector('#saveButton');
        const cancelButton = this.querySelector('#cancelButton');

        // Configuração do label no botão de Salvar.
        saveButton.innerHTML = '<i class="fa-regular fa-floppy-disk"></i> Atualizar';
        saveButton.classList.remove('disabled');

        cancelButton.classList.remove('hidden');

        if (!this.isSettings)
          flavorEditor.mode.set('design');

        this._toggleSectionButtons(false, false);

        if (!ignoreEditor) mainEditor?.mode.set('design');
      } break;
      // ESTADO PADRÃO.
      default: {
        this.clearContent();

        const entryTypeSelect = this.querySelector('#entryType');
        if (entryTypeSelect) entryTypeSelect.selectedIndex = 0;

        deleteSwitch.classList.add('hidden');

        // Limpa todo o dataset do Header Info.
        const headerInfo = this.querySelector('.header-info');
        Object.keys(headerInfo.dataset).forEach(key => {
          delete headerInfo.dataset[key];
        });

        if (imageContainer)
          // Desativa recipiente de imagens.
          imageContainer.classList.add('disabled');

        // As entradas de dados nesse estado estão desativadas.
        titleInput.disabled = true;
        infoSet.disabled = true;

        // -----------------------------------------------------------------------
        //    Configuração dos Estados dos Botões.
        // -----------------------------------------------------------------------
        const saveButton = this.querySelector('#saveButton');
        const newEntryButton = this.querySelector('#newEntryButton');
        const cancelButton = this.querySelector('#cancelButton');

        // Configuração do label no botão de Salvar.
        saveButton.innerHTML = '<i class="fa-regular fa-floppy-disk"></i> Salvar';

        // Nesse estado, todos os botões estão desativados.
        saveButton.classList.add('disabled');
        newEntryButton.classList.add('disabled');
        cancelButton.classList.add('hidden');

        // -----------------------------------------------------------------------
        //    Configuração dos Estados dos editores Tiny MCE.
        // -----------------------------------------------------------------------           
        if (!ignoreEditor) mainEditor?.mode.set('readonly'); // Desativa o editor.

        if (this.isEventForm) {
          const relevanceSelect = this.querySelector('#relevance');
          relevanceSelect.selectedIndex = 0;

          flavorEditor.mode.set('readonly');
        }

        this._toggleSectionButtons(true);
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
    // Limpa o conteúdo do editor principal, se houver.
    if (this.mainEditor) {
      this.mainEditor.remove();
    }

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
    await super.configureContent();

    // Se o formulário for do tipo 'atlas', não configure os editores Tiny MCE.
    if (this.type !== 'atlas') {

      // Configura o editor Tiny MCE principal .
      await this.configureTinyMCE();

      // Se o formulário for de Configurações, não configure os editores de floreio.
      if (!this.isSettings) {
        // Configura o editor TinyMCE de floreio associado ao formulário.
        await this.configureFlavorTinyMCE();

        // Se o formulário for de Eventos, configura o editor TinyMCE de floreio dos eventos.
        if (this.isEventForm) {
          // Configura o editor TinyMCE de floreio dos eventos associados à entrada do formulário.
          await this.configureEventFlavorTinyMCE();
        }
      }
    }
  }

  /**
   * Limpa o conteúdo do formulário
   * @param {Boolean} clearSidebar - Flag para habilitar/desabilitar a limpeza da seleção da sidebar (true por padrão).
   */
  clearContent(clearSidebar = true) {
    if (clearSidebar) super.clearContent();

    this.clearImage();

    const titleInput = this.querySelector('#titleInput');
    titleInput.value = '';

    const isDraftSwitch = this.querySelector('#checkbox');
    isDraftSwitch.checked = false;

    // Limpa todos os editores Tiny MCE inicializados.
    this.mainEditor = '';
    this.flavorEditor = '';
    this.eventEditor = '';

    if (this.isEventForm && this.hasEvent) {
      this.eid = null;
      this.#events = [];

      const entryTypeSelect = this.querySelector('#entryType');
      entryTypeSelect.value = 1;

      const entryEvents = this.querySelector('#entryEvents');
      entryEvents.innerHTML = '';

      this.clearEventTab();
    }

    this.closeDialog();
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

    this.eventEditor = '';

    this.datePickers.startDate.clearDate();

    this.datePickers.endDate.dateInput.classList.add('disabled');
    this.datePickers.endDate.clearDate();

    const addEventButton = this.querySelector('#addEventButton');
    addEventButton.innerHTML = '<i class="fas fa-square-plus"></i> Adicionar Evento';
  }

  /**
   * Inicializa e configura o editor TinyMCE.
   * Remove qualquer instância existente antes de reconfigurar.
   * @private
   */
  async configureTinyMCE() {
    if (this.mainEditor) {
      tinymce.remove(this.query.main_editor);
    } else {
      // Trata o id do container do editor, inserindo o uuid do formulário.
      const textarea = this.querySelector('#mainEditor');
      textarea.id = this.query.main_editor;
    }

    const options = uniforge.utils.mergeObjects(uniforge.tinymceOptions.default, {
      selector: `textarea#${this.query.main_editor}`,
      init_instance_callback: (editor) => {
        editor.setContent(""); // Garante que o editor seja iniciado vazio.
      },
      text_patterns: [
        { start: '@[', end: ']', format: 'bold' },
        { start: '@{', end: '}', format: 'italic' }
        //{ start: '##', format: 'blockquote', trigger: 'space' }
      ],
      setup: (editor) => { this._setupTinyMCE(editor); }
    });

    await tinymce.init(options);
  }

  /**
    * Configura o editor TinyMCE para o texto de floreio da Entrada.
    */
  async configureFlavorTinyMCE() {
    if (this.flavorEditor) {
      tinymce.remove(this.query.flavor_editor);
    } else {
      // Trata o id do container do editor, inserindo o uuid do formulário.
      const div = this.querySelector('#flavorEditor');
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
  * Configura o editor TinyMCE para o texto de floreio dos eventos da Entrada.
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

  /**
  * Recarrega os DatePickers associados à instância.
  * Para cada DatePicker, chama o método `load`, passando o calendário escolhido.
  */
  configureDatePickers(event) {
    const calendarType = this.querySelector('#calendarType');
    calendarType.value = event?.clid ?? 1;
    calendarType.dispatchEvent(new Event('change'));

    // Se houver um evento, carregue o DatePicker com a data do evento.
    if (event) {
      this.datePickers.startDate.selectFullDate(event.s_day, event.s_month, event.s_year);
      // Se houver uma data de fim, carregue o DatePicker com a data do evento.
      if (event.e_day)
        this.datePickers.endDate.selectFullDate(event.e_day, event.e_month, event.e_year);
    }
  }

  clearDatePickers() {
    Object.values(this.datePickers).forEach(datePicker => {
      datePicker.clearDate();

      delete datePicker.minDate;
      delete datePicker.maxDate;
    });
  }

  /* ---------------------------------------------------------------------------------------------------------------- */
  // LISTENERS
  /**
   * Configura ouvintes de eventos básicos para o formulário.
   * @inheritdoc
   */
  activateListeners() {
    super.activateListeners()
    const imageContainer = this.querySelector('#imageContainer');
    const displayedImage = this.querySelector('#displayedImage');
    const fileInput = this.querySelector('#hiddenFileInput');
    const deleteSwitch = this.querySelector('#deleteSwitch');
    const deleteCheckbox = deleteSwitch.querySelector('#checkbox');

    const cancelButton = this.querySelector('#cancelButton');
    const newEntryButton = this.querySelector('#newEntryButton');
    const saveButton = this.querySelector('#saveButton');

    const entriesList = this.querySelectorAll('.entry-item');

    const yesBtn = this.querySelector('#confirm-yes');
    const noBtn = this.querySelector('#confirm-no');

    deleteCheckbox.addEventListener('change', (event) => { this.onDeleteSwitchChange(event); });

    // Há um contêiner de imagem?
    if (imageContainer) {
      // Adiciona um evento para lidar com a seleção de uma nova imagem.
      fileInput.addEventListener('change', (event) => { this.onChangeImage(event, displayedImage); });

      // Adiciona um evento de clique no contêiner de imagem para abrir o seletor de arquivos.
      imageContainer.addEventListener('click', (event) => { this.onImageClick(event, displayedImage); });
      imageContainer.addEventListener('contextmenu', (event) => { this.onImageRightClick(event, displayedImage); });
    }

    cancelButton.addEventListener('click', (event) => { this.onCancelClick(event); });
    newEntryButton.addEventListener('click', (event) => { this.onNewClick(event); });
    saveButton.addEventListener('click', (event) => { this.onSaveClick(event); });

    entriesList.forEach(item => {
      const deleteIcon = item.querySelector('.remove-button');

      if (deleteIcon)
        deleteIcon.addEventListener('click', (event) => { this.onOpenDialogClick(event, item); });
    });

    yesBtn.addEventListener('click', (event) => { this.onDeleteClick(event); });
    noBtn.addEventListener('click', (event) => { this.onCancelSidebarDialogClick(event); });

    if (this.isEventForm) {
      const calendarType = this.querySelector('#calendarType');
      calendarType.addEventListener('change', (event) => { this.onDateTypeChange(event); });

      const sectionButtons = this.querySelectorAll('#sections .tabs-options button');
      sectionButtons.forEach(button => {
        button.addEventListener('click', (event) => { this.onSectionButtonClick(event); });
      });

      Object.values(this.datePickers).forEach(picker => {
        picker.activateBaseListeners();
        picker.addEventListener('change', (event) => this.onDatePickerChange(event));
      });

      const entryEvents = this.querySelector('#entryEvents');
      entryEvents.addEventListener('click', (event) => { this.onEventListClick(event); });

      const newEventButton = this.querySelector('#addEventButton');
      newEventButton.addEventListener('click', (event) => { this.onAddEventClick(event); });
    }
  }

  /**
   * Reconfigura alguns ouvintes de eventos para o formulário após alguma alteração nos dados.
   * @param {HTMLElement} form - O formulário principal.
   * @private
   */
  reactivateListeners(form) {
    super.reactivateListeners(form);
    const entriesList = this.querySelectorAll('.entry-item');

    entriesList.forEach(item => {
      const deleteIcon = item.querySelector('.remove-button');
      deleteIcon.addEventListener('click', (event) => { this.onOpenDialogClick(event, item); });
    });
  }

  /**
   * Gerencia cliques no switch de Deleção de Dados.
   * @param {MouseEvent} event - O evento de clique.
   * @protected
   */
  onDeleteSwitchChange(event) {
    event.stopPropagation();
    this.canDelete = event.target.checked;
    const imageContainer = this.querySelector('#imageContainer');

    if (imageContainer) {
      if (this.canDelete) {
        imageContainer.classList.add('delete');
      } else {
        imageContainer.classList.remove('delete');
      }
    }
  }

  /**
   * Gerencia cliques em pastas.
   * @param {MouseEvent} event - O evento de clique.
   * @protected
   */
  onFolderClick(event) {
    super.onFolderClick(event);

    // Se o formulário for o de Configurações, ignore.
    if (this.isSettings) return;

    const clickedFolder = event.target.closest('.folder');
    const isSelected = clickedFolder.classList.contains('selected');

    // Filtras os tipos de entrada para o folder selecionado, se necessário (Capítulos não possuem Tipos de Entrada).
    if (!this.isSettings)
      this._filterFoldersEntryTypes(clickedFolder);

    // A seleção de folders somente afeta o estado do formulário, se ele estiver no 
    // estado padrão.
    if (this.currentState <= this.states.newEntry) {
      if (isSelected) this.controlStates(this.states.newEntry);
      else this.controlStates(this.states.default);
    }
  }

  /**
   * Manipulador de evento para alterar a imagem exibida.
   * @param {Event} event                     - Evento disparado pelo input de arquivo.
   * @param {HTMLImageElement} displayedImage - Elemento de imagem a ser atualizado.
   */
  async onImageClick(event, displayedImage) {
    if (this.canDelete) {
      const confirm = await Dialogs.confirm('Apagar Imagem', 'Deseja remover a imagem?')
      if (confirm) {

        this.selectedImg.rawData = null;

        displayedImage.src = this.blankImgUrl;
        displayedImage.classList.add('empty');
      }
    } else {
      // Abre o diálogo de seleção de imagem.
      const imageData = await FilePickerDialog.configDialog(null, { canUpload: true, hasCaption: false, type: 'image' });

      if(imageData) {
        // Obtem o caminho completo da imagem.
        const fullPath = await uniforge.path.join(imageData.path);

        // Lê o arquivo de imagem como um buffer.
        const buffer = await uniforge.fs.readFile(fullPath);
        const imageUrl = await uniforge.utils.bufferToImage(buffer, imageData.ext);

        displayedImage.dataset.ext = imageData.ext;
        displayedImage.src = imageUrl
        displayedImage.classList.remove('empty');

        this.selectedImg = await uniforge.utils.bufferToBlob(buffer, imageData.ext);
      }
    }
  }
  /**
   * Manipulador de evento para alterar a imagem exibida.
   * @param {Event} event                     - Evento disparado pelo input de arquivo.
   * @param {HTMLImageElement} displayedImage - Elemento de imagem a ser atualizado.
   */
  async onImageRightClick(event, displayedImage) {
    event.preventDefault();

    if (this.selectedImg.raw && !displayedImage.classList.contains('empty')) {
      const imageUrl = await uniforge.utils.blobToImage(this.selectedImg.raw, this.selectedImg.ext);
      await Dialogs.showImagem('Exibir Imagem', imageUrl);
    }
  }
  /**
   * Manipulador de evento para alterar a imagem exibida.
   * @param {Event} event                     - Evento disparado pelo input de arquivo.
   * @param {HTMLImageElement} displayedImage - Elemento de imagem a ser atualizado.
   */
  async onChangeImage(event, displayedImage) {
    const file = event.target.files[0];

    // Verifica se um arquivo foi selecionado e se é uma imagem.
    if (file && file.type.startsWith('image/')) {
      // Cria um URL temporário para o arquivo selecionado.
      const imageURL = URL.createObjectURL(file);

      // Atualiza a imagem exibida.
      displayedImage.src = imageURL;
      displayedImage.dataset.ext = file.type.split('/')[1];
      displayedImage.classList.remove('empty');

      this.selectedImg = await uniforge.utils.imageToBlob(file);

      // Libera o URL temporário quando não for mais necessário.
      displayedImage.onload = () => {
        URL.revokeObjectURL(imageURL);
      };
    }
  }

  /**
   * Manipulador de evento para alterar o tipo de calendário exibido.
   * @param {Event} event - Evento disparado pelo input de arquivo.
   */
  onDateTypeChange(event) {
    const select = event.target;
    const dateType = Number(select.value) - 1;

    const calendar = this.data.calendars[dateType];

    Object.values(this.datePickers).forEach(pickers => {
      pickers.config(calendar);
    });
  }

  onDatePickerChange(event) {
    event.stopPropagation();

    const dataGroup = event.target.closest('.data-group');
    const pickerId = dataGroup.id;
    const picker = this.datePickers[pickerId];

    if (!picker.empty) {

      // Obtem as datas de inicio e fim.
      const startDate = this.datePickers.startDate;
      const endDate = this.datePickers.endDate;

      if (picker.id === startDate.id) {
        // Define a data de inicio no DatePicker de fim.
        endDate.setMinDate(picker.date);
        // Ativa o DatePicker de data final.
        endDate.dateInput.classList.remove('disabled');
      }
      if (picker.id === endDate.id) {
        // Define a data de inicio no DatePicker de fim.
        startDate.setMaxDate(picker.date);
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

  onEventListClick(clkEvent) {
    clkEvent.stopPropagation();
    const eventList = clkEvent.target;

    eventList.querySelectorAll('.item').forEach(item => item.classList.remove('selected'));
    this.clearEventTab();
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

    this.querySelectorAll('#entryEvents .item').forEach(item => item.classList.remove('selected'));
    clickedEvent.classList.add('selected');

    eventTitle.value = event.title;
    eventTitle.focus();

    eventEntryType.value = event.etid;
    relevance.value = event.relevance;
    calendarType.value = event.clid;

    this.configureDatePickers(event);

    this.eventEditor = event.flavor;

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
      flavor: this.eventEditor.getContent() ?? '',
      s_day: this.datePickers.startDate.date.day,
      s_month: this.datePickers.startDate.date.month,
      s_year: this.datePickers.startDate.date.year,
      e_day: this.datePickers.endDate.isEmpty ? null : this.datePickers.endDate.date.day,
      e_month: this.datePickers.endDate.isEmpty ? null : this.datePickers.endDate.date.month,
      e_year: this.datePickers.endDate.isEmpty ? null : this.datePickers.endDate.date.year,
      dbAction: uniforge.doc.events.get(newEvid) ? 'u' : 'a'
    };

    const result = uniforge.db.validateEvent(newEvent);
    if (result !== '') {
      this.msgBox.showWarning(result);
      return;
    }

    this.#events[newEvid] = newEvent;
    this._generateEventListItems();

    // Limpa o evento selecionado.
    this.selection.event = null;
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
  * Trata o evento de criação de um novo item qualquer.
  * @param {Event} event - Evento de clique no botão de Nova Entrada.
  */
  async onNewClick(event) {
    event.stopPropagation();
    // Ignora o clique se o botão estiver desativado.
    //const button = event.target.closest('#newEntryButton');
    //if (button.classList.contains('disabled')) return;

    // Obtém a lista de Categorias
    const selectedFolder = this.selection.folder;
    if (!selectedFolder) {
      this.msgBox.showWarning('Nenhuma pasta foi selecionada.');
      return;
    }

    const headerInfo = this.querySelector('.header-info');
    const id = selectedFolder.dataset.id ?? null;

    // Define o ID da pasta no dataset do header.
    if (this.isSettings) headerInfo.dataset.cid = id;
    else headerInfo.dataset.sid = id;

    const titleInput = this.querySelector('#titleInput');
    titleInput.focus();

    // Configuração do label no botão de Salvar.
    const saveButton = this.querySelector('#saveButton');
    saveButton.innerHTML = '<i class="fa-regular fa-floppy-disk"></i> Salvar';

    // Gera um novo ID para a Entrada.
    this.eid = uniforge.db.generateID();

    // Atualiza o estado do formulário.
    this.controlStates(this.states.adding);
  }

  /**
    * Trata o evento de registro de uma nova entrada.
    * @param {Event} event - Evento de clique no botão de Salvar.
    */
  async onSaveClick(event) {
    event.stopPropagation();

    const item = this.selection.entry;
    this.isUpdate = (item ? true : false);

    try {
      const title = (this.isUpdate ? 'Atualizar' : 'Registrar');
      let dialogMessage = this.isUpdate ? 'Deseja atualizar a entrada?' : 'Deseja salvar a entrada?';

      if (await Dialogs.confirm(title, dialogMessage)) {
        const imgInput = this.querySelector('#hiddenFileInput');
        const titleInput = this.querySelector('#titleInput');
        const draftSwitch = this.querySelector('#isDraftSwitch');
        const draftCheckbox = draftSwitch.querySelector('#checkbox');

        const data = {
          title: titleInput.value,
          isDraft: Number(draftCheckbox.checked),
        };

        // Se uma imagem foi informada, prepare-a para o banco de dados.
        uniforge.utils.mergeObjects(data, this.selectedImg);

        // Inicia a transação de salvamento.
        await uniforge.db.beginTransaction();

        const headerInfo = this.querySelector('.header-info');
        const entryType = this.querySelector('#entryType');

        uniforge.utils.mergeObjects(data, {
          eid: this.eid ?? null,
          etid: entryType.value,
          sid: headerInfo.dataset.sid,
          flavor: this.flavorEditor.getContent() ?? '',
          htmlString: this.mainEditor.getContent() ?? ''
        });

        let validation = uniforge.db.validateEntry(data);
        if (validation !== '') {
          this.msgBox.showWarning(validation);
          return;
        }

        // Verifica se o item já existe no banco de dados.
        if (this.isUpdate) this._updateEntry(data);
        else this._addEntry(data);

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
    const id = this.ui.dialog.dataset.id;

    await uniforge.db.deleteEntry(id);
    this.msgBox.showInfo('Entrada removida com sucesso.');
    await this.refresh();
  }

  /**
   * Gerencia cliques duplos em itens de entrada.
   * @protected
   * @param {MouseEvent} event - O evento de clique duplo.
   */
  async onEntryItemDoubleClick(event, options = {}) {
    await super.onEntryItemDoubleClick(event);

    // Se o formulário for o de Configurações, ignore.
    if (this.isSettings) return;

    const item = event.target.closest('.entry-item');
    const itemId = item.dataset.id;
    const itemType = options.dataSource ?? 'entries';
    const entry = uniforge.doc[itemType].get(itemId);

    if (entry) {
      const headerInfo = this.querySelector('.header-info');
      headerInfo.dataset.cid = entry.cid ?? null;
      headerInfo.dataset.sid = entry.sid ?? null;

      headerInfo.dataset.eid = entry.eid;

      const displayedImage = this.querySelector('#displayedImage');
      const titleInput = this.querySelector('#titleInput');

      const draftSwitch = this.querySelector('#isDraftSwitch');
      const draftCheckbox = draftSwitch.querySelector('#checkbox');

      titleInput.value = entry.title;
      draftCheckbox.checked = entry.isDraft;

      if (entry.img) {
        const imageUrl = await uniforge.utils.blobToImage(entry.img, entry.ext);

        displayedImage.dataset.ext = entry.ext;
        displayedImage.src = imageUrl
        displayedImage.classList.remove('empty');
      } else { // A imagem é vazia.
        this.clearImage();
      }

      this.selectedImg = {
        rawData: entry.img,
        ext: entry.ext
      };

      this.configureDatePickers(null);

      const entryType = this.querySelector('#entryType');

      entryType.value = Number(entry.etid);

      this.flavorEditor = entry.flavor;
      this.mainEditor = entry.htmlString;

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

      // Obtém o identificador do item selecionado.
      this.eid = entry.eid;

      // Armazena os dados da entrada atual.
      this.data.entry = entry;      

      // Atualiza o estado dos elements do formulário.
      this.controlStates(this.states.editing);
    } else {
      this.msgBox.showWarning('Erro ao carregar a entrada.');
    }
  }

  /**
   * Rotina para tratamento do tooltip de confirmação de remoção.
   * @param {Event} event - Evento de clique no ícone de exclusão.
   * @param {HTMLElement} item - O item da pasta a ser excluído.
   */
  onOpenDialogClick(event, item) {
    event.stopPropagation();

    const dataType = (this.isSettings ? 'do Capítulo' : 'da Seção');

    this.ui.dialog.dataset.id = item.dataset.id;
    this.ui.dialog.dataset.action = 'del';

    const message = `Tem certeza que deseja excluir o item ${dataType}?`;
    this._showDialog(message);
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

  /**
    * Trata o evento de cancelamento de um novo item.
    * @param {Event} event - Evento de clique no botão de Cancelar.
    */
  async onCancelClick(event) {
    event.stopPropagation();

    this.cancel();
  }
  /**
    * Ação personalizada no editor TinyMCE para criar ou modificar links.
    * @param {Object} editor - Instância do editor TinyMCE.
    */
  async onEntryLinkCreation(editor) {
    const tooltip = this.ui.tooltip;
    const selectedHtml = editor.selection.getContent();

    const id = this.selection.entry.dataset.id;
    const type = ((this.querySelector('.entries')).classList.contains('timeline') ? 'timeline' : 'entry');
    const link = await LinkDialog.configDialog({ id, type });

    if (link) {
      const spanRegex = /<span[^>]*>(.*?)<\/span>/gi;
      if (spanRegex.test(selectedHtml)) {
        const unwrappedText = selectedHtml.replace(spanRegex, '$1').trim();
        editor.selection.setContent(unwrappedText);
      } else {
        const selectedText = editor.selection.getContent({ format: 'text' });
        if (selectedText) {
          const leadingSpaces = selectedText.match(/^\s+/);
          const trailingSpaces = selectedText.match(/\s+$/);

          const trimmedText = selectedText.trim();
          const wrappedContent = `${leadingSpaces ? leadingSpaces[0] : ''}@[${link.id}, ${link.type}]{${trimmedText}}${trailingSpaces ? trailingSpaces[0] : ''}`;
          editor.selection.setContent(wrappedContent);
        } else {
          editor.notificationManager.open({
            text: 'Favor selecionar um texto antes de criar um link.',
            type: 'warning'
          });
        }
      }
    }
  }

  /**
   * Cria um ImagePicker e trata a ação do usuário de envio de uma imagem para o texto.
   * @private
   * @param {Object} editor - Instância do editor TinyMCE.
   */
  async onUploadImage(editor) {
    // Abre o diálogo de seleção de imagem.
    const imageData = await FilePickerDialog.configDialog(null, { canUpload: true, hasCaption: true, type: 'image' });

    // Se uma imagem foi selecionada, insira-a no editor.
    if (imageData) {
      try {
        // Obtem o caminho completo da imagem.
        const fullPath = await uniforge.path.join(imageData.path);

        // Lê o arquivo de imagem como um buffer.
        const buffer = await uniforge.fs.readFile(fullPath);
        // Converte o buffer em um Blob com a extensão correta.
        const data = await uniforge.utils.bufferToBlob(buffer, imageData.ext);

        // Cria um objeto de imagem com os dados necessários.
        const image = {
          uuid: imageData.uuid,
          caption: imageData.caption,
          data: data
        }

        // Recupera o elemento do editor TinyMCE.
        const editorTexarea = editor.targetElm;
        // Recupera a contagem de imagens no editor.
        const imgCount = Number(editorTexarea.dataset.imgCounter);

        // Cria o elemento <div> que envolverá a imagem e sua legenda.
        const imgWrapper = document.createElement('figure');
        imgWrapper.dataset.uuid = image.uuid;
        imgWrapper.className = 'img-wrapper image';
        imgWrapper.contenteditable = 'false';

        const newImage = document.createElement('img');
        const imageURL = await uniforge.utils.blobToImage(data.raw, data.ext);
        newImage.src = imageURL;

        imgWrapper.appendChild(newImage);

        if (image.caption) {
          const newCaption = document.createElement('figcaption');
          newCaption.className = 'img-caption';
          newCaption.textContent = `Imagem ${imgCount + 1} - ${image.caption}`;
          newCaption.contenteditable = 'true';

          imgWrapper.appendChild(newCaption);
        }

        // Insira o HTML na posição atual do cursor.
        editor.execCommand('mceInsertContent', false, imgWrapper.outerHTML);
        // Registra o Blob da imagem no banco de dados.
        await uniforge.db.addTextImages(image);
        // Atualiza a contagem de imagens no editor.
        this._updateImageCount(editor);
      } catch (error) {
        this.msgBox.showError('Erro ao carregar a imagem.', error);
      }
    }
  }

  onAddLoremIpsum(editor) {
    const loremIpsum = uniforge.utils.loremIpsum(5);
    editor.execCommand('mceInsertContent', false, loremIpsum);
  }

  /* ---------------------------------------------------------------------------------------------------------------- */
  // UTILITÁRIOS
  /**
   * Gera uma nova opção para o ComboBox de Assuntos.
   * @protected
   * @param {Object} data   - Os dados do assunto.
   * @returns {HTMLElement} - Elemento da nova opção.
   */
  _newSubjectOption(data) {
    const newOption = document.createElement('option');
    newOption.value = data.cid;
    newOption.textContent = data.title;

    return newOption;
  }

  /**
   * Gera uma nova opção para o ComboBox de Importância de Evento.
   * @protected
   * @param {Object} data   - Os dados do tipo.
   * @returns {HTMLElement} - Elemento da nova opção.
   */
  _newImportanceOption(data) {
    const newOption = document.createElement('option');
    newOption.value = data.iid;
    newOption.textContent = data.label;

    return newOption;
  }
  /**
   * Gera uma nova opção para o ComboBox de Tipos de Entradas.
   * @protected
   * @param {Object} data   - Os dados do tipo.
   * @returns {HTMLElement} - Elemento da nova opção.
   */
  _newEntryTypeOption(data) {
    const newOption = document.createElement('option');
    newOption.value = data.etid;
    newOption.textContent = data.label;

    return newOption;
  }
  /**
   * Gera uma nova opção para o ComboBox de Calendários.
   * @protected
   * @param {Object} calendar - Objeto com os dados do Calendário.
   * @returns {HTMLElement} - Elemento da nova opção
   */
  _newCalendarOption(data) {
    const newOption = document.createElement('option');
    newOption.value = data.clid;
    newOption.textContent = data.label;

    return newOption;
  }

  /**
  * Atualiza a contagem de imagens no editor.
  * Obtém o conteúdo atual do editor e conta as tags <img>.
  * Define o atributo data-img-counter do textarea do editor com a contagem de imagens.
  *
  * @param {Object} editor - O editor cujo conteúdo será analisado.
  */
  _updateImageCount(editor) {
    const content = editor.getContent(); // Obtém o conteúdo atual do editor
    const imageCount = (content.match(/<img\b[^>]*>/gi) || []).length; // Conta as tags <img>

    const editorTextarea = editor.targetElm;
    editorTextarea.dataset.imgCounter = imageCount;
  }

  async _initializeImagesInText(editor) {
    const content = editor.getContent(); // Obtém o conteúdo atual do editor
    const searchDiv = document.createElement('div'); // Cria um elemento temporário
    searchDiv.innerHTML = content; // Define o conteúdo do elemento temporário

    const imgArray = searchDiv.querySelectorAll('.img-wrapper'); // Seleciona todos os <div> com a classe 'img-wrapper'
    imgArray.forEach(async (img) => {
      const uuid = img.dataset.uuid; // Obtém o uuid armazenado no <div>
      const data = await uniforge.db.getEntriesTextImage(uuid); // Obtém a imagem do banco de dados
      const imageURL = uniforge.utils.blobToImage(data.raw, data.ext); // Converte o blob da imagem para URL
    });
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
    if (tab) tab.classList.add('active');
  }

  /**
   * Configura o editor TinyMCE com funcionalidades padrões.
   * @private
   * @param {Object} editor - Instância do editor TinyMCE.
   */
  _setupTinyMCE(editor) {
    const tooltip = this.ui.tooltip;

    // Update the image count on editor initialization
    editor.on('init', () => {
      this._updateImageCount(editor)
    });

    // Update the image count whenever the content changes
    editor.on('input', () => this._updateImageCount(editor));
    editor.on('change', () => this._updateImageCount(editor));
    editor.on('NodeChange', () => this._updateImageCount(editor));

    // Adiciona um botão para criar link no corpo do editor.
    editor.ui.registry.addButton('entryLink', {
      tooltip: 'Criar link',
      icon: 'bookmark',
      onAction: () => { this.onEntryLinkCreation(editor); }
    });

    // Adiciona um botão para enviar ao corpo do editor.
    editor.ui.registry.addButton('sendImage', {
      tooltip: 'Enviar Imagem',
      icon: 'image',
      onAction: () => { this.onUploadImage(editor); }
    });

    // Adiciona um botão para adicionar Lorem Ipsum ao corpo do editor.
    editor.ui.registry.addButton('addLoremIpsum', {
      tooltip: 'Adicionar Lorem Ipsum',
      icon: 'format-code',
      onAction: () => { this.onAddLoremIpsum(editor); }
    });
  }
  /**
   * Configura o editor TinyMCE com funcionalidades inline.
   * @protected
   * @param {Object} editor - Instância do editor TinyMCE.
   */
  _setupInlineTinyMCE(editor) {
    // Número máximo de caractéres do editor Tiny MCE de floreio.
    const maxCharacters = 255;

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

  _filterFoldersEntryTypes(folder) {
    const sectionId = folder.dataset.id;
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
     * Adiciona uma nova entrada no banco de dados e atualiza a lista de eventos associados.
     * 
     * @async
     * @param {Object} data - Dados da entrada a ser adicionada.
     * @param {string} [data.sid] - ID da seção associada à entrada.
     * @param {string} [data.etid] - ID do tipo de entrada.
     * @param {string} [data.title] - Título da entrada.
     * @param {string} [data.flavor] - Texto de descrição ou sabor.
     * @param {string} [data.htmlString] - String HTML a ser associada à entrada.
     * @param {string|Buffer} [data.rawData] - Dados binários da imagem associada, opcional.
     * @param {string} [data.ext='jpeg'] - Extensão da imagem, padrão é 'jpeg'.
     * @param {boolean} [data.isDraft] - Indica se a entrada é um rascunho.
     * 
     * @returns {Promise<void>} - Não retorna valor, mas exibe uma mensagem de sucesso ao concluir.
    */
  async _addEntry(data) {
    let result = await uniforge.db.addEntry(data);
    data.eid = result.addedId;

    const events = Object.values(this.#events);
    if (events.length > 0) {
      this._handleEventSave(data, events);
    }

    this.msgBox.showInfo('Entrada criada com sucesso.');
  }

  /**
       * Atualiza uma entrada no banco de dados com base nos dados fornecidos.
       * 
       * @param {Object} data                     - Dados da entrada a serem atualizados.
       * @param {string} data.eid                 - ID da entrada a ser atualizada.
       * @param {string} data.sid                 - ID da seção associada à entrada.
       * @param {string} data.etid                - ID do tipo de entrada.
       * @param {string} data.title               - Título da entrada.
       * @param {string} data.flavor              - Texto de descrição ou sabor.
       * @param {string} data.htmlString          - String HTML a ser associada à entrada.
       * @param {string|Buffer} [data.rawData]    - Dados binários da imagem associada (opcional).
       * @param {string} [data.ext='jpeg']        - Extensão da imagem, padrão é 'jpeg'.
       * @param {boolean} data.isDraft            - Indica se a entrada é um rascunho.
       * 
       * @returns {Promise<Object>} - Resultado da execução do comando de atualização.
       */
  async _updateEntry(data) {
    await uniforge.db.updateEntry(data);

    const events = Object.values(this.#events);
    if (events.length > 0) {
      this._handleEventSave(data, events);
    }

    this.msgBox.showInfo('Entrada atualizada com sucesso.');
  }

  /**
     * Trata a lista de eventos a serem salvos.
     * 
     * Percorre a lista de eventos e aplica a ação correspondente
     * ao dbAction de cada evento. Se o dbAction for 'd', deleta o
     * evento. Se for 'a', valida o evento e o adiciona ao banco de
     * dados. Se for 'u', valida o evento e o atualiza no banco de
     * dados.
     * 
     * @param {Object} data         - Dados da Entrada que os eventos estão associados.
     * @param {Object[]} events     - Lista de eventos a serem salvos.
     * 
     * @returns {Promise<boolean>}  - Retorna true se todos os eventos forem salvos com sucesso, false caso contrário.
     */
  async _handleEventSave(data, events) {
    for (const event of events) {
      event.sid = data.sid;
      event.source = data.eid;

      const result = await uniforge.db.validateEvent(event);

      switch (event.dbAction) {
        case 'd': {
          await uniforge.db.deleteEvent(event.evid);
        } break;
        case 'a': {
          if (result !== '') {
            this.msgBox.showWarning(result);
            return false;
          }
          await uniforge.db.addEvent(event);
        } break;
        case 'u': {
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
}
