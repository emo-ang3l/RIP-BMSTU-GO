/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

export interface TokenObtainPair {
  /**
   * Username
   * @minLength 1
   */
  username: string;
  /**
   * Password
   * @minLength 1
   */
  password: string;
}

export interface TokenRefresh {
  /**
   * Refresh
   * @minLength 1
   */
  refresh: string;
  /**
   * Access
   * @minLength 1
   */
  access?: string;
}

export interface InsulatorRequest {
  /** ID */
  id?: number;
  /** Status request */
  status_request?: InsulatorRequestStatusRequestEnum;
  /**
   * Creation datetime
   * @format date-time
   */
  creation_datetime?: string;
  /**
   * Formation datetime
   * @format date-time
   */
  formation_datetime?: string | null;
  /**
   * Completion datetime
   * @format date-time
   */
  completion_datetime?: string | null;
  /** Client username */
  client_username?: string;
  /** Manager username */
  manager_username?: string;
  /** Required r value */
  required_r_value?: number;
  /** Total thickness */
  total_thickness?: number | null;
  /** Insulators */
  insulators?: string;
}

export interface Insulator {
  /** ID */
  id?: number;
  /**
   * Insulator name
   * @minLength 1
   * @maxLength 255
   */
  insulator_name: string;
  /**
   * Insulator description
   * @minLength 1
   */
  insulator_description: string;
  /**
   * Image key
   * @minLength 1
   */
  image_key?: string | null;
  /** Image url */
  image_url?: string;
  /** Thermal conductivity */
  thermal_conductivity: number;
}

export interface User {
  /** ID */
  id?: number;
  /**
   * Username
   * Required. 150 characters or fewer. Letters, digits and @/./+/-/_ only.
   * @minLength 1
   * @maxLength 150
   * @pattern ^[\w.@+-]+$
   */
  username: string;
  /**
   * Email address
   * @format email
   * @maxLength 254
   */
  email?: string;
  /**
   * First name
   * @maxLength 150
   */
  first_name?: string;
  /**
   * Last name
   * @maxLength 150
   */
  last_name?: string;
  /**
   * Staff status
   * Designates whether the user can log into this admin site.
   */
  is_staff?: boolean;
}

/** Status request */
export type InsulatorRequestStatusRequestEnum =
  | "DRAFT"
  | "DELETED"
  | "FORMED"
  | "COMPLETED"
  | "REJECTED";

export interface AuthLoginCreatePayload {
  username: string;
  password: string;
}

export interface InsulatorrequestsReadParams {
  /** A unique integer value identifying this insulator request. */
  id: number;
}

export interface InsulatorrequestsUpdateParams {
  /** A unique integer value identifying this insulator request. */
  id: number;
}

export interface InsulatorrequestsPartialUpdateParams {
  /** A unique integer value identifying this insulator request. */
  id: number;
}

export interface InsulatorrequestsDeleteParams {
  /** A unique integer value identifying this insulator request. */
  id: number;
}

export interface InsulatorrequestsCompleteParams {
  /** A unique integer value identifying this insulator request. */
  id: number;
}

export interface InsulatorrequestsFormParams {
  /** A unique integer value identifying this insulator request. */
  id: number;
}

export interface InsulatorrequestsRemoveItemParams {
  /** A unique integer value identifying this insulator request. */
  id: number;
  insulatorId: string;
}

export interface InsulatorrequestsRejectParams {
  /** A unique integer value identifying this insulator request. */
  id: number;
}

export interface InsulatorsListParams {
  /** A search term. */
  search?: string;
  /** Which field to use when ordering the results. */
  ordering?: string;
}

export interface InsulatorsReadParams {
  /** A unique integer value identifying this insulator. */
  id: number;
}

export interface InsulatorsUpdateParams {
  /** A unique integer value identifying this insulator. */
  id: number;
}

export interface InsulatorsPartialUpdateParams {
  /** A unique integer value identifying this insulator. */
  id: number;
}

