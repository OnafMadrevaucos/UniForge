/**
 * Importações de módulos necessários.
 */
import SidebarForm from "./sidebarForm.js";
import LinkDialog from "../dialogs/linkDialog.js";
import ImagePickerDialog from "../dialogs/imagePickerDialog.js";
import Dialog from "../dialogs/dialog.js";

/**
 * Classe EntryForm estende a funcionalidade da classe BaseForm para gerenciar formulários que manipulem Entradas.
 * @class
 * @extends SidebarForm
 */
export default class EntryForm extends SidebarForm {
  /**
   * Construtor da classe EntryForm.
   * 
   * @param {HTMLElement} title   - O título do formulário.
   */
  constructor(title) {
    super(title);

    /**
    * Estados válidos para os elements do formulário.
    * @type {Object<number, number>}
    */
    this.states = this._states;

    /**
     * Estado atual dos elements do formulário.
     * @type {number}
     */
    this.currentState = 0;

    /**
     * O ícone Font Awesome para quando uma entrada é selecionada.
     * @type {string}
     */
    this.selectedIcon = 'fas fa-feather';

    /**
     * Objeto com os dados da imagem da entrada.
     * @type {Object}
     */
    this.selectedImg = {
      rawData: null,
      ext: ''
    };

    /**
     * A edição atual é uma atualização de uma Entrada?
     * @type {boolean}
     */
    this.isEntryUpdate = false;

    /** 
     * @type {Object} - Tooltip de interface do usuário. 
     * */
    this.ui.tooltip = uniforge.tooltip;
  }

  /* ---------------------------------------------------------------------------------------------------------------- */
  // GETTERS E SETTERS

  /**
   * @overload
   * Retorna um objeto com referências para elementos do formulário.
   * 
   * @returns {Object}  - Um objeto com as seguintes propriedades:
   *  - overlay: O elemento HTML que contém o formulário.
   *  - form: O elemento HTML que representa o formulário.
   *  - header: O elemento HTML que contém o título do formulário.
   *  - close_btn: O elemento HTML que fecha o formulário.
   *  - content: O elemento HTML que contém o conteúdo do formulário.
   *  - tooltip: O objeto de gerenciamento de tooltips.
   */
  get ui() {
    const ui = {
      tooltip: uniforge.tooltip
    };
    return uniforge.utils.mergeObjects(super.ui, ui);
  }
  /**
    * Obtém os dados unificados necessários para o funcionamento do formulário.
    * @implements Implemente um método filho para as especificidades de cada formulário.
    * @async
    * @returns {object}  - Objeto de dados unificado.
    */
  prepareData() {
    return super.prepareData();
  }

