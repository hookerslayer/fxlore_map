// =====================================
// Размер PNG
// =====================================

const width = 4960;
const height = 7015;

// =====================================
// Параметры PGW
// =====================================

const pixelSizeX = 2.370967741935;
const pixelSizeY = -2.370919458304;

const topLeftX = -760.292207764065;
const topLeftY = 1579.390922422695;

// =====================================
// Extent изображения
// =====================================

const imageExtent = [

    topLeftX,

    topLeftY + height * pixelSizeY,

    topLeftX + width * pixelSizeX,

    topLeftY

];

// =====================================
// Google Sheets CSV
// =====================================

const sheet1URL =
'https://docs.google.com/spreadsheets/d/e/2PACX-1vQHKLat89I0Y8aYJgrEbK9CRsDJdaIlvgLEgtzT8WP8m6nGgd9GShkzLQFLShQwjsg9KXOeCtN0p47_/pub?gid=0&single=true&output=csv';

const sheet2URL =
'https://docs.google.com/spreadsheets/d/e/2PACX-1vQHKLat89I0Y8aYJgrEbK9CRsDJdaIlvgLEgtzT8WP8m6nGgd9GShkzLQFLShQwjsg9KXOeCtN0p47_/pub?gid=1734047695&single=true&output=csv';

// =====================================
// Данные
// =====================================

let provinceData = {};

let countryColors = {};
let religionColors = {};
let raceColors = {};
let resourceColors = {};
let tradeZoneColors = {};

let hoveredProvinceId = null;
let selectedProvinceId = null;
let searchedProvinceId = null;

let showProvinceIds = false;

// =====================================
// Загрузка CSV
// =====================================

Promise.all([

    fetch(sheet1URL).then(r => r.text()),
    fetch(sheet2URL).then(r => r.text())

]).then(([csv1, csv2]) => {

    // =========================
    // Данные провинций
    // =========================

    csv1.trim().split('\n').slice(1).forEach(rowStr => {

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

    // =========================
    // Цвета
    // =========================

    csv2.trim().split('\n').slice(1).forEach(rowStr => {

        const cols = rowStr.split(',');

        if (cols[0] && cols[1]) {
            countryColors[cols[0].trim()] = '#' + cols[1].trim();
        }

        if (cols[6] && cols[7]) {
            religionColors[cols[6].trim()] = '#' + cols[7].trim();
        }

        if (cols[3] && cols[4]) {
            raceColors[cols[3].trim()] = '#' + cols[4].trim();
        }

        if (cols[9] && cols[10]) {
            resourceColors[cols[9].trim()] = '#' + cols[10].trim();
        }

        if (cols[12] && cols[13]) {
            tradeZoneColors[cols[12].trim()] = '#' + cols[13].trim();
        }

    });

    updateLegend();

});

// =====================================
// PNG слой
// =====================================

const imageLayer = new ol.layer.Image({

    source: new ol.source.ImageStatic({

        url: './karta_morprov.png',

        imageExtent: imageExtent,

        projection: 'EPSG:3857',

        interpolate: true

    })

});

// =====================================
// GeoJSON source
// =====================================

const provincesSource = new ol.source.Vector({

    url: './provinces.geojson',

    format: new ol.format.GeoJSON({

        dataProjection: 'EPSG:3857',
        featureProjection: 'EPSG:3857'

    })

});

// =====================================
// Стили
// =====================================

function getFillColor(feature) {

    const id = feature.get('id');

    if (!provinceData[id]) {
        return null;
    }

    if (currentMapMode === 'political') {

        return countryColors[
            provinceData[id].state
        ];

    }

    if (currentMapMode === 'religion') {

        return religionColors[
            provinceData[id].religion
        ];

    }

    if (currentMapMode === 'race') {

        return raceColors[
            provinceData[id].race
        ];

    }

    if (currentMapMode === 'resource') {

        return resourceColors[
            provinceData[id].resource
        ];

    }

    if (currentMapMode === 'trade') {

        return tradeZoneColors[
            provinceData[id].tradeZone
        ];

    }

    return null;

}

function getProvinceStyle(feature) {

    const id = feature.get('id');

    const fillColor = getFillColor(feature);

    let fillOpacity = 0;

    if (fillColor) {
        fillOpacity = 0.5;
    }

    // =========================
    // Поиск
    // =========================

    if (
        searchedProvinceId !== null &&
        id === searchedProvinceId
    ) {

        return new ol.style.Style({

            fill: new ol.style.Fill({

                color: 'rgba(0,0,0,0)'

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
        id === selectedProvinceId
    ) {
    
        return new ol.style.Style({
    
            fill: new ol.style.Fill({
    
                color: 'rgba(255,255,180,0.5)'
    
            }),
    
            stroke: new ol.style.Stroke({
    
                color: 'rgba(0,0,0,0)',
                width: 0
    
            }),
    
            zIndex: 9999
    
        });
    
    }

    // =========================
    // Обычный стиль
    // =========================

    return new ol.style.Style({

        fill: new ol.style.Fill({

            color: fillColor
                ? fillColor + '88'
                : 'rgba(0,0,0,0)'

        }),

        stroke: new ol.style.Stroke({

            color: 'rgba(0,0,0,0)',
            width: 0

        })

    });

}

// =====================================
// Основной слой провинций
// =====================================

const provincesLayer = new ol.layer.Vector({

    source: provincesSource,

    style: getProvinceStyle

});

// =====================================
// ID layer
// =====================================

const provinceLabelsLayer = new ol.layer.Vector({

    source: provincesSource,

    style: function(feature) {

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
                })

            })

        });

    }

});

