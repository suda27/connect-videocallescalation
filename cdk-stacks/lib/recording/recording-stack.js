"use strict";
// Copyright 2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecordingStack = void 0;
const cdk = require("@aws-cdk/core");
const ec2 = require("@aws-cdk/aws-ec2");
const ecs = require("@aws-cdk/aws-ecs");
const autoscaling = require("@aws-cdk/aws-autoscaling");
const logs = require("@aws-cdk/aws-logs");
const ecr_assets = require("@aws-cdk/aws-ecr-assets");
const path = require("path");
const s3 = require("@aws-cdk/aws-s3");
const events = require("@aws-cdk/aws-events");
const events_targets = require("@aws-cdk/aws-events-targets");
const lambda = require("@aws-cdk/aws-lambda");
const nodeLambda = require("@aws-cdk/aws-lambda-nodejs");
const iam = require("@aws-cdk/aws-iam");
class RecordingStack extends cdk.NestedStack {
    constructor(scope, id, props) {
        var _a, _b, _c, _d, _e;
        super(scope, id, props);
        /** CREATE AN AMAZON VPC FOR THE AMAZON ECS CLUSTER **/
        const recordingVPC = new ec2.Vpc(this, 'RecordingVPC', {
            maxAzs: 2,
            cidr: '10.5.0.0/16',
            subnetConfiguration: [
                {
                    cidrMask: 24,
                    name: `${props.cdkAppName}-private-`,
                    subnetType: ec2.SubnetType.PRIVATE
                },
                {
                    cidrMask: 24,
                    name: `${props.cdkAppName}-public-`,
                    subnetType: ec2.SubnetType.PUBLIC
                },
            ]
        });
        /** CREATE SECURITY GROUPS **/
        const recordingECSSecurityGroup = new ec2.SecurityGroup(this, 'RecordingECSSecurityGroup', {
            securityGroupName: `${props.cdkAppName}-RecordingECSSecurityGroup`,
            vpc: recordingVPC,
            description: `ECS Security Group for ${props.cdkAppName} Recording ECS Cluster`,
            allowAllOutbound: true
        });
        /** CREATE AN ECS CLUSTER **/
        const recordingECSCluster = new ecs.Cluster(this, 'RecordingECSCluster', {
            vpc: recordingVPC,
            clusterName: `${props.cdkAppName}-Recording`,
            containerInsights: true,
        });
        /** CREATE AN AUTOSCALING GROUP FOR ECS CLUSTER INSTANCES **/
        const recordingECSAutoScalingGroup = new autoscaling.AutoScalingGroup(this, "RecordingECSAutoScalingGroup", {
            vpc: recordingVPC,
            securityGroup: recordingECSSecurityGroup,
            allowAllOutbound: true,
            associatePublicIpAddress: false,
            instanceType: ec2.InstanceType.of(ec2.InstanceClass.M5, ec2.InstanceSize.XLARGE2),
            machineImage: ecs.EcsOptimizedImage.amazonLinux2(),
            vpcSubnets: {
                subnetType: ec2.SubnetType.PRIVATE
            },
            minCapacity: 1,
            maxCapacity: 5,
            signals: autoscaling.Signals.waitForMinCapacity({
                timeout: cdk.Duration.minutes(15)
            }),
            updatePolicy: autoscaling.UpdatePolicy.replacingUpdate()
        });
        const recordingECSAutoScalingGroupCFN = recordingECSAutoScalingGroup.node.defaultChild;
        const recordingECSAutoScalingGroupCFNLogicalId = "RecordingECSAutoScalingGroup";
        recordingECSAutoScalingGroupCFN.overrideLogicalId(recordingECSAutoScalingGroupCFNLogicalId); //LOGICAL ID FOR CFN SIGNAL
        recordingECSAutoScalingGroup.addUserData(`#!/bin/bash -xe`, `echo ECS_CLUSTER=${recordingECSCluster.clusterName} >> /etc/ecs/ecs.config`, `echo ECS_IMAGE_PULL_BEHAVIOR=prefer-cached >> /etc/ecs/ecs.config`, `yum install -y aws-cfn-bootstrap`, `/opt/aws/bin/cfn-signal -e $? --stack ${this.stackName} --resource ${recordingECSAutoScalingGroupCFNLogicalId} --region ${this.region}`);
        const recordingECSCapacityProvider = new ecs.AsgCapacityProvider(this, 'RecordingECSCapacityProvider', {
            autoScalingGroup: recordingECSAutoScalingGroup,
            enableManagedScaling: true,
            minimumScalingStepSize: 1,
            maximumScalingStepSize: 2,
            targetCapacityPercent: 60
        });
        recordingECSCluster.addAsgCapacityProvider(recordingECSCapacityProvider);
        /* DEFINE A TASK DEFINITION FOR ECS TASKS RUNNING IN THE CLUSTER */
        const recordingTaskDefinition = new ecs.TaskDefinition(this, "RecordingTaskDefinition", {
            compatibility: ecs.Compatibility.EC2,
            volumes: [{
                    name: "dbus",
                    host: {
                        sourcePath: "/run/dbus/system_bus_socket:/run/dbus/system_bus_socket"
                    }
                }]
        });
        const recordingTaskLogGroup = new logs.LogGroup(this, "RecordingTaskLogGroup", {
            retention: logs.RetentionDays.TWO_MONTHS,
            logGroupName: `${props.cdkAppName}-RecordingTask`,
            removalPolicy: cdk.RemovalPolicy.DESTROY
        });
        // BUILD A DOCKER IMAGE AND UPLOAD IT TO AN ECR REPOSITORY
        const recordingDockerImage = new ecr_assets.DockerImageAsset(this, "RecordingDockerImage", {
            directory: path.join(__dirname, "../../docker/recording")
        });
        recordingDockerImage.repository.grantPull(recordingTaskDefinition.obtainExecutionRole()); //add permissions to pull ecr repository
        // CREATE A TASK DEFINITION
        const recordingContainerName = `${props.cdkAppName}-RecordingContainer`;
        recordingTaskDefinition.addContainer(recordingContainerName, {
            image: ecs.EcrImage.fromRegistry(recordingDockerImage.imageUri),
            cpu: 4096,
            memoryLimitMiB: 8192,
            memoryReservationMiB: 8192,
            linuxParameters: new ecs.LinuxParameters(this, "RecordingTaskLinuxParameters", { sharedMemorySize: 2048 }),
            essential: true,
            logging: ecs.LogDriver.awsLogs({
                logGroup: recordingTaskLogGroup,
                streamPrefix: `${props.cdkAppName}`
            })
        });
        //Amazon S3 bucket to store the call recordings
        const recordingBucket = new s3.Bucket(this, "RecordingBucket", {
            bucketName: `${props.cdkAppName}-RecordingBucket-${this.account}-${this.region}`.toLowerCase(),
            encryption: s3.BucketEncryption.KMS_MANAGED
        });
        recordingBucket.grantReadWrite(recordingTaskDefinition.taskRole);
        //pre-warm task
        const autoscalingEC2InstanceLaunchRule = new events.Rule(this, 'AutoscalingEC2InstanceLaunchRule', {
            description: `Rule triggered by recordingECSAutoScalingGroup when a new EC2 instance is launched`,
            eventPattern: {
                source: ['aws.autoscaling'],
                detailType: ['EC2 Instance Launch Successful'],
                detail: {
                    'AutoScalingGroupName': [recordingECSAutoScalingGroup.autoScalingGroupName]
                }
            }
        });
        const startRecordingPreWarmTaskLambda = new nodeLambda.NodejsFunction(this, 'StartRecordingPreWarmTaskLambda', {
            functionName: `${props.cdkAppName}-StartRecordingPreWarmTaskLambda`,
            runtime: lambda.Runtime.NODEJS_12_X,
            entry: 'lambdas/handlers/RecordingAPI/startRecordingPreWarmTask.js',
            timeout: cdk.Duration.seconds(20),
            environment: {
                ECS_CLUSTER_ARN: recordingECSCluster.clusterArn,
                ECS_CONTAINER_NAME: recordingContainerName,
                ECS_TASK_DEFINITION_ARN: recordingTaskDefinition.taskDefinitionArn,
                ECS_ASG_NAME: recordingECSAutoScalingGroup.autoScalingGroupName
            }
        });
        (_a = startRecordingPreWarmTaskLambda.role) === null || _a === void 0 ? void 0 : _a.attachInlinePolicy(new iam.Policy(this, 'ECSListContainerInstancesAccess', {
            statements: [
                new iam.PolicyStatement({
                    effect: iam.Effect.ALLOW,
                    actions: ['ecs:ListContainerInstances'],
                    resources: [recordingECSCluster.clusterArn]
                })
            ]
        }));
        (_b = startRecordingPreWarmTaskLambda.role) === null || _b === void 0 ? void 0 : _b.attachInlinePolicy(new iam.Policy(this, 'ECSStartTaskAccess', {
            statements: [
                new iam.PolicyStatement({
                    effect: iam.Effect.ALLOW,
                    actions: ['ecs:StartTask'],
                    resources: [recordingTaskDefinition.taskDefinitionArn]
                })
            ]
        }));
        (_c = startRecordingPreWarmTaskLambda.role) === null || _c === void 0 ? void 0 : _c.attachInlinePolicy(new iam.Policy(this, 'IAMPassRoleAccess', {
            statements: [
                new iam.PolicyStatement({
                    effect: iam.Effect.ALLOW,
                    actions: ['iam:PassRole'],
                    resources: [(_d = recordingTaskDefinition.executionRole) === null || _d === void 0 ? void 0 : _d.roleArn]
                })
            ]
        }));
        autoscalingEC2InstanceLaunchRule.addTarget(new events_targets.LambdaFunction(startRecordingPreWarmTaskLambda));
        //outputs
        this.recordingECSClusterARN = recordingECSCluster.clusterArn;
        this.recordingECSClusterName = recordingECSCluster.clusterName;
        this.recordingContainerName = recordingContainerName;
        this.recordingTaskDefinitionARN = recordingTaskDefinition.taskDefinitionArn;
        this.recordingBucketName = recordingBucket.bucketName;
        this.recordingTaskDefinitionExecutionRoleARN = (_e = recordingTaskDefinition.executionRole) === null || _e === void 0 ? void 0 : _e.roleArn;
    }
}
exports.RecordingStack = RecordingStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVjb3JkaW5nLXN0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsicmVjb3JkaW5nLXN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSwwRUFBMEU7QUFDMUUsaUNBQWlDOzs7QUFFakMscUNBQXFDO0FBQ3JDLHdDQUF3QztBQUN4Qyx3Q0FBd0M7QUFDeEMsd0RBQXdEO0FBQ3hELDBDQUEwQztBQUMxQyxzREFBc0Q7QUFDdEQsNkJBQTZCO0FBQzdCLHNDQUFzQztBQUV0Qyw4Q0FBOEM7QUFDOUMsOERBQThEO0FBQzlELDhDQUE4QztBQUM5Qyx5REFBeUQ7QUFDekQsd0NBQXdDO0FBT3hDLE1BQWEsY0FBZSxTQUFRLEdBQUcsQ0FBQyxXQUFXO0lBUy9DLFlBQVksS0FBb0IsRUFBRSxFQUFVLEVBQUUsS0FBMEI7O1FBQ3BFLEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXhCLHVEQUF1RDtRQUN2RCxNQUFNLFlBQVksR0FBRyxJQUFJLEdBQUcsQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLGNBQWMsRUFBRTtZQUNuRCxNQUFNLEVBQUUsQ0FBQztZQUNULElBQUksRUFBRSxhQUFhO1lBQ25CLG1CQUFtQixFQUFFO2dCQUNqQjtvQkFDSSxRQUFRLEVBQUUsRUFBRTtvQkFDWixJQUFJLEVBQUUsR0FBRyxLQUFLLENBQUMsVUFBVSxXQUFXO29CQUNwQyxVQUFVLEVBQUUsR0FBRyxDQUFDLFVBQVUsQ0FBQyxPQUFPO2lCQUNyQztnQkFDRDtvQkFDSSxRQUFRLEVBQUUsRUFBRTtvQkFDWixJQUFJLEVBQUUsR0FBRyxLQUFLLENBQUMsVUFBVSxVQUFVO29CQUNuQyxVQUFVLEVBQUUsR0FBRyxDQUFDLFVBQVUsQ0FBQyxNQUFNO2lCQUNwQzthQUNKO1NBRUosQ0FBQyxDQUFDO1FBRUgsOEJBQThCO1FBQzlCLE1BQU0seUJBQXlCLEdBQUcsSUFBSSxHQUFHLENBQUMsYUFBYSxDQUFDLElBQUksRUFBRSwy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QXVCLENBQUMsYUFBYSwwQ0FBRSxPQUFRLENBQUM7aUJBQy9ELENBQUM7YUFDTDtTQUNKLENBQUMsRUFBRTtRQUVKLGdDQUFnQyxDQUFDLFNBQVMsQ0FBQyxJQUFJLGNBQWMsQ0FBQyxjQUFjLENBQUMsK0JBQStCLENBQUMsQ0FBQyxDQUFDO1FBRy9HLFNBQVM7UUFDVCxJQUFJLENBQUMsc0JBQXNCLEdBQUcsbUJBQW1CLENBQUMsVUFBVSxDQUFDO1FBQzdELElBQUksQ0FBQyx1QkFBdUIsR0FBRyxtQkFBbUIsQ0FBQyxXQUFXLENBQUM7UUFDL0QsSUFBSSxDQUFDLHNCQUFzQixHQUFHLHNCQUFzQixDQUFDO1FBQ3JELElBQUksQ0FBQywwQkFBMEIsR0FBRyx1QkFBdUIsQ0FBQyxpQkFBaUIsQ0FBQztRQUM1RSxJQUFJLENBQUMsbUJBQW1CLEdBQUcsZUFBZSxDQUFDLFVBQVUsQ0FBQztRQUN0RCxJQUFJLENBQUMsdUNBQXVDLEdBQUcsTUFBQSx1QkFBdUIsQ0FBQyxhQUFhLDBDQUFFLE9BQVEsQ0FBQztJQUNuRyxDQUFDO0NBRUo7QUE5TUQsd0NBOE1DIiwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMjEgQW1hem9uLmNvbSwgSW5jLiBvciBpdHMgYWZmaWxpYXRlcy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vIFNQRFgtTGljZW5zZS1JZGVudGlmaWVyOiBNSVQtMFxuXG5pbXBvcnQgKiBhcyBjZGsgZnJvbSAnQGF3cy1jZGsvY29yZSc7XG5pbXBvcnQgKiBhcyBlYzIgZnJvbSAnQGF3cy1jZGsvYXdzLWVjMic7XG5pbXBvcnQgKiBhcyBlY3MgZnJvbSBcIkBhd3MtY2RrL2F3cy1lY3NcIjtcbmltcG9ydCAqIGFzIGF1dG9zY2FsaW5nIGZyb20gXCJAYXdzLWNkay9hd3MtYXV0b3NjYWxpbmdcIjtcbmltcG9ydCAqIGFzIGxvZ3MgZnJvbSBcIkBhd3MtY2RrL2F3cy1sb2dzXCI7XG5pbXBvcnQgKiBhcyBlY3JfYXNzZXRzIGZyb20gXCJAYXdzLWNkay9hd3MtZWNyLWFzc2V0c1wiO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tIFwicGF0aFwiO1xuaW1wb3J0ICogYXMgczMgZnJvbSBcIkBhd3MtY2RrL2F3cy1zM1wiO1xuXG5pbXBvcnQgKiBhcyBldmVudHMgZnJvbSBcIkBhd3MtY2RrL2F3cy1ldmVudHNcIjtcbmltcG9ydCAqIGFzIGV2ZW50c190YXJnZXRzIGZyb20gXCJAYXdzLWNkay9hd3MtZXZlbnRzLXRhcmdldHNcIjtcbmltcG9ydCAqIGFzIGxhbWJkYSBmcm9tICdAYXdzLWNkay9hd3MtbGFtYmRhJztcbmltcG9ydCAqIGFzIG5vZGVMYW1iZGEgZnJvbSBcIkBhd3MtY2RrL2F3cy1sYW1iZGEtbm9kZWpzXCI7XG5pbXBvcnQgKiBhcyBpYW0gZnJvbSAnQGF3cy1jZGsvYXdzLWlhbSc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgUmVjb3JkaW5nU3RhY2tQcm9wcyBleHRlbmRzIGNkay5OZXN0ZWRTdGFja1Byb3BzIHtcbiAgICByZWFkb25seSBTU01QYXJhbXM6IGFueTtcbiAgICByZWFkb25seSBjZGtBcHBOYW1lOiBzdHJpbmc7XG59XG5cbmV4cG9ydCBjbGFzcyBSZWNvcmRpbmdTdGFjayBleHRlbmRzIGNkay5OZXN0ZWRTdGFjayB7XG4gICAgcHVibGljIHJlYWRvbmx5IHJlY29yZGluZ0VDU0NsdXN0ZXJBUk46IHN0cmluZztcbiAgICBwdWJsaWMgcmVhZG9ubHkgcmVjb3JkaW5nRUNTQ2x1c3Rlck5hbWU6IHN0cmluZztcbiAgICBwdWJsaWMgcmVhZG9ubHkgcmVjb3JkaW5nQ29udGFpbmVyTmFtZTogc3RyaW5nO1xuICAgIHB1YmxpYyByZWFkb25seSByZWNvcmRpbmdUYXNrRGVmaW5pdGlvbkFSTjogc3RyaW5nO1xuICAgIHB1YmxpYyByZWFkb25seSByZWNvcmRpbmdCdWNrZXROYW1lOiBzdHJpbmc7XG4gICAgcHVibGljIHJlYWRvbmx5IHJlY29yZGluZ1Rhc2tEZWZpbml0aW9uRXhlY3V0aW9uUm9sZUFSTjogc3RyaW5nO1xuXG5cbiAgICBjb25zdHJ1Y3RvcihzY29wZTogY2RrLkNvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM6IFJlY29yZGluZ1N0YWNrUHJvcHMpIHtcbiAgICAgICAgc3VwZXIoc2NvcGUsIGlkLCBwcm9wcyk7XG5cbiAgICAgICAgLyoqIENSRUFURSBBTiBBTUFaT04gVlBDIEZPUiBUSEUgQU1BWk9OIEVDUyBDTFVTVEVSICoqL1xuICAgICAgICBjb25zdCByZWNvcmRpbmdWUEMgPSBuZXcgZWMyLlZwYyh0aGlzLCAnUmVjb3JkaW5nVlBDJywge1xuICAgICAgICAgICAgbWF4QXpzOiAyLCAvL2RlZmF1bHQgaXMgM1xuICAgICAgICAgICAgY2lkcjogJzEwLjUuMC4wLzE2JyxcbiAgICAgICAgICAgIHN1Ym5ldENvbmZpZ3VyYXRpb246IFtcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGNpZHJNYXNrOiAyNCxcbiAgICAgICAgICAgICAgICAgICAgbmFtZTogYCR7cHJvcHMuY2RrQXBwTmFtZX0tcHJpdmF0ZS1gLFxuICAgICAgICAgICAgICAgICAgICBzdWJuZXRUeXBlOiBlYzIuU3VibmV0VHlwZS5QUklWQVRFXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGNpZHJNYXNrOiAyNCxcbiAgICAgICAgICAgICAgICAgICAgbmFtZTogYCR7cHJvcHMuY2RrQXBwTmFtZX0tcHVibGljLWAsXG4gICAgICAgICAgICAgICAgICAgIHN1Ym5ldFR5cGU6IGVjMi5TdWJuZXRUeXBlLlBVQkxJQ1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBdXG5cbiAgICAgICAgfSk7XG5cbiAgICAgICAgLyoqIENSRUFURSBTRUNVUklUWSBHUk9VUFMgKiovXG4gICAgICAgIGNvbnN0IHJlY29yZGluZ0VDU1NlY3VyaXR5R3JvdXAgPSBuZXcgZWMyLlNlY3VyaXR5R3JvdXAodGhpcywgJ1JlY29yZGluZ0VDU1NlY3VyaXR5R3JvdXAnLCB7XG4gICAgICAgICAgICBzZWN1cml0eUdyb3VwTmFtZTogYCR7cHJvcHMuY2RrQXBwTmFtZX0tUmVjb3JkaW5nRUNTU2VjdXJpdHlHcm91cGAsXG4gICAgICAgICAgICB2cGM6IHJlY29yZGluZ1ZQQyxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBgRUNTIFNlY3VyaXR5IEdyb3VwIGZvciAke3Byb3BzLmNka0FwcE5hbWV9IFJlY29yZGluZyBFQ1MgQ2x1c3RlcmAsXG4gICAgICAgICAgICBhbGxvd0FsbE91dGJvdW5kOiB0cnVlXG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8qKiBDUkVBVEUgQU4gRUNTIENMVVNURVIgKiovXG4gICAgICAgIGNvbnN0IHJlY29yZGluZ0VDU0NsdXN0ZXIgPSBuZXcgZWNzLkNsdXN0ZXIodGhpcywgJ1JlY29yZGluZ0VDU0NsdXN0ZXInLCB7XG4gICAgICAgICAgICB2cGM6IHJlY29yZGluZ1ZQQyxcbiAgICAgICAgICAgIGNsdXN0ZXJOYW1lOiBgJHtwcm9wcy5jZGtBcHBOYW1lfS1SZWNvcmRpbmdgLFxuICAgICAgICAgICAgY29udGFpbmVySW5zaWdodHM6IHRydWUsXG4gICAgICAgIH0pO1xuXG5cbiAgICAgICAgLyoqIENSRUFURSBBTiBBVVRPU0NBTElORyBHUk9VUCBGT1IgRUNTIENMVVNURVIgSU5TVEFOQ0VTICoqL1xuICAgICAgICBjb25zdCByZWNvcmRpbmdFQ1NBdXRvU2NhbGluZ0dyb3VwID0gbmV3IGF1dG9zY2FsaW5nLkF1dG9TY2FsaW5nR3JvdXAodGhpcywgXCJSZWNvcmRpbmdFQ1NBdXRvU2NhbGluZ0dyb3VwXCIsIHtcbiAgICAgICAgICAgIHZwYzogcmVjb3JkaW5nVlBDLFxuICAgICAgICAgICAgc2VjdXJpdHlHcm91cDogcmVjb3JkaW5nRUNTU2VjdXJpdHlHcm91cCxcbiAgICAgICAgICAgIGFsbG93QWxsT3V0Ym91bmQ6IHRydWUsXG4gICAgICAgICAgICBhc3NvY2lhdGVQdWJsaWNJcEFkZHJlc3M6IGZhbHNlLFxuICAgICAgICAgICAgaW5zdGFuY2VUeXBlOiBlYzIuSW5zdGFuY2VUeXBlLm9mKGVjMi5JbnN0YW5jZUNsYXNzLk01LCBlYzIuSW5zdGFuY2VTaXplLlhMQVJHRTIpLFxuICAgICAgICAgICAgbWFjaGluZUltYWdlOiBlY3MuRWNzT3B0aW1pemVkSW1hZ2UuYW1hem9uTGludXgyKCksXG4gICAgICAgICAgICB2cGNTdWJuZXRzOiB7XG4gICAgICAgICAgICAgICAgc3VibmV0VHlwZTogZWMyLlN1Ym5ldFR5cGUuUFJJVkFURVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG1pbkNhcGFjaXR5OiAxLFxuICAgICAgICAgICAgbWF4Q2FwYWNpdHk6IDUsXG4gICAgICAgICAgICBzaWduYWxzOiBhdXRvc2NhbGluZy5TaWduYWxzLndhaXRGb3JNaW5DYXBhY2l0eSh7XG4gICAgICAgICAgICAgICAgdGltZW91dDogY2RrLkR1cmF0aW9uLm1pbnV0ZXMoMTUpXG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICAgIHVwZGF0ZVBvbGljeTogYXV0b3NjYWxpbmcuVXBkYXRlUG9saWN5LnJlcGxhY2luZ1VwZGF0ZSgpXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGNvbnN0IHJlY29yZGluZ0VDU0F1dG9TY2FsaW5nR3JvdXBDRk4gPSByZWNvcmRpbmdFQ1NBdXRvU2NhbGluZ0dyb3VwLm5vZGUuZGVmYXVsdENoaWxkIGFzIGF1dG9zY2FsaW5nLkNmbkF1dG9TY2FsaW5nR3JvdXA7XG4gICAgICAgIGNvbnN0IHJlY29yZGluZ0VDU0F1dG9TY2FsaW5nR3JvdXBDRk5Mb2dpY2FsSWQgPSBcIlJlY29yZGluZ0VDU0F1dG9TY2FsaW5nR3JvdXBcIjtcbiAgICAgICAgcmVjb3JkaW5nRUNTQXV0b1NjYWxpbmdHcm91cENGTi5vdmVycmlkZUxvZ2ljYWxJZChyZWNvcmRpbmdFQ1NBdXRvU2NhbGluZ0dyb3VwQ0ZOTG9naWNhbElkKTsgLy9MT0dJQ0FMIElEIEZPUiBDRk4gU0lHTkFMXG5cbiAgICAgICAgcmVjb3JkaW5nRUNTQXV0b1NjYWxpbmdHcm91cC5hZGRVc2VyRGF0YShcbiAgICAgICAgICAgIGAjIS9iaW4vYmFzaCAteGVgLFxuICAgICAgICAgICAgYGVjaG8gRUNTX0NMVVNURVI9JHtyZWNvcmRpbmdFQ1NDbHVzdGVyLmNsdXN0ZXJOYW1lfSA+PiAvZXRjL2Vjcy9lY3MuY29uZmlnYCxcbiAgICAgICAgICAgIGBlY2hvIEVDU19JTUFHRV9QVUxMX0JFSEFWSU9SPXByZWZlci1jYWNoZWQgPj4gL2V0Yy9lY3MvZWNzLmNvbmZpZ2AsXG4gICAgICAgICAgICBgeXVtIGluc3RhbGwgLXkgYXdzLWNmbi1ib290c3RyYXBgLFxuICAgICAgICAgICAgYC9vcHQvYXdzL2Jpbi9jZm4tc2lnbmFsIC1lICQ/IC0tc3RhY2sgJHt0aGlzLnN0YWNrTmFtZX0gLS1yZXNvdXJjZSAke3JlY29yZGluZ0VDU0F1dG9TY2FsaW5nR3JvdXBDRk5Mb2dpY2FsSWR9IC0tcmVnaW9uICR7dGhpcy5yZWdpb259YFxuICAgICAgICApO1xuXG4gICAgICAgIGNvbnN0IHJlY29yZGluZ0VDU0NhcGFjaXR5UHJvdmlkZXIgPSBuZXcgZWNzLkFzZ0NhcGFjaXR5UHJvdmlkZXIodGhpcywgJ1JlY29yZGluZ0VDU0NhcGFjaXR5UHJvdmlkZXInLCB7XG4gICAgICAgICAgICBhdXRvU2NhbGluZ0dyb3VwOiByZWNvcmRpbmdFQ1NBdXRvU2NhbGluZ0dyb3VwLFxuICAgICAgICAgICAgZW5hYmxlTWFuYWdlZFNjYWxpbmc6IHRydWUsXG4gICAgICAgICAgICBtaW5pbXVtU2NhbGluZ1N0ZXBTaXplOiAxLFxuICAgICAgICAgICAgbWF4aW11bVNjYWxpbmdTdGVwU2l6ZTogMixcbiAgICAgICAgICAgIHRhcmdldENhcGFjaXR5UGVyY2VudDogNjBcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmVjb3JkaW5nRUNTQ2x1c3Rlci5hZGRBc2dDYXBhY2l0eVByb3ZpZGVyKHJlY29yZGluZ0VDU0NhcGFjaXR5UHJvdmlkZXIpO1xuXG5cbiAgICAgICAgLyogREVGSU5FIEEgVEFTSyBERUZJTklUSU9OIEZPUiBFQ1MgVEFTS1MgUlVOTklORyBJTiBUSEUgQ0xVU1RFUiAqL1xuXG4gICAgICAgIGNvbnN0IHJlY29yZGluZ1Rhc2tEZWZpbml0aW9uID0gbmV3IGVjcy5UYXNrRGVmaW5pdGlvbih0aGlzLCBcIlJlY29yZGluZ1Rhc2tEZWZpbml0aW9uXCIsIHtcbiAgICAgICAgICAgIGNvbXBhdGliaWxpdHk6IGVjcy5Db21wYXRpYmlsaXR5LkVDMixcbiAgICAgICAgICAgIHZvbHVtZXM6IFt7XG4gICAgICAgICAgICAgICAgbmFtZTogXCJkYnVzXCIsXG4gICAgICAgICAgICAgICAgaG9zdDoge1xuICAgICAgICAgICAgICAgICAgICBzb3VyY2VQYXRoOiBcIi9ydW4vZGJ1cy9zeXN0ZW1fYnVzX3NvY2tldDovcnVuL2RidXMvc3lzdGVtX2J1c19zb2NrZXRcIlxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1dXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGNvbnN0IHJlY29yZGluZ1Rhc2tMb2dHcm91cCA9IG5ldyBsb2dzLkxvZ0dyb3VwKHRoaXMsIFwiUmVjb3JkaW5nVGFza0xvZ0dyb3VwXCIsIHtcbiAgICAgICAgICAgIHJldGVudGlvbjogbG9ncy5SZXRlbnRpb25EYXlzLlRXT19NT05USFMsXG4gICAgICAgICAgICBsb2dHcm91cE5hbWU6IGAke3Byb3BzLmNka0FwcE5hbWV9LVJlY29yZGluZ1Rhc2tgLFxuICAgICAgICAgICAgcmVtb3ZhbFBvbGljeTogY2RrLlJlbW92YWxQb2xpY3kuREVTVFJPWVxuICAgICAgICB9KTtcblxuICAgICAgICAvLyBCVUlMRCBBIERPQ0tFUiBJTUFHRSBBTkQgVVBMT0FEIElUIFRPIEFOIEVDUiBSRVBPU0lUT1JZXG5cbiAgICAgICAgY29uc3QgcmVjb3JkaW5nRG9ja2VySW1hZ2UgPSBuZXcgZWNyX2Fzc2V0cy5Eb2NrZXJJbWFnZUFzc2V0KHRoaXMsIFwiUmVjb3JkaW5nRG9ja2VySW1hZ2VcIiwge1xuICAgICAgICAgICAgZGlyZWN0b3J5OiBwYXRoLmpvaW4oX19kaXJuYW1lLCBcIi4uLy4uL2RvY2tlci9yZWNvcmRpbmdcIilcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmVjb3JkaW5nRG9ja2VySW1hZ2UucmVwb3NpdG9yeS5ncmFudFB1bGwocmVjb3JkaW5nVGFza0RlZmluaXRpb24ub2J0YWluRXhlY3V0aW9uUm9sZSgpKTsgLy9hZGQgcGVybWlzc2lvbnMgdG8gcHVsbCBlY3IgcmVwb3NpdG9yeVxuXG4gICAgICAgIC8vIENSRUFURSBBIFRBU0sgREVGSU5JVElPTlxuICAgICAgICBjb25zdCByZWNvcmRpbmdDb250YWluZXJOYW1lID0gYCR7cHJvcHMuY2RrQXBwTmFtZX0tUmVjb3JkaW5nQ29udGFpbmVyYDtcbiAgICAgICAgcmVjb3JkaW5nVGFza0RlZmluaXRpb24uYWRkQ29udGFpbmVyKHJlY29yZGluZ0NvbnRhaW5lck5hbWUsIHtcbiAgICAgICAgICAgIGltYWdlOiBlY3MuRWNySW1hZ2UuZnJvbVJlZ2lzdHJ5KHJlY29yZGluZ0RvY2tlckltYWdlLmltYWdlVXJpKSxcbiAgICAgICAgICAgIGNwdTogNDA5NixcbiAgICAgICAgICAgIG1lbW9yeUxpbWl0TWlCOiA4MTkyLFxuICAgICAgICAgICAgbWVtb3J5UmVzZXJ2YXRpb25NaUI6IDgxOTIsXG4gICAgICAgICAgICBsaW51eFBhcmFtZXRlcnM6IG5ldyBlY3MuTGludXhQYXJhbWV0ZXJzKHRoaXMsIFwiUmVjb3JkaW5nVGFza0xpbnV4UGFyYW1ldGVyc1wiLCB7IHNoYXJlZE1lbW9yeVNpemU6IDIwNDggfSksXG4gICAgICAgICAgICBlc3NlbnRpYWw6IHRydWUsXG4gICAgICAgICAgICBsb2dnaW5nOiBlY3MuTG9nRHJpdmVyLmF3c0xvZ3Moe1xuICAgICAgICAgICAgICAgIGxvZ0dyb3VwOiByZWNvcmRpbmdUYXNrTG9nR3JvdXAsXG4gICAgICAgICAgICAgICAgc3RyZWFtUHJlZml4OiBgJHtwcm9wcy5jZGtBcHBOYW1lfWBcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vQW1hem9uIFMzIGJ1Y2tldCB0byBzdG9yZSB0aGUgY2FsbCByZWNvcmRpbmdzXG4gICAgICAgIGNvbnN0IHJlY29yZGluZ0J1Y2tldCA9IG5ldyBzMy5CdWNrZXQodGhpcywgXCJSZWNvcmRpbmdCdWNrZXRcIiwge1xuICAgICAgICAgICAgYnVja2V0TmFtZTogYCR7cHJvcHMuY2RrQXBwTmFtZX0tUmVjb3JkaW5nQnVja2V0LSR7dGhpcy5hY2NvdW50fS0ke3RoaXMucmVnaW9ufWAudG9Mb3dlckNhc2UoKSxcbiAgICAgICAgICAgIGVuY3J5cHRpb246IHMzLkJ1Y2tldEVuY3J5cHRpb24uS01TX01BTkFHRURcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmVjb3JkaW5nQnVja2V0LmdyYW50UmVhZFdyaXRlKHJlY29yZGluZ1Rhc2tEZWZpbml0aW9uLnRhc2tSb2xlKTtcblxuXG4gICAgICAgIC8vcHJlLXdhcm0gdGFza1xuICAgICAgICBjb25zdCBhdXRvc2NhbGluZ0VDMkluc3RhbmNlTGF1bmNoUnVsZSA9IG5ldyBldmVudHMuUnVsZSh0aGlzLCAnQXV0b3NjYWxpbmdFQzJJbnN0YW5jZUxhdW5jaFJ1bGUnLCB7XG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogYFJ1bGUgdHJpZ2dlcmVkIGJ5IHJlY29yZGluZ0VDU0F1dG9TY2FsaW5nR3JvdXAgd2hlbiBhIG5ldyBFQzIgaW5zdGFuY2UgaXMgbGF1bmNoZWRgLFxuICAgICAgICAgICAgZXZlbnRQYXR0ZXJuOiB7XG4gICAgICAgICAgICAgICAgc291cmNlOiBbJ2F3cy5hdXRvc2NhbGluZyddLFxuICAgICAgICAgICAgICAgIGRldGFpbFR5cGU6IFsnRUMyIEluc3RhbmNlIExhdW5jaCBTdWNjZXNzZnVsJ10sXG4gICAgICAgICAgICAgICAgZGV0YWlsOiB7XG4gICAgICAgICAgICAgICAgICAgICdBdXRvU2NhbGluZ0dyb3VwTmFtZSc6IFtyZWNvcmRpbmdFQ1NBdXRvU2NhbGluZ0dyb3VwLmF1dG9TY2FsaW5nR3JvdXBOYW1lXVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgY29uc3Qgc3RhcnRSZWNvcmRpbmdQcmVXYXJtVGFza0xhbWJkYSA9IG5ldyBub2RlTGFtYmRhLk5vZGVqc0Z1bmN0aW9uKHRoaXMsICdTdGFydFJlY29yZGluZ1ByZVdhcm1UYXNrTGFtYmRhJywge1xuICAgICAgICAgICAgZnVuY3Rpb25OYW1lOiBgJHtwcm9wcy5jZGtBcHBOYW1lfS1TdGFydFJlY29yZGluZ1ByZVdhcm1UYXNrTGFtYmRhYCxcbiAgICAgICAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18xMl9YLFxuICAgICAgICAgICAgZW50cnk6ICdsYW1iZGFzL2hhbmRsZXJzL1JlY29yZGluZ0FQSS9zdGFydFJlY29yZGluZ1ByZVdhcm1UYXNrLmpzJyxcbiAgICAgICAgICAgIHRpbWVvdXQ6IGNkay5EdXJhdGlvbi5zZWNvbmRzKDIwKSxcbiAgICAgICAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgICAgICAgICAgRUNTX0NMVVNURVJfQVJOOiByZWNvcmRpbmdFQ1NDbHVzdGVyLmNsdXN0ZXJBcm4sXG4gICAgICAgICAgICAgICAgRUNTX0NPTlRBSU5FUl9OQU1FOiByZWNvcmRpbmdDb250YWluZXJOYW1lLFxuICAgICAgICAgICAgICAgIEVDU19UQVNLX0RFRklOSVRJT05fQVJOOiByZWNvcmRpbmdUYXNrRGVmaW5pdGlvbi50YXNrRGVmaW5pdGlvbkFybixcbiAgICAgICAgICAgICAgICBFQ1NfQVNHX05BTUU6IHJlY29yZGluZ0VDU0F1dG9TY2FsaW5nR3JvdXAuYXV0b1NjYWxpbmdHcm91cE5hbWVcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgc3RhcnRSZWNvcmRpbmdQcmVXYXJtVGFza0xhbWJkYS5yb2xlPy5hdHRhY2hJbmxpbmVQb2xpY3kobmV3IGlhbS5Qb2xpY3kodGhpcywgJ0VDU0xpc3RDb250YWluZXJJbnN0YW5jZXNBY2Nlc3MnLCB7XG4gICAgICAgICAgICBzdGF0ZW1lbnRzOiBbXG4gICAgICAgICAgICAgICAgbmV3IGlhbS5Qb2xpY3lTdGF0ZW1lbnQoe1xuICAgICAgICAgICAgICAgICAgICBlZmZlY3Q6IGlhbS5FZmZlY3QuQUxMT1csXG4gICAgICAgICAgICAgICAgICAgIGFjdGlvbnM6IFsnZWNzOkxpc3RDb250YWluZXJJbnN0YW5jZXMnXSxcbiAgICAgICAgICAgICAgICAgICAgcmVzb3VyY2VzOiBbcmVjb3JkaW5nRUNTQ2x1c3Rlci5jbHVzdGVyQXJuXVxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICBdXG4gICAgICAgIH0pKTtcblxuICAgICAgICBzdGFydFJlY29yZGluZ1ByZVdhcm1UYXNrTGFtYmRhLnJvbGU/LmF0dGFjaElubGluZVBvbGljeShuZXcgaWFtLlBvbGljeSh0aGlzLCAnRUNTU3RhcnRUYXNrQWNjZXNzJywge1xuICAgICAgICAgICAgc3RhdGVtZW50czogW1xuICAgICAgICAgICAgICAgIG5ldyBpYW0uUG9saWN5U3RhdGVtZW50KHtcbiAgICAgICAgICAgICAgICAgICAgZWZmZWN0OiBpYW0uRWZmZWN0LkFMTE9XLFxuICAgICAgICAgICAgICAgICAgICBhY3Rpb25zOiBbJ2VjczpTdGFydFRhc2snXSxcbiAgICAgICAgICAgICAgICAgICAgcmVzb3VyY2VzOiBbcmVjb3JkaW5nVGFza0RlZmluaXRpb24udGFza0RlZmluaXRpb25Bcm5dXG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIF1cbiAgICAgICAgfSkpO1xuXG4gICAgICAgIHN0YXJ0UmVjb3JkaW5nUHJlV2FybVRhc2tMYW1iZGEucm9sZT8uYXR0YWNoSW5saW5lUG9saWN5KG5ldyBpYW0uUG9saWN5KHRoaXMsICdJQU1QYXNzUm9sZUFjY2VzcycsIHtcbiAgICAgICAgICAgIHN0YXRlbWVudHM6IFtcbiAgICAgICAgICAgICAgICBuZXcgaWFtLlBvbGljeVN0YXRlbWVudCh7XG4gICAgICAgICAgICAgICAgICAgIGVmZmVjdDogaWFtLkVmZmVjdC5BTExPVyxcbiAgICAgICAgICAgICAgICAgICAgYWN0aW9uczogWydpYW06UGFzc1JvbGUnXSxcbiAgICAgICAgICAgICAgICAgICAgcmVzb3VyY2VzOiBbcmVjb3JkaW5nVGFza0RlZmluaXRpb24uZXhlY3V0aW9uUm9sZT8ucm9sZUFybiFdXG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIF1cbiAgICAgICAgfSkpO1xuXG4gICAgICAgIGF1dG9zY2FsaW5nRUMySW5zdGFuY2VMYXVuY2hSdWxlLmFkZFRhcmdldChuZXcgZXZlbnRzX3RhcmdldHMuTGFtYmRhRnVuY3Rpb24oc3RhcnRSZWNvcmRpbmdQcmVXYXJtVGFza0xhbWJkYSkpO1xuXG5cbiAgICAgICAgLy9vdXRwdXRzXG4gICAgICAgIHRoaXMucmVjb3JkaW5nRUNTQ2x1c3RlckFSTiA9IHJlY29yZGluZ0VDU0NsdXN0ZXIuY2x1c3RlckFybjtcbiAgICAgICAgdGhpcy5yZWNvcmRpbmdFQ1NDbHVzdGVyTmFtZSA9IHJlY29yZGluZ0VDU0NsdXN0ZXIuY2x1c3Rlck5hbWU7XG4gICAgICAgIHRoaXMucmVjb3JkaW5nQ29udGFpbmVyTmFtZSA9IHJlY29yZGluZ0NvbnRhaW5lck5hbWU7XG4gICAgICAgIHRoaXMucmVjb3JkaW5nVGFza0RlZmluaXRpb25BUk4gPSByZWNvcmRpbmdUYXNrRGVmaW5pdGlvbi50YXNrRGVmaW5pdGlvbkFybjtcbiAgICAgICAgdGhpcy5yZWNvcmRpbmdCdWNrZXROYW1lID0gcmVjb3JkaW5nQnVja2V0LmJ1Y2tldE5hbWU7XG4gICAgICAgIHRoaXMucmVjb3JkaW5nVGFza0RlZmluaXRpb25FeGVjdXRpb25Sb2xlQVJOID0gcmVjb3JkaW5nVGFza0RlZmluaXRpb24uZXhlY3V0aW9uUm9sZT8ucm9sZUFybiE7XG4gICAgfVxuXG59Il19