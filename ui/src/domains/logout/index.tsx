import {
  AppLayout,
  Box,
  Button,
  Container,
  SpaceBetween,
} from '@cloudscape-design/components';

export const Logout = () => {
  return (
    <AppLayout
      navigationHide
      toolsHide
      content={
        <Box margin={{ top: 'l' }}>
          <Container>
            <SpaceBetween size="s">
              <Box textAlign="center">
                <strong>Thank you, you have been logged out successfully</strong>
              </Box>
              <Box textAlign="center">
                <Button href="/">Login</Button>
              </Box>
            </SpaceBetween>
          </Container>
        </Box>
      }
    />
  );
};

export default Logout;
