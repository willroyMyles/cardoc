"use strict";

const { getApps, initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore } = require("firebase-admin/firestore");
const { HttpsError, onCall } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");

if (getApps().length === 0) {
  initializeApp();
}

const db = getFirestore();

/**
 * Deletes the signed-in user's online Car Doc data.
 *
 * Callable payload:
 * {
 *   confirm: true,
 *   deleteAuthAccount?: boolean
 * }
 */
exports.deleteUserOnlineData = onCall(
  {
    region: "us-central1",
    timeoutSeconds: 120,
    memory: "512MiB",
  },
  async (request) => {
    const uid = request.auth && request.auth.uid;

    if (!uid) {
      throw new HttpsError(
        "unauthenticated",
        "Sign in before deleting online data.",
      );
    }

    const { confirm, deleteAuthAccount = false } = request.data || {};

    if (confirm !== true) {
      throw new HttpsError(
        "failed-precondition",
        "Pass confirm: true to permanently delete online data.",
      );
    }

    try {
      await db.recursiveDelete(db.collection("users").doc(uid));

      if (deleteAuthAccount === true) {
        await getAuth().deleteUser(uid);
      }

      logger.info("Deleted user online data", {
        uid,
        deleteAuthAccount: deleteAuthAccount === true,
      });

      return {
        deleted: true,
        deletedAuthAccount: deleteAuthAccount === true,
      };
    } catch (error) {
      logger.error("Failed to delete user online data", { uid, error });
      throw new HttpsError(
        "internal",
        "Unable to delete online data. Please try again later.",
      );
    }
  },
);
