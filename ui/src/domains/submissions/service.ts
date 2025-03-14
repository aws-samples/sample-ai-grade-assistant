import ApiProxy, { IApiProxy } from '../../helpers/ApiProxy';
import {
  convertSubmissionDetailsApiResponse,
  convertSubmissionListApiResponse,
} from './helpers';
import {
  FullSubmissionDetails,
  Grade,
  GradingResponse,
  RawSubmissionDetailsApiResponse,
  RawSubmissionListApiResponse,
  Submission,
} from './types';

export class SubmissionService {
  private api: IApiProxy;

  constructor(apiProxy?: IApiProxy) {
    this.api = apiProxy ?? new ApiProxy();
  }

  async getGrade(userId: number, assignmentId: number): Promise<Grade | undefined> {
    const response = await this.api.get<Grade | undefined>(
      `/grade?user_id=${userId}&assignment_id=${assignmentId}`,
    );

    return response;
  }

  async getSubmissions(assignmentId: number): Promise<Submission[]> {
    const response = await this.api.get<RawSubmissionListApiResponse[]>(
      `/submissions?assignment_id=${assignmentId}`,
    );

    const submissions = convertSubmissionListApiResponse(response);
    return submissions;
  }

  async getSubmissionDetails(
    courseId: number,
    assignmentId: number,
    userId: number,
  ): Promise<FullSubmissionDetails> {
    const apiResponse = await this.api.get<RawSubmissionDetailsApiResponse>(
      `/submission?assignment_id=${assignmentId}&user_id=${userId}&course_id=${courseId}`,
    );

    const submission = convertSubmissionDetailsApiResponse(apiResponse);
    return submission;
  }

  async gradeSubmission(
    courseId: number,
    assignmentId: number,
    userId: number,
  ): Promise<GradingResponse> {
    const response = await this.api.get<GradingResponse>(
      `/grade_assignment?course_id=${courseId}&assignment_id=${assignmentId}&user_id=${userId}`,
    );

    return response;
  }

  async updateGradeInMoodle(
    courseId: number,
    assignmentId: number,
    userId: number,
    grade: GradingResponse,
  ): Promise<void> {
    await this.api.post('/submit_grade', {
      course_id: courseId,
      assignment_id: assignmentId,
      user_id: userId,
      grade,
    });
  }
}
