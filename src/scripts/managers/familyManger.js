import { BaseManager } from "./baseManager.js";

export default class FamilyManager extends BaseManager {
    constructor(container) {
        super();
        this.treeContainer = container;
    }
    testScript = 'iR3QK8\tpLucas\tTSr\tlCarvalho Macedo\tqRodrigues Macedo\tgm\tb19921222\n' +
        'iDKP41\tpJéssica Cristina\tTSra\tlCarvalho Silva\tgf\tb19910725\n' +
        'iPWAN7\tpEmilly Suzane\tlSilva Lima\tgf\tb20100428\tmDKP41\tO1\n' +
        'pR3QK8 DKP41\te2\tgm\tb20250510\n';
    /**
     * Objeto privado que gerencia os indivíduos (nós) e relacionamentos (galhos) de uma família.
    */
    #tree = {
        nodes: {},
        branches: []
    };

    /**
     * Obtém a árvore que representa uma família, que consiste em um objeto com duas propriedades:
     * - nodes: um array de objetos, cada um representando um indivíduo.
     * - Branches: um array de objetos, cada um representando uma relação entre dois indivíduos.
     * @type {Object}
     * @property {Array<Object>} nodes - Array de objetos, cada um representando um indivíduo da familia.
     * @property {Array<Object>} branches - Array de objetos, cada um representando uma relação entre dois indivíduos da familia.
     */
    get Tree() {
        return this.#tree;
    }

    nodePositions = {};

    /**
     * Adiciona um novo indivíduo à árvore que representa uma família.
     * 
     * @param {Object} node - O objeto que representa o indivíduo a ser adicionado.
     * @param {string} node.givenName - O nome do indivíduo.
     * @param {string} node.nickName - O apelido do indivíduo.
     * @param {string} node.title - O título do indivíduo.
     * @param {string} node.suffix - O sufixo do indivíduo.
     * @param {string} node.surnameNow - O sobrenome atual do indivíduo.
     * @param {string} node.surnameAtBirth - O sobrenome de nascimento do indivíduo.
     * @param {string} node.gender - O gênero do indivíduo.
     * @param {Date} node.birthDate - A data de nascimento do indivíduo (YYYYMMDD).
     * @param {boolean} node.deceased - Um booleano que indica se o indivíduo está falecido.
     * @param {Date} node.deathDate - A data de morte do indivíduo (YYYYMMDD).
     * @param {string} [node.genitors.a] - O genitor A do indivíduo.
     * @param {string} [node.genitors.b] - O genitor B do indivíduo. 
     * @param {string} node.partner - O parceiro atual do indivíduo. 
     */
    newNode(node) {
        node.id = this._generateID();
        this.#tree.nodes[node.id] = node;

        return node.id;
    }

    /**
     * Adiciona um novo relacionamento à árvore que representa uma família.
     * 
     * @param {Object} branch                   - O objeto que representa o relacionamento a ser adicionado.
     * @param {string} branch.ids               - Uma string contendo os IDs dos indivíduos envolvidos no relacionamento separados por ' '.
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
     * O objeto contém dois membros: `nodes` (um objeto cujas chaves são os IDs
     * dos indivíduos e cujos valores são objetos representando as informações
     * sobre cada indivíduo) e `branchs` (uma lista de objetos representando
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
            nodes: {},
            branches: []
        };

        lines.forEach(line => {
            if (line.startsWith('i')) {
                // Linha que representa um indivíduo
                const [idPart, ...facts] = line.split('\t');
                const id = idPart.substring(1);
                const node = { id, genitors: {} };

                facts.forEach(fact => {
                    const tag = fact[0];
                    const data = fact.substring(1);

                    switch (tag) {
                        case 'p':
                            node.givenName = data;
                            break;
                        case 'N':
                            node.nickName = data;
                            break;
                        case 'T':
                            node.title = data;
                            break;
                        case 'J':
                            node.suffix = data;
                            break;
                        case 'l':
                            node.surnameNow = data;
                            break;
                        case 'q':
                            node.surnameAtBirth = data;
                            break;
                        case 'g':
                            node.gender = data;
                            break;
                        case 'b':
                            node.birthDate = data;
                            break;
                        case 'z':
                            node.deceased = data === '1';
                            break;
                        case 'd':
                            node.deathDate = data;
                            break;
                        case 'm':
                            node.genitors.a = data;
                            break;
                        case 'f':
                            node.genitors.b = data;
                            break;
                        case 's':
                            node.partner = data;
                            break;
                        case 'O':
                            node.birthOrder = data;
                            break;
                        default:
                            // Ignorar tags não reconhecidas
                            break;
                    }
                });

                tree.nodes[id] = node;
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
        Object.values(this.#tree.nodes).forEach(node => {
            let line = `i${node.id}`;

            if (node.givenName?.isEmpty()) line += `\tp${node.givenName}`;
            if (node.nickName?.isEmpty()) line += `\tN${node.nickName}`;
            if (node.title?.isEmpty()) line += `\tT${node.title}`;
            if (node.suffix?.isEmpty()) line += `\tJ${node.suffix}`;
            if (node.surnameNow?.isEmpty()) line += `\tl${node.surnameNow}`;
            if (node.surnameAtBirth?.isEmpty()) line += `\tq${node.surnameAtBirth}`;
            if (node.gender?.isEmpty()) line += `\tg${node.gender}`;
            if (node.birthDate?.isEmpty()) line += `\tb${node.birthDate}`;
            if (node.deathDate?.isEmpty()) line += `\td${node.deathDate}`;
            if (node.deceased?.isEmpty()) line += `\tz1`;
            if (node.genitors.a?.isEmpty()) line += `\tm${node.genitors.a}`;
            if (node.genitors.b?.isEmpty()) line += `\tf${node.genitors.b}`;
            if (node.partner?.isEmpty()) line += `\ts${node.partner}`;
            if (node.birthOrder?.isEmpty()) line += `\tO${node.birthOrder}`;

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

    renderTree() {
        const nodes = this.Tree.nodes; 

        // Encontrar a raiz da árvore
        const root = Object.values(nodes).find(
            (node) => (!node.genitors.a && !node.genitors.b)
        );

        const treeNode = document.createElement("div");
        treeNode.classList.add("tree-node");
        treeNode.classList.add("tier-0");

        this._generateTree(root.id, uniforge.utils.deepClone(nodes), treeNode, 0);
    }

    _findChildren(genitorId) {
        const nodes = this.Tree.nodes;
        return Object.values(nodes).filter((node) => node.genitors.a === genitorId || node.genitors.b === genitorId);
    };

    _findPartner(nodeId) {
        const branches = this.Tree.branches; 
        const partners = [];
        Object.values(branches).forEach((branch) => {
            if (branch.id1 === nodeId) {
                partners.push(branch.id2);
            } else if (branch.id2 === nodeId) {
                partners.push(branch.id1);
            }
        })
        return partners;
    }

    _generateTree(nodeId, nodes, treeNode, tier) {
        const node = nodes[nodeId];
        if (!node) return;

        if (!treeNode) {
            treeNode = document.createElement("div");
            treeNode.classList.add("tree-node");
            treeNode.classList.add(`tier-${tier}`);
        }

        const partners = this._findPartner(nodeId);
        const children = this._findChildren(nodeId);        

        treeNode.appendChild(this._generateNode(node));
        delete nodes[nodeId];

        if (partners.length > 0) {
            partners.forEach((partner) => {
                this._generateTree(partner, nodes, treeNode, tier);
            })            
        }       

        if (children.length > 0) {
            children.forEach((child) => {
                this._generateTree(child.id, nodes, null, tier + 1);
            });
        }       

        this.treeContainer.appendChild(treeNode);
    };

    _generateNode(node) {
        const nodeElement = document.createElement("div");
        nodeElement.classList.add("node");

        nodeElement.innerHTML = `
            <strong>${node.givenName || "Unknown"}</strong><br>
            ${node.surnameNow || ""} (${node.gender || "?"})<br>
            ${node.birthDate || ""} - ${node.deathDate || ""}
        `;

        return nodeElement;
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