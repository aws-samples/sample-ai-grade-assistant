from lib.utils import httpResponse
from lib.moodle import MoodleProxy
from aws_xray_sdk.core import patch_all

# trace all external calls via AWS X-Ray
patch_all()

def lambda_handler(event, context):
    moodle = MoodleProxy()
    courses = moodle.get_courses()
    response = httpResponse(courses)
    return response
