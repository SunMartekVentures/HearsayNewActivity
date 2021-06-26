"use strict";
var util = require("util");

// Deps
const Path = require("path");
const JWT = require(Path.join(__dirname, "..", "lib", "jwtDecoder.js"));
var util = require("util");
var http = require("https");
var axios = require("axios");
const jwt = require("jsonwebtoken");

exports.logExecuteData = [];

function logData(req) {
  exports.logExecuteData.push({
    body: req.body,
    headers: req.headers,
    trailers: req.trailers,
    method: req.method,
    url: req.url,
    params: req.params,
    query: req.query,
    route: req.route,
    cookies: req.cookies,
    ip: req.ip,
    path: req.path,
    host: req.host,
    fresh: req.fresh,
    stale: req.stale,
    protocol: req.protocol,
    secure: req.secure,
    originalUrl: req.originalUrl,
  });
  console.log("body: " + util.inspect(req.body));
  console.log("headers: " + req.headers);
  console.log("trailers: " + req.trailers);
  console.log("method: " + req.method);
  console.log("url: " + req.url);
  console.log("params: " + util.inspect(req.params));
  console.log("query: " + util.inspect(req.query));
  console.log("route: " + req.route);
  console.log("cookies: " + req.cookies);
  console.log("ip: " + req.ip);
  console.log("path: " + req.path);
  console.log("host: " + req.host);
  console.log("fresh: " + req.fresh);
  console.log("stale: " + req.stale);
  console.log("protocol: " + req.protocol);
  console.log("secure: " + req.secure);
  console.log("originalUrl: " + req.originalUrl);
}

/*
 * POST Handler for / route of Activity (this is the edit route).
 */
exports.edit = function (req, res) {
  // Data from the req and put it in an array accessible to the main app.
  //console.log( req.body );
  logData(req);
  res.send(200, "Edit");
};

/*
 * POST Handler for /save/ route of Activity.
 */
exports.save = function (req, res) {
  // Data from the req and put it in an array accessible to the main app.
  //console.log( req.body );
  logData(req);
  res.send(200, "Save");
};

/*
 * POST Handler for /execute/ route of Activity.
 */
exports.execute = function (req, res) {
  // example on how to decode JWT
  JWT(req.body, process.env.jwtSecret, (err, decoded) => {
    // verification error -> unauthorized request
    if (err) {
      console.error(err);
      return res.status(401).end();
    }

    if (decoded && decoded.inArguments && decoded.inArguments.length > 0) {
      console.log("Decoded ::: " + JSON.stringify(decoded));

      let argument_data = `{"inArguments":${decoded.inArguments}}`;
      console.log("argument_data ==> " + JSON.stringify(argument_data));
      
      var signOptions = {
        algorithm: "HS256",
      };

      var token = jwt.sign(argument_data, process.env.jwtPrivateKey, signOptions);
      console.log("Token : " + token);

      // decoded in arguments

      var decodedArgs = decoded.inArguments[0].hearsayfields.parameters;
      console.log("arguments values are " + JSON.stringify(decodedArgs));
      if (decodedArgs) {
        hearsayPost(token, "send-text-message");
      } else {
        hearsayPost(token, "start-lead-management");
      }
      logData(req);
      res.send(200, "Execute");
    } else {
      console.error("inArguments invalid.");
      return res.status(400).end();
    }
  });
};

function hearsayPost(payload, actionType) {
  var config = {
    method: "post",
    url: process.env.hearsayEndpoint + actionType,
    headers: {
      "Content-Type": "application/json",
      "X-Auth-Token": process.env.XAuthToken,
    },
    data: payload,
  };

  axios(config)
    .then(function (response) {
      console.log("Accepted:::");
    })
    .catch(function (error) {
      console.log("Hearsay post error for " + actionType + " ::: " + error);
    });
}

/*
 * POST Handler for /publish/ route of Activity.
 */
exports.publish = function (req, res) {
  // Data from the req and put it in an array accessible to the main app.
  //console.log( req.body );
  logData(req);
  res.send(200, "Publish");
};

/*
 * Creating Static Data Extension Template Handler for / route of Activity (this is executed when Custom Activity opening).
 */
