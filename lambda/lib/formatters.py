import re
import html2text

def format_moodle_rubric(rubric):
    items = {}
    
    criteria = rubric['areas'][0]['definitions'][0]['rubric_ranges']['rubric_criteria']

    for c in criteria:    
        # Extract name, percentage and description assuming the rubric description is in format "Name (xx%): Some description"
        name =  re.search(r"^(\w+(?:\s\(\w+\))?)", c['description']).group(1)
        percentage = re.search(r'\((\d+)%\)', c['description']).group(1)
        description = re.search(r":\s*(.+)", c['description']).group(1)
        
        levels = []
        for level in c['levels']:
            levels.append(level['definition'])
        
        levelsAsString = '\n- '.join(levels)
        msg = f"Criteria: <criteria_name>{name}</criteria_name>\n\nDescription: <description_criteria>{description}</description_criteria>\n\nGrading Scale:\n<grading_scale_criteria>-{levelsAsString}</grading_scale_criteria>"
        items[name] = msg
    
    # create 'banding scores'
    bands = []
    startScore = 0

    levels = criteria[0]['levels']
    for level in levels:
        # Extract level name assuming rubric level is in format "Name: description", e.g. "Distinction: bla bla"
        name =  re.search(r"^(\w+(?:\s\(\w+\))?)", level['definition']).group(1)
        endScore = level['score']
        band = f"- {name}: {startScore} to {endScore}"
        startScore = endScore + 1
        bands.append(band)

    bandsAsString = '\n'.join(bands)
    items['band_scores'] = bandsAsString
    
    return items


def extract_assignment_question(assignment):
    # read intro field from assignment
    html_content = assignment['intro']
    
    # convert html to text
    h = html2text.HTML2Text()
    h.ignore_links = True
    h.ignore_images = True
    text_content = h.handle(html_content)
    
    # Extract the task + instructions section
    task_section = re.search(r"### Task\n\n(.+?)\n\n", text_content, re.DOTALL)
    instructions_section = re.search(r"### Instructions\n\n(.+?)\n\n", text_content, re.DOTALL)
    
    if (task_section != None and instructions_section != None):
        task = task_section.group(1)
        instructions = instructions_section.group(1)
        question = f"Task:\n{task}\n\nInstructions:\n{instructions}"
        return question

    return text_content


def extract_submission_details(submission):
    plugins = submission["lastattempt"]["submission"]["plugins"]
    
    for plugin in plugins:
        if plugin["type"] == "onlinetext" :
            if len(plugin["editorfields"]) > 0:
                if plugin["editorfields"][0]["text"]:
                    submission_type = "text"
                    submission_answer = plugin["editorfields"][0]["text"]
                    return submission_type, submission_answer
                
        elif plugin["type"] == "file" :
            if len(plugin["fileareas"]) > 0:
                if len(plugin["fileareas"][0]["files"]) > 0:
                    submission_type = "file"
                    submission_file_info = plugin["fileareas"][0]["files"][0]
                    return submission_type, submission_file_info


def format_moodle_grade_submission_request(assignment_id, user_id, rubric, grade):
    rubric_criteria = rubric['areas'][0]['definitions'][0]['rubric_ranges']['rubric_criteria']
    criteria_map = {criterion['description']: criterion for criterion in rubric_criteria}
        
    result = []

    for item in grade['score']['criteria']:    
        criterion = None
        
        # find the first key in the criteria_map dictionary that starts with the given criteria_name
        for key, value in criteria_map.items():
            if key.startswith(item['name']):
                criterion = value

        if criterion:
            level = next((level for level in criterion['levels'] if level['score'] >= int(item['score'])), None)
            if level:
                result.append({
                    "id": criterion['id'],
                    "levelid": level['id'],
                    "remark": item['short_feedback']
                })

    criteria_data = {}
    for index, criterion in enumerate(result):
        criteria_data[f"advancedgradingdata[rubric][criteria][{index}][criterionid]"] = criterion["id"]
        criteria_data[f"advancedgradingdata[rubric][criteria][{index}][fillings][0][criterionid]"] = criterion["id"]
        criteria_data[f"advancedgradingdata[rubric][criteria][{index}][fillings][0][levelid]"] = criterion["levelid"]
        criteria_data[f"advancedgradingdata[rubric][criteria][{index}][fillings][0][remark]"] = criterion["remark"]
        criteria_data[f"advancedgradingdata[rubric][criteria][{index}][fillings][0][remarkformat]"] = 1  # Assuming plain text format

    params = {
        "assignmentid": assignment_id,
        "userid": user_id,
        "grade": -1,
        "attemptnumber": -1,
        "addattempt": 0,
        "workflowstate": "",
        "applytoall": 0,
        "plugindata[assignfeedbackcomments_editor][text]": grade['score']['general_feedback'],
        "plugindata[assignfeedbackcomments_editor][format]": 1,
    }
    params.update(criteria_data)
    return params
