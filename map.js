// Размер PNG
const width = 4960;
const height = 7015;

// Параметры из PGW
const pixelSizeX = 2.370967741935;
const pixelSizeY = -2.370919458304;

const topLeftX = -760.292207764065;
const topLeftY = 1579.390922422695;

// Вычисляем extent PNG
const imageExtent = [

    topLeftX,

    topLeftY + height * pixelSizeY,

    topLeftX + width * pixelSizeX,

    topLeftY

];

// ===============================
// Google Sheets CSV
// ===============================

const sheet1URL =
'https://docs.google.com/spreadsheets/d/e/2PACX-1vQHKLat89I0Y8aYJgrEbK9CRsDJdaIlvgLEgtzT8WP8m6nGgd9GShkzLQFLShQwjsg9KXOeCtN0p47_/pub?gid=0&single=true&output=csv';

const sheet2URL =
'https://docs.google.com/spreadsheets/d/e/2PACX-1vQHKLat89I0Y8aYJgrEbK9CRsDJdaIlvgLEgtzT8WP8m6nGgd9GShkzLQFLShQwjsg9KXOeCtN0p47_/pub?gid=1734047695&single=true&output=csv';

// ===============================
// Данные провинций
// ===============================

let provinceData = {};

let countryColors = {};
let religionColors = {};
let raceColors = {};
let resourceColors = {};
let tradeZoneColors = {};

// ===============================
// Активный режим карты
// ===============================

let currentMapMode = 'political';

// ===============================
// Состояния провинций
// ===============================

let hoveredFeature = null;
let selectedProvinceId = null;
let hoveredProvinceId = null;

// ===============================
// PNG слой
// ===============================

const imageLayer = new ol.layer.Image({

    source: new ol.source.ImageStatic({

        url: './karta_morprov.png',

        imageExtent: imageExtent,

        projection: 'EPSG:3857',

        interpolate: false

    })

});

// ===============================
// GeoJSON слой
// ===============================

const provincesSource = new ol.source.Vector({

    url: './provinces.geojson',

    format: new ol.format.GeoJSON({

        dataProjection: 'EPSG:3857',
        featureProjection: 'EPSG:3857'

    })

});

// ===============================
// Стили
// ===============================

// Обычный стиль
const defaultProvinceStyle = new ol.style.Style({

    fill: new ol.style.Fill({

        color: 'rgba(0,0,0,0)'

    }),

    stroke: new ol.style.Stroke({

        color: 'rgba(0,0,0,0)',
        width: 0

    })

});

// Наведение
const hoverProvinceStyle = new ol.style.Style({

    fill: new ol.style.Fill({

        color: 'rgba(255,255,180,0.75)'

    }),

    stroke: new ol.style.Stroke({

        color: 'rgba(0,0,0,0)',
        width: 0

    })

});

// Выделение
const selectedProvinceStyle = new ol.style.Style({

    fill: new ol.style.Fill({

        color: 'rgba(255,255,180,0.9)'

    }),

    stroke: new ol.style.Stroke({

        color: '#ffff00',
        width: 2

    })

});

// Поиск провинции
const searchProvinceStyle = new ol.style.Style({

    fill: new ol.style.Fill({

        color: 'rgba(0,0,0,0)'

    }),

    stroke: new ol.style.Stroke({

        color: '#ff0000',
        width: 3

    })

});

let searchedProvinceId = null;

// ===============================
// Загрузка CSV
// ===============================

