# Description 

This project is a sample AWS CodeArtifact repository created using AWS CDK. It demonstrates how to define a CodeArtifact repository and its associated resources using Infrastructure as Code (IaC) principles. 

## How to use

Run following commands to deploy infrastructure.
```
npm install
# Deploy repositories
npm run deploy:repo
# Deploy others
npm run deploy
```

Connect your npm client to CodeArtifact.
```
aws codeartifact login --tool npm --repository my-repo --domain my-domain
```

Publish sample internal package to CodeArtifact.
```
cd sample-package
npm publish
```

And run CodePipeline on your AWS console, then you can see in the log that CodeArtifact repository is used in NpmInstallStage.