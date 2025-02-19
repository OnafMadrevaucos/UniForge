import BaseDialog from "./baseDialog.js";

export default class SubjectDialog extends BaseDialog {
  constructor(dialogData = {}, options = {}) {
    super(dialogData, uniforge.utils.mergeObjects(options, {
      height: '375px',
      width: '350px'
    }));

    this.template = 'subjectDialog'; // Define o template do diálog.
  }

  /**
   * Prepara os dados do diálogo e configura o diálogo com os dados preparados.
   * @inheritdoc
   * @async
   */
  async _prepare() {
    this.data.tomes = uniforge.doc.tomes.toObject(); 
    Object.keys(this.data.tomes).forEach((key) => {
      const item = this.data.tomes[key];
      item._label = item.title.capitalize();
    });   
    
    this.data.icons = await uniforge.utils.extractFontAwesomeIcons();

    await super._prepare(); // Gera a estrutura base do diálogo.
  }

  /**
    * Configura ouvintes de eventos básicos para o dialog.
    * @protected
    */
  _activateListeners() {
    super._activateListeners();

    const titleInput = this.querySelector('#titleInput');
    const searchInput = this.querySelector('#iconSearch');
    const rootSelect = this.querySelector('#rootSelect');
    const lineageSwitch = this.querySelector('#lineageSwitch');
    const iconItems = this.querySelectorAll('.icon-item');    

    titleInput.addEventListener('input', (event) => { this._onChangeTitle(event); });
    rootSelect.addEventListener('change', (event) => { this._onChangeRoot(event); });
    lineageSwitch.addEventListener('change', (event) => { this._onChangeLineage(event); });
    searchInput.addEventListener('input', (event) => { this._onIconSearch(event); });

    iconItems.forEach(item => {
      item.addEventListener('click', (event) => { this.onIconItemClick(event); });
    });
  }

  _onChangeTitle(event) {
    event.stopPropagation();

    const createButton = this.querySelector('#create');
    const title = event.target.value;

    createButton.dataset.title = title;
  }

  _onChangeRoot(event) {
    event.stopPropagation();

    const createButton = this.querySelector('#create');
    const root = event.target.value;

    createButton.dataset.root = root;
  }

  _onChangeLineage(event) {
    event.stopPropagation();
    const lineageSwitch = event.target.closest('#lineageSwitch');
    const checkbox = lineageSwitch.querySelector('input[type="checkbox"]');
    const checked = checkbox.checked ? '1' : '0';

    const createButton = this.querySelector('#create');
    createButton.dataset.lineage = checked;
  }

  onIconItemClick(event) {
    event.stopPropagation();

    const createButton = this.querySelector('#create');
    const clickedItem = event.target.closest('.icon-item');
    const iconItems = this.querySelectorAll('.icon-item');

    iconItems.forEach(item => {
      item.classList.remove('selected');
    });

    clickedItem.classList.add('selected');
    createButton.dataset.icon = clickedItem.dataset.value;
  }

  _onIconSearch(event) {
    const input = event.target;
    const filter = input.value.toLowerCase();

    const iconItems = this.querySelectorAll('.icon-item');
    iconItems.forEach(item => {
      const value = item.dataset.value.toLowerCase();
      if (value.indexOf(filter) > -1) {
        item.style.display = '';
      } else {
        item.style.display = 'none';
      }
    });
  }

  static async configDialog() {
    function createSubject(event) {
      const button = event.target;
      const title = event.target.dataset.title;
      const root = event.target.dataset.root;
      const isLineage = (event.target.dataset.lineage === '1');
      const icon = event.target.dataset.icon;      

      if (!title || !root || !icon) {
        uniforge.msgBox.showWarning('Por favor, preencha todos os campos.');
        return null;
      }

      button.dataset.canClose = 'true';
      return {
        title,
        root,
        isLineage,
        icon
      };
    }
    return new Promise((resolve, reject) => {
      const dialogData = {
        title: 'Criar Capítulo',
        buttons: {
          cancel: {
            label: "Cancelar",
            icon: "fas fa-xmark",
            callback: () => resolve(null)
          },
          create: {
            label: "Criar",
            icon: "fas fa-link",
            callback: (event) => { resolve(createSubject(event)); },
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