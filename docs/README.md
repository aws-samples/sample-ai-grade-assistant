# AWS AI Grade Assistant Demo

## About this project

The intent of this project is to help accelerate the development of full stack serverless applications running on AWS. The code deploys a sample web interface built using React and integrates with a serverless backend.

### Project Components

1. [User Interface](../ui)
2. [Backend Infrastructure](../cdk)
3. [Lambda Functions](../lambda)

### Optional things you can configure (see below)
1. You can set a custom domain for the user interface
2. You can enable Lambda functions to run within a VPC
3. How to enable SSO login (e.g. via Entra)

---

### How to set a custom domain for the user interface

The UI is served through [Amazon Cloudfront](https://aws.amazon.com/cloudfront/). By default, the front end website will be hosted on a Cloudfront domain, e.g. ```https://xyz.cloudfront.net```.

To use your own custom domain name, you will need to meet the following pre-requisites:

1. You will need to have a [Route53 Public Hosted Zone](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/AboutHZWorkingWith.html) in the AWS account where you are deploying the solution.

2. You will need a valid certificate in [Amazon Certificate Manager](https://aws.amazon.com/certificate-manager/). Note: this certificate must be in the US region to use with Cloudfront.

Before deploying the solution, you will need to provide some environment variables. The easiest way to do this is to create a new file in the **```cdk```** folder in this solution and name it **```.env```**.

Enter the following values into this file and save:

```
WEBSITE_DOMAIN_NAME=app.mydomain.com
WEBSITE_HOSTED_ZONE_DOMAIN_NAME=mydomain.com
WEBSITE_CERTIFICATE_ARN=acm_certificate_arn
```

Then run ```npm run deploy```.

The website should be available through your own custom domain. In the above example, it will be ```https://app.mydomain.com```.

See [.env.sample](.env.sample) for an example environment file.

---

### How to run Lambda functions in a VPC

By default, the Lambda functions in this solution will run outside of a VPC.

To run the Lambda functions within a VPC, you will need a VPC to be already created in the account that you are deploying to. (This solution will not deploy a VPC for you).

You will then need to provide environment variables. The easiest way to do this is to create a new file in the cdk folder in this solution and name it ```.env```

To use the default VPC, set the following environment variable:

```
LAMBDA_USE_DEFAULT_VPC=true
```

To use a specific VPC, set the following environment variable:

```
LAMBDA_VPC_ID=vpc-xyz123
```

Then run ```npm run deploy```

See [.env.sample](.env.sample) for an example environment file.

---

### How to enable SSO login (e.g. via Entra)

By default, this solution will deploy a new Cognito user pool. This user pool allows users to login using their email address and password.

Some customers will want to use their own identity solutions such as Entra ID, Active Directory, Okta, etc.

To do this, create a Cognito user pool manually. Once it has been set up, you will need to provide some configuration values to the application.

**Note: this implementation assumes you will be integrating with an Identity Provider using SAML**

To do this, perform the following actions:

#### 1. Set up a new Cognito user pool

1. Go to the AWS console -> Cognito -> Create new User Pool
2. Step 1 - Select **email** as the user pool sign in option
3. Step 2
    a. Accept default options.
    b. Recommended MFA option = No MFA. Most customers will already have MFA enabled in their identity platform.
4. Step 3
    a. Accept default options
    b. Add "name" as an additional required attribute
5. Step 4 - Send email with Cognito
6. Step 5 - 
    a. Enter a user pool name.
    b. Check the box for "Use the Cognito Hosted UI".
    c. Select "Use a Cognito domain" and enter a unique domain name. Note this down for later.
    d. Enter app client name "web-client"
    e. Enter allowed callback URL: ```http://localhost:5173```
7. Review and submit

Take note of the hosted UI domain + user pool ID for the next step.

#### 2. Configure Identity Provider

In the Identity platform, e.g. Entra, you will need to provide the following:

1. Entity ID: ```urn:amazon:cognito:sp:<user_pool_id>```
2. ACS URL: ```https://<hosted_domain>/saml2/idpresponse```

Once you have registered the app with the identity provider, you should receive SAML metadata (either a URL or a downloadable file) that you will need for the next step.

#### 3. Enable Identity Federation in Cognito

1. Go to the AWS console and open the user pool.
2. Go to Sign-in experience -> Add Identity Provider
3. Select SAML
    a. Enter a provider name. Take note of this for later.
    b. Upload or provide URL to metadata from identity provider
    c. Enter email + name attribute mappings
4. Go to App integration -> App client list -> web-client
5. Edit Hosted UI
6. Under Identity Providers, enable the new identity provider you've just added.
7. Ensure OIDC Scopes includes ```openid``` + ```aws.cognito.signin.user.admin```
8. In callback URLs, include http://localhost:5173 (for local development). Also include the URL for the live application (i.e. the CloudFront URL).
9. Include the same URLs in the Allowed Sign Out URLs.
10. Save.


#### 4. Update environment variables

In the ```.env``` file in the ```cdk``` folder, add the following variables

```
COGNITO_USER_POOL_ID=<user_pool_id>
COGNITO_USER_POOL_CLIENT_ID=<user_pool_client_id>
COGNITO_HOSTED_UI_DOMAIN=<hosted_ui_domain>
COGNITO_IDENTITY_PROVIDER=<name_of_identity_provider_from_step_3>
```

See ```.env.sample``` file for more details.

After updating the environment variables, deploy the solution using:

```
npm run deploy
```