// =====================================
// Карта
// =====================================

const map = new ol.Map({

    target: 'map',

    layers: [
    
        imageLayer,
        provincesLayer,
        provinceLabelsLayer
    
    ],

    view: new ol.View({

        projection: 'EPSG:3857',

        center:
            ol.extent.getCenter(imageExtent),

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
        maxZoom: 3,

        extent: imageExtent

    })

});

// =====================================
// Режим карты
// =====================================

let currentMapMode = 'political';

// =====================================
// Select карты
// =====================================

const layerSelect =
document.createElement('select');

layerSelect.style.position = 'absolute';
layerSelect.style.top = '10px';
layerSelect.style.right = '10px';

layerSelect.style.zIndex = '1000';

layerSelect.innerHTML = `

<option value="political">
Политическая
</option>

<option value="religion">
Религиозная
</option>

<option value="race">
Расовая
</option>

<option value="resource">
Ресурсная
</option>

<option value="trade">
Торговые зоны
</option>

`;

document.body.appendChild(layerSelect);

layerSelect.addEventListener(
    'change',
    function() {

        currentMapMode =
            layerSelect.value;

        provincesLayer.changed();

        updateLegend();

    }
);

// =====================================
// Легенда
// =====================================

const legendContainer =
document.createElement('div');

legendContainer.style.position =
'absolute';

legendContainer.style.top = '50px';
legendContainer.style.right = '10px';

legendContainer.style.zIndex = '1000';

legendContainer.style.background =
'white';

legendContainer.style.border =
'1px solid #999';

legendContainer.style.borderRadius =
'6px';

legendContainer.style.minWidth =
'220px';

legendContainer.style.maxHeight =
'400px';

legendContainer.style.overflow =
'hidden';

document.body.appendChild(
    legendContainer
);

const legendHeader =
document.createElement('div');

legendHeader.style.padding = '10px';

legendHeader.style.background =
'#f0f0f0';

legendHeader.style.cursor = 'pointer';

legendHeader.style.fontWeight =
'bold';

legendHeader.innerHTML =
'Легенда ▼';

legendContainer.appendChild(
    legendHeader
);

const legendContent =
document.createElement('div');

legendContent.style.display =
'none';

legendContent.style.padding =
'10px';

legendContent.style.maxHeight =
'320px';

legendContent.style.overflowY =
'auto';

legendContainer.appendChild(
    legendContent
);

let legendExpanded = false;

legendHeader.addEventListener(
    'click',
    function() {

        legendExpanded =
            !legendExpanded;

        if (legendExpanded) {

            legendContent.style.display =
            'block';

            legendHeader.innerHTML =
            'Легенда ▲';

        }

        else {

            legendContent.style.display =
            'none';

            legendHeader.innerHTML =
            'Легенда ▼';

        }

    }
);

