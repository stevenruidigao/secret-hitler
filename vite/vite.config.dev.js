import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// import commonjs from '@rollup/plugin-commonjs';
// import path from 'path';

process.env.NODE_ENV = 'development';

export default defineConfig({
	// base: './',
	plugins: [
		react({
			jsxRuntime: 'classic'
		})
		// commonjs(),
	],
	build: {
		target: 'es2015',
		outDir: './vite-build/',
		rollupOptions: {
			input: './src/frontend-scripts/game-app.jsx', // Entry point
			output: {
				entryFileNames: 'scripts/bundle.js', // Output file name
				assetFileNames: 'assets/[name].[ext]'
			}
		},
		sourcemap: 'inline',
		commonjsOptions: {
			transformMixedEsModules: true
		}
		// watch: {
		//     chokidar: {
		//         usePolling: true, // for WSL
		//     },
		// },
	},
	css: {
		preprocessorOptions: {
			scss: {
				additionalData: '' // Inject global SCSS variables/mixins here if needed
			}
		}
	},
	resolve: {
		alias: {
			// '@': path.resolve(__dirname, 'src'), // Define aliases for cleaner imports
			'react-sweetalert2': './node_modules/react-sweetalert2/build/index.js'
		}
	},
	server: {
		// port: 3000, // Development server port
		// open: true, // Automatically open the app in the browser
	},
	esbuild: {}
});
