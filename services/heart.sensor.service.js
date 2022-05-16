"use strict";

module.exports = {
  name: 'heart-sensor',

  settings: {},

  dependencies: [],

  actions: {

    analysis: {
      rest: {
        method: 'POST',
        path: '/analysis'
      },
      params: {
        heartbeat: 'number',
        oximetry: 'number',
        ecg: 'string'
      },

      async handler(ctx) {
        return ctx.params;
      }
    }
  },


  events: {},

  methods: {},

  async created() { },

  async started() { },

  async stopped() { }
};
