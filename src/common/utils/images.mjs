import { randomID } from "./random.mjs";


/**
 * Obtém os dados associados a um elemento HTML.
 * @param {HTMLElement} element  - O element do qual se deseja obter os dados.
 * @returns {Object}             - Os dados associados ao element.
 */
export function getAsociatedData(element) {
    const store = globalThis.store;

    return store.get(element) ?? null;
}
/**
        * Associa uma imagem a um elemento HTML.
        * @param {HTMLElement} element  - O element que receberá os dados.
        * @param {Object} data          - Dados a serem atrelados ao element.
        */
export function associateData(element, data) {
    console.log(`UniForge | Associando um dado ao element '${element.name}'...`);

    const store = globalThis.store;

    // Inicializa o WeakMap se ainda não foi criado.
    if (!store) globalThis.store = new WeakMap();

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
export async function blobToImage(blob, ext) {
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
        * Converte uma imagem para Blob.
        * @async
        * @param {string} file                    - A string do caminho para o arquivo da imagem.
        * @returns {{img:Blob, ext:string}}       - Objeto com o fluxo de dados da imagem em Blob e a extensão do arquivo.
        */
export async function imageToBlob(file) {
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
* Converte um array de dados binários para Blob.
* @async
* @param {Uint8Array} buffer              - Os dados binários da imagem.
* @param {string} fileExt                 - A extensão do arquivo da imagem.
* @returns {{img:Blob, ext:string}}       - Objeto com o fluxo de dados da imagem em Blob e a extensão do arquivo.
*/
export async function bufferToBlob(buffer, fileExt) {
    const data = {};
    if (buffer) {    // Se uma imagem foi informada, prepare-a para o banco de dados. 
        // Converte Uint8Array para base64 antes de salvar.
        let binaryString = '';
        for (let i = 0; i < buffer.length; i++) {
            binaryString += String.fromCharCode(buffer[i]);
        }
        const base64 = btoa(binaryString);

        data.rawData = base64;
        data.ext = fileExt;
    } else {
        data.rawData = null;
        data.ext = null;
    }

    return data;
}

/**
* Converte um array de dados binários para Blob.
* @async
* @param {Uint8Array} buffer              - Os dados binários da imagem.
* @param {string} fileExt                 - A extensão do arquivo da imagem.
* @returns {{img:Blob, ext:string}}       - Objeto com o fluxo de dados da imagem em Blob e a extensão do arquivo.
*/
export async function bufferToImage(buffer, fileExt) {
    if (buffer) {    // Se uma imagem foi informada, prepare-a para o banco de dados. 
        const imageType = `image/${fileExt}`;

        const imageData = new Blob([buffer], { type: imageType }); // Ajuste o tipo de imagem conforme necessário
        const imageURL = URL.createObjectURL(imageData);

        return imageURL;
    } else {
        return null;
    }
}