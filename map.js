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

const provincesLayer = new ol.layer.Vector({

    source: new ol.source.Vector({

        url: './provinces.geojson',

        format: new ol.format.GeoJSON({

            dataProjection: 'EPSG:3857',
            featureProjection: 'EPSG:3857'

        })

    }),

    style: new ol.style.Style({

        stroke: new ol.style.Stroke({

            color: 'red',
            width: 1

        }),

        fill: new ol.style.Fill({

            color: 'rgba(255,0,0,0.5)'

        })

    })

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

        zoom: 2,

        minZoom: -2,
        maxZoom: 6,

        constrainResolution: true,

        extent: imageExtent

    })

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
