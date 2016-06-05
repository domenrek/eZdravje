
var baseUrl = 'https://rest.ehrscape.com/rest/v1';
var queryUrl = baseUrl + '/query';

var username = "ois.seminar";
var password = "ois4fri";


/**
 * Prijava v sistem z privzetim uporabnikom za predmet OIS in pridobitev
 * enolične ID številke za dostop do funkcionalnosti
 * @return enolični identifikator seje za dostop do funkcionalnosti
 */

function getSessionId() {
    var response = $.ajax({
        type: "POST",
        url: baseUrl + "/session?username=" + encodeURIComponent(username) +
                "&password=" + encodeURIComponent(password),
        async: false
    });
   // $("#podatkii").html("toj to "+response.responseJSON.sessionId);
   
   return response.responseJSON.sessionId;
}


/**
 * Generator podatkov za novega pacienta, ki bo uporabljal aplikacijo. Pri
 * generiranju podatkov je potrebno najprej kreirati novega pacienta z
 * določenimi osebnimi podatki (ime, priimek in datum rojstva) ter za njega
 * shraniti nekaj podatkov o vitalnih znakih.
 * @param stPacienta zaporedna številka pacienta (1, 2 ali 3)
 * @return ehrId generiranega pacienta
 */
function generirajPodatke() {
	var ehrId = "";

    var id1 = "3639a3a6-09c3-4b30-b053-3a8e53b480ca";
    var id2 = "fe89f3c8-e4ec-40ce-baa5-2951cc496217";
    var id3 = "1053bf71-e40b-45df-a968-d4bae7f2ea3e";
    
    for(var i = 1; i<=3; i++) {
	    if(i == 1) {
	    	$("#izbiraMoznosti").append("<option value="+id1+">Cristiano Rolando</option>");
	    }
	    if(i == 2) {
	    	$("#izbiraMoznosti").append("<option value="+id2+">Arnold Schwarzenigger</option>");
	    }
	    if(i == 3) {
	    	$("#izbiraMoznosti").append("<option value="+id3+">Peter Griffin</option>");
	    }
  
    }
}


// TODO: Tukaj implementirate funkcionalnost, ki jo podpira vaša aplikacija


function kreirajEHRzaBolnika() {
	sessionId = getSessionId();

	var ime = $("#kreirajIme").val();
	var priimek = $("#kreirajPriimek").val();

	if (!ime || !priimek || ime.trim().length == 0 ||
      priimek.trim().length == 0 ) {
		$("#kreirajSporocilo").html("<span class='obvestilo label " +
      "label-warning fade-in'>Prosim vnesite zahtevane podatke!</span>");
	} else {
		$.ajaxSetup({
		    headers: {"Ehr-Session": sessionId}
		});
		$.ajax({
		    url: baseUrl + "/ehr",
		    type: 'POST',
		    success: function (data) {
		        var ehrId = data.ehrId;
		        var partyData = {
		            firstNames: ime,
		            lastNames: priimek,
		            partyAdditionalInfo: [{key: "ehrId", value: ehrId}]
		        };
		        $.ajax({
		            url: baseUrl + "/demographics/party",
		            type: 'POST',
		            contentType: 'application/json',
		            data: JSON.stringify(partyData),
		            success: function (party) {
		                if (party.action == 'CREATE') {
		                    $("#kreirajSporocilo").html("<span class='obvestilo " +
                          "label label-success fade-in'>Uspešno kreiran EHR '" +
                          ehrId + "'.</span>");
		                    $("#dodajVitalnoEHR").val(ehrId);
		                    
		                    $("#izbiraMoznosti").append("<option value="+ehrId+">"+ime+" "+priimek+"</option>");
		                }
		            },
		            error: function(err) {
		            	$("#kreirajSporocilo").html("<span class='obvestilo label " +
                    "label-danger fade-in'>Napaka '" +
                    JSON.parse(err.responseText).userMessage + "'!");
		            }
		        });
		    }
		});
	}
}

function dodajMeritveVitalnihZnakov() {
	
	 sessionId = getSessionId();

	var ehrId = $("#dodajVitalnoEHR").val();
	var telesnaVisina = $("#dodajVitalnoTelesnaVisina").val();
	var telesnaTeza = $("#dodajVitalnoTelesnaTeza").val();
	var telesnaMascoba = $("#dodajVitalnoTelesnaMascoba").val();


	if (!ehrId || ehrId.trim().length == 0) {
		$("#dodajMeritveVitalnihZnakovSporocilo").html("<span class='obvestilo " +
      "label label-warning fade-in'>Prosim vnesite zahtevane podatke!</span>");
	} else {
		$.ajaxSetup({
		    headers: {"Ehr-Session": sessionId}
		});
		var podatki = {
			// Struktura predloge je na voljo na naslednjem spletnem naslovu:
      // https://rest.ehrscape.com/rest/v1/template/Vital%20Signs/example
		    "ctx/language": "en",
		    "ctx/territory": "SI",
		    "vital_signs/height_length/any_event/body_height_length": telesnaVisina,
		    "vital_signs/body_weight/any_event/body_weight": telesnaTeza,
		   	"vital_signs/blood_pressure/any_event/systolic": telesnaMascoba

		};
		
		var parametriZahteve = {
		    ehrId: ehrId,
		    templateId: 'Vital Signs',
		    format: 'FLAT',
		};
		$.ajax({
		    url: baseUrl + "/composition?" + $.param(parametriZahteve),
		    type: 'POST',
		    contentType: 'application/json',
		    data: JSON.stringify(podatki),
		    success: function (res) {
		        $("#dodajMeritveVitalnihZnakovSporocilo").html(
              "<span class='obvestilo label label-success fade-in'>" +
              res.meta.href + ".</span>");
		    },
		    error: function(err) {
		    	$("#dodajMeritveVitalnihZnakovSporocilo").html(
            "<span class='obvestilo label label-danger fade-in'>Napaka '" +
            JSON.parse(err.responseText).userMessage + "'!jebemti");
		    }
		});
	}
}


	var mi;
	var fat;
	var teza;
	var visina;
	var gEhrId;

