"use strict";

const fs = require('fs');
const { execSync } = require('child_process');

const csvMixin = require('../mixins/csv.mixin');

const cachePath = './data/temp.csv';
const defaultEcgPath = './data/default.csv';

const id = 'test';
const pythonParams = [];
let analysisFlag = false;
let cacheFlag = false;

const ecg = [];

/*
const path = './data/e0103.csv'
const path2 = './data/e0110.csv'
const path3 = './data/e0124.csv'
*/

module.exports = {
  name: 'heart-sensor',
  mixins: [csvMixin],

  settings: {},

  dependencies: ['ecg'],

  actions: {

    sendData: {
      rest: {
        method: 'POST',
        path: '/sendData'
      },
      params: {
        heartbeat: 'number',
        oximetry: 'number',
        ecg: 'array'
      },

      async handler(ctx) {

        const data = ctx.params.ecg.map(ecg => {
          return {
            heartbeat: ctx.params.heartbeat,
            oximetry: ctx.params.oximetry,
            ecg
          }
        });

        this.saveData(data);

        await this.saveEcg(data, cachePath);

        cacheFlag = true;
        ecg.push(...ctx.params.ecg);

        return data;
      }
    },

    calibrate: {
      rest: {
        method: 'POST',
        path: '/calibrate'
      },
      params: {
        ecg: 'array'
      },

      async handler(ctx) {

        const ecg = ctx.params.ecg.map(ecg => {
          return { ecg }
        });

        if (fs.existsSync(defaultEcgPath)) fs.rmSync(defaultEcgPath);

        await this.saveEcg(ecg, defaultEcgPath);

        const pythonInit = execSync(`python "./lib/utils.py" init ${defaultEcgPath}`).toString().slice(1, -3).split(', ');

        const data = {
          _id: id,
          min: pythonInit[0],
          max: pythonInit[1]
        }

        const isIdExists = (await ctx.call('ecg.find', { search: data._id, searchFields: ['_id'] })).length;

        if (isIdExists) {
          await ctx.call('ecg.update', data);
        } else {
          await ctx.call('ecg.create', data);
        }

        pythonParams[0] = pythonInit[0]
        pythonParams[1] = pythonInit[1];

        this.logger.info('Python init params:', pythonParams);

        return pythonInit;
      }
    },

    analysis: {
      rest: {
        method: 'GET',
        path: '/analysis'
      },

      async handler(ctx) {

        const ecgResult = [...ecg];
        ecg.length = 0;

        if (!analysisFlag && cacheFlag) {
          analysisFlag = true;
          try {
            ctx.call('heart-analysis.analysis', { pythonParams });

          } catch (error) {
            this.logger.error(error);
          }
        }

        return ecgResult;
      }
    }
  },

  events: {
    analysisResult: {
      handler(ctx) {
        this.logger.info('Analysis completed', ctx.params);

        if(ctx.params.status > 0 && ctx.params.status < 3) {
          ctx.emit('alert')
        } else if(ctx.params.status > 2) {
          ctx.emit('dangerous')
        }
    
        fs.rmSync(cachePath);
        cacheFlag = false;
        analysisFlag = false;
      }
    },

    alert: {
      handler(ctx) {
        this.logger.warn('Alerta');
      }
    },

    dangerous: {
      handler(ctx) {
        this.logger.warn('Perigo');
      }
    }
  },

  methods: {
    pythonParamsConfig(min, max) {
      if (pythonInitParams.length > 0) pythonInitParams.length = 0;
      pythonInitParams.push(...[min, max]);
    }
  },

  async created() { },

  async started() {
    const data = await this.broker.call('ecg.find');
    if (data.length) {
      pythonParams.push(...[data[0].min, data[0].max]);
      this.logger.info('Python init params:', pythonParams);
    }
    cacheFlag = fs.existsSync(cachePath);
  },

  async stopped() { }
};
