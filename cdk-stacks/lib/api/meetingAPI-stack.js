"use strict";
// Copyright 2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
Object.defineProperty(exports, "__esModule", { value: true });
exports.MeetingAPIStack = void 0;
const cdk = require("@aws-cdk/core");
const apigw = require("@aws-cdk/aws-apigateway");
const apigw2 = require("@aws-cdk/aws-apigatewayv2");
const apigw2i = require("@aws-cdk/aws-apigatewayv2-integrations");
class MeetingAPIStack extends cdk.NestedStack {
    constructor(scope, id, props) {
        super(scope, id, props);
        //create MeetingAPI Integration
        const meetingAPI = new apigw2.HttpApi(this, 'MeetingAPI', {
            apiName: `${props.cdkAppName}-MeetingAPI`,
            corsPreflight: {
                allowOrigins: props.SSMParams.websiteAPIAllowedOrigins.split(',').map((item) => item.trim()),
                allowMethods: [apigw2.CorsHttpMethod.POST, apigw2.CorsHttpMethod.GET],
                allowHeaders: apigw.Cors.DEFAULT_HEADERS
            }
        });
        const getAttendeeJoinData_Route = new apigw2.HttpRoute(this, 'GetAttendeeJoinData_Route', {
            httpApi: meetingAPI,
            integration: new apigw2i.LambdaProxyIntegration({ handler: props.getAttendeeJoinDataLambda }),
            routeKey: apigw2.HttpRouteKey.with('/attendee-join-data', apigw2.HttpMethod.GET)
        });
        const getAttendeeName_Route = new apigw2.HttpRoute(this, 'GetAttendeeName_Route', {
            httpApi: meetingAPI,
            integration: new apigw2i.LambdaProxyIntegration({ handler: props.getAttendeeNameLambda }),
            routeKey: apigw2.HttpRouteKey.with('/attendee-name', apigw2.HttpMethod.GET)
        });
        this.meetingAPI = meetingAPI;
    }
}
exports.MeetingAPIStack = MeetingAPIStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVldGluZ0FQSS1zdGFjay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm1lZXRpbmdBUEktc3RhY2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLDBFQUEwRTtBQUMxRSxpQ0FBaUM7OztBQUVqQyxxQ0FBcUM7QUFFckMsaURBQWdEO0FBQ2hELG9EQUFvRDtBQUNwRCxrRUFBa0U7QUFTbEUsTUFBYSxlQUFnQixTQUFRLEdBQUcsQ0FBQyxXQUFXO0lBSWhELFlBQVksS0FBb0IsRUFBRSxFQUFVLEVBQUUsS0FBMkI7UUFDckUsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFFeEIsK0JBQStCO1FBQy9CLE1BQU0sVUFBVSxHQUFHLElBQUksTUFBTSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsWUFBWSxFQUFFO1lBQ3RELE9BQU8sRUFBRSxHQUFHLEtBQUssQ0FBQyxVQUFVLGFBQWE7WUFDekMsYUFBYSxFQUFFO2dCQUNYLFlBQVksRUFBRSxLQUFLLENBQUMsU0FBUyxDQUFDLHdCQUF3QixDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFZLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztnQkFDcEcsWUFBWSxFQUFFLENBQUMsTUFBTSxDQUFDLGNBQWMsQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUM7Z0JBQ3JFLFlBQVksRUFBRSxLQUFLLENBQUMsSUFBSSxDQUFDLGVBQWU7YUFDM0M7U0FDSixDQUFDLENBQUM7UUFFSCxNQUFNLHlCQUF5QixHQUFHLElBQUksTUFBTSxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsMkJBQTJCLEVBQUU7WUFDdEYsT0FBTyxFQUFFLFVBQVU7WUFDbkIsV0FBVyxFQUFFLElBQUksT0FBTyxDQUFDLHNCQUFzQixDQUFDLEVBQUUsT0FBTyxFQUFFLEtBQUssQ0FBQyx5QkFBeUIsRUFBRSxDQUFDO1lBQzdGLFFBQVEsRUFBRSxNQUFNLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxxQkFBcUIsRUFBRSxNQUFNLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQztTQUNuRixDQUFDLENBQUM7UUFFSCxNQUFNLHFCQUFxQixHQUFHLElBQUksTUFBTSxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsdUJBQXVCLEVBQUU7WUFDOUUsT0FBTyxFQUFFLFVBQVU7WUFDbkIsV0FBVyxFQUFFLElBQUksT0FBTyxDQUFDLHNCQUFzQixDQUFDLEVBQUUsT0FBTyxFQUFFLEtBQUssQ0FBQyxxQkFBcUIsRUFBRSxDQUFDO1lBQ3pGLFFBQVEsRUFBRSxNQUFNLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxNQUFNLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQztTQUM5RSxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsVUFBVSxHQUFHLFVBQVUsQ0FBQztJQUVqQyxDQUFDO0NBQ0o7QUFoQ0QsMENBZ0NDIiwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMjEgQW1hem9uLmNvbSwgSW5jLiBvciBpdHMgYWZmaWxpYXRlcy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vIFNQRFgtTGljZW5zZS1JZGVudGlmaWVyOiBNSVQtMFxuXG5pbXBvcnQgKiBhcyBjZGsgZnJvbSAnQGF3cy1jZGsvY29yZSc7XG5pbXBvcnQgKiBhcyBsYW1iZGEgZnJvbSAnQGF3cy1jZGsvYXdzLWxhbWJkYSdcbmltcG9ydCAqIGFzIGFwaWd3IGZyb20gJ0Bhd3MtY2RrL2F3cy1hcGlnYXRld2F5J1xuaW1wb3J0ICogYXMgYXBpZ3cyIGZyb20gXCJAYXdzLWNkay9hd3MtYXBpZ2F0ZXdheXYyXCI7XG5pbXBvcnQgKiBhcyBhcGlndzJpIGZyb20gXCJAYXdzLWNkay9hd3MtYXBpZ2F0ZXdheXYyLWludGVncmF0aW9uc1wiO1xuXG5leHBvcnQgaW50ZXJmYWNlIE1lZXRpbmdBUElTdGFja1Byb3BzIGV4dGVuZHMgY2RrLk5lc3RlZFN0YWNrUHJvcHMge1xuICAgIHJlYWRvbmx5IFNTTVBhcmFtczogYW55O1xuICAgIHJlYWRvbmx5IGdldEF0dGVuZGVlTmFtZUxhbWJkYTogbGFtYmRhLklGdW5jdGlvbjtcbiAgICByZWFkb25seSBnZXRBdHRlbmRlZUpvaW5EYXRhTGFtYmRhOiBsYW1iZGEuSUZ1bmN0aW9uO1xuICAgIHJlYWRvbmx5IGNka0FwcE5hbWU6IHN0cmluZztcbn1cblxuZXhwb3J0IGNsYXNzIE1lZXRpbmdBUElTdGFjayBleHRlbmRzIGNkay5OZXN0ZWRTdGFjayB7XG5cbiAgICBwdWJsaWMgcmVhZG9ubHkgbWVldGluZ0FQSTogYXBpZ3cyLklIdHRwQXBpO1xuXG4gICAgY29uc3RydWN0b3Ioc2NvcGU6IGNkay5Db25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzOiBNZWV0aW5nQVBJU3RhY2tQcm9wcykge1xuICAgICAgICBzdXBlcihzY29wZSwgaWQsIHByb3BzKTtcblxuICAgICAgICAvL2NyZWF0ZSBNZWV0aW5nQVBJIEludGVncmF0aW9uXG4gICAgICAgIGNvbnN0IG1lZXRpbmdBUEkgPSBuZXcgYXBpZ3cyLkh0dHBBcGkodGhpcywgJ01lZXRpbmdBUEknLCB7XG4gICAgICAgICAgICBhcGlOYW1lOiBgJHtwcm9wcy5jZGtBcHBOYW1lfS1NZWV0aW5nQVBJYCxcbiAgICAgICAgICAgIGNvcnNQcmVmbGlnaHQ6IHtcbiAgICAgICAgICAgICAgICBhbGxvd09yaWdpbnM6IHByb3BzLlNTTVBhcmFtcy53ZWJzaXRlQVBJQWxsb3dlZE9yaWdpbnMuc3BsaXQoJywnKS5tYXAoKGl0ZW06IHN0cmluZykgPT4gaXRlbS50cmltKCkpLFxuICAgICAgICAgICAgICAgIGFsbG93TWV0aG9kczogW2FwaWd3Mi5Db3JzSHR0cE1ldGhvZC5QT1NULCBhcGlndzIuQ29yc0h0dHBNZXRob2QuR0VUXSxcbiAgICAgICAgICAgICAgICBhbGxvd0hlYWRlcnM6IGFwaWd3LkNvcnMuREVGQVVMVF9IRUFERVJTXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGNvbnN0IGdldEF0dGVuZGVlSm9pbkRhdGFfUm91dGUgPSBuZXcgYXBpZ3cyLkh0dHBSb3V0ZSh0aGlzLCAnR2V0QXR0ZW5kZWVKb2luRGF0YV9Sb3V0ZScsIHtcbiAgICAgICAgICAgIGh0dHBBcGk6IG1lZXRpbmdBUEksXG4gICAgICAgICAgICBpbnRlZ3JhdGlvbjogbmV3IGFwaWd3MmkuTGFtYmRhUHJveHlJbnRlZ3JhdGlvbih7IGhhbmRsZXI6IHByb3BzLmdldEF0dGVuZGVlSm9pbkRhdGFMYW1iZGEgfSksXG4gICAgICAgICAgICByb3V0ZUtleTogYXBpZ3cyLkh0dHBSb3V0ZUtleS53aXRoKCcvYXR0ZW5kZWUtam9pbi1kYXRhJywgYXBpZ3cyLkh0dHBNZXRob2QuR0VUKVxuICAgICAgICB9KTtcblxuICAgICAgICBjb25zdCBnZXRBdHRlbmRlZU5hbWVfUm91dGUgPSBuZXcgYXBpZ3cyLkh0dHBSb3V0ZSh0aGlzLCAnR2V0QXR0ZW5kZWVOYW1lX1JvdXRlJywge1xuICAgICAgICAgICAgaHR0cEFwaTogbWVldGluZ0FQSSxcbiAgICAgICAgICAgIGludGVncmF0aW9uOiBuZXcgYXBpZ3cyaS5MYW1iZGFQcm94eUludGVncmF0aW9uKHsgaGFuZGxlcjogcHJvcHMuZ2V0QXR0ZW5kZWVOYW1lTGFtYmRhIH0pLFxuICAgICAgICAgICAgcm91dGVLZXk6IGFwaWd3Mi5IdHRwUm91dGVLZXkud2l0aCgnL2F0dGVuZGVlLW5hbWUnLCBhcGlndzIuSHR0cE1ldGhvZC5HRVQpXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMubWVldGluZ0FQSSA9IG1lZXRpbmdBUEk7XG5cbiAgICB9XG59Il19