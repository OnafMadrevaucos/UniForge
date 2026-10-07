import LinkDialog from "../../models/dialogs/linkDialog.js";
import FilePickerDialog from "../../models/dialogs/filePickerDialog.js";

/**
   * Configura o editor TinyMCE com funcionalidades padrões.
   * @private
   * @param {Object} editor - Instância do editor TinyMCE.
   */
export function setupTinyMCE(editor) {
    // Update the image count on editor initialization
    editor.on('init', () => {
        _updateImageCount(editor)
    });

    // Update the image count whenever the content changes
    editor.on('input', () => {
        _checkEntryLinkShortcut(editor);
        _updateImageCount(editor)
    });
    editor.on('change', () => _updateImageCount(editor));
    editor.on('NodeChange', () => _updateImageCount(editor));

    /**
     * Registra o comando utilizado para criação de links de entradas.
     *
     * @param {tinymce.Editor} editor - Instância do editor TinyMCE.
     * @returns {void}
    */
    editor.addCommand('entryLink', (ui, keyword) => {
        onEntryLinkCreation(editor, keyword);
    });

    // Adiciona um botão para criar link no corpo do editor.
    editor.ui.registry.addButton('entryLink', {
        tooltip: 'Criar link',
        icon: 'bookmark',
        onAction: () => { editor.execCommand('entryLink'); }
    });

    // Adiciona um botão para enviar ao corpo do editor.
    editor.ui.registry.addButton('sendImage', {
        tooltip: 'Enviar Imagem',
        icon: 'image',
        onAction: () => { onUploadImage(editor); }
    });

    // Adiciona um botão para adicionar Lorem Ipsum ao corpo do editor.
    editor.ui.registry.addButton('addLoremIpsum', {
        tooltip: 'Adicionar Lorem Ipsum',
        icon: 'format-code',
        onAction: () => { onAddLoremIpsum(editor); }
    });

    /**
     * Ação personalizada no editor TinyMCE para criar ou modificar links.
     * @param {Object} editor        - Instância do editor TinyMCE.
     * @param {string|null} keyword  - Palavra-chave enviada pelo usuário.
    */
    async function onEntryLinkCreation(editor, keyword = null) {
        const selectedHtml = editor.selection.getContent();
        const link = await LinkDialog.configDialog();

        if (link) {
            const spanRegex = /<span[^>]*>(.*?)<\/span>/gi;
            if (spanRegex.test(selectedHtml)) {
                const unwrappedText = selectedHtml.replace(spanRegex, '$1').trim();
                editor.selection.setContent(unwrappedText);
            } else {
                if (!keyword) {
                    const selectedText = editor.selection.getContent({ format: 'text' });
                    if (selectedText) {
                        const leadingSpaces = selectedText.match(/^\s+/);
                        const trailingSpaces = selectedText.match(/\s+$/);

                        const trimmedText = selectedText.trim();
                        const wrappedContent = `${leadingSpaces ? leadingSpaces[0] : ''}@[${link.id}, ${link.type}]{${trimmedText}}${trailingSpaces ? trailingSpaces[0] : ''}`;
                        editor.selection.setContent(wrappedContent);
                    } else {
                        editor.notificationManager.open({
                            text: 'Favor selecionar um texto antes de criar um link.',
                            type: 'warning'
                        });
                    }
                }
                else {
                    // Limpa os espaços vazios no inicio e fim da palavra-chave.
                    const trimmedText = keyword.trim();
                    // Gere o link no texto da Entrada.
                    const wrappedContent = ` @[${link.id}, ${link.type}]{${trimmedText}} `;

                    // Obtém a posição atual da seleção/cursor do editor.
                    const range = editor.selection.getRng();

                    // Verifica se a posição atual é do tipo Texto (a única válida para um link).
                    // Se não, aborte.
                    if (range.startContainer.nodeType !== Node.TEXT_NODE)
                        return;

                    // Guarda o nó DOM da posição atual do editor.
                    const textNode = range.startContainer;
                    // Obtém a posição atual do cursor em específico dentro da seleção.
                    const cursorPosition = range.startOffset;
                    // Obtenha todo o texto do início até a posição atual do nó.
                    const textBeforeCursor = textNode.nodeValue.substring(0, cursorPosition);

                    // Expressão para encontrar o padrão '@{keyword}' dentro do nó.
                    const keywordRegex = new RegExp(
                        `@\\{${trimmedText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\}$`
                    );

                    // Realiza a busca do padrão.
                    const match = keywordRegex.exec(textBeforeCursor);

                    // Encontrou o padrão, então substitua-o pelo 'wrappedContent'.
                    if (match) {
                        // Posicão inicial do padrão dentro da seleção atual.
                        const startOffset = cursorPosition - match[0].length;
                        // Cria uma nova seleção dentro do editor.
                        const replacementRange = editor.dom.createRng();

                        // Definindo a posição inicial da nova seleção.
                        replacementRange.setStart(
                            textNode,
                            startOffset
                        );

                        // Definindo a posição final da nova seleção.
                        replacementRange.setEnd(
                            textNode,
                            cursorPosition
                        );

                        // Insere a nova seleção ao editor.
                        editor.selection.setRng(replacementRange);
                        // Subistitui o texto no editor.
                        editor.selection.setContent(wrappedContent);
                    }
                }
            }
        }
    }

    /**
     * Cria um ImagePicker e trata a ação do usuário de envio de uma imagem para o texto.
     * @private
     * @param {Object} editor - Instância do editor TinyMCE.
    */
    async function onUploadImage(editor) {
        // Abre o diálogo de seleção de imagem.
        const imageData = await FilePickerDialog.configDialog(null, { canUpload: true, hasCaption: true, type: 'image' });

        // Se uma imagem foi selecionada, insira-a no editor.
        if (imageData) {
            try {
                // Obtem o caminho completo da imagem.
                const fullPath = await uniforge.path.join(imageData.path);

                // Lê o arquivo de imagem como um buffer.
                const buffer = await uniforge.fs.readFile(fullPath);
                // Converte o buffer em um Blob com a extensão correta.
                const data = await uniforge.utils.bufferToBlob(buffer, imageData.ext);

                // Cria um objeto de imagem com os dados necessários.
                const image = {
                    uuid: imageData.uuid,
                    caption: imageData.caption,
                    data: data
                }

                // Recupera o elemento do editor TinyMCE.
                const editorTexarea = editor.targetElm;
                // Recupera a contagem de imagens no editor.
                const imgCount = Number(editorTexarea.dataset.imgCounter);

                // Cria o elemento <div> que envolverá a imagem e sua legenda.
                const imgWrapper = document.createElement('figure');
                imgWrapper.dataset.uuid = image.uuid;
                imgWrapper.className = 'img-wrapper image';
                imgWrapper.contenteditable = 'false';

                const newImage = document.createElement('img');
                const imageURL = await uniforge.utils.blobToImage(data.raw, data.ext);
                newImage.src = imageURL;

                imgWrapper.appendChild(newImage);

                if (image.caption) {
                    const newCaption = document.createElement('figcaption');
                    newCaption.className = 'img-caption';
                    newCaption.textContent = `Imagem ${imgCount + 1} - ${image.caption}`;
                    newCaption.contenteditable = 'true';

                    imgWrapper.appendChild(newCaption);
                }

                // Insira o HTML na posição atual do cursor.
                editor.execCommand('mceInsertContent', false, imgWrapper.outerHTML);
                // Registra o Blob da imagem no banco de dados.
                await uniforge.db.addTextImages(image);
                // Atualiza a contagem de imagens no editor.
                this._updateImageCount(editor);
            } catch (error) {
                this.msgBox.showError('Erro ao carregar a imagem.', error);
            }
        }
    }

    /**
    * Trata a ação do usuário de adição de 5 (Padrão) parágrafos de Lorem Ipsum na posição do cursor do editor.
    * @private
    * @param {Object} editor - Instância do editor TinyMCE.
    */
    function onAddLoremIpsum(editor) {
        const loremIpsum = uniforge.utils.loremIpsum(5);
        editor.execCommand('mceInsertContent', false, loremIpsum);
    }

    /**
     * Atualiza a contagem de imagens no editor.
     * Obtém o conteúdo atual do editor e conta as tags <img>.
     * Define o atributo data-img-counter do textarea do editor com a contagem de imagens.
     *
     * @param {Object} editor - O editor cujo conteúdo será analisado.
    */
    function _updateImageCount(editor) {
        const content = editor.getContent(); // Obtém o conteúdo atual do editor
        const imageCount = (content.match(/<img\b[^>]*>/gi) || []).length; // Conta as tags <img>

        const editorTextarea = editor.targetElm;
        editorTextarea.dataset.imgCounter = imageCount;
    }

    /**
      * Verifica se o texto recém-inserido corresponde ao fechamento
      * de um atalho de entrada no formato "@{palavra-chave}".
      *
      * @param {tinymce.Editor} editor - Instância do editor TinyMCE.
      * @returns {void}
    */
    function _checkEntryLinkShortcut(editor) {
        const selection = editor.selection;
        const range = selection.getRng();

        if (!selection.isCollapsed())
            return;

        const container = range.startContainer;

        if (container.nodeType !== Node.TEXT_NODE)
            return;

        const text = container.nodeValue;
        const cursorPosition = range.startOffset;
        const textBeforeCursor = text.substring(0, cursorPosition);

        const match = textBeforeCursor.match(/@\{([^{}]+)\}$/);

        if (!match)
            return;

        const keyword = match[1];

        editor.execCommand('entryLink', false, keyword);
    };
}

