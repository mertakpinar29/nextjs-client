import { EditIcon, DeleteIcon } from "@chakra-ui/icons";
import { IconButton, Box, Link } from "@chakra-ui/react";
import NextLink from "next/link";
import React from "react";
import { useDeletePostMutation, useMeQuery } from "../generated/graphql";
import { isServer } from "../utils/isServer";

interface EditDeletePostButtonProps {
  id: number;
  creatorId: number;
}

export const EditDeletePostButton: React.FC<EditDeletePostButtonProps> = ({
  id,
  creatorId,
}) => {
  const [{ data }] = useMeQuery({ pause: isServer() });
  const [, deletePost] = useDeletePostMutation();
  if (data?.me?.id !== creatorId) {
    return null;
  }
  return (
    <Box>
      <NextLink href="/post/edit/[id]" as={`/post/edit/${id}`}>
        <IconButton
          as={Link}
          mr={4}
          colorScheme="blue"
          aria-label="edit"
          icon={<EditIcon />}
        ></IconButton>
      </NextLink>
      <IconButton
        colorScheme="red"
        aria-label="delete"
        onClick={() => {
          deletePost({ id });
        }}
        icon={<DeleteIcon />}
      ></IconButton>
    </Box>
  );
};
