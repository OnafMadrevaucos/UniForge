import * as random from './random.mjs';
import * as parser from '../parsers/module.mjs';

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

/**
     * Carrega um template HTML de um arquivo externo.
     * 
     * @async
     * @function loadTemplate
     * @param {string} filePath - Caminho do arquivo do template.
     * @returns {Promise<string>} String HTML do conteúdo do arquivo.
     * @throws {Error} - Se o arquivo não for encontrado ou não for possível ler seu conteúdo.
     */
export async function loadTemplate(filePath) {
    const response = await fetch(filePath);
    if (!response.ok) throw new Error('Erro ao carregar o arquivo. Detalhes: ' + response.statusText);

    const htmlString = await response.text();
    return htmlString;
} 

/**
       * Testa se um valor é "vazio"; seja undefined ou um objeto sem conteúdo.
       * @param {*} value       - O valor a ser testado
       * @returns {boolean}     - O valor é vazio?
    */
export function isEmpty(value) {
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
       * Expressa um timestamp como uma string relativa
       * @param {Date|string} timeStamp   - Uma string de timestamp ou objeto Date a ser formatado como tempo relativo
       * @return {string}                 - Uma expressão em string para o tempo relativo
    */
export function timeSince(timeStamp) {
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
     * Função assíncrona para extrair os ícones do FontAwesome de um arquivo CSS.
     * Faz a leitura do arquivo CSS, converte seu conteúdo em texto, e tenta parseá-lo para JSON.
     * 
     * @async
     * @function extractFontAwesomeIcons
     * @returns {Promise<Object|null>} Um objeto JSON contendo as regras CSS convertidas ou `null` em caso de erro.
     */
export async function getFontAwesomeIcons() {
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
        const json = uniforge.parser.parseCssToJson(cssContent);
        Object.keys(json).forEach((key) => {
            const item = json[key];
            const selector = item.selector.replace('fa-', '');
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
export function formatFileSize(size, { decimalPlaces = 2, base = 10 } = {}) {
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
export function loremIpsum(numParagraphs) {
    console.log(`UniForge | Gerando ${numParagraphs} parágrafos de Lorem Ipsum...`);
    let paragraphs = '';
    for (let i = 0; i < numParagraphs; i++) {
        const numParagraphsToMerge = random.generateRandomNumber(40, 5); // Gera um número aleatório entre 5 e 40.
        const indices = [];
        const paragraphsToMerge = [];

        for (let j = 0; j < numParagraphsToMerge; j++) {
            let randomIndex;
            do {
                randomIndex = random.generateRandomNumber(_loremIpsum.length - 1);
            } while (indices.includes(randomIndex));
            indices.push(randomIndex);
            paragraphsToMerge.push(_loremIpsum[randomIndex]);
        }

        const mergedParagraph = paragraphsToMerge.join(' ');
        paragraphs += `<p>${mergedParagraph}</p>`;
    }

    return paragraphs;
}