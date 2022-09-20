module.exports = {
  rules: {
    'use-next-fetch-policy-with-cache-and-network': {
      create: function(context) {
        return {
          ObjectExpression(node) {
            if (
              node.properties
                .map(p => p.key && p.key.name)
                .includes('fetchPolicy')
            ) {
              const fetchPolicyValue = node.properties.find(
                p => p.key && p.key.name === 'fetchPolicy'
              ).value.value
              const hasNextFetchPolicy = node.properties
                .map(p => p.key && p.key.name)
                .includes('nextFetchPolicy')

              if (
                fetchPolicyValue === 'cache-and-network' &&
                !hasNextFetchPolicy
              ) {
                context.report(
                  node,
                  "Always define nextFetchPolicy when using fetchPolicy: 'cache-and-network'"
                )
              }
            }
          },
        }
      },
    },
  },
}