export interface InsulatorsDeleteParams {
  /** A unique integer value identifying this insulator. */
  id: number;
}

export interface InsulatorsAddToRequestParams {
  /** A unique integer value identifying this insulator. */
  id: number;
}


import type {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  HeadersDefaults,
  ResponseType,
} from "axios";
import axios from "axios";
import { API_BASE } from "./base";

export type QueryParamsType = Record<string | number, any>;

export interface FullRequestParams
  extends Omit<AxiosRequestConfig, "data" | "params" | "url" | "responseType"> {
  /** set parameter to `true` for call `securityWorker` for this request */
  secure?: boolean;
  /** request path */
  path: string;
  /** content type of request body */
  type?: ContentType;
  /** query params */
  query?: QueryParamsType;
  /** format of response (i.e. response.json() -> format: "json") */
  format?: ResponseType;
  /** request body */
  body?: unknown;
}

export type RequestParams = Omit<
  FullRequestParams,
  "body" | "method" | "query" | "path"
>;

export interface ApiConfig<SecurityDataType = unknown>
  extends Omit<AxiosRequestConfig, "data" | "cancelToken"> {
  securityWorker?: (
    securityData: SecurityDataType | null,
  ) => Promise<AxiosRequestConfig | void> | AxiosRequestConfig | void;
  secure?: boolean;
  format?: ResponseType;
}

export enum ContentType {
  Json = "application/json",
  JsonApi = "application/vnd.api+json",
  FormData = "multipart/form-data",
  UrlEncoded = "application/x-www-form-urlencoded",
  Text = "text/plain",
}

export class HttpClient<SecurityDataType = unknown> {
  public instance: AxiosInstance;
  private securityData: SecurityDataType | null = null;
  private securityWorker?: ApiConfig<SecurityDataType>["securityWorker"];
  private secure?: boolean;
  private format?: ResponseType;

  constructor({
    securityWorker,
    secure,
    format,
    ...axiosConfig
  }: ApiConfig<SecurityDataType> = {}) {
    this.instance = axios.create({
      ...axiosConfig,
      baseURL: axiosConfig.baseURL || `${API_BASE}/api`,
    });
    this.secure = secure;
    this.format = format;
    this.securityWorker = securityWorker;
  }

  public setSecurityData = (data: SecurityDataType | null) => {
    this.securityData = data;
  };

  protected mergeRequestParams(
    params1: AxiosRequestConfig,
    params2?: AxiosRequestConfig,
  ): AxiosRequestConfig {
    const method = params1.method || (params2 && params2.method);

    return {
      ...this.instance.defaults,
      ...params1,
      ...(params2 || {}),
      headers: {
        ...((method &&
          this.instance.defaults.headers[
            method.toLowerCase() as keyof HeadersDefaults
          ]) ||
          {}),
        ...(params1.headers || {}),
        ...((params2 && params2.headers) || {}),
      },
    };
  }

  protected stringifyFormItem(formItem: unknown) {
    if (typeof formItem === "object" && formItem !== null) {
      return JSON.stringify(formItem);
    } else {
      return `${formItem}`;
    }
  }

  protected createFormData(input: Record<string, unknown>): FormData {
    if (input instanceof FormData) {
      return input;
    }
    return Object.keys(input || {}).reduce((formData, key) => {
      const property = input[key];
      const propertyContent: any[] =
        property instanceof Array ? property : [property];

      for (const formItem of propertyContent) {
        const isFileType = formItem instanceof Blob || formItem instanceof File;
        formData.append(
          key,
          isFileType ? formItem : this.stringifyFormItem(formItem),
        );
      }

      return formData;
    }, new FormData());
  }

