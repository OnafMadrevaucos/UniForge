export default class FontManager {
    constructor(fonts) {
        this.#families = new Map(
            [...Object.entries(fonts)]
                .sort((a, b) => a[0].localeCompare(b[0]))
        );
    }   

    get FALLBACKS() {
        return {
            serif: [
                "Times New Roman",
                "Times",
                "Georgia",
                "serif"
            ],

            sansSerif: [
                "Arial",
                "Helvetica",
                "sans-serif"
            ],

            monospace: [
                "Consolas",
                "Courier New",
                "monospace"
            ],

            cursive: [
                "Comic Sans MS",
                "cursive"
            ],

            fantasy: [
                "Impact",
                "fantasy"
            ]
        }
    };

    #families = new Map();

    get families() {
        return this.#families;
    }

    /**
     * Retorna todas as famílias ordenadas.
     */
    toArray() {
        return [...this.#families.values()];
    }

    /**
     * Procura famílias pelo nome.
     */
    search(text) {
        text = text.trim().toLowerCase();

        return this.toArray().filter(f =>
            f.family.toLowerCase().includes(text)
        );
    }

    /**
     * Traduz uma família para CSS.
     */
    toCSS(family) {
        if(family.isEmpty()) return '';

        const category = this.#findFontCategory(family);
        const fallbackCandidates = this.FALLBACKS[category];

        const availableFonts = this.#families.keys();
        const availableFallbacks = fallbackCandidates.filter(fallback => {
            if (fallback === "serif") return true;
            if (fallback === "sans-serif") return true;
            if (fallback === "monospace") return true;
            if (fallback === "cursive") return true;
            if (fallback === "fantasy") return true;

            return availableFonts.some(
                font => font.toLowerCase() === fallback.toLowerCase()
            );
        });

        return [
            `"${family}"`,
            ...availableFallbacks.map(font => {
                return font.includes(" ")
                    ? `${font}`
                    : font;
            })
        ].join(", ");
    }

    // ----------------------------------------------------------------------

    #build(fonts) {
        const map = new Map();
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

    #findFontCategory(font) {
        const family = font.toLowerCase();

        const monospaceFonts = [
            "consolas",
            "courier",
            "courier new",
            "monaco",
            "menlo",
            "source code",
            "fira code",
            "jetbrains mono",
            "cascadia",
            "ubuntu mono"
        ];

        const serifFonts = [
            "times",
            "times new roman",
            "georgia",
            "garamond",
            "cambria",
            "palatino",
            "baskerville",
            "libre baskerville",
            "merriweather"
        ];

        const sansSerifFonts = [
            "arial",
            "helvetica",
            "roboto",
            "open sans",
            "inter",
            "verdana",
            "tahoma",
            "calibri",
            "segoe",
            "segoe ui",
            "ubuntu",
            "noto sans",
            "fira sans",
            "lato",
            "montserrat",
            "poppins"
        ];

        const cursiveFonts = [
            "comic sans",
            "brush script",
            "pacifico",
            "dancing script"
        ];

        if (monospaceFonts.some(font => family.includes(font))) {
            return "monospace";
        }

        if (serifFonts.some(font => family.includes(font))) {
            return "serif";
        }

        if (sansSerifFonts.some(font => family.includes(font))) {
            return "sansSerif";
        }

        if (cursiveFonts.some(font => family.includes(font))) {
            return "cursive";
        }

        return "sansSerif";
    }
}