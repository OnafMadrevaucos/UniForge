import BaseDialog from "./baseDialog.js";
import CustomDate from "../../common/primitives/date.mjs";
import { LinkTooltip } from "../../scripts/linkTooltip.js";

export default class LinkDialog extends BaseDialog {
    constructor(dialogData = {}, options = {}) {
        super(dialogData, uniforge.utils.mergeObjects(options, {
            height: '500px',
            width: '350px'
        }));

        this.sourceId = options?.id ?? null;

        this.sourceType = options?.type ?? null;

        this.template = 'linkDialog'; // Define o template do diálogo.

        this.selectedItem = null; // Armazena o item selecionado no diálogo.

        /**
        * @type {LinkTooltip} - O tooltip de links do Artigo.
        */
        this.tooltip = new LinkTooltip('link-item');
    }

    /**
     * Retorna um objeto com seletores para elementos da aplicação.
     * 
     * @returns {Object} - Um objeto com as seguintes propriedades:
     *  - overlay: Seletor para o elemento overlay da aplicação.
     *  - app: Seletor para o elemento container da aplicação.
     *  - header: Seletor para o elemento header da aplicação.
     *  - main: Seletor para o elemento main da aplicação.
     *  - close_btn: Seletor para o elemento de fechar a aplicação.
     *  - main_editor: Seletor para o principal editor Tiny MCE da aplicação.
     *  - flavor_editor: Seletor para o editor Tiny MCE de floreio da aplicação.
     *  - event_editor: Seletor para o editor Tiny MCE de eventos da aplicação.
     *  - side_panel: Seletor para o panel lateral do diálogo.
    */
    get query() {
        const query = {
            flavor_editor: `FlavorEditor-${this.uuid}`
        }
        return uniforge.utils.mergeObjects(super.query, query);
    }

    /**
     * Retorna o editor Tiny MCE de floreio da Entrada.
     * @returns {tinymce.Editor|null} - O editor de floreio ou nulo, se ele não existir.
     */
    get flavorEditor() {
        const editor = tinymce.get(this.query.flavor_editor);
        return editor ? editor : null;
    }

    /**
     * Define o conteúdo do editor de floreio.
     * @param {string} content - O conteúdo a ser definido.
     */
    set flavorEditor(content) {
        if (this.flavorEditor && content !== undefined) {
            if (!content.isEmpty() && !(typeof content === 'string')) throw new TypeError('O conteúdo deve ser uma string.');

            content = content ?? ''; // Se o conteúdo for nulo, faça o conteúdo vazio.
            this.flavorEditor.setContent(content);
        }
    }

    /**
    * Prepara os dados do diálogo e configura o diálogo com os dados preparados.
    * @inheritdoc
    */
    prepareData() {
        this.prepareFolders(this.data);

        this.data.entryTypes = uniforge.doc.entryTypes.toArray();
        this.data.relevances = uniforge.doc.relevances.toArray();
    }

    prepareFolders(data) {
        const entries = uniforge.doc.entries.toArray();
        const events = uniforge.doc.events.toArray();
        const lineages = uniforge.doc.lineages.toArray();
        const timelines = uniforge.doc.timelines.toArray();

        const folders = [];

        const entryFolder = {
            _label: 'Entradas',
            _id: 'entries',
            entries: []
        };

        entries.forEach((entry) => {
            const folder = {
                _label: entry.title,
                _id: entry.eid
            };

            entryFolder.entries.push(folder);
        });

        folders.push(entryFolder);

        const eventFolder = {
            _label: 'Eventos',
            _id: 'events',
            events: []
        };

        events.forEach((event) => {
            const folder = {
                _label: event.title,
                _id: event.evid
            };

            eventFolder.events.push(folder);
        });

        folders.push(eventFolder);

        const lineageFolder = {
            _label: 'Linhagens',
            _id: 'lineages',
            lineages: []
        };

        lineages.forEach((lineage) => {
            const folder = {
                _label: lineage.title,
                _id: lineage.ltid
            };

            lineageFolder.lineages.push(folder);
        });

        folders.push(lineageFolder);

        const timelineFolder = {
            _label: 'Linhas do Tempo',
            _id: 'timelines',
            timelines: []
        };

        timelines.forEach((timeline) => {
            const folder = {
                _label: timeline.title,
                _id: timeline.tid
            };

            timelineFolder.timelines.push(folder);
        });

        folders.push(timelineFolder);

        data.folders = folders.sort();
    }