exports.staticDataExtension = function (req, res) {
  //console.log('request DEName is '+JSON.stringify(req.body));
  var xml2js = require("xml2js");

  let soapMessage =
    '<?xml version="1.0" encoding="UTF-8"?>' +
    '<s:Envelope xmlns:s="http://www.w3.org/2003/05/soap-envelope" xmlns:a="http://schemas.xmlsoap.org/ws/2004/08/addressing" xmlns:u="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd">' +
    "    <s:Header>" +
    '        <a:Action s:mustUnderstand="1">Retrieve</a:Action>' +
    '        <a:To s:mustUnderstand="1">https://' +
    process.env.mcEndpoint +
    ".soap.marketingcloudapis.com/Service.asmx</a:To>" +
    '        <fueloauth xmlns="http://exacttarget.com">' +
    req.body.token +
    "</fueloauth>" +
    "    </s:Header>" +
    '    <s:Body xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">' +
    '        <RetrieveRequestMsg xmlns="http://exacttarget.com/wsdl/partnerAPI">' +
    "            <RetrieveRequest>" +
    "                <ObjectType>DataExtension</ObjectType>" +
    "                <Properties>ObjectID</Properties>" +
    "                <Properties>CustomerKey</Properties>" +
    "                <Properties>Name</Properties>" +
    "                <Properties>IsSendable</Properties>" +
    "                <Properties>SendableSubscriberField.Name</Properties>" +
    '                <Filter xsi:type="SimpleFilterPart">' +
    "                    <Property>CustomerKey</Property>" +
    "                    <SimpleOperator>equals</SimpleOperator>" +
    "                    <Value>Data_Extension_Template</Value>" +
    "                </Filter>" +
    "            </RetrieveRequest>" +
    "        </RetrieveRequestMsg>" +
    "    </s:Body>" +
    "</s:Envelope>";

  var dataconfig = {
    method: "post",
    url:
      "https://" +
      process.env.mcEndpoint +
      ".soap.marketingcloudapis.com/Service.asmx",
    headers: {
      "Content-Type": "text/xml",
    },
    data: soapMessage,
  };

  axios(dataconfig)
    .then(function (response) {
      let rawdata = response.data;
      var soapMsg = "";
      var parser = new xml2js.Parser();
      let resultData;
      parser.parseString(rawdata, function (err, result) {
        //console.log('result static body'+JSON.stringify(result['soap:Envelope']['soap:Body'][0]['RetrieveResponseMsg'][0]['Results']));
        resultData =
          result["soap:Envelope"]["soap:Body"][0]["RetrieveResponseMsg"][0][
            "Results"
          ];
      });

      if (!resultData) {
        soapMsg =
          '<?xml version="1.0" encoding="UTF-8"?>' +
          '<s:Envelope xmlns:s="http://www.w3.org/2003/05/soap-envelope" xmlns:a="http://schemas.xmlsoap.org/ws/2004/08/addressing" xmlns:u="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd">' +
          "    <s:Header>" +
          '        <a:Action s:mustUnderstand="1">Create</a:Action>' +
          '        <a:To s:mustUnderstand="1">https://' +
          process.env.mcEndpoint +
          ".soap.marketingcloudapis.com/Service.asmx</a:To>" +
          '        <fueloauth xmlns="http://exacttarget.com">' +
          req.body.token +
          "</fueloauth>" +
          "    </s:Header>" +
          '    <s:Body xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">' +
          '        <CreateRequest xmlns="http://exacttarget.com/wsdl/partnerAPI">' +
          '<Objects xsi:type="DataExtension">' +
          "<CategoryID>" +
          req.body.catID +
          "</CategoryID>" +
          "<CustomerKey>Data_Extension_Template</CustomerKey>" +
          "<Name>Data Extension Template</Name>" +
          "<IsSendable>true</IsSendable>" +
          "<SendableDataExtensionField>" +
          "    <CustomerKey>Template Name</CustomerKey>" +
          "    <Name>Template Name</Name>" +
          "    <FieldType>Text</FieldType>" +
          "</SendableDataExtensionField>" +
          "<SendableSubscriberField>" +
          "    <Name>Subscriber Key</Name>" +
          "    <Value></Value>" +
          "</SendableSubscriberField>" +
          "<Fields>" +
          "<Field>" +
          "<CustomerKey>Template Name</CustomerKey>" +
          "<Name>Template Name</Name>" +
          "<FieldType>Text</FieldType>" +
          "<MaxLength>50</MaxLength>" +
          "<IsRequired>true</IsRequired>" +
          "<IsPrimaryKey>true</IsPrimaryKey>" +
          "</Field>" +
          "<Field>" +
          "<CustomerKey>Hearsay Org ID</CustomerKey>" +
          "<Name>Hearsay Org ID</Name>" +
          "<FieldType>Text</FieldType>" +
          "<MaxLength>50</MaxLength>" +
          "<IsRequired>true</IsRequired>" +
          "<IsPrimaryKey>false</IsPrimaryKey>" +
          "</Field>" +
          "<Field>" +
          "<CustomerKey>Hearsay User Reference ID</CustomerKey>" +
          "<Name>Hearsay User Reference ID</Name>" +
          "<FieldType>Text</FieldType>" +
          "<MaxLength>50</MaxLength>" +
          "<IsRequired>true</IsRequired>" +
          "<IsPrimaryKey>false</IsPrimaryKey>" +
          "</Field>" +
          "<Field>" +
          "<CustomerKey>Customer Unique ID</CustomerKey>" +
          "<Name>Customer Unique ID</Name>" +
          "<FieldType>Text</FieldType>" +
          "<MaxLength>50</MaxLength>" +
          "<IsRequired>true</IsRequired>" +
          "<IsPrimaryKey>false</IsPrimaryKey>" +
          "</Field>" +
          "<Field>" +
          "<CustomerKey>Name</CustomerKey>" +
          "<Name>Name</Name>" +
          "<FieldType>Text</FieldType>" +
          "<MaxLength>50</MaxLength>" +
          "<IsRequired>true</IsRequired>" +
          "<IsPrimaryKey>false</IsPrimaryKey>" +
          "</Field>" +
          "<Field>" +
          "<CustomerKey>Phone</CustomerKey>" +
          "<Name>Phone</Name>" +
          "<FieldType>Text</FieldType>" +
          "<IsRequired>true</IsRequired>" +
          "<IsPrimaryKey>false</IsPrimaryKey>" +
          "</Field>" +
          "<Field>" +
          "<CustomerKey>Option 1</CustomerKey>" +
          "<Name>Option 1</Name>" +
          "<FieldType>Text</FieldType>" +
          "<MaxLength>50</MaxLength>" +
          "<IsRequired>false</IsRequired>" +
          "<IsPrimaryKey>false</IsPrimaryKey>" +
          "</Field>" +
          "<Field>" +
          "<CustomerKey>Option 2</CustomerKey>" +
          "<Name>Option 2</Name>" +
          "<FieldType>Text</FieldType>" +
          "<MaxLength>50</MaxLength>" +
          "<IsRequired>false</IsRequired>" +
          "<IsPrimaryKey>false</IsPrimaryKey>" +
          "</Field>" +
          "<Field>" +
          "<CustomerKey>Option 3</CustomerKey>" +
          "<Name>Option 3</Name>" +
          "<FieldType>Text</FieldType>" +
          "<MaxLength>50</MaxLength>" +
          "<IsRequired>false</IsRequired>" +
          "<IsPrimaryKey>false</IsPrimaryKey>" +
          "</Field>" +
          "<Field>" +
          "<CustomerKey>Option 4</CustomerKey>" +
          "<Name>Option 4</Name>" +
          "<FieldType>Text</FieldType>" +
          "<MaxLength>50</MaxLength>" +
          "<IsRequired>false</IsRequired>" +
          "<IsPrimaryKey>false</IsPrimaryKey>" +
          "</Field>" +
          "<Field>" +
          "<CustomerKey>Option 5</CustomerKey>" +
          "<Name>Option 5</Name>" +
          "<FieldType>Text</FieldType>" +
          "<MaxLength>50</MaxLength>" +
          "<IsRequired>false</IsRequired>" +
          "<IsPrimaryKey>false</IsPrimaryKey>" +
          "</Field>" +
          "<Field>" +
          "<CustomerKey>Option 6</CustomerKey>" +
          "<Name>Option 6</Name>" +
          "<FieldType>Text</FieldType>" +
          "<MaxLength>50</MaxLength>" +
          "<IsRequired>false</IsRequired>" +
          "<IsPrimaryKey>false</IsPrimaryKey>" +
          "</Field>" +
          "<Field>" +
          "<CustomerKey>Option 7</CustomerKey>" +
          "<Name>Option 7</Name>" +
          "<FieldType>Text</FieldType>" +
          "<MaxLength>50</MaxLength>" +
          "<IsRequired>false</IsRequired>" +
          "<IsPrimaryKey>false</IsPrimaryKey>" +
          "</Field>" +
          "<Field>" +
          "<CustomerKey>Option 8</CustomerKey>" +
          "<Name>Option 8</Name>" +
          "<FieldType>Text</FieldType>" +
          "<MaxLength>50</MaxLength>" +
          "<IsRequired>false</IsRequired>" +
          "<IsPrimaryKey>false</IsPrimaryKey>" +
          "</Field>" +
          "<Field>" +
          "<CustomerKey>Option 9</CustomerKey>" +
          "<Name>Option 9</Name>" +
          "<FieldType>Text</FieldType>" +
          "<MaxLength>50</MaxLength>" +
          "<IsRequired>false</IsRequired>" +
          "<IsPrimaryKey>false</IsPrimaryKey>" +
          "</Field>" +
          "</Fields>" +
          "</Objects>" +
          "        </CreateRequest>" +
          "    </s:Body>" +
          "</s:Envelope>";

        var dataconfg = {
          method: "post",
          url:
            "https://" +
            process.env.mcEndpoint +
            ".soap.marketingcloudapis.com/Service.asmx",
          headers: {
            "Content-Type": "text/xml",
          },
          data: soapMsg,
        };

        axios(dataconfg)
          .then(function (response) {
            let rawdata = response.data;

            var parser = new xml2js.Parser();
            parser.parseString(rawdata, function (err, result) {
              //console.log('result res body'+JSON.stringify(result['soap:Envelope']['soap:Body'][0]['CreateResponse'][0]['Results']));
              let resData =
                result["soap:Envelope"]["soap:Body"][0]["CreateResponse"][0][
                  "Results"
                ];
              if (resData) {
                //console.log('StatusCode '+resData[0].StatusCode+'StatusMessage '+resData[0].StatusMessage);
                res
                  .status(200)
                  .send("Data Extension Template " + resData[0].StatusMessage);
              } else {
                res
                  .status(400)
                  .send("Data Extension Template Some thing went wrong!");
              }
            });
          })
          .catch(function (error) {
            console.log("Creating Data Extension Template error " + error);
            res
              .status(500)
              .send(
                "Something went wrong for creating Data Extension Template!!!" +
                  error
              );
          });
      } else {
        res.status(202).send("Already created Data Extension Template");
      }
    })
    .catch(function (error) {
      res
        .status(500)
        .send(
          "Something went wrong for checking Data Extension Template available or not!!!" +
            error
        );
      console.log("Exist Data Extension Template error " + error);
    });
};

