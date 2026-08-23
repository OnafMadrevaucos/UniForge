import Calendar from "../common/documents/calendar.mjs";
import CalendarMonths from "../common/documents/calendarMonths.mjs";
import CalendarDays from "../common/documents/calendarDays.mjs";
import Chapter from "../common/documents/chapter.mjs";
import ChapterType from "../common/documents/chapterType.mjs";
import Entry from "../common/documents/entry.mjs";
import Entity from "../common/documents/entity.mjs";
import EntryType from "../common/documents/entryType.mjs";
import EntryEvent from "../common/documents/event.mjs";
import LineageEntry from "../common/documents/lineageEntry.mjs";
import Section from "../common/documents/section.mjs";
import LineageTree from "../common/documents/lineageTree.mjs";
import Relevance from "../common/documents/relevance.mjs";
import BaseDocument from "../common/documents/base.mjs";
import Tome from "../common/documents/tome.mjs";
import Setting from "../common/documents/setting.mjs";
import TextImage from "../common/documents/textImage.mjs";
import MapAtlas from "../common/documents/map.mjs";
import MapElement from "../common/documents/mapElement.mjs";
import Timeline from "../common/documents/timeline.mjs";
import SettingsSet from "../common/primitives/settingsSet.mjs";

/**
 * Classe para criar e gerenciar conjuntos (Sets) baseados em dados de um banco de dados.
 */
export default class DBDocuments {
    /**
     * Construtor da classe DatabaseSets.
     *
     * @param {Object} data - Objeto contendo os dados do banco de dados organizados por tabelas.
     * @param {Array<Object>} data.chapters - Dados da tabela chapter.
     * @param {Array<Object>} data.sections - Dados da tabela section.
     * @param {Array<Object>} data.entries - Dados da tabela entry.
     * @param {Array<Object>} data.events - Dados da tabela event.
     * @param {Array<Object>} data.timelines - Dados da tabela timeline.
     * @param {Array<Object>} data.maps - Dados da tabela map.
     * @param {Array<Object>} data.lineages - Dados da tabela lineageTree.
     * @param {Array<Object>} data.lineageTypes - Dados da tabela lineageType.
     * @param {Array<Object>} data.calendars - Dados da tabela calendars.
     * @param {Array<Object>} data.calendarsMonths - Dados da tabela calendarsMonths.
     * @param {Array<Object>} data.calendarsDays - Dados da tabela calendarsDays.
     * @param {Array<Object>} data.tomes - Dados da tabela tomes.
     * @param {Array<Object>} data._textImages - Dados da tabela _textImages.
     * @param {Array<Object>} data.chapterTypes - Dados da tabela chapterTypes.
     * @param {Array<Object>} data.entryTypes - Dados da tabela entryTypes.
     * @param {Array<Object>} data.relevances - Dados da tabela relevance.
     * @param {Array<Object>} data.settings - Dados da tabela settings.
     */
    constructor(data) {
        this.calendars = this.createCalendarsMergedSet(data.calendars, data.calendarsMonths, data.calendarsDays);

        this.tomes = this.createGenericSet(data.tomes, Tome);
        this.textImages = this.createGenericSet(data.textImages, TextImage);
        this.chapterTypes = this.createGenericSet(data.chapterTypes, ChapterType);
        this.entryTypes = this.createGenericSet(data.entryTypes, EntryType);
        this.relevances = this.createGenericSet(data.relevances, Relevance);        

        this.chapters = this.createChapterSet(data.chapters, data.sections);
        this.sections = this.createSectionSet(data.sections, data.entries, data.events);
        this.entries = this.createEntrySet(data.entries, data.events);
        this.lineages = this.createLineageSet(data.lineages, data.lineageTypes, data.lineageEntries);
        this.events = this.createEventSet(data.events);
        this.timelines = this.createTimelineSet(data.timelines, data.timelineEvents);
        this.maps = this.createMapSet(data.maps, data.mapElements);
        this.settings = this.createSettingsSet(data.settings);

        // Adiciona umas propriedades utilitárias para facilitar o acesso.
        this.entry = this.entries;
        this.entity = this.entries;
        this.event = this.events;
        this.lineage = this.lineages;
        this.timeline = this.timelines;
    }

