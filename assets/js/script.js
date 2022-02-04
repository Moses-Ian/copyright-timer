//variables
//==================================
var id = "Q79015";	//superman->this will update with form update
var title = "superman";
// var title = "Katniss Everdeen";
var	idArr = [];
var apiUrlBase = `https://www.wikidata.org/w/api.php?action=wbgetentities&format=json&origin=*&languages=en&normalize=yes`
var idBase = '&ids=';
var titleBase = '&sites=enwiki&titles=';
var apiSearchUrlBase = `https://www.wikidata.org/w/api.php?action=wbsearchentities&format=json&origin=*&language=en`
var searchBase = `&search=`;
var dataResult = "";
var searchHistory = [];

// Google calendar variables
var CLIENT_ID = '191270176037-jnegufok0sdp2g71iqs83qipcavfaaem.apps.googleusercontent.com';
var API_KEY = 'AIzaSyAZgZvsAUrRFzruFrhG3k_jLPkKkByIxo8';
var DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"];
var SCOPES = "https://www.googleapis.com/auth/calendar";
var authorizeButton = document.getElementById('authorize_button');
var signoutButton = document.getElementById('signout_button');


claimDictionary = {
	"P50": " was authored by ",
	"P170": " was created by ",
	"P3931": " copyright held by "
};

var formEl = document.querySelector("form");
var formInputEl = document.querySelector("#form-input");
var searchResultsEl = document.querySelector("#search-results");
var dataEl = document.querySelector("#data");
var dataPEl = document.querySelector("#data-p");
var historyEl = document.querySelector("#search-history ul");



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
	dataResult = "";
	idArr = [];
	var item = data.entities[id];
	for(claimId in claimDictionary) {
		var claim = item.claims[claimId];
		if(claim)
			break;
	}
	
	console.log(`${item.labels.en.value} (${id})`);
	dataResult = dataResult.concat(item.labels.en.value);

	if(!claim) {
		console.log("data is incomplete :(");
		dataResult = "data is incomplete :(";
		dataPEl.textContent = dataResult;
		return;
	}
	
	console.log(claimDictionary[claimId]);
	dataResult = dataResult.concat(claimDictionary[claimId]);
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
		dataResult = dataResult.concat(item.labels.en.value);
		var claim = item.claims.P570;
		if(claim) {
			console.log("who died on");
			console.log(claim[0].mainsnak.datavalue.value.time);
			dataResult = dataResult.concat(` who died on ${claim[0].mainsnak.datavalue.value.time} `);
		}
		else {	//still alive, or data is incomplete
			console.log("who is still alive")
			dataResult = dataResult.concat(" who is still alive ");
		}
	}
	
	dataPEl.textContent = dataResult;
	searchResultsEl.style.display = "none";
	dataEl.style.display = "block";
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
	dataEl.style.display = "none";
	searchResultsEl.innerHTML = "";		//no INTERNAL event listeners, so this is ok

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
	
	searchResultsEl.style.display = "block";
		
}

function addToHistory(label) {
	for(i=0; i<searchHistory.length; i++) {
		if (searchHistory[i].id == id)
			return;
	}
	searchHistory.push({id, label});
	localStorage.setItem("history", JSON.stringify(searchHistory));
	addHistoryEl(id, label);
}

function loadHistory() {
	searchHistory = JSON.parse(localStorage.getItem("history")) || [];
	for(i=0; i<searchHistory.length; i++) {
		addHistoryEl(searchHistory[i].id, searchHistory[i].label);
	}
}

function addHistoryEl(id, label) {
	var historyItemEl = document.createElement("li");
	historyItemEl.dataset.itemId = id;
	historyItemEl.textContent = label;
	historyEl.appendChild(historyItemEl);
}


//listeners
//=====================================
formEl.addEventListener("submit", function() {
	event.preventDefault();
	var searchInput = formInputEl.value.trim() || formInputEl.placeholder;
	formInputEl.setAttribute("placeholder", searchInput);
	formEl.reset();
	console.log(searchInput);
	
	addEvent(searchInput);
	search(searchInput);


});

searchResultsEl.addEventListener("click", function(event) {
	var targetLiEl = event.target.closest("li");
	// console.log(targetLiEl.dataset.itemId);
	id = targetLiEl.dataset.itemId;
	fetchId(id);
	addToHistory(targetLiEl.querySelector("h3").textContent);
});

historyEl.addEventListener("click", function(event) {
	var targetLiEl = event.target.closest("li");
	id = targetLiEl.dataset.itemId;
	fetchId(id);
});

//body
//=====================================
// fetchId(id);
fetchTitle(title);
loadHistory();

function handleClientLoad() {
	gapi.load('client:auth2', initClient);
}

  /**
         *  Initializes the API client library and sets up sign-in state
         *  listeners.
         */
   function initClient() {
	gapi.client.init({
		apiKey: API_KEY,
		clientId: CLIENT_ID,
		discoveryDocs: DISCOVERY_DOCS,
		scope: SCOPES
	}).then(function () {
		// Listen for sign-in state changes.
		gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);

		// Handle the initial sign-in state.
		updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
		authorizeButton.onclick = handleAuthClick;
		signoutButton.onclick = handleSignoutClick;
	}, function (error) {
		appendPre(JSON.stringify(error, null, 2));
	});
}

/**
 *  Called when the signed in status changes, to update the UI
 *  appropriately. After a sign-in, the API is called.
 */
function updateSigninStatus(isSignedIn) {
	if (isSignedIn) {
		authorizeButton.style.display = 'none';
		signoutButton.style.display = 'block';
		addEvent();
	} else {
		authorizeButton.style.display = 'block';
		signoutButton.style.display = 'none';
	}
}

/**
 *  Sign in the user upon button click.
 */
function handleAuthClick(event) {
	gapi.auth2.getAuthInstance().signIn();
}

/**
 *  Sign out the user upon button click.
 */
function handleSignoutClick(event) {
	gapi.auth2.getAuthInstance().signOut();
}

/**
 * Append a pre element to the body containing the given message
 * as its text node. Used to display the results of the API call.
 *
 * @param {string} message Text to be placed in pre element.
 */
function appendPre(message) {
	var pre = document.getElementById('content');
	var textContent = document.createTextNode(message + '\n');
	pre.appendChild(textContent);
}

/**
 * Print the summary and start datetime/date of the next ten events in
 * the authorized user's calendar. If no events are found an
 * appropriate message is printed.
 */
function addEvent(searchInput) {
	var event = {
		'summary': searchInput + ' has been added to the public domain',
		'description': searchInput + ' has been added to the public domain! Rejoice!',
		'start': {
			// insert moment.js calculation here
			'date': '2116-01-28',
			'timeZone': 'America/Los_Angeles'
		},
		'end': {
			'date': '2116-01-28',
			'timeZone': 'America/Los_Angeles'
		},
	};

	var request = gapi.client.calendar.events.insert({
		'calendarId': 'primary',
		'resource': event
	});

	request.execute(function (event) {
		appendPre('Event created: ' + event.htmlLink);
	});
}




















