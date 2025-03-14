from lib.utils import httpResponse
from lib.dynamo_client import DynamoClient
from aws_xray_sdk.core import patch_all

# trace all external calls via AWS X-Ray
patch_all()

def lambda_handler(event, context):
    path_parameters = event.get('pathParameters', {})
    key = path_parameters.get('key')

    if not key:
        return httpResponse({ 'message': 'Missing key parameter'}, 400)

    db = DynamoClient()
    setting = db.get_setting(key)

    response = httpResponse(setting)
    return response
