var tap = require('tap');
var test = tap.test;
var config = require('./config.js');
var aws = require('../index.js')(config.accessKey, config.secretAccessKey);
var _ = require('lodash');

test('Basic describe calls', function(t){
	t.test('Requesting a list of currently running instances', function(t){
		var filters = [];
		aws.getInstances(filters,function(err, response){
			t.notOk(err, err || 'Retrieved list of instances without an error');
			t.end();
		})
	});
	t.end();
});

//These tests launch actual amazon instances which cost money to run, use them wisely.
//if your tests fail double check and make sure they didn't leave any instance running


test('Launching AMIs', function(t){
	var instanceId,
		instance;
	t.test('Launching a single AMI', function(t){
		var options = {
			'numToLaunch':1,
			'ami':config.ami,
			'awsZone':config.awsZone,
			'instanceType':config.instanceType,
			'securityGroupIds':config.securityGroupIds
		};
		aws.launchOnDemandInstances(options,function(err,response){
			if(err){
				t.bailout(err);
			}
			instanceId = response[0].InstanceId;
			t.ok(instanceId, 'Launch request response contains an instanceId');
			pollInstanceState(instanceId,['pending','running'],function(){
				t.end();
			});
		});
	});
	t.test('New instance should be in the list of running instances', function(t){
		var filters = [],
			instances = [];
		for (var i = 0; i < config.securityGroupIds.length; i++) {
			filters[i] = {Name:'group-id',Values:[config.securityGroupIds[i]]};
		}
		aws.getInstances(filters, function (err, response) {
			t.notOk(err,err || 'Retrieved list of running instances without an error');
			for (var i = 0; i < response.length; i++) {
				instances.push(response[i].InstanceId);
			}
			t.ok(instances,'list of running instances is not empty');
			t.ok(_.contains(instances,instanceId),'Instance list contains the instance we just launched');
			t.end();
		});
	});
	t.test('Requesting an instance based on Id', function(t){
		aws.getInstanceDescriptionFromId(instanceId,function(err,response){
			instance = response;
			t.equal(instance.InstanceId,instanceId,'Request instance by id and got back the correct instance');
			t.end();
		});
	});
	t.test('Verify instance launched in the correct zone', function(t){
		t.equal(instance.Placement.AvailabilityZone,config.awsZone,'Instance zone should match config');
		t.end();
	});
	t.test('Verify instance launched in the correct groups',function(t){
		var instanceGroups = _.pluck(instance.SecurityGroups,'GroupId');
		var configGroups = config.securityGroupIds;
		t.deepEqual(instanceGroups,configGroups,'Instance security groups should match the groups in the config');
		t.end();
	});
	t.test('Terminate the instance', function(t){
		aws.terminateEc2Instance(instanceId,function(err,response){
			t.notOk(err,err || 'Issued termination request without an error');
			pollInstanceState(instanceId,['shutting-down','terminated'],function(){
				t.end();
			});
		});
	});
	t.end();
});

test('Spot requests', function(t){
	var spotRequestId;
	t.test('Issuing a spot request', function(t){
		var options = {
			'numToLaunch':1,
			'ami':config.ami,
			'awsZone':config.awsZone,
			'instanceType':config.instanceType,
			'securityGroupIds':config.securityGroupIds,
			'spotPrice':config.spotPrice,
			'type':'one-time'
		};
		aws.launchSpotInstances(options, function (err, response) {
			t.notOk(err,err);
			spotRequestId = response.SpotInstanceRequestId;
			t.ok(spotRequestId,'you get back an ID');
			t.end();
		});
	});
	t.test('Cancelling a spot request',function(t){
		aws.cancelSpotRequest(spotRequestId,function(err,response){
			t.notOk(err,err || 'no error received');
			t.end();
		});
	});
	t.test('Verify request was cancelled',function(t){
		aws.describeSpotInstanceRequest(spotRequestId,function(err,response){
			t.equal(response.State,'cancelled');
			t.end();
		});
	});
	t.end();
});

function pollInstanceState(instanceId,desiredStates,cb){
	var intervalId = setInterval(function(){
		aws.getInstanceDescriptionFromId(instanceId,function(err,response){
			if(err){
				clearInterval(intervalId);
				cb(err);
			}
			else {
				var instanceState = response.instanceState.name;
				if(_.contains(desiredStates,instanceState) ){
					clearInterval(intervalId);
					cb();
				}
			}
		});
	},1000);
}