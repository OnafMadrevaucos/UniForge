import BaseDialog from "./baseDialog.js";
import CustomDate from "../../common/primitives/date.mjs";

export default class LinkDialog extends BaseDialog {
    constructor(dialogData = {}, options = {}) {
        super(dialogData, uniforge.utils.mergeObjects(options, {
            height: '500px',
            width: '675px'
        }));

        this.sourceId = options?.id ?? null;

        this.sourceType = options?.type ?? null;

        this.template = 'linkDialog'; // Define o template do diálogo.
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
            if (content !== null && !(typeof content === 'string')) throw new TypeError('O conteúdo deve ser uma string.');

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
        await this.configureFlavorTinyMCE();       
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

    /**
    * Configura o editor TinyMCE para o texto de floreio da Entrada.
    */
    async configureFlavorTinyMCE() {
        if (this.flavorEditor) {
            tinymce.remove(this.query.flavor_editor);
        } else {
            // Trata o id do container do editor, inserindo o uuid do formulário.
            const div = this.querySelector('#linkFlavorEditor');
            div.id = this.query.flavor_editor;
        }

        const options = uniforge.utils.mergeObjects(uniforge.tinymceOptions.simple, {
            selector: `div#${this.query.flavor_editor}`,
            placeholder: "Descrição da Entrada...",
            init_instance_callback: (editor) => {
                editor.setContent(""); // Garante que o editor seja iniciado vazio.
            },
            setup: (editor) => { this._setupInlineTinyMCE(editor); }
        });

        await tinymce.init(options);
    }

    /**
    * Configura ouvintes de eventos básicos para o dialog.
    * @protected
    */
    activateListeners() {
        const sidebar = this.querySelector('.sidebar');
        const folders = this.querySelectorAll('.folder');
        const itemsList = this.querySelectorAll('.entry-item');

        sidebar.addEventListener('click', (event) => { this.onSidebarClick(event); });

        folders.forEach(item => {
            const folderHeader = item.querySelector('.folder-header');
            folderHeader.addEventListener('click', (event) => {
                this.onFolderClick(event);
            });
        });

        itemsList.forEach(item => {
            item.addEventListener('dblclick', (event) => { this.onEntryItemDoubleClick(event); });
        });

        const searchInput = this.querySelector('#searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (event) => { this.onSearchInput(event); });

            const clearSearch = this.querySelector('#clearSearch');
            clearSearch.addEventListener('click', (event) => { this.onClearSearch(event); });
        }       
    }

    /**
    * Gerencia cliques no sidebar.
    * @param {MouseEvent} event - O evento de clique.
    */
    onSidebarClick(event) {
        event.stopPropagation();
        if (event.target.classList.contains('sidebar')) this.clearElements();
    }

    /**
   * Gerencia cliques em pastas.
   * @param {MouseEvent} event - O evento de clique.
   */
    onFolderClick(event) {
        event.stopPropagation();
        const clickedFolder = event.target.closest('.folder');
        const isSelected = clickedFolder.classList.contains('selected');

        this._clearFolderList();

        if (!isSelected) {
            clickedFolder.classList.add('selected');
            const folderIcon = clickedFolder.querySelector('.fas');
            folderIcon.classList.remove(...folderIcon.classList);
            folderIcon.classList.add('fas', 'fa-folder-open');
        }
    }

    /**
    * Gerencia cliques duplos em itens de entrada.
    * @inheritdoc
    * @param {MouseEvent} event - O evento de clique duplo.
    */
    async onEntryItemDoubleClick(event) {
        const item = event.target.closest('.entry-item');
        const folder = event.target.closest('.folder-list');
        const itemId = item.dataset.id;

        this._resetGroups();

        let data = null;
        switch (folder.id) {
            case 'entryList':
                data = uniforge.doc.entries.get(itemId);
                break;
            case 'eventList':
                data = uniforge.doc.events.get(itemId);
                this._toggleEventGroups(true);
                break;
            case 'lineageList':
                data = uniforge.doc.lineages.get(itemId);
                this._toggleLineageGroups(true);
                break;
            case 'timelineList':
                data = uniforge.doc.timelines.get(itemId);
                this._toggleTimelineGroups(true);
                break;
            default:
                throw new Error('A pasta selecionada é inválida.');
        }

        const titleInput = this.querySelector('#titleInput');
        const entryType = this.querySelector('#entryType');
        const founderInput = this.querySelector('#founderInput');
        const relevance = this.querySelector('#relevance');
        const startDateInput = this.querySelector('#startDateInput');
        const endDateInput = this.querySelector('#endDateInput');

        titleInput.value = data.title;
        entryType.value = data.etid;

        this.flavorEditor = data.flavor; // Define o conteúdo do editor de floreio.

        if (data.type === 'event') {
            relevance.value = data.relevance;

            const calendar = uniforge.doc.calendars.get(data.clid);
            if (!calendar) throw new Error('Calendário informado não encontrado.');

            const startDate = new CustomDate(calendar, { day: data.s_day, month: data.s_month, year: data.s_year });
            startDateInput.value = startDate.toString('MMn DD, YYYYs');

            if (data.e_day) {
                const endDate = new CustomDate(calendar, { day: data.e_day, month: data.e_month, year: data.e_year });
                endDateInput.value = endDate.toString('MMn DD, YYYYs');
            } else {
                endDateInput.value = '—';
            }
        }

        if (data.type === 'lineage') {
            founderInput.value = data.founder;
        }

        if (data.type === 'timeline' && !data.events.isEmpty()) {
            const calendar = uniforge.doc.calendars.get(data.events.first().clid);
            if (!calendar) throw new Error('Calendário informado não encontrado.');

            // Mostra a data de fim do último somente se houver mais de um evento na Linha do Tempo.
            // Caso contrário, as datas serão idênticas, pois first() e last() retornam o mesmo valor.
            if (data.events.size > 1) {
                const sortedEvents = data.events.sort((a, b) => {
                    const startDateA = new CustomDate(calendar, { day: a.s_day, month: a.s_month, year: a.s_year });
                    const startDateB = new CustomDate(calendar, { day: b.s_day, month: b.s_month, year: b.s_year });
                    return startDateA.ticks - startDateB.ticks;
                });

                const firstEvent = sortedEvents.first();
                const lastEvent = sortedEvents.last();

                const startDate = new CustomDate(calendar, { day: firstEvent.s_day, month: firstEvent.s_month, year: firstEvent.s_year });
                const endDate = new CustomDate(calendar, { day: lastEvent.s_day, month: lastEvent.s_month, year: lastEvent.s_year });

                startDateInput.value = startDate.toString('MMn DD, YYYYs');
                endDateInput.value = endDate.toString('MMn DD, YYYYs');
            } else {
                const startDate = new CustomDate(calendar, { day: data.events.first().s_day, month: data.events.first().s_month, year: data.events.first().s_year });

                startDateInput.value = startDate.toString('MMn DD, YYYYs');
                endDateInput.value = '—';
            }
        }

        // Foca no campo de Título.    
        titleInput.focus();

        const linkButton = this.querySelector('#link');
        linkButton.dataset.item = JSON.stringify({ id: itemId, type: data.type });

        this._clearEntryList();

        item.classList.add('selected');
        const itemIcon = item.querySelector('.fas');
        itemIcon.classList.remove(...itemIcon.classList);
        itemIcon.classList.add('fas', 'fa-eye');
    }

    onSearchInput(event) {
        const filter = event.target.value.trim().toLowerCase();

        const folders = this.querySelectorAll('.folder');
        const entries = this.querySelectorAll('.entry-item');

        // Se busca estiver vazia, mostrar tudo e restaurar textos.
        if (filter === '') {
            entries.forEach(e => {
                e.style.display = '';
                uniforge.parser.removeHighlight(e);
            });

            folders.forEach(f => {
                f.style.display = '';
                uniforge.parser.removeHighlight(f);
            });

            return;
        }

        // 1) Filtra e realça entries.
        entries.forEach(entry => {
            const span = entry.querySelector('span');
            const label = entry.dataset.label ?? span.textContent;

            // Guarda texto original (uma vez só).
            if (!span.dataset.originalText) {
                span.dataset.originalText = span.innerHTML;
            }

            const match = label.toLowerCase().includes(filter);
            entry.style.display = match ? '' : 'none';

            // Realce.
            if (match) {
                span.innerHTML = uniforge.parser.applyHighlight(label, filter);
            } else {
                uniforge.parser.removeHighlight(entry);
            }
        });

        // 2) Folders aparecem se:
        //    - elas mesmas combinam; ou
        //    - possuem ao menos um entry visível;
        folders.forEach(folder => {
            const span = folder.querySelector('.folder-header span');
            const folderLabel = folder.dataset.label ?? span.textContent;

            if (!span.dataset.originalText) {
                span.dataset.originalText = span.innerHTML;
            }

            const folderMatches = folderLabel.toLowerCase().includes(filter);

            // Procura entries visíveis dentro desta pasta.
            const visibleEntries = folder.querySelectorAll('.entry-item:not([style*="display: none"])');
            const hasVisibleChild = visibleEntries.length > 0;

            // Exibição final.
            folder.style.display = (folderMatches || hasVisibleChild) ? '' : 'none';

            // Realce se combinar.
            if (folderMatches) {
                span.innerHTML = uniforge.parser.applyHighlight(folderLabel, filter);
            } else {
                uniforge.parser.removeHighlight(folder);
            }
        });

        const emptyListSpan = this.querySelector('#emptyListSpan');

        // Verifica se há algum item visível.
        const anyFolderVisible = Array.from(folders)
            .some(folder => folder.style.display !== 'none');

        // Se nenhum folder visível, mostrar mensagem de lista vazia.
        if (!anyFolderVisible) emptyListSpan.classList.remove('hidden');
        else emptyListSpan.classList.add('hidden');

    }

    onClearSearch(event) {
        const searchInput = this.querySelector('#searchInput');
        searchInput.value = '';

        this._onSearchInput({ target: searchInput });
    }

    /**
     * Remove a seleção de todas as pastas.
     * @private
     */
    _clearFolderList() {
        const folders = this.querySelectorAll('.folder');
        folders.forEach(item => {
            item.classList.remove('selected');
            const folderIcon = item.querySelector('.fas');
            folderIcon.classList.remove(...folderIcon.classList);
            folderIcon.classList.add('fas', 'fa-folder');
        });
        this._clearEntryList();
    }

    /**
     * Remove a seleção de todas as entradas.
     * @private
     */
    _clearEntryList() {
        const itemsList = this.querySelectorAll('.entry-item');
        itemsList.forEach(item => {
            item.classList.remove('selected');
            const itemIcon = item.querySelector('.fas');
            itemIcon.classList.remove(...itemIcon.classList);
            itemIcon.classList.add('fas', 'fa-file');
        });
    }

    _resetGroups() {
        this._toggleEventGroups(false);
        this._toggleTimelineGroups(false);
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
        };
    }

    _toggleEventGroups(show = false) {
        const relevanceGroup = this.querySelector('#relevanceGroup');
        const dateGroup = this.querySelector('#dateGroup');

        if (show) {
            relevanceGroup.classList.remove('hidden');
            dateGroup.classList.remove('hidden');
        } else {
            relevanceGroup.classList.add('hidden');
            dateGroup.classList.add('hidden');
        }
    }
    _toggleLineageGroups(show = false) {
        const founderGroup = this.querySelector('#founderGroup');

        if (show) {
            founderGroup.classList.remove('hidden');
        } else {
            founderGroup.classList.add('hidden');
        }
    }
    _toggleTimelineGroups(show = false) {
        const entryTypeGroup = this.querySelector('#entryTypeGroup');
        const dateGroup = this.querySelector('#dateGroup');

        if (show) {
            entryTypeGroup.classList.add('hidden');
            dateGroup.classList.remove('hidden');
        } else {
            entryTypeGroup.classList.remove('hidden');
            dateGroup.classList.add('hidden');
        }
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
                        const button = event.target.closest('.dialog-button');
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