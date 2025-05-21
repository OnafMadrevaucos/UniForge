/**
* Capitaliza uma string, transformando o primeiro caractere em maiúsculo.
* @returns {string}
*/
export function capitalize() {
    if (!this.length) return this;
    return this.charAt(0).toUpperCase() + this.slice(1);
}

/**
   * Capitaliza uma string, transformando o primeiro caractere em maiúsculo.
   * @returns {string}
   */
export function isEmpty() {
    return (this.trim() === '' || this === null);
}

/**
   * Compara esta string (x) com outra string (y) comparando o valor do ponto de código Unicode de cada caractere.
   * Retorna um número negativo se x < y, um número positivo se x > y, ou zero caso contrário.
   * Esta é a mesma função de comparação usada pelo Array#sort se o argumento da função de comparação for omitido.
   * O resultado é independente do host/locale.
   * @param {string} other    A outra string para comparar com esta.
   * @returns {number}
*/
export function compare(other) {
    return this < other ? -1 : this > other ? 1 : 0;
}

/**
   * Converte uma string para o formato Title Case, onde a primeira letra de cada palavra é capitalizada.
   * @returns {string}
*/
export function titleCase() {
    if (!this.length) return this;
    return this.toLowerCase().split(' ').reduce((parts, word) => {
        if (!word) return parts;
        const title = word.replace(word[0], word[0].toUpperCase());
        parts.push(title);
        return parts;
    }, []).join(' ');
}

/**
   * Concatena esta string com outra, separando-as por um caractere ou string.
   * Se a string atual estiver vazia, retorna a outra string.
   * Se a outra string estiver vazia, retorna a string atual.
   * @param {string} other        A outra string a concatenar.
   * @param {string} separator    O caractere ou string a ser usada como separador ('' por padrão).
   * @returns {string}            A string concatenada.
*/
export function join(other, separator='') {
    if (this.isEmpty()) return other;
    if (other.isEmpty()) return this;
    return `${this}${separator}${other}`;    
}

console.log('UniForge | Atribuindo primitivos ao protótipo das Strings...');
// Atribui primitivos ao protótipo das Strings
Object.defineProperties(String.prototype, {
    capitalize: { value: capitalize, configurable: true },
    compare: { value: compare, configurable: true },
    isEmpty: { value: isEmpty, configurable: true },
    titleCase: { value: titleCase, configurable: true },
    join: { value: join, configurable: true }
});