import { Duration } from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';

import ApiGateway from './ApiGateway';
import CognitoAuthorizer from './CognitoAuthorizer';

export interface LambdaFunctionProps {
  // path to source typescript file (e.g. './src/my_function.ts')
  src: string;

  // environment variables to pass to lambda function
  environment?: Record<string, string>;

  // rest api to attach the lambda function to (optional)
  api?: ApiGateway;
  apiRoute?: string;
  apiMethod?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'ANY';

  // iam role
  role?: iam.Role;

  // lambda authorizer
  authorizer?: CognitoAuthorizer;

  // other settings
  layers?: lambda.ILayerVersion[];
  timeout?: Duration;
  memory?: number;

  // optional - vpc settings
  vpc?: ec2.IVpc;
  vpcSubnets?: ec2.SubnetSelection;
  securityGroups?: ec2.ISecurityGroup[];
}
