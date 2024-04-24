import { RemovalPolicy, Stack, StackProps } from "aws-cdk-lib";
import { Repository } from "aws-cdk-lib/aws-ecr";
import { Construct } from "constructs";

export type EcrStackProps = {} & StackProps;

export const ECR_REPOSITORY_NAME = "my-ecr-repository"

export class EcrStack extends Stack {
  repository: Repository;
  constructor(scope: Construct, id: string, props: EcrStackProps) {
    super(scope, id, props);

    this.repository = new Repository(this, "ECR", {
      repositoryName: ECR_REPOSITORY_NAME,
      removalPolicy: RemovalPolicy.DESTROY,
    });
  }
}
