import { AuthConfig } from '@aws-amplify/core';
import { I18n } from 'aws-amplify/utils';

interface GlobalVariables {
  config?: ConfigData;
}

// web page will load config.js which loads config in global variable
type ConfigData = {
  CognitoUserPoolId: string;
  CognitoUserPoolClientId: string;
  CognitoHostedUiDomain?: string;
  CognitoIdentityProvider?: string;
  ApiUrl: string;
};

// read config (environment variables) from global 'window' object
const config = (window as GlobalVariables).config as ConfigData;

if (!config) {
  alert(
    'Config file not found. Please deploy CDK project using "npm run deploy" to generate the config file.',
  );
}

// export Amplify config for Cognito authentication
export const AmplifyConfig: { Auth: AuthConfig } = {
  Auth: {
    Cognito: {
      userPoolId: config.CognitoUserPoolId,
      userPoolClientId: config.CognitoUserPoolClientId,
    },
  },
};

if (config.CognitoHostedUiDomain) {
  AmplifyConfig.Auth.Cognito.loginWith = {
    oauth: {
      scopes: ['aws.cognito.signin.user.admin', 'openid'],
      responseType: 'code',
      domain: config.CognitoHostedUiDomain,
      redirectSignIn: [window.location.origin],
      redirectSignOut: [`${window.location.origin}/logout`],
    },
  };
}

// Customise Amplify auth labels
I18n.putVocabulariesForLanguage('en', {
  Username: 'Enter your email address',
  'Enter your Username': 'Enter your email address',
});

export default config;
