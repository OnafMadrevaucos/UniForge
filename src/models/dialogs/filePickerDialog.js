import BaseDialog from "./baseDialog.js";

export default class FilePickerDialog extends BaseDialog {
    constructor(dialogData = {}, options = {}) {
        super(dialogData, uniforge.utils.mergeObjects(options, {
            height: '750px',
            width: '500px'
        }));

        this.template = 'filePickerDialog'; // Define o template do diálogo.

        /**
        * O caminho completo fornecido pelo usuário.
        * @type {string}
        */
        this.request = options.current ?? 'data';

        /**
        * Uma função de callback a ser executada quando um arquivo for selecionado.
        * @type {Function|null}
        */
        this.callback = options.callback ?? null;

        /**
        * O tipo de arquivo que controla o conjunto de extensões aceitas.
        * @type {string}
        */
        this.type = options.type ?? "any";

        /**
        * O elemento HTML associado ao diálogo.
        * @type {HTMLElement|null}
        */
        this.field = options.field ?? null;

        /**
        * Uma flag que indica se o diálogo deve exibir apenas pastas.
        * @type {boolean}
        */
        this.onlyFolders = options.onlyFolders ?? false;

        /**
        * Uma flag que indica se o diálogo deve exibir o campo de legenda de texto.
        * @type {boolean}
        */
        this.hasCaption = options.hasCaption ?? false;

        /**
        * Uma flag que indica se o diálogo deve permitir o envio de arquivos.
        * @type {boolean}
        */
        this.canUpload = options.canUpload ?? false;

        /**
        * Uma expressão regular usada para filtrar os arquivos exibidos.
        * @type {string}
        */
        this.filter = '';

        /**
        * O modo de exibição do diálogo.
        * @type {string}
        */
        this.displayMode = options.displayMode ?? this.constructor.LAST_DISPLAY_MODE;

        /**
        * A configuração do source do diálogo.
        * @type {Record<"data", {target: string;}|undefined>}>
        */
        this.source = {
            target: this.#getFileDir(this.request)
        };

        /**
        * O caminho do arquivo selecionado.
        * @type {string}
        */
        this.selectedData = {
            absolutePath: null,
            folder: null,
            path: null,
            name: null,
            ext: null,
            src: null
        };
    }

    /**
    * Os tipos de arquivos aceitos pelo diálogo.
    * @type {string[]}
    */
    static FILE_TYPES = ["any", "folder", "font", "image", "text", "pdf"];

    /**
     * Registro da última pasta explorada pelo diálogo.
     * @type {string}
     */
    static LAST_BROWSED_DIRECTORY = "";

    /**
     * Registro da última largura de tile usada pelo diálogo.
     * @type {number|null}
     */
    static LAST_TILE_SIZE = null;

    /**
     * Registro do ultimo modo de exibição do diálogo.
     * @type {string}
     */
    static LAST_DISPLAY_MODE = "list";

    /**
     * Enumeração dos modos de exibição do diálogo.
     * @type {string[]}
     */
    static DISPLAY_MODES = ["list", "thumbs", "tiles", "images"];

    /**
    * Enumeração das extensões de fonte aceitas pelo diálogo.
    * @type {Object<string, string>}
    */
    static FONT_FILE_EXTENSIONS = {
        "otf": "font/otf",
        "ttf": "font/ttf",
        "woff": "font/woff",
        "woff2": "font/woff2"
    }

    /**
    * Enumeração das extensões de imagem aceitas pelo diálogo.
    * @type {Object<string, string>}
    */
    static IMAGE_FILE_EXTENSIONS = {
        "jpg": "image/jpeg",
        "jpeg": "image/jpeg",
        "png": "image/png",
        "gif": "image/gif",
        "svg": "image/svg+xml",
        "webp": "image/webp"
    }

    /**
    * Enumeração das extensões de texto aceitas pelo diálogo.
    * @type {Object<string, string>}
    */
    static TEXT_FILE_EXTENSIONS = {
        "csv": "text/csv",
        "txt": "text/plain",
        "json": "application/json",
        "pdf": "application/pdf"
    }