Promise.all([

    fetch(sheet1URL).then(r => r.text()),
    fetch(sheet2URL).then(r => r.text())

]).then(function([csv1, csv2]) {

    // ===========================
    // Данные провинций
    // ===========================

    csv1.trim().split('\n').slice(1).forEach(function(rowStr) {

        const cols = rowStr.split(',');

        const id = cols[0];

        if (!id) return;

        provinceData[id] = {

            area: cols[1],
            name: cols[2],
            state: cols[3],
            race: cols[4],
            religion: cols[5],
            population: cols[6],
            resource: cols[7],
            tradeZone: cols[8]

        };

    });

    // ===========================
    // Цвета
    // ===========================

    csv2.trim().split('\n').slice(1).forEach(function(rowStr) {

        const cols = rowStr.split(',');

        if (cols[0] && cols[1]) {
            countryColors[cols[0].trim()] =
                '#' + cols[1].trim();
        }

        if (cols[6] && cols[7]) {
            religionColors[cols[6].trim()] =
                '#' + cols[7].trim();
        }

        if (cols[3] && cols[4]) {
            raceColors[cols[3].trim()] =
                '#' + cols[4].trim();
        }

        if (cols[9] && cols[10]) {
            resourceColors[cols[9].trim()] =
                '#' + cols[10].trim();
        }

        if (cols[12] && cols[13]) {
            tradeZoneColors[cols[12].trim()] =
                '#' + cols[13].trim();
        }

    });

    provincesLayer.changed();

    updateLegend();

});

// ===============================
// Слой провинций
// ===============================

const provincesLayer = new ol.layer.Vector({

    source: provincesSource,

    style: function(feature) {

    const featureId = feature.get('id');

    const province = provinceData[featureId];

    let fillColor = 'rgba(0,0,0,0)';
    let fillOpacity = 0;

    // =========================
    // Политическая карта
    // =========================

    if (
        currentMapMode === 'political' &&
        province &&
        province.state &&
        countryColors[province.state]
    ) {

        fillColor =
            countryColors[province.state];

        fillOpacity = 0.5;

    }

    // =========================
    // Религии
    // =========================

    if (
        currentMapMode === 'religion' &&
        province &&
        province.religion &&
        religionColors[province.religion]
    ) {

        fillColor =
            religionColors[province.religion];

        fillOpacity = 0.5;

    }

    // =========================
    // Расы
    // =========================

    if (
        currentMapMode === 'race' &&
        province &&
        province.race &&
        raceColors[province.race]
    ) {

        fillColor =
            raceColors[province.race];

        fillOpacity = 0.5;

    }

    // =========================
    // Ресурсы
    // =========================

    if (
        currentMapMode === 'resource' &&
        province &&
        province.resource &&
        resourceColors[province.resource]
    ) {

        fillColor =
            resourceColors[province.resource];

        fillOpacity = 0.5;

    }

    // =========================
    // Торговые зоны
    // =========================

    if (
        currentMapMode === 'trade' &&
        province &&
        province.tradeZone &&
        tradeZoneColors[province.tradeZone]
    ) {

        fillColor =
            tradeZoneColors[province.tradeZone];

        fillOpacity = 0.5;

    }

    // =========================
    // Поиск
    // =========================

    if (
        searchedProvinceId !== null &&
        featureId === searchedProvinceId
    ) {

        return new ol.style.Style({

            fill: new ol.style.Fill({
                color: fillColor.replace(')', ',' + fillOpacity + ')')
            }),

            stroke: new ol.style.Stroke({
                color: '#ff0000',
                width: 3
            })

        });

    }

    // =========================
    // Выделение
    // =========================

    if (
        selectedProvinceId !== null &&
        featureId === selectedProvinceId
    ) {

        return new ol.style.Style({

            fill: new ol.style.Fill({
                color: 'rgba(255,255,180,0.9)'
            }),

            stroke: new ol.style.Stroke({
                color: '#ffff00',
                width: 2
            })

        });

    }

    // =========================
    // Наведение
    // =========================

    if (
        hoveredProvinceId !== null &&
        featureId === hoveredProvinceId
    ) {

        return new ol.style.Style({

            fill: new ol.style.Fill({
                color: 'rgba(255,255,180,0.75)'
            }),

            stroke: new ol.style.Stroke({
                color: 'rgba(0,0,0,0)',
                width: 0
            })

        });

    }

    // =========================
    // Обычный стиль
    // =========================

    return new ol.style.Style({

        fill: new ol.style.Fill({

            color:
                fillOpacity > 0
                ? fillColor + '80'
                : 'rgba(0,0,0,0)'

        }),

        stroke: new ol.style.Stroke({

            color: 'rgba(0,0,0,0)',
            width: 0

        })

    });

}

});

