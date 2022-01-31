//variables
//==================================
var id = "Q79015";	//superman->this will update with form update
var	idArr = [];
var apiUrlBase = `https://www.wikidata.org/w/api.php?action=wbgetentities&format=json&origin=*&languages=en&ids=`






//functions
//====================================
//step 1: get superman data from wikidata
function fetchId(id) {
	fetch(apiUrlBase+id)
	.then(function(response) {
		if(!response.ok) {
			console.log("response bad");
			return false;
		}
		response.json()
		.then(function(data) {
			console.log(data);
			displayId(data);
			return true;
		});
	});
}

//step 2: display "superman was created by" 
function displayId(data) {
	var item = data.entities[id];
	var claim = item.claims.P170;
	console.log(item.labels.en.value);
	console.log("was created by");
	for(i=0; i<claim.length; i++) {
		// console.log(claim[i].mainsnak.datavalue.value.id);
		idArr.push(claim[i].mainsnak.datavalue.value.id);
	}
	id = idArr.join("%7C");
	fetchCreators(id);
}

//step 3: get the people superman was created by
function fetchCreators(id){
	fetch(apiUrlBase+id)
	.then(function(response) {
		if(!response.ok) {
			console.log("response bad");
			return false;
		}
		response.json()
		.then(function(data) {
			console.log(data);
			displayCreators(data);
			return true;
		});
	});
}

//step 4: display "Jerry Siegal who died on 28 Jan 1996, etc"
function displayCreators(data) {
	for(i=0; i<idArr.length; i++) {
		var item = data.entities[idArr[i]];
		console.log(item.labels.en.value);
		console.log("who died on");
		var claim = item.claims.P570;
		console.log(claim[0].mainsnak.datavalue.value.time);
	}
}





//listeners
//=====================================











//body
//=====================================
fetchId(id);






















