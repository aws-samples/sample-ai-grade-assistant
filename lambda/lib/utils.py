import json

def httpResponse(object, status_code=200):
    """
    Utility function to create a standardised Lambda HTTP response object including CORS headers. 
    """
    response = {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "*",
        },
        "body": json.dumps(object)
    }
    return response
