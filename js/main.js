/*	PostGIS and Leaflet demo for Cart Lab Education Series, April 17, 2015	**
**	By Carl Sack, CC-BY-3.0													*/

/*

# contains a function which connects to the database
# runs SQL query and disconnects
# this is to keep the SQL code a clean as possbile
# in the rest of the code. I also makes sure that the
# DB is not overloaded with unclosed connections

######################
# Connect to the DB
######################
conDB <- function(){
  #Connect to Database
  con <- dbConnect(dbDriver("PostgreSQL"), dbname = dbname, user = user, host = host, password = password)
}

#######################
#askDB - connect get info disconnect
#######################
askDB <- function (sql){
  # Connect to Database
  con <- dbConnect(dbDriver("PostgreSQL"), dbname = dbname, user = user, host = host, password = password)
  
  # Query the database
  result <- get_postgis_query(con, sql, geom_name = "geom", hstore_name = NA_character_)
  
  #disconnect from the database
  dbDisconnect(con)
  
  #Return the result
  return(result)
}
####################
#disDB - disconnect tfrom DB
#####################
disDB <- function (){
  
  #disconnect from the database
  dbDisconnect(con)
}

######################
#askDBzones
######################
# ask the DB for zones based on map bounds and zoom level
askDBzones <- function (mapbounds,mapzoom) {
  if(is.null(mapbounds)){
    # no map bounds so do defult query_zone
    query_zone <- "SELECT id, geom FROM msoa84 WHERE geom && ST_MakeEnvelope(-0.11, 51.45, -0.09, 51.5, 4326)"
    answer_zone <- askDB(query_zone)
  } 
  else if(mapzoom >= 11 & mapzoom <= 13){
    # Zomed out so show MSOA
    query_zone <- paste0("SELECT id, geom FROM msoa84 WHERE geom && ST_MakeEnvelope(",mapbounds$west,",",mapbounds$south,",",mapbounds$east,",",mapbounds$north,",4326)")
    answer_zone <- askDB(query_zone)
  }
  else if(mapzoom >= 14 & mapzoom <= 16){
    # Zomed in so show LSOA
    query_zone <- paste0("SELECT id, geom FROM lsoa WHERE geom && ST_MakeEnvelope(",mapbounds$west,",",mapbounds$south,",",mapbounds$east,",",mapbounds$north,",4326)")
    answer_zone <- askDB(query_zone)
    
  }
  else if(mapzoom >= 17){
    #  Zomed really in so show OA
    query_zone <- paste0("SELECT id, geom FROM oa WHERE geom && ST_MakeEnvelope(",mapbounds$west,",",mapbounds$south,",",mapbounds$east,",",mapbounds$north,",4326)")
    answer_zone <- askDB(query_zone)
  }
  else {
    # really zoomed out so render regions
    # no map bounds so do defult query_zone
    query_zone <- paste0("SELECT id, geom FROM regions WHERE geom && ST_MakeEnvelope(",mapbounds$west,",",mapbounds$south,",",mapbounds$east,",",mapbounds$north,",4326)")
    answer_zone <- askDB(query_zone)
  }
  #Return Results
  return(answer_zone)
}
*/

//global variables
var map,
	fields = ["id", "geom"], 
	autocomplete = [];
	
var table_name = "lsoa_centroid";

$(document).ready(initialize);

function initialize(){
	$("#map").height($(window).height());

	map = L.map("map", {
		center: L.latLng(51.5, -0.1),
		zoom: 7
	});

	var tileLayer =  L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

	//next: add features to map
	getData();
};

function getData(){
	$.ajax("php/getData.php", {
		data: {
			table: table_name,
			fields: fields
		},
		success: function(data){
			mapData(data);
		}
	})
};


map.on('zoomend', function (e) {
    zoom_based_update_data();
});

function zoom_based_update_data() {
    //console.log(map.getZoom());
    $("#zoomlevel").html(map.getZoom());
    var currentZoom = map.getZoom();
        switch (currentZoom) {
    	default:
            // Show Regions
                        break;
        case 0:
        case 1:
        case 2:
        case 3:
        case 4:
        case 5:
        case 6:
        case 7:
        case 8:
        case 9:
        case 10:
/*            table = regions;
					  fields = fields;
            break;      */
        case 11:
        case 12:
        case 13:
            table_name = "msoa_centroid";
					  fields = fields;
            break;      
        case 14:
        case 15:
        case 16:
            table_name = "lsoa_centroid";
					  fields = fields;
            break;      
        case 17:
        case 18:
        case 19:
            table_name = "oa_centroid";
					  fields = fields;
            break;
        }
        getData();
}


function mapData(data){
	//remove existing map layers
	map.eachLayer(function(layer){
		//if not the tile layer
		if (typeof layer._url === "undefined"){
			map.removeLayer(layer);
		}
	});

	//create geojson container object
	var geojson = {
		"type": "FeatureCollection",
		"features": []
	};

	//split data into features
	var dataArray = data.split(", ;");
	dataArray.pop();
    
    //console.log(dataArray);
	
	//build geojson features
	dataArray.forEach(function(d){
		d = d.split(", "); //split the data up into individual attribute values and the geometry

		//feature object container
		var feature = {
			"type": "Feature",
			"properties": {}, //properties object container
			"geometry": JSON.parse(d[fields.length]) //parse geometry
		};

		for (var i=0; i<fields.length; i++){
			feature.properties[fields[i]] = d[i];
		};

		//add feature names to autocomplete list
		if ($.inArray(feature.properties.featname, autocomplete) == -1){
			autocomplete.push(feature.properties.featname);
		};

		geojson.features.push(feature);
	});
	
    //console.log(geojson);
    
    //activate autocomplete on featname input
    $("input[name=featname]").autocomplete({
        source: autocomplete
    });

	var mapDataLayer = L.geoJson(geojson, {
		pointToLayer: function (feature, latlng) {
			var markerStyle = { 
				fillColor: "#CC9900",
				color: "#FFF",
				fillOpacity: 0.5,
				opacity: 0.8,
				weight: 1,
				radius: 8
			};

			return L.circleMarker(latlng, markerStyle);
		},
		onEachFeature: function (feature, layer) {
			var html = "";
			for (prop in feature.properties){
				html += prop+": "+feature.properties[prop]+"<br>";
			};
	        layer.bindPopup(html);
	    }
	}).addTo(map);
};

function submitQuery(){
	//get the form data
	var formdata = $("form").serializeArray();

	//add to data request object
	var data = {
		table: table_name,
		fields: fields
	};
	formdata.forEach(function(dataobj){
		data[dataobj.name] = dataobj.value;
	});

	//call the php script
	$.ajax("php/getData.php", {
		data: data,
		success: function(data){
			mapData(data);
		}
	})
};

