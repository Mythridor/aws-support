import json
import boto3

client = boto3.client("ec2")


def handler(event, context):
    return {"statusCode": 200, "body": json.dumps(client.describe_vpcs())}

