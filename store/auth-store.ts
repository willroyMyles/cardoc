import auth, { type FirebaseAuthTypes } from "@react-native-firebase/auth";
import { create } from "zustand";

interface AuthState {
  user: FirebaseAuthTypes.User | null;
  loading: boolean;
  initialized: boolean;
  setUser: (user: FirebaseAuthTypes.User | null) => void;
  setLoading: (loading: boolean) => void;
  /** Subscribe to Firebase auth state. Returns the unsubscribe function. */
  initialize: () => () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: false,
  initialized: false,
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
  initialize: () => {
    const unsubscribe = auth().onAuthStateChanged((user) => {
      set({ user, initialized: true });
    });
    return unsubscribe;
  },
}));