  public request = async <T = any, _E = any>({
    secure,
    path,
    type,
    query,
    format,
    body,
    ...params
  }: FullRequestParams): Promise<AxiosResponse<T>> => {
    const secureParams =
      ((typeof secure === "boolean" ? secure : this.secure) &&
        this.securityWorker &&
        (await this.securityWorker(this.securityData))) ||
      {};
    const requestParams = this.mergeRequestParams(params, secureParams);
    const responseFormat = format || this.format || undefined;

    if (
      type === ContentType.FormData &&
      body &&
      body !== null &&
      typeof body === "object"
    ) {
      body = this.createFormData(body as Record<string, unknown>);
    }

    if (
      type === ContentType.Text &&
      body &&
      body !== null &&
      typeof body !== "string"
    ) {
      body = JSON.stringify(body);
    }

    return this.instance.request({
      ...requestParams,
      headers: {
        ...(requestParams.headers || {}),
        ...(type ? { "Content-Type": type } : {}),
      },
      params: query,
      responseType: responseFormat,
      data: body,
      url: path,
    });
  };
}

/**
 * @title Insulation API
 * @version v1
 * @license BSD License
 * @termsOfService https://www.google.com/policies/terms/
 * @baseUrl http://localhost:8000/api
 * @contact <contact@insulation.local>
 *
 * API for insulation calculator with authentication, requests, and insulators management.
 */
export class Api<SecurityDataType extends unknown> {
  http: HttpClient<SecurityDataType>;

  constructor(http: HttpClient<SecurityDataType>) {
    this.http = http;
  }

