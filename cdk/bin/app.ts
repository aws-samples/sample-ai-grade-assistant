#!/usr/bin/env node

import 'source-map-support/register';

import * as cdk from 'aws-cdk-lib';
import { AwsSolutionsChecks } from 'cdk-nag';
import * as dotenv from 'dotenv';

import * as packageJson from '../package.json';
import { AppStack } from '../stack';

export const stackName = packageJson.name;

// read environment variables from .env file
dotenv.config();

const app = new cdk.App();

if (process.env.CDK_NAG) {
  // Add the cdk-nag AwsSolutions Pack with extra verbose logging enabled.
  cdk.Aspects.of(app).add(new AwsSolutionsChecks({ verbose: true }));
}

new AppStack(app, stackName, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
