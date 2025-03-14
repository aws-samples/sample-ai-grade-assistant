import {
  Button,
  Container,
  ContentLayout,
  Header,
  SpaceBetween,
} from '@cloudscape-design/components';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { useBreadcrumb } from '../../hooks/useBreadcrumb';

export const Home = () => {
  const navigate = useNavigate();
  const setBreadcrumb = useBreadcrumb();

  const init = () => {
    setBreadcrumb([{ text: 'Home', href: '/' }]);
  };

  useEffect(() => {
    init();
  }, []);

  return (
    <ContentLayout
      header={
        <Header
          variant="h1"
          description="An AI powered Grading Assitant powered by AWS and Amazon Bedrock"
          actions={
            <Button variant="primary" onClick={() => navigate('/submissions')}>
              View Submissions
            </Button>
          }
        >
          Welcome to the AI Grade Assistant
        </Header>
      }
    >
      <SpaceBetween size="s">
        <Container>
          <Header variant="h3">Overview</Header>
          <p>
            This application connects to your Learning Management System (LMS) and assists
            you with grading student assignments.
          </p>
          <p>
            This application currently supports integration with:
            <ul>
              <li>Moodle</li>
              <li>Canvas (coming soon!)</li>
            </ul>
          </p>
          <Header variant="h3">How does it work?</Header>
          <p>
            Under the hood this application uses Amazon Bedrock, specifically Claude Sonet
            v3.
          </p>
          <p>
            To get started, ensure your Moodle settings are configured in{' '}
            <Button variant="inline-link" onClick={() => navigate('/settings')}>
              settings
            </Button>
            .
          </p>
          <p>
            Then find student{' '}
            <Button variant="inline-link" onClick={() => navigate('/submissions')}>
              submissions
            </Button>{' '}
            and simply click on "Grade this submission".
          </p>
        </Container>
      </SpaceBetween>
    </ContentLayout>
  );
};

export default Home;