  /**
  * Conjunto de filtros de item que representam os estados aplicáveis na classe EntryForm.
  * Os estados estão mapeados para números inteiros que representam ações específicas.
  * 
  * @type {Object<number, number>}
  * @protected
  * @property {number} default  - Representa o estado de cancelamento de uma entrada (valor 0).
  * @property {number} newEntry - Representa o estado de criação de uma nova entrada (valor 1).
  * @property {number} adding   - Representa o estado de salvamento de uma entrada nova (valor 2).
  * @property {number} editing  - Representa o estado de salvamento de uma entrada pré-existente (valor 3). 
  */
  get _states() {
    return {
      default: 0,
      newEntry: 1,
      adding: 2,
      editing: 3
    }
  };
  /* ---------------------------------------------------------------------------------------------------------------- */
  // INTERFACE DE USUÁRIO
  /**
   * @inheritdoc
  * Inicia a construção do formulário.
  */
  async _configure() {
    await super._configure();

    // Atribui o estado padrão aos controles do formulário.
    this.controlStates(this.states.default);
  }
  /**
   * Habilita/desabilita os controles do formulário.
   * @param {Number} state - O novo estado do formulário.
   * @protected
   */
  controlStates(state) {
    const titleInput = this.querySelector('#titleInput');
    const imageContainer = this.querySelector('#imageContainer');
    const infoContent = this.querySelector('.info-content');
    const mainEditor = tinymce.get('mainEditor');
    const deleteSwitch = this.querySelector('#deleteSwitch');
    const deleteCheckbox = deleteSwitch.querySelector('#checkbox');

    if (this.canDelete) deleteCheckbox.click();

    titleInput.disabled = false;
    infoContent.disabled = false;

    switch (state) {
      // ESTADO DE HABILITAÇÃO DE NOVA ENTRADA.
      case this.states.newEntry: {
        titleInput.disabled = true;
        infoContent.disabled = true;

        imageContainer.classList.remove('disabled');

        // Limpe qualquer conteúdo, caso uma entrada já estiver sendo manipulada.
        if (this.currentState > this.states.newEntry) this.clearContent(false);

        // Configuração dos Estados dos Botões.
        const saveButton = this.querySelector('#saveButton');
        const newEntryButton = this.querySelector('#newEntryButton');
        const cancelButton = this.querySelector('#cancelButton');

        saveButton.innerHTML = '<i class="fa-regular fa-floppy-disk"></i> Salvar';
        saveButton.classList.add('disabled');

        newEntryButton.classList.remove('disabled');

        cancelButton.classList.add('hidden');

        mainEditor?.mode.set('readonly');
      } break;
      // ESTADO DE EDIÇÃO DE ENTRADA.
      case this.states.adding: {
        // Está adicionando uma Entrada nova.
        this.isEntryUpdate = false;

        // Foca no campo de Título.
        const titleInput = this.querySelector('#titleInput');
        titleInput.focus();
        imageContainer.classList.remove('disabled');

        deleteSwitch.classList.remove('hidden');

        // Configuração dos Estados dos Botões.
        const saveButton = this.querySelector('#saveButton');
        const cancelButton = this.querySelector('#cancelButton');

        // Configuração do label no botão de Salvar.
        saveButton.innerHTML = '<i class="fa-regular fa-floppy-disk"></i> Salvar';
        saveButton.classList.remove('disabled');

        cancelButton.classList.remove('hidden');

        mainEditor?.mode.set('design');
      } break;
      // ESTADO DE EDIÇÃO DE ENTRADA.
      case this.states.editing: {
        // Está atualizando uma Entrada pré-existente.
        this.isEntryUpdate = true;

        // Foca no campo de Título.
        const titleInput = this.querySelector('#titleInput');
        titleInput.focus();
        imageContainer.classList.remove('disabled');

        deleteSwitch.classList.remove('hidden');

        // Configuração dos Estados dos Botões.
        const saveButton = this.querySelector('#saveButton');
        const cancelButton = this.querySelector('#cancelButton');

        // Configuração do label no botão de Salvar.
        saveButton.innerHTML = '<i class="fa-regular fa-floppy-disk"></i> Atualizar';
        saveButton.classList.remove('disabled');

        cancelButton.classList.remove('hidden');

        mainEditor?.mode.set('design');
      } break;
      // ESTADO PADRÃO.
      default: {
        this.clearContent();

        // Limpa todo o dataset do Header Info.
        const headerInfo = this.querySelector('.header-info');
        Object.keys(headerInfo.dataset).forEach(key => {
          delete headerInfo.dataset[key];
        });

        // Desativa recipiente de imagens.
        imageContainer.classList.add('disabled');

        // As entradas de dados nesse estado estão desativadas.
        titleInput.disabled = true;
        infoContent.disabled = true;

        // -----------------------------------------------------------------------
        //    Configuração dos Estados dos Botões.
        // -----------------------------------------------------------------------
        const saveButton = this.querySelector('#saveButton');
        const newEntryButton = this.querySelector('#newEntryButton');
        const cancelButton = this.querySelector('#cancelButton');

        // Configuração do label no botão de Salvar.
        saveButton.innerHTML = '<i class="fa-regular fa-floppy-disk"></i> Salvar';

        // Nesse estado, todos os botões estão desativados.
        saveButton.classList.add('disabled');
        newEntryButton.classList.add('disabled');
        cancelButton.classList.add('hidden');

        // -----------------------------------------------------------------------
        //    Configuração dos Estados dos editores Tiny MCE.
        // -----------------------------------------------------------------------           
        mainEditor?.mode.set('readonly'); // Desativa o editor.
      } break;
    }

    // Atualiza o estado atual do formulário.
    this.currentState = state;
  }
  /**
   * Recarrega os controles do formulário.
   * @protected
   */
  refreshStates() {
    const state = this.currentState;
    this.controlStates(state);
  }

