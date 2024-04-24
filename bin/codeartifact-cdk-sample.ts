#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { CodeArtifactCdkSampleStack } from "../lib/codeartifact-cdk-sample-stack";
import { EcrStack } from '../lib/ecr-stack';
import { CodePipeline } from 'aws-cdk-lib/aws-events-targets';
import { CodePipelineStack } from '../lib/code-pipeline-stack';

const app = new cdk.App();

const pipelineStack = new CodePipelineStack(app, "CodePipelineStack", {
});

new CodeArtifactCdkSampleStack(app, 'CodeArtifactCdkSampleStack', {

});