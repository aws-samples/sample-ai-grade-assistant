import { AuthUser } from 'aws-amplify/auth';
import { ReactNode } from 'react';

import { AppContext } from '../AppContext';
import BaseLayout from './BaseLayout';

export interface AppLayoutProps {
  signOut?: () => void;
  user?: AuthUser;
  children: ReactNode;
}

const AppLayout = ({ signOut, children }: AppLayoutProps) => {
  if (window.location.pathname === '/logout') {
    return children;
  }

  return (
    <AppContext>
      <BaseLayout signOut={signOut}>{children}</BaseLayout>
    </AppContext>
  );
};

export default AppLayout;