/*
 * Creating Static Org Setup DE Handler for / route of Activity (this is executed when Custom Activity opening).
 */
exports.staticOrgDataExtension = function (req, res) {
  var xml2js = require("xml2js");

  let soapMessage =
    '<?xml version="1.0" encoding="UTF-8"?>' +
    '<s:Envelope xmlns:s="http://www.w3.org/2003/05/soap-envelope" xmlns:a="http://schemas.xmlsoap.org/ws/2004/08/addressing" xmlns:u="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd">' +
    "    <s:Header>" +
    '        <a:Action s:mustUnderstand="1">Retrieve</a:Action>' +
    '        <a:To s:mustUnderstand="1">https://' +
    process.env.mcEndpoint +
    ".soap.marketingcloudapis.com/Service.asmx</a:To>" +
    '        <fueloauth xmlns="http://exacttarget.com">' +
    req.body.token +
    "</fueloauth>" +
    "    </s:Header>" +
    '    <s:Body xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">' +
    '        <RetrieveRequestMsg xmlns="http://exacttarget.com/wsdl/partnerAPI">' +
    "            <RetrieveRequest>" +
    "                <ObjectType>DataExtension</ObjectType>" +
    "                <Properties>ObjectID</Properties>" +
    "                <Properties>CustomerKey</Properties>" +
    "                <Properties>Name</Properties>" +
    "                <Properties>IsSendable</Properties>" +
    "                <Properties>SendableSubscriberField.Name</Properties>" +
    '                <Filter xsi:type="SimpleFilterPart">' +
    "                    <Property>CustomerKey</Property>" +
    "                    <SimpleOperator>equals</SimpleOperator>" +
    "                    <Value>Org_Setup</Value>" +
    "                </Filter>" +
    "            </RetrieveRequest>" +
    "        </RetrieveRequestMsg>" +
    "    </s:Body>" +
    "</s:Envelope>";

  var dataconfig = {
    method: "post",
    url:
      "https://" +
      process.env.mcEndpoint +
      ".soap.marketingcloudapis.com/Service.asmx",
    headers: {
      "Content-Type": "text/xml",
    },
    data: soapMessage,
  };

  axios(dataconfig)
    .then(function (response) {
      let rawdata = response.data;
      var soapMsg = "";
      var parser = new xml2js.Parser();
      let resultData;
      parser.parseString(rawdata, function (err, result) {
        resultData =
          result["soap:Envelope"]["soap:Body"][0]["RetrieveResponseMsg"][0][
            "Results"
          ];
      });

      if (!resultData) {
        var OrgMsg =
          '<?xml version="1.0" encoding="UTF-8"?>' +
          '<s:Envelope xmlns:s="http://www.w3.org/2003/05/soap-envelope" xmlns:a="http://schemas.xmlsoap.org/ws/2004/08/addressing" xmlns:u="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd">' +
          "    <s:Header>" +
          '        <a:Action s:mustUnderstand="1">Create</a:Action>' +
          '        <a:To s:mustUnderstand="1">https://' +
          process.env.mcEndpoint +
          ".soap.marketingcloudapis.com/Service.asmx</a:To>" +
          '        <fueloauth xmlns="http://exacttarget.com">' +
          req.body.token +
          "</fueloauth>" +
          "    </s:Header>" +
          '    <s:Body xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">' +
          '        <CreateRequest xmlns="http://exacttarget.com/wsdl/partnerAPI">' +
          '<Objects xsi:type="DataExtension">' +
          "<CategoryID>" +
          req.body.catID +
          "</CategoryID>" +
          "<CustomerKey>Org_Setup</CustomerKey>" +
          "<Name>Org Setup</Name>" +
          "<IsSendable>true</IsSendable>" +
          "<SendableDataExtensionField>" +
          "    <CustomerKey>Hearsay User Reference ID</CustomerKey>" +
          "    <Name>Hearsay User Reference ID</Name>" +
          "    <FieldType>Text</FieldType>" +
          "</SendableDataExtensionField>" +
          "<SendableSubscriberField>" +
          "    <Name>Subscriber Key</Name>" +
          "    <Value></Value>" +
          "</SendableSubscriberField>" +
          "<Fields>" +
          "<Field>" +
          "<CustomerKey>Hearsay Org ID</CustomerKey>" +
          "<Name>Hearsay Org ID</Name>" +
          "<FieldType>Text</FieldType>" +
          "<MaxLength>50</MaxLength>" +
          "<IsRequired>true</IsRequired>" +
          "<IsPrimaryKey>false</IsPrimaryKey>" +
          "</Field>" +
          "<Field>" +
          "<CustomerKey>Hearsay User Reference ID</CustomerKey>" +
          "<Name>Hearsay User Reference ID</Name>" +
          "<FieldType>Text</FieldType>" +
          "<MaxLength>50</MaxLength>" +
          "<IsRequired>true</IsRequired>" +
          "<IsPrimaryKey>true</IsPrimaryKey>" +
          "</Field>" +
          "<Field>" +
          "<CustomerKey>Customer Unique ID</CustomerKey>" +
          "<Name>Customer Unique ID</Name>" +
          "<FieldType>Text</FieldType>" +
          "<MaxLength>50</MaxLength>" +
          "<IsRequired>true</IsRequired>" +
          "<IsPrimaryKey>false</IsPrimaryKey>" +
          "</Field>" +
          "<Field>" +
          "<CustomerKey>Created or Modified Date</CustomerKey>" +
          "<Name>Created or Modified Date</Name>" +
          "<FieldType>Date</FieldType>" +
          "<DefaultValue>GetDate()</DefaultValue>" +
          "<IsRequired>true</IsRequired>" +
          "<IsPrimaryKey>false</IsPrimaryKey>" +
          "</Field>" +
          "</Fields>" +
          "</Objects>" +
          "        </CreateRequest>" +
          "    </s:Body>" +
          "</s:Envelope>";

        var dataconfg = {
          method: "post",
          url:
            "https://" +
            process.env.mcEndpoint +
            ".soap.marketingcloudapis.com/Service.asmx",
          headers: {
            "Content-Type": "text/xml",
          },
          data: OrgMsg,
        };

        axios(dataconfg)
          .then(function (response) {
            let rawdata = response.data;

            var parser = new xml2js.Parser();
            parser.parseString(rawdata, function (err, result) {
              let resData =
                result["soap:Envelope"]["soap:Body"][0]["CreateResponse"][0][
                  "Results"
                ];
              if (resData) {
                res.status(200).send("Org Setup " + resData[0].StatusMessage);
              } else {
                res.status(400).send("Org Setup DE some thing went wrong!");
              }
            });
          })
          .catch(function (error) {
            console.log("Org Setup error " + error);
            res
              .status(500)
              .send(
                "Something went wrong for creating the Org Setup DE!!!" + error
              );
          });
      } else {
        res.status(202).send("Already created Org Setup DE");
      }
    })
    .catch(function (error) {
      console.log("Org Setup Extension error " + error);
      res
        .status(500)
        .send(
          "Something went wrong for checking Org Setup available or not!!!" +
            error
        );
    });
};

