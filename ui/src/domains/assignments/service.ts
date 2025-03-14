import ApiProxy, { IApiProxy } from '../../helpers/ApiProxy';
import { convertAssignmentsApiResponse } from './helpers';
import { Assignment, RawAssignmentsApiResponse } from './types';

export class AssignmentService {
  private api: IApiProxy;

  constructor(apiProxy?: IApiProxy) {
    this.api = apiProxy ?? new ApiProxy();
  }

  async getAssignments(courseId: number): Promise<Assignment[]> {
    const response = await this.api.get<RawAssignmentsApiResponse>(
      `/assignments?course_id=${courseId}`,
    );

    const assignments = convertAssignmentsApiResponse(response);

    return assignments;
  }
}
