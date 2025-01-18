// import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import google from 'eslint-config-google';
import react from 'eslint-plugin-react';
import prettier from 'eslint-config-prettier';
// import babel from '@babel/eslint-parser';

export default tseslint.config(
	// eslint.configs.recommended,
	tseslint.configs.recommended,
	google,
	react.configs.flat.recommended,
	prettier,
	{
		name: 'SH',
		files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
		languageOptions: {
			// parser: babel,
			// parserOptions: {
			//     sourceType: 'module',
			//     ecmaVersion: 2018,
			//     ecmaFeatures: {
			//         jsx: true,
			//         modules: true,
			//     },
			// },
			globals: {
				io: true,
				app: true,
				document: true,
				window: true,
				expect: true,
				describe: true,
				it: true
			}
		},
		rules: {
			'linebreak-style': 'off',
			'eol-last': 'off',
			'max-len': 'off',
			'one-var': 'off',
			'no-use-before-define': [
				'warn',
				{
					functions: true,
					classes: true
				}
			],
			'no-warning-comments': 'off',
			'brace-style': 'off',
			'no-nested-ternary': 'off',
			'no-mixed-requires': 'off',
			'no-negated-condition': 'off',
			'no-tabs': 'off',
			camelcase: 'off',
			'new-cap': 'off',
			'no-mixed-spaces-and-tabs': 'off',
			'quote-props': 'off',
			'space-before-function-paren': 'off',
			'guard-for-in': 'off',
			'max-nested-callbacks': 'off',
			'no-unmodified-loop-condition': 'off',
			'comma-dangle': 'off',
			'require-jsdoc': 'off',
			'arrow-parens': 'off',
			'react/jsx-indent': 'off',
			'react/jsx-uses-vars': 'error',
			'react/jsx-uses-react': 'error',
			'react/jsx-indent-props': 'off',
			'react/no-unescaped-entities': 'off',
			'react/prop-types': 'off',
			'react/no-deprecated': 'off',
			'object-curly-spacing': 'off',
			'array-bracket-spacing': 'off',
			'no-invalid-this': 0,
			indent: 0,
			'@typescript-eslint/no-explicit-any': 'off',
			'@typescript-eslint/no-unused-vars': 'off',
			'@typescript-eslint/no-unsafe-function-type': 'off',
			'no-case-declarations': 'off'
		}
	}
);
