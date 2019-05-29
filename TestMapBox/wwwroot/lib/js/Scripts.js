﻿mapboxgl.accessToken = 'pk.eyJ1IjoicmFtaWx5dXN1cG92IiwiYSI6ImNqdDF3MW91NjBpYjA0NG45cHNvY3owYXoifQ.UtwZSf1OiGMqzFN2KK1bNA';
var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v11',
    zoom: 1
});
var geocoder = new MapboxGeocoder({
    accessToken: mapboxgl.accessToken,
});
var distancies = [];
var durations = [];
var coordsbetweencoords = {};
var markerCount = 0;
var clientsCount = 0;
var vhlCounter = 0;
var dmdCounter = 0;
var tripDirections = {};
var saveDirections = [];
var vehiclesCapacity = [];
var nav = new mapboxgl.NavigationControl();
var markerCoords = {};
var colorArray = [
    '#FF6633', '#FFB399', '#FF33FF', '#FFFF99', '#00B3E6',
    '#E6B333', '#3366E6', '#999966', '#99FF99', '#B34D4D',
    '#80B300', '#809900', '#E6B3B3', '#6680B3', '#66991A',
    '#FF99E6', '#CCFF1A', '#FF1A66', '#E6331A', '#33FFCC',
    '#66994D', '#B366CC', '#4D8000', '#B33300', '#CC80CC',
    '#66664D', '#991AFF', '#E666FF', '#4DB3FF', '#1AB399',
    '#E666B3', '#33991A', '#CC9999', '#B3B31A', '#00E680',
    '#4D8066', '#809980', '#E6FF80', '#1AFF33', '#999933',
    '#FF3380', '#CCCC00', '#66E64D', '#4D80CC', '#9900B3',
    '#E64D66', '#4DB380', '#FF4D4D', '#99E6E6', '#6666FF'
];
var coordinates = [];
var connection = new signalR.HubConnectionBuilder().withUrl("/chatHub").build();
var marker = [];
var requireCount = 0;
var markerMonicker = [];
var coordMarkers = [];
var layerNames = [];
document.getElementById("sendButton").disabled = true;

document.getElementById("sendButton").addEventListener("click",
    function (event) {
        $("#state-legend").empty();
        if (clientsCount == 0 || vehiclesCapacity.length == 0) {
            alert("Добавьте клиентов и транспортные средства");
            return;
        } else if (clientsCount < Math.pow(Object.keys(markerCoords).length - 1, 2)) {
            alert("Ещё не все клиенты добавлены");
            return;
        }
        //var vehicle = document.getElementById("vehicleCount").value;
        var vehicle = JSON.stringify(vehiclesCapacity);
        var maxDemand = document.getElementById("maxDemand").value;
        var jsonSend = JSON.stringify(markerCoords).toString();
        var distanceSend = distancies.toString();
        //var durationsSend = JSON.stringify(durations);
        connection.invoke("SendMessage", vehicle, maxDemand, jsonSend, distanceSend).catch(
            function (err) {
                return console.error(err.toString());
            });
        event.preventDefault();
    });

// пока без экселя, потом допилю
//document.getElementById("fileInput").addEventListener('change', () => {
//    this.parseExcel = function(file) {
//        var reader = new FileReader();

//        reader.onload = function(e) {
//            data = e.target.result();
//            var workbook = XLSX.read(data, {
//                type: 'binary'
//            });

//            workbook.SheetNames.forEach(function(sheetName) {
//                // Here is your object
//                var XL_row_object = XLSX.utils.sheet_to_row_object_array(workbook.Sheets[sheetName]);
//                var json_object = JSON.stringify(XL_row_object);
//                console.log(json_object);

//            });

//        };

//        reader.onerror = function(ex) {
//            console.log(ex);
//        };

//        reader.readAsBinaryString(file);
//    };
//});

async function getMatchAll() {
    clientsCount = 0;
    for (var i = 0; i < Object.keys(markerCoords).length; i++) {
        for (var j = 0; j < Object.keys(markerCoords).length; j++) {
            var v = i * Object.keys(markerCoords).length + j;
            //if (v > 300) setTimeout(getMatch(i, j, v), 12000);
            //else if (v > 100) setTimeout(getMatch(i, j, v), 6000);
            //else getMatch(i, j, v);
            requireCount++;
            if (requireCount >= 299) {
                await sleep(60000);
                requireCount = 1;
            }
            getMatch(i, j, v);
        }
    }
}

function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

//$('#clientModal').on('show.bs.modal',
//    function (e) {
//	    for (var i = 0; i < clientsCount; i++) {
//		    $("#demandModals").append('<div class="modal-body" id="demandPlace"></div>');
//		    dmdCounter++;
//		    $("#demandPlace").append('<label style="font-weight: bold;" class="one" id="label' +
//			    dmdCounter +
//			    '" ' +
//			    '>' +
//			    dmdCounter +
//			    '. Спрос клиента: </label>' +
//			    '<input type="file" id="fileInput' +
//			    dmdCounter +
//			    '" />');
//	    }
//    });

