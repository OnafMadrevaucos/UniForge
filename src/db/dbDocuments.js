// Código JavaScript para criar os Sets baseados no banco de dados

/**
 * Classe para criar e gerenciar conjuntos (Sets) baseados em dados de um banco de dados.
 */
export default class DBDocuments {
    /**
     * Construtor da classe DatabaseSets.
     *
     * @param {Object} data - Objeto contendo os dados do banco de dados organizados por tabelas.
     * @param {Array<Object>} data.subjects - Dados da tabela subjectType.
     * @param {Array<Object>} data.categories - Dados da tabela category.
     * @param {Array<Object>} data.entries - Dados da tabela entry.
     * @param {Array<Object>} data.events - Dados da tabela event.
     * @param {Array<Object>} data.timelines - Dados da tabela timeline.
     * @param {Array<Object>} data._timelineEvents - Dados da tabela _timelineEvent.
     * @param {Array<Object>} data.calendars - Dados da tabela calendars.
     * @param {Array<Object>} data.calendarsMonths - Dados da tabela calendarsMonths.
     * @param {Array<Object>} data.calendarsDays - Dados da tabela calendarsDays.
     * @param {Array<Object>} data.calendarsDaysInMonths - Dados da tabela calendarsDaysInMonths.
     * @param {Array<Object>} data.roots - Dados da tabela roots.
     * @param {Array<Object>} data._textImages - Dados da tabela _textImages.
     * @param {Array<Object>} data.settings - Dados da tabela settings.
     * @param {Array<Object>} data.importances - Dados da tabela importance.
     * @param {Array<Object>} data.entryTypes - Dados da tabela entryTypes.
     */
    constructor(data) {
        this.subjects = this.createSubjectTypeSet(data.subjects, data.categories, data.entries, data.events);
        this.timelines = this.createTimelineSet(data.timelines, data.events, data._timelineEvents);
        this.calendars = this.createCalendarsMergedSet(data.calendars, data.calendarsMonths, data.calendarsDays, data.calendarsDaysInMonths);
        this.events = this.createEventSet(data.events);
        this.entries = this.createEntrySet(data.entries, data.events);
        this.categories = this.createCategorySet(data.categories, data.entries, data.events);
        this.roots = this.createSimpleSet(data.roots);
        this.textImages = this.createSimpleSet(data._textImages);
        this.settings = this.createSimpleSet(data.settings);
        this.importances = this.createSimpleSet(data.importances);
        this.entryTypes = this.createSimpleSet(data.entryTypes);
    }    

    /**
     * Cria um conjunto de SubjectTypes, contendo categorias, entradas e eventos relacionados.
     *
     * @param {Array<Object>} subjectTypes - Dados da tabela subjectType.
     * @param {Array<Object>} categories - Dados da tabela category.
     * @param {Array<Object>} entries - Dados da tabela entry.
     * @param {Array<Object>} events - Dados da tabela event.
     * @returns {Set} Conjunto de SubjectTypes.
     */
    createSubjectTypeSet(subjectTypes, categories, entries, events) {
        const subjectTypeSet = new Set();

        subjectTypes.forEach((subjectType) => {
            const categorySet = new Array();

            // Filtra as categorias que possuem o mesmo sid do SubjectType atual
            categories
                .filter((category) => category.sid === subjectType.sid)
                .forEach((category) => {
                    // Adiciona a categoria ao conjunto, incluindo suas entradas
                    categorySet.push({ _id: category.cid});
                });

            // Adiciona o SubjectType ao conjunto, incluindo suas categorias
            subjectTypeSet.add({ ...subjectType, categories: categorySet });
        });

        return subjectTypeSet;
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
     * Cria um conjunto de eventos.
     *
     * @param {Array<Object>} events - Dados da tabela event.
     * @returns {Set} Conjunto de eventos.
     */
    createEventSet(events) {
        // Cria um conjunto simples de eventos
        const eventSet = new Set(
            events.map((event) => ({ ...event }))
        );

        return eventSet;
    }

    /**
     * Cria um conjunto de entradas (Entries), contendo eventos relacionados.
     *
     * @param {Array<Object>} entries - Dados da tabela entry.
     * @param {Array<Object>} events - Dados da tabela event.
     * @returns {Set} Conjunto de entradas.
     */
    createEntrySet(entries, events) {
        const entrySet = new Set();
        
        entries.forEach((entry) => {  
            let event = null;
            // Filtra os eventos associados à entrada atual
            events
                .filter((e) => e.eid === entry.eid)
                    .forEach((e) => {
                        event = e.evid;
                
            });
            // Adiciona a entrada ao conjunto, incluindo seus eventos
            entrySet.add({ ...entry, event: event });
        });

        return entrySet;
    }

    /**
     * Cria um conjunto de categorias, contendo entradas e eventos relacionados.
     *
     * @param {Array<Object>} categories - Dados da tabela category.
     * @param {Array<Object>} entries - Dados da tabela entry.
     * @param {Array<Object>} events - Dados da tabela event.
     * @returns {Set} Conjunto de categorias.
     */
    createCategorySet(categories, entries, events) {
        const categorySet = new Set();

        if (this.subjects) {            
            categories.forEach((category) => {
                const entrySet = new Array();
                const subject = this.subjects.get(category.sid);
    
                // Filtra as entradas que possuem o cid correspondente à categoria atual
                entries
                    .filter((entry) => entry.cid === category.cid)
                    .forEach((entry) => {                    
                        // Adiciona a entrada ao conjunto, incluindo seus eventos
                        entrySet.push({ _id: entry.eid });
                    });
    
                // Adiciona a categoria ao conjunto, incluindo suas entradas
                categorySet.add({ ...category, type: subject.root, entries: entrySet });
            });
        } else throw new Error('Não foi possível criar o Set das categorias. O Set dos subjects deve ser criado antes do de categories.');

        return categorySet;
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
