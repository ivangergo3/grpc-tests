import type { GetUserRequest, SearchUsersRequest } from "@gen/acme/user/v1/user_service";
import { buildBaseRequestFields, withDefaults } from "@services/base";
import type { GetUserParams, SearchUsersParams } from "../types";

export const buildGetUserRequest = (overrides: Partial<GetUserParams> = {}): GetUserRequest => {
  const params = withDefaults<GetUserParams>(
    {
      userId: "123",
      includeFields: [],
      context: undefined,
      actor: undefined,
      headers: undefined
    },
    overrides
  );
  const base = buildBaseRequestFields(params);
  return {
    userId: params.userId ?? "123",
    includeFields: params.includeFields ?? [],
    context: base.context,
    actor: base.actor,
    headers: base.headers
  };
};

export const buildSearchUsersRequest = (
  overrides: Partial<SearchUsersParams> = {}
): SearchUsersRequest => {
  const params = withDefaults<SearchUsersParams>(
    {
      query: "",
      activeOnly: true,
      page: { pageSize: 10, pageToken: "" },
      context: undefined,
      actor: undefined,
      headers: undefined
    },
    overrides
  );
  const base = buildBaseRequestFields(params);
  return {
    query: params.query ?? "",
    activeOnly: params.activeOnly ?? true,
    page: params.page,
    context: base.context,
    actor: base.actor,
    headers: base.headers
  };
};

export const buildSearchUsersStreamRequest = buildSearchUsersRequest;
