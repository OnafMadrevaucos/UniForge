export default class DBManager {
    storedProcedures = {
        createEntryTable: this.createEntryTable,
        createEntryTypesTable: this.createEntryTypesTable,
        createSubjectTypeTable: this.createSubjectTypeTable,
        createCalendarTable: this.createCalendarTable,
        createMonthsTable: this.createMonthsTable,
        createDaysTable: this.createDaysTable,
        createDaysInMonthsTable: this.createDaysInMonthsTable
    };

    async getAllTables() {
        const query = 'SELECT name FROM sqlite_master WHERE type=\'table\' ORDER BY name';
        const rows = await CONFIG.sql.query(query);

        return rows;
    }  
    
    async getCalendars() {
        let query = 'SELECT * FROM calendars';
        const rows = await CONFIG.sql.query(query);

        const result = {};

        for(let row of rows) {
            const data = {
                clid: row.clid,
                label:row.label,
                months: [],
                days: [],
                daysInMonth: [],
            }

            query = `SELECT clmid, label FROM calendarsMonths WHERE clid = ${row.clid}`;
            const months = await CONFIG.sql.query(query);

            for(let month of months) {
                data.months.push(month.label);

                query = `SELECT days FROM calendarsDaysInMonths WHERE clmid = ${month.clmid}`;
                const dayMonths = await CONFIG.sql.query(query);
                data.daysInMonth.push(dayMonths[0].days);
            }

            query = `SELECT label FROM calendarsDays WHERE clid = ${row.clid}`;
            const days = await CONFIG.sql.query(query);

            for(let day of days) {
                data.days.push(day.label);
            }  

            result[data.label.toLowerCase()] = data;
        }

        return result;
    }   

    async getEntryTypes() {
        let query = 'SELECT * FROM entryTypes';
        const rows = await CONFIG.sql.query(query);

        return rows;
    }

    async getImportances(getExternal=false) {
        let query = 'SELECT * FROM importance ';
        if(!getExternal) query += 'WHERE isEntry = 1;'
        const rows = await CONFIG.sql.query(query);

        return rows;
    }

    async getCategory(cid) {
        let query = 'SELECT * FROM category ' +
                    `WHERE cid = ${cid}`;
        const rows = await CONFIG.sql.query(query);

        return rows;
    }

    async getCategoryFromRoot(root) {
        let query = 'SELECT C.cid, C.title AS label FROM category AS C ' +
                    'INNER JOIN subjectType AS S ON S.sid = C.sid ' +
                    `WHERE C.root = ${root}`;
        const rows = await CONFIG.sql.query(query);

        return rows;
    }

    async deleteCategory(cid) {
        let query = 'DELETE FROM category ' +
                    `WHERE cid = ${cid}`;
        const result = await CONFIG.sql.exec(query);

        return result;
    }

    async getSubjects(root='*') {
        let query = '';
        if(root === '*') {
            query = 'SELECT * FROM subjectType AS S ';
        } else {
            query = 'SELECT C.cid, C.sid, C.title, C.img, C.htmlString, C.isDraft FROM category AS C ' +
                    'INNER JOIN subjectType AS S ON S.sid = C.sid ' +
                    `WHERE S.root = '${root}' `;
        }
        query += 'ORDER BY S.title';
        const rows = await CONFIG.sql.query(query);

        return rows;
    }

    async getCategoriesFromSubject(sid) {
        let query = `SELECT * FROM category AS C WHERE C.sid = ${sid}`;

        const rows = await CONFIG.sql.query(query);
        return rows;
    }

    async addCategory(data) {   
        let query = 'INSERT INTO category (sid, title, htmlString, isDraft) VALUES ('; 
        query += `'${data.sid}',`;
        query += `'${data.title}',`;
        query += `'${data.htmlString}',`;
        query += `${data.isDraft ? 1 : 0});`;                    
                    
        const result = await CONFIG.sql.exec(query);
        
        return result;
    }

    async getEntriesFromCategory(cid) {
        let query = `SELECT * FROM entry AS E WHERE E.cid = ${cid}`;

        const rows = await CONFIG.sql.query(query);
        return rows;
    }

    async addEntry(data) { 
        let query = `INSERT INTO entry (etid, title, flavor, htmlString, isDraft, cid) VALUES (`; 
        query += `'${data.etid}',`;
        query += `'${data.title}',`;
        query += `'${data.flavor}',`;
        query += `'${data.htmlString}',`;
        query += `${data.isDraft ? 1 : 0}`;
        query += `${data.cid});`;       

        const result = await CONFIG.sql.exec(query);
        
        return result;
    }

    async deleteEntry(eid) {
        let query = 'DELETE FROM entry ' +
                    `WHERE eid = ${eid}`;
        const result = await CONFIG.sql.exec(query);

        return result;
    }

    async getAllEntries(withDraft=false) {
        const query = 'SELECT * FROM entry' + (withDraft ? ' isDraft = 1' : '');
        const rows = await CONFIG.sql.query(query);

        return rows;
    }

    async addEvent(data) { 
        let query = `INSERT INTO event (eid, iid, start_year, start_month, start_day, end_year, end_month, end_day, text) VALUES (`; 
        query += `${data.eid},`;
        query += `${data.iid},`;
        query += `${data.date.start.year},`;
        query += `${data.date.start.month},`;
        query += `${data.date.start.day},`;
        query += `${data.date.end.year},`;
        query += `${data.date.end.month},`;
        query += `${data.date.end.day},`;
        query += `'${data.text}');`;       

        const result = await CONFIG.sql.exec(query);
        
        return result;
    }

    async deleteTable(tableName) {
        const query = `DROP TABLE ${tableName}`;
        return await CONFIG.sql.exec(query);
    }
    
    async createEntryTable(){
        const query = 'CREATE TABLE IF NOT EXISTS entry (eid INTEGER PRIMARY KEY,' +
                      'importance TEXT,' +                 // Texto para representar a importância
                      'date_y INTEGER,' +                  // Ano (como número inteiro)
                      'date_m INTEGER,' +                  // Mês (como número inteiro)
                      'date_d INTEGER,' +                  // Dia (como número inteiro)
                      'title TEXT,' +                      // Título da entrada
                      'type TEXT,' +                       // Tipo da entrada
                      'flavor TEXT,' +                     // Sabor ou descrição adicional
                      'icon TEXT,' +                       // Ícone associado (caminho ou identificador)
                      'text TEXT,' +                       // Texto da entrada
                      'htmlString TEXT,' +                 // HTML associado à entrada
                      'isDraft BOOLEAN DEFAULT 0)';        // Indica se é um rascunho (falso por padrão)

        return await CONFIG.sql.exec(query);
    }

    async createSubjectTypeTable(){
        const query = 'CREATE TABLE IF NOT EXISTS subjectType (sid INTEGER PRIMARY KEY,' +
                      'root TEXT,' +                 // Origem do tipo
                      'title TEXT,' +                // Título do tipo
                      'icon TEXT)';                  // Classe do ícone do FontAwesome

        console.log('Tabela \'subjectType\' criada....OK.');            
        return await CONFIG.sql.exec(query);
    }

    async createEntryTypesTable() {
        let query = 'CREATE TABLE IF NOT EXISTS entryTypes (etid INTEGER PRIMARY KEY,' +
        'label TEXT,' +
        'icon TEXT)';                // Número de DIAS por MÊS do calendário
        
        console.log('Tabela \'entryTypes\' criada....OK.');                     
        return await CONFIG.sql.exec(query);
    }

    async createCalendarTable(){
        let query = 'CREATE TABLE IF NOT EXISTS calendars (clid INTEGER PRIMARY KEY,' +
        'label TEXT)';                 // Título do calendário

        console.log('Tabela \'calendar\' criada....OK.');                     
        return await CONFIG.sql.exec(query);
    }

    async createMonthsTable(){
        let query = 'CREATE TABLE IF NOT EXISTS calendarsMonths (clmid INTEGER PRIMARY KEY,' +
        'clid INTEGER,' +
        'label TEXT)';                 // Título do MÊS do calendário
        
        console.log('Tabela \'calendarsMonths\' criada....OK.');                     
        return await CONFIG.sql.exec(query);
    }

    async createDaysTable(){
        let query = 'CREATE TABLE IF NOT EXISTS calendarsDays (cldid INTEGER PRIMARY KEY,' +
        'clid INTEGER,' +
        'label TEXT)';                 // Título do DIAS do calendário
        
        console.log('Tabela \'calendarsDays\' criada....OK.');                     
        return await CONFIG.sql.exec(query);
    }

    async createDaysInMonthsTable(){
        let query = 'CREATE TABLE IF NOT EXISTS calendarsDaysInMonths (cldmid INTEGER PRIMARY KEY,' +
        'clmid INTEGER,' +
        'days INTEGER)';                // Número de DIAS por MÊS do calendário
        
        console.log('Tabela \'calendarsDaysInMonths\' criada....OK.');                     
        return await CONFIG.sql.exec(query);
    }   
    
    async execQuery(query, params=[]) {
        return await CONFIG.sql.exec(query, params);
    }

    validateCategory(data) {

        if(!data.sid || data.sid < 1)
            return 'O identificador de Assunto da Categoria é inválido.';
        if(!data.title || data.title == '')
            return 'É necessário informar um título válido para a Categoria.';

        return '';
    }

    validateEventEntry(data) {

        if(!data.cid || data.cid < 1)
            return 'O identificador de Categoria da Entrada é inválido.';
        if(!data.iid || data.iid < 1)
            return 'O identificador de Importância da Entrada é inválido.';
        if(!data.cid || data.cid < 1)
            return 'O identificador de Categoria da Entrada é inválido.';
        if(!data.date.start)
            return 'Um evento histórico deve sempre informar uma data inicial.';
        if(data.date.start.year == 0)
            return 'Um evento histórico deve sempre informar uma data inicial. O ano informado é inválido.';
        if(data.date.start.month < 0)
            return 'Um evento histórico deve sempre informar uma data inicial. O mês informado é inválido.';
        if(!data.date.start.day || data.date.start.day < 1)
            return 'Um evento histórico deve sempre informar uma data inicial. O dia informado é inválido.';
        if(!data.title || data.title == '')
            return 'É necessário informar um título válido para a Entrada.';

        return '';
    }
}