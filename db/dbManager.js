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

    async getSubjects(root='*') {
        let query = '';
        if(root === '*') {
            query = 'SELECT * FROM subjectType AS S ';
        } else {
            query = 'SELECT * FROM category AS C ' +
                    'INNER JOIN subjectType AS S ON S.sid = C.sid ' +
                    `WHERE S.root = ${root} `;
        }
        query += 'ORDER BY S.title';
        const rows = await CONFIG.sql.query(query);

        return rows;
    }

    async getSubjectsEntries(sid) {
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

    async addEntry(data) { 
        let query = `INSERT INTO entry (etid, title, flavor, htmlString, isDraft) VALUES (`; 
        query.concat(`${data.etid},`,
                    `'${data.title}',`,
                    `'${data.flavor}',`,
                    `'${data.htmlString}',`,
                    ` ${data.isDraft ? 1 : 0});`);         
        const result = await CONFIG.sql.exec(query);
        
        return result;
    }

    async getAllEntries(withDraft=false) {
        const query = 'SELECT * FROM entry' + (withDraft ? ' isDraft = 1' : '');
        const rows = await CONFIG.sql.query(query);

        return rows;
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
            return 'O valor do Assunto da Categoria é inválido.';
        if(!data.title || data.title == '')
            return 'É necessário informar um título válido para a Categoria.';

        return '';
    }
}