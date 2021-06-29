"use strict";
// Copyright 2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatAPIStack = void 0;
const cdk = require("@aws-cdk/core");
const nodeLambda = require("@aws-cdk/aws-lambda-nodejs");
const lambda = require("@aws-cdk/aws-lambda");
const apigw = require("@aws-cdk/aws-apigateway");
const apigw2 = require("@aws-cdk/aws-apigatewayv2");
const apigw2i = require("@aws-cdk/aws-apigatewayv2-integrations");
const iam = require("@aws-cdk/aws-iam");
class ChatAPIStack extends cdk.NestedStack {
    constructor(scope, id, props) {
        var _a;
        super(scope, id, props);
        //create startChat Lambda
        const startChatLambda = new nodeLambda.NodejsFunction(this, 'StartChatLambda', {
            functionName: `${props.cdkAppName}-StartChatLambda`,
            runtime: lambda.Runtime.NODEJS_12_X,
            entry: 'lambdas/handlers/ChatAPI/startChat.js',
            timeout: cdk.Duration.seconds(20),
            environment: {
                ConnectInstanceId: props.SSMParams.connectInstanceARN.split('/')[1],
                DDB_TABLE: props.appTable.tableName,
            }
        });
        props.appTable.grantReadWriteData(startChatLambda);
        //Allow chatAPI to invoke Amazon Connect
        (_a = startChatLambda.role) === null || _a === void 0 ? void 0 : _a.attachInlinePolicy(new iam.Policy(this, 'ConnectChatAPIAccess', {
            statements: [
                new iam.PolicyStatement({
                    effect: iam.Effect.ALLOW,
                    actions: ["connect:StartChatContact"],
                    resources: [props.SSMParams.connectInstanceARN + '/*']
                })
            ]
        }));
        const chatAPI = new apigw2.HttpApi(this, 'ChatAPI', {
            apiName: `${props.cdkAppName}-ChatAPI`,
            corsPreflight: {
                allowOrigins: props.SSMParams.websiteAPIAllowedOrigins.split(',').map((item) => item.trim()),
                allowMethods: [apigw2.CorsHttpMethod.POST],
                allowHeaders: apigw.Cors.DEFAULT_HEADERS
            }
        });
        const startChat_Route = new apigw2.HttpRoute(this, 'StartChat_Route', {
            httpApi: chatAPI,
            integration: new apigw2i.LambdaProxyIntegration({ handler: startChatLambda }),
            routeKey: apigw2.HttpRouteKey.with('/start', apigw2.HttpMethod.POST)
        });
        this.chatAPI = chatAPI;
    }
}
exports.ChatAPIStack = ChatAPIStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhdEFQSS1zdGFjay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImNoYXRBUEktc3RhY2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLDBFQUEwRTtBQUMxRSxpQ0FBaUM7OztBQUVqQyxxQ0FBcUM7QUFDckMseURBQXlEO0FBQ3pELDhDQUE4QztBQUM5QyxpREFBaUQ7QUFDakQsb0RBQW9EO0FBQ3BELGtFQUFrRTtBQUVsRSx3Q0FBd0M7QUFReEMsTUFBYSxZQUFhLFNBQVEsR0FBRyxDQUFDLFdBQVc7SUFJN0MsWUFBWSxLQUFvQixFQUFFLEVBQVUsRUFBRSxLQUF3Qjs7UUFDbEUsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFFeEIseUJBQXlCO1FBQ3pCLE1BQU0sZUFBZSxHQUFHLElBQUksVUFBVSxDQUFDLGNBQWMsQ0FBQyxJQUFJLEVBQUUsaUJBQWlCLEVBQUU7WUFDM0UsWUFBWSxFQUFFLEdBQUcsS0FBSyxDQUFDLFVBQVUsa0JBQWtCO1lBQ25ELE9BQU8sRUFBRSxNQUFNLENBQUMsT0FBTyxDQUFDLFdBQVc7WUFDbkMsS0FBSyxFQUFFLHVDQUF1QztZQUM5QyxPQUFPLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDO1lBQ2pDLFdBQVcsRUFBRTtnQkFDVCxpQkFBaUIsRUFBRSxLQUFLLENBQUMsU0FBUyxDQUFDLGtCQUFrQixDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ25FLFNBQVMsRUFBRSxLQUFLLENBQUMsUUFBUSxDQUFDLFNBQVM7YUFDdEM7U0FDSixDQUFDLENBQUM7UUFDSCxLQUFLLENBQUMsUUFBUSxDQUFDLGtCQUFrQixDQUFDLGVBQWUsQ0FBQyxDQUFDO1FBRW5ELHdDQUF3QztRQUN4QyxNQUFBLGVBQWUsQ0FBQyxJQUFJLDBDQUFFLGtCQUFrQixDQUFDLElBQUksR0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsc0JBQXNCLEVBQUU7WUFDbEYsVUFBVSxFQUFFO2dCQUNSLElBQUksR0FBRyxDQUFDLGVBQWUsQ0FBQztvQkFDcEIsTUFBTSxFQUFFLEdBQUcsQ0FBQyxNQUFNLENBQUMsS0FBSztvQkFDeEIsT0FBTyxFQUFFLENBQUMsMEJBQTBCLENBQUM7b0JBQ3JDLFNBQVMsRUFBRSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsa0JBQWtCLEdBQUcsSUFBSSxDQUFDO2lCQUN6RCxDQUFDO2FBQ0w7U0FDSixDQUFDLEVBQUU7UUFFSixNQUFNLE9BQU8sR0FBRyxJQUFJLE1BQU0sQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLFNBQVMsRUFBRTtZQUNoRCxPQUFPLEVBQUUsR0FBRyxLQUFLLENBQUMsVUFBVSxVQUFVO1lBQ3RDLGFBQWEsRUFBRTtnQkFDWCxZQUFZLEVBQUUsS0FBSyxDQUFDLFNBQVMsQ0FBQyx3QkFBd0IsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBWSxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7Z0JBQ3BHLFlBQVksRUFBRSxDQUFDLE1BQU0sQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDO2dCQUMxQyxZQUFZLEVBQUUsS0FBSyxDQUFDLElBQUksQ0FBQyxlQUFlO2FBQzNDO1NBQ0osQ0FBQyxDQUFDO1FBRUgsTUFBTSxlQUFlLEdBQUcsSUFBSSxNQUFNLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxpQkFBaUIsRUFBRTtZQUNsRSxPQUFPLEVBQUUsT0FBTztZQUNoQixXQUFXLEVBQUUsSUFBSSxPQUFPLENBQUMsc0JBQXNCLENBQUMsRUFBRSxPQUFPLEVBQUUsZUFBZSxFQUFFLENBQUM7WUFDN0UsUUFBUSxFQUFFLE1BQU0sQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxNQUFNLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQztTQUN2RSxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQztJQUMzQixDQUFDO0NBQ0o7QUFoREQsb0NBZ0RDIiwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMjEgQW1hem9uLmNvbSwgSW5jLiBvciBpdHMgYWZmaWxpYXRlcy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vIFNQRFgtTGljZW5zZS1JZGVudGlmaWVyOiBNSVQtMFxuXG5pbXBvcnQgKiBhcyBjZGsgZnJvbSAnQGF3cy1jZGsvY29yZSc7XG5pbXBvcnQgKiBhcyBub2RlTGFtYmRhIGZyb20gXCJAYXdzLWNkay9hd3MtbGFtYmRhLW5vZGVqc1wiO1xuaW1wb3J0ICogYXMgbGFtYmRhIGZyb20gJ0Bhd3MtY2RrL2F3cy1sYW1iZGEnO1xuaW1wb3J0ICogYXMgYXBpZ3cgZnJvbSAnQGF3cy1jZGsvYXdzLWFwaWdhdGV3YXknO1xuaW1wb3J0ICogYXMgYXBpZ3cyIGZyb20gXCJAYXdzLWNkay9hd3MtYXBpZ2F0ZXdheXYyXCI7XG5pbXBvcnQgKiBhcyBhcGlndzJpIGZyb20gXCJAYXdzLWNkay9hd3MtYXBpZ2F0ZXdheXYyLWludGVncmF0aW9uc1wiO1xuaW1wb3J0ICogYXMgZGRiIGZyb20gJ0Bhd3MtY2RrL2F3cy1keW5hbW9kYic7XG5pbXBvcnQgKiBhcyBpYW0gZnJvbSAnQGF3cy1jZGsvYXdzLWlhbSc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgQ2hhdEFQSVN0YWNrUHJvcHMgZXh0ZW5kcyBjZGsuTmVzdGVkU3RhY2tQcm9wcyB7XG4gICAgcmVhZG9ubHkgU1NNUGFyYW1zOiBhbnk7XG4gICAgcmVhZG9ubHkgYXBwVGFibGU6IGRkYi5JVGFibGU7XG4gICAgcmVhZG9ubHkgY2RrQXBwTmFtZTogc3RyaW5nO1xufVxuXG5leHBvcnQgY2xhc3MgQ2hhdEFQSVN0YWNrIGV4dGVuZHMgY2RrLk5lc3RlZFN0YWNrIHtcblxuICAgIHB1YmxpYyByZWFkb25seSBjaGF0QVBJOiBhcGlndzIuSUh0dHBBcGk7XG5cbiAgICBjb25zdHJ1Y3RvcihzY29wZTogY2RrLkNvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM6IENoYXRBUElTdGFja1Byb3BzKSB7XG4gICAgICAgIHN1cGVyKHNjb3BlLCBpZCwgcHJvcHMpO1xuXG4gICAgICAgIC8vY3JlYXRlIHN0YXJ0Q2hhdCBMYW1iZGFcbiAgICAgICAgY29uc3Qgc3RhcnRDaGF0TGFtYmRhID0gbmV3IG5vZGVMYW1iZGEuTm9kZWpzRnVuY3Rpb24odGhpcywgJ1N0YXJ0Q2hhdExhbWJkYScsIHtcbiAgICAgICAgICAgIGZ1bmN0aW9uTmFtZTogYCR7cHJvcHMuY2RrQXBwTmFtZX0tU3RhcnRDaGF0TGFtYmRhYCxcbiAgICAgICAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18xMl9YLFxuICAgICAgICAgICAgZW50cnk6ICdsYW1iZGFzL2hhbmRsZXJzL0NoYXRBUEkvc3RhcnRDaGF0LmpzJyxcbiAgICAgICAgICAgIHRpbWVvdXQ6IGNkay5EdXJhdGlvbi5zZWNvbmRzKDIwKSxcbiAgICAgICAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgICAgICAgICAgQ29ubmVjdEluc3RhbmNlSWQ6IHByb3BzLlNTTVBhcmFtcy5jb25uZWN0SW5zdGFuY2VBUk4uc3BsaXQoJy8nKVsxXSxcbiAgICAgICAgICAgICAgICBEREJfVEFCTEU6IHByb3BzLmFwcFRhYmxlLnRhYmxlTmFtZSxcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHByb3BzLmFwcFRhYmxlLmdyYW50UmVhZFdyaXRlRGF0YShzdGFydENoYXRMYW1iZGEpO1xuXG4gICAgICAgIC8vQWxsb3cgY2hhdEFQSSB0byBpbnZva2UgQW1hem9uIENvbm5lY3RcbiAgICAgICAgc3RhcnRDaGF0TGFtYmRhLnJvbGU/LmF0dGFjaElubGluZVBvbGljeShuZXcgaWFtLlBvbGljeSh0aGlzLCAnQ29ubmVjdENoYXRBUElBY2Nlc3MnLCB7XG4gICAgICAgICAgICBzdGF0ZW1lbnRzOiBbXG4gICAgICAgICAgICAgICAgbmV3IGlhbS5Qb2xpY3lTdGF0ZW1lbnQoe1xuICAgICAgICAgICAgICAgICAgICBlZmZlY3Q6IGlhbS5FZmZlY3QuQUxMT1csXG4gICAgICAgICAgICAgICAgICAgIGFjdGlvbnM6IFtcImNvbm5lY3Q6U3RhcnRDaGF0Q29udGFjdFwiXSxcbiAgICAgICAgICAgICAgICAgICAgcmVzb3VyY2VzOiBbcHJvcHMuU1NNUGFyYW1zLmNvbm5lY3RJbnN0YW5jZUFSTiArICcvKiddXG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIF1cbiAgICAgICAgfSkpO1xuXG4gICAgICAgIGNvbnN0IGNoYXRBUEkgPSBuZXcgYXBpZ3cyLkh0dHBBcGkodGhpcywgJ0NoYXRBUEknLCB7XG4gICAgICAgICAgICBhcGlOYW1lOiBgJHtwcm9wcy5jZGtBcHBOYW1lfS1DaGF0QVBJYCxcbiAgICAgICAgICAgIGNvcnNQcmVmbGlnaHQ6IHtcbiAgICAgICAgICAgICAgICBhbGxvd09yaWdpbnM6IHByb3BzLlNTTVBhcmFtcy53ZWJzaXRlQVBJQWxsb3dlZE9yaWdpbnMuc3BsaXQoJywnKS5tYXAoKGl0ZW06IHN0cmluZykgPT4gaXRlbS50cmltKCkpLFxuICAgICAgICAgICAgICAgIGFsbG93TWV0aG9kczogW2FwaWd3Mi5Db3JzSHR0cE1ldGhvZC5QT1NUXSxcbiAgICAgICAgICAgICAgICBhbGxvd0hlYWRlcnM6IGFwaWd3LkNvcnMuREVGQVVMVF9IRUFERVJTXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGNvbnN0IHN0YXJ0Q2hhdF9Sb3V0ZSA9IG5ldyBhcGlndzIuSHR0cFJvdXRlKHRoaXMsICdTdGFydENoYXRfUm91dGUnLCB7XG4gICAgICAgICAgICBodHRwQXBpOiBjaGF0QVBJLFxuICAgICAgICAgICAgaW50ZWdyYXRpb246IG5ldyBhcGlndzJpLkxhbWJkYVByb3h5SW50ZWdyYXRpb24oeyBoYW5kbGVyOiBzdGFydENoYXRMYW1iZGEgfSksXG4gICAgICAgICAgICByb3V0ZUtleTogYXBpZ3cyLkh0dHBSb3V0ZUtleS53aXRoKCcvc3RhcnQnLCBhcGlndzIuSHR0cE1ldGhvZC5QT1NUKVxuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLmNoYXRBUEkgPSBjaGF0QVBJO1xuICAgIH1cbn0iXX0=