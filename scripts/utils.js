export default class Utils{
    capitalizeFirstLetter(text) {
        if (!text) return ''; // Verifica se a string está vazia ou undefined
        return text.charAt(0).toUpperCase() + text.slice(1);
    }
}