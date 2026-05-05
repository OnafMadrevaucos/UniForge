import CustomDate from "../common/primitives/date.mjs";
export class LinkTooltip {
  constructor (keyword = 'linked-text') {
    // Armazena o seletor dos links para uso futuro.
    this.keyword = keyword;
  }

  forgeLink(link, text, callback) {

    const linkSpan = document.createElement('span');
    linkSpan.classList.add(this.keyword);
    linkSpan.dataset.id = link.id;
    linkSpan.dataset.type = link.type;
    linkSpan.textContent = text;

    linkSpan.addEventListener('click', (event) => { callback(event); });

    return linkSpan.outerHTML;
  }

  _showLinkTooltip(event) {
    const element = event.target.closest(`.${this.keyword}`);

    const link = {
      id: element.dataset.id ?? null,
      type: element.dataset.type ?? null
    }

    let data = null;

    switch (link.type) {
      case 'entry':
        data = uniforge.doc.entries.get(link.id);
        break;
      case 'event':
        data = uniforge.doc.events.get(link.id);
        break;
      case 'lineage':
        data = uniforge.doc.lineages.get(link.id);
        break;
      case 'timeline':
        data = uniforge.doc.timelines.get(link.id);
        break;
    }

    // Verifica se a entrada foi encontrada. Se não, não exibe o tooltip.
    if (!data) return;

    // Obtém o ícone do link a partir do capítulo.
    switch (link.type) {
      case 'entry': {
        const section = uniforge.doc.sections.get(data.sid);
        const chapter = uniforge.doc.chapters.get(section.cid);

        // Verifica se o capítulo foi encontrado. Se não, não exibe o tooltip.
        if (!chapter) return;

        // Obtém o ícone do link a partir do capítulo.
        data.icon = chapter.icon;
      }
        break;
      case 'event':
        data.icon = 'fa-calendar';
        break;
      case 'lineage':
        data.icon = 'fa-people-group';
        break;
      case 'timeline':
        data.icon = 'fa-timeline';
        break;
    }

    let tooltip = document.querySelector('.link-tooltip');
    let entryTitle = null; // Elemento do Título da Entrada
    let entryTypeIcon = null; // Elemento do Ícone do Tipo da Entrada
    let entryIdParagraph = null; // Elemento do Identificador da Entrada
    let entryDescription = null; // Elemento da Descrição da Entrada

    // Verifica se o tooltip precisa ser criado.
    if (!tooltip) {
      tooltip = document.createElement('div');
      tooltip.id = 'linkTooltip';
      tooltip.classList.add('link-tooltip', 'flexcol', 'visible');

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

      if (link.type === 'event') {
        const dateDiv = document.createElement('div');
        dateDiv.classList.add('date', 'flexrow');

        const calendar = uniforge.doc.calendars.get(data.clid);

        const startDate = new CustomDate(calendar, { day: data.s_day, month: data.s_month, year: data.s_year });
        const endDate = new CustomDate(calendar, { day: data.e_day, month: data.e_month, year: data.e_year });

        const startDateSpan = document.createElement('span');
        startDateSpan.innerHTML = `<i class="fa-solid fa-hourglass-start"></i> ${startDate.toString('MMn DD, YYYYs')}`;
        dateDiv.appendChild(startDateSpan);

        if (!endDate.isEmpty) {
          const endDateSpan = document.createElement('span');
          endDateSpan.innerHTML = `<i class="fa-solid fa-hourglass-end"></i> ${endDate.toString('MMn DD, YYYYs')}`;
          dateDiv.appendChild(endDateSpan);
        }

        tooltip.appendChild(dateDiv);
      }

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
    entryTypeIcon.innerHTML = `<i class='fas ${data.icon}'></i>`;
    entryIdParagraph.textContent = `${link.id}`;
    entryDescription.innerHTML = data.flavor;

    // Verifica se o tooltip ultrapassa os limites da tela e ajusta a posição
    const tooltipRect = tooltip.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let coord = { X: 0, Y: 0 };
    coord.X = event.pageX - 20;
    coord.Y = event.pageY + 25;

    if (coord.X + tooltipRect.width > viewportWidth) {
      coord.X = viewportWidth - (tooltipRect.width + tooltipRect.width / 2); // Ajusta para manter o tooltip visível
    }
    if (coord.Y + tooltipRect.height > viewportHeight) {
      coord.Y = viewportHeight - (tooltipRect.height + tooltipRect.height / 2); // Ajusta para manter o tooltip visível
    }

    tooltip.style.left = `${coord.X}px`;
    tooltip.style.top = `${coord.Y}px`;
  }

  _hideLinkTooltip() {
    const tooltip = document.querySelector('.link-tooltip');
    if (tooltip) {
      tooltip.remove();
    }
  }
}