import { componentTypes, FormRenderer, validatorTypes } from '@aws-northstar/ui';
import { Box, Flashbar, SpaceBetween, Spinner } from '@cloudscape-design/components';
import { useNavigate } from 'react-router-dom';

import { EMAIL_REGEX } from '../../../helpers/constants';
import { useGetSettings, useUpdateSettings } from '../hooks';
import { GeneralSettings } from '../types';

export const GeneralSettingsForm = () => {
  const navigate = useNavigate();

  // update settings hook
  const { mutateAsync: updateSettings, isLoading: isUpdating } = useUpdateSettings();

  // get settings hook
  const query = useGetSettings('general');
  const { data: settings, isLoading, isError: isLoadingError } = query;

  const onSubmit = async (data: any) => {
    const settings = data as GeneralSettings;
    try {
      await updateSettings({ key: 'general', settings });
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
              name: 'applicationName',
              label: 'Application Name',
              validate: [
                {
                  type: validatorTypes.REQUIRED,
                  message: 'Please enter an application name',
                },
              ],
            },
            {
              component: componentTypes.TEXT_FIELD,
              name: 'notificationEmail',
              label: 'Notification Email',
              validate: [
                {
                  type: validatorTypes.REQUIRED,
                  message: 'Please enter an email address',
                },
                {
                  type: validatorTypes.PATTERN,
                  message: 'Please enter a valid email address',
                  pattern: EMAIL_REGEX,
                },
              ],
            },
            {
              component: componentTypes.SELECT,
              name: 'lms',
              label: 'LMS',
              validate: [
                {
                  type: validatorTypes.REQUIRED,
                  message: 'Please select an option',
                },
              ],
              options: [
                {
                  name: 'moodle',
                  value: 'Moodle',
                },
                {
                  name: 'canvas',
                  value: 'Canvas',
                },
              ],
            },
          ],
        }}
      />
    </Box>
  );
};

export default GeneralSettingsForm;
