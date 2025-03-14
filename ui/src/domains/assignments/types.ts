export interface Assignment {
  id: number;
  name: string;
}

export interface RawAssignmentsApiResponse {
  courses: Course[];
  warnings: any[];
}

interface AssignmentConfig {
  plugin: string;
  subtype: string;
  name: string;
  value: string;
}

interface RawAssignment {
  id: number;
  cmid: number;
  course: number;
  name: string;
  nosubmissions: number;
  submissiondrafts: number;
  sendnotifications: number;
  sendlatenotifications: number;
  sendstudentnotifications: number;
  duedate: number;
  allowsubmissionsfromdate: number;
  grade: number;
  timemodified: number;
  completionsubmit: number;
  cutoffdate: number;
  gradingduedate: number;
  teamsubmission: number;
  requireallteammemberssubmit: number;
  teamsubmissiongroupingid: number;
  blindmarking: number;
  hidegrader: number;
  revealidentities: number;
  attemptreopenmethod: string;
  maxattempts: number;
  markingworkflow: number;
  markingallocation: number;
  requiresubmissionstatement: number;
  preventsubmissionnotingroup: number;
  configs: AssignmentConfig[];
  intro: string;
  introformat: number;
  introfiles: any[];
  introattachments: any[];
  activity: string;
  activityformat: number;
  activityattachments: any[];
  timelimit: number;
  submissionattachments: number;
}

interface Course {
  id: number;
  fullname: string;
  shortname: string;
  timemodified: number;
  assignments: RawAssignment[];
}
