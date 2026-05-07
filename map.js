// Размер изображения PNG
const width = 4960;
const height = 7015;

// Параметры из PGW файла
const pixelSizeX = 2.370967741935;
const pixelSizeY = -2.370919458304;

const topLeftX = -760.292207764065;
const topLeftY = 1579.390922422695;

// Вычисляем реальные GIS-границы изображения
const imageExtent = [
    topLeftX,
    topLeftY + height * pixelSizeY,
    topLeftX + width * pixelSizeX,
    topLeftY
];

// Создаем кастомную проекцию
const projection = new ol.proj.Projection({
    code: 'fantasy-map',
    units: 'pixels',
    extent: imageExtent
});

// Слой PNG карты
const imageLayer = new ol.layer.Image({

    source: new ol.source.ImageStatic({

        url: './karta_morprov.png',

        projection: projection,

        imageExtent: imageExtent,

        interpolate: false

    })

});

// Слой провинций
const provincesLayer = new ol.layer.Vector({

    source: new ol.source.Vector({

        url: './provinces.geojson',

        format: new ol.format.GeoJSON()

    }),

    style: new ol.style.Style({

        stroke: new ol.style.Stroke({
            color: 'red',
            width: 1
        }),

        fill: new ol.style.Fill({
            color: 'rgba(255, 0, 0, 0.5)'
        })

    })

});

// Создаем карту
const map = new ol.Map({

    target: 'map',

    layers: [
        imageLayer,
        provincesLayer
    ],

    view: new ol.View({

        projection: projection,

        center: ol.extent.getCenter(imageExtent),

        zoom: 2,

        minZoom: -2,
        maxZoom: 6,

        constrainResolution: true,

        extent: imageExtent

    })

});

// ===============================
// КООРДИНАТЫ КУРСОРА
// ===============================

const coordsDiv = document.getElementById('coords');

map.on('pointermove', function(event) {

    const coords = event.coordinate;

    // GIS координаты
    const x = Math.round(coords[0]);
    const y = Math.round(coords[1]);

    coordsDiv.innerHTML = `X: ${x} | Y: ${y}`;

});

// ===============================
// POPUP ПРОВИНЦИЙ
// ===============================

const popupElement = document.createElement('div');

popupElement.style.position = 'absolute';
popupElement.style.background = 'white';
popupElement.style.padding = '8px';
popupElement.style.border = '1px solid black';
popupElement.style.borderRadius = '6px';
popupElement.style.minWidth = '100px';

const popup = new ol.Overlay({

    element: popupElement,

    positioning: 'bottom-center',

    offset: [0, -10],

    stopEvent: false

});

map.addOverlay(popup);

// Клик по провинции
map.on('click', function(event) {

    const feature = map.forEachFeatureAtPixel(
        event.pixel,
        feature => feature
    );

    if (feature) {

        const provinceId = feature.get('id');

        popupElement.innerHTML =
            `Province ID: ${provinceId}`;

        popup.setPosition(event.coordinate);

    }

    else {

        popup.setPosition(undefined);

    }

});
