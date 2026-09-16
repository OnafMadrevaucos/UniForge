import SidebarForm from "./sidebarForm.js";
import Dialogs from "../dialogs/dialog.js";
import ChapterDialog from "../dialogs/chapterDialog.js";
import Section from "../../common/documents/section.mjs";

/**
* Constrói uma instância da classe derivada, inicializando as propriedades e configurando o conteúdo.
* @class
* @extends SidebarForm
*/
export default class ChapterForm extends SidebarForm {

    /**
    * Construtor da classe ChapterForm.
    * 
    * @param {HTMLElement} sourceBtn   - O botão que originou a chamada do formulário.
    * @param {Function} callback             - A função de callback a ser chamada quando o formulário for fechado.
    */
    constructor(sourceBtn, options = { callback: null }) {
        if (!sourceBtn) throw new Error('O botão de origem não pode ser nulo ou indefinido.');

        // Chama o construtor da classe pai com o parâmetro overlay.
        super('Gerenciador de Capítulos', uniforge.utils.mergeObjects(options, { closeCallback: options.callback }));

        /**
        * @type {string} - O modelo HTML utilizado pelo formulário.
        */
        this.template = 'chaptersForm';

        /**
         * Estados válidos para os elements do formulário.
         * @type {Object<number, number>}
         */
        this.states = this._states;

        /**@override*/
        this.docTag = 'chapters';

        /**@override*/
        this.dataSource = 'sections';

        /**
         * @type {Section} - A classe de documento utilizada pelo formulário.
         */
        this.documentClass = Section;

        // Verifica se o formulário possui um callback de fechamento e configura-o.
        if (this.options.closeCallback) this.onCloseCallback = this.options.closeCallback;
    }

    /* ---------------------------------------------------------------------------------------------------------------- */
    // GETTERS E SETTERS 

