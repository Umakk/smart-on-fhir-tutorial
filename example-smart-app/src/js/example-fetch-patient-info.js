$('#response').hide();


// get the URL parameters received from the authorization server
var state = getUrlParameter("state");  // session key
var code = getUrlParameter("code");    // authorization code

// load the app parameters stored in the session
var params = JSON.parse(sessionStorage[state]);  // load app session
var tokenUri = params.tokenUri;
var clientId = params.clientId;
var secret = params.secret;
var serviceUri = params.serviceUri;
var redirectUri = params.redirectUri;

// Prep the token exchange call parameters
var data = {
    code: code,
    grant_type: 'authorization_code',
    redirect_uri: redirectUri
};
var options;
if (!secret) {
    data['client_id'] = clientId;
}
options = {
    url: tokenUri,
    type: 'POST',
    data: data
};
if (secret) {
    options['headers'] = {'Authorization': 'Basic ' + btoa(clientId + ':' + secret)};
}

// obtain authorization token from the authorization service using the authorization code
$.ajax(options).done(function(res){
    // should get back the access token and the patient ID
    var accessToken = res.access_token;
    var patientId = res.patient;
    //var patientId = "1316024";

    alert("patientId : " +patientId);

    // and now we can use these to construct standard FHIR
    // REST calls to obtain patient resources with the
    // SMART on FHIR-specific authorization header...
    // Let's, for example, grab the patient resource and
    // print the patient name on the screen
    var url = serviceUri + "/Patient/" + patientId;
    alert("url : " +url);
    $.ajax({
        url: url,
        type: "GET",
        dataType: "json",
        headers: {
            "Authorization": "Bearer " + accessToken
        },
    }).done(function(pt){
        var name = pt.name[0].given.join(" ") +" "+ pt.name[0].family.join(" ");
        alert("patient : " +pt);
        //document.body.innerHTML += "<h3>Patient: " + name + "</h3>";
        drawVisualization(pt);
    });
});

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

function onError() {
      console.log('Loading error');
    }

function onReady(smart)  {
      if (smart.hasOwnProperty('patient')) {
        var patient = smart.patient;
        var pt = patient.read();
        var obv = smart.patient.api.fetchAll({
                    type: 'Observation',
                    query: {
                      code: {
                        $or: ['http://loinc.org|8302-2', 'http://loinc.org|8462-4',
                              'http://loinc.org|8480-6', 'http://loinc.org|2085-9',
                              'http://loinc.org|2089-1', 'http://loinc.org|55284-4']
                      }
                    }
                  });

        $.when(pt, obv).fail(onError);

        $.when(pt, obv).done(function(patient, obv) {
          var byCodes = smart.byCodes(obv, 'code');
          var gender = patient.gender;
          var dob = new Date(patient.birthDate);
          var day = dob.getDate();
          var monthIndex = dob.getMonth() + 1;
          var year = dob.getFullYear();

          var dobStr = monthIndex + '/' + day + '/' + year;
          var fname = '';
          var lname = '';

          if (typeof patient.name[0] !== 'undefined') {
            fname = patient.name[0].given.join(' ');
            lname = patient.name[0].family.join(' ');
          }

          var height = byCodes('8302-2');
          var systolicbp = getBloodPressureValue(byCodes('55284-4'),'8480-6');
          var diastolicbp = getBloodPressureValue(byCodes('55284-4'),'8462-4');
          var hdl = byCodes('2085-9');
          var ldl = byCodes('2089-1');

          var p = defaultPatient();
          p.birthdate = dobStr;
          p.gender = gender;
          p.fname = fname;
          p.lname = lname;
          p.age = parseInt(calculateAge(dob));
          p.height = getQuantityValueAndUnit(height[0]);
		  
		  p.jsonObj = patient;

          if (typeof systolicbp != 'undefined')  {
            p.systolicbp = systolicbp;
          }

          if (typeof diastolicbp != 'undefined') {
            p.diastolicbp = diastolicbp;
          }

          p.hdl = getQuantityValueAndUnit(hdl[0]);
          p.ldl = getQuantityValueAndUnit(ldl[0]);
		  
		  alert("patient jsonObj : " +p.jsonObj);
		  alert("patient : " +p);

         
        });
      } else {
        onError();
      }
    }

function defaultPatient(){
    return {
      fname: {value: ''},
      lname: {value: ''},
      gender: {value: ''},
      birthdate: {value: ''},
      age: {value: ''},
      height: {value: ''},
      systolicbp: {value: ''},
      diastolicbp: {value: ''},
      ldl: {value: ''},
      hdl: {value: ''},
	    jsonObj: {value: ''},
    };
  }

  function getBloodPressureValue(BPObservations, typeOfPressure) {
    var formattedBPObservations = [];
    BPObservations.forEach(function(observation){
      var BP = observation.component.find(function(component){
        return component.code.coding.find(function(coding) {
          return coding.code == typeOfPressure;
        });
      });
      if (BP) {
        observation.valueQuantity = BP.valueQuantity;
        formattedBPObservations.push(observation);
      }
    });

    return getQuantityValueAndUnit(formattedBPObservations[0]);
  }

  function isLeapYear(year) {
    return new Date(year, 1, 29).getMonth() === 1;
  }

  function calculateAge(date) {
    if (Object.prototype.toString.call(date) === '[object Date]' && !isNaN(date.getTime())) {
      var d = new Date(date), now = new Date();
      var years = now.getFullYear() - d.getFullYear();
      d.setFullYear(d.getFullYear() + years);
      if (d > now) {
        years--;
        d.setFullYear(d.getFullYear() - 1);
      }
      var days = (now.getTime() - d.getTime()) / (3600 * 24 * 1000);
      return years + days / (isLeapYear(now.getFullYear()) ? 366 : 365);
    }
    else {
      return undefined;
    }
  }

  function getQuantityValueAndUnit(ob) {
    if (typeof ob != 'undefined' &&
        typeof ob.valueQuantity != 'undefined' &&
        typeof ob.valueQuantity.value != 'undefined' &&
        typeof ob.valueQuantity.unit != 'undefined') {
          return ob.valueQuantity.value + ' ' + ob.valueQuantity.unit;
    } else {
      return undefined;
    }
  }

  window.drawVisualization = function(p) {
    $('#loading').hide();
    $('#fname').html(p.name[0].text);
    $('#gender').html(p.gender);
    $('#birthdate').html(p.birthDate);
    $('#response').show();
  };
