# aws-ec2

  A small library for launching, describing, and terminating Amazon Web Services (AWS) EC2 instances

## Installation

    $ npm install aws-ec2

## Usage


```js
var aws = require('aws-ec2')(myAccessKey, mySecretAccessKey);

var instanceId;
var options = {
                'numToLaunch':1,
                'ami':'myAMI',
	            'awsZone':'us-east-1a',
	            'instanceType':'t1-micro',
			    'securityGroups':["Production", "Web"]
		    };
aws.launchOnDemandInstances(options, function (err, response) {
        instanceId = response.item.instanceId;
    });

```

## Methods

### launchOnDemandInstances(params, callback)
Launch one or more on demand instances.
ami, awsZone, and instanceType are required. The other options can be found [here](http://docs.amazonwebservices.com/AWSEC2/latest/APIReference/ApiReference-query-RunInstances.html)

Receive a callback with ```callback(error,response)``` where the response is a [RunningInstanceItemType](http://docs.amazonwebservices.com/AWSEC2/latest/APIReference/ApiReference-ItemType-RunningInstancesItemType.html)

### launchSpotInstances(params, callback)
Launch one ore more spot instances. Spot instances are reserved based on a maximum price bid for each instance. See [AWS Spot Instances](http://aws.amazon.com/ec2/spot-instances/) for more info on this cheaper alternative.
ami, awsZone, and instanceType are required.

Receive a callback with ```callback(error,response)```.

### getInstanceDescriptionFromPrivateIp(privateIp, callback)
### getInstanceDescriptionFromId(instanceId, callback)
### describeSpotInstanceRequest(requestId, callback)
### terminateEc2Instance(instanceId, callback)
### cancelSpotRequest(requestId, callback)



## Running tests
### WARNING the integration tests will launch and terminate actual instances on EC2 which will cost you $$$!!
  Install dev deps:

    $ npm install -d

  Edit /test/testConfig.json to include your actual awsKey and awsSecretKey and the options you want to use for testing

```js
  {
      'accessKey':'yourAccessKey',
      'secretAccessKey':'yourSecretAccessKey',
      'awsZone':'us-east-1a',
      'instanceType':'t1.micro',
      'securityGroups':["YourSecurityGroup1", "YourSecurityGroup2"],
      'ami':'ami-yourAmi',
      'spotPrice':0.001
  }
```

  Run the integration tests:
  Again, will launch and terminate actual instances

    $ make test-integration

## License

MIT