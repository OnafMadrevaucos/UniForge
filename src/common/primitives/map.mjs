/**
 * Retorna a união de dois Maps.
 * @memberof Map.prototype
 * 
 * @param {Map} other  - Outro Map.
 * @returns {Map}      - O Map de elementos que existem em ambos, as duplicatas são atualizadas pelos valores do 'other'.
 */
export function merge(other) {
    if (!(other instanceof Map)) throw new Error("Deve ser fornecida outra instância de Map.");

    other.forEach((value, key) => this.set(key, value));    
    return new Map(this);
}

/**
 * Converte este Map em um array.
 * @returns {Array} - Um array com os valores do Map.
 */
export function toArray() {
    return Array.from(this.values());
}

console.log('UniForge | Atribuindo primitivos ao protótipo dos Maps...');

Object.defineProperties(Map.prototype, {
    merge: { value: merge, configurable: true },
    toArray: { value: toArray, configurable: true }
});