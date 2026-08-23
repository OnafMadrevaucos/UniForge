import EntryForm from "./entryForm.js";
import EntityManager from "../../scripts/managers/entityManger.js";
import DatePicker from "../controls/datePicker.js";
import EntrySearchDialog from "../dialogs/entrySearchDialog.js";
import Dialogs from "../dialogs/dialog.js";
import Entity from "../../common/documents/entity.mjs";

export default class EntityForm extends EntryForm {
  /**
    * Constrói uma instância da classe derivada, inicializando as propriedades e configurando o conteúdo.
    * @class
    * @extends EntryForm
    */
  constructor(options = {}) {
    // Chama o construtor da classe pai com o parâmetro overlay.
    super('Entidade', options);

    this.template = 'entityForm'; // Define o template do formulário. 

    this.type = 'entity'; // Define o tipo do formulário. 

    // Inicializa o Gerenciador de Linhagens, enviando o container que conterá a árvore.
    this.manager = new EntityManager(this);

    this.documentClass = Entity;
  }

  #newTree = false;

  /** 
    * @property {Array<object>} lineageTypes - Objeto que armazena os tipos de linhagem vinculados à entidade.    
    * @private
    * @default {}
    */
  #lineageTypes = [];

  /**
  * O Evento possui tipos de Linhagem vinculados à Entrada? (false por padrão)
  * @type {boolean}
  */
  get hasLineageTypes() {
    return Object.keys(this.#lineageTypes).length > 0;
  };

  get treeContainer() {
    return this.querySelector('#treeContainer');
  }

  /* ---------------------------------------------------------------------------------------------------------------- */
  // GETTERS E SETTERS
  /**
  * Obtém os dados unificados necessários para o funcionamento do formulário.
  * @implements Implemente um método filho para as especificidades de cada formulário.
  * @returns {object} Objeto de dados unificado.
  */
  prepareData() {
    super.prepareData();

    this.data.labels = {
      noLineageLink: 'A Entrada não está vinculada a nenhuma Linhagem.',
    };

    this.data.entryTypes = this.data.entryTypes.filter(et => et.isEntity);

    //this.manager.fromFamilyScript(this.manager.testScript);  
    //this.manager.fromFamilyScript(this.manager.noLinksTestScript); 

    return this.data;
  }

  /** @override */
  prepareFolders(data) {
    const folders = uniforge.doc.sections.filter(s => {
      const c = uniforge.doc.chapters.get(s.cid);
      return (c && c.hasLineage);
    });
    data.folders = folders.sort();
  }

  /* ---------------------------------------------------------------------------------------------------------------- */
  // CONFIGURAÇÕES

  /**@inheritdoc */
  controlStates(state, options = {}) {
    super.controlStates(state, uniforge.utils.mergeObjects(options, { ignoreEntryType: true }));
  }
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
    //this.manager.buildTree();
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

    this.manager.clearTree(true);

    this.#newTree = false;
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
  }

  /**@inheritdoc */
  onDeleteSwitchChange(event) {
    super.onDeleteSwitchChange(event);

    const removeEntryButton = this.querySelector('#removeEntryButton');

    if (removeEntryButton) {
      if (event.target.checked)
        removeEntryButton.classList.remove('hidden');
      else
        removeEntryButton.classList.add('hidden');
    }
  }

  async onNewLineageClick(event) {
    event.stopPropagation();

    const sid = this.data.entry?.sid ?? this.selection.folder?.dataset.id ?? null;

    if (!sid) {
      this.msgBox.showWarning('Nenhuma pasta foi selecionada.');
      return;
    }

    const section = uniforge.doc.sections.get(sid);
    const chapterType = uniforge.doc.chapterTypes.get(section.chapterType);

    const newLineageData = await EntrySearchDialog.configDialog(this.document, { isFounder: true, fromLineage: true });

    if (newLineageData) {
      this.#lineageTypes = uniforge.utils.deepClone(newLineageData.lineageTypes);

      if (newLineageData.entry.img) {
        const imageUrl = await uniforge.utils.blobToImage(newLineageData.entry.img, newLineageData.entry.img);
        newLineageData.entry.img = imageUrl;
      }
      this.manager.addNode(newLineageData.entry, true);

      this.manager.buildTree(this.document, { isPerson: chapterType.ctid === 3 });

      // Exibe o controle da Árvore de Linhagem.
      this._toggleLineageTree(true);

      this.#newTree = true;
    }
  }