// =====================================
// Обновление легенды
// =====================================

function updateLegend() {

    legendContent.innerHTML = '';

    let colors = {};

    if (currentMapMode === 'political') {
        colors = countryColors;
    }

    if (currentMapMode === 'religion') {
        colors = religionColors;
    }

    if (currentMapMode === 'race') {
        colors = raceColors;
    }

    if (currentMapMode === 'resource') {
        colors = resourceColors;
    }

    if (currentMapMode === 'trade') {
        colors = tradeZoneColors;
    }

    Object.entries(colors).forEach(
        ([name, color]) => {

            const row =
            document.createElement('div');

            row.style.display = 'flex';

            row.style.alignItems =
            'center';

            row.style.marginBottom =
            '5px';

            row.style.cursor =
            'pointer';

            const box =
            document.createElement('div');

            box.style.width = '20px';
            box.style.height = '20px';

            box.style.marginRight =
            '8px';

            box.style.border =
            '1px solid black';

            box.style.background =
            color;

            const text =
            document.createElement('div');

            text.innerText = name;

            row.appendChild(box);
            row.appendChild(text);

                        legendContent.appendChild(row);

        }
    );

}

// =====================================
// Кнопка ID
// =====================================

const idButton =
document.createElement('button');

idButton.innerHTML = 'ID';

idButton.style.position = 'absolute';

idButton.style.top = '10px';
idButton.style.left = '40px';

idButton.style.zIndex = '1000';

document.body.appendChild(idButton);

idButton.addEventListener(
    'click',
    function() {

        showProvinceIds =
            !showProvinceIds;

        provinceLabelsLayer.changed();

    }
);

// =====================================
// Поиск
// =====================================

const searchInput =
document.createElement('input');

searchInput.placeholder =
'ID провинции...';

searchInput.style.position =
'absolute';

searchInput.style.top = '10px';
searchInput.style.left = '80px';

searchInput.style.zIndex =
'1000';

document.body.appendChild(
    searchInput
);

const searchButton =
document.createElement('button');

searchButton.innerHTML =
'Поиск';

searchButton.style.position =
'absolute';

searchButton.style.top = '10px';
searchButton.style.left = '230px';

searchButton.style.zIndex =
'1000';

document.body.appendChild(
    searchButton
);

searchButton.addEventListener(
    'click',
    function() {

        const searchId =
            searchInput.value.trim();

        searchedProvinceId =
            null;

        const features =
            provincesSource.getFeatures();

        const foundFeature =
            features.find(feature => {

                return (
                    String(feature.get('id'))
                    === searchId
                );

            });

        if (foundFeature) {

            searchedProvinceId =
                searchId;

            const center =
                ol.extent.getCenter(
                    foundFeature
                    .getGeometry()
                    .getExtent()
                );

            map.getView().animate({

                center: center,

                zoom: 3,

                duration: 700

            });

        }

        provincesLayer.changed();

    }
);

// =====================================
// Popup
// =====================================

const popupElement =
document.createElement('div');

popupElement.style.background =
'white';

popupElement.style.padding =
'8px';

popupElement.style.border =
'1px solid black';

popupElement.style.borderRadius =
'6px';

const popup = new ol.Overlay({

    element: popupElement,

    positioning: 'bottom-center',

    offset: [0, -10],

    stopEvent: false

});

map.addOverlay(popup);

// =====================================
// Click
// =====================================

map.on(
    'click',
    function(event) {

        const feature =
        map.forEachFeatureAtPixel(

            event.pixel,

            function(feature) {

                    if (feature.get('hidden')) {
                        return null;
                    }
                    
                    return feature;

            }

        );

        if (feature) {

            selectedProvinceId =
                feature.get('id');

            const id =
                selectedProvinceId;

            let html =
                `ID: ${id}`;

            if (provinceData[id]) {

                html += `

                <br>
                Название:
                ${provinceData[id].name}

                <br>
                Государство:
                ${provinceData[id].state}

                <br>
                Религия:
                ${provinceData[id].religion}

                <br>
                Раса:
                ${provinceData[id].race}

                `;

            }

            popupElement.innerHTML =
                html;

            popup.setPosition(
                event.coordinate
            );

        }

        else {

            selectedProvinceId =
                null;

            popup.setPosition(
                undefined
            );

        }

        provincesLayer.changed();

    }
);

