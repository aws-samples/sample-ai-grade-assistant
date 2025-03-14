import('ace-builds/src-noconflict/mode-handlebars');
import('ace-builds/src-noconflict/snippets/html');
import('ace-builds/css/theme/eclipse.css');
import('ace-builds/css/theme/cobalt.css');

import CodeEditor, { CodeEditorProps } from '@cloudscape-design/components/code-editor';
import { Mode } from '@cloudscape-design/global-styles';
import Ace from 'ace-builds/src-noconflict/ace';
import extLanguageToolsUrl from 'ace-builds/src-noconflict/ext-language_tools?url';
import themeCobaltUrl from 'ace-builds/src-noconflict/theme-cobalt?url';
import themeEclipseUrl from 'ace-builds/src-noconflict/theme-eclipse?url';
import { useEffect, useState } from 'react';

import { useAppContext } from '../AppContext/context';
import { i18nStrings } from './constants';

interface TemplateEditorProps {
  value: string;
  onChange: (value: string) => void;
}

const TemplateEditor = ({ value, onChange }: TemplateEditorProps) => {
  const { theme: appTheme } = useAppContext();

  const themes: CodeEditorProps.AvailableThemes = {
    light: ['eclipse'],
    dark: ['cobalt'],
  };

  const getTheme = () => {
    return (
      appTheme === Mode.Dark ? themes.dark[0] : themes.light[0]
    ) as CodeEditorProps.Theme;
  };

  const [preferences, setPreferences] = useState<CodeEditorProps.Preferences>({
    theme: getTheme(),
    wrapLines: true,
  });

  const [loading, setLoading] = useState(true);
  const [ace, setAce] = useState<unknown>();

  useEffect(() => {
    async function loadAce() {
      const ace = await Ace;
      ace.config.setModuleUrl('ace/theme/eclipse', themeEclipseUrl);
      ace.config.setModuleUrl('ace/theme/cobalt', themeCobaltUrl);
      ace.config.setModuleUrl('ace/ext/language_tools', extLanguageToolsUrl);
      ace.config.set('useStrictCSP', true);
      ace.config.set('tabSize', 2);
      ace.config.set('showPrintMargin', false);
      return ace;
    }

    loadAce()
      .then((ace) => setAce(ace))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    onChange(value);
  }, [value]);

  useEffect(() => {
    setPreferences({
      ...preferences,
      theme: getTheme(),
    });
  }, [appTheme]);

  return (
    <>
      <CodeEditor
        data-code-editor
        ace={ace}
        value={value}
        language="handlebars"
        onDelayedChange={(event) => onChange(event.detail.value)}
        preferences={preferences}
        onPreferencesChange={(event) => setPreferences(event.detail)}
        loading={loading}
        i18nStrings={i18nStrings}
        themes={themes}
      />
    </>
  );
};

export default TemplateEditor;
