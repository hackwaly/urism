const isTest = process.env.NODE_ENV === 'test';

module.exports = {
  presets: [
    [
      '@babel/env',
      {
        targets: isTest ? {
          node: 'current'
        } : undefined
      }
    ]
  ]
};
