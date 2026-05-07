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

// Создаем карту
const map = new ol.Map({
    target: 'map',

    layers: [imageLayer],

    view: new ol.View({
        projection: projection,

        center: ol.extent.getCenter(extent),

        zoom: 2,

        minZoom: -2,
        maxZoom: 6,

        extent: extent
    })
});
