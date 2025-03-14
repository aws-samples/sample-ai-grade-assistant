import * as cdk from 'aws-cdk-lib';
import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';

import { defaultSettings } from './constants';
import ApiGateway from './constructs/ApiGateway';
import CognitoAuthorizer from './constructs/CognitoAuthorizer';
import DynamoTables from './constructs/DynamoTables';
import LambdaFunctions from './constructs/LambdaFunctions';
import Queue from './constructs/Queue';
import ReactWebApp from './constructs/ReactWebApp';
import SeedData from './constructs/SeedData';

export class AppStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    /**
     * Step 1: Set up base infrastructure
     */

    // Create Dynamo tables
    const databases = new DynamoTables(this, 'databases');

    // Create Cognito authorizer
    const authorizer = new CognitoAuthorizer(this, 'authorizer', {
      // optional - use an existing user pool. If none provided a new user pool will be created
      userPoolId: process.env.COGNITO_USER_POOL_ID,
      userPoolClientId: process.env.COGNITO_USER_POOL_CLIENT_ID,
    });

    // Create API
    const api = new ApiGateway(this, 'api');

    // Create SQS queue
    const queue = new Queue(this, 'grade-queue');

    // Create Lambda functions
    new LambdaFunctions(this, 'lambda', {
      api,
      authorizer,
      databases,
      queue,

      // below environment variables are optional to enable Lambda in VPC
      useDefaultVpc: !!process.env.LAMBDA_USE_DEFAULT_VPC,
      vpcId: process.env.LAMBDA_VPC_ID,
    });

    // Initial settings
    new SeedData(this, 'seed-data', {
      table: databases.settingsTable,
      data: defaultSettings,
    });

    /**
     * Step 2 - Deploy react app static website
     */

    // Create environment variables
    const config: { [key: string]: string } = {
      CognitoUserPoolId: authorizer.userPool.userPoolId,
      CognitoUserPoolClientId: authorizer.userPoolClient.userPoolClientId,
      ApiUrl: api.api.url,
    };

    if (process.env.COGNITO_HOSTED_UI_DOMAIN) {
      config.CognitoHostedUiDomain = process.env.COGNITO_HOSTED_UI_DOMAIN;
    }

    if (process.env.COGNITO_IDENTITY_PROVIDER) {
      config.CognitoIdentityProvider = process.env.COGNITO_IDENTITY_PROVIDER;
    }

    // Create static website for UI using S3 and Cloudfront
    const website = new ReactWebApp(this, 'website', {
      config,
      sourcePath: '../ui',

      // below environment variables are optional to enable a custom domain
      domainName: process.env.WEBSITE_DOMAIN_NAME,
      hostedZoneDomainName: process.env.WEBSITE_HOSTED_ZONE_DOMAIN_NAME,
      certificateArn: process.env.WEBSITE_CERTIFICATE_ARN,
    });

    /**
     * Outputs
     */
    new cdk.CfnOutput(this, 'ApiUri', {
      value: api.api.url,
      description: 'API URL',
    });

    new cdk.CfnOutput(this, 'WebsiteUrl', {
      value: website.baseUrl,
      description: 'Website URL',
    });
  }
}
