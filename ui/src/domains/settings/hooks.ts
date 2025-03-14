import { useMutation, useQuery, useQueryClient } from 'react-query';

import { SettingService } from './service';
import { Settings } from './types';

export const useGetSettings = (key: string) => {
  return useQuery({
    queryKey: ['settings', key],
    queryFn: async () => await new SettingService().getSettings(key),
  });
};

export const useGetAvailableModels = (region: string) => {
  return useQuery({
    queryKey: ['bedrock_model', region],
    queryFn: async () => await new SettingService().getAvailableBedrockModels(region),
  });
};

export const useUpdateSettings = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({ key, settings }: { key: string; settings: Settings }) =>
      await new SettingService().updateSettings(key, settings),
    onSettled: () => client.removeQueries({ queryKey: 'settings' }),
  });
};
