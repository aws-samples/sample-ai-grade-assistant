import { TypeScriptCode } from '@mrgrain/cdk-esbuild';
import { Duration } from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

import { LambdaFunctionProps } from './types';

export default class TypescriptLambdaFunction extends lambda.Function {
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
      vpc,
      vpcSubnets,
      securityGroups,
    }: LambdaFunctionProps,
  ) {
    const functionSettings = {
      bundling: {
        minify: true,
      },
      awsSdkConnectionReuse: true,
    };

    // extract file name from src path without extension
    const filenameWithoutExtension =
      src
        .split('/')
        .pop()
        ?.replace(/(?:\.[^.]+)?$/, '') || '';

    // Create Lambda function
    super(scope, id, {
      ...functionSettings,
      runtime: lambda.Runtime.NODEJS_18_X,
      memorySize: 256,
      environment,
      logRetention: logs.RetentionDays.THREE_MONTHS,
      tracing: lambda.Tracing.ACTIVE,
      timeout: Duration.seconds(30),
      architecture: lambda.Architecture.X86_64,
      handler: `${filenameWithoutExtension}.handler`,
      code: new TypeScriptCode(src),
      role,
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
