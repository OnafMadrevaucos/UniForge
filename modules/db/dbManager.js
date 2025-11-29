import path from 'path';
import Database from 'better-sqlite3';

export default class DBManager {
    constructor(path, options = {}) {
        this.#db = new Database(path, options);
    }

    #db = null;

    #state = {
        transactionStarted: false,
        results: [],
        changes: 0
    }

    get transactionStarted() {
        return this.#state.transactionStarted;
    }
    get result() {
        const results = this.#state.results;
        return results.last();
    }
    get results() {
        const results = this.#state.results;
        if (results.length > 0) {
            return this.#state.results;
        } else
            return null;
    }
    get totalCanges() {
        return this.#state.changes;
    }

    set transactionStarted(value) {
        this.#state.transactionStarted = value;
    }
    set results(value) {
        // Verifica se o valor passado é nulo ou indefinido.
        if (value === undefined || value === null) throw new Error('O valor passado não pode ser nulo ou indefinido.');

        // O valor é oriundo de uma query que realiza uma alteração no banco de dados (INSERT, UPDATE ou DELETE).
        if (!Array.isArray(value)) {
            if (!value.hasOwnProperty('changes') || !value.hasOwnProperty('lastInsertRowid'))
                throw new Error('O valor passado não é um resultado de execução de query.');
            else {
                // Adiciona o ID do último registro inserido ao resultado.
                value['addedId'] = value['lastInsertRowid'];
                this.#state.changes += value.changes;
            }
        }

        this.#state.results.push(value);
    }

    async init() {
        if (!this.#db) {
            console.error('UniForge | Nenhuma conexão com o banco de dados encontrada.');
        }

        try {
            await this.exec('ROLLBACK');
            console.log('UniForge | Transação aberta encerrada com sucesso.');
        } catch (error) {
            console.log('UniForge | Nenhuma transação aberta encontrada.');
        }

        this.#state = {
            transactionStarted: false,
            results: [],
            changes: 0
        }
    }

    async clear(doRollback = false) {
        // Cancela qualquer transação aberta indevidamente.
        if (doRollback) await this.exec('ROLLBACK');

        this.#state = {
            transactionStarted: false,
            results: [],
            changes: 0
        }
    }

    async beginTransaction() {
        try {
            if (!this.transactionStarted) {
                console.log('UniForge | Abrindo transação....');
                // Inicia uma nova transação.
                await this.exec('BEGIN TRANSACTION');
                // Registra o início da transação.
                this.transactionStarted = true;
            } else throw new Error('Há outra transação ainda aberta.');
        } catch (error) {
            console.error('UniForge | Não foi possível abrir a transação. ', error);
        }
    }

    async commitTransaction() {
        try {
            if (this.transactionStarted) {
                console.log('UniForge | Confirmando transação....');
                await this.exec('COMMIT');

                // Se a operação afetou alguma linha, atualiza base de dados.
                if (this.totalCanges > 0) this.rebuildDocs();

                this.transactionStarted = false;
            } else throw new Error('Nenhuma transação aberta encontrada.');
        } catch (error) {
            console.error('UniForge | Não foi possível confirmar a transação. ', error);
        }
    }

    async rollbackTransaction(motive = '') {
        if (this.transactionStarted) {
            console.log(`UniForge | A transação teve de ser revertida.${motive ? ` Motivo: ${motive}` : ''}.`);
            // Reverte a transação.
            await this.exec('ROLLBACK');
            // Reverte o estado do gerenciador do banco de dados para o padrão.
            await this.clear();
        } else console.warn('UniForge | Nenhuma transação aberta encontrada.');
    }

    /**
    * Executa um comando no banco de dados (INSERT, UPDATE, DELETE).
    * 
    * @param {string} query - O comando SQL a ser executado.
    * @param {Array} [params=[]] - Parâmetros opcionais para o comando.
    * @returns {Object} - Resultado da execução.
    * @throws {Error} - Caso ocorra algum erro no banco de dados.
    */
    async execute(query, params = []) {
        try {
            const statement = this.#db.prepare(query);
            const result = statement.run(...params); // Executa um comando (INSERT, UPDATE, DELETE)
            return result;
        } catch (err) {
            console.error('UniForge | Erro no banco de dados:', err.message);
            throw err;
        }
    }

    /**
     * Realiza uma consulta ao banco de dados.
     * 
     * @param {string} query - A consulta SQL a ser executada.
     * @param {Array} [params=[]] - Parâmetros opcionais para a consulta.
     * @returns {Array<Object>} - Resultado da consulta.
     * @throws {Error} - Caso ocorra algum erro no banco de dados.
    */
    async query(query, params = []) {
        try {
            const statement = this.#db.prepare(query);
            const result = statement.all(...params); // Executa a consulta e retorna todos os resultados
            return result;
        } catch (err) {
            console.error('UniForge | Erro no banco de dados:', err.message);
            throw err;
        }
    }

    /**
     * Gera um identificador único aleatório (UUID) em formato de string de 16 caracteres.
     * @returns {string} O UUID gerado.
     */
    generateID() {
        return uniforge.utils.randomID();
    }

    #buildUpdateSet(columns, updateOptions = {}) {
        const withNulls = updateOptions.withNulls || false;

        const updateSet = columns
            .filter(([label, value]) => label.trim() && (withNulls || value !== null && value !== undefined && value !== '')) // Remove colunas ou valores vazios
            .map(([label, value]) => {
                if (value === undefined || value === '') value = null;

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

    #buildWhereClause(conditions) {
        const whereClause = conditions
            .filter(([column, value]) => column.trim() && value !== null && value !== undefined && value !== '') // Remove colunas ou valores vazios
            .map(([column, value]) => `${column} = ${typeof value === 'string' ? `'${value}'` : value}`) // Formata cada dupla
            .join(' AND '); // Junta tudo com ' AND '
        return whereClause;
    }

    #procedures = {
        create: {
            /**
             * Cria a tabela 'tome' no banco de dados.
             * 
             * Essa tabela é usada para armazenar informações sobre os Tomos.
             * 
             * @returns {Promise<void>} Uma promessa que informa se a tabela foi criada com sucesso.
            */
            tome: async function (title, icon) {
                const query = 'CREATE TABLE IF NOT EXISTS `tome` (' +
                    '`title` VARCHAR(16) NOT NULL,' + // Identificador do Tomo.
                    '`label` TEXT NOT NULL,' + // Label do Tomo.
                    '`icon` VARCHAR(255) NOT NULL,' + // Ícone do Tomo.
                    'PRIMARY KEY (`title`))';

                this.results = await this.execute(query);
                console.log('Tabela \'tome\' criada....OK.');

                return this.result;
            },
            /**
             * Cria a tabela 'chapter' no banco de dados.
             * 
             * Essa tabela é usada para armazenar informações sobre os Capítulos.
             * 
             * @returns {Promise<void>} Uma promessa que informa se a tabela foi criada com sucesso.
            */
            chapter: async function (title, tome, content) {
                const query = 'CREATE TABLE IF NOT EXISTS `chapter` (' +
                    '`cid` VARCHAR(16) NOT NULL,' +                 // Identificador do Capítulo.
                    '`tome` VARCHAR(16) NOT NULL,' +                // Identificador do Tomo a que o Capítulo pertence.
                    '`title` TEXT NOT NULL,' +                      // Título do Capítulo.
                    '`icon` VARCHAR(255) NOT NULL,' +               // Ícone do Capítulo.
                    '`type` INTEGER NOT NULL,' +                    // Tipo do Capítulo (material, imaterial, linhagem).
                    '`hasLineage` BOOLEAN DEFAULT 0 NOT NULL,' +    // Representa uma linhagem (padrão 'false').
                    'PRIMARY KEY (`cid`))';

                this.results = await this.execute(query);
                console.log('Tabela \'chapter\' criada....OK.');

                return this.result;
            },
            chapterTypes: async () => {
                let query = 'SELECT * FROM chapterType';
                this.results = await this.query(query);
                return this.result.map(row => ({
                    _id: row.ctid,
                    _label: row.title,
                    ...row
                }));
            },
            /**
             * Cria a tabela 'section' no banco de dados.
             * 
             * Essa tabela é usada para armazenar informações sobre as Seções.
             * 
             * @returns {Promise<void>} Uma promessa que informa se a tabela foi criada com sucesso.
             */
            sections: async () => {
                const query = 'CREATE TABLE IF NOT EXISTS `section` (' +
                    '`sid` VARCHAR(16) NOT NULL,' +             // Identificador da Seção.
                    '`cid` VARCHAR(16) NOT NULL,' +             // Identificador do Capítulo a que a Seção pertence.
                    '`title` TEXT NOT NULL,' +                  // Título da Seção.
                    '`htmlString` TEXT NULL,' +                 // Corpo do texto de descrição da Seção.
                    '`isDraft` BOOLEAN NOT NULL DEFAULT 0,' +   // A Seção é um rascunho (falso por padrão).
                    'PRIMARY KEY (`sid`,`cid`))';

                this.results = await this.execute(query);
                console.log('Tabela \'section\' criada....OK.');

                return this.result;
            },
            /**
             * Cria a tabela 'entry' no banco de dados.
             * 
             * Essa tabela é usada para armazenar informações sobre as Entradas.
             * 
             * @returns {Promise<void>} Uma promessa que informa se a tabela foi criada com sucesso.
             */
            entries: async () => {
                const query = 'CREATE TABLE IF NOT EXISTS `entry` (' +
                    '`eid` VARCHAR(16) NOT NULL,' +             // Identificador da Entrada.
                    '`sid` VARCHAR(16) NOT NULL,' +             // Identificador da Seção a que a Entrada pertence.
                    '`etid` INTEGER NOT NULL DEFAULT 1,' +      // Tipo de Entrada.
                    '`title` TEXT NOT NULL,' +                  // Título da Entrada.
                    '`flavor` TEXT NULL,' +                     // Texto de floreio da Entrada.
                    '`htmlString` TEXT NULL,' +                 // Corpo do texto de descrição da Entrada.
                    '`img` BLOB NULL,' +                        // BLOB da imagem da Entrada.
                    '`ext` VARCHAR(5) NULL,' +                  // Extensão original do arquivo da imagem da Entrada.
                    '`isDraft` BOOLEAN NOT NULL DEFAULT 0,' +   // A Entrada é um rascunho (falso por padrão).
                    'PRIMARY KEY (`eid`,`sid`))';

                this.results = await this.execute(query);
                console.log('Tabela \'entry\' criada....OK.');

                return this.result;
            },
            /**
             * Cria a tabela 'entryType' no banco de dados.
             * 
             * Essa tabela é usada para armazenar informações sobre os Tipos de Entrada.
             * Primeiro, remove a tabela existente caso ela exista, e então cria uma nova tabela.
             * 
             * @returns {Promise<Object>} Uma promessa que informa as alterações realizadas no banco de dados.
            */
            entryTypes: async () => {
                let query = 'CREATE TABLE IF NOT EXISTS `entryType` (' +
                    '`etid` INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,' +  // Identificador dos Tipos de Entrada.        
                    '`title` TEXT NOT NULL,' +                              // Título do Tipo de Entrada.
                    '`icon` VARCHAR(255) NULL,' +                           // Ícone do Tipo de Entrada.
                    '`isMaterial` BOOLEAN NOT NULL DEFAULT 1,' +            // A Seção é material (true por padrão).
                    '`isEntity` BOOLEAN NOT NULL DEFAULT 0,' +              // A Seção é entidade (false por padrão).
                    'UNIQUE (`etid`))';

                this.results = await this.execute(query);
                console.log('Tabela \'entryType\' criada....OK.');

                return this.result;
            },
            /**
             * Cria a tabela 'event' no banco de dados.
             * 
             * Essa tabela é usada para armazenar informações sobre os Eventos.
             * 
             * @returns {Promise<void>} Uma promessa que informa se a tabela foi criada com sucesso.
             */
            events: async () => {
                const query = 'CREATE TABLE IF NOT EXISTS `event` (' +
                    '`evid` VARCHAR(16) NOT NULL,' +                // Identificador do Evento.
                    '`sid` VARCHAR(16) NOT NULL,' +                 // Identificador da Seção a que o Evento pertence.
                    '`etid` INTEGER NOT NULL DEFAULT 1,' +          // Tipo de Evento.        
                    '`title` TEXT NOT NULL,' +                      // Título do Evento.
                    '`flavor` TEXT NULL,' +                         // Texto de floreio do Evento. 
                    '`relevance` INTEGER NOT NULL DEFAULT 1,' +     // Relevância da Evento.       
                    '`source` VARCHAR(16) NULL,' +                  // Entrada fonte do Evento.
                    '`clid` INTEGER NOT NULL DEFAULT 1,' +          // Tipo do Calendário.
                    '`s_day` INTEGER NOT NULL DEFAULT 1,' +         // Dia de Início do Evento.
                    '`s_month` INTEGER NOT NULL DEFAULT 1,' +       // Mês de Início do Evento.
                    '`s_year` INTEGER NOT NULL DEFAULT 1,' +        // Ano de Início do Evento.
                    '`e_day` INTEGER NULL,' +                       // Dia de Final do Evento.
                    '`e_month` INTEGER NULL,' +                     // Mês de Final do Evento.
                    '`e_year` INTEGER NULL,' +                      // Ano de Final do Evento.
                    '`isDraft` BOOLEAN NOT NULL DEFAULT 0,' +       // O Evento é um rascunho (falso por padrão).
                    'PRIMARY KEY (`evid`,`sid`))';

                this.results = await this.execute(query);
                console.log('Tabela \'event\' criada....OK.');

                return this.result;
            },
            /**
             * Cria a tabela 'lineageTree' no banco de dados.
             * 
             * Essa tabela é usada para armazenar informações sobre as Linhagens.
             * 
             * @returns {Promise<void>} Uma promessa que informa se a tabela foi criada com sucesso.
            */
            lineages: async () => {
                const query = 'CREATE TABLE IF NOT EXISTS `lineageTree` (' +
                    '`ltid` VARCHAR(16) NOT NULL,' +            // Identificador da Linhagem.
                    '`eid` VARCHAR(16) NOT NULL,' +             // Identificador da Entrada Fundadora da Linhagem.
                    '`title` TEXT NOT NULL,' +                  // Título da Árvore.
                    '`tree` TEXT NOT NULL,' +                   // Árvore da Linhagem (Utilizado o formato 'FamilyScript').        
                    '`isDraft` BOOLEAN NULL DEFAULT 0,' +   // A linhagem é um rascunho (falso por padrão).
                    'PRIMARY KEY (`ltid`,`eid`))';

                this.results = await this.execute(query);
                console.log('Tabela \'lineageTree\' criada....OK.');

                return this.result;
            },
            /**
             * Cria a tabela 'lineageType' no banco de dados.
             * 
             * Essa tabela é usada para armazenar tipos de entradas de uma Linhagem.
             * Cada tipo de linhagem é identificado por um identificador único combinado da Linhagem (ltid)
             * com a tag do Tipo.
             * 
             * @returns {Promise<void>} Uma promessa que informa se a tabela foi criada com sucesso.
            */
            lineageTypes: async () => {
                const query = 'CREATE TABLE IF NOT EXISTS `lineageType` (' +
                    '`ltid` VARCHAR(16) NOT NULL,' +            // Identificador da Linhagem.
                    '`tag` VARCHAR(5) NOT NULL,' +              // Identificador da Seção a que a Linhagem pertence.
                    '`label` VARCHAR(255) NOT NULL,' +          // Fundador da Linhagem (Identificador daprimeira Primeira da linhagem).        
                    'PRIMARY KEY (`tag`))';

                this.results = await this.execute(query);
                console.log('Tabela \'lineageType\' criada....OK.');

                return this.result;
            },
            /**
             * Cria a tabela de vínculo '_lineageTreeEntries' no banco de dados.
             * 
             * Essa tabela é usada para armazenar as Entradas vinculadas a uma Árvore de Linhagem.
             * 
             * @returns {Promise<void>} Uma promessa que informa se a tabela foi criada com sucesso.
            */
            lineageEntries: async () => {
                const query = 'CREATE TABLE IF NOT EXISTS `_lineageTreeEntries` (' +
                    '`ltid` VARCHAR(16) NOT NULL,' +            // Identificador da Linhagem.
                    '`eid` VARCHAR(16) NOT NULL,' +             // Identificador da Entrada Fundadora da Linhagem.
                    '`code` VARCHAR(5) NOT NULL,' +             // Identificador da Entrada dentro da Árvore.
                    '`isRoot` BOOLEAN NOT NULL DEFAULT 0,'      // É a Entrada Fundadora da Linhagem.
                '`isVirtual` BOOLEAN NOT NULL DEFAULT 0,'      // A Entrada é virtual? (Existe apenas para dar sentido à Linhagem).
                'PRIMARY KEY (`ltid`,`eid`))';

                this.results = await this.execute(query);
                console.log('Tabela \'_lineageTreeEntries\' criada....OK.');

                return this.result;
            },
            maps: async () => {
                const query = 'CREATE TABLE IF NOT EXISTS `map` (' +
                    '`mid` VARCHAR(16) NOT NULL,' +             // Identificador do mapa.
                    '`sid` VARCHAR(16) NOT NULL,' +             // Identificador da Seção a que o mapa pertence.
                    '`title` TEXT NOT NULL,' +                  // Título do mapa.
                    '`flavor` TEXT NULL,' +                     // Texto de descrição do mapa.
                    '`img` BLOB NULL,' +                        // BLOB da imagem do mapa.
                    '`ext` VARCHAR(5) NULL,' +                  // Extensão original do arquivo do mapa.
                    '`isDraft` BOOLEAN NOT NULL DEFAULT 0,' +   // O mapa é um rascunho (falso por padrão).
                    'PRIMARY KEY (`mid`))';

                this.results = await this.execute(query);
                console.log('Tabela \'map\' criada....OK.');

                return this.result;
            },
            mapElements: async () => {
                const query = 'CREATE TABLE IF NOT EXISTS `mapElements` (' +
                    '`meid` VARCHAR(16) NOT NULL,' +             // Identificador do elemento do mapa.
                    '`mid` VARCHAR(16) NOT NULL,' +              // Identificador do mapa ao qual o elemento pertence.
                    '`epoch` INT NOT NULL,' +                    // Época do elemento do mapa.
                    '`type` varchar(16) NOT NULL,' +             // Tipo do elemento do mapa.
                    '`icon` varchar(16) NOT NULL,' +             // Ícone do elemento do mapa.
                    '`source` VARCHAR(100) NULL,' +              // Fonte do elemento do mapa, se houver ('sourceType{uuid}').
                    '`points` TEXT NOT NULL,' +                  // Pontos do elemento do mapa.
                    'PRIMARY KEY (`meid`))';

                this.results = await this.execute(query);
                console.log('Tabela \'mapElements\' criada....OK.');

                return this.result;
            },
            /**
             * Cria a tabela 'timeline' no banco de dados.
             * 
             * Essa tabela é usada para armazenar informações sobre as Linhas do Tempo.
             * Cada linha do tempo é identificada por um identificador único (tid), 
             * possui um título, uma descrição adicional (flavor), e um indicador 
             * de rascunho.
             * 
             * @returns {Promise<void>} Uma promessa que informa se a tabela foi criada com sucesso.
            */
            timelines: async () => {
                const query = 'CREATE TABLE IF NOT EXISTS `timeline` (' +
                    '`tid` VARCHAR(16) NOT NULL,' +             // Identificador da Linha do Tempo.        
                    '`title` TEXT NOT NULL,' +                  // Título da Linha do Tempo.        
                    '`flavor` TEXT NOT NULL,' +                 // Descrição adicional da Linha do Tempo.          
                    'PRIMARY KEY (`tid`))';

                this.results = await this.execute(query);
                console.log('Tabela \'timeline\' criada....OK.');

                return this.result;
            },
            /**
             * Cria a tabela '_timelineEvent' no banco de dados.
             *
             * Essa tabela é usada para armazenar a relação entre Linhas do Tempo e Eventos.
             * Cada registro associa um identificador de Linha do Tempo (tid) a um identificador de Evento (evid).
             *
             * @returns {Promise<void>} Uma promessa que informa se a tabela foi criada com sucesso.
             */
            timelineEvents: async () => {
                const query = 'CREATE TABLE IF NOT EXISTS `_timelineEvent` (' +
                    '`tid` VARCHAR(16) NOT NULL,' +             // Identificador da Linha do Tempo.
                    '`evid` VARCHAR(16) NOT NULL,' +            // Identificador do Evento.
                    'PRIMARY KEY (`tid`, `evid`))';

                this.results = await this.execute(query);
                console.log('Tabela \'_timelineEvent\' criada....OK.');

                return this.result;
            },
            /**
             * Cria a tabela 'calendars' no banco de dados.
             * 
             * Essa tabela é usada para armazenar informações sobre os calendários.
             * Cada calendário é identificado por um título (label) e um identificador (clid).
             * 
             * @returns {Promise<Object>} Uma promessa que informa se a tabela foi criada com sucesso, com o número de alterações.
             */
            calendars: async () => {
                let query = 'CREATE TABLE IF NOT EXISTS calendars (clid INTEGER PRIMARY KEY,' +
                    'label TEXT)';                 // Título do calendário

                this.results = await this.execute(query);
                console.log('Tabela \'calendar\' criada....OK.');

                return this.result;
            },
            /**
             * Cria a tabela 'calendarsMonths' no banco de dados.
             * 
             * Essa tabela é usada para armazenar informações sobre os meses dos calendários.
             * Cada mês é identificado por um título (label) e o identificador do calendário ao qual pertence (clid).
             * 
             * @returns {Promise<Object>} Uma promessa que informa se a tabela foi criada com sucesso, com o número de alterações.
             */
            months: async () => {
                let query = 'CREATE TABLE IF NOT EXISTS calendarsMonths (clmid INTEGER PRIMARY KEY,' +
                    'clid INTEGER,' +
                    'label TEXT)';                 // Título do MÊS do calendário


                this.results = await this.execute(query);
                console.log('Tabela \'calendarsMonths\' criada....OK.');

                return this.result;
            },
            /**
             * Cria a tabela 'calendarsDays' no banco de dados.
             * 
             * Essa tabela é usada para armazenar informações sobre os dias dos calendários.
             * Cada dia é identificado por um título (label) e o identificador do calendário ao qual pertence (clid).
             * 
             * @returns {Promise<Object>} Uma promessa que informa se a tabela foi criada com sucesso, com o número de alterações.
             */
            days: async () => {
                let query = 'CREATE TABLE IF NOT EXISTS calendarsDays (cldid INTEGER PRIMARY KEY,' +
                    'clid INTEGER,' +
                    'label TEXT)';                 // Título do DIAS do calendário

                this.results = await this.execute(query);
                console.log('Tabela \'calendarsDays\' criada....OK.');

                return this.result;
            },
            /**
             * Cria a tabela 'calendarsDaysInMonths' no banco de dados.
             * 
             * Essa tabela é usada para armazenar informações sobre os dias por mês dos calendários.
             * Cada registro é identificado por um identificador (cldmid) e o identificador do mês ao qual pertence (clmid).
             * O número de dias por mês é armazenado na coluna 'days'.
             * 
             * @returns {Promise<Object>} Uma promessa que informa se a tabela foi criada com sucesso, com o número de alterações.
             */
            daysInMonth: async () => {
                let query = 'CREATE TABLE IF NOT EXISTS calendarsDaysInMonths (cldmid INTEGER PRIMARY KEY,' +
                    'clmid INTEGER,' +
                    'days INTEGER)';                // Número de DIAS por MÊS do calendário

                this.results = await this.execute(query);
                console.log('Tabela \'calendarsDaysInMonths\' criada....OK.');

                return this.result;
            },
            /**
             * Cria a tabela '_textImages' no banco de dados.
             * 
             * Essa tabela é usada para armazenar imagens dos textos de cada Entrada e Seção.
             * Cada registro associa um identificador único (uuid) a uma imagem binária (BLOB) e a sua extensão.
             * 
             * @returns {Promise<void>} Uma promessa que informa se a tabela foi criada com sucesso.
             */
            textImages: async () => {
                const query = 'CREATE TABLE IF NOT EXISTS `_textImages` (' +
                    '`uuid` VARCHAR(16) NOT NULL,' +                // Identificador da Linhagem.        
                    '`raw` BLOB NOT NULL,' +                        // Árvore da Linhagem (Utilizado o formato 'FamilyScript').        
                    '`ext` VARCHAR(5) NOT NULL DEFAULT `jpeg`,' +   // A linhagem é um rascunho (falso por padrão).
                    'PRIMARY KEY (`uuid`))';

                this.results = await this.execute(query);
                console.log('Tabela \'_textImages\' criada....OK.');

                return this.result;
            },
            /**
             * Cria a tabela 'relevance' no banco de dados.
             * 
             * Essa tabela é usada para armazenar informações sobre a relevância de um evento de uma Timeline.
             * Primeiro, remove a tabela existente caso ela exista, e então cria uma nova tabela.
             * 
             * @returns {Promise<Object>} Uma promessa que informa as alterações realizadas no banco de dados.
            */
            relevances: async () => {
                let query = 'CREATE TABLE IF NOT EXISTS `relevance` (' +
                    '`rid` INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,' +   // Identificador da Relevância.        
                    '`title` VARCHAR(255) NULL,' +                          // Título da Relevância.        
                    'UNIQUE (`rid`))';

                this.results = await this.execute(query);
                console.log('Tabela \'relevance\' criada....OK.');

                return this.result;
            },

            /**
             * Cria a tabela 'settings' no banco de dados.
             * 
             * Essa tabela é usada para armazenar configurações do sistema.
             * Cada configuração é identificada por um nome (tag) e pelo grupo ao qual pertence.
             * O valor da configuração é armazenado na coluna 'value'.
             * 
             * @returns {Promise<Object>} Uma promessa que informa se a tabela foi criada com sucesso, com o número de alterações.
             */
            settings: async () => {
                let query = 'CREATE TABLE IF NOT EXISTS settings (tag VARCHAR(50) PRIMARY KEY NOT NULL,' +
                    '\"group\" VARCHAR(50) NOT NULL,' +     // Grupo de configuração
                    'value TEXT NOT NULL)';             // Valor da configuração

                this.results = await this.execute(query);
                console.log('Tabela \'settings\' criada....OK.');

                return this.result;
            }
        },
        select: {
            /**
             * Recupera todas as tabelas do banco de dados.
             * @return {Promise<Array<Object>>} Retorna um array de objetos com as informações de cada tabela.
             * @property {string} name      - Nome da tabela.
            */
            tables: async () => {
                const query = 'SELECT name FROM sqlite_master WHERE type=\'table\' ORDER BY name';
                const rows = await this.query(query);

                return rows;
            },
            /**
             * Recupera todos os Tomos.
             * @return {Promise<Array<Object>>} Retorna um array de objetos com as informações de cada Tomo.
             * @property {string} title     - Título / Identificador do Tomo.
             * @property {string} icon      - Ícone do Tomo.
            */
            tomes: async () => {
                const query = 'SELECT * FROM tome';
                this.results = this.query(query);
                return this.result.map(row => ({
                    _id: row.title,
                    ...row
                }));
            },
            /**
             * Recupera todos os Capítulos.
             * @return {Promise<Array<Object>>} Retorna um array de objetos com as informações de cada Capítulo.
             * @property {string} _id       - ID do Capítulo.
             * @property {string} _label    - Título do Capítulo.
             * @property {string} cid       - ID do Capítulo.
             * @property {string} tome      - ID do Tomo a qual o Capítulo pertence.
             * @property {string} title     - Título do Capítulo.
             * @property {string} icon      - Ícone do Capítulo.
             * @property {number} type      - Tipo do Capítulo.
            */
            chapters: async () => {
                const query = 'SELECT * FROM chapter ORDER BY title';
                this.results = await this.query(query);
                return this.result.map(row => ({
                    _id: row.cid,
                    _label: row.title,
                    ...row
                }));
            },
            /**
             * Recupera todos os Tipos de Capítulos.
             * @return {Promise<Array<Object>>} Retorna um array de objetos com as informações de cada Tipo de Capítulo.
             * @property {string} _id           - ID do Tipo de Capítulo.
             * @property {string} _label        - Título do Tipo de Capítulo.
             * @property {string} ctid           - ID do Tipo de Capítulo.
             * @property {string} title         - Título do Tipo de Capítulo.
             * @property {string} icon          - Ícone do Tipo de Capítulo.
            */
            chapterTypes: async () => {
                let query = 'SELECT * FROM chapterType';
                this.results = await this.query(query);
                return this.result.map(row => ({
                    _id: row.ctid,
                    _label: row.title,
                    ...row
                }));
            },
            /**
             * Recupera todas as Seções.
             * @return {Promise<Array<Object>>} Retorna um array de objetos com as informações de cada Seções.
             * @property {string} _id           - ID da Seção.
             * @property {string} _label        - Título da Seção.
             * @property {string} sid           - ID da Seção.
             * @property {string} cid           - ID do Capítulo a qual a Seção pertence.
             * @property {string} title         - Título da Seção.
             * @property {string} htmlString    - Conteúdo HTML da Seção.
             * @property {boolean} isDraft      - Seção é rascunho? (false por padrão).
            */
            sections: async () => {
                const query = 'SELECT * FROM section';
                this.results = await this.query(query);
                return this.result.map(row => ({
                    _id: row.sid,
                    _label: row.title,
                    ...row
                }));
            },
            /**
             * Recupera todas as Entradas.
             * @return {Promise<Array<Object>>} Retorna um array de objetos com as informações de cada Entrada.
             * @property {string} _id           - ID da Entrada.
             * @property {string} _label        - Título da Entrada.
             * @property {string} eid           - ID da Entrada.
             * @property {string} sid           - ID da Seção a qual a Entrada pertence.
             * @property {number} etid          - Tipo da Entrada (EntryType).
             * @property {string} title         - Título da Entrada.
             * @property {string} flavor        - Descrição adicional da Entrada.
             * @property {string} htmlString    - Conteúdo HTML da Entrada.
             * @property {blob} img             - Dados em BLOB do arquivo de imagem da Entrada.
             * @property {string} ext           - Extensão do arquivo de imagem da Entrada.
             * @property {boolean} isDraft      - Entrada é rascunho? (false por padrão).
            */
            entries: async () => {
                const query = 'SELECT * FROM entry';
                this.results = await this.query(query);
                return this.result.map(row => ({
                    _id: row.eid,
                    _label: row.title,
                    ...row
                }));
            },
            /**
             * Recupera todos os Tipos de Entrada.
             * @return {Promise<Array<Object>>} Retorna um array de objetos com as informações de cada Tipo de Entrada.
             * @property {string} _id           - ID do Tipo de Entrada.
             * @property {string} _label        - Título do Tipo de Entrada.
             * @property {string} etid          - ID do Tipo de Entrada.
             * @property {string} title         - Título do Tipo de Entrada.
            */
            entryTypes: async () => {
                const query = 'SELECT * FROM entryType';
                this.results = await this.query(query);
                return this.result.map(row => ({
                    _id: row.etid,
                    _label: row.title,
                    ...row
                }));
            },
            /**
             * Recupera todos os Eventos.
             * @return {Promise<Array<Object>>} Retorna um array de objetos com as informações de cada Evento.
             * @property {string} _id           - ID do Evento.
             * @property {string} evid          - ID do Evento.
             * @property {string} sid           - ID da Seção a qual o Evento pertence.
             * @property {number} etid          - Tipo do Evento (EntryType).
             * @property {string} title         - Título do Evento.
             * @property {string} flavor        - Descrição adicional do Evento.     
             * @property {number} relevance     - Relevância do Evento.
             * @property {string} source        - ID da Entrada que serve de fonte para o Evento.
             * @property {string} s_day         - Data de início do Evento.
             * @property {string} s_month       - Data de início do Evento.
             * @property {string} s_year        - Data de início do Evento.
             * @property {string} e_day         - Data de término do Evento.
             * @property {string} e_month       - Data de término do Evento.
             * @property {string} e_year        - Data de término do Evento.     
             * @property {boolean} isDraft      - Evento é rascunho? (false por padrão).
            */
            events: async () => {
                const query = 'SELECT * FROM event';
                this.results = await this.query(query);
                return this.result.map(row => ({
                    _id: row.evid,
                    _label: row.title,
                    ...row
                }));
            },
            /**
             * Recupera todas as árvores de linhagem.
             * @return {Promise<Array<Object>>} Retorna um array de objetos com as informações de cada Árvore de Linhagem.
             * @property {string} _id           - ID da Árvore de Linhagem.
             * @property {string} ltid          - ID da Árvore de Linhagem.
             * @property {string} sid           - ID da Seção a qual a Árvore de Linhagem pertence.
             * @property {string} founder       - ID da Entrada que serve de fundador para a Árvore de Linhagem.
             * @property {string} tree          - String contendo a estrutura da Árvore de Linhagem em FamilyScript.
             * @property {boolean} isDraft      - A Árvore de Linhagem é rascunho? (false por padrão).
            */
            lineages: async () => {
                const query = 'SELECT * FROM lineageTree';
                this.results = await this.query(query);
                return this.result.map(row => ({
                    _id: row.ltid,
                    _label: row.title,
                    ...row
                }));
            },
            /**
             * Recupera todos os tipos de Árvore de Linhagem.
             * @param {string} ltid - ID da Árvore de Linhagem.
             * @return {Promise<Array<Object>>} Retorna um array de objetos com as informações de cada tipo de Árvore de Linhagem.
             * @property {string} _id           - ID do tipo de Árvore de Linhagem.
             * @property {string} _label        - Rótulo do tipo de Árvore de Linhagem.
             * @property {string} ltid          - ID da Árvore de Linhagem.
             * @property {string} tag           - Tag do tipo de Árvore de Linhagem.
             * @property {string} label         - Rótulo do tipo de Árvore de Linhagem.
            */
            lineageTypes: async () => {
                const query = 'SELECT * FROM lineageType';
                this.results = await this.query(query);
                return this.result.map(row => ({
                    _id: row.tag,
                    _label: row.label,
                    ...row
                }));
            },
            /**
             * Recupera todas as entradas de uma árvore de linhagem.
             * @return {Promise<Array<Object>>} Retorna um array de objetos com as informações de cada Árvore de Linhagem.
             * @property {string} ltid           - ID da Árvore de Linhagem.
             * @property {string} eid            - ID da Entrada.
             * @property {string} code           - Identificador do FamilyScript da Entrada na Árvore de Linhagem.
             * @property {string} isRoot         - A entrada é a Raíz da Árvore de Linhagem? (false por padrão)
             * @property {string} isVirtual      - A entrada é uma entrada virtual, que não possui uma Entrada no UniForge? (false por padrão)
            */
            lineageEntries: async () => {
                const query = 'SELECT * FROM _lineageTreeEntries';
                this.results = await this.query(query);
                return this.result.map(row => ({
                    _label: row.title,
                    ...row
                }));
            },
            /**
             * Recupera todos os mapas.
             * @return {Promise<Array<Object>>} Retorna um array de objetos com as informações de cada mapa.
             * @property {string} _id           - ID do mapa.
             * @property {string} _label        - Título do mapa.
             * @property {string} mid           - ID do mapa.
             * @property {string} sid           - ID da Seção a qual o mapa pertence.
             * @property {string} title         - Título do mapa.
             * @property {string} flavor        - Texto de descri o ou sabor do mapa.
             * @property {string|Buffer} img    - Dados bin rios da imagem associada.
             * @property {string} ext           - Extens o da imagem.
             * @property {boolean} isDraft      - O mapa é um rascunho? (false por padrão).
            */
            maps: async () => {
                const query = 'SELECT * FROM map';
                this.results = await this.query(query);
                return this.result.map(row => ({
                    _id: row.mid,
                    _label: row.title,
                    ...row
                }));
            },
            /**
             * Recupera todos os Elementos do Mapa.
             * @return {Promise<Array<Object>>} Retorna um array de objetos com as informações de cada Elemento do Mapa.
             * @property {string} _id           - ID do Elemento do Mapa.
             * @property {string} _label        - Rótulo do Elemento do Mapa.
             * @property {string} meid          - ID do Elemento do Mapa.
             * @property {string} mid           - ID do Mapa a qual o Elemento faz parte.
             * @property {number} epoch         - Época do Elemento do Mapa.
             * @property {string} type          - Tipo do Elemento do Mapa.
             * @property {string} icon          - Ícone do Elemento do Mapa.
             * @property {string} source        - Entrada de Origem do Elemento do Mapa, se houver (sourceType.uuid).
             * @property {string} points         - Coordenadas do Elemento do Mapa.
            */
            mapElements: async () => {
                const query = 'SELECT * FROM mapElements';
                this.results = await this.query(query);
                return this.result.map(row => ({
                    _id: row.meid,
                    _label: row.label,
                    ...row
                }));
            },
            /**
             * Recupera todas as Linhas do Tempo.
             * @return {Promise<Array<Object>>} Retorna um array de objetos com as informações de cada Linha do Tempo.
             * @property {string} _id           - ID da Linha do Tempo.
             * @property {string} _label        - Título da Linha do Tempo.
             * @property {string} tid           - ID da Linha do Tempo.
             * @property {string} title         - Título da Linha do Tempo.
             * @property {string} flavor        - Descrição adicional da Linha do Tempo.
             * @property {boolean} isDraft      - Linha do Tempo é rascunho? (false por padrão).
            */
            timelines: async () => {
                const query = 'SELECT * FROM timeline';
                this.results = await this.query(query);
                return this.result.map(row => ({
                    _id: row.tid,
                    _label: row.title,
                    ...row
                }));
            },
            /**
             * Recupera todas os Eventos associados a uma Linhas do Tempo.
             * @return {Promise<Array<Object>>} Retorna um array de objetos com as informações de cada Linha do Tempo.
             * @property {string} tid           - ID da Linha do Tempo.
             * @property {string} evid         - ID do Evento da Linha do Tempo.
            */
            timelineEvents: async () => {
                const query = 'SELECT * FROM _timelineEvent';
                this.results = await this.query(query);
                return this.result;
            },
            /**
             * Recupera todas as calendárias.
             * @return {Promise<Array<Object>>} Retorna um array de objetos com as informações de cada calendária.
             * @property {string} _id           - ID da calendária.
             * @property {string} _label        - Título da calendária.
             * @property {string} clid          - ID da calendária.
             * @property {string} label         - Título da calendária.
            */
            calendars: async () => {
                const query = 'SELECT * FROM calendars';
                this.results = await this.query(query);
                return this.result.map(row => ({
                    _id: Number(row.clid),
                    _label: row.label,
                    ...row
                }));
            },
            /**
             * Recupera todas os meses dos calendários.
             * @return {Promise<Array<Object>>} Retorna um array de objetos com as informações de cada calendária de mês.
             * @property {string} _id           - ID do mês de um calendário.
             * @property {string} _label        - Título do mês de um calendário.
             * @property {string} clmid         - ID do mês de um calendário.
             * @property {string} label         - Título do mês de um calendário.
             */
            months: async () => {
                const query = 'SELECT * FROM calendarsMonths';
                this.results = await this.query(query);
                return this.result.map(row => ({
                    _id: row.clmid,
                    _label: row.label,
                    ...row
                }));
            },
            /**
             * Recupera todos os dias da semana de um calendários.
             * @return {Promise<Array<Object>>} Retorna um array de objetos com as informações de cada calendário de dias.
             * @property {string} _id           - ID dos dias de um calendário de dias.
             * @property {string} _label        - Título dos dias de um calendário.
             * @property {string} clid          - ID dos dias de um calendário de dias.
             * @property {string} label         - Título dos dias de um calendário.
             */
            days: async () => {
                const query = 'SELECT * FROM calendarsDays';
                this.results = await this.query(query);
                return this.result.map(row => ({
                    _id: row.cldid,
                    _label: row.label,
                    ...row
                }));
            },
            /**
             * Recupera a quantidade de dias de um mês de um calendário.
             * @return {Promise<Array<Object>>} Retorna um array de objetos com as informações de cada calendário de dias de um mês.
             * @property {string} _id           - ID dos dias de um calendário de dias de um mês.
             * @property {string} _label        - Título dos dias de um calendário de dias de um mês.
             * @property {string} cldmid        - ID dos dias de um calendário de dias de um mês.
             * @property {string} label         - Título dos dias de um calendário de dias de um mês.
             */
            daysInMonth: async () => {
                const query = 'SELECT * FROM calendarsDaysInMonths';
                this.results = await this.query(query);
                return this.result.map(row => ({
                    _id: row.cldmid,
                    ...row
                }));
            },
            /**
             * Retorna todas as imagens associadas a um uuid da tabela `_textImages`.
             * @return {Promise<Array<Object>>} Retorna um array de objetos com as informações de cada imagem.
             * @property {string} _id           - ID da imagem.
             * @property {string} uuid          - ID da imagem.
             * @property {blob} raw          - Dados em BLOB da imagem.
             * @property {string} ext           - Extens o da imagem.
             */
            textImages: async () => {
                const query = 'SELECT * FROM _textImages';
                this.results = await this.query(query);
                return this.result.map(row => ({
                    _id: row.uuid,
                    ...row
                }));
            },
            /**
             * Recupera todas as relevâncias.
             * @return {Promise<Array<Object>>} Retorna um array de objetos com as informações de cada relevância.
             * @property {string} _id           - ID da relevância.
             * @property {string} _label        - Título da relevância.
             * @property {string} rid           - ID da relevância.
             * @property {string} title         - Título da relevância.
             * @property {string} flavor        - Descrição adicional da relevância.
             * @property {number} relevance     - Relevância da relevância.
             * @property {string} source        - ID da Entrada que serve de fonte para a relevância.
             * @property {boolean} isDraft      - Relevância é rascunho? (false por padrão).
            */
            relevances: async () => {
                const query = 'SELECT * FROM relevance';
                this.results = await this.query(query);
                return this.result.map(row => ({
                    _id: row.rid,
                    _label: row.title,
                    ...row
                }));
            },
            settings: async () => {
                const query = 'SELECT * FROM settings';
                this.results = await this.query(query);
                return this.result.map(row => ({
                    _id: row.tag,
                    _label: row.title,
                    ...row
                }));
            }
        },
        insert: {
            /**
             * Adiciona uma nova capítulo na tabela `chapter`.
             * 
             * @param {Object} data             - Dados do capítulo a ser adicionado.
             * @param {number} data.tome        - Número do tomo.
             * @param {string} data.title       - Título do capítulo.
             * @param {string} data.icon        - Ícone do capítulo.
             * @param {number} data.type        - Tipo do capítulo, padrão é 0.
             * @param {number} data.hasLineage  - Capítulo representa linhagem, padrão é 'false'.
             * 
             * @returns {Promise<Object>} - Resultado da execução do comando, incluindo o ID do capítulo adicionado.
            */
            chapters: async () => {
                let query = 'INSERT INTO chapter (cid, tome, title, icon, type, hasLineage) VALUES (?,?,?,?,?,?);';
                let params = [];

                const cid = (!data.cid || data.cid.isEmpty()) ? this.generateID() : data.cid;

                params.push(cid);
                params.push(data.tome);
                params.push(data.title);
                params.push(data.icon);
                params.push(Number(data.type) ?? 0);
                params.push(Number(data.hasLineage) ?? 0);

                const result = await this.execute(query, params);
                result.lastInsertRowid = cid;
                this.results = result;

                return this.result;
            },
            chapterTypes: async () => {
            },
            /**
             * Adiciona uma nova Seção na tabela `section`.
             * 
             * @param {Object} data - Dados da Seção a ser adicionada.
             * @param {string} data.cid - Identificador do Capítulo a que a Seção pertence.
             * @param {string} data.title - Título da Seção.
             * @param {string} data.htmlString - String HTML a ser associada à Seção.
             * @param {boolean} data.isDraft - Indica se a Seção é um rascunho.
             * @param {boolean} data.hasLineage - Indica se a seção possui linhagem.
             * 
             * @returns {Promise<Object>} - Resultado da execução do comando, incluindo o ID da Seção adicionada.
            */
            sections: async () => {
                let query = 'INSERT INTO section (sid, cid, title, htmlString, isDraft, hasLineage) VALUES (?,?,?,?,?,?);';
                const params = [];

                const sid = (!data.sid || data.sid.isEmpty()) ? this.generateID() : data.sid;

                params.push(sid);
                params.push(data.cid);
                params.push(data.title);
                params.push(data.htmlString);
                params.push(Number(data.isDraft));
                params.push(Number(data.hasLineage));

                const result = await this.execute(query, params);
                result.lastInsertRowid = sid;
                this.results = result;

                return this.result;
            },
            /**
             * Adiciona uma nova entrada na tabela `entry`.
             * 
             * @param {Object} data - Dados da entrada a ser adicionada.
             * @param {string} data.sid - Identificador da categoria.
             * @param {number} data.etid - Identificador do tipo de entrada.
             * @param {string} data.title - Título da entrada.
             * @param {string} data.flavor - Texto de descrição ou sabor.
             * @param {string} data.htmlString - String HTML a ser associada à entrada.
             * @param {string|Buffer} [data.rawData] - Dados binários da imagem associada, opcional.
             * @param {string} [data.ext='jpeg'] - Extensão da imagem, padrão é 'jpeg'.
             * @param {boolean} data.isDraft - Indica se a entrada é um rascunho.
             * 
             * @returns {Promise<Object>} - Resultado da execução do comando, incluindo o ID da entrada adicionada.
            */
            entries: async () => {
                let query = 'INSERT INTO entry (eid, sid, etid, title, flavor, htmlString, img, ext, isDraft) VALUES (?,?,?,?,?,?,?,?,?);';
                let params = [];

                const eid = (!data.eid || data.eid.isEmpty()) ? this.generateID() : data.eid;

                params.push(eid);
                params.push(data.sid);
                params.push(Number(data.etid));
                params.push(data.title);
                params.push(data.flavor);
                params.push(data.htmlString);
                params.push(data.rawData ?? null);
                params.push(data.ext ?? 'jpeg');
                params.push(Number(data.isDraft));

                const result = await this.execute(query, params);
                result.lastInsertRowid = eid;
                this.results = result;

                return this.result;
            },
            entryTypes: async () => {
            },
            /**
             * Adiciona um registro na tabela `event` para armazenar um evento.
             * 
             * @param {Object} data - Dados contendo as informa es do evento.
             * @param {string} data.sid - Identificador do assunto do evento.
             * @param {string} data.etid - Identificador do tipo de evento.
             * @param {string} data.title - Título do evento.
             * @param {string} data.flavor - Sabor do evento (um texto adicional para o título do evento).
             * @param {number} data.relevance - Nível de relevância do evento.
             * @param {string} data.source - Fonte do evento (um texto que indica de onde o evento foi retirado).
             * @param {Object} data.date - Um objeto contendo informa es sobre a data do evento.
             * @param {number} data.date.start.year - Ano do início do evento.
             * @param {number} data.date.start.month - Mês do início do evento.
             * @param {number} data.date.start.day - Dia do início do evento.
             * @param {number} data.date.end.year - Ano do final do evento.
             * @param {number} data.date.end.month - Mês do final do evento.
             * @param {number} data.date.end.day - Dia do final do evento.
             * @param {boolean} data.isDraft - Seção evento é um rascunho.
             * 
             * @returns {Promise<Object>} - Resultado da execução do comando.
            */
            events: async () => {
                let query = 'INSERT INTO event (evid, sid, etid, title, flavor, relevance, source, clid, s_year, s_month, s_day, e_year, e_month, e_day, isDraft) ';
                query += 'VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?);';
                const params = [];

                const evid = (!data.evid || data.evid.isEmpty()) ? this.generateID() : data.evid;

                params.push(evid);
                params.push(data.sid);
                params.push(Number(data.etid));
                params.push(data.title);
                params.push(data.flavor);
                params.push(Number(data.relevance));
                params.push(data.source);
                params.push(data.clid);
                params.push(data.date.start.year);
                params.push(data.date.start.month);
                params.push(data.date.start.day);
                params.push(data.date.end?.year);
                params.push(data.date.end?.month);
                params.push(data.date.end?.day);
                params.push(Number(data.isDraft ?? false));

                const result = await this.execute(query, params);
                result.lastInsertRowid = evid;
                this.results = result;

                return this.result;
            },
            /**
             * Adiciona uma nova Árvore de Linhagem ao banco de dados.
             * @param {Object} data             - Os dados da Árvore de Linhagem a serem adicionados.
             * @param {string} data.eid         - O ID da entrada fundadora da Linhagem.
             * @param {string} data.tree        - A estrutura da Árvore de Linhagem em FamilyScript.
             * @param {boolean} data.isDraft    - Indica se a Árvore de Linhagem é um rascunho.
             * @returns {Promise<Object>} A resposta do banco de dados.
             */
            lineages: async () => {
                let query = 'INSERT INTO lineageTree (ltid, eid, title, tree, isDraft) ';
                query += 'VALUES (?,?,?,?,?);';
                const params = [];

                const ltid = (!data.ltid || data.ltid.isEmpty()) ? this.generateID() : data.ltid;

                params.push(ltid);
                params.push(data.eid);
                params.push(data.title);
                params.push(data.tree);
                params.push(data.isDraft);

                const result = await this.execute(query, params);
                result.lastInsertRowid = ltid;
                this.results = result;

                return this.result;
            },
            /**
             * Adiciona um tipo à Árvore de Linhagem.
             * @param {Object} data - Os dados do tipo de Árvore de Linhagem.
             * @param {string} data.tag - A tag do tipo de Árvore de Linhagem.
             * @param {string} data.label - O rótulo do tipo de Árvore de Linhagem.
             * @returns {Promise<Object>} A resposta do banco de dados.
             */
            lineageTypes: async () => {
                let query = 'INSERT INTO lineageType (ltid, tag, label) ';
                query += 'VALUES (?,?,?);';
                const params = [];

                params.push(data.ltid);
                params.push(data.tag);
                params.push(data.label);

                const result = await this.execute(query, params);
                this.results = result;

                return this.result;
            },
            /**
             * Vincula uma nova Entrada a uma Árvore de Linhagem no banco de dados.
             * @param {Object} data             - Os dados de vinculação.
             * @param {string} data.ltid        - O ID da Árvore de Linhagem.
             * @param {string} data.eid         - O ID da entrada adicionada à Árvore de Linhagem.
             * @returns {Promise<Object>} A resposta do banco de dados.
             */
            lineageEntries: async () => {
                let query = 'INSERT INTO _lineageTreeEntries (ltid, eid, code, isRoot) ';
                query += 'VALUES (?,?,?,?);';
                const params = [];

                params.push(data.ltid);
                params.push(data.eid);
                params.push(data.code);
                params.push(Number(data.isRoot));

                const result = await this.execute(query, params);
                this.results = result;

                return this.result;
            },
            maps: async () => {
                let query = 'INSERT INTO map (mid, sid, title, flavor, img, ext, isDraft) ';
                query += 'VALUES (?,?,?,?,?,?,?);';
                const params = [];

                const mid = (!data.mid || data.mid.isEmpty()) ? this.generateID() : data.mid;

                params.push(mid);
                params.push(data.sid);
                params.push(data.title);
                params.push(data.flavor);
                params.push(data.img);
                params.push(data.ext);
                params.push(data.isDraft);

                const result = await this.execute(query, params);
                result.lastInsertRowid = mid;
                this.results = result;

                return this.result;
            },
            mapElements: async () => {
                let query = 'INSERT INTO mapElements (meid, mid, epoch, type, icon, source, points) ';
                query += 'VALUES (?,?,?,?,?,?,?);';
                const params = [];

                const meid = (!data.meid || data.meid.isEmpty()) ? this.generateID() : data.meid;

                params.push(meid);
                params.push(data.mid);
                params.push(data.epoch);
                params.push(data.type);
                params.push(data.icon);
                params.push(data.source);
                params.push(data.points);

                const result = await this.execute(query, params);
                result.lastInsertRowid = meid;
                this.results = result;

                return this.result;
            },
            timelines: async () => {
                let query = 'INSERT INTO timeline (tid, title, flavor) VALUES (?,?,?);';
                let params = [];

                const tid = (!data.tid || data.tid.isEmpty()) ? this.generateID() : data.tid;

                params.push(tid);
                params.push(data.title);
                params.push(data.flavor);

                const result = await this.execute(query, params);
                result.lastInsertRowid = tid;
                this.results = result;

                return this.result;
            },
            timelineEvents: async () => {
                let query = 'INSERT INTO _timelineEvent (tid, evid) VALUES (?,?);';
                let params = [];

                params.push(data.tid);
                params.push(data.evid);

                this.results = await this.execute(query, params);

                return this.result;
            },
            textImages: async () => {
                let query = 'INSERT INTO _textImages (uuid, raw, ext) VALUES (?,?,?);';
                const params = [];
                const blob = data.data;

                params.push(data.uuid);
                params.push(blob.raw);
                params.push(blob.ext);

                this.results = await this.execute(query, params);

                return this.result;
            }
        },
        update: {
            sections: async () => {
                const updateSet = this.#buildUpdateSet([
                    ['cid', data.cid],
                    ['title', data.title],
                    ['htmlString', data.htmlString],
                    ['isDraft', Number(data.isDraft)],
                    ['hasLineage', Number(data.hasLineage)]
                ]);

                let query = `UPDATE section SET ${updateSet} WHERE sid = ?`;
                let params = [data.sid];
                this.results = await this.execute(query, params);

                return this.result;
            },
            entries: async () => {
                const updateSet = this.buildUpdateSet([
                    ['sid', data.sid],
                    ['etid', data.etid],
                    ['title', data.title],
                    ['flavor', data.flavor],
                    ['htmlString', data.htmlString],
                    ['img', data.rawData],
                    ['ext', data.ext],
                    ['isDraft', Number(data.isDraft)]
                ], { withNulls: true });

                let query = `UPDATE entry SET ${updateSet} WHERE eid = ?`;
                let params = [data.eid];
                this.results = await this.execute(query, params);

                return this.result;
            },
            events: async () => {
                const updateSet = this.buildUpdateSet([
                    ['sid', data.sid],
                    ['etid', Number(data.etid)],
                    ['title', data.title],
                    ['relevance', Number(data.relevance)],
                    ['source', data.source],
                    ['clid', Number(data.clid)],
                    ['s_year', data.date.start.year],
                    ['s_month', data.date.start.month],
                    ['s_day', data.date.start.day],
                    ['e_year', data.date.end?.year],
                    ['e_month', data.date.end?.month],
                    ['e_day', data.date.end?.day],
                    ['isDraft', Number(data.isDraft ?? false)]
                ], { withNulls: true });

                let query = `UPDATE event SET ${updateSet} WHERE evid = ?`;
                let params = [data.evid];
                this.results = await this.execute(query, params);

                return this.result;
            },
            lineages: async () => {
                const updateSet = this.buildUpdateSet([
                    ['title', data.title],
                    ['tree', data.tree]
                ]);

                let query = `UPDATE lineageTree SET ${updateSet} WHERE ltid = ?`;
                let params = [data.ltid];
                this.results = await this.execute(query, params);

                return this.result;
            },
            lineageTypes: async () => {
                const updateSet = this.buildUpdateSet([
                    ['tag', data.tag],
                    ['label', data.label]
                ]);

                let query = `UPDATE lineageType SET ${updateSet} WHERE ltid = ?`;
                let params = [data.ltid];
                this.results = await this.execute(query, params);

                return this.result;
            },
            maps: async () => {
                const updateSet = this.buildUpdateSet([
                    ['title', data.title],
                    ['flavor', data.flavor],
                    ['img', data.img],
                    ['ext', data.ext],
                    ['isDraft', Number(data.isDraft)]
                ]);

                let query = `UPDATE map SET ${updateSet} WHERE mid = ?`;
                let params = [data.mid];
                this.results = await this.execute(query, params);

                return this.result;
            },
            mapElements: async () => {
                const updateSet = this.buildUpdateSet([
                    ['source', data.source],
                    ['points', data.points]
                ]);

                let query = `UPDATE mapElements SET ${updateSet} WHERE meid = ?`;
                let params = [data.meid];
                this.results = await this.execute(query, params);

                return this.result;
            },
            timelines: async () => {
                const updateSet = this.buildUpdateSet([
                    ['title', data.title],
                    ['flavor', data.flavor]
                ]);

                let query = `UPDATE timeline SET ${updateSet} WHERE tid = ?`;
                let params = [data.tid];
                this.results = await this.execute(query, params);

                return this.result;
            }
        },
        delete: {
            chapters: async () => {
            },
            chapterTypes: async () => {
            },
            sections: async () => {
                let query = 'DELETE FROM section WHERE sid = ?;';
                const params = [sid];

                try {
                    this.beginTransaction();

                    this.results = await this.execute(query, params);

                    query = 'DELETE FROM entry WHERE sid = ?;'
                    this.results = await this.execute(query, params);

                    query = 'DELETE FROM event WHERE sid = ?;'
                    this.results = await this.execute(query, params);

                    query = 'DELETE FROM lineageTree WHERE sid = ?;'
                    this.results = await this.execute(query, params);

                    this.commitTransaction();
                } catch (error) {
                    this.rollbackTransaction(error);
                }

                return this.results;
            },
            entries: async () => {
                try {
                    this.beginTransaction();
                    let query = 'DELETE FROM entry WHERE eid = ?;';
                    let params = [eid];

                    this.results = await this.execute(query, params);

                    query = 'DELETE FROM event WHERE source = ?;';
                    this.results = await this.execute(query, params);

                    this.commitTransaction();
                } catch (error) {
                    this.rollbackTransaction(error);
                }

                return this.results;
            },
            entryTypes: async () => {
            },
            events: async () => {
            },
            lineages: async () => {
            },
            lineageTypes: async () => {
            },
            lineageEntries: async () => {
            },
            maps: async () => {
            },
            mapElements: async () => {
            },
            timelines: async () => {
            },
            timelineEvents: async () => {
            },
            calendars: async () => {
            },
            months: async () => {
            },
            days: async () => {
            },
            daysInMonth: async () => {
            },
            textImages: async () => {
            },
            relevances: async () => {
            },
            settings: async () => {
            }
        },
        populate: {
            tomes: async () => {
                console.log('Populando tabela \'tome\'....');

                const tomes = [
                    {
                        title: 'atlas',
                        label: 'Atlas',
                        icon: 'fas fa-compass-drafting'
                    },
                    {
                        title: 'history',
                        label: 'História',
                        icon: 'fas fa-book'
                    },
                    {
                        title: 'politics',
                        label: 'Política',
                        icon: 'fas fa-crown'
                    },
                    {
                        title: 'economy',
                        label: 'Economia',
                        icon: 'fas fa-comments-dollar'
                    },
                    {
                        title: 'military',
                        label: 'Militar',
                        icon: 'fas fa-shield'
                    },
                    {
                        title: 'entity',
                        label: 'Entidades',
                        icon: 'fas fa-people-group'
                    },
                    {
                        title: 'ideologies',
                        label: 'Ideologias',
                        icon: 'fas fa-landmark'
                    }
                ];

                let query = 'INSERT INTO tome (title, label, icon) ';
                query += 'VALUES (?,?,?);';

                tomes.forEach(async tome => {
                    let params = [];

                    params.push(tome.title);
                    params.push(tome.label);
                    params.push(tome.icon);

                    this.results = await this.execute(query, params);
                });
                console.log('Tabela \'tome\' populada....OK.');

                return this.result;
            },
            entryTypes: async () => {
                console.log('Populando tabela \'entryType\'....');

                const entryTypes = [
                    {
                        title: 'Artigo Genérico',
                        icon: 'fas fa-newspaper',
                        isMaterial: 0,
                        isEntity: 0
                    },
                    {
                        title: 'Boato',
                        icon: 'fas fa-comments',
                        isMaterial: 0,
                        isEntity: 0
                    },
                    {
                        title: 'Descoberta',
                        icon: 'fas fa-book-open-reader',
                        isMaterial: 0,
                        isEntity: 0
                    },
                    {
                        title: 'Evento',
                        icon: 'fas fa-calendar-day',
                        isMaterial: 0,
                        isEntity: 0
                    },
                    {
                        title: 'Relato',
                        icon: 'fas fa-message',
                        isMaterial: 0,
                        isEntity: 0
                    },
                    {
                        title: 'Documento',
                        icon: 'fas fa-file',
                        isMaterial: 1,
                        isEntity: 0
                    },
                    {
                        title: 'Objeto',
                        icon: 'fas fa-hammer',
                        isMaterial: 1,
                        isEntity: 0
                    },
                    {
                        title: 'Pessoa',
                        icon: 'fas fa-user-large',
                        isMaterial: 1,
                        isEntity: 0
                    },
                    {
                        title: 'Entidade',
                        icon: 'fas fa-people-group',
                        isMaterial: 0,
                        isEntity: 1
                    }
                ];

                let query = 'INSERT INTO entryType (title, icon, isMaterial) ';
                query += 'VALUES (?,?,?);';

                entryTypes.forEach(async entryType => {
                    let params = [];

                    params.push(entryType.title);
                    params.push(entryType.icon);
                    params.push(entryType.isMaterial);

                    this.results = await this.execute(query, params);
                });
                console.log('Tabela \'entryType\' populada....OK.');
                return this.result;
            },
            relevances: async () => {
                console.log('Populando tabela \'relevance\'....');

                const relevances = [
                    {
                        title: 'Minor'
                    },
                    {
                        title: 'Normal'
                    },
                    {
                        title: 'Major'
                    }
                ];

                let query = 'INSERT INTO relevance (title) ';
                query += 'VALUES (?);';

                relevances.forEach(async relevance => {
                    let params = [];

                    params.push(relevance.title);

                    this.results = await this.execute(query, params);
                });
                console.log('Tabela \'relevance\' populada....OK.');
                return this.result;
            },
            maps: async () => {
                console.log('Populando tabela \'map\'....');

                const imageBuffer = await uniforge.fs.readFile(uniforge.urls.defaultMap);
                const imageExt = await uniforge.path.extname(uniforge.urls.defaultMap);
                const imageData = await uniforge.utils.bufferToBlob(imageBuffer, imageExt);

                const map = {
                    mid: 'De#m@Pgl0ba1Unfg',
                    sid: '-',
                    title: 'Mapa Global',
                    flavor: 'Mapa Padrão.',
                    img: imageData.raw,
                    ext: imageData.ext,
                    isDraft: false
                }

                let query = 'INSERT INTO map (mid, sid, title, flavor, img, ext, isDraft) ';
                query += 'VALUES (?,?,?,?,?,?,?);';

                const params = [
                    map.mid,
                    map.sid,
                    map.title,
                    map.flavor,
                    map.img,
                    map.ext,
                    Number(map.isDraft)
                ];

                this.results = await this.execute(query, params);

                console.log('Tabela \'map\' populada....OK.');

                return this.result;
            }
        },
    }
}