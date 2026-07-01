import 'leaflet/dist/leaflet.css'
import '../styles/globals.css'
import Script from 'next/script'

const GOOGLE_TAG_ID = 'G-989XMRNC6Y'

export default function App({ Component, pageProps }) {
  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_TAG_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-tag" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());

          gtag('config', '${GOOGLE_TAG_ID}');
        `}
      </Script>
      <Component {...pageProps} />
    </>
  )
}
