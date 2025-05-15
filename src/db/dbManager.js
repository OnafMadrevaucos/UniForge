import { registerHook, triggerHook } from "../scripts/hooks.js";
import DBDocuments from "./dbDocuments.js";

export default class DBManager {
    constructor() {
        this.storedProcedures = {
            createCalendarTable: () => this.createCalendarTable(),
            createMonthsTable: () => this.createMonthsTable(),
            createDaysTable: () => this.createDaysTable(),
            createDaysInMonthsTable: () => this.createDaysInMonthsTable(),
            createEntryTypeTable: () => this.createEntryTypeTable(),
            createRelevanceTable: () => this.createRelevanceTable(),
            createChapterTable: () => this.createChapterTable(),
            createSectionTable: () => this.createSectionTable(),
            createEntryTable: () => this.createEntryTable(),
            createEventTable: () => this.createEventTable(),
            createLineageTreeTable: () => this.createLineageTreeTable(),
            createLineageTypeTable: () => this.createLineageTypeTable(),
            createTimelineTable: () => this.createTimelineTable(),
            createTimelineEventsTable: () => this.createTimelineEventsTable(),
            createTextImagesTable: () => this.createTextImagesTable(),
            createSettingsTable: () => this.createSettingsTable()
        };
    }

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
        if (results.length > 0) {
            return results[results.length - 1];
        } else
            return null;
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
        if (!value) throw new Error('O valor passado não pode ser nulo ou indefinido.');

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

