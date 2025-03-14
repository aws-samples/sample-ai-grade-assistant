import * as cdk from 'aws-cdk-lib';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { Construct } from 'constructs';

export default class Queue extends sqs.Queue {
  constructor(scope: Construct, id: string) {
    super(scope, id, {
      queueName: id,
      visibilityTimeout: cdk.Duration.minutes(12),
      enforceSSL: true,
      deadLetterQueue: {
        queue: new sqs.Queue(scope, `${id}-dead-letter-queue`, { enforceSSL: true }),
        maxReceiveCount: 1,
      },
    });
  }
}
