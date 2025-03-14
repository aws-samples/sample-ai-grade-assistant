import os
import io
import requests
from .dynamo_client import DynamoClient

class MoodleProxy:
    def __init__(self):
        # get moodle config from database
        db = DynamoClient()
        config = db.get_moodle_config()
        
        self._endpoint = config['endpoint']
        self._token = config['token']


    def _moodle_api_call(self, function, params=None):
        url = f"{self._endpoint}/webservice/rest/server.php"
        params = params or {}
        params.update({
            'wstoken': self._token,
            'moodlewsrestformat': 'json',
            'wsfunction': function
        })
        response = requests.get(url, params=params, timeout=60)
        return response.json()


    def get_courses(self):
        return self._moodle_api_call('core_course_get_courses')


    def get_assignments(self, course_id):
        return self._moodle_api_call('mod_assign_get_assignments', {'courseids[0]': course_id})


    def get_assignment(self, course_id, assignment_id):
        assignments_list = self.get_assignments(course_id)
        
        for assignment in assignments_list['courses'][0]['assignments']:
            if str(assignment['id']) == str(assignment_id):
                return assignment
        return None


    def get_rubric(self, assignment):
        assignment_cmd_id = assignment['cmid']
        params = {
            "cmids[0]": assignment_cmd_id,
            "areaname": "submissions",
            "activeonly": 1
        }
        return self._moodle_api_call('core_grading_get_definitions', params=params )


    def download_file(self, file_url):
        # append token to url
        download_url = file_url + '?token=' + self._token
        
        # download file and return stream of bytes
        response = requests.get(download_url, stream=True, timeout=60)
        stream = io.BytesIO(response.content)
        file_content = stream.read()
        return file_content


    def get_user_by_userid(self, userid):
        params = {
            'field': 'id',
            'values[0]': userid
        }
        users = self._moodle_api_call('core_user_get_users_by_field', params=params)
        return users[0]


    def get_submissions_for_assignment(self, assignment_id):
        params = {
            'assignmentids[0]': assignment_id
        }
        response = self._moodle_api_call('mod_assign_get_submissions', params=params)
        if "assignments" in response and len(response["assignments"]) == 1:
            assignment = response["assignments"][0]
            if "submissions" in assignment:
                
                # loop through submissions
                for index, submission in enumerate(assignment["submissions"]):
                    user_id = submission["userid"]
                    
                    # Add users details (TODO: Optimise by calling the API once with all IDs)
                    submission["user_details"] = self.get_user_by_userid(user_id)
                    assignment["submissions"][index] = submission
                    
                return assignment["submissions"]
            
        return response


    def get_submission(self, assignment_id, user_id):
        params = {
            'assignid': assignment_id,
            'userid': user_id
        }
        return self._moodle_api_call('mod_assign_get_submission_status', params=params)


    def get_full_submission_details(self, course_id, assignment_id, user_id):
        submission_details = self.get_submission(assignment_id, user_id)
        student_data = self.get_user_by_userid(user_id)
        
        course_details = self.get_assignments(course_id)

        course_data = {
            "id": course_details["courses"][0]["id"],
            "name": course_details["courses"][0]["fullname"]
        }
        
        assignment_data = {}
        for assignment in course_details["courses"][0]["assignments"]:
            if str(assignment["id"]) == str(assignment_id):
                assignment_data['id'] = assignment["id"]
                assignment_data['name'] = assignment["name"]

        full_details = {}
        full_details["submission"] = submission_details
        full_details["course"] = course_data
        full_details["assignment"] = assignment_data
        full_details["student"] = student_data
        
        return full_details

    def grade_submission(self, params):
        return self._moodle_api_call("mod_assign_save_grade", params=params)
