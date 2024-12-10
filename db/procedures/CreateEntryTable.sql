-- SQLite
CREATE TABLE IF NOT EXISTS entry (
    id TEXT PRIMARY KEY,
    importance TEXT,                   -- Texto para representar a importância
    date_y INTEGER,                    -- Ano (como número inteiro)
    date_m INTEGER,                    -- Mês (como número inteiro)
    date_d INTEGER,                    -- Dia (como número inteiro)
    title TEXT,                        -- Título da entrada
    type TEXT,                         -- Tipo da entrada
    flavor TEXT,                       -- Sabor ou descrição adicional
    icon TEXT,                         -- Ícone associado (caminho ou identificador)
    text TEXT,                         -- Texto da entrada
    htmlString TEXT,                   -- HTML associado à entrada
    isDraft BOOLEAN DEFAULT 0          -- Indica se é um rascunho (falso por padrão)
)