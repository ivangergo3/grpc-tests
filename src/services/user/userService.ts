import type * as grpc from "@grpc/grpc-js";
import type {
  GetUserRequest,
  GetUserResponse,
  SearchUsersRequest,
  SearchUsersResponse
} from "@gen/acme/user/v1/user_service";
import { UserServiceClient } from "@gen/acme/user/v1/user_service";

import { BaseGrpcService } from "@services/base";

import type {
  UserServiceStreamClient,
  ChannelCredentialsInput,
  GetUserParams,
  SearchUsersParams
} from "@services/types";

import {
  buildGetUserRequest,
  buildSearchUsersRequest,
  buildSearchUsersStreamRequest
} from "./userRequest";

export class UserServiceApi extends BaseGrpcService<UserServiceClient> {
  constructor(target: string, creds: ChannelCredentialsInput, options?: grpc.ClientOptions) {
    super(UserServiceClient, target, creds, options);
  }

  getUser(req: GetUserRequest, metadata?: grpc.Metadata): Promise<GetUserResponse> {
    const md = this.metadata(metadata);
    return this.unaryCall<GetUserResponse>((cb) => {
      return this.client.getUser(req, md, cb);
    });
  }

  /** Build request from params (base + child) */
  getUserWithParams(params: GetUserParams, metadata?: grpc.Metadata): Promise<GetUserResponse> {
    return this.getUser(buildGetUserRequest(params), metadata);
  }

  searchUsers(req: SearchUsersRequest, metadata?: grpc.Metadata): Promise<SearchUsersResponse> {
    const md = this.metadata(metadata);
    return this.unaryCall<SearchUsersResponse>((cb) => {
      return this.client.searchUsers(req, md, cb);
    });
  }

  /** Build request from params (base + child) */
  searchUsersWithParams(
    params: SearchUsersParams,
    metadata?: grpc.Metadata
  ): Promise<SearchUsersResponse> {
    return this.searchUsers(buildSearchUsersRequest(params), metadata);
  }

  /**
   * Server-streaming variant of SearchUsers, aggregated into a unary-like response.
   */
  searchUsersStream(
    req: SearchUsersRequest,
    metadata?: grpc.Metadata
  ): Promise<SearchUsersResponse> {
    const md = this.metadata(metadata);
    const streamClient = this.client as unknown as UserServiceStreamClient;

    return this.streamAggregate(
      () => streamClient.searchUsersStream(req, md, {}),
      (chunks) => ({
        users: this.pickDefined(chunks, (c) => c.user),
        context: this.last(chunks)?.context ?? req.context
      })
    );
  }

  /** Build request from params (base + child) */
  searchUsersStreamWithParams(
    params: SearchUsersParams,
    metadata?: grpc.Metadata
  ): Promise<SearchUsersResponse> {
    return this.searchUsersStream(buildSearchUsersStreamRequest(params), metadata);
  }
}
