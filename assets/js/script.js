//variables
//==================================
var id = "Q79015";	//superman->this will update with form update
var title = '';
// var title = "Katniss Everdeen";
var idArr = [];
var claims;
var apiUrlBase = `https://www.wikidata.org/w/api.php?action=wbgetentities&format=json&origin=*&languages=en&normalize=yes`
var idBase = '&ids=';
var titleBase = '&sites=enwiki&titles=';
var apiSearchUrlBase = `https://www.wikidata.org/w/api.php?action=wbsearchentities&format=json&origin=*&language=en`
var searchBase = `&search=`;
var dataResult = "";
var searchHistory = [];
var searchTitle;
var expiredDateArr = [];
var workForHireExpiredDateArr = [];
var expiredDate;
var livingCopyrightHolderArr = [];

// Google calendar variables
var CLIENT_ID = '191270176037-jnegufok0sdp2g71iqs83qipcavfaaem.apps.googleusercontent.com';
var API_KEY = 'AIzaSyAZgZvsAUrRFzruFrhG3k_jLPkKkByIxo8';
var DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"];
var SCOPES = "https://www.googleapis.com/auth/calendar";
var authorizeButton = document.getElementById('authorize_button');
var signoutButton = document.getElementById('signout_button');
var calendarSection = document.getElementById('calendar');
var addDate = document.getElementById('add_date_button');
var openEvent = document.getElementById('open-event');


claimDictionary = {
	"P50": " was authored by ",
	"P123": " was published by ",
	"P170": " was created by ",
	"P178": " was developed by ",
	"P3931": " copyright held by "
};

dateDictionary = {
	"P571": " was incepted on ",
	"P577": " was published on ",
	"P1191": " was first performed on ",
	"P10135": " was recorded on "
}

var bannerEl = document.querySelector("#banner");
var formEl = document.querySelector("form");
var formInputEl = document.querySelector("#form-input");
var searchResultsEl = document.querySelector("#search-results");
var dataEl = document.querySelector("#data");
var dataUlEl = document.querySelector("#data-ul");
var expireDateEl = document.querySelector("#expire-date");
var workForHireEl = document.querySelector("#work-for-hire");
var historyEl = document.querySelector("#search-history ul");
var showHistoryEl = document.querySelector("#show-history");
var arrowEl = document.querySelector("#arrow");
var historyContainerEl = document.querySelector("#search-history");

var DateTime = luxon.DateTime;	//alias

const badDataBase = " is either not a copyrightable work or this data is incomplete. If you believe this to be in error and you would like to improve our site and Wikidata, you can <a href='mailto:imoses2@hotmail.com?subject=Copyright Timer' target='_blank'>email us</a> or <a href='https://www.wikidata.org/wiki/Wikidata:Tours' target='_blank'>improve Wikidata</a> yourself."


//functions
//====================================
//step 1: get superman data from wikidata
//step 1: get stellaris data from wikidata
function fetchTitle(title) {
	fetch(apiUrlBase + titleBase + title)
		.then(function (response) {
			if (!response.ok) {
				console.log("response bad");
				return false;
			}
			response.json()
				.then(function (data) {
					console.log(data);
					displayId(data);
					return true;
				});
		});
}

//alternative step 1: get Q79015 (superman) data from wikidata
//alternative step 1: get Q20829312 (stellaris) data from wikidata
function fetchId(id) {
	fetch(apiUrlBase + idBase + id)
		.then(function (response) {
			if (!response.ok) {
				console.log("response bad");
				return false;
			}
			response.json()
				.then(function (data) {
					console.log(data);
					displayId(data);
					return true;
				});
		});
}