    async configureElements() {
        this.configureLists();
    }

    clearElements() {
        const titleInput = this.querySelector('#titleInput');
        const entryType = this.querySelector('#entryType');
        const relevance = this.querySelector('#relevance');
        const startDateInput = this.querySelector('#startDateInput');
        const endDateInput = this.querySelector('#endDateInput');

        titleInput.value = '';
        entryType.value = '';
        relevance.value = '';
        startDateInput.value = '';
        endDateInput.value = '';

        // Limpa o editor de floreio.
        this.flavorEditor = '';

        this._clearEntryList();
        this._clearFolderList();
    }

    configureLists() {
        const entryTypes = {
            entries: 'entry',
            events: 'event',
            lineages: 'lineage',
            timelines: 'timeline'
        };

        const linkGroups = this.querySelectorAll('.link-group');
        linkGroups.forEach(group => {
            const type = group.dataset.type;
            // Verifica se o tipo do grupo é válido.
            if (!entryTypes[type]) return;

            const list = group.querySelector('.link-list');
            if (list) {
                // Busca as entradas da pasta.
                const folder = this.data.folders.find(f => f._id === type);
                if (folder && folder.entries?.length > 0) {
                    // Ordena as entradas alfabeticamente pelo título.
                    folder.entries.sort((a, b) => a._label.localeCompare(b._label));
                    // Cria um item para cada entrada na pasta.
                    folder.entries.forEach(e => {
                        const data = uniforge.doc[type].get(e._id);

                        const item = document.createElement('div');
                        item.classList.add(`${type}-item`, 'link-item', 'flexrow');
                        item.dataset.id = data._id;
                        item.dataset.type = entryTypes[type];

                        const icon = document.createElement('i');
                        icon.className = data.entryType.icon;

                        const nameSpan = document.createElement('span');
                        nameSpan.textContent = data._label;

                        item.appendChild(icon);
                        item.appendChild(nameSpan);

                        list.appendChild(item);
                    });
                }
            }
        });
    }

    /**
     * Configura o evento de mouseover e mouseout para exibir tooltips nos links
     * de Entradas no formulário.
     * 
     * @listens mouseover
     */
    onTooltipMouseOver(event) {
        const linkItem = event.target.closest('.link-item');
        if (linkItem) {
            this.tooltip._showLinkTooltip(event, linkItem.dataset.id);
        } else {
            this.tooltip._hideLinkTooltip();
        }
    }
    /**
     * Configura o evento de mouseover e mouseout para exibir tooltips nos links
     * de Entradas no formulário.
     * 
     * @listens mouseout
     */
    onTooltipMouseOut() {
        this.tooltip._hideLinkTooltip();
    }

    /**
    * Configura ouvintes de eventos básicos para o dialog.
    * @protected
    */
    activateListeners() {
        const searchInput = this.querySelector('#searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (event) => { this.onSearchInput(event); });

            const clearSearch = this.querySelector('#clearSearch');
            clearSearch.addEventListener('click', (event) => { this.onClearSearch(event); });
        }

        const tooltip = this.tooltip;

        const linkItems = this.querySelectorAll('.link-item');
        linkItems.forEach(linkItem => {
            linkItem.addEventListener('mouseover', (event) => { this.onTooltipMouseOver(event); });
            linkItem.addEventListener('mouseout', () => { this.onTooltipMouseOut(); });

            linkItem.addEventListener('click', (event) => { this.onListItemClick(event); });
        });
    }

