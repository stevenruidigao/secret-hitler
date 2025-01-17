const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const extractSass =
	process.env.NODE_ENV !== 'development'
		? new MiniCssExtractPlugin({
				filename: '../styles/style-main.css'
		  })
		: undefined;

const Dotenv = require('dotenv-webpack');

process.env.NODE_ENV = 'production';

module.exports = {
	entry: './src/frontend-scripts/game-app.tsx',
	output: {
		filename: `bundle.js`,
		path: path.resolve(__dirname, '../public/scripts')
	},
	plugins: [
		extractSass,
		new Dotenv({
			path: path.resolve(__dirname, '..', '.env')
		})
	].filter(plugin => plugin !== undefined),
	optimization: {
		minimizer: [
			new TerserPlugin({
				parallel: true,
				terserOptions: {
					mangle: false,
					keep_classnames: true,
					keep_fnames: true
				}
			})
		]
	},
	devtool: 'cheap-module-source-map',
	module: {
		rules: [
			{
				test: /\.(html)$/,
				use: {
					loader: 'html-loader',
					options: {
						attrs: [':data-src']
					}
				}
			},
			{
				test: /\.(png|svg|jpg|gif)$/,
				use: {
					loader: 'file-loader',
					options: {
						useRelativePath: true
					}
				}
			},
			{
				test: /\.m?(j|t)sx?$/,
				use: ['babel-loader'],
				exclude: /node_modules/
			},
			{
				test: /\.s?css$/,
				use: [
					extractSass ? MiniCssExtractPlugin.loader : 'style-loader',
					{
						loader: 'css-loader'
					},
					{
						loader: 'postcss-loader',
						options: {
							postcssOptions: {
								plugins: [
									[
										'cssnano',
										{
											preset: 'default',
											plugins: ['postcss-preset-env']
										}
									]
								]
							}
						}
					},
					{
						loader: 'sass-loader'
					}
				]
			}
		]
	},
	resolve: {
		alias: {
			'react-dom$': 'react-dom/profiling',
			'scheduler/tracing': 'scheduler/tracing-profiling'
		}
	}
};
