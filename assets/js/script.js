//variables
//==================================
var apiUrl = "https://www.wikidata.org/w/api.php?format=json&action=wbgetentities&ids=Q79015"






//functions
//====================================








//listeners
//=====================================











//body
//=====================================
fetch(apiUrl)
.then(function(response) {
	if(!response.ok) {
		console.log("response bad");
		return false;
	}
	response.json()
	.then(function(data) {
		console.log(data);
		return true;
	});
});






















