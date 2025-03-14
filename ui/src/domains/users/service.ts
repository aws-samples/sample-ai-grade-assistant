import ApiProxy, { IApiProxy } from '../../helpers/ApiProxy';
import { User } from './types';

export class UserService {
  private api: IApiProxy;

  constructor(apiProxy?: IApiProxy) {
    this.api = apiProxy ?? new ApiProxy();
  }
  async getUsers(): Promise<User[]> {
    const users = await this.api.get<User[]>('/users');
    return users;
  }

  async deleteUsers(userIds: string[]): Promise<void> {
    console.log('TODO: Delete users', userIds);
    alert('This feature is not implemented yet. Check back soon!');
    /*
    for (const userId of userIds) {
      await this.api.delete(`/users/${userId}`);
    }
    */
  }
}
