import BaseDialog from './baseDialog.js';
export default class EntrySearchDialog extends BaseDialog {
  constructor(dialogData = {}, options = {}) {
    super(dialogData, uniforge.utils.mergeObjects(options, {
      height: '800px',
      width: '950px'
    }));

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

  /**
 * Prepara os dados do diálogo e configura o diálogo com os dados preparados.
 * @inheritdoc
 * @async
 */
  async _prepare() {
    this.prepareFolders(this.data);

    this.data.entryTypes = uniforge.doc.entryTypes.toObject();
    await super._prepare(); // Gera a estrutura base do diálogo.
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

  async configureElements() {
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
    const entryTypeGroup = this.querySelector('#entryTypeGroup');
    const isDraftSwitch = this.querySelector('#isDraftSwitch');

    const entryId = clickedItem.dataset.id;
    const entry = uniforge.doc.entries.get(entryId);

    const displayedImage = this.querySelector('#displayedImage');

    const imageUrl = await uniforge.utils.blobToImage(entry.img, entry.ext);

    displayedImage.dataset.ext = entry.ext;
    displayedImage.src = imageUrl
    displayedImage.classList.remove('empty');

    titleInput.value = entry.title;
    entryTypeGroup.value = entry.etid;
    isDraftSwitch.checked = entry.isDraft;

    tinymce.get('sourceFlavorEditor').setContent(entry.flavor ?? '');
    tinymce.get('sourceMainEditor').setContent(entry.htmlString);

    this.selection.entry = clickedItem;

    const button = this.querySelector('#linkUp');
    button.dataset.eid = entryId;
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

  static async configDialog() {
    function createEventSource(event) {
      const button = event.target;
      const eid = event.target.dataset.eid;

      if (!eid) {
        uniforge.msgBox.showWarning('Por favor, selecione uma Entrada.');
        return null;
      }

      button.dataset.canClose = 'true';
      return eid;
    }
    return new Promise((resolve, reject) => {
      const dialogData = {
        title: 'Vincular Entrada',
        buttons: {
          cancel: {
            label: "Cancelar",
            icon: "fas fa-xmark",
            callback: () => resolve(null)
          },
          linkUp: {
            label: "Vincular",
            icon: "fas fa-paperclip",
            callback: (event) => { resolve(createEventSource(event)); },
            canClose: 'false'
          }
        },
        abort: () => resolve(null)
      };

      const dialog = new this(dialogData);
      dialog.render();
    });
  }
}