/**
* Adiciona um método get ao Set.prototype para buscar um membro do conjunto com base no valor da propriedade _id.
*
* @method get
* @memberof Set.prototype
* @param {_id} _id - O valor da propriedade _id a ser buscado.
* @returns {Object|undefined} O membro do conjunto que tem a propriedade _id igual ao valor fornecido, ou undefined se não encontrar.
*/
export function get(_id) {
    let _value = undefined;

    // Itera sobre os membros do conjunto.        
    for (const member of this.toArray()) {
        // Verifica se o membro tem uma propriedade _id e se ela é igual ao _id fornecido.
        if (member._id === _id) {
            _value = member; 
            break;}
    }
    return _value;
}

/**
* Adiciona um método set ao Set.prototype para editar um membro do conjunto com base no valor da propriedade _id com o valor _value.
*
* @method set
* @memberof Set.prototype
* @param {_id} _id - O valor da propriedade _id a ser buscado.
* @param {_value} _value - O novo valor a ser atribuído ao membro encontrado.
* @returns {boolean} Retorna true se o membro foi encontrado e atualizado, ou false caso contrário.
*/
export function set(_id, _value) {
    // Itera sobre os membros do conjunto.        
    for (const member of this.toArray()) {
        // Verifica se o membro tem uma propriedade _id e se ela é igual ao _id fornecido.
        if (member._id === _id) {
            member = _value;
            return true;
        }
    }
    return false;
}

/**
* Adiciona um método remove ao Set.prototype para remover um membro do conjunto com base no valor da propriedade _id.
*
* @method remove
* @memberof Set.prototype
* @param {_id} _id - O valor da propriedade _id a ser buscado.
* @returns {boolean} Retorna true se o membro foi encontrado e removido, ou false caso contrário.
*/
export function remove(_id) {
    const _value = this.get(_id);
    if (_value) {
        this.delete(_value);
        return true;
    }
    return false;
}

/**
* Adiciona um método hasValue ao Set.prototype para verificar se existe um membro do conjunto com base em um valor informado.
*
* @method hasId
* @memberof Set.prototype
* @param {Object} data          - Uma propriedade que possua o valor _id.
* @returns {Boolean}            - Retorna true se o membro do conjunto tem uma propriedade _id igual ao valor fornecido, ou false caso contrário.
*/
export function hasId(data) {

    // Verifica se o argumento é um objeto e possui a propriedade _id.
    if (typeof data !== "object" || !data.hasOwnProperty("_id")) {
        throw new Error("O argumento deve ser um objeto com a propriedade '_id'.");
    }

    // Itera sobre os membros do conjunto.        
    for (const member of this) {
        // Verifica se o membro tem uma propriedade _id e se ela é igual ao _id fornecido.
        if (member._id === data._id) return true;
    }
    return false;
}

/**
   * Retorna a diferença entre dois conjuntos.
   * @memberof Set.prototype
   * 
   * @param {Set} other       - Outro conjunto para comparar
   * @returns {Set}           - A diferença, definida como os objetos deste conjunto que não estão presentes no outro
   */
export function difference(other) {
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
export function symmetricDifference(other) {
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
export function equals(other) {
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
export function first() {
    return this.values().next().value;
}

/**
 * Retorna o último valor do conjunto.
 * @memberof Set.prototype
 * 
 * @returns {*}             - O último elemento do conjunto, ou undefined
 */
export function last() {
    return this.toArray().last();
}

/**
 * Retorna a interseção entre dois conjuntos.
 * @memberof Set.prototype
 * 
 * @param {Set} other       - Outro conjunto para comparar
 * @returns {Set}           - A interseção entre ambos os conjuntos
 */
export function intersection(other) {
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
export function intersects(other) {
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
export function union(other) {
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
export function isSubset(other) {
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
export function toArray() {
    return Array.from(this);
}

/**
 * Converte um conjunto em um objeto JSON mapeando seu conteúdo para um array.
 * @memberof Set.prototype
 * 
 * @returns {Object}           - Os elementos do conjunto como um objeto.
 */
export function toObject() {
    if (this.size === 0) return {};

    const object = {};

    for (const item of this.toArray()) {
        if (item.hasOwnProperty('_id')) {
            object[item._id] = item;
        }
    }

    return object;
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
export function every(test) {
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
export function filter(test) {
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
* @param {null} [compareFn=null]        - Uma função de comparação opcional que define a ordem de classificação.
*                                         Se não for fornecida, os elementos serão ordenados em ordem lexicográfica.
* @returns {Set}                        - Um novo Set com os elementos ordenados.
*/
export function sort(compareFn = null) {
    // Converte o Set em um array.
    const sorted = Array.from(this);

    if (compareFn) {
        sorted.sort(compareFn);
    } else {
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
    }
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
export function find(test) {
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
export function map(transform) {
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
export function reduce(reducer, accumulator) {
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
export function some(test) {
    let i = 0;
    for (const v of this) {
        if (test(v, i, this)) return true;
        i++;
    }
    return false;
}

/**
 * Verifica se o conjunto está vazio.
 * @memberof Set.prototype
 * 
 * @returns {boolean} `true` se o conjunto estiver vazio, caso contrário `false`.
 */

export function isEmpty() {
    return this.size === 0;
}

console.log('UniForge | Atribuindo primitivos ao protótipo dos Sets...');
// Atribui primitivos ao protótipo de Set
Object.defineProperties(Set.prototype, {
    get: { value: get, configurable: true },
    set: { value: set, configurable: true },
    remove: { value: remove, configurable: true },
    hasId: { value: hasId, configurable: true },
    difference: { value: difference, configurable: true },
    symmetricDifference: { value: symmetricDifference, configurable: true },
    equals: { value: equals, configurable: true },
    every: { value: every, configurable: true },
    filter: { value: filter, configurable: true },
    find: { value: find, configurable: true },
    first: { value: first, configurable: true },
    last: { value: last, configurable: true },
    intersection: { value: intersection, configurable: true },
    intersects: { value: intersects, configurable: true },
    union: { value: union, configurable: true },
    isSubset: { value: isSubset, configurable: true },
    map: { value: map, configurable: true },
    reduce: { value: reduce, configurable: true },
    some: { value: some, configurable: true },
    sort: { value: sort, configurable: true },
    toArray: { value: toArray, configurable: true },
    toObject: { value: toObject, configurable: true },
    isEmpty: { value: isEmpty, configurable: true }
});