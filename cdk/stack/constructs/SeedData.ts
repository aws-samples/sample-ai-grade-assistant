import { marshall } from '@aws-sdk/util-dynamodb';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import { AwsCustomResource, PhysicalResourceId } from 'aws-cdk-lib/custom-resources';
import { Construct } from 'constructs';

interface SeedDataProps {
  table: dynamodb.Table;
  data: Record<string, any>[];
}

export default class SeedData extends Construct {
  constructor(scope: Construct, id: string, { table, data }: SeedDataProps) {
    super(scope, id);

    new AwsCustomResource(this, 'seed-data', {
      onCreate: {
        service: 'DynamoDB',
        action: 'BatchWriteItem',
        parameters: {
          RequestItems: {
            [table.tableName]: data.map((item) => ({
              PutRequest: { Item: marshall(item) },
            })),
          },
        },
        physicalResourceId: PhysicalResourceId.of(`${table.tableName}-seed-data`),
      },
      policy: {
        statements: [
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: ['DynamoDB:BatchWriteItem'],
            resources: [table.tableArn],
          }),
        ],
      },
    });
  }
}