  auth = {
    /**
 * No description
 *
 * @tags auth
 * @name AuthLoginCreate
 * @request POST:/auth/login/
 * @secure
 * @response `200` `{
    refresh?: string,
    access?: string,
    sessionid?: string,

}`
 * @response `400` `void` Invalid credentials
 */
    authLoginCreate: (
      data: AuthLoginCreatePayload,
      params: RequestParams = {},
    ) =>
      this.http.request<
        {
          refresh?: string;
          access?: string;
          sessionid?: string;
        },
        void
      >({
        path: `/auth/login/`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags auth
     * @name AuthLogoutCreate
     * @request POST:/auth/logout/
     * @secure
     * @response `201` `void`
     */
    authLogoutCreate: (params: RequestParams = {}) =>
      this.http.request<void, any>({
        path: `/auth/logout/`,
        method: "POST",
        secure: true,
        ...params,
      }),

    /**
     * @description Takes a set of user credentials and returns an access and refresh JSON web token pair to prove the authentication of those credentials.
     *
     * @tags auth
     * @name AuthTokenCreate
     * @request POST:/auth/token/
     * @secure
     * @response `201` `TokenObtainPair`
     */
    authTokenCreate: (data: TokenObtainPair, params: RequestParams = {}) =>
      this.http.request<TokenObtainPair, any>({
        path: `/auth/token/`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Takes a refresh type JSON web token and returns an access type JSON web token if the refresh token is valid.
     *
     * @tags auth
     * @name AuthTokenRefreshCreate
     * @request POST:/auth/token/refresh/
     * @secure
     * @response `201` `TokenRefresh`
     */
    authTokenRefreshCreate: (data: TokenRefresh, params: RequestParams = {}) =>
      this.http.request<TokenRefresh, any>({
        path: `/auth/token/refresh/`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),
  };
  insulatorrequests = {
    /**
     * No description
     *
     * @tags insulatorrequests
     * @name InsulatorrequestsList
     * @request GET:/insulatorrequests/
     * @secure
     * @response `200` `(InsulatorRequest)[]`
     */
    insulatorrequestsList: (params: RequestParams = {}) =>
      this.http.request<InsulatorRequest[], any>({
        path: `/insulatorrequests/`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags insulatorrequests
     * @name InsulatorrequestsCreate
     * @request POST:/insulatorrequests/
     * @secure
     * @response `201` `InsulatorRequest`
     */
    insulatorrequestsCreate: (
      data: InsulatorRequest,
      params: RequestParams = {},
    ) =>
      this.http.request<InsulatorRequest, any>({
        path: `/insulatorrequests/`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags insulatorrequests
     * @name InsulatorrequestsCartIcon
     * @request GET:/insulatorrequests/cart-icon/
     * @secure
     * @response `200` `(InsulatorRequest)[]`
     */
    insulatorrequestsCartIcon: (params: RequestParams = {}) =>
      this.http.request<InsulatorRequest[], any>({
        path: `/insulatorrequests/cart-icon/`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags insulatorrequests
     * @name InsulatorrequestsRead
     * @request GET:/insulatorrequests/{id}/
     * @secure
     * @response `200` `InsulatorRequest`
     */
    insulatorrequestsRead: (
      { id, ...query }: InsulatorrequestsReadParams,
      params: RequestParams = {},
    ) =>
      this.http.request<InsulatorRequest, any>({
        path: `/insulatorrequests/${id}/`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags insulatorrequests
     * @name InsulatorrequestsUpdate
     * @request PUT:/insulatorrequests/{id}/
     * @secure
     * @response `200` `InsulatorRequest`
     */
    insulatorrequestsUpdate: (
      { id, ...query }: InsulatorrequestsUpdateParams,
      data: InsulatorRequest,
      params: RequestParams = {},
    ) =>
      this.http.request<InsulatorRequest, any>({
        path: `/insulatorrequests/${id}/`,
        method: "PUT",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags insulatorrequests
     * @name InsulatorrequestsPartialUpdate
     * @request PATCH:/insulatorrequests/{id}/
     * @secure
     * @response `200` `InsulatorRequest`
     */
    insulatorrequestsPartialUpdate: (
      { id, ...query }: InsulatorrequestsPartialUpdateParams,
      data: InsulatorRequest,
      params: RequestParams = {},
    ) =>
      this.http.request<InsulatorRequest, any>({
        path: `/insulatorrequests/${id}/`,
        method: "PATCH",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags insulatorrequests
     * @name InsulatorrequestsDelete
     * @request DELETE:/insulatorrequests/{id}/
     * @secure
     * @response `204` `void`
     */
    insulatorrequestsDelete: (
      { id, ...query }: InsulatorrequestsDeleteParams,
      params: RequestParams = {},
    ) =>
      this.http.request<void, any>({
        path: `/insulatorrequests/${id}/`,
        method: "DELETE",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags insulatorrequests
     * @name InsulatorrequestsComplete
     * @request PUT:/insulatorrequests/{id}/complete/
     * @secure
     * @response `200` `InsulatorRequest`
     */
    insulatorrequestsComplete: (
      { id, ...query }: InsulatorrequestsCompleteParams,
      data: InsulatorRequest,
      params: RequestParams = {},
    ) =>
      this.http.request<InsulatorRequest, any>({
        path: `/insulatorrequests/${id}/complete/`,
        method: "PUT",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags insulatorrequests
     * @name InsulatorrequestsForm
     * @request PUT:/insulatorrequests/{id}/form/
     * @secure
     * @response `200` `InsulatorRequest`
     */
    insulatorrequestsForm: (
      { id, ...query }: InsulatorrequestsFormParams,
      data: InsulatorRequest,
      params: RequestParams = {},
    ) =>
      this.http.request<InsulatorRequest, any>({
        path: `/insulatorrequests/${id}/form/`,
        method: "PUT",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags insulatorrequests
     * @name InsulatorrequestsRemoveItem
     * @request DELETE:/insulatorrequests/{id}/items/{insulator_id}/
     * @secure
     * @response `204` `void`
     */
    insulatorrequestsRemoveItem: (
      { id, insulatorId, ...query }: InsulatorrequestsRemoveItemParams,
      params: RequestParams = {},
    ) =>
      this.http.request<void, any>({
        path: `/insulatorrequests/${id}/items/${insulatorId}/`,
        method: "DELETE",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags insulatorrequests
     * @name InsulatorrequestsReject
     * @request PUT:/insulatorrequests/{id}/reject/
     * @secure
     * @response `200` `InsulatorRequest`
     */
    insulatorrequestsReject: (
      { id, ...query }: InsulatorrequestsRejectParams,
      data: InsulatorRequest,
      params: RequestParams = {},
    ) =>
      this.http.request<InsulatorRequest, any>({
        path: `/insulatorrequests/${id}/reject/`,
        method: "PUT",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),
  };
  insulators = {
    /**
     * No description
     *
     * @tags insulators
     * @name InsulatorsList
     * @request GET:/insulators/
     * @secure
     * @response `200` `(Insulator)[]`
     */
    insulatorsList: (query: InsulatorsListParams, params: RequestParams = {}) =>
      this.http.request<Insulator[], any>({
        path: `/insulators/`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags insulators
     * @name InsulatorsCreate
     * @request POST:/insulators/
     * @secure
     * @response `201` `Insulator`
     */
    insulatorsCreate: (data: Insulator, params: RequestParams = {}) =>
      this.http.request<Insulator, any>({
        path: `/insulators/`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags insulators
     * @name InsulatorsRead
     * @request GET:/insulators/{id}/
     * @secure
     * @response `200` `Insulator`
     */
    insulatorsRead: (
      { id, ...query }: InsulatorsReadParams,
      params: RequestParams = {},
    ) =>
      this.http.request<Insulator, any>({
        path: `/insulators/${id}/`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags insulators
     * @name InsulatorsUpdate
     * @request PUT:/insulators/{id}/
     * @secure
     * @response `200` `Insulator`
     */
    insulatorsUpdate: (
      { id, ...query }: InsulatorsUpdateParams,
      data: Insulator,
      params: RequestParams = {},
    ) =>
      this.http.request<Insulator, any>({
        path: `/insulators/${id}/`,
        method: "PUT",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags insulators
     * @name InsulatorsPartialUpdate
     * @request PATCH:/insulators/{id}/
     * @secure
     * @response `200` `Insulator`
     */
    insulatorsPartialUpdate: (
      { id, ...query }: InsulatorsPartialUpdateParams,
      data: Insulator,
      params: RequestParams = {},
    ) =>
      this.http.request<Insulator, any>({
        path: `/insulators/${id}/`,
        method: "PATCH",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags insulators
     * @name InsulatorsDelete
     * @request DELETE:/insulators/{id}/
     * @secure
     * @response `204` `void`
     */
    insulatorsDelete: (
      { id, ...query }: InsulatorsDeleteParams,
      params: RequestParams = {},
    ) =>
      this.http.request<void, any>({
        path: `/insulators/${id}/`,
        method: "DELETE",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags insulators
     * @name InsulatorsAddToRequest
     * @request POST:/insulators/{id}/add-to-request/
     * @secure
     * @response `201` `Insulator`
     */
    insulatorsAddToRequest: (
      { id, ...query }: InsulatorsAddToRequestParams,
      data: Insulator,
      params: RequestParams = {},
    ) =>
      this.http.request<Insulator, any>({
        path: `/insulators/${id}/add-to-request/`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

  };
  users = {
    /**
     * No description
     *
     * @tags users
     * @name UsersMeRead
     * @request GET:/users/me/
     * @secure
     * @response `200` `(User)[]`
     */
    usersMeRead: (params: RequestParams = {}) =>
      this.http.request<User[], any>({
        path: `/users/me/`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags users
     * @name UsersMeUpdate
     * @request PUT:/users/me/
     * @secure
     * @response `200` `User`
     */
    usersMeUpdate: (data: User, params: RequestParams = {}) =>
      this.http.request<User, any>({
        path: `/users/me/`,
        method: "PUT",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags users
     * @name UsersRegister
     * @request POST:/users/register/
     * @secure
     * @response `201` `User`
     */
    usersRegister: (data: User, params: RequestParams = {}) =>
      this.http.request<User, any>({
        path: `/users/register/`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),
  };
}
