import * as cdk from "aws-cdk-lib"
import { Stack, StackProps } from "aws-cdk-lib";
import { Artifact, CfnPipeline } from "aws-cdk-lib/aws-codepipeline";
import { Repository as EcrRepository } from "aws-cdk-lib/aws-ecr";
import { Repository as CodeCommitRepository} from "aws-cdk-lib/aws-codecommit"
import { Pipeline } from "aws-cdk-lib/aws-codepipeline";
import { Construct } from "constructs";
import { CodeBuildAction, CodeCommitSourceAction, EcrSourceAction } from "aws-cdk-lib/aws-codepipeline-actions";
import { BuildSpec, PipelineProject } from "aws-cdk-lib/aws-codebuild";
import { CODE_COMMIT_REPOSITORY_NAME } from "./code-commit-stack";
import { ECR_REPOSITORY_NAME } from "./ecr-stack";

export type CodePipelineStackProps = {
} & StackProps;

export class CodePipelineStack extends Stack {
  constructor(scope: Construct, id: string, props: CodePipelineStackProps) {
    super(scope, id, props);

    const project = new PipelineProject(this, "PipelineProject", {
      buildSpec: BuildSpec.fromObjectToYaml({
        version: 0.2,
        phases: {
          build: {
            commands: ["cd sample-app", "npm install", "npm run build"],
          
          },
          post_build: {
            commands: [`docker push ${cdk.Stack.of(this).account}.dkr.ecr.${cdk.Stack.of(this).region}.amazonaws.com/${EcrRepository.fromRepositoryName(this,"EcrRepository",ECR_REPOSITORY_NAME)}:latest`],
          },
        },
      }),
    });

    const srcArtifact = new Artifact("src");
    const buildArtifact = new Artifact("build")

    const pipeline = new Pipeline(this, "Pipeline", {
      pipelineName: "MyPipeline",
      stages: [
        {
          stageName: "SourceStatge",
          actions: [
            new CodeCommitSourceAction({
              actionName: "Source",
              repository: CodeCommitRepository.fromRepositoryName(this, "CodeCommitRepository", CODE_COMMIT_REPOSITORY_NAME),
              output: srcArtifact,
            }),
          ],
        },
        {
          stageName: "BuildStage",
          actions: [
            new CodeBuildAction({
              actionName: "BuildAction",
              input: srcArtifact,
              project: project,
              outputs: [buildArtifact],
            }),
          ],
        },
      ],
    });
  }
}
