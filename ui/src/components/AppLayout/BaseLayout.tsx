import AppLayoutBase from '@aws-northstar/ui/components/AppLayout';
import { User } from '@aws-northstar/ui/components/AppLayout/components/NavHeader';
import { BreadcrumbGroup } from '@cloudscape-design/components';
import { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { useNavigate } from 'react-router-dom';

import { getCurrentUser } from '../../helpers/util';
import { useAppContext } from '../AppContext/context';
import { AppLayoutProps } from '.';
import { navigationItems } from './constants';
import NavHeader from './NavHeader';

// react query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      retry: false,
    },
  },
});

const BaseLayout = ({ signOut, children }: AppLayoutProps) => {
  const navigate = useNavigate();
  const { breadcrumb } = useAppContext();
  const [user, setUser] = useState<User | undefined>();

  // sign out using amplify when user signs out through nav signout button
  const onSignOut = async () => {
    // clear local api cache on sign out
    queryClient.clear();

    // signout from cognito using amplify function
    if (signOut) {
      signOut();
    }
  };

  const init = async () => {
    const currentUser = await getCurrentUser();
    setUser(currentUser);
  };

  useEffect(() => {
    init();
  }, []);

  return (
    <AppLayoutBase
      headerSelector="#app-header"
      header={<NavHeader title="AI Grade Assistant" user={user} onSignout={onSignOut} />}
      title="AI Grade Assistant"
      navigationItems={navigationItems}
      navigationOpen={window.innerWidth > 688}
      breadcrumbGroup={
        <BreadcrumbGroup
          items={breadcrumb}
          onClick={(e) => {
            e.preventDefault();
            navigate(e.detail.item.href);
          }}
        />
      }
    >
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </AppLayoutBase>
  );
};

export default BaseLayout;
