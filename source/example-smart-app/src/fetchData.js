function fetchData() {
	$('#response').hide();

	var searchBy = getUrlParameter("searchBy");
	var value = '';

	if (searchBy == 'name') {
		var value = getUrlParameter("value");
	}
	
	var result = "";

	if (searchBy == 'name' && value != '') {
	
		var patientQueryURI = "https://fhir-open.sandboxcerner.com/dstu2/0b8a0111-e8e6-4c26-a91c-5069cbc6b1ca/Patient?name=" + value + "&_format=json";
		
		$.get(patientQueryURI, function(res){
			console.log("res : " +res);
			
			if (res.entry) {
				result += "<p>Search result for Patient Name : <strong>" + value + "</strong></p>";
				result += "<table border=\"1\" style=\"border-spacing: 1px;\">";
				result += "<tr>";
				result += "<th>Patient Id</th>";
				result += "<th>Name</th>";
				result += "<th>Gender</th>";
				result += "<th>Birth Date</th>";
				result += "<th>Address</th>";
				result += "</tr>";
		
		
				var data = res.entry;
				for (var i = 0; i < data.length; i++)
				{
					if (data[i].resource.resourceType == 'Patient') {
						result += "<tr>";
						result += "<td>" + data[i].resource.id + "</td>";
						result += "<td>" + data[i].resource.name[0].text + "</td>";
						result += "<td>" + ((data[i].resource.gender) ? data[i].resource.gender : "-") + "</td>";
						result += "<td>" + ((data[i].resource.birthDate) ? data[i].resource.birthDate : "-") + "</td>";
						result += "<td>" + ((data[i].resource.address) ? data[i].resource.address[0].text : "-") + "</td>";
						result += "</tr>";
					}
				}
				result += "</table>";
			} else {
				result = "<p>No more result for Patient Name : <strong>" + value + "</strong></p>";
			}
			
			
			$('#loading').hide();
			$('#response').html(result);
			$('#response').show();
		});
		
		
	} else {
		console.log("Invalid request param!");
		result = "<p>Invalid request</p>";
		
		$('#loading').hide();
		$('#response').html(result);
		$('#response').show();
	}
}

function getUrlParameter(sParam) {
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