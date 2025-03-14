# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0

# Python Built-Ins:
import os
from typing import Optional
import json
import copy

# External Dependencies:
import boto3
from botocore.config import Config

class BedRock:
    client = None

    model_options = {
        "Claude-v2": "anthropic.claude-v2",
        "Claude-v2.1": "anthropic.claude-v2:1",
        # "Claude-3-Opus": "anthropic.claude-3-opus-20240229-v1:0",
        "Claude-3-Sonnet": "anthropic.claude-3-sonnet-20240229-v1:0",
        "Claude-3-Haiku": "anthropic.claude-3-haiku-20240307-v1:0",
        "Llama-2-13B": "meta.llama2-13b-chat-v1",
        "Llama-2-70B": "meta.llama2-70b-chat-v1",
        "Llama-3-8B": "meta.llama3-8b-instruct-v1:0",
        "Llama-3-70B": "meta.llama3-70b-instruct-v1:0",
    }

    #model_name = "Claude-3-Sonnet"
    model_id = "anthropic.claude-3-sonnet-20240229-v1:0"
    region = 'us-east-1'

    max_tokens = 2000
    temperature = 0.5
    top_p = 0.2
    system = ""
    stop_sequence = []

    def __init__(self, model_id='anthropic.claude-3-sonnet-20240229-v1:0', region='us-east-1'):
        self.model_id = model_id
        
        # uncomment line below for local notebook dev
        # self.client = self.get_bedrock_client(region=region)
        
        # for lambda, just use this
        self.client = boto3.Session().client(
            service_name='bedrock-runtime',
            config=Config(
                region_name=region,
                retries={
                    "max_attempts": 10,
                    "mode": "standard",
                },
            )   
        )

        self.region = region
        print(f"ENDPOINT FOR BEDROCK: {self.client._endpoint}")
        print(f"MODEL FOR BEDROCK: {self.model_id}")


    def get_model_options(self):
        return self.model_options
    

    def prompt(self, user_prompt):
        # format user prompt and payload
        user_prompt = f"Human: {user_prompt}\n\nAssistant:"
        payload = self.format_payload(user_prompt)

        # get response from model
        response = self.client.invoke_model(
            body=payload['body'],
            modelId=self.model_id,
            accept=payload['accept'],
            contentType=payload['contentType']
        )

        # format response
        response_body = json.loads(response.get("body").read()).get("completion")
        return response_body
    

    def prompt_w_history(self, user_prompt, history):
        # format chat history
        formatted_prompt = self.format_prompt_claude(history)

        # append latest user prompt
        formatted_prompt += f"Human: {user_prompt}\n\nAssistant:"

        # send prompt to model
        return self.prompt(formatted_prompt)
        

    def format_prompt_claude_3(self, user_prompt, history):   
        messages = history + [{'role':'user', 'content':user_prompt}]
        return messages
    

    def format_payload_claude_3(self, messages, max_tokens=512, system_prompt=""):

        accept = "application/json"
        contentType = "application/json"

        body=json.dumps({
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": max_tokens,
            "system": system_prompt,
            "messages": messages,
            "temperature": 0.5,
            "top_p": 0.2,
            "top_k": 100,
        })      

        return {'accept': accept, 'contentType': contentType, 'body': body}
    

    def format_response_claude_3(self, payload):

        # get response from model
        # response = bedrock_runtime.invoke_model(body=body, modelId=model_id)

        response = self.client.invoke_model_with_response_stream(
            body=payload['body'],
            modelId=self.model_id,
            accept=payload['accept'],
            contentType=payload['contentType']
        )

        # return streaming response
        return {'body': response.get('body'), 'key': ''}


    def format_prompt_claude(self, user_prompt, history):        
        formatted_prompt = ""

        # format each chat in the history
        while(len(history) > 0):
            user_chat = history.pop(0)['content']
            assistant_chat = history.pop(0)['content']
            formatted_prompt += f"Human: {user_chat}\n\nAssistant:{assistant_chat}\n\n"

        # append latest user prompt
        formatted_prompt += f"Human: {user_prompt}\n\nAssistant:"

        return formatted_prompt
    

    def format_payload_claude(self, user_prompt):
        # define model parameters --> https://docs.aws.amazon.com/bedrock/latest/userguide/model-parameters.html#model-parameters-claude

        accept = "application/json"
        contentType = "application/json"
        body = json.dumps({"prompt": user_prompt,
                            "temperature": 0.5,
                            "top_p": 0.2,
                            "top_k": 100,
                            "max_tokens_to_sample": 10000,
                            "stop_sequences": ["\n\nHuman:"]
                        })
        
        return {'accept': accept, 'contentType': contentType, 'body': body}
    

    def format_response_claude(self, payload):

        # get response from model
        response = self.client.invoke_model_with_response_stream(
            body=payload['body'],
            modelId=self.model_id,
            accept=payload['accept'],
            contentType=payload['contentType']
        )

        # return streaming response
        return {'body': response.get('body'), 'key': 'completion'}
    

    def format_prompt_llama(self, user_prompt, history):     

        # check if history is within token limit
        while True:
            # count total number of words
            tokens = 0

            for chat in history:
                content = chat['content']
                tokens += len(content.split())

            if tokens <= 3000:
                break

            # remove oldest message (user and assistant)
            else:
                print("\nMessage history too long. Truncating...")
                history.pop(0)
                history.pop(0)

        formatted_prompt = ""

        for chat in history:
            formatted_prompt += chat['content'] + "\n\n"

        formatted_prompt += user_prompt
        return formatted_prompt
    

    def format_payload_llama(self, user_prompt):
        # define model parameters --> https://docs.aws.amazon.com/bedrock/latest/userguide/api-methods-run-inference.html#api-inference-examples-meta-llama    

        body = {
            "prompt": user_prompt,
            "temperature": 0.5,
            "top_p": 0.9,
            "max_gen_len": 512,
        }

        return body


    def format_response_llama(self, payload):
        response = self.client.invoke_model_with_response_stream(
            modelId = self.model_id,
            body = json.dumps(payload)
        )

        # return streaming response
        return {'body': response.get('body'), 'key': 'generation'}


    def converse_stream(self, prompt, chat_history=[], model_config={}):
        '''
        Invokes the LLM via converse_stream API and returns the streaming object.
        The model_config is a dict containing one or more keys: model_name, system, max_tokens, temperature, top_p, and stop_sequences. If any key is not given, default values are used.
        '''

        # format chat history
        messages = [{'role':msg['role'], 'content':[{'text': msg['content']}]}
                     for msg in chat_history]

        # append latest user prompt
        messages += [{'role': 'user', 'content': [{'text': prompt}]}]

        # model setup
        model_id =  self.model_id #self.model_options[model_config['model_name']] if 'model_name' in model_config else self.model_id
        system =  model_config['system'] if 'system' in model_config else self.system
        
        # hyperparameters
        max_tokens =  model_config['max_tokens'] if 'max_tokens' in model_config else self.max_tokens
        temperature =  model_config['temperature'] if 'temperature' in model_config else self.temperature
        top_p =  model_config['top_p'] if 'top_p' in model_config else self.top_p
        stop_seq =  model_config['stop_sequences'] if 'stop_sequence' in model_config else self.stop_sequence
        
        # invoke model
        if system == "" or 'titan' in model_id:
            response = self.client.converse_stream(
                modelId=model_id,
                messages=messages,            
                inferenceConfig={
                    'maxTokens': max_tokens,
                    'temperature': temperature,
                    'topP': top_p,
                    'stopSequences': stop_seq,
                },
            )
        
        else:
            response = self.client.converse_stream(
                modelId=model_id,
                messages=messages,      
                system=[{'text': system},],         
                inferenceConfig={
                    'maxTokens': max_tokens,
                    'temperature': temperature,
                    'topP': top_p,
                    'stopSequences': stop_seq,
                },
            )
                
        return response


    def invoke_model(self, prompt, chat_history=[], model_config={}, stream=True):
        '''
        Invokes the LLM and returns the response.
        If stream=True (default), the LLM will be invoked via converse_stream API and returns the streaming object. Else, the converse API is used and the response object is returned.
        The model_config is an optional dict containing one or more keys: model_name, system_prompt, max_tokens, temperature, top_p, and stop_sequences. If any key is not given, default values are used.
        '''

        messages = []

        # format chat history
        messages += [{'role':msg['role'], 'content':[{'text': msg['content']}]}
                     for msg in chat_history]

        # append latest user prompt
        messages += [{'role': 'user', 'content': [{'text': prompt}]}]

        # model setup
        model_id =  self.model_id #self.model_options[model_config['model_name']] if 'model_name' in model_config else self.model_id
        system_prompt =  model_config['system_prompt'] if 'system_prompt' in model_config else self.system
        
        # hyperparameters
        max_tokens =  model_config['max_tokens'] if 'max_tokens' in model_config else self.max_tokens
        temperature =  model_config['temperature'] if 'temperature' in model_config else self.temperature
        top_p =  model_config['top_p'] if 'top_p' in model_config else self.top_p
        stop_seq =  model_config['stop_sequences'] if 'stop_sequence' in model_config else self.stop_sequence
        
        # invoke model --> omit system prompt if not available or using Titan
        if system_prompt == "" or 'titan' in model_id:
            if stream == True:
                response = self.client.converse_stream(
                    modelId=model_id,
                    messages=messages,            
                    inferenceConfig={
                        'maxTokens': max_tokens,
                        'temperature': temperature,
                        'topP': top_p,
                        'stopSequences': stop_seq,
                    },
                )

            else:
                response = self.client.converse(
                    modelId=model_id,
                    messages=messages,            
                    inferenceConfig={
                        'maxTokens': max_tokens,
                        'temperature': temperature,
                        'topP': top_p,
                        'stopSequences': stop_seq,
                    },
                )
        
        else:
            if stream == True:
                response = self.client.converse_stream(
                    modelId=model_id,
                    messages=messages,      
                    system=[{'text': system_prompt},],         
                    inferenceConfig={
                        'maxTokens': max_tokens,
                        'temperature': temperature,
                        'topP': top_p,
                        'stopSequences': stop_seq,
                    },
                )

            else:
                response = self.client.converse(
                    modelId=model_id,
                    messages=messages,            
                    system=[{'text': system_prompt},],     
                    inferenceConfig={
                        'maxTokens': max_tokens,
                        'temperature': temperature,
                        'topP': top_p,
                        'stopSequences': stop_seq,
                    },
                )
                
        return response



    def query_kb(self, prompt, kb_id, num_results):

        # run vector search on Bedrock Knowledge Base
        # https://boto3.amazonaws.com/v1/documentation/api/latest/reference/services/bedrock-agent-runtime/client/retrieve.html

        # bedrock_agent = boto3.client('bedrock-agent-runtime',
        #                             config=Config(region_name=self.region))
        bedrock_agent = boto3.client('bedrock-agent-runtime',
                                    config=Config(region_name='us-east-1'))

        response = bedrock_agent.retrieve(

            # get bedrock kb ID from aws console > bedrock > kb > myKB > kb ID
            knowledgeBaseId=kb_id,

            # pass original prompt as the retrieval query
            retrievalQuery={
                'text': prompt
            },

            # set the desired number of results to be returned
            retrievalConfiguration={
                'vectorSearchConfiguration': {
                    'numberOfResults': num_results
                }
            },
        )

        return response['retrievalResults']