    static async UniForgeData() {
        // Exemplo de uso com dados simulados
        const data = {};

        data.tomes = await uniforge.db.getAllTomes();
        data.chapters = await uniforge.db.getAllChapters();
        data.sections = await uniforge.db.getAllSections();
        data.entries = await uniforge.db.getAllEntries();
        data.events = await uniforge.db.getAllEvents();
        data.lineages = await uniforge.db.getAllLineageTrees();
        data.lineageTypes = await uniforge.db.getAllLineageTypes();
        data.lineageEntries = await uniforge.db.getAllLineageTreeEntries();
        data.maps = await uniforge.db.getAllMaps();
        data.mapElements = await uniforge.db.getAllMapElements();
        data.timelines = await uniforge.db.getAllTimelines();
        data.timelineEvents = await uniforge.db.getAllTimelineEvents();
        data.calendars = await uniforge.db.getAllCalendars();
        data.calendarsMonths = await uniforge.db.getAllCalendarsMonths();
        data.calendarsDays = await uniforge.db.getAllCalendarsDays();
        data.textImages = await uniforge.db.getAllTextImages();
        data.settings = await uniforge.db.getAllSettings();
        data.relevances = await uniforge.db.getAllRelevances();
        data.chapterTypes = await uniforge.db.getAllChapterTypes();
        data.entryTypes = await uniforge.db.getAllEntryTypes();

        return data;
    }

    /**
     * Cria um conjunto de SubjectTypes, contendo categorias, entradas e eventos relacionados.
     *
     * @param {Array<Object>} chapters - Dados da tabela Chapter.
     * @param {Array<Object>} sections - Dados da tabela Section.
     * @returns {Set} Conjunto de SubjectTypes.
     */
    createChapterSet(chapters, sections) {
        const chapterSet = new Set();

        chapters.forEach((chapter) => {
            const sectionSet = new Set();

            const cType = this.chapterTypes.get(chapter.type);

            // Converte os booleanos de 0 e 1 para 'false' e 'true'.
            chapter.hasLineage = (chapter.hasLineage === 1);

            // Filtra as categorias que possuem o mesmo ID do Capítulo atual.
            sections
                .filter((section) => section.cid === chapter.cid)
                .forEach((section) => {
                    // Adiciona a categoria ao conjunto, incluindo suas entradas
                    sectionSet.add(new Section(section));
                });

            // Adiciona o SubjectType ao conjunto, incluindo suas categorias
            chapterSet.add(new Chapter({ ...chapter, cType: cType, sections: sectionSet }));
        });

        return chapterSet;
    }

    /**
     * Cria um conjunto de Timelines, contendo eventos relacionados.
     *
     * @param {Array<Object>} timelines - Dados da tabela timeline.
     * @param {Array<Object>} timelineEvents - Dados da tabela _timelineEvent.
     * @returns {Set} Conjunto de Timelines.
     */
    createTimelineSet(timelines, timelineEvents) {
        const timelineSet = new Set();

        timelines.forEach((timeline) => {
            // Filtra os eventos associados à timeline atual, usando _timelineEvent como relação.
            const eventSet = new Set();

            const te = timelineEvents.filter((te) => te.tid === timeline.tid);

            te.forEach((te) => {
                const e = this.events.get(te.evid);

                if (e) eventSet.add(e);
            });

            // Adiciona a timeline ao conjunto, incluindo seus eventos
            timelineSet.add(new Timeline({ ...timeline, events: eventSet }));
        });

        return timelineSet;
    }

    /**
     * Cria um conjunto de Linhagens, contendo tipos de Linhagem relacionados.
     *
     * @param {Array<Object>} lineages          - Dados da tabela lineageTree.
     * @param {Array<Object>} types             - Dados da tabela lineageType.
     * @param {Array<Object>} entries           - Dados da tabela lineageTreeEntries.
     * @returns {Set} Conjunto de Linhagens.
     */
    createLineageSet(lineages, types, entries) {
        const lineageSet = new Set();

        lineages.forEach((lineage) => {
            const lineageTypes = types.filter(t => t.ltid === lineage.ltid);
            // Filtra os tipos associados à linhagem atual e adiciona os campos _value e _label.
            const typesSet = new Set(lineageTypes.map((type) => ({
                ...type,
                _value: type.tag,
                _label: type.label
            })));

            const entry = this.entries.get(lineage.eid);

            const lineageEntries = entries.filter(e => e.ltid === lineage.ltid).map((e) => {
                const entry = this.entries.get(e.eid);
                return new LineageEntry({ ...entry, code: e.code, isRoot: e.isRoot, isVirtual: e.isVirtual });
            });

            // Filtra os tipos associados à linhagem atual e adiciona os campos _value e _label.
            const entriesSet = new Set(lineageEntries);

            const finalLineage = new LineageTree({ ...lineage, types: typesSet, entity: entry, entries: entriesSet });
            finalLineage.entity.lineage = finalLineage;

            // Adiciona a linhagem ao conjunto, incluindo seus tipos.
            lineageSet.add(finalLineage);
        });

        return lineageSet;
    }

