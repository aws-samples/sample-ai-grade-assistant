import { User } from '@aws-northstar/ui/components/AppLayout/components/NavHeader';
import * as Auth from 'aws-amplify/auth';

// Convert amplify user object to user object that can be passed to aws-northstar AppLayout
export const getCurrentUser = async (): Promise<User | undefined> => {
  const user = await Auth.fetchUserAttributes();
  if (user) {
    return {
      username: user.name!,
      email: user.email,
    };
  }
};

// Convert bytes (int) to formatted string e.g. 3.1 KB
export const formatBytes = (bytes: number): string => {
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  if (i === 0) return `${bytes} ${sizes[i]}`;
  return `${(bytes / 1024 ** i).toFixed(2)} ${sizes[i]}`;
};
