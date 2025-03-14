import { useMutation, useQuery, useQueryClient } from 'react-query';

import { UserService } from './service';

export const useGetUsers = () => {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => await new UserService().getUsers(),
  });
};

export const useDeleteUsers = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (userIds: string[]) => await new UserService().deleteUsers(userIds),
    onSettled: () => client.removeQueries({ queryKey: 'users' }),
  });
};
