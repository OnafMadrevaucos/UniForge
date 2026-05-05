/**
 * Importações de módulos necessários.
 */
import BaseForm from "./baseForm.js";
import LinkDialog from "../dialogs/linkDialog.js";
import Dialogs from "../dialogs/dialog.js";
import DatePicker from "../datePicker.js";
import Entry from "../../common/documents/entry.mjs";
import EntryEvent from "../../common/documents/event.mjs";
import FilePickerDialog from "../dialogs/filePickerDialog.js";
import { triggerHook } from "../../scripts/hooks.js";

/**
 * Classe EntryForm estende a funcionalidade da classe BaseForm para gerenciar formulários que manipulem Entradas.
 * @class
 * @extends SidebarForm
 */
export default class SimpleEntryForm extends BaseForm {
  /**
   * Construtor da classe EntryForm.
   * 
   * @param {HTMLElement} sourceBtn   - O botão que originou a chamada do formulário.
   * @param {Entry} entry             - Os dados da Entrada manipulada pelo formulário.
   */
  constructor(sourceBtn, entry, onCloseCallback=null, options = {}) {
    if (!sourceBtn) throw new Error('O botão de origem não pode ser nulo ou indefinido.');
    if (!entry) throw new Error('É necessário informar uma entrada válida.');

    super(entry.title, uniforge.utils.mergeObjects(options, {
      height: '1100px',
      width: '1000px'
    }));

    this.sourceBtn = sourceBtn;

    this.document = entry;

    this.onCloseCallback = onCloseCallback;

    /**
     * @type {string} - O modelo HTML utilizado pelo formulário.
     */
    this.template = 'simpleEntryForm';

    /**
    * Estados válidos para os elements do formulário.
    * @type {Object<number, number>}
    */
    this.states = this._states;

    /**
     * Estado atual dos elements do formulário.
     * @type {number}
     */
    this.currentEventState = 0;

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
    * @property {Object} datePickers - Um objeto que gerencia os seletores de data para registro de entradas.
    * Contém duas instâncias de `DatePicker` para 'startDate' (data de início) e 'endDate' (data de término).
    */
    this.datePickers = {
      startDate: new DatePicker('startDate', this),
      endDate: new DatePicker('endDate', this)
    }

    // Armazena o ID do evento selecionado.
    this.selection = {
      entry: entry,
      event: null
    }
  }

