import { Duration, Stack } from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as event_sources from 'aws-cdk-lib/aws-lambda-event-sources';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { Construct } from 'constructs';

import ApiGateway from './ApiGateway';
import CognitoAuthorizer from './CognitoAuthorizer';
import DynamoTables from './DynamoTables';
import { LambdaLayer } from './LambdaLayer';
import PythonLambdaFunction from './PythonLambdaFunction';
import { LambdaFunctionProps } from './types';

interface LambdaFunctionsProps {
  api: ApiGateway;
  authorizer: CognitoAuthorizer;
  databases: DynamoTables;
  queue: sqs.Queue;
  useDefaultVpc?: boolean;
  vpcId?: string;
}

export default class LambdaFunctions extends Construct {
  constructor(
    scope: Construct,
    id: string,
    { api, authorizer, databases, queue, useDefaultVpc, vpcId }: LambdaFunctionsProps,
  ) {
    super(scope, id);

    const settings: Omit<LambdaFunctionProps, 'src'> = {};

    // Create environment variables for lambda functions
    settings.environment = {
      AWS_ACCOUNT_ID: Stack.of(this).account,
      POWERTOOLS_SERVICE_NAME: Stack.of(this).stackName,
      POWERTOOLS_METRICS_NAMESPACE: Stack.of(this).stackName,
      POWERTOOLS_LOGGER_LOG_LEVEL: 'WARN',
      POWERTOOLS_LOGGER_SAMPLE_RATE: '0.01',
      POWERTOOLS_LOGGER_LOG_EVENT: 'true',
      REGION: Stack.of(this).region,
      COGNITO_USER_POOL_ID: authorizer.userPool.userPoolId,
      GRADES_TABLE: databases.gradesTable.tableName,
      SETTINGS_TABLE: databases.settingsTable.tableName,
      GRADES_QUEUE_URL: queue.queueUrl,
      PRINT_FULL_PROMPT: 'FALSE',
    };

    // Generate vpc settings (optional). If none provided, Lambda will run without VPC
    if (useDefaultVpc) {
      settings.vpc = ec2.Vpc.fromLookup(this, 'existing-vpc', { isDefault: true });
    }

    if (vpcId) {
      settings.vpc = ec2.Vpc.fromLookup(this, 'existing-vpc', {
        vpcId,
      });
    }

    if (settings.vpc) {
      settings.vpcSubnets = { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS };

      // create one default security group that applies to all lambda functions.
      settings.securityGroups = [
        new ec2.SecurityGroup(this, 'lambda-security-group', {
          vpc: settings.vpc,
          allowAllOutbound: true,
        }),
      ];
    }

    settings.api = api;
    settings.authorizer = authorizer;

    /**
     * Lambda function for API endpoint: GET /settings/{key}
     */
    const getSettingsFn = new PythonLambdaFunction(this, 'get-settings-fn', {
      ...settings,
      src: 'get_setting.py',
      apiRoute: '/settings/{key}',
      apiMethod: 'GET',
    });

    databases.settingsTable.grantReadData(getSettingsFn);

    /**
     * Lambda function for API endpoint: PUT /settings
     */
    const updateSetttingsFn = new PythonLambdaFunction(this, 'update-settings-fn', {
      ...settings,
      src: 'update_setting.py',
      apiRoute: '/settings/{key}',
      apiMethod: 'PUT',
    });

    databases.settingsTable.grantWriteData(updateSetttingsFn);

    /**
     * Lambda function for API endpoint: GET /users
     */
    const getUsersFn = new PythonLambdaFunction(this, 'get-users-fn', {
      ...settings,
      src: 'get_users.py',
      apiRoute: '/users',
      apiMethod: 'GET',
    });

    getUsersFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['cognito-idp:ListUsers'],
        resources: [authorizer.userPool.userPoolArn],
      }),
    );

    /**
     * Lambda function for API endpoint: GET /courses
     */
    const getCoursesFn = new PythonLambdaFunction(this, 'get-courses-fn', {
      ...settings,
      src: 'get_courses.py',
      apiRoute: '/courses',
      apiMethod: 'GET',
    });

    databases.settingsTable.grantReadData(getCoursesFn);

    /**
     * Lambda function for API endpoint: GET /assignments
     */
    const getAssignmentsFn = new PythonLambdaFunction(this, 'get-assignments-fn', {
      ...settings,
      src: 'get_assignments.py',
      apiRoute: '/assignments',
      apiMethod: 'GET',
    });

    databases.settingsTable.grantReadData(getAssignmentsFn);

    /**
     * Lambda function for API endpoint: GET /submissions
     */
    const getSubmissionsFn = new PythonLambdaFunction(this, 'get-submissions-fn', {
      ...settings,
      src: 'get_submissions.py',
      apiRoute: '/submissions',
      apiMethod: 'GET',
    });

    databases.settingsTable.grantReadData(getSubmissionsFn);

    const getSubmissionDetailsFn = new PythonLambdaFunction(
      this,
      'get-submission-details-fn',
      {
        ...settings,
        src: 'get_submission_details.py',
        apiRoute: '/submission',
        apiMethod: 'GET',
      },
    );

    databases.settingsTable.grantReadData(getSubmissionDetailsFn);

    const getGradeFn = new PythonLambdaFunction(this, 'get-grade-fn', {
      ...settings,
      src: 'get_grade.py',
      apiRoute: '/grade',
      apiMethod: 'GET',
    });

    databases.gradesTable.grantReadData(getGradeFn);

    const submitGradeFn = new PythonLambdaFunction(this, 'submit-grade-fn', {
      ...settings,
      src: 'submit_grade.py',
      apiRoute: '/submit_grade',
      apiMethod: 'POST',
    });

    databases.settingsTable.grantReadData(submitGradeFn);

    /**
     * Lambda function for API endpoint: GET /grade_assignment
     */
    const addAssignmentToQueueFn = new PythonLambdaFunction(this, 'add-to-queue-fn', {
      ...settings,
      src: 'add_assignment_to_queue.py',
      apiRoute: '/grade_assignment',
      apiMethod: 'GET',
    });

    queue.grantSendMessages(addAssignmentToQueueFn);
    databases.settingsTable.grantReadData(addAssignmentToQueueFn);
    databases.gradesTable.grantWriteData(addAssignmentToQueueFn);

    /**
     * Lambda function for API endpoint: GET /grade_assignment
     */
    const popplerLayer = new LambdaLayer(this, 'poppler-lambda-layer', {
      layerName: 'poppler',
      dockerfileFolder: './stack/layers/',
      sourceFolder: '/root/package', // copy to /opt
    });

    const gradeAssignmentFn = new PythonLambdaFunction(this, 'grade-assignment-fn', {
      ...settings,
      src: 'grade_assignment.py',
      layers: [popplerLayer],
      timeout: Duration.minutes(12),
      memory: 4092,
    });

    // Grant Textract permissions
    gradeAssignmentFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['textract:StartDocumentAnalysis', 'textract:GetDocumentAnalysis'],
        resources: ['*'],
      }),
    );

    queue.grantConsumeMessages(gradeAssignmentFn);
    databases.settingsTable.grantReadData(gradeAssignmentFn);
    databases.gradesTable.grantWriteData(gradeAssignmentFn);

    // Add permissions to invoke Bedrock models
    gradeAssignmentFn.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['bedrock:*'], //InvokeModel', 'bedrock:ListFoundationModels'],
        resources: ['*'], // This allows access to all Bedrock models
      }),
    );

    gradeAssignmentFn.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['textract:AnalyzeDocument'],
        resources: ['*'],
      }),
    );

    // trigger lambda when new messages are on the queue
    gradeAssignmentFn.addEventSource(new event_sources.SqsEventSource(queue));

    const listBedrockModelsFn = new PythonLambdaFunction(this, 'list-bedrock-models-fn', {
      ...settings,
      src: 'list_bedrock_models.py',
      apiRoute: '/list_bedrock_models',
      apiMethod: 'GET',
    });

    listBedrockModelsFn.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['bedrock:ListFoundationModels'],
        resources: ['*'],
      }),
    );
  }
}
