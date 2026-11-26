import { options } from "../../common/utils/tinymce.mjs";
import BaseDialog from "./baseDialog.js";
import Dialogs from "./dialog.js";
import NewWorldDialog from "./newWorldDialog.js";

export default class WorldSelecionDialog extends BaseDialog {
    constructor(dialogData = {}, options = {}) {
        super(dialogData, uniforge.utils.mergeObjects(options, {
            height: '500px',
            width: '800px'
        }));

        this.sourceId = options?.id ?? null;

        this.sourceType = options?.type ?? null;

        this.template = 'worldSelectionDialog'; // Define o template do diálog.
    }

    /**
     * @inheritdoc
     * @async
     */
    async close() {
        // Solicita confirmação caso não exista um Mundo selecionado.
        if (!this.result) {
            const confirmed = await Dialogs.confirm(
                'Sem Mundo Selecionado',
                'O UniForge será encerrado caso não haja nenhum Mundo selecionado. Deseja continuar?',
                { abortValue: true }
            );

            // Cancela o fechamento caso o usuário não confirme.
            if (!confirmed) return;
        }

        // Executa o fechamento padrão da caixa de diálogo.
        super.close();

        // Encerra a aplicação caso não exista um Mundo selecionado.
        if (!this.result) uniforge.app.quit();
    }

    /* ---------------------------------------------------------------------------------------------------------------- */
    // PREPARAÇÃO DE DADOS

    /**
     * Prepara os dados do diálogo e configura o diálogo com os dados preparados.
     * 
     * @async
     * @inheritdoc
    */
    async prepareData() {
        this.data.worlds = uniforge.doc.worlds.toArray();

        this.data.version = await versions.app();

        this.prepareThemes();
    }

    /**
     * Prepara uma lista com cada um dos Temas cadastrados no sistema, semparando-os entre Temas nativos e os customizados.
     * 
     * @async
     */
    async prepareThemes() {
        const extraThemesFiles = await uniforge.fs.readDir(uniforge.urls.relativePath.customCSS);

        const extraThemes = [];

        extraThemesFiles.files.forEach(theme => {
            const themeName = theme.name;
            extraThemes.push({
                _id: `custom/theme-${themeName}`,
                _label: themeName.capitalize().replaceAll('.css', '')
            });
        });

        this.data.themes = {
            nativos: [
                { _id: 'theme-medieval', _label: 'Medieval' },
                { _id: 'theme-scifi', _label: 'Sci-fi' },
                { _id: 'theme-neutral', _label: 'Neutro' },
            ],
            extras: extraThemes
        };
    }

    /* ---------------------------------------------------------------------------------------------------------------- */
    // CONFIGURAÇÃO DE CORPO DO DIALOG

    /**
     * Prepara o corpo do Dialog de acordo com os dados e estado atual do sistema.
     * @inheritdoc
     */
    configureContent() {
        const defaultWID = uniforge.settings.get('app.defaultWorld');
        if (defaultWID) {
            const item = this.querySelector(`#worldList li.item[data-value="${defaultWID}"]`);
            if (item) item.classList.add('selected');
        }
        else {
            const button = this.querySelector('#select.dialog-button');
            button.disabled = true;
        }
    }

    /* ---------------------------------------------------------------------------------------------------------------- */
    // CONTROLE DE EVENTOS

    /**
    * Configura ouvintes de eventos básicos para o dialog.
    * @protected
    */
    activateListeners() {
        const newWorldButton = this.querySelector('#newWorldButton');
        newWorldButton.addEventListener('click', this.onNewWorldClick.bind(this));

        const worldsItems = this.querySelectorAll('#worldList li.item');
        worldsItems.forEach(world => {
            world.addEventListener('click', this.onWorldItemClick.bind(this));

            const buttom = world.querySelector('.delete-button');
            buttom.addEventListener('click', this.onWorldItemDeleteClick.bind(this));
        });
    }