/*
 * Inserting row into Data Extension Template Handler for / route of Activity (this is executed after Custom Activity saved).
 */
exports.insertDERow = function (req, res) {
  var insData = JSON.stringify([
    { keys: req.body.xmlData.keys, values: req.body.xmlData.values },
  ]);
  var config = {
    method: "post",
    url:
      "https://" +
      process.env.mcEndpoint +
      ".rest.marketingcloudapis.com/hub/v1/dataevents/key:Data_Extension_Template/rowset",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + req.body.token,
    },
    data: insData,
  };

  axios(config)
    .then(function (response) {
      res.status(202).send("Accepted!");
    })
    .catch(function (error) {
      console.log("insert rows error " + error);
      res
        .status(500)
        .send(
          "Something went wrong for inserting row into Data Extension Template!!!" +
            error
        );
    });
};

/*
 * Creating Static Hearsay Integration folder Handler for / route of Activity (this is executed when Custom Activity opening).
 */
exports.createFolder = function (req, res) {
  var xml2js = require("xml2js");

  let soapMessage =
    '<?xml version="1.0" encoding="UTF-8"?>' +
    '<s:Envelope xmlns:s="http://www.w3.org/2003/05/soap-envelope" xmlns:a="http://schemas.xmlsoap.org/ws/2004/08/addressing" xmlns:u="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd">' +
    "    <s:Header>" +
    '        <a:Action s:mustUnderstand="1">Retrieve</a:Action>' +
    '        <a:To s:mustUnderstand="1">https://' +
    process.env.mcEndpoint +
    ".soap.marketingcloudapis.com/Service.asmx</a:To>" +
    '        <fueloauth xmlns="http://exacttarget.com">' +
    req.body.token +
    "</fueloauth>" +
    "    </s:Header>" +
    '    <s:Body xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">' +
    '        <RetrieveRequestMsg xmlns="http://exacttarget.com/wsdl/partnerAPI">' +
    "            <RetrieveRequest>" +
    "                <ObjectType>DataFolder</ObjectType>" +
    "                <Properties>ID</Properties>" +
    "                <Properties>CustomerKey</Properties>" +
    "                <Properties>Name</Properties>" +
    "                <Properties>ParentFolder.ID</Properties>" +
    "                <Properties>ParentFolder.Name</Properties>" +
    '                <Filter xsi:type="SimpleFilterPart">' +
    "                    <Property>Name</Property>" +
    "                    <SimpleOperator>equals</SimpleOperator>" +
    "                    <Value>Hearsay Integrations</Value>" +
    "                </Filter>" +
    "            </RetrieveRequest>" +
    "        </RetrieveRequestMsg>" +
    "    </s:Body>" +
    "</s:Envelope>";

  var dataconfig = {
    method: "post",
    url:
      "https://" +
      process.env.mcEndpoint +
      ".soap.marketingcloudapis.com/Service.asmx",
    headers: {
      "Content-Type": "text/xml",
    },
    data: soapMessage,
  };

  axios(dataconfig)
    .then(function (response) {
      let rawdata = response.data;
      let resData;
      var parser = new xml2js.Parser();
      parser.parseString(rawdata, function (err, result) {
        resData =
          result["soap:Envelope"]["soap:Body"][0]["RetrieveResponseMsg"][0][
            "Results"
          ];
      });

      if (resData) {
        res.status(200).send(resData[0].ID);
      } else {
        let folderData =
          '<?xml version="1.0" encoding="UTF-8"?>' +
          '<s:Envelope xmlns:s="http://www.w3.org/2003/05/soap-envelope" xmlns:a="http://schemas.xmlsoap.org/ws/2004/08/addressing" xmlns:u="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd">' +
          "    <s:Header>" +
          '        <a:Action s:mustUnderstand="1">Retrieve</a:Action>' +
          '        <a:To s:mustUnderstand="1">https://' +
          process.env.mcEndpoint +
          ".soap.marketingcloudapis.com/Service.asmx</a:To>" +
          '        <fueloauth xmlns="http://exacttarget.com">' +
          req.body.token +
          "</fueloauth>" +
          "    </s:Header>" +
          '    <s:Body xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">' +
          '        <RetrieveRequestMsg xmlns="http://exacttarget.com/wsdl/partnerAPI">' +
          "            <RetrieveRequest>" +
          "                <ObjectType>DataFolder</ObjectType>" +
          "                <Properties>ID</Properties>" +
          "                <Properties>CustomerKey</Properties>" +
          "                <Properties>Name</Properties>" +
          "                <Properties>ParentFolder.ID</Properties>" +
          "                <Properties>ParentFolder.Name</Properties>" +
          '                <Filter xsi:type="SimpleFilterPart">' +
          "                    <Property>Name</Property>" +
          "                    <SimpleOperator>equals</SimpleOperator>" +
          "                    <Value>Data Extensions</Value>" +
          "                </Filter>" +
          "            </RetrieveRequest>" +
          "        </RetrieveRequestMsg>" +
          "    </s:Body>" +
          "</s:Envelope>";

        var configData = {
          method: "post",
          url:
            "https://" +
            process.env.mcEndpoint +
            ".soap.marketingcloudapis.com/Service.asmx",
          headers: {
            "Content-Type": "text/xml",
          },
          data: folderData,
        };

        axios(configData)
          .then(function (response) {
            let rawdata1 = response.data;
            let parentData;
            var parser = new xml2js.Parser();
            parser.parseString(rawdata1, function (err, result) {
              parentData =
                result["soap:Envelope"]["soap:Body"][0][
                  "RetrieveResponseMsg"
                ][0]["Results"];
            });

            if (parentData) {
              let createFolderData =
                '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">' +
                "<soapenv:Header>" +
                "<fueloauth>" +
                req.body.token +
                "</fueloauth>" +
                "</soapenv:Header>" +
                "<soapenv:Body>" +
                '<CreateRequest xmlns="http://exacttarget.com/wsdl/partnerAPI">' +
                "<Options/>" +
                '<ns1:Objects xmlns:ns1="http://exacttarget.com/wsdl/partnerAPI" xsi:type="ns1:DataFolder">' +
                '<ns1:ModifiedDate xsi:nil="true"/>' +
                '<ns1:ObjectID xsi:nil="true"/>' +
                "<ns1:CustomerKey>Hearsay Integrations</ns1:CustomerKey>" +
                "<ns1:ParentFolder>" +
                '<ns1:ModifiedDate xsi:nil="true"/>' +
                "<ns1:ID>" +
                parentData[0]["ID"] +
                "</ns1:ID>" +
                '<ns1:ObjectID xsi:nil="true"/>' +
                "</ns1:ParentFolder>" +
                "<ns1:Name>Hearsay Integrations</ns1:Name>" +
                "<ns1:Description>Hearsay Integrations Folder</ns1:Description>" +
                "<ns1:ContentType>dataextension</ns1:ContentType>" +
                "<ns1:IsActive>true</ns1:IsActive>" +
                "<ns1:IsEditable>true</ns1:IsEditable>" +
                "<ns1:AllowChildren>true</ns1:AllowChildren>" +
                "</ns1:Objects>" +
                "</CreateRequest>" +
                "</soapenv:Body>" +
                "</soapenv:Envelope>";

              var folderConfig = {
                method: "post",
                url:
                  "https://" +
                  process.env.mcEndpoint +
                  ".soap.marketingcloudapis.com/Service.asmx",
                headers: {
                  "Content-Type": "text/xml",
                  SOAPAction: "Create",
                },
                data: createFolderData,
              };

              axios(folderConfig)
                .then(function (response) {
                  let rawdata2 = response.data;
                  let resultData;
                  var parser = new xml2js.Parser();
                  parser.parseString(rawdata2, function (err, result) {
                    resultData =
                      result["soap:Envelope"]["soap:Body"][0][
                        "CreateResponse"
                      ][0]["Results"];
                  });

                  if (resultData) {
                    res.status(200).send(resultData[0].NewID);
                  } else {
                    res.status(400).send("Some thing went wrong!");
                  }
                })
                .catch(function (error) {
                  console.log("Creating Hearsay Integration error " + error);
                  res
                    .status(500)
                    .send(
                      "Something went wrong for creating Hearsay Integration folder!!!" +
                        error
                    );
                });
            }
          })
          .catch(function (error) {
            console.log("Data Extension parent folder ID error :" + error);
            res
              .status(500)
              .send(
                "Something went wrong for getting Data Extension parent folder ID!!!" +
                  error
              );
          });
      }
    })
    .catch(function (error) {
      console.log("Hearsay Integration retrieve error " + error);
      res
        .status(500)
        .send(
          "Something went wrong for getting Hearsay Integration folder ID!!!" +
            error
        );
    });
};

