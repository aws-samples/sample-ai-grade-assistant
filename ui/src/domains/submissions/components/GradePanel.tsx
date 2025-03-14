import { Table } from '@aws-northstar/ui';
import {
  Alert,
  Box,
  Button,
  Container,
  ExpandableSection,
  Header,
  SpaceBetween,
  Spinner,
  StatusIndicator,
} from '@cloudscape-design/components';
//import Modal from '@cloudscape-design/components/modal';
import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';

import Timeline from '../../../components/Timeline';
import { useGetGrade, useGradeSubmission, useUpdateGradeInMoodle } from '../hooks';

interface GradePanelProps {
  courseId: number;
  studentId: number;
  assignmentId: number;
}
const GradePanel = ({ courseId, studentId, assignmentId }: GradePanelProps) => {
  const [isFirstLoad, setFirstLoad] = useState(true);
  //const [showModal, setShowModal] = useState(false);

  // hook to get grade from db
  const {
    data: grade,
    isSuccess: isGradeLoaded,
    isFetching: isFetchingGrade,
    refetch: getGradeDetails,
  } = useGetGrade(studentId, assignmentId);

  // hook to submit to AI for grading
  const {
    mutateAsync: submitForGrading,
    isLoading: isSubmittingGrade,
    isSuccess: isGradingRequestSubmitted,
  } = useGradeSubmission();

  // hook to update grade in moodle
  const {
    mutateAsync: updateGradeInMoodle,
    isLoading: isUpdatingGrade,
    isError: isUpdatingGradeError,
    isSuccess: isGradeUpdated,
  } = useUpdateGradeInMoodle();

  const clickUpdateGrade = () => {
    updateGradeInMoodle({
      courseId,
      assignmentId,
      userId: studentId,
      grade: grade!.grade!,
    });
  };

  useEffect(() => {
    if (isGradingRequestSubmitted) {
      // start polling grade details from db
      getGradeDetails();
    }
  }, [isGradingRequestSubmitted]);

  useEffect(() => {
    if (isGradeLoaded) {
      setFirstLoad(false);
    }
  }, [isGradeLoaded]);

  const showGrade = !isFetchingGrade && !isSubmittingGrade && grade;

  const body = () => {
    if (isFirstLoad) {
      return (
        <SpaceBetween size="xs" direction="horizontal" alignItems="center">
          <Spinner />
          <Box>Loading grade...</Box>
        </SpaceBetween>
      );
    }

    if (isSubmittingGrade) {
      return (
        <SpaceBetween size="xs" direction="horizontal" alignItems="center">
          <Spinner />
          <Box>Submitting assignment for grading...</Box>
        </SpaceBetween>
      );
    }

    if (isGradingRequestSubmitted && isFetchingGrade) {
      return <Timeline activeStep={grade?.message} />;
    }

    if (isGradeLoaded && !grade) {
      return (
        <SpaceBetween size="m">
          <StatusIndicator type="info">
            This submission has not been graded yet.
          </StatusIndicator>
          <Button
            iconName="edit"
            onClick={() =>
              submitForGrading({ courseId, assignmentId, userId: studentId })
            }
          >
            Grade this submission
          </Button>
        </SpaceBetween>
      );
    }

    if (isGradeLoaded && grade) {
      if (grade.status === 'pending') {
        return <Timeline activeStep={grade.message} />;
      }

      if (grade.status === 'error') {
        return (
          <Alert type="error" header="Whoops! An error occured grading this submission">
            {grade.message}
          </Alert>
        );
      }

      if (grade.status === 'done') {
        return (
          <Box>
            <SpaceBetween size="l" direction="horizontal">
              <small data-helper-text>
                Input tokens: {Number(grade.grade!.metrics.input_tokens).toLocaleString()}
              </small>
              <small data-helper-text>
                Output tokens:{' '}
                {Number(grade.grade!.metrics.output_tokens).toLocaleString()}
              </small>
              <small data-helper-text>
                Estimated cost: {grade.grade!.metrics.bedrock_cost.toLocaleString()}
              </small>
            </SpaceBetween>
            <h3>General Feedback</h3>
            <Container>
              <div data-markdown>
                <ReactMarkdown>
                  {grade.grade!.score.general_feedback.trim()}
                </ReactMarkdown>
              </div>
            </Container>
            <h3>Scoring</h3>
            <Table
              stripedRows
              trackBy="name"
              columnDefinitions={[
                {
                  id: 'criteria',
                  header: 'Criteria',
                  sortingField: 'criteria',
                  cell: (criteria) => <strong>{criteria.name}</strong>,
                },
                // {
                //   id: 'long_feedback',
                //   header: 'Long Feedback',
                //   sortingField: 'long_feedback',
                //   cell: (criteria) => (
                //     <pre className="feedback">
                //       {criteria.long_feedback.replace(/^\n/, '')}
                //     </pre>
                //   ),
                // },
                {
                  id: 'short_feedback',
                  header: 'Feedback',
                  sortingField: 'short_feedback',
                  cell: (criteria) => (
                    <>
                      <pre className="feedback">
                        {criteria.short_feedback.replace(/^\n/, '')}
                      </pre>
                      <ExpandableSection
                        headerText="More details..."
                        headingTagOverride="h1"
                      >
                        <pre className="feedback">
                          {criteria.long_feedback.replace(/^\n/, '')}{' '}
                        </pre>
                      </ExpandableSection>
                      {/* <a
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setShowModal(true);
                        }}
                      >
                        Show more...
                      </a>
                      {showModal && (
                        <Modal
                          size="large"
                          header={'Feedback for criteria ' + criteria.name}
                          onDismiss={() => setShowModal(false)}
                          visible={showModal}
                        >
                          <pre className="feedback">
                            {criteria.long_feedback.replace(/^\n/, '')}
                          </pre>
                        </Modal>
                      )} */}
                    </>
                  ),
                },
                {
                  id: 'score',
                  header: 'Score',
                  sortingField: 'score',
                  cell: (criteria) => <h3>{criteria.score}</h3>,
                },
                {
                  id: 'band',
                  header: 'Band',
                  sortingField: 'band',
                  cell: (criteria) => (
                    <h3 style={{ textTransform: 'capitalize' }}>
                      {criteria.band.toLowerCase()}
                    </h3>
                  ),
                },
              ]}
              items={grade.grade!.score.criteria}
              disableRowSelect
            />
          </Box>
        );
      }
    }
  };

  const updatingGradePanel = () => {
    if (isUpdatingGrade) {
      return (
        <Container>
          <SpaceBetween size="xs" direction="horizontal" alignItems="center">
            <Spinner size="normal" />
            <Box>Updating grade in Moodle. Please wait...</Box>
          </SpaceBetween>
        </Container>
      );
    }

    if (!isUpdatingGrade && isUpdatingGradeError) {
      return (
        <Alert
          type="error"
          header="Sorry, could not update grade in Moodle at the moment."
        >
          Please try again.
        </Alert>
      );
    }

    if (isGradeUpdated) {
      return <Alert type="success">Grade updated in Moodle.</Alert>;
    }
  };

  return (
    <Container
      header={
        <Header
          variant="h2"
          description={
            <>
              {((isGradingRequestSubmitted && isFetchingGrade) ||
                (grade && grade.status === 'pending')) &&
                'Grading in progress...'}

              {showGrade && grade.status === 'done' && (
                <StatusIndicator type="success">Grading completed</StatusIndicator>
              )}
            </>
          }
          actions={
            <SpaceBetween size="xs" direction="horizontal">
              {showGrade && grade.status !== 'pending' && (
                <Button
                  iconName="edit"
                  onClick={() =>
                    submitForGrading({ courseId, assignmentId, userId: studentId })
                  }
                >
                  Grade again
                </Button>
              )}
              {showGrade && grade.status === 'done' && (
                <Button iconName="edit" onClick={clickUpdateGrade} disabled={false}>
                  Update in Moodle
                </Button>
              )}
            </SpaceBetween>
          }
        >
          AI Grading {showGrade && grade.status === 'done' && 'Result'}
        </Header>
      }
    >
      {updatingGradePanel()}
      {body()}
    </Container>
  );
};

export default GradePanel;
