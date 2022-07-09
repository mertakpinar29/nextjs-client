import { ChakraProvider } from "@chakra-ui/react";

import theme from "../theme";
import { AppProps } from "next/app";
import { Provider, createClient } from "urql";

function MyApp({ Component, pageProps }: AppProps) {
  const client = createClient({
    url: "http://localhost:5000/graphql",
    fetchOptions: {
      credentials: "include",
    },
  });
  return (
    <Provider value={client}>
      <ChakraProvider theme={theme}>
        <Component {...pageProps} />
      </ChakraProvider>
    </Provider>
  );
}

export default MyApp;
