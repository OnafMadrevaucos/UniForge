(function (exports) {
    'use strict';

    globalThis.store = new WeakMap();

    const crypto = window.crypto;
    const store = globalThis.store;

    const _loremIpsum = [
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
        "Integer nec mi a enim posuere dictum.",
        "Etiam vel augue id leo elementum aliquam id sit amet elit.",
        "Nam molestie risus sit amet eros sagittis, eget congue tortor tempus.",
        "Nullam nibh mauris, sagittis ut tempus sed, congue at turpis.",
        "Etiam posuere ligula eu lacus pharetra tincidunt.",
        "Integer iaculis est id nibh mollis, vel finibus turpis feugiat.",
        "Cras eget tempus nisl.",
        "Etiam a posuere tellus.",
        "Pellentesque sagittis mollis nulla et bibendum.",
        "Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos.",
        "Phasellus malesuada erat non euismod consectetur.",
        "Mauris ut quam sit amet enim convallis egestas.",
        "Curabitur velit turpis, gravida id lacus sit amet, lobortis finibus tortor.",
        "Sed hendrerit at metus sed lobortis.",
        "Fusce nec ex ac libero varius dapibus convallis ut nisl.",
        "Vestibulum a tortor turpis.",
        "Fusce eleifend rhoncus augue, sit amet cursus lacus ullamcorper nec.",
        "Phasellus posuere dui rhoncus elementum mattis.",
        "Pellentesque mattis velit non venenatis mattis.",
        "Cras ut tellus pulvinar, tempus ligula ut, dignissim enim.",
        "Vivamus purus nunc, posuere in commodo et, ornare id nisi.",
        "Morbi a lacus tempus, varius lorem a, mollis nunc.",
        "Nunc nibh justo, interdum ac ante a, pulvinar mattis ipsum.",
        "Praesent sed sapien augue.",
        "Aliquam rutrum, velit et vulputate ultrices, nibh nulla ornare elit, id eleifend purus purus a odio.",
        "Integer lacinia, magna et lobortis aliquam, metus purus congue nisi, id porta ex nisi eu arcu.",
        "Mauris venenatis malesuada risus a vehicula.",
        "Fusce augue mauris, ullamcorper in semper sed, tempor sit amet sapien.",
        "Nunc mi dolor, lacinia quis sodales at, gravida a erat.",
        "Etiam laoreet leo at lectus gravida, et elementum dolor mattis.",
        "Sed id nulla accumsan, elementum quam id, consectetur sapien.",
        "Sed eu aliquam velit.",
        "Maecenas maximus nunc id mollis ullamcorper.",
        "Praesent condimentum non diam blandit semper.",
        "Vivamus non pretium lacus.",
        "Donec id ultricies erat, sed eleifend mi.",
        "Curabitur iaculis lacus elit, ut suscipit ipsum hendrerit et.",
        "Nunc justo nisi, blandit at vestibulum in, sodales eget dui.",
        "Nam semper, magna vitae venenatis sagittis, libero odio mollis neque, ac tristique orci libero nec mauris.",
        "Integer accumsan arcu sit amet urna posuere, quis cursus diam egestas.",
        "Praesent in fermentum nibh.",
        "Aenean facilisis, leo bibendum convallis aliquam, erat lacus porta ex, eu tristique nunc lorem auctor nibh.",
        "Proin semper fringilla mauris ac ullamcorper.",
        "Nam at dapibus nibh, non fermentum odio.",
        "In tempus convallis nulla at tempus.",
        "Phasellus lobortis odio et sodales pellentesque.",
        "Suspendisse accumsan gravida mi, in sagittis tortor ornare eu.",
        "Suspendisse ut metus vulputate, volutpat tortor nec, porttitor magna.",
        "Vestibulum egestas diam et ante aliquet, sit amet efficitur eros feugiat.",
        "Donec in aliquet ipsum."
    ];

    async function loadTemplate(filePath) {
        const response = await fetch(filePath);
        if (!response.ok) throw new Error('Erro ao carregar o arquivo. Detalhes: ' + response.statusText);

        const htmlString = await response.text();
        return htmlString;
    }

    /**
        * Associa uma imagem a um elemento HTML.
        * @param {HTMLElement} element  - O element que receberá os dados.
        * @param {Object} data          - Dados a serem atrelados ao element.
        */
    function associateDataWithElement(element, data) {
        console.log(`UniForge | Associando um dado ao element '${element.name}'...`);

        const uniqueId = randomID(); // Generate a unique ID
        element.dataset.uuid = uniqueId;    // Store the ID in the element's dataset
        store.set(element, { uuid: uniqueId, data });    // Store the Data in the WeakMap
    }

    /**
        * Converte um Blob para image.
        * @async
        * @param {Blob} blob                      - Os dados em Blob da imagem.
        * @param {string} ext                     - Os dados em Blob da imagem.
        * @returns {string}                       - A URL para construção do arquivo.
        */
    async function blobToImage(blob, ext) {
        console.log(`UniForge | Transformando um dado BLOB em Imagem...`);
        const imageType = `image/${ext}`;

        const binaryString = atob(blob); // Decodifica Base64 para binário
        const binaryData = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            binaryData[i] = binaryString.charCodeAt(i);
        }
        const imageData = new Blob([binaryData], { type: imageType }); // Ajuste o tipo de imagem conforme necessário
        const imageURL = URL.createObjectURL(imageData);

        return imageURL;
    }

    /**
       * Clona rapidamente um dado simples, retornando uma cópia que pode ser mutada com segurança.
       * Este método SUPORTA estruturas de dados recursivas contendo objetos ou arrays internos.
       * Este método NÃO SUPORTA tipos de objetos avançados como Set, Map ou outras classes especializadas.
       * @param {*} original                     Algum tipo de dado
       * @param {object} [options]               Opções para configurar o comportamento do deepClone
       * @param {boolean} [options.strict=false]  Lançar um erro se deepClone não conseguir clonar algo, em vez de
       *                                          retornar o original
       * @param {number} [options._d]             Um rastreador de profundidade interno
       * @return {*}                             O clone dos dados
       */
    function deepClone(original, { strict = false, _d = 0 } = {}) {
        if (_d > 100) {
            throw new Error("Profundidade máxima excedida. Certifique-se de que seu objeto não contém estruturas de dados cíclicas.");
        }
        _d++;

        // Tipos simples
        if ((typeof original !== "object") || (original === null)) return original;

        // Arrays
        if (original instanceof Array) return original.map(o => deepClone(o, { strict, _d }));

        // Datas
        if (original instanceof Date) return new Date(original);

        // Objetos avançados não suportados
        if (original.constructor && (original.constructor !== Object)) {
            if (strict) throw new Error("deepClone não pode clonar objetos avançados");
            return original;
        }

        // Outros objetos
        const clone = {};
        for (let k of Object.keys(original)) {
            clone[k] = deepClone(original[k], { strict, _d });
        }
        return clone;
    }

    /**
       * Compara profundamente um objeto com outro, retornando as chaves e valores que foram atualizados.
       * @param {object} original       Um objeto de dados contra o qual comparar
       * @param {object} other          Um objeto contendo dados potencialmente diferentes
       * @param {object} [options={}]   Opções adicionais que configuram a operação de comparação
       * @param {boolean} [options.inner=false]  Reconhecer apenas as diferenças em "other" para chaves que também existem em "original"
       * @param {boolean} [options.deletionKeys=false] Aplicar lógica especial para chaves de exclusão. Elas serão mantidas apenas se o
       *                                               objeto original tiver uma chave correspondente que possa ser excluída.
       * @param {number} [options._d]           Um rastreador de profundidade interno
       * @return {object}               Um objeto com os dados em "other" que diferem dos dados em "original"
       */
    function diffObject(original, other, { inner = false, deletionKeys = false, _d = 0 } = {}) {
        if (_d > 100) {
            throw new Error("Profundidade máxima excedida. Tenha cuidado para que seu objeto não contenha uma estrutura de dados cíclica.")
        }
        _d++;

        function _difference(v0, v1) {

            // Eliminar diferenças nos tipos
            let t0 = getType(v0);
            let t1 = getType(v1);
            if (t0 !== t1) return [true, v1];

            // null e undefined
            if (["null", "undefined"].includes(t0)) return [v0 !== v1, v1];

            // Se o protótipo expõe explicitamente um método de teste de igualdade, use-o
            if (v0?.equals instanceof Function) return [!v0.equals(v1), v1];

            // Comparação recursiva de objetos
            if (t0 === "Object") {
                if (isEmpty$1(v1)) return [false, {}];
                if (isEmpty$1(v0)) return [true, v1];
                let d = diffObject(v0, v1, { inner, deletionKeys, _d });
                return [!isEmpty$1(d), d];
            }

            // Diferenças em tipos primitivos
            return [v0.valueOf() !== v1.valueOf(), v1];
        }

        // Chama recursivamente a função _difference
        return Object.keys(other).reduce((obj, key) => {
            const isDeletionKey = key.startsWith("-=");
            if (isDeletionKey && deletionKeys) {
                const otherKey = key.substring(2);
                if (otherKey in original) obj[key] = other[key];
                return obj;
            }
            if (inner && !(key in original)) return obj;
            let [isDifferent, difference] = _difference(original[key], other[key]);
            if (isDifferent) obj[key] = difference;
            return obj;
        }, {});
    }

    /**
       * Um truque barato para duplicação de dados que é relativamente robusto.
       * Para um subconjunto de casos, a função deepClone oferecerá um melhor desempenho.
       * @param {Object} original   Algum tipo de dado
       */
    function duplicate(original) {
        return JSON.parse(JSON.stringify(original));
    }


    /**
     * Função assíncrona para extrair os ícones do FontAwesome de um arquivo CSS.
     * Faz a leitura do arquivo CSS, converte seu conteúdo em texto, e tenta parseá-lo para JSON.
     * 
     * @async
     * @function extractFontAwesomeIcons
     * @returns {Promise<Object|null>} Um objeto JSON contendo as regras CSS convertidas ou `null` em caso de erro.
     */
    async function extractFontAwesomeIcons() {
        console.log(`UniForge | Extraindo ícones do Font Awesome...`);
        /**
         * Caminho para o arquivo CSS do FontAwesome.
         * @type {string}
         */
        const cssFilePath = '../node_modules/@fortawesome/fontawesome-free/css/all.css';

        /**
         * Faz uma requisição ao arquivo CSS.
         * @type {Response}
         */
        const response = await fetch(cssFilePath);

        /**
         * Conteúdo do arquivo CSS em texto.
         * @type {string}
         */
        const cssContent = await response.text();

        try {
            // Parsear as regras CSS para JSON
            /**
             * Objeto JSON contendo as regras CSS convertidas.
             * @type {Object}
             */
            const json = this.parseCssToJson(cssContent);
            Object.keys(json).forEach((key) => {
                const item = json[key];
                const selector = item.selector.replace('fa-','');
                item._icon = `<i class="fas ${item.selector}"></i>`;
                item._label = selector.capitalize();
                item._value = item.selector;
            });  

            // Ordenar o objeto json alfabeticamente
            const orderedJson = Object.values(json).sort((a, b) => a._label.localeCompare(b._label));
            return orderedJson;
        } catch (error) {
            console.error('Erro ao converter CSS para JSON:', error);
            return null;
        }
    }

    /**
       * Formata um tamanho de arquivo para uma ordem de magnitude apropriada.
       * @param {number} size  O tamanho em bytes.
       * @param {object} [options]
       * @param {number} [options.decimalPlaces=2]  - O número de casas decimais para arredondar.
       * @param {2|10} [options.base=10]            - A base a ser usada. Na base 10, um kilobyte é 1000 bytes. Na base 2, é
       *                                            1024 bytes.
       * @returns {string}
    */
    function formatFileSize(size, { decimalPlaces = 2, base = 10 } = {}) {
        const units = ["B", "kB", "MB", "GB", "TB"];
        const divisor = base === 2 ? 1024 : 1000;
        let iterations = 0;
        while ((iterations < units.length) && (size > divisor)) {
            size /= divisor;
            iterations++;
        }
        return `${size.toFixed(decimalPlaces)} ${units[iterations]}`;
    }

    /**
        * Gera uma string aleatória de caracteres.
        * @param {number} length    - O comprimento da string aleatória.
        * @returns {string}         - A string aleatória gerada.
        */
    function generateRandomString(length, onlySmallCaps = false, onlyBigCaps = false) {
        console.log(`UniForge | Gerando uma string randômica...`);
        let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        if (onlySmallCaps) characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
        else if (onlyBigCaps) characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return result;
    }
    /**
        * Gera um Number aleatório entre valores determinados.
        * @param {number} min    - Valor mínimo do sorteio (padrão 0).
        * @param {number} max    - Valor mínimo do sorteio.
        * @returns {number}      - Um número aleatório entre o valor Min e o Max.
        */
    function generateRandomNumber(max, min = 0) {
        console.log(`UniForge | Gerando um número randômico...`);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    /**
        * Gera uma string aleatória de caracteres.
        * @param {number} length    - O comprimento da string aleatória.
        * @returns {string}         - A string aleatória gerada.
        */
    function loremIpsum(numParagraphs) {
        console.log(`UniForge | Gerando ${numParagraphs} parágrafos de Lorem Ipsum...`);
        let paragraphs = '';
        for (let i = 0; i < numParagraphs; i++) {
            const numParagraphsToMerge = generateRandomNumber(40, 5); // Gera um número aleatório entre 5 e 40.
            const indices = [];
            const paragraphsToMerge = [];

            for (let j = 0; j < numParagraphsToMerge; j++) {
                let randomIndex;
                do {
                    randomIndex = generateRandomNumber(_loremIpsum.length - 1);
                } while (indices.includes(randomIndex));
                indices.push(randomIndex);
                paragraphsToMerge.push(_loremIpsum[randomIndex]);
            }

            const mergedParagraph = paragraphsToMerge.join(' ');
            paragraphs += `<p>${mergedParagraph}</p>`;
        }

        return paragraphs;
    }

    /**
        * Converte a primeira letra de uma string para maiúscula.
        * @param {HTMLElement} element   - O elemento com identificador único dos dados.
        * @param {object} data           - Os dados a serem retornados.
        */
    function getAsociatedData(element) {
        return store.get(element);
    }

    /**
     * Uma função auxiliar que percorre um objeto para recuperar um valor por uma chave de string.
     * O método também suporta arrays, caso a chave fornecida seja um índice inteiro do array.
     * A chave em string suporta a notação a.b.c, que retornaria object[a][b][c].
     * @param {object} object   - O objeto a ser percorrido.
     * @param {string} key      - Uma propriedade do objeto usando a notação a.b.c.
     * @return {*}              - O valor da propriedade encontrada.
    */
    function getProperty(object, key) {
        if (!key || !object) return undefined;
        if (key in object) return object[key];
        let target = object;
        for (let p of key.split('.')) {
            if (!target || (typeof target !== "object")) return undefined;
            if (p in target) target = target[p];
            else return undefined;
        }
        return target;
    }

    /**
       * Aprende o tipo de dado subjacente de uma variável. Os tipos identificáveis suportados incluem:
       * undefined, null, number, string, boolean, function, Array, Set, Map, Promise, Error,
       * HTMLElement (somente no lado do cliente), Object (para outros tipos de objeto)
       * @param {*} variável  - Uma variável fornecida
       * @return {string}     - O nome do tipo do token
    */
    function getType(variable) {

        // Tipos primitivos, tratados com uma verificação simples de typeof.
        const typeOf = typeof variable;
        if (typeOf !== "object") return typeOf;

        // Casos especiais de objetos.
        if (variable === null) return "null";
        if (!variable.constructor) return "Object"; // Object com prototype nulo.
        if (variable.constructor.name === "Object") return "Object";  // Object simples.

        // Combina os prototypes das instâncias.
        const prototypes = [
            [Array, "Array"],
            [Set, "Set"],
            [Map, "Map"],
            [Promise, "Promise"],
            [Error, "Error"]
        ];
        if ("HTMLElement" in globalThis) prototypes.push([globalThis.HTMLElement, "HTMLElement"]);
        for (const [cls, type] of prototypes) {
            if (variable instanceof cls) return type;
        }

        // Tipo de Objeto desconhecido.
        return "Object";
    }

    /**
     * Uma função auxiliar que testa se um objeto possui uma propriedade ou propriedade aninhada dada uma chave de string.
     * O método também suporta arrays se a chave fornecida for um índice inteiro do array.
     * A chave de string suporta a notação a.b.c, que retornaria verdadeiro se object[a][b][c] existir
     * @param {object} object   - O objeto a ser percorrido
     * @param {string} key      - Uma propriedade do objeto com a notação a.b.c
     * @returns {boolean}       - Um indicador se a propriedade existe
    */
    function hasProperty(object, key) {
        if (!key || !object) return false;
        if (key in object) return true;
        let target = object;
        for (let p of key.split('.')) {
            if (!target || (typeof target !== "object")) return false;
            if (p in target) target = target[p];
            else return false;
        }
        return true;
    }

    /**
        * Converte uma imagem para Blob.
        * @async
        * @param {string} file                    - A string do caminho para o arquivo da imagem.
        * @returns {{img:Blob, ext:string}}       - Objeto com o fluxo de dados da imagem em Blob e a extensão do arquivo.
        */
    async function imageToBlob(file) {
        const data = {};

        // Se uma imagem foi informada, prepare-a para o banco de dados.
        if (file && file.type.startsWith('image/')) {
            var buffer = await file.arrayBuffer();
            //const blob = new Blob([buffer], { type: file.type });

            //const uint8Array = new Uint8Array(await blob.img.arrayBuffer());
            const uint8Array = new Uint8Array(buffer);

            // Converte Uint8Array para base64 antes de salvar
            let binaryString = '';
            for (let i = 0; i < uint8Array.length; i++) {
                binaryString += String.fromCharCode(uint8Array[i]);
            }
            const base64 = btoa(binaryString);

            // Obtém a extensão do arquivo de imagem.
            const fileExt = file?.name.split('.').pop().toLowerCase();

            data.rawData = base64;
            data.ext = fileExt;
        } else {
            data.rawData = null;
            data.ext = null;
        }

        return data;
    }

    /**
       * Testa se um valor é "vazio"; seja undefined ou um objeto sem conteúdo.
       * @param {*} value       - O valor a ser testado
       * @returns {boolean}     - O valor é vazio?
    */
    function isEmpty(value) {
        const t = getType(value);
        switch (t) {
            case "undefined":
                return true;
            case "null":
                return true;
            case "Array":
                return !value.length;
            case "Object":
                return !Object.keys(value).length;
            case "Set":
                return !value.size;
            default:
                return false;
        }
    }

    /**
     * Atualiza um objeto fonte substituindo suas chaves e valores por aqueles de um objeto alvo.
     *
     * @param {object} original                           - O objeto inicial que deve ser atualizado com os valores do
     *                                                    objeto alvo.
     * @param {object} [other={}]                         - Um novo objeto cujos valores devem substituir aqueles no objeto
     *                                                    fonte.
     * @param {object} [options={}]                       - Opções adicionais que configuram a mesclagem.
     * @param {boolean} [options.insertKeys=true]         - Controla se novas chaves de nível superior devem ser inseridas na
     *                                                    estrutura resultante, mesmo que não existam previamente no objeto original.
     * @param {boolean} [options.insertValues=true]       - Controla se novos valores aninhados devem ser inseridos em objetos filhos
     *                                                    na estrutura resultante, mesmo que não existam previamente no objeto original.
     * @param {boolean} [options.overwrite=true]          - Controla se valores existentes no objeto fonte devem ser substituídos
     *                                                    ou se apenas valores que não existam no objeto original devem ser mesclados.
     * @param {boolean} [options.recursive=true]          - Controla se objetos internos devem ser mesclados recursivamente (se verdadeiro)
     *                                                    ou se os objetos internos devem ser simplesmente substituídos por um novo valor.
     * @param {boolean} [options.inplace=true]            - Controla se as atualizações devem ser aplicadas diretamente ao objeto original
     *                                                    (se verdadeiro), caso contrário, o objeto original será duplicado e a cópia será mesclada.
     * @param {boolean} [options.enforceTypes=false]      - Controla se uma verificação estrita de tipos exige que o valor de uma chave
     *                                                    no objeto alvo corresponda ao tipo de dados no objeto original para que seja mesclado.
     * @param {boolean} [options.performDeletions=false]  - Controla se exclusões devem ser realizadas no objeto original caso
     *                                                    existam chaves de exclusão no objeto alvo.
     * @param {number} [_d=0]                             - Um parâmetro usado internamente para rastrear a profundidade da recursão.
     * @returns {object}                                  - O objeto fonte original, incluindo registros atualizados, inseridos ou
     *                                                    substituídos.
     *
     * @example Controle de como novas chaves e valores são adicionados
     * ```js
     * mergeObject({k1: "v1"}, {k2: "v2"}, {insertKeys: false}); // {k1: "v1"}
     * mergeObject({k1: "v1"}, {k2: "v2"}, {insertKeys: true});  // {k1: "v1", k2: "v2"}
     * mergeObject({k1: {i1: "v1"}}, {k1: {i2: "v2"}}, {insertValues: false}); // {k1: {i1: "v1"}}
     * mergeObject({k1: {i1: "v1"}}, {k1: {i2: "v2"}}, {insertValues: true}); // {k1: {i1: "v1", i2: "v2"}}
     * ```
     *
     * @example Controle de como os dados existentes são sobrescritos
     * ```js
     * mergeObject({k1: "v1"}, {k1: "v2"}, {overwrite: true}); // {k1: "v2"}
     * mergeObject({k1: "v1"}, {k1: "v2"}, {overwrite: false}); // {k1: "v1"}
     * ```
     *
     * @example Controle de se as mesclagens são realizadas recursivamente
     * ```js
     * mergeObject({k1: {i1: "v1"}}, {k1: {i2: "v2"}}, {recursive: false}); // {k1: {i2: "v2"}}
     * mergeObject({k1: {i1: "v1"}}, {k1: {i2: "v2"}}, {recursive: true}); // {k1: {i1: "v1", i2: "v2"}}
     * ```
     *
     * @example Excluindo uma chave existente do objeto
     * ```js
     * mergeObject({k1: "v1", k2: "v2"}, {"-=k1": null}, {performDeletions: true});   // {k2: "v2"}
     * ```
     */
    function mergeObjects(original, other = {}, {
        insertKeys = true, insertValues = true, overwrite = true, recursive = true, inplace = true, enforceTypes = false,
        performDeletions = false
    } = {}, _d = 0) {
        other = other || {};
        if (!(original instanceof Object) || !(other instanceof Object)) {
            throw new Error("Ou o Original ou um do Outro não são Objects!");
        }
        const options = { insertKeys, insertValues, overwrite, recursive, inplace, enforceTypes, performDeletions };

        // Tratamento especial quando em depth 0.
        if (_d === 0) {
            if (Object.keys(other).some(k => /\./.test(k))) other = expandObject(other);
            if (Object.keys(original).some(k => /\./.test(k))) {
                const expanded = expandObject(original);
                if (inplace) {
                    Object.keys(original).forEach(k => delete original[k]);
                    Object.assign(original, expanded);
                }
                else original = expanded;
            }
            else if (!inplace) original = deepClone(original);
        }

        // Itera sobre o outro object.
        for (let k of Object.keys(other)) {
            const v = other[k];
            if (original.hasOwnProperty(k)) _mergeUpdate(original, k, v, options, _d + 1);
            else _mergeInsert(original, k, v, options, _d + 1);
        }
        return original;
    }

    /**
       * Testa se dois objetos contêm as mesmas chaves e valores enumeráveis.
       * @param {object} a  O primeiro objeto.
       * @param {object} b  O segundo objeto.
       * @returns {boolean}
       */
    function objectsEqual(a, b) {
        if ((a == null) || (b == null)) return a === b;
        if ((getType(a) !== "Object") || (getType(b) !== "Object")) return a === b;
        if (Object.keys(a).length !== Object.keys(b).length) return false;
        return Object.entries(a).every(([k, v0]) => {
            const v1 = b[k];
            const t0 = getType(v0);
            const t1 = getType(v1);
            if (t0 !== t1) return false;
            if (v0?.equals instanceof Function) return v0.equals(v1);
            if (t0 === "Object") return objectsEqual(v0, v1);
            return v0 === v1;
        });
    }


    /**
     * Converte texto CSS em um formato JSON simplificado, extraindo regras específicas.
     * Ignora seletores iniciados por `@` e remove comentários.
     * 
     * @function parseCssToJson
     * @param {string} cssText      - O texto CSS a ser parseado.
     * @returns {Array<Object>}     - Uma lista de objetos contendo os seletores e suas propriedades específicas (como `--fa`).
     * 
     * @example
     * const cssText = ` 
     * .fa-user:before { --fa: "\\f007"; content: "\\f007"; }
     * .fa-camera:before { --fa: "\\f030"; content: "\\f030"; }
     * `;
     * 
     * const result = parseCssToJson(cssText);
     * console.log(result);
     * // [
     * //   { selector: "fa-user:before", unicode: { "--fa": "\\f007", "content": "\\f007" } },
     * //   { selector: "fa-camera:before", unicode: { "--fa": "\\f030", "content": "\\f030" } }
     * // ]
     */
    function parseCssToJson(cssText) {
        console.log('UniForge | Transformando CSS em JSON...');
        /**
         * Array que armazenará as regras CSS convertidas.
         * @type {Array<Object>}
         */
        const json = [];

        // Remover comentários no formato /* ... */
        /**
         * Texto CSS limpo sem comentários.
         * @type {string}
         */
        const cleanedCssText = cssText.replace(/\/\*[\s\S]*?\*\//g, '');

        /**
         * Lista de blocos de CSS extraídos do texto.
         * Cada bloco é definido por seletores e suas propriedades.
         * @type {Array<string>|null}
         */
        const blocks = cleanedCssText.match(/([^{}]+)\{([^{}]*)\}/g);

        if (!blocks) return json; // Retorna vazio se não houver regras

        // Iterar sobre cada bloco encontrado
        blocks.forEach(block => {
            /**
             * Separa os seletores e as propriedades de estilo.
             * @type {Array<string>}
             */
            const [selectors, styles] = block.split('{').map(s => s.trim());

            // Ignorar blocos com seletores que começam com '@' (exemplo: @media)
            if (selectors.startsWith('@')) return;

            /**
             * Divide as propriedades do bloco em pares chave-valor.
             * Remove entradas vazias ou inválidas.
             * @type {Array<string>}
             */
            const stylesArray = styles.split(';').map(s => s.trim()).filter(Boolean);

            /**
             * Filtra propriedades que não contenham a chave `}` (corrige blocos mal formados).
             * @type {Array<string>}
             */
            const filteredStyles = stylesArray.filter(s => !s.includes('}'));

            /**
             * Converte a lista de propriedades para um objeto de chave-valor.
             * @type {Object<string, string>}
             */
            const stylesObject = Object.fromEntries(
                filteredStyles.map(style => {
                    const [property, value] = style.split(':').map(s => s.trim());
                    return [property, value];
                })
            );

            // Adicionar apenas regras com a propriedade `--fa` (usada pelo FontAwesome)
            if (stylesObject['--fa']) {
                json.push({
                    /**
                     * O seletor CSS (sem o ponto inicial ou outro prefixo).
                     * @type {string}
                     */
                    selector: selectors.trim().slice(1),

                    /**
                     * Propriedades específicas do seletor.
                     * @type {Object<string, string>}
                     */
                    unicode: stylesObject
                });
            }
        });

        return json;
    }

    /**
     * Processa um código HTML substituindo as tags <switch>, <combo> e <calendar>, bem como todos os placeholders informados.
     * @param {string} html - A string HTML contendo as tags e placeholders.
     * @param {Object} data - O objeto contendo as chaves e valores para substituição.
     * @returns {string} - A string HTML modificada com as tags e placeholders substituídas.
     */
    function parseHTML(html, data) {
        console.log(`UniForge | Tratando o corpo HTML...`);

        // Substitui as tags <combo>
        html = replaceComboTags(html, data);

        // Substitui as tags <calendar>
        html = replaceCalendarTags(html);

        // Substitui as tags <list>
        html = replaceListTags(html, data);

        // Substitui as tags <foldertree>
        html = replaceFoldertreeTags(html, data);

        // Substitui as tags <switch>
        html = replaceSwitchTags(html);

        // Substitui os placeholders
        html = replacePlaceholders(html, data);

        return html;
    }    

    /**
       * Gera um ID de string alfanumérica aleatória de um comprimento solicitado usando `crypto.getRandomValues()`.
       * @param {number} length    - O comprimento da string aleatória a ser gerada, que deve ser no máximo 16384.
       * @return {string}          - Uma string contendo letras aleatórias (a-z) e números (0-9).
    */
    function randomID() {
        console.log(`UniForge | Gerando novo ID para um registro do Banco de Dados...`);
        const length = 16;

        const id = generateRandomString(length);
        return id;
    }

    /**
    * Substitui os valores entre '{{' e '}}' no código HTML pelo valor correspondente de um objeto 'data'.
    * @param {string} html - A string HTML contendo os placeholders.
    * @param {Object} data - O objeto contendo as chaves e valores para substituição.
    * @returns {string} - A string HTML modificada com os valores substituídos.
    */
    function replacePlaceholders(html, data) {
        console.log('UniForge | Substituindo valores de Placeholders...');

        /*
        const ifRegex = /{{#if\s+([^}]+)}}(.*?){{\/if}}/gs;

        html = html.replace(ifRegex, (match, condition, content) => {
            if((condition in data) == false || data[condition] == false) {
                return '';
            } else return content;
        });
        */

        const valueRegex = /{{(.*?)}}/g;

        html = html.replace(valueRegex, (match, key) => {
            key = key.trim();
            return key in data ? data[key] : '';
        })

        return html;
    }

    /**
    * Substitui todas as tags <switch> no HTML pelo código de um switch estilizado.
    * @param {string} html - A string HTML contendo as tags <switch>.
    * @returns {string} - A string HTML modificada com as tags <switch> substituídas.
    */
    function replaceSwitchTags(html) {
        console.log('UniForge | Substituindo tags de Switch...');

        html = html.replace(/<switch\s*(?:id="([^"]+)")?\s*(?:class="([^"]+)")?\s*\/?>/g, (match, id, classes) => {
            console.log(`Correspondência encontrada: ${match}`);
            console.log(`ID: ${id ?? 'none'}, Classes: ${classes ?? 'none'}`);
            return `
            <label ${id ? `id="${id}"` : ''} ${classes ? `class="switch ${classes}"` : 'class="switch"'}>
                <input type="checkbox" id="checkbox">
                <div class="slider"></div>
            </label>`;
        });

        // Em seguida, remova as tags de fechamento </switch>
        html = html.replace(/<\/switch>/g, '');
        return html;
    }

    /**
    * Substitui todas as tags <combo> no HTML por um <select> com opções baseadas nos dados fornecidos.
    * @param {string} html - A string HTML contendo as tags <combo>.
    * @param {Object} data - O objeto contendo as chaves e valores para substituição.
    * @returns {string} - A string HTML modificada com as tags <combo> substituídas.
    */
    function replaceComboTags(html, data) {
        console.log('UniForge | Substituindo tags de Combo...');
        
        const regex = /<combo\s+id="([^"]+)"\s+value="([^"]+)"\s*(blank="([^"]+)")?\s*\/?>/g;

        html = html.replace(regex, (match, id, valueKey, blankAttr, blankValue) => {
            console.log(`Correspondência encontrada: ${match}`);
            console.log(`ID: ${id}, ValueKey: ${valueKey}${blankValue ? `, BlankValue: ${blankValue}` : ''}`);

            if (!(valueKey in data)) {
                console.log(`O identificador '${valueKey}' não foi encontrado no objeto data. Retornando um <select> vazio.`);
                return `<select id="${id}" class="data" name="${id}"></select>`;
            }

            const options = Array.isArray(data[valueKey])
                ? data[valueKey].map(val => `<option value="${val._id}">${val._label}</option>`).join('\n')
                : Object.keys(data[valueKey]).map(key => `<option value="${data[valueKey][key]._id}">${data[valueKey][key]._label}</option>`).join('\n');

            const blankOption = blankAttr ? `<option value="${blankValue}">&#8212</option>` : '';

            const result = `
            <select id="${id}" class="data" name="${id}">
                ${blankOption}
                ${options}
            </select>`;

            return result;
        });

        // Em seguida, remova as tags de fechamento </combo>
        html = html.replace(/<\/combo>/g, '');
        return html;
    }

    /**
     * Substitui todas as tags <calendar> no HTML pelo código HTML de um calendário.
     * @param {string} html - A string HTML contendo as tags <calendar>.
     * @returns {string} - A string HTML modificada com as tags <calendar> substituídas.
    */
    function replaceCalendarTags(html) {
        console.log('UniForge | Substituindo tags de Calendar...');

        html = html.replace(/<calendar\s*(class="([^"]+)")?\s*\/?>/g, (match, classAttr, extraClasses) => {
            console.log(`Correspondência encontrada: ${match}`);
            console.log(`${extraClasses ? `Extra Classes: ${extraClasses}` : ''}`);
            return `
            <div class="date-input data ${extraClasses || ''}" id="dateInput" data-type="" data-date="">
                <div class="date-display" id="dateDisplay">Selecione uma data</div>
                <div class="calendar" id="calendar">
                    <div class="calendar-header">
                        <button id="prevGroup"><i class="fa-solid fa-caret-left"></i></button>
                        <span id="monthYearDisplay"></span>
                        <button id="nextGroup"><i class="fa-solid fa-caret-right"></i></button>
                    </div>              
                    <div class="calendar-view" id="calendarView">
                        <div class="calendar-content" id="calendarContent"></div>
                    </div>              
                </div>
            </div>`;
        });

        // Em seguida, remova as tags de fechamento </calendar>
        html = html.replace(/<\/calendar>/g, '');
        return html;
    }

    function replaceFoldertreeTags(html, data) {
        console.log('UniForge | Substituindo tags de Foldertree...');
        const regex = /<foldertree id="([^"]+)" item="([^"]+)"( data-([^>]+))?><\/foldertree>/g;
        html = html.replace(regex, (match, id, itemKey, dataset) => {
            console.log(`Correspondência encontrada: ${match}`);
            console.log(`ID: ${id}, Item: ${itemKey}, ${dataset ? `Dados: ${dataset}` : ''}`);

            const datasetObj = {};
            if (dataset) {
                const datasetPairs = dataset.split(' ');
                for (const pair of datasetPairs) {
                    const [key, value] = pair.split('=');
                    datasetObj[key] = value.replace(/"/g, '');
                }
            }

            if (!('folders' in data)) {
                console.log(`O identificador 'folders' não foi encontrado no objeto data. Retornando um <ul> vazio.`);
                return `<ul id="folderList" class="folder-list"></ul>`;
            }

            // Variavel para armazenar o resultado do 'replace'.
            let result = '<ul id="folderList" class="folder-list">';
            const folders = data.folders;

            folders.forEach(folder => {
                if (!(itemKey in folder)) {
                    console.log(`O identificador '${itemKey}' não foi encontrado no objeto data ou a lista de itens está vazia. Retornando um <li> vazio.`);
                    return `<li class="folder created" data-cid="${folder.cid}" data-sid="${folder.sid}" data-tid="${folder.tid ?? null}"></li>`;
                }

                const itemList = folder[itemKey];
                const folderHTML =
                    `<li class="folder created" data-cid="${folder.cid}" data-sid="${folder.sid}" data-tid="${folder.tid ?? null}">
                        <div class="folder-header flexrow">
                            <i class="fas fa-folder"></i>
                            <span>${folder._label}</span>
                        </div>
                        <div class="folder-content">
                            <ul class="entry-list">
                                ${(itemList.length > 0 ? _generateFolderItemHTML(itemKey, itemList) : '')}
                            </ul>
                        </div>
                    </li>`;

                result += folderHTML;

            });

            result += '</ul>';
            return result;
        });

        // Em seguida, remova as tags de fechamento </foldertree>
        html = html.replace(/<\/foldertree>/g, '');
        return html;
    }

    function replaceListTags(html, data) {
        console.log('UniForge | Substituindo tags de List...');
        const regex = /<list id="([^"]+)" value="([^"]+)"( class="([^"]+)")?( item-class="([^"]+)")?><\/list>/g;
        html = html.replace(regex, (match, id, valueKey, classAttr, extraClasses, itemClassAttr, itemClass) => {
            console.log(`Correspondência encontrada: ${match}`);
            console.log(`ID: ${id}, Item: ${valueKey}${extraClasses ? `, Extra Classes: ${extraClasses}` : ''}${itemClass ? `, Classes dos Itens: ${itemClass}` : ''}`);

            if (!(valueKey in data)) {
                console.log(`O identificador da lista não foi encontrado no objeto data. Retornando um <ul> vazio.`);
                return `<ul id="${id}" class="list"></ul>`;
            }

            // Variavel para armazenar o resultado do 'replace'.
            let result = `<ul id="${id}"${extraClasses ? ` class="${extraClasses}"` : 'list'}">`;
            const listItems = data[valueKey];

            listItems.forEach(item => {
                const itemHTML =
                    `<li class="${itemClass ?? 'item'}"${item._value ? ` data-value="${item._value}"` : ''}>
                        ${item._icon ?? ''}
                        <span>${item._label}</span>                        
                    </li>`;

                result += itemHTML;
            });

            result += '</ul>';
            return result;
        });

        // Em seguida, remova as tags de fechamento </list>
        html = html.replace(/<\/list>/g, '');
        return html;
    }

    /**
     * Uma função auxiliar que busca por um objeto para atribuir um valor usando uma chave de string
     * Esta chave de string suporta a notação a.b.c, que direcionaria para object[a][b][c]
     * @param {object} object   - O objeto a ser atualizado
     * @param {string} key      - A chave de string
     * @param {*} value         - O valor a ser atribuído
     * @return {boolean}        - Se o valor foi alterado em relação ao seu valor anterior
    */
    function setProperty(object, key, value) {
        if (!key) return false;

        // Converte a chave para uma referência de objeto se ela contiver notação de ponto
        let target = object;
        if (key.indexOf('.') !== -1) {
            let parts = key.split('.');
            key = parts.pop();
            target = parts.reduce((o, i) => {
                if (!o.hasOwnProperty(i)) o[i] = {};
                return o[i];
            }, object);
        }

        // Atualiza o alvo.
        if (!(key in target) || (target[key] !== value)) {
            target[key] = value;
            return true;
        }
        return false;
    }

    /**
       * Expressa um timestamp como uma string relativa
       * @param {Date|string} timeStamp   - Uma string de timestamp ou objeto Date a ser formatado como tempo relativo
       * @return {string}                 - Uma expressão em string para o tempo relativo
    */
    function timeSince(timeStamp) {
        timeStamp = new Date(timeStamp);
        const now = new Date();
        const secondsPast = (now - timeStamp) / 1000;
        let since = "";

        // Formata o tempo.
        if (secondsPast < 60) {
            since = secondsPast;
            if (since < 1) return 'Agora';
            else since = Math.round(since) + 'seg';
        }
        else if (secondsPast < 3600) since = Math.round(secondsPast / 60) + 'min';
        else if (secondsPast <= 86400) since = Math.round(secondsPast / 3600) + 'hrs';
        else {
            const hours = Math.round(secondsPast / 3600);
            const days = Math.floor(hours / 24);
            since = `${days} 'd' ${hours % 24} hrs`;
        }

        // Retorna a string.
        return since;
    }

    /**
       * @see Number#between
       * @ignore
       */
    Number.between = function (num, a, b, inclusive = true) {
        let min = Math.min(a, b);
        let max = Math.max(a, b);
        return inclusive ? (num >= min) && (num <= max) : (num > min) && (num < max);
    };

    /**
     * Testa se um valor é numérico.
     * Este é o algoritmo de maior desempenho disponível atualmente, conforme https://jsperf.com/isnan-vs-typeof/5
     * @memberof Number
     * @param {*} n       - Um valor a ser testado
     * @return {boolean}  - É um número?
     */
    function isNumeric(n) {
        if (n instanceof Array) return false;
        else if ([null, ""].includes(n)) return false;
        return +n === +n;
    }

    /**
       * Tenta criar um número a partir de uma string fornecida pelo usuário.
       * @memberof Number
       * @param {string|number} n   - O valor a ser convertido; normalmente uma string, mas pode já ser um número.
       * @return {number}           - O número que a string representa, ou NaN se nenhum número puder ser determinado.
    */
    function fromString(n) {
        if (typeof n === "number") return n;
        if ((typeof n !== "string") || !n.length) return NaN;
        n = n.replace(/\s+/g, "");
        return Number(n);
    }

    console.log('UniForge | Atribuindo primitivos ao protótipo dos Numbers...');
    // Atribui primitivos ao protótipo dos Numbers.
    Object.defineProperties(Number, {
        isNumeric: { value: isNumeric, configurable: true },
        fromString: { value: fromString, configurable: true }
    });

    /**
    * Adiciona um método get ao Set.prototype para buscar um membro do conjunto com base no valor da propriedade _id.
    *
    * @method get
    * @memberof Set.prototype
    * @param {_id} _id - O valor da propriedade _id a ser buscado.
    * @returns {Object|undefined} O membro do conjunto que tem a propriedade _id igual ao valor fornecido, ou undefined se não encontrar.
    * Exemplo de uso:
    *
    * @example
    * class Pessoa {
    *   constructor(_id, nome) {
    *     this._id = _id;
    *     this.nome = nome;
    *   }
    * }
    *
    * // Cria um conjunto de pessoas
    * let pessoas = new Set([
    *   new Pessoa(1, 'João'),
    *   new Pessoa(2, 'Maria'),
    *   new Pessoa(3, 'Pedro')
    * ]);
    *
    * // Busca uma pessoa pelo _id
    * let pessoa = pessoas.get(2);
    *
    * // Verifica se a pessoa foi encontrada
    * if (pessoa) {
    *   console.log(`Encontrada pessoa com _id ${pessoa._id} e nome ${pessoa.nome}`);
    * } else {
    *   console.log('Pessoa não encontrada');
    * }
    */
    function get(_id) {

        // Itera sobre os membros do conjunto.        
        for (const member of this) {
            // Verifica se o membro tem uma propriedade _id e se ela é igual ao _id fornecido.
            if (member._id === _id) return member;
        }
        return undefined;
    }

    /**
       * Retorna a diferença entre dois conjuntos.
       * @memberof Set.prototype
       * 
       * @param {Set} other       - Outro conjunto para comparar
       * @returns {Set}           - A diferença, definida como os objetos deste conjunto que não estão presentes no outro
       */
    function difference(other) {
        if (!(other instanceof Set)) throw new Error("Deve ser fornecida outra instância de Set.");
        const difference = new Set();
        for (const element of this) {
            if (!other.has(element)) difference.add(element);
        }
        return difference;
    }

    /**
     * Retorna a diferença simétrica entre dois conjuntos.
     * @memberof Set.prototype
     * 
     * @param {Set} other  - Outro conjunto.
     * @returns {Set}      - O conjunto de elementos que existem em este ou no outro, mas não em ambos.
     */
    function symmetricDifference(other) {
        if (!(other instanceof Set)) throw new Error("Deve ser fornecida outra instância de Set.");
        const difference = new Set(this);
        for (const element of other) {
            if (difference.has(element)) difference.delete(element);
            else difference.add(element);
        }
        return difference
    }

    /**
     * Testa se este conjunto é igual a outro conjunto.
     * Os conjuntos são iguais se compartilharem os mesmos membros, independentemente da ordem.
     * @memberof Set.prototype
     * 
     * @param {Set} other       - Outro conjunto para comparar
     * @returns {boolean}       - Os conjuntos são iguais?
     */
    function equals(other) {
        if (!(other instanceof Set)) return false;
        if (other.size !== this.size) return false;
        for (let element of this) {
            if (!other.has(element)) return false;
        }
        return true;
    }

    /**
     * Retorna o primeiro valor do conjunto.
     * @memberof Set.prototype
     * 
     * @returns {*}             - O primeiro elemento do conjunto, ou undefined
     */
    function first() {
        return this.values().next().value;
    }

    /**
     * Retorna a interseção entre dois conjuntos.
     * @memberof Set.prototype
     * 
     * @param {Set} other       - Outro conjunto para comparar
     * @returns {Set}           - A interseção entre ambos os conjuntos
     */
    function intersection(other) {
        const n = new Set();
        for (let element of this) {
            if (other.has(element)) n.add(element);
        }
        return n;
    }

    /**
     * Testa se este conjunto tem uma interseção com outro conjunto.
     * @memberof Set.prototype
     * 
     * @param {Set} other       - Outro conjunto para comparar
     * @returns {boolean}       - Os conjuntos se intersectam?
     */
    function intersects(other) {
        for (let element of this) {
            if (other.has(element)) return true;
        }
        return false;
    }

    /**
     * Retorna a união de dois conjuntos.
     * @memberof Set.prototype
     * 
     * @param {Set} other  - O outro conjunto.
     * @returns {Set}
     */
    function union(other) {
        if (!(other instanceof Set)) throw new Error("Deve ser fornecida outra instância de Set.");
        const union = new Set(this);
        for (const element of other) union.add(element);
        return union;
    }

    /**
     * Testa se este conjunto é um subconjunto de outro conjunto.
     * Um conjunto é um subconjunto se todos os seus membros também estiverem presentes no outro conjunto.
     * @memberof Set.prototype
     * 
     * @param {Set} other       - Outro conjunto que pode ser um subconjunto deste
     * @returns {boolean}       - O outro conjunto é um subconjunto deste?
     */
    function isSubset(other) {
        if (!(other instanceof Set)) return false;
        if (other.size < this.size) return false;
        for (let element of this) {
            if (!other.has(element)) return false;
        }
        return true;
    }

    /**
     * Converte um conjunto em um objeto JSON mapeando seu conteúdo para um array.
     * @memberof Set.prototype
     * 
     * @returns {Array}           - Os elementos do conjunto como um array.
     */
    function toObject() {
        return Array.from(this);
    }

    /**
     * Testa se cada elemento deste conjunto satisfaz um determinado critério de teste.
     * @memberof Set.prototype
     * 
     * @see Array#every
     * @param {function(*,number,Set): boolean} test        - O critério de teste a ser aplicado. Os argumentos posicionais são o valor,
     *                                                      o índice de iteração e o conjunto sendo testado.
     * @returns {boolean}                                   - Cada elemento do conjunto satisfaz o critério de teste?
     */
    function every(test) {
        let i = 0;
        for (const v of this) {
            if (!test(v, i, this)) return false;
            i++;
        }
        return true;
    }

    /**
     * Filtra este conjunto para criar um subconjunto de elementos que satisfaçam um determinado critério de teste.
     * @memberof Set.prototype
     * 
     * @see Array#filter
     * @param {function(*,number,Set): boolean} test        - O critério de teste a ser aplicado. Os argumentos posicionais são o valor,
     *                                                      o índice de iteração e o conjunto sendo filtrado.
     * @returns {Set}                                       - Um novo conjunto contendo apenas elementos que satisfaçam o critério de teste.
     */
    function filter(test) {
        const filtered = new Set();
        let i = 0;
        for (const v of this) {
            if (test(v, i, this)) filtered.add(v);
            i++;
        }
        return filtered;
    }

    /**
    * Ordena um Set usando a mesma lógica da função sort() de um array.
    * 
    * @see Array#sort
    * @returns {Set} - Um novo Set com os elementos ordenados.
    */
    function sort() {
        // Converte o Set em um array.
        const sorted = Array.from(this);
        // Ordena o array.
        sorted.sort((a, b) => {
            // Verifica se os elementos têm o campo _label
            if (a._label && b._label) {
                // Ordena os elementos com base no campo _label
                return a._label.localeCompare(b._label);
            } else {
                // Ordena os elementos com base no valor padrão
                return a.localeCompare(b);
            }
        });
        // Cria um novo Set com os elementos ordenados.
        return new Set(sorted);
    }

    /**
     * Encontra o primeiro elemento deste conjunto que satisfaça um determinado critério de teste.
     * @memberof Set.prototype
     * 
     * @see Array#find
     * @param {function(*,number,Set): boolean} test        - O critério de teste a ser aplicado. Os argumentos posicionais são o valor,
     *                                                      o índice de iteração e o conjunto sendo pesquisado.
     * @returns {*|undefined}                               - O primeiro elemento do conjunto que satisfaça o critério de teste, ou undefined.
     */
    function find(test) {
        let i = 0;
        for (const v of this) {
            if (test(v, i, this)) return v;
            i++;
        }
        return undefined;
    }

    /**
     * Cria um novo conjunto onde cada elemento é modificado por uma função de transformação fornecida.
     * @memberof Set.prototype
     * 
     * @see Array#map
     * @param {function(*,number,Set): boolean} transform   - A função de transformação a ser aplicada. Os argumentos posicionais são
     *                                                      o valor, o índice de iteração e o conjunto sendo transformado.
     * @returns {Set}                                       - Um novo conjunto de tamanho igual contendo elementos transformados.
     */
    function map(transform) {
        const mapped = new Set();
        let i = 0;
        for (const v of this) {
            mapped.add(transform(v, i, this));
            i++;
        }
        if (mapped.size !== this.size) {
            throw new Error("A operação Set#map modificou ilegalmente o tamanho do conjunto");
        }
        return mapped;
    }

    /**
     * Cria um novo conjunto com elementos que são filtrados e transformados por uma função de redução fornecida.
     * @memberof Set.prototype
     * 
     * @see Array#reduce
     * @param {function(*,*,number,Set): *} reducer     - Uma função de redução aplicada a cada valor. Os argumentos posicionais são
     *                                                  o acumulador, o valor, o índice de iteração e o conjunto sendo reduzido.
     * @param {*} accumulator                           - O valor inicial do acumulador retornado.
     * @returns {*}                                     - O valor final do acumulador.
     */
    function reduce(reducer, accumulator) {
        let i = 0;
        for (const v of this) {
            accumulator = reducer(accumulator, v, i, this);
            i++;
        }
        return accumulator;
    }

    /**
     * Testa se algum elemento deste conjunto satisfaz um determinado critério de teste.
     * @memberof Set.prototype
     * 
     * @see Array#some
     * @param {function(*,number,Set): boolean} test    - O critério de teste a ser aplicado. Os argumentos posicionais são o valor,
     *                                                  o índice de iteração e o conjunto sendo testado.
     * @returns {boolean}                               - Algum elemento do conjunto satisfaz o critério de teste?
     */
    function some(test) {
        let i = 0;
        for (const v of this) {
            if (test(v, i, this)) return true;
            i++;
        }
        return false;
    }

    console.log('UniForge | Atribuindo primitivos ao protótipo dos Sets...');
    // Atribui primitivos ao protótipo de Set
    Object.defineProperties(Set.prototype, {
        get: { value: get, configurable: true },
        difference: { value: difference, configurable: true },
        symmetricDifference: { value: symmetricDifference, configurable: true },
        equals: { value: equals, configurable: true },
        every: { value: every, configurable: true },
        filter: { value: filter, configurable: true },
        find: { value: find, configurable: true },
        first: { value: first, configurable: true },
        intersection: { value: intersection, configurable: true },
        intersects: { value: intersects, configurable: true },
        union: { value: union, configurable: true },
        isSubset: { value: isSubset, configurable: true },
        map: { value: map, configurable: true },
        reduce: { value: reduce, configurable: true },
        some: { value: some, configurable: true },
        sort: { value: sort, configurable: true },
        toObject: { value: toObject, configurable: true }
    });

    /**
       * Capitaliza uma string, transformando o primeiro caractere em maiúsculo.
       * @returns {string}
       */
    function capitalize() {
        if (!this.length) return this;
        return this.charAt(0).toUpperCase() + this.slice(1);
    }

    /**
       * Capitaliza uma string, transformando o primeiro caractere em maiúsculo.
       * @returns {string}
       */
    function isEmpty() {        
        return (!this || this === '');;
    }

    /**
       * Compara esta string (x) com outra string (y) comparando o valor do ponto de código Unicode de cada caractere.
       * Retorna um número negativo se x < y, um número positivo se x > y, ou zero caso contrário.
       * Esta é a mesma função de comparação usada pelo Array#sort se o argumento da função de comparação for omitido.
       * O resultado é independente do host/locale.
       * @param {string} other    A outra string para comparar com esta.
       * @returns {number}
    */
    function compare(other) {
        return this < other ? -1 : this > other ? 1 : 0;
    }

    /**
       * Converte uma string para o formato Title Case, onde a primeira letra de cada palavra é capitalizada.
       * @returns {string}
    */
    function titleCase() {
        if (!this.length) return this;
        return this.toLowerCase().split(' ').reduce((parts, word) => {
            if (!word) return parts;
            const title = word.replace(word[0], word[0].toUpperCase());
            parts.push(title);
            return parts;
        }, []).join(' ');
    }

    console.log('UniForge | Atribuindo primitivos ao protótipo das Strings...');
    // Atribui primitivos ao protótipo das Strings
    Object.defineProperties(String.prototype, {
        capitalize: { value: capitalize, configurable: true },
        compare: { value: compare, configurable: true },
        isEmpty: { value: isEmpty, configurable: true },
        titleCase: { value: titleCase, configurable: true }
    });

    /**
     * Uma função auxiliar para mesclar objetos quando a chave de destino não existe no original.
     * @private
     */
    function _mergeInsert(original, k, v, { insertKeys, insertValues, performDeletions } = {}, _d) {
        // Delete a key
        if (k.startsWith("-=") && performDeletions) {
            delete original[k.slice(2)];
            return;
        }

        const canInsert = ((_d <= 1) && insertKeys) || ((_d > 1) && insertValues);
        if (!canInsert) return;

        // Recursively create simple objects
        if (v?.constructor === Object) {
            original[k] = mergeObjects({}, v, { insertKeys: true, inplace: true, performDeletions });
            return;
        }

        // Insert a key
        original[k] = v;
    }

    /**
     * Uma função auxiliar para mesclar objetos quando a chave de destino existe no original.
     * @private
     */
    function _mergeUpdate(original, k, v, {
        insertKeys, insertValues, enforceTypes, overwrite, recursive, performDeletions
    } = {}, _d) {
        const x = original[k];
        const tv = getType(v);
        const tx = getType(x);

        // Recursively merge an inner object
        if ((tv === "Object") && (tx === "Object") && recursive) {
            return mergeObjects(x, v, {
                insertKeys, insertValues, overwrite, enforceTypes, performDeletions,
                inplace: true
            }, _d);
        }

        // Overwrite an existing value
        if (overwrite) {
            if ((tx !== "undefined") && (tv !== tx) && enforceTypes) {
                throw new Error(`Mismatched data types encountered during object merge.`);
            }
            original[k] = v;
        }
    }

    /**
     * Uma função auxiliar para gerar o HTML dos itens de uma lista de pastas.
     * @param {Array} itemList      - A lista de itens de uma pasta.
     * @private
     */
    function _generateFolderItemHTML(itemKey, itemList) {
        /* 
        <li class="entry-item flexrow" data-id="-1">
            <i class="fas fa-file"></i>
            <span></span>
            <a class="remove-button">
                <i class="fas fa-trash"></i>
            </a>
        </li>
        */
        let html = '';

        itemList.forEach(item => {
            const data = uniforge.doc[itemKey].get(item._id);
            html += `
                <li class="entry-item flexrow" data-id="${data._id}">
                    <i class="fas fa-file"></i>
                    <span>${data._label}</span>
                    <a class="remove-button">
                        <i class="fas fa-trash"></i>
                    </a>
                </li>\n
            `;
        });

        return html;
    }

    const utils = {
        associateDataWithElement,
        blobToImage,
        deepClone,
        diffObject,
        duplicate,
        extractFontAwesomeIcons,
        generateRandomString,
        loremIpsum,
        getAsociatedData,
        getProperty,
        getType,
        hasProperty,
        imageToBlob,
        isEmpty,
        loadTemplate,
        mergeObjects,
        objectsEqual,
        parseCssToJson,
        randomID,
        setProperty,
        timeSince
    };

    const parser = {
        parseHTML,
        replacePlaceholders,
        replaceSwitchTags,
        replaceComboTags,
        replaceCalendarTags
    }

    // Constante Global
    /**
    * Objeto global `uniforge` que armazena configurações e instâncias relacionadas à aplicação,
    * incluindo configurações do mapa, controles, propriedades de navegação e utilitários.
    * 
    * @namespace uniforge
    */

    console.log('UniForge | Gerando variável global \'uniforge\'...');
    globalThis.uniforge = {
        /**
         * Constantes configuráveis, como dimensões de imagem e tamanho do tile.
         * 
         * @type {Object}
         * @property {number} MIN_POINTS - Número mínimo de pontos para alguma operação.
         * @property {number} IMG_WIDTH - Largura da imagem.
         * @property {number} IMG_HEIGHT - Altura da imagem.
         * @property {number} VIEW_WIDTH - Largura da área de visualização.
         * @property {number} VIEW_HEIGHT - Altura da área de visualização.
         * @property {number} TILE_SIZE - Tamanho de cada tile do mapa.
         * @property {number} DEFAULT_IMPORTANCE - Identificador do valor padrão de Importância de uma Entrada (Minor).
        */
        constants: {
            MIN_POINTS: 2000,
            IMG_WIDTH: 5850,
            IMG_HEIGHT: 4550,
            VIEW_WIDTH: 3840,
            VIEW_HEIGHT: 2160,
            TILE_SIZE: 240,
            DEFAULT_IMPORTANCE: '1'
        },

        /**
        * Urls de Imagens padrões usadas pelo sistema.
        * 
        * @type {Object}
        * @property {string} background - Imagem utilizada como fundo das entradas da Biblioteca e das Timelines.
        * @property {string} blankImg   - Imagem padrão usada para campos de imagem vazios.
        */
        urls: {
            background: './images/lib-background.png',
            blankImg: './images/blank-image.svg'
        },

        /**
        * Referência ao corpo do documento HTML.
        * 
        * @type {HTMLElement}
        */
        html: document.body,

        /**
        * Instância de SQL usada pela aplicação.
        * @type {Object}
        */
        sql: window.sql,

        /**
         * Instância de Templates de Handlebars usada pela aplicação.
         * @type {Object}
         
        templates: window.templates,
        */

        /**
         * Instância de Crypto usada pela aplicação.
         * @type {Object}
         */
        crypto: window.crypto,

        /**
        * Cria uma WeakMap para armazenar arquivos maiores.
        * @type {WeakMap}
        * */
        store: store,

        /**
        * Instância do conversor de CSS usada pela aplicação.
        * @type {Object}
        */
        cssConverter: window.cssConverter,

        /**
        * Instância de funções auxiliares gerais.
        * 
        * @type {Utils}
        */
        utils: utils,

        /**
        * Instância de funções auxiliares de manipulação de código HTML.
        * 
        * @type {Parser}
        */
        parser: parser,

        /**
        * Referência ao formulário, utilizado em várias partes da aplicação.
        * 
        * @type {Object|null}
        */
        form: null,

        /**
        * LatLng onde o último clique no mapa ocorreu.
        * 
        * @type {L.LatLng|null}
        */
        clickLatLang: null,

        /**
         * Camada de sobreposição do mapa.
         * 
         * @type {Object|null}
         */
        mapOverlay: null,

        /**
        * Informações relacionadas ao tempo (como o valor do ano e a era).
        * 
        * @type {Object}
        * @property {Object} y - Objeto com valor e label do ano.
        * @property {string} era - A era representada (por exemplo, 'd.T.').
        */
        time: {
            y: {
                value: 1,
                label: '1'
            },
            era: 'd.T.'
        }
    };

    exports.utils = utils;
    exports.parser = parser;

    return exports;
})({});