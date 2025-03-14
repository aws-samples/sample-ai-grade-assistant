from lib.utils import httpResponse
from lib.moodle import MoodleProxy
from aws_xray_sdk.core import patch_all

# trace all external calls via AWS X-Ray
patch_all()

def lambda_handler(event, context):
    query_parameters = event.get('queryStringParameters', {})
    course_id = query_parameters.get('course_id')

    if not course_id:
        return httpResponse({ 'message': 'Missing course_id parameter'}, 400)

    moodle = MoodleProxy()
    assignments = moodle.get_assignments(course_id)

    response = httpResponse(assignments)
    return response
