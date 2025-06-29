const crypto = window.crypto;

/**
* Gera um ID de string alfanumérica aleatória de um comprimento solicitado usando `crypto.getRandomValues()`.
* @param {number} length    - O comprimento da string aleatória a ser gerada, que deve ser no máximo 16384.
* @return {string}          - Uma string contendo letras aleatórias (a-z) e números (0-9).
*/
export function randomID() {        
    const length = 16;

    const id = generateRandomString(length);
    return id;
}
/**
* Gera uma string aleatória de caracteres.
* @param {number} length    - O comprimento da string aleatória.
* @returns {string}         - A string aleatória gerada.
*/
export function generateRandomString(length, onlySmallCaps = false, onlyBigCaps = false) {    
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
export function generateRandomNumber(max, min = 0) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}