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
        this.request = options.current ?? 'data/';

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
    }

    /**
    * Os tipos de arquivos aceitos pelo diálogo.
    * @type {string[]}
    */
    static FILE_TYPES = ["any", "folder", "font", "image", "text"];

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
        await this.browse(this.target);
    }

    async browse(target) {
        this.source.target = target;

        const targetDir = this.querySelector("#targetDir");
        targetDir.value = this.target;

        const foldersList = this.querySelector('.directory ul.folders-list');
        foldersList.innerHTML = "";

        const filesList = this.querySelector('.directory ul.files-list');
        filesList.innerHTML = "";

        const dirContent = await uniforge.fs.readDir(this.target);

        // Gera as pastas do diretório alvo, se houver.
        dirContent.folders.forEach((folder) => {
            this.#appendFolderItem(folder);
        });

        // Gera os arquivos do diretório alvo, se houver.
        dirContent.files.forEach((file) => {
            this.#appendFileItem(file);
        });

        this.#loaded = true;
    }

    activateListeners() {
        super.activateListeners();

        const goBackButton = this.querySelector('#goBackButton');
        goBackButton.addEventListener('click', (event) => { this._onGoBackButtonClick(event); });
    }

    _onGoBackButtonClick(event) {
        event.stopPropagation();
        const lastIndex = this.target.lastIndexOf('\\') + 1;
        const path = this.target.substring(0, lastIndex);
        this.browse(path);
    }

    _onFolderClick(event) {
        event.stopPropagation();
        const clickedFolder = event.target.closest('.dir');

        this.browse(clickedFolder.dataset.path);
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
        options = uniforge.utils.mergeObjects(options, { current: path, alwaysClose: true });
        return new Promise((resolve, reject) => {
            const dialog = new this({
                title: 'Explorador de Arquivos',
                buttons: {
                    select: {
                        label: "Selecionar Arquivo",
                        icon: "fas fa-check",
                        callback: () => {
                            /*
                            const chosenFilePath = document.querySelector('#chosenFilePath');
                            const captionInput = document.querySelector('#captionInput');

                            const data = uniforge.utils.getAsociatedData(chosenFilePath);
                            data.caption = captionInput.value;
                            */
                            console.log('Arquivo selecionado!');
                            resolve(true);
                        }
                    }
                },
                abort: () => resolve(null)
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
                default: return Object.keys(this.VALID_FILE_EXTENSIONS);
            }
        })();
        return types.map(t => `.${t}`);
    }

    /* -------------------------------------------- */

    /**
    * Obtém o diretório do arquivo a partir do caminho fornecido.
    * @param {string} target  - O Caminho completo do arquivo.
    * @returns {string}
    */
    #getFileDir(target) {
        const parts = target.split("/");
        if (parts[parts.length - 1].indexOf(".") !== -1) parts.pop();
        const dir = parts.join("/");
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
        const item = document.createElement('li');
        item.className = 'file';
        item.dataset.file = '';
        item.dataset.action = 'pickFile';
        item.dataset.path = file.path;
        item.dataset.name = file.name;
        item.innerHTML = `<i class="fas fa-folder fa-fw" inert=""></i> ${file.name}`;

        const ul = this.querySelector('.directory ul.files-list');
        ul.appendChild(item);
    }

    /* -------------------------------------------- */
}