  /**
  * Fecha dialog aberto, se houver um.
  */
  closeDialog() {
    if (this.dialog) {
      this.dialog.close();
    }
  }

  /**
   * Cancela a edição atual, retornando o formulário ao estado padrão.
   * Isso fecha qualquer diálogo aberto e desativa todos os controles.
   * @protected
   */
  cancel() {
    this.controlStates(this.states.default);
  }

  /* ---------------------------------------------------------------------------------------------------------------- */
  // CONFIGURAÇÃO
  /**
   * Configura o conteúdo do formulário.
   * Sobrescreve a configuração na classe pai.
   * 
   * @async
   */
  async configureContent() {
    await super.configureContent();

    // Configura o editor Tiny MCE principal .
    await this.configureTinyMCE();
  }

  /**
   * Limpa o conteúdo do formulário
   * @param {Boolean} clearSidebar - Flag para habilitar/desabilitar a limpeza da seleção da sidebar.
   */
  clearContent(clearSidebar = true) {
    if (clearSidebar) super.clearContent();

    const titleInput = this.querySelector('#titleInput');
    titleInput.value = '';

    const isDraftSwitch = this.querySelector('#checkbox');
    isDraftSwitch.checked = false;

    // Limpa todos os editores Tiny MCE inicializados.
    tinymce.get().forEach(editor => {
      editor.setContent('');
    });

    this.closeDialog();
  }

  /**
   * Configura o diálogo de categorias.
   * @private
   */
  configureSidebarDialog() {
    const dialog = this.ui.dialog;
  }

  /**
   * Configura o combo de Assuntos.
   * @param {HTMLElement} form - O formulário HTML principal.
   * @async
   */
  async configureSubjectSelect(form) {
    // Carrega as opções de Tipos de Entradas registrados
    const subjectType = this.querySelector('#subjectType');
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
    const importances = this.data.importances;

    // Carrega as opções de Importâncias registradas
    const importance = this.querySelector('#importance');
    for (const data of Object.values(importances)) {
      importance.appendChild(this._newImportanceOption(data));
    }
  }

  /**
   * Configura o combo de Tipos de Entrada.
   * @param {HTMLElement} form - O formulário HTML principal.
   */
  configureEntryTypeSelect(form) {
    const entryTypes = this.data.entryTypes;

    // Carrega as opções de Tipos de Entradas registrados
    const entryType = this.querySelector('#entryType');
    for (const data of Object.values(entryTypes)) {
      entryType.appendChild(this._newEntryTypeOption(data));
    }
  }

  /**
   * Configura o combo de Tipos de Entrada.
   * @param {HTMLElement} form - O formulário HTML principal.
   * @async
   */
  async configureCalendarSelect(form) {
    const calendars = await this.data.calendars;

    // Carrega as opções de Calendários registrados
    const calendarType = this.querySelector('#calendarType');
    for (const data of Object.values(calendars)) {
      calendarType.appendChild(this._newCalendarOption(data));
    }
  }

