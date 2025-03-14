import { PythonFunction } from '@aws-cdk/aws-lambda-python-alpha';
import { Duration } from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

import { LambdaFunctionProps } from './types';

export default class PythonLambdaFunction extends PythonFunction {
  constructor(
    scope: Construct,
    id: string,
    {
      src,
      environment,
      api,
      apiRoute,
      apiMethod,
      role,
      authorizer,
      layers,
      timeout,
      memory,
      vpc,
      vpcSubnets,
      securityGroups,
    }: LambdaFunctionProps,
  ) {
    // extract file name from src path
    const filename = src.split('/').pop();

    // Create Lambda function
    super(scope, id, {
      runtime: lambda.Runtime.PYTHON_3_12,
      memorySize: memory ?? 256,
      environment,
      logRetention: logs.RetentionDays.THREE_MONTHS,
      tracing: lambda.Tracing.ACTIVE,
      timeout: timeout ?? Duration.seconds(30),
      architecture: lambda.Architecture.X86_64,
      entry: '../lambda',
      index: filename,
      handler: `lambda_handler`,
      role,
      ...(layers ? { layers } : {}), // Add layers if layers is provided
      bundling: {
        assetExcludes: ['.venv'],
      },
      vpc,
      vpcSubnets,
      securityGroups,
    });

    // Attach to API gateway if API paramaters are provided
    if (api && apiRoute && apiMethod) {
      // get or create api route
      const route = api.createApiRoute(apiRoute);

      const authorizerSettings = authorizer
        ? {
            authorizer: authorizer.authorizer,
            authorizationType: apigateway.AuthorizationType.COGNITO,
            authorizationScopes: ['aws.cognito.signin.user.admin'],
          }
        : undefined;

      // add lambda integration to api route
      route.addMethod(
        apiMethod,
        new apigateway.LambdaIntegration(this),
        authorizerSettings,
      );
    }
  }
}
