// Размер изображения карты
const width = 4960;
const height = 7015;

// Границы изображения
const extent = [0, 0, width, height];

// Создаем проекцию
const projection = new ol.proj.Projection({
    code: 'fantasy-map',
    units: 'pixels',
    extent: extent
});

// Создаем слой изображения
const imageLayer = new ol.layer.Image({
    source: new ol.source.ImageStatic({
        url: './karta_morprov.png',
        projection: projection,
        imageExtent: extent,

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
    ]

    view: new ol.View({
        projection: projection,

        center: ol.extent.getCenter(extent),

        zoom: 2,

        minZoom: -2,
        maxZoom: 6,

        extent: extent
    })
});

// Блок вывода координат
const coordsDiv = document.getElementById('coords');

// Отслеживаем движение мыши по карте
map.on('pointermove', function(event) {

    // Координаты курсора в системе карты
    const coords = event.coordinate;

    // X координата
    const x = Math.round(coords[0]);

    // Y координата
    const y = Math.round(coords[1]);

    // Обновляем текст
    coordsDiv.innerHTML = `X: ${x} | Y: ${y}`;
});

// Создаем HTML элемент popup
const popupElement = document.createElement('div');

popupElement.style.position = 'absolute';
popupElement.style.background = 'white';
popupElement.style.padding = '6px 10px';
popupElement.style.border = '1px solid black';
popupElement.style.borderRadius = '6px';
popupElement.style.minWidth = '80px';

// Создаем overlay
const popup = new ol.Overlay({
    element: popupElement,
    positioning: 'bottom-center',
    stopEvent: false,
    offset: [0, -10]
});

map.addOverlay(popup);

// Клик по карте
map.on('click', function(event) {

    // Ищем объект под курсором
    const feature = map.forEachFeatureAtPixel(
        event.pixel,
        function(feature) {
            return feature;
        }
    );

    // Если объект найден
    if (feature) {

        // Получаем ID
        const provinceId = feature.get('id');

        // Текст popup
        popupElement.innerHTML = `Province ID: ${provinceId}`;

        // Показываем popup
        popup.setPosition(event.coordinate);
    }

    // Если кликнули мимо
    else {
        popup.setPosition(undefined);
    }

});
