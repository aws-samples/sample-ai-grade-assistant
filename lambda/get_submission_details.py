from lib.utils import httpResponse
from lib.moodle import MoodleProxy
from aws_xray_sdk.core import patch_all

# trace all external calls via AWS X-Ray
patch_all()

def lambda_handler(event, context):
    query_parameters = event.get('queryStringParameters', {})
    assignment_id = query_parameters.get('assignment_id')
    user_id = query_parameters.get('user_id')
    course_id = query_parameters.get('course_id')
    
    if not assignment_id:
        return httpResponse({ 'message': 'Missing assignment_id parameter'}, 400)
    if not user_id:
        return httpResponse({ 'message': 'Missing user_id parameter'}, 400)
    if not course_id:
        return httpResponse({ 'message': 'Missing course_id parameter'}, 400)
    
    moodle = MoodleProxy()
    full_details = moodle.get_full_submission_details(course_id, assignment_id, user_id)
    
    response = httpResponse(full_details)
    return response
