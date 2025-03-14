import { KeyValuePair } from '@aws-northstar/ui';
import {
  ColumnLayout,
  Container,
  Header,
  SpaceBetween,
  StatusIndicator,
} from '@cloudscape-design/components';

import { FullSubmissionDetails } from '../types';

interface SubmissionSummaryProps {
  submission: FullSubmissionDetails;
}
const SubmissionSummary = ({ submission }: SubmissionSummaryProps) => {
  return (
    <Container header={<Header variant="h2">Overview</Header>}>
      <ColumnLayout columns={4} variant="text-grid">
        <KeyValuePair
          label="Student"
          value={
            <>
              <div>{submission.student.name}</div>
              <small>{submission.student.email}</small>
            </>
          }
        />
        <SpaceBetween size="s">
          <KeyValuePair
            label="Assignment"
            value={
              <>
                <div>{submission.assignment.name}</div>
                <small>{submission.course.name}</small>
              </>
            }
          />
        </SpaceBetween>
        {submission.submission.status === 'submitted' && (
          <KeyValuePair
            label="Status"
            value={<StatusIndicator type="success">Submitted</StatusIndicator>}
          />
        )}
        {submission.submission.status === 'new' && (
          <KeyValuePair
            label="Status"
            value={<StatusIndicator type="warning">New</StatusIndicator>}
          />
        )}
        {submission.submission.gradingStatus === 'notgraded' && (
          <KeyValuePair
            label="Graded"
            value={<StatusIndicator type="warning">Not Graded Yet</StatusIndicator>}
          />
        )}
        {submission.submission.gradingStatus === 'graded' && (
          <KeyValuePair
            label="Graded"
            value={<StatusIndicator type="success">Graded</StatusIndicator>}
          />
        )}
      </ColumnLayout>
    </Container>
  );
};

export default SubmissionSummary;
