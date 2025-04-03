import EntryForm from "./entryForm.js";
import LineageManager from "../../scripts/managers/lineageManger.js";
import DatePicker from "../datePicker.js";
import EntrySearchDialog from "../dialogs/entrySearchDialog.js";
import Dialogs from "../dialogs/dialog.js";

export default class EntityForm extends EntryForm {
  /**
    * Constrói uma instância da classe derivada, inicializando as propriedades e configurando o conteúdo.
    * @class
    * @extends EntryForm
    */
  constructor() {
    // Chama o construtor da classe pai com o parâmetro overlay.
    super('Entidade');

    this.template = 'entityForm'; // Define o template do formulário. 

    this.type = 'entity'; // Define o tipo do formulário. 

    // Inicializa o Gerenciador de Linhagens, enviando o container que conterá a árvore.
    this.manager = new LineageManager();

    /**
    * @property {object} datePickers - Um objeto que gerencia os seletores de data para registro de entradas.
    * Contém duas instâncias de `DatePicker` para 'startDate' (data de início) e 'endDate' (data de término).
    */
    this.datePickers = {
      start: new DatePicker('startDate'),
      end: new DatePicker('endDate')
    }
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

  get treeContainer() {
    return this.querySelector('#treeContainer');
  }

  /* ---------------------------------------------------------------------------------------------------------------- */
  // GETTERS E SETTERS
  /**
  * Obtém os dados unificados necessários para o funcionamento do formulário.
  * @implements Implemente um método filho para as especificidades de cada formulário.
  * @async
  * @returns {object} Objeto de dados unificado.
  */
  async prepareData() {
    super.prepareData();

    this.data.entryTypes = uniforge.doc.entryTypes.toObject();
    this.data.relevances = uniforge.doc.relevances.toObject();
    this.data.calendars = uniforge.doc.calendars.toObject();

    //this.manager.fromFamilyScript(this.manager.testScript);  
    //this.manager.fromFamilyScript(this.manager.noLinksTestScript); 

    return this.data;
  }

  /** @override */
  prepareFolders(data) {
    const folders = uniforge.doc.sections.filter(s => {
      const c = uniforge.doc.chapters.get(s.cid);
      return (c && c.type === 3);
    });
    data.folders = folders.sort();
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
        this._toggleFounderInfo(null);

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
        this._toggleFounderInfo(null);

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

    // Configura o visualizador de árvore associado ao formulário.
    this.configureDiagram();
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
    * Configura o editor TinyMCE para o texto de floreio da linhagem da Entrada.
    */
  async configureLineageFlavorTinyMCE() {
    if (tinymce.get('lineageFlavorEditor')) {
      tinymce.remove('#lineageFlavorEditor');
    }

    const options = uniforge.utils.mergeObjects(uniforge.tinymceOptions.simple, {
      selector: 'div#lineageFlavorEditor',
      placeholder: "Descrição da Linhagem...",
      init_instance_callback: (editor) => {
        editor.setContent(""); // Garante que o editor seja iniciado vazio.
      },
      setup: (editor) => { this._setupInlineTinyMCE(editor); }
    });

    await tinymce.init(options);
  }

  configureDiagram() {
    this.manager.buildTree();
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
    entryButton.addEventListener('click', (event) => { this.onFounderButtonClick(event); });

    const removeEntryButton = this.querySelector('#removeEntryButton');
    removeEntryButton.addEventListener('click', (event) => { this.onRemoveFounderClick(event); });
  }

  /**@inheritdoc */
  onDeleteSwitchChange(event) {
    super.onDeleteSwitchChange(event);

    const removeEntryButton = this.querySelector('#removeEntryButton');
    removeEntryButton.hidden = !event.target.checked;
  }

  async onFounderButtonClick(event) {
    event.stopPropagation();

    const headerInfo = this.querySelector('.header-info');
    const ltid = headerInfo.dataset.ltid;

    const entry = await EntrySearchDialog.configDialog({ ltid: ltid, isFounder: true, fromLineage: true });

    if (entry) {
      this.founder = entry;

      // Alterna a visibilidade do grupo de eventos.
      this._toggleFounderInfo(entry);

      this._buildDiagram(entry.tree);
    }
  }

  /**
       * Manipulador de evento para retirar um evento de uma entrada.
       * @param {Event} event - Evento de clique no bot o de Remover Evento.
       * @fires
       */
  async onRemoveFounderClick(event) {
    event.stopPropagation();

    // Confirma a desvinculação da Entrada ao Evento.
    if (await Dialogs.confirm('Desvincular Entrada', 'Deseja desvincular o fundador da Árvore? Isso irá apagar todos os dados associados a ela.')) {

      // Alternar a visibilidade do grupo de eventos.
      this._toggleFounderInfo();

      // Limpar os dados da Entrada desvinculada.
      this._clearEntryData();

      // A Entrada será retirada.
      this.hasEntry = false;
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
    const isEntryUpdate = options.isEntryUpdate ?? false;

    const headerInfo = this.querySelector('.header-info');
    const isDraftSwitch = this.querySelector('#isDraftSwitch');

    uniforge.utils.mergeObjects(data, {
      ltid: headerInfo.dataset.ltid,
      sid: this.selection.folder.dataset.id,
      founder: this.founder.eid,
      tree: this.manager.toFamilyScript(),
      isDraft: isDraftSwitch.checked
    });

    const validate = uniforge.db.validateLineage(data);
    if (validate !== '') {
      this.msgBox.showWarning(validate);
      return false;
    }

    if (this.founder.lineageTypes && this.founder.lineageTypes.length > 0) {
      const lineageTypes = this.founder.lineageTypes;
      lineageTypes.forEach(type => {
        switch (type.dbAction) {
          case 'a': {
            uniforge.db.addLineageType(type);
          } break;
          case 'u': {
            uniforge.db.updateLineageType(type);
          } break;
          case 'd': {
            unforge.db.deleteLineageType(type);
          } break;
          default: break;
        }
      });
    }

    if (isEntryUpdate) {
      data.eid = options.id;
      data.evid = headerInfo.dataset.evid;

      await uniforge.db.updateLineageTree(data);
      this.msgBox.showInfo('Linhagem atualizada com sucesso.');
    }
    else {
      await uniforge.db.addLineageTree(data);
      this.msgBox.showInfo('Linhagem criada com sucesso.');
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

    const headerInfo = this.querySelector('.header-info');
    headerInfo.dataset.ltid = uniforge.db.generateID();
  }
  /**
  * Gerencia cliques duplos em itens de entrada.
  * @inheritdoc
  * @param {MouseEvent} event - O evento de clique duplo.
  */
  async onEntryItemDoubleClick(event) {
    await super.onEntryItemDoubleClick(event, { dataSource: 'lineages' });
    const entry = this.data.entry;

    if (entry) {
      this._toggleFounderInfo(entry);
      this._buildDiagram(entry.tree);
    } else {
      this.msgBox.showWarning('Erro ao carregar a entrada.');
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
    if (tab) tab.classList.add('active');
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
   * Alterna a visibilidade das informações da Entrada vinculada.
   * @protected
   */
  async _toggleFounderInfo(entry) {
    // Selecionar o grupo de Eventos.
    const entryInfo = this.querySelector('#entryInfo');
    // Selecionar o botão de Gerar Evento.
    const entryButton = this.querySelector('#entryButton');

    // Se a Entrada (Source) existe, carregue os dados da entrada.
    if (entry) {
      entryInfo.dataset.eid = entry.eid;

      await this._loadFounderData(entry);

      this.hasEntry = true;

      // Alterar a visibilidade do botão de Gerar Evento.
      entryButton.classList.add('hidden');

      // Alternar a visibilidade das informações do Evento.
      entryInfo.classList.remove('hidden');
    } else {
      // Limpar os dados da Entrada desvinculada.
      this.hasEntry = false;

      // Limpar os dados da Árvore.
      this.manager.clearTree(true);

      // Alterar a visibilidade do botão de Gerar Evento.
      entryButton.classList.remove('hidden');

      // Alternar a visibilidade das informações do Evento.
      entryInfo.classList.add('hidden');
    }
  }

  async _loadFounderData(entry) {
    const entryTitle = this.querySelector('#entryTitle');
    entryTitle.textContent = entry.givenName;
  }

  async _clearEntryData() {
    // Selecionar o grupo de Eventos.
    const entryInfo = this.querySelector('#entryInfo');

    this.manager.removeNode(entryInfo.dataset.eid);
    delete entryInfo.dataset.eid;
  }

  _buildDiagram(tree) {
    this.manager.fromFamilyScript(tree);
    this.manager.buildTree(); // Atualiza a árvore com os dados da entrada.
  }
}