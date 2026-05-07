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
const provincesSource = new ol.source.Vector();

const provincesLayer = new ol.layer.Vector({

    source: provincesSource,

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

// Загрузка GeoJSON
fetch('./provinces.geojson')

    .then(response => response.json())

    .then(data => {

        // Параметры трансформации
        const offsetX = 1027.5;
        const offsetY = 1027.5;

        const angle = Math.PI / 2;

        // Преобразуем все объекты
        const transformedFeatures = data.features.map(feature => {

            // Клонируем объект
            const newFeature = structuredClone(feature);

            // Обрабатываем координаты
            newFeature.geometry.coordinates =
                newFeature.geometry.coordinates.map(polygon =>

                    polygon.map(ring =>

                        ring.map(point => {

                            const x = point[0];
                            const y = point[1];

                            // Масштабирование + смещение
                            const px = (x - (-760.292207764065)) / 2.370967741935;

                            const py = (y - 1579.390922422695) / (-2.370919458304);

                            // Смещение относительно центра
                            const dx = px - width / 2;
                            const dy = py - height / 2;

                            // Поворот
                            const cos = Math.cos(angle);
                            const sin = Math.sin(angle);

                            const rotatedX =
                                cos * dx - sin * dy + width / 2;

                            const rotatedY =
                                sin * dx + cos * dy + height / 2;

                            // Финальное смещение
                            const finalX = rotatedX + offsetX;
                            const finalY = rotatedY + offsetY;

                            // OpenLayers использует [x, y]
                            return [finalX, finalY];

                        })

                    )

                );

            return newFeature;

        });

        // Создаем GeoJSON объект
        const transformedGeoJSON = {
            type: 'FeatureCollection',
            features: transformedFeatures
        };

        // Читаем features
        const features = new ol.format.GeoJSON().readFeatures(
            transformedGeoJSON,
            {
                featureProjection: projection
            }
        );

        // Добавляем в source
        provincesSource.addFeatures(features);

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

// Popup
const popupElement = document.createElement('div');

popupElement.style.background = 'white';
popupElement.style.padding = '8px';
popupElement.style.border = '1px solid black';
popupElement.style.borderRadius = '6px';

const popup = new ol.Overlay({
    element: popupElement,
    positioning: 'bottom-center',
    offset: [0, -10]
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

    } else {

        popup.setPosition(undefined);

    }

});
