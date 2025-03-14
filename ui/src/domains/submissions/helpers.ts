import {
  FullSubmissionDetails,
  RawSubmissionDetails,
  RawSubmissionDetailsApiResponse,
  RawSubmissionListApiResponse,
  Submission,
  SubmissionDetails,
  SubmittedDocument,
} from './types';

export const extractSubmissionAnswer = (
  apiResponse: RawSubmissionDetails,
): string | undefined => {
  let submittedAnswer;

  const submittedAnswerPlugin = apiResponse.lastattempt.submission.plugins.find(
    (x) => x.type === 'onlinetext',
  );

  if (submittedAnswerPlugin) {
    const submittedAnswerEditorField = submittedAnswerPlugin.editorfields?.find(
      (x) => x.name === 'onlinetext',
    );

    if (submittedAnswerEditorField) {
      submittedAnswer = submittedAnswerEditorField.text;
    }
  }

  return submittedAnswer;
};

export const extractSubmissionDocument = (
  apiResponse: RawSubmissionDetails,
): SubmittedDocument | undefined => {
  const submittedDocumentPlugin = apiResponse.lastattempt.submission.plugins.find(
    (x) => x.type === 'file',
  );

  if (submittedDocumentPlugin) {
    const submittedDocumentFiles = submittedDocumentPlugin.fileareas?.find(
      (x) => x.area === 'submission_files',
    );

    if (submittedDocumentFiles && submittedDocumentFiles.files.length > 0) {
      const firstFile = submittedDocumentFiles.files[0];
      return {
        fileUrl: firstFile.fileurl,
        mimeType: firstFile.mimetype,
        fileName: firstFile.filename,
        fileSize: firstFile.filesize,
        timeModified: firstFile.timemodified,
      };
    }
  }

  return undefined;
};

export const convertSubmissionDetails = (
  apiResponse: RawSubmissionDetails,
): SubmissionDetails => {
  const submissionDetails: SubmissionDetails = {
    submissionId: apiResponse.lastattempt.submission.id,
    assignmentId: apiResponse.lastattempt.submission.assignment,
    lastModified: new Date(apiResponse.lastattempt.submission.timemodified * 1000),
    status: apiResponse.lastattempt.submission.status,
    gradingStatus: apiResponse.lastattempt.gradingstatus,
    assignmentQuestion: apiResponse.assignmentdata.activity,
    submittedAnswer: extractSubmissionAnswer(apiResponse),
    submittedDocument: extractSubmissionDocument(apiResponse),
  };
  return submissionDetails;
};

export const convertSubmissionDetailsApiResponse = ({
  submission,
  course,
  student,
  assignment,
}: RawSubmissionDetailsApiResponse): FullSubmissionDetails => {
  const details: FullSubmissionDetails = {
    course,
    assignment,
    student: {
      id: student.id,
      username: student.username,
      name: student.fullname,
      email: student.email,
    },
    submission: convertSubmissionDetails(submission),
  };
  return details;
};

export const convertSubmissionListApiResponse = (
  apiResponse: RawSubmissionListApiResponse[],
): Submission[] => {
  const submissions: Submission[] = apiResponse.map((s) => ({
    id: s.id,
    lastModified: new Date(s.timemodified * 1000),
    status: s.status,
    user: {
      id: s.user_details.id,
      username: s.user_details.username,
      name: s.user_details.fullname,
      email: s.user_details.email,
    },
  }));

  return submissions;
};