/**
   * Configura o editor TinyMCE com funcionalidades padrões.
   * @private
   * @param {Object} editor - Instância do editor TinyMCE.
   */
export function setupChapterTinyMCE(editor) {
    // Update the image count on editor initialization
    editor.on('init', () => {
        _updateImageCount(editor)
    });

    // Update the image count whenever the content changes
    editor.on('input', () => {
        _updateImageCount(editor)
    });
    editor.on('change', () => _updateImageCount(editor));
    editor.on('NodeChange', () => _updateImageCount(editor));

    // Adiciona um botão para enviar ao corpo do editor.
    editor.ui.registry.addButton('sendImage', {
        tooltip: 'Enviar Imagem',
        icon: 'image',
        onAction: () => { onUploadImage(editor); }
    });

    // Adiciona um botão para adicionar Lorem Ipsum ao corpo do editor.
    editor.ui.registry.addButton('addLoremIpsum', {
        tooltip: 'Adicionar Lorem Ipsum',
        icon: 'format-code',
        onAction: () => { onAddLoremIpsum(editor); }
    });

    /**
     * Cria um ImagePicker e trata a ação do usuário de envio de uma imagem para o texto.
     * @private
     * @param {Object} editor - Instância do editor TinyMCE.
    */
    async function onUploadImage(editor) {
        // Abre o diálogo de seleção de imagem.
        const imageData = await FilePickerDialog.configDialog(null, { canUpload: true, hasCaption: true, type: 'image' });

        // Se uma imagem foi selecionada, insira-a no editor.
        if (imageData) {
            try {
                // Obtem o caminho completo da imagem.
                const fullPath = await uniforge.path.join(imageData.path);

                // Lê o arquivo de imagem como um buffer.
                const buffer = await uniforge.fs.readFile(fullPath);
                // Converte o buffer em um Blob com a extensão correta.
                const data = await uniforge.utils.bufferToBlob(buffer, imageData.ext);

                // Cria um objeto de imagem com os dados necessários.
                const image = {
                    uuid: imageData.uuid,
                    caption: imageData.caption,
                    data: data
                }

                // Recupera o elemento do editor TinyMCE.
                const editorTexarea = editor.targetElm;
                // Recupera a contagem de imagens no editor.
                const imgCount = Number(editorTexarea.dataset.imgCounter);

                // Cria o elemento <div> que envolverá a imagem e sua legenda.
                const imgWrapper = document.createElement('figure');
                imgWrapper.dataset.uuid = image.uuid;
                imgWrapper.className = 'img-wrapper image';
                imgWrapper.contenteditable = 'false';

                const newImage = document.createElement('img');
                const imageURL = await uniforge.utils.blobToImage(data.raw, data.ext);
                newImage.src = imageURL;

                imgWrapper.appendChild(newImage);

                if (image.caption) {
                    const newCaption = document.createElement('figcaption');
                    newCaption.className = 'img-caption';
                    newCaption.textContent = `Imagem ${imgCount + 1} - ${image.caption}`;
                    newCaption.contenteditable = 'true';

                    imgWrapper.appendChild(newCaption);
                }

                // Insira o HTML na posição atual do cursor.
                editor.execCommand('mceInsertContent', false, imgWrapper.outerHTML);
                // Registra o Blob da imagem no banco de dados.
                await uniforge.db.addTextImages(image);
                // Atualiza a contagem de imagens no editor.
                this._updateImageCount(editor);
            } catch (error) {
                this.msgBox.showError('Erro ao carregar a imagem.', error);
            }
        }
    }

    /**
    * Trata a ação do usuário de adição de 5 (Padrão) parágrafos de Lorem Ipsum na posição do cursor do editor.
    * @private
    * @param {Object} editor - Instância do editor TinyMCE.
    */
    function onAddLoremIpsum(editor) {
        const loremIpsum = uniforge.utils.loremIpsum(5);
        editor.execCommand('mceInsertContent', false, loremIpsum);
    }

    /**
     * Atualiza a contagem de imagens no editor.
     * Obtém o conteúdo atual do editor e conta as tags <img>.
     * Define o atributo data-img-counter do textarea do editor com a contagem de imagens.
     *
     * @param {Object} editor - O editor cujo conteúdo será analisado.
    */
    function _updateImageCount(editor) {
        const content = editor.getContent(); // Obtém o conteúdo atual do editor
        const imageCount = (content.match(/<img\b[^>]*>/gi) || []).length; // Conta as tags <img>

        const editorTextarea = editor.targetElm;
        editorTextarea.dataset.imgCounter = imageCount;
    }
}

