import react from '@vitejs/plugin-react';
import { defineConfig, UserConfig } from 'vite';

const config: UserConfig = {
  plugins: [react()],
  define: {
    global: {},
  },
  build: {
    chunkSizeWarningLimit: 3000,
    rollupOptions: {
      onwarn(warning, defaultHandler) {
        if (
          warning.code === 'UNRESOLVED_IMPORT' &&
          /file-loader\?esModule=false!\.\/src-noconflict\//.test(warning.message)
        ) {
          // Suppress the warning for ace-builds file-loader imports
          return;
        }

        // Handle other warnings as usual
        defaultHandler(warning);
      },
    },
  },
};

export default defineConfig(config);