    /**
     * Cria um conjunto de Mapas, contendo os Elementos relacionados.
     *
     * @param {Array<Object>} maps          - Dados da tabela Map.
     * @param {Array<Object>} mapElements   - Dados da tabela Map Elements.
     * @returns {Set} Conjunto de Maps.
     */
    createMapSet(maps, mapElements) {
        const mapSet = new Set();

        maps.forEach((map) => {
            const mapElementsSet = new Set();

            // Filtra os Elementos que possuem o mesmo ID do Mapa atual.
            mapElements
                .filter((mapElement) => mapElement.mid === map.mid)
                .forEach((mapElement) => {
                    // Adiciona o Elemento ao conjunto.
                    mapElementsSet.add(new MapElement(mapElement));
                });

            // Adiciona o Map ao conjunto, incluindo seus Elementos.
            mapSet.add(new MapAtlas({ ...map, elements: mapElementsSet }));
        });

        return mapSet;
    }

    /**
     * Cria um conjunto de calendários mesclados, contendo meses, dias e número de dias por mês.
     *
     * @param {Array<Object>} calendars - Dados da tabela calendars.
     * @param {Array<Object>} calendarsMonths - Dados da tabela calendarsMonths.
     * @param {Array<Object>} calendarsDays - Dados da tabela calendarsDays.
     * @param {Array<Object>} calendarsDaysInMonths - Dados da tabela calendarsDaysInMonths.
     * @returns {Set} Conjunto de calendários mesclados.
     */
    createCalendarsMergedSet(calendars, calendarsMonths, calendarsDays, calendarsDaysInMonths) {
        const calendarsSet = new Set();

        calendars.forEach((calendar) => {
            const data = {
                _id: calendar.clid,
                _label: calendar.label,
                clid: calendar.clid,
                label: calendar.label,
                suffix: calendar.suffix,
                prefix: calendar.prefix,
                months: new Set(),
                days: new Set()
            };

            // Obtém os meses associados ao calendário atual
            const months = calendarsMonths.filter((month) => month.clid === calendar.clid);

            let pos = 0;
            months.forEach((month) => {
                month.pos = pos;
                // Adiciona o nome do mês à lista de meses
                data.months.add(new CalendarMonths(month));

                pos++;
            });

            // Obtém os dias associados ao calendário atual
            const days = calendarsDays.filter((day) => day.clid === calendar.clid);

            days.forEach((day) => {
                // Adiciona o nome do dia à lista de dias
                data.days.add(new CalendarDays(day));
            });

            // Adiciona o calendário mesclado ao conjunto
            calendarsSet.add(new Calendar(data));
        });

        return calendarsSet;
    }

    /**
     * Cria um conjunto de entradas (Entries), contendo eventos relacionados.
     *
     * @param {Array<Object>} entries   - Dados da tabela entry.
     * @param {Array<Object>} events    - Dados da tabela event.
     * @returns {Set} Conjunto de entradas.
     */
    createEntrySet(entries, events) {
        const entrySet = new Set();

        entries.forEach((entry) => {
            let eventsSet = new Set();
            // Filtra os eventos associados à entrada atual.
            events
                .filter((e) => e.source === entry.eid)
                .forEach((e) => {
                    e.calendar = this.calendars.get(e.clid);

                    eventsSet.add(new EntryEvent(e));
                });

            const entryType = this.entryTypes.get(entry.etid);

            const section = this.sections.get(entry.sid);

            if (!entryType.isEntity) {
                // Adiciona a entrada ao conjunto, incluindo seus eventos.
                entrySet.add(new Entry({ ...entry, entryType: entryType, events: eventsSet, section: section }));
            } else {
                // Adiciona a entrada ao conjunto, incluindo seus eventos.
                entrySet.add(new Entity({ ...entry, entryType: entryType, events: eventsSet, section: section }));
            }
        });

        return entrySet;
    }

