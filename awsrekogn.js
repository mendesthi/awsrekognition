/* AWS Rekognition module to run analysis on given picture */
/* AWS Server Configuration, User Credentials and other parameters set in environment variables */

/** Environment Variables Required:
 *
 * AWS_POOLID           - AWS Cognito Identity Pool ID
 * AWS_USERPOOLID       - AWS User Pool Id
 * AWS_CLIENTID         - AWS Client ID
 * AWS_USERNAME         - AWS Cognito User Name goes here
 * AWS_PASSWORD         - AWS Cognito Password goes here
 * */

//AWS Cognito
const AmazonCognitoIdentity = require("amazon-cognito-identity-js");
const AWS = require("aws-sdk");
global.fetch = require("node-fetch");

const poolData = {
  UserPoolId: process.env.AWS_USERPOOLID, //Your AWS User Pool Id goes here
  ClientId: process.env.AWS_CLIENTID // Your AWS Client ID goes here
};

const userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);

AWS.config.update({ region: "eu-west-1" });
AWS.config.credentials = new AWS.CognitoIdentityCredentials({
  IdentityPoolId: process.env.AWS_POOLID //Your AWS Cognito Identity Pool ID goes here
});

var authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails({
  Username: process.env.AWS_USERNAME, //Your AWS Cognito User Name goes here
  Password: process.env.AWS_PASSWORD //Your AWS Cognito Password goes here
});

var userData = {
  Username: process.env.AWS_USERNAME, //Your AWS Cognito User Name goes here
  Pool: userPool
};

console.log("Authenticating user on Amazon Cognito");

var cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);
cognitoUser.authenticateUser(authenticationDetails, {
  onSuccess: function(result) {
    console.log("Amazon Cognito authenticated!");
  },
  onFailure: function(err) {
    console.log(err);
  }
});

module.exports = {
  Rekogn: function(imageBase64, response) {
    return ProcessImage(imageBase64, response);
  }
};

//Calls DetectFaces API and shows emotions of detected faces
function DetectFaces(imageBase64, callback) {
  var imageString = imageBase64.toString();
  var newImage = Buffer.alloc(imageString.length, imageBase64, "base64");


  var rekognition = new AWS.Rekognition();
  var params = {
    Image: {
      Bytes: imageBase64
    },
    Attributes: ["ALL"]
  };
  console.log("Detecting faces emotions on Amazon Rekognition");

  rekognition.detectFaces(params, function(err, data) {
    if (err) console.log("Error: " + err, err.stack);
    else {
      if (!data.FaceDetails.length) {
        // err = "Face not found"
        callback(null);
      } else {
        // retrieve the higher graded emotion for each face
        for (var i = 0; i < data.FaceDetails.length; i++) {
          var arr = data.FaceDetails[i].Emotions;
          function getMax(arr, prop) {
            var max;
            for (var k = 0; k < arr.length; k++) {
              if (max == null || parseInt(arr[k][prop]) > parseInt(max[prop]))
                max = arr[k];
            }
            return max;
          }
          var maxConf = getMax(arr, "Confidence");
          console.log(maxConf.Type + " - " + maxConf.Confidence); //E.g.: "Happy - 0.874302"
          var finalRating = 0;
          switch (maxConf.Type) {
            case "ANGRY":
              data.FaceDetails[i].finalRating = 1;
              break;
            case "DISGUSTED":
              data.FaceDetails[i].finalRating = 1;
              break;
            case "FEAR":
              data.FaceDetails[i].finalRating = 2;
              break;
            case "SAD":
              data.FaceDetails[i].finalRating = 2;
              break;
            case "CONFUSED":
              data.FaceDetails[i].finalRating = 3;
              break;
            case "CALM":
              data.FaceDetails[i].finalRating = 4;
              break;
            case "SURPRISED":
              data.FaceDetails[i].finalRating = 5;
              break;
            case "HAPPY":
              data.FaceDetails[i].finalRating = 5;
          }
          //E.g.: "Final Estimated Rating for face number 1: 5 stars"
          console.log(
            "Final Estimated Rating for face number " +
              i +
              ":  " +
              data.FaceDetails[i].finalRating +
              " stars"
          );
          callback(null, data.FaceDetails[i]);
        }
      }
    }
  });
}

function ProcessImage(imageBase64, callback) {
  DetectFaces(imageBase64, callback);
}
