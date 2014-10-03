var AWS = require('aws-sdk');


function processInstanceDescription(err, data, callback) {
	if(err){
		callback(err,data);
		return;
	}
	var reservations = data.Reservations;
    var instances = reservations[0].Instances;

	if(instances.length !=1){
		callback('No instances found or more than one instance found - ' + err,data);
		return;
	}
	callback(err,instances[0]);
}

	var EC2 = new AWS.EC2();
module.exports = function (awsKey, awsSecretKey, awsRegion = 'us-east-1') {
        AWS.config.update({accessKeyId: awsKey, secretAccessKey: awsSecretKey, region: awsRegion});
    function launchOnDemandInstances(params, callback) {
        var options = {
            'ImageId':params.ami,
            'MinCount':1,
            'MaxCount':params.numToLaunch,
            'Placement':{AvailabilityZone:params.awsZone},
            'InstanceType':params.instanceType,
	        'SecurityGroupIds':params.securityGroupIds
        }
	    //For VPC we need to specify a subnetId
	    if(params.subnetId){
		    options.SubnetId = params.subnetId;
	    }
	    EC2.runInstances(options,function(err,data){
		    if(!data){
			    err = 'Failure launching instance(s): ' + err;
		    }
		    else{
			    data = data.Instances;
		    }
		    callback(err,data);
	    });
    }

    function launchSpotInstances(params, callback) {
        var options = {
            'SpotPrice':params.spotPrice,
            'InstanceCount':params.numToLaunch,
            'LaunchSpecification':{
	            'ImageId':params.ami,
		        'InstanceType':params.instanceType,
		        'Placement':{'AvailabilityZone':params.awsZone},
	            'SecurityGroupIds':params.securityGroupIds
            },
	        'Type':params.type
        }
	    //For VPC we need to specify a subnetId
	    if(params.subnetId){
		    options.LaunchSpecification.SubnetId = params.subnetId;
	    }
	    EC2.requestSpotInstances(options,function(err,data){
			if (err) {
				err = 'Failed to issue spot instance request \n ' + err;
			}
			else {
				data = data.SpotInstanceRequests[0];
				if (data.state === 'cancelled' || data.state === 'failed') {
					err = ' error issue spot instance request fault code is: ' + data.code + ' - ' +  data.message;
				}
			}
			callback(err,data);
		});
    }

    function getInstances(filters, callback) {
	    EC2.describeInstances({Filters:filters},function(err,data){
		    if(err){
			    callback(err);
			    return;
		    }
		    var reservations = data.Reservations;
		    if(err || reservations.length<1){
			    err = 'No instances found:  '+ err;
			    callback(err,data);
			    return;
		    }
		    var instances = [];
		    for (var i=0;i<reservations.length;i++){
			    var instancesSet = reservations[i].Instances;
			    if (instancesSet instanceof Array) {
				    instances = instances.concat(instancesSet);
			    }
			    else {
				    instances.push(instancesSet);
			    }
		    }
		    callback(err,instances);
	    });
    }

    function getInstanceDescriptionFromPrivateIp(privateIp, callback) {
	    var filters = {
		    Filters:[{Name:'private-ip-address',Values:[privateIp]}]
	    }
	    EC2.describeInstances(filters,function(err,data){
		   processInstanceDescription(err,data,callback);
	    });
    }

    function getInstanceDescriptionFromId(instanceId, callback) {
	    EC2.describeInstances({InstanceIds:[instanceId]},function(err,data){
		    processInstanceDescription(err,data,callback);
	    });
    }

    function describeSpotInstanceRequest(requestId, callback) {
	    EC2.describeSpotInstanceRequests({SpotInstanceRequestIds:[requestId]},function(err,data){
		   if(!data.SpotInstanceRequests){
			   callback('no spot request found: ' + err,data);
			   return;
		   }
		   data = data.SpotInstanceRequests[0];
		   callback(err,data);
	    });
    }

    function terminateEc2Instance(instanceId, callback) {
	    EC2.terminateInstances({InstanceIds:[instanceId]},function(err,data){
		    if(err){
			    callback(err,data);
			    return;
		    }
		    if(data.TerminatingInstances[0].InstanceId != instanceId || data.TerminatingInstances[0].CurrentState.Name != 'shutting-down'){
			    err = 'Error terminating instance: ' + err + ' ' + data;
		    }
		    callback(err,data);
	    });
    }

    function cancelSpotRequest(requestId, callback) {
	    EC2.cancelSpotInstanceRequests({SpotInstanceRequestIds:[requestId]},function(err,data){
		   if(err || data.CancelledSpotInstanceRequests.length<1){
			   err = 'Failed to cancel spot request: ' + requestId + ' ' + err + ' ' + data;
		   }
		   else{
			   data = data.CancelledSpotInstanceRequests[0];
		   }
		   callback(err,data);
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



