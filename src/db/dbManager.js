import { registerHook, triggerHook } from "../scripts/hooks.js";
import DBDocuments from "./dbDocuments.js";

export default class DBManager {
    constructor() {
        this.storedProcedures = {
            createCalendarTable: () => this.createCalendarTable(),
            createMonthsTable: () => this.createMonthsTable(),
            createDaysTable: () => this.createDaysTable(),
            createDaysInMonthsTable: () => this.createDaysInMonthsTable(),
            createEntryTypesTable: () => this.createEntryTypesTable(),
            createImportanceTable: () => this.createImportanceTable(),
            createSubjectTypeTable: () => this.createSubjectTypeTable(),
            createCategoryTable: () => this.createCategoryTable(),
            createEntryTable: () => this.createEntryTable(),
            createEventTable: () => this.createEventTable(),
            createTimelineTable: () => this.createTimelineTable(),
            createTimelineEventTable: () => this.createTimelineEventTable(),
            createTextImagesTable: () => this.createTextImagesTable(),
            createSettingsTable: () => this.createSettingsTable()
        };
    }

    async getAllTables() {
        const query = 'SELECT name FROM sqlite_master WHERE type=\'table\' ORDER BY name';
        const rows = await uniforge.sql.query(query);

        return rows;
    }

    async deleteTable(tableName) {
        const query = `DROP TABLE ${tableName}`;
        return await uniforge.sql.exec(query);
    }

    async resetDatabase() {
        const queires = [
            'DROP TABLE _textImages',
            'DROP TABLE _timelineEvent',
            'DROP TABLE category',
            'DROP TABLE entry',
            'DROP TABLE entryTypes',
            'DROP TABLE event',
            'DROP TABLE importance',
            'DROP TABLE settings',
            'DROP TABLE subjectType',
            'DROP TABLE timeline'
        ];

        const totalQueries = queires.length;

        try {
            // Inicia a transação
            await uniforge.sql.exec('BEGIN TRANSACTION');

            let count = 0;

            for (let query of queires) {
                await uniforge.sql.exec(query);
                count++;

                console.log(`Tabela ${count} de ${totalQueries} deletada.`);
            }

            this.createEntryTypesTable();
            this.createImportanceTable();
            this.createTextImagesTable();
            this.createTimelineEventTable();
            this.createSubjectTypeTable();
            this.createCategoryTable();
            this.createEntryTable();
            this.createEventTable();
            this.createTimelineTable();
            this.createSettingsTable();

            // Comita a transação
            await uniforge.sql.exec('COMMIT');
            return true;

        } catch (error) {
            // Faz rollback em caso de erro
            await uniforge.sql.exec('ROLLBACK');
            console.error('Erro ao resetar o banco de dados, operação abortada.', error);
            return false;
        }
    }

    async getCalendars() {
        let query = 'SELECT * FROM calendars;';
        const rows = await uniforge.sql.query(query);
        let params = [];

        const result = {};

        for (let row of rows) {
            const data = {
                _id: row.clid,
                _label: row.label,
                clid: row.clid,
                label: row.label,
                months: [],
                days: [],
                daysInMonth: [],
            }

            query = 'SELECT clmid, label FROM calendarsMonths WHERE clid = ?;';
            params = [row.clid];
            const months = await uniforge.sql.query(query, params);

            for (let month of months) {
                data.months.push(month.label);

                query = 'SELECT days FROM calendarsDaysInMonths WHERE clmid = ?;';
                params = [month.clmid];
                const dayMonths = await uniforge.sql.query(query, params);
                data.daysInMonth.push(dayMonths[0].days);
            }

            query = 'SELECT label FROM calendarsDays WHERE clid = ?;';
            params = [row.clid];
            const days = await uniforge.sql.query(query, params);

            for (let day of days) {
                data.days.push(day.label);
            }

            result[data.clid] = data;
        }

        return result;
    }

    async getAllRoots() {
        let query = 'SELECT * FROM roots';
        const rows = await uniforge.sql.query(query);

        return rows;
    }

    async getEntryTypes() {
        let query = 'SELECT * FROM entryTypes';
        const rows = await uniforge.sql.query(query);

        return rows;
    }

    async getImportances(getExternal = false) {
        let query = 'SELECT * FROM importance ';
        if (!getExternal) query += 'WHERE isEntry = 1;'

        const rows = await uniforge.sql.query(query);

        rows.forEach(row => {
            row._id = row.iid,
                row._label = row.label
        });

        return rows;
    }

