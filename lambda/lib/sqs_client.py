import os
import boto3
import json

class SqsClient:
    def __init__(self):
        self.sqs = boto3.client('sqs')
        self.queue_url = os.environ.get('GRADES_QUEUE_URL')

    def add_message_to_queue(self, message_body: dict):
        try:
            response = self.sqs.send_message(
                QueueUrl=self.queue_url,
                MessageBody=json.dumps(message_body)
            )
            print(f"Message sent to SQS queue. Message ID: {response['MessageId']}")
        except Exception as e:
            print(f"Error adding message to SQS queue: {e}")