    clear() {
        this.#state = {
            transactionStarted: false,
            results: [],
            changes: 0
        }
    }


    async beginTransaction() {
        if (!this.transactionStarted) {
            console.log('UniForge | Abrindo transação....');
            // Limpa o estado atual do gerenciador do banco de dados.
            this.clear();
            // Inicia uma nova transação.
            await uniforge.sql.exec('BEGIN TRANSACTION');
            // Registra o início da transação.
            this.transactionStarted = true;
        } else console.warn('UniForge | Há outra transação ainda aberta, finalize-a primeiro.');
    }

    async commitTransaction() {
        if (this.transactionStarted) {
            console.log('UniForge | Confirmando transação....');
            await uniforge.sql.exec('COMMIT');

            // Se a operação afetou alguma linha, atualiza base de dados.
            if (this.totalCanges > 0) this.rebuildDocs();

            this.transactionStarted = false;
        } else console.warn('UniForge | Nenhuma transação aberta encontrada.');
    }

    async rollbackTransaction(motive = '') {
        if (this.transactionStarted) {
            console.log(`UniForge | A transação teve de ser revertida.${!motive.isEmpty() ? ` Motivo: ${motive}` : ''}.`);
            // Reverte a transação.
            await uniforge.sql.exec('ROLLBACK');
            // Reverte o estado do gerenciador do banco de dados para o padrão.
            this.clear();
        } else console.warn('UniForge | Nenhuma transação aberta encontrada.');
    }

    async getAllTables() {
        const query = 'SELECT name FROM sqlite_master WHERE type=\'table\' ORDER BY name';
        const rows = await uniforge.sql.query(query);

        return rows;
    }

    async deleteTable(tableName) {
        const query = `DROP TABLE IF EXISTS ${tableName}`;
        return await this.#execQuery(query);
    }

    /**
     * Reseta o banco de dados, deletando todas as tabelas e recriando-as com seus índices e constraints.
     * @returns {Promise<boolean>} - true se a operação for bem sucedida, false caso contrário.
    */
    async resetDatabase() {
        // Limpa o estado atual do gerenciador do banco de dados.
        this.clear();

        const queires = [
            'DROP TABLE IF EXISTS _textImages',
            'DROP TABLE IF EXISTS _timelineEvent',
            'DROP TABLE IF EXISTS tome',
            'DROP TABLE IF EXISTS chapter',
            'DROP TABLE IF EXISTS section',
            'DROP TABLE IF EXISTS entry',
            'DROP TABLE IF EXISTS event',
            'DROP TABLE IF EXISTS lineageTree',
            'DROP TABLE IF EXISTS lineageType',
            'DROP TABLE IF EXISTS timeline',
            'DROP TABLE IF EXISTS relevance',
            'DROP TABLE IF EXISTS entryType',
            'DROP TABLE IF EXISTS settings'
        ];

        const totalQueries = queires.length;

        try {
            // Inicia a transação principal.
            await this.beginTransaction();

            let count = 0;

            for (let query of queires) {
                await this.#execQuery(query);
                count++;

                console.log(`Tabela ${count} de ${totalQueries} deletada.`);
            }

            await this.createEntryTypeTable();
            await this.createRelevanceTable();
            await this.createTextImagesTable();
            await this.createTomeTable();
            await this.createChapterTable();
            await this.createSectionTable();
            await this.createEntryTable();
            await this.createEventTable();
            await this.createLineageTreeTable();
            await this.createLineageTypeTable();
            await this.createTimelineTable();
            await this.createTimelineEventsTable();
            await this.createSettingsTable();


            // Comita a transação principal.
            await this.commitTransaction();
        } catch (error) {
            // Faz rollback em caso de erro ao criar as tabelas do banco de dados.
            await this.rollbackTransaction(error);
            return false;
        }

        try {
            // Inicia a transação para popular o Banco de Dados com informações padrão.
            await this.beginTransaction();

            await this.populateTomeTable();
            await this.populateEntryTypeTable();
            await this.populateRelevanceTable();

            // Comita a transação.
            await this.commitTransaction();
            return true;
        } catch (error) {
            // Faz rollback em caso de erro ao popular as tabelas.
            await this.rollbackTransaction(error);
            return false;
        }
    }

    /**
     * Adiciona uma nova capítulo na tabela `chapter`.
     * 
     * @param {Object} data - Dados do capítulo a ser adicionado.
     * @param {number} data.tome - Número do tomo.
     * @param {string} data.title - Título do capítulo.
     * @param {string} data.icon - Ícone do capítulo.
     * @param {number} [data.type] - Tipo do capítulo, padrão é 0.
     * 
     * @returns {Promise<Object>} - Resultado da execução do comando, incluindo o ID do capítulo adicionado.
    */
    async addChapter(data) {
        let query = 'INSERT INTO chapter (cid, tome, title, icon, type) VALUES (?,?,?,?,?);';
        let params = [];

        const cid = (!data.cid || data.cid.isEmpty()) ? this.generateID() : data.cid;

        params.push(cid);
        params.push(data.tome);
        params.push(data.title);
        params.push(data.icon);
        params.push(Number(data.type) ?? 0);

        this.results = await this.#execQuery(query, params);

        return this.result;
    }

    /**
     * Adiciona uma nova Seção na tabela `section`.
     * 
     * @param {Object} data - Dados da Seção a ser adicionada.
     * @param {string} data.cid - Identificador do Capítulo a que a Seção pertence.
     * @param {string} data.title - Título da Seção.
     * @param {string} data.htmlString - String HTML a ser associada à Seção.
     * @param {boolean} data.isDraft - Indica se a Seção é um rascunho.
     * 
     * @returns {Promise<Object>} - Resultado da execução do comando, incluindo o ID da Seção adicionada.
    */
    async addSection(data) {
        let query = 'INSERT INTO section (sid, cid, title, htmlString, isDraft) VALUES (?,?,?,?,?);';
        const params = [];

        const sid = (!data.sid || data.sid.isEmpty()) ? this.generateID() : data.sid;

        params.push(sid);
        params.push(data.cid);
        params.push(data.title);
        params.push(data.htmlString);
        params.push(Number(data.isDraft));

        this.results = await this.#execQuery(query, params);

        return this.result;
    }

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
    async addEntry(data) {
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

        this.results = await this.#execQuery(query, params);

        return this.result;
    }

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
    async addEvent(data) {
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
        params.push(Number(data.clid));
        params.push(data.s_year);
        params.push(data.s_month);
        params.push(data.s_day);
        params.push(data.e_year);
        params.push(data.e_month);
        params.push(data.e_day);
        params.push(Number(data.isDraft ?? false));

        this.results = await this.#execQuery(query, params);
        result.addedId = evid;

        return this.result;
    }

    /**
     * Adiciona uma nova Árvore de Linhagem ao banco de dados.
     * @param {Object} data             - Os dados da Árvore de Linhagem a serem adicionados.
     * @param {string} data.sid         - O ID da Seção a qual a Árvore de Linhagem pertence.
     * @param {string} data.founder     - O ID do fundador da Árvore de Linhagem.
     * @param {string} data.tree        - A estrutura da Árvore de Linhagem em FamilyScript.
     * @param {boolean} data.isDraft    - Indica se a Árvore de Linhagem é um rascunho.
     * @returns {Promise<Object>} A resposta do banco de dados.
     */
    async addLineageTree(data) {
        let query = 'INSERT INTO lineageTree (ltid, sid, title, founder, tree, isDraft) ';
        query += 'VALUES (?,?,?,?,?,?);';
        const params = [];

        const ltid = (!data.ltid || data.ltid.isEmpty()) ? this.generateID() : data.ltid;

        params.push(ltid);
        params.push(data.sid);
        params.push(data.title);
        params.push(data.founder);
        params.push(data.tree);
        params.push(data.isDraft);

        this.results = await this.#execQuery(query, params);
        result.addedId = ltid;

        return this.result;
    }

    /**
     * Adiciona um tipo à Árvore de Linhagem.
     * @param {Object} data - Os dados do tipo de Árvore de Linhagem.
     * @param {string} data.tag - A tag do tipo de Árvore de Linhagem.
     * @param {string} data.label - O rótulo do tipo de Árvore de Linhagem.
     * @returns {Promise<Object>} A resposta do banco de dados.
     */
    async addLineageType(data) {
        let query = 'INSERT INTO lineageType (ltid, tag, label) ';
        query += 'VALUES (?,?,?);';
        const params = [];

        params.push(data.ltid);
        params.push(data.tag);
        params.push(data.label);

        this.results = await this.#execQuery(query, params);

        return this.result;
    }

    async addTimeline(data) {
        let query = 'INSERT INTO timeline (tid, title, flavor) VALUES (?,?,?);';
        let params = [];

        const tid = (!data.tid || data.tid.isEmpty()) ? this.generateID() : data.tid;

        params.push(tid);
        params.push(data.title);
        params.push(data.flavor);

        let result = await this.#execQuery(query, params);
        result.addedId = tid;

        return this.result;
    }

    async addTimelineEvent(data) {
        let query = 'INSERT INTO _timelineEvent (tid, evid) VALUES (?,?);';
        let params = [];

        params.push(data.tid);
        params.push(data.evid);

        let result = await this.#execQuery(query, params);
        return this.result;
    }

    /**
     * Adiciona um registro na tabela `_textImages` para armazenar uma imagem associada a um uuid.
     * 
     * @param {Object} data - Dados contendo o uuid e a imagem em blob.
     * @param {string} data.uuid - Identificador único da imagem.
     * @param {Object} data.data - Dados contendo a imagem em blob e sua extens o.
     * @param {string|Buffer} data.data.img - Imagem em si, pode ser um string em base64 ou um Buffer.
     * @param {string} data.data.ext - Extens o da imagem.
     * 
     * @returns {Promise<Object>} - Resultado da execu o do comando.
     */
    async addTextImages(data) {
        let query = 'INSERT INTO _textImages (uuid, raw, ext) VALUES (?,?,?);';
        const params = [];
        const blob = data.data;

        params.push(data.uuid);
        params.push(blob.raw);
        params.push(blob.ext);

        this.results = await this.#execQuery(query, params);

        return this.result;
    }

    /**
     * Atualiza uma seção no banco de dados com base nos dados fornecidos.
     * 
     * @param {Object} data - Dados da seção a serem atualizados.
     * @param {string} data.sid - ID da seção a ser atualizada.
     * @param {string} data.cid - ID da categoria associada à seção.
     * @param {string} data.title - Título da seção.
     * @param {string} data.htmlString - String HTML a ser associada à seção.
     * @param {boolean} data.isDraft - Indica se a seção é um rascunho.
     * 
     * @returns {Promise<Object>} - Resultado da execução do comando de atualização.
    */
    async updateSection(data) {
        const updateSet = this.buildUpdateSet([
            ['cid', data.cid],
            ['title', data.title],
            ['htmlString', data.htmlString],
            ['isDraft', Number(data.isDraft)]
        ]);

        let query = `UPDATE section SET ${updateSet} WHERE sid = ?`;
        let params = [data.sid];
        this.results = await this.#execQuery(query, params);

        return this.result;
    }

    /**
     * Atualiza uma entrada no banco de dados com base nos dados fornecidos.
     * 
     * @param {Object} data - Dados da entrada a serem atualizados.
     * @param {string} data.sid - ID da seção associada à entrada.
     * @param {string} data.etid - ID do tipo de entrada.
     * @param {string} data.title - Título da entrada.
     * @param {string} data.flavor - Texto de descrição ou sabor.
     * @param {string} data.htmlString - String HTML a ser associada à entrada.
     * @param {string|Buffer} [data.rawData] - Dados binários da imagem associada, opcional.
     * @param {string} [data.ext='jpeg'] - Extensão da imagem, padrão é 'jpeg'.
     * @param {boolean} data.isDraft - Indica se a entrada é um rascunho.
     * @param {string} data.eid - ID da entrada a ser atualizada.
     * 
     * @returns {Promise<Object>} - Resultado da execução do comando de atualização.
    */
    async updateEntry(data) {
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
        this.results = await this.#execQuery(query, params);

        return this.result;
    }

    /**
     * Atualiza o Evento com o ID especificado.
     * @param {Object} data                     - Os dados a serem atualizados.
     * @param {string} data.sid                 - ID da Seção a qual o Evento pertence.
     * @param {string} data.etid                - ID do Tipo de Evento a ser atualizado.
     * @param {string} data.title               - Título do Evento.
     * @param {string} data.relevance           - Relevância do Evento.
     * @param {string} data.source              - Fonte do Evento.
     * @param {Object} data.date                - Data do Evento.
     * @param {number} data.date.start.year     - Ano de início do Evento.
     * @param {number} data.date.start.month    - Mês de início do Evento.
     * @param {number} data.date.start.day      - Dia de início do Evento.
     * @param {number} data.date.end.year       - Ano de fim do Evento.
     * @param {number} data.date.end.month      - Mês de fim do Evento.
     * @param {number} data.date.end.day        - Dia de fim do Evento.
     * @param {string} data.isDraft             - O Evento é um rascunho?
     * @returns {Promise<Object>} A resposta do banco de dados.
     */
    async updateEvent(data) {
        const updateSet = this.buildUpdateSet([
            ['sid', data.sid],
            ['etid', Number(data.etid)],
            ['title', data.title],
            ['relevance', Number(data.relevance)],
            ['source', data.source],
            ['clid', Number(data.clid)],
            ['s_year', data.s_year],
            ['s_month', data.s_month],
            ['s_day', data.s_day],
            ['e_year', data.e_year],
            ['e_month', data.e_month],
            ['e_day', data.e_day],
            ['isDraft', Number(data.isDraft ?? false)]
        ], { withNulls: true });

        let query = `UPDATE event SET ${updateSet} WHERE evid = ?`;
        let params = [data.evid];
        this.results = await this.#execQuery(query, params);

        return this.result;
    }

    /**
     * Atualiza a Árvore de Linhagem com o ID especificado.
     * @param {Object} data         - Os dados a serem atualizados.
     * @param {string} data.ltid    - O ID da Árvore de Linhagem a ser atualizada.
     * @param {string} data.sid     - ID da Seção a qual a Árvore de Linhagem pertence.
     * @param {string} data.founder - O ID da Árvore de Linhagem a ser atualizada.
     * @param {string} data.tree    - A estrutura da Árvore de Linhagem em FamilyScript.
     * @param {string} data.isDraft - A Linhagem é um rascunho?
     * @returns {Promise<Object>} A resposta do banco de dados.
     */
    async updateLineageTree(data) {
        const updateSet = this.buildUpdateSet([
            ['title', data.title]
            ['tree', data.tree]
        ]);

        let query = `UPDATE lineageTree SET ${updateSet} WHERE ltid = ?`;
        let params = [data.ltid];
        this.results = await this.#execQuery(query, params);

        return this.result;
    }

    /**
     * Atualiza o tipo de Árvore de Linhagem com o ID especificado.
     * @param {Object} data       - Os dados do tipo de Árvore de Linhagem a serem atualizados.
     * @param {string} data.tag   - A nova tag do tipo de Árvore de Linhagem.
     * @param {string} data.label - O novo rótulo do tipo de Árvore de Linhagem.
     * @param {string} data.ltid  - O ID do tipo de Árvore de Linhagem a ser atualizado.
     * @returns {Promise<Object>} A resposta do banco de dados.
     */
    async updateLineageType(data) {
        const updateSet = this.buildUpdateSet([
            ['tag', data.tag],
            ['label', data.label]
        ]);

        let query = `UPDATE lineageType SET ${updateSet} WHERE ltid = ?`;
        let params = [data.ltid];
        this.results = await this.#execQuery(query, params);

        return this.result;
    }

    /**
     * Atualiza a Linha do Tempo com o ID especificado.
     * @param {Object} data             - Os dados a serem atualizados.
     * @param {string} data.title       - A estrutura da Árvore de Linhagem em FamilyScript.
     * @param {string} data.flavor      - O ID da Árvore de Linhagem a ser atualizada.
     * @param {string} data.isDraft     - A Linha do Tempo é um rascunho?
     * @returns {Promise<Object>} A resposta do banco de dados.
     */
    async updateTimeline(data) {
        const updateSet = this.buildUpdateSet([
            ['title', data.title],
            ['flavor', data.flavor]
        ]);

        let query = `UPDATE timeline SET ${updateSet} WHERE tid = ?`;
        let params = [data.tid];
        this.results = await this.#execQuery(query, params);

        return this.result;
    }

    /**
     * Deleta a Seção com o ID especificado e todas as suas Entradas, Eventos e Linhagens.
     * @param {number} sid - O ID da Seção a ser deletada.
     * @returns {Promise<Object>} A resposta do banco de dados, com as queries executadas para deletar a Seção e as Entradas.
     */
    async deleteSection(sid) {
        let query = 'DELETE FROM section WHERE sid = ?;';
        const params = [sid];

        try {
            this.beginTransaction();

            this.results = await this.#execQuery(query, params);

            query = 'DELETE FROM entry WHERE sid = ?;'
            this.results = await this.#execQuery(query, params);

            query = 'DELETE FROM event WHERE sid = ?;'
            this.results = await this.#execQuery(query, params);

            query = 'DELETE FROM lineageTree WHERE sid = ?;'
            this.results = await this.#execQuery(query, params);

            this.commitTransaction();
        } catch (error) {
            this.rollbackTransaction(error);
        }

        return this.results;
    }

    /**
     * Deleta a Entrada com o ID especificado.
     * @param {number} eid - O ID da Entrada a ser deletada.
     * @returns {Promise<Object>} A resposta do banco de dados.
     */
    async deleteEntry(eid) {
        try {
            this.beginTransaction();
            let query = 'DELETE FROM entry WHERE eid = ?;';
            let params = [eid];

            this.results = await this.#execQuery(query, params);

            query = 'DELETE FROM event WHERE source = ?;';
            this.results = await this.#execQuery(query, params);

            this.commitTransaction();
        } catch (error) {
            this.rollbackTransaction(error);
        }

        return this.results;
    }

    /**
     * Deleta o Evento com o ID especificado.
     * @param {string} evid - O ID do Evento a ser deletado.
     * @returns {Promise<Object>} A resposta do banco de dados.
     */
    async deleteEvent(evid) {
        let query = 'DELETE FROM event WHERE evid = ?;';
        const params = [evid];
        this.results = await this.#execQuery(query, params);

        return this.result;
    }

    /**
     * Deleta a Árvore de Linhagem com o ID especificado.
     * @param {string} ltid         - O ID da Árvore de Linhagem a ser deletada.
     * @returns {Promise<Object>} A resposta do banco de dados.
     */
    async deleteLineageTree(ltid) {
        let query = 'DELETE FROM lineageTree WHERE ltid = ?;';
        let params = [ltid];
        this.results = await this.#execQuery(query, params);

        return this.result;
    }

    /**
     * Deleta o tipo de Árvore de Linhagem com o ID especificado.
     * @param {string} ltid         - O ID do tipo de Árvore de Linhagem a ser deletado.
     * @returns {Promise<Object>} A resposta do banco de dados.
     */
    async deleteLineageType(ltid) {
        let query = 'DELETE FROM lineageType WHERE ltid = ?;';
        let params = [ltid];
        this.results = await this.#execQuery(query, params);

        return this.result;
    }

    /**
     * Deleta a Linha do Tempo com o ID especificado.
     * @param {string} tid          - O ID da Linha do Tempo a ser deletada.
     * @returns {Promise<Object>} A resposta do banco de dados.
     */
    async deleteTimeline(tid) {
        let query = 'DELETE FROM timeline WHERE tid = ?;';
        let params = [tid];
        this.results = await this.#execQuery(query, params);

        return this.result;
    }

    async deleteTimelineEvent(tid, evid) {
        let query = 'DELETE FROM _timelineEvent WHERE tid = ? AND evid = ?;';
        let params = [tid, evid];
        this.results = await this.#execQuery(query, params);

        return this.result;
    }

    /**
     * Obtém um Capítulo.
     * 
     * @async
     * @param {string} cid - Identificador do Capítulo.
     * @returns {Object} - O Capítulo com suas informações ou null se não encontrado.
     */
    async getChapter(cid) {
        let query = 'SELECT * FROM chapter AS C WHERE C.cid = ?';
        const params = [cid];

        this.results = await uniforge.sql.query(query, params);
        return this.result;
    }
    /**
     * Obtém o Tomo a que o capítulo pertence.
     * 
     * @async
     * @param {string} cid - Identificador do Capítulo.
     * @returns {Object} - Um objeto contendo título e icone do Tomo.
     */
    async getChapterTome(cid) {
        let query = 'SELECT C.title, C.tome, T.icon FROM chapter AS C ';
        query += 'INNER JOIN tome AS T ON T.title = C.tome ';
        query += 'WHERE C.cid = ?;';
        const params = [cid];

        this.results = await uniforge.sql.query(query, params);
        return this.result;
    }

    /**
     * Recupera a Seção com o ID especificado.
     * @param {string} sid - O ID da Seção a ser recuperada.
     * @returns {Promise<Object>} - Uma promessa que resolve para um objeto representando a Seção, ou null se não for encontrado.
     * @property {string} _id        - ID da Seção.
     * @property {string} _label     - Título da Seção.
     * @property {string} sid        - ID da Seção.
     * @property {string} cid        - ID do Cap tulo a qual a Seção pertence.
     * @property {string} title      - Título da Seção.
     * @property {string} htmlString - Conte do HTML da Seção.
     * @property {boolean} isDraft   - A Seção é um rascunho? (falso por padrão).
     */
    async getSection(sid) {
        let query = 'SELECT * FROM section WHERE sid = ?';
        const params = [sid];

        this.results = await uniforge.sql.query(query, params);
        return this.result;
    }

    /**
     * Obtém as seções pertencentes a um tomo específico.
     * 
     * @async
     * @param {string} tome - Identificador do Tomo.
     * @returns {Promise<Array<Object>>} - Uma promessa que resolve para um array de objetos representando as seções.
    */
    async getSectionsFromTome(tome) {
        let query = 'SELECT S.cid, S.title AS label FROM section AS S ' +
            'INNER JOIN chapter AS C ON C.cid = S.cid ' +
            `WHERE S.tome = ?`;
        const params = [tome];

        this.results = await uniforge.sql.query(query, params);
        return this.result;
    }

    /**
     * Obtém as seções pertencentes a um capítulo específico.
     * 
     * @async
     * @param {string} cid - Identificador do Capítulo.
     * @returns {Promise<Array<Object>>} - Uma promessa que resolve para um array de objetos representando as seções.
    */
    async getSectionsFromChapter(cid) {
        let query = 'SELECT * FROM section AS S WHERE S.cid = ?;';
        const params = [cid];

        this.results = await uniforge.sql.query(query, params);
        return this.result;
    }

    /**
     * Retorna uma entrada com base no seu ID.
     * 
     * @param {string} eid - O ID da Entrada a ser buscada.
     * @returns {Promise<Object|null>} - Uma promessa que resolve para um objeto representando a Entrada, ou null se a Entrada não existir.
     */
    async getEntry(eid) {
        let query = 'SELECT * FROM entry WHERE eid = ?;';
        const params = [eid];

        this.results = await uniforge.sql.query(query, params);
        return this.result;
    }

    /**
     * Retorna uma entrada com o icone da Seção a qual ela pertence.
     * @param {string} eid - Identificador da Entrada a ser buscada.
     * @returns {Promise<Object>} - Uma promessa que resolve para um objeto representando a Entrada com o icone da Seção.
     */
    async getEntryWithIcon(eid) {
        let query = 'SELECT E.*, S.title AS section, C.icon FROM entry AS E ';
        query += 'INNER JOIN section AS S ON S.cid = E.cid ';
        query += 'INNER JOIN chapter AS C ON C.sid = C.sid ';
        query += 'WHERE eid = ?'
        const params = [eid];

        this.results = await uniforge.sql.query(query, params);
        return this.result;
    }

    /**
     * Recupera todas as entradas de uma seção específica.
     * 
     * @param {string} sid - O ID da seção cujas entradas devem ser recuperadas.
     * @returns {Promise<Array<Object>>} - Uma promessa que resolve para um array de objetos representando as entradas da seção.
    */
    async getEntriesFromSection(sid) {
        let query = 'SELECT * FROM entry WHERE sid = ?;';
        const params = [sid];

        this.results = await uniforge.sql.query(query, params);
        return this.result;
    }

    /**
     * Recupera a Árvore de Linhagem de um Tomo.
     * @param {string} ltid         - ID da Árvore de Linhagem.
     * @return {Promise<Object>} Retorna um objeto com as informações da Árvore de Linhagem.
     * @property {string} _id       - ID da Árvore de Linhagem.
     * @property {string} ltid      - ID da Árvore de Linhagem.
     * @property {string} sid       - ID da Seção a qual a Árvore de Linhagem pertence.
     * @property {string} founder   - ID da Entrada que serve de fundador para a Árvore de Linhagem.
     * @property {string} tree      - String contendo a estrutura da Árvore de Linhagem em FamilyScript.
     * @property {boolean} isDraft  - A Árvore de Linhagem é rascunho? (falso por padrão).
    */
    async getLineageTree(ltid) {
        let query = 'SELECT * FROM lineageTree WHERE ltid = ?;';
        const params = [ltid];

        this.results = await uniforge.sql.query(query, params);
        return this.result;
    }

    /**
     * Recupera um tipo de Árvore de Linhagem com base no ID da linhagem e na tag especificada.
     * @param {Object} data       - Os dados contendo o ID da linhagem e a tag do tipo.
     * @param {string} data.ltid  - O ID da Árvore de Linhagem.
     * @param {string} data.tag   - A tag do tipo de Árvore de Linhagem.
     * @returns {Promise<Object|null>} Retorna um objeto com as informações do tipo de Árvore de Linhagem ou null se não encontrado.
    */
    async getLineageType(data) {
        let query = 'SELECT * FROM lineageType WHERE ltid = ? AND tag = ?;';
        const params = [data.ltid, data.tag];

        this.results = await uniforge.sql.query(query, params);
        return this.result;
    }

    /**
     * Recupera uma Linha do Tempo pelo ID especificado.
     * @param {string} tid - O ID da Linha do Tempo.
     * @returns {Promise<Object|null>} Retorna um objeto com as informações da Linha do Tempo ou null se não encontrada.
    */
    async getTimeline(tid) {
        let query = 'SELECT * FROM timeline WHERE tid = ?;';
        const params = [tid];

        this.results = await uniforge.sql.query(query, params);
        return this.result;
    }

    /**
     * Retorna uma imagem associada a um uuid da tabela `_textImages`.
     * 
     * @param {string} uuid - Identificador nico da imagem.
     * 
     * @returns {Promise<Object>} - Resultado da execu o do comando.
     */
    async getTextImage(uuid) {
        let query = 'SELECT * FROM _textImages AS TI WHERE TI.uuid = ?;';
        const params = [uuid];

        this.results = await uniforge.sql.query(query, params);
        return this.result;
    }

    /**
     * Retorna todos os calendários cadastrados no banco de dados.
     * 
     * @returns {Promise<Object>} - Um objeto cujas chaves s o os IDs dos calendários e os valores s o objetos 
     *                              contendo as informa es dos calendários, incluindo os meses e os dias.
     */
    async getCalendars() {
        let query = 'SELECT * FROM calendars;';
        const rows = await uniforge.sql.query(query);
        let params = [];

        const result = {};

        for (let row of rows) {
            const data = {
                _id: Number(row.clid),
                _label: row.label,
                clid: Number(row.clid),
                label: row.label,
                months: [],
                days: [],
                daysInMonth: [],
            }

            query = 'SELECT clmid, label FROM calendarsMonths WHERE clid = ?;';
            params = [Number(row.clid)];
            const months = await uniforge.sql.query(query, params);

            for (let month of months) {
                data.months.push(month.label);

                query = 'SELECT days FROM calendarsDaysInMonths WHERE clmid = ?;';
                params = [month.clmid];
                const dayMonths = await uniforge.sql.query(query, params);
                data.daysInMonth.push(dayMonths[0].days);
            }

            query = 'SELECT label FROM calendarsDays WHERE clid = ?;';
            params = [Number(row.clid)];
            const days = await uniforge.sql.query(query, params);

            for (let day of days) {
                data.days.push(day.label);
            }

            result[Number(data.clid)] = data;
        }

        return result;
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

    /**
     * Recupera todos os Tomos.
     * @return {Promise<Array<Object>>} Retorna um array de objetos com as informações de cada Tomo.
     * @property {string} title     - Título / Identificador do Tomo.
     * @property {string} icon      - Ícone do Tomo.
     */
    async getAllTomes() {
        const query = 'SELECT * FROM tome';
        this.results = await uniforge.sql.query(query);
        return this.result.map(row => ({
            _id: row.title,
            ...row
        }));
    }

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
    async getAllChapters() {
        const query = 'SELECT * FROM chapter ORDER BY title';
        this.results = await uniforge.sql.query(query);
        return this.result.map(row => ({
            _id: row.cid,
            _label: row.title,
            ...row
        }));
    }

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
    async getAllSections() {
        const query = 'SELECT * FROM section';
        this.results = await uniforge.sql.query(query);
        return this.result.map(row => ({
            _id: row.sid,
            _label: row.title,
            ...row
        }));
    }

    /**
     * Retorna todas as categorias com suas respectivas entradas e icones.
     * @returns {Promise<Array<Object>>} - Uma promessa que resolve para um array de objetos.
     * @property {string} _id - ID da seção (sid).
     * @property {string} _label - Título da seção.
     * @property {string} icon - URL do icone da seção.
     * @property {Array<Object>} entries - Entradas da seção.
     * @property {string} _id - ID da entrada (eid).
     * @property {string} _label - Título da entrada.
     */
    async getAllSectionWithEntries() {
        query = 'SELECT S.*, C.icon FROM section AS S ';
        query += 'INNER JOIN chapter AS C ON C.cid = S.cid ';
        query += 'ORDER BY C.title, s.title;';
        this.results = await uniforge.sql.query(query);

        this.result.forEach(async row => {
            row._id = row.cid;
            row._label = row.title;
            row.entries = await this.getEntriesFromSection(row.sid);

            row.entries.forEach(entry => {
                entry._id = entry.eid;
                entry._label = entry.title;
            });
        });

        return this.result;
    }

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

    async getAllEntries() {
        const query = 'SELECT * FROM entry';
        this.results = await uniforge.sql.query(query);
        return this.result.map(row => ({
            _id: row.eid,
            _label: row.title,
            ...row
        }));
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

    /**
     * Retorna todas as entradas (com seus respectivos IDs de Seção e Categoria) 
     * juntamente com o icone da Seção a qual a entrada pertence.
     * @returns {Promise<Array<Object>>}    - Uma promessa que resolve para um array de objetos.
     * @property {string} _id               - ID da Entrada.
     * @property {string} eid               - ID da Entrada.
     * @property {string} sid               - ID da Seção a qual a Entrada pertence.
     * @property {string} cid               - ID do Capítulo a qual a Entrada pertence.
     * @property {string} title             - Título da Entrada.
     * @property {string} section           - Título da Seção a qual a Entrada pertence.
     * @property {string} icon              - URL do icone da Seção a qual a Entrada pertence.
    */
    async getAllEntriesWithIcon() {
        let query = 'SELECT E.*, S.title AS section, C.icon FROM entry AS E ';
        query += 'INNER JOIN section AS S ON S.cid = E.cid ';
        query += 'INNER JOIN chapter AS C ON C.sid = S.sid ';

        this.results = await uniforge.sql.query(query);
        return this.result;
    }

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
    async getAllEvents() {
        const query = 'SELECT * FROM event';
        this.results = await uniforge.sql.query(query);
        return this.result.map(row => ({
            _id: row.evid,
            ...row
        }));
    }


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
    async getAllLineageTrees() {
        const query = 'SELECT * FROM lineageTree';
        this.results = await uniforge.sql.query(query);
        return this.result.map(row => ({
            _id: row.ltid,
            _label: row.title,
            ...row
        }));
    }

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
    async getAllLineageTypes() {
        const query = 'SELECT * FROM lineageType';
        this.results = await uniforge.sql.query(query);
        return this.result.map(row => ({
            _id: row.tag,
            _label: row.label,
            ...row
        }));
    }


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
    async getAllTimelines() {
        const query = 'SELECT * FROM timeline';
        this.results = await uniforge.sql.query(query);
        return this.result.map(row => ({
            _id: row.tid,
            _label: row.title,
            ...row
        }));
    }

    /**
     * Recupera todas os Eventos associados a uma Linhas do Tempo.
     * @return {Promise<Array<Object>>} Retorna um array de objetos com as informações de cada Linha do Tempo.
     * @property {string} tid           - ID da Linha do Tempo.
     * @property {string} evid         - ID do Evento da Linha do Tempo.
    */
    async getAllTimelineEvents() {
        const query = 'SELECT * FROM _timelineEvent';
        this.results = await uniforge.sql.query(query);
        return this.result;
    }

    // Função para a tabela calendars
    async getAllCalendars() {
        const query = 'SELECT * FROM calendars';
        this.results = await uniforge.sql.query(query);
        return this.result.map(row => ({
            _id: Number(row.clid),
            _label: row.label,
            ...row
        }));
    }

    // Função para a tabela calendarsMonths
    async getAllCalendarsMonths() {
        const query = 'SELECT * FROM calendarsMonths';
        this.results = await uniforge.sql.query(query);
        return this.result.map(row => ({
            _id: row.clmid,
            _label: row.label,
            ...row
        }));
    }

    // Função para a tabela calendarsDays
    async getAllCalendarsDays() {
        const query = 'SELECT * FROM calendarsDays';
        this.results = await uniforge.sql.query(query);
        return this.result.map(row => ({
            _id: row.cldid,
            _label: row.label,
            ...row
        }));
    }

    // Função para a tabela calendarsDaysInMonths
    async getAllCalendarsDaysInMonths() {
        const query = 'SELECT * FROM calendarsDaysInMonths';
        this.results = await uniforge.sql.query(query);
        return this.result.map(row => ({
            _id: row.cldmid,
            ...row
        }));
    }

    // Função para a tabela _textImages
    async getAllTextImages() {
        const query = 'SELECT * FROM _textImages';
        this.results = await uniforge.sql.query(query);
        return this.result.map(row => ({
            _id: row.uuid,
            ...row
        }));
    }

    // Função para a tabela relevance
    async getAllRelevances() {
        const query = 'SELECT * FROM relevance';
        this.results = await uniforge.sql.query(query);
        return this.result.map(row => ({
            _id: row.rid,
            _label: row.title,
            ...row
        }));
    }

    /**
     * Retorna todos os Tipos de Capítulos do banco de dados.
     * 
     * @returns {Promise<Object[]>} Uma promessa que resolve em um array de objetos com
     *  os dados de cada Tipo de Capítulos encontrado no banco de dados.
     */
    async getAllChapterTypes() {
        let query = 'SELECT * FROM chapterType';
        this.results = await uniforge.sql.query(query);
        return this.result.map(row => ({
            _id: row.ctid,
            _label: row.title,
            ...row
        }));
    }

    // Função para a tabela entryTypes
    async getAllEntryTypes() {
        const query = 'SELECT * FROM entryType';
        this.results = await uniforge.sql.query(query);
        return this.result.map(row => ({
            _id: row.etid,
            _label: row.title,
            ...row
        }));
    }

    // Função para a tabela settings
    async getAllSettings() {
        const query = 'SELECT * FROM settings';
        this.results = await uniforge.sql.query(query);
        return this.result.map(row => ({
            _id: row.tag,
            _label: row.title,
            ...row
        }));
    }

    /**
     * Cria a tabela 'tome' no banco de dados.
     * 
     * Essa tabela é usada para armazenar informações sobre os Tomos.
     * 
     * @returns {Promise<void>} Uma promessa que informa se a tabela foi criada com sucesso.
     */
    async createTomeTable() {
        const query = 'CREATE TABLE IF NOT EXISTS `tome` (' +
            '`title` VARCHAR(16) NOT NULL,' + // Identificador do Tomo.
            '`label` TEXT NOT NULL,' + // Label do Tomo.
            '`icon` VARCHAR(255) NOT NULL,' + // Ícone do Tomo.
            'PRIMARY KEY (`title`))';

        this.results = await this.#execQuery(query);
        console.log('Tabela \'tome\' criada....OK.');

        return this.result;
    }

    /**
     * Cria a tabela 'chapter' no banco de dados.
     * 
     * Essa tabela é usada para armazenar informações sobre os Capítulos.
     * 
     * @returns {Promise<void>} Uma promessa que informa se a tabela foi criada com sucesso.
     */
    async createChapterTable() {
        const query = 'CREATE TABLE IF NOT EXISTS `chapter` (' +
            '`cid` VARCHAR(16) NOT NULL,' +         // Identificador do Capítulo.
            '`tome` VARCHAR(16) NOT NULL,' +        // Identificador do Tomo a que o Capítulo pertence.
            '`title` TEXT NOT NULL,' +              // Título do Capítulo.
            '`icon` VARCHAR(255) NOT NULL,' +       // Ícone do Capítulo.
            '`type` INTEGER NOT NULL,' +            // Tipo do Capítulo (material, imaterial, linhagem).
            'PRIMARY KEY (`cid`))';

        this.results = await this.#execQuery(query);
        console.log('Tabela \'chapter\' criada....OK.');

        return this.result;
    }

    /**
     * Cria a tabela 'section' no banco de dados.
     * 
     * Essa tabela é usada para armazenar informações sobre as Seções.
     * 
     * @returns {Promise<void>} Uma promessa que informa se a tabela foi criada com sucesso.
     */
    async createSectionTable() {
        const query = 'CREATE TABLE IF NOT EXISTS `section` (' +
            '`sid` VARCHAR(16) NOT NULL,' +             // Identificador da Seção.
            '`cid` VARCHAR(16) NOT NULL,' +             // Identificador do Capítulo a que a Seção pertence.
            '`title` TEXT NOT NULL,' +                  // Título da Seção.
            '`htmlString` TEXT NULL,' +                 // Corpo do texto de descrição da Seção.
            '`isDraft` BOOLEAN NOT NULL DEFAULT 0,' +   // A Seção é um rascunho (falso por padrão).
            'PRIMARY KEY (`sid`,`cid`))';

        this.results = await this.#execQuery(query);
        console.log('Tabela \'section\' criada....OK.');

        return this.result;
    }

    /**
     * Cria a tabela 'entry' no banco de dados.
     * 
     * Essa tabela é usada para armazenar informações sobre as Entradas.
     * 
     * @returns {Promise<void>} Uma promessa que informa se a tabela foi criada com sucesso.
     */
    async createEntryTable() {
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

        this.results = await this.#execQuery(query);
        console.log('Tabela \'entry\' criada....OK.');

        return this.result;
    }

    /**
     * Cria a tabela 'event' no banco de dados.
     * 
     * Essa tabela é usada para armazenar informações sobre os Eventos.
     * 
     * @returns {Promise<void>} Uma promessa que informa se a tabela foi criada com sucesso.
     */
    async createEventTable() {
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

        this.results = await this.#execQuery(query);
        console.log('Tabela \'event\' criada....OK.');

        return this.result;
    }

    /**
     * Cria a tabela 'lineageTree' no banco de dados.
     * 
     * Essa tabela é usada para armazenar informações sobre as Linhagens.
     * 
     * @returns {Promise<void>} Uma promessa que informa se a tabela foi criada com sucesso.
     */
    async createLineageTreeTable() {
        const query = 'CREATE TABLE IF NOT EXISTS `lineageTree` (' +
            '`ltid` VARCHAR(16) NOT NULL,' +            // Identificador da Linhagem.
            '`sid` VARCHAR(16) NOT NULL,' +             // Identificador da Seção a que a Linhagem pertence.
            '`title` TEXT NOT NULL,' +                  // Título da Árvore.
            '`founder` VARCHAR(16) NOT NULL,' +         // Fundador da Linhagem (Identificador daprimeira Primeira da linhagem).
            '`tree` TEXT NOT NULL,' +                   // Árvore da Linhagem (Utilizado o formato 'FamilyScript').        
            '`isDraft` BOOLEAN NULL DEFAULT 0,' +   // A linhagem é um rascunho (falso por padrão).
            'PRIMARY KEY (`ltid`,`sid`))';

        this.results = await this.#execQuery(query);
        console.log('Tabela \'lineageTree\' criada....OK.');

        return this.result;
    }


    /**
     * Cria a tabela 'lineageType' no banco de dados.
     * 
     * Essa tabela é usada para armazenar tipos de entradas de uma Linhagem.
     * Cada tipo de linhagem é identificado por um identificador único combinado da Linhagem (ltid)
     * com a tag do Tipo.
     * 
     * @returns {Promise<void>} Uma promessa que informa se a tabela foi criada com sucesso.
    */
    async createLineageTypeTable() {
        const query = 'CREATE TABLE IF NOT EXISTS `lineageType` (' +
            '`ltid` VARCHAR(16) NOT NULL,' +            // Identificador da Linhagem.
            '`tag` VARCHAR(5) NOT NULL,' +              // Identificador da Seção a que a Linhagem pertence.
            '`label` VARCHAR(255) NOT NULL,' +          // Fundador da Linhagem (Identificador daprimeira Primeira da linhagem).        
            'PRIMARY KEY (`tag`))';

        this.results = await this.#execQuery(query);
        console.log('Tabela \'lineageType\' criada....OK.');

        return this.result;
    }

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
    async createTimelineTable() {
        const query = 'CREATE TABLE IF NOT EXISTS `timeline` (' +
            '`tid` VARCHAR(16) NOT NULL,' +             // Identificador da Linha do Tempo.        
            '`title` TEXT NOT NULL,' +                  // Título da Linha do Tempo.        
            '`flavor` TEXT NOT NULL,' +                 // Descrição adicional da Linha do Tempo.          
            'PRIMARY KEY (`tid`))';

        this.results = await this.#execQuery(query);
        console.log('Tabela \'timeline\' criada....OK.');

        return this.result;
    }
    /**
     * Cria a tabela '_timelineEvent' no banco de dados.
     *
     * Essa tabela é usada para armazenar a relação entre Linhas do Tempo e Eventos.
     * Cada registro associa um identificador de Linha do Tempo (tid) a um identificador de Evento (evid).
     *
     * @returns {Promise<void>} Uma promessa que informa se a tabela foi criada com sucesso.
     */
    async createTimelineEventsTable() {
        const query = 'CREATE TABLE IF NOT EXISTS `_timelineEvent` (' +
            '`tid` VARCHAR(16) NOT NULL,' +             // Identificador da Linha do Tempo.
            '`evid` VARCHAR(16) NOT NULL,' +            // Identificador do Evento.
            'PRIMARY KEY (`tid`, `evid`))';

        this.results = await this.#execQuery(query);
        console.log('Tabela \'_timelineEvent\' criada....OK.');

        return this.result;
    }


    /**
     * Cria a tabela '_textImages' no banco de dados.
     * 
     * Essa tabela é usada para armazenar imagens dos textos de cada Entrada e Seção.
     * Cada registro associa um identificador único (uuid) a uma imagem binária (BLOB) e a sua extensão.
     * 
     * @returns {Promise<void>} Uma promessa que informa se a tabela foi criada com sucesso.
     */
    async createTextImagesTable() {
        const query = 'CREATE TABLE IF NOT EXISTS `_textImages` (' +
            '`uuid` VARCHAR(16) NOT NULL,' +                // Identificador da Linhagem.        
            '`raw` BLOB NOT NULL,' +                        // Árvore da Linhagem (Utilizado o formato 'FamilyScript').        
            '`ext` VARCHAR(5) NOT NULL DEFAULT `jpeg`,' +   // A linhagem é um rascunho (falso por padrão).
            'PRIMARY KEY (`uuid`))';

        this.results = await this.#execQuery(query);
        console.log('Tabela \'_textImages\' criada....OK.');

        return this.result;
    }

    /**
     * Cria a tabela 'entryType' no banco de dados.
     * 
     * Essa tabela é usada para armazenar informações sobre os Tipos de Entrada.
     * Primeiro, remove a tabela existente caso ela exista, e então cria uma nova tabela.
     * 
     * @returns {Promise<Object>} Uma promessa que informa as alterações realizadas no banco de dados.
    */
    async createEntryTypeTable() {
        let query = 'DROP TABLE IF EXISTS entryType';
        this.results = await this.#execQuery(query);

        query = 'CREATE TABLE IF NOT EXISTS `entryType` (' +
            '`etid` INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,' +  // Identificador dos Tipos de Entrada.        
            '`title` TEXT NOT NULL,' +                              // Título do Tipo de Entrada.
            '`icon` VARCHAR(255) NULL,' +                           // Ícone do Tipo de Entrada.
            '`isMaterial` BOOLEAN NOT NULL DEFAULT 1,' +            // A Seção é material (true por padrão).
            'UNIQUE (`etid`))';

        this.results = await this.#execQuery(query);
        console.log('Tabela \'entryType\' criada....OK.');

        return this.result;
    }

    /**
     * Cria a tabela 'relevance' no banco de dados.
     * 
     * Essa tabela é usada para armazenar informações sobre a relevância de um evento de uma Timeline.
     * Primeiro, remove a tabela existente caso ela exista, e então cria uma nova tabela.
     * 
     * @returns {Promise<Object>} Uma promessa que informa as alterações realizadas no banco de dados.
    */
    async createRelevanceTable() {
        let query = 'DROP TABLE IF EXISTS relevance';
        let changes = 0;
        this.results = await this.#execQuery(query);

        query = 'CREATE TABLE IF NOT EXISTS `relevance` (' +
            '`rid` INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,' +   // Identificador da Relevância.        
            '`title` VARCHAR(255) NULL,' +                          // Título da Relevância.        
            'UNIQUE (`rid`))';

        this.results = await this.#execQuery(query);
        console.log('Tabela \'relevance\' criada....OK.');

        return this.result;
    }

    /**
     * Popula a tabela 'entryType' com registros de Tipos de Entradas.
     * 
     * @returns {Promise<Object>} Uma promessa que informa se a tabela foi populada com sucesso, com o número de alterações.
     */
    async populateTomeTable() {
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

            this.results = await this.#execQuery(query, params);
        });
        console.log('Tabela \'tome\' populada....OK.');

        return this.result;
    }
    /**
     * Popula a tabela 'entryType' com registros de Tipos de Entradas.
     * 
     * @returns {Promise<Object>} Uma promessa que informa se a tabela foi populada com sucesso, com o número de alterações.
     */
    async populateEntryTypeTable() {
        console.log('Populando tabela \'entryType\'....');

        const entryTypes = [
            {
                title: 'Artigo Genérico',
                icon: 'fas fa-newspaper',
                isMaterial: 0
            },
            {
                title: 'Boato',
                icon: 'fas fa-comments',
                isMaterial: 0
            },
            {
                title: 'Descoberta',
                icon: 'fas fa-book-open-reader',
                isMaterial: 0
            },
            {
                title: 'Evento',
                icon: 'fas fa-calendar-day',
                isMaterial: 0
            },
            {
                title: 'Relato',
                icon: 'fas fa-message',
                isMaterial: 0
            },
            {
                title: 'Documento',
                icon: 'fas fa-file',
                isMaterial: 1
            },
            {
                title: 'Objeto',
                icon: 'fas fa-hammer',
                isMaterial: 1
            },
            {
                title: 'Pessoa',
                icon: 'fas fa-user-large',
                isMaterial: 1
            }
        ];

        let query = 'INSERT INTO entryType (title, icon, isMaterial) ';
        query += 'VALUES (?,?,?);';

        entryTypes.forEach(async entryType => {
            let params = [];

            params.push(entryType.title);
            params.push(entryType.icon);
            params.push(entryType.isMaterial);

            this.results = await this.#execQuery(query, params);
        });
        console.log('Tabela \'entryType\' populada....OK.');
        return this.result;
    }
    /**
     * Popula a tabela 'relevance' com registros de relevância de entradas.
     * 
     * @returns {Promise<Object>} Uma promessa que informa se a tabela foi populada com sucesso, com o número de alterações.
     */
    async populateRelevanceTable() {
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

            this.results = await this.#execQuery(query, params);
        });
        console.log('Tabela \'relevance\' populada....OK.');
        return this.result;
    }

    /**
     * Cria a tabela 'settings' no banco de dados.
     * 
     * Essa tabela é usada para armazenar configurações do sistema.
     * Cada configuração é identificada por um nome (tag) e pelo grupo ao qual pertence.
     * O valor da configuração é armazenado na coluna 'value'.
     * 
     * @returns {Promise<Object>} Uma promessa que informa se a tabela foi criada com sucesso, com o número de alterações.
     */
    async createSettingsTable() {
        let query = 'CREATE TABLE IF NOT EXISTS settings (tag VARCHAR(50) PRIMARY KEY NOT NULL,' +
            '\"group\" VARCHAR(50) NOT NULL,' +     // Grupo de configuração
            'value TEXT NOT NULL)';             // Valor da configuração

        this.results = await this.#execQuery(query);
        console.log('Tabela \'settings\' criada....OK.');

        return this.result;
    }

    /**
     * Cria a tabela 'calendars' no banco de dados.
     * 
     * Essa tabela é usada para armazenar informações sobre os calendários.
     * Cada calendário é identificado por um título (label) e um identificador (clid).
     * 
     * @returns {Promise<Object>} Uma promessa que informa se a tabela foi criada com sucesso, com o número de alterações.
     */
    async createCalendarTable() {
        let query = 'CREATE TABLE IF NOT EXISTS calendars (clid INTEGER PRIMARY KEY,' +
            'label TEXT)';                 // Título do calendário

        this.results = await this.#execQuery(query);
        console.log('Tabela \'calendar\' criada....OK.');

        return this.result;
    }

    /**
     * Cria a tabela 'calendarsMonths' no banco de dados.
     * 
     * Essa tabela é usada para armazenar informações sobre os meses dos calendários.
     * Cada mês é identificado por um título (label) e o identificador do calendário ao qual pertence (clid).
     * 
     * @returns {Promise<Object>} Uma promessa que informa se a tabela foi criada com sucesso, com o número de alterações.
     */
    async createMonthsTable() {
        let query = 'CREATE TABLE IF NOT EXISTS calendarsMonths (clmid INTEGER PRIMARY KEY,' +
            'clid INTEGER,' +
            'label TEXT)';                 // Título do MÊS do calendário


        this.results = await this.#execQuery(query);
        console.log('Tabela \'calendarsMonths\' criada....OK.');

        return this.result;
    }

    /**
     * Cria a tabela 'calendarsDays' no banco de dados.
     * 
     * Essa tabela é usada para armazenar informações sobre os dias dos calendários.
     * Cada dia é identificado por um título (label) e o identificador do calendário ao qual pertence (clid).
     * 
     * @returns {Promise<Object>} Uma promessa que informa se a tabela foi criada com sucesso, com o número de alterações.
     */
    async createDaysTable() {
        let query = 'CREATE TABLE IF NOT EXISTS calendarsDays (cldid INTEGER PRIMARY KEY,' +
            'clid INTEGER,' +
            'label TEXT)';                 // Título do DIAS do calendário

        this.results = await this.#execQuery(query);
        console.log('Tabela \'calendarsDays\' criada....OK.');

        return this.result;
    }

    /**
     * Cria a tabela 'calendarsDaysInMonths' no banco de dados.
     * 
     * Essa tabela é usada para armazenar informações sobre os dias por mês dos calendários.
     * Cada registro é identificado por um identificador (cldmid) e o identificador do mês ao qual pertence (clmid).
     * O número de dias por mês é armazenado na coluna 'days'.
     * 
     * @returns {Promise<Object>} Uma promessa que informa se a tabela foi criada com sucesso, com o número de alterações.
     */
    async createDaysInMonthsTable() {
        let query = 'CREATE TABLE IF NOT EXISTS calendarsDaysInMonths (cldmid INTEGER PRIMARY KEY,' +
            'clmid INTEGER,' +
            'days INTEGER)';                // Número de DIAS por MÊS do calendário

        this.results = await this.#execQuery(query);
        console.log('Tabela \'calendarsDaysInMonths\' criada....OK.');

        return this.result;
    }

    /**
     * Executa uma consulta SQL no banco de dados.
     * @param {string} query - A consulta SQL a ser executada.
     * @param {Array} [params=[]] - Parâmetros opcionais para a consulta.
     * @returns {Object} - Resultado da execução.
     * @throws {Error} - Caso ocorra algum erro no banco de dados.
     */
    async #execQuery(query, params = []) {
        // Verifica se a transação é única, nesse caso, limpa o estado atual.
        if (!this.transactionStarted) this.clear();

        let result = null;
        // É uma consulta com parâmetros.
        if (params.length > 0) {
            result = await uniforge.sql.exec(query, params);
        } else {
            result = await uniforge.sql.exec(query);
        }

        // Se é uma transação única com o Banco de Dados, atualiza a base de dados.
        if(!this.transactionStarted) {
            // Independente do resultado se deve atualizar a base de dados.
            await this.rebuildDocs();
        }

        // Retorna o resultado da consulta.
        return result;
    }

    /**
     * Valida se os dados de um Capítulo são válidos.
     * @param {Object} data - Dados do Capítulo a ser validado.
     * @returns {string} - Erro(s) encontrado(s) ou uma string vazia se a Seção for válida.
     */
    validateChapter(data) {

        if (data.tome?.isEmpty())
            return 'É necessário informar um Tomo para o Capítulo.';
        if (data.title?.isEmpty())
            return 'É necessário informar um Título válido para o Capítulo.';
        if (data.icon?.isEmpty())
            return 'É necessário informar um Ícone válido para o Capítulo.';
        if (data.type === '0')
            return 'É necessário informar um Tipo válido o Capítulo.';

        return '';
    }

    /**
     * Valida se os dados de uma Seção são válidos.
     * @param {Object} data - Dados da Seção a ser validado.
     * @returns {string} - Erro(s) encontrado(s) ou uma string vazia se a Seção for válida.
     */
    validateSection(data) {

        if (data.sid?.isEmpty())
            return 'O identificador da Seção não pode ser vazio.';
        if (data.cid.isEmpty())
            return 'O identificador de Capítulo da Seção não pode ser vazio.';
        if (data.title.isEmpty())
            return 'É necessário informar um título válido para a Categoria.';

        return '';
    }

    /**
     * Valida se os dados de um Entrada são válidos.
     * @param {Object} entry - Dados da Entrada a ser validado.
     * @returns {string} - Erro(s) encontrado(s) ou uma string vazia se a Entrada for válido.
     */
    validateEntry(entry) {

        if (entry.eid?.isEmpty())
            return 'O identificador da Entrada não pode ser vazio.';
        if (entry.sid?.isEmpty())
            return 'O identificador de Seção não pode ser vazio.';
        if (!entry.etid)
            return 'É necessário selecionar um Tipo de Entrada.';
        if (entry.title?.isEmpty())
            return 'É necessário informar um título válido para a Entrada.';
        return '';
    }

    /**
     * Valida se os dados de um Evento são válidos.
     * @param {Object} event - Dados do Evento a ser validado.
     * @returns {string} - Erro(s) encontrado(s) ou uma string vazia se o Evento for válido.
     */
    validateEvent(event) {
        if (event.sid?.isEmpty())
            return 'O identificador de Seção do Evento é inválido.';
        if (!event.etid)
            return 'É necessário selecionar um Tipo de Entrada para o Evento.';
        if (event.title?.isEmpty())
            return 'É necessário informar um título válido para o Evento.';
        if (!event.relevance)
            return 'É necessário informar a Relevância do Evento.';
        if (!event.clid)
            return 'É necessário informar um Calendário válido para o Evento.';
        if (!event.s_day || !event.s_year)
            return 'Um Evento deve informar uma data inicial.';
        if (event.s_year == 0)
            return 'Um Evento deve informar uma data inicial. O ano informado é inválido.';
        if (event.s_month < 0)
            return 'Um Evento deve informar uma data inicial. O mês informado é inválido.';
        if (!event.s_day || event.s_day < 1)
            return 'Um Evento deve informar uma data inicial. O dia informado é inválido.';
        return '';
    }

    /**
     * Valida se os dados de uma Linha do Tempo são válidos.
     * @param {Object} timeline - Dados da Linha do Tempo a ser validada.
     * @returns {string} - Erro(s) encontrado(s) ou uma string vazia se a Linha do Tempo for válida.
     */
    validateTimeline(timeline) {
        if (timeline.title?.isEmpty())
            return 'É necessário informar um título válido para a Linha do Tempo.';
        if (timeline.events.size < 1)
            return 'A Linha do Tempo deve conter pelo menos um Evento.';
        return '';
    }

    /**
     * Valida se os dados de um Evento de Linhagem são válidos.
     * @param {Object} data - Dados do Evento a ser validado.
     * @returns {string} - Erro(s) encontrado(s) ou uma string vazia se o Evento for válido.
     */
    validateLineage(data) {
        if (data.sid.isEmpty())
            return 'O identificador de Seção da Linhagem é inválido.';
        if (data.title.isEmpty())
            return 'É necessário informar um título válido para a Linhagem.';
        if (!data.founder)
            return 'É necessário informar o Fundador da Linhagem.';
        if (!data.tree)
            return 'É necessário informar o familyScript da Árvore da Linhagem.';

        return '';
    }

    /**
     * Valida se os dados de uma Entrada de Política são válidos.
     * @param {Object} data - Dados da Entrada a ser validada.
     * @returns {string} - Erro(s) encontrado(s) ou uma string vazia se a Entrada for válida.
     */
    validatePolitics(data) {

        if (data.sid.isEmpty())
            return 'O identificador de Seção da Entrada é inválido.';
        if (data.title.isEmpty())
            return 'É necessário informar um título válido para a Entrada.';
        if (!data.etid)
            return 'É necessário selecionar um Tipo de Entrada para a Entrada.';

        return '';
    }

    /**
     * Gera um identificador único aleatório (UUID) em formato de string de 16 caracteres.
     * @returns {string} O UUID gerado.
     */
    generateID() {
        return uniforge.utils.randomID();
    }

    buildUpdateSet(columns, updateOptions = {}) {
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

    buildWhereClause(conditions) {
        const whereClause = conditions
            .filter(([column, value]) => column.trim() && value !== null && value !== undefined && value !== '') // Remove colunas ou valores vazios
            .map(([column, value]) => `${column} = ${typeof value === 'string' ? `'${value}'` : value}`) // Formata cada dupla
            .join(' AND '); // Junta tudo com ' AND '
        return whereClause;
    }

    /**
    * Recria o conjunto de dados (Set) baseado nos dados atuais do banco de dados.
    * 
    * @async
    * @returns {Promise<void>}
    */
    async rebuildDocs() {
        console.log('UniForge | Recriando base de dados....');
        const data = await DBDocuments.UniForgeData();
        uniforge.doc = new DBDocuments(data);
    }
}