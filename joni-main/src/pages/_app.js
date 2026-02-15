import CustomCursor from "@/components/CustomCursors";
import Header from "@/components/Header";
import { AuthProvider } from "@/context/AuthContext";
import { GetStartedModalProvider } from "@/context/GetStartedModalContext";
import "@/styles/app.scss";
import Head from "next/head";
import { useEffect } from "react";


export default function App({ Component, pageProps }) {
  useEffect(() => {
    import("bootstrap/dist/js/bootstrap.bundle.min");
  }, []);

  return (
    <AuthProvider>
    <GetStartedModalProvider>
      <Head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1"
        />
        {/* <link rel="canonical" href="" /> */}
        <meta
          name="description"
          content="Joni"
        />
        <meta property="og:title" content="Joni" />
        <meta
          property="og:description"
          content="Joni"
        />
        {/* <meta property="og:url" content="" /> */}
        {/* <meta property="og:type" content="website" /> */}
        {/* <meta
          property="og:image"
          content=""
        /> */}
        <title>Joni</title>


      </Head>
      <Header />
      <CustomCursor />
      <Component {...pageProps} />
    </GetStartedModalProvider>
    </AuthProvider>
  );
}
