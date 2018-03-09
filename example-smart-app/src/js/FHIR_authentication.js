function authenticate() {
	// Change this to the ID of the client that you registered with the SMART on FHIR authorization server.
	var clientId = "07edf94e-0685-42e0-a0ec-ce57c53d383d";

	// For demonstration purposes, if you registered a confidential client
	// you can enter its secret here. The demo app will pretend it's a confidential
	// app (in reality it cannot be confidential, since it cannot keep secrets in the
	// browser)
	var secret = null;    // set me, if confidential

	// These parameters will be received at launch time in the URL
	//var serviceUri = getUrlParameter("iss");
	//var launchContextId = getUrlParameter("launch");
		
	var serviceUri = "https://fhir-ehr.sandboxcerner.com/dstu2/0b8a0111-e8e6-4c26-a91c-5069cbc6b1ca";   //iss param
	console.log("serviceUri : " +serviceUri);

	// The scopes that the app will request from the authorization server
	// encoded in a space-separated string:
	//      1. permission to read all of the patient's record
	//      2. permission to launch the app in the specific context
	/*var scope = [
	"patient/*.read",
	"launch"
	].join(" ");*/
		
	 var scope = [
			"user/Patient.read",
			"Patient/Observation.read"
	].join(" ");
		
	// Generate a unique session key string (here we just generate a random number
	// for simplicity, but this is not 100% collision-proof)
	var state = Math.round(Math.random()*100000000).toString();

	var launchContextId = "xyz" + state;
	//alert("launchContextId : " +launchContextId);

	// To keep things flexible, let's construct the launch URL by taking the base of the 
	// current URL and replace "launch.html" with "index.html".
	var launchUri = window.location.protocol + "//" + window.location.host + window.location.pathname;
	var redirectUri = launchUri.replace("launch.html","");
		
	console.log("launchUri : " +launchUri);
	console.log("redirectUri : " +redirectUri);

	// FHIR Service Conformance Statement URL
	var conformanceUri = serviceUri + "/metadata"

	// Let's request the conformance statement from the SMART on FHIR API server and
	// find out the endpoint URLs for the authorization server
	$.get(conformanceUri, function(r){

		var authUri, tokenUri;
		
		var smartExtension = r.rest[0].security.extension.filter(function (e) {
		   return (e.url === "http://fhir-registry.smarthealthit.org/StructureDefinition/oauth-uris");
		});

		smartExtension[0].extension.forEach(function(arg, index, array){
			console.log("arg.url : " +arg.url);
		  if (arg.url === "authorize") {
			authUri = arg.valueUri;
		  } else if (arg.url === "token") {
			tokenUri = arg.valueUri;
		  }
		});
		
		console.log("authUri : " +authUri);
		
		// retain a couple parameters in the session for later use
		sessionStorage[state] = JSON.stringify({
			clientId: clientId,
			secret: secret,
			serviceUri: serviceUri,
			redirectUri: redirectUri,
			tokenUri: tokenUri
		});

		// finally, redirect the browser to the authorizatin server and pass the needed
		// parameters for the authorization request in the URL
		window.location.href = authUri + "?" +
			"response_type=code&" +
			"client_id=" + encodeURIComponent(clientId) + "&" +
			"scope=" + encodeURIComponent(scope) + "&" +
			"redirect_uri=" + encodeURIComponent(redirectUri) + "&" +
			"aud=" + encodeURIComponent(serviceUri) + "&" +
			//"launch=" + launchContextId + "&" +
			"state=" + state;
	 }, "json");
}

// Convenience function for parsing of URL parameters
// based on http://www.jquerybyexample.net/2012/06/get-url-parameters-using-jquery.html
function getUrlParameter(sParam)
{
	var sPageURL = window.location.search.substring(1);
	var sURLVariables = sPageURL.split('&');
	for (var i = 0; i < sURLVariables.length; i++) 
	{
		var sParameterName = sURLVariables[i].split('=');
		if (sParameterName[0] == sParam) {
			var res = sParameterName[1].replace(/\+/g, '%20');
			return decodeURIComponent(res);
		}
	}
}