/**
 * Configura o editor TinyMCE com funcionalidades inline.
 * @protected
 * @param {Object} editor - Instância do editor TinyMCE.
*/
export function setupInlineTinyMCE(editor) {
    // Número máximo de caractéres do editor Tiny MCE de floreio.
    const maxCharacters = 255;

    // Sobrescreve o método setContent para limitar o conteúdo
    const originalSetContent = editor.setContent;

    editor.setContent = function (content, ...args) {
        if (editor.selection) {
            // Salva a posição atual do cursor
            const bookmark = editor.selection.getBookmark(2);

            const plainTextContent = editor.dom.create('div', null, content).innerText; // Remove tags HTML
            if (plainTextContent.length > maxCharacters) {
                const truncatedText = plainTextContent.substring(0, maxCharacters);
                const truncatedHtml = editor.dom.create('div', null, truncatedText).innerHTML;
                originalSetContent.call(editor, truncatedHtml, ...args);
            } else {
                originalSetContent.call(editor, content, ...args);
            }

            // Restaura o cursor para a posição salva
            if (bookmark) {
                editor.selection.moveToBookmark(bookmark);
            }
        }
    };

    // Evento para interceptar colagem
    editor.on('PastePreProcess', (e) => {
        const plainTextContent = editor.dom.create('div', null, e.content).innerText; // Remove HTML
        if (plainTextContent.length > maxCharacters) {
            const truncatedText = plainTextContent.substring(0, maxCharacters);
            const truncatedHtml = editor.dom.create('div', null, truncatedText).innerHTML;
            e.content = truncatedHtml; // Atualiza o conteúdo colado
        }
    });

    // Evento para evitar exceder o limite durante a digitação
    editor.on('input', () => {
        const plainTextContent = editor.getContent({ format: 'text' });
        if (plainTextContent.length > maxCharacters) {
            const truncatedText = plainTextContent.substring(0, maxCharacters);
            editor.setContent(truncatedText); // Trunca o conteúdo
        }
    });
}

