"use strict";
// Copyright 2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
Object.defineProperty(exports, "__esModule", { value: true });
exports.CognitoStack = void 0;
const cdk = require("@aws-cdk/core");
const cognito = require("@aws-cdk/aws-cognito");
const iam = require("@aws-cdk/aws-iam");
class CognitoStack extends cdk.NestedStack {
    constructor(scope, id, props) {
        super(scope, id, props);
        //create a User Pool
        const userPool = new cognito.UserPool(this, 'UserPool', {
            userPoolName: `${props.cdkAppName}-UserPool`,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            signInAliases: {
                username: false,
                phone: false,
                email: true
            },
            standardAttributes: {
                email: {
                    required: false,
                    mutable: true
                }
            },
            customAttributes: {
                connectUserId: new cognito.StringAttribute({ minLen: 36, maxLen: 36, mutable: true })
            },
            userInvitation: {
                emailSubject: "Your VideoCallEscalation temporary password",
                emailBody: "Your VideoCallEscalation username is {username} and temporary password is {####}"
            },
            userVerification: {
                emailSubject: "Verify your new VideoCallEscalation account",
                emailBody: "The verification code to your new VideoCallEscalation account is {####}"
            }
        });
        //SAML Federation
        let cognitoSAML = undefined;
        let supportedIdentityProviders = [];
        let userPoolClientOAuthConfig = {
            scopes: [cognito.OAuthScope.EMAIL, cognito.OAuthScope.OPENID, cognito.OAuthScope.COGNITO_ADMIN, cognito.OAuthScope.PROFILE]
        };
        if (props.SSMParams.cognitoSAMLEnabled) {
            cognitoSAML = new cognito.CfnUserPoolIdentityProvider(this, "CognitoSAML", {
                providerName: props.SSMParams.cognitoSAMLIdentityProviderName,
                providerType: 'SAML',
                providerDetails: {
                    MetadataURL: props.SSMParams.cognitoSAMLIdentityProviderURL
                },
                attributeMapping: {
                    "email": "email",
                    "email_verified": "email_verified",
                    "name": "name"
                },
                userPoolId: userPool.userPoolId
            });
            supportedIdentityProviders.push(cognito.UserPoolClientIdentityProvider.custom(cognitoSAML.providerName));
            userPoolClientOAuthConfig = {
                ...userPoolClientOAuthConfig,
                callbackUrls: props.SSMParams.cognitoSAMLCallbackUrls.split(',').map((item) => item.trim()),
                logoutUrls: props.SSMParams.cognitoSAMLLogoutUrls.split(',').map((item) => item.trim())
            };
        }
        //create a User Pool Client
        const userPoolClient = new cognito.UserPoolClient(this, 'UserPoolClient', {
            userPool: userPool,
            userPoolClientName: 'amplifyFrontend',
            generateSecret: false,
            supportedIdentityProviders: supportedIdentityProviders,
            oAuth: userPoolClientOAuthConfig
        });
        if (cognitoSAML) {
            userPoolClient.node.addDependency(cognitoSAML);
        }
        const userPoolDomain = new cognito.CfnUserPoolDomain(this, "UserPoolDomain", {
            domain: props.SSMParams.cognitoDomainPrefix,
            userPoolId: userPool.userPoolId
        });
        //create an Identity Pool
        const identityPool = new cognito.CfnIdentityPool(this, 'IdentityPool', {
            identityPoolName: `${props.cdkAppName}-IdentityPool`,
            allowUnauthenticatedIdentities: false,
            cognitoIdentityProviders: [{
                    clientId: userPoolClient.userPoolClientId,
                    providerName: userPool.userPoolProviderName
                }],
        });
        //Cognito Identity Pool Roles
        const unauthenticatedRole = new iam.Role(this, 'CognitoDefaultUnauthenticatedRole', {
            assumedBy: new iam.FederatedPrincipal('cognito-identity.amazonaws.com', {
                "StringEquals": { "cognito-identity.amazonaws.com:aud": identityPool.ref },
                "ForAnyValue:StringLike": { "cognito-identity.amazonaws.com:amr": "unauthenticated" },
            }, "sts:AssumeRoleWithWebIdentity")
        });
        unauthenticatedRole.addToPolicy(new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
                "mobileanalytics:PutEvents",
                "cognito-sync:*"
            ],
            resources: ["*"]
        }));
        const authenticatedRole = new iam.Role(this, "CognitoDefaultAuthenticatedRole", {
            assumedBy: new iam.FederatedPrincipal('cognito-identity.amazonaws.com', {
                "StringEquals": { "cognito-identity.amazonaws.com:aud": identityPool.ref },
                "ForAnyValue:StringLike": { "cognito-identity.amazonaws.com:amr": "authenticated" },
            }, "sts:AssumeRoleWithWebIdentity")
        });
        authenticatedRole.addToPolicy(new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
                "mobileanalytics:PutEvents",
                "cognito-sync:*",
                "cognito-identity:*"
            ],
            resources: ["*"]
        }));
        const defaultPolicy = new cognito.CfnIdentityPoolRoleAttachment(this, 'DefaultValid', {
            identityPoolId: identityPool.ref,
            roles: {
                'unauthenticated': unauthenticatedRole.roleArn,
                'authenticated': authenticatedRole.roleArn
            }
        });
        this.authenticatedRole = authenticatedRole;
        /**************************************************************************************************************
        * Stack Outputs *
        **************************************************************************************************************/
        this.identityPool = identityPool;
        this.userPool = userPool;
        this.userPoolClient = userPoolClient;
        this.userPoolDomain = userPoolDomain;
    }
}
exports.CognitoStack = CognitoStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29nbml0by1zdGFjay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImNvZ25pdG8tc3RhY2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLDBFQUEwRTtBQUMxRSxpQ0FBaUM7OztBQUVqQyxxQ0FBcUM7QUFDckMsZ0RBQStDO0FBQy9DLHdDQUF3QztBQU94QyxNQUFhLFlBQWEsU0FBUSxHQUFHLENBQUMsV0FBVztJQVM3QyxZQUFZLEtBQW9CLEVBQUUsRUFBVSxFQUFFLEtBQXdCO1FBQ2xFLEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXhCLG9CQUFvQjtRQUNwQixNQUFNLFFBQVEsR0FBRyxJQUFJLE9BQU8sQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLFVBQVUsRUFBRTtZQUNwRCxZQUFZLEVBQUUsR0FBRyxLQUFLLENBQUMsVUFBVSxXQUFXO1lBQzVDLGFBQWEsRUFBRSxHQUFHLENBQUMsYUFBYSxDQUFDLE9BQU87WUFDeEMsYUFBYSxFQUFFO2dCQUNYLFFBQVEsRUFBRSxLQUFLO2dCQUNmLEtBQUssRUFBRSxLQUFLO2dCQUNaLEtBQUssRUFBRSxJQUFJO2FBQ2Q7WUFDRCxrQkFBa0IsRUFBRTtnQkFDaEIsS0FBSyxFQUFFO29CQUNILFFBQVEsRUFBRSxLQUFLO29CQUNmLE9BQU8sRUFBRSxJQUFJO2lCQUNoQjthQUNKO1lBQ0QsZ0JBQWdCLEVBQUU7Z0JBQ2QsYUFBYSxFQUFFLElBQUksT0FBTyxDQUFDLGVBQWUsQ0FBQyxFQUFFLE1BQU0sRUFBRSxFQUFFLEVBQUUsTUFBTSxFQUFFLEVBQUUsRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLENBQUM7YUFDeEY7WUFDRCxjQUFjLEVBQUU7Z0JBQ1osWUFBWSxFQUFFLDZDQUE2QztnQkFDM0QsU0FBUyxFQUFFLGtGQUFrRjthQUNoRztZQUNELGdCQUFnQixFQUFFO2dCQUNkLFlBQVksRUFBRSw2Q0FBNkM7Z0JBQzNELFNBQVMsRUFBRSx5RUFBeUU7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QUMsQ0FBQyxDQUFDO1FBRUosTUFBTSxhQUFhLEdBQUcsSUFBSSxPQUFPLENBQUMsNkJBQTZCLENBQUMsSUFBSSxFQUFFLGNBQWMsRUFBRTtZQUNsRixjQUFjLEVBQUUsWUFBWSxDQUFDLEdBQUc7WUFDaEMsS0FBSyxFQUFFO2dCQUNILGlCQUFpQixFQUFFLG1CQUFtQixDQUFDLE9BQU87Z0JBQzlDLGVBQWUsRUFBRSxpQkFBaUIsQ0FBQyxPQUFPO2FBQzdDO1NBQ0osQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLGlCQUFpQixHQUFHLGlCQUFpQixDQUFDO1FBRTNDOzt1SEFFK0c7UUFFL0csSUFBSSxDQUFDLFlBQVksR0FBRyxZQUFZLENBQUM7UUFDakMsSUFBSSxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUM7UUFDekIsSUFBSSxDQUFDLGNBQWMsR0FBRyxjQUFjLENBQUM7UUFDckMsSUFBSSxDQUFDLGNBQWMsR0FBRyxjQUFjLENBQUM7SUFDekMsQ0FBQztDQUNKO0FBdkpELG9DQXVKQyIsInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDIxIEFtYXpvbi5jb20sIEluYy4gb3IgaXRzIGFmZmlsaWF0ZXMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vLyBTUERYLUxpY2Vuc2UtSWRlbnRpZmllcjogTUlULTBcblxuaW1wb3J0ICogYXMgY2RrIGZyb20gJ0Bhd3MtY2RrL2NvcmUnO1xuaW1wb3J0ICogYXMgY29nbml0byBmcm9tICdAYXdzLWNkay9hd3MtY29nbml0bydcbmltcG9ydCAqIGFzIGlhbSBmcm9tICdAYXdzLWNkay9hd3MtaWFtJztcblxuZXhwb3J0IGludGVyZmFjZSBDb2duaXRvU3RhY2tQcm9wcyBleHRlbmRzIGNkay5OZXN0ZWRTdGFja1Byb3BzIHtcbiAgICByZWFkb25seSBTU01QYXJhbXM6IGFueTtcbiAgICByZWFkb25seSBjZGtBcHBOYW1lOiBzdHJpbmc7XG59XG5cbmV4cG9ydCBjbGFzcyBDb2duaXRvU3RhY2sgZXh0ZW5kcyBjZGsuTmVzdGVkU3RhY2sge1xuXG4gICAgcHVibGljIHJlYWRvbmx5IGF1dGhlbnRpY2F0ZWRSb2xlOiBpYW0uSVJvbGU7XG5cbiAgICBwdWJsaWMgcmVhZG9ubHkgaWRlbnRpdHlQb29sOiBjb2duaXRvLkNmbklkZW50aXR5UG9vbDtcbiAgICBwdWJsaWMgcmVhZG9ubHkgdXNlclBvb2w6IGNvZ25pdG8uSVVzZXJQb29sO1xuICAgIHB1YmxpYyByZWFkb25seSB1c2VyUG9vbENsaWVudDogY29nbml0by5JVXNlclBvb2xDbGllbnQ7XG4gICAgcHVibGljIHJlYWRvbmx5IHVzZXJQb29sRG9tYWluOiBjb2duaXRvLkNmblVzZXJQb29sRG9tYWluO1xuXG4gICAgY29uc3RydWN0b3Ioc2NvcGU6IGNkay5Db25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzOiBDb2duaXRvU3RhY2tQcm9wcykge1xuICAgICAgICBzdXBlcihzY29wZSwgaWQsIHByb3BzKTtcblxuICAgICAgICAvL2NyZWF0ZSBhIFVzZXIgUG9vbFxuICAgICAgICBjb25zdCB1c2VyUG9vbCA9IG5ldyBjb2duaXRvLlVzZXJQb29sKHRoaXMsICdVc2VyUG9vbCcsIHtcbiAgICAgICAgICAgIHVzZXJQb29sTmFtZTogYCR7cHJvcHMuY2RrQXBwTmFtZX0tVXNlclBvb2xgLFxuICAgICAgICAgICAgcmVtb3ZhbFBvbGljeTogY2RrLlJlbW92YWxQb2xpY3kuREVTVFJPWSxcbiAgICAgICAgICAgIHNpZ25JbkFsaWFzZXM6IHtcbiAgICAgICAgICAgICAgICB1c2VybmFtZTogZmFsc2UsXG4gICAgICAgICAgICAgICAgcGhvbmU6IGZhbHNlLFxuICAgICAgICAgICAgICAgIGVtYWlsOiB0cnVlXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc3RhbmRhcmRBdHRyaWJ1dGVzOiB7XG4gICAgICAgICAgICAgICAgZW1haWw6IHtcbiAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWQ6IGZhbHNlLCAgIC8vQ29nbml0byBidWcgd2l0aCBmZWRlcmF0aW9uIC0gSWYgeW91IG1ha2UgYSB1c2VyIHBvb2wgd2l0aCByZXF1aXJlZCBlbWFpbCBmaWVsZCB0aGVuIHRoZSBzZWNvbmQgZ29vZ2xlIGxvZ2luIGF0dGVtcHQgZmFpbHMgKGh0dHBzOi8vZ2l0aHViLmNvbS9hd3MtYW1wbGlmeS9hbXBsaWZ5LWpzL2lzc3Vlcy8zNTI2KVxuICAgICAgICAgICAgICAgICAgICBtdXRhYmxlOiB0cnVlXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGN1c3RvbUF0dHJpYnV0ZXM6IHtcbiAgICAgICAgICAgICAgICBjb25uZWN0VXNlcklkOiBuZXcgY29nbml0by5TdHJpbmdBdHRyaWJ1dGUoeyBtaW5MZW46IDM2LCBtYXhMZW46IDM2LCBtdXRhYmxlOiB0cnVlIH0pXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdXNlckludml0YXRpb246IHtcbiAgICAgICAgICAgICAgICBlbWFpbFN1YmplY3Q6IFwiWW91ciBWaWRlb0NhbGxFc2NhbGF0aW9uIHRlbXBvcmFyeSBwYXNzd29yZFwiLFxuICAgICAgICAgICAgICAgIGVtYWlsQm9keTogXCJZb3VyIFZpZGVvQ2FsbEVzY2FsYXRpb24gdXNlcm5hbWUgaXMge3VzZXJuYW1lfSBhbmQgdGVtcG9yYXJ5IHBhc3N3b3JkIGlzIHsjIyMjfVwiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdXNlclZlcmlmaWNhdGlvbjoge1xuICAgICAgICAgICAgICAgIGVtYWlsU3ViamVjdDogXCJWZXJpZnkgeW91ciBuZXcgVmlkZW9DYWxsRXNjYWxhdGlvbiBhY2NvdW50XCIsXG4gICAgICAgICAgICAgICAgZW1haWxCb2R5OiBcIlRoZSB2ZXJpZmljYXRpb24gY29kZSB0byB5b3VyIG5ldyBWaWRlb0NhbGxFc2NhbGF0aW9uIGFjY291bnQgaXMgeyMjIyN9XCJcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy9TQU1MIEZlZGVyYXRpb25cbiAgICAgICAgbGV0IGNvZ25pdG9TQU1MOiBjb2duaXRvLkNmblVzZXJQb29sSWRlbnRpdHlQcm92aWRlciB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZDtcbiAgICAgICAgbGV0IHN1cHBvcnRlZElkZW50aXR5UHJvdmlkZXJzOiBjb2duaXRvLlVzZXJQb29sQ2xpZW50SWRlbnRpdHlQcm92aWRlcltdID0gW107XG4gICAgICAgIGxldCB1c2VyUG9vbENsaWVudE9BdXRoQ29uZmlnOiBjb2duaXRvLk9BdXRoU2V0dGluZ3MgPSB7XG4gICAgICAgICAgICBzY29wZXM6IFtjb2duaXRvLk9BdXRoU2NvcGUuRU1BSUwsIGNvZ25pdG8uT0F1dGhTY29wZS5PUEVOSUQsIGNvZ25pdG8uT0F1dGhTY29wZS5DT0dOSVRPX0FETUlOLCBjb2duaXRvLk9BdXRoU2NvcGUuUFJPRklMRV1cbiAgICAgICAgfVxuICAgICAgICBpZiAocHJvcHMuU1NNUGFyYW1zLmNvZ25pdG9TQU1MRW5hYmxlZCkge1xuICAgICAgICAgICAgY29nbml0b1NBTUwgPSBuZXcgY29nbml0by5DZm5Vc2VyUG9vbElkZW50aXR5UHJvdmlkZXIodGhpcywgXCJDb2duaXRvU0FNTFwiLCB7XG4gICAgICAgICAgICAgICAgcHJvdmlkZXJOYW1lOiBwcm9wcy5TU01QYXJhbXMuY29nbml0b1NBTUxJZGVudGl0eVByb3ZpZGVyTmFtZSxcbiAgICAgICAgICAgICAgICBwcm92aWRlclR5cGU6ICdTQU1MJyxcbiAgICAgICAgICAgICAgICBwcm92aWRlckRldGFpbHM6IHtcbiAgICAgICAgICAgICAgICAgICAgTWV0YWRhdGFVUkw6IHByb3BzLlNTTVBhcmFtcy5jb2duaXRvU0FNTElkZW50aXR5UHJvdmlkZXJVUkxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGF0dHJpYnV0ZU1hcHBpbmc6IHtcbiAgICAgICAgICAgICAgICAgICAgXCJlbWFpbFwiOiBcImVtYWlsXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiZW1haWxfdmVyaWZpZWRcIjogXCJlbWFpbF92ZXJpZmllZFwiLFxuICAgICAgICAgICAgICAgICAgICBcIm5hbWVcIjogXCJuYW1lXCJcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHVzZXJQb29sSWQ6IHVzZXJQb29sLnVzZXJQb29sSWRcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICBzdXBwb3J0ZWRJZGVudGl0eVByb3ZpZGVycy5wdXNoKGNvZ25pdG8uVXNlclBvb2xDbGllbnRJZGVudGl0eVByb3ZpZGVyLmN1c3RvbShjb2duaXRvU0FNTC5wcm92aWRlck5hbWUpKTtcbiAgICAgICAgICAgIHVzZXJQb29sQ2xpZW50T0F1dGhDb25maWcgPSB7XG4gICAgICAgICAgICAgICAgLi4udXNlclBvb2xDbGllbnRPQXV0aENvbmZpZyxcbiAgICAgICAgICAgICAgICBjYWxsYmFja1VybHM6IHByb3BzLlNTTVBhcmFtcy5jb2duaXRvU0FNTENhbGxiYWNrVXJscy5zcGxpdCgnLCcpLm1hcCgoaXRlbTogc3RyaW5nKSA9PiBpdGVtLnRyaW0oKSksXG4gICAgICAgICAgICAgICAgbG9nb3V0VXJsczogcHJvcHMuU1NNUGFyYW1zLmNvZ25pdG9TQU1MTG9nb3V0VXJscy5zcGxpdCgnLCcpLm1hcCgoaXRlbTogc3RyaW5nKSA9PiBpdGVtLnRyaW0oKSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vY3JlYXRlIGEgVXNlciBQb29sIENsaWVudFxuICAgICAgICBjb25zdCB1c2VyUG9vbENsaWVudCA9IG5ldyBjb2duaXRvLlVzZXJQb29sQ2xpZW50KHRoaXMsICdVc2VyUG9vbENsaWVudCcsIHtcbiAgICAgICAgICAgIHVzZXJQb29sOiB1c2VyUG9vbCxcbiAgICAgICAgICAgIHVzZXJQb29sQ2xpZW50TmFtZTogJ2FtcGxpZnlGcm9udGVuZCcsXG4gICAgICAgICAgICBnZW5lcmF0ZVNlY3JldDogZmFsc2UsXG4gICAgICAgICAgICBzdXBwb3J0ZWRJZGVudGl0eVByb3ZpZGVyczogc3VwcG9ydGVkSWRlbnRpdHlQcm92aWRlcnMsXG4gICAgICAgICAgICBvQXV0aDogdXNlclBvb2xDbGllbnRPQXV0aENvbmZpZ1xuICAgICAgICB9KTtcblxuICAgICAgICBpZiAoY29nbml0b1NBTUwpIHtcbiAgICAgICAgICAgIHVzZXJQb29sQ2xpZW50Lm5vZGUuYWRkRGVwZW5kZW5jeShjb2duaXRvU0FNTCk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCB1c2VyUG9vbERvbWFpbiA9IG5ldyBjb2duaXRvLkNmblVzZXJQb29sRG9tYWluKHRoaXMsIFwiVXNlclBvb2xEb21haW5cIiwge1xuICAgICAgICAgICAgZG9tYWluOiBwcm9wcy5TU01QYXJhbXMuY29nbml0b0RvbWFpblByZWZpeCxcbiAgICAgICAgICAgIHVzZXJQb29sSWQ6IHVzZXJQb29sLnVzZXJQb29sSWRcbiAgICAgICAgfSk7XG5cblxuICAgICAgICAvL2NyZWF0ZSBhbiBJZGVudGl0eSBQb29sXG4gICAgICAgIGNvbnN0IGlkZW50aXR5UG9vbCA9IG5ldyBjb2duaXRvLkNmbklkZW50aXR5UG9vbCh0aGlzLCAnSWRlbnRpdHlQb29sJywge1xuICAgICAgICAgICAgaWRlbnRpdHlQb29sTmFtZTogYCR7cHJvcHMuY2RrQXBwTmFtZX0tSWRlbnRpdHlQb29sYCxcbiAgICAgICAgICAgIGFsbG93VW5hdXRoZW50aWNhdGVkSWRlbnRpdGllczogZmFsc2UsXG4gICAgICAgICAgICBjb2duaXRvSWRlbnRpdHlQcm92aWRlcnM6IFt7XG4gICAgICAgICAgICAgICAgY2xpZW50SWQ6IHVzZXJQb29sQ2xpZW50LnVzZXJQb29sQ2xpZW50SWQsXG4gICAgICAgICAgICAgICAgcHJvdmlkZXJOYW1lOiB1c2VyUG9vbC51c2VyUG9vbFByb3ZpZGVyTmFtZVxuICAgICAgICAgICAgfV0sXG5cbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy9Db2duaXRvIElkZW50aXR5IFBvb2wgUm9sZXNcbiAgICAgICAgY29uc3QgdW5hdXRoZW50aWNhdGVkUm9sZSA9IG5ldyBpYW0uUm9sZSh0aGlzLCAnQ29nbml0b0RlZmF1bHRVbmF1dGhlbnRpY2F0ZWRSb2xlJywge1xuICAgICAgICAgICAgYXNzdW1lZEJ5OiBuZXcgaWFtLkZlZGVyYXRlZFByaW5jaXBhbCgnY29nbml0by1pZGVudGl0eS5hbWF6b25hd3MuY29tJywge1xuICAgICAgICAgICAgICAgIFwiU3RyaW5nRXF1YWxzXCI6IHsgXCJjb2duaXRvLWlkZW50aXR5LmFtYXpvbmF3cy5jb206YXVkXCI6IGlkZW50aXR5UG9vbC5yZWYgfSxcbiAgICAgICAgICAgICAgICBcIkZvckFueVZhbHVlOlN0cmluZ0xpa2VcIjogeyBcImNvZ25pdG8taWRlbnRpdHkuYW1hem9uYXdzLmNvbTphbXJcIjogXCJ1bmF1dGhlbnRpY2F0ZWRcIiB9LFxuICAgICAgICAgICAgfSwgXCJzdHM6QXNzdW1lUm9sZVdpdGhXZWJJZGVudGl0eVwiKVxuICAgICAgICB9KTtcblxuICAgICAgICB1bmF1dGhlbnRpY2F0ZWRSb2xlLmFkZFRvUG9saWN5KG5ldyBpYW0uUG9saWN5U3RhdGVtZW50KHtcbiAgICAgICAgICAgIGVmZmVjdDogaWFtLkVmZmVjdC5BTExPVyxcbiAgICAgICAgICAgIGFjdGlvbnM6IFtcbiAgICAgICAgICAgICAgICBcIm1vYmlsZWFuYWx5dGljczpQdXRFdmVudHNcIixcbiAgICAgICAgICAgICAgICBcImNvZ25pdG8tc3luYzoqXCJcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgICByZXNvdXJjZXM6IFtcIipcIl1cbiAgICAgICAgfSkpO1xuXG4gICAgICAgIGNvbnN0IGF1dGhlbnRpY2F0ZWRSb2xlID0gbmV3IGlhbS5Sb2xlKHRoaXMsIFwiQ29nbml0b0RlZmF1bHRBdXRoZW50aWNhdGVkUm9sZVwiLCB7XG4gICAgICAgICAgICBhc3N1bWVkQnk6IG5ldyBpYW0uRmVkZXJhdGVkUHJpbmNpcGFsKCdjb2duaXRvLWlkZW50aXR5LmFtYXpvbmF3cy5jb20nLCB7XG4gICAgICAgICAgICAgICAgXCJTdHJpbmdFcXVhbHNcIjogeyBcImNvZ25pdG8taWRlbnRpdHkuYW1hem9uYXdzLmNvbTphdWRcIjogaWRlbnRpdHlQb29sLnJlZiB9LFxuICAgICAgICAgICAgICAgIFwiRm9yQW55VmFsdWU6U3RyaW5nTGlrZVwiOiB7IFwiY29nbml0by1pZGVudGl0eS5hbWF6b25hd3MuY29tOmFtclwiOiBcImF1dGhlbnRpY2F0ZWRcIiB9LFxuICAgICAgICAgICAgfSwgXCJzdHM6QXNzdW1lUm9sZVdpdGhXZWJJZGVudGl0eVwiKVxuICAgICAgICB9KTtcblxuICAgICAgICBhdXRoZW50aWNhdGVkUm9sZS5hZGRUb1BvbGljeShuZXcgaWFtLlBvbGljeVN0YXRlbWVudCh7XG4gICAgICAgICAgICBlZmZlY3Q6IGlhbS5FZmZlY3QuQUxMT1csXG4gICAgICAgICAgICBhY3Rpb25zOiBbXG4gICAgICAgICAgICAgICAgXCJtb2JpbGVhbmFseXRpY3M6UHV0RXZlbnRzXCIsXG4gICAgICAgICAgICAgICAgXCJjb2duaXRvLXN5bmM6KlwiLFxuICAgICAgICAgICAgICAgIFwiY29nbml0by1pZGVudGl0eToqXCJcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgICByZXNvdXJjZXM6IFtcIipcIl1cbiAgICAgICAgfSkpO1xuXG4gICAgICAgIGNvbnN0IGRlZmF1bHRQb2xpY3kgPSBuZXcgY29nbml0by5DZm5JZGVudGl0eVBvb2xSb2xlQXR0YWNobWVudCh0aGlzLCAnRGVmYXVsdFZhbGlkJywge1xuICAgICAgICAgICAgaWRlbnRpdHlQb29sSWQ6IGlkZW50aXR5UG9vbC5yZWYsXG4gICAgICAgICAgICByb2xlczoge1xuICAgICAgICAgICAgICAgICd1bmF1dGhlbnRpY2F0ZWQnOiB1bmF1dGhlbnRpY2F0ZWRSb2xlLnJvbGVBcm4sXG4gICAgICAgICAgICAgICAgJ2F1dGhlbnRpY2F0ZWQnOiBhdXRoZW50aWNhdGVkUm9sZS5yb2xlQXJuXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMuYXV0aGVudGljYXRlZFJvbGUgPSBhdXRoZW50aWNhdGVkUm9sZTtcblxuICAgICAgICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAgICAgICAgKiBTdGFjayBPdXRwdXRzICpcbiAgICAgICAgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbiAgICAgICAgdGhpcy5pZGVudGl0eVBvb2wgPSBpZGVudGl0eVBvb2w7XG4gICAgICAgIHRoaXMudXNlclBvb2wgPSB1c2VyUG9vbDtcbiAgICAgICAgdGhpcy51c2VyUG9vbENsaWVudCA9IHVzZXJQb29sQ2xpZW50O1xuICAgICAgICB0aGlzLnVzZXJQb29sRG9tYWluID0gdXNlclBvb2xEb21haW47XG4gICAgfVxufSJdfQ==