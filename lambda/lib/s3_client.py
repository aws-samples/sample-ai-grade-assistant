import boto3
from botocore.exceptions import ClientError

def save_bytes_to_s3(bucket_name, object_key, bytes_data):
    # download file and save to S3
    try:
        s3 = boto3.client('s3')
        response = s3.put_object(
            Body=bytes_data,
            Bucket=bucket_name,
            Key=object_key,
        )
        return f"s3://{bucket_name}/{object_key}"
    except ClientError as e:
        print(f"Error uploading file to S3: {e}")
        return None