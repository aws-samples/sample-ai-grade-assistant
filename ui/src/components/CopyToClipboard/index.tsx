import { Box, Button, Popover, StatusIndicator } from '@cloudscape-design/components';

interface CopyToClipboardProps {
  label?: string;
  copyMessage?: string;
  hoverMessage?: string;
  content: string;
}

export const CopyToClipboard = ({
  label,
  copyMessage = 'Copied!',
  hoverMessage = 'Copy to clipboard',
  content,
}: CopyToClipboardProps) => {
  return (
    <Box display="inline-block">
      <Popover
        size="small"
        position="top"
        triggerType="custom"
        dismissButton={false}
        content={<StatusIndicator type="success">{copyMessage}</StatusIndicator>}
      >
        <Button
          variant="link"
          iconName="copy"
          ariaLabel={hoverMessage || 'Copy to clipboard'}
          onClick={() => {
            navigator.clipboard.writeText(content);
          }}
        >
          {label}
        </Button>
      </Popover>
    </Box>
  );
};

export default CopyToClipboard;
