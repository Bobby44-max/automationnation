"use node";

import { action, internalAction } from "../_generated/server";
import { v } from "convex/values";
import { api } from "../_generated/api";
import { encrypt, decrypt } from "../lib/encryption";
import { Id } from "../_generated/dataModel";

interface DecryptedCredentials {
  serviceName: string;
  apiKey: string;
  apiSecret: string | undefined;
  status: string;
}

/**
 * Connect an integration with encrypted credentials.
 *
 * This action encrypts API keys before storing them in the database.
 * Replaces the direct connectIntegration mutation for secure credential handling.
 *
 * Called by the frontend integrations page.
 */
export const connectIntegrationSecure = action({
  args: {
    businessId: v.id("businesses"),
    serviceName: v.string(),
    apiKey: v.string(),
    apiSecret: v.optional(v.string()),
  },
  handler: async (
    ctx,
    { businessId, serviceName, apiKey, apiSecret }
  ): Promise<Id<"integrations">> => {
    // Encrypt credentials before storing
    const encryptedKey = encrypt(apiKey);
    const encryptedSecret = apiSecret ? encrypt(apiSecret) : undefined;

    // Store via the existing mutation (now receives encrypted values)
    const id: Id<"integrations"> = await ctx.runMutation(
      api.weatherScheduling.connectIntegration,
      {
        businessId,
        serviceName,
        apiKey: encryptedKey,
        apiSecret: encryptedSecret,
      }
    );

    return id;
  },
});

/**
 * Get decrypted credentials for a specific integration.
 *
 * Internal action — only callable from other Convex functions, not from the client.
 * Used by CRM sync actions that need the actual API keys to make external calls.
 */
export const getDecryptedCredentials = internalAction({
  args: {
    businessId: v.id("businesses"),
    serviceName: v.string(),
  },
  handler: async (
    ctx,
    { businessId, serviceName }
  ): Promise<DecryptedCredentials | null> => {
    // Fetch the integration record
    const integrations: Array<{
      serviceName: string;
      apiKey: string;
      apiSecret?: string;
      status: string;
    }> = await ctx.runQuery(api.weatherScheduling.getIntegrations, {
      businessId,
    });

    const integration = integrations?.find(
      (i) => i.serviceName === serviceName
    );

    if (!integration) {
      return null;
    }

    // Decrypt credentials
    try {
      return {
        serviceName: integration.serviceName,
        apiKey: decrypt(integration.apiKey),
        apiSecret: integration.apiSecret
          ? decrypt(integration.apiSecret)
          : undefined,
        status: integration.status,
      };
    } catch (err) {
      console.error(
        `Failed to decrypt credentials for ${serviceName}: ${(err as Error).message}`
      );
      return null;
    }
  },
});
