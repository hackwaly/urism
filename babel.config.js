module.exports = api => {
  const isTest = api.env('test')

  return {
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
  }
}