function genRandomDemand() {
    $("#demandModals").append('<div class="modal-body" id="demandPlace"></div>');
    $("#demandPlace").append('<label style="font-weight: bold;" class="one" id="labelDemand">'
	    +
    'Максимальное спрос клиентов: </label>' +
    '<input type="number" class="inputClass one" min="0" id="maxDemand" />');
}

function AddVehicle() {
    $("#modals").append('<div class="modal-body" id="vehiclePlace"></div>');
    vhlCounter++;
    $("#vehiclePlace").append('<label style="font-weight: bold;" class="one" id="label' +
        vhlCounter +
        '" ' +
        '>' +
        vhlCounter +
        '. Вместимость грузовика: </label><input type="number" min="0" class="inputClass one" id="maxVehicle' +
        vhlCounter +
        '">' +
        '<button ' +
        'id="' +
        vhlCounter +
        '" ' +
        ' type="button" onclick="DeleteVehicle();" ' +
        'class="btn btn-secondary three">Удалить</button><br/><br/>');
}

function DeleteVehicle() {
    var idVehicle = event.currentTarget.id.toString();
    document.getElementById("label" + idVehicle).remove();
    document.getElementById("maxVehicle" + idVehicle).remove();
    event.currentTarget.remove();
}

function ClearVehicles() {
    $("div#vehiclePlace").remove();
    vhlCounter = 0;
    vehiclesCapacity.length = 0;
}

function SaveVehicles() {
    for (var i = 0; i < vhlCounter; i++) {
        vehiclesCapacity[i] = document.getElementById("maxVehicle" + (i + 1).toString()).value;
    }
}

function getMatch(e, q, v) {
    var url = 'https://api.mapbox.com/directions/v5/mapbox/driving/' +
        markerCoords[e].lng +
        ',' +
        markerCoords[e].lat +
        ';' +
        markerCoords[q].lng +
        ',' +
        markerCoords[q].lat +
        '?geometries=geojson&steps=true&access_token=' +
        mapboxgl.accessToken;
    //console.log(url);
    var req = new XMLHttpRequest();
    req.responseType = 'json';
    req.open('GET', url, true);
    req.onload = function () {
        var jsonResponse = req.response;
        var distance = jsonResponse.routes[0].distance * 0.001;
        //var duration = jsonResponse.routes[0].duration / 60;
        var coords = jsonResponse.routes[0].geometry;
        //console.log(steps);
        //console.log(coords);
        //console.log(distance);
        //console.log(duration);
        distancies[v] = distance;
        //durations[v] = duration;
        coordsbetweencoords[markerCoords[e].lng.toString() + markerCoords[q].lng.toString()] = coords;
        tripDirections[markerCoords[e].lng.toString() + markerCoords[q].lng.toString()] =
            getInstructions(jsonResponse.routes[0], q);
        clientsCount++;
        if (clientsCount === Math.pow(Object.keys(markerCoords).length - 1, 2)) alert("Клиенты добавлены");
    };
    req.send();
}

connection.start().then(function () {
    document.getElementById("sendButton").disabled = false;
}).catch(function (err) {
    return console.error(err.toString());
});

function clearLayers() {
    for (var i = 0; i < layerNames.length; i++) {
        try {
            map.removeLayer(i.toString());
            map.removeSource(i.toString());
        } catch (err) {
        }
    }

}

function getInstructions(data, q) {
    var directions = [];
    var legs = data.legs;
    var stepCount = 0;
    for (var i = 0; i < legs.length; i++) {
        var steps = legs[i].steps;
        for (var j = 0; j < steps.length; j++) {
            directions.push("Step " + (stepCount + 1).toString() + ":" + steps[j].maneuver.instruction + "\n");
            stepCount++;
        }
        directions.push("Вы добрались до (" +
            markerCoords[q].lng.toString() +
            ";" +
            markerCoords[q].lat.toString() +
            ") точки.\n");
    }
    return directions;
}

function clearAllLayers() {
    clearLayers();
    coordMarkers.forEach((m) => m.remove());
    coordMarkers = [];
    markerCoords = {};
    distancies = [];
    coordsbetweencoords = {};
    markerCount = 0;
    layerNames = [];
    document.getElementById("Cost").textContent = "";
    ClearVehicles();
    $("div#state-legend").empty();
    $("dib#state-legend").css('visibility', 'hidden');
    if (markerMonicker.length > 0) {
     markerMonicker.forEach((m) => m.remove());
     markerMonicker = [];
    }
}

function saveInstructions() {
    saveDirections = [coordinates.length];
    for (var i = 0; i < coordinates.length; i++) {
        saveDirections[i] =
            "\n\n------------------------------------------------------------------------------------------------------" +
            "------------------------------------------------------------------------------------------------------" +
            "------------------------------------------------------------------------------------------------------\n\n";
        saveDirections[i] += "Vehicle " + (i + 1).toString() + ":\n";
        for (var k = 0; k < coordinates[i].length - 2; k += 2) {
            saveDirections[i] += tripDirections[coordinates[i][k].toString() + coordinates[i][k + 2].toString()];
        }
    }

    var a = document.createElement("a");
    var file = new Blob([saveDirections], { type: "application/doc" });
    a.href = URL.createObjectURL(file);
    a.download = "instructions.doc";
    a.click();
}

