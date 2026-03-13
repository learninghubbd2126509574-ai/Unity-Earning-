export type SubmissionStatus = 'Pending' | 'Approved' | 'Rejected';

export interface UserInfo {
  fullName: string;
  whatsappNumber: string;
  uid: string;
}

export interface TaskSubmission {
  taskId: number;
  content: string;
}

export interface Submission {
  id: string;
  userInfo: UserInfo;
  tasks: TaskSubmission[];
  status: SubmissionStatus;
  submittedAt: string;
  rejectionReason?: string;
}

export interface TypingTask {
  id: number;
  title: string;
  text: string;
}
