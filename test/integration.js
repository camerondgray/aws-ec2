var config = require('./config.js'),
    aws = require('../index.js')(config.accessKey, config.secretAccessKey);

describe('If I request a list of all my currently running instances', function () {
    it('Should return a valid response', function (done) {
        var filters = {};
        aws.getInstances(filters, function (err, response) {
            done(err);
        });
    });

});

//These tests launch actual amazon instances which cost money to run, use them wisely.
describe('If I issue a request to add a valid ami', function () {
    var instanceId,
        instance;
    it('Should get back a valid response', function (done) {
        var options = {
            'numToLaunch':1,
            'ami':config.ami,
            'awsZone':config.awsZone,
            'instanceType':config.instanceType,
            'securityGroups':config.securityGroups
        };
        aws.launchOnDemandInstances(options, function (err, response) {
            instanceId = response.item.instanceId;
            instanceId.should.not.be.empty;
            done(err);
        });
    });
    describe('If I request a list of all my currently running instances', function () {
        it('Should return a list with at least the instance we just launched in it', function (done) {
            var filters = {},
                instances = [];
            aws.getInstances(filters, function (err, response) {
                for (var i = 0; i < response.length; i++) {
                    instances.push(response[i].instanceId);
                }
                instances.should.not.be.empty;
                instances.should.include(instanceId);
                done(err);

            });
        });

    });
    describe('If I request a list of all my currently running instances filtered to the security groups in my config', function () {
        it('Should return a list with at least the instance we just launched in it', function (done) {
            var filters = {},
                instances = [];
            for (var i = 0; i < config.securityGroups.length; i++) {
                filters['Filter.' + (i + 1) + '.Name'] = 'group-name';
                filters['Filter.' + (i + 1) + '.Value.1'] = config.securityGroups[i];
            }
            aws.getInstances(filters, function (err, response) {
                for (var i = 0; i < response.length; i++) {
                    instances.push(response[i].instanceId);
                }
                instances.should.not.be.empty;
                instances.should.include(instanceId);
                done(err);

            });
        });

    });
    describe('If you request a description of that instance based on Id', function () {
        it('should match the id you got from the launch request', function (done) {
            aws.getInstanceDescriptionFromId(instanceId, function (err, response) {
                instance = response;
                instance.instanceId.should.eql(instanceId);
                done(err);
            })
        })
        it('should show that it launched in the correct zone', function (done) {
            instance.placement.availabilityZone.should.eql(config.awsZone);
            done();
        });
        it('should show that it launched in the correct groups', function (done) {
            var instGroups = instance.groupSet.item;
            var configGroups = config.securityGroups;
            instGroups.length.should.eql(configGroups.length);
            //aws returns the groups in alpha order
            configGroups = configGroups.sort();
            for (var i = 0; i < configGroups.length; i++) {
                configGroups[i].should.eql(instGroups[i].groupName);
            }
            done();
        })
    });
    describe('If you request to terminate the instance I just launched', function () {
        it('should have a new status of shutting down', function (done) {
            aws.terminateEc2Instance(instanceId, function (err, response) {
                done(err);
            });
        });
    });
});


describe('If I issue a request to launch a spot instance', function () {
    var spotRequestId;
    it('should give me back a response containing my requestId', function (done) {
        var options = {
            'numToLaunch':1,
            'ami':config.ami,
            'awsZone':config.awsZone,
            'instanceType':config.instanceType,
            'securityGroups':config.securityGroups,
            'spotPrice':config.spotPrice
        };
        aws.launchSpotInstances(options, function (err, response) {
            spotRequestId = response.spotInstanceRequestId;
            spotRequestId.should.not.be.empty;
            done(err);
        });
    });
    describe('If I issue a request to cancel the request I just made', function () {
        it('Should not return an error', function (done) {
            aws.cancelSpotRequest(spotRequestId, function (err, response) {
                done(err);
            });
        });
    });
    describe('If I then request a description of that same spot request', function () {
        it('Should return a description with a status of cancelled', function (done) {
            aws.describeSpotInstanceRequest(spotRequestId, function (err, response) {
                response.state.should.eql('cancelled');
                done(err);
            })
        })
    })
});