    async addCategory(data) {
        let query = 'INSERT INTO category (cid, sid, title, img, ext, htmlString, isDraft) VALUES (?,?,?,?,?,?,?);';
        const params = [];

        params.push(this.generateUUID());
        params.push(data.sid);
        params.push(data.title);
        params.push(data.rawData ?? null);
        params.push(data.ext ?? 'jpeg');
        params.push(data.htmlString);
        params.push(Number(data.isDraft));

        const result = await uniforge.sql.exec(query, params);

        return result;
    }
    async updateCategory(data) {

        const updateSet = this.buildUpdateSet([
            ['sid', data.sid],
            ['title', data.title],
            ['img', data.rawData],
            ['ext', data.ext],
            ['htmlString', data.htmlString],
            ['isDraft', Number(data.isDraft)]
        ], { withNulls: true });

        let query = `UPDATE category SET ${updateSet} WHERE cid = ?`;
        let params = [data.cid];
        const result = await uniforge.sql.exec(query, params);

        return result;
    }
    async getCategory(cid) {
        let query = 'SELECT * FROM category WHERE cid = ?';
        const params = [cid];
        const rows = await uniforge.sql.query(query, params);

        if (rows.length >= 1) return rows[0];
        else return null;
    }
    async getAllCategory() {
        /*
        let query = 'SELECT *, S.icon FROM category AS C ';
        query += 'INNER JOIN subjectType AS S ON S.sid = C.sid ';
        query += 'WHERE C.isDraft = 0 ORDER BY C.title;';
        const rows = await uniforge.sql.query(query);
        */
        let query = 'SELECT * FROM category AS C ORDER BY C.title;';
        const rows = await uniforge.sql.query(query);

        rows.forEach(row => {
            row._id = row.cid;
            row._label = row.title;
        });

        return rows;
    }
    async getAllCategoryWithEntries() {
        query = 'SELECT C.*, S.icon FROM category AS C ';
        query += 'INNER JOIN subjectType AS S ON S.sid = C.sid ';
        query += 'ORDER BY S.title, C.title;';
        const rows = await uniforge.sql.query(query);

        rows.forEach(async row => {
            row._id = row.cid;
            row._label = row.title;
            row.entries = await this.getEntriesFromCategory(row.cid);

            row.entries.forEach(entry => {
                entry._id = entry.eid;
                entry._label = entry.title;
            });
        });

        return rows;
    }
    async deleteCategory(cid) {
        let result = {};
        let query = 'DELETE FROM category WHERE cid = ?;';
        const params = [cid];

        result.categoryQuery = await uniforge.sql.exec(query, params);

        query = 'DELETE FROM entry WHERE cid = ?;'
        result.entryQuery = await uniforge.sql.exec(query, params);

        return result;
    }
    async getCategoryFromRoot(root) {
        let query = 'SELECT C.cid, C.title AS label FROM category AS C ' +
            'INNER JOIN subjectType AS S ON S.sid = C.sid ' +
            `WHERE S.root = ?`;
        const params = [root];
        const rows = await uniforge.sql.query(query, params);

        return rows;
    }
    async getCategoriesFromSubject(sid) {
        let query = 'SELECT * FROM category AS C WHERE C.sid = ?;';
        const params = [sid];

        const rows = await uniforge.sql.query(query, params);
        return rows;
    }

    async addSubject(data) {
        let query = 'INSERT INTO subjectType (sid, root, title, icon) VALUES (?,?,?,?);';
        let params = [];

        params.push(this.generateUUID());
        params.push(data.root);
        params.push(data.title);
        params.push(data.icon);

        const result = await uniforge.sql.exec(query, params);

        return result;
    }
    async getSubject(sid) {
        let query = 'SELECT * FROM subjectType AS S WHERE S.sid = ?';
        const params = [sid];

        if (rows.length >= 1) return rows[0];
        else return null;
    }
    async getSubjectRoot(sid) {
        let query = 'SELECT S.title, S.root, R.icon FROM subjectType AS S ';
        query += 'INNER JOIN roots AS R ON S.root = R.root ';
        query += 'WHERE S.sid = ?;';
        const params = [sid];
        const rows = await uniforge.sql.query(query, params);

        if (rows.length >= 1) return rows[0];
        else return null;
    }
    async getAllSubjects() {
        /*
        let query = '';
        if (root === '*') {
            query = 'SELECT * FROM subjectType AS S ORDER BY S.title;';
            return await uniforge.sql.query(query);
        } else {
            const params = [root];
            query = 'SELECT C.cid, C.sid, C.title, C.img, C.htmlString, C.isDraft FROM category AS C ';
            query += 'INNER JOIN subjectType AS S ON S.sid = C.sid ';
            query += 'WHERE S.root = ? AND C.isDraft = 0 ORDER BY S.title;';

            return await uniforge.sql.query(query, params);
        }*/
        const query = 'SELECT * FROM subjectType AS S ORDER BY S.title;';
        const rows = await uniforge.sql.query(query);

        rows.forEach(row => {
            row._id = row.sid;
            row._label = row.title;
        });

        return rows;
    }

