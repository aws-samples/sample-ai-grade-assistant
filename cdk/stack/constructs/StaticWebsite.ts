import * as cdk from 'aws-cdk-lib';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as route53targets from 'aws-cdk-lib/aws-route53-targets';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export interface StaticWebsiteProps {
  domainName?: string;
  certificateArn?: string;
  hostedZoneDomainName?: string;
}

export default class StaticWebsite extends Construct {
  public bucket: s3.Bucket;
  public distribution: cloudfront.CloudFrontWebDistribution;
  public baseUrl: string;

  constructor(
    scope: Construct,
    id: string,
    { domainName, certificateArn, hostedZoneDomainName }: StaticWebsiteProps = {},
  ) {
    super(scope, id);

    // S3 bucket
    this.bucket = new s3.Bucket(this, `${id}-bucket`, {
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      objectOwnership: s3.ObjectOwnership.OBJECT_WRITER,
      enforceSSL: true,
    });

    // Optional: Add certificate and alternate CNAMEs if provided
    const viewerCertificate: cloudfront.ViewerCertificate | undefined =
      certificateArn && domainName
        ? {
            aliases: domainName ? [domainName] : [],
            props: {
              acmCertificateArn: certificateArn,
              sslSupportMethod: cloudfront.SSLMethod.SNI,
            },
          }
        : undefined;

    // Cloudfront distribution
    this.distribution = new cloudfront.CloudFrontWebDistribution(
      this,
      `${id}-distribution`,
      {
        viewerCertificate,
        originConfigs: [
          {
            s3OriginSource: {
              s3BucketSource: this.bucket,
            },
            behaviors: [
              {
                isDefaultBehavior: true,
                forwardedValues: {
                  queryString: false,
                  cookies: { forward: 'none' },
                },
                allowedMethods: cloudfront.CloudFrontAllowedMethods.GET_HEAD,
                viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                defaultTtl: cdk.Duration.seconds(0),
                minTtl: cdk.Duration.seconds(0),
                maxTtl: cdk.Duration.seconds(0),
              },
            ],
          },
        ],
        errorConfigurations: [
          {
            errorCode: 404,
            responseCode: 200,
            responsePagePath: '/index.html',
          },
          {
            errorCode: 403,
            responseCode: 200,
            responsePagePath: '/index.html',
          },
        ],
        defaultRootObject: 'index.html',
      },
    );

    // Origin access control (OAC)
    const oac = new cloudfront.CfnOriginAccessControl(this, `${id}-oac`, {
      originAccessControlConfig: {
        name: this.bucket.bucketName,
        originAccessControlOriginType: 's3',
        signingBehavior: 'always',
        signingProtocol: 'sigv4',
      },
    });

    // Apply OAC to distribution
    const cfnDistribution = this.distribution.node
      .defaultChild as cloudfront.CfnDistribution;
    cfnDistribution.addPropertyOverride(
      'DistributionConfig.Origins.0.OriginAccessControlId',
      oac.getAtt('Id'),
    );

    // Add OAC bucket policy to S3 bucket
    const bucketPolicy = new s3.BucketPolicy(this, `${id}-bucket-policy`, {
      bucket: this.bucket,
    });

    bucketPolicy.document.addStatements(
      // enforce SSL
      new iam.PolicyStatement({
        effect: iam.Effect.DENY,
        actions: ['s3:*'],
        principals: [new iam.AnyPrincipal()],
        resources: [this.bucket.bucketArn, this.bucket.arnForObjects('*')],
        conditions: {
          Bool: {
            'aws:SecureTransport': false,
          },
        },
      }),

      // OAC policy - allow read access to cloudfront distribution
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['s3:GetObject'],
        principals: [new iam.ServicePrincipal('cloudfront.amazonaws.com')],
        resources: [this.bucket.arnForObjects('*')],
        conditions: {
          StringEquals: {
            'aws:SourceArn': cdk.Arn.format(
              {
                service: 'cloudfront',
                resource: 'distribution',
                region: '',
                resourceName: this.distribution.distributionId,
              },
              cdk.Stack.of(this),
            ),
          },
        },
      }),
    );

    // Optional: If a domain and hosted zone are provided, create a DNS record
    if (domainName && hostedZoneDomainName) {
      // get the hosted zone
      const existingHostedZone = route53.HostedZone.fromLookup(
        this,
        `${id}-hosted-zone`,
        {
          domainName: hostedZoneDomainName,
        },
      );

      // create CNAME record in Route 53 pointing to api gateway domain name
      new route53.ARecord(this, `${id}-dns-record`, {
        zone: existingHostedZone,
        recordName: domainName,
        target: route53.RecordTarget.fromAlias(
          new route53targets.CloudFrontTarget(this.distribution),
        ),
      });
    }

    if (domainName) {
      this.baseUrl = `https://${domainName}`;
    } else {
      this.baseUrl = `https://${this.distribution.distributionDomainName}`;
    }
  }
}
