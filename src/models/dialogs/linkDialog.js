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
    * Prepara os dados do diálogo e configura o diálogo com os dados preparados.
    * @inheritdoc
    */
    prepareData() {
        this.prepareFolders(this.data);

        this.data.entryTypes = uniforge.doc.entryTypes.toObject();
        this.data.relevances = uniforge.doc.relevances.toObject();
    }

    prepareFolders(data) {
        const entries = uniforge.doc.entries.toObject();
        const events = uniforge.doc.events.toObject();
        const lineages = uniforge.doc.lineages.toObject();
        const timelines = uniforge.doc.timelines.toObject();

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

        tinymce.get('linkflavorEditor').setContent('');

        this._clearEntryList();
        this._clearFolderList();
    }

    /**
    * Configura o editor TinyMCE para o texto de floreio da Entrada.
    */
    async configureFlavorTinyMCE() {
        if (tinymce.get('linkflavorEditor')) {
            tinymce.remove('#linkflavorEditor');
        }

        const options = uniforge.utils.mergeObjects(uniforge.tinymceOptions.lite, {
            selector: 'div#linkflavorEditor',
            placeholder: "Descrição do link...",
            readonly: true,
            init_instance_callback: (editor) => {
                editor.setContent(""); // Garante que o editor seja iniciado vazio.
            },
            setup: (editor) => { this._setupInlineTinyMCE(editor); },
            content_style: "body { text-align: justify; }"
        });

        await tinymce.init(options);
    }

    /**
    * Configura ouvintes de eventos básicos para o dialog.
    * @protected
    */
    activateListeners() {
        super.activateListeners();
        const sidebar = this.querySelector('.sidebar');
        const folders = this.querySelectorAll('.folder');
        const itemsList = this.querySelectorAll('.entry-item');

        sidebar.addEventListener('click', (event) => { this._onSidebarClick(event); });

        folders.forEach(item => {
            const folderHeader = item.querySelector('.folder-header');
            folderHeader.addEventListener('click', (event) => {
                this._onFolderClick(event);
            });
        });

        itemsList.forEach(item => {
            item.addEventListener('dblclick', (event) => { this._onEntryItemDoubleClick(event); });
        });
    }

    /**
    * Gerencia cliques no sidebar.
    * @param {MouseEvent} event - O evento de clique.
    */
    _onSidebarClick(event) {
        event.stopPropagation();
        if (event.target.classList.contains('sidebar')) this.clearElements();
    }

    /**
   * Gerencia cliques em pastas.
   * @param {MouseEvent} event - O evento de clique.
   */
    _onFolderClick(event) {
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
        this._toggleLineageGroups(false);
        this._toggleTimelineGroups(false);
    }

    /**
    * Gerencia cliques duplos em itens de entrada.
    * @inheritdoc
    * @param {MouseEvent} event - O evento de clique duplo.
    */
    async _onEntryItemDoubleClick(event) {
        const item = event.target.closest('.entry-item');
        const folder = event.target.closest('.folder-list');
        const itemId = item.dataset.id;

        this._resetGroups();

        let data = null;
        switch (folder.id) {
            case 'entryList':
                data = uniforge.doc.entries.get(itemId);
                data.type = 'entry';
                break;
            case 'eventList':
                data = uniforge.doc.events.get(itemId);
                data.type = 'event';
                this._toggleEventGroups(true);
                break;
            case 'lineageList':
                data = uniforge.doc.lineages.get(itemId);
                data.type = 'lineage';
                this._toggleLineageGroups(true);
                break;
            case 'timelineList':
                data = uniforge.doc.timelines.get(itemId);
                data.type = 'timeline';
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
        tinymce.get('linkflavorEditor').setContent(data.flavor);

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