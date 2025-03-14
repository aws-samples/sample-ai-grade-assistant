import json
import os
import boto3
from datetime import datetime
from botocore.exceptions import ClientError
from boto3.dynamodb.types import TypeDeserializer

class DynamoClient:
    def __init__(self):
        self._dynamodb = boto3.resource('dynamodb')
        self.deserializer = TypeDeserializer()


    def _get_item(self, table_name, key_value):
        table = self._dynamodb.Table(table_name)
        
        try:
            response = table.get_item(Key={ 'key': key_value })
        except ClientError as e:
            print(f"Error getting item from DynamoDB: {e.response['Error']['Message']}")
            return None
        else:
            return response.get('Item')


    def _put_item(self, table_name, item_data):
        table = self._dynamodb.Table(table_name)
        
        try:
            response = table.put_item(Item=item_data)
        except ClientError as e:
            print(f"Error putting item in DynamoDB: {e.response['Error']['Message']}")
            return None
        else:
            return response


    def get_moodle_config(self):
        settings_table = os.environ.get('SETTINGS_TABLE')
        record = self._get_item(settings_table, "moodle")
        
        config = {}
        config['endpoint'] = record["moodleURL"]
        config['token'] = record["moodleToken"]
        return config

    def get_prompt_llm(self):
        settings_table = os.environ.get('SETTINGS_TABLE')
        record = self._get_item(settings_table, "prompt")
        
        model_id = record.get('modelId', '')
        return model_id

    def get_prompt_config(self):
        settings_table = os.environ.get('SETTINGS_TABLE')
        record = self._get_item(settings_table, "prompt")
        config = {}
        config['bedrockRegion'] = record.get('bedrockRegion', '')
        config['systemPrompt'] = record.get('systemPrompt', '')
        config['gradingPrompt'] = record.get('gradingPrompt', '')

        return config


    def update_grade(self, user_id, assignment_id, status, message, grade):
        grades_table = os.environ.get('GRADES_TABLE')
        key = f'user#{user_id}#assignment#{assignment_id}'
        
        item = {}
        item['key'] = key
        item['status'] = status
        item['message'] = message
        item['grade'] = grade
        item['lastUpdated'] = datetime.now().isoformat()
        
        self._put_item(grades_table, item)


    def get_grade(self, user_id, assignment_id):
        grades_table = os.environ.get('GRADES_TABLE')
        key = f'user#{user_id}#assignment#{assignment_id}'
        
        grade = self._get_item(grades_table, key)
        
        if not grade:
            return None
            
        return grade


    def get_setting(self, key):
        settings_table = os.environ.get('SETTINGS_TABLE')
        record = self._get_item(settings_table, key)
        return record


    def put_setting(self, key, settings):
        settings_table = os.environ.get('SETTINGS_TABLE')
        data = { **settings, 'key': key }
        record = self._put_item(settings_table, data)
        return record