  /**
   * Inicializa e configura o editor TinyMCE.
   * Remove qualquer instância existente antes de reconfigurar.
   * @private
   */
  async configureTinyMCE() {
    if (tinymce.get('mainEditor')) {
      tinymce.remove('#mainEditor');
    }

    const options = uniforge.utils.mergeObjects(uniforge.tinymceOptions.default, {
      selector: 'textarea#mainEditor',
      init_instance_callback: (editor) => {
        editor.setContent(""); // Garante que o editor seja iniciado vazio.
      },
      text_patterns: [
        { start: '@[', end: ']', format: 'bold' },
        { start: '{', end: '}', format: 'italic' }
        //{ start: '##', format: 'blockquote', trigger: 'space' }
      ],
      setup: (editor) => { this._setupTinyMCE(editor); }
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
    super.activateListeners()
    const imageContainer = this.querySelector('#imageContainer');
    const displayedImage = this.querySelector('#displayedImage');
    const fileInput = this.querySelector('#hiddenFileInput');
    const deleteSwitch = this.querySelector('#deleteSwitch');
    const deleteCheckbox = deleteSwitch.querySelector('#checkbox');

    const cancelButton = this.querySelector('#cancelButton');
    const newEntryButton = this.querySelector('#newEntryButton');
    const saveButton = this.querySelector('#saveButton');

    const entriesList = this.querySelectorAll('.entry-item');

    const yesBtn = this.querySelector('#confirm-yes');
    const noBtn = this.querySelector('#confirm-no');

    deleteCheckbox.addEventListener('change', (event) => { this.onDeleteSwitchChange(event); });

    // Adiciona um evento para lidar com a seleção de uma nova imagem.
    fileInput.addEventListener('change', (event) => { this.onChangeImage(event, displayedImage); });

    // Adiciona um evento de clique no contêiner de imagem para abrir o seletor de arquivos.
    imageContainer.addEventListener('click', (event) => { this.onImageClick(event, fileInput, displayedImage); });
    imageContainer.addEventListener('contextmenu', (event) => { this.onImageRightClick(event, displayedImage); });

    cancelButton.addEventListener('click', (event) => { this.onCancelClick(event); });
    newEntryButton.addEventListener('click', (event) => { this.onBaseNewClick(event); });
    saveButton.addEventListener('click', (event) => { this.onBaseSaveClick(event); });

    entriesList.forEach(item => {
      const deleteIcon = item.querySelector('.remove-button');
      deleteIcon.addEventListener('click', (event) => { this.onOpenDialogClick(event, item); });
    });

    yesBtn.addEventListener('click', (event) => { this.onDeleteClick(event); });
    noBtn.addEventListener('click', (event) => { this.onCancelSidebarDialogClick(event); });
  }

  /**
   * Reconfigura alguns ouvintes de eventos para o formulário após alguma alteração nos dados.
   * @param {HTMLElement} form - O formulário principal.
   * @private
   */
  reactivateListeners(form) {
    super.reactivateListeners(form);
    const entriesList = this.querySelectorAll('.entry-item');

    entriesList.forEach(item => {
      const deleteIcon = item.querySelector('.remove-button');
      deleteIcon.addEventListener('click', (event) => { this.onOpenDialogClick(event, item); });
    });
  }

  /**
   * Gerencia cliques no switch de Deleção de Dados.
   * @param {MouseEvent} event - O evento de clique.
   * @protected
   */
  onDeleteSwitchChange(event) {
    event.stopPropagation();
    this.canDelete = event.target.checked;
    const imageContainer = this.querySelector('#imageContainer');

    if (this.canDelete) {
      imageContainer.classList.add('delete');
    } else {
      imageContainer.classList.remove('delete');
    }
  }

  /**
   * Gerencia cliques em pastas.
   * @param {MouseEvent} event - O evento de clique.
   * @protected
   */
  onFolderClick(event) {
    super.onFolderClick(event);

    const clickedFolder = event.target.closest('.folder');
    const isSelected = clickedFolder.classList.contains('selected');

    // A seleção de folders somente afeta o estado do formulário, se ele estiver no 
    // estado padrão.
    if (this.currentState == this.states.default) {
      if (isSelected) this.controlStates(this.states.newEntry);
      else this.controlStates(this.states.cancelEntry);
    }
  }

  /**
   * Manipulador de evento para alterar a imagem exibida.
   * @param {Event} event                     - Evento disparado pelo input de arquivo.
   * @param {HTMLImageElement} fileInput      - Elemento de carga de arquivo de imagem.
   * @param {HTMLImageElement} displayedImage - Elemento de imagem a ser atualizado.
   */
  async onImageClick(event, fileInput, displayedImage) {
    if (this.canDelete) {
      const confirm = await Dialog.confirm('Apagar Imagem', 'Deseja remover a imagem?')
      if (confirm) {

        this.selectedImg.rawData = null;

        displayedImage.src = this.blankImgUrl;
        displayedImage.classList.add('empty');
      }
    } else {
      fileInput.click();
    }
  }
  /**
   * Manipulador de evento para alterar a imagem exibida.
   * @param {Event} event                     - Evento disparado pelo input de arquivo.
   * @param {HTMLImageElement} displayedImage - Elemento de imagem a ser atualizado.
   */
  async onImageRightClick(event, displayedImage) {
    event.preventDefault();

    if (this.selectedImg.rawData && !displayedImage.classList.contains('empty')) {
      const imageUrl = await uniforge.utils.blobToImage(this.selectedImg.rawData, this.selectedImg.ext);
      await Dialog.showImagem('Exibir Imagem', imageUrl);
    }
  }
  /**
   * Manipulador de evento para alterar a imagem exibida.
   * @param {Event} event                     - Evento disparado pelo input de arquivo.
   * @param {HTMLImageElement} displayedImage - Elemento de imagem a ser atualizado.
   */
  async onChangeImage(event, displayedImage) {
    const file = event.target.files[0];

    // Verifica se um arquivo foi selecionado e se é uma imagem.
    if (file && file.type.startsWith('image/')) {
      // Cria um URL temporário para o arquivo selecionado.
      const imageURL = URL.createObjectURL(file);

      // Atualiza a imagem exibida.
      displayedImage.src = imageURL;
      displayedImage.dataset.ext = file.type.split('/')[1];
      displayedImage.classList.remove('empty');

      this.selectedImg = await uniforge.utils.imageToBlob(file);

      // Libera o URL temporário quando não for mais necessário.
      displayedImage.onload = () => {
        URL.revokeObjectURL(imageURL);
      };
    }
  }

  /**
   * Manipulador de evento para alterar o tipo de calendário exibido.
   * @param {Event} event - Evento disparado pelo input de arquivo.
   */
  onDateTypeChange(event) {
    const select = event.target;
    const dateType = select.value;

    const calendar = this.data.calendars[dateType];

    Object.values(this.datePickers).forEach(pickers => {
      pickers._loadDatePicker(calendar);
    });
  }

  /**
  * Trata o evento de criação de um novo item qualquer.
  * @param {Event} event - Evento de clique no botão de Nova Entrada.
  */
  async onBaseNewClick(event) {
    event.stopPropagation();
    // Ignora o clique se o botão estiver desativado.
    //const button = event.target.closest('#newEntryButton');
    //if (button.classList.contains('disabled')) return;

    // Obtém a lista de Categorias
    const selectedFolder = this.selection.folder;
    if (!selectedFolder) {
      this.msgBox.showWarning('Nenhuma categoria foi selecionada.');
      return;
    }

    const headerInfo = this.querySelector('.header-info');
    if (this.isEncyclopedia) headerInfo.dataset.sid = selectedFolder.dataset.sid ?? null;
    else headerInfo.dataset.cid = selectedFolder.dataset.cid ?? null;

    const titleInput = this.querySelector('#titleInput');
    titleInput.focus();

    if (!this.onNewClick) {
      const message = 'Método de tratamento do clique de novo item não foi implementado no formulário filho.';
      this.msgBox.showWarning(message);
    } else {
      // Configuração do label no botão de Salvar.
      const saveButton = this.querySelector('#saveButton');
      saveButton.innerHTML = '<i class="fa-regular fa-floppy-disk"></i> Salvar';

      await this.onNewClick(event);
      this.controlStates(this.states.adding);
    }
  }

  /**
    * Trata o evento de registro de uma nova entrada.
    * @param {Event} event - Evento de clique no botão de Salvar.
    */
  async onBaseSaveClick(event) {
    event.stopPropagation();

    const item = this.selection.entry;
    this.isEntryUpdate = (item ? true : false);
    const itemId = item?.dataset.id ?? -1;

    if (!this.onSaveClick) {
      const message = 'Método de tratamento do clique de salvamento não foi implementado no formulário filho.';
      this.msgBox.showWarning(message);
    } else {      
      try {
        const options = {
          id: itemId,
          isEntryUpdate: this.isEntryUpdate
        }

        const title = (this.isEntryUpdate ? 'Atualizar' : 'Registrar');
        let message = '';

        if(this.isEncyclopedia) message = (this.isEntryUpdate ? 'Deseja atualizar a categoria?' : 'Deseja salvar a categoria?');
        else message = (this.isEntryUpdate ? 'Deseja atualizar a entrada?' : 'Deseja salvar a entrada?');

        if (await Dialog.confirm(title, message)) {
          const imgInput = this.querySelector('#hiddenFileInput');
          const titleInput = this.querySelector('#titleInput');
          const draftSwitch = this.querySelector('#isDraftSwitch');
          const draftCheckbox = draftSwitch.querySelector('#checkbox');

          const data = {
            title: titleInput.value,
            isDraft: Number(draftCheckbox.checked),
          };         

          // Se uma imagem foi informada, prepare-a para o banco de dados.
          uniforge.utils.mergeObjects(data, this.selectedImg);

          await this.onSaveClick(event, data, options);
        }
      } catch (error) {
        console.error(error);
        this.msgBox.showError(error.message);
      }

      await this.refresh();
    }
  }

  /**
   * Remove uma entrada de uma categoria da lista.
   * @param {Event} event - Evento de clique no botão para excluir a entrada.
   */
  async onDeleteClick(event) {
    event.stopPropagation();
    const id = this.ui.dialog.dataset.id;

    if (this.isEncyclopedia) await uniforge.db.deleteCategory(id);
    else await uniforge.db.deleteEntry(id);

    await this.refresh();
  }

  /**
   * Gerencia cliques duplos em itens de entrada.
   * @protected
   * @param {MouseEvent} event - O evento de clique duplo.
   */
  async onEntryItemDoubleClick(event) {
    await super.onEntryItemDoubleClick(event);

    const item = event.target.closest('.entry-item');
    const itemId = item.dataset.id;
    let entry = null;
    if (this.isEncyclopedia) entry = uniforge.doc.categories.get(itemId);
    else entry = uniforge.doc.entries.get(itemId);

    if (entry) {
      const headerInfo = this.querySelector('.header-info');
      headerInfo.dataset.cid = entry.cid ?? null;
      headerInfo.dataset.sid = entry.sid ?? null;

      const displayedImage = this.querySelector('#displayedImage');
      const titleInput = this.querySelector('#titleInput');

      const draftSwitch = this.querySelector('#isDraftSwitch');
      const draftCheckbox = draftSwitch.querySelector('#checkbox');

      titleInput.value = entry.title;
      draftCheckbox.checked = entry.isDraft;

      if (entry.img) {
        const imageUrl = await uniforge.utils.blobToImage(entry.img, entry.ext);

        displayedImage.dataset.ext = entry.ext;
        displayedImage.src = imageUrl
        displayedImage.classList.remove('empty');
      } else { // A imagem é vazia.
        this.clearImage();
      }

      this.selectedImg = {
        rawData: entry.img,
        ext: entry.ext
      };

      this.data.entry = entry;

      // Atualiza o estado dos elements do formulário.
      this.controlStates(this.states.editing);
    } else {
      this.msgBox.showWarning('Erro ao carregar a entrada.');
    }
  }

  /**
   * Rotina para tratamento do tooltip de confirmação de remoção.
   * @param {Event} event - Evento de clique no ícone de exclusão.
   * @param {HTMLElement} item - O item da pasta a ser excluído.
   */
  onOpenDialogClick(event, item) {
    event.stopPropagation();

    const dataType = (this.isEncyclopedia ? 'do assunto' : 'da categoria');

    this.ui.dialog.dataset.id = item.dataset.id;
    this.ui.dialog.dataset.action = 'del';

    const message = `Tem certeza que deseja excluir a entrada ${dataType}?`;
    this._showDialog(message);
  }
  /**
   * Rotina para tratamento do tooltip de confirmação de remoção.
   * @param {Event} event - Evento de clique no ícone de exclusão.
   */
  onCancelSidebarDialogClick(event) {
    event.stopPropagation();

    this._hideDialog();
    this.controlStates(this.states.default);
  }

  /**
    * Trata o evento de cancelamento de um novo item.
    * @param {Event} event - Evento de clique no botão de Cancelar.
    */
  async onCancelClick(event) {
    event.stopPropagation();

    this.cancel();
  }
  /**
    * Ação personalizada no editor TinyMCE para criar ou modificar links.
    * @param {Object} editor - Instância do editor TinyMCE.
    */
  async onEntryLinkCreation(editor) {
    const tooltip = this.ui.tooltip;
    const selectedHtml = editor.selection.getContent();

    const id = this.selection.entry.dataset.id;
    const type = ((this.querySelector('.entries')).classList.contains('timeline') ? 'timeline' : 'entry');
    const link = await LinkDialog.configDialog({ id, type });

    if (link) {
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
          const wrappedContent = `${leadingSpaces ? leadingSpaces[0] : ''}@[${link.id}, ${link.type}]{${trimmedText}}${trailingSpaces ? trailingSpaces[0] : ''}`;
          editor.selection.setContent(wrappedContent);
        } else {
          editor.notificationManager.open({
            text: 'Favor selecionar um texto antes de criar um link.',
            type: 'warning'
          });
        }
      }
    }
  }

