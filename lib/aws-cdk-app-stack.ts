import * as cdk from 'aws-cdk-lib/core'
import { Construct } from 'constructs'
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import * as ecs from 'aws-cdk-lib/aws-ecs'
import * as ecr from 'aws-cdk-lib/aws-ecr'
import * as ecs_patterns from 'aws-cdk-lib/aws-ecs-patterns'
import * as ssm from 'aws-cdk-lib/aws-ssm'

export class AwsCdkAppStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props)

        const API_ECR_REPO = 'team-a/fastapi-github-actions-aws'
        const SSM_PARAM = '/fastapi-github-actions-aws/image-tag'
        const VPC_NAME = 'aws-cdk-fastapi-vpc'
        const CLUSTER_NAME = 'aws-cdk-fastapi-cluster'

        const vpc = new ec2.Vpc(this, VPC_NAME!, {
            maxAzs: 2, // Default is all AZs in region
        })

        const cluster = new ecs.Cluster(this, CLUSTER_NAME!, {
            vpc: vpc,
        })

        const repo = ecr.Repository.fromRepositoryName(
            this,
            'FastApiRepo',
            API_ECR_REPO!
        )

        const imageTag = ssm.StringParameter.valueFromLookup(this, SSM_PARAM!)

        const image = ecs.ContainerImage.fromEcrRepository(repo, imageTag)

        new ecs_patterns.ApplicationLoadBalancedFargateService(
            this,
            'MyFargateService',
            {
                cluster: cluster, // Required
                cpu: 256, // Default is 256
                desiredCount: 1, // Default is 1
                taskImageOptions: {
                    image, // image should be from our FastAPI app ECR repo; stored in ssm parameter store
                    containerPort: 8000,
                },
                memoryLimitMiB: 2048, // Default is 512
                publicLoadBalancer: true, // Default is true
            }
        )
    }
}
