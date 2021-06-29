"use strict";
// Copyright 2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChimeAPIStack = void 0;
const cdk = require("@aws-cdk/core");
const nodeLambda = require("@aws-cdk/aws-lambda-nodejs");
const lambda = require("@aws-cdk/aws-lambda");
const iam = require("@aws-cdk/aws-iam");
const apigw = require("@aws-cdk/aws-apigateway");
const apigw2 = require("@aws-cdk/aws-apigatewayv2");
const apigw2i = require("@aws-cdk/aws-apigatewayv2-integrations");
class ChimeAPIStack extends cdk.NestedStack {
    constructor(scope, id, props) {
        var _a, _b, _c;
        super(scope, id, props);
        /**************************************************************************************************************
        * createMeetingLambda *
        **************************************************************************************************************/
        const createMeetingLambda = new nodeLambda.NodejsFunction(this, 'CreateMeetingLambda', {
            functionName: `${props.cdkAppName}-CreateMeetingLambda`,
            runtime: lambda.Runtime.NODEJS_12_X,
            entry: 'lambdas/handlers/ChimeAPI/createMeeting.js',
            timeout: cdk.Duration.seconds(20),
            environment: {
                DDB_TABLE: props.appTable.tableName
            }
        });
        props.appTable.grantReadWriteData(createMeetingLambda);
        (_a = createMeetingLambda.role) === null || _a === void 0 ? void 0 : _a.attachInlinePolicy(new iam.Policy(this, 'ChimeCreateMeetingAccess', {
            statements: [
                new iam.PolicyStatement({
                    effect: iam.Effect.ALLOW,
                    actions: ['chime:CreateMeeting', 'chime:CreateMeetingWithAttendees'],
                    resources: ['*']
                })
            ]
        }));
        /**************************************************************************************************************
        * endMeetingForAllLambda *
        **************************************************************************************************************/
        const endMeetingForAllLambda = new nodeLambda.NodejsFunction(this, 'EndMeetingForAllLambda', {
            functionName: `${props.cdkAppName}-EndMeetingForAllLambda`,
            runtime: lambda.Runtime.NODEJS_12_X,
            entry: 'lambdas/handlers/ChimeAPI/endMeetingForAll.js',
            timeout: cdk.Duration.seconds(20),
            environment: {
                DDB_TABLE: props.appTable.tableName,
            }
        });
        props.appTable.grantReadWriteData(endMeetingForAllLambda);
        (_b = endMeetingForAllLambda.role) === null || _b === void 0 ? void 0 : _b.attachInlinePolicy(new iam.Policy(this, 'ChimeDeleteMeetingAccess', {
            statements: [
                new iam.PolicyStatement({
                    effect: iam.Effect.ALLOW,
                    actions: ['chime:DeleteMeeting'],
                    resources: ['*']
                })
            ]
        }));
        /**************************************************************************************************************
        * getAttendeeJoinDataLambda *
        **************************************************************************************************************/
        const getAttendeeJoinDataLambda = new nodeLambda.NodejsFunction(this, 'GetAttendeeJoinDataLambda', {
            functionName: `${props.cdkAppName}-GetAttendeeJoinDataLambda`,
            runtime: lambda.Runtime.NODEJS_12_X,
            entry: 'lambdas/handlers/ChimeAPI/getAttendeeJoinData.js',
            timeout: cdk.Duration.seconds(20),
            environment: {
                DDB_TABLE: props.appTable.tableName
            }
        });
        props.appTable.grantReadData(getAttendeeJoinDataLambda);
        this.getAttendeeJoinDataLambda = getAttendeeJoinDataLambda;
        /**************************************************************************************************************
        * getAttendeeNameLambda *
        **************************************************************************************************************/
        const getAttendeeNameLambda = new nodeLambda.NodejsFunction(this, 'GetAttendeeNameLambda', {
            functionName: `${props.cdkAppName}-GetAttendeeNameLambda`,
            runtime: lambda.Runtime.NODEJS_12_X,
            entry: 'lambdas/handlers/ChimeAPI/getAttendeeName.js',
            timeout: cdk.Duration.seconds(20),
            environment: {
                DDB_TABLE: props.appTable.tableName
            }
        });
        props.appTable.grantReadData(getAttendeeNameLambda);
        this.getAttendeeNameLambda = getAttendeeNameLambda;
        /**************************************************************************************************************
        * createAttendeeLambda *
        **************************************************************************************************************/
        const createAttendeeLambda = new nodeLambda.NodejsFunction(this, 'CreateAttendeeLambda', {
            functionName: `${props.cdkAppName}-CreateAttendeeLambda`,
            runtime: lambda.Runtime.NODEJS_12_X,
            entry: 'lambdas/handlers/ChimeAPI/createAttendee.js',
            timeout: cdk.Duration.seconds(20),
            environment: {
                DDB_TABLE: props.appTable.tableName
            }
        });
        props.appTable.grantReadWriteData(createAttendeeLambda);
        (_c = createAttendeeLambda.role) === null || _c === void 0 ? void 0 : _c.attachInlinePolicy(new iam.Policy(this, 'ChimeCreateAttendeeAccess', {
            statements: [
                new iam.PolicyStatement({
                    effect: iam.Effect.ALLOW,
                    actions: ['chime:CreateAttendee'],
                    resources: ['*']
                })
            ]
        }));
        /**************************************************************************************************************
        * ChimeAPI *
        **************************************************************************************************************/
        const chimeAPI = new apigw2.HttpApi(this, 'ChimeAPI', {
            apiName: `${props.cdkAppName}-ChimeAPI`,
            corsPreflight: {
                allowOrigins: props.SSMParams.agentAPIAllowedOrigins.split(',').map((item) => item.trim()),
                allowMethods: [apigw2.CorsHttpMethod.POST, apigw2.CorsHttpMethod.GET, apigw2.CorsHttpMethod.DELETE],
                allowHeaders: apigw.Cors.DEFAULT_HEADERS.concat(['cognitoIdToken'])
            }
        });
        //create chimeAPI Meeting Resources
        const createMeeting_Route = new apigw2.HttpRoute(this, 'CreateMeeting_Route', {
            httpApi: chimeAPI,
            integration: new apigw2i.LambdaProxyIntegration({ handler: createMeetingLambda }),
            routeKey: apigw2.HttpRouteKey.with('/meeting', apigw2.HttpMethod.POST)
        });
        const createMeeting_RouteCfn = createMeeting_Route.node.defaultChild;
        createMeeting_RouteCfn.authorizationType = 'AWS_IAM';
        const endMeetingForAll_Route = new apigw2.HttpRoute(this, 'EndMeetingForAll_Route', {
            httpApi: chimeAPI,
            integration: new apigw2i.LambdaProxyIntegration({ handler: endMeetingForAllLambda }),
            routeKey: apigw2.HttpRouteKey.with('/meeting', apigw2.HttpMethod.DELETE)
        });
        const endMeetingForAll_RouteCfn = endMeetingForAll_Route.node.defaultChild;
        endMeetingForAll_RouteCfn.authorizationType = 'AWS_IAM';
        //Allow Identity Pool to invoke ChimeAPI Meeting resources
        props.cognitoAuthenticatedRole.attachInlinePolicy(new iam.Policy(this, 'ChimeAPI_MeetingResources', {
            statements: [new iam.PolicyStatement({
                    effect: iam.Effect.ALLOW,
                    actions: ["execute-api:Invoke"],
                    resources: [
                        `arn:aws:execute-api:${this.region}:${this.account}:${chimeAPI.httpApiId}/$default/${createMeeting_RouteCfn.routeKey.replace(/\s+/g, '')}`,
                        `arn:aws:execute-api:${this.region}:${this.account}:${chimeAPI.httpApiId}/$default/${endMeetingForAll_RouteCfn.routeKey.replace(/\s+/g, '')}`,
                    ]
                })]
        }));
        //create chimeAPI Attendee Resources
        const getAttendeeName_Route = new apigw2.HttpRoute(this, 'GetAttendeeName_Route', {
            httpApi: chimeAPI,
            integration: new apigw2i.LambdaProxyIntegration({ handler: getAttendeeNameLambda }),
            routeKey: apigw2.HttpRouteKey.with('/attendee-name', apigw2.HttpMethod.GET)
        });
        const getAttendeeName_RouteCfn = getAttendeeName_Route.node.defaultChild;
        getAttendeeName_RouteCfn.authorizationType = 'AWS_IAM';
        const createAttendee_Route = new apigw2.HttpRoute(this, 'CreateAttendee_Route', {
            httpApi: chimeAPI,
            integration: new apigw2i.LambdaProxyIntegration({ handler: createAttendeeLambda }),
            routeKey: apigw2.HttpRouteKey.with('/attendee', apigw2.HttpMethod.POST)
        });
        const createAttendee_RouteCfn = createAttendee_Route.node.defaultChild;
        createAttendee_RouteCfn.authorizationType = 'AWS_IAM';
        //Allow Identity Pool to invoke ChimeAPI Attendee resources
        props.cognitoAuthenticatedRole.attachInlinePolicy(new iam.Policy(this, 'ChimeAPI_AttendeeResources', {
            statements: [new iam.PolicyStatement({
                    effect: iam.Effect.ALLOW,
                    actions: ["execute-api:Invoke"],
                    resources: [
                        `arn:aws:execute-api:${this.region}:${this.account}:${chimeAPI.httpApiId}/$default/${getAttendeeName_RouteCfn.routeKey.replace(/\s+/g, '')}`,
                        `arn:aws:execute-api:${this.region}:${this.account}:${chimeAPI.httpApiId}/$default/${createAttendee_RouteCfn.routeKey.replace(/\s+/g, '')}`,
                    ]
                })]
        }));
        this.chimeAPI = chimeAPI;
    }
}
exports.ChimeAPIStack = ChimeAPIStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hpbWVBUEktc3RhY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJjaGltZUFQSS1zdGFjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsMEVBQTBFO0FBQzFFLGlDQUFpQzs7O0FBRWpDLHFDQUFxQztBQUNyQyx5REFBeUQ7QUFDekQsOENBQThDO0FBQzlDLHdDQUF3QztBQUN4QyxpREFBaUQ7QUFDakQsb0RBQW9EO0FBQ3BELGtFQUFrRTtBQVVsRSxNQUFhLGFBQWMsU0FBUSxHQUFHLENBQUMsV0FBVztJQU85QyxZQUFZLEtBQW9CLEVBQUUsRUFBVSxFQUFFLEtBQXlCOztRQUNuRSxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUV4Qjs7dUhBRStHO1FBQy9HLE1BQU0sbUJBQW1CLEdBQUcsSUFBSSxVQUFVLENBQUMsY0FBYyxDQUFDLElBQUksRUFBRSxxQkFBcUIsRUFBRTtZQUNuRixZQUFZLEVBQUUsR0FBRyxLQUFLLENBQUMsVUFBVSxzQkFBc0I7WUFDdkQsT0FBTyxFQUFFLE1BQU0sQ0FBQyxPQUFPLENBQUMsV0FBVztZQUNuQyxLQUFLLEVBQUUsNENBQTRDO1lBQ25ELE9BQU8sRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7WUFDakMsV0FBVyxFQUFFO2dCQUNULFNBQVMsRUFBRSxLQUFLLENBQUMsUUFBUSxDQUFDLFNBQVM7YUFDdEM7U0FDSixDQUFDLENBQUE7UUFDRixLQUFLLENBQUMsUUFBUSxDQUFDLGtCQUFrQixDQUFDLG1CQUFtQixDQUFDLENBQUM7UUFFdkQsTUFBQSxtQkFBbUIsQ0FBQyxJQUFJLDBDQUFFLGtCQUFrQixDQUFDLElBQUksR0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsMEJBQTBCLEVBQUU7WUFDMUYsVUFBVSxFQUFFO2dCQUNSLElBQUksR0FBRyxDQUFDLGVBQWUsQ0FBQztvQkFDcEIsTUFBTSxFQUFFLEdBQUcsQ0FB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bnQiOlsiLy8gQ29weXJpZ2h0IDIwMjEgQW1hem9uLmNvbSwgSW5jLiBvciBpdHMgYWZmaWxpYXRlcy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vIFNQRFgtTGljZW5zZS1JZGVudGlmaWVyOiBNSVQtMFxuXG5pbXBvcnQgKiBhcyBjZGsgZnJvbSAnQGF3cy1jZGsvY29yZSc7XG5pbXBvcnQgKiBhcyBub2RlTGFtYmRhIGZyb20gXCJAYXdzLWNkay9hd3MtbGFtYmRhLW5vZGVqc1wiO1xuaW1wb3J0ICogYXMgbGFtYmRhIGZyb20gJ0Bhd3MtY2RrL2F3cy1sYW1iZGEnO1xuaW1wb3J0ICogYXMgaWFtIGZyb20gJ0Bhd3MtY2RrL2F3cy1pYW0nO1xuaW1wb3J0ICogYXMgYXBpZ3cgZnJvbSAnQGF3cy1jZGsvYXdzLWFwaWdhdGV3YXknO1xuaW1wb3J0ICogYXMgYXBpZ3cyIGZyb20gXCJAYXdzLWNkay9hd3MtYXBpZ2F0ZXdheXYyXCI7XG5pbXBvcnQgKiBhcyBhcGlndzJpIGZyb20gXCJAYXdzLWNkay9hd3MtYXBpZ2F0ZXdheXYyLWludGVncmF0aW9uc1wiO1xuaW1wb3J0ICogYXMgZGRiIGZyb20gJ0Bhd3MtY2RrL2F3cy1keW5hbW9kYic7XG5cbmV4cG9ydCBpbnRlcmZhY2UgQ2hpbWVBUElTdGFja1Byb3BzIGV4dGVuZHMgY2RrLk5lc3RlZFN0YWNrUHJvcHMge1xuICAgIHJlYWRvbmx5IFNTTVBhcmFtczogYW55O1xuICAgIHJlYWRvbmx5IGNvZ25pdG9BdXRoZW50aWNhdGVkUm9sZTogaWFtLklSb2xlO1xuICAgIHJlYWRvbmx5IGFwcFRhYmxlOiBkZGIuSVRhYmxlO1xuICAgIHJlYWRvbmx5IGNka0FwcE5hbWU6IHN0cmluZztcbn1cblxuZXhwb3J0IGNsYXNzIENoaW1lQVBJU3RhY2sgZXh0ZW5kcyBjZGsuTmVzdGVkU3RhY2sge1xuXG4gICAgcHVibGljIHJlYWRvbmx5IGdldEF0dGVuZGVlTmFtZUxhbWJkYTogbGFtYmRhLklGdW5jdGlvbjtcbiAgICBwdWJsaWMgcmVhZG9ubHkgZ2V0QXR0ZW5kZWVKb2luRGF0YUxhbWJkYTogbGFtYmRhLklGdW5jdGlvbjtcblxuICAgIHB1YmxpYyByZWFkb25seSBjaGltZUFQSTogYXBpZ3cyLklIdHRwQXBpO1xuXG4gICAgY29uc3RydWN0b3Ioc2NvcGU6IGNkay5Db25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzOiBDaGltZUFQSVN0YWNrUHJvcHMpIHtcbiAgICAgICAgc3VwZXIoc2NvcGUsIGlkLCBwcm9wcyk7XG5cbiAgICAgICAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gICAgICAgICogY3JlYXRlTWVldGluZ0xhbWJkYSAqXG4gICAgICAgICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuICAgICAgICBjb25zdCBjcmVhdGVNZWV0aW5nTGFtYmRhID0gbmV3IG5vZGVMYW1iZGEuTm9kZWpzRnVuY3Rpb24odGhpcywgJ0NyZWF0ZU1lZXRpbmdMYW1iZGEnLCB7XG4gICAgICAgICAgICBmdW5jdGlvbk5hbWU6IGAke3Byb3BzLmNka0FwcE5hbWV9LUNyZWF0ZU1lZXRpbmdMYW1iZGFgLFxuICAgICAgICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuTk9ERUpTXzEyX1gsXG4gICAgICAgICAgICBlbnRyeTogJ2xhbWJkYXMvaGFuZGxlcnMvQ2hpbWVBUEkvY3JlYXRlTWVldGluZy5qcycsXG4gICAgICAgICAgICB0aW1lb3V0OiBjZGsuRHVyYXRpb24uc2Vjb25kcygyMCksXG4gICAgICAgICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICAgICAgICAgIEREQl9UQUJMRTogcHJvcHMuYXBwVGFibGUudGFibGVOYW1lXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICAgIHByb3BzLmFwcFRhYmxlLmdyYW50UmVhZFdyaXRlRGF0YShjcmVhdGVNZWV0aW5nTGFtYmRhKTtcblxuICAgICAgICBjcmVhdGVNZWV0aW5nTGFtYmRhLnJvbGU/LmF0dGFjaElubGluZVBvbGljeShuZXcgaWFtLlBvbGljeSh0aGlzLCAnQ2hpbWVDcmVhdGVNZWV0aW5nQWNjZXNzJywge1xuICAgICAgICAgICAgc3RhdGVtZW50czogW1xuICAgICAgICAgICAgICAgIG5ldyBpYW0uUG9saWN5U3RhdGVtZW50KHtcbiAgICAgICAgICAgICAgICAgICAgZWZmZWN0OiBpYW0uRWZmZWN0LkFMTE9XLFxuICAgICAgICAgICAgICAgICAgICBhY3Rpb25zOiBbJ2NoaW1lOkNyZWF0ZU1lZXRpbmcnLCAnY2hpbWU6Q3JlYXRlTWVldGluZ1dpdGhBdHRlbmRlZXMnXSxcbiAgICAgICAgICAgICAgICAgICAgcmVzb3VyY2VzOiBbJyonXVxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICBdXG4gICAgICAgIH0pKTtcblxuICAgICAgICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAgICAgICAgKiBlbmRNZWV0aW5nRm9yQWxsTGFtYmRhICpcbiAgICAgICAgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG4gICAgICAgIGNvbnN0IGVuZE1lZXRpbmdGb3JBbGxMYW1iZGEgPSBuZXcgbm9kZUxhbWJkYS5Ob2RlanNGdW5jdGlvbih0aGlzLCAnRW5kTWVldGluZ0ZvckFsbExhbWJkYScsIHtcbiAgICAgICAgICAgIGZ1bmN0aW9uTmFtZTogYCR7cHJvcHMuY2RrQXBwTmFtZX0tRW5kTWVldGluZ0ZvckFsbExhbWJkYWAsXG4gICAgICAgICAgICBydW50aW1lOiBsYW1iZGEuUnVudGltZS5OT0RFSlNfMTJfWCxcbiAgICAgICAgICAgIGVudHJ5OiAnbGFtYmRhcy9oYW5kbGVycy9DaGltZUFQSS9lbmRNZWV0aW5nRm9yQWxsLmpzJyxcbiAgICAgICAgICAgIHRpbWVvdXQ6IGNkay5EdXJhdGlvbi5zZWNvbmRzKDIwKSxcbiAgICAgICAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgICAgICAgICAgRERCX1RBQkxFOiBwcm9wcy5hcHBUYWJsZS50YWJsZU5hbWUsXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICAgIHByb3BzLmFwcFRhYmxlLmdyYW50UmVhZFdyaXRlRGF0YShlbmRNZWV0aW5nRm9yQWxsTGFtYmRhKTtcblxuICAgICAgICBlbmRNZWV0aW5nRm9yQWxsTGFtYmRhLnJvbGU/LmF0dGFjaElubGluZVBvbGljeShuZXcgaWFtLlBvbGljeSh0aGlzLCAnQ2hpbWVEZWxldGVNZWV0aW5nQWNjZXNzJywge1xuICAgICAgICAgICAgc3RhdGVtZW50czogW1xuICAgICAgICAgICAgICAgIG5ldyBpYW0uUG9saWN5U3RhdGVtZW50KHtcbiAgICAgICAgICAgICAgICAgICAgZWZmZWN0OiBpYW0uRWZmZWN0LkFMTE9XLFxuICAgICAgICAgICAgICAgICAgICBhY3Rpb25zOiBbJ2NoaW1lOkRlbGV0ZU1lZXRpbmcnXSxcbiAgICAgICAgICAgICAgICAgICAgcmVzb3VyY2VzOiBbJyonXVxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICBdXG4gICAgICAgIH0pKTtcblxuICAgICAgICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAgICAgICAgKiBnZXRBdHRlbmRlZUpvaW5EYXRhTGFtYmRhICpcbiAgICAgICAgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG4gICAgICAgIGNvbnN0IGdldEF0dGVuZGVlSm9pbkRhdGFMYW1iZGEgPSBuZXcgbm9kZUxhbWJkYS5Ob2RlanNGdW5jdGlvbih0aGlzLCAnR2V0QXR0ZW5kZWVKb2luRGF0YUxhbWJkYScsIHtcbiAgICAgICAgICAgIGZ1bmN0aW9uTmFtZTogYCR7cHJvcHMuY2RrQXBwTmFtZX0tR2V0QXR0ZW5kZWVKb2luRGF0YUxhbWJkYWAsXG4gICAgICAgICAgICBydW50aW1lOiBsYW1iZGEuUnVudGltZS5OT0RFSlNfMTJfWCxcbiAgICAgICAgICAgIGVudHJ5OiAnbGFtYmRhcy9oYW5kbGVycy9DaGltZUFQSS9nZXRBdHRlbmRlZUpvaW5EYXRhLmpzJyxcbiAgICAgICAgICAgIHRpbWVvdXQ6IGNkay5EdXJhdGlvbi5zZWNvbmRzKDIwKSxcbiAgICAgICAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgICAgICAgICAgRERCX1RBQkxFOiBwcm9wcy5hcHBUYWJsZS50YWJsZU5hbWVcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgICAgcHJvcHMuYXBwVGFibGUuZ3JhbnRSZWFkRGF0YShnZXRBdHRlbmRlZUpvaW5EYXRhTGFtYmRhKTtcbiAgICAgICAgdGhpcy5nZXRBdHRlbmRlZUpvaW5EYXRhTGFtYmRhID0gZ2V0QXR0ZW5kZWVKb2luRGF0YUxhbWJkYTtcblxuICAgICAgICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAgICAgICAgKiBnZXRBdHRlbmRlZU5hbWVMYW1iZGEgKlxuICAgICAgICAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cbiAgICAgICAgY29uc3QgZ2V0QXR0ZW5kZWVOYW1lTGFtYmRhID0gbmV3IG5vZGVMYW1iZGEuTm9kZWpzRnVuY3Rpb24odGhpcywgJ0dldEF0dGVuZGVlTmFtZUxhbWJkYScsIHtcbiAgICAgICAgICAgIGZ1bmN0aW9uTmFtZTogYCR7cHJvcHMuY2RrQXBwTmFtZX0tR2V0QXR0ZW5kZWVOYW1lTGFtYmRhYCxcbiAgICAgICAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18xMl9YLFxuICAgICAgICAgICAgZW50cnk6ICdsYW1iZGFzL2hhbmRsZXJzL0NoaW1lQVBJL2dldEF0dGVuZGVlTmFtZS5qcycsXG4gICAgICAgICAgICB0aW1lb3V0OiBjZGsuRHVyYXRpb24uc2Vjb25kcygyMCksXG4gICAgICAgICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICAgICAgICAgIEREQl9UQUJMRTogcHJvcHMuYXBwVGFibGUudGFibGVOYW1lXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBwcm9wcy5hcHBUYWJsZS5ncmFudFJlYWREYXRhKGdldEF0dGVuZGVlTmFtZUxhbWJkYSk7XG4gICAgICAgIHRoaXMuZ2V0QXR0ZW5kZWVOYW1lTGFtYmRhID0gZ2V0QXR0ZW5kZWVOYW1lTGFtYmRhO1xuXG4gICAgICAgIC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICAgICAgICAqIGNyZWF0ZUF0dGVuZGVlTGFtYmRhICpcbiAgICAgICAgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG4gICAgICAgIGNvbnN0IGNyZWF0ZUF0dGVuZGVlTGFtYmRhID0gbmV3IG5vZGVMYW1iZGEuTm9kZWpzRnVuY3Rpb24odGhpcywgJ0NyZWF0ZUF0dGVuZGVlTGFtYmRhJywge1xuICAgICAgICAgICAgZnVuY3Rpb25OYW1lOiBgJHtwcm9wcy5jZGtBcHBOYW1lfS1DcmVhdGVBdHRlbmRlZUxhbWJkYWAsXG4gICAgICAgICAgICBydW50aW1lOiBsYW1iZGEuUnVudGltZS5OT0RFSlNfMTJfWCxcbiAgICAgICAgICAgIGVudHJ5OiAnbGFtYmRhcy9oYW5kbGVycy9DaGltZUFQSS9jcmVhdGVBdHRlbmRlZS5qcycsXG4gICAgICAgICAgICB0aW1lb3V0OiBjZGsuRHVyYXRpb24uc2Vjb25kcygyMCksXG4gICAgICAgICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICAgICAgICAgIEREQl9UQUJMRTogcHJvcHMuYXBwVGFibGUudGFibGVOYW1lXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBwcm9wcy5hcHBUYWJsZS5ncmFudFJlYWRXcml0ZURhdGEoY3JlYXRlQXR0ZW5kZWVMYW1iZGEpO1xuXG4gICAgICAgIGNyZWF0ZUF0dGVuZGVlTGFtYmRhLnJvbGU/LmF0dGFjaElubGluZVBvbGljeShuZXcgaWFtLlBvbGljeSh0aGlzLCAnQ2hpbWVDcmVhdGVBdHRlbmRlZUFjY2VzcycsIHtcbiAgICAgICAgICAgIHN0YXRlbWVudHM6IFtcbiAgICAgICAgICAgICAgICBuZXcgaWFtLlBvbGljeVN0YXRlbWVudCh7XG4gICAgICAgICAgICAgICAgICAgIGVmZmVjdDogaWFtLkVmZmVjdC5BTExPVyxcbiAgICAgICAgICAgICAgICAgICAgYWN0aW9uczogWydjaGltZTpDcmVhdGVBdHRlbmRlZSddLFxuICAgICAgICAgICAgICAgICAgICByZXNvdXJjZXM6IFsnKiddXG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIF1cbiAgICAgICAgfSkpO1xuXG4gICAgICAgIC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICAgICAgICAqIENoaW1lQVBJICpcbiAgICAgICAgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG4gICAgICAgIGNvbnN0IGNoaW1lQVBJID0gbmV3IGFwaWd3Mi5IdHRwQXBpKHRoaXMsICdDaGltZUFQSScsIHtcbiAgICAgICAgICAgIGFwaU5hbWU6IGAke3Byb3BzLmNka0FwcE5hbWV9LUNoaW1lQVBJYCxcbiAgICAgICAgICAgIGNvcnNQcmVmbGlnaHQ6IHtcbiAgICAgICAgICAgICAgICBhbGxvd09yaWdpbnM6IHByb3BzLlNTTVBhcmFtcy5hZ2VudEFQSUFsbG93ZWRPcmlnaW5zLnNwbGl0KCcsJykubWFwKChpdGVtOiBzdHJpbmcpID0+IGl0ZW0udHJpbSgpKSxcbiAgICAgICAgICAgICAgICBhbGxvd01ldGhvZHM6IFthcGlndzIuQ29yc0h0dHBNZXRob2QuUE9TVCwgYXBpZ3cyLkNvcnNIdHRwTWV0aG9kLkdFVCwgYXBpZ3cyLkNvcnNIdHRwTWV0aG9kLkRFTEVURV0sXG4gICAgICAgICAgICAgICAgYWxsb3dIZWFkZXJzOiBhcGlndy5Db3JzLkRFRkFVTFRfSEVBREVSUy5jb25jYXQoWydjb2duaXRvSWRUb2tlbiddKVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICAvL2NyZWF0ZSBjaGltZUFQSSBNZWV0aW5nIFJlc291cmNlc1xuICAgICAgICBjb25zdCBjcmVhdGVNZWV0aW5nX1JvdXRlID0gbmV3IGFwaWd3Mi5IdHRwUm91dGUodGhpcywgJ0NyZWF0ZU1lZXRpbmdfUm91dGUnLCB7XG4gICAgICAgICAgICBodHRwQXBpOiBjaGltZUFQSSxcbiAgICAgICAgICAgIGludGVncmF0aW9uOiBuZXcgYXBpZ3cyaS5MYW1iZGFQcm94eUludGVncmF0aW9uKHsgaGFuZGxlcjogY3JlYXRlTWVldGluZ0xhbWJkYSB9KSxcbiAgICAgICAgICAgIHJvdXRlS2V5OiBhcGlndzIuSHR0cFJvdXRlS2V5LndpdGgoJy9tZWV0aW5nJywgYXBpZ3cyLkh0dHBNZXRob2QuUE9TVClcbiAgICAgICAgfSk7XG4gICAgICAgIGNvbnN0IGNyZWF0ZU1lZXRpbmdfUm91dGVDZm4gPSBjcmVhdGVNZWV0aW5nX1JvdXRlLm5vZGUuZGVmYXVsdENoaWxkIGFzIGFwaWd3Mi5DZm5Sb3V0ZTtcbiAgICAgICAgY3JlYXRlTWVldGluZ19Sb3V0ZUNmbi5hdXRob3JpemF0aW9uVHlwZSA9ICdBV1NfSUFNJztcblxuICAgICAgICBjb25zdCBlbmRNZWV0aW5nRm9yQWxsX1JvdXRlID0gbmV3IGFwaWd3Mi5IdHRwUm91dGUodGhpcywgJ0VuZE1lZXRpbmdGb3JBbGxfUm91dGUnLCB7XG4gICAgICAgICAgICBodHRwQXBpOiBjaGltZUFQSSxcbiAgICAgICAgICAgIGludGVncmF0aW9uOiBuZXcgYXBpZ3cyaS5MYW1iZGFQcm94eUludGVncmF0aW9uKHsgaGFuZGxlcjogZW5kTWVldGluZ0ZvckFsbExhbWJkYSB9KSxcbiAgICAgICAgICAgIHJvdXRlS2V5OiBhcGlndzIuSHR0cFJvdXRlS2V5LndpdGgoJy9tZWV0aW5nJywgYXBpZ3cyLkh0dHBNZXRob2QuREVMRVRFKVxuICAgICAgICB9KTtcbiAgICAgICAgY29uc3QgZW5kTWVldGluZ0ZvckFsbF9Sb3V0ZUNmbiA9IGVuZE1lZXRpbmdGb3JBbGxfUm91dGUubm9kZS5kZWZhdWx0Q2hpbGQgYXMgYXBpZ3cyLkNmblJvdXRlO1xuICAgICAgICBlbmRNZWV0aW5nRm9yQWxsX1JvdXRlQ2ZuLmF1dGhvcml6YXRpb25UeXBlID0gJ0FXU19JQU0nO1xuXG4gICAgICAgIC8vQWxsb3cgSWRlbnRpdHkgUG9vbCB0byBpbnZva2UgQ2hpbWVBUEkgTWVldGluZyByZXNvdXJjZXNcbiAgICAgICAgcHJvcHMuY29nbml0b0F1dGhlbnRpY2F0ZWRSb2xlLmF0dGFjaElubGluZVBvbGljeShuZXcgaWFtLlBvbGljeSh0aGlzLCAnQ2hpbWVBUElfTWVldGluZ1Jlc291cmNlcycsIHtcbiAgICAgICAgICAgIHN0YXRlbWVudHM6IFtuZXcgaWFtLlBvbGljeVN0YXRlbWVudCh7XG4gICAgICAgICAgICAgICAgZWZmZWN0OiBpYW0uRWZmZWN0LkFMTE9XLFxuICAgICAgICAgICAgICAgIGFjdGlvbnM6IFtcImV4ZWN1dGUtYXBpOkludm9rZVwiXSxcbiAgICAgICAgICAgICAgICByZXNvdXJjZXM6IFtcbiAgICAgICAgICAgICAgICAgICAgYGFybjphd3M6ZXhlY3V0ZS1hcGk6JHt0aGlzLnJlZ2lvbn06JHt0aGlzLmFjY291bnR9OiR7Y2hpbWVBUEkuaHR0cEFwaUlkfS8kZGVmYXVsdC8ke2NyZWF0ZU1lZXRpbmdfUm91dGVDZm4ucm91dGVLZXkucmVwbGFjZSgvXFxzKy9nLCAnJyl9YCxcbiAgICAgICAgICAgICAgICAgICAgYGFybjphd3M6ZXhlY3V0ZS1hcGk6JHt0aGlzLnJlZ2lvbn06JHt0aGlzLmFjY291bnR9OiR7Y2hpbWVBUEkuaHR0cEFwaUlkfS8kZGVmYXVsdC8ke2VuZE1lZXRpbmdGb3JBbGxfUm91dGVDZm4ucm91dGVLZXkucmVwbGFjZSgvXFxzKy9nLCAnJyl9YCxcbiAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICB9KV1cbiAgICAgICAgfSkpO1xuXG4gICAgICAgIC8vY3JlYXRlIGNoaW1lQVBJIEF0dGVuZGVlIFJlc291cmNlc1xuICAgICAgICBjb25zdCBnZXRBdHRlbmRlZU5hbWVfUm91dGUgPSBuZXcgYXBpZ3cyLkh0dHBSb3V0ZSh0aGlzLCAnR2V0QXR0ZW5kZWVOYW1lX1JvdXRlJywge1xuICAgICAgICAgICAgaHR0cEFwaTogY2hpbWVBUEksXG4gICAgICAgICAgICBpbnRlZ3JhdGlvbjogbmV3IGFwaWd3MmkuTGFtYmRhUHJveHlJbnRlZ3JhdGlvbih7IGhhbmRsZXI6IGdldEF0dGVuZGVlTmFtZUxhbWJkYSB9KSxcbiAgICAgICAgICAgIHJvdXRlS2V5OiBhcGlndzIuSHR0cFJvdXRlS2V5LndpdGgoJy9hdHRlbmRlZS1uYW1lJywgYXBpZ3cyLkh0dHBNZXRob2QuR0VUKVxuICAgICAgICB9KTtcbiAgICAgICAgY29uc3QgZ2V0QXR0ZW5kZWVOYW1lX1JvdXRlQ2ZuID0gZ2V0QXR0ZW5kZWVOYW1lX1JvdXRlLm5vZGUuZGVmYXVsdENoaWxkIGFzIGFwaWd3Mi5DZm5Sb3V0ZTtcbiAgICAgICAgZ2V0QXR0ZW5kZWVOYW1lX1JvdXRlQ2ZuLmF1dGhvcml6YXRpb25UeXBlID0gJ0FXU19JQU0nO1xuXG4gICAgICAgIGNvbnN0IGNyZWF0ZUF0dGVuZGVlX1JvdXRlID0gbmV3IGFwaWd3Mi5IdHRwUm91dGUodGhpcywgJ0NyZWF0ZUF0dGVuZGVlX1JvdXRlJywge1xuICAgICAgICAgICAgaHR0cEFwaTogY2hpbWVBUEksXG4gICAgICAgICAgICBpbnRlZ3JhdGlvbjogbmV3IGFwaWd3MmkuTGFtYmRhUHJveHlJbnRlZ3JhdGlvbih7IGhhbmRsZXI6IGNyZWF0ZUF0dGVuZGVlTGFtYmRhIH0pLFxuICAgICAgICAgICAgcm91dGVLZXk6IGFwaWd3Mi5IdHRwUm91dGVLZXkud2l0aCgnL2F0dGVuZGVlJywgYXBpZ3cyLkh0dHBNZXRob2QuUE9TVClcbiAgICAgICAgfSk7XG4gICAgICAgIGNvbnN0IGNyZWF0ZUF0dGVuZGVlX1JvdXRlQ2ZuID0gY3JlYXRlQXR0ZW5kZWVfUm91dGUubm9kZS5kZWZhdWx0Q2hpbGQgYXMgYXBpZ3cyLkNmblJvdXRlO1xuICAgICAgICBjcmVhdGVBdHRlbmRlZV9Sb3V0ZUNmbi5hdXRob3JpemF0aW9uVHlwZSA9ICdBV1NfSUFNJztcblxuICAgICAgICAvL0FsbG93IElkZW50aXR5IFBvb2wgdG8gaW52b2tlIENoaW1lQVBJIEF0dGVuZGVlIHJlc291cmNlc1xuICAgICAgICBwcm9wcy5jb2duaXRvQXV0aGVudGljYXRlZFJvbGUuYXR0YWNoSW5saW5lUG9saWN5KG5ldyBpYW0uUG9saWN5KHRoaXMsICdDaGltZUFQSV9BdHRlbmRlZVJlc291cmNlcycsIHtcbiAgICAgICAgICAgIHN0YXRlbWVudHM6IFtuZXcgaWFtLlBvbGljeVN0YXRlbWVudCh7XG4gICAgICAgICAgICAgICAgZWZmZWN0OiBpYW0uRWZmZWN0LkFMTE9XLFxuICAgICAgICAgICAgICAgIGFjdGlvbnM6IFtcImV4ZWN1dGUtYXBpOkludm9rZVwiXSxcbiAgICAgICAgICAgICAgICByZXNvdXJjZXM6IFtcbiAgICAgICAgICAgICAgICAgICAgYGFybjphd3M6ZXhlY3V0ZS1hcGk6JHt0aGlzLnJlZ2lvbn06JHt0aGlzLmFjY291bnR9OiR7Y2hpbWVBUEkuaHR0cEFwaUlkfS8kZGVmYXVsdC8ke2dldEF0dGVuZGVlTmFtZV9Sb3V0ZUNmbi5yb3V0ZUtleS5yZXBsYWNlKC9cXHMrL2csICcnKX1gLFxuICAgICAgICAgICAgICAgICAgICBgYXJuOmF3czpleGVjdXRlLWFwaToke3RoaXMucmVnaW9ufToke3RoaXMuYWNjb3VudH06JHtjaGltZUFQSS5odHRwQXBpSWR9LyRkZWZhdWx0LyR7Y3JlYXRlQXR0ZW5kZWVfUm91dGVDZm4ucm91dGVLZXkucmVwbGFjZSgvXFxzKy9nLCAnJyl9YCxcbiAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICB9KV1cbiAgICAgICAgfSkpO1xuXG4gICAgICAgIHRoaXMuY2hpbWVBUEkgPSBjaGltZUFQSTtcbiAgICB9XG59Il19