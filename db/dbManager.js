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

    async deleteTable(tableName) {
        const query = `DROP TABLE ${tableName}`;
        return await CONFIG.sql.exec(query);
    }
    
    async getCalendars() {
        let query = 'SELECT * FROM calendars;';
        const rows = await CONFIG.sql.query(query);
        let params = [];

        const result = {};

        for(let row of rows) {
            const data = {
                clid: row.clid,
                label:row.label,
                months: [],
                days: [],
                daysInMonth: [],
            }

            query = 'SELECT clmid, label FROM calendarsMonths WHERE clid = ?;';
            params = [row.clid];
            const months = await CONFIG.sql.query(query, params);

            for(let month of months) {
                data.months.push(month.label);

                query = 'SELECT days FROM calendarsDaysInMonths WHERE clmid = ?;';
                params = [month.clmid];
                const dayMonths = await CONFIG.sql.query(query, params);
                data.daysInMonth.push(dayMonths[0].days);
            }

            query = 'SELECT label FROM calendarsDays WHERE clid = ?;';
            params = [row.clid];
            const days = await CONFIG.sql.query(query, params);

            for(let day of days) {
                data.days.push(day.label);
            }  

            result[data.clid] = data;
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

    async addCategory(data) {   
        let query = 'INSERT INTO category (sid, title, img, ext, htmlString, isDraft) VALUES (?,?,?,?,?,?);'; 
        const params = [];

        params.push(data.sid);
        params.push(data.title);
        params.push(data.img ?? null);
        params.push(data.ext ?? 'jpeg');
        params.push(data.htmlString);
        params.push(Number(data.isDraft));                
                    
        const result = await CONFIG.sql.exec(query, params);
        
        return result;
    }
    async updateCategory(data) {  
        
        const updateSet = this.buildUpdateSet([
            ['sid', data.sid],
            ['title', data.title],
            ['img', data.img],
            ['ext', data.ext],
            ['htmlString', data.htmlString],
            ['isDraft', Number(data.isDraft)]
        ]);

        let query = `UPDATE category SET ${updateSet} WHERE cid = ?`; 
        let params = [data.cid];
        const result = await CONFIG.sql.exec(query, params);
        
        return result;
    }
    async getCategory(cid) {
        let query = 'SELECT * FROM category WHERE cid = ?';
        const params = [cid];
        const rows = await CONFIG.sql.query(query, params);

        return rows;
    }
    async deleteCategory(cid) {
        let result = {};
        let query = 'DELETE FROM category WHERE cid = ?;';
        const params = [cid];

        result.categoryQuery = await CONFIG.sql.exec(query, params);

        query = 'DELETE FROM entry WHERE cid = ?;'
        result.entryQuery = await CONFIG.sql.exec(query, params);

        return result;
    }
    async getCategoryFromRoot(root) {
        let query = 'SELECT C.cid, C.title AS label FROM category AS C ' +
                    'INNER JOIN subjectType AS S ON S.sid = C.sid ' +
                    `WHERE S.root = ?`;
        const params = [root];
        const rows = await CONFIG.sql.query(query, params);

        return rows;
    }
    async getCategoriesFromSubject(sid) {
        let query = 'SELECT * FROM category AS C WHERE C.sid = ?;';
        const params = [sid];

        const rows = await CONFIG.sql.query(query, params);
        return rows;
    } 
    

    async getSubject(sid) {
        let query =  'SELECT * FROM subjectType AS S WHERE S.sid = ?';
        const params = [sid];

        const rows = await CONFIG.sql.query(query, params);

        return rows;
    }
    async getSubjectRoot(sid) {
        let query = 'SELECT S.title, S.root, R.icon FROM subjectType AS S ';
        query += 'INNER JOIN roots AS R ON S.root = R.root ';
        query += 'WHERE S.sid = ?;';
        const params = [sid];
        const rows = await CONFIG.sql.query(query, params);

        return rows;
    }
    async getAllSubjects(root='*') {
        let query = '';        
        if(root === '*') {
            query = 'SELECT * FROM subjectType AS S ORDER BY S.title;';
            return await CONFIG.sql.query(query);
        } else {
            const params = [root];
            query = 'SELECT C.cid, C.sid, C.title, C.img, C.htmlString, C.isDraft FROM category AS C ';
            query += 'INNER JOIN subjectType AS S ON S.sid = C.sid ';
            query += 'WHERE S.root = ? AND C.isDraft = 0 ORDER BY S.title;';            

            return await CONFIG.sql.query(query, params);
        }
    }       

    async addEntry(data) { 
        let query = 'INSERT INTO entry (etid, title, flavor, htmlString, isDraft, cid, img, ext) VALUES (?,?,?,?,?,?,?,?);'; 
        let params = [];

        params.push(data.etid);
        params.push(data.title);
        params.push(data.flavor);
        params.push(data.htmlString);
        params.push(Number(data.isDraft));
        params.push(data.cid); 
        params.push(data.img ?? null);
        params.push(data.ext ?? 'jpeg');  

        const result = await CONFIG.sql.exec(query, params);
        
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
            ['img', data.img],
            ['ext', data.ext]
        ]);

        let query = `UPDATE entry SET ${updateSet} WHERE eid = ?`; 
        let params = [data.eid];
        const result = await CONFIG.sql.exec(query, params);
        
        return result;
    }   
    async getEntry(eid) {
        let query = 'SELECT * FROM entry WHERE eid = ?;';
        const params = [eid];

        const rows = await CONFIG.sql.query(query, params);

        return rows;
    }
    async getAllEntriesAndTimelines() {
        let query = 'SELECT E.eid AS id, E.title, \'entrada\' AS type FROM entry AS E WHERE E.isDraft = 0';
        query += ' UNION ';
        query += 'SELECT T.tid AS id, T.title, \'timeline\' AS type FROM timeline AS T WHERE T.isDraft = 0'

        const rows = await CONFIG.sql.query(query);

        return rows;
    }
    async getAllEntries(withDraft=false) {
        const query = 'SELECT * FROM entry WHERE isDraft = ?;';
        const params = [Number(withDraft)];

        const rows = await CONFIG.sql.query(query, params);

        return rows;
    }
    async deleteEntry(eid) {
        let query = 'DELETE FROM entry WHERE eid = ?;';
        const params = [eid];
        const result = await CONFIG.sql.exec(query, params);

        return result;
    }    
    async getEntriesFromCategory(cid) {
        let query = 'SELECT * FROM entry AS E WHERE E.cid = ?;';
        const params = [cid];

        const rows = await CONFIG.sql.query(query, params);
        return rows;
    }

    async addEvent(data) { 
        let query = 'INSERT INTO event (eid, iid, clid, start_year, start_month, start_day, end_year, end_month, end_day, flavor) ';
        query += 'VALUES (?,?,?,?,?,?,?,?,?,?);'; 
        const params = [];

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

        const result = await CONFIG.sql.exec(query, params);
        
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
        const result = await CONFIG.sql.exec(query, params);
        
        return result;
    }
    async getEventOfEntry(eid) {
        let query = 'SELECT * FROM event WHERE eid = ?;';
        const params = [eid];

        const rows = await CONFIG.sql.query(query, params);

        return rows;
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

    validateAtlasEntry(data) {

        if(!data.cid || data.cid < 1)
            return 'O identificador de Categoria da Entrada é inválido.';        
        if(!data.cid || data.cid < 1)
            return 'O identificador de Categoria da Entrada é inválido.';        
        if(!data.title || data.title == '')
            return 'É necessário informar um título válido para a Entrada.';
        if(!data.img || data.img == '')
            return 'É necessário informar uma imagem válida para a Entrada de Atlas.';

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

    buildUpdateSet(columns) {
        return columns
          .filter(([label, value]) => label.trim() && value !== null && value !== undefined && value !== '') // Remove colunas ou valores vazios
          .map(([label, value]) => `${label} = '${value}'`) // Formata cada dupla
          .join(' , '); // Junta tudo com ' , '
    }

    buildWhereClause(conditions) {
        return conditions
          .filter(([column, value]) => column.trim() && value !== null && value !== undefined && value !== '') // Remove colunas ou valores vazios
          .map(([column, value]) => `${column} = '${value}'`) // Formata cada dupla
          .join(' AND '); // Junta tudo com ' AND '
    }
}