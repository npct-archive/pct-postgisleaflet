<?php
ini_set('display_errors', 1); 

//database login info
$user = 'ptc_user';
$password = 'nSsjA3D6e2IJWsxEiBF5';
$host = 'ptc-instance2.cehoy1ckliol.eu-west-1.rds.amazonaws.com';
$port = '5432';
$dbname = 'ptc_db';

$conn = pg_connect("host=$host port=$port dbname=$dbname user=$user password=$password");
if (!$conn) {
	echo "Not connected : " . pg_error();
	exit;
}

//get the table and fields data
$table = $_GET['table'];
$fields = $_GET['fields'];

//turn fields array into formatted string
$fieldstr = "";
foreach ($fields as $i => $field){
	$fieldstr = $fieldstr . "l.$field, ";
}

//get the geometry as geojson in WGS84
$fieldstr = $fieldstr . "ST_AsGeoJSON(ST_Transform(l.geom,4326))";

//create basic sql statement
$sql = "SELECT $fieldstr FROM $table l limit 1000";

//if a query, add those to the sql statement
if (isset($_GET['featname'])){
	$featname = $_GET['featname'];
	$distance = $_GET['distance'] * 1000; //change km to meters

	//join for spatial query - table geom is in EPSG:26916
	$sql = $sql . " LEFT JOIN $table r ON ST_DWithin(l.geom, r.geom, $distance) WHERE r.featname = '$featname';";
}

// echo $sql;

//send the query
if (!$response = pg_query($conn, $sql)) {
	echo "A query error occured.\n";
	exit;
}

//echo the data back to the DOM
while ($row = pg_fetch_row($response)) {
	foreach ($row as $i => $attr){
		echo $attr.", ";
	}
	echo ";";
}

?>