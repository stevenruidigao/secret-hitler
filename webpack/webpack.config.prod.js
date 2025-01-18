import path from 'path';
import TerserPlugin from 'terser-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import Dotenv from 'dotenv-webpack';

const extractSass =
	process.env.NODE_ENV !== 'development'
		? new MiniCssExtractPlugin({
				filename: '../styles/style-main.css'
		  })
		: undefined;

process.env.NODE_ENV = 'production';

export default {
	entry: './src/frontend-scripts/game-app.tsx',
	output: {
		filename: `bundle.js`,
		path: path.resolve(import.meta.dirname, '../public/scripts')
	},
	plugins: [
		extractSass,
		new Dotenv({
			path: path.resolve(import.meta.dirname, '..', '.env')
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
