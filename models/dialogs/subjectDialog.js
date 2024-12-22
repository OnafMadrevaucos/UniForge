import Dialog from "./dialog.js";

export default class SubjectDialog extends Dialog {
  constructor(dialogData = {}, options = {}) {
    super(dialogData, CONFIG.utils.mergeObjects(options, {
      height: '375px',
      width: '350px'
    }));
  }

  /**
   * Obtém as raízes dos assuntos.
   * @returns {Object} - Raízes dos assuntos.
   * @async
   */
  async getRoots() {
    const data = await this.db.getAllRoots();
    return data;
  }

  async getBody() {
    // Cria o body
    const body = document.createElement('div');
    body.className = 'subject-dialog flexcol';

    const titleGroup = document.createElement('div');
    titleGroup.className = 'data-group text';

    const titleLabel = document.createElement('span');
    titleLabel.className = 'data-label';
    titleLabel.textContent = 'Assunto ';

    const titleInput = document.createElement('input');
    titleInput.id = 'titleInput';
    titleInput.type = 'text';

    titleGroup.appendChild(titleLabel);
    titleGroup.appendChild(titleInput);

    const rootGroup = document.createElement('div');
    rootGroup.className = 'data-group combo';

    const rootLabel = document.createElement('span');
    rootLabel.className = 'data-label';
    rootLabel.textContent = 'Raiz ';

    const rootSelect = document.createElement('select');
    rootSelect.id = 'rootSelect';
    rootSelect.className = 'data';
    rootSelect.name = 'subjectRoot';

    const blankOption = document.createElement('option');
    blankOption.innerHTML = '&#8212';
    blankOption.value = '';
    rootSelect.appendChild(blankOption);

    const roots = await this.getRoots();

    roots.forEach(data => {
      const option = document.createElement('option');
      option.value = data.root;
      option.textContent = CONFIG.utils.capitalizeFirstLetter(data.root);
      rootSelect.appendChild(option);
    });

    rootGroup.appendChild(rootLabel);
    rootGroup.appendChild(rootSelect);

    const iconGroup = document.createElement('div');
    iconGroup.className = 'data-group list';

    const iconLabel = document.createElement('span');
    iconLabel.className = 'data-label';
    iconLabel.textContent = 'Ícone ';

    const searchDiv = document.createElement('div');
    searchDiv.className = 'search-box';

    const searchInput = document.createElement('input');
    searchInput.id = 'iconSearch';
    searchInput.type = 'text';
    searchInput.placeholder = 'Buscar ícone...';

    searchDiv.appendChild(searchInput);

    const iconList = document.createElement('ul');
    iconList.id = 'iconList';
    iconList.name = 'subjectIcon';

    const icons = await CONFIG.utils.extractFontAwesomeIcons();
    Object.values(icons).forEach(icon => {
      const iconItem = document.createElement('li');
      iconItem.className = 'icon-item';
      iconItem.dataset.value = `fas ${icon.selector}`;
      const innerHTML = `<i class="fas ${icon.selector}"></i> ${icon.selector}`;
      iconItem.innerHTML = innerHTML;
      iconList.appendChild(iconItem);
    });

    iconGroup.appendChild(iconLabel);
    iconGroup.appendChild(searchDiv);
    iconGroup.appendChild(iconList);

    body.appendChild(titleGroup);
    body.appendChild(rootGroup);
    body.appendChild(iconGroup);

    return body;
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
    const iconItems = this.querySelectorAll('.icon-item');    

    titleInput.addEventListener('input', (event) => { this._onChanceTitle(event); });
    rootSelect.addEventListener('change', (event) => { this._onChangeRoot(event); });
    searchInput.addEventListener('input', (event) => { this._onIconSearch(event); });

    iconItems.forEach(item => {
      item.addEventListener('click', (event) => { this.onIconItemClick(event); });
    });
  }

  _onChanceTitle(event) {
    const createButton = this.querySelector('#create');
    const title = event.target.value;

    createButton.dataset.title = title;
  }

  _onChangeRoot(event) {
    const createButton = this.querySelector('#create');
    const root = event.target.value;

    createButton.dataset.root = root;
  }

  onIconItemClick(event) {
    const createButton = this.querySelector('#create');
    const iconItem = event.target;
    const iconItems = this.querySelectorAll('.icon-item');

    iconItems.forEach(item => {
      item.classList.remove('selected');
    });

    iconItem.classList.add('selected');
    createButton.dataset.icon = iconItem.dataset.value;
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
      const icon = event.target.dataset.icon;

      if (!title || !root || !icon) {
        CONFIG.msgBox.showWarning('Por favor, preencha todos os campos.');
        return null;
      }

      button.dataset.canClose = 'true';
      return {
        title,
        root,
        icon
      };
    }
    return new Promise((resolve, reject) => {
      const dialogData = {
        title: 'Criar Assunto',
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