//step 2: display "superman was created by" 
//step 2: display "stellaris was developed by ... and published by ..."
function displayId(data) {
	//setup
	title = data.entities[id].labels.en.value;
	statementArr = [];
	idArr = [];
	expiredDateArr = [];
	workForHireExpiredDateArr = [];
	livingCopyrightHolderArr = [];
	let publishedDate;
	
	//get published date
	let publishedClaims = Object.entries(data.entities[id].claims).filter(claim => claim[0] in dateDictionary);
	if (publishedClaims.length > 0) {
		publishedDate = publishedClaims.reduce((previousClaim, currentClaim) => {
			const currentTime = currentClaim[1][0].mainsnak.datavalue.value.time;
			const currentPrecision = currentClaim[1][0].mainsnak.datavalue.value.precision;
			const currentDate = makeDate(currentTime, currentPrecision);
			if(previousClaim === null)
				return [currentClaim[0], currentDate];

			const prevDate = previousClaim[1];
			
			return prevDate < currentDate ? previousClaim : [currentClaim[0], currentDate];
		}, null);
		
		workForHireExpiredDateArr.push(publishedDate[1].plus({ 'year': 90 }));
		statementArr.push(`${title}${dateDictionary[publishedDate[0]]}${publishedDate[1].toLocaleString()}`);
		idArr.push([]);
	}
	
	
	
	
	//filter claims
	claims = Object.entries(data.entities[id].claims).filter(claim => claim[0] in claimDictionary);	//filters the claims down to just the ones present in claimDictionary
	// console.log(claims);	//claims is what I like to call an array-dictionary

	//guard against empty claim array
 	if (statementArr.length === 0) {
		console.log("data is incomplete :(");
		expireDateEl.textContent =  "";
		workForHireEl.textContent = "";
		workForHireEl.style.display = "none";
		dataUlEl.innerHTML = title + badDataBase;
		searchResultsEl.style.display = "none";
		dataEl.style.display = "block";
		return;
	}
	
	claims.forEach(claim => {
		// build the statements
		statementArr.push(`${title}${claimDictionary[claim[0]]}`);	
		// get the values that will go into the statements
		idArr.push(claim[1].map(value => value.mainsnak.datavalue.value.id));	
	});
	
	//build the list of id's to search
	id = idArr.filter(e => e.length != 0).map(e => e.join('|')).join('|');

	if(publishedDate.length != 0)
		claims.unshift(publishedDate[0]);
	
	//goto step 3
	fetchCreators(id);
}

//step 3: get the people superman was created by
//step 3: get the people stellaris was developed and published by
function fetchCreators(id) {
	fetch(apiUrlBase + idBase + id)
		.then(function (response) {
			if (!response.ok) {
				console.log("response bad");
				return false;
			}
			response.json()
				.then(function (data) {
					console.log(data);
					//lol if this is just {success: 1}, it's because there was no creator information
					displayCreators(data);
					return true;
				});
		});
}

//step 4: display "Jerry Siegal who died on 28 Jan 1996, etc"
function displayCreators(data) {
	//setup
	
	//loop through all creators/publishers/devs
	for(let statement=0; statement<statementArr.length; statement++){
		if (idArr[statement].length == 0)
			statementArr[statement] += '.';
		for(let id=0; id<idArr[statement].length; id++) {
			console.log(statement, id, idArr[statement]);
			if (idArr[statement][id].length == 0) continue;
			let item = data.entities[idArr[statement][id]];
			//build out the statement
			if (id != 0)
				statementArr[statement] += ',';
			if (id == idArr[statement].length-1 && id != 0)
				statementArr[statement] += ' and';
			statementArr[statement] += ' ';
			statementArr[statement] += item.labels.en.value;
			//check if human
			if (item.claims.P31?.map(value => value.mainsnak.datavalue.value.id).includes('Q5')) {
				//yes -> check if dead
				let deathClaim = item.claims.P570;
				if (deathClaim) {
					//yes -> build out the statement
					let {time, precision} = deathClaim[0].mainsnak.datavalue.value;
					time = makeDate(time, precision);
					statementArr[statement] += ` (who died on ${time.toLocaleString()})`;
					//calculate when it'll expire
					expiredDateArr.push(time.plus({ 'year': 70 }));
				} else {
					//no -> build out the statement
					statementArr[statement] += " (who is still alive)";
					livingCopyrightHolderArr.push(item.labels.en.value);
				}
			}
			//check if published statement, and has a publication date qualifier
			if(claims[statement][0] == 'P123' && claims[statement][1][id].qualifiers) {
				//get the date from the qualifier
				let publisherClaim = claims[statement][1][id].qualifiers.P577;
				if (publisherClaim) {
					let {time, precision} = publisherClaim[0].datavalue.value;
					time = makeDate(time, precision);
					statementArr[statement] += ` on ${time.toLocaleString()}`;
					workForHireExpiredDateArr.push(publishedDate.plus({ 'year': 90 }));	//future-proofing
				}
			}
			//close out the statement
			if (id == idArr[statement].length-1)
				statementArr[statement] += '.';
		}
	}
	
	//put the statements into their html elements
	dataUlEl.innerHTML = "";	//no internal handlers -> this is ok
	statementArr.forEach(statement => {
		let liEl = document.createElement('li');
		liEl.textContent = statement;
		dataUlEl.appendChild(liEl);
	});
	
	//goto step 5
	displayExpiredDate();
}

