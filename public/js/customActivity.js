define([
    'postmonger'
], function(
    Postmonger
) {
    'use strict';
	
    var connection = new Postmonger.Session();
    var payload = {};
    var authToken;
    var DERowList = []
    var hearsayfields = {};
    var lastStepEnabled = false;
    var steps = [ // initialize to the same value as what's set in config.json for consistency
        { "label": "Template Selection", "key": "step1" },
        { "label": "Map the Template Field", "key": "step2", "active": false},
        { "label": "Review Template Field", "key": "step3", "active": false}
    ];
    var currentStep = steps[0].key;
    var eventDefKey;
    $(window).ready(onRender);

    connection.on('requestedTokens', onGetTokens);
    connection.on('requestedEndpoints', onGetEndpoints);
    connection.on('initActivity', initialize);
    connection.on('requestedSchema', onRequestSchema);

    connection.on('clickedNext', onClickedNext);
    connection.on('clickedBack', onClickedBack);
    connection.on('gotoStep', onGotoStep);

    function onRender() {
        $('#inputField-01').hide();
        // JB will respond the first time 'ready' is called with 'initActivity'
        connection.trigger('requestTokens');
	connection.trigger('requestEndpoints');
	connection.trigger('ready');
        connection.trigger('requestSchema');
	    
	$('.slds-select.hearsay').on('change', function(event) {
		$('.slds-select.hearsay').find('option').show();
		intializeSelectHearsay(event.target.id);
	});

	$('.slds-select.journey').on('change', function(event) {
		$('.slds-select.journey').find('option').show();
		intializeSelectJourney(event.target.id);
	});
	    
        $('#select-01').change(function() {
            var message = getIntegrationName('#select-01');
            console.log('message value '+message);
            if(message == 'Current Journey'){
                lastStepEnabled = !lastStepEnabled; // toggle status
                steps[1].active = true;
                steps[2].active = true; // toggle active
                $('#inputField-01').show();
                connection.trigger('updateSteps', steps);
            } else {
                //reviewPageEnabled = false; // toggle status
                steps[2].active = true;
                steps[1].active = false; // toggle active
                $('#inputField-01').hide();
                connection.trigger('updateSteps', steps);
            }
            //$('#message').html(message);
        });
    }

    function initialize (data) {
        
        if (data) {
            payload = data;
        }
	/*var dataOptions = new Array("firstName","lastName","name","email","title","phone","birthdate","preferredName","sourceId","sourceOwnerId","sourceOrganizationId");
	    
	for (var i=0; i < dataOptions.length;++i){
		addOption($('#select-hearsay1'), dataOptions[i], dataOptions[i]);
		addOption($('#select-hearsay2'), dataOptions[i], dataOptions[i]);
		addOption($('#select-hearsay3'), dataOptions[i], dataOptions[i]);
		addOption($('#select-hearsay4'), dataOptions[i], dataOptions[i]);
		addOption($('#select-hearsay5'), dataOptions[i], dataOptions[i]);
		addOption($('#select-hearsay6'), dataOptions[i], dataOptions[i]);
		addOption($('#select-hearsay7'), dataOptions[i], dataOptions[i]);
		addOption($('#select-hearsay8'), dataOptions[i], dataOptions[i]);
		addOption($('#select-hearsay9'), dataOptions[i], dataOptions[i]);
	}*/
        
        var mapfields;
        var hasInArguments = Boolean(
            payload['arguments'] &&
            payload['arguments'].execute &&
            payload['arguments'].execute.inArguments &&
            payload['arguments'].execute.inArguments.length > 0
        );

        var inArguments = hasInArguments ? payload['arguments'].execute.inArguments : {};

        $.each(inArguments, function(index, inArgument) {
            $.each(inArgument, function(key, val) {
                if (key === 'hearsayfields') {
                    mapfields = val;
                }
            });
        });
	    
	/*$("#select-hearsay1 option").filter(function() {
		return this.text == 'Name';
	}).attr('selected', true);
	    
	$("#select-hearsay2 option").filter(function() {
		intializeSelectHearsay('select-hearsay2');
		return this.text == 'SourceId'; 
	}).attr('selected', true);
	    
	$("#select-hearsay3 option").filter(function() {
		intializeSelectHearsay('select-hearsay3');
		return this.text == 'SourceOwnerId'; 
	}).attr('selected', true);
		
	$("#select-hearsay4 option").filter(function() {
		intializeSelectHearsay('select-hearsay4');
		return this.text == 'SourceOrganizationId'; 
	}).attr('selected', true);
	    
	$("#select-hearsay5 option").filter(function() {
		intializeSelectHearsay('select-hearsay5');
		return this.text == 'Phone'; 
	}).attr('selected', true);*/

        // If there is no message selected, disable the next button
        if (!mapfields) {
            showStep(null, 1);
            connection.trigger('updateButton', { button: 'next', enabled: false });
            // If there is a intTypeValue, skip to the summary step
        } else {
            var div_data = '';
            for (var key in mapfields) {
                if (mapfields.hasOwnProperty(key)) {
                    var val = mapfields[key].split('.').pop().replace('}}','');
                    console.log('key '+key);
                    console.log('value '+val);
                    div_data += "<li>"+key+' : '+val+"</li>";
                }
            }
            $('#intTypeValues').html(div_data);
            showStep(null, 3);
        }
    }
	
    function addOption(selectbox,text,value ) {
    	selectbox.append('<option value="'+value+'">'+text.charAt(0).toUpperCase() + text.slice(1)+'</option>');
    }
    
    function intializeSelectJourney(targetId) {
	// this "initializes the boxes"
	$('.slds-select.journey').each(function(box) {
		var value = $('.slds-select.journey')[box].value;
		var thisElement = this.id;
		if (value) {
			$('.slds-select.journey').not(this).find('option[value="' + value + '"]').hide();
		}
		
		if ((targetId === thisElement) && value) {
		    const div_data = '<div class="slds-progress-ring slds-progress-ring_complete">' +
			'<div class="slds-progress-ring__progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="100">' +
			'<svg viewBox="-1 -1 2 2">' +
			'<circle class="slds-progress-ring__path" id="slds-progress-ring-path-44" cx="0" cy="0" r="1"></circle>' +
			'</svg>' +
			'</div>' +
			'<div class="slds-progress-ring__content">' +
			'<span class="slds-icon_container slds-icon-utility-check" title="Complete">' +
			'<svg class="slds-icon" aria-hidden="true">'+
			'<use xlink:href="assets/styles/icons/utility-sprite/svg/symbols.svg#check"></use>'+
			'</svg>'+
			'<span class="slds-assistive-text">Complete</span>' +
			'</span>' +
			'</div>' +
			'</div>'
		    $('#' + thisElement + '-ring').html(div_data);
		} else if ((targetId === thisElement) && !value) {
		    const div_data = '<div class="slds-progress-ring slds-progress-ring_expired">'+
				'<div class="slds-progress-ring__progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">'+
				'<svg viewBox="-1 -1 2 2">'+
				'<path class="slds-progress-ring__path" id="slds-progress-ring-path-46" d="M 1 0 A 1 1 0 0 1 1.00 0.00 L 0 0"></path>'+
				'</svg>'+
				'</div>'+
				'<div class="slds-progress-ring__content">'+thisElement.charAt(thisElement.length - 1)+'</div>'+
				'</div>'
		    $('#' + thisElement + '-ring').html(div_data);
		}
	});
    };
    
    function intializeSelectHearsay(targetId) {
	// this "initializes the boxes"
	$('.slds-select.hearsay').each(function(box) {
		var value = $('.slds-select.hearsay')[box].value;
		var thisElement = this.id;
		if (value) {
			$('.slds-select.hearsay').not(this).find('option[value="' + value + '"]').hide();
		}
		
		if ((targetId === thisElement) && value) {
		    const div_data = '<div class="slds-progress-ring slds-progress-ring_complete">' +
			'<div class="slds-progress-ring__progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="100">' +
			'<svg viewBox="-1 -1 2 2">' +
			'<circle class="slds-progress-ring__path" id="slds-progress-ring-path-44" cx="0" cy="0" r="1"></circle>' +
			'</svg>' +
			'</div>' +
			'<div class="slds-progress-ring__content">' +
			'<span class="slds-icon_container slds-icon-utility-check" title="Complete">' +
			'<svg class="slds-icon" aria-hidden="true">'+
			'<use xlink:href="assets/styles/icons/utility-sprite/svg/symbols.svg#check"></use>'+
			'</svg>'+
			'<span class="slds-assistive-text">Complete</span>' +
			'</span>' +
			'</div>' +
			'</div>'
		    $('#' + thisElement + '-ring').html(div_data);
		} else if ((targetId === thisElement) && !value) {
		    const div_data = '<div class="slds-progress-ring slds-progress-ring_expired">' +
			'<div class="slds-progress-ring__progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">' +
			'<svg viewBox="-1 -1 2 2">' +
			'<path class="slds-progress-ring__path" id="slds-progress-ring-path-46" d="M 1 0 A 1 1 0 0 1 1.00 0.00 L 0 0"></path>' +
			'</svg>' +
			'</div>' +
			'<div class="slds-progress-ring__content" style="background: gray"></div>' +
			'</div>'
		    $('#' + thisElement + '-ring').html(div_data);
		}
	});
    };

    function onGetTokens (tokens) {
        // Response: tokens = { token: <legacy token>, fuel2token: <fuel api token> }
         console.log(tokens);
	    authToken = tokens.fuel2token;
	    
	    fetch("/retrieve/derows/", {
			method: "POST",
			body: JSON.stringify({
				token: authToken,
			}),
		})
		.then(response => response.text())
		.then(dataValue => {
			console.log('Success:', dataValue);
			for(var x in JSON.parse(dataValue)){
			  console.log('data '+JSON.parse(dataValue)[x]['Properties'][0]['Property'][0]['Value']);
			  DERowList.push(JSON.parse(dataValue)[x]['Properties'][0]['Property'][0]['Value']);
			}
			console.log('DERowList '+DERowList);
			DERowList.forEach((option) => {
				$('#select-01').append($('<option>', {
					value: option,
					text: option
				}));
			});
			$('#select-01').append($('<option>', {
				value: 'CurrentJourney',
				text: 'Current Journey'
			}));
		})
		.catch((error) => {
			  console.error('Error:', error);
		});
    }
    
    function onRequestSchema(data){
        console.log('*** Schema ***', JSON.stringify(data['schema']));
	for (var x in data['schema']) {
	  console.log('*** Iterate Schema ***', x);
	  eventDefKey = data['schema'][x].key.substr(0, data['schema'][x].key.lastIndexOf("."));
	  console.log('*** eventDefKey ***', eventDefKey);
	  var keyfield = data['schema'][x].key.split('.').pop();
	  console.log('keyfields '+keyfield);
	  if(keyfield != 'endDate'){
		  $('#select-journey1').append('<option value="'+keyfield+'">'+keyfield.charAt(0).toUpperCase() + keyfield.slice(1)+'</option>');
		  $('#select-journey2').append('<option value="'+keyfield+'">'+keyfield.charAt(0).toUpperCase() + keyfield.slice(1)+'</option>');
		  $('#select-journey3').append('<option value="'+keyfield+'">'+keyfield.charAt(0).toUpperCase() + keyfield.slice(1)+'</option>');
		  $('#select-journey4').append('<option value="'+keyfield+'">'+keyfield.charAt(0).toUpperCase() + keyfield.slice(1)+'</option>');
		  $('#select-journey5').append('<option value="'+keyfield+'">'+keyfield.charAt(0).toUpperCase() + keyfield.slice(1)+'</option>');	
		  $('#select-journey6').append('<option value="'+keyfield+'">'+keyfield.charAt(0).toUpperCase() + keyfield.slice(1)+'</option>');
		  $('#select-journey7').append('<option value="'+keyfield+'">'+keyfield.charAt(0).toUpperCase() + keyfield.slice(1)+'</option>');
		  $('#select-journey8').append('<option value="'+keyfield+'">'+keyfield.charAt(0).toUpperCase() + keyfield.slice(1)+'</option>');
		  $('#select-journey9').append('<option value="'+keyfield+'">'+keyfield.charAt(0).toUpperCase() + keyfield.slice(1)+'</option>');
	  }
	}
    }

    function onGetEndpoints (endpoints) {
        // Response: endpoints = { restHost: <url> } i.e. "rest.s1.qa1.exacttarget.com"
         console.log(endpoints);
    }

    function onClickedNext () {
	var selectOption = getIntegrationType('#select-01');
        if (currentStep.key === 'step3') {
            save();
        } else if(currentStep.key === 'step1' && selectOption == 'CurrentJourney'){
            var input = $('#text-input-id-1')[0];
            var validityState_object = input.validity;
            if (validityState_object.valueMissing){
                
                    input.setCustomValidity('Must enter your template name!');
                    input.reportValidity();
                showStep(null, 1);
                connection.trigger('ready');
            } else {
                const sameCaseArray = DERowList.map(value => value.toString().toLowerCase());
		var inputValue = $('#text-input-id-1').val().toString().toLowerCase();
		if(sameCaseArray.includes(inputValue)){
			input.setCustomValidity('Template name already exist!');
			input.reportValidity();
			showStep(null, 1);
			connection.trigger('ready');
		} else {
			$("#select-journey1 option").filter(function() {
				return this.text == 'Hearsay Org ID';
			}).attr('selected', true);

			$("#select-journey2 option").filter(function() {
				return this.text == 'Agent ID';
			}).attr('selected', true);

			$("#select-journey3 option").filter(function() {
				return this.text == 'Cust ID'; 
			}).attr('selected', true);

			$("#select-journey4 option").filter(function() {
				return this.text == 'Name'; 
			}).attr('selected', true);

			$("#select-journey5 option").filter(function() {
				return this.text == 'Phone'; 
			}).attr('selected', true);
			
			intializeSelectHearsay('select-hearsay1');
			intializeSelectHearsay('select-hearsay2');
			intializeSelectHearsay('select-hearsay3');
			intializeSelectHearsay('select-hearsay4');
			intializeSelectHearsay('select-hearsay5');
			intializeSelectJourney('select-journey1');
			intializeSelectJourney('select-journey2');
			intializeSelectJourney('select-journey3');
			intializeSelectJourney('select-journey4');
			intializeSelectJourney('select-journey5');
			connection.trigger('nextStep');	
		}
            }
        } else if(currentStep.key === 'step2'){
	    hearsayfields = {};
		
            if(getIntegrationName('#select-journey1') != '--Select--' && getIntegrationName('#select-hearsay1') != '--Select--') hearsayfields [getIntegrationType('#select-hearsay1')] = getIntegrationType('#select-journey1');
            if(getIntegrationName('#select-journey2') != '--Select--' && getIntegrationName('#select-hearsay2') != '--Select--') hearsayfields [getIntegrationType('#select-hearsay2')] = getIntegrationType('#select-journey2');
            if(getIntegrationName('#select-journey3') != '--Select--' && getIntegrationName('#select-hearsay3') != '--Select--') hearsayfields [getIntegrationType('#select-hearsay3')] = getIntegrationType('#select-journey3');
            if(getIntegrationName('#select-journey4') != '--Select--' && getIntegrationName('#select-hearsay4') != '--Select--') hearsayfields [getIntegrationType('#select-hearsay4')] = getIntegrationType('#select-journey4');
            if(getIntegrationName('#select-journey5') != '--Select--' && getIntegrationName('#select-hearsay5') != '--Select--') hearsayfields [getIntegrationType('#select-hearsay5')] = getIntegrationType('#select-journey5');
            if(getIntegrationName('#select-journey6') != '--Select--' && getIntegrationName('#select-hearsay6') != '--Select--') hearsayfields [getIntegrationType('#select-hearsay6')] = getIntegrationType('#select-journey6');
            if(getIntegrationName('#select-journey7') != '--Select--' && getIntegrationName('#select-hearsay7') != '--Select--') hearsayfields [getIntegrationType('#select-hearsay7')] = getIntegrationType('#select-journey7');
            if(getIntegrationName('#select-journey8') != '--Select--' && getIntegrationName('#select-hearsay8') != '--Select--') hearsayfields [getIntegrationType('#select-hearsay8')] = getIntegrationType('#select-journey8');
	    if(getIntegrationName('#select-journey9') != '--Select--' && getIntegrationName('#select-hearsay9') != '--Select--') hearsayfields [getIntegrationType('#select-hearsay9')] = getIntegrationType('#select-journey9');
            console.log('hearsayfields '+hearsayfields);
	    var div_data = '';
	    for (var key in hearsayfields) {
	    	if (hearsayfields.hasOwnProperty(key)) {
			var val = hearsayfields[key];
			console.log('key '+key);
			console.log('value '+val);
			div_data += "<li>"+key+' : '+val+"</li>";
		}
	    }
	    $('#intTypeValues').html(div_data);
            connection.trigger('nextStep');
		
	} else if(currentStep.key === 'step1' && selectOption != 'CurrentJourney'){
		var div_data = '';
		hearsayfields = {};
		const templateName = { DEName: selectOption }
		fetch("/dataextension/row/", {
			method: "POST",
			body: JSON.stringify({
			    DEName: selectOption,
			    token: authToken
			}),
		})
		.then(response => response.text())
		.then(dataValue => {
			console.log('Success:', dataValue);
			for(var x in JSON.parse(dataValue)){
			  for(var y in JSON.parse(dataValue)[x]['Properties'][0]['Property']){
			      var NameValue = JSON.parse(dataValue)[x]['Properties'][0]['Property'][y]['Name'].toString();
			      var DataValue = JSON.parse(dataValue)[x]['Properties'][0]['Property'][y]['Value'].toString();
				if(DataValue){
				   hearsayfields [NameValue] = DataValue;
				}
			   }
			}
		
		    for (var key in hearsayfields) {
			if (hearsayfields.hasOwnProperty(key)) {
				var val = hearsayfields[key];
				console.log('key '+key);
				console.log('value '+val);
				div_data += "<li>"+key+' : '+val+"</li>";
			}
		    }
		    $('#intTypeValues').html(div_data);
		    connection.trigger('nextStep');
			
		})
		.catch((error) => {
			console.log('error:', error);
			  showStep(null, 1);
		});
	}
    }

    function onClickedBack () {
	    if(payload){
		var intTypeValue = payload.metaData.selectedOption;
		if (intTypeValue) {
		    $("#select-01 option").filter(function() {
			return this.text == intTypeValue; 
		    }).attr('selected', true);
		}
	    }
        connection.trigger('prevStep');
    }

    function onGotoStep (step) {
        showStep(step);
        connection.trigger('ready');
    }

    function showStep(step, stepIndex) {
        if (stepIndex && !step) {
            step = steps[stepIndex-1];
        }

        currentStep = step;

        $('.step').hide();

         switch(currentStep.key) {
            case 'step1':
                $('#step1').show();
                connection.trigger('updateButton', {
                    button: 'next',
                    enabled: Boolean(getIntegrationType('#select-01'))
                });
                connection.trigger('updateButton', {
                    button: 'back',
                    visible: false
                });
                break;
            case 'step2':
                $('#step2').show();
                connection.trigger('updateButton', {
                    button: 'back',
                    visible: true
                });
                if (lastStepEnabled) {
                    connection.trigger('updateButton', {
                        button: 'next',
                        text: 'next',
                        visible: true
                    });
                } else {
                    connection.trigger('updateButton', {
                        button: 'next',
                        text: 'done',
                        visible: true
                    });
                }
                break;
            case 'step3':
                $('#step3').show();
                connection.trigger('updateButton', {
                     button: 'back',
                     visible: true
                });
                connection.trigger('updateButton', {
                     button: 'next',
                     text: 'done',
                     visible: true
                });
                break;
        }
    }

    function save() {
        var name = getIntegrationName('#select-01');
	var inputValue;
	var fieldListString = '';
	    
	if(name == 'Current Journey'){
		   inputValue = $('#text-input-id-1').val().toString();
		   let fieldName = '';
		   for(var x in hearsayfields){
			fieldName =  hearsayfields[x].toString();
			if(fieldName.toLowerCase().includes("name") || fieldName.toLowerCase().includes("cust") || fieldName.toLowerCase().includes("agent") || fieldName.toLowerCase().includes("org") || fieldName.toLowerCase().includes("phone")){
			   	fieldListString += '<Field>'
				+'<CustomerKey>'+fieldName+'</CustomerKey>'
				+'<Name>'+fieldName+'</Name>'
				+'<FieldType>Text</FieldType>'
				+'<IsRequired>true</IsRequired>'
				+'<IsPrimaryKey>false</IsPrimaryKey>'
				+'</Field>'
			} else {
				fieldListString += '<Field>'
				+'<CustomerKey>'+fieldName+'</CustomerKey>'
				+'<Name>'+fieldName+'</Name>'
				+'<FieldType>Text</FieldType>'
				+'<MaxLength>50</MaxLength>'
				+'<IsRequired>false</IsRequired>'
				+'<IsPrimaryKey>false</IsPrimaryKey>'
				+'</Field>'	
			}
			hearsayfields[x] = '{{'+eventDefKey+'.\"' +fieldName+ '\"}}';   
		   }
		fieldListString += '<Field>'
				+'<CustomerKey>Email</CustomerKey>'
				+'<Name>Email</Name>'
				+'<FieldType>EmailAddress</FieldType>'
				+'<MaxLength>250</MaxLength>'
				+'<IsRequired>true</IsRequired>'
				+'<IsPrimaryKey>true</IsPrimaryKey>'
				+'</Field>'
		console.log('fieldListString '+fieldListString);
		let soapMessage = '<?xml version="1.0" encoding="UTF-8"?>'
		+'<s:Envelope xmlns:s="http://www.w3.org/2003/05/soap-envelope" xmlns:a="http://schemas.xmlsoap.org/ws/2004/08/addressing" xmlns:u="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd">'
		+'    <s:Header>'
		+'        <a:Action s:mustUnderstand="1">Create</a:Action>'
		+'        <a:To s:mustUnderstand="1">https://mc4f63jqqhfc51yw6d1h0n1ns1-m.soap.marketingcloudapis.com/Service.asmx</a:To>'
		+'        <fueloauth xmlns="http://exacttarget.com">'+authToken+'</fueloauth>'
		+'    </s:Header>'
		+'    <s:Body xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">'
		+'        <CreateRequest xmlns="http://exacttarget.com/wsdl/partnerAPI">'
		+'<Objects xsi:type="DataExtension">'
		+'<CategoryID>cateID</CategoryID>'
		+'<CustomerKey>DEKey</CustomerKey>'
                +'<Name>DEName</Name>'
                +'<IsSendable>true</IsSendable>'
                +'<SendableDataExtensionField>'
                +'    <CustomerKey>Email</CustomerKey>'
                +'    <Name>Email</Name>'
                +'    <FieldType>EmailAddress</FieldType>'
                +'</SendableDataExtensionField>'
                +'<SendableSubscriberField>'
                +'    <Name>Subscriber Key</Name>'
                +'    <Value></Value>'
                +'</SendableSubscriberField>'
		+'<Fields>'
		+fieldListString
		+'</Fields>'
		+'</Objects>'
		+'        </CreateRequest>'
		+'    </s:Body>'
		+'</s:Envelope>';
		
		console.log('soapMessage '+soapMessage);
		
		fetch("/create/dextension/", {
			method: "POST",
			body: JSON.stringify({
			    name: inputValue,
			    token: authToken,
			    xmlData: soapMessage
			}),
		})
		.then(response => response.text())
		.then(dataValue => {
			console.log('Success:', dataValue);	
		})
		.catch((error) => {
			console.log('error:', error);
		});
	} else {
	   inputValue = name;
	}
	    
	payload.name = inputValue;
	console.log('hearsayfields '+hearsayfields);
        payload['arguments'].execute.inArguments = [{ "hearsayfields": hearsayfields }];

        payload['metaData'].isConfigured = true;
	payload.metaData['selectedOption'] = name;
	    
        connection.trigger('updateActivity', payload);
    }

    function getIntegrationType(elementID) {
        return $(elementID).find('option:selected').attr('value').trim();
    }

    function getIntegrationName(elementID) {
        return $(elementID).find('option:selected').html();
    }
});
