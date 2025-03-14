from lib.utils import httpResponse
from lib.cognito_client import CognitoClient
from aws_xray_sdk.core import patch_all

# trace all external calls via AWS X-Ray
patch_all()

def lambda_handler(event, context):
    cognito = CognitoClient()
    users = cognito.get_all_users()
    response = httpResponse(users)
    return response
