"use strict";

const fs = require('fs');
const { execSync } = require('child_process');

const csvMixin = require('../mixins/csv.mixin');

const cachePath = './data/temp.csv';
const defaultEcgPath = './data/default.csv';

const id = 'test';
const pythonParams = [];

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

        if (!fs.existsSync(cachePath)) {
          ctx.emit('analysis', cachePath);
        } else {
          await this.saveEcg(data, cachePath);
        }

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

      async handler(ctx) {

        const pythonAnalysis = execSync(`python "./lib/utils.py" 2 ${path} ${pythonInit[0]} ${pythonInit[1]}`).toString().slice(1, -3).split(', ');
        console.log(pythonAnalysis);

        return pythonAnalysis;
      }
    },

    test: {
      async handler(ctx) {
        return pythonParams;
      }
    }
  },

  events: {
    analysis: {
      handler(ctx) {
        console.log('event was called');
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
  },

  async stopped() { }
};