    /**
    * Enumeração das extensões de arquivo aceitas pelo diálogo.
    * @type {Object<string, string>}
    */
    static VALID_FILE_EXTENSIONS = {
        "otf": "font/otf",
        "ttf": "font/ttf",
        "woff": "font/woff",
        "woff2": "font/woff2",
        "jpg": "image/jpeg",
        "jpeg": "image/jpeg",
        "png": "image/png",
        "gif": "image/gif",
        "svg": "image/svg+xml",
        "webp": "image/webp",
        "csv": "text/csv",
        "txt": "text/plain",
        "json": "application/json",
        "pdf": "application/pdf"
    }

    /**
    * Monitora se há um arquivo carregado.
    * @type {boolean}
    */
    #loaded = false;

    /**
   * The current set of file extensions which are being filtered upon
   * @type {string[]}
   */
    extensions = FilePickerDialog.#getExtensions(this.options.type ?? "any");

    /**
    * Retorna o diretório alvo da fonte de dados atual.
    * @type {string}
    */
    get target() {
        return this.source.target;
    }

    /**
    * Prepara os dados do diálogo e configura o diálogo com os dados preparados.
    * @inheritdoc
    */
    async configureElements() {
        const uploadFileDiv = this.querySelector(".upload-file");
        const uploadFileInput = this.querySelector(".upload-file .uploader");

        const imageCaptionDiv = this.querySelector(".image-caption");

        const fileExtensionDiv = this.querySelector(".file-extension");
        const fileExtensionSelect = this.querySelector("#fileExtension");

        // O diálogo tem opção de informar uma legenda para o arquivo selecionado.
        if (this.hasCaption) imageCaptionDiv.classList.remove("hidden");
        else imageCaptionDiv.classList.add("hidden");

        // O diálogo tem opção de exibir apenas pastas.
        if (this.onlyFolders) {
            const selectedFileSpan = this.querySelector(".selected-file span");

            // Esconde opção de enviar arquivos.
            uploadFileDiv.classList.add("hidden");

            // Exibe opção de selecionar extensão do arquivo.
            fileExtensionDiv.classList.add("hidden");

            fileExtensionSelect.innerHTML = "";
            fileExtensionSelect.value = null;

            selectedFileSpan.textContent = "Nome do Arquivo";
        } else {
            if (this.canUpload) uploadFileDiv.classList.remove("hidden");
            else uploadFileDiv.classList.add("hidden");

            fileExtensionDiv.classList.remove("hidden");

            this.extensions.forEach((ext) => {
                const option = document.createElement("option");
                option.value = ext;
                option.textContent = ext.replace(".", "").toUpperCase();
                fileExtensionSelect.appendChild(option);
            });

            // Se o tipo do diálogo for PDF, desabilita a opção de extensão de arquivo (que é única).
            fileExtensionSelect.disabled = (this.type === 'pdf');

            this.selectedData.ext = fileExtensionSelect.value;
        }

        if (this.canUpload) {
            uploadFileInput.classList.remove("disabled");
        } else {
            uploadFileInput.classList.add("disabled");
        }

        const filePickerInput = this.querySelector('#filePickerInput');
        filePickerInput.readOnly = !this.onlyFolders;

        await this.browse(this.target);
    }

