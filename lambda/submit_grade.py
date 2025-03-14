import json
from lib.utils import httpResponse
from lib.moodle import MoodleProxy
from lib.formatters import format_moodle_grade_submission_request
from aws_xray_sdk.core import patch_all

# trace all external calls via AWS X-Ray
patch_all()

def lambda_handler(event, context):
    # parse request body as json
    try:
        body = json.loads(event.get('body', '{}'))
    except json.JSONDecodeError:
        return httpResponse({'message': 'Invalid JSON in request body'}, 400)

    course_id = body.get('course_id')
    assignment_id = body.get('assignment_id')
    user_id = body.get('user_id')
    grade = body.get('grade')

    if not course_id:
        return httpResponse({ 'message': 'Missing course_id in request body' })
    if not assignment_id:
        return httpResponse({ 'message': 'Missing assignment_id in request body' })
    if not user_id:
        return httpResponse({ 'message': 'Missing user_id in request body' })
    if not grade:
        return httpResponse({ 'message': 'Missing grade in request body' })

    moodle = MoodleProxy()
    assignment = moodle.get_assignment(course_id, assignment_id)
    rubric = moodle.get_rubric(assignment)

    params = format_moodle_grade_submission_request(assignment_id, user_id, rubric, grade)

    response = moodle.grade_submission(params)

    return httpResponse({})