  /**
   * Cria um ImagePicker e trata a ação do usuário de envio de uma imagem para o texto.
   * @private
   * @param {Object} editor - Instância do editor TinyMCE.
   */
  async onUploadImage(editor) {
    // Abre o diálogo de seleção de imagem.
    const image = await ImagePickerDialog.configDialog();

    // Se uma imagem foi selecionada, insira-a no editor.
    if (image) {
      const rawData = image.data;

      // Recupera o elemento do editor TinyMCE.
      const editorTexarea = editor.targetElm;
      // Recupera a contagem de imagens no editor.
      const imgCount = Number(editorTexarea.dataset.imgCounter);

      // Cria o elemento <div> que envolverá a imagem e sua legenda.
      const imgWrapper = document.createElement('figure');
      imgWrapper.dataset.uuid = image.uuid;
      imgWrapper.className = 'img-wrapper image';
      imgWrapper.contenteditable = 'false';

      const newImage = document.createElement('img');
      const imageURL = await uniforge.utils.blobToImage(rawData.img, rawData.ext);
      newImage.src = imageURL;

      const newCaption = document.createElement('figcaption');
      newCaption.className = 'img-caption';
      newCaption.textContent = `Imagem ${imgCount + 1} - ${image.caption}`;
      newCaption.contenteditable = 'true';

      imgWrapper.appendChild(newImage);
      imgWrapper.appendChild(newCaption);

      // Insira o HTML na posição atual do cursor.
      editor.execCommand('mceInsertContent', false, imgWrapper.outerHTML);
      // Registra o Blob da imagem no banco de dados.
      await uniforge.db.addEntriesTextImages(image);
      // Atualiza a contagem de imagens no editor.
      this._updateImageCount(editor);
    }
  }

