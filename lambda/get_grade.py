from lib.utils import httpResponse
from lib.dynamo_client import DynamoClient
from aws_xray_sdk.core import patch_all

# trace all external calls via AWS X-Ray
patch_all()

def lambda_handler(event, context):
    query_parameters = event.get('queryStringParameters', {})
    user_id = query_parameters.get('user_id')
    assignment_id = query_parameters.get('assignment_id')

    if not user_id:
        return httpResponse({ 'message': 'Missing user_id parameter'}, 400)

    if not assignment_id:
        return httpResponse({ 'message': 'Missing assignment_id parameter'}, 400)

    db = DynamoClient()
    grade = db.get_grade(user_id, assignment_id)

    response = httpResponse(grade)
    return response