    async getAllFolders(root = '*') {
        let query = '';
        if (root === '*') {
            query = 'SELECT * FROM subjectType AS S ORDER BY S.title;';
            return await uniforge.sql.query(query);
        } else {
            const params = [root];
            query = 'SELECT C.cid, C.sid, C.title, C.img, C.htmlString, C.isDraft FROM category AS C ';
            query += 'INNER JOIN subjectType AS S ON S.sid = C.sid ';
            query += 'WHERE S.root = ? AND C.isDraft = 0 ORDER BY S.title;';

            return await uniforge.sql.query(query, params);
        }
    }

    async addEntry(data) {
        let query = 'INSERT INTO entry (eid, etid, cid, title, flavor, htmlString, img, ext, isDraft) VALUES (?,?,?,?,?,?,?,?,?);';
        let params = [];

        const eid = this.generateUUID();

        params.push(eid);
        params.push(data.etid);
        params.push(data.cid);
        params.push(data.title);
        params.push(data.flavor);
        params.push(data.htmlString);
        params.push(data.rawData ?? null);
        params.push(data.ext ?? 'jpeg');
        params.push(Number(data.isDraft));

        const result = await uniforge.sql.exec(query, params);
        result.addedId = eid;

        return result;
    }
    async updateEntry(data) {
        const updateSet = this.buildUpdateSet([
            ['etid', data.etid],
            ['title', data.title],
            ['flavor', data.flavor],
            ['htmlString', data.htmlString],
            ['isDraft', Number(data.isDraft)],
            ['cid', data.cid],
            ['ext', data.ext],
            ['img', data.rawData]
        ], { withNulls: true });

        let query = `UPDATE entry SET ${updateSet} WHERE eid = ?`;
        let params = [data.eid];
        const result = await uniforge.sql.exec(query, params);

        return result;
    }
    async getEntry(eid) {
        let query = 'SELECT * FROM entry WHERE eid = ?;';
        const params = [eid];

        const rows = await uniforge.sql.query(query, params);

        if (rows.length >= 1) return rows[0];
        else return null;
    }
    async getEntryWithIcon(eid) {
        let query = 'SELECT E.*, C.title AS category, S.icon FROM entry AS E ';
        query += 'INNER JOIN category AS C ON C.cid = E.cid ';
        query += 'INNER JOIN subjectType AS S ON S.sid = C.sid ';
        query += 'WHERE eid = ?'
        const params = [eid];

        const rows = await uniforge.sql.query(query, params);

        if (rows.length >= 1) return rows[0];
        else return null;
    }
    async getAllEntriesWithIcon() {
        let query = 'SELECT E.*, C.title AS category, S.icon FROM entry AS E ';
        query += 'INNER JOIN category AS C ON C.cid = E.cid ';
        query += 'INNER JOIN subjectType AS S ON S.sid = C.sid ';

        const rows = await uniforge.sql.query(query);

        return rows;
    }
    async getAllEntriesAndTimelinesExcept(id, type) {
        let query = 'SELECT A.eid AS id, A.title, \'entry\' AS type, S.icon FROM entry AS A ';
        query += 'INNER JOIN category AS C ON C.cid = A.cid ';
        query += 'INNER JOIN subjectType AS S ON S.sid = C.sid ';
        query += 'WHERE A.isDraft = 0';

        if (type == 'entry') query += ` AND A.eid <> '${id}'`;

        query += ' UNION ';
        query += 'SELECT A.tid AS id, A.title, \'timeline\' AS type, S.icon FROM timeline AS A ';
        query += 'INNER JOIN _timelineEvent AS TE ON TE.tid = A.tid ';
        query += 'INNER JOIN event AS EV ON EV.evid = TE.evid ';
        query += 'INNER JOIN entry AS E ON E.eid = EV.eid ';
        query += 'INNER JOIN category AS C ON C.cid = E.cid ';
        query += 'INNER JOIN subjectType AS S ON S.sid = C.sid ';
        query += 'WHERE A.isDraft = 0 ';

        if (type == 'timeline') query += ` AND A.tid <> '${id}'`;

        query += 'ORDER BY S.icon, A.title '

        const rows = await uniforge.sql.query(query);

        return rows;
    }
    async getAllEntries() {
        const query = 'SELECT * FROM entry;';
        const rows = await uniforge.sql.query(query);

        rows.forEach(row => {
            row._id = row.eid;
            row._label = row.title;
        });

        return rows;
    }
    async deleteEntry(eid) {
        let query = 'DELETE FROM entry WHERE eid = ?;';
        const params = [eid];
        const result = await uniforge.sql.exec(query, params);

        return result;
    }
    async getEntriesFromCategory(cid) {
        let query = 'SELECT * FROM entry WHERE cid = ?;';
        const params = [cid];

        const rows = await uniforge.sql.query(query, params);
        return rows;
    }
    async addEntriesTextImages(data) {
        let query = 'INSERT INTO _textImages (uuid, img, ext) VALUES (?,?,?);';
        const params = [];
        const blob = data.data;

        params.push(data.uuid);
        params.push(blob.img);
        params.push(blob.ext);

        const result = await uniforge.sql.exec(query, params);

        return result;
    }
    async getEntriesTextImage(uuid) {
        let query = 'SELECT * FROM _textImages AS TI WHERE TI.uuid = ?;';
        const params = [uuid];

        const rows = await uniforge.sql.query(query, params);
        return rows;
    }

