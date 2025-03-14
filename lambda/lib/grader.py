import base64
import os
from .prompt_templating import fill_in_template
from .bedrock_client import BedRock
from .dynamo_client import DynamoClient
from .textract_helper import extract_visuals_from_pdf
import json
import concurrent.futures
import boto3
from botocore.config import Config
import time

class BytesEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, bytes):
            return base64.b64encode(o).decode("ascii")
        else:
            return super().default(o)
        
class Grader:
    def __init__(self, user_id, assignment_id):
        self.db = DynamoClient()
        self.user_id = user_id
        self.assignment_id = assignment_id


    def updateStatus(self, message):
        print(message)
        
        # update status in database
        self.db.update_grade(self.user_id, self.assignment_id, 'pending', message, None)


    def call_textract_multipages(self, pages_as_images):
        self.updateStatus("Analysing document##Extracting text and images...")
        return extract_visuals_from_pdf(grader=self, pages_as_images=pages_as_images)


    def convert_assignment_to_multimodal_prompt(self, processed_sections, xml_tag):
        # insert opening xml tag to demarcate doc
        messages_content = []
        messages_content.append({'text': f"<{xml_tag}>"})

        # format and append doc contents in sequence
        for section in processed_sections:
            
            if section["type"] == 'text':
                messages_content.append({'text': section["content"]})
            
            elif section["type"] == 'image':
                messages_content.append({'image': {'format': "png", 
                                        'source': {'bytes': section["content"]}}})
                
        # insert closing xml tag to demarcate doc
        messages_content.append({'text': f"</{xml_tag}>"})
        return messages_content


    def format_multimodal_prompt(self, processed_pages, xml_tag, prompt):
        messages_content = self.convert_assignment_to_multimodal_prompt(processed_pages, xml_tag)
        # insert prompt
        messages_content.append({'text': prompt})

        return messages_content


    # def ask_claude_w_metrics(self, formatted_prompt, prefill=""):
    def invoke_llm_w_metrics(self, formatted_prompt, prefill="", retries=0):
        
        try:
            # model hyperparameters
            maxTokens = 2000
            temperature = 0.85 #Changing to 0.85 (was 0.5)
            top_p = 0.2    


            # setup bedrock client
            bedrock_region = os.getenv("REGION")

            if self.db.get_prompt_config()["bedrockRegion"] is not None:
                bedrock_region = self.db.get_prompt_config()["bedrockRegion"]

            bedrock = boto3.client('bedrock-runtime',
                                    config=Config(region_name=bedrock_region))          


            # check if selected model is compatible with system prompt
            model_id = self.db.get_prompt_llm()

            compatible_models = ['ai21.jamba-instruct',
                                'anthropic.claude',
                                'cohere.command-r',
                                'meta.llama',
                                'mistral.mistral-large',
                                'mistral.mistral-small',
                                ]

            is_compatible = False

            for model in compatible_models:
                if model in model_id:
                    is_compatible = True
            

            # format payload based on system prompt compatibility and invoke model
            sys_prompt = self.db.get_prompt_config()["systemPrompt"]

            messages = [{'role': 'user', 'content': formatted_prompt}]

            if prefill != "":
                messages += [{'role': 'assistant', 'content': [{'text': prefill}]}]

            if sys_prompt != "" and is_compatible:
                response = bedrock.converse(
                    modelId=model_id,
                    messages=messages,
                    system=[{'text': sys_prompt}],
                    inferenceConfig={
                        'maxTokens': maxTokens,
                        'temperature': temperature,
                        'topP': top_p,
                    },
                )

            else:
                if sys_prompt != "":
                    messages[0]['content'].insert(0, {'text':sys_prompt})
                
                response = bedrock.converse(
                    modelId=model_id,
                    messages=messages,
                    inferenceConfig={
                        'maxTokens': maxTokens,
                        'temperature': temperature,
                        'topP': top_p,
                    },
                )

            return response
        
        except Exception as e:
            if retries >= 10: 
                return e
            
            time.sleep(10)
            return self.invoke_llm_w_metrics(formatted_prompt, prefill, retries+1)


    # def ask_claude(self, formatted_prompt, prefill=""):
    def invoke_llm(self, formatted_prompt, prefill=""):
        response = self.invoke_llm_w_metrics(formatted_prompt, 
                                             prefill=prefill)
        return response['output']['message']['content'][0]['text']

            
    def prompt_engineering(self, qn, criteria_desc, band_scores, ans):

        data_template = {
            'qn': qn, 
            'criteria_desc':criteria_desc,
            'band_scores':band_scores
        }

        templated_prompt =  fill_in_template(self.db.get_prompt_config()["gradingPrompt"], data_template)

        formatted_prompt = self.format_multimodal_prompt(ans, "ans", templated_prompt)
        
        if os.environ.get('PRINT_FULL_PROMPT') == "TRUE":
            print(json.dumps(formatted_prompt, indent=3, default=lambda o: '<not serializable>'))
        elif os.environ.get('PRINT_FULL_PROMPT') == "TRUE_WITH_PICTURES":
            print(json.dumps(formatted_prompt, indent=3, cls=BytesEncoder))
        return formatted_prompt


    def parse_tags(self, res, tag):
        junk, sep, content = res.partition(f"<{tag}>")
        content, sep, junk = content.rpartition(f"</{tag}>")
        return content


    def parse_response(self, res, tags):        
        grade_res = {}

        for t in tags:
            content = self.parse_tags(res, t)
            grade_res[t] = content

        return grade_res


    def grade_assignment(self, qn, criteria, criteria_desc, band_scores, ans):

        # evaluate submission
        prompt = self.prompt_engineering(qn=qn, 
                                    criteria_desc=criteria_desc, 
                                    band_scores=band_scores, 
                                    ans=ans)
        # res = self.invoke_llm(prompt)

        raw_res = self.invoke_llm_w_metrics(prompt)
        res = raw_res['output']['message']['content'][0]['text']
        
        parsed_res = self.parse_response(res=res, tags=['long_feedback', 'short_feedback', 'band', 'score'])

        # count tokens
        input_tokens = raw_res['usage']['inputTokens']
        output_tokens = raw_res['usage']['outputTokens']
        parsed_res['input_tokens'] = input_tokens
        parsed_res['output_tokens'] = output_tokens
        
        return parsed_res, criteria


    def get_overall_feedback(self, assignment_grade):
        self.updateStatus("Generating overall feedback##Almost done!")
        
        feedback = '\n'.join([v['long_feedback'] for k, v in assignment_grade.items()])

        prompt = f"""
        <feedback>
        {feedback}
        </feedback>

        Write general feedback based on your detailed feedback in <feedback></feedback>. Output your general feedback within <summary></summary> tags.
        """

        res = self.invoke_llm([{'text':prompt}])

        parsed_res = self.parse_tags(res, 'summary')

        return parsed_res


    def calculate_cost(self, input_tokens, output_tokens):

        model_id = self.db.get_prompt_llm()

        # TODO: calculate cost based on model --> currently uses Claude 3 Sonnet pricing regardless of actual model
        input_cost = 0.003 * input_tokens / 1000
        output_cost = 0.015 * output_tokens / 1000
        total_cost = input_cost + output_cost

        return round(total_cost, 2)


    def format_json_response(self, assignment_grade):

        # get overall feedback
        overall_feedback = self.get_overall_feedback(assignment_grade)

        # format JSON response
        criteria = []
        input_tokens = 0
        output_tokens = 0

        for key, val in assignment_grade.items():
            criteria.append({
                'name': key,
                'score': val['score'],
                'long_feedback': val['long_feedback'],
                'short_feedback': val['short_feedback'],
                'band': val['band'],
            })

            input_tokens += val['input_tokens']
            output_tokens += val['output_tokens']

        bedrock_cost = self.calculate_cost(input_tokens, output_tokens)

        response = {
            "score": {
                "criteria": criteria,
                "general_feedback": overall_feedback
            },
            "metrics": {
                'input_tokens': str(input_tokens),
                'output_tokens': str(output_tokens),
                'bedrock_cost': f"${bedrock_cost}"
            }
        }

        return response


    total_tasks = 0
    finished_tasks_count = 0
    def update_status_task(self, task):
        try:
            self.finished_tasks_count +=1
            self.updateStatus(f"Grading rubrics##{self.finished_tasks_count}/{self.total_tasks} completed")
        except Exception as e:
            self.logger.error(f"Error grading rubric criteria: {e}")


    def evaluate_answer(self, qn, rubric, submission_type, submission_data):
        # pre-process the answer
        if submission_type == 'text':
            processed_ans = [(0, [{'text': submission_data}])]

        elif submission_type == 'file':
            pages_as_images = submission_data
            processed_items = self.call_textract_multipages(pages_as_images)
            #print(processed_items)

        # evaluate submission against each rubric criteria
        assignment_grade = {}

        self.updateStatus(f"Grading rubrics##{len(rubric.items())-1} rubric(s) to grade")

        with concurrent.futures.ThreadPoolExecutor() as executor:
            futures = []
        
            for index, (criteria, desc) in enumerate(rubric.items(), start=1):
                if criteria == "band_scores":
                    continue

                self.total_tasks +=1
                futures.append(executor.submit(self.grade_assignment, qn=qn, 
                                            criteria=criteria,
                                            criteria_desc=desc, 
                                            band_scores=rubric['band_scores'], 
                                            ans=processed_items))
                futures[-1].add_done_callback(self.update_status_task)

            for future in concurrent.futures.as_completed(futures):
                grade, criteria = future.result()
                assignment_grade[criteria] = grade

        # format the JSON response
        json_response = self.format_json_response(assignment_grade)

        # save grade to database
        self.db.update_grade(self.user_id, self.assignment_id, 'done', None, json_response)

        return json_response
