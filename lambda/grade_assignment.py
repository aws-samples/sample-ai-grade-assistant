import json
from lib.dynamo_client import DynamoClient
from lib.moodle import MoodleProxy
from lib.grader import Grader
from lib.formatters import extract_assignment_question, format_moodle_rubric, extract_submission_details
from aws_xray_sdk.core import patch_all
from lib.textract_helper import pdf_to_images

# trace all external calls via AWS X-Ray
patch_all()

def lambda_handler(event, context):
    # lambda event here contains SQS message records
     
    for record in event['Records']:
        # Extract the message body from the SQS record
        message_body = record['body']

        # Parse the JSON message body
        message = json.loads(message_body)

        course_id = message['course_id']
        assignment_id = message['assignment_id']
        user_id = message['user_id']
        
        try:
            grade_assignment(course_id, assignment_id, user_id)
        except Exception as e:
            print(f'Error: {e}')
            db = DynamoClient()
            db.update_grade(user_id, assignment_id, 'error', str(e), None)


def grade_assignment(course_id, assignment_id, user_id):
    moodle = MoodleProxy()
    grader = Grader(user_id, assignment_id)

    # fetch assignment details from moodle
    assignment = moodle.get_assignment(course_id, assignment_id)

    # extract + format question in plain text
    question = extract_assignment_question(assignment)

    # fetch rubric from moodle
    rubric = moodle.get_rubric(assignment)

    # format rubric appropriate to pass to LLM
    formatted_rubric = format_moodle_rubric(rubric)

    # get student submission from moodle
    submission = moodle.get_submission(assignment_id, user_id)

    # extract submission type and file info
    submission_type, submission_data = extract_submission_details(submission)

    # download attachment from moodle
    if submission_type == "file":
        grader.updateStatus("Processing PDF document##Downloading submission from Moodle")
        file_url = submission_data['fileurl']
        pdf_bytes = moodle.download_file(file_url)
        grader.updateStatus("Processing PDF document##Converting to images")
        pages_as_images = pdf_to_images(pdf_bytes=pdf_bytes)
    
    if (submission_type == 'file'):
        grade = grader.evaluate_answer(question, formatted_rubric, submission_type, pages_as_images)

    if (submission_type == 'text'):
        grade = grader.evaluate_answer(question, formatted_rubric, submission_type, submission_data)
