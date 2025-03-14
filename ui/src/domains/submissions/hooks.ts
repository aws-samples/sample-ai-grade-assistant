import { useMutation, useQuery, useQueryClient } from 'react-query';

import { SubmissionService } from './service';
import { Grade, GradingResponse } from './types';

export const useGetSubmissions = (assignmentId: number) => {
  return useQuery({
    queryKey: ['submissions', assignmentId],
    queryFn: async () => await new SubmissionService().getSubmissions(assignmentId),
  });
};

export const useGetSubmissionDetails = (
  courseId: number,
  assignmentId: number,
  userId: number,
) => {
  return useQuery({
    queryKey: ['submissionDetails', courseId, assignmentId, userId],
    queryFn: async () =>
      await new SubmissionService().getSubmissionDetails(courseId, assignmentId, userId),
  });
};

export const useGetGrade = (userId: number, assignmentId: number) => {
  const queryKey = ['grade', userId, assignmentId];
  const client = useQueryClient();
  const cachedData = client.getQueryData<Grade>(queryKey);

  return useQuery({
    queryKey,
    refetchInterval: cachedData && cachedData.status === 'pending' ? 5000 : false,
    queryFn: async () => await new SubmissionService().getGrade(userId, assignmentId),
  });
};

export const useGradeSubmission = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({
      courseId,
      assignmentId,
      userId,
    }: {
      courseId: number;
      assignmentId: number;
      userId: number;
    }) => {
      await new SubmissionService().gradeSubmission(courseId, assignmentId, userId);
      return { courseId, assignmentId, userId };
    },
    onSettled: (data) => {
      const queryKey = ['grade', data!.userId, data!.assignmentId];
      client.invalidateQueries(queryKey);
    },
  });
};

export const useUpdateGradeInMoodle = () => {
  return useMutation({
    mutationFn: async ({
      courseId,
      assignmentId,
      userId,
      grade,
    }: {
      courseId: number;
      assignmentId: number;
      userId: number;
      grade: GradingResponse;
    }) => {
      await new SubmissionService().updateGradeInMoodle(
        courseId,
        assignmentId,
        userId,
        grade,
      );
    },
  });
};