// ===============================
// Слой подписей ID
// ===============================

let showProvinceIds = false;

const provinceLabelsLayer = new ol.layer.Vector({

    source: provincesSource,

    style: function(feature) {

        // Если режим выключен — ничего не рисуем
        if (!showProvinceIds) {
            return null;
        }

        return new ol.style.Style({

            text: new ol.style.Text({

                text: String(feature.get('id')),

                font: '14px Arial',

                fill: new ol.style.Fill({
                    color: '#000000'
                }),

                stroke: new ol.style.Stroke({
                    color: '#ffffff',
                    width: 3
                }),

                overflow: true

            })

        });

    }

});

// ===============================
// Поиск провинции
// ===============================

const searchInput = document.createElement('input');

searchInput.type = 'text';

searchInput.placeholder = 'ID провинции...';

searchInput.style.position = 'absolute';
searchInput.style.top = '10px';
searchInput.style.left = '80px';

searchInput.style.zIndex = '1000';

searchInput.style.padding = '6px';
searchInput.style.border = '1px solid black';

document.body.appendChild(searchInput);

const searchButton = document.createElement('button');

searchButton.innerHTML = 'Поиск';

searchButton.style.position = 'absolute';
searchButton.style.top = '10px';
searchButton.style.left = '230px';

searchButton.style.zIndex = '1000';

searchButton.style.padding = '6px 10px';
searchButton.style.background = 'white';
searchButton.style.border = '1px solid black';
searchButton.style.cursor = 'pointer';

document.body.appendChild(searchButton);

searchButton.addEventListener('click', function() {

    const searchId = searchInput.value.trim();

    // Сбрасываем прошлый поиск
    searchedProvinceId = null;

    if (!searchId) {

        provincesLayer.changed();

        return;

    }

    // Ищем province
    const features = provincesSource.getFeatures();

    const foundFeature = features.find(function(feature) {

        return String(feature.get('id')) === searchId;

    });

    // Если нашли
    if (foundFeature) {

        searchedProvinceId = searchId;

        // Геометрия
        const geometry = foundFeature.getGeometry();

        // Центр провинции
        const center =
            ol.extent.getCenter(
                geometry.getExtent()
            );

        // Перемещаем карту
        map.getView().animate({

            center: center,

            duration: 700,

            zoom: 3

        });

    }

    provincesLayer.changed();

});

// ===============================
// Карта
// ===============================

const map = new ol.Map({

    target: 'map',

    layers: [
        imageLayer,
        provincesLayer,
        provinceLabelsLayer
    ],

    view: new ol.View({

        projection: 'EPSG:3857',

        center: ol.extent.getCenter(imageExtent),

        resolutions: [

            16,
            8,
            4,
            2,
            1,
            0.5,
            0.25,
            0.125

        ],

        zoom: 1,

        minZoom: 0,
        maxZoom: 4,

        extent: imageExtent

    })

});

// ===============================
// Кнопка отображения ID
// ===============================

const idButton = document.createElement('button');

idButton.innerHTML = 'ID';

idButton.style.position = 'absolute';
idButton.style.top = '10px';
idButton.style.left = '40px';
idButton.style.zIndex = '1000';

idButton.style.padding = '6px 10px';
idButton.style.background = 'white';
idButton.style.border = '1px solid black';
idButton.style.cursor = 'pointer';

document.body.appendChild(idButton);

// Переключение отображения ID
idButton.addEventListener('click', function() {

    showProvinceIds = !showProvinceIds;

    provinceLabelsLayer.changed();

});

// ===============================
// Переключение режимов карты
// ===============================

const mapModeSelect =
document.createElement('select');

mapModeSelect.style.position = 'absolute';
mapModeSelect.style.top = '10px';
mapModeSelect.style.left = '330px';

