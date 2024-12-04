import { AtlasForm } from "./modules/forms/atlasForm.js";
import { EncycloForm } from "./modules/forms/encycloForm.js";
import { HistoryForm } from "./modules/forms/historyForm.js";
import { LibraryForm } from "./modules/forms/libraryForm.js";
import { PoliticsForm } from "./modules/forms/politicsForm.js";
import { SettingsForm } from "./modules/forms/settingsForm.js";
import { TimelineForm } from "./modules/forms/timelineForm.js";
import { LinkTooltip } from "./modules/linkTooltip.js";
import { DBManager } from "./modules/managers/dbManager.js";
import { MsgBoxManager } from "./modules/managers/msgBoxManager.js";
import { NavQueue } from "./modules/navQueue.js";

// Constante Global
window.C = {
  db: new DBManager(),
  map: L.map('map', {
    crs: L.CRS.Simple, // Usando o sistema de coordenadas simples do Leaflet para imagens personalizadas
    center: [0.0, 0.0],
    maxZoom: 3,
    minZoom: -2,
    //zoomLevel: calculateZoomForTileScaleSimple(165),
    zoomSnap: 0.1,   
    zoomControl: false, // Desativa o controle de zoom padrão para personalizá-lo
    maxBoundsViscosity: 1.0
  }),
  drawnItems: new L.FeatureGroup(),
  html: document.body,
  ctrls: {
    main: null,
    draw: null,
    grid: null,
    tinymce: tinymce,
    msgBox: new MsgBoxManager(6),
    tooltip: new LinkTooltip()
  }, 
  form: null, 
  navQueue: new NavQueue(), // Fila de controle de navegação
  contants: {
    MIN_POINTS: 2000,
    IMG_WIDTH: 5850,
    IMG_HEIGHT: 4550,
    VIEW_WIDTH: 3840,
    VIEW_HEIGHT: 2160,
    TILE_SIZE: 240    
  },
  clickLatLang: null,
  mapOverlay: null,  
  time: {
    y: {
      value: 1,
      label: '1'
    },
    era: 'd.T.'
  }
}

// Inicializa o Mapa, ajustando a visualização com base nas coordenadas de imagem
const map = C.map;

// Cria a camada de armazenagem das Layers do Mapa
const drawnItems = C.drawnItems;

// Atalho para o Controle de Mensagens para o Usuário
C.msgBox = C.ctrls.msgBox;
// Atalho para o Controle de Tooltips de Entradas
C.tooltip = C.ctrls.tooltip;

ConfigureElements();
ConfigureForms();

/** 
 * ------------------------------------------------------------------
 * FUNÇÕES DE CONFIGURAÇÕES 
 * ------------------------------------------------------------------
 * */

// Funções de configuração dos Elements externos do aplicativo.
function ConfigureElements() {  
  ConfigureLeaflet();
  ConfigureTopBar();
}

// Configura a ferramenta de mapas Leaflet 
function ConfigureLeaflet() {

  // Calcula os limites de imagem com base na largura/altura
  const bounds = [[0, 0], [C.contants.VIEW_HEIGHT, C.contants.VIEW_WIDTH]];
  
  map.setMaxBounds(C.contants.IMG_HEIGHT, C.contants.IMG_WIDTH);
  // Ajusta a visualização inicial para se ajustar aos limites da imagem
  map.fitBounds(bounds);

  // Adiciona a imagem personalizada como uma camada de tile
  C.mapOverlay = L.imageOverlay('./images/map.jpg', bounds, { zIndex: 1 /* Garantir que fique atrás do Layer do Grid */ });  
  C.mapOverlay.addTo(map); 

  // Adicionar evento de mousedown ou mousemove para capturar o clique e mover o mapa
  map.on('mousedown', function (e) {
    C.clickLatLang = e.latlng;  // Ponto de clique do usuário
  });

  const scale = L.control.scale({
    imperial: false
  });
  scale.addTo(map);
  
  // Adicione um evento para atualizar os limites ao redimensionar ou fazer zoom no mapa
  map.on('moveend', _checkMapVisibility);
  // Grupo para armazenar as camadas desenhadas  
  map.addLayer(drawnItems);

  // Cria os Menus de Controle do Mapa.
  CreateControls();  

  // Evento para capturar o desenho de polígonos
  map.on('draw:created', function (e) {
    const layer = e.layer;
    const type = e.layerType;

    layer.bindPopup(type);
 
    drawnItems.addLayer(layer);  
  });  
}
// Configura os elementos da Topbar de Ferramentas
function ConfigureTopBar() {
  const currentYearInput = document.getElementById('currentYear');
  const timeEraSpan = document.getElementById('timeEra');
  currentYearInput.value = C.time.y.label; 
  timeEraSpan.textContent = C.time.era;
}

