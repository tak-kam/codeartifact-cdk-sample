#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { CodeCommitStack } from "../lib/code-commit-stack";
import { EcrStack } from "../lib/ecr-stack";

const app = new cdk.App();

new CodeCommitStack(app, "CodeCommitStack", {});

new EcrStack(app, "EcrStack", {});