//step 5: display "This copyright will expire on ..."
function displayExpiredDate() {
	expiredDate = null;
	let workForHireExpiredDate = null
	var displayText;
	let workForHireText;
	
	//if there are living copyright holders
	if (livingCopyrightHolderArr.length != 0) {
		displayText = `This copyright will expire 70 years after ${livingCopyrightHolderArr.join(", ")} die${livingCopyrightHolderArr.length > 1 ? "" : "s"}.`;
	} else if (expiredDateArr.length != 0) {
		//if there are only dead copyright holders
		//find the last date based on death
		expiredDate = expiredDateArr.reduce((prev, cur) => cur > prev ? cur : prev);
		displayText = `This copyright expires on <span class="expired-date">${expiredDate.toLocaleString()}</span>.`;
	}
	//add a disclaimer for works for hire
	if (workForHireExpiredDateArr.length != 0) {
		//find the earliest date based on publication
		workForHireExpiredDate = workForHireExpiredDateArr.reduce((prev, cur) => cur < prev ? cur : prev);
		workForHireText = `If this was a work for hire, it will expire on ${workForHireExpiredDate.toLocaleString()}.`;
	}
	

	//show the damn data finally
	expireDateEl.innerHTML = displayText;
	expireDateEl.style.display = displayText != undefined ? "block" : "none";
	workForHireEl.innerHTML = workForHireText;
	workForHireEl.style.display = workForHireText != null ? "block" : "none";
	searchResultsEl.style.left = '-100%';
	searchResultsEl.style.display = "none";
	dataEl.style.display = "block";
	addDate.style.display = "block";
	openEvent.style.display = "none";




}

//search
function search(searchTerm) {
	fetch(apiSearchUrlBase + searchBase + searchTerm)
		.then(function (response) {
			if (!response.ok) {
				console.log("response bad");
				return false;
			}
			response.json()
				.then(function (data) {
					console.log(data);
					displaySearchResults(data);
					return true;
				});
		});
}

function displaySearchResults(data) {
	dataEl.style.display = "none";
	searchResultsEl.innerHTML = "";		//no INTERNAL event listeners, so this is ok

	for (i = 0; i < data.search.length; i++) {
		var liEl = document.createElement("li");
		var h3El = document.createElement("h3");
		var pEl = document.createElement("p");

		liEl.dataset.itemId = data.search[i].id;
		h3El.textContent = data.search[i].label;
		pEl.textContent = data.search[i].description;
		// h3El.classList.add("label");
		

		liEl.appendChild(h3El);
		liEl.appendChild(pEl);

		searchResultsEl.appendChild(liEl);
	}
	slideSearchResults();
}

function slideSearchResults() {
	// searchResultsEl.style.height = "auto";
	searchResultsEl.style.transition = 'left 1s, opacity 3s';
	// searchResultsEl.style.opacity = "1";
	searchResultsEl.style.display = 'block';
	searchResultsEl.style.left = '0';
}

function hideSearchResults() {
	// searchResultsEl.style.height = "0";
	searchResultsEl.style.transition = 'left 0s, opacity 0s';
	// searchResultsEl.style.opacity = "0";
	searchResultsEl.style.display = "none";
	searchResultsEl.style.left = '-100%';
}

function addToHistory(label) {
	if (searchHistory.map(index => index.id).includes(id)) 
		return;
	searchHistory.push({ id, label });
	localStorage.setItem("history", JSON.stringify(searchHistory));
	addHistoryEl(id, label);
}

function loadHistory() {
	searchHistory = JSON.parse(localStorage.getItem("history")) || [];
	for (i = 0; i < searchHistory.length; i++)
		addHistoryEl(searchHistory[i].id, searchHistory[i].label);
}

function addHistoryEl(id, label) {
	var historyItemEl = document.createElement("li");
	historyItemEl.dataset.itemId = id;
	historyItemEl.textContent = label;
	historyEl.appendChild(historyItemEl);
}

