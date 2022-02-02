//variables
//==================================
var id = "Q79015";	//superman->this will update with form update
var title = "superman";
// var title = "Katniss Everdeen";
var	idArr = [];
var apiUrlBase = `https://www.wikidata.org/w/api.php?action=wbgetentities&format=json&origin=*&languages=en&normalize=yes`
var idBase = '&ids=';
var titleBase = '&sites=enwiki&titles=';
var apiSearchUrlBase = `https://www.wikidata.org/w/api.php?action=wbsearchentities&format=json&origin=*&language=en&sort=desc(relevance)`
var searchBase = `&search=`;

claimDictionary = {
	"P50": "was authored by",
	"P170": "was created by",
	"P3931": "copyright held by"
};

var formEl = document.querySelector("form");
var formInputEl = document.querySelector("#form-input");
var searchResultsEl = document.querySelector("#search-results");



//functions
//====================================
//step 1: get superman data from wikidata
function fetchTitle(title) {
	fetch(apiUrlBase+titleBase+title)
	.then(function(response) {
		if(!response.ok) {
			console.log("response bad");
			return false;
		}
		response.json()
		.then(function(data) {
			console.log(data);
			for (id in data.entities) {
				// console.log(id);
				displayId(data);
			}
			
			return true;
		});
	});
}

//alternative step 1: get Q79015 (superman) data from wikidata
function fetchId(id) {
	fetch(apiUrlBase+idBase+id)
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
	idArr = [];
	var item = data.entities[id];
	for(claimId in claimDictionary) {
		var claim = item.claims[claimId];
		if(claim)
			break;
	}
	
	console.log(`${item.labels.en.value} (${id})`);

	if(!claim) {
		console.log("data is incomplete :(");
		return;
	}
	
	console.log(claimDictionary[claimId]);
	for(i=0; i<claim.length; i++) {
		// console.log(claim[i].mainsnak.datavalue.value.id);
		idArr.push(claim[i].mainsnak.datavalue.value.id);
	}
	id = idArr.join("|");
	fetchCreators(id);
}

//step 3: get the people superman was created by
function fetchCreators(id){
	fetch(apiUrlBase+idBase+id)
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
		var claim = item.claims.P570;
		if(claim) {
			console.log("who died on");
			console.log(claim[0].mainsnak.datavalue.value.time);
		}
		else {	//still alive, or data is incomplete
			console.log("who is still alive")
		}
	}
}

//search
function search(searchInput) {
	fetch(apiSearchUrlBase+searchBase+searchInput)
	.then(function(response) {
		if(!response.ok) {
			console.log("response bad");
			return false;
		}
		response.json()
		.then(function(data) {
			console.log(data);
			displaySearchResults(data);
			return true;
		});
	});
}

function displaySearchResults(data) {
	for(i=0; i<data.search.length; i++) {
		var liEl = document.createElement("li");
		var h3El = document.createElement("h3");
		var pEl = document.createElement("p");
		
		liEl.dataset.itemId = data.search[i].id;
		h3El.textContent = data.search[i].label;
		pEl.textContent = data.search[i].description;
		
		liEl.appendChild(h3El);
		liEl.appendChild(pEl);
		
		searchResultsEl.appendChild(liEl);
	}
		
}



//listeners
//=====================================
formEl.addEventListener("submit", function() {
	event.preventDefault();
	var searchInput = formInputEl.value.trim() || formInputEl.placeholder;
	formInputEl.setAttribute("placeholder", searchInput);
	formEl.reset();
	console.log(searchInput);
	
	search(searchInput);
});










//body
//=====================================
// fetchId(id);
fetchTitle(title);






















