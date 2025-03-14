import { Assignment } from '../assignments/types';
import { Course } from '../courses/types';

// Nicely formatted interface for UI - Submission list page
export interface Submission {
  id: number;
  status: string;
  lastModified: Date;
  user: User;
}

// Nicely formatted interface specifically for UI - Submission details page
export interface SubmissionDetails {
  submissionId: number;
  assignmentId: number;
  lastModified: Date;
  status: string;
  gradingStatus: string;
  assignmentQuestion: string;
  submittedAnswer?: string;
  submittedDocument?: SubmittedDocument;
}

export interface SubmittedDocument {
  fileUrl: string;
  mimeType: string;
  fileName: string;
  fileSize: number;
  timeModified: number;
}

export interface FullSubmissionDetails {
  submission: SubmissionDetails;
  course: Course;
  assignment: Assignment;
  student: User;
}

interface User {
  id: number;
  username: string;
  name: string;
  email: string;
}

export interface RawSubmissionListApiResponse {
  id: number;
  userid: number;
  attemptnumber: number;
  timecreated: number;
  timemodified: number;
  timestarted: null | number;
  status: string;
  groupid: number;
  assignment: number;
  latest: number;
  plugins: Plugin[];
  user_details: RawUserDetails;
}

interface RawUserDetails {
  id: number;
  username: string;
  firstname: string;
  lastname: string;
  fullname: string;
  email: string;
  department: string;
  profileimageurlsmall: string;
}

export interface RawSubmissionDetails {
  gradingsummary: GradingSummary;
  lastattempt: LastAttempt;
  assignmentdata: AssignmentData;
  warnings: any[];
}

export interface RawSubmissionDetailsApiResponse {
  course: Course;
  assignment: Assignment;
  student: RawUserDetails;
  submission: RawSubmissionDetails;
}

interface GradingSummary {
  participantcount: number;
  submissiondraftscount: number;
  submissionsenabled: boolean;
  submissionssubmittedcount: number;
  submissionsneedgradingcount: number;
  warnofungroupedusers: string;
}

interface LastAttempt {
  submission: RawSubmissionListApiResponse;
  submissiongroupmemberswhoneedtosubmit: any[];
  submissionsenabled: boolean;
  locked: boolean;
  graded: boolean;
  canedit: boolean;
  caneditowner: boolean;
  cansubmit: boolean;
  extensionduedate: null | number;
  timelimit: number;
  blindmarking: boolean;
  gradingstatus: string;
  usergroups: any[];
}

interface Plugin {
  type: string;
  name: string;
  fileareas?: FileArea[];
  editorfields?: EditorField[];
}

interface FileArea {
  area: string;
  files: any[];
}

interface EditorField {
  name: string;
  description: string;
  text: string;
  format: number;
}

interface AssignmentData {
  attachments: {
    intro: any[];
    activity: any[];
  };
  activity: string;
  activityformat: number;
}

export interface GradingResponse {
  score: {
    criteria: {
      name: string;
      score: number;
      long_feedback: string;
      short_feedback: string;
      band: string;
    }[];
    general_feedback: string;
  };
  metrics: {
    input_tokens: string;
    output_tokens: string;
    bedrock_cost: string;
  };
}

export interface Grade {
  status: 'pending' | 'done' | 'error';
  message?: any;
  grade?: GradingResponse;
  lastUpdated: string;
}
