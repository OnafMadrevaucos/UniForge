import { Database } from "./tempDB.js";

export class LinkTooltip {
  forgeLink(link, text, callback) {

    const linkSpan = document.createElement('span');
    linkSpan.classList.add('linked-text');
    linkSpan.dataset.id = link.id;
    linkSpan.dataset.type = link.type;
    linkSpan.textContent = text;

    linkSpan.addEventListener('click', (event) => { callback(event); });

    return linkSpan.outerHTML;
  }

  async _showLinkTooltip(event) {
    const span = event.target.closest('.linked-text');
    
    const link = {
      id: span.dataset.id ?? null,
      type: span.dataset.type ?? null
    }

    let data = null;

    if (link.type == 'entry') data = await CONFIG.db.getEntryWithIcon(link.id);
    else data = await CONFIG.db.getTimelineWithIcon(link.id);

    if (data.length == 0) {
      console.warn('O Link não foi encontrado.');
      return;
    }

    if (data.length != 1) {
      console.warn('O Link está duplicado. Utilizando a primeira duplicata.');
    }

    data = data[0];

    let tooltip = document.querySelector('.link-tooltip');
    let entryTitle = null; // Elemento do Título da Entrada
    let entryTypeIcon = null; // Elemento do Ícone do Tipo da Entrada
    let entryIdParagraph = null; // Elemento do Identificador da Entrada
    let entryDescription = null; // Elemento da Descrição da Entrada

    // Verifica se o tooltip precisa ser criado
    if (!tooltip) {
      tooltip = document.createElement('div');
      tooltip.id = 'linkTooltip';
      tooltip.classList.add('link-tooltip', 'flexcol');

      const headerDiv = document.createElement('div');
      headerDiv.classList.add('header', 'flexrow');

      entryTitle = document.createElement('h3');
      entryTitle.id = 'entryTitle';

      entryTypeIcon = document.createElement('a');
      entryTypeIcon.id = 'entryTypeIcon';

      headerDiv.appendChild(entryTitle);
      headerDiv.appendChild(entryTypeIcon);

      entryIdParagraph = document.createElement('p');
      entryIdParagraph.id = 'entryIdParagraph';

      entryDescription = document.createElement('span');
      entryDescription.id = 'entryDescription';

      tooltip.appendChild(headerDiv);
      tooltip.appendChild(entryIdParagraph);
      tooltip.appendChild(entryDescription);

      document.body.appendChild(tooltip);
    } else {
      // Obtém os elements que compõem o tooltip já criado
      entryTitle = tooltip.querySelector('#entryTitle');
      entryTypeIcon = tooltip.querySelector('#entryTypeIcon');
      entryIdParagraph = tooltip.querySelector('#entryIdParagraph');
      entryDescription = tooltip.querySelector('#entryDescription');
    }

    // Preenche os elementos do tooltip
    entryTitle.textContent = data.title;
    entryTypeIcon.innerHTML = `<i class='${data.icon}'></i>`;
    entryIdParagraph.textContent = `${link.id}`;
    entryDescription.innerHTML = data.flavor;

    const iframe = document.querySelector('#textEditor_ifr'); // Substitua por um seletor que identifica o iframe do TinyMCE

    let coord = { X: 0, Y: 0 };

    if (iframe) {
      const rect = iframe.getBoundingClientRect();

      coord.X = span.offsetLeft + rect.left - 20;
      coord.Y = span.offsetTop + rect.top + 35;
    } else {
      coord.X = span.clientX - 20;
      coord.Y = span.clientY + 30;
    }

    tooltip.style.left = `${coord.X}px`;
    tooltip.style.top = `${coord.Y}px`;
    // Exibe o tooltip construído
    tooltip.classList.add('visible');
  }

  _hideLinkTooltip() {
    const tooltip = document.querySelector('.link-tooltip');
    if (tooltip) {
      tooltip.classList.remove('visible');
    }
  }
}