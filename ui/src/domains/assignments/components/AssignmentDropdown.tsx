import { Button, Select, SpaceBetween } from '@cloudscape-design/components';
import { useEffect, useState } from 'react';

import { useGetAssignments } from '../hooks';

type StatusType = 'finished' | 'loading' | 'error';

interface AssignmentDropdownProps {
  courseId: number;
  assignmentId?: number | null; // initial assignment id
  onChange: (assignmentId: number | null) => void;
}

const AssignmentDropdown = ({
  courseId,
  onChange,
  assignmentId = null,
}: AssignmentDropdownProps) => {
  // local state
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<number | null>(
    assignmentId,
  );

  // get assignments (via api) hook
  const { data: assignments, isError, isFetching, refetch } = useGetAssignments(courseId);

  const options = (isFetching ? [] : assignments || []).map((assignment) => ({
    label: assignment.name,
    value: assignment.id.toString(),
  }));

  // calculate selected option - use local state, or fallback to initial state
  let selectedOption;
  if (selectedAssignmentId) {
    selectedOption = options.find((o) => o.value === selectedAssignmentId.toString());
  } else if (assignmentId) {
    selectedOption = options.find((o) => o.value === assignmentId.toString());
  }

  let statusType: StatusType = 'finished';

  if (isFetching) {
    statusType = 'loading';
  } else if (isError) {
    statusType = 'error';
  }

  useEffect(() => {
    // clear selection when refreshing list
    if (isFetching) {
      setSelectedAssignmentId(null);
      onChange(null);
    }
  }, [isFetching]);

  return (
    <SpaceBetween direction="horizontal" size="s" alignItems="center">
      <Select
        data-select
        selectedOption={selectedOption ?? null}
        options={options}
        onChange={({ detail }) => {
          const id = detail.selectedOption.value
            ? parseInt(detail.selectedOption.value)
            : null;

          setSelectedAssignmentId(id);
          onChange(id);
        }}
        placeholder="Choose a assignment"
        loadingText="Loading assignments..."
        empty="No assignments found"
        errorText="Couldn't fetch assignments for this course"
        filteringType="auto"
        statusType={statusType}
      />
      <Button
        iconName="refresh"
        variant="inline-icon"
        onClick={async () => await refetch()}
      />
    </SpaceBetween>
  );
};

export default AssignmentDropdown;
