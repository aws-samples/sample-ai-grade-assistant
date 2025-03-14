import { Assignment, RawAssignmentsApiResponse } from './types';

export const convertAssignmentsApiResponse = (
  apiResponse: RawAssignmentsApiResponse,
): Assignment[] => {
  const course = apiResponse.courses[0];

  const assignments: Assignment[] = course.assignments.map(
    (assignment: { id: number; name: string }) => ({
      id: assignment.id,
      name: assignment.name,
    }),
  );

  return assignments;
};
