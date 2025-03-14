import { ContentLayout, Header, Tabs } from '@cloudscape-design/components';
import { useEffect } from 'react';

import { useBreadcrumb } from '../../../../hooks/useBreadcrumb';
import GeneralSettingsForm from '../../components/GeneralSettingsForm';
import MoodleSettingsForm from '../../components/MoodleSettingsForm';
import PromptSettingsForm from '../../components/PromptSettingsForm';

export const Settings = () => {
  const setBreadcrumb = useBreadcrumb();

  const init = async () => {
    setBreadcrumb([
      { text: 'Home', href: '/' },
      { text: 'Settings', href: '/settings' },
    ]);
  };

  useEffect(() => {
    init();
  }, []);

  return (
    <ContentLayout
      header={
        <Header variant="h1" description="Manage default values and settings">
          Settings
        </Header>
      }
    >
      <Tabs
        // variant="container"
        tabs={[
          {
            label: 'General',
            id: 'general',
            content: <GeneralSettingsForm />,
          },
          {
            label: 'Moodle',
            id: 'moodle',
            content: <MoodleSettingsForm />,
          },
          {
            label: 'Prompt Settings',
            id: 'prompt',
            content: <PromptSettingsForm />,
          },
        ]}
      />
    </ContentLayout>
  );
};

export default Settings;
