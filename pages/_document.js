import { Html, Head, Main, NextScript } from 'next/document'

const GOOGLE_TAG_MANAGER_ID = 'GTM-N27PQGL2'

export default function Document() {
  return (
    <Html lang="th">
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Prompt:wght@200;300;400;500;600;700&display=swap" rel="stylesheet" />

        {/*
          ประกาศไอคอนไว้ที่นี่ให้ครบทุกหน้า ไม่ใช่เฉพาะหน้าแรก
          Google จะเลือกไอคอนจากหน้าที่มันเก็บได้ ถ้าบางหน้าไม่ประกาศ
          มันอาจไปหยิบของที่เดาเอาเองหรือไม่เจอเลย
        */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" href="/favicon-new.png" sizes="512x512" />
        <link rel="apple-touch-icon" href="/favicon-new.png" />
      </Head>
      <body>
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${GOOGLE_TAG_MANAGER_ID}`}
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
