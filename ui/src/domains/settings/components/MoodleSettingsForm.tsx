import { componentTypes, FormRenderer, validatorTypes } from '@aws-northstar/ui';
import { Box, Flashbar, SpaceBetween, Spinner } from '@cloudscape-design/components';
import { useNavigate } from 'react-router-dom';

import { useGetSettings, useUpdateSettings } from '../hooks';
import { MoodleSettings } from '../types';

export const MoodleSettingsForm = () => {
  const navigate = useNavigate();

  // update settings hook
  const { mutateAsync: updateSettings, isLoading: isUpdating } = useUpdateSettings();

  // get settings hook
  const query = useGetSettings('moodle');
  const { data: settings, isLoading, isError: isLoadingError } = query;

  const onSubmit = async (data: any) => {
    const settings = data as MoodleSettings;
    try {
      await updateSettings({ key: 'moodle', settings });
      navigate('/settings');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error(err.message);
    }
  };

  const onCancel = () => {
    navigate('/settings');
  };

  if (isLoading) {
    return (
      <Box margin={{ top: 's' }}>
        <SpaceBetween size="xs" direction="horizontal" alignItems="center">
          <Spinner size="big" />
          <Box>Loading...</Box>
        </SpaceBetween>
      </Box>
    );
  }

  if (isLoadingError) {
    return (
      <Flashbar
        items={[
          {
            type: 'error',
            header: 'Whoops! Something went wrong...',
            content: 'Please refresh and try again.',
          },
        ]}
      />
    );
  }

  return (
    <Box data-tab-form>
      <FormRenderer
        isSubmitting={isUpdating}
        onCancel={onCancel}
        onSubmit={onSubmit}
        initialValues={{
          ...settings,
        }}
        schema={{
          canCancel: false,
          submitLabel: 'Update',
          fields: [
            {
              component: componentTypes.TEXT_FIELD,
              name: 'moodleURL',
              label: 'Moodle URL',
              validate: [
                {
                  type: validatorTypes.REQUIRED,
                  message: 'Please enter the URL to your Moodle environment',
                },
              ],
            },
            {
              component: componentTypes.TEXT_FIELD,
              name: 'moodleToken',
              label: 'Moodle Token',
              validate: [
                {
                  type: validatorTypes.REQUIRED,
                  message: 'Please enter the Moodle token',
                },
              ],
            },
          ],
        }}
      />
    </Box>
  );
};

export default MoodleSettingsForm;
