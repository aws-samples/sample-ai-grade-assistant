import ApiProxy, { IApiProxy } from '../../helpers/ApiProxy';
import { convertCoursesApiResponse } from './helpers';
import { Course, RawCourseApiResponse } from './types';

export class CourseService {
  private api: IApiProxy;

  constructor(apiProxy?: IApiProxy) {
    this.api = apiProxy ?? new ApiProxy();
  }

  async getCourses(): Promise<Course[]> {
    const response = await this.api.get<RawCourseApiResponse[]>('/courses');
    const courses = convertCoursesApiResponse(response);
    return courses;
  }
}
