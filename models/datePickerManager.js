export class DatePickerManager
{  
  constructor(pickerId, date={}) {
    this.pickerId = pickerId;    

    this.ready = false;

    this.selectedDate = { 
      day: date?.day ?? null,
      month: date?.month ?? 0,
      year: date?.year ?? 1 
    };  // Sem uso do Date, valores customizados.

    this.currentMonth = this.selectedDate.month;
    this.currentYear = this.selectedDate.year;  

    // Modos de visualização
    this.currentView = 'days'; // 'days', 'months', 'years'

    // Defina meses, dias e anos customizados
    this.months = null;
    this.days = null;
    this.daysInMonth = null;
  }
  
  _setupDatePicker() {  
    this.dataGroup = document.getElementById(`${this.pickerId}`);

    this.dateInput = this.dataGroup.querySelector('#dateInput');
    this.dateDisplay = this.dataGroup.querySelector('#dateDisplay');
    this.calendar = this.dataGroup.querySelector('#calendar');
    this.calendarView = this.dataGroup.querySelector('#calendarView');
    this.calendarContent = this.dataGroup.querySelector('#calendarContent');
    this.monthYearDisplay = this.dataGroup.querySelector('#monthYearDisplay');
    this.prevGroupButton = this.dataGroup.querySelector('#prevGroup');
    this.nextGroupButton = this.dataGroup.querySelector('#nextGroup');

    // Abre ou fecha o calendário ao clicar
    this.dateInput.addEventListener('click', () => {
      this.calendar.classList.toggle('open');
    });
  
    
    // Fecha o calendário se clicar fora
    document.addEventListener('click', (e) => {
      if (this.calendar.classList.contains('open') && !this.dateInput.contains(e.target)) {
        this.currentView = 'days';
        this.updateCalendar();
  
        this.calendar.classList.remove('open');
      }
    });
    

    this.nextGroupButton.addEventListener('click', (event) => {
      event.stopPropagation(); // Impede que o clique "vaze" para o container e feche o calendário
      if(this.currentView === "days") {
        this.currentMonth++;
        if (this.currentMonth >= this.months.length) {
          this.currentMonth = 0;  // Volta para o primeiro mês
          this.currentYear++;  // Incrementa o ano
        }
      } else 
      {
        this.currentYear++;
        if (this.currentView === "years") {
          showYears();
        }
      }
      this.updateCalendar();
    });
  
    // Alterna a visualização de acordo com o clique no monthYearDisplay
    this.monthYearDisplay.addEventListener('click', (event) => {
      event.stopPropagation(); // Impede que o clique "vaze" para o container e feche o calendário
      if (this.currentView === 'days') {
        this.currentView = 'months';  // Primeira troca: mostra meses do ano
      } else if (this.currentView === 'months') {
        this.currentView = 'years';  // Segunda troca: mostra anos
      } else if (this.currentView === 'years') {
        this.currentView = 'days';  // Terceira troca: volta para dias
      }
      this.updateCalendar();
    });

    // Navegação entre meses
    this.prevGroupButton.addEventListener('click', (event) => {
      event.stopPropagation(); // Impede que o clique "vaze" para o container e feche o calendário
      if(this.currentView === "days") {
        this.currentMonth--;
        if (this.currentMonth < 0) {
          this.currentMonth = this.months.length - 1;  // Volta para o último mês
          this.currentYear--;  // Decrementa o ano
        }
      } else {
        this.currentYear--;
        if (this.currentView === "years") {
          showYears();
        }
      }
      this.updateCalendar();
    });

    this.ready = true;
  }

  _reloadDatePicker(dateType, clearText=true) {
    // Se o DatePicker ainda não foi inicializado, inicialize-o
    if(!this.ready) this._setupDatePicker();

    if(clearText) this.dateDisplay.textContent = 'Selecione uma data';

    // Defina meses, dias e anos customizados
    this.months = dateType.months;
    this.days = dateType.days;
    this.daysInMonth = dateType.daysInMonth;
  }

  _loadDatePicker(dateType, clearText=true) {
    this._reloadDatePicker(dateType, clearText);
    
    this.updateCalendar(); // Inicializa o calendário
  }

  // Função para atualizar o calendário conforme o modo
  updateCalendar() {
    this.refreshCalendar();

    this.changeView(this.currentView);
  }
  // Função para atualizar o calendário conforme o valor da data selecionada.
  refreshCalendar() {
    this.calendarContent.innerHTML = '';
    this.monthYearDisplay.textContent = `${this.months[this.currentMonth]} ${this.currentYear}`;

    this.calendarView.classList.remove(...this.calendarView.classList);
    this.calendarView.classList.add("calendar-view", this.currentView);
  }

  changeView(newView) {
    // Adiciona a classe de animação
    this.calendarView.classList.add('zoom-out');
    // Aguarda a conclusão da animação antes de mudar a visualização
    setTimeout(() => {
      this.calendarView.classList.remove('zoom-out');
  
      // Lógica para mudar a visualização (ajustar para sua lógica específica)
      switch (newView) {
        case 'days':
          this.showDays();
          break;
        case 'months':
          this.showMonths();
          break;
        case 'years':
          this.showYears();
          break;
      }
    }, 100);
  }

  // Seleciona um mês
  selectMonth(month) {
    this.currentMonth = month;
    this.currentView = 'days';  // Volta para a exibição de dias após escolher o mês
    this.updateCalendar();
  }

  // Seleciona um ano
  selectYear(year) {
    this.currentYear = year;
    this.currentView = 'months';  // Volta para a exibição de meses após escolher o ano
    this.updateCalendar();
  }  
  
  // Seleciona a data
  selectDate(day) {
    this.currentDay = day;

    this.selectedDate = { day: day, month: this.currentMonth, year: this.currentYear };
    this.dateDisplay.textContent = `${this.months[this.currentMonth]} ${day},  ${this.currentYear}`;
    this.dataGroup.dataset.date = `${day}/${this.months[this.currentMonth]}/${this.currentYear}`;
  }

  // Seleciona a data completa
  selectFullDate(day, month, year) {
    this.currentDay = day;
    this.currentMonth = month;
    this.currentYear = year;

    this.selectedDate = { day: day, month: this.currentMonth, year: this.currentYear };
    this.dateDisplay.textContent = `${this.months[this.currentMonth]} ${day},  ${this.currentYear}`;
    this.dataGroup.dataset.date = `${day}/${this.months[this.currentMonth]}/${this.currentYear}`;

    this.refreshCalendar();
  }

  // Exibe os dias do mês
  showDays() {    
    // Exibe os dias da semana
    this.days.forEach(day => {
      const dayHeader = document.createElement('div');
      dayHeader.textContent = day;
      dayHeader.style.fontWeight = 'bold';
      this.calendarContent.appendChild(dayHeader);
    });
    
    const daysInCurrentMonth = this.daysInMonth[this.currentMonth];
    for (let i = 1; i <= daysInCurrentMonth; i++) {
      const day = document.createElement('div');
      day.textContent = i;
      day.className = 'day';
      day.addEventListener('click', () => this.selectDate(i));
      this.calendarContent.appendChild(day);
    }
  }

  // Exibe os meses do ano
  showMonths() {   
    // Exibe os meses do ano
    this.months.forEach((monthName, index) => {
      const month = document.createElement('div');
      month.textContent = monthName;
      month.className = 'month';
      month.addEventListener('click', (event) => {
        event.stopPropagation();
        this.selectMonth(index)
      });
      this.calendarContent.appendChild(month);
    });
  }

  // Exibe as décadas
  showYears() {
    // Calcula os 20 anos pertencentes ao intervalo 9 anteriores e 10 posteriores
    const years = Array.from({ length: 20 }, (_, i) => this.currentYear - 9 + i).filter(year => year !== this.currentYear);

    years.forEach((year) => {
      const yearDiv = document.createElement('div');
      yearDiv.textContent = year;
      yearDiv.className = 'year';
      yearDiv.addEventListener('click', (event) => {
        event.stopPropagation();
        this.selectYear(year);
      });
      this.calendarContent.appendChild(yearDiv);
    });
  }
}