//izpise osebne podatke na podlagi ehrId

function prikaziMeritve() {

	
	var ehrId = $('#izbiraMoznosti').val();
	$("#podatkii").html("ehrId: "+ehrId+"<br>");
	gEhrId = ehrId;

	var searchData = [
    {key: "ehrId", value: ehrId}
];
$.ajax({
    url: baseUrl + "/demographics/party/query",
    type: 'POST',
    contentType: 'application/json',
    data: JSON.stringify(searchData),
    success: function (res) {
        
        for (var i in res.parties) {
            var party = res.parties[i];
            $("#podatkiii").html("<b>Ime in priimek: "+party.firstNames + ' ' + party.lastNames + "<b><br>");
        }
    }
});

}

function izpisiZnake() {
	
	var sessionId = getSessionId();

	
		$.ajax({
    url: baseUrl + "/view/" + gEhrId + "/weight",
    type: 'GET',
    headers: {"Ehr-Session": sessionId},
    success: function (res) {
        //$("#ffmi").html("Body weight");
        if (res.length > 0) {
        	$("#teza").html("Teza: "+res[0].weight);
			teza =res[0].weight;
			
        }
    }
});    

    $.ajax({
    url: baseUrl + "/view/" + gEhrId + "/height",
    type: 'GET',
    headers: {"Ehr-Session": sessionId},
    success: function (res) {
        //$("#ffmi").html("Body height");
       if (res.length > 0) {
       	$("#visina").html("Visina: "+res[0].height);
			visina = res[0].height;
			
		
        }
    }
}); 

	 $.ajax({
    url: baseUrl + "/view/" + gEhrId + "/blood_pressure",
    type: 'GET',
    headers: {"Ehr-Session": sessionId},
    success: function (res) {
        //$("#ffmi").html("Body height");
       if (res.length > 0) {
       		$("#fat").html("Procent telesne mascobe: "+res[0].systolic);
			fat = res[0].systolic;
			
        }
    }
    
}); 
	
}

function izracunaj() {

	
	var lean = teza * (1.0 - (fat / 100));
	var ffmi = ( lean / 2.2 ) / Math.pow(((visina / 2.54 ) * 0.0254),2) * 2.20462; 
	mi = ffmi;
	//lean = Math.round(lean);
	
	$("#massi").html(Math.round(ffmi * 100)/100);
	
	
}

function drawChart() {
	
	if(mi == undefined){
	
		$("#graf").html("Prvo izračunaj ffmi!");
	
	}else {
        var data = google.visualization.arrayToDataTable([
          ['Label', 'Value'],
          ['Fitness lvl', mi*10/3],
          
        ]);

        var options = {
          width: 500, height: 200,
          yellowFrom:50, yellowTo: 65,
		  greenFrom:65, greenTo:85,
		  redFrom: 85, redTo: 100,
          minorTicks: 10
        };

        var chart = new google.visualization.Gauge(document.getElementById('graf'));

        chart.draw(data, options);
		
		$("#legend").show();
		
      }
      $(".skrij").show();
}


function prikaziVreme() {
	$('#vreme').html("");
	 
	$.ajax({
	  url : "http://api.wunderground.com/api/31929bfc29ee9b4a/geolookup/conditions/q/SI/Ljubljana.json",
	  dataType : "jsonp",
	  success : function(parsed_json) {
	  var location = parsed_json['location']['city'];
	  var temp_c = parsed_json['current_observation']['temp_c'];
	  //alert("Current temperature in " + location + " is: " + temp_c);
	  $('#vreme').append(" "+temp_c+" °C ");
	  }
	  });
	
	$.ajax({ 
		url: "http://api.wunderground.com/api/31929bfc29ee9b4a/geolookup/conditions/q/SI/Ljubljana.json", 
		dataType: "jsonp", 
		success: function (parsed_json){ 
		var currentCondIcon = parsed_json['current_observation']['icon']; 
		$('#vreme').append('<img src="http://icons.wxug.com/i/c/k/partlycloudy.gif" height="75" width="75"/>'); 
		} 
	}); 
	
}