    /**
    * Gerencia cliques duplos em itens de entrada.
    * @inheritdoc
    * @param {MouseEvent} event - O evento de clique duplo.
    */
    async onListItemClick(event) {
        const element = event.target.closest('.link-item');

        const link = {
            id: element.dataset.id ?? null,
            type: element.dataset.type ?? null
        }

        let data = null;

        switch (link.type) {
            case 'entry':
                data = uniforge.doc.entries.get(link.id);
                break;
            case 'event':
                data = uniforge.doc.events.get(link.id);
                break;
            case 'lineage':
                data = uniforge.doc.lineages.get(link.id);
                break;
            case 'timeline':
                data = uniforge.doc.timelines.get(link.id);
                break;
        }

        // Verifica se a entrada foi encontrada. Se não, não exibe o tooltip.
        if (!data) return;

        const button = this.querySelector('#link.dialog-button');

        // Remove a seleção de todos os itens.
        this.querySelectorAll('.link-item').forEach(item => item.classList.remove('selected'));

        // Se o item clicado já estava selecionado, desmarca ele. 
        if (this.selectedItem && this.selectedItem.dataset.id == element.dataset.id) {
            // Desmarca o item clicado.
            this.selectedItem = null;
            // Remove registro do item selecionado do botão de confirmação.
            button.dataset.item = uniforge.defaults.emptyString;
        }
        // Senão, marca o item clicado como selecionado.
        else {            
            // Marca o item clicado como selecionado.
            element.classList.add('selected');
            // Guarda o item selecionado.
            this.selectedItem = element;
            // Registra o item selecionado no botão de confirmação.
            button.dataset.item = JSON.stringify(link);
        }
    }

    onSearchInput(event) {
        const filter = event.target.value.trim().toLowerCase();

        const linkItems = this.querySelectorAll('.link-item');

        // Se busca estiver vazia, mostrar tudo e restaurar textos.
        if (filter.isEmpty()) {
            linkItems.forEach(l => {
                l.style.display = uniforge.defaults.emptyString;
                uniforge.parser.removeHighlight(l);
            });            

            return;
        }

        // 1) Filtra e realça entries.
        linkItems.forEach(item => {
            const span = item.querySelector('span');
            const label = item.dataset.label ?? span.textContent;

            // Guarda texto original (uma vez só).
            if (!span.dataset.originalText) {
                span.dataset.originalText = span.innerHTML;
            }

            const match = label.toLowerCase().includes(filter);
            item.style.display = match ? uniforge.defaults.emptyString : 'none';

            // Realce.
            if (match) {
                span.innerHTML = uniforge.parser.applyHighlight(label, filter);
            } else {
                uniforge.parser.removeHighlight(item);
            }
        });        

        const emptyListSpan = this.querySelector('#emptyListSpan');
    }

    onClearSearch(event) {
        const searchInput = this.querySelector('#searchInput');
        searchInput.value = '';

        this.onSearchInput({ target: searchInput });
    }    

    async generateMarkerIcon({ color, icon }) {
        function loadImage(src) {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.onerror = reject;
                img.src = src;
            });
        }

        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;

        const ctx = canvas.getContext('2d');

        // === PIN BASE ===
        const pinImg = await loadImage(`./assets/markers/${color}.svg`);
        ctx.drawImage(pinImg, 0, 0, 64, 64);

        // === ÍCONE INTERNO (opcional) ===
        if (icon !== 'none') {
            const iconImg = await loadImage(`./assets/icons/${icon}.png`);
            const size = 28;
            ctx.drawImage(
                iconImg,
                (64 - size) / 2,
                (64 - size) / 2 - 6,
                size,
                size
            );
        }

        const url = await canvas.toDataURL('image/png');

        return L.icon({
            iconUrl: url,
            iconSize: [32, 32],
            iconAnchor: [16, 32],
            popupAnchor: [0, -32]
        });
    }

    async _updateMarkerIcon() {
        if (!this.leafletMarker) return;

        const icon = await this.generateMarkerIcon(this.markerConfig);
        this.leafletMarker.setIcon(icon);

        const preview = this.ui.side_panel.querySelector('#markerPreview');
        preview.src = icon.options.iconUrl;
    }

    static async configDialog(source, options = {}) {
        return new Promise((resolve, reject) => {
            options = uniforge.utils.mergeObjects(options, { source: source, alwaysClose: true });
            const dialog = new this({
                title: 'Novo Vínculo',
                buttons: {
                    cancel: {
                        label: "Cancelar",
                        icon: "fas fa-xmark",
                        callback: () => resolve(null)
                    },
                    link: {
                        label: "Vincular",
                        icon: "fas fa-link",
                        callback: (html, event) => {
                            const button = event.target.closest('#link.dialog-button');
                            const item = JSON.parse(button.dataset.item);

                            resolve(item);
                        }
                    }
                },
                abort: () => resolve(null)
            }, options);
            dialog.show(true);
        });
    }
}