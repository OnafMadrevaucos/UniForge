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
            nodeMinHeight: 65,
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
        const seed = Object.values(this.#tree.nodes);
        const container = this.treeContainer;

        if (seed.length > 0) {
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

    addNode(entry, isRoot = false) {
        const tree = this.#tree;

        const node = {
            id: entry.id ?? entry.eid,
            name: entry.givenName,
            depthOffset: 0,
            marriages: [],
            extra: {
                born: entry.birthDate ?? '00010101',
                death: entry.deathDate ?? '00010101',
                gender: entry.gender ?? 'n',
                title: entry.title ?? '',
                group: entry.group ?? '',
                groupOrder: entry.groupOrder ?? 0,
                genitors: entry.genitors ?? { a: null, b: null },
                deceased: entry.deceased ?? false,
                isRoot: isRoot,
            }
        }

        let line = `i${node.id}`;

        if (!node.name?.isEmpty()) line += `\tp${node.givenName}`;
        if (!node.extra.title?.isEmpty()) line += `\tT${node.extra.title}`;
        if (!node.extra.born?.isEmpty()) line += `\tb${node.extra.born}`;
        if (!node.extra.death?.isEmpty()) line += `\td${node.extra.death}`;
        if (!node.extra.gender?.isEmpty()) line += `\tg${node.extra.gender}`;
        if (!node.extra.group?.isEmpty()) line += `\tq${node.extra.group}`;
        if (!node.extra.groupOrder?.toString().isEmpty()) line += `\tO${node.extra.groupOrder}`;

        // A raiz da árvore não tem genitores.
        if (!isRoot) {
            if (!node.extra.genitors.a?.isEmpty()) line += `\tm${node.extra.genitors.a}`;
            if (!node.extra.genitors.b?.isEmpty()) line += `\tf${node.extra.genitors.b}`;
        }

        if (node.extra.deceased) line += `\tz1`;

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
            const node = {
                id: null,
                name: null,
                depthOffset: 0,
                marriages: [],
                extra: {
                    status: null,
                    gender: null,
                    born: null,
                    genitors: {
                        a: null,
                        b: null
                    },
                    deceased: false,
                    death: null,
                    group: null
                }
            };

            if (line.startsWith('i')) {
                // Linha que representa um indivíduo
                const [idPart, ...facts] = line.split('\t');
                const id = idPart.substring(1);
                node.id = id;

                facts.forEach(fact => {
                    const tag = fact[0];
                    const data = fact.substring(1);

                    switch (tag) {
                        case 'p':
                            node.name = data;
                            break;
                        case 'T':
                            node.extra.status = data;
                            break;
                        case 'q':
                            node.extra.group = data;
                            break;
                        case 'g':
                            node.extra.gender = data;
                            break;
                        case 'b':
                            node.extra.born = this._formatDate(data);
                            break;
                        case 'z':
                            node.extra.deceased = (data === '1');
                            break;
                        case 'd':
                            node.extra.death = this._formatDate(data);
                            break;
                        case 'm': {
                            node.extra.genitors.a = data;
                            tree.branches.push({ id1: data, id2: id, type: 'genitor' });
                        } break;
                        case 'f': {
                            node.extra.genitors.b = data;
                            tree.branches.push({ id1: data, id2: id, type: 'genitor' });
                        } break;
                        case 's':
                            const marriage = {
                                spouse: {
                                    id: data
                                },
                                children: [],
                                type: null
                            }

                            // Verifica se o parceiro ja possui casamento com o node atual.
                            const partnerAlreadyHas = this.tree.nodes.find((node) => {
                                // Encontra o node do parceiro.
                                const partner = this.tree.nodes[data];
                                // Percorre os casamentos do parceiro em busca do node atual.
                                return partner.marriages.find((marriage) => {
                                    return (marriage.spouse.id === node.id);
                                })
                            });

                            // Se o parceiro ainda não possui casamento com o node atual, adiciona o casamento no node atual.
                            if (!partnerAlreadyHas) {
                                node.marriages.push(marriage);
                            }
                            break;
                        case 'O':
                            node.extra.order = data;
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
                            const ative = (data === '2');

                            const node1 = tree.nodes[id1];
                            const node2 = tree.nodes[id2];

                            var marriageFound = false;

                            // Verifica se o casamento ja foi adicionado no node 1.
                            node1.marriages.forEach((marriage) => {
                                // Verifica se o casamento é com o node 2. 
                                if (marriage.spouse.id === node2.id) {
                                    // Marca o casamento como seu status atual (active).
                                    marriage.active = ative;
                                    // Sinaliza que o casamento foi encontrado e não precisa ser procurado no node 2.                                    
                                    marriageFound = true;
                                }
                            })

                            // Caso o casamento ainda não tenha sido adicionado no node 1, verifica no node 2.
                            if (!marriageFound) {
                                node2.marriages.forEach((marriage) => {
                                    // Verifica se o casamento é com o node 1. 
                                    if (marriage.spouse.id === node1.id) {
                                        // Marca o casamento como seu status atual (active).
                                        marriage.active = ative;
                                        // Sinaliza que o casamento foi encontrado e não precisa ser procurado no node 2.                                    
                                        marriageFound = true;
                                    }
                                })
                            }

                            // Caso o casamento ainda não tenha sido adicionado no node 1 ou no node 2, adiciona o casamento no node 1.
                            if (!marriageFound) {
                                node1.marriages.push({ spouse: node2, active: ative, children: [] });
                            }

                            branch.partners = data;

                            break;
                        case 'g':
                            // Verifica se o node possui casamentos.
                            if (node.marriages.length > 0) {
                                // Percorre os casamentos do node se ele for o id1 ou o id2.
                                if (id1 === node.id) {
                                    node.marriages.forEach((marriage) => {
                                        if (marriage.spouse.id === id2) {
                                            marriage.status = data;
                                        }
                                    });
                                } else if (id2 === node.id) {
                                    node.marriages.forEach((marriage) => {
                                        if (marriage.spouse.id === id1) {
                                            marriage.status = data;
                                        }
                                    });
                                }
                            }
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

        // Registra os pais de cada node.
        this._registerParents();

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
    * Método recursivo que percorre todo um array de nodes e registra os pais de cada node se existir.     
    */
    _registerParents() {
        // Obtem o array de nodes.
        const nodes = Object.values(this.#tree.nodes);
        // Percorre o array de nodes.
        nodes.forEach(node => {
            // Verifica se o node tem pais (genitors.a e genitors.b).
            if (node.extra.genitors.a && node.extra.genitors.b) {
                // Procura os nodes correspondentes aos pais.
                const mother = this._findNode(node.extra.genitors.a);
                const father = this._findNode(node.extra.genitors.b);

                // Se os pais forem encontrados.
                if (mother && father) {
                    // Verifica se a mother já tem um casamento com o father.
                    if (!mother.marriages.find(marriage => marriage.spouse === father.id)) {
                        // Se não, cria um novo casamento.
                        mother.marriages.push({ spouse: father.id, children: [] });
                    }

                    // Verifica se o father já tem um casamento com a mother.
                    if (!father.marriages.find(marriage => marriage.spouse === mother.id)) {
                        // Se não, cria um novo casamento.
                        father.marriages.push({ spouse: mother.id, children: [] });
                    }

                    // Adiciona o node filho à lista de filhos do casamento da mother e do father.
                    mother.marriages.find(marriage => marriage.spouse === father.id).children.push(node.id);
                    father.marriages.find(marriage => marriage.spouse === mother.id).children.push(node.id);
                }
            }

            // Se o node tiver filhos, chama o método recursivamente.
            if (node.children) {
                registerParents(node.children);
            }
        });

        // Atualiza o array de nodes.
        this.#tree.nodes = nodes;
    }

    /**
     * Função auxiliar que procura um node no array de nodes com base no id.
     * 
     * @param {Array} nodes - Array de nodes a ser percorrido.
     * @param {Number} id - Id do node a ser procurado.
     * @returns {Object} Node encontrado ou null se não for encontrado.
     */
    _findNode(id) {
        return this.#tree.nodes.find(node => node.id === id);
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

    _getSeed() {
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

        const genderSpan = document.createElement('span');
        genderSpan.classList.add('node-gender', extra.gender === 'm' ? 'male' : 'female');
        genderSpan.innerHTML = extra.gender === 'm' ? 'Masc.' : 'Fem.';

        const infoFooter = document.createElement('div');
        infoFooter.classList.add('info-footer', 'flexrow');

        const otherMates = document.createElement('div');
        otherMates.classList.add('others');
        otherMates.innerHTML = '<i class="fas fa-ring"></i>';

        const otherChildren = document.createElement('div');
        otherChildren.classList.add('others');
        otherChildren.innerHTML = '<i class="fas fa-baby-carriage"></i>';

        infoFooter.appendChild(otherMates);
        infoFooter.appendChild(otherChildren);

        text.appendChild(nameSpan);
        text.appendChild(dateDiv);
        text.appendChild(genderSpan);
        text.appendChild(infoFooter);

        if (extra.others) {
            let coord = { X: 0, Y: 0 };

            if (extra.others.mates.length > 0) {
                otherMates.setAttribute('data-count', extra.others.mates.length);
            }

            if (extra.others.children.length > 0) {
                otherChildren.setAttribute('data-count', extra.others.children.length);
            }
        }

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
        icon.innerHTML = `<i class="fas ${iconMap[extra.status]}"></i>`;;
        node.appendChild(icon);

        const text = textRenderer(name, extra, textClass);
        node.appendChild(text);

        return node.outerHTML;
    }

    _onNodeClick(name, extra) {
        console.log(name);
    }
}