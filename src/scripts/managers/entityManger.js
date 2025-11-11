import EntrySearchDialog from "../../models/dialogs/entrySearchDialog.js";
import { BaseManager } from "./baseManager.js";
import dTree from "../../common/d3-tree/dtree.mjs";
import CustomDate from "../../common/primitives/date.mjs";

export default class EntityManager extends BaseManager {
    testScript = 'iR3QK8\tpLucas\tTking\tlRodrigues Macedo\tgm\tmOLP90\tfA334F\tb19921222\td21921222\n' +
        'iDKP41\tpJéssica Cristina\tTqueen\tlCarvalho Silva\tgf\tb19910725\n' +
        'iST78B\tpAlisson José\tTcivilian\tlLima\tgm\tb19920206\n' +
        'iPWAN7\tpEmilly Suzane\tlSilva Lima\tTprincess\tgf\tb20100428\tmDKP41\tfST78B\tO1\n' +
        'iQS44D\tpAmanda\tlRodrigues Macedo\tTprincess\tgf\tmOLP90\tfA334F\tb19941004\n' +
        'iA334F\tpRodrigo\tlde Oliveira Macedo\tTcivilian\tgm\tb19650404\n' +
        'iOLP90\tpMaryleila\tlde Moura Rodrigues Macedo\tTqueen\tgf\tmE4FT6\tb19630907\n' +
        'iE4FT6\tpHerminia da Glória\tlMoura Rodrigues\tTqueen\tgf\tb19390828\n' +
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

    treeContainerId = '#treeContainer';

