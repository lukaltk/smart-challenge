"use strict";

const { execSync } = require('child_process');


const cachePath = '../data/temp.csv'
const pythonScript = '../lib/utils.py'

module.exports = {
	name: "heart-analysis",

	actions: {
		analysis: {
			params: {
				pythonParams: 'array'
			},

			async handler(ctx) {

				const pythonAnalysis = execSync(`python ${pythonScript} run ${cachePath} ${ctx.params.pythonParams[0]} ${ctx.params.pythonParams[1]}`).toString().slice(1, -3).split(', ');

				this.logger.info(pythonAnalysis);
				ctx.emit('analysisResult', { status: Number(pythonAnalysis[2]) });

			}
		}
	}
};
