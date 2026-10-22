import Head from 'next/head';
import dynamic from 'next/dynamic';

// The whole app runs in the browser (hash routes like /#/studio, localStorage, iframes, canvas),
// so it is loaded on the client only.
const Root = dynamic(() => import('../src/app/Root.jsx'), { ssr: false, loading: () => <div className="boot" aria-label="Loading" /> });

// What Google, WhatsApp, LinkedIn and X show for the site — written in the words people search with.
const SITE = 'https://monofolio.in';
const TITLE = 'Monofolio — Free Portfolio Website & Resume Builder';
const DESCRIPTION = 'Make your portfolio website and an ATS-friendly resume in minutes. Free for developers: portfolio maker, resume builder, ATS checker and cover letters.';
const LD = {
  '@context': 'https://schema.org',
  '@graph': [
    { '@type': 'Organization', '@id': `${SITE}/#org`, name: 'Monofolio', url: `${SITE}/`, logo: `${SITE}/icon-512.png` },
    { '@type': 'WebSite', name: 'Monofolio', url: `${SITE}/`, publisher: { '@id': `${SITE}/#org` } },
    {
      '@type': 'WebApplication',
      name: 'Monofolio',
      url: `${SITE}/`,
      description: DESCRIPTION,
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Any (web browser)',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' },
      featureList: ['Portfolio website builder', 'Resume builder with ATS-friendly templates', 'ATS resume checker', 'Cover letter generator', 'GitHub profile README generator', 'Developer card'],
      publisher: { '@id': `${SITE}/#org` },
    },
  ],
};

export default function Home() {
  return (
    <>
      <Head>
        <title>{TITLE}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="description" content={DESCRIPTION} />
        <meta name="keywords" content="portfolio website, free portfolio maker, portfolio builder, resume builder, free resume builder, ATS resume, ATS checker, cover letter, GitHub README generator, developer portfolio" />
        <link rel="canonical" href={`${SITE}/`} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Monofolio" />
        <meta property="og:url" content={`${SITE}/`} />
        <meta property="og:title" content={TITLE} />
        <meta property="og:description" content={DESCRIPTION} />
        <meta property="og:image" content={`${SITE}/og-image.png`} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="Monofolio — free portfolio website and resume builder" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={TITLE} />
        <meta name="twitter:description" content={DESCRIPTION} />
        <meta name="twitter:image" content={`${SITE}/og-image.png`} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(LD) }} />
      </Head>
      <Root />
    </>
  );
}
