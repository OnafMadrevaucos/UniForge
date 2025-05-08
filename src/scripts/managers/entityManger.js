import EntrySearchDialog from "../../models/dialogs/entrySearchDialog.js";
import { BaseManager } from "./baseManager.js";
import dTree from "../../common/d3-tree/dtree.mjs";
import CustomDate from "../../common/primitives/date.mjs";

export default class EntityManager extends BaseManager {
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

    treeContainerId = '#treeContainer';

    /**
     * Objeto privado que gerencia os indivíduos (nós) e relacionamentos (galhos) de uma família.
    */
    #tree = {
        root: null,
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
            nodeMinHeight: 50,
            styles: {
                node: 'node',
                linage: 'linage',
                marriage: 'marriage',
                text: 'node-text'
            }
        };
        /*return {
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
        };*/
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
        const data = this._getNodeData();
        const container = this.treeContainer;

        if (data.length > 0) {
            const seed = this.getSeed();
            //const seed = await dSeeder.seed(data, this.Tree.root ,this.seedConfig);
            container.classList.remove('empty');

            this.diagram = dTree.init(seed, this.diagramConfig);
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

    getSeed() {
        const tree = this.#tree;
        const nodes = Object.values(tree.nodes);
        const branches = tree.branches;
        const root = tree.nodes[tree.root];

        // Cria um objeto que mapeia os IDs dos nós para os objetos de nó
        const nodeMap = {};
        nodes.forEach(node => {
            nodeMap[node.id] = node;
        });

        // Função recursiva para percorrer a árvore
        function recursiveCall(node, depthOffset) {
            const n = {
                name: node.givenName,
                depthOffset: depthOffset,
                marriages: [],
                extra: {
                    status: node.title,
                    gender: node.gender,
                    born: node.birthDate,
                    death: node.deathDate,
                }
            };

            // Etapa 1: Busca relacionamentos do tipo 'mate'
            branches.forEach(branch => {
                if (branch.type === 'mate' && (branch.id1 === node.id || branch.id2 === node.id)) {
                    const spouseId = branch.id1 === node.id ? branch.id2 : branch.id1;
                    const spouseNode = nodeMap[spouseId];

                    const spouseMates = branches                    
                    .map(b => {
                        if (b.type === 'mate' && (b.id1 === spouseId || b.id2 === spouseId) && (b.id1 !== node.id && b.id2 !== node.id)) {
                            if(b.id1 !== spouseNode.id && b.id1 !== node.id) {
                                return b.id1;
                            } else if(b.id2 !== spouseNode.id && b.id2 !== node.id) {
                                return b.id2;
                            }
                            return;
                        }
                    }).filter((b) => b !== undefined && b !== null);

                    const spouseChild = branches                    
                    .map(b => {
                       if(b.type === 'genitor' && b.id1 === spouseId) return b.id2;
                       else return;
                    }).filter((b) => b !== undefined && b !== null);

                    const marriage = {
                        spouse: {
                            name: spouseNode.givenName,
                            extra: {
                                status: spouseNode.title,
                                gender: spouseNode.gender,
                                born: spouseNode.birthDate,
                                death: spouseNode.deathDate,
                                others: {
                                    spouseMates: spouseMates,
                                    spouseChild: spouseChild
                                }
                            }
                        },
                        children: []
                    };

                    n.marriages.push(marriage);
                }
            });

            // Etapa 2: Busca relacionamentos do tipo 'genitor'
            branches.forEach(branch => {
                if (branch.type === 'genitor' && branch.id1 === node.id) {
                    const childId = branch.id2;
                    const childNode = nodeMap[childId];

                    const childD3Node = recursiveCall(childNode, depthOffset + 1);
                    // Encontra o marriage onde o childNode deve ser incluído
                    const marriage = n.marriages.find(marriage => {
                        const spouse = nodes.find(genitor => {
                            if (genitor.id !== node.id && (childNode.genitors.a === genitor.id || childNode.genitors.b === genitor.id)) return genitor;
                        })
                        return spouse.givenName === marriage.spouse.name;
                    });

                    if (marriage) {
                        marriage.children.push(childD3Node);
                    }
                }
            });

            return n;
        }
        // Percorre a árvore de forma recursiva
        const data = [recursiveCall(root, 1)];

        return data;
    }

    addNode(entry, isRoot = false) {
        const tree = this.#tree;

        const node = {
            id: entry.id ?? entry.eid,
            givenName: entry.givenName,
            birthDate: entry.birthDate ?? '00010101',
            deathDate: entry.deathDate ?? '00010101',
            gender: entry.gender ?? 'n',
            title: entry.title ?? '',
            group: entry.group ?? '',
            groupOrder: entry.groupOrder ?? 0,
            genitors: entry.genitors ?? {},
            deceased: entry.deceased ?? false,
            isRoot: isRoot,
            hasImg: (entry.img ? true : false)
        }

        let line = `i${node.id}`;

        if (!node.givenName?.isEmpty()) line += `\tp${node.givenName}`;
        if (!node.title?.isEmpty()) line += `\tT${node.title}`;
        if (!node.birthDate?.isEmpty()) line += `\tb${node.birthDate}`;
        if (!node.deathDate?.isEmpty()) line += `\td${node.deathDate}`;
        if (!node.gender?.isEmpty()) line += `\tg${node.gender}`;
        if (!node.group?.isEmpty()) line += `\tq${node.group}`;
        if (!node.groupOrder?.toString().isEmpty()) line += `\tO${node.groupOrder}`;

        // A raiz da árvore não tem genitores.
        if (!isRoot) {
            if (!node.genitors.a?.isEmpty()) line += `\tm${node.genitors.a}`;
            if (!node.genitors.b?.isEmpty()) line += `\tf${node.genitors.b}`;
        }

        if (node.deceased) line += `\tz1`;
        if (node.hasImg) line += `\tr1`;

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
                const node = { id, genitors: {}, hasImg: false };

                facts.forEach(fact => {
                    const tag = fact[0];
                    const data = fact.substring(1);

                    switch (tag) {
                        case 'p':
                            node.givenName = data;
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
                            node.birthDate = this._formatDate(data);
                            break;
                        case 'z':
                            node.deceased = (data === '1');
                            break;
                        case 'd':
                            node.deathDate = this._formatDate(data);
                            break;
                        case 'm': {
                            node.genitors.a = data;
                            tree.branches.push({ id1: data, id2: id, type: 'genitor' });
                        } break;
                        case 'f': {
                            node.genitors.b = data;
                            tree.branches.push({ id1: data, id2: id, type: 'genitor' });
                        } break;
                        case 's':
                            node.partner = data;
                            break;
                        case 'r':
                            node.hasImg = true;
                            break;
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
                            branch.partners = data;
                            break;
                        case 'g':
                            branch.status = data;
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

    /**
     * Gera um identificador único aleatório de 5 caracteres para uma entrada na árvore.
     * 
     * @returns {string} O identificador único gerado.
     * @private 
     */
    _generateID() {
        return uniforge.utils.generateRandomString(5, false, true);
    }

    _formatDate(dateStr) {
        const dateParts = dateStr.match(/(\d{4})(\d{2})(\d{2})/);
        if (dateParts) {
            return `${dateParts[3]}/${dateParts[2]}/${dateParts[1]}`;
        } else {
            return dateStr; // ou throw new Error("Formato de data inválido")
        }
    }

    _getNodeData() {
        // Obtém a árvore de linhagem atual.
        const tree = this.#tree;
        // Obtém o node raiz da árvore.
        const root = tree.root;
        // Verifica se a árvore de linhagem está vazia.
        if (!tree || Object.keys(tree.nodes).length === 0) return [];

        this._setNodeTiers(tree.nodes[root]);
        const nodes = Object.values(tree.nodes);

        let data = [];
        nodes.forEach(node => {
            const n = {
                'id': node.id,
                'name': node.givenName,
                "parent1Id": node.genitors.a ?? null,
                "parent2Id": node.genitors.b ?? null,
                'status': node.title,
                'surname': node.surnameNow,
                'gender': node.gender,
                'born': node.birthDate,
                'death': node.deathDate,
                'tier': node.tier ?? this.MAX_TIER

            };

            data.push(n);
        });

        return data;
    }

    _getLinkData(id) {
        // Obtém a árvore de linhagem atual.
        const tree = this.#tree;
        // Verifica se a árvore de linhagem está vazia.
        if (!tree || tree.branches.length === 0) return [];

        const branches = tree.branches.filter(branch => branch.id2 === id);

        let data = [];
        branches.forEach(branch => {
            const status = branch.status;
            const b = {
                from: branch.id1,
                to: branch.id2,
                type: (branch.type === 'mate' ? ((status === 'm' || status === 'e' || status === 'r') ? 'actual' : 'ended') : 'child'),
            };

            data.push(b);
        });

        return data;
    }

    _setNodeTiers(node, tier = this.MAX_TIER, visited = new Set()) {
        // Evita loops infinitos verificando se o nó já foi visitado.
        if (!node || visited.has(node.id)) {
            return;
        }
        // Avisa do limite máximo (9999) de níveis de uma árvore.
        if (tier < 0) {
            this.msgBox.showWarning('Limite máximo dos níveis da árvore atingido. Nós subsequentes serão truncados.');
            tier = 0;
        }

        visited.add(node.id);
        node.tier = tier;

        console.log(`Visitando nó: ${node.id} - ${node.givenName} ${node.surnameNow}`);

        // Encontra todos os branches que começam com o nodeId atual
        const connectedBranches = this.#tree.branches.filter(branch => branch.id1 === node.id);

        for (const branch of connectedBranches) {
            const { id2, type } = branch;

            if (type === 'mate') {
                this._setNodeTiers(this.#tree.nodes[id2], tier, visited);
            } else if (type === 'genitor') {
                this._setNodeTiers(this.#tree.nodes[id2], tier - 1, visited);
            }
        }
    }

    _renderText(name, extra, textClass) {
        if (name.isEmpty() || !extra) return '';

        const text = document.createElement('div');
        text.classList.add(textClass, 'flexcol');

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

        if(extra.others) {
             
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

        const iconMap = {
            'king': 'fa-chess-king',
            'queen': 'fa-chess-queen',
            'civilian': 'fa-user',
            'princess': 'fa-crown'
        }

        const icon = document.createElement('div');
        icon.classList.add('node-icon');
        icon.innerHTML = `<i class="fas ${iconMap[extra.status]}"></i>`; ;
        node.appendChild(icon);

        const text = textRenderer(name, extra, textClass);
        node.appendChild(text);

        return node.outerHTML;
    }

    _onNodeClick(name, extra) {
        console.log(name);
    }
}