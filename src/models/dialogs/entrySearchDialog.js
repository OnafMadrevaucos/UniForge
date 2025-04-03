import BaseDialog from './baseDialog.js';
import LineageTypeDialog from './lineageTypeDialog.js';
export default class EntrySearchDialog extends BaseDialog {
  constructor(dialogData = {}, options = {}) {
    super(dialogData, uniforge.utils.mergeObjects(options, {
      height: '800px',
      width: '950px'
    }));

    this.fromLineage = options?.fromLineage ?? false;

    this.isFounder = options?.isFounder ?? false;

    this.ltid = options?.ltid ?? null;

    this.lineageGroups = [];

    this.template = 'entrySearchDialog'; // Define o template do diálogo.

    /**
         * Representa as seleções atuais no formulário.
         * @type {{ folder: HTMLElement | null, entry: HTMLElement | null }}
         */
    this.selection = {
      folder: null,
      entry: null,
    };

    /**
        * O ícone Font Awesome para quando uma entrada é selecionada.
        * @type {string}
        * 
        */
    this.selectedIcon = 'fas fa-eye';
  }

  static #typesToCommit = new Map();

  get typesToCommit() {
    return EntrySearchDialog.#typesToCommit;
  }
  set typesToCommit(value) {    
    EntrySearchDialog.#typesToCommit = value;
  }

  /**
 * Prepara os dados do diálogo e configura o diálogo com os dados preparados.
 * @inheritdoc
 */
  prepareData() {
    this.prepareFolders(this.data);

    this.data.entryTypes = uniforge.doc.entryTypes.toObject();
    this.data.entryEvents = uniforge.doc.events.toObject();

    if (this.fromLineage) {
      this.prepareLineageTypes(this.data);
      this.prepareLineageGroups(this.data);
    }
  }

  prepareFolders(data) {
    const folders = uniforge.doc.entries.reduce((folder, entry) => {
      const entryType = uniforge.doc.entryTypes.get(Number(entry.etid));
      const type = entryType.title;

      const existingFolder = folder.find(f => f._label === type);
      if (!existingFolder) {
        folder.push({
          _label: entryType.title,
          _id: entryType.etid,
          entries: []
        });
      }

      const targetFolder = existingFolder || folder[folder.length - 1];
      targetFolder.entries.push({ _id: entry.eid, _label: entry.title });

      return folder;
    }, []);
    data.folders = folders.sort((a, b) => a._label.localeCompare(b._label));
  }

  prepareLineageTypes(data) {
    const lineage = uniforge.doc.lineages.get(this.ltid);
    data.lineageTypes = lineage?.types.toObject() ?? [];
  }

  prepareLineageGroups(data) {
    if (this.isFounder) {
      data.groups = [{ _label: 'Fundador', _id: 'founder' }];
    }
  }

  configureForLineage() {
    const eventGroup = this.querySelector('#eventGroup');
    eventGroup.classList.remove('hidden');

    const lineageTypesSelect = this.querySelector('#lineageTypes');
    lineageTypesSelect.disabled = (this.data.lineageTypes.length === 0);

    if (this.isFounder) {
      const lineageGroup = this.querySelector('#lineageGroup');

      const option = document.createElement('option');
      option.value = 'root';
      option.textContent = 'Fundador';
      lineageGroup.appendChild(option);

      lineageGroup.value = 'root';
      lineageGroup.disabled = true;

      const lineageGroupOrder = this.querySelector('#lineageGroupOrder');
      lineageGroupOrder.value = 0;
      lineageGroupOrder.disabled = true;
    }
  }

  async configureElements() {
    if (this.fromLineage) this.configureForLineage();

    await this.configureTinyMCE();
    await this.configureFlavorTinyMCE();
  }

