import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { Construct } from 'constructs';

export interface CognitoAuthorizerProps {
  userPoolId?: string;
  userPoolClientId?: string;
}

export default class CognitoAuthorizer extends Construct {
  public userPool: cognito.IUserPool;
  public userPoolClient: cognito.IUserPoolClient;
  public authorizer: apigateway.CognitoUserPoolsAuthorizer;

  constructor(
    scope: Construct,
    id: string,
    { userPoolId, userPoolClientId }: CognitoAuthorizerProps,
  ) {
    super(scope, id);

    if (userPoolId) {
      this.userPool = cognito.UserPool.fromUserPoolId(
        this,
        'existing-user-pool',
        userPoolId,
      );
    } else {
      // Create a Cognito user pool
      this.userPool = new cognito.UserPool(this, 'user-pool', {
        selfSignUpEnabled: true,
        signInAliases: { email: true },
        standardAttributes: { fullname: { required: true } },
        passwordPolicy: {
          minLength: 8,
          requireDigits: false,
          requireLowercase: false,
          requireSymbols: false,
          requireUppercase: false,
        },
        accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      });
    }

    if (userPoolClientId) {
      this.userPoolClient = cognito.UserPoolClient.fromUserPoolClientId(
        this,
        'existing-user-pool-client',
        userPoolClientId,
      );
    } else {
      // Create a Cognito user pool client
      this.userPoolClient = new cognito.UserPoolClient(this, 'user-pool-client', {
        userPool: this.userPool,
        generateSecret: false,
        authFlows: {
          userPassword: true,
          userSrp: true,
        },
      });
    }

    // Cognito API Gateway authorizer
    this.authorizer = new apigateway.CognitoUserPoolsAuthorizer(this, 'authorizer', {
      cognitoUserPools: [this.userPool],
    });
  }
}
