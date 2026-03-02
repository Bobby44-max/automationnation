/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as actions_batchWeatherCheck from "../actions/batchWeatherCheck.js";
import type * as actions_runWeatherCheck from "../actions/runWeatherCheck.js";
import type * as actions_sendEmail from "../actions/sendEmail.js";
import type * as actions_sendNotifications from "../actions/sendNotifications.js";
import type * as actions_sendSms from "../actions/sendSms.js";
import type * as aifCompiler_workflows_index from "../aifCompiler/workflows/index.js";
import type * as crons from "../crons.js";
import type * as leads from "../leads.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_entitlements from "../lib/entitlements.js";
import type * as lib_notificationTemplates from "../lib/notificationTemplates.js";
import type * as lib_weatherApi from "../lib/weatherApi.js";
import type * as lib_weatherEngine from "../lib/weatherEngine.js";
import type * as seedData from "../seedData.js";
import type * as weatherScheduling from "../weatherScheduling.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "actions/batchWeatherCheck": typeof actions_batchWeatherCheck;
  "actions/runWeatherCheck": typeof actions_runWeatherCheck;
  "actions/sendEmail": typeof actions_sendEmail;
  "actions/sendNotifications": typeof actions_sendNotifications;
  "actions/sendSms": typeof actions_sendSms;
  "aifCompiler/workflows/index": typeof aifCompiler_workflows_index;
  crons: typeof crons;
  leads: typeof leads;
  "lib/auth": typeof lib_auth;
  "lib/entitlements": typeof lib_entitlements;
  "lib/notificationTemplates": typeof lib_notificationTemplates;
  "lib/weatherApi": typeof lib_weatherApi;
  "lib/weatherEngine": typeof lib_weatherEngine;
  seedData: typeof seedData;
  weatherScheduling: typeof weatherScheduling;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