/*
 * Creating Dynamic Data Extension into Hearsay Integration folder Handler for / route of Activity (this is executed once Custom Activity saved).
 */
exports.createDExtension = function (req, res) {
  var xml2js = require("xml2js");

  let soapMessage =
    '<?xml version="1.0" encoding="UTF-8"?>' +
    '<s:Envelope xmlns:s="http://www.w3.org/2003/05/soap-envelope" xmlns:a="http://schemas.xmlsoap.org/ws/2004/08/addressing" xmlns:u="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd">' +
    "    <s:Header>" +
    '        <a:Action s:mustUnderstand="1">Retrieve</a:Action>' +
    '        <a:To s:mustUnderstand="1">https://' +
    process.env.mcEndpoint +
    ".soap.marketingcloudapis.com/Service.asmx</a:To>" +
    '        <fueloauth xmlns="http://exacttarget.com">' +
    req.body.token +
    "</fueloauth>" +
    "    </s:Header>" +
    '    <s:Body xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">' +
    '        <RetrieveRequestMsg xmlns="http://exacttarget.com/wsdl/partnerAPI">' +
    "            <RetrieveRequest>" +
    "                <ObjectType>DataFolder</ObjectType>" +
    "                <Properties>ID</Properties>" +
    "                <Properties>CustomerKey</Properties>" +
    "                <Properties>Name</Properties>" +
    "                <Properties>ParentFolder.ID</Properties>" +
    "                <Properties>ParentFolder.Name</Properties>" +
    '                <Filter xsi:type="SimpleFilterPart">' +
    "                    <Property>Name</Property>" +
    "                    <SimpleOperator>equals</SimpleOperator>" +
    "                    <Value>Hearsay Integrations</Value>" +
    "                </Filter>" +
    "            </RetrieveRequest>" +
    "        </RetrieveRequestMsg>" +
    "    </s:Body>" +
    "</s:Envelope>";

  var dataconfig = {
    method: "post",
    url:
      "https://" +
      process.env.mcEndpoint +
      ".soap.marketingcloudapis.com/Service.asmx",
    headers: {
      "Content-Type": "text/xml",
    },
    data: soapMessage,
  };

  axios(dataconfig)
    .then(function (response) {
      let rawdata = response.data;
      var data = "";
      var parser = new xml2js.Parser();

      if (req.body.xmlData)
        data = req.body.xmlData.replace(
          "{process.env.mcEndpoint}",
          "https://" + process.env.mcEndpoint + ".soap.marketingcloudapis.com"
        );
      if (req.body.name)
        data = data
          .replace("DEKey", req.body.name + "Key")
          .replace("DEName", req.body.name);

      parser.parseString(rawdata, function (err, result) {
        //console.log('result res body'+JSON.stringify(result['soap:Envelope']['soap:Body'][0]['RetrieveResponseMsg'][0]['Results']));
        let rawData =
          result["soap:Envelope"]["soap:Body"][0]["RetrieveResponseMsg"][0][
            "Results"
          ];
        if (rawData) {
          let categoryID = rawData[0]["ID"];
          if (categoryID) data = data.replace("cateID", categoryID);
        } else {
          data = data.replace("<CategoryID>cateID</CategoryID>", "");
        }
      });

      var config = {
        method: "post",
        url:
          "https://" +
          process.env.mcEndpoint +
          ".soap.marketingcloudapis.com/Service.asmx",
        headers: {
          "Content-Type": "text/xml",
        },
        data: data,
      };

      axios(config)
        .then(function (response) {
          let rawdata = response.data;

          var parser = new xml2js.Parser();
          parser.parseString(rawdata, function (err, result) {
            let resData =
              result["soap:Envelope"]["soap:Body"][0]["CreateResponse"][0][
                "Results"
              ];
            if (resData) {
              res.status(200).send(resData[0].StatusMessage);
            } else {
              res.status(400).send("Some thing went wrong!");
            }
          });
        })
        .catch(function (error) {
          res
            .status(500)
            .send(
              "Something went wrong for getting Hearsay Integration folder ID!!!" +
                error
            );
          console.log("Dynamic DE while creating " + error);
        });
    })
    .catch(function (error) {
      res
        .status(500)
        .send(
          "Something went wrong for getting Hearsay Integration folder ID!!!" +
            error
        );
      console.log("Dynamic DE while creating " + error);
    });
};

