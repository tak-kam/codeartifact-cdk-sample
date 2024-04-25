import * as cdk from "aws-cdk-lib"
import { Stack, StackProps } from "aws-cdk-lib";
import { Artifact } from "aws-cdk-lib/aws-codepipeline";
import { Repository as CodeCommitRepository} from "aws-cdk-lib/aws-codecommit"
import { Pipeline } from "aws-cdk-lib/aws-codepipeline";
import { Construct } from "constructs";
import { CodeBuildAction, CodeCommitSourceAction } from "aws-cdk-lib/aws-codepipeline-actions";
import { BuildSpec, PipelineProject } from "aws-cdk-lib/aws-codebuild";
import { CODE_COMMIT_REPOSITORY_NAME } from "./code-commit-stack";
import { ECR_REPOSITORY_NAME } from "./ecr-stack";
import {  Effect, PolicyStatement } from "aws-cdk-lib/aws-iam";

export type CodePipelineStackProps = {
} & StackProps;

export class CodePipelineStack extends Stack {
  constructor(scope: Construct, id: string, props: CodePipelineStackProps) {
    super(scope, id, props);

    const repositoryUri = `${cdk.Stack.of(this).account}.dkr.ecr.${cdk.Stack.of(this).region}.amazonaws.com/${ECR_REPOSITORY_NAME}`;

    // CodeBuild用VPCの作成
    const SUBNET_GROUP_NAME = "CodeBuildSubnetGroup";
    const vpc = new Vpc(this, "CodeBuildVpc", {
      maxAzs: 1,
      ipAddresses: IpAddresses.cidr("10.0.0.0/16"),
      subnetConfiguration: [
        {
          name: SUBNET_GROUP_NAME,
          subnetType: SubnetType.PRIVATE_ISOLATED,
          cidrMask: 24,
        },
      ],
    });
    vpc.addGatewayEndpoint("S3GatewayEndpoint", {
      service: GatewayVpcEndpointAwsService.S3,
      subnets: [vpc.selectSubnets({ subnetGroupName: SUBNET_GROUP_NAME })],
    });
    const vpceSg = new SecurityGroup(this, "VpceSg", {
      vpc,
    });
    vpc.addInterfaceEndpoint("CodeArtifactRepositoriesVpcEndpoint", {
      service: InterfaceVpcEndpointAwsService.CODEARTIFACT_REPOSITORIES,
      securityGroups: [vpceSg],
    });
    vpc.addInterfaceEndpoint("CodeArtifactApiVpcEndpoint", {
      service: InterfaceVpcEndpointAwsService.CODEARTIFACT_API,
      securityGroups: [vpceSg],
    });
    vpc.addInterfaceEndpoint("CloudWatchVpcEndpoint", {
      service: InterfaceVpcEndpointAwsService.CLOUDWATCH_LOGS,
      securityGroups: [vpceSg],
    });

    // ビルドプロジェクトの作成
    const project = new PipelineProject(this, "PipelineProject", {
      buildSpec: BuildSpec.fromObjectToYaml({
        version: 0.2,
        phases: {
          // CodeArtifactへのログイン
          install: {
            commands: ["pip3 install awscli --upgrade --user", `aws codeartifact login --tool npm --domain my-domain --repository my-repo`],
          },
          // ビルド
          build: {
            commands: ["cd sample-app", "npm install", "npm run build"],
          },
          // ビルドイメージのECRへのPush
          post_build: {
            commands: [
              `aws ecr get-login-password | docker login --username AWS --password-stdin ${repositoryUri}`,
              `docker tag sample-app:latest ${repositoryUri}:latest`,
              `docker push ${repositoryUri}:latest`,
            ],
          },
        },
      }),
    });

    // CodeArtifactへのログインに必要なポリシーの設定
    project.addToRolePolicy(
      new PolicyStatement({
        actions: ["codeartifact:GetAuthorizationToken", "codeartifact:GetRepositoryEndpoint", "codeartifact:ReadFromRepository"],
        effect: Effect.ALLOW,
        resources: ["*"],
      })
    );
    project.addToRolePolicy(
      new PolicyStatement({
        actions: ["sts:GetServiceBearerToken"],
        effect: Effect.ALLOW,
        resources: ["*"],
        conditions: {
          StringEquals: {
            "sts:AWSServiceName": "codeartifact.amazonaws.com",
          },
        },
      })
    );
    // ECRへのPushに必要なポリシーの設定
    project.addToRolePolicy(
      new PolicyStatement({
        actions: [
          "ecr:BatchCheckLayerAvailability",
          "ecr:CompleteLayerUpload",
          "ecr:GetAuthorizationToken",
          "ecr:InitiateLayerUpload",
          "ecr:PutImage",
          "ecr:UploadLayerPart",
        ],
        resources: [
          "*"
        ],
        effect: Effect.ALLOW
      })
    );

    // パイプラインの作成
    const srcArtifact = new Artifact("src");
    const buildArtifact = new Artifact("build")

    const pipeline = new Pipeline(this, "Pipeline", {
      pipelineName: "MyPipeline",
    });
    pipeline.addStage({
      stageName: "SourceStatge",
      actions: [
        new CodeCommitSourceAction({
          actionName: "Source",
          repository: CodeCommitRepository.fromRepositoryName(this, "CodeCommitRepository", CODE_COMMIT_REPOSITORY_NAME),
          output: srcArtifact,
        }),
      ],
    });
    pipeline.addStage({
      stageName: "BuildStage",
      actions: [
        new CodeBuildAction({
          actionName: "BuildAction",
          input: srcArtifact,
          project: project,
          outputs: [buildArtifact],
        }),
      ],
    });
  }
}
