import boto3
import os
from aws_xray_sdk.core import patch_all

from lib.utils import httpResponse

# trace all external calls via AWS X-Ray
patch_all()

def lambda_handler(event, context):
    query_parameters = event.get('queryStringParameters', {})

    region = os.getenv("REGION")
    if query_parameters:
        region = query_parameters.get('br_region', os.getenv("REGION"))

    print(f"REGION -- {region}")

    bedrock = boto3.client('bedrock', region_name=region)

    response = bedrock.list_foundation_models(
        byOutputModality='TEXT',
        byInferenceType='ON_DEMAND'
    )
    compatible_models = ['ai21.jamba-instruct',
                             'anthropic.claude',
                             'cohere.command-r',
                             'meta.llama',
                             'mistral.mistral-large',
                             'mistral.mistral-small',
                             'amazon.nova'
                             ]

    bedrock_models = {
        "region": region,
        "models":[
        {
            'modelId': model['modelId'],
            'modelName': model['modelName']
        }
        for model in response['modelSummaries']
        if any(model['modelId'].startswith(compatible_model) for compatible_model in compatible_models)

        #if model['modelName'].startswith("Claude 3")
    ]
    }
    response = httpResponse(bedrock_models)
    return response
    