import EntryForm from "./entryForm.js";
import FamilyManager from "../../scripts/managers/familyManger.js";
import DatePicker from "../datePicker.js";
import EntrySearchDialog from "../dialogs/entrySearchDialog.js";
import Dialogs from "../dialogs/dialog.js";

export default class LineageForm extends EntryForm {
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

    this.template = 'lineageForm'; // Define o template do formulário. 

    this.type = 'lineage'; // Define o tipo do formulário. 

    this.manager = new FamilyManager(this.treeContainer); // Define o gerenciador de árvores genealógicas.

    /**
    * @property {object} datePickers - Um objeto que gerencia os seletores de data para registro de entradas.
    * Contém duas instâncias de `DatePicker` para 'startDate' (data de início) e 'endDate' (data de término).
    */
    this.datePickers = {
      start: new DatePicker('startDate'),
      end: new DatePicker('endDate')
    }
  }

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
  prepareData() {
    super.prepareData();

    this.data.entryTypes = uniforge.doc.entryTypes.toObject();
    this.data.relevances = uniforge.doc.relevances.toObject();
    this.data.calendars = uniforge.doc.calendars.toObject();

    this.manager.fromFamilyScript(this.manager.testScript);
    this.manager.renderTree();

    this.preparePeople(this.data);

    return this.data;
  }

  /** @inheritdoc */
  prepareFolders(data) {
    const folders = uniforge.doc.sections.filter(s => {
      const c = uniforge.doc.chapters.get(s.cid);
      return (c && c.type === 3);
    });
    data.folders = folders.sort();
  }

  preparePeople(data) {
    const people = uniforge.doc.entries.toObject().filter(e => e.etid == 6);
    data.people = people.sort();
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
  }

  /**@inheritdoc */
  onDeleteSwitchChange(event) {
    super.onDeleteSwitchChange(event);

    const removeEntryButton = this.querySelector('#removeEntryButton');
    removeEntryButton.hidden = !event.target.checked;
  }

  async onEntryButtonClick(event) {
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
    const founder = this.querySelector('#founder');

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
    const entryTitle = this.querySelector('#entryTitle');
    entryTitle.textContent = entry.title;
  }

  async _clearEntryData() {
    // Selecionar o grupo de Eventos.
    const entryInfo = this.querySelector('#entryInfo');
    delete entryInfo.dataset.eid;
  }
}