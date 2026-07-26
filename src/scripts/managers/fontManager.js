export default class FontManager {

    /**
     * @param {Array<Object>} fonts Retorno do font-finder.list()
     */
    constructor(fonts = []) {
        if(!Array.isArray(fonts)) {
            fonts = Object.entries(fonts).map(([key, value]) => {
                return {
                    family: key,
                    variants: value
                };
            });            
        }            

        this.families = this.#build(fonts);
    }

    /**
     * Retorna todas as famílias ordenadas.
     */
    getAll() {
        return [...this.families.values()];
    }

    /**
     * Procura famílias pelo nome.
     */
    search(text) {
        text = text.trim().toLowerCase();

        return this.getAll().filter(f =>
            f.family.toLowerCase().includes(text)
        );
    }

    /**
     * Obtém uma família.
     */
    get(family) {
        return this.families.get(family) ?? null;
    }

    /**
     * Traduz uma família para CSS.
     */
    toCSS(family) {
        const font = this.get(family);

        if (!font)
            return "system-ui";

        return `"${font.family}", ${font.fallback}`;
    }
    toOptions() {
        return this.getAll().map(f => ({ _id: f.family, _label: f.family }));
    }

    /**
     * Cria a regra CSS completa.
     */
    createCSSVariable(variable, family) {
        return `${variable}: ${this.toCSS(family)};`;
    }

    /**
     * Retorna todas as categorias.
     */
    getCategories() {
        const map = new Map();

        for (const family of this.families.values()) {

            if (!map.has(family.category))
                map.set(family.category, []);

            map.get(family.category).push(family);
        }

        return map;
    }

    // ----------------------------------------------------------------------

    #build(fonts) {

        const map = new Map();

        for (const font of fonts) {

            const family =
                font.family ||
                font.familyName ||
                font.name;

            if (!family)
                continue;

            if (!map.has(family)) {

                let fallback = font.variants[0].type || font.variants[0].category || font.variants[0].fallback;
                if(!fallback || fallback === "unknown")
                    fallback = this.#detectFallback(family);

                map.set(family, {
                    family,
                    fallback,
                    css: `"${family}", ${fallback}`,
                    faces: []
                });
            }

            font.variants.forEach(variant => {
                map.get(family).faces.push(variant);
            });            
        }

        // Ordena faces
        for (const family of map.values()) {

            family.faces.sort((a, b) => {

                const wa = this.#weight(a);
                const wb = this.#weight(b);

                return wa - wb;
            });
        }

        // Ordena famílias
        return new Map(
            [...map.entries()]
                .sort((a, b) => a[0].localeCompare(b[0]))
        );
    }

    #weight(font) {

        if (typeof font.weight === "number")
            return font.weight;

        const style = (font.style || "").toLowerCase();

        if (style.includes("thin")) return 100;
        if (style.includes("extralight")) return 200;
        if (style.includes("light")) return 300;
        if (style.includes("regular")) return 400;
        if (style.includes("medium")) return 500;
        if (style.includes("semibold")) return 600;
        if (style.includes("bold")) return 700;
        if (style.includes("extrabold")) return 800;
        if (style.includes("black")) return 900;

        return 400;
    }

    #detectFallback(name) {

        name = name.toLowerCase();

        if (
            name.includes("mono") ||
            name.includes("code") ||
            name.includes("console") ||
            name.includes("courier") ||
            name.includes("consolas")
        )
            return "monospace";

        if (
            name.includes("times") ||
            name.includes("georgia") ||
            name.includes("garamond") ||
            name.includes("cambria") ||
            name.includes("serif")
        )
            return "serif";

        if (
            name.includes("emoji")
        )
            return "emoji";

        return "sans-serif";
    }

}