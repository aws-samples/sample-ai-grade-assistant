import json
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

    # parse request body as json
    try:
        settings = json.loads(event.get('body', '{}'))
    except json.JSONDecodeError:
        return httpResponse({'message': 'Invalid JSON in request body'}, 400)

    db = DynamoClient()
    db.put_setting(key, settings)

    response = httpResponse(settings)
    return response
