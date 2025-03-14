import { KeyValuePair } from '@aws-northstar/ui';
import {
  Container,
  ContentLayout,
  Header,
  SpaceBetween,
} from '@cloudscape-design/components';
import { useEffect } from 'react';
import { useRecoilState } from 'recoil';

import { submissionsStateAtom } from '../../../atoms';
import { useBreadcrumb } from '../../../hooks/useBreadcrumb';
import AssignmentDropdown from '../../assignments/components/AssignmentDropdown';
import CourseDropdown from '../../courses/components/CourseDropdown';
import SubmissionsTable from '../components/SubmissionsTable';

export const ListSubmissions = () => {
  const setBreadcrumb = useBreadcrumb();

  // global state using recoil
  const [submissionsState, setSubmissionsState] = useRecoilState(submissionsStateAtom);
  const { courseId, assignmentId } = submissionsState;

  const init = async () => {
    setBreadcrumb([
      { text: 'Home', href: '/' },
      { text: 'Submissions', href: '/submissions' },
    ]);
  };

  const onChangeCourse = (courseId: number | null) => {
    setSubmissionsState({
      ...submissionsState,
      courseId,
    });
  };

  const onChangeAssignment = (assignmentId: number | null) => {
    setSubmissionsState({
      ...submissionsState,
      assignmentId,
    });
  };

  useEffect(() => {
    init();
  }, []);

  return (
    <ContentLayout
      header={
        <Header variant="h1" description="Manage your submissions here">
          Submissions
        </Header>
      }
    >
      <SpaceBetween size="l">
        <Container header={<Header variant="h2">Select an assignment</Header>}>
          <SpaceBetween size="m">
            <KeyValuePair
              label="Course"
              value={<CourseDropdown onChange={onChangeCourse} courseId={courseId} />}
            />
            {courseId && (
              <KeyValuePair
                label="Assignment"
                value={
                  <AssignmentDropdown
                    courseId={courseId}
                    onChange={onChangeAssignment}
                    assignmentId={assignmentId}
                  />
                }
              />
            )}
          </SpaceBetween>
        </Container>

        {courseId && assignmentId && (
          <SubmissionsTable courseId={courseId} assignmentId={assignmentId} />
        )}
      </SpaceBetween>
    </ContentLayout>
  );
};

export default ListSubmissions;
