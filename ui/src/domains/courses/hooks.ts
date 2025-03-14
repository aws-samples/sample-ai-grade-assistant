import { useQuery } from 'react-query';

import { CourseService } from './service';

export const useGetCourses = () => {
  return useQuery({
    queryKey: ['courses'],
    queryFn: async () => await new CourseService().getCourses(),
  });
};
