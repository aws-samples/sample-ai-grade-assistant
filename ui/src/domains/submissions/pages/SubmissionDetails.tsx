import {
  Alert,
  Box,
  Container,
  ContentLayout,
  Header,
  SpaceBetween,
  Spinner,
} from '@cloudscape-design/components';
import { useEffect } from 'react';
import { useParams } from 'react-router-dom';

import { useBreadcrumb } from '../../../hooks/useBreadcrumb';
import GradePanel from '../components/GradePanel';
import SubmissionAnswer from '../components/SubmissionAnswer';
import SubmissionSummary from '../components/SubmissionSummary';
import { useGetSubmissionDetails } from '../hooks';

export const Submission = () => {
  const setBreadcrumb = useBreadcrumb();
  const { courseId, assignmentId, studentId } = useParams();

  // hook to get submission details
  const { data: submission, isFetching } = useGetSubmissionDetails(
    courseId,
    assignmentId,
    studentId,
  );

  const init = () => {
    setBreadcrumb([
      { text: 'Home', href: '/' },
      { text: 'Submissions', href: '/submissions' },
      { text: 'Submission Details', href: '#' },
    ]);
  };

  useEffect(() => {
    init();
  }, []);

  if (isFetching) {
    return (
      <ContentLayout header={<Header variant="h1">Submission details</Header>}>
        <Container>
          <SpaceBetween size="xs" direction="horizontal" alignItems="center">
            <Spinner size="big" />
            <Box>Loading...</Box>
          </SpaceBetween>
        </Container>
      </ContentLayout>
    );
  }

  if (!submission) {
    return (
      <Alert type="error" header="Error fetching submission data">
        Something went wrong fetching this particular submission. Please refresh and try
        again.
      </Alert>
    );
  }

  return (
    <ContentLayout
      header={
        <Header
          variant="h1"
          description={`Submission details for assignment submission #${submission.submission.submissionId}`}
        >
          Submission details
        </Header>
      }
    >
      {submission && (
        <SpaceBetween size="l">
          <SubmissionSummary submission={submission} />

          <GradePanel
            courseId={courseId}
            studentId={studentId}
            assignmentId={assignmentId}
          />

          <Container header={<Header variant="h2">Submission Details</Header>}>
            <h3>Assignment Question</h3>
            <Container>
              {/* strip out empty <p> tags + last <br /> from question using regex */}
              <div
                className="scroller"
                dangerouslySetInnerHTML={{
                  __html: submission.submission.assignmentQuestion
                    .replace(/<p[^>]*>\s*<\/p>/g, '')
                    .replace(/<br\s*\/>\s*$/, ''),
                }}
              />
            </Container>

            <br />

            <h3 className="mb-0">Student Submission</h3>
            <SubmissionAnswer submission={submission} />
          </Container>
        </SpaceBetween>
      )}
    </ContentLayout>
  );
};

export default Submission;