  /**
   * Inicializa e configura o editor TinyMCE.
   * Remove qualquer instância existente antes de reconfigurar.
   * @private
   */
  async configureTinyMCE() {
    if (tinymce.get('sourceMainEditor')) {
      tinymce.remove('#sourceMainEditor');
    }

    const options = uniforge.utils.mergeObjects(uniforge.tinymceOptions.readonly, {
      selector: 'textarea#sourceMainEditor',
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
    if (tinymce.get('sourceFlavorEditor')) {
      tinymce.remove('#sourceFlavorEditor');
    }

    const options = uniforge.utils.mergeObjects(uniforge.tinymceOptions.simple, {
      editable_class: 'editable',
      selector: 'div#sourceFlavorEditor',
      placeholder: "Texto de floreio...",
      init_instance_callback: (editor) => {
        editor.setContent(""); // Garante que o editor seja iniciado vazio.
      }
    });

    await tinymce.init(options);
    tinymce.get('sourceFlavorEditor').mode.set('readonly');
  }

  configureLineageTypesSelect(types) {
    const lineageTypesSelect = this.querySelector('#lineageTypes');
    lineageTypesSelect.value = '';
    lineageTypesSelect.innerHTML = '';    

    types.forEach(type => {
      const option = document.createElement('option');
      option.value = type.tag;
      option.textContent = type.label;
      lineageTypesSelect.appendChild(option);
    });

    if (lineageTypesSelect.childElementCount > 0) {
      lineageTypesSelect.disabled = false;
    } else {
      const option = document.createElement('option');
      option.textContent = '—';
      option.value = 'n';
      lineageTypesSelect.appendChild(option);
      lineageTypesSelect.value = '—';
      lineageTypesSelect.disabled = true;
    }
  }

  /**
  * Configura ouvintes de eventos básicos para o dialog.
  * @protected
  */
  _activateListeners() {
    super._activateListeners();

    const sidebar = this.querySelector('.sidebar');
    sidebar.addEventListener('click', (event) => { this.onSidebarClick(event); });

    const folders = this.querySelectorAll('.folder');
    folders.forEach(item => {
      const folderHeader = item.querySelector('.folder-header');
      folderHeader.addEventListener('click', (event) => { this.onFolderClick(event); });
    });

    const items = this.querySelectorAll('.entry-item');
    items.forEach(item => {
      item.addEventListener('click', (event) => { this.onEntryItemClick(event); });
    });

    if (this.fromLineage) {
      const manageTypeButton = this.querySelector('#manageTypeButton');
      manageTypeButton.addEventListener('click', (event) => { this.onManageTypeClick(event); });
    }
  }

  /**
    * Gerencia cliques no sidebar.
    * @param {MouseEvent} event - O evento de clique.
    */
  onSidebarClick(event) {
    event.stopPropagation();
    if (event.target.classList.contains('entry-item')) return;

    this.#clearContent();
  }

  /**
    * Gerencia cliques em pastas.
    * @param {MouseEvent} event - O evento de clique.
    */
  onFolderClick(event) {
    event.stopPropagation();
    const clickedFolder = event.target.closest('.folder');
    const isSelected = clickedFolder.classList.contains('selected');

    this.#clearFolderList();

    if (!isSelected) {
      clickedFolder.classList.add('selected');
      const folderIcon = clickedFolder.querySelector('.fas');
      folderIcon.classList.remove(...folderIcon.classList);
      folderIcon.classList.add('fas', 'fa-folder-open');
    }

    this.selection.folder = clickedFolder;
  }

  async onEntryItemClick(event) {
    event.stopPropagation();
    const clickedItem = event.target.closest('.entry-item');

    this.#clearEntryList();
    clickedItem.classList.add('selected');
    const itemIcon = clickedItem.querySelector('i');
    itemIcon.classList.remove(...itemIcon.classList);
    itemIcon.className = this.selectedIcon;

    const titleInput = this.querySelector('#titleInput');

    const infoSet = this.querySelector('.info-set');
    infoSet.disabled = false;

    const entryTypeGroup = this.querySelector('#entryTypeGroup');

    const entryId = clickedItem.dataset.id;
    const entry = uniforge.doc.entries.get(entryId);

    if (this.fromLineage) {
      this.typesToCommit = new Map();
      const startEvent = this.querySelector('#startEvent');
      const endEvent = this.querySelector('#endEvent');

      startEvent.disabled = false;
      endEvent.disabled = false;

      this._filterEventInput(startEvent, entry.eid);
      this._filterEventInput(endEvent, entry.eid);

      this.configureLineageTypesSelect(this.data.lineageTypes);
    }

    const displayedImage = this.querySelector('#displayedImage');

    const imageUrl = await uniforge.utils.blobToImage(entry.img, entry.ext);

    displayedImage.dataset.ext = entry.ext;
    displayedImage.src = imageUrl
    displayedImage.classList.remove('empty');

    titleInput.value = entry.title;
    entryTypeGroup.value = entry.etid;

    tinymce.get('sourceFlavorEditor').setContent(entry.flavor ?? '');
    tinymce.get('sourceMainEditor').setContent(entry.htmlString);

    this.selection.entry = clickedItem;

    const button = this.querySelector('#linkUp');
    button.dataset.eid = entryId;
  }

  async onManageTypeClick(event) {
    event.stopPropagation();
    const types = await LineageTypeDialog.configDialog(this.ltid);

    if (types) {
      this.typesToCommit.merge(types);
      const lineage = uniforge.doc.lineages.get(this.ltid);
      const committedTypes = lineage?.types.toObject() ?? [];
      const notCommittedTypes = this.typesToCommit.toArray();

      this.data.lineageTypes = committedTypes.merge(notCommittedTypes);
      this.configureLineageTypesSelect(this.data.lineageTypes);
    }
  }

  _filterEventInput(input, eid) {
    const lineageTypesSelect = this.querySelector('#lineageTypes');
    const options = lineageTypesSelect.querySelectorAll('option');
    options.forEach(option => {
      const event = uniforge.doc.events.get(option.label);
      if (!event || event?.source === eid) option.disabled = false;
      else option.disabled = true;
    });
  }

  /**
   * Remove a seleção de todas as pastas.
   * @private
   */
  #clearFolderList() {
    const folderList = this.querySelectorAll('.folder');
    folderList.forEach(item => {
      item.classList.remove('selected');
      const folderIcon = item.querySelector('.fas');
      folderIcon.classList.remove(...folderIcon.classList);
      folderIcon.classList.add('fas', 'fa-folder');
    });
    this.selection.folder = null;
  }

  /**
  * Remove a seleção de todas as entradas.
  * @private
  */
  #clearEntryList() {
    const itemsList = this.querySelectorAll('.entry-item');
    itemsList.forEach(item => {
      item.classList.remove('selected');
      const folderIcon = item.querySelector('i');
      folderIcon.classList.remove(...folderIcon.classList);
      folderIcon.classList.add('fas', 'fa-file');
    });
    this.selection.entry = null;
  }

