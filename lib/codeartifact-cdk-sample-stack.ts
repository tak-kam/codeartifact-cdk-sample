import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ca from "aws-cdk-lib/aws-codeartifact"

export class CodeArtifactCdkSampleStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const domain = new ca.CfnDomain(this, "CodeArtifactDomain", {
      domainName: "my-domain"
    })
    const repository = new ca.CfnRepository(this, "CodeArtifactRepository", {
      domainName: domain.domainName,
      repositoryName: "my-repo",
      externalConnections: ["public:npmjs"],
    });
    repository.addDependency(domain);
  }
}