    async addEvent(data) {
        let query = 'INSERT INTO event (evid, eid, iid, clid, start_year, start_month, start_day, end_year, end_month, end_day, flavor) ';
        query += 'VALUES (?,?,?,?,?,?,?,?,?,?,?);';
        const params = [];

        params.push(this.generateUUID());
        params.push(data.eid);
        params.push(data.iid);
        params.push(data.clid);
        params.push(data.date.start.year);
        params.push(data.date.start.month);
        params.push(data.date.start.day);
        params.push(data.date.end.year);
        params.push(data.date.end.month);
        params.push(data.date.end.day);
        params.push(data.flavor);

        const result = await uniforge.sql.exec(query, params);

        return result;
    }
    async updateEvent(data) {
        const updateSet = this.buildUpdateSet([
            ['eid', data.eid],
            ['iid', data.iid],
            ['clid', data.clid],
            ['start_year', data.date.start.year],
            ['start_month', data.date.start.month],
            ['start_day', data.date.start.day],
            ['end_year', data.date.end.year],
            ['end_month', data.date.end.month],
            ['end_day', data.date.end.day],
            ['flavor', data.flavor]
        ]);

        let query = `UPDATE event SET ${updateSet} WHERE evid = ?`;
        let params = [data.evid];
        const result = await uniforge.sql.exec(query, params);

        return result;
    }
    async getEventOfEntry(eid) {
        let query = 'SELECT * FROM event WHERE eid = ?;';
        const params = [eid];

        const rows = await uniforge.sql.query(query, params);

        if (rows.length >= 1) return rows[0];
        else return null;
    }

    async getTimeline(tid) {
        let query = 'SELECT * FROM timeline WHERE tid = ?;';
        const params = [tid];

        const rows = await uniforge.sql.query(query, params);

        if (rows.length >= 1) return rows[0];
        else return null;
    }
    async getAllTimelines() {
        let query = 'SELECT * FROM timeline';

        const rows = await uniforge.sql.query(query);

        if (rows.length >= 1) return rows[0];
        else return null;
    }
    async getEventsFromTimeline(tid) {
        let query = 'SELECT TE.tid, E.title, EV.* FROM _timelineEvent AS TE ';
        query += 'INNER JOIN event AS EV ON TE.evid = EV.evid ';
        query += 'INNER JOIN entry AS E ON EV.eid = E.eid ';
        query += 'WHERE TE.tid = ?;';
        const params = [tid];

        const rows = await uniforge.sql.query(query, params);
        return rows;
    }
    async getTimelineWithIcon(tid) {
        let query = 'SELECT * FROM timeline WHERE tid = ?;';
        const params = [tid];

        const rows = await uniforge.sql.query(query, params);

        if (rows.length >= 1) return rows[0];
        else return null;
    }