  /**
  * Conjunto de filtros de item que representam os estados aplicáveis ao controle de Eventos na classe EntryForm.
  * Os estados estão mapeados para números inteiros que representam ações específicas.
  * 
  * @type {Object<number, number>}
  * @private
  * @property {number} default  - Representa o estado padrão do controle de evento (valor 0).
  * @property {number} adding   - Representa o estado de salvamento de um evento novo (valor 1).
  * @property {number} editing  - Representa o estado de salvamento de um evento pré-existente (valor 2). 
  */
  #eventStates = {
    default: 0,
    adding: 1,
    editing: 2
  }

  /** Eventos temporários, vinculados à Entrada até serem salvos (ou não).
    * @property {Object} events - Objeto que armazena os eventos vinculados à entrada.    
    * @private
    * @default {}
    */
  #events = {};

  /** Identificador da Entrada atual.
   * @returns {Object} 
   * */
  get eid() { return this.document.eid; }

  /* ---------------------------------------------------------------------------------------------------------------- */
  // GETTERS E SETTERS 
  /**
  * @overload
  * @inheritdoc
  */
  get defaultOptions() {
    const config = super.defaultOptions;
    return uniforge.utils.mergeObjects(config, {
      classes: [...config.classes, 'flexrow']
    });
  }

  get type() {
    return this.document.section.tome;
  }

  get query() {
    const query = {
      main_editor: `MainEditor-${this.uuid}`,
      flavor_editor: `FlavorEditor-${this.uuid}`,
      event_editor: `EventEditor-${this.uuid}`,
    }
    return uniforge.utils.mergeObjects(super.query, query);
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

  get _eventStates() {
    return this.#eventStates;
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
      if (!content.isEmpty() && !(typeof content === 'string')) throw new TypeError('O conteúdo deve ser uma string.');

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
    * Obtém os dados unificados necessários para o funcionamento do formulário.
    * @implements Implemente um método filho para as especificidades de cada formulário.
    * @async
    * @returns {object}  - Objeto de dados unificado.
    */
  prepareData() {
    // Informa ao formulário atual o seu tipo.
    this.data.type = this.type;

    this.data.entryTypes = uniforge.doc.entryTypes.toArray();
    this.data.relevances = uniforge.doc.relevances.toArray();
    this.data.calendars = uniforge.doc.calendars.toArray();

    return this.data;
  }

  /* ---------------------------------------------------------------------------------------------------------------- */
  // INTERFACE DE USUÁRIO
  /**
   * @inheritdoc
  * Inicia a construção do formulário.
  */
  async initialize() {
    await super.initialize();

    this.loadEntry();

    this.controlStates();
  }

  /**
   * @inheritdoc
   */
  close() {
    this.sourceBtn.classList.remove('disabled');

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

    if (this.onCloseCallback) this.onCloseCallback();
  }

  /**
   * Carrega os dados da Entrada.
   * @protected
  */
  async loadEntry() {
    this.clearContent();
    const entry = this.document;

    if (entry) {
      const headerInfo = this.querySelector('.header-info');
      headerInfo.dataset.cid = entry.cid ?? null;
      headerInfo.dataset.sid = entry.sid ?? null;

      headerInfo.dataset.eid = entry.eid;

      const displayedImage = this.querySelector('#displayedImage');
      const titleInput = this.querySelector('#entryTitleInput');

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
      const events = entry.events.toArray();

      events.forEach(event => {
        event.dbAction = '-';

        this.#events[event.evid] = event;
      });
      this._generateEventListItems();

    } else {
      this.msgBox.showWarning('Erro ao carregar a entrada.');
    }
  }

  /**
   * Habilita/desabilita os controles do formulário.
   * @protected
   */
  controlStates() {
    const titleInput = this.querySelector('#entryTitleInput');
    const imageContainer = this.querySelector('#imageContainer');
    const infoSet = this.querySelector('.info-set:not(.not-disable)');
    const deleteSwitch = this.querySelector('#deleteSwitch');
    const deleteCheckbox = deleteSwitch.querySelector('#checkbox');

    deleteCheckbox.click();

    this.flavorEditor.mode.set('design');
    this.mainEditor.mode.set('design');
  }

  /**
   * Habilita/desabilita os controles dos eventos do formulário.
   * @param {Number} state - O novo estado do evento.
   * @protected
   */
  controlEventStates(state, options = {}) {
    const eventInfoSet = this.querySelector('.event-info fieldset.info-set');

    const addEventButton = this.querySelector('#addEventButton');
    const cancelEventButton = this.querySelector('#cancelEventButton');

    switch (state) {
      // ESTADO DE ADIÇÃO DE EVENTO.
      case this._eventStates.adding: {
        // Limpa o evento selecionado.
        this.selection.event = null;

        // Limpa a aba de eventos.
        this.clearEventTab();

        // Habilita os elementos de entrada de dados.
        eventInfoSet.disabled = false;

        addEventButton.classList.remove('disabled');
        cancelEventButton.classList.remove('hidden');

      } break;
      // ESTADO DE MANIPULAÇÃO DE EVENTO.
      case this._eventStates.editing: {
        // Habilita os elementos de entrada de dados.
        eventInfoSet.disabled = false;

        addEventButton.classList.remove('disabled');
        cancelEventButton.classList.remove('hidden');

      } break;
      // ESTADO PADRÃO.
      // Estado exibido quando a tab de eventos é aberta ou quando uma ação é cancelada.
      default: {
        // Limpa a aba de eventos.
        this.clearEventTab();

        // Desativa os elementos de entrada de dados.
        eventInfoSet.disabled = true;

        addEventButton.classList.add('disabled');
        cancelEventButton.classList.add('hidden');

        // Limpa o evento selecionado.
        this.selection.event = null;

        const eventList = this.querySelector('#entryEvents');
        eventList.querySelectorAll('.item').forEach(item => item.classList.remove('selected'));

      } break;
    }

    this.currentEventState = state;
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
    // Configura o editor Tiny MCE principal .
    await this.configureTinyMCE();

    // Configura o editor TinyMCE de floreio associado ao formulário.
    await this.configureFlavorTinyMCE();

    // Configura o editor TinyMCE de floreio dos eventos associados à entrada do formulário.
    await this.configureEventFlavorTinyMCE();
  }

  /**
   * Limpa o conteúdo do formulário
   * @param {Boolean} clearSidebar - Flag para habilitar/desabilitar a limpeza da seleção da sidebar (true por padrão).
   */
  clearContent() {
    this.clearImage();

    const titleInput = this.querySelector('#entryTitleInput');
    titleInput.value = '';

    const isDraftSwitch = this.querySelector('#checkbox');
    isDraftSwitch.checked = false;

    // Limpa todos os editores Tiny MCE inicializados.
    this.mainEditor = '';
    this.flavorEditor = '';

    if (this.hasEvent) {
      this.eid = uniforge.defaults.emptyString;;
      this.#events = [];

      const entryTypeSelect = this.querySelector('#entryType');
      entryTypeSelect.value = 1;

      const entryEvents = this.querySelector('#entryEvents');
      entryEvents.innerHTML = '';

      this.clearEventTab();
    }
  }

  /**
  * Limpa a imagem exibida definindo sua fonte para uma URL de imagem em branco.
  * Se a imagem ainda não tiver a classe 'empty', ela adiciona a classe 'empty'.
  */
  clearImage() {
    const displayedImage = this.querySelector('#displayedImage');
    if (displayedImage) {
      if (!displayedImage.classList.contains('empty'))
        displayedImage.classList.add('empty');

      displayedImage.src = this.blankImgUrl;
    }
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
      this.datePickers.startDate.selectFullDate(...event.date.start.expand());
      // Se houver uma data de fim, carregue o DatePicker com a data do evento.
      if (event.date.end)
        this.datePickers.endDate.selectFullDate(...event.date.end.expand());
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
    const imageContainer = this.querySelector('#imageContainer');
    const displayedImage = this.querySelector('#displayedImage');
    const fileInput = this.querySelector('#hiddenFileInput');
    const deleteSwitch = this.querySelector('#deleteSwitch');
    const deleteCheckbox = deleteSwitch.querySelector('#checkbox');

    const saveButton = this.querySelector('#saveButton');

    deleteCheckbox.addEventListener('change', (event) => { this.onDeleteSwitchChange(event); });

    // Há um contêiner de imagem?
    if (imageContainer) {
      // Adiciona um evento para lidar com a seleção de uma nova imagem.
      fileInput.addEventListener('change', (event) => { this.onChangeImage(event, displayedImage); });

      // Adiciona um evento de clique no contêiner de imagem para abrir o seletor de arquivos.
      imageContainer.addEventListener('click', (event) => { this.onImageClick(event, fileInput, displayedImage); });
      imageContainer.addEventListener('contextmenu', (event) => { this.onImageRightClick(event, displayedImage); });
    }

    saveButton.addEventListener('click', (event) => { this.onSaveClick(event); });

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

    const newEventButton = this.querySelector('#newEventButton');
    newEventButton.addEventListener('click', (event) => { this.onNewEventClick(event); });

    const cancelEventButton = this.querySelector('#cancelEventButton');
    cancelEventButton.addEventListener('click', (event) => { this.onCancelEventClick(event); });

    const addEventButton = this.querySelector('#addEventButton');
    addEventButton.addEventListener('click', (event) => { this.onAddEventClick(event); });
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
   * Manipulador de evento para alterar a imagem exibida.
   * @param {Event} event                     - Evento disparado pelo input de arquivo.
   * @param {HTMLImageElement} fileInput      - Elemento de carga de arquivo de imagem.
   * @param {HTMLImageElement} displayedImage - Elemento de imagem a ser atualizado.
   */
  async onImageClick(event, fileInput, displayedImage) {
    if (this.canDelete) {
      const confirm = await Dialogs.confirm('Apagar Imagem', 'Deseja remover a imagem?')
      if (confirm) {

        this.selectedImg.rawData = uniforge.defaults.emptyString;;

        displayedImage.src = this.blankImgUrl;
        displayedImage.classList.add('empty');
      }
    } else {
      // Abre o diálogo de seleção de imagem.
      const imageData = await FilePickerDialog.configDialog(null, { canUpload: true, hasCaption: false, type: 'image' });

      if (imageData) {
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

    if (this.selectedImg.rawData && !displayedImage.classList.contains('empty')) {
      const imageUrl = await uniforge.utils.blobToImage(this.selectedImg.rawData, this.selectedImg.ext);
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
  * Trata o evento de clique em uma seção de uma aba do formulário.
  * @param {Event} event - O evento de clique no botão de seção.
  */
  onSectionButtonClick(event) {
    event.stopPropagation();
    this._toggleSectionButtons(false, true);

    const button = event.target.closest('button');
    button.classList.add('selected');

    this._activateTab(button.dataset.tab);
  }

  onEventItemClick(clickEvent) {
    clickEvent.stopPropagation();
    const clickedEvent = clickEvent.target.closest('.item');
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

    calendarType.disabled = true;

    this.configureDatePickers(event);

    this.eventEditor = event.flavor;

    this.selection.event = clickedEvent;
    this.controlEventStates(this._eventStates.editing);
  }

  onNewEventClick(event) {
    event.stopPropagation();

    this.clearEventTab();
    this.controlEventStates(this._eventStates.adding);
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

    const evid = this.selection.event ? this.selection.event.dataset.value : null;

    const newEvent = new EntryEvent({
      evid: evid,
      sid: this.document.sid,
      title: eventTitle.value,
      etid: eventEntryType.value,
      source: this.eid,
      relevance: relevance.value,
      clid: Number(calendarType.value),
      flavor: this.eventEditor.getContent() ?? '',
      s_day: this.datePickers.startDate.date.day,
      s_month: this.datePickers.startDate.date.month,
      s_year: this.datePickers.startDate.date.year,
      e_day: this.datePickers.endDate.isEmpty ? null : this.datePickers.endDate.date.day,
      e_month: this.datePickers.endDate.isEmpty ? null : this.datePickers.endDate.date.month,
      e_year: this.datePickers.endDate.isEmpty ? null : this.datePickers.endDate.date.year
    });

    newEvent.dbAction = evid ? 'u' : 'a';

    const result = uniforge.db.validateEvent(newEvent);
    if (result !== '') {
      this.msgBox.showWarning(result);
      return;
    }

    this.#events[evid] = newEvent;
    this._generateEventListItems();

    this.controlEventStates(this._eventStates.default);
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

  onCancelEventClick(event) {
    event.stopPropagation();
    this.controlEventStates(this._eventStates.default);
  }

  /**
    * Trata o evento de registro de uma nova entrada.
    * @param {Event} event - Evento de clique no botão de Salvar.
    */
  async onSaveClick(event) {
    event.stopPropagation();

    const item = this.selection.entry;

    try {
      if (await Dialogs.confirm('Atualizar', 'Deseja atualizar a entrada?')) {
        const imgInput = this.querySelector('#hiddenFileInput');
        const titleInput = this.querySelector('#entryTitleInput');
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

        this._updateEntry(data);

        // Finaliza a transação de salvamento.
        await uniforge.db.commitTransaction();       

        await this.close();

        // Atualiza documentos.
        await triggerHook('simpleEntryFormClosed');
      }
    } catch (error) {
      this.msgBox.showError(error.message, error);

      // Faz rollback em caso de erro no processo de salvamento.
      await uniforge.db.rollbackTransaction(error);
    }
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
      const imageURL = uniforge.utils.blobToImage(data.img, data.ext); // Converte o blob da imagem para URL
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
      const item = uniforge.parser.generateItemList(event);

      // Adiciona o evento de clique no item de Evento.
      item.addEventListener('click', (event) => { this.onEventItemClick(event); });

      // Adiciona o item na lista de Eventos.
      entryEvents.appendChild(item);
    });

    // Limpa a aba de Eventos, após qualquer alteração da Lista de Eventos.
    this.clearEventTab();
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
       * Atualiza uma entrada no banco de dados com base nos dados fornecidos.
       * 
       * @param {Object} entry                     - Dados da entrada a serem atualizados.
       * @param {string} entry.eid                 - ID da entrada a ser atualizada.
       * @param {string} entry.sid                 - ID da seção associada à entrada.
       * @param {string} entry.etid                - ID do tipo de entrada.
       * @param {string} entry.title               - Título da entrada.
       * @param {string} entry.flavor              - Texto de descrição ou sabor.
       * @param {string} entry.htmlString          - String HTML a ser associada à entrada.
       * @param {string|Buffer} [entry.rawData]    - Dados binários da imagem associada (opcional).
       * @param {string} [entry.ext='jpeg']        - Extensão da imagem, padrão é 'jpeg'.
       * @param {boolean} entry.isDraft            - Indica se a entrada é um rascunho.
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
      const result = await uniforge.db.validateEvent(event);

      switch (event.dbAction) {
        case 'd': {
          await uniforge.db.deleteEvent(event.evid);

          const timelines = uniforge.doc.timelines.toArray().find(t => {
            return t.events.hasId(event.evid);
          });

          for(let timeline of timelines) {
            await uniforge.db.deleteTimelineEvent(timeline.tid, event.evid);
          }
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
