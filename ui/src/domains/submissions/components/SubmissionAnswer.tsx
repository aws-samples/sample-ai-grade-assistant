import { Alert, Container, SpaceBetween } from '@cloudscape-design/components';
import moment from 'moment';

import { FullSubmissionDetails } from '../types';
import SubmissionAttachment from './SubmissionAttachment';

interface SubmissionAnswerProps {
  submission: FullSubmissionDetails;
}
const SubmissionAnswer = ({ submission }: SubmissionAnswerProps) => {
  return (
    <SpaceBetween size="s">
      <div>
        <div>
          <small>Submitted {moment(submission.submission.lastModified).fromNow()}</small>
        </div>
        <small>({moment(submission.submission.lastModified).format('lll')})</small>
      </div>
      {submission.submission.submittedAnswer ? (
        <Container>{submission.submission.submittedAnswer}</Container>
      ) : submission.submission.submittedDocument ? (
        <SubmissionAttachment
          submittedDocument={submission.submission.submittedDocument}
        />
      ) : (
        <Alert type="warning">Student has not submitted an answer yet.</Alert>
      )}
    </SpaceBetween>
  );
};

export default SubmissionAnswer;
