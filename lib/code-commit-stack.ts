import { Stack, StackProps, aws_codecommit } from "aws-cdk-lib";
import { Construct } from "constructs";

export type CodeCommitStackProps = {} & StackProps;

export const CODE_COMMIT_REPOSITORY_NAME = "MyGitRepository";

export class CodeCommitStack extends Stack {
  repository: aws_codecommit.Repository;
  constructor(scope: Construct, id: string, props: CodeCommitStackProps) {
    super(scope, id, props);

    this.repository = new aws_codecommit.Repository(this, "CodeCommitRepository", {
      repositoryName: CODE_COMMIT_REPOSITORY_NAME,
    });
  }
}
