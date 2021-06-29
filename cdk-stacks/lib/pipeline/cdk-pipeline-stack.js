"use strict";
// Copyright 2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
Object.defineProperty(exports, "__esModule", { value: true });
exports.CdkPipelineStack = void 0;
const cdk = require("@aws-cdk/core");
const iam = require("@aws-cdk/aws-iam");
const ssm = require("@aws-cdk/aws-ssm");
const codecommit = require("@aws-cdk/aws-codecommit");
const codepipeline = require("@aws-cdk/aws-codepipeline");
const pipelines = require("@aws-cdk/pipelines");
const codepipeline_actions = require("@aws-cdk/aws-codepipeline-actions");
const ssm_params_util_1 = require("../infrastructure/ssm-params-util");
const cdk_pipeline_stage_1 = require("../pipeline/cdk-pipeline-stage");
const configParams = require('../../config.params.json');
class CdkPipelineStack extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        const outputHierarchy = `${configParams.hierarchy}outputParameters`;
        const ssmParams = ssm_params_util_1.loadSSMParams(this);
        /**
        *** STEP 1: CREATE A CODECOMMIT REPO _OR_ IMPORT FROM AN EXISTING ONE   ***
        **/
        let repository;
        if (ssmParams.cdkPipelineCreateNewRepository) {
            repository = new codecommit.Repository(this, `${configParams['CdkAppName']}-Repository`, {
                repositoryName: ssmParams.cdkPipelineRepositoryName
            });
            // *** CREATE AN IAM USER WITH CREDENTIALS TO THE CODECOMMIT REPO ***
            const repositoryUser = new iam.User(this, `${configParams['CdkAppName']}-RepositoryUser`, {
                userName: `codecommit-user-${ssmParams.cdkPipelineRepositoryName}`
            });
            repositoryUser.addToPolicy(new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                resources: [repository.repositoryArn],
                actions: ["codecommit:GitPull", "codecommit:GitPush"],
            }));
            // *** STORE OUTPUTS FROM IAM FOR SETTING UP REPOSITORY MIRRORING ***
            const repositoryUsername = new ssm.StringParameter(this, 'RepositoryUsername', {
                parameterName: `${outputHierarchy}/RepositoryUsername`,
                stringValue: repositoryUser.userName,
                description: `The username created to access the CodeCommit repo. The username & password of this user should be used for repository mirroring.`
            });
            const repositoryUserURL = new ssm.StringParameter(this, 'RepositoryUserURL', {
                parameterName: `${outputHierarchy}/RepositoryUserURL`,
                stringValue: `https://console.aws.amazon.com/iam/home?region=${this.region}#/users/${repositoryUser.userName}?section=security_credentials`,
                description: `URL of the page where you should create the HTTPS Git credentials for AWS CodeCommit. The username & password should then be used for repository mirroring.`
            });
            const repositoryURL = new ssm.StringParameter(this, 'RepositoryURL', {
                parameterName: `${outputHierarchy}/RepositoryURL`,
                stringValue: `https://${repositoryUser.userName}-at-${this.account}@git-codecommit.${this.region}.amazonaws.com/v1/repos/${repository.repositoryName}`,
                description: `Use this URL for your repository mirroring`
            });
        }
        else {
            // *** IMPORT A REPOSITORY ***
            // This imports an existing CodeCommit repository (if you have created it already)
            repository = codecommit.Repository.fromRepositoryName(this, `${configParams['CdkAppName']}-Repository`, ssmParams.cdkPipelineRepositoryName);
        }
        /**
        *** STEP 2: SET UP A CDK PIPELINE  ***
        **/
        const sourceArtifact = new codepipeline.Artifact();
        const cloudAssemblyArtifact = new codepipeline.Artifact();
        const cdkPipeline = new pipelines.CdkPipeline(this, `${configParams['CdkAppName']}-Pipeline`, {
            pipelineName: `${configParams['CdkAppName']}-Pipeline`,
            cloudAssemblyArtifact: cloudAssemblyArtifact,
            sourceAction: new codepipeline_actions.CodeCommitSourceAction({
                actionName: 'CodeCommit',
                output: sourceArtifact,
                repository: repository,
                branch: ssmParams.cdkPipelineRepositoryBranchName
            }),
            synthAction: pipelines.SimpleSynthAction.standardNpmSynth({
                sourceArtifact: sourceArtifact,
                cloudAssemblyArtifact: cloudAssemblyArtifact,
                subdirectory: 'cdk-stacks',
                installCommand: 'npm run install:all',
                buildCommand: 'npm run build:frontend',
                synthCommand: 'npm run cdk:remove:context && npx cdk synth',
                rolePolicyStatements: [
                    new iam.PolicyStatement({
                        actions: ["ssm:GetParameter"],
                        resources: [`arn:aws:ssm:${this.region}:${this.account}:parameter${configParams.hierarchy}*`]
                    }),
                    new iam.PolicyStatement({
                        actions: ["ec2:DescribeAvailabilityZones"],
                        resources: ["*"]
                    })
                ]
            })
        });
        /* *** DEFINE APPLICATION STAGES ****   */
        cdkPipeline.addApplicationStage(new cdk_pipeline_stage_1.CdkPipelineStage(this, ssm_params_util_1.fixDummyValueString(`${configParams['CdkAppName']}-${ssmParams.cdkPipelineStageName}`), {
            env: {
                account: process.env.CDK_DEFAULT_ACCOUNT,
                region: process.env.CDK_DEFAULT_REGION
            },
            deployRecordingStack: ssmParams.deployRecordingStack
        }));
    }
}
exports.CdkPipelineStack = CdkPipelineStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2RrLXBpcGVsaW5lLXN0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiY2RrLXBpcGVsaW5lLXN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSwwRUFBMEU7QUFDMUUsaUNBQWlDOzs7QUFFakMscUNBQXFDO0FBQ3JDLHdDQUF3QztBQUN4Qyx3Q0FBd0M7QUFDeEMsc0RBQXNEO0FBQ3RELDBEQUEwRDtBQUMxRCxnREFBZ0Q7QUFDaEQsMEVBQTBFO0FBQzFFLHVFQUF1RjtBQUN2Rix1RUFBa0U7QUFFbEUsTUFBTSxZQUFZLEdBQUcsT0FBTyxDQUFDLDBCQUEwQixDQUFDLENBQUM7QUFFekQsTUFBYSxnQkFBaUIsU0FBUSxHQUFHLENBQUMsS0FBSztJQUUzQyxZQUFZLEtBQW9CLEVBQUUsRUFBVSxFQUFFLEtBQXNCO1FBQ2hFLEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXhCLE1BQU0sZUFBZSxHQUFHLEdBQUcsWUFBWSxDQUFDLFNBQVMsa0JBQWtCLENBQUM7UUFFcEUsTUFBTSxTQUFTLEdBQUcsK0JBQWEsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUV0Qzs7V0FFRztRQUNILElBQUksVUFBa0MsQ0FBQztRQUV2QyxJQUFJLFNBQVMsQ0FBQyw4QkFBOEIsRUFBRTtZQUMxQyxVQUFVLEdBQUcsSUFBSSxVQUFVLENBQUMsVUFBVSxDQUFDLElBQUksRUFBRSxHQUFHLFlBQVksQ0FBQyxZQUFZLENBQUMsYUFBYSxFQUFFO2dCQUNyRixjQUFjLEVBQUUsU0FBUyxDQUFDLHlCQUF5QjthQUN0RCxDQUFDLENBQUM7WUFFSCxxRUFBcUU7WUFDckUsTUFBTSxjQUFjLEdBQUcsSUFBSSxHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxHQUFHLFlBQVksQ0FBQyxZQUFZLENBQUMsaUJBQWlCLEVBQUU7Z0JBQ3RGLFFBQVEsRUFBRSxtQkFBbUIsU0FBUyxDQUFDLHlCQUF5QixFQUFFO2FBQ3JFLENB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QVMsR0FBRyxDQUFDO3FCQUNoRyxDQUFDO29CQUNGLElBQUksR0FBRyxDQUFDLGVBQWUsQ0FBQzt3QkFDcEIsT0FBTyxFQUFFLENBQUMsK0JBQStCLENBQUM7d0JBQzFDLFNBQVMsRUFBRSxDQUFDLEdBQUcsQ0FBQztxQkFDbkIsQ0FBQztpQkFDTDthQUNKLENBQUM7U0FDTCxDQUFDLENBQUM7UUFFSCwwQ0FBMEM7UUFFMUMsV0FBVyxDQUFDLG1CQUFtQixDQUFDLElBQUkscUNBQWdCLENBQUMsSUFBSSxFQUFFLHFDQUFtQixDQUFDLEdBQUcsWUFBWSxDQUFDLFlBQVksQ0FBQyxJQUFJLFNBQVMsQ0FBQyxvQkFBb0IsRUFBRSxDQUFDLEVBQUU7WUFDL0ksR0FBRyxFQUFFO2dCQUNELE9BQU8sRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLG1CQUFtQjtnQkFDeEMsTUFBTSxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsa0JBQWtCO2FBQ3pDO1lBQ0Qsb0JBQW9CLEVBQUUsU0FBUyxDQUFDLG9CQUFvQjtTQUN2RCxDQUFDLENBQUMsQ0FBQztJQUNSLENBQUM7Q0FFSjtBQXhHRCw0Q0F3R0MiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAyMSBBbWF6b24uY29tLCBJbmMuIG9yIGl0cyBhZmZpbGlhdGVzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy8gU1BEWC1MaWNlbnNlLUlkZW50aWZpZXI6IE1JVC0wXG5cbmltcG9ydCAqIGFzIGNkayBmcm9tICdAYXdzLWNkay9jb3JlJztcbmltcG9ydCAqIGFzIGlhbSBmcm9tICdAYXdzLWNkay9hd3MtaWFtJztcbmltcG9ydCAqIGFzIHNzbSBmcm9tICdAYXdzLWNkay9hd3Mtc3NtJztcbmltcG9ydCAqIGFzIGNvZGVjb21taXQgZnJvbSBcIkBhd3MtY2RrL2F3cy1jb2RlY29tbWl0XCI7XG5pbXBvcnQgKiBhcyBjb2RlcGlwZWxpbmUgZnJvbSBcIkBhd3MtY2RrL2F3cy1jb2RlcGlwZWxpbmVcIjtcbmltcG9ydCAqIGFzIHBpcGVsaW5lcyBmcm9tIFwiQGF3cy1jZGsvcGlwZWxpbmVzXCI7XG5pbXBvcnQgKiBhcyBjb2RlcGlwZWxpbmVfYWN0aW9ucyBmcm9tIFwiQGF3cy1jZGsvYXdzLWNvZGVwaXBlbGluZS1hY3Rpb25zXCI7XG5pbXBvcnQgeyBsb2FkU1NNUGFyYW1zLCBmaXhEdW1teVZhbHVlU3RyaW5nIH0gZnJvbSAnLi4vaW5mcmFzdHJ1Y3R1cmUvc3NtLXBhcmFtcy11dGlsJztcbmltcG9ydCB7IENka1BpcGVsaW5lU3RhZ2UgfSBmcm9tICcuLi9waXBlbGluZS9jZGstcGlwZWxpbmUtc3RhZ2UnO1xuXG5jb25zdCBjb25maWdQYXJhbXMgPSByZXF1aXJlKCcuLi8uLi9jb25maWcucGFyYW1zLmpzb24nKTtcblxuZXhwb3J0IGNsYXNzIENka1BpcGVsaW5lU3RhY2sgZXh0ZW5kcyBjZGsuU3RhY2sge1xuXG4gICAgY29uc3RydWN0b3Ioc2NvcGU6IGNkay5Db25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzPzogY2RrLlN0YWNrUHJvcHMpIHtcbiAgICAgICAgc3VwZXIoc2NvcGUsIGlkLCBwcm9wcyk7XG5cbiAgICAgICAgY29uc3Qgb3V0cHV0SGllcmFyY2h5ID0gYCR7Y29uZmlnUGFyYW1zLmhpZXJhcmNoeX1vdXRwdXRQYXJhbWV0ZXJzYDtcblxuICAgICAgICBjb25zdCBzc21QYXJhbXMgPSBsb2FkU1NNUGFyYW1zKHRoaXMpO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAqKiogU1RFUCAxOiBDUkVBVEUgQSBDT0RFQ09NTUlUIFJFUE8gX09SXyBJTVBPUlQgRlJPTSBBTiBFWElTVElORyBPTkUgICAqKipcbiAgICAgICAgKiovXG4gICAgICAgIGxldCByZXBvc2l0b3J5OiBjb2RlY29tbWl0LklSZXBvc2l0b3J5O1xuXG4gICAgICAgIGlmIChzc21QYXJhbXMuY2RrUGlwZWxpbmVDcmVhdGVOZXdSZXBvc2l0b3J5KSB7XG4gICAgICAgICAgICByZXBvc2l0b3J5ID0gbmV3IGNvZGVjb21taXQuUmVwb3NpdG9yeSh0aGlzLCBgJHtjb25maWdQYXJhbXNbJ0Nka0FwcE5hbWUnXX0tUmVwb3NpdG9yeWAsIHtcbiAgICAgICAgICAgICAgICByZXBvc2l0b3J5TmFtZTogc3NtUGFyYW1zLmNka1BpcGVsaW5lUmVwb3NpdG9yeU5hbWVcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAvLyAqKiogQ1JFQVRFIEFOIElBTSBVU0VSIFdJVEggQ1JFREVOVElBTFMgVE8gVEhFIENPREVDT01NSVQgUkVQTyAqKipcbiAgICAgICAgICAgIGNvbnN0IHJlcG9zaXRvcnlVc2VyID0gbmV3IGlhbS5Vc2VyKHRoaXMsIGAke2NvbmZpZ1BhcmFtc1snQ2RrQXBwTmFtZSddfS1SZXBvc2l0b3J5VXNlcmAsIHtcbiAgICAgICAgICAgICAgICB1c2VyTmFtZTogYGNvZGVjb21taXQtdXNlci0ke3NzbVBhcmFtcy5jZGtQaXBlbGluZVJlcG9zaXRvcnlOYW1lfWBcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICByZXBvc2l0b3J5VXNlci5hZGRUb1BvbGljeShcbiAgICAgICAgICAgICAgICBuZXcgaWFtLlBvbGljeVN0YXRlbWVudCh7XG4gICAgICAgICAgICAgICAgICAgIGVmZmVjdDogaWFtLkVmZmVjdC5BTExPVyxcbiAgICAgICAgICAgICAgICAgICAgcmVzb3VyY2VzOiBbcmVwb3NpdG9yeS5yZXBvc2l0b3J5QXJuXSxcbiAgICAgICAgICAgICAgICAgICAgYWN0aW9uczogW1wiY29kZWNvbW1pdDpHaXRQdWxsXCIsIFwiY29kZWNvbW1pdDpHaXRQdXNoXCJdLFxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICApO1xuXG4gICAgICAgICAgICAvLyAqKiogU1RPUkUgT1VUUFVUUyBGUk9NIElBTSBGT1IgU0VUVElORyBVUCBSRVBPU0lUT1JZIE1JUlJPUklORyAqKipcblxuICAgICAgICAgICAgY29uc3QgcmVwb3NpdG9yeVVzZXJuYW1lID0gbmV3IHNzbS5TdHJpbmdQYXJhbWV0ZXIodGhpcywgJ1JlcG9zaXRvcnlVc2VybmFtZScsIHtcbiAgICAgICAgICAgICAgICBwYXJhbWV0ZXJOYW1lOiBgJHtvdXRwdXRIaWVyYXJjaHl9L1JlcG9zaXRvcnlVc2VybmFtZWAsXG4gICAgICAgICAgICAgICAgc3RyaW5nVmFsdWU6IHJlcG9zaXRvcnlVc2VyLnVzZXJOYW1lLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBgVGhlIHVzZXJuYW1lIGNyZWF0ZWQgdG8gYWNjZXNzIHRoZSBDb2RlQ29tbWl0IHJlcG8uIFRoZSB1c2VybmFtZSAmIHBhc3N3b3JkIG9mIHRoaXMgdXNlciBzaG91bGQgYmUgdXNlZCBmb3IgcmVwb3NpdG9yeSBtaXJyb3JpbmcuYFxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGNvbnN0IHJlcG9zaXRvcnlVc2VyVVJMID0gbmV3IHNzbS5TdHJpbmdQYXJhbWV0ZXIodGhpcywgJ1JlcG9zaXRvcnlVc2VyVVJMJywge1xuICAgICAgICAgICAgICAgIHBhcmFtZXRlck5hbWU6IGAke291dHB1dEhpZXJhcmNoeX0vUmVwb3NpdG9yeVVzZXJVUkxgLFxuICAgICAgICAgICAgICAgIHN0cmluZ1ZhbHVlOiBgaHR0cHM6Ly9jb25zb2xlLmF3cy5hbWF6b24uY29tL2lhbS9ob21lP3JlZ2lvbj0ke3RoaXMucmVnaW9ufSMvdXNlcnMvJHtyZXBvc2l0b3J5VXNlci51c2VyTmFtZX0/c2VjdGlvbj1zZWN1cml0eV9jcmVkZW50aWFsc2AsXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IGBVUkwgb2YgdGhlIHBhZ2Ugd2hlcmUgeW91IHNob3VsZCBjcmVhdGUgdGhlIEhUVFBTIEdpdCBjcmVkZW50aWFscyBmb3IgQVdTIENvZGVDb21taXQuIFRoZSB1c2VybmFtZSAmIHBhc3N3b3JkIHNob3VsZCB0aGVuIGJlIHVzZWQgZm9yIHJlcG9zaXRvcnkgbWlycm9yaW5nLmBcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBjb25zdCByZXBvc2l0b3J5VVJMID0gbmV3IHNzbS5TdHJpbmdQYXJhbWV0ZXIodGhpcywgJ1JlcG9zaXRvcnlVUkwnLCB7XG4gICAgICAgICAgICAgICAgcGFyYW1ldGVyTmFtZTogYCR7b3V0cHV0SGllcmFyY2h5fS9SZXBvc2l0b3J5VVJMYCxcbiAgICAgICAgICAgICAgICBzdHJpbmdWYWx1ZTogYGh0dHBzOi8vJHtyZXBvc2l0b3J5VXNlci51c2VyTmFtZX0tYXQtJHt0aGlzLmFjY291bnR9QGdpdC1jb2RlY29tbWl0LiR7dGhpcy5yZWdpb259LmFtYXpvbmF3cy5jb20vdjEvcmVwb3MvJHtyZXBvc2l0b3J5LnJlcG9zaXRvcnlOYW1lfWAsXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IGBVc2UgdGhpcyBVUkwgZm9yIHlvdXIgcmVwb3NpdG9yeSBtaXJyb3JpbmdgXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIC8vICoqKiBJTVBPUlQgQSBSRVBPU0lUT1JZICoqKlxuICAgICAgICAgICAgLy8gVGhpcyBpbXBvcnRzIGFuIGV4aXN0aW5nIENvZGVDb21taXQgcmVwb3NpdG9yeSAoaWYgeW91IGhhdmUgY3JlYXRlZCBpdCBhbHJlYWR5KVxuICAgICAgICAgICAgcmVwb3NpdG9yeSA9IGNvZGVjb21taXQuUmVwb3NpdG9yeS5mcm9tUmVwb3NpdG9yeU5hbWUodGhpcywgYCR7Y29uZmlnUGFyYW1zWydDZGtBcHBOYW1lJ119LVJlcG9zaXRvcnlgLCBzc21QYXJhbXMuY2RrUGlwZWxpbmVSZXBvc2l0b3J5TmFtZSk7XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgKioqIFNURVAgMjogU0VUIFVQIEEgQ0RLIFBJUEVMSU5FICAqKipcbiAgICAgICAgKiovXG4gICAgICAgIGNvbnN0IHNvdXJjZUFydGlmYWN0ID0gbmV3IGNvZGVwaXBlbGluZS5BcnRpZmFjdCgpO1xuICAgICAgICBjb25zdCBjbG91ZEFzc2VtYmx5QXJ0aWZhY3QgPSBuZXcgY29kZXBpcGVsaW5lLkFydGlmYWN0KCk7XG5cbiAgICAgICAgY29uc3QgY2RrUGlwZWxpbmUgPSBuZXcgcGlwZWxpbmVzLkNka1BpcGVsaW5lKHRoaXMsIGAke2NvbmZpZ1BhcmFtc1snQ2RrQXBwTmFtZSddfS1QaXBlbGluZWAsIHtcbiAgICAgICAgICAgIHBpcGVsaW5lTmFtZTogYCR7Y29uZmlnUGFyYW1zWydDZGtBcHBOYW1lJ119LVBpcGVsaW5lYCxcbiAgICAgICAgICAgIGNsb3VkQXNzZW1ibHlBcnRpZmFjdDogY2xvdWRBc3NlbWJseUFydGlmYWN0LFxuICAgICAgICAgICAgc291cmNlQWN0aW9uOiBuZXcgY29kZXBpcGVsaW5lX2FjdGlvbnMuQ29kZUNvbW1pdFNvdXJjZUFjdGlvbih7XG4gICAgICAgICAgICAgICAgYWN0aW9uTmFtZTogJ0NvZGVDb21taXQnLFxuICAgICAgICAgICAgICAgIG91dHB1dDogc291cmNlQXJ0aWZhY3QsXG4gICAgICAgICAgICAgICAgcmVwb3NpdG9yeTogcmVwb3NpdG9yeSxcbiAgICAgICAgICAgICAgICBicmFuY2g6IHNzbVBhcmFtcy5jZGtQaXBlbGluZVJlcG9zaXRvcnlCcmFuY2hOYW1lXG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICAgIHN5bnRoQWN0aW9uOiBwaXBlbGluZXMuU2ltcGxlU3ludGhBY3Rpb24uc3RhbmRhcmROcG1TeW50aCh7XG4gICAgICAgICAgICAgICAgc291cmNlQXJ0aWZhY3Q6IHNvdXJjZUFydGlmYWN0LFxuICAgICAgICAgICAgICAgIGNsb3VkQXNzZW1ibHlBcnRpZmFjdDogY2xvdWRBc3NlbWJseUFydGlmYWN0LFxuICAgICAgICAgICAgICAgIHN1YmRpcmVjdG9yeTogJ2Nkay1zdGFja3MnLFxuICAgICAgICAgICAgICAgIGluc3RhbGxDb21tYW5kOiAnbnBtIHJ1biBpbnN0YWxsOmFsbCcsXG4gICAgICAgICAgICAgICAgYnVpbGRDb21tYW5kOiAnbnBtIHJ1biBidWlsZDpmcm9udGVuZCcsXG4gICAgICAgICAgICAgICAgc3ludGhDb21tYW5kOiAnbnBtIHJ1biBjZGs6cmVtb3ZlOmNvbnRleHQgJiYgbnB4IGNkayBzeW50aCcsXG4gICAgICAgICAgICAgICAgcm9sZVBvbGljeVN0YXRlbWVudHM6IFtcbiAgICAgICAgICAgICAgICAgICAgbmV3IGlhbS5Qb2xpY3lTdGF0ZW1lbnQoe1xuICAgICAgICAgICAgICAgICAgICAgICAgYWN0aW9uczogW1wic3NtOkdldFBhcmFtZXRlclwiXSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc291cmNlczogW2Bhcm46YXdzOnNzbToke3RoaXMucmVnaW9ufToke3RoaXMuYWNjb3VudH06cGFyYW1ldGVyJHtjb25maWdQYXJhbXMuaGllcmFyY2h5fSpgXVxuICAgICAgICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgICAgICAgICAgbmV3IGlhbS5Qb2xpY3lTdGF0ZW1lbnQoe1xuICAgICAgICAgICAgICAgICAgICAgICAgYWN0aW9uczogW1wiZWMyOkRlc2NyaWJlQXZhaWxhYmlsaXR5Wm9uZXNcIl0sXG4gICAgICAgICAgICAgICAgICAgICAgICByZXNvdXJjZXM6IFtcIipcIl1cbiAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICB9KVxuICAgICAgICB9KTtcblxuICAgICAgICAvKiAqKiogREVGSU5FIEFQUExJQ0FUSU9OIFNUQUdFUyAqKioqICAgKi9cblxuICAgICAgICBjZGtQaXBlbGluZS5hZGRBcHBsaWNhdGlvblN0YWdlKG5ldyBDZGtQaXBlbGluZVN0YWdlKHRoaXMsIGZpeER1bW15VmFsdWVTdHJpbmcoYCR7Y29uZmlnUGFyYW1zWydDZGtBcHBOYW1lJ119LSR7c3NtUGFyYW1zLmNka1BpcGVsaW5lU3RhZ2VOYW1lfWApLCB7XG4gICAgICAgICAgICBlbnY6IHtcbiAgICAgICAgICAgICAgICBhY2NvdW50OiBwcm9jZXNzLmVudi5DREtfREVGQVVMVF9BQ0NPVU5ULFxuICAgICAgICAgICAgICAgIHJlZ2lvbjogcHJvY2Vzcy5lbnYuQ0RLX0RFRkFVTFRfUkVHSU9OXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZGVwbG95UmVjb3JkaW5nU3RhY2s6IHNzbVBhcmFtcy5kZXBsb3lSZWNvcmRpbmdTdGFja1xuICAgICAgICB9KSk7XG4gICAgfVxuXG59Il19