// =====================================
// Маркер координат
// =====================================

let coordinateMarkerEnabled = false;

const markerElement =
document.createElement('div');

markerElement.style.width = '18px';
markerElement.style.height = '18px';

markerElement.style.borderRadius = '50%';

markerElement.style.background =
'#ff0000';

markerElement.style.border =
'2px solid white';

markerElement.style.boxShadow =
'0 0 4px black';

markerElement.style.cursor =
'move';

// =========================
// Текст координат
// =========================

const markerCoordsLabel =
document.createElement('div');

markerCoordsLabel.style.position =
'absolute';

markerCoordsLabel.style.left =
'25px';

markerCoordsLabel.style.top =
'-5px';

markerCoordsLabel.style.whiteSpace =
'nowrap';

markerCoordsLabel.style.fontSize =
'14px';

markerCoordsLabel.style.fontWeight =
'bold';

markerCoordsLabel.style.color =
'black';

markerCoordsLabel.style.textShadow =
'0 0 3px white';

markerElement.appendChild(
    markerCoordsLabel
);

// =====================================
// Overlay маркера
// =====================================

const coordinateMarker =
new ol.Overlay({

    element: markerElement,

    positioning: 'center-center',

    stopEvent: false

});

map.addOverlay(
    coordinateMarker
);

// =====================================
// Обновление текста координат
// =====================================

function updateMarkerCoordinates(coords) {

    const x =
        Math.round(coords[0]);

    const y =
        Math.round(coords[1]);

    markerCoordsLabel.innerHTML =
        `X: ${x} | Y: ${y}`;

}

// =====================================
// Drag логика
// =====================================

let draggingMarker = false;

// =====================================
// Отключение перемещения карты
// =====================================

function setMapDragEnabled(enabled) {

    map.getInteractions().forEach(
        function(interaction) {

            if (
                interaction instanceof
                ol.interaction.DragPan
            ) {

                interaction.setActive(
                    enabled
                );

            }

        }
    );

}

// =====================================
// Начало перетаскивания
// =====================================

markerElement.addEventListener(
    'mousedown',
    function(event) {

        event.preventDefault();
        event.stopPropagation();

        draggingMarker = true;

        setMapDragEnabled(false);

    }
);

// =====================================
// Перетаскивание
// =====================================

window.addEventListener(
    'mousemove',
    function(event) {

        if (!draggingMarker) {
            return;
        }

        const pixel =
            map.getEventPixel(event);

        const coords =
            map.getCoordinateFromPixel(
                pixel
            );

        coordinateMarker.setPosition(
            coords
        );

        updateMarkerCoordinates(
            coords
        );

    }
);

// =====================================
// Завершение
// =====================================

window.addEventListener(
    'mouseup',
    function() {

        if (!draggingMarker) {
            return;
        }

        draggingMarker = false;

        setMapDragEnabled(true);

    }
);

// По умолчанию скрыт
markerElement.style.display =
'none';

// =====================================
// CSV маркеров
// =====================================

const markersSheetURL =
'https://docs.google.com/spreadsheets/d/e/2PACX-1vQHKLat89I0Y8aYJgrEbK9CRsDJdaIlvgLEgtzT8WP8m6nGgd9GShkzLQFLShQwjsg9KXOeCtN0p47_/pub?gid=146982985&single=true&output=csv';

// =====================================
// Группы маркеров
// =====================================

const markerGroups = {

    capital: [],
    city: [],
    port: [],
    fortress: [],
    poi: []

};

// =====================================
// Layer маркеров
// =====================================

const markersLayer =
new ol.layer.Vector({

    source: new ol.source.Vector()

});

map.addLayer(markersLayer);

// =====================================
// Стиль маркеров
// =====================================

