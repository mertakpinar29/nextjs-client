import {
  dedupExchange,
  Exchange,
  fetchExchange,
  stringifyVariables,
} from "urql";
import { gql } from "@urql/core";
import { cacheExchange, Resolver, Cache } from "@urql/exchange-graphcache";
import {
  DeletePostMutationVariables,
  LoginMutation,
  LogoutMutation,
  MeDocument,
  MeQuery,
  RegisterMutation,
  VoteMutationVariables,
} from "../generated/graphql";
import { betterUpdateQuery } from "./betterUpdateQuery";
import { pipe, tap } from "wonka";
import Router from "next/router";
import { isServer } from "./isServer";

const errorExchange: Exchange =
  ({ forward }) =>
  (ops$) => {
    return pipe(
      forward(ops$),
      tap(({ error }) => {
        if (error) {
          if (error?.message.includes("Authentication required")) {
            Router.replace("/login");
          }
        }
      })
    );
  };

export const cursorPagination = (): Resolver => {
  return (_parent, fieldArgs, cache, info) => {
    /* 
       "fieldArgs is variables that is used for that operation"
       "parentKey" gives information about current operation
       "fieldName" is the name of the operation
    */
    const { parentKey: entityKey, fieldName } = info;
    // parentKey == Query, fieldName == posts
    /* Getting al Queries including Me query */
    const allFields = cache.inspectFields(entityKey);
    /* Get fields related to posts query */
    const fieldInfos = allFields.filter((info) => info.fieldName === fieldName);
    if (fieldInfos.length === 0) {
      return undefined;
    }

    // fieldKey = "posts({ limit: 10, cursor: null })"
    const fieldKey = `${fieldName}(${stringifyVariables(fieldArgs)})`;
    const isItInTheCache = cache.resolve(
      cache.resolve(entityKey, fieldKey) as string,
      "posts"
    );
    info.partial = !isItInTheCache;
    let hasMore = true;

    const results: string[] = [];
    fieldInfos.forEach((fi) => {
      // key is Query.posts({"limit":10})
      const key = cache.resolve(entityKey, fi.fieldKey) as string;
      const data = cache.resolve(key, "posts") as string[];
      const _hasMore = cache.resolve(key, "hasMore");
      if (!_hasMore) {
        hasMore = _hasMore as boolean;
      }
      results.push(...data);
    });

    return {
      __typename: "PaginatedPosts",
      hasMore,
      posts: results,
    };
  };
};

function invalidateAllPosts(cache: Cache) {
  const allFields = cache.inspectFields("Query");
  const fieldInfos = allFields.filter((info) => info.fieldName === "posts");
  fieldInfos.forEach((fi) => {
    cache.invalidate("Query", "posts", fi.arguments || {});
  });
}

export const createUrqlClient = (ssrExchange: any, ctx: any) => {
  let cookie = "";
  if (isServer()) {
    // sending cookie to next js and also from next js to graphql server
    cookie = ctx?.req?.headers?.cookie;
  }
  return {
    url: process.env.NEXT_PUBLIC_API_URL as string,
    exchanges: [
      dedupExchange,
      cacheExchange({
        keys: {
          PaginatedPosts: () => null,
        },
        resolvers: {
          Query: {
            posts: cursorPagination(),
          },
        },
        updates: {
          Mutation: {
            deletePost: (_result, args, cache, _info) => {
              cache.invalidate({
                __typename: "Post",
                id: (args as DeletePostMutationVariables).id,
              });
            },
            vote: (_result, args, cache, _info) => {
              const { postId, value } = args as VoteMutationVariables;
              const data = cache.readFragment(
                gql`
                  fragment _ on Post {
                    id
                    points
                    voteStatus
                  }
                `,
                { id: postId }
              );

              if (data) {
                if (data.voteStatus === value) {
                  return;
                }
                const newPoints =
                  (data.points as number) + (!data.voteStatus ? 1 : 2) * value;

                cache.writeFragment(
                  gql`
                    fragment __ on Post {
                      points
                      voteStatus
                    }
                  `,
                  { id: postId, points: newPoints, voteStatus: value }
                );
              }
            },
            createPost: (_result, _args, cache, _info) => {
              // cleans the cache for posts, refetches it
              invalidateAllPosts(cache);
            },
            logout: (_result: LogoutMutation, _args, cache, _info) => {
              betterUpdateQuery<LogoutMutation, MeQuery>(
                cache,
                { query: MeDocument },
                _result,
                (_result, _query) => ({ me: null })
              );
            },
            login: (_result: LoginMutation, _args, cache, _info) => {
              betterUpdateQuery<LoginMutation, MeQuery>(
                cache,
                { query: MeDocument },
                _result,
                (result, query) => {
                  if (result.login.errors) {
                    return query;
                  } else {
                    return {
                      me: result.login.user,
                    };
                  }
                }
              );
              invalidateAllPosts(cache);
            },

            register: (_result: RegisterMutation, _args, cache, _info) => {
              betterUpdateQuery<RegisterMutation, MeQuery>(
                cache,
                { query: MeDocument },
                _result,
                (result, query) => {
                  if (result.register.errors) {
                    return query;
                  } else {
                    return {
                      me: result.register.user,
                    };
                  }
                }
              );
            },
          },
        },
      }),
      errorExchange,
      ssrExchange,
      fetchExchange,
    ],
    fetchOptions: {
      credentials: "include" as const,
      headers: cookie && { cookie },
    },
  };
};