    // Função para a tabela subjectType
    async getAllSubjectType() {
        const query = 'SELECT * FROM subjectType';
        const result = await uniforge.sql.query(query);
        return result.map(row => ({
            _id: row.sid,
            _label: row.title,
            ...row
        }));
    }

    // Função para a tabela category
    async getAllCategory() {
        const query = 'SELECT * FROM category';
        const result = await uniforge.sql.query(query);
        return result.map(row => ({
            _id: row.cid,
            _label: row.title,
            ...row
        }));
    }

    // Função para a tabela entry
    async getAllEntry() {
        const query = 'SELECT * FROM entry';
        const result = await uniforge.sql.query(query);
        return result.map(row => ({
            _id: row.eid,
            _label: row.title,
            ...row
        }));
    }

    // Função para a tabela event
    async getAllEvent() {
        const query = 'SELECT * FROM event';
        const result = await uniforge.sql.query(query);
        return result.map(row => ({
            _id: row.evid,
            ...row
        }));
    }

    // Função para a tabela timeline
    async getAllTimeline() {
        const query = 'SELECT * FROM timeline';
        const result = await uniforge.sql.query(query);
        return result.map(row => ({
            _id: row.tid,
            _label: row.title,
            ...row
        }));
    }

    // Função para a tabela calendars
    async getAllCalendars() {
        const query = 'SELECT * FROM calendars';
        const result = await uniforge.sql.query(query);
        return result.map(row => ({
            _id: row.clid,
            _label: row.label,
            ...row
        }));
    }

    // Função para a tabela calendarsMonths
    async getAllCalendarsMonths() {
        const query = 'SELECT * FROM calendarsMonths';
        const result = await uniforge.sql.query(query);
        return result.map(row => ({
            _id: row.clmid,
            _label: row.label,
            ...row
        }));
    }

    // Função para a tabela calendarsDays
    async getAllCalendarsDays() {
        const query = 'SELECT * FROM calendarsDays';
        const result = await uniforge.sql.query(query);
        return result.map(row => ({
            _id: row.cldid,
            _label: row.label,
            ...row
        }));
    }

    // Função para a tabela calendarsDaysInMonths
    async getAllCalendarsDaysInMonths() {
        const query = 'SELECT * FROM calendarsDaysInMonths';
        const result = await uniforge.sql.query(query);
        return result.map(row => ({
            _id: row.cldmid,
            ...row
        }));
    }

    // Função para a tabela roots
    async getAllRoots() {
        const query = 'SELECT * FROM roots';
        const result = await uniforge.sql.query(query);
        return result.map(row => ({
            _id: row.root,
            ...row
        }));
    }

    // Função para a tabela _textImages
    async getAllTextImages() {
        const query = 'SELECT * FROM _textImages';
        const result = await uniforge.sql.query(query);
        return result.map(row => ({
            _id: row.uuid,
            ...row
        }));
    }

    // Função para a tabela settings
    async getAllSettings() {
        const query = 'SELECT * FROM settings';
        const result = await uniforge.sql.query(query);
        return result.map(row => ({
            _id: row.tag,
            _label: row.title,
            ...row
        }));
    }

    // Função para a tabela importance
    async getAllImportance() {
        const query = 'SELECT * FROM importance';
        const result = await uniforge.sql.query(query);
        return result.map(row => ({
            _id: row.iid,
            _label: row.label,
            ...row
        }));
    }

    // Função para a tabela entryTypes
    async getAllEntryTypes() {
        const query = 'SELECT * FROM entryTypes';
        const result = await uniforge.sql.query(query);
        return result.map(row => ({
            _id: row.etid,
            _label: row.label,
            ...row
        }));
    }

    async createEntryTable() {
        const query = 'CREATE TABLE IF NOT EXISTS entry (eid TEXT PRIMARY KEY NOT NULL,' +
            'cid TEXT NOT NULL,' +                        // Identificador da Categoria
            'etid TEXT NOT NULL,' +                       // Texto para representar a importância
            'title TEXT NOT NULL,' +                      // Título da entrada
            'flavor TEXT,' +                              // Descrição adicional
            'htmlString TEXT,' +                          // HTML associado à entrada
            'img BLOB,' +                                 // BLOB associado à imagem da entrada
            'ext VARCHAR(50),' +                          // Extensão do arquivo de imagem
            'isDraft BOOLEAN NOT NULL DEFAULT 0 )';       // Indica se é um rascunho (falso por padrão)

        console.log('Tabela \'entry\' criada....OK.');
        return await uniforge.sql.exec(query);
    }