// Cria os controles customizados do Leaflet
function CreateControls()
{
  // Cria o Menu de Controle para manipulação do mapa.
  const MainControl = L.Control.extend({
    options: {
      position: 'topright' // Posição no canto superior esquerdo
    },

    onAdd: function (map) {
      const container = L.DomUtil.create('div', 'leaflet-bar flexcol');

      const zoomInButton = L.DomUtil.create('button', 'leaflet-control-zoomIn');
      zoomInButton.innerHTML = '<i class="fa-solid fa-plus"></i>';
      L.DomEvent.on(zoomInButton, 'click', function() {
        map.zoomIn();
      });

      const zoomOutButton = L.DomUtil.create('button', 'leaflet-control-zoomOut');
      zoomOutButton.innerHTML = '<i class="fa-solid fa-minus"></i>';
      L.DomEvent.on(zoomOutButton, 'click', function() {
        map.zoomOut();
      });

      // Cria o botão para o controle
      const layerOptionsButton = L.DomUtil.create('button', 'leaflet-control-color');
      layerOptionsButton.innerHTML = '<i class="fa-solid fa-palette"></i>';
      // Adiciona o evento de clique para alterar a cor do mapa
      L.DomEvent.on(layerOptionsButton, 'click', function() {
        _fetchForm('layerOptions')
      });

      container.appendChild(zoomInButton);
      container.appendChild(zoomOutButton);
      container.appendChild(layerOptionsButton);

      return container;
    }
  }); 

  C.ctrls.main = new MainControl();
  
  // Cria o Menu de Desenho para manipulação dos Layers no mapa.
  const CustomDrawControl = L.Control.Draw.extend({
    options: {
      position: 'topright'
    },
    edit: {
      featureGroup: drawnItems
    },  
    
    onAdd: function(map) {
      const container = L.DomUtil.create('div', 'leaflet-bar flexcol');
      
      // Cria um botão de Polígono
      const polygonButton = L.DomUtil.create('button', 'leaflet-draw-button', container);
      polygonButton.innerHTML = '<i class="fa-solid fa-border-top-left"></i>'; // Emoji de atualização ou seu ícone customizado
      
      // Adiciona um evento de clique ao botão
      L.DomEvent.on(polygonButton, 'click', function() {
        // Ativar o desenho de polígono
        const polygonDrawer = new L.Draw.Polygon(map);
  
        // Evento para desativar após o clique inicial (impedindo início imediato)
         map.on('click', function startDrawing() {
          polygonDrawer.enable();
          map.off('click', startDrawing); // Remover o evento para evitar múltiplos cliques
        });
      });
  
      // Cria um botão de Polígono
      const retangleButton = L.DomUtil.create('button', 'leaflet-draw-button', container);
      retangleButton.innerHTML = '<i class="fa-solid fa-square"></i>'; // Emoji de atualização ou seu ícone customizado
      
      // Adiciona um evento de clique ao botão
      L.DomEvent.on(retangleButton, 'click', function() {
        // Ativar o desenho de retângulo
        const retangleDrawer = new L.Draw.Rectangle(map);
        retangleDrawer.enable();
  
        // Evento para desativar após o clique inicial (impedindo início imediato)
        map.on('click', function startDrawing() {
          retangleDrawer.enable();
          map.off('click', startDrawing); // Remover o evento para evitar múltiplos cliques
        });
      });
  
      // Cria um botão de Polígono
      const circleButton = L.DomUtil.create('button', 'leaflet-draw-button', container);
      circleButton.innerHTML = '<i class="fa-solid fa-circle"></i>'; // Emoji de atualização ou seu ícone customizado
      
      // Adiciona um evento de clique ao botão
      L.DomEvent.on(circleButton, 'click', function() {
        // Ativar o desenho de círculo
        const circleDrawer = new L.Draw.Circle(map);
        // Evento para desativar após o clique inicial (impedindo início imediato)
        map.on('click', function startDrawing() {
          circleDrawer.enable();
          map.off('click', startDrawing); // Remover o evento para evitar múltiplos cliques
        });
      });
  
      // Cria um botão de Marcador
      const markerButton = L.DomUtil.create('button', 'leaflet-draw-button', container);
      markerButton.innerHTML = '<i class="fa-solid fa-location-pin"></i>'; // Emoji de atualização ou seu ícone customizado
      
      // Adiciona um evento de clique ao botão
      L.DomEvent.on(markerButton, 'click', function() {
        // Ativar o desenho de marcador
        const markerDrawer = new L.Draw.Marker(map);
        map.on('click', function startDrawing() {
          markerDrawer.enable();
          map.off('click', startDrawing); // Remover o evento para evitar múltiplos cliques
        });
      });
      
      return container;
    }
  });

  C.ctrls.draw = new CustomDrawControl();

  const TransparentGridLayer = L.GridLayer.extend({
    createTile: function (coords) {
      // Create a tile with transparency
      const tile = document.createElement('canvas');
      tile.width = C.contants.TILE_SIZE; // Match your map's tile size
      tile.height = C.contants.TILE_SIZE;
      const ctx = tile.getContext('2d');
  
      // Draw grid lines
      ctx.strokeStyle = 'rgba(212, 198, 148, 0.5)'; // Grid line color
      ctx.lineWidth = 1;

      // Draw horizontal and vertical grid lines
      for (let i = 0; i <= C.contants.TILE_SIZE; i += 36) { // Adjust the grid cell size (36px here)
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, C.contants.TILE_SIZE);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(C.contants.TILE_SIZE, i);
        ctx.stroke();
      }
  
        return tile;
    },
  });

  C.ctrls.grid = new TransparentGridLayer({
    tileSize: C.contants.TILE_SIZE,
    opacity: 0.8, // Adjust transparency
    zIndex: 1000, // Ensure the grid is above other layers
  });

  C.ctrls.grid.addTo(map);
  C.ctrls.grid.bringToFront();

  // Adiciona o Menu de Controle ao Mapa.
  map.addControl(C.ctrls.main);
  map.addControl(C.ctrls.draw);
}

