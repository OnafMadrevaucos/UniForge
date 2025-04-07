export const APP_STATES = {
    ERR_CLOSING: -1,
    CLOSED: 0,
    CLOSING: 1,
    OPENED: 2
}

export const FORM_STATES = {
    ERR_CLOSING: -1,
    CLOSED: 0,
    CLOSING: 1,
    OPENED: 2,
    MINIMIZED: 3,
    MOVING: 4
}

export function initState() {
    const state = localStorage.getItem('uniforge');
    if(!state) clearState();
    else updateState(['keep', false]);
}

export function clearState() {
    localStorage.setItem('uniforge', JSON.stringify({keep: false}));
}

export function updateState(params=[]) {
    const data = JSON.parse(localStorage.getItem('uniforge')) ?? {};
    if (data !== null) {
        params.forEach((p) => {  
            data[params[0]] = params[1]; // Atualiza o valor do parâmetro.
            localStorage.setItem('uniforge', JSON.stringify(data));
        });
    } else {
        console.log(`A chave '${chave}' não existe no localStorage.`);
    }
}

/**
 * Salva o estado atual da aplicação no armazenamento local.
 * @memberof uniforge
 * @function saveState
 * @description
 * Salva o tipo do formulário atual em localStorage para que possa ser
 * recuperado posteriormente.
 * @example
 * uniforge.state.save();
 */
export function saveState(keep = false, currentForm = {name: null, constructor: null, activeTab: 0}) {
    const data = { 
        keep: keep,       
        currentForm: currentForm,
    }
    const state = JSON.stringify(data, (key, value) => {
        if (value === null || value === '') {
          return undefined;
        }
        return value;
    });
    localStorage.setItem('uniforge', state);
}

/**
 * Carrega o estado salvo no armazenamento local.
 * @memberof uniforge
 * @function currentState
 * @description
 * Carrega o tipo do formulário atual salvo em localStorage e o recupera.
 * @example
 * uniforge.state.current();
 */
export async function currentState() {
    const state = localStorage.getItem('uniforge');
    if (state) {
        const data = JSON.parse(state);

        return data;

        // Recupera o formulário salvo.
        if(data.currentForm) {            
            const formClass = uniforge.forms[data.currentForm];
            // Verifica se o formulário atual é válido.
            if(formClass) {
                // Recupera o Formulário atual.
                await recoverForm(new formClass());
            }
        }
    }
}