connection.on("ReceiveMessage",
    function (jsonResult, cost) {
        if (jsonResult === 0) {
            alert("Введите больше транспортных средств либо увеличьте вместимость имеющихся");
            return;
        }
        clearLayers();
        layerNames = [coordinates.length];
        coordinates = JSON.parse(jsonResult);
        for (var i = 0; i < coordinates.length; i++) {
            var buf = new Array();
            var resultCoordCount = 0;
            var routeOrder = 0;
            for (var k = 0; k < coordinates[i].length - 2; k += 2) {
                buf[resultCoordCount] = [coordinates[i][k], coordinates[i][k + 1]];
                routeOrder++;
                var idMarker = coordinates[i][k];
                var searchCoincidence = document.getElementById(idMarker.toString()).innerText.search(":");
                if (searchCoincidence !== -1)
                    document.getElementById(idMarker.toString()).innerText =
	                    document.getElementById(idMarker.toString()).innerText.substring(0,
		                document.getElementById(idMarker.toString()).innerText.match(":").index);
                document.getElementById(idMarker.toString()).innerText += ": " + routeOrder;
                //var el = document.createElement('div');
                //el.className = 'marker';
                //el.innerHTML = '<span style="font-size: 250%; background: inherit;"><b>' + routeOrder + '</b></span>';
                //el.fontSize = "large";
                //markerMonicker[coordinates[i][k].toString()] += ": " + routeOrder;
                //marker.push(
                //    new mapboxgl.Marker(el).setLngLat([coordinates[i][k], coordinates[i][k + 1]]).addTo(map));
                resultCoordCount++;
                var coordCount =
                    coordsbetweencoords[coordinates[i][k].toString() + coordinates[i][k + 2].toString()].coordinates
                        .length;
                for (var z = 0; z < coordCount; z++) {
                    buf[resultCoordCount] =
                        coordsbetweencoords[coordinates[i][k].toString() + coordinates[i][k + 2].toString()]
                            .coordinates[z];
                    resultCoordCount += 1;
                }
            }
            layerNames[i] = i;
            map.addLayer({
                "id": layerNames[i].toString(),
                "type": "line",
                "source": {
                    "type": "geojson",
                    "data": {
                        "type": "Feature",
                        "properties": {},
                        "geometry": {
                            "type": "LineString",
                            "coordinates": buf
                        }
                    }
                },
                "layout": {
                    "line-join": "round",
                    "line-cap": "round"
                },
                "paint": {
                    "line-color": colorArray[i],
                    "line-width": 8
                }
            });
            $("#state-legend").css('visibility', 'visible');
            $("#state-legend").append("<div id='legend" + i + 1 + "'><span style='background-color: " +
                colorArray[i] +
                "'></span>Vehicle " +
                (i + 1).toString() +
                "</div>");
            //console.log(buf);
        }
        document.getElementById("Cost").textContent = "Стоимость маршрута: " + cost + "км";
        document.getElementById("Cost").style.backgroundColor = "#5181b8";
        document.getElementById("Cost").style.color = "white";
    });

var placesAutocomplete = places({
    container: document.querySelector('#address-input'),
    type: 'city'
});
placesAutocomplete.on('change',
    e => {
        map.flyTo({
            center: [e.suggestion.latlng.lng, e.suggestion.latlng.lat],
            zoom: 9
        });
    });

map.addControl(nav, 'bottom-right');

map.on('load',
    () => {
        map.on('click',
            function (e) {
                clientsCount = 0;
                var markerDraw;
                var markerName = document.createElement('div');
                markerName.className = 'marker';
                if (markerCount === 0) {
                    markerDraw = new window.mapboxgl.Marker({ color: 'red' }).setLngLat(e.lngLat).addTo(map);
                    markerName.innerHTML = '<span id="' + e.lngLat.lng + '" style=" font-size: 130%; background: inherit;"><b>Депо</b></span>';
                } else {
                    markerDraw = new window.mapboxgl.Marker().setLngLat(e.lngLat).addTo(map);
                    markerName.innerHTML = '<span id="' + e.lngLat.lng + '" style="font-size: 130%; background: inherit;"><b>v'+ markerCount + '</b></span>';
                }
                markerName.fontSize = "large";
                coordMarkers.push(markerDraw);
                markerCoords[markerCount] = e.lngLat;
				markerMonicker.push( 
				new mapboxgl.Marker(markerName).setLngLat(e.lngLat).addTo(map));
                markerCount++;
            });
    });
//var el = document.createElement('div');
//                el.className = 'marker';
//el.innerHTML = '<span style="font-size: 250%; background: inherit;"><b>' + routeOrder + '</b></span>';
//el.fontSize = "large";
//marker.push(
//	new mapboxgl.Marker(el).setLngLat([coordinates[i][k], coordinates[i][k + 1]]).addTo(map));
