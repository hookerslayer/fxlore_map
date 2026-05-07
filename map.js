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

// Стиль провинций по умолчанию
const defaultProvinceStyle = new ol.style.Style({

    fill: new ol.style.Fill({

        color: 'rgba(0,0,0,0)'

    }),

    stroke: new ol.style.Stroke({

        color: 'rgba(0,0,0,0)',
        width: 0

    })

});

// Подсветка при наведении
const hoverProvinceStyle = new ol.style.Style({

    fill: new ol.style.Fill({

        color: 'rgba(255,255,180,0.25)'

    }),

    stroke: new ol.style.Stroke({

        color: 'rgba(0,0,0,0)',
        width: 0

    })

});

// Подсветка при клике
const selectedProvinceStyle = new ol.style.Style({

    fill: new ol.style.Fill({

        color: 'rgba(255,255,180,0.5)'

    }),

    stroke: new ol.style.Stroke({

        color: '#ffff00',
        width: 2

    })

});

const provincesLayer = new ol.layer.Vector({

    source: provincesSource,

    style: function(feature) {

        // Выбранная провинция
        if (feature === selectedFeature) {
            return selectedProvinceStyle;
        }

        // Наведение мыши
        if (feature === hoveredFeature) {
            return hoverProvinceStyle;
        }

        // Обычный стиль
        return defaultProvinceStyle;

    }

});

// ===============================
// Карта
// ===============================

const map = new ol.Map({

    target: 'map',

    layers: [
        imageLayer,
        provincesLayer
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

    zoom: 4,

    extent: imageExtent

})

});

// Подсветка при наведении мыши
map.on('pointermove', function(event) {

    // Feature под курсором
    const feature = map.forEachFeatureAtPixel(

        event.pixel,

        function(feature) {
            return feature;
        }

    );

    // Если feature изменилась
    if (feature !== hoveredFeature) {

        hoveredFeature = feature;

        // Перерисовываем слой
        provincesLayer.changed();

    }

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

    // Выбрали провинцию
    if (feature) {

        selectedFeature = feature;

        const provinceId = feature.get('id');

        popupElement.innerHTML =
            `Province ID: ${provinceId}`;

        popup.setPosition(event.coordinate);

    }

    // Клик по пустоте
    else {

        selectedFeature = null;

        popup.setPosition(undefined);

    }

    // Обновляем стили
    provincesLayer.changed();

});
