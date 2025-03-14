import { WithAuthenticatorProps } from '@aws-amplify/ui-react';
import {
  AppLayout,
  Box,
  Button,
  Container,
  SpaceBetween,
} from '@cloudscape-design/components';
import * as Auth from 'aws-amplify/auth';
import { AuthUser } from 'aws-amplify/auth';
import { ComponentType, useEffect, useState } from 'react';

import { FullPageLoader } from '../components/FullPageLoader';
import config from '../config';

const withFederatedAuthenticator = <P extends object>(
  WrappedComponent: ComponentType<P & WithAuthenticatorProps>,
) => {
  // eslint-disable-next-line react/display-name
  return (props: P) => {
    const [user, setUser] = useState<AuthUser | undefined>();
    const [error, setError] = useState<string | undefined>();

    if (window.location.pathname === '/logout') {
      return <WrappedComponent {...props} />;
    }

    const init = async () => {
      const session = await Auth.fetchAuthSession();

      // Get the current URL
      const currentURL = new URL(window.location.href);

      // Check if error was returned from cognito
      const errorParam = currentURL.searchParams.get('error');

      if (errorParam) {
        setError(errorParam);
        return;
      }

      // if session.tokens is falsy, user is not logged in
      if (session && session.tokens) {
        let userAttributes, error;

        try {
          userAttributes = await Auth.fetchUserAttributes();
        } catch (err: any) {
          error = err;
        }

        if (error || !userAttributes) {
          setError(error.toString());
        } else {
          const user: AuthUser = {
            userId: userAttributes.sub!,
            username: userAttributes.name!,
            signInDetails: {
              loginId: userAttributes.email!,
            },
          };

          setUser(user);
        }
      } else {
        const args = config.CognitoIdentityProvider
          ? { provider: { custom: config.CognitoIdentityProvider } }
          : undefined;

        Auth.signInWithRedirect(args);
      }
    };

    useEffect(() => {
      init();
    }, []);

    const signOut = async () => {
      setUser(undefined);
      await Auth.signOut();
    };

    if (error) {
      return (
        <AppLayout
          navigationHide
          toolsHide
          content={
            <Box margin={{ top: 'l' }}>
              <Container>
                <SpaceBetween size="s">
                  <Box textAlign="center">
                    <strong>There was en error processing you request</strong>
                  </Box>
                  <Box textAlign="center">{error}</Box>
                  <Box textAlign="center">
                    <Button href="/">Try Again</Button>
                  </Box>
                </SpaceBetween>
              </Container>
            </Box>
          }
        />
      );
    }

    if (user) {
      return <WrappedComponent {...props} user={user} signOut={signOut} />;
    }

    return <FullPageLoader />;
  };
};

export default withFederatedAuthenticator;
