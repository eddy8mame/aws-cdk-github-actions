import * as cdk from 'aws-cdk-lib/core'
import { Construct } from 'constructs'
import * as iam from 'aws-cdk-lib/aws-iam'

export class GithubOidcRoleStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props)

        const oidcProvider =
            iam.OpenIdConnectProvider.fromOpenIdConnectProviderArn(
                this,
                'GithubOidcProvider',
                `arn:aws:iam::${this.account}:oidc-provider/token.actions.githubusercontent.com`
            )

        const githubActionsRole = new iam.Role(
            this,
            'GithubActionsCdkDeployRole',
            {
                roleName: 'github-actions-cdk-deploy-role',
                assumedBy: new iam.WebIdentityPrincipal(
                    oidcProvider.openIdConnectProviderArn,
                    {
                        StringLike: {
                            'token.actions.githubusercontent.com:sub':
                                'repo:eddy8mame@132296192/aws-cdk-github-actions@1358388267:*',
                        },
                        StringEquals: {
                            'token.actions.githubusercontent.com:aud':
                                'sts.amazonaws.com',
                        },
                    }
                ),
                maxSessionDuration: cdk.Duration.hours(1),
            }
        )

        githubActionsRole.addToPolicy(
            new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: ['sts:AssumeRole'],
                resources: [
                    `arn:aws:iam::${this.account}:role/cdk-hnb659fds-deploy-role-${this.account}-${this.region}`,
                    `arn:aws:iam::${this.account}:role/cdk-hnb659fds-file-publishing-role-${this.account}-${this.region}`,
                    `arn:aws:iam::${this.account}:role/cdk-hnb659fds-lookup-role-${this.account}-${this.region}`,
                ],
            })
        )

        new cdk.CfnOutput(this, 'GithubActionsRoleArn', {
            value: githubActionsRole.roleArn,
        })
    }
}