function createMarkerStyle(
    type,
    name
) {

    const zoom =
        map.getView().getZoom();

    // =========================
    // Показывать ли подпись
    // =========================

    const showLabel =
        zoom >= 2 &&
        type !== 'Порт';

    // =========================
    // Общий text style
    // =========================

    const textStyle =
        showLabel

        ? new ol.style.Text({

            text: name,

            offsetX: 14,

            textAlign: 'left',

            font: '14px Arial',

            fill: new ol.style.Fill({
                color: '#ffffff'
            }),

            stroke: new ol.style.Stroke({
                color: '#000000',
                width: 3
            })

        })

        : null;

    // =================================
    // Столица
    // =================================

    if (type === 'Столица') {

        return new ol.style.Style({

            image: new ol.style.RegularShape({

                points: 5,

                radius: 12,

                radius2: 5,

                fill: new ol.style.Fill({
                    color: '#ffd700'
                }),

                stroke: new ol.style.Stroke({
                    color: '#000000',
                    width: 1
                })

            }),

            text: textStyle

        });

    }

    // =================================
    // Город
    // =================================

    if (type === 'Город') {

        return new ol.style.Style({

            image: new ol.style.Circle({

                radius: 6,

                fill: new ol.style.Fill({
                    color: '#ffd700'
                }),

                stroke: new ol.style.Stroke({
                    color: '#000000',
                    width: 1
                })

            }),

            text: textStyle

        });

    }

    // =================================
    // Порт
    // =================================

    if (type === 'Порт') {

        return new ol.style.Style({

            image: new ol.style.RegularShape({

                points: 3,

                radius: 7,

                rotation: Math.PI / 4,

                fill: new ol.style.Fill({
                    color: '#3c8dff'
                }),

                stroke: new ol.style.Stroke({
                    color: '#000000',
                    width: 1
                })

            })

        });

    }

    // =================================
    // Точка интереса
    // =================================

    if (type === 'Точка интереса') {

        return new ol.style.Style({

            image: new ol.style.RegularShape({

                points: 4,

                radius: 7,

                angle: Math.PI / 4,

                fill: new ol.style.Fill({
                    color: '#ff0000'
                }),

                stroke: new ol.style.Stroke({
                    color: '#000000',
                    width: 1
                })

            }),

            text: textStyle

        });

    }

    // =================================
    // Крепости / Форты
    // =================================

    let fortressLabel = '';
    
    if (type.includes('III')) {
        fortressLabel = 'III';
    }
    
    else if (type.includes('IV')) {
        fortressLabel = 'IV';
    }
    
    else if (type.includes('II')) {
        fortressLabel = 'II';
    }
    
    else if (type.includes('V')) {
        fortressLabel = 'V';
    }
    
    else if (type.includes('I')) {
        fortressLabel = 'I';
    }

    return [

        new ol.style.Style({

            image: new ol.style.RegularShape({

                points: 4,

                radius: 8,

                angle: Math.PI / 4,

                fill: new ol.style.Fill({
                    color:

                    type === 'Форт'
                    
                    ? '#8b5a2b'
                    
                    : '#888888'
                }),

                stroke: new ol.style.Stroke({
                    color: '#000000',
                    width: 1
                })

            })

        }),

        new ol.style.Style({

            text: new ol.style.Text({

                text: fortressLabel,

                font: 'bold 10px Arial',

                fill: new ol.style.Fill({
                    color: '#ffffff'
                }),

                stroke: new ol.style.Stroke({
                    color: '#000000',
                    width: 2
                })

            })

        }),

        ...(textStyle
            ? [new ol.style.Style({
                text: textStyle
            })]
            : [])

    ];

}

// =====================================
// Загрузка маркеров
// =====================================