    async createEventTable() {
        const query = 'CREATE TABLE IF NOT EXISTS event (evid TEXT PRIMARY KEY NOT NULL,' +
            'eid TEXT NOT NULL,' +                        // Identificador da Entrada
            'iid TEXT NOT NULL,' +                        // Identificador da importância
            'clid TEXT NOT NULL,' +                       // Identificador do calendário
            'flavor TEXT,' +                              // Descrição adicional
            'start_day INTEGER,' +                        // Dia da data inicial
            'start_month INTEGER,' +                      // Mês da data inicial
            'start_year INTEGER,' +                       // Ano da data inicial
            'end_day INTEGER,' +                          // Dia da data final
            'end_month INTEGER,' +                        // Mês da data final
            'end_year INTEGER)';                          // Ano da data final

        console.log('Tabela \'event\' criada....OK.');
        return await uniforge.sql.exec(query);
    }

    async createTextImagesTable() {
        const query = 'CREATE TABLE IF NOT EXISTS _textImages (uuid TEXT PRIMARY KEY NOT NULL,' +
            'img BLOB NOT NULL,' +                 // Texto para representar a importância
            'ext VARCHAR(50) NOT NULL)';            // Ano (como número inteiro)'; 

        console.log('Tabela \'_textImages\' criada....OK.');
        return await uniforge.sql.exec(query);
    }

    async createSubjectTypeTable() {
        const query = 'CREATE TABLE IF NOT EXISTS subjectType (sid TEXT PRIMARY KEY NOT NULL,' +
            'root TEXT NOT NULL,' +                 // Origem do tipo
            'title TEXT NOT NULL,' +                // Título do tipo
            'icon TEXT NOT NULL)';                  // Classe do ícone do FontAwesome

        console.log('Tabela \'subjectType\' criada....OK.');
        return await uniforge.sql.exec(query);
    }

    async createCategoryTable() {
        const query = 'CREATE TABLE IF NOT EXISTS category (cid TEXT PRIMARY KEY NOT NULL,' +
            'sid TEXT NOT NULL,' +                          // Identificador do tipo de assunto            
            'title TEXT NOT NULL,' +                        // Título do tipo
            'htmlString TEXT NOT NULL,' +                   // HTML associado à entrada
            'img BLOB,' +                                   // BLOB associado à imagem da entrada
            'ext NVARCHAR(50),' +                           // Extensão do arquivo de imagem
            'isDraft BOOLEAN NOT NULL DEFAULT 0 )';         // Indica se é um rascunho (falso por padrão)

        console.log('Tabela \'category\' criada....OK.');
        return await uniforge.sql.exec(query);
    }

    async createTimelineTable() {
        const query = 'CREATE TABLE IF NOT EXISTS timeline (tid TEXT PRIMARY KEY NOT NULL,' +
            'title TEXT NOT NULL,' +                        // Título da linha do tempo
            'flavor TEXT NOT NULL,' +                       // Descrição adicional                          // Extensão do arquivo de imagem
            'isDraft BOOLEAN NOT NULL DEFAULT 0 )';         // Indica se é um rascunho (falso por padrão)

        console.log('Tabela \'timeline\' criada....OK.');
        return await uniforge.sql.exec(query);
    }

    async createTimelineEventTable() {
        const query = 'CREATE TABLE IF NOT EXISTS _timelineEvent (tid TEXT PRIMARY KEY NOT NULL,' + // Identificador da linha do tempo
            'evid TEXT NOT NULL)';                        // Identificador do evento           

        console.log('Tabela \'_timelineEvent\' criada....OK.');
        return await uniforge.sql.exec(query);
    }

