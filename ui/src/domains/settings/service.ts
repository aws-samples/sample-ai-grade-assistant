import ApiProxy, { IApiProxy } from '../../helpers/ApiProxy';
import { AvailableModels, Settings } from './types';

export class SettingService {
  private api: IApiProxy;

  constructor(apiProxy?: IApiProxy) {
    this.api = apiProxy ?? new ApiProxy();
  }
  async getSettings(key: string): Promise<Settings> {
    const settings = await this.api.get<Settings>(`/settings/${key}`);
    return settings;
  }

  async getAvailableBedrockModels(br_region: string): Promise<AvailableModels> {
    const availableModels = await this.api.get<AvailableModels>(
      `/list_bedrock_models?br_region=${br_region}`,
    );
    return availableModels;
  }
  async updateSettings(key: string, settings: Settings): Promise<void> {
    await this.api.put(`/settings/${key}`, settings);
  }
}
