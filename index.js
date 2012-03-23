var aws = require('aws-lib');

module.exports = function (awsKey, awsSecretKey) {
	var ec2 = aws.createEC2Client(awsKey, awsSecretKey);
	//the api version that this library defaults to is ancient and doesn't support things like tagging
	//so let's specify a more recent version
	ec2.version = '2011-12-15';


	function launchOnDemandInstance(numberToLaunch, opts, callback) {
		var options = {
			'ImageId':opts.ami,
			'MinCount':1,
			'MaxCount':numberToLaunch,
			'Placement.AvailabilityZone':opts.awsZone,
			'InstanceType':opts.instanceType
		};
		//specify the security groups to launch in
		for (var i = 0; i < opts.securityGroups.length; i++) {
			options['SecurityGroup.' + (i + 1)] = config.securityGroups[i];
		}
		ec2.call('RunInstances', options, function (result) {
			//Parse the response
			callback(result);
		});

	}

	function terminateEc2Instance(instanceId, callback) {
		ec2.call('TerminateInstances', {'InstanceId.1':instanceId}, function (response) {
			var result;
			try {
				result = response.instancesSet.item.currentState.name;
			}
			catch (err) {
				error = 'Failure terminating instance' + instanceId + '\n'
					+ 'response was: ' + response;
				callback(false, error)
			}
			if (result == 'shutting-down') {
				callback(true, null);
			}
			else {
				callback(false, response);
			}

		});
	}

	function getInstanceDescriptionFromPrivateIp(privateIp, callback) {
		ec2.call('DescribeInstances', {'Filter.1.Name':'private-ip-address', 'Filter.1.Value':privateIp}, function (result) {
			var instance = result.reservationSet.item.instancesSet.item;
			callback(instance);
		});
	}

	function getInstDescriptionFromId(instanceId, callback) {
		ec2.call('DescribeInstances', {'Filter.1.Name':'instance-id', 'Filter.1.Value':instanceId}, function (result) {
			callback(result);
		});
	}

	//TODO: finish this so it actually works
	function launchSpotInstance(numberToLaunch, opts, callback) {
		var options = {
			'SpotPrice':opts.spotPrice,
			'InstanceCount':numberToLaunch,
			'Type':'one-time'
		}
		ec2.call('LaunchSpotInstances', {options}, function (result) {
			callback(result);
		});

	}

	return {
		launchOnDemandInstance:launchOnDemandInstance,
		launchSpotInstance:launchSpotInstance,
		getInstanceDescriptionFromPrivateIp:getInstanceDescriptionFromPrivateIp,
		getInstDescriptionFromId:getInstDescriptionFromId,
		terminateEc2Instance:terminateEc2Instance
	}


}



