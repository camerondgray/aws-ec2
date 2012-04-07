# aws-ec2

  A small library for launching, describing, and terminating aws ec2 instance

## Installation

    $ npm install aws-ec2

## Usage


```js
var aws = require('../index.js')(myAccessKey, mySecretAccessKey);

var instanceId;
var options = {
                'ami':myAMI,
	            'awsZone':'us-east-1a,
	            'instanceType':'t1-micro,
			    'securityGroups':["Production", "Web"]
		    };
aws.launchOnDemandInstances(1, options, function (err, response) {
instanceId = response.item.instanceId;

```

## Methods

### launchOnDemandInstances(numberToLaunch, opts, callback)
Launch one or more on demand instances.
ami, awsZone, and instanceType are required. The other options can be found [here](http://docs.amazonwebservices.com/AWSEC2/latest/APIReference/ApiReference-query-RunInstances.html)

Receive a call back with ```callback(error,response)``` where the response is a [RunningInstanceItemType](http://docs.amazonwebservices.com/AWSEC2/latest/APIReference/ApiReference-ItemType-RunningInstancesItemType.html)

### launchSpotInstances(numberToLaunch, opts, callback)
### getInstanceDescriptionFromPrivateIp(privateIp, callback)
### getInstanceDescriptionFromId(instanceId, callback)
### describeSpotInstanceRequest(requestId, callback)
### terminateEc2Instance(instanceId, callback)
### cancelSpotRequest(requestId, callback)



## Running tests
### WARNING the integration tests will launch and terminate actual instances on EC2 which will cost you money!!
  Install dev deps:

    $ npm install -d

  Edit /test/testConfig.json to include your actual awsKey and awsSecretKey and the options you want to use for testing
  ```js
  {
      "accessKey":"yourAccessKey",
      "secretAccessKey":"yourSecretAccessKey",
      "awsZone":"us-east-1a",
      "instanceType":"t1.micro",
      "securityGroups":["Group1", "Group2"],
      "ami":"youAmi",
      "spotPrice":0.001
  }
  ```

  Run the unit tests:

    $ make test

  Run the integration tests:
  Again, will launch and terminate actual instances
    $ make test-integration

## License

MIT