function calculateZoomForTileScaleSimple(desiredTileScale) {
  const tileSize = 165; // Tile size in pixels

  // Calculate the zoom level
  const zoomLevel = Math.log2(desiredTileScale / tileSize);
  return Math.round(zoomLevel); // Return the nearest zoom level
}

// Função que configura os diversos forms da aplicação
function ConfigureForms() {
  ConfigureMainListeners();
}
// Configura o listeners que tratam os eventos dos tabs do Menu Lateral e as rotinas de fechamento do Form
function ConfigureMainListeners() {  
  // Lógica de UI para o Menu Lateral
  const tabs = document.querySelectorAll('.tab');
  
  // Lógica de UI para o Menu de Ferramentas Superior.
  const topBar = document.getElementById('topBarContainer');
  const toggleTab = document.getElementById('toggleTab');
  // Lógica de UI para os botões do Menu de Ferramentas Superior.
  const libraryBtn = document.getElementById('libraryBtn');
  const timelineBtn = document.getElementById('timelineBtn');
  const tenYrsBack = document.getElementById('tenYearsBack');
  const oneYearBack = document.getElementById('yearBack');
  const oneYearFwr = document.getElementById('yearForward');
  const tenYrsFwr = document.getElementById('tenYearForward');

  const currentYearInput = document.getElementById('currentYear');

  toggleTab.addEventListener('click', () => {    
    topBar.classList.toggle('visible');
    toggleTab.classList.toggle('visible');
  });

  libraryBtn.addEventListener('click', (event) => { onTopbarButtonClick(event); });
  timelineBtn.addEventListener('click', (event) => { onTopbarButtonClick(event); });

  tenYrsBack.addEventListener('click', (event) => { onChangeTime(event, -10); });
  oneYearBack.addEventListener('click', (event) => { onChangeTime(event, -1); });
  oneYearFwr.addEventListener('click', (event) => { onChangeTime(event, 1); });
  tenYrsFwr.addEventListener('click', (event) => { onChangeTime(event, 10); });

  currentYearInput.addEventListener('change', function (event) { onChangeTimeInput(event); });

  // Adiciona o Listener para chamar o Form correto ao clicar nos itens do menu.
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      _fetchForm(tab.getAttribute('data-target'));
    });  
  });
}
/** 
 * ------------------------------------------------------------------
 * FUNÇÕES DE LISTENERS DOS FORMS
 * ------------------------------------------------------------------
 * */
