import { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import Script from 'next/script';
import React, { useEffect } from 'react';
import { StaticPropsContextProvider } from '~/lib/pages/components/StaticPropsContextProvider';
import { gaPageView, GA_TRACKING_ID } from '~/lib/pages/utils/gtag';

export const App = ({ Component, pageProps }: AppProps) => {
  const router = useRouter();

  useEffect(() => {
    const handleRouteChange = (url: string) => {
      gaPageView(url);
    };

    router.events.on('routeChangeComplete', handleRouteChange);
    router.events.on('hashChangeComplete', handleRouteChange);

    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
      router.events.off('hashChangeComplete', handleRouteChange);
    };
  }, [router.events]);

  return (
    <>
      <Script
        src="https://cse.google.com/cse.js?cx=b70c7f6ba6a334ff2"
        strategy="lazyOnload"
      />
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`}
      />
      <Script
        id="gtag-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_TRACKING_ID}', {
              page_path: window.location.pathname,
            });
          `,
        }}
      />

      <StaticPropsContextProvider value={pageProps}>
        <Component {...pageProps} />
      </StaticPropsContextProvider>
    </>
  );
};
