import { componentTypes, FormRenderer, validatorTypes } from '@aws-northstar/ui';
import { Box, Flashbar, SpaceBetween, Spinner } from '@cloudscape-design/components';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import TemplateEditorFormField from '../../../components/TemplateEditor/TemplateEditorFormField';
import { useGetAvailableModels, useGetSettings, useUpdateSettings } from '../hooks';
import { PromptSettings, SelectOption } from '../types';

export const PromptSettingsForm = () => {
  const navigate = useNavigate();

  // local state
  const [region, setRegion] = useState<string>('ap-southeast-2');
  const [availableModelOptions, setAvailableModelOptions] = useState<SelectOption[]>([]);

  const regionOptions: SelectOption[] = [
    {
      label: 'Sydney (ap-southeast-2)',
      value: 'ap-southeast-2',
    },
    {
      label: 'North Virginia (us-east-1)',
      value: 'us-east-1',
    },
    {
      label: 'Oregon (us-west-2)',
      value: 'us-west-2',
    },
  ];

  // update settings hook
  const { mutateAsync: updateSettings, isLoading: isUpdating } = useUpdateSettings();

  // get settings hook
  const query = useGetSettings('prompt');
  const { data: settings, isLoading, isError: isLoadingError } = query;

  // get available models hook
  const {
    data: availableModels,
    isLoading: isModelsLoading,
    isError: isModelsLoadingError,
  } = useGetAvailableModels(region);

  const onSubmit = async (data: any) => {
    const settings: PromptSettings = {
      systemPrompt: data.systemPrompt,
      gradingPrompt: data.gradingPrompt,
      bedrockRegion: data.bedrockRegion.value,
      modelId: data.modelId.value,
    };

    try {
      await updateSettings({ key: 'prompt', settings });
      navigate('/settings');
    } catch (err: any) {
      console.error(err.message);
    }
  };

  // when available models are pulled from api, update option list
  useEffect(() => {
    if (availableModels) {
      setAvailableModelOptions(
        availableModels?.models.map((model) => ({
          label: model.modelName,
          value: model.modelId,
        })),
      );
    }
  }, [availableModels]);

  // when settings are pulled from database, update selected region
  useEffect(() => {
    if (settings && (settings as PromptSettings).bedrockRegion) {
      setRegion((settings as PromptSettings).bedrockRegion);
    }
  }, [settings]);

  const onCancel = () => {
    navigate('/settings');
  };

  if (isLoading || isModelsLoading) {
    return (
      <Box margin={{ top: 's' }}>
        <SpaceBetween size="xs" direction="horizontal" alignItems="center">
          <Spinner size="big" />
          <Box>Loading...</Box>
        </SpaceBetween>
      </Box>
    );
  }

  if (isLoadingError || isModelsLoadingError) {
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
        subscription={{ values: true }}
        initialValues={{
          systemPrompt: (settings as PromptSettings)?.systemPrompt ?? '',
          gradingPrompt: (settings as PromptSettings)?.gradingPrompt ?? '',
        }}
        schema={{
          canCancel: false,
          submitLabel: 'Update',
          fields: [
            {
              component: componentTypes.SELECT,
              name: 'bedrockRegion',
              label: 'Bedrock region',
              placeholder: 'AWS Region to use for Bedrock',
              validate: [
                {
                  type: validatorTypes.REQUIRED,
                  message: 'Please select a region',
                },
              ],
              options: regionOptions,
              initialValue: regionOptions.find((r) => r.value === region),
            },
            {
              component: componentTypes.SELECT,
              name: 'modelId',
              label: 'Large Language Model',
              placeholder: 'System prompt for the model.',
              resolveProps: async (_props, _field, formOptions) => {
                const region = formOptions.getState().values.bedrockRegion.value;
                setRegion(region);
              },
              validate: [
                {
                  type: validatorTypes.REQUIRED,
                  message: 'Please select a model',
                },
              ],
              options: availableModelOptions,
              initialValue: availableModelOptions.find(
                (r) => r.value === ((settings as PromptSettings)?.modelId ?? ''),
              ),
            },
            {
              component: componentTypes.TEXTAREA,
              name: 'systemPrompt',
              label: 'System prompt',
              rows: 7,
              placeholder: 'System prompt for the model.',
            },
            {
              component: componentTypes.CUSTOM,
              CustomComponent: TemplateEditorFormField,
              name: 'gradingPrompt',
              label: 'Grading prompt template',
              placeholder: 'Grading prompt template',
              helperText: (
                <>
                  <strong>Note:</strong>
                  <ul>
                    <li>
                      <strong>{'{{qn}}'}</strong> will be replaced by the task of the
                      assignment.
                    </li>
                    <li>
                      <strong>{'{{criteria_desc}}'}</strong> will be replaced with the
                      description of the criteria (in the rubric) to be tested.
                    </li>
                    <li>
                      <strong>{'{{band_scores}}'}</strong> will be replaced with the bands
                      and their scores.
                    </li>
                  </ul>
                </>
              ),
            },
          ],
        }}
      />
    </Box>
  );
};

export default PromptSettingsForm;
