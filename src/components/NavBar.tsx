import { Box, Flex, Link } from "@chakra-ui/react";
import React from "react";
import NextLink from "next/link";
import { useMeQuery } from "../generated/graphql";

interface NavBarProps {}

export const NavBar: React.FC<NavBarProps> = ({}) => {
  const [{ data, fetching }] = useMeQuery();
  let body = null;

  // executing query
  if (fetching) {
  }
  // user not logged in
  else if (!data?.me) {
  }
  // user logged in
  else {
  }
  return (
    <Flex bg="tomato" p={4} ml={"auto"}>
      <Box ml={"auto"}>
        <NextLink href="/login">
          <Link mr={2}>login</Link>
        </NextLink>
        <NextLink href="/register">
          <Link>register</Link>
        </NextLink>
      </Box>
    </Flex>
  );
};