    /**
     * Atualiza o conjunto de entradas (Entries), inserindo as entidades (Entities).
     * @param {Set<Entry>} entriesSet       - Conjunto de Entradas.
     * @param {Set<Object>} lineagesSet        - Conjunto de Linhagens.
     */
    createEntitySet(entriesSet, lineagesSet) {
        // Insere referência à linhagem da Entidade.
        entriesSet.toArray().forEach((entry) => {
            if (entry.entryType.isEntity) {
                const lineage = lineagesSet.toArray().find(l => l.eid === entry.eid);
                entry.lineage = new LineageTree(lineage);
            }
        });
    }

    /**
     * Cria um conjunto de eventos (Events).
     *
     * @param {Array<Object>} events - Dados da tabela event.
     * @returns {Set<EntryEvent>} Conjunto de eventos.
     */
    createEventSet(events) {
        const eventSet = new Set();

        events.forEach((event) => {
            // Adiciona o Calendário usado pelo Evento.
            event.calendar = this.calendars.get(event.clid);

            // Adiciona a Entrada a qual pertence o Evento.
            event.entry = this.entries.get(event.source);

            // Adiciona o Tipo de Entrada do Evento.
            event.entryType = new EntryType(this.entryTypes.get(event.etid));

            // Adiciona a Relevância do Evento.
            event.relevance = this.relevances.get(event.relevance);

            // Adiciona o evento ao conjunto.
            eventSet.add(new EntryEvent(event));
        });

        return eventSet;
    }

    /**
     * Cria um conjunto de categorias, contendo entradas e eventos relacionados.
     *
     * @param {Array<Object>} sections - Dados da tabela section.
     * @param {Array<Object>} entries - Dados da tabela entry.
     * @param {Array<Object>} events - Dados da tabela event.
     * @returns {Set} Conjunto de categorias.
     */
    createSectionSet(sections, entries, events) {
        const sectionSet = new Set();

        if (this.chapters) {
            sections.forEach((section) => {
                const entrySet = new Set();
                const eventSet = new Set();

                const chapter = this.chapters.get(section.cid);

                // Filtra as entradas que possuem o ID correspondente à seção atual
                entries
                    .filter((entry) => entry.sid === section.sid)
                    .forEach((entry) => {
                        // Adiciona a entrada ao conjunto
                        entrySet.add(new Entry(entry));
                    });

                // Filtra os eventos que possuem o ID correspondente à seção atual
                events
                    .filter((event) => event.sid === section.sid)
                    .forEach((event) => {
                        event.calendar = this.calendars.get(event.clid);
                        // Adiciona o evento ao conjunto
                        eventSet.add(new EntryEvent(event));
                    });

                // Adiciona a categoria ao conjunto, incluindo suas entradas
                sectionSet.add(new Section({ ...section, chapter: chapter, entries: entrySet, events: eventSet }));
            });
        } else throw new Error('Não foi possível criar o Set das categorias. O Set dos chapters deve ser criado antes do de sections.');

        return sectionSet;
    }

    /**
     * Cria um conjunto de COnfigurações, ordenados por grupos.
     *
     * @param {Array<Setting>} settings      - Dados da tabela Settings.
     * @returns {Set} Conjunto de Maps.
     */
    createSettingsSet(settings) {
        const settingsSet = new SettingsSet();

        settings.forEach((setting) => {
            settingsSet.add(`${setting.group}.${setting.tag}`, setting.value);
        });

        return settingsSet;
    }

    /**
     * Cria um conjunto simples com os dados fornecidos.
     *
     * @param {Array<Object>} data - Dados de uma tabela qualquer.
     * @param {Object} documentClass - Classe que representa o documento.
     * @returns {Set} Conjunto simples dos dados.
     */
    createGenericSet(data, documentClass = BaseDocument) {
        return new Set(data.map((d) => new documentClass(d)));
    }
}
