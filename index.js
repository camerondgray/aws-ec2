var aws = require('aws-lib');

function processInstanceDescription(err, response, callback) {
    var instance;
    try {
        instance = response.reservationSet.item.instancesSet.item;
    }
    catch (e) {
        err = 'Could not find instance:  ' + err;
        instance = response;
    }
    callback(err, instance);
}

module.exports = function (awsKey, awsSecretKey) {
    var ec2 = aws.createEC2Client(awsKey, awsSecretKey);

    function launchOnDemandInstances(params, callback) {
        var options = {
            'ImageId':params.ami,
            'MinCount':1,
            'MaxCount':params.numToLaunch,
            'Placement.AvailabilityZone':params.awsZone,
            'InstanceType':params.instanceType
        };
        //specify the security groups to launch in
        for (var i = 0; i < params.securityGroups.length; i++) {
            options['SecurityGroup.' + (i + 1)] = params.securityGroups[i];
        }
        ec2.call('RunInstances', options, function (err, response) {
            //make sure we have an instance set in the response and return that

            if (!response.instancesSet) {
                err = 'Failure launching instance(s): ' + err;
            }
            else {
                response = response.instancesSet;
            }

            callback(err, response);
        });

    }

    function launchSpotInstances(params, callback) {
        var options = {
            'SpotPrice':params.spotPrice,
            'InstanceCount':params.numToLaunch,
            'LaunchSpecification.ImageId':params.ami,
            'LaunchSpecification.InstanceType':params.instanceType,
            'LaunchSpecification.Placement.AvailabilityZone':params.awsZone
        };
        //specify the security groups to launch in
        for (var i = 0; i < params.securityGroups.length; i++) {
            options['LaunchSpecification.SecurityGroup.' + (i + 1)] = params.securityGroups[i];
        }

        ec2.call('RequestSpotInstances', options, function (err, response) {
            //make sure we have a valid state and return the response
            if (!response.spotInstanceRequestSet) {
                err = 'Failed to issue spot instance request \n ' + err;
            }
            else {
                response = response.spotInstanceRequestSet.item;
                if (response.state === 'cancelled' || response.state === 'failed') {
                    err = ' error issue spot instance request fault code is: ' + response.fault;
                }
            }
            callback(err, response);
        });

    }

    function getInstances(filters, callback) {
        ec2.call('DescribeInstances', filters, function (err, response) {
            var instances = [],
                reservationSet;
            try {
                reservationSet = response.reservationSet.item;
                for (var i = 0; i < reservationSet.length; i++) {
                    var instancesSet = reservationSet[i].instancesSet.item;
                    if (instancesSet instanceof Array) {
                        instances = instances.concat(instancesSet);
                    }
                    else {
                        instances.push(instancesSet);
                    }

                }
            }
            catch (e) {
                err = 'No instances found:  ' + e + ' - ' + err;
                instances = response;
            }
            callback(err, instances);
        });
    }

    function getInstanceDescriptionFromPrivateIp(privateIp, callback) {
        ec2.call('DescribeInstances', {'Filter.1.Name':'private-ip-address', 'Filter.1.Value':privateIp}, function (err, response) {
            processInstanceDescription(err, response, callback);
        });
    }

    function getInstanceDescriptionFromId(instanceId, callback) {
        ec2.call('DescribeInstances', {'Filter.1.Name':'instance-id', 'Filter.1.Value':instanceId}, function (err, response) {
            processInstanceDescription(err, response, callback);
        });
    }


    function describeSpotInstanceRequest(requestId, callback) {
        ec2.call('DescribeSpotInstanceRequests', {'Filter.1.Name':'spot-instance-request-id', 'Filter.1.Value':requestId}, function (err, response) {

            if (!response.spotInstanceRequestSet) {
                err = ' Failed to find spot instance request: ' + requestId + ' ' + err;
            }
            else {
                response = response.spotInstanceRequestSet.item;
            }
            callback(err, response);
        });
    }

    function terminateEc2Instance(instanceId, callback) {
        ec2.call('TerminateInstances', {'InstanceId.1':instanceId}, function (err, response) {

            var result;
            try {
                result = response.instancesSet.item.currentState.name;
            }
            catch (e) {
                err = 'Failure terminating instance: ' + instanceId + ' ' + err;
            }
            if (!err && result !== 'shutting-down') {
                err = 'Instance is not terminating ';
            }
            callback(err, response);

        });
    }

    function cancelSpotRequest(requestId, callback) {
        ec2.call('CancelSpotInstanceRequests', {'SpotInstanceRequestId.1':requestId}, function (err, response) {
            if (!response.spotInstanceRequestSet) {
                err = 'Failed to cancel spot request: ' + requestId + ' ' + err;
            }
            else {
                response = response.spotInstanceRequestSet.item;
            }
            callback(err, response);
        });
    }

    return {
        launchOnDemandInstances:launchOnDemandInstances,
        launchSpotInstances:launchSpotInstances,
        getInstanceDescriptionFromPrivateIp:getInstanceDescriptionFromPrivateIp,
        getInstanceDescriptionFromId:getInstanceDescriptionFromId,
        getInstances:getInstances,
        describeSpotInstanceRequest:describeSpotInstanceRequest,
        terminateEc2Instance:terminateEc2Instance,
        cancelSpotRequest:cancelSpotRequest
    };
};



