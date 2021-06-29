"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CdkFrontendStack = void 0;
// Copyright 2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
const cdk = require("@aws-cdk/core");
const ssm = require("@aws-cdk/aws-ssm");
const cloudfront = require("@aws-cdk/aws-cloudfront");
const frontend_s3_deployment_stack_1 = require("../lib/frontend/frontend-s3-deployment-stack");
const configParams = require('../config.params.json');
class CdkFrontendStack extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        //store physical stack name to SSM
        const outputHierarchy = `${configParams.hierarchy}outputParameters`;
        const cdkFrontendStackName = new ssm.StringParameter(this, 'CdkFrontendStackName', {
            parameterName: `${outputHierarchy}/CdkFrontendStackName`,
            stringValue: this.stackName
        });
        const frontendS3DeploymentStack = new frontend_s3_deployment_stack_1.FrontendS3DeploymentStack(this, 'FrontendS3DeploymentStack', {
            cdkAppName: configParams['CdkAppName'],
            webAppBucket: props.webAppBucket
        });
        const webAppCloudFrontDistribution = new cloudfront.CloudFrontWebDistribution(this, `${configParams['CdkAppName']}-WebAppDistribution`, {
            comment: `CloudFront for ${configParams['CdkAppName']}`,
            originConfigs: [
                {
                    s3OriginSource: {
                        s3BucketSource: props.webAppBucket,
                        originPath: `/${configParams['WebAppRootPrefix'].replace(/\/$/, "")}`,
                        originAccessIdentity: props.webAppCloudFrontOAI,
                    },
                    behaviors: [
                        {
                            defaultTtl: cdk.Duration.minutes(1),
                            isDefaultBehavior: true,
                        },
                    ]
                }
            ],
            errorConfigurations: [{
                    errorCode: 403,
                    errorCachingMinTtl: 60,
                    responsePagePath: '/index.html',
                    responseCode: 200
                }]
        });
        /**************************************************************************************************************
         * CDK Outputs *
         **************************************************************************************************************/
        new cdk.CfnOutput(this, "webAppBucket", {
            value: props.webAppBucket.bucketName
        });
        new cdk.CfnOutput(this, "webAppURL", {
            value: `https://${webAppCloudFrontDistribution.distributionDomainName}`
        });
    }
}
exports.CdkFrontendStack = CdkFrontendStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2RrLWZyb250ZW5kLXN0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiY2RrLWZyb250ZW5kLXN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLDBFQUEwRTtBQUMxRSxpQ0FBaUM7QUFDakMscUNBQXFDO0FBQ3JDLHdDQUF1QztBQUN2QyxzREFBc0Q7QUFHdEQsK0ZBQXlGO0FBRXpGLE1BQU0sWUFBWSxHQUFHLE9BQU8sQ0FBQyx1QkFBdUIsQ0FBQyxDQUFBO0FBTXJELE1BQWEsZ0JBQWlCLFNBQVEsR0FBRyxDQUFDLEtBQUs7SUFDM0MsWUFBWSxLQUFvQixFQUFFLEVBQVUsRUFBRSxLQUE0QjtRQUN0RSxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUV4QixrQ0FBa0M7UUFDbEMsTUFBTSxlQUFlLEdBQUcsR0FBRyxZQUFZLENBQUMsU0FBUyxrQkFBa0IsQ0FBQztRQUNwRSxNQUFNLG9CQUFvQixHQUFHLElBQUksR0FBRyxDQUFDLGVBQWUsQ0FBQyxJQUFJLEVBQUUsc0JBQXNCLEVBQUU7WUFDL0UsYUFBYSxFQUFFLEdBQUcsZUFBZSx1QkFBdUI7WUFDeEQsV0FBVyxFQUFFLElBQUksQ0FBQyxTQUFTO1NBQzlCLENBQUMsQ0FBQztRQUVILE1BQU0seUJBQXlCLEdBQUcsSUFBSSx3REFBeUIsQ0FBQyxJQUFJLEVBQUUsMkJBQTJCLEVBQUU7WUFDL0YsVUFBVSxFQUFFLFlBQVksQ0FBQyxZQUFZLENBQUM7WUFDdEMsWUFBWSxFQUFFLEtBQUssQ0FBQyxZQUFZO1NBQ25DLENBQUMsQ0FBQztRQUlILE1BQU0sNEJBQTRCLEdBQUcsSUFBSSxVQUFVLENBQUMseUJBQXlCLENBQUMsSUFBSSxFQUFFLEdBQUcsWUFBWSxDQUFDLFlBQVksQ0FBQyxxQkFBcUIsRUFBRTtZQUNwSSxPQUFPLEVBQUUsa0JBQWtCLFlBQVksQ0FBQyxZQUFZLENBQUMsRUFBRTtZQUN2RCxhQUFhLEVBQUU7Z0JBQ1g7b0JBQ0ksY0FBYyxFQUFFO3dCQUNaLGNBQWMsRUFBRSxLQUFLLENBQUMsWUFBWTt3QkFDbEMsVUFBVSxFQUFFLElBQUksWUFBWSxDQUFDLGtCQUFrQixDQUFDLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsRUFBRTt3QkFDckUsb0JBQW9CLEVBQUUsS0FBSyxDQUFDLG1CQUFtQjtxQkFDbEQ7b0JBQ0QsU0FBUyxFQUFFO3dCQUNQOzRCQUNJLFVBQVUsRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7NEJBQ25DLGlCQUFpQixFQUFFLElBQUk7eUJBQzFCO3FCQUNKO2lCQUNKO2FBQ0o7WUFDRCxtQkFBbUIsRUFBRSxDQUFDO29CQUNsQixTQUFTLEVBQUUsR0FBRztvQkFDZCxrQkFBa0IsRUFBRSxFQUFFO29CQUN0QixnQkFBZ0IsRUFBRSxhQUFhO29CQUMvQixZQUFZLEVBQUUsR0FBRztpQkFDcEIsQ0FBQztTQUNMLENBQUMsQ0FBQztRQUVIOzt3SEFFZ0g7UUFFaEgsSUFBSSxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxjQUFjLEVBQUU7WUFDcEMsS0FBSyxFQUFFLEtBQUssQ0FBQyxZQUFZLENBQUMsVUFBVTtTQUN2QyxDQUFDLENBQUM7UUFFSCxJQUFJLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLFdBQVcsRUFBRTtZQUNqQyxLQUFLLEVBQUUsV0FBVyw0QkFBNEIsQ0FBQyxzQkFBc0IsRUFBRTtTQUMxRSxDQUFDLENBQUM7SUFDUCxDQUFDO0NBQ0o7QUF2REQsNENBdURDIiwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMjEgQW1hem9uLmNvbSwgSW5jLiBvciBpdHMgYWZmaWxpYXRlcy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vIFNQRFgtTGljZW5zZS1JZGVudGlmaWVyOiBNSVQtMFxuaW1wb3J0ICogYXMgY2RrIGZyb20gXCJAYXdzLWNkay9jb3JlXCI7XG5pbXBvcnQgKiBhcyBzc20gZnJvbSAnQGF3cy1jZGsvYXdzLXNzbSdcbmltcG9ydCAqIGFzIGNsb3VkZnJvbnQgZnJvbSBcIkBhd3MtY2RrL2F3cy1jbG91ZGZyb250XCI7XG5pbXBvcnQgKiBhcyBzMyBmcm9tIFwiQGF3cy1jZGsvYXdzLXMzXCI7XG5cbmltcG9ydCB7IEZyb250ZW5kUzNEZXBsb3ltZW50U3RhY2sgfSBmcm9tICcuLi9saWIvZnJvbnRlbmQvZnJvbnRlbmQtczMtZGVwbG95bWVudC1zdGFjayc7XG5cbmNvbnN0IGNvbmZpZ1BhcmFtcyA9IHJlcXVpcmUoJy4uL2NvbmZpZy5wYXJhbXMuanNvbicpXG5leHBvcnQgaW50ZXJmYWNlIENka0Zyb250ZW5kU3RhY2tQcm9wcyBleHRlbmRzIGNkay5TdGFja1Byb3BzIHtcbiAgICByZWFkb25seSB3ZWJBcHBCdWNrZXQ6IHMzLklCdWNrZXQ7XG4gICAgcmVhZG9ubHkgd2ViQXBwQ2xvdWRGcm9udE9BSTogY2xvdWRmcm9udC5JT3JpZ2luQWNjZXNzSWRlbnRpdHk7XG59XG5cbmV4cG9ydCBjbGFzcyBDZGtGcm9udGVuZFN0YWNrIGV4dGVuZHMgY2RrLlN0YWNrIHtcbiAgICBjb25zdHJ1Y3RvcihzY29wZTogY2RrLkNvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM6IENka0Zyb250ZW5kU3RhY2tQcm9wcykge1xuICAgICAgICBzdXBlcihzY29wZSwgaWQsIHByb3BzKTtcblxuICAgICAgICAvL3N0b3JlIHBoeXNpY2FsIHN0YWNrIG5hbWUgdG8gU1NNXG4gICAgICAgIGNvbnN0IG91dHB1dEhpZXJhcmNoeSA9IGAke2NvbmZpZ1BhcmFtcy5oaWVyYXJjaHl9b3V0cHV0UGFyYW1ldGVyc2A7XG4gICAgICAgIGNvbnN0IGNka0Zyb250ZW5kU3RhY2tOYW1lID0gbmV3IHNzbS5TdHJpbmdQYXJhbWV0ZXIodGhpcywgJ0Nka0Zyb250ZW5kU3RhY2tOYW1lJywge1xuICAgICAgICAgICAgcGFyYW1ldGVyTmFtZTogYCR7b3V0cHV0SGllcmFyY2h5fS9DZGtGcm9udGVuZFN0YWNrTmFtZWAsXG4gICAgICAgICAgICBzdHJpbmdWYWx1ZTogdGhpcy5zdGFja05hbWVcbiAgICAgICAgfSk7XG5cbiAgICAgICAgY29uc3QgZnJvbnRlbmRTM0RlcGxveW1lbnRTdGFjayA9IG5ldyBGcm9udGVuZFMzRGVwbG95bWVudFN0YWNrKHRoaXMsICdGcm9udGVuZFMzRGVwbG95bWVudFN0YWNrJywge1xuICAgICAgICAgICAgY2RrQXBwTmFtZTogY29uZmlnUGFyYW1zWydDZGtBcHBOYW1lJ10sXG4gICAgICAgICAgICB3ZWJBcHBCdWNrZXQ6IHByb3BzLndlYkFwcEJ1Y2tldFxuICAgICAgICB9KTtcblxuXG5cbiAgICAgICAgY29uc3Qgd2ViQXBwQ2xvdWRGcm9udERpc3RyaWJ1dGlvbiA9IG5ldyBjbG91ZGZyb250LkNsb3VkRnJvbnRXZWJEaXN0cmlidXRpb24odGhpcywgYCR7Y29uZmlnUGFyYW1zWydDZGtBcHBOYW1lJ119LVdlYkFwcERpc3RyaWJ1dGlvbmAsIHtcbiAgICAgICAgICAgIGNvbW1lbnQ6IGBDbG91ZEZyb250IGZvciAke2NvbmZpZ1BhcmFtc1snQ2RrQXBwTmFtZSddfWAsXG4gICAgICAgICAgICBvcmlnaW5Db25maWdzOiBbXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBzM09yaWdpblNvdXJjZToge1xuICAgICAgICAgICAgICAgICAgICAgICAgczNCdWNrZXRTb3VyY2U6IHByb3BzLndlYkFwcEJ1Y2tldCxcbiAgICAgICAgICAgICAgICAgICAgICAgIG9yaWdpblBhdGg6IGAvJHtjb25maWdQYXJhbXNbJ1dlYkFwcFJvb3RQcmVmaXgnXS5yZXBsYWNlKC9cXC8kLywgXCJcIil9YCxcbiAgICAgICAgICAgICAgICAgICAgICAgIG9yaWdpbkFjY2Vzc0lkZW50aXR5OiBwcm9wcy53ZWJBcHBDbG91ZEZyb250T0FJLFxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICBiZWhhdmlvcnM6IFtcbiAgICAgICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0VHRsOiBjZGsuRHVyYXRpb24ubWludXRlcygxKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpc0RlZmF1bHRCZWhhdmlvcjogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIF1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAgZXJyb3JDb25maWd1cmF0aW9uczogW3tcbiAgICAgICAgICAgICAgICBlcnJvckNvZGU6IDQwMyxcbiAgICAgICAgICAgICAgICBlcnJvckNhY2hpbmdNaW5UdGw6IDYwLFxuICAgICAgICAgICAgICAgIHJlc3BvbnNlUGFnZVBhdGg6ICcvaW5kZXguaHRtbCcsXG4gICAgICAgICAgICAgICAgcmVzcG9uc2VDb2RlOiAyMDBcbiAgICAgICAgICAgIH1dXG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICAgICAgICAgKiBDREsgT3V0cHV0cyAqXG4gICAgICAgICAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuICAgICAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCBcIndlYkFwcEJ1Y2tldFwiLCB7XG4gICAgICAgICAgICB2YWx1ZTogcHJvcHMud2ViQXBwQnVja2V0LmJ1Y2tldE5hbWVcbiAgICAgICAgfSk7XG5cbiAgICAgICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgXCJ3ZWJBcHBVUkxcIiwge1xuICAgICAgICAgICAgdmFsdWU6IGBodHRwczovLyR7d2ViQXBwQ2xvdWRGcm9udERpc3RyaWJ1dGlvbi5kaXN0cmlidXRpb25Eb21haW5OYW1lfWBcbiAgICAgICAgfSk7XG4gICAgfVxufSJdfQ==