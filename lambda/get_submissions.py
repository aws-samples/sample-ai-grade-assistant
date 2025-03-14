from lib.utils import httpResponse
from lib.moodle import MoodleProxy
from aws_xray_sdk.core import patch_all

# trace all external calls via AWS X-Ray
patch_all()

def lambda_handler(event, context):
    query_parameters = event.get('queryStringParameters', {})
    assignment_id = query_parameters.get('assignment_id')

    if not assignment_id:
        return httpResponse({ 'message': 'Missing assignment_id parameter'}, 400)

    moodle = MoodleProxy()
    submissions = moodle.get_submissions_for_assignment(assignment_id)
    
    response = httpResponse(submissions)
    return response
