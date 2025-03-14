// Import styles
import '@aws-amplify/ui-react/styles.css';
import './assets/styles/app.scss';

import { withAuthenticator, WithAuthenticatorProps } from '@aws-amplify/ui-react';
import NorthStarThemeProvider from '@aws-northstar/ui/components/NorthStarThemeProvider';
import { Amplify } from 'aws-amplify';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { RecoilRoot } from 'recoil';

import AppLayout from './components/AppLayout';
import config, { AmplifyConfig } from './config';
import Home from './domains/home';
import Logout from './domains/logout';
import Settings from './domains/settings/pages/Settings';
import ListSubmissions from './domains/submissions/pages/ListSubmissions';
import SubmissionDetails from './domains/submissions/pages/SubmissionDetails';
import ListUsers from './domains/users/pages/ListUsers';
import withFederatedAuthenticator from './helpers/withFederatedAuthenticator';

Amplify.configure(AmplifyConfig);

const AppBase = ({ user, signOut }: WithAuthenticatorProps) => {
  return (
    <RecoilRoot>
      <Router>
        <NorthStarThemeProvider>
          <AppLayout signOut={signOut} user={user}>
            <Routes>
              <Route path="/submissions" element={<ListSubmissions />} />
              <Route
                path="/submission/:courseId/:assignmentId/:studentId"
                element={<SubmissionDetails />}
              />
              <Route path="/users" element={<ListUsers />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/" element={<Home />} />
              <Route path="/logout" element={<Logout />} />
            </Routes>
          </AppLayout>
        </NorthStarThemeProvider>
      </Router>
    </RecoilRoot>
  );
};

const App = config.CognitoHostedUiDomain
  ? withFederatedAuthenticator(AppBase)
  : withAuthenticator(AppBase, { signUpAttributes: ['name'] });

export default App;