  /**
  * Limpa o conteúdo do formulário
  */
  #clearContent() {
    const folders = this.querySelectorAll('#folderList .folder');

    if (folders.length == 0) return;

    folders.forEach(item => {
      item.classList.remove('selected');
      const icon = item.querySelector('.fas');
      icon.classList.remove(...icon.classList);
      icon.classList.add('fas', 'fa-folder');
    });
  }

  static async configDialog(options = {}) {    
    return new Promise((resolve, reject) => {  
      const dialog = new this({
        title: 'Vincular Entrada',
        buttons: {
          cancel: {
            label: "Cancelar",
            icon: "fas fa-xmark",
            callback: () => resolve(false)
          },
          linkUp: {
            label: "Vincular",
            icon: "fas fa-paperclip",
            callback: (dialog, event) => {
              const eid = event.target.dataset.eid ?? null;              

              if (!eid) {
                uniforge.msgBox.showWarning('Por favor, selecione uma Entrada.');               
                return false;                
              }
              let entry = uniforge.doc.entries.get(eid);
              const startEvent = dialog.querySelector('#startEvent');
              const endEvent = dialog.querySelector('#endEvent');
              const lineageTypes = dialog.querySelector('#lineageTypes');
              const founderTitle = dialog.querySelector('#founderTitle');
              const lineageGroup = dialog.querySelector('#lineageGroup');
              const lineageGroupOrder = dialog.querySelector('#lineageGroupOrder');

              entry = uniforge.utils.mergeObjects(entry, {
                id: entry.eid,
                givenName: entry.title,
                birthDate: entry.birthDate ?? '00010101',
                deathDate: entry.deathDate ?? '00010101',            
                gender: lineageTypes.value ?? 'n',
                title: founderTitle.value ?? '',
                group: lineageGroup.value ?? '',
                groupOrder: lineageGroupOrder.value ?? 0,
                genitors: entry.genitors ?? {},
                deceased: entry.deceased ?? false
              });              

              if(this.#typesToCommit.size > 0) {
                entry.lineageTypes = this.#typesToCommit.toArray();
              }
              
              resolve(entry);
              return true;
            }
          }
        },
        abort: () => resolve(null)
      }, options);
      dialog.render(true);
    });
  }
}