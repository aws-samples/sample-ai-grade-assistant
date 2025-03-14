import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as route53 from 'aws-cdk-lib/aws-route53';
import { Construct } from 'constructs';

interface ApiGatewayProps {
  apiName: string;
  accessLogRetention?: number;
  customDomain?: {
    certificateArn: string;
    domainName: string;
    hostedZoneDomainName: string;
  };
}

export default class ApiGateway extends Construct {
  public api: apigateway.RestApi;

  constructor(scope: Construct, id: string, props?: ApiGatewayProps) {
    super(scope, id);

    // Create log group for API gateway
    const apiLogGroup = new logs.LogGroup(this, 'access-logs', {
      // default to one week retention if not specified
      retention: props?.accessLogRetention ?? logs.RetentionDays.ONE_WEEK,
    });

    // Create an API Gateway to expose the Lambda function
    this.api = new apigateway.RestApi(this, 'rest-api', {
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: apigateway.Cors.DEFAULT_HEADERS,
        allowCredentials: true,
      },
      deployOptions: {
        // stageName: 'v1',
        accessLogDestination: new apigateway.LogGroupLogDestination(apiLogGroup),
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        tracingEnabled: true,
      },
      endpointTypes: [apigateway.EndpointType.REGIONAL],
    });

    // Custom domain
    if (props?.customDomain) {
      const { certificateArn, domainName, hostedZoneDomainName } = props.customDomain;

      // reference existing SSL certificate
      const certificate = acm.Certificate.fromCertificateArn(
        this,
        'certificate',
        certificateArn,
      );

      // create api domain name
      const domain = new apigateway.DomainName(this, 'domain-name', {
        domainName,
        certificate: certificate,
        endpointType: apigateway.EndpointType.REGIONAL,
        securityPolicy: apigateway.SecurityPolicy.TLS_1_2,
      });

      // map custom domain to api
      new apigateway.BasePathMapping(this, 'base-path-mapping', {
        domainName: domain,
        restApi: this.api,
      });

      // get the hosted zone
      const hostedZone = route53.HostedZone.fromLookup(this, 'hosted-zone', {
        domainName: hostedZoneDomainName,
      });

      // create CNAME record in Route 53 pointing to api gateway domain name
      new route53.CnameRecord(this, 'cname-record', {
        zone: hostedZone,
        recordName: process.env.DOMAIN_NAME,
        domainName: domain.domainNameAliasDomainName,
      });
    }
  }

  // given a rest api and route string (e.g. "/projects/{id}"), create an api resource
  createApiRoute(route: string): apigateway.IResource {
    // split route string into parts
    const routeParts = route.split('/').filter((part) => part !== '');

    // start at api root
    let currentResource = this.api.root;

    // loop through each route part
    for (const part of routeParts) {
      const existingResource = currentResource.getResource(part);

      // if route exists use it, otherwise add it
      currentResource = existingResource
        ? existingResource
        : currentResource.addResource(part);
    }

    return currentResource;
  }
}
