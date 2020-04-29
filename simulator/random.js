
module.exports = {

  linear: function(min, max) {
    if(min instanceof Array) {
      max = min[1];
      min = min[0];
    }
    return Math.round((Math.random() * (max - min) + min) * 100) / 100;
  },

  gaussian: function(min, max) {
    if(min instanceof Array) {
      max = min[1];
      min = min[0];
    }
    return Math.round((((Math.random() + Math.random()) / 2) * (max - min) + min) * 100) / 100;
  }

};
