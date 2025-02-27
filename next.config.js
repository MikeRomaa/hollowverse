const { withSentryConfig } = require('@sentry/nextjs');
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const nextJsConfig = {
  reactStrictMode: true,

  images: {
    domains: [
      'cdn.sanity.io',
      'encrypted-tbn0.gstatic.com',
      'encrypted-tbn1.gstatic.com',
      'encrypted-tbn2.gstatic.com',
      'encrypted-tbn3.gstatic.com',
      'encrypted-tbn4.gstatic.com',
      'encrypted-tbn5.gstatic.com',
      'encrypted-tbn6.gstatic.com',
      'encrypted-tbn7.gstatic.com',
      'encrypted-tbn8.gstatic.com',
      'encrypted-tbn9.gstatic.com',
    ],
  },

  webpack: (config) => {
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });

    return config;
  },

  i18n: {
    locales: ['en'],
    defaultLocale: 'en',
  },
};

const sentryWebpackPluginOptions = {
  // Additional config options for the Sentry Webpack plugin. Keep in mind that
  // the following options are set automatically, and overriding them is not
  // recommended:
  //   release, url, org, project, authToken, configFile, stripPrefix,
  //   urlPrefix, include, ignore

  silent: true, // Suppresses all logs
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options.
};

module.exports = withBundleAnalyzer(nextJsConfig);

// module.exports = withSentryConfig(
//   withBundleAnalyzer(nextJsConfig),
//   sentryWebpackPluginOptions,
// );
