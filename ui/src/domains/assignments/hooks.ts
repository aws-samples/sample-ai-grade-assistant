import { useQuery } from 'react-query';

import { AssignmentService } from './service';

export const useGetAssignments = (courseId: number) => {
  return useQuery({
    queryKey: ['assignments', courseId],
    queryFn: async () => await new AssignmentService().getAssignments(courseId),
  });
};
