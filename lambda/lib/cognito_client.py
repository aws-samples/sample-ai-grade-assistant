import os
import json
import boto3
from datetime import datetime
from botocore.exceptions import ClientError

class CognitoClient:
    def __init__(self):
        self._cognito = boto3.client('cognito-idp')
        self._user_pool_id = os.environ.get('COGNITO_USER_POOL_ID')


    def get_user_by_user_id(self, user_id: str):
        try:
            response = self._cognito.admin_get_user(
                UserPoolId=self._user_pool_id,
                Username=user_id
            )
            return self._format_user(response)
        except ClientError as e:
            if e.response['Error']['Code'] == 'UserNotFoundException':
                return None
            else:
                raise e


    def get_all_users(self):
        users = []
        try:
            response = self._cognito.list_users(
                UserPoolId=self._user_pool_id
            )
            for user_data in response['Users']:
                users.append(self._format_user(user_data))
            return users
        except ClientError as e:
            raise e


    def _format_user(self, user_data):
        if 'Attributes' in user_data:
            user_attributes = user_data['Attributes']
        if 'UserAttributes' in user_data:
            user_attributes = user_data['UserAttributes']

        attributes = {attr['Name']: attr['Value'] for attr in user_attributes}

        user = {
            'id': attributes['sub'],
            'email': attributes['email'],
            'name': attributes['name'],
            'email_verified': attributes['email_verified'] == 'true',
            'date_created': user_data['UserCreateDate'].isoformat(),
            'date_last_modified': user_data['UserLastModifiedDate'].isoformat()
        }

        return user
