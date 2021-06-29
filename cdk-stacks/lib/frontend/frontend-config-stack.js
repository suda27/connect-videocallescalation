"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FrontendConfigStack = void 0;
// Copyright 2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
const cdk = require("@aws-cdk/core");
const lambda = require("@aws-cdk/aws-lambda");
const iam = require("@aws-cdk/aws-iam");
const configParams = require('../../config.params.json');
class FrontendConfigStack extends cdk.NestedStack {
    constructor(scope, id, props) {
        super(scope, id, props);
        const buildConfigParameters = () => {
            const result = {};
            props.backendStackOutputs.forEach(param => {
                result[param.key] = param.value;
            });
            return JSON.stringify(result);
        };
        //frontend config custom resource
        const frontendConfigLambda = new lambda.Function(this, `FrontendConfigLambda`, {
            functionName: `${props.cdkAppName}-FrontendConfigLambda`,
            runtime: lambda.Runtime.PYTHON_3_8,
            code: lambda.Code.fromAsset('lambdas/custom-resources/frontend-config'),
            handler: 'index.handler',
            timeout: cdk.Duration.seconds(120),
            initialPolicy: [new iam.PolicyStatement({
                    effect: iam.Effect.ALLOW,
                    actions: ["s3:PutObject", "s3:DeleteObject"],
                    resources: [
                        `${props.webAppBucket.bucketArn}/${configParams['WebAppStagingPrefix']}frontend-config.zip`,
                        `${props.webAppBucket.bucketArn}/${configParams['WebAppRootPrefix']}frontend-config.js`
                    ]
                })]
        });
        const frontendConfigCustomResource = new cdk.CustomResource(this, `${props.cdkAppName}-FrontendConfigCustomResource`, {
            resourceType: 'Custom::FrontendConfig',
            serviceToken: frontendConfigLambda.functionArn,
            properties: {
                BucketName: props.webAppBucket.bucketName,
                WebAppStagingObjectPrefix: configParams['WebAppStagingPrefix'],
                WebAppRootObjectPrefix: configParams['WebAppRootPrefix'],
                ObjectKey: `frontend-config.js`,
                ContentType: 'text/javascript',
                Content: `window.vceConfig = ${buildConfigParameters()}`
            }
        });
    }
}
exports.FrontendConfigStack = FrontendConfigStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJvbnRlbmQtY29uZmlnLXN0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZnJvbnRlbmQtY29uZmlnLXN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLDBFQUEwRTtBQUMxRSxpQ0FBaUM7QUFDakMscUNBQXFDO0FBQ3JDLDhDQUE4QztBQUM5Qyx3Q0FBd0M7QUFHeEMsTUFBTSxZQUFZLEdBQUcsT0FBTyxDQUFDLDBCQUEwQixDQUFDLENBQUM7QUFRekQsTUFBYSxtQkFBb0IsU0FBUSxHQUFHLENBQUMsV0FBVztJQUVwRCxZQUFZLEtBQW9CLEVBQUUsRUFBVSxFQUFFLEtBQStCO1FBQ3pFLEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXhCLE1BQU0scUJBQXFCLEdBQUcsR0FBRyxFQUFFO1lBQy9CLE1BQU0sTUFBTSxHQUFRLEVBQUUsQ0FBQztZQUN2QixLQUFLLENBQUMsbUJBQW1CLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxFQUFFO2dCQUN0QyxNQUFNLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUM7WUFDcEMsQ0FBQyxDQUFDLENBQUM7WUFDSCxPQUFPLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDbEMsQ0FBQyxDQUFBO1FBRUQsaUNBQWlDO1FBQ2pDLE1BQU0sb0JBQW9CLEdBQUcsSUFBSSxNQUFNLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxzQkFBc0IsRUFBRTtZQUMzRSxZQUFZLEVBQUUsR0FBRyxLQUFLLENBQUMsVUFBVSx1QkFBdUI7WUFDeEQsT0FBTyxFQUFFLE1BQU0sQ0FBQyxPQUFPLENBQUMsVUFBVTtZQUNsQyxJQUFJLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsMENBQTBDLENBQUM7WUFDdkUsT0FBTyxFQUFFLGVBQWU7WUFDeEIsT0FBTyxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQztZQUNsQyxhQUFhLEVBQUUsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxlQUFlLENBQUM7b0JBQ3BDLE1BQU0sRUFBRSxHQUFHLENBQUMsTUFBTSxDQUFDLEtBQUs7b0JBQ3hCLE9BQU8sRUFBRSxDQUFDLGNBQWMsRUFBRSxpQkFBaUIsQ0FBQztvQkFDNUMsU0FBUyxFQUFFO3dCQUNQLEdBQUcsS0FBSyxDQUFDLFlBQVksQ0FBQyxTQUFTLElBQUksWUFBWSxDQUFDLHFCQUFxQixDQUFDLHFCQUFxQjt3QkFDM0YsR0FBRyxLQUFLLENBQUMsWUFBWSxDQUFDLFNBQVMsSUFBSSxZQUFZLENBQUMsa0JBQWtCLENBQUMsb0JBQW9CO3FCQUMxRjtpQkFDSixDQUFDLENBQUM7U0FDTixDQUFDLENBQUM7UUFFSCxNQUFNLDRCQUE0QixHQUFHLElBQUksR0FBRyxDQUFDLGNBQWMsQ0FBQyxJQUFJLEVBQUUsR0FBRyxLQUFLLENBQUMsVUFBVSwrQkFBK0IsRUFBRTtZQUNsSCxZQUFZLEVBQUUsd0JBQXdCO1lBQ3RDLFlBQVksRUFBRSxvQkFBb0IsQ0FBQyxXQUFXO1lBQzlDLFVBQVUsRUFBRTtnQkFDUixVQUFVLEVBQUUsS0FBSyxDQUFDLFlBQVksQ0FBQyxVQUFVO2dCQUN6Qyx5QkFBeUIsRUFBRSxZQUFZLENBQUMscUJBQXFCLENBQUM7Z0JBQzlELHNCQUFzQixFQUFFLFlBQVksQ0FBQyxrQkFBa0IsQ0FBQztnQkFDeEQsU0FBUyxFQUFFLG9CQUFvQjtnQkFDL0IsV0FBVyxFQUFFLGlCQUFpQjtnQkFDOUIsT0FBTyxFQUFFLHNCQUFzQixxQkFBcUIsRUFBRSxFQUFFO2FBQzNEO1NBQ0osQ0FBQyxDQUFDO0lBQ1AsQ0FBQztDQUNKO0FBM0NELGtEQTJDQyIsInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDIxIEFtYXpvbi5jb20sIEluYy4gb3IgaXRzIGFmZmlsaWF0ZXMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vLyBTUERYLUxpY2Vuc2UtSWRlbnRpZmllcjogTUlULTBcbmltcG9ydCAqIGFzIGNkayBmcm9tICdAYXdzLWNkay9jb3JlJztcbmltcG9ydCAqIGFzIGxhbWJkYSBmcm9tICdAYXdzLWNkay9hd3MtbGFtYmRhJztcbmltcG9ydCAqIGFzIGlhbSBmcm9tICdAYXdzLWNkay9hd3MtaWFtJztcbmltcG9ydCAqIGFzIHMzIGZyb20gXCJAYXdzLWNkay9hd3MtczNcIjtcblxuY29uc3QgY29uZmlnUGFyYW1zID0gcmVxdWlyZSgnLi4vLi4vY29uZmlnLnBhcmFtcy5qc29uJyk7XG5cbmV4cG9ydCBpbnRlcmZhY2UgRnJvbnRlbmRDb25maWdTdGFja1Byb3BzIGV4dGVuZHMgY2RrLk5lc3RlZFN0YWNrUHJvcHMge1xuICAgIHJlYWRvbmx5IGJhY2tlbmRTdGFja091dHB1dHM6IHsga2V5OiBzdHJpbmcsIHZhbHVlOiBzdHJpbmcgfVtdO1xuICAgIHJlYWRvbmx5IHdlYkFwcEJ1Y2tldDogczMuSUJ1Y2tldDtcbiAgICByZWFkb25seSBjZGtBcHBOYW1lOiBzdHJpbmc7XG59XG5cbmV4cG9ydCBjbGFzcyBGcm9udGVuZENvbmZpZ1N0YWNrIGV4dGVuZHMgY2RrLk5lc3RlZFN0YWNrIHtcblxuICAgIGNvbnN0cnVjdG9yKHNjb3BlOiBjZGsuQ29uc3RydWN0LCBpZDogc3RyaW5nLCBwcm9wczogRnJvbnRlbmRDb25maWdTdGFja1Byb3BzKSB7XG4gICAgICAgIHN1cGVyKHNjb3BlLCBpZCwgcHJvcHMpO1xuXG4gICAgICAgIGNvbnN0IGJ1aWxkQ29uZmlnUGFyYW1ldGVycyA9ICgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdDogYW55ID0ge307XG4gICAgICAgICAgICBwcm9wcy5iYWNrZW5kU3RhY2tPdXRwdXRzLmZvckVhY2gocGFyYW0gPT4ge1xuICAgICAgICAgICAgICAgIHJlc3VsdFtwYXJhbS5rZXldID0gcGFyYW0udmFsdWU7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiBKU09OLnN0cmluZ2lmeShyZXN1bHQpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy9mcm9udGVuZCBjb25maWcgY3VzdG9tIHJlc291cmNlXG4gICAgICAgIGNvbnN0IGZyb250ZW5kQ29uZmlnTGFtYmRhID0gbmV3IGxhbWJkYS5GdW5jdGlvbih0aGlzLCBgRnJvbnRlbmRDb25maWdMYW1iZGFgLCB7XG4gICAgICAgICAgICBmdW5jdGlvbk5hbWU6IGAke3Byb3BzLmNka0FwcE5hbWV9LUZyb250ZW5kQ29uZmlnTGFtYmRhYCxcbiAgICAgICAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLlBZVEhPTl8zXzgsXG4gICAgICAgICAgICBjb2RlOiBsYW1iZGEuQ29kZS5mcm9tQXNzZXQoJ2xhbWJkYXMvY3VzdG9tLXJlc291cmNlcy9mcm9udGVuZC1jb25maWcnKSxcbiAgICAgICAgICAgIGhhbmRsZXI6ICdpbmRleC5oYW5kbGVyJyxcbiAgICAgICAgICAgIHRpbWVvdXQ6IGNkay5EdXJhdGlvbi5zZWNvbmRzKDEyMCksXG4gICAgICAgICAgICBpbml0aWFsUG9saWN5OiBbbmV3IGlhbS5Qb2xpY3lTdGF0ZW1lbnQoe1xuICAgICAgICAgICAgICAgIGVmZmVjdDogaWFtLkVmZmVjdC5BTExPVyxcbiAgICAgICAgICAgICAgICBhY3Rpb25zOiBbXCJzMzpQdXRPYmplY3RcIiwgXCJzMzpEZWxldGVPYmplY3RcIl0sXG4gICAgICAgICAgICAgICAgcmVzb3VyY2VzOiBbXG4gICAgICAgICAgICAgICAgICAgIGAke3Byb3BzLndlYkFwcEJ1Y2tldC5idWNrZXRBcm59LyR7Y29uZmlnUGFyYW1zWydXZWJBcHBTdGFnaW5nUHJlZml4J119ZnJvbnRlbmQtY29uZmlnLnppcGAsXG4gICAgICAgICAgICAgICAgICAgIGAke3Byb3BzLndlYkFwcEJ1Y2tldC5idWNrZXRBcm59LyR7Y29uZmlnUGFyYW1zWydXZWJBcHBSb290UHJlZml4J119ZnJvbnRlbmQtY29uZmlnLmpzYFxuICAgICAgICAgICAgICAgIF1cbiAgICAgICAgICAgIH0pXVxuICAgICAgICB9KTtcblxuICAgICAgICBjb25zdCBmcm9udGVuZENvbmZpZ0N1c3RvbVJlc291cmNlID0gbmV3IGNkay5DdXN0b21SZXNvdXJjZSh0aGlzLCBgJHtwcm9wcy5jZGtBcHBOYW1lfS1Gcm9udGVuZENvbmZpZ0N1c3RvbVJlc291cmNlYCwge1xuICAgICAgICAgICAgcmVzb3VyY2VUeXBlOiAnQ3VzdG9tOjpGcm9udGVuZENvbmZpZycsXG4gICAgICAgICAgICBzZXJ2aWNlVG9rZW46IGZyb250ZW5kQ29uZmlnTGFtYmRhLmZ1bmN0aW9uQXJuLFxuICAgICAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgICAgICAgIEJ1Y2tldE5hbWU6IHByb3BzLndlYkFwcEJ1Y2tldC5idWNrZXROYW1lLFxuICAgICAgICAgICAgICAgIFdlYkFwcFN0YWdpbmdPYmplY3RQcmVmaXg6IGNvbmZpZ1BhcmFtc1snV2ViQXBwU3RhZ2luZ1ByZWZpeCddLFxuICAgICAgICAgICAgICAgIFdlYkFwcFJvb3RPYmplY3RQcmVmaXg6IGNvbmZpZ1BhcmFtc1snV2ViQXBwUm9vdFByZWZpeCddLFxuICAgICAgICAgICAgICAgIE9iamVjdEtleTogYGZyb250ZW5kLWNvbmZpZy5qc2AsXG4gICAgICAgICAgICAgICAgQ29udGVudFR5cGU6ICd0ZXh0L2phdmFzY3JpcHQnLFxuICAgICAgICAgICAgICAgIENvbnRlbnQ6IGB3aW5kb3cudmNlQ29uZmlnID0gJHtidWlsZENvbmZpZ1BhcmFtZXRlcnMoKX1gXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cbn0iXX0=