    async browse(target = this.target) {
        this.#loaded = false;

        // Atualiza o caminho do diretório alvo.
        this.source.target = target;

        const targetDir = this.querySelector("#targetDir");
        targetDir.value = this.target + '\\';

        const foldersList = this.querySelector('.directory ul.folders-list');
        foldersList.innerHTML = "";

        const filesList = this.querySelector('.directory ul.files-list');
        filesList.innerHTML = "";

        // Define o modo de exibição dos arquivos no diálogo.
        filesList.classList.remove(this.constructor.LAST_DISPLAY_MODE);
        filesList.classList.add(this.displayMode);

        // Busca o conteúdo do diretório alvo.
        const dirContent = await uniforge.fs.readDir(this.target);

        // Aplica os filtros aos arquivos e pastas.
        dirContent.folders = dirContent.folders.filter((folder) => { return this.#applyFilterInFolders(folder); });

        // Gera as pastas do diretório alvo, se houver.
        dirContent.folders.forEach((folder) => {
            this.#appendFolderItem(folder);
        });

        // É para exbir arquivos além de pastas.
        if (!this.onlyFolders) {
            dirContent.files = dirContent.files.filter((file) => {
                // Arquivos que não tenham a extensão aceita pelo diálogo, serão ignorados.
                const ext = `.${file.name.split(".").pop()}`;
                if (!this.extensions.includes(ext))
                    return false;

                return this.#applyFilter(file);
            });

            // Gera os arquivos do diretório alvo, se houver.
            dirContent.files.forEach((file) => {
                this.#appendFileItem(file);
            });
        } else {
            const filePickerInput = this.querySelector('#filePickerInput');

            if (this.selectedData.path) {
                const absolutePath = await uniforge.path.join(this.selectedData.path);
                this.selectedData.absolutePath = absolutePath;
                this.selectedData.type = 'folder';

                filePickerInput.dataset.absolutePath = absolutePath;
                filePickerInput.dataset.type = 'folder';
            }

            filePickerInput.value = this.target + '\\';
        }

        // Avisa que o conteúdo foi carregado.
        this.#loaded = true;
    }

    activateListeners() {
        const goBackButton = this.querySelector('#goBackButton');
        goBackButton.addEventListener('click', (event) => { this._onGoBackButtonClick(event); });

        const filterDir = this.querySelector('#filterDir');
        filterDir.addEventListener('input', (event) => { this._onFilterDirInput(event); });

        const modesList = this.querySelectorAll('.modes-list button');
        modesList.forEach(button => button.addEventListener('click', (event) => { this._onModeButtonClick(event); }));

        if (this.onlyFolders) {
            const fileExtension = this.querySelector('#fileExtension');
            fileExtension.addEventListener('change', (event) => { this._onFileExtensionChange(event); });

            const filePickerInput = this.querySelector('#filePickerInput');
            filePickerInput.addEventListener('input', (event) => { this._onFilePickerInput(event); });
            filePickerInput.addEventListener('focus', (event) => { this._onFilePickerInputFocus(event); });
            filePickerInput.addEventListener('blur', (event) => { this._onFilePickerInputBlur(event); });
        }

        if (this.canUpload) {
            const uploadFileButton = this.querySelector(".upload-file .uploader button");
            uploadFileButton.addEventListener('click', (event) => { this._onUploadFileInputClick(event); });

            const removeFile = this.querySelector("#removeFile");
            removeFile.addEventListener('click', (event) => { this._onRemoveFileButtonClick(event); });
        }
    }

    _onGoBackButtonClick(event) {
        event.stopPropagation();
        const folders = this.target.trim().split('\\').filter((value) => value !== '');
        folders.pop();

        // Se o array estiver vazio, a pasta raiz foi atingida.
        if (folders.length === 0) return;

        const path = folders.join('\\');
        this.browse(path);
    }

    _onFilterDirInput(event) {
        event.stopPropagation();
        this.filter = event.target?.value ?? '';

        this.browse();
    }

    _onModeButtonClick(event) {
        event.stopPropagation();
        const buttonActivated = event.target.closest('button');
        const mode = buttonActivated.dataset.mode;

        const modesList = this.querySelectorAll('.modes-list button');
        modesList.forEach(button => button.classList.remove('active'));
        buttonActivated.classList.add('active');

        this.constructor.LAST_DISPLAY_MODE = this.displayMode;
        this.displayMode = mode;

        this.browse();
    }

    async _onUploadFileInputClick(event) {
        event.preventDefault();

        // O caminho completo do arquivo selecionado.
        const filePath = await uniforge.app.fileDialog(this.type);
        // Os dados binários do arquivo selecionado.
        const binaryData = await uniforge.fs.readFile(filePath);

        // O arquivo não existe ou não foi selecionado.
        if (!binaryData) return;

        // Obtém a extensão do arquivo selecionado.
        const ext = filePath.split('.').pop();
        // Obtém o nome do arquivo selecionado.
        const name = filePath.split('\\').pop();

        // O caminho local do arquivo após o upload.
        const localPath = this.target + '\\' + name;

        // Atualiza o indicador do nome do arquivo selecionado para upload.
        const uploadFileLabel = this.querySelector(".upload-file .uploader label");
        uploadFileLabel.textContent = name;

        // Habilita o botão de remoção do arquivo selecionado para upload.
        const removeFile = this.querySelector("#removeFile");
        removeFile.classList.remove("hidden");

        // Atualiza o caminho local do arquivo selecionado para upload.
        const filePickerInput = this.querySelector('#filePickerInput');
        filePickerInput.value = localPath;

        // Armazena o caminho externo do arquivo selecionado para upload.
        filePickerInput.dataset.src = filePath;

        // Limpa os arquivos selecionados que já foram enviados para o diretório de dados.
        const filesList = this.querySelector('.directory ul.files-list');
        filesList.querySelectorAll('li.file').forEach((file) => file.classList.remove('selected'));

        this.selectedData = {
            absolutePath: filePath,
            folder: this.target,
            path: localPath,
            name: name,
            ext: `.${ext}`,
            src: filePath
        }

        filePickerInput.dataset.name = name;
        filePickerInput.dataset.type = FilePickerDialog.VALID_FILE_EXTENSIONS[ext];
    }

    _onRemoveFileButtonClick(event) {
        event.preventDefault();
        const button = event.target.closest('a');

        // Limpa o label do nome do arquivo selecionado.
        const uploadFileLabel = this.querySelector(".upload-file .uploader label");
        uploadFileLabel.textContent = "Nenhum arquivo escolhido";

        // Limpa o caminho do arquivo selecionado.
        const filePickerInput = this.querySelector('#filePickerInput');
        filePickerInput.value = '';
        delete filePickerInput.dataset.name;

        // Esconde o botão de remover arquivo.
        button.classList.add('hidden');

        // Limpa os dados selecionados.
        this.selectedData = {
            absolutePath: null,
            folder: null,
            path: null,
            name: null,
            ext: null,
            src: null
        };
    }

    _onFileExtensionChange(event) {
        event.stopPropagation();
        const select = event.target.closest('select');
        this.selectedData.ext = select.value;

        let path = this.selectedData?.path ?? 'data' + '\\';

        if (!path.endsWith('\\')) path += '\\';

        const filePickerInput = this.querySelector('#filePickerInput');

        if (!uniforge.utils.isEmpty(this.selectedData.name))
            filePickerInput.value = `${path}${this.selectedData.name}${this.selectedData.ext}`;
        else
            filePickerInput.value = path;
    }

    _onFilePickerInput(event) {
        event.stopPropagation();
        const input = event.target.closest('input');
        this.selectedData.name = input.value;
    }

    _onFilePickerInputFocus(event) {
        event.stopPropagation();
        const input = event.target.closest('input');
        input.value = this.selectedData?.name ?? '';
    }

    _onFilePickerInputBlur(event) {
        event.stopPropagation();
        const input = event.target.closest('input');
        let path = this.selectedData?.path ?? 'data' + '\\';

        if (!path.endsWith('\\')) path += '\\';

        // Atualiza o nome do arquivo.
        this.selectedData.name = input.value;

        // Foi informado o nome do arquivo.
        if (!uniforge.utils.isEmpty(this.selectedData.name)) {
            const name = `${this.selectedData.name}${this.selectedData.ext}`;
            input.value = `${path}${name}`;
            input.dataset.name = name;
        }
        // Não foi informado o nome do arquivo.
        else {
            input.value = path;
            input.dataset.name = '';
        }
    }

    async _onFolderClick(event) {
        event.stopPropagation();
        const clickedFolder = event.target.closest('.dir');
        const filePickerInput = this.querySelector('#filePickerInput');

        if (this.onlyFolders) {
            this.constructor.LAST_BROWSED_DIRECTORY = this.selectedData.path;
            this.selectedData.path = clickedFolder.dataset.path;
        }

        if (!this.selectedData.name) {
            filePickerInput.value = this.selectedData.path + '\\';
        } else {
            filePickerInput.value = `${this.selectedData.path}\\${this.selectedData.name}${this.selectedData.ext}`;
        }

        this.browse(clickedFolder.dataset.path);
    }

    async _onFileClick(event) {
        event.stopPropagation();
        const clickedFile = event.target.closest('.file');
        const filePickerInput = this.querySelector('#filePickerInput');

        // Se o arquivo estiver selecionado, deseleciona-o.
        if (clickedFile.classList.contains('selected')) {
            clickedFile.classList.remove('selected');

            filePickerInput.value = '';

            this.selectedData = {
                absolutePath: null,
                folder: null,
                path: null,
                name: null,
                ext: null,
                src: null
            };

            return;
        }

        const filesList = this.querySelector('.directory ul.files-list');
        filesList.querySelectorAll('li.file').forEach((file) => file.classList.remove('selected'));

        clickedFile.classList.toggle('selected');

        const path = clickedFile.dataset.path;
        const folder = clickedFile.dataset.folder;
        const name = clickedFile.dataset.name;
        const ext = clickedFile.dataset.ext;

        const absolutePath = await uniforge.path.join(clickedFile.dataset.path);

        this.selectedData = {
            absolutePath: absolutePath,
            folder: folder,
            path: path,
            name: name,
            ext: ext,
            src: null
        };

        filePickerInput.value = this.selectedData.path;
        filePickerInput.dataset.name = this.selectedData.name;
        filePickerInput.dataset.ext = this.selectedData.ext;
        filePickerInput.dataset.type = FilePickerDialog.VALID_FILE_EXTENSIONS[this.selectedData.ext];
        filePickerInput.dataset.absolutePath = this.selectedData.absolutePath;
        filePickerInput.dataset.folder = this.selectedData.folder;
    }

    /**
     * Abre o diálogo de seleção de arquivo.
     * 
     * @param {Object} options                  - Opções adicionais do diálogo.
     * @param {boolean} options.alwaysClose     - Se o diálogo deve se fechar automaticamente após uma ação.
     * 
     * @returns {Promise<boolean>}              - Uma promessa que resolve com true se o usuário selecionou um arquivo e false caso contrário.
     */
    static async configDialog(path, options = {}) {
        options = uniforge.utils.mergeObjects(options, { current: path });
        return new Promise((resolve, reject) => {
            const dialog = new this({
                title: 'Explorador de Arquivos',
                buttons: {
                    select: {
                        label: (options.onlyFolders ? "Selecionar Pasta" : "Selecionar Arquivo"),
                        icon: "fas fa-check",
                        callback: async () => {
                            const filePickerInput = document.querySelector('#filePickerInput');
                            const captionInput = document.querySelector('#captionInput');

                            const type = filePickerInput.dataset.type;
                            const absolutePath = filePickerInput.dataset.absolutePath;
                            const folder = filePickerInput.dataset.folder;

                            let name = null;
                            let ext = null;
                            let src = null;

                            if (type !== 'folder') {
                                name = filePickerInput.dataset.name;
                                ext = name.split('.').pop();
                                src = filePickerInput.dataset.src;                                

                                // Nenhum arquivo selecionado ou nome do arquivo vazio. Impeça o fechamento do diálogo.
                                if (uniforge.utils.isEmpty(name)) {
                                    uniforge.ctrls.msgBox.showWarning('Nenhum arquivo selecionado ou nome do arquivo vazio.');
                                    return false;
                                }

                                if (src) {
                                    const dest = await uniforge.path.resolve(filePickerInput.value);
                                    const result = await uniforge.fs.copyFile(src, dest);

                                    if (!result) {
                                        uniforge.ctrls.msgBox.showWarning('Não foi possível copiar o arquivo selecionado.');
                                        return false;
                                    }
                                }
                            }

                            const data = {
                                uuid: uniforge.db.generateID(),
                                absolutePath: absolutePath,
                                folder: folder,
                                path: filePickerInput.value,
                                name: name,
                                ext: ext,
                                caption: captionInput.value ?? null,
                                type: type
                            };

                            resolve(data);
                            return true;
                        }
                    }
                },
                abort: () => reject(null)
            }, options);
            dialog.show(true);
        });
    }

    /* -------------------------------------------- */

    /**
     * Valida se a extensão do arquivo enviado para upload é permitida.
     * @param {string} name       - O arquivo a ser validado.
    */
    #validateExtension(name) {
        const ext = `.${name.split(".").pop()}`;
        if (!this.extensions.includes(ext)) {
            const msg = `Extensão de arquivo inválida: ${name}. As extensões permitidas são: ${this.extensions.join(" ")}`;
            throw new Error(msg);
        }
    }

    /* -------------------------------------------- */

    /**
    * Get the valid file extensions for a given named file picker type
    * @param {string} type
    * @returns {string[]}
    */
    static #getExtensions(type) {
        const types = (() => {
            switch (type) {
                case "folder": return [];
                case "font": return Object.keys(this.FONT_FILE_EXTENSIONS);
                case "image": return Object.keys(this.IMAGE_FILE_EXTENSIONS);
                case "text": return Object.keys(this.TEXT_FILE_EXTENSIONS);
                case "pdf": return ["pdf"];
                default: return Object.keys(this.VALID_FILE_EXTENSIONS);
            }
        })();
        return types.map(t => `.${t}`);
    }