  /**
  * Trata o evento de criação de uma nova entrada.
  * @interface
  * @param {Event} event - Evento de clique no botão de Nova Entrada.
  */
  async onNewClick(event) {
    super.onNewClick(event);
  }

  /**
  * Gerencia cliques duplos em itens de entrada.
  * @inheritdoc
  * @param {MouseEvent} event - O evento de clique duplo.
  */
  async onEntryItemDoubleClick(event) {
    await super.onEntryItemDoubleClick(event, { dataSource: 'entries' });

    // Se a Entrada possui uma Árvore de Linhagem, carregue-a.
    if (this.document.lineage.root) {
      this.#newTree = false;

      this._toggleLineageTree(true);
      this._buildDiagram(this.document.lineage);

      const lineageFlavorEditor = this.querySelector('#lineageFlavorEditor');
      lineageFlavorEditor.value = this.document.lineage;
    } else {
      this._toggleLineageTree(false);
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
   * @param {object} lineage - Dados da árvore em formato de FamilyScript.
   * @protected
  */
  _buildDiagram(lineage) {
    this.manager.clearTree(true);
    this.manager.fromFamilyScript(lineage);
    this.manager.buildTree(this.document); // Atualiza a árvore com os dados da entrada.
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
    super._addEntry(data);

    data.ltid = this.manager.Tree.ltid;
    const nodes = this.manager.Tree.nodes;
    const root = this.manager.Tree.root;
    data.lineage = this.manager.toFamilyScript();

    const result = await uniforge.db.addLineageTree(data);

    for (let node of nodes.toArray()) {
      const isRoot = node.id === root;
      switch (node.dbAction) {
        case 'a': {
          await uniforge.db.addLineageTreeEntry({ ltid: data.ltid, eid: node.eid, code: node.id, isRoot });
        } break;
        default: break;
      }
    }

    for (let type of this.#lineageTypes) {
      switch (type.dbAction) {
        case 'a': {
          await uniforge.db.addLineageType({ ltid: data.ltid, tag: type.tag, label: type.label });
        } break;
        case 'u': {
          await uniforge.db.updateLineageType({ ltid: data.ltid, tag: type.tag, label: type.label });
        } break;
        case 'd': {
          await uniforge.db.deleteLineageType({ ltid: data.ltid, tag: type.tag });
        }
        default: break;
      }
    }
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
    super._updateEntry(data);

    data.ltid = this.manager.Tree.ltid;
    const nodes = this.manager.Tree.nodes;
    data.tree = this.manager.toFamilyScript();

    if (this.#newTree) {
      await uniforge.db.addLineageTree(data);
    } else {
      await uniforge.db.updateLineageTree(data);
    }

    for (let node of nodes.toArray()) {
      switch (node.dbAction) {
        case 'a': {
          await uniforge.db.addLineageTreeEntry({ ltid: data.ltid, eid: node.eid, code: node.id });
        } break;
        case 'd': {
          await uniforge.db.deleteLineageTreeEntry({ ltid: data.ltid, eid: node.eid });
        }
        default: break;
      }
    }

    for (let type of this.#lineageTypes) {
      switch (type.dbAction) {
        case 'a': {
          await uniforge.db.addLineageType({ ltid: data.ltid, tag: type.tag, label: type.label });
        } break;
        case 'u': {
          await uniforge.db.updateLineageType({ ltid: data.ltid, tag: type.tag, label: type.label });
        } break;
        case 'd': {
          await uniforge.db.deleteLineageType({ ltid: data.ltid, tag: type.tag });
        }
        default: break;
      }
    }
  }
}