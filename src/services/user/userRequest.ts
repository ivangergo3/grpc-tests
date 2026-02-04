import type { GetUserRequest, SearchUsersRequest } from "@gen/acme/user/v1/user_service";
import type { Pagination } from "@gen/acme/common/v1/common";
import { defaultBaseRequestFields, type BaseRequestFields } from "../baseRequest";

export type GetUserParams = BaseRequestFields & {
  userId: string;
  includeFields: string[];
};

export const buildGetUserRequest = (params: GetUserParams): GetUserRequest => {
  const base = defaultBaseRequestFields({
    context: params.context,
    actor: params.actor,
    headers: params.headers
  });
  return {
    userId: params.userId,
    includeFields: params.includeFields,
    context: base.context,
    actor: base.actor,
    headers: base.headers ?? {}
  };
};

export type SearchUsersParams = BaseRequestFields & {
  query: string;
  activeOnly: boolean;
  page?: Pagination;
};

export const buildSearchUsersRequest = (params: SearchUsersParams): SearchUsersRequest => {
  const base = defaultBaseRequestFields({
    context: params.context,
    actor: params.actor,
    headers: params.headers
  });
  return {
    query: params.query,
    activeOnly: params.activeOnly,
    page: params.page,
    context: base.context,
    actor: base.actor,
    headers: base.headers ?? {}
  };
};
