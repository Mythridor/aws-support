import cdk = require("@aws-cdk/core");
import lambda = require("@aws-cdk/aws-lambda");
import apigateway = require("@aws-cdk/aws-apigateway");
import iam = require("@aws-cdk/aws-iam");

export class SimplonStack extends cdk.Stack {
    constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const get_vpc = new lambda.Function(this, "getOneVPCFunction", {
            code: new lambda.AssetCode("src"),
            handler: "get_vpc.handler",
            runtime: lambda.Runtime.PYTHON_3_7,
            functionName: "get_vpc_by_id"
        });

        const get_all_vpcs = new lambda.Function(this, "getAllVPCsFunction", {
            code: new lambda.AssetCode("src"),
            handler: "get_all_vpcs.handler",
            runtime: lambda.Runtime.PYTHON_3_7,
            functionName: "get_all_vpc"
        });

        const get_subnet_by_vpc = new lambda.Function(
            this,
            "getSubnetsByVPCFunction",
            {
                code: new lambda.AssetCode("src"),
                handler: "get_subnets_by_vpc.handler",
                runtime: lambda.Runtime.PYTHON_3_7,
                functionName: "get_subnets_by_vpc"
            }
        );

        const ec2_read_only_policy_statement = new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: ["ec2:Describe*"],
            resources: ["*"]
        });

        get_vpc.addToRolePolicy(ec2_read_only_policy_statement);

        get_all_vpcs.addToRolePolicy(ec2_read_only_policy_statement);

        get_subnet_by_vpc.addToRolePolicy(ec2_read_only_policy_statement);

        const api = new apigateway.RestApi(this, "VPCApi", {
            restApiName: "VPC Consultation",
            endpointTypes: [apigateway.EndpointType.REGIONAL]
        });

        const vpcs = api.root.addResource("vpcs");
        const get_all_vpcs_integration = new apigateway.LambdaIntegration(
            get_all_vpcs
        );

        vpcs.addMethod("GET", get_all_vpcs_integration);

        const single_vpc = vpcs.addResource("{id}");
        const get_vpc_integration = new apigateway.LambdaIntegration(get_vpc);
        single_vpc.addMethod("GET", get_vpc_integration);

        const subnets_by_vpc = single_vpc.addResource("subnets");
        const get_subnet_integration = new apigateway.LambdaIntegration(
            get_subnet_by_vpc
        );
        subnets_by_vpc.addMethod("GET", get_subnet_integration);

        addCorsOptions(single_vpc);
        addCorsOptions(vpcs);
        addCorsOptions(subnets_by_vpc);
    }
}

export function addCorsOptions(apiResource: apigateway.IResource) {
    apiResource.addMethod(
        "OPTIONS",
        new apigateway.MockIntegration({
            integrationResponses: [
                {
                    statusCode: "200",
                    responseParameters: {
                        "method.response.header.Access-Control-Allow-Headers":
                            "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent'",
                        "method.response.header.Access-Control-Allow-Origin":
                            "'*'",
                        "method.response.header.Access-Control-Allow-Credentials":
                            "'false'",
                        "method.response.header.Access-Control-Allow-Methods":
                            "'OPTIONS,GET,PUT,POST,DELETE'"
                    }
                }
            ],
            passthroughBehavior: apigateway.PassthroughBehavior.NEVER,
            requestTemplates: {
                "application/json": '{"statusCode": 200}'
            }
        }),
        {
            methodResponses: [
                {
                    statusCode: "200",
                    responseParameters: {
                        "method.response.header.Access-Control-Allow-Headers": true,
                        "method.response.header.Access-Control-Allow-Methods": true,
                        "method.response.header.Access-Control-Allow-Credentials": true,
                        "method.response.header.Access-Control-Allow-Origin": true
                    }
                }
            ]
        }
    );
}
