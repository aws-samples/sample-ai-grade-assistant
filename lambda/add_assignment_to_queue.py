from lib.utils import httpResponse
from lib.sqs_client import SqsClient
from lib.dynamo_client import DynamoClient
from aws_xray_sdk.core import patch_all

# trace all external calls via AWS X-Ray
patch_all()

def lambda_handler(event, context):
    query_parameters = event.get('queryStringParameters', {})

    course_id = query_parameters.get('course_id')
    assignment_id = query_parameters.get('assignment_id')
    user_id = query_parameters.get('user_id')
    
    if not course_id:
        return httpResponse({ 'message': 'Missing course_id parameter '}, 400)

    if not assignment_id:
        return httpResponse({ 'message': 'Missing assignment_id parameter '}, 400)

    if not user_id:
        return httpResponse({ 'message': 'Missing user_id parameter '}, 400)
    
    sqs = SqsClient()
    db = DynamoClient()
    
    # insert record in dynamo
    db.update_grade(user_id, assignment_id, 'pending', 'Initialising', None)
    
    # add message to sqs queue
    message = {
        'course_id': course_id,
        'assignment_id': assignment_id,
        'user_id': user_id
    }
    
    sqs.add_message_to_queue(message)
    
    return httpResponse({}, 200)
