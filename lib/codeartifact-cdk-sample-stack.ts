import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ca from "aws-cdk-lib/aws-codeartifact"

export class CodeArtifactCdkSampleStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const domain = new ca.CfnDomain(this, "CodeArtifactDomain", {
      domainName: "my-domain"
    })
    
    const pkgGroup = new ca.CfnPackageGroup(this, "PG-DWS", {
      domainName: domain.domainName,
      pattern: "/npm/@dws/*",
      originConfiguration: {
        restrictions: {
          publish: { restrictionMode: "ALLOW" },
          externalUpstream: { restrictionMode: "BLOCK" },
          internalUpstream: { restrictionMode: "BLOCK" },
        },
      },
    });
    pkgGroup.addDependency(domain)
    
    // ステージング用レポジトリ
    const stagingRepo = new ca.CfnRepository(this, "CodeArtifactStagingRepository", {
      domainName: domain.domainName,
      repositoryName: "npm-staging",
      externalConnections: ["public:npmjs"],
    });
    stagingRepo.addDependency(domain);

    // 内部プロジェクト用レポジトリ
    const repository = new ca.CfnRepository(this, "CodeArtifactRepository", {
      domainName: domain.domainName,
      repositoryName: "my-repo",
      upstreams: [stagingRepo.repositoryName],
    });
    repository.addDependency(domain);
    repository.addDependency(stagingRepo);
  }
}
