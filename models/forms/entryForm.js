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
    this.configureCategoryDialog(dialog);
    this.ui.dialog = dialog;

    /** @type {Object} - Tooltip de interface do usuário. */
    this.ui.tooltip = CONFIG.tooltip;
  }

  /**
   * Configura o conteúdo do formulário.
   * Sobrescreve a configuração na classe pai.
   * @param {HTMLElement} form - O elemento que representa o formulário.
   */
  configureContent(form) {
    super.configureContent(form);

    if (!this.isEncyclopedia) this.configureSubjectSelect(form);
    this.configureEntrySidebar(form);

    // Configura o evento de criação de novas entradas
    const newEntryButton = document.getElementById('newEntryButton');
    newEntryButton.addEventListener('click', (event) => { this.onNewEntryClick(event); });
  }

  /**
   * Atualiza o conteúdo do formulário
   * @param {HTMLElement} form - O elemento que representa o formulário.
   */
  updateContent() {
    super.updateContent();
    this.updateEntryItems();
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
    this.updateEntryItems();
  }

  /**
   * Configura o combo de Assuntos.
   * @param {HTMLElement} form - O formulário HTML principal.
   */
  async configureSubjectSelect(form) {
    this.subjectTypes = await this.getSubjects();

    // Carrega as opções de Tipos de Entradas registrados
    const subjectType = form.querySelector('#subjectType');
    for (const id of Object.keys(this.subjectTypes)) {
      subjectType.appendChild(this._newSubjectOption(id));
    }
  }

  /**
   * Configura o combo de Tipos de Entrada.
   * @param {HTMLElement} form - O formulário HTML principal.
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
  configureCategoryDialog(dialog) {
    const yesBtn = dialog.querySelector('#confirm-yes');
    const noBtn = dialog.querySelector('#confirm-no');

    yesBtn.addEventListener('click', (event) => { this._doAction(event) });
    noBtn.addEventListener('click', (event) => { this.onCancelNewCategory(event); });
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

    tinymce.init({      
      selector: 'textarea#textEditor',
      editable_class: 'editable',
      license_key: 'gpl',
      plugins: ['anchor', 'autolink', 'codesample', 'link', 'lists', 'searchreplace', 'table', 'visualblocks'],
      toolbar: 'undo redo | blocks | bold italic backcolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | entryLink blockquote',
      forced_root_block: 'p',
      block_formats: 'Heading 1=h1; Heading 2=h2; Heading 3=h3; Paragraph=p;',
      height: '100%',
      menubar: false,
      resize: false,
      statusbar: false,
      editable_root: false,
      skin: 'oxide-dark',
      content_css: '/css/styles.css',
      setup: (editor) => { this._setupTinyMCE(editor); }
    });
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
  onDeleteEntryAction(event) {
    event.stopPropagation();
    const data = JSON.parse(this.ui.dialog.dataset.data);
    const dataObj = (this.root === 'encyclo' ? Database.subjectTypes[data.id] : Database.categories[data.id]);
    let id = null;

    dataObj.entries.forEach(entry => {
      if (entry.entryId == data.entryId) id = entry;
    });
    const index = dataObj.entries.indexOf(id);
    if (index < 0) this.msgBox.showError('Item inválido: Item fora da lista');
    else {
      dataObj.entries[index].deleted = true;
      this.updateContent();
    }

    this._hideDialog();

  }

  /**
   * Rotina para tratamento do tooltip de confirmação de remoção.
   * @param {Event} event - Evento de clique no ícone de exclusão.
   * @param {HTMLElement} item - O item da pasta a ser excluído.
   */
  onDeleteEntryClick(event, item) {
    event.stopPropagation();

    const dataType = (this.root === 'encyclo' ? 'do assunto' : 'da categoria');

    const folder = this.form.querySelector('.folder.selected');
    const data = { id: folder.dataset.id, entryId: item.dataset.id };
    this.ui.dialog.dataset.data = JSON.stringify(data);
    this.ui.dialog.dataset.action = 'del';

    const message = `Tem certeza que deseja excluir a entrada ${dataType}?`;
    this._showDialog(message);
  }  

  /**
  * Trata o evento de criação de uma nova entrada.
  * @param {Event} event - Evento de clique no botão de Nova Entrada.
  */
  onNewEntryClick(event) {
    event.stopPropagation();

    // Obtém a lista de Categorias
    const selectedFolder = this.form.querySelector('.folder.selected');
    if (!selectedFolder) {
      this.msgBox.showWarning('Nenhuma categoria foi selecionada.');
      return false;
    }

    return true;

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
   * Gera uma nova opção para o ComboBox de Assuntos.
   * @private
   * @param {String} type - O identificador do assunto.
   * @returns {HTMLElement} - Elemento da nova opção.
   */
  _newSubjectOption(type) {
    const newOption = document.createElement('option');
    newOption.value = type;
    newOption.textContent = this.subjectTypes[type].title;

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