    /**
     * Gerencia a ação de clique no botão de criação de um novo Mundo.
     *
     * @async
     * @param {*} event 
     * @returns {*} 
    */
    async onNewWorldClick(event) {
        event.stopPropagation();
        const newWorld = await NewWorldDialog.configDialog({ isEdit: false });

        if (!newWorld) return;

        await uniforge.db.addWorld(newWorld);

        await uniforge.rebuildDocs();
        await this.refresh();
    }

    /**
     * Gerencia a ação de clique em um item da lista de Mundos.
     *
     * @param {*} event 
     * @returns {*} 
    */
    onWorldItemClick(event) {
        event.stopPropagation();
        const item = event.target.closest('.item');
        const wid = item.dataset.value;
        const isDefaultWorld = (wid === uniforge.settings.get('app.defaultWorld'));

        const button = this.querySelector('#select.dialog-button');

        const worldInfo = this.querySelector('.content .world-info');
        const worldTitle = this.querySelector('#worldTitle');
        const worldDescription = this.querySelector('#worldDescription');
        const hasMapSwitch = this.querySelector('#hasMapSwitch input');
        const defaultWorldSwitch = this.querySelector('#defaultWorldSwitch input');

        // Verifique se já há um Mundo selecionado.
        const selectedWorld = this.querySelector('#worldList li.item.selected');
        // Tem um Mundo já selecionado.
        if (selectedWorld) {
            // Remova a seleção.  
            selectedWorld.classList.remove('selected');

            // Adicione a nova seleção, apenas se ela não for aquela que já estava selecionada.
            if (selectedWorld.dataset.value !== item.dataset.value) item.classList.add('selected');
            // Se for o mesmo, limpe os dados da seleção e retorne.
            else {
                worldTitle.textContent = '';
                worldDescription.innerHTML = '<span></span>';

                worldInfo.classList.add('hidden');
                button.disabled = true;

                this.result = null;
                return;
            }
        }
        // Caso contrário, sempre adicione a nova seleção.
        else item.classList.add('selected');

        // Obtém os dados do Mundo selecionado.
        const world = uniforge.doc.worlds.get(wid);
        // Se não houver Mundo, aborte.
        if (!world) {
            uniforge.msgBox.showWarning('O Mundo não foi encontrado.');
            return;
        }

        button.disabled = false;

        worldTitle.textContent = world.title;
        worldDescription.innerHTML = `<span>${world.description}</span>`;

        hasMapSwitch.checked = (world.hasMap == 1);
        defaultWorldSwitch.checked = isDefaultWorld ?? false;

        worldInfo.classList.remove('hidden');

        // Guarde o Mundo selecionado para retorno.
        this.result = world;

        document.documentElement.setAttribute('data-theme', world.theme);
    }

    /**
     * Gerencia a ação de clique no botão de remoção de um item da lista de Mundos.
     *
     * @async
     * @param {*} event 
     * @returns {*} 
    */
    async onWorldItemDeleteClick(event) {
        event.stopPropagation();
        const item = event.target.closest('.item');
        const wid = item.dataset.value;

        const confirmed = await Dialogs.secureConfirm('Deletar Mundo', 'Continuar irá remover permanentemente todos os dados registrados dentro do Mundo.');
        if (confirmed) {
            await uniforge.db.deleteWorld(wid);

            await uniforge.rebuildDocs();
            await this.refresh();
        }
    }

    /* ---------------------------------------------------------------------------------------------------------------- */
    // CONFIGURAÇÃO EXTERNA DA CAIXA DE DIÁLOGO

    static async configDialog(options = { isEdit: false }) {
        options = uniforge.utils.mergeObjects(options, { draggable: false, lockScreen: true });

        // Cria uma referência para a resolução da Promise.
        let resolveDialog;

        const resultPromise = new Promise((resolve) => {
            resolveDialog = resolve;
        });

        const dialogData = {
            title: 'Bem Vindo!',
            buttons: {
                select: {
                    label: "Selecionar",
                    icon: "fas fa-check",
                    callback: (event) => {
                        resolveDialog(dialog.result);
                        return true;
                    }
                }
            },
            abort: () => resolveDialog(null)
        };

        const dialog = new this(dialogData, options);
        await dialog.show(true);

        // Aguarda a resolução após uma interação com o diálogo.
        return resultPromise;
    }
}