function onTopbarButtonClick(event) {
  // Impedir que o clique no item desencadeie o clique fora do sidebar
  event.stopPropagation();
  const formContainer = document.getElementById('formContainer');
  formContainer.classList.add('fullscreen');
  const button = event.target.closest('.topbarBtn');

  _fetchForm(button.getAttribute('data-target'));
}

function onChangeTime(event, amount) {
  // Impedir que o clique no item desencadeie o clique fora do sidebar
  event.stopPropagation();

  _setTime(C.time.y.value + amount);
}
function onChangeTimeInput(event) {  
  var value = event.target.value; 

  // Remove qualquer caractere que não tenha valor numérico
  value = value.replace(/(?!^-)[^0-9]/g, '').replace(/(?!^)-/g, '');
  
  // Se for um número atualize o Timer
  if(value) {
    _setTime(value);
  } else {
    event.target.value = C.time.y.label;
  }
}

/** 
 * ------------------------------------------------------------------
 * FUNÇÕES DE CONTROLE INTERNO DA PÁGINA 
 * ------------------------------------------------------------------
 * */
function _fetchForm(targetId) { 
  const formOverlay = document.getElementById('formOverlay');  
  // Mostra o overlay do formulário com animação
  formOverlay.classList.remove('hidden');

  // Carrega o arquivo HTML do formulário correspondente
  _loadPartial(targetId);
}

// JavaScript to load partials
function _loadPartial(id) {
  // Defina o caminho para o arquivo HTML que você deseja carregar
  const filePath = `./menus/${id}.html`;

  // Use fetch() para carregar o conteúdo do arquivo
  fetch(filePath)
  .then(response => {
    if (!response.ok) {
      throw new Error('Erro ao carregar o arquivo: ' + response.statusText);
    }
    return response.text(); // Converte o conteúdo para uma string
  })
  .then(htmlString => {  
    const overlay = document.getElementById('formOverlay');
    overlay.querySelector('#formContent').innerHTML = htmlString;    

    switch(id){
      case 'atlas': {
        C.form = new AtlasForm(overlay);        
      } break;
      case 'encyclo': {
        C.form = new EncycloForm(overlay);
      } break;
      case 'history': {
        C.form = new HistoryForm(overlay);
      } break;
      case 'politics': {
        C.form = new PoliticsForm(overlay);
      } break;
      case 'library': {
        C.form = new LibraryForm(overlay);
      } break;
      case 'timeline': {
        C.form = new TimelineForm(overlay);
      } break;
      case 'settings': {
        C.form = new SettingsForm(overlay);
      } break;
      default: break;
    }

    C.form.showForm();
  })
  .catch(error => {
    console.error('Ocorreu um erro:', error);
  });  
}