mapModeSelect.style.zIndex = '1000';

mapModeSelect.style.padding = '6px';

mapModeSelect.innerHTML = `

<option value="political">
Политическая
</option>

<option value="religion">
Религии
</option>

<option value="race">
Расы
</option>

<option value="resource">
Ресурсы
</option>

<option value="trade">
Торговые зоны
</option>

`;

document.body.appendChild(mapModeSelect);

mapModeSelect.addEventListener('change', function() {

    currentMapMode =
        mapModeSelect.value;

    provincesLayer.changed();

    updateLegend();

});

// ===============================
// Подсветка при наведении
// ===============================

map.on('pointermove', function(event) {

    const feature = map.forEachFeatureAtPixel(

        event.pixel,

        function(feature) {
            return feature;
        }

    );

    // Если курсор над провинцией
    if (feature) {

        hoveredProvinceId = feature.get('id');

    }

    // Если курсор вне провинций
    else {

        hoveredProvinceId = null;

    }

    provincesLayer.changed();

});

// ===============================
// Координаты курсора
// ===============================

const coordsDiv = document.getElementById('coords');

map.on('pointermove', function(event) {

    const coords = event.coordinate;

    const x = Math.round(coords[0]);
    const y = Math.round(coords[1]);

    coordsDiv.innerHTML =
        `X: ${x} | Y: ${y}`;

});

// ===============================
// Popup
// ===============================

const popupElement = document.createElement('div');

popupElement.style.position = 'absolute';
popupElement.style.background = 'white';
popupElement.style.padding = '8px';
popupElement.style.border = '1px solid black';
popupElement.style.borderRadius = '6px';

const popup = new ol.Overlay({

    element: popupElement,

    positioning: 'bottom-center',

    offset: [0, -10],

    stopEvent: false

});

map.addOverlay(popup);

// ===============================
// Клик по провинции
// ===============================

map.on('click', function(event) {

    const feature = map.forEachFeatureAtPixel(

        event.pixel,

        function(feature) {
            return feature;
        }

    );

    // Клик по провинции
    if (feature) {

        selectedProvinceId = feature.get('id');

        popupElement.innerHTML =
            `ID: ${selectedProvinceId}`;

        popup.setPosition(event.coordinate);

    }

    // Клик по пустоте
    else {

        selectedProvinceId = null;

        popup.setPosition(undefined);

    }

    provincesLayer.changed();

});

// ===============================
// Легенда
// ===============================

const legendDiv =
document.createElement('div');

legendDiv.style.position = 'absolute';

legendDiv.style.top = '50px';
legendDiv.style.right = '10px';

legendDiv.style.zIndex = '1000';

legendDiv.style.background = 'white';

legendDiv.style.padding = '10px';

legendDiv.style.border =
    '1px solid black';

legendDiv.style.maxHeight = '400px';

legendDiv.style.overflowY = 'auto';

legendDiv.style.minWidth = '220px';

document.body.appendChild(legendDiv);

function updateLegend() {

    let colors = {};
    let title = '';

    if (currentMapMode === 'political') {

        colors = countryColors;
        title = 'Государства';

    }

    if (currentMapMode === 'religion') {

        colors = religionColors;
        title = 'Религии';

    }

    if (currentMapMode === 'race') {

        colors = raceColors;
        title = 'Расы';

    }

    if (currentMapMode === 'resource') {

        colors = resourceColors;
        title = 'Ресурсы';

    }

    if (currentMapMode === 'trade') {

        colors = tradeZoneColors;
        title = 'Торговые зоны';

    }

    let html =
        `<b>${title}</b><br><br>`;

    for (const name in colors) {

        html += `

        <div style="
            display:flex;
            align-items:center;
            margin-bottom:4px;
        ">

            <div style="
                width:18px;
                height:18px;
                background:${colors[name]};
                border:1px solid black;
                margin-right:6px;
                flex-shrink:0;
            "></div>

            <div>${name}</div>

        </div>

        `;

    }

    legendDiv.innerHTML = html;

}
