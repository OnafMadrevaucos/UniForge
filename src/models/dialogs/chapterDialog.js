import BaseDialog from "./baseDialog.js";

export default class ChapterDialog extends BaseDialog {
  constructor(dialogData = {}, options = {}) {
    super(dialogData, uniforge.utils.mergeObjects(options, {
      height: '500px',
      width: '350px'
    }));

    this.template = 'chapterDialog'; // Define o template do diálog.
  }

  /**
   * Prepara os dados do diálogo e configura o diálogo com os dados preparados.
   * @inheritdoc
   * @async
   */
  async prepareData() {
    this.data.tomes = uniforge.doc.tomes.toObject();
    this.data.chapterTypes = uniforge.doc.chapterTypes.toObject();

    Object.keys(this.data.tomes).forEach((key) => {
      const item = this.data.tomes[key];
      item._label = item.label;
    });

    this.data.icons = await uniforge.utils.getFontAwesomeIcons();
  }

  /**
    * Configura ouvintes de eventos básicos para o dialog.
    * @protected
    */
  _activateListeners() {
    super._activateListeners();

    const titleInput = this.querySelector('#titleInput');
    const searchInput = this.querySelector('#iconSearch');
    const tomeSelect = this.querySelector('#tomeSelect');
    const typeSelect = this.querySelector('#typeSelect');
    const iconItems = this.querySelectorAll('.icon-item');

    titleInput.addEventListener('input', (event) => { this._onChangeTitle(event); });
    tomeSelect.addEventListener('change', (event) => { this._onChangeTome(event); });
    typeSelect.addEventListener('change', (event) => { this._onChangeType(event); });
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

  _onChangeTome(event) {
    event.stopPropagation();

    const createButton = this.querySelector('#create');
    const tome = event.target.value;

    createButton.dataset.tome = tome;
  }

  _onChangeType(event) {
    event.stopPropagation();
    const type = event.target.value;

    const createButton = this.querySelector('#create');
    createButton.dataset.type = type;
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
    return new Promise((resolve, reject) => {
      const dialogData = {
        title: 'Criar Capítulo',
        buttons: {
          cancel: {
            label: "Cancelar",
            icon: "fas fa-xmark",
            callback: () => {
              resolve(false); 
              return true;
            }
          },
          create: {
            label: "Criar",
            icon: "fas fa-link",
            callback: (dialog, event) => {
              
              const titleInput = dialog.querySelector('#titleInput');
              const tomeSelect = dialog.querySelector('#tomeSelect');              
              const typeSelect = dialog.querySelector('#typeSelect');
              const iconItem = dialog.querySelector('.icon-item.selected'); 

              const data = {
                tome: tomeSelect.value,
                title: titleInput.value,
                icon: iconItem ? iconItem.dataset.value : null,
                type: typeSelect.value
              };

              // Validação dos campos do Capítulo.
              const result = uniforge.db.validateChapter(data);
              if(result !== '') {
                uniforge.msgBox.showWarning(result);
                return false;
              }              

              resolve(data); // Retorna os dados do Capítulo criado.
              return true;
            }
          }
        },
        abort: () => resolve(null)
      };

      const dialog = new this(dialogData);
      dialog.render();
    });
  }
}