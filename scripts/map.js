var map, layers = [], mapkey;

function initmap(mapdiv, session, latag, lotag, ladms, lodms, src) {
    var inter;

    if (latag && lotag && ladms && lodms) {
        initdrag(latag, lotag, ladms, lodms);
        inter = ol.interaction.defaults().extend([new app.Drag()]);
    }

    if (!src)
        src = 0;

    createmapstyles();
    map = new ol.Map({
        layers: layers,
        interactions: inter,
        target: mapdiv
    });
    selectmaptiles(src);
    map.addControl(new ol.control.ZoomSlider());
}

function createmapstyles() {
    layers[0] = new ol.layer.Tile({
        visible: false,
        source: new ol.source.OSM({
            url: 'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
            maxZoom: 19
        })
    });
    layers[1] = new ol.layer.Tile({
        visible: false,
        source: new ol.source.XYZ({
            tileUrlFunction: function (tileCoord, pixelRatio, projection) {
                var z = tileCoord[0];
                var x = tileCoord[1];
                var y = tileCoord[2];
                return 'https://ecn.t0.tiles.virtualearth.net/tiles/r' + quadkey(x, y, z) + '.png?g=1';
            },
            maxZoom: 19
        })
    });
    layers[2] = new ol.layer.Tile({
        visible: false,
        source: new ol.source.XYZ({
            tileUrlFunction: function (tileCoord, pixelRatio, projection) {
                var z = tileCoord[0];
                var x = tileCoord[1];
                var y = tileCoord[2];
                return 'https://ecn.t0.tiles.virtualearth.net/tiles/a' + quadkey(x, y, z) + '.jpeg?g=1';
            },
            maxZoom: 19
        })
    });
    layers[3] = new ol.layer.Tile({
        visible: false,
        source: new ol.source.XYZ({
            url: 'https://basemap.nationalmap.gov/arcgis/rest/services/USGSTopo/MapServer/tile/{z}/{y}/{x}',
            maxZoom: 16
        })
    });
    layers[4] = new ol.layer.Tile({
        visible: false,
        source: new ol.source.XYZ({
            url: 'https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryOnly/MapServer/tile/{z}/{y}/{x}',
            maxZoom: 16
        })
    });
    layers[5] = new ol.layer.Tile({
        visible: false,
        source: new ol.source.XYZ({
            url: ' https://tile.opentopomap.org/{z}/{x}/{y}.png',
            maxZoom: 15
        })
    });
    layers[6] = new ol.layer.Tile({
        visible: false,
        source: new ol.source.XYZ({
            url: 'http://tile.stamen.com/toner/{z}/{x}/{y}.png',
            maxZoom: 17
        })//source: new ol.source.XYZ({ url: 'https://tiles.wmflabs.org/bw-mapnik/{z}/{x}/{y}.png', maxZoom: 17 })
        //source: new ol.source.XYZ({ url: 'OSMgray.aspx?z={z}&x={x}&y={y}', maxZoom: 15 })
    });

}

var quadkey = function (x, y, z) {
    var quadKey = [];
    for (var i = z; i > 0; i--) {
        var digit = '0';
        var mask = 1 << (i - 1);
        if ((x & mask) != 0) {
            digit++;
        }
        if ((y & mask) != 0) {
            digit++;
            digit++;
        }
        quadKey.push(digit);
    }
    return quadKey.join('');
};

function selectmaptiles(src) {
    for (var i = 0, ii = layers.length; i < ii; ++i)
        layers[i].setVisible(i == src);
}

function fitwindow(mapdiv, hp) {
    var h = Math.max(window.innerHeight, 400);
    document.getElementById(mapdiv).style.height = String(h - hp) + 'px';
}

function getmaplat() {
    var c = ol.proj.transform(map.getView().getCenter(), 'EPSG:3857', 'EPSG:4326');
    return c[1];
}

function getmaplon() {
    var c = ol.proj.transform(map.getView().getCenter(), 'EPSG:3857', 'EPSG:4326');
    return c[0];
}

function getmapzoom() {
    return map.getView().getZoom();
}

function setmap(lat, lon, z) {
    map.setView(new ol.View({
        center: ol.proj.transform([lon, lat], 'EPSG:4326', 'EPSG:3857'),
        zoom: z,
        minZoom: 2,
        maxZoom: 19
    }));
}

function showmouse(MouseTag) {
    var mousePositionControl = new ol.control.MousePosition({
        coordinateFormat: ol.coordinate.createStringXY(8),
        projection: 'EPSG:4326',
        // comment the following two lines to have the mouse position
        // be placed within the map.
        className: 'custom-mouse-position',
        target: document.getElementById(MouseTag),
        undefinedHTML: '&nbsp;'
    });
    map.addControl(mousePositionControl);
}

function addimage(src, lamin, lomin, lamax, lomax) {
    var c1 = new ol.proj.transform([lomin, lamin], 'EPSG:4326', 'EPSG:3857');
    var c2 = new ol.proj.transform([lomax, lamax], 'EPSG:4326', 'EPSG:3857');
    var cx = new ol.proj.transform([(lomin + lomax) / 2, (lamin + lamax) / 2], 'EPSG:4326', 'EPSG:3857');
    var dx = (c2[0] - c1[0]) / 2;
    var dy = (c2[1] - c1[1]) / 2;

    c1[0] = cx[0] - dx;
    c2[0] = cx[0] + dx;
    c1[1] = cx[1] - dy;
    c2[1] = cx[1] + dy;

    ov = new ol.layer.Image({
        source: new ol.source.ImageStatic({
            url: src,
            imageExtent: [c1[0], c1[1], c2[0], c2[1]]
        })
    });
    map.addLayer(ov);
    return ov;
}

function addmarker(iconindex, lat, lon, label, html) {
    iconFeature = new ol.Feature({
        geometry: new ol.geom.Point(new ol.proj.transform([lon, lat], 'EPSG:4326', 'EPSG:3857')),
    });

    var iconStyle = new ol.style.Style({
        image: new ol.style.Icon(({
            anchor: [0.5, 1.0],
            anchorXUnits: 'fraction',
            anchorYUnits: 'fraction',
            opacity: 0.9,
            src: ico[iconindex]
        })),
        text: new ol.style.Text({
            font: '12px helvetica,sans-serif',
            text: label,
            fontSize: 12,
            fill: new ol.style.Fill({
                color: '#000'
            }),
            stroke: new ol.style.Stroke({
                color: '#fff',
                width: 2
            })
        })
    });

    iconFeature.setStyle(iconStyle);
    iconFeature.setId(html);
    var vectorSource = new ol.source.Vector({
        features: [iconFeature]
    });
    var vectorLayer = new ol.layer.Vector({
        source: vectorSource
    });
    map.addLayer(vectorLayer);
    return vectorLayer;
}

function addline(lat1, lon1, lat2, lon2, html) {
    var lineFeature = new ol.Feature({
        geometry: new ol.geom.LineString([new ol.proj.transform([lon1, lat1], 'EPSG:4326', 'EPSG:3857'), new ol.proj.transform([lon2, lat2], 'EPSG:4326', 'EPSG:3857')], 'XY'),
    });
    lineFeature.setId(html);

    var layerLines = new ol.layer.Vector({
        source: new ol.source.Vector({
            features: [lineFeature]
        }),
        style: new ol.style.Style({
            stroke: new ol.style.Stroke({
                color: '#6060FF',
                width: 5
            })
        })
    });
    map.addLayer(layerLines);
    return layerLines;
}

function addpopup() {
    var popup = new ol.Overlay.Popup();
    map.addOverlay(popup);

    map.on('click', function (evt) {

        var feature = map.forEachFeatureAtPixel(evt.pixel, function (feature, layer) {
            return feature;
        });
        if (feature) {
            popup.show(evt.coordinate, feature.getId());
        } else
            popup.hide();

    });
    return popup;
}

function setmarker(mk, lat, lon) {

    var feature = mk.getSource().forEachFeature(function (feature, layer) {
        return feature;
    });

    if (feature) {
        feature.setGeometry(new ol.geom.Point(new ol.proj.transform([lon, lat], 'EPSG:4326', 'EPSG:3857')));
    }

}

function getmarkerlat(mk) {

    var feature = mk.getSource().forEachFeature(function (feature, layer) {
        return feature;
    });
    if (feature) {
        var c = ol.proj.transform(feature.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326');
        return c[1];

    }

}

function getmarkerlon(mk) {

    var feature = mk.getSource().forEachFeature(function (feature, layer) {
        return feature;
    });
    if (feature) {
        var c = ol.proj.transform(feature.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326');
        return c[0];

    }

}

function setlltags(lat, lon, latag, lotag, ladms, lodms) {
    var t = ol.coordinate.toStringHDMS([lon, lat]).split(" ");
    if (latag)
        document.getElementById(latag).innerHTML = lat.toFixed(8);
    while (lon < -180)
        lon += 360;
    while (lon > 180)
        lon -= 360;
    if (lotag)
        document.getElementById(lotag).innerHTML = lon.toFixed(8);
    if (ladms)
        document.getElementById(ladms).innerHTML = t[0] + " " + t[1] + " " + t[2] + " " + t[3];
    if (lodms)
        document.getElementById(lodms).innerHTML = t[4] + " " + t[5] + " " + t[6] + " " + t[7];
}

function initdrag(latag, lotag, ladms, lodms) {
    /**
* Define a namespace for the application.
*/
    window.app = {};
    var app = window.app;

    /**
* @constructor
* @extends {ol.interaction.Pointer}
*/
    app.Drag = function () {

        ol.interaction.Pointer.call(this, {
            handleDownEvent: app.Drag.prototype.handleDownEvent,
            handleDragEvent: app.Drag.prototype.handleDragEvent,
            handleMoveEvent: app.Drag.prototype.handleMoveEvent,
            handleUpEvent: app.Drag.prototype.handleUpEvent
        });

        /**
* @type {ol.Pixel}
* @private
*/
        this.coordinate_ = null;

        /**
* @type {string|undefined}
* @private
*/
        this.cursor_ = 'pointer';

        /**
* @type {ol.Feature}
* @private
*/
        this.feature_ = null;

        /**
* @type {string|undefined}
* @private
*/
        this.previousCursor_ = undefined;

    }
        ;
    ol.inherits(app.Drag, ol.interaction.Pointer);

    /**
* @param {ol.MapBrowserEvent} evt Map browser event.
* @return {boolean} `true` to start the drag sequence.
*/
    app.Drag.prototype.handleDownEvent = function (evt) {
        var map = evt.map;

        var feature = map.forEachFeatureAtPixel(evt.pixel, function (feature, layer) {
            return feature;
        });

        if (feature) {
            this.coordinate_ = evt.coordinate;
            this.feature_ = feature;
        }

        return !!feature;
    }
        ;

    /**
* @param {ol.MapBrowserEvent} evt Map browser event.
*/
    app.Drag.prototype.handleDragEvent = function (evt) {
        var map = evt.map;

        var feature = map.forEachFeatureAtPixel(evt.pixel, function (feature, layer) {
            return feature;
        });

        var deltaX = evt.coordinate[0] - this.coordinate_[0];
        var deltaY = evt.coordinate[1] - this.coordinate_[1];

        var geometry = /** @type {ol.geom.SimpleGeometry} */
            (this.feature_.getGeometry());
        geometry.translate(deltaX, deltaY);

        this.coordinate_[0] = evt.coordinate[0];
        this.coordinate_[1] = evt.coordinate[1];
        coor = new ol.proj.transform(evt.coordinate, 'EPSG:3857', 'EPSG:4326');
        setlltags(coor[1], coor[0], latag, lotag, ladms, lodms);
    }
        ;

    /**
* @param {ol.MapBrowserEvent} evt Event.
*/
    app.Drag.prototype.handleMoveEvent = function (evt) {
        if (this.cursor_) {
            var map = evt.map;
            var feature = map.forEachFeatureAtPixel(evt.pixel, function (feature, layer) {
                return feature;
            });
            var element = evt.map.getTargetElement();
            if (feature) {
                if (element.style.cursor != this.cursor_) {
                    this.previousCursor_ = element.style.cursor;
                    element.style.cursor = this.cursor_;
                }
            } else if (this.previousCursor_ !== undefined) {
                element.style.cursor = this.previousCursor_;
                this.previousCursor_ = undefined;
            }
        }
    }
        ;

    /**
* @param {ol.MapBrowserEvent} evt Map browser event.
* @return {boolean} `false` to stop the drag sequence.
*/
    app.Drag.prototype.handleUpEvent = function (evt) {
        this.coordinate_ = null;
        this.feature_ = null;
        return false;
    }
        ;
}

var ico = ["data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAStSURBVGhD7VlNbBNHFA4HekQgtUdAgmRtovCjBFBROVS9tBVCIBUubREguKJeuPHXqpU4VG1pK7U4a8chRUBD2Fk7zo8gFIQh4k8KhNImggYS56cJaiAJFGhph/c2b1cz6yGyya5tJH/SJ9l+7833zfrtzHhdUkQRReQWPyxOzNE14+Owxr7XAybTNbPdIrzGz8IB8yPMofTCg67F3gprZiuY/RfM8impmf9gbnUw9iaV5x/hRQ3z9QAzlIYzINbWLGRzabj8IKIZq6FlRlQGs+QwfqM0bG4RDsQ2Qu8/VZh6SbIn1QFzAw2fG+hlxkq4Fx6pDU2Dk2MuJxl/ESn9+Q0QS0kGgHUrmqT3mfAFNamQFn+d5PwDtNN3bvGW7e18tHuMG+vPSJ9PRczFmpZt7WkxXWMHSM4fHCw1FlpLpyB6Ys1pfr9nnE8MPOIj10f5kdWtkikVMQdzsQZrG95vk+J476EWyXoPvFKiYKQ8xgcujFiGrIl0jvLj78mmVDz2zkl+79f7Tl3/+WEeWRSTcmA1/IZkvQdcqTuiWNuOS44ZvLKZTMKm+cFZPtb30KnHseQc1kOy3qK6jC2ThUx+p7XfMXJx/w0phqytbORNm5IW8bU7fi3U7dT/0dSfFoe9ZQnJewfr/CSI1C1v4uN0RcdTD/nhVc2SCWPtL1ar2UbxnsDPxBy8N+z4WN8EP1SZkOIRjW0jee8AX/VOUcRYd8Yx0Q/3iRhDYt/bcZup5LCcFzT5X10PnDhbJ08U9pUvSN47wES+FkVwybUN3I6nJAN1VQkn5ibGxFxxws1bL0gxmMi3JO8dYCKfiSKJD885Bu62DUoGamA1e0BLskj8DGNi7tDle068EcYUY3Cg/JTkvQMsh1tFEVyhbAPYHrgUi/ErB35z4javfHVTyokubeRjvRNOvP7dU1JcD8Y2k7x3sDZDQQSNi/3tvpoYT+7u4HdPDVhM7upIm6zYnrivuPeSSFnDApL3FtCzt0ShG9HbjpFeaC+30amIuX1n/3TqOyO3pDhsvl0k6z3geLJPFMP2wqXXNtPxY5dkZipe/vKmU4fLeFpbaWwPyXoP/KpB5D9RUNzUkM1bXCuPgrhBijXXDnbLOfBzOVQen0ey/gBWL1MUjS5p5L2nBy1Dvx/tsfYGMa4k5GAu1mBLRivirhxWT3L+wXrIIIma1q6OPV4Lk3LHXkTMxRr3icBi0FhFcv4CrlhLmrhHhL0jQTL+oyYYrwTB/1VGpkMcEw+nJJMbwA15XGVmmjxGw+cOkVKzHHb7ZwozL8fJB3sBGj63AHF8BKo2li39OCBmiuh8NhtMDKeZypKw+Q39VNo8i4bND/BgpzKXFTW2iYbLH3gJnwH3SlJpMDOewzFouPyiJsAWux8TZUJ87IO1NExhwP3DKxPCRPZSeeGgvrz+NTDWqTKsIuaGqkIzqbywgA+3M9pbYM/Qg6yKygoT0GL7leYFwnL7OaUXLrDFwGyH27xDzbyKOZRe2AgHT1TAAfCxexLQdn/j0YbSXg2A8U/cE4G220HhVweTGyVL2JPA1wWz8WUL/OcJbuwBZE7+hfIT8E28jaS3RRRRRF5QUvIc6Euk3wKNfCMAAAAASUVORK5CYII=", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACIAAAAuCAMAAAB6WzuLAAADAFBMVEUReP4ReP4ReP4QeP4Pd/4Ndv4LdP4Jc/4Gcf4DcP4CcP4Bb/4Ab/4Ab/4Ab/4Abv4Abv4Abv4Abv4Abv0Abv0Abv0Abv0Abv0Abv0Abv0Abv0Abv0Abv0Abv0Abv0Abv0Abv0Abv0Abv0Abv0Abv0Abv0Abv0Abv0Abv0Abv0Abv0Abv0Abv0Abv0Abv0Abv0Abv0Abv0Abv0Abv0Abv0Abv0Abv0Abv0Abv0Abv0Abv0Abv0Abv0Abv0Abv0Abv0Abv0Abv0Abv0Abv0Abv0Abv0Abv0Abv0Abv0Abv0Abv0Abv0Abv0Abv0AavYAY+sAXOAAWNgAVNEAUcwAT8kATscATcUATMQATMQAS8MAS8MAS8MAS8MAS8MAS8MAS8MAS8MAS8MATMMATMMATMIATcIAUMABVb4BWLwBW7oBXrcCXrICWqsBU6ABSpQBQ4sBQokBQYgCQIcCP4UEPIIFOH0JMnMLLW0NL28PMnIUNnUZOnghQHwnRYAqSIIuS4QyToc2U4o+W5BEYpZKaZpPbp5WdKJceqZng6xvi7BwjbByjrB3kbGBl7KGmbKKmrOMm7ONm7OOm7SPnLWQnbWRnraVormZp7ydrL+hssOnuciqvcuwwc+3x9S/zdrF09/J1uLL1+PN2eTR2+bV3ejZ3+nd4evg4+vj5Ozl5u3l5+3m6e/k6/Dh7vLZ8PTP9Pe7+fu2+vy1+/21+/21+/21+/21+/21+/21+/23+/26+/2//P3H/P3b/f32/v3+//3///z///z///z///v///z///3///7///7////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////1DM8mAAABAHRSTlP/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////AAAAAAAAAAAAAAAA//////////////////8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAApx8BhgAAAAlwSFlzAAAOwwAADsMBx2+oZAAAAVxJREFUOI2F1L2KwzAMAGA/wC2d825+gI5atIUrNORM4Qqe0rvFlGRyZo/lIA/iV7n8R5adVFvgQ7YsKcK/DUE/7EN/qVJV9Q5pqwuCHAIgV3WCaJQyW0OiahgxBWRhSNQBqVBmUYAi5IEx2MxAajwnSQZ6ISpxyhRoJ/LLb0rurCZypUmEc46lEb6mST5cSIY0oqM3OTlGsnzIctnKGXOEBBsvXtubOBcTeHhhgYuASO2FeUMUI+IUkZsXDSFzSTxLG7QwIvDTF50fE9uToIkR+RyeroEDAvexjfkRaUdSwS6R5TQMtCZG4DlP3bfcIWOSkZBOhgTMugEa0kSRPbomCdZ01VITLumqpfcEW0o6G+9jP2/hn+EerX3RMfLHj0IT/V/YYg/944RVVfgE8YoYfCYJqRy0TxOzVL48WkzWyrdqIjL3E/Rrn/ib5MdExJfyXNpjYnVh/DFJxD+xZNmYMqLlMgAAAABJRU5ErkJggg==", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACIAAAAuCAMAAAB6WzuLAAADAFBMVEUSMm4SMW0SMGwQNHMOO30LPoIIP4UGQIYHQIcGQosGRpYFSqEET68EULcEUboDULwCT74BTcEATMIAS8MAS8MAS8MATMQATMQATsYAUMgAU8wAWNIAYt0AbeoAc/IAefgAff4Afv4Afv4Bf/4Aff4Ae/4Aef4Ad/4Adf4Ac/4Acf4Ab/4Abv4Abv4Abv4Abv4Abv4Abv4Abv4Abv0Abv0Abv0Abv0Abv0Abv0Abv0Abv0Abv0Abv0Abv0Abv0Abv0Abv0Abv0Abv0Abv0Abv0Abv0Abv0Abv0Abv0Abv0Abv0Abv0Abv0Abv0Abv0Abv0Abv0Abv0Abv0Abv0Abv0Abv0Abv0Abv0Abv0Abv0Abv0Abv0Abv0Abv0Abv0Abv0DbvwGbvsIbvkLbvgNb/cQb/YUb/UXb/Mab/Idb/Efb/Aib+8kb+4mcO0ocOwpcewqcesrcesrcessceotceoucekucekvcekvcegwcegxceYzcuQ1cuE3c985c91EdtJKeMxOechResVXfMFcfr1hgbpohLdrhbRshrRuh7NviLRwiLNwiLNxibN1i7R8jraDkbeHk7iKlbmLlbmNl7qOmLqPmbqRnLuTn7uVo7yYqLyaqr2crL6fr7+issCltcKnt8Osu8ewvsm2w868x9LBzNfFz9rI0dzK09/M1eHO2OTP2+fQ3OnQ3enP3urN4OzK4u/F5/O+7fm58f238/+38/+38/+38/+38/+38/+38/+38/+48//C8fzM8PnY7/bj7vPp7fLu7fDx7fDy7vH08PL28/X39fb6+Pj6+fn7+vr9/Pv+/vz///z///z///z///v///z9//38//78//7+//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////9YAKYnAAABAHRSTlP/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////AAD//////////////////////wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAxqLkTAAAAAlwSFlzAAAOwwAADsMBx2+oZAAAAXdJREFUOI2F1D1uwyAUAGCEZOkNzcYNcgOfghtlZ/HAirI4VVRVlRgsTz5B2DpZ8h04RwGHf+y+Lcqn9wM8I/1voPSHeoqBD3ycDogaPzAQGwAdnxpEYEJoCIL5XBDJgOZBsMjIiAmtAnhCnrgG0Vgy4UuTUBCe8EaVPbDayXfs9Lq4iD3znTCSAxO3NA3Sk0/SL0tlbBq08izJ7S19ms5m6fw4/q9rSvCs0ebPpPcF+pTAp0avOE9qw0xCI1mRrJDptyZ5u2TQaC5JdXhI4YYIR0fhyw59JigoQ7JLLAVF9ujSZrJhXJKHu8buWFDYHBnhUJiRHfEz9WUfJol8v7o7ia36iEkc2W+yrwn8hA0QQNM3FwhP9ojRVuApXTVoCJKuWntP3IYEsr7qfTTvLf8yPMpShK0F+S1LYVl9X4rFtvdXkmIqphtEc2iVyT+HsR0Quk2kn9wfWk3C5GmZguz3acpsx0QPpCxTEWMugzonSjCpz0kj/gCNqVLifMYqzwAAAABJRU5ErkJggg==", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACIAAAAuCAMAAAB6WzuLAAADAFBMVEUTMWsRLGoONHANPn8GQIUKQIcMQ4oNSZMLT54KVaoIWbgGWLsDU74CTsEBTMMATMQATsgAUs4AVtUAYukAbPoAbv0Abv0Abv0Abv0Abv0Abv0Abv0Abv0Abv0Abv0Abv0Abv0Abv0Abv0Abv0Abv0Abv0Abv0Abv0Abv0Abv0Abv0Abv0Abv0Abv0Abv0Abv0Abv0Abv0Abv0Abv0Abv0Abv0Abv0Abv0Abv0Abv0Abv0Abv0Abv0Abv0Abv0Abv0Abv0Abv0Abv0Abv0Abv0Abv0Abv0Abv0Abv0Abv0Abv0Abv0Abv0Abv0EbvYIbfAMbesPbOcXbuAncNE4dMJCdrlLeLNReq9WfK5cf61jg65phatthqluh6xvi7JwjLJxjbJ2kLJ6lLKAl7KGmrKKnLKMnLOOm7OPm7OPm7SQm7WUnreXormaprudrb+fuMmgxdOfyNmezd+c0+Sa2OmZ2eqZ2eqZ2eqZ2eqZ2eqZ2eqZ2eqZ2eqZ2eqZ2eqa2ema2Oie1+Si1uKq1N6w092z0ty40du90dvB0tzF093J097L1eDO1uHR1+TU2ubX3enY3urZ3+rf4evj5O3m5u3p5+7s6u7v7PDx7fDy7vDz8PD18/P49vb7+vj8+/n9/fn9/fn+/vn+/vn///n///j///j///f///j///v///z///7////////////////9///8///+//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////92dZ6MAAABAHRSTlP///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAdNaAAAAAlwSFlzAAAOwwAADsMBx2+oZAAAAVxJREFUOI2F1L1uhDAMAOBYWFXFkLfhVTJRZekNWWDjCbocC+pwYmBn6cKr+I0KgYDzx2U6dJ8cO44j6O0S/GNszZeudTNkyNR8AsptIRZ6SBADUlbnknChg/QKK39JMB5pwEXous4h1Iy0UF0iMhsZoEySCo0j+srTJxWMO/lBXzAj9U6UzBIbRtDAyo3IFkbMYSa+KbYoH2UkmIFfEgvEgCFsSbww8f+lpCHRY7CFb9Z8QxJ+yJrE8D7KBLe5bOlSkSzIlYTjSq6jS52LCBoQC3zYNhY3PULbRmpuLkO9X4YJsgSfx637zt06G8SSBTIE+3MCDKaJZnOkeJjzNwx81MJZtJnwUfPm5Fxi4mR+iUisDfRfhkc09moOyF+4FfTR+8IG227ziJ+goCpFCUKaGXgmCascDaVJ73rlDi0mZ+VXNRE5+olmyROqZbhNRFZT1uM9GY3q6Z4k1j81qd3gAk1yDQAAAABJRU5ErkJggg==", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAA7EAAAOxAGVKw4bAAAKT2lDQ1BQaG90b3Nob3AgSUNDIHByb2ZpbGUAAHjanVNnVFPpFj333vRCS4iAlEtvUhUIIFJCi4AUkSYqIQkQSoghodkVUcERRUUEG8igiAOOjoCMFVEsDIoK2AfkIaKOg6OIisr74Xuja9a89+bN/rXXPues852zzwfACAyWSDNRNYAMqUIeEeCDx8TG4eQuQIEKJHAAEAizZCFz/SMBAPh+PDwrIsAHvgABeNMLCADATZvAMByH/w/qQplcAYCEAcB0kThLCIAUAEB6jkKmAEBGAYCdmCZTAKAEAGDLY2LjAFAtAGAnf+bTAICd+Jl7AQBblCEVAaCRACATZYhEAGg7AKzPVopFAFgwABRmS8Q5ANgtADBJV2ZIALC3AMDOEAuyAAgMADBRiIUpAAR7AGDIIyN4AISZABRG8lc88SuuEOcqAAB4mbI8uSQ5RYFbCC1xB1dXLh4ozkkXKxQ2YQJhmkAuwnmZGTKBNA/g88wAAKCRFRHgg/P9eM4Ors7ONo62Dl8t6r8G/yJiYuP+5c+rcEAAAOF0ftH+LC+zGoA7BoBt/qIl7gRoXgugdfeLZrIPQLUAoOnaV/Nw+H48PEWhkLnZ2eXk5NhKxEJbYcpXff5nwl/AV/1s+X48/Pf14L7iJIEyXYFHBPjgwsz0TKUcz5IJhGLc5o9H/LcL//wd0yLESWK5WCoU41EScY5EmozzMqUiiUKSKcUl0v9k4t8s+wM+3zUAsGo+AXuRLahdYwP2SycQWHTA4vcAAPK7b8HUKAgDgGiD4c93/+8//UegJQCAZkmScQAAXkQkLlTKsz/HCAAARKCBKrBBG/TBGCzABhzBBdzBC/xgNoRCJMTCQhBCCmSAHHJgKayCQiiGzbAdKmAv1EAdNMBRaIaTcA4uwlW4Dj1wD/phCJ7BKLyBCQRByAgTYSHaiAFiilgjjggXmYX4IcFIBBKLJCDJiBRRIkuRNUgxUopUIFVIHfI9cgI5h1xGupE7yAAygvyGvEcxlIGyUT3UDLVDuag3GoRGogvQZHQxmo8WoJvQcrQaPYw2oefQq2gP2o8+Q8cwwOgYBzPEbDAuxsNCsTgsCZNjy7EirAyrxhqwVqwDu4n1Y8+xdwQSgUXACTYEd0IgYR5BSFhMWE7YSKggHCQ0EdoJNwkDhFHCJyKTqEu0JroR+cQYYjIxh1hILCPWEo8TLxB7iEPENyQSiUMyJ7mQAkmxpFTSEtJG0m5SI+ksqZs0SBojk8naZGuyBzmULCAryIXkneTD5DPkG+Qh8lsKnWJAcaT4U+IoUspqShnlEOU05QZlmDJBVaOaUt2ooVQRNY9aQq2htlKvUYeoEzR1mjnNgxZJS6WtopXTGmgXaPdpr+h0uhHdlR5Ol9BX0svpR+iX6AP0dwwNhhWDx4hnKBmbGAcYZxl3GK+YTKYZ04sZx1QwNzHrmOeZD5lvVVgqtip8FZHKCpVKlSaVGyovVKmqpqreqgtV81XLVI+pXlN9rkZVM1PjqQnUlqtVqp1Q61MbU2epO6iHqmeob1Q/pH5Z/YkGWcNMw09DpFGgsV/jvMYgC2MZs3gsIWsNq4Z1gTXEJrHN2Xx2KruY/R27iz2qqaE5QzNKM1ezUvOUZj8H45hx+Jx0TgnnKKeX836K3hTvKeIpG6Y0TLkxZVxrqpaXllirSKtRq0frvTau7aedpr1Fu1n7gQ5Bx0onXCdHZ4/OBZ3nU9lT3acKpxZNPTr1ri6qa6UbobtEd79up+6Ynr5egJ5Mb6feeb3n+hx9L/1U/W36p/VHDFgGswwkBtsMzhg8xTVxbzwdL8fb8VFDXcNAQ6VhlWGX4YSRudE8o9VGjUYPjGnGXOMk423GbcajJgYmISZLTepN7ppSTbmmKaY7TDtMx83MzaLN1pk1mz0x1zLnm+eb15vft2BaeFostqi2uGVJsuRaplnutrxuhVo5WaVYVVpds0atna0l1rutu6cRp7lOk06rntZnw7Dxtsm2qbcZsOXYBtuutm22fWFnYhdnt8Wuw+6TvZN9un2N/T0HDYfZDqsdWh1+c7RyFDpWOt6azpzuP33F9JbpL2dYzxDP2DPjthPLKcRpnVOb00dnF2e5c4PziIuJS4LLLpc+Lpsbxt3IveRKdPVxXeF60vWdm7Obwu2o26/uNu5p7ofcn8w0nymeWTNz0MPIQ+BR5dE/C5+VMGvfrH5PQ0+BZ7XnIy9jL5FXrdewt6V3qvdh7xc+9j5yn+M+4zw33jLeWV/MN8C3yLfLT8Nvnl+F30N/I/9k/3r/0QCngCUBZwOJgUGBWwL7+Hp8Ib+OPzrbZfay2e1BjKC5QRVBj4KtguXBrSFoyOyQrSH355jOkc5pDoVQfujW0Adh5mGLw34MJ4WHhVeGP45wiFga0TGXNXfR3ENz30T6RJZE3ptnMU85ry1KNSo+qi5qPNo3ujS6P8YuZlnM1VidWElsSxw5LiquNm5svt/87fOH4p3iC+N7F5gvyF1weaHOwvSFpxapLhIsOpZATIhOOJTwQRAqqBaMJfITdyWOCnnCHcJnIi/RNtGI2ENcKh5O8kgqTXqS7JG8NXkkxTOlLOW5hCepkLxMDUzdmzqeFpp2IG0yPTq9MYOSkZBxQqohTZO2Z+pn5mZ2y6xlhbL+xW6Lty8elQfJa7OQrAVZLQq2QqboVFoo1yoHsmdlV2a/zYnKOZarnivN7cyzytuQN5zvn//tEsIS4ZK2pYZLVy0dWOa9rGo5sjxxedsK4xUFK4ZWBqw8uIq2Km3VT6vtV5eufr0mek1rgV7ByoLBtQFr6wtVCuWFfevc1+1dT1gvWd+1YfqGnRs+FYmKrhTbF5cVf9go3HjlG4dvyr+Z3JS0qavEuWTPZtJm6ebeLZ5bDpaql+aXDm4N2dq0Dd9WtO319kXbL5fNKNu7g7ZDuaO/PLi8ZafJzs07P1SkVPRU+lQ27tLdtWHX+G7R7ht7vPY07NXbW7z3/T7JvttVAVVN1WbVZftJ+7P3P66Jqun4lvttXa1ObXHtxwPSA/0HIw6217nU1R3SPVRSj9Yr60cOxx++/p3vdy0NNg1VjZzG4iNwRHnk6fcJ3/ceDTradox7rOEH0x92HWcdL2pCmvKaRptTmvtbYlu6T8w+0dbq3nr8R9sfD5w0PFl5SvNUyWna6YLTk2fyz4ydlZ19fi753GDborZ752PO32oPb++6EHTh0kX/i+c7vDvOXPK4dPKy2+UTV7hXmq86X23qdOo8/pPTT8e7nLuarrlca7nuer21e2b36RueN87d9L158Rb/1tWeOT3dvfN6b/fF9/XfFt1+cif9zsu72Xcn7q28T7xf9EDtQdlD3YfVP1v+3Njv3H9qwHeg89HcR/cGhYPP/pH1jw9DBY+Zj8uGDYbrnjg+OTniP3L96fynQ89kzyaeF/6i/suuFxYvfvjV69fO0ZjRoZfyl5O/bXyl/erA6xmv28bCxh6+yXgzMV70VvvtwXfcdx3vo98PT+R8IH8o/2j5sfVT0Kf7kxmTk/8EA5jz/GMzLdsAADwCaVRYdFhNTDpjb20uYWRvYmUueG1wAAAAAAA8P3hwYWNrZXQgYmVnaW49Iu+7vyIgaWQ9Ilc1TTBNcENlaGlIenJlU3pOVGN6a2M5ZCI/Pgo8eDp4bXBtZXRhIHhtbG5zOng9ImFkb2JlOm5zOm1ldGEvIiB4OnhtcHRrPSJBZG9iZSBYTVAgQ29yZSA1LjYtYzA2NyA3OS4xNTc3NDcsIDIwMTUvMDMvMzAtMjM6NDA6NDIgICAgICAgICI+CiAgIDxyZGY6UkRGIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyI+CiAgICAgIDxyZGY6RGVzY3JpcHRpb24gcmRmOmFib3V0PSIiCiAgICAgICAgICAgIHhtbG5zOnhtcD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLyIKICAgICAgICAgICAgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iCiAgICAgICAgICAgIHhtbG5zOnN0RXZ0PSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VFdmVudCMiCiAgICAgICAgICAgIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIKICAgICAgICAgICAgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIgogICAgICAgICAgICB4bWxuczp0aWZmPSJodHRwOi8vbnMuYWRvYmUuY29tL3RpZmYvMS4wLyIKICAgICAgICAgICAgeG1sbnM6ZXhpZj0iaHR0cDovL25zLmFkb2JlLmNvbS9leGlmLzEuMC8iPgogICAgICAgICA8eG1wOkNyZWF0b3JUb29sPkFkb2JlIFBob3Rvc2hvcCBFbGVtZW50cyAxNC4wIChXaW5kb3dzKTwveG1wOkNyZWF0b3JUb29sPgogICAgICAgICA8eG1wOkNyZWF0ZURhdGU+MjAxOS0wMS0yNlQxMzozMToxMi0wNTowMDwveG1wOkNyZWF0ZURhdGU+CiAgICAgICAgIDx4bXA6TWV0YWRhdGFEYXRlPjIwMTktMDEtMjZUMTQ6MDI6NDEtMDU6MDA8L3htcDpNZXRhZGF0YURhdGU+CiAgICAgICAgIDx4bXA6TW9kaWZ5RGF0ZT4yMDE5LTAxLTI2VDE0OjAyOjQxLTA1OjAwPC94bXA6TW9kaWZ5RGF0ZT4KICAgICAgICAgPHhtcE1NOkluc3RhbmNlSUQ+eG1wLmlpZDo0ZjI2MzYxNy0wNDViLTEzNGMtOWJhMy0zZmM5NDlhNGE3NTA8L3htcE1NOkluc3RhbmNlSUQ+CiAgICAgICAgIDx4bXBNTTpEb2N1bWVudElEPmFkb2JlOmRvY2lkOnBob3Rvc2hvcDphNWRjOWQ4OS0yMTljLTExZTktYmVhOC1lNTA2MDlhNzA0NTg8L3htcE1NOkRvY3VtZW50SUQ+CiAgICAgICAgIDx4bXBNTTpPcmlnaW5hbERvY3VtZW50SUQ+eG1wLmRpZDphMzlhYjZkNC1mYzFlLTlhNDMtODU5Zi1hZDg3ZmU0ZDM1ZWQ8L3htcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD4KICAgICAgICAgPHhtcE1NOkhpc3Rvcnk+CiAgICAgICAgICAgIDxyZGY6U2VxPgogICAgICAgICAgICAgICA8cmRmOmxpIHJkZjpwYXJzZVR5cGU9IlJlc291cmNlIj4KICAgICAgICAgICAgICAgICAgPHN0RXZ0OmFjdGlvbj5jcmVhdGVkPC9zdEV2dDphY3Rpb24+CiAgICAgICAgICAgICAgICAgIDxzdEV2dDppbnN0YW5jZUlEPnhtcC5paWQ6YTM5YWI2ZDQtZmMxZS05YTQzLTg1OWYtYWQ4N2ZlNGQzNWVkPC9zdEV2dDppbnN0YW5jZUlEPgogICAgICAgICAgICAgICAgICA8c3RFdnQ6d2hlbj4yMDE5LTAxLTI2VDEzOjMxOjEyLTA1OjAwPC9zdEV2dDp3aGVuPgogICAgICAgICAgICAgICAgICA8c3RFdnQ6c29mdHdhcmVBZ2VudD5BZG9iZSBQaG90b3Nob3AgRWxlbWVudHMgMTQuMCAoV2luZG93cyk8L3N0RXZ0OnNvZnR3YXJlQWdlbnQ+CiAgICAgICAgICAgICAgIDwvcmRmOmxpPgogICAgICAgICAgICAgICA8cmRmOmxpIHJkZjpwYXJzZVR5cGU9IlJlc291cmNlIj4KICAgICAgICAgICAgICAgICAgPHN0RXZ0OmFjdGlvbj5zYXZlZDwvc3RFdnQ6YWN0aW9uPgogICAgICAgICAgICAgICAgICA8c3RFdnQ6aW5zdGFuY2VJRD54bXAuaWlkOjE0YjAzYzBhLWM4ZGYtMTg0Yi1hZmU0LTlhM2YxN2JhNzAxYjwvc3RFdnQ6aW5zdGFuY2VJRD4KICAgICAgICAgICAgICAgICAgPHN0RXZ0OndoZW4+MjAxOS0wMS0yNlQxMzozMToxMi0wNTowMDwvc3RFdnQ6d2hlbj4KICAgICAgICAgICAgICAgICAgPHN0RXZ0OnNvZnR3YXJlQWdlbnQ+QWRvYmUgUGhvdG9zaG9wIEVsZW1lbnRzIDE0LjAgKFdpbmRvd3MpPC9zdEV2dDpzb2Z0d2FyZUFnZW50PgogICAgICAgICAgICAgICAgICA8c3RFdnQ6Y2hhbmdlZD4vPC9zdEV2dDpjaGFuZ2VkPgogICAgICAgICAgICAgICA8L3JkZjpsaT4KICAgICAgICAgICAgICAgPHJkZjpsaSByZGY6cGFyc2VUeXBlPSJSZXNvdXJjZSI+CiAgICAgICAgICAgICAgICAgIDxzdEV2dDphY3Rpb24+c2F2ZWQ8L3N0RXZ0OmFjdGlvbj4KICAgICAgICAgICAgICAgICAgPHN0RXZ0Omluc3RhbmNlSUQ+eG1wLmlpZDo0ZjI2MzYxNy0wNDViLTEzNGMtOWJhMy0zZmM5NDlhNGE3NTA8L3N0RXZ0Omluc3RhbmNlSUQ+CiAgICAgICAgICAgICAgICAgIDxzdEV2dDp3aGVuPjIwMTktMDEtMjZUMTQ6MDI6NDEtMDU6MDA8L3N0RXZ0OndoZW4+CiAgICAgICAgICAgICAgICAgIDxzdEV2dDpzb2Z0d2FyZUFnZW50PkFkb2JlIFBob3Rvc2hvcCBFbGVtZW50cyAxNC4wIChXaW5kb3dzKTwvc3RFdnQ6c29mdHdhcmVBZ2VudD4KICAgICAgICAgICAgICAgICAgPHN0RXZ0OmNoYW5nZWQ+Lzwvc3RFdnQ6Y2hhbmdlZD4KICAgICAgICAgICAgICAgPC9yZGY6bGk+CiAgICAgICAgICAgIDwvcmRmOlNlcT4KICAgICAgICAgPC94bXBNTTpIaXN0b3J5PgogICAgICAgICA8ZGM6Zm9ybWF0PmltYWdlL3BuZzwvZGM6Zm9ybWF0PgogICAgICAgICA8cGhvdG9zaG9wOkNvbG9yTW9kZT4zPC9waG90b3Nob3A6Q29sb3JNb2RlPgogICAgICAgICA8cGhvdG9zaG9wOklDQ1Byb2ZpbGU+c1JHQiBJRUM2MTk2Ni0yLjE8L3Bob3Rvc2hvcDpJQ0NQcm9maWxlPgogICAgICAgICA8dGlmZjpPcmllbnRhdGlvbj4xPC90aWZmOk9yaWVudGF0aW9uPgogICAgICAgICA8dGlmZjpYUmVzb2x1dGlvbj45NjAwMDAvMTAwMDA8L3RpZmY6WFJlc29sdXRpb24+CiAgICAgICAgIDx0aWZmOllSZXNvbHV0aW9uPjk2MDAwMC8xMDAwMDwvdGlmZjpZUmVzb2x1dGlvbj4KICAgICAgICAgPHRpZmY6UmVzb2x1dGlvblVuaXQ+MjwvdGlmZjpSZXNvbHV0aW9uVW5pdD4KICAgICAgICAgPGV4aWY6Q29sb3JTcGFjZT4xPC9leGlmOkNvbG9yU3BhY2U+CiAgICAgICAgIDxleGlmOlBpeGVsWERpbWVuc2lvbj4zMjwvZXhpZjpQaXhlbFhEaW1lbnNpb24+CiAgICAgICAgIDxleGlmOlBpeGVsWURpbWVuc2lvbj4zMjwvZXhpZjpQaXhlbFlEaW1lbnNpb24+CiAgICAgIDwvcmRmOkRlc2NyaXB0aW9uPgogICA8L3JkZjpSREY+CjwveDp4bXBtZXRhPgogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgIAo8P3hwYWNrZXQgZW5kPSJ3Ij8+fDpo+wAAACBjSFJNAAB6JQAAgIMAAPn/AACA6QAAdTAAAOpgAAA6mAAAF2+SX8VGAAAAaElEQVR42mL8//8/w0ACJoYBBqMOGHXAqANGHcBCrMJORjGSiszy/68YqeoAqKHEOpb6IQAD72RV8coLPb49mghHHTDqgGFaEpKbz6nqAFJKOGIB42ireNQBow4YdcCIdwAAAAD//wMAW8MSs2NvdMsAAAAASUVORK5CYII="];

// OpenLayers 3. See http://openlayers.org/
// License: https://raw.githubusercontent.com/openlayers/ol3/master/LICENSE.md
// Version: v3.2.0

(function (root, factory) {
    if (typeof define === "function" && define.amd) {
        define([], factory);
    } else if (typeof exports === "object") {
        module.exports = factory();
    } else {
        root.ol = factory();
    }
}(this, function () {
    var OPENLAYERS = {};
    var l, aa = aa || {}, ba = this;
    function m(b) {
        return void 0 !== b
    }
    function t(b, c, d) {
        b = b.split(".");
        d = d || ba;
        b[0] in d || !d.execScript || d.execScript("var " + b[0]);
        for (var e; b.length && (e = b.shift());)
            !b.length && m(c) ? d[e] = c : d[e] ? d = d[e] : d = d[e] = {}
    }
    function ca() { }
    function da(b) {
        b.Ma = function () {
            return b.tf ? b.tf : b.tf = new b
        }
    }
    function ea(b) {
        var c = typeof b;
        if ("object" == c)
            if (b) {
                if (b instanceof Array)
                    return "array";
                if (b instanceof Object)
                    return c;
                var d = Object.prototype.toString.call(b);
                if ("[object Window]" == d)
                    return "object";
                if ("[object Array]" == d || "number" == typeof b.length && "undefined" != typeof b.splice && "undefined" != typeof b.propertyIsEnumerable && !b.propertyIsEnumerable("splice"))
                    return "array";
                if ("[object Function]" == d || "undefined" != typeof b.call && "undefined" != typeof b.propertyIsEnumerable && !b.propertyIsEnumerable("call"))
                    return "function"
            } else
                return "null";
        else if ("function" == c && "undefined" == typeof b.call)
            return "object";
        return c
    }
    function fa(b) {
        return null === b
    }
    function ga(b) {
        return "array" == ea(b)
    }
    function ha(b) {
        var c = ea(b);
        return "array" == c || "object" == c && "number" == typeof b.length
    }
    function ia(b) {
        return "string" == typeof b
    }
    function ja(b) {
        return "number" == typeof b
    }
    function ka(b) {
        return "function" == ea(b)
    }
    function la(b) {
        var c = typeof b;
        return "object" == c && null != b || "function" == c
    }
    function ma(b) {
        return b[na] || (b[na] = ++oa)
    }
    var na = "closure_uid_" + (1E9 * Math.random() >>> 0)
        , oa = 0;
    function pa(b, c, d) {
        return b.call.apply(b.bind, arguments)
    }
    function qa(b, c, d) {
        if (!b)
            throw Error();
        if (2 < arguments.length) {
            var e = Array.prototype.slice.call(arguments, 2);
            return function () {
                var d = Array.prototype.slice.call(arguments);
                Array.prototype.unshift.apply(d, e);
                return b.apply(c, d)
            }
        }
        return function () {
            return b.apply(c, arguments)
        }
    }
    function ra(b, c, d) {
        ra = Function.prototype.bind && -1 != Function.prototype.bind.toString().indexOf("native code") ? pa : qa;
        return ra.apply(null, arguments)
    }
    function sa(b, c) {
        var d = Array.prototype.slice.call(arguments, 1);
        return function () {
            var c = d.slice();
            c.push.apply(c, arguments);
            return b.apply(this, c)
        }
    }
    var ua = Date.now || function () {
        return +new Date
    }
        ;
    function v(b, c) {
        function d() { }
        d.prototype = c.prototype;
        b.R = c.prototype;
        b.prototype = new d;
        b.prototype.constructor = b;
        b.pm = function (b, d, g) {
            for (var h = Array(arguments.length - 2), k = 2; k < arguments.length; k++)
                h[k - 2] = arguments[k];
            return c.prototype[d].apply(b, h)
        }
    }
    ; var va, wa;
    function xa(b) {
        if (Error.captureStackTrace)
            Error.captureStackTrace(this, xa);
        else {
            var c = Error().stack;
            c && (this.stack = c)
        }
        b && (this.message = String(b))
    }
    v(xa, Error);
    xa.prototype.name = "CustomError";
    var ya;
    function za(b, c) {
        for (var d = b.split("%s"), e = "", f = Array.prototype.slice.call(arguments, 1); f.length && 1 < d.length;)
            e += d.shift() + f.shift();
        return e + d.join("%s")
    }
    var Aa = String.prototype.trim ? function (b) {
        return b.trim()
    }
        : function (b) {
            return b.replace(/^[\s\xa0]+|[\s\xa0]+$/g, "")
        }
        ;
    function Ba(b) {
        if (!Ca.test(b))
            return b;
        -1 != b.indexOf("&") && (b = b.replace(Da, "&amp;"));
        -1 != b.indexOf("<") && (b = b.replace(Ea, "&lt;"));
        -1 != b.indexOf(">") && (b = b.replace(Fa, "&gt;"));
        -1 != b.indexOf('"') && (b = b.replace(Ga, "&quot;"));
        -1 != b.indexOf("'") && (b = b.replace(Ha, "&#39;"));
        -1 != b.indexOf("\x00") && (b = b.replace(Ia, "&#0;"));
        return b
    }
    var Da = /&/g
        , Ea = /</g
        , Fa = />/g
        , Ga = /"/g
        , Ha = /'/g
        , Ia = /\x00/g
        , Ca = /[\x00&<>"']/;
    function Ja(b) {
        b = m(void 0) ? b.toFixed(void 0) : String(b);
        var c = b.indexOf(".");
        -1 == c && (c = b.length);
        c = Math.max(0, 2 - c);
        return Array(c + 1).join("0") + b
    }
    function Ka(b, c) {
        for (var d = 0, e = Aa(String(b)).split("."), f = Aa(String(c)).split("."), g = Math.max(e.length, f.length), h = 0; 0 == d && h < g; h++) {
            var k = e[h] || ""
                , n = f[h] || ""
                , p = RegExp("(\\d*)(\\D*)", "g")
                , q = RegExp("(\\d*)(\\D*)", "g");
            do {
                var r = p.exec(k) || ["", "", ""]
                    , s = q.exec(n) || ["", "", ""];
                if (0 == r[0].length && 0 == s[0].length)
                    break;
                d = Ma(0 == r[1].length ? 0 : parseInt(r[1], 10), 0 == s[1].length ? 0 : parseInt(s[1], 10)) || Ma(0 == r[2].length, 0 == s[2].length) || Ma(r[2], s[2])
            } while (0 == d)
        }
        return d
    }
    function Ma(b, c) {
        return b < c ? -1 : b > c ? 1 : 0
    }
    ; var Na = Array.prototype;
    function Oa(b, c, d) {
        Na.forEach.call(b, c, d)
    }
    function Pa(b, c) {
        return Na.filter.call(b, c, void 0)
    }
    function Ra(b, c, d) {
        return Na.map.call(b, c, d)
    }
    function Sa(b, c) {
        return Na.some.call(b, c, void 0)
    }
    function Ta(b) {
        var c;
        a: {
            c = Ua;
            for (var d = b.length, e = ia(b) ? b.split("") : b, f = 0; f < d; f++)
                if (f in e && c.call(void 0, e[f], f, b)) {
                    c = f;
                    break a
                }
            c = -1
        }
        return 0 > c ? null : ia(b) ? b.charAt(c) : b[c]
    }
    function Va(b, c) {
        return 0 <= Na.indexOf.call(b, c, void 0)
    }
    function Wa(b, c) {
        var d = Na.indexOf.call(b, c, void 0), e;
        (e = 0 <= d) && Na.splice.call(b, d, 1);
        return e
    }
    function Xa(b) {
        return Na.concat.apply(Na, arguments)
    }
    function Ya(b) {
        var c = b.length;
        if (0 < c) {
            for (var d = Array(c), e = 0; e < c; e++)
                d[e] = b[e];
            return d
        }
        return []
    }
    function Za(b, c) {
        for (var d = 1; d < arguments.length; d++) {
            var e = arguments[d];
            if (ha(e)) {
                var f = b.length || 0
                    , g = e.length || 0;
                b.length = f + g;
                for (var h = 0; h < g; h++)
                    b[f + h] = e[h]
            } else
                b.push(e)
        }
    }
    function $a(b, c, d, e) {
        Na.splice.apply(b, ab(arguments, 1))
    }
    function ab(b, c, d) {
        return 2 >= arguments.length ? Na.slice.call(b, c) : Na.slice.call(b, c, d)
    }
    function bb(b, c) {
        b.sort(c || cb)
    }
    function db(b, c) {
        if (!ha(b) || !ha(c) || b.length != c.length)
            return !1;
        for (var d = b.length, e = eb, f = 0; f < d; f++)
            if (!e(b[f], c[f]))
                return !1;
        return !0
    }
    function cb(b, c) {
        return b > c ? 1 : b < c ? -1 : 0
    }
    function eb(b, c) {
        return b === c
    }
    ; var fb;
    a: {
        var gb = ba.navigator;
        if (gb) {
            var hb = gb.userAgent;
            if (hb) {
                fb = hb;
                break a
            }
        }
        fb = ""
    }
    function ib(b) {
        return -1 != fb.indexOf(b)
    }
    ; function jb(b, c, d) {
        for (var e in b)
            c.call(d, b[e], e, b)
    }
    function kb(b, c) {
        for (var d in b)
            if (c.call(void 0, b[d], d, b))
                return !0;
        return !1
    }
    function lb(b) {
        var c = 0, d;
        for (d in b)
            c++;
        return c
    }
    function mb(b) {
        var c = [], d = 0, e;
        for (e in b)
            c[d++] = b[e];
        return c
    }
    function nb(b) {
        var c = [], d = 0, e;
        for (e in b)
            c[d++] = e;
        return c
    }
    function ob(b, c) {
        return c in b
    }
    function pb(b) {
        var c = qb, d;
        for (d in c)
            if (b.call(void 0, c[d], d, c))
                return d
    }
    function rb(b) {
        for (var c in b)
            return !1;
        return !0
    }
    function sb(b) {
        for (var c in b)
            delete b[c]
    }
    function tb(b, c) {
        c in b && delete b[c]
    }
    function ub(b, c, d) {
        return c in b ? b[c] : d
    }
    function vb(b, c) {
        var d = [];
        return c in b ? b[c] : b[c] = d
    }
    function wb(b) {
        var c = {}, d;
        for (d in b)
            c[d] = b[d];
        return c
    }
    var xb = "constructor hasOwnProperty isPrototypeOf propertyIsEnumerable toLocaleString toString valueOf".split(" ");
    function yb(b, c) {
        for (var d, e, f = 1; f < arguments.length; f++) {
            e = arguments[f];
            for (d in e)
                b[d] = e[d];
            for (var g = 0; g < xb.length; g++)
                d = xb[g],
                    Object.prototype.hasOwnProperty.call(e, d) && (b[d] = e[d])
        }
    }
    function zb(b) {
        var c = arguments.length;
        if (1 == c && ga(arguments[0]))
            return zb.apply(null, arguments[0]);
        for (var d = {}, e = 0; e < c; e++)
            d[arguments[e]] = !0;
        return d
    }
    ; var Ab = ib("Opera") || ib("OPR")
        , Bb = ib("Trident") || ib("MSIE")
        , Cb = ib("Gecko") && -1 == fb.toLowerCase().indexOf("webkit") && !(ib("Trident") || ib("MSIE"))
        , Db = -1 != fb.toLowerCase().indexOf("webkit")
        , Eb = ib("Macintosh")
        , Fb = ib("Windows")
        , Hb = ib("Linux") || ib("CrOS");
    function Ib() {
        var b = ba.document;
        return b ? b.documentMode : void 0
    }
    var Kb = function () {
        var b = "", c;
        if (Ab && ba.opera)
            return b = ba.opera.version,
                ka(b) ? b() : b;
        Cb ? c = /rv\:([^\);]+)(\)|;)/ : Bb ? c = /\b(?:MSIE|rv)[: ]([^\);]+)(\)|;)/ : Db && (c = /WebKit\/(\S+)/);
        c && (b = (b = c.exec(fb)) ? b[1] : "");
        return Bb && (c = Ib(),
            c > parseFloat(b)) ? String(c) : b
    }()
        , Lb = {};
    function Mb(b) {
        return Lb[b] || (Lb[b] = 0 <= Ka(Kb, b))
    }
    var Nb = ba.document
        , Pb = Nb && Bb ? Ib() || ("CSS1Compat" == Nb.compatMode ? parseInt(Kb, 10) : 5) : void 0;
    var Qb = "https:" === ba.location.protocol
        , Rb = Bb && !Mb("9.0") && "" !== Kb;
    function Ub(b, c, d) {
        return Math.min(Math.max(b, c), d)
    }
    function Vb(b, c) {
        var d = b % c;
        return 0 > d * c ? d + c : d
    }
    function Wb(b, c, d) {
        return b + d * (c - b)
    }
    function Xb(b) {
        return b * Math.PI / 180
    }
    ; function Yb(b) {
        return function (c) {
            if (m(c))
                return [Ub(c[0], b[0], b[2]), Ub(c[1], b[1], b[3])]
        }
    }
    function Zb(b) {
        return b
    }
    ; function $b(b, c, d) {
        var e = b.length;
        if (b[0] <= c)
            return 0;
        if (!(c <= b[e - 1]))
            if (0 < d)
                for (d = 1; d < e; ++d) {
                    if (b[d] < c)
                        return d - 1
                }
            else if (0 > d)
                for (d = 1; d < e; ++d) {
                    if (b[d] <= c)
                        return d
                }
            else
                for (d = 1; d < e; ++d) {
                    if (b[d] == c)
                        return d;
                    if (b[d] < c)
                        return b[d - 1] - c < c - b[d] ? d - 1 : d
                }
        return e - 1
    }
    ; function ac(b) {
        return function (c, d, e) {
            if (m(c))
                return c = $b(b, c, e),
                    c = Ub(c + d, 0, b.length - 1),
                    b[c]
        }
    }
    function bc(b, c, d) {
        return function (e, f, g) {
            if (m(e))
                return g = 0 < g ? 0 : 0 > g ? 1 : .5,
                    e = Math.floor(Math.log(c / e) / Math.log(b) + g),
                    f = Math.max(e + f, 0),
                    m(d) && (f = Math.min(f, d)),
                    c / Math.pow(b, f)
        }
    }
    ; function cc(b) {
        if (m(b))
            return 0
    }
    function dc(b, c) {
        if (m(b))
            return b + c
    }
    function ec(b) {
        var c = 2 * Math.PI / b;
        return function (b, e) {
            if (m(b))
                return b = Math.floor((b + e) / c + .5) * c
        }
    }
    function fc() {
        var b = Xb(5);
        return function (c, d) {
            if (m(c))
                return Math.abs(c + d) <= b ? 0 : c + d
        }
    }
    ; function gc(b, c, d) {
        this.center = b;
        this.resolution = c;
        this.rotation = d
    }
    ; var hc = !Bb || Bb && 9 <= Pb
        , ic = !Bb || Bb && 9 <= Pb
        , jc = Bb && !Mb("9");
    !Db || Mb("528");
    Cb && Mb("1.9b") || Bb && Mb("8") || Ab && Mb("9.5") || Db && Mb("528");
    Cb && !Mb("8") || Bb && Mb("9");
    function kc() {
        0 != lc && (mc[ma(this)] = this);
        this.oa = this.oa;
        this.pa = this.pa
    }
    var lc = 0
        , mc = {};
    kc.prototype.oa = !1;
    kc.prototype.Ec = function () {
        if (!this.oa && (this.oa = !0,
            this.M(),
            0 != lc)) {
            var b = ma(this);
            delete mc[b]
        }
    }
        ;
    function nc(b, c) {
        var d = sa(oc, c);
        b.oa ? d.call(void 0) : (b.pa || (b.pa = []),
            b.pa.push(m(void 0) ? ra(d, void 0) : d))
    }
    kc.prototype.M = function () {
        if (this.pa)
            for (; this.pa.length;)
                this.pa.shift()()
    }
        ;
    function oc(b) {
        b && "function" == typeof b.Ec && b.Ec()
    }
    ; function pc(b, c) {
        this.type = b;
        this.b = this.target = c;
        this.e = !1;
        this.hg = !0
    }
    pc.prototype.mb = function () {
        this.e = !0
    }
        ;
    pc.prototype.preventDefault = function () {
        this.hg = !1
    }
        ;
    function qc(b) {
        b.mb()
    }
    function rc(b) {
        b.preventDefault()
    }
    ; var sc = Bb ? "focusout" : "DOMFocusOut";
    function tc(b) {
        tc[" "](b);
        return b
    }
    tc[" "] = ca;
    function uc(b, c) {
        pc.call(this, b ? b.type : "");
        this.relatedTarget = this.b = this.target = null;
        this.i = this.f = this.button = this.screenY = this.screenX = this.clientY = this.clientX = this.offsetY = this.offsetX = 0;
        this.n = this.c = this.d = this.j = !1;
        this.state = null;
        this.g = !1;
        this.a = null;
        b && vc(this, b, c)
    }
    v(uc, pc);
    var wc = [1, 4, 2];
    function vc(b, c, d) {
        b.a = c;
        var e = b.type = c.type;
        b.target = c.target || c.srcElement;
        b.b = d;
        if (d = c.relatedTarget) {
            if (Cb) {
                var f;
                a: {
                    try {
                        tc(d.nodeName);
                        f = !0;
                        break a
                    } catch (g) { }
                    f = !1
                }
                f || (d = null)
            }
        } else
            "mouseover" == e ? d = c.fromElement : "mouseout" == e && (d = c.toElement);
        b.relatedTarget = d;
        Object.defineProperties ? Object.defineProperties(b, {
            offsetX: {
                configurable: !0,
                enumerable: !0,
                get: b.kf,
                set: b.Cl
            },
            offsetY: {
                configurable: !0,
                enumerable: !0,
                get: b.lf,
                set: b.Dl
            }
        }) : (b.offsetX = b.kf(),
            b.offsetY = b.lf());
        b.clientX = void 0 !== c.clientX ? c.clientX : c.pageX;
        b.clientY = void 0 !== c.clientY ? c.clientY : c.pageY;
        b.screenX = c.screenX || 0;
        b.screenY = c.screenY || 0;
        b.button = c.button;
        b.f = c.keyCode || 0;
        b.i = c.charCode || ("keypress" == e ? c.keyCode : 0);
        b.j = c.ctrlKey;
        b.d = c.altKey;
        b.c = c.shiftKey;
        b.n = c.metaKey;
        b.g = Eb ? c.metaKey : c.ctrlKey;
        b.state = c.state;
        c.defaultPrevented && b.preventDefault()
    }
    function xc(b) {
        return (hc ? 0 == b.a.button : "click" == b.type ? !0 : !!(b.a.button & wc[0])) && !(Db && Eb && b.j)
    }
    l = uc.prototype;
    l.mb = function () {
        uc.R.mb.call(this);
        this.a.stopPropagation ? this.a.stopPropagation() : this.a.cancelBubble = !0
    }
        ;
    l.preventDefault = function () {
        uc.R.preventDefault.call(this);
        var b = this.a;
        if (b.preventDefault)
            b.preventDefault();
        else if (b.returnValue = !1,
            jc)
            try {
                if (b.ctrlKey || 112 <= b.keyCode && 123 >= b.keyCode)
                    b.keyCode = -1
            } catch (c) { }
    }
        ;
    l.oh = function () {
        return this.a
    }
        ;
    l.kf = function () {
        return Db || void 0 !== this.a.offsetX ? this.a.offsetX : this.a.layerX
    }
        ;
    l.Cl = function (b) {
        Object.defineProperties(this, {
            offsetX: {
                writable: !0,
                enumerable: !0,
                configurable: !0,
                value: b
            }
        })
    }
        ;
    l.lf = function () {
        return Db || void 0 !== this.a.offsetY ? this.a.offsetY : this.a.layerY
    }
        ;
    l.Dl = function (b) {
        Object.defineProperties(this, {
            offsetY: {
                writable: !0,
                enumerable: !0,
                configurable: !0,
                value: b
            }
        })
    }
        ;
    var yc = "closure_listenable_" + (1E6 * Math.random() | 0);
    function zc(b) {
        return !(!b || !b[yc])
    }
    var Ac = 0;
    function Bc(b, c, d, e, f) {
        this.Yb = b;
        this.a = null;
        this.src = c;
        this.type = d;
        this.wc = !!e;
        this.sd = f;
        this.key = ++Ac;
        this.tc = this.Yc = !1
    }
    function Cc(b) {
        b.tc = !0;
        b.Yb = null;
        b.a = null;
        b.src = null;
        b.sd = null
    }
    ; function Dc(b) {
        this.src = b;
        this.a = {};
        this.d = 0
    }
    Dc.prototype.add = function (b, c, d, e, f) {
        var g = b.toString();
        b = this.a[g];
        b || (b = this.a[g] = [],
            this.d++);
        var h = Ec(b, c, e, f);
        -1 < h ? (c = b[h],
            d || (c.Yc = !1)) : (c = new Bc(c, this.src, g, !!e, f),
                c.Yc = d,
                b.push(c));
        return c
    }
        ;
    Dc.prototype.remove = function (b, c, d, e) {
        b = b.toString();
        if (!(b in this.a))
            return !1;
        var f = this.a[b];
        c = Ec(f, c, d, e);
        return -1 < c ? (Cc(f[c]),
            Na.splice.call(f, c, 1),
            0 == f.length && (delete this.a[b],
                this.d--),
            !0) : !1
    }
        ;
    function Fc(b, c) {
        var d = c.type;
        if (!(d in b.a))
            return !1;
        var e = Wa(b.a[d], c);
        e && (Cc(c),
            0 == b.a[d].length && (delete b.a[d],
                b.d--));
        return e
    }
    function Gc(b, c, d, e, f) {
        b = b.a[c.toString()];
        c = -1;
        b && (c = Ec(b, d, e, f));
        return -1 < c ? b[c] : null
    }
    function Hc(b, c, d) {
        var e = m(c)
            , f = e ? c.toString() : ""
            , g = m(d);
        return kb(b.a, function (b) {
            for (var c = 0; c < b.length; ++c)
                if (!(e && b[c].type != f || g && b[c].wc != d))
                    return !0;
            return !1
        })
    }
    function Ec(b, c, d, e) {
        for (var f = 0; f < b.length; ++f) {
            var g = b[f];
            if (!g.tc && g.Yb == c && g.wc == !!d && g.sd == e)
                return f
        }
        return -1
    }
    ; var Ic = "closure_lm_" + (1E6 * Math.random() | 0)
        , Jc = {}
        , Kc = 0;
    function w(b, c, d, e, f) {
        if (ga(c)) {
            for (var g = 0; g < c.length; g++)
                w(b, c[g], d, e, f);
            return null
        }
        d = Lc(d);
        return zc(b) ? b.Oa(c, d, e, f) : Mc(b, c, d, !1, e, f)
    }
    function Mc(b, c, d, e, f, g) {
        if (!c)
            throw Error("Invalid event type");
        var h = !!f
            , k = Nc(b);
        k || (b[Ic] = k = new Dc(b));
        d = k.add(c, d, e, f, g);
        if (d.a)
            return d;
        e = Oc();
        d.a = e;
        e.src = b;
        e.Yb = d;
        b.addEventListener ? b.addEventListener(c.toString(), e, h) : b.attachEvent(Pc(c.toString()), e);
        Kc++;
        return d
    }
    function Oc() {
        var b = Qc
            , c = ic ? function (d) {
                return b.call(c.src, c.Yb, d)
            }
                : function (d) {
                    d = b.call(c.src, c.Yb, d);
                    if (!d)
                        return d
                }
            ;
        return c
    }
    function Rc(b, c, d, e, f) {
        if (ga(c)) {
            for (var g = 0; g < c.length; g++)
                Rc(b, c[g], d, e, f);
            return null
        }
        d = Lc(d);
        return zc(b) ? b.hb.add(String(c), d, !0, e, f) : Mc(b, c, d, !0, e, f)
    }
    function Sc(b, c, d, e, f) {
        if (ga(c))
            for (var g = 0; g < c.length; g++)
                Sc(b, c[g], d, e, f);
        else
            d = Lc(d),
                zc(b) ? b.Me(c, d, e, f) : b && (b = Nc(b)) && (c = Gc(b, c, d, !!e, f)) && Tc(c)
    }
    function Tc(b) {
        if (ja(b) || !b || b.tc)
            return !1;
        var c = b.src;
        if (zc(c))
            return Fc(c.hb, b);
        var d = b.type
            , e = b.a;
        c.removeEventListener ? c.removeEventListener(d, e, b.wc) : c.detachEvent && c.detachEvent(Pc(d), e);
        Kc--;
        (d = Nc(c)) ? (Fc(d, b),
            0 == d.d && (d.src = null,
                c[Ic] = null)) : Cc(b);
        return !0
    }
    function Pc(b) {
        return b in Jc ? Jc[b] : Jc[b] = "on" + b
    }
    function Uc(b, c, d, e) {
        var f = !0;
        if (b = Nc(b))
            if (c = b.a[c.toString()])
                for (c = c.concat(),
                    b = 0; b < c.length; b++) {
                    var g = c[b];
                    g && g.wc == d && !g.tc && (g = Vc(g, e),
                        f = f && !1 !== g)
                }
        return f
    }
    function Vc(b, c) {
        var d = b.Yb
            , e = b.sd || b.src;
        b.Yc && Tc(b);
        return d.call(e, c)
    }
    function Qc(b, c) {
        if (b.tc)
            return !0;
        if (!ic) {
            var d;
            if (!(d = c))
                a: {
                    d = ["window", "event"];
                    for (var e = ba, f; f = d.shift();)
                        if (null != e[f])
                            e = e[f];
                        else {
                            d = null;
                            break a
                        }
                    d = e
                }
            f = d;
            d = new uc(f, this);
            e = !0;
            if (!(0 > f.keyCode || void 0 != f.returnValue)) {
                a: {
                    var g = !1;
                    if (0 == f.keyCode)
                        try {
                            f.keyCode = -1;
                            break a
                        } catch (h) {
                            g = !0
                        }
                    if (g || void 0 == f.returnValue)
                        f.returnValue = !0
                }
                f = [];
                for (g = d.b; g; g = g.parentNode)
                    f.push(g);
                for (var g = b.type, k = f.length - 1; !d.e && 0 <= k; k--) {
                    d.b = f[k];
                    var n = Uc(f[k], g, !0, d)
                        , e = e && n
                }
                for (k = 0; !d.e && k < f.length; k++)
                    d.b = f[k],
                        n = Uc(f[k], g, !1, d),
                        e = e && n
            }
            return e
        }
        return Vc(b, new uc(c, this))
    }
    function Nc(b) {
        b = b[Ic];
        return b instanceof Dc ? b : null
    }
    var Wc = "__closure_events_fn_" + (1E9 * Math.random() >>> 0);
    function Lc(b) {
        if (ka(b))
            return b;
        b[Wc] || (b[Wc] = function (c) {
            return b.handleEvent(c)
        }
        );
        return b[Wc]
    }
    ; function Xc(b) {
        return function () {
            return b
        }
    }
    var Yc = Xc(!1)
        , Zc = Xc(!0)
        , $c = Xc(null);
    function ad(b) {
        return b
    }
    function bd(b) {
        var c;
        c = c || 0;
        return function () {
            return b.apply(this, Array.prototype.slice.call(arguments, 0, c))
        }
    }
    function cd(b) {
        var c = arguments
            , d = c.length;
        return function () {
            for (var b, f = 0; f < d; f++)
                b = c[f].apply(this, arguments);
            return b
        }
    }
    function dd(b) {
        var c = arguments
            , d = c.length;
        return function () {
            for (var b = 0; b < d; b++)
                if (!c[b].apply(this, arguments))
                    return !1;
            return !0
        }
    }
    ; function ed() {
        kc.call(this);
        this.hb = new Dc(this);
        this.Rg = this;
        this.ae = null
    }
    v(ed, kc);
    ed.prototype[yc] = !0;
    l = ed.prototype;
    l.addEventListener = function (b, c, d, e) {
        w(this, b, c, d, e)
    }
        ;
    l.removeEventListener = function (b, c, d, e) {
        Sc(this, b, c, d, e)
    }
        ;
    l.dispatchEvent = function (b) {
        var c, d = this.ae;
        if (d)
            for (c = []; d; d = d.ae)
                c.push(d);
        var d = this.Rg
            , e = b.type || b;
        if (ia(b))
            b = new pc(b, d);
        else if (b instanceof pc)
            b.target = b.target || d;
        else {
            var f = b;
            b = new pc(e, d);
            yb(b, f)
        }
        var f = !0, g;
        if (c)
            for (var h = c.length - 1; !b.e && 0 <= h; h--)
                g = b.b = c[h],
                    f = fd(g, e, !0, b) && f;
        b.e || (g = b.b = d,
            f = fd(g, e, !0, b) && f,
            b.e || (f = fd(g, e, !1, b) && f));
        if (c)
            for (h = 0; !b.e && h < c.length; h++)
                g = b.b = c[h],
                    f = fd(g, e, !1, b) && f;
        return f
    }
        ;
    l.M = function () {
        ed.R.M.call(this);
        if (this.hb) {
            var b = this.hb, c = 0, d;
            for (d in b.a) {
                for (var e = b.a[d], f = 0; f < e.length; f++)
                    ++c,
                        Cc(e[f]);
                delete b.a[d];
                b.d--
            }
        }
        this.ae = null
    }
        ;
    l.Oa = function (b, c, d, e) {
        return this.hb.add(String(b), c, !1, d, e)
    }
        ;
    l.Me = function (b, c, d, e) {
        return this.hb.remove(String(b), c, d, e)
    }
        ;
    function fd(b, c, d, e) {
        c = b.hb.a[String(c)];
        if (!c)
            return !0;
        c = c.concat();
        for (var f = !0, g = 0; g < c.length; ++g) {
            var h = c[g];
            if (h && !h.tc && h.wc == d) {
                var k = h.Yb
                    , n = h.sd || h.src;
                h.Yc && Fc(b.hb, h);
                f = !1 !== k.call(n, e) && f
            }
        }
        return f && 0 != e.hg
    }
    function gd(b, c, d) {
        return Hc(b.hb, m(c) ? String(c) : void 0, d)
    }
    ; function hd() {
        ed.call(this);
        this.d = 0
    }
    v(hd, ed);
    function id(b) {
        Tc(b)
    }
    l = hd.prototype;
    l.o = function () {
        ++this.d;
        this.dispatchEvent("change")
    }
        ;
    l.A = function () {
        return this.d
    }
        ;
    l.u = function (b, c, d) {
        return w(this, b, c, !1, d)
    }
        ;
    l.B = function (b, c, d) {
        return Rc(this, b, c, !1, d)
    }
        ;
    l.v = function (b, c, d) {
        Sc(this, b, c, !1, d)
    }
        ;
    l.C = id;
    function jd(b, c, d) {
        pc.call(this, b);
        this.key = c;
        this.oldValue = d
    }
    v(jd, pc);
    function ld(b, c, d, e) {
        this.source = b;
        this.target = c;
        this.b = d;
        this.d = e;
        this.c = this.a = ad
    }
    ld.prototype.transform = function (b, c) {
        var d = md(this.source, this.b);
        this.a = b;
        this.c = c;
        nd(this.source, this.b, d)
    }
        ;
    function od(b) {
        hd.call(this);
        ma(this);
        this.j = {};
        this.Ba = {};
        this.uc = {};
        m(b) && this.G(b)
    }
    v(od, hd);
    var pd = {}
        , qd = {}
        , rd = {};
    function sd(b) {
        return pd.hasOwnProperty(b) ? pd[b] : pd[b] = "change:" + b
    }
    function md(b, c) {
        var d = qd.hasOwnProperty(c) ? qd[c] : qd[c] = "get" + (String(c.charAt(0)).toUpperCase() + String(c.substr(1)).toLowerCase())
            , d = b[d];
        return m(d) ? d.call(b) : b.get(c)
    }
    l = od.prototype;
    l.O = function (b, c, d) {
        d = d || b;
        this.P(b);
        var e = sd(d);
        this.uc[b] = w(c, e, function (c) {
            nd(this, b, c.oldValue)
        }, void 0, this);
        c = new ld(this, c, b, d);
        this.Ba[b] = c;
        nd(this, b, this.j[b]);
        return c
    }
        ;
    l.get = function (b) {
        var c, d = this.Ba;
        d.hasOwnProperty(b) ? (b = d[b],
            c = md(b.target, b.d),
            c = b.c(c)) : this.j.hasOwnProperty(b) && (c = this.j[b]);
        return c
    }
        ;
    l.J = function () {
        var b = this.Ba, c;
        if (rb(this.j)) {
            if (rb(b))
                return [];
            c = b
        } else if (rb(b))
            c = this.j;
        else {
            c = {};
            for (var d in this.j)
                c[d] = !0;
            for (d in b)
                c[d] = !0
        }
        return nb(c)
    }
        ;
    l.L = function () {
        var b = {}, c;
        for (c in this.j)
            b[c] = this.j[c];
        for (c in this.Ba)
            b[c] = this.get(c);
        return b
    }
        ;
    function nd(b, c, d) {
        var e;
        e = sd(c);
        b.dispatchEvent(new jd(e, c, d));
        b.dispatchEvent(new jd("propertychange", c, d))
    }
    l.set = function (b, c) {
        var d = this.Ba;
        if (d.hasOwnProperty(b)) {
            var e = d[b];
            c = e.a(c);
            var d = e.target
                , e = e.d
                , f = c
                , g = rd.hasOwnProperty(e) ? rd[e] : rd[e] = "set" + (String(e.charAt(0)).toUpperCase() + String(e.substr(1)).toLowerCase())
                , g = d[g];
            m(g) ? g.call(d, f) : d.set(e, f)
        } else
            d = this.j[b],
                this.j[b] = c,
                nd(this, b, d)
    }
        ;
    l.G = function (b) {
        for (var c in b)
            this.set(c, b[c])
    }
        ;
    l.P = function (b) {
        var c = this.uc
            , d = c[b];
        d && (delete c[b],
            Tc(d),
            c = this.get(b),
            delete this.Ba[b],
            this.j[b] = c)
    }
        ;
    l.Q = function () {
        for (var b in this.uc)
            this.P(b)
    }
        ;
    function ud(b, c) {
        b[0] += c[0];
        b[1] += c[1];
        return b
    }
    function vd(b, c) {
        var d = b[0]
            , e = b[1]
            , f = c[0]
            , g = c[1]
            , h = f[0]
            , f = f[1]
            , k = g[0]
            , g = g[1]
            , n = k - h
            , p = g - f
            , d = 0 === n && 0 === p ? 0 : (n * (d - h) + p * (e - f)) / (n * n + p * p || 0);
        0 >= d || (1 <= d ? (h = k,
            f = g) : (h += d * n,
                f += d * p));
        return [h, f]
    }
    function wd(b, c) {
        var d = Vb(b + 180, 360) - 180
            , e = Math.abs(Math.round(3600 * d));
        return Math.floor(e / 3600) + "\u00b0 " + Math.floor(e / 60 % 60) + "\u2032 " + Math.floor(e % 60) + "\u2033 " + c.charAt(0 > d ? 1 : 0)
    }
    function xd(b, c, d) {
        return m(b) ? c.replace("{x}", b[0].toFixed(d)).replace("{y}", b[1].toFixed(d)) : ""
    }
    function yd(b, c) {
        for (var d = !0, e = b.length - 1; 0 <= e; --e)
            if (b[e] != c[e]) {
                d = !1;
                break
            }
        return d
    }
    function zd(b, c) {
        var d = Math.cos(c)
            , e = Math.sin(c)
            , f = b[1] * d + b[0] * e;
        b[0] = b[0] * d - b[1] * e;
        b[1] = f;
        return b
    }
    function Ad(b, c) {
        var d = b[0] - c[0]
            , e = b[1] - c[1];
        return d * d + e * e
    }
    function Bd(b, c) {
        return xd(b, "{x}, {y}", c)
    }
    ; function Cd(b) {
        this.length = b.length || b;
        for (var c = 0; c < this.length; c++)
            this[c] = b[c] || 0
    }
    Cd.prototype.a = 4;
    Cd.prototype.set = function (b, c) {
        c = c || 0;
        for (var d = 0; d < b.length && c + d < this.length; d++)
            this[c + d] = b[d]
    }
        ;
    Cd.prototype.toString = Array.prototype.join;
    "undefined" == typeof Float32Array && (Cd.BYTES_PER_ELEMENT = 4,
        Cd.prototype.BYTES_PER_ELEMENT = Cd.prototype.a,
        Cd.prototype.set = Cd.prototype.set,
        Cd.prototype.toString = Cd.prototype.toString,
        t("Float32Array", Cd, void 0));
    function Dd(b) {
        this.length = b.length || b;
        for (var c = 0; c < this.length; c++)
            this[c] = b[c] || 0
    }
    Dd.prototype.a = 8;
    Dd.prototype.set = function (b, c) {
        c = c || 0;
        for (var d = 0; d < b.length && c + d < this.length; d++)
            this[c + d] = b[d]
    }
        ;
    Dd.prototype.toString = Array.prototype.join;
    if ("undefined" == typeof Float64Array) {
        try {
            Dd.BYTES_PER_ELEMENT = 8
        } catch (Ed) { }
        Dd.prototype.BYTES_PER_ELEMENT = Dd.prototype.a;
        Dd.prototype.set = Dd.prototype.set;
        Dd.prototype.toString = Dd.prototype.toString;
        t("Float64Array", Dd, void 0)
    }
    ; function Fd(b, c, d, e, f) {
        b[0] = c;
        b[1] = d;
        b[2] = e;
        b[3] = f
    }
    ; function Gd() {
        var b = Array(16);
        Hd(b, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
        return b
    }
    function Id() {
        var b = Array(16);
        Hd(b, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
        return b
    }
    function Hd(b, c, d, e, f, g, h, k, n, p, q, r, s, u, y, A, z) {
        b[0] = c;
        b[1] = d;
        b[2] = e;
        b[3] = f;
        b[4] = g;
        b[5] = h;
        b[6] = k;
        b[7] = n;
        b[8] = p;
        b[9] = q;
        b[10] = r;
        b[11] = s;
        b[12] = u;
        b[13] = y;
        b[14] = A;
        b[15] = z
    }
    function Jd(b, c) {
        b[0] = c[0];
        b[1] = c[1];
        b[2] = c[2];
        b[3] = c[3];
        b[4] = c[4];
        b[5] = c[5];
        b[6] = c[6];
        b[7] = c[7];
        b[8] = c[8];
        b[9] = c[9];
        b[10] = c[10];
        b[11] = c[11];
        b[12] = c[12];
        b[13] = c[13];
        b[14] = c[14];
        b[15] = c[15]
    }
    function Kd(b) {
        b[0] = 1;
        b[1] = 0;
        b[2] = 0;
        b[3] = 0;
        b[4] = 0;
        b[5] = 1;
        b[6] = 0;
        b[7] = 0;
        b[8] = 0;
        b[9] = 0;
        b[10] = 1;
        b[11] = 0;
        b[12] = 0;
        b[13] = 0;
        b[14] = 0;
        b[15] = 1
    }
    function Ld(b, c, d) {
        var e = b[0]
            , f = b[1]
            , g = b[2]
            , h = b[3]
            , k = b[4]
            , n = b[5]
            , p = b[6]
            , q = b[7]
            , r = b[8]
            , s = b[9]
            , u = b[10]
            , y = b[11]
            , A = b[12]
            , z = b[13]
            , D = b[14];
        b = b[15];
        var x = c[0]
            , T = c[1]
            , O = c[2]
            , W = c[3]
            , V = c[4]
            , ta = c[5]
            , Jb = c[6]
            , Qa = c[7]
            , Sb = c[8]
            , Gb = c[9]
            , La = c[10]
            , Tb = c[11]
            , Ob = c[12]
            , td = c[13]
            , kd = c[14];
        c = c[15];
        d[0] = e * x + k * T + r * O + A * W;
        d[1] = f * x + n * T + s * O + z * W;
        d[2] = g * x + p * T + u * O + D * W;
        d[3] = h * x + q * T + y * O + b * W;
        d[4] = e * V + k * ta + r * Jb + A * Qa;
        d[5] = f * V + n * ta + s * Jb + z * Qa;
        d[6] = g * V + p * ta + u * Jb + D * Qa;
        d[7] = h * V + q * ta + y * Jb + b * Qa;
        d[8] = e * Sb + k * Gb + r * La + A * Tb;
        d[9] = f * Sb + n * Gb + s * La + z * Tb;
        d[10] = g * Sb + p * Gb + u * La + D * Tb;
        d[11] = h * Sb + q * Gb + y * La + b * Tb;
        d[12] = e * Ob + k * td + r * kd + A * c;
        d[13] = f * Ob + n * td + s * kd + z * c;
        d[14] = g * Ob + p * td + u * kd + D * c;
        d[15] = h * Ob + q * td + y * kd + b * c
    }
    function Md(b, c) {
        var d = b[0]
            , e = b[1]
            , f = b[2]
            , g = b[3]
            , h = b[4]
            , k = b[5]
            , n = b[6]
            , p = b[7]
            , q = b[8]
            , r = b[9]
            , s = b[10]
            , u = b[11]
            , y = b[12]
            , A = b[13]
            , z = b[14]
            , D = b[15]
            , x = d * k - e * h
            , T = d * n - f * h
            , O = d * p - g * h
            , W = e * n - f * k
            , V = e * p - g * k
            , ta = f * p - g * n
            , Jb = q * A - r * y
            , Qa = q * z - s * y
            , Sb = q * D - u * y
            , Gb = r * z - s * A
            , La = r * D - u * A
            , Tb = s * D - u * z
            , Ob = x * Tb - T * La + O * Gb + W * Sb - V * Qa + ta * Jb;
        0 != Ob && (Ob = 1 / Ob,
            c[0] = (k * Tb - n * La + p * Gb) * Ob,
            c[1] = (-e * Tb + f * La - g * Gb) * Ob,
            c[2] = (A * ta - z * V + D * W) * Ob,
            c[3] = (-r * ta + s * V - u * W) * Ob,
            c[4] = (-h * Tb + n * Sb - p * Qa) * Ob,
            c[5] = (d * Tb - f * Sb + g * Qa) * Ob,
            c[6] = (-y * ta + z * O - D * T) * Ob,
            c[7] = (q * ta - s * O + u * T) * Ob,
            c[8] = (h * La - k * Sb + p * Jb) * Ob,
            c[9] = (-d * La + e * Sb - g * Jb) * Ob,
            c[10] = (y * V - A * O + D * x) * Ob,
            c[11] = (-q * V + r * O - u * x) * Ob,
            c[12] = (-h * Gb + k * Qa - n * Jb) * Ob,
            c[13] = (d * Gb - e * Qa + f * Jb) * Ob,
            c[14] = (-y * W + A * T - z * x) * Ob,
            c[15] = (q * W - r * T + s * x) * Ob)
    }
    function Nd(b, c, d) {
        var e = b[1] * c + b[5] * d + 0 * b[9] + b[13]
            , f = b[2] * c + b[6] * d + 0 * b[10] + b[14]
            , g = b[3] * c + b[7] * d + 0 * b[11] + b[15];
        b[12] = b[0] * c + b[4] * d + 0 * b[8] + b[12];
        b[13] = e;
        b[14] = f;
        b[15] = g
    }
    function Od(b, c, d) {
        Hd(b, b[0] * c, b[1] * c, b[2] * c, b[3] * c, b[4] * d, b[5] * d, b[6] * d, b[7] * d, 1 * b[8], 1 * b[9], 1 * b[10], 1 * b[11], b[12], b[13], b[14], b[15])
    }
    function Pd(b, c) {
        var d = b[0]
            , e = b[1]
            , f = b[2]
            , g = b[3]
            , h = b[4]
            , k = b[5]
            , n = b[6]
            , p = b[7]
            , q = Math.cos(c)
            , r = Math.sin(c);
        b[0] = d * q + h * r;
        b[1] = e * q + k * r;
        b[2] = f * q + n * r;
        b[3] = g * q + p * r;
        b[4] = d * -r + h * q;
        b[5] = e * -r + k * q;
        b[6] = f * -r + n * q;
        b[7] = g * -r + p * q
    }
    new Float64Array(3);
    new Float64Array(3);
    new Float64Array(4);
    new Float64Array(4);
    new Float64Array(4);
    new Float64Array(16);
    function Qd(b) {
        for (var c = Rd(), d = 0, e = b.length; d < e; ++d)
            Sd(c, b[d]);
        return c
    }
    function Td(b, c, d) {
        var e = Math.min.apply(null, b)
            , f = Math.min.apply(null, c);
        b = Math.max.apply(null, b);
        c = Math.max.apply(null, c);
        return Ud(e, f, b, c, d)
    }
    function Vd(b, c, d) {
        return m(d) ? (d[0] = b[0] - c,
            d[1] = b[1] - c,
            d[2] = b[2] + c,
            d[3] = b[3] + c,
            d) : [b[0] - c, b[1] - c, b[2] + c, b[3] + c]
    }
    function Wd(b, c) {
        return m(c) ? (c[0] = b[0],
            c[1] = b[1],
            c[2] = b[2],
            c[3] = b[3],
            c) : b.slice()
    }
    function Xd(b, c, d) {
        c = c < b[0] ? b[0] - c : b[2] < c ? c - b[2] : 0;
        b = d < b[1] ? b[1] - d : b[3] < d ? d - b[3] : 0;
        return c * c + b * b
    }
    function Yd(b, c) {
        return b[0] <= c[0] && c[2] <= b[2] && b[1] <= c[1] && c[3] <= b[3]
    }
    function Zd(b, c, d) {
        return b[0] <= c && c <= b[2] && b[1] <= d && d <= b[3]
    }
    function $d(b, c) {
        var d = b[1]
            , e = b[2]
            , f = b[3]
            , g = c[0]
            , h = c[1]
            , k = 0;
        g < b[0] ? k = k | 16 : g > e && (k = k | 4);
        h < d ? k |= 8 : h > f && (k |= 2);
        0 === k && (k = 1);
        return k
    }
    function Rd() {
        return [Infinity, Infinity, -Infinity, -Infinity]
    }
    function Ud(b, c, d, e, f) {
        return m(f) ? (f[0] = b,
            f[1] = c,
            f[2] = d,
            f[3] = e,
            f) : [b, c, d, e]
    }
    function ae(b, c) {
        var d = b[0]
            , e = b[1];
        return Ud(d, e, d, e, c)
    }
    function be(b, c) {
        return b[0] == c[0] && b[2] == c[2] && b[1] == c[1] && b[3] == c[3]
    }
    function ce(b, c) {
        c[0] < b[0] && (b[0] = c[0]);
        c[2] > b[2] && (b[2] = c[2]);
        c[1] < b[1] && (b[1] = c[1]);
        c[3] > b[3] && (b[3] = c[3]);
        return b
    }
    function Sd(b, c) {
        c[0] < b[0] && (b[0] = c[0]);
        c[0] > b[2] && (b[2] = c[0]);
        c[1] < b[1] && (b[1] = c[1]);
        c[1] > b[3] && (b[3] = c[1])
    }
    function de(b, c, d, e, f) {
        for (; d < e; d += f) {
            var g = b
                , h = c[d]
                , k = c[d + 1];
            g[0] = Math.min(g[0], h);
            g[1] = Math.min(g[1], k);
            g[2] = Math.max(g[2], h);
            g[3] = Math.max(g[3], k)
        }
        return b
    }
    function ee(b, c) {
        var d;
        return (d = c.call(void 0, fe(b))) || (d = c.call(void 0, ge(b))) || (d = c.call(void 0, he(b))) ? d : (d = c.call(void 0, ge(b))) ? d : !1
    }
    function fe(b) {
        return [b[0], b[1]]
    }
    function ge(b) {
        return [b[2], b[1]]
    }
    function ie(b) {
        return [(b[0] + b[2]) / 2, (b[1] + b[3]) / 2]
    }
    function je(b, c) {
        var d;
        "bottom-left" === c ? d = fe(b) : "bottom-right" === c ? d = ge(b) : "top-left" === c ? d = ke(b) : "top-right" === c && (d = he(b));
        return d
    }
    function le(b, c, d, e) {
        var f = c * e[0] / 2;
        e = c * e[1] / 2;
        c = Math.cos(d);
        d = Math.sin(d);
        f = [-f, -f, f, f];
        e = [-e, e, -e, e];
        var g, h, k;
        for (g = 0; 4 > g; ++g)
            h = f[g],
                k = e[g],
                f[g] = b[0] + h * c - k * d,
                e[g] = b[1] + h * d + k * c;
        return Td(f, e, void 0)
    }
    function me(b) {
        return b[3] - b[1]
    }
    function ne(b, c, d) {
        d = m(d) ? d : Rd();
        oe(b, c) && (d[0] = b[0] > c[0] ? b[0] : c[0],
            d[1] = b[1] > c[1] ? b[1] : c[1],
            d[2] = b[2] < c[2] ? b[2] : c[2],
            d[3] = b[3] < c[3] ? b[3] : c[3]);
        return d
    }
    function ke(b) {
        return [b[0], b[3]]
    }
    function he(b) {
        return [b[2], b[3]]
    }
    function pe(b) {
        return b[2] - b[0]
    }
    function oe(b, c) {
        return b[0] <= c[2] && b[2] >= c[0] && b[1] <= c[3] && b[3] >= c[1]
    }
    function qe(b) {
        return b[2] < b[0] || b[3] < b[1]
    }
    function re(b, c) {
        var d = (b[2] - b[0]) / 2 * (c - 1)
            , e = (b[3] - b[1]) / 2 * (c - 1);
        b[0] -= d;
        b[2] += d;
        b[1] -= e;
        b[3] += e
    }
    function se(b, c, d) {
        b = [b[0], b[1], b[0], b[3], b[2], b[1], b[2], b[3]];
        c(b, b, 2);
        return Td([b[0], b[2], b[4], b[6]], [b[1], b[3], b[5], b[7]], d)
    }
    ;/*

 Latitude/longitude spherical geodesy formulae taken from
 http://www.movable-type.co.uk/scripts/latlong.html
 Licenced under CC-BY-3.0.
*/
    function te(b) {
        this.radius = b
    }
    function ue(b, c) {
        var d = Xb(b[1])
            , e = Xb(c[1])
            , f = (e - d) / 2
            , g = Xb(c[0] - b[0]) / 2
            , d = Math.sin(f) * Math.sin(f) + Math.sin(g) * Math.sin(g) * Math.cos(d) * Math.cos(e);
        return 2 * ve.radius * Math.atan2(Math.sqrt(d), Math.sqrt(1 - d))
    }
    te.prototype.offset = function (b, c, d) {
        var e = Xb(b[1]);
        c /= this.radius;
        var f = Math.asin(Math.sin(e) * Math.cos(c) + Math.cos(e) * Math.sin(c) * Math.cos(d));
        return [180 * (Xb(b[0]) + Math.atan2(Math.sin(d) * Math.sin(c) * Math.cos(e), Math.cos(c) - Math.sin(e) * Math.sin(f))) / Math.PI, 180 * f / Math.PI]
    }
        ;
    var ve = new te(6370997);
    var xe = {};
    xe.degrees = 2 * Math.PI * ve.radius / 360;
    xe.ft = .3048;
    xe.m = 1;
    function ye(b) {
        this.a = b.code;
        this.d = b.units;
        this.g = m(b.extent) ? b.extent : null;
        this.c = m(b.worldExtent) ? b.worldExtent : null;
        this.b = m(b.axisOrientation) ? b.axisOrientation : "enu";
        this.e = m(b.global) ? b.global : !1;
        this.f = null
    }
    l = ye.prototype;
    l.ph = function () {
        return this.a
    }
        ;
    l.D = function () {
        return this.g
    }
        ;
    l.Dj = function () {
        return this.d
    }
        ;
    l.qe = function () {
        return xe[this.d]
    }
        ;
    l.Vh = function () {
        return this.c
    }
        ;
    function ze(b) {
        return b.b
    }
    l.Gi = function () {
        return this.e
    }
        ;
    l.Ej = function (b) {
        this.g = b
    }
        ;
    l.Kl = function (b) {
        this.c = b
    }
        ;
    l.re = function (b, c) {
        if ("degrees" == this.d)
            return b;
        var d = Ae(this, Be("EPSG:4326"))
            , e = [c[0] - b / 2, c[1], c[0] + b / 2, c[1], c[0], c[1] - b / 2, c[0], c[1] + b / 2]
            , e = d(e, e, 2)
            , d = (ue(e.slice(0, 2), e.slice(2, 4)) + ue(e.slice(4, 6), e.slice(6, 8))) / 2
            , e = this.qe();
        m(e) && (d /= e);
        return d
    }
        ;
    var Ce = {}
        , De = {};
    function Ee(b) {
        Fe(b);
        Oa(b, function (c) {
            Oa(b, function (b) {
                c !== b && Ge(c, b, He)
            })
        })
    }
    function Ie() {
        var b = Je
            , c = Ke
            , d = Le;
        Oa(Me, function (e) {
            Oa(b, function (b) {
                Ge(e, b, c);
                Ge(b, e, d)
            })
        })
    }
    function Ne(b) {
        Ce[b.a] = b;
        Ge(b, b, He)
    }
    function Fe(b) {
        var c = [];
        Oa(b, function (b) {
            c.push(Ne(b))
        })
    }
    function Oe(b) {
        return null != b ? ia(b) ? Be(b) : b : Be("EPSG:3857")
    }
    function Ge(b, c, d) {
        b = b.a;
        c = c.a;
        b in De || (De[b] = {});
        De[b][c] = d
    }
    function Pe(b, c, d, e) {
        b = Be(b);
        c = Be(c);
        Ge(b, c, Qe(d));
        Ge(c, b, Qe(e))
    }
    function Qe(b) {
        return function (c, d, e) {
            var f = c.length;
            e = m(e) ? e : 2;
            d = m(d) ? d : Array(f);
            var g, h;
            for (h = 0; h < f; h += e)
                for (g = b([c[h], c[h + 1]]),
                    d[h] = g[0],
                    d[h + 1] = g[1],
                    g = e - 1; 2 <= g; --g)
                    d[h + g] = c[h + g];
            return d
        }
    }
    function Be(b) {
        var c;
        if (b instanceof ye)
            c = b;
        else if (ia(b)) {
            if (c = Ce[b],
                !m(c) && "function" == typeof proj4) {
                var d = proj4.defs(b);
                if (m(d)) {
                    c = d.units;
                    !m(c) && m(d.to_meter) && (c = d.to_meter.toString(),
                        xe[c] = d.to_meter);
                    c = new ye({
                        code: b,
                        units: c,
                        axisOrientation: d.axis
                    });
                    Ne(c);
                    var e, f, g;
                    for (e in Ce)
                        f = proj4.defs(e),
                            m(f) && (g = Be(e),
                                f === d ? Ee([g, c]) : (f = proj4(e, b),
                                    Pe(g, c, f.forward, f.inverse)))
                } else
                    c = null
            }
        } else
            c = null;
        return c
    }
    function Re(b, c) {
        return b === c ? !0 : b.d != c.d ? !1 : Ae(b, c) === He
    }
    function Se(b, c) {
        var d = Be(b)
            , e = Be(c);
        return Ae(d, e)
    }
    function Ae(b, c) {
        var d = b.a, e = c.a, f;
        d in De && e in De[d] && (f = De[d][e]);
        m(f) || (f = Te);
        return f
    }
    function Te(b, c) {
        if (m(c) && b !== c) {
            for (var d = 0, e = b.length; d < e; ++d)
                c[d] = b[d];
            b = c
        }
        return b
    }
    function He(b, c) {
        var d;
        if (m(c)) {
            d = 0;
            for (var e = b.length; d < e; ++d)
                c[d] = b[d];
            d = c
        } else
            d = b.slice();
        return d
    }
    function Ue(b, c, d) {
        c = Se(c, d);
        return se(b, c)
    }
    ; function B(b) {
        od.call(this);
        b = m(b) ? b : {};
        this.l = [0, 0];
        var c = {};
        c.center = m(b.center) ? b.center : null;
        this.q = Oe(b.projection);
        var d, e, f, g = m(b.minZoom) ? b.minZoom : 0;
        d = m(b.maxZoom) ? b.maxZoom : 28;
        var h = m(b.zoomFactor) ? b.zoomFactor : 2;
        if (m(b.resolutions))
            d = b.resolutions,
                e = d[0],
                f = d[d.length - 1],
                d = ac(d);
        else {
            e = Oe(b.projection);
            f = e.D();
            var k = (null === f ? 360 * xe.degrees / xe[e.d] : Math.max(pe(f), me(f))) / 256 / Math.pow(2, 0)
                , n = k / Math.pow(2, 28);
            e = b.maxResolution;
            m(e) ? g = 0 : e = k / Math.pow(h, g);
            f = b.minResolution;
            m(f) || (f = m(b.maxZoom) ? m(b.maxResolution) ? e / Math.pow(h, d) : k / Math.pow(h, d) : n);
            d = g + Math.floor(Math.log(e / f) / Math.log(h));
            f = e / Math.pow(h, d - g);
            d = bc(h, e, d - g)
        }
        this.e = e;
        this.F = f;
        this.p = g;
        g = m(b.extent) ? Yb(b.extent) : Zb;
        (m(b.enableRotation) ? b.enableRotation : 1) ? (e = b.constrainRotation,
            e = m(e) && !0 !== e ? !1 === e ? dc : ja(e) ? ec(e) : dc : fc()) : e = cc;
        this.s = new gc(g, d, e);
        m(b.resolution) ? c.resolution = b.resolution : m(b.zoom) && (c.resolution = this.constrainResolution(this.e, b.zoom - this.p));
        c.rotation = m(b.rotation) ? b.rotation : 0;
        this.G(c)
    }
    v(B, od);
    B.prototype.i = function (b) {
        return this.s.center(b)
    }
        ;
    B.prototype.constrainResolution = function (b, c, d) {
        return this.s.resolution(b, c || 0, d || 0)
    }
        ;
    B.prototype.constrainRotation = function (b, c) {
        return this.s.rotation(b, c || 0)
    }
        ;
    B.prototype.b = function () {
        return this.get("center")
    }
        ;
    B.prototype.getCenter = B.prototype.b;
    B.prototype.g = function (b) {
        var c = this.b()
            , d = this.a();
        return [c[0] - d * b[0] / 2, c[1] - d * b[1] / 2, c[0] + d * b[0] / 2, c[1] + d * b[1] / 2]
    }
        ;
    B.prototype.H = function () {
        return this.q
    }
        ;
    B.prototype.a = function () {
        return this.get("resolution")
    }
        ;
    B.prototype.getResolution = B.prototype.a;
    B.prototype.n = function (b, c) {
        return Math.max(pe(b) / c[0], me(b) / c[1])
    }
        ;
    function Ve(b) {
        var c = b.e
            , d = Math.log(c / b.F) / Math.log(2);
        return function (b) {
            return c / Math.pow(2, b * d)
        }
    }
    B.prototype.c = function () {
        return this.get("rotation")
    }
        ;
    B.prototype.getRotation = B.prototype.c;
    function We(b) {
        var c = b.e
            , d = Math.log(c / b.F) / Math.log(2);
        return function (b) {
            return Math.log(c / b) / Math.log(2) / d
        }
    }
    function Xe(b) {
        var c = b.b()
            , d = b.q
            , e = b.a();
        b = b.c();
        return {
            center: c.slice(),
            projection: m(d) ? d : null,
            resolution: e,
            rotation: b
        }
    }
    l = B.prototype;
    l.Xh = function () {
        var b, c = this.a();
        if (m(c)) {
            var d, e = 0;
            do {
                d = this.constrainResolution(this.e, e);
                if (d == c) {
                    b = e;
                    break
                }
                ++e
            } while (d > this.F)
        }
        return m(b) ? this.p + b : b
    }
        ;
    l.me = function (b, c) {
        if (!qe(b)) {
            this.Ra(ie(b));
            var d = this.n(b, c)
                , e = this.constrainResolution(d, 0, 0);
            e < d && (e = this.constrainResolution(e, -1, 0));
            this.f(e)
        }
    }
        ;
    l.mh = function (b, c, d) {
        var e = m(d) ? d : {};
        d = m(e.padding) ? e.padding : [0, 0, 0, 0];
        var f = m(e.constrainResolution) ? e.constrainResolution : !0, g = m(e.nearest) ? e.nearest : !1, h;
        m(e.minResolution) ? h = e.minResolution : m(e.maxZoom) ? h = this.constrainResolution(this.e, e.maxZoom - this.p, 0) : h = 0;
        var k = b.k
            , n = this.c()
            , e = Math.cos(-n)
            , n = Math.sin(-n)
            , p = Infinity
            , q = Infinity
            , r = -Infinity
            , s = -Infinity;
        b = b.t;
        for (var u = 0, y = k.length; u < y; u += b)
            var A = k[u] * e - k[u + 1] * n
                , z = k[u] * n + k[u + 1] * e
                , p = Math.min(p, A)
                , q = Math.min(q, z)
                , r = Math.max(r, A)
                , s = Math.max(s, z);
        c = this.n([p, q, r, s], [c[0] - d[1] - d[3], c[1] - d[0] - d[2]]);
        c = isNaN(c) ? h : Math.max(c, h);
        f && (h = this.constrainResolution(c, 0, 0),
            !g && h < c && (h = this.constrainResolution(h, -1, 0)),
            c = h);
        this.f(c);
        n = -n;
        g = (p + r) / 2 + (d[1] - d[3]) / 2 * c;
        d = (q + s) / 2 + (d[0] - d[2]) / 2 * c;
        this.Ra([g * e - d * n, d * e + g * n])
    }
        ;
    l.hh = function (b, c, d) {
        var e = this.c()
            , f = Math.cos(-e)
            , e = Math.sin(-e)
            , g = b[0] * f - b[1] * e;
        b = b[1] * f + b[0] * e;
        var h = this.a()
            , g = g + (c[0] / 2 - d[0]) * h;
        b += (d[1] - c[1] / 2) * h;
        e = -e;
        this.Ra([g * f - b * e, b * f + g * e])
    }
        ;
    function Ye(b) {
        return null != b.b() && m(b.a())
    }
    l.rotate = function (b, c) {
        if (m(c)) {
            var d, e = this.b();
            m(e) && (d = [e[0] - c[0], e[1] - c[1]],
                zd(d, b - this.c()),
                ud(d, c));
            this.Ra(d)
        }
        this.r(b)
    }
        ;
    l.Ra = function (b) {
        this.set("center", b)
    }
        ;
    B.prototype.setCenter = B.prototype.Ra;
    function Ze(b, c) {
        b.l[1] += c
    }
    B.prototype.f = function (b) {
        this.set("resolution", b)
    }
        ;
    B.prototype.setResolution = B.prototype.f;
    B.prototype.r = function (b) {
        this.set("rotation", b)
    }
        ;
    B.prototype.setRotation = B.prototype.r;
    B.prototype.S = function (b) {
        b = this.constrainResolution(this.e, b - this.p, 0);
        this.f(b)
    }
        ;
    function $e(b) {
        return 1 - Math.pow(1 - b, 3)
    }
    ; function af(b) {
        return 3 * b * b - 2 * b * b * b
    }
    function bf(b) {
        return b
    }
    function cf(b) {
        return .5 > b ? af(2 * b) : 1 - af(2 * (b - .5))
    }
    ; function df(b) {
        var c = b.source
            , d = m(b.start) ? b.start : ua()
            , e = c[0]
            , f = c[1]
            , g = m(b.duration) ? b.duration : 1E3
            , h = m(b.easing) ? b.easing : af;
        return function (b, c) {
            if (c.time < d)
                return c.animate = !0,
                    c.viewHints[0] += 1,
                    !0;
            if (c.time < d + g) {
                var p = 1 - h((c.time - d) / g)
                    , q = e - c.viewState.center[0]
                    , r = f - c.viewState.center[1];
                c.animate = !0;
                c.viewState.center[0] += p * q;
                c.viewState.center[1] += p * r;
                c.viewHints[0] += 1;
                return !0
            }
            return !1
        }
    }
    function ef(b) {
        var c = m(b.rotation) ? b.rotation : 0
            , d = m(b.start) ? b.start : ua()
            , e = m(b.duration) ? b.duration : 1E3
            , f = m(b.easing) ? b.easing : af
            , g = m(b.anchor) ? b.anchor : null;
        return function (b, k) {
            if (k.time < d)
                return k.animate = !0,
                    k.viewHints[0] += 1,
                    !0;
            if (k.time < d + e) {
                var n = 1 - f((k.time - d) / e)
                    , n = (c - k.viewState.rotation) * n;
                k.animate = !0;
                k.viewState.rotation += n;
                if (null !== g) {
                    var p = k.viewState.center;
                    p[0] -= g[0];
                    p[1] -= g[1];
                    zd(p, n);
                    ud(p, g)
                }
                k.viewHints[0] += 1;
                return !0
            }
            return !1
        }
    }
    function ff(b) {
        var c = b.resolution
            , d = m(b.start) ? b.start : ua()
            , e = m(b.duration) ? b.duration : 1E3
            , f = m(b.easing) ? b.easing : af;
        return function (b, h) {
            if (h.time < d)
                return h.animate = !0,
                    h.viewHints[0] += 1,
                    !0;
            if (h.time < d + e) {
                var k = 1 - f((h.time - d) / e)
                    , n = c - h.viewState.resolution;
                h.animate = !0;
                h.viewState.resolution += k * n;
                h.viewHints[0] += 1;
                return !0
            }
            return !1
        }
    }
    ; function gf(b, c, d, e) {
        return m(e) ? (e[0] = b,
            e[1] = c,
            e[2] = d,
            e) : [b, c, d]
    }
    function hf(b, c, d) {
        return b + "/" + c + "/" + d
    }
    function jf(b) {
        var c = b[0], d = Array(c), e = 1 << c - 1, f, g;
        for (f = 0; f < c; ++f)
            g = 48,
                b[1] & e && (g += 1),
                b[2] & e && (g += 2),
                d[f] = String.fromCharCode(g),
                e >>= 1;
        return d.join("")
    }
    function kf(b) {
        return hf(b[0], b[1], b[2])
    }
    ; function lf(b, c, d, e) {
        this.a = b;
        this.c = c;
        this.b = d;
        this.d = e
    }
    function mf(b, c, d, e, f) {
        return m(f) ? (f.a = b,
            f.c = c,
            f.b = d,
            f.d = e,
            f) : new lf(b, c, d, e)
    }
    lf.prototype.contains = function (b) {
        return nf(this, b[1], b[2])
    }
        ;
    function of(b, c) {
        return b.a <= c.a && c.c <= b.c && b.b <= c.b && c.d <= b.d
    }
    function nf(b, c, d) {
        return b.a <= c && c <= b.c && b.b <= d && d <= b.d
    }
    function pf(b, c) {
        return b.a == c.a && b.b == c.b && b.c == c.c && b.d == c.d
    }
    ; function qf(b) {
        this.d = b.html;
        this.a = m(b.tileRanges) ? b.tileRanges : null
    }
    qf.prototype.b = function () {
        return this.d
    }
        ;
    var rf = !Bb || Bb && 9 <= Pb;
    !Cb && !Bb || Bb && Bb && 9 <= Pb || Cb && Mb("1.9.1");
    Bb && Mb("9");
    zb("area base br col command embed hr img input keygen link meta param source track wbr".split(" "));
    zb("action", "cite", "data", "formaction", "href", "manifest", "poster", "src");
    zb("embed", "iframe", "link", "object", "script", "style", "template");
    function sf(b, c) {
        this.x = m(b) ? b : 0;
        this.y = m(c) ? c : 0
    }
    l = sf.prototype;
    l.clone = function () {
        return new sf(this.x, this.y)
    }
        ;
    l.ceil = function () {
        this.x = Math.ceil(this.x);
        this.y = Math.ceil(this.y);
        return this
    }
        ;
    l.floor = function () {
        this.x = Math.floor(this.x);
        this.y = Math.floor(this.y);
        return this
    }
        ;
    l.round = function () {
        this.x = Math.round(this.x);
        this.y = Math.round(this.y);
        return this
    }
        ;
    l.scale = function (b, c) {
        var d = ja(c) ? c : b;
        this.x *= b;
        this.y *= d;
        return this
    }
        ;
    function tf(b, c) {
        this.width = b;
        this.height = c
    }
    l = tf.prototype;
    l.clone = function () {
        return new tf(this.width, this.height)
    }
        ;
    l.la = function () {
        return !(this.width * this.height)
    }
        ;
    l.ceil = function () {
        this.width = Math.ceil(this.width);
        this.height = Math.ceil(this.height);
        return this
    }
        ;
    l.floor = function () {
        this.width = Math.floor(this.width);
        this.height = Math.floor(this.height);
        return this
    }
        ;
    l.round = function () {
        this.width = Math.round(this.width);
        this.height = Math.round(this.height);
        return this
    }
        ;
    l.scale = function (b, c) {
        var d = ja(c) ? c : b;
        this.width *= b;
        this.height *= d;
        return this
    }
        ;
    function uf(b) {
        return b ? new vf(wf(b)) : ya || (ya = new vf)
    }
    function xf(b) {
        var c = document;
        return ia(b) ? c.getElementById(b) : b
    }
    function yf(b, c) {
        jb(c, function (c, e) {
            "style" == e ? b.style.cssText = c : "class" == e ? b.className = c : "for" == e ? b.htmlFor = c : e in zf ? b.setAttribute(zf[e], c) : 0 == e.lastIndexOf("aria-", 0) || 0 == e.lastIndexOf("data-", 0) ? b.setAttribute(e, c) : b[e] = c
        })
    }
    var zf = {
        cellpadding: "cellPadding",
        cellspacing: "cellSpacing",
        colspan: "colSpan",
        frameborder: "frameBorder",
        height: "height",
        maxlength: "maxLength",
        role: "role",
        rowspan: "rowSpan",
        type: "type",
        usemap: "useMap",
        valign: "vAlign",
        width: "width"
    };
    function Af(b) {
        b = b.document.documentElement;
        return new tf(b.clientWidth, b.clientHeight)
    }
    function Bf(b) {
        var c = Db ? b.body || b.documentElement : b.documentElement;
        b = b.parentWindow || b.defaultView;
        return Bb && Mb("10") && b.pageYOffset != c.scrollTop ? new sf(c.scrollLeft, c.scrollTop) : new sf(b.pageXOffset || c.scrollLeft, b.pageYOffset || c.scrollTop)
    }
    function Cf(b, c, d) {
        var e = arguments
            , f = document
            , g = e[0]
            , h = e[1];
        if (!rf && h && (h.name || h.type)) {
            g = ["<", g];
            h.name && g.push(' name="', Ba(h.name), '"');
            if (h.type) {
                g.push(' type="', Ba(h.type), '"');
                var k = {};
                yb(k, h);
                delete k.type;
                h = k
            }
            g.push(">");
            g = g.join("")
        }
        g = f.createElement(g);
        h && (ia(h) ? g.className = h : ga(h) ? g.className = h.join(" ") : yf(g, h));
        2 < e.length && Df(f, g, e, 2);
        return g
    }
    function Df(b, c, d, e) {
        function f(d) {
            d && c.appendChild(ia(d) ? b.createTextNode(d) : d)
        }
        for (; e < d.length; e++) {
            var g = d[e];
            !ha(g) || la(g) && 0 < g.nodeType ? f(g) : Oa(Ff(g) ? Ya(g) : g, f)
        }
    }
    function Gf(b) {
        return document.createElement(b)
    }
    function Hf(b, c) {
        Df(wf(b), b, arguments, 1)
    }
    function If(b) {
        for (var c; c = b.firstChild;)
            b.removeChild(c)
    }
    function Jf(b, c) {
        c.parentNode && c.parentNode.insertBefore(b, c.nextSibling)
    }
    function Kf(b, c, d) {
        b.insertBefore(c, b.childNodes[d] || null)
    }
    function Lf(b) {
        b && b.parentNode && b.parentNode.removeChild(b)
    }
    function Mf(b, c) {
        var d = c.parentNode;
        d && d.replaceChild(b, c)
    }
    function Nf(b) {
        if (void 0 != b.firstElementChild)
            b = b.firstElementChild;
        else
            for (b = b.firstChild; b && 1 != b.nodeType;)
                b = b.nextSibling;
        return b
    }
    function Of(b, c) {
        if (b.contains && 1 == c.nodeType)
            return b == c || b.contains(c);
        if ("undefined" != typeof b.compareDocumentPosition)
            return b == c || Boolean(b.compareDocumentPosition(c) & 16);
        for (; c && b != c;)
            c = c.parentNode;
        return c == b
    }
    function wf(b) {
        return 9 == b.nodeType ? b : b.ownerDocument || b.document
    }
    function Ff(b) {
        if (b && "number" == typeof b.length) {
            if (la(b))
                return "function" == typeof b.item || "string" == typeof b.item;
            if (ka(b))
                return "function" == typeof b.item
        }
        return !1
    }
    function vf(b) {
        this.a = b || ba.document || document
    }
    vf.prototype.appendChild = function (b, c) {
        b.appendChild(c)
    }
        ;
    vf.prototype.contains = Of;
    function Pf(b, c) {
        var d = Gf("CANVAS");
        m(b) && (d.width = b);
        m(c) && (d.height = c);
        return d.getContext("2d")
    }
    var Qf = function () {
        var b;
        return function () {
            if (!m(b))
                if (ba.getComputedStyle) {
                    var c = Gf("P"), d, e = {
                        webkitTransform: "-webkit-transform",
                        OTransform: "-o-transform",
                        msTransform: "-ms-transform",
                        MozTransform: "-moz-transform",
                        transform: "transform"
                    };
                    document.body.appendChild(c);
                    for (var f in e)
                        f in c.style && (c.style[f] = "translate(1px,1px)",
                            d = ba.getComputedStyle(c).getPropertyValue(e[f]));
                    Lf(c);
                    b = d && "none" !== d
                } else
                    b = !1;
            return b
        }
    }()
        , Rf = function () {
            var b;
            return function () {
                if (!m(b))
                    if (ba.getComputedStyle) {
                        var c = Gf("P"), d, e = {
                            webkitTransform: "-webkit-transform",
                            OTransform: "-o-transform",
                            msTransform: "-ms-transform",
                            MozTransform: "-moz-transform",
                            transform: "transform"
                        };
                        document.body.appendChild(c);
                        for (var f in e)
                            f in c.style && (c.style[f] = "translate3d(1px,1px,1px)",
                                d = ba.getComputedStyle(c).getPropertyValue(e[f]));
                        Lf(c);
                        b = d && "none" !== d
                    } else
                        b = !1;
                return b
            }
        }();
    function Sf(b, c) {
        var d = b.style;
        d.WebkitTransform = c;
        d.MozTransform = c;
        d.a = c;
        d.msTransform = c;
        d.transform = c;
        Bb && !Rb && (b.style.transformOrigin = "0 0")
    }
    function Tf(b, c) {
        var d;
        if (Rf()) {
            if (m(6)) {
                var e = Array(16);
                for (d = 0; 16 > d; ++d)
                    e[d] = c[d].toFixed(6);
                d = e.join(",")
            } else
                d = c.join(",");
            Sf(b, "matrix3d(" + d + ")")
        } else if (Qf()) {
            e = [c[0], c[1], c[4], c[5], c[12], c[13]];
            if (m(6)) {
                var f = Array(6);
                for (d = 0; 6 > d; ++d)
                    f[d] = e[d].toFixed(6);
                d = f.join(",")
            } else
                d = e.join(",");
            Sf(b, "matrix(" + d + ")")
        } else
            b.style.left = Math.round(c[12]) + "px",
                b.style.top = Math.round(c[13]) + "px"
    }
    ; var Uf = ["experimental-webgl", "webgl", "webkit-3d", "moz-webgl"];
    function Vf(b, c) {
        var d, e, f = Uf.length;
        for (e = 0; e < f; ++e)
            try {
                if (d = b.getContext(Uf[e], c),
                    null !== d)
                    return d
            } catch (g) { }
        return null
    }
    ; var Wf, Xf = ba.devicePixelRatio || 1, Yf = "ArrayBuffer" in ba, Zf = !1, $f = function () {
        if (!("HTMLCanvasElement" in ba))
            return !1;
        try {
            var b = Pf();
            if (null === b)
                return !1;
            m(b.setLineDash) && (Zf = !0);
            return !0
        } catch (c) {
            return !1
        }
    }(), ag = "DeviceOrientationEvent" in ba, bg = "geolocation" in ba.navigator, cg = "ontouchstart" in ba, dg = "PointerEvent" in ba, eg = !!ba.navigator.msPointerEnabled, fg = !1, gg, hg = [];
    if ("WebGLRenderingContext" in ba)
        try {
            var ig = Gf("CANVAS")
                , jg = Vf(ig, {
                    lh: !0
                });
            null !== jg && (fg = !0,
                gg = jg.getParameter(jg.MAX_TEXTURE_SIZE),
                hg = jg.getSupportedExtensions())
        } catch (kg) { }
    Wf = fg;
    wa = hg;
    va = gg;
    function lg(b, c, d) {
        pc.call(this, b, d);
        this.element = c
    }
    v(lg, pc);
    function C(b) {
        od.call(this);
        this.a = m(b) ? b : [];
        mg(this)
    }
    v(C, od);
    l = C.prototype;
    l.clear = function () {
        for (; 0 < this.Ib();)
            this.pop()
    }
        ;
    l.we = function (b) {
        var c, d;
        c = 0;
        for (d = b.length; c < d; ++c)
            this.push(b[c]);
        return this
    }
        ;
    l.forEach = function (b, c) {
        Oa(this.a, b, c)
    }
        ;
    l.Wi = function () {
        return this.a
    }
        ;
    l.item = function (b) {
        return this.a[b]
    }
        ;
    l.Ib = function () {
        return this.get("length")
    }
        ;
    l.td = function (b, c) {
        $a(this.a, b, 0, c);
        mg(this);
        this.dispatchEvent(new lg("add", c, this))
    }
        ;
    l.pop = function () {
        return this.Ke(this.Ib() - 1)
    }
        ;
    l.push = function (b) {
        var c = this.a.length;
        this.td(c, b);
        return c
    }
        ;
    l.remove = function (b) {
        var c = this.a, d, e;
        d = 0;
        for (e = c.length; d < e; ++d)
            if (c[d] === b)
                return this.Ke(d)
    }
        ;
    l.Ke = function (b) {
        var c = this.a[b];
        Na.splice.call(this.a, b, 1);
        mg(this);
        this.dispatchEvent(new lg("remove", c, this));
        return c
    }
        ;
    l.wl = function (b, c) {
        var d = this.Ib();
        if (b < d)
            d = this.a[b],
                this.a[b] = c,
                this.dispatchEvent(new lg("remove", d, this)),
                this.dispatchEvent(new lg("add", c, this));
        else {
            for (; d < b; ++d)
                this.td(d, void 0);
            this.td(b, c)
        }
    }
        ;
    function mg(b) {
        b.set("length", b.a.length)
    }
    ; var ng = /^#(?:[0-9a-f]{3}){1,2}$/i
        , og = /^(?:rgb)?\((0|[1-9]\d{0,2}),\s?(0|[1-9]\d{0,2}),\s?(0|[1-9]\d{0,2})\)$/i
        , pg = /^(?:rgba)?\((0|[1-9]\d{0,2}),\s?(0|[1-9]\d{0,2}),\s?(0|[1-9]\d{0,2}),\s?(0|1|0\.\d{0,10})\)$/i;
    function qg(b) {
        return ga(b) ? b : rg(b)
    }
    function sg(b) {
        if (!ia(b)) {
            var c = b[0];
            c != (c | 0) && (c = c + .5 | 0);
            var d = b[1];
            d != (d | 0) && (d = d + .5 | 0);
            var e = b[2];
            e != (e | 0) && (e = e + .5 | 0);
            b = "rgba(" + c + "," + d + "," + e + "," + b[3] + ")"
        }
        return b
    }
    var rg = function () {
        var b = {}
            , c = 0;
        return function (d) {
            var e;
            if (b.hasOwnProperty(d))
                e = b[d];
            else {
                if (1024 <= c) {
                    e = 0;
                    for (var f in b)
                        0 === (e++ & 3) && (delete b[f],
                            --c)
                }
                var g, h;
                ng.exec(d) ? (h = 3 == d.length - 1 ? 1 : 2,
                    e = parseInt(d.substr(1 + 0 * h, h), 16),
                    f = parseInt(d.substr(1 + 1 * h, h), 16),
                    g = parseInt(d.substr(1 + 2 * h, h), 16),
                    1 == h && (e = (e << 4) + e,
                        f = (f << 4) + f,
                        g = (g << 4) + g),
                    e = [e, f, g, 1]) : (h = pg.exec(d)) ? (e = Number(h[1]),
                        f = Number(h[2]),
                        g = Number(h[3]),
                        h = Number(h[4]),
                        e = [e, f, g, h],
                        e = tg(e, e)) : (h = og.exec(d)) ? (e = Number(h[1]),
                            f = Number(h[2]),
                            g = Number(h[3]),
                            e = [e, f, g, 1],
                            e = tg(e, e)) : e = void 0;
                b[d] = e;
                ++c
            }
            return e
        }
    }();
    function tg(b, c) {
        var d = m(c) ? c : [];
        d[0] = Ub(b[0] + .5 | 0, 0, 255);
        d[1] = Ub(b[1] + .5 | 0, 0, 255);
        d[2] = Ub(b[2] + .5 | 0, 0, 255);
        d[3] = Ub(b[3], 0, 1);
        return d
    }
    ; function ug() {
        this.g = Gd();
        this.d = void 0;
        this.a = Gd();
        this.c = void 0;
        this.b = Gd();
        this.e = void 0;
        this.f = Gd();
        this.i = void 0;
        this.j = Gd()
    }
    function vg(b, c, d, e, f) {
        var g = !1;
        m(c) && c !== b.d && (g = b.a,
            Kd(g),
            g[12] = c,
            g[13] = c,
            g[14] = c,
            g[15] = 1,
            b.d = c,
            g = !0);
        if (m(d) && d !== b.c) {
            g = b.b;
            Kd(g);
            g[0] = d;
            g[5] = d;
            g[10] = d;
            g[15] = 1;
            var h = -.5 * d + .5;
            g[12] = h;
            g[13] = h;
            g[14] = h;
            g[15] = 1;
            b.c = d;
            g = !0
        }
        m(e) && e !== b.e && (g = Math.cos(e),
            h = Math.sin(e),
            Hd(b.f, .213 + .787 * g - .213 * h, .213 - .213 * g + .143 * h, .213 - .213 * g - .787 * h, 0, .715 - .715 * g - .715 * h, .715 + .285 * g + .14 * h, .715 - .715 * g + .715 * h, 0, .072 - .072 * g + .928 * h, .072 - .072 * g - .283 * h, .072 + .928 * g + .072 * h, 0, 0, 0, 0, 1),
            b.e = e,
            g = !0);
        m(f) && f !== b.i && (Hd(b.j, .213 + .787 * f, .213 - .213 * f, .213 - .213 * f, 0, .715 - .715 * f, .715 + .285 * f, .715 - .715 * f, 0, .072 - .072 * f, .072 - .072 * f, .072 + .928 * f, 0, 0, 0, 0, 1),
            b.i = f,
            g = !0);
        g && (g = b.g,
            Kd(g),
            m(d) && Ld(g, b.b, g),
            m(c) && Ld(g, b.a, g),
            m(f) && Ld(g, b.j, g),
            m(e) && Ld(g, b.f, g));
        return b.g
    }
    ; function wg(b) {
        if (b.classList)
            return b.classList;
        b = b.className;
        return ia(b) && b.match(/\S+/g) || []
    }
    function xg(b, c) {
        return b.classList ? b.classList.contains(c) : Va(wg(b), c)
    }
    function yg(b, c) {
        b.classList ? b.classList.add(c) : xg(b, c) || (b.className += 0 < b.className.length ? " " + c : c)
    }
    function zg(b, c) {
        b.classList ? b.classList.remove(c) : xg(b, c) && (b.className = Pa(wg(b), function (b) {
            return b != c
        }).join(" "))
    }
    function Ag(b, c) {
        xg(b, c) ? zg(b, c) : yg(b, c)
    }
    ; function Bg(b, c, d, e) {
        this.top = b;
        this.right = c;
        this.bottom = d;
        this.left = e
    }
    l = Bg.prototype;
    l.clone = function () {
        return new Bg(this.top, this.right, this.bottom, this.left)
    }
        ;
    l.contains = function (b) {
        return this && b ? b instanceof Bg ? b.left >= this.left && b.right <= this.right && b.top >= this.top && b.bottom <= this.bottom : b.x >= this.left && b.x <= this.right && b.y >= this.top && b.y <= this.bottom : !1
    }
        ;
    l.ceil = function () {
        this.top = Math.ceil(this.top);
        this.right = Math.ceil(this.right);
        this.bottom = Math.ceil(this.bottom);
        this.left = Math.ceil(this.left);
        return this
    }
        ;
    l.floor = function () {
        this.top = Math.floor(this.top);
        this.right = Math.floor(this.right);
        this.bottom = Math.floor(this.bottom);
        this.left = Math.floor(this.left);
        return this
    }
        ;
    l.round = function () {
        this.top = Math.round(this.top);
        this.right = Math.round(this.right);
        this.bottom = Math.round(this.bottom);
        this.left = Math.round(this.left);
        return this
    }
        ;
    l.scale = function (b, c) {
        var d = ja(c) ? c : b;
        this.left *= b;
        this.right *= b;
        this.top *= d;
        this.bottom *= d;
        return this
    }
        ;
    function Cg(b, c, d, e) {
        this.left = b;
        this.top = c;
        this.width = d;
        this.height = e
    }
    l = Cg.prototype;
    l.clone = function () {
        return new Cg(this.left, this.top, this.width, this.height)
    }
        ;
    l.contains = function (b) {
        return b instanceof Cg ? this.left <= b.left && this.left + this.width >= b.left + b.width && this.top <= b.top && this.top + this.height >= b.top + b.height : b.x >= this.left && b.x <= this.left + this.width && b.y >= this.top && b.y <= this.top + this.height
    }
        ;
    function Dg(b, c) {
        var d = c.x < b.left ? b.left - c.x : Math.max(c.x - (b.left + b.width), 0)
            , e = c.y < b.top ? b.top - c.y : Math.max(c.y - (b.top + b.height), 0);
        return d * d + e * e
    }
    l.distance = function (b) {
        return Math.sqrt(Dg(this, b))
    }
        ;
    l.ceil = function () {
        this.left = Math.ceil(this.left);
        this.top = Math.ceil(this.top);
        this.width = Math.ceil(this.width);
        this.height = Math.ceil(this.height);
        return this
    }
        ;
    l.floor = function () {
        this.left = Math.floor(this.left);
        this.top = Math.floor(this.top);
        this.width = Math.floor(this.width);
        this.height = Math.floor(this.height);
        return this
    }
        ;
    l.round = function () {
        this.left = Math.round(this.left);
        this.top = Math.round(this.top);
        this.width = Math.round(this.width);
        this.height = Math.round(this.height);
        return this
    }
        ;
    l.scale = function (b, c) {
        var d = ja(c) ? c : b;
        this.left *= b;
        this.width *= b;
        this.top *= d;
        this.height *= d;
        return this
    }
        ;
    function Eg(b, c) {
        var d = wf(b);
        return d.defaultView && d.defaultView.getComputedStyle && (d = d.defaultView.getComputedStyle(b, null)) ? d[c] || d.getPropertyValue(c) || "" : ""
    }
    function Fg(b, c) {
        return Eg(b, c) || (b.currentStyle ? b.currentStyle[c] : null) || b.style && b.style[c]
    }
    function Gg(b, c, d) {
        var e;
        c instanceof sf ? (e = c.x,
            c = c.y) : (e = c,
                c = d);
        b.style.left = Hg(e);
        b.style.top = Hg(c)
    }
    function Ig(b) {
        var c;
        try {
            c = b.getBoundingClientRect()
        } catch (d) {
            return {
                left: 0,
                top: 0,
                right: 0,
                bottom: 0
            }
        }
        Bb && b.ownerDocument.body && (b = b.ownerDocument,
            c.left -= b.documentElement.clientLeft + b.body.clientLeft,
            c.top -= b.documentElement.clientTop + b.body.clientTop);
        return c
    }
    function Jg(b) {
        if (1 == b.nodeType)
            return b = Ig(b),
                new sf(b.left, b.top);
        var c = ka(b.oh)
            , d = b;
        b.targetTouches && b.targetTouches.length ? d = b.targetTouches[0] : c && b.a.targetTouches && b.a.targetTouches.length && (d = b.a.targetTouches[0]);
        return new sf(d.clientX, d.clientY)
    }
    function Hg(b) {
        "number" == typeof b && (b = b + "px");
        return b
    }
    function Kg(b) {
        var c = Lg;
        if ("none" != Fg(b, "display"))
            return c(b);
        var d = b.style
            , e = d.display
            , f = d.visibility
            , g = d.position;
        d.visibility = "hidden";
        d.position = "absolute";
        d.display = "inline";
        b = c(b);
        d.display = e;
        d.position = g;
        d.visibility = f;
        return b
    }
    function Lg(b) {
        var c = b.offsetWidth
            , d = b.offsetHeight
            , e = Db && !c && !d;
        return m(c) && !e || !b.getBoundingClientRect ? new tf(c, d) : (b = Ig(b),
            new tf(b.right - b.left, b.bottom - b.top))
    }
    function Mg(b, c) {
        b.style.display = c ? "" : "none"
    }
    function Ng(b, c, d, e) {
        if (/^\d+px?$/.test(c))
            return parseInt(c, 10);
        var f = b.style[d]
            , g = b.runtimeStyle[d];
        b.runtimeStyle[d] = b.currentStyle[d];
        b.style[d] = c;
        c = b.style[e];
        b.style[d] = f;
        b.runtimeStyle[d] = g;
        return c
    }
    function Og(b, c) {
        var d = b.currentStyle ? b.currentStyle[c] : null;
        return d ? Ng(b, d, "left", "pixelLeft") : 0
    }
    function Pg(b, c) {
        if (Bb) {
            var d = Og(b, c + "Left")
                , e = Og(b, c + "Right")
                , f = Og(b, c + "Top")
                , g = Og(b, c + "Bottom");
            return new Bg(f, e, g, d)
        }
        d = Eg(b, c + "Left");
        e = Eg(b, c + "Right");
        f = Eg(b, c + "Top");
        g = Eg(b, c + "Bottom");
        return new Bg(parseFloat(f), parseFloat(e), parseFloat(g), parseFloat(d))
    }
    var Qg = {
        thin: 2,
        medium: 4,
        thick: 6
    };
    function Rg(b, c) {
        if ("none" == (b.currentStyle ? b.currentStyle[c + "Style"] : null))
            return 0;
        var d = b.currentStyle ? b.currentStyle[c + "Width"] : null;
        return d in Qg ? Qg[d] : Ng(b, d, "left", "pixelLeft")
    }
    function Sg(b) {
        if (Bb && !(Bb && 9 <= Pb)) {
            var c = Rg(b, "borderLeft")
                , d = Rg(b, "borderRight")
                , e = Rg(b, "borderTop");
            b = Rg(b, "borderBottom");
            return new Bg(e, d, b, c)
        }
        c = Eg(b, "borderLeftWidth");
        d = Eg(b, "borderRightWidth");
        e = Eg(b, "borderTopWidth");
        b = Eg(b, "borderBottomWidth");
        return new Bg(parseFloat(e), parseFloat(d), parseFloat(b), parseFloat(c))
    }
    ; function Tg(b, c, d) {
        pc.call(this, b);
        this.map = c;
        this.frameState = m(d) ? d : null
    }
    v(Tg, pc);
    function Ug(b) {
        od.call(this);
        this.element = m(b.element) ? b.element : null;
        this.a = this.i = null;
        this.l = [];
        this.render = m(b.render) ? b.render : ca;
        m(b.target) && this.b(b.target)
    }
    v(Ug, od);
    Ug.prototype.M = function () {
        Lf(this.element);
        Ug.R.M.call(this)
    }
        ;
    Ug.prototype.f = function () {
        return this.a
    }
        ;
    Ug.prototype.setMap = function (b) {
        null === this.a || Lf(this.element);
        0 != this.l.length && (Oa(this.l, Tc),
            this.l.length = 0);
        this.a = b;
        null !== this.a && ((null === this.i ? b.F : this.i).appendChild(this.element),
            this.render !== ca && this.l.push(w(b, "postrender", this.render, !1, this)),
            b.render())
    }
        ;
    Ug.prototype.b = function (b) {
        this.i = xf(b)
    }
        ;
    function Vg(b) {
        b = m(b) ? b : {};
        this.r = Gf("UL");
        this.p = Gf("LI");
        this.r.appendChild(this.p);
        Mg(this.p, !1);
        this.c = m(b.collapsed) ? b.collapsed : !0;
        this.g = m(b.collapsible) ? b.collapsible : !0;
        this.g || (this.c = !1);
        var c = m(b.className) ? b.className : "ol-attribution"
            , d = m(b.tipLabel) ? b.tipLabel : "Attributions"
            , e = m(b.collapseLabel) ? b.collapseLabel : "\u00bb";
        this.s = ia(e) ? Cf("SPAN", {}, e) : e;
        e = m(b.label) ? b.label : "i";
        this.F = ia(e) ? Cf("SPAN", {}, e) : e;
        d = Cf("BUTTON", {
            type: "button",
            title: d
        }, this.g && !this.c ? this.s : this.F);
        w(d, "click", this.oj, !1, this);
        w(d, ["mouseout", sc], function () {
            this.blur()
        }, !1);
        c = Cf("DIV", c + " ol-unselectable ol-control" + (this.c && this.g ? " ol-collapsed" : "") + (this.g ? "" : " ol-uncollapsible"), this.r, d);
        Ug.call(this, {
            element: c,
            render: m(b.render) ? b.render : Wg,
            target: b.target
        });
        this.q = !0;
        this.n = {};
        this.e = {};
        this.H = {}
    }
    v(Vg, Ug);
    function Wg(b) {
        b = b.frameState;
        if (null === b)
            this.q && (Mg(this.element, !1),
                this.q = !1);
        else {
            var c, d, e, f, g, h, k, n, p, q = b.layerStatesArray, r = wb(b.attributions), s = {};
            d = 0;
            for (c = q.length; d < c; d++)
                if (e = q[d].layer.a(),
                    null !== e && (p = ma(e).toString(),
                        n = e.f,
                        null !== n))
                    for (e = 0,
                        f = n.length; e < f; e++)
                        if (h = n[e],
                            k = ma(h).toString(),
                            !(k in r)) {
                            g = b.usedTiles[p];
                            var u;
                            if (u = m(g))
                                a: if (null === h.a)
                                    u = !0;
                                else {
                                    var y = u = void 0
                                        , A = void 0
                                        , z = void 0;
                                    for (z in g)
                                        if (z in h.a)
                                            for (A = g[z],
                                                u = 0,
                                                y = h.a[z].length; u < y; ++u) {
                                                var D = h.a[z][u];
                                                if (D.a <= A.c && D.c >= A.a && D.b <= A.d && D.d >= A.b) {
                                                    u = !0;
                                                    break a
                                                }
                                            }
                                    u = !1
                                }
                            u ? (k in s && delete s[k],
                                r[k] = h) : s[k] = h
                        }
            c = [r, s];
            d = c[0];
            c = c[1];
            for (var x in this.n)
                x in d ? (this.e[x] || (Mg(this.n[x], !0),
                    this.e[x] = !0),
                    delete d[x]) : x in c ? (this.e[x] && (Mg(this.n[x], !1),
                        delete this.e[x]),
                        delete c[x]) : (Lf(this.n[x]),
                            delete this.n[x],
                            delete this.e[x]);
            for (x in d)
                p = Gf("LI"),
                    p.innerHTML = d[x].d,
                    this.r.appendChild(p),
                    this.n[x] = p,
                    this.e[x] = !0;
            for (x in c)
                p = Gf("LI"),
                    p.innerHTML = c[x].d,
                    Mg(p, !1),
                    this.r.appendChild(p),
                    this.n[x] = p;
            x = !rb(this.e) || !rb(b.logos);
            this.q != x && (Mg(this.element, x),
                this.q = x);
            x && rb(this.e) ? yg(this.element, "ol-logo-only") : zg(this.element, "ol-logo-only");
            var T;
            b = b.logos;
            x = this.H;
            for (T in x)
                T in b || (Lf(x[T]),
                    delete x[T]);
            for (var O in b)
                O in x || (T = new Image,
                    T.src = O,
                    d = b[O],
                    "" === d ? d = T : (d = Cf("A", {
                        href: d
                    }),
                        d.appendChild(T)),
                    this.p.appendChild(d),
                    x[O] = d);
            Mg(this.p, !rb(b))
        }
    }
    l = Vg.prototype;
    l.oj = function (b) {
        b.preventDefault();
        Xg(this)
    }
        ;
    function Xg(b) {
        Ag(b.element, "ol-collapsed");
        b.c ? Mf(b.s, b.F) : Mf(b.F, b.s);
        b.c = !b.c
    }
    l.nj = function () {
        return this.g
    }
        ;
    l.qj = function (b) {
        this.g !== b && (this.g = b,
            Ag(this.element, "ol-uncollapsible"),
            !b && this.c && Xg(this))
    }
        ;
    l.pj = function (b) {
        this.g && this.c !== b && Xg(this)
    }
        ;
    l.mj = function () {
        return this.c
    }
        ;
    function Yg(b) {
        b = m(b) ? b : {};
        var c = m(b.className) ? b.className : "ol-rotate"
            , d = m(b.label) ? b.label : "\u21e7";
        this.c = null;
        ia(d) ? this.c = Cf("SPAN", "ol-compass", d) : (this.c = d,
            yg(this.c, "ol-compass"));
        d = Cf("BUTTON", {
            "class": c + "-reset",
            type: "button",
            title: m(b.tipLabel) ? b.tipLabel : "Reset rotation"
        }, this.c);
        w(d, "click", Yg.prototype.p, !1, this);
        w(d, ["mouseout", sc], function () {
            this.blur()
        }, !1);
        c = Cf("DIV", c + " ol-unselectable ol-control", d);
        Ug.call(this, {
            element: c,
            render: m(b.render) ? b.render : Zg,
            target: b.target
        });
        this.g = m(b.duration) ? b.duration : 250;
        this.e = m(b.autoHide) ? b.autoHide : !0;
        this.n = void 0;
        this.e && yg(this.element, "ol-hidden")
    }
    v(Yg, Ug);
    Yg.prototype.p = function (b) {
        b.preventDefault();
        b = this.a;
        var c = b.a();
        if (null !== c) {
            for (var d = c.c(); d < -Math.PI;)
                d += 2 * Math.PI;
            for (; d > Math.PI;)
                d -= 2 * Math.PI;
            m(d) && (0 < this.g && b.Wa(ef({
                rotation: d,
                duration: this.g,
                easing: $e
            })),
                c.r(0))
        }
    }
        ;
    function Zg(b) {
        b = b.frameState;
        if (null !== b) {
            b = b.viewState.rotation;
            if (b != this.n) {
                var c = "rotate(" + 180 * b / Math.PI + "deg)";
                if (this.e) {
                    var d = this.element;
                    0 === b ? yg(d, "ol-hidden") : zg(d, "ol-hidden")
                }
                this.c.style.msTransform = c;
                this.c.style.webkitTransform = c;
                this.c.style.transform = c
            }
            this.n = b
        }
    }
    ; function $g(b) {
        b = m(b) ? b : {};
        var c = m(b.className) ? b.className : "ol-zoom"
            , d = m(b.delta) ? b.delta : 1
            , e = m(b.zoomOutLabel) ? b.zoomOutLabel : "\u2212"
            , f = m(b.zoomOutTipLabel) ? b.zoomOutTipLabel : "Zoom out"
            , g = Cf("BUTTON", {
                "class": c + "-in",
                type: "button",
                title: m(b.zoomInTipLabel) ? b.zoomInTipLabel : "Zoom in"
            }, m(b.zoomInLabel) ? b.zoomInLabel : "+");
        w(g, "click", sa($g.prototype.e, d), !1, this);
        w(g, ["mouseout", sc], function () {
            this.blur()
        }, !1);
        e = Cf("BUTTON", {
            "class": c + "-out",
            type: "button",
            title: f
        }, e);
        w(e, "click", sa($g.prototype.e, -d), !1, this);
        w(e, ["mouseout", sc], function () {
            this.blur()
        }, !1);
        c = Cf("DIV", c + " ol-unselectable ol-control", g, e);
        Ug.call(this, {
            element: c,
            target: b.target
        });
        this.c = m(b.duration) ? b.duration : 250
    }
    v($g, Ug);
    $g.prototype.e = function (b, c) {
        c.preventDefault();
        var d = this.a
            , e = d.a();
        if (null !== e) {
            var f = e.a();
            m(f) && (0 < this.c && d.Wa(ff({
                resolution: f,
                duration: this.c,
                easing: $e
            })),
                d = e.constrainResolution(f, b),
                e.f(d))
        }
    }
        ;
    function ah(b) {
        b = m(b) ? b : {};
        var c = new C;
        (m(b.zoom) ? b.zoom : 1) && c.push(new $g(b.zoomOptions));
        (m(b.rotate) ? b.rotate : 1) && c.push(new Yg(b.rotateOptions));
        (m(b.attribution) ? b.attribution : 1) && c.push(new Vg(b.attributionOptions));
        return c
    }
    ; var bh = Db ? "webkitfullscreenchange" : Cb ? "mozfullscreenchange" : Bb ? "MSFullscreenChange" : "fullscreenchange";
    function ch() {
        var b = uf().a
            , c = b.body;
        return !!(c.webkitRequestFullscreen || c.mozRequestFullScreen && b.mozFullScreenEnabled || c.msRequestFullscreen && b.msFullscreenEnabled || c.requestFullscreen && b.fullscreenEnabled)
    }
    function dh(b) {
        b.webkitRequestFullscreen ? b.webkitRequestFullscreen() : b.mozRequestFullScreen ? b.mozRequestFullScreen() : b.msRequestFullscreen ? b.msRequestFullscreen() : b.requestFullscreen && b.requestFullscreen()
    }
    function eh() {
        var b = uf().a;
        return !!(b.webkitIsFullScreen || b.mozFullScreen || b.msFullscreenElement || b.fullscreenElement)
    }
    ; function fh(b) {
        b = m(b) ? b : {};
        this.e = m(b.className) ? b.className : "ol-full-screen";
        var c = m(b.label) ? b.label : "\u2194";
        this.c = ia(c) ? document.createTextNode(String(c)) : c;
        c = m(b.labelActive) ? b.labelActive : "\u00d7";
        this.g = ia(c) ? document.createTextNode(String(c)) : c;
        c = m(b.tipLabel) ? b.tipLabel : "Toggle full-screen";
        c = Cf("BUTTON", {
            "class": this.e + "-" + eh(),
            type: "button",
            title: c
        }, this.c);
        w(c, "click", this.q, !1, this);
        w(c, ["mouseout", sc], function () {
            this.blur()
        }, !1);
        w(ba.document, bh, this.n, !1, this);
        var d = this.e + " ol-unselectable ol-control " + (ch() ? "" : "ol-unsupported")
            , c = Cf("DIV", d, c);
        Ug.call(this, {
            element: c,
            target: b.target
        });
        this.p = m(b.keys) ? b.keys : !1
    }
    v(fh, Ug);
    fh.prototype.q = function (b) {
        b.preventDefault();
        ch() && (b = this.a,
            null !== b && (eh() ? (b = uf().a,
                b.webkitCancelFullScreen ? b.webkitCancelFullScreen() : b.mozCancelFullScreen ? b.mozCancelFullScreen() : b.msExitFullscreen ? b.msExitFullscreen() : b.exitFullscreen && b.exitFullscreen()) : (b = b.qc(),
                    b = xf(b),
                    this.p ? b.mozRequestFullScreenWithKeys ? b.mozRequestFullScreenWithKeys() : b.webkitRequestFullscreen ? b.webkitRequestFullscreen() : dh(b) : dh(b))))
    }
        ;
    fh.prototype.n = function () {
        var b = this.a;
        eh() ? Mf(this.g, this.c) : Mf(this.c, this.g);
        null === b || b.l()
    }
        ;
    function gh(b) {
        b = m(b) ? b : {};
        var c = Cf("DIV", m(b.className) ? b.className : "ol-mouse-position");
        Ug.call(this, {
            element: c,
            render: m(b.render) ? b.render : hh,
            target: b.target
        });
        w(this, sd("projection"), this.S, !1, this);
        m(b.coordinateFormat) && this.s(b.coordinateFormat);
        m(b.projection) && this.r(Be(b.projection));
        this.U = m(b.undefinedHTML) ? b.undefinedHTML : "";
        this.p = c.innerHTML;
        this.g = this.e = this.c = null
    }
    v(gh, Ug);
    function hh(b) {
        b = b.frameState;
        null === b ? this.c = null : this.c != b.viewState.projection && (this.c = b.viewState.projection,
            this.e = null);
        ih(this, this.g)
    }
    gh.prototype.S = function () {
        this.e = null
    }
        ;
    gh.prototype.n = function () {
        return this.get("coordinateFormat")
    }
        ;
    gh.prototype.getCoordinateFormat = gh.prototype.n;
    gh.prototype.q = function () {
        return this.get("projection")
    }
        ;
    gh.prototype.getProjection = gh.prototype.q;
    gh.prototype.F = function (b) {
        this.g = this.a.cd(b.a);
        ih(this, this.g)
    }
        ;
    gh.prototype.H = function () {
        ih(this, null);
        this.g = null
    }
        ;
    gh.prototype.setMap = function (b) {
        gh.R.setMap.call(this, b);
        null !== b && (b = b.b,
            this.l.push(w(b, "mousemove", this.F, !1, this), w(b, "mouseout", this.H, !1, this)))
    }
        ;
    gh.prototype.s = function (b) {
        this.set("coordinateFormat", b)
    }
        ;
    gh.prototype.setCoordinateFormat = gh.prototype.s;
    gh.prototype.r = function (b) {
        this.set("projection", b)
    }
        ;
    gh.prototype.setProjection = gh.prototype.r;
    function ih(b, c) {
        var d = b.U;
        if (null !== c && null !== b.c) {
            if (null === b.e) {
                var e = b.q();
                b.e = m(e) ? Ae(b.c, e) : Te
            }
            e = b.a.ia(c);
            null !== e && (b.e(e, e),
                d = b.n(),
                d = m(d) ? d(e) : e.toString())
        }
        m(b.p) && d == b.p || (b.element.innerHTML = d,
            b.p = d)
    }
    ; function jh(b, c, d) {
        kc.call(this);
        this.c = b;
        this.b = d;
        this.a = c || window;
        this.d = ra(this.ef, this)
    }
    v(jh, kc);
    l = jh.prototype;
    l.X = null;
    l.Pe = !1;
    l.start = function () {
        kh(this);
        this.Pe = !1;
        var b = lh(this)
            , c = mh(this);
        b && !c && this.a.mozRequestAnimationFrame ? (this.X = w(this.a, "MozBeforePaint", this.d),
            this.a.mozRequestAnimationFrame(null),
            this.Pe = !0) : this.X = b && c ? b.call(this.a, this.d) : this.a.setTimeout(bd(this.d), 20)
    }
        ;
    function kh(b) {
        if (null != b.X) {
            var c = lh(b)
                , d = mh(b);
            c && !d && b.a.mozRequestAnimationFrame ? Tc(b.X) : c && d ? d.call(b.a, b.X) : b.a.clearTimeout(b.X)
        }
        b.X = null
    }
    l.ef = function () {
        this.Pe && this.X && Tc(this.X);
        this.X = null;
        this.c.call(this.b, ua())
    }
        ;
    l.M = function () {
        kh(this);
        jh.R.M.call(this)
    }
        ;
    function lh(b) {
        b = b.a;
        return b.requestAnimationFrame || b.webkitRequestAnimationFrame || b.mozRequestAnimationFrame || b.oRequestAnimationFrame || b.msRequestAnimationFrame || null
    }
    function mh(b) {
        b = b.a;
        return b.cancelAnimationFrame || b.cancelRequestAnimationFrame || b.webkitCancelRequestAnimationFrame || b.mozCancelRequestAnimationFrame || b.oCancelRequestAnimationFrame || b.msCancelRequestAnimationFrame || null
    }
    ; function nh(b) {
        ba.setTimeout(function () {
            throw b;
        }, 0)
    }
    function oh(b, c) {
        var d = b;
        c && (d = ra(b, c));
        d = ph(d);
        !ka(ba.setImmediate) || ba.Window && ba.Window.prototype.setImmediate == ba.setImmediate ? (qh || (qh = rh()),
            qh(d)) : ba.setImmediate(d)
    }
    var qh;
    function rh() {
        var b = ba.MessageChannel;
        "undefined" === typeof b && "undefined" !== typeof window && window.postMessage && window.addEventListener && (b = function () {
            var b = document.createElement("iframe");
            b.style.display = "none";
            b.src = "";
            document.documentElement.appendChild(b);
            var c = b.contentWindow
                , b = c.document;
            b.open();
            b.write("");
            b.close();
            var d = "callImmediate" + Math.random()
                , e = "file:" == c.location.protocol ? "*" : c.location.protocol + "//" + c.location.host
                , b = ra(function (b) {
                    if (("*" == e || b.origin == e) && b.data == d)
                        this.port1.onmessage()
                }, this);
            c.addEventListener("message", b, !1);
            this.port1 = {};
            this.port2 = {
                postMessage: function () {
                    c.postMessage(d, e)
                }
            }
        }
        );
        if ("undefined" !== typeof b && !ib("Trident") && !ib("MSIE")) {
            var c = new b
                , d = {}
                , e = d;
            c.port1.onmessage = function () {
                if (m(d.next)) {
                    d = d.next;
                    var b = d.af;
                    d.af = null;
                    b()
                }
            }
                ;
            return function (b) {
                e.next = {
                    af: b
                };
                e = e.next;
                c.port2.postMessage(0)
            }
        }
        return "undefined" !== typeof document && "onreadystatechange" in document.createElement("script") ? function (b) {
            var c = document.createElement("script");
            c.onreadystatechange = function () {
                c.onreadystatechange = null;
                c.parentNode.removeChild(c);
                c = null;
                b();
                b = null
            }
                ;
            document.documentElement.appendChild(c)
        }
            : function (b) {
                ba.setTimeout(b, 0)
            }
    }
    var ph = ad;
    function sh(b) {
        if ("function" == typeof b.lb)
            return b.lb();
        if (ia(b))
            return b.split("");
        if (ha(b)) {
            for (var c = [], d = b.length, e = 0; e < d; e++)
                c.push(b[e]);
            return c
        }
        return mb(b)
    }
    function th(b, c) {
        if ("function" == typeof b.forEach)
            b.forEach(c, void 0);
        else if (ha(b) || ia(b))
            Oa(b, c, void 0);
        else {
            var d;
            if ("function" == typeof b.J)
                d = b.J();
            else if ("function" != typeof b.lb)
                if (ha(b) || ia(b)) {
                    d = [];
                    for (var e = b.length, f = 0; f < e; f++)
                        d.push(f)
                } else
                    d = nb(b);
            else
                d = void 0;
            for (var e = sh(b), f = e.length, g = 0; g < f; g++)
                c.call(void 0, e[g], d && d[g], b)
        }
    }
    ; function uh(b, c) {
        this.d = {};
        this.a = [];
        this.b = 0;
        var d = arguments.length;
        if (1 < d) {
            if (d % 2)
                throw Error("Uneven number of arguments");
            for (var e = 0; e < d; e += 2)
                this.set(arguments[e], arguments[e + 1])
        } else if (b) {
            b instanceof uh ? (d = b.J(),
                e = b.lb()) : (d = nb(b),
                    e = mb(b));
            for (var f = 0; f < d.length; f++)
                this.set(d[f], e[f])
        }
    }
    l = uh.prototype;
    l.Tb = function () {
        return this.b
    }
        ;
    l.lb = function () {
        vh(this);
        for (var b = [], c = 0; c < this.a.length; c++)
            b.push(this.d[this.a[c]]);
        return b
    }
        ;
    l.J = function () {
        vh(this);
        return this.a.concat()
    }
        ;
    l.la = function () {
        return 0 == this.b
    }
        ;
    l.clear = function () {
        this.d = {};
        this.b = this.a.length = 0
    }
        ;
    l.remove = function (b) {
        return wh(this.d, b) ? (delete this.d[b],
            this.b--,
            this.a.length > 2 * this.b && vh(this),
            !0) : !1
    }
        ;
    function vh(b) {
        if (b.b != b.a.length) {
            for (var c = 0, d = 0; c < b.a.length;) {
                var e = b.a[c];
                wh(b.d, e) && (b.a[d++] = e);
                c++
            }
            b.a.length = d
        }
        if (b.b != b.a.length) {
            for (var f = {}, d = c = 0; c < b.a.length;)
                e = b.a[c],
                    wh(f, e) || (b.a[d++] = e,
                        f[e] = 1),
                    c++;
            b.a.length = d
        }
    }
    l.get = function (b, c) {
        return wh(this.d, b) ? this.d[b] : c
    }
        ;
    l.set = function (b, c) {
        wh(this.d, b) || (this.b++,
            this.a.push(b));
        this.d[b] = c
    }
        ;
    l.forEach = function (b, c) {
        for (var d = this.J(), e = 0; e < d.length; e++) {
            var f = d[e]
                , g = this.get(f);
            b.call(c, g, f, this)
        }
    }
        ;
    l.clone = function () {
        return new uh(this)
    }
        ;
    function wh(b, c) {
        return Object.prototype.hasOwnProperty.call(b, c)
    }
    ; function xh() {
        this.a = ua()
    }
    new xh;
    xh.prototype.set = function (b) {
        this.a = b
    }
        ;
    xh.prototype.get = function () {
        return this.a
    }
        ;
    function yh(b) {
        ed.call(this);
        this.Qc = b || window;
        this.od = w(this.Qc, "resize", this.xi, !1, this);
        this.pd = Af(this.Qc || window)
    }
    v(yh, ed);
    l = yh.prototype;
    l.od = null;
    l.Qc = null;
    l.pd = null;
    l.M = function () {
        yh.R.M.call(this);
        this.od && (Tc(this.od),
            this.od = null);
        this.pd = this.Qc = null
    }
        ;
    l.xi = function () {
        var b = Af(this.Qc || window)
            , c = this.pd;
        b == c || b && c && b.width == c.width && b.height == c.height || (this.pd = b,
            this.dispatchEvent("resize"))
    }
        ;
    function zh(b, c, d, e, f) {
        if (!(Bb || Db && Mb("525")))
            return !0;
        if (Eb && f)
            return Ah(b);
        if (f && !e)
            return !1;
        ja(c) && (c = Bh(c));
        if (!d && (17 == c || 18 == c || Eb && 91 == c))
            return !1;
        if (Db && e && d)
            switch (b) {
                case 220:
                case 219:
                case 221:
                case 192:
                case 186:
                case 189:
                case 187:
                case 188:
                case 190:
                case 191:
                case 192:
                case 222:
                    return !1
            }
        if (Bb && e && c == b)
            return !1;
        switch (b) {
            case 13:
                return !0;
            case 27:
                return !Db
        }
        return Ah(b)
    }
    function Ah(b) {
        if (48 <= b && 57 >= b || 96 <= b && 106 >= b || 65 <= b && 90 >= b || Db && 0 == b)
            return !0;
        switch (b) {
            case 32:
            case 63:
            case 107:
            case 109:
            case 110:
            case 111:
            case 186:
            case 59:
            case 189:
            case 187:
            case 61:
            case 188:
            case 190:
            case 191:
            case 192:
            case 222:
            case 219:
            case 220:
            case 221:
                return !0;
            default:
                return !1
        }
    }
    function Bh(b) {
        if (Cb)
            b = Ch(b);
        else if (Eb && Db)
            a: switch (b) {
                case 93:
                    b = 91;
                    break a
            }
        return b
    }
    function Ch(b) {
        switch (b) {
            case 61:
                return 187;
            case 59:
                return 186;
            case 173:
                return 189;
            case 224:
                return 91;
            case 0:
                return 224;
            default:
                return b
        }
    }
    ; function Dh(b, c) {
        ed.call(this);
        b && Eh(this, b, c)
    }
    v(Dh, ed);
    l = Dh.prototype;
    l.aa = null;
    l.ud = null;
    l.te = null;
    l.vd = null;
    l.Na = -1;
    l.Gb = -1;
    l.ge = !1;
    var Fh = {
        3: 13,
        12: 144,
        63232: 38,
        63233: 40,
        63234: 37,
        63235: 39,
        63236: 112,
        63237: 113,
        63238: 114,
        63239: 115,
        63240: 116,
        63241: 117,
        63242: 118,
        63243: 119,
        63244: 120,
        63245: 121,
        63246: 122,
        63247: 123,
        63248: 44,
        63272: 46,
        63273: 36,
        63275: 35,
        63276: 33,
        63277: 34,
        63289: 144,
        63302: 45
    }
        , Gh = {
            Up: 38,
            Down: 40,
            Left: 37,
            Right: 39,
            Enter: 13,
            F1: 112,
            F2: 113,
            F3: 114,
            F4: 115,
            F5: 116,
            F6: 117,
            F7: 118,
            F8: 119,
            F9: 120,
            F10: 121,
            F11: 122,
            F12: 123,
            "U+007F": 46,
            Home: 36,
            End: 35,
            PageUp: 33,
            PageDown: 34,
            Insert: 45
        }
        , Hh = Bb || Db && Mb("525")
        , Ih = Eb && Cb;
    Dh.prototype.a = function (b) {
        Db && (17 == this.Na && !b.j || 18 == this.Na && !b.d || Eb && 91 == this.Na && !b.n) && (this.Gb = this.Na = -1);
        -1 == this.Na && (b.j && 17 != b.f ? this.Na = 17 : b.d && 18 != b.f ? this.Na = 18 : b.n && 91 != b.f && (this.Na = 91));
        Hh && !zh(b.f, this.Na, b.c, b.j, b.d) ? this.handleEvent(b) : (this.Gb = Bh(b.f),
            Ih && (this.ge = b.d))
    }
        ;
    Dh.prototype.d = function (b) {
        this.Gb = this.Na = -1;
        this.ge = b.d
    }
        ;
    Dh.prototype.handleEvent = function (b) {
        var c = b.a, d, e, f = c.altKey;
        Bb && "keypress" == b.type ? (d = this.Gb,
            e = 13 != d && 27 != d ? c.keyCode : 0) : Db && "keypress" == b.type ? (d = this.Gb,
                e = 0 <= c.charCode && 63232 > c.charCode && Ah(d) ? c.charCode : 0) : Ab ? (d = this.Gb,
                    e = Ah(d) ? c.keyCode : 0) : (d = c.keyCode || this.Gb,
                        e = c.charCode || 0,
                        Ih && (f = this.ge),
                        Eb && 63 == e && 224 == d && (d = 191));
        var g = d = Bh(d)
            , h = c.keyIdentifier;
        d ? 63232 <= d && d in Fh ? g = Fh[d] : 25 == d && b.c && (g = 9) : h && h in Gh && (g = Gh[h]);
        this.Na = g;
        b = new Kh(g, e, 0, c);
        b.d = f;
        this.dispatchEvent(b)
    }
        ;
    function Eh(b, c, d) {
        b.vd && Lh(b);
        b.aa = c;
        b.ud = w(b.aa, "keypress", b, d);
        b.te = w(b.aa, "keydown", b.a, d, b);
        b.vd = w(b.aa, "keyup", b.d, d, b)
    }
    function Lh(b) {
        b.ud && (Tc(b.ud),
            Tc(b.te),
            Tc(b.vd),
            b.ud = null,
            b.te = null,
            b.vd = null);
        b.aa = null;
        b.Na = -1;
        b.Gb = -1
    }
    Dh.prototype.M = function () {
        Dh.R.M.call(this);
        Lh(this)
    }
        ;
    function Kh(b, c, d, e) {
        uc.call(this, e);
        this.type = "key";
        this.f = b;
        this.i = c
    }
    v(Kh, uc);
    function Mh(b, c) {
        ed.call(this);
        var d = this.aa = b;
        (d = la(d) && 1 == d.nodeType ? this.aa : this.aa ? this.aa.body : null) && Fg(d, "direction");
        this.a = w(this.aa, Cb ? "DOMMouseScroll" : "mousewheel", this, c)
    }
    v(Mh, ed);
    Mh.prototype.handleEvent = function (b) {
        var c = 0
            , d = 0
            , e = 0;
        b = b.a;
        if ("mousewheel" == b.type) {
            d = 1;
            if (Bb || Db && (Fb || Mb("532.0")))
                d = 40;
            e = Nh(-b.wheelDelta, d);
            m(b.wheelDeltaX) ? (c = Nh(-b.wheelDeltaX, d),
                d = Nh(-b.wheelDeltaY, d)) : d = e
        } else
            e = b.detail,
                100 < e ? e = 3 : -100 > e && (e = -3),
                m(b.axis) && b.axis === b.HORIZONTAL_AXIS ? c = e : d = e;
        ja(this.d) && Ub(c, -this.d, this.d);
        ja(this.b) && (d = Ub(d, -this.b, this.b));
        c = new Oh(e, b, 0, d);
        this.dispatchEvent(c)
    }
        ;
    function Nh(b, c) {
        return Db && (Eb || Hb) && 0 != b % c ? b : b / c
    }
    Mh.prototype.M = function () {
        Mh.R.M.call(this);
        Tc(this.a);
        this.a = null
    }
        ;
    function Oh(b, c, d, e) {
        uc.call(this, c);
        this.type = "mousewheel";
        this.detail = b;
        this.l = e
    }
    v(Oh, uc);
    function Ph(b, c, d) {
        pc.call(this, b);
        this.a = c;
        b = m(d) ? d : {};
        this.buttons = Qh(b);
        this.pressure = Rh(b, this.buttons);
        this.bubbles = ub(b, "bubbles", !1);
        this.cancelable = ub(b, "cancelable", !1);
        this.view = ub(b, "view", null);
        this.detail = ub(b, "detail", null);
        this.screenX = ub(b, "screenX", 0);
        this.screenY = ub(b, "screenY", 0);
        this.clientX = ub(b, "clientX", 0);
        this.clientY = ub(b, "clientY", 0);
        this.button = ub(b, "button", 0);
        this.relatedTarget = ub(b, "relatedTarget", null);
        this.pointerId = ub(b, "pointerId", 0);
        this.width = ub(b, "width", 0);
        this.height = ub(b, "height", 0);
        this.pointerType = ub(b, "pointerType", "");
        this.isPrimary = ub(b, "isPrimary", !1);
        c.preventDefault && (this.preventDefault = function () {
            c.preventDefault()
        }
        )
    }
    v(Ph, pc);
    function Qh(b) {
        if (b.buttons || Sh)
            b = b.buttons;
        else
            switch (b.which) {
                case 1:
                    b = 1;
                    break;
                case 2:
                    b = 4;
                    break;
                case 3:
                    b = 2;
                    break;
                default:
                    b = 0
            }
        return b
    }
    function Rh(b, c) {
        var d = 0;
        b.pressure ? d = b.pressure : d = c ? .5 : 0;
        return d
    }
    var Sh = !1;
    try {
        Sh = 1 === (new MouseEvent("click", {
            buttons: 1
        })).buttons
    } catch (Th) { }
    ; function Uh(b, c) {
        this.a = b;
        this.f = c
    }
    ; function Vh(b) {
        Uh.call(this, b, {
            mousedown: this.Ii,
            mousemove: this.Ji,
            mouseup: this.Mi,
            mouseover: this.Li,
            mouseout: this.Ki
        });
        this.d = b.d;
        this.b = []
    }
    v(Vh, Uh);
    function Wh(b, c) {
        for (var d = b.b, e = c.clientX, f = c.clientY, g = 0, h = d.length, k; g < h && (k = d[g]); g++) {
            var n = Math.abs(f - k[1]);
            if (25 >= Math.abs(e - k[0]) && 25 >= n)
                return !0
        }
        return !1
    }
    function Xh(b) {
        var c = Yh(b, b.a)
            , d = c.preventDefault;
        c.preventDefault = function () {
            b.preventDefault();
            d()
        }
            ;
        c.pointerId = 1;
        c.isPrimary = !0;
        c.pointerType = "mouse";
        return c
    }
    l = Vh.prototype;
    l.Ii = function (b) {
        if (!Wh(this, b)) {
            (1).toString() in this.d && this.cancel(b);
            var c = Xh(b);
            this.d[(1).toString()] = b;
            Zh(this.a, $h, c, b)
        }
    }
        ;
    l.Ji = function (b) {
        if (!Wh(this, b)) {
            var c = Xh(b);
            Zh(this.a, ai, c, b)
        }
    }
        ;
    l.Mi = function (b) {
        if (!Wh(this, b)) {
            var c = this.d[(1).toString()];
            c && c.button === b.button && (c = Xh(b),
                Zh(this.a, bi, c, b),
                tb(this.d, (1).toString()))
        }
    }
        ;
    l.Li = function (b) {
        if (!Wh(this, b)) {
            var c = Xh(b);
            ci(this.a, c, b)
        }
    }
        ;
    l.Ki = function (b) {
        if (!Wh(this, b)) {
            var c = Xh(b);
            di(this.a, c, b)
        }
    }
        ;
    l.cancel = function (b) {
        var c = Xh(b);
        this.a.cancel(c, b);
        tb(this.d, (1).toString())
    }
        ;
    function ei(b) {
        Uh.call(this, b, {
            MSPointerDown: this.Ri,
            MSPointerMove: this.Si,
            MSPointerUp: this.Vi,
            MSPointerOut: this.Ti,
            MSPointerOver: this.Ui,
            MSPointerCancel: this.Qi,
            MSGotPointerCapture: this.Oi,
            MSLostPointerCapture: this.Pi
        });
        this.d = b.d;
        this.b = ["", "unavailable", "touch", "pen", "mouse"]
    }
    v(ei, Uh);
    function fi(b, c) {
        var d = c;
        ja(c.a.pointerType) && (d = Yh(c, c.a),
            d.pointerType = b.b[c.a.pointerType]);
        return d
    }
    l = ei.prototype;
    l.Ri = function (b) {
        this.d[b.a.pointerId] = b;
        var c = fi(this, b);
        Zh(this.a, $h, c, b)
    }
        ;
    l.Si = function (b) {
        var c = fi(this, b);
        Zh(this.a, ai, c, b)
    }
        ;
    l.Vi = function (b) {
        var c = fi(this, b);
        Zh(this.a, bi, c, b);
        tb(this.d, b.a.pointerId)
    }
        ;
    l.Ti = function (b) {
        var c = fi(this, b);
        di(this.a, c, b)
    }
        ;
    l.Ui = function (b) {
        var c = fi(this, b);
        ci(this.a, c, b)
    }
        ;
    l.Qi = function (b) {
        var c = fi(this, b);
        this.a.cancel(c, b);
        tb(this.d, b.a.pointerId)
    }
        ;
    l.Pi = function (b) {
        this.a.dispatchEvent(new Ph("lostpointercapture", b, b.a))
    }
        ;
    l.Oi = function (b) {
        this.a.dispatchEvent(new Ph("gotpointercapture", b, b.a))
    }
        ;
    function gi(b) {
        Uh.call(this, b, {
            pointerdown: this.Sk,
            pointermove: this.Tk,
            pointerup: this.Wk,
            pointerout: this.Uk,
            pointerover: this.Vk,
            pointercancel: this.Rk,
            gotpointercapture: this.Yh,
            lostpointercapture: this.Hi
        })
    }
    v(gi, Uh);
    l = gi.prototype;
    l.Sk = function (b) {
        hi(this.a, b)
    }
        ;
    l.Tk = function (b) {
        hi(this.a, b)
    }
        ;
    l.Wk = function (b) {
        hi(this.a, b)
    }
        ;
    l.Uk = function (b) {
        hi(this.a, b)
    }
        ;
    l.Vk = function (b) {
        hi(this.a, b)
    }
        ;
    l.Rk = function (b) {
        hi(this.a, b)
    }
        ;
    l.Hi = function (b) {
        hi(this.a, b)
    }
        ;
    l.Yh = function (b) {
        hi(this.a, b)
    }
        ;
    function ii(b, c) {
        Uh.call(this, b, {
            touchstart: this.Ql,
            touchmove: this.Pl,
            touchend: this.Ol,
            touchcancel: this.Nl
        });
        this.d = b.d;
        this.g = c;
        this.b = void 0;
        this.e = 0;
        this.c = void 0
    }
    v(ii, Uh);
    l = ii.prototype;
    l.gg = function () {
        this.e = 0;
        this.c = void 0
    }
        ;
    function ji(b, c, d) {
        c = Yh(c, d);
        c.pointerId = d.identifier + 2;
        c.bubbles = !0;
        c.cancelable = !0;
        c.detail = b.e;
        c.button = 0;
        c.buttons = 1;
        c.width = d.webkitRadiusX || d.radiusX || 0;
        c.height = d.webkitRadiusY || d.radiusY || 0;
        c.pressure = d.webkitForce || d.force || .5;
        c.isPrimary = b.b === d.identifier;
        c.pointerType = "touch";
        c.clientX = d.clientX;
        c.clientY = d.clientY;
        c.screenX = d.screenX;
        c.screenY = d.screenY;
        return c
    }
    function ki(b, c, d) {
        function e() {
            c.preventDefault()
        }
        var f = Array.prototype.slice.call(c.a.changedTouches), g = f.length, h, k;
        for (h = 0; h < g; ++h)
            k = ji(b, c, f[h]),
                k.preventDefault = e,
                d.call(b, c, k)
    }
    l.Ql = function (b) {
        var c = b.a.touches
            , d = nb(this.d)
            , e = d.length;
        if (e >= c.length) {
            var f = [], g, h, k;
            for (g = 0; g < e; ++g) {
                h = d[g];
                k = this.d[h];
                var n;
                if (!(n = 1 == h))
                    a: {
                        n = c.length;
                        for (var p = void 0, q = 0; q < n; q++)
                            if (p = c[q],
                                p.identifier === h - 2) {
                                n = !0;
                                break a
                            }
                        n = !1
                    }
                n || f.push(k.bc)
            }
            for (g = 0; g < f.length; ++g)
                this.he(b, f[g])
        }
        c = lb(this.d);
        if (0 === c || 1 === c && (1).toString() in this.d)
            this.b = b.a.changedTouches[0].identifier,
                m(this.c) && ba.clearTimeout(this.c);
        li(this, b);
        this.e++;
        ki(this, b, this.Nk)
    }
        ;
    l.Nk = function (b, c) {
        this.d[c.pointerId] = {
            target: c.target,
            bc: c,
            Sf: c.target
        };
        var d = this.a;
        c.bubbles = !0;
        Zh(d, mi, c, b);
        d = this.a;
        c.bubbles = !1;
        Zh(d, ni, c, b);
        Zh(this.a, $h, c, b)
    }
        ;
    l.Pl = function (b) {
        b.preventDefault();
        ki(this, b, this.Ni)
    }
        ;
    l.Ni = function (b, c) {
        var d = this.d[c.pointerId];
        if (d) {
            var e = d.bc
                , f = d.Sf;
            Zh(this.a, ai, c, b);
            e && f !== c.target && (e.relatedTarget = c.target,
                c.relatedTarget = f,
                e.target = f,
                c.target ? (di(this.a, e, b),
                    ci(this.a, c, b)) : (c.target = f,
                        c.relatedTarget = null,
                        this.he(b, c)));
            d.bc = c;
            d.Sf = c.target
        }
    }
        ;
    l.Ol = function (b) {
        li(this, b);
        ki(this, b, this.Rl)
    }
        ;
    l.Rl = function (b, c) {
        Zh(this.a, bi, c, b);
        this.a.bc(c, b);
        var d = this.a;
        c.bubbles = !1;
        Zh(d, oi, c, b);
        tb(this.d, c.pointerId);
        c.isPrimary && (this.b = void 0,
            this.c = ba.setTimeout(ra(this.gg, this), 200))
    }
        ;
    l.Nl = function (b) {
        ki(this, b, this.he)
    }
        ;
    l.he = function (b, c) {
        this.a.cancel(c, b);
        this.a.bc(c, b);
        var d = this.a;
        c.bubbles = !1;
        Zh(d, oi, c, b);
        tb(this.d, c.pointerId);
        c.isPrimary && (this.b = void 0,
            this.c = ba.setTimeout(ra(this.gg, this), 200))
    }
        ;
    function li(b, c) {
        var d = b.g.b
            , e = c.a.changedTouches[0];
        if (b.b === e.identifier) {
            var f = [e.clientX, e.clientY];
            d.push(f);
            ba.setTimeout(function () {
                Wa(d, f)
            }, 2500)
        }
    }
    ; function pi(b) {
        ed.call(this);
        this.aa = b;
        this.d = {};
        this.b = {};
        this.a = [];
        dg ? qi(this, new gi(this)) : eg ? qi(this, new ei(this)) : (b = new Vh(this),
            qi(this, b),
            cg && qi(this, new ii(this, b)));
        b = this.a.length;
        for (var c, d = 0; d < b; d++)
            c = this.a[d],
                ri(this, nb(c.f))
    }
    v(pi, ed);
    function qi(b, c) {
        var d = nb(c.f);
        d && (Oa(d, function (b) {
            var d = c.f[b];
            d && (this.b[b] = ra(d, c))
        }, b),
            b.a.push(c))
    }
    pi.prototype.c = function (b) {
        var c = this.b[b.type];
        c && c(b)
    }
        ;
    function ri(b, c) {
        Oa(c, function (b) {
            w(this.aa, b, this.c, !1, this)
        }, b)
    }
    function si(b, c) {
        Oa(c, function (b) {
            Sc(this.aa, b, this.c, !1, this)
        }, b)
    }
    function Yh(b, c) {
        for (var d = {}, e, f = 0, g = ti.length; f < g; f++)
            e = ti[f][0],
                d[e] = b[e] || c[e] || ti[f][1];
        return d
    }
    pi.prototype.bc = function (b, c) {
        b.bubbles = !0;
        Zh(this, ui, b, c)
    }
        ;
    pi.prototype.cancel = function (b, c) {
        Zh(this, vi, b, c)
    }
        ;
    function di(b, c, d) {
        b.bc(c, d);
        c.target.contains(c.relatedTarget) || (c.bubbles = !1,
            Zh(b, oi, c, d))
    }
    function ci(b, c, d) {
        c.bubbles = !0;
        Zh(b, mi, c, d);
        c.target.contains(c.relatedTarget) || (c.bubbles = !1,
            Zh(b, ni, c, d))
    }
    function Zh(b, c, d, e) {
        b.dispatchEvent(new Ph(c, e, d))
    }
    function hi(b, c) {
        b.dispatchEvent(new Ph(c.type, c, c.a))
    }
    pi.prototype.M = function () {
        for (var b = this.a.length, c, d = 0; d < b; d++)
            c = this.a[d],
                si(this, nb(c.f));
        pi.R.M.call(this)
    }
        ;
    var ai = "pointermove"
        , $h = "pointerdown"
        , bi = "pointerup"
        , mi = "pointerover"
        , ui = "pointerout"
        , ni = "pointerenter"
        , oi = "pointerleave"
        , vi = "pointercancel"
        , ti = [["bubbles", !1], ["cancelable", !1], ["view", null], ["detail", null], ["screenX", 0], ["screenY", 0], ["clientX", 0], ["clientY", 0], ["ctrlKey", !1], ["altKey", !1], ["shiftKey", !1], ["metaKey", !1], ["button", 0], ["relatedTarget", null], ["buttons", 0], ["pointerId", 0], ["width", 0], ["height", 0], ["pressure", 0], ["tiltX", 0], ["tiltY", 0], ["pointerType", ""], ["hwTimestamp", 0], ["isPrimary", !1], ["type", ""], ["target", null], ["currentTarget", null], ["which", 0]];
    function wi(b, c, d, e, f) {
        Tg.call(this, b, c, f);
        this.a = d;
        this.originalEvent = d.a;
        this.pixel = c.cd(this.originalEvent);
        this.coordinate = c.ia(this.pixel);
        this.dragging = m(e) ? e : !1
    }
    v(wi, Tg);
    wi.prototype.preventDefault = function () {
        wi.R.preventDefault.call(this);
        this.a.preventDefault()
    }
        ;
    wi.prototype.mb = function () {
        wi.R.mb.call(this);
        this.a.mb()
    }
        ;
    function xi(b, c, d, e, f) {
        wi.call(this, b, c, d.a, e, f);
        this.d = d
    }
    v(xi, wi);
    function yi(b) {
        ed.call(this);
        this.b = b;
        this.e = 0;
        this.g = !1;
        this.d = this.j = this.c = null;
        b = this.b.b;
        this.l = 0;
        this.n = {};
        this.f = new pi(b);
        this.a = null;
        this.j = w(this.f, $h, this.ti, !1, this);
        this.i = w(this.f, ai, this.ml, !1, this)
    }
    v(yi, ed);
    function zi(b, c) {
        var d;
        d = new xi(Ai, b.b, c);
        b.dispatchEvent(d);
        0 !== b.e ? (ba.clearTimeout(b.e),
            b.e = 0,
            d = new xi(Bi, b.b, c),
            b.dispatchEvent(d)) : b.e = ba.setTimeout(ra(function () {
                this.e = 0;
                var b = new xi(Ci, this.b, c);
                this.dispatchEvent(b)
            }, b), 250)
    }
    function Di(b, c) {
        c.type == Ei || c.type == Fi ? delete b.n[c.pointerId] : c.type == Gi && (b.n[c.pointerId] = !0);
        b.l = lb(b.n)
    }
    l = yi.prototype;
    l.qf = function (b) {
        Di(this, b);
        var c = new xi(Ei, this.b, b);
        this.dispatchEvent(c);
        !this.g && 0 === b.button && zi(this, this.d);
        0 === this.l && (Oa(this.c, Tc),
            this.c = null,
            this.g = !1,
            this.d = null,
            oc(this.a),
            this.a = null)
    }
        ;
    l.ti = function (b) {
        Di(this, b);
        var c = new xi(Gi, this.b, b);
        this.dispatchEvent(c);
        this.d = b;
        null === this.c && (this.a = new pi(document),
            this.c = [w(this.a, Hi, this.jj, !1, this), w(this.a, Ei, this.qf, !1, this), w(this.f, Fi, this.qf, !1, this)])
    }
        ;
    l.jj = function (b) {
        if (b.clientX != this.d.clientX || b.clientY != this.d.clientY) {
            this.g = !0;
            var c = new xi(Ii, this.b, b, this.g);
            this.dispatchEvent(c)
        }
        b.preventDefault()
    }
        ;
    l.ml = function (b) {
        this.dispatchEvent(new xi(b.type, this.b, b, null !== this.d && (b.clientX != this.d.clientX || b.clientY != this.d.clientY)))
    }
        ;
    l.M = function () {
        null !== this.i && (Tc(this.i),
            this.i = null);
        null !== this.j && (Tc(this.j),
            this.j = null);
        null !== this.c && (Oa(this.c, Tc),
            this.c = null);
        null !== this.a && (oc(this.a),
            this.a = null);
        null !== this.f && (oc(this.f),
            this.f = null);
        yi.R.M.call(this)
    }
        ;
    var Ci = "singleclick"
        , Ai = "click"
        , Bi = "dblclick"
        , Ii = "pointerdrag"
        , Hi = "pointermove"
        , Gi = "pointerdown"
        , Ei = "pointerup"
        , Fi = "pointercancel"
        , Ji = {
            nm: Ci,
            cm: Ai,
            dm: Bi,
            gm: Ii,
            jm: Hi,
            fm: Gi,
            mm: Ei,
            lm: "pointerover",
            km: "pointerout",
            hm: "pointerenter",
            im: "pointerleave",
            em: Fi
        };
    function Ki(b) {
        hd.call(this);
        this.g = Be(b.projection);
        this.f = m(b.attributions) ? b.attributions : null;
        this.r = b.logo;
        this.n = m(b.state) ? b.state : "ready"
    }
    v(Ki, hd);
    l = Ki.prototype;
    l.Cd = ca;
    l.Y = function () {
        return this.f
    }
        ;
    l.W = function () {
        return this.r
    }
        ;
    l.Z = function () {
        return this.g
    }
        ;
    l.$ = function () {
        return this.n
    }
        ;
    function Li(b, c) {
        b.n = c;
        b.o()
    }
    ; function E(b) {
        od.call(this);
        var c = wb(b);
        c.brightness = m(b.brightness) ? b.brightness : 0;
        c.contrast = m(b.contrast) ? b.contrast : 1;
        c.hue = m(b.hue) ? b.hue : 0;
        c.opacity = m(b.opacity) ? b.opacity : 1;
        c.saturation = m(b.saturation) ? b.saturation : 1;
        c.visible = m(b.visible) ? b.visible : !0;
        c.maxResolution = m(b.maxResolution) ? b.maxResolution : Infinity;
        c.minResolution = m(b.minResolution) ? b.minResolution : 0;
        this.G(c)
    }
    v(E, od);
    E.prototype.c = function () {
        return this.get("brightness")
    }
        ;
    E.prototype.getBrightness = E.prototype.c;
    E.prototype.f = function () {
        return this.get("contrast")
    }
        ;
    E.prototype.getContrast = E.prototype.f;
    E.prototype.e = function () {
        return this.get("hue")
    }
        ;
    E.prototype.getHue = E.prototype.e;
    function Mi(b) {
        var c = b.c()
            , d = b.f()
            , e = b.e()
            , f = b.l()
            , g = b.n()
            , h = b.Va()
            , k = b.b()
            , n = b.D()
            , p = b.g()
            , q = b.i();
        return {
            layer: b,
            brightness: Ub(c, -1, 1),
            contrast: Math.max(d, 0),
            hue: e,
            opacity: Ub(f, 0, 1),
            saturation: Math.max(g, 0),
            hc: h,
            visible: k,
            extent: n,
            maxResolution: p,
            minResolution: Math.max(q, 0)
        }
    }
    E.prototype.D = function () {
        return this.get("extent")
    }
        ;
    E.prototype.getExtent = E.prototype.D;
    E.prototype.g = function () {
        return this.get("maxResolution")
    }
        ;
    E.prototype.getMaxResolution = E.prototype.g;
    E.prototype.i = function () {
        return this.get("minResolution")
    }
        ;
    E.prototype.getMinResolution = E.prototype.i;
    E.prototype.l = function () {
        return this.get("opacity")
    }
        ;
    E.prototype.getOpacity = E.prototype.l;
    E.prototype.n = function () {
        return this.get("saturation")
    }
        ;
    E.prototype.getSaturation = E.prototype.n;
    E.prototype.b = function () {
        return this.get("visible")
    }
        ;
    E.prototype.getVisible = E.prototype.b;
    E.prototype.s = function (b) {
        this.set("brightness", b)
    }
        ;
    E.prototype.setBrightness = E.prototype.s;
    E.prototype.F = function (b) {
        this.set("contrast", b)
    }
        ;
    E.prototype.setContrast = E.prototype.F;
    E.prototype.H = function (b) {
        this.set("hue", b)
    }
        ;
    E.prototype.setHue = E.prototype.H;
    E.prototype.p = function (b) {
        this.set("extent", b)
    }
        ;
    E.prototype.setExtent = E.prototype.p;
    E.prototype.S = function (b) {
        this.set("maxResolution", b)
    }
        ;
    E.prototype.setMaxResolution = E.prototype.S;
    E.prototype.U = function (b) {
        this.set("minResolution", b)
    }
        ;
    E.prototype.setMinResolution = E.prototype.U;
    E.prototype.q = function (b) {
        this.set("opacity", b)
    }
        ;
    E.prototype.setOpacity = E.prototype.q;
    E.prototype.ba = function (b) {
        this.set("saturation", b)
    }
        ;
    E.prototype.setSaturation = E.prototype.ba;
    E.prototype.ca = function (b) {
        this.set("visible", b)
    }
        ;
    E.prototype.setVisible = E.prototype.ca;
    function F(b) {
        var c = wb(b);
        delete c.source;
        E.call(this, c);
        this.ta = null;
        w(this, sd("source"), this.de, !1, this);
        this.ea(m(b.source) ? b.source : null)
    }
    v(F, E);
    function Ni(b, c) {
        return b.visible && c >= b.minResolution && c < b.maxResolution
    }
    F.prototype.Da = function (b) {
        b = m(b) ? b : [];
        b.push(Mi(this));
        return b
    }
        ;
    F.prototype.a = function () {
        var b = this.get("source");
        return m(b) ? b : null
    }
        ;
    F.prototype.getSource = F.prototype.a;
    F.prototype.Va = function () {
        var b = this.a();
        return null === b ? "undefined" : b.n
    }
        ;
    F.prototype.ee = function () {
        this.o()
    }
        ;
    F.prototype.de = function () {
        null !== this.ta && (Tc(this.ta),
            this.ta = null);
        var b = this.a();
        null !== b && (this.ta = w(b, "change", this.ee, !1, this));
        this.o()
    }
        ;
    F.prototype.ea = function (b) {
        this.set("source", b)
    }
        ;
    F.prototype.setSource = F.prototype.ea;
    function Oi(b, c, d, e, f) {
        ed.call(this);
        this.e = f;
        this.extent = b;
        this.f = d;
        this.resolution = c;
        this.state = e
    }
    v(Oi, ed);
    Oi.prototype.D = function () {
        return this.extent
    }
        ;
    function Pi(b, c) {
        ed.call(this);
        this.a = b;
        this.state = c
    }
    v(Pi, ed);
    function Qi(b) {
        b.dispatchEvent("change")
    }
    Pi.prototype.nb = function () {
        return ma(this).toString()
    }
        ;
    Pi.prototype.e = function () {
        return this.a
    }
        ;
    function Ri(b) {
        this.minZoom = m(b.minZoom) ? b.minZoom : 0;
        this.a = b.resolutions;
        this.maxZoom = this.a.length - 1;
        this.c = m(b.origin) ? b.origin : null;
        this.e = null;
        m(b.origins) && (this.e = b.origins);
        this.d = null;
        m(b.tileSizes) && (this.d = b.tileSizes);
        this.f = m(b.tileSize) ? b.tileSize : null === this.d ? 256 : void 0
    }
    var Si = [0, 0, 0];
    l = Ri.prototype;
    l.Cb = function () {
        return ad
    }
        ;
    l.bd = function (b, c, d, e, f) {
        f = Ti(this, b, f);
        for (b = b[0] - 1; b >= this.minZoom;) {
            if (c.call(d, b, Ui(this, f, b, e)))
                return !0;
            --b
        }
        return !1
    }
        ;
    l.gd = function () {
        return this.maxZoom
    }
        ;
    l.hd = function () {
        return this.minZoom
    }
        ;
    l.Lb = function (b) {
        return null === this.c ? this.e[b] : this.c
    }
        ;
    l.na = function (b) {
        return this.a[b]
    }
        ;
    l.Kd = function () {
        return this.a
    }
        ;
    l.md = function (b, c, d) {
        return b[0] < this.maxZoom ? (d = Ti(this, b, d),
            Ui(this, d, b[0] + 1, c)) : null
    }
        ;
    function Vi(b, c, d, e) {
        Wi(b, c[0], c[1], d, !1, Si);
        var f = Si[1]
            , g = Si[2];
        Wi(b, c[2], c[3], d, !0, Si);
        return mf(f, Si[1], g, Si[2], e)
    }
    function Ui(b, c, d, e) {
        return Vi(b, c, b.na(d), e)
    }
    function Xi(b, c) {
        var d = b.Lb(c[0])
            , e = b.na(c[0])
            , f = b.va(c[0]);
        return [d[0] + (c[1] + .5) * f * e, d[1] + (c[2] + .5) * f * e]
    }
    function Ti(b, c, d) {
        var e = b.Lb(c[0])
            , f = b.na(c[0]);
        b = b.va(c[0]);
        var g = e[0] + c[1] * b * f;
        c = e[1] + c[2] * b * f;
        return Ud(g, c, g + b * f, c + b * f, d)
    }
    l.Vb = function (b, c, d) {
        return Wi(this, b[0], b[1], c, !1, d)
    }
        ;
    function Wi(b, c, d, e, f, g) {
        var h = $b(b.a, e, 0)
            , k = e / b.na(h)
            , n = b.Lb(h);
        b = b.va(h);
        c = k * (c - n[0]) / (e * b);
        d = k * (d - n[1]) / (e * b);
        f ? (c = Math.ceil(c) - 1,
            d = Math.ceil(d) - 1) : (c = Math.floor(c),
                d = Math.floor(d));
        return gf(h, c, d, g)
    }
    l.Hc = function (b, c, d) {
        return Wi(this, b[0], b[1], this.na(c), !1, d)
    }
        ;
    l.va = function (b) {
        return m(this.f) ? this.f : this.d[b]
    }
        ;
    function Yi(b, c, d) {
        c = m(c) ? c : 42;
        d = m(d) ? d : 256;
        b = Math.max(pe(b) / d, me(b) / d);
        c += 1;
        d = Array(c);
        for (var e = 0; e < c; ++e)
            d[e] = b / Math.pow(2, e);
        return d
    }
    function Zi(b) {
        b = Be(b);
        var c = b.D();
        null === c && (b = 180 * xe.degrees / b.qe(),
            c = Ud(-b, -b, b, b));
        return c
    }
    ; function $i(b) {
        Ki.call(this, {
            attributions: b.attributions,
            extent: b.extent,
            logo: b.logo,
            projection: b.projection,
            state: b.state
        });
        this.s = m(b.opaque) ? b.opaque : !1;
        this.F = m(b.tilePixelRatio) ? b.tilePixelRatio : 1;
        this.tileGrid = m(b.tileGrid) ? b.tileGrid : null
    }
    v($i, Ki);
    l = $i.prototype;
    l.Dd = Yc;
    l.le = function (b, c, d, e) {
        var f = !0, g, h, k, n;
        for (k = e.a; k <= e.c; ++k)
            for (n = e.b; n <= e.d; ++n)
                h = this.ib(d, k, n),
                    b[d] && b[d][h] || (g = c(d, k, n),
                        null === g ? f = !1 : (b[d] || (b[d] = {}),
                            b[d][h] = g));
        return f
    }
        ;
    l.dd = function () {
        return 0
    }
        ;
    l.ib = hf;
    l.Fa = function () {
        return this.tileGrid
    }
        ;
    function bj(b, c) {
        var d;
        if (null === b.tileGrid) {
            if (d = c.f,
                null === d) {
                d = Zi(c);
                var e = m(void 0) ? void 0 : 256
                    , f = m(void 0) ? void 0 : "bottom-left"
                    , g = Yi(d, void 0, e);
                d = new Ri({
                    origin: je(d, f),
                    resolutions: g,
                    tileSize: e
                });
                c.f = d
            }
        } else
            d = b.tileGrid;
        return d
    }
    l.Ic = function (b, c, d) {
        return bj(this, d).va(b) * this.F
    }
        ;
    l.Oe = ca;
    function cj(b, c) {
        kc.call(this);
        this.d = b;
        this.a = c
    }
    v(cj, kc);
    cj.prototype.Sa = ca;
    cj.prototype.ac = function (b, c, d, e) {
        b = this.d.b.ia(b);
        if (this.Sa(b, c, Zc, this))
            return d.call(e, this.a)
    }
        ;
    cj.prototype.Ad = Yc;
    cj.prototype.S = function (b) {
        2 === b.target.state && dj(this)
    }
        ;
    function ej(b, c) {
        var d = c.state;
        2 != d && 3 != d && Rc(c, "change", b.S, !1, b);
        0 == d && (c.load(),
            d = c.state);
        return 2 == d
    }
    function dj(b) {
        var c = b.a;
        c.b() && "ready" == c.Va() && b.d.b.render()
    }
    function fj(b, c) {
        c.Dd() && b.postRenderFunctions.push(sa(function (b, c, f) {
            c = ma(b).toString();
            b.Be(f.usedTiles[c])
        }, c))
    }
    function gj(b, c) {
        if (null != c) {
            var d, e, f;
            e = 0;
            for (f = c.length; e < f; ++e)
                d = c[e],
                    b[ma(d).toString()] = d
        }
    }
    function hj(b, c) {
        var d = c.r;
        m(d) && (ia(d) ? b.logos[d] = "" : la(d) && (b.logos[d.src] = d.href))
    }
    function ij(b, c, d, e) {
        c = ma(c).toString();
        d = d.toString();
        c in b ? d in b[c] ? (b = b[c][d],
            e.a < b.a && (b.a = e.a),
            e.c > b.c && (b.c = e.c),
            e.b < b.b && (b.b = e.b),
            e.d > b.d && (b.d = e.d)) : b[c][d] = e : (b[c] = {},
                b[c][d] = e)
    }
    function jj(b, c, d, e) {
        return function (f, g, h) {
            f = c.Fb(f, g, h, d, e);
            return b(f) ? f : null
        }
    }
    function kj(b, c, d) {
        return [c * (Math.round(b[0] / c) + d[0] % 2 / 2), c * (Math.round(b[1] / c) + d[1] % 2 / 2)]
    }
    function lj(b, c, d, e, f, g, h, k, n, p) {
        var q = ma(c).toString();
        q in b.wantedTiles || (b.wantedTiles[q] = {});
        var r = b.wantedTiles[q];
        b = b.tileQueue;
        var s = d.minZoom, u, y, A, z, D, x;
        for (x = h; x >= s; --x)
            for (y = Ui(d, g, x, y),
                A = d.na(x),
                z = y.a; z <= y.c; ++z)
                for (D = y.b; D <= y.d; ++D)
                    h - x <= k ? (u = c.Fb(x, z, D, e, f),
                        0 == u.state && (r[kf(u.a)] = !0,
                            u.nb() in b.b || mj(b, [u, q, Xi(d, u.a), A])),
                        m(n) && n.call(p, u)) : c.Oe(x, z, D)
    }
    ; function nj(b) {
        this.p = b.opacity;
        this.q = b.rotateWithView;
        this.i = b.rotation;
        this.n = b.scale;
        this.r = b.snapToPixel
    }
    l = nj.prototype;
    l.Fd = function () {
        return this.p
    }
        ;
    l.kd = function () {
        return this.q
    }
        ;
    l.Gd = function () {
        return this.i
    }
        ;
    l.Hd = function () {
        return this.n
    }
        ;
    l.ld = function () {
        return this.r
    }
        ;
    l.Id = function (b) {
        this.i = b
    }
        ;
    l.Jd = function (b) {
        this.n = b
    }
        ;
    function oj(b) {
        b = m(b) ? b : {};
        this.f = m(b.anchor) ? b.anchor : [.5, .5];
        this.c = null;
        this.d = m(b.anchorOrigin) ? b.anchorOrigin : "top-left";
        this.g = m(b.anchorXUnits) ? b.anchorXUnits : "fraction";
        this.j = m(b.anchorYUnits) ? b.anchorYUnits : "fraction";
        var c = m(b.crossOrigin) ? b.crossOrigin : null
            , d = m(b.img) ? b.img : null
            , e = b.src;
        m(e) && 0 !== e.length || null === d || (e = d.src);
        var f = m(b.src) ? 0 : 2
            , g = pj.Ma()
            , h = g.get(e, c);
        null === h && (h = new qj(d, e, c, f),
            g.set(e, c, h));
        this.a = h;
        this.s = m(b.offset) ? b.offset : [0, 0];
        this.b = m(b.offsetOrigin) ? b.offsetOrigin : "top-left";
        this.e = null;
        this.l = m(b.size) ? b.size : null;
        nj.call(this, {
            opacity: m(b.opacity) ? b.opacity : 1,
            rotation: m(b.rotation) ? b.rotation : 0,
            scale: m(b.scale) ? b.scale : 1,
            snapToPixel: m(b.snapToPixel) ? b.snapToPixel : !0,
            rotateWithView: m(b.rotateWithView) ? b.rotateWithView : !1
        })
    }
    v(oj, nj);
    l = oj.prototype;
    l.ub = function () {
        if (null !== this.c)
            return this.c;
        var b = this.f
            , c = this.cb();
        if ("fraction" == this.g || "fraction" == this.j) {
            if (null === c)
                return null;
            b = this.f.slice();
            "fraction" == this.g && (b[0] *= c[0]);
            "fraction" == this.j && (b[1] *= c[1])
        }
        if ("top-left" != this.d) {
            if (null === c)
                return null;
            b === this.f && (b = this.f.slice());
            if ("top-right" == this.d || "bottom-right" == this.d)
                b[0] = -b[0] + c[0];
            if ("bottom-left" == this.d || "bottom-right" == this.d)
                b[1] = -b[1] + c[1]
        }
        return this.c = b
    }
        ;
    l.zb = function () {
        return this.a.a
    }
        ;
    l.ed = function () {
        return this.a.d
    }
        ;
    l.Jc = function () {
        return this.a.b
    }
        ;
    l.Ed = function () {
        var b = this.a;
        if (null === b.f)
            if (b.j) {
                var c = b.d[0]
                    , d = b.d[1]
                    , e = Pf(c, d);
                e.fillRect(0, 0, c, d);
                b.f = e.canvas
            } else
                b.f = b.a;
        return b.f
    }
        ;
    l.Ab = function () {
        if (null !== this.e)
            return this.e;
        var b = this.s;
        if ("top-left" != this.b) {
            var c = this.cb()
                , d = this.a.d;
            if (null === c || null === d)
                return null;
            b = b.slice();
            if ("top-right" == this.b || "bottom-right" == this.b)
                b[0] = d[0] - c[0] - b[0];
            if ("bottom-left" == this.b || "bottom-right" == this.b)
                b[1] = d[1] - c[1] - b[1]
        }
        return this.e = b
    }
        ;
    l.hk = function () {
        return this.a.e
    }
        ;
    l.cb = function () {
        return null === this.l ? this.a.d : this.l
    }
        ;
    l.ve = function (b, c) {
        return w(this.a, "change", b, !1, c)
    }
        ;
    l.load = function () {
        this.a.load()
    }
        ;
    l.Ne = function (b, c) {
        Sc(this.a, "change", b, !1, c)
    }
        ;
    function qj(b, c, d, e) {
        ed.call(this);
        this.f = null;
        this.a = null === b ? new Image : b;
        null !== d && (this.a.crossOrigin = d);
        this.c = null;
        this.b = e;
        this.d = null;
        this.e = c;
        this.j = !1
    }
    v(qj, ed);
    qj.prototype.g = function () {
        this.b = 3;
        Oa(this.c, Tc);
        this.c = null;
        this.dispatchEvent("change")
    }
        ;
    qj.prototype.i = function () {
        this.b = 2;
        this.d = [this.a.width, this.a.height];
        Oa(this.c, Tc);
        this.c = null;
        var b = Pf(1, 1);
        b.drawImage(this.a, 0, 0);
        try {
            b.getImageData(0, 0, 1, 1)
        } catch (c) {
            this.j = !0
        }
        this.dispatchEvent("change")
    }
        ;
    qj.prototype.load = function () {
        if (0 == this.b) {
            this.b = 1;
            this.c = [Rc(this.a, "error", this.g, !1, this), Rc(this.a, "load", this.i, !1, this)];
            try {
                this.a.src = this.e
            } catch (b) {
                this.g()
            }
        }
    }
        ;
    function pj() {
        this.a = {};
        this.d = 0
    }
    da(pj);
    pj.prototype.clear = function () {
        this.a = {};
        this.d = 0
    }
        ;
    pj.prototype.get = function (b, c) {
        var d = c + ":" + b;
        return d in this.a ? this.a[d] : null
    }
        ;
    pj.prototype.set = function (b, c, d) {
        this.a[c + ":" + b] = d;
        ++this.d
    }
        ;
    function rj(b, c, d, e, f, g, h, k) {
        Kd(b);
        0 === c && 0 === d || Nd(b, c, d);
        1 == e && 1 == f || Od(b, e, f);
        0 !== g && Pd(b, g);
        0 === h && 0 === k || Nd(b, h, k);
        return b
    }
    function sj(b, c) {
        return b[0] == c[0] && b[1] == c[1] && b[4] == c[4] && b[5] == c[5] && b[12] == c[12] && b[13] == c[13]
    }
    function tj(b, c, d) {
        var e = b[1]
            , f = b[5]
            , g = b[13]
            , h = c[0];
        c = c[1];
        d[0] = b[0] * h + b[4] * c + b[12];
        d[1] = e * h + f * c + g;
        return d
    }
    ; function uj(b, c) {
        kc.call(this);
        this.b = c;
        this.c = null;
        this.g = {}
    }
    v(uj, kc);
    function vj(b) {
        var c = b.viewState
            , d = b.coordinateToPixelMatrix;
        rj(d, b.size[0] / 2, b.size[1] / 2, 1 / c.resolution, -1 / c.resolution, -c.rotation, -c.center[0], -c.center[1]);
        Md(d, b.pixelToCoordinateMatrix)
    }
    l = uj.prototype;
    l.$c = function (b) {
        return new cj(this, b)
    }
        ;
    l.M = function () {
        jb(this.g, oc);
        uj.R.M.call(this)
    }
        ;
    function wj() {
        var b = pj.Ma();
        if (32 < b.d) {
            var c = 0, d, e;
            for (d in b.a) {
                e = b.a[d];
                var f;
                if (f = 0 === (c++ & 3))
                    zc(e) ? e = gd(e, void 0, void 0) : (e = Nc(e),
                        e = !!e && Hc(e, void 0, void 0)),
                        f = !e;
                f && (delete b.a[d],
                    --b.d)
            }
        }
    }
    l.ye = function (b, c, d, e, f, g) {
        var h, k = c.viewState, n = k.resolution, k = k.rotation;
        if (null !== this.c) {
            var p = {};
            if (h = this.c.b(b, n, k, {}, function (b) {
                var c = ma(b).toString();
                if (!(c in p))
                    return p[c] = !0,
                        d.call(e, b, null)
            }))
                return h
        }
        var k = c.layerStatesArray, q;
        for (q = k.length - 1; 0 <= q; --q) {
            h = k[q];
            var r = h.layer;
            if (Ni(h, n) && f.call(g, r) && (h = xj(this, r).Sa(b, c, d, e)))
                return h
        }
    }
        ;
    l.Ef = function (b, c, d, e, f, g) {
        var h, k = c.viewState, n = k.resolution, k = k.rotation;
        if (null !== this.c) {
            var p = this.b.ia(b);
            if (this.c.b(p, n, k, {}, Zc) && (h = d.call(e, null)))
                return h
        }
        k = c.layerStatesArray;
        for (p = k.length - 1; 0 <= p; --p) {
            h = k[p];
            var q = h.layer;
            if (Ni(h, n) && f.call(g, q) && (h = xj(this, q).ac(b, c, d, e)))
                return h
        }
    }
        ;
    l.Ff = function (b, c, d, e) {
        b = this.ye(b, c, Zc, this, d, e);
        return m(b)
    }
        ;
    function xj(b, c) {
        var d = ma(c).toString();
        if (d in b.g)
            return b.g[d];
        var e = b.$c(c);
        return b.g[d] = e
    }
    l.Sd = ca;
    l.rl = function (b, c) {
        for (var d in this.g)
            if (!(null !== c && d in c.layerStates)) {
                var e = this.g[d];
                delete this.g[d];
                oc(e)
            }
    }
        ;
    function yj(b, c) {
        for (var d in b.g)
            if (!(d in c.layerStates)) {
                c.postRenderFunctions.push(ra(b.rl, b));
                break
            }
    }
    ; function zj(b, c) {
        this.e = b;
        this.f = c;
        this.a = [];
        this.d = [];
        this.b = {}
    }
    zj.prototype.clear = function () {
        this.a.length = 0;
        this.d.length = 0;
        sb(this.b)
    }
        ;
    function Aj(b) {
        var c = b.a
            , d = b.d
            , e = c[0];
        1 == c.length ? (c.length = 0,
            d.length = 0) : (c[0] = c.pop(),
                d[0] = d.pop(),
                Bj(b, 0));
        c = b.f(e);
        delete b.b[c];
        return e
    }
    function mj(b, c) {
        var d = b.e(c);
        Infinity != d && (b.a.push(c),
            b.d.push(d),
            b.b[b.f(c)] = !0,
            Cj(b, 0, b.a.length - 1))
    }
    zj.prototype.Tb = function () {
        return this.a.length
    }
        ;
    zj.prototype.la = function () {
        return 0 === this.a.length
    }
        ;
    function Bj(b, c) {
        for (var d = b.a, e = b.d, f = d.length, g = d[c], h = e[c], k = c; c < f >> 1;) {
            var n = 2 * c + 1
                , p = 2 * c + 2
                , n = p < f && e[p] < e[n] ? p : n;
            d[c] = d[n];
            e[c] = e[n];
            c = n
        }
        d[c] = g;
        e[c] = h;
        Cj(b, k, c)
    }
    function Cj(b, c, d) {
        var e = b.a;
        b = b.d;
        for (var f = e[d], g = b[d]; d > c;) {
            var h = d - 1 >> 1;
            if (b[h] > g)
                e[d] = e[h],
                    b[d] = b[h],
                    d = h;
            else
                break
        }
        e[d] = f;
        b[d] = g
    }
    function Dj(b) {
        var c = b.e, d = b.a, e = b.d, f = 0, g = d.length, h, k, n;
        for (k = 0; k < g; ++k)
            h = d[k],
                n = c(h),
                Infinity == n ? delete b.b[b.f(h)] : (e[f] = n,
                    d[f++] = h);
        d.length = f;
        e.length = f;
        for (c = (b.a.length >> 1) - 1; 0 <= c; c--)
            Bj(b, c)
    }
    ; function Ej(b, c) {
        zj.call(this, function (c) {
            return b.apply(null, c)
        }, function (b) {
            return b[0].nb()
        });
        this.j = c;
        this.c = 0
    }
    v(Ej, zj);
    Ej.prototype.g = function () {
        --this.c;
        this.j()
    }
        ;
    function Fj(b, c, d) {
        this.c = b;
        this.b = c;
        this.e = d;
        this.a = [];
        this.d = this.f = 0
    }
    Fj.prototype.update = function (b, c) {
        this.a.push(b, c, ua())
    }
        ;
    function Gj(b, c) {
        var d = b.c
            , e = b.d
            , f = b.b - e
            , g = Hj(b);
        return df({
            source: c,
            duration: g,
            easing: function (b) {
                return e * (Math.exp(d * b * g) - 1) / f
            }
        })
    }
    function Hj(b) {
        return Math.log(b.b / b.d) / b.c
    }
    ; function Ij(b) {
        od.call(this);
        this.n = null;
        this.b(!0);
        this.handleEvent = b.handleEvent
    }
    v(Ij, od);
    Ij.prototype.a = function () {
        return this.get("active")
    }
        ;
    Ij.prototype.getActive = Ij.prototype.a;
    Ij.prototype.b = function (b) {
        this.set("active", b)
    }
        ;
    Ij.prototype.setActive = Ij.prototype.b;
    Ij.prototype.setMap = function (b) {
        this.n = b
    }
        ;
    function Jj(b, c, d, e, f) {
        if (null != d) {
            var g = c.c()
                , h = c.b();
            m(g) && m(h) && m(f) && 0 < f && (b.Wa(ef({
                rotation: g,
                duration: f,
                easing: $e
            })),
                m(e) && b.Wa(df({
                    source: h,
                    duration: f,
                    easing: $e
                })));
            c.rotate(d, e)
        }
    }
    function Kj(b, c, d, e, f) {
        var g = c.a();
        d = c.constrainResolution(g, d, 0);
        Lj(b, c, d, e, f)
    }
    function Lj(b, c, d, e, f) {
        if (null != d) {
            var g = c.a()
                , h = c.b();
            m(g) && m(h) && m(f) && 0 < f && (b.Wa(ff({
                resolution: g,
                duration: f,
                easing: $e
            })),
                m(e) && b.Wa(df({
                    source: h,
                    duration: f,
                    easing: $e
                })));
            if (null != e) {
                var k;
                b = c.b();
                f = c.a();
                m(b) && m(f) && (k = [e[0] - d * (e[0] - b[0]) / f, e[1] - d * (e[1] - b[1]) / f]);
                c.Ra(k)
            }
            c.f(d)
        }
    }
    ; function Mj(b) {
        b = m(b) ? b : {};
        this.c = m(b.delta) ? b.delta : 1;
        Ij.call(this, {
            handleEvent: Nj
        });
        this.f = m(b.duration) ? b.duration : 250
    }
    v(Mj, Ij);
    function Nj(b) {
        var c = !1
            , d = b.a;
        if (b.type == Bi) {
            var c = b.map
                , e = b.coordinate
                , d = d.c ? -this.c : this.c
                , f = c.a();
            Kj(c, f, d, e, this.f);
            b.preventDefault();
            c = !0
        }
        return !c
    }
    ; function Oj(b) {
        b = b.a;
        return b.d && !b.g && b.c
    }
    function Pj(b) {
        return "mousemove" == b.originalEvent.type
    }
    function Qj(b) {
        return b.type == Ci
    }
    function Rj(b) {
        b = b.a;
        return !b.d && !b.g && !b.c
    }
    function Sj(b) {
        b = b.a;
        return !b.d && !b.g && b.c
    }
    function Tj(b) {
        b = b.a.target.tagName;
        return "INPUT" !== b && "SELECT" !== b && "TEXTAREA" !== b
    }
    function Uj(b) {
        return 1 == b.d.pointerId
    }
    ; function Vj(b) {
        b = m(b) ? b : {};
        Ij.call(this, {
            handleEvent: m(b.handleEvent) ? b.handleEvent : Wj
        });
        this.ha = m(b.handleDownEvent) ? b.handleDownEvent : Yc;
        this.ka = m(b.handleDragEvent) ? b.handleDragEvent : ca;
        this.ta = m(b.handleMoveEvent) ? b.handleMoveEvent : ca;
        this.Ca = m(b.handleUpEvent) ? b.handleUpEvent : Yc;
        this.p = !1;
        this.s = {};
        this.f = []
    }
    v(Vj, Ij);
    function Xj(b) {
        for (var c = b.length, d = 0, e = 0, f = 0; f < c; f++)
            d += b[f].clientX,
                e += b[f].clientY;
        return [d / c, e / c]
    }
    function Wj(b) {
        if (!(b instanceof xi))
            return !0;
        var c = !1
            , d = b.type;
        if (d === Gi || d === Ii || d === Ei)
            d = b.d,
                b.type == Ei ? delete this.s[d.pointerId] : b.type == Gi ? this.s[d.pointerId] = d : d.pointerId in this.s && (this.s[d.pointerId] = d),
                this.f = mb(this.s);
        this.p && (b.type == Ii ? this.ka(b) : b.type == Ei && (this.p = this.Ca(b)));
        b.type == Gi ? (this.p = b = this.ha(b),
            c = this.q(b)) : b.type == Hi && this.ta(b);
        return !c
    }
    Vj.prototype.q = ad;
    function Yj(b) {
        Vj.call(this, {
            handleDownEvent: Zj,
            handleDragEvent: ak,
            handleUpEvent: bk
        });
        b = m(b) ? b : {};
        this.c = b.kinetic;
        this.e = this.g = null;
        this.l = m(b.condition) ? b.condition : Rj;
        this.i = !1
    }
    v(Yj, Vj);
    function ak(b) {
        var c = Xj(this.f);
        this.c && this.c.update(c[0], c[1]);
        if (null !== this.e) {
            var d = this.e[0] - c[0]
                , e = c[1] - this.e[1];
            b = b.map;
            var f = b.a()
                , g = Xe(f)
                , e = d = [d, e]
                , h = g.resolution;
            e[0] *= h;
            e[1] *= h;
            zd(d, g.rotation);
            ud(d, g.center);
            d = f.i(d);
            b.render();
            f.Ra(d)
        }
        this.e = c
    }
    function bk(b) {
        b = b.map;
        var c = b.a();
        if (0 === this.f.length) {
            var d;
            if (d = !this.i && this.c)
                if (d = this.c,
                    6 > d.a.length)
                    d = !1;
                else {
                    var e = ua() - d.e
                        , f = d.a.length - 3;
                    if (d.a[f + 2] < e)
                        d = !1;
                    else {
                        for (var g = f - 3; 0 < g && d.a[g + 2] > e;)
                            g -= 3;
                        var e = d.a[f + 2] - d.a[g + 2]
                            , h = d.a[f] - d.a[g]
                            , f = d.a[f + 1] - d.a[g + 1];
                        d.f = Math.atan2(f, h);
                        d.d = Math.sqrt(h * h + f * f) / e;
                        d = d.d > d.b
                    }
                }
            d && (d = this.c,
                d = (d.b - d.d) / d.c,
                f = this.c.f,
                g = c.b(),
                this.g = Gj(this.c, g),
                b.Wa(this.g),
                g = b.e(g),
                d = b.ia([g[0] - d * Math.cos(f), g[1] - d * Math.sin(f)]),
                d = c.i(d),
                c.Ra(d));
            Ze(c, -1);
            b.render();
            return !1
        }
        this.e = null;
        return !0
    }
    function Zj(b) {
        if (0 < this.f.length && this.l(b)) {
            var c = b.map
                , d = c.a();
            this.e = null;
            this.p || Ze(d, 1);
            c.render();
            null !== this.g && Wa(c.H, this.g) && (d.Ra(b.frameState.viewState.center),
                this.g = null);
            this.c && (b = this.c,
                b.a.length = 0,
                b.f = 0,
                b.d = 0);
            this.i = 1 < this.f.length;
            return !0
        }
        return !1
    }
    Yj.prototype.q = Yc;
    function ck(b) {
        b = m(b) ? b : {};
        Vj.call(this, {
            handleDownEvent: dk,
            handleDragEvent: ek,
            handleUpEvent: fk
        });
        this.e = m(b.condition) ? b.condition : Oj;
        this.c = void 0
    }
    v(ck, Vj);
    function ek(b) {
        if (Uj(b)) {
            var c = b.map
                , d = c.f();
            b = b.pixel;
            d = Math.atan2(d[1] / 2 - b[1], b[0] - d[0] / 2);
            if (m(this.c)) {
                b = d - this.c;
                var e = c.a()
                    , f = e.c();
                c.render();
                Jj(c, e, f - b)
            }
            this.c = d
        }
    }
    function fk(b) {
        if (!Uj(b))
            return !0;
        b = b.map;
        var c = b.a();
        Ze(c, -1);
        var d = c.c()
            , d = c.constrainRotation(d, 0);
        Jj(b, c, d, void 0, 250);
        return !1
    }
    function dk(b) {
        return Uj(b) && xc(b.a) && this.e(b) ? (b = b.map,
            Ze(b.a(), 1),
            b.render(),
            this.c = void 0,
            !0) : !1
    }
    ck.prototype.q = Yc;
    function gk() {
        hd.call(this);
        this.n = Rd();
        this.l = -1;
        this.e = {};
        this.i = this.g = 0
    }
    v(gk, hd);
    gk.prototype.f = function (b, c) {
        var d = m(c) ? c : [NaN, NaN];
        this.Xa(b[0], b[1], d, Infinity);
        return d
    }
        ;
    gk.prototype.Jb = Yc;
    gk.prototype.D = function (b) {
        this.l != this.d && (this.n = this.Zc(this.n),
            this.l = this.d);
        var c = this.n;
        m(b) ? (b[0] = c[0],
            b[1] = c[1],
            b[2] = c[2],
            b[3] = c[3]) : b = c;
        return b
    }
        ;
    gk.prototype.transform = function (b, c) {
        this.qa(Se(b, c));
        return this
    }
        ;
    function hk(b, c, d, e, f, g) {
        var h = f[0]
            , k = f[1]
            , n = f[4]
            , p = f[5]
            , q = f[12];
        f = f[13];
        for (var r = m(g) ? g : [], s = 0; c < d; c += e) {
            var u = b[c]
                , y = b[c + 1];
            r[s++] = h * u + n * y + q;
            r[s++] = k * u + p * y + f
        }
        m(g) && r.length != s && (r.length = s);
        return r
    }
    ; function ik() {
        gk.call(this);
        this.a = "XY";
        this.t = 2;
        this.k = null
    }
    v(ik, gk);
    function jk(b) {
        if ("XY" == b)
            return 2;
        if ("XYZ" == b || "XYM" == b)
            return 3;
        if ("XYZM" == b)
            return 4
    }
    l = ik.prototype;
    l.Jb = Yc;
    l.Zc = function (b) {
        var c = this.k
            , d = this.k.length
            , e = this.t;
        b = Ud(Infinity, Infinity, -Infinity, -Infinity, b);
        return de(b, c, 0, d, e)
    }
        ;
    l.wb = function () {
        return this.k.slice(0, this.t)
    }
        ;
    l.xb = function () {
        return this.k.slice(this.k.length - this.t)
    }
        ;
    l.yb = function () {
        return this.a
    }
        ;
    l.se = function (b) {
        this.i != this.d && (sb(this.e),
            this.g = 0,
            this.i = this.d);
        if (0 > b || 0 !== this.g && b <= this.g)
            return this;
        var c = b.toString();
        if (this.e.hasOwnProperty(c))
            return this.e[c];
        var d = this.mc(b);
        if (d.k.length < this.k.length)
            return this.e[c] = d;
        this.g = b;
        return this
    }
        ;
    l.mc = function () {
        return this
    }
        ;
    function kk(b, c, d) {
        b.t = jk(c);
        b.a = c;
        b.k = d
    }
    function lk(b, c, d, e) {
        if (m(c))
            d = jk(c);
        else {
            for (c = 0; c < e; ++c) {
                if (0 === d.length) {
                    b.a = "XY";
                    b.t = 2;
                    return
                }
                d = d[0]
            }
            d = d.length;
            c = 2 == d ? "XY" : 3 == d ? "XYZ" : 4 == d ? "XYZM" : void 0
        }
        b.a = c;
        b.t = d
    }
    l.qa = function (b) {
        null !== this.k && (b(this.k, this.k, this.t),
            this.o())
    }
        ;
    l.Ga = function (b, c) {
        var d = this.k;
        if (null !== d) {
            var e = d.length, f = this.t, g = m(d) ? d : [], h = 0, k, n;
            for (k = 0; k < e; k += f)
                for (g[h++] = d[k] + b,
                    g[h++] = d[k + 1] + c,
                    n = k + 2; n < k + f; ++n)
                    g[h++] = d[n];
            m(d) && g.length != h && (g.length = h);
            this.o()
        }
    }
        ;
    function mk(b, c, d, e) {
        for (var f = 0, g = b[d - e], h = b[d - e + 1]; c < d; c += e)
            var k = b[c]
                , n = b[c + 1]
                , f = f + (h * k - g * n)
                , g = k
                , h = n;
        return f / 2
    }
    function nk(b, c, d, e) {
        var f = 0, g, h;
        g = 0;
        for (h = d.length; g < h; ++g) {
            var k = d[g]
                , f = f + mk(b, c, k, e);
            c = k
        }
        return f
    }
    ; function ok(b, c, d, e, f, g) {
        var h = f - d
            , k = g - e;
        if (0 !== h || 0 !== k) {
            var n = ((b - d) * h + (c - e) * k) / (h * h + k * k);
            1 < n ? (d = f,
                e = g) : 0 < n && (d += h * n,
                    e += k * n)
        }
        return pk(b, c, d, e)
    }
    function pk(b, c, d, e) {
        b = d - b;
        c = e - c;
        return b * b + c * c
    }
    ; function qk(b, c, d, e, f, g, h) {
        var k = b[c]
            , n = b[c + 1]
            , p = b[d] - k
            , q = b[d + 1] - n;
        if (0 !== p || 0 !== q)
            if (g = ((f - k) * p + (g - n) * q) / (p * p + q * q),
                1 < g)
                c = d;
            else if (0 < g) {
                for (f = 0; f < e; ++f)
                    h[f] = Wb(b[c + f], b[d + f], g);
                h.length = e;
                return
            }
        for (f = 0; f < e; ++f)
            h[f] = b[c + f];
        h.length = e
    }
    function rk(b, c, d, e, f) {
        var g = b[c]
            , h = b[c + 1];
        for (c += e; c < d; c += e) {
            var k = b[c]
                , n = b[c + 1]
                , g = pk(g, h, k, n);
            g > f && (f = g);
            g = k;
            h = n
        }
        return f
    }
    function sk(b, c, d, e, f) {
        var g, h;
        g = 0;
        for (h = d.length; g < h; ++g) {
            var k = d[g];
            f = rk(b, c, k, e, f);
            c = k
        }
        return f
    }
    function tk(b, c, d, e, f, g, h, k, n, p, q) {
        if (c == d)
            return p;
        var r;
        if (0 === f) {
            r = pk(h, k, b[c], b[c + 1]);
            if (r < p) {
                for (q = 0; q < e; ++q)
                    n[q] = b[c + q];
                n.length = e;
                return r
            }
            return p
        }
        for (var s = m(q) ? q : [NaN, NaN], u = c + e; u < d;)
            if (qk(b, u - e, u, e, h, k, s),
                r = pk(h, k, s[0], s[1]),
                r < p) {
                p = r;
                for (q = 0; q < e; ++q)
                    n[q] = s[q];
                n.length = e;
                u += e
            } else
                u += e * Math.max((Math.sqrt(r) - Math.sqrt(p)) / f | 0, 1);
        if (g && (qk(b, d - e, c, e, h, k, s),
            r = pk(h, k, s[0], s[1]),
            r < p)) {
            p = r;
            for (q = 0; q < e; ++q)
                n[q] = s[q];
            n.length = e
        }
        return p
    }
    function uk(b, c, d, e, f, g, h, k, n, p, q) {
        q = m(q) ? q : [NaN, NaN];
        var r, s;
        r = 0;
        for (s = d.length; r < s; ++r) {
            var u = d[r];
            p = tk(b, c, u, e, f, g, h, k, n, p, q);
            c = u
        }
        return p
    }
    ; function vk(b, c) {
        var d = 0, e, f;
        e = 0;
        for (f = c.length; e < f; ++e)
            b[d++] = c[e];
        return d
    }
    function wk(b, c, d, e) {
        var f, g;
        f = 0;
        for (g = d.length; f < g; ++f) {
            var h = d[f], k;
            for (k = 0; k < e; ++k)
                b[c++] = h[k]
        }
        return c
    }
    function xk(b, c, d, e, f) {
        f = m(f) ? f : [];
        var g = 0, h, k;
        h = 0;
        for (k = d.length; h < k; ++h)
            c = wk(b, c, d[h], e),
                f[g++] = c;
        f.length = g;
        return f
    }
    ; function yk(b, c, d, e, f) {
        f = m(f) ? f : [];
        for (var g = 0; c < d; c += e)
            f[g++] = b.slice(c, c + e);
        f.length = g;
        return f
    }
    function zk(b, c, d, e, f) {
        f = m(f) ? f : [];
        var g = 0, h, k;
        h = 0;
        for (k = d.length; h < k; ++h) {
            var n = d[h];
            f[g++] = yk(b, c, n, e, f[g]);
            c = n
        }
        f.length = g;
        return f
    }
    ; function Ak(b, c, d, e, f, g, h) {
        var k = (d - c) / e;
        if (3 > k) {
            for (; c < d; c += e)
                g[h++] = b[c],
                    g[h++] = b[c + 1];
            return h
        }
        var n = Array(k);
        n[0] = 1;
        n[k - 1] = 1;
        d = [c, d - e];
        for (var p = 0, q; 0 < d.length;) {
            var r = d.pop()
                , s = d.pop()
                , u = 0
                , y = b[s]
                , A = b[s + 1]
                , z = b[r]
                , D = b[r + 1];
            for (q = s + e; q < r; q += e) {
                var x = ok(b[q], b[q + 1], y, A, z, D);
                x > u && (p = q,
                    u = x)
            }
            u > f && (n[(p - c) / e] = 1,
                s + e < p && d.push(s, p),
                p + e < r && d.push(p, r))
        }
        for (q = 0; q < k; ++q)
            n[q] && (g[h++] = b[c + q * e],
                g[h++] = b[c + q * e + 1]);
        return h
    }
    function Bk(b, c, d, e, f, g, h, k) {
        var n, p;
        n = 0;
        for (p = d.length; n < p; ++n) {
            var q = d[n];
            a: {
                var r = b
                    , s = q
                    , u = e
                    , y = f
                    , A = g;
                if (c != s) {
                    var z = y * Math.round(r[c] / y)
                        , D = y * Math.round(r[c + 1] / y);
                    c += u;
                    A[h++] = z;
                    A[h++] = D;
                    var x = void 0
                        , T = void 0;
                    do
                        if (x = y * Math.round(r[c] / y),
                            T = y * Math.round(r[c + 1] / y),
                            c += u,
                            c == s) {
                            A[h++] = x;
                            A[h++] = T;
                            break a
                        }
                    while (x == z && T == D);
                    for (; c < s;) {
                        var O, W;
                        O = y * Math.round(r[c] / y);
                        W = y * Math.round(r[c + 1] / y);
                        c += u;
                        if (O != x || W != T) {
                            var V = x - z
                                , ta = T - D
                                , Jb = O - z
                                , Qa = W - D;
                            V * Qa == ta * Jb && (0 > V && Jb < V || V == Jb || 0 < V && Jb > V) && (0 > ta && Qa < ta || ta == Qa || 0 < ta && Qa > ta) || (A[h++] = x,
                                A[h++] = T,
                                z = x,
                                D = T);
                            x = O;
                            T = W
                        }
                    }
                    A[h++] = x;
                    A[h++] = T
                }
            }
            k.push(h);
            c = q
        }
        return h
    }
    ; function Ck(b, c) {
        ik.call(this);
        this.b = this.j = -1;
        this.V(b, c)
    }
    v(Ck, ik);
    l = Ck.prototype;
    l.clone = function () {
        var b = new Ck(null);
        Dk(b, this.a, this.k.slice());
        return b
    }
        ;
    l.Xa = function (b, c, d, e) {
        if (e < Xd(this.D(), b, c))
            return e;
        this.b != this.d && (this.j = Math.sqrt(rk(this.k, 0, this.k.length, this.t, 0)),
            this.b = this.d);
        return tk(this.k, 0, this.k.length, this.t, this.j, !0, b, c, d, e)
    }
        ;
    l.zj = function () {
        return mk(this.k, 0, this.k.length, this.t)
    }
        ;
    l.K = function () {
        return yk(this.k, 0, this.k.length, this.t)
    }
        ;
    l.mc = function (b) {
        var c = [];
        c.length = Ak(this.k, 0, this.k.length, this.t, b, c, 0);
        b = new Ck(null);
        Dk(b, "XY", c);
        return b
    }
        ;
    l.I = function () {
        return "LinearRing"
    }
        ;
    l.V = function (b, c) {
        null === b ? Dk(this, "XY", null) : (lk(this, c, b, 1),
            null === this.k && (this.k = []),
            this.k.length = wk(this.k, 0, b, this.t),
            this.o())
    }
        ;
    function Dk(b, c, d) {
        kk(b, c, d);
        b.o()
    }
    ; function Ek(b, c) {
        ik.call(this);
        this.V(b, c)
    }
    v(Ek, ik);
    l = Ek.prototype;
    l.clone = function () {
        var b = new Ek(null);
        Fk(b, this.a, this.k.slice());
        return b
    }
        ;
    l.Xa = function (b, c, d, e) {
        var f = this.k;
        b = pk(b, c, f[0], f[1]);
        if (b < e) {
            e = this.t;
            for (c = 0; c < e; ++c)
                d[c] = f[c];
            d.length = e;
            return b
        }
        return e
    }
        ;
    l.K = function () {
        return null === this.k ? [] : this.k.slice()
    }
        ;
    l.Zc = function (b) {
        return ae(this.k, b)
    }
        ;
    l.I = function () {
        return "Point"
    }
        ;
    l.ja = function (b) {
        return Zd(b, this.k[0], this.k[1])
    }
        ;
    l.V = function (b, c) {
        null === b ? Fk(this, "XY", null) : (lk(this, c, b, 0),
            null === this.k && (this.k = []),
            this.k.length = vk(this.k, b),
            this.o())
    }
        ;
    function Fk(b, c, d) {
        kk(b, c, d);
        b.o()
    }
    ; function Gk(b, c, d, e, f) {
        return !ee(f, function (f) {
            return !Hk(b, c, d, e, f[0], f[1])
        })
    }
    function Hk(b, c, d, e, f, g) {
        for (var h = !1, k = b[d - e], n = b[d - e + 1]; c < d; c += e) {
            var p = b[c]
                , q = b[c + 1];
            n > g != q > g && f < (p - k) * (g - n) / (q - n) + k && (h = !h);
            k = p;
            n = q
        }
        return h
    }
    function Ik(b, c, d, e, f, g) {
        if (0 === d.length || !Hk(b, c, d[0], e, f, g))
            return !1;
        var h;
        c = 1;
        for (h = d.length; c < h; ++c)
            if (Hk(b, d[c - 1], d[c], e, f, g))
                return !1;
        return !0
    }
    ; function Jk(b, c, d, e, f, g, h) {
        var k, n, p, q, r, s = f[g + 1], u = [], y = d[0];
        p = b[y - e];
        r = b[y - e + 1];
        for (k = c; k < y; k += e) {
            q = b[k];
            n = b[k + 1];
            if (s <= r && n <= s || r <= s && s <= n)
                p = (s - r) / (n - r) * (q - p) + p,
                    u.push(p);
            p = q;
            r = n
        }
        y = NaN;
        r = -Infinity;
        u.sort();
        p = u[0];
        k = 1;
        for (n = u.length; k < n; ++k) {
            q = u[k];
            var A = Math.abs(q - p);
            A > r && (p = (p + q) / 2,
                Ik(b, c, d, e, p, s) && (y = p,
                    r = A));
            p = q
        }
        isNaN(y) && (y = f[g]);
        return m(h) ? (h.push(y, s),
            h) : [y, s]
    }
    ; function Kk(b, c, d, e, f) {
        for (var g = [b[c], b[c + 1]], h = [], k; c + e < d; c += e) {
            h[0] = b[c + e];
            h[1] = b[c + e + 1];
            if (k = f(g, h))
                return k;
            g[0] = h[0];
            g[1] = h[1]
        }
        return !1
    }
    ; function Lk(b, c, d, e, f) {
        var g = de(Rd(), b, c, d, e);
        return oe(f, g) ? Yd(f, g) || g[0] >= f[0] && g[2] <= f[2] || g[1] >= f[1] && g[3] <= f[3] ? !0 : Kk(b, c, d, e, function (b, c) {
            var d = !1
                , e = $d(f, b)
                , g = $d(f, c);
            if (1 === e || 1 === g)
                d = !0;
            else {
                var r = f[0]
                    , s = f[1]
                    , u = f[2]
                    , y = f[3]
                    , A = c[0]
                    , z = c[1]
                    , D = (z - b[1]) / (A - b[0]);
                g & 2 && !(e & 2) ? (s = A - (z - y) / D,
                    d = s >= r && s <= u) : g & 4 && !(e & 4) ? (r = z - (A - u) * D,
                        d = r >= s && r <= y) : g & 8 && !(e & 8) ? (s = A - (z - s) / D,
                            d = s >= r && s <= u) : g & 16 && !(e & 16) && (r = z - (A - r) * D,
                                d = r >= s && r <= y)
            }
            return d
        }) : !1
    }
    function Mk(b, c, d, e, f) {
        var g = d[0];
        if (!(Lk(b, c, g, e, f) || Hk(b, c, g, e, f[0], f[1]) || Hk(b, c, g, e, f[0], f[3]) || Hk(b, c, g, e, f[2], f[1]) || Hk(b, c, g, e, f[2], f[3])))
            return !1;
        if (1 === d.length)
            return !0;
        c = 1;
        for (g = d.length; c < g; ++c)
            if (Gk(b, d[c - 1], d[c], e, f))
                return !1;
        return !0
    }
    ; function Nk(b, c, d, e) {
        for (var f = 0, g = b[d - e], h = b[d - e + 1]; c < d; c += e)
            var k = b[c]
                , n = b[c + 1]
                , f = f + (k - g) * (n + h)
                , g = k
                , h = n;
        return 0 < f
    }
    function Ok(b, c, d) {
        var e = 0, f, g;
        f = 0;
        for (g = c.length; f < g; ++f) {
            var h = c[f]
                , e = Nk(b, e, h, d);
            if (0 === f ? !e : e)
                return !1;
            e = h
        }
        return !0
    }
    function Pk(b, c, d, e) {
        var f, g;
        f = 0;
        for (g = d.length; f < g; ++f) {
            var h = d[f]
                , k = Nk(b, c, h, e);
            if (0 === f ? !k : k)
                for (var k = b, n = h, p = e; c < n - p;) {
                    var q;
                    for (q = 0; q < p; ++q) {
                        var r = k[c + q];
                        k[c + q] = k[n - p + q];
                        k[n - p + q] = r
                    }
                    c += p;
                    n -= p
                }
            c = h
        }
        return c
    }
    ; function G(b, c) {
        ik.call(this);
        this.b = [];
        this.p = -1;
        this.q = null;
        this.F = this.r = this.s = -1;
        this.j = null;
        this.V(b, c)
    }
    v(G, ik);
    l = G.prototype;
    l.dh = function (b) {
        null === this.k ? this.k = b.k.slice() : Za(this.k, b.k);
        this.b.push(this.k.length);
        this.o()
    }
        ;
    l.clone = function () {
        var b = new G(null);
        Qk(b, this.a, this.k.slice(), this.b.slice());
        return b
    }
        ;
    l.Xa = function (b, c, d, e) {
        if (e < Xd(this.D(), b, c))
            return e;
        this.r != this.d && (this.s = Math.sqrt(sk(this.k, 0, this.b, this.t, 0)),
            this.r = this.d);
        return uk(this.k, 0, this.b, this.t, this.s, !0, b, c, d, e)
    }
        ;
    l.Jb = function (b, c) {
        return Ik(Rk(this), 0, this.b, this.t, b, c)
    }
        ;
    l.Cj = function () {
        return nk(Rk(this), 0, this.b, this.t)
    }
        ;
    l.K = function () {
        return zk(this.k, 0, this.b, this.t)
    }
        ;
    function Sk(b) {
        if (b.p != b.d) {
            var c = ie(b.D());
            b.q = Jk(Rk(b), 0, b.b, b.t, c, 0);
            b.p = b.d
        }
        return b.q
    }
    l.yh = function () {
        return new Ek(Sk(this))
    }
        ;
    l.Eh = function () {
        return this.b.length
    }
        ;
    l.Dh = function (b) {
        if (0 > b || this.b.length <= b)
            return null;
        var c = new Ck(null);
        Dk(c, this.a, this.k.slice(0 === b ? 0 : this.b[b - 1], this.b[b]));
        return c
    }
        ;
    l.fd = function () {
        var b = this.a, c = this.k, d = this.b, e = [], f = 0, g, h;
        g = 0;
        for (h = d.length; g < h; ++g) {
            var k = d[g]
                , n = new Ck(null);
            Dk(n, b, c.slice(f, k));
            e.push(n);
            f = k
        }
        return e
    }
        ;
    function Rk(b) {
        if (b.F != b.d) {
            var c = b.k;
            Ok(c, b.b, b.t) ? b.j = c : (b.j = c.slice(),
                b.j.length = Pk(b.j, 0, b.b, b.t));
            b.F = b.d
        }
        return b.j
    }
    l.mc = function (b) {
        var c = []
            , d = [];
        c.length = Bk(this.k, 0, this.b, this.t, Math.sqrt(b), c, 0, d);
        b = new G(null);
        Qk(b, "XY", c, d);
        return b
    }
        ;
    l.I = function () {
        return "Polygon"
    }
        ;
    l.ja = function (b) {
        return Mk(Rk(this), 0, this.b, this.t, b)
    }
        ;
    l.V = function (b, c) {
        if (null === b)
            Qk(this, "XY", null, this.b);
        else {
            lk(this, c, b, 2);
            null === this.k && (this.k = []);
            var d = xk(this.k, 0, b, this.t, this.b);
            this.k.length = 0 === d.length ? 0 : d[d.length - 1];
            this.o()
        }
    }
        ;
    function Qk(b, c, d, e) {
        kk(b, c, d);
        b.b = e;
        b.o()
    }
    function Tk(b, c, d, e) {
        var f = m(e) ? e : 32;
        e = [];
        var g;
        for (g = 0; g < f; ++g)
            Za(e, b.offset(c, d, 2 * Math.PI * g / f));
        e.push(e[0], e[1]);
        b = new G(null);
        Qk(b, "XY", e, [e.length]);
        return b
    }
    ; function Uk(b, c, d, e, f, g, h) {
        pc.call(this, b, c);
        this.vectorContext = d;
        this.a = e;
        this.frameState = f;
        this.context = g;
        this.glContext = h
    }
    v(Uk, pc);
    function Vk(b) {
        this.b = this.d = this.f = this.c = this.a = null;
        this.e = b
    }
    v(Vk, kc);
    function Wk(b) {
        var c = b.f
            , d = b.d;
        b = Ra([c, [c[0], d[1]], d, [d[0], c[1]]], b.a.ia, b.a);
        b[4] = b[0].slice();
        return new G([b])
    }
    Vk.prototype.M = function () {
        this.setMap(null)
    }
        ;
    Vk.prototype.g = function (b) {
        var c = this.b
            , d = this.e;
        b.vectorContext.ic(Infinity, function (b) {
            b.za(d.f, d.b);
            b.Aa(d.d);
            b.Rb(c, null)
        })
    }
        ;
    Vk.prototype.N = function () {
        return this.b
    }
        ;
    function Xk(b) {
        null === b.a || null === b.f || null === b.d || b.a.render()
    }
    Vk.prototype.setMap = function (b) {
        null !== this.c && (Tc(this.c),
            this.c = null,
            this.a.render(),
            this.a = null);
        this.a = b;
        null !== this.a && (this.c = w(b, "postcompose", this.g, !1, this),
            Xk(this))
    }
        ;
    function Yk(b, c) {
        pc.call(this, b);
        this.coordinate = c
    }
    v(Yk, pc);
    function Zk(b) {
        Vj.call(this, {
            handleDownEvent: $k,
            handleDragEvent: al,
            handleUpEvent: bl
        });
        b = m(b) ? b : {};
        this.e = new Vk(m(b.style) ? b.style : null);
        this.c = null;
        this.i = m(b.condition) ? b.condition : Zc
    }
    v(Zk, Vj);
    function al(b) {
        if (Uj(b)) {
            var c = this.e;
            b = b.pixel;
            c.f = this.c;
            c.d = b;
            c.b = Wk(c);
            Xk(c)
        }
    }
    Zk.prototype.N = function () {
        return this.e.N()
    }
        ;
    Zk.prototype.g = ca;
    function bl(b) {
        if (!Uj(b))
            return !0;
        this.e.setMap(null);
        var c = b.pixel[0] - this.c[0]
            , d = b.pixel[1] - this.c[1];
        64 <= c * c + d * d && (this.g(b),
            this.dispatchEvent(new Yk("boxend", b.coordinate)));
        return !1
    }
    function $k(b) {
        if (Uj(b) && xc(b.a) && this.i(b)) {
            this.c = b.pixel;
            this.e.setMap(b.map);
            var c = this.e
                , d = this.c;
            c.f = this.c;
            c.d = d;
            c.b = Wk(c);
            Xk(c);
            this.dispatchEvent(new Yk("boxstart", b.coordinate));
            return !0
        }
        return !1
    }
    ; function cl() {
        this.d = -1
    }
    ; function dl() {
        this.d = -1;
        this.d = 64;
        this.a = Array(4);
        this.f = Array(this.d);
        this.c = this.b = 0;
        this.a[0] = 1732584193;
        this.a[1] = 4023233417;
        this.a[2] = 2562383102;
        this.a[3] = 271733878;
        this.c = this.b = 0
    }
    v(dl, cl);
    function el(b, c, d) {
        d || (d = 0);
        var e = Array(16);
        if (ia(c))
            for (var f = 0; 16 > f; ++f)
                e[f] = c.charCodeAt(d++) | c.charCodeAt(d++) << 8 | c.charCodeAt(d++) << 16 | c.charCodeAt(d++) << 24;
        else
            for (f = 0; 16 > f; ++f)
                e[f] = c[d++] | c[d++] << 8 | c[d++] << 16 | c[d++] << 24;
        c = b.a[0];
        d = b.a[1];
        var f = b.a[2]
            , g = b.a[3]
            , h = 0
            , h = c + (g ^ d & (f ^ g)) + e[0] + 3614090360 & 4294967295;
        c = d + (h << 7 & 4294967295 | h >>> 25);
        h = g + (f ^ c & (d ^ f)) + e[1] + 3905402710 & 4294967295;
        g = c + (h << 12 & 4294967295 | h >>> 20);
        h = f + (d ^ g & (c ^ d)) + e[2] + 606105819 & 4294967295;
        f = g + (h << 17 & 4294967295 | h >>> 15);
        h = d + (c ^ f & (g ^ c)) + e[3] + 3250441966 & 4294967295;
        d = f + (h << 22 & 4294967295 | h >>> 10);
        h = c + (g ^ d & (f ^ g)) + e[4] + 4118548399 & 4294967295;
        c = d + (h << 7 & 4294967295 | h >>> 25);
        h = g + (f ^ c & (d ^ f)) + e[5] + 1200080426 & 4294967295;
        g = c + (h << 12 & 4294967295 | h >>> 20);
        h = f + (d ^ g & (c ^ d)) + e[6] + 2821735955 & 4294967295;
        f = g + (h << 17 & 4294967295 | h >>> 15);
        h = d + (c ^ f & (g ^ c)) + e[7] + 4249261313 & 4294967295;
        d = f + (h << 22 & 4294967295 | h >>> 10);
        h = c + (g ^ d & (f ^ g)) + e[8] + 1770035416 & 4294967295;
        c = d + (h << 7 & 4294967295 | h >>> 25);
        h = g + (f ^ c & (d ^ f)) + e[9] + 2336552879 & 4294967295;
        g = c + (h << 12 & 4294967295 | h >>> 20);
        h = f + (d ^ g & (c ^ d)) + e[10] + 4294925233 & 4294967295;
        f = g + (h << 17 & 4294967295 | h >>> 15);
        h = d + (c ^ f & (g ^ c)) + e[11] + 2304563134 & 4294967295;
        d = f + (h << 22 & 4294967295 | h >>> 10);
        h = c + (g ^ d & (f ^ g)) + e[12] + 1804603682 & 4294967295;
        c = d + (h << 7 & 4294967295 | h >>> 25);
        h = g + (f ^ c & (d ^ f)) + e[13] + 4254626195 & 4294967295;
        g = c + (h << 12 & 4294967295 | h >>> 20);
        h = f + (d ^ g & (c ^ d)) + e[14] + 2792965006 & 4294967295;
        f = g + (h << 17 & 4294967295 | h >>> 15);
        h = d + (c ^ f & (g ^ c)) + e[15] + 1236535329 & 4294967295;
        d = f + (h << 22 & 4294967295 | h >>> 10);
        h = c + (f ^ g & (d ^ f)) + e[1] + 4129170786 & 4294967295;
        c = d + (h << 5 & 4294967295 | h >>> 27);
        h = g + (d ^ f & (c ^ d)) + e[6] + 3225465664 & 4294967295;
        g = c + (h << 9 & 4294967295 | h >>> 23);
        h = f + (c ^ d & (g ^ c)) + e[11] + 643717713 & 4294967295;
        f = g + (h << 14 & 4294967295 | h >>> 18);
        h = d + (g ^ c & (f ^ g)) + e[0] + 3921069994 & 4294967295;
        d = f + (h << 20 & 4294967295 | h >>> 12);
        h = c + (f ^ g & (d ^ f)) + e[5] + 3593408605 & 4294967295;
        c = d + (h << 5 & 4294967295 | h >>> 27);
        h = g + (d ^ f & (c ^ d)) + e[10] + 38016083 & 4294967295;
        g = c + (h << 9 & 4294967295 | h >>> 23);
        h = f + (c ^ d & (g ^ c)) + e[15] + 3634488961 & 4294967295;
        f = g + (h << 14 & 4294967295 | h >>> 18);
        h = d + (g ^ c & (f ^ g)) + e[4] + 3889429448 & 4294967295;
        d = f + (h << 20 & 4294967295 | h >>> 12);
        h = c + (f ^ g & (d ^ f)) + e[9] + 568446438 & 4294967295;
        c = d + (h << 5 & 4294967295 | h >>> 27);
        h = g + (d ^ f & (c ^ d)) + e[14] + 3275163606 & 4294967295;
        g = c + (h << 9 & 4294967295 | h >>> 23);
        h = f + (c ^ d & (g ^ c)) + e[3] + 4107603335 & 4294967295;
        f = g + (h << 14 & 4294967295 | h >>> 18);
        h = d + (g ^ c & (f ^ g)) + e[8] + 1163531501 & 4294967295;
        d = f + (h << 20 & 4294967295 | h >>> 12);
        h = c + (f ^ g & (d ^ f)) + e[13] + 2850285829 & 4294967295;
        c = d + (h << 5 & 4294967295 | h >>> 27);
        h = g + (d ^ f & (c ^ d)) + e[2] + 4243563512 & 4294967295;
        g = c + (h << 9 & 4294967295 | h >>> 23);
        h = f + (c ^ d & (g ^ c)) + e[7] + 1735328473 & 4294967295;
        f = g + (h << 14 & 4294967295 | h >>> 18);
        h = d + (g ^ c & (f ^ g)) + e[12] + 2368359562 & 4294967295;
        d = f + (h << 20 & 4294967295 | h >>> 12);
        h = c + (d ^ f ^ g) + e[5] + 4294588738 & 4294967295;
        c = d + (h << 4 & 4294967295 | h >>> 28);
        h = g + (c ^ d ^ f) + e[8] + 2272392833 & 4294967295;
        g = c + (h << 11 & 4294967295 | h >>> 21);
        h = f + (g ^ c ^ d) + e[11] + 1839030562 & 4294967295;
        f = g + (h << 16 & 4294967295 | h >>> 16);
        h = d + (f ^ g ^ c) + e[14] + 4259657740 & 4294967295;
        d = f + (h << 23 & 4294967295 | h >>> 9);
        h = c + (d ^ f ^ g) + e[1] + 2763975236 & 4294967295;
        c = d + (h << 4 & 4294967295 | h >>> 28);
        h = g + (c ^ d ^ f) + e[4] + 1272893353 & 4294967295;
        g = c + (h << 11 & 4294967295 | h >>> 21);
        h = f + (g ^ c ^ d) + e[7] + 4139469664 & 4294967295;
        f = g + (h << 16 & 4294967295 | h >>> 16);
        h = d + (f ^ g ^ c) + e[10] + 3200236656 & 4294967295;
        d = f + (h << 23 & 4294967295 | h >>> 9);
        h = c + (d ^ f ^ g) + e[13] + 681279174 & 4294967295;
        c = d + (h << 4 & 4294967295 | h >>> 28);
        h = g + (c ^ d ^ f) + e[0] + 3936430074 & 4294967295;
        g = c + (h << 11 & 4294967295 | h >>> 21);
        h = f + (g ^ c ^ d) + e[3] + 3572445317 & 4294967295;
        f = g + (h << 16 & 4294967295 | h >>> 16);
        h = d + (f ^ g ^ c) + e[6] + 76029189 & 4294967295;
        d = f + (h << 23 & 4294967295 | h >>> 9);
        h = c + (d ^ f ^ g) + e[9] + 3654602809 & 4294967295;
        c = d + (h << 4 & 4294967295 | h >>> 28);
        h = g + (c ^ d ^ f) + e[12] + 3873151461 & 4294967295;
        g = c + (h << 11 & 4294967295 | h >>> 21);
        h = f + (g ^ c ^ d) + e[15] + 530742520 & 4294967295;
        f = g + (h << 16 & 4294967295 | h >>> 16);
        h = d + (f ^ g ^ c) + e[2] + 3299628645 & 4294967295;
        d = f + (h << 23 & 4294967295 | h >>> 9);
        h = c + (f ^ (d | ~g)) + e[0] + 4096336452 & 4294967295;
        c = d + (h << 6 & 4294967295 | h >>> 26);
        h = g + (d ^ (c | ~f)) + e[7] + 1126891415 & 4294967295;
        g = c + (h << 10 & 4294967295 | h >>> 22);
        h = f + (c ^ (g | ~d)) + e[14] + 2878612391 & 4294967295;
        f = g + (h << 15 & 4294967295 | h >>> 17);
        h = d + (g ^ (f | ~c)) + e[5] + 4237533241 & 4294967295;
        d = f + (h << 21 & 4294967295 | h >>> 11);
        h = c + (f ^ (d | ~g)) + e[12] + 1700485571 & 4294967295;
        c = d + (h << 6 & 4294967295 | h >>> 26);
        h = g + (d ^ (c | ~f)) + e[3] + 2399980690 & 4294967295;
        g = c + (h << 10 & 4294967295 | h >>> 22);
        h = f + (c ^ (g | ~d)) + e[10] + 4293915773 & 4294967295;
        f = g + (h << 15 & 4294967295 | h >>> 17);
        h = d + (g ^ (f | ~c)) + e[1] + 2240044497 & 4294967295;
        d = f + (h << 21 & 4294967295 | h >>> 11);
        h = c + (f ^ (d | ~g)) + e[8] + 1873313359 & 4294967295;
        c = d + (h << 6 & 4294967295 | h >>> 26);
        h = g + (d ^ (c | ~f)) + e[15] + 4264355552 & 4294967295;
        g = c + (h << 10 & 4294967295 | h >>> 22);
        h = f + (c ^ (g | ~d)) + e[6] + 2734768916 & 4294967295;
        f = g + (h << 15 & 4294967295 | h >>> 17);
        h = d + (g ^ (f | ~c)) + e[13] + 1309151649 & 4294967295;
        d = f + (h << 21 & 4294967295 | h >>> 11);
        h = c + (f ^ (d | ~g)) + e[4] + 4149444226 & 4294967295;
        c = d + (h << 6 & 4294967295 | h >>> 26);
        h = g + (d ^ (c | ~f)) + e[11] + 3174756917 & 4294967295;
        g = c + (h << 10 & 4294967295 | h >>> 22);
        h = f + (c ^ (g | ~d)) + e[2] + 718787259 & 4294967295;
        f = g + (h << 15 & 4294967295 | h >>> 17);
        h = d + (g ^ (f | ~c)) + e[9] + 3951481745 & 4294967295;
        b.a[0] = b.a[0] + c & 4294967295;
        b.a[1] = b.a[1] + (f + (h << 21 & 4294967295 | h >>> 11)) & 4294967295;
        b.a[2] = b.a[2] + f & 4294967295;
        b.a[3] = b.a[3] + g & 4294967295
    }
    dl.prototype.update = function (b, c) {
        m(c) || (c = b.length);
        for (var d = c - this.d, e = this.f, f = this.b, g = 0; g < c;) {
            if (0 == f)
                for (; g <= d;)
                    el(this, b, g),
                        g += this.d;
            if (ia(b))
                for (; g < c;) {
                    if (e[f++] = b.charCodeAt(g++),
                        f == this.d) {
                        el(this, e);
                        f = 0;
                        break
                    }
                }
            else
                for (; g < c;)
                    if (e[f++] = b[g++],
                        f == this.d) {
                        el(this, e);
                        f = 0;
                        break
                    }
        }
        this.b = f;
        this.c += c
    }
        ;
    function fl(b) {
        b = m(b) ? b : {};
        this.a = m(b.color) ? b.color : null;
        this.c = b.lineCap;
        this.b = m(b.lineDash) ? b.lineDash : null;
        this.f = b.lineJoin;
        this.e = b.miterLimit;
        this.d = b.width;
        this.g = void 0
    }
    l = fl.prototype;
    l.nk = function () {
        return this.a
    }
        ;
    l.Ah = function () {
        return this.c
    }
        ;
    l.ok = function () {
        return this.b
    }
        ;
    l.Bh = function () {
        return this.f
    }
        ;
    l.Gh = function () {
        return this.e
    }
        ;
    l.pk = function () {
        return this.d
    }
        ;
    l.qk = function (b) {
        this.a = b;
        this.g = void 0
    }
        ;
    l.zl = function (b) {
        this.c = b;
        this.g = void 0
    }
        ;
    l.rk = function (b) {
        this.b = b;
        this.g = void 0
    }
        ;
    l.Al = function (b) {
        this.f = b;
        this.g = void 0
    }
        ;
    l.Bl = function (b) {
        this.e = b;
        this.g = void 0
    }
        ;
    l.Jl = function (b) {
        this.d = b;
        this.g = void 0
    }
        ;
    l.vb = function () {
        if (!m(this.g)) {
            var b = "s" + (null === this.a ? "-" : sg(this.a)) + "," + (m(this.c) ? this.c.toString() : "-") + "," + (null === this.b ? "-" : this.b.toString()) + "," + (m(this.f) ? this.f : "-") + "," + (m(this.e) ? this.e.toString() : "-") + "," + (m(this.d) ? this.d.toString() : "-")
                , c = new dl;
            c.update(b);
            var d = Array((56 > c.b ? c.d : 2 * c.d) - c.b);
            d[0] = 128;
            for (b = 1; b < d.length - 8; ++b)
                d[b] = 0;
            for (var e = 8 * c.c, b = d.length - 8; b < d.length; ++b)
                d[b] = e & 255,
                    e /= 256;
            c.update(d);
            d = Array(16);
            for (b = e = 0; 4 > b; ++b)
                for (var f = 0; 32 > f; f += 8)
                    d[e++] = c.a[b] >>> f & 255;
            if (8192 > d.length)
                c = String.fromCharCode.apply(null, d);
            else
                for (c = "",
                    b = 0; b < d.length; b += 8192)
                    c += String.fromCharCode.apply(null, ab(d, b, b + 8192));
            this.g = c
        }
        return this.g
    }
        ;
    var gl = [0, 0, 0, 1]
        , hl = []
        , il = [0, 0, 0, 1];
    function jl(b) {
        b = m(b) ? b : {};
        this.a = m(b.color) ? b.color : null;
        this.d = void 0
    }
    jl.prototype.b = function () {
        return this.a
    }
        ;
    jl.prototype.c = function (b) {
        this.a = b;
        this.d = void 0
    }
        ;
    jl.prototype.vb = function () {
        m(this.d) || (this.d = "f" + (null === this.a ? "-" : sg(this.a)));
        return this.d
    }
        ;
    function kl(b) {
        b = m(b) ? b : {};
        this.e = this.a = this.f = null;
        this.c = m(b.fill) ? b.fill : null;
        this.d = m(b.stroke) ? b.stroke : null;
        this.b = b.radius;
        this.l = [0, 0];
        this.j = this.s = this.g = null;
        var c = b.atlasManager, d, e = null, f, g = 0;
        null !== this.d && (f = sg(this.d.a),
            g = this.d.d,
            m(g) || (g = 1),
            e = this.d.b,
            Zf || (e = null));
        var h = 2 * (this.b + g) + 1;
        f = {
            strokeStyle: f,
            Oc: g,
            size: h,
            lineDash: e
        };
        m(c) ? (h = Math.round(h),
            (e = null === this.c) && (d = ra(this.Kf, this, f)),
            g = this.vb(),
            f = c.add(g, h, h, ra(this.Lf, this, f), d),
            this.a = f.image,
            this.l = [f.offsetX, f.offsetY],
            d = f.image.width,
            this.e = e ? f.sf : this.a) : (this.a = Gf("CANVAS"),
                this.a.height = h,
                this.a.width = h,
                d = h = this.a.width,
                c = this.a.getContext("2d"),
                this.Lf(f, c, 0, 0),
                null === this.c ? (c = this.e = Gf("CANVAS"),
                    c.height = f.size,
                    c.width = f.size,
                    c = c.getContext("2d"),
                    this.Kf(f, c, 0, 0)) : this.e = this.a);
        this.g = [h / 2, h / 2];
        this.s = [h, h];
        this.j = [d, d];
        nj.call(this, {
            opacity: 1,
            rotateWithView: !1,
            rotation: 0,
            scale: 1,
            snapToPixel: m(b.snapToPixel) ? b.snapToPixel : !0
        })
    }
    v(kl, nj);
    l = kl.prototype;
    l.ub = function () {
        return this.g
    }
        ;
    l.ek = function () {
        return this.c
    }
        ;
    l.Ed = function () {
        return this.e
    }
        ;
    l.zb = function () {
        return this.a
    }
        ;
    l.Jc = function () {
        return 2
    }
        ;
    l.ed = function () {
        return this.j
    }
        ;
    l.Ab = function () {
        return this.l
    }
        ;
    l.fk = function () {
        return this.b
    }
        ;
    l.cb = function () {
        return this.s
    }
        ;
    l.gk = function () {
        return this.d
    }
        ;
    l.ve = ca;
    l.load = ca;
    l.Ne = ca;
    l.Lf = function (b, c, d, e) {
        c.setTransform(1, 0, 0, 1, 0, 0);
        c.translate(d, e);
        c.beginPath();
        c.arc(b.size / 2, b.size / 2, this.b, 0, 2 * Math.PI, !0);
        null !== this.c && (c.fillStyle = sg(this.c.a),
            c.fill());
        null !== this.d && (c.strokeStyle = b.strokeStyle,
            c.lineWidth = b.Oc,
            null === b.lineDash || c.setLineDash(b.lineDash),
            c.stroke());
        c.closePath()
    }
        ;
    l.Kf = function (b, c, d, e) {
        c.setTransform(1, 0, 0, 1, 0, 0);
        c.translate(d, e);
        c.beginPath();
        c.arc(b.size / 2, b.size / 2, this.b, 0, 2 * Math.PI, !0);
        c.fillStyle = gl;
        c.fill();
        null !== this.d && (c.strokeStyle = b.strokeStyle,
            c.lineWidth = b.Oc,
            null === b.lineDash || c.setLineDash(b.lineDash),
            c.stroke());
        c.closePath()
    }
        ;
    l.vb = function () {
        var b = null === this.d ? "-" : this.d.vb()
            , c = null === this.c ? "-" : this.c.vb();
        if (null === this.f || b != this.f[1] || c != this.f[2] || this.b != this.f[3])
            this.f = ["c" + b + c + (m(this.b) ? this.b.toString() : "-"), b, c, this.b];
        return this.f[0]
    }
        ;
    function ll(b) {
        b = m(b) ? b : {};
        this.g = null;
        this.c = ml;
        m(b.geometry) && this.Of(b.geometry);
        this.f = m(b.fill) ? b.fill : null;
        this.e = m(b.image) ? b.image : null;
        this.b = m(b.stroke) ? b.stroke : null;
        this.d = m(b.text) ? b.text : null;
        this.a = b.zIndex
    }
    l = ll.prototype;
    l.N = function () {
        return this.g
    }
        ;
    l.uh = function () {
        return this.c
    }
        ;
    l.sk = function () {
        return this.f
    }
        ;
    l.tk = function () {
        return this.e
    }
        ;
    l.uk = function () {
        return this.b
    }
        ;
    l.vk = function () {
        return this.d
    }
        ;
    l.Wh = function () {
        return this.a
    }
        ;
    l.Of = function (b) {
        ka(b) ? this.c = b : ia(b) ? this.c = function (c) {
            return c.get(b)
        }
            : null === b ? this.c = ml : m(b) && (this.c = function () {
                return b
            }
            );
        this.g = b
    }
        ;
    l.Ll = function (b) {
        this.a = b
    }
        ;
    function nl(b) {
        ka(b) || (b = ga(b) ? b : [b],
            b = Xc(b));
        return b
    }
    function pl() {
        var b = new jl({
            color: "rgba(255,255,255,0.4)"
        })
            , c = new fl({
                color: "#3399CC",
                width: 1.25
            })
            , d = [new ll({
                image: new kl({
                    fill: b,
                    stroke: c,
                    radius: 5
                }),
                fill: b,
                stroke: c
            })];
        pl = function () {
            return d
        }
            ;
        return d
    }
    function ql() {
        var b = {}
            , c = [255, 255, 255, 1]
            , d = [0, 153, 255, 1];
        b.Polygon = [new ll({
            fill: new jl({
                color: [255, 255, 255, .5]
            })
        })];
        b.MultiPolygon = b.Polygon;
        b.LineString = [new ll({
            stroke: new fl({
                color: c,
                width: 5
            })
        }), new ll({
            stroke: new fl({
                color: d,
                width: 3
            })
        })];
        b.MultiLineString = b.LineString;
        b.Point = [new ll({
            image: new kl({
                radius: 6,
                fill: new jl({
                    color: d
                }),
                stroke: new fl({
                    color: c,
                    width: 1.5
                })
            }),
            zIndex: Infinity
        })];
        b.MultiPoint = b.Point;
        b.GeometryCollection = b.Polygon.concat(b.Point);
        return b
    }
    function ml(b) {
        return b.N()
    }
    ; function rl(b) {
        var c = m(b) ? b : {};
        b = m(c.condition) ? c.condition : Sj;
        c = m(c.style) ? c.style : new ll({
            stroke: new fl({
                color: [0, 0, 255, 1]
            })
        });
        Zk.call(this, {
            condition: b,
            style: c
        })
    }
    v(rl, Zk);
    rl.prototype.g = function () {
        var b = this.n
            , c = b.a()
            , d = this.N().D()
            , e = ie(d)
            , f = b.f()
            , d = c.n(d, f)
            , d = c.constrainResolution(d, 0, void 0);
        Lj(b, c, d, e, 200)
    }
        ;
    function sl(b) {
        Ij.call(this, {
            handleEvent: tl
        });
        b = m(b) ? b : {};
        this.c = m(b.condition) ? b.condition : dd(Rj, Tj);
        this.f = m(b.pixelDelta) ? b.pixelDelta : 128
    }
    v(sl, Ij);
    function tl(b) {
        var c = !1;
        if ("key" == b.type) {
            var d = b.a.f;
            if (this.c(b) && (40 == d || 37 == d || 39 == d || 38 == d)) {
                var e = b.map
                    , c = e.a()
                    , f = Xe(c)
                    , g = f.resolution * this.f
                    , h = 0
                    , k = 0;
                40 == d ? k = -g : 37 == d ? h = -g : 39 == d ? h = g : k = g;
                d = [h, k];
                zd(d, f.rotation);
                f = c.b();
                m(f) && (m(100) && e.Wa(df({
                    source: f,
                    duration: 100,
                    easing: bf
                })),
                    e = c.i([f[0] + d[0], f[1] + d[1]]),
                    c.Ra(e));
                b.preventDefault();
                c = !0
            }
        }
        return !c
    }
    ; function ul(b) {
        Ij.call(this, {
            handleEvent: vl
        });
        b = m(b) ? b : {};
        this.f = m(b.condition) ? b.condition : Tj;
        this.c = m(b.delta) ? b.delta : 1;
        this.e = m(b.duration) ? b.duration : 100
    }
    v(ul, Ij);
    function vl(b) {
        var c = !1;
        if ("key" == b.type) {
            var d = b.a.i;
            if (this.f(b) && (43 == d || 45 == d)) {
                c = b.map;
                d = 43 == d ? this.c : -this.c;
                c.render();
                var e = c.a();
                Kj(c, e, d, void 0, this.e);
                b.preventDefault();
                c = !0
            }
        }
        return !c
    }
    ; function wl(b) {
        Ij.call(this, {
            handleEvent: xl
        });
        b = m(b) ? b : {};
        this.c = 0;
        this.l = m(b.duration) ? b.duration : 250;
        this.e = null;
        this.g = this.f = void 0
    }
    v(wl, Ij);
    function xl(b) {
        var c = !1;
        if ("mousewheel" == b.type) {
            var c = b.map
                , d = b.a;
            this.e = b.coordinate;
            this.c += d.l;
            m(this.f) || (this.f = ua());
            d = Math.max(80 - (ua() - this.f), 0);
            ba.clearTimeout(this.g);
            this.g = ba.setTimeout(ra(this.i, this, c), d);
            b.preventDefault();
            c = !0
        }
        return !c
    }
    wl.prototype.i = function (b) {
        var c = Ub(this.c, -1, 1)
            , d = b.a();
        b.render();
        Kj(b, d, -c, this.e, this.l);
        this.c = 0;
        this.e = null;
        this.g = this.f = void 0
    }
        ;
    function yl(b) {
        Vj.call(this, {
            handleDownEvent: zl,
            handleDragEvent: Al,
            handleUpEvent: Bl
        });
        b = m(b) ? b : {};
        this.e = null;
        this.g = void 0;
        this.c = !1;
        this.i = 0;
        this.l = m(b.threshold) ? b.threshold : .3
    }
    v(yl, Vj);
    function Al(b) {
        var c = 0
            , d = this.f[0]
            , e = this.f[1]
            , d = Math.atan2(e.clientY - d.clientY, e.clientX - d.clientX);
        m(this.g) && (c = d - this.g,
            this.i += c,
            !this.c && Math.abs(this.i) > this.l && (this.c = !0));
        this.g = d;
        b = b.map;
        d = Jg(b.b);
        e = Xj(this.f);
        e[0] -= d.x;
        e[1] -= d.y;
        this.e = b.ia(e);
        this.c && (d = b.a(),
            e = d.c(),
            b.render(),
            Jj(b, d, e + c, this.e))
    }
    function Bl(b) {
        if (2 > this.f.length) {
            b = b.map;
            var c = b.a();
            Ze(c, -1);
            if (this.c) {
                var d = c.c()
                    , e = this.e
                    , d = c.constrainRotation(d, 0);
                Jj(b, c, d, e, 250)
            }
            return !1
        }
        return !0
    }
    function zl(b) {
        return 2 <= this.f.length ? (b = b.map,
            this.e = null,
            this.g = void 0,
            this.c = !1,
            this.i = 0,
            this.p || Ze(b.a(), 1),
            b.render(),
            !0) : !1
    }
    yl.prototype.q = Yc;
    function Cl(b) {
        Vj.call(this, {
            handleDownEvent: Dl,
            handleDragEvent: El,
            handleUpEvent: Fl
        });
        b = m(b) ? b : {};
        this.e = null;
        this.i = m(b.duration) ? b.duration : 400;
        this.c = void 0;
        this.g = 1
    }
    v(Cl, Vj);
    function El(b) {
        var c = 1
            , d = this.f[0]
            , e = this.f[1]
            , f = d.clientX - e.clientX
            , d = d.clientY - e.clientY
            , f = Math.sqrt(f * f + d * d);
        m(this.c) && (c = this.c / f);
        this.c = f;
        1 != c && (this.g = c);
        b = b.map;
        var f = b.a()
            , d = f.a()
            , e = Jg(b.b)
            , g = Xj(this.f);
        g[0] -= e.x;
        g[1] -= e.y;
        this.e = b.ia(g);
        b.render();
        Lj(b, f, d * c, this.e)
    }
    function Fl(b) {
        if (2 > this.f.length) {
            b = b.map;
            var c = b.a();
            Ze(c, -1);
            var d = c.a()
                , e = this.e
                , f = this.i
                , d = c.constrainResolution(d, 0, this.g - 1);
            Lj(b, c, d, e, f);
            return !1
        }
        return !0
    }
    function Dl(b) {
        return 2 <= this.f.length ? (b = b.map,
            this.e = null,
            this.c = void 0,
            this.g = 1,
            this.p || Ze(b.a(), 1),
            b.render(),
            !0) : !1
    }
    Cl.prototype.q = Yc;
    function Gl(b) {
        b = m(b) ? b : {};
        var c = new C
            , d = new Fj(-.005, .05, 100);
        (m(b.altShiftDragRotate) ? b.altShiftDragRotate : 1) && c.push(new ck);
        (m(b.doubleClickZoom) ? b.doubleClickZoom : 1) && c.push(new Mj({
            delta: b.zoomDelta,
            duration: b.zoomDuration
        }));
        (m(b.dragPan) ? b.dragPan : 1) && c.push(new Yj({
            kinetic: d
        }));
        (m(b.pinchRotate) ? b.pinchRotate : 1) && c.push(new yl);
        (m(b.pinchZoom) ? b.pinchZoom : 1) && c.push(new Cl({
            duration: b.zoomDuration
        }));
        if (m(b.keyboard) ? b.keyboard : 1)
            c.push(new sl),
                c.push(new ul({
                    delta: b.zoomDelta,
                    duration: b.zoomDuration
                }));
        (m(b.mouseWheelZoom) ? b.mouseWheelZoom : 1) && c.push(new wl({
            duration: b.zoomDuration
        }));
        (m(b.shiftDragZoom) ? b.shiftDragZoom : 1) && c.push(new rl);
        return c
    }
    ; function H(b) {
        var c = m(b) ? b : {};
        b = wb(c);
        delete b.layers;
        c = c.layers;
        E.call(this, b);
        this.a = null;
        w(this, sd("layers"), this.ni, !1, this);
        null != c ? ga(c) && (c = new C(c.slice())) : c = new C;
        this.r(c)
    }
    v(H, E);
    l = H.prototype;
    l.of = function () {
        this.b() && this.o()
    }
        ;
    l.ni = function () {
        null !== this.a && (Oa(mb(this.a), Tc),
            this.a = null);
        var b = this.Zb();
        if (null != b) {
            this.a = {
                add: w(b, "add", this.mi, !1, this),
                remove: w(b, "remove", this.oi, !1, this)
            };
            var b = b.a, c, d, e;
            c = 0;
            for (d = b.length; c < d; c++)
                e = b[c],
                    this.a[ma(e).toString()] = w(e, ["propertychange", "change"], this.of, !1, this)
        }
        this.o()
    }
        ;
    l.mi = function (b) {
        b = b.element;
        this.a[ma(b).toString()] = w(b, ["propertychange", "change"], this.of, !1, this);
        this.o()
    }
        ;
    l.oi = function (b) {
        b = ma(b.element).toString();
        Tc(this.a[b]);
        delete this.a[b];
        this.o()
    }
        ;
    l.Zb = function () {
        return this.get("layers")
    }
        ;
    H.prototype.getLayers = H.prototype.Zb;
    H.prototype.r = function (b) {
        this.set("layers", b)
    }
        ;
    H.prototype.setLayers = H.prototype.r;
    H.prototype.Da = function (b) {
        var c = m(b) ? b : []
            , d = c.length;
        this.Zb().forEach(function (b) {
            b.Da(c)
        });
        b = Mi(this);
        var e, f;
        for (e = c.length; d < e; d++)
            f = c[d],
                f.brightness = Ub(f.brightness + b.brightness, -1, 1),
                f.contrast *= b.contrast,
                f.hue += b.hue,
                f.opacity *= b.opacity,
                f.saturation *= b.saturation,
                f.visible = f.visible && b.visible,
                f.maxResolution = Math.min(f.maxResolution, b.maxResolution),
                f.minResolution = Math.max(f.minResolution, b.minResolution),
                m(b.extent) && (f.extent = m(f.extent) ? ne(f.extent, b.extent) : b.extent);
        return c
    }
        ;
    H.prototype.Va = function () {
        return "ready"
    }
        ;
    function Hl(b) {
        ye.call(this, {
            code: b,
            units: "m",
            extent: Il,
            global: !0,
            worldExtent: Jl
        })
    }
    v(Hl, ye);
    Hl.prototype.re = function (b, c) {
        var d = c[1] / 6378137;
        return b / ((Math.exp(d) + Math.exp(-d)) / 2)
    }
        ;
    var Kl = 6378137 * Math.PI
        , Il = [-Kl, -Kl, Kl, Kl]
        , Jl = [-180, -85, 180, 85]
        , Je = Ra("EPSG:3857 EPSG:102100 EPSG:102113 EPSG:900913 urn:ogc:def:crs:EPSG:6.18:3:3857 urn:ogc:def:crs:EPSG::3857 http://www.opengis.net/gml/srs/epsg.xml#3857".split(" "), function (b) {
            return new Hl(b)
        });
    function Ke(b, c, d) {
        var e = b.length;
        d = 1 < d ? d : 2;
        m(c) || (2 < d ? c = b.slice() : c = Array(e));
        for (var f = 0; f < e; f += d)
            c[f] = 6378137 * Math.PI * b[f] / 180,
                c[f + 1] = 6378137 * Math.log(Math.tan(Math.PI * (b[f + 1] + 90) / 360));
        return c
    }
    function Le(b, c, d) {
        var e = b.length;
        d = 1 < d ? d : 2;
        m(c) || (2 < d ? c = b.slice() : c = Array(e));
        for (var f = 0; f < e; f += d)
            c[f] = 180 * b[f] / (6378137 * Math.PI),
                c[f + 1] = 360 * Math.atan(Math.exp(b[f + 1] / 6378137)) / Math.PI - 90;
        return c
    }
    ; function Ll(b, c) {
        ye.call(this, {
            code: b,
            units: "degrees",
            extent: Ml,
            axisOrientation: c,
            global: !0,
            worldExtent: Ml
        })
    }
    v(Ll, ye);
    Ll.prototype.re = function (b) {
        return b
    }
        ;
    var Ml = [-180, -90, 180, 90]
        , Me = [new Ll("CRS:84"), new Ll("EPSG:4326", "neu"), new Ll("urn:ogc:def:crs:EPSG::4326", "neu"), new Ll("urn:ogc:def:crs:EPSG:6.6:4326", "neu"), new Ll("urn:ogc:def:crs:OGC:1.3:CRS84"), new Ll("urn:ogc:def:crs:OGC:2:84"), new Ll("http://www.opengis.net/gml/srs/epsg.xml#4326", "neu"), new Ll("urn:x-ogc:def:crs:EPSG:4326", "neu")];
    function Nl() {
        Ee(Je);
        Ee(Me);
        Ie()
    }
    ; function I(b) {
        F.call(this, m(b) ? b : {})
    }
    v(I, F);
    function J(b) {
        b = m(b) ? b : {};
        var c = wb(b);
        delete c.preload;
        delete c.useInterimTilesOnError;
        F.call(this, c);
        this.ha(m(b.preload) ? b.preload : 0);
        this.ka(m(b.useInterimTilesOnError) ? b.useInterimTilesOnError : !0)
    }
    v(J, F);
    J.prototype.r = function () {
        return this.get("preload")
    }
        ;
    J.prototype.getPreload = J.prototype.r;
    J.prototype.ha = function (b) {
        this.set("preload", b)
    }
        ;
    J.prototype.setPreload = J.prototype.ha;
    J.prototype.da = function () {
        return this.get("useInterimTilesOnError")
    }
        ;
    J.prototype.getUseInterimTilesOnError = J.prototype.da;
    J.prototype.ka = function (b) {
        this.set("useInterimTilesOnError", b)
    }
        ;
    J.prototype.setUseInterimTilesOnError = J.prototype.ka;
    function K(b) {
        b = m(b) ? b : {};
        var c = wb(b);
        delete c.style;
        delete c.renderBuffer;
        delete c.updateWhileAnimating;
        F.call(this, c);
        this.da = m(b.renderBuffer) ? b.renderBuffer : 100;
        this.Bb = null;
        this.r = void 0;
        this.ka(b.style);
        this.vc = m(b.updateWhileAnimating) ? b.updateWhileAnimating : !1
    }
    v(K, F);
    K.prototype.Vc = function () {
        return this.Bb
    }
        ;
    K.prototype.Wc = function () {
        return this.r
    }
        ;
    K.prototype.ka = function (b) {
        this.Bb = m(b) ? b : pl;
        this.r = null === b ? void 0 : nl(this.Bb);
        this.o()
    }
        ;
    function Ol(b, c, d, e, f) {
        this.p = {};
        this.b = b;
        this.r = c;
        this.f = d;
        this.F = e;
        this.uc = f;
        this.e = this.a = this.d = this.ea = this.pa = this.oa = null;
        this.da = this.Ba = this.l = this.U = this.S = this.H = 0;
        this.ha = !1;
        this.g = this.ka = 0;
        this.ta = !1;
        this.ba = 0;
        this.c = "";
        this.i = this.s = this.Da = this.Ca = 0;
        this.ca = this.n = this.j = null;
        this.q = [];
        this.Va = Gd()
    }
    function Pl(b, c, d) {
        if (null !== b.e) {
            c = hk(c, 0, d, 2, b.F, b.q);
            d = b.b;
            var e = b.Va
                , f = d.globalAlpha;
            1 != b.l && (d.globalAlpha = f * b.l);
            var g = b.ka;
            b.ha && (g += b.uc);
            var h, k;
            h = 0;
            for (k = c.length; h < k; h += 2) {
                var n = c[h] - b.H
                    , p = c[h + 1] - b.S;
                b.ta && (n = n + .5 | 0,
                    p = p + .5 | 0);
                if (0 !== g || 1 != b.g) {
                    var q = n + b.H
                        , r = p + b.S;
                    rj(e, q, r, b.g, b.g, g, -q, -r);
                    d.setTransform(e[0], e[1], e[4], e[5], e[12], e[13])
                }
                d.drawImage(b.e, b.Ba, b.da, b.ba, b.U, n, p, b.ba, b.U)
            }
            0 === g && 1 == b.g || d.setTransform(1, 0, 0, 1, 0, 0);
            1 != b.l && (d.globalAlpha = f)
        }
    }
    function Rl(b, c, d, e) {
        var f = 0;
        if (null !== b.ca && "" !== b.c) {
            null === b.j || Sl(b, b.j);
            null === b.n || Tl(b, b.n);
            var g = b.ca
                , h = b.b
                , k = b.ea;
            null === k ? (h.font = g.font,
                h.textAlign = g.textAlign,
                h.textBaseline = g.textBaseline,
                b.ea = {
                    font: g.font,
                    textAlign: g.textAlign,
                    textBaseline: g.textBaseline
                }) : (k.font != g.font && (k.font = h.font = g.font),
                    k.textAlign != g.textAlign && (k.textAlign = h.textAlign = g.textAlign),
                    k.textBaseline != g.textBaseline && (k.textBaseline = h.textBaseline = g.textBaseline));
            c = hk(c, f, d, e, b.F, b.q);
            for (g = b.b; f < d; f += e) {
                h = c[f] + b.Ca;
                k = c[f + 1] + b.Da;
                if (0 !== b.s || 1 != b.i) {
                    var n = rj(b.Va, h, k, b.i, b.i, b.s, -h, -k);
                    g.setTransform(n[0], n[1], n[4], n[5], n[12], n[13])
                }
                null === b.n || g.strokeText(b.c, h, k);
                null === b.j || g.fillText(b.c, h, k)
            }
            0 === b.s && 1 == b.i || g.setTransform(1, 0, 0, 1, 0, 0)
        }
    }
    function Ul(b, c, d, e, f, g) {
        var h = b.b;
        b = hk(c, d, e, f, b.F, b.q);
        h.moveTo(b[0], b[1]);
        for (c = 2; c < b.length; c += 2)
            h.lineTo(b[c], b[c + 1]);
        g && h.lineTo(b[0], b[1]);
        return e
    }
    function Vl(b, c, d, e, f) {
        var g = b.b, h, k;
        h = 0;
        for (k = e.length; h < k; ++h)
            d = Ul(b, c, d, e[h], f, !0),
                g.closePath();
        return d
    }
    l = Ol.prototype;
    l.ic = function (b, c) {
        var d = b.toString()
            , e = this.p[d];
        m(e) ? e.push(c) : this.p[d] = [c]
    }
        ;
    l.jc = function (b) {
        if (oe(this.f, b.D())) {
            if (null !== this.d || null !== this.a) {
                null === this.d || Sl(this, this.d);
                null === this.a || Tl(this, this.a);
                var c;
                c = b.k;
                c = null === c ? null : hk(c, 0, c.length, b.t, this.F, this.q);
                var d = c[2] - c[0]
                    , e = c[3] - c[1]
                    , d = Math.sqrt(d * d + e * e)
                    , e = this.b;
                e.beginPath();
                e.arc(c[0], c[1], d, 0, 2 * Math.PI);
                null === this.d || e.fill();
                null === this.a || e.stroke()
            }
            "" !== this.c && Rl(this, b.xe(), 2, 2)
        }
    }
        ;
    l.ke = function (b, c) {
        var d = (0,
            c.c)(b);
        if (null != d && oe(this.f, d.D())) {
            var e = c.a;
            m(e) || (e = 0);
            this.ic(e, function (b) {
                b.za(c.f, c.b);
                b.fb(c.e);
                b.Aa(c.d);
                Wl[d.I()].call(b, d, null)
            })
        }
    }
        ;
    l.ad = function (b, c) {
        var d = b.c, e, f;
        e = 0;
        for (f = d.length; e < f; ++e) {
            var g = d[e];
            Wl[g.I()].call(this, g, c)
        }
    }
        ;
    l.sb = function (b) {
        var c = b.k;
        b = b.t;
        null === this.e || Pl(this, c, c.length);
        "" !== this.c && Rl(this, c, c.length, b)
    }
        ;
    l.rb = function (b) {
        var c = b.k;
        b = b.t;
        null === this.e || Pl(this, c, c.length);
        "" !== this.c && Rl(this, c, c.length, b)
    }
        ;
    l.Db = function (b) {
        if (oe(this.f, b.D())) {
            if (null !== this.a) {
                Tl(this, this.a);
                var c = this.b
                    , d = b.k;
                c.beginPath();
                Ul(this, d, 0, d.length, b.t, !1);
                c.stroke()
            }
            "" !== this.c && (b = Xl(b),
                Rl(this, b, 2, 2))
        }
    }
        ;
    l.kc = function (b) {
        var c = b.D();
        if (oe(this.f, c)) {
            if (null !== this.a) {
                Tl(this, this.a);
                var c = this.b
                    , d = b.k
                    , e = 0
                    , f = b.b
                    , g = b.t;
                c.beginPath();
                var h, k;
                h = 0;
                for (k = f.length; h < k; ++h)
                    e = Ul(this, d, e, f[h], g, !1);
                c.stroke()
            }
            "" !== this.c && (b = Yl(b),
                Rl(this, b, b.length, 2))
        }
    }
        ;
    l.Rb = function (b) {
        if (oe(this.f, b.D())) {
            if (null !== this.a || null !== this.d) {
                null === this.d || Sl(this, this.d);
                null === this.a || Tl(this, this.a);
                var c = this.b;
                c.beginPath();
                Vl(this, Rk(b), 0, b.b, b.t);
                null === this.d || c.fill();
                null === this.a || c.stroke()
            }
            "" !== this.c && (b = Sk(b),
                Rl(this, b, 2, 2))
        }
    }
        ;
    l.lc = function (b) {
        if (oe(this.f, b.D())) {
            if (null !== this.a || null !== this.d) {
                null === this.d || Sl(this, this.d);
                null === this.a || Tl(this, this.a);
                var c = this.b, d = Zl(b), e = 0, f = b.b, g = b.t, h, k;
                h = 0;
                for (k = f.length; h < k; ++h) {
                    var n = f[h];
                    c.beginPath();
                    e = Vl(this, d, e, n, g);
                    null === this.d || c.fill();
                    null === this.a || c.stroke()
                }
            }
            "" !== this.c && (b = $l(b),
                Rl(this, b, b.length, 2))
        }
    }
        ;
    function am(b) {
        var c = Ra(nb(b.p), Number);
        bb(c);
        var d, e, f, g, h;
        d = 0;
        for (e = c.length; d < e; ++d)
            for (f = b.p[c[d].toString()],
                g = 0,
                h = f.length; g < h; ++g)
                f[g](b)
    }
    function Sl(b, c) {
        var d = b.b
            , e = b.oa;
        null === e ? (d.fillStyle = c.fillStyle,
            b.oa = {
                fillStyle: c.fillStyle
            }) : e.fillStyle != c.fillStyle && (e.fillStyle = d.fillStyle = c.fillStyle)
    }
    function Tl(b, c) {
        var d = b.b
            , e = b.pa;
        null === e ? (d.lineCap = c.lineCap,
            Zf && d.setLineDash(c.lineDash),
            d.lineJoin = c.lineJoin,
            d.lineWidth = c.lineWidth,
            d.miterLimit = c.miterLimit,
            d.strokeStyle = c.strokeStyle,
            b.pa = {
                lineCap: c.lineCap,
                lineDash: c.lineDash,
                lineJoin: c.lineJoin,
                lineWidth: c.lineWidth,
                miterLimit: c.miterLimit,
                strokeStyle: c.strokeStyle
            }) : (e.lineCap != c.lineCap && (e.lineCap = d.lineCap = c.lineCap),
                Zf && !db(e.lineDash, c.lineDash) && d.setLineDash(e.lineDash = c.lineDash),
                e.lineJoin != c.lineJoin && (e.lineJoin = d.lineJoin = c.lineJoin),
                e.lineWidth != c.lineWidth && (e.lineWidth = d.lineWidth = c.lineWidth),
                e.miterLimit != c.miterLimit && (e.miterLimit = d.miterLimit = c.miterLimit),
                e.strokeStyle != c.strokeStyle && (e.strokeStyle = d.strokeStyle = c.strokeStyle))
    }
    l.za = function (b, c) {
        if (null === b)
            this.d = null;
        else {
            var d = b.a;
            this.d = {
                fillStyle: sg(null === d ? gl : d)
            }
        }
        if (null === c)
            this.a = null;
        else {
            var d = c.a
                , e = c.c
                , f = c.b
                , g = c.f
                , h = c.d
                , k = c.e;
            this.a = {
                lineCap: m(e) ? e : "round",
                lineDash: null != f ? f : hl,
                lineJoin: m(g) ? g : "round",
                lineWidth: this.r * (m(h) ? h : 1),
                miterLimit: m(k) ? k : 10,
                strokeStyle: sg(null === d ? il : d)
            }
        }
    }
        ;
    l.fb = function (b) {
        if (null === b)
            this.e = null;
        else {
            var c = b.ub()
                , d = b.zb(1)
                , e = b.Ab()
                , f = b.cb();
            this.H = c[0];
            this.S = c[1];
            this.U = f[1];
            this.e = d;
            this.l = b.p;
            this.Ba = e[0];
            this.da = e[1];
            this.ha = b.q;
            this.ka = b.i;
            this.g = b.n;
            this.ta = b.r;
            this.ba = f[0]
        }
    }
        ;
    l.Aa = function (b) {
        if (null === b)
            this.c = "";
        else {
            var c = b.a;
            null === c ? this.j = null : (c = c.a,
                this.j = {
                    fillStyle: sg(null === c ? gl : c)
                });
            var d = b.e;
            if (null === d)
                this.n = null;
            else {
                var c = d.a
                    , e = d.c
                    , f = d.b
                    , g = d.f
                    , h = d.d
                    , d = d.e;
                this.n = {
                    lineCap: m(e) ? e : "round",
                    lineDash: null != f ? f : hl,
                    lineJoin: m(g) ? g : "round",
                    lineWidth: m(h) ? h : 1,
                    miterLimit: m(d) ? d : 10,
                    strokeStyle: sg(null === c ? il : c)
                }
            }
            var c = b.c
                , e = b.i
                , f = b.n
                , g = b.f
                , h = b.d
                , d = b.b
                , k = b.g;
            b = b.j;
            this.ca = {
                font: m(c) ? c : "10px sans-serif",
                textAlign: m(k) ? k : "center",
                textBaseline: m(b) ? b : "middle"
            };
            this.c = m(d) ? d : "";
            this.Ca = m(e) ? this.r * e : 0;
            this.Da = m(f) ? this.r * f : 0;
            this.s = m(g) ? g : 0;
            this.i = this.r * (m(h) ? h : 1)
        }
    }
        ;
    var Wl = {
        Point: Ol.prototype.sb,
        LineString: Ol.prototype.Db,
        Polygon: Ol.prototype.Rb,
        MultiPoint: Ol.prototype.rb,
        MultiLineString: Ol.prototype.kc,
        MultiPolygon: Ol.prototype.lc,
        GeometryCollection: Ol.prototype.ad,
        Circle: Ol.prototype.jc
    };
    var bm = ["Polygon", "LineString", "Image", "Text"];
    function cm(b, c, d) {
        this.ea = b;
        this.ba = c;
        this.c = null;
        this.f = 0;
        this.resolution = d;
        this.S = this.H = null;
        this.d = [];
        this.coordinates = [];
        this.oa = Gd();
        this.a = [];
        this.ca = [];
        this.pa = Gd()
    }
    function dm(b, c, d, e, f, g) {
        var h = b.coordinates.length, k = b.oe(), n = [c[d], c[d + 1]], p = [NaN, NaN], q = !0, r, s, u;
        for (r = d + f; r < e; r += f)
            p[0] = c[r],
                p[1] = c[r + 1],
                u = $d(k, p),
                u !== s ? (q && (b.coordinates[h++] = n[0],
                    b.coordinates[h++] = n[1]),
                    b.coordinates[h++] = p[0],
                    b.coordinates[h++] = p[1],
                    q = !1) : 1 === u ? (b.coordinates[h++] = p[0],
                        b.coordinates[h++] = p[1],
                        q = !1) : q = !0,
                n[0] = p[0],
                n[1] = p[1],
                s = u;
        r === d + f && (b.coordinates[h++] = n[0],
            b.coordinates[h++] = n[1]);
        g && (b.coordinates[h++] = c[d],
            b.coordinates[h++] = c[d + 1]);
        return h
    }
    function em(b, c) {
        b.H = [0, c, 0];
        b.d.push(b.H);
        b.S = [0, c, 0];
        b.a.push(b.S)
    }
    function fm(b, c, d, e, f, g, h, k, n) {
        var p;
        sj(e, b.oa) ? p = b.ca : (p = hk(b.coordinates, 0, b.coordinates.length, 2, e, b.ca),
            Jd(b.oa, e));
        e = 0;
        var q = h.length, r = 0, s;
        for (b = b.pa; e < q;) {
            var u = h[e], y, A, z, D;
            switch (u[0]) {
                case 0:
                    r = u[1];
                    s = ma(r).toString();
                    m(g[s]) ? e = u[2] : m(n) && !oe(n, r.N().D()) ? e = u[2] : ++e;
                    break;
                case 1:
                    c.beginPath();
                    ++e;
                    break;
                case 2:
                    r = u[1];
                    s = p[r];
                    var x = p[r + 1]
                        , T = p[r + 2] - s
                        , r = p[r + 3] - x;
                    c.arc(s, x, Math.sqrt(T * T + r * r), 0, 2 * Math.PI, !0);
                    ++e;
                    break;
                case 3:
                    c.closePath();
                    ++e;
                    break;
                case 4:
                    r = u[1];
                    s = u[2];
                    y = u[3];
                    z = u[4] * d;
                    var O = u[5] * d
                        , W = u[6];
                    A = u[7];
                    var V = u[8]
                        , ta = u[9]
                        , x = u[11]
                        , T = u[12]
                        , Jb = u[13]
                        , Qa = u[14];
                    for (u[10] && (x += f); r < s; r += 2) {
                        u = p[r] - z;
                        D = p[r + 1] - O;
                        Jb && (u = u + .5 | 0,
                            D = D + .5 | 0);
                        if (1 != T || 0 !== x) {
                            var Sb = u + z
                                , Gb = D + O;
                            rj(b, Sb, Gb, T, T, x, -Sb, -Gb);
                            c.setTransform(b[0], b[1], b[4], b[5], b[12], b[13])
                        }
                        Sb = c.globalAlpha;
                        1 != A && (c.globalAlpha = Sb * A);
                        c.drawImage(y, V, ta, Qa, W, u, D, Qa * d, W * d);
                        1 != A && (c.globalAlpha = Sb);
                        1 == T && 0 === x || c.setTransform(1, 0, 0, 1, 0, 0)
                    }
                    ++e;
                    break;
                case 5:
                    r = u[1];
                    s = u[2];
                    z = u[3];
                    O = u[4] * d;
                    W = u[5] * d;
                    x = u[6];
                    T = u[7] * d;
                    y = u[8];
                    for (A = u[9]; r < s; r += 2) {
                        u = p[r] + O;
                        D = p[r + 1] + W;
                        if (1 != T || 0 !== x)
                            rj(b, u, D, T, T, x, -u, -D),
                                c.setTransform(b[0], b[1], b[4], b[5], b[12], b[13]);
                        A && c.strokeText(z, u, D);
                        y && c.fillText(z, u, D);
                        1 == T && 0 === x || c.setTransform(1, 0, 0, 1, 0, 0)
                    }
                    ++e;
                    break;
                case 6:
                    if (m(k) && (r = u[1],
                        r = k(r)))
                        return r;
                    ++e;
                    break;
                case 7:
                    c.fill();
                    ++e;
                    break;
                case 8:
                    r = u[1];
                    s = u[2];
                    c.moveTo(p[r], p[r + 1]);
                    for (r += 2; r < s; r += 2)
                        c.lineTo(p[r], p[r + 1]);
                    ++e;
                    break;
                case 9:
                    c.fillStyle = u[1];
                    ++e;
                    break;
                case 10:
                    r = m(u[7]) ? u[7] : !0;
                    s = u[2];
                    c.strokeStyle = u[1];
                    c.lineWidth = r ? s * d : s;
                    c.lineCap = u[3];
                    c.lineJoin = u[4];
                    c.miterLimit = u[5];
                    Zf && c.setLineDash(u[6]);
                    ++e;
                    break;
                case 11:
                    c.font = u[1];
                    c.textAlign = u[2];
                    c.textBaseline = u[3];
                    ++e;
                    break;
                case 12:
                    c.stroke();
                    ++e;
                    break;
                default:
                    ++e
            }
        }
    }
    cm.prototype.$b = function (b, c, d, e, f) {
        fm(this, b, c, d, e, f, this.d, void 0)
    }
        ;
    function gm(b) {
        var c = b.a;
        c.reverse();
        var d, e = c.length, f, g, h = -1;
        for (d = 0; d < e; ++d)
            if (f = c[d],
                g = f[0],
                6 == g)
                h = d;
            else if (0 == g) {
                f[2] = d;
                f = b.a;
                for (g = d; h < g;) {
                    var k = f[h];
                    f[h] = f[g];
                    f[g] = k;
                    ++h;
                    --g
                }
                h = -1
            }
    }
    function hm(b, c) {
        b.H[2] = b.d.length;
        b.H = null;
        b.S[2] = b.a.length;
        b.S = null;
        var d = [6, c];
        b.d.push(d);
        b.a.push(d)
    }
    cm.prototype.Kb = ca;
    cm.prototype.oe = function () {
        return this.ba
    }
        ;
    function im(b, c, d) {
        cm.call(this, b, c, d);
        this.j = this.U = null;
        this.F = this.s = this.r = this.q = this.p = this.l = this.n = this.i = this.g = this.e = this.b = void 0
    }
    v(im, cm);
    im.prototype.sb = function (b, c) {
        if (null !== this.j) {
            em(this, c);
            var d = b.k
                , e = this.coordinates.length
                , d = dm(this, d, 0, d.length, b.t, !1);
            this.d.push([4, e, d, this.j, this.b, this.e, this.g, this.i, this.n, this.l, this.p, this.q, this.r, this.s, this.F]);
            this.a.push([4, e, d, this.U, this.b, this.e, this.g, this.i, this.n, this.l, this.p, this.q, this.r, this.s, this.F]);
            hm(this, c)
        }
    }
        ;
    im.prototype.rb = function (b, c) {
        if (null !== this.j) {
            em(this, c);
            var d = b.k
                , e = this.coordinates.length
                , d = dm(this, d, 0, d.length, b.t, !1);
            this.d.push([4, e, d, this.j, this.b, this.e, this.g, this.i, this.n, this.l, this.p, this.q, this.r, this.s, this.F]);
            this.a.push([4, e, d, this.U, this.b, this.e, this.g, this.i, this.n, this.l, this.p, this.q, this.r, this.s, this.F]);
            hm(this, c)
        }
    }
        ;
    im.prototype.Kb = function () {
        gm(this);
        this.e = this.b = void 0;
        this.j = this.U = null;
        this.F = this.s = this.q = this.p = this.l = this.n = this.i = this.r = this.g = void 0
    }
        ;
    im.prototype.fb = function (b) {
        var c = b.ub()
            , d = b.cb()
            , e = b.Ed(1)
            , f = b.zb(1)
            , g = b.Ab();
        this.b = c[0];
        this.e = c[1];
        this.U = e;
        this.j = f;
        this.g = d[1];
        this.i = b.p;
        this.n = g[0];
        this.l = g[1];
        this.p = b.q;
        this.q = b.i;
        this.r = b.n;
        this.s = b.r;
        this.F = d[0]
    }
        ;
    function jm(b, c, d) {
        cm.call(this, b, c, d);
        this.b = {
            Dc: void 0,
            yc: void 0,
            zc: null,
            Ac: void 0,
            Bc: void 0,
            Cc: void 0,
            ue: 0,
            strokeStyle: void 0,
            lineCap: void 0,
            lineDash: null,
            lineJoin: void 0,
            lineWidth: void 0,
            miterLimit: void 0
        }
    }
    v(jm, cm);
    function km(b, c, d, e, f) {
        var g = b.coordinates.length;
        c = dm(b, c, d, e, f, !1);
        g = [8, g, c];
        b.d.push(g);
        b.a.push(g);
        return e
    }
    l = jm.prototype;
    l.oe = function () {
        null === this.c && (this.c = Wd(this.ba),
            0 < this.f && Vd(this.c, this.resolution * (this.f + 1) / 2, this.c));
        return this.c
    }
        ;
    function lm(b) {
        var c = b.b
            , d = c.strokeStyle
            , e = c.lineCap
            , f = c.lineDash
            , g = c.lineJoin
            , h = c.lineWidth
            , k = c.miterLimit;
        c.Dc == d && c.yc == e && db(c.zc, f) && c.Ac == g && c.Bc == h && c.Cc == k || (c.ue != b.coordinates.length && (b.d.push([12]),
            c.ue = b.coordinates.length),
            b.d.push([10, d, h, e, g, k, f], [1]),
            c.Dc = d,
            c.yc = e,
            c.zc = f,
            c.Ac = g,
            c.Bc = h,
            c.Cc = k)
    }
    l.Db = function (b, c) {
        var d = this.b
            , e = d.lineWidth;
        m(d.strokeStyle) && m(e) && (lm(this),
            em(this, c),
            this.a.push([10, d.strokeStyle, d.lineWidth, d.lineCap, d.lineJoin, d.miterLimit, d.lineDash], [1]),
            d = b.k,
            km(this, d, 0, d.length, b.t),
            this.a.push([12]),
            hm(this, c))
    }
        ;
    l.kc = function (b, c) {
        var d = this.b
            , e = d.lineWidth;
        if (m(d.strokeStyle) && m(e)) {
            lm(this);
            em(this, c);
            this.a.push([10, d.strokeStyle, d.lineWidth, d.lineCap, d.lineJoin, d.miterLimit, d.lineDash], [1]);
            var d = b.b, e = b.k, f = b.t, g = 0, h, k;
            h = 0;
            for (k = d.length; h < k; ++h)
                g = km(this, e, g, d[h], f);
            this.a.push([12]);
            hm(this, c)
        }
    }
        ;
    l.Kb = function () {
        this.b.ue != this.coordinates.length && this.d.push([12]);
        gm(this);
        this.b = null
    }
        ;
    l.za = function (b, c) {
        var d = c.a;
        this.b.strokeStyle = sg(null === d ? il : d);
        d = c.c;
        this.b.lineCap = m(d) ? d : "round";
        d = c.b;
        this.b.lineDash = null === d ? hl : d;
        d = c.f;
        this.b.lineJoin = m(d) ? d : "round";
        d = c.d;
        this.b.lineWidth = m(d) ? d : 1;
        d = c.e;
        this.b.miterLimit = m(d) ? d : 10;
        this.b.lineWidth > this.f && (this.f = this.b.lineWidth,
            this.c = null)
    }
        ;
    function mm(b, c, d) {
        cm.call(this, b, c, d);
        this.b = {
            bf: void 0,
            Dc: void 0,
            yc: void 0,
            zc: null,
            Ac: void 0,
            Bc: void 0,
            Cc: void 0,
            fillStyle: void 0,
            strokeStyle: void 0,
            lineCap: void 0,
            lineDash: null,
            lineJoin: void 0,
            lineWidth: void 0,
            miterLimit: void 0
        }
    }
    v(mm, cm);
    function nm(b, c, d, e, f) {
        var g = b.b
            , h = [1];
        b.d.push(h);
        b.a.push(h);
        var k, h = 0;
        for (k = e.length; h < k; ++h) {
            var n = e[h]
                , p = b.coordinates.length;
            d = dm(b, c, d, n, f, !0);
            d = [8, p, d];
            p = [3];
            b.d.push(d, p);
            b.a.push(d, p);
            d = n
        }
        c = [7];
        b.a.push(c);
        m(g.fillStyle) && b.d.push(c);
        m(g.strokeStyle) && (g = [12],
            b.d.push(g),
            b.a.push(g));
        return d
    }
    l = mm.prototype;
    l.jc = function (b, c) {
        var d = this.b
            , e = d.strokeStyle;
        if (m(d.fillStyle) || m(e)) {
            om(this);
            em(this, c);
            this.a.push([9, sg(gl)]);
            m(d.strokeStyle) && this.a.push([10, d.strokeStyle, d.lineWidth, d.lineCap, d.lineJoin, d.miterLimit, d.lineDash]);
            var f = b.k
                , e = this.coordinates.length;
            dm(this, f, 0, f.length, b.t, !1);
            f = [1];
            e = [2, e];
            this.d.push(f, e);
            this.a.push(f, e);
            e = [7];
            this.a.push(e);
            m(d.fillStyle) && this.d.push(e);
            m(d.strokeStyle) && (d = [12],
                this.d.push(d),
                this.a.push(d));
            hm(this, c)
        }
    }
        ;
    l.Rb = function (b, c) {
        var d = this.b
            , e = d.strokeStyle;
        if (m(d.fillStyle) || m(e))
            om(this),
                em(this, c),
                this.a.push([9, sg(gl)]),
                m(d.strokeStyle) && this.a.push([10, d.strokeStyle, d.lineWidth, d.lineCap, d.lineJoin, d.miterLimit, d.lineDash]),
                d = b.b,
                e = Rk(b),
                nm(this, e, 0, d, b.t),
                hm(this, c)
    }
        ;
    l.lc = function (b, c) {
        var d = this.b
            , e = d.strokeStyle;
        if (m(d.fillStyle) || m(e)) {
            om(this);
            em(this, c);
            this.a.push([9, sg(gl)]);
            m(d.strokeStyle) && this.a.push([10, d.strokeStyle, d.lineWidth, d.lineCap, d.lineJoin, d.miterLimit, d.lineDash]);
            var d = b.b, e = Zl(b), f = b.t, g = 0, h, k;
            h = 0;
            for (k = d.length; h < k; ++h)
                g = nm(this, e, g, d[h], f);
            hm(this, c)
        }
    }
        ;
    l.Kb = function () {
        gm(this);
        this.b = null;
        var b = this.ea;
        if (0 !== b) {
            var c = this.coordinates, d, e;
            d = 0;
            for (e = c.length; d < e; ++d)
                c[d] = b * Math.round(c[d] / b)
        }
    }
        ;
    l.oe = function () {
        null === this.c && (this.c = Wd(this.ba),
            0 < this.f && Vd(this.c, this.resolution * (this.f + 1) / 2, this.c));
        return this.c
    }
        ;
    l.za = function (b, c) {
        var d = this.b;
        if (null === b)
            d.fillStyle = void 0;
        else {
            var e = b.a;
            d.fillStyle = sg(null === e ? gl : e)
        }
        null === c ? (d.strokeStyle = void 0,
            d.lineCap = void 0,
            d.lineDash = null,
            d.lineJoin = void 0,
            d.lineWidth = void 0,
            d.miterLimit = void 0) : (e = c.a,
                d.strokeStyle = sg(null === e ? il : e),
                e = c.c,
                d.lineCap = m(e) ? e : "round",
                e = c.b,
                d.lineDash = null === e ? hl : e.slice(),
                e = c.f,
                d.lineJoin = m(e) ? e : "round",
                e = c.d,
                d.lineWidth = m(e) ? e : 1,
                e = c.e,
                d.miterLimit = m(e) ? e : 10,
                d.lineWidth > this.f && (this.f = d.lineWidth,
                    this.c = null))
    }
        ;
    function om(b) {
        var c = b.b
            , d = c.fillStyle
            , e = c.strokeStyle
            , f = c.lineCap
            , g = c.lineDash
            , h = c.lineJoin
            , k = c.lineWidth
            , n = c.miterLimit;
        m(d) && c.bf != d && (b.d.push([9, d]),
            c.bf = c.fillStyle);
        !m(e) || c.Dc == e && c.yc == f && c.zc == g && c.Ac == h && c.Bc == k && c.Cc == n || (b.d.push([10, e, k, f, h, n, g]),
            c.Dc = e,
            c.yc = f,
            c.zc = g,
            c.Ac = h,
            c.Bc = k,
            c.Cc = n)
    }
    function pm(b, c, d) {
        cm.call(this, b, c, d);
        this.s = this.r = this.q = null;
        this.j = "";
        this.p = this.l = this.n = this.i = 0;
        this.g = this.e = this.b = null
    }
    v(pm, cm);
    pm.prototype.tb = function (b, c, d, e, f, g) {
        if ("" !== this.j && null !== this.g && (null !== this.b || null !== this.e)) {
            if (null !== this.b) {
                f = this.b;
                var h = this.q;
                if (null === h || h.fillStyle != f.fillStyle) {
                    var k = [9, f.fillStyle];
                    this.d.push(k);
                    this.a.push(k);
                    null === h ? this.q = {
                        fillStyle: f.fillStyle
                    } : h.fillStyle = f.fillStyle
                }
            }
            null !== this.e && (f = this.e,
                h = this.r,
                null === h || h.lineCap != f.lineCap || h.lineDash != f.lineDash || h.lineJoin != f.lineJoin || h.lineWidth != f.lineWidth || h.miterLimit != f.miterLimit || h.strokeStyle != f.strokeStyle) && (k = [10, f.strokeStyle, f.lineWidth, f.lineCap, f.lineJoin, f.miterLimit, f.lineDash, !1],
                    this.d.push(k),
                    this.a.push(k),
                    null === h ? this.r = {
                        lineCap: f.lineCap,
                        lineDash: f.lineDash,
                        lineJoin: f.lineJoin,
                        lineWidth: f.lineWidth,
                        miterLimit: f.miterLimit,
                        strokeStyle: f.strokeStyle
                    } : (h.lineCap = f.lineCap,
                        h.lineDash = f.lineDash,
                        h.lineJoin = f.lineJoin,
                        h.lineWidth = f.lineWidth,
                        h.miterLimit = f.miterLimit,
                        h.strokeStyle = f.strokeStyle));
            f = this.g;
            h = this.s;
            if (null === h || h.font != f.font || h.textAlign != f.textAlign || h.textBaseline != f.textBaseline)
                k = [11, f.font, f.textAlign, f.textBaseline],
                    this.d.push(k),
                    this.a.push(k),
                    null === h ? this.s = {
                        font: f.font,
                        textAlign: f.textAlign,
                        textBaseline: f.textBaseline
                    } : (h.font = f.font,
                        h.textAlign = f.textAlign,
                        h.textBaseline = f.textBaseline);
            em(this, g);
            f = this.coordinates.length;
            b = dm(this, b, c, d, e, !1);
            b = [5, f, b, this.j, this.i, this.n, this.l, this.p, null !== this.b, null !== this.e];
            this.d.push(b);
            this.a.push(b);
            hm(this, g)
        }
    }
        ;
    pm.prototype.Aa = function (b) {
        if (null === b)
            this.j = "";
        else {
            var c = b.a;
            null === c ? this.b = null : (c = c.a,
                c = sg(null === c ? gl : c),
                null === this.b ? this.b = {
                    fillStyle: c
                } : this.b.fillStyle = c);
            var d = b.e;
            if (null === d)
                this.e = null;
            else {
                var c = d.a
                    , e = d.c
                    , f = d.b
                    , g = d.f
                    , h = d.d
                    , d = d.e
                    , e = m(e) ? e : "round"
                    , f = null != f ? f.slice() : hl
                    , g = m(g) ? g : "round"
                    , h = m(h) ? h : 1
                    , d = m(d) ? d : 10
                    , c = sg(null === c ? il : c);
                if (null === this.e)
                    this.e = {
                        lineCap: e,
                        lineDash: f,
                        lineJoin: g,
                        lineWidth: h,
                        miterLimit: d,
                        strokeStyle: c
                    };
                else {
                    var k = this.e;
                    k.lineCap = e;
                    k.lineDash = f;
                    k.lineJoin = g;
                    k.lineWidth = h;
                    k.miterLimit = d;
                    k.strokeStyle = c
                }
            }
            var n = b.c
                , c = b.i
                , e = b.n
                , f = b.f
                , h = b.d
                , d = b.b
                , g = b.g
                , k = b.j;
            b = m(n) ? n : "10px sans-serif";
            g = m(g) ? g : "center";
            k = m(k) ? k : "middle";
            null === this.g ? this.g = {
                font: b,
                textAlign: g,
                textBaseline: k
            } : (n = this.g,
                n.font = b,
                n.textAlign = g,
                n.textBaseline = k);
            this.j = m(d) ? d : "";
            this.i = m(c) ? c : 0;
            this.n = m(e) ? e : 0;
            this.l = m(f) ? f : 0;
            this.p = m(h) ? h : 1
        }
    }
        ;
    function qm(b, c, d, e) {
        this.i = b;
        this.c = c;
        this.j = d;
        this.f = e;
        this.d = {};
        this.e = Pf(1, 1);
        this.g = Gd()
    }
    function rm(b) {
        for (var c in b.d) {
            var d = b.d[c], e;
            for (e in d)
                d[e].Kb()
        }
    }
    qm.prototype.b = function (b, c, d, e, f) {
        var g = this.g;
        rj(g, .5, .5, 1 / c, -1 / c, -d, -b[0], -b[1]);
        var h = this.e;
        h.clearRect(0, 0, 1, 1);
        var k;
        m(this.f) && (k = Rd(),
            Sd(k, b),
            Vd(k, c * this.f, k));
        return sm(this, h, g, d, e, function (b) {
            if (0 < h.getImageData(0, 0, 1, 1).data[3]) {
                if (b = f(b))
                    return b;
                h.clearRect(0, 0, 1, 1)
            }
        }, k)
    }
        ;
    qm.prototype.a = function (b, c) {
        var d = m(b) ? b.toString() : "0"
            , e = this.d[d];
        m(e) || (e = {},
            this.d[d] = e);
        d = e[c];
        m(d) || (d = new tm[c](this.i, this.c, this.j),
            e[c] = d);
        return d
    }
        ;
    qm.prototype.la = function () {
        return rb(this.d)
    }
        ;
    function um(b, c, d, e, f, g) {
        var h = Ra(nb(b.d), Number);
        bb(h);
        var k = b.c
            , n = k[0]
            , p = k[1]
            , q = k[2]
            , k = k[3]
            , n = [n, p, n, k, q, k, q, p];
        hk(n, 0, 8, 2, e, n);
        c.save();
        c.beginPath();
        c.moveTo(n[0], n[1]);
        c.lineTo(n[2], n[3]);
        c.lineTo(n[4], n[5]);
        c.lineTo(n[6], n[7]);
        c.closePath();
        c.clip();
        for (var r, s, n = 0, p = h.length; n < p; ++n)
            for (r = b.d[h[n].toString()],
                q = 0,
                k = bm.length; q < k; ++q)
                s = r[bm[q]],
                    m(s) && s.$b(c, d, e, f, g);
        c.restore()
    }
    function sm(b, c, d, e, f, g, h) {
        var k = Ra(nb(b.d), Number);
        bb(k, function (b, c) {
            return c - b
        });
        var n, p, q, r, s;
        n = 0;
        for (p = k.length; n < p; ++n)
            for (r = b.d[k[n].toString()],
                q = bm.length - 1; 0 <= q; --q)
                if (s = r[bm[q]],
                    m(s) && (s = fm(s, c, 1, d, e, f, s.a, g, h)))
                    return s
    }
    var tm = {
        Image: im,
        LineString: jm,
        Polygon: mm,
        Text: pm
    };
    function vm(b, c) {
        cj.call(this, b, c);
        this.q = Gd()
    }
    v(vm, cj);
    vm.prototype.l = function (b, c, d) {
        wm(this, "precompose", d, b, void 0);
        var e = this.Bd();
        if (null !== e) {
            var f = c.extent
                , g = m(f);
            if (g) {
                var h = b.pixelRatio
                    , k = ke(f)
                    , n = he(f)
                    , p = ge(f)
                    , f = fe(f);
                tj(b.coordinateToPixelMatrix, k, k);
                tj(b.coordinateToPixelMatrix, n, n);
                tj(b.coordinateToPixelMatrix, p, p);
                tj(b.coordinateToPixelMatrix, f, f);
                d.save();
                d.beginPath();
                d.moveTo(k[0] * h, k[1] * h);
                d.lineTo(n[0] * h, n[1] * h);
                d.lineTo(p[0] * h, p[1] * h);
                d.lineTo(f[0] * h, f[1] * h);
                d.clip()
            }
            h = this.jf();
            k = d.globalAlpha;
            d.globalAlpha = c.opacity;
            0 === b.viewState.rotation ? (c = h[13],
                n = e.width * h[0],
                p = e.height * h[5],
                d.drawImage(e, 0, 0, +e.width, +e.height, Math.round(h[12]), Math.round(c), Math.round(n), Math.round(p))) : (d.setTransform(h[0], h[1], h[4], h[5], h[12], h[13]),
                    d.drawImage(e, 0, 0),
                    d.setTransform(1, 0, 0, 1, 0, 0));
            d.globalAlpha = k;
            g && d.restore()
        }
        wm(this, "postcompose", d, b, void 0)
    }
        ;
    function wm(b, c, d, e, f) {
        var g = b.a;
        gd(g, c) && (b = m(f) ? f : xm(b, e),
            b = new Ol(d, e.pixelRatio, e.extent, b, e.viewState.rotation),
            g.dispatchEvent(new Uk(c, g, b, null, e, d, null)),
            am(b))
    }
    function xm(b, c) {
        var d = c.viewState
            , e = c.pixelRatio;
        return rj(b.q, e * c.size[0] / 2, e * c.size[1] / 2, e / d.resolution, -e / d.resolution, -d.rotation, -d.center[0], -d.center[1])
    }
    function ym(b, c) {
        var d = [0, 0];
        tj(c, b, d);
        return d
    }
    var zm = function () {
        var b = null
            , c = null;
        return function (d) {
            if (null === b) {
                b = Pf(1, 1);
                c = b.createImageData(1, 1);
                var e = c.data;
                e[0] = 42;
                e[1] = 84;
                e[2] = 126;
                e[3] = 255
            }
            var e = b.canvas
                , f = d[0] <= e.width && d[1] <= e.height;
            f || (e.width = d[0],
                e.height = d[1],
                e = d[0] - 1,
                d = d[1] - 1,
                b.putImageData(c, e, d),
                d = b.getImageData(e, d, 1, 1),
                f = db(c.data, d.data));
            return f
        }
    }();
    function Am(b, c, d) {
        ik.call(this);
        this.jg(b, m(c) ? c : 0, d)
    }
    v(Am, ik);
    l = Am.prototype;
    l.clone = function () {
        var b = new Am(null);
        kk(b, this.a, this.k.slice());
        b.o();
        return b
    }
        ;
    l.Xa = function (b, c, d, e) {
        var f = this.k;
        b -= f[0];
        var g = c - f[1];
        c = b * b + g * g;
        if (c < e) {
            if (0 === c)
                for (e = 0; e < this.t; ++e)
                    d[e] = f[e];
            else
                for (e = this.Cf() / Math.sqrt(c),
                    d[0] = f[0] + e * b,
                    d[1] = f[1] + e * g,
                    e = 2; e < this.t; ++e)
                    d[e] = f[e];
            d.length = this.t;
            return c
        }
        return e
    }
        ;
    l.Jb = function (b, c) {
        var d = this.k
            , e = b - d[0]
            , d = c - d[1];
        return e * e + d * d <= Bm(this)
    }
        ;
    l.xe = function () {
        return this.k.slice(0, this.t)
    }
        ;
    l.Zc = function (b) {
        var c = this.k
            , d = c[this.t] - c[0];
        return Ud(c[0] - d, c[1] - d, c[0] + d, c[1] + d, b)
    }
        ;
    l.Cf = function () {
        return Math.sqrt(Bm(this))
    }
        ;
    function Bm(b) {
        var c = b.k[b.t] - b.k[0];
        b = b.k[b.t + 1] - b.k[1];
        return c * c + b * b
    }
    l.I = function () {
        return "Circle"
    }
        ;
    l.wj = function (b) {
        var c = this.t
            , d = b.slice();
        d[c] = d[0] + (this.k[c] - this.k[0]);
        var e;
        for (e = 1; e < c; ++e)
            d[c + e] = b[e];
        kk(this, this.a, d);
        this.o()
    }
        ;
    l.jg = function (b, c, d) {
        if (null === b)
            kk(this, "XY", null);
        else {
            lk(this, d, b, 0);
            null === this.k && (this.k = []);
            d = this.k;
            b = vk(d, b);
            d[b++] = d[0] + c;
            var e;
            c = 1;
            for (e = this.t; c < e; ++c)
                d[b++] = d[c];
            d.length = b
        }
        this.o()
    }
        ;
    l.El = function (b) {
        this.k[this.t] = this.k[0] + b;
        this.o()
    }
        ;
    function Cm(b) {
        gk.call(this);
        this.c = m(b) ? b : null;
        Dm(this)
    }
    v(Cm, gk);
    function Em(b) {
        var c = [], d, e;
        d = 0;
        for (e = b.length; d < e; ++d)
            c.push(b[d].clone());
        return c
    }
    function Fm(b) {
        var c, d;
        if (null !== b.c)
            for (c = 0,
                d = b.c.length; c < d; ++c)
                Sc(b.c[c], "change", b.o, !1, b)
    }
    function Dm(b) {
        var c, d;
        if (null !== b.c)
            for (c = 0,
                d = b.c.length; c < d; ++c)
                w(b.c[c], "change", b.o, !1, b)
    }
    l = Cm.prototype;
    l.clone = function () {
        var b = new Cm(null);
        b.kg(this.c);
        return b
    }
        ;
    l.Xa = function (b, c, d, e) {
        if (e < Xd(this.D(), b, c))
            return e;
        var f = this.c, g, h;
        g = 0;
        for (h = f.length; g < h; ++g)
            e = f[g].Xa(b, c, d, e);
        return e
    }
        ;
    l.Jb = function (b, c) {
        var d = this.c, e, f;
        e = 0;
        for (f = d.length; e < f; ++e)
            if (d[e].Jb(b, c))
                return !0;
        return !1
    }
        ;
    l.Zc = function (b) {
        Ud(Infinity, Infinity, -Infinity, -Infinity, b);
        for (var c = this.c, d = 0, e = c.length; d < e; ++d)
            ce(b, c[d].D());
        return b
    }
        ;
    l.hf = function () {
        return Em(this.c)
    }
        ;
    l.se = function (b) {
        this.i != this.d && (sb(this.e),
            this.g = 0,
            this.i = this.d);
        if (0 > b || 0 !== this.g && b < this.g)
            return this;
        var c = b.toString();
        if (this.e.hasOwnProperty(c))
            return this.e[c];
        var d = [], e = this.c, f = !1, g, h;
        g = 0;
        for (h = e.length; g < h; ++g) {
            var k = e[g]
                , n = k.se(b);
            d.push(n);
            n !== k && (f = !0)
        }
        if (f)
            return b = new Cm(null),
                Fm(b),
                b.c = d,
                Dm(b),
                b.o(),
                this.e[c] = b;
        this.g = b;
        return this
    }
        ;
    l.I = function () {
        return "GeometryCollection"
    }
        ;
    l.ja = function (b) {
        var c = this.c, d, e;
        d = 0;
        for (e = c.length; d < e; ++d)
            if (c[d].ja(b))
                return !0;
        return !1
    }
        ;
    l.la = function () {
        return 0 == this.c.length
    }
        ;
    l.kg = function (b) {
        b = Em(b);
        Fm(this);
        this.c = b;
        Dm(this);
        this.o()
    }
        ;
    l.qa = function (b) {
        var c = this.c, d, e;
        d = 0;
        for (e = c.length; d < e; ++d)
            c[d].qa(b);
        this.o()
    }
        ;
    l.Ga = function (b, c) {
        var d = this.c, e, f;
        e = 0;
        for (f = d.length; e < f; ++e)
            d[e].Ga(b, c);
        this.o()
    }
        ;
    l.M = function () {
        Fm(this);
        Cm.R.M.call(this)
    }
        ;
    function Gm(b, c, d, e, f) {
        var g = NaN
            , h = NaN
            , k = (d - c) / e;
        if (0 !== k)
            if (1 == k)
                g = b[c],
                    h = b[c + 1];
            else if (2 == k)
                g = .5 * b[c] + .5 * b[c + e],
                    h = .5 * b[c + 1] + .5 * b[c + e + 1];
            else {
                var h = b[c], k = b[c + 1], n = 0, g = [0], p;
                for (p = c + e; p < d; p += e) {
                    var q = b[p]
                        , r = b[p + 1]
                        , n = n + Math.sqrt((q - h) * (q - h) + (r - k) * (r - k));
                    g.push(n);
                    h = q;
                    k = r
                }
                d = .5 * n;
                for (var s, h = cb, k = 0, n = g.length; k < n;)
                    p = k + n >> 1,
                        q = h(d, g[p]),
                        0 < q ? k = p + 1 : (n = p,
                            s = !q);
                s = s ? k : ~k;
                0 > s ? (d = (d - g[-s - 2]) / (g[-s - 1] - g[-s - 2]),
                    c += (-s - 2) * e,
                    g = Wb(b[c], b[c + e], d),
                    h = Wb(b[c + 1], b[c + e + 1], d)) : (g = b[c + s * e],
                        h = b[c + s * e + 1])
            }
        return null != f ? (f[0] = g,
            f[1] = h,
            f) : [g, h]
    }
    function Hm(b, c, d, e, f, g) {
        if (d == c)
            return null;
        if (f < b[c + e - 1])
            return g ? (d = b.slice(c, c + e),
                d[e - 1] = f,
                d) : null;
        if (b[d - 1] < f)
            return g ? (d = b.slice(d - e, d),
                d[e - 1] = f,
                d) : null;
        if (f == b[c + e - 1])
            return b.slice(c, c + e);
        c /= e;
        for (d /= e; c < d;)
            g = c + d >> 1,
                f < b[(g + 1) * e - 1] ? d = g : c = g + 1;
        d = b[c * e - 1];
        if (f == d)
            return b.slice((c - 1) * e, (c - 1) * e + e);
        g = (f - d) / (b[(c + 1) * e - 1] - d);
        d = [];
        var h;
        for (h = 0; h < e - 1; ++h)
            d.push(Wb(b[(c - 1) * e + h], b[c * e + h], g));
        d.push(f);
        return d
    }
    function Im(b, c, d, e, f, g) {
        var h = 0;
        if (g)
            return Hm(b, h, c[c.length - 1], d, e, f);
        if (e < b[d - 1])
            return f ? (b = b.slice(0, d),
                b[d - 1] = e,
                b) : null;
        if (b[b.length - 1] < e)
            return f ? (b = b.slice(b.length - d),
                b[d - 1] = e,
                b) : null;
        f = 0;
        for (g = c.length; f < g; ++f) {
            var k = c[f];
            if (h != k) {
                if (e < b[h + d - 1])
                    break;
                if (e <= b[k - 1])
                    return Hm(b, h, k, d, e, !1);
                h = k
            }
        }
        return null
    }
    ; function L(b, c) {
        ik.call(this);
        this.b = null;
        this.p = this.q = this.j = -1;
        this.V(b, c)
    }
    v(L, ik);
    l = L.prototype;
    l.ah = function (b) {
        null === this.k ? this.k = b.slice() : Za(this.k, b);
        this.o()
    }
        ;
    l.clone = function () {
        var b = new L(null);
        Jm(b, this.a, this.k.slice());
        return b
    }
        ;
    l.Xa = function (b, c, d, e) {
        if (e < Xd(this.D(), b, c))
            return e;
        this.p != this.d && (this.q = Math.sqrt(rk(this.k, 0, this.k.length, this.t, 0)),
            this.p = this.d);
        return tk(this.k, 0, this.k.length, this.t, this.q, !1, b, c, d, e)
    }
        ;
    l.xj = function (b, c) {
        return "XYM" != this.a && "XYZM" != this.a ? null : Hm(this.k, 0, this.k.length, this.t, b, m(c) ? c : !1)
    }
        ;
    l.K = function () {
        return yk(this.k, 0, this.k.length, this.t)
    }
        ;
    l.yj = function () {
        var b = this.k, c = this.t, d = b[0], e = b[1], f = 0, g;
        for (g = 0 + c; g < this.k.length; g += c)
            var h = b[g]
                , k = b[g + 1]
                , f = f + Math.sqrt((h - d) * (h - d) + (k - e) * (k - e))
                , d = h
                , e = k;
        return f
    }
        ;
    function Xl(b) {
        b.j != b.d && (b.b = Gm(b.k, 0, b.k.length, b.t, b.b),
            b.j = b.d);
        return b.b
    }
    l.mc = function (b) {
        var c = [];
        c.length = Ak(this.k, 0, this.k.length, this.t, b, c, 0);
        b = new L(null);
        Jm(b, "XY", c);
        return b
    }
        ;
    l.I = function () {
        return "LineString"
    }
        ;
    l.ja = function (b) {
        return Lk(this.k, 0, this.k.length, this.t, b)
    }
        ;
    l.V = function (b, c) {
        null === b ? Jm(this, "XY", null) : (lk(this, c, b, 1),
            null === this.k && (this.k = []),
            this.k.length = wk(this.k, 0, b, this.t),
            this.o())
    }
        ;
    function Jm(b, c, d) {
        kk(b, c, d);
        b.o()
    }
    ; function Km(b, c) {
        ik.call(this);
        this.b = [];
        this.j = this.p = -1;
        this.V(b, c)
    }
    v(Km, ik);
    l = Km.prototype;
    l.bh = function (b) {
        null === this.k ? this.k = b.k.slice() : Za(this.k, b.k.slice());
        this.b.push(this.k.length);
        this.o()
    }
        ;
    l.clone = function () {
        var b = new Km(null);
        Lm(b, this.a, this.k.slice(), this.b.slice());
        return b
    }
        ;
    l.Xa = function (b, c, d, e) {
        if (e < Xd(this.D(), b, c))
            return e;
        this.j != this.d && (this.p = Math.sqrt(sk(this.k, 0, this.b, this.t, 0)),
            this.j = this.d);
        return uk(this.k, 0, this.b, this.t, this.p, !1, b, c, d, e)
    }
        ;
    l.Aj = function (b, c, d) {
        return "XYM" != this.a && "XYZM" != this.a || 0 === this.k.length ? null : Im(this.k, this.b, this.t, b, m(c) ? c : !1, m(d) ? d : !1)
    }
        ;
    l.K = function () {
        return zk(this.k, 0, this.b, this.t)
    }
        ;
    l.Ch = function (b) {
        if (0 > b || this.b.length <= b)
            return null;
        var c = new L(null);
        Jm(c, this.a, this.k.slice(0 === b ? 0 : this.b[b - 1], this.b[b]));
        return c
    }
        ;
    l.Gc = function () {
        var b = this.k, c = this.b, d = this.a, e = [], f = 0, g, h;
        g = 0;
        for (h = c.length; g < h; ++g) {
            var k = c[g]
                , n = new L(null);
            Jm(n, d, b.slice(f, k));
            e.push(n);
            f = k
        }
        return e
    }
        ;
    function Yl(b) {
        var c = []
            , d = b.k
            , e = 0
            , f = b.b;
        b = b.t;
        var g, h;
        g = 0;
        for (h = f.length; g < h; ++g) {
            var k = f[g]
                , e = Gm(d, e, k, b);
            Za(c, e);
            e = k
        }
        return c
    }
    l.mc = function (b) {
        var c = [], d = [], e = this.k, f = this.b, g = this.t, h = 0, k = 0, n, p;
        n = 0;
        for (p = f.length; n < p; ++n) {
            var q = f[n]
                , k = Ak(e, h, q, g, b, c, k);
            d.push(k);
            h = q
        }
        c.length = k;
        b = new Km(null);
        Lm(b, "XY", c, d);
        return b
    }
        ;
    l.I = function () {
        return "MultiLineString"
    }
        ;
    l.ja = function (b) {
        a: {
            var c = this.k, d = this.b, e = this.t, f = 0, g, h;
            g = 0;
            for (h = d.length; g < h; ++g) {
                if (Lk(c, f, d[g], e, b)) {
                    b = !0;
                    break a
                }
                f = d[g]
            }
            b = !1
        }
        return b
    }
        ;
    l.V = function (b, c) {
        if (null === b)
            Lm(this, "XY", null, this.b);
        else {
            lk(this, c, b, 2);
            null === this.k && (this.k = []);
            var d = xk(this.k, 0, b, this.t, this.b);
            this.k.length = 0 === d.length ? 0 : d[d.length - 1];
            this.o()
        }
    }
        ;
    function Lm(b, c, d, e) {
        kk(b, c, d);
        b.b = e;
        b.o()
    }
    function Mm(b, c) {
        var d = "XY", e = [], f = [], g, h;
        g = 0;
        for (h = c.length; g < h; ++g) {
            var k = c[g];
            0 === g && (d = k.a);
            Za(e, k.k);
            f.push(e.length)
        }
        Lm(b, d, e, f)
    }
    ; function Nm(b, c) {
        ik.call(this);
        this.V(b, c)
    }
    v(Nm, ik);
    l = Nm.prototype;
    l.eh = function (b) {
        null === this.k ? this.k = b.k.slice() : Za(this.k, b.k);
        this.o()
    }
        ;
    l.clone = function () {
        var b = new Nm(null);
        kk(b, this.a, this.k.slice());
        b.o();
        return b
    }
        ;
    l.Xa = function (b, c, d, e) {
        if (e < Xd(this.D(), b, c))
            return e;
        var f = this.k, g = this.t, h, k, n;
        h = 0;
        for (k = f.length; h < k; h += g)
            if (n = pk(b, c, f[h], f[h + 1]),
                n < e) {
                e = n;
                for (n = 0; n < g; ++n)
                    d[n] = f[h + n];
                d.length = g
            }
        return e
    }
        ;
    l.K = function () {
        return yk(this.k, 0, this.k.length, this.t)
    }
        ;
    l.Lh = function (b) {
        var c = null === this.k ? 0 : this.k.length / this.t;
        if (0 > b || c <= b)
            return null;
        c = new Ek(null);
        Fk(c, this.a, this.k.slice(b * this.t, (b + 1) * this.t));
        return c
    }
        ;
    l.zd = function () {
        var b = this.k, c = this.a, d = this.t, e = [], f, g;
        f = 0;
        for (g = b.length; f < g; f += d) {
            var h = new Ek(null);
            Fk(h, c, b.slice(f, f + d));
            e.push(h)
        }
        return e
    }
        ;
    l.I = function () {
        return "MultiPoint"
    }
        ;
    l.ja = function (b) {
        var c = this.k, d = this.t, e, f, g, h;
        e = 0;
        for (f = c.length; e < f; e += d)
            if (g = c[e],
                h = c[e + 1],
                Zd(b, g, h))
                return !0;
        return !1
    }
        ;
    l.V = function (b, c) {
        null === b ? kk(this, "XY", null) : (lk(this, c, b, 1),
            null === this.k && (this.k = []),
            this.k.length = wk(this.k, 0, b, this.t));
        this.o()
    }
        ;
    function Om(b, c) {
        ik.call(this);
        this.b = [];
        this.p = -1;
        this.q = null;
        this.F = this.r = this.s = -1;
        this.j = null;
        this.V(b, c)
    }
    v(Om, ik);
    l = Om.prototype;
    l.fh = function (b) {
        if (null === this.k)
            this.k = b.k.slice(),
                b = b.b.slice(),
                this.b.push();
        else {
            var c = this.k.length;
            Za(this.k, b.k);
            b = b.b.slice();
            var d, e;
            d = 0;
            for (e = b.length; d < e; ++d)
                b[d] += c
        }
        this.b.push(b);
        this.o()
    }
        ;
    l.clone = function () {
        var b = new Om(null);
        Pm(b, this.a, this.k.slice(), this.b.slice());
        return b
    }
        ;
    l.Xa = function (b, c, d, e) {
        if (e < Xd(this.D(), b, c))
            return e;
        if (this.r != this.d) {
            var f = this.b, g = 0, h = 0, k, n;
            k = 0;
            for (n = f.length; k < n; ++k)
                var p = f[k]
                    , h = sk(this.k, g, p, this.t, h)
                    , g = p[p.length - 1];
            this.s = Math.sqrt(h);
            this.r = this.d
        }
        f = Zl(this);
        g = this.b;
        h = this.t;
        k = this.s;
        n = 0;
        var p = m(void 0) ? void 0 : [NaN, NaN], q, r;
        q = 0;
        for (r = g.length; q < r; ++q) {
            var s = g[q];
            e = uk(f, n, s, h, k, !0, b, c, d, e, p);
            n = s[s.length - 1]
        }
        return e
    }
        ;
    l.Jb = function (b, c) {
        var d;
        a: {
            d = Zl(this);
            var e = this.b
                , f = 0;
            if (0 !== e.length) {
                var g, h;
                g = 0;
                for (h = e.length; g < h; ++g) {
                    var k = e[g];
                    if (Ik(d, f, k, this.t, b, c)) {
                        d = !0;
                        break a
                    }
                    f = k[k.length - 1]
                }
            }
            d = !1
        }
        return d
    }
        ;
    l.Bj = function () {
        var b = Zl(this), c = this.b, d = 0, e = 0, f, g;
        f = 0;
        for (g = c.length; f < g; ++f)
            var h = c[f]
                , e = e + nk(b, d, h, this.t)
                , d = h[h.length - 1];
        return e
    }
        ;
    l.K = function () {
        var b = this.k, c = this.b, d = this.t, e = 0, f = m(void 0) ? void 0 : [], g = 0, h, k;
        h = 0;
        for (k = c.length; h < k; ++h) {
            var n = c[h];
            f[g++] = zk(b, e, n, d, f[g]);
            e = n[n.length - 1]
        }
        f.length = g;
        return f
    }
        ;
    function $l(b) {
        if (b.p != b.d) {
            var c = b.k, d = b.b, e = b.t, f = 0, g = [], h, k, n = Rd();
            h = 0;
            for (k = d.length; h < k; ++h) {
                var p = d[h]
                    , n = de(Ud(Infinity, Infinity, -Infinity, -Infinity, void 0), c, f, p[0], e);
                g.push((n[0] + n[2]) / 2, (n[1] + n[3]) / 2);
                f = p[p.length - 1]
            }
            c = Zl(b);
            d = b.b;
            e = b.t;
            f = 0;
            h = [];
            k = 0;
            for (n = d.length; k < n; ++k)
                p = d[k],
                    h = Jk(c, f, p, e, g, 2 * k, h),
                    f = p[p.length - 1];
            b.q = h;
            b.p = b.d
        }
        return b.q
    }
    l.zh = function () {
        var b = new Nm(null)
            , c = $l(this).slice();
        kk(b, "XY", c);
        b.o();
        return b
    }
        ;
    function Zl(b) {
        if (b.F != b.d) {
            var c = b.k, d;
            a: {
                d = b.b;
                var e, f;
                e = 0;
                for (f = d.length; e < f; ++e)
                    if (!Ok(c, d[e], b.t)) {
                        d = !1;
                        break a
                    }
                d = !0
            }
            if (d)
                b.j = c;
            else {
                b.j = c.slice();
                d = c = b.j;
                e = b.b;
                f = b.t;
                var g = 0, h, k;
                h = 0;
                for (k = e.length; h < k; ++h)
                    g = Pk(d, g, e[h], f);
                c.length = g
            }
            b.F = b.d
        }
        return b.j
    }
    l.mc = function (b) {
        var c = []
            , d = []
            , e = this.k
            , f = this.b
            , g = this.t;
        b = Math.sqrt(b);
        var h = 0, k = 0, n, p;
        n = 0;
        for (p = f.length; n < p; ++n) {
            var q = f[n]
                , r = []
                , k = Bk(e, h, q, g, b, c, k, r);
            d.push(r);
            h = q[q.length - 1]
        }
        c.length = k;
        e = new Om(null);
        Pm(e, "XY", c, d);
        return e
    }
        ;
    l.Mh = function (b) {
        if (0 > b || this.b.length <= b)
            return null;
        var c;
        0 === b ? c = 0 : (c = this.b[b - 1],
            c = c[c.length - 1]);
        b = this.b[b].slice();
        var d = b[b.length - 1];
        if (0 !== c) {
            var e, f;
            e = 0;
            for (f = b.length; e < f; ++e)
                b[e] -= c
        }
        e = new G(null);
        Qk(e, this.a, this.k.slice(c, d), b);
        return e
    }
        ;
    l.jd = function () {
        var b = this.a, c = this.k, d = this.b, e = [], f = 0, g, h, k, n;
        g = 0;
        for (h = d.length; g < h; ++g) {
            var p = d[g].slice()
                , q = p[p.length - 1];
            if (0 !== f)
                for (k = 0,
                    n = p.length; k < n; ++k)
                    p[k] -= f;
            k = new G(null);
            Qk(k, b, c.slice(f, q), p);
            e.push(k);
            f = q
        }
        return e
    }
        ;
    l.I = function () {
        return "MultiPolygon"
    }
        ;
    l.ja = function (b) {
        a: {
            var c = Zl(this), d = this.b, e = this.t, f = 0, g, h;
            g = 0;
            for (h = d.length; g < h; ++g) {
                var k = d[g];
                if (Mk(c, f, k, e, b)) {
                    b = !0;
                    break a
                }
                f = k[k.length - 1]
            }
            b = !1
        }
        return b
    }
        ;
    l.V = function (b, c) {
        if (null === b)
            Pm(this, "XY", null, this.b);
        else {
            lk(this, c, b, 3);
            null === this.k && (this.k = []);
            var d = this.k, e = this.t, f = this.b, g = 0, f = m(f) ? f : [], h = 0, k, n;
            k = 0;
            for (n = b.length; k < n; ++k)
                g = xk(d, g, b[k], e, f[h]),
                    f[h++] = g,
                    g = g[g.length - 1];
            f.length = h;
            0 === f.length ? this.k.length = 0 : (d = f[f.length - 1],
                this.k.length = 0 === d.length ? 0 : d[d.length - 1]);
            this.o()
        }
    }
        ;
    function Pm(b, c, d, e) {
        kk(b, c, d);
        b.b = e;
        b.o()
    }
    function Qm(b, c) {
        var d = "XY", e = [], f = [], g, h, k;
        g = 0;
        for (h = c.length; g < h; ++g) {
            var n = c[g];
            0 === g && (d = n.a);
            var p = e.length;
            k = n.b;
            var q, r;
            q = 0;
            for (r = k.length; q < r; ++q)
                k[q] += p;
            Za(e, n.k);
            f.push(k)
        }
        Pm(b, d, e, f)
    }
    ; function Rm(b, c) {
        return ma(b) - ma(c)
    }
    function Sm(b, c) {
        var d = .5 * b / c;
        return d * d
    }
    function Tm(b, c, d, e, f, g) {
        var h = !1, k, n;
        k = d.e;
        null !== k && (n = k.Jc(),
            2 == n || 3 == n ? k.Ne(f, g) : (0 == n && k.load(),
                k.ve(f, g),
                h = !0));
        f = (0,
            d.c)(c);
        null != f && (e = f.se(e),
            (0,
                Um[e.I()])(b, e, d, c));
        return h
    }
    var Um = {
        Point: function (b, c, d, e) {
            var f = d.e;
            if (null !== f) {
                if (2 != f.Jc())
                    return;
                var g = b.a(d.a, "Image");
                g.fb(f);
                g.sb(c, e)
            }
            f = d.d;
            null !== f && (b = b.a(d.a, "Text"),
                b.Aa(f),
                b.tb(c.K(), 0, 2, 2, c, e))
        },
        LineString: function (b, c, d, e) {
            var f = d.b;
            if (null !== f) {
                var g = b.a(d.a, "LineString");
                g.za(null, f);
                g.Db(c, e)
            }
            f = d.d;
            null !== f && (b = b.a(d.a, "Text"),
                b.Aa(f),
                b.tb(Xl(c), 0, 2, 2, c, e))
        },
        Polygon: function (b, c, d, e) {
            var f = d.f
                , g = d.b;
            if (null !== f || null !== g) {
                var h = b.a(d.a, "Polygon");
                h.za(f, g);
                h.Rb(c, e)
            }
            f = d.d;
            null !== f && (b = b.a(d.a, "Text"),
                b.Aa(f),
                b.tb(Sk(c), 0, 2, 2, c, e))
        },
        MultiPoint: function (b, c, d, e) {
            var f = d.e;
            if (null !== f) {
                if (2 != f.Jc())
                    return;
                var g = b.a(d.a, "Image");
                g.fb(f);
                g.rb(c, e)
            }
            f = d.d;
            null !== f && (b = b.a(d.a, "Text"),
                b.Aa(f),
                d = c.k,
                b.tb(d, 0, d.length, c.t, c, e))
        },
        MultiLineString: function (b, c, d, e) {
            var f = d.b;
            if (null !== f) {
                var g = b.a(d.a, "LineString");
                g.za(null, f);
                g.kc(c, e)
            }
            f = d.d;
            null !== f && (b = b.a(d.a, "Text"),
                b.Aa(f),
                d = Yl(c),
                b.tb(d, 0, d.length, 2, c, e))
        },
        MultiPolygon: function (b, c, d, e) {
            var f = d.f
                , g = d.b;
            if (null !== g || null !== f) {
                var h = b.a(d.a, "Polygon");
                h.za(f, g);
                h.lc(c, e)
            }
            f = d.d;
            null !== f && (b = b.a(d.a, "Text"),
                b.Aa(f),
                d = $l(c),
                b.tb(d, 0, d.length, 2, c, e))
        },
        GeometryCollection: function (b, c, d, e) {
            c = c.c;
            var f, g;
            f = 0;
            for (g = c.length; f < g; ++f)
                (0,
                    Um[c[f].I()])(b, c[f], d, e)
        },
        Circle: function (b, c, d, e) {
            var f = d.f
                , g = d.b;
            if (null !== f || null !== g) {
                var h = b.a(d.a, "Polygon");
                h.za(f, g);
                h.jc(c, e)
            }
            f = d.d;
            null !== f && (b = b.a(d.a, "Text"),
                b.Aa(f),
                b.tb(c.xe(), 0, 2, 2, c, e))
        }
    };
    function Vm(b, c, d, e, f) {
        Oi.call(this, b, c, d, 2, e);
        this.d = f
    }
    v(Vm, Oi);
    Vm.prototype.a = function () {
        return this.d
    }
        ;
    function Wm(b) {
        Ki.call(this, {
            attributions: b.attributions,
            extent: b.extent,
            logo: b.logo,
            projection: b.projection,
            state: b.state
        });
        this.j = m(b.resolutions) ? b.resolutions : null
    }
    v(Wm, Ki);
    function Xm(b, c) {
        if (null !== b.j) {
            var d = $b(b.j, c, 0);
            c = b.j[d]
        }
        return c
    }
    function Ym(b, c) {
        b.a().src = c
    }
    ; function Zm(b) {
        Wm.call(this, {
            attributions: b.attributions,
            logo: b.logo,
            projection: b.projection,
            resolutions: b.resolutions,
            state: m(b.state) ? b.state : void 0
        });
        this.s = b.canvasFunction;
        this.p = null;
        this.q = 0;
        this.F = m(b.ratio) ? b.ratio : 1.5
    }
    v(Zm, Wm);
    Zm.prototype.rc = function (b, c, d, e) {
        c = Xm(this, c);
        var f = this.p;
        if (null !== f && this.q == this.d && f.resolution == c && f.f == d && Yd(f.D(), b))
            return f;
        b = b.slice();
        re(b, this.F);
        e = this.s(b, c, d, [pe(b) / c * d, me(b) / c * d], e);
        null === e || (f = new Vm(b, c, d, this.f, e));
        this.p = f;
        this.q = this.d;
        return f
    }
        ;
    var $m;
    (function () {
        var b = {
            ff: {}
        };
        (function () {
            function c(b, d) {
                if (!(this instanceof c))
                    return new c(b, d);
                this.fe = Math.max(4, b || 9);
                this.Xe = Math.max(2, Math.ceil(.4 * this.fe));
                d && this.Xg(d);
                this.clear()
            }
            function d(b, c) {
                b.bbox = e(b, 0, b.children.length, c)
            }
            function e(b, c, d, e) {
                for (var g = [Infinity, Infinity, -Infinity, -Infinity], h; c < d; c++)
                    h = b.children[c],
                        f(g, b.xa ? e(h) : h.bbox);
                return g
            }
            function f(b, c) {
                b[0] = Math.min(b[0], c[0]);
                b[1] = Math.min(b[1], c[1]);
                b[2] = Math.max(b[2], c[2]);
                b[3] = Math.max(b[3], c[3])
            }
            function g(b, c) {
                return b.bbox[0] - c.bbox[0]
            }
            function h(b, c) {
                return b.bbox[1] - c.bbox[1]
            }
            function k(b) {
                return (b[2] - b[0]) * (b[3] - b[1])
            }
            function n(b) {
                return b[2] - b[0] + (b[3] - b[1])
            }
            function p(b, c) {
                return b[0] <= c[0] && b[1] <= c[1] && c[2] <= b[2] && c[3] <= b[3]
            }
            function q(b, c) {
                return c[0] <= b[2] && c[1] <= b[3] && c[2] >= b[0] && c[3] >= b[1]
            }
            function r(b, c, d, e, f) {
                for (var g = [c, d], h; g.length;)
                    d = g.pop(),
                        c = g.pop(),
                        d - c <= e || (h = c + Math.ceil((d - c) / e / 2) * e,
                            s(b, c, d, h, f),
                            g.push(c, h, h, d))
            }
            function s(b, c, d, e, f) {
                for (var g, h, k, n, p; d > c;) {
                    600 < d - c && (g = d - c + 1,
                        h = e - c + 1,
                        k = Math.log(g),
                        n = .5 * Math.exp(2 * k / 3),
                        p = .5 * Math.sqrt(k * n * (g - n) / g) * (0 > h - g / 2 ? -1 : 1),
                        k = Math.max(c, Math.floor(e - h * n / g + p)),
                        h = Math.min(d, Math.floor(e + (g - h) * n / g + p)),
                        s(b, k, h, e, f));
                    g = b[e];
                    h = c;
                    n = d;
                    u(b, c, e);
                    for (0 < f(b[d], g) && u(b, c, d); h < n;) {
                        u(b, h, n);
                        h++;
                        for (n--; 0 > f(b[h], g);)
                            h++;
                        for (; 0 < f(b[n], g);)
                            n--
                    }
                    0 === f(b[c], g) ? u(b, c, n) : (n++,
                        u(b, n, d));
                    n <= e && (c = n + 1);
                    e <= n && (d = n - 1)
                }
            }
            function u(b, c, d) {
                var e = b[c];
                b[c] = b[d];
                b[d] = e
            }
            c.prototype = {
                all: function () {
                    return this.Te(this.data, [])
                },
                search: function (b) {
                    var c = this.data
                        , d = []
                        , e = this.Ia;
                    if (!q(b, c.bbox))
                        return d;
                    for (var f = [], g, h, k, n; c;) {
                        g = 0;
                        for (h = c.children.length; g < h; g++)
                            k = c.children[g],
                                n = c.xa ? e(k) : k.bbox,
                                q(b, n) && (c.xa ? d.push(k) : p(b, n) ? this.Te(k, d) : f.push(k));
                        c = f.pop()
                    }
                    return d
                },
                load: function (b) {
                    if (!b || !b.length)
                        return this;
                    if (b.length < this.Xe) {
                        for (var c = 0, d = b.length; c < d; c++)
                            this.ra(b[c]);
                        return this
                    }
                    b = this.Ve(b.slice(), 0, b.length - 1, 0);
                    this.data.children.length ? this.data.height === b.height ? this.Ye(this.data, b) : (this.data.height < b.height && (c = this.data,
                        this.data = b,
                        b = c),
                        this.We(b, this.data.height - b.height - 1, !0)) : this.data = b;
                    return this
                },
                ra: function (b) {
                    b && this.We(b, this.data.height - 1);
                    return this
                },
                clear: function () {
                    this.data = {
                        children: [],
                        height: 1,
                        bbox: [Infinity, Infinity, -Infinity, -Infinity],
                        xa: !0
                    };
                    return this
                },
                remove: function (b) {
                    if (!b)
                        return this;
                    for (var c = this.data, d = this.Ia(b), e = [], f = [], g, h, k, n; c || e.length;) {
                        c || (c = e.pop(),
                            h = e[e.length - 1],
                            g = f.pop(),
                            n = !0);
                        if (c.xa && (k = c.children.indexOf(b),
                            -1 !== k)) {
                            c.children.splice(k, 1);
                            e.push(c);
                            this.Wg(e);
                            break
                        }
                        n || c.xa || !p(c.bbox, d) ? h ? (g++,
                            c = h.children[g],
                            n = !1) : c = null : (e.push(c),
                                f.push(g),
                                g = 0,
                                h = c,
                                c = c.children[0])
                    }
                    return this
                },
                Ia: function (b) {
                    return b
                },
                ie: function (b, c) {
                    return b[0] - c[0]
                },
                je: function (b, c) {
                    return b[1] - c[1]
                },
                toJSON: function () {
                    return this.data
                },
                Te: function (b, c) {
                    for (var d = []; b;)
                        b.xa ? c.push.apply(c, b.children) : d.push.apply(d, b.children),
                            b = d.pop();
                    return c
                },
                Ve: function (b, c, e, f) {
                    var g = e - c + 1, h = this.fe, k;
                    if (g <= h)
                        return k = {
                            children: b.slice(c, e + 1),
                            height: 1,
                            bbox: null,
                            xa: !0
                        },
                            d(k, this.Ia),
                            k;
                    f || (f = Math.ceil(Math.log(g) / Math.log(h)),
                        h = Math.ceil(g / Math.pow(h, f - 1)));
                    k = {
                        children: [],
                        height: f,
                        bbox: null
                    };
                    var g = Math.ceil(g / h), h = g * Math.ceil(Math.sqrt(h)), n, p, q;
                    for (r(b, c, e, h, this.ie); c <= e; c += h)
                        for (p = Math.min(c + h - 1, e),
                            r(b, c, p, g, this.je),
                            n = c; n <= p; n += g)
                            q = Math.min(n + g - 1, p),
                                k.children.push(this.Ve(b, n, q, f - 1));
                    d(k, this.Ia);
                    return k
                },
                Vg: function (b, c, d, e) {
                    for (var f, g, h, n, p, q, r, s; ;) {
                        e.push(c);
                        if (c.xa || e.length - 1 === d)
                            break;
                        r = s = Infinity;
                        f = 0;
                        for (g = c.children.length; f < g; f++) {
                            h = c.children[f];
                            p = k(h.bbox);
                            q = b;
                            var u = h.bbox;
                            q = (Math.max(u[2], q[2]) - Math.min(u[0], q[0])) * (Math.max(u[3], q[3]) - Math.min(u[1], q[1])) - p;
                            q < s ? (s = q,
                                r = p < r ? p : r,
                                n = h) : q === s && p < r && (r = p,
                                    n = h)
                        }
                        c = n
                    }
                    return c
                },
                We: function (b, c, d) {
                    var e = this.Ia;
                    d = d ? b.bbox : e(b);
                    var e = []
                        , g = this.Vg(d, this.data, c, e);
                    g.children.push(b);
                    for (f(g.bbox, d); 0 <= c;)
                        if (e[c].children.length > this.fe)
                            this.Yg(e, c),
                                c--;
                        else
                            break;
                    this.Sg(d, e, c)
                },
                Yg: function (b, c) {
                    var e = b[c]
                        , f = e.children.length
                        , g = this.Xe;
                    this.Tg(e, g, f);
                    f = {
                        children: e.children.splice(this.Ug(e, g, f)),
                        height: e.height
                    };
                    e.xa && (f.xa = !0);
                    d(e, this.Ia);
                    d(f, this.Ia);
                    c ? b[c - 1].children.push(f) : this.Ye(e, f)
                },
                Ye: function (b, c) {
                    this.data = {
                        children: [b, c],
                        height: b.height + 1
                    };
                    d(this.data, this.Ia)
                },
                Ug: function (b, c, d) {
                    var f, g, h, n, p, q, r;
                    p = q = Infinity;
                    for (f = c; f <= d - c; f++) {
                        g = e(b, 0, f, this.Ia);
                        h = e(b, f, d, this.Ia);
                        var s = g
                            , u = h;
                        n = Math.max(s[0], u[0]);
                        var Sb = Math.max(s[1], u[1])
                            , Gb = Math.min(s[2], u[2])
                            , s = Math.min(s[3], u[3]);
                        n = Math.max(0, Gb - n) * Math.max(0, s - Sb);
                        g = k(g) + k(h);
                        n < p ? (p = n,
                            r = f,
                            q = g < q ? g : q) : n === p && g < q && (q = g,
                                r = f)
                    }
                    return r
                },
                Tg: function (b, c, d) {
                    var e = b.xa ? this.ie : g
                        , f = b.xa ? this.je : h
                        , k = this.Ue(b, c, d, e);
                    c = this.Ue(b, c, d, f);
                    k < c && b.children.sort(e)
                },
                Ue: function (b, c, d, g) {
                    b.children.sort(g);
                    g = this.Ia;
                    var h = e(b, 0, c, g), k = e(b, d - c, d, g), p = n(h) + n(k), q, r;
                    for (q = c; q < d - c; q++)
                        r = b.children[q],
                            f(h, b.xa ? g(r) : r.bbox),
                            p += n(h);
                    for (q = d - c - 1; q >= c; q--)
                        r = b.children[q],
                            f(k, b.xa ? g(r) : r.bbox),
                            p += n(k);
                    return p
                },
                Sg: function (b, c, d) {
                    for (; 0 <= d; d--)
                        f(c[d].bbox, b)
                },
                Wg: function (b) {
                    for (var c = b.length - 1, e; 0 <= c; c--)
                        0 === b[c].children.length ? 0 < c ? (e = b[c - 1].children,
                            e.splice(e.indexOf(b[c]), 1)) : this.clear() : d(b[c], this.Ia)
                },
                Xg: function (b) {
                    var c = ["return a", " - b", ";"];
                    this.ie = new Function("a", "b", c.join(b[0]));
                    this.je = new Function("a", "b", c.join(b[1]));
                    this.Ia = new Function("a", "return [a" + b.join(", a") + "];")
                }
            };
            "function" === typeof define && define.om ? define(function () {
                return c
            }) : "undefined" !== typeof b ? b.ff = c : "undefined" !== typeof self ? self.a = c : window.a = c
        }
        )();
        $m = b.ff
    }
    )();
    function an(b) {
        this.d = $m(b);
        this.a = {}
    }
    l = an.prototype;
    l.ra = function (b, c) {
        var d = [b[0], b[1], b[2], b[3], c];
        this.d.ra(d);
        this.a[ma(c)] = d
    }
        ;
    l.load = function (b, c) {
        for (var d = Array(c.length), e = 0, f = c.length; e < f; e++) {
            var g = b[e]
                , h = c[e]
                , g = [g[0], g[1], g[2], g[3], h];
            d[e] = g;
            this.a[ma(h)] = g
        }
        this.d.load(d)
    }
        ;
    l.remove = function (b) {
        b = ma(b);
        var c = this.a[b];
        tb(this.a, b);
        return null !== this.d.remove(c)
    }
        ;
    l.update = function (b, c) {
        var d = ma(c);
        be(this.a[d].slice(0, 4), b) || (this.remove(c),
            this.ra(b, c))
    }
        ;
    function bn(b) {
        b = b.d.all();
        return Ra(b, function (b) {
            return b[4]
        })
    }
    function cn(b, c) {
        var d = b.d.search(c);
        return Ra(d, function (b) {
            return b[4]
        })
    }
    l.forEach = function (b, c) {
        return dn(bn(this), b, c)
    }
        ;
    function en(b, c, d, e) {
        return dn(cn(b, c), d, e)
    }
    function dn(b, c, d) {
        for (var e, f = 0, g = b.length; f < g && !(e = c.call(d, b[f])); f++)
            ;
        return e
    }
    l.la = function () {
        return rb(this.a)
    }
        ;
    l.clear = function () {
        this.d.clear();
        this.a = {}
    }
        ;
    l.D = function () {
        return this.d.data.bbox
    }
        ;
    function fn(b) {
        b = m(b) ? b : {};
        Ki.call(this, {
            attributions: b.attributions,
            logo: b.logo,
            projection: b.projection,
            state: m(b.state) ? b.state : void 0
        });
        this.b = new an;
        this.c = {};
        this.e = {};
        this.j = {};
        this.i = {};
        m(b.features) && this.gb(b.features)
    }
    v(fn, Ki);
    l = fn.prototype;
    l.Ta = function (b) {
        var c = ma(b).toString();
        gn(this, c, b);
        var d = b.N();
        null != d ? (d = d.D(),
            this.b.ra(d, b)) : this.c[c] = b;
        hn(this, c, b);
        this.dispatchEvent(new jn("addfeature", b));
        this.o()
    }
        ;
    function gn(b, c, d) {
        b.i[c] = [w(d, "change", b.Jf, !1, b), w(d, "propertychange", b.Jf, !1, b)]
    }
    function hn(b, c, d) {
        var e = d.X;
        m(e) ? b.e[e.toString()] = d : b.j[c] = d
    }
    l.Ea = function (b) {
        this.gb(b);
        this.o()
    }
        ;
    l.gb = function (b) {
        var c, d, e, f, g = [], h = [];
        d = 0;
        for (e = b.length; d < e; d++) {
            f = b[d];
            c = ma(f).toString();
            gn(this, c, f);
            var k = f.N();
            null != k ? (c = k.D(),
                g.push(c),
                h.push(f)) : this.c[c] = f
        }
        this.b.load(g, h);
        d = 0;
        for (e = b.length; d < e; d++)
            f = b[d],
                c = ma(f).toString(),
                hn(this, c, f),
                this.dispatchEvent(new jn("addfeature", f))
    }
        ;
    l.clear = function (b) {
        if (b) {
            for (var c in this.i)
                Oa(this.i[c], Tc);
            this.i = {};
            this.e = {};
            this.j = {}
        } else
            b = this.fg,
                this.b.forEach(b, this),
                jb(this.c, b, this);
        this.b.clear();
        this.c = {};
        this.dispatchEvent(new jn("clear"));
        this.o()
    }
        ;
    l.Za = function (b, c) {
        return this.b.forEach(b, c)
    }
        ;
    function kn(b, c, d) {
        b.ua([c[0], c[1], c[0], c[1]], function (b) {
            if (b.N().Jb(c[0], c[1]))
                return d.call(void 0, b)
        })
    }
    l.ua = function (b, c, d) {
        return en(this.b, b, c, d)
    }
        ;
    l.Eb = function (b, c, d, e) {
        return this.ua(b, d, e)
    }
        ;
    l.Ja = function (b, c, d) {
        return this.ua(b, function (e) {
            if (e.N().ja(b) && (e = c.call(d, e)))
                return e
        })
    }
        ;
    l.ya = function () {
        var b = bn(this.b);
        rb(this.c) || Za(b, mb(this.c));
        return b
    }
        ;
    l.La = function (b) {
        var c = [];
        kn(this, b, function (b) {
            c.push(b)
        });
        return c
    }
        ;
    l.$a = function (b) {
        var c = b[0]
            , d = b[1]
            , e = null
            , f = [NaN, NaN]
            , g = Infinity
            , h = [-Infinity, -Infinity, Infinity, Infinity];
        en(this.b, h, function (b) {
            var n = b.N()
                , p = g;
            g = n.Xa(c, d, f, g);
            g < p && (e = b,
                b = Math.sqrt(g),
                h[0] = c - b,
                h[1] = d - b,
                h[2] = c + b,
                h[3] = d + b)
        });
        return e
    }
        ;
    l.D = function () {
        return this.b.D()
    }
        ;
    l.Ka = function (b) {
        b = this.e[b.toString()];
        return m(b) ? b : null
    }
        ;
    l.Jf = function (b) {
        b = b.target;
        var c = ma(b).toString()
            , d = b.N();
        null != d ? (d = d.D(),
            c in this.c ? (delete this.c[c],
                this.b.ra(d, b)) : this.b.update(d, b)) : c in this.c || (this.b.remove(b),
                    this.c[c] = b);
        d = b.X;
        m(d) ? (d = d.toString(),
            c in this.j ? (delete this.j[c],
                this.e[d] = b) : this.e[d] !== b && (ln(this, b),
                    this.e[d] = b)) : c in this.j || (ln(this, b),
                        this.j[c] = b);
        this.o();
        this.dispatchEvent(new jn("changefeature", b))
    }
        ;
    l.la = function () {
        return this.b.la() && rb(this.c)
    }
        ;
    l.Hb = ca;
    l.bb = function (b) {
        var c = ma(b).toString();
        c in this.c ? delete this.c[c] : this.b.remove(b);
        this.fg(b);
        this.o()
    }
        ;
    l.fg = function (b) {
        var c = ma(b).toString();
        Oa(this.i[c], Tc);
        delete this.i[c];
        var d = b.X;
        m(d) ? delete this.e[d.toString()] : delete this.j[c];
        this.dispatchEvent(new jn("removefeature", b))
    }
        ;
    function ln(b, c) {
        for (var d in b.e)
            if (b.e[d] === c) {
                delete b.e[d];
                break
            }
    }
    function jn(b, c) {
        pc.call(this, b);
        this.feature = c
    }
    v(jn, pc);
    function mn(b) {
        this.a = b.source;
        this.H = Gd();
        this.b = Pf();
        this.c = [0, 0];
        this.i = null;
        Zm.call(this, {
            attributions: b.attributions,
            canvasFunction: ra(this.gh, this),
            logo: b.logo,
            projection: b.projection,
            ratio: b.ratio,
            resolutions: b.resolutions,
            state: this.a.n
        });
        this.l = null;
        this.e = void 0;
        this.Hf(b.style);
        w(this.a, "change", this.Rj, void 0, this)
    }
    v(mn, Zm);
    l = mn.prototype;
    l.gh = function (b, c, d, e, f) {
        var g = new qm(.5 * c / d, b, c);
        this.a.Hb(b, c, f);
        var h = !1;
        this.a.Eb(b, c, function (b) {
            var e;
            if (!(e = h)) {
                var f;
                m(b.a) ? f = b.a.call(b, c) : m(this.e) && (f = this.e(b, c));
                if (null != f) {
                    var q, r = !1;
                    e = 0;
                    for (q = f.length; e < q; ++e)
                        r = Tm(g, b, f[e], Sm(c, d), this.Qj, this) || r;
                    e = r
                } else
                    e = !1
            }
            h = e
        }, this);
        rm(g);
        if (h)
            return null;
        this.c[0] != e[0] || this.c[1] != e[1] ? (this.b.canvas.width = e[0],
            this.b.canvas.height = e[1],
            this.c[0] = e[0],
            this.c[1] = e[1]) : this.b.clearRect(0, 0, e[0], e[1]);
        b = nn(this, ie(b), c, d, e);
        um(g, this.b, d, b, 0, {});
        this.i = g;
        return this.b.canvas
    }
        ;
    l.Cd = function (b, c, d, e, f) {
        if (null !== this.i) {
            var g = {};
            return this.i.b(b, c, 0, e, function (b) {
                var c = ma(b).toString();
                if (!(c in g))
                    return g[c] = !0,
                        f(b)
            })
        }
    }
        ;
    l.Nj = function () {
        return this.a
    }
        ;
    l.Oj = function () {
        return this.l
    }
        ;
    l.Pj = function () {
        return this.e
    }
        ;
    function nn(b, c, d, e, f) {
        return rj(b.H, f[0] / 2, f[1] / 2, e / d, -e / d, 0, -c[0], -c[1])
    }
    l.Qj = function () {
        this.o()
    }
        ;
    l.Rj = function () {
        Li(this, this.a.n)
    }
        ;
    l.Hf = function (b) {
        this.l = m(b) ? b : pl;
        this.e = null === b ? void 0 : nl(this.l);
        this.o()
    }
        ;
    function on(b, c) {
        vm.call(this, b, c);
        this.f = null;
        this.e = Gd();
        this.b = this.c = null
    }
    v(on, vm);
    l = on.prototype;
    l.Sa = function (b, c, d, e) {
        var f = this.a;
        return f.a().Cd(b, c.viewState.resolution, c.viewState.rotation, c.skippedFeatureUids, function (b) {
            return d.call(e, b, f)
        })
    }
        ;
    l.ac = function (b, c, d, e) {
        if (!fa(this.Bd()))
            if (this.a.a() instanceof mn) {
                if (b = this.d.b.ia(b),
                    this.Sa(b, c, Zc, this))
                    return d.call(e, this.a)
            } else if (null === this.c && (this.c = Gd(),
                Md(this.e, this.c)),
                c = ym(b, this.c),
                null === this.b && (this.b = Pf(1, 1)),
                this.b.clearRect(0, 0, 1, 1),
                this.b.drawImage(this.Bd(), c[0], c[1], 1, 1, 0, 0, 1, 1),
                0 < this.b.getImageData(0, 0, 1, 1).data[3])
                return d.call(e, this.a)
    }
        ;
    l.Bd = function () {
        return null === this.f ? null : this.f.a()
    }
        ;
    l.jf = function () {
        return this.e
    }
        ;
    l.ze = function (b, c) {
        var d = b.pixelRatio, e = b.viewState, f = e.center, g = e.resolution, h = e.rotation, k, n = this.a.a(), p = b.viewHints;
        k = b.extent;
        m(c.extent) && (k = ne(k, c.extent));
        p[0] || p[1] || qe(k) || (e = e.projection,
            p = n.g,
            null === p || (e = p),
            k = n.rc(k, g, d, e),
            null !== k && ej(this, k) && (this.f = k));
        if (null !== this.f) {
            k = this.f;
            var e = k.D()
                , p = k.resolution
                , q = k.f
                , g = d * p / (g * q);
            rj(this.e, d * b.size[0] / 2, d * b.size[1] / 2, g, g, h, q * (e[0] - f[0]) / p, q * (f[1] - e[3]) / p);
            this.c = null;
            gj(b.attributions, k.e);
            hj(b, n)
        }
        return !0
    }
        ;
    function pn(b, c) {
        vm.call(this, b, c);
        this.b = this.e = null;
        this.i = !1;
        this.g = null;
        this.n = Gd();
        this.f = null;
        this.p = NaN;
        this.j = this.c = null
    }
    v(pn, vm);
    pn.prototype.Bd = function () {
        return this.e
    }
        ;
    pn.prototype.jf = function () {
        return this.n
    }
        ;
    pn.prototype.ze = function (b, c) {
        var d = b.pixelRatio, e = b.viewState, f = e.projection, g = this.a, h = g.a(), k = bj(h, f), n = h.dd(), p = $b(k.a, e.resolution, 0), q = h.Ic(p, b.pixelRatio, f), r = k.na(p), s = r / (q / k.va(p)), u = e.center, y;
        r == e.resolution ? (u = kj(u, r, b.size),
            y = le(u, r, e.rotation, b.size)) : y = b.extent;
        m(c.extent) && (y = ne(y, c.extent));
        if (qe(y))
            return !1;
        var A = Vi(k, y, r), z = q * (A.c - A.a + 1), D = q * (A.d - A.b + 1), x, T;
        null === this.e ? (T = Pf(z, D),
            this.e = T.canvas,
            this.b = [z, D],
            this.g = T,
            this.i = !zm(this.b)) : (x = this.e,
                T = this.g,
                this.b[0] < z || this.b[1] < D || this.i && (this.b[0] > z || this.b[1] > D) ? (x.width = z,
                    x.height = D,
                    this.b = [z, D],
                    this.i = !zm(this.b),
                    this.c = null) : (z = this.b[0],
                        D = this.b[1],
                        p == this.p && of(this.c, A) || (this.c = null)));
        var O, W;
        null === this.c ? (z /= q,
            D /= q,
            O = A.a - Math.floor((z - (A.c - A.a + 1)) / 2),
            W = A.b - Math.floor((D - (A.d - A.b + 1)) / 2),
            this.p = p,
            this.c = new lf(O, O + z - 1, W, W + D - 1),
            this.j = Array(z * D),
            D = this.c) : (D = this.c,
                z = D.c - D.a + 1);
        x = {};
        x[p] = {};
        var V = [], ta = ra(h.le, h, x, jj(function (b) {
            return null !== b && 2 == b.state
        }, h, d, f)), Jb = g.da(), Qa = Rd(), Sb = new lf(0, 0, 0, 0), Gb, La, Tb;
        for (W = A.a; W <= A.c; ++W)
            for (Tb = A.b; Tb <= A.d; ++Tb)
                La = h.Fb(p, W, Tb, d, f),
                    O = La.state,
                    2 == O || 4 == O || 3 == O && !Jb ? x[p][kf(La.a)] = La : (Gb = k.bd(La.a, ta, null, Sb, Qa),
                        Gb || (V.push(La),
                            Gb = k.md(La.a, Sb, Qa),
                            null === Gb || ta(p + 1, Gb)));
        ta = 0;
        for (Gb = V.length; ta < Gb; ++ta)
            La = V[ta],
                W = q * (La.a[1] - D.a),
                Tb = q * (D.d - La.a[2]),
                T.clearRect(W, Tb, q, q);
        V = Ra(nb(x), Number);
        bb(V);
        var Ob = h.s, td = ke(Ti(k, [p, D.a, D.d], Qa)), kd, we, aj, Jh, Ef, Ql, ta = 0;
        for (Gb = V.length; ta < Gb; ++ta)
            if (kd = V[ta],
                q = h.Ic(kd, d, f),
                Jh = x[kd],
                kd == p)
                for (aj in Jh)
                    La = Jh[aj],
                        we = (La.a[2] - D.b) * z + (La.a[1] - D.a),
                        this.j[we] != La && (W = q * (La.a[1] - D.a),
                            Tb = q * (D.d - La.a[2]),
                            O = La.state,
                            4 != O && (3 != O || Jb) && Ob || T.clearRect(W, Tb, q, q),
                            2 == O && T.drawImage(La.Qa(), n, n, q, q, W, Tb, q, q),
                            this.j[we] = La);
            else
                for (aj in kd = k.na(kd) / r,
                    Jh)
                    for (La = Jh[aj],
                        we = Ti(k, La.a, Qa),
                        W = (we[0] - td[0]) / s,
                        Tb = (td[1] - we[3]) / s,
                        Ql = kd * q,
                        Ef = kd * q,
                        O = La.state,
                        4 != O && Ob || T.clearRect(W, Tb, Ql, Ef),
                        2 == O && T.drawImage(La.Qa(), n, n, q, q, W, Tb, Ql, Ef),
                        La = Ui(k, we, p, Sb),
                        O = Math.max(La.a, D.a),
                        Tb = Math.min(La.c, D.c),
                        W = Math.max(La.b, D.b),
                        La = Math.min(La.d, D.d); O <= Tb; ++O)
                        for (Ef = W; Ef <= La; ++Ef)
                            we = (Ef - D.b) * z + (O - D.a),
                                this.j[we] = void 0;
        ij(b.usedTiles, h, p, A);
        lj(b, h, k, d, f, y, p, g.r());
        fj(b, h);
        hj(b, h);
        rj(this.n, d * b.size[0] / 2, d * b.size[1] / 2, d * s / e.resolution, d * s / e.resolution, e.rotation, (td[0] - u[0]) / s, (u[1] - td[1]) / s);
        this.f = null;
        return !0
    }
        ;
    pn.prototype.ac = function (b, c, d, e) {
        if (null !== this.g && (null === this.f && (this.f = Gd(),
            Md(this.n, this.f)),
            b = ym(b, this.f),
            0 < this.g.getImageData(b[0], b[1], 1, 1).data[3]))
            return d.call(e, this.a)
    }
        ;
    function qn(b, c) {
        vm.call(this, b, c);
        this.c = !1;
        this.i = -1;
        this.j = NaN;
        this.e = Rd();
        this.b = this.g = null;
        this.f = Pf()
    }
    v(qn, vm);
    qn.prototype.l = function (b, c, d) {
        var e = xm(this, b);
        wm(this, "precompose", d, b, e);
        var f = this.b;
        if (null !== f && !f.la()) {
            var g;
            gd(this.a, "render") ? (this.f.canvas.width = d.canvas.width,
                this.f.canvas.height = d.canvas.height,
                g = this.f) : g = d;
            var h = g.globalAlpha;
            g.globalAlpha = c.opacity;
            um(f, g, b.pixelRatio, e, b.viewState.rotation, b.skippedFeatureUids);
            g != d && (wm(this, "render", g, b, e),
                d.drawImage(g.canvas, 0, 0));
            g.globalAlpha = h
        }
        wm(this, "postcompose", d, b, e)
    }
        ;
    qn.prototype.Sa = function (b, c, d, e) {
        if (null !== this.b) {
            var f = this.a
                , g = {};
            return this.b.b(b, c.viewState.resolution, c.viewState.rotation, c.skippedFeatureUids, function (b) {
                var c = ma(b).toString();
                if (!(c in g))
                    return g[c] = !0,
                        d.call(e, b, f)
            })
        }
    }
        ;
    qn.prototype.n = function () {
        dj(this)
    }
        ;
    qn.prototype.ze = function (b) {
        function c(b) {
            var c;
            m(b.a) ? c = b.a.call(b, k) : m(d.r) && (c = (0,
                d.r)(b, k));
            if (null != c) {
                if (null != c) {
                    var e, f, g = !1;
                    e = 0;
                    for (f = c.length; e < f; ++e)
                        g = Tm(q, b, c[e], Sm(k, n), this.n, this) || g;
                    b = g
                } else
                    b = !1;
                this.c = this.c || b
            }
        }
        var d = this.a
            , e = d.a();
        gj(b.attributions, e.f);
        hj(b, e);
        if (!this.c && (!d.vc && b.viewHints[0] || b.viewHints[1]))
            return !0;
        var f = b.extent
            , g = b.viewState
            , h = g.projection
            , k = g.resolution
            , n = b.pixelRatio;
        b = d.d;
        var p = d.da
            , g = d.get("renderOrder");
        m(g) || (g = Rm);
        f = Vd(f, p * k);
        if (!this.c && this.j == k && this.i == b && this.g == g && Yd(this.e, f))
            return !0;
        oc(this.b);
        this.b = null;
        this.c = !1;
        var q = new qm(.5 * k / n, f, k, d.da);
        e.Hb(f, k, h);
        if (null === g)
            e.Eb(f, k, c, this);
        else {
            var r = [];
            e.Eb(f, k, function (b) {
                r.push(b)
            }, this);
            bb(r, g);
            Oa(r, c, this)
        }
        rm(q);
        this.j = k;
        this.i = b;
        this.g = g;
        this.e = f;
        this.b = q;
        return !0
    }
        ;
    function rn(b, c) {
        uj.call(this, 0, c);
        this.j = Pf();
        this.a = this.j.canvas;
        this.a.style.width = "100%";
        this.a.style.height = "100%";
        this.a.className = "ol-unselectable";
        Kf(b, this.a, 0);
        this.d = !0;
        this.i = Gd()
    }
    v(rn, uj);
    rn.prototype.$c = function (b) {
        return b instanceof I ? new on(this, b) : b instanceof J ? new pn(this, b) : b instanceof K ? new qn(this, b) : null
    }
        ;
    function sn(b, c, d) {
        var e = b.b
            , f = b.j;
        if (gd(e, c)) {
            var g = d.extent
                , h = d.pixelRatio
                , k = d.viewState
                , n = k.resolution
                , p = k.rotation;
            rj(b.i, b.a.width / 2, b.a.height / 2, h / n, -h / n, -p, -k.center[0], -k.center[1]);
            k = new qm(.5 * n / h, g, n);
            g = new Ol(f, h, g, b.i, p);
            e.dispatchEvent(new Uk(c, e, g, k, d, f, null));
            rm(k);
            k.la() || um(k, f, h, b.i, p, {});
            am(g);
            b.c = k
        }
    }
    rn.prototype.I = function () {
        return "canvas"
    }
        ;
    rn.prototype.Sd = function (b) {
        if (null === b)
            this.d && (Mg(this.a, !1),
                this.d = !1);
        else {
            var c = this.j
                , d = b.size[0] * b.pixelRatio
                , e = b.size[1] * b.pixelRatio;
            this.a.width != d || this.a.height != e ? (this.a.width = d,
                this.a.height = e) : c.clearRect(0, 0, this.a.width, this.a.height);
            vj(b);
            sn(this, "precompose", b);
            var d = b.layerStatesArray, e = b.viewState.resolution, f, g, h, k;
            f = 0;
            for (g = d.length; f < g; ++f)
                k = d[f],
                    h = k.layer,
                    h = xj(this, h),
                    Ni(k, e) && "ready" == k.hc && h.ze(b, k) && h.l(b, k, c);
            sn(this, "postcompose", b);
            this.d || (Mg(this.a, !0),
                this.d = !0);
            yj(this, b);
            b.postRenderFunctions.push(wj)
        }
    }
        ;
    function tn(b, c, d) {
        cj.call(this, b, c);
        this.target = d
    }
    v(tn, cj);
    tn.prototype.f = ca;
    tn.prototype.j = ca;
    function un(b, c) {
        var d = Gf("DIV");
        d.style.position = "absolute";
        tn.call(this, b, c, d);
        this.b = null;
        this.c = Id()
    }
    v(un, tn);
    un.prototype.Sa = function (b, c, d, e) {
        var f = this.a;
        return f.a().Cd(b, c.viewState.resolution, c.viewState.rotation, c.skippedFeatureUids, function (b) {
            return d.call(e, b, f)
        })
    }
        ;
    un.prototype.f = function () {
        If(this.target);
        this.b = null
    }
        ;
    un.prototype.e = function (b, c) {
        var d = b.viewState
            , e = d.center
            , f = d.resolution
            , g = d.rotation
            , h = this.b
            , k = this.a.a()
            , n = b.viewHints
            , p = b.extent;
        m(c.extent) && (p = ne(p, c.extent));
        n[0] || n[1] || qe(p) || (d = d.projection,
            n = k.g,
            null === n || (d = n),
            p = k.rc(p, f, b.pixelRatio, d),
            null === p || ej(this, p) && (h = p));
        null !== h && (d = h.D(),
            n = h.resolution,
            p = Gd(),
            rj(p, b.size[0] / 2, b.size[1] / 2, n / f, n / f, g, (d[0] - e[0]) / n, (e[1] - d[3]) / n),
            h != this.b && (e = h.a(this),
                e.style.maxWidth = "none",
                e.style.position = "absolute",
                If(this.target),
                this.target.appendChild(e),
                this.b = h),
            sj(p, this.c) || (Tf(this.target, p),
                Jd(this.c, p)),
            gj(b.attributions, h.e),
            hj(b, k));
        return !0
    }
        ;
    function vn(b, c) {
        var d = Gf("DIV");
        d.style.position = "absolute";
        tn.call(this, b, c, d);
        this.c = !0;
        this.i = 1;
        this.g = 0;
        this.b = {}
    }
    v(vn, tn);
    vn.prototype.f = function () {
        If(this.target);
        this.g = 0
    }
        ;
    vn.prototype.e = function (b, c) {
        if (!c.visible)
            return this.c && (Mg(this.target, !1),
                this.c = !1),
                !0;
        var d = b.pixelRatio, e = b.viewState, f = e.projection, g = this.a, h = g.a(), k = bj(h, f), n = h.dd(), p = $b(k.a, e.resolution, 0), q = k.na(p), r = e.center, s;
        q == e.resolution ? (r = kj(r, q, b.size),
            s = le(r, q, e.rotation, b.size)) : s = b.extent;
        m(c.extent) && (s = ne(s, c.extent));
        var q = Vi(k, s, q)
            , u = {};
        u[p] = {};
        var y = ra(h.le, h, u, jj(function (b) {
            return null !== b && 2 == b.state
        }, h, d, f)), A = g.da(), z = Rd(), D = new lf(0, 0, 0, 0), x, T, O, W;
        for (O = q.a; O <= q.c; ++O)
            for (W = q.b; W <= q.d; ++W)
                x = h.Fb(p, O, W, d, f),
                    T = x.state,
                    2 == T ? u[p][kf(x.a)] = x : 4 == T || 3 == T && !A || (T = k.bd(x.a, y, null, D, z),
                        T || (x = k.md(x.a, D, z),
                            null === x || y(p + 1, x)));
        var V;
        if (this.g != h.d) {
            for (V in this.b)
                A = this.b[+V],
                    Lf(A.target);
            this.b = {};
            this.g = h.d
        }
        z = Ra(nb(u), Number);
        bb(z);
        var y = {}, ta;
        O = 0;
        for (W = z.length; O < W; ++O) {
            V = z[O];
            V in this.b ? A = this.b[V] : (A = k.Hc(r, V),
                A = new wn(k, A),
                y[V] = !0,
                this.b[V] = A);
            V = u[V];
            for (ta in V)
                xn(A, V[ta], n);
            yn(A)
        }
        n = Ra(nb(this.b), Number);
        bb(n);
        O = Gd();
        ta = 0;
        for (z = n.length; ta < z; ++ta)
            if (V = n[ta],
                A = this.b[V],
                V in u)
                if (x = A.g,
                    W = A.e,
                    rj(O, b.size[0] / 2, b.size[1] / 2, x / e.resolution, x / e.resolution, e.rotation, (W[0] - r[0]) / x, (r[1] - W[1]) / x),
                    zn(A, O),
                    V in y) {
                    for (--V; 0 <= V; --V)
                        if (V in this.b) {
                            Jf(A.target, this.b[V].target);
                            break
                        }
                    0 > V && Kf(this.target, A.target, 0)
                } else
                    b.viewHints[0] || b.viewHints[1] || An(A, s, D);
            else
                Lf(A.target),
                    delete this.b[V];
        c.opacity != this.i && (this.i = this.target.style.opacity = c.opacity);
        c.visible && !this.c && (Mg(this.target, !0),
            this.c = !0);
        ij(b.usedTiles, h, p, q);
        lj(b, h, k, d, f, s, p, g.r());
        fj(b, h);
        hj(b, h);
        return !0
    }
        ;
    function wn(b, c) {
        this.target = Gf("DIV");
        this.target.style.position = "absolute";
        this.target.style.width = "100%";
        this.target.style.height = "100%";
        this.c = b;
        this.b = c;
        this.e = ke(Ti(b, c));
        this.g = b.na(c[0]);
        this.d = {};
        this.a = null;
        this.f = Id()
    }
    function xn(b, c, d) {
        var e = c.a
            , f = e[0]
            , g = e[1]
            , h = e[2]
            , e = kf(e);
        if (!(e in b.d)) {
            var f = b.c.va(f)
                , k = c.Qa(b)
                , n = k.style;
            n.maxWidth = "none";
            var p, q;
            0 < d ? (p = Gf("DIV"),
                q = p.style,
                q.overflow = "hidden",
                q.width = f + "px",
                q.height = f + "px",
                n.position = "absolute",
                n.left = -d + "px",
                n.top = -d + "px",
                n.width = f + 2 * d + "px",
                n.height = f + 2 * d + "px",
                p.appendChild(k)) : (n.width = f + "px",
                    n.height = f + "px",
                    p = k,
                    q = n);
            q.position = "absolute";
            q.left = (g - b.b[1]) * f + "px";
            q.top = (b.b[2] - h) * f + "px";
            null === b.a && (b.a = document.createDocumentFragment());
            b.a.appendChild(p);
            b.d[e] = c
        }
    }
    function yn(b) {
        null !== b.a && (b.target.appendChild(b.a),
            b.a = null)
    }
    function An(b, c, d) {
        var e = Ui(b.c, c, b.b[0], d);
        c = [];
        for (var f in b.d)
            d = b.d[f],
                e.contains(d.a) || c.push(d);
        var g, e = 0;
        for (g = c.length; e < g; ++e)
            d = c[e],
                f = kf(d.a),
                Lf(d.Qa(b)),
                delete b.d[f]
    }
    function zn(b, c) {
        sj(c, b.f) || (Tf(b.target, c),
            Jd(b.f, c))
    }
    ; function Bn(b, c) {
        this.g = Pf();
        var d = this.g.canvas;
        d.style.maxWidth = "none";
        d.style.position = "absolute";
        tn.call(this, b, c, d);
        this.c = !1;
        this.p = -1;
        this.l = NaN;
        this.i = Rd();
        this.b = this.n = null;
        this.r = Gd();
        this.q = Gd()
    }
    v(Bn, tn);
    Bn.prototype.j = function (b, c) {
        var d = b.viewState
            , e = d.center
            , f = d.rotation
            , g = d.resolution
            , d = b.pixelRatio
            , h = b.size[0]
            , k = b.size[1]
            , n = h * d
            , p = k * d
            , e = rj(this.r, d * h / 2, d * k / 2, d / g, -d / g, -f, -e[0], -e[1])
            , g = this.g;
        g.canvas.width = n;
        g.canvas.height = p;
        h = rj(this.q, 0, 0, 1 / d, 1 / d, 0, -(n - h) / 2 * d, -(p - k) / 2 * d);
        Tf(g.canvas, h);
        Cn(this, "precompose", b, e);
        h = this.b;
        null === h || h.la() || (g.globalAlpha = c.opacity,
            um(h, g, d, e, f, b.skippedFeatureUids),
            Cn(this, "render", b, e));
        Cn(this, "postcompose", b, e)
    }
        ;
    function Cn(b, c, d, e) {
        var f = b.g;
        b = b.a;
        gd(b, c) && (e = new Ol(f, d.pixelRatio, d.extent, e, d.viewState.rotation),
            b.dispatchEvent(new Uk(c, b, e, null, d, f, null)),
            am(e))
    }
    Bn.prototype.Sa = function (b, c, d, e) {
        if (null !== this.b) {
            var f = this.a
                , g = {};
            return this.b.b(b, c.viewState.resolution, c.viewState.rotation, c.skippedFeatureUids, function (b) {
                var c = ma(b).toString();
                if (!(c in g))
                    return g[c] = !0,
                        d.call(e, b, f)
            })
        }
    }
        ;
    Bn.prototype.s = function () {
        dj(this)
    }
        ;
    Bn.prototype.e = function (b) {
        function c(b) {
            var c;
            m(b.a) ? c = b.a.call(b, k) : m(d.r) && (c = (0,
                d.r)(b, k));
            if (null != c) {
                if (null != c) {
                    var e, f, g = !1;
                    e = 0;
                    for (f = c.length; e < f; ++e)
                        g = Tm(q, b, c[e], Sm(k, n), this.s, this) || g;
                    b = g
                } else
                    b = !1;
                this.c = this.c || b
            }
        }
        var d = this.a
            , e = d.a();
        gj(b.attributions, e.f);
        hj(b, e);
        if (!this.c && (!d.vc && b.viewHints[0] || b.viewHints[1]))
            return !0;
        var f = b.extent
            , g = b.viewState
            , h = g.projection
            , k = g.resolution
            , n = b.pixelRatio;
        b = d.d;
        var p = d.da
            , g = d.get("renderOrder");
        m(g) || (g = Rm);
        f = Vd(f, p * k);
        if (!this.c && this.l == k && this.p == b && this.n == g && Yd(this.i, f))
            return !0;
        oc(this.b);
        this.b = null;
        this.c = !1;
        var q = new qm(.5 * k / n, f, k, d.da);
        e.Hb(f, k, h);
        if (null === g)
            e.Eb(f, k, c, this);
        else {
            var r = [];
            e.Eb(f, k, function (b) {
                r.push(b)
            }, this);
            bb(r, g);
            Oa(r, c, this)
        }
        rm(q);
        this.l = k;
        this.p = b;
        this.n = g;
        this.i = f;
        this.b = q;
        return !0
    }
        ;
    function Dn(b, c) {
        uj.call(this, 0, c);
        this.d = null;
        this.d = Pf();
        var d = this.d.canvas;
        d.style.position = "absolute";
        d.style.width = "100%";
        d.style.height = "100%";
        d.className = "ol-unselectable";
        Kf(b, d, 0);
        this.i = Gd();
        this.a = Gf("DIV");
        this.a.className = "ol-unselectable";
        d = this.a.style;
        d.position = "absolute";
        d.width = "100%";
        d.height = "100%";
        w(this.a, "touchstart", rc);
        Kf(b, this.a, 0);
        this.j = !0
    }
    v(Dn, uj);
    Dn.prototype.M = function () {
        Lf(this.a);
        Dn.R.M.call(this)
    }
        ;
    Dn.prototype.$c = function (b) {
        if (b instanceof I)
            b = new un(this, b);
        else if (b instanceof J)
            b = new vn(this, b);
        else if (b instanceof K)
            b = new Bn(this, b);
        else
            return null;
        return b
    }
        ;
    function En(b, c, d) {
        var e = b.b;
        if (gd(e, c)) {
            var f = d.extent
                , g = d.pixelRatio
                , h = d.viewState
                , k = h.resolution
                , n = h.rotation
                , p = b.d
                , q = p.canvas;
            rj(b.i, q.width / 2, q.height / 2, g / h.resolution, -g / h.resolution, -h.rotation, -h.center[0], -h.center[1]);
            h = new Ol(p, g, f, b.i, n);
            f = new qm(.5 * k / g, f, k);
            e.dispatchEvent(new Uk(c, e, h, f, d, p, null));
            rm(f);
            f.la() || um(f, p, g, b.i, n, {});
            am(h);
            b.c = f
        }
    }
    Dn.prototype.I = function () {
        return "dom"
    }
        ;
    Dn.prototype.Sd = function (b) {
        if (null === b)
            this.j && (Mg(this.a, !1),
                this.j = !1);
        else {
            var c;
            c = function (b, c) {
                Kf(this.a, b, c)
            }
                ;
            var d = this.b;
            if (gd(d, "precompose") || gd(d, "postcompose")) {
                var d = this.d.canvas
                    , e = b.pixelRatio;
                d.width = b.size[0] * e;
                d.height = b.size[1] * e
            }
            En(this, "precompose", b);
            var d = b.layerStatesArray, f, g, h, e = 0;
            for (f = d.length; e < f; ++e)
                h = d[e],
                    g = h.layer,
                    g = xj(this, g),
                    c.call(this, g.target, e),
                    "ready" == h.hc ? g.e(b, h) && g.j(b, h) : g.f();
            c = b.layerStates;
            for (var k in this.g)
                k in c || (g = this.g[k],
                    Lf(g.target));
            this.j || (Mg(this.a, !0),
                this.j = !0);
            vj(b);
            yj(this, b);
            b.postRenderFunctions.push(wj);
            En(this, "postcompose", b)
        }
    }
        ;
    function Fn(b) {
        this.a = b
    }
    function Gn(b) {
        this.a = b
    }
    v(Gn, Fn);
    Gn.prototype.I = function () {
        return 35632
    }
        ;
    function Hn(b) {
        this.a = b
    }
    v(Hn, Fn);
    Hn.prototype.I = function () {
        return 35633
    }
        ;
    function In() {
        this.a = "precision mediump float;varying vec2 a;varying float b;uniform mat4 k;uniform float l;uniform sampler2D m;void main(void){vec4 texColor=texture2D(m,a);float alpha=texColor.a*b*l;if(alpha==0.0){discard;}gl_FragColor.a=alpha;gl_FragColor.rgb=(k*vec4(texColor.rgb,1.)).rgb;}"
    }
    v(In, Gn);
    da(In);
    function Jn() {
        this.a = "varying vec2 a;varying float b;attribute vec2 c;attribute vec2 d;attribute vec2 e;attribute float f;attribute float g;uniform mat4 h;uniform mat4 i;uniform mat4 j;void main(void){mat4 offsetMatrix=i;if(g==1.0){offsetMatrix=i*j;}vec4 offsets=offsetMatrix*vec4(e,0.,0.);gl_Position=h*vec4(c,0.,1.)+offsets;a=d;b=f;}"
    }
    v(Jn, Hn);
    da(Jn);
    function Kn(b, c) {
        this.n = b.getUniformLocation(c, "k");
        this.j = b.getUniformLocation(c, "j");
        this.i = b.getUniformLocation(c, "i");
        this.e = b.getUniformLocation(c, "l");
        this.g = b.getUniformLocation(c, "h");
        this.a = b.getAttribLocation(c, "e");
        this.d = b.getAttribLocation(c, "f");
        this.c = b.getAttribLocation(c, "c");
        this.b = b.getAttribLocation(c, "g");
        this.f = b.getAttribLocation(c, "d")
    }
    ; function Ln() {
        this.a = "precision mediump float;varying vec2 a;varying float b;uniform float k;uniform sampler2D l;void main(void){vec4 texColor=texture2D(l,a);gl_FragColor.rgb=texColor.rgb;float alpha=texColor.a*b*k;if(alpha==0.0){discard;}gl_FragColor.a=alpha;}"
    }
    v(Ln, Gn);
    da(Ln);
    function Mn() {
        this.a = "varying vec2 a;varying float b;attribute vec2 c;attribute vec2 d;attribute vec2 e;attribute float f;attribute float g;uniform mat4 h;uniform mat4 i;uniform mat4 j;void main(void){mat4 offsetMatrix=i;if(g==1.0){offsetMatrix=i*j;}vec4 offsets=offsetMatrix*vec4(e,0.,0.);gl_Position=h*vec4(c,0.,1.)+offsets;a=d;b=f;}"
    }
    v(Mn, Hn);
    da(Mn);
    function Nn(b, c) {
        this.j = b.getUniformLocation(c, "j");
        this.i = b.getUniformLocation(c, "i");
        this.e = b.getUniformLocation(c, "k");
        this.g = b.getUniformLocation(c, "h");
        this.a = b.getAttribLocation(c, "e");
        this.d = b.getAttribLocation(c, "f");
        this.c = b.getAttribLocation(c, "c");
        this.b = b.getAttribLocation(c, "g");
        this.f = b.getAttribLocation(c, "d")
    }
    ; function On(b) {
        this.a = m(b) ? b : [];
        this.d = m(void 0) ? void 0 : 35044
    }
    ; function Pn(b, c) {
        this.n = b;
        this.a = c;
        this.d = {};
        this.e = {};
        this.f = {};
        this.j = this.i = this.c = this.g = null;
        (this.b = Va(wa, "OES_element_index_uint")) && c.getExtension("OES_element_index_uint");
        w(this.n, "webglcontextlost", this.Ek, !1, this);
        w(this.n, "webglcontextrestored", this.Fk, !1, this)
    }
    function Qn(b, c, d) {
        var e = b.a
            , f = d.a
            , g = ma(d);
        if (g in b.d)
            e.bindBuffer(c, b.d[g].buffer);
        else {
            var h = e.createBuffer();
            e.bindBuffer(c, h);
            var k;
            34962 == c ? k = new Float32Array(f) : 34963 == c && (k = b.b ? new Uint32Array(f) : new Uint16Array(f));
            e.bufferData(c, k, d.d);
            b.d[g] = {
                b: d,
                buffer: h
            }
        }
    }
    function Rn(b, c) {
        var d = b.a
            , e = ma(c)
            , f = b.d[e];
        d.isContextLost() || d.deleteBuffer(f.buffer);
        delete b.d[e]
    }
    l = Pn.prototype;
    l.M = function () {
        var b = this.a;
        b.isContextLost() || (jb(this.d, function (c) {
            b.deleteBuffer(c.buffer)
        }),
            jb(this.f, function (c) {
                b.deleteProgram(c)
            }),
            jb(this.e, function (c) {
                b.deleteShader(c)
            }),
            b.deleteFramebuffer(this.c),
            b.deleteRenderbuffer(this.j),
            b.deleteTexture(this.i))
    }
        ;
    l.Dk = function () {
        return this.a
    }
        ;
    l.pe = function () {
        if (null === this.c) {
            var b = this.a
                , c = b.createFramebuffer();
            b.bindFramebuffer(b.FRAMEBUFFER, c);
            var d = Sn(b, 1, 1)
                , e = b.createRenderbuffer();
            b.bindRenderbuffer(b.RENDERBUFFER, e);
            b.renderbufferStorage(b.RENDERBUFFER, b.DEPTH_COMPONENT16, 1, 1);
            b.framebufferTexture2D(b.FRAMEBUFFER, b.COLOR_ATTACHMENT0, b.TEXTURE_2D, d, 0);
            b.framebufferRenderbuffer(b.FRAMEBUFFER, b.DEPTH_ATTACHMENT, b.RENDERBUFFER, e);
            b.bindTexture(b.TEXTURE_2D, null);
            b.bindRenderbuffer(b.RENDERBUFFER, null);
            b.bindFramebuffer(b.FRAMEBUFFER, null);
            this.c = c;
            this.i = d;
            this.j = e
        }
        return this.c
    }
        ;
    function Tn(b, c) {
        var d = ma(c);
        if (d in b.e)
            return b.e[d];
        var e = b.a
            , f = e.createShader(c.I());
        e.shaderSource(f, c.a);
        e.compileShader(f);
        return b.e[d] = f
    }
    function Un(b, c, d) {
        var e = ma(c) + "/" + ma(d);
        if (e in b.f)
            return b.f[e];
        var f = b.a
            , g = f.createProgram();
        f.attachShader(g, Tn(b, c));
        f.attachShader(g, Tn(b, d));
        f.linkProgram(g);
        return b.f[e] = g
    }
    l.Ek = function () {
        sb(this.d);
        sb(this.e);
        sb(this.f);
        this.j = this.i = this.c = this.g = null
    }
        ;
    l.Fk = function () { }
        ;
    l.Ld = function (b) {
        if (b == this.g)
            return !1;
        this.a.useProgram(b);
        this.g = b;
        return !0
    }
        ;
    function Vn(b, c, d) {
        var e = b.createTexture();
        b.bindTexture(b.TEXTURE_2D, e);
        b.texParameteri(b.TEXTURE_2D, b.TEXTURE_MAG_FILTER, b.LINEAR);
        b.texParameteri(b.TEXTURE_2D, b.TEXTURE_MIN_FILTER, b.LINEAR);
        m(c) && b.texParameteri(3553, 10242, c);
        m(d) && b.texParameteri(3553, 10243, d);
        return e
    }
    function Sn(b, c, d) {
        var e = Vn(b, void 0, void 0);
        b.texImage2D(b.TEXTURE_2D, 0, b.RGBA, c, d, 0, b.RGBA, b.UNSIGNED_BYTE, null);
        return e
    }
    function Wn(b, c) {
        var d = Vn(b, 33071, 33071);
        b.texImage2D(b.TEXTURE_2D, 0, b.RGBA, b.RGBA, b.UNSIGNED_BYTE, c);
        return d
    }
    ; function Xn(b, c) {
        this.r = this.q = void 0;
        this.Ca = new ug;
        this.i = ie(c);
        this.p = [];
        this.e = [];
        this.H = void 0;
        this.f = [];
        this.c = [];
        this.U = this.S = void 0;
        this.d = [];
        this.F = this.s = this.j = null;
        this.ba = void 0;
        this.ka = Id();
        this.ta = Id();
        this.oa = this.ca = void 0;
        this.Da = Id();
        this.Ba = this.ea = this.pa = void 0;
        this.ha = [];
        this.g = [];
        this.a = [];
        this.l = null;
        this.b = [];
        this.n = [];
        this.da = void 0
    }
    function Yn(b, c) {
        var d = b.l
            , e = b.j
            , f = b.ha
            , g = b.g
            , h = c.a;
        return function () {
            if (!h.isContextLost()) {
                var b, n;
                b = 0;
                for (n = f.length; b < n; ++b)
                    h.deleteTexture(f[b]);
                b = 0;
                for (n = g.length; b < n; ++b)
                    h.deleteTexture(g[b])
            }
            Rn(c, d);
            Rn(c, e)
        }
    }
    function Zn(b, c, d, e) {
        var f = b.q, g = b.r, h = b.H, k = b.S, n = b.U, p = b.ba, q = b.ca, r = b.oa, s = b.pa ? 1 : 0, u = b.ea, y = b.Ba, A = b.da, z = Math.cos(u), u = Math.sin(u), D = b.d.length, x = b.a.length, T, O, W, V, ta, Jb;
        for (T = 0; T < d; T += e)
            ta = c[T] - b.i[0],
                Jb = c[T + 1] - b.i[1],
                O = x / 8,
                W = -y * f,
                V = -y * (h - g),
                b.a[x++] = ta,
                b.a[x++] = Jb,
                b.a[x++] = W * z - V * u,
                b.a[x++] = W * u + V * z,
                b.a[x++] = q / n,
                b.a[x++] = (r + h) / k,
                b.a[x++] = p,
                b.a[x++] = s,
                W = y * (A - f),
                V = -y * (h - g),
                b.a[x++] = ta,
                b.a[x++] = Jb,
                b.a[x++] = W * z - V * u,
                b.a[x++] = W * u + V * z,
                b.a[x++] = (q + A) / n,
                b.a[x++] = (r + h) / k,
                b.a[x++] = p,
                b.a[x++] = s,
                W = y * (A - f),
                V = y * g,
                b.a[x++] = ta,
                b.a[x++] = Jb,
                b.a[x++] = W * z - V * u,
                b.a[x++] = W * u + V * z,
                b.a[x++] = (q + A) / n,
                b.a[x++] = r / k,
                b.a[x++] = p,
                b.a[x++] = s,
                W = -y * f,
                V = y * g,
                b.a[x++] = ta,
                b.a[x++] = Jb,
                b.a[x++] = W * z - V * u,
                b.a[x++] = W * u + V * z,
                b.a[x++] = q / n,
                b.a[x++] = r / k,
                b.a[x++] = p,
                b.a[x++] = s,
                b.d[D++] = O,
                b.d[D++] = O + 1,
                b.d[D++] = O + 2,
                b.d[D++] = O,
                b.d[D++] = O + 2,
                b.d[D++] = O + 3
    }
    l = Xn.prototype;
    l.rb = function (b, c) {
        this.b.push(this.d.length);
        this.n.push(c);
        var d = b.k;
        Zn(this, d, d.length, b.t)
    }
        ;
    l.sb = function (b, c) {
        this.b.push(this.d.length);
        this.n.push(c);
        var d = b.k;
        Zn(this, d, d.length, b.t)
    }
        ;
    l.Kb = function (b) {
        var c = b.a;
        this.p.push(this.d.length);
        this.e.push(this.d.length);
        this.l = new On(this.a);
        Qn(b, 34962, this.l);
        this.j = new On(this.d);
        Qn(b, 34963, this.j);
        b = {};
        $n(this.ha, this.f, b, c);
        $n(this.g, this.c, b, c);
        this.H = this.r = this.q = void 0;
        this.c = this.f = null;
        this.U = this.S = void 0;
        this.d = null;
        this.Ba = this.ea = this.pa = this.oa = this.ca = this.ba = void 0;
        this.a = null;
        this.da = void 0
    }
        ;
    function $n(b, c, d, e) {
        var f, g, h, k = c.length;
        for (h = 0; h < k; ++h)
            f = c[h],
                g = ma(f).toString(),
                g in d ? f = d[g] : (f = Wn(e, f),
                    d[g] = f),
                b[h] = f
    }
    l.$b = function (b, c, d, e, f, g, h, k, n, p, q, r, s, u, y) {
        g = b.a;
        Qn(b, 34962, this.l);
        Qn(b, 34963, this.j);
        var A = k || 1 != n || p || 1 != q, z, D;
        A ? (z = In.Ma(),
            D = Jn.Ma()) : (z = Ln.Ma(),
                D = Mn.Ma());
        D = Un(b, z, D);
        A ? null === this.s ? this.s = z = new Kn(g, D) : z = this.s : null === this.F ? this.F = z = new Nn(g, D) : z = this.F;
        b.Ld(D);
        g.enableVertexAttribArray(z.c);
        g.vertexAttribPointer(z.c, 2, 5126, !1, 32, 0);
        g.enableVertexAttribArray(z.a);
        g.vertexAttribPointer(z.a, 2, 5126, !1, 32, 8);
        g.enableVertexAttribArray(z.f);
        g.vertexAttribPointer(z.f, 2, 5126, !1, 32, 16);
        g.enableVertexAttribArray(z.d);
        g.vertexAttribPointer(z.d, 1, 5126, !1, 32, 24);
        g.enableVertexAttribArray(z.b);
        g.vertexAttribPointer(z.b, 1, 5126, !1, 32, 28);
        D = this.Da;
        rj(D, 0, 0, 2 / (d * f[0]), 2 / (d * f[1]), -e, -(c[0] - this.i[0]), -(c[1] - this.i[1]));
        c = this.ta;
        d = 2 / f[0];
        f = 2 / f[1];
        Kd(c);
        c[0] = d;
        c[5] = f;
        c[10] = 1;
        c[15] = 1;
        f = this.ka;
        Kd(f);
        0 !== e && Pd(f, -e);
        g.uniformMatrix4fv(z.g, !1, D);
        g.uniformMatrix4fv(z.i, !1, c);
        g.uniformMatrix4fv(z.j, !1, f);
        g.uniform1f(z.e, h);
        A && g.uniformMatrix4fv(z.n, !1, vg(this.Ca, k, n, p, q));
        var x;
        if (m(s)) {
            if (u)
                a: {
                    e = b.b ? 5125 : 5123;
                    b = b.b ? 4 : 2;
                    p = this.b.length - 1;
                    for (h = this.g.length - 1; 0 <= h; --h)
                        for (g.bindTexture(3553, this.g[h]),
                            k = 0 < h ? this.e[h - 1] : 0,
                            q = this.e[h]; 0 <= p && this.b[p] >= k;) {
                            n = this.b[p];
                            u = this.n[p];
                            x = ma(u).toString();
                            if (!m(r[x]) && (!m(y) || oe(y, u.N().D())) && (g.clear(g.COLOR_BUFFER_BIT | g.DEPTH_BUFFER_BIT),
                                g.drawElements(4, q - n, e, n * b),
                                q = s(u))) {
                                r = q;
                                break a
                            }
                            q = n;
                            p--
                        }
                    r = void 0
                }
            else
                g.clear(g.COLOR_BUFFER_BIT | g.DEPTH_BUFFER_BIT),
                    ao(this, g, b, r, this.g, this.e),
                    r = (r = s(null)) ? r : void 0;
            x = r
        } else
            ao(this, g, b, r, this.ha, this.p);
        g.disableVertexAttribArray(z.c);
        g.disableVertexAttribArray(z.a);
        g.disableVertexAttribArray(z.f);
        g.disableVertexAttribArray(z.d);
        g.disableVertexAttribArray(z.b);
        return x
    }
        ;
    function ao(b, c, d, e, f, g) {
        var h = d.b ? 5125 : 5123;
        d = d.b ? 4 : 2;
        if (rb(e)) {
            var k;
            b = 0;
            e = f.length;
            for (k = 0; b < e; ++b) {
                c.bindTexture(3553, f[b]);
                var n = g[b];
                c.drawElements(4, n - k, h, k * d);
                k = n
            }
        } else {
            k = 0;
            var p, n = 0;
            for (p = f.length; n < p; ++n) {
                c.bindTexture(3553, f[n]);
                for (var q = 0 < n ? g[n - 1] : 0, r = g[n], s = q; k < b.b.length && b.b[k] <= r;) {
                    var u = ma(b.n[k]).toString();
                    m(e[u]) ? (s !== q && c.drawElements(4, q - s, h, s * d),
                        q = s = k === b.b.length - 1 ? r : b.b[k + 1]) : q = k === b.b.length - 1 ? r : b.b[k + 1];
                    k++
                }
                s !== q && c.drawElements(4, q - s, h, s * d)
            }
        }
    }
    l.fb = function (b) {
        var c = b.ub()
            , d = b.zb(1)
            , e = b.ed()
            , f = b.Ed(1)
            , g = b.p
            , h = b.Ab()
            , k = b.q
            , n = b.i
            , p = b.cb();
        b = b.n;
        var q;
        0 === this.f.length ? this.f.push(d) : (q = this.f[this.f.length - 1],
            ma(q) != ma(d) && (this.p.push(this.d.length),
                this.f.push(d)));
        0 === this.c.length ? this.c.push(f) : (q = this.c[this.c.length - 1],
            ma(q) != ma(f) && (this.e.push(this.d.length),
                this.c.push(f)));
        this.q = c[0];
        this.r = c[1];
        this.H = p[1];
        this.S = e[1];
        this.U = e[0];
        this.ba = g;
        this.ca = h[0];
        this.oa = h[1];
        this.ea = n;
        this.pa = k;
        this.Ba = b;
        this.da = p[0]
    }
        ;
    function bo(b, c, d) {
        this.f = c;
        this.e = b;
        this.c = d;
        this.d = {}
    }
    function co(b, c) {
        var d = [], e;
        for (e in b.d)
            d.push(Yn(b.d[e], c));
        return cd.apply(null, d)
    }
    function eo(b, c) {
        for (var d in b.d)
            b.d[d].Kb(c)
    }
    bo.prototype.a = function (b, c) {
        var d = this.d[c];
        m(d) || (d = new fo[c](this.e, this.f),
            this.d[c] = d);
        return d
    }
        ;
    bo.prototype.la = function () {
        return rb(this.d)
    }
        ;
    function go(b, c, d, e, f, g, h, k, n, p, q, r, s, u, y) {
        var A = ho, z, D;
        for (z = bm.length - 1; 0 <= z; --z)
            if (D = b.d[bm[z]],
                m(D) && (D = D.$b(c, d, e, f, A, g, h, k, n, p, q, r, s, u, y)))
                return D
    }
    bo.prototype.b = function (b, c, d, e, f, g, h, k, n, p, q, r, s, u) {
        var y = c.a;
        y.bindFramebuffer(y.FRAMEBUFFER, c.pe());
        var A;
        m(this.c) && (A = Vd(ae(b), e * this.c));
        return go(this, c, b, e, f, h, k, n, p, q, r, s, function (b) {
            var c = new Uint8Array(4);
            y.readPixels(0, 0, 1, 1, y.RGBA, y.UNSIGNED_BYTE, c);
            if (0 < c[3] && (b = u(b)))
                return b
        }, !0, A)
    }
        ;
    function io(b, c, d, e, f, g, h, k, n, p, q, r) {
        var s = d.a;
        s.bindFramebuffer(s.FRAMEBUFFER, d.pe());
        b = go(b, d, c, e, f, g, h, k, n, p, q, r, function () {
            var b = new Uint8Array(4);
            s.readPixels(0, 0, 1, 1, s.RGBA, s.UNSIGNED_BYTE, b);
            return 0 < b[3]
        }, !1);
        return m(b)
    }
    var fo = {
        Image: Xn
    }
        , ho = [1, 1];
    function jo(b, c, d, e, f, g, h) {
        this.b = b;
        this.f = c;
        this.a = g;
        this.e = h;
        this.i = f;
        this.j = e;
        this.g = d;
        this.c = null;
        this.d = {}
    }
    l = jo.prototype;
    l.ic = function (b, c) {
        var d = b.toString()
            , e = this.d[d];
        m(e) ? e.push(c) : this.d[d] = [c]
    }
        ;
    l.jc = function () { }
        ;
    l.ke = function (b, c) {
        var d = (0,
            c.c)(b);
        if (null != d && oe(this.a, d.D())) {
            var e = c.a;
            m(e) || (e = 0);
            this.ic(e, function (b) {
                b.za(c.f, c.b);
                b.fb(c.e);
                b.Aa(c.d);
                var e = ko[d.I()];
                e && e.call(b, d, null)
            })
        }
    }
        ;
    l.ad = function (b, c) {
        var d = b.c, e, f;
        e = 0;
        for (f = d.length; e < f; ++e) {
            var g = d[e]
                , h = ko[g.I()];
            h && h.call(this, g, c)
        }
    }
        ;
    l.sb = function (b, c) {
        var d = this.b
            , e = (new bo(1, this.a)).a(0, "Image");
        e.fb(this.c);
        e.sb(b, c);
        e.Kb(d);
        e.$b(this.b, this.f, this.g, this.j, this.i, this.a, this.e, 1, 0, 1, 0, 1, {});
        Yn(e, d)()
    }
        ;
    l.Db = function () { }
        ;
    l.kc = function () { }
        ;
    l.rb = function (b, c) {
        var d = this.b
            , e = (new bo(1, this.a)).a(0, "Image");
        e.fb(this.c);
        e.rb(b, c);
        e.Kb(d);
        e.$b(this.b, this.f, this.g, this.j, this.i, this.a, this.e, 1, 0, 1, 0, 1, {});
        Yn(e, d)()
    }
        ;
    l.lc = function () { }
        ;
    l.Rb = function () { }
        ;
    l.tb = function () { }
        ;
    l.za = function () { }
        ;
    l.fb = function (b) {
        this.c = b
    }
        ;
    l.Aa = function () { }
        ;
    var ko = {
        Point: jo.prototype.sb,
        MultiPoint: jo.prototype.rb,
        GeometryCollection: jo.prototype.ad
    };
    function lo() {
        this.a = "precision mediump float;varying vec2 a;uniform mat4 f;uniform float g;uniform sampler2D h;void main(void){vec4 texColor=texture2D(h,a);gl_FragColor.rgb=(f*vec4(texColor.rgb,1.)).rgb;gl_FragColor.a=texColor.a*g;}"
    }
    v(lo, Gn);
    da(lo);
    function mo() {
        this.a = "varying vec2 a;attribute vec2 b;attribute vec2 c;uniform mat4 d;uniform mat4 e;void main(void){gl_Position=e*vec4(b,0.,1.);a=(d*vec4(c,0.,1.)).st;}"
    }
    v(mo, Hn);
    da(mo);
    function no(b, c) {
        this.g = b.getUniformLocation(c, "f");
        this.b = b.getUniformLocation(c, "g");
        this.c = b.getUniformLocation(c, "e");
        this.e = b.getUniformLocation(c, "d");
        this.f = b.getUniformLocation(c, "h");
        this.a = b.getAttribLocation(c, "b");
        this.d = b.getAttribLocation(c, "c")
    }
    ; function oo() {
        this.a = "precision mediump float;varying vec2 a;uniform float f;uniform sampler2D g;void main(void){vec4 texColor=texture2D(g,a);gl_FragColor.rgb=texColor.rgb;gl_FragColor.a=texColor.a*f;}"
    }
    v(oo, Gn);
    da(oo);
    function po() {
        this.a = "varying vec2 a;attribute vec2 b;attribute vec2 c;uniform mat4 d;uniform mat4 e;void main(void){gl_Position=e*vec4(b,0.,1.);a=(d*vec4(c,0.,1.)).st;}"
    }
    v(po, Hn);
    da(po);
    function qo(b, c) {
        this.b = b.getUniformLocation(c, "f");
        this.c = b.getUniformLocation(c, "e");
        this.e = b.getUniformLocation(c, "d");
        this.f = b.getUniformLocation(c, "g");
        this.a = b.getAttribLocation(c, "b");
        this.d = b.getAttribLocation(c, "c")
    }
    ; function ro(b, c) {
        cj.call(this, b, c);
        this.H = new On([-1, -1, 0, 0, 1, -1, 1, 0, -1, 1, 0, 1, 1, 1, 1, 1]);
        this.c = this.Ua = null;
        this.f = void 0;
        this.j = Gd();
        this.p = Id();
        this.U = new ug;
        this.n = this.i = null
    }
    v(ro, cj);
    function so(b, c, d) {
        var e = b.d.e;
        if (m(b.f) && b.f == d)
            e.bindFramebuffer(36160, b.c);
        else {
            c.postRenderFunctions.push(sa(function (b, c, d) {
                b.isContextLost() || (b.deleteFramebuffer(c),
                    b.deleteTexture(d))
            }, e, b.c, b.Ua));
            c = Sn(e, d, d);
            var f = e.createFramebuffer();
            e.bindFramebuffer(36160, f);
            e.framebufferTexture2D(36160, 36064, 3553, c, 0);
            b.Ua = c;
            b.c = f;
            b.f = d
        }
    }
    ro.prototype.Gf = function (b, c, d) {
        to(this, "precompose", d, b);
        Qn(d, 34962, this.H);
        var e = d.a, f = c.brightness || 1 != c.contrast || c.hue || 1 != c.saturation, g, h;
        f ? (g = lo.Ma(),
            h = mo.Ma()) : (g = oo.Ma(),
                h = po.Ma());
        g = Un(d, g, h);
        f ? null === this.i ? this.i = h = new no(e, g) : h = this.i : null === this.n ? this.n = h = new qo(e, g) : h = this.n;
        d.Ld(g) && (e.enableVertexAttribArray(h.a),
            e.vertexAttribPointer(h.a, 2, 5126, !1, 16, 0),
            e.enableVertexAttribArray(h.d),
            e.vertexAttribPointer(h.d, 2, 5126, !1, 16, 8),
            e.uniform1i(h.f, 0));
        e.uniformMatrix4fv(h.e, !1, this.j);
        e.uniformMatrix4fv(h.c, !1, this.p);
        f && e.uniformMatrix4fv(h.g, !1, vg(this.U, c.brightness, c.contrast, c.hue, c.saturation));
        e.uniform1f(h.b, c.opacity);
        e.bindTexture(3553, this.Ua);
        e.drawArrays(5, 0, 4);
        to(this, "postcompose", d, b)
    }
        ;
    function to(b, c, d, e) {
        b = b.a;
        if (gd(b, c)) {
            var f = e.viewState;
            b.dispatchEvent(new Uk(c, b, new jo(d, f.center, f.resolution, f.rotation, e.size, e.extent, e.pixelRatio), null, e, null, d))
        }
    }
    ro.prototype.l = function () {
        this.c = this.Ua = null;
        this.f = void 0
    }
        ;
    function uo(b, c) {
        ro.call(this, b, c);
        this.g = this.e = this.b = null
    }
    v(uo, ro);
    function vo(b, c) {
        var d = c.a();
        return Wn(b.d.e, d)
    }
    uo.prototype.Sa = function (b, c, d, e) {
        var f = this.a;
        return f.a().Cd(b, c.viewState.resolution, c.viewState.rotation, c.skippedFeatureUids, function (b) {
            return d.call(e, b, f)
        })
    }
        ;
    uo.prototype.Ae = function (b, c) {
        var d = this.d.e
            , e = b.viewState
            , f = e.center
            , g = e.resolution
            , h = e.rotation
            , k = this.b
            , n = this.Ua
            , p = this.a.a()
            , q = b.viewHints
            , r = b.extent;
        m(c.extent) && (r = ne(r, c.extent));
        q[0] || q[1] || qe(r) || (e = e.projection,
            q = p.g,
            null === q || (e = q),
            r = p.rc(r, g, b.pixelRatio, e),
            null !== r && ej(this, r) && (k = r,
                n = vo(this, r),
                null === this.Ua || b.postRenderFunctions.push(sa(function (b, c) {
                    b.isContextLost() || b.deleteTexture(c)
                }, d, this.Ua))));
        null !== k && (d = this.d.f.n,
            wo(this, d.width, d.height, f, g, h, k.D()),
            this.g = null,
            f = this.j,
            Kd(f),
            Od(f, 1, -1),
            Nd(f, 0, -1),
            this.b = k,
            this.Ua = n,
            gj(b.attributions, k.e),
            hj(b, p));
        return !0
    }
        ;
    function wo(b, c, d, e, f, g, h) {
        c *= f;
        d *= f;
        b = b.p;
        Kd(b);
        Od(b, 2 / c, 2 / d);
        Pd(b, -g);
        Nd(b, h[0] - e[0], h[1] - e[1]);
        Od(b, (h[2] - h[0]) / 2, (h[3] - h[1]) / 2);
        Nd(b, 1, 1)
    }
    uo.prototype.Ad = function (b, c) {
        var d = this.Sa(b, c, Zc, this);
        return m(d)
    }
        ;
    uo.prototype.ac = function (b, c, d, e) {
        if (null !== this.b && !fa(this.b.a()))
            if (this.a.a() instanceof mn) {
                if (b = this.d.b.ia(b),
                    this.Sa(b, c, Zc, this))
                    return d.call(e, this.a)
            } else {
                var f = [this.b.a().width, this.b.a().height];
                if (null === this.g) {
                    var g = c.size;
                    c = Gd();
                    Kd(c);
                    Nd(c, -1, -1);
                    Od(c, 2 / g[0], 2 / g[1]);
                    Nd(c, 0, g[1]);
                    Od(c, 1, -1);
                    g = Gd();
                    Md(this.p, g);
                    var h = Gd();
                    Kd(h);
                    Nd(h, 0, f[1]);
                    Od(h, 1, -1);
                    Od(h, f[0] / 2, f[1] / 2);
                    Nd(h, 1, 1);
                    var k = Gd();
                    Ld(h, g, k);
                    Ld(k, c, k);
                    this.g = k
                }
                c = [0, 0];
                tj(this.g, b, c);
                if (!(0 > c[0] || c[0] > f[0] || 0 > c[1] || c[1] > f[1]) && (null === this.e && (this.e = Pf(1, 1)),
                    this.e.clearRect(0, 0, 1, 1),
                    this.e.drawImage(this.b.a(), c[0], c[1], 1, 1, 0, 0, 1, 1),
                    0 < this.e.getImageData(0, 0, 1, 1).data[3]))
                    return d.call(e, this.a)
            }
    }
        ;
    function xo() {
        this.a = "precision mediump float;varying vec2 a;uniform sampler2D e;void main(void){gl_FragColor=texture2D(e,a);}"
    }
    v(xo, Gn);
    da(xo);
    function yo() {
        this.a = "varying vec2 a;attribute vec2 b;attribute vec2 c;uniform vec4 d;void main(void){gl_Position=vec4(b*d.xy+d.zw,0.,1.);a=c;}"
    }
    v(yo, Hn);
    da(yo);
    function zo(b, c) {
        this.b = b.getUniformLocation(c, "e");
        this.c = b.getUniformLocation(c, "d");
        this.a = b.getAttribLocation(c, "b");
        this.d = b.getAttribLocation(c, "c")
    }
    ; function Ao(b, c) {
        ro.call(this, b, c);
        this.s = xo.Ma();
        this.F = yo.Ma();
        this.b = null;
        this.r = new On([0, 0, 0, 1, 1, 0, 1, 1, 0, 1, 0, 0, 1, 1, 1, 0]);
        this.q = this.e = null;
        this.g = -1
    }
    v(Ao, ro);
    Ao.prototype.M = function () {
        Rn(this.d.f, this.r);
        Ao.R.M.call(this)
    }
        ;
    Ao.prototype.l = function () {
        Ao.R.l.call(this);
        this.b = null
    }
        ;
    Ao.prototype.Ae = function (b, c, d) {
        var e = this.d, f = d.a, g = b.viewState, h = g.projection, k = this.a, n = k.a(), p = bj(n, h), q = $b(p.a, g.resolution, 0), r = p.na(q), s = n.Ic(q, b.pixelRatio, h), u = s / p.va(q), y = r / u, A = n.dd(), z = g.center, D;
        r == g.resolution ? (z = kj(z, r, b.size),
            D = le(z, r, g.rotation, b.size)) : D = b.extent;
        r = Vi(p, D, r);
        if (null !== this.e && pf(this.e, r) && this.g == n.d)
            y = this.q;
        else {
            var x = [r.c - r.a + 1, r.d - r.b + 1]
                , x = Math.max(x[0] * s, x[1] * s)
                , T = Math.pow(2, Math.ceil(Math.log(x) / Math.LN2))
                , x = y * T
                , O = p.Lb(q)
                , W = O[0] + r.a * s * y
                , y = O[1] + r.b * s * y
                , y = [W, y, W + x, y + x];
            so(this, b, T);
            f.viewport(0, 0, T, T);
            f.clearColor(0, 0, 0, 0);
            f.clear(16384);
            f.disable(3042);
            T = Un(d, this.s, this.F);
            d.Ld(T);
            null === this.b && (this.b = new zo(f, T));
            Qn(d, 34962, this.r);
            f.enableVertexAttribArray(this.b.a);
            f.vertexAttribPointer(this.b.a, 2, 5126, !1, 16, 0);
            f.enableVertexAttribArray(this.b.d);
            f.vertexAttribPointer(this.b.d, 2, 5126, !1, 16, 8);
            f.uniform1i(this.b.b, 0);
            d = {};
            d[q] = {};
            var V = ra(n.le, n, d, jj(function (b) {
                return null !== b && 2 == b.state && Bo(e.d, b.nb())
            }, n, u, h)), ta = k.da(), T = !0, W = Rd(), Jb = new lf(0, 0, 0, 0), Qa, Sb, Gb;
            for (Sb = r.a; Sb <= r.c; ++Sb)
                for (Gb = r.b; Gb <= r.d; ++Gb) {
                    O = n.Fb(q, Sb, Gb, u, h);
                    if (m(c.extent) && (Qa = Ti(p, O.a, W),
                        !oe(Qa, c.extent)))
                        continue;
                    Qa = O.state;
                    if (2 == Qa) {
                        if (Bo(e.d, O.nb())) {
                            d[q][kf(O.a)] = O;
                            continue
                        }
                    } else if (4 == Qa || 3 == Qa && !ta)
                        continue;
                    T = !1;
                    Qa = p.bd(O.a, V, null, Jb, W);
                    Qa || (O = p.md(O.a, Jb, W),
                        null === O || V(q + 1, O))
                }
            c = Ra(nb(d), Number);
            bb(c);
            for (var V = new Float32Array(4), La, Tb, Ob, ta = 0, Jb = c.length; ta < Jb; ++ta)
                for (La in Tb = d[c[ta]],
                    Tb)
                    O = Tb[La],
                        Qa = Ti(p, O.a, W),
                        Sb = 2 * (Qa[2] - Qa[0]) / x,
                        Gb = 2 * (Qa[3] - Qa[1]) / x,
                        Ob = 2 * (Qa[0] - y[0]) / x - 1,
                        Qa = 2 * (Qa[1] - y[1]) / x - 1,
                        Fd(V, Sb, Gb, Ob, Qa),
                        f.uniform4fv(this.b.c, V),
                        Co(e, O, s, A * u),
                        f.drawArrays(5, 0, 4);
            T ? (this.e = r,
                this.q = y,
                this.g = n.d) : (this.q = this.e = null,
                    this.g = -1,
                    b.animate = !0)
        }
        ij(b.usedTiles, n, q, r);
        var td = e.i;
        lj(b, n, p, u, h, D, q, k.r(), function (b) {
            var c;
            (c = 2 != b.state || Bo(e.d, b.nb())) || (c = b.nb() in td.b);
            c || mj(td, [b, Xi(p, b.a), p.na(b.a[0]), s, A * u])
        }, this);
        fj(b, n);
        hj(b, n);
        f = this.j;
        Kd(f);
        Nd(f, (z[0] - y[0]) / (y[2] - y[0]), (z[1] - y[1]) / (y[3] - y[1]));
        0 !== g.rotation && Pd(f, g.rotation);
        Od(f, b.size[0] * g.resolution / (y[2] - y[0]), b.size[1] * g.resolution / (y[3] - y[1]));
        Nd(f, -.5, -.5);
        return !0
    }
        ;
    Ao.prototype.ac = function (b, c, d, e) {
        if (null !== this.c) {
            c = this.d.b.f();
            var f = [0, 0];
            tj(this.j, [b[0] / c[0], (c[1] - b[1]) / c[1]], f);
            b = [f[0] * this.f, f[1] * this.f];
            c = this.d.f.a;
            c.bindFramebuffer(c.FRAMEBUFFER, this.c);
            f = new Uint8Array(4);
            c.readPixels(b[0], b[1], 1, 1, c.RGBA, c.UNSIGNED_BYTE, f);
            if (0 < f[3])
                return d.call(e, this.a)
        }
    }
        ;
    function Do(b, c) {
        ro.call(this, b, c);
        this.g = !1;
        this.F = -1;
        this.s = NaN;
        this.q = Rd();
        this.e = this.b = this.r = null
    }
    v(Do, ro);
    l = Do.prototype;
    l.Gf = function (b, c, d) {
        this.e = c;
        var e = b.viewState
            , f = this.b;
        if (null !== f && !f.la()) {
            var g = e.center
                , h = e.resolution
                , e = e.rotation
                , k = b.size
                , n = b.pixelRatio
                , p = c.opacity
                , q = c.brightness
                , r = c.contrast
                , s = c.hue;
            c = c.saturation;
            b = b.skippedFeatureUids;
            var u, y, A;
            u = 0;
            for (y = bm.length; u < y; ++u)
                A = f.d[bm[u]],
                    m(A) && A.$b(d, g, h, e, k, n, p, q, r, s, c, b, void 0, !1)
        }
    }
        ;
    l.M = function () {
        var b = this.b;
        null !== b && (co(b, this.d.f)(),
            this.b = null);
        Do.R.M.call(this)
    }
        ;
    l.Sa = function (b, c, d, e) {
        if (null !== this.b && null !== this.e) {
            var f = c.viewState
                , g = this.a
                , h = this.e
                , k = {};
            return this.b.b(b, this.d.f, f.center, f.resolution, f.rotation, c.size, c.pixelRatio, h.opacity, h.brightness, h.contrast, h.hue, h.saturation, c.skippedFeatureUids, function (b) {
                var c = ma(b).toString();
                if (!(c in k))
                    return k[c] = !0,
                        d.call(e, b, g)
            })
        }
    }
        ;
    l.Ad = function (b, c) {
        if (null === this.b || null === this.e)
            return !1;
        var d = c.viewState
            , e = this.e;
        return io(this.b, b, this.d.f, d.resolution, d.rotation, c.pixelRatio, e.opacity, e.brightness, e.contrast, e.hue, e.saturation, c.skippedFeatureUids)
    }
        ;
    l.ac = function (b, c, d, e) {
        b = this.d.b.ia(b);
        if (this.Ad(b, c))
            return d.call(e, this.a)
    }
        ;
    l.Hj = function () {
        dj(this)
    }
        ;
    l.Ae = function (b, c, d) {
        function e(b) {
            var c;
            m(b.a) ? c = b.a.call(b, n) : m(f.r) && (c = (0,
                f.r)(b, n));
            if (null != c) {
                if (null != c) {
                    var d, e, g = !1;
                    d = 0;
                    for (e = c.length; d < e; ++d)
                        g = Tm(s, b, c[d], Sm(n, p), this.Hj, this) || g;
                    b = g
                } else
                    b = !1;
                this.g = this.g || b
            }
        }
        var f = this.a;
        c = f.a();
        gj(b.attributions, c.f);
        hj(b, c);
        if (!this.g && (!f.vc && b.viewHints[0] || b.viewHints[1]))
            return !0;
        var g = b.extent
            , h = b.viewState
            , k = h.projection
            , n = h.resolution
            , p = b.pixelRatio
            , h = f.d
            , q = f.da
            , r = f.get("renderOrder");
        m(r) || (r = Rm);
        g = Vd(g, q * n);
        if (!this.g && this.s == n && this.F == h && this.r == r && Yd(this.q, g))
            return !0;
        null === this.b || b.postRenderFunctions.push(co(this.b, d));
        this.g = !1;
        var s = new bo(.5 * n / p, g, f.da);
        c.Hb(g, n, k);
        if (null === r)
            c.Eb(g, n, e, this);
        else {
            var u = [];
            c.Eb(g, n, function (b) {
                u.push(b)
            }, this);
            bb(u, r);
            Oa(u, e, this)
        }
        eo(s, d);
        this.s = n;
        this.F = h;
        this.r = r;
        this.q = g;
        this.b = s;
        return !0
    }
        ;
    function Eo() {
        this.b = 0;
        this.c = {};
        this.d = this.a = null
    }
    l = Eo.prototype;
    l.clear = function () {
        this.b = 0;
        this.c = {};
        this.d = this.a = null
    }
        ;
    function Bo(b, c) {
        return b.c.hasOwnProperty(c)
    }
    l.forEach = function (b, c) {
        for (var d = this.a; null !== d;)
            b.call(c, d.fc, d.wd, this),
                d = d.ab
    }
        ;
    l.get = function (b) {
        b = this.c[b];
        if (b === this.d)
            return b.fc;
        b === this.a ? (this.a = this.a.ab,
            this.a.Mb = null) : (b.ab.Mb = b.Mb,
                b.Mb.ab = b.ab);
        b.ab = null;
        b.Mb = this.d;
        this.d = this.d.ab = b;
        return b.fc
    }
        ;
    l.Tb = function () {
        return this.b
    }
        ;
    l.J = function () {
        var b = Array(this.b), c = 0, d;
        for (d = this.d; null !== d; d = d.Mb)
            b[c++] = d.wd;
        return b
    }
        ;
    l.lb = function () {
        var b = Array(this.b), c = 0, d;
        for (d = this.d; null !== d; d = d.Mb)
            b[c++] = d.fc;
        return b
    }
        ;
    l.pop = function () {
        var b = this.a;
        delete this.c[b.wd];
        null !== b.ab && (b.ab.Mb = null);
        this.a = b.ab;
        null === this.a && (this.d = null);
        --this.b;
        return b.fc
    }
        ;
    l.set = function (b, c) {
        var d = {
            wd: b,
            ab: null,
            Mb: this.d,
            fc: c
        };
        null === this.d ? this.a = d : this.d.ab = d;
        this.d = d;
        this.c[b] = d;
        ++this.b
    }
        ;
    function Fo(b, c) {
        uj.call(this, 0, c);
        this.a = Gf("CANVAS");
        this.a.style.width = "100%";
        this.a.style.height = "100%";
        this.a.className = "ol-unselectable";
        Kf(b, this.a, 0);
        this.p = 0;
        this.q = Pf();
        this.n = !0;
        this.e = Vf(this.a, {
            antialias: !0,
            depth: !1,
            lh: !0,
            preserveDrawingBuffer: !1,
            stencil: !0
        });
        this.f = new Pn(this.a, this.e);
        w(this.a, "webglcontextlost", this.Fj, !1, this);
        w(this.a, "webglcontextrestored", this.Gj, !1, this);
        this.d = new Eo;
        this.l = null;
        this.i = new zj(ra(function (b) {
            var c = b[1];
            b = b[2];
            var f = c[0] - this.l[0]
                , c = c[1] - this.l[1];
            return 65536 * Math.log(b) + Math.sqrt(f * f + c * c) / b
        }, this), function (b) {
            return b[0].nb()
        }
        );
        this.r = ra(function () {
            if (!this.i.la()) {
                Dj(this.i);
                var b = Aj(this.i);
                Co(this, b[0], b[3], b[4])
            }
        }, this);
        this.j = 0;
        Go(this)
    }
    v(Fo, uj);
    function Co(b, c, d, e) {
        var f = b.e
            , g = c.nb();
        if (Bo(b.d, g))
            b = b.d.get(g),
                f.bindTexture(3553, b.Ua),
                9729 != b.vf && (f.texParameteri(3553, 10240, 9729),
                    b.vf = 9729),
                9729 != b.wf && (f.texParameteri(3553, 10240, 9729),
                    b.wf = 9729);
        else {
            var h = f.createTexture();
            f.bindTexture(3553, h);
            if (0 < e) {
                var k = b.q.canvas
                    , n = b.q;
                b.p != d ? (k.width = d,
                    k.height = d,
                    b.p = d) : n.clearRect(0, 0, d, d);
                n.drawImage(c.Qa(), e, e, d, d, 0, 0, d, d);
                f.texImage2D(3553, 0, 6408, 6408, 5121, k)
            } else
                f.texImage2D(3553, 0, 6408, 6408, 5121, c.Qa());
            f.texParameteri(3553, 10240, 9729);
            f.texParameteri(3553, 10241, 9729);
            f.texParameteri(3553, 10242, 33071);
            f.texParameteri(3553, 10243, 33071);
            b.d.set(g, {
                Ua: h,
                vf: 9729,
                wf: 9729
            })
        }
    }
    l = Fo.prototype;
    l.$c = function (b) {
        return b instanceof I ? new uo(this, b) : b instanceof J ? new Ao(this, b) : b instanceof K ? new Do(this, b) : null
    }
        ;
    function Ho(b, c, d) {
        var e = b.b;
        if (gd(e, c)) {
            var f = b.f
                , g = d.extent
                , h = d.size
                , k = d.viewState
                , n = d.pixelRatio
                , p = k.resolution
                , q = k.center
                , r = k.rotation
                , k = new jo(f, q, p, r, h, g, n)
                , g = new bo(.5 * p / n, g);
            e.dispatchEvent(new Uk(c, e, k, g, d, null, f));
            eo(g, f);
            if (!g.la()) {
                var s = Io;
                c = s.opacity;
                d = s.brightness;
                var e = s.contrast, u = s.hue, s = s.saturation, y = {}, A, z, D;
                A = 0;
                for (z = bm.length; A < z; ++A)
                    D = g.d[bm[A]],
                        m(D) && D.$b(f, q, p, r, h, n, c, d, e, u, s, y, void 0, !1)
            }
            co(g, f)();
            f = Ra(nb(k.d), Number);
            bb(f);
            h = 0;
            for (n = f.length; h < n; ++h)
                for (p = k.d[f[h].toString()],
                    q = 0,
                    r = p.length; q < r; ++q)
                    p[q](k);
            b.c = g
        }
    }
    l.M = function () {
        var b = this.e;
        b.isContextLost() || this.d.forEach(function (c) {
            null === c || b.deleteTexture(c.Ua)
        });
        oc(this.f);
        Fo.R.M.call(this)
    }
        ;
    l.jh = function (b, c) {
        for (var d = this.e, e; 1024 < this.d.Tb() - this.j;) {
            e = this.d.a.fc;
            if (null === e)
                if (+this.d.a.wd == c.index)
                    break;
                else
                    --this.j;
            else
                d.deleteTexture(e.Ua);
            this.d.pop()
        }
    }
        ;
    l.I = function () {
        return "webgl"
    }
        ;
    l.Fj = function (b) {
        b.preventDefault();
        this.d.clear();
        this.j = 0;
        jb(this.g, function (b) {
            b.l()
        })
    }
        ;
    l.Gj = function () {
        Go(this);
        this.b.render()
    }
        ;
    function Go(b) {
        b = b.e;
        b.activeTexture(33984);
        b.blendFuncSeparate(770, 771, 1, 771);
        b.disable(2884);
        b.disable(2929);
        b.disable(3089);
        b.disable(2960)
    }
    l.Sd = function (b) {
        var c = this.f
            , d = this.e;
        if (d.isContextLost())
            return !1;
        if (null === b)
            return this.n && (Mg(this.a, !1),
                this.n = !1),
                !1;
        this.l = b.focus;
        this.d.set((-b.index).toString(), null);
        ++this.j;
        var e = [], f = b.layerStatesArray, g = b.viewState.resolution, h, k, n, p;
        h = 0;
        for (k = f.length; h < k; ++h)
            p = f[h],
                Ni(p, g) && "ready" == p.hc && (n = xj(this, p.layer),
                    n.Ae(b, p, c) && e.push(p));
        f = b.size[0] * b.pixelRatio;
        g = b.size[1] * b.pixelRatio;
        if (this.a.width != f || this.a.height != g)
            this.a.width = f,
                this.a.height = g;
        d.bindFramebuffer(36160, null);
        d.clearColor(0, 0, 0, 0);
        d.clear(16384);
        d.enable(3042);
        d.viewport(0, 0, this.a.width, this.a.height);
        Ho(this, "precompose", b);
        h = 0;
        for (k = e.length; h < k; ++h)
            p = e[h],
                n = xj(this, p.layer),
                n.Gf(b, p, c);
        this.n || (Mg(this.a, !0),
            this.n = !0);
        vj(b);
        1024 < this.d.Tb() - this.j && b.postRenderFunctions.push(ra(this.jh, this));
        this.i.la() || (b.postRenderFunctions.push(this.r),
            b.animate = !0);
        Ho(this, "postcompose", b);
        yj(this, b);
        b.postRenderFunctions.push(wj)
    }
        ;
    l.ye = function (b, c, d, e, f, g) {
        var h;
        if (this.e.isContextLost())
            return !1;
        var k = this.f
            , n = c.viewState;
        if (null !== this.c) {
            var p = {}
                , q = Io;
            if (h = this.c.b(b, k, n.center, n.resolution, n.rotation, c.size, c.pixelRatio, q.opacity, q.brightness, q.contrast, q.hue, q.saturation, {}, function (b) {
                var c = ma(b).toString();
                if (!(c in p))
                    return p[c] = !0,
                        d.call(e, b, null)
            }))
                return h
        }
        k = c.layerStatesArray;
        for (q = k.length - 1; 0 <= q; --q) {
            h = k[q];
            var r = h.layer;
            if (Ni(h, n.resolution) && f.call(g, r) && (h = xj(this, r).Sa(b, c, d, e)))
                return h
        }
    }
        ;
    l.Ff = function (b, c, d, e) {
        var f = !1;
        if (this.e.isContextLost())
            return !1;
        var g = this.f
            , h = c.viewState;
        if (null !== this.c && (f = Io,
            f = io(this.c, b, g, h.resolution, h.rotation, c.pixelRatio, f.opacity, f.brightness, f.contrast, f.hue, f.saturation, {})))
            return !0;
        var g = c.layerStatesArray, k;
        for (k = g.length - 1; 0 <= k; --k) {
            var n = g[k]
                , p = n.layer;
            if (Ni(n, h.resolution) && d.call(e, p) && (f = xj(this, p).Ad(b, c)))
                return !0
        }
        return f
    }
        ;
    l.Ef = function (b, c, d, e, f) {
        if (this.e.isContextLost())
            return !1;
        var g = this.f, h = c.viewState, k;
        if (null !== this.c) {
            var n = Io;
            k = this.b.ia(b);
            if (io(this.c, k, g, h.resolution, h.rotation, c.pixelRatio, n.opacity, n.brightness, n.contrast, n.hue, n.saturation, {}) && (k = d.call(e, null)))
                return k
        }
        g = c.layerStatesArray;
        for (n = g.length - 1; 0 <= n; --n) {
            k = g[n];
            var p = k.layer;
            if (Ni(k, h.resolution) && f.call(e, p) && (k = xj(this, p).ac(b, c, d, e)))
                return k
        }
    }
        ;
    var Io = {
        opacity: 1,
        brightness: 0,
        contrast: 1,
        hue: 0,
        saturation: 1
    };
    var Jo = ["canvas", "webgl", "dom"];
    function M(b) {
        od.call(this);
        var c = Ko(b);
        this.Wc = m(b.loadTilesWhileAnimating) ? b.loadTilesWhileAnimating : !1;
        this.be = m(b.loadTilesWhileInteracting) ? b.loadTilesWhileInteracting : !1;
        this.de = m(b.pixelRatio) ? b.pixelRatio : Xf;
        this.ce = c.logos;
        this.r = new jh(this.sl, void 0, this);
        nc(this, this.r);
        this.vc = Gd();
        this.ee = Gd();
        this.Vc = 0;
        this.c = null;
        this.Ca = Rd();
        this.p = this.U = null;
        this.b = Cf("DIV", "ol-viewport");
        this.b.style.position = "relative";
        this.b.style.overflow = "hidden";
        this.b.style.width = "100%";
        this.b.style.height = "100%";
        this.b.style.msTouchAction = "none";
        cg && (this.b.className = "ol-touch");
        this.ka = Cf("DIV", "ol-overlaycontainer");
        this.b.appendChild(this.ka);
        this.F = Cf("DIV", "ol-overlaycontainer-stopevent");
        w(this.F, ["click", "dblclick", "mousedown", "touchstart", "MSPointerDown", Gi, Cb ? "DOMMouseScroll" : "mousewheel"], qc);
        this.b.appendChild(this.F);
        b = new yi(this);
        w(b, mb(Ji), this.pf, !1, this);
        nc(this, b);
        this.ea = c.keyboardEventTarget;
        this.s = new Dh;
        w(this.s, "key", this.nf, !1, this);
        nc(this, this.s);
        b = new Mh(this.b);
        w(b, "mousewheel", this.nf, !1, this);
        nc(this, b);
        this.i = c.controls;
        this.g = c.interactions;
        this.n = c.overlays;
        this.q = new c.ul(this.b, this);
        nc(this, this.q);
        this.hc = new yh;
        nc(this, this.hc);
        w(this.hc, "resize", this.l, !1, this);
        this.ba = null;
        this.H = [];
        this.ta = [];
        this.Bb = new Ej(ra(this.Sh, this), ra(this.Ai, this));
        this.ca = {};
        w(this, sd("layergroup"), this.ji, !1, this);
        w(this, sd("view"), this.lj, !1, this);
        w(this, sd("size"), this.yi, !1, this);
        w(this, sd("target"), this.zi, !1, this);
        this.G(c.Sl);
        this.i.forEach(function (b) {
            b.setMap(this)
        }, this);
        w(this.i, "add", function (b) {
            b.element.setMap(this)
        }, !1, this);
        w(this.i, "remove", function (b) {
            b.element.setMap(null)
        }, !1, this);
        this.g.forEach(function (b) {
            b.setMap(this)
        }, this);
        w(this.g, "add", function (b) {
            b.element.setMap(this)
        }, !1, this);
        w(this.g, "remove", function (b) {
            b.element.setMap(null)
        }, !1, this);
        this.n.forEach(function (b) {
            b.setMap(this)
        }, this);
        w(this.n, "add", function (b) {
            b.element.setMap(this)
        }, !1, this);
        w(this.n, "remove", function (b) {
            b.element.setMap(null)
        }, !1, this)
    }
    v(M, od);
    l = M.prototype;
    l.Zg = function (b) {
        this.i.push(b)
    }
        ;
    l.$g = function (b) {
        this.g.push(b)
    }
        ;
    l.Ze = function (b) {
        this.Ub().Zb().push(b)
    }
        ;
    l.$e = function (b) {
        this.n.push(b)
    }
        ;
    l.Wa = function (b) {
        this.render();
        Array.prototype.push.apply(this.H, arguments)
    }
        ;
    l.M = function () {
        Lf(this.b);
        M.R.M.call(this)
    }
        ;
    l.ne = function (b, c, d, e, f) {
        if (null !== this.c)
            return b = this.ia(b),
                this.q.ye(b, this.c, c, m(d) ? d : null, m(e) ? e : Zc, m(f) ? f : null)
    }
        ;
    l.kj = function (b, c, d, e, f) {
        if (null !== this.c)
            return this.q.Ef(b, this.c, c, m(d) ? d : null, m(e) ? e : Zc, m(f) ? f : null)
    }
        ;
    l.Ci = function (b, c, d) {
        if (null === this.c)
            return !1;
        b = this.ia(b);
        return this.q.Ff(b, this.c, m(c) ? c : Zc, m(d) ? d : null)
    }
        ;
    l.rh = function (b) {
        return this.ia(this.cd(b))
    }
        ;
    l.cd = function (b) {
        if (m(b.changedTouches)) {
            var c = b.changedTouches[0];
            b = Jg(this.b);
            return [c.clientX - b.x, c.clientY - b.y]
        }
        c = this.b;
        b = Jg(b);
        c = Jg(c);
        c = new sf(b.x - c.x, b.y - c.y);
        return [c.x, c.y]
    }
        ;
    l.qc = function () {
        return this.get("target")
    }
        ;
    M.prototype.getTarget = M.prototype.qc;
    l = M.prototype;
    l.Oh = function () {
        var b = this.qc();
        return m(b) ? xf(b) : null
    }
        ;
    l.ia = function (b) {
        var c = this.c;
        if (null === c)
            return null;
        b = b.slice();
        return tj(c.pixelToCoordinateMatrix, b, b)
    }
        ;
    l.qh = function () {
        return this.i
    }
        ;
    l.Jh = function () {
        return this.n
    }
        ;
    l.xh = function () {
        return this.g
    }
        ;
    l.Ub = function () {
        return this.get("layergroup")
    }
        ;
    M.prototype.getLayerGroup = M.prototype.Ub;
    M.prototype.da = function () {
        return this.Ub().Zb()
    }
        ;
    M.prototype.e = function (b) {
        var c = this.c;
        if (null === c)
            return null;
        b = b.slice(0, 2);
        return tj(c.coordinateToPixelMatrix, b, b)
    }
        ;
    M.prototype.f = function () {
        return this.get("size")
    }
        ;
    M.prototype.getSize = M.prototype.f;
    M.prototype.a = function () {
        return this.get("view")
    }
        ;
    M.prototype.getView = M.prototype.a;
    l = M.prototype;
    l.Uh = function () {
        return this.b
    }
        ;
    l.Sh = function (b, c, d, e) {
        var f = this.c;
        if (!(null !== f && c in f.wantedTiles && f.wantedTiles[c][kf(b.a)]))
            return Infinity;
        b = d[0] - f.focus[0];
        d = d[1] - f.focus[1];
        return 65536 * Math.log(e) + Math.sqrt(b * b + d * d) / e
    }
        ;
    l.nf = function (b, c) {
        var d = new wi(c || b.type, this, b);
        this.pf(d)
    }
        ;
    l.pf = function (b) {
        if (null !== this.c) {
            this.ba = b.coordinate;
            b.frameState = this.c;
            var c = this.g.a, d;
            if (!1 !== this.dispatchEvent(b))
                for (d = c.length - 1; 0 <= d; d--) {
                    var e = c[d];
                    if (e.a() && !e.handleEvent(b))
                        break
                }
        }
    }
        ;
    l.wi = function () {
        var b = this.c
            , c = this.Bb;
        if (!c.la()) {
            var d = 16
                , e = d
                , f = 0;
            null !== b && (f = b.viewHints,
                f[0] && (d = this.Wc ? 8 : 0,
                    e = 2),
                f[1] && (d = this.be ? 8 : 0,
                    e = 2),
                f = lb(b.wantedTiles));
            d *= f;
            e *= f;
            if (c.c < d) {
                Dj(c);
                d = Math.min(d - c.c, e, c.Tb());
                for (e = 0; e < d; ++e)
                    f = Aj(c)[0],
                        Rc(f, "change", c.g, !1, c),
                        f.load();
                c.c += d
            }
        }
        c = this.ta;
        d = 0;
        for (e = c.length; d < e; ++d)
            c[d](this, b);
        c.length = 0
    }
        ;
    l.yi = function () {
        this.render()
    }
        ;
    l.zi = function () {
        var b = this.qc()
            , b = m(b) ? xf(b) : null;
        Lh(this.s);
        null === b ? Lf(this.b) : (b.appendChild(this.b),
            Eh(this.s, null === this.ea ? b : this.ea));
        this.l()
    }
        ;
    l.Ai = function () {
        this.render()
    }
        ;
    l.Bi = function () {
        this.render()
    }
        ;
    l.lj = function () {
        null !== this.U && (Tc(this.U),
            this.U = null);
        var b = this.a();
        null !== b && (this.U = w(b, "propertychange", this.Bi, !1, this));
        this.render()
    }
        ;
    l.ki = function () {
        this.render()
    }
        ;
    l.li = function () {
        this.render()
    }
        ;
    l.ji = function () {
        if (null !== this.p) {
            for (var b = this.p.length, c = 0; c < b; ++c)
                Tc(this.p[c]);
            this.p = null
        }
        b = this.Ub();
        null != b && (this.p = [w(b, "propertychange", this.li, !1, this), w(b, "change", this.ki, !1, this)]);
        this.render()
    }
        ;
    l.tl = function () {
        var b = this.r;
        kh(b);
        b.ef()
    }
        ;
    l.render = function () {
        null != this.r.X || this.r.start()
    }
        ;
    l.nl = function (b) {
        if (m(this.i.remove(b)))
            return b
    }
        ;
    l.ol = function (b) {
        var c;
        m(this.g.remove(b)) && (c = b);
        return c
    }
        ;
    l.pl = function (b) {
        return this.Ub().Zb().remove(b)
    }
        ;
    l.ql = function (b) {
        if (m(this.n.remove(b)))
            return b
    }
        ;
    l.sl = function (b) {
        var c, d, e, f = this.f(), g = this.a(), h = null;
        if (m(f) && 0 < f[0] && 0 < f[1] && null !== g && Ye(g)) {
            var h = g.l.slice()
                , k = this.Ub().Da()
                , n = {};
            c = 0;
            for (d = k.length; c < d; ++c)
                n[ma(k[c].layer)] = k[c];
            e = Xe(g);
            h = {
                animate: !1,
                attributions: {},
                coordinateToPixelMatrix: this.vc,
                extent: null,
                focus: null === this.ba ? e.center : this.ba,
                index: this.Vc++,
                layerStates: n,
                layerStatesArray: k,
                logos: wb(this.ce),
                pixelRatio: this.de,
                pixelToCoordinateMatrix: this.ee,
                postRenderFunctions: [],
                size: f,
                skippedFeatureUids: this.ca,
                tileQueue: this.Bb,
                time: b,
                usedTiles: {},
                viewState: e,
                viewHints: h,
                wantedTiles: {}
            }
        }
        if (null !== h) {
            b = this.H;
            c = f = 0;
            for (d = b.length; c < d; ++c)
                g = b[c],
                    g(this, h) && (b[f++] = g);
            b.length = f;
            h.extent = le(e.center, e.resolution, e.rotation, h.size)
        }
        this.c = h;
        this.q.Sd(h);
        null !== h && (h.animate && this.render(),
            Array.prototype.push.apply(this.ta, h.postRenderFunctions),
            0 !== this.H.length || h.viewHints[0] || h.viewHints[1] || be(h.extent, this.Ca) || (this.dispatchEvent(new Tg("moveend", this, h)),
                Wd(h.extent, this.Ca)));
        this.dispatchEvent(new Tg("postrender", this, h));
        oh(this.wi, this)
    }
        ;
    l.lg = function (b) {
        this.set("layergroup", b)
    }
        ;
    M.prototype.setLayerGroup = M.prototype.lg;
    M.prototype.S = function (b) {
        this.set("size", b)
    }
        ;
    M.prototype.setSize = M.prototype.S;
    M.prototype.ha = function (b) {
        this.set("target", b)
    }
        ;
    M.prototype.setTarget = M.prototype.ha;
    M.prototype.Da = function (b) {
        this.set("view", b)
    }
        ;
    M.prototype.setView = M.prototype.Da;
    M.prototype.Va = function (b) {
        b = ma(b).toString();
        this.ca[b] = !0;
        this.render()
    }
        ;
    M.prototype.l = function () {
        var b = this.qc()
            , b = m(b) ? xf(b) : null;
        if (null === b)
            this.S(void 0);
        else {
            var c = wf(b), d = Bb && b.currentStyle, e;
            if (e = d)
                uf(c),
                    e = !0;
            e && "auto" != d.width && "auto" != d.height && !d.boxSizing ? (c = Ng(b, d.width, "width", "pixelWidth"),
                b = Ng(b, d.height, "height", "pixelHeight"),
                b = new tf(c, b)) : (d = new tf(b.offsetWidth, b.offsetHeight),
                    c = Pg(b, "padding"),
                    b = Sg(b),
                    b = new tf(d.width - b.left - c.left - c.right - b.right, d.height - b.top - c.top - c.bottom - b.bottom));
            this.S([b.width, b.height])
        }
    }
        ;
    M.prototype.gc = function (b) {
        b = ma(b).toString();
        delete this.ca[b];
        this.render()
    }
        ;
    function Ko(b) {
        var c = null;
        m(b.keyboardEventTarget) && (c = ia(b.keyboardEventTarget) ? document.getElementById(b.keyboardEventTarget) : b.keyboardEventTarget);
        var d = {}
            , e = {};
        if (!m(b.logo) || "boolean" == typeof b.logo && b.logo)
            e["data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAMAAABEpIrGAAAAA3NCSVQICAjb4U/gAAAACXBIWXMAAAHGAAABxgEXwfpGAAAAGXRFWHRTb2Z0d2FyZQB3d3cuaW5rc2NhcGUub3Jnm+48GgAAAhNQTFRF////AP//AICAgP//AFVVQECA////K1VVSbbbYL/fJ05idsTYJFtbbcjbJllmZszWWMTOIFhoHlNiZszTa9DdUcHNHlNlV8XRIVdiasrUHlZjIVZjaMnVH1RlIFRkH1RkH1ZlasvYasvXVsPQH1VkacnVa8vWIVZjIFRjVMPQa8rXIVVkXsXRsNveIFVkIFZlIVVj3eDeh6GmbMvXH1ZkIFRka8rWbMvXIFVkIFVjIFVkbMvWH1VjbMvWIFVlbcvWIFVla8vVIFVkbMvWbMvVH1VkbMvWIFVlbcvWIFVkbcvVbMvWjNPbIFVkU8LPwMzNIFVkbczWIFVkbsvWbMvXIFVkRnB8bcvW2+TkW8XRIFVkIlZlJVloJlpoKlxrLl9tMmJwOWd0Omh1RXF8TneCT3iDUHiDU8LPVMLPVcLPVcPQVsPPVsPQV8PQWMTQWsTQW8TQXMXSXsXRX4SNX8bSYMfTYcfTYsfTY8jUZcfSZsnUaIqTacrVasrVa8jTa8rWbI2VbMvWbcvWdJObdcvUdszUd8vVeJaee87Yfc3WgJyjhqGnitDYjaarldPZnrK2oNbborW5o9bbo9fbpLa6q9ndrL3ArtndscDDutzfu8fJwN7gwt7gxc/QyuHhy+HizeHi0NfX0+Pj19zb1+Tj2uXk29/e3uLg3+Lh3+bl4uXj4ufl4+fl5Ofl5ufl5ujm5+jmySDnBAAAAFp0Uk5TAAECAgMEBAYHCA0NDg4UGRogIiMmKSssLzU7PkJJT1JTVFliY2hrdHZ3foSFhYeJjY2QkpugqbG1tre5w8zQ09XY3uXn6+zx8vT09vf4+Pj5+fr6/P39/f3+gz7SsAAAAVVJREFUOMtjYKA7EBDnwCPLrObS1BRiLoJLnte6CQy8FLHLCzs2QUG4FjZ5GbcmBDDjxJBXDWxCBrb8aM4zbkIDzpLYnAcE9VXlJSWlZRU13koIeW57mGx5XjoMZEUqwxWYQaQbSzLSkYGfKFSe0QMsX5WbjgY0YS4MBplemI4BdGBW+DQ11eZiymfqQuXZIjqwyadPNoSZ4L+0FVM6e+oGI6g8a9iKNT3o8kVzNkzRg5lgl7p4wyRUL9Yt2jAxVh6mQCogae6GmflI8p0r13VFWTHBQ0rWPW7ahgWVcPm+9cuLoyy4kCJDzCm6d8PSFoh0zvQNC5OjDJhQopPPJqph1doJBUD5tnkbZiUEqaCnB3bTqLTFG1bPn71kw4b+GFdpLElKIzRxxgYgWNYc5SCENVHKeUaltHdXx0dZ8uBI1hJ2UUDgq82CM2MwKeibqAvSO7MCABq0wXEPiqWEAAAAAElFTkSuQmCC"] = "";
        else {
            var f = b.logo;
            ia(f) ? e[f] = "" : la(f) && (e[f.src] = f.href)
        }
        f = b.layers instanceof H ? b.layers : new H({
            layers: b.layers
        });
        d.layergroup = f;
        d.target = b.target;
        d.view = m(b.view) ? b.view : new B;
        var f = uj, g;
        m(b.renderer) ? ga(b.renderer) ? g = b.renderer : ia(b.renderer) && (g = [b.renderer]) : g = Jo;
        var h, k;
        h = 0;
        for (k = g.length; h < k; ++h) {
            var n = g[h];
            if ("canvas" == n) {
                if ($f) {
                    f = rn;
                    break
                }
            } else if ("dom" == n) {
                f = Dn;
                break
            } else if ("webgl" == n && Wf) {
                f = Fo;
                break
            }
        }
        var p;
        m(b.controls) ? p = ga(b.controls) ? new C(b.controls.slice()) : b.controls : p = ah();
        var q;
        m(b.interactions) ? q = ga(b.interactions) ? new C(b.interactions.slice()) : b.interactions : q = Gl();
        b = m(b.overlays) ? ga(b.overlays) ? new C(b.overlays.slice()) : b.overlays : new C;
        return {
            controls: p,
            interactions: q,
            keyboardEventTarget: c,
            logos: e,
            overlays: b,
            ul: f,
            Sl: d
        }
    }
    Nl();
    function N(b) {
        od.call(this);
        this.q = m(b.insertFirst) ? b.insertFirst : !0;
        this.r = m(b.stopEvent) ? b.stopEvent : !0;
        this.aa = Gf("DIV");
        this.aa.style.position = "absolute";
        this.a = {
            Xc: "",
            xd: "",
            Td: "",
            Ud: "",
            visible: !0
        };
        this.b = null;
        w(this, sd("element"), this.ci, !1, this);
        w(this, sd("map"), this.qi, !1, this);
        w(this, sd("offset"), this.si, !1, this);
        w(this, sd("position"), this.ui, !1, this);
        w(this, sd("positioning"), this.vi, !1, this);
        m(b.element) && this.Le(b.element);
        this.l(m(b.offset) ? b.offset : [0, 0]);
        this.p(m(b.positioning) ? b.positioning : "top-left");
        m(b.position) && this.e(b.position)
    }
    v(N, od);
    N.prototype.c = function () {
        return this.get("element")
    }
        ;
    N.prototype.getElement = N.prototype.c;
    N.prototype.f = function () {
        return this.get("map")
    }
        ;
    N.prototype.getMap = N.prototype.f;
    N.prototype.g = function () {
        return this.get("offset")
    }
        ;
    N.prototype.getOffset = N.prototype.g;
    N.prototype.n = function () {
        return this.get("position")
    }
        ;
    N.prototype.getPosition = N.prototype.n;
    N.prototype.i = function () {
        return this.get("positioning")
    }
        ;
    N.prototype.getPositioning = N.prototype.i;
    l = N.prototype;
    l.ci = function () {
        If(this.aa);
        var b = this.c();
        null != b && Hf(this.aa, b)
    }
        ;
    l.qi = function () {
        null !== this.b && (Lf(this.aa),
            Tc(this.b),
            this.b = null);
        var b = this.f();
        null != b && (this.b = w(b, "postrender", this.render, !1, this),
            Lo(this),
            b = this.r ? b.F : b.ka,
            this.q ? Kf(b, this.aa, 0) : Hf(b, this.aa))
    }
        ;
    l.render = function () {
        Lo(this)
    }
        ;
    l.si = function () {
        Lo(this)
    }
        ;
    l.ui = function () {
        Lo(this)
    }
        ;
    l.vi = function () {
        Lo(this)
    }
        ;
    l.Le = function (b) {
        this.set("element", b)
    }
        ;
    N.prototype.setElement = N.prototype.Le;
    N.prototype.setMap = function (b) {
        this.set("map", b)
    }
        ;
    N.prototype.setMap = N.prototype.setMap;
    N.prototype.l = function (b) {
        this.set("offset", b)
    }
        ;
    N.prototype.setOffset = N.prototype.l;
    N.prototype.e = function (b) {
        this.set("position", b)
    }
        ;
    N.prototype.setPosition = N.prototype.e;
    N.prototype.p = function (b) {
        this.set("positioning", b)
    }
        ;
    N.prototype.setPositioning = N.prototype.p;
    function Lo(b) {
        var c = b.f()
            , d = b.n();
        if (m(c) && null !== c.c && m(d)) {
            var d = c.e(d)
                , e = c.f()
                , c = b.aa.style
                , f = b.g()
                , g = b.i()
                , h = f[0]
                , f = f[1];
            if ("bottom-right" == g || "center-right" == g || "top-right" == g)
                "" !== b.a.xd && (b.a.xd = c.left = ""),
                    h = Math.round(e[0] - d[0] - h) + "px",
                    b.a.Td != h && (b.a.Td = c.right = h);
            else {
                "" !== b.a.Td && (b.a.Td = c.right = "");
                if ("bottom-center" == g || "center-center" == g || "top-center" == g)
                    h -= Kg(b.aa).width / 2;
                h = Math.round(d[0] + h) + "px";
                b.a.xd != h && (b.a.xd = c.left = h)
            }
            if ("bottom-left" == g || "bottom-center" == g || "bottom-right" == g)
                "" !== b.a.Ud && (b.a.Ud = c.top = ""),
                    d = Math.round(e[1] - d[1] - f) + "px",
                    b.a.Xc != d && (b.a.Xc = c.bottom = d);
            else {
                "" !== b.a.Xc && (b.a.Xc = c.bottom = "");
                if ("center-left" == g || "center-center" == g || "center-right" == g)
                    f -= Kg(b.aa).height / 2;
                d = Math.round(d[1] + f) + "px";
                b.a.Ud != d && (b.a.Ud = c.top = d)
            }
            b.a.visible || (Mg(b.aa, !0),
                b.a.visible = !0)
        } else
            b.a.visible && (Mg(b.aa, !1),
                b.a.visible = !1)
    }
    ; function Mo(b) {
        b = m(b) ? b : {};
        this.e = m(b.collapsed) ? b.collapsed : !0;
        this.g = m(b.collapsible) ? b.collapsible : !0;
        this.g || (this.e = !1);
        var c = m(b.className) ? b.className : "ol-overviewmap"
            , d = m(b.tipLabel) ? b.tipLabel : "Overview map"
            , e = m(b.collapseLabel) ? b.collapseLabel : "\u00ab";
        this.p = ia(e) ? Cf("SPAN", {}, e) : e;
        e = m(b.label) ? b.label : "\u00bb";
        this.q = ia(e) ? Cf("SPAN", {}, e) : e;
        d = Cf("BUTTON", {
            type: "button",
            title: d
        }, this.g && !this.e ? this.p : this.q);
        w(d, "click", this.tj, !1, this);
        w(d, ["mouseout", sc], function () {
            this.blur()
        }, !1);
        var e = Cf("DIV", "ol-overviewmap-map")
            , f = this.c = new M({
                controls: new C,
                interactions: new C,
                target: e
            });
        m(b.layers) && b.layers.forEach(function (b) {
            f.Ze(b)
        }, this);
        var g = Cf("DIV", "ol-overviewmap-box");
        this.n = new N({
            position: [0, 0],
            positioning: "bottom-left",
            element: g
        });
        this.c.$e(this.n);
        c = Cf("DIV", c + " ol-unselectable ol-control" + (this.e && this.g ? " ol-collapsed" : "") + (this.g ? "" : " ol-uncollapsible"), e, d);
        Ug.call(this, {
            element: c,
            render: m(b.render) ? b.render : No,
            target: b.target
        })
    }
    v(Mo, Ug);
    l = Mo.prototype;
    l.setMap = function (b) {
        var c = this.a;
        null === b && null !== c && Sc(c, sd("view"), this.Bf, !1, this);
        Mo.R.setMap.call(this, b);
        null !== b && (0 === this.c.da().Ib() && this.c.O("layergroup", b),
            Oo(this),
            w(b, sd("view"), this.Bf, !1, this),
            this.c.l(),
            Po(this))
    }
        ;
    function Oo(b) {
        var c = b.a.a();
        null === c || b.c.a().O("rotation", c)
    }
    function No() {
        var b = this.a
            , c = this.c;
        if (null !== b.c && null !== c.c) {
            var d = b.f()
                , b = b.a().g(d)
                , e = c.f()
                , d = c.a().g(e)
                , f = c.e(ke(b))
                , c = c.e(ge(b))
                , c = new tf(Math.abs(f[0] - c[0]), Math.abs(f[1] - c[1]))
                , f = e[0]
                , e = e[1];
            c.width < .1 * f || c.height < .1 * e || c.width > .75 * f || c.height > .75 * e ? Po(this) : Yd(d, b) || (b = this.c,
                d = this.a.a(),
                b.a().Ra(d.b()))
        }
        Qo(this)
    }
    l.Bf = function () {
        Oo(this)
    }
        ;
    function Po(b) {
        var c = b.a;
        b = b.c;
        var d = c.f()
            , c = c.a().g(d)
            , d = b.f();
        b = b.a();
        var e = Math.log(7.5) / Math.LN2;
        re(c, 1 / (.1 * Math.pow(2, e / 2)));
        b.me(c, d)
    }
    function Qo(b) {
        var c = b.a
            , d = b.c;
        if (null !== c.c && null !== d.c) {
            var e = c.f()
                , f = c.a()
                , g = d.a();
            d.f();
            var c = f.c(), h = b.n, d = b.n.c(), f = f.g(e), e = g.a(), g = fe(f), f = he(f), k;
            b = b.a.a().b();
            m(b) && (k = [g[0] - b[0], g[1] - b[1]],
                zd(k, c),
                ud(k, b));
            h.e(k);
            null != d && (k = new tf(Math.abs((g[0] - f[0]) / e), Math.abs((f[1] - g[1]) / e)),
                uf(wf(d)),
                !Bb || Mb("10") || Mb("8") ? (d = d.style,
                    Cb ? d.MozBoxSizing = "border-box" : Db ? d.WebkitBoxSizing = "border-box" : d.boxSizing = "border-box",
                    d.width = Math.max(k.width, 0) + "px",
                    d.height = Math.max(k.height, 0) + "px") : (b = d.style,
                        c = Pg(d, "padding"),
                        d = Sg(d),
                        b.pixelWidth = k.width - d.left - c.left - c.right - d.right,
                        b.pixelHeight = k.height - d.top - c.top - c.bottom - d.bottom))
        }
    }
    l.tj = function (b) {
        b.preventDefault();
        Ro(this)
    }
        ;
    function Ro(b) {
        Ag(b.element, "ol-collapsed");
        b.e ? Mf(b.p, b.q) : Mf(b.q, b.p);
        b.e = !b.e;
        var c = b.c;
        b.e || null !== c.c || (c.l(),
            Po(b),
            Rc(c, "postrender", function () {
                Qo(this)
            }, !1, b))
    }
    l.sj = function () {
        return this.g
    }
        ;
    l.vj = function (b) {
        this.g !== b && (this.g = b,
            Ag(this.element, "ol-uncollapsible"),
            !b && this.e && Ro(this))
    }
        ;
    l.uj = function (b) {
        this.g && this.e !== b && Ro(this)
    }
        ;
    l.rj = function () {
        return this.e
    }
        ;
    function So(b) {
        b = m(b) ? b : {};
        var c = m(b.className) ? b.className : "ol-scale-line";
        this.g = Cf("DIV", c + "-inner");
        this.aa = Cf("DIV", c + " ol-unselectable", this.g);
        this.r = null;
        this.n = m(b.minWidth) ? b.minWidth : 64;
        this.c = !1;
        this.F = void 0;
        this.s = "";
        this.e = null;
        Ug.call(this, {
            element: this.aa,
            render: m(b.render) ? b.render : To,
            target: b.target
        });
        w(this, sd("units"), this.H, !1, this);
        this.q(b.units || "metric")
    }
    v(So, Ug);
    var Uo = [1, 2, 5];
    So.prototype.p = function () {
        return this.get("units")
    }
        ;
    So.prototype.getUnits = So.prototype.p;
    function To(b) {
        b = b.frameState;
        null === b ? this.r = null : this.r = b.viewState;
        Vo(this)
    }
    So.prototype.H = function () {
        Vo(this)
    }
        ;
    So.prototype.q = function (b) {
        this.set("units", b)
    }
        ;
    So.prototype.setUnits = So.prototype.q;
    function Vo(b) {
        var c = b.r;
        if (null === c)
            b.c && (Mg(b.aa, !1),
                b.c = !1);
        else {
            var d = c.center
                , e = c.projection
                , c = e.re(c.resolution, d)
                , f = e.d
                , g = b.p();
            "degrees" != f || "metric" != g && "imperial" != g && "us" != g && "nautical" != g ? "ft" != f && "m" != f || "degrees" != g ? b.e = null : (null === b.e && (b.e = Ae(e, Be("EPSG:4326"))),
                d = Math.cos(Xb(b.e(d)[1])),
                e = ve.radius,
                "ft" == f && (e /= .3048),
                c *= 180 / (Math.PI * d * e)) : (b.e = null,
                    d = Math.cos(Xb(d[1])),
                    c *= Math.PI * d * ve.radius / 180);
            d = b.n * c;
            f = "";
            "degrees" == g ? d < 1 / 60 ? (f = "\u2033",
                c *= 3600) : 1 > d ? (f = "\u2032",
                    c *= 60) : f = "\u00b0" : "imperial" == g ? .9144 > d ? (f = "in",
                        c /= .0254) : 1609.344 > d ? (f = "ft",
                            c /= .3048) : (f = "mi",
                                c /= 1609.344) : "nautical" == g ? (c /= 1852,
                                    f = "nm") : "metric" == g ? 1 > d ? (f = "mm",
                                        c *= 1E3) : 1E3 > d ? f = "m" : (f = "km",
                                            c /= 1E3) : "us" == g && (.9144 > d ? (f = "in",
                                                c *= 39.37) : 1609.344 > d ? (f = "ft",
                                                    c /= .30480061) : (f = "mi",
                                                        c /= 1609.3472));
            for (d = 3 * Math.floor(Math.log(b.n * c) / Math.log(10)); ;) {
                e = Uo[d % 3] * Math.pow(10, Math.floor(d / 3));
                g = Math.round(e / c);
                if (isNaN(g)) {
                    Mg(b.aa, !1);
                    b.c = !1;
                    return
                }
                if (g >= b.n)
                    break;
                ++d
            }
            c = e + " " + f;
            b.s != c && (b.g.innerHTML = c,
                b.s = c);
            b.F != g && (b.g.style.width = g + "px",
                b.F = g);
            b.c || (Mg(b.aa, !0),
                b.c = !0)
        }
    }
    ; function Wo(b) {
        kc.call(this);
        this.d = b;
        this.a = {}
    }
    v(Wo, kc);
    var Xo = [];
    Wo.prototype.Oa = function (b, c, d, e) {
        ga(c) || (c && (Xo[0] = c.toString()),
            c = Xo);
        for (var f = 0; f < c.length; f++) {
            var g = w(b, c[f], d || this.handleEvent, e || !1, this.d || this);
            if (!g)
                break;
            this.a[g.key] = g
        }
        return this
    }
        ;
    Wo.prototype.Me = function (b, c, d, e, f) {
        if (ga(c))
            for (var g = 0; g < c.length; g++)
                this.Me(b, c[g], d, e, f);
        else
            d = d || this.handleEvent,
                f = f || this.d || this,
                d = Lc(d),
                e = !!e,
                c = zc(b) ? Gc(b.hb, String(c), d, e, f) : b ? (b = Nc(b)) ? Gc(b, c, d, e, f) : null : null,
                c && (Tc(c),
                    delete this.a[c.key]);
        return this
    }
        ;
    function Yo(b) {
        jb(b.a, Tc);
        b.a = {}
    }
    Wo.prototype.M = function () {
        Wo.R.M.call(this);
        Yo(this)
    }
        ;
    Wo.prototype.handleEvent = function () {
        throw Error("EventHandler.handleEvent not implemented");
    }
        ;
    function Zo(b, c, d) {
        ed.call(this);
        this.target = b;
        this.handle = c || b;
        this.a = d || new Cg(NaN, NaN, NaN, NaN);
        this.b = wf(b);
        this.d = new Wo(this);
        nc(this, this.d);
        w(this.handle, ["touchstart", "mousedown"], this.mf, !1, this)
    }
    v(Zo, ed);
    var $o = Bb || Cb && Mb("1.9.3");
    l = Zo.prototype;
    l.clientX = 0;
    l.clientY = 0;
    l.screenX = 0;
    l.screenY = 0;
    l.mg = 0;
    l.ng = 0;
    l.nc = 0;
    l.oc = 0;
    l.Xb = !1;
    l.M = function () {
        Zo.R.M.call(this);
        Sc(this.handle, ["touchstart", "mousedown"], this.mf, !1, this);
        Yo(this.d);
        $o && this.b.releaseCapture();
        this.handle = this.target = null
    }
        ;
    l.mf = function (b) {
        var c = "mousedown" == b.type;
        if (this.Xb || c && !xc(b))
            this.dispatchEvent("earlycancel");
        else if (ap(b),
            this.dispatchEvent(new bp("start", this, b.clientX, b.clientY))) {
            this.Xb = !0;
            b.preventDefault();
            var c = this.b
                , d = c.documentElement
                , e = !$o;
            this.d.Oa(c, ["touchmove", "mousemove"], this.ri, e);
            this.d.Oa(c, ["touchend", "mouseup"], this.qd, e);
            $o ? (d.setCapture(!1),
                this.d.Oa(d, "losecapture", this.qd)) : this.d.Oa(c ? c.parentWindow || c.defaultView : window, "blur", this.qd);
            this.f && this.d.Oa(this.f, "scroll", this.Lk, e);
            this.clientX = this.mg = b.clientX;
            this.clientY = this.ng = b.clientY;
            this.screenX = b.screenX;
            this.screenY = b.screenY;
            this.nc = this.target.offsetLeft;
            this.oc = this.target.offsetTop;
            b = uf(this.b);
            this.c = Bf(b.a);
            ua()
        }
    }
        ;
    l.qd = function (b) {
        Yo(this.d);
        $o && this.b.releaseCapture();
        if (this.Xb) {
            ap(b);
            this.Xb = !1;
            var c = cp(this, this.nc)
                , d = dp(this, this.oc);
            this.dispatchEvent(new bp("end", this, b.clientX, b.clientY, 0, c, d))
        } else
            this.dispatchEvent("earlycancel")
    }
        ;
    function ap(b) {
        var c = b.type;
        "touchstart" == c || "touchmove" == c ? vc(b, b.a.targetTouches[0], b.b) : "touchend" != c && "touchcancel" != c || vc(b, b.a.changedTouches[0], b.b)
    }
    l.ri = function (b) {
        ap(b);
        var c = 1 * (b.clientX - this.clientX)
            , d = b.clientY - this.clientY;
        this.clientX = b.clientX;
        this.clientY = b.clientY;
        this.screenX = b.screenX;
        this.screenY = b.screenY;
        if (!this.Xb) {
            var e = this.mg - this.clientX
                , f = this.ng - this.clientY;
            if (0 < e * e + f * f)
                if (this.dispatchEvent(new bp("start", this, b.clientX, b.clientY)))
                    this.Xb = !0;
                else {
                    this.oa || this.qd(b);
                    return
                }
        }
        d = ep(this, c, d);
        c = d.x;
        d = d.y;
        this.Xb && this.dispatchEvent(new bp("beforedrag", this, b.clientX, b.clientY, 0, c, d)) && (fp(this, b, c, d),
            b.preventDefault())
    }
        ;
    function ep(b, c, d) {
        var e;
        e = uf(b.b);
        e = Bf(e.a);
        c += e.x - b.c.x;
        d += e.y - b.c.y;
        b.c = e;
        b.nc += c;
        b.oc += d;
        c = cp(b, b.nc);
        b = dp(b, b.oc);
        return new sf(c, b)
    }
    l.Lk = function (b) {
        var c = ep(this, 0, 0);
        b.clientX = this.clientX;
        b.clientY = this.clientY;
        fp(this, b, c.x, c.y)
    }
        ;
    function fp(b, c, d, e) {
        b.target.style.left = d + "px";
        b.target.style.top = e + "px";
        b.dispatchEvent(new bp("drag", b, c.clientX, c.clientY, 0, d, e))
    }
    function cp(b, c) {
        var d = b.a
            , e = isNaN(d.left) ? null : d.left
            , d = isNaN(d.width) ? 0 : d.width;
        return Math.min(null != e ? e + d : Infinity, Math.max(null != e ? e : -Infinity, c))
    }
    function dp(b, c) {
        var d = b.a
            , e = isNaN(d.top) ? null : d.top
            , d = isNaN(d.height) ? 0 : d.height;
        return Math.min(null != e ? e + d : Infinity, Math.max(null != e ? e : -Infinity, c))
    }
    function bp(b, c, d, e, f, g, h) {
        pc.call(this, b);
        this.clientX = d;
        this.clientY = e;
        this.left = m(g) ? g : c.nc;
        this.top = m(h) ? h : c.oc
    }
    v(bp, pc);
    function gp(b) {
        b = m(b) ? b : {};
        this.e = void 0;
        this.g = hp;
        this.n = null;
        this.p = !1;
        var c = m(b.className) ? b.className : "ol-zoomslider"
            , d = Cf("DIV", [c + "-thumb", "ol-unselectable"])
            , c = Cf("DIV", [c, "ol-unselectable", "ol-control"], d);
        this.c = new Zo(d);
        nc(this, this.c);
        w(this.c, "start", this.bi, !1, this);
        w(this.c, "drag", this.$h, !1, this);
        w(this.c, "end", this.ai, !1, this);
        w(c, "click", this.Zh, !1, this);
        w(d, "click", qc);
        Ug.call(this, {
            element: c,
            render: m(b.render) ? b.render : ip
        })
    }
    v(gp, Ug);
    var hp = 0;
    l = gp.prototype;
    l.setMap = function (b) {
        gp.R.setMap.call(this, b);
        null === b || b.render()
    }
        ;
    function ip(b) {
        if (null !== b.frameState) {
            if (!this.p) {
                var c = this.element
                    , d = Kg(c)
                    , e = Nf(c)
                    , c = Pg(e, "margin")
                    , f = new tf(e.offsetWidth, e.offsetHeight)
                    , e = f.width + c.right + c.left
                    , c = f.height + c.top + c.bottom;
                this.n = [e, c];
                e = d.width - e;
                c = d.height - c;
                d.width > d.height ? (this.g = 1,
                    d = new Cg(0, 0, e, 0)) : (this.g = hp,
                        d = new Cg(0, 0, 0, c));
                this.c.a = d || new Cg(NaN, NaN, NaN, NaN);
                this.p = !0
            }
            b = b.frameState.viewState.resolution;
            b !== this.e && (this.e = b,
                b = 1 - We(this.a.a())(b),
                d = this.c,
                c = Nf(this.element),
                1 == this.g ? Gg(c, d.a.left + d.a.width * b) : Gg(c, d.a.left, d.a.top + d.a.height * b))
        }
    }
    l.Zh = function (b) {
        var c = this.a
            , d = c.a()
            , e = d.a();
        c.Wa(ff({
            resolution: e,
            duration: 200,
            easing: $e
        }));
        b = jp(this, b.offsetX - this.n[0] / 2, b.offsetY - this.n[1] / 2);
        b = kp(this, b);
        d.f(d.constrainResolution(b))
    }
        ;
    l.bi = function () {
        Ze(this.a.a(), 1)
    }
        ;
    l.$h = function (b) {
        b = jp(this, b.left, b.top);
        this.e = kp(this, b);
        this.a.a().f(this.e)
    }
        ;
    l.ai = function () {
        var b = this.a
            , c = b.a();
        Ze(c, -1);
        b.Wa(ff({
            resolution: this.e,
            duration: 200,
            easing: $e
        }));
        b = c.constrainResolution(this.e);
        c.f(b)
    }
        ;
    function jp(b, c, d) {
        var e = b.c.a;
        return Ub(1 === b.g ? (c - e.left) / e.width : (d - e.top) / e.height, 0, 1)
    }
    function kp(b, c) {
        return Ve(b.a.a())(1 - c)
    }
    ; function lp(b) {
        b = m(b) ? b : {};
        this.c = m(b.extent) ? b.extent : null;
        var c = m(b.className) ? b.className : "ol-zoom-extent"
            , d = Cf("BUTTON", {
                type: "button",
                title: m(b.tipLabel) ? b.tipLabel : "Fit to extent"
            }, m(b.label) ? b.label : "E");
        w(d, "click", this.e, !1, this);
        w(d, ["mouseout", sc], function () {
            this.blur()
        }, !1);
        c = Cf("DIV", c + " ol-unselectable ol-control", d);
        Ug.call(this, {
            element: c,
            target: b.target
        })
    }
    v(lp, Ug);
    lp.prototype.e = function (b) {
        b.preventDefault();
        var c = this.a;
        b = c.a();
        var d = null === this.c ? b.q.D() : this.c
            , c = c.f();
        b.me(d, c)
    }
        ;
    function mp(b) {
        od.call(this);
        b = m(b) ? b : {};
        this.a = null;
        w(this, sd("tracking"), this.n, !1, this);
        this.b(m(b.tracking) ? b.tracking : !1)
    }
    v(mp, od);
    mp.prototype.M = function () {
        this.b(!1);
        mp.R.M.call(this)
    }
        ;
    mp.prototype.l = function (b) {
        b = b.a;
        if (null != b.alpha) {
            var c = Xb(b.alpha);
            this.set("alpha", c);
            "boolean" == typeof b.absolute && b.absolute ? this.set("heading", c) : null != b.webkitCompassHeading && null != b.webkitCompassAccuracy && -1 != b.webkitCompassAccuracy && this.set("heading", Xb(b.webkitCompassHeading))
        }
        null != b.beta && this.set("beta", Xb(b.beta));
        null != b.gamma && this.set("gamma", Xb(b.gamma));
        this.o()
    }
        ;
    mp.prototype.f = function () {
        return this.get("alpha")
    }
        ;
    mp.prototype.getAlpha = mp.prototype.f;
    mp.prototype.e = function () {
        return this.get("beta")
    }
        ;
    mp.prototype.getBeta = mp.prototype.e;
    mp.prototype.g = function () {
        return this.get("gamma")
    }
        ;
    mp.prototype.getGamma = mp.prototype.g;
    mp.prototype.i = function () {
        return this.get("heading")
    }
        ;
    mp.prototype.getHeading = mp.prototype.i;
    mp.prototype.c = function () {
        return this.get("tracking")
    }
        ;
    mp.prototype.getTracking = mp.prototype.c;
    mp.prototype.n = function () {
        if (ag) {
            var b = this.c();
            b && null === this.a ? this.a = w(ba, "deviceorientation", this.l, !1, this) : b || null === this.a || (Tc(this.a),
                this.a = null)
        }
    }
        ;
    mp.prototype.b = function (b) {
        this.set("tracking", b)
    }
        ;
    mp.prototype.setTracking = mp.prototype.b;
    function np(b) {
        od.call(this);
        this.i = b;
        w(this.i, ["change", "input"], this.g, !1, this);
        w(this, sd("value"), this.n, !1, this);
        w(this, sd("checked"), this.e, !1, this)
    }
    v(np, od);
    np.prototype.a = function () {
        return this.get("checked")
    }
        ;
    np.prototype.getChecked = np.prototype.a;
    np.prototype.b = function () {
        return this.get("value")
    }
        ;
    np.prototype.getValue = np.prototype.b;
    np.prototype.f = function (b) {
        this.set("value", b)
    }
        ;
    np.prototype.setValue = np.prototype.f;
    np.prototype.c = function (b) {
        this.set("checked", b)
    }
        ;
    np.prototype.setChecked = np.prototype.c;
    np.prototype.g = function () {
        var b = this.i;
        "checkbox" === b.type || "radio" === b.type ? this.c(b.checked) : this.f(b.value)
    }
        ;
    np.prototype.e = function () {
        this.i.checked = this.a()
    }
        ;
    np.prototype.n = function () {
        this.i.value = this.b()
    }
        ;
    function P(b) {
        od.call(this);
        this.X = void 0;
        this.b = "geometry";
        this.g = null;
        this.a = void 0;
        this.e = null;
        w(this, sd(this.b), this.rd, !1, this);
        m(b) && (b instanceof gk || null === b ? this.Pa(b) : this.G(b))
    }
    v(P, od);
    P.prototype.clone = function () {
        var b = new P(this.L());
        b.f(this.b);
        var c = this.N();
        null != c && b.Pa(c.clone());
        c = this.g;
        null === c || b.i(c);
        return b
    }
        ;
    P.prototype.N = function () {
        return this.get(this.b)
    }
        ;
    P.prototype.getGeometry = P.prototype.N;
    l = P.prototype;
    l.wh = function () {
        return this.X
    }
        ;
    l.vh = function () {
        return this.b
    }
        ;
    l.cj = function () {
        return this.g
    }
        ;
    l.dj = function () {
        return this.a
    }
        ;
    l.ii = function () {
        this.o()
    }
        ;
    l.rd = function () {
        null !== this.e && (Tc(this.e),
            this.e = null);
        var b = this.N();
        null != b && (this.e = w(b, "change", this.ii, !1, this),
            this.o())
    }
        ;
    l.Pa = function (b) {
        this.set(this.b, b)
    }
        ;
    P.prototype.setGeometry = P.prototype.Pa;
    P.prototype.i = function (b) {
        this.g = b;
        null === b ? b = void 0 : ka(b) || (b = ga(b) ? b : [b],
            b = Xc(b));
        this.a = b;
        this.o()
    }
        ;
    P.prototype.c = function (b) {
        this.X = b;
        this.o()
    }
        ;
    P.prototype.f = function (b) {
        Sc(this, sd(this.b), this.rd, !1, this);
        this.b = b;
        w(this, sd(this.b), this.rd, !1, this);
        this.rd()
    }
        ;
    function op(b) {
        b = m(b) ? b : {};
        this.g = this.f = this.c = this.d = this.b = this.a = null;
        this.e = void 0;
        this.Af(m(b.style) ? b.style : pl);
        m(b.features) ? ga(b.features) ? this.Nc(new C(b.features.slice())) : this.Nc(b.features) : this.Nc(new C);
        m(b.map) && this.setMap(b.map)
    }
    l = op.prototype;
    l.yf = function (b) {
        this.a.push(b)
    }
        ;
    l.Xi = function () {
        return this.a
    }
        ;
    l.Yi = function () {
        return this.c
    }
        ;
    l.zf = function () {
        pp(this)
    }
        ;
    l.gi = function (b) {
        b = b.element;
        this.d[ma(b).toString()] = w(b, "change", this.zf, !1, this);
        pp(this)
    }
        ;
    l.hi = function (b) {
        b = ma(b.element).toString();
        Tc(this.d[b]);
        delete this.d[b];
        pp(this)
    }
        ;
    l.aj = function () {
        pp(this)
    }
        ;
    l.bj = function (b) {
        if (null !== this.a) {
            var c = this.e;
            m(c) || (c = pl);
            var d = b.a;
            b = b.frameState;
            var e = b.viewState.resolution, f = Sm(e, b.pixelRatio), g, h, k, n;
            this.a.forEach(function (b) {
                n = b.a;
                k = m(n) ? n.call(b, e) : c(b, e);
                if (null != k)
                    for (h = k.length,
                        g = 0; g < h; ++g)
                        Tm(d, b, k[g], f, this.aj, this)
            }, this)
        }
    }
        ;
    l.yd = function (b) {
        this.a.remove(b)
    }
        ;
    function pp(b) {
        null === b.c || b.c.render()
    }
    l.Nc = function (b) {
        null !== this.b && (Oa(this.b, Tc),
            this.b = null);
        null !== this.d && (Oa(mb(this.d), Tc),
            this.d = null);
        this.a = b;
        null !== b && (this.b = [w(b, "add", this.gi, !1, this), w(b, "remove", this.hi, !1, this)],
            this.d = {},
            b.forEach(function (b) {
                this.d[ma(b).toString()] = w(b, "change", this.zf, !1, this)
            }, this));
        pp(this)
    }
        ;
    l.setMap = function (b) {
        null !== this.f && (Tc(this.f),
            this.f = null);
        pp(this);
        this.c = b;
        null !== b && (this.f = w(b, "postcompose", this.bj, !1, this),
            b.render())
    }
        ;
    l.Af = function (b) {
        this.g = b;
        this.e = nl(b);
        pp(this)
    }
        ;
    l.Zi = function () {
        return this.g
    }
        ;
    l.$i = function () {
        return this.e
    }
        ;
    function qp() {
        this.defaultDataProjection = null
    }
    function rp(b, c, d) {
        var e;
        m(d) && (e = {
            dataProjection: m(d.dataProjection) ? d.dataProjection : b.Ha(c),
            featureProjection: d.featureProjection
        });
        return sp(b, e)
    }
    function sp(b, c) {
        var d;
        m(c) && (d = {
            featureProjection: c.featureProjection,
            dataProjection: null != c.dataProjection ? c.dataProjection : b.defaultDataProjection
        });
        return d
    }
    function tp(b, c, d) {
        var e = m(d) ? Be(d.featureProjection) : null;
        d = m(d) ? Be(d.dataProjection) : null;
        return null === e || null === d || Re(e, d) ? b : b instanceof gk ? (c ? b.clone() : b).transform(c ? e : d, c ? d : e) : Ue(c ? b.slice() : b, c ? e : d, c ? d : e)
    }
    ; var up = ba.JSON.parse
        , vp = ba.JSON.stringify;
    function wp() {
        this.defaultDataProjection = null
    }
    v(wp, qp);
    function xp(b) {
        return la(b) ? b : ia(b) ? (b = up(b),
            m(b) ? b : null) : null
    }
    l = wp.prototype;
    l.I = function () {
        return "json"
    }
        ;
    l.Nb = function (b, c) {
        return yp(this, xp(b), rp(this, b, c))
    }
        ;
    l.ma = function (b, c) {
        return this.b(xp(b), rp(this, b, c))
    }
        ;
    l.Lc = function (b, c) {
        var d = xp(b)
            , e = rp(this, b, c);
        return zp(d, e)
    }
        ;
    l.Ha = function (b) {
        b = xp(b).crs;
        return null != b ? "name" == b.type ? Be(b.properties.name) : "EPSG" == b.type ? Be("EPSG:" + b.properties.code) : null : this.defaultDataProjection
    }
        ;
    l.Wd = function (b, c) {
        return vp(this.a(b, c))
    }
        ;
    l.Qb = function (b, c) {
        return vp(this.c(b, c))
    }
        ;
    l.Rc = function (b, c) {
        return vp(this.f(b, c))
    }
        ;
    function Ap(b) {
        b = m(b) ? b : {};
        this.defaultDataProjection = null;
        this.defaultDataProjection = Be(null != b.defaultDataProjection ? b.defaultDataProjection : "EPSG:4326");
        this.d = b.geometryName
    }
    v(Ap, wp);
    function zp(b, c) {
        return null === b ? null : tp((0,
            Bp[b.type])(b), !1, c)
    }
    var Bp = {
        Point: function (b) {
            return new Ek(b.coordinates)
        },
        LineString: function (b) {
            return new L(b.coordinates)
        },
        Polygon: function (b) {
            return new G(b.coordinates)
        },
        MultiPoint: function (b) {
            return new Nm(b.coordinates)
        },
        MultiLineString: function (b) {
            return new Km(b.coordinates)
        },
        MultiPolygon: function (b) {
            return new Om(b.coordinates)
        },
        GeometryCollection: function (b, c) {
            var d = Ra(b.geometries, function (b) {
                return zp(b, c)
            });
            return new Cm(d)
        }
    }
        , Cp = {
            Point: function (b) {
                return {
                    type: "Point",
                    coordinates: b.K()
                }
            },
            LineString: function (b) {
                return {
                    type: "LineString",
                    coordinates: b.K()
                }
            },
            Polygon: function (b) {
                return {
                    type: "Polygon",
                    coordinates: b.K()
                }
            },
            MultiPoint: function (b) {
                return {
                    type: "MultiPoint",
                    coordinates: b.K()
                }
            },
            MultiLineString: function (b) {
                return {
                    type: "MultiLineString",
                    coordinates: b.K()
                }
            },
            MultiPolygon: function (b) {
                return {
                    type: "MultiPolygon",
                    coordinates: b.K()
                }
            },
            GeometryCollection: function (b, c) {
                return {
                    type: "GeometryCollection",
                    geometries: Ra(b.c, function (b) {
                        return (0,
                            Cp[b.I()])(tp(b, !0, c))
                    })
                }
            },
            Circle: function () {
                return {
                    type: "GeometryCollection",
                    geometries: []
                }
            }
        };
    function yp(b, c, d) {
        d = zp(c.geometry, d);
        var e = new P;
        m(b.d) && e.f(b.d);
        e.Pa(d);
        m(c.id) && e.c(c.id);
        m(c.properties) && e.G(c.properties);
        return e
    }
    Ap.prototype.b = function (b, c) {
        if ("Feature" == b.type)
            return [yp(this, b, c)];
        if ("FeatureCollection" == b.type) {
            var d = [], e = b.features, f, g;
            f = 0;
            for (g = e.length; f < g; ++f)
                d.push(yp(this, e[f], c));
            return d
        }
        return []
    }
        ;
    Ap.prototype.a = function (b, c) {
        c = sp(this, c);
        var d = {
            type: "Feature"
        }
            , e = b.X;
        null != e && (d.id = e);
        e = b.N();
        null != e && (d.geometry = (0,
            Cp[e.I()])(tp(e, !0, c)));
        e = b.L();
        tb(e, b.b);
        rb(e) || (d.properties = e);
        return d
    }
        ;
    Ap.prototype.c = function (b, c) {
        c = sp(this, c);
        var d = [], e, f;
        e = 0;
        for (f = b.length; e < f; ++e)
            d.push(this.a(b[e], c));
        return {
            type: "FeatureCollection",
            features: d
        }
    }
        ;
    Ap.prototype.f = function (b, c) {
        return (0,
            Cp[b.I()])(tp(b, !0, sp(this, c)))
    }
        ;
    function Dp(b) {
        if ("undefined" != typeof XMLSerializer)
            return (new XMLSerializer).serializeToString(b);
        if (b = b.xml)
            return b;
        throw Error("Your browser does not support serializing XML documents");
    }
    ; var Ep;
    a: if (document.implementation && document.implementation.createDocument)
        Ep = document.implementation.createDocument("", "", null);
    else {
        if ("undefined" != typeof ActiveXObject) {
            var Fp = new ActiveXObject("MSXML2.DOMDocument");
            if (Fp) {
                Fp.resolveExternals = !1;
                Fp.validateOnParse = !1;
                try {
                    Fp.setProperty("ProhibitDTD", !0),
                        Fp.setProperty("MaxXMLSize", 2048),
                        Fp.setProperty("MaxElementDepth", 256)
                } catch (Gp) { }
            }
            if (Fp) {
                Ep = Fp;
                break a
            }
        }
        throw Error("Your browser does not support creating new documents");
    }
    var Hp = Ep;
    function Ip(b, c) {
        return Hp.createElementNS(b, c)
    }
    function Jp(b, c) {
        null === b && (b = "");
        return Hp.createNode(1, c, b)
    }
    var Kp = document.implementation && document.implementation.createDocument ? Ip : Jp;
    function Lp(b, c) {
        return Mp(b, c, []).join("")
    }
    function Mp(b, c, d) {
        if (4 == b.nodeType || 3 == b.nodeType)
            c ? d.push(String(b.nodeValue).replace(/(\r\n|\r|\n)/g, "")) : d.push(b.nodeValue);
        else
            for (b = b.firstChild; null !== b; b = b.nextSibling)
                Mp(b, c, d);
        return d
    }
    function Np(b) {
        return b.localName
    }
    function Op(b) {
        var c = b.localName;
        return m(c) ? c : b.baseName
    }
    var Pp = Bb ? Op : Np;
    function Qp(b) {
        return b instanceof Document
    }
    function Rp(b) {
        return la(b) && 9 == b.nodeType
    }
    var Sp = Bb ? Rp : Qp;
    function Tp(b) {
        return b instanceof Node
    }
    function Up(b) {
        return la(b) && m(b.nodeType)
    }
    var Vp = Bb ? Up : Tp;
    function Wp(b, c, d) {
        return b.getAttributeNS(c, d) || ""
    }
    function Xp(b, c, d) {
        var e = "";
        b = Yp(b, c, d);
        m(b) && (e = b.nodeValue);
        return e
    }
    var Zp = document.implementation && document.implementation.createDocument ? Wp : Xp;
    function $p(b, c, d) {
        return b.getAttributeNodeNS(c, d)
    }
    function aq(b, c, d) {
        var e = null;
        b = b.attributes;
        for (var f, g, h = 0, k = b.length; h < k; ++h)
            if (f = b[h],
                f.namespaceURI == c && (g = f.prefix ? f.prefix + ":" + d : d,
                    g == f.nodeName)) {
                e = f;
                break
            }
        return e
    }
    var Yp = document.implementation && document.implementation.createDocument ? $p : aq;
    function bq(b, c, d, e) {
        b.setAttributeNS(c, d, e)
    }
    function cq(b, c, d, e) {
        null === c ? b.setAttribute(d, e) : (c = b.ownerDocument.createNode(2, d, c),
            c.nodeValue = e,
            b.setAttributeNode(c))
    }
    var dq = document.implementation && document.implementation.createDocument ? bq : cq;
    function eq(b) {
        return (new DOMParser).parseFromString(b, "application/xml")
    }
    function fq(b, c) {
        return function (d, e) {
            var f = b.call(c, d, e);
            m(f) && Za(e[e.length - 1], f)
        }
    }
    function gq(b, c) {
        return function (d, e) {
            var f = b.call(m(c) ? c : this, d, e);
            m(f) && e[e.length - 1].push(f)
        }
    }
    function hq(b, c) {
        return function (d, e) {
            var f = b.call(m(c) ? c : this, d, e);
            m(f) && (e[e.length - 1] = f)
        }
    }
    function iq(b) {
        return function (c, d) {
            var e = b.call(m(void 0) ? void 0 : this, c, d);
            m(e) && vb(d[d.length - 1], m(void 0) ? void 0 : c.localName).push(e)
        }
    }
    function Q(b, c) {
        return function (d, e) {
            var f = b.call(m(void 0) ? void 0 : this, d, e);
            m(f) && (e[e.length - 1][m(c) ? c : d.localName] = f)
        }
    }
    function R(b, c, d) {
        return jq(b, c, d)
    }
    function S(b, c) {
        return function (d, e, f) {
            b.call(m(c) ? c : this, d, e, f);
            f[f.length - 1].node.appendChild(d)
        }
    }
    function kq(b) {
        var c, d;
        return function (e, f, g) {
            if (!m(c)) {
                c = {};
                var h = {};
                h[e.localName] = b;
                c[e.namespaceURI] = h;
                d = lq(e.localName)
            }
            mq(c, d, f, g)
        }
    }
    function lq(b, c) {
        return function (d, e, f) {
            d = e[e.length - 1].node;
            e = b;
            m(e) || (e = f);
            f = c;
            m(c) || (f = d.namespaceURI);
            return Kp(f, e)
        }
    }
    var nq = lq();
    function oq(b, c) {
        for (var d = c.length, e = Array(d), f = 0; f < d; ++f)
            e[f] = b[c[f]];
        return e
    }
    function jq(b, c, d) {
        d = m(d) ? d : {};
        var e, f;
        e = 0;
        for (f = b.length; e < f; ++e)
            d[b[e]] = c;
        return d
    }
    function pq(b, c, d, e) {
        for (c = c.firstElementChild; null !== c; c = c.nextElementSibling) {
            var f = b[c.namespaceURI];
            m(f) && (f = f[c.localName],
                m(f) && f.call(e, c, d))
        }
    }
    function U(b, c, d, e, f) {
        e.push(b);
        pq(c, d, e, f);
        return e.pop()
    }
    function mq(b, c, d, e, f, g) {
        for (var h = (m(f) ? f : d).length, k, n, p = 0; p < h; ++p)
            k = d[p],
                m(k) && (n = c.call(g, k, e, m(f) ? f[p] : void 0),
                    m(n) && b[n.namespaceURI][n.localName].call(g, n, k, e))
    }
    function qq(b, c, d, e, f, g, h) {
        f.push(b);
        mq(c, d, e, f, g, h);
        f.pop()
    }
    ; function rq() {
        this.defaultDataProjection = null
    }
    v(rq, qp);
    l = rq.prototype;
    l.I = function () {
        return "xml"
    }
        ;
    l.Nb = function (b, c) {
        if (Sp(b))
            return sq(this, b, c);
        if (Vp(b))
            return this.Yf(b, c);
        if (ia(b)) {
            var d = eq(b);
            return sq(this, d, c)
        }
        return null
    }
        ;
    function sq(b, c, d) {
        b = tq(b, c, d);
        return 0 < b.length ? b[0] : null
    }
    l.ma = function (b, c) {
        if (Sp(b))
            return tq(this, b, c);
        if (Vp(b))
            return this.Ob(b, c);
        if (ia(b)) {
            var d = eq(b);
            return tq(this, d, c)
        }
        return []
    }
        ;
    function tq(b, c, d) {
        var e = [];
        for (c = c.firstChild; null !== c; c = c.nextSibling)
            1 == c.nodeType && Za(e, b.Ob(c, d));
        return e
    }
    l.Lc = function (b, c) {
        if (Sp(b))
            return this.n(b, c);
        if (Vp(b)) {
            var d = this.Od(b, [rp(this, b, m(c) ? c : {})]);
            return m(d) ? d : null
        }
        return ia(b) ? (d = eq(b),
            this.n(d, c)) : null
    }
        ;
    l.Ha = function (b) {
        return Sp(b) ? this.Je(b) : Vp(b) ? this.Rd(b) : ia(b) ? (b = eq(b),
            this.Je(b)) : null
    }
        ;
    l.Je = function () {
        return this.defaultDataProjection
    }
        ;
    l.Rd = function () {
        return this.defaultDataProjection
    }
        ;
    l.Wd = function (b, c) {
        var d = this.p(b, c);
        return Dp(d)
    }
        ;
    l.Qb = function (b, c) {
        var d = this.a(b, c);
        return Dp(d)
    }
        ;
    l.Rc = function (b, c) {
        var d = this.i(b, c);
        return Dp(d)
    }
        ;
    function uq(b) {
        b = m(b) ? b : {};
        this.featureType = b.featureType;
        this.featureNS = b.featureNS;
        this.srsName = b.srsName;
        this.schemaLocation = "";
        this.d = {};
        this.d["http://www.opengis.net/gml"] = {
            featureMember: hq(uq.prototype.Md),
            featureMembers: hq(uq.prototype.Md)
        };
        this.defaultDataProjection = null
    }
    v(uq, rq);
    l = uq.prototype;
    l.Md = function (b, c) {
        var d = Pp(b), e;
        if ("FeatureCollection" == d)
            e = U(null, this.d, b, c, this);
        else if ("featureMembers" == d || "featureMember" == d) {
            e = c[0];
            var f = e.featureType;
            if (!m(f) && null !== b.firstElementChild) {
                var g = b.firstElementChild
                    , f = g.nodeName.split(":").pop();
                e.featureType = f;
                e.featureNS = g.namespaceURI
            }
            var g = {}
                , h = {};
            g[f] = "featureMembers" == d ? gq(this.Fe, this) : hq(this.Fe, this);
            h[e.featureNS] = g;
            e = U([], h, b, c)
        }
        m(e) || (e = []);
        return e
    }
        ;
    l.Od = function (b, c) {
        var d = c[0];
        d.srsName = b.firstElementChild.getAttribute("srsName");
        var e = U(null, this.Se, b, c, this);
        if (null != e)
            return tp(e, !1, d)
    }
        ;
    l.Fe = function (b, c) {
        var d, e = b.getAttribute("fid") || Zp(b, "http://www.opengis.net/gml", "id"), f = {}, g;
        for (d = b.firstElementChild; null !== d; d = d.nextElementSibling) {
            var h = Pp(d);
            if (0 === d.childNodes.length || 1 === d.childNodes.length && 3 === d.firstChild.nodeType) {
                var k = Lp(d, !1);
                /^[\s\xa0]*$/.test(k) && (k = void 0);
                f[h] = k
            } else
                "boundedBy" !== h && (g = h),
                    f[h] = this.Od(d, c)
        }
        d = new P(f);
        m(g) && d.f(g);
        e && d.c(e);
        return d
    }
        ;
    l.dg = function (b, c) {
        var d = this.Nd(b, c);
        if (null != d) {
            var e = new Ek(null);
            Fk(e, "XYZ", d);
            return e
        }
    }
        ;
    l.bg = function (b, c) {
        var d = U([], this.Hg, b, c, this);
        if (m(d))
            return new Nm(d)
    }
        ;
    l.ag = function (b, c) {
        var d = U([], this.Gg, b, c, this);
        if (m(d)) {
            var e = new Km(null);
            Mm(e, d);
            return e
        }
    }
        ;
    l.cg = function (b, c) {
        var d = U([], this.Ig, b, c, this);
        if (m(d)) {
            var e = new Om(null);
            Qm(e, d);
            return e
        }
    }
        ;
    l.Tf = function (b, c) {
        pq(this.Lg, b, c, this)
    }
        ;
    l.uf = function (b, c) {
        pq(this.Eg, b, c, this)
    }
        ;
    l.Uf = function (b, c) {
        pq(this.Mg, b, c, this)
    }
        ;
    l.Pd = function (b, c) {
        var d = this.Nd(b, c);
        if (null != d) {
            var e = new L(null);
            Jm(e, "XYZ", d);
            return e
        }
    }
        ;
    l.al = function (b, c) {
        var d = U(null, this.Tc, b, c, this);
        if (null != d)
            return d
    }
        ;
    l.$f = function (b, c) {
        var d = this.Nd(b, c);
        if (m(d)) {
            var e = new Ck(null);
            Dk(e, "XYZ", d);
            return e
        }
    }
        ;
    l.Qd = function (b, c) {
        var d = U([null], this.$d, b, c, this);
        if (m(d) && null !== d[0]) {
            var e = new G(null), f = d[0], g = [f.length], h, k;
            h = 1;
            for (k = d.length; h < k; ++h)
                Za(f, d[h]),
                    g.push(f.length);
            Qk(e, "XYZ", f, g);
            return e
        }
    }
        ;
    l.Nd = function (b, c) {
        return U(null, this.Tc, b, c, this)
    }
        ;
    l.Hg = Object({
        "http://www.opengis.net/gml": {
            pointMember: gq(uq.prototype.Tf),
            pointMembers: gq(uq.prototype.Tf)
        }
    });
    l.Gg = Object({
        "http://www.opengis.net/gml": {
            lineStringMember: gq(uq.prototype.uf),
            lineStringMembers: gq(uq.prototype.uf)
        }
    });
    l.Ig = Object({
        "http://www.opengis.net/gml": {
            polygonMember: gq(uq.prototype.Uf),
            polygonMembers: gq(uq.prototype.Uf)
        }
    });
    l.Lg = Object({
        "http://www.opengis.net/gml": {
            Point: gq(uq.prototype.Nd)
        }
    });
    l.Eg = Object({
        "http://www.opengis.net/gml": {
            LineString: gq(uq.prototype.Pd)
        }
    });
    l.Mg = Object({
        "http://www.opengis.net/gml": {
            Polygon: gq(uq.prototype.Qd)
        }
    });
    l.Uc = Object({
        "http://www.opengis.net/gml": {
            LinearRing: hq(uq.prototype.al)
        }
    });
    l.Ob = function (b, c) {
        var d = {
            featureType: this.featureType,
            featureNS: this.featureNS
        };
        m(c) && yb(d, rp(this, b, c));
        return this.Md(b, [d])
    }
        ;
    l.Rd = function (b) {
        return Be(m(this.l) ? this.l : b.firstElementChild.getAttribute("srsName"))
    }
        ;
    function vq(b) {
        b = Lp(b, !1);
        return wq(b)
    }
    function wq(b) {
        if (b = /^\s*(true|1)|(false|0)\s*$/.exec(b))
            return m(b[1]) || !1
    }
    function xq(b) {
        b = Lp(b, !1);
        if (b = /^\s*(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(Z|(?:([+\-])(\d{2})(?::(\d{2}))?))\s*$/.exec(b)) {
            var c = Date.UTC(parseInt(b[1], 10), parseInt(b[2], 10) - 1, parseInt(b[3], 10), parseInt(b[4], 10), parseInt(b[5], 10), parseInt(b[6], 10)) / 1E3;
            if ("Z" != b[7]) {
                var d = "-" == b[8] ? -1 : 1
                    , c = c + 60 * d * parseInt(b[9], 10);
                m(b[10]) && (c += 3600 * d * parseInt(b[10], 10))
            }
            return c
        }
    }
    function yq(b) {
        b = Lp(b, !1);
        return zq(b)
    }
    function zq(b) {
        if (b = /^\s*([+\-]?\d*\.?\d+(?:e[+\-]?\d+)?)\s*$/i.exec(b))
            return parseFloat(b[1])
    }
    function Aq(b) {
        b = Lp(b, !1);
        return Bq(b)
    }
    function Bq(b) {
        if (b = /^\s*(\d+)\s*$/.exec(b))
            return parseInt(b[1], 10)
    }
    function X(b) {
        b = Lp(b, !1);
        return Aa(b)
    }
    function Cq(b, c) {
        Dq(b, c ? "1" : "0")
    }
    function Eq(b, c) {
        b.appendChild(Hp.createTextNode(c.toPrecision()))
    }
    function Fq(b, c) {
        b.appendChild(Hp.createTextNode(c.toString()))
    }
    function Dq(b, c) {
        b.appendChild(Hp.createTextNode(c))
    }
    ; function Y(b) {
        b = m(b) ? b : {};
        uq.call(this, b);
        this.j = m(b.surface) ? b.surface : !1;
        this.f = m(b.curve) ? b.curve : !1;
        this.e = m(b.multiCurve) ? b.multiCurve : !0;
        this.g = m(b.multiSurface) ? b.multiSurface : !0;
        this.schemaLocation = m(b.schemaLocation) ? b.schemaLocation : "http://www.opengis.net/gml http://schemas.opengis.net/gml/3.1.1/profiles/gmlsfProfile/1.0.0/gmlsf.xsd"
    }
    v(Y, uq);
    l = Y.prototype;
    l.dl = function (b, c) {
        var d = U([], this.Fg, b, c, this);
        if (m(d)) {
            var e = new Km(null);
            Mm(e, d);
            return e
        }
    }
        ;
    l.el = function (b, c) {
        var d = U([], this.Jg, b, c, this);
        if (m(d)) {
            var e = new Om(null);
            Qm(e, d);
            return e
        }
    }
        ;
    l.cf = function (b, c) {
        pq(this.Bg, b, c, this)
    }
        ;
    l.og = function (b, c) {
        pq(this.Pg, b, c, this)
    }
        ;
    l.hl = function (b, c) {
        return U([null], this.Kg, b, c, this)
    }
        ;
    l.jl = function (b, c) {
        return U([null], this.Og, b, c, this)
    }
        ;
    l.il = function (b, c) {
        return U([null], this.$d, b, c, this)
    }
        ;
    l.cl = function (b, c) {
        return U([null], this.Tc, b, c, this)
    }
        ;
    l.Fi = function (b, c) {
        var d = U(void 0, this.Uc, b, c, this);
        m(d) && c[c.length - 1].push(d)
    }
        ;
    l.kh = function (b, c) {
        var d = U(void 0, this.Uc, b, c, this);
        m(d) && (c[c.length - 1][0] = d)
    }
        ;
    l.eg = function (b, c) {
        var d = U([null], this.Qg, b, c, this);
        if (m(d) && null !== d[0]) {
            var e = new G(null), f = d[0], g = [f.length], h, k;
            h = 1;
            for (k = d.length; h < k; ++h)
                Za(f, d[h]),
                    g.push(f.length);
            Qk(e, "XYZ", f, g);
            return e
        }
    }
        ;
    l.Wf = function (b, c) {
        var d = U([null], this.Cg, b, c, this);
        if (m(d)) {
            var e = new L(null);
            Jm(e, "XYZ", d);
            return e
        }
    }
        ;
    l.$k = function (b, c) {
        var d = U([null], this.Dg, b, c, this);
        return Ud(d[1][0], d[1][1], d[2][0], d[2][1])
    }
        ;
    l.bl = function (b, c) {
        for (var d = Lp(b, !1), e = /^\s*([+\-]?\d*\.?\d+(?:[eE][+\-]?\d+)?)\s*/, f = [], g; g = e.exec(d);)
            f.push(parseFloat(g[1])),
                d = d.substr(g[0].length);
        if ("" === d) {
            d = c[0].srsName;
            e = "enu";
            null === d || (e = ze(Be(d)));
            if ("neu" === e)
                for (d = 0,
                    e = f.length; d < e; d += 3)
                    g = f[d],
                        f[d] = f[d + 1],
                        f[d + 1] = g;
            d = f.length;
            2 == d && f.push(0);
            return 0 === d ? void 0 : f
        }
    }
        ;
    l.He = function (b, c) {
        var d = Lp(b, !1).replace(/^\s*|\s*$/g, "")
            , e = c[0].srsName
            , f = b.parentNode.getAttribute("srsDimension")
            , g = "enu";
        null === e || (g = ze(Be(e)));
        d = d.split(/\s+/);
        e = 2;
        fa(b.getAttribute("srsDimension")) ? fa(b.getAttribute("dimension")) ? null === f || (e = Bq(f)) : e = Bq(b.getAttribute("dimension")) : e = Bq(b.getAttribute("srsDimension"));
        for (var h, k, n = [], p = 0, q = d.length; p < q; p += e)
            f = parseFloat(d[p]),
                h = parseFloat(d[p + 1]),
                k = 3 === e ? parseFloat(d[p + 2]) : 0,
                "en" === g.substr(0, 2) ? n.push(f, h, k) : n.push(h, f, k);
        return n
    }
        ;
    l.Tc = Object({
        "http://www.opengis.net/gml": {
            pos: hq(Y.prototype.bl),
            posList: hq(Y.prototype.He)
        }
    });
    l.$d = Object({
        "http://www.opengis.net/gml": {
            interior: Y.prototype.Fi,
            exterior: Y.prototype.kh
        }
    });
    l.Se = Object({
        "http://www.opengis.net/gml": {
            Point: hq(uq.prototype.dg),
            MultiPoint: hq(uq.prototype.bg),
            LineString: hq(uq.prototype.Pd),
            MultiLineString: hq(uq.prototype.ag),
            LinearRing: hq(uq.prototype.$f),
            Polygon: hq(uq.prototype.Qd),
            MultiPolygon: hq(uq.prototype.cg),
            Surface: hq(Y.prototype.eg),
            MultiSurface: hq(Y.prototype.el),
            Curve: hq(Y.prototype.Wf),
            MultiCurve: hq(Y.prototype.dl),
            Envelope: hq(Y.prototype.$k)
        }
    });
    l.Fg = Object({
        "http://www.opengis.net/gml": {
            curveMember: gq(Y.prototype.cf),
            curveMembers: gq(Y.prototype.cf)
        }
    });
    l.Jg = Object({
        "http://www.opengis.net/gml": {
            surfaceMember: gq(Y.prototype.og),
            surfaceMembers: gq(Y.prototype.og)
        }
    });
    l.Bg = Object({
        "http://www.opengis.net/gml": {
            LineString: gq(uq.prototype.Pd),
            Curve: gq(Y.prototype.Wf)
        }
    });
    l.Pg = Object({
        "http://www.opengis.net/gml": {
            Polygon: gq(uq.prototype.Qd),
            Surface: gq(Y.prototype.eg)
        }
    });
    l.Qg = Object({
        "http://www.opengis.net/gml": {
            patches: hq(Y.prototype.hl)
        }
    });
    l.Cg = Object({
        "http://www.opengis.net/gml": {
            segments: hq(Y.prototype.jl)
        }
    });
    l.Dg = Object({
        "http://www.opengis.net/gml": {
            lowerCorner: gq(Y.prototype.He),
            upperCorner: gq(Y.prototype.He)
        }
    });
    l.Kg = Object({
        "http://www.opengis.net/gml": {
            PolygonPatch: hq(Y.prototype.il)
        }
    });
    l.Og = Object({
        "http://www.opengis.net/gml": {
            LineStringSegment: hq(Y.prototype.cl)
        }
    });
    function Gq(b, c, d) {
        d = d[d.length - 1].srsName;
        c = c.K();
        for (var e = c.length, f = Array(e), g, h = 0; h < e; ++h) {
            g = c[h];
            var k = h
                , n = "enu";
            null != d && (n = ze(Be(d)));
            f[k] = "en" === n.substr(0, 2) ? g[0] + " " + g[1] : g[1] + " " + g[0]
        }
        Dq(b, f.join(" "))
    }
    l.xg = function (b, c, d) {
        var e = d[d.length - 1].srsName;
        null != e && b.setAttribute("srsName", e);
        e = Kp(b.namespaceURI, "pos");
        b.appendChild(e);
        d = d[d.length - 1].srsName;
        b = "enu";
        null != d && (b = ze(Be(d)));
        c = c.K();
        Dq(e, "en" === b.substr(0, 2) ? c[0] + " " + c[1] : c[1] + " " + c[0])
    }
        ;
    var Hq = {
        "http://www.opengis.net/gml": {
            lowerCorner: S(Dq),
            upperCorner: S(Dq)
        }
    };
    l = Y.prototype;
    l.Ul = function (b, c, d) {
        var e = d[d.length - 1].srsName;
        m(e) && b.setAttribute("srsName", e);
        qq({
            node: b
        }, Hq, nq, [c[0] + " " + c[1], c[2] + " " + c[3]], d, ["lowerCorner", "upperCorner"], this)
    }
        ;
    l.ug = function (b, c, d) {
        var e = d[d.length - 1].srsName;
        null != e && b.setAttribute("srsName", e);
        e = Kp(b.namespaceURI, "posList");
        b.appendChild(e);
        Gq(e, c, d)
    }
        ;
    l.Ng = function (b, c) {
        var d = c[c.length - 1]
            , e = d.node
            , f = d.exteriorWritten;
        m(f) || (d.exteriorWritten = !0);
        return Kp(e.namespaceURI, m(f) ? "interior" : "exterior")
    }
        ;
    l.Zd = function (b, c, d) {
        var e = d[d.length - 1].srsName;
        "PolygonPatch" !== b.nodeName && null != e && b.setAttribute("srsName", e);
        "Polygon" === b.nodeName || "PolygonPatch" === b.nodeName ? (c = c.fd(),
            qq({
                node: b,
                srsName: e
            }, Iq, this.Ng, c, d, void 0, this)) : "Surface" === b.nodeName && (e = Kp(b.namespaceURI, "patches"),
                b.appendChild(e),
                b = Kp(e.namespaceURI, "PolygonPatch"),
                e.appendChild(b),
                this.Zd(b, c, d))
    }
        ;
    l.Vd = function (b, c, d) {
        var e = d[d.length - 1].srsName;
        "LineStringSegment" !== b.nodeName && null != e && b.setAttribute("srsName", e);
        "LineString" === b.nodeName || "LineStringSegment" === b.nodeName ? (e = Kp(b.namespaceURI, "posList"),
            b.appendChild(e),
            Gq(e, c, d)) : "Curve" === b.nodeName && (e = Kp(b.namespaceURI, "segments"),
                b.appendChild(e),
                b = Kp(e.namespaceURI, "LineStringSegment"),
                e.appendChild(b),
                this.Vd(b, c, d))
    }
        ;
    l.wg = function (b, c, d) {
        var e = d[d.length - 1]
            , f = e.srsName
            , e = e.surface;
        null != f && b.setAttribute("srsName", f);
        c = c.jd();
        qq({
            node: b,
            srsName: f,
            surface: e
        }, Jq, this.c, c, d, void 0, this)
    }
        ;
    l.Yl = function (b, c, d) {
        var e = d[d.length - 1].srsName;
        null != e && b.setAttribute("srsName", e);
        c = c.zd();
        qq({
            node: b,
            srsName: e
        }, Kq, lq("pointMember"), c, d, void 0, this)
    }
        ;
    l.vg = function (b, c, d) {
        var e = d[d.length - 1]
            , f = e.srsName
            , e = e.curve;
        null != f && b.setAttribute("srsName", f);
        c = c.Gc();
        qq({
            node: b,
            srsName: f,
            curve: e
        }, Lq, this.c, c, d, void 0, this)
    }
        ;
    l.yg = function (b, c, d) {
        var e = Kp(b.namespaceURI, "LinearRing");
        b.appendChild(e);
        this.ug(e, c, d)
    }
        ;
    l.zg = function (b, c, d) {
        var e = this.b(c, d);
        m(e) && (b.appendChild(e),
            this.Zd(e, c, d))
    }
        ;
    l.am = function (b, c, d) {
        var e = Kp(b.namespaceURI, "Point");
        b.appendChild(e);
        this.xg(e, c, d)
    }
        ;
    l.tg = function (b, c, d) {
        var e = this.b(c, d);
        m(e) && (b.appendChild(e),
            this.Vd(e, c, d))
    }
        ;
    l.Yd = function (b, c, d) {
        var e = d[d.length - 1]
            , f = wb(e);
        f.node = b;
        var g;
        ga(c) ? m(e.dataProjection) ? g = Ue(c, e.featureProjection, e.dataProjection) : g = c : g = tp(c, !0, e);
        qq(f, Mq, this.b, [g], d, void 0, this)
    }
        ;
    l.qg = function (b, c, d) {
        var e = c.X;
        m(e) && b.setAttribute("fid", e);
        var e = d[d.length - 1]
            , f = e.featureNS
            , g = c.b;
        m(e.cc) || (e.cc = {},
            e.cc[f] = {});
        var h = c.L();
        c = [];
        var k = [], n;
        for (n in h) {
            var p = h[n];
            null !== p && (c.push(n),
                k.push(p),
                n == g ? n in e.cc[f] || (e.cc[f][n] = S(this.Yd, this)) : n in e.cc[f] || (e.cc[f][n] = S(Dq)))
        }
        n = wb(e);
        n.node = b;
        qq(n, e.cc, lq(void 0, f), k, d, c)
    }
        ;
    var Jq = {
        "http://www.opengis.net/gml": {
            surfaceMember: S(Y.prototype.zg),
            polygonMember: S(Y.prototype.zg)
        }
    }
        , Kq = {
            "http://www.opengis.net/gml": {
                pointMember: S(Y.prototype.am)
            }
        }
        , Lq = {
            "http://www.opengis.net/gml": {
                lineStringMember: S(Y.prototype.tg),
                curveMember: S(Y.prototype.tg)
            }
        }
        , Iq = {
            "http://www.opengis.net/gml": {
                exterior: S(Y.prototype.yg),
                interior: S(Y.prototype.yg)
            }
        }
        , Mq = {
            "http://www.opengis.net/gml": {
                Curve: S(Y.prototype.Vd),
                MultiCurve: S(Y.prototype.vg),
                Point: S(Y.prototype.xg),
                MultiPoint: S(Y.prototype.Yl),
                LineString: S(Y.prototype.Vd),
                MultiLineString: S(Y.prototype.vg),
                LinearRing: S(Y.prototype.ug),
                Polygon: S(Y.prototype.Zd),
                MultiPolygon: S(Y.prototype.wg),
                Surface: S(Y.prototype.Zd),
                MultiSurface: S(Y.prototype.wg),
                Envelope: S(Y.prototype.Ul)
            }
        }
        , Nq = {
            MultiLineString: "lineStringMember",
            MultiCurve: "curveMember",
            MultiPolygon: "polygonMember",
            MultiSurface: "surfaceMember"
        };
    Y.prototype.c = function (b, c) {
        return Kp("http://www.opengis.net/gml", Nq[c[c.length - 1].node.nodeName])
    }
        ;
    Y.prototype.b = function (b, c) {
        var d = c[c.length - 1], e = d.multiSurface, f = d.surface, g = d.curve, d = d.multiCurve, h;
        ga(b) ? h = "Envelope" : (h = b.I(),
            "MultiPolygon" === h && !0 === e ? h = "MultiSurface" : "Polygon" === h && !0 === f ? h = "Surface" : "LineString" === h && !0 === g ? h = "Curve" : "MultiLineString" === h && !0 === d && (h = "MultiCurve"));
        return Kp("http://www.opengis.net/gml", h)
    }
        ;
    Y.prototype.i = function (b, c) {
        c = sp(this, c);
        var d = Kp("http://www.opengis.net/gml", "geom")
            , e = {
                node: d,
                srsName: this.srsName,
                curve: this.f,
                surface: this.j,
                multiSurface: this.g,
                multiCurve: this.e
            };
        m(c) && yb(e, c);
        this.Yd(d, b, [e]);
        return d
    }
        ;
    Y.prototype.a = function (b, c) {
        c = sp(this, c);
        var d = Kp("http://www.opengis.net/gml", "featureMembers");
        dq(d, "http://www.w3.org/2001/XMLSchema-instance", "xsi:schemaLocation", this.schemaLocation);
        var e = {
            srsName: this.srsName,
            curve: this.f,
            surface: this.j,
            multiSurface: this.g,
            multiCurve: this.e,
            featureNS: this.featureNS,
            featureType: this.featureType
        };
        m(c) && yb(e, c);
        var e = [e]
            , f = e[e.length - 1]
            , g = f.featureType
            , h = f.featureNS
            , k = {};
        k[h] = {};
        k[h][g] = S(this.qg, this);
        f = wb(f);
        f.node = d;
        qq(f, k, lq(g, h), b, e);
        return d
    }
        ;
    function Oq(b) {
        b = m(b) ? b : {};
        uq.call(this, b);
        this.schemaLocation = m(b.schemaLocation) ? b.schemaLocation : "http://www.opengis.net/gml http://schemas.opengis.net/gml/2.1.2/feature.xsd"
    }
    v(Oq, uq);
    l = Oq.prototype;
    l.Zf = function (b, c) {
        var d = Lp(b, !1).replace(/^\s*|\s*$/g, "")
            , e = c[0].srsName
            , f = b.parentNode.getAttribute("srsDimension")
            , g = "enu";
        null === e || (g = ze(Be(e)));
        d = d.split(/[\s,]+/);
        e = 2;
        fa(b.getAttribute("srsDimension")) ? fa(b.getAttribute("dimension")) ? null === f || (e = Bq(f)) : e = Bq(b.getAttribute("dimension")) : e = Bq(b.getAttribute("srsDimension"));
        for (var h, k, n = [], p = 0, q = d.length; p < q; p += e)
            f = parseFloat(d[p]),
                h = parseFloat(d[p + 1]),
                k = 3 === e ? parseFloat(d[p + 2]) : 0,
                "en" === g.substr(0, 2) ? n.push(f, h, k) : n.push(h, f, k);
        return n
    }
        ;
    l.Zk = function (b, c) {
        var d = U([null], this.Ag, b, c, this);
        return Ud(d[1][0], d[1][1], d[1][3], d[1][4])
    }
        ;
    l.Di = function (b, c) {
        var d = U(void 0, this.Uc, b, c, this);
        m(d) && c[c.length - 1].push(d)
    }
        ;
    l.Mk = function (b, c) {
        var d = U(void 0, this.Uc, b, c, this);
        m(d) && (c[c.length - 1][0] = d)
    }
        ;
    l.Tc = Object({
        "http://www.opengis.net/gml": {
            coordinates: hq(Oq.prototype.Zf)
        }
    });
    l.$d = Object({
        "http://www.opengis.net/gml": {
            innerBoundaryIs: Oq.prototype.Di,
            outerBoundaryIs: Oq.prototype.Mk
        }
    });
    l.Ag = Object({
        "http://www.opengis.net/gml": {
            coordinates: gq(Oq.prototype.Zf)
        }
    });
    l.Se = Object({
        "http://www.opengis.net/gml": {
            Point: hq(uq.prototype.dg),
            MultiPoint: hq(uq.prototype.bg),
            LineString: hq(uq.prototype.Pd),
            MultiLineString: hq(uq.prototype.ag),
            LinearRing: hq(uq.prototype.$f),
            Polygon: hq(uq.prototype.Qd),
            MultiPolygon: hq(uq.prototype.cg),
            Box: hq(Oq.prototype.Zk)
        }
    });
    function Pq(b) {
        b = m(b) ? b : {};
        this.defaultDataProjection = null;
        this.defaultDataProjection = Be("EPSG:4326");
        this.d = b.readExtensions
    }
    v(Pq, rq);
    var Qq = [null, "http://www.topografix.com/GPX/1/0", "http://www.topografix.com/GPX/1/1"];
    function Rq(b, c, d) {
        b.push(parseFloat(c.getAttribute("lon")), parseFloat(c.getAttribute("lat")));
        "ele" in d ? (b.push(d.ele),
            tb(d, "ele")) : b.push(0);
        "time" in d ? (b.push(d.time),
            tb(d, "time")) : b.push(0);
        return b
    }
    function Sq(b, c) {
        var d = c[c.length - 1]
            , e = b.getAttribute("href");
        null === e || (d.link = e);
        pq(Tq, b, c)
    }
    function Uq(b, c) {
        c[c.length - 1].extensionsNode_ = b
    }
    function Vq(b, c) {
        var d = c[0]
            , e = U({
                flatCoordinates: []
            }, Wq, b, c);
        if (m(e)) {
            var f = e.flatCoordinates;
            tb(e, "flatCoordinates");
            var g = new L(null);
            Jm(g, "XYZM", f);
            tp(g, !1, d);
            d = new P(g);
            d.G(e);
            return d
        }
    }
    function Xq(b, c) {
        var d = c[0]
            , e = U({
                flatCoordinates: [],
                ends: []
            }, Yq, b, c);
        if (m(e)) {
            var f = e.flatCoordinates;
            tb(e, "flatCoordinates");
            var g = e.ends;
            tb(e, "ends");
            var h = new Km(null);
            Lm(h, "XYZM", f, g);
            tp(h, !1, d);
            d = new P(h);
            d.G(e);
            return d
        }
    }
    function Zq(b, c) {
        var d = c[0]
            , e = U({}, $q, b, c);
        if (m(e)) {
            var f = Rq([], b, e)
                , f = new Ek(f, "XYZM");
            tp(f, !1, d);
            d = new P(f);
            d.G(e);
            return d
        }
    }
    var ar = {
        rte: Vq,
        trk: Xq,
        wpt: Zq
    }
        , br = R(Qq, {
            rte: gq(Vq),
            trk: gq(Xq),
            wpt: gq(Zq)
        })
        , Tq = R(Qq, {
            text: Q(X, "linkText"),
            type: Q(X, "linkType")
        })
        , Wq = R(Qq, {
            name: Q(X),
            cmt: Q(X),
            desc: Q(X),
            src: Q(X),
            link: Sq,
            number: Q(Aq),
            extensions: Uq,
            type: Q(X),
            rtept: function (b, c) {
                var d = U({}, cr, b, c);
                m(d) && Rq(c[c.length - 1].flatCoordinates, b, d)
            }
        })
        , cr = R(Qq, {
            ele: Q(yq),
            time: Q(xq)
        })
        , Yq = R(Qq, {
            name: Q(X),
            cmt: Q(X),
            desc: Q(X),
            src: Q(X),
            link: Sq,
            number: Q(Aq),
            type: Q(X),
            extensions: Uq,
            trkseg: function (b, c) {
                var d = c[c.length - 1];
                pq(dr, b, c);
                d.ends.push(d.flatCoordinates.length)
            }
        })
        , dr = R(Qq, {
            trkpt: function (b, c) {
                var d = U({}, er, b, c);
                m(d) && Rq(c[c.length - 1].flatCoordinates, b, d)
            }
        })
        , er = R(Qq, {
            ele: Q(yq),
            time: Q(xq)
        })
        , $q = R(Qq, {
            ele: Q(yq),
            time: Q(xq),
            magvar: Q(yq),
            geoidheight: Q(yq),
            name: Q(X),
            cmt: Q(X),
            desc: Q(X),
            src: Q(X),
            link: Sq,
            sym: Q(X),
            type: Q(X),
            fix: Q(X),
            sat: Q(Aq),
            hdop: Q(yq),
            vdop: Q(yq),
            pdop: Q(yq),
            ageofdgpsdata: Q(yq),
            dgpsid: Q(Aq),
            extensions: Uq
        });
    function fr(b, c) {
        null === c && (c = []);
        for (var d = 0, e = c.length; d < e; ++d) {
            var f = c[d];
            if (m(b.d)) {
                var g = f.get("extensionsNode_") || null;
                b.d(f, g)
            }
            f.set("extensionsNode_", void 0)
        }
    }
    Pq.prototype.Yf = function (b, c) {
        if (!Va(Qq, b.namespaceURI))
            return null;
        var d = ar[b.localName];
        if (!m(d))
            return null;
        d = d(b, [rp(this, b, c)]);
        if (!m(d))
            return null;
        fr(this, [d]);
        return d
    }
        ;
    Pq.prototype.Ob = function (b, c) {
        if (!Va(Qq, b.namespaceURI))
            return [];
        if ("gpx" == b.localName) {
            var d = U([], br, b, [rp(this, b, c)]);
            if (m(d))
                return fr(this, d),
                    d
        }
        return []
    }
        ;
    function gr(b, c, d) {
        b.setAttribute("href", c);
        c = d[d.length - 1].properties;
        qq({
            node: b
        }, hr, nq, [c.linkText, c.linkType], d, ir)
    }
    function jr(b, c, d) {
        var e = d[d.length - 1]
            , f = e.node.namespaceURI
            , g = e.properties;
        dq(b, null, "lat", c[1]);
        dq(b, null, "lon", c[0]);
        switch (e.geometryLayout) {
            case "XYZM":
                0 !== c[3] && (g.time = c[3]);
            case "XYZ":
                0 !== c[2] && (g.ele = c[2]);
                break;
            case "XYM":
                0 !== c[2] && (g.time = c[2])
        }
        c = kr[f];
        e = oq(g, c);
        qq({
            node: b,
            properties: g
        }, lr, nq, e, d, c)
    }
    var ir = ["text", "type"]
        , hr = jq(Qq, {
            text: S(Dq),
            type: S(Dq)
        })
        , mr = jq(Qq, "name cmt desc src link number type rtept".split(" "))
        , nr = jq(Qq, {
            name: S(Dq),
            cmt: S(Dq),
            desc: S(Dq),
            src: S(Dq),
            link: S(gr),
            number: S(Fq),
            type: S(Dq),
            rtept: kq(S(jr))
        })
        , or = jq(Qq, "name cmt desc src link number type trkseg".split(" "))
        , rr = jq(Qq, {
            name: S(Dq),
            cmt: S(Dq),
            desc: S(Dq),
            src: S(Dq),
            link: S(gr),
            number: S(Fq),
            type: S(Dq),
            trkseg: kq(S(function (b, c, d) {
                qq({
                    node: b,
                    geometryLayout: c.a,
                    properties: {}
                }, pr, qr, c.K(), d)
            }))
        })
        , qr = lq("trkpt")
        , pr = jq(Qq, {
            trkpt: S(jr)
        })
        , kr = jq(Qq, "ele time magvar geoidheight name cmt desc src link sym type fix sat hdop vdop pdop ageofdgpsdata dgpsid".split(" "))
        , lr = jq(Qq, {
            ele: S(Eq),
            time: S(function (b, c) {
                var d = new Date(1E3 * c)
                    , d = d.getUTCFullYear() + "-" + Ja(d.getUTCMonth() + 1) + "-" + Ja(d.getUTCDate()) + "T" + Ja(d.getUTCHours()) + ":" + Ja(d.getUTCMinutes()) + ":" + Ja(d.getUTCSeconds()) + "Z";
                b.appendChild(Hp.createTextNode(d))
            }),
            magvar: S(Eq),
            geoidheight: S(Eq),
            name: S(Dq),
            cmt: S(Dq),
            desc: S(Dq),
            src: S(Dq),
            link: S(gr),
            sym: S(Dq),
            type: S(Dq),
            fix: S(Dq),
            sat: S(Fq),
            hdop: S(Eq),
            vdop: S(Eq),
            pdop: S(Eq),
            ageofdgpsdata: S(Eq),
            dgpsid: S(Fq)
        })
        , sr = {
            Point: "wpt",
            LineString: "rte",
            MultiLineString: "trk"
        };
    function tr(b, c) {
        var d = b.N();
        if (m(d))
            return Kp(c[c.length - 1].node.namespaceURI, sr[d.I()])
    }
    var ur = jq(Qq, {
        rte: S(function (b, c, d) {
            var e = d[0]
                , f = c.L();
            b = {
                node: b,
                properties: f
            };
            c = c.N();
            m(c) && (c = tp(c, !0, e),
                b.geometryLayout = c.a,
                f.rtept = c.K());
            e = mr[d[d.length - 1].node.namespaceURI];
            f = oq(f, e);
            qq(b, nr, nq, f, d, e)
        }),
        trk: S(function (b, c, d) {
            var e = d[0]
                , f = c.L();
            b = {
                node: b,
                properties: f
            };
            c = c.N();
            m(c) && (c = tp(c, !0, e),
                f.trkseg = c.Gc());
            e = or[d[d.length - 1].node.namespaceURI];
            f = oq(f, e);
            qq(b, rr, nq, f, d, e)
        }),
        wpt: S(function (b, c, d) {
            var e = d[0]
                , f = d[d.length - 1];
            f.properties = c.L();
            c = c.N();
            m(c) && (c = tp(c, !0, e),
                f.geometryLayout = c.a,
                jr(b, c.K(), d))
        })
    });
    Pq.prototype.a = function (b, c) {
        c = sp(this, c);
        var d = Kp("http://www.topografix.com/GPX/1/1", "gpx");
        qq({
            node: d
        }, ur, tr, b, [c]);
        return d
    }
        ;
    function vr(b) {
        b = wr(b);
        return Ra(b, function (b) {
            return b.b.substring(b.d, b.a)
        })
    }
    function xr(b, c, d) {
        this.b = b;
        this.d = c;
        this.a = d
    }
    function wr(b) {
        for (var c = RegExp("\r\n|\r|\n", "g"), d = 0, e, f = []; e = c.exec(b);)
            d = new xr(b, d, e.index),
                f.push(d),
                d = c.lastIndex;
        d < b.length && (d = new xr(b, d, b.length),
            f.push(d));
        return f
    }
    ; function yr() {
        this.defaultDataProjection = null
    }
    v(yr, qp);
    l = yr.prototype;
    l.I = function () {
        return "text"
    }
        ;
    l.Nb = function (b, c) {
        return this.Kc(ia(b) ? b : "", sp(this, c))
    }
        ;
    l.ma = function (b, c) {
        return this.Ge(ia(b) ? b : "", sp(this, c))
    }
        ;
    l.Lc = function (b, c) {
        return this.Mc(ia(b) ? b : "", sp(this, c))
    }
        ;
    l.Ha = function () {
        return this.defaultDataProjection
    }
        ;
    l.Wd = function (b, c) {
        return this.Xd(b, sp(this, c))
    }
        ;
    l.Qb = function (b, c) {
        return this.rg(b, sp(this, c))
    }
        ;
    l.Rc = function (b, c) {
        return this.Sc(b, sp(this, c))
    }
        ;
    function zr(b) {
        b = m(b) ? b : {};
        this.defaultDataProjection = null;
        this.defaultDataProjection = Be("EPSG:4326");
        this.a = m(b.altitudeMode) ? b.altitudeMode : "none"
    }
    v(zr, yr);
    var Ar = /^B(\d{2})(\d{2})(\d{2})(\d{2})(\d{5})([NS])(\d{3})(\d{5})([EW])([AV])(\d{5})(\d{5})/
        , Br = /^H.([A-Z]{3}).*?:(.*)/
        , Cr = /^HFDTE(\d{2})(\d{2})(\d{2})/;
    zr.prototype.Kc = function (b, c) {
        var d = this.a, e = vr(b), f = {}, g = [], h = 2E3, k = 0, n = 1, p, q;
        p = 0;
        for (q = e.length; p < q; ++p) {
            var r = e[p], s;
            if ("B" == r.charAt(0)) {
                if (s = Ar.exec(r)) {
                    var r = parseInt(s[1], 10)
                        , u = parseInt(s[2], 10)
                        , y = parseInt(s[3], 10)
                        , A = parseInt(s[4], 10) + parseInt(s[5], 10) / 6E4;
                    "S" == s[6] && (A = -A);
                    var z = parseInt(s[7], 10) + parseInt(s[8], 10) / 6E4;
                    "W" == s[9] && (z = -z);
                    g.push(z, A);
                    "none" != d && g.push("gps" == d ? parseInt(s[11], 10) : "barometric" == d ? parseInt(s[12], 10) : 0);
                    g.push(Date.UTC(h, k, n, r, u, y) / 1E3)
                }
            } else if ("H" == r.charAt(0))
                if (s = Cr.exec(r))
                    n = parseInt(s[1], 10),
                        k = parseInt(s[2], 10) - 1,
                        h = 2E3 + parseInt(s[3], 10);
                else if (s = Br.exec(r))
                    f[s[1]] = Aa(s[2]),
                        Cr.exec(r)
        }
        if (0 === g.length)
            return null;
        e = new L(null);
        Jm(e, "none" == d ? "XYM" : "XYZM", g);
        d = new P(tp(e, !1, c));
        d.G(f);
        return d
    }
        ;
    zr.prototype.Ge = function (b, c) {
        var d = this.Kc(b, c);
        return null === d ? [] : [d]
    }
        ;
    var Dr = /^(?:([^:/?#.]+):)?(?:\/\/(?:([^/?#]*)@)?([^/#?]*?)(?::([0-9]+))?(?=[/#?]|$))?([^?#]+)?(?:\?([^#]*))?(?:#(.*))?$/;
    function Er(b) {
        if (Fr) {
            Fr = !1;
            var c = ba.location;
            if (c) {
                var d = c.href;
                if (d && (d = (d = Er(d)[3] || null) ? decodeURI(d) : d) && d != c.hostname)
                    throw Fr = !0,
                    Error();
            }
        }
        return b.match(Dr)
    }
    var Fr = Db;
    function Gr(b, c) {
        for (var d = b.split("&"), e = 0; e < d.length; e++) {
            var f = d[e].indexOf("=")
                , g = null
                , h = null;
            0 <= f ? (g = d[e].substring(0, f),
                h = d[e].substring(f + 1)) : g = d[e];
            c(g, h ? decodeURIComponent(h.replace(/\+/g, " ")) : "")
        }
    }
    function Hr(b) {
        if (b[1]) {
            var c = b[0]
                , d = c.indexOf("#");
            0 <= d && (b.push(c.substr(d)),
                b[0] = c = c.substr(0, d));
            d = c.indexOf("?");
            0 > d ? b[1] = "?" : d == c.length - 1 && (b[1] = void 0)
        }
        return b.join("")
    }
    function Ir(b, c, d) {
        if (ga(c))
            for (var e = 0; e < c.length; e++)
                Ir(b, String(c[e]), d);
        else
            null != c && d.push("&", b, "" === c ? "" : "=", encodeURIComponent(String(c)))
    }
    function Jr(b, c) {
        for (var d in c)
            Ir(d, c[d], b);
        return b
    }
    ; function Kr(b, c) {
        var d;
        b instanceof Kr ? (this.Wb = m(c) ? c : b.Wb,
            Lr(this, b.Pb),
            this.ec = b.ec,
            this.qb = b.qb,
            Mr(this, b.sc),
            this.ob = b.ob,
            Nr(this, b.a.clone()),
            this.Sb = b.Sb) : b && (d = Er(String(b))) ? (this.Wb = !!c,
                Lr(this, d[1] || "", !0),
                this.ec = Or(d[2] || ""),
                this.qb = Or(d[3] || "", !0),
                Mr(this, d[4]),
                this.ob = Or(d[5] || "", !0),
                Nr(this, d[6] || "", !0),
                this.Sb = Or(d[7] || "")) : (this.Wb = !!c,
                    this.a = new Pr(null, 0, this.Wb))
    }
    l = Kr.prototype;
    l.Pb = "";
    l.ec = "";
    l.qb = "";
    l.sc = null;
    l.ob = "";
    l.Sb = "";
    l.Wb = !1;
    l.toString = function () {
        var b = []
            , c = this.Pb;
        c && b.push(Qr(c, Rr, !0), ":");
        if (c = this.qb) {
            b.push("//");
            var d = this.ec;
            d && b.push(Qr(d, Rr, !0), "@");
            b.push(encodeURIComponent(String(c)).replace(/%25([0-9a-fA-F]{2})/g, "%$1"));
            c = this.sc;
            null != c && b.push(":", String(c))
        }
        if (c = this.ob)
            this.qb && "/" != c.charAt(0) && b.push("/"),
                b.push(Qr(c, "/" == c.charAt(0) ? Sr : Tr, !0));
        (c = this.a.toString()) && b.push("?", c);
        (c = this.Sb) && b.push("#", Qr(c, Ur));
        return b.join("")
    }
        ;
    l.clone = function () {
        return new Kr(this)
    }
        ;
    function Lr(b, c, d) {
        b.Pb = d ? Or(c, !0) : c;
        b.Pb && (b.Pb = b.Pb.replace(/:$/, ""))
    }
    function Mr(b, c) {
        if (c) {
            c = Number(c);
            if (isNaN(c) || 0 > c)
                throw Error("Bad port number " + c);
            b.sc = c
        } else
            b.sc = null
    }
    function Nr(b, c, d) {
        c instanceof Pr ? (b.a = c,
            Vr(b.a, b.Wb)) : (d || (c = Qr(c, Wr)),
                b.a = new Pr(c, 0, b.Wb))
    }
    function Xr(b) {
        return b instanceof Kr ? b.clone() : new Kr(b, void 0)
    }
    function Yr(b, c) {
        b instanceof Kr || (b = Xr(b));
        c instanceof Kr || (c = Xr(c));
        var d = b
            , e = c
            , f = d.clone()
            , g = !!e.Pb;
        g ? Lr(f, e.Pb) : g = !!e.ec;
        g ? f.ec = e.ec : g = !!e.qb;
        g ? f.qb = e.qb : g = null != e.sc;
        var h = e.ob;
        if (g)
            Mr(f, e.sc);
        else if (g = !!e.ob)
            if ("/" != h.charAt(0) && (d.qb && !d.ob ? h = "/" + h : (d = f.ob.lastIndexOf("/"),
                -1 != d && (h = f.ob.substr(0, d + 1) + h))),
                d = h,
                ".." == d || "." == d)
                h = "";
            else if (-1 != d.indexOf("./") || -1 != d.indexOf("/.")) {
                for (var h = 0 == d.lastIndexOf("/", 0), d = d.split("/"), k = [], n = 0; n < d.length;) {
                    var p = d[n++];
                    "." == p ? h && n == d.length && k.push("") : ".." == p ? ((1 < k.length || 1 == k.length && "" != k[0]) && k.pop(),
                        h && n == d.length && k.push("")) : (k.push(p),
                            h = !0)
                }
                h = k.join("/")
            } else
                h = d;
        g ? f.ob = h : g = "" !== e.a.toString();
        g ? Nr(f, Or(e.a.toString())) : g = !!e.Sb;
        g && (f.Sb = e.Sb);
        return f
    }
    function Or(b, c) {
        return b ? c ? decodeURI(b) : decodeURIComponent(b) : ""
    }
    function Qr(b, c, d) {
        return ia(b) ? (b = encodeURI(b).replace(c, Zr),
            d && (b = b.replace(/%25([0-9a-fA-F]{2})/g, "%$1")),
            b) : null
    }
    function Zr(b) {
        b = b.charCodeAt(0);
        return "%" + (b >> 4 & 15).toString(16) + (b & 15).toString(16)
    }
    var Rr = /[#\/\?@]/g
        , Tr = /[\#\?:]/g
        , Sr = /[\#\?]/g
        , Wr = /[\#\?@]/g
        , Ur = /#/g;
    function Pr(b, c, d) {
        this.a = b || null;
        this.d = !!d
    }
    function $r(b) {
        b.fa || (b.fa = new uh,
            b.wa = 0,
            b.a && Gr(b.a, function (c, d) {
                b.add(decodeURIComponent(c.replace(/\+/g, " ")), d)
            }))
    }
    l = Pr.prototype;
    l.fa = null;
    l.wa = null;
    l.Tb = function () {
        $r(this);
        return this.wa
    }
        ;
    l.add = function (b, c) {
        $r(this);
        this.a = null;
        b = as(this, b);
        var d = this.fa.get(b);
        d || this.fa.set(b, d = []);
        d.push(c);
        this.wa++;
        return this
    }
        ;
    l.remove = function (b) {
        $r(this);
        b = as(this, b);
        return wh(this.fa.d, b) ? (this.a = null,
            this.wa -= this.fa.get(b).length,
            this.fa.remove(b)) : !1
    }
        ;
    l.clear = function () {
        this.fa = this.a = null;
        this.wa = 0
    }
        ;
    l.la = function () {
        $r(this);
        return 0 == this.wa
    }
        ;
    function bs(b, c) {
        $r(b);
        c = as(b, c);
        return wh(b.fa.d, c)
    }
    l.J = function () {
        $r(this);
        for (var b = this.fa.lb(), c = this.fa.J(), d = [], e = 0; e < c.length; e++)
            for (var f = b[e], g = 0; g < f.length; g++)
                d.push(c[e]);
        return d
    }
        ;
    l.lb = function (b) {
        $r(this);
        var c = [];
        if (ia(b))
            bs(this, b) && (c = Xa(c, this.fa.get(as(this, b))));
        else {
            b = this.fa.lb();
            for (var d = 0; d < b.length; d++)
                c = Xa(c, b[d])
        }
        return c
    }
        ;
    l.set = function (b, c) {
        $r(this);
        this.a = null;
        b = as(this, b);
        bs(this, b) && (this.wa -= this.fa.get(b).length);
        this.fa.set(b, [c]);
        this.wa++;
        return this
    }
        ;
    l.get = function (b, c) {
        var d = b ? this.lb(b) : [];
        return 0 < d.length ? String(d[0]) : c
    }
        ;
    function cs(b, c, d) {
        b.remove(c);
        0 < d.length && (b.a = null,
            b.fa.set(as(b, c), Ya(d)),
            b.wa += d.length)
    }
    l.toString = function () {
        if (this.a)
            return this.a;
        if (!this.fa)
            return "";
        for (var b = [], c = this.fa.J(), d = 0; d < c.length; d++)
            for (var e = c[d], f = encodeURIComponent(String(e)), e = this.lb(e), g = 0; g < e.length; g++) {
                var h = f;
                "" !== e[g] && (h += "=" + encodeURIComponent(String(e[g])));
                b.push(h)
            }
        return this.a = b.join("&")
    }
        ;
    l.clone = function () {
        var b = new Pr;
        b.a = this.a;
        this.fa && (b.fa = this.fa.clone(),
            b.wa = this.wa);
        return b
    }
        ;
    function as(b, c) {
        var d = String(c);
        b.d && (d = d.toLowerCase());
        return d
    }
    function Vr(b, c) {
        c && !b.d && ($r(b),
            b.a = null,
            b.fa.forEach(function (b, c) {
                var f = c.toLowerCase();
                c != f && (this.remove(c),
                    cs(this, f, b))
            }, b));
        b.d = c
    }
    ; function ds(b) {
        b = m(b) ? b : {};
        this.c = b.font;
        this.f = b.rotation;
        this.d = b.scale;
        this.b = b.text;
        this.g = b.textAlign;
        this.j = b.textBaseline;
        this.a = m(b.fill) ? b.fill : null;
        this.e = m(b.stroke) ? b.stroke : null;
        this.i = m(b.offsetX) ? b.offsetX : 0;
        this.n = m(b.offsetY) ? b.offsetY : 0
    }
    l = ds.prototype;
    l.th = function () {
        return this.c
    }
        ;
    l.Hh = function () {
        return this.i
    }
        ;
    l.Ih = function () {
        return this.n
    }
        ;
    l.wk = function () {
        return this.a
    }
        ;
    l.xk = function () {
        return this.f
    }
        ;
    l.yk = function () {
        return this.d
    }
        ;
    l.zk = function () {
        return this.e
    }
        ;
    l.Ak = function () {
        return this.b
    }
        ;
    l.Qh = function () {
        return this.g
    }
        ;
    l.Rh = function () {
        return this.j
    }
        ;
    l.yl = function (b) {
        this.c = b
    }
        ;
    l.xl = function (b) {
        this.a = b
    }
        ;
    l.Bk = function (b) {
        this.f = b
    }
        ;
    l.Ck = function (b) {
        this.d = b
    }
        ;
    l.Fl = function (b) {
        this.e = b
    }
        ;
    l.Gl = function (b) {
        this.b = b
    }
        ;
    l.Hl = function (b) {
        this.g = b
    }
        ;
    l.Il = function (b) {
        this.j = b
    }
        ;
    function es(b) {
        function c(b) {
            return ga(b) ? b : ia(b) ? (!(b in e) && "#" + b in e && (b = "#" + b),
                c(e[b])) : d
        }
        b = m(b) ? b : {};
        this.defaultDataProjection = null;
        this.defaultDataProjection = Be("EPSG:4326");
        var d = m(b.defaultStyle) ? b.defaultStyle : fs
            , e = {};
        this.b = m(b.extractStyles) ? b.extractStyles : !0;
        this.d = e;
        this.c = function () {
            var b = this.get("Style");
            if (m(b))
                return b;
            b = this.get("styleUrl");
            return m(b) ? c(b) : d
        }
    }
    v(es, rq);
    var gs = ["http://www.google.com/kml/ext/2.2"]
        , hs = [null, "http://earth.google.com/kml/2.0", "http://earth.google.com/kml/2.1", "http://earth.google.com/kml/2.2", "http://www.opengis.net/kml/2.2"]
        , is = [255, 255, 255, 1]
        , js = new jl({
            color: is
        })
        , ks = [20, 2]
        , ls = [64, 64]
        , ms = new oj({
            anchor: ks,
            anchorOrigin: "bottom-left",
            anchorXUnits: "pixels",
            anchorYUnits: "pixels",
            crossOrigin: "anonymous",
            rotation: 0,
            scale: .5,
            size: ls,
            src: "https://maps.google.com/mapfiles/kml/pushpin/ylw-pushpin.png"
        })
        , ns = new fl({
            color: is,
            width: 1
        })
        , os = new ds({
            font: "normal 16px Helvetica",
            fill: js,
            stroke: ns,
            scale: 1
        })
        , fs = [new ll({
            fill: js,
            image: ms,
            text: os,
            stroke: ns,
            zIndex: 0
        })]
        , ps = {
            fraction: "fraction",
            pixels: "pixels"
        };
    function qs(b) {
        b = Lp(b, !1);
        if (b = /^\s*#?\s*([0-9A-Fa-f]{8})\s*$/.exec(b))
            return b = b[1],
                [parseInt(b.substr(6, 2), 16), parseInt(b.substr(4, 2), 16), parseInt(b.substr(2, 2), 16), parseInt(b.substr(0, 2), 16) / 255]
    }
    function rs(b) {
        b = Lp(b, !1);
        for (var c = [], d = /^\s*([+\-]?\d*\.?\d+(?:e[+\-]?\d+)?)\s*,\s*([+\-]?\d*\.?\d+(?:e[+\-]?\d+)?)(?:\s*,\s*([+\-]?\d*\.?\d+(?:e[+\-]?\d+)?))?\s*/i, e; e = d.exec(b);)
            c.push(parseFloat(e[1]), parseFloat(e[2]), e[3] ? parseFloat(e[3]) : 0),
                b = b.substr(e[0].length);
        return "" !== b ? void 0 : c
    }
    function ss(b) {
        var c = Lp(b, !1);
        return null != b.baseURI ? Yr(b.baseURI, Aa(c)).toString() : Aa(c)
    }
    function ts(b) {
        b = yq(b);
        if (m(b))
            return Math.sqrt(b)
    }
    function us(b, c) {
        return U(null, vs, b, c)
    }
    function ws(b, c) {
        var d = U({
            k: [],
            pg: []
        }, xs, b, c);
        if (m(d)) {
            var e = d.k, d = d.pg, f, g;
            f = 0;
            for (g = Math.min(e.length, d.length); f < g; ++f)
                e[4 * f + 3] = d[f];
            d = new L(null);
            Jm(d, "XYZM", e);
            return d
        }
    }
    function ys(b, c) {
        var d = U(null, zs, b, c);
        if (m(d)) {
            var e = new L(null);
            Jm(e, "XYZ", d);
            return e
        }
    }
    function As(b, c) {
        var d = U(null, zs, b, c);
        if (m(d)) {
            var e = new G(null);
            Qk(e, "XYZ", d, [d.length]);
            return e
        }
    }
    function Bs(b, c) {
        var d = U([], Cs, b, c);
        if (!m(d))
            return null;
        if (0 === d.length)
            return new Cm(d);
        var e = !0, f = d[0].I(), g, h, k;
        h = 1;
        for (k = d.length; h < k; ++h)
            if (g = d[h],
                g.I() != f) {
                e = !1;
                break
            }
        if (e) {
            if ("Point" == f) {
                g = d[0];
                e = g.a;
                f = g.k;
                h = 1;
                for (k = d.length; h < k; ++h)
                    g = d[h],
                        Za(f, g.k);
                d = new Nm(null);
                kk(d, e, f);
                d.o();
                return d
            }
            return "LineString" == f ? (g = new Km(null),
                Mm(g, d),
                g) : "Polygon" == f ? (g = new Om(null),
                    Qm(g, d),
                    g) : "GeometryCollection" == f ? new Cm(d) : null
        }
        return new Cm(d)
    }
    function Ds(b, c) {
        var d = U(null, zs, b, c);
        if (null != d) {
            var e = new Ek(null);
            Fk(e, "XYZ", d);
            return e
        }
    }
    function Es(b, c) {
        var d = U([null], Fs, b, c);
        if (null != d && null !== d[0]) {
            var e = new G(null), f = d[0], g = [f.length], h, k;
            h = 1;
            for (k = d.length; h < k; ++h)
                Za(f, d[h]),
                    g.push(f.length);
            Qk(e, "XYZ", f, g);
            return e
        }
    }
    function Gs(b, c) {
        var d = U({}, Hs, b, c);
        if (!m(d))
            return null;
        var e = ub(d, "fillStyle", js)
            , f = d.fill;
        m(f) && !f && (e = null);
        var f = ub(d, "imageStyle", ms)
            , g = ub(d, "textStyle", os)
            , h = ub(d, "strokeStyle", ns)
            , d = d.outline;
        m(d) && !d && (h = null);
        return [new ll({
            fill: e,
            image: f,
            stroke: h,
            text: g,
            zIndex: void 0
        })]
    }
    function Is(b, c) {
        pq(Js, b, c)
    }
    var Ks = R(hs, {
        value: hq(X)
    })
        , Js = R(hs, {
            Data: function (b, c) {
                var d = b.getAttribute("name");
                if (null !== d) {
                    var e = U(void 0, Ks, b, c);
                    m(e) && (c[c.length - 1][d] = e)
                }
            },
            SchemaData: function (b, c) {
                pq(Ls, b, c)
            }
        })
        , vs = R(hs, {
            coordinates: hq(rs)
        })
        , Fs = R(hs, {
            innerBoundaryIs: function (b, c) {
                var d = U(void 0, Ms, b, c);
                m(d) && c[c.length - 1].push(d)
            },
            outerBoundaryIs: function (b, c) {
                var d = U(void 0, Ns, b, c);
                m(d) && (c[c.length - 1][0] = d)
            }
        })
        , xs = R(hs, {
            when: function (b, c) {
                var d = c[c.length - 1].pg
                    , e = Lp(b, !1);
                if (e = /^\s*(\d{4})($|-(\d{2})($|-(\d{2})($|T(\d{2}):(\d{2}):(\d{2})(Z|(?:([+\-])(\d{2})(?::(\d{2}))?)))))\s*$/.exec(e)) {
                    var f = Date.UTC(parseInt(e[1], 10), m(e[3]) ? parseInt(e[3], 10) - 1 : 0, m(e[5]) ? parseInt(e[5], 10) : 1, m(e[7]) ? parseInt(e[7], 10) : 0, m(e[8]) ? parseInt(e[8], 10) : 0, m(e[9]) ? parseInt(e[9], 10) : 0);
                    if (m(e[10]) && "Z" != e[10]) {
                        var g = "-" == e[11] ? -1 : 1
                            , f = f + 60 * g * parseInt(e[12], 10);
                        m(e[13]) && (f += 3600 * g * parseInt(e[13], 10))
                    }
                    d.push(f)
                } else
                    d.push(0)
            }
        }, R(gs, {
            coord: function (b, c) {
                var d = c[c.length - 1].k
                    , e = Lp(b, !1);
                (e = /^\s*([+\-]?\d+(?:\.\d*)?(?:e[+\-]?\d*)?)\s+([+\-]?\d+(?:\.\d*)?(?:e[+\-]?\d*)?)\s+([+\-]?\d+(?:\.\d*)?(?:e[+\-]?\d*)?)\s*$/i.exec(e)) ? d.push(parseFloat(e[1]), parseFloat(e[2]), parseFloat(e[3]), 0) : d.push(0, 0, 0, 0)
            }
        }))
        , zs = R(hs, {
            coordinates: hq(rs)
        })
        , Os = R(hs, {
            href: Q(ss)
        }, R(gs, {
            x: Q(yq),
            y: Q(yq),
            w: Q(yq),
            h: Q(yq)
        }))
        , Ps = R(hs, {
            Icon: Q(function (b, c) {
                var d = U({}, Os, b, c);
                return m(d) ? d : null
            }),
            heading: Q(yq),
            hotSpot: Q(function (b) {
                var c = b.getAttribute("xunits")
                    , d = b.getAttribute("yunits");
                return {
                    x: parseFloat(b.getAttribute("x")),
                    Qe: ps[c],
                    y: parseFloat(b.getAttribute("y")),
                    Re: ps[d]
                }
            }),
            scale: Q(ts)
        })
        , Ms = R(hs, {
            LinearRing: hq(us)
        })
        , Qs = R(hs, {
            color: Q(qs),
            scale: Q(ts)
        })
        , Rs = R(hs, {
            color: Q(qs),
            width: Q(yq)
        })
        , Cs = R(hs, {
            LineString: gq(ys),
            LinearRing: gq(As),
            MultiGeometry: gq(Bs),
            Point: gq(Ds),
            Polygon: gq(Es)
        })
        , Ss = R(gs, {
            Track: gq(ws)
        })
        , Us = R(hs, {
            ExtendedData: Is,
            Link: function (b, c) {
                pq(Ts, b, c)
            },
            address: Q(X),
            description: Q(X),
            name: Q(X),
            open: Q(vq),
            phoneNumber: Q(X),
            visibility: Q(vq)
        })
        , Ts = R(hs, {
            href: Q(ss)
        })
        , Ns = R(hs, {
            LinearRing: hq(us)
        })
        , Vs = R(hs, {
            Style: Q(Gs),
            key: Q(X),
            styleUrl: Q(function (b) {
                var c = Aa(Lp(b, !1));
                return null != b.baseURI ? Yr(b.baseURI, c).toString() : c
            })
        })
        , Xs = R(hs, {
            ExtendedData: Is,
            MultiGeometry: Q(Bs, "geometry"),
            LineString: Q(ys, "geometry"),
            LinearRing: Q(As, "geometry"),
            Point: Q(Ds, "geometry"),
            Polygon: Q(Es, "geometry"),
            Style: Q(Gs),
            StyleMap: function (b, c) {
                var d = U(void 0, Ws, b, c);
                if (m(d)) {
                    var e = c[c.length - 1];
                    ga(d) ? e.Style = d : ia(d) && (e.styleUrl = d)
                }
            },
            address: Q(X),
            description: Q(X),
            name: Q(X),
            open: Q(vq),
            phoneNumber: Q(X),
            styleUrl: Q(ss),
            visibility: Q(vq)
        }, R(gs, {
            MultiTrack: Q(function (b, c) {
                var d = U([], Ss, b, c);
                if (m(d)) {
                    var e = new Km(null);
                    Mm(e, d);
                    return e
                }
            }, "geometry"),
            Track: Q(ws, "geometry")
        }))
        , Ys = R(hs, {
            color: Q(qs),
            fill: Q(vq),
            outline: Q(vq)
        })
        , Ls = R(hs, {
            SimpleData: function (b, c) {
                var d = b.getAttribute("name");
                if (null !== d) {
                    var e = X(b);
                    c[c.length - 1][d] = e
                }
            }
        })
        , Hs = R(hs, {
            IconStyle: function (b, c) {
                var d = U({}, Ps, b, c);
                if (m(d)) {
                    var e = c[c.length - 1], f = ub(d, "Icon", {}), g;
                    g = f.href;
                    g = m(g) ? g : "https://maps.google.com/mapfiles/kml/pushpin/ylw-pushpin.png";
                    var h, k, n, p = d.hotSpot;
                    m(p) ? (h = [p.x, p.y],
                        k = p.Qe,
                        n = p.Re) : "https://maps.google.com/mapfiles/kml/pushpin/ylw-pushpin.png" === g ? (h = ks,
                            n = k = "pixels") : /^http:\/\/maps\.(?:google|gstatic)\.com\//.test(g) && (h = [.5, 0],
                                n = k = "fraction");
                    var q, p = f.x, r = f.y;
                    m(p) && m(r) && (q = [p, r]);
                    var s, p = f.w, f = f.h;
                    m(p) && m(f) && (s = [p, f]);
                    var u, f = d.heading;
                    m(f) && (u = Xb(f));
                    d = d.scale;
                    "https://maps.google.com/mapfiles/kml/pushpin/ylw-pushpin.png" == g && (s = ls);
                    h = new oj({
                        anchor: h,
                        anchorOrigin: "bottom-left",
                        anchorXUnits: k,
                        anchorYUnits: n,
                        crossOrigin: "anonymous",
                        offset: q,
                        offsetOrigin: "bottom-left",
                        rotation: u,
                        scale: d,
                        size: s,
                        src: g
                    });
                    e.imageStyle = h
                }
            },
            LabelStyle: function (b, c) {
                var d = U({}, Qs, b, c);
                m(d) && (c[c.length - 1].textStyle = new ds({
                    fill: new jl({
                        color: ub(d, "color", is)
                    }),
                    scale: d.scale
                }))
            },
            LineStyle: function (b, c) {
                var d = U({}, Rs, b, c);
                m(d) && (c[c.length - 1].strokeStyle = new fl({
                    color: ub(d, "color", is),
                    width: ub(d, "width", 1)
                }))
            },
            PolyStyle: function (b, c) {
                var d = U({}, Ys, b, c);
                if (m(d)) {
                    var e = c[c.length - 1];
                    e.fillStyle = new jl({
                        color: ub(d, "color", is)
                    });
                    var f = d.fill;
                    m(f) && (e.fill = f);
                    d = d.outline;
                    m(d) && (e.outline = d)
                }
            }
        })
        , Ws = R(hs, {
            Pair: function (b, c) {
                var d = U({}, Vs, b, c);
                if (m(d)) {
                    var e = d.key;
                    m(e) && "normal" == e && (e = d.styleUrl,
                        m(e) && (c[c.length - 1] = e),
                        d = d.Style,
                        m(d) && (c[c.length - 1] = d))
                }
            }
        });
    l = es.prototype;
    l.Xf = function (b, c) {
        Pp(b);
        var d = R(hs, {
            Folder: fq(this.Xf, this),
            Placemark: gq(this.Ie, this),
            Style: ra(this.ll, this),
            StyleMap: ra(this.kl, this)
        })
            , d = U([], d, b, c, this);
        if (m(d))
            return d
    }
        ;
    l.Ie = function (b, c) {
        var d = U({
            geometry: null
        }, Xs, b, c);
        if (m(d)) {
            var e = new P
                , f = b.getAttribute("id");
            null === f || e.c(f);
            f = c[0];
            null != d.geometry && tp(d.geometry, !1, f);
            e.G(d);
            this.b && e.i(this.c);
            return e
        }
    }
        ;
    l.ll = function (b, c) {
        var d = b.getAttribute("id");
        if (null !== d) {
            var e = Gs(b, c);
            m(e) && (d = null != b.baseURI ? Yr(b.baseURI, "#" + d).toString() : "#" + d,
                this.d[d] = e)
        }
    }
        ;
    l.kl = function (b, c) {
        var d = b.getAttribute("id");
        if (null !== d) {
            var e = U(void 0, Ws, b, c);
            m(e) && (d = null != b.baseURI ? Yr(b.baseURI, "#" + d).toString() : "#" + d,
                this.d[d] = e)
        }
    }
        ;
    l.Yf = function (b, c) {
        if (!Va(hs, b.namespaceURI))
            return null;
        var d = this.Ie(b, [rp(this, b, c)]);
        return m(d) ? d : null
    }
        ;
    l.Ob = function (b, c) {
        if (!Va(hs, b.namespaceURI))
            return [];
        var d;
        d = Pp(b);
        if ("Document" == d || "Folder" == d)
            return d = this.Xf(b, [rp(this, b, c)]),
                m(d) ? d : [];
        if ("Placemark" == d)
            return d = this.Ie(b, [rp(this, b, c)]),
                m(d) ? [d] : [];
        if ("kml" == d) {
            d = [];
            var e;
            for (e = b.firstElementChild; null !== e; e = e.nextElementSibling) {
                var f = this.Ob(e, c);
                m(f) && Za(d, f)
            }
            return d
        }
        return []
    }
        ;
    l.fl = function (b) {
        if (Sp(b))
            return Zs(this, b);
        if (Vp(b))
            return $s(this, b);
        if (ia(b))
            return b = eq(b),
                Zs(this, b)
    }
        ;
    function Zs(b, c) {
        var d;
        for (d = c.firstChild; null !== d; d = d.nextSibling)
            if (1 == d.nodeType) {
                var e = $s(b, d);
                if (m(e))
                    return e
            }
    }
    function $s(b, c) {
        var d;
        for (d = c.firstElementChild; null !== d; d = d.nextElementSibling)
            if (Va(hs, d.namespaceURI) && "name" == d.localName)
                return X(d);
        for (d = c.firstElementChild; null !== d; d = d.nextElementSibling) {
            var e = Pp(d);
            if (Va(hs, d.namespaceURI) && ("Document" == e || "Folder" == e || "Placemark" == e || "kml" == e) && (e = $s(b, d),
                m(e)))
                return e
        }
    }
    l.gl = function (b) {
        var c = [];
        Sp(b) ? Za(c, at(this, b)) : Vp(b) ? Za(c, bt(this, b)) : ia(b) && (b = eq(b),
            Za(c, at(this, b)));
        return c
    }
        ;
    function at(b, c) {
        var d, e = [];
        for (d = c.firstChild; null !== d; d = d.nextSibling)
            1 == d.nodeType && Za(e, bt(b, d));
        return e
    }
    function bt(b, c) {
        var d, e = [];
        for (d = c.firstElementChild; null !== d; d = d.nextElementSibling)
            if (Va(hs, d.namespaceURI) && "NetworkLink" == d.localName) {
                var f = U({}, Us, d, []);
                e.push(f)
            }
        for (d = c.firstElementChild; null !== d; d = d.nextElementSibling)
            f = Pp(d),
                !Va(hs, d.namespaceURI) || "Document" != f && "Folder" != f && "kml" != f || Za(e, bt(b, d));
        return e
    }
    function ct(b, c) {
        var d = qg(c), d = [255 * (4 == d.length ? d[3] : 1), d[2], d[1], d[0]], e;
        for (e = 0; 4 > e; ++e) {
            var f = parseInt(d[e], 10).toString(16);
            d[e] = 1 == f.length ? "0" + f : f
        }
        Dq(b, d.join(""))
    }
    function dt(b, c, d) {
        qq({
            node: b
        }, et, ft, [c], d)
    }
    function gt(b, c, d) {
        var e = {
            node: b
        };
        null != c.X && b.setAttribute("id", c.X);
        b = c.L();
        var f = c.a;
        m(f) && (f = f.call(c, 0),
            null !== f && 0 < f.length && (b.Style = f[0],
                f = f[0].d,
                null === f || (b.name = f.b)));
        f = ht[d[d.length - 1].node.namespaceURI];
        b = oq(b, f);
        qq(e, it, nq, b, d, f);
        b = d[0];
        c = c.N();
        null != c && (c = tp(c, !0, b));
        qq(e, it, jt, [c], d)
    }
    function kt(b, c, d) {
        var e = c.k;
        b = {
            node: b
        };
        b.layout = c.a;
        b.stride = c.t;
        qq(b, lt, mt, [e], d)
    }
    function nt(b, c, d) {
        c = c.fd();
        var e = c.shift();
        b = {
            node: b
        };
        qq(b, ot, pt, c, d);
        qq(b, ot, qt, [e], d)
    }
    function rt(b, c) {
        Eq(b, c * c)
    }
    var st = jq(hs, ["Document", "Placemark"])
        , vt = jq(hs, {
            Document: S(function (b, c, d) {
                qq({
                    node: b
                }, tt, ut, c, d)
            }),
            Placemark: S(gt)
        })
        , tt = jq(hs, {
            Placemark: S(gt)
        })
        , wt = {
            Point: "Point",
            LineString: "LineString",
            LinearRing: "LinearRing",
            Polygon: "Polygon",
            MultiPoint: "MultiGeometry",
            MultiLineString: "MultiGeometry",
            MultiPolygon: "MultiGeometry"
        }
        , xt = jq(hs, ["href"], jq(gs, ["x", "y", "w", "h"]))
        , yt = jq(hs, {
            href: S(Dq)
        }, jq(gs, {
            x: S(Eq),
            y: S(Eq),
            w: S(Eq),
            h: S(Eq)
        }))
        , zt = jq(hs, ["scale", "heading", "Icon", "hotSpot"])
        , Bt = jq(hs, {
            Icon: S(function (b, c, d) {
                b = {
                    node: b
                };
                var e = xt[d[d.length - 1].node.namespaceURI]
                    , f = oq(c, e);
                qq(b, yt, nq, f, d, e);
                e = xt[gs[0]];
                f = oq(c, e);
                qq(b, yt, At, f, d, e)
            }),
            heading: S(Eq),
            hotSpot: S(function (b, c) {
                b.setAttribute("x", c.x);
                b.setAttribute("y", c.y);
                b.setAttribute("xunits", c.Qe);
                b.setAttribute("yunits", c.Re)
            }),
            scale: S(rt)
        })
        , Ct = jq(hs, ["color", "scale"])
        , Dt = jq(hs, {
            color: S(ct),
            scale: S(rt)
        })
        , Et = jq(hs, ["color", "width"])
        , Ft = jq(hs, {
            color: S(ct),
            width: S(Eq)
        })
        , et = jq(hs, {
            LinearRing: S(kt)
        })
        , Gt = jq(hs, {
            LineString: S(kt),
            Point: S(kt),
            Polygon: S(nt)
        })
        , ht = jq(hs, "name open visibility address phoneNumber description styleUrl Style".split(" "))
        , it = jq(hs, {
            MultiGeometry: S(function (b, c, d) {
                b = {
                    node: b
                };
                var e = c.I(), f, g;
                "MultiPoint" == e ? (f = c.zd(),
                    g = Ht) : "MultiLineString" == e ? (f = c.Gc(),
                        g = It) : "MultiPolygon" == e && (f = c.jd(),
                            g = Jt);
                qq(b, Gt, g, f, d)
            }),
            LineString: S(kt),
            LinearRing: S(kt),
            Point: S(kt),
            Polygon: S(nt),
            Style: S(function (b, c, d) {
                b = {
                    node: b
                };
                var e = {}
                    , f = c.f
                    , g = c.b
                    , h = c.e;
                c = c.d;
                null === h || (e.IconStyle = h);
                null === c || (e.LabelStyle = c);
                null === g || (e.LineStyle = g);
                null === f || (e.PolyStyle = f);
                c = Kt[d[d.length - 1].node.namespaceURI];
                e = oq(e, c);
                qq(b, Lt, nq, e, d, c)
            }),
            address: S(Dq),
            description: S(Dq),
            name: S(Dq),
            open: S(Cq),
            phoneNumber: S(Dq),
            styleUrl: S(Dq),
            visibility: S(Cq)
        })
        , lt = jq(hs, {
            coordinates: S(function (b, c, d) {
                d = d[d.length - 1];
                var e = d.layout;
                d = d.stride;
                var f;
                "XY" == e || "XYM" == e ? f = 2 : ("XYZ" == e || "XYZM" == e) && (f = 3);
                var g, h = c.length, k = "";
                if (0 < h) {
                    k += c[0];
                    for (e = 1; e < f; ++e)
                        k += "," + c[e];
                    for (g = d; g < h; g += d)
                        for (k += " " + c[g],
                            e = 1; e < f; ++e)
                            k += "," + c[g + e]
                }
                Dq(b, k)
            })
        })
        , ot = jq(hs, {
            outerBoundaryIs: S(dt),
            innerBoundaryIs: S(dt)
        })
        , Mt = jq(hs, {
            color: S(ct)
        })
        , Kt = jq(hs, ["IconStyle", "LabelStyle", "LineStyle", "PolyStyle"])
        , Lt = jq(hs, {
            IconStyle: S(function (b, c, d) {
                b = {
                    node: b
                };
                var e = {}
                    , f = c.cb()
                    , g = c.ed()
                    , h = {
                        href: c.a.e
                    };
                if (null !== f) {
                    h.w = f[0];
                    h.h = f[1];
                    var k = c.ub()
                        , n = c.Ab();
                    null !== n && null !== g && 0 !== n[0] && n[1] !== f[1] && (h.x = n[0],
                        h.y = g[1] - (n[1] + f[1]));
                    null === k || 0 === k[0] || k[1] === f[1] || (e.hotSpot = {
                        x: k[0],
                        Qe: "pixels",
                        y: f[1] - k[1],
                        Re: "pixels"
                    })
                }
                e.Icon = h;
                f = c.n;
                1 !== f && (e.scale = f);
                c = c.i;
                0 !== c && (e.heading = c);
                c = zt[d[d.length - 1].node.namespaceURI];
                e = oq(e, c);
                qq(b, Bt, nq, e, d, c)
            }),
            LabelStyle: S(function (b, c, d) {
                b = {
                    node: b
                };
                var e = {}
                    , f = c.a;
                null === f || (e.color = f.a);
                c = c.d;
                m(c) && 1 !== c && (e.scale = c);
                c = Ct[d[d.length - 1].node.namespaceURI];
                e = oq(e, c);
                qq(b, Dt, nq, e, d, c)
            }),
            LineStyle: S(function (b, c, d) {
                b = {
                    node: b
                };
                var e = Et[d[d.length - 1].node.namespaceURI];
                c = oq({
                    color: c.a,
                    width: c.d
                }, e);
                qq(b, Ft, nq, c, d, e)
            }),
            PolyStyle: S(function (b, c, d) {
                qq({
                    node: b
                }, Mt, Nt, [c.a], d)
            })
        });
    function At(b, c, d) {
        return Kp(gs[0], "gx:" + d)
    }
    function ut(b, c) {
        return Kp(c[c.length - 1].node.namespaceURI, "Placemark")
    }
    function jt(b, c) {
        if (null != b)
            return Kp(c[c.length - 1].node.namespaceURI, wt[b.I()])
    }
    var Nt = lq("color")
        , mt = lq("coordinates")
        , pt = lq("innerBoundaryIs")
        , Ht = lq("Point")
        , It = lq("LineString")
        , ft = lq("LinearRing")
        , Jt = lq("Polygon")
        , qt = lq("outerBoundaryIs");
    es.prototype.a = function (b, c) {
        c = sp(this, c);
        var d = Kp(hs[4], "kml");
        dq(d, "http://www.w3.org/2000/xmlns/", "xmlns:gx", gs[0]);
        dq(d, "http://www.w3.org/2000/xmlns/", "xmlns:xsi", "http://www.w3.org/2001/XMLSchema-instance");
        dq(d, "http://www.w3.org/2001/XMLSchema-instance", "xsi:schemaLocation", "http://www.opengis.net/kml/2.2 https://developers.google.com/kml/schema/kml22gx.xsd");
        var e = {
            node: d
        }
            , f = {};
        1 < b.length ? f.Document = b : 1 == b.length && (f.Placemark = b[0]);
        var g = st[d.namespaceURI]
            , f = oq(f, g);
        qq(e, vt, nq, f, [c], g);
        return d
    }
        ;
    function Ot() {
        this.defaultDataProjection = null;
        this.defaultDataProjection = Be("EPSG:4326")
    }
    v(Ot, rq);
    function Pt(b, c) {
        c[c.length - 1].Pc[b.getAttribute("k")] = b.getAttribute("v")
    }
    var Qt = [null]
        , Rt = R(Qt, {
            nd: function (b, c) {
                c[c.length - 1].pc.push(b.getAttribute("ref"))
            },
            tag: Pt
        })
        , Tt = R(Qt, {
            node: function (b, c) {
                var d = c[0]
                    , e = c[c.length - 1]
                    , f = b.getAttribute("id")
                    , g = [parseFloat(b.getAttribute("lon")), parseFloat(b.getAttribute("lat"))];
                e.xf[f] = g;
                var h = U({
                    Pc: {}
                }, St, b, c);
                rb(h.Pc) || (g = new Ek(g),
                    tp(g, !1, d),
                    d = new P(g),
                    d.c(f),
                    d.G(h.Pc),
                    e.features.push(d))
            },
            way: function (b, c) {
                for (var d = c[0], e = b.getAttribute("id"), f = U({
                    pc: [],
                    Pc: {}
                }, Rt, b, c), g = c[c.length - 1], h = [], k = 0, n = f.pc.length; k < n; k++)
                    Za(h, g.xf[f.pc[k]]);
                f.pc[0] == f.pc[f.pc.length - 1] ? (k = new G(null),
                    Qk(k, "XY", h, [h.length])) : (k = new L(null),
                        Jm(k, "XY", h));
                tp(k, !1, d);
                d = new P(k);
                d.c(e);
                d.G(f.Pc);
                g.features.push(d)
            }
        })
        , St = R(Qt, {
            tag: Pt
        });
    Ot.prototype.Ob = function (b, c) {
        var d = rp(this, b, c);
        return "osm" == b.localName && (d = U({
            xf: {},
            features: []
        }, Tt, b, [d]),
            m(d.features)) ? d.features : []
    }
        ;
    function Ut(b) {
        return b.getAttributeNS("http://www.w3.org/1999/xlink", "href")
    }
    ; function Vt() { }
    Vt.prototype.b = function (b) {
        return Sp(b) ? this.d(b) : Vp(b) ? this.a(b) : ia(b) ? (b = eq(b),
            this.d(b)) : null
    }
        ;
    function Wt() { }
    v(Wt, Vt);
    Wt.prototype.d = function (b) {
        for (b = b.firstChild; null !== b; b = b.nextSibling)
            if (1 == b.nodeType)
                return this.a(b);
        return null
    }
        ;
    Wt.prototype.a = function (b) {
        b = U({}, Xt, b, []);
        return m(b) ? b : null
    }
        ;
    var Yt = [null, "http://www.opengis.net/ows/1.1"]
        , Xt = R(Yt, {
            ServiceIdentification: Q(function (b, c) {
                return U({}, Zt, b, c)
            }),
            ServiceProvider: Q(function (b, c) {
                return U({}, $t, b, c)
            }),
            OperationsMetadata: Q(function (b, c) {
                return U({}, au, b, c)
            })
        })
        , bu = R(Yt, {
            DeliveryPoint: Q(X),
            City: Q(X),
            AdministrativeArea: Q(X),
            PostalCode: Q(X),
            Country: Q(X),
            ElectronicMailAddress: Q(X)
        })
        , cu = R(Yt, {
            Value: iq(function (b) {
                return X(b)
            })
        })
        , du = R(Yt, {
            AllowedValues: Q(function (b, c) {
                return U({}, cu, b, c)
            })
        })
        , fu = R(Yt, {
            Phone: Q(function (b, c) {
                return U({}, eu, b, c)
            }),
            Address: Q(function (b, c) {
                return U({}, bu, b, c)
            })
        })
        , hu = R(Yt, {
            HTTP: Q(function (b, c) {
                return U({}, gu, b, c)
            })
        })
        , gu = R(Yt, {
            Get: iq(function (b, c) {
                var d = Ut(b);
                return m(d) ? U({
                    href: d
                }, iu, b, c) : void 0
            }),
            Post: void 0
        })
        , ju = R(Yt, {
            DCP: Q(function (b, c) {
                return U({}, hu, b, c)
            })
        })
        , au = R(Yt, {
            Operation: function (b, c) {
                var d = b.getAttribute("name")
                    , e = U({}, ju, b, c);
                m(e) && (c[c.length - 1][d] = e)
            }
        })
        , eu = R(Yt, {
            Voice: Q(X),
            Facsimile: Q(X)
        })
        , iu = R(Yt, {
            Constraint: iq(function (b, c) {
                var d = b.getAttribute("name");
                return m(d) ? U({
                    name: d
                }, du, b, c) : void 0
            })
        })
        , ku = R(Yt, {
            IndividualName: Q(X),
            PositionName: Q(X),
            ContactInfo: Q(function (b, c) {
                return U({}, fu, b, c)
            })
        })
        , Zt = R(Yt, {
            Title: Q(X),
            ServiceTypeVersion: Q(X),
            ServiceType: Q(X)
        })
        , $t = R(Yt, {
            ProviderName: Q(X),
            ProviderSite: Q(Ut),
            ServiceContact: Q(function (b, c) {
                return U({}, ku, b, c)
            })
        });
    function lu(b, c, d, e) {
        var f;
        m(e) ? f = m(void 0) ? void 0 : 0 : (e = [],
            f = 0);
        var g, h;
        for (g = 0; g < c;)
            for (h = b[g++],
                e[f++] = b[g++],
                e[f++] = h,
                h = 2; h < d; ++h)
                e[f++] = b[g++];
        e.length = f
    }
    ; function mu(b) {
        b = m(b) ? b : {};
        this.defaultDataProjection = null;
        this.defaultDataProjection = Be("EPSG:4326");
        this.a = m(b.factor) ? b.factor : 1E5
    }
    v(mu, yr);
    function nu(b, c, d) {
        d = m(d) ? d : 1E5;
        var e, f = Array(c);
        for (e = 0; e < c; ++e)
            f[e] = 0;
        var g, h;
        g = 0;
        for (h = b.length; g < h;)
            for (e = 0; e < c; ++e,
                ++g) {
                var k = b[g]
                    , n = k - f[e];
                f[e] = k;
                b[g] = n
            }
        return ou(b, d)
    }
    function pu(b, c, d) {
        var e = m(d) ? d : 1E5
            , f = Array(c);
        for (d = 0; d < c; ++d)
            f[d] = 0;
        b = qu(b, e);
        var g, e = 0;
        for (g = b.length; e < g;)
            for (d = 0; d < c; ++d,
                ++e)
                f[d] += b[e],
                    b[e] = f[d];
        return b
    }
    function ou(b, c) {
        var d = m(c) ? c : 1E5, e, f;
        e = 0;
        for (f = b.length; e < f; ++e)
            b[e] = Math.round(b[e] * d);
        d = 0;
        for (e = b.length; d < e; ++d)
            f = b[d],
                b[d] = 0 > f ? ~(f << 1) : f << 1;
        d = "";
        e = 0;
        for (f = b.length; e < f; ++e) {
            for (var g = b[e], h = void 0, k = ""; 32 <= g;)
                h = (32 | g & 31) + 63,
                    k += String.fromCharCode(h),
                    g >>= 5;
            h = g + 63;
            k += String.fromCharCode(h);
            d += k
        }
        return d
    }
    function qu(b, c) {
        var d = m(c) ? c : 1E5, e = [], f = 0, g = 0, h, k;
        h = 0;
        for (k = b.length; h < k; ++h) {
            var n = b.charCodeAt(h) - 63
                , f = f | (n & 31) << g;
            32 > n ? (e.push(f),
                g = f = 0) : g += 5
        }
        f = 0;
        for (g = e.length; f < g; ++f)
            h = e[f],
                e[f] = h & 1 ? ~(h >> 1) : h >> 1;
        f = 0;
        for (g = e.length; f < g; ++f)
            e[f] /= d;
        return e
    }
    l = mu.prototype;
    l.Kc = function (b, c) {
        var d = this.Mc(b, c);
        return new P(d)
    }
        ;
    l.Ge = function (b, c) {
        return [this.Kc(b, c)]
    }
        ;
    l.Mc = function (b, c) {
        var d = pu(b, 2, this.a);
        lu(d, d.length, 2, d);
        d = yk(d, 0, d.length, 2);
        return tp(new L(d), !1, sp(this, c))
    }
        ;
    l.Xd = function (b, c) {
        var d = b.N();
        return null != d ? this.Sc(d, c) : ""
    }
        ;
    l.rg = function (b, c) {
        return this.Xd(b[0], c)
    }
        ;
    l.Sc = function (b, c) {
        b = tp(b, !0, sp(this, c));
        var d = b.k
            , e = b.t;
        lu(d, d.length, e, d);
        return nu(d, e, this.a)
    }
        ;
    function ru(b) {
        b = m(b) ? b : {};
        this.defaultDataProjection = null;
        this.defaultDataProjection = Be(null != b.defaultDataProjection ? b.defaultDataProjection : "EPSG:4326")
    }
    v(ru, wp);
    function su(b, c) {
        var d = [], e, f, g, h;
        g = 0;
        for (h = b.length; g < h; ++g)
            e = b[g],
                0 < g && d.pop(),
                0 <= e ? f = c[e] : f = c[~e].slice().reverse(),
                d.push.apply(d, f);
        e = 0;
        for (f = d.length; e < f; ++e)
            d[e] = d[e].slice();
        return d
    }
    function tu(b, c, d, e, f) {
        b = b.geometries;
        var g = [], h, k;
        h = 0;
        for (k = b.length; h < k; ++h)
            g[h] = uu(b[h], c, d, e, f);
        return g
    }
    function uu(b, c, d, e, f) {
        var g = b.type
            , h = vu[g];
        c = "Point" === g || "MultiPoint" === g ? h(b, d, e) : h(b, c);
        d = new P;
        d.Pa(tp(c, !1, f));
        m(b.id) && d.c(b.id);
        m(b.properties) && d.G(b.properties);
        return d
    }
    ru.prototype.b = function (b, c) {
        if ("Topology" == b.type) {
            var d, e = null, f = null;
            m(b.transform) && (d = b.transform,
                e = d.scale,
                f = d.translate);
            var g = b.arcs;
            if (m(d)) {
                d = e;
                var h = f, k, n;
                k = 0;
                for (n = g.length; k < n; ++k)
                    for (var p = g[k], q = d, r = h, s = 0, u = 0, y = void 0, A = void 0, z = void 0, A = 0, z = p.length; A < z; ++A)
                        y = p[A],
                            s += y[0],
                            u += y[1],
                            y[0] = s,
                            y[1] = u,
                            wu(y, q, r)
            }
            d = [];
            h = mb(b.objects);
            k = 0;
            for (n = h.length; k < n; ++k)
                "GeometryCollection" === h[k].type ? (p = h[k],
                    d.push.apply(d, tu(p, g, e, f, c))) : (p = h[k],
                        d.push(uu(p, g, e, f, c)));
            return d
        }
        return []
    }
        ;
    function wu(b, c, d) {
        b[0] = b[0] * c[0] + d[0];
        b[1] = b[1] * c[1] + d[1]
    }
    ru.prototype.Ha = function () {
        return this.defaultDataProjection
    }
        ;
    var vu = {
        Point: function (b, c, d) {
            b = b.coordinates;
            null === c || null === d || wu(b, c, d);
            return new Ek(b)
        },
        LineString: function (b, c) {
            var d = su(b.arcs, c);
            return new L(d)
        },
        Polygon: function (b, c) {
            var d = [], e, f;
            e = 0;
            for (f = b.arcs.length; e < f; ++e)
                d[e] = su(b.arcs[e], c);
            return new G(d)
        },
        MultiPoint: function (b, c, d) {
            b = b.coordinates;
            var e, f;
            if (null !== c && null !== d)
                for (e = 0,
                    f = b.length; e < f; ++e)
                    wu(b[e], c, d);
            return new Nm(b)
        },
        MultiLineString: function (b, c) {
            var d = [], e, f;
            e = 0;
            for (f = b.arcs.length; e < f; ++e)
                d[e] = su(b.arcs[e], c);
            return new Km(d)
        },
        MultiPolygon: function (b, c) {
            var d = [], e, f, g, h, k, n;
            k = 0;
            for (n = b.arcs.length; k < n; ++k) {
                e = b.arcs[k];
                f = [];
                g = 0;
                for (h = e.length; g < h; ++g)
                    f[g] = su(e[g], c);
                d[k] = f
            }
            return new Om(d)
        }
    };
    function xu(b) {
        b = m(b) ? b : {};
        this.f = b.featureType;
        this.b = b.featureNS;
        this.d = m(b.gmlFormat) ? b.gmlFormat : new Y;
        this.c = m(b.schemaLocation) ? b.schemaLocation : "http://www.opengis.net/wfs http://schemas.opengis.net/wfs/1.1.0/wfs.xsd";
        this.defaultDataProjection = null
    }
    v(xu, rq);
    xu.prototype.Ob = function (b, c) {
        var d = {
            featureType: this.f,
            featureNS: this.b
        };
        yb(d, rp(this, b, m(c) ? c : {}));
        d = [d];
        this.d.d["http://www.opengis.net/gml"].featureMember = gq(uq.prototype.Md);
        d = U([], this.d.d, b, d, this.d);
        m(d) || (d = []);
        return d
    }
        ;
    xu.prototype.g = function (b) {
        if (Sp(b))
            return yu(b);
        if (Vp(b))
            return U({}, zu, b, []);
        if (ia(b))
            return b = eq(b),
                yu(b)
    }
        ;
    xu.prototype.e = function (b) {
        if (Sp(b))
            return Au(this, b);
        if (Vp(b))
            return Bu(this, b);
        if (ia(b))
            return b = eq(b),
                Au(this, b)
    }
        ;
    function Au(b, c) {
        for (var d = c.firstChild; null !== d; d = d.nextSibling)
            if (1 == d.nodeType)
                return Bu(b, d)
    }
    var Cu = {
        "http://www.opengis.net/gml": {
            boundedBy: Q(uq.prototype.Od, "bounds")
        }
    };
    function Bu(b, c) {
        var d = {}
            , e = Bq(c.getAttribute("numberOfFeatures"));
        d.numberOfFeatures = e;
        return U(d, Cu, c, [], b.d)
    }
    var Du = {
        "http://www.opengis.net/wfs": {
            totalInserted: Q(Aq),
            totalUpdated: Q(Aq),
            totalDeleted: Q(Aq)
        }
    }
        , Eu = {
            "http://www.opengis.net/ogc": {
                FeatureId: gq(function (b) {
                    return b.getAttribute("fid")
                })
            }
        }
        , Fu = {
            "http://www.opengis.net/wfs": {
                Feature: function (b, c) {
                    pq(Eu, b, c)
                }
            }
        }
        , zu = {
            "http://www.opengis.net/wfs": {
                TransactionSummary: Q(function (b, c) {
                    return U({}, Du, b, c)
                }, "transactionSummary"),
                InsertResults: Q(function (b, c) {
                    return U([], Fu, b, c)
                }, "insertIds")
            }
        };
    function yu(b) {
        for (b = b.firstChild; null !== b; b = b.nextSibling)
            if (1 == b.nodeType)
                return U({}, zu, b, [])
    }
    var Gu = {
        "http://www.opengis.net/wfs": {
            PropertyName: S(Dq)
        }
    };
    function Hu(b, c) {
        var d = Kp("http://www.opengis.net/ogc", "Filter")
            , e = Kp("http://www.opengis.net/ogc", "FeatureId");
        d.appendChild(e);
        e.setAttribute("fid", c);
        b.appendChild(d)
    }
    var Iu = {
        "http://www.opengis.net/wfs": {
            Insert: S(function (b, c, d) {
                var e = d[d.length - 1]
                    , e = Kp(e.featureNS, e.featureType);
                b.appendChild(e);
                Y.prototype.qg(e, c, d)
            }),
            Update: S(function (b, c, d) {
                var e = d[d.length - 1]
                    , f = e.featureType
                    , g = e.featurePrefix
                    , g = m(g) ? g : "feature"
                    , h = e.featureNS;
                b.setAttribute("typeName", g + ":" + f);
                dq(b, "http://www.w3.org/2000/xmlns/", "xmlns:" + g, h);
                f = c.X;
                if (m(f)) {
                    for (var g = c.J(), h = [], k = 0, n = g.length; k < n; k++) {
                        var p = c.get(g[k]);
                        m(p) && h.push({
                            name: g[k],
                            value: p
                        })
                    }
                    qq({
                        node: b,
                        srsName: e.srsName
                    }, Iu, lq("Property"), h, d);
                    Hu(b, f)
                }
            }),
            Delete: S(function (b, c, d) {
                var e = d[d.length - 1];
                d = e.featureType;
                var f = e.featurePrefix
                    , f = m(f) ? f : "feature"
                    , e = e.featureNS;
                b.setAttribute("typeName", f + ":" + d);
                dq(b, "http://www.w3.org/2000/xmlns/", "xmlns:" + f, e);
                c = c.X;
                m(c) && Hu(b, c)
            }),
            Property: S(function (b, c, d) {
                var e = Kp("http://www.opengis.net/wfs", "Name");
                b.appendChild(e);
                Dq(e, c.name);
                null != c.value && (e = Kp("http://www.opengis.net/wfs", "Value"),
                    b.appendChild(e),
                    c.value instanceof gk ? Y.prototype.Yd(e, c.value, d) : Dq(e, c.value))
            }),
            Native: S(function (b, c) {
                m(c.Tl) && b.setAttribute("vendorId", c.Tl);
                m(c.vl) && b.setAttribute("safeToIgnore", c.vl);
                m(c.value) && Dq(b, c.value)
            })
        }
    }
        , Ju = {
            "http://www.opengis.net/wfs": {
                Query: S(function (b, c, d) {
                    var e = d[d.length - 1]
                        , f = e.featurePrefix
                        , g = e.featureNS
                        , h = e.propertyNames
                        , k = e.srsName;
                    b.setAttribute("typeName", (m(f) ? f + ":" : "") + c);
                    m(k) && b.setAttribute("srsName", k);
                    m(g) && dq(b, "http://www.w3.org/2000/xmlns/", "xmlns:" + f, g);
                    c = wb(e);
                    c.node = b;
                    qq(c, Gu, lq("PropertyName"), h, d);
                    e = e.bbox;
                    m(e) && (h = Kp("http://www.opengis.net/ogc", "Filter"),
                        c = d[d.length - 1].geometryName,
                        f = Kp("http://www.opengis.net/ogc", "BBOX"),
                        h.appendChild(f),
                        g = Kp("http://www.opengis.net/ogc", "PropertyName"),
                        Dq(g, c),
                        f.appendChild(g),
                        Y.prototype.Yd(f, e, d),
                        b.appendChild(h))
                })
            }
        };
    xu.prototype.j = function (b) {
        var c = Kp("http://www.opengis.net/wfs", "GetFeature");
        c.setAttribute("service", "WFS");
        c.setAttribute("version", "1.1.0");
        m(b) && (m(b.handle) && c.setAttribute("handle", b.handle),
            m(b.outputFormat) && c.setAttribute("outputFormat", b.outputFormat),
            m(b.maxFeatures) && c.setAttribute("maxFeatures", b.maxFeatures),
            m(b.resultType) && c.setAttribute("resultType", b.resultType),
            m(b.Ml) && c.setAttribute("startIndex", b.Ml),
            m(b.count) && c.setAttribute("count", b.count));
        dq(c, "http://www.w3.org/2001/XMLSchema-instance", "xsi:schemaLocation", this.c);
        var d = b.featureTypes;
        b = [{
            node: c,
            srsName: b.srsName,
            featureNS: m(b.featureNS) ? b.featureNS : this.b,
            featurePrefix: b.featurePrefix,
            geometryName: b.geometryName,
            bbox: b.bbox,
            Vf: m(b.Vf) ? b.Vf : []
        }];
        var e = wb(b[b.length - 1]);
        e.node = c;
        qq(e, Ju, lq("Query"), d, b);
        return c
    }
        ;
    xu.prototype.l = function (b, c, d, e) {
        var f = []
            , g = Kp("http://www.opengis.net/wfs", "Transaction");
        g.setAttribute("service", "WFS");
        g.setAttribute("version", "1.1.0");
        var h, k;
        m(e) && (h = m(e.gmlOptions) ? e.gmlOptions : {},
            m(e.handle) && g.setAttribute("handle", e.handle));
        dq(g, "http://www.w3.org/2001/XMLSchema-instance", "xsi:schemaLocation", this.c);
        null != b && (k = {
            node: g,
            featureNS: e.featureNS,
            featureType: e.featureType,
            featurePrefix: e.featurePrefix
        },
            yb(k, h),
            qq(k, Iu, lq("Insert"), b, f));
        null != c && (k = {
            node: g,
            featureNS: e.featureNS,
            featureType: e.featureType,
            featurePrefix: e.featurePrefix
        },
            yb(k, h),
            qq(k, Iu, lq("Update"), c, f));
        null != d && qq({
            node: g,
            featureNS: e.featureNS,
            featureType: e.featureType,
            featurePrefix: e.featurePrefix
        }, Iu, lq("Delete"), d, f);
        m(e.nativeElements) && qq({
            node: g,
            featureNS: e.featureNS,
            featureType: e.featureType,
            featurePrefix: e.featurePrefix
        }, Iu, lq("Native"), e.nativeElements, f);
        return g
    }
        ;
    xu.prototype.Je = function (b) {
        for (b = b.firstChild; null !== b; b = b.nextSibling)
            if (1 == b.nodeType)
                return this.Rd(b);
        return null
    }
        ;
    xu.prototype.Rd = function (b) {
        if (null != b.firstElementChild && null != b.firstElementChild.firstElementChild)
            for (b = b.firstElementChild.firstElementChild,
                b = b.firstElementChild; null !== b; b = b.nextElementSibling)
                if (0 !== b.childNodes.length && (1 !== b.childNodes.length || 3 !== b.firstChild.nodeType)) {
                    var c = [{}];
                    this.d.Od(b, c);
                    return Be(c.pop().srsName)
                }
        return null
    }
        ;
    function Ku(b) {
        b = m(b) ? b : {};
        this.defaultDataProjection = null;
        this.a = m(b.splitCollection) ? b.splitCollection : !1
    }
    v(Ku, yr);
    function Lu(b) {
        b = b.K();
        return 0 == b.length ? "" : b[0] + " " + b[1]
    }
    function Mu(b) {
        b = b.K();
        for (var c = [], d = 0, e = b.length; d < e; ++d)
            c.push(b[d][0] + " " + b[d][1]);
        return c.join(",")
    }
    function Nu(b) {
        var c = [];
        b = b.fd();
        for (var d = 0, e = b.length; d < e; ++d)
            c.push("(" + Mu(b[d]) + ")");
        return c.join(",")
    }
    function Ou(b) {
        var c = b.I();
        b = (0,
            Pu[c])(b);
        c = c.toUpperCase();
        return 0 === b.length ? c + " EMPTY" : c + "(" + b + ")"
    }
    var Pu = {
        Point: Lu,
        LineString: Mu,
        Polygon: Nu,
        MultiPoint: function (b) {
            var c = [];
            b = b.zd();
            for (var d = 0, e = b.length; d < e; ++d)
                c.push("(" + Lu(b[d]) + ")");
            return c.join(",")
        },
        MultiLineString: function (b) {
            var c = [];
            b = b.Gc();
            for (var d = 0, e = b.length; d < e; ++d)
                c.push("(" + Mu(b[d]) + ")");
            return c.join(",")
        },
        MultiPolygon: function (b) {
            var c = [];
            b = b.jd();
            for (var d = 0, e = b.length; d < e; ++d)
                c.push("(" + Nu(b[d]) + ")");
            return c.join(",")
        },
        GeometryCollection: function (b) {
            var c = [];
            b = b.hf();
            for (var d = 0, e = b.length; d < e; ++d)
                c.push(Ou(b[d]));
            return c.join(",")
        }
    };
    l = Ku.prototype;
    l.Kc = function (b, c) {
        var d = this.Mc(b, c);
        if (m(d)) {
            var e = new P;
            e.Pa(d);
            return e
        }
        return null
    }
        ;
    l.Ge = function (b, c) {
        var d = []
            , e = this.Mc(b, c);
        this.a && "GeometryCollection" == e.I() ? d = e.c : d = [e];
        for (var f = [], g = 0, h = d.length; g < h; ++g)
            e = new P,
                e.Pa(d[g]),
                f.push(e);
        return f
    }
        ;
    l.Mc = function (b, c) {
        var d;
        d = new Qu(new Ru(b));
        d.a = Su(d.d);
        d = Tu(d);
        return m(d) ? tp(d, !1, c) : null
    }
        ;
    l.Xd = function (b, c) {
        var d = b.N();
        return m(d) ? this.Sc(d, c) : ""
    }
        ;
    l.rg = function (b, c) {
        if (1 == b.length)
            return this.Xd(b[0], c);
        for (var d = [], e = 0, f = b.length; e < f; ++e)
            d.push(b[e].N());
        d = new Cm(d);
        return this.Sc(d, c)
    }
        ;
    l.Sc = function (b, c) {
        return Ou(tp(b, !0, c))
    }
        ;
    function Ru(b) {
        this.d = b;
        this.a = -1
    }
    function Uu(b, c) {
        var d = m(c) ? c : !1;
        return "0" <= b && "9" >= b || "." == b && !d
    }
    function Su(b) {
        var c = b.d.charAt(++b.a)
            , d = {
                position: b.a,
                value: c
            };
        if ("(" == c)
            d.type = 2;
        else if ("," == c)
            d.type = 5;
        else if (")" == c)
            d.type = 3;
        else if (Uu(c) || "-" == c) {
            d.type = 4;
            var e, c = b.a, f = !1;
            do
                "." == e && (f = !0),
                    e = b.d.charAt(++b.a);
            while (Uu(e, f));
            b = parseFloat(b.d.substring(c, b.a--));
            d.value = b
        } else if ("a" <= c && "z" >= c || "A" <= c && "Z" >= c) {
            d.type = 1;
            c = b.a;
            do
                e = b.d.charAt(++b.a);
            while ("a" <= e && "z" >= e || "A" <= e && "Z" >= e);
            b = b.d.substring(c, b.a--).toUpperCase();
            d.value = b
        } else {
            if (" " == c || "\t" == c || "\r" == c || "\n" == c)
                return Su(b);
            if ("" === c)
                d.type = 6;
            else
                throw Error("Unexpected character: " + c);
        }
        return d
    }
    function Qu(b) {
        this.d = b
    }
    l = Qu.prototype;
    l.match = function (b) {
        if (b = this.a.type == b)
            this.a = Su(this.d);
        return b
    }
        ;
    function Tu(b) {
        var c = b.a;
        if (b.match(1)) {
            var d = c.value;
            if ("GEOMETRYCOLLECTION" == d) {
                a: {
                    if (b.match(2)) {
                        c = [];
                        do
                            c.push(Tu(b));
                        while (b.match(5));
                        if (b.match(3)) {
                            b = c;
                            break a
                        }
                    } else if (Vu(b)) {
                        b = [];
                        break a
                    }
                    throw Error(Wu(b));
                }
                return new Cm(b)
            }
            var e = Xu[d]
                , c = Yu[d];
            if (!m(e) || !m(c))
                throw Error("Invalid geometry type: " + d);
            b = e.call(b);
            return new c(b)
        }
        throw Error(Wu(b));
    }
    l.De = function () {
        if (this.match(2)) {
            var b = Zu(this);
            if (this.match(3))
                return b
        } else if (Vu(this))
            return null;
        throw Error(Wu(this));
    }
        ;
    l.Ce = function () {
        if (this.match(2)) {
            var b = $u(this);
            if (this.match(3))
                return b
        } else if (Vu(this))
            return [];
        throw Error(Wu(this));
    }
        ;
    l.Ee = function () {
        if (this.match(2)) {
            var b = av(this);
            if (this.match(3))
                return b
        } else if (Vu(this))
            return [];
        throw Error(Wu(this));
    }
        ;
    l.Pk = function () {
        if (this.match(2)) {
            var b;
            if (2 == this.a.type)
                for (b = [this.De()]; this.match(5);)
                    b.push(this.De());
            else
                b = $u(this);
            if (this.match(3))
                return b
        } else if (Vu(this))
            return [];
        throw Error(Wu(this));
    }
        ;
    l.Ok = function () {
        if (this.match(2)) {
            var b = av(this);
            if (this.match(3))
                return b
        } else if (Vu(this))
            return [];
        throw Error(Wu(this));
    }
        ;
    l.Qk = function () {
        if (this.match(2)) {
            for (var b = [this.Ee()]; this.match(5);)
                b.push(this.Ee());
            if (this.match(3))
                return b
        } else if (Vu(this))
            return [];
        throw Error(Wu(this));
    }
        ;
    function Zu(b) {
        for (var c = [], d = 0; 2 > d; ++d) {
            var e = b.a;
            if (b.match(4))
                c.push(e.value);
            else
                break
        }
        if (2 == c.length)
            return c;
        throw Error(Wu(b));
    }
    function $u(b) {
        for (var c = [Zu(b)]; b.match(5);)
            c.push(Zu(b));
        return c
    }
    function av(b) {
        for (var c = [b.Ce()]; b.match(5);)
            c.push(b.Ce());
        return c
    }
    function Vu(b) {
        var c = 1 == b.a.type && "EMPTY" == b.a.value;
        c && (b.a = Su(b.d));
        return c
    }
    function Wu(b) {
        return "Unexpected `" + b.a.value + "` at position " + b.a.position + " in `" + b.d.d + "`"
    }
    var Yu = {
        POINT: Ek,
        LINESTRING: L,
        POLYGON: G,
        MULTIPOINT: Nm,
        MULTILINESTRING: Km,
        MULTIPOLYGON: Om
    }
        , Xu = {
            POINT: Qu.prototype.De,
            LINESTRING: Qu.prototype.Ce,
            POLYGON: Qu.prototype.Ee,
            MULTIPOINT: Qu.prototype.Pk,
            MULTILINESTRING: Qu.prototype.Ok,
            MULTIPOLYGON: Qu.prototype.Qk
        };
    function bv() {
        this.version = void 0
    }
    v(bv, Vt);
    bv.prototype.d = function (b) {
        for (b = b.firstChild; null !== b; b = b.nextSibling)
            if (1 == b.nodeType)
                return this.a(b);
        return null
    }
        ;
    bv.prototype.a = function (b) {
        this.version = Aa(b.getAttribute("version"));
        b = U({
            version: this.version
        }, cv, b, []);
        return m(b) ? b : null
    }
        ;
    function dv(b, c) {
        return U({}, ev, b, c)
    }
    function fv(b, c) {
        return U({}, gv, b, c)
    }
    function hv(b, c) {
        var d = dv(b, c);
        if (m(d)) {
            var e = [Bq(b.getAttribute("width")), Bq(b.getAttribute("height"))];
            d.size = e;
            return d
        }
    }
    function iv(b, c) {
        return U([], jv, b, c)
    }
    var kv = [null, "http://www.opengis.net/wms"]
        , cv = R(kv, {
            Service: Q(function (b, c) {
                return U({}, lv, b, c)
            }),
            Capability: Q(function (b, c) {
                return U({}, mv, b, c)
            })
        })
        , mv = R(kv, {
            Request: Q(function (b, c) {
                return U({}, nv, b, c)
            }),
            Exception: Q(function (b, c) {
                return U([], ov, b, c)
            }),
            Layer: Q(function (b, c) {
                return U({}, pv, b, c)
            })
        })
        , lv = R(kv, {
            Name: Q(X),
            Title: Q(X),
            Abstract: Q(X),
            KeywordList: Q(iv),
            OnlineResource: Q(Ut),
            ContactInformation: Q(function (b, c) {
                return U({}, qv, b, c)
            }),
            Fees: Q(X),
            AccessConstraints: Q(X),
            LayerLimit: Q(Aq),
            MaxWidth: Q(Aq),
            MaxHeight: Q(Aq)
        })
        , qv = R(kv, {
            ContactPersonPrimary: Q(function (b, c) {
                return U({}, rv, b, c)
            }),
            ContactPosition: Q(X),
            ContactAddress: Q(function (b, c) {
                return U({}, sv, b, c)
            }),
            ContactVoiceTelephone: Q(X),
            ContactFacsimileTelephone: Q(X),
            ContactElectronicMailAddress: Q(X)
        })
        , rv = R(kv, {
            ContactPerson: Q(X),
            ContactOrganization: Q(X)
        })
        , sv = R(kv, {
            AddressType: Q(X),
            Address: Q(X),
            City: Q(X),
            StateOrProvince: Q(X),
            PostCode: Q(X),
            Country: Q(X)
        })
        , ov = R(kv, {
            Format: gq(X)
        })
        , pv = R(kv, {
            Name: Q(X),
            Title: Q(X),
            Abstract: Q(X),
            KeywordList: Q(iv),
            CRS: iq(X),
            EX_GeographicBoundingBox: Q(function (b, c) {
                var d = U({}, tv, b, c);
                if (m(d)) {
                    var e = d.westBoundLongitude
                        , f = d.southBoundLatitude
                        , g = d.eastBoundLongitude
                        , d = d.northBoundLatitude;
                    return m(e) && m(f) && m(g) && m(d) ? [e, f, g, d] : void 0
                }
            }),
            BoundingBox: iq(function (b) {
                var c = [zq(b.getAttribute("minx")), zq(b.getAttribute("miny")), zq(b.getAttribute("maxx")), zq(b.getAttribute("maxy"))]
                    , d = [zq(b.getAttribute("resx")), zq(b.getAttribute("resy"))];
                return {
                    crs: b.getAttribute("CRS"),
                    extent: c,
                    res: d
                }
            }),
            Dimension: iq(function (b) {
                return {
                    name: b.getAttribute("name"),
                    units: b.getAttribute("units"),
                    unitSymbol: b.getAttribute("unitSymbol"),
                    "default": b.getAttribute("default"),
                    multipleValues: wq(b.getAttribute("multipleValues")),
                    nearestValue: wq(b.getAttribute("nearestValue")),
                    current: wq(b.getAttribute("current")),
                    values: X(b)
                }
            }),
            Attribution: Q(function (b, c) {
                return U({}, uv, b, c)
            }),
            AuthorityURL: iq(function (b, c) {
                var d = dv(b, c);
                if (m(d))
                    return d.name = b.getAttribute("name"),
                        d
            }),
            Identifier: iq(X),
            MetadataURL: iq(function (b, c) {
                var d = dv(b, c);
                if (m(d))
                    return d.type = b.getAttribute("type"),
                        d
            }),
            DataURL: iq(dv),
            FeatureListURL: iq(dv),
            Style: iq(function (b, c) {
                return U({}, vv, b, c)
            }),
            MinScaleDenominator: Q(yq),
            MaxScaleDenominator: Q(yq),
            Layer: iq(function (b, c) {
                var d = c[c.length - 1]
                    , e = U({}, pv, b, c);
                if (m(e)) {
                    var f = wq(b.getAttribute("queryable"));
                    m(f) || (f = d.queryable);
                    e.queryable = m(f) ? f : !1;
                    f = Bq(b.getAttribute("cascaded"));
                    m(f) || (f = d.cascaded);
                    e.cascaded = f;
                    f = wq(b.getAttribute("opaque"));
                    m(f) || (f = d.opaque);
                    e.opaque = m(f) ? f : !1;
                    f = wq(b.getAttribute("noSubsets"));
                    m(f) || (f = d.noSubsets);
                    e.noSubsets = m(f) ? f : !1;
                    f = zq(b.getAttribute("fixedWidth"));
                    m(f) || (f = d.fixedWidth);
                    e.fixedWidth = f;
                    f = zq(b.getAttribute("fixedHeight"));
                    m(f) || (f = d.fixedHeight);
                    e.fixedHeight = f;
                    Oa(["Style", "CRS", "AuthorityURL"], function (b) {
                        var c = d[b];
                        if (m(c)) {
                            var f = vb(e, b)
                                , f = f.concat(c);
                            e[b] = f
                        }
                    });
                    Oa("EX_GeographicBoundingBox BoundingBox Dimension Attribution MinScaleDenominator MaxScaleDenominator".split(" "), function (b) {
                        m(e[b]) || (e[b] = d[b])
                    });
                    return e
                }
            })
        })
        , uv = R(kv, {
            Title: Q(X),
            OnlineResource: Q(Ut),
            LogoURL: Q(hv)
        })
        , tv = R(kv, {
            westBoundLongitude: Q(yq),
            eastBoundLongitude: Q(yq),
            southBoundLatitude: Q(yq),
            northBoundLatitude: Q(yq)
        })
        , nv = R(kv, {
            GetCapabilities: Q(fv),
            GetMap: Q(fv),
            GetFeatureInfo: Q(fv)
        })
        , gv = R(kv, {
            Format: iq(X),
            DCPType: iq(function (b, c) {
                return U({}, wv, b, c)
            })
        })
        , wv = R(kv, {
            HTTP: Q(function (b, c) {
                return U({}, xv, b, c)
            })
        })
        , xv = R(kv, {
            Get: Q(dv),
            Post: Q(dv)
        })
        , vv = R(kv, {
            Name: Q(X),
            Title: Q(X),
            Abstract: Q(X),
            LegendURL: iq(hv),
            StyleSheetURL: Q(dv),
            StyleURL: Q(dv)
        })
        , ev = R(kv, {
            Format: Q(X),
            OnlineResource: Q(Ut)
        })
        , jv = R(kv, {
            Keyword: gq(X)
        });
    function yv() {
        this.b = "http://mapserver.gis.umn.edu/mapserver";
        this.d = new Oq;
        this.defaultDataProjection = null
    }
    v(yv, rq);
    function zv(b, c, d) {
        c.namespaceURI = b.b;
        var e = Pp(c)
            , f = [];
        if (0 === c.childNodes.length)
            return f;
        "msGMLOutput" == e && Oa(c.childNodes, function (b) {
            if (1 === b.nodeType) {
                var c = d[0], e = b.localName, n = RegExp, p;
                p = "_layer".replace(/([-()\[\]{}+?*.$\^|,:#<!\\])/g, "\\$1").replace(/\x08/g, "\\x08");
                n = new n(p, "");
                e = e.replace(n, "") + "_feature";
                c.featureType = e;
                c.featureNS = this.b;
                n = {};
                n[e] = gq(this.d.Fe, this.d);
                c = R([c.featureNS, null], n);
                b.namespaceURI = this.b;
                b = U([], c, b, d, this.d);
                m(b) && Za(f, b)
            }
        }, b);
        "FeatureCollection" == e && (b = U([], b.d.d, c, [{}], b.d),
            m(b) && (f = b));
        return f
    }
    yv.prototype.Ob = function (b, c) {
        var d = {
            featureType: this.featureType,
            featureNS: this.featureNS
        };
        m(c) && yb(d, rp(this, b, c));
        return zv(this, b, [d])
    }
        ;
    function Av() {
        this.c = new Wt
    }
    v(Av, Vt);
    Av.prototype.d = function (b) {
        for (b = b.firstChild; null !== b; b = b.nextSibling)
            if (1 == b.nodeType)
                return this.a(b);
        return null
    }
        ;
    Av.prototype.a = function (b) {
        this.version = Aa(b.getAttribute("version"));
        var c = this.c.a(b);
        if (!m(c))
            return null;
        c.version = this.version;
        c = U(c, Bv, b, []);
        return m(c) ? c : null
    }
        ;
    function Cv(b) {
        var c = X(b).split(" ");
        if (m(c) && 2 == c.length)
            return b = +c[0],
                c = +c[1],
                isNaN(b) || isNaN(c) ? void 0 : [b, c]
    }
    var Dv = [null, "http://www.opengis.net/wmts/1.0"]
        , Ev = [null, "http://www.opengis.net/ows/1.1"]
        , Bv = R(Dv, {
            Contents: Q(function (b, c) {
                return U({}, Fv, b, c)
            })
        })
        , Fv = R(Dv, {
            Layer: iq(function (b, c) {
                return U({}, Gv, b, c)
            }),
            TileMatrixSet: iq(function (b, c) {
                return U({}, Hv, b, c)
            })
        })
        , Gv = R(Dv, {
            Style: iq(function (b, c) {
                var d = U({}, Iv, b, c);
                if (m(d)) {
                    var e = "true" === b.getAttribute("isDefault");
                    d.isDefault = e;
                    return d
                }
            }),
            Format: iq(X),
            TileMatrixSetLink: iq(function (b, c) {
                return U({}, Jv, b, c)
            }),
            ResourceURL: iq(function (b) {
                var c = b.getAttribute("format")
                    , d = b.getAttribute("template");
                b = b.getAttribute("resourceType");
                var e = {};
                m(c) && (e.format = c);
                m(d) && (e.template = d);
                m(b) && (e.resourceType = b);
                return e
            })
        }, R(Ev, {
            Title: Q(X),
            Abstract: Q(X),
            WGS84BoundingBox: Q(function (b, c) {
                var d = U([], Kv, b, c);
                return 2 != d.length ? void 0 : Qd(d)
            }),
            Identifier: Q(X)
        }))
        , Iv = R(Dv, {
            LegendURL: iq(function (b) {
                var c = {};
                c.format = b.getAttribute("format");
                c.href = Ut(b);
                return c
            })
        }, R(Ev, {
            Title: Q(X),
            Identifier: Q(X)
        }))
        , Jv = R(Dv, {
            TileMatrixSet: Q(X)
        })
        , Kv = R(Ev, {
            LowerCorner: gq(Cv),
            UpperCorner: gq(Cv)
        })
        , Hv = R(Dv, {
            WellKnownScaleSet: Q(X),
            TileMatrix: iq(function (b, c) {
                return U({}, Lv, b, c)
            })
        }, R(Ev, {
            SupportedCRS: Q(X),
            Identifier: Q(X)
        }))
        , Lv = R(Dv, {
            TopLeftCorner: Q(Cv),
            ScaleDenominator: Q(yq),
            TileWidth: Q(Aq),
            TileHeight: Q(Aq),
            MatrixWidth: Q(Aq),
            MatrixHeight: Q(Aq)
        }, R(Ev, {
            Identifier: Q(X)
        }));
    var Mv = new te(6378137);
    function Z(b) {
        od.call(this);
        b = m(b) ? b : {};
        this.a = null;
        this.f = Te;
        this.c = void 0;
        w(this, sd("projection"), this.ej, !1, this);
        w(this, sd("tracking"), this.fj, !1, this);
        m(b.projection) && this.n(Be(b.projection));
        m(b.trackingOptions) && this.l(b.trackingOptions);
        this.b(m(b.tracking) ? b.tracking : !1)
    }
    v(Z, od);
    l = Z.prototype;
    l.M = function () {
        this.b(!1);
        Z.R.M.call(this)
    }
        ;
    l.ej = function () {
        var b = this.g();
        null != b && (this.f = Ae(Be("EPSG:4326"), b),
            null === this.a || this.set("position", this.f(this.a)))
    }
        ;
    l.fj = function () {
        if (bg) {
            var b = this.i();
            b && !m(this.c) ? this.c = ba.navigator.geolocation.watchPosition(ra(this.Xk, this), ra(this.Yk, this), this.e()) : !b && m(this.c) && (ba.navigator.geolocation.clearWatch(this.c),
                this.c = void 0)
        }
    }
        ;
    l.Xk = function (b) {
        b = b.coords;
        this.set("accuracy", b.accuracy);
        this.set("altitude", null === b.altitude ? void 0 : b.altitude);
        this.set("altitudeAccuracy", null === b.altitudeAccuracy ? void 0 : b.altitudeAccuracy);
        this.set("heading", null === b.heading ? void 0 : Xb(b.heading));
        null === this.a ? this.a = [b.longitude, b.latitude] : (this.a[0] = b.longitude,
            this.a[1] = b.latitude);
        var c = this.f(this.a);
        this.set("position", c);
        this.set("speed", null === b.speed ? void 0 : b.speed);
        b = Tk(Mv, this.a, b.accuracy);
        b.qa(this.f);
        this.set("accuracyGeometry", b);
        this.o()
    }
        ;
    l.Yk = function (b) {
        b.type = "error";
        this.b(!1);
        this.dispatchEvent(b)
    }
        ;
    l.gf = function () {
        return this.get("accuracy")
    }
        ;
    Z.prototype.getAccuracy = Z.prototype.gf;
    Z.prototype.p = function () {
        return this.get("accuracyGeometry") || null
    }
        ;
    Z.prototype.getAccuracyGeometry = Z.prototype.p;
    Z.prototype.q = function () {
        return this.get("altitude")
    }
        ;
    Z.prototype.getAltitude = Z.prototype.q;
    Z.prototype.r = function () {
        return this.get("altitudeAccuracy")
    }
        ;
    Z.prototype.getAltitudeAccuracy = Z.prototype.r;
    Z.prototype.F = function () {
        return this.get("heading")
    }
        ;
    Z.prototype.getHeading = Z.prototype.F;
    Z.prototype.H = function () {
        return this.get("position")
    }
        ;
    Z.prototype.getPosition = Z.prototype.H;
    Z.prototype.g = function () {
        return this.get("projection")
    }
        ;
    Z.prototype.getProjection = Z.prototype.g;
    Z.prototype.s = function () {
        return this.get("speed")
    }
        ;
    Z.prototype.getSpeed = Z.prototype.s;
    Z.prototype.i = function () {
        return this.get("tracking")
    }
        ;
    Z.prototype.getTracking = Z.prototype.i;
    Z.prototype.e = function () {
        return this.get("trackingOptions")
    }
        ;
    Z.prototype.getTrackingOptions = Z.prototype.e;
    Z.prototype.n = function (b) {
        this.set("projection", b)
    }
        ;
    Z.prototype.setProjection = Z.prototype.n;
    Z.prototype.b = function (b) {
        this.set("tracking", b)
    }
        ;
    Z.prototype.setTracking = Z.prototype.b;
    Z.prototype.l = function (b) {
        this.set("trackingOptions", b)
    }
        ;
    Z.prototype.setTrackingOptions = Z.prototype.l;
    function Nv(b, c, d) {
        for (var e = [], f = b(0), g = b(1), h = c(f), k = c(g), n = [g, f], p = [k, h], q = [1, 0], r = {}, s = 1E5, u, y, A, z, D; 0 < --s && 0 < q.length;)
            A = q.pop(),
                f = n.pop(),
                h = p.pop(),
                g = A.toString(),
                g in r || (e.push(h[0], h[1]),
                    r[g] = !0),
                z = q.pop(),
                g = n.pop(),
                k = p.pop(),
                D = (A + z) / 2,
                u = b(D),
                y = c(u),
                ok(y[0], y[1], h[0], h[1], k[0], k[1]) < d ? (e.push(k[0], k[1]),
                    g = z.toString(),
                    r[g] = !0) : (q.push(z, D, D, A),
                        p.push(k, y, y, h),
                        n.push(g, u, u, f));
        return e
    }
    function Ov(b, c, d, e, f) {
        var g = Be("EPSG:4326");
        return Nv(function (e) {
            return [b, c + (d - c) * e]
        }, Se(g, e), f)
    }
    function Pv(b, c, d, e, f) {
        var g = Be("EPSG:4326");
        return Nv(function (e) {
            return [c + (d - c) * e, b]
        }, Se(g, e), f)
    }
    ; function Qv(b) {
        b = m(b) ? b : {};
        this.j = this.g = null;
        this.c = this.b = Infinity;
        this.e = this.f = -Infinity;
        this.r = m(b.targetSize) ? b.targetSize : 100;
        this.p = m(b.maxLines) ? b.maxLines : 100;
        this.a = [];
        this.d = [];
        this.q = m(b.strokeStyle) ? b.strokeStyle : Rv;
        this.l = this.i = void 0;
        this.n = null;
        this.setMap(m(b.map) ? b.map : null)
    }
    var Rv = new fl({
        color: "rgba(0,0,0,0.2)"
    })
        , Sv = [90, 45, 30, 20, 10, 5, 2, 1, .5, .2, .1, .05, .01, .005, .002, .001];
    function Tv(b, c, d, e, f) {
        var g = f;
        c = Ov(c, b.f, b.b, b.j, d);
        g = m(b.a[g]) ? b.a[g] : new L(null);
        Jm(g, "XY", c);
        oe(g.D(), e) && (b.a[f++] = g);
        return f
    }
    function Uv(b, c, d, e, f) {
        var g = f;
        c = Pv(c, b.e, b.c, b.j, d);
        g = m(b.d[g]) ? b.d[g] : new L(null);
        Jm(g, "XY", c);
        oe(g.D(), e) && (b.d[f++] = g);
        return f
    }
    l = Qv.prototype;
    l.gj = function () {
        return this.g
    }
        ;
    l.Fh = function () {
        return this.a
    }
        ;
    l.Kh = function () {
        return this.d
    }
        ;
    l.rf = function (b) {
        var c = b.vectorContext
            , d = b.frameState;
        b = d.extent;
        var e = d.viewState
            , f = e.center
            , g = e.projection
            , e = e.resolution
            , d = d.pixelRatio
            , d = e * e / (4 * d * d);
        if (null === this.j || !Re(this.j, g)) {
            var h = g.D()
                , k = g.c
                , n = k[2]
                , p = k[1]
                , q = k[0];
            this.b = k[3];
            this.c = n;
            this.f = p;
            this.e = q;
            k = Be("EPSG:4326");
            this.i = Se(k, g);
            this.l = Se(g, k);
            this.n = this.l(ie(h));
            this.j = g
        }
        for (var g = this.n[0], h = this.n[1], k = -1, r, p = Math.pow(this.r * e, 2), q = [], s = [], e = 0, n = Sv.length; e < n; ++e) {
            r = Sv[e] / 2;
            q[0] = g - r;
            q[1] = h - r;
            s[0] = g + r;
            s[1] = h + r;
            this.i(q, q);
            this.i(s, s);
            r = Math.pow(s[0] - q[0], 2) + Math.pow(s[1] - q[1], 2);
            if (r <= p)
                break;
            k = Sv[e]
        }
        e = k;
        if (-1 == e)
            this.a.length = this.d.length = 0;
        else {
            g = this.l(f);
            f = g[0];
            g = g[1];
            h = this.p;
            f = Math.floor(f / e) * e;
            p = Ub(f, this.e, this.c);
            n = Tv(this, p, d, b, 0);
            for (k = 0; p != this.e && k++ < h;)
                p = Math.max(p - e, this.e),
                    n = Tv(this, p, d, b, n);
            p = Ub(f, this.e, this.c);
            for (k = 0; p != this.c && k++ < h;)
                p = Math.min(p + e, this.c),
                    n = Tv(this, p, d, b, n);
            this.a.length = n;
            g = Math.floor(g / e) * e;
            f = Ub(g, this.f, this.b);
            n = Uv(this, f, d, b, 0);
            for (k = 0; f != this.f && k++ < h;)
                f = Math.max(f - e, this.f),
                    n = Uv(this, f, d, b, n);
            f = Ub(g, this.f, this.b);
            for (k = 0; f != this.b && k++ < h;)
                f = Math.min(f + e, this.b),
                    n = Uv(this, f, d, b, n);
            this.d.length = n
        }
        c.za(null, this.q);
        b = 0;
        for (d = this.a.length; b < d; ++b)
            f = this.a[b],
                c.Db(f, null);
        b = 0;
        for (d = this.d.length; b < d; ++b)
            f = this.d[b],
                c.Db(f, null)
    }
        ;
    l.setMap = function (b) {
        null !== this.g && (this.g.v("postcompose", this.rf, this),
            this.g.render());
        null !== b && (b.u("postcompose", this.rf, this),
            b.render());
        this.g = b
    }
        ;
    function Vv(b, c, d, e, f, g, h) {
        Oi.call(this, b, c, d, 0, e);
        this.j = f;
        this.d = new Image;
        null !== g && (this.d.crossOrigin = g);
        this.c = {};
        this.b = null;
        this.state = 0;
        this.g = h
    }
    v(Vv, Oi);
    Vv.prototype.a = function (b) {
        if (m(b)) {
            var c = ma(b);
            if (c in this.c)
                return this.c[c];
            b = rb(this.c) ? this.d : this.d.cloneNode(!1);
            return this.c[c] = b
        }
        return this.d
    }
        ;
    Vv.prototype.i = function () {
        this.state = 3;
        Oa(this.b, Tc);
        this.b = null;
        this.dispatchEvent("change")
    }
        ;
    Vv.prototype.n = function () {
        m(this.resolution) || (this.resolution = me(this.extent) / this.d.height);
        this.state = 2;
        Oa(this.b, Tc);
        this.b = null;
        this.dispatchEvent("change")
    }
        ;
    Vv.prototype.load = function () {
        0 == this.state && (this.state = 1,
            this.b = [Rc(this.d, "error", this.i, !1, this), Rc(this.d, "load", this.n, !1, this)],
            this.g(this, this.j))
    }
        ;
    function Wv(b, c, d, e, f) {
        Pi.call(this, b, c);
        this.g = d;
        this.d = new Image;
        null !== e && (this.d.crossOrigin = e);
        this.c = {};
        this.b = null;
        this.j = f
    }
    v(Wv, Pi);
    l = Wv.prototype;
    l.Qa = function (b) {
        if (m(b)) {
            var c = ma(b);
            if (c in this.c)
                return this.c[c];
            b = rb(this.c) ? this.d : this.d.cloneNode(!1);
            return this.c[c] = b
        }
        return this.d
    }
        ;
    l.nb = function () {
        return this.g
    }
        ;
    l.hj = function () {
        this.state = 3;
        Oa(this.b, Tc);
        this.b = null;
        Qi(this)
    }
        ;
    l.ij = function () {
        this.state = this.d.naturalWidth && this.d.naturalHeight ? 2 : 4;
        Oa(this.b, Tc);
        this.b = null;
        Qi(this)
    }
        ;
    l.load = function () {
        0 == this.state && (this.state = 1,
            this.b = [Rc(this.d, "error", this.hj, !1, this), Rc(this.d, "load", this.ij, !1, this)],
            this.j(this, this.g))
    }
        ;
    function Xv(b, c, d) {
        return function (e, f, g) {
            return d(b, c, e, f, g)
        }
    }
    function Yv() { }
    ; function Zv(b, c) {
        ed.call(this);
        this.a = new Wo(this);
        var d = b;
        c && (d = wf(b));
        this.a.Oa(d, "dragenter", this.Gk);
        d != b && this.a.Oa(d, "dragover", this.Hk);
        this.a.Oa(b, "dragover", this.Ik);
        this.a.Oa(b, "drop", this.Jk)
    }
    v(Zv, ed);
    l = Zv.prototype;
    l.Fc = !1;
    l.M = function () {
        Zv.R.M.call(this);
        this.a.Ec()
    }
        ;
    l.Gk = function (b) {
        var c = b.a.dataTransfer;
        (this.Fc = !(!c || !(c.types && (Va(c.types, "Files") || Va(c.types, "public.file-url")) || c.files && 0 < c.files.length))) && b.preventDefault()
    }
        ;
    l.Hk = function (b) {
        this.Fc && (b.preventDefault(),
            b.a.dataTransfer.dropEffect = "none")
    }
        ;
    l.Ik = function (b) {
        this.Fc && (b.preventDefault(),
            b.mb(),
            b = b.a.dataTransfer,
            b.effectAllowed = "all",
            b.dropEffect = "copy")
    }
        ;
    l.Jk = function (b) {
        this.Fc && (b.preventDefault(),
            b.mb(),
            b = new uc(b.a),
            b.type = "drop",
            this.dispatchEvent(b))
    }
        ;
    function $v(b) {
        b.prototype.then = b.prototype.then;
        b.prototype.$goog_Thenable = !0
    }
    function aw(b) {
        if (!b)
            return !1;
        try {
            return !!b.$goog_Thenable
        } catch (c) {
            return !1
        }
    }
    ; function bw(b, c) {
        cw || dw();
        ew || (cw(),
            ew = !0);
        fw.push(new gw(b, c))
    }
    var cw;
    function dw() {
        if (ba.Promise && ba.Promise.resolve) {
            var b = ba.Promise.resolve();
            cw = function () {
                b.then(hw)
            }
        } else
            cw = function () {
                oh(hw)
            }
    }
    var ew = !1
        , fw = [];
    function hw() {
        for (; fw.length;) {
            var b = fw;
            fw = [];
            for (var c = 0; c < b.length; c++) {
                var d = b[c];
                try {
                    d.a.call(d.d)
                } catch (e) {
                    nh(e)
                }
            }
        }
        ew = !1
    }
    function gw(b, c) {
        this.a = b;
        this.d = c
    }
    ; function iw(b, c) {
        this.d = jw;
        this.e = void 0;
        this.a = this.b = null;
        this.c = this.f = !1;
        try {
            var d = this;
            b.call(c, function (b) {
                kw(d, lw, b)
            }, function (b) {
                kw(d, mw, b)
            })
        } catch (e) {
            kw(this, mw, e)
        }
    }
    var jw = 0
        , lw = 2
        , mw = 3;
    iw.prototype.then = function (b, c, d) {
        return nw(this, ka(b) ? b : null, ka(c) ? c : null, d)
    }
        ;
    $v(iw);
    iw.prototype.cancel = function (b) {
        this.d == jw && bw(function () {
            var c = new ow(b);
            pw(this, c)
        }, this)
    }
        ;
    function pw(b, c) {
        if (b.d == jw)
            if (b.b) {
                var d = b.b;
                if (d.a) {
                    for (var e = 0, f = -1, g = 0, h; h = d.a[g]; g++)
                        if (h = h.xc)
                            if (e++,
                                h == b && (f = g),
                                0 <= f && 1 < e)
                                break;
                    0 <= f && (d.d == jw && 1 == e ? pw(d, c) : (e = d.a.splice(f, 1)[0],
                        qw(d, e, mw, c)))
                }
            } else
                kw(b, mw, c)
    }
    function rw(b, c) {
        b.a && b.a.length || b.d != lw && b.d != mw || sw(b);
        b.a || (b.a = []);
        b.a.push(c)
    }
    function nw(b, c, d, e) {
        var f = {
            xc: null,
            Pf: null,
            Rf: null
        };
        f.xc = new iw(function (b, h) {
            f.Pf = c ? function (d) {
                try {
                    var f = c.call(e, d);
                    b(f)
                } catch (p) {
                    h(p)
                }
            }
                : b;
            f.Rf = d ? function (c) {
                try {
                    var f = d.call(e, c);
                    !m(f) && c instanceof ow ? h(c) : b(f)
                } catch (p) {
                    h(p)
                }
            }
                : h
        }
        );
        f.xc.b = b;
        rw(b, f);
        return f.xc
    }
    iw.prototype.g = function (b) {
        this.d = jw;
        kw(this, lw, b)
    }
        ;
    iw.prototype.j = function (b) {
        this.d = jw;
        kw(this, mw, b)
    }
        ;
    function kw(b, c, d) {
        if (b.d == jw) {
            if (b == d)
                c = mw,
                    d = new TypeError("Promise cannot resolve to itself");
            else {
                if (aw(d)) {
                    b.d = 1;
                    d.then(b.g, b.j, b);
                    return
                }
                if (la(d))
                    try {
                        var e = d.then;
                        if (ka(e)) {
                            tw(b, d, e);
                            return
                        }
                    } catch (f) {
                        c = mw,
                            d = f
                    }
            }
            b.e = d;
            b.d = c;
            sw(b);
            c != mw || d instanceof ow || uw(b, d)
        }
    }
    function tw(b, c, d) {
        function e(c) {
            g || (g = !0,
                b.j(c))
        }
        function f(c) {
            g || (g = !0,
                b.g(c))
        }
        b.d = 1;
        var g = !1;
        try {
            d.call(c, f, e)
        } catch (h) {
            e(h)
        }
    }
    function sw(b) {
        b.f || (b.f = !0,
            bw(b.i, b))
    }
    iw.prototype.i = function () {
        for (; this.a && this.a.length;) {
            var b = this.a;
            this.a = [];
            for (var c = 0; c < b.length; c++)
                qw(this, b[c], this.d, this.e)
        }
        this.f = !1
    }
        ;
    function qw(b, c, d, e) {
        if (d == lw)
            c.Pf(e);
        else {
            if (c.xc)
                for (; b && b.c; b = b.b)
                    b.c = !1;
            c.Rf(e)
        }
    }
    function uw(b, c) {
        b.c = !0;
        bw(function () {
            b.c && vw.call(null, c)
        })
    }
    var vw = nh;
    function ow(b) {
        xa.call(this, b)
    }
    v(ow, xa);
    ow.prototype.name = "cancel";
    /*
Portions of this code are from MochiKit, received by
The Closure Authors under the MIT license. All other code is Copyright
2005-2009 The Closure Authors. All Rights Reserved.
*/
    function ww(b, c) {
        this.f = [];
        this.p = b;
        this.l = c || null;
        this.c = this.a = !1;
        this.b = void 0;
        this.i = this.q = this.g = !1;
        this.e = 0;
        this.d = null;
        this.j = 0
    }
    ww.prototype.cancel = function (b) {
        if (this.a)
            this.b instanceof ww && this.b.cancel();
        else {
            if (this.d) {
                var c = this.d;
                delete this.d;
                b ? c.cancel(b) : (c.j--,
                    0 >= c.j && c.cancel())
            }
            this.p ? this.p.call(this.l, this) : this.i = !0;
            this.a || (b = new xw,
                yw(this),
                zw(this, !1, b))
        }
    }
        ;
    ww.prototype.n = function (b, c) {
        this.g = !1;
        zw(this, b, c)
    }
        ;
    function zw(b, c, d) {
        b.a = !0;
        b.b = d;
        b.c = !c;
        Aw(b)
    }
    function yw(b) {
        if (b.a) {
            if (!b.i)
                throw new Bw;
            b.i = !1
        }
    }
    function Cw(b, c, d, e) {
        b.f.push([c, d, e]);
        b.a && Aw(b)
    }
    ww.prototype.then = function (b, c, d) {
        var e, f, g = new iw(function (b, c) {
            e = b;
            f = c
        }
        );
        Cw(this, e, function (b) {
            b instanceof xw ? g.cancel() : f(b)
        });
        return g.then(b, c, d)
    }
        ;
    $v(ww);
    function Dw(b) {
        return Sa(b.f, function (b) {
            return ka(b[1])
        })
    }
    function Aw(b) {
        if (b.e && b.a && Dw(b)) {
            var c = b.e
                , d = Ew[c];
            d && (ba.clearTimeout(d.X),
                delete Ew[c]);
            b.e = 0
        }
        b.d && (b.d.j--,
            delete b.d);
        for (var c = b.b, e = d = !1; b.f.length && !b.g;) {
            var f = b.f.shift()
                , g = f[0]
                , h = f[1]
                , f = f[2];
            if (g = b.c ? h : g)
                try {
                    var k = g.call(f || b.l, c);
                    m(k) && (b.c = b.c && (k == c || k instanceof Error),
                        b.b = c = k);
                    aw(c) && (e = !0,
                        b.g = !0)
                } catch (n) {
                    c = n,
                        b.c = !0,
                        Dw(b) || (d = !0)
                }
        }
        b.b = c;
        e && (k = ra(b.n, b, !0),
            e = ra(b.n, b, !1),
            c instanceof ww ? (Cw(c, k, e),
                c.q = !0) : c.then(k, e));
        d && (c = new Fw(c),
            Ew[c.X] = c,
            b.e = c.X)
    }
    function Bw() {
        xa.call(this)
    }
    v(Bw, xa);
    Bw.prototype.message = "Deferred has already fired";
    Bw.prototype.name = "AlreadyCalledError";
    function xw() {
        xa.call(this)
    }
    v(xw, xa);
    xw.prototype.message = "Deferred was canceled";
    xw.prototype.name = "CanceledError";
    function Fw(b) {
        this.X = ba.setTimeout(ra(this.d, this), 0);
        this.a = b
    }
    Fw.prototype.d = function () {
        delete Ew[this.X];
        throw this.a;
    }
        ;
    var Ew = {};
    function Gw(b, c) {
        m(b.name) ? (this.name = b.name,
            this.code = qb[b.name]) : (this.code = b.code,
                this.name = Hw(b.code));
        xa.call(this, za("%s %s", this.name, c))
    }
    v(Gw, xa);
    function Hw(b) {
        var c = pb(function (c) {
            return b == c
        });
        if (!m(c))
            throw Error("Invalid code: " + b);
        return c
    }
    var qb = {
        AbortError: 3,
        EncodingError: 5,
        InvalidModificationError: 9,
        InvalidStateError: 7,
        NotFoundError: 1,
        NotReadableError: 4,
        NoModificationAllowedError: 6,
        PathExistsError: 12,
        QuotaExceededError: 10,
        SecurityError: 2,
        SyntaxError: 8,
        TypeMismatchError: 11
    };
    function Iw(b, c) {
        pc.call(this, b.type, c)
    }
    v(Iw, pc);
    function Jw() {
        ed.call(this);
        this.eb = new FileReader;
        this.eb.onloadstart = ra(this.a, this);
        this.eb.onprogress = ra(this.a, this);
        this.eb.onload = ra(this.a, this);
        this.eb.onabort = ra(this.a, this);
        this.eb.onerror = ra(this.a, this);
        this.eb.onloadend = ra(this.a, this)
    }
    v(Jw, ed);
    Jw.prototype.getError = function () {
        return this.eb.error && new Gw(this.eb.error, "reading file")
    }
        ;
    Jw.prototype.a = function (b) {
        this.dispatchEvent(new Iw(b, this))
    }
        ;
    Jw.prototype.M = function () {
        Jw.R.M.call(this);
        delete this.eb
    }
        ;
    function Kw(b) {
        var c = new ww;
        b.Oa("loadend", sa(function (b, c) {
            var f = c.eb.result
                , g = c.getError();
            null == f || g ? (yw(b),
                zw(b, !1, g)) : (yw(b),
                    zw(b, !0, f));
            c.Ec()
        }, c, b));
        return c
    }
    ; function Lw(b) {
        b = m(b) ? b : {};
        Ij.call(this, {
            handleEvent: Zc
        });
        this.e = m(b.formatConstructors) ? b.formatConstructors : [];
        this.l = m(b.projection) ? Be(b.projection) : null;
        this.f = null;
        this.c = void 0
    }
    v(Lw, Ij);
    Lw.prototype.M = function () {
        m(this.c) && Tc(this.c);
        Lw.R.M.call(this)
    }
        ;
    Lw.prototype.g = function (b) {
        b = b.a.dataTransfer.files;
        var c, d, e;
        c = 0;
        for (d = b.length; c < d; ++c) {
            var f = e = b[c]
                , g = new Jw
                , h = Kw(g);
            g.eb.readAsText(f, "");
            Cw(h, sa(this.i, e), null, this)
        }
    }
        ;
    Lw.prototype.i = function (b, c) {
        var d = this.n
            , e = this.l;
        null === e && (e = d.a().q);
        var d = this.e, f = [], g, h;
        g = 0;
        for (h = d.length; g < h; ++g) {
            var k = new d[g], n;
            try {
                n = k.ma(c)
            } catch (p) {
                n = null
            }
            if (null !== n) {
                var k = k.Ha(c), k = Se(k, e), q, r;
                q = 0;
                for (r = n.length; q < r; ++q) {
                    var s = n[q]
                        , u = s.N();
                    null != u && u.qa(k);
                    f.push(s)
                }
            }
        }
        this.dispatchEvent(new Mw(Nw, this, b, f, e))
    }
        ;
    Lw.prototype.setMap = function (b) {
        m(this.c) && (Tc(this.c),
            this.c = void 0);
        null !== this.f && (oc(this.f),
            this.f = null);
        Lw.R.setMap.call(this, b);
        null !== b && (this.f = new Zv(b.b),
            this.c = w(this.f, "drop", this.g, !1, this))
    }
        ;
    var Nw = "addfeatures";
    function Mw(b, c, d, e, f) {
        pc.call(this, b, c);
        this.features = e;
        this.file = d;
        this.projection = f
    }
    v(Mw, pc);
    function Ow(b, c) {
        this.x = b;
        this.y = c
    }
    v(Ow, sf);
    Ow.prototype.clone = function () {
        return new Ow(this.x, this.y)
    }
        ;
    Ow.prototype.scale = sf.prototype.scale;
    Ow.prototype.add = function (b) {
        this.x += b.x;
        this.y += b.y;
        return this
    }
        ;
    Ow.prototype.rotate = function (b) {
        var c = Math.cos(b);
        b = Math.sin(b);
        var d = this.y * c + this.x * b;
        this.x = this.x * c - this.y * b;
        this.y = d;
        return this
    }
        ;
    function Pw(b) {
        b = m(b) ? b : {};
        Vj.call(this, {
            handleDownEvent: Qw,
            handleDragEvent: Rw,
            handleUpEvent: Sw
        });
        this.i = m(b.condition) ? b.condition : Sj;
        this.c = this.e = void 0;
        this.g = 0
    }
    v(Pw, Vj);
    function Rw(b) {
        if (Uj(b)) {
            var c = b.map
                , d = c.f();
            b = b.pixel;
            b = new Ow(b[0] - d[0] / 2, d[1] / 2 - b[1]);
            d = Math.atan2(b.y, b.x);
            b = Math.sqrt(b.x * b.x + b.y * b.y);
            var e = c.a()
                , f = Xe(e);
            c.render();
            m(this.e) && Jj(c, e, f.rotation - (d - this.e));
            this.e = d;
            m(this.c) && Lj(c, e, f.resolution / b * this.c);
            m(this.c) && (this.g = this.c / b);
            this.c = b
        }
    }
    function Sw(b) {
        if (!Uj(b))
            return !0;
        b = b.map;
        var c = b.a();
        Ze(c, -1);
        var d = Xe(c)
            , e = this.g - 1
            , f = d.rotation
            , f = c.constrainRotation(f, 0);
        Jj(b, c, f, void 0, void 0);
        d = d.resolution;
        d = c.constrainResolution(d, 0, e);
        Lj(b, c, d, void 0, 400);
        this.g = 0;
        return !1
    }
    function Qw(b) {
        return Uj(b) && this.i(b) ? (Ze(b.map.a(), 1),
            this.c = this.e = void 0,
            !0) : !1
    }
    ; function Tw(b, c) {
        pc.call(this, b);
        this.feature = c
    }
    v(Tw, pc);
    function Uw(b) {
        Vj.call(this, {
            handleDownEvent: Vw,
            handleEvent: Ww,
            handleUpEvent: Xw
        });
        this.S = null;
        this.ea = m(b.source) ? b.source : null;
        this.ba = m(b.features) ? b.features : null;
        this.Bb = m(b.snapTolerance) ? b.snapTolerance : 12;
        this.Da = m(b.minPointsPerRing) ? b.minPointsPerRing : 3;
        var c = this.F = b.type, d;
        if ("Point" === c || "MultiPoint" === c)
            d = Yw;
        else if ("LineString" === c || "MultiLineString" === c)
            d = Zw;
        else if ("Polygon" === c || "MultiPolygon" === c)
            d = $w;
        this.c = d;
        this.e = this.r = this.l = this.g = this.i = null;
        this.H = new op({
            style: m(b.style) ? b.style : ax()
        });
        this.ca = b.geometryName;
        this.Va = m(b.condition) ? b.condition : Rj;
        w(this, sd("active"), this.da, !1, this)
    }
    v(Uw, Vj);
    function ax() {
        var b = ql();
        return function (c) {
            return b[c.N().I()]
        }
    }
    Uw.prototype.setMap = function (b) {
        Uw.R.setMap.call(this, b);
        this.da()
    }
        ;
    function Ww(b) {
        var c;
        c = b.map;
        if (Of(document, c.b) && "none" != c.b.style.display) {
            var d = c.f();
            null == d || 0 >= d[0] || 0 >= d[1] ? c = !1 : (c = c.a(),
                c = null !== c && Ye(c) ? !0 : !1)
        } else
            c = !1;
        if (!c)
            return !0;
        c = !0;
        b.type === Hi ? c = bx(this, b) : b.type === Bi && (c = !1);
        return Wj.call(this, b) && c
    }
    function Vw(b) {
        return this.Va(b) ? (this.S = b.pixel,
            !0) : !1
    }
    function Xw(b) {
        var c = this.S
            , d = b.pixel
            , e = c[0] - d[0]
            , c = c[1] - d[1]
            , d = !0;
        4 >= e * e + c * c && (bx(this, b),
            null === this.i ? cx(this, b) : this.c === Yw || dx(this, b) ? this.U() : (b = b.coordinate,
                e = this.g.N(),
                this.c === Zw ? (this.i = b.slice(),
                    c = e.K(),
                    c.push(b.slice()),
                    e.V(c)) : this.c === $w && (this.e[0].push(b.slice()),
                        e.V(this.e)),
                ex(this)),
            d = !1);
        return d
    }
    function bx(b, c) {
        if (b.c === Yw && null === b.i)
            cx(b, c);
        else if (null === b.i) {
            var d = c.coordinate.slice();
            null === b.l ? (b.l = new P(new Ek(d)),
                ex(b)) : b.l.N().V(d)
        } else {
            var d = c.coordinate, e = b.g.N(), f, g;
            b.c === Yw ? (g = e.K(),
                g[0] = d[0],
                g[1] = d[1],
                e.V(g)) : (b.c === Zw ? f = e.K() : b.c === $w && (f = b.e[0]),
                    dx(b, c) && (d = b.i.slice()),
                    b.l.N().V(d),
                    g = f[f.length - 1],
                    g[0] = d[0],
                    g[1] = d[1],
                    b.c === Zw ? e.V(f) : b.c === $w && (b.r.N().V(f),
                        e.V(b.e)));
            ex(b)
        }
        return !0
    }
    function dx(b, c) {
        var d = !1;
        if (null !== b.g) {
            var e = b.g.N()
                , f = !1
                , g = [b.i];
            b.c === Zw ? f = 2 < e.K().length : b.c === $w && (f = e.K()[0].length > b.Da,
                g = [b.e[0][0], b.e[0][b.e[0].length - 2]]);
            if (f)
                for (var e = c.map, f = 0, h = g.length; f < h; f++) {
                    var k = g[f]
                        , n = e.e(k)
                        , p = c.pixel
                        , d = p[0] - n[0]
                        , n = p[1] - n[1];
                    if (d = Math.sqrt(d * d + n * n) <= b.Bb) {
                        b.i = k;
                        break
                    }
                }
        }
        return d
    }
    function cx(b, c) {
        var d = c.coordinate;
        b.i = d;
        var e;
        b.c === Yw ? e = new Ek(d.slice()) : b.c === Zw ? e = new L([d.slice(), d.slice()]) : b.c === $w && (b.r = new P(new L([d.slice(), d.slice()])),
            b.e = [[d.slice(), d.slice()]],
            e = new G(b.e));
        b.g = new P;
        m(b.ca) && b.g.f(b.ca);
        b.g.Pa(e);
        ex(b);
        b.dispatchEvent(new Tw("drawstart", b.g))
    }
    Uw.prototype.U = function () {
        var b = fx(this), c, d = b.N();
        this.c === Yw ? c = d.K() : this.c === Zw ? (c = d.K(),
            c.pop(),
            d.V(c)) : this.c === $w && (this.e[0].pop(),
                this.e[0].push(this.e[0][0]),
                d.V(this.e),
                c = d.K());
        "MultiPoint" === this.F ? b.Pa(new Nm([c])) : "MultiLineString" === this.F ? b.Pa(new Km([c])) : "MultiPolygon" === this.F && b.Pa(new Om([c]));
        null === this.ba || this.ba.push(b);
        null === this.ea || this.ea.Ta(b);
        this.dispatchEvent(new Tw("drawend", b))
    }
        ;
    function fx(b) {
        b.i = null;
        var c = b.g;
        null !== c && (b.g = null,
            b.l = null,
            b.r = null,
            b.H.a.clear());
        return c
    }
    Uw.prototype.q = Yc;
    function ex(b) {
        var c = [];
        null === b.g || c.push(b.g);
        null === b.r || c.push(b.r);
        null === b.l || c.push(b.l);
        b.H.Nc(new C(c))
    }
    Uw.prototype.da = function () {
        var b = this.n
            , c = this.a();
        null !== b && c || fx(this);
        this.H.setMap(c ? b : null)
    }
        ;
    var Yw = "Point"
        , Zw = "LineString"
        , $w = "Polygon";
    function gx(b) {
        Vj.call(this, {
            handleDownEvent: hx,
            handleDragEvent: ix,
            handleEvent: jx,
            handleUpEvent: kx
        });
        this.ba = m(b.deleteCondition) ? b.deleteCondition : dd(Rj, Qj);
        this.U = this.e = null;
        this.S = [0, 0];
        this.c = new an;
        this.i = m(b.pixelTolerance) ? b.pixelTolerance : 10;
        this.H = !1;
        this.g = null;
        this.l = new op({
            style: m(b.style) ? b.style : lx()
        });
        this.F = {
            Point: this.$l,
            LineString: this.sg,
            LinearRing: this.sg,
            Polygon: this.bm,
            MultiPoint: this.Xl,
            MultiLineString: this.Wl,
            MultiPolygon: this.Zl,
            GeometryCollection: this.Vl
        };
        this.r = b.features;
        this.r.forEach(this.Df, this);
        w(this.r, "add", this.ei, !1, this);
        w(this.r, "remove", this.fi, !1, this)
    }
    v(gx, Vj);
    l = gx.prototype;
    l.Df = function (b) {
        var c = b.N();
        m(this.F[c.I()]) && this.F[c.I()].call(this, b, c);
        b = this.n;
        null === b || mx(this, this.S, b)
    }
        ;
    l.setMap = function (b) {
        this.l.setMap(b);
        gx.R.setMap.call(this, b)
    }
        ;
    l.ei = function (b) {
        this.Df(b.element)
    }
        ;
    l.fi = function (b) {
        var c = b.element;
        b = this.c;
        var d, e = [];
        en(b, c.N().D(), function (b) {
            c === b.feature && e.push(b)
        });
        for (d = e.length - 1; 0 <= d; --d)
            b.remove(e[d]);
        null !== this.e && 0 === this.r.Ib() && (this.l.yd(this.e),
            this.e = null)
    }
        ;
    l.$l = function (b, c) {
        var d = c.K()
            , d = {
                feature: b,
                geometry: c,
                ga: [d, d]
            };
        this.c.ra(c.D(), d)
    }
        ;
    l.Xl = function (b, c) {
        var d = c.K(), e, f, g;
        f = 0;
        for (g = d.length; f < g; ++f)
            e = d[f],
                e = {
                    feature: b,
                    geometry: c,
                    depth: [f],
                    index: f,
                    ga: [e, e]
                },
                this.c.ra(c.D(), e)
    }
        ;
    l.sg = function (b, c) {
        var d = c.K(), e, f, g, h;
        e = 0;
        for (f = d.length - 1; e < f; ++e)
            g = d.slice(e, e + 2),
                h = {
                    feature: b,
                    geometry: c,
                    index: e,
                    ga: g
                },
                this.c.ra(Qd(g), h)
    }
        ;
    l.Wl = function (b, c) {
        var d = c.K(), e, f, g, h, k, n, p;
        h = 0;
        for (k = d.length; h < k; ++h)
            for (e = d[h],
                f = 0,
                g = e.length - 1; f < g; ++f)
                n = e.slice(f, f + 2),
                    p = {
                        feature: b,
                        geometry: c,
                        depth: [h],
                        index: f,
                        ga: n
                    },
                    this.c.ra(Qd(n), p)
    }
        ;
    l.bm = function (b, c) {
        var d = c.K(), e, f, g, h, k, n, p;
        h = 0;
        for (k = d.length; h < k; ++h)
            for (e = d[h],
                f = 0,
                g = e.length - 1; f < g; ++f)
                n = e.slice(f, f + 2),
                    p = {
                        feature: b,
                        geometry: c,
                        depth: [h],
                        index: f,
                        ga: n
                    },
                    this.c.ra(Qd(n), p)
    }
        ;
    l.Zl = function (b, c) {
        var d = c.K(), e, f, g, h, k, n, p, q, r, s;
        n = 0;
        for (p = d.length; n < p; ++n)
            for (q = d[n],
                h = 0,
                k = q.length; h < k; ++h)
                for (e = q[h],
                    f = 0,
                    g = e.length - 1; f < g; ++f)
                    r = e.slice(f, f + 2),
                        s = {
                            feature: b,
                            geometry: c,
                            depth: [h, n],
                            index: f,
                            ga: r
                        },
                        this.c.ra(Qd(r), s)
    }
        ;
    l.Vl = function (b, c) {
        var d, e = c.c;
        for (d = 0; d < e.length; ++d)
            this.F[e[d].I()].call(this, b, e[d])
    }
        ;
    function nx(b, c) {
        var d = b.e;
        null === d ? (d = new P(new Ek(c)),
            b.e = d,
            b.l.yf(d)) : d.N().V(c)
    }
    function hx(b) {
        mx(this, b.pixel, b.map);
        this.g = [];
        var c = this.e;
        if (null !== c) {
            b = [];
            for (var c = c.N().K(), d = Qd([c]), d = cn(this.c, d), e = 0, f = d.length; e < f; ++e) {
                var g = d[e]
                    , h = g.ga;
                yd(h[0], c) ? this.g.push([g, 0]) : yd(h[1], c) ? this.g.push([g, 1]) : ma(h) in this.U && b.push([g, c])
            }
            for (e = b.length - 1; 0 <= e; --e)
                this.Ei.apply(this, b[e])
        }
        return null !== this.e
    }
    function ix(b) {
        b = b.coordinate;
        for (var c = 0, d = this.g.length; c < d; ++c) {
            for (var e = this.g[c], f = e[0], g = f.depth, h = f.geometry, k = h.K(), n = f.ga, e = e[1]; b.length < h.t;)
                b.push(0);
            switch (h.I()) {
                case "Point":
                    k = b;
                    n[0] = n[1] = b;
                    break;
                case "MultiPoint":
                    k[f.index] = b;
                    n[0] = n[1] = b;
                    break;
                case "LineString":
                    k[f.index + e] = b;
                    n[e] = b;
                    break;
                case "MultiLineString":
                    k[g[0]][f.index + e] = b;
                    n[e] = b;
                    break;
                case "Polygon":
                    k[g[0]][f.index + e] = b;
                    n[e] = b;
                    break;
                case "MultiPolygon":
                    k[g[1]][g[0]][f.index + e] = b,
                        n[e] = b
            }
            h.V(k);
            nx(this, b)
        }
    }
    function kx() {
        for (var b, c = this.g.length - 1; 0 <= c; --c)
            b = this.g[c][0],
                this.c.update(Qd(b.ga), b);
        return !1
    }
    function jx(b) {
        var c;
        b.map.a().l.slice()[1] || b.type != Hi || (this.S = b.pixel,
            mx(this, b.pixel, b.map));
        if (null !== this.e && this.H && this.ba(b)) {
            this.e.N();
            c = this.g;
            var d = {}, e = !1, f, g, h, k, n, p, q, r, s;
            for (n = c.length - 1; 0 <= n; --n)
                if (h = c[n],
                    r = h[0],
                    k = r.geometry,
                    g = k.K(),
                    s = ma(r.feature),
                    f = q = p = void 0,
                    0 === h[1] ? (q = r,
                        p = r.index) : 1 == h[1] && (f = r,
                            p = r.index + 1),
                    s in d || (d[s] = [f, q, p]),
                    h = d[s],
                    m(f) && (h[0] = f),
                    m(q) && (h[1] = q),
                    m(h[0]) && m(h[1])) {
                    f = g;
                    e = !1;
                    q = p - 1;
                    switch (k.I()) {
                        case "MultiLineString":
                            g[r.depth[0]].splice(p, 1);
                            e = !0;
                            break;
                        case "LineString":
                            g.splice(p, 1);
                            e = !0;
                            break;
                        case "MultiPolygon":
                            f = f[r.depth[1]];
                        case "Polygon":
                            f = f[r.depth[0]],
                                4 < f.length && (p == f.length - 1 && (p = 0),
                                    f.splice(p, 1),
                                    e = !0,
                                    0 === p && (f.pop(),
                                        f.push(f[0]),
                                        q = f.length - 1))
                    }
                    e && (this.c.remove(h[0]),
                        this.c.remove(h[1]),
                        k.V(g),
                        g = {
                            depth: r.depth,
                            feature: r.feature,
                            geometry: r.geometry,
                            index: q,
                            ga: [h[0].ga[0], h[1].ga[1]]
                        },
                        this.c.ra(Qd(g.ga), g),
                        ox(this, k, p, r.depth, -1),
                        this.l.yd(this.e),
                        this.e = null)
                }
            c = e
        }
        return Wj.call(this, b) && !c
    }
    function mx(b, c, d) {
        function e(b, c) {
            return Ad(f, vd(f, b.ga)) - Ad(f, vd(f, c.ga))
        }
        var f = d.ia(c)
            , g = d.ia([c[0] - b.i, c[1] + b.i])
            , h = d.ia([c[0] + b.i, c[1] - b.i])
            , g = Qd([g, h])
            , g = cn(b.c, g);
        if (0 < g.length) {
            g.sort(e);
            var h = g[0].ga
                , k = vd(f, h)
                , n = d.e(k);
            if (Math.sqrt(Ad(c, n)) <= b.i) {
                c = d.e(h[0]);
                d = d.e(h[1]);
                c = Ad(n, c);
                d = Ad(n, d);
                b.H = Math.sqrt(Math.min(c, d)) <= b.i;
                b.H && (k = c > d ? h[1] : h[0]);
                nx(b, k);
                d = {};
                d[ma(h)] = !0;
                c = 1;
                for (n = g.length; c < n; ++c)
                    if (k = g[c].ga,
                        yd(h[0], k[0]) && yd(h[1], k[1]) || yd(h[0], k[1]) && yd(h[1], k[0]))
                        d[ma(k)] = !0;
                    else
                        break;
                b.U = d;
                return
            }
        }
        null !== b.e && (b.l.yd(b.e),
            b.e = null)
    }
    l.Ei = function (b, c) {
        for (var d = b.ga, e = b.feature, f = b.geometry, g = b.depth, h = b.index, k; c.length < f.t;)
            c.push(0);
        switch (f.I()) {
            case "MultiLineString":
                k = f.K();
                k[g[0]].splice(h + 1, 0, c);
                break;
            case "Polygon":
                k = f.K();
                k[g[0]].splice(h + 1, 0, c);
                break;
            case "MultiPolygon":
                k = f.K();
                k[g[1]][g[0]].splice(h + 1, 0, c);
                break;
            case "LineString":
                k = f.K();
                k.splice(h + 1, 0, c);
                break;
            default:
                return
        }
        f.V(k);
        k = this.c;
        k.remove(b);
        ox(this, f, h, g, 1);
        var n = {
            ga: [d[0], c],
            feature: e,
            geometry: f,
            depth: g,
            index: h
        };
        k.ra(Qd(n.ga), n);
        this.g.push([n, 1]);
        d = {
            ga: [c, d[1]],
            feature: e,
            geometry: f,
            depth: g,
            index: h + 1
        };
        k.ra(Qd(d.ga), d);
        this.g.push([d, 0])
    }
        ;
    function ox(b, c, d, e, f) {
        en(b.c, c.D(), function (b) {
            b.geometry === c && (!m(e) || db(b.depth, e)) && b.index > d && (b.index += f)
        })
    }
    function lx() {
        var b = ql();
        return function () {
            return b.Point
        }
    }
    ; function px(b) {
        Ij.call(this, {
            handleEvent: qx
        });
        b = m(b) ? b : {};
        this.i = m(b.condition) ? b.condition : Qj;
        this.e = m(b.addCondition) ? b.addCondition : Yc;
        this.q = m(b.removeCondition) ? b.removeCondition : Yc;
        this.s = m(b.toggleCondition) ? b.toggleCondition : Sj;
        this.g = m(b.multi) ? b.multi : !1;
        var c;
        if (m(b.layers))
            if (ka(b.layers))
                c = b.layers;
            else {
                var d = b.layers;
                c = function (b) {
                    return Va(d, b)
                }
            }
        else
            c = Zc;
        this.f = c;
        this.c = new op({
            style: m(b.style) ? b.style : rx()
        });
        b = this.c.a;
        w(b, "add", this.l, !1, this);
        w(b, "remove", this.r, !1, this)
    }
    v(px, Ij);
    px.prototype.p = function () {
        return this.c.a
    }
        ;
    function qx(b) {
        if (!this.i(b))
            return !0;
        var c = this.e(b)
            , d = this.q(b)
            , e = this.s(b)
            , f = b.map
            , g = this.c.a
            , h = []
            , k = [];
        if (c || d || e) {
            f.ne(b.pixel, function (b) {
                -1 == Na.indexOf.call(g.a, b, void 0) ? (c || e) && k.push(b) : (d || e) && h.push(b)
            }, void 0, this.f);
            for (f = h.length - 1; 0 <= f; --f)
                g.remove(h[f]);
            g.we(k)
        } else
            f.ne(b.pixel, function (b) {
                k.push(b)
            }, void 0, this.f),
                0 < k.length && 1 == g.Ib() && g.item(0) == k[k.length - 1] || (0 !== g.Ib() && g.clear(),
                    this.g ? g.we(k) : 0 < k.length && g.push(k[k.length - 1]));
        return Pj(b)
    }
    px.prototype.setMap = function (b) {
        var c = this.n
            , d = this.c.a;
        null === c || d.forEach(c.gc, c);
        px.R.setMap.call(this, b);
        this.c.setMap(b);
        null === b || d.forEach(b.Va, b)
    }
        ;
    function rx() {
        var b = ql();
        Za(b.Polygon, b.LineString);
        Za(b.GeometryCollection, b.LineString);
        return function (c) {
            return b[c.N().I()]
        }
    }
    px.prototype.l = function (b) {
        b = b.element;
        var c = this.n;
        null === c || c.Va(b)
    }
        ;
    px.prototype.r = function (b) {
        b = b.element;
        var c = this.n;
        null === c || c.gc(b)
    }
        ;
    function $(b) {
        b = m(b) ? b : {};
        var c = wb(b);
        delete c.gradient;
        delete c.radius;
        delete c.blur;
        delete c.shadow;
        delete c.weight;
        K.call(this, c);
        this.ha = null;
        w(this, sd("gradient"), this.be, !1, this);
        this.gc(m(b.gradient) ? b.gradient : sx);
        var d = tx(m(b.radius) ? b.radius : 8, m(b.blur) ? b.blur : 15, m(b.shadow) ? b.shadow : 250), e = Array(256), f = m(b.weight) ? b.weight : "weight", g;
        ia(f) ? g = function (b) {
            return b.get(f)
        }
            : g = f;
        this.ka(function (b) {
            b = g(b);
            b = m(b) ? Ub(b, 0, 1) : 1;
            var c = 255 * b | 0
                , f = e[c];
            m(f) || (f = [new ll({
                image: new oj({
                    opacity: b,
                    src: d
                })
            })],
                e[c] = f);
            return f
        });
        this.set("renderOrder", null);
        w(this, "render", this.ce, !1, this)
    }
    v($, K);
    var sx = ["#00f", "#0ff", "#0f0", "#ff0", "#f00"];
    function tx(b, c, d) {
        var e = b + c + 1
            , f = 2 * e
            , f = Pf(f, f);
        f.shadowOffsetX = f.shadowOffsetY = d;
        f.shadowBlur = c;
        f.shadowColor = "#000";
        f.beginPath();
        c = e - d;
        f.arc(c, c, b, 0, 2 * Math.PI, !0);
        f.fill();
        return f.canvas.toDataURL()
    }
    $.prototype.Ca = function () {
        return this.get("gradient")
    }
        ;
    $.prototype.getGradient = $.prototype.Ca;
    $.prototype.be = function () {
        for (var b = this.Ca(), c = Pf(1, 256), d = c.createLinearGradient(0, 0, 1, 256), e = 1 / (b.length - 1), f = 0, g = b.length; f < g; ++f)
            d.addColorStop(f * e, b[f]);
        c.fillStyle = d;
        c.fillRect(0, 0, 1, 256);
        this.ha = c.getImageData(0, 0, 1, 256).data
    }
        ;
    $.prototype.ce = function (b) {
        b = b.context;
        var c = b.canvas, c = b.getImageData(0, 0, c.width, c.height), d = c.data, e, f, g;
        e = 0;
        for (f = d.length; e < f; e += 4)
            if (g = 4 * d[e + 3])
                d[e] = this.ha[g],
                    d[e + 1] = this.ha[g + 1],
                    d[e + 2] = this.ha[g + 2];
        b.putImageData(c, 0, 0)
    }
        ;
    $.prototype.gc = function (b) {
        this.set("gradient", b)
    }
        ;
    $.prototype.setGradient = $.prototype.gc;
    function ux(b) {
        return [b]
    }
    ; function vx(b, c) {
        var d = c || {}
            , e = d.document || document
            , f = Gf("SCRIPT")
            , g = {
                ig: f,
                dc: void 0
            }
            , h = new ww(wx, g)
            , k = null
            , n = null != d.timeout ? d.timeout : 5E3;
        0 < n && (k = window.setTimeout(function () {
            xx(f, !0);
            var c = new yx(zx, "Timeout reached for loading script " + b);
            yw(h);
            zw(h, !1, c)
        }, n),
            g.dc = k);
        f.onload = f.onreadystatechange = function () {
            f.readyState && "loaded" != f.readyState && "complete" != f.readyState || (xx(f, d.ih || !1, k),
                yw(h),
                zw(h, !0, null))
        }
            ;
        f.onerror = function () {
            xx(f, !0, k);
            var c = new yx(Ax, "Error while loading script " + b);
            yw(h);
            zw(h, !1, c)
        }
            ;
        yf(f, {
            type: "text/javascript",
            charset: "UTF-8",
            src: b
        });
        Bx(e).appendChild(f);
        return h
    }
    function Bx(b) {
        var c = b.getElementsByTagName("HEAD");
        return c && 0 != c.length ? c[0] : b.documentElement
    }
    function wx() {
        if (this && this.ig) {
            var b = this.ig;
            b && "SCRIPT" == b.tagName && xx(b, !0, this.dc)
        }
    }
    function xx(b, c, d) {
        null != d && ba.clearTimeout(d);
        b.onload = ca;
        b.onerror = ca;
        b.onreadystatechange = ca;
        c && window.setTimeout(function () {
            Lf(b)
        }, 0)
    }
    var Ax = 0
        , zx = 1;
    function yx(b, c) {
        var d = "Jsloader error (code #" + b + ")";
        c && (d += ": " + c);
        xa.call(this, d);
        this.code = b
    }
    v(yx, xa);
    function Cx(b, c) {
        this.d = new Kr(b);
        this.a = c ? c : "callback";
        this.dc = 5E3
    }
    var Dx = 0;
    Cx.prototype.send = function (b, c, d, e) {
        b = b || null;
        e = e || "_" + (Dx++).toString(36) + ua().toString(36);
        ba._callbacks_ || (ba._callbacks_ = {});
        var f = this.d.clone();
        if (b)
            for (var g in b)
                if (!b.hasOwnProperty || b.hasOwnProperty(g)) {
                    var h = f
                        , k = g
                        , n = b[g];
                    ga(n) || (n = [String(n)]);
                    cs(h.a, k, n)
                }
        c && (ba._callbacks_[e] = Ex(e, c),
            c = this.a,
            g = "_callbacks_." + e,
            ga(g) || (g = [String(g)]),
            cs(f.a, c, g));
        c = vx(f.toString(), {
            timeout: this.dc,
            ih: !0
        });
        Cw(c, null, Fx(e, b, d), void 0);
        return {
            X: e,
            df: c
        }
    }
        ;
    Cx.prototype.cancel = function (b) {
        b && (b.df && b.df.cancel(),
            b.X && Gx(b.X, !1))
    }
        ;
    function Fx(b, c, d) {
        return function () {
            Gx(b, !1);
            d && d(c)
        }
    }
    function Ex(b, c) {
        return function (d) {
            Gx(b, !0);
            c.apply(void 0, arguments)
        }
    }
    function Gx(b, c) {
        ba._callbacks_[b] && (c ? delete ba._callbacks_[b] : ba._callbacks_[b] = ca)
    }
    ; function Hx(b) {
        var c = /\{z\}/g
            , d = /\{x\}/g
            , e = /\{y\}/g
            , f = /\{-y\}/g;
        return function (g) {
            return null === g ? void 0 : b.replace(c, g[0].toString()).replace(d, g[1].toString()).replace(e, g[2].toString()).replace(f, function () {
                return ((1 << g[0]) - g[2] - 1).toString()
            })
        }
    }
    function Ix(b) {
        return Jx(Ra(b, Hx))
    }
    function Jx(b) {
        return 1 === b.length ? b[0] : function (c, d, e) {
            return null === c ? void 0 : b[Vb((c[1] << c[0]) + c[2], b.length)](c, d, e)
        }
    }
    function Kx() { }
    function Lx(b, c) {
        var d = [0, 0, 0];
        return function (e, f, g) {
            return null === e ? void 0 : c(b(e, g, d), f, g)
        }
    }
    function Mx(b) {
        var c = []
            , d = /\{(\d)-(\d)\}/.exec(b) || /\{([a-z])-([a-z])\}/.exec(b);
        if (d) {
            var e = d[2].charCodeAt(0), f;
            for (f = d[1].charCodeAt(0); f <= e; ++f)
                c.push(b.replace(d[0], String.fromCharCode(f)))
        } else
            c.push(b);
        return c
    }
    ; function Nx(b) {
        Eo.call(this);
        this.f = m(b) ? b : 2048
    }
    v(Nx, Eo);
    function Ox(b) {
        return b.Tb() > b.f
    }
    function Px(b, c) {
        for (var d, e; Ox(b) && !(d = b.a.fc,
            e = d.a[0].toString(),
            e in c && c[e].contains(d.a));)
            b.pop().Ec()
    }
    ; function Qx(b) {
        $i.call(this, {
            attributions: b.attributions,
            extent: b.extent,
            logo: b.logo,
            opaque: b.opaque,
            projection: b.projection,
            state: m(b.state) ? b.state : void 0,
            tileGrid: b.tileGrid,
            tilePixelRatio: b.tilePixelRatio
        });
        this.tileUrlFunction = m(b.tileUrlFunction) ? b.tileUrlFunction : Kx;
        this.crossOrigin = m(b.crossOrigin) ? b.crossOrigin : null;
        this.b = new Nx;
        this.tileLoadFunction = m(b.tileLoadFunction) ? b.tileLoadFunction : Rx;
        this.tileClass = m(b.tileClass) ? b.tileClass : Wv
    }
    v(Qx, $i);
    function Rx(b, c) {
        b.Qa().src = c
    }
    l = Qx.prototype;
    l.Dd = function () {
        return Ox(this.b)
    }
        ;
    l.Be = function (b) {
        Px(this.b, b)
    }
        ;
    l.Fb = function (b, c, d, e, f) {
        var g = this.ib(b, c, d);
        if (Bo(this.b, g))
            return this.b.get(g);
        b = [b, c, d];
        e = this.tileUrlFunction(b, e, f);
        e = new this.tileClass(b, m(e) ? 0 : 4, m(e) ? e : "", this.crossOrigin, this.tileLoadFunction);
        this.b.set(g, e);
        return e
    }
        ;
    l.jb = function () {
        return this.tileLoadFunction
    }
        ;
    l.kb = function () {
        return this.tileUrlFunction
    }
        ;
    l.pb = function (b) {
        this.b.clear();
        this.tileLoadFunction = b;
        this.o()
    }
        ;
    l.sa = function (b) {
        this.b.clear();
        this.tileUrlFunction = b;
        this.o()
    }
        ;
    l.Oe = function (b, c, d) {
        b = this.ib(b, c, d);
        Bo(this.b, b) && this.b.get(b)
    }
        ;
    function Sx(b) {
        var c = m(b.extent) ? b.extent : Il
            , d = Yi(c, b.maxZoom, b.tileSize);
        Ri.call(this, {
            minZoom: b.minZoom,
            origin: je(c, "top-left"),
            resolutions: d,
            tileSize: b.tileSize
        })
    }
    v(Sx, Ri);
    Sx.prototype.Cb = function (b) {
        b = m(b) ? b : {};
        var c = this.minZoom
            , d = this.maxZoom
            , e = m(b.wrapX) ? b.wrapX : !0
            , f = null;
        if (m(b.extent)) {
            var f = Array(d + 1), g;
            for (g = 0; g <= d; ++g)
                f[g] = g < c ? null : Ui(this, b.extent, g)
        }
        return function (b, g, n) {
            g = b[0];
            if (g < c || d < g)
                return null;
            var p = Math.pow(2, g)
                , q = b[1];
            if (e)
                q = Vb(q, p);
            else if (0 > q || p <= q)
                return null;
            b = b[2];
            return b < -p || -1 < b || null !== f && !nf(f[g], q, b) ? null : gf(g, q, -b - 1, n)
        }
    }
        ;
    Sx.prototype.md = function (b, c) {
        if (b[0] < this.maxZoom) {
            var d = 2 * b[1]
                , e = 2 * b[2];
            return mf(d, d + 1, e, e + 1, c)
        }
        return null
    }
        ;
    Sx.prototype.bd = function (b, c, d, e) {
        e = mf(0, b[1], 0, b[2], e);
        for (b = b[0] - 1; b >= this.minZoom; --b)
            if (e.a = e.c >>= 1,
                e.b = e.d >>= 1,
                c.call(d, b, e))
                return !0;
        return !1
    }
        ;
    function Tx(b) {
        Qx.call(this, {
            crossOrigin: "anonymous",
            opaque: !0,
            projection: Be("EPSG:3857"),
            state: "loading",
            tileLoadFunction: b.tileLoadFunction
        });
        this.c = m(b.culture) ? b.culture : "en-us";
        this.a = m(b.maxZoom) ? b.maxZoom : -1;
        this.j = m(b.wrapX) ? b.wrapX : !0;
        var c = new Kr((Qb ? "https:" : "http:") + "//dev.virtualearth.net/REST/v1/Imagery/Metadata/" + b.imagerySet);
        (new Cx(c, "jsonp")).send({
            include: "ImageryProviders",
            uriScheme: Qb ? "https" : "http",
            key: b.key
        }, ra(this.e, this))
    }
    v(Tx, Qx);
    var Ux = new qf({
        html: '<a class="ol-attribution-bing-tos" href="http://www.microsoft.com/maps/product/terms.html">Terms of Use</a>'
    });
    Tx.prototype.e = function (b) {
        if (200 != b.statusCode || "OK" != b.statusDescription || "ValidCredentials" != b.authenticationResultCode || 1 != b.resourceSets.length || 1 != b.resourceSets[0].resources.length)
            Li(this, "error");
        else {
            var c = b.brandLogoUri
                , d = b.resourceSets[0].resources[0]
                , e = -1 == this.a ? d.zoomMax : this.a
                , f = new Sx({
                    extent: Zi(this.g),
                    minZoom: d.zoomMin,
                    maxZoom: e,
                    tileSize: d.imageWidth
                });
            this.tileGrid = f;
            var g = this.c;
            this.tileUrlFunction = Lx(f.Cb({
                wrapX: this.j
            }), Jx(Ra(d.imageUrlSubdomains, function (b) {
                var c = d.imageUrl.replace("{subdomain}", b).replace("{culture}", g);
                return function (b) {
                    return null === b ? void 0 : c.replace("{quadkey}", jf(b))
                }
            })));
            if (d.imageryProviders) {
                var h = Ae(Be("EPSG:4326"), this.g);
                b = Ra(d.imageryProviders, function (b) {
                    var c = b.attribution
                        , d = {};
                    Oa(b.coverageAreas, function (b) {
                        var c = b.zoomMin
                            , g = Math.min(b.zoomMax, e);
                        b = b.bbox;
                        b = se([b[1], b[0], b[3], b[2]], h);
                        var k, n;
                        for (k = c; k <= g; ++k)
                            n = k.toString(),
                                c = Ui(f, b, k),
                                n in d ? d[n].push(c) : d[n] = [c]
                    });
                    return new qf({
                        html: c,
                        tileRanges: d
                    })
                });
                b.push(Ux);
                this.f = b
            }
            this.r = c;
            Li(this, "ready")
        }
    }
        ;
    function Vx(b) {
        fn.call(this, {
            attributions: b.attributions,
            extent: b.extent,
            logo: b.logo,
            projection: b.projection
        });
        this.l = void 0;
        this.q = m(b.distance) ? b.distance : 20;
        this.a = [];
        this.p = b.source;
        this.p.u("change", Vx.prototype.s, this)
    }
    v(Vx, fn);
    Vx.prototype.Hb = function (b, c, d) {
        c !== this.l && (this.clear(),
            this.l = c,
            this.p.Hb(b, c, d),
            Wx(this),
            this.Ea(this.a))
    }
        ;
    Vx.prototype.s = function () {
        this.clear();
        Wx(this);
        this.Ea(this.a);
        this.o()
    }
        ;
    function Wx(b) {
        if (m(b.l)) {
            b.a.length = 0;
            for (var c = Rd(), d = b.q * b.l, e = b.p.ya(), f = {}, g = 0, h = e.length; g < h; g++) {
                var k = e[g];
                ob(f, ma(k).toString()) || (k = k.N().K(),
                    ae(k, c),
                    Vd(c, d, c),
                    k = cn(b.p.b, c),
                    k = Pa(k, function (b) {
                        b = ma(b).toString();
                        return b in f ? !1 : f[b] = !0
                    }),
                    b.a.push(Xx(k)))
            }
        }
    }
    function Xx(b) {
        for (var c = b.length, d = [0, 0], e = 0; e < c; e++) {
            var f = b[e].N().K();
            ud(d, f)
        }
        c = 1 / c;
        d[0] *= c;
        d[1] *= c;
        d = new P(new Ek(d));
        d.set("features", b);
        return d
    }
    ; function Yx(b, c, d) {
        if (ka(b))
            d && (b = ra(b, d));
        else if (b && "function" == typeof b.handleEvent)
            b = ra(b.handleEvent, b);
        else
            throw Error("Invalid listener argument");
        return 2147483647 < c ? -1 : ba.setTimeout(b, c || 0)
    }
    ; function Zx() { }
    Zx.prototype.a = null;
    function $x(b) {
        var c;
        (c = b.a) || (c = {},
            ay(b) && (c[0] = !0,
                c[1] = !0),
            c = b.a = c);
        return c
    }
    ; var by;
    function cy() { }
    v(cy, Zx);
    function dy(b) {
        return (b = ay(b)) ? new ActiveXObject(b) : new XMLHttpRequest
    }
    function ay(b) {
        if (!b.d && "undefined" == typeof XMLHttpRequest && "undefined" != typeof ActiveXObject) {
            for (var c = ["MSXML2.XMLHTTP.6.0", "MSXML2.XMLHTTP.3.0", "MSXML2.XMLHTTP", "Microsoft.XMLHTTP"], d = 0; d < c.length; d++) {
                var e = c[d];
                try {
                    return new ActiveXObject(e),
                        b.d = e
                } catch (f) { }
            }
            throw Error("Could not create ActiveXObject. ActiveX might be disabled, or MSXML might not be installed");
        }
        return b.d
    }
    by = new cy;
    function ey(b) {
        ed.call(this);
        this.r = new uh;
        this.i = b || null;
        this.a = !1;
        this.j = this.T = null;
        this.f = this.p = "";
        this.d = this.l = this.c = this.n = !1;
        this.g = 0;
        this.b = null;
        this.e = fy;
        this.q = this.s = !1
    }
    v(ey, ed);
    var fy = ""
        , gy = /^https?$/i
        , hy = ["POST", "PUT"];
    l = ey.prototype;
    l.send = function (b, c, d, e) {
        if (this.T)
            throw Error("[goog.net.XhrIo] Object is active with another request=" + this.p + "; newUri=" + b);
        c = c ? c.toUpperCase() : "GET";
        this.p = b;
        this.f = "";
        this.n = !1;
        this.a = !0;
        this.T = this.i ? dy(this.i) : dy(by);
        this.j = this.i ? $x(this.i) : $x(by);
        this.T.onreadystatechange = ra(this.Qf, this);
        try {
            this.l = !0,
                this.T.open(c, String(b), !0),
                this.l = !1
        } catch (f) {
            iy(this, f);
            return
        }
        b = d || "";
        var g = this.r.clone();
        e && th(e, function (b, c) {
            g.set(c, b)
        });
        e = Ta(g.J());
        d = ba.FormData && b instanceof ba.FormData;
        !Va(hy, c) || e || d || g.set("Content-Type", "application/x-www-form-urlencoded;charset=utf-8");
        g.forEach(function (b, c) {
            this.T.setRequestHeader(c, b)
        }, this);
        this.e && (this.T.responseType = this.e);
        "withCredentials" in this.T && (this.T.withCredentials = this.s);
        try {
            jy(this),
                0 < this.g && ((this.q = ky(this.T)) ? (this.T.timeout = this.g,
                    this.T.ontimeout = ra(this.dc, this)) : this.b = Yx(this.dc, this.g, this)),
                this.c = !0,
                this.T.send(b),
                this.c = !1
        } catch (h) {
            iy(this, h)
        }
    }
        ;
    function ky(b) {
        return Bb && Mb(9) && ja(b.timeout) && m(b.ontimeout)
    }
    function Ua(b) {
        return "content-type" == b.toLowerCase()
    }
    l.dc = function () {
        "undefined" != typeof aa && this.T && (this.f = "Timed out after " + this.g + "ms, aborting",
            this.dispatchEvent("timeout"),
            this.T && this.a && (this.a = !1,
                this.d = !0,
                this.T.abort(),
                this.d = !1,
                this.dispatchEvent("complete"),
                this.dispatchEvent("abort"),
                ly(this)))
    }
        ;
    function iy(b, c) {
        b.a = !1;
        b.T && (b.d = !0,
            b.T.abort(),
            b.d = !1);
        b.f = c;
        my(b);
        ly(b)
    }
    function my(b) {
        b.n || (b.n = !0,
            b.dispatchEvent("complete"),
            b.dispatchEvent("error"))
    }
    l.M = function () {
        this.T && (this.a && (this.a = !1,
            this.d = !0,
            this.T.abort(),
            this.d = !1),
            ly(this, !0));
        ey.R.M.call(this)
    }
        ;
    l.Qf = function () {
        this.oa || (this.l || this.c || this.d ? ny(this) : this.Kk())
    }
        ;
    l.Kk = function () {
        ny(this)
    }
        ;
    function ny(b) {
        if (b.a && "undefined" != typeof aa && (!b.j[1] || 4 != oy(b) || 2 != py(b)))
            if (b.c && 4 == oy(b))
                Yx(b.Qf, 0, b);
            else if (b.dispatchEvent("readystatechange"),
                4 == oy(b)) {
                b.a = !1;
                try {
                    if (qy(b))
                        b.dispatchEvent("complete"),
                            b.dispatchEvent("success");
                    else {
                        var c;
                        try {
                            c = 2 < oy(b) ? b.T.statusText : ""
                        } catch (d) {
                            c = ""
                        }
                        b.f = c + " [" + py(b) + "]";
                        my(b)
                    }
                } finally {
                    ly(b)
                }
            }
    }
    function ly(b, c) {
        if (b.T) {
            jy(b);
            var d = b.T
                , e = b.j[0] ? ca : null;
            b.T = null;
            b.j = null;
            c || b.dispatchEvent("ready");
            try {
                d.onreadystatechange = e
            } catch (f) { }
        }
    }
    function jy(b) {
        b.T && b.q && (b.T.ontimeout = null);
        ja(b.b) && (ba.clearTimeout(b.b),
            b.b = null)
    }
    function qy(b) {
        var c = py(b), d;
        a: switch (c) {
            case 200:
            case 201:
            case 202:
            case 204:
            case 206:
            case 304:
            case 1223:
                d = !0;
                break a;
            default:
                d = !1
        }
        if (!d) {
            if (c = 0 === c)
                b = Er(String(b.p))[1] || null,
                    !b && self.location && (b = self.location.protocol,
                        b = b.substr(0, b.length - 1)),
                    c = !gy.test(b ? b.toLowerCase() : "");
            d = c
        }
        return d
    }
    function oy(b) {
        return b.T ? b.T.readyState : 0
    }
    function py(b) {
        try {
            return 2 < oy(b) ? b.T.status : -1
        } catch (c) {
            return -1
        }
    }
    function ry(b) {
        try {
            return b.T ? b.T.responseText : ""
        } catch (c) {
            return ""
        }
    }
    function sy(b) {
        try {
            if (!b.T)
                return null;
            if ("response" in b.T)
                return b.T.response;
            switch (b.e) {
                case fy:
                case "text":
                    return b.T.responseText;
                case "arraybuffer":
                    if ("mozResponseArrayBuffer" in b.T)
                        return b.T.mozResponseArrayBuffer
            }
            return null
        } catch (c) {
            return null
        }
    }
    ; function ty(b) {
        fn.call(this, {
            attributions: b.attributions,
            logo: b.logo,
            projection: b.projection
        });
        this.format = b.format
    }
    v(ty, fn);
    function uy(b, c, d, e, f) {
        var g = new ey;
        g.e = "binary" == b.format.I() && Yf ? "arraybuffer" : "text";
        w(g, "complete", function (b) {
            b = b.target;
            if (qy(b)) {
                var c = this.format.I(), g;
                if ("binary" == c && Yf)
                    g = sy(b);
                else if ("json" == c)
                    g = ry(b);
                else if ("text" == c)
                    g = ry(b);
                else if ("xml" == c) {
                    if (!Bb)
                        try {
                            g = b.T ? b.T.responseXML : null
                        } catch (p) {
                            g = null
                        }
                    null != g || (g = eq(ry(b)))
                }
                null != g ? d.call(f, this.a(g)) : Li(this, "error")
            } else
                e.call(f);
            oc(b)
        }, !1, b);
        g.send(c)
    }
    ty.prototype.a = function (b) {
        return this.format.ma(b, {
            featureProjection: this.g
        })
    }
        ;
    function vy(b) {
        ty.call(this, {
            attributions: b.attributions,
            format: b.format,
            logo: b.logo,
            projection: b.projection
        });
        m(b.arrayBuffer) && this.gb(this.a(b.arrayBuffer));
        m(b.doc) && this.gb(this.a(b.doc));
        m(b.node) && this.gb(this.a(b.node));
        m(b.object) && this.gb(this.a(b.object));
        m(b.text) && this.gb(this.a(b.text));
        if (m(b.url) || m(b.urls))
            if (Li(this, "loading"),
                m(b.url) && uy(this, b.url, this.p, this.l, this),
                m(b.urls)) {
                b = b.urls;
                var c, d;
                c = 0;
                for (d = b.length; c < d; ++c)
                    uy(this, b[c], this.p, this.l, this)
            }
    }
    v(vy, ty);
    vy.prototype.l = function () {
        Li(this, "error")
    }
        ;
    vy.prototype.p = function (b) {
        this.gb(b);
        Li(this, "ready")
    }
        ;
    function wy(b) {
        b = m(b) ? b : {};
        vy.call(this, {
            attributions: b.attributions,
            extent: b.extent,
            format: new Ap({
                defaultDataProjection: b.defaultProjection
            }),
            logo: b.logo,
            object: b.object,
            projection: b.projection,
            text: b.text,
            url: b.url,
            urls: b.urls
        })
    }
    v(wy, vy);
    function xy(b) {
        b = m(b) ? b : {};
        vy.call(this, {
            attributions: b.attributions,
            doc: b.doc,
            extent: b.extent,
            format: new Pq,
            logo: b.logo,
            node: b.node,
            projection: b.projection,
            text: b.text,
            url: b.url,
            urls: b.urls
        })
    }
    v(xy, vy);
    function yy(b) {
        b = m(b) ? b : {};
        vy.call(this, {
            format: new zr({
                altitudeMode: b.altitudeMode
            }),
            projection: b.projection,
            text: b.text,
            url: b.url,
            urls: b.urls
        })
    }
    v(yy, vy);
    function zy(b) {
        Wm.call(this, {
            projection: b.projection,
            resolutions: b.resolutions
        });
        this.s = m(b.crossOrigin) ? b.crossOrigin : null;
        this.e = m(b.displayDpi) ? b.displayDpi : 96;
        this.c = m(b.params) ? b.params : {};
        var c;
        m(b.url) ? c = Xv(b.url, this.c, ra(this.Kj, this)) : c = Yv;
        this.p = c;
        this.a = m(b.imageLoadFunction) ? b.imageLoadFunction : Ym;
        this.F = m(b.hidpi) ? b.hidpi : !0;
        this.q = m(b.metersPerUnit) ? b.metersPerUnit : 1;
        this.i = m(b.ratio) ? b.ratio : 1;
        this.H = m(b.useOverlay) ? b.useOverlay : !1;
        this.b = null;
        this.l = 0
    }
    v(zy, Wm);
    l = zy.prototype;
    l.Jj = function () {
        return this.c
    }
        ;
    l.rc = function (b, c, d, e) {
        c = Xm(this, c);
        d = this.F ? d : 1;
        var f = this.b;
        if (null !== f && this.l == this.d && f.resolution == c && f.f == d && Yd(f.D(), b))
            return f;
        1 != this.i && (b = b.slice(),
            re(b, this.i));
        e = this.p(b, [pe(b) / c * d, me(b) / c * d], e);
        m(e) ? f = new Vv(b, c, d, this.f, e, this.s, this.a) : f = null;
        this.b = f;
        this.l = this.d;
        return f
    }
        ;
    l.Ij = function () {
        return this.a
    }
        ;
    l.Mj = function (b) {
        yb(this.c, b);
        this.o()
    }
        ;
    l.Kj = function (b, c, d, e) {
        var f;
        f = this.q;
        var g = pe(d)
            , h = me(d)
            , k = e[0]
            , n = e[1]
            , p = .0254 / this.e;
        f = n * g > k * h ? g * f / (k * p) : h * f / (n * p);
        d = ie(d);
        e = {
            OPERATION: this.H ? "GETDYNAMICMAPOVERLAYIMAGE" : "GETMAPIMAGE",
            VERSION: "2.0.0",
            LOCALE: "en",
            CLIENTAGENT: "ol.source.ImageMapGuide source",
            CLIP: "1",
            SETDISPLAYDPI: this.e,
            SETDISPLAYWIDTH: Math.round(e[0]),
            SETDISPLAYHEIGHT: Math.round(e[1]),
            SETVIEWSCALE: f,
            SETVIEWCENTERX: d[0],
            SETVIEWCENTERY: d[1]
        };
        yb(e, c);
        return Hr(Jr([b], e))
    }
        ;
    l.Lj = function (b) {
        this.b = null;
        this.a = b;
        this.o()
    }
        ;
    function Ay(b) {
        var c = m(b.attributions) ? b.attributions : null, d = b.imageExtent, e, f;
        m(b.imageSize) && (e = me(d) / b.imageSize[1],
            f = [e]);
        var g = m(b.crossOrigin) ? b.crossOrigin : null
            , h = m(b.imageLoadFunction) ? b.imageLoadFunction : Ym;
        Wm.call(this, {
            attributions: c,
            logo: b.logo,
            projection: Be(b.projection),
            resolutions: f
        });
        this.a = new Vv(d, e, 1, c, b.url, g, h)
    }
    v(Ay, Wm);
    Ay.prototype.rc = function (b) {
        return oe(b, this.a.D()) ? this.a : null
    }
        ;
    function By(b) {
        b = m(b) ? b : {};
        Wm.call(this, {
            attributions: b.attributions,
            logo: b.logo,
            projection: b.projection,
            resolutions: b.resolutions
        });
        this.F = m(b.crossOrigin) ? b.crossOrigin : null;
        this.c = b.url;
        this.i = m(b.imageLoadFunction) ? b.imageLoadFunction : Ym;
        this.a = b.params;
        this.e = !0;
        Cy(this);
        this.s = b.serverType;
        this.H = m(b.hidpi) ? b.hidpi : !0;
        this.b = null;
        this.l = [0, 0];
        this.q = 0;
        this.p = m(b.ratio) ? b.ratio : 1.5
    }
    v(By, Wm);
    var Dy = [101, 101];
    l = By.prototype;
    l.Sj = function (b, c, d, e) {
        if (m(this.c)) {
            var f = le(b, c, 0, Dy)
                , g = {
                    SERVICE: "WMS",
                    VERSION: "1.3.0",
                    REQUEST: "GetFeatureInfo",
                    FORMAT: "image/png",
                    TRANSPARENT: !0,
                    QUERY_LAYERS: this.a.LAYERS
                };
            yb(g, this.a, e);
            e = Math.floor((f[3] - b[1]) / c);
            g[this.e ? "I" : "X"] = Math.floor((b[0] - f[0]) / c);
            g[this.e ? "J" : "Y"] = e;
            return Ey(this, f, Dy, 1, Be(d), g)
        }
    }
        ;
    l.Uj = function () {
        return this.a
    }
        ;
    l.rc = function (b, c, d, e) {
        if (!m(this.c))
            return null;
        c = Xm(this, c);
        1 == d || this.H && m(this.s) || (d = 1);
        var f = this.b;
        if (null !== f && this.q == this.d && f.resolution == c && f.f == d && Yd(f.D(), b))
            return f;
        f = {
            SERVICE: "WMS",
            VERSION: "1.3.0",
            REQUEST: "GetMap",
            FORMAT: "image/png",
            TRANSPARENT: !0
        };
        yb(f, this.a);
        b = b.slice();
        var g = (b[0] + b[2]) / 2
            , h = (b[1] + b[3]) / 2;
        if (1 != this.p) {
            var k = this.p * pe(b) / 2
                , n = this.p * me(b) / 2;
            b[0] = g - k;
            b[1] = h - n;
            b[2] = g + k;
            b[3] = h + n
        }
        var k = c / d
            , n = Math.ceil(pe(b) / k)
            , p = Math.ceil(me(b) / k);
        b[0] = g - k * n / 2;
        b[2] = g + k * n / 2;
        b[1] = h - k * p / 2;
        b[3] = h + k * p / 2;
        this.l[0] = n;
        this.l[1] = p;
        e = Ey(this, b, this.l, d, e, f);
        this.b = new Vv(b, c, d, this.f, e, this.F, this.i);
        this.q = this.d;
        return this.b
    }
        ;
    l.Tj = function () {
        return this.i
    }
        ;
    function Ey(b, c, d, e, f, g) {
        g[b.e ? "CRS" : "SRS"] = f.a;
        "STYLES" in b.a || (g.STYLES = new String(""));
        if (1 != e)
            switch (b.s) {
                case "geoserver":
                    g.FORMAT_OPTIONS = "dpi:" + (90 * e + .5 | 0);
                    break;
                case "mapserver":
                    g.MAP_RESOLUTION = 90 * e;
                    break;
                case "carmentaserver":
                case "qgis":
                    g.DPI = 90 * e
            }
        g.WIDTH = d[0];
        g.HEIGHT = d[1];
        d = f.b;
        var h;
        b.e && "ne" == d.substr(0, 2) ? h = [c[1], c[0], c[3], c[2]] : h = c;
        g.BBOX = h.join(",");
        return Hr(Jr([b.c], g))
    }
    l.Vj = function () {
        return this.c
    }
        ;
    l.Wj = function (b) {
        this.b = null;
        this.i = b;
        this.o()
    }
        ;
    l.Xj = function (b) {
        b != this.c && (this.c = b,
            this.b = null,
            this.o())
    }
        ;
    l.Yj = function (b) {
        yb(this.a, b);
        Cy(this);
        this.b = null;
        this.o()
    }
        ;
    function Cy(b) {
        b.e = 0 <= Ka(ub(b.a, "VERSION", "1.3.0"), "1.3")
    }
    ; function Fy(b) {
        b = m(b) ? b : {};
        vy.call(this, {
            attributions: b.attributions,
            doc: b.doc,
            format: new es({
                extractStyles: b.extractStyles,
                defaultStyle: b.defaultStyle
            }),
            logo: b.logo,
            node: b.node,
            projection: b.projection,
            text: b.text,
            url: b.url,
            urls: b.urls
        })
    }
    v(Fy, vy);
    function Gy(b) {
        var c = m(b.projection) ? b.projection : "EPSG:3857"
            , d = new Sx({
                extent: Zi(c),
                maxZoom: b.maxZoom,
                tileSize: b.tileSize
            });
        Qx.call(this, {
            attributions: b.attributions,
            crossOrigin: b.crossOrigin,
            logo: b.logo,
            projection: c,
            tileGrid: d,
            tileLoadFunction: b.tileLoadFunction,
            tilePixelRatio: b.tilePixelRatio,
            tileUrlFunction: Kx
        });
        this.c = d.Cb({
            wrapX: b.wrapX
        });
        m(b.tileUrlFunction) ? this.sa(b.tileUrlFunction) : m(b.urls) ? this.sa(Ix(b.urls)) : m(b.url) && this.a(b.url)
    }
    v(Gy, Qx);
    Gy.prototype.sa = function (b) {
        Gy.R.sa.call(this, Lx(this.c, b))
    }
        ;
    Gy.prototype.a = function (b) {
        this.sa(Ix(Mx(b)))
    }
        ;
    function Hy(b) {
        b = m(b) ? b : {};
        var c;
        m(b.attributions) ? c = b.attributions : c = [Iy];
        var d = Qb ? "https:" : "http:";
        Gy.call(this, {
            attributions: c,
            crossOrigin: m(b.crossOrigin) ? b.crossOrigin : "anonymous",
            opaque: !0,
            maxZoom: m(b.maxZoom) ? b.maxZoom : 19,
            tileLoadFunction: b.tileLoadFunction,
            url: m(b.url) ? b.url : d + "//{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png",
            wrapX: b.wrapX
        })
    }
    v(Hy, Gy);
    var Iy = new qf({
        html: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors.'
    });
    function Jy(b) {
        b = m(b) ? b : {};
        var c = Ky[b.layer]
            , d = Qb ? "https:" : "http:";
        Gy.call(this, {
            attributions: c.attributions,
            crossOrigin: "anonymous",
            logo: "//developer.mapquest.com/content/osm/mq_logo.png",
            maxZoom: c.maxZoom,
            opaque: !0,
            tileLoadFunction: b.tileLoadFunction,
            url: m(b.url) ? b.url : d + "//otile{1-4}-s.mqcdn.com/tiles/1.0.0/" + b.layer + "/{z}/{x}/{y}.jpg"
        })
    }
    v(Jy, Gy);
    var Ly = new qf({
        html: 'Tiles Courtesy of <a href="http://www.mapquest.com/">MapQuest</a>'
    })
        , Ky = {
            osm: {
                maxZoom: 19,
                attributions: [Ly, Iy]
            },
            sat: {
                maxZoom: 18,
                attributions: [Ly, new qf({
                    html: "Portions Courtesy NASA/JPL-Caltech and U.S. Depart. of Agriculture, Farm Service Agency"
                })]
            },
            hyb: {
                maxZoom: 18,
                attributions: [Ly, Iy]
            }
        };
    function My(b) {
        b = m(b) ? b : {};
        vy.call(this, {
            attributions: b.attributions,
            doc: b.doc,
            format: new Ot,
            logo: b.logo,
            node: b.node,
            projection: b.projection,
            text: b.text,
            url: b.url,
            urls: b.urls
        })
    }
    v(My, vy);
    function Ny(b) {
        ty.call(this, {
            attributions: b.attributions,
            format: b.format,
            logo: b.logo,
            projection: b.projection
        });
        this.p = new an;
        this.q = b.loader;
        this.s = m(b.strategy) ? b.strategy : ux;
        this.l = {}
    }
    v(Ny, ty);
    Ny.prototype.gb = function (b) {
        var c = [], d, e;
        d = 0;
        for (e = b.length; d < e; ++d) {
            var f = b[d]
                , g = f.X;
            m(g) ? g in this.l || (c.push(f),
                this.l[g] = !0) : c.push(f)
        }
        Ny.R.gb.call(this, c)
    }
        ;
    Ny.prototype.clear = function (b) {
        sb(this.l);
        this.p.clear();
        Ny.R.clear.call(this, b)
    }
        ;
    Ny.prototype.Hb = function (b, c, d) {
        var e = this.p;
        b = this.s(b, c);
        var f, g;
        f = 0;
        for (g = b.length; f < g; ++f) {
            var h = b[f];
            en(e, h, function (b) {
                return Yd(b.extent, h)
            }) || (this.q.call(this, h, c, d),
                e.ra(h, {
                    extent: h.slice()
                }))
        }
    }
        ;
    var Oy = {
        terrain: {
            Ya: "jpg",
            opaque: !0
        },
        "terrain-background": {
            Ya: "jpg",
            opaque: !0
        },
        "terrain-labels": {
            Ya: "png",
            opaque: !1
        },
        "terrain-lines": {
            Ya: "png",
            opaque: !1
        },
        "toner-background": {
            Ya: "png",
            opaque: !0
        },
        toner: {
            Ya: "png",
            opaque: !0
        },
        "toner-hybrid": {
            Ya: "png",
            opaque: !1
        },
        "toner-labels": {
            Ya: "png",
            opaque: !1
        },
        "toner-lines": {
            Ya: "png",
            opaque: !1
        },
        "toner-lite": {
            Ya: "png",
            opaque: !0
        },
        watercolor: {
            Ya: "jpg",
            opaque: !0
        }
    }
        , Py = {
            terrain: {
                minZoom: 4,
                maxZoom: 18
            },
            toner: {
                minZoom: 0,
                maxZoom: 20
            },
            watercolor: {
                minZoom: 3,
                maxZoom: 16
            }
        };
    function Qy(b) {
        var c = b.layer.indexOf("-")
            , d = Oy[b.layer]
            , e = Qb ? "https://stamen-tiles-{a-d}.a.ssl.fastly.net/" : "http://{a-d}.tile.stamen.com/";
        Gy.call(this, {
            attributions: Ry,
            crossOrigin: "anonymous",
            maxZoom: Py[-1 == c ? b.layer : b.layer.slice(0, c)].maxZoom,
            opaque: d.opaque,
            tileLoadFunction: b.tileLoadFunction,
            url: m(b.url) ? b.url : e + b.layer + "/{z}/{x}/{y}." + d.Ya
        })
    }
    v(Qy, Gy);
    var Ry = [new qf({
        html: 'Map tiles by <a href="http://stamen.com/">Stamen Design</a>, under <a href="http://creativecommons.org/licenses/by/3.0/">CC BY 3.0</a>.'
    }), Iy];
    function Sy(b, c) {
        Pi.call(this, b, 2);
        this.b = c.va(b[0]);
        this.d = {}
    }
    v(Sy, Pi);
    Sy.prototype.Qa = function (b) {
        b = m(b) ? ma(b) : -1;
        if (b in this.d)
            return this.d[b];
        var c = this.b
            , d = Pf(c, c);
        d.strokeStyle = "black";
        d.strokeRect(.5, .5, c + .5, c + .5);
        d.fillStyle = "black";
        d.textAlign = "center";
        d.textBaseline = "middle";
        d.font = "24px sans-serif";
        d.fillText(kf(this.a), c / 2, c / 2);
        return this.d[b] = d.canvas
    }
        ;
    function Ty(b) {
        $i.call(this, {
            opaque: !1,
            projection: b.projection,
            tileGrid: b.tileGrid
        });
        this.a = new Nx
    }
    v(Ty, $i);
    Ty.prototype.Dd = function () {
        return Ox(this.a)
    }
        ;
    Ty.prototype.Be = function (b) {
        Px(this.a, b)
    }
        ;
    Ty.prototype.Fb = function (b, c, d) {
        var e = this.ib(b, c, d);
        if (Bo(this.a, e))
            return this.a.get(e);
        b = new Sy([b, c, d], this.tileGrid);
        this.a.set(e, b);
        return b
    }
        ;
    function Uy(b) {
        Qx.call(this, {
            crossOrigin: b.crossOrigin,
            projection: Be("EPSG:3857"),
            state: "loading",
            tileLoadFunction: b.tileLoadFunction
        });
        this.a = b.wrapX;
        (new Cx(b.url)).send(void 0, ra(this.c, this))
    }
    v(Uy, Qx);
    Uy.prototype.c = function (b) {
        var c = Be("EPSG:4326"), d = this.g, e;
        m(b.bounds) && (e = se(b.bounds, Ae(c, d)));
        var f = b.minzoom || 0
            , g = b.maxzoom || 22;
        this.tileGrid = d = new Sx({
            extent: Zi(d),
            maxZoom: g,
            minZoom: f
        });
        this.tileUrlFunction = Lx(d.Cb({
            extent: e,
            wrapX: this.a
        }), Ix(b.tiles));
        if (m(b.attribution)) {
            c = m(e) ? e : c.D();
            e = {};
            for (var h; f <= g; ++f)
                h = f.toString(),
                    e[h] = [Ui(d, c, f)];
            this.f = [new qf({
                html: b.attribution,
                tileRanges: e
            })]
        }
        Li(this, "ready")
    }
        ;
    function Vy(b) {
        $i.call(this, {
            projection: Be("EPSG:3857"),
            state: "loading"
        });
        this.e = m(b.preemptive) ? b.preemptive : !0;
        this.b = Kx;
        this.a = new Nx;
        this.c = void 0;
        (new Cx(b.url)).send(void 0, ra(this.Zj, this))
    }
    v(Vy, $i);
    l = Vy.prototype;
    l.Dd = function () {
        return Ox(this.a)
    }
        ;
    l.Be = function (b) {
        Px(this.a, b)
    }
        ;
    l.Ph = function () {
        return this.c
    }
        ;
    l.nh = function (b, c, d, e, f) {
        null === this.tileGrid ? !0 === f ? oh(function () {
            d.call(e, null)
        }) : d.call(e, null) : (c = this.tileGrid.Vb(b, c),
            Wy(this.Fb(c[0], c[1], c[2], 1, this.g), b, d, e, f))
    }
        ;
    l.Zj = function (b) {
        var c = Be("EPSG:4326"), d = this.g, e;
        m(b.bounds) && (e = se(b.bounds, Ae(c, d)));
        var f = b.minzoom || 0
            , g = b.maxzoom || 22;
        this.tileGrid = d = new Sx({
            extent: Zi(d),
            maxZoom: g,
            minZoom: f
        });
        this.c = b.template;
        var h = b.grids;
        if (null != h) {
            this.b = Lx(d.Cb({
                extent: e
            }), Ix(h));
            if (m(b.attribution)) {
                c = m(e) ? e : c.D();
                for (e = {}; f <= g; ++f)
                    h = f.toString(),
                        e[h] = [Ui(d, c, f)];
                this.f = [new qf({
                    html: b.attribution,
                    tileRanges: e
                })]
            }
            Li(this, "ready")
        } else
            Li(this, "error")
    }
        ;
    l.Fb = function (b, c, d, e, f) {
        var g = this.ib(b, c, d);
        if (Bo(this.a, g))
            return this.a.get(g);
        b = [b, c, d];
        e = this.b(b, e, f);
        e = new Xy(b, m(e) ? 0 : 4, m(e) ? e : "", Ti(this.tileGrid, b), this.e);
        this.a.set(g, e);
        return e
    }
        ;
    l.Oe = function (b, c, d) {
        b = this.ib(b, c, d);
        Bo(this.a, b) && this.a.get(b)
    }
        ;
    function Xy(b, c, d, e, f) {
        Pi.call(this, b, c);
        this.g = d;
        this.d = e;
        this.j = f;
        this.c = this.f = this.b = null
    }
    v(Xy, Pi);
    l = Xy.prototype;
    l.Qa = function () {
        return null
    }
        ;
    function Yy(b, c) {
        if (null === b.b || null === b.f || null === b.c)
            return null;
        var d = b.b[Math.floor((1 - (c[1] - b.d[1]) / (b.d[3] - b.d[1])) * b.b.length)];
        if (!ia(d))
            return null;
        d = d.charCodeAt(Math.floor((c[0] - b.d[0]) / (b.d[2] - b.d[0]) * d.length));
        93 <= d && d--;
        35 <= d && d--;
        d = b.f[d - 32];
        return null != d ? b.c[d] : null
    }
    function Wy(b, c, d, e, f) {
        0 == b.state && !0 === f ? (Rc(b, "change", function () {
            d.call(e, Yy(this, c))
        }, !1, b),
            Zy(b)) : !0 === f ? oh(function () {
                d.call(e, Yy(this, c))
            }, b) : d.call(e, Yy(b, c))
    }
    l.nb = function () {
        return this.g
    }
        ;
    l.di = function () {
        this.state = 3;
        Qi(this)
    }
        ;
    l.pi = function (b) {
        this.b = b.grid;
        this.f = b.keys;
        this.c = b.data;
        this.state = 4;
        Qi(this)
    }
        ;
    function Zy(b) {
        0 == b.state && (b.state = 1,
            (new Cx(b.g)).send(void 0, ra(b.pi, b), ra(b.di, b)))
    }
    l.load = function () {
        this.j && Zy(this)
    }
        ;
    function $y(b) {
        ty.call(this, {
            attributions: b.attributions,
            format: b.format,
            logo: b.logo,
            projection: b.projection
        });
        this.p = b.tileGrid;
        this.q = Kx;
        this.s = this.p.Cb();
        this.l = {};
        m(b.tileUrlFunction) ? (this.q = b.tileUrlFunction,
            this.o()) : m(b.urls) ? (this.q = Ix(b.urls),
                this.o()) : m(b.url) && (this.q = Ix(Mx(b.url)),
                    this.o())
    }
    v($y, ty);
    l = $y.prototype;
    l.clear = function () {
        sb(this.l)
    }
        ;
    function az(b, c, d, e) {
        var f = b.l;
        b = b.p.Vb(c, d);
        f = f[b[0] + "/" + b[1] + "/" + b[2]];
        if (m(f))
            for (b = 0,
                d = f.length; b < d; ++b) {
                var g = f[b];
                if (g.N().Jb(c[0], c[1]) && e.call(void 0, g))
                    break
            }
    }
    l.Eb = function (b, c, d, e) {
        var f = this.p
            , g = this.l;
        c = $b(f.a, c, 0);
        b = Ui(f, b, c);
        for (var h, f = b.a; f <= b.c; ++f)
            for (h = b.b; h <= b.d; ++h) {
                var k = g[c + "/" + f + "/" + h];
                if (m(k)) {
                    var n, p;
                    n = 0;
                    for (p = k.length; n < p; ++n) {
                        var q = d.call(e, k[n]);
                        if (q)
                            return q
                    }
                }
            }
    }
        ;
    l.ya = function () {
        var b = this.l, c = [], d;
        for (d in b)
            Za(c, b[d]);
        return c
    }
        ;
    l.sh = function (b, c) {
        var d = [];
        az(this, b, c, function (b) {
            d.push(b)
        });
        return d
    }
        ;
    l.Hb = function (b, c, d) {
        function e(b, c) {
            k[b] = c;
            Li(this, "ready")
        }
        var f = this.s
            , g = this.p
            , h = this.q
            , k = this.l;
        c = $b(g.a, c, 0);
        b = Ui(g, b, c);
        var g = [c, 0, 0], n, p;
        for (n = b.a; n <= b.c; ++n)
            for (p = b.b; p <= b.d; ++p) {
                var q = c + "/" + n + "/" + p;
                if (!(q in k)) {
                    g[0] = c;
                    g[1] = n;
                    g[2] = p;
                    f(g, d, g);
                    var r = h(g, 1, d);
                    m(r) && (k[q] = [],
                        uy(this, r, sa(e, q), ca, this))
                }
            }
    }
        ;
    function bz(b) {
        b = m(b) ? b : {};
        var c = m(b.params) ? b.params : {};
        Qx.call(this, {
            attributions: b.attributions,
            crossOrigin: b.crossOrigin,
            logo: b.logo,
            opaque: !ub(c, "TRANSPARENT", !0),
            projection: b.projection,
            tileGrid: b.tileGrid,
            tileLoadFunction: b.tileLoadFunction,
            tileUrlFunction: ra(this.ck, this)
        });
        var d = b.urls;
        !m(d) && m(b.url) && (d = Mx(b.url));
        this.e = null != d ? d : [];
        this.j = m(b.gutter) ? b.gutter : 0;
        this.a = c;
        this.c = !0;
        this.i = b.serverType;
        this.p = m(b.hidpi) ? b.hidpi : !0;
        this.l = "";
        cz(this);
        this.q = Rd();
        dz(this)
    }
    v(bz, Qx);
    l = bz.prototype;
    l.$j = function (b, c, d, e) {
        d = Be(d);
        var f = this.tileGrid;
        null === f && (f = bj(this, d));
        c = f.Vb(b, c);
        if (!(f.a.length <= c[0])) {
            var g = f.na(c[0])
                , h = Ti(f, c, this.q)
                , f = f.va(c[0])
                , k = this.j;
            0 !== k && (f += 2 * k,
                h = Vd(h, g * k, h));
            k = {
                SERVICE: "WMS",
                VERSION: "1.3.0",
                REQUEST: "GetFeatureInfo",
                FORMAT: "image/png",
                TRANSPARENT: !0,
                QUERY_LAYERS: this.a.LAYERS
            };
            yb(k, this.a, e);
            e = Math.floor((h[3] - b[1]) / g);
            k[this.c ? "I" : "X"] = Math.floor((b[0] - h[0]) / g);
            k[this.c ? "J" : "Y"] = e;
            return ez(this, c, f, h, 1, d, k)
        }
    }
        ;
    l.dd = function () {
        return this.j
    }
        ;
    l.ib = function (b, c, d) {
        return this.l + bz.R.ib.call(this, b, c, d)
    }
        ;
    l.ak = function () {
        return this.a
    }
        ;
    function ez(b, c, d, e, f, g, h) {
        var k = b.e;
        if (0 != k.length) {
            h.WIDTH = d;
            h.HEIGHT = d;
            h[b.c ? "CRS" : "SRS"] = g.a;
            "STYLES" in b.a || (h.STYLES = new String(""));
            if (1 != f)
                switch (b.i) {
                    case "geoserver":
                        h.FORMAT_OPTIONS = "dpi:" + (90 * f + .5 | 0);
                        break;
                    case "mapserver":
                        h.MAP_RESOLUTION = 90 * f;
                        break;
                    case "carmentaserver":
                    case "qgis":
                        h.DPI = 90 * f
                }
            d = g.b;
            b.c && "ne" == d.substr(0, 2) && (b = e[0],
                e[0] = e[1],
                e[1] = b,
                b = e[2],
                e[2] = e[3],
                e[3] = b);
            h.BBOX = e.join(",");
            return Hr(Jr([1 == k.length ? k[0] : k[Vb((c[1] << c[0]) + c[2], k.length)]], h))
        }
    }
    l.Ic = function (b, c, d) {
        b = bz.R.Ic.call(this, b, c, d);
        return 1 != c && this.p && m(this.i) ? b * c + .5 | 0 : b
    }
        ;
    l.Th = function () {
        return this.e
    }
        ;
    function cz(b) {
        var c = 0, d = [], e, f;
        e = 0;
        for (f = b.e.length; e < f; ++e)
            d[c++] = b.e[e];
        for (var g in b.a)
            d[c++] = g + "-" + b.a[g];
        b.l = d.join("#")
    }
    l.bk = function (b) {
        b = m(b) ? Mx(b) : null;
        this.If(b)
    }
        ;
    l.If = function (b) {
        this.e = null != b ? b : [];
        cz(this);
        this.o()
    }
        ;
    l.ck = function (b, c, d) {
        var e = this.tileGrid;
        null === e && (e = bj(this, d));
        if (!(e.a.length <= b[0])) {
            1 == c || this.p && m(this.i) || (c = 1);
            var f = e.na(b[0])
                , g = Ti(e, b, this.q)
                , e = e.va(b[0])
                , h = this.j;
            0 !== h && (e += 2 * h,
                g = Vd(g, f * h, g));
            1 != c && (e = e * c + .5 | 0);
            f = {
                SERVICE: "WMS",
                VERSION: "1.3.0",
                REQUEST: "GetMap",
                FORMAT: "image/png",
                TRANSPARENT: !0
            };
            yb(f, this.a);
            return ez(this, b, e, g, c, d, f)
        }
    }
        ;
    l.dk = function (b) {
        yb(this.a, b);
        cz(this);
        dz(this);
        this.o()
    }
        ;
    function dz(b) {
        b.c = 0 <= Ka(ub(b.a, "VERSION", "1.3.0"), "1.3")
    }
    ; function fz(b) {
        b = m(b) ? b : {};
        vy.call(this, {
            attributions: b.attributions,
            extent: b.extent,
            format: new ru({
                defaultDataProjection: b.defaultProjection
            }),
            logo: b.logo,
            object: b.object,
            projection: b.projection,
            text: b.text,
            url: b.url
        })
    }
    v(fz, vy);
    function gz(b) {
        this.b = b.matrixIds;
        Ri.call(this, {
            origin: b.origin,
            origins: b.origins,
            resolutions: b.resolutions,
            tileSize: b.tileSize,
            tileSizes: b.tileSizes
        })
    }
    v(gz, Ri);
    gz.prototype.g = function () {
        return this.b
    }
        ;
    function hz(b) {
        function c(b) {
            b = "KVP" == f ? Hr(Jr([b], h)) : b.replace(/\{(\w+?)\}/g, function (b, c) {
                return c in h ? h[c] : b
            });
            return function (c) {
                if (null !== c) {
                    var d = {
                        TileMatrix: g.b[c[0]],
                        TileCol: c[1],
                        TileRow: c[2]
                    };
                    yb(d, k);
                    c = b;
                    return c = "KVP" == f ? Hr(Jr([c], d)) : c.replace(/\{(\w+?)\}/g, function (b, c) {
                        return d[c]
                    })
                }
            }
        }
        var d = m(b.version) ? b.version : "1.0.0"
            , e = m(b.format) ? b.format : "image/jpeg";
        this.a = m(b.dimensions) ? b.dimensions : {};
        this.c = "";
        iz(this);
        var f = m(b.requestEncoding) ? b.requestEncoding : "KVP"
            , g = b.tileGrid
            , h = {
                Layer: b.layer,
                Style: b.style,
                TileMatrixSet: b.matrixSet
            };
        "KVP" == f && yb(h, {
            Service: "WMTS",
            Request: "GetTile",
            Version: d,
            Format: e
        });
        var k = this.a
            , d = Kx
            , e = b.urls;
        !m(e) && m(b.url) && (e = Mx(b.url));
        m(e) && (d = Jx(Ra(e, c)));
        var n = Rd()
            , p = [0, 0, 0]
            , d = Lx(function (b, c, d) {
                if (g.a.length <= b[0])
                    return null;
                var e = b[1]
                    , f = -b[2] - 1
                    , h = Ti(g, b, n)
                    , k = c.D();
                null !== k && c.e && (c = Math.ceil(pe(k) / pe(h)),
                    e = Vb(e, c),
                    p[0] = b[0],
                    p[1] = e,
                    p[2] = b[2],
                    h = Ti(g, p, n));
                return !oe(h, k) || oe(h, k) && (h[0] == k[2] || h[2] == k[0] || h[1] == k[3] || h[3] == k[1]) ? null : gf(b[0], e, f, d)
            }, d);
        Qx.call(this, {
            attributions: b.attributions,
            crossOrigin: b.crossOrigin,
            logo: b.logo,
            projection: b.projection,
            tileClass: b.tileClass,
            tileGrid: g,
            tileLoadFunction: b.tileLoadFunction,
            tilePixelRatio: b.tilePixelRatio,
            tileUrlFunction: d
        })
    }
    v(hz, Qx);
    hz.prototype.e = function () {
        return this.a
    }
        ;
    hz.prototype.ib = function (b, c, d) {
        return this.c + hz.R.ib.call(this, b, c, d)
    }
        ;
    function iz(b) {
        var c = 0, d = [], e;
        for (e in b.a)
            d[c++] = e + "-" + b.a[e];
        b.c = d.join("/")
    }
    hz.prototype.j = function (b) {
        yb(this.a, b);
        iz(this);
        this.o()
    }
        ;
    function jz(b) {
        var c = m(b) ? b : c;
        Ri.call(this, {
            origin: [0, 0],
            resolutions: c.resolutions
        })
    }
    v(jz, Ri);
    jz.prototype.Cb = function (b) {
        b = m(b) ? b : {};
        var c = this.minZoom
            , d = this.maxZoom
            , e = null;
        if (m(b.extent)) {
            var e = Array(d + 1), f;
            for (f = 0; f <= d; ++f)
                e[f] = f < c ? null : Ui(this, b.extent, f)
        }
        return function (b, f, k) {
            f = b[0];
            if (f < c || d < f)
                return null;
            var n = Math.pow(2, f)
                , p = b[1];
            if (0 > p || n <= p)
                return null;
            b = b[2];
            return b < -n || -1 < b || null !== e && !nf(e[f], p, -b - 1) ? null : gf(f, p, -b - 1, k)
        }
    }
        ;
    function kz(b) {
        b = m(b) ? b : {};
        var c = b.size
            , d = c[0]
            , e = c[1]
            , f = []
            , g = 256;
        switch (m(b.tierSizeCalculation) ? b.tierSizeCalculation : "default") {
            case "default":
                for (; d > g || e > g;)
                    f.push([Math.ceil(d / g), Math.ceil(e / g)]),
                        g += g;
                break;
            case "truncated":
                for (; d > g || e > g;)
                    f.push([Math.ceil(d / g), Math.ceil(e / g)]),
                        d >>= 1,
                        e >>= 1
        }
        f.push([1, 1]);
        f.reverse();
        for (var g = [1], h = [0], e = 1, d = f.length; e < d; e++)
            g.push(1 << e),
                h.push(f[e - 1][0] * f[e - 1][1] + h[e - 1]);
        g.reverse();
        var g = new jz({
            resolutions: g
        })
            , k = b.url
            , c = Lx(g.Cb({
                extent: [0, 0, c[0], c[1]]
            }), function (b) {
                if (null !== b) {
                    var c = b[0]
                        , d = b[1];
                    b = b[2];
                    return k + "TileGroup" + ((d + b * f[c][0] + h[c]) / 256 | 0) + "/" + c + "-" + d + "-" + b + ".jpg"
                }
            });
        Qx.call(this, {
            attributions: b.attributions,
            crossOrigin: b.crossOrigin,
            logo: b.logo,
            tileClass: lz,
            tileGrid: g,
            tileUrlFunction: c
        })
    }
    v(kz, Qx);
    function lz(b, c, d, e, f) {
        Wv.call(this, b, c, d, e, f);
        this.f = {}
    }
    v(lz, Wv);
    lz.prototype.Qa = function (b) {
        var c = m(b) ? ma(b).toString() : "";
        if (c in this.f)
            return this.f[c];
        b = lz.R.Qa.call(this, b);
        if (2 == this.state) {
            if (256 == b.width && 256 == b.height)
                return this.f[c] = b;
            var d = Pf(256, 256);
            d.drawImage(b, 0, 0);
            return this.f[c] = d.canvas
        }
        return b
    }
        ;
    function mz(b) {
        b = m(b) ? b : {};
        this.d = m(b.initialSize) ? b.initialSize : 256;
        this.b = m(b.maxSize) ? b.maxSize : m(va) ? va : 2048;
        this.a = m(b.space) ? b.space : 1;
        this.f = [new nz(this.d, this.a)];
        this.c = this.d;
        this.e = [new nz(this.c, this.a)]
    }
    mz.prototype.add = function (b, c, d, e, f, g) {
        if (c + this.a > this.b || d + this.a > this.b)
            return null;
        e = oz(this, !1, b, c, d, e, g);
        if (null === e)
            return null;
        b = oz(this, !0, b, c, d, m(f) ? f : $c, g);
        return {
            offsetX: e.offsetX,
            offsetY: e.offsetY,
            image: e.image,
            sf: b.image
        }
    }
        ;
    function oz(b, c, d, e, f, g, h) {
        var k = c ? b.e : b.f, n, p, q;
        p = 0;
        for (q = k.length; p < q; ++p) {
            n = k[p];
            n = n.add(d, e, f, g, h);
            if (null !== n)
                return n;
            null === n && p === q - 1 && (c ? (n = Math.min(2 * b.c, b.b),
                b.c = n) : (n = Math.min(2 * b.d, b.b),
                    b.d = n),
                n = new nz(n, b.a),
                k.push(n),
                ++q)
        }
    }
    function nz(b, c) {
        this.a = c;
        this.d = [{
            x: 0,
            y: 0,
            width: b,
            height: b
        }];
        this.c = {};
        this.b = Gf("CANVAS");
        this.b.width = b;
        this.b.height = b;
        this.f = this.b.getContext("2d")
    }
    nz.prototype.get = function (b) {
        return ub(this.c, b, null)
    }
        ;
    nz.prototype.add = function (b, c, d, e, f) {
        var g, h, k;
        h = 0;
        for (k = this.d.length; h < k; ++h)
            if (g = this.d[h],
                g.width >= c + this.a && g.height >= d + this.a)
                return k = {
                    offsetX: g.x + this.a,
                    offsetY: g.y + this.a,
                    image: this.b
                },
                    this.c[b] = k,
                    e.call(f, this.f, g.x + this.a, g.y + this.a),
                    b = h,
                    c = c + this.a,
                    d = d + this.a,
                    f = e = void 0,
                    g.width - c > g.height - d ? (e = {
                        x: g.x + c,
                        y: g.y,
                        width: g.width - c,
                        height: g.height
                    },
                        f = {
                            x: g.x,
                            y: g.y + d,
                            width: c,
                            height: g.height - d
                        },
                        pz(this, b, e, f)) : (e = {
                            x: g.x + c,
                            y: g.y,
                            width: g.width - c,
                            height: d
                        },
                            f = {
                                x: g.x,
                                y: g.y + d,
                                width: g.width,
                                height: g.height - d
                            },
                            pz(this, b, e, f)),
                    k;
        return null
    }
        ;
    function pz(b, c, d, e) {
        c = [c, 1];
        0 < d.width && 0 < d.height && c.push(d);
        0 < e.width && 0 < e.height && c.push(e);
        b.d.splice.apply(b.d, c)
    }
    ; function qz(b) {
        this.l = this.b = this.c = null;
        this.j = m(b.fill) ? b.fill : null;
        this.H = [0, 0];
        this.a = b.points;
        this.d = m(b.radius) ? b.radius : b.radius1;
        this.e = m(b.radius2) ? b.radius2 : this.d;
        this.g = m(b.angle) ? b.angle : 0;
        this.f = m(b.stroke) ? b.stroke : null;
        this.F = this.S = this.s = null;
        var c = b.atlasManager, d = null, e, f = 0;
        null !== this.f && (e = sg(this.f.a),
            f = this.f.d,
            m(f) || (f = 1),
            d = this.f.b,
            Zf || (d = null));
        var g = 2 * (this.d + f) + 1
            , d = {
                strokeStyle: e,
                Oc: f,
                size: g,
                lineDash: d
            };
        if (m(c)) {
            g = Math.round(g);
            e = null === this.j;
            var h;
            e && (h = ra(this.Mf, this, d));
            f = this.vb();
            d = c.add(f, g, g, ra(this.Nf, this, d), h);
            this.b = d.image;
            this.H = [d.offsetX, d.offsetY];
            c = d.image.width;
            this.l = e ? d.sf : this.b
        } else
            this.b = Gf("CANVAS"),
                this.b.height = g,
                this.b.width = g,
                c = g = this.b.width,
                h = this.b.getContext("2d"),
                this.Nf(d, h, 0, 0),
                null === this.j ? (h = this.l = Gf("CANVAS"),
                    h.height = d.size,
                    h.width = d.size,
                    h = h.getContext("2d"),
                    this.Mf(d, h, 0, 0)) : this.l = this.b;
        this.s = [g / 2, g / 2];
        this.S = [g, g];
        this.F = [c, c];
        nj.call(this, {
            opacity: 1,
            rotateWithView: !1,
            rotation: m(b.rotation) ? b.rotation : 0,
            scale: 1,
            snapToPixel: m(b.snapToPixel) ? b.snapToPixel : !0
        })
    }
    v(qz, nj);
    l = qz.prototype;
    l.ub = function () {
        return this.s
    }
        ;
    l.ik = function () {
        return this.g
    }
        ;
    l.jk = function () {
        return this.j
    }
        ;
    l.Ed = function () {
        return this.l
    }
        ;
    l.zb = function () {
        return this.b
    }
        ;
    l.ed = function () {
        return this.F
    }
        ;
    l.Jc = function () {
        return 2
    }
        ;
    l.Ab = function () {
        return this.H
    }
        ;
    l.kk = function () {
        return this.a
    }
        ;
    l.lk = function () {
        return this.d
    }
        ;
    l.Nh = function () {
        return this.e
    }
        ;
    l.cb = function () {
        return this.S
    }
        ;
    l.mk = function () {
        return this.f
    }
        ;
    l.ve = ca;
    l.load = ca;
    l.Ne = ca;
    l.Nf = function (b, c, d, e) {
        var f;
        c.setTransform(1, 0, 0, 1, 0, 0);
        c.translate(d, e);
        c.beginPath();
        this.e !== this.d && (this.a *= 2);
        for (d = 0; d <= this.a; d++)
            e = 2 * d * Math.PI / this.a - Math.PI / 2 + this.g,
                f = 0 === d % 2 ? this.d : this.e,
                c.lineTo(b.size / 2 + f * Math.cos(e), b.size / 2 + f * Math.sin(e));
        null !== this.j && (c.fillStyle = sg(this.j.a),
            c.fill());
        null !== this.f && (c.strokeStyle = b.strokeStyle,
            c.lineWidth = b.Oc,
            null === b.lineDash || c.setLineDash(b.lineDash),
            c.stroke());
        c.closePath()
    }
        ;
    l.Mf = function (b, c, d, e) {
        c.setTransform(1, 0, 0, 1, 0, 0);
        c.translate(d, e);
        c.beginPath();
        this.e !== this.d && (this.a *= 2);
        var f;
        for (d = 0; d <= this.a; d++)
            f = 2 * d * Math.PI / this.a - Math.PI / 2 + this.g,
                e = 0 === d % 2 ? this.d : this.e,
                c.lineTo(b.size / 2 + e * Math.cos(f), b.size / 2 + e * Math.sin(f));
        c.fillStyle = gl;
        c.fill();
        null !== this.f && (c.strokeStyle = b.strokeStyle,
            c.lineWidth = b.Oc,
            null === b.lineDash || c.setLineDash(b.lineDash),
            c.stroke());
        c.closePath()
    }
        ;
    l.vb = function () {
        var b = null === this.f ? "-" : this.f.vb()
            , c = null === this.j ? "-" : this.j.vb();
        if (null === this.c || b != this.c[1] || c != this.c[2] || this.d != this.c[3] || this.e != this.c[4] || this.g != this.c[5] || this.a != this.c[6])
            this.c = ["r" + b + c + (m(this.d) ? this.d.toString() : "-") + (m(this.e) ? this.e.toString() : "-") + (m(this.g) ? this.g.toString() : "-") + (m(this.a) ? this.a.toString() : "-"), b, c, this.d, this.e, this.g, this.a];
        return this.c[0]
    }
        ;
    t("ol.animation.bounce", function (b) {
        var c = b.resolution
            , d = m(b.start) ? b.start : ua()
            , e = m(b.duration) ? b.duration : 1E3
            , f = m(b.easing) ? b.easing : cf;
        return function (b, h) {
            if (h.time < d)
                return h.animate = !0,
                    h.viewHints[0] += 1,
                    !0;
            if (h.time < d + e) {
                var k = f((h.time - d) / e)
                    , n = c - h.viewState.resolution;
                h.animate = !0;
                h.viewState.resolution += k * n;
                h.viewHints[0] += 1;
                return !0
            }
            return !1
        }
    }, OPENLAYERS);
    t("ol.animation.pan", df, OPENLAYERS);
    t("ol.animation.rotate", ef, OPENLAYERS);
    t("ol.animation.zoom", ff, OPENLAYERS);
    t("ol.Attribution", qf, OPENLAYERS);
    qf.prototype.getHTML = qf.prototype.b;
    lg.prototype.element = lg.prototype.element;
    t("ol.Collection", C, OPENLAYERS);
    C.prototype.clear = C.prototype.clear;
    C.prototype.extend = C.prototype.we;
    C.prototype.forEach = C.prototype.forEach;
    C.prototype.getArray = C.prototype.Wi;
    C.prototype.item = C.prototype.item;
    C.prototype.getLength = C.prototype.Ib;
    C.prototype.insertAt = C.prototype.td;
    C.prototype.pop = C.prototype.pop;
    C.prototype.push = C.prototype.push;
    C.prototype.remove = C.prototype.remove;
    C.prototype.removeAt = C.prototype.Ke;
    C.prototype.setAt = C.prototype.wl;
    t("ol.coordinate.add", ud, OPENLAYERS);
    t("ol.coordinate.createStringXY", function (b) {
        return function (c) {
            return Bd(c, b)
        }
    }, OPENLAYERS);
    t("ol.coordinate.format", xd, OPENLAYERS);
    t("ol.coordinate.rotate", zd, OPENLAYERS);
    t("ol.coordinate.toStringHDMS", function (b) {
        return m(b) ? wd(b[1], "NS") + " " + wd(b[0], "EW") : ""
    }, OPENLAYERS);
    t("ol.coordinate.toStringXY", Bd, OPENLAYERS);
    t("ol.DeviceOrientation", mp, OPENLAYERS);
    mp.prototype.getAlpha = mp.prototype.f;
    mp.prototype.getBeta = mp.prototype.e;
    mp.prototype.getGamma = mp.prototype.g;
    mp.prototype.getHeading = mp.prototype.i;
    mp.prototype.getTracking = mp.prototype.c;
    mp.prototype.setTracking = mp.prototype.b;
    t("ol.easing.easeIn", function (b) {
        return Math.pow(b, 3)
    }, OPENLAYERS);
    t("ol.easing.easeOut", $e, OPENLAYERS);
    t("ol.easing.inAndOut", af, OPENLAYERS);
    t("ol.easing.linear", bf, OPENLAYERS);
    t("ol.easing.upAndDown", cf, OPENLAYERS);
    t("ol.extent.boundingExtent", Qd, OPENLAYERS);
    t("ol.extent.buffer", Vd, OPENLAYERS);
    t("ol.extent.containsCoordinate", function (b, c) {
        return Zd(b, c[0], c[1])
    }, OPENLAYERS);
    t("ol.extent.containsExtent", Yd, OPENLAYERS);
    t("ol.extent.containsXY", Zd, OPENLAYERS);
    t("ol.extent.createEmpty", Rd, OPENLAYERS);
    t("ol.extent.equals", be, OPENLAYERS);
    t("ol.extent.extend", ce, OPENLAYERS);
    t("ol.extent.getBottomLeft", fe, OPENLAYERS);
    t("ol.extent.getBottomRight", ge, OPENLAYERS);
    t("ol.extent.getCenter", ie, OPENLAYERS);
    t("ol.extent.getHeight", me, OPENLAYERS);
    t("ol.extent.getIntersection", ne, OPENLAYERS);
    t("ol.extent.getSize", function (b) {
        return [b[2] - b[0], b[3] - b[1]]
    }, OPENLAYERS);
    t("ol.extent.getTopLeft", ke, OPENLAYERS);
    t("ol.extent.getTopRight", he, OPENLAYERS);
    t("ol.extent.getWidth", pe, OPENLAYERS);
    t("ol.extent.intersects", oe, OPENLAYERS);
    t("ol.extent.isEmpty", qe, OPENLAYERS);
    t("ol.extent.applyTransform", se, OPENLAYERS);
    t("ol.Feature", P, OPENLAYERS);
    P.prototype.clone = P.prototype.clone;
    P.prototype.getGeometry = P.prototype.N;
    P.prototype.getId = P.prototype.wh;
    P.prototype.getGeometryName = P.prototype.vh;
    P.prototype.getStyle = P.prototype.cj;
    P.prototype.getStyleFunction = P.prototype.dj;
    P.prototype.setGeometry = P.prototype.Pa;
    P.prototype.setStyle = P.prototype.i;
    P.prototype.setId = P.prototype.c;
    P.prototype.setGeometryName = P.prototype.f;
    t("ol.FeatureOverlay", op, OPENLAYERS);
    op.prototype.addFeature = op.prototype.yf;
    op.prototype.getFeatures = op.prototype.Xi;
    op.prototype.getMap = op.prototype.Yi;
    op.prototype.removeFeature = op.prototype.yd;
    op.prototype.setFeatures = op.prototype.Nc;
    op.prototype.setMap = op.prototype.setMap;
    op.prototype.setStyle = op.prototype.Af;
    op.prototype.getStyle = op.prototype.Zi;
    op.prototype.getStyleFunction = op.prototype.$i;
    t("ol.Geolocation", Z, OPENLAYERS);
    Z.prototype.getAccuracy = Z.prototype.gf;
    Z.prototype.getAccuracyGeometry = Z.prototype.p;
    Z.prototype.getAltitude = Z.prototype.q;
    Z.prototype.getAltitudeAccuracy = Z.prototype.r;
    Z.prototype.getHeading = Z.prototype.F;
    Z.prototype.getPosition = Z.prototype.H;
    Z.prototype.getProjection = Z.prototype.g;
    Z.prototype.getSpeed = Z.prototype.s;
    Z.prototype.getTracking = Z.prototype.i;
    Z.prototype.getTrackingOptions = Z.prototype.e;
    Z.prototype.setProjection = Z.prototype.n;
    Z.prototype.setTracking = Z.prototype.b;
    Z.prototype.setTrackingOptions = Z.prototype.l;
    t("ol.Graticule", Qv, OPENLAYERS);
    Qv.prototype.getMap = Qv.prototype.gj;
    Qv.prototype.getMeridians = Qv.prototype.Fh;
    Qv.prototype.getParallels = Qv.prototype.Kh;
    Qv.prototype.setMap = Qv.prototype.setMap;
    t("ol.has.DEVICE_PIXEL_RATIO", Xf, OPENLAYERS);
    t("ol.has.CANVAS", $f, OPENLAYERS);
    t("ol.has.DEVICE_ORIENTATION", ag, OPENLAYERS);
    t("ol.has.GEOLOCATION", bg, OPENLAYERS);
    t("ol.has.TOUCH", cg, OPENLAYERS);
    t("ol.has.WEBGL", Wf, OPENLAYERS);
    Vv.prototype.getImage = Vv.prototype.a;
    Wv.prototype.getImage = Wv.prototype.Qa;
    t("ol.Kinetic", Fj, OPENLAYERS);
    t("ol.loadingstrategy.all", function () {
        return [[-Infinity, -Infinity, Infinity, Infinity]]
    }, OPENLAYERS);
    t("ol.loadingstrategy.bbox", ux, OPENLAYERS);
    t("ol.loadingstrategy.createTile", function (b) {
        return function (c, d) {
            var e = $b(b.a, d, 0)
                , f = Ui(b, c, e)
                , g = []
                , e = [e, 0, 0];
            for (e[1] = f.a; e[1] <= f.c; ++e[1])
                for (e[2] = f.b; e[2] <= f.d; ++e[2])
                    g.push(Ti(b, e));
            return g
        }
    }, OPENLAYERS);
    t("ol.Map", M, OPENLAYERS);
    M.prototype.addControl = M.prototype.Zg;
    M.prototype.addInteraction = M.prototype.$g;
    M.prototype.addLayer = M.prototype.Ze;
    M.prototype.addOverlay = M.prototype.$e;
    M.prototype.beforeRender = M.prototype.Wa;
    M.prototype.forEachFeatureAtPixel = M.prototype.ne;
    M.prototype.forEachLayerAtPixel = M.prototype.kj;
    M.prototype.hasFeatureAtPixel = M.prototype.Ci;
    M.prototype.getEventCoordinate = M.prototype.rh;
    M.prototype.getEventPixel = M.prototype.cd;
    M.prototype.getTarget = M.prototype.qc;
    M.prototype.getTargetElement = M.prototype.Oh;
    M.prototype.getCoordinateFromPixel = M.prototype.ia;
    M.prototype.getControls = M.prototype.qh;
    M.prototype.getOverlays = M.prototype.Jh;
    M.prototype.getInteractions = M.prototype.xh;
    M.prototype.getLayerGroup = M.prototype.Ub;
    M.prototype.getLayers = M.prototype.da;
    M.prototype.getPixelFromCoordinate = M.prototype.e;
    M.prototype.getSize = M.prototype.f;
    M.prototype.getView = M.prototype.a;
    M.prototype.getViewport = M.prototype.Uh;
    M.prototype.renderSync = M.prototype.tl;
    M.prototype.render = M.prototype.render;
    M.prototype.removeControl = M.prototype.nl;
    M.prototype.removeInteraction = M.prototype.ol;
    M.prototype.removeLayer = M.prototype.pl;
    M.prototype.removeOverlay = M.prototype.ql;
    M.prototype.setLayerGroup = M.prototype.lg;
    M.prototype.setSize = M.prototype.S;
    M.prototype.setTarget = M.prototype.ha;
    M.prototype.setView = M.prototype.Da;
    M.prototype.updateSize = M.prototype.l;
    wi.prototype.originalEvent = wi.prototype.originalEvent;
    wi.prototype.pixel = wi.prototype.pixel;
    wi.prototype.coordinate = wi.prototype.coordinate;
    wi.prototype.dragging = wi.prototype.dragging;
    wi.prototype.preventDefault = wi.prototype.preventDefault;
    wi.prototype.stopPropagation = wi.prototype.mb;
    Tg.prototype.map = Tg.prototype.map;
    Tg.prototype.frameState = Tg.prototype.frameState;
    jd.prototype.key = jd.prototype.key;
    jd.prototype.oldValue = jd.prototype.oldValue;
    ld.prototype.transform = ld.prototype.transform;
    t("ol.Object", od, OPENLAYERS);
    od.prototype.bindTo = od.prototype.O;
    od.prototype.get = od.prototype.get;
    od.prototype.getKeys = od.prototype.J;
    od.prototype.getProperties = od.prototype.L;
    od.prototype.set = od.prototype.set;
    od.prototype.setProperties = od.prototype.G;
    od.prototype.unbind = od.prototype.P;
    od.prototype.unbindAll = od.prototype.Q;
    t("ol.Observable", hd, OPENLAYERS);
    t("ol.Observable.unByKey", id, OPENLAYERS);
    hd.prototype.changed = hd.prototype.o;
    hd.prototype.getRevision = hd.prototype.A;
    hd.prototype.on = hd.prototype.u;
    hd.prototype.once = hd.prototype.B;
    hd.prototype.un = hd.prototype.v;
    hd.prototype.unByKey = hd.prototype.C;
    t("ol.WEBGL_MAX_TEXTURE_SIZE", va, OPENLAYERS);
    t("ol.inherits", v, OPENLAYERS);
    t("ol.Overlay", N, OPENLAYERS);
    N.prototype.getElement = N.prototype.c;
    N.prototype.getMap = N.prototype.f;
    N.prototype.getOffset = N.prototype.g;
    N.prototype.getPosition = N.prototype.n;
    N.prototype.getPositioning = N.prototype.i;
    N.prototype.setElement = N.prototype.Le;
    N.prototype.setMap = N.prototype.setMap;
    N.prototype.setOffset = N.prototype.l;
    N.prototype.setPosition = N.prototype.e;
    N.prototype.setPositioning = N.prototype.p;
    Pi.prototype.getTileCoord = Pi.prototype.e;
    t("ol.View", B, OPENLAYERS);
    B.prototype.constrainCenter = B.prototype.i;
    B.prototype.constrainResolution = B.prototype.constrainResolution;
    B.prototype.constrainRotation = B.prototype.constrainRotation;
    B.prototype.getCenter = B.prototype.b;
    B.prototype.calculateExtent = B.prototype.g;
    B.prototype.getProjection = B.prototype.H;
    B.prototype.getResolution = B.prototype.a;
    B.prototype.getResolutionForExtent = B.prototype.n;
    B.prototype.getRotation = B.prototype.c;
    B.prototype.getZoom = B.prototype.Xh;
    B.prototype.fitExtent = B.prototype.me;
    B.prototype.fitGeometry = B.prototype.mh;
    B.prototype.centerOn = B.prototype.hh;
    B.prototype.rotate = B.prototype.rotate;
    B.prototype.setCenter = B.prototype.Ra;
    B.prototype.setResolution = B.prototype.f;
    B.prototype.setRotation = B.prototype.r;
    B.prototype.setZoom = B.prototype.S;
    t("ol.xml.getAllTextContent", Lp, OPENLAYERS);
    t("ol.xml.parse", eq, OPENLAYERS);
    t("ol.webgl.Context", Pn, OPENLAYERS);
    Pn.prototype.getGL = Pn.prototype.Dk;
    Pn.prototype.getHitDetectionFramebuffer = Pn.prototype.pe;
    Pn.prototype.useProgram = Pn.prototype.Ld;
    t("ol.tilegrid.TileGrid", Ri, OPENLAYERS);
    Ri.prototype.getMaxZoom = Ri.prototype.gd;
    Ri.prototype.getMinZoom = Ri.prototype.hd;
    Ri.prototype.getOrigin = Ri.prototype.Lb;
    Ri.prototype.getResolution = Ri.prototype.na;
    Ri.prototype.getResolutions = Ri.prototype.Kd;
    Ri.prototype.getTileCoordForCoordAndResolution = Ri.prototype.Vb;
    Ri.prototype.getTileCoordForCoordAndZ = Ri.prototype.Hc;
    Ri.prototype.getTileSize = Ri.prototype.va;
    t("ol.tilegrid.WMTS", gz, OPENLAYERS);
    gz.prototype.getMatrixIds = gz.prototype.g;
    t("ol.tilegrid.XYZ", Sx, OPENLAYERS);
    t("ol.tilegrid.Zoomify", jz, OPENLAYERS);
    t("ol.style.AtlasManager", mz, OPENLAYERS);
    t("ol.style.Circle", kl, OPENLAYERS);
    kl.prototype.getAnchor = kl.prototype.ub;
    kl.prototype.getFill = kl.prototype.ek;
    kl.prototype.getImage = kl.prototype.zb;
    kl.prototype.getOrigin = kl.prototype.Ab;
    kl.prototype.getRadius = kl.prototype.fk;
    kl.prototype.getSize = kl.prototype.cb;
    kl.prototype.getStroke = kl.prototype.gk;
    t("ol.style.Fill", jl, OPENLAYERS);
    jl.prototype.getColor = jl.prototype.b;
    jl.prototype.setColor = jl.prototype.c;
    t("ol.style.Icon", oj, OPENLAYERS);
    oj.prototype.getAnchor = oj.prototype.ub;
    oj.prototype.getImage = oj.prototype.zb;
    oj.prototype.getOrigin = oj.prototype.Ab;
    oj.prototype.getSrc = oj.prototype.hk;
    oj.prototype.getSize = oj.prototype.cb;
    t("ol.style.Image", nj, OPENLAYERS);
    nj.prototype.getOpacity = nj.prototype.Fd;
    nj.prototype.getRotateWithView = nj.prototype.kd;
    nj.prototype.getRotation = nj.prototype.Gd;
    nj.prototype.getScale = nj.prototype.Hd;
    nj.prototype.getSnapToPixel = nj.prototype.ld;
    nj.prototype.getImage = nj.prototype.zb;
    nj.prototype.setRotation = nj.prototype.Id;
    nj.prototype.setScale = nj.prototype.Jd;
    t("ol.style.RegularShape", qz, OPENLAYERS);
    qz.prototype.getAnchor = qz.prototype.ub;
    qz.prototype.getAngle = qz.prototype.ik;
    qz.prototype.getFill = qz.prototype.jk;
    qz.prototype.getImage = qz.prototype.zb;
    qz.prototype.getOrigin = qz.prototype.Ab;
    qz.prototype.getPoints = qz.prototype.kk;
    qz.prototype.getRadius = qz.prototype.lk;
    qz.prototype.getRadius2 = qz.prototype.Nh;
    qz.prototype.getSize = qz.prototype.cb;
    qz.prototype.getStroke = qz.prototype.mk;
    t("ol.style.Stroke", fl, OPENLAYERS);
    fl.prototype.getColor = fl.prototype.nk;
    fl.prototype.getLineCap = fl.prototype.Ah;
    fl.prototype.getLineDash = fl.prototype.ok;
    fl.prototype.getLineJoin = fl.prototype.Bh;
    fl.prototype.getMiterLimit = fl.prototype.Gh;
    fl.prototype.getWidth = fl.prototype.pk;
    fl.prototype.setColor = fl.prototype.qk;
    fl.prototype.setLineCap = fl.prototype.zl;
    fl.prototype.setLineDash = fl.prototype.rk;
    fl.prototype.setLineJoin = fl.prototype.Al;
    fl.prototype.setMiterLimit = fl.prototype.Bl;
    fl.prototype.setWidth = fl.prototype.Jl;
    t("ol.style.Style", ll, OPENLAYERS);
    ll.prototype.getGeometry = ll.prototype.N;
    ll.prototype.getGeometryFunction = ll.prototype.uh;
    ll.prototype.getFill = ll.prototype.sk;
    ll.prototype.getImage = ll.prototype.tk;
    ll.prototype.getStroke = ll.prototype.uk;
    ll.prototype.getText = ll.prototype.vk;
    ll.prototype.getZIndex = ll.prototype.Wh;
    ll.prototype.setGeometry = ll.prototype.Of;
    ll.prototype.setZIndex = ll.prototype.Ll;
    t("ol.style.Text", ds, OPENLAYERS);
    ds.prototype.getFont = ds.prototype.th;
    ds.prototype.getOffsetX = ds.prototype.Hh;
    ds.prototype.getOffsetY = ds.prototype.Ih;
    ds.prototype.getFill = ds.prototype.wk;
    ds.prototype.getRotation = ds.prototype.xk;
    ds.prototype.getScale = ds.prototype.yk;
    ds.prototype.getStroke = ds.prototype.zk;
    ds.prototype.getText = ds.prototype.Ak;
    ds.prototype.getTextAlign = ds.prototype.Qh;
    ds.prototype.getTextBaseline = ds.prototype.Rh;
    ds.prototype.setFont = ds.prototype.yl;
    ds.prototype.setFill = ds.prototype.xl;
    ds.prototype.setRotation = ds.prototype.Bk;
    ds.prototype.setScale = ds.prototype.Ck;
    ds.prototype.setStroke = ds.prototype.Fl;
    ds.prototype.setText = ds.prototype.Gl;
    ds.prototype.setTextAlign = ds.prototype.Hl;
    ds.prototype.setTextBaseline = ds.prototype.Il;
    t("ol.Sphere", te, OPENLAYERS);
    t("ol.source.BingMaps", Tx, OPENLAYERS);
    t("ol.source.BingMaps.TOS_ATTRIBUTION", Ux, OPENLAYERS);
    t("ol.source.Cluster", Vx, OPENLAYERS);
    ty.prototype.readFeatures = ty.prototype.a;
    t("ol.source.GeoJSON", wy, OPENLAYERS);
    t("ol.source.GPX", xy, OPENLAYERS);
    t("ol.source.IGC", yy, OPENLAYERS);
    t("ol.source.ImageCanvas", Zm, OPENLAYERS);
    t("ol.source.ImageMapGuide", zy, OPENLAYERS);
    zy.prototype.getParams = zy.prototype.Jj;
    zy.prototype.getImageLoadFunction = zy.prototype.Ij;
    zy.prototype.updateParams = zy.prototype.Mj;
    zy.prototype.setImageLoadFunction = zy.prototype.Lj;
    t("ol.source.Image", Wm, OPENLAYERS);
    t("ol.source.ImageStatic", Ay, OPENLAYERS);
    t("ol.source.ImageVector", mn, OPENLAYERS);
    mn.prototype.getSource = mn.prototype.Nj;
    mn.prototype.getStyle = mn.prototype.Oj;
    mn.prototype.getStyleFunction = mn.prototype.Pj;
    mn.prototype.setStyle = mn.prototype.Hf;
    t("ol.source.ImageWMS", By, OPENLAYERS);
    By.prototype.getGetFeatureInfoUrl = By.prototype.Sj;
    By.prototype.getParams = By.prototype.Uj;
    By.prototype.getImageLoadFunction = By.prototype.Tj;
    By.prototype.getUrl = By.prototype.Vj;
    By.prototype.setImageLoadFunction = By.prototype.Wj;
    By.prototype.setUrl = By.prototype.Xj;
    By.prototype.updateParams = By.prototype.Yj;
    t("ol.source.KML", Fy, OPENLAYERS);
    t("ol.source.MapQuest", Jy, OPENLAYERS);
    t("ol.source.OSM", Hy, OPENLAYERS);
    t("ol.source.OSM.ATTRIBUTION", Iy, OPENLAYERS);
    t("ol.source.OSMXML", My, OPENLAYERS);
    t("ol.source.ServerVector", Ny, OPENLAYERS);
    Ny.prototype.clear = Ny.prototype.clear;
    Ny.prototype.readFeatures = Ny.prototype.a;
    t("ol.source.Source", Ki, OPENLAYERS);
    Ki.prototype.getAttributions = Ki.prototype.Y;
    Ki.prototype.getLogo = Ki.prototype.W;
    Ki.prototype.getProjection = Ki.prototype.Z;
    Ki.prototype.getState = Ki.prototype.$;
    t("ol.source.Stamen", Qy, OPENLAYERS);
    t("ol.source.StaticVector", vy, OPENLAYERS);
    t("ol.source.TileDebug", Ty, OPENLAYERS);
    t("ol.source.TileImage", Qx, OPENLAYERS);
    Qx.prototype.getTileLoadFunction = Qx.prototype.jb;
    Qx.prototype.getTileUrlFunction = Qx.prototype.kb;
    Qx.prototype.setTileLoadFunction = Qx.prototype.pb;
    Qx.prototype.setTileUrlFunction = Qx.prototype.sa;
    t("ol.source.TileJSON", Uy, OPENLAYERS);
    t("ol.source.Tile", $i, OPENLAYERS);
    $i.prototype.getTileGrid = $i.prototype.Fa;
    t("ol.source.TileUTFGrid", Vy, OPENLAYERS);
    Vy.prototype.getTemplate = Vy.prototype.Ph;
    Vy.prototype.forDataAtCoordinateAndResolution = Vy.prototype.nh;
    t("ol.source.TileVector", $y, OPENLAYERS);
    $y.prototype.getFeatures = $y.prototype.ya;
    $y.prototype.getFeaturesAtCoordinateAndResolution = $y.prototype.sh;
    t("ol.source.TileWMS", bz, OPENLAYERS);
    bz.prototype.getGetFeatureInfoUrl = bz.prototype.$j;
    bz.prototype.getParams = bz.prototype.ak;
    bz.prototype.getUrls = bz.prototype.Th;
    bz.prototype.setUrl = bz.prototype.bk;
    bz.prototype.setUrls = bz.prototype.If;
    bz.prototype.updateParams = bz.prototype.dk;
    t("ol.source.TopoJSON", fz, OPENLAYERS);
    t("ol.source.Vector", fn, OPENLAYERS);
    fn.prototype.addFeature = fn.prototype.Ta;
    fn.prototype.addFeatures = fn.prototype.Ea;
    fn.prototype.clear = fn.prototype.clear;
    fn.prototype.forEachFeature = fn.prototype.Za;
    fn.prototype.forEachFeatureInExtent = fn.prototype.ua;
    fn.prototype.forEachFeatureIntersectingExtent = fn.prototype.Ja;
    fn.prototype.getFeatures = fn.prototype.ya;
    fn.prototype.getFeaturesAtCoordinate = fn.prototype.La;
    fn.prototype.getClosestFeatureToCoordinate = fn.prototype.$a;
    fn.prototype.getExtent = fn.prototype.D;
    fn.prototype.getFeatureById = fn.prototype.Ka;
    fn.prototype.removeFeature = fn.prototype.bb;
    jn.prototype.feature = jn.prototype.feature;
    t("ol.source.WMTS", hz, OPENLAYERS);
    hz.prototype.getDimensions = hz.prototype.e;
    hz.prototype.updateDimensions = hz.prototype.j;
    t("ol.source.XYZ", Gy, OPENLAYERS);
    Gy.prototype.setTileUrlFunction = Gy.prototype.sa;
    Gy.prototype.setUrl = Gy.prototype.a;
    t("ol.source.Zoomify", kz, OPENLAYERS);
    Uk.prototype.vectorContext = Uk.prototype.vectorContext;
    Uk.prototype.frameState = Uk.prototype.frameState;
    Uk.prototype.context = Uk.prototype.context;
    Uk.prototype.glContext = Uk.prototype.glContext;
    jo.prototype.drawAsync = jo.prototype.ic;
    jo.prototype.drawCircleGeometry = jo.prototype.jc;
    jo.prototype.drawFeature = jo.prototype.ke;
    jo.prototype.drawGeometryCollectionGeometry = jo.prototype.ad;
    jo.prototype.drawPointGeometry = jo.prototype.sb;
    jo.prototype.drawLineStringGeometry = jo.prototype.Db;
    jo.prototype.drawMultiLineStringGeometry = jo.prototype.kc;
    jo.prototype.drawMultiPointGeometry = jo.prototype.rb;
    jo.prototype.drawMultiPolygonGeometry = jo.prototype.lc;
    jo.prototype.drawPolygonGeometry = jo.prototype.Rb;
    jo.prototype.drawText = jo.prototype.tb;
    jo.prototype.setFillStrokeStyle = jo.prototype.za;
    jo.prototype.setImageStyle = jo.prototype.fb;
    jo.prototype.setTextStyle = jo.prototype.Aa;
    Ol.prototype.drawAsync = Ol.prototype.ic;
    Ol.prototype.drawCircleGeometry = Ol.prototype.jc;
    Ol.prototype.drawFeature = Ol.prototype.ke;
    Ol.prototype.drawPointGeometry = Ol.prototype.sb;
    Ol.prototype.drawMultiPointGeometry = Ol.prototype.rb;
    Ol.prototype.drawLineStringGeometry = Ol.prototype.Db;
    Ol.prototype.drawMultiLineStringGeometry = Ol.prototype.kc;
    Ol.prototype.drawPolygonGeometry = Ol.prototype.Rb;
    Ol.prototype.drawMultiPolygonGeometry = Ol.prototype.lc;
    Ol.prototype.setFillStrokeStyle = Ol.prototype.za;
    Ol.prototype.setImageStyle = Ol.prototype.fb;
    Ol.prototype.setTextStyle = Ol.prototype.Aa;
    t("ol.proj.common.add", Nl, OPENLAYERS);
    t("ol.proj.METERS_PER_UNIT", xe, OPENLAYERS);
    t("ol.proj.Projection", ye, OPENLAYERS);
    ye.prototype.getCode = ye.prototype.ph;
    ye.prototype.getExtent = ye.prototype.D;
    ye.prototype.getUnits = ye.prototype.Dj;
    ye.prototype.getMetersPerUnit = ye.prototype.qe;
    ye.prototype.getWorldExtent = ye.prototype.Vh;
    ye.prototype.isGlobal = ye.prototype.Gi;
    ye.prototype.setExtent = ye.prototype.Ej;
    ye.prototype.setWorldExtent = ye.prototype.Kl;
    t("ol.proj.addEquivalentProjections", Ee, OPENLAYERS);
    t("ol.proj.addProjection", Ne, OPENLAYERS);
    t("ol.proj.addCoordinateTransforms", Pe, OPENLAYERS);
    t("ol.proj.get", Be, OPENLAYERS);
    t("ol.proj.getTransform", Se, OPENLAYERS);
    t("ol.proj.transform", function (b, c, d) {
        return Se(c, d)(b, void 0, b.length)
    }, OPENLAYERS);
    t("ol.proj.transformExtent", Ue, OPENLAYERS);
    t("ol.layer.Heatmap", $, OPENLAYERS);
    $.prototype.getGradient = $.prototype.Ca;
    $.prototype.setGradient = $.prototype.gc;
    t("ol.layer.Image", I, OPENLAYERS);
    I.prototype.getSource = I.prototype.a;
    t("ol.layer.Layer", F, OPENLAYERS);
    F.prototype.getSource = F.prototype.a;
    F.prototype.setSource = F.prototype.ea;
    t("ol.layer.Base", E, OPENLAYERS);
    E.prototype.getBrightness = E.prototype.c;
    E.prototype.getContrast = E.prototype.f;
    E.prototype.getHue = E.prototype.e;
    E.prototype.getExtent = E.prototype.D;
    E.prototype.getMaxResolution = E.prototype.g;
    E.prototype.getMinResolution = E.prototype.i;
    E.prototype.getOpacity = E.prototype.l;
    E.prototype.getSaturation = E.prototype.n;
    E.prototype.getVisible = E.prototype.b;
    E.prototype.setBrightness = E.prototype.s;
    E.prototype.setContrast = E.prototype.F;
    E.prototype.setHue = E.prototype.H;
    E.prototype.setExtent = E.prototype.p;
    E.prototype.setMaxResolution = E.prototype.S;
    E.prototype.setMinResolution = E.prototype.U;
    E.prototype.setOpacity = E.prototype.q;
    E.prototype.setSaturation = E.prototype.ba;
    E.prototype.setVisible = E.prototype.ca;
    t("ol.layer.Group", H, OPENLAYERS);
    H.prototype.getLayers = H.prototype.Zb;
    H.prototype.setLayers = H.prototype.r;
    t("ol.layer.Tile", J, OPENLAYERS);
    J.prototype.getPreload = J.prototype.r;
    J.prototype.getSource = J.prototype.a;
    J.prototype.setPreload = J.prototype.ha;
    J.prototype.getUseInterimTilesOnError = J.prototype.da;
    J.prototype.setUseInterimTilesOnError = J.prototype.ka;
    t("ol.layer.Vector", K, OPENLAYERS);
    K.prototype.getSource = K.prototype.a;
    K.prototype.getStyle = K.prototype.Vc;
    K.prototype.getStyleFunction = K.prototype.Wc;
    K.prototype.setStyle = K.prototype.ka;
    t("ol.interaction.DoubleClickZoom", Mj, OPENLAYERS);
    t("ol.interaction.DoubleClickZoom.handleEvent", Nj, OPENLAYERS);
    t("ol.interaction.DragAndDrop", Lw, OPENLAYERS);
    t("ol.interaction.DragAndDrop.handleEvent", Zc, OPENLAYERS);
    Mw.prototype.features = Mw.prototype.features;
    Mw.prototype.file = Mw.prototype.file;
    Mw.prototype.projection = Mw.prototype.projection;
    Yk.prototype.coordinate = Yk.prototype.coordinate;
    t("ol.interaction.DragBox", Zk, OPENLAYERS);
    Zk.prototype.getGeometry = Zk.prototype.N;
    t("ol.interaction.DragPan", Yj, OPENLAYERS);
    t("ol.interaction.DragRotateAndZoom", Pw, OPENLAYERS);
    t("ol.interaction.DragRotate", ck, OPENLAYERS);
    t("ol.interaction.DragZoom", rl, OPENLAYERS);
    Tw.prototype.feature = Tw.prototype.feature;
    t("ol.interaction.Draw", Uw, OPENLAYERS);
    t("ol.interaction.Draw.handleEvent", Ww, OPENLAYERS);
    Uw.prototype.finishDrawing = Uw.prototype.U;
    t("ol.interaction.Interaction", Ij, OPENLAYERS);
    Ij.prototype.getActive = Ij.prototype.a;
    Ij.prototype.setActive = Ij.prototype.b;
    t("ol.interaction.defaults", Gl, OPENLAYERS);
    t("ol.interaction.KeyboardPan", sl, OPENLAYERS);
    t("ol.interaction.KeyboardPan.handleEvent", tl, OPENLAYERS);
    t("ol.interaction.KeyboardZoom", ul, OPENLAYERS);
    t("ol.interaction.KeyboardZoom.handleEvent", vl, OPENLAYERS);
    t("ol.interaction.Modify", gx, OPENLAYERS);
    t("ol.interaction.Modify.handleEvent", jx, OPENLAYERS);
    t("ol.interaction.MouseWheelZoom", wl, OPENLAYERS);
    t("ol.interaction.MouseWheelZoom.handleEvent", xl, OPENLAYERS);
    t("ol.interaction.PinchRotate", yl, OPENLAYERS);
    t("ol.interaction.PinchZoom", Cl, OPENLAYERS);
    t("ol.interaction.Pointer", Vj, OPENLAYERS);
    t("ol.interaction.Pointer.handleEvent", Wj, OPENLAYERS);
    t("ol.interaction.Select", px, OPENLAYERS);
    px.prototype.getFeatures = px.prototype.p;
    t("ol.interaction.Select.handleEvent", qx, OPENLAYERS);
    px.prototype.setMap = px.prototype.setMap;
    t("ol.geom.Circle", Am, OPENLAYERS);
    Am.prototype.clone = Am.prototype.clone;
    Am.prototype.getCenter = Am.prototype.xe;
    Am.prototype.getRadius = Am.prototype.Cf;
    Am.prototype.getType = Am.prototype.I;
    Am.prototype.setCenter = Am.prototype.wj;
    Am.prototype.setCenterAndRadius = Am.prototype.jg;
    Am.prototype.setRadius = Am.prototype.El;
    Am.prototype.transform = Am.prototype.transform;
    t("ol.geom.Geometry", gk, OPENLAYERS);
    gk.prototype.clone = gk.prototype.clone;
    gk.prototype.getClosestPoint = gk.prototype.f;
    gk.prototype.getExtent = gk.prototype.D;
    gk.prototype.getType = gk.prototype.I;
    gk.prototype.applyTransform = gk.prototype.qa;
    gk.prototype.intersectsExtent = gk.prototype.ja;
    gk.prototype.translate = gk.prototype.Ga;
    gk.prototype.transform = gk.prototype.transform;
    t("ol.geom.GeometryCollection", Cm, OPENLAYERS);
    Cm.prototype.clone = Cm.prototype.clone;
    Cm.prototype.getGeometries = Cm.prototype.hf;
    Cm.prototype.getType = Cm.prototype.I;
    Cm.prototype.intersectsExtent = Cm.prototype.ja;
    Cm.prototype.setGeometries = Cm.prototype.kg;
    Cm.prototype.applyTransform = Cm.prototype.qa;
    Cm.prototype.translate = Cm.prototype.Ga;
    t("ol.geom.LinearRing", Ck, OPENLAYERS);
    Ck.prototype.clone = Ck.prototype.clone;
    Ck.prototype.getArea = Ck.prototype.zj;
    Ck.prototype.getCoordinates = Ck.prototype.K;
    Ck.prototype.getType = Ck.prototype.I;
    Ck.prototype.setCoordinates = Ck.prototype.V;
    t("ol.geom.LineString", L, OPENLAYERS);
    L.prototype.appendCoordinate = L.prototype.ah;
    L.prototype.clone = L.prototype.clone;
    L.prototype.getCoordinateAtM = L.prototype.xj;
    L.prototype.getCoordinates = L.prototype.K;
    L.prototype.getLength = L.prototype.yj;
    L.prototype.getType = L.prototype.I;
    L.prototype.intersectsExtent = L.prototype.ja;
    L.prototype.setCoordinates = L.prototype.V;
    t("ol.geom.MultiLineString", Km, OPENLAYERS);
    Km.prototype.appendLineString = Km.prototype.bh;
    Km.prototype.clone = Km.prototype.clone;
    Km.prototype.getCoordinateAtM = Km.prototype.Aj;
    Km.prototype.getCoordinates = Km.prototype.K;
    Km.prototype.getLineString = Km.prototype.Ch;
    Km.prototype.getLineStrings = Km.prototype.Gc;
    Km.prototype.getType = Km.prototype.I;
    Km.prototype.intersectsExtent = Km.prototype.ja;
    Km.prototype.setCoordinates = Km.prototype.V;
    t("ol.geom.MultiPoint", Nm, OPENLAYERS);
    Nm.prototype.appendPoint = Nm.prototype.eh;
    Nm.prototype.clone = Nm.prototype.clone;
    Nm.prototype.getCoordinates = Nm.prototype.K;
    Nm.prototype.getPoint = Nm.prototype.Lh;
    Nm.prototype.getPoints = Nm.prototype.zd;
    Nm.prototype.getType = Nm.prototype.I;
    Nm.prototype.intersectsExtent = Nm.prototype.ja;
    Nm.prototype.setCoordinates = Nm.prototype.V;
    t("ol.geom.MultiPolygon", Om, OPENLAYERS);
    Om.prototype.appendPolygon = Om.prototype.fh;
    Om.prototype.clone = Om.prototype.clone;
    Om.prototype.getArea = Om.prototype.Bj;
    Om.prototype.getCoordinates = Om.prototype.K;
    Om.prototype.getInteriorPoints = Om.prototype.zh;
    Om.prototype.getPolygon = Om.prototype.Mh;
    Om.prototype.getPolygons = Om.prototype.jd;
    Om.prototype.getType = Om.prototype.I;
    Om.prototype.intersectsExtent = Om.prototype.ja;
    Om.prototype.setCoordinates = Om.prototype.V;
    t("ol.geom.Point", Ek, OPENLAYERS);
    Ek.prototype.clone = Ek.prototype.clone;
    Ek.prototype.getCoordinates = Ek.prototype.K;
    Ek.prototype.getType = Ek.prototype.I;
    Ek.prototype.intersectsExtent = Ek.prototype.ja;
    Ek.prototype.setCoordinates = Ek.prototype.V;
    t("ol.geom.Polygon", G, OPENLAYERS);
    G.prototype.appendLinearRing = G.prototype.dh;
    G.prototype.clone = G.prototype.clone;
    G.prototype.getArea = G.prototype.Cj;
    G.prototype.getCoordinates = G.prototype.K;
    G.prototype.getInteriorPoint = G.prototype.yh;
    G.prototype.getLinearRingCount = G.prototype.Eh;
    G.prototype.getLinearRing = G.prototype.Dh;
    G.prototype.getLinearRings = G.prototype.fd;
    G.prototype.getType = G.prototype.I;
    G.prototype.intersectsExtent = G.prototype.ja;
    G.prototype.setCoordinates = G.prototype.V;
    t("ol.geom.Polygon.circular", Tk, OPENLAYERS);
    t("ol.geom.Polygon.fromExtent", function (b) {
        var c = b[0]
            , d = b[1]
            , e = b[2];
        b = b[3];
        c = [c, d, c, b, e, b, e, d, c, d];
        d = new G(null);
        Qk(d, "XY", c, [c.length]);
        return d
    }, OPENLAYERS);
    t("ol.geom.SimpleGeometry", ik, OPENLAYERS);
    ik.prototype.getFirstCoordinate = ik.prototype.wb;
    ik.prototype.getLastCoordinate = ik.prototype.xb;
    ik.prototype.getLayout = ik.prototype.yb;
    ik.prototype.applyTransform = ik.prototype.qa;
    ik.prototype.translate = ik.prototype.Ga;
    t("ol.format.Feature", qp, OPENLAYERS);
    t("ol.format.GeoJSON", Ap, OPENLAYERS);
    Ap.prototype.readFeature = Ap.prototype.Nb;
    Ap.prototype.readFeatures = Ap.prototype.ma;
    Ap.prototype.readGeometry = Ap.prototype.Lc;
    Ap.prototype.readProjection = Ap.prototype.Ha;
    Ap.prototype.writeFeature = Ap.prototype.Wd;
    Ap.prototype.writeFeatureObject = Ap.prototype.a;
    Ap.prototype.writeFeatures = Ap.prototype.Qb;
    Ap.prototype.writeFeaturesObject = Ap.prototype.c;
    Ap.prototype.writeGeometry = Ap.prototype.Rc;
    Ap.prototype.writeGeometryObject = Ap.prototype.f;
    t("ol.format.GPX", Pq, OPENLAYERS);
    Pq.prototype.readFeature = Pq.prototype.Nb;
    Pq.prototype.readFeatures = Pq.prototype.ma;
    Pq.prototype.readProjection = Pq.prototype.Ha;
    Pq.prototype.writeFeatures = Pq.prototype.Qb;
    Pq.prototype.writeFeaturesNode = Pq.prototype.a;
    t("ol.format.IGC", zr, OPENLAYERS);
    zr.prototype.readFeature = zr.prototype.Nb;
    zr.prototype.readFeatures = zr.prototype.ma;
    zr.prototype.readProjection = zr.prototype.Ha;
    t("ol.format.KML", es, OPENLAYERS);
    es.prototype.readFeature = es.prototype.Nb;
    es.prototype.readFeatures = es.prototype.ma;
    es.prototype.readName = es.prototype.fl;
    es.prototype.readNetworkLinks = es.prototype.gl;
    es.prototype.readProjection = es.prototype.Ha;
    es.prototype.writeFeatures = es.prototype.Qb;
    es.prototype.writeFeaturesNode = es.prototype.a;
    t("ol.format.OSMXML", Ot, OPENLAYERS);
    Ot.prototype.readFeatures = Ot.prototype.ma;
    Ot.prototype.readProjection = Ot.prototype.Ha;
    t("ol.format.Polyline", mu, OPENLAYERS);
    t("ol.format.Polyline.encodeDeltas", nu, OPENLAYERS);
    t("ol.format.Polyline.decodeDeltas", pu, OPENLAYERS);
    t("ol.format.Polyline.encodeFloats", ou, OPENLAYERS);
    t("ol.format.Polyline.decodeFloats", qu, OPENLAYERS);
    mu.prototype.readFeature = mu.prototype.Nb;
    mu.prototype.readFeatures = mu.prototype.ma;
    mu.prototype.readGeometry = mu.prototype.Lc;
    mu.prototype.readProjection = mu.prototype.Ha;
    mu.prototype.writeGeometry = mu.prototype.Rc;
    t("ol.format.TopoJSON", ru, OPENLAYERS);
    ru.prototype.readFeatures = ru.prototype.ma;
    ru.prototype.readProjection = ru.prototype.Ha;
    t("ol.format.WFS", xu, OPENLAYERS);
    xu.prototype.readFeatures = xu.prototype.ma;
    xu.prototype.readTransactionResponse = xu.prototype.g;
    xu.prototype.readFeatureCollectionMetadata = xu.prototype.e;
    xu.prototype.writeGetFeature = xu.prototype.j;
    xu.prototype.writeTransaction = xu.prototype.l;
    xu.prototype.readProjection = xu.prototype.Ha;
    t("ol.format.WKT", Ku, OPENLAYERS);
    Ku.prototype.readFeature = Ku.prototype.Nb;
    Ku.prototype.readFeatures = Ku.prototype.ma;
    Ku.prototype.readGeometry = Ku.prototype.Lc;
    Ku.prototype.writeFeature = Ku.prototype.Wd;
    Ku.prototype.writeFeatures = Ku.prototype.Qb;
    Ku.prototype.writeGeometry = Ku.prototype.Rc;
    t("ol.format.WMSCapabilities", bv, OPENLAYERS);
    bv.prototype.read = bv.prototype.b;
    t("ol.format.WMSGetFeatureInfo", yv, OPENLAYERS);
    yv.prototype.readFeatures = yv.prototype.ma;
    t("ol.format.WMTSCapabilities", Av, OPENLAYERS);
    Av.prototype.read = Av.prototype.b;
    t("ol.format.GML2", Oq, OPENLAYERS);
    t("ol.format.GML3", Y, OPENLAYERS);
    Y.prototype.writeGeometryNode = Y.prototype.i;
    Y.prototype.writeFeatures = Y.prototype.Qb;
    Y.prototype.writeFeaturesNode = Y.prototype.a;
    t("ol.format.GML", Y, OPENLAYERS);
    Y.prototype.writeFeatures = Y.prototype.Qb;
    Y.prototype.writeFeaturesNode = Y.prototype.a;
    t("ol.format.GMLBase", uq, OPENLAYERS);
    uq.prototype.readFeatures = uq.prototype.ma;
    t("ol.events.condition.altKeyOnly", function (b) {
        b = b.a;
        return b.d && !b.g && !b.c
    }, OPENLAYERS);
    t("ol.events.condition.altShiftKeysOnly", Oj, OPENLAYERS);
    t("ol.events.condition.always", Zc, OPENLAYERS);
    t("ol.events.condition.click", function (b) {
        return b.type == Ai
    }, OPENLAYERS);
    t("ol.events.condition.mouseMove", Pj, OPENLAYERS);
    t("ol.events.condition.never", Yc, OPENLAYERS);
    t("ol.events.condition.singleClick", Qj, OPENLAYERS);
    t("ol.events.condition.noModifierKeys", Rj, OPENLAYERS);
    t("ol.events.condition.platformModifierKeyOnly", function (b) {
        b = b.a;
        return !b.d && b.g && !b.c
    }, OPENLAYERS);
    t("ol.events.condition.shiftKeyOnly", Sj, OPENLAYERS);
    t("ol.events.condition.targetNotEditable", Tj, OPENLAYERS);
    t("ol.events.condition.mouseOnly", Uj, OPENLAYERS);
    t("ol.dom.Input", np, OPENLAYERS);
    np.prototype.getChecked = np.prototype.a;
    np.prototype.getValue = np.prototype.b;
    np.prototype.setValue = np.prototype.f;
    np.prototype.setChecked = np.prototype.c;
    t("ol.control.Attribution", Vg, OPENLAYERS);
    t("ol.control.Attribution.render", Wg, OPENLAYERS);
    Vg.prototype.getCollapsible = Vg.prototype.nj;
    Vg.prototype.setCollapsible = Vg.prototype.qj;
    Vg.prototype.setCollapsed = Vg.prototype.pj;
    Vg.prototype.getCollapsed = Vg.prototype.mj;
    t("ol.control.Control", Ug, OPENLAYERS);
    Ug.prototype.getMap = Ug.prototype.f;
    Ug.prototype.setMap = Ug.prototype.setMap;
    Ug.prototype.setTarget = Ug.prototype.b;
    t("ol.control.defaults", ah, OPENLAYERS);
    t("ol.control.FullScreen", fh, OPENLAYERS);
    t("ol.control.MousePosition", gh, OPENLAYERS);
    t("ol.control.MousePosition.render", hh, OPENLAYERS);
    gh.prototype.getCoordinateFormat = gh.prototype.n;
    gh.prototype.getProjection = gh.prototype.q;
    gh.prototype.setMap = gh.prototype.setMap;
    gh.prototype.setCoordinateFormat = gh.prototype.s;
    gh.prototype.setProjection = gh.prototype.r;
    t("ol.control.OverviewMap", Mo, OPENLAYERS);
    Mo.prototype.setMap = Mo.prototype.setMap;
    t("ol.control.OverviewMap.render", No, OPENLAYERS);
    Mo.prototype.getCollapsible = Mo.prototype.sj;
    Mo.prototype.setCollapsible = Mo.prototype.vj;
    Mo.prototype.setCollapsed = Mo.prototype.uj;
    Mo.prototype.getCollapsed = Mo.prototype.rj;
    t("ol.control.Rotate", Yg, OPENLAYERS);
    t("ol.control.Rotate.render", Zg, OPENLAYERS);
    t("ol.control.ScaleLine", So, OPENLAYERS);
    So.prototype.getUnits = So.prototype.p;
    t("ol.control.ScaleLine.render", To, OPENLAYERS);
    So.prototype.setUnits = So.prototype.q;
    t("ol.control.Zoom", $g, OPENLAYERS);
    t("ol.control.ZoomSlider", gp, OPENLAYERS);
    t("ol.control.ZoomSlider.render", ip, OPENLAYERS);
    t("ol.control.ZoomToExtent", lp, OPENLAYERS);
    t("ol.color.asArray", qg, OPENLAYERS);
    t("ol.color.asString", sg, OPENLAYERS);
    od.prototype.changed = od.prototype.o;
    od.prototype.getRevision = od.prototype.A;
    od.prototype.on = od.prototype.u;
    od.prototype.once = od.prototype.B;
    od.prototype.un = od.prototype.v;
    od.prototype.unByKey = od.prototype.C;
    C.prototype.bindTo = C.prototype.O;
    C.prototype.get = C.prototype.get;
    C.prototype.getKeys = C.prototype.J;
    C.prototype.getProperties = C.prototype.L;
    C.prototype.set = C.prototype.set;
    C.prototype.setProperties = C.prototype.G;
    C.prototype.unbind = C.prototype.P;
    C.prototype.unbindAll = C.prototype.Q;
    C.prototype.changed = C.prototype.o;
    C.prototype.getRevision = C.prototype.A;
    C.prototype.on = C.prototype.u;
    C.prototype.once = C.prototype.B;
    C.prototype.un = C.prototype.v;
    C.prototype.unByKey = C.prototype.C;
    mp.prototype.bindTo = mp.prototype.O;
    mp.prototype.get = mp.prototype.get;
    mp.prototype.getKeys = mp.prototype.J;
    mp.prototype.getProperties = mp.prototype.L;
    mp.prototype.set = mp.prototype.set;
    mp.prototype.setProperties = mp.prototype.G;
    mp.prototype.unbind = mp.prototype.P;
    mp.prototype.unbindAll = mp.prototype.Q;
    mp.prototype.changed = mp.prototype.o;
    mp.prototype.getRevision = mp.prototype.A;
    mp.prototype.on = mp.prototype.u;
    mp.prototype.once = mp.prototype.B;
    mp.prototype.un = mp.prototype.v;
    mp.prototype.unByKey = mp.prototype.C;
    P.prototype.bindTo = P.prototype.O;
    P.prototype.get = P.prototype.get;
    P.prototype.getKeys = P.prototype.J;
    P.prototype.getProperties = P.prototype.L;
    P.prototype.set = P.prototype.set;
    P.prototype.setProperties = P.prototype.G;
    P.prototype.unbind = P.prototype.P;
    P.prototype.unbindAll = P.prototype.Q;
    P.prototype.changed = P.prototype.o;
    P.prototype.getRevision = P.prototype.A;
    P.prototype.on = P.prototype.u;
    P.prototype.once = P.prototype.B;
    P.prototype.un = P.prototype.v;
    P.prototype.unByKey = P.prototype.C;
    Z.prototype.bindTo = Z.prototype.O;
    Z.prototype.get = Z.prototype.get;
    Z.prototype.getKeys = Z.prototype.J;
    Z.prototype.getProperties = Z.prototype.L;
    Z.prototype.set = Z.prototype.set;
    Z.prototype.setProperties = Z.prototype.G;
    Z.prototype.unbind = Z.prototype.P;
    Z.prototype.unbindAll = Z.prototype.Q;
    Z.prototype.changed = Z.prototype.o;
    Z.prototype.getRevision = Z.prototype.A;
    Z.prototype.on = Z.prototype.u;
    Z.prototype.once = Z.prototype.B;
    Z.prototype.un = Z.prototype.v;
    Z.prototype.unByKey = Z.prototype.C;
    Wv.prototype.getTileCoord = Wv.prototype.e;
    M.prototype.bindTo = M.prototype.O;
    M.prototype.get = M.prototype.get;
    M.prototype.getKeys = M.prototype.J;
    M.prototype.getProperties = M.prototype.L;
    M.prototype.set = M.prototype.set;
    M.prototype.setProperties = M.prototype.G;
    M.prototype.unbind = M.prototype.P;
    M.prototype.unbindAll = M.prototype.Q;
    M.prototype.changed = M.prototype.o;
    M.prototype.getRevision = M.prototype.A;
    M.prototype.on = M.prototype.u;
    M.prototype.once = M.prototype.B;
    M.prototype.un = M.prototype.v;
    M.prototype.unByKey = M.prototype.C;
    wi.prototype.map = wi.prototype.map;
    wi.prototype.frameState = wi.prototype.frameState;
    xi.prototype.originalEvent = xi.prototype.originalEvent;
    xi.prototype.pixel = xi.prototype.pixel;
    xi.prototype.coordinate = xi.prototype.coordinate;
    xi.prototype.dragging = xi.prototype.dragging;
    xi.prototype.preventDefault = xi.prototype.preventDefault;
    xi.prototype.stopPropagation = xi.prototype.mb;
    xi.prototype.map = xi.prototype.map;
    xi.prototype.frameState = xi.prototype.frameState;
    N.prototype.bindTo = N.prototype.O;
    N.prototype.get = N.prototype.get;
    N.prototype.getKeys = N.prototype.J;
    N.prototype.getProperties = N.prototype.L;
    N.prototype.set = N.prototype.set;
    N.prototype.setProperties = N.prototype.G;
    N.prototype.unbind = N.prototype.P;
    N.prototype.unbindAll = N.prototype.Q;
    N.prototype.changed = N.prototype.o;
    N.prototype.getRevision = N.prototype.A;
    N.prototype.on = N.prototype.u;
    N.prototype.once = N.prototype.B;
    N.prototype.un = N.prototype.v;
    N.prototype.unByKey = N.prototype.C;
    B.prototype.bindTo = B.prototype.O;
    B.prototype.get = B.prototype.get;
    B.prototype.getKeys = B.prototype.J;
    B.prototype.getProperties = B.prototype.L;
    B.prototype.set = B.prototype.set;
    B.prototype.setProperties = B.prototype.G;
    B.prototype.unbind = B.prototype.P;
    B.prototype.unbindAll = B.prototype.Q;
    B.prototype.changed = B.prototype.o;
    B.prototype.getRevision = B.prototype.A;
    B.prototype.on = B.prototype.u;
    B.prototype.once = B.prototype.B;
    B.prototype.un = B.prototype.v;
    B.prototype.unByKey = B.prototype.C;
    gz.prototype.getMaxZoom = gz.prototype.gd;
    gz.prototype.getMinZoom = gz.prototype.hd;
    gz.prototype.getOrigin = gz.prototype.Lb;
    gz.prototype.getResolution = gz.prototype.na;
    gz.prototype.getResolutions = gz.prototype.Kd;
    gz.prototype.getTileCoordForCoordAndResolution = gz.prototype.Vb;
    gz.prototype.getTileCoordForCoordAndZ = gz.prototype.Hc;
    gz.prototype.getTileSize = gz.prototype.va;
    Sx.prototype.getMaxZoom = Sx.prototype.gd;
    Sx.prototype.getMinZoom = Sx.prototype.hd;
    Sx.prototype.getOrigin = Sx.prototype.Lb;
    Sx.prototype.getResolution = Sx.prototype.na;
    Sx.prototype.getResolutions = Sx.prototype.Kd;
    Sx.prototype.getTileCoordForCoordAndResolution = Sx.prototype.Vb;
    Sx.prototype.getTileCoordForCoordAndZ = Sx.prototype.Hc;
    Sx.prototype.getTileSize = Sx.prototype.va;
    jz.prototype.getMaxZoom = jz.prototype.gd;
    jz.prototype.getMinZoom = jz.prototype.hd;
    jz.prototype.getOrigin = jz.prototype.Lb;
    jz.prototype.getResolution = jz.prototype.na;
    jz.prototype.getResolutions = jz.prototype.Kd;
    jz.prototype.getTileCoordForCoordAndResolution = jz.prototype.Vb;
    jz.prototype.getTileCoordForCoordAndZ = jz.prototype.Hc;
    jz.prototype.getTileSize = jz.prototype.va;
    kl.prototype.getOpacity = kl.prototype.Fd;
    kl.prototype.getRotateWithView = kl.prototype.kd;
    kl.prototype.getRotation = kl.prototype.Gd;
    kl.prototype.getScale = kl.prototype.Hd;
    kl.prototype.getSnapToPixel = kl.prototype.ld;
    kl.prototype.setRotation = kl.prototype.Id;
    kl.prototype.setScale = kl.prototype.Jd;
    oj.prototype.getOpacity = oj.prototype.Fd;
    oj.prototype.getRotateWithView = oj.prototype.kd;
    oj.prototype.getRotation = oj.prototype.Gd;
    oj.prototype.getScale = oj.prototype.Hd;
    oj.prototype.getSnapToPixel = oj.prototype.ld;
    oj.prototype.setRotation = oj.prototype.Id;
    oj.prototype.setScale = oj.prototype.Jd;
    qz.prototype.getOpacity = qz.prototype.Fd;
    qz.prototype.getRotateWithView = qz.prototype.kd;
    qz.prototype.getRotation = qz.prototype.Gd;
    qz.prototype.getScale = qz.prototype.Hd;
    qz.prototype.getSnapToPixel = qz.prototype.ld;
    qz.prototype.setRotation = qz.prototype.Id;
    qz.prototype.setScale = qz.prototype.Jd;
    Ki.prototype.changed = Ki.prototype.o;
    Ki.prototype.getRevision = Ki.prototype.A;
    Ki.prototype.on = Ki.prototype.u;
    Ki.prototype.once = Ki.prototype.B;
    Ki.prototype.un = Ki.prototype.v;
    Ki.prototype.unByKey = Ki.prototype.C;
    $i.prototype.getAttributions = $i.prototype.Y;
    $i.prototype.getLogo = $i.prototype.W;
    $i.prototype.getProjection = $i.prototype.Z;
    $i.prototype.getState = $i.prototype.$;
    $i.prototype.changed = $i.prototype.o;
    $i.prototype.getRevision = $i.prototype.A;
    $i.prototype.on = $i.prototype.u;
    $i.prototype.once = $i.prototype.B;
    $i.prototype.un = $i.prototype.v;
    $i.prototype.unByKey = $i.prototype.C;
    Qx.prototype.getTileGrid = Qx.prototype.Fa;
    Qx.prototype.getAttributions = Qx.prototype.Y;
    Qx.prototype.getLogo = Qx.prototype.W;
    Qx.prototype.getProjection = Qx.prototype.Z;
    Qx.prototype.getState = Qx.prototype.$;
    Qx.prototype.changed = Qx.prototype.o;
    Qx.prototype.getRevision = Qx.prototype.A;
    Qx.prototype.on = Qx.prototype.u;
    Qx.prototype.once = Qx.prototype.B;
    Qx.prototype.un = Qx.prototype.v;
    Qx.prototype.unByKey = Qx.prototype.C;
    Tx.prototype.getTileLoadFunction = Tx.prototype.jb;
    Tx.prototype.getTileUrlFunction = Tx.prototype.kb;
    Tx.prototype.setTileLoadFunction = Tx.prototype.pb;
    Tx.prototype.setTileUrlFunction = Tx.prototype.sa;
    Tx.prototype.getTileGrid = Tx.prototype.Fa;
    Tx.prototype.getAttributions = Tx.prototype.Y;
    Tx.prototype.getLogo = Tx.prototype.W;
    Tx.prototype.getProjection = Tx.prototype.Z;
    Tx.prototype.getState = Tx.prototype.$;
    Tx.prototype.changed = Tx.prototype.o;
    Tx.prototype.getRevision = Tx.prototype.A;
    Tx.prototype.on = Tx.prototype.u;
    Tx.prototype.once = Tx.prototype.B;
    Tx.prototype.un = Tx.prototype.v;
    Tx.prototype.unByKey = Tx.prototype.C;
    fn.prototype.getAttributions = fn.prototype.Y;
    fn.prototype.getLogo = fn.prototype.W;
    fn.prototype.getProjection = fn.prototype.Z;
    fn.prototype.getState = fn.prototype.$;
    fn.prototype.changed = fn.prototype.o;
    fn.prototype.getRevision = fn.prototype.A;
    fn.prototype.on = fn.prototype.u;
    fn.prototype.once = fn.prototype.B;
    fn.prototype.un = fn.prototype.v;
    fn.prototype.unByKey = fn.prototype.C;
    Vx.prototype.addFeature = Vx.prototype.Ta;
    Vx.prototype.addFeatures = Vx.prototype.Ea;
    Vx.prototype.clear = Vx.prototype.clear;
    Vx.prototype.forEachFeature = Vx.prototype.Za;
    Vx.prototype.forEachFeatureInExtent = Vx.prototype.ua;
    Vx.prototype.forEachFeatureIntersectingExtent = Vx.prototype.Ja;
    Vx.prototype.getFeatures = Vx.prototype.ya;
    Vx.prototype.getFeaturesAtCoordinate = Vx.prototype.La;
    Vx.prototype.getClosestFeatureToCoordinate = Vx.prototype.$a;
    Vx.prototype.getExtent = Vx.prototype.D;
    Vx.prototype.getFeatureById = Vx.prototype.Ka;
    Vx.prototype.removeFeature = Vx.prototype.bb;
    Vx.prototype.getAttributions = Vx.prototype.Y;
    Vx.prototype.getLogo = Vx.prototype.W;
    Vx.prototype.getProjection = Vx.prototype.Z;
    Vx.prototype.getState = Vx.prototype.$;
    Vx.prototype.changed = Vx.prototype.o;
    Vx.prototype.getRevision = Vx.prototype.A;
    Vx.prototype.on = Vx.prototype.u;
    Vx.prototype.once = Vx.prototype.B;
    Vx.prototype.un = Vx.prototype.v;
    Vx.prototype.unByKey = Vx.prototype.C;
    ty.prototype.addFeature = ty.prototype.Ta;
    ty.prototype.addFeatures = ty.prototype.Ea;
    ty.prototype.clear = ty.prototype.clear;
    ty.prototype.forEachFeature = ty.prototype.Za;
    ty.prototype.forEachFeatureInExtent = ty.prototype.ua;
    ty.prototype.forEachFeatureIntersectingExtent = ty.prototype.Ja;
    ty.prototype.getFeatures = ty.prototype.ya;
    ty.prototype.getFeaturesAtCoordinate = ty.prototype.La;
    ty.prototype.getClosestFeatureToCoordinate = ty.prototype.$a;
    ty.prototype.getExtent = ty.prototype.D;
    ty.prototype.getFeatureById = ty.prototype.Ka;
    ty.prototype.removeFeature = ty.prototype.bb;
    ty.prototype.getAttributions = ty.prototype.Y;
    ty.prototype.getLogo = ty.prototype.W;
    ty.prototype.getProjection = ty.prototype.Z;
    ty.prototype.getState = ty.prototype.$;
    ty.prototype.changed = ty.prototype.o;
    ty.prototype.getRevision = ty.prototype.A;
    ty.prototype.on = ty.prototype.u;
    ty.prototype.once = ty.prototype.B;
    ty.prototype.un = ty.prototype.v;
    ty.prototype.unByKey = ty.prototype.C;
    vy.prototype.readFeatures = vy.prototype.a;
    vy.prototype.addFeature = vy.prototype.Ta;
    vy.prototype.addFeatures = vy.prototype.Ea;
    vy.prototype.clear = vy.prototype.clear;
    vy.prototype.forEachFeature = vy.prototype.Za;
    vy.prototype.forEachFeatureInExtent = vy.prototype.ua;
    vy.prototype.forEachFeatureIntersectingExtent = vy.prototype.Ja;
    vy.prototype.getFeatures = vy.prototype.ya;
    vy.prototype.getFeaturesAtCoordinate = vy.prototype.La;
    vy.prototype.getClosestFeatureToCoordinate = vy.prototype.$a;
    vy.prototype.getExtent = vy.prototype.D;
    vy.prototype.getFeatureById = vy.prototype.Ka;
    vy.prototype.removeFeature = vy.prototype.bb;
    vy.prototype.getAttributions = vy.prototype.Y;
    vy.prototype.getLogo = vy.prototype.W;
    vy.prototype.getProjection = vy.prototype.Z;
    vy.prototype.getState = vy.prototype.$;
    vy.prototype.changed = vy.prototype.o;
    vy.prototype.getRevision = vy.prototype.A;
    vy.prototype.on = vy.prototype.u;
    vy.prototype.once = vy.prototype.B;
    vy.prototype.un = vy.prototype.v;
    vy.prototype.unByKey = vy.prototype.C;
    wy.prototype.readFeatures = wy.prototype.a;
    wy.prototype.addFeature = wy.prototype.Ta;
    wy.prototype.addFeatures = wy.prototype.Ea;
    wy.prototype.clear = wy.prototype.clear;
    wy.prototype.forEachFeature = wy.prototype.Za;
    wy.prototype.forEachFeatureInExtent = wy.prototype.ua;
    wy.prototype.forEachFeatureIntersectingExtent = wy.prototype.Ja;
    wy.prototype.getFeatures = wy.prototype.ya;
    wy.prototype.getFeaturesAtCoordinate = wy.prototype.La;
    wy.prototype.getClosestFeatureToCoordinate = wy.prototype.$a;
    wy.prototype.getExtent = wy.prototype.D;
    wy.prototype.getFeatureById = wy.prototype.Ka;
    wy.prototype.removeFeature = wy.prototype.bb;
    wy.prototype.getAttributions = wy.prototype.Y;
    wy.prototype.getLogo = wy.prototype.W;
    wy.prototype.getProjection = wy.prototype.Z;
    wy.prototype.getState = wy.prototype.$;
    wy.prototype.changed = wy.prototype.o;
    wy.prototype.getRevision = wy.prototype.A;
    wy.prototype.on = wy.prototype.u;
    wy.prototype.once = wy.prototype.B;
    wy.prototype.un = wy.prototype.v;
    wy.prototype.unByKey = wy.prototype.C;
    xy.prototype.readFeatures = xy.prototype.a;
    xy.prototype.addFeature = xy.prototype.Ta;
    xy.prototype.addFeatures = xy.prototype.Ea;
    xy.prototype.clear = xy.prototype.clear;
    xy.prototype.forEachFeature = xy.prototype.Za;
    xy.prototype.forEachFeatureInExtent = xy.prototype.ua;
    xy.prototype.forEachFeatureIntersectingExtent = xy.prototype.Ja;
    xy.prototype.getFeatures = xy.prototype.ya;
    xy.prototype.getFeaturesAtCoordinate = xy.prototype.La;
    xy.prototype.getClosestFeatureToCoordinate = xy.prototype.$a;
    xy.prototype.getExtent = xy.prototype.D;
    xy.prototype.getFeatureById = xy.prototype.Ka;
    xy.prototype.removeFeature = xy.prototype.bb;
    xy.prototype.getAttributions = xy.prototype.Y;
    xy.prototype.getLogo = xy.prototype.W;
    xy.prototype.getProjection = xy.prototype.Z;
    xy.prototype.getState = xy.prototype.$;
    xy.prototype.changed = xy.prototype.o;
    xy.prototype.getRevision = xy.prototype.A;
    xy.prototype.on = xy.prototype.u;
    xy.prototype.once = xy.prototype.B;
    xy.prototype.un = xy.prototype.v;
    xy.prototype.unByKey = xy.prototype.C;
    yy.prototype.readFeatures = yy.prototype.a;
    yy.prototype.addFeature = yy.prototype.Ta;
    yy.prototype.addFeatures = yy.prototype.Ea;
    yy.prototype.clear = yy.prototype.clear;
    yy.prototype.forEachFeature = yy.prototype.Za;
    yy.prototype.forEachFeatureInExtent = yy.prototype.ua;
    yy.prototype.forEachFeatureIntersectingExtent = yy.prototype.Ja;
    yy.prototype.getFeatures = yy.prototype.ya;
    yy.prototype.getFeaturesAtCoordinate = yy.prototype.La;
    yy.prototype.getClosestFeatureToCoordinate = yy.prototype.$a;
    yy.prototype.getExtent = yy.prototype.D;
    yy.prototype.getFeatureById = yy.prototype.Ka;
    yy.prototype.removeFeature = yy.prototype.bb;
    yy.prototype.getAttributions = yy.prototype.Y;
    yy.prototype.getLogo = yy.prototype.W;
    yy.prototype.getProjection = yy.prototype.Z;
    yy.prototype.getState = yy.prototype.$;
    yy.prototype.changed = yy.prototype.o;
    yy.prototype.getRevision = yy.prototype.A;
    yy.prototype.on = yy.prototype.u;
    yy.prototype.once = yy.prototype.B;
    yy.prototype.un = yy.prototype.v;
    yy.prototype.unByKey = yy.prototype.C;
    Wm.prototype.getAttributions = Wm.prototype.Y;
    Wm.prototype.getLogo = Wm.prototype.W;
    Wm.prototype.getProjection = Wm.prototype.Z;
    Wm.prototype.getState = Wm.prototype.$;
    Wm.prototype.changed = Wm.prototype.o;
    Wm.prototype.getRevision = Wm.prototype.A;
    Wm.prototype.on = Wm.prototype.u;
    Wm.prototype.once = Wm.prototype.B;
    Wm.prototype.un = Wm.prototype.v;
    Wm.prototype.unByKey = Wm.prototype.C;
    Zm.prototype.getAttributions = Zm.prototype.Y;
    Zm.prototype.getLogo = Zm.prototype.W;
    Zm.prototype.getProjection = Zm.prototype.Z;
    Zm.prototype.getState = Zm.prototype.$;
    Zm.prototype.changed = Zm.prototype.o;
    Zm.prototype.getRevision = Zm.prototype.A;
    Zm.prototype.on = Zm.prototype.u;
    Zm.prototype.once = Zm.prototype.B;
    Zm.prototype.un = Zm.prototype.v;
    Zm.prototype.unByKey = Zm.prototype.C;
    zy.prototype.getAttributions = zy.prototype.Y;
    zy.prototype.getLogo = zy.prototype.W;
    zy.prototype.getProjection = zy.prototype.Z;
    zy.prototype.getState = zy.prototype.$;
    zy.prototype.changed = zy.prototype.o;
    zy.prototype.getRevision = zy.prototype.A;
    zy.prototype.on = zy.prototype.u;
    zy.prototype.once = zy.prototype.B;
    zy.prototype.un = zy.prototype.v;
    zy.prototype.unByKey = zy.prototype.C;
    Ay.prototype.getAttributions = Ay.prototype.Y;
    Ay.prototype.getLogo = Ay.prototype.W;
    Ay.prototype.getProjection = Ay.prototype.Z;
    Ay.prototype.getState = Ay.prototype.$;
    Ay.prototype.changed = Ay.prototype.o;
    Ay.prototype.getRevision = Ay.prototype.A;
    Ay.prototype.on = Ay.prototype.u;
    Ay.prototype.once = Ay.prototype.B;
    Ay.prototype.un = Ay.prototype.v;
    Ay.prototype.unByKey = Ay.prototype.C;
    mn.prototype.getAttributions = mn.prototype.Y;
    mn.prototype.getLogo = mn.prototype.W;
    mn.prototype.getProjection = mn.prototype.Z;
    mn.prototype.getState = mn.prototype.$;
    mn.prototype.changed = mn.prototype.o;
    mn.prototype.getRevision = mn.prototype.A;
    mn.prototype.on = mn.prototype.u;
    mn.prototype.once = mn.prototype.B;
    mn.prototype.un = mn.prototype.v;
    mn.prototype.unByKey = mn.prototype.C;
    By.prototype.getAttributions = By.prototype.Y;
    By.prototype.getLogo = By.prototype.W;
    By.prototype.getProjection = By.prototype.Z;
    By.prototype.getState = By.prototype.$;
    By.prototype.changed = By.prototype.o;
    By.prototype.getRevision = By.prototype.A;
    By.prototype.on = By.prototype.u;
    By.prototype.once = By.prototype.B;
    By.prototype.un = By.prototype.v;
    By.prototype.unByKey = By.prototype.C;
    Fy.prototype.readFeatures = Fy.prototype.a;
    Fy.prototype.addFeature = Fy.prototype.Ta;
    Fy.prototype.addFeatures = Fy.prototype.Ea;
    Fy.prototype.clear = Fy.prototype.clear;
    Fy.prototype.forEachFeature = Fy.prototype.Za;
    Fy.prototype.forEachFeatureInExtent = Fy.prototype.ua;
    Fy.prototype.forEachFeatureIntersectingExtent = Fy.prototype.Ja;
    Fy.prototype.getFeatures = Fy.prototype.ya;
    Fy.prototype.getFeaturesAtCoordinate = Fy.prototype.La;
    Fy.prototype.getClosestFeatureToCoordinate = Fy.prototype.$a;
    Fy.prototype.getExtent = Fy.prototype.D;
    Fy.prototype.getFeatureById = Fy.prototype.Ka;
    Fy.prototype.removeFeature = Fy.prototype.bb;
    Fy.prototype.getAttributions = Fy.prototype.Y;
    Fy.prototype.getLogo = Fy.prototype.W;
    Fy.prototype.getProjection = Fy.prototype.Z;
    Fy.prototype.getState = Fy.prototype.$;
    Fy.prototype.changed = Fy.prototype.o;
    Fy.prototype.getRevision = Fy.prototype.A;
    Fy.prototype.on = Fy.prototype.u;
    Fy.prototype.once = Fy.prototype.B;
    Fy.prototype.un = Fy.prototype.v;
    Fy.prototype.unByKey = Fy.prototype.C;
    Gy.prototype.getTileLoadFunction = Gy.prototype.jb;
    Gy.prototype.getTileUrlFunction = Gy.prototype.kb;
    Gy.prototype.setTileLoadFunction = Gy.prototype.pb;
    Gy.prototype.getTileGrid = Gy.prototype.Fa;
    Gy.prototype.getAttributions = Gy.prototype.Y;
    Gy.prototype.getLogo = Gy.prototype.W;
    Gy.prototype.getProjection = Gy.prototype.Z;
    Gy.prototype.getState = Gy.prototype.$;
    Gy.prototype.changed = Gy.prototype.o;
    Gy.prototype.getRevision = Gy.prototype.A;
    Gy.prototype.on = Gy.prototype.u;
    Gy.prototype.once = Gy.prototype.B;
    Gy.prototype.un = Gy.prototype.v;
    Gy.prototype.unByKey = Gy.prototype.C;
    Jy.prototype.setTileUrlFunction = Jy.prototype.sa;
    Jy.prototype.setUrl = Jy.prototype.a;
    Jy.prototype.getTileLoadFunction = Jy.prototype.jb;
    Jy.prototype.getTileUrlFunction = Jy.prototype.kb;
    Jy.prototype.setTileLoadFunction = Jy.prototype.pb;
    Jy.prototype.getTileGrid = Jy.prototype.Fa;
    Jy.prototype.getAttributions = Jy.prototype.Y;
    Jy.prototype.getLogo = Jy.prototype.W;
    Jy.prototype.getProjection = Jy.prototype.Z;
    Jy.prototype.getState = Jy.prototype.$;
    Jy.prototype.changed = Jy.prototype.o;
    Jy.prototype.getRevision = Jy.prototype.A;
    Jy.prototype.on = Jy.prototype.u;
    Jy.prototype.once = Jy.prototype.B;
    Jy.prototype.un = Jy.prototype.v;
    Jy.prototype.unByKey = Jy.prototype.C;
    Hy.prototype.setTileUrlFunction = Hy.prototype.sa;
    Hy.prototype.setUrl = Hy.prototype.a;
    Hy.prototype.getTileLoadFunction = Hy.prototype.jb;
    Hy.prototype.getTileUrlFunction = Hy.prototype.kb;
    Hy.prototype.setTileLoadFunction = Hy.prototype.pb;
    Hy.prototype.getTileGrid = Hy.prototype.Fa;
    Hy.prototype.getAttributions = Hy.prototype.Y;
    Hy.prototype.getLogo = Hy.prototype.W;
    Hy.prototype.getProjection = Hy.prototype.Z;
    Hy.prototype.getState = Hy.prototype.$;
    Hy.prototype.changed = Hy.prototype.o;
    Hy.prototype.getRevision = Hy.prototype.A;
    Hy.prototype.on = Hy.prototype.u;
    Hy.prototype.once = Hy.prototype.B;
    Hy.prototype.un = Hy.prototype.v;
    Hy.prototype.unByKey = Hy.prototype.C;
    My.prototype.readFeatures = My.prototype.a;
    My.prototype.addFeature = My.prototype.Ta;
    My.prototype.addFeatures = My.prototype.Ea;
    My.prototype.clear = My.prototype.clear;
    My.prototype.forEachFeature = My.prototype.Za;
    My.prototype.forEachFeatureInExtent = My.prototype.ua;
    My.prototype.forEachFeatureIntersectingExtent = My.prototype.Ja;
    My.prototype.getFeatures = My.prototype.ya;
    My.prototype.getFeaturesAtCoordinate = My.prototype.La;
    My.prototype.getClosestFeatureToCoordinate = My.prototype.$a;
    My.prototype.getExtent = My.prototype.D;
    My.prototype.getFeatureById = My.prototype.Ka;
    My.prototype.removeFeature = My.prototype.bb;
    My.prototype.getAttributions = My.prototype.Y;
    My.prototype.getLogo = My.prototype.W;
    My.prototype.getProjection = My.prototype.Z;
    My.prototype.getState = My.prototype.$;
    My.prototype.changed = My.prototype.o;
    My.prototype.getRevision = My.prototype.A;
    My.prototype.on = My.prototype.u;
    My.prototype.once = My.prototype.B;
    My.prototype.un = My.prototype.v;
    My.prototype.unByKey = My.prototype.C;
    Ny.prototype.addFeature = Ny.prototype.Ta;
    Ny.prototype.addFeatures = Ny.prototype.Ea;
    Ny.prototype.forEachFeature = Ny.prototype.Za;
    Ny.prototype.forEachFeatureInExtent = Ny.prototype.ua;
    Ny.prototype.forEachFeatureIntersectingExtent = Ny.prototype.Ja;
    Ny.prototype.getFeatures = Ny.prototype.ya;
    Ny.prototype.getFeaturesAtCoordinate = Ny.prototype.La;
    Ny.prototype.getClosestFeatureToCoordinate = Ny.prototype.$a;
    Ny.prototype.getExtent = Ny.prototype.D;
    Ny.prototype.getFeatureById = Ny.prototype.Ka;
    Ny.prototype.removeFeature = Ny.prototype.bb;
    Ny.prototype.getAttributions = Ny.prototype.Y;
    Ny.prototype.getLogo = Ny.prototype.W;
    Ny.prototype.getProjection = Ny.prototype.Z;
    Ny.prototype.getState = Ny.prototype.$;
    Ny.prototype.changed = Ny.prototype.o;
    Ny.prototype.getRevision = Ny.prototype.A;
    Ny.prototype.on = Ny.prototype.u;
    Ny.prototype.once = Ny.prototype.B;
    Ny.prototype.un = Ny.prototype.v;
    Ny.prototype.unByKey = Ny.prototype.C;
    Qy.prototype.setTileUrlFunction = Qy.prototype.sa;
    Qy.prototype.setUrl = Qy.prototype.a;
    Qy.prototype.getTileLoadFunction = Qy.prototype.jb;
    Qy.prototype.getTileUrlFunction = Qy.prototype.kb;
    Qy.prototype.setTileLoadFunction = Qy.prototype.pb;
    Qy.prototype.getTileGrid = Qy.prototype.Fa;
    Qy.prototype.getAttributions = Qy.prototype.Y;
    Qy.prototype.getLogo = Qy.prototype.W;
    Qy.prototype.getProjection = Qy.prototype.Z;
    Qy.prototype.getState = Qy.prototype.$;
    Qy.prototype.changed = Qy.prototype.o;
    Qy.prototype.getRevision = Qy.prototype.A;
    Qy.prototype.on = Qy.prototype.u;
    Qy.prototype.once = Qy.prototype.B;
    Qy.prototype.un = Qy.prototype.v;
    Qy.prototype.unByKey = Qy.prototype.C;
    Ty.prototype.getTileGrid = Ty.prototype.Fa;
    Ty.prototype.getAttributions = Ty.prototype.Y;
    Ty.prototype.getLogo = Ty.prototype.W;
    Ty.prototype.getProjection = Ty.prototype.Z;
    Ty.prototype.getState = Ty.prototype.$;
    Ty.prototype.changed = Ty.prototype.o;
    Ty.prototype.getRevision = Ty.prototype.A;
    Ty.prototype.on = Ty.prototype.u;
    Ty.prototype.once = Ty.prototype.B;
    Ty.prototype.un = Ty.prototype.v;
    Ty.prototype.unByKey = Ty.prototype.C;
    Uy.prototype.getTileLoadFunction = Uy.prototype.jb;
    Uy.prototype.getTileUrlFunction = Uy.prototype.kb;
    Uy.prototype.setTileLoadFunction = Uy.prototype.pb;
    Uy.prototype.setTileUrlFunction = Uy.prototype.sa;
    Uy.prototype.getTileGrid = Uy.prototype.Fa;
    Uy.prototype.getAttributions = Uy.prototype.Y;
    Uy.prototype.getLogo = Uy.prototype.W;
    Uy.prototype.getProjection = Uy.prototype.Z;
    Uy.prototype.getState = Uy.prototype.$;
    Uy.prototype.changed = Uy.prototype.o;
    Uy.prototype.getRevision = Uy.prototype.A;
    Uy.prototype.on = Uy.prototype.u;
    Uy.prototype.once = Uy.prototype.B;
    Uy.prototype.un = Uy.prototype.v;
    Uy.prototype.unByKey = Uy.prototype.C;
    Vy.prototype.getTileGrid = Vy.prototype.Fa;
    Vy.prototype.getAttributions = Vy.prototype.Y;
    Vy.prototype.getLogo = Vy.prototype.W;
    Vy.prototype.getProjection = Vy.prototype.Z;
    Vy.prototype.getState = Vy.prototype.$;
    Vy.prototype.changed = Vy.prototype.o;
    Vy.prototype.getRevision = Vy.prototype.A;
    Vy.prototype.on = Vy.prototype.u;
    Vy.prototype.once = Vy.prototype.B;
    Vy.prototype.un = Vy.prototype.v;
    Vy.prototype.unByKey = Vy.prototype.C;
    $y.prototype.readFeatures = $y.prototype.a;
    $y.prototype.forEachFeatureIntersectingExtent = $y.prototype.Ja;
    $y.prototype.getFeaturesAtCoordinate = $y.prototype.La;
    $y.prototype.getFeatureById = $y.prototype.Ka;
    $y.prototype.getAttributions = $y.prototype.Y;
    $y.prototype.getLogo = $y.prototype.W;
    $y.prototype.getProjection = $y.prototype.Z;
    $y.prototype.getState = $y.prototype.$;
    $y.prototype.changed = $y.prototype.o;
    $y.prototype.getRevision = $y.prototype.A;
    $y.prototype.on = $y.prototype.u;
    $y.prototype.once = $y.prototype.B;
    $y.prototype.un = $y.prototype.v;
    $y.prototype.unByKey = $y.prototype.C;
    bz.prototype.getTileLoadFunction = bz.prototype.jb;
    bz.prototype.getTileUrlFunction = bz.prototype.kb;
    bz.prototype.setTileLoadFunction = bz.prototype.pb;
    bz.prototype.setTileUrlFunction = bz.prototype.sa;
    bz.prototype.getTileGrid = bz.prototype.Fa;
    bz.prototype.getAttributions = bz.prototype.Y;
    bz.prototype.getLogo = bz.prototype.W;
    bz.prototype.getProjection = bz.prototype.Z;
    bz.prototype.getState = bz.prototype.$;
    bz.prototype.changed = bz.prototype.o;
    bz.prototype.getRevision = bz.prototype.A;
    bz.prototype.on = bz.prototype.u;
    bz.prototype.once = bz.prototype.B;
    bz.prototype.un = bz.prototype.v;
    bz.prototype.unByKey = bz.prototype.C;
    fz.prototype.readFeatures = fz.prototype.a;
    fz.prototype.addFeature = fz.prototype.Ta;
    fz.prototype.addFeatures = fz.prototype.Ea;
    fz.prototype.clear = fz.prototype.clear;
    fz.prototype.forEachFeature = fz.prototype.Za;
    fz.prototype.forEachFeatureInExtent = fz.prototype.ua;
    fz.prototype.forEachFeatureIntersectingExtent = fz.prototype.Ja;
    fz.prototype.getFeatures = fz.prototype.ya;
    fz.prototype.getFeaturesAtCoordinate = fz.prototype.La;
    fz.prototype.getClosestFeatureToCoordinate = fz.prototype.$a;
    fz.prototype.getExtent = fz.prototype.D;
    fz.prototype.getFeatureById = fz.prototype.Ka;
    fz.prototype.removeFeature = fz.prototype.bb;
    fz.prototype.getAttributions = fz.prototype.Y;
    fz.prototype.getLogo = fz.prototype.W;
    fz.prototype.getProjection = fz.prototype.Z;
    fz.prototype.getState = fz.prototype.$;
    fz.prototype.changed = fz.prototype.o;
    fz.prototype.getRevision = fz.prototype.A;
    fz.prototype.on = fz.prototype.u;
    fz.prototype.once = fz.prototype.B;
    fz.prototype.un = fz.prototype.v;
    fz.prototype.unByKey = fz.prototype.C;
    hz.prototype.getTileLoadFunction = hz.prototype.jb;
    hz.prototype.getTileUrlFunction = hz.prototype.kb;
    hz.prototype.setTileLoadFunction = hz.prototype.pb;
    hz.prototype.setTileUrlFunction = hz.prototype.sa;
    hz.prototype.getTileGrid = hz.prototype.Fa;
    hz.prototype.getAttributions = hz.prototype.Y;
    hz.prototype.getLogo = hz.prototype.W;
    hz.prototype.getProjection = hz.prototype.Z;
    hz.prototype.getState = hz.prototype.$;
    hz.prototype.changed = hz.prototype.o;
    hz.prototype.getRevision = hz.prototype.A;
    hz.prototype.on = hz.prototype.u;
    hz.prototype.once = hz.prototype.B;
    hz.prototype.un = hz.prototype.v;
    hz.prototype.unByKey = hz.prototype.C;
    kz.prototype.getTileLoadFunction = kz.prototype.jb;
    kz.prototype.getTileUrlFunction = kz.prototype.kb;
    kz.prototype.setTileLoadFunction = kz.prototype.pb;
    kz.prototype.setTileUrlFunction = kz.prototype.sa;
    kz.prototype.getTileGrid = kz.prototype.Fa;
    kz.prototype.getAttributions = kz.prototype.Y;
    kz.prototype.getLogo = kz.prototype.W;
    kz.prototype.getProjection = kz.prototype.Z;
    kz.prototype.getState = kz.prototype.$;
    kz.prototype.changed = kz.prototype.o;
    kz.prototype.getRevision = kz.prototype.A;
    kz.prototype.on = kz.prototype.u;
    kz.prototype.once = kz.prototype.B;
    kz.prototype.un = kz.prototype.v;
    kz.prototype.unByKey = kz.prototype.C;
    E.prototype.bindTo = E.prototype.O;
    E.prototype.get = E.prototype.get;
    E.prototype.getKeys = E.prototype.J;
    E.prototype.getProperties = E.prototype.L;
    E.prototype.set = E.prototype.set;
    E.prototype.setProperties = E.prototype.G;
    E.prototype.unbind = E.prototype.P;
    E.prototype.unbindAll = E.prototype.Q;
    E.prototype.changed = E.prototype.o;
    E.prototype.getRevision = E.prototype.A;
    E.prototype.on = E.prototype.u;
    E.prototype.once = E.prototype.B;
    E.prototype.un = E.prototype.v;
    E.prototype.unByKey = E.prototype.C;
    F.prototype.getBrightness = F.prototype.c;
    F.prototype.getContrast = F.prototype.f;
    F.prototype.getHue = F.prototype.e;
    F.prototype.getExtent = F.prototype.D;
    F.prototype.getMaxResolution = F.prototype.g;
    F.prototype.getMinResolution = F.prototype.i;
    F.prototype.getOpacity = F.prototype.l;
    F.prototype.getSaturation = F.prototype.n;
    F.prototype.getVisible = F.prototype.b;
    F.prototype.setBrightness = F.prototype.s;
    F.prototype.setContrast = F.prototype.F;
    F.prototype.setHue = F.prototype.H;
    F.prototype.setExtent = F.prototype.p;
    F.prototype.setMaxResolution = F.prototype.S;
    F.prototype.setMinResolution = F.prototype.U;
    F.prototype.setOpacity = F.prototype.q;
    F.prototype.setSaturation = F.prototype.ba;
    F.prototype.setVisible = F.prototype.ca;
    F.prototype.bindTo = F.prototype.O;
    F.prototype.get = F.prototype.get;
    F.prototype.getKeys = F.prototype.J;
    F.prototype.getProperties = F.prototype.L;
    F.prototype.set = F.prototype.set;
    F.prototype.setProperties = F.prototype.G;
    F.prototype.unbind = F.prototype.P;
    F.prototype.unbindAll = F.prototype.Q;
    F.prototype.changed = F.prototype.o;
    F.prototype.getRevision = F.prototype.A;
    F.prototype.on = F.prototype.u;
    F.prototype.once = F.prototype.B;
    F.prototype.un = F.prototype.v;
    F.prototype.unByKey = F.prototype.C;
    K.prototype.setSource = K.prototype.ea;
    K.prototype.getBrightness = K.prototype.c;
    K.prototype.getContrast = K.prototype.f;
    K.prototype.getHue = K.prototype.e;
    K.prototype.getExtent = K.prototype.D;
    K.prototype.getMaxResolution = K.prototype.g;
    K.prototype.getMinResolution = K.prototype.i;
    K.prototype.getOpacity = K.prototype.l;
    K.prototype.getSaturation = K.prototype.n;
    K.prototype.getVisible = K.prototype.b;
    K.prototype.setBrightness = K.prototype.s;
    K.prototype.setContrast = K.prototype.F;
    K.prototype.setHue = K.prototype.H;
    K.prototype.setExtent = K.prototype.p;
    K.prototype.setMaxResolution = K.prototype.S;
    K.prototype.setMinResolution = K.prototype.U;
    K.prototype.setOpacity = K.prototype.q;
    K.prototype.setSaturation = K.prototype.ba;
    K.prototype.setVisible = K.prototype.ca;
    K.prototype.bindTo = K.prototype.O;
    K.prototype.get = K.prototype.get;
    K.prototype.getKeys = K.prototype.J;
    K.prototype.getProperties = K.prototype.L;
    K.prototype.set = K.prototype.set;
    K.prototype.setProperties = K.prototype.G;
    K.prototype.unbind = K.prototype.P;
    K.prototype.unbindAll = K.prototype.Q;
    K.prototype.changed = K.prototype.o;
    K.prototype.getRevision = K.prototype.A;
    K.prototype.on = K.prototype.u;
    K.prototype.once = K.prototype.B;
    K.prototype.un = K.prototype.v;
    K.prototype.unByKey = K.prototype.C;
    $.prototype.getSource = $.prototype.a;
    $.prototype.getStyle = $.prototype.Vc;
    $.prototype.getStyleFunction = $.prototype.Wc;
    $.prototype.setStyle = $.prototype.ka;
    $.prototype.setSource = $.prototype.ea;
    $.prototype.getBrightness = $.prototype.c;
    $.prototype.getContrast = $.prototype.f;
    $.prototype.getHue = $.prototype.e;
    $.prototype.getExtent = $.prototype.D;
    $.prototype.getMaxResolution = $.prototype.g;
    $.prototype.getMinResolution = $.prototype.i;
    $.prototype.getOpacity = $.prototype.l;
    $.prototype.getSaturation = $.prototype.n;
    $.prototype.getVisible = $.prototype.b;
    $.prototype.setBrightness = $.prototype.s;
    $.prototype.setContrast = $.prototype.F;
    $.prototype.setHue = $.prototype.H;
    $.prototype.setExtent = $.prototype.p;
    $.prototype.setMaxResolution = $.prototype.S;
    $.prototype.setMinResolution = $.prototype.U;
    $.prototype.setOpacity = $.prototype.q;
    $.prototype.setSaturation = $.prototype.ba;
    $.prototype.setVisible = $.prototype.ca;
    $.prototype.bindTo = $.prototype.O;
    $.prototype.get = $.prototype.get;
    $.prototype.getKeys = $.prototype.J;
    $.prototype.getProperties = $.prototype.L;
    $.prototype.set = $.prototype.set;
    $.prototype.setProperties = $.prototype.G;
    $.prototype.unbind = $.prototype.P;
    $.prototype.unbindAll = $.prototype.Q;
    $.prototype.changed = $.prototype.o;
    $.prototype.getRevision = $.prototype.A;
    $.prototype.on = $.prototype.u;
    $.prototype.once = $.prototype.B;
    $.prototype.un = $.prototype.v;
    $.prototype.unByKey = $.prototype.C;
    I.prototype.setSource = I.prototype.ea;
    I.prototype.getBrightness = I.prototype.c;
    I.prototype.getContrast = I.prototype.f;
    I.prototype.getHue = I.prototype.e;
    I.prototype.getExtent = I.prototype.D;
    I.prototype.getMaxResolution = I.prototype.g;
    I.prototype.getMinResolution = I.prototype.i;
    I.prototype.getOpacity = I.prototype.l;
    I.prototype.getSaturation = I.prototype.n;
    I.prototype.getVisible = I.prototype.b;
    I.prototype.setBrightness = I.prototype.s;
    I.prototype.setContrast = I.prototype.F;
    I.prototype.setHue = I.prototype.H;
    I.prototype.setExtent = I.prototype.p;
    I.prototype.setMaxResolution = I.prototype.S;
    I.prototype.setMinResolution = I.prototype.U;
    I.prototype.setOpacity = I.prototype.q;
    I.prototype.setSaturation = I.prototype.ba;
    I.prototype.setVisible = I.prototype.ca;
    I.prototype.bindTo = I.prototype.O;
    I.prototype.get = I.prototype.get;
    I.prototype.getKeys = I.prototype.J;
    I.prototype.getProperties = I.prototype.L;
    I.prototype.set = I.prototype.set;
    I.prototype.setProperties = I.prototype.G;
    I.prototype.unbind = I.prototype.P;
    I.prototype.unbindAll = I.prototype.Q;
    I.prototype.changed = I.prototype.o;
    I.prototype.getRevision = I.prototype.A;
    I.prototype.on = I.prototype.u;
    I.prototype.once = I.prototype.B;
    I.prototype.un = I.prototype.v;
    I.prototype.unByKey = I.prototype.C;
    H.prototype.getBrightness = H.prototype.c;
    H.prototype.getContrast = H.prototype.f;
    H.prototype.getHue = H.prototype.e;
    H.prototype.getExtent = H.prototype.D;
    H.prototype.getMaxResolution = H.prototype.g;
    H.prototype.getMinResolution = H.prototype.i;
    H.prototype.getOpacity = H.prototype.l;
    H.prototype.getSaturation = H.prototype.n;
    H.prototype.getVisible = H.prototype.b;
    H.prototype.setBrightness = H.prototype.s;
    H.prototype.setContrast = H.prototype.F;
    H.prototype.setHue = H.prototype.H;
    H.prototype.setExtent = H.prototype.p;
    H.prototype.setMaxResolution = H.prototype.S;
    H.prototype.setMinResolution = H.prototype.U;
    H.prototype.setOpacity = H.prototype.q;
    H.prototype.setSaturation = H.prototype.ba;
    H.prototype.setVisible = H.prototype.ca;
    H.prototype.bindTo = H.prototype.O;
    H.prototype.get = H.prototype.get;
    H.prototype.getKeys = H.prototype.J;
    H.prototype.getProperties = H.prototype.L;
    H.prototype.set = H.prototype.set;
    H.prototype.setProperties = H.prototype.G;
    H.prototype.unbind = H.prototype.P;
    H.prototype.unbindAll = H.prototype.Q;
    H.prototype.changed = H.prototype.o;
    H.prototype.getRevision = H.prototype.A;
    H.prototype.on = H.prototype.u;
    H.prototype.once = H.prototype.B;
    H.prototype.un = H.prototype.v;
    H.prototype.unByKey = H.prototype.C;
    J.prototype.setSource = J.prototype.ea;
    J.prototype.getBrightness = J.prototype.c;
    J.prototype.getContrast = J.prototype.f;
    J.prototype.getHue = J.prototype.e;
    J.prototype.getExtent = J.prototype.D;
    J.prototype.getMaxResolution = J.prototype.g;
    J.prototype.getMinResolution = J.prototype.i;
    J.prototype.getOpacity = J.prototype.l;
    J.prototype.getSaturation = J.prototype.n;
    J.prototype.getVisible = J.prototype.b;
    J.prototype.setBrightness = J.prototype.s;
    J.prototype.setContrast = J.prototype.F;
    J.prototype.setHue = J.prototype.H;
    J.prototype.setExtent = J.prototype.p;
    J.prototype.setMaxResolution = J.prototype.S;
    J.prototype.setMinResolution = J.prototype.U;
    J.prototype.setOpacity = J.prototype.q;
    J.prototype.setSaturation = J.prototype.ba;
    J.prototype.setVisible = J.prototype.ca;
    J.prototype.bindTo = J.prototype.O;
    J.prototype.get = J.prototype.get;
    J.prototype.getKeys = J.prototype.J;
    J.prototype.getProperties = J.prototype.L;
    J.prototype.set = J.prototype.set;
    J.prototype.setProperties = J.prototype.G;
    J.prototype.unbind = J.prototype.P;
    J.prototype.unbindAll = J.prototype.Q;
    J.prototype.changed = J.prototype.o;
    J.prototype.getRevision = J.prototype.A;
    J.prototype.on = J.prototype.u;
    J.prototype.once = J.prototype.B;
    J.prototype.un = J.prototype.v;
    J.prototype.unByKey = J.prototype.C;
    Ij.prototype.bindTo = Ij.prototype.O;
    Ij.prototype.get = Ij.prototype.get;
    Ij.prototype.getKeys = Ij.prototype.J;
    Ij.prototype.getProperties = Ij.prototype.L;
    Ij.prototype.set = Ij.prototype.set;
    Ij.prototype.setProperties = Ij.prototype.G;
    Ij.prototype.unbind = Ij.prototype.P;
    Ij.prototype.unbindAll = Ij.prototype.Q;
    Ij.prototype.changed = Ij.prototype.o;
    Ij.prototype.getRevision = Ij.prototype.A;
    Ij.prototype.on = Ij.prototype.u;
    Ij.prototype.once = Ij.prototype.B;
    Ij.prototype.un = Ij.prototype.v;
    Ij.prototype.unByKey = Ij.prototype.C;
    Mj.prototype.getActive = Mj.prototype.a;
    Mj.prototype.setActive = Mj.prototype.b;
    Mj.prototype.bindTo = Mj.prototype.O;
    Mj.prototype.get = Mj.prototype.get;
    Mj.prototype.getKeys = Mj.prototype.J;
    Mj.prototype.getProperties = Mj.prototype.L;
    Mj.prototype.set = Mj.prototype.set;
    Mj.prototype.setProperties = Mj.prototype.G;
    Mj.prototype.unbind = Mj.prototype.P;
    Mj.prototype.unbindAll = Mj.prototype.Q;
    Mj.prototype.changed = Mj.prototype.o;
    Mj.prototype.getRevision = Mj.prototype.A;
    Mj.prototype.on = Mj.prototype.u;
    Mj.prototype.once = Mj.prototype.B;
    Mj.prototype.un = Mj.prototype.v;
    Mj.prototype.unByKey = Mj.prototype.C;
    Lw.prototype.getActive = Lw.prototype.a;
    Lw.prototype.setActive = Lw.prototype.b;
    Lw.prototype.bindTo = Lw.prototype.O;
    Lw.prototype.get = Lw.prototype.get;
    Lw.prototype.getKeys = Lw.prototype.J;
    Lw.prototype.getProperties = Lw.prototype.L;
    Lw.prototype.set = Lw.prototype.set;
    Lw.prototype.setProperties = Lw.prototype.G;
    Lw.prototype.unbind = Lw.prototype.P;
    Lw.prototype.unbindAll = Lw.prototype.Q;
    Lw.prototype.changed = Lw.prototype.o;
    Lw.prototype.getRevision = Lw.prototype.A;
    Lw.prototype.on = Lw.prototype.u;
    Lw.prototype.once = Lw.prototype.B;
    Lw.prototype.un = Lw.prototype.v;
    Lw.prototype.unByKey = Lw.prototype.C;
    Vj.prototype.getActive = Vj.prototype.a;
    Vj.prototype.setActive = Vj.prototype.b;
    Vj.prototype.bindTo = Vj.prototype.O;
    Vj.prototype.get = Vj.prototype.get;
    Vj.prototype.getKeys = Vj.prototype.J;
    Vj.prototype.getProperties = Vj.prototype.L;
    Vj.prototype.set = Vj.prototype.set;
    Vj.prototype.setProperties = Vj.prototype.G;
    Vj.prototype.unbind = Vj.prototype.P;
    Vj.prototype.unbindAll = Vj.prototype.Q;
    Vj.prototype.changed = Vj.prototype.o;
    Vj.prototype.getRevision = Vj.prototype.A;
    Vj.prototype.on = Vj.prototype.u;
    Vj.prototype.once = Vj.prototype.B;
    Vj.prototype.un = Vj.prototype.v;
    Vj.prototype.unByKey = Vj.prototype.C;
    Zk.prototype.getActive = Zk.prototype.a;
    Zk.prototype.setActive = Zk.prototype.b;
    Zk.prototype.bindTo = Zk.prototype.O;
    Zk.prototype.get = Zk.prototype.get;
    Zk.prototype.getKeys = Zk.prototype.J;
    Zk.prototype.getProperties = Zk.prototype.L;
    Zk.prototype.set = Zk.prototype.set;
    Zk.prototype.setProperties = Zk.prototype.G;
    Zk.prototype.unbind = Zk.prototype.P;
    Zk.prototype.unbindAll = Zk.prototype.Q;
    Zk.prototype.changed = Zk.prototype.o;
    Zk.prototype.getRevision = Zk.prototype.A;
    Zk.prototype.on = Zk.prototype.u;
    Zk.prototype.once = Zk.prototype.B;
    Zk.prototype.un = Zk.prototype.v;
    Zk.prototype.unByKey = Zk.prototype.C;
    Yj.prototype.getActive = Yj.prototype.a;
    Yj.prototype.setActive = Yj.prototype.b;
    Yj.prototype.bindTo = Yj.prototype.O;
    Yj.prototype.get = Yj.prototype.get;
    Yj.prototype.getKeys = Yj.prototype.J;
    Yj.prototype.getProperties = Yj.prototype.L;
    Yj.prototype.set = Yj.prototype.set;
    Yj.prototype.setProperties = Yj.prototype.G;
    Yj.prototype.unbind = Yj.prototype.P;
    Yj.prototype.unbindAll = Yj.prototype.Q;
    Yj.prototype.changed = Yj.prototype.o;
    Yj.prototype.getRevision = Yj.prototype.A;
    Yj.prototype.on = Yj.prototype.u;
    Yj.prototype.once = Yj.prototype.B;
    Yj.prototype.un = Yj.prototype.v;
    Yj.prototype.unByKey = Yj.prototype.C;
    Pw.prototype.getActive = Pw.prototype.a;
    Pw.prototype.setActive = Pw.prototype.b;
    Pw.prototype.bindTo = Pw.prototype.O;
    Pw.prototype.get = Pw.prototype.get;
    Pw.prototype.getKeys = Pw.prototype.J;
    Pw.prototype.getProperties = Pw.prototype.L;
    Pw.prototype.set = Pw.prototype.set;
    Pw.prototype.setProperties = Pw.prototype.G;
    Pw.prototype.unbind = Pw.prototype.P;
    Pw.prototype.unbindAll = Pw.prototype.Q;
    Pw.prototype.changed = Pw.prototype.o;
    Pw.prototype.getRevision = Pw.prototype.A;
    Pw.prototype.on = Pw.prototype.u;
    Pw.prototype.once = Pw.prototype.B;
    Pw.prototype.un = Pw.prototype.v;
    Pw.prototype.unByKey = Pw.prototype.C;
    ck.prototype.getActive = ck.prototype.a;
    ck.prototype.setActive = ck.prototype.b;
    ck.prototype.bindTo = ck.prototype.O;
    ck.prototype.get = ck.prototype.get;
    ck.prototype.getKeys = ck.prototype.J;
    ck.prototype.getProperties = ck.prototype.L;
    ck.prototype.set = ck.prototype.set;
    ck.prototype.setProperties = ck.prototype.G;
    ck.prototype.unbind = ck.prototype.P;
    ck.prototype.unbindAll = ck.prototype.Q;
    ck.prototype.changed = ck.prototype.o;
    ck.prototype.getRevision = ck.prototype.A;
    ck.prototype.on = ck.prototype.u;
    ck.prototype.once = ck.prototype.B;
    ck.prototype.un = ck.prototype.v;
    ck.prototype.unByKey = ck.prototype.C;
    rl.prototype.getGeometry = rl.prototype.N;
    rl.prototype.getActive = rl.prototype.a;
    rl.prototype.setActive = rl.prototype.b;
    rl.prototype.bindTo = rl.prototype.O;
    rl.prototype.get = rl.prototype.get;
    rl.prototype.getKeys = rl.prototype.J;
    rl.prototype.getProperties = rl.prototype.L;
    rl.prototype.set = rl.prototype.set;
    rl.prototype.setProperties = rl.prototype.G;
    rl.prototype.unbind = rl.prototype.P;
    rl.prototype.unbindAll = rl.prototype.Q;
    rl.prototype.changed = rl.prototype.o;
    rl.prototype.getRevision = rl.prototype.A;
    rl.prototype.on = rl.prototype.u;
    rl.prototype.once = rl.prototype.B;
    rl.prototype.un = rl.prototype.v;
    rl.prototype.unByKey = rl.prototype.C;
    Uw.prototype.getActive = Uw.prototype.a;
    Uw.prototype.setActive = Uw.prototype.b;
    Uw.prototype.bindTo = Uw.prototype.O;
    Uw.prototype.get = Uw.prototype.get;
    Uw.prototype.getKeys = Uw.prototype.J;
    Uw.prototype.getProperties = Uw.prototype.L;
    Uw.prototype.set = Uw.prototype.set;
    Uw.prototype.setProperties = Uw.prototype.G;
    Uw.prototype.unbind = Uw.prototype.P;
    Uw.prototype.unbindAll = Uw.prototype.Q;
    Uw.prototype.changed = Uw.prototype.o;
    Uw.prototype.getRevision = Uw.prototype.A;
    Uw.prototype.on = Uw.prototype.u;
    Uw.prototype.once = Uw.prototype.B;
    Uw.prototype.un = Uw.prototype.v;
    Uw.prototype.unByKey = Uw.prototype.C;
    sl.prototype.getActive = sl.prototype.a;
    sl.prototype.setActive = sl.prototype.b;
    sl.prototype.bindTo = sl.prototype.O;
    sl.prototype.get = sl.prototype.get;
    sl.prototype.getKeys = sl.prototype.J;
    sl.prototype.getProperties = sl.prototype.L;
    sl.prototype.set = sl.prototype.set;
    sl.prototype.setProperties = sl.prototype.G;
    sl.prototype.unbind = sl.prototype.P;
    sl.prototype.unbindAll = sl.prototype.Q;
    sl.prototype.changed = sl.prototype.o;
    sl.prototype.getRevision = sl.prototype.A;
    sl.prototype.on = sl.prototype.u;
    sl.prototype.once = sl.prototype.B;
    sl.prototype.un = sl.prototype.v;
    sl.prototype.unByKey = sl.prototype.C;
    ul.prototype.getActive = ul.prototype.a;
    ul.prototype.setActive = ul.prototype.b;
    ul.prototype.bindTo = ul.prototype.O;
    ul.prototype.get = ul.prototype.get;
    ul.prototype.getKeys = ul.prototype.J;
    ul.prototype.getProperties = ul.prototype.L;
    ul.prototype.set = ul.prototype.set;
    ul.prototype.setProperties = ul.prototype.G;
    ul.prototype.unbind = ul.prototype.P;
    ul.prototype.unbindAll = ul.prototype.Q;
    ul.prototype.changed = ul.prototype.o;
    ul.prototype.getRevision = ul.prototype.A;
    ul.prototype.on = ul.prototype.u;
    ul.prototype.once = ul.prototype.B;
    ul.prototype.un = ul.prototype.v;
    ul.prototype.unByKey = ul.prototype.C;
    gx.prototype.getActive = gx.prototype.a;
    gx.prototype.setActive = gx.prototype.b;
    gx.prototype.bindTo = gx.prototype.O;
    gx.prototype.get = gx.prototype.get;
    gx.prototype.getKeys = gx.prototype.J;
    gx.prototype.getProperties = gx.prototype.L;
    gx.prototype.set = gx.prototype.set;
    gx.prototype.setProperties = gx.prototype.G;
    gx.prototype.unbind = gx.prototype.P;
    gx.prototype.unbindAll = gx.prototype.Q;
    gx.prototype.changed = gx.prototype.o;
    gx.prototype.getRevision = gx.prototype.A;
    gx.prototype.on = gx.prototype.u;
    gx.prototype.once = gx.prototype.B;
    gx.prototype.un = gx.prototype.v;
    gx.prototype.unByKey = gx.prototype.C;
    wl.prototype.getActive = wl.prototype.a;
    wl.prototype.setActive = wl.prototype.b;
    wl.prototype.bindTo = wl.prototype.O;
    wl.prototype.get = wl.prototype.get;
    wl.prototype.getKeys = wl.prototype.J;
    wl.prototype.getProperties = wl.prototype.L;
    wl.prototype.set = wl.prototype.set;
    wl.prototype.setProperties = wl.prototype.G;
    wl.prototype.unbind = wl.prototype.P;
    wl.prototype.unbindAll = wl.prototype.Q;
    wl.prototype.changed = wl.prototype.o;
    wl.prototype.getRevision = wl.prototype.A;
    wl.prototype.on = wl.prototype.u;
    wl.prototype.once = wl.prototype.B;
    wl.prototype.un = wl.prototype.v;
    wl.prototype.unByKey = wl.prototype.C;
    yl.prototype.getActive = yl.prototype.a;
    yl.prototype.setActive = yl.prototype.b;
    yl.prototype.bindTo = yl.prototype.O;
    yl.prototype.get = yl.prototype.get;
    yl.prototype.getKeys = yl.prototype.J;
    yl.prototype.getProperties = yl.prototype.L;
    yl.prototype.set = yl.prototype.set;
    yl.prototype.setProperties = yl.prototype.G;
    yl.prototype.unbind = yl.prototype.P;
    yl.prototype.unbindAll = yl.prototype.Q;
    yl.prototype.changed = yl.prototype.o;
    yl.prototype.getRevision = yl.prototype.A;
    yl.prototype.on = yl.prototype.u;
    yl.prototype.once = yl.prototype.B;
    yl.prototype.un = yl.prototype.v;
    yl.prototype.unByKey = yl.prototype.C;
    Cl.prototype.getActive = Cl.prototype.a;
    Cl.prototype.setActive = Cl.prototype.b;
    Cl.prototype.bindTo = Cl.prototype.O;
    Cl.prototype.get = Cl.prototype.get;
    Cl.prototype.getKeys = Cl.prototype.J;
    Cl.prototype.getProperties = Cl.prototype.L;
    Cl.prototype.set = Cl.prototype.set;
    Cl.prototype.setProperties = Cl.prototype.G;
    Cl.prototype.unbind = Cl.prototype.P;
    Cl.prototype.unbindAll = Cl.prototype.Q;
    Cl.prototype.changed = Cl.prototype.o;
    Cl.prototype.getRevision = Cl.prototype.A;
    Cl.prototype.on = Cl.prototype.u;
    Cl.prototype.once = Cl.prototype.B;
    Cl.prototype.un = Cl.prototype.v;
    Cl.prototype.unByKey = Cl.prototype.C;
    px.prototype.getActive = px.prototype.a;
    px.prototype.setActive = px.prototype.b;
    px.prototype.bindTo = px.prototype.O;
    px.prototype.get = px.prototype.get;
    px.prototype.getKeys = px.prototype.J;
    px.prototype.getProperties = px.prototype.L;
    px.prototype.set = px.prototype.set;
    px.prototype.setProperties = px.prototype.G;
    px.prototype.unbind = px.prototype.P;
    px.prototype.unbindAll = px.prototype.Q;
    px.prototype.changed = px.prototype.o;
    px.prototype.getRevision = px.prototype.A;
    px.prototype.on = px.prototype.u;
    px.prototype.once = px.prototype.B;
    px.prototype.un = px.prototype.v;
    px.prototype.unByKey = px.prototype.C;
    gk.prototype.changed = gk.prototype.o;
    gk.prototype.getRevision = gk.prototype.A;
    gk.prototype.on = gk.prototype.u;
    gk.prototype.once = gk.prototype.B;
    gk.prototype.un = gk.prototype.v;
    gk.prototype.unByKey = gk.prototype.C;
    ik.prototype.clone = ik.prototype.clone;
    ik.prototype.getClosestPoint = ik.prototype.f;
    ik.prototype.getExtent = ik.prototype.D;
    ik.prototype.getType = ik.prototype.I;
    ik.prototype.intersectsExtent = ik.prototype.ja;
    ik.prototype.transform = ik.prototype.transform;
    ik.prototype.changed = ik.prototype.o;
    ik.prototype.getRevision = ik.prototype.A;
    ik.prototype.on = ik.prototype.u;
    ik.prototype.once = ik.prototype.B;
    ik.prototype.un = ik.prototype.v;
    ik.prototype.unByKey = ik.prototype.C;
    Am.prototype.getFirstCoordinate = Am.prototype.wb;
    Am.prototype.getLastCoordinate = Am.prototype.xb;
    Am.prototype.getLayout = Am.prototype.yb;
    Am.prototype.applyTransform = Am.prototype.qa;
    Am.prototype.translate = Am.prototype.Ga;
    Am.prototype.getClosestPoint = Am.prototype.f;
    Am.prototype.getExtent = Am.prototype.D;
    Am.prototype.intersectsExtent = Am.prototype.ja;
    Am.prototype.changed = Am.prototype.o;
    Am.prototype.getRevision = Am.prototype.A;
    Am.prototype.on = Am.prototype.u;
    Am.prototype.once = Am.prototype.B;
    Am.prototype.un = Am.prototype.v;
    Am.prototype.unByKey = Am.prototype.C;
    Cm.prototype.getClosestPoint = Cm.prototype.f;
    Cm.prototype.getExtent = Cm.prototype.D;
    Cm.prototype.transform = Cm.prototype.transform;
    Cm.prototype.changed = Cm.prototype.o;
    Cm.prototype.getRevision = Cm.prototype.A;
    Cm.prototype.on = Cm.prototype.u;
    Cm.prototype.once = Cm.prototype.B;
    Cm.prototype.un = Cm.prototype.v;
    Cm.prototype.unByKey = Cm.prototype.C;
    Ck.prototype.getFirstCoordinate = Ck.prototype.wb;
    Ck.prototype.getLastCoordinate = Ck.prototype.xb;
    Ck.prototype.getLayout = Ck.prototype.yb;
    Ck.prototype.applyTransform = Ck.prototype.qa;
    Ck.prototype.translate = Ck.prototype.Ga;
    Ck.prototype.getClosestPoint = Ck.prototype.f;
    Ck.prototype.getExtent = Ck.prototype.D;
    Ck.prototype.intersectsExtent = Ck.prototype.ja;
    Ck.prototype.transform = Ck.prototype.transform;
    Ck.prototype.changed = Ck.prototype.o;
    Ck.prototype.getRevision = Ck.prototype.A;
    Ck.prototype.on = Ck.prototype.u;
    Ck.prototype.once = Ck.prototype.B;
    Ck.prototype.un = Ck.prototype.v;
    Ck.prototype.unByKey = Ck.prototype.C;
    L.prototype.getFirstCoordinate = L.prototype.wb;
    L.prototype.getLastCoordinate = L.prototype.xb;
    L.prototype.getLayout = L.prototype.yb;
    L.prototype.applyTransform = L.prototype.qa;
    L.prototype.translate = L.prototype.Ga;
    L.prototype.getClosestPoint = L.prototype.f;
    L.prototype.getExtent = L.prototype.D;
    L.prototype.transform = L.prototype.transform;
    L.prototype.changed = L.prototype.o;
    L.prototype.getRevision = L.prototype.A;
    L.prototype.on = L.prototype.u;
    L.prototype.once = L.prototype.B;
    L.prototype.un = L.prototype.v;
    L.prototype.unByKey = L.prototype.C;
    Km.prototype.getFirstCoordinate = Km.prototype.wb;
    Km.prototype.getLastCoordinate = Km.prototype.xb;
    Km.prototype.getLayout = Km.prototype.yb;
    Km.prototype.applyTransform = Km.prototype.qa;
    Km.prototype.translate = Km.prototype.Ga;
    Km.prototype.getClosestPoint = Km.prototype.f;
    Km.prototype.getExtent = Km.prototype.D;
    Km.prototype.transform = Km.prototype.transform;
    Km.prototype.changed = Km.prototype.o;
    Km.prototype.getRevision = Km.prototype.A;
    Km.prototype.on = Km.prototype.u;
    Km.prototype.once = Km.prototype.B;
    Km.prototype.un = Km.prototype.v;
    Km.prototype.unByKey = Km.prototype.C;
    Nm.prototype.getFirstCoordinate = Nm.prototype.wb;
    Nm.prototype.getLastCoordinate = Nm.prototype.xb;
    Nm.prototype.getLayout = Nm.prototype.yb;
    Nm.prototype.applyTransform = Nm.prototype.qa;
    Nm.prototype.translate = Nm.prototype.Ga;
    Nm.prototype.getClosestPoint = Nm.prototype.f;
    Nm.prototype.getExtent = Nm.prototype.D;
    Nm.prototype.transform = Nm.prototype.transform;
    Nm.prototype.changed = Nm.prototype.o;
    Nm.prototype.getRevision = Nm.prototype.A;
    Nm.prototype.on = Nm.prototype.u;
    Nm.prototype.once = Nm.prototype.B;
    Nm.prototype.un = Nm.prototype.v;
    Nm.prototype.unByKey = Nm.prototype.C;
    Om.prototype.getFirstCoordinate = Om.prototype.wb;
    Om.prototype.getLastCoordinate = Om.prototype.xb;
    Om.prototype.getLayout = Om.prototype.yb;
    Om.prototype.applyTransform = Om.prototype.qa;
    Om.prototype.translate = Om.prototype.Ga;
    Om.prototype.getClosestPoint = Om.prototype.f;
    Om.prototype.getExtent = Om.prototype.D;
    Om.prototype.transform = Om.prototype.transform;
    Om.prototype.changed = Om.prototype.o;
    Om.prototype.getRevision = Om.prototype.A;
    Om.prototype.on = Om.prototype.u;
    Om.prototype.once = Om.prototype.B;
    Om.prototype.un = Om.prototype.v;
    Om.prototype.unByKey = Om.prototype.C;
    Ek.prototype.getFirstCoordinate = Ek.prototype.wb;
    Ek.prototype.getLastCoordinate = Ek.prototype.xb;
    Ek.prototype.getLayout = Ek.prototype.yb;
    Ek.prototype.applyTransform = Ek.prototype.qa;
    Ek.prototype.translate = Ek.prototype.Ga;
    Ek.prototype.getClosestPoint = Ek.prototype.f;
    Ek.prototype.getExtent = Ek.prototype.D;
    Ek.prototype.transform = Ek.prototype.transform;
    Ek.prototype.changed = Ek.prototype.o;
    Ek.prototype.getRevision = Ek.prototype.A;
    Ek.prototype.on = Ek.prototype.u;
    Ek.prototype.once = Ek.prototype.B;
    Ek.prototype.un = Ek.prototype.v;
    Ek.prototype.unByKey = Ek.prototype.C;
    G.prototype.getFirstCoordinate = G.prototype.wb;
    G.prototype.getLastCoordinate = G.prototype.xb;
    G.prototype.getLayout = G.prototype.yb;
    G.prototype.applyTransform = G.prototype.qa;
    G.prototype.translate = G.prototype.Ga;
    G.prototype.getClosestPoint = G.prototype.f;
    G.prototype.getExtent = G.prototype.D;
    G.prototype.transform = G.prototype.transform;
    G.prototype.changed = G.prototype.o;
    G.prototype.getRevision = G.prototype.A;
    G.prototype.on = G.prototype.u;
    G.prototype.once = G.prototype.B;
    G.prototype.un = G.prototype.v;
    G.prototype.unByKey = G.prototype.C;
    Oq.prototype.readFeatures = Oq.prototype.ma;
    Y.prototype.readFeatures = Y.prototype.ma;
    Y.prototype.readFeatures = Y.prototype.ma;
    np.prototype.bindTo = np.prototype.O;
    np.prototype.get = np.prototype.get;
    np.prototype.getKeys = np.prototype.J;
    np.prototype.getProperties = np.prototype.L;
    np.prototype.set = np.prototype.set;
    np.prototype.setProperties = np.prototype.G;
    np.prototype.unbind = np.prototype.P;
    np.prototype.unbindAll = np.prototype.Q;
    np.prototype.changed = np.prototype.o;
    np.prototype.getRevision = np.prototype.A;
    np.prototype.on = np.prototype.u;
    np.prototype.once = np.prototype.B;
    np.prototype.un = np.prototype.v;
    np.prototype.unByKey = np.prototype.C;
    Ug.prototype.bindTo = Ug.prototype.O;
    Ug.prototype.get = Ug.prototype.get;
    Ug.prototype.getKeys = Ug.prototype.J;
    Ug.prototype.getProperties = Ug.prototype.L;
    Ug.prototype.set = Ug.prototype.set;
    Ug.prototype.setProperties = Ug.prototype.G;
    Ug.prototype.unbind = Ug.prototype.P;
    Ug.prototype.unbindAll = Ug.prototype.Q;
    Ug.prototype.changed = Ug.prototype.o;
    Ug.prototype.getRevision = Ug.prototype.A;
    Ug.prototype.on = Ug.prototype.u;
    Ug.prototype.once = Ug.prototype.B;
    Ug.prototype.un = Ug.prototype.v;
    Ug.prototype.unByKey = Ug.prototype.C;
    Vg.prototype.getMap = Vg.prototype.f;
    Vg.prototype.setMap = Vg.prototype.setMap;
    Vg.prototype.setTarget = Vg.prototype.b;
    Vg.prototype.bindTo = Vg.prototype.O;
    Vg.prototype.get = Vg.prototype.get;
    Vg.prototype.getKeys = Vg.prototype.J;
    Vg.prototype.getProperties = Vg.prototype.L;
    Vg.prototype.set = Vg.prototype.set;
    Vg.prototype.setProperties = Vg.prototype.G;
    Vg.prototype.unbind = Vg.prototype.P;
    Vg.prototype.unbindAll = Vg.prototype.Q;
    Vg.prototype.changed = Vg.prototype.o;
    Vg.prototype.getRevision = Vg.prototype.A;
    Vg.prototype.on = Vg.prototype.u;
    Vg.prototype.once = Vg.prototype.B;
    Vg.prototype.un = Vg.prototype.v;
    Vg.prototype.unByKey = Vg.prototype.C;
    fh.prototype.getMap = fh.prototype.f;
    fh.prototype.setMap = fh.prototype.setMap;
    fh.prototype.setTarget = fh.prototype.b;
    fh.prototype.bindTo = fh.prototype.O;
    fh.prototype.get = fh.prototype.get;
    fh.prototype.getKeys = fh.prototype.J;
    fh.prototype.getProperties = fh.prototype.L;
    fh.prototype.set = fh.prototype.set;
    fh.prototype.setProperties = fh.prototype.G;
    fh.prototype.unbind = fh.prototype.P;
    fh.prototype.unbindAll = fh.prototype.Q;
    fh.prototype.changed = fh.prototype.o;
    fh.prototype.getRevision = fh.prototype.A;
    fh.prototype.on = fh.prototype.u;
    fh.prototype.once = fh.prototype.B;
    fh.prototype.un = fh.prototype.v;
    fh.prototype.unByKey = fh.prototype.C;
    gh.prototype.getMap = gh.prototype.f;
    gh.prototype.setTarget = gh.prototype.b;
    gh.prototype.bindTo = gh.prototype.O;
    gh.prototype.get = gh.prototype.get;
    gh.prototype.getKeys = gh.prototype.J;
    gh.prototype.getProperties = gh.prototype.L;
    gh.prototype.set = gh.prototype.set;
    gh.prototype.setProperties = gh.prototype.G;
    gh.prototype.unbind = gh.prototype.P;
    gh.prototype.unbindAll = gh.prototype.Q;
    gh.prototype.changed = gh.prototype.o;
    gh.prototype.getRevision = gh.prototype.A;
    gh.prototype.on = gh.prototype.u;
    gh.prototype.once = gh.prototype.B;
    gh.prototype.un = gh.prototype.v;
    gh.prototype.unByKey = gh.prototype.C;
    Mo.prototype.getMap = Mo.prototype.f;
    Mo.prototype.setTarget = Mo.prototype.b;
    Mo.prototype.bindTo = Mo.prototype.O;
    Mo.prototype.get = Mo.prototype.get;
    Mo.prototype.getKeys = Mo.prototype.J;
    Mo.prototype.getProperties = Mo.prototype.L;
    Mo.prototype.set = Mo.prototype.set;
    Mo.prototype.setProperties = Mo.prototype.G;
    Mo.prototype.unbind = Mo.prototype.P;
    Mo.prototype.unbindAll = Mo.prototype.Q;
    Mo.prototype.changed = Mo.prototype.o;
    Mo.prototype.getRevision = Mo.prototype.A;
    Mo.prototype.on = Mo.prototype.u;
    Mo.prototype.once = Mo.prototype.B;
    Mo.prototype.un = Mo.prototype.v;
    Mo.prototype.unByKey = Mo.prototype.C;
    Yg.prototype.getMap = Yg.prototype.f;
    Yg.prototype.setMap = Yg.prototype.setMap;
    Yg.prototype.setTarget = Yg.prototype.b;
    Yg.prototype.bindTo = Yg.prototype.O;
    Yg.prototype.get = Yg.prototype.get;
    Yg.prototype.getKeys = Yg.prototype.J;
    Yg.prototype.getProperties = Yg.prototype.L;
    Yg.prototype.set = Yg.prototype.set;
    Yg.prototype.setProperties = Yg.prototype.G;
    Yg.prototype.unbind = Yg.prototype.P;
    Yg.prototype.unbindAll = Yg.prototype.Q;
    Yg.prototype.changed = Yg.prototype.o;
    Yg.prototype.getRevision = Yg.prototype.A;
    Yg.prototype.on = Yg.prototype.u;
    Yg.prototype.once = Yg.prototype.B;
    Yg.prototype.un = Yg.prototype.v;
    Yg.prototype.unByKey = Yg.prototype.C;
    So.prototype.getMap = So.prototype.f;
    So.prototype.setMap = So.prototype.setMap;
    So.prototype.setTarget = So.prototype.b;
    So.prototype.bindTo = So.prototype.O;
    So.prototype.get = So.prototype.get;
    So.prototype.getKeys = So.prototype.J;
    So.prototype.getProperties = So.prototype.L;
    So.prototype.set = So.prototype.set;
    So.prototype.setProperties = So.prototype.G;
    So.prototype.unbind = So.prototype.P;
    So.prototype.unbindAll = So.prototype.Q;
    So.prototype.changed = So.prototype.o;
    So.prototype.getRevision = So.prototype.A;
    So.prototype.on = So.prototype.u;
    So.prototype.once = So.prototype.B;
    So.prototype.un = So.prototype.v;
    So.prototype.unByKey = So.prototype.C;
    $g.prototype.getMap = $g.prototype.f;
    $g.prototype.setMap = $g.prototype.setMap;
    $g.prototype.setTarget = $g.prototype.b;
    $g.prototype.bindTo = $g.prototype.O;
    $g.prototype.get = $g.prototype.get;
    $g.prototype.getKeys = $g.prototype.J;
    $g.prototype.getProperties = $g.prototype.L;
    $g.prototype.set = $g.prototype.set;
    $g.prototype.setProperties = $g.prototype.G;
    $g.prototype.unbind = $g.prototype.P;
    $g.prototype.unbindAll = $g.prototype.Q;
    $g.prototype.changed = $g.prototype.o;
    $g.prototype.getRevision = $g.prototype.A;
    $g.prototype.on = $g.prototype.u;
    $g.prototype.once = $g.prototype.B;
    $g.prototype.un = $g.prototype.v;
    $g.prototype.unByKey = $g.prototype.C;
    gp.prototype.getMap = gp.prototype.f;
    gp.prototype.setTarget = gp.prototype.b;
    gp.prototype.bindTo = gp.prototype.O;
    gp.prototype.get = gp.prototype.get;
    gp.prototype.getKeys = gp.prototype.J;
    gp.prototype.getProperties = gp.prototype.L;
    gp.prototype.set = gp.prototype.set;
    gp.prototype.setProperties = gp.prototype.G;
    gp.prototype.unbind = gp.prototype.P;
    gp.prototype.unbindAll = gp.prototype.Q;
    gp.prototype.changed = gp.prototype.o;
    gp.prototype.getRevision = gp.prototype.A;
    gp.prototype.on = gp.prototype.u;
    gp.prototype.once = gp.prototype.B;
    gp.prototype.un = gp.prototype.v;
    gp.prototype.unByKey = gp.prototype.C;
    lp.prototype.getMap = lp.prototype.f;
    lp.prototype.setMap = lp.prototype.setMap;
    lp.prototype.setTarget = lp.prototype.b;
    lp.prototype.bindTo = lp.prototype.O;
    lp.prototype.get = lp.prototype.get;
    lp.prototype.getKeys = lp.prototype.J;
    lp.prototype.getProperties = lp.prototype.L;
    lp.prototype.set = lp.prototype.set;
    lp.prototype.setProperties = lp.prototype.G;
    lp.prototype.unbind = lp.prototype.P;
    lp.prototype.unbindAll = lp.prototype.Q;
    lp.prototype.changed = lp.prototype.o;
    lp.prototype.getRevision = lp.prototype.A;
    lp.prototype.on = lp.prototype.u;
    lp.prototype.once = lp.prototype.B;
    lp.prototype.un = lp.prototype.v;
    lp.prototype.unByKey = lp.prototype.C;
    return OPENLAYERS.ol;
}));

/**
* OpenLayers 3 Popup Overlay.
* See [the examples](./examples) for usage. Styling can be done via CSS.
* @constructor
* @extends {ol.Overlay}
* @param {Object} opt_options Overlay options, extends olx.OverlayOptions adding:
*                              **`panMapIfOutOfView`** `Boolean` - Should the
*                              map be panned so that the popup is entirely
*                              within view.
*/
ol.Overlay.Popup = function (opt_options) {

    var options = opt_options || {};

    this.panMapIfOutOfView = options.panMapIfOutOfView;
    if (this.panMapIfOutOfView === undefined) {
        this.panMapIfOutOfView = true;
    }

    this.ani = options.ani;
    if (this.ani === undefined) {
        this.ani = ol.animation.pan;
    }

    this.ani_opts = options.ani_opts;
    if (this.ani_opts === undefined) {
        this.ani_opts = {
            'duration': 250
        };
    }

    this.container = document.createElement('div');
    this.container.className = 'ol-popup';

    this.closer = document.createElement('a');
    this.closer.className = 'ol-popup-closer';
    this.closer.href = '#';
    this.container.appendChild(this.closer);

    var that = this;
    this.closer.addEventListener('click', function (evt) {
        that.container.style.display = 'none';
        that.closer.blur();
        evt.preventDefault();
    }, false);

    this.content = document.createElement('div');
    this.content.className = 'ol-popup-content';
    this.container.appendChild(this.content);

    ol.Overlay.call(this, {
        element: this.container,
        stopEvent: true
    });

}
    ;

ol.inherits(ol.Overlay.Popup, ol.Overlay);

/**
* Show the popup.
* @param {ol.Coordinate} coord Where to anchor the popup.
* @param {String} html String of HTML to display within the popup.
*/
ol.Overlay.Popup.prototype.show = function (coord, html) {
    this.setPosition(coord);
    this.content.innerHTML = html;
    this.container.style.display = 'block';
    if (this.panMapIfOutOfView) {
        this.panIntoView_(coord);
    }
    return this;
}
    ;

/**
* @private
*/
ol.Overlay.Popup.prototype.panIntoView_ = function (coord) {

    var popSize = {
        width: this.getElement().clientWidth + 20,
        height: this.getElement().clientHeight + 20
    }
        , mapSize = this.getMap().getSize();

    var tailHeight = 20
        , tailOffsetLeft = 60
        , tailOffsetRight = popSize.width - tailOffsetLeft
        , popOffset = this.getOffset()
        , popPx = this.getMap().getPixelFromCoordinate(coord);

    var fromLeft = (popPx[0] - tailOffsetLeft)
        , fromRight = mapSize[0] - (popPx[0] + tailOffsetRight);

    var fromTop = popPx[1] - popSize.height + popOffset[1]
        , fromBottom = mapSize[1] - (popPx[1] + tailHeight) - popOffset[1];

    var center = this.getMap().getView().getCenter()
        , px = this.getMap().getPixelFromCoordinate(center);

    if (fromRight < 0) {
        px[0] -= fromRight;
    } else if (fromLeft < 0) {
        px[0] += fromLeft;
    }

    if (fromTop < 0) {
        px[1] += fromTop;
    } else if (fromBottom < 0) {
        px[1] -= fromBottom;
    }

    if (this.ani && this.ani_opts) {
        this.ani_opts.source = center;
        this.getMap().beforeRender(this.ani(this.ani_opts));
    }
    this.getMap().getView().setCenter(this.getMap().getCoordinateFromPixel(px));

    return this.getMap().getView().getCenter();

}
    ;

/**
* Hide the popup.
*/
ol.Overlay.Popup.prototype.hide = function () {
    this.container.style.display = 'none';
    return this;
}
    ;

