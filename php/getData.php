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

$w = $_GET['west'];
$s = $_GET['south'];
$e = $_GET['east'];
$n = $_GET['north'];

$sql_query = $_GET['query'];

//turn fields array into formatted string
$fieldstr = "";
foreach ($fields as $i => $field){
	$fieldstr = $fieldstr . "l.$field, ";
}

//get the geometry as geojson in WGS84
$fieldstr = $fieldstr;

//create basic sql statement
$sql = $sql_query;
//"SELECT $fieldstr FROM $table as l where l.geom && ST_MakeEnvelope(
//POLYGON($w, $s, $e, $n), 4326)";
echo $sql;

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