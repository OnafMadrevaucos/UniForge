// Código JavaScript para criar os Sets baseados no banco de dados

import CustomDate from "../common/primitives/date.mjs";

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
     * @param {Array<Object>} data.calendarsDaysInMonths - Dados da tabela calendarsDaysInMonths.
     * @param {Array<Object>} data.tomes - Dados da tabela tomes.
     * @param {Array<Object>} data._textImages - Dados da tabela _textImages.
     * @param {Array<Object>} data.chapterTypes - Dados da tabela chapterTypes.
     * @param {Array<Object>} data.entryTypes - Dados da tabela entryTypes.
     * @param {Array<Object>} data.relevances - Dados da tabela relevance.
     * @param {Array<Object>} data.settings - Dados da tabela settings.
     */
    constructor(data) {
        this.tomes = this.createSimpleSet(data.tomes);
        this.chapters = this.createChapterSet(data.chapters, data.sections);
        this.sections = this.createSectionSet(data.sections, data.entries, data.events); 
        this.entries = this.createEntrySet(data.entries, data.events); 
        this.lineages = this.createLineageSet(data.lineages, data.lineageTypes, data.lineageEntries);  
        this.calendars = this.createCalendarsMergedSet(data.calendars, data.calendarsMonths, data.calendarsDays, data.calendarsDaysInMonths);        
        this.events = this.createEventSet(data.events);
        this.timelines = this.createTimelineSet(data.timelines, data.events, data._timelineEvents);
        this.maps = this.createMapSet(data.maps, data.mapElements);        
        this.textImages = this.createSimpleSet(data._textImages);        
        this.chapterTypes = this.createSimpleSet(data.chapterTypes);
        this.entryTypes = this.createSimpleSet(data.entryTypes);
        this.relevances = this.createSimpleSet(data.relevances);   
        this.settings = this.createSimpleSet(data.settings);             

        // Adiciona umas propriedades utilitárias para facilitar o acesso.
        this.entry = this.entries;
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
        data._timelineEvents = await uniforge.db.getAllTimelineEvents();
        data.calendars = await uniforge.db.getAllCalendars();
        data.calendarsMonths = await uniforge.db.getAllCalendarsMonths();
        data.calendarsDays = await uniforge.db.getAllCalendarsDays();
        data.calendarsDaysInMonths = await uniforge.db.getAllCalendarsDaysInMonths();        
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
            const sectionSet = new Array();

            // Converte os booleanos de 0 e 1 para 'false' e 'true'.
            chapter.hasLineage = (chapter.hasLineage === 1);

            // Filtra as categorias que possuem o mesmo ID do Capítulo atual.
            sections
                .filter((section) => section.cid === chapter.cid)
                .forEach((section) => {
                    // Adiciona a categoria ao conjunto, incluindo suas entradas
                    sectionSet.push({ _id: section.sid });
                });

            // Adiciona o SubjectType ao conjunto, incluindo suas categorias
            chapterSet.add({ ...chapter, sections: sectionSet });
        });

        return chapterSet;
    }

    /**
     * Cria um conjunto de Timelines, contendo eventos relacionados.
     *
     * @param {Array<Object>} timelines - Dados da tabela timeline.
     * @param {Array<Object>} events - Dados da tabela event.
     * @param {Array<Object>} timelineEvents - Dados da tabela _timelineEvent.
     * @returns {Set} Conjunto de Timelines.
     */
    createTimelineSet(timelines, events, timelineEvents) {
        const timelineSet = new Set();

        timelines.forEach((timeline) => {
            // Filtra os eventos associados à timeline atual, usando _timelineEvent como relação.
            const eventSet = new Set(
                timelineEvents
                    .filter((te) => te.tid === timeline.tid)
                    .map((te) => events.find((event) => event.evid === te.evid))
            );

            // Adiciona a timeline ao conjunto, incluindo seus eventos
            timelineSet.add({ ...timeline, events: eventSet });
        });

        return timelineSet;
    }

    /**
     * Cria um conjunto de Linhagens, contendo tipos de Linhagem relacionados.
     *
     * @param {Array<Object>} lineages          - Dados da tabela lineageTree.
     * @param {Array<Object>} types             - Dados da tabela lineageType.
     * @param {Array<Object>} entries    - Dados da tabela lineageTreeEntries.
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

            const lineageEntries = entries.filter(e => e.ltid === lineage.ltid).map((e) => {
                const entry = uniforge.utils.deepClone(this.entries.get(e.eid));
                entry.code = e.code;
                entry._id = e.code;

                return {...entry};
            });

            // Filtra os tipos associados à linhagem atual e adiciona os campos _value e _label.
            const entriesSet = new Set(lineageEntries.map((entry) => ({
                ...entry,
                _value: entry.eid,
                _label: entry.name
            })));

             // Adiciona a linhagem ao conjunto, incluindo seus tipos.
            lineageSet.add({ ...lineage, types: typesSet, entries: entriesSet });
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
            const mapElementsSet = new Array();

            // Filtra os Elementos que possuem o mesmo ID do Mapa atual.
            mapElements
                .filter((mapElement) => mapElement.mid === map.mid)
                .forEach((mapElement) => {
                    // Adiciona o Elemento ao conjunto.
                    mapElementsSet.push({ _id: mapElement.meid, ...mapElement });
                });

            // Adiciona o Map ao conjunto, incluindo seus Elementos.
            mapSet.add({ ...map, elements: mapElementsSet });
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
                months: [],
                days: [],
                daysInMonth: [],
            };

            // Obtém os meses associados ao calendário atual
            const months = calendarsMonths.filter((month) => month.clid === calendar.clid);

            months.forEach((month) => {
                // Adiciona o nome do mês à lista de meses
                data.months.push(month.label);

                // Obtém o número de dias para o mês atual, se disponível
                const dayMonths = calendarsDaysInMonths.filter((dim) => dim.clmid === month.clmid);
                data.daysInMonth.push(dayMonths.length > 0 ? dayMonths[0].days : null);
            });

            // Obtém os dias associados ao calendário atual
            const days = calendarsDays.filter((day) => day.clid === calendar.clid);

            days.forEach((day) => {
                // Adiciona o nome do dia à lista de dias
                data.days.push(day.label);
            });

            // Adiciona o calendário mesclado ao conjunto
            calendarsSet.add(data);
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
            let event = null;
            // Filtra os eventos associados à entrada atual.
            events
                .filter((e) => e.source === entry.eid)
                .forEach((e) => {
                    event = e.evid;
                });

            // Adiciona a entrada ao conjunto, incluindo seus eventos
            entrySet.add({ ...entry, event: event });
        });        

        return entrySet;
    }

    /**
     * Cria um conjunto de eventos (Events).
     *
     * @param {Array<Object>} events - Dados da tabela event.
     * @returns {Set} Conjunto de eventos.
     */
    createEventSet(events) {
        const eventSet = new Set();

        events.forEach((event) => { 
            const calendar = this.calendars?.get(event.clid) ?? null;
            const start = calendar ? new CustomDate(calendar, { day: event.s_day, month: event.s_month, year: event.s_year }) : null;
            const end = calendar && event.e_day ? new CustomDate(calendar, { day: event.e_day, month: event.e_month, year: event.e_year }) : null;

            // Adiciona o evento ao conjunto.
            eventSet.add({ ...event, _id: event.evid, _label: event.title, date: { start, end } });
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
                const entrySet = new Array();
                const eventSet = new Array();

                const chapter = this.chapters.get(section.cid);

                // Filtra as entradas que possuem o ID correspondente à seção atual
                entries
                    .filter((entry) => entry.sid === section.sid)
                    .forEach((entry) => {
                        // Adiciona a entrada ao conjunto
                        entrySet.push({ _id: entry.eid });
                });

                // Filtra os eventos que possuem o ID correspondente à seção atual
                events
                 .filter((event) => event.sid === section.sid)
                 .forEach((event) => {
                     // Adiciona o evento ao conjunto
                     eventSet.push({ _id: event.evid });
                    });                

                // Adiciona a categoria ao conjunto, incluindo suas entradas
                sectionSet.add({ ...section, type: chapter.tome, chapterType: chapter.type, chapter: chapter.hasLineage, entries: entrySet, events: eventSet });
            });
        } else throw new Error('Não foi possível criar o Set das categorias. O Set dos chapters deve ser criado antes do de sections.');

        return sectionSet;
    }

    /**
     * Cria um conjunto simples com os dados fornecidos.
     *
     * @param {Array<Object>} data - Dados de uma tabela qualquer.
     * @returns {Set} Conjunto simples dos dados.
     */
    createSimpleSet(data) {
        return new Set(data);
    }
}
