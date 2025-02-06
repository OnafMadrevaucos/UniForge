import { BaseManager } from "./baseManager.js";

export default class FamilyManager extends BaseManager {
    /**
     * Objeto privado que gerencia os indivíduos e relacionamentos de uma família.
    */
    #tree = {
        individuals: {},
        branches: []
    };

    /**
     * Obtém a árvore que representa uma família, que consiste em um objeto com duas propriedades:
     * - Individuals: um array de objetos, cada um representando um indivíduo.
     * - Branches: um array de objetos, cada um representando uma relação entre dois indivíduos.
     * @type {Object}
     * @property {Array<Object>} individuals - Array de objetos, cada um representando um indivíduo da familia.
     * @property {Array<Object>} branches - Array de objetos, cada um representando uma relação entre dois indivíduos da familia.
     */
    get Tree() {
        return this.#tree;
    }    

    /**
     * Adiciona um novo indivíduo à árvore que representa uma família.
     * 
     * @param {Object} individual - O objeto que representa o indivíduo a ser adicionado.
     * @param {string} individual.givenName - O nome do indivíduo.
     * @param {string} individual.nickName - O apelido do indivíduo.
     * @param {string} individual.title - O título do indivíduo.
     * @param {string} individual.suffix - O sufixo do indivíduo.
     * @param {string} individual.surnameNow - O sobrenome atual do indivíduo.
     * @param {string} individual.surnameAtBirth - O sobrenome de nascimento do indivíduo.
     * @param {string} individual.gender - O gênero do indivíduo.
     * @param {Date} individual.birthDate - A data de nascimento do indivíduo (YYYYMMDD).
     * @param {boolean} individual.deceased - Um booleano que indica se o indivíduo está falecido.
     * @param {Date} individual.deathDate - A data de morte do indivíduo (YYYYMMDD).
     * @param {string} [individual.genitors.a] - O genitor A do indivíduo.
     * @param {string} [individual.genitors.b] - O genitor B do indivíduo. 
     * @param {string} individual.partner - O parceiro atual do indivíduo. 
     */
    newIndividual(person) {
        person.id = this._generateID();
        this.#tree.individuals[person.id] = person;

        return person.id;
    }

    /**
     * Adiciona um novo relacionamento à árvore que representa uma família.
     * 
     * @param {Object} branch                   - O objeto que representa o relacionamento a ser adicionado.
     * @param {string} branch.ids               - Uma string contendo os IDs dos indivíduos envolvidos no relacionamento separados por '|'.
     * @param {string} branch.partners          - 1 para duas pessoas que já foram parceiras em algum momento.
                                                  2 para duas pessoas que são parceiras atualmente.
     * @param {string} branch.type              - O tipo de relacionamento (spouse ou parent-child).
     * @param {Date} [branch.startDate]         - A data de início do relacionamento (YYYYMMDD).
     * @param {Date} [branch.endDate]           - A data de término do relacionamento (YYYYMMDD). 
     */
    newBranch(branch) {        
        this.#tree.branches.push(branch);
    }

    /**
     * Analisa um texto no formado FamilyScript e o converte em um objeto JavaScript.
     * O objeto contém dois membros: `individuals` (um objeto cujas chaves são os IDs
     * dos indivíduos e cujos valores são objetos representando as informações
     * sobre cada indivíduo) e `relationships` (uma lista de objetos representando
     * as relações entre os indivíduos).
     * Cada objeto de indivíduo contém as seguintes propriedades:
     * - `id`: o ID do indivíduo
     * - `givenNames`: o(s) nome(s) do indivíduo
     * - `nickname`: o apelido do indivíduo
     * - `title`: o título do indivíduo
     * - `suffix`: o sufixo do indivíduo
     * - `surnameNow`: o sobrenome atual do indivíduo
     * - `surnameAtBirth`: o sobrenome de nascimento do indivíduo
     * - `gender`: o gênero do indivíduo (M ou F)
     * - `birthDate`: a data de nascimento do indivíduo
     * - `deceased`: um booleano indicando se o indivíduo está falecido
     * - `deathDate`: a data de morte do indivíduo
     * - `mother`: o ID da mãe do indivíduo
     * - `father`: o ID do pai do indivíduo
     * - `currentPartner`: o ID do parceiro atual do indivíduo
     * Cada objeto de relação contém as seguintes propriedades:
     * - `id1`: o ID de um dos indivíduos envolvidos
     * - `id2`: o ID do outro indivíduo envolvido
     * - `type`: o tipo de relação 
     * @param {string} data - O script de família em formato de texto.
     */
    fromFamilyScript(data) {
        const lines = data.split(/\r?\n/);
        const tree = {
            individuals: {},
            branches: []
        };

        lines.forEach(line => {
            if (line.startsWith('i')) {
                // Linha que representa um indivíduo
                const [idPart, ...facts] = line.split('\t');
                const id = idPart.substring(1);
                const person = { id };

                facts.forEach(fact => {
                    const tag = fact[0];
                    const data = fact.substring(1);

                    switch (tag) {
                        case 'p':
                            person.givenName = data;
                            break;
                        case 'N':
                            person.nickName = data;
                            break;
                        case 'T':
                            person.title = data;
                            break;
                        case 'J':
                            person.suffix = data;
                            break;
                        case 'l':
                            person.surnameNow = data;
                            break;
                        case 'q':
                            person.surnameAtBirth = data;
                            break;
                        case 'g':
                            person.gender = data;
                            break;
                        case 'b':
                            person.birthDate = data;
                            break;
                        case 'z':
                            person.deceased = data === '1';
                            break;
                        case 'd':
                            person.deathDate = data;
                            break;                        
                        case 'm':
                            person.person.genitors.a = data;
                            break;
                        case 'f':
                            person.person.genitors.b = data;
                            break;
                        case 's':
                            person.partner = data;
                            break;
                        case 'O':
                            person.birthOrder = data;
                            break;
                        default:
                            // Ignorar tags não reconhecidas
                            break;
                    }
                });

                tree.individuals[id] = person;
            } else if (line.startsWith('p')) {
                // Linha que representa uma relação entre indivíduos.
                const [relationshipPart, ...facts] = line.split('\t');
                const [id1, id2] = relationshipPart.substring(1).split(' '); // IDs das pessoas envolvidas.
                const branch = { id1, id2 };

                facts.forEach(fact => {
                    const tag = fact[0];
                    const data = fact.substring(1);

                    switch (tag) {
                        case 'e':
                            branch.partners = data;
                            break;
                        case 'g':
                            branch.type = data;
                            break;                            
                        case 'b':
                            branch.startDate = data;
                            break;                                                
                        case 'z':
                            branch.endDate = data;
                            break;
                        default:
                            // Ignorar tags não reconhecidas.
                            break;
                    }
                });

                tree.branches.push(branch);
            }
        });

        this.#tree = tree;
    }

    /**
     * Converte um objeto de família para o formato FamilyScript que pode ser salvo em um arquivo.
     * 
     * @param {Object} familyObject - O objeto de família a ser convertido.
     * @returns {string} - O string em FamilyScript.
    */
    toFamilyScript() {
        let scriptLines = [];

        // Processar indivíduos.
        Object.values(this.#tree.individuals).forEach(person => {
            let line = `i${person.id}`;

            if (person.givenName?.isEmpty()) line += `\tp${person.givenName}`;
            if (person.nickName?.isEmpty()) line += `\tN${person.nickName}`;
            if (person.title?.isEmpty()) line += `\tT${person.title}`;
            if (person.suffix?.isEmpty()) line += `\tJ${person.suffix}`;
            if (person.surnameNow?.isEmpty()) line += `\tl${person.surnameNow}`;
            if (person.surnameAtBirth?.isEmpty()) line += `\tq${person.surnameAtBirth}`;
            if (person.gender?.isEmpty()) line += `\tg${person.gender}`;
            if (person.birthDate?.isEmpty()) line += `\tb${person.birthDate}`;
            if (person.deathDate?.isEmpty()) line += `\td${person.deathDate}`;
            if (person.deceased?.isEmpty()) line += `\tz1`;            
            if (person.genitors.a?.isEmpty()) line += `\tm${person.genitors.a}`;
            if (person.genitors.b?.isEmpty()) line += `\tf${person.genitors.b}`;
            if (person.partner?.isEmpty()) line += `\ts${person.partner}`;
            if (person.birthOrder?.isEmpty()) line += `\tO${person.birthOrder}`;

            scriptLines.push(line);
        });

        // Processar relacionamentos.
        this.#tree.branches.forEach(branch => {
            let line = `p${branch.id1} ${branch.id2}`;

            if (branch.partners?.isEmpty()) line += `\te${branch.partners}`;
            if (branch.type?.isEmpty()) line += `\tg${branch.type}`;
            if (branch.startDate?.isEmpty()) line += `\tb${branch.startDate}`;            
            if (branch.endDate?.isEmpty()) line += `\tz${branch.endDate}`;

            scriptLines.push(line);
        });

        return scriptLines.join("\n");
    }


    /**
     * Gera um identificador único aleatório de 5 caracteres para uma entrada na árvore.
     * 
     * @returns {string} O identificador único gerado.
     * @private 
     */
    _generateID() {
        return uniforge.utils.generateRandomString(5, false, true);
    }
}