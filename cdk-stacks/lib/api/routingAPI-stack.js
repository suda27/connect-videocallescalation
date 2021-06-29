"use strict";
// Copyright 2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoutingAPIStack = void 0;
const cdk = require("@aws-cdk/core");
const nodeLambda = require("@aws-cdk/aws-lambda-nodejs");
const lambda = require("@aws-cdk/aws-lambda");
const apigw = require("@aws-cdk/aws-apigateway");
const apigw2 = require("@aws-cdk/aws-apigatewayv2");
const apigw2i = require("@aws-cdk/aws-apigatewayv2-integrations");
const iam = require("@aws-cdk/aws-iam");
class RoutingAPIStack extends cdk.NestedStack {
    constructor(scope, id, props) {
        super(scope, id, props);
        //create createAdHocRoute Lambda
        const createAdHocRouteLambda = new nodeLambda.NodejsFunction(this, 'CreateAdHocRouteLambda', {
            functionName: `${props.cdkAppName}-CreateAdHocRouteLambda`,
            runtime: lambda.Runtime.NODEJS_12_X,
            entry: 'lambdas/handlers/RoutingAPI/createAdHocRoute.js',
            timeout: cdk.Duration.seconds(20),
            environment: {
                DDB_TABLE: props.appTable.tableName,
            }
        });
        props.appTable.grantReadWriteData(createAdHocRouteLambda);
        const routingAPI = new apigw2.HttpApi(this, 'RoutingAPI', {
            apiName: `${props.cdkAppName}-RoutingAPI`,
            corsPreflight: {
                allowOrigins: props.SSMParams.agentAPIAllowedOrigins.split(',').map((item) => item.trim()),
                allowMethods: [apigw2.CorsHttpMethod.POST],
                allowHeaders: apigw.Cors.DEFAULT_HEADERS.concat(['cognitoIdToken'])
            }
        });
        const createAdHocRoute_Route = new apigw2.HttpRoute(this, 'CreateAdHocRoute_Route', {
            httpApi: routingAPI,
            integration: new apigw2i.LambdaProxyIntegration({ handler: createAdHocRouteLambda }),
            routeKey: apigw2.HttpRouteKey.with('/adhoc', apigw2.HttpMethod.POST)
        });
        const createAdHocRoute_RouteCfn = createAdHocRoute_Route.node.defaultChild;
        createAdHocRoute_RouteCfn.authorizationType = 'AWS_IAM';
        //Allow Identity Pool to invoke RoutingAPI resource
        props.cognitoAuthenticatedRole.attachInlinePolicy(new iam.Policy(this, 'RoutingAPI_RoutingResources', {
            statements: [new iam.PolicyStatement({
                    effect: iam.Effect.ALLOW,
                    actions: ["execute-api:Invoke"],
                    resources: [`arn:aws:execute-api:${this.region}:${this.account}:${routingAPI.httpApiId}/$default/${createAdHocRoute_RouteCfn.routeKey.replace(/\s+/g, '')}`]
                })]
        }));
        this.routingAPI = routingAPI;
    }
}
exports.RoutingAPIStack = RoutingAPIStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGluZ0FQSS1zdGFjay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInJvdXRpbmdBUEktc3RhY2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLDBFQUEwRTtBQUMxRSxpQ0FBaUM7OztBQUVqQyxxQ0FBcUM7QUFDckMseURBQXlEO0FBQ3pELDhDQUE4QztBQUM5QyxpREFBaUQ7QUFDakQsb0RBQW9EO0FBQ3BELGtFQUFrRTtBQUVsRSx3Q0FBd0M7QUFTeEMsTUFBYSxlQUFnQixTQUFRLEdBQUcsQ0FBQyxXQUFXO0lBSWhELFlBQVksS0FBb0IsRUFBRSxFQUFVLEVBQUUsS0FBMkI7UUFDckUsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFFeEIsZ0NBQWdDO1FBQ2hDLE1BQU0sc0JBQXNCLEdBQUcsSUFBSSxVQUFVLENBQUMsY0FBYyxDQUFDLElBQUksRUFBRSx3QkFBd0IsRUFBRTtZQUN6RixZQUFZLEVBQUUsR0FBRyxLQUFLLENBQUMsVUFBVSx5QkFBeUI7WUFDMUQsT0FBTyxFQUFFLE1BQU0sQ0FBQyxPQUFPLENBQUMsV0FBVztZQUNuQyxLQUFLLEVBQUUsaURBQWlEO1lBQ3hELE9BQU8sRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7WUFDakMsV0FBVyxFQUFFO2dCQUNULFNBQVMsRUFBRSxLQUFLLENBQUMsUUFBUSxDQUFDLFNBQVM7YUFDdEM7U0FDSixDQUFDLENBQUM7UUFDSCxLQUFLLENBQUMsUUFBUSxDQUFDLGtCQUFrQixDQUFDLHNCQUFzQixDQUFDLENBQUM7UUFFMUQsTUFBTSxVQUFVLEdBQUcsSUFBSSxNQUFNLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxZQUFZLEVBQUU7WUFDdEQsT0FBTyxFQUFFLEdBQUcsS0FBSyxDQUFDLFVBQVUsYUFBYTtZQUN6QyxhQUFhLEVBQUU7Z0JBQ1gsWUFBWSxFQUFFLEtBQUssQ0FBQyxTQUFTLENBQUMsc0JBQXNCLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQVksRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO2dCQUNsRyxZQUFZLEVBQUUsQ0FBQyxNQUFNLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQztnQkFDMUMsWUFBWSxFQUFFLEtBQUssQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLE1BQU0sQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUM7YUFDdEU7U0FDSixDQUFDLENBQUM7UUFFSCxNQUFNLHNCQUFzQixHQUFHLElBQUksTUFBTSxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsd0JBQXdCLEVBQUU7WUFDaEYsT0FBTyxFQUFFLFVBQVU7WUFDbkIsV0FBVyxFQUFFLElBQUksT0FBTyxDQUFDLHNCQUFzQixDQUFDLEVBQUUsT0FBTyxFQUFFLHNCQUFzQixFQUFFLENBQUM7WUFDcEYsUUFBUSxFQUFFLE1BQU0sQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxNQUFNLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQztTQUN2RSxDQUFDLENBQUM7UUFFSCxNQUFNLHlCQUF5QixHQUFHLHNCQUFzQixDQUFDLElBQUksQ0FBQyxZQUErQixDQUFDO1FBQzlGLHlCQUF5QixDQUFDLGlCQUFpQixHQUFHLFNBQVMsQ0FBQztRQUV4RCxtREFBbUQ7UUFDbkQsS0FBSyxDQUFDLHdCQUF3QixDQUFDLGtCQUFrQixDQUFDLElBQUksR0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsNkJBQTZCLEVBQUU7WUFDbEcsVUFBVSxFQUFFLENBQUMsSUFBSSxHQUFHLENBQUMsZUFBZSxDQUFDO29CQUNqQyxNQUFNLEVBQUUsR0FBRyxDQUFDLE1BQU0sQ0FBQyxLQUFLO29CQUN4QixPQUFPLEVBQUUsQ0FBQyxvQkFBb0IsQ0FBQztvQkFDL0IsU0FBUyxFQUFFLENBQUMsdUJBQXVCLElBQUksQ0FBQyxNQUFNLElBQUksSUFBSSxDQUFDLE9BQU8sSUFBSSxVQUFVLENBQUMsU0FBUyxhQUFhLHlCQUF5QixDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUM7aUJBQy9KLENBQUMsQ0FBQztTQUNOLENBQUMsQ0FBQyxDQUFDO1FBRUosSUFBSSxDQUFDLFVBQVUsR0FBRyxVQUFVLENBQUM7SUFDakMsQ0FBQztDQUNKO0FBaERELDBDQWdEQyIsInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDIxIEFtYXpvbi5jb20sIEluYy4gb3IgaXRzIGFmZmlsaWF0ZXMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vLyBTUERYLUxpY2Vuc2UtSWRlbnRpZmllcjogTUlULTBcblxuaW1wb3J0ICogYXMgY2RrIGZyb20gJ0Bhd3MtY2RrL2NvcmUnO1xuaW1wb3J0ICogYXMgbm9kZUxhbWJkYSBmcm9tIFwiQGF3cy1jZGsvYXdzLWxhbWJkYS1ub2RlanNcIjtcbmltcG9ydCAqIGFzIGxhbWJkYSBmcm9tICdAYXdzLWNkay9hd3MtbGFtYmRhJztcbmltcG9ydCAqIGFzIGFwaWd3IGZyb20gJ0Bhd3MtY2RrL2F3cy1hcGlnYXRld2F5JztcbmltcG9ydCAqIGFzIGFwaWd3MiBmcm9tIFwiQGF3cy1jZGsvYXdzLWFwaWdhdGV3YXl2MlwiO1xuaW1wb3J0ICogYXMgYXBpZ3cyaSBmcm9tIFwiQGF3cy1jZGsvYXdzLWFwaWdhdGV3YXl2Mi1pbnRlZ3JhdGlvbnNcIjtcbmltcG9ydCAqIGFzIGRkYiBmcm9tICdAYXdzLWNkay9hd3MtZHluYW1vZGInO1xuaW1wb3J0ICogYXMgaWFtIGZyb20gJ0Bhd3MtY2RrL2F3cy1pYW0nO1xuXG5leHBvcnQgaW50ZXJmYWNlIFJvdXRpbmdBUElTdGFja1Byb3BzIGV4dGVuZHMgY2RrLk5lc3RlZFN0YWNrUHJvcHMge1xuICAgIHJlYWRvbmx5IFNTTVBhcmFtczogYW55O1xuICAgIHJlYWRvbmx5IGNvZ25pdG9BdXRoZW50aWNhdGVkUm9sZTogaWFtLklSb2xlO1xuICAgIHJlYWRvbmx5IGFwcFRhYmxlOiBkZGIuSVRhYmxlO1xuICAgIHJlYWRvbmx5IGNka0FwcE5hbWU6IHN0cmluZztcbn1cblxuZXhwb3J0IGNsYXNzIFJvdXRpbmdBUElTdGFjayBleHRlbmRzIGNkay5OZXN0ZWRTdGFjayB7XG5cbiAgICBwdWJsaWMgcmVhZG9ubHkgcm91dGluZ0FQSTogYXBpZ3cyLklIdHRwQXBpO1xuXG4gICAgY29uc3RydWN0b3Ioc2NvcGU6IGNkay5Db25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzOiBSb3V0aW5nQVBJU3RhY2tQcm9wcykge1xuICAgICAgICBzdXBlcihzY29wZSwgaWQsIHByb3BzKTtcblxuICAgICAgICAvL2NyZWF0ZSBjcmVhdGVBZEhvY1JvdXRlIExhbWJkYVxuICAgICAgICBjb25zdCBjcmVhdGVBZEhvY1JvdXRlTGFtYmRhID0gbmV3IG5vZGVMYW1iZGEuTm9kZWpzRnVuY3Rpb24odGhpcywgJ0NyZWF0ZUFkSG9jUm91dGVMYW1iZGEnLCB7XG4gICAgICAgICAgICBmdW5jdGlvbk5hbWU6IGAke3Byb3BzLmNka0FwcE5hbWV9LUNyZWF0ZUFkSG9jUm91dGVMYW1iZGFgLFxuICAgICAgICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuTk9ERUpTXzEyX1gsXG4gICAgICAgICAgICBlbnRyeTogJ2xhbWJkYXMvaGFuZGxlcnMvUm91dGluZ0FQSS9jcmVhdGVBZEhvY1JvdXRlLmpzJyxcbiAgICAgICAgICAgIHRpbWVvdXQ6IGNkay5EdXJhdGlvbi5zZWNvbmRzKDIwKSxcbiAgICAgICAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgICAgICAgICAgRERCX1RBQkxFOiBwcm9wcy5hcHBUYWJsZS50YWJsZU5hbWUsXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBwcm9wcy5hcHBUYWJsZS5ncmFudFJlYWRXcml0ZURhdGEoY3JlYXRlQWRIb2NSb3V0ZUxhbWJkYSk7XG5cbiAgICAgICAgY29uc3Qgcm91dGluZ0FQSSA9IG5ldyBhcGlndzIuSHR0cEFwaSh0aGlzLCAnUm91dGluZ0FQSScsIHtcbiAgICAgICAgICAgIGFwaU5hbWU6IGAke3Byb3BzLmNka0FwcE5hbWV9LVJvdXRpbmdBUElgLFxuICAgICAgICAgICAgY29yc1ByZWZsaWdodDoge1xuICAgICAgICAgICAgICAgIGFsbG93T3JpZ2luczogcHJvcHMuU1NNUGFyYW1zLmFnZW50QVBJQWxsb3dlZE9yaWdpbnMuc3BsaXQoJywnKS5tYXAoKGl0ZW06IHN0cmluZykgPT4gaXRlbS50cmltKCkpLFxuICAgICAgICAgICAgICAgIGFsbG93TWV0aG9kczogW2FwaWd3Mi5Db3JzSHR0cE1ldGhvZC5QT1NUXSxcbiAgICAgICAgICAgICAgICBhbGxvd0hlYWRlcnM6IGFwaWd3LkNvcnMuREVGQVVMVF9IRUFERVJTLmNvbmNhdChbJ2NvZ25pdG9JZFRva2VuJ10pXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGNvbnN0IGNyZWF0ZUFkSG9jUm91dGVfUm91dGUgPSBuZXcgYXBpZ3cyLkh0dHBSb3V0ZSh0aGlzLCAnQ3JlYXRlQWRIb2NSb3V0ZV9Sb3V0ZScsIHtcbiAgICAgICAgICAgIGh0dHBBcGk6IHJvdXRpbmdBUEksXG4gICAgICAgICAgICBpbnRlZ3JhdGlvbjogbmV3IGFwaWd3MmkuTGFtYmRhUHJveHlJbnRlZ3JhdGlvbih7IGhhbmRsZXI6IGNyZWF0ZUFkSG9jUm91dGVMYW1iZGEgfSksXG4gICAgICAgICAgICByb3V0ZUtleTogYXBpZ3cyLkh0dHBSb3V0ZUtleS53aXRoKCcvYWRob2MnLCBhcGlndzIuSHR0cE1ldGhvZC5QT1NUKVxuICAgICAgICB9KTtcblxuICAgICAgICBjb25zdCBjcmVhdGVBZEhvY1JvdXRlX1JvdXRlQ2ZuID0gY3JlYXRlQWRIb2NSb3V0ZV9Sb3V0ZS5ub2RlLmRlZmF1bHRDaGlsZCBhcyBhcGlndzIuQ2ZuUm91dGU7XG4gICAgICAgIGNyZWF0ZUFkSG9jUm91dGVfUm91dGVDZm4uYXV0aG9yaXphdGlvblR5cGUgPSAnQVdTX0lBTSc7XG5cbiAgICAgICAgLy9BbGxvdyBJZGVudGl0eSBQb29sIHRvIGludm9rZSBSb3V0aW5nQVBJIHJlc291cmNlXG4gICAgICAgIHByb3BzLmNvZ25pdG9BdXRoZW50aWNhdGVkUm9sZS5hdHRhY2hJbmxpbmVQb2xpY3kobmV3IGlhbS5Qb2xpY3kodGhpcywgJ1JvdXRpbmdBUElfUm91dGluZ1Jlc291cmNlcycsIHtcbiAgICAgICAgICAgIHN0YXRlbWVudHM6IFtuZXcgaWFtLlBvbGljeVN0YXRlbWVudCh7XG4gICAgICAgICAgICAgICAgZWZmZWN0OiBpYW0uRWZmZWN0LkFMTE9XLFxuICAgICAgICAgICAgICAgIGFjdGlvbnM6IFtcImV4ZWN1dGUtYXBpOkludm9rZVwiXSxcbiAgICAgICAgICAgICAgICByZXNvdXJjZXM6IFtgYXJuOmF3czpleGVjdXRlLWFwaToke3RoaXMucmVnaW9ufToke3RoaXMuYWNjb3VudH06JHtyb3V0aW5nQVBJLmh0dHBBcGlJZH0vJGRlZmF1bHQvJHtjcmVhdGVBZEhvY1JvdXRlX1JvdXRlQ2ZuLnJvdXRlS2V5LnJlcGxhY2UoL1xccysvZywgJycpfWBdXG4gICAgICAgICAgICB9KV1cbiAgICAgICAgfSkpO1xuXG4gICAgICAgIHRoaXMucm91dGluZ0FQSSA9IHJvdXRpbmdBUEk7XG4gICAgfVxufSJdfQ==