    /**
     * Conjunto de filtros de item que representam os estados aplicáveis na classe EntryForm.
     * Os estados estão mapeados para números inteiros que representam ações específicas.
     * 
     * @type {Object<number, number>}
     * @private
     * @property {number} default  - Representa o estado de cancelamento de uma entrada (valor 0).
     * @property {number} newEntry - Representa o estado de criação de uma nova entrada (valor 1).
     * @property {number} adding   - Representa o estado de salvamento de uma entrada nova (valor 2).
     * @property {number} editing  - Representa o estado de salvamento de uma entrada pré-existente (valor 3). 
     */
    #states = {
        default: 0,
        newEntry: 1,
        adding: 2,
        editing: 3
    }

    /** Identificador da Entrada atual.
     * @returns {Object} 
     */
    get id() { return this.document?._id; }

    /**
     * @overload
     * Retorna um objeto com seletores para elementos da aplicação.
     * 
     * @returns {Object} - Um objeto com as seguintes propriedades:
     *  - app: Seletor para o elemento container da aplicação.
     *  - header: Seletor para o elemento header da aplicação.
     *  - main: Seletor para o elemento main da aplicação.
     *  - close_btn: Seletor para o elemento de fechar a aplicação.
     *  - main_editor: Seletor para o principal editor Tiny MCE da aplicação.  
     */
    get query() {
        const query = {
            main_editor: `MainEditor-${this.uuid}`
        }
        return uniforge.utils.mergeObjects(super.query, query);
    }

    /**
     * @overload
     * Retorna um objeto com referências para elementos do formulário.
     * 
     * @returns {Object}  - Um objeto com as seguintes propriedades:
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
     * Define o conteúdo do editor principal.
     * @param {string} content - O conteúdo a ser definido.
     */
    set mainEditor(content) {
        if (this.mainEditor && content !== undefined) {
            if (!content.isEmpty() && !(typeof content === 'string')) throw new TypeError('O conteúdo deve ser uma string.');

            content = content ?? ''; // Se o conteúdo for nulo, faça o conteúdo vazio.
            this.mainEditor.setContent(content);
        }
    }

    /**
     * Retorna o objeto que armazena os estados do formulário.
     *
     * @returns {Object<number, number>} - Um objeto que mapeia os nomes dos estados
     *                                     para números inteiros. Os estados são:
     *                                     default, newEntry, adding e editing.
     */
    get _states() {
        return this.#states;
    };

    get mainEditor() {
        const editor = tinymce.get(this.query.main_editor);
        return editor ? editor : null;
    }

    /* ---------------------------------------------------------------------------------------------------------------- */
    // PREPARAÇÃO DOS DADOS    

    /** @override */
    prepareFolders(data) {
        data.folders = uniforge.doc[this.docTag].sort();
    }

    /* ---------------------------------------------------------------------------------------------------------------- */
    // INTERFACE DE USUÁRIO

    /**
     * @inheritdoc
    * Inicia a construção do formulário.
    */
    async initialize() {
        await super.initialize();

        // Atribui o estado padrão aos controles do formulário.
        this.controlStates(this.states.default);
    }
    /**
     * Habilita/desabilita os controles do formulário.
     * @param {Number} state - O novo estado do formulário.
     * @protected
     */
    controlStates(state, options = {}) {
        const titleInput = this.querySelector('#titleInput');
        const infoSet = this.querySelector('.info-set:not(.not-disable)');
        const mainEditor = this.mainEditor;
        const deleteSwitch = this.querySelector('#deleteSwitch');
        const deleteCheckbox = deleteSwitch.querySelector('#checkbox');

        const ignoreEditor = options.ignoreEditor ?? false;

        if (this.canDelete) deleteCheckbox.click();

        titleInput.disabled = false;
        infoSet.disabled = false;

        switch (state) {
            // ESTADO DE HABILITAÇÃO DE NOVA ENTRADA. 
            // Ex.: Após a seleção de uma pasta.
            case this.states.newEntry: {
                // Não pode ser uma tela de Configurações.
                if (!this.isSettings) {
                    titleInput.disabled = true;
                    infoSet.disabled = true;
                }

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

                if (!ignoreEditor) mainEditor?.mode.set('readonly');
            } break;
            // ESTADO DE ADIÇÃO DE ENTRADA.
            // Ex.: O usuário clicou em "Nova Entrada".
            case this.states.adding: {
                // Limpe o conteúdo do formulário.
                this.clearContent(false);
                // Está adicionando uma Entrada nova.
                this.isUpdate = false;

                // Foca no campo de Título.
                const titleInput = this.querySelector('#titleInput');
                titleInput.focus();

                // Exibe o switch de Deleção de Dados.
                deleteSwitch.classList.remove('hidden');

                // Configuração dos Estados dos Botões.
                const saveButton = this.querySelector('#saveButton');
                const cancelButton = this.querySelector('#cancelButton');

                // Configuração do label no botão de Salvar.
                saveButton.innerHTML = '<i class="fa-regular fa-floppy-disk"></i> Salvar';
                saveButton.classList.remove('disabled');

                // Exibe o botão de Cancelar.
                cancelButton.classList.remove('hidden');

                if (!ignoreEditor) mainEditor?.mode.set('design');
            } break;
            // ESTADO DE EDIÇÃO DE ENTRADA.
            // Ex.: O usuário está editando uma Entrada já existente.
            case this.states.editing: {
                // Está atualizando uma Entrada pré-existente.
                this.isUpdate = true;

                // Foca no campo de Título.
                const titleInput = this.querySelector('#titleInput');
                titleInput.focus();

                // Exibe o switch de Deleção de Dados.
                deleteSwitch.classList.remove('hidden');

                // Configuração dos Estados dos Botões.
                const saveButton = this.querySelector('#saveButton');
                const cancelButton = this.querySelector('#cancelButton');

                // Configuração do label no botão de Salvar.
                saveButton.innerHTML = '<i class="fa-regular fa-floppy-disk"></i> Atualizar';
                saveButton.classList.remove('disabled');

                // Exibe o botão de Cancelar.
                cancelButton.classList.remove('hidden');

                if (!ignoreEditor) mainEditor?.mode.set('design');
            } break;
            // ESTADO PADRÃO.
            // Estado exibido quando a tela é aberta ou quando uma ação é cancelada.
            default: {
                // Limpe o conteúdo do formulário.
                this.clearContent();

                // Oculta o switch de Deleção de Dados.
                deleteSwitch.classList.add('hidden');

                // Limpa todo o dataset do Header Info.
                const headerInfo = this.querySelector('.header-info');
                Object.keys(headerInfo.dataset).forEach(key => {
                    delete headerInfo.dataset[key];
                });

                titleInput.disabled = true;
                infoSet.disabled = true;

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
                if (!ignoreEditor) mainEditor?.mode.set('readonly'); // Desativa o editor. 
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

    /** @inheritdoc */
    close() {
        // Habilita o botão de origem, caso exista.
        this.sourceBtn?.classList.remove('disabled');

        // Limpa o conteúdo do editor principal.
        this.mainEditor.remove();

        super.close();

        if (this.closeCallback) this.closeCallback();
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
   * @param {Boolean} clearSidebar - Flag para habilitar/desabilitar a limpeza da seleção da sidebar (true por padrão).
   */
    clearContent(clearSidebar = true) {
        if (clearSidebar) super.clearContent();

        const titleInput = this.querySelector('#titleInput');
        titleInput.value = '';

        const isDraftSwitch = this.querySelector('#checkbox');
        isDraftSwitch.checked = false;

        // Limpa todos os editores Tiny MCE inicializados.
        this.mainEditor = '';

        this.document = null;

        this.closeDialog();
    }

    /**
     * Inicializa e configura o editor TinyMCE.
     * Remove qualquer instância existente antes de reconfigurar.
     * @private
     */
    async configureTinyMCE() {
        if (this.mainEditor) {
            tinymce.remove(this.query.main_editor);
        } else {
            // Trata o id do container do editor, inserindo o uuid do formulário.
            const textarea = this.querySelector('#mainEditor');
            if (!textarea) return;
            textarea.id = this.query.main_editor;
        }

        const options = uniforge.utils.mergeObjects(uniforge.tinymceOptions.default, {
            selector: `textarea#${this.query.main_editor}`,
            init_instance_callback: (editor) => {
                editor.setContent(""); // Garante que o editor seja iniciado vazio.
            },
            text_patterns: [
                { start: '@[', end: ']', format: 'bold' },
                { start: '@{', end: '}', format: 'italic' }
                //{ start: '##', format: 'blockquote', trigger: 'space' }
            ],
            setup: (editor) => { this._setupTinyMCE(editor); }
        });

        await tinymce.init(options);

        const iframe = this.mainEditor.getDoc().documentElement;
        iframe.setAttribute(
            "data-theme",
            document.documentElement.getAttribute("data-theme")
        );
    }

    /* ---------------------------------------------------------------------------------------------------------------- */
    // LISTENERS

    /**
    * Configura ouvintes de eventos básicos para o formulário.
    * @inheritdoc
    */
    activateListeners() {
        super.activateListeners();
        const deleteSwitch = this.querySelector('#deleteSwitch');
        const deleteCheckbox = deleteSwitch.querySelector('#checkbox');

        const newChapterButton = this.querySelector('#newChapterButton');

        const cancelButton = this.querySelector('#cancelButton');
        const newEntryButton = this.querySelector('#newEntryButton');
        const saveButton = this.querySelector('#saveButton');

        const entriesList = this.querySelectorAll('.entry-item');

        const yesBtn = this.querySelector('#confirm-yes');
        const noBtn = this.querySelector('#confirm-no');

        deleteCheckbox.addEventListener('change', (event) => { this.onDeleteSwitchChange(event); });
        newChapterButton.addEventListener('click', this.onNewChapterClick.bind(this));

        cancelButton.addEventListener('click', (event) => { this.onCancelClick(event); });
        newEntryButton.addEventListener('click', (event) => { this.onNewClick(event); });
        saveButton.addEventListener('click', (event) => { this.onSaveClick(event); });

        entriesList.forEach(item => {
            const deleteIcon = item.querySelector('.remove-button');

            if (deleteIcon)
                deleteIcon.addEventListener('click', (event) => { this.onOpenDialogClick(event, item); });
        });

        if (yesBtn) yesBtn.addEventListener('click', (event) => { this.onDeleteClick(event); });
        if (noBtn) noBtn.addEventListener('click', (event) => { this.onCancelSidebarDialogClick(event); });
    }

    onDocumentChange(event) {
        // TODO:  Alterar metódo de armazenagem e edição dos dados para a armazenagem local
        //        dos dados na propriedade 'document' que é enviada ao banco quando os dados forem
        //        confirmados pelo usuário no momento do salvamento.
    }

    /**
     * Gerencia cliques no switch de Deleção de Dados.
     * @param {MouseEvent} event - O evento de clique.
     * @protected
     */
    onDeleteSwitchChange(event) {
        event.stopPropagation();
        this.canDelete = event.target.checked;
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
        if (this.currentState <= this.states.newEntry) {
            if (isSelected) this.controlStates(this.states.newEntry);
            else this.controlStates(this.states.default);
        }
    }

    /**
    * Gera um novo capítulo.
    * @param {Event} event - Evento de clique no botão.
    */
    async onNewChapterClick(event) {
        event.stopPropagation();

        const chapter = await ChapterDialog.configDialog();
        if (chapter) {
            await uniforge.db.addChapter(chapter);
            this.refresh();
        }
    }

    /**@override*/
    onFolderClick(event) {
        super.onFolderClick(event);

        const clickedFolder = event.target.closest('.folder');
        const chapterId = clickedFolder.dataset.id;
        const chapter = uniforge.doc.chapters.get(chapterId);
        const isSelected = clickedFolder.classList.contains('selected');

        this._handleLineageIcon(chapter);

        // Se formulário for o da Enciclopédia, e o estado do formulário seja o 'newEntry' ou 
        // o 'default', carregue ícone do Assunto.
        if (this.currentState <= this.states.newEntry) {
            // Carregue ícone apenas se a pasta estiver sendo selecionada.            
            if (isSelected) {
                this._loadTomeIcon(clickedFolder);
                this.controlStates(this.states.newEntry);
            } else
                this.controlStates(this.states.default);
        }
    }

    /**
  * Trata o evento de criação de um novo item qualquer.
  * @param {Event} event - Evento de clique no botão de Nova Entrada.
  */
    async onNewClick(event) {
        event.stopPropagation();
        // Ignora o clique se o botão estiver desativado.
        //const button = event.target.closest('#newEntryButton');
        //if (button.classList.contains('disabled')) return;

        // Obtém a lista de Categorias
        const selectedFolder = this.selection.folder;
        if (!selectedFolder) {
            this.msgBox.showWarning('Nenhuma pasta foi selecionada.');
            return;
        }

        const headerInfo = this.querySelector('.header-info');
        const id = selectedFolder.dataset.id ?? null;

        // Define o ID da pasta no dataset do header.
        headerInfo.dataset.cid = id;

        const titleInput = this.querySelector('#titleInput');
        titleInput.focus();

        // Configuração do label no botão de Salvar.
        const saveButton = this.querySelector('#saveButton');
        saveButton.innerHTML = '<i class="fa-regular fa-floppy-disk"></i> Salvar';

        // Gera um novo object que representa a nova Entrada.   
        this.document = new this.documentClass();

        // Atualiza o estado do formulário.
        this.controlStates(this.states.adding);
    }

    /**
      * Trata o evento de registro de uma nova entrada.
      * @param {Event} event - Evento de clique no botão de Salvar.
      */
    async onSaveClick(event) {
        event.stopPropagation();

        const item = this.selection.item;
        this.isUpdate = (item ? true : false);

        try {
            const title = (this.isUpdate ? 'Atualizar' : 'Registrar');
            let dialogMessage = `Deseja ${title.toLowerCase()} a seção?`;

            if (await Dialogs.confirm(title, dialogMessage)) {
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

                // Inicia a transação de salvamento.
                await uniforge.db.beginTransaction();

                const headerInfo = this.querySelector('.header-info');

                uniforge.utils.mergeObjects(data, {
                    sid: this.id ?? null,
                    cid: headerInfo.dataset.cid ?? null,
                    htmlString: this.mainEditor.getContent() ?? ''
                });

                const validation = uniforge.db.validateSection(data);

                if (validation !== '') {
                    this.msgBox.showWarning(validation);
                    return;
                }

                // Verifica se o item já existe no banco de dados.
                if (this.isUpdate) { 
                    await uniforge.db.updateSection(data);

                    this.msgBox.showInfo('Seção atualizada com sucesso.');
                }
                else {
                    await uniforge.db.addSection(data);

                    this.msgBox.showInfo('Seção criada com sucesso.');
                }

                // Finaliza a transação de salvamento.
                await uniforge.db.commitTransaction();
                await this.refresh();
            }
        } catch (error) {
            this.msgBox.showError(error.message, error);

            // Faz rollback em caso de erro no processo de salvamento.
            await uniforge.db.rollbackTransaction(error);
        }
    }

    /**
     * Remove uma entrada de uma categoria da lista.
     * @param {Event} event - Evento de clique no botão para excluir a entrada.
     */
    async onDeleteClick(event) {
        event.stopPropagation();
        const id = this.ui.dialog.dataset.id;

        await uniforge.db.deleteEntry(id);
        this.msgBox.showInfo('Seção removida com sucesso.');
        await this.refresh();
    }

    /**
     * Gerencia cliques duplos em itens de entrada.
     * @protected
     * @param {MouseEvent} event - O evento de clique duplo.
     */
    async onEntryItemDoubleClick(event, options = {}) {
        await super.onEntryItemDoubleClick(event);

        // Se o formulário for o de Configurações, ignore.
        if (this.isSettings) return;

        this.document = null;

        const item = event.target.closest('.entry-item');
        const itemId = item.dataset.id;
        const itemType = options.dataSource ?? this.dataSource;
        const section = uniforge.doc[itemType].get(itemId);

        if (section) {
            const headerInfo = this.querySelector('.header-info');
            headerInfo.dataset.cid = section.cid ?? null;
            headerInfo.dataset.sid = section.eid;

            const titleInput = this.querySelector('#titleInput');

            const draftSwitch = this.querySelector('#isDraftSwitch');
            const draftCheckbox = draftSwitch.querySelector('#checkbox');

            titleInput.value = section.title;
            draftCheckbox.checked = section.isDraft;
            const sectionData = section.data;

            this.mainEditor = sectionData.htmlString;

            // Armazena os dados da entrada atual.
            this.document = section;

            const clickedFolder = event.target.closest('.folder');
            const isSelected = clickedFolder.classList.contains('selected');

            if (isSelected) {
                this._loadTomeIcon(clickedFolder);
            }

            // Obtém o identificador do item selecionado.
            this.sid = this.document.sid;

            // Atualiza o estado dos elements do formulário.
            this.controlStates(this.states.editing);
        } else {
            this.msgBox.showWarning('Erro ao carregar a seção.');
        }
    }

    /**
   * Rotina para tratamento do tooltip de confirmação de remoção.
   * @param {Event} event - Evento de clique no ícone de exclusão.
   * @param {HTMLElement} item - O item da pasta a ser excluído.
   */
    onOpenDialogClick(event, item) {
        event.stopPropagation();

        const dataType = (this.isSettings ? 'do Capítulo' : 'da Seção');

        this.ui.dialog.dataset.id = item.dataset.id;
        this.ui.dialog.dataset.action = 'del';

        const message = `Tem certeza que deseja excluir o item ${dataType}?`;
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

    /**@override */
    onSidebarClick(event) {
        super.onSidebarClick(event);
        this._clearRootIcon();
    }

    /**
    * Cria um ImagePicker e trata a ação do usuário de envio de uma imagem para o texto.
    * @private
    * @param {Object} editor - Instância do editor TinyMCE.
    */
    async onUploadImage(editor) {
        // Abre o diálogo de seleção de imagem.
        const imageData = await FilePickerDialog.configDialog(null, { canUpload: true, hasCaption: true, type: 'image' });

        // Se uma imagem foi selecionada, insira-a no editor.
        if (imageData) {
            try {
                // Obtem o caminho completo da imagem.
                const fullPath = await uniforge.path.join(imageData.path);

                // Lê o arquivo de imagem como um buffer.
                const buffer = await uniforge.fs.readFile(fullPath);
                // Converte o buffer em um Blob com a extensão correta.
                const data = await uniforge.utils.bufferToBlob(buffer, imageData.ext);

                // Cria um objeto de imagem com os dados necessários.
                const image = {
                    uuid: imageData.uuid,
                    caption: imageData.caption,
                    data: data
                }

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
                const imageURL = await uniforge.utils.blobToImage(data.raw, data.ext);
                newImage.src = imageURL;

                imgWrapper.appendChild(newImage);

                if (image.caption) {
                    const newCaption = document.createElement('figcaption');
                    newCaption.className = 'img-caption';
                    newCaption.textContent = `Imagem ${imgCount + 1} - ${image.caption}`;
                    newCaption.contenteditable = 'true';

                    imgWrapper.appendChild(newCaption);
                }

                // Insira o HTML na posição atual do cursor.
                editor.execCommand('mceInsertContent', false, imgWrapper.outerHTML);
                // Registra o Blob da imagem no banco de dados.
                await uniforge.db.addTextImages(image);
                // Atualiza a contagem de imagens no editor.
                this._updateImageCount(editor);
            } catch (error) {
                this.msgBox.showError('Erro ao carregar a imagem.', error);
            }
        }
    }

    /**
    * Trata a ação do usuário de adição de 5 (Padrão) parágrafos de Lorem Ipsum na posição do cursor do editor.
    * @private
    * @param {Object} editor - Instância do editor TinyMCE.
    */
    onAddLoremIpsum(editor) {
        const loremIpsum = uniforge.utils.loremIpsum(5);
        editor.execCommand('mceInsertContent', false, loremIpsum);
    }

    /* ---------------------------------------------------------------------------------------------------------------- */
    // FUNÇÕES INTERNAS

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

        // Adiciona um botão para enviar ao corpo do editor.
        editor.ui.registry.addButton('sendImage', {
            tooltip: 'Enviar Imagem',
            icon: 'image',
            onAction: () => { this.onUploadImage(editor); }
        });

        // Adiciona um botão para adicionar Lorem Ipsum ao corpo do editor.
        editor.ui.registry.addButton('addLoremIpsum', {
            tooltip: 'Adicionar Lorem Ipsum',
            icon: 'format-code',
            onAction: () => { this.onAddLoremIpsum(editor); }
        });
    }

    /**
     * Verifica se a seção possui linhagem e exibe ou oculta o ícone correspondente.
     * @protected
     * @param {Section} section 
     */
    _handleLineageIcon(section) {
        const lineageIcon = this.querySelector('#lineageIcon');
        if (section.isLineage) lineageIcon.classList.remove('hidden');
        else lineageIcon.classList.add('hidden');
    }

    /**
     * Carrega ícone da raíz do assunto.
     * @protected
     * @async
     * @param {HTMLElement} folder - Objeto com os dados da pasta do Assunto.
     */
    async _loadTomeIcon(folder) {
        const cid = folder.dataset.id;
        let chapter = await uniforge.db.getChapterTome(cid);

        if (chapter) {
            const typeLabel = this.querySelector('#typeLabel');
            const dataIcon = this.querySelector('#dataIcon');
            const chapterIcon = this.querySelector('#chapterIcon');

            typeLabel.textContent = chapter.title;

            dataIcon.dataset.tooltip = chapter.tome.capitalize();
            chapterIcon.classList.remove(...chapterIcon.classList);
            chapterIcon.className = chapter.icon;
        }
    }

    /**
     * Carrega ícone da raíz do assunto.
     * @protected
     * @async
     */
    async _clearRootIcon() {
        const typeLabel = this.querySelector('#typeLabel');
        const dataIcon = this.querySelector('#dataIcon');
        const chapterIcon = this.querySelector('#chapterIcon');

        typeLabel.innerHTML = '&#8212';

        dataIcon.dataset.tooltip = 'Escolha um assunto...';
        chapterIcon.classList.remove(...chapterIcon.classList);
        chapterIcon.className = 'fa-regular fa-file';
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