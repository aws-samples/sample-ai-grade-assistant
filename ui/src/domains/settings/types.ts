export interface GeneralSettings {
  applicationName: string;
  notificationEmail: string;
  LMS: string;
}

export interface MoodleSettings {
  moodleURL: string;
  moodleToken: string;
}
export interface PromptSettings {
  systemPrompt: string;
  gradingPrompt: string;
  bedrockRegion: string;
  modelId: string;
}

export type Settings = GeneralSettings | MoodleSettings | PromptSettings;

export interface AvailableModels {
  region: string;
  models: AvailableModel[];
}
export interface AvailableModel {
  modelName: string;
  modelId: string;
}

export interface SelectOption {
  value: string;
  label: string;
}