    async createEntryTypesTable() {
        let query = 'DROP TABLE entryTypes';
        let changes = 0;
        let result = await uniforge.sql.exec(query);
        changes += result.changes;

        query = 'CREATE TABLE IF NOT EXISTS entryTypes (etid TEXT PRIMARY KEY NOT NULL,' +
            'label TEXT NOT NULL,' +
            'icon TEXT NOT NULL)';                // Número de DIAS por MÊS do calendário

        console.log('Tabela \'entryTypes\' criada....OK.');
        result = await uniforge.sql.exec(query);
        changes += result.changes;

        console.log('Populando tabela \'entryTypes\'....');

        const entryTypes = [
            {
                label: 'Artigo Genérico',
                icon: 'fas fa-newspaper'
            },
            {
                label: 'Boato',
                icon: 'fas fa-comments'
            },
            {
                label: 'Descoberta',
                icon: 'fas fa-book-open-reader'
            },
            {
                label: 'Documento',
                icon: 'fas fa-file'
            },
            {
                label: 'Pessoa',
                icon: 'fas fa-user-large'
            },
            {
                label: 'Relato',
                icon: 'fas fa-message'
            }
        ];

        query = 'INSERT INTO entryTypes (etid, label, icon) ';
        query += 'VALUES (?,?,?);';

        entryTypes.forEach(async entryType => {
            let params = [];

            params.push(this.generateUUID());
            params.push(entryType.label);
            params.push(entryType.icon);

            result = await uniforge.sql.exec(query, params);
            changes += result.changes;
        });
        console.log('Tabela \'entryTypes\' populada....OK.');

        result.changes = changes;
        return result;
    }
    async createImportanceTable() {
        let query = 'DROP TABLE importance';
        let changes = 0;
        let result = await uniforge.sql.exec(query);

        changes += result.changes;

        query = 'CREATE TABLE IF NOT EXISTS importance (iid TEXT PRIMARY KEY NOT NULL,' +
            'label TEXT NOT NULL,' +                        // Título da importância
            'isEntry BOOLEAN NOT NULL DEFAULT 1)';          // Se é uma importância de entrada

        result = await uniforge.sql.exec(query);
        changes += result.changes;
        console.log('Tabela \'importance\' criada....OK.');

        console.log('Populando tabela \'importance\'....');

        query = 'INSERT INTO importance (iid, label) ';
        query += 'VALUES (?,?);';
        let params = [];

        params.push(this.generateUUID());
        params.push('Major');
        result = await uniforge.sql.exec(query, params);
        changes += result.changes;

        params = [];
        params.push(this.generateUUID());
        params.push('Minor');
        result = await uniforge.sql.exec(query, params);
        changes += result.changes;

        query = 'INSERT INTO importance (iid, label, isEntry) ';
        query += 'VALUES (?,?,?);';

        params = [];
        params.push(this.generateUUID());
        params.push('Timeline');
        params.push(Number(false));
        result = await uniforge.sql.exec(query, params);
        changes += result.changes;

        result.changes = changes;

        console.log('Tabela \'importance\' populada....OK.');
        return result;
    }

    async createSettingsTable() {
        let query = 'CREATE TABLE IF NOT EXISTS settings (tag VARCHAR(50) PRIMARY KEY NOT NULL,' +
            '\"group\" VARCHAR(50) NOT NULL,' +     // Grupo de configuração
            'value TEXT NOT NULL)';             // Valor da configuração

        console.log('Tabela \'settings\' criada....OK.');
        return await uniforge.sql.exec(query);
    }

    async createCalendarTable() {
        let query = 'CREATE TABLE IF NOT EXISTS calendars (clid INTEGER PRIMARY KEY,' +
            'label TEXT)';                 // Título do calendário

        console.log('Tabela \'calendar\' criada....OK.');
        return await uniforge.sql.exec(query);
    }

    async createMonthsTable() {
        let query = 'CREATE TABLE IF NOT EXISTS calendarsMonths (clmid INTEGER PRIMARY KEY,' +
            'clid INTEGER,' +
            'label TEXT)';                 // Título do MÊS do calendário

        console.log('Tabela \'calendarsMonths\' criada....OK.');
        return await uniforge.sql.exec(query);
    }

    async createDaysTable() {
        let query = 'CREATE TABLE IF NOT EXISTS calendarsDays (cldid INTEGER PRIMARY KEY,' +
            'clid INTEGER,' +
            'label TEXT)';                 // Título do DIAS do calendário

        console.log('Tabela \'calendarsDays\' criada....OK.');
        return await uniforge.sql.exec(query);
    }

    async createDaysInMonthsTable() {
        let query = 'CREATE TABLE IF NOT EXISTS calendarsDaysInMonths (cldmid INTEGER PRIMARY KEY,' +
            'clmid INTEGER,' +
            'days INTEGER)';                // Número de DIAS por MÊS do calendário

        console.log('Tabela \'calendarsDaysInMonths\' criada....OK.');
        return await uniforge.sql.exec(query);
    }