function clearHistory() {
	localStorage.removeItem("history");
	historyEl.innerHTML = "";		// no internal event handlers, so this is ok
}

function peakHistory() {
	if (window.innerWidth > 1024)
		return;
	if (historyContainerEl.style.opacity == '0') {
		historyContainerEl.style.opacity = '1';
		historyContainerEl.style.flexGrow = '2';
		arrowEl.style.transform = "rotate(315deg)";
		arrowEl.style.marginLeft = "-10px";
		if (window.innerWidth > 640)
			return;
		historyContainerEl.style.height = 'auto';
	} else {
		historyContainerEl.style.opacity = '0';
		historyContainerEl.style.flexGrow = '1';
		arrowEl.style.transform = "rotate(135deg)";
		arrowEl.style.marginLeft = "10px";
		if (window.innerWidth > 640)
			return;
		historyContainerEl.style.height = '0';
	}
}

function makeDate(value, precision) {
	//since the values can be imprecise, making dates from wikidata has an extra layer of hassle
	let isoString = '';
	if (precision >= 6)
		isoString += value.substring(1,5);
	if (precision >= 10)
		isoString += value.substring(5,8);
	if (precision >= 11)
		isoString += value.substring(8, 11);
	return DateTime.fromISO(isoString);
}

//listeners
//=====================================
formEl.addEventListener("submit", function () {
	event.preventDefault();
	searchInput = formInputEl.value.trim() || formInputEl.placeholder;
	formInputEl.setAttribute("placeholder", searchInput);
	formEl.reset();
	console.log(searchInput);
	calendarSection.style.display = 'none';

	search(searchInput);


});

searchResultsEl.addEventListener("click", function (event) {
	var targetLiEl = event.target.closest("li");
	// console.log(targetLiEl.dataset.itemId);
	id = targetLiEl.dataset.itemId;
	fetchId(id);
	searchTitle = targetLiEl.querySelector("h3").textContent;
	addToHistory(targetLiEl.querySelector("h3").textContent);
});

showHistoryEl.addEventListener("click", peakHistory);

historyEl.addEventListener("click", function (event) {
	var targetLiEl = event.target.closest("li");
	id = targetLiEl.dataset.itemId;
	fetchId(id);
});

bannerEl.addEventListener("click", function (event) {
	target = event.target;
	if(target.tagName == 'H1')
		location.reload();
});



//body
//=====================================
// fetchId(id);
// fetchTitle(title);
loadHistory();


// Google Calendar API
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
		addDate.style.display = 'block';

	} else {
		authorizeButton.style.display = 'block';
		signoutButton.style.display = 'none';
		addDate.style.display = 'none';
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
addDate.addEventListener('click', function addEvent() {
	var event = {
		'summary': searchTitle + ' has been added to the public domain',
		'description': searchTitle + ' has been added to the public domain! Rejoice!',
		'start': {
			// insert moment.js calculation here
			'date': expiredDate.toFormat('yyyy-LL-dd'),
			'timeZone': 'America/Los_Angeles'
		},
		'end': {
			'date': expiredDate.toFormat('yyyy-LL-dd'),
			'timeZone': 'America/Los_Angeles'
		},
	};

	var request = gapi.client.calendar.events.insert({
		'calendarId': 'primary',
		'resource': event
	});

	request.execute(function (event) {
		
	openEvent.style.display = 'block';
	openEvent.setAttribute('onclick', "window.open('" + event.htmlLink + "','_blank')");
	openEvent.setAttribute('target', "_blank");
	// onclick=" window.open('http://google.com','_blank')"

	});
	signoutButton.style.display = 'none'
	addDate.style.display = 'none'

});


// Java plugins for dropdown menu

foundation.core.js
foundation.dropdown.js
foundation.util.keyboard.js
foundation.util.box.js
foundation.util.touch.js
foundation.util.triggers.js
Foundation.MediaQuery.current // => 'small', 'medium', etc.
Foundation.MediaQuery.is('medium') // => True for "medium" or larger
// ↑ True for "medium" or larger (by default)
Foundation.MediaQuery.is('medium up');
Foundation.MediaQuery.atLeast('medium');

// → True for "medium" only
Foundation.MediaQuery.is('medium only');
Foundation.MediaQuery.only('medium');

// ↓ True for "medium" or smaller
Foundation.MediaQuery.is('medium down');
Foundation.MediaQuery.upTo('medium');
