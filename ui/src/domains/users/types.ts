export interface User {
  id: string;
  email: string;
  email_verified: boolean;
  name: string;
  date_created?: Date;
  date_last_modified?: Date;
}
