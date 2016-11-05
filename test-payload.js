module.exports = function(path, method) {
  path = path || '/';
  method = method || 'GET';
  return {
    "resource": "/{proxy+}",
    "path": path,
    "httpMethod": method,
    "headers": {
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      "Accept-Encoding": "gzip, deflate, sdch, br",
      "Accept-Language": "en-US,en;q=0.8,es;q=0.6,it;q=0.4",
      "Cache-Control": "max-age=0",
      "CloudFront-Forwarded-Proto": "https",
      "CloudFront-Is-Desktop-Viewer": "true",
      "CloudFront-Is-Mobile-Viewer": "false",
      "CloudFront-Is-SmartTV-Viewer": "false",
      "CloudFront-Is-Tablet-Viewer": "false",
      "CloudFront-Viewer-Country": "IT",
      "Cookie": "xxx=cookie",
      "Host": "xxxxxxxxxx.execute-api.eu-west-1.amazonaws.com",
      "Upgrade-Insecure-Requests": "1",
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/53.0.2785.143 Safari/537.36",
      "Via": "1.1 66666666666666666666666666666666666.cloudfront.net (CloudFront)",
      "X-Amz-Cf-Id": "66666666666666_666666666666666666_x_6666666666666666666",
      "X-Forwarded-For": "66.66.66.66, 205.251.208.12",
      "X-Forwarded-Port": "443",
      "X-Forwarded-Proto": "https"
    },
    "queryStringParameters": null,
    "pathParameters": {
      "proxy": "test/xxxxx"
    },
    "stageVariables": null,
    "requestContext": {
      "accountId": "666666666666",
      "resourceId": "rrrrrr",
      "stage": "prod",
      "requestId": "cead6d99-9560-11e6-9d3a-dbcbabbee3bb",
      "identity": {
        "cognitoIdentityPoolId": null,
        "accountId": null,
        "cognitoIdentityId": null,
        "caller": null,
        "apiKey": null,
        "sourceIp": "66.66.66.66",
        "cognitoAuthenticationType": null,
        "cognitoAuthenticationProvider": null,
        "userArn": null,
        "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/53.0.2785.143 Safari/537.36",
        "user": null
      },
      "resourcePath": "/{proxy+}",
      "httpMethod": "GET",
      "apiId": "xxxxxxxxxx"
    },
    "body": null
  }
};
