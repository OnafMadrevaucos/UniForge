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

    this.data.labels = {
      noLineageLink: 'A Entrada não está vinculada a nenhuma Linhagem.',
    };

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

    // Configura o editor TinyMCE de descrição da Árvore de Linhagem associada à Entrada.
    await this.configureLineageFlavorTinyMCE();

    // Configura o visualizador de árvore associado ao formulário.
    this.configureDiagram();
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

  /**
  * Limpa o conteúdo do formulário
  * 
  * @param {Boolean} clearSidebar - Flag para habilitar/desabilitar a limpeza da seleção da sidebar.
  */
  clearContent(clearSidebar = true) {
    super.clearContent(clearSidebar);

    const lineageFlavorEditor = tinymce.get('lineageFlavorEditor');
    lineageFlavorEditor.setContent('');
  }



  /* ---------------------------------------------------------------------------------------------------------------- */
  // LISTENERS
  /**
  * Configura ouvintes de eventos básicos para o formulário.
  * @inheritdoc
  */
  activateListeners() {
    super.activateListeners();    

    const newLineageButton = this.querySelector('#newLineageButton');
    newLineageButton.addEventListener('click', (event) => { this.onNewLineageClick(event); });

    const linkLineageButton = this.querySelector('#linkLineageButton');
    linkLineageButton.addEventListener('click', (event) => { this.onLinkLineageClick(event); });
  }

  /**@inheritdoc */
  onDeleteSwitchChange(event) {
    super.onDeleteSwitchChange(event);

    const removeEntryButton = this.querySelector('#removeEntryButton');
    removeEntryButton.hidden = !event.target.checked;
  }

  /*
  async onFounderButtonClick(event) {
    event.stopPropagation();

    const headerInfo = this.querySelector('.header-info');
    const ltid = headerInfo.dataset.ltid;

    const entry = await EntrySearchDialog.configDialog({ ltid: ltid, isFounder: true, fromLineage: true });

    if (entry) {
      this.founder = entry;

      // Alterna a visibilidade do grupo de eventos.
      this._toggleLineageTree(entry);

      this._buildDiagram(entry.tree);
    }
  }*/

  
  /**
  * Manipulador de evento para retirar um evento de uma entrada.
  * @param {Event} event - Evento de clique no bot o de Remover Evento.
  * @fires
  
  async onRemoveFounderClick(event) {
    event.stopPropagation();

    // Confirma a desvinculação da Entrada ao Evento.
    if (await Dialogs.confirm('Desvincular Entrada', 'Deseja desvincular o fundador da Árvore? Isso irá apagar todos os dados associados a ela.')) {

      // Alternar a visibilidade do grupo de eventos.
      this._toggleLineageTree();

      // Limpar os dados da Entrada desvinculada.
      this._clearEntryData();

      // A Entrada será retirada.
      this.hasEntry = false;
    }
  }
  */
  

  onNewLineageClick(event) {
    event.stopPropagation();

    // Exibe o controle da Árvore de Linhagem.
    this._toggleLineageTree(true);
  }

  onLinkLineageClick(event) {
    event.stopPropagation();

    // Exibe o controle da Árvore de Linhagem.
    this._toggleLineageTree(true);
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
      this._toggleLineageTree(entry);
      this._buildDiagram(entry.tree);
    } else {
      this.msgBox.showWarning('Erro ao carregar a entrada.');
    }
  }  

  /**
   * Alterna a visibilidade das informações da Árvore de Linhagem.
   * @protected
   */
  async _toggleLineageTree(hasLineage) {
    // Selecionar o container da Árvore da Linhagem.
    const lineageContainer = this.querySelector('#lineageContainer');

    // Selecionar o grupo de botões de configuração inicial da Árvore de Linhagem.
    const lineageGroup = this.querySelector('#lineageGroup');

    // Se a Entrada (Source) existe, carregue os dados da entrada.
    if (hasLineage) {
      // Exibir o container da Árvore de Linhagem.
      lineageContainer.classList.remove('hidden');
      // Ocultar o grupo de botões de configuração inicial da Árvore de Linhagem.
      lineageGroup.classList.add('hidden');
    } else {
      // Ocultar o container da Árvore de Linhagem.
      lineageContainer.classList.add('hidden');
      // Exibir o grupo de botões de configuração inicial da Árvore de Linhagem.
      lineageGroup.classList.remove('hidden');
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

  /**
   * Constroi a árvore de linhagem com base nos dados da entrada.
   * 
   * @param {string} tree - Dados da árvore em formato de FamilyScript.
   * @protected
  */
  _buildDiagram(tree) {
    this.manager.fromFamilyScript(tree);
    this.manager.buildTree(); // Atualiza a árvore com os dados da entrada.
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
    // Inserir tratamento da adição da Árvore de Linhagem aqui...

    super._addEntry(data);
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
    //Inserir tratamento da atualização da Árvore de Linhagem aqui...

    super._updateEntry(data);
  }  

  async _handleLineageSave(data, lineages) {
    // Percorre a lista de linhagens associadas à entrada.
    for (const lineage of lineages) {
      // Adiciona o identificador de Seção da Entrada à linhagem.
      lineage.sid = data.sid;
    }
  }
}