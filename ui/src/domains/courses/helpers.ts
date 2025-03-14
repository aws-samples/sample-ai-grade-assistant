import { Course, RawCourseApiResponse } from './types';

export const convertCoursesApiResponse = (
  apiResponse: RawCourseApiResponse[],
): Course[] => {
  const courses: Course[] = apiResponse.map((course) => ({
    id: course.id,
    name: course.fullname,
  }));

  return courses;
};