    /**
     * Executa uma consulta SQL no banco de dados.
     * @param {string} query - A consulta SQL a ser executada.
     * @param {Array} [params=[]] - Parâmetros opcionais para a consulta.
     * @returns {Object} - Resultado da execução.
     * @throws {Error} - Caso ocorra algum erro no banco de dados.
     */
    async execQuery(query, params = []) {
        return await uniforge.sql.exec(query, params);
    }

    /**
     * Valida se os dados de uma Categoria são válidos.
     * @param {Object} data - Dados da Categoria a ser validada.
     * @returns {string} - Erro(s) encontrado(s) ou uma string vazia se a Categoria for válida.
     */
    validateCategory(data) {

        if (!data.sid || data.sid < 1)
            return 'O identificador de Assunto da Categoria é inválido.';
        if (!data.title || data.title == '')
            return 'É necessário informar um título válido para a Categoria.';

        return '';
    }

    /**
     * Valida se os dados de uma Entrada de Atlas são válidos.
     * @param {Object} data - Dados da Entrada a ser validada.
     * @returns {string} - Erro(s) encontrado(s) ou uma string vazia se a Entrada for válida.
     */
    validateAtlasEntry(data) {

        if (!data.cid || data.cid < 1)
            return 'O identificador de Categoria da Entrada é inválido.';
        if (!data.cid || data.cid < 1)
            return 'O identificador de Categoria da Entrada é inválido.';
        if (!data.title || data.title == '')
            return 'É necessário informar um título válido para a Entrada.';
        if (!data.rawData || data.rawData == '')
            return 'É necessário informar uma imagem válida para a Entrada de Atlas.';

        return '';
    }

    /**
     * Valida se os dados de uma Entrada de Evento Histórico são válidos.
     * @param {Object} data - Dados da Entrada a ser validada.
     * @returns {string} - Erro(s) encontrado(s) ou uma string vazia se a Entrada for válida.
     */
    validateEventEntry(data) {

        if (!data.cid || data.cid < 1)
            return 'O identificador de Categoria da Entrada é inválido.';
        if (!data.iid || data.iid < 1)
            return 'O identificador de Importância da Entrada é inválido.';
        if (!data.cid || data.cid < 1)
            return 'O identificador de Categoria da Entrada é inválido.';
        if (!data.date.start)
            return 'Um evento histórico deve sempre informar uma data inicial.';
        if (data.date.start.year == 0)
            return 'Um evento histórico deve sempre informar uma data inicial. O ano informado é inválido.';
        if (data.date.start.month < 0)
            return 'Um evento histórico deve sempre informar uma data inicial. O mês informado é inválido.';
        if (!data.date.start.day || data.date.start.day < 1)
            return 'Um evento histórico deve sempre informar uma data inicial. O dia informado é inválido.';
        if (!data.title || data.title == '')
            return 'É necessário informar um título válido para a Entrada.';

        return '';
    }

    /**
     * Gera um identificador único aleatório (UUID) em formato de string de 16 caracteres.
     * @returns {string} O UUID gerado.
     */
    generateUUID() {
        return uniforge.utils.randomID();
    }

    buildUpdateSet(columns, updateOptions={}) {
        const withNulls = updateOptions.withNulls || false;

        const updateSet = columns
            .filter(([label, value]) => label.trim() && (withNulls || value !== null && value !== undefined && value !== '')) // Remove colunas ou valores vazios
            .map(([label, value]) => {
                if(value === undefined || value === '') value = null;
                
                if (typeof value === 'string') {
                    // Strings cercadas por aspas simples
                    return `${label} = '${value}'`;
                } else {
                    // Outros tipos (número, booleano, etc.) salvos diretamente
                    return `${label} = ${value}`;
                }
            })
            .join(' , '); // Junta tudo com ' , '
        return updateSet;
    }

    buildWhereClause(conditions) {
        const whereClause = conditions
            .filter(([column, value]) => column.trim() && value !== null && value !== undefined && value !== '') // Remove colunas ou valores vazios
            .map(([column, value]) => `${column} = ${typeof value === 'string' ? `'${value}'` : value}`) // Formata cada dupla
            .join(' AND '); // Junta tudo com ' AND '
        return whereClause;
    }
}