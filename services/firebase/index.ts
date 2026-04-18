import {
    getAI,
    getGenerativeModel,
    GoogleAIBackend,
} from "@react-native-firebase/ai";
import analytics from "@react-native-firebase/analytics";
import firebase from "@react-native-firebase/app";
import auth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";
import messaging from "@react-native-firebase/messaging";
import storage from "@react-native-firebase/storage";

// Initialize Firebase AI Logic with the Gemini Developer API backend
const ai = getAI(firebase.app(), { backend: new GoogleAIBackend() });

/**
 * Create a generative model instance.
 * @example
 * const model = getModel('gemini-2.5-flash');
 * const result = await model.generateContent('Hello!');
 */
function getModel(modelName = "gemini-2.5-flash") {
  return getGenerativeModel(ai, { model: modelName });
}

export { analytics, auth, firebase, firestore, getModel, messaging, storage };
