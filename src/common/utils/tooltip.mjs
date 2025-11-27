// tooltip-final.mjs — versão final, estável e otimizada

export function init({
    offsetX = 16,
    offsetY = 16,
    showDelay = 30
} = {}) {

    //--------------------------------------------------------------------
    // UTIL: aguarda document.body existir
    //--------------------------------------------------------------------
    function waitForBody() {
        return new Promise((resolve) => {
            if (document.body) return resolve();
            const onReady = () => {
                if (document.body) {
                    document.removeEventListener("DOMContentLoaded", onReady);
                    resolve();
                }
            };
            document.addEventListener("DOMContentLoaded", onReady);

            // fallback caso o DOMContentLoaded não dispare (módulos externos)
            const iv = setInterval(() => {
                if (document.body) {
                    clearInterval(iv);
                    document.removeEventListener("DOMContentLoaded", onReady);
                    resolve();
                }
            }, 20);
        });
    }

    //--------------------------------------------------------------------
    // CRIA A TOOLTIP UMA ÚNICA VEZ
    //--------------------------------------------------------------------
    const ttPromise = (async () => {
        await waitForBody();

        const tt = document.createElement("div");
        tt.className = "floating-tooltip";
        tt.style.position = "fixed";
        tt.style.left = "-9999px";
        tt.style.top = "-9999px";
        tt.style.pointerEvents = "none";

        document.body.appendChild(tt);

        // fallback: se a tooltip for desconectada por framework, reconectar
        const periodic = () => {
            if (!tt.isConnected) {
                document.body.appendChild(tt);
            }
        };
        setInterval(periodic, 1200);

        return tt;
    })();

    //--------------------------------------------------------------------
    // MEDIÇÃO ROBUSTA — nunca altera texto
    //--------------------------------------------------------------------
    function robustMeasure(tt) {
        const prev = {
            left: tt.style.left,
            top: tt.style.top,
            display: tt.style.display,
            transform: tt.style.transform,
            opacity: tt.style.opacity,
            visibility: tt.style.visibility
        };

        tt.style.left = "-9999px";
        tt.style.top = "-9999px";
        tt.style.display = "block";
        tt.style.transform = "none";
        tt.style.opacity = "1";
        tt.style.visibility = "hidden";

        const rect = tt.getBoundingClientRect();

        tt.style.left = prev.left;
        tt.style.top = prev.top;
        tt.style.display = prev.display;
        tt.style.transform = prev.transform;
        tt.style.opacity = prev.opacity;
        tt.style.visibility = prev.visibility;

        return rect;
    }

    //--------------------------------------------------------------------
    // POSICIONAMENTO
    //--------------------------------------------------------------------
    function choosePosition(ev, targetRect, ttRect) {
        const attempt = (x, y) => ({
            left: x,
            top: y,
            right: x + ttRect.width,
            bottom: y + ttRect.height
        });

        const inside = (r) =>
            r.left >= 0 &&
            r.top >= 0 &&
            r.right <= window.innerWidth &&
            r.bottom <= window.innerHeight;

        const c = [
            attempt(ev.clientX + offsetX, ev.clientY + offsetY),
            attempt(
                targetRect.left + (targetRect.width - ttRect.width) / 2,
                targetRect.bottom + offsetY
            ),
            attempt(
                targetRect.left + (targetRect.width - ttRect.width) / 2,
                targetRect.top - ttRect.height - offsetY
            ),
            attempt(
                targetRect.right + offsetX,
                targetRect.top + (targetRect.height - ttRect.height) / 2
            ),
            attempt(
                targetRect.left - ttRect.width - offsetX,
                targetRect.top + (targetRect.height - ttRect.height) / 2
            )
        ];

        const rectsOverlap = (a, b) =>
            !(a.right <= b.left || a.left >= b.right || a.bottom <= b.top || a.top >= b.bottom);

        for (const r of c) if (!rectsOverlap(r, targetRect) && inside(r)) return r;
        for (const r of c) if (!rectsOverlap(r, targetRect)) return r;

        return c[0];
    }

    async function applyPosition(ev) {
        if (!activeTarget) return;

        const tt = await ttPromise;
        const targetRect = activeTarget.getBoundingClientRect();
        const ttRect = robustMeasure(tt);

        if (ttRect.width === 0 || ttRect.height === 0) {
            // medição falhou — tentar novamente após um frame
            await new Promise(r => requestAnimationFrame(r));
            const ttRect2 = robustMeasure(tt);
            if (ttRect2.width === 0 || ttRect2.height === 0) return;
            positionFinal(tt, ttRect2, ev, targetRect);
            return;
        }

        positionFinal(tt, ttRect, ev, targetRect);
    }

    function positionFinal(tt, ttRect, ev, targetRect) {
        const pos = choosePosition(ev, targetRect, ttRect);

        let x = Math.max(4, Math.min(pos.left, window.innerWidth - ttRect.width - 4));
        let y = Math.max(4, Math.min(pos.top, window.innerHeight - ttRect.height - 4));

        tt.style.left = `${x}px`;
        tt.style.top = `${y}px`;
    }

    //--------------------------------------------------------------------
    // ESTADO
    //--------------------------------------------------------------------
    let activeTarget = null;
    let delayTarget = null;
    let showTimer = null;
    let rafId = null;
    let lastEv = null;

    function schedule(ev) {
        lastEv = ev;
        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => applyPosition(lastEv));
    }

    //--------------------------------------------------------------------
    // EVENTOS
    //--------------------------------------------------------------------
    document.addEventListener("pointerover", (ev) => {
        const el = ev.target.closest?.("[data-tooltip]");
        if (!el) return;

        delayTarget = el;
        clearTimeout(showTimer);

        showTimer = setTimeout(async () => {
            if (delayTarget !== el) return;
            activeTarget = el;

            const tt = await ttPromise;

            // Texto é definido APENAS aqui
            tt.textContent = activeTarget.dataset.tooltip ?? "";

            tt.classList.add("show");
            schedule(ev);
        }, showDelay);
    });

    document.addEventListener("pointerout", async (ev) => {
        const el = ev.target.closest?.("[data-tooltip]");
        if (!el) return;

        // Se o cursor ainda está DENTRO do mesmo elemento tooltip → ignorar
        if (ev.relatedTarget && el.contains(ev.relatedTarget)) {
            return; // pointer saiu de um filho para outro filho
        }

        // Se estamos realmente saindo do alvo
        if (activeTarget === el) {
            activeTarget = null;
            delayTarget = null;
            clearTimeout(showTimer);

            const tt = await ttPromise;
            tt.classList.remove("show");
            tt.style.left = "-9999px";
            tt.style.top = "-9999px";

            if (rafId) cancelAnimationFrame(rafId);
        }
    });

    document.addEventListener("pointermove", async (ev) => {
        document.addEventListener("pointermove", async (ev) => {
            const hovered = ev.target.closest?.("[data-tooltip]");

            // 1 — Se não está mais sobre nenhum elemento com tooltip → esconder
            if (!hovered) {
                if (activeTarget) {
                    const tt = await ttPromise;
                    tt.classList.remove("show");
                    tt.style.left = "-9999px";
                    tt.style.top = "-9999px";
                    activeTarget = null;
                }
                return;
            }

            // 2 — Atualiza posição apenas se estivermos exibindo tooltip
            if (activeTarget) schedule(ev);
        }, { passive: true });

        if (!activeTarget) return;
        schedule(ev);
    }, { passive: true });

    //--------------------------------------------------------------------
    // API opcional
    //--------------------------------------------------------------------
    return {
        async getElement() {
            return await ttPromise;
        }
    };
}
