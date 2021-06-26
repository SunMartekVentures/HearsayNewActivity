//const e = require("express");

define(["postmonger"], function (Postmonger) {
  "use strict";

  var connection = new Postmonger.Session();
  var payload = {};
  var authToken;
  var DERowList = [];
  var hearsayfields = {};
  var dynTemplate = {};
  var inArgumentList = {};
  var lastStepEnabled = false;
  var isAppended = false;
  var DataExtFields;
  var msgText;
  var steps = [
    // initialize to the same value as what's set in config.json for consistency
    { label: "TEMPLATE SELECTION", key: "step1" },
    { label: "TYPE YOUR MESSAGE", key: "step2", active: false },
    { label: "MAP TEMPLATE DATA", key: "step3", active: false },
    { label: "REVIEW TEMPLATE", key: "step4", active: false },
  ];
  var currentStep = steps[0].key;
  var eventDefKey;
  $(window).ready(onRender);

  connection.on("requestedTokens", onGetTokens);
  connection.on("requestedEndpoints", onGetEndpoints);
  connection.on("initActivity", initialize);
  connection.on("requestedSchema", onRequestSchema);

  connection.on("clickedNext", onClickedNext);
  connection.on("clickedBack", onClickedBack);
  connection.on("gotoStep", onGotoStep);

  function onRender() {
    $("#inputField-01").hide();
    // JB will respond the first time 'ready' is called with 'initActivity'
    connection.trigger("requestTokens");
    connection.trigger("requestEndpoints");
    connection.trigger("ready");
    connection.trigger("requestSchema");

    $(".slds-select.hearsay").on("change", function (event) {
      $(".slds-select.hearsay").find("option").show();
      intializeSelectHearsay(event.target.id);
    });

    $(".slds-select.journey").on("change", function (event) {
      $("#error-msg").hide();
      $(".slds-select.journey").find("option").show();
      intializeSelectJourney(event.target.id);
    });

    $("#Action-01").change(function () {
      var message = getIntegrationName("#Action-01");

      if (message == "Message") {
        lastStepEnabled = true; // toggle status
        steps[1].active = true;
        steps[2].active = true;
        steps[3].active = true; // toggle active
        connection.trigger("updateSteps", steps);
        $("#select-01 option[value=CurrentJourney]").prop("selected", true);
        $("#select-01").prop("disabled", true);
        $("#inputField-01").show();
      } else {
        lastStepEnabled = false; // toggle status
        steps[3].active = true;
        steps[2].active = true;
        steps[1].active = false; // toggle active
        connection.trigger("updateSteps", steps);
        $("#select-01").prop("disabled", false);
        appendOptions();
      }
      //$('#message').html(message);
    });

    $("#select-01").change(function () {
      var sourceType = getIntegrationType("#select-01");
      if (sourceType == "CurrentJourney") {
        $("#inputField-01").show();
        connection.trigger("updateSteps", steps);
      } else {
        $("#inputField-01").hide();
        connection.trigger("updateSteps", steps);
      }
    });
  }

  function initialize(data) {
    if (data) {
      payload = data;
    }
    let selectedOpt;
    if(payload.metaData.selectedOption) selectedOpt = payload.metaData.selectedOption;
    if(selectedOpt == 'CurrentJourney'){
      $(`#select-01 option[value=${payload.metaData.selectedOption}]`).prop("selected", true);
      $("#text-input-id-1").val(payload.name);
    }else {
      $(`#select-01 option[value=${payload.metaData.selectedOption}]`).prop("selected", true);
    }
    var mapfields = {};
    var hasInArguments = Boolean(
      payload["arguments"] &&
        payload["arguments"].execute &&
        payload["arguments"].execute.inArguments &&
        payload["arguments"].execute.inArguments.length > 0
    );

    var inArguments = hasInArguments
      ? payload["arguments"].execute.inArguments
      : {};

    $.each(inArguments, function (index, inArgument) {
      $.each(inArgument, function (key, val) {
        if (key === "hearsayfields") {
          inArgumentList = val;
          hearsayfields = payload.metaData.hearsayData;
          mapfields = payload.metaData.hearsayData
            ? payload.metaData.hearsayData
            : {};
        }
      });
    });

    // If there is no message selected, disable the next button
    if (
      Object.keys(mapfields).length === 0 &&
      mapfields.constructor === Object
    ) {
      showStep(null, 1);
      connection.trigger("updateButton", { button: "next", enabled: false });
      // If there is a intTypeValue, skip to the summary step
    } else {
      var div_data = "";
      for (var key in mapfields) {
        if (key == "parameters") {
          div_data +=
            "<li>" +
            "Message Body" +
            " : " +
            mapfields[key].messageBody +
            "</li>";
        } else if (mapfields.hasOwnProperty(key)) {
          var val = mapfields[key].split(".").pop().replace("}}", "");
          div_data += "<li>" + key + " : " + val + "</li>";
        }
      }
      $("#intTypeValues").html(div_data);
      showStep(null, 4);
    }
  }

  function addOption(selectbox, text, value) {
    selectbox.append(
      '<option value="' +
        value +
        '">' +
        text.charAt(0).toUpperCase() +
        text.slice(1) +
        "</option>"
    );
  }

  function intializeSelectJourney(targetId) {
    // this "initializes the boxes"
    $(".slds-select.journey").each(function (box) {
      var value = $(".slds-select.journey")[box].value;
      var thisElement = this.id;
      if (value) {
        $(".slds-select.journey")
          .not(this)
          .find('option[value="' + value + '"]')
          .hide();
      }

      if (targetId === thisElement && value) {
        const div_data =
          '<div class="slds-progress-ring slds-progress-ring_complete">' +
          '<div class="slds-progress-ring__progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="100">' +
          '<svg viewBox="-1 -1 2 2">' +
          '<circle class="slds-progress-ring__path" id="slds-progress-ring-path-44" cx="0" cy="0" r="1"></circle>' +
          "</svg>" +
          "</div>" +
          '<div class="slds-progress-ring__content">' +
          '<span class="slds-icon_container slds-icon-utility-check" title="Complete">' +
          '<svg class="slds-icon" aria-hidden="true">' +
          '<use xlink:href="assets/styles/icons/utility-sprite/svg/symbols.svg#check"></use>' +
          "</svg>" +
          '<span class="slds-assistive-text">Complete</span>' +
          "</span>" +
          "</div>" +
          "</div>";
        $("#" + thisElement + "-ring").html(div_data);
      } else if (targetId === thisElement && !value) {
        const div_data =
          '<div class="slds-progress-ring slds-progress-ring_expired">' +
          '<div class="slds-progress-ring__progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">' +
          '<svg viewBox="-1 -1 2 2">' +
          '<path class="slds-progress-ring__path" id="slds-progress-ring-path-46" d="M 1 0 A 1 1 0 0 1 1.00 0.00 L 0 0"></path>' +
          "</svg>" +
          "</div>" +
          '<div class="slds-progress-ring__content">' +
          thisElement.charAt(thisElement.length - 1) +
          "</div>" +
          "</div>";
        $("#" + thisElement + "-ring").html(div_data);
      }
    });
  }

  function intializeSelectHearsay(targetId) {
    // this "initializes the boxes"
    $(".slds-select.hearsay").each(function (box) {
      var value = $(".slds-select.hearsay")[box].value;
      var thisElement = this.id;
      if (value) {
        $(".slds-select.hearsay")
          .not(this)
          .find('option[value="' + value + '"]')
          .hide();
      }

      if (targetId === thisElement && value) {
        const div_data =
          '<div class="slds-progress-ring slds-progress-ring_complete">' +
          '<div class="slds-progress-ring__progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="100">' +
          '<svg viewBox="-1 -1 2 2">' +
          '<circle class="slds-progress-ring__path" id="slds-progress-ring-path-44" cx="0" cy="0" r="1"></circle>' +
          "</svg>" +
          "</div>" +
          '<div class="slds-progress-ring__content">' +
          '<span class="slds-icon_container slds-icon-utility-check" title="Complete">' +
          '<svg class="slds-icon" aria-hidden="true">' +
          '<use xlink:href="assets/styles/icons/utility-sprite/svg/symbols.svg#check"></use>' +
          "</svg>" +
          '<span class="slds-assistive-text">Complete</span>' +
          "</span>" +
          "</div>" +
          "</div>";
        $("#" + thisElement + "-ring").html(div_data);
      } else if (targetId === thisElement && !value) {
        const div_data =
          '<div class="slds-progress-ring slds-progress-ring_expired">' +
          '<div class="slds-progress-ring__progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">' +
          '<svg viewBox="-1 -1 2 2">' +
          '<path class="slds-progress-ring__path" id="slds-progress-ring-path-46" d="M 1 0 A 1 1 0 0 1 1.00 0.00 L 0 0"></path>' +
          "</svg>" +
          "</div>" +
          '<div class="slds-progress-ring__content" style="background: gray"></div>' +
          "</div>";
        $("#" + thisElement + "-ring").html(div_data);
      }
    });
  }

  function appendOptions() {
    if (!isAppended) {
      DERowList.forEach((option) => {
        $("#select-01").append(
          $("<option>", {
            value: option,
            text: option,
          })
        );
      });
      isAppended = true;
    }
  }

  function onGetTokens(tokens) {
    // Response: tokens = { token: <legacy token>, fuel2token: <fuel api token> }
    //console.log(tokens);
    authToken = tokens.fuel2token;

    createFolder(authToken);

    fetch("/retrieve/derows/", {
      method: "POST",
      body: JSON.stringify({
        token: authToken,
      }),
    })
      .then((response) => response.text())
      .then((dataValue) => {
        console.log("Retrieve DE Success:", dataValue);
        for (var x in JSON.parse(dataValue)) {
          DERowList.push(
            JSON.parse(dataValue)[x]["Properties"][0]["Property"][0]["Value"]
          );
        }
      })
      .catch((error) => {
        console.log("Retrieve DE Error: ", error);
      });
  }

  function createFolder(oauthToken) {
    fetch("/create/hearsayfolder/", {
      method: "POST",
      body: JSON.stringify({
        token: oauthToken,
      }),
    })
      .then((response) => response.text())
      .then((dataValue) => {
        console.log("Folder Created Success: ", dataValue);
        createStaticDE(
          oauthToken,
          dataValue.replace('["', "").replace('"]', "").toString()
        );
        createStaticOrgDE(
          oauthToken,
          dataValue.replace('["', "").replace('"]', "").toString()
        );
      })
      .catch((error) => {
        console.log("Folder Error:", error);
      });
  }

  function createStaticDE(oauthToken, folderID) {
    fetch("/create/staticde/", {
      method: "POST",
      body: JSON.stringify({
        token: oauthToken,
        catID: folderID,
      }),
    })
      .then((response) => response.text())
      .then((dataValue) => {
        //console.log('Folder Created status: ', response.status);
        console.log("Static DE Success: ", dataValue);
      })
      .catch((error) => {
        console.log("Static DE Error:", error);
      });
  }

  function createStaticOrgDE(oauthToken, folderID) {
    fetch("/create/staticorgde/", {
      method: "POST",
      body: JSON.stringify({
        token: oauthToken,
        catID: folderID,
      }),
    })
      .then((response) => response.text())
      .then((dataValue) => {
        //console.log('Folder Created status: ', response.status);
        console.log("Org DE Success: ", dataValue);
      })
      .catch((error) => {
        console.log("Org DE Error:", error);
      });
  }

  function onRequestSchema(data) {
    DataExtFields = data;
  }

  function builtDeFields() {
    for (var x in DataExtFields["schema"]) {
      eventDefKey = DataExtFields["schema"][x].key.substr(
        0,
        DataExtFields["schema"][x].key.lastIndexOf(".")
      );
      var keyfield = DataExtFields["schema"][x].key.split(".").pop();
      if (keyfield != "endDate") {
        $("#select-journey1").append(
          '<option value="' +
            keyfield +
            '">' +
            keyfield.charAt(0).toUpperCase() +
            keyfield.slice(1) +
            "</option>"
        );
        $("#select-journey2").append(
          '<option value="' +
            keyfield +
            '">' +
            keyfield.charAt(0).toUpperCase() +
            keyfield.slice(1) +
            "</option>"
        );
        $("#select-journey3").append(
          '<option value="' +
            keyfield +
            '">' +
            keyfield.charAt(0).toUpperCase() +
            keyfield.slice(1) +
            "</option>"
        );
        $("#select-journey4").append(
          '<option value="' +
            keyfield +
            '">' +
            keyfield.charAt(0).toUpperCase() +
            keyfield.slice(1) +
            "</option>"
        );
        $("#select-journey5").append(
          '<option value="' +
            keyfield +
            '">' +
            keyfield.charAt(0).toUpperCase() +
            keyfield.slice(1) +
            "</option>"
        );
        $("#select-journey6").append(
          '<option value="' +
            keyfield +
            '">' +
            keyfield.charAt(0).toUpperCase() +
            keyfield.slice(1) +
            "</option>"
        );
        $("#select-journey7").append(
          '<option value="' +
            keyfield +
            '">' +
            keyfield.charAt(0).toUpperCase() +
            keyfield.slice(1) +
            "</option>"
        );
        $("#select-journey8").append(
          '<option value="' +
            keyfield +
            '">' +
            keyfield.charAt(0).toUpperCase() +
            keyfield.slice(1) +
            "</option>"
        );
        $("#select-journey9").append(
          '<option value="' +
            keyfield +
            '">' +
            keyfield.charAt(0).toUpperCase() +
            keyfield.slice(1) +
            "</option>"
        );
        $("#select-journey10").append(
          '<option value="' +
            keyfield +
            '">' +
            keyfield.charAt(0).toUpperCase() +
            keyfield.slice(1) +
            "</option>"
        );
        $("#select-journey11").append(
          '<option value="' +
            keyfield +
            '">' +
            keyfield.charAt(0).toUpperCase() +
            keyfield.slice(1) +
            "</option>"
        );
      }
    }
  }

  function onGetEndpoints(endpoints) {
    // Response: endpoints = { restHost: <url> } i.e. "rest.s1.qa1.exacttarget.com"
    //console.log(endpoints);
  }

  function onClickedNext() {
    var selectOption = getIntegrationType("#select-01");
    var messageOption = getIntegrationType("#Action-01");
    if (messageOption == "Message" && currentStep.key === "step1") {
      var keyFieldArr = [];
      for (var x in DataExtFields["schema"]) {
        eventDefKey = DataExtFields["schema"][x].key.substr(
          0,
          DataExtFields["schema"][x].key.lastIndexOf(".")
        );
        var keyfield = DataExtFields["schema"][x].key.split(".").pop();

        if (keyfield != "endDate") {
          keyFieldArr.push(
            keyfield.charAt(0).toUpperCase() + keyfield.slice(1)
          );
        }
      }
      $("#textarea-id-02").val(keyFieldArr.toString());
      $("#textarea-id-02").prop("disabled", true);
      $("#select-journey5").prop("disabled", true);
      $("#select-journey6").prop("disabled", true);
      $("#select-journey7").prop("disabled", true);
      $("#select-journey8").prop("disabled", true);
      $("#select-journey9").prop("disabled", true);
      $("#select-journey10").prop("disabled", true);
      $("#select-journey11").prop("disabled", true);
      $("#select-hearsay5").prop("disabled", true);
      $("#select-hearsay6").prop("disabled", true);
      $("#select-hearsay7").prop("disabled", true);
      $("#select-hearsay8").prop("disabled", true);
      $("#select-hearsay9").prop("disabled", true);
      $("#select-hearsay10").prop("disabled", true);
      $("#select-hearsay11").prop("disabled", true);
    }

    if (currentStep.key === "step4") {
      save();
    }
    //builtDeFields();
    else if (currentStep.key === "step1" && selectOption == "CurrentJourney") {
      var input = $("#text-input-id-1")[0];
      var validityState_object = input.validity;
      if (validityState_object.valueMissing) {
        input.setCustomValidity("Must enter your template name!");
        input.reportValidity();
        showStep(null, 1);
        connection.trigger("ready");
      } else {
        builtDeFields();
        connection.trigger("nextStep");
      }
    } else if (currentStep.key === "step3") {
      hearsayfields = {};

      var messageBody = {
        messageBody: $("#textarea-id-01").val(),
      };
      var messageOption = getIntegrationType("#Action-01");
      if (messageOption == "Message") {
        hearsayfields["parameters"] = messageBody;
      }
      var keyData = {};
      keyData["Template Name"] = $("#text-input-id-1").val().toString();
      dynTemplate["keys"] = keyData;
      var valData = {};
      if (
        getIntegrationName("#select-journey1") == "--Select--" ||
        getIntegrationName("#select-journey2") == "--Select--" ||
        getIntegrationName("#select-journey3") == "--Select--" ||
        getIntegrationName("#select-journey4") == "--Select--"
      ) {
        $("#error-msg").show();
        showStep(null, 3);
        connection.trigger("ready");
      } else {
        $("#error-msg").hide();

        if (getIntegrationName("#select-journey1") != "--Select--") {
          hearsayfields[getInputValue("#hearsay-input-id-1", "")] =
            getIntegrationType("#select-journey1");
          inArgumentList[getInputValue("#hearsay-input-id-1", "dataset")] =
            getIntegrationType("#select-journey1");
          valData["Hearsay Org ID"] = getIntegrationType("#select-journey1");
        }
        if (getIntegrationName("#select-journey2") != "--Select--") {
          hearsayfields[getInputValue("#hearsay-input-id-2", "")] =
            getIntegrationType("#select-journey2");
          inArgumentList[getInputValue("#hearsay-input-id-2", "dataset")] =
            getIntegrationType("#select-journey2");
          valData["Hearsay User Reference ID"] =
            getIntegrationType("#select-journey2");
        }
        if (getIntegrationName("#select-journey3") != "--Select--") {
          hearsayfields[getInputValue("#hearsay-input-id-3", "")] =
            getIntegrationType("#select-journey3");
          inArgumentList[getInputValue("#hearsay-input-id-3", "dataset")] =
            getIntegrationType("#select-journey3");
          valData["Customer Unique ID"] =
            getIntegrationType("#select-journey3");
        }
        if (getIntegrationName("#select-journey4") != "--Select--") {
          hearsayfields[getInputValue("#hearsay-input-id-4", "")] =
            getIntegrationType("#select-journey4");
          inArgumentList[getInputValue("#hearsay-input-id-4", "dataset")] =
            getIntegrationType("#select-journey4");
          valData["Name"] = getIntegrationType("#select-journey4");
        }
        if (getIntegrationName("#select-journey5") != "--Select--") {
          hearsayfields[getInputValue("#hearsay-input-id-5", "")] =
            getIntegrationType("#select-journey5");
          inArgumentList[getInputValue("#hearsay-input-id-5", "dataset")] =
            getIntegrationType("#select-journey5");
          valData["Phone"] = getIntegrationType("#select-journey5");
        }
        if (
          getIntegrationName("#select-journey6") != "--Select--" &&
          getIntegrationName("#select-hearsay6") != "--Select--"
        ) {
          hearsayfields[getIntegrationName("#select-hearsay6")] =
            getIntegrationType("#select-journey6");
          inArgumentList[getIntegrationType("#select-hearsay6")] =
            getIntegrationType("#select-journey6");
          valData["Option 1"] = getIntegrationType("#select-hearsay6");
        }
        if (
          getIntegrationName("#select-journey7") != "--Select--" &&
          getIntegrationName("#select-hearsay7") != "--Select--"
        ) {
          hearsayfields[getIntegrationName("#select-hearsay7")] =
            getIntegrationType("#select-journey7");
          inArgumentList[getIntegrationType("#select-hearsay7")] =
            getIntegrationType("#select-journey7");
          valData["Option 2"] = getIntegrationType("#select-hearsay7");
        }
        if (
          getIntegrationName("#select-journey8") != "--Select--" &&
          getIntegrationName("#select-hearsay8") != "--Select--"
        ) {
          hearsayfields[getIntegrationName("#select-hearsay8")] =
            getIntegrationType("#select-journey8");
          inArgumentList[getIntegrationType("#select-hearsay8")] =
            getIntegrationType("#select-journey8");
          valData["Option 3"] = getIntegrationType("#select-hearsay8");
        }
        if (
          getIntegrationName("#select-journey9") != "--Select--" &&
          getIntegrationName("#select-hearsay9") != "--Select--"
        ) {
          hearsayfields[getIntegrationName("#select-hearsay9")] =
            getIntegrationType("#select-journey9");
          inArgumentList[getIntegrationType("#select-hearsay9")] =
            getIntegrationType("#select-journey9");
          valData["Option 4"] = getIntegrationType("#select-hearsay9");
        }
        if (
          getIntegrationName("#select-journey10") != "--Select--" &&
          getIntegrationName("#select-hearsay10") != "--Select--"
        ) {
          hearsayfields[getIntegrationName("#select-hearsay10")] =
            getIntegrationType("#select-journey10");
          inArgumentList[getIntegrationType("#select-hearsay10")] =
            getIntegrationType("#select-journey10");
          valData["Option 5"] = getIntegrationType("#select-hearsay10");
        }
        if (
          getIntegrationName("#select-journey11") != "--Select--" &&
          getIntegrationName("#select-hearsay11") != "--Select--"
        ) {
          hearsayfields[getIntegrationName("#select-hearsay11")] =
            getIntegrationType("#select-journey11");
          inArgumentList[getIntegrationType("#select-hearsay11")] =
            getIntegrationType("#select-journey11");
          valData["Option 6"] = getIntegrationType("#select-hearsay11");
        }

        dynTemplate["values"] = valData;
        var div_data = "";
        for (var key in hearsayfields) {
          if (key == "parameters") {
            var val = hearsayfields[key].messageBody;
            div_data += "<li>" + "Message Body " + " : " + val + "</li>";
          } else if (hearsayfields.hasOwnProperty(key)) {
            var val = hearsayfields[key];
            div_data += "<li>" + key + " : " + val + "</li>";
          }
        }
        $("#intTypeValues").html(div_data);
        connection.trigger("nextStep");
      }
    } else if (currentStep.key === "step2") {
      var splittedMsg = $("#textarea-id-01").val().split(" ");
      var textMsg = "";
      for (var i = 0; i < splittedMsg.length; i++) {
        if (splittedMsg[i].includes("%%,")) {
          var firstName =
            splittedMsg[i].substr(
              splittedMsg[i].indexOf("%%"),
              splittedMsg[i].lastIndexOf("%%")
            ) + '"}},';
          //'{{'+eventDefKey+'.\"' +fieldName+ '\"}}';

          firstName = firstName.replace("%%", "{{" + eventDefKey + '."');
          textMsg += firstName + " ";
        } else if (splittedMsg[i].includes("%%.")) {
          var firstName =
            splittedMsg[i].substr(
              splittedMsg[i].indexOf("%%"),
              splittedMsg[i].lastIndexOf("%%")
            ) + '"}}.';
          firstName = firstName.replace("%%", "{{" + eventDefKey + '."');
          textMsg += firstName + " ";
        } else if (splittedMsg[i].includes("%%")) {
          var secondName =
            splittedMsg[i].substr(
              splittedMsg[i].indexOf("%%"),
              splittedMsg[i].lastIndexOf("%%")
            ) + '"}}';
          secondName = secondName.replace("%%", "{{" + eventDefKey + '."');
          textMsg += secondName + " ";
        } else {
          textMsg += splittedMsg[i] + " ";
        }
      }
      msgText = {
        messageBody: textMsg,
      };
      //hearsayfields["parameters"] = msgText;
      connection.trigger("nextStep");
    } else if (
      currentStep.key === "step1" &&
      selectOption != "CurrentJourney"
    ) {
      var div_data = "";
      inArgumentList = {};
      const templateName = { DEName: selectOption };
      fetch("/dataextension/row/", {
        method: "POST",
        body: JSON.stringify({
          DEName: selectOption,
          token: authToken,
        }),
      })
        .then((response) => response.text())
        .then((dataValue) => {
          console.log("Retrive template Success:", dataValue);
          for (var x in JSON.parse(dataValue)) {
            for (var y in JSON.parse(dataValue)[x]["Properties"][0][
              "Property"
            ]) {
              var NameValue =
                JSON.parse(dataValue)[x]["Properties"][0]["Property"][y][
                  "Name"
                ].toString();
              var DataValue =
                JSON.parse(dataValue)[x]["Properties"][0]["Property"][y][
                  "Value"
                ].toString();
              if (DataValue) {
                inArgumentList[NameValue] = DataValue;
              }
            }
          }

          for (var key in inArgumentList) {
            if (inArgumentList.hasOwnProperty(key)) {
              var val = inArgumentList[key];
              //div_data += "<li>" + key + " : " + val + "</li>";
              $("#select-journey1").append(
                '<option value="' +
                  val +
                  '">' +
                  key.charAt(0).toUpperCase() +
                  key.slice(1) +
                  "</option>"
              );
              $("#select-journey2").append(
                '<option value="' +
                  val +
                  '">' +
                  key.charAt(0).toUpperCase() +
                  key.slice(1) +
                  "</option>"
              );
              $("#select-journey3").append(
                '<option value="' +
                  val +
                  '">' +
                  key.charAt(0).toUpperCase() +
                  key.slice(1) +
                  "</option>"
              );
              $("#select-journey4").append(
                '<option value="' +
                  val +
                  '">' +
                  key.charAt(0).toUpperCase() +
                  key.slice(1) +
                  "</option>"
              );
              $("#select-journey5").append(
                '<option value="' +
                  val +
                  '">' +
                  key.charAt(0).toUpperCase() +
                  key.slice(1) +
                  "</option>"
              );
              $("#select-journey6").append(
                '<option value="' +
                  val +
                  '">' +
                  key.charAt(0).toUpperCase() +
                  key.slice(1) +
                  "</option>"
              );
              $("#select-journey7").append(
                '<option value="' +
                  val +
                  '">' +
                  key.charAt(0).toUpperCase() +
                  key.slice(1) +
                  "</option>"
              );
              $("#select-journey8").append(
                '<option value="' +
                  val +
                  '">' +
                  key.charAt(0).toUpperCase() +
                  key.slice(1) +
                  "</option>"
              );
              $("#select-journey9").append(
                '<option value="' +
                  val +
                  '">' +
                  key.charAt(0).toUpperCase() +
                  key.slice(1) +
                  "</option>"
              );
              $("#select-journey10").append(
                '<option value="' +
                  val +
                  '">' +
                  key.charAt(0).toUpperCase() +
                  key.slice(1) +
                  "</option>"
              );
              $("#select-journey11").append(
                '<option value="' +
                  val +
                  '">' +
                  key.charAt(0).toUpperCase() +
                  key.slice(1) +
                  "</option>"
              );
            }
          }
          //$("#DELabel").html("<b>TEMPLATE SELECTED : " + selectOption + "</b>");
          //$("#intTypeValues").html(div_data);
          connection.trigger("nextStep");
        })
        .catch((error) => {
          console.log("Retrive template error:", error);
          showStep(null, 1);
        });
    }
  }

  function onClickedBack() {
    $("#error-msg").hide();
    if (payload) {
      var intTypeValue = payload.metaData.selectedOption;
      if (intTypeValue) {
        $("#select-01 option")
          .filter(function () {
            return this.text == intTypeValue;
          })
          .attr("selected", true);
      }
      if (currentStep.key === "step3") {
        for (var i = 1; i <= 11; i++) {
          $("#select-journey" + i)
            .find("option")
            .remove()
            .end()
            .append('<option value="">--Select--</option>');
        }
      } else if (currentStep.key === "step2") {
        //textarea-id-02
        $("#textarea-id-02").val("");
        $("#select-journey5").prop("disabled", false);
        $("#select-journey6").prop("disabled", false);
        $("#select-journey7").prop("disabled", false);
        $("#select-journey8").prop("disabled", false);
        $("#select-journey9").prop("disabled", false);
        $("#select-journey10").prop("disabled", false);
        $("#select-journey11").prop("disabled", false);
        $("#select-hearsay5").prop("disabled", false);
        $("#select-hearsay6").prop("disabled", false);
        $("#select-hearsay7").prop("disabled", false);
        $("#select-hearsay8").prop("disabled", false);
        $("#select-hearsay9").prop("disabled", false);
        $("#select-hearsay10").prop("disabled", false);
        $("#select-hearsay11").prop("disabled", false);
      }
    }
    connection.trigger("prevStep");
  }

  function onGotoStep(step) {
    showStep(step);
    connection.trigger("ready");
  }

  function showStep(step, stepIndex) {
    if (stepIndex && !step) {
      step = steps[stepIndex - 1];
    }

    currentStep = step;

    $(".step").hide();

    switch (currentStep.key) {
      case "step1":
        $("#step1").show();
        connection.trigger("updateButton", {
          button: "next",
          enabled: Boolean(getIntegrationType("#select-01")),
        });
        connection.trigger("updateButton", {
          button: "back",
          visible: false,
        });
        break;
      case "step2":
        $("#step2").show();
        connection.trigger("updateButton", {
          button: "back",
          visible: true,
        });
        connection.trigger("updateButton", {
          button: "next",
          text: "next",
          visible: true,
        });

        break;
      case "step3":
        $("#step3").show();
        connection.trigger("updateButton", {
          button: "back",
          visible: true,
        });
        connection.trigger("updateButton", {
          button: "next",
          text: "next",
          visible: true,
        });
        break;
      case "step4":
        $("#step4").show();
        connection.trigger("updateButton", {
          button: "back",
          visible: true,
        });
        connection.trigger("updateButton", {
          button: "next",
          text: "Done",
          visible: true,
        });
    }
  }

  function save() {
    var name = getIntegrationType("#select-01");
    var inputValue;
    
    if (name == "CurrentJourney") {
      inputValue = $("#text-input-id-1").val().toString();
      
      for (var fieldKey in inArgumentList) {
         inArgumentList[fieldKey] = "{{" + eventDefKey + '."' + inArgumentList[fieldKey].toString() + '"}}';
      }

      insertDERecord(dynTemplate);
    } else {
      inputValue = name;
    }

    payload.name = inputValue;
    inArgumentList["parameters"] = msgText;
    payload["arguments"].execute.inArguments = [
      { hearsayfields: inArgumentList },
    ];

    payload["metaData"].isConfigured = true;
    payload.metaData["selectedOption"] = name;
    payload.metaData["hearsayData"] = hearsayfields;

    connection.trigger("updateActivity", payload);
  }

  function createDataExtension(subFieldData, fieldListData, deName) {
    let soapMessage =
      '<?xml version="1.0" encoding="UTF-8"?>' +
      '<s:Envelope xmlns:s="http://www.w3.org/2003/05/soap-envelope" xmlns:a="http://schemas.xmlsoap.org/ws/2004/08/addressing" xmlns:u="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd">' +
      "    <s:Header>" +
      '        <a:Action s:mustUnderstand="1">Create</a:Action>' +
      '        <a:To s:mustUnderstand="1">{process.env.mcEndpoint}/Service.asmx</a:To>' +
      '        <fueloauth xmlns="http://exacttarget.com">' +
      authToken +
      "</fueloauth>" +
      "    </s:Header>" +
      '    <s:Body xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">' +
      '        <CreateRequest xmlns="http://exacttarget.com/wsdl/partnerAPI">' +
      '<Objects xsi:type="DataExtension">' +
      "<CategoryID>cateID</CategoryID>" +
      "<CustomerKey>" +
      deName +
      "</CustomerKey>" +
      "<Name>" +
      deName +
      "</Name>" +
      "<IsSendable>true</IsSendable>" +
      subFieldData +
      "<SendableSubscriberField>" +
      "    <Name>Subscriber Key</Name>" +
      "    <Value></Value>" +
      "</SendableSubscriberField>" +
      "<Fields>" +
      fieldListData +
      "</Fields>" +
      "</Objects>" +
      "        </CreateRequest>" +
      "    </s:Body>" +
      "</s:Envelope>";

    fetch("/create/dextension/", {
      method: "POST",
      body: JSON.stringify({
        name: deName,
        token: authToken,
        xmlData: soapMessage,
      }),
    })
      .then((response) => response.text())
      .then((dataValue) => {
        console.log("Create DE Success: ", dataValue);
      })
      .catch((error) => {
        console.log("Create DE error: ", error);
      });
  }

  function insertDERecord(recordData) {
    fetch("/insert/derow/", {
      method: "POST",
      body: JSON.stringify({
        token: authToken,
        xmlData: recordData,
      }),
    })
      .then((response) => response.text())
      .then((dataValue) => {
        console.log("Record Creation Success: ", dataValue);
      })
      .catch((error) => {
        console.log("Record Creation Error:", error);
      });
    //createDataExtension(subfieldName, fieldLstString, inputVal);
  }

  function getInputValue(elementID, valueType) {
    return valueType == "dataset"
      ? $(elementID)[0].dataset.id.trim()
      : $(elementID).val().trim();
  }

  function getIntegrationType(elementID) {
    return $(elementID).find("option:selected").attr("value").trim();
  }

  function getIntegrationName(elementID) {
    return $(elementID).find("option:selected").html();
  }
});
