import type * as grpc from "@grpc/grpc-js";
import type {
  GetUserRequest,
  GetUserResponse,
  SearchUsersRequest,
  SearchUsersResponse
} from "@gen/acme/user/v1/user_service";
import { UserServiceClient } from "@gen/acme/user/v1/user_service";
import { BaseGrpcService, type unary_call_options } from "@services/base";

export class UserServiceApi extends BaseGrpcService<UserServiceClient> {
  constructor(target: string, creds: grpc.ChannelCredentials, options?: grpc.ClientOptions) {
    super(UserServiceClient, target, creds, options);
  }

  getUser(req: GetUserRequest, opts: unary_call_options = {}): Promise<GetUserResponse> {
    const metadata = this.metadata(opts);
    const callOpts = this.callOptions(opts);
    return this.unaryCall<GetUserResponse>((cb) => {
      if (callOpts) return this.client.getUser(req, metadata, callOpts, cb);
      return this.client.getUser(req, metadata, cb);
    });
  }

  searchUsers(
    req: SearchUsersRequest,
    opts: unary_call_options = {}
  ): Promise<SearchUsersResponse> {
    const metadata = this.metadata(opts);
    const callOpts = this.callOptions(opts);
    return this.unaryCall<SearchUsersResponse>((cb) => {
      if (callOpts) return this.client.searchUsers(req, metadata, callOpts, cb);
      return this.client.searchUsers(req, metadata, cb);
    });
  }
}
