import EntrySearchDialog from "../../models/dialogs/entrySearchDialog.js";
import { BaseManager } from "./baseManager.js";

export default class LineageManager extends BaseManager {
    testScript = 'iR3QK8\tpLucas\tTking\tlRodrigues Macedo\tgm\tmOLP90\tfA334F\tb19921222\n' +
        'iDKP41\tpJéssica Cristina\tTqueen\tlCarvalho Silva\tgf\tb19910725\n' +
        'iST78B\tpAlisson José\tTcivilian\tlLima\tgm\tb19920206\n' +
        'iPWAN7\tpEmilly Suzane\tlSilva Lima\tTprincess\tgf\tb20100428\tmDKP41\tfST78B\tO1\n' +
        'iQS44D\tpAmanda\tlRodrigues Macedo\tTprincess\tgf\tmOLP90\tfA334F\tb19941004\n' +
        'iA334F\tpRodrigo\tlde Oliveira Macedo\tTcivilian\tgm\tb19650404\n' +
        'iOLP90\tpMaryleila\tlde Moura Rodrigues Macedo\tTqueen\tgf\tb19630907\n' +
        'pR3QK8 DKP41\te2\tgm\tb20250510\n' +
        'pDKP41 ST78B\te1\tgs\tb20090428\tz20130614\n' +
        'pA334F OLP90\te2\tgm\tb19910629\n';

    noLinksTestScript = 'iR3QK8\tpLucas\tTking\tlRodrigues Macedo\tgm\tb19921222\n' +
        'iDKP41\tpJéssica Cristina\tTqueen\tlCarvalho Silva\tgf\tb19910725\n' +
        'iST78B\tpAlisson José\tTcivilian\tlLima\tgm\tb19920206\n' +
        'iPWAN7\tpEmilly Suzane\tlSilva Lima\tTprincess\tgf\tb20100428\n' +
        'iQS44D\tpAmanda\tlRodrigues Macedo\tTprincess\tgf\tb19941004\n' +
        'iA334F\tpRodrigo\tlde Oliveira Macedo\tTcivilian\tgm\tb19650404\n' +
        'iOLP90\tpMaryleila\tlde Moura Rodrigues Macedo\tTqueen\tgf\tb19630907\n';

