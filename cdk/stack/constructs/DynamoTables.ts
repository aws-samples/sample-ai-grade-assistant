import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

export default class DynamoTables extends Construct {
  public projectsTable: dynamodb.Table;
  public settingsTable: dynamodb.Table;
  public gradesTable: dynamodb.Table;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    // Settings table
    this.settingsTable = new dynamodb.Table(this, 'settings', {
      partitionKey: { name: 'key', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    });

    // Grades table
    this.gradesTable = new dynamodb.Table(this, 'grades', {
      partitionKey: { name: 'key', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    });
  }
}
