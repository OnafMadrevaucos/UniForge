/**
 * Importações de módulos necessários.
 */
import BaseForm from "./baseForm.js";
import Dialog from "../dialogs/dialog.js";
import { Database } from "../../scripts/tempDB.js";
import DBManager from "../../db/dbManager.js";
import NewEntryDialog from "../dialogs/newEntryDialog.js";

/**
 * Classe EntryForm estende a funcionalidade da classe BaseForm para gerenciar formulários que manipulem Entradas.
 * @class
 * @extends BaseForm
 */
export default class EntryForm extends BaseForm {
  /**
   * Construtor da classe EntryForm.
   * @param {HTMLElement} overlay - O elemento de sobreposição para o formulário.
   */
  constructor(overlay) {
    super(overlay);

    /**
     * Gerenciador de conexão de Banco de Dados.
     * @type {DBManager}
     */
    this.db = CONFIG.db;

    /**
     * O ícone Font Awesome para quando uma entrada é selecionada.
     * @type {string}
     */
    this.selectedIcon = 'fas fa-feather';

    /**
    * O caminho para o arquivo HTML do dialog de nova entrada
    * @type {string}
    */
    this.newEntryDialogPath = '../../menus/partials/dialogs/newEntryDialog.html';

    /**
    * O formulário não é o de Enciclopédia
    * @type {boolean}
    */
    this.isEncyclopedia = false;

    /** @type {HTMLElement} - Dialogo de confirmação de nova categoria. */
    const dialog = this.form.querySelector('#confirmDialog');    
    this.ui.dialog = dialog;

    /** @type {Object} - Tooltip de interface do usuário. */
    this.ui.tooltip = CONFIG.tooltip;
  }

  /**
   * Configura o conteúdo do formulário.
   * Sobrescreve a configuração na classe pai.
   * @param {HTMLElement} form - O elemento que representa o formulário.
   * @async
   */
  async configureContent(form) {
    await super.configureContent(form);

    this.configureEntrySidebar(form);
  }

  /**
   * Atualiza o conteúdo do formulário
   * @param {HTMLElement} form - O elemento que representa o formulário.
   * @async
   */
  async updateContent() {
    await super.updateContent();
    this.updateEntryItems();
  }

  /**
   * Limpa o conteúdo do formulário
   * @param {HTMLElement} form - O elemento que representa o formulário.
   * @param {Boolean} clearSidebar - Flag para habilitar/desabilitar a limpeza da seleção da sidebar.
   */
  clearContent(form, clearSidebar = true) {
    if (clearSidebar) super.clearContent(form);
    const titleInput = this.form.querySelector('#titleInput');
    titleInput.value = '';

    const isDraftCheck = this.form.querySelector('#checkbox');
    isDraftCheck.checked = false;

    if (tinymce.activeEditor) {
      tinymce.activeEditor.resetContent();
    } else {
      this.msgBox.showError('Editor TinyMCE não inicializado.');
    }
  }

  /**
   * Obtém as categorias disponíveis do banco de dados.
   * @returns {Object} - Assuntos.
   * @async
   */
  async getCategory() {
    return await this.db.getCategory(this.root);
  }

  /**
   * Obtém os assuntos disponíveis do banco de dados.
   * @returns {Object} - Assuntos.
   * @async
   */
  async getSubjects() {
    return await this.db.getSubjects(this.root);
  }

  /**
   * Obtém as importâncias de evnetos disponíveis no banco de dados.
   * @returns {Object}  - Importâncias.
   * @async
   */
  async getImportances() {
    return await this.db.getImportances();
  }

  /**
   * Obtém os tipos de entrada disponíveis do banco de dados.
   * @returns {Object} - Tipos de entrada.
   * @async
   */
  async getEntryTypes() {
    return await this.db.getEntryTypes();
  }

  /**
   * Obtém os calendários disponíveis do banco de dados.
   * @returns {Object} - Calendários.
   * @async
   */
  async getCalendars() {
    return await this.db.getCalendars();
  }

  /**
   * Configura a barra lateral do formulário.
   * @param {HTMLElement} form - O formulário HTML principal.
   */
  configureEntrySidebar(form) {
    this.configureSidebarDialog();
    this.updateEntryItems();
  }