/*
 * Retrieve specific from static Data Extension Template Handler for / route of Activity (this is executed when the user has selected the existing template then click next).
 */
exports.DERow = function (req, res) {
  var templateName = req.body.DEName;
  var authToken = req.body.token;
  var xml2js = require("xml2js");

  let soapMessage =
    '<?xml version="1.0" encoding="UTF-8"?>' +
    '<s:Envelope xmlns:s="http://www.w3.org/2003/05/soap-envelope" xmlns:a="http://schemas.xmlsoap.org/ws/2004/08/addressing" xmlns:u="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd">' +
    "    <s:Header>" +
    '        <a:Action s:mustUnderstand="1">Retrieve</a:Action>' +
    '        <a:To s:mustUnderstand="1">https://' +
    process.env.mcEndpoint +
    ".soap.marketingcloudapis.com/Service.asmx</a:To>" +
    '        <fueloauth xmlns="http://exacttarget.com">' +
    authToken +
    "</fueloauth>" +
    "    </s:Header>" +
    '    <s:Body xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">' +
    '        <RetrieveRequestMsg xmlns="http://exacttarget.com/wsdl/partnerAPI">' +
    "            <RetrieveRequest>" +
    "                <ObjectType>DataExtensionObject[Data Extension Template]</ObjectType>" +
    "                  <Properties>Hearsay Org ID</Properties>" +
    "                  <Properties>Hearsay User Reference ID</Properties>" +
    "                  <Properties>Customer Unique ID</Properties>" +
    "                  <Properties>Hearsay User Reference ID</Properties>" +
    "                  <Properties>Name</Properties>" +
    "                  <Properties>Phone</Properties>" +
    "                  <Properties>Option 1</Properties>" +
    "                  <Properties>Option 2</Properties>" +
    "                  <Properties>Option 3</Properties>" +
    "                  <Properties>Option 4</Properties>" +
    "                  <Properties>Option 5</Properties>" +
    "                  <Properties>Option 6</Properties>" +
    "                  <Properties>Option 7</Properties>" +
    "                  <Properties>Option 8</Properties>" +
    "                  <Properties>Option 9</Properties>" +
    '                <Filter xsi:type="SimpleFilterPart">' +
    "                  <Property>Template Name</Property>" +
    "                  <SimpleOperator>equals</SimpleOperator>" +
    "                  <Value>" +
    templateName +
    "</Value>" +
    "                </Filter>" +
    "            </RetrieveRequest>" +
    "        </RetrieveRequestMsg>" +
    "    </s:Body>" +
    "</s:Envelope>";

  var configs = {
    method: "post",
    url:
      "https://" +
      process.env.mcEndpoint +
      ".soap.marketingcloudapis.com/Service.asmx",
    headers: {
      "Content-Type": "text/xml",
    },
    data: soapMessage,
  };

  axios(configs)
    .then(function (response) {
      var parser = new xml2js.Parser();
      parser.parseString(response.data, function (err, result) {
        let rawData =
          result["soap:Envelope"]["soap:Body"][0]["RetrieveResponseMsg"][0][
            "Results"
          ];
        if (rawData) {
          res.status(200).send(rawData);
        } else {
          let arrList = [];
          res.status(301).send(arrList);
        }
      });
    })
    .catch(function (error) {
      res
        .status(500)
        .send(
          "Something went wrong for retrieving Data Extension Template rows!!!" +
            error
        );
      console.log("Retrieving DE Template rows error " + error);
    });
};

