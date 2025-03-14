import { FieldInputProps } from '@aws-northstar/ui';
import { Box, FormField, Grid, SpaceBetween } from '@cloudscape-design/components';

import TemplateEditor from './TemplateEditor';

interface TemplateEditorFormFieldProps {
  input: FieldInputProps<HTMLInputElement>;
  data: Record<string, object>;
  label?: string;
  description?: string;
  showError: boolean;
  helperText?: string;
  meta: {
    error: string | undefined;
  };
}

/**
 * This component wraps the template editor so it can be used
 * within a form using @aws-northstar FormRenderer
 */
const TemplateEditorFormField = ({
  input,
  showError,
  label,
  description,
  helperText,
  meta: { error },
}: TemplateEditorFormFieldProps) => {
  return (
    <SpaceBetween size="xxs">
      <FormField label={label} description={description} />
      <Grid
        gridDefinition={[
          { colspan: { default: 12, xs: 8 } },
          { colspan: { default: 12, xs: 4 } },
        ]}
      >
        <TemplateEditor
          onChange={input.onChange}
          value={input.value as unknown as string}
        />
        <Box data-helper-text>{helperText}</Box>
      </Grid>
      <FormField errorText={showError && error}></FormField>
    </SpaceBetween>
  );
};

export default TemplateEditorFormField;