    /* -------------------------------------------- */

    /**
    * Testa se o diretório é contemplado pela string de filtragem.
    * 
    * @param {string} folder    - O diretório a ser validado.
    * @returns {boolean}        - 'true' se o diretório for contemplado pela string de filtragem.
    */
    #applyFilterInFolders(folder) {
        // Expressões especiais se aplicam apenas a arquivos.
        if (this.filter?.startsWith("*")) return true;

        // Se o diretório for contemplado pela string de filtragem, retorna 'true'.
        return this.#applyFilter(folder);
    }

    /* -------------------------------------------- */

    /**
    * Testa se o arquivo é contemplado pela string de filtragem.
    * 
    * @param {string} file  - O arquivo a ser validado.
    * @returns {boolean}    - 'true' se o arquivo for contemplado pela string de filtragem.
    */
    #applyFilter(file) {
        // Se nenhuma string de filtragem foi fornecida, retorna 'true'.
        if (!this.filter) return true;

        // Limpa o filtro das expressões especiais.
        const filter = this.filter.replace('*', '').toLowerCase();

        // Se o arquivo for contemplado pela string de filtragem, retorna 'true'.
        return file.name.toLowerCase().includes(filter);
    }

    /* -------------------------------------------- */

    /**
    * Obtém o diretório do arquivo a partir do caminho fornecido.
    * @param {string} target  - O Caminho completo do arquivo.
    * @returns {string}
    */
    #getFileDir(target) {
        const parts = target.split('\\');
        if (parts[parts.length - 1].indexOf(".") !== -1) parts.pop();
        const dir = parts.join('\\');
        return dir;
    }

    /* -------------------------------------------- */

    /**
    * Obtém o diretório do arquivo a partir do caminho fornecido.
    * @param {object} folder  - O Caminho completo do arquivo.
    * @returns {string}
    */
    #appendFolderItem(folder) {
        const item = document.createElement('li');
        item.className = 'dir';
        item.dataset.directory = '';
        item.dataset.action = 'pickDirectory';
        item.dataset.path = folder.path;
        item.dataset.name = folder.name;
        item.innerHTML = `<i class="fas fa-folder fa-fw" inert=""></i> ${folder.name}`;

        const ul = this.querySelector('.directory ul.folders-list');
        ul.appendChild(item);

        item.addEventListener('click', (event) => {
            this._onFolderClick(event);
        });
    }

    /* -------------------------------------------- */

    /**
    * Obtém o diretório do arquivo a partir do caminho fornecido.
    * @param {object} file  - O Caminho completo do arquivo.
    * @returns {string}
    */
    #appendFileItem(file) {
        const ext = `${file.name.split(".").pop()}`;

        const item = document.createElement('li');
        item.className = 'file flexrow';
        item.dataset.file = '';
        item.dataset.action = 'pickFile';
        item.dataset.folder = this.#getFileDir(file.path);
        item.dataset.path = file.path;
        item.dataset.name = file.name;
        item.dataset.ext = ext;

        if (this.displayMode !== 'list') {
            item.innerHTML = `<img src="${file.path}"> ${file.name}`;
        } else {
            item.innerHTML = `<i class="fas fa-file"></i> ${file.name}`;
        }

        // O arquivo é o selecionado? Se sim, marque-o.
        if (file.path === this.selectedData.path) item.classList.add('selected');

        const ul = this.querySelector('.directory ul.files-list');
        ul.appendChild(item);

        item.addEventListener('click', (event) => {
            this._onFileClick(event);
        });
    }

    /* -------------------------------------------- */
}