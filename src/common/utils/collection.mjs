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
export function deepClone(original, { strict = false, _d = 0 } = {}) {
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
export function diffObject(original, other, { inner = false, deletionKeys = false, _d = 0 } = {}) {
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
export function duplicate(original) {
    return JSON.parse(JSON.stringify(original));
}

/**
     * Uma função auxiliar que percorre um objeto para recuperar um valor por uma chave de string.
     * O método também suporta arrays, caso a chave fornecida seja um índice inteiro do array.
     * A chave em string suporta a notação a.b.c, que retornaria object[a][b][c].
     * @param {object} object   - O objeto a ser percorrido.
     * @param {string} key      - Uma propriedade do objeto usando a notação a.b.c.
     * @return {*}              - O valor da propriedade encontrada.
    */
export function getProperty(object, key) {
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
export function getType(variable) {

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
     * Uma função auxiliar que busca por um objeto para atribuir um valor usando uma chave de string
     * Esta chave de string suporta a notação a.b.c, que direcionaria para object[a][b][c]
     * @param {object} object   - O objeto a ser atualizado
     * @param {string} key      - A chave de string
     * @param {*} value         - O valor a ser atribuído
     * @return {boolean}        - Se o valor foi alterado em relação ao seu valor anterior
    */
export function setProperty(object, key, value) {
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
 * Uma função auxiliar que testa se um objeto possui uma propriedade ou propriedade aninhada dada uma chave de string.
 * O método também suporta arrays se a chave fornecida for um índice inteiro do array.
 * A chave de string suporta a notação a.b.c, que retornaria verdadeiro se object[a][b][c] existir
 * @param {object} object   - O objeto a ser percorrido
 * @param {string} key      - Uma propriedade do objeto com a notação a.b.c
 * @returns {boolean}       - Um indicador se a propriedade existe
*/
export function hasProperty(object, key) {
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
export function mergeObjects(original, other = {}, {
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
 * Expande o object achatado para ser um object aninhado padrão, convertendo todas as chaves em notação de ponto para objetos internos.
 * Apenas objetos simples serão expandidos. Outros tipos de Object, como instâncias de classe, serão mantidos como estão.
 * @param {object} obj      - O objeto a ser expandido.
 * @returns {object}        - Um objeto expandido.
 * 
*/
function expandObject(obj) {
  const _expand = (value, depth) => {
    if ( depth > 32 ) throw new Error("Maximum object expansion depth exceeded");
    if ( !value ) return value;
    if ( Array.isArray(value) ) return value.map(v => _expand(v, depth+1)); // Map arrays
    if ( !isPlainObject(value) ) return value;                              // Return advanced objects directly
    const expanded = {};                                                    // Expand simple objects
    for ( const [k, v] of Object.entries(value) ) {
      setProperty(expanded, k, _expand(v, depth+1));
    }
    return expanded;
  };
  return _expand(obj, 0);
}

/**
   * Testa se dois objetos contêm as mesmas chaves e valores enumeráveis.
   * @param {object} a  O primeiro objeto.
   * @param {object} b  O segundo objeto.
   * @returns {boolean}
   */
export function objectsEqual(a, b) {
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

const plainObjectPrototype = Object.getPrototypeOf({});

/**
 * Determina se o valor é um objeto achatado; ou seja, cujo construtor é de um Object de null.
 * @param {unknown} value
 * @returns {boolean}
 */
function isPlainObject(value) {
  if ( !value ) return false;
  const prototype = Object.getPrototypeOf(value);
  return (prototype === plainObjectPrototype) || (prototype === null);
}