/**
 * Opções para editores Tiny MCE. 
 * Qualquer função customizada ou callbacks deve ser mesclado a essas opções.
 * 
 * @type {Object}
 * @property {Object|null} default  - Opção padrão.
 * @property {Object|null} readonly - Opção de somente leitura.
 * @property {Object|null} simple   - Opção simplificada.
 * @property {Object|null} lite     - Opção sem botões do TinyMCE.
*/
export const options = {
    default: {
        init_instance_callback: (editor) => {
            editor.setContent(""); // Garante que o editor seja iniciado vazio.
        },
        editable_class: 'editable',
        body_class: 'main-editor',
        license_key: 'gpl',
        plugins: ['anchor', 'autolink', 'codesample', 'link', 'lists', 'searchreplace', 'table', 'visualblocks', 'image'],
        toolbar: 'undo redo | blocks | bold italic backcolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | entryLink blockquote sendImage | addLoremIpsum',
        toolbar_mode: 'wrap',
        placeholder: 'Descrição do registro...',
        block_formats: 'Heading 1=h1; Heading 2=h2; Heading 3=h3; Paragraph=p;',
        images_file_types: 'jpg,jpeg,png,svg,webp',
        image_caption: true,
        block_unsupported_drop: false,
        height: '100%',
        browser_spellcheck: true,
        menubar: false,
        resize: false,
        statusbar: false,
        skin: 'oxide-dark',        
    },
    chapter: {
        init_instance_callback: (editor) => {
            editor.setContent(""); // Garante que o editor seja iniciado vazio.
        },
        editable_class: 'editable',
        body_class: 'main-editor',
        license_key: 'gpl',
        plugins: ['anchor', 'autolink', 'codesample', 'link', 'lists', 'searchreplace', 'table', 'visualblocks', 'image'],
        toolbar: 'undo redo | blocks | bold italic backcolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | blockquote sendImage | addLoremIpsum',
        toolbar_mode: 'wrap',
        placeholder: 'Descrição do registro...',
        block_formats: 'Heading 1=h1; Heading 2=h2; Heading 3=h3; Paragraph=p;',
        images_file_types: 'jpg,jpeg,png,svg,webp',
        image_caption: true,
        block_unsupported_drop: false,
        height: '100%',
        browser_spellcheck: true,
        menubar: false,
        resize: false,
        statusbar: false,
        skin: 'oxide-dark',
    },
    readonly: {
        init_instance_callback: (editor) => {
            editor.setContent(""); // Garante que o editor seja iniciado vazio.
        },
        editable_class: 'editable',
        noneditable_class: 'non-editable',
        body_class: 'non-editable',
        license_key: 'gpl',
        plugins: ['anchor', 'autolink', 'codesample', 'link', 'lists', 'searchreplace', 'table', 'visualblocks', 'image'],
        toolbar: false,
        block_formats: 'Heading 1=h1; Heading 2=h2; Heading 3=h3; Paragraph=p;',
        images_file_types: 'jpg,jpeg,png,svg,webp',
        image_caption: true,
        block_unsupported_drop: false,
        height: '100%',
        menubar: false,
        resize: false,
        statusbar: false,
        skin: 'oxide-dark',
        readonly: true,
        disable_focus: true
    },
    simple: {
        init_instance_callback: (editor) => {
            editor.setContent(""); // Garante que o editor seja iniciado vazio.
        },
        body_class: 'simple-editor',
        license_key: 'gpl',
        plugins: 'quickbars',
        quickbars_selection_toolbar: 'undo redo | bold italic',
        quickbars_insert_toolbar: false,
        browser_spellcheck: true,
        menubar: false,
        inline: true,
        skin: 'oxide-dark',
    },
    lite: {
        init_instance_callback: (editor) => {
            editor.setContent(""); // Garante que o editor seja iniciado vazio.
        },
        body_class: 'lite-editor',
        license_key: 'gpl',
        browser_spellcheck: true,
        menubar: false,
        inline: true,
        skin: 'oxide-dark',
    }
};