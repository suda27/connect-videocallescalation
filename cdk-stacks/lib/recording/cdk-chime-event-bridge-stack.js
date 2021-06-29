"use strict";
// Copyright 2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
Object.defineProperty(exports, "__esModule", { value: true });
exports.CdkChimeEventBridgeStack = void 0;
const cdk = require("@aws-cdk/core");
const events = require("@aws-cdk/aws-events");
const events_targets = require("@aws-cdk/aws-events-targets");
const lambda = require("@aws-cdk/aws-lambda");
const nodeLambda = require("@aws-cdk/aws-lambda-nodejs");
const iam = require("@aws-cdk/aws-iam");
const configParams = require('../../config.params.json');
class CdkChimeEventBridgeStack extends cdk.Stack {
    constructor(scope, id, props) {
        var _a;
        super(scope, id, props);
        //Subscribe to Amazon Chime SDK meeting ends
        const chimeMeetingEndsRule = new events.Rule(this, 'ChimeMeetingEndsRule', {
            description: `Rule triggered by Amazon Chime SDK, when an active meeting ends.`,
            eventPattern: {
                source: ['aws.chime'],
                detail: {
                    'eventType': ['chime:MeetingEnded']
                }
            }
        });
        const stopRecordingEventTargetLambda = new nodeLambda.NodejsFunction(this, 'StopRecordingEventTargetLambda', {
            functionName: `${configParams['CdkAppName']}-StopRecordingEventTargetLambda`,
            runtime: lambda.Runtime.NODEJS_12_X,
            entry: 'lambdas/handlers/RecordingAPI/stopRecordingEventTarget.js',
            timeout: cdk.Duration.seconds(20),
            environment: {
                DDB_TABLE: props.appTable.tableName,
                DDB_REGION: props.cdkBackendStackRegion,
                ECS_CLUSTER_ARN: props.recordingECSClusterARN,
                ECS_CLUSTER_REGION: props.cdkBackendStackRegion
            }
        });
        props.appTable.grantReadWriteData(stopRecordingEventTargetLambda);
        (_a = stopRecordingEventTargetLambda.role) === null || _a === void 0 ? void 0 : _a.attachInlinePolicy(new iam.Policy(this, 'ECSStopTaskAccess', {
            statements: [
                new iam.PolicyStatement({
                    effect: iam.Effect.ALLOW,
                    actions: ['ecs:StopTask'],
                    resources: [`arn:aws:ecs:${props.cdkBackendStackRegion}:${this.account}:task/${props.recordingECSClusterName}/*`]
                })
            ]
        }));
        chimeMeetingEndsRule.addTarget(new events_targets.LambdaFunction(stopRecordingEventTargetLambda));
    }
}
exports.CdkChimeEventBridgeStack = CdkChimeEventBridgeStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2RrLWNoaW1lLWV2ZW50LWJyaWRnZS1zdGFjay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImNkay1jaGltZS1ldmVudC1icmlkZ2Utc3RhY2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLDBFQUEwRTtBQUMxRSxpQ0FBaUM7OztBQUVqQyxxQ0FBcUM7QUFDckMsOENBQThDO0FBQzlDLDhEQUE4RDtBQUM5RCw4Q0FBOEM7QUFDOUMseURBQXlEO0FBRXpELHdDQUF3QztBQUV4QyxNQUFNLFlBQVksR0FBRyxPQUFPLENBQUMsMEJBQTBCLENBQUMsQ0FBQztBQVN6RCxNQUFhLHdCQUF5QixTQUFRLEdBQUcsQ0FBQyxLQUFLO0lBRW5ELFlBQVksS0FBb0IsRUFBRSxFQUFVLEVBQUUsS0FBb0M7O1FBQzlFLEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXhCLDRDQUE0QztRQUM1QyxNQUFNLG9CQUFvQixHQUFHLElBQUksTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsc0JBQXNCLEVBQUU7WUFDdkUsV0FBVyxFQUFFLGtFQUFrRTtZQUMvRSxZQUFZLEVBQUU7Z0JBQ1YsTUFBTSxFQUFFLENBQUMsV0FBVyxDQUFDO2dCQUNyQixNQUFNLEVBQUU7b0JBQ0osV0FBVyxFQUFFLENBQUMsb0JBQW9CLENBQUM7aUJBQ3RDO2FBQ0o7U0FDSixDQUFDLENBQUM7UUFFSCxNQUFNLDhCQUE4QixHQUFHLElBQUksVUFBVSxDQUFDLGNBQWMsQ0FBQyxJQUFJLEVBQUUsZ0NBQWdDLEVBQUU7WUFDekcsWUFBWSxFQUFFLEdBQUcsWUFBWSxDQUFDLFlBQVksQ0FBQyxpQ0FBaUM7WUFDNUUsT0FBTyxFQUFFLE1BQU0sQ0FBQyxPQUFPLENBQUMsV0FBVztZQUNuQyxLQUFLLEVBQUUsMkRBQTJEO1lBQ2xFLE9BQU8sRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7WUFDakMsV0FBVyxFQUFFO2dCQUNULFNBQVMsRUFBRSxLQUFLLENBQUMsUUFBUSxDQUFDLFNBQVM7Z0JBQ25DLFVBQVUsRUFBRSxLQUFLLENBQUMscUJBQXFCO2dCQUN2QyxlQUFlLEVBQUUsS0FBSyxDQUFDLHNCQUFzQjtnQkFDN0Msa0JBQWtCLEVBQUUsS0FBSyxDQUFDLHFCQUFxQjthQUNsRDtTQUNKLENBQUMsQ0FBQztRQUNILEtBQUssQ0FBQyxRQUFRLENBQUMsa0JBQWtCLENBQUMsOEJBQThCLENBQUMsQ0FBQztRQUVsRSxNQUFBLDhCQUE4QixDQUFDLElBQUksMENBQUUsa0JBQWtCLENBQUMsSUFBSSxHQUFHLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxtQkFBbUIsRUFBRTtZQUM5RixVQUFVLEVBQUU7Z0JBQ1IsSUFBSSxHQUFHLENBQUMsZUFBZSxDQUFDO29CQUNwQixNQUFNLEVBQUUsR0FBRyxDQUFDLE1BQU0sQ0FBQyxLQUFLO29CQUN4QixPQUFPLEVBQUUsQ0FBQyxjQUFjLENBQUM7b0JBQ3pCLFNBQVMsRUFBRSxDQUFDLGVBQWUsS0FBSyxDQUFDLHFCQUFxQixJQUFJLElBQUksQ0FBQyxPQUFPLFNBQVMsS0FBSyxDQUFDLHVCQUF1QixJQUFJLENBQUM7aUJBQ3BILENBQUM7YUFDTDtTQUNKLENBQUMsRUFBRTtRQUVKLG9CQUFvQixDQUFDLFNBQVMsQ0FBQyxJQUFJLGNBQWMsQ0FBQyxjQUFjLENBQUMsOEJBQThCLENBQUMsQ0FBQyxDQUFDO0lBQ3RHLENBQUM7Q0FDSjtBQTFDRCw0REEwQ0MiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAyMSBBbWF6b24uY29tLCBJbmMuIG9yIGl0cyBhZmZpbGlhdGVzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy8gU1BEWC1MaWNlbnNlLUlkZW50aWZpZXI6IE1JVC0wXG5cbmltcG9ydCAqIGFzIGNkayBmcm9tICdAYXdzLWNkay9jb3JlJztcbmltcG9ydCAqIGFzIGV2ZW50cyBmcm9tIFwiQGF3cy1jZGsvYXdzLWV2ZW50c1wiO1xuaW1wb3J0ICogYXMgZXZlbnRzX3RhcmdldHMgZnJvbSBcIkBhd3MtY2RrL2F3cy1ldmVudHMtdGFyZ2V0c1wiO1xuaW1wb3J0ICogYXMgbGFtYmRhIGZyb20gJ0Bhd3MtY2RrL2F3cy1sYW1iZGEnO1xuaW1wb3J0ICogYXMgbm9kZUxhbWJkYSBmcm9tIFwiQGF3cy1jZGsvYXdzLWxhbWJkYS1ub2RlanNcIjtcbmltcG9ydCAqIGFzIGRkYiBmcm9tICdAYXdzLWNkay9hd3MtZHluYW1vZGInO1xuaW1wb3J0ICogYXMgaWFtIGZyb20gJ0Bhd3MtY2RrL2F3cy1pYW0nO1xuXG5jb25zdCBjb25maWdQYXJhbXMgPSByZXF1aXJlKCcuLi8uLi9jb25maWcucGFyYW1zLmpzb24nKTtcblxuZXhwb3J0IGludGVyZmFjZSBDZGtDaGltZUV2ZW50QnJpZGdlU3RhY2tQcm9wcyBleHRlbmRzIGNkay5TdGFja1Byb3BzIHtcbiAgICByZWFkb25seSBjZGtCYWNrZW5kU3RhY2tSZWdpb246IHN0cmluZztcbiAgICByZWFkb25seSBhcHBUYWJsZTogZGRiLklUYWJsZTtcbiAgICByZWFkb25seSByZWNvcmRpbmdFQ1NDbHVzdGVyQVJOOiBzdHJpbmc7XG4gICAgcmVhZG9ubHkgcmVjb3JkaW5nRUNTQ2x1c3Rlck5hbWU6IHN0cmluZztcbn1cblxuZXhwb3J0IGNsYXNzIENka0NoaW1lRXZlbnRCcmlkZ2VTdGFjayBleHRlbmRzIGNkay5TdGFjayB7XG5cbiAgICBjb25zdHJ1Y3RvcihzY29wZTogY2RrLkNvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM6IENka0NoaW1lRXZlbnRCcmlkZ2VTdGFja1Byb3BzKSB7XG4gICAgICAgIHN1cGVyKHNjb3BlLCBpZCwgcHJvcHMpO1xuXG4gICAgICAgIC8vU3Vic2NyaWJlIHRvIEFtYXpvbiBDaGltZSBTREsgbWVldGluZyBlbmRzXG4gICAgICAgIGNvbnN0IGNoaW1lTWVldGluZ0VuZHNSdWxlID0gbmV3IGV2ZW50cy5SdWxlKHRoaXMsICdDaGltZU1lZXRpbmdFbmRzUnVsZScsIHtcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBgUnVsZSB0cmlnZ2VyZWQgYnkgQW1hem9uIENoaW1lIFNESywgd2hlbiBhbiBhY3RpdmUgbWVldGluZyBlbmRzLmAsXG4gICAgICAgICAgICBldmVudFBhdHRlcm46IHtcbiAgICAgICAgICAgICAgICBzb3VyY2U6IFsnYXdzLmNoaW1lJ10sXG4gICAgICAgICAgICAgICAgZGV0YWlsOiB7XG4gICAgICAgICAgICAgICAgICAgICdldmVudFR5cGUnOiBbJ2NoaW1lOk1lZXRpbmdFbmRlZCddXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICBjb25zdCBzdG9wUmVjb3JkaW5nRXZlbnRUYXJnZXRMYW1iZGEgPSBuZXcgbm9kZUxhbWJkYS5Ob2RlanNGdW5jdGlvbih0aGlzLCAnU3RvcFJlY29yZGluZ0V2ZW50VGFyZ2V0TGFtYmRhJywge1xuICAgICAgICAgICAgZnVuY3Rpb25OYW1lOiBgJHtjb25maWdQYXJhbXNbJ0Nka0FwcE5hbWUnXX0tU3RvcFJlY29yZGluZ0V2ZW50VGFyZ2V0TGFtYmRhYCxcbiAgICAgICAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18xMl9YLFxuICAgICAgICAgICAgZW50cnk6ICdsYW1iZGFzL2hhbmRsZXJzL1JlY29yZGluZ0FQSS9zdG9wUmVjb3JkaW5nRXZlbnRUYXJnZXQuanMnLFxuICAgICAgICAgICAgdGltZW91dDogY2RrLkR1cmF0aW9uLnNlY29uZHMoMjApLFxuICAgICAgICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgICAgICAgICBEREJfVEFCTEU6IHByb3BzLmFwcFRhYmxlLnRhYmxlTmFtZSxcbiAgICAgICAgICAgICAgICBEREJfUkVHSU9OOiBwcm9wcy5jZGtCYWNrZW5kU3RhY2tSZWdpb24sXG4gICAgICAgICAgICAgICAgRUNTX0NMVVNURVJfQVJOOiBwcm9wcy5yZWNvcmRpbmdFQ1NDbHVzdGVyQVJOLFxuICAgICAgICAgICAgICAgIEVDU19DTFVTVEVSX1JFR0lPTjogcHJvcHMuY2RrQmFja2VuZFN0YWNrUmVnaW9uXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBwcm9wcy5hcHBUYWJsZS5ncmFudFJlYWRXcml0ZURhdGEoc3RvcFJlY29yZGluZ0V2ZW50VGFyZ2V0TGFtYmRhKTtcblxuICAgICAgICBzdG9wUmVjb3JkaW5nRXZlbnRUYXJnZXRMYW1iZGEucm9sZT8uYXR0YWNoSW5saW5lUG9saWN5KG5ldyBpYW0uUG9saWN5KHRoaXMsICdFQ1NTdG9wVGFza0FjY2VzcycsIHtcbiAgICAgICAgICAgIHN0YXRlbWVudHM6IFtcbiAgICAgICAgICAgICAgICBuZXcgaWFtLlBvbGljeVN0YXRlbWVudCh7XG4gICAgICAgICAgICAgICAgICAgIGVmZmVjdDogaWFtLkVmZmVjdC5BTExPVyxcbiAgICAgICAgICAgICAgICAgICAgYWN0aW9uczogWydlY3M6U3RvcFRhc2snXSxcbiAgICAgICAgICAgICAgICAgICAgcmVzb3VyY2VzOiBbYGFybjphd3M6ZWNzOiR7cHJvcHMuY2RrQmFja2VuZFN0YWNrUmVnaW9ufToke3RoaXMuYWNjb3VudH06dGFzay8ke3Byb3BzLnJlY29yZGluZ0VDU0NsdXN0ZXJOYW1lfS8qYF1cbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgXVxuICAgICAgICB9KSk7XG5cbiAgICAgICAgY2hpbWVNZWV0aW5nRW5kc1J1bGUuYWRkVGFyZ2V0KG5ldyBldmVudHNfdGFyZ2V0cy5MYW1iZGFGdW5jdGlvbihzdG9wUmVjb3JkaW5nRXZlbnRUYXJnZXRMYW1iZGEpKTtcbiAgICB9XG59Il19