/*
 * Retrieve all rows from Data Extension Template Handler for / route of Activity (this is executed when Custom Activity opening).
 */
exports.retrieveDERows = function (req, res) {
  var xml2js = require("xml2js");
  var authToken = req.body.token;

  let soapMessage =
    '<?xml version="1.0" encoding="UTF-8"?>' +
    '<s:Envelope xmlns:s="http://www.w3.org/2003/05/soap-envelope" xmlns:a="http://schemas.xmlsoap.org/ws/2004/08/addressing" xmlns:u="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd">' +
    "    <s:Header>" +
    '        <a:Action s:mustUnderstand="1">Retrieve</a:Action>' +
    '        <a:To s:mustUnderstand="1">https://' +
    process.env.mcEndpoint +
    ".soap.marketingcloudapis.com/Service.asmx</a:To>" +
    '        <fueloauth xmlns="http://exacttarget.com">' +
    authToken +
    "</fueloauth>" +
    "    </s:Header>" +
    '    <s:Body xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">' +
    '        <RetrieveRequestMsg xmlns="http://exacttarget.com/wsdl/partnerAPI">' +
    "            <RetrieveRequest>" +
    "                <ObjectType>DataExtensionObject[Data Extension Template]</ObjectType>" +
    "      <Properties>Template Name</Properties>" +
    "        <Properties>Hearsay Org ID</Properties>" +
    "        <Properties>Hearsay User Reference ID</Properties>" +
    "            </RetrieveRequest>" +
    "        </RetrieveRequestMsg>" +
    "    </s:Body>" +
    "</s:Envelope>";

  var configs = {
    method: "post",
    url:
      "https://" +
      process.env.mcEndpoint +
      ".soap.marketingcloudapis.com/Service.asmx",
    headers: {
      "Content-Type": "text/xml",
    },
    data: soapMessage,
  };

  axios(configs)
    .then(function (response) {
      let rawdata = response.data;

      var parser = new xml2js.Parser();
      parser.parseString(rawdata, function (err, result) {
        let rawData =
          result["soap:Envelope"]["soap:Body"][0]["RetrieveResponseMsg"][0][
            "Results"
          ];
        if (rawData) {
          res.status(200).send(rawData);
        } else {
          let empList = [];
          res.status(301).send(empList);
        }
      });
    })
    .catch(function (error) {
      res
        .status(500)
        .send(
          "Something went wrong for retrieving rows from Data Extension Template!!!" +
            error
        );
      console.log("Retrieving all rows error " + error);
    });
};

/*
 * POST Handler for /validate/ route of Activity.
 */
exports.validate = function (req, res) {
  // Data from the req and put it in an array accessible to the main app.
  //console.log( req.body );
  logData(req);
  res.send(200, "Validate");
};
