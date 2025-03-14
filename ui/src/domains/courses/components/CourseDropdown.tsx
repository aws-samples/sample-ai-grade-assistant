import { Button, Select, SpaceBetween } from '@cloudscape-design/components';
import { useState } from 'react';

import { useGetCourses } from '../hooks';

type StatusType = 'finished' | 'loading' | 'error';

interface CourseDropdownProps {
  courseId?: number | null; // initial course id
  onChange: (courseId: number | null) => void;
}

const CourseDropdown = ({ onChange, courseId = null }: CourseDropdownProps) => {
  // local state
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(courseId);

  // get courses (via api) hook
  const { data: courses, isError, isFetching, refetch } = useGetCourses();

  const options = (isFetching ? [] : courses || []).map((course) => ({
    label: course.name,
    value: course.id.toString(),
  }));

  // calculate selected option - use local state, or fallback to initial state
  let selectedOption;
  if (selectedCourseId) {
    selectedOption = options.find((o) => o.value === selectedCourseId.toString());
  } else if (courseId) {
    selectedOption = options.find((o) => o.value === courseId.toString());
  }

  let statusType: StatusType = 'finished';

  if (isFetching) {
    statusType = 'loading';
  } else if (isError) {
    statusType = 'error';
  }

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

          setSelectedCourseId(id);
          onChange(id);
        }}
        placeholder="Choose a course"
        loadingText="Loading courses..."
        empty="No courses found"
        errorText="Error fetching courses"
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

export default CourseDropdown;