function _setTime(year) {
  const currentYearInput = document.getElementById('currentYear');
  const timeEraSpan = document.getElementById('timeEra');

  // Armazena o valor antigo do Ano
  const oldValue = C.time.y.value;

  C.time.y.value = Number(year); 
  // Não existe ano 0, salte ou para 1 ou para -1
  if(C.time.y.value == 0) { 
    if(C.time.y.value > oldValue) { // O ano está avançando
      C.time.y.value = 1;
    } else { // O ano está retroagindo
      C.time.y.value = -1;
    }
  }
  C.time.y.label = (Math.abs(C.time.y.value)).toString();

  // Altera a era para antes da Tríade dos Heróis (ano negativo) ou depois da Tríade (ano positivo)
  C.time.era = (C.time.y.value > 0 ? 'd.T.' : 'a.T.');

  currentYearInput.value = C.time.y.label; 
  timeEraSpan.textContent = C.time.era;
}

// Calcular os limites baseados na posição e zoom atual
function _checkMapVisibility() {
  var mapBounds = map.getBounds(); // Obtém os limites da área visível do mapa
  var imageBounds = C.mapOverlay.getBounds(); // Obtém os limites da C.mapOverlay

  // Calculando os 8 pontos ao redor da C.mapOverlay
  var points = _getWatcherPoints(imageBounds, 0.85); // 25% de padding  
  var isVisible = mapBounds.intersects(points);

  // Se nenhum ponto da C.mapOverlay estiver visível, ajustar a posição do mapa
  if (!isVisible) {
           
    // Encontrar o ponto mais próximo do centro da tela
    var closestPoint = points[0];
    var closestDistance = map.distance(C.clickLatLang, points[0]);
    
    points.forEach(function(point) {
        var distance = map.distance(C.clickLatLang, point);
        if (distance < closestDistance) {
            closestPoint = point;
            closestDistance = distance;
        }
    });
    
    // Ajusta o mapa para garantir que pelo menos um ponto da C.mapOverlay esteja visível
    map.setView(closestPoint, map.getZoom(), {
      animate: true
    });
  }
}

// Função para calcular os pontos ao redor da C.mapOverlay com um padding (0.0 a 1.0)
function _getWatcherPoints(bounds, paddingRatio) {
  const southWest = bounds.getSouthWest();
  const northEast = bounds.getNorthEast();

  // Calculando o número de pontos baseado na precisão
  const { latPoints, lngPoints } = _calculatePrecision(bounds);

  // Calculando a diferença de latitude e longitude
  const latDiff = northEast.lat - southWest.lat;
  const lngDiff = northEast.lng - southWest.lng;

  // Calculando os limites com o padding de 25%
  const paddingLat = latDiff * paddingRatio;
  const paddingLng = lngDiff * paddingRatio;

  const points = [];

  // Gerando os pontos ao longo das bordas, considerando o padding e a precisão
  for (let i = 0; i < latPoints; i++) {
    for (let j = 0; j < lngPoints; j++) {
      const lat = southWest.lat + paddingLat + (i * latDiff / (latPoints - 1)) - paddingLat;
      const lng = southWest.lng + paddingLng + (j * lngDiff / (lngPoints - 1)) - paddingLng;
      points.push(L.latLng(lat, lng));
    }
  }

  return points;
}
// Função para calcular a quantidade de pontos com base na precisão e no tamanho da C.mapOverlay
function _calculatePrecision(bounds) {
  const southWest = bounds.getSouthWest();
  const northEast = bounds.getNorthEast();

  // Calculando a diferença de latitude e longitude
  const latDiff = northEast.lat - southWest.lat;
  const lngDiff = northEast.lng - southWest.lng;

  // Calculando a quantidade mínima de pontos para cobrir a C.mapOverlay
  const totalArea = latDiff * lngDiff;  // Área da C.mapOverlay
  const desiredPoints = Math.max(C.contants.MIN_POINTS, Math.sqrt(totalArea) * 100); // Ajuste para gerar pelo menos 1000 pontos

  // Determinando o número de pontos para latitude e longitude
  const latPoints = Math.ceil(Math.sqrt(desiredPoints * (latDiff / totalArea)));
  const lngPoints = Math.ceil(Math.sqrt(desiredPoints * (lngDiff / totalArea)));

  return { latPoints, lngPoints };
}