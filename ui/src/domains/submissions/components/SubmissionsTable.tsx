import Table from '@aws-northstar/ui/components/Table';
import {
  Button,
  ButtonDropdown,
  SpaceBetween,
  StatusIndicator,
} from '@cloudscape-design/components';
import moment from 'moment';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useGetSubmissions } from '../hooks';
import { Submission } from '../types';

interface SubmissionsTableProps {
  courseId: number;
  assignmentId: number;
}

export const SubmissionsTable = ({ courseId, assignmentId }: SubmissionsTableProps) => {
  const navigate = useNavigate();
  const [selectedSubmissions, setSelectedSubmissions] = useState<Submission[]>([]);

  const { data: submissions, isFetching, refetch } = useGetSubmissions(assignmentId);

  const columnDefinitions = [
    {
      id: 'student_name',
      header: 'Student',
      sortingField: 'user_details.fullname',
      cell: (submission: Submission) => (
        <>
          <div>
            <Button
              variant="inline-link"
              onClick={() =>
                navigate(`/submission/${courseId}/${assignmentId}/${submission.user.id}`)
              }
            >
              {submission.user.name}
            </Button>
          </div>
          <div>
            <small>{submission.user.email}</small>
          </div>
        </>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      sortingField: 'status',
      cell: (submission: Submission) => (
        <>
          {submission.status === 'submitted' && (
            <StatusIndicator type="success">Submitted</StatusIndicator>
          )}
          {submission.status === 'new' && (
            <StatusIndicator type="warning">No submission</StatusIndicator>
          )}
        </>
      ),
    },
    {
      id: 'timemodified',
      header: 'Last modified',
      sortingField: 'timemodified',
      cell: (submission: Submission) => <>{moment(submission.lastModified).fromNow()}</>,
    },
  ];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSelectionChange = ({ detail }: { detail: any }) => {
    const submissions = detail.selectedItems as Submission[];
    setSelectedSubmissions(submissions);
  };

  return (
    <Table
      stripedRows
      trackBy="id"
      columnDefinitions={columnDefinitions}
      header="Submissions"
      totalItemsCount={(submissions || []).length}
      items={submissions || []}
      selectedItems={selectedSubmissions}
      onSelectionChange={handleSelectionChange}
      loading={isFetching}
      actions={
        <SpaceBetween direction="horizontal" size="s">
          <Button iconName="refresh" onClick={() => refetch()} disabled={isFetching} />
          <ButtonDropdown
            disabled={selectedSubmissions.length === 0}
            items={[{ text: 'Bulk Grade Submissions', id: 'bulk-grade' }]}
            onItemClick={({ detail }) => {
              if (detail.id === 'bulk-grade') {
                alert('Feature not implemented yet. Check back soon!');
              }
            }}
          >
            Actions
          </ButtonDropdown>
        </SpaceBetween>
      }
    />
  );
};

export default SubmissionsTable;
