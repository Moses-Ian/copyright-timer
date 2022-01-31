//variables
//==================================
var apiUrl = "https://www.wikidata.org/w/api.php?format=json&action=wbgetentities&ids=Q79015&origin=*"






//functions
//====================================
function displayInfo(data) {
	console.log(data.entities.Q79015.labels.en.value)
}







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
		displayInfo(data);
		return true;
	});
});






