fetch(markersSheetURL)
.then(r => r.text())
.then(csv => {

    const rows =
    csv.trim().split('\n').slice(1);

    rows.forEach(row => {

        const cols =
        row.split(',');

        const name = cols[8];

        const description =
        cols[9];

        const x =
        parseFloat(cols[10]);

        const y =
        parseFloat(cols[11]);

        const type =
        cols[12];

        if (
            !name ||
            isNaN(x) ||
            isNaN(y)
        ) {
            return;
        }

        const feature =
        new ol.Feature({

            geometry:
            new ol.geom.Point([x, y]),

            markerName: name,

            markerDescription:
            description,

            markerType: type

        });

        markersLayer
        .getSource()
        .addFeature(feature);

        // =====================
        // Группы
        // =====================

        if (type === 'Столица') {

            markerGroups
            .capital.push(feature);

        }

        else if (type === 'Город') {

            markerGroups
            .city.push(feature);

        }

        else if (type === 'Порт') {

            markerGroups
            .port.push(feature);

        }

        else if (
            type === 'Форт' ||
            type.includes('Крепость')
        ) {

            markerGroups
            .fortress.push(feature);

        }

        else if (
            type === 'Точка интереса'
        ) {

            markerGroups
            .poi.push(feature);

        }

    });

    // =================================
    // Принудительное обновление стилей
    // =================================

    setTimeout(() => {

        markersLayer
        .getSource()
        .getFeatures()

        .forEach(feature => {

            feature.setStyle(

                createMarkerStyle(

                    feature.get(
                        'markerType'
                    ),

                    feature.get(
                        'markerName'
                    )

                )

            );

        });

    }, 50);

});

// =====================================
// Popup маркеров
// =====================================

map.on('click', function(event) {

    map.forEachFeatureAtPixel(

        event.pixel,

        function(feature) {

            if (
                !feature.get(
                    'markerName'
                )
            ) {
                return;
            }

            popupElement.innerHTML = `

            <b>
            ${feature.get('markerName')}
            </b>

            <br><br>

            Тип:
            ${feature.get('markerType')}

            <br><br>

            ${feature.get('markerDescription')}

            `;

            popup.setPosition(
                event.coordinate
            );

        }

    );

});

// =====================================
// Контрол маркеров
// =====================================

const markersControl =
document.createElement('div');

markersControl.style.position =
'absolute';

markersControl.style.top =
'90px';

markersControl.style.left =
'10px';

markersControl.style.background =
'white';

markersControl.style.padding =
'10px';

markersControl.style.border =
'1px solid #999';

markersControl.style.borderRadius =
'6px';

markersControl.style.zIndex =
'1000';

document.body.appendChild(
    markersControl
);

// =====================================
// Checkbox helper
// =====================================

function addMarkerToggle(
    title,
    key
) {

    const row =
    document.createElement('div');

    const checkbox =
    document.createElement('input');

    checkbox.type = 'checkbox';
    checkbox.checked = true;

    const label =
    document.createElement('label');

    label.innerHTML =
    ' ' + title;

    row.appendChild(checkbox);
    row.appendChild(label);

    markersControl.appendChild(
        row
    );

    checkbox.addEventListener(
        'change',
        function() {

            markerGroups[key]
            .forEach(feature => {

                feature.set(
                    'hidden',
                    !checkbox.checked
                );
                
                feature.setStyle(
                
                    checkbox.checked
                
                    ? createMarkerStyle(
                        feature.get('markerType'),
                        feature.get('markerName')
                    )
                
                    : []
                
                );

            });

        }
    );

}

// =====================================
// Toggle группы
// =====================================

addMarkerToggle(
    'Столицы',
    'capital'
);

addMarkerToggle(
    'Города',
    'city'
);

addMarkerToggle(
    'Порты',
    'port'
);

addMarkerToggle(
    'Крепости',
    'fortress'
);

addMarkerToggle(
    'Точки интереса',
    'poi'
);

// =====================================
// Toggle координатного маркера
// =====================================

const coordsRow =
document.createElement('div');

const coordsCheckbox =
document.createElement('input');

coordsCheckbox.type =
'checkbox';

const coordsLabel =
document.createElement('label');

coordsLabel.innerHTML =
' Отслеживание координат';

coordsRow.appendChild(
    coordsCheckbox
);

coordsRow.appendChild(
    coordsLabel
);

markersControl.appendChild(
    coordsRow
);

// =====================================
// Включение / выключение
// =====================================

coordsCheckbox.addEventListener(
    'change',
    function() {

        coordinateMarkerEnabled =
            coordsCheckbox.checked;

        // =====================
        // Включение
        // =====================

        if (
            coordinateMarkerEnabled
        ) {

            const center =
                map.getView().getCenter();

            coordinateMarker.setPosition(
                center
            );

            updateMarkerCoordinates(
                center
            );

            markerElement.style.display =
                'block';

        }

        // =====================
        // Выключение
        // =====================

        else {

            markerElement.style.display =
                'none';

        }

    }
);
