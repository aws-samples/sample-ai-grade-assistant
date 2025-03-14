import { atom } from 'recoil';

interface SubmissionState {
  courseId: number | null;
  assignmentId: number | null;
}

export const submissionsStateAtom = atom<SubmissionState>({
  key: 'submissionsState',
  default: {
    courseId: null,
    assignmentId: null,
  },
});