    /**
     * Objeto privado que gerencia os indivíduos (nós) e relacionamentos (galhos) de uma família.
    */
    #tree = {
        root: '',
        nodes: {},
        branches: []
    };

    get MAX_TIER() { return 99999; }

    get seedConfig() {
        const MAX_TIER = this.MAX_TIER;
        return {
            extra: (member) => {
                return {
                    'status': member.status,
                    'surname': member.surname,
                    'gender': member.gender,
                    'born': member.born,
                    'death': member.death,
                    'tier': member.tier
                };
            }
        };
    }

    get diagramConfig() {
        return {
            target: this.treeContainerId,
            debug: false,
            width: 600,
            height: 600,
            hideMarriageNodes: true,
            marriageNodeSize: 10,
            callbacks: {
                nodeClick: this._onNodeClick,
                textRenderer: this._renderText,
                nodeRenderer: this._renderNode
            },
            margin: {
                top: 0,
                right: 0,
                bottom: 0,
                left: 0
            },
            nodeWidth: 150,
            nodeMinHeight: 65,
            styles: {
                node: 'node',
                linage: 'linage',
                marriage: 'marriage',
                text: 'node-text'
            }
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

    get treeContainer() {
        return this.form.querySelector(this.treeContainerId);
    }

    set Root(value) {
        this.#tree.root = value;
        this.addNode(value, true);
    }

    /**
     * Constroe a Árvore de Linhagem no diagram de fluxograma.
     * @param {HTMLElement} container - O elemento HTML que irá conter o diagram de fluxograma.
    */
    async buildTree() {
        const seed = this._growSeed();
        const root = this.#tree.nodes[this.#tree.root];
        const container = this.treeContainer;

        if (seed.length > 0) {
            container.classList.remove('empty');

            this.diagram = dTree.init(root, seed, this.diagramConfig);
        } else {
            container.classList.add('empty');
            container.innerHTML = '';
        }

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
            this.diagram = null;

            const container = this.treeContainer;
            container.innerHTML = '';
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

        const id = uniforge.utils.randomString(5, false, true); 

        if(isRoot) {
            tree.root = id;
        }

        const node = new TreeNode({
            id: id,
            eid: entry.eid,
            name: entry.title ?? '',
            extra: {
                title: entry.title ?? '',
                gender: entry.gender ?? 'm',
                genitors: {
                    a: null,
                    b: null
                },
                group: entry.group ?? null,
                groupOrder: entry.groupOrder ?? 0,
                born: entry.birthDate ?? 'Desc.',
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
        // Se nenhuma data foi fornecida, ignora.
        if (!data) return null;

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

                if (branch.partners?.isEmpty()) line += `\te${branch.partners}`;
                if (branch.status?.isEmpty()) line += `\tg${branch.status}`;
                if (branch.startDate?.isEmpty()) line += `\tb${branch.startDate}`;
                if (branch.endDate?.isEmpty()) line += `\tz${branch.endDate}`;

                scriptLines.push(line);
            }
        });

        return scriptLines.join("\n");
    }

    _growSeed() {
        if (!this.#tree.root) throw new Error('Não é possível gerar a árvore sem uma raiz.');

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

        return Object.values(seed);
    }

    _getNodesDepth(node, depthOffset = 0) {
        // Verifica se o Nó existe.
        if(!node) return;

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


    _formatDate(dateStr) {
        const dateParts = dateStr.match(/(\d{4})(\d{2})(\d{2})/);
        if (dateParts) {
            return `${dateParts[3]}/${dateParts[2]}/${dateParts[1]}`;
        } else {
            return dateStr; // ou throw new Error("Formato de data inválido")
        }
    }

    _renderText(name, extra, textClass) { 
        const text = document.createElement('div');
        text.classList.add(textClass, 'flexcol');

        // Se o nome estiver vazio ou não houver extra, retorna o <div> vazio.
        if (name.isEmpty() || !extra) return text;

        const nameSpan = document.createElement('span');
        nameSpan.innerHTML = name;

        const dateDiv = document.createElement('div');
        dateDiv.classList.add('node-dates', 'flexrow');

        const bornDate = document.createElement('span');
        bornDate.innerHTML = `<i class="fas fa-hourglass-start"></i> ${extra.born}`;
        dateDiv.appendChild(bornDate);

        if (extra.death) {
            const deathDate = document.createElement('span');
            deathDate.innerHTML = `<i class="fas fa-hourglass-end"></i> ${extra.death}`;
            dateDiv.appendChild(deathDate);
        }

        const genderSpan = document.createElement('span');
        genderSpan.classList.add('node-gender', extra.gender === 'm' ? 'male' : 'female');
        genderSpan.innerHTML = extra.gender === 'm' ? 'Masc.' : 'Fem.';        

        text.appendChild(nameSpan);
        text.appendChild(dateDiv);
        text.appendChild(genderSpan);

        return text;
    }

    _renderNode(name, x, y, width, height, extra, id, nodeClass, textClass, textRenderer) {
        const node = document.createElement('div');
        node.classList.add(nodeClass, 'flexrow');        
        node.id = 'node' + id;
        node.dataset.id = id;
        node.tabIndex = 0;

        // Sinalize que o Node é um node de uma entidade morta.
        if(extra.deceased) node.classList.add('deceased');

        const iconMap = {
            'king': 'fa-chess-king',
            'queen': 'fa-chess-queen',
            'civilian': 'fa-user',
            'princess': 'fa-crown',
        }

        const icon = document.createElement('div');
        icon.classList.add('node-icon');
        icon.innerHTML = `<i class="fas ${extra.deceased ? 'fa-skull' : iconMap[extra.title]}"></i>`;;
        node.appendChild(icon);

        const text = textRenderer(name, extra, textClass);
        node.appendChild(text);

        return node.outerHTML;
    }

    _onNodeClick(name, extra, id) {
        const selectedNode = document.getElementById('node' + id);
        const alreadeSelected = selectedNode.classList.contains('selected');
        
        const nodes = document.querySelectorAll('.node');
        nodes.forEach(node => node.classList.remove('selected'));               

        if(!alreadeSelected) selectedNode.classList.add('selected');

        const actionButtons = document.querySelectorAll('.tree-editor .action-buttons button');
        actionButtons.forEach(button => button.disabled = alreadeSelected);         
    }

    _onAddMateClick(event) {
        event.stopPropagation();
        const node = event.target.closest('.node');
        
        console.log('Adicionar Parceiro');
    }

    _onAddChildrenClick(event) {
        event.stopPropagation();
        const node = event.target.closest('.node');
        
        console.log('Adicionar Filhos');
    }
}

class TreeNode {
    constructor(data) {
        this.#id = data.id ?? null;
        this.#eid = data.eid ?? null;
        this.#name = data.name ?? null;
        this.#depthOffset = data.depthOffset ?? 0;
        this.#marriages = data.marriages ?? [];
        this.#extra = data.extra ?? this.#extra;
    }
    #id = null;
    #eid = null;
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
    get eid() { return this.#eid; }
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