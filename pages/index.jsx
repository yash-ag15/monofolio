import Head from 'next/head';
import dynamic from 'next/dynamic';

// The whole app runs in the browser (hash routes like /#/studio, localStorage, iframes, canvas),
// so it is loaded on the client only.
const Root = dynamic(() => import('../src/app/Root.jsx'), { ssr: false, loading: () => <div className="boot" aria-label="Loading" /> });

export default function Home() {
  return (
    <>
      <Head>
        <title>Monofolio — Developer Identity Studio</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      <Root />
    </>
  );
}