    /**
     * Objeto privado que gerencia os indivíduos (nós) e relacionamentos (galhos) de uma família.
    */
    #tree = {
        root: null,
        nodes: {},
        branches: []
    };

    get MAX_TIER() { return 99999; }

    get editorConfig() {
        return {
            layout: new go.LayeredDigraphLayout({
                direction: 90,
                nodeSpacing: 20,
                layerSpacing: 50,
                setsPortSpots: false, // Permite que os links se conectem em qualquer ponto do nó.
                initializeOption: go.LayeredDigraphInit.DepthFirstOut,
                layeringOption: go.LayeredDigraphLayering.LongestPathSource,
                alignOption: go.LayeredDigraphAlign.UpperRight,
                assignLayers: function () {
                    const vertices = this.network.vertexes;
                    vertices.each(vertex => {
                        vertex.layer = vertex.node.data.tier;
                    });
                }
            }),
            'toolManager.hoverDelay': 100
        };
    }

    get Root() {
        return this.#tree.root;
    }

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

    set Root(value) {
        this.#tree.root = value;
        this.addNode(value, true);
    }

    /**
     * Constroe a Árvore de Linhagem no diagram de fluxograma.
     * @param {HTMLElement} container - O elemento HTML que irá conter o diagram de fluxograma.
     */
    buildTree() {
        const seed = this._growSeed();

        this.diagram = null;
        return this.diagram;
    }

    refreshTree() {
        // Verifica se o diagrama foi inicializado.
        if (this.diagram) {
            // Limpa o diagrama atual.
            this.clearTree();

            // Cria um novo diagrama.
            this.buildTree();
        }
    }

    clearTree(cleardata = false) {
        // Limpa o diagrama atual, caso haja um inicializado.
        if (this.diagram) {
            this.diagram.clear();
            this.diagram.div = null; // Limpa a referência ao diagrama.          
        }

        if (cleardata) {
            this.#tree = {
                root: null,
                nodes: {},
                branches: []
            };
        }
    }

    addNode(entry, isRoot = false) {
        const tree = this.#tree;

        const node = new TreeNode({
            id: entry.id ?? entry.eid,
            name: entry.givenName,
            extra: {
                title: entry.title ?? null,
                gender: entry.gender ?? 'm',
                genitors: {
                    a: null,
                    b: null
                },
                group: entry.group ?? null,
                groupOrder: entry.groupOrder ?? 0,
                born: entry.birthDate ?? null,
                death: entry.deathDate ?? null,
                deceased: entry.deceased ?? false
            }
        });

        let line = `i${node.id}`;

        if (!node.name?.isEmpty()) line += `\tp${node.name}`;
        if (!node.title?.isEmpty()) line += `\tT${node.title}`;
        if (!node.born?.isEmpty()) line += `\tb${node.born}`;
        if (!node.death?.isEmpty()) line += `\td${node.death}`;
        if (!node.gender?.isEmpty()) line += `\tg${node.gender}`;
        if (!node.group?.isEmpty()) line += `\tq${node.group}`;
        if (!node.groupOrder?.toString().isEmpty()) line += `\tO${node.groupOrder}`;

        // A raiz da árvore não tem genitores.
        if (!isRoot) {
            if (!node.genitors.a?.isEmpty()) line += `\tm${node.genitors.a}`;
            if (!node.genitors.b?.isEmpty()) line += `\tf${node.genitors.b}`;
        }

        if (node.deceased) line += `\tz1`;

        tree.nodes[node.id] = node;

        this.refreshTree();
        return line;
    }

    removeNode(eid) {
        const tree = this.#tree;
        const node = tree.nodes[eid];

        if (node) {
            // Remove o nó da árvore.
            delete tree.nodes[eid];

            // Remove os branches relacionados ao nó.
            tree.branches = tree.branches.filter(branch => branch.id1 !== eid && branch.id2 !== eid);
        }

        this.refreshTree();
        return true;
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
            root: 'A334F',
            nodes: {},
            branches: []
        };

        lines.forEach(line => {
            if (line.startsWith('i')) {
                // Linha que representa um indivíduo
                const [idPart, ...facts] = line.split('\t');
                const id = idPart.substring(1);
                const node = new TreeNode({ id: id });

                facts.forEach(fact => {
                    const tag = fact[0];
                    const data = fact.substring(1);

                    switch (tag) {
                        case 'p':
                            node.name = data;
                            break;
                        case 'T':
                            node.title = data;
                            break;
                        case 'q':
                            node.group = data;
                            break;
                        case 'g':
                            node.gender = data;
                            break;
                        case 'b':
                            node.born = this._formatDate(data);
                            break;
                        case 'd':
                            node.death = this._formatDate(data);
                            node.deceased = true;
                            break;
                        case 'm': {
                            node.genitors.a = data;
                            tree.branches.push({ id1: data, id2: id, type: 'genitor' });
                        } break;
                        case 'f': {
                            node.genitors.b = data;
                            tree.branches.push({ id1: data, id2: id, type: 'genitor' });
                        } break;
                        case 'O':
                            node.groupOrder = data;
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
                const branch = { id1, id2, type: 'mate' };

                facts.forEach(fact => {
                    const tag = fact[0];
                    const data = fact.substring(1);

                    switch (tag) {
                        case 'e':
                            branch.status = data;
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

        tree.branches.sort((a, b) => {
            if (a.type !== 'genitor' && b.type === 'genitor') {
                return -1;
            } else if (a.type === 'genitor' && b.type !== 'genitor') {
                return 1;
            } else {
                return 0;
            }
        });

        this.#tree = tree;
    }

    /**
     * Converte um objeto de família para o formato FamilyScript que pode ser salvo em um arquivo.
     * 
     * @param {Object} treeObject - O objeto de Árvore a ser convertido.
     * @returns {string} - O string em FamilyScript.
    */
    toFamilyScript() {
        let scriptLines = [];

        // Processar indivíduos.
        Object.values(this.#tree.nodes).forEach(node => {
            const line = this.addNode(node, node.isRoot);
            scriptLines.push(line);
        });

        // Processar relacionamentos de parceiros (mesma camada hieráquica).
        this.#tree.branches.forEach(branch => {
            let line = `p${branch.id1} ${branch.id2}`;

            if (branch.type === 'mate') {

                if (branch.status?.isEmpty()) line += `\te${branch.status}`;
                if (branch.type?.isEmpty()) line += `\tg${branch.type}`;
                if (branch.startDate?.isEmpty()) line += `\tb${branch.startDate}`;
                if (branch.endDate?.isEmpty()) line += `\tz${branch.endDate}`;

                scriptLines.push(line);
            }
        });

        return scriptLines.join("\n");
    }

    _formatDate(dateStr) {
        const dateParts = dateStr.match(/(\d{4})(\d{2})(\d{2})/);
        if (dateParts) {
            return `${dateParts[3]}/${dateParts[2]}/${dateParts[1]}`;
        } else {
            return dateStr; // ou throw new Error("Formato de data inválido")
        }
    }

    _growSeed() {
        const seed = this.#tree.nodes;
        const branches = this.#tree.branches;

        branches.forEach((branch) => {
            const type = branch.type;

            if (type === 'genitor') {
                const genitor = seed[branch.id1];
                const child = seed[branch.id2];

                // Busca o outro genitor da Criança.
                const otherBranch = branches.find((b) => b.type === 'genitor' && b.id2 === child.id && b.id1 !== genitor.id);
                const otherGenitor = otherBranch ? seed[otherBranch.id1] : null;

                // Se houver, adiciona a criança ao casamento do genitor.
                if (otherGenitor) {
                    let marriageAdded = false;
                    genitor.marriages.forEach((marriage) => {
                        if (marriage.spouse.id === otherGenitor.id) {
                            marriage.children.push(child);
                            marriageAdded = true;
                        }
                    });

                    if (!marriageAdded) {
                        otherGenitor.marriages.forEach((marriage) => {
                            if (marriage.spouse.id === otherGenitor.id) {
                                marriage.children.push(child);
                            }
                        });
                    }
                } else { // Se não houver, cria um casamento inativo para adicionar a criança.
                    const marriage = {
                        spouse: null,
                        children: [child],
                        active: false
                    };
                    genitor.marriages.push(marriage);
                }

            } else {
                const node1 = seed[branch.id1];
                const node2 = seed[branch.id2];

                let spouseDuplicated = false;
                node2.marriages.forEach((marriage) => {
                    if (marriage.spouse.id === node1.id) {
                        spouseDuplicated = true;
                    }
                });

                if (!spouseDuplicated) {
                    const marriage = {
                        spouse: node2,
                        children: [],
                        active: (branch.status === '2')
                    };

                    node1.marriages.push(marriage);
                }
            }
        });

        this._getNodesDepth(seed[this.#tree.root]);

        return seed;
    }

    _getNodesDepth(node, depthOffset = 0) {
        node.depthOffset = depthOffset;

        if (node.marriages) {
            node.marriages.forEach((marriage) => {
                if (marriage.spouse) {
                    marriage.spouse.depthOffset = depthOffset;
                    this._getNodesDepth(marriage.spouse, depthOffset);
                }

                if (marriage.children) {
                    marriage.children.forEach((child) => {
                        child.depthOffset = depthOffset + 1;
                        this._getNodesDepth(child, depthOffset + 1);
                    });
                }
            });
        }
    }
}

class TreeNode {
    constructor(data) {
        this.#id = data.id ?? null;
        this.#name = data.name ?? null;
        this.#depthOffset = data.depthOffset ?? 0;
        this.#marriages = data.marriages ?? [];
        this.#extra = data.extra ?? this.#extra;
    }
    #id = null;
    #name = null;
    #depthOffset = 0;
    #marriages = [];
    #extra = {
        title: null,
        gender: null,
        genitors: {
            a: null,
            b: null
        },
        group: null,
        groupOrder: 0,
        born: null,
        death: null,
        deceased: false
    };

    get id() { return this.#id; }
    get name() { return this.#name; }
    get depthOffset() { return this.#depthOffset; }
    get marriages() { return this.#marriages; }
    get extra() { return this.#extra; }
    get title() { return this.#extra.title; }
    get gender() { return this.#extra.gender; }
    get genitors() { return this.#extra.genitors; }
    get group() { return this.#extra.group; }
    get groupOrder() { return this.#extra.groupOrder; }
    get born() { return this.#extra.born; }
    get death() { return this.#extra.death; }
    get deceased() { return this.#extra.deceased; }

    set id(value) { this.#id = value; }
    set name(value) { this.#name = value; }
    set depthOffset(value) { this.#depthOffset = value; }
    set marriages(value) { this.#marriages = value; }
    set extra(value) { this.#extra = value; }
    set title(value) { this.#extra.title = value; }
    set gender(value) { this.#extra.gender = value; }
    set genitors(value) { this.#extra.genitors = value; }
    set group(value) { this.#extra.group = value; }
    set groupOrder(value) { this.#extra.groupOrder = value; }
    set born(value) { this.#extra.born = value; }
    set death(value) { this.#extra.death = value; }
    set deceased(value) { this.#extra.deceased = value; }
}

/**
 * [
{
    "name": "Father", // The name of the node
    "class": "node", // The CSS class of the node
    "textClass": "nodeText", // The CSS class of the text in the node
    "depthOffset": 1, // Generational height offset
    "marriages": [
    { // Marriages is a list of nodes
        "spouse":
        { // Each marriage has one spouse
            "name": "Mother",
        },
        "children": [
        { // List of children nodes
            "name": "Child",
        }]
    }],
    "extra":
    {} // Custom data passed to renderers
}]
 */