  /* ---------------------------------------------------------------------------------------------------------------- */
  // UTILITÁRIOS
  /**
   * Gera uma nova opção para o ComboBox de Assuntos.
   * @protected
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
   * @protected
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
   * @protected
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
   * @protected
   * @param {Object} calendar - Objeto com os dados do Calendário.
   * @returns {HTMLElement} - Elemento da nova opção
   */
  _newCalendarOption(data) {
    const newOption = document.createElement('option');
    newOption.value = data.clid;
    newOption.textContent = data.label;

    return newOption;
  }

  /**
  * Atualiza a contagem de imagens no editor.
  * Obtém o conteúdo atual do editor e conta as tags <img>.
  * Define o atributo data-img-counter do textarea do editor com a contagem de imagens.
  *
  * @param {Object} editor - O editor cujo conteúdo será analisado.
  */
  _updateImageCount(editor) {
    const content = editor.getContent(); // Obtém o conteúdo atual do editor
    const imageCount = (content.match(/<img\b[^>]*>/gi) || []).length; // Conta as tags <img>

    const editorTextarea = editor.targetElm;
    editorTextarea.dataset.imgCounter = imageCount;
  }

  async _initializeImagesInText(editor) {
    const content = editor.getContent(); // Obtém o conteúdo atual do editor
    const searchDiv = document.createElement('div'); // Cria um elemento temporário
    searchDiv.innerHTML = content; // Define o conteúdo do elemento temporário

    const imgArray = searchDiv.querySelectorAll('.img-wrapper'); // Seleciona todos os <div> com a classe 'img-wrapper'
    imgArray.forEach(async (img) => {
      const uuid = img.dataset.uuid; // Obtém o uuid armazenado no <div>
      const data = await uniforge.db.getEntriesTextImage(uuid); // Obtém a imagem do banco de dados
      const imageURL = uniforge.utils.blobToImage(data.img, data.ext); // Converte o blob da imagem para URL
    });
  }
  /**
   * Habilita todas as entradas de uma pasta (categoria) para poderem ser atualizadas.
   */
  addDeleteIconToEntryItems() {
    const entriesList = this.querySelectorAll('.entry-item');

    entriesList.forEach(item => {
      const removeButton = item.querySelector('.remove-button');
      // Se o item não possui botão de remoção, adicione-o.
      if (!removeButton) {
        const deleteIcon = this.createDeleteIcon();
        //deleteIcon.addEventListener('click', (event) => { this.onOpenDialogClick(event, item); });
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
   * Configura o editor TinyMCE com funcionalidades padrões.
   * @private
   * @param {Object} editor - Instância do editor TinyMCE.
   */
  _setupTinyMCE(editor) {
    const tooltip = this.ui.tooltip;

    // Update the image count on editor initialization
    editor.on('init', () => {
      this._updateImageCount(editor)
    });

    // Update the image count whenever the content changes
    editor.on('input', () => this._updateImageCount(editor));
    editor.on('change', () => this._updateImageCount(editor));
    editor.on('NodeChange', () => this._updateImageCount(editor));

    editor.ui.registry.addButton('entryLink', {
      tooltip: 'Criar link',
      icon: 'bookmark',
      onAction: () => { this.onEntryLinkCreation(editor); }
    });

    // Adiciona um botão de imagem customizado na toolbar
    editor.ui.registry.addButton('sendImage', {
      icon: 'image',
      tooltip: 'Enviar Imagem',
      onAction: () => { this.onUploadImage(editor); }
    });

    editor.on('mouseover', (event) => {
      const span = event.target.closest('span.linked-text');
      if (span) {
        tooltip._showLinkTooltip(span);
      } else {
        tooltip._hideLinkTooltip();
      }
    });

    editor.on('mouseout', () => {
      tooltip._hideLinkTooltip();
    });
  }
  /**
   * Configura o editor TinyMCE com funcionalidades inline.
   * @protected
   * @param {Object} editor - Instância do editor TinyMCE.
   */
  _setupInlineTinyMCE(editor) {
    // Número máximo de caractéres do editor Tiny MCE de floreio.
    const maxCharacters = 255;

    // Sobrescreve o método setContent para limitar o conteúdo
    const originalSetContent = editor.setContent;

    editor.setContent = function (content, ...args) {
      if (editor.selection) {
        // Salva a posição atual do cursor
        const bookmark = editor.selection.getBookmark(2);

        const plainTextContent = editor.dom.create('div', null, content).innerText; // Remove tags HTML
        if (plainTextContent.length > maxCharacters) {
          const truncatedText = plainTextContent.substring(0, maxCharacters);
          const truncatedHtml = editor.dom.create('div', null, truncatedText).innerHTML;
          originalSetContent.call(editor, truncatedHtml, ...args);
        } else {
          originalSetContent.call(editor, content, ...args);
        }

        // Restaura o cursor para a posição salva
        if (bookmark) {
          editor.selection.moveToBookmark(bookmark);
        }
      }
    };

    // Evento para interceptar colagem
    editor.on('PastePreProcess', (e) => {
      const plainTextContent = editor.dom.create('div', null, e.content).innerText; // Remove HTML
      if (plainTextContent.length > maxCharacters) {
        const truncatedText = plainTextContent.substring(0, maxCharacters);
        const truncatedHtml = editor.dom.create('div', null, truncatedText).innerHTML;
        e.content = truncatedHtml; // Atualiza o conteúdo colado
      }
    });

    // Evento para evitar exceder o limite durante a digitação
    editor.on('input', () => {
      const plainTextContent = editor.getContent({ format: 'text' });
      if (plainTextContent.length > maxCharacters) {
        const truncatedText = plainTextContent.substring(0, maxCharacters);
        editor.setContent(truncatedText); // Trunca o conteúdo
      }
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
}