  /**
   * Configura recipiente de imagem do formulário.
   * @param {HTMLElement} form - O formulário HTML principal.
   */
  configureImageContainer(form) {
    const imageContainer = form.querySelector('#imageContainer');
    const displayedImage = form.querySelector('#displayedImage');
    const fileInput = form.querySelector('#hiddenFileInput');

    // Adiciona um evento para lidar com a seleção de uma nova imagem.
    fileInput.addEventListener('change', (event) => {
      const file = event.target.files[0];
      if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          displayedImage.src = e.target.result;  // Atualiza a imagem exibida.
          displayedImage.classList.remove('empty');
        };
        reader.readAsDataURL(file);
      }
    });

    // Adiciona um evento de clique no contêiner de imagem para abrir o seletor de arquivos.
    imageContainer.addEventListener('click', () => {
      fileInput.click();
    });    
  }

  /**
   * Configura o combo de Assuntos.
   * @param {HTMLElement} form - O formulário HTML principal.
   * @async
   */
  async configureSubjectSelect(form) {
    this.subjectTypes = await this.getSubjects();

    // Carrega as opções de Tipos de Entradas registrados
    const subjectType = form.querySelector('#subjectType');
    for (const data of Object.values(this.subjectTypes)) {
      subjectType.appendChild(this._newSubjectOption(data));
    }
  }

  /**
 * Configura o combo de Importância de Evento.
 * @param {HTMLElement} form - O formulário HTML principal.
 * @async
 */
  async configureImportanceSelect(form) {
    this.importances = await this.getImportances();

    // Carrega as opções de Importâncias registradas
    const importance = form.querySelector('#importance');
    for (const data of Object.values(this.importances)) {
      importance.appendChild(this._newImportanceOption(data));
    }
  }

  /**
   * Configura o combo de Tipos de Entrada.
   * @param {HTMLElement} form - O formulário HTML principal.
   * @async
   */
  async configureEntryTypeSelect(form) {
    this.entryTypes = await this.getEntryTypes();

    // Carrega as opções de Tipos de Entradas registrados
    const entryType = form.querySelector('#entryType');
    for (const data of Object.values(this.entryTypes)) {
      entryType.appendChild(this._newEntryTypeOption(data));
    }
  }

  /**
   * Configura o combo de Tipos de Entrada.
   * @param {HTMLElement} form - O formulário HTML principal.
   * @async
   */
  async configureCalendarSelect(form) {
    this.calendars = await this.getCalendars();

    // Carrega as opções de Calendários registrados
    const calendarType = form.querySelector('#calendarType');
    for (const [id, data] of Object.entries(this.calendars)) {
      calendarType.appendChild(this._newCalendarOption({ id: id, data: data }));
    }
    calendarType.addEventListener('change', (event) => { this.onDateTypeChange(event); });
  }

  /**
   * Habilita todas as entradas de uma pasta (categoria) para poderem ser atualizadas.
   */
  updateEntryItems() {
    const entriesList = this.form.querySelectorAll('.entry-item');

    entriesList.forEach(item => {
      const removeButton = item.querySelector('.remove-button');
      // Se o item não possui botão de remoção, adicione-o.
      if (!removeButton) {
        const deleteIcon = this.createDeleteIcon();
        deleteIcon.addEventListener('click', (event) => { this.onDeleteEntryClick(event, item); });
        item.appendChild(deleteIcon);
      }
    });
  }

  /**
   * Fecha dialog aberto, se houver um.
   */
  closeDialog() {
    if (this.dialog) {
      this.dialog.closeDialog();
    }
  }

  /**
   * Cria um botão para remoção de itens de listas.
   * @returns {HTMLElement} - Elemento do botão de remoção de folder.
   */
  createDeleteIcon() {
    const a = document.createElement('a');
    a.className = 'remove-button';
    a.innerHTML = '<i class="fas fa-trash"></i>';

    return a;
  }

  /**
   * Configura o diálogo de categorias.
   * @private
   * @param {HTMLElement} dialog - Elemento do diálogo de categorias.
   */
  configureSidebarDialog() {
    const dialog = this.ui.dialog;

    const yesBtn = dialog.querySelector('#confirm-yes');
    const noBtn = dialog.querySelector('#confirm-no');

    yesBtn.addEventListener('click', (event) => { this._doAction(event) });
    noBtn.addEventListener('click', (event) => { this.onCancelNewCategory(event); });
  }  

  /**
   * Gerencia cliques em pastas.
   * @param {MouseEvent} event - O evento de clique.
   * @private
   */
  _onFolderClick(event) {
    super._onFolderClick(event);

    const newEntryButton = this.form.querySelector('#newEntryButton');
    newEntryButton.classList.toggle('disabled');
  }

  /**
   * Manipulador de evento para alterar a imagem exibida.
   * @param {Event} event - Evento disparado pelo input de arquivo.
   * @param {HTMLImageElement} displayedImage - Elemento de imagem a ser atualizado.
   */
  onChangeImage(event, displayedImage) {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        displayedImage.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  /**
   * Manipulador de evento para alterar o tipo de calendário exibido.
   * @param {Event} event - Evento disparado pelo input de arquivo.
   */
  onDateTypeChange(event) {
    const select = event.target;
    const option = select.selectedOptions[0];

    const calendar = this.calendars[option.value];

    Object.values(this.datePickers).forEach(pickers => {
      pickers._loadDatePicker(calendar);
    });
  }

  /**
   * Remove uma entrada de uma categoria da lista.
   * @param {Event} event - Evento de clique no botão para excluir a entrada.
   */
  async onDeleteEntryAction(event) {
    event.stopPropagation();
    const id = JSON.parse(this.ui.dialog.dataset.id);

    if (this.isEncyclopedia) await CONFIG.db.deleteCategory(id);
    else await CONFIG.db.deleteEntry(id);

    this.updateContent();
    this._hideDialog();
  }

  /**
   * Rotina para tratamento do tooltip de confirmação de remoção.
   * @param {Event} event - Evento de clique no ícone de exclusão.
   * @param {HTMLElement} item - O item da pasta a ser excluído.
   */
  onDeleteEntryClick(event, item) {
    event.stopPropagation();

    const dataType = (this.isEncyclopedia ? 'do assunto' : 'da categoria');

    this.ui.dialog.dataset.id = item.dataset.id;
    this.ui.dialog.dataset.action = 'del';

    const message = `Tem certeza que deseja excluir a entrada ${dataType}?`;
    this._showDialog(message);
  }

  /**
    * Trata o evento de cancelamento de um novo item.
    * @param {Event} event - Evento de clique no botão de Cancelar.
    */
  async onCancelClick(event) {
    event.stopPropagation();

    const cancelButton = this.form.querySelector('#cancelButton');
    cancelButton.classList.add('hidden');

    const newEntryButton = this.form.querySelector('#newEntryButton');
    newEntryButton.classList.add('disabled');

    const saveButton = this.form.querySelector('#saveButton');
    saveButton.classList.add('disabled');
  }

  /**
  * Trata o evento de criação de um novo item qualquer.
  * @param {Event} event - Evento de clique no botão de Nova Entrada.
  */
  onBaseNewClick(event) {
    event.stopPropagation();
    // Ignora o clique se o botão estiver desativado.
    const button = event.target.closest('#newEntryButton');
    if (button.classList.contains('disabled')) return;

    // Obtém a lista de Categorias
    const selectedFolder = this.form.querySelector('.folder.selected');
    if (!selectedFolder) {
      this.msgBox.showWarning('Nenhuma categoria foi selecionada.');
      return;
    }

    const cancelButton = this.form.querySelector('#cancelButton');
    cancelButton.classList.remove('hidden');

    const saveButton = this.form.querySelector('#saveButton');
    saveButton.classList.remove('disabled');

    const titleInput = this.form.querySelector('#titleInput');
    titleInput.focus();

    if(!this.onNewClick) { 
      const message = 'Método de tratamento do clique de novo item não foi implementado no formulário filho.';      
      this.msgBox.showWarning(message);      
    } else {
      this.onNewClick(event);
    }

    // Criar o diálogo
    //const dialog = new NewEntryDialog(selectedFolder);
    //dialog.createDialog(true);

    /*
    const listItems = dialog.querySelectorAll('.list-item');
    let listerns = [];
    listItems.forEach(item => {
        listerns.push(
            {
                element: item,
                event: 'click',
                callback: (event) => { dialog.onEntryItemClick(event); }
            }
        );
    });

    dialog.configureListeners(listerns);
    */
    //this.dialog = dialog;
  }

  /**
    * Trata o evento de registro de uma nova entrada.
    * @param {Event} event - Evento de clique no botão de Salvar.
    */
  async onBaseSaveClick(event) {
    event.stopPropagation();

    // Ignora o clique se o botão estiver desativado.
    const button = event.target.closest('#saveButton');
    if (button.classList.contains('disabled')) return;

    if(!this.onSaveClick) { 
      const message = 'Método de tratamento do clique de salvamento não foi implementado no formulário filho.';      
      this.msgBox.showWarning(message);      
    } else {
      this.onSaveClick(event);
    }
  }

  /**
   * Gera uma nova opção para o ComboBox de Assuntos.
   * @private
   * @param {Object} data   - Os dados do assunto.
   * @returns {HTMLElement} - Elemento da nova opção.
   */
  _newSubjectOption(data) {
    const newOption = document.createElement('option');
    newOption.value = data.cid;
    newOption.textContent = data.title;

    return newOption;
  }

  /**
   * Gera uma nova opção para o ComboBox de Importância de Evento.
   * @private
   * @param {Object} data   - Os dados do tipo.
   * @returns {HTMLElement} - Elemento da nova opção.
   */
  _newImportanceOption(data) {
    const newOption = document.createElement('option');
    newOption.value = data.iid;
    newOption.textContent = data.label;

    return newOption;
  }

  /**
   * Gera uma nova opção para o ComboBox de Tipos de Entradas.
   * @private
   * @param {Object} data   - Os dados do tipo.
   * @returns {HTMLElement} - Elemento da nova opção.
   */
  _newEntryTypeOption(data) {
    const newOption = document.createElement('option');
    newOption.value = data.etid;
    newOption.textContent = data.label;

    return newOption;
  }
  /**
   * Gera uma nova opção para o ComboBox de Calendários.
   * @private
   * @param {Object} calendar - Objeto com os dados do Calendário.
   * @returns {HTMLElement} - Elemento da nova opção
   */
  _newCalendarOption(calendar) {
    const newOption = document.createElement('option');
    newOption.value = calendar.id;
    newOption.textContent = calendar.data.label;

    return newOption;
  }

  /**
   * Inicializa e configura o editor TinyMCE.
   * Remove qualquer instância existente antes de reconfigurar.
   * @private
   */
  _configureTinyMCE() {
    if (tinymce.get('textEditor')) {
      tinymce.remove('#textEditor');
    }

    const options = CONFIG.utils.mergeObjects(CONFIG.tinymceOptions.default,{
      selector: 'textarea#textEditor',
      init_instance_callback: (editor) => {
        editor.setContent(""); // Garante que o editor seja iniciado vazio.
      },
      setup: (editor) => { this._setupTinyMCE(editor); }
    });

    tinymce.init(options);
  }

  /**
    * Ação personalizada no editor TinyMCE para criar ou modificar links.
    * @param {Object} editor - Instância do editor TinyMCE.
    */
  onTinyMCEAction(editor) {
    const tooltip = this.ui.tooltip;
    const selectedHtml = editor.selection.getContent();

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
        const wrappedContent = `${leadingSpaces ? leadingSpaces[0] : ''}${tooltip.forgeLink('FN002', trimmedText, () => { console.log("*CLICK*"); })}${trailingSpaces ? trailingSpaces[0] : ''}`;
        editor.selection.setContent(wrappedContent);
      } else {
        editor.notificationManager.open({
          text: 'Favor selecionar um texto antes de criar um link.',
          type: 'warning'
        });
      }
    }
  }

  /**
   * Configura o editor TinyMCE com funcionalidades adicionais.
   * @private
   * @param {Object} editor - Instância do editor TinyMCE.
   */
  _setupTinyMCE(editor) {
    const tooltip = this.ui.tooltip;

    editor.ui.registry.addButton('entryLink', {
      tooltip: 'Criar link',
      icon: 'bookmark',
      onAction: () => { this.onTinyMCEAction(editor); }
    });

    editor.on('mouseover', (event) => {
      const span = event.target.closest('span.linked-text');
      if (span) {
        tooltip._showLinkTooltip(span, 'FN002');
      } else {
        tooltip._hideLinkTooltip();
      }
    });

    editor.on('mouseout', () => {
      tooltip._hideLinkTooltip();
    });
  }
  
  /**
   * Exibe um diálogo de confirmação com uma mensagem.
   * @private
   * @param {string} message - Mensagem a ser exibida no diálogo.
   */
  _showDialog(message) {
    const text = this.ui.dialog.querySelector('#confirmation-message');
    text.innerHTML = message;
    this.ui.dialog.classList.remove('hidden');
  }

  /**
   * Oculta o diálogo de confirmação.
   * @private
   */
  _hideDialog() {
    this.ui.dialog.classList.add('hidden');
  }

  /**
   * Realiza uma ação com base no tipo configurado no diálogo.
   * @private
   * @param {Event} event - Evento disparado no botão de confirmação.
   */
  _doAction(event) {
    switch (this.ui.dialog.dataset.action) {
      case 'del': {
        this.onDeleteEntryAction(event);
      } break;
      default:
        this.msgBox.showError("Ação inválida. Não foi possível realizar a ação enviada.");
    }
  }
}
