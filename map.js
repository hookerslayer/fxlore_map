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

// ===============================
// Слой провинций
// ===============================

const provincesLayer = new ol.layer.Vector({

    source: provincesSource,

    style: function(feature) {
    
        const featureId = feature.get('id');

        // Выбранная провинция
        if (
            selectedProvinceId !== null &&
            featureId === selectedProvinceId
        ) {
    
            return selectedProvinceStyle;
    
        }
    
        // Наведение мыши
        if (
            hoveredProvinceId !== null &&
            featureId === hoveredProvinceId
        ) {
    
            return hoverProvinceStyle;
    
        }
    
        // Обычный стиль
        return defaultProvinceStyle;
    
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
idButton.style.left = '50px';
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
            `Province ID: ${selectedProvinceId}`;

        popup.setPosition(event.coordinate);

    }

    // Клик по пустоте
    else {

        selectedProvinceId = null;

        popup.setPosition(undefined);

    }

    provincesLayer.changed();

});
